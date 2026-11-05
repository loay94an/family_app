export type Gender = 'male' | 'female';

export interface TreeNode {
  id: number;
  name: string;
  title?: string; // لقب مثل الشيخ / الدكتور / المهندس
  parentId: number | null;
  spouseId: number | null;
  spouseParentId?: number | null; // الأم / الزوجة المرتبطة بها الأبناء
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  notes?: string;
  phone?: string;
  location?: string;
  children: TreeNode[];
  x: number;
  y: number;
  level: number;
  leafCount: number;
}

export interface NodeOverride {
  x?: number;
  y?: number;
  autoLayout?: boolean;
  fontSize?: number; // Custom font size for this specific individual
  scale?: number; // Custom scale factor (0.5 to 2.0)
  leafStyle?: LeafStyle;
  colorOverride?: string;
  textColorOverride?: string;
  // Per-layout saved coordinates so botanical (or any layout) user adjustments are never lost
  layoutPositions?: Partial<Record<string, { x: number; y: number }>>;
}

export type LeafStyle =
  | 'realistic'
  | 'palm_frond'
  | 'pointed'
  | 'rounded'
  | 'oval'
  | 'heart'
  | 'fig'
  | 'maple'
  | 'olive'
  | 'royal_medallion'
  | 'heritage_cartouche';

export type TreeCrownShape =
  | 'royal_dome'
  | 'medallion_grand'
  | 'conical_cypress'
  | 'spreading_oak'
  | 'natural_botanical';

export type TrunkStyle = 'grand' | 'twisted' | 'straight' | 'palm' | 'olive' | 'slender' | 'carved' | 'normal' | 'thick';
export type RootStyle = 'deep' | 'buttress' | 'spreading' | 'curling' | 'mound' | 'stone' | 'minimal' | 'palm_base';

export interface TreeSettings {
  // Typography & Font Sizing
  fontFamily: string;
  globalFontScale: number; // 0.6 to 2.0 (multiplier)
  trunkFontSize: number;   // 18 to 60px
  branchFontSize: number;  // 12 to 36px
  leafFontSize: number;    // 10 to 30px
  nameTextColor: string;   // Leaves name text color
  branchTextColor: string; // Branch name text color
  trunkTextColor: string;  // Trunk text color
  nameStrokeColor: string; // Text outline stroke color
  nameStrokeWidth: number; // 0 to 6px
  branchBadgeBgColor: string; // Background color for name badges between branches ('wood' or hex)
  branchBadgeBorderColor: string; // Border color for name badges between branches
  branchTextStrokeColor: string; // Stroke outline color for branch text
  branchTextStrokeWidth: number; // Stroke outline width for branch text
  trunkBgColor: string; // Background color for trunk plaque ('wood' or hex)
  trunkBorderColor: string; // Border color for trunk plaque
  
  // Visual Styles
  showDates: boolean;
  showTitles: boolean;
  showAnimations: boolean;
  leafStyle: LeafStyle;
  branchStyle: 'natural' | 'straight' | 'curved' | 'orthogonal' | 'dotted';
  trunkStyle: TrunkStyle;
  rootStyle?: RootStyle;
  showRoots?: boolean; // إظهار أو إخفاء جذور الشجرة المتناسقة
  rootScale?: number; // حجم وامتداد الجذور (0.5 إلى 1.8)
  treeStructureType?: 'natural' | 'hierarchical'; // النمط العام للشجرة (طبيعي أو هرمي)
  layoutStyle?: 'botanical' | 'palm' | 'cypress' | 'circular' | 'classic' | 'upward' | 'downward' | 'horizontal' | 'custom';
  treeCrownShape?: TreeCrownShape;
  ancestralChain?: string[]; // سلسلة عمود النسب في الجذع (مثل: قحطان -> آل عفالق -> سليمان -> عبد الله)
  showQuranicVerse?: boolean;
  quranicVerseText?: string;
  showHeritageBorder?: boolean;
  maleColor: string;
  femaleColor: string;
  trunkColor: string;
  branchColor1: string;
  branchColor2: string;
  branchColor3: string;
  branchThickness: number;
  trunkThickness: number;
  leafSize: number;
  leafVeinColor: string;
  showLeafGlow?: boolean; // تفعيل أو إخفاء التوهج الضوئي خلف الأوراق والأسماء
  leafGlowColor?: string; // لون التوهج المشع خلف الأوراق
  leafGlowIntensity?: number; // شدة التوهج (0.1 إلى 1.0)
  bgPreset: string;
  skyTopColor: string;
  skyBottomColor: string;
  groundColor: string;
  
  // App state
  dragMode: boolean;
  moveMode?: 'nodeOnly' | 'subtree'; // تحريك الشخص المحدد فقط أو تحريك الفرع بالأبناء
  allowReparenting?: boolean; // تفعيل أو تعطيل نقل الأولاد من شخص لآخر عند سحب الفروع
  autoSave: boolean;
}

export interface TreeSnapshot {
  id: string;
  timestamp: number;
  dateFormatted: string;
  treeName: string;
  memberCount: number;
  generationCount: number;
  data: {
    root: TreeNode;
    counter: number;
    spouses: TreeNode[];
    nodeOverrides: Record<string, NodeOverride>;
    settings: TreeSettings;
  };
  note?: string;
}

export interface SavedFamilyTree {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  memberCount: number;
  root: TreeNode;
  counter: number;
  spouses: TreeNode[];
  nodeOverrides: Record<string, NodeOverride>;
  settings?: Partial<TreeSettings>;
}

export interface StorageExportFormat {
  app: string;
  version: number;
  exportedAt: string;
  treeId: string;
  treeName: string;
  memberCount: number;
  root: TreeNode;
  counter: number;
  spouses: TreeNode[];
  nodeOverrides: Record<string, NodeOverride>;
  settings: TreeSettings;
}
