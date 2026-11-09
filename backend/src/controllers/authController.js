const User = require("../models/User");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailService");
const { randomNumericCode, hashSecret, safeEqual } = require("../utils/security");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // "strict" keeps the refresh cookie away from every cross-site request (CSRF-safe).
  // Only relax via COOKIE_SAMESITE=none if the admin UI and API are on different sites.
  sameSite: process.env.COOKIE_SAMESITE === "none" && isProduction ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, type: "admin_access", tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, type: "admin_refresh", tv: user.tokenVersion || 0 },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  permissions: user.permissions,
  name: user.name,
});

// Verify a password-reset OTP, counting failed attempts against the account
const checkResetOtp = async (user, otp) => {
  if (!user || !user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
    return { ok: false, message: "Invalid or expired OTP" };
  }
  if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return { ok: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }
  if (!safeEqual(hashSecret(otp), user.otp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    return { ok: false, message: "Invalid or expired OTP" };
  }
  return { ok: true };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password must be valid strings" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated. Contact Admin." });
    }

    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      console.error("JWT secrets missing in environment configuration");
      return res.status(500).json({ message: "Server authentication error" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("refreshToken", signRefreshToken(user), refreshCookieOptions);

    res.json({
      token: signAccessToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during sign in" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string")
      return res.status(401).json({ message: "Refresh token missing" });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (decoded.type !== "admin_refresh") {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Refresh is only honoured for active accounts whose sessions have not been revoked
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || (user.tokenVersion || 0) !== (decoded.tv || 0)) {
      res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
      return res.status(403).json({ message: "Session revoked" });
    }

    // Rotate the refresh token on every use
    res.cookie("refreshToken", signRefreshToken(user), refreshCookieOptions);
    res.json({ token: signAccessToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to refresh session" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
  res.json({ message: "Logged out successfully" });
};

exports.forgotPassword = async (req, res) => {
  const genericResponse = { message: "If this email is registered, an OTP has been sent." };
  try {
    const { email } = req.body;
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Valid email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Same response whether or not the account exists (no account enumeration)
    if (!user || !user.isActive) {
      return res.json(genericResponse);
    }

    const otp = randomNumericCode(6);
    user.otp = hashSecret(otp);
    user.otpExpires = Date.now() + OTP_TTL_MS;
    user.otpAttempts = 0;
    await user.save();

    await emailService.sendOTPEmail(normalizedEmail, otp);
    res.json(genericResponse);
  } catch (error) {
    console.error("Admin forgot password error:", error);
    res.status(500).json({ message: "Unable to process request right now" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (typeof email !== "string" || typeof otp !== "string") {
      return res.status(400).json({ message: "Email and OTP must be valid strings" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const result = await checkResetOtp(user, otp.trim());
    if (!result.ok) return res.status(400).json({ message: result.message });

    res.json({ message: "OTP verified success" });
  } catch (error) {
    res.status(500).json({ message: "Unable to verify OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (typeof email !== "string" || typeof otp !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input parameters" });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters long" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const result = await checkResetOtp(user, otp.trim());
    if (!result.ok) return res.status(400).json({ message: result.message });

    user.password = password;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    // Invalidate every existing session for this account
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to reset password" });
  }
};
