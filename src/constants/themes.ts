import { TreeSettings, TreeCrownShape, LeafStyle, RootStyle } from '../types/tree';

export const defaultSettings: TreeSettings = {
  fontFamily: 'Tajawal',
  globalFontScale: 1.0,
  trunkFontSize: 24,
  branchFontSize: 16,
  leafFontSize: 15,
  nameTextColor: '#062811',
  branchTextColor: '#2A170C',
  trunkTextColor: '#2A170C',
  nameStrokeColor: '#FFFFFF',
  nameStrokeWidth: 1.5,
  branchBadgeBgColor: 'wood',
  branchBadgeBorderColor: '#3E2723',
  branchTextStrokeColor: '#FFFFFF',
  branchTextStrokeWidth: 1.0,
  trunkBgColor: 'wood',
  trunkBorderColor: '#381C0F',
  
  showDates: true,
  showTitles: true,
  showAnimations: false,
  leafStyle: 'realistic',
  branchStyle: 'natural',
  trunkStyle: 'grand',
  rootStyle: 'deep',
  showRoots: true,
  rootScale: 1.0,
  layoutStyle: 'botanical',
  treeStructureType: 'natural',
  treeCrownShape: 'royal_dome',
  ancestralChain: [],
  showQuranicVerse: false,
  quranicVerseText: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا',
  showHeritageBorder: false,
  maleColor: 'realisticGreen',
  femaleColor: 'pink',
  trunkColor: 'realisticOak',
  branchColor1: '#2E180E',
  branchColor2: '#5D351D',
  branchColor3: '#8E5528',
  branchThickness: 1.15,
  trunkThickness: 1.25,
  leafSize: 105,
  leafVeinColor: '#74B72E',
  showLeafGlow: true,
  leafGlowColor: '#FEF08A',
  leafGlowIntensity: 0.6,
  bgPreset: 'clean',
  skyTopColor: '#F8FAFC',
  skyBottomColor: '#F1F5F9',
  groundColor: '#4A2810',
  
  dragMode: false,
  moveMode: 'nodeOnly',
  allowReparenting: true,
  autoSave: true,
};

export const glowColorPresets = [
  { name: 'ذهبي ساطع (ملكي)', color: '#FEF08A', shadow: 'rgba(254, 240, 138, 0.75)' },
  { name: 'زمردي ربيعي', color: '#4ADE80', shadow: 'rgba(74, 222, 128, 0.75)' },
  { name: 'أبيض قمري ناصع', color: '#FFFFFF', shadow: 'rgba(255, 255, 255, 0.85)' },
  { name: 'فيروزي سماوي', color: '#38BDF8', shadow: 'rgba(56, 189, 248, 0.75)' },
  { name: 'كهرماني دافئ', color: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.75)' },
  { name: 'وردي لطيف', color: '#F472B6', shadow: 'rgba(244, 114, 182, 0.75)' },
  { name: 'بنفسجي نوراني', color: '#C084FC', shadow: 'rgba(192, 132, 252, 0.75)' },
  { name: 'أخضر ليموني نضر', color: '#A3E635', shadow: 'rgba(163, 230, 53, 0.75)' },
];

export const branchBadgePresets = [
  { id: 'wood', name: 'خشب تراثي معتق (افتراضي)', bg: 'wood', border: '#3E2723', text: '#2A170C' },
  { id: 'parchment', name: 'عاجي ومخطوطات عتيقة', bg: '#FFFDF5', border: '#B45309', text: '#78350F' },
  { id: 'gold', name: 'ذهبي أندلسي فاخر', bg: '#FEF3C7', border: '#D97706', text: '#78350F' },
  { id: 'white', name: 'أبيض لؤلؤي رخامي', bg: '#FFFFFF', border: '#CBD5E1', text: '#0F172A' },
  { id: 'emerald', name: 'زمردي إسلامي ملكي', bg: '#064E3B', border: '#34D399', text: '#ECFDF5' },
  { id: 'navy', name: 'كحلي ياقوتي فخم', bg: '#0F172A', border: '#38BDF8', text: '#F0F9FF' },
  { id: 'carbon', name: 'كربوني داكن معاصر', bg: '#1E293B', border: '#64748B', text: '#F8FAFC' },
  { id: 'sand', name: 'رملي صحراوي دافئ', bg: '#FDF6E2', border: '#A89F91', text: '#422006' },
];

