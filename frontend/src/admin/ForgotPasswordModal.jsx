import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

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
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
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
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, { email, otp });
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
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, { email, otp, password });
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

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-slate-500 focus:bg-white/10";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border-white/20"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>

            <div className="p-10">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold font-outfit mb-4">Password Reset!</h2>
                  <p className="text-slate-400">Your password has been updated. Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold font-outfit mb-2">
                      {step === 1 && "Forgot Password?"}
                      {step === 2 && "Enter OTP"}
                      {step === 3 && "New Password"}
                    </h2>
                    <p className="text-slate-400">
                      {step === 1 && "No worries, we'll send you recovery instructions."}
                      {step === 2 && `We've sent a 6-digit code to ${email}`}
                      {step === 3 && "Create a secure new password for your account."}
                    </p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}

                  {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div className="relative group">
                        <Mail className={iconClasses} />
                        <input
                          required
                          type="email"
                          placeholder="Admin Email"
                          className={inputClasses}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4 flex items-center justify-center gap-2 group">
                        {loading ? "Sending..." : "Send Reset Code"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div className="relative group">
                        <ShieldCheck className={iconClasses} />
                        <input
                          required
                          type="text"
                          maxLength="6"
                          placeholder="6-Digit OTP"
                          className={`${inputClasses} tracking-[0.5em] text-center font-bold text-2xl`}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4">
                        {loading ? "Verifying..." : "Verify OTP"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="w-full text-sm text-slate-500 hover:text-white transition-colors"
                      >
                        Change Email
                      </button>
                    </form>
                  )}

                  {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="relative group">
                        <Lock className={iconClasses} />
                        <input
                          required
                          type="password"
                          placeholder="New Password"
                          className={inputClasses}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="relative group">
                        <Lock className={iconClasses} />
                        <input
                          required
                          type="password"
                          placeholder="Confirm New Password"
                          className={inputClasses}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <button disabled={loading} className="w-full btn-primary py-4 mt-2">
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
