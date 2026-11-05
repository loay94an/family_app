import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'menu' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    }
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold animate-bounce shadow-md">
        <Check className="w-4 h-4" />
        <span>تم تثبيت التطبيق بنجاح!</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'menu') {
      return (
        <button
          onClick={handleInstallClick}
          className={`w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold flex items-center gap-3 shadow-md hover:shadow-lg transition-all text-right group active:scale-98 ${className}`}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600/50 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-amber-200">تثبيت التطبيق على الجوال</div>
            <div className="text-[11px] text-emerald-100 font-normal">تثبيت سريع للعمل بدون إنترنت وبسهولة</div>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-300/40 ${className}`}
        title="تثبيت التطبيق على جهازك للوصول السريع"
      >
        <Smartphone className="w-4 h-4 text-amber-950" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'menu' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-3 transition-colors text-right active:scale-98 ${className}`}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-100">تثبيت التطبيق على آيفون / آيباد</div>
              <div className="text-[11px] text-slate-400 font-normal">خطوات إضافة التطبيق للشاشة الرئيسية</div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 font-bold text-xs rounded-xl border border-amber-400/30 transition-all active:scale-95 ${className}`}
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>تثبيت الآيفون</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 text-slate-100 p-6 shadow-2xl border border-amber-500/30 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-300">تثبيت التطبيق على آيفون / آيباد</h3>
                  <p className="text-xs text-slate-400">إضافة الشجرة للشاشة الرئيسية بخطوتين</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-xs text-slate-200">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <p className="leading-relaxed">
                    اضغط على زر المشاركة <Share className="w-3.5 h-3.5 inline-block text-amber-400 mx-1" /> في أسفل شريط متصفح ساري (Safari).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <p className="leading-relaxed">
                    مرر للأسفل واضغط على <strong className="text-amber-300">«الإضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 font-bold text-sm transition-colors shadow-lg"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
