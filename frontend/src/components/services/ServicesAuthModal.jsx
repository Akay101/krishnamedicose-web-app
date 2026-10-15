import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Briefcase,
  Stethoscope,
  Upload,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Lock,
  Mail,
  Phone,
  User,
  KeyRound,
  Clock,
  RefreshCw
} from 'lucide-react';
import servicesApi from '../../utils/servicesApi';
import LocationPicker from './LocationPicker';

export default function ServicesAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'register',
  initialRole = null,
  initialSubRole = null,
  t = {},
  lang
}) {
  // Mode can be 'intent', 'intent_sub', 'register', 'verify_register_otp', 'login', or 'verify_login_otp'
  const [step, setStep] = useState(initialMode === 'login' ? 'login' : 'intent');
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [selectedSubRole, setSelectedSubRole] = useState(initialSubRole);

  // OTP & 24h Session verification states
  const [otp, setOtp] = useState('');
  const [otpSentEmail, setOtpSentEmail] = useState('');
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'login') {
        setStep('login');
      } else if (initialRole) {
        setSelectedRole(initialRole);
        setSelectedSubRole(initialSubRole);
        setStep('register');
      } else {
        setSelectedRole(null);
        setSelectedSubRole(null);
        setStep('intent');
      }
      setError('');
      setOtp('');
    }
  }, [isOpen, initialMode, initialRole, initialSubRole]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownSeconds]);

  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    // Pharmacy details
    pharmacyName: '',
    pharmacyLicenseNumber: '',
    // Pharmacist qualifications
    qualification: 'B.Pharm',
    experienceYears: '2',
    pharmacistLicenseNumber: '',
    // Doctor details
    specialization: 'General Physician',
    medicalRegistrationNumber: '',
    doctorQualification: 'MBBS',
    doctorExperienceYears: '5',
    // Location
    location: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: [77.1025, 28.7041]
    }
  });

  const [licenseFile, setLicenseFile] = useState(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Loading and Error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Handle Intent Selection
  const handleSelectPrimaryIntent = (role) => {
    setError('');
    setSelectedRole(role);
    if (role === 'pharmacy_owner') {
      setStep('intent_sub');
    } else if (role === 'job_seeker_pharmacist') {
      setSelectedSubRole('work_in_pharmacy');
      setStep('register');
    } else if (role === 'doctor') {
      setSelectedSubRole('doctor_collab');
      setStep('register');
    }
  };

  const handleSelectSubIntent = (subRole) => {
    setSelectedSubRole(subRole);
    setStep('register');
  };

  // Handle License file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('File size must be under 8 MB.');
        return;
      }
      setLicenseFile(file);
    }
  };

  // Step 1 of Registration: Validate details and send email OTP
  const handleRequestRegisterOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Strict 10-digit mobile check
    const cleanMobile = formData.mobile.replace(/\D/g, '').trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError(t.errMobile10Digits || 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }

    if (!formData.name.trim()) {
      setError(t.errRequired || 'Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError(t.errEmailInvalid || 'Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError(t.errPasswordShort || 'Password must be at least 6 characters.');
      return;
    }

    if (!formData.location.city || !formData.location.address) {
      setError(t.errRequired || 'Please enter your address and city.');
      return;
    }

    // Role-specific field validation
    if (selectedRole === 'pharmacy_owner' && !formData.pharmacyName.trim()) {
      setError(t.errRequired || 'Please enter your pharmacy name.');
      return;
    }
    if (selectedRole === 'doctor' && (!formData.specialization.trim() || !formData.doctorQualification.trim())) {
      setError(t.errRequired || 'Please enter your specialization and degree.');
      return;
    }

    setLoading(true);

    try {
      await servicesApi.post('/auth/send-register-otp', {
        email: formData.email.trim(),
        mobile: cleanMobile,
        name: formData.name.trim()
      });

      setOtpSentEmail(formData.email.trim());
      setOtp('');
      setCooldownSeconds(60);
      setStep('verify_register_otp');
    } catch (err) {
      console.error('Failed to send register OTP:', err);
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Registration: Submit form data along with verified OTP
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const cleanMobile = formData.mobile.replace(/\D/g, '').trim();
      const postPayload = new FormData();
      postPayload.append('name', formData.name.trim());
      postPayload.append('email', formData.email.trim());
      postPayload.append('mobile', cleanMobile);
      postPayload.append('password', formData.password);
      postPayload.append('otp', cleanOtp);
      postPayload.append('role', selectedRole);
      postPayload.append('subRole', selectedSubRole);
      postPayload.append('location', JSON.stringify(formData.location));

      if (selectedRole === 'pharmacy_owner') {
        postPayload.append(
          'pharmacyDetails',
          JSON.stringify({
            pharmacyName: formData.pharmacyName.trim() || formData.name.trim(),
            licenseNumber: formData.pharmacyLicenseNumber.trim()
          })
        );
      } else if (selectedRole === 'job_seeker_pharmacist') {
        postPayload.append(
          'pharmacistDetails',
          JSON.stringify({
            qualification: formData.qualification,
            experienceYears: Number(formData.experienceYears) || 0,
            licenseNumber: formData.pharmacistLicenseNumber.trim()
          })
        );
      } else if (selectedRole === 'doctor') {
        postPayload.append(
          'doctorDetails',
          JSON.stringify({
            specialization: formData.specialization.trim(),
            medicalRegistrationNumber: formData.medicalRegistrationNumber.trim(),
            qualification: formData.doctorQualification.trim(),
            experienceYears: Number(formData.doctorExperienceYears) || 0
          })
        );
      }

      if (licenseFile) {
        postPayload.append('licenseFile', licenseFile);
      }

      const res = await servicesApi.post('/auth/register', postPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.token) {
        localStorage.setItem('service_token', res.data.token);
        localStorage.setItem('service_user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('service_auth_change'));
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of Login: Check credentials and trigger 6-digit email OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await servicesApi.post('/auth/login', {
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });

      if (res.data?.requireOtp) {
        setOtpSentEmail(res.data.email || loginIdentifier.trim());
        setPendingIdentifier(res.data.identifier || loginIdentifier.trim());
        setCooldownSeconds(60);
        setOtp('');
        setStep('verify_login_otp');
      } else if (res.data?.token) {
        localStorage.setItem('service_token', res.data.token);
        localStorage.setItem('service_user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('service_auth_change'));
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Login: Verify OTP and issue 24-hour session token
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await servicesApi.post('/auth/verify-login-otp', {
        identifier: pendingIdentifier,
        otp: cleanOtp
      });

      if (res.data?.token) {
        localStorage.setItem('service_token', res.data.token);
        localStorage.setItem('service_user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('service_auth_change'));
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler with 60-second cooldown
  const handleResendOtp = async (purpose) => {
    if (cooldownSeconds > 0 || resendingOtp) return;
    setError('');
    setResendingOtp(true);

    try {
      const targetEmail = purpose === 'register' ? formData.email.trim() : pendingIdentifier;
      await servicesApi.post('/auth/resend-otp', {
        email: targetEmail,
        purpose
      });
      setCooldownSeconds(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please wait before trying again.');
    } finally {
      setResendingOtp(false);
    }
  };

  const getHeaderTitle = () => {
    if (step === 'login') return t.signInBtn || 'Sign In';
    if (step === 'verify_login_otp' || step === 'verify_register_otp') return t.enterOtp || 'Enter Verification Code';
    return t.siteTitle || 'Find Jobs & Doctors';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit">
                {getHeaderTitle()}
              </h2>
              <p className="text-xs text-teal-100">{t.siteSubtitle || 'Pharmacy Staffing & Doctor Network'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: WHO ARE YOU ================= */}
          {step === 'intent' && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5 mb-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                  {t.whoAreYou || 'Who are you?'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {t.chooseGoal || 'Please select what describes you best to continue:'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Option 1: Pharmacy Owner */}
                <button
                  type="button"
                  onClick={() => handleSelectPrimaryIntent('pharmacy_owner')}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-teal-600 bg-white hover:bg-teal-50/40 transition-all flex items-start gap-4 sm:gap-5 group shadow-sm hover:shadow-md"
                >
                  <div className="p-3.5 bg-teal-100 text-teal-700 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 leading-snug">
                        {t.opt1Title || '1. I am a pharmacist and own a pharmacy'}
                      </h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold group-hover:bg-teal-600 group-hover:text-white flex-shrink-0 transition-colors">
                        {t.select || 'Select'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {t.opt1Desc || 'Hire staff pharmacists for your shop or find doctors to consult at your clinic chamber.'}
                    </p>
                  </div>
                </button>

                {/* Option 2: Pharmacist Job Seeker */}
                <button
                  type="button"
                  onClick={() => handleSelectPrimaryIntent('job_seeker_pharmacist')}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-sky-600 bg-white hover:bg-sky-50/40 transition-all flex items-start gap-4 sm:gap-5 group shadow-sm hover:shadow-md"
                >
                  <div className="p-3.5 bg-sky-100 text-sky-700 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-700 leading-snug">
                        {t.opt2Title || '2. I am a pharmacist looking for a job'}
                      </h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold group-hover:bg-sky-600 group-hover:text-white flex-shrink-0 transition-colors">
                        {t.select || 'Select'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {t.opt2Desc || 'Find pharmacy jobs near your home, view salaries, and apply directly.'}
                    </p>
                  </div>
                </button>

                {/* Option 3: Doctor */}
                <button
                  type="button"
                  onClick={() => handleSelectPrimaryIntent('doctor')}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 transition-all flex items-start gap-4 sm:gap-5 group shadow-sm hover:shadow-md"
                >
                  <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 leading-snug">
                        {t.opt3Title || '3. I am a doctor looking for a clinic or pharmacy'}
                      </h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold group-hover:bg-emerald-600 group-hover:text-white flex-shrink-0 transition-colors">
                        {t.select || 'Select'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {t.opt3Desc || 'Find clinics and pharmacies looking for doctors to consult with patients.'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Toggle to Sign In */}
              <div className="pt-6 mt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('login');
                  }}
                  className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 underline py-1"
                >
                  {t.alreadyRegistered || 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 1.1: OWNER SUB-INTENT ================= */}
          {step === 'intent_sub' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setStep('intent')}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> {t.back || 'Back'}
              </button>

              <div className="text-center space-y-1.5 mb-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                  {t.ownerGoalQuestion || 'What would you like to do?'}
                </h3>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleSelectSubIntent('hire_pharmacist')}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-teal-600 bg-white hover:bg-teal-50/40 transition-all flex items-start gap-4 sm:gap-5 group shadow-sm hover:shadow-md"
                >
                  <div className="p-3.5 bg-teal-100 text-teal-700 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 leading-snug">
                      {t.ownerSub1 || 'Option 1: Hire a pharmacist for your pharmacy'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {t.ownerSub1Desc || 'Post job vacancies with salary and timings. See pharmacists available in your area.'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubIntent('collab_doctor')}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 transition-all flex items-start gap-4 sm:gap-5 group shadow-sm hover:shadow-md"
                >
                  <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 leading-snug">
                      {t.ownerSub2 || 'Option 2: Connect with a doctor for consultation'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {t.ownerSub2Desc || 'List your chamber setup, preferred doctor specialization, and timings.'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: REGISTRATION FORM ================= */}
          {step === 'register' && (
            <form onSubmit={handleRequestRegisterOtp} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(selectedRole === 'pharmacy_owner' ? 'intent_sub' : 'intent')}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  <ArrowLeft className="w-4 h-4" /> {t.back || 'Back'}
                </button>
                <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 rounded-full">
                  {selectedRole === 'pharmacy_owner' && (t.pharmacyOwner || 'Pharmacy Owner')}
                  {selectedRole === 'job_seeker_pharmacist' && (t.pharmacist || 'Pharmacist')}
                  {selectedRole === 'doctor' && (t.doctor || 'Doctor')}
                </span>
              </div>

              {/* Basic Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.personalDetails || 'Personal Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.fullName || 'Full Name'} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t.fullNamePlaceholder || 'Enter your name'}
                        className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={60}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {t.mobileNumber || 'Mobile Number'} *
                      </label>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {formData.mobile.replace(/\D/g, '').length} / 10 digits
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, mobile: digitsOnly });
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.emailAddress || 'Email Address'} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={80}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.password || 'Password'} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="At least 6 characters"
                        className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Credentials */}
              {selectedRole === 'pharmacy_owner' && (
                <div className="space-y-4 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.pharmacyDetails || 'Pharmacy Details'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.pharmacyName || 'Pharmacy Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pharmacyName}
                        onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                        placeholder="e.g. Krishna Medicos"
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={80}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.drugLicenseNumber || 'Drug License Number'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pharmacyLicenseNumber}
                        onChange={(e) => setFormData({ ...formData, pharmacyLicenseNumber: e.target.value })}
                        placeholder="e.g. DL-12345"
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={40}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.uploadLicense || 'Upload Drug License (Photo or PDF)'}
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                    {licenseFile && (
                      <p className="text-xs text-teal-700 font-semibold mt-1.5">
                        Selected: {licenseFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedRole === 'job_seeker_pharmacist' && (
                <div className="space-y-4 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.pharmacistDetails || 'Pharmacist Details'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.degreeQualification || 'Degree'} *
                      </label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors bg-white"
                      >
                        <option value="D.Pharm">D.Pharm (Diploma)</option>
                        <option value="B.Pharm">B.Pharm (Bachelor)</option>
                        <option value="M.Pharm">M.Pharm (Master)</option>
                        <option value="Pharm.D">Pharm.D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.experienceYears || 'Experience (Years)'} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        required
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.councilRegNumber || 'Pharmacy Council Registration Number'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pharmacistLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, pharmacistLicenseNumber: e.target.value })}
                      placeholder="e.g. PCI/REG/2022/12345"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.uploadCertificate || 'Upload Degree or Registration Certificate'}
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                    />
                    {licenseFile && (
                      <p className="text-xs text-sky-700 font-semibold mt-1.5">
                        Selected: {licenseFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedRole === 'doctor' && (
                <div className="space-y-4 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.doctorDetails || 'Doctor Details'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.specialization || 'Specialization'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g. General Physician, Pediatrician"
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.medicalDegree || 'Medical Degree'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.doctorQualification}
                        onChange={(e) => setFormData({ ...formData, doctorQualification: e.target.value })}
                        placeholder="e.g. MBBS, MD"
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.medicalRegNumber || 'Medical Council Reg. Number'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.medicalRegistrationNumber}
                        onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value })}
                        placeholder="e.g. MCI-12345"
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                        maxLength={40}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.clinicalExperience || 'Experience (Years)'} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        required
                        value={formData.doctorExperienceYears}
                        onChange={(e) => setFormData({ ...formData, doctorExperienceYears: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Production-grade Location Picker Component */}
              <div className="pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {t.locationSection || 'Your Location'}
                </h4>
                <LocationPicker
                  value={formData.location}
                  onChange={(newLoc) => setFormData({ ...formData, location: newLoc })}
                  t={t}
                  lang={lang}
                  showMapPreview={true}
                />
              </div>

              {/* Submit */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t.alreadyRegistered || 'Already registered? Sign In'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.sendingOtp || 'Sending Code...'}</span>
                    </>
                  ) : (
                    <span>{t.sendOtp || 'Send Verification Code'}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: LOGIN FORM ================= */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center space-y-1.5 mb-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                  {t.signInBtn || 'Sign In'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Enter your registered mobile number or email address
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.emailAddress || 'Email'} or {t.mobileNumber || 'Mobile Number'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 9876543210 or name@mail.com"
                      className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      maxLength={80}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.password || 'Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.sendingOtp || 'Sending Code...'}</span>
                  </>
                ) : (
                  <span>{t.signInBtn || 'Sign In'}</span>
                )}
              </button>

              <div className="pt-6 mt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('intent');
                  }}
                  className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 underline py-1"
                >
                  {t.newHere || 'New here? Register Account'}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2.5 & 3.5: OTP VERIFICATION ================= */}
          {(step === 'verify_register_otp' || step === 'verify_login_otp') && (
            <form
              onSubmit={step === 'verify_register_otp' ? handleVerifyRegisterOtp : handleVerifyLoginOtp}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step === 'verify_register_otp' ? 'register' : 'login');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {step === 'verify_register_otp' ? (t.backToEdit || 'Back to Edit Details') : (t.backToLogin || 'Back to Sign In')}
                </button>
                <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  24h Secure Session
                </span>
              </div>

              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl mx-auto flex items-center justify-center text-teal-700 shadow-sm">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 font-outfit">
                  {t.enterOtp || 'Enter Verification Code'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  {t.otpSentTo || 'A 6-digit code has been sent to'}{' '}
                  <span className="font-bold text-slate-800 block mt-0.5">{otpSentEmail}</span>
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="------"
                    className="w-full h-14 text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50 focus:bg-white transition-all shadow-inner"
                  />
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    {t.otpNotice || 'For your security, a 6-digit verification code is required.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.verifying || 'Verifying...'}</span>
                    </>
                  ) : (
                    <span>
                      {step === 'verify_register_otp'
                        ? (t.verifyAndRegister || 'Verify & Complete Registration')
                        : (t.verifyAndSignIn || 'Verify & Sign In')}
                    </span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  {cooldownSeconds > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {t.resendIn || 'Resend in'} {cooldownSeconds}{t.seconds || 's'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={resendingOtp}
                      onClick={() => handleResendOtp(step === 'verify_register_otp' ? 'register' : 'login')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                      {resendingOtp ? (t.sendingOtp || 'Sending Code...') : (t.resendOtp || 'Resend Code')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
