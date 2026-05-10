import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Padam',
  cancelLabel = 'Batal',
  isDanger = true,
  isLoading = false
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {isDanger && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
            )}
            
            <div className="flex items-start gap-4 mb-6">
              {isDanger && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-slate-800 leading-tight mb-2">
                  {title}
                </h3>
                <div className="text-slate-500 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                  {message}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                disabled={isLoading}
                onClick={onConfirm}
                className={React.useMemo(() => {
                  const base = "flex-1 py-4 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ";
                  return base + (isDanger ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100");
                }, [isDanger])}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
