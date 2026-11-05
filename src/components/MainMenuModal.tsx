import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  X,
  PlusCircle,
  FileSpreadsheet,
  Hand,
  RotateCcw,
  Image,
  FileText,
  Save,
  FolderOpen,
  History,
  FolderKanban,
  Trash2,
  Info,
  Sliders,
  User,
  Users,
} from 'lucide-react';

interface MainMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFamily: () => void;
  onLoadExample: () => void;
  onToggleDragMode: () => void;
  isDragMode: boolean;
  moveMode?: 'nodeOnly' | 'subtree';
  onSetMoveMode?: (mode: 'nodeOnly' | 'subtree') => void;
  onResetLayout: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onOpenSnapshots: () => void;
  onOpenTreesManager: () => void;
  onOpenSettings: () => void;
  onClearAll: () => void;
  onShowAbout: () => void;
}

export const MainMenuModal: React.FC<MainMenuModalProps> = ({
  isOpen,
  onClose,
  onNewFamily,
  onLoadExample,
  onToggleDragMode,
  isDragMode,
  moveMode = 'subtree',
  onSetMoveMode,
  onResetLayout,
  onExportPNG,
  onExportPDF,
  onExportJSON,
  onImportJSON,
  onOpenSnapshots,
  onOpenTreesManager,
  onOpenSettings,
  onClearAll,
  onShowAbout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="text-right">
            <h3 className="font-bold text-base sm:text-lg leading-tight">القائمة الرئيسية</h3>
            <p className="text-xs text-emerald-200 mt-0.5">خيارات الشجرة، التصدير، والحفظ المحلي</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-1 flex-1 text-xs sm:text-sm">
          {/* PWA Mobile Installation Option */}
          <div className="mb-2">
            <PWAInstallButton variant="menu" />
          </div>

          {/* Family & Data Group */}
          <div className="text-[11px] font-bold text-slate-400 px-3 pt-1 pb-0.5">
            إدارة الشجرة والبيانات
          </div>

          <button
            onClick={() => {
              onClose();
              onNewFamily();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">إنشاء عائلة وشجرة جديدة</div>
              <div className="text-[11px] text-slate-400">البدء بجد مؤسس جديد وبناء شجرة مستقلة</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenTreesManager();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">التبديل بين شجرات العائلة المحفوظة</div>
              <div className="text-[11px] text-slate-400">فتح وتعديل وإدارة أشجار الأنساب المتعددة</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onLoadExample();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">مشجرة التقاء نسب الرسول ﷺ مع الخلفاء الراشدين</div>
              <div className="text-[11px] text-slate-400">النموذج التوضيحي الموثق لنسب النبي والخلفاء الراشدين الأربعة</div>
            </div>
          </button>

          {/* Canvas & Settings */}
          <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-0.5 border-t border-slate-100">
            أدوات التخطيط والمظهر
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">إعدادات الخطوط والمظهر والخلفيات</div>
              <div className="text-[11px] text-slate-400">تخصيص نمط الشجرة، الأوراق، والمسافات</div>
            </div>
          </button>

          {/* Move Subtree (Parent with children) - Corresponding to short click */}
          <button
            onClick={() => {
              onClose();
              if (onSetMoveMode) {
                onSetMoveMode('subtree');
              } else {
                onToggleDragMode();
              }
            }}
            className={`w-full p-2.5 rounded-xl font-medium flex items-center gap-3 transition-colors text-right group active:scale-98 ${
              isDragMode && moveMode === 'subtree'
                ? 'bg-amber-50 text-amber-950 border border-amber-300'
                : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isDragMode && moveMode === 'subtree'
                ? 'bg-amber-400 text-emerald-950'
                : 'bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-700'
            }`}>
              <Hand className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center gap-2">
                <span>تحريك الأب مع الأبناء (الفرع كاملاً)</span>
                {isDragMode && moveMode === 'subtree' && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-bold">مفعل</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                (نقرة واحدة سريعة على زر التحريك) تحريك الأب وجميع فروعه وأبنائه معاً
              </div>
            </div>
          </button>

          {/* Move Node Only (Selected individual) - Corresponding to long press */}
          <button
            onClick={() => {
              onClose();
              if (onSetMoveMode) {
                onSetMoveMode('nodeOnly');
              } else {
                onToggleDragMode();
              }
            }}
            className={`w-full p-2.5 rounded-xl font-medium flex items-center gap-3 transition-colors text-right group active:scale-98 ${
              isDragMode && moveMode === 'nodeOnly'
                ? 'bg-sky-50 text-sky-950 border border-sky-300'
                : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isDragMode && moveMode === 'nodeOnly'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700'
            }`}>
              <User className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center gap-2">
                <span>تحريك الفرد المحدد فقط (دون الأبناء)</span>
                {isDragMode && moveMode === 'nodeOnly' && (
                  <span className="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded-md font-bold">مفعل</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                (ضغطة مطولة على زر التحريك) تحريك الشخص المختار فقط دون سحب باقي الفروع
              </div>
            </div>
          </button>

          {/* Turn Off Drag Mode if currently enabled */}
          {isDragMode && (
            <button
              onClick={() => {
                onClose();
                onToggleDragMode();
              }}
              className="w-full p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <span>✋ إيقاف وضع التحريك وتثبيت الأماكن</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onResetLayout();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">إعادة التخطيط التلقائي الأصلي</div>
              <div className="text-[11px] text-slate-400">إلغاء التعديلات اليدوية وإعادة الحساب الهندسي</div>
            </div>
          </button>

          {/* Export & Import */}
          <div className="text-[11px] font-bold text-slate-400 px-3 pt-3 pb-0.5 border-t border-slate-100">
            التصدير والطباعة والنسخ الاحتياطي
          </div>

          <button
            onClick={() => {
              onClose();
              onExportPDF();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">تصدير PDF عالي الدقة للطباعة (A4-A1)</div>
              <div className="text-[11px] text-slate-400">ملف متجهي احترافي جاهز للمطابع والبوسترات</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onExportPNG();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <Image className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">تصدير صورة عالية الدقة (PNG)</div>
              <div className="text-[11px] text-slate-400">صورة واضحة للمشاركة عبر برامج التواصل</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onExportJSON();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <Save className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">تصدير ملف النسخة الاحتياطية (JSON)</div>
              <div className="text-[11px] text-slate-400">حفظ كامل الشجرة بجميع إعداداتها ومواضعها</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onImportJSON();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">استيراد شجرة من ملف (JSON)</div>
              <div className="text-[11px] text-slate-400">فتح ملف شجرة محفوظ مسبقاً</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSnapshots();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">سجل النسخ الاحتياطية والاسترجاع</div>
              <div className="text-[11px] text-slate-400">نقاط الاستعادة التلقائية واليدوية للبيانات</div>
            </div>
          </button>

          {/* Danger & About */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              onClick={() => {
                onClose();
                onShowAbout();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-700">عن التطبيق والمميزات</div>
                <div className="text-[11px] text-slate-400">معلومات الإصدار واختصارات لوحة المفاتيح</div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onClearAll();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-red-700 flex items-center justify-center transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-red-600">مسح جميع البيانات والبدء من جديد</div>
                <div className="text-[11px] text-red-400">حذف الشجرة الحالية من الذاكرة المحلية</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
