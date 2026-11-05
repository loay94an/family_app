import { TreeNode, TreeSettings, TreeSnapshot, SavedFamilyTree, StorageExportFormat, NodeOverride } from '../types/tree';
import { defaultSettings } from '../constants/themes';

const STORAGE_KEYS = {
  ACTIVE_TREE_ID: 'family_tree_active_id',
  TREES_LIST: 'family_trees_registry_v2',
  TREE_DATA_PREFIX: 'family_tree_data_',
  SNAPSHOTS_PREFIX: 'family_tree_snapshots_',
  SETTINGS: 'family_tree_global_settings',
};

// Helper to count members
export function countTreeMembers(node: TreeNode | null, spouses: TreeNode[] = []): number {
  if (!node) return 0;
  let count = 1;
  const countInner = (n: TreeNode) => {
    for (const child of n.children) {
      count++;
      countInner(child);
    }
  };
  countInner(node);
  return count + spouses.length;
}

// Helper to get max generations
export function countGenerations(node: TreeNode | null): number {
  if (!node) return 0;
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(c => countGenerations(c)));
}

/**
 * Generate the Illustrative Pedigree Tree:
 * "التقاء الخلفاء الراشدين في النسب مع النبي ﷺ"
 * Exactly matching the historical tree shown in the reference image:
 * Root: عدنان -> معد -> نزار -> مضر -> إلياس -> مدركة -> خزيمة -> كنانة -> النضر -> مالك -> فهر -> غالب -> لؤي -> كعب
 * Splitting into:
 * 1. عدي -> ... -> عمر بن الخطاب رضي الله عنه (الفاروق)
 * 2. مرة -> تيم -> ... -> أبو بكر الصديق رضي الله عنه
 * 3. عبد مناف -> عبد شمس -> ... -> عثمان بن عفان رضي الله عنه (ذو النورين)
 * 4. عبد المطلب -> أبو طالب -> علي بن أبي طالب رضي الله عنه (أمير المؤمنين)
 * 5. عبد المطلب -> عبد الله -> النبي محمد ﷺ (خاتم النبيين وسيد الخلق)
 */
