const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ServiceUser = require('../models/ServiceUser');
const ServiceOtp = require('../models/ServiceOtp');
const Notification = require('../models/Notification');
const { sanitizeCoordinates } = require('../utils/geoUtils');
const { uploadDocument } = require('../services/serviceUploadService');
const { sendOtpEmail } = require('../services/serviceNotificationService');

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

// Secure OTP hashing helper using SHA-256 + secret salt
const hashOtp = (otp) => {
  return crypto
    .createHash('sha256')
    .update(String(otp).trim() + (process.env.JWT_SECRET || 'service_otp_salt'))
    .digest('hex');
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

    console.log(`[SERVICE OTP - REGISTER] Generated for ${cleanEmail}: ${otp}`);

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

    // Basic Validations
    if (!name || !email || !mobile || !password || !role || !subRole) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, mobile, password, role, and objective.'
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

    if (hashOtp(cleanOtp) !== otpDoc.otpHash) {
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

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
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
      const loc = typeof location === 'string' ? JSON.parse(location) : location;
      parsedLocation.address = (loc.address || '').trim();
      parsedLocation.city = (loc.city || '').trim();
      parsedLocation.state = (loc.state || '').trim();
      parsedLocation.pincode = (loc.pincode || '').trim();
      if (loc.coordinates) {
        parsedLocation.coordinates = sanitizeCoordinates(loc.coordinates);
      }
    }

    let parsedPharmacy = {};
    let parsedPharmacist = {};
    let parsedDoctor = {};

    if (role === 'pharmacy_owner' && pharmacyDetails) {
      parsedPharmacy = typeof pharmacyDetails === 'string' ? JSON.parse(pharmacyDetails) : pharmacyDetails;
    }

    if ((role === 'job_seeker_pharmacist' || role === 'pharmacy_owner') && pharmacistDetails) {
      parsedPharmacist = typeof pharmacistDetails === 'string' ? JSON.parse(pharmacistDetails) : pharmacistDetails;
    }

    if (role === 'doctor' && doctorDetails) {
      parsedDoctor = typeof doctorDetails === 'string' ? JSON.parse(doctorDetails) : doctorDetails;
    }

    // Check if a document was uploaded
    if (req.file) {
      const uploadedDoc = await uploadDocument(req.file);
      if (role === 'pharmacy_owner') {
        parsedPharmacy.licenseImage = uploadedDoc.url;
      } else if (role === 'job_seeker_pharmacist') {
        parsedPharmacist.licenseImage = uploadedDoc.url;
      }
    }

    const newUser = new ServiceUser({
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password,
      role,
      subRole,
      pharmacyDetails: parsedPharmacy,
      pharmacistDetails: parsedPharmacist,
      doctorDetails: parsedDoctor,
      location: parsedLocation,
      isOpenToWork: role === 'job_seeker_pharmacist',
      isOpenToCollaborate: role === 'doctor'
    });

    await newUser.save();

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
    res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
};

/**
 * Step 1: Sign in with credentials -> triggers 6-digit OTP to user's email
 * POST /api/services/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/mobile and password.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const user = await ServiceUser.findOne({
      $or: [{ email: cleanId }, { mobile: identifier.trim() }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Account not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Account access has been restricted by administration.',
        reason: user.blockReason || 'Terms of service violation.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // Cooldown check for OTP spamming
    const recentOtp = await ServiceOtp.findOne({ email: user.email, purpose: 'login' });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      return res.json({
        success: true,
        requireOtp: true,
        email: maskEmail(user.email),
        identifier: cleanId,
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

    console.log(`[SERVICE OTP - LOGIN] Generated for ${user.email}: ${otp}`);

    res.json({
      success: true,
      requireOtp: true,
      email: maskEmail(user.email),
      identifier: cleanId,
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
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Please provide identifier and verification code.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanOtp = String(otp).replace(/\D/g, '').trim();

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    const user = await ServiceUser.findOne({
      $or: [{ email: cleanId }, { mobile: identifier.trim() }]
    });

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

    if (hashOtp(cleanOtp) !== otpDoc.otpHash) {
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
 * Resend OTP (for Register or Login)
 * POST /api/services/auth/resend-otp
 */
exports.resendOtp = async (req, res) => {
  try {
    const { identifier, email, purpose, name } = req.body;
    const targetPurpose = purpose === 'register' ? 'register' : 'login';

    let targetEmail = '';
    let targetName = name || '';

    if (targetPurpose === 'login') {
      const cleanId = String(identifier || email).trim().toLowerCase();
      const user = await ServiceUser.findOne({
        $or: [{ email: cleanId }, { mobile: String(identifier || email).trim() }]
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      targetEmail = user.email;
      targetName = user.name;
    } else {
      targetEmail = String(email || identifier).toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(targetEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
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

    console.log(`[SERVICE OTP - RESEND] Sent to ${targetEmail} for ${targetPurpose}: ${otp}`);

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

    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();

    if (location) {
      if (location.address !== undefined) user.location.address = location.address;
      if (location.city !== undefined) user.location.city = location.city;
      if (location.state !== undefined) user.location.state = location.state;
      if (location.pincode !== undefined) user.location.pincode = location.pincode;
      if (location.coordinates) {
        user.location.coordinates = sanitizeCoordinates(location.coordinates);
      }
    }

    if (pharmacyDetails && user.role === 'pharmacy_owner') {
      user.pharmacyDetails = { ...user.pharmacyDetails, ...pharmacyDetails };
    }

    if (pharmacistDetails && (user.role === 'job_seeker_pharmacist' || user.role === 'pharmacy_owner')) {
      user.pharmacistDetails = { ...user.pharmacistDetails, ...pharmacistDetails };
    }

    if (doctorDetails && user.role === 'doctor') {
      user.doctorDetails = { ...user.doctorDetails, ...doctorDetails };
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
    res.status(500).json({ message: error.message });
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
