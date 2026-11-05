import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Undo2, Plus, Minus, Maximize2 } from 'lucide-react';
import { TreeNode, TreeSettings, NodeOverride } from '../types/tree';
import { colorSchemes, bgPresets } from '../constants/themes';

interface FamilyTreeCanvasProps {
  root: TreeNode | null;
  spouses: TreeNode[];
  nodeOverrides: Record<string, NodeOverride>;
  settings: TreeSettings;
  selectedNode: TreeNode | null;
  onSelectNode: (node: TreeNode) => void;
  onMoveNodeSubtree: (nodeId: number, dx: number, dy: number) => void;
  onReparentNode: (childId: number, newParentId: number) => void;
  onAddChild: (parent: TreeNode) => void;
  onToggleDragMode?: () => void;
  collapsedNodeIds?: Set<number>;
  onToggleCollapseNode?: (nodeId: number) => void;
  isExporting?: boolean;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  root,
  spouses,
  nodeOverrides,
  settings,
  selectedNode,
  onSelectNode,
  onMoveNodeSubtree,
  onReparentNode,
  collapsedNodeIds: propCollapsedNodeIds,
  isExporting = false,
  onUndo,
  canUndo = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasDivRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and Zoom transform ref - Directly drives GPU layer without React re-render lags
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const [activeTransform, setActiveTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  const isPanningRef = useRef(false);
  const isDraggingNodeRef = useRef(false);
  const isMovedRef = useRef(false);

  // RAF Animation Frame Reference
  const rafIdRef = useRef<number | null>(null);
  const wheelDebounceRef = useRef<number | null>(null);

  // Apply GPU hardware transform directly
  const applyTransformDirect = useCallback((x: number, y: number, scale: number) => {
    transformRef.current = { x, y, scale };
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      if (canvasDivRef.current) {
        canvasDivRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      }
    });
  }, []);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth || 1200,
          height: containerRef.current.clientHeight || 800,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Live Drag & Drop state
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [dragLiveOffset, setDragLiveOffset] = useState<{ dx: number; dy: number } | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<number | null>(null);
  const hoverTargetIdRef = useRef<number | null>(null);

  // Subtree Collapse state
  const activeCollapsedIds = useMemo(() => propCollapsedNodeIds || new Set<number>(), [propCollapsedNodeIds]);

  // Pointer refs for ultra-smooth panning & intentional dragging
  const panStartRef = useRef({ x: 0, y: 0 });
  const pendingNodeRef = useRef<TreeNode | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartSvgPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeIdsRef = useRef<Set<number>>(new Set());
  const disallowedReparentIdsRef = useRef<Set<number>>(new Set());
  const touchPinchRef = useRef<{
    lastDist: number;
    lastMidX: number;
    lastMidY: number;
  } | null>(null);

  // Helper to collect all node IDs in a subtree for live dragging
  const getSubtreeNodeIds = useCallback((startNode: TreeNode): Set<number> => {
    const ids = new Set<number>();
    const collect = (n: TreeNode) => {
      ids.add(n.id);
      if (n.spouseId !== null) {
        ids.add(n.spouseId);
      }
      n.children.forEach(collect);
    };
    collect(startNode);
    return ids;
  }, []);

  // Helper to calculate live position during drag for any node/spouse
  const getLivePos = useCallback(
    (n: { id: number; x: number; y: number }) => {
      if (isDraggingNodeRef.current && draggedNodeIdsRef.current.has(n.id) && dragLiveOffset) {
        return { x: n.x + dragLiveOffset.dx, y: n.y + dragLiveOffset.dy };
      }
      return { x: n.x, y: n.y };
    },
    [dragLiveOffset]
  );

  // Spouse Map
  const spouseMap = useMemo(() => {
    const map = new Map<number, TreeNode>();
    spouses.forEach(s => map.set(s.id, s));
    return map;
  }, [spouses]);

  // O(1) Fast Node Lookup Map
  const nodeMap = useMemo(() => {
    const map = new Map<number, TreeNode>();
    if (!root) return map;

    const traverse = (n: TreeNode) => {
      map.set(n.id, n);
      n.children.forEach(traverse);
    };
    traverse(root);

    spouseMap.forEach((sp, id) => {
      map.set(id, sp);
    });

    return map;
  }, [root, spouseMap]);

  // Total members count
  const totalCount = useMemo(() => nodeMap.size, [nodeMap]);

  // Find node by ID in O(1) time
  const findNode = useCallback(
    (id: number): TreeNode | null => {
      return nodeMap.get(id) || null;
    },
    [nodeMap]
  );

  // Visible node IDs considering collapsed parents
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<number>();
    if (!root) return ids;

    const traverse = (node: TreeNode) => {
      ids.add(node.id);
      if (!activeCollapsedIds.has(node.id)) {
        node.children.forEach(traverse);
      }
    };
    traverse(root);
    return ids;
  }, [root, activeCollapsedIds]);

  // =========================================================================
  // HIGH-PERFORMANCE DETERMINISTIC NON-OVERLAPPING TREE LAYOUT (2000+ NODES)
  // =========================================================================
  const layout = useMemo(() => {
    if (!root) return null;

    // 1. Count leaf weights
    const countLeaves = (node: TreeNode): number => {
      if (activeCollapsedIds.has(node.id) || node.children.length === 0) {
        node.leafCount = 1;
        return 1;
      }
      node.leafCount = node.children.reduce((s, c) => s + countLeaves(c), 0);
      return node.leafCount;
    };
    countLeaves(root);

    // 2. Max depth
    const getMaxLevel = (node: TreeNode, level = 0): number => {
      if (activeCollapsedIds.has(node.id) || node.children.length === 0) return level;
      return Math.max(...node.children.map(c => getMaxLevel(c, level + 1)));
    };
    const maxLevel = Math.max(1, getMaxLevel(root));

    const layoutStyle = settings.layoutStyle || 'botanical';

    // Pre-calculate minimum required subtree widths to guarantee zero overlap
    const subtreeWidthCache = new Map<number, number>();
    const getSubtreeWidth = (n: TreeNode): number => {
      if (subtreeWidthCache.has(n.id)) return subtreeWidthCache.get(n.id)!;
      const hasSpouse = spouses.some(s => s.spouseId === n.id);
      const spouseExtra = hasSpouse ? 180 : 0;
      if (activeCollapsedIds.has(n.id) || n.children.length === 0) {
        const w = Math.max(200, (settings.leafSize || 100) * 2.0) + spouseExtra;
        subtreeWidthCache.set(n.id, w);
        return w;
      }
      const childrenSum = n.children.reduce((acc, c) => acc + getSubtreeWidth(c), 0);
      const gap = Math.max(45, Math.min(85, 360 / Math.max(1, n.children.length)));
      const w = Math.max(210 + spouseExtra, childrenSum + (n.children.length - 1) * gap);
      subtreeWidthCache.set(n.id, w);
      return w;
    };
    const rootRequiredWidth = getSubtreeWidth(root);

    // Dynamic adaptive vertical spacing based on tree depth - Guaranteed generous clearance away from parent
    const levelHeight =
      layoutStyle === 'circular' || layoutStyle === 'custom'
        ? 260
        : Math.max(220, Math.min(300, 7200 / Math.max(1, maxLevel)));

    const padding = 280;
    const W =
      layoutStyle === 'circular' || layoutStyle === 'custom'
        ? Math.max(2800, maxLevel * 2 * levelHeight + 900)
        : Math.max(2600, rootRequiredWidth + padding * 2);

    const rootY =
      layoutStyle === 'circular' || layoutStyle === 'custom'
        ? W / 2
        : layoutStyle === 'downward'
        ? 380
        : layoutStyle === 'horizontal'
        ? 1100
        : Math.max(1100, maxLevel * levelHeight + 440);

    const centerX = W / 2;

    // Helper to resolve custom node position for the active layout style (preserving hand-organized botanical layouts)
    const getNodeCustomPos = (nodeId: number): { x: number; y: number } | null => {
      const override = nodeOverrides[nodeId];
      if (!override) return null;
      if (override.autoLayout) return null; // Automatic layout requested
      if (override.layoutPositions && override.layoutPositions[layoutStyle]) {
        const p = override.layoutPositions[layoutStyle]!;
        return { x: p.x, y: p.y };
      }
      if (layoutStyle === 'botanical' && override.layoutPositions?.botanical) {
        const p = override.layoutPositions.botanical;
        return { x: p.x, y: p.y };
      }
      if (override.x !== undefined && override.y !== undefined && !override.autoLayout) {
        return { x: override.x, y: override.y };
      }
      return null;
    };

    // 3. Deterministic Positioning Functions
    const assignBotanical = (node: TreeNode, level: number, sx: number, ex: number, parentY?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        node.y = parentY !== undefined ? parentY - levelHeight : rootY - level * levelHeight;
        node.x = (sx + ex) / 2;

        if (level > 0) {
          const distFromCenter = Math.abs(node.x - centerX);
          const normDist = Math.min(1.0, distFromCenter / (W * 0.48));
          // Gentle natural organic canopy arch
          const naturalArch = Math.pow(normDist, 2.0) * (levelHeight * 0.75);
          node.y += naturalArch;
        }
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const count = node.children.length;
        const childWidths = node.children.map(getSubtreeWidth);
        const totalReq = childWidths.reduce((a, b) => a + b, 0);

        let activeSx = sx;
        let activeEx = ex;

        if (isCustomPos) {
          const span = Math.max(totalReq, ex - sx, 420);
          activeSx = node.x - span / 2;
          activeEx = node.x + span / 2;
        }

        let cx = (activeSx + activeEx) / 2 - totalReq / 2;
        node.children.forEach((child, idx) => {
          const cw = childWidths[idx];
          // Organic vertical alternating stagger so adjacent nodes NEVER collide horizontally
          const organicStagger = count > 1 ? (idx % 2 === 0 ? -1 : 1) * Math.min(22, 8 + count * 2) : 0;
          const effectiveParentY = isCustomPos ? node.y : (parentY !== undefined ? parentY - levelHeight : rootY - level * levelHeight);
          assignBotanical(child, level + 1, cx, cx + cw, effectiveParentY + organicStagger);
          cx += cw;
        });
      }
    };

    const assignDownward = (node: TreeNode, level: number, sx: number, ex: number, parentY?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        node.y = parentY !== undefined ? parentY + levelHeight : rootY + level * levelHeight;
        node.x = (sx + ex) / 2;
        if (level > 0) {
          const distFromCenter = Math.abs(node.x - centerX);
          const domeOffset = (distFromCenter / W) * 180;
          node.y -= domeOffset;
        }
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const count = node.children.length;
        const childWidths = node.children.map(getSubtreeWidth);
        const totalReq = childWidths.reduce((a, b) => a + b, 0);

        let activeSx = sx;
        let activeEx = ex;

        if (isCustomPos) {
          const span = Math.max(totalReq, ex - sx, 420);
          activeSx = node.x - span / 2;
          activeEx = node.x + span / 2;
        }

        let cx = (activeSx + activeEx) / 2 - totalReq / 2;
        node.children.forEach((child, idx) => {
          const cw = childWidths[idx];
          const organicStagger = count > 1 ? (idx % 2 === 0 ? 1 : -1) * Math.min(20, 6 + count * 2) : 0;
          const effectiveParentY = isCustomPos ? node.y : (parentY !== undefined ? parentY + levelHeight : rootY + level * levelHeight);
          assignDownward(child, level + 1, cx, cx + cw, effectiveParentY + organicStagger);
          cx += cw;
        });
      }
    };

    const assignClassic = (node: TreeNode, level: number, sx: number, ex: number, parentY?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        node.y = parentY !== undefined ? parentY - levelHeight : rootY - level * levelHeight;
        node.x = (sx + ex) / 2;
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const count = node.children.length;
        const childWidths = node.children.map(getSubtreeWidth);
        const totalReq = childWidths.reduce((a, b) => a + b, 0);

        let activeSx = sx;
        let activeEx = ex;

        if (isCustomPos) {
          const span = Math.max(totalReq, ex - sx, 420);
          activeSx = node.x - span / 2;
          activeEx = node.x + span / 2;
        }

        let cx = (activeSx + activeEx) / 2 - totalReq / 2;
        node.children.forEach((child, idx) => {
          const cw = childWidths[idx];
          const organicStagger = count > 1 ? (idx % 2 === 0 ? -1 : 1) * Math.min(20, 6 + count * 2) : 0;
          const effectiveParentY = isCustomPos ? node.y : (parentY !== undefined ? parentY - levelHeight : rootY - level * levelHeight);
          assignClassic(child, level + 1, cx, cx + cw, effectiveParentY + organicStagger);
          cx += cw;
        });
      }
    };

    const assignHorizontal = (node: TreeNode, level: number, sy: number, ey: number, parentX?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        node.x = parentX !== undefined ? parentX + levelHeight * 1.3 : padding + level * levelHeight * 1.3;
        node.y = (sy + ey) / 2;
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const totalLeaves = Math.max(1, node.leafCount);
        const count = node.children.length;
        const totalReq = Math.max(300, count * 110);

        let activeSy = sy;
        let activeEy = ey;

        if (isCustomPos) {
          const span = Math.max(totalReq, ey - sy, 420);
          activeSy = node.y - span / 2;
          activeEy = node.y + span / 2;
        }

        let cy = activeSy;
        node.children.forEach(child => {
          const ch = (child.leafCount / totalLeaves) * (activeEy - activeSy);
          const effectiveParentX = isCustomPos ? node.x : (parentX !== undefined ? parentX + levelHeight * 1.3 : padding + level * levelHeight * 1.3);
          assignHorizontal(child, level + 1, cy, cy + ch, effectiveParentX);
          cy += ch;
        });
      }
    };

    const assignCircular = (node: TreeNode, level: number, startAngle: number, endAngle: number, parentX?: number, parentY?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      const angle = (startAngle + endAngle) / 2;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        if (level === 0) {
          node.x = centerX;
          node.y = rootY;
        } else {
          const baseParentX = parentX !== undefined ? parentX : centerX;
          const baseParentY = parentY !== undefined ? parentY : rootY;
          node.x = baseParentX + Math.cos(angle) * levelHeight;
          node.y = baseParentY + Math.sin(angle) * levelHeight;
        }
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const totalLeaves = Math.max(1, node.leafCount);
        const sliceSpan = endAngle - startAngle;

        let currentAngle = startAngle;
        node.children.forEach(child => {
          const childShare = child.leafCount / totalLeaves;
          const childSpan = sliceSpan * childShare;
          const effectiveParentX = isCustomPos ? node.x : (parentX !== undefined ? parentX : centerX);
          const effectiveParentY = isCustomPos ? node.y : (parentY !== undefined ? parentY : rootY);
          assignCircular(child, level + 1, currentAngle, currentAngle + childSpan, effectiveParentX, effectiveParentY);
          currentAngle += childSpan;
        });
      }
    };

    const assignPalm = (node: TreeNode, level: number, sx: number, ex: number, parentY?: number) => {
      const customPos = getNodeCustomPos(node.id);
      const isCustomPos = customPos !== null;

      if (isCustomPos) {
        node.x = customPos.x;
        node.y = customPos.y;
      } else {
        node.x = (sx + ex) / 2;
        if (level === 0) {
          node.y = rootY;
          node.x = centerX;
        } else if (level === 1) {
          // Graceful arching palm fronds emerging from crown
          const distFromCenter = Math.abs(node.x - centerX);
          const normDist = Math.min(1.0, distFromCenter / (W * 0.46));
          // Palm frond curve: curves up from crown and arches gracefully outwards and down at the tips
          const frondArch = -Math.cos(normDist * Math.PI * 0.5) * (levelHeight * 1.35) + Math.pow(normDist, 1.8) * (levelHeight * 1.1);
          node.y = rootY - levelHeight * 1.45 + frondArch;
        } else {
          // Sub-leaflets along the palm frond
          const parentFrondY = parentY !== undefined ? parentY : rootY - level * levelHeight;
          const stagger = (node.id % 2 === 0 ? 1 : -1) * 14;
          node.y = parentFrondY - levelHeight * 0.85 + stagger;
        }
      }
      node.level = level;

      if (!activeCollapsedIds.has(node.id) && node.children.length > 0) {
        const count = node.children.length;
        const childWidths = node.children.map(getSubtreeWidth);
        const totalReq = childWidths.reduce((a, b) => a + b, 0);

        let activeSx = sx;
        let activeEx = ex;

        if (isCustomPos) {
          const span = Math.max(totalReq, ex - sx, 420);
          activeSx = node.x - span / 2;
          activeEx = node.x + span / 2;
        }

        const available = Math.max(totalReq, activeEx - activeSx);
        const surplus = Math.max(0, available - totalReq);

        let cx = (activeSx + activeEx) / 2 - available / 2;
        node.children.forEach((child, idx) => {
          const req = childWidths[idx];
          const extra = totalReq > 0 ? (req / totalReq) * surplus : 0;
          const cw = req + extra;
          const palmOrganicStagger = count > 1 ? (idx % 2 === 0 ? 1 : -1) * Math.min(22, 6 + count * 2) : 0;
          const effectiveParentY = isCustomPos ? node.y : (parentY !== undefined ? parentY : rootY - level * levelHeight);
          assignPalm(child, level + 1, cx, cx + cw, effectiveParentY + palmOrganicStagger);
          cx += cw;
        });
      }
    };

    // Execute Layout Positioning
    if (layoutStyle === 'classic') {
      assignClassic(root, 0, padding, W - padding);
    } else if (layoutStyle === 'palm') {
      assignPalm(root, 0, padding, W - padding);
    } else if (layoutStyle === 'circular') {
      assignCircular(root, 0, -Math.PI, Math.PI);
    } else if (layoutStyle === 'downward') {
      assignDownward(root, 0, padding, W - padding);
    } else if (layoutStyle === 'horizontal') {
      assignHorizontal(root, 0, padding, 1800 - padding);
    } else {
      assignBotanical(root, 0, padding, W - padding);
    }

    // 4. Position Spouses
    const assignSpouseCoords = (node: TreeNode) => {
      const nodeSpouses = spouses.filter(s => s.spouseId === node.id);
      nodeSpouses.forEach((sp, idx) => {
        const spOverride = nodeOverrides[sp.id] || {};
        if (spOverride.x !== undefined && spOverride.y !== undefined && !spOverride.autoLayout) {
          sp.x = spOverride.x;
          sp.y = spOverride.y;
        } else {
          let offsetX = 175;
          if (idx === 0) {
            offsetX = 175;
          } else if (idx === 1) {
            offsetX = -175;
          } else {
            offsetX = idx % 2 === 0 ? 175 * (1 + Math.floor(idx / 2)) : -175 * (1 + Math.floor(idx / 2));
          }
          sp.x = node.x + offsetX;
          sp.y = node.y;
        }
      });

      if (!activeCollapsedIds.has(node.id)) {
        node.children.forEach(assignSpouseCoords);
      }
    };
    assignSpouseCoords(root);

    // 5. Compute Bounding Box
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const getBounds = (node: TreeNode) => {
      if (isFinite(node.x) && isFinite(node.y)) {
        minX = Math.min(minX, node.x - 220);
        maxX = Math.max(maxX, node.x + 220);
        minY = Math.min(minY, node.y - 200);
        maxY = Math.max(maxY, node.y + 240);
      }
      if (!activeCollapsedIds.has(node.id)) {
        node.children.forEach(getBounds);
      }
      const nodeSpouses = spouses.filter(s => s.spouseId === node.id);
      nodeSpouses.forEach(sp => {
        if (isFinite(sp.x) && isFinite(sp.y)) {
          minX = Math.min(minX, sp.x - 180);
          maxX = Math.max(maxX, sp.x + 180);
          minY = Math.min(minY, sp.y - 180);
          maxY = Math.max(maxY, sp.y + 180);
        }
      });
    };
    getBounds(root);

    if (!isFinite(minX) || !isFinite(maxX)) {
      minX = 0;
      maxX = 2400;
      minY = 0;
      maxY = 1600;
    }

    const margin = 280;
    const hasVerseBanner = (settings.showQuranicVerse ?? true) && settings.layoutStyle !== 'circular';
    const topBannerAllowance = hasVerseBanner ? 260 : 0;
    const finalW = Math.max(1200, maxX - minX + margin * 2);
    const finalH = Math.max(900, maxY - minY + margin * 2 + topBannerAllowance);
    const viewBoxX = minX - margin;
    const viewBoxY = minY - margin - topBannerAllowance;

    return {
      W: finalW,
      H: finalH,
      viewBoxX,
      viewBoxY,
      viewBox: `${viewBoxX} ${viewBoxY} ${finalW} ${finalH}`,
      maxLevel,
      rootY,
      centerX,
    };
  }, [
    root,
    spouses,
    nodeOverrides,
    activeCollapsedIds,
    settings.layoutStyle,
    settings.leafSize,
    settings.treeCrownShape,
    settings.showQuranicVerse,
  ]);

  // Center the whole tree in the exact middle of the screen
  const resetView = useCallback(() => {
    if (!containerRef.current || !root || !layout) return;
    const { clientWidth, clientHeight } = containerRef.current;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const traverse = (node: TreeNode) => {
      const livePos = getLivePos(node);
      if (isFinite(livePos.x) && isFinite(livePos.y)) {
        minX = Math.min(minX, livePos.x);
        maxX = Math.max(maxX, livePos.x);
        minY = Math.min(minY, livePos.y);
        maxY = Math.max(maxY, livePos.y);
      }

      if (node.spouseId !== null) {
        const sp = spouseMap.get(node.spouseId);
        if (sp) {
          const spPos = getLivePos(sp);
          if (isFinite(spPos.x) && isFinite(spPos.y)) {
            minX = Math.min(minX, spPos.x);
            maxX = Math.max(maxX, spPos.x);
            minY = Math.min(minY, spPos.y);
            maxY = Math.max(maxY, spPos.y);
          }
        }
      }

      if (!activeCollapsedIds.has(node.id)) {
        node.children.forEach(traverse);
      }
    };

    traverse(root);

    if (!isFinite(minX) || !isFinite(maxX)) {
      applyTransformDirect(clientWidth / 2, clientHeight / 2, 1);
      setActiveTransform({ scale: 1, x: clientWidth / 2, y: clientHeight / 2 });
      return;
    }

    const cardPaddingX = 140;
    const cardPaddingY = 110;
    const treeW = Math.max(100, maxX - minX + cardPaddingX * 2);
    const treeH = Math.max(100, maxY - minY + cardPaddingY * 2);

    const screenPadding = 24;
    const fitScaleX = (clientWidth - screenPadding * 2) / treeW;
    const fitScaleY = (clientHeight - screenPadding * 2) / treeH;
    const fitScale = Math.min(fitScaleX, fitScaleY);
    const clampedScale = Math.max(0.1, Math.min(1.4, fitScale));

    const treePixelCenterX = (minX + maxX) / 2 - layout.viewBoxX;
    const treePixelCenterY = (minY + maxY) / 2 - layout.viewBoxY;

    const newX = clientWidth / 2 - treePixelCenterX * clampedScale;
    const newY = clientHeight / 2 - treePixelCenterY * clampedScale;

    applyTransformDirect(newX, newY, clampedScale);
    setActiveTransform({ scale: clampedScale, x: newX, y: newY });
  }, [root, spouseMap, getLivePos, layout, activeCollapsedIds, applyTransformDirect]);

  // Center zoom for + and - floating buttons
  const zoomAtCenter = useCallback(
    (zoomFactor: number) => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const centerX = clientWidth / 2;
      const centerY = clientHeight / 2;

      const prev = transformRef.current;
      const newScale = Math.max(0.08, Math.min(5.0, prev.scale * zoomFactor));
      const scaleRatio = newScale / prev.scale;

      const newX = centerX - (centerX - prev.x) * scaleRatio;
      const newY = centerY - (centerY - prev.y) * scaleRatio;

      applyTransformDirect(newX, newY, newScale);
      setActiveTransform({ scale: newScale, x: newX, y: newY });
    },
    [applyTransformDirect]
  );

  // Center tree on initial load only
  const loadedTreeIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (root && root.id !== loadedTreeIdRef.current) {
      loadedTreeIdRef.current = root.id;
      resetView();
    }
  }, [root?.id, resetView]);

  // Convert Client coordinate to Canvas SVG Coordinate
  const clientToSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const curTrans = transformRef.current;
    const svgX = (clientX - rect.left - curTrans.x) / curTrans.scale;
    const svgY = (clientY - rect.top - curTrans.y) / curTrans.scale;
    return { x: svgX, y: svgY };
  }, []);

  // Viewport Frustum Culling Box for massive 2000+ trees
  const viewportBox = useMemo(() => {
    if (isExporting || totalCount < 120 || !layout) return null;
    const scale = activeTransform.scale;
    const margin = 800; // Large buffer margin for instantaneous smooth pan
    const svgLeft = -activeTransform.x / scale - margin + layout.viewBoxX;
    const svgTop = -activeTransform.y / scale - margin + layout.viewBoxY;
    const svgRight = (containerSize.width - activeTransform.x) / scale + margin + layout.viewBoxX;
    const svgBottom = (containerSize.height - activeTransform.y) / scale + margin + layout.viewBoxY;

    return { minX: svgLeft, maxX: svgRight, minY: svgTop, maxY: svgBottom };
  }, [isExporting, totalCount, activeTransform, containerSize, layout]);

  // Fast culling check in O(1)
  const isPointInViewport = useCallback(
    (x: number, y: number): boolean => {
      if (!viewportBox) return true;
      return x >= viewportBox.minX && x <= viewportBox.maxX && y >= viewportBox.minY && y <= viewportBox.maxY;
    },
    [viewportBox]
  );

  // Hardware GPU-Accelerated Wheel Zoom with Debounced React Sync
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const curTrans = transformRef.current;
    const newScale = Math.max(0.08, Math.min(5.0, curTrans.scale * zoomFactor));
    const scaleRatio = newScale / curTrans.scale;

    const newX = cursorX - (cursorX - curTrans.x) * scaleRatio;
    const newY = cursorY - (cursorY - curTrans.y) * scaleRatio;

    // Apply immediate GPU transform at 60-120fps with zero React re-render lag
    applyTransformDirect(newX, newY, newScale);

    // Debounce heavy React state update so SVG nodes are not recalculated on every wheel tick
    if (wheelDebounceRef.current) {
      window.clearTimeout(wheelDebounceRef.current);
    }
    wheelDebounceRef.current = window.setTimeout(() => {
      setActiveTransform({ scale: newScale, x: newX, y: newY });
    }, 100);
  };

  // Live Reparent Hover Target Detection Helper
  const checkHoverTarget = useCallback(
    (
      svgPt: { x: number; y: number },
      draggedNode: TreeNode,
      liveOffset?: { dx: number; dy: number } | null
    ): number | null => {
      if (settings.allowReparenting === false) return null;
      const disallowed = disallowedReparentIdsRef.current.size > 0 
        ? disallowedReparentIdsRef.current 
        : draggedNodeIdsRef.current;
      let bestTargetId: number | null = null;
      let minTargetDist = 140; // Generous drop radius for easy targeting

      const draggedLivePos = getLivePos(draggedNode);
      const draggedActualX = liveOffset ? draggedLivePos.x + liveOffset.dx : draggedLivePos.x;
      const draggedActualY = liveOffset ? draggedLivePos.y + liveOffset.dy : draggedLivePos.y;

      visibleNodeIds.forEach(targetId => {
        if (targetId === draggedNode.id || disallowed.has(targetId)) return;
        const targetNode = nodeMap.get(targetId);
        if (!targetNode) return;
        // Don't reparent to the current parent
        if (targetNode.id === draggedNode.parentId) return;

        const tPos = getLivePos(targetNode);
        const dPointer = Math.hypot(svgPt.x - tPos.x, svgPt.y - tPos.y);
        const dCard = Math.hypot(draggedActualX - tPos.x, draggedActualY - tPos.y);
        const d = Math.min(dPointer, dCard);

        if (d < minTargetDist) {
          minTargetDist = d;
          bestTargetId = targetId;
        }
      });

      return bestTargetId;
    },
    [getLivePos, nodeMap, settings.allowReparenting, visibleNodeIds]
  );

  // Complete live drag or tap
  const finishDrag = useCallback(() => {
    const targetParentId = hoverTargetIdRef.current;
    if (isDraggingNodeRef.current && pendingNodeRef.current) {
      if (
        settings.allowReparenting !== false &&
        targetParentId !== null &&
        !draggedNodeIdsRef.current.has(targetParentId)
      ) {
        onReparentNode(pendingNodeRef.current.id, targetParentId);
      } else if (dragLiveOffset) {
        const { dx, dy } = dragLiveOffset;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          onMoveNodeSubtree(pendingNodeRef.current.id, dx, dy);
        }
      }
    } else if (pendingNodeRef.current && !isMovedRef.current) {
      onSelectNode(pendingNodeRef.current);
    }

    pendingNodeRef.current = null;
    isDraggingNodeRef.current = false;
    isPanningRef.current = false;
    hoverTargetIdRef.current = null;
    setDraggingNodeId(null);
    setDragLiveOffset(null);
    setHoverTargetId(null);
    isMovedRef.current = false;
  }, [dragLiveOffset, onMoveNodeSubtree, onReparentNode, onSelectNode, settings.allowReparenting]);

  const finishDragRef = useRef(finishDrag);
  useEffect(() => {
    finishDragRef.current = finishDrag;
  }, [finishDrag]);

  // Touch Handlers for Pinch-to-Zoom and Smooth Pan on Mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        touchPinchRef.current = {
          lastDist: dist,
          lastMidX: midX,
          lastMidY: midY,
        };

        isPanningRef.current = false;
        isDraggingNodeRef.current = false;
        pendingNodeRef.current = null;
        setDraggingNodeId(null);
      } else if (e.touches.length === 1) {
        touchPinchRef.current = null;
        const touch = e.touches[0];
        pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
        panStartRef.current = {
          x: touch.clientX - transformRef.current.x,
          y: touch.clientY - transformRef.current.y,
        };
        isMovedRef.current = false;
        isPanningRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      if (e.touches.length >= 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        if (touchPinchRef.current) {
          const { lastDist, lastMidX, lastMidY } = touchPinchRef.current;
          if (lastDist > 2 && dist > 2) {
            const rect = container.getBoundingClientRect();
            const factor = dist / lastDist;

            if (isFinite(factor) && factor > 0) {
              const curTrans = transformRef.current;
              const newScale = Math.max(0.08, Math.min(5.0, curTrans.scale * factor));
              const scaleRatio = newScale / curTrans.scale;

              const curFocalX = midX - rect.left;
              const curFocalY = midY - rect.top;
              const panDx = midX - lastMidX;
              const panDy = midY - lastMidY;

              const newX = curFocalX - (curFocalX - curTrans.x) * scaleRatio + panDx;
              const newY = curFocalY - (curFocalY - curTrans.y) * scaleRatio + panDy;

              if (isFinite(newX) && isFinite(newY)) {
                applyTransformDirect(newX, newY, newScale);
              }
            }
          }
        }

        touchPinchRef.current = {
          lastDist: dist,
          lastMidX: midX,
          lastMidY: midY,
        };
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (touchPinchRef.current) {
          touchPinchRef.current = null;
          pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
          panStartRef.current = {
            x: touch.clientX - transformRef.current.x,
            y: touch.clientY - transformRef.current.y,
          };
          return;
        }

        const moveDx = touch.clientX - pointerStartRef.current.x;
        const moveDy = touch.clientY - pointerStartRef.current.y;
        const dist = Math.hypot(moveDx, moveDy);

        if (dist > 4) {
          isMovedRef.current = true;
        }

        if (!isDraggingNodeRef.current && isPanningRef.current) {
          const newX = touch.clientX - panStartRef.current.x;
          const newY = touch.clientY - panStartRef.current.y;
          applyTransformDirect(newX, newY, transformRef.current.scale);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchPinchRef.current = null;
        if (isPanningRef.current) {
          isPanningRef.current = false;
          setActiveTransform(transformRef.current);
        }
      } else if (e.touches.length === 1) {
        touchPinchRef.current = null;
        const touch = e.touches[0];
        pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
        panStartRef.current = {
          x: touch.clientX - transformRef.current.x,
          y: touch.clientY - transformRef.current.y,
        };
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [settings.dragMode, settings.allowReparenting, checkHoverTarget, clientToSvgPoint, applyTransformDirect]);

  // Mouse Handlers (Canvas Panning)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isDraggingNodeRef.current) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = {
      x: e.clientX - transformRef.current.x,
      y: e.clientY - transformRef.current.y,
    };
    isMovedRef.current = false;
    isPanningRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNodeRef.current) return;
    if (!isPanningRef.current) return;

    const moveDx = e.clientX - pointerStartRef.current.x;
    const moveDy = e.clientY - pointerStartRef.current.y;
    const dist = Math.hypot(moveDx, moveDy);

    if (dist > 4) {
      isMovedRef.current = true;
    }

    const newX = e.clientX - panStartRef.current.x;
    const newY = e.clientY - panStartRef.current.y;
    applyTransformDirect(newX, newY, transformRef.current.scale);
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setActiveTransform(transformRef.current);
    }
  };

  // Node Pointer Down -> Super-smooth window-level drag and reparent tracking
  const handleNodePointerDown = (node: TreeNode, e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Isolate node dragging from canvas panning
    isPanningRef.current = false;
    pendingNodeRef.current = node;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    pointerStartRef.current = { x: startClientX, y: startClientY };
    dragStartSvgPointRef.current = clientToSvgPoint(startClientX, startClientY);
    
    // Always prevent reparenting to descendants
    disallowedReparentIdsRef.current = getSubtreeNodeIds(node);
    
    // Only move the selected individual person unless subtree moveMode is explicitly configured
    if (settings.moveMode === 'subtree') {
      draggedNodeIdsRef.current = getSubtreeNodeIds(node);
    } else {
      draggedNodeIdsRef.current = new Set([node.id, ...(node.spouseId ? [node.spouseId] : [])]);
    }

    isDraggingNodeRef.current = false;
    isMovedRef.current = false;
    hoverTargetIdRef.current = null;
    setHoverTargetId(null);
    setDragLiveOffset(null);

    let lastClientX = startClientX;
    let lastClientY = startClientY;
    let dragRafId: number | null = null;
    let lastHoverCheckTime = 0;

    const onGlobalPointerMove = (ev: PointerEvent) => {
      lastClientX = ev.clientX;
      lastClientY = ev.clientY;
      const moveDx = lastClientX - startClientX;
      const moveDy = lastClientY - startClientY;
      const dist = Math.hypot(moveDx, moveDy);

      if (dist > 4) {
        isMovedRef.current = true;
      }

      const isDragEnabled = settings.dragMode || settings.allowReparenting !== false;
      if (!isDragEnabled || dist <= 5) return;

      // Throttle pointer move to 60fps Animation Frame to prevent freezing
      if (!dragRafId) {
        dragRafId = requestAnimationFrame(() => {
          dragRafId = null;
          if (!isDraggingNodeRef.current) {
            isDraggingNodeRef.current = true;
            setDraggingNodeId(node.id);
          }
          const curSvgPt = clientToSvgPoint(lastClientX, lastClientY);
          const dx = Math.round(curSvgPt.x - dragStartSvgPointRef.current.x);
          const dy = Math.round(curSvgPt.y - dragStartSvgPointRef.current.y);

          setDragLiveOffset(prev => {
            if (prev && Math.abs(prev.dx - dx) < 1.5 && Math.abs(prev.dy - dy) < 1.5) {
              return prev;
            }
            return { dx, dy };
          });

          // Throttle expensive geometric distance target calculations to at most once every 75ms
          const now = performance.now();
          if (now - lastHoverCheckTime > 75) {
            lastHoverCheckTime = now;
            const targetId = checkHoverTarget(curSvgPt, node, { dx, dy });
            if (hoverTargetIdRef.current !== targetId) {
              hoverTargetIdRef.current = targetId;
              setHoverTargetId(targetId);
            }
          }
        });
      }
    };

    const onGlobalPointerUp = (ev: PointerEvent) => {
      if (dragRafId) {
        cancelAnimationFrame(dragRafId);
        dragRafId = null;
      }
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
      finishDragRef.current();
    };

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);
  };

  // Leaf SVG Path
  const getBotanicalLeafPath = (w: number, h: number, style: string = 'realistic') => {
    const halfW = w / 2;
    const halfH = h / 2;

    switch (style) {
      case 'pointed':
        return `M 0 ${-halfH} 
                C ${halfW * 0.75} ${-halfH * 0.6}, ${halfW * 0.85} ${halfH * 0.4}, 0 ${halfH} 
                C ${-halfW * 0.85} ${halfH * 0.4}, ${-halfW * 0.75} ${-halfH * 0.6}, 0 ${-halfH} Z`;
      case 'palm_frond':
        return `M 0 ${-halfH} 
                C ${halfW * 0.45} ${-halfH * 0.5}, ${halfW * 0.85} ${halfH * 0.25}, ${halfW * 0.15} ${halfH} 
                C ${-halfW * 0.15} ${halfH}, ${-halfW * 0.85} ${halfH * 0.25}, ${-halfW * 0.45} ${-halfH * 0.5} Z`;
      case 'olive':
        return `M 0 ${-halfH} 
                C ${halfW * 0.65} ${-halfH * 0.45}, ${halfW * 0.75} ${halfH * 0.35}, 0 ${halfH} 
                C ${-halfW * 0.75} ${halfH * 0.35}, ${-halfW * 0.65} ${-halfH * 0.45}, 0 ${-halfH} Z`;
      case 'royal_medallion':
      case 'rounded':
        return `M 0 ${-halfH} 
                C ${halfW * 1.25} ${-halfH * 0.3}, ${halfW * 1.25} ${halfH * 0.5}, 0 ${halfH} 
                C ${-halfW * 1.25} ${halfH * 0.5}, ${-halfW * 1.25} ${-halfH * 0.3}, 0 ${-halfH} Z`;
      case 'oval':
        return `M 0 ${-halfH} 
                C ${halfW * 1.1} ${-halfH * 0.5}, ${halfW * 1.1} ${halfH * 0.5}, 0 ${halfH} 
                C ${-halfW * 1.1} ${halfH * 0.5}, ${-halfW * 1.1} ${-halfH * 0.5}, 0 ${-halfH} Z`;
      case 'heart':
        return `M 0 ${-halfH}
                C ${halfW * 1.3} ${-halfH * 0.4}, ${halfW * 1.4} ${halfH * 0.5}, ${halfW * 0.2} ${halfH - 10}
                Q 0 ${halfH - 22} 0 ${halfH}
                Q 0 ${halfH - 22} ${-halfW * 0.2} ${halfH - 10}
                C ${-halfW * 1.4} ${halfH * 0.5}, ${-halfW * 1.3} ${-halfH * 0.4}, 0 ${-halfH} Z`;
      case 'realistic':
      default:
        return `M 0 ${-halfH} 
                C ${halfW * 0.9} ${-halfH * 0.45}, ${halfW * 1.05} ${halfH * 0.2}, 0 ${halfH} 
                C ${-halfW * 1.05} ${halfH * 0.2}, ${-halfW * 0.9} ${-halfH * 0.45}, 0 ${-halfH} Z`;
    }
  };

  // Branch Thickness Caliper according to botanical scaling and descendant count
  const getNodeThickness = useCallback((n: TreeNode): number => {
    const isRoot = n.level === 0;
    const isLeaf = n.children.length === 0;
    const tThick = settings.branchThickness || 1.0;
    const trunkThick = settings.trunkThickness || 1.15;

    if (isRoot) {
      return Math.max(22, Math.min(34, 26 * trunkThick));
    }

    if (isLeaf) {
      return Math.max(3.2, 4.0 * tThick);
    }

    const totalLeaves = Math.max(1, root?.leafCount || 10);
    const descendantLeaves = Math.max(1, n.leafCount || 1);
    const globalRatio = descendantLeaves / totalLeaves;
    const maxL = Math.max(1, layout?.maxLevel || 8);
    const depthDecay = Math.max(0.35, 1 - ((n.level || 1) / maxL) * 0.55);

    // Natural botanical scaling: branches with more descendants are noticeably thicker and wider
    const descendantScale = Math.pow(globalRatio, 0.44);
    const thickness = (5.2 + 15.8 * descendantScale * depthDecay) * tThick;

    return Math.max(4.6, Math.min(24, thickness));
  }, [root?.leafCount, layout?.maxLevel, settings.trunkThickness, settings.branchThickness]);

  // High-performance Smooth Proportional Tapered Bezier Branch Rendering
  const renderBranch = (node: TreeNode, child: TreeNode) => {
    const mother = child.spouseParentId ? spouseMap.get(child.spouseParentId) : null;
    const p1 = mother ? getLivePos(mother) : getLivePos(node);
    const p2 = getLivePos(child);

    // Culling check for large trees
    if (viewportBox && !isPointInViewport(p1.x, p1.y) && !isPointInViewport(p2.x, p2.y)) {
      return null;
    }

    const isHierarchical = settings.treeStructureType === 'hierarchical';

    if (isHierarchical) {
      const bStyle = settings.branchStyle || 'orthogonal';
      const thick = Math.max(2, (settings.branchThickness || 1.0) * 2.5);
      const strokeColor = '#1F2937';

      let pathData = '';
      if (bStyle === 'straight') {
        pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      } else if (settings.layoutStyle === 'horizontal') {
        const midX = (p1.x + p2.x) / 2;
        pathData = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        const midY = (p1.y + p2.y) / 2;
        pathData = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
      }

      const isDotted = bStyle === 'dotted';

      return (
        <g key={`branch-${node.id}-${child.id}`}>
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={thick}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={isDotted ? '6 4' : undefined}
          />
        </g>
      );
    }

    const isDirectFromTrunk = node.level === 0;
    const parentThick = getNodeThickness(node);
    const childThick = getNodeThickness(child);
    const childDescendants = child.leafCount || 1;
    const parentDescendants = Math.max(1, node.leafCount || 1);
    const shareOfParent = childDescendants / parentDescendants;

    // Branches emerging from trunk are slightly smaller than trunk, scaling with children weight
    let wStart: number;
    if (isDirectFromTrunk) {
      wStart = Math.min(
        parentThick * 0.82,
        Math.max(childThick + 2.2, parentThick * (0.45 + 0.45 * Math.pow(shareOfParent, 0.45)))
      );
    } else {
      wStart = Math.min(
        parentThick * 0.88,
        Math.max(childThick + 1.8, parentThick * (0.42 + 0.58 * Math.pow(shareOfParent, 0.42)))
      );
    }

    const wEnd = childThick;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const bStyle = settings.branchStyle || 'natural';

    let cp1 = { x: p1.x + dx * 0.15, y: p1.y + dy * 0.4 };
    let cp2 = { x: p1.x + dx * 0.85, y: p1.y + dy * 0.7 };

    if (bStyle === 'straight') {
      cp1 = { x: p1.x + dx * 0.3, y: p1.y + dy * 0.3 };
      cp2 = { x: p1.x + dx * 0.7, y: p1.y + dy * 0.7 };
    } else if (bStyle === 'orthogonal') {
      cp1 = { x: p1.x, y: p1.y + dy * 0.5 };
      cp2 = { x: p2.x, y: p1.y + dy * 0.5 };
    }

    // Tangent and normal vectors for smooth ribbon geometry
    const len1 = Math.hypot(cp1.x - p1.x, cp1.y - p1.y) || 1;
    const n1 = { x: -(cp1.y - p1.y) / len1, y: (cp1.x - p1.x) / len1 };

    const len2 = Math.hypot(p2.x - cp2.x, p2.y - cp2.y) || 1;
    const n2 = { x: -(p2.y - cp2.y) / len2, y: (p2.x - cp2.x) / len2 };

    const nMidRaw = { x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 };
    const nMidLen = Math.hypot(nMidRaw.x, nMidRaw.y) || 1;
    const nMid = { x: nMidRaw.x / nMidLen, y: nMidRaw.y / nMidLen };

    const r1 = wStart / 2;
    const r2 = wEnd / 2;
    const rMid1 = (wStart * 0.7 + wEnd * 0.3) / 2;
    const rMid2 = (wStart * 0.3 + wEnd * 0.7) / 2;

    const leftP1 = { x: p1.x + n1.x * r1, y: p1.y + n1.y * r1 };
    const leftCP1 = { x: cp1.x + nMid.x * rMid1, y: cp1.y + nMid.y * rMid1 };
    const leftCP2 = { x: cp2.x + nMid.x * rMid2, y: cp2.y + nMid.y * rMid2 };
    const leftP2 = { x: p2.x + n2.x * r2, y: p2.y + n2.y * r2 };

    const rightP2 = { x: p2.x - n2.x * r2, y: p2.y - n2.y * r2 };
    const rightCP2 = { x: cp2.x - nMid.x * rMid2, y: cp2.y - nMid.y * rMid2 };
    const rightCP1 = { x: cp1.x - nMid.x * rMid1, y: cp1.y - nMid.y * rMid1 };
    const rightP1 = { x: p1.x - n1.x * r1, y: p1.y - n1.y * r1 };

    const taperedRibbonPath = `M ${leftP1.x.toFixed(1)} ${leftP1.y.toFixed(1)}
      C ${leftCP1.x.toFixed(1)} ${leftCP1.y.toFixed(1)}, ${leftCP2.x.toFixed(1)} ${leftCP2.y.toFixed(1)}, ${leftP2.x.toFixed(1)} ${leftP2.y.toFixed(1)}
      A ${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 1 ${rightP2.x.toFixed(1)} ${rightP2.y.toFixed(1)}
      C ${rightCP2.x.toFixed(1)} ${rightCP2.y.toFixed(1)}, ${rightCP1.x.toFixed(1)} ${rightCP1.y.toFixed(1)}, ${rightP1.x.toFixed(1)} ${rightP1.y.toFixed(1)}
      A ${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 1 ${leftP1.x.toFixed(1)} ${leftP1.y.toFixed(1)} Z`;

    const isDotted = bStyle === 'dotted';
    const centerLinePath = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)}, ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

    if (isDotted) {
      return (
        <g key={`branch-${node.id}-${child.id}`}>
          <path
            d={centerLinePath}
            fill="none"
            stroke="url(#branchGradRealistic)"
            strokeWidth={(wStart + wEnd) / 2}
            strokeLinecap="round"
            strokeDasharray="8 6"
          />
        </g>
      );
    }

    return (
      <g key={`branch-${node.id}-${child.id}`}>
        {/* Branch Drop Shadow */}
        <path
          d={taperedRibbonPath}
          fill="rgba(0,0,0,0.18)"
          transform="translate(2, 3)"
        />
        {/* Main Proportional Tapered Branch Body */}
        <path
          d={taperedRibbonPath}
          fill="url(#branchGradRealistic)"
          stroke="#1F0F07"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Junction Connection Collar for seamless organic transition matching parent & trunk */}
        <circle
          cx={p1.x}
          cy={p1.y}
          r={Math.max(r1 + 1.5, parentThick * 0.44)}
          fill="url(#branchGradRealistic)"
          stroke="#1F0F07"
          strokeWidth="0.8"
          opacity="0.95"
        />
      </g>
    );
  };

  // Draw Branches Recursively
  const renderAllBranches = (rootNode: TreeNode): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const traverse = (n: TreeNode) => {
      if (activeCollapsedIds.has(n.id)) return;
      n.children.forEach(child => {
        const b = renderBranch(n, child);
        if (b) elements.push(b);
        traverse(child);
      });
    };
    traverse(rootNode);
    return elements;
  };

  const bgPreset = bgPresets.find(p => p.id === settings.bgPreset) || bgPresets[0];

  // Render customizable hierarchical card shapes
  const renderHierarchicalCardContent = (w: number, h: number, fillVal: string, strokeVal: string, isShadow: boolean) => {
    const activeStyle = settings.leafStyle || 'realistic';
    const sOffset = isShadow ? 3 : 0;
    const shFill = "rgba(0,0,0,0.15)";
    
    if (activeStyle === 'royal_medallion') {
      const rxVal = h / 2;
      return (
        <rect
          x={-w / 2 + (isShadow ? 2 : 0)}
          y={-h / 2 + sOffset}
          width={w}
          height={h}
          rx={rxVal}
          fill={isShadow ? shFill : fillVal}
          stroke={isShadow ? "none" : strokeVal}
          strokeWidth={isShadow ? 0 : 2.5}
        />
      );
    } else if (activeStyle === 'heritage_cartouche') {
      if (isShadow) {
        return (
          <rect
            x={-w / 2 + 2}
            y={-h / 2 + 3}
            width={w}
            height={h}
            rx={6}
            fill={shFill}
          />
        );
      }
      return (
        <g>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={6}
            fill={fillVal}
            stroke={strokeVal}
            strokeWidth="2.5"
          />
          <rect
            x={-w / 2 + 3}
            y={-h / 2 + 3}
            width={w - 6}
            height={h - 6}
            rx={4}
            fill="none"
            stroke={strokeVal}
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.85"
          />
        </g>
      );
    } else if (activeStyle === 'pointed') {
      const c = 10;
      const pts = [
        `${-w/2 + c},${-h/2}`,
        `${w/2 - c},${-h/2}`,
        `${w/2},${-h/2 + c}`,
        `${w/2},${h/2 - c}`,
        `${w/2 - c},${h/2}`,
        `${-w/2 + c},${h/2}`,
        `${-w/2},${h/2 - c}`,
        `${-w/2},${-h/2 + c}`
      ].join(' ');
      
      if (isShadow) {
        return (
          <polygon
            points={pts}
            transform="translate(2, 3)"
            fill={shFill}
          />
        );
      }
      return (
        <polygon
          points={pts}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth="2.5"
        />
      );
    } else if (activeStyle === 'rounded') {
      return (
        <rect
          x={-w / 2 + (isShadow ? 2 : 0)}
          y={-h / 2 + sOffset}
          width={w}
          height={h}
          rx={18}
          fill={isShadow ? shFill : fillVal}
          stroke={isShadow ? "none" : strokeVal}
          strokeWidth={isShadow ? 0 : 2.5}
        />
      );
    } else if (activeStyle === 'olive') {
      const notch = 10;
      const dStr = `
        M ${-w/2 + notch} ${-h/2}
        L ${w/2 - notch} ${-h/2}
        Q ${w/2} ${-h/2} ${w/2} ${-h/2 + notch}
        L ${w/2} ${h/2 - notch}
        Q ${w/2} ${h/2} ${w/2 - notch} ${h/2}
        L ${-w/2 + notch} ${h/2}
        Q ${-w/2} ${h/2} ${-w/2} ${h/2 - notch}
        L ${-w/2} ${-h/2 + notch}
        Q ${-w/2} ${-h/2} ${-w/2 + notch} ${-h/2} Z
      `;
      
      if (isShadow) {
        return (
          <path
            d={dStr}
            transform="translate(2, 3)"
            fill={shFill}
          />
        );
      }
      return (
        <path
          d={dStr}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth="2.5"
        />
      );
    } else {
      return (
        <rect
          x={-w / 2 + (isShadow ? 2 : 0)}
          y={-h / 2 + sOffset}
          width={w}
          height={h}
          rx={8}
          fill={isShadow ? shFill : fillVal}
          stroke={isShadow ? "none" : strokeVal}
          strokeWidth={isShadow ? 0 : 2.5}
        />
      );
    }
  };

  // Draw Natural, Elegant Trunk and Roots Proportionally Harmonious with Tree
  const renderRealisticRoots = (rootNode: TreeNode) => {
    if (settings.layoutStyle === 'circular' || settings.treeStructureType === 'hierarchical') return null;
    const rx = rootNode.x;
    const ry = rootNode.y;
    
    const tThickness = settings.trunkThickness || 1.15;
    const rootThick = getNodeThickness(rootNode);
    
    // Balanced, elegant trunk dimensions
    const rootTopWidth = Math.max(28, Math.min(44, 30 * tThickness));
    const trunkMidWidth = rootTopWidth * 1.15;
    const trunkBaseWidth = Math.max(48, Math.min(72, rootTopWidth * 1.55));
    const rootFlareWidth = trunkBaseWidth * 1.35;

    // Compact, natural height that does not overpower the canopy
    const hasChain = settings.ancestralChain && settings.ancestralChain.length > 0;
    const chainHeightAllowance = hasChain ? settings.ancestralChain!.length * 42 + 60 : 0;
    const trunkHeight = Math.max(180, Math.min(320, 190 * tThickness + chainHeightAllowance * 0.7));
    const trunkBottom = ry + trunkHeight;

    // Authentic Botanical Root System matching the reference image (Tree of Life semicircular root web)
    const showRoots = settings.showRoots !== false;
    const rScale = (settings.rootScale || 1.0) * (settings.trunkThickness || 1.15);
    const activeStyle = settings.rootStyle || 'deep';

    const renderRootExtension = () => {
      if (!showRoots) return null;

      const rw = Math.max(160, 220 * rScale);
      const rh = Math.max(140, 200 * rScale);
      const bY = trunkBottom - 4;

      // Style 2: buttress (Giant, ribbed buttress roots - أكتاف دعامية عملاقة ومضلعة)
      if (activeStyle === 'buttress') {
        return (
          <g key="buttress-roots" className="roots-system-layer">
            <ellipse cx={rx} cy={bY + 22} rx={rw * 1.1} ry={26 * rScale} fill="rgba(0,0,0,0.22)" />
            <g fill="url(#trunkWoodGrad)" stroke="#1F0F07" strokeWidth="2.5" strokeLinejoin="round">
              <path d={`M ${rx - 15} ${bY - 20} L ${rx - 180 * rScale} ${bY + 25 * rScale} Q ${rx - 140 * rScale} ${bY + 32 * rScale} ${rx - 45} ${bY + 15} Z`} />
              <path d={`M ${rx + 15} ${bY - 20} L ${rx + 180 * rScale} ${bY + 25 * rScale} Q ${rx + 140 * rScale} ${bY + 32 * rScale} ${rx + 45} ${bY + 15} Z`} />
              <path d={`M ${rx - 25} ${bY - 10} L ${rx - 100 * rScale} ${bY + 45 * rScale} Q ${rx - 70 * rScale} ${bY + 48 * rScale} ${rx - 15} ${bY + 20} Z`} />
              <path d={`M ${rx + 25} ${bY - 10} L ${rx + 100 * rScale} ${bY + 45 * rScale} Q ${rx + 70 * rScale} ${bY + 48 * rScale} ${rx + 15} ${bY + 20} Z`} />
              <path d={`M ${rx - 12} ${bY} L ${rx - 25 * rScale} ${bY + 60 * rScale} L ${rx + 25 * rScale} ${bY + 60 * rScale} L ${rx + 12} ${bY} Z`} />
            </g>
            <g fill="none" stroke="url(#rootGoldTrimGrad)" strokeWidth={1.8 * rScale} opacity="0.85">
              <path d={`M ${rx - 10} ${bY - 15} L ${rx - 150 * rScale} ${bY + 22 * rScale}`} />
              <path d={`M ${rx + 10} ${bY - 15} L ${rx + 150 * rScale} ${bY + 22 * rScale}`} />
              <path d={`M ${rx - 18} ${bY - 5} L ${rx - 85 * rScale} ${bY + 40 * rScale}`} />
              <path d={`M ${rx + 18} ${bY - 5} L ${rx + 85 * rScale} ${bY + 40 * rScale}`} />
              <path d={`M ${rx} ${bY} L ${rx} ${bY + 55 * rScale}`} />
            </g>
          </g>
        );
      }

      // Style 3: palm_base (Heritage palm base - قاعدة النخلة التراثية)
      if (activeStyle === 'palm_base') {
        const bulgeW = 85 * rScale;
        return (
          <g key="palm-base-roots" className="roots-system-layer">
            <ellipse cx={rx} cy={bY + 12} rx={bulgeW * 1.1} ry={16 * rScale} fill="rgba(0,0,0,0.2)" />
            <g stroke="#5C3F2B" strokeWidth="1.5" opacity="0.8">
              {Array.from({ length: 30 }).map((_, i) => {
                const angle = Math.PI + (i / 29) * Math.PI;
                const rLen = (40 + ((i * 13) % 25)) * rScale;
                const fx = rx + Math.cos(angle) * bulgeW * 0.9;
                const fy = bY + 8 + Math.sin(angle) * 12 * rScale;
                const tx = fx + Math.cos(angle) * rLen;
                const ty = fy + Math.sin(angle) * rLen * 0.5;
                return <line key={i} x1={fx} y1={fy} x2={tx} y2={ty} />;
              })}
            </g>
            <path
              d={`M ${rx - 30} ${bY - 40}
                  C ${rx - bulgeW} ${bY - 30}, ${rx - bulgeW * 1.1} ${bY + 10}, ${rx} ${bY + 20 * rScale}
                  C ${rx + bulgeW * 1.1} ${bY + 10}, ${rx + bulgeW} ${bY - 30}, ${rx + 30} ${bY - 40} Z`}
              fill="url(#palmFiberGrad)"
              stroke="#2E1605"
              strokeWidth="2.5"
            />
            <g fill="#4F260A" stroke="#251204" strokeWidth="1" opacity="0.9">
              <polygon points={`${rx - 25},${bY - 25} ${rx},${bY - 15} ${rx - 50},${bY - 15}`} />
              <polygon points={`${rx + 25},${bY - 25} ${rx},${bY - 15} ${rx + 50},${bY - 15}`} />
              <polygon points={`${rx - 45},${bY - 10} ${rx - 20},${bY} ${rx - 70},${bY}`} />
              <polygon points={`${rx},${bY - 10} ${rx - 20},${bY} ${rx + 20},${bY}`} />
              <polygon points={`${rx + 45},${bY - 10} ${rx + 20},${bY} ${rx + 70},${bY}`} />
              <polygon points={`${rx - 25},${bY + 5} ${rx},${bY + 15} ${rx - 50},${bY + 15}`} />
              <polygon points={`${rx + 25},${bY + 5} ${rx},${bY + 15} ${rx + 50},${bY + 15}`} />
            </g>
            <path
              d={`M ${rx - bulgeW * 0.8} ${bY - 15} Q ${rx} ${bY + 12} ${rx + bulgeW * 0.8} ${bY - 15}`}
              fill="none"
              stroke="url(#rootGoldTrimGrad)"
              strokeWidth="2"
              opacity="0.6"
            />
          </g>
        );
      }

      // Style 4: spreading (Wide, elegant Andalusian spreading roots - جذور وارفة ممتدة)
      if (activeStyle === 'spreading') {
        const sw = rw * 1.35;
        return (
          <g key="spreading-roots" className="roots-system-layer">
            <ellipse cx={rx} cy={bY + 14} rx={sw * 0.95} ry={20 * rScale} fill="rgba(0,0,0,0.16)" />
            <g fill="url(#trunkWoodGrad)" stroke="#1F0F07" strokeWidth="2.2" strokeLinejoin="round">
              <path d={`M ${rx - 15} ${bY}
                        C ${rx - 100 * rScale} ${bY - 10}, ${rx - 180 * rScale} ${bY + 5}, ${rx - 280 * rScale} ${bY + 15 * rScale}
                        C ${rx - 310 * rScale} ${bY + 22 * rScale}, ${rx - 300 * rScale} ${bY + 35 * rScale}, ${rx - 270 * rScale} ${bY + 25 * rScale}
                        C ${rx - 190 * rScale} ${bY + 10 * rScale}, ${rx - 110 * rScale} ${bY + 25 * rScale}, ${rx - 30} ${bY + 20} Z`} />
              <path d={`M ${rx + 15} ${bY}
                        C ${rx + 100 * rScale} ${bY - 10}, ${rx + 180 * rScale} ${bY + 5}, ${rx + 280 * rScale} ${bY + 15 * rScale}
                        C ${rx + 310 * rScale} ${bY + 22 * rScale}, ${rx + 300 * rScale} ${bY + 35 * rScale}, ${rx + 270 * rScale} ${bY + 25 * rScale}
                        C ${rx + 190 * rScale} ${bY + 10 * rScale}, ${rx + 110 * rScale} ${bY + 25 * rScale}, ${rx + 30} ${bY + 20} Z`} />
              <path d={`M ${rx - 20} ${bY + 12}
                        Q ${rx - 90 * rScale} ${bY + 40 * rScale} ${rx - 140 * rScale} ${bY + 50 * rScale}
                        Q ${rx - 180 * rScale} ${bY + 58 * rScale} ${rx - 160 * rScale} ${bY + 30 * rScale}
                        Q ${rx - 140 * rScale} ${bY + 10} ${rx - 90 * rScale} ${bY + 24} Z`} />
              <path d={`M ${rx + 20} ${bY + 12}
                        Q ${rx + 90 * rScale} ${bY + 40 * rScale} ${rx + 140 * rScale} ${bY + 50 * rScale}
                        Q ${rx + 180 * rScale} ${bY + 58 * rScale} ${rx + 160 * rScale} ${bY + 30 * rScale}
                        Q ${rx + 140 * rScale} ${bY + 10} ${rx + 90 * rScale} ${bY + 24} Z`} />
            </g>
            <g fill="none" stroke="url(#rootGoldTrimGrad)" strokeWidth={1.5 * rScale} opacity="0.8">
              <path d={`M ${rx - 10} ${bY + 3} C ${rx - 100 * rScale} ${bY - 4}, ${rx - 180 * rScale} ${bY + 10}, ${rx - 275 * rScale} ${bY + 20 * rScale}`} />
              <path d={`M ${rx + 10} ${bY + 3} C ${rx + 100 * rScale} ${bY - 4}, ${rx + 180 * rScale} ${bY + 10}, ${rx + 275 * rScale} ${bY + 20 * rScale}`} />
            </g>
          </g>
        );
      }

      // Style 5: curling (Curled, artistic looping roots - جذور لولبية ملتفة)
      if (activeStyle === 'curling') {
        return (
          <g key="curling-roots" className="roots-system-layer">
            <ellipse cx={rx} cy={bY + 15} rx={rw * 0.9} ry={20 * rScale} fill="rgba(0,0,0,0.16)" />
            <g fill="none" stroke="url(#trunkWoodGrad)" strokeWidth={15 * rScale} strokeLinecap="round" strokeLinejoin="round">
              <path d={`M ${rx - 15} ${bY + 5} 
                        C ${rx - 80 * rScale} ${bY + 25 * rScale}, ${rx - 130 * rScale} ${bY + 65 * rScale}, ${rx - 110 * rScale} ${bY + 100 * rScale}
                        C ${rx - 90 * rScale} ${bY + 125 * rScale}, ${rx - 50 * rScale} ${bY + 110 * rScale}, ${rx - 65 * rScale} ${bY + 75 * rScale}
                        C ${rx - 75 * rScale} ${bY + 50 * rScale}, ${rx - 110 * rScale} ${bY + 45 * rScale}, ${rx - 140 * rScale} ${bY + 65 * rScale}`} />
              <path d={`M ${rx + 15} ${bY + 5} 
                        C ${rx + 80 * rScale} ${bY + 25 * rScale}, ${rx + 130 * rScale} ${bY + 65 * rScale}, ${rx + 110 * rScale} ${bY + 100 * rScale}
                        C ${rx + 90 * rScale} ${bY + 125 * rScale}, ${rx + 50 * rScale} ${bY + 110 * rScale}, ${rx + 65 * rScale} ${bY + 75 * rScale}
                        C ${rx + 75 * rScale} ${bY + 50 * rScale}, ${rx + 110 * rScale} ${bY + 45 * rScale}, ${rx + 140 * rScale} ${bY + 65 * rScale}`} />
            </g>
            <g fill="none" stroke="#231005" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
              <path d={`M ${rx - 15} ${bY + 5} 
                        C ${rx - 80 * rScale} ${bY + 25 * rScale}, ${rx - 130 * rScale} ${bY + 65 * rScale}, ${rx - 110 * rScale} ${bY + 100 * rScale}
                        C ${rx - 90 * rScale} ${bY + 125 * rScale}, ${rx - 50 * rScale} ${bY + 110 * rScale}, ${rx - 65 * rScale} ${bY + 75 * rScale}
                        C ${rx - 75 * rScale} ${bY + 50 * rScale}, ${rx - 110 * rScale} ${bY + 45 * rScale}, ${rx - 140 * rScale} ${bY + 65 * rScale}`} />
              <path d={`M ${rx + 15} ${bY + 5} 
                        C ${rx + 80 * rScale} ${bY + 25 * rScale}, ${rx + 130 * rScale} ${bY + 65 * rScale}, ${rx + 110 * rScale} ${bY + 100 * rScale}
                        C ${rx + 90 * rScale} ${bY + 125 * rScale}, ${rx + 50 * rScale} ${bY + 110 * rScale}, ${rx + 65 * rScale} ${bY + 75 * rScale}
                        C ${rx + 75 * rScale} ${bY + 50 * rScale}, ${rx + 110 * rScale} ${bY + 45 * rScale}, ${rx + 140 * rScale} ${bY + 65 * rScale}`} />
            </g>
            <g fill="#10B981" stroke="#047857" strokeWidth="1">
              <circle cx={rx - 110 * rScale} cy={bY + 100 * rScale} r={4 * rScale} />
              <circle cx={rx - 65 * rScale} cy={bY + 75 * rScale} r={3 * rScale} />
              <circle cx={rx + 110 * rScale} cy={bY + 100 * rScale} r={4 * rScale} />
              <circle cx={rx + 65 * rScale} cy={bY + 75 * rScale} r={3 * rScale} />
            </g>
          </g>
        );
      }

      // Style 6: mound (Spring green grassy flower mound - روضة ربيعية وتلة خضراء)
      if (activeStyle === 'mound') {
        const mw = 190 * rScale;
        const mh = 50 * rScale;
        return (
          <g key="mound-roots" className="roots-system-layer">
            <path
              d={`M ${rx - mw} ${bY + 15}
                  C ${rx - mw * 0.6} ${bY - mh}, ${rx + mw * 0.6} ${bY - mh}, ${rx + mw} ${bY + 15}
                  C ${rx + mw} ${bY + 25}, ${rx - mw} ${bY + 25}, ${rx - mw} ${bY + 15} Z`}
              fill="url(#rootMossGrad)"
              stroke="#047857"
              strokeWidth="2.5"
            />
            <g stroke="#064E3B" strokeWidth="2" fill="none">
              {Array.from({ length: 18 }).map((_, i) => {
                const gxPos = rx - mw * 0.8 + (i * mw * 1.6) / 17;
                const gyPos = bY + 12 - Math.sin((i / 17) * Math.PI) * mh * 0.8;
                return (
                  <path
                    key={i}
                    d={`M ${gxPos} ${gyPos} Q ${gxPos - 5} ${gyPos - 18 * rScale} ${gxPos - 8} ${gyPos - 22 * rScale}
                        M ${gxPos} ${gyPos} Q ${gxPos + 6} ${gyPos - 14 * rScale} ${gxPos + 10} ${gyPos - 16 * rScale}`}
                    stroke="#DDF135"
                    strokeWidth="1.2"
                    opacity="0.9"
                  />
                );
              })}
            </g>
            <g>
              {[
                { dx: -120, dy: 10, color: '#F43F5E' },
                { dx: -80, dy: -5, color: '#F59E0B' },
                { dx: -40, dy: -15, color: '#EC4899' },
                { dx: 0, dy: -20, color: '#EF4444' },
                { dx: 30, dy: -14, color: '#10B981' },
                { dx: 70, dy: -6, color: '#8B5CF6' },
                { dx: 110, dy: 8, color: '#3B82F6' },
                { dx: -100, dy: 5, color: '#FFF' },
                { dx: 90, dy: 4, color: '#F43F5E' },
                { dx: -15, dy: -8, color: '#FEF08A' },
                { dx: 45, dy: -2, color: '#FFF' },
              ].map((f, i) => {
                const fx = rx + f.dx * rScale;
                const fy = bY + f.dy * rScale;
                const r = 4.5 * Math.max(0.8, rScale);
                return (
                  <g key={i}>
                    <circle cx={fx - r/2} cy={fy} r={r/2} fill={f.color} />
                    <circle cx={fx + r/2} cy={fy} r={r/2} fill={f.color} />
                    <circle cx={fx} cy={fy - r/2} r={r/2} fill={f.color} />
                    <circle cx={fx} cy={fy + r/2} r={r/2} fill={f.color} />
                    <circle cx={fx} cy={fy} r={r * 0.35} fill="#FEF08A" />
                  </g>
                );
              })}
            </g>
          </g>
        );
      }

      // Style 7: stone (Marble Andalusian golden terrace - مصطبة رخامية أندلسية)
      if (activeStyle === 'stone') {
        const pw = 160 * rScale;
        return (
          <g key="stone-terrace" className="roots-system-layer">
            <rect x={rx - pw * 1.1} y={bY + 12} width={pw * 2.2} height={24 * rScale} rx={4} fill="rgba(0,0,0,0.22)" />
            <rect
              x={rx - pw}
              y={bY + 8}
              width={pw * 2}
              height={18 * rScale}
              rx={4}
              fill="url(#rootStoneGrad)"
              stroke="#475569"
              strokeWidth="2.5"
            />
            <rect
              x={rx - pw + 2}
              y={bY + 10}
              width={pw * 2 - 4}
              height={3 * rScale}
              fill="none"
              stroke="url(#rootGoldTrimGrad)"
              strokeWidth="1.5"
            />
            <rect
              x={rx - pw * 0.65}
              y={bY - 12 * rScale}
              width={pw * 1.3}
              height={20 * rScale}
              rx={3}
              fill="url(#rootStoneGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            <rect
              x={rx - pw * 0.65 + 2}
              y={bY - 10 * rScale}
              width={pw * 1.3 - 4}
              height={3 * rScale}
              fill="none"
              stroke="url(#rootGoldTrimGrad)"
              strokeWidth="1.5"
            />
            <g stroke="#D97706" strokeWidth="1.5" fill="none" opacity="0.85">
              <path d={`M ${rx - pw * 0.5} ${bY + 14} L ${rx - pw * 0.45} ${bY + 10} Q ${rx - pw * 0.35} ${bY + 10} ${rx - pw * 0.3} ${bY + 14}`} />
              <path d={`M ${rx - pw * 0.3} ${bY + 14} L ${rx - pw * 0.25} ${bY + 10} Q ${rx - pw * 0.15} ${bY + 10} ${rx - pw * 0.1} ${bY + 14}`} />
              <path d={`M ${rx + pw * 0.5} ${bY + 14} L ${rx + pw * 0.45} ${bY + 10} Q ${rx + pw * 0.35} ${bY + 10} ${rx + pw * 0.3} ${bY + 14}`} />
              <path d={`M ${rx + pw * 0.3} ${bY + 14} L ${rx + pw * 0.25} ${bY + 10} Q ${rx + pw * 0.15} ${bY + 10} ${rx + pw * 0.1} ${bY + 14}`} />
              <path
                d={`M ${rx - 25 * rScale} ${bY + 8} 
                    Q ${rx - 20 * rScale} ${bY - 4 * rScale} ${rx} ${bY - 10 * rScale}
                    Q ${rx + 20 * rScale} ${bY - 4 * rScale} ${rx + 25 * rScale} ${bY + 8}`}
              />
            </g>
          </g>
        );
      }

      // Style 8: minimal (Minimal calm leafy base - قاعدة نباتية رشيقة وهادئة)
      if (activeStyle === 'minimal') {
        const mw = 120 * rScale;
        return (
          <g key="minimal-base" className="roots-system-layer">
            <ellipse cx={rx} cy={bY + 12} rx={mw * 0.85} ry={10 * rScale} fill="rgba(0,0,0,0.1)" />
            <path
              d={`M ${rx - mw} ${bY + 10} Q ${rx} ${bY - 8 * rScale} ${rx + mw} ${bY + 10}`}
              fill="none"
              stroke="url(#rootGoldTrimGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d={`M ${rx - mw * 0.85} ${bY + 12} Q ${rx} ${bY - 2 * rScale} ${rx + mw * 0.85} ${bY + 12}`}
              fill="none"
              stroke="#475569"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d={`M ${rx - mw * 0.5} ${bY + 4} Q ${rx - mw * 0.7} ${bY - 12} ${rx - mw * 0.95} ${bY - 4}`}
              fill="none"
              stroke="#059669"
              strokeWidth="2"
            />
            <circle cx={rx - mw * 0.95} cy={bY - 4} r={4.5 * rScale} fill="#34D399" stroke="#047857" strokeWidth="1" />
            <circle cx={rx - mw * 0.72} cy={bY - 8} r={3.5 * rScale} fill="#34D399" stroke="#047857" strokeWidth="1" />
            <path
              d={`M ${rx + mw * 0.5} ${bY + 4} Q ${rx + mw * 0.7} ${bY - 12} ${rx + mw * 0.95} ${bY - 4}`}
              fill="none"
              stroke="#059669"
              strokeWidth="2"
            />
            <circle cx={rx + mw * 0.95} cy={bY - 4} r={4.5 * rScale} fill="#34D399" stroke="#047857" strokeWidth="1" />
            <circle cx={rx + mw * 0.72} cy={bY - 8} r={3.5 * rScale} fill="#34D399" stroke="#047857" strokeWidth="1" />
          </g>
        );
      }

      // Default Style 1: deep (Deep, ancient taproots - جذور وتدية عميقة وعتيقة)
      return (
        <g key="authentic-botanical-roots" className="roots-system-layer">
          {/* Subtle Ground Shadow */}
          <ellipse
            cx={rx}
            cy={bY + 18}
            rx={rw * 0.95}
            ry={22 * rScale}
            fill="rgba(0,0,0,0.18)"
          />

          {/* Core Solid Roots Silhouette & Filigree Branches (Matching Reference Illustration) */}
          <g fill="url(#trunkWoodGrad)" stroke="#1F0F07" strokeWidth="2.2" strokeLinejoin="round">
            {/* 1. Left Horizontal Surface Roots (Arching outward to lateral tip) */}
            <path
              d={`M ${rx - 24} ${bY}
                  C ${rx - 65} ${bY + 8}, ${rx - 120} ${bY + 4}, ${rx - 175 * rScale} ${bY + 12 * rScale}
                  C ${rx - 195 * rScale} ${bY + 18 * rScale}, ${rx - 215 * rScale} ${bY + 24 * rScale}, ${rx - 225 * rScale} ${bY + 18 * rScale}
                  C ${rx - 210 * rScale} ${bY + 32 * rScale}, ${rx - 180 * rScale} ${bY + 28 * rScale}, ${rx - 150 * rScale} ${bY + 24 * rScale}
                  C ${rx - 105 * rScale} ${bY + 26 * rScale}, ${rx - 55} ${bY + 24}, ${rx - 20} ${bY + 28} Z`}
            />

            {/* 2. Right Horizontal Surface Roots (Arching outward to lateral tip) */}
            <path
              d={`M ${rx + 24} ${bY}
                  C ${rx + 65} ${bY + 8}, ${rx + 120} ${bY + 4}, ${rx + 175 * rScale} ${bY + 12 * rScale}
                  C ${rx + 195 * rScale} ${bY + 18 * rScale}, ${rx + 215 * rScale} ${bY + 24 * rScale}, ${rx + 225 * rScale} ${bY + 18 * rScale}
                  C ${rx + 210 * rScale} ${bY + 32 * rScale}, ${rx + 180 * rScale} ${bY + 28 * rScale}, ${rx + 150 * rScale} ${bY + 24 * rScale}
                  C ${rx + 105 * rScale} ${bY + 26 * rScale}, ${rx + 55} ${bY + 24}, ${rx + 20} ${bY + 28} Z`}
            />

            {/* 3. Left Outer Cascading Root & Bifurcations */}
            <path
              d={`M ${rx - 32} ${bY + 15}
                  C ${rx - 75} ${bY + 32}, ${rx - 125 * rScale} ${bY + 55 * rScale}, ${rx - 165 * rScale} ${bY + 85 * rScale}
                  C ${rx - 185 * rScale} ${bY + 115 * rScale}, ${rx - 190 * rScale} ${bY + 145 * rScale}, ${rx - 175 * rScale} ${bY + 165 * rScale}
                  C ${rx - 165 * rScale} ${bY + 150 * rScale}, ${rx - 165 * rScale} ${bY + 120 * rScale}, ${rx - 145 * rScale} ${bY + 95 * rScale}
                  C ${rx - 110 * rScale} ${bY + 70 * rScale}, ${rx - 65} ${bY + 48}, ${rx - 26} ${bY + 35} Z`}
            />

            {/* 4. Right Outer Cascading Root & Bifurcations */}
            <path
              d={`M ${rx + 32} ${bY + 15}
                  C ${rx + 75} ${bY + 32}, ${rx + 125 * rScale} ${bY + 55 * rScale}, ${rx + 165 * rScale} ${bY + 85 * rScale}
                  C ${rx + 185 * rScale} ${bY + 115 * rScale}, ${rx + 190 * rScale} ${bY + 145 * rScale}, ${rx + 175 * rScale} ${bY + 165 * rScale}
                  C ${rx + 165 * rScale} ${bY + 150 * rScale}, ${rx + 165 * rScale} ${bY + 120 * rScale}, ${rx + 145 * rScale} ${bY + 95 * rScale}
                  C ${rx + 110 * rScale} ${bY + 70 * rScale}, ${rx + 65} ${bY + 48}, ${rx + 26} ${bY + 35} Z`}
            />

            {/* 5. Left Intermediate Downward Root */}
            <path
              d={`M ${rx - 25} ${bY + 30}
                  C ${rx - 60} ${bY + 65 * rScale}, ${rx - 95 * rScale} ${bY + 110 * rScale}, ${rx - 120 * rScale} ${bY + 170 * rScale}
                  C ${rx - 125 * rScale} ${bY + 195 * rScale}, ${rx - 110 * rScale} ${bY + 215 * rScale}, ${rx - 95 * rScale} ${bY + 195 * rScale}
                  C ${rx - 90 * rScale} ${bY + 175 * rScale}, ${rx - 80 * rScale} ${bY + 130 * rScale}, ${rx - 55} ${bY + 85 * rScale}
                  C ${rx - 40} ${bY + 60}, ${rx - 20} ${bY + 42}, ${rx - 18} ${bY + 40} Z`}
            />

            {/* 6. Right Intermediate Downward Root */}
            <path
              d={`M ${rx + 25} ${bY + 30}
                  C ${rx + 60} ${bY + 65 * rScale}, ${rx + 95 * rScale} ${bY + 110 * rScale}, ${rx + 120 * rScale} ${bY + 170 * rScale}
                  C ${rx + 125 * rScale} ${bY + 195 * rScale}, ${rx + 110 * rScale} ${bY + 215 * rScale}, ${rx + 95 * rScale} ${bY + 195 * rScale}
                  C ${rx - 90 * rScale} ${bY + 175 * rScale}, ${rx + 80 * rScale} ${bY + 130 * rScale}, ${rx + 55} ${bY + 85 * rScale}
                  C ${rx + 40} ${bY + 60}, ${rx + 20} ${bY + 42}, ${rx + 18} ${bY + 40} Z`}
            />

            {/* 7. Central Primary Deep Taproot Cluster */}
            <path
              d={`M ${rx - 18} ${bY + 35}
                  C ${rx - 30} ${bY + 95 * rScale}, ${rx - 45 * rScale} ${bY + 160 * rScale}, ${rx - 35 * rScale} ${bY + 230 * rScale}
                  C ${rx - 25 * rScale} ${bY + 245 * rScale}, ${rx - 15 * rScale} ${bY + 240 * rScale}, ${rx - 12 * rScale} ${bY + 225 * rScale}
                  C ${rx - 15 * rScale} ${bY + 170 * rScale}, ${rx - 8} ${bY + 115 * rScale}, ${rx} ${bY + 65}
                  C ${rx + 8} ${bY + 115 * rScale}, ${rx + 15 * rScale} ${bY + 170 * rScale}, ${rx + 12 * rScale} ${bY + 225 * rScale}
                  C ${rx + 15 * rScale} ${bY + 240 * rScale}, ${rx + 25 * rScale} ${bY + 245 * rScale}, ${rx + 35 * rScale} ${bY + 230 * rScale}
                  C ${rx + 45 * rScale} ${bY + 160 * rScale}, ${rx + 30} ${bY + 95 * rScale}, ${rx + 18} ${bY + 35} Z`}
            />

            {/* Center Vertical Anchor Taproot */}
            <path
              d={`M ${rx - 8} ${bY + 50}
                  C ${rx - 6} ${bY + 120 * rScale}, ${rx - 4} ${bY + 190 * rScale}, ${rx} ${bY + 255 * rScale}
                  C ${rx + 4} ${bY + 190 * rScale}, ${rx + 6} ${bY + 120 * rScale}, ${rx + 8} ${bY + 50} Z`}
            />
          </g>

          {/* Intricate Secondary Filigree Rootlets & Tendrils */}
          <g fill="none" stroke="#2D150A" strokeLinecap="round">
            <path d={`M ${rx - 140 * rScale} ${bY + 24 * rScale} Q ${rx - 170 * rScale} ${bY + 45 * rScale} ${rx - 195 * rScale} ${bY + 65 * rScale}`} strokeWidth={3.8 * rScale} />
            <path d={`M ${rx - 165 * rScale} ${bY + 42 * rScale} Q ${rx - 190 * rScale} ${bY + 70 * rScale} ${rx - 205 * rScale} ${bY + 105 * rScale}`} strokeWidth={2.6 * rScale} />
            <path d={`M ${rx - 110 * rScale} ${bY + 40 * rScale} Q ${rx - 145 * rScale} ${bY + 75 * rScale} ${rx - 160 * rScale} ${bY + 125 * rScale}`} strokeWidth={3.2 * rScale} />
            <path d={`M ${rx + 140 * rScale} ${bY + 24 * rScale} Q ${rx + 170 * rScale} ${bY + 45 * rScale} ${rx + 195 * rScale} ${bY + 65 * rScale}`} strokeWidth={3.8 * rScale} />
            <path d={`M ${rx + 165 * rScale} ${bY + 42 * rScale} Q ${rx + 190 * rScale} ${bY + 70 * rScale} ${rx + 205 * rScale} ${bY + 105 * rScale}`} strokeWidth={2.6 * rScale} />
            <path d={`M ${rx + 110 * rScale} ${bY + 40 * rScale} Q ${rx + 145 * rScale} ${bY + 75 * rScale} ${rx + 160 * rScale} ${bY + 125 * rScale}`} strokeWidth={3.2 * rScale} />
            <path d={`M ${rx - 135 * rScale} ${bY + 95 * rScale} Q ${rx - 155 * rScale} ${bY + 140 * rScale} ${rx - 150 * rScale} ${bY + 185 * rScale}`} strokeWidth={3.0 * rScale} />
            <path d={`M ${rx - 95 * rScale} ${bY + 80 * rScale} Q ${rx - 120 * rScale} ${bY + 135 * rScale} ${rx - 130 * rScale} ${bY + 190 * rScale}`} strokeWidth={3.4 * rScale} />
            <path d={`M ${rx - 75 * rScale} ${bY + 100 * rScale} Q ${rx - 95 * rScale} ${bY + 160 * rScale} ${rx - 85 * rScale} ${bY + 225 * rScale}`} strokeWidth={3.0 * rScale} />
            <path d={`M ${rx - 55 * rScale} ${bY + 115 * rScale} Q ${rx - 68 * rScale} ${bY + 175 * rScale} ${rx - 55 * rScale} ${bY + 240 * rScale}`} strokeWidth={2.8 * rScale} />
            <path d={`M ${rx + 135 * rScale} ${bY + 95 * rScale} Q ${rx + 155 * rScale} ${bY + 140 * rScale} ${rx + 150 * rScale} ${bY + 185 * rScale}`} strokeWidth={3.0 * rScale} />
            <path d={`M ${rx + 95 * rScale} ${bY + 80 * rScale} Q ${rx + 120 * rScale} ${bY + 135 * rScale} ${rx + 130 * rScale} ${bY + 190 * rScale}`} strokeWidth={3.4 * rScale} />
            <path d={`M ${rx + 75 * rScale} ${bY + 100 * rScale} Q ${rx + 95 * rScale} ${bY + 160 * rScale} ${rx + 85 * rScale} ${bY + 225 * rScale}`} strokeWidth={3.0 * rScale} />
            <path d={`M ${rx + 55 * rScale} ${bY + 115 * rScale} Q ${rx + 68 * rScale} ${bY + 175 * rScale} ${rx + 55 * rScale} ${bY + 240 * rScale}`} strokeWidth={2.8 * rScale} />
            <path d={`M ${rx - 28 * rScale} ${bY + 150 * rScale} Q ${rx - 35 * rScale} ${bY + 205 * rScale} ${rx - 25 * rScale} ${bY + 250 * rScale}`} strokeWidth={2.5 * rScale} />
            <path d={`M ${rx + 28 * rScale} ${bY + 150 * rScale} Q ${rx + 35 * rScale} ${bY + 205 * rScale} ${rx + 25 * rScale} ${bY + 250 * rScale}`} strokeWidth={2.5 * rScale} />
            <path d={`M ${rx - 15 * rScale} ${bY + 170 * rScale} Q ${rx - 12 * rScale} ${bY + 220 * rScale} ${rx - 8 * rScale} ${bY + 255 * rScale}`} strokeWidth={2.2 * rScale} />
            <path d={`M ${rx + 15 * rScale} ${bY + 170 * rScale} Q ${rx + 12 * rScale} ${bY + 220 * rScale} ${rx + 8 * rScale} ${bY + 255 * rScale}`} strokeWidth={2.2 * rScale} />
          </g>

          {/* Delicate Bark Veins & Gold-Tint Highlights */}
          <g fill="none" stroke="url(#rootGoldTrimGrad)" strokeWidth={1.4 * rScale} strokeLinecap="round" opacity="0.8">
            <path d={`M ${rx - 20} ${bY + 6} C ${rx - 60} ${bY + 12}, ${rx - 110 * rScale} ${bY + 10}, ${rx - 165 * rScale} ${bY + 18 * rScale}`} />
            <path d={`M ${rx + 20} ${bY + 6} C ${rx + 60} ${bY + 12}, ${rx + 110 * rScale} ${bY + 10}, ${rx + 165 * rScale} ${bY + 18 * rScale}`} />
            <path d={`M ${rx - 28} ${bY + 22} C ${rx - 65} ${bY + 45 * rScale}, ${rx - 110 * rScale} ${bY + 75 * rScale}, ${rx - 145 * rScale} ${bY + 115 * rScale}`} />
            <path d={`M ${rx + 28} ${bY + 22} C ${rx + 65} ${bY + 45 * rScale}, ${rx + 110 * rScale} ${bY + 75 * rScale}, ${rx + 145 * rScale} ${bY + 115 * rScale}`} />
            <path d={`M ${rx} ${bY + 25} C ${rx - 6} ${bY + 85 * rScale}, ${rx - 12 * rScale} ${bY + 150 * rScale}, ${rx} ${bY + 240 * rScale}`} />
          </g>
        </g>
      );
    };

    const renderSmallRootIcons = () => {
      if (!showRoots) return null;
      const bY = trunkBottom - 4;

      // Thematic expanded icon sets of exactly 13 elements to match offsets
      let icons: string[] = ['🌱', '🌿', '🍀', '🍃', '🌱', '🌿', '🍀', '🍃', '🌱', '🌿', '🍀', '🍃', '🌱'];
      if (activeStyle === 'deep') {
        icons = ['🌱', '🌿', '🍀', '🍃', '🌱', '🌿', '🍀', '🍃', '🌱', '🌿', '🍀', '🍃', '🌱'];
      } else if (activeStyle === 'buttress') {
        icons = ['🪵', '🌱', '🌿', '🍄', '🌱', '🍄', '🌿', '🪵', '🌱', '🌿', '🍄', '🌱', '🌿'];
      } else if (activeStyle === 'palm_base') {
        icons = ['🌴', '🌾', '🌱', '🐫', '🏜️', '🌾', '🌱', '🌴', '🌾', '🌱', '🐫', '🏜️', '🌾'];
      } else if (activeStyle === 'spreading') {
        icons = ['🌿', '🍀', '🌸', '🌱', '🌺', '🌸', '🌿', '🍀', '🌱', '🌺', '🌸', '🌿', '🌱'];
      } else if (activeStyle === 'curling') {
        icons = ['➰', '🍃', '🍀', '🌿', '🌱', '🌾', '🍃', '➰', '🍀', '🌿', '🌱', '🍃', '🌾'];
      } else if (activeStyle === 'mound') {
        icons = ['🌷', '🌼', '🌸', '🌱', '🌻', '🍀', '🌷', '🌼', '🌸', '🌻', '🍀', '🌷', '🌼'];
      } else if (activeStyle === 'stone') {
        icons = ['🏛️', '🪨', '🏺', '🌱', '🪨', '🏺', '🏛️', '🪨', '🏺', '🌱', '🪨', '🏺', '🏛️'];
      } else if (activeStyle === 'minimal') {
        icons = ['🍃', '🌱', '🍃', '🌱', '🍃', '🌱', '🍃', '🌱', '🍃', '🌱', '🍃', '🌱', '🍃'];
      }

      const offsets = [
        { dx: -130, dy: 16, size: 19 },
        { dx: -100, dy: 22, size: 16 },
        { dx: -70, dy: 28, size: 15 },
        { dx: -40, dy: 32, size: 14 },
        { dx: -15, dy: 34, size: 16 },
        { dx: 15, dy: 33, size: 17 },
        { dx: 45, dy: 31, size: 15 },
        { dx: 75, dy: 27, size: 16 },
        { dx: 105, dy: 21, size: 18 },
        { dx: 135, dy: 14, size: 20 },
        { dx: -55, dy: 40, size: 15 },
        { dx: 55, dy: 39, size: 16 },
        { dx: 0, dy: 44, size: 17 },
      ];

      return (
        <g key="small-root-decorations" className="small-root-icons-layer">
          {icons.map((emoji, index) => {
            const offset = offsets[index % offsets.length];
            const px = rx + offset.dx * rScale;
            const py = bY + offset.dy * rScale;
            const size = offset.size * Math.max(0.8, rScale);

            return (
              <g key={`root-icon-${index}`} transform={`translate(${px}, ${py})`}>
                <ellipse
                  cx={0}
                  cy={size * 0.4}
                  rx={size * 0.5}
                  ry={size * 0.15}
                  fill="rgba(0,0,0,0.12)"
                />
                <text
                  x="0"
                  y={size * 0.3}
                  textAnchor="middle"
                  fontSize={size}
                  style={{ userSelect: 'none' }}
                >
                  {emoji}
                </text>
              </g>
            );
          })}
        </g>
      );
    };

    return (
      <g key="realistic-roots" className="pointer-events-none">
        {/* Organic Buttress Roots Base Shadow */}
        <path
          d={`M ${rx - rootFlareWidth} ${trunkBottom + 6}
              Q ${rx} ${trunkBottom - 18} ${rx + rootFlareWidth} ${trunkBottom + 6}
              L ${rx + rootFlareWidth + 14} ${trunkBottom + 22}
              Q ${rx} ${trunkBottom + 30} ${rx - rootFlareWidth - 14} ${trunkBottom + 22} Z`}
          fill="rgba(0,0,0,0.18)"
        />

        {/* Dynamic Root Extensions */}
        {renderRootExtension()}

        {/* Small Root Icons */}
        {renderSmallRootIcons()}

        {/* Natural Slender Tapered Trunk Pillar */}
        <path
          d={`M ${rx - rootTopWidth / 2} ${ry}
              C ${rx - trunkMidWidth * 0.65} ${ry + trunkHeight * 0.4}, ${rx - trunkBaseWidth * 0.85} ${trunkBottom - 50}, ${rx - rootFlareWidth} ${trunkBottom}
              C ${rx - trunkBaseWidth * 0.45} ${trunkBottom + 16}, ${rx + trunkBaseWidth * 0.45} ${trunkBottom + 16}, ${rx + rootFlareWidth} ${trunkBottom}
              C ${rx + trunkBaseWidth * 0.85} ${trunkBottom - 50}, ${rx + trunkMidWidth * 0.65} ${ry + trunkHeight * 0.4}, ${rx + rootTopWidth / 2} ${ry} Z`}
          fill="url(#trunkWoodGrad)"
          stroke="#1F0F07"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Seamless Trunk Crown Flaring Joint at branch origin */}
        <ellipse
          cx={rx}
          cy={ry}
          rx={rootTopWidth / 2}
          ry={Math.max(6, rootThick * 0.28)}
          fill="url(#trunkWoodGrad)"
          stroke="#1F0F07"
          strokeWidth="1.5"
        />

        {/* Ancestral Lineage Chain on the Trunk */}
        {settings.ancestralChain && settings.ancestralChain.length > 0 && (
          <g key="trunk-ancestral-lineage">
            <line
              x1={rx}
              y1={trunkBottom - 35}
              x2={rx}
              y2={ry + 45}
              stroke="#D97706"
              strokeWidth="3"
              strokeDasharray="5 3"
              opacity="0.85"
            />
            {settings.ancestralChain.map((ancestorName, idx) => {
              const count = settings.ancestralChain!.length;
              const startY = trunkBottom - 45;
              const endY = ry + 75;
              const stepY = (startY - endY) / Math.max(1, count);
              const cyPos = startY - idx * stepY;
              const pillW = Math.max(105, ancestorName.length * 14 + 38);
              const pillH = 34;

              return (
                <g key={`ancestor-chain-${idx}`} transform={`translate(${rx}, ${cyPos})`}>
                  <rect
                    x={-pillW / 2}
                    y={-pillH / 2}
                    width={pillW}
                    height={pillH}
                    rx={pillH / 2}
                    fill="url(#trunkLineageCartoucheGrad)"
                    stroke="#78350F"
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontWeight="900"
                    fontSize="13"
                    fill="#2A170C"
                  >
                    {ancestorName}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    );
  };

  // Draw Individual Node
  const renderNode = (node: TreeNode) => {
    const isRoot = node.level === 0;
    const isLeaf = node.children.length === 0;
    const override = nodeOverrides[node.id] || {};
    const isFemale = node.gender === 'female';
    const isSelected = selectedNode?.id === node.id;
    const showGlow = settings.showLeafGlow !== false;
    const glowColor = settings.leafGlowColor || '#FEF08A';
    const glowIntensity = settings.leafGlowIntensity ?? 0.65;

    const pos = getLivePos(node);
    const cx = pos.x;
    const cy = pos.y;

    // Viewport Culling check for 2000+ nodes
    if (viewportBox && !isPointInViewport(cx, cy)) {
      return null;
    }

    const isHierarchical = settings.treeStructureType === 'hierarchical';

    if (isHierarchical) {
      const nameLen = node.name.length;
      const effectiveFontSize = Math.round(
        (override.fontSize ||
          (isRoot
            ? settings.trunkFontSize
            : isLeaf
            ? settings.leafFontSize
            : settings.branchFontSize)) * settings.globalFontScale * 0.85
      );
      const nodeScale = (override.scale || 1.0) * (isLeaf ? ((settings.leafSize || 100) / 100) : 1.0);
      
      const boxW = Math.max(145, nameLen * effectiveFontSize * 0.75 + 40) * nodeScale;
      const boxH = (52 + (node.title && settings.showTitles ? 16 : 0)) * nodeScale;

      let bg = '#FFFFFF';
      let stroke = '#1F2937';
      let textColor = '#111827';

      if (isRoot) {
        bg = '#FBBF24'; // Amber
        stroke = '#B45309';
        textColor = '#78350F';
      } else if (isFemale) {
        bg = '#FDF2F8'; // light pink
        stroke = '#DB2777';
        textColor = '#831843';
      } else {
        // Males: clean light blue
        bg = '#F0F9FF';
        stroke = '#0369A1';
        textColor = '#0C4A6E';
      }

      if (override.colorOverride) {
        bg = override.colorOverride;
      }
      if (override.textColorOverride) {
        textColor = override.textColorOverride;
      }

      return (
        <g key={`node-${node.id}`} className="cursor-pointer">
          <g transform={`translate(${cx}, ${cy})`}>
            {/* Glow if configured */}
            {showGlow && (
              <rect
                x={-boxW / 2 - 5}
                y={-boxH / 2 - 5}
                width={boxW + 10}
                height={boxH + 10}
                rx={12}
                fill={glowColor}
                opacity={glowIntensity * 0.5}
              />
            )}

            {/* Shadow */}
            {renderHierarchicalCardContent(boxW, boxH, bg, stroke, true)}

            {/* Main box */}
            {renderHierarchicalCardContent(boxW, boxH, bg, stroke, false)}

            {/* Title */}
            {node.title && settings.showTitles && (
              <text
                x="0"
                y={-boxH / 2 + 18}
                textAnchor="middle"
                fontSize={effectiveFontSize * 0.8}
                fontWeight="bold"
                fill={isRoot ? '#78350F' : '#6B7280'}
              >
                {node.title}
              </text>
            )}

            {/* Name */}
            <text
              x="0"
              y={node.title && settings.showTitles ? 12 : 5}
              textAnchor="middle"
              fontWeight="bold"
              fontSize={effectiveFontSize}
              fill={textColor}
            >
              {node.name}
            </text>

            {/* Selection indicator */}
            {isSelected && (
              <rect
                x={-boxW / 2 - 6}
                y={-boxH / 2 - 6}
                width={boxW + 12}
                height={boxH + 12}
                rx={12}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
            )}

            {/* Click / Drag Target */}
            <rect
              x={-boxW / 2 - 12}
              y={-boxH / 2 - 12}
              width={boxW + 24}
              height={boxH + 24}
              fill="transparent"
              data-node-id={node.id}
              onPointerDown={e => handleNodePointerDown(node, e)}
            />
          </g>
        </g>
      );
    }

    const effectiveFontSize = Math.round(
      (override.fontSize ||
        (isRoot
          ? settings.trunkFontSize
          : isLeaf
          ? settings.leafFontSize
          : settings.branchFontSize)) * settings.globalFontScale
    );

    const nodeScale = (override.scale || 1.0) * (isLeaf ? ((settings.leafSize || 100) / 100) : 1.0);

    // 1. ROOT NODE (Founder Plaque)
    if (isRoot) {
      const plaqueW = Math.max(150, node.name.length * effectiveFontSize * 0.65 + 50) * nodeScale;
      const plaqueH = (56 + (node.title ? 18 : 0)) * nodeScale;

      return (
        <g key={`node-${node.id}`} className="cursor-pointer">
          {renderRealisticRoots(node)}

          <g transform={`translate(${cx}, ${cy})`}>
            {showGlow && (
              <rect
                x={-plaqueW / 2 - 6}
                y={-plaqueH / 2 - 6}
                width={plaqueW + 12}
                height={plaqueH + 12}
                rx={(plaqueH + 12) / 2}
                fill={glowColor}
                opacity={glowIntensity * 0.7}
              />
            )}

            <rect
              x={-plaqueW / 2 + 3}
              y={-plaqueH / 2 + 4}
              width={plaqueW}
              height={plaqueH}
              rx={plaqueH / 2}
              fill="rgba(0,0,0,0.3)"
            />

            <rect
              x={-plaqueW / 2}
              y={-plaqueH / 2}
              width={plaqueW}
              height={plaqueH}
              rx={plaqueH / 2}
              fill={override.colorOverride || (settings.trunkBgColor === 'wood' || !settings.trunkBgColor ? 'url(#woodCartoucheGrad)' : settings.trunkBgColor)}
              stroke={settings.trunkBorderColor || '#381C0F'}
              strokeWidth="4"
            />

            <text
              x="0"
              y={node.title && settings.showTitles ? 10 : 6}
              textAnchor="middle"
              fontWeight="900"
              fontSize={effectiveFontSize}
              fill={override.textColorOverride || settings.trunkTextColor || '#2A170C'}
              paintOrder="stroke fill"
              stroke={settings.nameStrokeColor || '#FFFFFF'}
              strokeWidth={settings.nameStrokeWidth ? Math.min(2, settings.nameStrokeWidth) : 1}
            >
              {node.name}
            </text>

            {isSelected && (
              <rect
                x={-plaqueW / 2 - 8}
                y={-plaqueH / 2 - 8}
                width={plaqueW + 16}
                height={plaqueH + 16}
                rx={(plaqueH + 16) / 2}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
            )}

            <rect
              x={-plaqueW / 2 - 15}
              y={-plaqueH / 2 - 15}
              width={plaqueW + 30}
              height={plaqueH + 30}
              fill="transparent"
              data-node-id={node.id}
              onPointerDown={e => handleNodePointerDown(node, e)}
            />
          </g>
        </g>
      );
    }

    // 2. TERMINAL LEAF
    if (isLeaf) {
      const parent = node.parentId !== null ? findNode(node.parentId) : null;
      const parentPos = parent ? getLivePos(parent) : null;
      const px = parentPos ? parentPos.x : cx;
      const py = parentPos ? parentPos.y : cy + 80;

      const angleRad = Math.atan2(cy - py, cx - px);
      const angleDeg = (angleRad * 180) / Math.PI;
      const leafAngle = angleDeg + 90;
      const isRightLeaning = cx >= px;
      const textRotation = isRightLeaning ? -90 : 90;

      const baseLeafW = 82;
      const baseLeafH = 135;
      const leafW = baseLeafW * nodeScale;
      const leafH = baseLeafH * nodeScale;

      const leafGrad = isFemale ? 'url(#leafRealisticFemale)' : 'url(#leafRealisticMale)';
      const leafStroke = isFemale ? '#880E4F' : '#1B5E20';
      const activeLeafStyle = override.leafStyle || settings.leafStyle || 'realistic';
      const leafPath = getBotanicalLeafPath(leafW, leafH, activeLeafStyle);

      return (
        <g key={`node-${node.id}`}>
          <g transform={`translate(${cx}, ${cy}) rotate(${leafAngle})`}>
            {showGlow && (
              <path
                d={leafPath}
                fill={glowColor}
                opacity={glowIntensity * 0.75}
                transform="scale(1.12)"
              />
            )}

            {/* Leaf Drop Shadow */}
            <path d={leafPath} fill="rgba(0,0,0,0.22)" transform="translate(3, 4)" />

            {/* Leaf Body */}
            <path d={leafPath} fill={override.colorOverride || leafGrad} stroke={leafStroke} strokeWidth="2.2" />

            {/* Midrib Spine */}
            <path
              d={`M 0 ${-leafH / 2 + 8} L 0 ${leafH / 2 - 4}`}
              fill="none"
              stroke={settings.leafVeinColor || '#74B72E'}
              strokeWidth="2"
              opacity="0.75"
            />

            {/* Gender Badge */}
            <circle
              cx="0"
              cy={leafH / 2 - 16}
              r="9"
              fill={isFemale ? '#AD1457' : '#1B5E20'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y={leafH / 2 - 13}
              textAnchor="middle"
              fontSize="10"
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {isFemale ? '♀' : '♂'}
            </text>

            {/* Longitudinal Name */}
            <g transform={`rotate(${textRotation})`}>
              <text
                x="0"
                y={node.title && settings.showTitles ? 6 : 4}
                textAnchor="middle"
                fontWeight="900"
                fontSize={effectiveFontSize}
                fill={override.textColorOverride || settings.nameTextColor || '#062811'}
                paintOrder="stroke fill"
                stroke={settings.nameStrokeColor || '#FFFFFF'}
                strokeWidth={settings.nameStrokeWidth || 1.5}
                strokeLinejoin="round"
              >
                {node.name}
              </text>
            </g>

            {isSelected && (
              <circle
                cx="0"
                cy="0"
                r={Math.max(leafW, leafH) * 0.55}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
            )}
          </g>

          <rect
            x={cx - leafW * 0.7}
            y={cy - leafH * 0.7}
            width={leafW * 1.4}
            height={leafH * 1.4}
            fill="transparent"
            data-node-id={node.id}
            className="cursor-pointer"
            onPointerDown={e => handleNodePointerDown(node, e)}
          />
        </g>
      );
    }

    // 3. BRANCH ANCESTOR BADGE
    const branchWidth = Math.max(80, node.name.length * effectiveFontSize * 0.55 + 32) * nodeScale;
    const branchHeight = (36 + (node.title ? 14 : 0)) * nodeScale;

    return (
      <g key={`node-${node.id}`} className="cursor-pointer">
        {showGlow && (
          <rect
            x={cx - branchWidth / 2 - 5}
            y={cy - branchHeight / 2 - 5}
            width={branchWidth + 10}
            height={branchHeight + 10}
            rx={(branchHeight + 10) / 2}
            fill={glowColor}
            opacity={glowIntensity * 0.7}
          />
        )}

        <rect
          x={cx - branchWidth / 2 + 3}
          y={cy - branchHeight / 2 + 4}
          width={branchWidth}
          height={branchHeight}
          rx={branchHeight / 2}
          fill="rgba(0,0,0,0.25)"
        />

        <rect
          x={cx - branchWidth / 2}
          y={cy - branchHeight / 2}
          width={branchWidth}
          height={branchHeight}
          rx={branchHeight / 2}
          fill={override.colorOverride || (settings.branchBadgeBgColor === 'wood' || !settings.branchBadgeBgColor ? 'url(#woodCartoucheGrad)' : settings.branchBadgeBgColor)}
          stroke={settings.branchBadgeBorderColor || '#3E2723'}
          strokeWidth="3"
        />

        <text
          x={cx}
          y={cy + (node.title && settings.showTitles ? 9 : 5)}
          textAnchor="middle"
          fontWeight="900"
          fontSize={effectiveFontSize}
          fill={override.textColorOverride || settings.branchTextColor || '#2A170C'}
          paintOrder="stroke fill"
          stroke={settings.branchTextStrokeColor || '#FFFFFF'}
          strokeWidth={settings.branchTextStrokeWidth ?? 1.0}
          strokeLinejoin="round"
        >
          {node.name}
        </text>

        {isSelected && (
          <rect
            x={cx - branchWidth / 2 - 6}
            y={cy - branchHeight / 2 - 6}
            width={branchWidth + 12}
            height={branchHeight + 12}
            rx={(branchHeight + 12) / 2}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeDasharray="6 3"
          />
        )}

        <rect
          x={cx - branchWidth / 2 - 12}
          y={cy - branchHeight / 2 - 12}
          width={branchWidth + 24}
          height={branchHeight + 24}
          fill="transparent"
          data-node-id={node.id}
          onPointerDown={e => handleNodePointerDown(node, e)}
        />
      </g>
    );
  };

  // Render Spouses
  const renderSpouses = () => {
    return spouses.map(spouse => {
      const partner = root ? findNode(spouse.spouseId || -1) : null;
      if (!partner) return null;
      if (!visibleNodeIds.has(partner.id)) return null;

      const partnerPos = getLivePos(partner);
      const spousePos = getLivePos(spouse);
      const cx = spousePos.x;
      const cy = spousePos.y;

      if (viewportBox && !isPointInViewport(cx, cy) && !isPointInViewport(partnerPos.x, partnerPos.y)) {
        return null;
      }

      const isSelected = selectedNode?.id === spouse.id;
      const override = nodeOverrides[spouse.id] || {};
      const isRightLeaning = cx >= partnerPos.x;
      const textRotation = isRightLeaning ? -90 : 90;

      const isHierarchical = settings.treeStructureType === 'hierarchical';

      if (isHierarchical) {
        const nameLen = spouse.name.length;
        const effectiveFontSize = Math.round(
          (override.fontSize || settings.leafFontSize) * settings.globalFontScale * 0.85
        );
        const nodeScale = override.scale || 1.0;
        
        const boxW = Math.max(145, nameLen * effectiveFontSize * 0.75 + 40) * nodeScale;
        const boxH = 52 * nodeScale;

        const bg = spouse.gender === 'female' ? '#FDF2F8' : '#F0F9FF';
        const stroke = spouse.gender === 'female' ? '#DB2777' : '#0369A1';
        const textColor = spouse.gender === 'female' ? '#831843' : '#0C4A6E';

        const lineY = partnerPos.y;
        const lineX1 = partnerPos.x;
        const lineX2 = cx;

        return (
          <g key={`spouse-group-${spouse.id}`}>
            {/* Horizontal link */}
            <line
              x1={lineX1}
              y1={lineY}
              x2={lineX2}
              y2={lineY}
              stroke="#4B5563"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            <g transform={`translate(${cx}, ${cy})`}>
              {/* Box shadow */}
              {renderHierarchicalCardContent(boxW, boxH, override.colorOverride || bg, stroke, true)}

              {/* Box */}
              {renderHierarchicalCardContent(boxW, boxH, override.colorOverride || bg, stroke, false)}

              {/* Name */}
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontWeight="bold"
                fontSize={effectiveFontSize}
                fill={override.textColorOverride || textColor}
              >
                {spouse.name}
              </text>

              {isSelected && (
                <rect
                  x={-boxW / 2 - 6}
                  y={-boxH / 2 - 6}
                  width={boxW + 12}
                  height={boxH + 12}
                  rx={12}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeDasharray="6 3"
                />
              )}

              {/* Click / Drag Target */}
              <rect
                x={-boxW / 2 - 10}
                y={-boxH / 2 - 10}
                width={boxW + 20}
                height={boxH + 20}
                fill="transparent"
                data-node-id={spouse.id}
                onPointerDown={e => handleNodePointerDown(spouse, e)}
              />
            </g>
          </g>
        );
      }

      const effectiveFontSize = Math.round(
        (override.fontSize || settings.leafFontSize) * settings.globalFontScale
      );

      const lw = 76;
      const lh = 120;
      const activeLeafStyle = override.leafStyle || settings.leafStyle || 'realistic';
      const leafPath = getBotanicalLeafPath(lw, lh, activeLeafStyle);

      const spouseBranchThick = Math.max(
        6,
        Math.min(14, getNodeThickness(partner) * 0.45)
      ) * (settings.branchThickness || 1.0);

      const pathData = `M ${partnerPos.x} ${partnerPos.y} Q ${(partnerPos.x + cx) / 2} ${cy - 30} ${cx} ${cy}`;

      return (
        <g key={`spouse-group-${spouse.id}`}>
          <path
            d={pathData}
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth={spouseBranchThick + 2}
            strokeLinecap="round"
            transform="translate(2, 3)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="url(#spouseBranchGradRealistic)"
            strokeWidth={spouseBranchThick}
            strokeLinecap="round"
          />
          <circle
            cx={partnerPos.x}
            cy={partnerPos.y}
            r={spouseBranchThick * 0.6}
            fill="url(#spouseBranchGradRealistic)"
            opacity="0.8"
          />

          <g transform={`translate(${cx}, ${cy})`}>
            {settings.showLeafGlow !== false && (
              <path
                d={leafPath}
                fill={settings.leafGlowColor || '#FEF08A'}
                opacity={(settings.leafGlowIntensity ?? 0.65) * 0.75}
                transform="scale(1.12)"
              />
            )}

            <path d={leafPath} fill="rgba(0,0,0,0.22)" transform="translate(3, 4)" />
            <path
              d={leafPath}
              fill={spouse.gender === 'female' ? 'url(#leafRealisticFemale)' : 'url(#leafRealisticMale)'}
              stroke={spouse.gender === 'female' ? '#880E4F' : '#1B5E20'}
              strokeWidth="2.2"
            />

            <circle cx="0" cy={lh / 2 - 16} r="9" fill={spouse.gender === 'female' ? '#AD1457' : '#1B5E20'} stroke="white" strokeWidth="1.5" />
            <text x="0" y={lh / 2 - 13} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              {spouse.gender === 'female' ? '♀' : '♂'}
            </text>

            <g transform={`rotate(${textRotation})`}>
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontWeight="900"
                fontSize={effectiveFontSize}
                fill={spouse.gender === 'female' ? '#880E4F' : '#062811'}
                paintOrder="stroke fill"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinejoin="round"
              >
                {spouse.name}
              </text>
            </g>

            {isSelected && (
              <circle
                cx="0"
                cy="0"
                r={55}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
            )}

            <rect
              x={-55}
              y={-55}
              width={110}
              height={110}
              fill="transparent"
              data-node-id={spouse.id}
              className="cursor-pointer"
              onPointerDown={e => handleNodePointerDown(spouse, e)}
            />
          </g>
        </g>
      );
    });
  };

  // Render All Nodes Recursively
  const renderAllNodes = (rootNode: TreeNode): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const traverse = (n: TreeNode) => {
      const nodeEl = renderNode(n);
      if (nodeEl) elements.push(nodeEl);
      if (!activeCollapsedIds.has(n.id)) {
        n.children.forEach(traverse);
      }
    };
    traverse(rootNode);
    return elements;
  };

  // Render Quranic Verse Banner
  const renderQuranicVerseBanner = () => {
    if (!settings.showQuranicVerse || !layout || settings.layoutStyle === 'circular') return null;
    const verseText =
      settings.quranicVerseText ||
      'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا';
    const cx = layout.centerX;
    const bannerY = (layout.viewBoxY || 0) + 120;
    const bannerW = Math.min(layout.W * 0.85, Math.max(500, verseText.length * 14 + 130));
    const bannerH = 70;

    return (
      <g key="quranic-verse-header" className="pointer-events-none">
        <rect
          x={cx - bannerW / 2 + 3}
          y={bannerY - bannerH / 2 + 4}
          width={bannerW}
          height={bannerH}
          rx={16}
          fill="rgba(0,0,0,0.25)"
        />
        <rect
          x={cx - bannerW / 2}
          y={bannerY - bannerH / 2}
          width={bannerW}
          height={bannerH}
          rx={16}
          fill="url(#heritageCartoucheGrad)"
          stroke="#78350F"
          strokeWidth="3"
        />
        <text
          x={cx}
          y={bannerY - 12}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#78350F"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </text>
        <text
          x={cx}
          y={bannerY + 16}
          textAnchor="middle"
          fontSize="15"
          fontWeight="900"
          fill="#1C0E07"
        >
          {verseText}
        </text>
      </g>
    );
  };

  // High-performance Memoized Layer Elements
  const branchesContent = useMemo(() => {
    if (!root) return null;
    return renderAllBranches(root);
  }, [
    root,
    spouses,
    nodeOverrides,
    activeCollapsedIds,
    settings,
    dragLiveOffset,
    viewportBox,
  ]);

  const spousesContent = useMemo(() => {
    return renderSpouses();
  }, [
    spouses,
    root,
    nodeMap,
    visibleNodeIds,
    nodeOverrides,
    settings,
    dragLiveOffset,
    viewportBox,
    selectedNode?.id,
  ]);

  const nodesContent = useMemo(() => {
    if (!root) return null;
    return renderAllNodes(root);
  }, [
    root,
    spouses,
    nodeOverrides,
    activeCollapsedIds,
    settings,
    selectedNode?.id,
    dragLiveOffset,
    viewportBox,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${
        draggingNodeId !== null ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        background: `linear-gradient(180deg, ${bgPreset.colors[0]} 0%, ${bgPreset.colors[1]} 40%, ${bgPreset.colors[2]} 75%, ${bgPreset.colors[3]} 100%)`,
        fontFamily: settings.fontFamily,
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={canvasDivRef}
        className="absolute top-0 left-0 will-change-transform origin-top-left"
        style={{
          transform: `translate3d(${activeTransform.x}px, ${activeTransform.y}px, 0) scale(${activeTransform.scale})`,
          contain: 'layout style paint',
        }}
      >
        {layout && (
          <svg
            id="family-tree-svg"
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={layout.viewBox}
            width={layout.W}
            height={layout.H}
            className="overflow-visible block"
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="trunkWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                {((colorSchemes.trunk as Record<string, any>)[settings.trunkColor] || colorSchemes.trunk.realisticOak).colors.map((c: string, idx: number, arr: string[]) => (
                  <stop
                    key={idx}
                    offset={`${Math.round((idx / (arr.length - 1)) * 100)}%`}
                    stopColor={c}
                  />
                ))}
              </linearGradient>

              <linearGradient id="branchGradRealistic" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#25120A" />
                <stop offset="35%" stopColor="#5C3317" />
                <stop offset="70%" stopColor="#8A522A" />
                <stop offset="100%" stopColor="#25120A" />
              </linearGradient>

              <linearGradient id="spouseBranchGradRealistic" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4D0F21" />
                <stop offset="50%" stopColor="#D84A76" />
                <stop offset="100%" stopColor="#4D0F21" />
              </linearGradient>

              <linearGradient id="woodCartoucheGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF7" />
                <stop offset="40%" stopColor="#FFF8E7" />
                <stop offset="100%" stopColor="#E2C99D" />
              </linearGradient>

              <radialGradient id="leafRealisticMale" cx="35%" cy="25%" r="75%">
                <stop offset="0%" stopColor={((colorSchemes.male as Record<string, any>)[settings.maleColor] || colorSchemes.male.realisticGreen).colors[0]} />
                <stop offset="40%" stopColor={((colorSchemes.male as Record<string, any>)[settings.maleColor] || colorSchemes.male.realisticGreen).colors[1]} />
                <stop offset="85%" stopColor={((colorSchemes.male as Record<string, any>)[settings.maleColor] || colorSchemes.male.realisticGreen).colors[2]} />
                <stop offset="100%" stopColor={((colorSchemes.male as Record<string, any>)[settings.maleColor] || colorSchemes.male.realisticGreen).colors[3]} />
              </radialGradient>

              <radialGradient id="leafRealisticFemale" cx="35%" cy="25%" r="75%">
                <stop offset="0%" stopColor={((colorSchemes.female as Record<string, any>)[settings.femaleColor] || colorSchemes.female.pink).colors[0]} />
                <stop offset="40%" stopColor={((colorSchemes.female as Record<string, any>)[settings.femaleColor] || colorSchemes.female.pink).colors[1]} />
                <stop offset="85%" stopColor={((colorSchemes.female as Record<string, any>)[settings.femaleColor] || colorSchemes.female.pink).colors[2]} />
                <stop offset="100%" stopColor={((colorSchemes.female as Record<string, any>)[settings.femaleColor] || colorSchemes.female.pink).colors[3]} />
              </radialGradient>

              <linearGradient id="heritageCartoucheGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FEFDF8" />
                <stop offset="100%" stopColor="#EDE0C1" />
              </linearGradient>

              <linearGradient id="trunkLineageCartoucheGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#FFFDF0" />
                <stop offset="100%" stopColor="#FDE68A" />
              </linearGradient>

              {/* Rich Root Gradients */}
              <linearGradient id="rootSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#381C0F" />
                <stop offset="45%" stopColor="#25120A" />
                <stop offset="100%" stopColor="#140A05" />
              </linearGradient>

              <linearGradient id="rootGoldTrimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="30%" stopColor="#FDE68A" />
                <stop offset="70%" stopColor="#FFFBEB" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>

              <linearGradient id="rootMossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="35%" stopColor="#059669" />
                <stop offset="75%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>

              <linearGradient id="rootStoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#F8FAFC" />
                <stop offset="70%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              <linearGradient id="palmFiberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3F1D0B" />
                <stop offset="25%" stopColor="#78350F" />
                <stop offset="50%" stopColor="#9A3412" />
                <stop offset="75%" stopColor="#78350F" />
                <stop offset="100%" stopColor="#3F1D0B" />
              </linearGradient>
            </defs>

            {/* Banner */}
            {renderQuranicVerseBanner()}

            {/* Branches */}
            <g className="branches-layer">{branchesContent}</g>

            {/* Spouses */}
            <g className="spouses-layer">{spousesContent}</g>

            {/* Nodes */}
            <g className="nodes-layer">{nodesContent}</g>

            {/* Reparenting Live Guide & Drop Target Aura */}
            {hoverTargetId !== null && pendingNodeRef.current && (
              <g className="reparent-live-overlay pointer-events-none">
                {(() => {
                  const targetNode = nodeMap.get(hoverTargetId);
                  if (!targetNode) return null;
                  const tPos = getLivePos(targetNode);
                  const draggedPos = getLivePos(pendingNodeRef.current);
                  const midX = (tPos.x + draggedPos.x) / 2;
                  const midY = (tPos.y + draggedPos.y) / 2 - 40;

                  return (
                    <g key="reparent-target-guide">
                      {/* Arched connecting guide line */}
                      <path
                        d={`M ${tPos.x} ${tPos.y} Q ${midX} ${midY} ${draggedPos.x} ${draggedPos.y}`}
                        stroke="#10B981"
                        strokeWidth="3.5"
                        strokeDasharray="8 4"
                        fill="none"
                      />
                      {/* Target Parent Drop Zone Pulsing Aura */}
                      <circle
                        cx={tPos.x}
                        cy={tPos.y}
                        r={58}
                        fill="rgba(16, 185, 129, 0.22)"
                        stroke="#10B981"
                        strokeWidth="3.5"
                        strokeDasharray="6 3"
                      />
                      {/* Floating Badge above Target Parent */}
                      <g transform={`translate(${tPos.x}, ${tPos.y - 48})`}>
                        <rect
                          x="-105"
                          y="-14"
                          width="210"
                          height="28"
                          rx="14"
                          fill="#064E3B"
                          stroke="#34D399"
                          strokeWidth="1.8"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="900"
                          fill="#ECFDF5"
                        >
                          🌟 إفلات للتعيين كأب لـ {pendingNodeRef.current.name}
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Floating Canvas Controls - Horizontal at the bottom with transparent background */}
      <div className="absolute left-3 sm:left-5 bottom-4 sm:bottom-5 flex flex-row items-center gap-1 sm:gap-1.5 z-30 pointer-events-auto p-1 sm:p-1.5 bg-black/25 hover:bg-black/35 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl transition-all">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            title="تراجع عن الخطوة السابقة"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => zoomAtCenter(1.25)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all active:scale-95"
          title="تكبير"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomAtCenter(0.8)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all active:scale-95"
          title="تصغير"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-amber-300 hover:text-amber-200 hover:bg-white/15 transition-all active:scale-95"
          title="توسيط وعرض الشجرة بالكامل"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
