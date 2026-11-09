const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ServiceUser = require('../models/ServiceUser');
const ServiceOtp = require('../models/ServiceOtp');
const Notification = require('../models/Notification');
const { sanitizeCoordinates } = require('../utils/geoUtils');
const { uploadDocument } = require('../services/serviceUploadService');
const { sendOtpEmail, announceDoctorRegistration } = require('../services/serviceNotificationService');
const { hashSecret, safeEqual, cleanText } = require('../utils/security');

// Helper to sign JWT token (strictly expires in 24 hours)
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      type: 'service_user'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Clean user response - never expose password or confidential fields
const formatUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// Keyed OTP digest + constant-time comparison (never store or compare codes in plain text)
const hashOtp = (otp) => hashSecret(otp);
const otpMatches = (otp, digest) => safeEqual(hashOtp(otp), digest);

// Short-lived proof that the password step succeeded. The login OTP can only be
// verified (or resent) together with this token, so an OTP alone never grants access.
const LOGIN_CHALLENGE_TTL = '10m';
const signLoginChallenge = (user) =>
  jwt.sign({ id: user._id, type: 'login_challenge' }, process.env.JWT_SECRET, {
    expiresIn: LOGIN_CHALLENGE_TTL
  });
const readLoginChallenge = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.type === 'login_challenge' ? decoded : null;
  } catch {
    return null;
  }
};

const safeParse = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const ROLE_SUBROLES = {
  pharmacy_owner: ['hire_pharmacist', 'collab_doctor'],
  job_seeker_pharmacist: ['work_in_pharmacy'],
  doctor: ['doctor_collab'],
  general_user: ['general_access']
};

// Mask email for privacy (e.g. a***y@gmail.com)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
};

