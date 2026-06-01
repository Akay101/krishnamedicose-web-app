import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Phone, Globe, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { useModal } from '../context/ModalContext';

export default function CollaborationModal({ isOpen, onClose }) {
  const { showModal } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    country: '',
    type: 'collaborate',
    email: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        // Auto close after success
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          setFormData({ name: '', mobile: '', country: '', type: 'collaborate', email: '', description: '' });
        }, 3000);
      } else {
        showModal({ title: 'Submission Error', message: 'Failed to send your request. Please check your details and try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      showModal({ title: 'Network Error', message: 'Could not connect to the server. Please check your internet connection.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-slate-800 focus:outline-none focus:border-teal-500 transition-all duration-300 placeholder:text-slate-400 focus:bg-white font-medium";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-slate-400 hover:text-slate-700" />
            </button>

            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-20 text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-teal-600 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black font-outfit mb-4 text-slate-900">Request Sent!</h2>
                <p className="text-slate-655 font-bold">Krishna Pandit will get back to you personally very soon.</p>
              </motion.div>
            ) : (
              <div className="p-8 md:p-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-black font-outfit mb-2 text-slate-900">Let's <span className="text-teal-600 italic">Collaborate</span></h2>
                  <p className="text-slate-600 font-bold">Fill this to start something amazing together.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <User className={iconClasses} />
                      <input
                        required
                        type="text"
                        placeholder="Your Name"
                        className={inputClasses}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="relative group">
                      <Phone className={iconClasses} />
                      <input
                        required
                        type="tel"
                        placeholder="Mobile Number"
                        className={inputClasses}
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <Globe className={iconClasses} />
                      <input
                        required
                        type="text"
                        placeholder="Country"
                        className={inputClasses}
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                      />
                    </div>
                    <div className="relative group">
                      <Mail className={iconClasses} />
                      <input
                        required
                        type="email"
                        placeholder="Email Address"
                        className={inputClasses}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-100 border border-slate-200/60 p-1.5 rounded-2xl flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'collaborate'})}
                      className={`flex-1 py-3 rounded-xl transition-all duration-300 font-extrabold text-sm ${formData.type === 'collaborate' ? 'bg-white text-teal-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Collaborate
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'enquire'})}
                      className={`flex-1 py-3 rounded-xl transition-all duration-300 font-extrabold text-sm ${formData.type === 'enquire' ? 'bg-white text-sky-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Business Enquiry
                    </button>
                  </div>

                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <textarea
                      required
                      placeholder="Tell us about your project/idea..."
                      rows="4"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-800 focus:outline-none focus:border-teal-500 transition-all duration-300 placeholder:text-slate-400 focus:bg-white resize-none font-medium"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2 group overflow-hidden relative"
                  >
                    {isSubmitting ? (
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <>
                        <span className="relative z-10">Send Proposal</span>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform relative z-10" />
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
