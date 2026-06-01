import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../utils/api';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200/80 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-20"
            >
              <X className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
            </button>

            <div className="p-8 lg:p-12">
              {success ? (
                <div className="text-center py-6 lg:py-8">
                  <div className="w-16 lg:w-20 h-16 lg:h-20 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 lg:w-10 h-8 lg:h-10 text-teal-600 animate-pulse" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold font-outfit mb-4 text-slate-900">Password Reset!</h2>
                  <p className="text-xs lg:text-sm text-slate-500 font-bold">Your password has been updated. Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold font-outfit mb-2 text-slate-900">
                      {step === 1 && "Forgot Password?"}
                      {step === 2 && "Enter OTP"}
                      {step === 3 && "New Password"}
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-500 leading-relaxed font-bold">
                      {step === 1 && "No worries, we'll send you recovery instructions."}
                      {step === 2 && `We've sent a 6-digit code to ${email}`}
                      {step === 3 && "Create a secure new password for your account."}
                    </p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-bold"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <input
                          required
                          type="email"
                          placeholder="Admin Email"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4 lg:py-4 rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 group font-black uppercase text-[11px] tracking-widest shadow-lg shadow-teal-500/20 transition-transform active:scale-95">
                        {loading ? "Sending..." : "Send Reset Code"}
                        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div className="relative group">
                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <input
                          required
                          type="text"
                          maxLength="6"
                          placeholder="6-Digit OTP"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-xl lg:text-2xl text-center tracking-[0.5em]"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4 lg:py-4 rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-teal-500/20 transition-transform active:scale-95">
                        {loading ? "Verifying..." : "Verify OTP"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="w-full text-xs font-bold text-slate-500 hover:text-teal-650 transition-colors italic"
                      >
                        Change Email Address
                      </button>
                    </form>
                  )}

                  {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <input
                          required
                          type="password"
                          placeholder="New Password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        <input
                          required
                          type="password"
                          placeholder="Confirm New Password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4 lg:py-4 rounded-xl lg:rounded-2xl mt-4 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-teal-500/20 transition-transform active:scale-95">
                        {loading ? "Updating..." : "Reset Password"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