/**
 * Send OTP for Registration
 * POST /api/services/auth/send-register-otp
 */
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: 'Name, email, and mobile number are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanMobile = String(mobile).replace(/\D/g, '').trim();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        message: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.'
      });
    }

    const existingEmail = await ServiceUser.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    const existingMobile = await ServiceUser.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(409).json({ message: 'An account with this mobile number already exists.' });
    }

    // Anti-spam cooldown: Check if unexpired OTP was requested less than 60 seconds ago
    const recentOtp = await ServiceOtp.findOne({ email: cleanEmail, purpose: 'register' });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      const remainingSeconds = Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`
      });
    }

    // Generate crypto-secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);

    // Save hashed OTP with 10-minute expiry
    await ServiceOtp.deleteMany({ email: cleanEmail, purpose: 'register' });
    await ServiceOtp.create({
      email: cleanEmail,
      otpHash,
      purpose: 'register',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send verification email
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: 'register',
      userName: name.trim()
    });

    res.json({
      success: true,
      message: 'Verification code sent to your email.'
    });
  } catch (error) {
    console.error('Send Register OTP Error:', error);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
};

/**
 * Register a new Service User (Requires verified OTP)
 * POST /api/services/auth/register
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role,
      subRole,
      otp,
      pharmacyDetails,
      pharmacistDetails,
      doctorDetails,
      location
    } = req.body;

    const userRole = ROLE_SUBROLES[role] ? role : 'general_user';
    const userSubRole = ROLE_SUBROLES[userRole].includes(subRole) ? subRole : ROLE_SUBROLES[userRole][0];

    // Basic Validations
    if (!name || !email || !mobile || !password || !userRole || !userSubRole) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, mobile, and password.'
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: 'Please provide the 6-digit verification code sent to your email.'
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanMobile = String(mobile).replace(/\D/g, '').trim();
    const cleanOtp = String(otp).replace(/\D/g, '').trim();

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        message: 'Mobile number must be a valid 10-digit number (starting with 6, 7, 8, or 9).'
      });
    }

    // Verify OTP
    const otpDoc = await ServiceOtp.findOne({ email: cleanEmail, purpose: 'register' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Verification code has expired or was not requested. Please request a new code.'
      });
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await ServiceOtp.deleteMany({ email: cleanEmail, purpose: 'register' });
      return res.status(400).json({
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    if (!otpMatches(cleanOtp, otpDoc.otpHash)) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = otpDoc.maxAttempts - otpDoc.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Please request a new code.'}`
      });
    }

    // OTP Verified successfully - Delete OTP record
    await ServiceOtp.deleteMany({ email: cleanEmail, purpose: 'register' });

    // Verify duplicate email / mobile
    const existingEmail = await ServiceUser.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    const existingMobile = await ServiceUser.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(409).json({ message: 'An account with this mobile number already exists.' });
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      return res.status(400).json({ message: 'Password must be between 6 and 100 characters long.' });
    }

    // Parse location & coordinates
    let parsedLocation = {
      address: '',
      city: '',
      state: '',
      pincode: '',
      type: 'Point',
      coordinates: [77.1025, 28.7041]
    };

    if (location) {
      const loc = safeParse(location);
      parsedLocation.address = cleanText(loc.address, 200);
      parsedLocation.city = cleanText(loc.city, 60);
      parsedLocation.state = cleanText(loc.state, 60);
      parsedLocation.pincode = cleanText(loc.pincode, 10);
      if (loc.coordinates) {
        parsedLocation.coordinates = sanitizeCoordinates(loc.coordinates);
      }
    }

    let parsedPharmacy = {};
    let parsedPharmacist = {};
    let parsedDoctor = {};

    // Whitelist profile fields - document URLs can only come from our own upload below
    if (userRole === 'pharmacy_owner' && pharmacyDetails) {
      const p = safeParse(pharmacyDetails);
      parsedPharmacy = {
        pharmacyName: cleanText(p.pharmacyName, 120),
        licenseNumber: cleanText(p.licenseNumber, 60),
        contactPerson: cleanText(p.contactPerson, 80),
        openingHours: cleanText(p.openingHours, 80),
        establishedYear: Number(p.establishedYear) || undefined
      };
    }

    if ((userRole === 'job_seeker_pharmacist' || userRole === 'pharmacy_owner') && pharmacistDetails) {
      const p = safeParse(pharmacistDetails);
      const quals = ['D.Pharm', 'B.Pharm', 'M.Pharm', 'Pharm.D', 'Other'];
      parsedPharmacist = {
        qualification: quals.includes(p.qualification) ? p.qualification : 'B.Pharm',
        licenseNumber: cleanText(p.licenseNumber, 60),
        experienceYears: Math.max(0, Math.min(50, Number(p.experienceYears) || 0)),
        expectedSalary: cleanText(p.expectedSalary, 60),
        skills: Array.isArray(p.skills) ? p.skills.slice(0, 20).map((x) => cleanText(x, 40)).filter(Boolean) : [],
        bio: cleanText(p.bio, 1000)
      };
    }

    if (userRole === 'doctor' && doctorDetails) {
      const d = safeParse(doctorDetails);
      parsedDoctor = {
        specialization: cleanText(d.specialization, 80),
        medicalRegistrationNumber: cleanText(d.medicalRegistrationNumber, 60),
        qualification: cleanText(d.qualification, 60),
        experienceYears: Math.max(0, Math.min(60, Number(d.experienceYears) || 0)),
        currentAffiliation: cleanText(d.currentAffiliation, 120),
        consultationFee: Number(d.consultationFee) || undefined,
        about: cleanText(d.about, 1000)
      };
    }

    // Check if a document was uploaded
    if (req.file) {
      const uploadedDoc = await uploadDocument(req.file);
      if (userRole === 'pharmacy_owner') {
        parsedPharmacy.licenseImage = uploadedDoc.url;
      } else if (userRole === 'job_seeker_pharmacist') {
        parsedPharmacist.licenseImage = uploadedDoc.url;
      }
    }

    const newUser = new ServiceUser({
      name: cleanText(name, 100),
      email: cleanEmail,
      mobile: cleanMobile,
      password,
      role: userRole,
      subRole: userSubRole,
      pharmacyDetails: parsedPharmacy,
      pharmacistDetails: parsedPharmacist,
      doctorDetails: parsedDoctor,
      location: parsedLocation,
      isOpenToWork: userRole === 'job_seeker_pharmacist',
      isOpenToCollaborate: userRole === 'doctor'
    });

    await newUser.save();

    if (newUser.role === 'doctor') {
      announceDoctorRegistration(newUser).catch((err) => console.error('Doctor registration email error:', err));
    }

    const token = signToken(newUser);

    res.status(201).json({
      message: 'Account registered and verified successfully.',
      token,
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Service User Registration Error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email or mobile number already registered.' });
    }
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Step 1: Sign in with credentials -> triggers 6-digit OTP to user's email
 * POST /api/services/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({ message: 'Please provide email/mobile and password.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = await ServiceUser.findOne({
      $or: [{ email: cleanId }, { mobile: identifier.replace(/\D/g, '') || '__none__' }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your details.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Account access has been restricted by administration.',
        reason: user.blockReason || 'Terms of service violation.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your details.' });
    }

    const challengeToken = signLoginChallenge(user);

    // Cooldown check for OTP spamming
    const recentOtp = await ServiceOtp.findOne({ email: user.email, purpose: 'login' });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      return res.json({
        success: true,
        requireOtp: true,
        email: maskEmail(user.email),
        identifier: cleanId,
        challengeToken,
        message: `Verification code already sent. Please wait ${waitSec}s if you need to resend.`
      });
    }

    // Generate secure 6-digit numeric OTP for sign in
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);

    await ServiceOtp.deleteMany({ email: user.email, purpose: 'login' });
    await ServiceOtp.create({
      email: user.email,
      otpHash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpEmail({
      to: user.email,
      otp,
      purpose: 'login',
      userName: user.name
    });

    res.json({
      success: true,
      requireOtp: true,
      email: maskEmail(user.email),
      identifier: cleanId,
      challengeToken,
      message: 'Verification code sent to your registered email.'
    });
  } catch (error) {
    console.error('Service User Login Error:', error);
    res.status(500).json({ message: 'Server error during sign in.' });
  }
};