export const textColorPresets = [
  { name: 'بني محروق تراثي', color: '#2A170C' },
  { name: 'أسود فحمي ملكي', color: '#0F172A' },
  { name: 'أبيض ناصع', color: '#FFFFFF' },
  { name: 'ذهبي معتق', color: '#D97706' },
  { name: 'أخضر غابات زمردي', color: '#064E3B' },
  { name: 'كحلي ملكي', color: '#1E3A8A' },
  { name: 'عنابي أندلسي', color: '#881337' },
  { name: 'أصفر ذهبي ساطع', color: '#FEF08A' },
];

export const arabicFonts = [
  { id: 'Tajawal', name: 'تجوال (عصري ومقروء)', css: 'font-["Tajawal"]' },
  { id: 'Cairo', name: 'القاهرة (أنيق وواضح)', css: 'font-["Cairo"]' },
  { id: 'Almarai', name: 'المراعي (هندسي وحديث)', css: 'font-["Almarai"]' },
  { id: 'Amiri', name: 'أميري (نسخي وتراثي أصيل)', css: 'font-["Amiri"]' },
  { id: 'Noto Kufi Arabic', name: 'نوتو كوفي (كوفي رسمي)', css: 'font-["Noto_Kufi_Arabic"]' },
  { id: 'Changa', name: 'تشانغا (عريض ومميز)', css: 'font-["Changa"]' },
  { id: 'Lateef', name: 'لطيف (جمالي ومزخرف)', css: 'font-["Lateef"]' },
  { id: 'Reem Kufi', name: 'ريم كوفي (كوفي هندسي)', css: 'font-["Reem_Kufi"]' },
];

export const colorSchemes = {
  male: {
    realisticGreen: { name: 'أوراق ربيعية واقعية (كما بالصورة)', colors: ['#D4F67B', '#8BD434', '#43A047', '#1B5E20'] },
    green: { name: 'أخضر طبيعي', colors: ['#DCEDC8', '#AED581', '#7CB342', '#33691E'] },
    darkgreen: { name: 'أخضر زمردي عميق', colors: ['#C8E6C9', '#81C784', '#388E3C', '#1B5E20'] },
    lightgreen: { name: 'أخضر ليموني نضر', colors: ['#F1F8E9', '#DCEDC8', '#9CCC65', '#558B2F'] },
    forest: { name: 'أخضر غابات ملكي', colors: ['#E8F5E9', '#A5D6A7', '#4CAF50', '#1B5E20'] },
    teal: { name: 'فيروزي / بترولي', colors: ['#E0F2F1', '#80CBC4', '#26A69A', '#004D40'] },
  },
  female: {
    pink: { name: 'وردي ناعم', colors: ['#FCE4EC', '#F48FB1', '#EC407A', '#AD1457'] },
    red: { name: 'ياقوتي ملكي', colors: ['#FFEBEE', '#EF9A9A', '#E53935', '#B71C1C'] },
    purple: { name: 'بنفسجي فاخر', colors: ['#F3E5F5', '#CE93D8', '#AB47BC', '#6A1B9A'] },
    orange: { name: 'برتقالي مشرق', colors: ['#FFF3E0', '#FFCC80', '#FB8C00', '#E65100'] },
    rose: { name: 'زهري رقيق', colors: ['#FFF0F5', '#F48FB1', '#F06292', '#C2185B'] },
  },
  trunk: {
    realisticOak: { name: 'خشب شجري واقعي (كما بالصورة)', colors: ['#1C0E07', '#381C0F', '#5D331A', '#875129', '#B3753E', '#875129', '#381C0F'] },
    brown: { name: 'بني خشبي طبيعي', colors: ['#1A0F0A', '#3E2723', '#5D4037', '#795548', '#8D6E63', '#5D4037', '#1A0F0A'] },
    darkbrown: { name: 'خشب أبنوس معتق', colors: ['#0D0805', '#24140D', '#3E2723', '#4E342E', '#3E2723', '#24140D', '#0D0805'] },
    lightbrown: { name: 'خشب ساج ذهبي', colors: ['#3E2723', '#5D4037', '#795548', '#A1887F', '#BCAAA4', '#795548', '#3E2723'] },
    tan: { name: 'سنديان برونزي', colors: ['#5D4037', '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#8D6E63', '#5D4037'] },
  },
};

