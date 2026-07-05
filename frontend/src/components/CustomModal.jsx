import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

export default function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'error', 'confirm'
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  const icons = {
    info: <Info className="w-8 h-8 text-primary" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    error: <AlertCircle className="w-8 h-8 text-red-400" />,
    confirm: <HelpCircle className="w-8 h-8 text-secondary" />
  };

  const colors = {
    info: 'border-primary/20',
    success: 'border-green-400/20',
    error: 'border-red-400/20',
    confirm: 'border-secondary/20'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-2xl bg-white border ${colors[type]} rounded-[2.5rem] p-8 shadow-2xl overflow-hidden`}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-800 transition-colors z-50 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-25 ${type === 'error' ? 'bg-red-300' : 'bg-teal-300'}`} />

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                {icons[type]}
              </div>
              
              <div className="space-y-2 w-full">
                <h3 className="text-2xl font-black font-outfit text-slate-900">{title}</h3>
                <div className="text-slate-700 font-bold leading-relaxed text-sm text-left max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-line">
                  {message}
                </div>
              </div>

              <div className="flex gap-4 w-full pt-4">
                {type === 'confirm' ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => { onConfirm(); onClose(); }}
                      className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-extrabold uppercase tracking-widest hover:bg-teal-700 transition-all shadow-md"
                    >
                      {confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-teal-600 text-white font-extrabold uppercase tracking-widest hover:bg-teal-700 transition-all shadow-md"
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
