import React, { useState, useRef, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  TreePine,
  Hand,
  Search,
  Settings,
  History,
  FolderKanban,
  Menu,
  CheckCircle2,
  RefreshCw,
  Plus,
  FileDown,
  Sparkles,
  ChevronDown,
  Info,
  Link2,
  Link2Off,
  User,
  Users,
} from 'lucide-react';

interface HeaderProps {
  treeName: string;
  isDragMode: boolean;
  moveMode?: 'nodeOnly' | 'subtree';
  onShortClickDragMode: () => void;
  onLongPressDragMode: () => void;
  onToggleDragMode?: () => void;
  isAllowReparenting: boolean;
  onToggleAllowReparenting: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenSnapshots: () => void;
  onOpenTreesManager: () => void;
  onOpenMainMenu: () => void;
  lastSavedTime: number | null;
  isSaving: boolean;
  memberCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  treeName,
  isDragMode,
  moveMode = 'subtree',
  onShortClickDragMode,
  onLongPressDragMode,
  isAllowReparenting,
  onToggleAllowReparenting,
  onOpenSearch,
  onOpenSettings,
  onOpenSnapshots,
  onOpenTreesManager,
  onOpenMainMenu,
  lastSavedTime,
  isSaving,
  memberCount,
}) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const startPress = () => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(55);
      }
      onLongPressDragMode();
    }, 450);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDragButtonClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }
    onShortClickDragMode();
  };
  const [showQuickDropdown, setShowQuickDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowQuickDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl z-40 flex items-center justify-between px-2 sm:px-4 border-b border-emerald-800/70 backdrop-blur-md">
      {/* Brand & Family Name Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenTreesManager}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/15 transition-all active:scale-95"
          title="تبديل أو إنشاء شجرة جديدة"
        >
          <TreePine className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
          <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[100px] sm:max-w-[150px]">
            {treeName || 'الشجرة'}
          </span>
          <span className="text-[10px] sm:text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono font-bold">
            {memberCount}
          </span>
        </button>

        {/* Save Status Dot */}
        <div
          onClick={onOpenSnapshots}
          className="hidden md:flex items-center gap-1 text-[11px] text-emerald-200/80 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800/40 cursor-pointer"
          title="سجل الحفظ والنسخ الاحتياطي"
        >
          {isSaving ? (
            <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
          <span>محفوظ</span>
        </div>
      </div>

      {/* Action Buttons: Unified Minimalist Style */}
      <div className="flex items-center gap-1.5">
        {/* Drag Mode Toggle - Short click for Subtree, Long press for NodeOnly */}
        <button
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          onClick={handleDragButtonClick}
          onContextMenu={e => e.preventDefault()}
          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 border select-none ${
            isDragMode
              ? moveMode === 'nodeOnly'
                ? 'bg-sky-500 text-white border-sky-300 shadow-md ring-2 ring-sky-400/60'
                : 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md ring-2 ring-amber-400/60'
              : 'bg-white/10 hover:bg-white/20 border-white/10 text-white/90 hover:text-white'
          }`}
          title={
            isDragMode
              ? moveMode === 'nodeOnly'
                ? '🖐️ تحريك الفرد المحدد فقط مفعل (انقر نقرة سريعة للتحويل إلى تحريك الأب مع الأبناء)'
                : '🌳 تحريك الأب مع الأبناء مفعل (انقر للإيقاف، أو اضغط مطولاً لتحريك الفرد فقط)'
              : 'زر التحريك: نقرة سريعة لنقل الأب مع الأبناء | ضغطة مطولة لنقل الفرد فقط'
          }
        >
          {isDragMode && moveMode === 'nodeOnly' ? (
            <User className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Hand className="w-4 h-4" />
          )}

          {/* Small mode badge indicator */}
          {isDragMode && (
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center shadow-xs border ${
                moveMode === 'nodeOnly'
                  ? 'bg-sky-200 text-sky-950 border-sky-600'
                  : 'bg-amber-200 text-emerald-950 border-amber-600'
              }`}
            >
              {moveMode === 'nodeOnly' ? '1' : '👥'}
            </span>
          )}
        </button>

        {/* Toggle Allow Reparenting */}
        <button
          onClick={onToggleAllowReparenting}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
            isAllowReparenting
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/50'
              : 'bg-white/10 hover:bg-white/20 border-white/10 text-rose-300 hover:text-rose-200'
          }`}
          title={
            isAllowReparenting
              ? 'نقل وتبني الأولاد: مفعل (انقر لتعطيله والاكتفاء بتحريك الأماكن فقط)'
              : 'نقل وتبني الأولاد: معطل (انقر لتفعيل نقل الأولاد بين الآباء)'
          }
        >
          {isAllowReparenting ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-95"
          title="بحث عن فرد بالاسم"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-95"
          title="إعدادات الخطوط والمظهر"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Main Menu Button */}
        <button
          onClick={onOpenMainMenu}
          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs"
          title="القائمة الرئيسية والخيارات"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden sm:inline">القائمة</span>
        </button>
      </div>
    </header>
  );
};
