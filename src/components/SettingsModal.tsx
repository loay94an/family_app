import React, { useState } from 'react';
import {
  X,
  Type,
  Palette,
  Sliders,
  Sparkles,
  HardDrive,
  Check,
  RotateCcw,
  Crown,
  Layers,
  Plus,
  Trash2,
  Move,
  GitFork,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { TreeSettings } from '../types/tree';
import {
  arabicFonts,
  colorSchemes,
  bgPresets,
  branchBadgePresets,
  leafStylePresets,
  rootStylePresets,
} from '../constants/themes';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  settings: TreeSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: TreeSettings) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'shape' | 'typography' | 'appearance' | 'storage'>('shape');
  const [newAncestorInput, setNewAncestorInput] = useState('');
  const storageStats = StorageService.getStorageStats();

  if (!isOpen) return null;

  const updateSettingsBatch = (updates: Partial<TreeSettings>) => {
    onUpdateSettings({ ...settings, ...updates });
  };

  const updateSetting = <K extends keyof TreeSettings>(key: K, value: TreeSettings[K]) => {
    updateSettingsBatch({ [key]: value });
  };

  const handleAddAncestor = () => {
    const trimmed = newAncestorInput.trim();
    if (!trimmed) return;
    const currentChain = settings.ancestralChain || [];
    updateSetting('ancestralChain', [...currentChain, trimmed]);
    setNewAncestorInput('');
  };

  const handleRemoveAncestor = (index: number) => {
    const currentChain = settings.ancestralChain || [];
    updateSetting('ancestralChain', currentChain.filter((_, i) => i !== index));
  };

  const handleMoveAncestor = (index: number, direction: 'up' | 'down') => {
    const currentChain = [...(settings.ancestralChain || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentChain.length) return;
    const temp = currentChain[index];
    currentChain[index] = currentChain[targetIndex];
    currentChain[targetIndex] = temp;
    updateSetting('ancestralChain', currentChain);
  };

  const handleReverseAncestors = () => {
    const currentChain = [...(settings.ancestralChain || [])];
    updateSetting('ancestralChain', currentChain.reverse());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200 text-right">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">إعدادات الشجرة والتصميم</h3>
              <p className="text-[11px] text-emerald-200 mt-0.5 truncate">تخصيص الهيكل، الخطوط، والمظهر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation - Isolated 4 Categories */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 sm:px-3 pt-2 gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('shape')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'shape'
                ? 'border-emerald-600 text-emerald-950 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>شكل الشجرة</span>
          </button>
          
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'typography'
                ? 'border-emerald-600 text-emerald-950 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-emerald-700" />
            <span>إعدادات الخطوط</span>
          </button>
          
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'appearance'
                ? 'border-emerald-600 text-emerald-950 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>المظهر والألوان</span>
          </button>
          
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'storage'
                ? 'border-emerald-600 text-emerald-950 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>الحفظ والتخزين</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* ======================================================== */}
          {/* TAB 1: TREE STRUCTURE & SHAPE (شكل وهيكل الشجرة) */}
          {/* ======================================================== */}
          {activeTab === 'shape' && (
            <div className="space-y-4">
              
              {/* Primary Split: Natural vs Hierarchical */}
              <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1 shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    updateSettingsBatch({
                      treeStructureType: 'natural',
                      layoutStyle: (settings.layoutStyle === 'classic' || settings.layoutStyle === 'upward' || settings.layoutStyle === 'downward' || settings.layoutStyle === 'horizontal')
                        ? 'botanical'
                        : settings.layoutStyle
                    });
                  }}
                  className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    (settings.treeStructureType || 'natural') === 'natural'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="text-sm">🌳</span>
                  <span>النمط الطبيعي (واقعي)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSettingsBatch({
                      treeStructureType: 'hierarchical',
                      layoutStyle: (settings.layoutStyle === 'botanical' || settings.layoutStyle === 'palm' || settings.layoutStyle === 'circular' || !settings.layoutStyle)
                        ? 'downward'
                        : settings.layoutStyle
                    });
                  }}
                  className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.treeStructureType === 'hierarchical'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="text-sm">📐</span>
                  <span>النمط الهرمي (مربعات)</span>
                </button>
              </div>

              {/* NATURAL STRUCTURE CONFIGURATION */}
              {(settings.treeStructureType || 'natural') === 'natural' ? (
                <>
                  {/* 1. Tree Layout Style */}
                  <div className="space-y-2 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-700" />
                        <span>شكل وهيكل تفرع الشجرة الطبيعية</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {settings.layoutStyle === 'botanical' || !settings.layoutStyle ? '🌳 الأساسي (محفوظ يدوياً)' : 'تخطيط مخصص'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'botanical', name: 'شجرة طبيعية', symbol: '🌳', badge: 'الأساسي' },
                        { id: 'palm', name: 'شجرة نخلة', symbol: '🌴', badge: 'سعف عربي' },
                        { id: 'circular', name: 'توزيع دائري', symbol: '⭕' },
                      ].map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => updateSetting('layoutStyle', style.id as any)}
                          className={`relative p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            (settings.layoutStyle || 'botanical') === style.id
                              ? 'border-emerald-700 ring-2 ring-emerald-500 bg-white font-bold shadow-xs'
                              : 'border-slate-200 bg-white/70 hover:border-slate-300'
                          }`}
                        >
                          {style.badge && (
                            <span className="absolute -top-1.5 -right-1 text-[8px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                              {style.badge}
                            </span>
                          )}
                          <span className="text-sm block mb-0.5">{style.symbol}</span>
                          <span className="text-[11px] text-slate-800 font-bold block truncate">{style.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-800/80 bg-emerald-100/50 p-1.5 rounded-lg border border-emerald-200/60 leading-relaxed">
                      💡 <strong>ملاحظة:</strong> الشكل الطبيعي هو الأساسي ويحفظ كافة التعديلات والمواقع التي تقوم بتحريكها وترتيبها بيدك، وتُستعاد كاملة حتى عند تجربة أشكال أخرى والعودة للشكل الطبيعي.
                    </p>
                  </div>

                  {/* 2. Branch Style */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <GitFork className="w-4 h-4 text-emerald-600" />
                      <span>نمط انحناء وتوجيه الأغصان</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'natural', name: 'انسيابي' },
                        { id: 'straight', name: 'مستقيم' },
                        { id: 'orthogonal', name: 'متعامد' },
                        { id: 'curved', name: 'قوسي' },
                        { id: 'dotted', name: 'منقّط' },
                      ].map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => updateSetting('branchStyle', b.id as any)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            (settings.branchStyle || 'natural') === b.id
                              ? 'border-emerald-700 ring-2 ring-emerald-500 bg-emerald-50 font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xs text-slate-800 font-bold block truncate">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Authentic Botanical Roots System */}
                  <div className="space-y-3 bg-gradient-to-br from-emerald-50/70 via-amber-50/50 to-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>جذور شجرة الحياة التراثية (مطابقة للأصل)</span>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showRoots !== false}
                          onChange={e => updateSetting('showRoots', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                      </label>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      🌱 شبكة جذور نباتية متناسقة دائرية تنبثق من قاعدة الجذع وتتفرع بانسيابية نصف دائرية لترسيخ عراقة الشجرة وأصالتها وفق الرسم التراثي المعتمد.
                    </p>

                    {settings.showRoots !== false && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>امتداد وحجم الجذور السفلية:</span>
                            <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[11px]">
                              {Math.round((settings.rootScale || 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="1.5"
                            step="0.05"
                            value={settings.rootScale || 1.0}
                            onChange={e => updateSetting('rootScale', parseFloat(e.target.value))}
                            className="w-full accent-emerald-700 cursor-pointer"
                          />
                        </div>

                        {/* Root Style Icons Picker */}
                        <div className="pt-2.5 border-t border-emerald-200/50">
                          <label className="block text-[11px] font-bold text-emerald-900 mb-1.5">
                            بيئة وتشكيل أيقونات الجذور الإضافية:
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {rootStylePresets.map(preset => {
                              const isSelected = (settings.rootStyle || 'deep') === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => updateSetting('rootStyle', preset.id)}
                                  className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-emerald-700 ring-2 ring-emerald-500 bg-white font-bold shadow-xs'
                                      : 'border-slate-200/60 bg-white/70 hover:border-slate-300'
                                  }`}
                                  title={preset.name}
                                >
                                  <span className="text-base block mb-0.5">{preset.icon}</span>
                                  <span className="text-[9px] text-slate-800 font-bold block truncate">
                                    {preset.name.replace(/[^\u0600-\u06FF\s]/g, '').trim().split(' ')[0]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Trunk & Branch Thickness Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-amber-950">
                        <span>سماكة الجذع:</span>
                        <span className="font-mono bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded text-[11px]">
                          {Math.round((settings.trunkThickness || 1.15) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.2"
                        step="0.05"
                        value={settings.trunkThickness || 1.15}
                        onChange={e => updateSetting('trunkThickness', parseFloat(e.target.value))}
                        className="w-full accent-amber-700 cursor-pointer"
                      />
                    </div>

                    <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-amber-950">
                        <span>سماكة الأغصان:</span>
                        <span className="font-mono bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded text-[11px]">
                          {Math.round((settings.branchThickness || 1.0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.0"
                        step="0.05"
                        value={settings.branchThickness || 1.0}
                        onChange={e => updateSetting('branchThickness', parseFloat(e.target.value))}
                        className="w-full accent-amber-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 5. Leaf Shape & Size */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>حجم بطاقات الأسماء والأوراق:</span>
                      </span>
                      <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-900">
                        {settings.leafSize || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="160"
                      step="5"
                      value={settings.leafSize || 100}
                      onChange={e => updateSetting('leafSize', parseInt(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />

                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 mb-2">شكل الورقة / البطاقة</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {leafStylePresets.map(style => {
                          const isSelected = (settings.leafStyle || 'realistic') === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => updateSetting('leafStyle', style.id)}
                              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-50 font-bold shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <span className="text-[11px] text-slate-800 block truncate">{style.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* HIERARCHICAL STRUCTURE CONFIGURATION */}
                  {/* 1. Hierarchical Layout Direction */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-slate-600" />
                        <span>توجيه الهيكل الهرمي ومسار الرسم</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'downward', name: 'هرمي للأسفل', symbol: '⬇️' },
                        { id: 'classic', name: 'هرمي للأعلى', symbol: '⬆️' },
                        { id: 'horizontal', name: 'أفقي جانبي', symbol: '➡️' },
                      ].map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => updateSetting('layoutStyle', style.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            (settings.layoutStyle || 'downward') === style.id
                              ? 'border-slate-800 ring-2 ring-slate-600 bg-white font-bold shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-base block mb-0.5">{style.symbol}</span>
                          <span className="text-[11px] text-slate-800 font-bold block truncate">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Hierarchical Line Style */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <GitFork className="w-4 h-4 text-slate-600" />
                      <span>نمط الأنابيب والخطوط الرابطة</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'orthogonal', name: 'خطوط متعامدة (كالصورة)', symbol: '📐' },
                        { id: 'straight', name: 'خطوط مستقيمة', symbol: '📈' },
                        { id: 'dotted', name: 'منقّط كلاسيكي', symbol: '💬' },
                      ].map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => updateSetting('branchStyle', b.id as any)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            (settings.branchStyle || 'orthogonal') === b.id
                              ? 'border-slate-800 ring-2 ring-slate-600 bg-slate-50 font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm block mb-0.5">{b.symbol}</span>
                          <span className="text-[11px] text-slate-800 font-bold block truncate">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Card Size Slider */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-600" />
                        <span>حجم الخانات والمربعات:</span>
                      </span>
                      <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-900">
                        {settings.leafSize || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="160"
                      step="5"
                      value={settings.leafSize || 100}
                      onChange={e => updateSetting('leafSize', parseInt(e.target.value))}
                      className="w-full accent-slate-700 cursor-pointer"
                    />
                  </div>

                  {/* 4. Hierarchical Card Shape Presets Picker */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700">شكل وتصميم خانات ومربعات الهيكل الهرمي:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {leafStylePresets.map(style => {
                        const isSelected = (settings.leafStyle || 'realistic') === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => updateSetting('leafStyle', style.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-slate-800 ring-2 ring-slate-600 bg-slate-50 font-bold shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="text-[11px] text-slate-800 block truncate">{style.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* 6. Interaction & Drag Options */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-emerald-600" />
                    <span>نطاق تحريك اليد (Drag Scope):</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSetting('moveMode', 'nodeOnly')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      (settings.moveMode || 'nodeOnly') === 'nodeOnly'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    👤 الشخص المحدد فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting('moveMode', 'subtree')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      settings.moveMode === 'subtree'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    🌳 الفرع كاملاً بالأبناء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Move className="w-3.5 h-3.5 text-emerald-600" />
                      <span>السحب والتحريك اليدوي</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.dragMode}
                      onChange={e => updateSetting('dragMode', e.target.checked)}
                      className="rounded text-emerald-600 accent-emerald-600 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إعادة تعيين الأب بالسحب</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.allowReparenting !== false}
                      onChange={e => updateSetting('allowReparenting', e.target.checked)}
                      className="rounded text-emerald-600 accent-emerald-600 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TYPOGRAPHY & SIZES (إعدادات الخطوط والنصوص) */}
          {/* ======================================================== */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              
              {/* 1. Arabic Font Selection */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">نوع الخط العربي المعتمد</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {arabicFonts.map(font => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => updateSetting('fontFamily', font.id)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        settings.fontFamily === font.id
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                      style={{ fontFamily: font.id }}
                    >
                      {font.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Global Font Scale */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-amber-950">
                    <Type className="w-4 h-4 text-amber-600" />
                    <span>مقياس حجم النصوص العام:</span>
                  </span>
                  <span className="font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-extrabold text-xs">
                    {Math.round(settings.globalFontScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="180"
                  step="5"
                  value={Math.round(settings.globalFontScale * 100)}
                  onChange={e => updateSetting('globalFontScale', parseInt(e.target.value) / 100)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* 3. Specific Level Font Sizes */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-emerald-950">
                  أحجام النصوص حسب المستوى
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>اسم الجذع:</span>
                      <span className="font-mono text-emerald-800">{settings.trunkFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={settings.trunkFontSize}
                      onChange={e => updateSetting('trunkFontSize', parseInt(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>أسماء الفروع:</span>
                      <span className="font-mono text-emerald-800">{settings.branchFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="36"
                      value={settings.branchFontSize}
                      onChange={e => updateSetting('branchFontSize', parseInt(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>أسماء الأفراد:</span>
                      <span className="font-mono text-emerald-800">{settings.leafFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="28"
                      value={settings.leafFontSize}
                      onChange={e => updateSetting('leafFontSize', parseInt(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Text Colors & Stroke Outlines */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  ألوان النصوص والتحديد الخارجي
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>لون أسماء الأفراد:</span>
                    <input
                      type="color"
                      value={settings.nameTextColor.startsWith('#') ? settings.nameTextColor : '#062811'}
                      onChange={e => updateSetting('nameTextColor', e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>لون أسماء الفروع:</span>
                    <input
                      type="color"
                      value={settings.branchTextColor.startsWith('#') ? settings.branchTextColor : '#2A170C'}
                      onChange={e => updateSetting('branchTextColor', e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>لون اسم الجذع:</span>
                    <input
                      type="color"
                      value={settings.trunkTextColor.startsWith('#') ? settings.trunkTextColor : '#2A170C'}
                      onChange={e => updateSetting('trunkTextColor', e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>لون إطار وتحديد الخط:</span>
                    <input
                      type="color"
                      value={settings.nameStrokeColor.startsWith('#') ? settings.nameStrokeColor : '#FFFFFF'}
                      onChange={e => {
                        updateSettingsBatch({
                          nameStrokeColor: e.target.value,
                          branchTextStrokeColor: e.target.value,
                        });
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                  </div>
                </div>

                {/* Text Outline Stroke Width */}
                <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200 mt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>سماكة إطار الخط الأبيض:</span>
                    <span className="font-mono text-emerald-800">{settings.nameStrokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.5"
                    value={settings.nameStrokeWidth}
                    onChange={e => updateSetting('nameStrokeWidth', parseFloat(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* 5. Additional Typography Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTitles !== false}
                    onChange={e => updateSetting('showTitles', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>عرض الألقاب (د. / م.)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDates}
                    onChange={e => updateSetting('showDates', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>عرض سنوات الميلاد</span>
                </label>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: APPEARANCE & THEMES (المظهر والألوان) */}
          {/* ======================================================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              
              {/* 1. Canvas Background Preset */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">خلفية لوحة الشجرة</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {bgPresets.map(bg => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => updateSetting('bgPreset', bg.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        settings.bgPreset === bg.id
                          ? 'border-emerald-700 ring-2 ring-emerald-500 bg-white shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md shadow-inner shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`,
                        }}
                      />
                      <span className="text-[11px] text-slate-800 truncate">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Male & Female Leaf Color Palettes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-emerald-950">لون أوراق الذكور ♂</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(colorSchemes.male).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSetting('maleColor', key)}
                        className={`p-1.5 rounded-xl border text-center transition-all ${
                          settings.maleColor === key
                            ? 'border-emerald-700 ring-2 ring-emerald-500 bg-white font-bold'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="w-full h-4 rounded mb-1" style={{ background: val.colors[2] }} />
                        <span className="text-[10px] text-slate-700 block truncate">{val.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-pink-950">لون أوراق الإناث ♀</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(colorSchemes.female).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSetting('femaleColor', key)}
                        className={`p-1.5 rounded-xl border text-center transition-all ${
                          settings.femaleColor === key
                            ? 'border-pink-600 ring-2 ring-pink-400 bg-white font-bold'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="w-full h-4 rounded mb-1" style={{ background: val.colors[2] }} />
                        <span className="text-[10px] text-slate-700 block truncate">{val.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Branch & Trunk Badges Style */}
              <div className="space-y-2.5 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>مظهر بطاقات الأجداد والجذع</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {branchBadgePresets.map(preset => {
                    const isSelected =
                      settings.branchBadgeBgColor === preset.bg ||
                      (preset.bg === 'wood' && (!settings.branchBadgeBgColor || settings.branchBadgeBgColor === 'wood'));
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateSettingsBatch({
                            branchBadgeBgColor: preset.bg,
                            branchBadgeBorderColor: preset.border,
                            branchTextColor: preset.text,
                            trunkBgColor: preset.bg,
                            trunkBorderColor: preset.border,
                            trunkTextColor: preset.text,
                          });
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-600 ring-2 ring-amber-500 bg-white font-bold shadow-xs'
                            : 'border-slate-200 bg-white/80 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[11px] text-slate-800 block truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Luminous Glow */}
              <div className="space-y-2.5 bg-gradient-to-br from-amber-500/10 to-teal-500/10 p-3.5 rounded-2xl border border-amber-300/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <label className="text-xs font-bold text-slate-900">
                      توهج وإضاءة إبراز الأسماء
                    </label>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.showLeafGlow !== false}
                      onChange={e => updateSetting('showLeafGlow', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {settings.showLeafGlow !== false && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>لون التوهج:</span>
                      <input
                        type="color"
                        value={settings.leafGlowColor || '#FEF08A'}
                        onChange={e => updateSetting('leafGlowColor', e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>شدة التوهج:</span>
                        <span className="font-mono text-amber-700">
                          {Math.round((settings.leafGlowIntensity ?? 0.6) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={settings.leafGlowIntensity ?? 0.6}
                        onChange={e => updateSetting('leafGlowIntensity', parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Ancestral Chain on Trunk */}
              <div className="space-y-2.5 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>سلسلة الأجداد في الجذع (عمود النسب)</span>
                  </label>
                  {settings.ancestralChain && settings.ancestralChain.length > 1 && (
                    <button
                      type="button"
                      onClick={handleReverseAncestors}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold flex items-center gap-1 transition-colors"
                      title="عكس الترتيب"
                    >
                      <ArrowUpDown className="w-3 h-3 text-amber-700" />
                      <span>عكس الترتيب</span>
                    </button>
                  )}
                </div>

                {/* Chain Pills & Reordering List */}
                <div className="space-y-1.5 min-h-[42px] p-2 bg-white rounded-xl border border-amber-200 max-h-48 overflow-y-auto">
                  {(!settings.ancestralChain || settings.ancestralChain.length === 0) ? (
                    <div className="text-center py-2 text-xs text-slate-400">
                      لا توجد أجداد مضافة بعد. أضف أسماء الأجداد لترتيب عمود النسب على الجذع.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {settings.ancestralChain.map((ancestor, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === (settings.ancestralChain?.length || 1) - 1;
                        return (
                          <div
                            key={`chain-${idx}-${ancestor}`}
                            className="flex items-center justify-between gap-1.5 py-1 px-2.5 bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-950 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-amber-700 text-white text-[10px] flex items-center justify-center font-mono shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate">{ancestor}</span>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveAncestor(idx, 'up')}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isFirst
                                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                                    : 'hover:bg-amber-200 text-amber-800'
                                }`}
                                title="تحريك لأعلى"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveAncestor(idx, 'down')}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isLast
                                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                                    : 'hover:bg-amber-200 text-amber-800'
                                }`}
                                title="تحريك لأسفل"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAncestor(idx)}
                                className="w-5 h-5 rounded hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors mr-0.5"
                                title="حذف"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Input Add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم الجد (مثال: سليمان، آل عفالق)..."
                    value={newAncestorInput}
                    onChange={e => setNewAncestorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAncestor();
                      }
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAncestor}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                  {settings.ancestralChain && settings.ancestralChain.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSetting('ancestralChain', [])}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors shrink-0"
                      title="مسح كل السلسلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 6. Quranic Verse Banner */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>الآية الكريمة في القمة</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showQuranicVerse ?? true}
                      onChange={e => updateSetting('showQuranicVerse', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {(settings.showQuranicVerse ?? true) && (
                  <textarea
                    rows={2}
                    value={settings.quranicVerseText || 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا'}
                    onChange={e => updateSetting('quranicVerseText', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: STORAGE & SYSTEM (الحفظ والتخزين) */}
          {/* ======================================================== */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-emerald-700" />
                  <span>بيانات الحفظ المحلي</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] text-slate-500">الأشجار</div>
                    <div className="text-base font-bold text-emerald-800 font-mono">
                      {storageStats.treesCount}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] text-slate-500">النسخ الاحتياطية</div>
                    <div className="text-base font-bold text-emerald-800 font-mono">
                      {storageStats.snapshotsCount}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] text-slate-500">المساحة</div>
                    <div className="text-base font-bold text-emerald-800 font-mono">
                      {storageStats.usedKB} KB
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800">الحفظ التلقائي الفوري</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={e => updateSetting('autoSave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Reset Defaults */}
              <div className="pt-2">
                <button
                  onClick={onResetSettings}
                  className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الإعدادات الافتراضية</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>حفظ وتطبيق</span>
          </button>
        </div>

      </div>
    </div>
  );
};
