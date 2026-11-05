import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none max-w-[90vw]">
      <div
        className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold backdrop-blur-md border ${
          type === 'success'
            ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-950/50'
            : type === 'error'
            ? 'bg-rose-950/90 text-rose-100 border-rose-500/50 shadow-rose-950/50'
            : 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/50'
        }`}
      >
        {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
        {type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
};