export function generateProphetAndCaliphsTree(): { root: TreeNode; spouses: TreeNode[]; counter: number } {
  let counter = 1;

  const createNode = (
    name: string,
    parentId: number | null,
    level: number,
    gender: 'male' | 'female' = 'male',
    title?: string,
    notes?: string
  ): TreeNode => {
    return {
      id: counter++,
      name,
      title,
      parentId,
      spouseId: null,
      gender,
      notes,
      children: [],
      x: 0,
      y: 0,
      level,
      leafCount: 1,
    };
  };

  // 1. عدنان (الجد الأعلى الجامع)
  const root = createNode('عدنان', null, 0, 'male', 'الجد الجامع للنسب النبوي والخلفاء الراشدين', 'جد العرب العدنانية، ومنه يلتقي نسب رسول الله ﷺ بجميع الخلفاء الراشدين الأربعة.');
  
  // 2. معد
  const maadd = createNode('معد', root.id, 1, 'male');
  root.children.push(maadd);

  // 3. نزار
  const nizar = createNode('نزار', maadd.id, 2, 'male');
  maadd.children.push(nizar);

  // 4. مضر
  const mudar = createNode('مضر', nizar.id, 3, 'male');
  nizar.children.push(mudar);

  // 5. إلياس
  const ilyas = createNode('إلياس', mudar.id, 4, 'male');
  mudar.children.push(ilyas);

  // 6. مدركة
  const mudrikah = createNode('مدركة', ilyas.id, 5, 'male');
  ilyas.children.push(mudrikah);

  // 7. خزيمة
  const khuzaymah = createNode('خزيمة', mudrikah.id, 6, 'male');
  mudrikah.children.push(khuzaymah);

  // 8. كنانة
  const kinanah = createNode('كنانة', khuzaymah.id, 7, 'male');
  khuzaymah.children.push(kinanah);

  // 9. النضر
  const alNadr = createNode('النضر', kinanah.id, 8, 'male');
  kinanah.children.push(alNadr);

  // 10. مالك
  const malik = createNode('مالك', alNadr.id, 9, 'male');
  alNadr.children.push(malik);

  // 11. فهر
  const fihr = createNode('فهر', malik.id, 10, 'male');
  malik.children.push(fihr);

  // 12. غالب
  const ghalib = createNode('غالب', fihr.id, 11, 'male');
  fihr.children.push(ghalib);

  // 13. لؤي
  const luayy = createNode('لؤي', ghalib.id, 12, 'male');
  ghalib.children.push(luayy);

  // 14. كعب
  const kaab = createNode('كعب', luayy.id, 13, 'male', 'كعب بن لؤي (ملتقى نسب عمر بن الخطاب)');
  luayy.children.push(kaab);

  // ==========================================
  // BRANCH 1 (Far Left): بنو عدي -> عمر بن الخطاب رضي الله عنه
  // ==========================================
  const adiy = createNode('عدي', kaab.id, 14, 'male', 'جد بني عدي');
  const razah = createNode('رزاح', adiy.id, 15, 'male');
  const qurt = createNode('قرط', razah.id, 16, 'male');
  const abdullah_adiy = createNode('عبد الله', qurt.id, 17, 'male');
  const rabah = createNode('رباح', abdullah_adiy.id, 18, 'male'); // رباح بن عبد الله بن قرط بن رزاح
  const abdul_uzza = createNode('عبد العزى', rabah.id, 19, 'male');
  const nufayl = createNode('نفيل', abdul_uzza.id, 20, 'male');
  const al_khattab = createNode('الخطاب', nufayl.id, 21, 'male', 'والد الفاروق');
  const umar = createNode(
    'عمر',
    al_khattab.id,
    22,
    'male',
    'أمير المؤمنين الفاروق رضي الله عنه',
    'الخليفة الراشد الثاني، يلتقي مع النبي ﷺ في الجد الثامن (كعب بن لؤي).'
  );

  adiy.children.push(razah);
  razah.children.push(qurt);
  qurt.children.push(abdullah_adiy);
  abdullah_adiy.children.push(rabah);
  rabah.children.push(abdul_uzza);
  abdul_uzza.children.push(nufayl);
  nufayl.children.push(al_khattab);
  al_khattab.children.push(umar);

  // ==========================================
  // BRANCH 2 (Center & Right): مرة بن كعب
  // ==========================================
  const murrah = createNode('مرة', kaab.id, 14, 'male', 'مرة بن كعب (ملتقى نسب أبي بكر الصديق)');

  // Adding to kaab: adiy first (left), murrah second (center/right)
  kaab.children.push(adiy, murrah);

  // ==========================================
  // SUB-BRANCH 2.1 (Center): كلاب بن مرة
  // ==========================================
  const kilab = createNode('كلاب', murrah.id, 15, 'male');

  // ==========================================
  // SUB-BRANCH 2.2 (Far Right): بنو تيم -> أبو بكر الصديق رضي الله عنه
  // ==========================================
  const taym = createNode('تيم', murrah.id, 15, 'male', 'جد بني تيم');
  const saad_taym = createNode('سعد', taym.id, 16, 'male');
  const kaab_taym = createNode('كعب', saad_taym.id, 17, 'male');
  const amr_taym = createNode('عمرو', kaab_taym.id, 18, 'male');
  const aamir_taym = createNode('عامر', amr_taym.id, 19, 'male');
  const uthman_abu_quhafah = createNode('عثمان', aamir_taym.id, 20, 'male', 'أبو قحافة');
  const abu_bakr = createNode(
    'أبو بكر',
    uthman_abu_quhafah.id,
    21,
    'male',
    'خليفة رسول الله والصديق رضي الله عنه',
    'الخليفة الراشد الأول وأول من آمن من الرجال، يلتقي مع النبي ﷺ في الجد السادس (مرة بن كعب).'
  );

  taym.children.push(saad_taym);
  saad_taym.children.push(kaab_taym);
  kaab_taym.children.push(amr_taym);
  amr_taym.children.push(aamir_taym);
  aamir_taym.children.push(uthman_abu_quhafah);
  uthman_abu_quhafah.children.push(abu_bakr);

  // murrah's children: kilab (center/left), taym (right)
  murrah.children.push(kilab, taym);

  // ==========================================
  // CONTINUING MAIN LINE FROM كلاب
  // ==========================================
  const qusayy = createNode('قصي', kilab.id, 16, 'male');
  kilab.children.push(qusayy);

  const abdul_manaf = createNode('عبد مناف', qusayy.id, 17, 'male', 'عبد مناف بن قصي (ملتقى نسب عثمان بن عفان)');
  qusayy.children.push(abdul_manaf);

  // ==========================================
  // BRANCH 3: بنو هاشم (Center Left)
  // ==========================================
  const hashim = createNode('هاشم', abdul_manaf.id, 18, 'male');

  // ==========================================
  // BRANCH 4: بنو عبد شمس -> عثمان بن عفان رضي الله عنه (Center Right)
  // ==========================================
  const abd_shams = createNode('عبد شمس', abdul_manaf.id, 18, 'male', 'جد بني عبد شمس');
  const umayyah = createNode('أمية', abd_shams.id, 19, 'male');
  const abul_aas = createNode('أبي العاص', umayyah.id, 20, 'male');
  const affan = createNode('عفان', abul_aas.id, 21, 'male');
  const uthman_ibn_affan = createNode(
    'عثمان',
    affan.id,
    22,
    'male',
    'أمير المؤمنين ذو النورين رضي الله عنه',
    'الخليفة الراشد الثالث وجامع القرآن الكريم، يلتقي مع النبي ﷺ في الجد الرابع (عبد مناف بن قصي).'
  );

  abd_shams.children.push(umayyah);
  umayyah.children.push(abul_aas);
  abul_aas.children.push(affan);
  affan.children.push(uthman_ibn_affan);

  // abdul_manaf's children: hashim (left/center), abd_shams (right/center)
  abdul_manaf.children.push(hashim, abd_shams);

  // ==========================================
  // FROM هاشم -> عبد المطلب
  // ==========================================
  const abdul_muttalib = createNode('عبد المطلب', hashim.id, 19, 'male', 'شيبة الحمد (ملتقى نسب علي بن أبي طالب)');
  hashim.children.push(abdul_muttalib);

  // ==========================================
  // FROM عبد المطلب -> أبي طالب وعلي بن أبي طالب (Left)
  // ==========================================
  const abu_talib = createNode('أبي طالب', abdul_muttalib.id, 20, 'male');
  const ali = createNode(
    'علي',
    abu_talib.id,
    21,
    'male',
    'أمير المؤمنين رضي الله عنه',
    'الخليفة الراشد الرابع وابن عم رسول الله ﷺ، يلتقي مع النبي ﷺ في جده المباشر (عبد المطلب بن هاشم).'
  );
  abu_talib.children.push(ali);

  // ==========================================
  // FROM عبد المطلب -> عبد الله والنبي محمد ﷺ (Center)
  // ==========================================
  const abdullah_prophet = createNode('عبد الله', abdul_muttalib.id, 20, 'male');
  const prophet_muhammad = createNode(
    'مُحَمَّد',
    abdullah_prophet.id,
    21,
    'male',
    'رسول الله وخاتم الأنبياء والمرسلين ﷺ',
    'رسول الله وخاتم النبيين، محمد بن عبد الله بن عبد المطلب بن هاشم بن عبد مناف صلوات الله وسلامه عليه.'
  );
  abdullah_prophet.children.push(prophet_muhammad);

  // abdul_muttalib's children: abu_talib (left), abdullah_prophet (center)
  abdul_muttalib.children.push(abu_talib, abdullah_prophet);

  return { root, spouses: [], counter: counter + 10 };
}