/**
 * Step 2: Verify Login OTP and issue 24-hour token
 * POST /api/services/auth/verify-login-otp
 */
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { otp, challengeToken } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'Please provide the verification code.' });
    }

    // The OTP is only valid together with proof that the password step succeeded
    const challenge = readLoginChallenge(challengeToken);
    if (!challenge) {
      return res.status(401).json({ message: 'Sign-in session expired. Please enter your password again.' });
    }

    const cleanOtp = String(otp).replace(/\D/g, '').trim();

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    const user = await ServiceUser.findById(challenge.id);

    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Account access has been restricted by administration.',
        reason: user.blockReason || 'Terms of service violation.'
      });
    }

    const otpDoc = await ServiceOtp.findOne({ email: user.email, purpose: 'login' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Verification code has expired or was not requested. Please request a new code.'
      });
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await ServiceOtp.deleteMany({ email: user.email, purpose: 'login' });
      return res.status(400).json({
        message: 'Maximum verification attempts exceeded. Please sign in again to request a new code.'
      });
    }

    if (!otpMatches(cleanOtp, otpDoc.otpHash)) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = otpDoc.maxAttempts - otpDoc.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Please sign in again.'}`
      });
    }

    // OTP Verified successfully!
    await ServiceOtp.deleteMany({ email: user.email, purpose: 'login' });

    const token = signToken(user);

    res.json({
      message: 'Signed in successfully.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Verify Login OTP Error:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

/**
 * Resend OTP (for Register, Login, or Forgot Password)
 * POST /api/services/auth/resend-otp
 */
exports.resendOtp = async (req, res) => {
  try {
    const { identifier, email, purpose, name, challengeToken } = req.body;
    const targetPurpose = ['register', 'login', 'forgot_password'].includes(purpose)
      ? purpose
      : 'login';

    let targetEmail = '';
    let targetName = typeof name === 'string' ? name.slice(0, 80) : '';

    if (targetPurpose === 'login') {
      // Login codes can only be resent by someone who already passed the password step
      const challenge = readLoginChallenge(challengeToken);
      const user = challenge ? await ServiceUser.findById(challenge.id) : null;
      if (!user) {
        return res.status(401).json({ message: 'Sign-in session expired. Please enter your password again.' });
      }
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Account access has been restricted by administration.' });
      }
      targetEmail = user.email;
      targetName = user.name;
    } else if (targetPurpose === 'forgot_password') {
      const cleanId = String(identifier || email).trim().toLowerCase();
      const cleanMobile = String(identifier || email).replace(/\D/g, '');
      const user = await ServiceUser.findOne({
        $or: [
          { email: cleanId },
          ...(cleanMobile.length === 10 ? [{ mobile: cleanMobile }] : [])
        ]
      });

      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists, a new verification code has been sent.'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          message: 'Account access has been restricted by administration.',
          reason: user.blockReason || 'Terms of service violation.'
        });
      }

      targetEmail = user.email;
      targetName = user.name;
    } else {
      targetEmail = String(email || identifier || '').toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(targetEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }
      if (await ServiceUser.exists({ email: targetEmail })) {
        return res.status(409).json({ message: 'An account with this email address already exists.' });
      }
    }

    // Cooldown check (60 seconds)
    const recentOtp = await ServiceOtp.findOne({ email: targetEmail, purpose: targetPurpose });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before requesting a new code.`
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);

    await ServiceOtp.deleteMany({ email: targetEmail, purpose: targetPurpose });
    await ServiceOtp.create({
      email: targetEmail,
      otpHash,
      purpose: targetPurpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpEmail({
      to: targetEmail,
      otp,
      purpose: targetPurpose,
      userName: targetName
    });

    res.json({
      success: true,
      message: 'New verification code sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Failed to resend verification code.' });
  }
};

/**
 * Request Password Reset OTP
 * POST /api/services/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ message: 'Please provide your registered email or mobile number.' });
    }

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      return res.status(400).json({ message: 'Please provide your registered email or mobile number.' });
    }

    const cleanId = cleanInput.toLowerCase();
    const cleanMobile = cleanInput.replace(/\D/g, '');

    const user = await ServiceUser.findOne({
      $or: [
        { email: cleanId },
        ...(cleanMobile.length === 10 ? [{ mobile: cleanMobile }] : [])
      ]
    });

    // Timing-safe generic response to prevent enumeration
    if (!user) {
      return res.json({
        success: true,
        email: cleanId.includes('@') ? maskEmail(cleanId) : '',
        message: 'If an account exists with this credential, a password reset code has been sent to the registered email.'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Account access has been restricted by administration.',
        reason: user.blockReason || 'Terms of service violation.'
      });
    }

    // Cooldown check (60s minimum interval)
    const recentOtp = await ServiceOtp.findOne({ email: user.email, purpose: 'forgot_password' });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before requesting a new code.`,
        email: maskEmail(user.email)
      });
    }

    // Generate crypto-secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);

    // Save with 10-minute expiry
    await ServiceOtp.deleteMany({ email: user.email, purpose: 'forgot_password' });
    await ServiceOtp.create({
      email: user.email,
      otpHash,
      purpose: 'forgot_password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpEmail({
      to: user.email,
      otp,
      purpose: 'forgot_password',
      userName: user.name
    });

    res.json({
      success: true,
      email: maskEmail(user.email),
      message: `Password reset verification code sent to ${maskEmail(user.email)}.`
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Failed to process password reset request. Please try again.' });
  }
};

