import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export default function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'error', 'confirm', 'warning', 'danger'
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [isOpen]);

  const icons = {
    info: <Info className="w-8 h-8 text-primary" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    error: <AlertCircle className="w-8 h-8 text-red-400" />,
    confirm: <HelpCircle className="w-8 h-8 text-secondary" />,
    warning: <AlertCircle className="w-8 h-8 text-amber-500" />,
    danger: <AlertCircle className="w-8 h-8 text-rose-500" />
  };

  const colors = {
    info: 'border-primary/20',
    success: 'border-green-400/20',
    error: 'border-red-400/20',
    confirm: 'border-secondary/20',
    warning: 'border-amber-400/30',
    danger: 'border-rose-400/30'
  };

  const isConfirmation = type === 'confirm' || typeof onConfirm === 'function';

  const isDestructive =
    type === 'danger' ||
    type === 'warning' ||
    (confirmText &&
      (confirmText.toLowerCase().includes('delete') ||
        confirmText.toLowerCase().includes('remove') ||
        confirmText.toLowerCase().includes('suspend') ||
        confirmText.toLowerCase().includes('deactivate')));

  const glowBg =
    type === 'error' || type === 'danger'
      ? 'bg-red-300'
      : type === 'warning'
      ? 'bg-amber-300'
      : 'bg-teal-300';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="custom-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transform-gpu overscroll-contain"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl bg-white border ${colors[type] || colors.info} rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl overflow-hidden`}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-slate-500 hover:text-slate-800 transition-colors z-50 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-25 ${glowBg}`} />

            <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6 relative z-10">
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                {icons[type] || icons.info}
              </div>
              
              <div className="space-y-2 w-full">
                <h3 className="text-xl sm:text-2xl font-black font-outfit text-slate-900">{title}</h3>
                <div className="text-slate-700 font-bold leading-relaxed text-xs sm:text-sm text-left max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-line">
                  {message}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full pt-2 sm:pt-4">
                {isConfirmation ? (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 transition-all text-xs sm:text-sm cursor-pointer"
                    >
                      {cancelText}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                      }}
                      className={`w-full sm:flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold uppercase tracking-widest transition-all shadow-md text-xs sm:text-sm cursor-pointer text-white ${
                        isDestructive
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                          : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                      }`}
                    >
                      {confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-teal-600 text-white font-extrabold uppercase tracking-widest hover:bg-teal-700 transition-all shadow-md text-xs sm:text-sm cursor-pointer"
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
