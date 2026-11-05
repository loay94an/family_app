import React, { useState, useMemo } from 'react';
import { Search, X, User, MapPin, Calendar, Award } from 'lucide-react';
import { TreeNode } from '../types/tree';

interface SearchModalProps {
  isOpen: boolean;
  root: TreeNode | null;
  spouses: TreeNode[];
  onClose: () => void;
  onSelectPerson: (node: TreeNode) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  root,
  spouses,
  onClose,
  onSelectPerson,
}) => {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Flatten all members for search
  const allMembers = useMemo(() => {
    const list: TreeNode[] = [];
    if (!root) return list;

    const traverse = (node: TreeNode) => {
      list.push(node);
      node.children.forEach(traverse);
    };
    traverse(root);
    spouses.forEach(s => list.push(s));
    return list;
  }, [root, spouses]);

  // Filter members
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMembers.filter(m => {
      const matchName = m.name.toLowerCase().includes(q) || (m.title && m.title.toLowerCase().includes(q));
      const matchNotes = m.notes && m.notes.toLowerCase().includes(q);
      const matchLoc = m.location && m.location.toLowerCase().includes(q);
      const matchGender = genderFilter === 'all' || m.gender === genderFilter;

      if (!q) return matchGender;
      return (matchName || matchNotes || matchLoc) && matchGender;
    });
  }, [allMembers, query, genderFilter]);

  // Cap displayed list for high performance with 1000+ members
  const displayedList = useMemo(() => {
    return filtered.slice(0, 100);
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-300" />
              <span>البحث في أفراد العائلة</span>
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="اكتب اسم الشخص أو اللقب أو البلد..."
              className="w-full pr-10 pl-4 py-3 rounded-2xl bg-white text-slate-900 font-bold placeholder-slate-400 outline-none text-sm shadow-inner"
              autoFocus
            />
            <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-emerald-700" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95 ${
                genderFilter === 'all'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              الكل ({allMembers.length})
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95 ${
                genderFilter === 'male'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              الذكور
            </button>
            <button
              onClick={() => setGenderFilter('female')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95 ${
                genderFilter === 'female'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              الإناث
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-1.5 flex-1">
          {filtered.length > 100 && (
            <div className="text-center text-xs text-amber-700 bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-200 mb-2 font-medium">
              يتم عرض أول 100 نتيجة من أصل {filtered.length} شخص. يرجى تخصيص البحث لمزيد من الدقة.
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">لم يتم العثور على أي نتائج تطابق بحثك</p>
            </div>
          ) : (
            displayedList.map(person => (
              <div
                key={person.id}
                onClick={() => {
                  onSelectPerson(person);
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-2xl border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between gap-3 group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      person.gender === 'female'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-950 flex items-center gap-1.5">
                      {person.title && (
                        <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md font-medium">
                          {person.title}
                        </span>
                      )}
                      <span>{person.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {person.birthDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {person.birthDate}
                        </span>
                      )}
                      {person.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {person.location}
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {person.level === 0 ? 'الجذر المؤسس' : `الجيل ${person.level + 1}`}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-xs text-slate-600 font-medium bg-white px-3 py-1 rounded-xl border border-slate-200 group-hover:bg-emerald-700 group-hover:border-emerald-700 group-hover:text-white transition-all">
                  تحديد
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
