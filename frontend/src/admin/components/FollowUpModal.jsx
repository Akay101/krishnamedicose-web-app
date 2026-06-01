import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, MessageSquare, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FollowUpModal({ isOpen, onClose, onSave, initialNotes = '', title = "Follow-up Details" }) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setNotes(initialNotes);
  }, [isOpen, initialNotes]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(notes);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 text-slate-900"
        >
          <div className="p-8 border-b border-slate-250/60 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-650">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-outfit text-slate-900">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <X className="w-5 h-5 text-slate-400 hover:text-slate-800" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
                Internal Follow-up Notes
              </label>
              <textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the conversation, outcomes, or next steps..."
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all resize-none font-medium text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-primary text-dark font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Save & Mark Done
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
