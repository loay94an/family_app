import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  Search,
  ArrowRightLeft,
  GitBranch,
  ShieldAlert,
  ChevronLeft,
  Users,
} from 'lucide-react';
import { TreeNode } from '../types/tree';

interface ReparentModalProps {
  isOpen: boolean;
  node: TreeNode | null;
  root: TreeNode | null;
  onClose: () => void;
  onReparent: (childId: number, newParentId: number) => void;
}

export const ReparentModal: React.FC<ReparentModalProps> = ({
  isOpen,
  node,
  root,
  onClose,
  onReparent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  // Collect all descendant IDs to disallow circular parenting
  const disallowedIds = useMemo(() => {
    const ids = new Set<number>();
    if (!node) return ids;

    const traverse = (n: TreeNode) => {
      ids.add(n.id);
      n.children.forEach(traverse);
    };
    traverse(node);
    return ids;
  }, [node]);

  // Flatten all nodes in tree with hierarchical path
  const allEligibleParents = useMemo(() => {
    if (!root || !node) return [];

    const list: Array<{
      node: TreeNode;
      path: string[];
      isCurrentParent: boolean;
      isDisallowed: boolean;
    }> = [];

    const traverse = (current: TreeNode, parentPath: string[]) => {
      const currentPath = [...parentPath, current.name];
      const isCurrentParent = node.parentId === current.id;
      const isDisallowed = disallowedIds.has(current.id);

      list.push({
        node: current,
        path: parentPath,
        isCurrentParent,
        isDisallowed,
      });

      current.children.forEach(c => traverse(c, currentPath));
    };

    traverse(root, []);
    return list;
  }, [root, node, disallowedIds]);

  // Filter based on search query
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return allEligibleParents;
    const query = searchQuery.trim().toLowerCase();
    return allEligibleParents.filter(
      item =>
        item.node.name.toLowerCase().includes(query) ||
        (item.node.title && item.node.title.toLowerCase().includes(query)) ||
        item.path.some(p => p.toLowerCase().includes(query))
    );
  }, [allEligibleParents, searchQuery]);

  if (!isOpen || !node) return null;

  const currentParentItem = allEligibleParents.find(item => item.isCurrentParent);
  const currentParentName = currentParentItem ? currentParentItem.node.name : 'الجذر المؤسس';

  const handleConfirm = () => {
    if (!selectedParentId) return;
    onReparent(node.id, selectedParentId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-amber-300">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                نقل الشخص وتغيير الأب / الفرع
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                تعديل النسب والربط بأب أو فرع آخر داخل الشجرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Person & Current Parent Info */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200/70 shadow-xs w-full sm:w-auto">
            <span className="text-slate-500 font-bold">الشخص المنقول:</span>
            <span className="font-extrabold text-emerald-950 text-sm">{node.name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <ChevronLeft className="w-4 h-4 text-emerald-600 hidden sm:block rotate-180" />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto">
            <span className="text-slate-500 font-bold">الأب الحالي:</span>
            <span className="font-bold text-slate-800">{currentParentName}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم عن الأب الجديد المراد النقل إليه..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm text-slate-800"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Parents List */}
        <div className="p-4 pt-1 overflow-y-auto flex-1 space-y-2 max-h-[45vh]">
          {filteredParents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              لم يتم العثور على أي شخص يطابق البحث
            </div>
          ) : (
            filteredParents.map(({ node: parentNode, path, isCurrentParent, isDisallowed }) => {
              const isSelected = selectedParentId === parentNode.id;

              return (
                <button
                  key={parentNode.id}
                  type="button"
                  disabled={isDisallowed || isCurrentParent}
                  onClick={() => setSelectedParentId(parentNode.id)}
                  className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                    isDisallowed
                      ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                      : isCurrentParent
                      ? 'bg-amber-50/80 border-amber-300/80 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrentParent
                          ? 'bg-amber-200 text-amber-900'
                          : isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {parentNode.gender === 'female' ? '♀' : '♂'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {parentNode.name}
                        </span>
                        {parentNode.title && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {parentNode.title}
                          </span>
                        )}
                        {isCurrentParent && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            الأب الحالي
                          </span>
                        )}
                        {isDisallowed && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            فرع / ابن لنفس الشخص
                          </span>
                        )}
                      </div>

                      {path.length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[240px] sm:max-w-[320px]">
                          سلسلة النسب: {path.join(' ← ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {parentNode.children.length} أبناء
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <UserCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!selectedParentId}
            onClick={handleConfirm}
            className="flex-1 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تأكيد النقل للأب المختار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
