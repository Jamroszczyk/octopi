import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Node, Edge } from 'reactflow';
import { colors } from '../theme/colors';

export interface TaskNode extends Node {
  data: {
    label: string;
    level: 0 | 1 | 2;
    slot: number;
    completed?: boolean;
  };
}

interface GraphState {
  nodes: TaskNode[];
  edges: Edge[];
  pinnedNodeIds: string[];
  addNode: (parentId?: string, level?: 0 | 1 | 2) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  toggleNodeCompleted: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  swapNodeSlots: (nodeId: string, targetSlot: number) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  saveToJSON: () => string;
  loadFromJSON: (json: string) => void;
  setNodes: (nodes: TaskNode[]) => void;
  setEdges: (edges: Edge[]) => void;
}

// Create initial demo structure
const createInitialGraph = () => {
  // Root node
  const rootNode: TaskNode = {
    id: 'root-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Root Task', level: 0, slot: 0 },
  };

  // Child nodes (Level 1)
  const subtask1: TaskNode = {
    id: 'subtask-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Subtask 1', level: 1, slot: 0 },
  };

  const subtask2: TaskNode = {
    id: 'subtask-2',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Subtask 2', level: 1, slot: 1 },
  };

  // Leaf nodes for Subtask 1 (Level 2)
  const todo1_1: TaskNode = {
    id: 'todo-1-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Todo 1', level: 2, slot: 0, completed: false },
  };

  const todo1_2: TaskNode = {
    id: 'todo-1-2',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Todo 2', level: 2, slot: 1, completed: false },
  };

  // Leaf nodes for Subtask 2 (Level 2)
  const todo2_1: TaskNode = {
    id: 'todo-2-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Todo 1', level: 2, slot: 2, completed: false },
  };

  const todo2_2: TaskNode = {
    id: 'todo-2-2',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: { label: 'Todo 2', level: 2, slot: 3, completed: false },
  };

  const initialNodes = [rootNode, subtask1, subtask2, todo1_1, todo1_2, todo2_1, todo2_2];

  const initialEdges: Edge[] = [
    {
      id: 'edge-root-subtask1',
      source: 'root-1',
      target: 'subtask-1',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
    {
      id: 'edge-root-subtask2',
      source: 'root-1',
      target: 'subtask-2',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
    {
      id: 'edge-subtask1-todo1',
      source: 'subtask-1',
      target: 'todo-1-1',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
    {
      id: 'edge-subtask1-todo2',
      source: 'subtask-1',
      target: 'todo-1-2',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
    {
      id: 'edge-subtask2-todo1',
      source: 'subtask-2',
      target: 'todo-2-1',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
    {
      id: 'edge-subtask2-todo2',
      source: 'subtask-2',
      target: 'todo-2-2',
      type: 'default',
      animated: false,
      style: { stroke: colors.edge, strokeWidth: 2.5 },
    },
  ];

  return { nodes: initialNodes, edges: initialEdges };
};

const { nodes: initialNodes, edges: initialEdges } = createInitialGraph();

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  pinnedNodeIds: [],

  addNode: (parentId, level = 0) => {
    const nodes = get().nodes;
    const edges = get().edges;
    const pinnedNodeIds = get().pinnedNodeIds;
    const nodesAtLevel = nodes.filter(n => n.data.level === level);
    const newSlot = nodesAtLevel.length;
    
    // Check if parent is pinned - if so, unpin it with confirmation
    if (parentId && pinnedNodeIds.includes(parentId)) {
      const parentNode = nodes.find(n => n.id === parentId);
      if (parentNode) {
        const confirmMessage = `"${parentNode.data.label}" wird aus dem Pinboard entfernt, da es jetzt Child-Nodes hat und keine Leaf-Node mehr ist.`;
        alert(confirmMessage);
        set({ pinnedNodeIds: pinnedNodeIds.filter(id => id !== parentId) });
      }
    }
    
    const newNode: TaskNode = {
      id: nanoid(),
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { label: 'New Task', level, slot: newSlot },
    };

    const newNodes = [...nodes, newNode];
    let newEdges = [...edges];

    if (parentId) {
      newEdges.push({
        id: nanoid(),
        source: parentId,
        target: newNode.id,
        type: 'default',
        animated: false,
        style: {
          stroke: colors.edge,
          strokeWidth: 2.5,
        },
      });
    }

    set({ nodes: newNodes, edges: newEdges });
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      ),
    });
  },

  toggleNodeCompleted: (nodeId) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, completed: !node.data.completed } }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    const nodes = get().nodes;
    const edges = get().edges;

    const findDescendants = (id: string): string[] => {
      const children = edges.filter(e => e.source === id).map(e => e.target);
      return [id, ...children.flatMap(findDescendants)];
    };

    const nodesToDelete = findDescendants(nodeId);

    set({
      nodes: nodes.filter(n => !nodesToDelete.includes(n.id)),
      edges: edges.filter(e => 
        !nodesToDelete.includes(e.source) && 
        !nodesToDelete.includes(e.target)
      ),
    });
  },

  swapNodeSlots: (nodeId, targetSlot) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const level = node.data.level;
    const currentSlot = node.data.slot;
    if (currentSlot === targetSlot) return;

    // Only swap slots at the same level (not descendants)
    // The layout engine will automatically reposition children relative to parents
    const targetNode = nodes.find(
      n => n.data.level === level && n.data.slot === targetSlot && n.id !== nodeId
    );

    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, slot: targetSlot } };
      }
      if (targetNode && n.id === targetNode.id) {
        return { ...n, data: { ...n.data, slot: currentSlot } };
      }
      return n;
    });

    set({ nodes: updatedNodes });
  },

  pinNode: (nodeId) => {
    const pinnedNodeIds = get().pinnedNodeIds;
    if (!pinnedNodeIds.includes(nodeId)) {
      set({ pinnedNodeIds: [...pinnedNodeIds, nodeId] });
    }
  },

  unpinNode: (nodeId) => {
    set({ pinnedNodeIds: get().pinnedNodeIds.filter(id => id !== nodeId) });
  },

  saveToJSON: () => {
    const { nodes, edges, pinnedNodeIds } = get();
    return JSON.stringify({ nodes, edges, pinnedNodeIds }, null, 2);
  },

  loadFromJSON: (json) => {
    try {
      const { nodes, edges, pinnedNodeIds = [] } = JSON.parse(json);
      set({ nodes, edges, pinnedNodeIds });
    } catch (error) {
      console.error('Failed to load JSON:', error);
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));

