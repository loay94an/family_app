import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Trash2,
  Plus,
  Clock,
  Users,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { TreeSnapshot } from '../types/tree';

interface SnapshotsModalProps {
  isOpen: boolean;
  snapshots: TreeSnapshot[];
  onClose: () => void;
  onCreateSnapshot: (note?: string) => void;
  onRestoreSnapshot: (snapshot: TreeSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export const SnapshotsModal: React.FC<SnapshotsModalProps> = ({
  isOpen,
  snapshots,
  onClose,
  onCreateSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
}) => {
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSnapshot(newNote.trim() || undefined);
    setNewNote('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">سجل النسخ الاحتياطية</h3>
              <p className="text-xs text-emerald-200 mt-0.5">استعراض واسترجاع نسخ الشجرة المحفوظة محلياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Create Snapshot Button */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>إنشاء نقطة حفظ احتياطية جديدة الآن</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-2.5">
              <label className="block text-xs font-bold text-emerald-950">
                ملاحظة توضيحية لنقطة الحفظ (اختياري)
              </label>
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="مثال: قبل إضافة فرع أحفاد أحمد..."
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs bg-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 h-8 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>حفظ النسخة</span>
                </button>
              </div>
            </form>
          )}

          {/* Snapshots List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              النسخ السابقة ({snapshots.length})
            </h4>

            {snapshots.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">لا توجد نسخ احتياطية محفوظة حتى الآن</p>
                <p className="text-[11px] text-slate-400 mt-1">يتم إنشاء النسخ تلقائياً عند إجراء تعديلات هامة</p>
              </div>
            ) : (
              snapshots.map(snapshot => (
                <div
                  key={snapshot.id}
                  className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {snapshot.treeName}
                      </span>
                      {snapshot.note && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md truncate max-w-[140px]">
                          {snapshot.note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {snapshot.dateFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-600" />
                        {snapshot.memberCount} فرد
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-600" />
                        {snapshot.generationCount} أجيال
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onRestoreSnapshot(snapshot)}
                      className="h-8 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      title="استعادة هذه النسخة للشجرة الحالية"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>
                    {confirmDeleteId === snapshot.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSnapshot(snapshot.id);
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
                        onClick={() => setConfirmDeleteId(snapshot.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="حذف هذه النسخة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
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
