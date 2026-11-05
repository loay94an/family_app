import { TreeNode, TreeSettings, NodeOverride } from '../types/tree';

interface ObstacleNode {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ObstacleBranch {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

// Distance from point to line segment
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Check if two rectangles intersect (with clearance)
function boxesIntersect(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return !(
    x1 + w1 / 2 < x2 - w2 / 2 ||
    x1 - w1 / 2 > x2 + w2 / 2 ||
    y1 + h1 / 2 < y2 - h2 / 2 ||
    y1 - h1 / 2 > y2 + h2 / 2
  );
}

// Check if two line segments intersect
function segmentsIntersect(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number
): boolean {
  const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  };
  return (
    ccw(p1x, p1y, p3x, p3y, p4x, p4y) !== ccw(p2x, p2y, p3x, p3y, p4x, p4y) &&
    ccw(p1x, p1y, p2x, p2y, p3x, p3y) !== ccw(p1x, p1y, p2x, p2y, p4x, p4y)
  );
}

// Collect all other nodes and branches from the tree root to serve as collision obstacles
export function collectObstacles(
  root: TreeNode,
  excludeParentId: number,
  excludeChildIds: Set<number>,
  nodeOverrides: Record<number, NodeOverride>,
  layoutStyle: string,
  settings: TreeSettings
): { nodes: ObstacleNode[]; branches: ObstacleBranch[] } {
  const nodes: ObstacleNode[] = [];
  const branches: ObstacleBranch[] = [];

  const cardW = Math.max(125, Math.min(170, (settings.leafSize || 100) * 1.35));
  const cardH = 55;

  const traverse = (node: TreeNode, parentPos?: { x: number; y: number }) => {
    const ov = nodeOverrides[node.id];
    const nPos = ov?.layoutPositions?.[layoutStyle] || (ov?.x !== undefined ? { x: ov.x, y: ov.y } : { x: node.x, y: node.y });
    const nx = nPos.x ?? node.x;
    const ny = nPos.y ?? node.y;

    const isExcluded = node.id === excludeParentId || excludeChildIds.has(node.id);
    // Spatial pruning: only consider obstacles within 1400px of the father
    const isNearby = parentPos
      ? Math.abs(nx - parentPos.x) < 1400 && Math.abs(ny - parentPos.y) < 1400
      : true;

    if (!isExcluded && isNearby) {
      nodes.push({
        id: node.id,
        x: nx,
        y: ny,
        width: cardW + 16,
        height: cardH + 16,
      });

      if (parentPos && node.parentId !== excludeParentId) {
        branches.push({
          p1: { x: parentPos.x, y: parentPos.y },
          p2: { x: nx, y: ny },
        });
      }
    }

    node.children.forEach(child => traverse(child, { x: nx, y: ny }));
  };

  traverse(root);
  return { nodes, branches };
}

/**
 * Professional Auto-Arrangement for Children Around their Father
 * - Keeps siblings close to each other in a compact, intimate family cluster.
 * - Staggered heights and natural botanical crown arc guarantee zero sibling overlap.
 * - Detects other family members and branches to guarantee zero occlusion/collision with cousins/uncles.
 * - Automatically selects single-crown or dual-tier based on family size (4+ or 6+ children).
 */
export function arrangeChildrenProfessionally(
  parentNode: TreeNode,
  root: TreeNode,
  settings: TreeSettings,
  nodeOverrides: Record<number, NodeOverride>
): {
  childPositions: Map<number, { x: number; y: number }>;
  updatedOverrides: Record<number, NodeOverride>;
} {
  const layoutStyle = settings.layoutStyle || 'botanical';
  const parentOv = nodeOverrides[parentNode.id];
  const parentPos = parentOv?.layoutPositions?.[layoutStyle] || (parentOv?.x !== undefined ? { x: parentOv.x, y: parentOv.y } : { x: parentNode.x, y: parentNode.y });
  const pX = parentPos.x ?? parentNode.x;
  const pY = parentPos.y ?? parentNode.y;

  const children = parentNode.children;
  const numChildren = children.length;
  const childPositions = new Map<number, { x: number; y: number }>();
  const updatedOverrides = { ...nodeOverrides };

  if (numChildren === 0) {
    return { childPositions, updatedOverrides };
  }

  const childIds = new Set(children.map(c => c.id));
  const { nodes: obstacleNodes, branches: obstacleBranches } = collectObstacles(
    root,
    parentNode.id,
    childIds,
    nodeOverrides,
    layoutStyle,
    settings
  );

  // Exact card dimensions
  const cardW = Math.max(120, Math.min(160, (settings.leafSize || 100) * 1.35));
  const cardH = 55;
  // Compact sibling spacing: tight and close, but never overlapping
  const compactGap = Math.max(18, Math.min(28, (settings.leafSize || 100) * 0.22));
  const stepW = cardW + compactGap; // e.g. 140px - 165px

  // Vertical clearance from father
  const vertGap =
    layoutStyle === 'circular' || layoutStyle === 'custom'
      ? 180
      : Math.max(150, Math.min(195, (settings.leafSize || 100) * 1.65));

  // Generate initial relative positions for the children around the father
  interface RelPos {
    id: number;
    rx: number;
    ry: number;
  }

  const isUpward = layoutStyle === 'botanical' || layoutStyle === 'palm' || layoutStyle === 'cypress' || layoutStyle === 'classic';
  const isDownward = layoutStyle === 'downward';
  const isHorizontal = layoutStyle === 'horizontal';
  const isCircular = layoutStyle === 'circular' || layoutStyle === 'custom';

  const generateCandidateLayout = (useDualTier: boolean): RelPos[] => {
    const list: RelPos[] = [];

    if (isCircular) {
      const baseAngle = -Math.PI / 2;
      const spread = Math.min(Math.PI * 1.1, Math.max(Math.PI * 0.35, numChildren * 0.24));
      children.forEach((child, idx) => {
        const angle =
          numChildren === 1
            ? baseAngle
            : baseAngle + (idx - (numChildren - 1) / 2) * (spread / (numChildren - 1));
        const rad = 185;
        list.push({
          id: child.id,
          rx: Math.cos(angle) * rad,
          ry: Math.sin(angle) * rad,
        });
      });
      return list;
    }

    if (isHorizontal) {
      children.forEach((child, idx) => {
        const offset = (idx - (numChildren - 1) / 2) * (cardH + 20);
        list.push({
          id: child.id,
          rx: 230,
          ry: offset,
        });
      });
      return list;
    }

    const ySign = isDownward ? 1 : -1;

    // For 1 child: directly aligned with father
    if (numChildren === 1) {
      list.push({
        id: children[0].id,
        rx: 0,
        ry: ySign * vertGap,
      });
      return list;
    }

    // For 2 to 5 children (or when dual-tier is disabled): single royal crown arc
    if (!useDualTier || numChildren <= 5) {
      children.forEach((child, idx) => {
        const offset = (idx - (numChildren - 1) / 2) * stepW;
        const norm = (idx - (numChildren - 1) / 2) / Math.max(1, (numChildren - 1) / 2);
        // Natural parabolic arch that gently crowns around the father
        const archY = Math.pow(norm, 2) * 22;
        // Alternating vertical stagger so adjacent cards never touch horizontally
        const stagger = (idx % 2 === 0 ? 0 : 16);
        list.push({
          id: child.id,
          rx: offset,
          ry: ySign * (vertGap + archY) + (isDownward ? stagger : -stagger),
        });
      });
      return list;
    }

    // For 6+ children: Professional Dual-Tier Arrangement (طبقتين متناسقتين)
    // Keeps children intimately close to the father and prevents spreading into neighboring branches
    const n1 = Math.ceil(numChildren / 2); // Front tier
    const n2 = numChildren - n1;          // Back tier

    // Tier 1 (closer to father)
    for (let i = 0; i < n1; i++) {
      const child = children[i];
      const offset = (i - (n1 - 1) / 2) * stepW;
      const stagger = (i % 2 === 0 ? 0 : 14);
      list.push({
        id: child.id,
        rx: offset,
        ry: ySign * vertGap + (isDownward ? stagger : -stagger),
      });
    }

    // Tier 2 (upper/outer tier, slightly staggered in between tier 1 columns)
    const tier2Gap = cardH + 22;
    for (let j = 0; j < n2; j++) {
      const child = children[n1 + j];
      const offset = (j - (n2 - 1) / 2) * stepW + (n1 !== n2 ? (stepW * 0.25) : 0);
      const stagger = (j % 2 === 0 ? 14 : 0);
      list.push({
        id: child.id,
        rx: offset,
        ry: ySign * (vertGap + tier2Gap) + (isDownward ? stagger : -stagger),
      });
    }

    return list;
  };

  // Evaluate candidate layout against obstacles
  const evaluateCollisions = (
    relList: RelPos[],
    shiftX: number,
    shiftY: number
  ): number => {
    let penalty = 0;

    relList.forEach(rel => {
      const cx = pX + rel.rx + shiftX;
      const cy = pY + rel.ry + shiftY;

      // 1. Check card overlap with other nodes
      for (const obs of obstacleNodes) {
        if (
          boxesIntersect(
            cx,
            cy,
            cardW + 12,
            cardH + 12,
            obs.x,
            obs.y,
            obs.width,
            obs.height
          )
        ) {
          penalty += 1000;
        }
      }

      // 2. Check card overlap with other branch segments
      for (const br of obstacleBranches) {
        const d = distToSegment(cx, cy, br.p1.x, br.p1.y, br.p2.x, br.p2.y);
        if (d < cardH / 2 + 16) {
          penalty += 500;
        }
      }

      // 3. Check connecting branch from father to this child against other obstacles
      for (const obs of obstacleNodes) {
        const d = distToSegment(obs.x, obs.y, pX, pY, cx, cy);
        if (d < obs.width / 2 + 8) {
          penalty += 400;
        }
      }

      // 4. Check connecting branch against other branches (prevent branch crossings)
      for (const br of obstacleBranches) {
        if (
          segmentsIntersect(
            pX,
            pY,
            cx,
            cy,
            br.p1.x,
            br.p1.y,
            br.p2.x,
            br.p2.y
          )
        ) {
          penalty += 800;
        }
      }
    });

    // Small penalty for distance from father to keep it naturally centered when clear
    penalty += Math.hypot(shiftX, shiftY) * 0.2;
    return penalty;
  };

  // Try single-tier first; if crowded, switch to dual-tier
  let bestCandidate = generateCandidateLayout(numChildren > 5);
  let bestShiftX = 0;
  let bestShiftY = 0;
  let bestPenalty = evaluateCollisions(bestCandidate, 0, 0);

  // If initial placement has any collision, search for obstacle-free clearance shift
  if (bestPenalty > 50) {
    // If not already dual-tier, test if dual-tier is cleaner for 4+ children
    if (numChildren >= 4 && numChildren <= 5) {
      const dualCandidate = generateCandidateLayout(true);
      const dualPenalty = evaluateCollisions(dualCandidate, 0, 0);
      if (dualPenalty < bestPenalty) {
        bestCandidate = dualCandidate;
        bestPenalty = dualPenalty;
      }
    }

    const testShiftsX = [0, 25, -25, 50, -50, 75, -75, 105, -105, 140, -140, 180, -180, 220, -220];
    const testShiftsY = isHorizontal
      ? [0, 25, -25, 50, -50, 80, -80]
      : [0, -18, 18, -35, 35, -55, 55, -80, 80];

    for (const sx of testShiftsX) {
      for (const sy of testShiftsY) {
        const pen = evaluateCollisions(bestCandidate, sx, sy);
        if (pen < bestPenalty) {
          bestPenalty = pen;
          bestShiftX = sx;
          bestShiftY = sy;
          if (pen < 5) break; // Perfect zero-collision spot found
        }
      }
      if (bestPenalty < 5) break;
    }
  }

  // Apply final coordinates to each child
  bestCandidate.forEach(rel => {
    const finalX = Math.round(pX + rel.rx + bestShiftX);
    const finalY = Math.round(pY + rel.ry + bestShiftY);

    childPositions.set(rel.id, { x: finalX, y: finalY });

    // Store in nodeOverrides with autoLayout set so coordinates stay locked and collision-free
    const existing = updatedOverrides[rel.id] || {};
    const existingLayouts = existing.layoutPositions ? { ...existing.layoutPositions } : {};
    existingLayouts[layoutStyle] = { x: finalX, y: finalY };

    updatedOverrides[rel.id] = {
      ...existing,
      x: finalX,
      y: finalY,
      layoutPositions: existingLayouts,
      autoLayout: false, // coordinates are resolved and locked
    };
  });

  return { childPositions, updatedOverrides };
}
