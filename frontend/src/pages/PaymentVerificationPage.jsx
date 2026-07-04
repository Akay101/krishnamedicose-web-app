import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Sparkles, Eye, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import InteractiveBackground from '../components/InteractiveBackground';
import api from '../utils/api';

export default function PaymentVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING'); // 'PENDING', 'SUCCESS', 'FAILED'
  const [purchase, setPurchase] = useState(null);
  const [bundleLink, setBundleLink] = useState('https://drive.google.com');
  const [errorMessage, setErrorMessage] = useState('');

  const orderId = searchParams.get('order_id');
  const verificationRequested = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setErrorMessage('Invalid or missing order reference.');
      setStatus('FAILED');
      setLoading(false);
      return;
    }

    if (verificationRequested.current) return;
    verificationRequested.current = true;

    const verify = async () => {
      try {
        const response = await api.post('/medicine-bundle/verify-payment', { orderId });
        if (response.data.status === 'SUCCESS') {
          setPurchase(response.data.purchase);
          setStatus('SUCCESS');
          
          // Auto-login user by saving session token and user info
          if (response.data.token && response.data.user) {
            localStorage.setItem('bundle_token', response.data.token);
            localStorage.setItem('bundle_user', JSON.stringify(response.data.user));
          }
        } else {
          setErrorMessage(response.data.message || 'Payment verification failed.');
          setStatus('FAILED');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(err.response?.data?.message || 'Server error during payment verification.');
        setStatus('FAILED');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [orderId]);

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-200 selection:text-teal-900 flex flex-col justify-center items-center p-6">
      <InteractiveBackground />
      <Navbar />

      <div className="w-full max-w-lg z-10 pt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 shadow-2xl space-y-8"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <Loader2 className="w-16 h-16 text-teal-600 animate-spin" />
              <div>
                <h2 className="text-xl font-bold font-outfit text-slate-900 mb-2">Verifying Payment</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Securing authorization from Cashfree...</p>
              </div>
            </div>
          ) : status === 'SUCCESS' ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mx-auto text-teal-650">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-black font-outfit text-slate-900">Payment Verified!</h1>
                  <p className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mt-1">Transaction Completed Successfully</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-[2rem] p-6 space-y-4 text-xs font-bold text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">ORDER REFERENCE</span>
                  <span className="font-mono text-slate-800">{purchase?.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">CUSTOMER</span>
                  <span className="text-slate-800">{purchase?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AMOUNT RECEIVED</span>
                  <span className="text-teal-600">₹{purchase?.amount} INR</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-sky-50 border border-sky-100/60 p-4 rounded-xl text-xs text-sky-850">
                <Mail className="w-5 h-5 shrink-0 text-sky-600" />
                <p className="font-bold">
                  A receipt and secure login details have been dispatched to <span className="underline">{purchase?.email}</span>.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/medicine-data')}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 group rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 animate-pulse" />
                  <span>Access Secure Viewer</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all"
                >
                  Back to Homepage
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-650">
                  <XCircle className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-black font-outfit text-slate-900">Checkout Unsuccessful</h1>
                  <p className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mt-1">Transaction Cancelled or Failed</p>
                </div>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-700 font-bold text-center leading-relaxed">
                {errorMessage || 'The payment session was abandoned or declined by the bank. If money was deducted, it will be refunded within 3-5 business days.'}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/medicine-data')}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 group rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Attempt Payment Again</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all"
                >
                  Back to Homepage
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
