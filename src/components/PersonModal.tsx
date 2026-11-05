import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  FileText,
  Type,
  Maximize2,
  Check,
  Award,
  Sparkles,
  Heart,
} from 'lucide-react';
import { TreeNode, NodeOverride, TreeSettings, Gender } from '../types/tree';

interface PersonModalProps {
  isOpen: boolean;
  title: string;
  initialData?: TreeNode | null;
  initialOverride?: NodeOverride | null;
  settings: TreeSettings;
  parentSpouses?: TreeNode[];
  initialSpouseParentId?: number | null;
  onClose: () => void;
  onSave: (
    data: {
      name: string;
      title?: string;
      gender: Gender;
      birthDate?: string;
      deathDate?: string;
      notes?: string;
      phone?: string;
      location?: string;
      spouseParentId?: number | null;
    },
    override?: NodeOverride
  ) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  title,
  initialData,
  initialOverride,
  settings,
  parentSpouses = [],
  initialSpouseParentId = null,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [personTitle, setPersonTitle] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [spouseParentId, setSpouseParentId] = useState<number | null>(null);

  // Font size & scale custom overrides
  const defaultSize = initialData
    ? initialData.level === 0
      ? settings.trunkFontSize
      : initialData.children.length === 0
      ? settings.leafFontSize
      : settings.branchFontSize
    : settings.leafFontSize;

  const [customFontSize, setCustomFontSize] = useState<number>(defaultSize);
  const [isCustomFontEnabled, setIsCustomFontEnabled] = useState(false);
  const [nodeScale, setNodeScale] = useState<number>(1.0);
  const [colorOverride, setColorOverride] = useState<string>('');
  const [textColorOverride, setTextColorOverride] = useState<string>('');
  const [leafStyleOverride, setLeafStyleOverride] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPersonTitle(initialData.title || '');
      setGender(initialData.gender || 'male');
      setBirthDate(initialData.birthDate || '');
      setDeathDate(initialData.deathDate || '');
      setNotes(initialData.notes || '');
      setPhone(initialData.phone || '');
      setLocation(initialData.location || '');
      setSpouseParentId(initialData.spouseParentId || initialSpouseParentId || null);

      if (initialOverride && initialOverride.fontSize !== undefined) {
        setCustomFontSize(initialOverride.fontSize);
        setIsCustomFontEnabled(true);
      } else {
        setCustomFontSize(defaultSize);
        setIsCustomFontEnabled(false);
      }

      if (initialOverride && initialOverride.scale !== undefined) {
        setNodeScale(initialOverride.scale);
      } else {
        setNodeScale(1.0);
      }

