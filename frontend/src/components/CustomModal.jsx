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
            className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md bg-dark/90 border ${colors[type]} rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl overflow-hidden`}
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${type === 'error' ? 'bg-red-400' : 'bg-primary'}`} />

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl">
                {icons[type]}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-outfit text-white">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-4 w-full pt-4">
                {type === 'confirm' ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => { onConfirm(); onClose(); }}
                      className="flex-1 py-4 rounded-2xl bg-primary text-dark font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                    >
                      {confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-primary text-dark font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