/**
 * Generate the Rabiah Tribe Tree (مشجرة قبائل ربيعة بن نزار)
 * Matching the historical diagram in the attached reference image:
 * Root: ربيعة ( الفرس ) بن نزار
 * Level 1: آمر, عامر, عمر, ضبيعة, أسد (Highlighted), أكلب, كلاب, مكلبة, عائشة
 * Under أسد: عميرة (Highlighted), جديلة, عمرو ( عنزة )
 * Under جديلة: جدان, دعمي, جدي
 * Under دعمي: أشيب, أفصى
 * Under أفصى: عبد القيس, جشم, هنب, ناشم, لكيز, شن
 * Under هنب: دهن, قاسط
 * Under قاسط: معاوية, النمر, وائل, علقمة, غفيلة
 * Under وائل: الحارث, تغلب, بكر, الشخيص, عنز
 */
export function generateRabiahTree(): {
  root: TreeNode;
  spouses: TreeNode[];
  counter: number;
  nodeOverrides: Record<string, NodeOverride>;
} {
  let counter = 1000;

  const createNode = (
    name: string,
    parentId: number | null,
    level: number,
    title?: string,
    notes?: string
  ): TreeNode => {
    return {
      id: counter++,
      name,
      title,
      parentId,
      spouseId: null,
      gender: 'male',
      notes,
      children: [],
      x: 0,
      y: 0,
      level,
      leafCount: 1,
    };
  };

  // 1. Root: ربيعة ( الفرس ) بن نزار
  const root = createNode('ربيعة ( الفرس ) بن نزار', null, 0, 'الجد الجامع لقبائل ربيعة');

  // Level 1: 9 sons of Rabiah
  const aamer1 = createNode('آمر', root.id, 1);
  const aamer2 = createNode('عامر', root.id, 1);
  const umar = createNode('عمر', root.id, 1);
  const dabiah = createNode('ضبيعة', root.id, 1);
  const asad = createNode('أسد', root.id, 1, 'جد بني أسد');
  const aklab = createNode('أكلب', root.id, 1);
  const kilab = createNode('كلاب', root.id, 1);
  const mukallaba = createNode('مكلبة', root.id, 1);
  const aisha = createNode('عائشة', root.id, 1);

  root.children.push(aamer1, aamer2, umar, dabiah, asad, aklab, kilab, mukallaba, aisha);

  // Level 2 under أسد
  const amirah = createNode('عميرة', asad.id, 2);
  const jadilah = createNode('جديلة', asad.id, 2);
  const amr_anaza = createNode('عمرو ( عنزة )', asad.id, 2);

  asad.children.push(amirah, jadilah, amr_anaza);

  // Level 3 under جديلة
  const jaddan = createNode('جدان', jadilah.id, 3);
  const damiyy = createNode('دعمي', jadilah.id, 3);
  const jaddi = createNode('جدي', jadilah.id, 3);

  jadilah.children.push(jaddan, damiyy, jaddi);

  // Level 4 under دعمي
  const ashib = createNode('أشيب', damiyy.id, 4);
  const afsa = createNode('أفصى', damiyy.id, 4);

  damiyy.children.push(ashib, afsa);

  // Level 5 under أفصى
  const abdul_qays = createNode('عبد القيس', afsa.id, 5);
  const jusham = createNode('جشم', afsa.id, 5);
  const hanab = createNode('هنب', afsa.id, 5);
  const nashim = createNode('ناشم', afsa.id, 5);
  const lukayz = createNode('لكيز', afsa.id, 5);
  const shan = createNode('شن', afsa.id, 5);

  afsa.children.push(abdul_qays, jusham, hanab, nashim, lukayz, shan);

  // Level 6 under هنب
  const duhn = createNode('دهن', hanab.id, 6);
  const qasit = createNode('قاسط', hanab.id, 6);

  hanab.children.push(duhn, qasit);

  // Level 7 under قاسط
  const muawiyah = createNode('معاوية', qasit.id, 7);
  const al_namir = createNode('النمر', qasit.id, 7);
  const wael = createNode('وائل', qasit.id, 7);
  const alqamah = createNode('علقمة', qasit.id, 7);
  const ghufaylah = createNode('غفيلة', qasit.id, 7);

  qasit.children.push(muawiyah, al_namir, wael, alqamah, ghufaylah);

  // Level 8 under وائل
  const al_harith = createNode('الحارث', wael.id, 8);
  const taghlib = createNode('تغلب', wael.id, 8);
  const bakr = createNode('بكر', wael.id, 8);
  const al_shakhis = createNode('الشخيص', wael.id, 8);
  const anaz = createNode('عنز', wael.id, 8);

  wael.children.push(al_harith, taghlib, bakr, al_shakhis, anaz);

  // Color overrides matching the image:
  // Root (ربيعة): Amber Gold #FFD966
  // أسد and عميرة: Light Blue #8EA9DB
  const nodeOverrides: Record<string, NodeOverride> = {
    [root.id]: { colorOverride: '#FFD966', textColorOverride: '#000000' },
    [asad.id]: { colorOverride: '#8EA9DB', textColorOverride: '#000000' },
    [amirah.id]: { colorOverride: '#8EA9DB', textColorOverride: '#000000' },
  };

  return { root, spouses: [], counter: counter + 10, nodeOverrides };
}

