import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function OffersSection() {
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || offers.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4" /> Exclusive Benefits
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-outfit mb-6"
          >
            Offers & <span className="text-secondary italic">Services</span> By Us
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl text-lg"
          >
            Explore our latest medical software solutions and professional healthcare services designed to elevate your practice.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer, idx) => (
            <OfferCard key={offer._id} offer={offer} index={idx} onClick={() => setSelectedOffer(offer)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedOffer && (
          <OfferFormModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function OfferCard({ offer, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative h-96 rounded-[3rem] overflow-hidden border border-white/5 bg-dark hover:border-primary/30 transition-all duration-500 shadow-2xl"
    >
      <img src={offer.image || '/assets/offer-bg.png'} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent p-10 flex flex-col justify-end">
        <h3 className="text-2xl font-bold font-outfit mb-4 text-glow">{offer.title}</h3>
        <p className="text-slate-300 text-sm mb-8 line-clamp-3 leading-relaxed">
          {offer.description}
        </p>
        <button 
          onClick={onClick}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 hover:bg-primary hover:text-dark border border-white/10 hover:border-primary transition-all duration-300 group/btn font-bold text-sm"
        >
          {offer.formEnabled ? 'Register Now' : 'Show Interest'}
          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function OfferFormModal({ offer, onClose }) {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.9, y: 20 }} 
        className="relative max-w-xl w-full glass-morphism rounded-[3rem] border border-white/10 overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-red-400 hover:text-white rounded-2xl transition-all z-20"><X className="w-5 h-5" /></button>

        <div className="p-12">
          {registrationId ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-green-400"><CheckCircle2 className="w-10 h-10" /></span>
              </div>
              <h2 className="text-3xl font-bold font-outfit">Successfully Registered!</h2>
              <p className="text-slate-400">A confirmation email has been sent to you. Your Registration ID is:</p>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl font-mono text-2xl font-bold text-primary tracking-widest">
                {registrationId}
              </div>
              <button 
                onClick={onClose}
                className="btn-primary w-full py-4 mt-8"
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h3 className="text-3xl font-bold font-outfit mb-3">{offer.title}</h3>
                <p className="text-slate-400 text-sm">Please fill in your details to secure this offer.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {offer.formFields.map(field => (
                    <div key={field.name} className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{field.label} {field.required && '*'}</label>
                      {field.type === 'textarea' ? (
                        <textarea 
                          required={field.required}
                          placeholder={field.placeholder}
                          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all resize-none"
                          rows={3}
                        />
                      ) : (
                        <input 
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-5 rounded-2xl bg-primary text-dark font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
