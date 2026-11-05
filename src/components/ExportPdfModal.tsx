import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Sparkles,
  Download,
  Check,
  Palette,
  Maximize2,
  FileCode,
  Layers,
  Settings2,
} from 'lucide-react';
import { TreeNode } from '../types/tree';

export interface ExportPdfOptions {
  paperSize: 'a4' | 'a3' | 'a2' | 'a1' | 'custom';
  dpi: 150 | 200 | 300;
  orientation: 'auto' | 'landscape' | 'portrait';
  bgMode: 'theme' | 'white';
  includeHeader: boolean;
  includeBorder: boolean;
  includeStats: boolean;
  exportFormat: 'pdf' | 'svg';
}

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  root: TreeNode | null;
  treeName: string;
  memberCount: number;
  generationCount: number;
  onExport: (options: ExportPdfOptions) => Promise<void>;
  isExporting: boolean;
  exportProgress?: string;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  root,
  treeName,
  memberCount,
  generationCount,
  onExport,
  isExporting,
  exportProgress,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'a3' | 'a2' | 'a1' | 'custom'>('a3');
  const [dpi, setDpi] = useState<150 | 200 | 300>(300);
  const [orientation, setOrientation] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  const [bgMode, setBgMode] = useState<'theme' | 'white'>('theme');
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includeBorder, setIncludeBorder] = useState<boolean>(true);
  const [includeStats, setIncludeStats] = useState<boolean>(true);

  if (!isOpen || !root) return null;

  const handleStartExport = (format: 'pdf' | 'svg') => {
    onExport({
      paperSize,
      dpi,
      orientation,
      bgMode,
      includeHeader,
      includeBorder,
      includeStats,
      exportFormat: format,
    });
  };

  const paperSizes = [
    { id: 'a4', name: 'A4', desc: '210 × 297 مم (طباعة منزلية/ملفات)', badge: 'عادي' },
    { id: 'a3', name: 'A3', desc: '297 × 420 مم (لوحة مكتبية متوسطة)', badge: 'موصى به ⭐' },
    { id: 'a2', name: 'A2', desc: '420 × 594 مم (بوستر جداري كبير)', badge: 'فخم' },
    { id: 'a1', name: 'A1', desc: '594 × 841 مم (لوحة أنساب جدارية ضخمة)', badge: 'معماري' },
    { id: 'custom', name: 'حجم مخصص', desc: 'حسب أبعاد الشجرة الطبيعية بالكامل', badge: 'بدون هوامش' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تصدير PDF عالي الدقة للطباعة</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                تجهيز ملف طباعة احترافي لشجرة {treeName || root.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800 text-sm">
          
          {/* Paper Size Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>مقاس صفحة الطباعة</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                جاهز للمطابع
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paperSizes.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaperSize(p.id as any)}
                  className={`p-3 rounded-xl border text-right transition-colors flex flex-col justify-between gap-1 ${
                    paperSize === p.id
                      ? 'border-emerald-600 bg-emerald-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      paperSize === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.badge.replace(' ⭐', '')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality DPI Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>دقة التفاصيل وجودة الوضوح</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 300, name: '300 DPI (فائقة)', tag: 'أعلى دقة للمطابع' },
                { val: 200, name: '200 DPI (عالية)', tag: 'متوازنة وسريعة' },
                { val: 150, name: '150 DPI (قياسية)', tag: 'حجم ملف أصغر' },
              ].map(q => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => setDpi(q.val as any)}
                  className={`p-2.5 rounded-xl border text-center transition-colors ${
                    dpi === q.val
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{q.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{q.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Background and Colors */}
          <div className="grid grid-cols-2 gap-3">
            {/* Background Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-600" />
                <span>نمط الخلفية</span>
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setBgMode('theme')}
                  className={`flex-1 p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                    bgMode === 'theme'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  السمة الحالية
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('white')}
                  className={`flex-1 p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                    bgMode === 'white'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  خلفية بيضاء
                </button>
              </div>
            </div>

            {/* Page Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>اتجاه الصفحة</span>
              </label>
              <div className="flex gap-1">
                {[
                  { id: 'auto', label: 'تلقائي' },
                  { id: 'landscape', label: 'أفقي' },
                  { id: 'portrait', label: 'رأسي' },
                ].map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOrientation(o.id as any)}
                    className={`flex-1 p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                      orientation === o.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-slate-600" />
              <span>خيارات إضافية للطباعة</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">ترويسة الشجرة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeBorder}
                  onChange={e => setIncludeBorder(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">إطار زخرفي للوحة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={e => setIncludeStats(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">إحصائيات الأجيال</span>
              </label>
            </div>
          </div>

          {/* Live Summary Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>إحصائيات الشجرة المعدة للطباعة:</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {memberCount} فرداً • {generationCount} أجيال متعاقبة • جودة عالية للطباعة
              </p>
            </div>
          </div>

          {/* Export Status/Progress */}
          {isExporting && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
              <span className="font-medium">{exportProgress || 'جاري معالجة المتجهات وتوليد ملف PDF عالي الدقة...'}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleStartExport('pdf')}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>تصدير ملف PDF عالي الجودة</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleStartExport('svg')}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs"
            title="تصدير بصيغة SVG لبرامج الجرافيك والمطابع"
          >
            <FileCode className="w-4 h-4" />
            <span>تصدير SVG</span>
          </button>
        </div>

      </div>
    </div>
  );
};