export const bgPresets = [
  { id: 'clean', name: '✨ لوحة عائلية نقية (كما بالصورة)', colors: ['#FFFFFF', '#FAFBFD', '#F3F6FA', '#E2E8F0'] },
  { id: 'nature', name: '🌲 طبيعة خضراء وأفق سماوي', colors: ['#E0F2FE', '#BAE6FD', '#E8F5E9', '#86EFAC'] },
  { id: 'parchment', name: '📜 ورق مخطوطات تراثي عتيق', colors: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#D97706'] },
  { id: 'sunset', name: '🌅 شروق وغروب دافئ', colors: ['#FFF1F2', '#FFE4E6', '#FED7AA', '#FDBA74'] },
  { id: 'night', name: '🌌 سماء ليلية فخمة', colors: ['#0F172A', '#1E293B', '#334155', '#064E3B'] },
  { id: 'spring', name: '🌸 ربيع مزهر لطيف', colors: ['#FDF2F8', '#FCE7F3', '#F3E8FF', '#DCFCE7'] },
];

export const trunkStylePresets = [
  {
    id: 'grand',
    name: '🌳 شامخ وتراثي عريق',
    desc: 'جذع ضخم متين بلحاء عتيق وتجاعيد خشبية مهيبة ترتقي للأعلى',
    badge: 'الأكثر شعبية',
  },
  {
    id: 'twisted',
    name: '🌪️ مجدول وتوأمي حلزوني',
    desc: 'ساقان متداخلان يلتفان بحلزونية ساحرة كأشجار الغابات المعمرة',
    badge: 'فني أسطوري',
  },
  {
    id: 'straight',
    name: '🏛️ عمودي أسطواني كلاسيكي',
    desc: 'ساق مستقيم صلب بقوام متناسق ووقار تراثي متزن وأنيق',
    badge: 'هندسي متوازن',
  },
  {
    id: 'palm',
    name: '🌴 نخلة عربية باسقة',
    desc: 'ساق نخلة أصيل مدرج بحلقات الكرب والألياف الطبيعية المباركة',
    badge: 'طابع عربي أصيل',
  },
  {
    id: 'olive',
    name: '🫒 زيتونة معمرة مجوفة',
    desc: 'جذع زيتون أثري ملتف به تجاويف وشقوق تدل على العمر المديد',
    badge: 'مبارك وعريق',
  },
  {
    id: 'slender',
    name: '🌱 رشيق وناعم انسيابي',
    desc: 'ساق ناعم رقيق يبرز كثافة وتفرع الأغصان العلوية بأناقة',
    badge: 'عصري ناعم',
  },
  {
    id: 'carved',
    name: '✨ منحوت ومزخرف تراثي',
    desc: 'عمود خشبي منحوت بأطواق وزخارف أندلسية إسلامية مذهبة',
    badge: 'فخامة ملكية',
  },
];

export const rootStylePresets: Array<{
  id: RootStyle;
  name: string;
  desc: string;
  badge: string;
  icon: string;
}> = [
  {
    id: 'deep',
    name: '🌱 جذور وتدية عميقة وعتيقة',
    desc: 'جذور خشبية ضخمة معمرة تضرب بعمق الأرض مع تفرعات وتدية مجسمة ومظللة بعروق بارزة',
    badge: 'الأكثر عمقاً وواقعية',
    icon: '🌱',
  },
  {
    id: 'buttress',
    name: '🛡️ أكتاف دعامية عملاقة ومضلعة',
    desc: 'دعامات جذرية مضلعة ثلاثية الأبعاد ترسو بهيبة وثبات تاريخي كأعظم أشجار الغابات المعمرة',
    badge: 'قوة وهيبة ملكية',
    icon: '🌳',
  },
  {
    id: 'palm_base',
    name: '🌴 كرناف وقاعدة النخلة التراثية',
    desc: 'قاعدة النخلة العربية بتفاصيل الكرناف والليف والعرجون الأصيل مع عروق جذرية ليفية',
    badge: 'أصالة النخلة العربية',
    icon: '🌴',
  },
  {
    id: 'spreading',
    name: '🕸️ جذور وارفة ممتدة بأناقة أندلسية',
    desc: 'امتداد جذري واسع ينساب على الأرض بانحناءات رشيقة تحاكي الخط العربي والتفرعات الأندلسية',
    badge: 'امتداد عريق واسع',
    icon: '🌿',
  },
  {
    id: 'curling',
    name: '➰ جذور لولبية ملتفة وفنية',
    desc: 'جذور حلزونية فنية ساحرة مستوحاة من أشجار الزيتون والبونساي المعمرة مع لمسات براعم خضراء',
    badge: 'فن طبيعي ساحر',
    icon: '🌾',
  },
  {
    id: 'mound',
    name: '⛰️ روضة ربيعية وتلة خضراء مزهرة',
    desc: 'تلة عشبية زمردية نضرة مع زهور برية طبيعية وأعشاب وتجذر ترابي ناعم تحت قاعدة الجذع',
    badge: 'طبيعة ربيعية نضرة',
    icon: '🌷',
  },
  {
    id: 'stone',
    name: '🏛️ مصطبة رخامية أندلسية مذهبة',
    desc: 'حوض ومصطبة رخامية ملكية بأقواس ونقوش إسلامية هندسية مع تطعيم بماء الذهب',
    badge: 'تراث معماري أندلسي',
    icon: '🏛️',
  },
  {
    id: 'minimal',
    name: '🍃 قاعدة نباتية رشيقة وهادئة',
    desc: 'قوس جذري رشيق وهادئ بحواف مذهبة وظلال انسيابية تناسب التصاميم الحديثة',
    badge: 'هادئ وعصري',
    icon: '🍃',
  },
];

export const treeCrownShapePresets: Array<{
  id: TreeCrownShape;
  name: string;
  desc: string;
  badge: string;
  icon: string;
}> = [
  {
    id: 'royal_dome',
    name: '👑 القبة الملكية الأندلسية (البيضوية)',
    desc: 'مستوحى من شجرة السكيت والشبرمي: تاج بيضوي فخم متناسق، تلتف الأغصان وتملأ الأسماء كامل القبة بتناظر رائع',
    badge: 'طراز ملكي فاخر',
    icon: '👑',
  },
  {
    id: 'medallion_grand',
    name: '🏅 شجرة الميداليات الملكية الكبرى',
    desc: 'مستوحى من شجرة مغامس وقبيلة بلي: ميداليات ذهبية كبيرة لكبار الأبناء، وتوزيع دائري تراتبي للأجيال',
    badge: 'ميداليات ذهبية',
    icon: '🏅',
  },
  {
    id: 'conical_cypress',
    name: '🌲 السرو الصنوبري التراثي',
    desc: 'مستوحى من شجرة العوضات: قبة هرمية متناسقة شامخة تتسع بانسيابية مدرجة نحو الأسفل',
    badge: 'هرمي صنوبري',
    icon: '🌲',
  },
  {
    id: 'spreading_oak',
    name: '🌳 السنديان التراثي الوارف',
    desc: 'مستوحى من شجرة الحماد: شجرة عريضة منبسطة وارفة الظلال تغطي عرض اللوحة بهيبة عائلية',
    badge: 'عريض وارف',
    icon: '🌳',
  },
  {
    id: 'natural_botanical',
    name: '🌿 النمط النباتي الطبيعي الحر',
    desc: 'تفرع شجري عضوي تلقائي ينساب بحرية وفق تفرع الأسر والأبناء',
    badge: 'طبيعي تلقائي',
    icon: '🌿',
  },
];

export const leafStylePresets: Array<{
  id: LeafStyle;
  name: string;
  desc: string;
  badge: string;
}> = [
  {
    id: 'realistic',
    name: '🌿 ورقة نباتية زمردية طبيعية',
    desc: 'ورقة خضراء مدببة غضة مع عروق نضرة وكتابة واضحة (شجرة السكيت والشبرمي)',
    badge: 'الأكثر واقعية',
  },
  {
    id: 'royal_medallion',
    name: '🏅 ميدالية ذهبية ملكية',
    desc: 'قرص ذهبي معدني أندلسي فخم بإطار بارز وظلال عميقة (شجرة مغامس وقبيلة بلي)',
    badge: 'ذهبي فاخر',
  },
  {
    id: 'heritage_cartouche',
    name: '📜 خرطوشة عاجية مذهبة',
    desc: 'كبسولة عاجية مذهبة مع إطار مزدوج تراثي أصيل (شجرة الحنيشل والحماد)',
    badge: 'تراث أصيل',
  },
  {
    id: 'palm_frond',
    name: '🌴 خوص وسعف النخلة',
    desc: 'سعفة نخلة خضراء مذهبة مقوسة برقة مع عروق بارزة وأناقة عربية',
    badge: 'سعف نخلة عربي',
  },
  {
    id: 'pointed',
    name: '🍃 ورقة لوزية مشطوفة',
    desc: 'ورقة مشطوفة رشيقة تمنح كثافة عالية وانسيابية عصرية',
    badge: 'رشيقة وواضحة',
  },
  {
    id: 'rounded',
    name: '⚪ ورقة دائرية ناعمة',
    desc: 'شكل دائري بيضوي رقيق يسهل قراءة الأسماء من كافة الزوايا',
    badge: 'هادئ وبسيط',
  },
  {
    id: 'olive',
    name: '🫒 ورقة زيتون أندلسية',
    desc: 'ورقة زيتون ملساء نحيلة بمسحة رمادية فضية مباركة',
    badge: 'زيتون مبارك',
  },
];
