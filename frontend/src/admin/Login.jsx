import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import api from '../utils/api';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 blur-[120px] rounded-full -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <span className="font-bold text-3xl font-outfit tracking-tight text-white">KM <span className="text-primary">Admin</span></span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back, Visionary</h1>
          <p className="text-slate-400">Professional pharmaceutical control panel</p>
        </div>

        <div className="glass-morphism p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-2">Admin Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium text-white"
                  placeholder="name@krishnamedicose.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-sm font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm font-bold text-slate-500 hover:text-primary transition-colors italic"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2 group relative overflow-hidden rounded-2xl"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <span className="relative z-10 font-bold">Access System</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      <ForgotPasswordModal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)} 
      />
    </div>
  );
}
