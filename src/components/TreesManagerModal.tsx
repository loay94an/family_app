import React, { useState } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  TreePine,
  Check,
  Trash2,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';

interface TreesManagerModalProps {
  isOpen: boolean;
  activeTreeId: string;
  treesList: Array<{ id: string; name: string; memberCount: number; updatedAt: number }>;
  onClose: () => void;
  onSwitchTree: (treeId: string) => void;
  onCreateTree: (name: string) => void;
  onDeleteTree: (treeId: string) => void;
  onLoad1000DemoTree?: () => void;
  onLoadRabiahTree?: () => void;
  onLoadExperimentalTree?: () => void;
}

export const TreesManagerModal: React.FC<TreesManagerModalProps> = ({
  isOpen,
  activeTreeId,
  treesList,
  onClose,
  onSwitchTree,
  onCreateTree,
  onDeleteTree,
  onLoad1000DemoTree,
  onLoadRabiahTree,
  onLoadExperimentalTree,
}) => {
  const [showNewTreeForm, setShowNewTreeForm] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    onCreateTree(newTreeName.trim());
    setNewTreeName('');
    setShowNewTreeForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">إدارة شجرات العائلة</h3>
              <p className="text-xs text-emerald-200 mt-0.5">التبديل بين أشجار العائلة المختلفة أو إنشاء شجرة جديدة</p>
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!showNewTreeForm ? (
              <button
                onClick={() => setShowNewTreeForm(true)}
                className="flex-1 h-11 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-950 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>إنشاء شجرة جديدة</span>
              </button>
            ) : (
              <form onSubmit={handleCreate} className="w-full bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300 space-y-3">
                <label className="block text-xs font-bold text-emerald-950">
                  اسم الشجرة أو العائلة الجديدة: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTreeName}
                  onChange={e => setNewTreeName(e.target.value)}
                  placeholder="مثال: عائلة بني تميم / شجرة آل فلان..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-medium"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTreeForm(false)}
                    className="h-9 px-4 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <TreePine className="w-4 h-4" />
                    <span>تأكيد الإنشاء</span>
                  </button>
                </div>
              </form>
            )}

            {(onLoadExperimentalTree || onLoadRabiahTree) && (
              <button
                onClick={() => {
                  if (onLoadExperimentalTree) onLoadExperimentalTree();
                  else if (onLoadRabiahTree) onLoadRabiahTree();
                  onClose();
                }}
                className="h-11 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
                title="تحميل الشجرة التجريبية الكبرى (2,551 فرداً: جد + 50 ابن + 50 حفيد لكل ابن) لاختبار الأداء والسرعة"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>🔬 شجرة تجريبية (2,551 فرداً: جد + 50 ابن + 50 حفيد)</span>
              </button>
            )}

            {onLoad1000DemoTree && (
              <button
                onClick={() => {
                  onLoad1000DemoTree();
                  onClose();
                }}
                className="h-11 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-950 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                title="تحميل مشجرة التقاء نسب الرسول ﷺ مع الخلفاء الراشدين الأربعة"
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>مشجرة التقاء نسب الرسول ﷺ مع الخلفاء الراشدين</span>
              </button>
            )}
          </div>

          {/* List of Trees */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الشجرات المحفوظة في جهازك ({treesList.length})
            </h4>

            {treesList.map(tree => {
              const isActive = tree.id === activeTreeId;
              const dateStr = new Date(tree.updatedAt).toLocaleDateString('ar-SA', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={tree.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/40 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <TreePine className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {tree.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                            النشطة حالياً
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-bold text-emerald-700">
                          <Users className="w-3 h-3 text-emerald-600" />
                          {tree.memberCount} فرد
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && confirmDeleteId !== tree.id && (
                      <button
                        onClick={() => {
                          onSwitchTree(tree.id);
                          onClose();
                        }}
                        className="h-8 px-3.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium transition-all active:scale-95 shadow-xs"
                      >
                        فتح
                      </button>
                    )}
                    {treesList.length > 1 && (
                      confirmDeleteId === tree.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTree(tree.id);
                              setConfirmDeleteId(null);
                            }}
                            className="h-7 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium shadow-xs active:scale-95 transition-colors"
                          >
                            تأكيد
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 px-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(tree.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="حذف هذه الشجرة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
