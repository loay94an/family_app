import React, { useState } from 'react';
import { X, Plus, Trash2, TreePine, Sparkles, Check } from 'lucide-react';
import { Gender } from '../types/tree';

interface NewFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rootName: string, children: Array<{ name: string; gender: Gender }>) => void;
}

export const NewFamilyModal: React.FC<NewFamilyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [rootName, setRootName] = useState('');
  const [children, setChildren] = useState<Array<{ name: string; gender: Gender }>>([]);

  if (!isOpen) return null;

  const handleAddChild = () => {
    setChildren([...children, { name: '', gender: 'male' }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleUpdateChild = (index: number, name: string, gender: Gender) => {
    const updated = [...children];
    updated[index] = { name, gender };
    setChildren(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootName.trim()) return;
    const validChildren = children.filter(c => c.name.trim().length > 0);
    onCreate(rootName.trim(), validChildren);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-3.5 sm:p-4.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <TreePine className="w-5 h-5" />
            </div>
            <div className="text-right truncate">
              <h3 className="font-bold text-base sm:text-lg leading-tight truncate">عائلة وشجرة جديدة</h3>
              <p className="text-xs text-emerald-200 mt-0.5 truncate">ابدأ شجرة عائلة جديدة مع الجد المؤسس والأبناء</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              form="new-family-form"
              disabled={!rootName.trim()}
              className="h-9 px-3.5 sm:px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-emerald-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all"
              title="إنشاء وحفظ الشجرة"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وإنشاء</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form id="new-family-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الجد المؤسس أو لقب العائلة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rootName}
              onChange={e => setRootName(e.target.value)}
              placeholder="مثال: آل النعيم / الجد أحمد بن محمد"
              className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900 font-bold text-base text-center"
              autoFocus
            />
          </div>

          {/* Children List */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">الأبناء المباشرون (اختياري)</span>
              <button
                type="button"
                onClick={handleAddChild}
                className="h-8 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ابن</span>
              </button>
            </div>

            {children.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-3">
                يمكنك إضافة الأبناء والزوجات والآباء في أي وقت لاحقاً من الشجرة مباشرة
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {children.map((child, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={child.name}
                      onChange={e => handleUpdateChild(idx, e.target.value, child.gender)}
                      placeholder={`اسم الابن/الابنة ${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-xs bg-white"
                    />
                    <select
                      value={child.gender}
                      onChange={e => handleUpdateChild(idx, child.name, e.target.value as Gender)}
                      className="px-2 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveChild(idx)}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>إنشاء الشجرة الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
