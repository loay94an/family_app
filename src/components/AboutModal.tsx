import React from 'react';
import { X, TreePine, Sparkles, Check, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">شجرة العائلة الاحترافية</h3>
              <p className="text-xs text-emerald-200 mt-0.5">الإصدار 12.0 المطور والنهائي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p className="font-bold text-emerald-900 text-sm">
            تطبيق تفاعلي متقدم لبناء، استعراض، وتوثيق شجرة العائلة والأنساب بأعلى المعايير البصرية.
          </p>

          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تحسين الحفظ المحلي والنسخ الاحتياطية</span>
            </div>
            <p className="text-slate-500 text-xs pr-6">
              حفظ تلقائي فوري، إدارة عدة شجرات عائلية، وسجل تاريخي استرجاعي للنسخ الاحتياطية.
            </p>

            <div className="flex items-center gap-2 font-bold text-slate-900 pt-2 border-t border-slate-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>التحكم الكامل بأحجام الأسماء والخطوط</span>
            </div>
            <p className="text-slate-500 text-xs pr-6">
              تغيير حجم اسم كل فرد بشكل مخصص ومستقل أو التحكم الجماعي بأحجام الجذع والفروع والأوراق مع 8 خطوط عربية فاخرة.
            </p>

            <div className="flex items-center gap-2 font-bold text-slate-900 pt-2 border-t border-slate-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>مساحة عمل لا نهائية وسحب وإفلات هرمي</span>
            </div>
            <p className="text-slate-500 text-xs pr-6">
              تحريك الفروع بحرية، نقل الفروع بين الآباء بالسحب، تكبير وتصغير سلس، ورسم نباتي عالي الأداء.
            </p>

            <div className="flex items-center gap-2 font-bold text-slate-900 pt-2 border-t border-slate-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تصدير فائق الدقة (Ultra-HD PNG & PDF)</span>
            </div>
            <p className="text-slate-500 text-xs pr-6">
              تصدير صور مطبوعات ولوحات الشجرة بدقة فائقة مع ملفات PDF وJSON.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center justify-center transition-all shadow-sm"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
