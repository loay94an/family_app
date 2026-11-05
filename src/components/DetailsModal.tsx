import React from 'react';
import {
  X,
  User,
  Users,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Edit,
  Type,
  Maximize2,
  ArrowRightLeft,
} from 'lucide-react';
import { TreeNode, NodeOverride, TreeSettings } from '../types/tree';

interface DetailsModalProps {
  isOpen: boolean;
  node: TreeNode | null;
  override?: NodeOverride | null;
  settings: TreeSettings;
  onClose: () => void;
  onEdit: (node: TreeNode) => void;
  onOpenReparent?: (node: TreeNode) => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  node,
  override,
  settings,
  onClose,
  onEdit,
  onOpenReparent,
}) => {
  if (!isOpen || !node) return null;

  // Helper to count descendants
  const countDescendants = (n: TreeNode): number => {
    let count = 0;
    n.children.forEach(c => {
      count += 1 + countDescendants(c);
    });
    return count;
  };

  const descendantsCount = countDescendants(node);
  const isFemale = node.gender === 'female';
  const effectiveFontSize =
    override?.fontSize ||
    (node.level === 0
      ? settings.trunkFontSize
      : node.children.length === 0
      ? settings.leafFontSize
      : settings.branchFontSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center justify-between shadow-md ${
            isFemale
              ? 'bg-gradient-to-r from-pink-900 via-pink-800 to-pink-900'
              : 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {isFemale ? '♀' : '♂'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {node.title && (
                  <span className="text-xs bg-amber-300 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                    {node.title}
                  </span>
                )}
                <h3 className="font-bold text-lg leading-tight">{node.name}</h3>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {node.level === 0 ? '🌳 الجد المؤسس (الجذر)' : `🌿 الجيل رقم ${node.level + 1}`}
              </p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">عدد الأبناء المباشرين</span>
              <span className="text-lg font-bold text-emerald-800 font-mono">
                {node.children.length}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">إجمالي الذرية والأحفاد</span>
              <span className="text-lg font-bold text-emerald-800 font-mono">
                {descendantsCount}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">تاريخ / سنة الميلاد:</span>
              <span className="font-bold text-slate-800">{node.birthDate || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">الحالة:</span>
              <span className="font-bold text-slate-800">
                {node.deathDate ? `متوفى (${node.deathDate})` : 'حي يرزق أطال الله بعمره'}
              </span>
            </div>
            {node.location && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">مكان الإقامة:</span>
                <span className="font-bold text-slate-800">{node.location}</span>
              </div>
            )}
            {node.phone && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">رقم التواصل:</span>
                <span className="font-mono text-slate-800 font-bold">{node.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-bold">حجم خط الاسم على الشجرة:</span>
              <span className="font-mono text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                {effectiveFontSize} px {override?.fontSize ? '(مخصص)' : '(افتراضي)'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {node.notes && (
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
              <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>ملاحظات وسيرة:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {node.notes}
              </p>
            </div>
          )}
          {/* Quick Reparent / Move Parent Button (if not root) */}
          {node.level > 0 && onOpenReparent && (
            <button
              onClick={() => {
                onClose();
                onOpenReparent(node);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              <span>نقل هذا الشخص إلى أب / فرع آخر</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(node);
            }}
            className="flex-1 h-10 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Edit className="w-4 h-4" />
            <span>تعديل البيانات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
