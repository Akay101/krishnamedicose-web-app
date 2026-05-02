import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, CheckCircle2, Zap, Target, Cpu, BarChart3, Wallet, AlertCircle, ShieldCheck, Globe, FileText, Mail } from 'lucide-react';
import axios from 'axios';
import { InventoryVisual, AIScanningVisual, AgentVisual, FinancialVisual, CashflowVisual, AIInsightsVisual, ReportingVisual } from './StorylineGraphics';
import { useModal } from '../context/ModalContext';

export default function OffersSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const { showModal } = useModal();

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.2, once: false });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_API_URL}/offers?activeOnly=true`);
        setOffers(resp.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchOffers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const offer = offers[0];
    if (!offer) return;

    for (const field of offer.formFields) {
      if (field.validation && field.type !== 'file') {
        const regex = new RegExp(field.validation);
        if (!regex.test(formData[field.name] || '')) {
          showModal({ title: 'Validation Error', message: `Invalid format for ${field.label}.`, type: 'error' });
          return;
        }
      }
      if (field.required && !formData[field.name]) {
        showModal({ title: 'Missing Field', message: `Please fill out the ${field.label} field.`, type: 'error' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('offerId', offer._id);
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));

      const resp = await axios.post(`${import.meta.env.VITE_API_URL}/offers/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRegistrationId(resp.data.registrationId);
    } catch (err) { 
      showModal({ title: 'Submission Failed', message: err.response?.data?.message || 'Registration failed.', type: 'error' });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const features = [
    {
      id: 'inventory',
      tag: 'AI Intelligence',
      icon: Cpu,
      title: 'Smart Inventory & Scanning',
      description: 'Auto-add products with AI image recognition. Bill scanning integrated.',
      graphic: <AIScanningVisual />,
      color: 'from-primary/20 to-transparent',
      borderColor: 'border-primary/20'
    },
    {
      id: 'insights',
      tag: 'AI Insights',
      icon: Zap,
      title: 'Predictive Analytics',
      description: 'AI-driven sales predictions and stock optimization suggestions.',
      graphic: <AIInsightsVisual />,
      color: 'from-secondary/20 to-transparent',
      borderColor: 'border-secondary/20'
    },
    {
      id: 'billing',
      tag: 'Financials',
      icon: BarChart3,
      title: 'Synchronized Billing',
      description: 'Real-time Profit & Loss trackers with detailed net revenue stats.',
      graphic: <FinancialVisual />,
      color: 'from-green-400/20 to-transparent',
      borderColor: 'border-green-400/20'
    },
    {
      id: 'cashflow',
      tag: 'Cashflow',
      icon: Wallet,
      title: 'Smart Debts & Receivables',
      description: 'Automated supplier and customer dues management system.',
      graphic: <CashflowVisual />,
      color: 'from-primary/20 to-transparent',
      borderColor: 'border-primary/20'
    },
    {
      id: 'reporting',
      tag: 'Compliance',
      icon: Target,
      title: 'Automated GST Reports',
      description: 'One-click compliance reports and audit-ready documentation.',
      graphic: <ReportingVisual />,
      color: 'from-secondary/20 to-transparent',
      borderColor: 'border-secondary/20'
    },
    {
      id: 'access',
      tag: 'Secure',
      icon: ShieldCheck,
      title: 'Cloud Security',
      description: 'Enterprise-grade encryption for all your pharmaceutical data.',
      graphic: <InventoryVisual />,
      color: 'from-blue-400/20 to-transparent',
      borderColor: 'border-blue-400/20'
    }
  ];

  if (loading) return null;
  const mainOffer = offers[0];

  return (
    <section 
      ref={containerRef}
      id="offers" 
      className="relative min-h-screen bg-[#050505] overflow-hidden py-32"
    >
      {/* Immersive Environment Background */}
      <motion.div 
        style={{ y: backgroundY, opacity: opacityValue }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="mb-24 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-xl shadow-primary/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Built by Krishna Medicose
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-9xl font-black font-outfit text-white leading-[1.1] mb-10 tracking-tighter"
          >
            Our Pharmacy <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient italic">Software</span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative inline-block"
          >
            <p className="text-2xl md:text-4xl font-bold text-slate-300 font-outfit tracking-tight mb-8">
              "Redefining Pharmacy Management through Intelligence"
            </p>
            <div className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto mt-8 font-medium leading-relaxed"
          >
            We've combined decades of pharmaceutical expertise with state-of-the-art AI to build 
            the only ecosystem your pharmacy will ever need.
          </motion.p>
        </div>

        {/* Feature Universe Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className={`group relative aspect-[4/5] overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-b ${feature.color} backdrop-blur-xl p-8 flex flex-col justify-between transition-all duration-500 hover:border-white/20`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-white/5 border ${feature.borderColor} text-white`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{feature.tag}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-outfit">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>

              {/* Graphic Container */}
              <div className="absolute inset-0 top-1/3 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none scale-90 group-hover:scale-100 transform transition-transform">
                {feature.graphic}
              </div>

              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* The 50-50 Master Offer */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[200px] rounded-full animate-pulse" />
          
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative glass-morphism rounded-[4rem] border border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="grid lg:grid-cols-2">
              {/* Left Side: Offer Info */}
              <div className="p-12 lg:p-20 flex flex-col space-y-12 bg-gradient-to-br from-primary/5 to-transparent">
                <div>
                  <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                    Exclusive Launch Offer
                  </div>
                  
                  <h2 className="text-7xl md:text-9xl font-black font-outfit text-white leading-none tracking-tighter">
                    50-50 <br/>
                    <span className="text-primary italic">Access</span>
                  </h2>
                </div>
                
                <div className="grid gap-6">
                  {[
                    "Prioritized early access to the platform for pharmacy owners.",
                    "50 days of full premium access to all AI features completely free at launch.",
                    "Direct priority connect with our dedicated support team for any enquiries or issues.",
                    "Limited-slot fair usage: Access will be revoked if the account remains inactive for 7 consecutive days.",
                    "Permanent priority status in our queue for all upcoming offers and future launches.",
                    "Program exclusively for genuine pharmacy owners committed to modernizing their management."
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                      <div className="mt-1.5 w-5 h-5 rounded-full border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <p className="text-slate-300 text-sm font-medium leading-relaxed">{text}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="p-8 bg-red-400/5 border border-red-400/10 rounded-[2.5rem] flex gap-5"
                >
                  <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-red-400 uppercase tracking-widest">Important Disclaimer</p>
                    <p className="text-xs text-red-400/80 font-medium leading-relaxed">
                      Registration requires a valid Drug License. Submission of incorrect details or invalid documents will lead to immediate disqualification from the early access queue.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right Side: Registration Form */}
              <div className="p-12 lg:p-20 bg-white/[0.02] backdrop-blur-3xl border-l border-white/5 relative">
                {/* Decorative glow for form */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                
                {registrationId ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-8"
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20"
                    >
                      <CheckCircle2 className="w-16 h-16 text-primary" />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-white font-outfit">Spot Reserved!</h3>
                      <p className="text-slate-400 font-medium">Welcome to the future of pharmacy management.</p>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 w-full relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Your Priority Access ID</p>
                      <p className="text-4xl font-mono text-primary tracking-tighter font-bold">{registrationId}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-500">
                      <Mail className="w-4 h-4" />
                      <p className="text-sm font-medium italic">Check your inbox for onboarding details.</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {mainOffer?.formFields.filter(f => f.name === 'name' || f.name === 'mobile').map(field => (
                          <FormField key={field.name} field={field} formData={formData} setFormData={setFormData} />
                        ))}
                      </div>
                      
                      {mainOffer?.formFields.filter(f => f.name !== 'name' && f.name !== 'mobile' && f.type !== 'file').map(field => (
                        <FormField key={field.name} field={field} formData={formData} setFormData={setFormData} />
                      ))}

                      {mainOffer?.formFields.filter(f => f.type === 'file').map(field => (
                        <div key={field.name} className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
                            {field.label} {field.required && '*'}
                          </label>
                          <div className="relative group h-20">
                            <input 
                              type="file"
                              required={field.required}
                              accept="image/*,application/pdf"
                              onChange={e => setFormData({...formData, [field.name]: e.target.files[0]})}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between px-8 group-hover:border-primary/50 group-hover:bg-white/10 transition-all duration-300">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`p-2 rounded-lg ${formData[field.name] ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500'}`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-sm text-slate-300 truncate font-medium">
                                  {formData[field.name]?.name || field.placeholder || 'Upload License Document'}
                                </span>
                              </div>
                              <CheckCircle2 className={`w-5 h-5 transition-colors ${formData[field.name] ? 'text-primary' : 'text-slate-800'}`} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn-primary py-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {isSubmitting ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            Secure My Priority Access
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                      
                      <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                        <div className="h-px w-12 bg-white" />
                        <p className="text-[9px] text-white font-black uppercase tracking-[0.3em] whitespace-nowrap">
                          Verified Program
                        </p>
                        <div className="h-px w-12 bg-white" />
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FormField({ field, formData, setFormData }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
        {field.label} {field.required && '*'}
      </label>
      
      {field.type === 'textarea' ? (
        <textarea
          required={field.required}
          placeholder={field.placeholder}
          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
          className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 focus:border-primary/50 focus:bg-white/10 outline-none transition-all text-sm resize-none font-medium text-white placeholder:text-slate-500"
          rows={3}
        />
      ) : (
        <input
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
          className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 focus:border-primary/50 focus:bg-white/10 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-500"
        />
      )}
    </div>
  );
}