/**
 * Generate the Experimental Tree (شجرة تجريبية):
 * Grandfather (الجد المؤسس) -> 50 Sons -> Each son has 50 Sons = 1 + 50 + 2500 = 2,551 individuals!
 * High-performance structure with pre-calculated levels and leaves for ultra-fast instantaneous rendering.
 */
export function generateExperimentalTree(): {
  root: TreeNode;
  spouses: TreeNode[];
  counter: number;
  nodeOverrides: Record<string, NodeOverride>;
} {
  let counter = 1;

  // 1. Root: الجد المؤسس
  const root: TreeNode = {
    id: counter++,
    name: 'الجد المؤسس',
    title: 'مؤسس السلالة التجريبية',
    parentId: null,
    spouseId: null,
    gender: 'male',
    notes: 'شجرة تجريبية كبرى لاختبار الأداء والسرعة الفائقة (2,551 فرداً: جد + 50 ابن + 50 حفيد لكل ابن)',
    children: [],
    x: 0,
    y: 0,
    level: 0,
    leafCount: 2500,
  };

  const sonNames = [
    'محمد', 'أحمد', 'علي', 'عبد الله', 'عبد الرحمن',
    'إبراهيم', 'يوسف', 'عمر', 'عثمان', 'خالد',
    'سعد', 'سعيد', 'سلمان', 'سعود', 'فيصل',
    'فهد', 'نايف', 'بدر', 'تركي', 'مشعل',
    'منصور', 'ناصر', 'ماجد', 'حماد', 'صالح',
    'طارق', 'زياد', 'هشام', 'معاذ', 'أنس',
    'حمزة', 'حسام', 'جمال', 'راشد', 'سالم',
    'غانم', 'ثامر', 'مهند', 'جهاد', 'باسل',
    'أمجد', 'أيمن', 'مروان', 'فارس', 'صقر',
    'معن', 'تميم', 'قصي', 'عدنان', 'قحطان'
  ];

  const grandsonPrefixes = [
    'عبدالله', 'علي', 'أحمد', 'سعود', 'سلطان', 'سلمان', 'فيصل', 'تركي', 'فهد', 'نايف',
    'بدر', 'بندر', 'خالد', 'سعد', 'ماجد', 'منصور', 'ناصر', 'وليد', 'مشاري', 'ريان',
    'طلال', 'نواف', 'مشعل', 'عبدالعزيز', 'إبراهيم', 'يوسف', 'عمر', 'عثمان', 'حمزة', 'أنس',
    'معاذ', 'طارق', 'زياد', 'هشام', 'سامي', 'صالح', 'حماد', 'سالم', 'غانم', 'راشد',
    'ثامر', 'مهند', 'فارس', 'صقر', 'باسل', 'مروان', 'أيمن', 'أمجد', 'تميم', 'عدنان'
  ];

  const nodeOverrides: Record<string, NodeOverride> = {
    [root.id]: { colorOverride: '#F59E0B', textColorOverride: '#000000', fontSize: 18 },
  };

  for (let i = 0; i < 50; i++) {
    const sonId = counter++;
    const sonBaseName = sonNames[i] || `الابن ${i + 1}`;
    const sonNode: TreeNode = {
      id: sonId,
      name: `الابن ${i + 1} (${sonBaseName})`,
      title: `فرع ${sonBaseName}`,
      parentId: root.id,
      spouseId: null,
      gender: 'male',
      children: [],
      x: 0,
      y: 0,
      level: 1,
      leafCount: 50,
    };

    // 50 Grandsons for each of the 50 sons
    for (let j = 0; j < 50; j++) {
      const grandsonId = counter++;
      const prefix = grandsonPrefixes[j] || `حفيد ${j + 1}`;
      const grandsonNode: TreeNode = {
        id: grandsonId,
        name: `${prefix} بن ${sonBaseName}`,
        parentId: sonId,
        spouseId: null,
        gender: 'male',
        children: [],
        x: 0,
        y: 0,
        level: 2,
        leafCount: 1,
      };
      sonNode.children.push(grandsonNode);
    }

    root.children.push(sonNode);
  }

  return { root, spouses: [], counter: counter + 10, nodeOverrides };
}

