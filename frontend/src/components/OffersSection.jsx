import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ChevronRight, Zap, Target, Cpu } from 'lucide-react';
import axios from 'axios';
import { InventoryVisual, AIScanningVisual, AgentVisual } from './StorylineGraphics';

export default function OffersSection() {
  const [offers, setOffers] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

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

  const nextStep = () => {
    if (currentStep < storylineSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const offer = offers[0]; // Primary 50-50 offer
    if (!offer) return;

    // Validation check
    for (const field of offer.formFields) {
      if (field.validation) {
        const regex = new RegExp(field.validation);
        if (!regex.test(formData[field.name] || '')) {
          alert(`Invalid format for ${field.label}. Please follow the required pattern.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const resp = await axios.post(`${import.meta.env.VITE_API_URL}/offers/register`, {
        offerId: offer._id,
        formData
      });
      setRegistrationId(resp.data.registrationId);
    } catch (err) { 
      alert('Registration failed. Please try again.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const storylineSteps = [
    {
      id: 'vision',
      tag: 'The Vision',
      icon: Target,
      title: 'Built by Experts, For Your Pharmacy',
      description: 'Our team is launching a revolutionary Pharmacy Management Platform. We have built this from the ground up to handle the unique complexities of modern healthcare retail.',
      graphic: <InventoryVisual />,
      accent: 'text-primary'
    },
    {
      id: 'core',
      tag: 'Complete Control',
      icon: Zap,
      title: 'Unified Management ecosystem',
      description: 'Manage your entire pharmacy workflow in one place. From real-time Inventory tracking and Purchases to dynamic Billing, Supplier management, and secure Payment flows.',
      graphic: <InventoryVisual />, // Reusing with different context or new one
      accent: 'text-secondary'
    },
    {
      id: 'intelligence',
      tag: 'AI Intelligence',
      icon: Cpu,
      title: 'Smart Scanning & AI Reporting',
      description: 'Experience true automation with AI-based smart scanning of bills, purchases, and products. Our AI Agent provides deep insights and answers anything about your pharmacy at any time.',
      graphic: <AIScanningVisual />,
      accent: 'text-primary'
    },
    {
      id: 'offer',
      tag: '50-50 Offer',
      icon: Sparkles,
      title: 'Exclusive Launch Early Access',
      description: 'We are launching very soon. Our 50-50 offer gives the first 50 pharmacy owners 50 days of full, unrestricted access for free. Secure your spot now!',
      graphic: <AgentVisual />,
      accent: 'text-secondary'
    }
  ];

  if (loading) return null;
  const current = storylineSteps[currentStep];
  const mainOffer = offers[0];

  return (
    <section className="min-h-screen relative overflow-hidden bg-dark flex items-center py-24">
      {/* Dynamic Background Accents */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br transition-all duration-1000 opacity-20 ${currentStep % 2 === 0 ? 'from-primary/20 via-transparent to-transparent' : 'from-secondary/20 via-transparent to-transparent'}`} />
      
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side: Storyline Text */}
          <div className="space-y-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="space-y-6"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 ${current.accent} text-xs font-bold uppercase tracking-widest`}>
                  <current.icon className="w-4 h-4" /> {current.tag}
                </div>
                
                <h2 className="text-5xl md:text-7xl font-bold font-outfit leading-tight">
                  {current.title.split(' ').map((word, i) => (
                    <span key={i} className={i % 2 === 1 && currentStep !== 3 ? current.accent : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h2>
                
                <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                  {current.description}
                </p>

                {currentStep === 3 && mainOffer && !registrationId && (
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit} 
                    className="mt-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                      {mainOffer.formFields.map(field => (
                        <div key={field.name} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} space-y-1`}>
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">{field.label} {field.required && '*'}</label>
                          {field.type === 'textarea' ? (
                            <textarea 
                              required={field.required}
                              placeholder={field.placeholder}
                              onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all text-sm resize-none"
                              rows={3}
                            />
                          ) : (
                            <input 
                              type={field.type}
                              required={field.required}
                              placeholder={field.placeholder}
                              onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-5 rounded-2xl bg-primary text-dark font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Register'}
                    </button>
                  </motion.form>
                )}

                {registrationId && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-12 p-8 bg-green-400/10 border border-green-400/20 rounded-[2.5rem] text-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold font-outfit mb-2">Registration Confirmed!</h3>
                    <p className="text-slate-400 mb-6">Your exclusive ID: <span className="text-primary font-mono">{registrationId}</span></p>
                    <p className="text-sm text-slate-500">Check your email for further instructions.</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center gap-6 pt-10">
              <div className="flex gap-2">
                {storylineSteps.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentStep(i)}
                    className={`h-1 rounded-full transition-all duration-500 ${currentStep === i ? 'w-12 bg-primary' : 'w-4 bg-white/20'}`} 
                  />
                ))}
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="p-4 rounded-full border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextStep}
                  disabled={currentStep === storylineSteps.length - 1}
                  className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:border-primary transition-all flex items-center gap-3 font-bold group disabled:opacity-20"
                >
                  Next Insight <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Animated Graphics */}
          <div className="relative aspect-square flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="w-full h-full"
              >
                {current.graphic}
              </motion.div>
            </AnimatePresence>

            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
          </div>

        </div>
      </div>
    </section>
  );
}