      setColorOverride(initialOverride?.colorOverride || '');
      setTextColorOverride(initialOverride?.textColorOverride || '');
      setLeafStyleOverride(initialOverride?.leafStyle || '');
    } else {
      setName('');
      setPersonTitle('');
      setGender('male');
      setBirthDate('');
      setDeathDate('');
      setNotes('');
      setPhone('');
      setLocation('');
      setSpouseParentId(initialSpouseParentId || null);
      setCustomFontSize(settings.leafFontSize);
      setIsCustomFontEnabled(false);
      setNodeScale(1.0);
      setColorOverride('');
      setTextColorOverride('');
      setLeafStyleOverride('');
    }
  }, [initialData, initialOverride, isOpen, defaultSize, settings.leafFontSize, initialSpouseParentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      title: personTitle.trim() || undefined,
      gender,
      birthDate: birthDate.trim() || undefined,
      deathDate: deathDate.trim() || undefined,
      notes: notes.trim() || undefined,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      spouseParentId: spouseParentId || undefined,
    };

    const override: NodeOverride = {
      ...(initialOverride || {}),
      fontSize: isCustomFontEnabled ? customFontSize : undefined,
      scale: nodeScale !== 1.0 ? nodeScale : undefined,
      colorOverride: colorOverride.trim() || undefined,
      textColorOverride: textColorOverride.trim() || undefined,
      leafStyle: leafStyleOverride ? (leafStyleOverride as any) : undefined,
    };

    onSave(data, override);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-3.5 sm:p-4.5 flex items-center justify-between relative shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Top Right Save Button (Replaced Logo) */}
            <button
              type="submit"
              form="person-modal-form"
              disabled={!name.trim()}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-emerald-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              title="حفظ البيانات مباشرة"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ</span>
            </button>
            <div className="text-right truncate">
              <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{title}</h3>
              <p className="text-xs text-emerald-200 mt-0.5 truncate">أدخل بيانات الفرد والتحكم بحجم الاسم والخط</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form id="person-modal-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-right">
          {/* Name & Title */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: يوسف أحمد النعيم"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800 font-bold text-base"
                autoFocus
              />
            </div>

            {/* Associated Spouse (Mother Selection) */}
            {parentSpouses.length > 0 && (
              <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/85">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>ارتباط الأم (الزوجة المرتبطة بها الأبناء)</span>
                </label>
                <select
                  value={spouseParentId || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setSpouseParentId(val ? Number(val) : null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:border-emerald-600 outline-none text-sm font-medium bg-white text-slate-800"
                >
                  <option value="">-- اختر الأم / الزوجة --</option>
                  {parentSpouses.map(sp => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} {sp.title ? `(${sp.title})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  سيتم رسم خط الاتصال والغصن المنحني مباشرة من الأم بدلاً من الأب لتوضيح النسب بدقة.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  اللقب (اختياري)
                </label>
                <input
                  type="text"
                  value={personTitle}
                  onChange={e => setPersonTitle(e.target.value)}
                  placeholder="الشيخ / د. / م."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الجنس</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`h-9 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                      gender === 'male'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ذكر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`h-9 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                      gender === 'female'
                        ? 'bg-pink-50 border-pink-500 text-pink-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-pink-600" />
                    <span>أنثى</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED NAME FONT SIZE & SCALE SECTION */}
          <div className="bg-gradient-to-br from-amber-50 to-emerald-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <Type className="w-4 h-4 text-amber-600" />
                <span>التحكم بحجم اسم هذا الشخص (تخصيص مستقل)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-800">
                <input
                  type="checkbox"
                  checked={isCustomFontEnabled}
                  onChange={e => setIsCustomFontEnabled(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-600 focus:ring-0"
                />
                <span>تخصيص</span>
              </label>
            </div>

            {isCustomFontEnabled ? (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>حجم خط الاسم:</span>
                  <span className="font-mono bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md">
                    {customFontSize} px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="72"
                  value={customFontSize}
                  onChange={e => setCustomFontSize(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                {/* Preset Chips */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[
                    { label: 'صغير', size: 14 },
                    { label: 'عادي', size: 18 },
                    { label: 'متوسط', size: 24 },
                    { label: 'كبير', size: 36 },
                    { label: 'بارز', size: 48 },
                    { label: 'ضخم', size: 72 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCustomFontSize(preset.size)}
                      className={`text-xs h-7 px-2 rounded-lg font-medium border transition-all active:scale-95 ${
                        customFontSize === preset.size
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Live Preview Box */}
                <div className="bg-emerald-900 text-white p-3 rounded-xl text-center shadow-inner mt-2">
                  <div className="text-[10px] text-emerald-300 mb-1">معاينة ظهور الاسم:</div>
                  <div
                    style={{ fontSize: `${customFontSize}px` }}
                    className="font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate"
                  >
                    {personTitle ? `${personTitle} ` : ''}
                    {name || 'معاينة الاسم'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                يتبع هذا الفرد الحجم الافتراضي للخط العام المحدد في إعدادات الشجرة ({defaultSize}px). قم بالتفعيل لتحديد حجم خاص به.
              </p>
            )}

            {/* Individual Node Scale */}
            <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-700">
                <span className="flex items-center gap-1 font-semibold">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                  مقياس حجم الورقة / الغصن:
                </span>
                <span className="font-mono text-emerald-800 font-bold">
                  {Math.round(nodeScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                value={Math.round(nodeScale * 100)}
                onChange={e => setNodeScale(parseInt(e.target.value) / 100)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Individual Color Customization */}
            <div className="pt-2 border-t border-amber-200/60 space-y-2">
              <span className="block text-xs font-bold text-slate-700">🎨 تخصيص ألوان هذا الفرد (اختياري):</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">لون الخط:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={textColorOverride || (gender === 'female' ? '#AD1457' : '#062811')}
                      onChange={e => setTextColorOverride(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                    />
                    {textColorOverride && (
                      <button
                        type="button"
                        onClick={() => setTextColorOverride('')}
                        className="text-[10px] text-red-600 font-bold px-1"
                        title="إلغاء التخصيص"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">لون الخلفية:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={colorOverride || '#1B5E20'}
                      onChange={e => setColorOverride(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                    />
                    {colorOverride && (
                      <button
                        type="button"
                        onClick={() => setColorOverride('')}
                        className="text-[10px] text-red-600 font-bold px-1"
                        title="إلغاء التخصيص"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Leaf Style Override */}
            <div className="pt-2 border-t border-amber-200/60 space-y-2">
              <span className="block text-xs font-bold text-slate-700">🍃 شكل ورقة خاص بهذا الشخص (تخصيص مستقل):</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '', name: 'الافتراضي للشجرة' },
                  { id: 'realistic', name: '🍃 نباتية' },
                  { id: 'pointed', name: '🌱 مدببة' },
                  { id: 'rounded', name: '🌿 دائرية' },
                  { id: 'oval', name: '🥚 بيضاوية' },
                  { id: 'heart', name: '❤️ قلبية' },
                  { id: 'fig', name: '🌳 تين' },
                  { id: 'maple', name: '🍁 قيقب' },
                  { id: 'olive', name: '🫒 زيتون' },
                ].map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setLeafStyleOverride(style.id)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                      leafStyleOverride === style.id
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-400'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                سنة / تاريخ الميلاد
              </label>
              <input
                type="text"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                placeholder="مثال: 1985 أو 1405هـ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاريخ الوفاة (إن وجد)
              </label>
              <input
                type="text"
                value={deathDate}
                onChange={e => setDeathDate(e.target.value)}
                placeholder="فارغ إذا كان حياً"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Location & Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">مكان الإقامة</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="مثال: الرياض / دمشق"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف / تواصل</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="اختياري"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              ملاحظات أو نبذة مختصرة
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="السيرة، الإنجازات، فرع العائلة..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors text-xs sm:text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-medium shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <Check className="w-4 h-4" />
              <span>حفظ البيانات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
