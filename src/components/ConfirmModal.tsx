import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, Check } from 'lucide-react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ dialog, onClose }) => {
  if (!dialog || !dialog.isOpen) return null;

  const isDanger = dialog.type === 'danger' || !dialog.type;
  const isWarning = dialog.type === 'warning';

  const handleConfirm = () => {
    dialog.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          className={`p-4 flex items-center justify-between text-white ${
            isDanger
              ? 'bg-gradient-to-r from-red-800 via-red-700 to-rose-800'
              : isWarning
              ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800'
              : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              {isDanger ? (
                <Trash2 className="w-5 h-5 text-white" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-white" />
              ) : (
                <RotateCcw className="w-5 h-5 text-white" />
              )}
            </div>
            <h3 className="font-bold text-base">{dialog.title}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
            {dialog.message}
          </p>

          {isDanger && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-xl font-medium">
              ⚠️ تنبيه: هذا الإجراء سيقوم بحذف البيانات المحددة.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            {dialog.cancelText || 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`py-2.5 px-5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-500/20'
            }`}
          >
            {isDanger ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{dialog.confirmText || (isDanger ? 'نعم، حذف' : 'تأكيد')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