// Default initial tree is the high-performance Experimental Tree!
export function generateInitialTree(): { root: TreeNode; spouses: TreeNode[]; counter: number } {
  const exp = generateExperimentalTree();
  return { root: exp.root, spouses: exp.spouses, counter: exp.counter };
}

export class StorageService {
  // Get active tree ID
  static getActiveTreeId(): string {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_TREE_ID);
    if (!active || active === 'tree_rabiah_nizar') {
      return 'tree_experimental';
    }
    return active;
  }

  // Set active tree ID
  static setActiveTreeId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TREE_ID, id);
  }

  // Get list of saved family trees
  static getTreesList(): Array<{ id: string; name: string; memberCount: number; updatedAt: number }> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TREES_LIST);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          // Replace any old rabiah reference with the experimental tree
          return list.map(item => {
            if (item.id === 'tree_rabiah_nizar') {
              return {
                id: 'tree_experimental',
                name: 'شجرة تجريبية (2,551 فرداً: جد + 50 ابن + 50 حفيد لكل ابن)',
                memberCount: 2551,
                updatedAt: Date.now(),
              };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load trees list:', e);
    }
    return [
      {
        id: 'tree_experimental',
        name: 'شجرة تجريبية (2,551 فرداً: جد + 50 ابن + 50 حفيد لكل ابن)',
        memberCount: 2551,
        updatedAt: Date.now(),
      },
      {
        id: 'tree_prophet_caliphs_demo',
        name: 'التقاء الخلفاء الراشدين في النسب مع النبي ﷺ',
        memberCount: 43,
        updatedAt: Date.now(),
      },
    ];
  }

  // Save tree list
  static saveTreesList(list: Array<{ id: string; name: string; memberCount: number; updatedAt: number }>) {
    try {
      localStorage.setItem(STORAGE_KEYS.TREES_LIST, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save trees list:', e);
    }
  }

  // Storage stats for settings
  static getStorageStats(): { treesCount: number; snapshotsCount: number; usedKB: number } {
    try {
      let treesCount = this.getTreesList().length;
      let snapshotsCount = 0;
      let totalChars = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('family_tree_')) {
          const val = localStorage.getItem(key) || '';
          totalChars += key.length + val.length;
          if (key.startsWith(STORAGE_KEYS.SNAPSHOTS_PREFIX)) {
            try {
              const snaps = JSON.parse(val);
              if (Array.isArray(snaps)) snapshotsCount += snaps.length;
            } catch (_) {}
          }
        }
      }
      const usedKB = Math.round((totalChars * 2) / 1024);
      return { treesCount, snapshotsCount, usedKB };
    } catch (e) {
      return { treesCount: 1, snapshotsCount: 0, usedKB: 50 };
    }
  }

  // Load Tree Data
  static loadTree(treeId?: string): {
    root: TreeNode;
    counter: number;
    spouses: TreeNode[];
    nodeOverrides: Record<string, NodeOverride>;
    settings: TreeSettings;
  } {
    const id = treeId || this.getActiveTreeId();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TREE_DATA_PREFIX + id);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.root) {
          if (id === 'tree_rabiah_nizar') {
            const settings = {
              ...defaultSettings,
              layoutStyle: 'downward' as const,
              branchStyle: 'orthogonal' as const,
              bgPreset: 'clean',
              showHeritageNote: true,
              heritageNoteText: '(( مشجرة قبائل ربيعة بن نزار\nكما لدى أبن الكلبي\nفي كتابة جمهرة النسب ))',
              ...(parsed.settings || {}),
            };
            return {
              root: parsed.root,
              counter: parsed.counter || 1100,
              spouses: parsed.spouses || [],
              nodeOverrides: parsed.nodeOverrides || {},
              settings,
            };
          }

          if (id === 'tree_prophet_caliphs_demo') {
            const settings = {
              ...defaultSettings,
              ...(parsed.settings || {}),
              ancestralChain: [],
              showQuranicVerse: true,
              quranicVerseText: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ ۚ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ',
            };
            return {
              root: parsed.root,
              counter: parsed.counter || 1100,
              spouses: parsed.spouses || [],
              nodeOverrides: parsed.nodeOverrides || {},
              settings,
            };
          }

          const settings = { ...defaultSettings, ...(parsed.settings || {}) };
          return {
            root: parsed.root,
            counter: parsed.counter || 1100,
            spouses: parsed.spouses || [],
            nodeOverrides: parsed.nodeOverrides || {},
            settings,
          };
        }
      }
    } catch (e) {
      console.error('Error loading tree from local storage:', e);
    }

    if (id === 'tree_experimental' || id === 'tree_rabiah_nizar') {
      const generated = generateExperimentalTree();
      const expData = {
        root: generated.root,
        counter: generated.counter,
        spouses: generated.spouses,
        nodeOverrides: generated.nodeOverrides,
        settings: {
          ...defaultSettings,
          layoutStyle: 'downward' as const,
          branchStyle: 'orthogonal' as const,
          leafStyle: 'realistic' as const,
          leafSize: 85,
          bgPreset: 'clean',
        },
      };
      this.saveTree(id, expData.root, expData.counter, expData.spouses, expData.nodeOverrides, expData.settings);
      return expData;
    }

    // Default sample: Generate Prophet and Caliphs Pedigree Tree
    const initial = generateProphetAndCaliphsTree();
    const loadedData = {
      root: initial.root,
      counter: initial.counter,
      spouses: initial.spouses,
      nodeOverrides: {},
      settings: {
        ...defaultSettings,
        ancestralChain: [],
        showQuranicVerse: true,
        quranicVerseText: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ ۚ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ',
      },
    };
    this.saveTree(id, loadedData.root, loadedData.counter, loadedData.spouses, loadedData.nodeOverrides, loadedData.settings);
    return loadedData;
  }

  // Save Tree Data
  static saveTree(
    treeId: string,
    root: TreeNode,
    counter: number,
    spouses: TreeNode[],
    nodeOverrides: Record<string, NodeOverride>,
    settings: TreeSettings,
    createSnapshot = false
  ): { success: boolean; timestamp: number } {
    const timestamp = Date.now();
    try {
      const memberCount = countTreeMembers(root, spouses);
      const dataToSave: SavedFamilyTree = {
        id: treeId,
        name: root.name || 'شجرة العائلة',
        createdAt: timestamp,
        updatedAt: timestamp,
        memberCount,
        root,
        counter,
        spouses,
        nodeOverrides,
        settings,
      };

      try {
        localStorage.setItem(STORAGE_KEYS.TREE_DATA_PREFIX + treeId, JSON.stringify(dataToSave));
      } catch (quotaErr) {
        console.warn('Storage quota warning on saveTree, clearing snapshots to ensure tree data is preserved:', quotaErr);
        try {
          localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId);
          localStorage.setItem(STORAGE_KEYS.TREE_DATA_PREFIX + treeId, JSON.stringify(dataToSave));
        } catch (fatalErr) {
          console.error('Fatal storage save error:', fatalErr);
        }
      }

      // Update trees registry list
      const list = this.getTreesList();
      const existingIdx = list.findIndex(t => t.id === treeId);
      if (existingIdx >= 0) {
        list[existingIdx] = {
          id: treeId,
          name: root.name || 'شجرة العائلة',
          memberCount,
          updatedAt: timestamp,
        };
      } else {
        list.push({
          id: treeId,
          name: root.name || 'شجرة العائلة',
          memberCount,
          updatedAt: timestamp,
        });
      }
      this.saveTreesList(list);

      // Optionally create snapshot
      if (createSnapshot) {
        this.createSnapshot(treeId, root, counter, spouses, nodeOverrides, settings, 'حفظ تلقائي دوري');
      }

      return { success: true, timestamp };
    } catch (e) {
      console.error('Error saving tree to local storage:', e);
      return { success: false, timestamp };
    }
  }

  // Snapshot / History Management
  static getSnapshots(treeId: string): TreeSnapshot[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to get snapshots:', e);
    }
    return [];
  }

  static createSnapshot(
    treeId: string,
    root: TreeNode,
    counter: number,
    spouses: TreeNode[],
    nodeOverrides: Record<string, NodeOverride>,
    settings: TreeSettings,
    note?: string
  ): TreeSnapshot {
    const snapshots = this.getSnapshots(treeId);
    const now = Date.now();
    const newSnapshot: TreeSnapshot = {
      id: 'snap_' + now + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: now,
      dateFormatted: new Date(now).toLocaleString('ar-SA'),
      treeName: root.name || 'شجرة العائلة',
      memberCount: countTreeMembers(root, spouses),
      generationCount: countGenerations(root),
      data: {
        root: JSON.parse(JSON.stringify(root)),
        counter,
        spouses: JSON.parse(JSON.stringify(spouses)),
        nodeOverrides: JSON.parse(JSON.stringify(nodeOverrides)),
        settings: JSON.parse(JSON.stringify(settings)),
      },
      note: note || 'نسخة احتياطية',
    };

    // Keep max 5 snapshots for large trees to avoid exceeding storage quota, 30 for small trees
    const isLargeTree = countTreeMembers(root, spouses) > 300;
    const maxSnapshots = isLargeTree ? 4 : 29;
    const updatedSnapshots = [newSnapshot, ...snapshots.slice(0, maxSnapshots)];
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId, JSON.stringify(updatedSnapshots));
    } catch (e) {
      console.warn('Failed to save snapshot due to quota, attempting single snapshot fallback:', e);
      try {
        localStorage.setItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId, JSON.stringify([newSnapshot]));
      } catch (_) {}
    }
    return newSnapshot;
  }

  static deleteSnapshot(treeId: string, snapshotId: string) {
    const snapshots = this.getSnapshots(treeId).filter(s => s.id !== snapshotId);
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to delete snapshot:', e);
    }
  }

  // Delete an entire tree and return next active tree ID
  static deleteTree(treeId: string): string | null {
    try {
      localStorage.removeItem(STORAGE_KEYS.TREE_DATA_PREFIX + treeId);
      localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS_PREFIX + treeId);
      const list = this.getTreesList().filter(t => t.id !== treeId);
      this.saveTreesList(list);
      return list.length > 0 ? list[0].id : null;
    } catch (e) {
      console.error('Failed to delete tree:', e);
      return null;
    }
  }

  // Create new blank tree
  static createNewTree(name: string): SavedFamilyTree {
    const newId = 'tree_' + Date.now();
    let counter = 1;
    const root: TreeNode = {
      id: counter++,
      name: name || 'الجد المؤسس',
      parentId: null,
      spouseId: null,
      children: [],
      x: 0,
      y: 0,
      level: 0,
      leafCount: 1,
      gender: 'male',
      notes: 'مؤسس الشجرة المباركة',
    };

    const newTreeData: SavedFamilyTree = {
      id: newId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      memberCount: 1,
      root,
      counter: counter + 10,
      spouses: [],
      nodeOverrides: {},
      settings: defaultSettings,
    };

    this.saveTree(newId, root, newTreeData.counter, [], {}, defaultSettings, true);
    this.setActiveTreeId(newId);
    return newTreeData;
  }

  // Create or Reset to Prophet and Caliphs Demo Tree
  static create1000MembersDemoTree(): SavedFamilyTree {
    const treeId = 'tree_prophet_caliphs_' + Date.now();
    const generated = generateProphetAndCaliphsTree();
    const customSettings: TreeSettings = {
      ...defaultSettings,
      ancestralChain: [],
      showQuranicVerse: true,
      quranicVerseText: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ ۚ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ',
    };
    const treeData: SavedFamilyTree = {
      id: treeId,
      name: 'التقاء الخلفاء الراشدين في النسب مع النبي ﷺ',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      memberCount: countTreeMembers(generated.root, generated.spouses),
      root: generated.root,
      counter: generated.counter,
      spouses: generated.spouses,
      nodeOverrides: {},
      settings: customSettings,
    };

    this.saveTree(treeId, generated.root, generated.counter, generated.spouses, {}, customSettings, true);
    this.setActiveTreeId(treeId);
    return treeData;
  }

  // JSON Export / Import
  static exportJSON(
    treeId: string,
    root: TreeNode,
    counter: number,
    spouses: TreeNode[],
    nodeOverrides: Record<string, NodeOverride>,
    settings: TreeSettings
  ): string {
    const exportData: StorageExportFormat = {
      app: 'FamilyTreePro',
      version: 2,
      exportedAt: new Date().toISOString(),
      treeId,
      treeName: root.name || 'شجرة العائلة',
      memberCount: countTreeMembers(root, spouses),
      root,
      counter,
      spouses,
      nodeOverrides,
      settings,
    };
    return JSON.stringify(exportData, null, 2);
  }

  static parseImportJSON(jsonString: string): {
    valid: boolean;
    data?: {
      treeName: string;
      root: TreeNode;
      counter: number;
      spouses: TreeNode[];
      nodeOverrides: Record<string, NodeOverride>;
      settings: TreeSettings;
    };
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.root) {
        return {
          valid: true,
          data: {
            treeName: parsed.treeName || parsed.root.name || 'شجرة مستوردة',
            root: parsed.root,
            counter: parsed.counter || 1000,
            spouses: parsed.spouses || [],
            nodeOverrides: parsed.nodeOverrides || {},
            settings: { ...defaultSettings, ...(parsed.settings || {}) },
          },
        };
      }
      return { valid: false, error: 'الملف لا يحتوي على شجرة عائلة متوافقة' };
    } catch (e) {
      return { valid: false, error: 'الملف ليس بتنسيق JSON سليم' };
    }
  }
}
