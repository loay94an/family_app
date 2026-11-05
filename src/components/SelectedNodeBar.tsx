import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus,
  Heart,
  Edit,
  Trash2,
  X,
  MoreVertical,
  Info,
  Users,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Type,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { TreeNode, NodeOverride, TreeSettings } from '../types/tree';

interface SelectedNodeBarProps {
  selectedNode: TreeNode;
  nodeOverride?: NodeOverride;
  settings: TreeSettings;
  onClearSelection: () => void;
  onAddChild: (parent: TreeNode) => void;
  onAddSibling: (sibling: TreeNode) => void;
  onAddSpouse: (node: TreeNode) => void;
  onAddParent: (node: TreeNode) => void;
  onEditNode: (node: TreeNode) => void;
  onDeleteNode: (node: TreeNode) => void;
  onViewDetails: (node: TreeNode) => void;
  onUpdateFontSize: (nodeId: number, newFontSize: number) => void;
  onUpdateScale?: (nodeId: number, newScale: number) => void;
  onOpenReparent?: (node: TreeNode) => void;
  onAutoArrangeChildren?: (parent: TreeNode) => void;
  collapsedNodeIds?: Set<number>;
  onToggleCollapseNode?: (nodeId: number) => void;
}

export const SelectedNodeBar: React.FC<SelectedNodeBarProps> = ({
  selectedNode,
  nodeOverride,
  settings,
  onClearSelection,
  onAddChild,
  onAddSibling,
  onAddSpouse,
  onAddParent,
  onEditNode,
  onDeleteNode,
  onViewDetails,
  onUpdateFontSize,
  onOpenReparent,
  onAutoArrangeChildren,
  collapsedNodeIds,
  onToggleCollapseNode,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);

  const isRoot = selectedNode.level === 0;
  const isLeaf = selectedNode.children.length === 0;
  const hasSpouse = selectedNode.spouseId !== null;
  const canAddSibling = selectedNode.parentId !== null;

  const currentFontSize =
    nodeOverride?.fontSize ||
    (isRoot ? settings.trunkFontSize : isLeaf ? settings.leafFontSize : settings.branchFontSize);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setShowFontMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center max-w-[96vw] animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 text-white px-2.5 py-1.5 rounded-2xl shadow-2xl border border-emerald-600/60 flex items-center gap-1.5 backdrop-blur-md">
        {/* Close Selection & Node Name */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-emerald-700/60">
          <button
            onClick={onClearSelection}
            className="w-6 h-6 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-300 transition-colors"
            title="إلغاء التحديد"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-xs sm:text-sm text-amber-300 truncate max-w-[90px] sm:max-w-[140px]">
            {selectedNode.name}
          </span>
        </div>

        {/* Font Size Dropdown Menu (حجم خط الاسم حتى 72) */}
        <div className="relative" ref={fontMenuRef}>
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu);
              setShowMenu(false);
            }}
            className="h-8 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 hover:border-emerald-500 text-amber-300 flex items-center gap-1 text-xs font-bold font-mono transition-all active:scale-95 shadow-xs"
            title="تغيير حجم خط الاسم (من 10 إلى 72)"
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentFontSize}</span>
            <ChevronDown className="w-3 h-3 text-emerald-300" />
          </button>

          {showFontMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-500/40 p-3 flex flex-col gap-2.5 z-50 text-right animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  حجم خط الاسم
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                  {currentFontSize} px
                </span>
              </div>

              {/* Slider for smooth control up to 72 */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="10"
                  max="72"
                  value={currentFontSize}
                  onChange={e => onUpdateFontSize(selectedNode.id, parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>10px</span>
                  <span>40px</span>
                  <span className="text-amber-300 font-bold">72px</span>
                </div>
              </div>

              {/* Quick Preset Buttons Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[12, 16, 20, 24, 28, 36, 48, 72].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onUpdateFontSize(selectedNode.id, size);
                      setShowFontMenu(false);
                    }}
                    className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      currentFontSize === size
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons (Requested: Edit, Eye for Collapse/Expand, Delete direct on bar; others in dropdown) */}
        <div className="flex items-center gap-1">
          {/* 1. Edit Button (التعديل) */}
          <button
            onClick={() => onEditNode(selectedNode)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-amber-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
            title="تعديل بيانات الشخص"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* 2. Eye Button: Toggle Collapse / Expand Children (طي أو فتح الأبناء) */}
          <button
            onClick={() => {
              if (selectedNode.children.length > 0 && onToggleCollapseNode) {
                onToggleCollapseNode(selectedNode.id);
              } else {
                onViewDetails(selectedNode);
              }
            }}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center active:scale-95 transition-all shadow-xs ${
              selectedNode.children.length > 0
                ? collapsedNodeIds?.has(selectedNode.id)
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 hover:text-white'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-emerald-300 hover:text-white'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-slate-300 hover:text-white'
            }`}
            title={
              selectedNode.children.length > 0
                ? collapsedNodeIds?.has(selectedNode.id)
                  ? `إظهار وفتح الأبناء (${selectedNode.children.length})`
                  : `طي وإخفاء الأبناء (${selectedNode.children.length})`
                : 'عرض التفاصيل والبطاقة (لا يوجد أبناء لهذا الشخص)'
            }
          >
            {selectedNode.children.length > 0 ? (
              collapsedNodeIds?.has(selectedNode.id) ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )
            ) : (
              <Eye className="w-4 h-4 opacity-80" />
            )}
          </button>

          {/* 3. Delete Button (الحذف) */}
          <button
            onClick={() => onDeleteNode(selectedNode)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 border border-white/10 text-rose-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
            title="حذف هذا الشخص وفروعه"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* 4. More Options Dropdown (باقي الخيارات في القائمة المنسدلة في شريط الخيارات نفسه) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white/90 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
              title="المزيد من الخيارات"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 p-1.5 flex flex-col gap-1 text-right z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* View Details Card */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onViewDetails(selectedNode);
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-emerald-600/30 rounded-xl transition-colors"
                >
                  <span className="font-medium">عرض البطاقة والتفاصيل</span>
                  <Info className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Add Child */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddChild(selectedNode);
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-emerald-600/30 rounded-xl transition-colors"
                >
                  <span className="font-medium">إضافة ابن / ابنة</span>
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Add Spouse */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddSpouse(selectedNode);
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-rose-600/30 rounded-xl transition-colors"
                >
                  <span className="font-medium">إضافة زوج / زوجة</span>
                  <Heart className="w-4 h-4 text-rose-400" />
                </button>

                {/* Add Sibling (if not root) */}
                {canAddSibling && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAddSibling(selectedNode);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-blue-600/30 rounded-xl transition-colors"
                  >
                    <span className="font-medium">إضافة أخ / أخت</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </button>
                )}

                {/* Add Parent (if root) */}
                {isRoot && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAddParent(selectedNode);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-amber-600/30 rounded-xl transition-colors"
                  >
                    <span className="font-medium">إضافة والد (جد أعلى)</span>
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Move / Reparent to another father */}
                {!isRoot && onOpenReparent && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenReparent(selectedNode);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs text-amber-300 hover:text-white hover:bg-amber-600/30 rounded-xl transition-colors font-medium border-t border-white/10 pt-2"
                  >
                    <span>نقل إلى أب / فرع آخر</span>
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Auto Arrange Children if node has children */}
                {selectedNode.children.length > 0 && onAutoArrangeChildren && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAutoArrangeChildren(selectedNode);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs text-emerald-300 hover:text-white hover:bg-emerald-600/30 rounded-xl transition-colors font-medium border-t border-white/10 pt-2"
                    title="ترتيب الأبناء تلقائياً وإبعادهم عن الأب بدون تراكب"
                  >
                    <span>ترتيب الأبناء تلقائياً ({selectedNode.children.length})</span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                {/* Toggle Collapse / Expand Subtree (if has children) */}
                {selectedNode.children.length > 0 && onToggleCollapseNode && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleCollapseNode(selectedNode.id);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors border-t border-white/10 pt-2"
                  >
                    <span className="font-medium">
                      {collapsedNodeIds?.has(selectedNode.id)
                        ? `إظهار الأبناء (${selectedNode.children.length})`
                        : `طي الأبناء (${selectedNode.children.length})`}
                    </span>
                    {collapsedNodeIds?.has(selectedNode.id) ? (
                      <Eye className="w-4 h-4 text-amber-300" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-white/70" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
