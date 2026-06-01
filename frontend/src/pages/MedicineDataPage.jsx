import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Phone, User, Sparkles, ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import InteractiveBackground from '../components/InteractiveBackground';
import api from '../utils/api';

export default function MedicineDataPage() {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [price, setPrice] = useState(999);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch dynamic bundle price from backend config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const resp = await api.get('/medicine-bundle/config');
        setPrice(resp.data.amount);
      } catch (err) {
        console.error('Failed to fetch medicine bundle configuration amount:', err);
      }
    };
    fetchConfig();
  }, []);

  // Dynamically load Cashfree SDK on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create order on the backend
      const resp = await api.post('/medicine-bundle/create-order', formData);
      const { paymentSessionId, orderId, isProduction } = resp.data;

      // 2. Instantiate Cashfree
      if (!window.Cashfree) {
        throw new Error('Cashfree SDK failed to load. Please refresh the page and try again.');
      }

      const cashfree = window.Cashfree({
        mode: isProduction ? 'production' : 'sandbox'
      });

      // 3. Initiate Checkout redirection/modal
      cashfree.checkout({
        paymentSessionId,
        returnUrl: `${window.location.origin}/medicine-data/verify-payment?order_id=${orderId}`
      });

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  const bundleHighlights = [
    "500+ most sold medicines in Indian pharmacies with salt profiles.",
    "Comprehensive pricing structures (MRP, PTS, PTR) & profit margin details.",
    "Manufacturer, therapeutic class, and market share statistics.",
    "Fully structured Excel format (.xlsx) for direct analytic modeling.",
    "Verified data matching active retail and wholesale order books."
  ];

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-200 selection:text-teal-900 pb-20">
      <InteractiveBackground />
      <Navbar />

      <div className="max-w-6xl mx-auto pt-40 px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Bundle Info Section */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200/60 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 font-outfit">Premium Dataset</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black font-outfit leading-tight tracking-tight text-slate-900">
                Popular Medicine <br />
                <span className="text-gradient bg-gradient-to-r from-teal-600 to-sky-600 italic">Market Intel Bundle</span>
              </h1>
              <p className="text-base lg:text-lg text-slate-650 mt-4 leading-relaxed font-medium">
                Gain competitive intelligence on pharmaceuticals sold most in Indian pharmacies. Build models, optimize stock, and check distributor wholesale rates.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-md space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 font-outfit">Structured Excel Database</h3>
                  <p className="text-xs text-slate-500 font-medium">Instant cloud download after success checkout</p>
                </div>
              </div>

              <div className="space-y-4">
                {bundleHighlights.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold text-slate-700 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-sky-50/50 border border-sky-100/60 p-6 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-sky-600 shrink-0" />
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Powered by secure Cashfree SSL-encrypted checkout. Verified by pharmaceutical distribution professionals.
              </p>
            </div>
          </div>

          {/* Form & Purchase Section */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-10 shadow-xl space-y-8"
            >
              <div className="text-center pb-6 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Lifetime Access</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900 font-outfit">₹{price}</span>
                  <span className="text-sm font-bold text-slate-400">one-time payment</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">Your Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">Mobile Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                      <input 
                        type="tel" 
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        placeholder="9999999999"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 pl-12 lg:pl-14 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm lg:text-base"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center leading-relaxed">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary py-4 mt-2 flex items-center justify-center gap-2 group relative overflow-hidden rounded-xl lg:rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-md transition-transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Pay & Access Bundle</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

        </div>
      </div>
    </main>
  );
}