/**
 * Verify OTP & Reset Password
 * POST /api/services/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, email, otp, newPassword } = req.body;

    const rawId = String(email || identifier || '').trim();
    if (!rawId) {
      return res.status(400).json({ message: 'Registered email or mobile number is required.' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Please provide the 6-digit verification code.' });
    }

    const cleanOtp = String(otp).replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (newPassword.length > 100) {
      return res.status(400).json({ message: 'Password cannot exceed 100 characters.' });
    }

    const cleanId = rawId.toLowerCase();
    const cleanMobile = rawId.replace(/\D/g, '');

    const user = await ServiceUser.findOne({
      $or: [
        { email: cleanId },
        ...(cleanMobile.length === 10 ? [{ mobile: cleanMobile }] : [])
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid request or account not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Account access has been restricted by administration.',
        reason: user.blockReason || 'Terms of service violation.'
      });
    }

    // Verify OTP from ServiceOtp
    const otpDoc = await ServiceOtp.findOne({ email: user.email, purpose: 'forgot_password' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Verification code has expired or was not requested. Please request a new code.'
      });
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await ServiceOtp.deleteMany({ email: user.email, purpose: 'forgot_password' });
      return res.status(400).json({
        message: 'Maximum verification attempts exceeded. Please request a new password reset code.'
      });
    }

    if (!otpMatches(cleanOtp, otpDoc.otpHash)) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = otpDoc.maxAttempts - otpDoc.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Please request a new code.'}`
      });
    }

    // OTP Verified! Single-use: delete OTP record immediately
    await ServiceOtp.deleteMany({ email: user.email, purpose: 'forgot_password' });

    // Set new password (pre('save') hook in ServiceUser hashes with bcrypt)
    user.password = newPassword;
    await user.save();

    console.log(`[SERVICE AUTH - PASSWORD RESET] Password successfully reset for: ${user.email}`);

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

/**
 * Get current profile
 * GET /api/services/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.serviceUser._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Profile
 * PUT /api/services/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.serviceUser._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name,
      mobile,
      pharmacyDetails,
      pharmacistDetails,
      doctorDetails,
      location
    } = req.body;

    if (name) user.name = String(name).trim().slice(0, 80);
    if (mobile) {
      const nextMobile = String(mobile).replace(/\D/g, '').slice(0, 10);
      if (nextMobile !== user.mobile) {
        if (!/^[6-9]\d{9}$/.test(nextMobile)) {
          return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number.' });
        }
        if (await ServiceUser.exists({ mobile: nextMobile, _id: { $ne: user._id } })) {
          return res.status(409).json({ message: 'This mobile number is already linked to another account.' });
        }
        user.mobile = nextMobile;
      }
    }

    if (location) {
      if (location.address !== undefined) user.location.address = String(location.address).trim().slice(0, 200);
      if (location.city !== undefined) user.location.city = String(location.city).trim().slice(0, 60);
      if (location.state !== undefined) user.location.state = String(location.state).trim().slice(0, 60);
      if (location.pincode !== undefined) user.location.pincode = String(location.pincode).trim().slice(0, 10);
      if (location.coordinates) {
        user.location.coordinates = sanitizeCoordinates(location.coordinates);
      }
    }

    if (pharmacyDetails && user.role === 'pharmacy_owner') {
      user.pharmacyDetails = {
        ...user.pharmacyDetails,
        pharmacyName: pharmacyDetails.pharmacyName !== undefined ? String(pharmacyDetails.pharmacyName).trim().slice(0, 120) : user.pharmacyDetails?.pharmacyName,
        licenseNumber: pharmacyDetails.licenseNumber !== undefined ? String(pharmacyDetails.licenseNumber).trim().slice(0, 60) : user.pharmacyDetails?.licenseNumber
      };
    }

    if (pharmacistDetails && (user.role === 'job_seeker_pharmacist' || user.role === 'pharmacy_owner')) {
      user.pharmacistDetails = {
        ...user.pharmacistDetails,
        qualification: pharmacistDetails.qualification !== undefined ? String(pharmacistDetails.qualification).trim().slice(0, 60) : user.pharmacistDetails?.qualification,
        licenseNumber: pharmacistDetails.licenseNumber !== undefined ? String(pharmacistDetails.licenseNumber).trim().slice(0, 60) : user.pharmacistDetails?.licenseNumber,
        experienceYears: pharmacistDetails.experienceYears !== undefined ? Math.max(0, Math.min(50, Number(pharmacistDetails.experienceYears) || 0)) : user.pharmacistDetails?.experienceYears
      };
    }

    if (doctorDetails && user.role === 'doctor') {
      user.doctorDetails = {
        ...user.doctorDetails,
        specialization: doctorDetails.specialization !== undefined ? String(doctorDetails.specialization).trim().slice(0, 80) : user.doctorDetails?.specialization,
        qualification: doctorDetails.qualification !== undefined ? String(doctorDetails.qualification).trim().slice(0, 60) : user.doctorDetails?.qualification,
        medicalRegistrationNumber: doctorDetails.medicalRegistrationNumber !== undefined ? String(doctorDetails.medicalRegistrationNumber).trim().slice(0, 60) : user.doctorDetails?.medicalRegistrationNumber,
        experienceYears: doctorDetails.experienceYears !== undefined ? Math.max(0, Math.min(60, Number(doctorDetails.experienceYears) || 0)) : user.doctorDetails?.experienceYears
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle Open to Work or Open to Collaborate
 * PATCH /api/services/auth/toggle-availability
 */
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.serviceUser._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'job_seeker_pharmacist') {
      user.isOpenToWork = !user.isOpenToWork;
      await user.save();
      return res.json({
        message: `Status updated to ${user.isOpenToWork ? 'Open to Work' : 'Not Seeking Employment'}.`,
        isOpenToWork: user.isOpenToWork
      });
    }

    if (user.role === 'doctor') {
      user.isOpenToCollaborate = !user.isOpenToCollaborate;
      await user.save();
      return res.json({
        message: `Status updated to ${user.isOpenToCollaborate ? 'Open to Collaborate' : 'Not Accepting Collaborations'}.`,
        isOpenToCollaborate: user.isOpenToCollaborate
      });
    }

    res.status(400).json({ message: 'Availability toggle is only applicable for Pharmacists and Doctors.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Upload document or license
 * POST /api/services/upload
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const result = await uploadDocument(req.file);
    res.status(201).json(result);
  } catch (error) {
    // Validation failures (wrong/disguised file type) are the client's to fix
    const isValidation = /does not match|Invalid document format|No file provided/i.test(error.message || '');
    res.status(isValidation ? 400 : 500).json({ message: isValidation ? error.message : 'Upload failed. Please try again.' });
  }
};

/**
 * Get Notifications for authenticated user
 * GET /api/services/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.serviceUser._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.serviceUser._id,
      isRead: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/services/notifications/:id/read
 */
exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.serviceUser._id },
      { isRead: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/services/notifications/read-all
 */
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.serviceUser._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
