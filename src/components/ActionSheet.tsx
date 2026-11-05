import React from 'react';
import {
  UserPlus,
  Heart,
  Edit,
  Trash2,
  Info,
  Type,
  Maximize2,
  ArrowUpCircle,
  Users,
  Eye,
  EyeOff,
  X,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { TreeNode, NodeOverride, TreeSettings } from '../types/tree';

interface ActionSheetProps {
  isOpen: boolean;
  node: TreeNode | null;
  override?: NodeOverride | null;
  settings: TreeSettings;
  onClose: () => void;
  onAddChild: (parent: TreeNode) => void;
  onAddSibling: (sibling: TreeNode) => void;
  onAddSpouse: (node: TreeNode) => void;
  onAddParent: (node: TreeNode) => void;
  onEditNode: (node: TreeNode) => void;
  onViewDetails: (node: TreeNode) => void;
  onDeleteNode: (node: TreeNode) => void;
  onOpenReparent?: (node: TreeNode) => void;
  onAutoArrangeChildren?: (parent: TreeNode) => void;
  collapsedNodeIds?: Set<number>;
  onToggleCollapseNode?: (nodeId: number) => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  node,
  override,
  settings,
  onClose,
  onAddChild,
  onAddSibling,
  onAddSpouse,
  onAddParent,
  onEditNode,
  onViewDetails,
  onDeleteNode,
  onOpenReparent,
  onAutoArrangeChildren,
  collapsedNodeIds,
  onToggleCollapseNode,
}) => {
  if (!isOpen || !node) return null;

  const isRoot = node.level === 0;
  const hasSpouse = node.spouseId !== null;
  const canAddSibling = node.parentId !== null;
  const isSpouse = !node.parentId && node.spouseId !== null && !isRoot;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-right">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Title */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">{node.name}</h3>
            <span className="text-xs text-slate-500">
              {isRoot ? 'الجذر المؤسس' : `المستوى ${node.level + 1}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Items */}
        <div className="space-y-1 text-xs sm:text-sm font-medium text-slate-800">
          {!isSpouse && (
            <button
              onClick={() => {
                onClose();
                onAddChild(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">إضافة ابن / فرع جديد</div>
                <div className="text-[11px] text-slate-400">إلحاق ابن أو ابنة جديدة لهذا الشخص</div>
              </div>
            </button>
          )}

          {canAddSibling && !isSpouse && (
            <button
              onClick={() => {
                onClose();
                onAddSibling(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">إضافة أخ / أخت</div>
                <div className="text-[11px] text-slate-400">إضافة فرد يشترك في نفس الوالد</div>
              </div>
            </button>
          )}

          {!hasSpouse && !isSpouse && (
            <button
              onClick={() => {
                onClose();
                onAddSpouse(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-pink-50 group-hover:text-pink-700 flex items-center justify-center transition-colors shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">إضافة زوج / زوجة</div>
                <div className="text-[11px] text-slate-400">ربط شريك حياة بجانب الورقة</div>
              </div>
            </button>
          )}

          {!isRoot && !isSpouse && (
            <button
              onClick={() => {
                onClose();
                onAddParent(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center transition-colors shrink-0">
                <ArrowUpCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">إضافة والد / والدة (جيل أعلى)</div>
                <div className="text-[11px] text-slate-400">رفع الشجرة لجيل أقدم سابق</div>
              </div>
            </button>
          )}

          {!isRoot && !isSpouse && onOpenReparent && (
            <button
              onClick={() => {
                onClose();
                onOpenReparent(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-amber-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-200 flex items-center justify-center transition-colors shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-amber-900">نقل الشخص إلى أب / فرع آخر</div>
                <div className="text-[11px] text-amber-700/80">تغيير الأب والربط بأي شخص آخر في الشجرة</div>
              </div>
            </button>
          )}

          {node.children.length > 0 && onAutoArrangeChildren && (
            <button
              onClick={() => {
                onClose();
                onAutoArrangeChildren(node);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 flex items-center justify-center transition-colors shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-emerald-900">ترتيب الأبناء تلقائياً وبشكل متباعد</div>
                <div className="text-[11px] text-emerald-700/80">إعادة ترتيب وتوزيع جميع الأبناء بعيداً عن الأب دون أي تراكب</div>
              </div>
            </button>
          )}

          {node.children.length > 0 && onToggleCollapseNode && (
            <button
              onClick={() => {
                onClose();
                onToggleCollapseNode(node.id);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                {collapsedNodeIds?.has(node.id) ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">
                  {collapsedNodeIds?.has(node.id)
                    ? `إظهار الأبناء والذرية (${node.children.length})`
                    : `طي الأبناء والذرية (${node.children.length})`}
                </div>
                <div className="text-[11px] text-slate-400">إخفاء أو إظهار كافة الفروع التابعة</div>
              </div>
            </button>
          )}

          <div className="h-px bg-slate-100 my-1" />

          <button
            onClick={() => {
              onClose();
              onEditNode(node);
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <Edit className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">تعديل البيانات وحجم الاسم</div>
              <div className="text-[11px] text-slate-400">تغيير الاسم، اللقب، وتخصيص حجم الخط</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onViewDetails(node);
            }}
            className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">عرض الملف الكامل وتفاصيل الذرية</div>
              <div className="text-[11px] text-slate-400">إحصائيات كاملة عن الأبناء والأحفاد</div>
            </div>
          </button>

          <div className="h-px bg-slate-100 my-1" />

          <button
            onClick={() => {
              onClose();
              onDeleteNode(node);
            }}
            className="w-full p-2.5 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-3 transition-colors text-right group active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-red-700 flex items-center justify-center transition-colors shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-red-600">{isRoot ? 'حذف العائلة بالكامل' : 'حذف هذا الفرع'}</div>
              <div className="text-[11px] text-red-400">إزالة هذا الشخص وفروعه التابعة من الشجرة</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
