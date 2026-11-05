import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import {
  TreeNode,
  TreeSettings,
  TreeSnapshot,
  NodeOverride,
  Gender,
} from './types/tree';
import { StorageService, countTreeMembers, countGenerations } from './services/storage';
import { defaultSettings, bgPresets } from './constants/themes';
import { arrangeChildrenProfessionally } from './utils/professionalLayout';

import { FamilyTreeCanvas } from './components/FamilyTreeCanvas';
import { Header } from './components/Header';
import { SelectedNodeBar } from './components/SelectedNodeBar';
import { PersonModal } from './components/PersonModal';
import { SettingsModal } from './components/SettingsModal';
import { SnapshotsModal } from './components/SnapshotsModal';
import { TreesManagerModal } from './components/TreesManagerModal';
import { SearchModal } from './components/SearchModal';
import { MainMenuModal } from './components/MainMenuModal';
import { NewFamilyModal } from './components/NewFamilyModal';
import { DetailsModal } from './components/DetailsModal';
import { ReparentModal } from './components/ReparentModal';
import { ActionSheet } from './components/ActionSheet';
import { AboutModal } from './components/AboutModal';
import { Toast } from './components/Toast';
import { ConfirmModal, ConfirmDialogState } from './components/ConfirmModal';
import { ExportPdfModal, ExportPdfOptions } from './components/ExportPdfModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Tree & App State
  const [activeTreeId, setActiveTreeId] = useState<string>(StorageService.getActiveTreeId());
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [spouses, setSpouses] = useState<TreeNode[]>([]);
  const [counter, setCounter] = useState<number>(100);
  const [nodeOverrides, setNodeOverrides] = useState<Record<string, NodeOverride>>({});
  const [settings, setSettings] = useState<TreeSettings>(defaultSettings);

  // Selection & UI State
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<number>>(new Set());

  // Undo/Redo History Stack
  const [history, setHistory] = useState<Array<{
    root: TreeNode;
    counter: number;
    spouses: TreeNode[];
    nodeOverrides: Record<string, NodeOverride>;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [treesList, setTreesList] = useState(StorageService.getTreesList());
  const [snapshots, setSnapshots] = useState<TreeSnapshot[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(Date.now());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Modals state
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personModalConfig, setPersonModalConfig] = useState<{
    title: string;
    targetNode?: TreeNode | null;
    actionType: 'edit' | 'addChild' | 'addSibling' | 'addSpouse' | 'addParent';
  }>({ title: '', actionType: 'addChild' });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
  const [isTreesManagerOpen, setIsTreesManagerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isNewFamilyOpen, setIsNewFamilyOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsNode, setDetailsNode] = useState<TreeNode | null>(null);
  const [isReparentModalOpen, setIsReparentModalOpen] = useState(false);
  const [reparentModalNode, setReparentModalNode] = useState<TreeNode | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [actionSheetNode, setActionSheetNode] = useState<TreeNode | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  };

  // Load Tree Data on Active Tree ID change
  const loadActiveTree = useCallback((treeId: string) => {
    const data = StorageService.loadTree(treeId);
    setRoot(data.root);
    setCounter(data.counter);
    setSpouses(data.spouses);
    setNodeOverrides(data.nodeOverrides);
    setSettings(data.settings);
    setSelectedNode(null);
    setCollapsedNodeIds(new Set());
    setSnapshots(StorageService.getSnapshots(treeId));
    setLastSavedTime(Date.now());

    // Initialize undo history with loaded tree data
    if (data.root) {
      const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
      setHistory([{
        root: clone(data.root),
        counter: data.counter,
        spouses: clone(data.spouses),
        nodeOverrides: clone(data.nodeOverrides),
      }]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, []);

  const handleToggleCollapseNode = useCallback((nodeId: number) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    loadActiveTree(activeTreeId);
  }, [activeTreeId, loadActiveTree]);

  // Enhanced Auto-Save on any modification
  const scheduleSave = useCallback(
    (
      currentRoot: TreeNode | null,
      currentCounter: number,
      currentSpouses: TreeNode[],
      currentOverrides: Record<string, NodeOverride>,
      currentSettings: TreeSettings,
      createSnapshot = false,
      isFromUndo = false,
      skipHistory = false
    ) => {
      if (!currentRoot) return;
      setIsSaving(true);

      if (!isFromUndo && !skipHistory) {
        setHistory(prev => {
          const nextHistory = prev.slice(0, historyIndex + 1);
          const rootClone = typeof structuredClone === 'function' ? structuredClone(currentRoot) : JSON.parse(JSON.stringify(currentRoot));
          const spousesClone = typeof structuredClone === 'function' ? structuredClone(currentSpouses) : JSON.parse(JSON.stringify(currentSpouses));
          const overridesClone = typeof structuredClone === 'function' ? structuredClone(currentOverrides) : JSON.parse(JSON.stringify(currentOverrides));
          nextHistory.push({
            root: rootClone,
            counter: currentCounter,
            spouses: spousesClone,
            nodeOverrides: overridesClone,
          });
          if (nextHistory.length > 20) {
            nextHistory.shift();
          }
          return nextHistory;
        });
        setHistoryIndex(prev => Math.min(19, prev + 1));
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const result = StorageService.saveTree(
          activeTreeId,
          currentRoot,
          currentCounter,
          currentSpouses,
          currentOverrides,
          currentSettings,
          createSnapshot
        );
        setIsSaving(false);
        if (result.success) {
          setLastSavedTime(result.timestamp);
          setTreesList(StorageService.getTreesList());
          if (createSnapshot) {
            setSnapshots(StorageService.getSnapshots(activeTreeId));
          }
        }
      }, 500);
    },
    [activeTreeId, historyIndex]
  );

  // Undo Function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

      const restoredRoot = clone(state.root);
      const restoredCounter = state.counter;
      const restoredSpouses = clone(state.spouses);
      const restoredOverrides = clone(state.nodeOverrides);

      setRoot(restoredRoot);
      setCounter(restoredCounter);
      setSpouses(restoredSpouses);
      setNodeOverrides(restoredOverrides);
      setSelectedNode(null);
      setHistoryIndex(prevIndex);

      scheduleSave(
        restoredRoot,
        restoredCounter,
        restoredSpouses,
        restoredOverrides,
        settings,
        false,
        true // isFromUndo = true to skip adding to history again
      );

      showToast('↩️ تم التراجع عن الخطوة السابقة بنجاح');
    }
  }, [history, historyIndex, settings, scheduleSave]);

  // Find all wives of the parent node to associate children to mothers
  const getParentSpouses = (): TreeNode[] => {
    const { actionType, targetNode } = personModalConfig;
    if (!targetNode) return [];

    if (actionType === 'addChild') {
      const parentId = targetNode.spouseId !== null ? targetNode.spouseId : targetNode.id;
      return spouses.filter(s => s.spouseId === parentId);
    }

    if (actionType === 'addSibling' || actionType === 'edit') {
      if (targetNode.parentId === null) return [];
      const parentNode = findNodeInTree(targetNode.parentId);
      if (!parentNode) return [];
      const parentId = parentNode.spouseId !== null ? parentNode.spouseId : parentNode.id;
      return spouses.filter(s => s.spouseId === parentId);
    }

    return [];
  };

  // Node lookup
  const findNodeInTree = useCallback(
    (id: number, current: TreeNode | null = root): TreeNode | null => {
      if (!current) return null;
      if (current.id === id) return current;
      for (const child of current.children) {
        const found = findNodeInTree(id, child);
        if (found) return found;
      }
      return spouses.find(s => s.id === id) || null;
    },
    [root, spouses]
  );

  // Switch Active Tree
  const handleSwitchTree = (treeId: string) => {
    StorageService.setActiveTreeId(treeId);
    setActiveTreeId(treeId);
    showToast('✅ تم فتح شجرة العائلة بنجاح');
  };

  // Create New Tree
  const handleCreateNewTree = (treeName: string) => {
    const newTree = StorageService.createNewTree(treeName);
    setTreesList(StorageService.getTreesList());
    setActiveTreeId(newTree.id);
    showToast(`🌳 تم إنشاء شجرة "${treeName}"`);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Delete Tree
  const handleDeleteTree = (treeId: string) => {
    const nextTreeId = StorageService.deleteTree(treeId);
    setTreesList(StorageService.getTreesList());
    if (nextTreeId) {
      setActiveTreeId(nextTreeId);
    }
    showToast('🗑️ تم حذف الشجرة');
  };

  // Node Updates (CRUD)
  const handleSelectNode = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const handleNodeLongPress = (node: TreeNode) => {
    setSelectedNode(node);
    setActionSheetNode(node);
    setIsActionSheetOpen(true);
  };

  // Quick Font Size Adjustment for Single Individual
  const handleUpdateNodeFontSize = (nodeId: number, newFontSize: number) => {
    const updatedOverrides = {
      ...nodeOverrides,
      [nodeId]: {
        ...(nodeOverrides[nodeId] || {}),
        fontSize: newFontSize,
      },
    };
    setNodeOverrides(updatedOverrides);
    scheduleSave(root, counter, spouses, updatedOverrides, settings, false, false, true);
    showToast(`🔤 تم ضبط حجم الاسم إلى ${newFontSize}px`);
  };

  // Quick Scale Adjustment for Single Individual
  const handleUpdateNodeScale = (nodeId: number, newScale: number) => {
    const updatedOverrides = {
      ...nodeOverrides,
      [nodeId]: {
        ...(nodeOverrides[nodeId] || {}),
        scale: newScale,
      },
    };
    setNodeOverrides(updatedOverrides);
    scheduleSave(root, counter, spouses, updatedOverrides, settings, false, false, true);
  };

  // Move Subtree in Drag Mode
  const handleMoveNodeSubtree = (nodeId: number, dx: number, dy: number) => {
    const node = findNodeInTree(nodeId);
    if (!node) return;

    const currentLayout = settings.layoutStyle || 'botanical';
    const newOverrides = { ...nodeOverrides };

    const moveSingleNode = (n: TreeNode) => {
      const currentOv = newOverrides[n.id] || {};
      const basePos = currentOv.layoutPositions?.[currentLayout] || {
        x: currentOv.x !== undefined ? currentOv.x : n.x,
        y: currentOv.y !== undefined ? currentOv.y : n.y,
      };
      const newX = basePos.x + dx;
      const newY = basePos.y + dy;

      const updatedLayoutPositions = {
        ...(currentOv.layoutPositions || {}),
        [currentLayout]: { x: newX, y: newY },
      };

      if (currentLayout === 'botanical') {
        updatedLayoutPositions.botanical = { x: newX, y: newY };
      }

      newOverrides[n.id] = {
        ...currentOv,
        x: newX,
        y: newY,
        autoLayout: false,
        layoutPositions: updatedLayoutPositions,
      };

      if (n.spouseId) {
        const sp = spouses.find(s => s.id === n.spouseId);
        if (sp) {
          const spOv = newOverrides[sp.id] || {};
          const spBasePos = spOv.layoutPositions?.[currentLayout] || {
            x: spOv.x !== undefined ? spOv.x : sp.x,
            y: spOv.y !== undefined ? spOv.y : sp.y,
          };
          const spNewX = spBasePos.x + dx;
          const spNewY = spBasePos.y + dy;
          const spUpdatedLayoutPositions = {
            ...(spOv.layoutPositions || {}),
            [currentLayout]: { x: spNewX, y: spNewY },
          };
          if (currentLayout === 'botanical') {
            spUpdatedLayoutPositions.botanical = { x: spNewX, y: spNewY };
          }
          newOverrides[sp.id] = {
            ...spOv,
            x: spNewX,
            y: spNewY,
            autoLayout: false,
            layoutPositions: spUpdatedLayoutPositions,
          };
        }
      }
    };

    if (settings.moveMode === 'subtree') {
      const moveRecursive = (n: TreeNode) => {
        moveSingleNode(n);
        n.children.forEach(moveRecursive);
      };
      moveRecursive(node);
      showToast(`📍 تم حفظ موقع فرع "${node.name}" وأبنائه`);
    } else {
      // Default: Move ONLY the selected individual person!
      moveSingleNode(node);
      showToast(`📍 تم تعديل موقع "${node.name}" بنجاح`);
    }

    setNodeOverrides(newOverrides);
    scheduleSave(root, counter, spouses, newOverrides, settings);
  };

  // Open Reparent / Move Parent Modal
  const handleOpenReparentModal = (node: TreeNode) => {
    if (!root || node.id === root.id || node.level === 0) {
      showToast('⚠️ لا يمكن نقل الجذع المؤسس للشجرة', 'error');
      return;
    }
    setReparentModalNode(node);
    setIsReparentModalOpen(true);
  };

  // Reparent Node (Drop onto another parent or select via modal)
  const handleReparentNode = (childId: number, newParentId: number) => {
    if (!root || childId === root.id) {
      showToast('⚠️ لا يمكن نقل الجذع المؤسس', 'error');
      return;
    }

    const currentChild = findNodeInTree(childId);
    const currentNewParent = findNodeInTree(newParentId);
    if (!currentChild || !currentNewParent) {
      showToast('⚠️ لم يتم العثور على الشخص أو الأب المختار', 'error');
      return;
    }

    if (currentChild.parentId === newParentId) {
      showToast('ℹ️ هذا الشخص مرتبط بالفعل بهذا الأب');
      return;
    }

    // Check if newParent is a descendant of childNode (prevent circular reference)
    const isDescendant = (parent: TreeNode, targetId: number): boolean => {
      if (parent.id === targetId) return true;
      return parent.children.some(c => isDescendant(c, targetId));
    };
    if (isDescendant(currentChild, newParentId)) {
      showToast('⚠️ لا يمكن نقل الشخص ليصبح ابناً لأحد أولاده أو أحفاده', 'error');
      return;
    }

    // Deep clone root to safely mutate
    const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode;

    // Detach child from old parent
    let extractedNode: TreeNode | null = null;
    const removeFromParent = (current: TreeNode): boolean => {
      const idx = current.children.findIndex(c => c.id === childId);
      if (idx >= 0) {
        extractedNode = current.children.splice(idx, 1)[0];
        return true;
      }
      return current.children.some(removeFromParent);
    };

    removeFromParent(newRoot);

    if (!extractedNode) {
      showToast('⚠️ تعذر العثور على فرع الشخص لنقله', 'error');
      return;
    }

    const targetInNewRoot = findNodeInTree(newParentId, newRoot);
    if (!targetInNewRoot) {
      showToast('⚠️ تعذر العثور على الأب الجديد في الهيكل', 'error');
      return;
    }

    // Assign new parent
    (extractedNode as TreeNode).parentId = newParentId;
    (extractedNode as TreeNode).spouseParentId = null;

    // Recalculate generation level recursively
    const updateLevels = (n: TreeNode, parentLevel: number) => {
      n.level = parentLevel + 1;
      n.children.forEach(c => updateLevels(c, n.level));
    };
    updateLevels(extractedNode as TreeNode, targetInNewRoot.level);

    targetInNewRoot.children.push(extractedNode);

    // Reset override coordinates for child and all its descendants so they layout cleanly under new parent
    const newOverrides = { ...nodeOverrides };
    const clearLayoutOverrides = (node: TreeNode) => {
      if (newOverrides[node.id]) {
        delete newOverrides[node.id].x;
        delete newOverrides[node.id].y;
        delete newOverrides[node.id].layoutPositions;
        newOverrides[node.id].autoLayout = true;
      }
      node.children.forEach(clearLayoutOverrides);
    };
    clearLayoutOverrides(extractedNode);

    setRoot(newRoot);
    setNodeOverrides(newOverrides);
    setSelectedNode(extractedNode);
    scheduleSave(newRoot, counter, spouses, newOverrides, settings, true);
    showToast(`✅ تم نقل "${(extractedNode as TreeNode).name}" بنجاح ليصبح ابناً لـ "${targetInNewRoot.name}"`);
  };

  // Automatically arrange all children of a parent around the father with professional obstacle avoidance
  const handleAutoArrangeChildren = (parentNode: TreeNode) => {
    if (!root || parentNode.children.length === 0) return;

    const updatedRoot = JSON.parse(JSON.stringify(root)) as TreeNode;
    const findNodePure = (targetId: number, current: TreeNode | null): TreeNode | null => {
      if (!current) return null;
      if (current.id === targetId) return current;
      for (const child of current.children) {
        const found = findNodePure(targetId, child);
        if (found) return found;
      }
      return null;
    };

    const target = findNodePure(parentNode.id, updatedRoot);
    if (!target || target.children.length === 0) return;

    const { childPositions, updatedOverrides } = arrangeChildrenProfessionally(
      target,
      updatedRoot,
      settings,
      nodeOverrides
    );

    target.children.forEach(child => {
      const pos = childPositions.get(child.id);
      if (pos) {
        child.x = pos.x;
        child.y = pos.y;
      }
      child.level = (target.level || 0) + 1;
    });

    setRoot(updatedRoot);
    setNodeOverrides(updatedOverrides);
    setSelectedNode({ ...target });
    scheduleSave(updatedRoot, counter, spouses, updatedOverrides, settings, true);
    showToast(`✨ تم ترتيب أبناء "${target.name}" باحترافية وتناسق تام دون تداخل`);
  };

  // Open Add Person Modals
  const handleOpenAddChild = (parent: TreeNode) => {
    setSelectedNode(parent);
    setPersonModalConfig({
      title: `إضافة ابن / ابنة لـ "${parent.name}"`,
      targetNode: parent,
      actionType: 'addChild',
    });
    setIsPersonModalOpen(true);
  };

  const handleOpenAddSibling = (sibling: TreeNode) => {
    setPersonModalConfig({
      title: `إضافة أخ / أخت لـ "${sibling.name}"`,
      targetNode: sibling,
      actionType: 'addSibling',
    });
    setIsPersonModalOpen(true);
  };

  const handleOpenAddSpouse = (node: TreeNode) => {
    setPersonModalConfig({
      title: `إضافة زوج / زوجة لـ "${node.name}"`,
      targetNode: node,
      actionType: 'addSpouse',
    });
    setIsPersonModalOpen(true);
  };

  const handleOpenAddParent = (node: TreeNode) => {
    setPersonModalConfig({
      title: `إضافة والد / والدة لـ "${node.name}"`,
      targetNode: node,
      actionType: 'addParent',
    });
    setIsPersonModalOpen(true);
  };

  const handleOpenEdit = (node: TreeNode) => {
    setPersonModalConfig({
      title: `تعديل بيانات: "${node.name}"`,
      targetNode: node,
      actionType: 'edit',
    });
    setIsPersonModalOpen(true);
  };

  // Save Person (Add or Edit)
  const handleSavePerson = (
    data: {
      name: string;
      title?: string;
      gender: Gender;
      birthDate?: string;
      deathDate?: string;
      notes?: string;
      phone?: string;
      location?: string;
    },
    override?: NodeOverride
  ) => {
    if (!root) return;
    const { actionType, targetNode } = personModalConfig;

    // Collect all existing IDs to guarantee absolute uniqueness
    const allIds: number[] = [root.id];
    const collectIds = (n: TreeNode) => {
      allIds.push(n.id);
      n.children.forEach(collectIds);
    };
    collectIds(root);
    spouses.forEach(s => allIds.push(s.id));
    const nextCounter = Math.max(counter, ...allIds, 100) + 1;

    let updatedRoot = JSON.parse(JSON.stringify(root)) as TreeNode;
    let updatedSpouses = [...spouses];
    let updatedOverrides = { ...nodeOverrides };

    // Pure recursive finder
    const findNodePure = (targetId: number, current: TreeNode | null): TreeNode | null => {
      if (!current) return null;
      if (current.id === targetId) return current;
      for (const child of current.children) {
        const found = findNodePure(targetId, child);
        if (found) return found;
      }
      return null;
    };

    if (actionType === 'edit' && targetNode) {
      const nodeInTree = findNodePure(targetNode.id, updatedRoot);
      if (nodeInTree) {
        Object.assign(nodeInTree, data);
      } else {
        const spIdx = updatedSpouses.findIndex(s => s.id === targetNode.id);
        if (spIdx >= 0) {
          updatedSpouses[spIdx] = { ...updatedSpouses[spIdx], ...data };
        }
      }

      if (override) {
        updatedOverrides[targetNode.id] = override;
      }
      if (selectedNode && selectedNode.id === targetNode.id) {
        setSelectedNode({ ...selectedNode, ...data });
      }
      showToast(`✅ تم تحديث بيانات "${data.name}"`);
    } else if (actionType === 'addChild' && targetNode) {
      // If target is spouse, add to partner in root
      let parentIdToUse = targetNode.id;
      let parentInRoot = findNodePure(parentIdToUse, updatedRoot);
      if (!parentInRoot && targetNode.spouseId !== null) {
        parentIdToUse = targetNode.spouseId;
        parentInRoot = findNodePure(parentIdToUse, updatedRoot);
      }

      const layoutStyle = settings.layoutStyle || 'botanical';
      const parentOv = parentInRoot ? updatedOverrides[parentInRoot.id] : undefined;
      const parentPos = parentOv?.layoutPositions?.[layoutStyle] || (parentOv?.x !== undefined ? { x: parentOv.x, y: parentOv.y } : { x: parentInRoot?.x || 0, y: parentInRoot?.y || 0 });
      const pX = parentPos.x ?? (parentInRoot?.x || 0);
      const pY = parentPos.y ?? (parentInRoot?.y || 0);

      const newNode: TreeNode = {
        id: nextCounter,
        ...data,
        parentId: parentIdToUse,
        spouseId: null,
        children: [],
        x: pX,
        y: pY,
        level: (parentInRoot?.level || 0) + 1,
        leafCount: 1,
      };

      if (parentInRoot) {
        parentInRoot.children.push(newNode);

        if (override) {
          updatedOverrides[newNode.id] = { ...override };
        }

        // Professional collision-free auto-arrangement around the father
        const { childPositions, updatedOverrides: arrangedOverrides } = arrangeChildrenProfessionally(
          parentInRoot,
          updatedRoot,
          settings,
          updatedOverrides
        );

        parentInRoot.children.forEach(child => {
          const pos = childPositions.get(child.id);
          if (pos) {
            child.x = pos.x;
            child.y = pos.y;
          }
          child.level = (parentInRoot.level || 0) + 1;
        });

        Object.assign(updatedOverrides, arrangedOverrides);
      } else {
        // Fallback to root
        updatedRoot.children.push(newNode);
      }

      // إبقاء التحديد على الأب عند إضافة ولد جديد مع تحديث قائمة أبنائه فوراً
      const fatherNode = parentInRoot || (targetNode.id === updatedRoot.id ? updatedRoot : findNodePure(targetNode.id, updatedRoot)) || targetNode;
      setSelectedNode({ ...fatherNode });
      showToast(`🌱 تم إضافة "${data.name}" وترتيب الأبناء باحترافية وتناسق تام`);
    } else if (actionType === 'addSibling' && targetNode && targetNode.parentId !== null) {
      const parentInRoot = findNodePure(targetNode.parentId, updatedRoot);
      const layoutStyle = settings.layoutStyle || 'botanical';
      const parentOv = parentInRoot ? updatedOverrides[parentInRoot.id] : undefined;
      const parentPos = parentOv?.layoutPositions?.[layoutStyle] || (parentOv?.x !== undefined ? { x: parentOv.x, y: parentOv.y } : { x: parentInRoot?.x || targetNode.x, y: parentInRoot?.y || targetNode.y });
      const pX = parentPos.x ?? (parentInRoot?.x || targetNode.x);
      const pY = parentPos.y ?? (parentInRoot?.y || targetNode.y);

      const newNode: TreeNode = {
        id: nextCounter,
        ...data,
        parentId: targetNode.parentId,
        spouseId: null,
        children: [],
        x: targetNode.x + 160,
        y: targetNode.y,
        level: targetNode.level,
        leafCount: 1,
      };

      if (parentInRoot) {
        parentInRoot.children.push(newNode);

        if (override) {
          updatedOverrides[newNode.id] = { ...override };
        }

        // Professional collision-free auto-arrangement around the parent
        const { childPositions, updatedOverrides: arrangedOverrides } = arrangeChildrenProfessionally(
          parentInRoot,
          updatedRoot,
          settings,
          updatedOverrides
        );

        parentInRoot.children.forEach(child => {
          const pos = childPositions.get(child.id);
          if (pos) {
            child.x = pos.x;
            child.y = pos.y;
          }
          child.level = parentInRoot.level + 1;
        });

        Object.assign(updatedOverrides, arrangedOverrides);
      }
      setSelectedNode(newNode);
      showToast(`👥 تم إضافة "${data.name}" كأخ/أخت وترتيب الأبناء باحترافية`);
    } else if (actionType === 'addSpouse' && targetNode) {
      const newSpouse: TreeNode = {
        id: nextCounter,
        ...data,
        parentId: null,
        spouseId: targetNode.id,
        children: [],
        x: targetNode.x + 180,
        y: targetNode.y,
        level: targetNode.level,
        leafCount: 1,
      };

      const partnerInRoot = findNodePure(targetNode.id, updatedRoot);
      if (partnerInRoot) {
        partnerInRoot.spouseId = newSpouse.id;
      }
      updatedSpouses.push(newSpouse);
      if (override) {
        updatedOverrides[newSpouse.id] = override;
      }
      setSelectedNode(newSpouse);
      showToast(`💍 تم إضافة "${data.name}" كزوج/ة`);
    } else if (actionType === 'addParent' && targetNode) {
      const newParentNode: TreeNode = {
        id: nextCounter,
        ...data,
        parentId: null,
        spouseId: null,
        children: [updatedRoot],
        x: 0,
        y: 0,
        level: 0,
        leafCount: 1,
      };

      updatedRoot.parentId = newParentNode.id;
      updatedRoot = newParentNode;
      if (override) {
        updatedOverrides[newParentNode.id] = override;
      }
      setSelectedNode(newParentNode);
      showToast(`🌳 تم إضافة "${data.name}" كجد أعلى للشجرة`);
    }

    setCounter(nextCounter);
    setRoot(updatedRoot);
    setSpouses(updatedSpouses);
    setNodeOverrides(updatedOverrides);
    scheduleSave(updatedRoot, nextCounter, updatedSpouses, updatedOverrides, settings, true);
    setIsPersonModalOpen(false);
  };

  // Delete Node
  const handleDeleteNode = (node: TreeNode) => {
    if (!root) return;

    // Check if node is a spouse
    const isSpouseNode = spouses.some(s => s.id === node.id);
    if (isSpouseNode) {
      setConfirmDialog({
        isOpen: true,
        title: 'حذف من الشجرة',
        message: `هل أنت متأكد من حذف الزوج/ة "${node.name}"؟`,
        confirmText: 'نعم، حذف',
        type: 'danger',
        onConfirm: () => {
          const filteredSpouses = spouses.filter(s => s.id !== node.id);
          const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode;
          const partner = findNodeInTree(node.spouseId || -1, newRoot);
          if (partner) {
            partner.spouseId = null;
          }
          setSelectedNode(null);
          setSpouses(filteredSpouses);
          scheduleSave(newRoot, counter, filteredSpouses, nodeOverrides, settings, true);
          showToast(`🗑️ تم حذف "${node.name}"`);
        },
      });
      return;
    }

    if (node.id === root.id) {
      setConfirmDialog({
        isOpen: true,
        title: 'مسح شجرة العائلة',
        message: `⚠️ هل أنت متأكد من مسح عائلة "${root.name}" بالكامل؟ سيتم إنشاء شجرة فارغة جديدة.`,
        confirmText: 'نعم، مسح الشجرة',
        type: 'danger',
        onConfirm: () => {
          const initial = StorageService.createNewTree('شجرة عائلتي');
          setActiveTreeId(initial.id);
          setTreesList(StorageService.getTreesList());
          setSelectedNode(null);
          showToast('🗑️ تم مسح الشجرة');
        },
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'حذف فرد وفروعه',
      message: `هل أنت متأكد من حذف "${node.name}" وجميع ذريته وفروعه من الشجرة؟`,
      confirmText: 'نعم، حذف الفرد وفروعه',
      type: 'danger',
      onConfirm: () => {
        const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode;
        const removeFromRoot = (current: TreeNode): boolean => {
          const idx = current.children.findIndex(c => c.id === node.id);
          if (idx >= 0) {
            current.children.splice(idx, 1);
            return true;
          }
          return current.children.some(removeFromRoot);
        };

        removeFromRoot(newRoot);
        const filteredSpouses = spouses.filter(s => s.id !== node.id && s.spouseId !== node.id);

        setSelectedNode(null);
        setRoot(newRoot);
        setSpouses(filteredSpouses);
        scheduleSave(newRoot, counter, filteredSpouses, nodeOverrides, settings, true);
        showToast(`🗑️ تم حذف "${node.name}" وفروعه`);
      },
    });
  };

  // Create New Family Tree
  const handleCreateNewFamily = (rootName: string, initialChildren: Array<{ name: string; gender: Gender }>) => {
    let nextCounter = 1;
    const newRoot: TreeNode = {
      id: 0,
      name: rootName,
      parentId: null,
      spouseId: null,
      gender: 'male',
      children: [],
      x: 0,
      y: 0,
      level: 0,
      leafCount: 1,
    };

    initialChildren.forEach(child => {
      newRoot.children.push({
        id: nextCounter++,
        name: child.name,
        parentId: 0,
        spouseId: null,
        gender: child.gender,
        children: [],
        x: 0,
        y: 0,
        level: 1,
        leafCount: 1,
      });
    });

    const newTree = StorageService.createNewTree(rootName);
    StorageService.saveTree(newTree.id, newRoot, nextCounter, [], {}, defaultSettings, true);
    setTreesList(StorageService.getTreesList());
    setActiveTreeId(newTree.id);
    showToast(`🌳 تم إنشاء عائلة "${rootName}" بنجاح`);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Load Experimental Tree (شجرة تجريبية: جد + 50 ابن + 50 حفيد لكل ابن = 2551 فرداً)
  const handleLoadExperimentalTree = () => {
    const loaded = StorageService.loadTree('tree_experimental');
    StorageService.setActiveTreeId('tree_experimental');
    setActiveTreeId('tree_experimental');
    setRoot(loaded.root);
    setCounter(loaded.counter);
    setSpouses(loaded.spouses);
    setNodeOverrides(loaded.nodeOverrides);
    setSettings(loaded.settings);
    setSelectedNode(loaded.root);
    setTreesList(StorageService.getTreesList());
    showToast('✨ تم تحميل الشجرة التجريبية (2,551 فرداً: جد + 50 ابن + 50 حفيد) بنجاح فائق!');
    try {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Load Example Data (Prophet and Caliphs Lineage)
  const handleLoadExample = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحميل مشجرة التقاء نسب الرسول ﷺ مع الخلفاء الراشدين',
      message: 'هل ترغب بتحميل النموذج التوضيحي المتكامل لمشجرة "التقاء الخلفاء الراشدين في النسب مع النبي ﷺ" من عدنان إلى رسول الله والخلفاء الراشدين الأربعة؟\nسيتم فتح شجرة جديدة باسم "التقاء الخلفاء الراشدين في النسب مع النبي ﷺ".',
      confirmText: 'تحميل المشجرة النبوية الشريفة',
      type: 'info',
      onConfirm: () => {
        const demoTree = StorageService.create1000MembersDemoTree();
        setTreesList(StorageService.getTreesList());
        setActiveTreeId(demoTree.id);
        setRoot(demoTree.root);
        setCounter(demoTree.counter);
        setSpouses(demoTree.spouses);
        if (demoTree.settings) {
          setSettings(demoTree.settings as TreeSettings);
        }
        setNodeOverrides({});
        setSelectedNode(demoTree.root);
        showToast('✨ تم تحميل مشجرة التقاء نسب الرسول ﷺ مع الخلفاء الراشدين بنجاح!');
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch (_) {}
      },
    });
  };

  // Reset Layout to pristine botanical curves
  const handleResetLayout = () => {
    const clearedOverrides: Record<string, NodeOverride> = {};
    Object.entries(nodeOverrides).forEach(([id, ov]) => {
      const { x, y, autoLayout, ...rest } = ov;
      clearedOverrides[id] = { ...rest, autoLayout: true };
    });
    setNodeOverrides(clearedOverrides);
    scheduleSave(root, counter, spouses, clearedOverrides, settings);
    showToast('🔄 تم إعادة التخطيط التلقائي الأصلي');
  };

  // Restore Snapshot
  const handleRestoreSnapshot = (snapshot: TreeSnapshot) => {
    setConfirmDialog({
      isOpen: true,
      title: 'استعادة نقطة حفظ احتياطية',
      message: `هل أنت متأكد من استعادة نسخة "${snapshot.dateFormatted}" للشجرة الحالية؟`,
      confirmText: 'استعادة النسخة',
      type: 'warning',
      onConfirm: () => {
        setRoot(snapshot.data.root);
        setCounter(snapshot.data.counter);
        setSpouses(snapshot.data.spouses);
        setNodeOverrides(snapshot.data.nodeOverrides);
        setSettings(snapshot.data.settings);
        setSelectedNode(null);

        scheduleSave(
          snapshot.data.root,
          snapshot.data.counter,
          snapshot.data.spouses,
          snapshot.data.nodeOverrides,
          snapshot.data.settings,
          false
        );
        setIsSnapshotsOpen(false);
        showToast(`✅ تم استعادة نسخة "${snapshot.dateFormatted}"`);
      },
    });
  };

  // Helper to render tree SVG onto a clean ultra-high-res HTML5 Canvas (8K / Super-sampled)
  const renderTreeToCanvas = async (options?: {
    dpi?: 150 | 200 | 300;
    bgMode?: 'theme' | 'white';
    includeHeader?: boolean;
    includeBorder?: boolean;
    includeStats?: boolean;
    treeTitle?: string;
    totalMembers?: number;
    totalGenerations?: number;
  }): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> => {
    // Wait brief moment for React to expand all collapsed nodes into full DOM
    await new Promise(r => setTimeout(r, 250));

    const svgEl = document.getElementById('family-tree-svg') as SVGSVGElement | null;
    if (!svgEl) {
      throw new Error('لم يتم العثور على عنصر شجرة العائلة SVG');
    }

    try {
      await document.fonts.ready;
    } catch (_) {}

    // 1. Extract natural viewBox / dimensions
    const viewBoxAttr = svgEl.getAttribute('viewBox');
    let naturalWidth = 3000;
    let naturalHeight = 2200;
    if (viewBoxAttr) {
      const parts = viewBoxAttr.split(' ').map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        naturalWidth = parts[2];
        naturalHeight = parts[3];
      }
    }

    // High resolution supersampling safely bounded by max target dimension
    // 300 DPI: up to 7200px, 200 DPI: up to 5400px, 150 DPI: up to 4000px
    const dpi = options?.dpi || 200;
    const maxDim = dpi === 300 ? 7200 : dpi === 200 ? 5400 : 4000;
    const maxNatural = Math.max(naturalWidth, naturalHeight);
    let scaleFactor = 1.0;
    if (maxNatural < maxDim) {
      const maxMultiplier = dpi === 300 ? 3.2 : dpi === 200 ? 2.4 : 1.6;
      scaleFactor = Math.min(maxMultiplier, maxDim / maxNatural);
    } else {
      scaleFactor = maxDim / maxNatural;
    }

    const treeW = Math.max(800, Math.round(naturalWidth * scaleFactor));
    const treeH = Math.max(600, Math.round(naturalHeight * scaleFactor));

    const headerH = options?.includeHeader ? Math.round(160 * scaleFactor) : 0;
    const footerH = options?.includeStats ? Math.round(90 * scaleFactor) : 0;
    const sideMargin = options?.includeBorder ? Math.round(40 * scaleFactor) : 0;

    const targetWidth = treeW + sideMargin * 2;
    const targetHeight = treeH + headerH + footerH + (options?.includeBorder ? Math.round(40 * scaleFactor) : 0);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create Canvas 2D context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 2. Fill Canvas background (White for clean printing or Theme gradient)
    if (options?.bgMode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      const preset = bgPresets.find(p => p.id === settings.bgPreset) || bgPresets[0];
      const gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
      const colors = preset.colors;
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.35, colors[1]);
      gradient.addColorStop(0.7, colors[2]);
      gradient.addColorStop(1, colors[3]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // 3. Clone and sanitize SVG element
    const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgClone.setAttribute('width', String(treeW));
    svgClone.setAttribute('height', String(treeH));
    svgClone.setAttribute('viewBox', viewBoxAttr || `0 0 ${naturalWidth} ${naturalHeight}`);

    // Ensure embedded SVG styles for fonts
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&family=Cairo:wght@400;700;800;900&display=swap');
      text, tspan {
        font-family: '${settings.fontFamily}', 'Tajawal', 'Cairo', system-ui, sans-serif !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
      }
    `;
    svgClone.prepend(styleEl);

    // 4. Serialize to SVG Blob
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    // 5. Load image asynchronously and draw to canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, sideMargin, headerH, treeW, treeH);
        URL.revokeObjectURL(blobUrl);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('فشل معالجة المتجهات عالية الدقة'));
      };
      img.src = blobUrl;
    });

    // 6. Draw Header Banner (if requested)
    if (options?.includeHeader && root) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const isWhiteBg = options.bgMode === 'white';
      const titleY = headerH * 0.42;
      const subtitleY = headerH * 0.74;

      // Main Title
      ctx.font = `bold ${Math.round(38 * scaleFactor)}px '${settings.fontFamily}', Tajawal, Cairo, sans-serif`;
      ctx.fillStyle = isWhiteBg ? '#14532D' : '#FEF3C7';
      ctx.fillText(options.treeTitle || `شجرة نسب عائلة ${root.name}`, targetWidth / 2, titleY);

      // Subtitle
      ctx.font = `500 ${Math.round(18 * scaleFactor)}px '${settings.fontFamily}', Tajawal, Cairo, sans-serif`;
      ctx.fillStyle = isWhiteBg ? '#4B5563' : '#E2E8F0';
      ctx.fillText(`الجد المؤسس: ${root.name}`, targetWidth / 2, subtitleY);

      // Subtle Gold Divider Rule
      const lineWidth = Math.min(targetWidth * 0.45, Math.round(480 * scaleFactor));
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = Math.max(1.5, 2 * scaleFactor);
      ctx.beginPath();
      ctx.moveTo(targetWidth / 2 - lineWidth / 2, headerH - 6 * scaleFactor);
      ctx.lineTo(targetWidth / 2 + lineWidth / 2, headerH - 6 * scaleFactor);
      ctx.stroke();

      ctx.restore();
    }

    // 7. Draw Footer Stats (if requested)
    if (options?.includeStats && options.totalMembers !== undefined) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const isWhiteBg = options.bgMode === 'white';
      const footerY = targetHeight - footerH * 0.45;

      ctx.font = `bold ${Math.round(16 * scaleFactor)}px '${settings.fontFamily}', Tajawal, Cairo, sans-serif`;
      ctx.fillStyle = isWhiteBg ? '#4B5563' : '#CBD5E1';
      const statsText = `عدد أفراد العائلة: ${options.totalMembers}  •  الأجيال المتعاقبة: ${options.totalGenerations || 1}  •  تاريخ التوثيق: ${new Date().toLocaleDateString('ar-EG')}`;
      ctx.fillText(statsText, targetWidth / 2, footerY);

      ctx.restore();
    }

    // 8. Draw Ornate Frame Border (if requested)
    if (options?.includeBorder) {
      ctx.save();
      const bMargin = Math.round(18 * scaleFactor);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = Math.max(2, 3 * scaleFactor);
      ctx.strokeRect(bMargin, bMargin, targetWidth - bMargin * 2, targetHeight - bMargin * 2);

      const innerMargin = bMargin + Math.round(7 * scaleFactor);
      ctx.lineWidth = Math.max(1, 1.2 * scaleFactor);
      ctx.strokeRect(innerMargin, innerMargin, targetWidth - innerMargin * 2, targetHeight - innerMargin * 2);

      ctx.restore();
    }

    return { canvas, width: targetWidth, height: targetHeight };
  };

  // Export Ultra-HD PNG
  const handleExportPNG = async () => {
    if (!root) return showToast('⚠️ لا توجد بيانات شجرة لتصديرها', 'error');
    setIsExporting(true);
    showToast('جاري تحضير الصورة عالية الدقة...');

    try {
      const { canvas } = await renderTreeToCanvas({ dpi: 300, bgMode: 'theme' });

      canvas.toBlob(blob => {
        if (!blob) throw new Error('فشل إنشاء ملف الصورة');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `شجرة_${root.name}_عالية_الدقة.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        setIsExporting(false);
        showToast('✅ تم تصدير صورة PNG فائقة الدقة بنجاح');
      }, 'image/png', 1.0);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('❌ حدث خطأ أثناء تصدير الصورة', 'error');
    }
  };

  // Open Export PDF / Vector Modal
  const handleExportPDF = () => {
    if (!root) return showToast('⚠️ لا توجد بيانات لتصديرها', 'error');
    setIsExportPdfModalOpen(true);
  };

  // Execute High-Resolution PDF or Vector Export with user settings
  const handleExecutePdfExport = async (options: ExportPdfOptions) => {
    if (!root) return showToast('⚠️ لا توجد بيانات لتصديرها', 'error');
    setIsExporting(true);
    setExportProgress('جاري تحضير ملف التصدير...');

    try {
      const svgEl = document.getElementById('family-tree-svg') as SVGSVGElement | null;
      if (!svgEl) throw new Error('لم يتم العثور على عنصر شجرة العائلة SVG');

      // Temporarily expand collapsed nodes if any to ensure complete family printout
      const hadCollapsed = collapsedNodeIds.size > 0;
      if (hadCollapsed) {
        setCollapsedNodeIds(new Set());
        await new Promise(r => setTimeout(r, 260));
      }

      if (options.exportFormat === 'svg') {
        // High Quality Scalable Vector Graphics Export
        setExportProgress('توليد ملف الفيكتور SVG...');
        const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        const styleEl = document.createElement('style');
        styleEl.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&family=Cairo:wght@400;700;800;900&display=swap');
          text, tspan {
            font-family: '${settings.fontFamily}', 'Tajawal', 'Cairo', system-ui, sans-serif !important;
            text-rendering: optimizeLegibility !important;
          }
        `;
        svgClone.prepend(styleEl);

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgClone);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `شجرة_${root.name}_فيكتور_طباعة.svg`;
        link.click();
        URL.revokeObjectURL(link.href);

        setIsExportPdfModalOpen(false);
        setIsExporting(false);
        setExportProgress('');
        showToast('🌟 تم تصدير ملف الفيكتور SVG فائق الدقة بنجاح');
        return;
      }

      // High Quality PDF Export
      setExportProgress('رسم وتجهيز طبقات الشجرة بدقة فائقة...');
      const totalMembers = (root ? countTreeMembers(root) : 0) + spouses.length;
      const totalGenerations = root ? countGenerations(root) : 0;

      const { canvas, width: cWidth, height: cHeight } = await renderTreeToCanvas({
        dpi: options.dpi,
        bgMode: options.bgMode,
        includeHeader: options.includeHeader,
        includeBorder: options.includeBorder,
        includeStats: options.includeStats,
        treeTitle: `شجرة نسب عائلة ${root.name}`,
        totalMembers,
        totalGenerations,
      });

      setExportProgress('بناء مستند PDF والصفحات والزخارف...');

      // Paper Dimensions in points (1 pt = 1/72 inch)
      const paperDimensions: Record<string, [number, number]> = {
        a4: [595.28, 841.89],
        a3: [841.89, 1190.55],
        a2: [1190.55, 1683.78],
        a1: [1683.78, 2383.94],
        custom: [cWidth * 0.75, cHeight * 0.75],
      };

      const [dimW, dimH] = paperDimensions[options.paperSize] || paperDimensions.a3;

      let isLandscape = true;
      if (options.orientation === 'landscape') {
        isLandscape = true;
      } else if (options.orientation === 'portrait') {
        isLandscape = false;
      } else {
        isLandscape = cWidth >= cHeight;
      }

      const pageWidth = isLandscape ? Math.max(dimW, dimH) : Math.min(dimW, dimH);
      const pageHeight = isLandscape ? Math.min(dimW, dimH) : Math.max(dimW, dimH);

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pageWidth, pageHeight],
        compress: true,
      });

      // Background
      if (options.bgMode === 'white') {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // Page print margins
      const margin = 16;
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;

      // Maintain Aspect Ratio of tree canvas
      const scale = Math.min(availW / cWidth, availH / cHeight);
      const drawW = cWidth * scale;
      const drawH = cHeight * scale;
      const drawX = (pageWidth - drawW) / 2;
      const drawY = (pageHeight - drawH) / 2;

      // Add Canvas Image to PDF using lossless PNG compression for maximum clarity
      pdf.addImage(canvas, 'PNG', drawX, drawY, drawW, drawH, undefined, 'FAST');

      // Save PDF File
      pdf.save(`شجرة_العائلة_${root.name}_${options.paperSize.toUpperCase()}_طباعة.pdf`);

      setIsExportPdfModalOpen(false);
      setIsExporting(false);
      setExportProgress('');
      showToast('📄 تم تصدير مستند PDF فائق الجودة والوضوح بنجاح');
      confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.error(e);
      setIsExporting(false);
      setExportProgress('');
      showToast('❌ تعذر تصدير PDF: يرجى المحاولة بحجم صفحة أو دقة أخرى', 'error');
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    if (!root) return;
    const json = StorageService.exportJSON(activeTreeId, root, counter, spouses, nodeOverrides, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `نسخة_شجرة_${root.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('💾 تم حفظ وتحميل ملف JSON الاحتياطي');
  };

  // Import JSON Backup
  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = StorageService.parseImportJSON(content);
      if (res.valid && res.data) {
        const newTree = StorageService.createNewTree(res.data.treeName);
        StorageService.saveTree(
          newTree.id,
          res.data.root,
          res.data.counter,
          res.data.spouses,
          res.data.nodeOverrides,
          res.data.settings,
          true
        );
        setTreesList(StorageService.getTreesList());
        setActiveTreeId(newTree.id);
        showToast(`✅ تم استيراد شجرة "${res.data.treeName}" بنجاح`);
      } else {
        showToast(res.error || 'ملف غير صالح', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear All App Data
  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'مسح جميع البيانات والبدء من جديد',
      message: '⚠️ تحذير: سيتم حذف جميع شجرات العائلة والنسخ الاحتياطية نهائياً من الذاكرة المحلية لهذا المتصفح. هل أنت متأكد؟',
      confirmText: 'نعم، مسح كل شيء',
      type: 'danger',
      onConfirm: () => {
        localStorage.clear();
        const initial = StorageService.createNewTree('شجرة عائلتي');
        setActiveTreeId(initial.id);
        setTreesList(StorageService.getTreesList());
        setSelectedNode(null);
        showToast('🗑️ تم مسح جميع البيانات والبدء من جديد');
      },
    });
  };

  const memberCount = countTreeMembers(root, spouses);

  const handleToggleDragMode = useCallback(() => {
    const newDrag = !settings.dragMode;
    const updated = { ...settings, dragMode: newDrag };
    setSettings(updated);
    scheduleSave(root, counter, spouses, nodeOverrides, updated);
    showToast(newDrag ? '🖐️ تم تفعيل وضع التحريك والسحب' : '✋ تم إيقاف وضع التحريك');
  }, [settings, root, counter, spouses, nodeOverrides, scheduleSave, showToast]);

  // Short Click Drag Mode: Activate Move Subtree (Parent with children) or Toggle off if already subtree
  const handleShortClickDragMode = useCallback(() => {
    if (settings.dragMode && settings.moveMode === 'subtree') {
      const updated = { ...settings, dragMode: false };
      setSettings(updated);
      scheduleSave(root, counter, spouses, nodeOverrides, updated);
      showToast('✋ تم إيقاف وضع التحريك');
    } else {
      const updated = { ...settings, dragMode: true, moveMode: 'subtree' as const };
      setSettings(updated);
      scheduleSave(root, counter, spouses, nodeOverrides, updated);
      showToast('🌳🖐️ تم تفعيل نقل الأب مع الأبناء (الفرع كاملاً)');
    }
  }, [settings, root, counter, spouses, nodeOverrides, scheduleSave, showToast]);

  // Long Press Drag Mode: Activate Move Node Only (Selected individual only)
  const handleLongPressDragMode = useCallback(() => {
    const updated = { ...settings, dragMode: true, moveMode: 'nodeOnly' as const };
    setSettings(updated);
    scheduleSave(root, counter, spouses, nodeOverrides, updated);
    showToast('👤🖐️ تم تفعيل نقل الفرد المحدد فقط (دون الأبناء)');
  }, [settings, root, counter, spouses, nodeOverrides, scheduleSave, showToast]);

  // Directly set move mode
  const handleSetMoveMode = useCallback((mode: 'nodeOnly' | 'subtree') => {
    const updated = { ...settings, dragMode: true, moveMode: mode };
    setSettings(updated);
    scheduleSave(root, counter, spouses, nodeOverrides, updated);
    if (mode === 'subtree') {
      showToast('🌳🖐️ تم تفعيل نقل الأب مع الأبناء (الفرع بالكامل)');
    } else {
      showToast('👤🖐️ تم تفعيل نقل الفرد المحدد فقط (دون الأبناء)');
    }
  }, [settings, root, counter, spouses, nodeOverrides, scheduleSave, showToast]);

  const handleToggleAllowReparenting = useCallback(() => {
    const nextVal = settings.allowReparenting === false ? true : false;
    const updated = { ...settings, allowReparenting: nextVal };
    setSettings(updated);
    scheduleSave(root, counter, spouses, nodeOverrides, updated);
    showToast(nextVal ? '🔗 تم تفعيل إمكانية نقل الأولاد بين الآباء' : '🚫 تم إيقاف نقل الأولاد (تحريك مواضع الفروع فقط دون تغيير الأبوة)');
  }, [settings, root, counter, spouses, nodeOverrides, scheduleSave, showToast]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-emerald-950 font-['Tajawal',sans-serif]">
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Main Top Header */}
      <Header
        treeName={root?.name || 'شجرة العائلة'}
        isDragMode={settings.dragMode}
        moveMode={settings.moveMode || 'subtree'}
        onShortClickDragMode={handleShortClickDragMode}
        onLongPressDragMode={handleLongPressDragMode}
        onToggleDragMode={handleToggleDragMode}
        isAllowReparenting={settings.allowReparenting !== false}
        onToggleAllowReparenting={handleToggleAllowReparenting}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSnapshots={() => setIsSnapshotsOpen(true)}
        onOpenTreesManager={() => setIsTreesManagerOpen(true)}
        onOpenMainMenu={() => setIsMainMenuOpen(true)}
        lastSavedTime={lastSavedTime}
        isSaving={isSaving}
        memberCount={memberCount}
      />

      {/* Family Tree Interactive Canvas */}
      <div className="w-full h-full pt-16">
        <FamilyTreeCanvas
          root={root}
          spouses={spouses}
          nodeOverrides={nodeOverrides}
          settings={settings}
          selectedNode={selectedNode}
          onSelectNode={handleSelectNode}
          onMoveNodeSubtree={handleMoveNodeSubtree}
          onReparentNode={handleReparentNode}
          onAddChild={handleOpenAddChild}
          onToggleDragMode={handleToggleDragMode}
          collapsedNodeIds={isExporting ? new Set() : collapsedNodeIds}
          onToggleCollapseNode={handleToggleCollapseNode}
          isExporting={isExporting}
          onUndo={handleUndo}
          canUndo={historyIndex > 0}
        />
      </div>

      {/* Floating Add Child Quick Button (Bottom Right - Unified Pill) */}
      <div className="fixed bottom-5 right-3 sm:right-5 z-30 flex items-center">
        <button
          onClick={() => {
            if (selectedNode) {
              handleOpenAddChild(selectedNode);
            } else if (root) {
              handleOpenAddChild(root);
            } else {
              setIsNewFamilyOpen(true);
            }
          }}
          className="h-10 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-xl border border-emerald-600/50 backdrop-blur-md transition-all"
          title={selectedNode ? `إضافة ابن لـ (${selectedNode.name})` : root ? `إضافة ابن للجذر المؤسس (${root.name})` : 'إنشاء شجرة جديدة'}
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-white hidden sm:inline">
            {selectedNode ? `إضافة لـ ${selectedNode.name}` : 'إضافة ابن'}
          </span>
        </button>
      </div>

      {/* Selected Node Floating Action & Font Sizing Bar */}
      {selectedNode && (
        <SelectedNodeBar
          selectedNode={selectedNode}
          nodeOverride={nodeOverrides[selectedNode.id]}
          settings={settings}
          onClearSelection={() => setSelectedNode(null)}
          onAddChild={handleOpenAddChild}
          onAddSibling={handleOpenAddSibling}
          onAddSpouse={handleOpenAddSpouse}
          onAddParent={handleOpenAddParent}
          onEditNode={handleOpenEdit}
          onDeleteNode={handleDeleteNode}
          onViewDetails={node => {
            setDetailsNode(node);
            setIsDetailsOpen(true);
          }}
          onUpdateFontSize={handleUpdateNodeFontSize}
          onUpdateScale={handleUpdateNodeScale}
          onOpenReparent={handleOpenReparentModal}
          onAutoArrangeChildren={handleAutoArrangeChildren}
          collapsedNodeIds={collapsedNodeIds}
          onToggleCollapseNode={handleToggleCollapseNode}
        />
      )}

      {/* MODALS */}
      <PersonModal
        isOpen={isPersonModalOpen}
        title={personModalConfig.title}
        initialData={personModalConfig.actionType === 'edit' ? personModalConfig.targetNode : null}
        initialOverride={personModalConfig.targetNode ? nodeOverrides[personModalConfig.targetNode.id] : null}
        settings={settings}
        parentSpouses={getParentSpouses()}
        initialSpouseParentId={personModalConfig.actionType === 'edit' && personModalConfig.targetNode ? personModalConfig.targetNode.spouseParentId : null}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSavePerson}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={newSettings => {
          let updatedOverrides = { ...nodeOverrides };
          const oldLayout = settings.layoutStyle || 'botanical';
          const newLayout = newSettings.layoutStyle || 'botanical';

          if (newLayout !== oldLayout) {
            // 1. Preserve current layout positions
            Object.entries(updatedOverrides).forEach(([id, ov]) => {
              if (ov.x !== undefined && ov.y !== undefined && !ov.autoLayout) {
                ov.layoutPositions = {
                  ...(ov.layoutPositions || {}),
                  [oldLayout]: { x: ov.x, y: ov.y },
                };
                if (oldLayout === 'botanical') {
                  ov.layoutPositions.botanical = { x: ov.x, y: ov.y };
                }
              }
            });

            // 2. Prepare overrides for the target layout
            const nextOverrides: Record<string, NodeOverride> = {};
            Object.entries(updatedOverrides).forEach(([id, ov]) => {
              const savedPosForNewLayout =
                ov.layoutPositions?.[newLayout] ||
                (newLayout === 'botanical' ? ov.layoutPositions?.['botanical'] : undefined);

              if (savedPosForNewLayout) {
                nextOverrides[id] = {
                  ...ov,
                  x: savedPosForNewLayout.x,
                  y: savedPosForNewLayout.y,
                  autoLayout: false,
                };
              } else {
                const { x, y, autoLayout, ...rest } = ov;
                nextOverrides[id] = {
                  ...rest,
                  autoLayout: true,
                };
              }
            });

            updatedOverrides = nextOverrides;
            setNodeOverrides(nextOverrides);

            const layoutNames: Record<string, string> = {
              botanical: 'الشجرة الطبيعية (الأساسي - مع استعادة ترتيبك اليدوي)',
              classic: 'التخطيط الهرمي',
              circular: 'التوزيع الدائري',
              upward: 'المتجه للأعلى',
              downward: 'المتجه للأسفل',
              horizontal: 'المتجه أفقياً',
            };
            showToast(`🌿 تم تطبيق ${layoutNames[newLayout] || newLayout}`);
          }
          setSettings(newSettings);
          scheduleSave(root, counter, spouses, updatedOverrides, newSettings, false, false, true);
        }}
        onResetSettings={() => {
          setSettings(defaultSettings);
          scheduleSave(root, counter, spouses, nodeOverrides, defaultSettings, false, false, true);
          showToast('🔄 تم استعادة الإعدادات الافتراضية');
        }}
      />

      <SnapshotsModal
        isOpen={isSnapshotsOpen}
        snapshots={snapshots}
        onClose={() => setIsSnapshotsOpen(false)}
        onCreateSnapshot={note => {
          if (root) {
            StorageService.createSnapshot(activeTreeId, root, counter, spouses, nodeOverrides, settings, note);
            setSnapshots(StorageService.getSnapshots(activeTreeId));
            showToast('💾 تم حفظ نقطة استرجاع احتياطية جديدة');
          }
        }}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={snapshotId => {
          StorageService.deleteSnapshot(activeTreeId, snapshotId);
          setSnapshots(StorageService.getSnapshots(activeTreeId));
          showToast('🗑️ تم حذف نقطة الحفظ');
        }}
      />

      <TreesManagerModal
        isOpen={isTreesManagerOpen}
        activeTreeId={activeTreeId}
        treesList={treesList}
        onClose={() => setIsTreesManagerOpen(false)}
        onSwitchTree={handleSwitchTree}
        onCreateTree={handleCreateNewTree}
        onDeleteTree={handleDeleteTree}
        onLoadRabiahTree={handleLoadExperimentalTree}
        onLoadExperimentalTree={handleLoadExperimentalTree}
        onLoad1000DemoTree={handleLoadExample}
      />

      <SearchModal
        isOpen={isSearchOpen}
        root={root}
        spouses={spouses}
        onClose={() => setIsSearchOpen(false)}
        onSelectPerson={person => {
          setSelectedNode(person);
          showToast(`✓ تم تحديد: ${person.name}`);
        }}
      />

      <MainMenuModal
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        onNewFamily={() => setIsNewFamilyOpen(true)}
        onLoadExample={handleLoadExample}
        onToggleDragMode={handleToggleDragMode}
        isDragMode={settings.dragMode}
        moveMode={settings.moveMode || 'subtree'}
        onSetMoveMode={handleSetMoveMode}
        onResetLayout={handleResetLayout}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSONClick}
        onOpenSnapshots={() => setIsSnapshotsOpen(true)}
        onOpenTreesManager={() => setIsTreesManagerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAll}
        onShowAbout={() => setIsAboutOpen(true)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <NewFamilyModal
        isOpen={isNewFamilyOpen}
        onClose={() => setIsNewFamilyOpen(false)}
        onCreate={handleCreateNewFamily}
      />

      <DetailsModal
        isOpen={isDetailsOpen}
        node={detailsNode}
        override={detailsNode ? nodeOverrides[detailsNode.id] : null}
        settings={settings}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleOpenEdit}
        onOpenReparent={handleOpenReparentModal}
      />

      <ReparentModal
        isOpen={isReparentModalOpen}
        node={reparentModalNode}
        root={root}
        onClose={() => {
          setIsReparentModalOpen(false);
          setReparentModalNode(null);
        }}
        onReparent={handleReparentNode}
      />

      <ActionSheet
        isOpen={isActionSheetOpen}
        node={actionSheetNode}
        override={actionSheetNode ? nodeOverrides[actionSheetNode.id] : null}
        settings={settings}
        onClose={() => setIsActionSheetOpen(false)}
        onAddChild={handleOpenAddChild}
        onAddSibling={handleOpenAddSibling}
        onAddSpouse={handleOpenAddSpouse}
        onAddParent={handleOpenAddParent}
        onEditNode={handleOpenEdit}
        onViewDetails={node => {
          setDetailsNode(node);
          setIsDetailsOpen(true);
        }}
        onDeleteNode={handleDeleteNode}
        onOpenReparent={handleOpenReparentModal}
        onAutoArrangeChildren={handleAutoArrangeChildren}
        collapsedNodeIds={collapsedNodeIds}
        onToggleCollapseNode={handleToggleCollapseNode}
      />

      {/* High-Resolution Printable PDF & Vector Export Modal */}
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        root={root}
        treeName={root?.name || 'العائلة'}
        memberCount={(root ? countTreeMembers(root) : 0) + spouses.length}
        generationCount={root ? countGenerations(root) : 0}
        onExport={handleExecutePdfExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      {/* Floating Alert Toast */}
      <Toast message={toastMessage} type={toastType} />

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
