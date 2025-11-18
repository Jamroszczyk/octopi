import type { TaskNode } from '../store/graphStore';
import type { Edge } from 'reactflow';

const LEVEL_SPACING = 340; // Horizontal spacing between levels (left to right) - increased for better separation
const NODE_SPACING = 20; // Vertical spacing between sibling nodes (top to bottom) - reduced for tighter vertical grouping
const MIN_NODE_WIDTH = 120;
const MAX_NODE_WIDTH = 300;
const PADDING = 32; // 16px left + 16px right padding
const CHAR_WIDTH = 8; // Approximate character width

interface LayoutConfig {
  levelSpacing?: number;
  nodeSpacing?: number;
}

/**
 * Estimate the width of a node based on its text content
 */
function estimateNodeWidth(node: TaskNode): number {
  const text = node.data.label || '';
  const lines = text.split('\n');
  const longestLine = Math.max(...lines.map(line => line.length));
  
  // Add space for checkbox if it's a leaf node
  const checkboxWidth = 28; // 20px checkbox + 8px gap
  
  // Calculate estimated width based on character count
  const textWidth = longestLine * CHAR_WIDTH;
  const estimatedWidth = textWidth + PADDING + checkboxWidth;
  
  // Clamp between min and max
  return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, estimatedWidth));
}

/**
 * Calculate the total height needed for a node and all its descendants
 * (height = vertical space for siblings in horizontal layout)
 */
function calculateSubtreeHeight(
  nodeId: string,
  nodes: TaskNode[],
  edges: Edge[],
  nodeSpacing: number
): number {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return 100; // Default node height

  const children = edges
    .filter(e => e.source === nodeId)
    .map(e => e.target)
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean) as TaskNode[];

  if (children.length === 0) {
    // Leaf node - use estimated height based on text (approximate)
    const text = node.data.label || '';
    const lines = text.split('\n');
    const lineHeight = 24; // Approximate line height
    const minHeight = 60; // Minimum node height
    return Math.max(minHeight, lines.length * lineHeight + 40);
  }

  // Calculate total height needed for all children and their subtrees
  const childrenHeights = children.map(child => 
    calculateSubtreeHeight(child.id, nodes, edges, nodeSpacing)
  );
  
  const totalChildrenHeight = childrenHeights.reduce((sum, h) => sum + h, 0) + 
    (children.length - 1) * nodeSpacing;

  // Parent node should be at least as tall as its own content, or as tall as its children
  const text = node.data.label || '';
  const lines = text.split('\n');
  const lineHeight = 24;
  const nodeHeight = Math.max(60, lines.length * lineHeight + 40);
  return Math.max(nodeHeight, totalChildrenHeight);
}

/**
 * Position a node and its descendants recursively (horizontal layout: left to right)
 */
function positionSubtree(
  nodeId: string,
  x: number,
  centerY: number,
  nodes: TaskNode[],
  edges: Edge[],
  positioned: Map<string, TaskNode>,
  levelSpacing: number,
  nodeSpacing: number
): void {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || positioned.has(nodeId)) return;

  // Position this node at the given position
  positioned.set(nodeId, { ...node, position: { x, y: centerY } });

  // Get children
  const children = edges
    .filter(e => e.source === nodeId)
    .map(e => e.target)
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean) as TaskNode[];

  if (children.length === 0) return;

  // Sort children by slot
  children.sort((a, b) => a.data.slot - b.data.slot);

  // Calculate height for each child subtree (vertical space for siblings)
  const childHeights = children.map(child => 
    calculateSubtreeHeight(child.id, nodes, edges, nodeSpacing)
  );

  // Calculate total height needed
  const totalHeight = childHeights.reduce((sum, h) => sum + h, 0) + 
    (children.length - 1) * nodeSpacing;

  // Start positioning children from top to bottom (vertically)
  let currentY = centerY - totalHeight / 2;

  children.forEach((child, i) => {
    const childHeight = childHeights[i];
    const childCenterY = currentY + childHeight / 2;
    
    // Position children to the right of parent (x + levelSpacing)
    positionSubtree(
      child.id,
      x + levelSpacing,
      childCenterY,
      nodes,
      edges,
      positioned,
      levelSpacing,
      nodeSpacing
    );

    currentY += childHeight + nodeSpacing;
  });
}

/**
 * Calculate positions for all nodes based on hierarchy (horizontal layout: left to right)
 */
export function calculateLayout(
  nodes: TaskNode[],
  edges: Edge[],
  config: LayoutConfig = {}
): TaskNode[] {
  const levelSpacing = config.levelSpacing ?? LEVEL_SPACING;
  const nodeSpacing = config.nodeSpacing ?? NODE_SPACING;

  const positioned = new Map<string, TaskNode>();

  // Find root nodes (level 0, no incoming edges)
  const rootNodes = nodes
    .filter(n => n.data.level === 0)
    .sort((a, b) => a.data.slot - b.data.slot);

  if (rootNodes.length === 0) {
    return nodes;
  }

  // Calculate height for each root subtree (vertical space for siblings)
  const rootHeights = rootNodes.map(root => 
    calculateSubtreeHeight(root.id, nodes, edges, nodeSpacing)
  );

  // Calculate total height needed for all roots
  const totalHeight = rootHeights.reduce((sum, h) => sum + h, 0) + 
    (rootNodes.length - 1) * nodeSpacing * 2; // Extra spacing between root trees

  // Position each root and its subtree (vertically stacked, starting from top)
  let currentY = -totalHeight / 2;

  rootNodes.forEach((root, i) => {
    const rootHeight = rootHeights[i];
    const rootCenterY = currentY + rootHeight / 2;
    
    // Root nodes start at x = 0, children go to the right
    positionSubtree(
      root.id,
      0,
      rootCenterY,
      nodes,
      edges,
      positioned,
      levelSpacing,
      nodeSpacing
    );

    currentY += rootHeight + nodeSpacing * 2;
  });

  // Return all positioned nodes (preserve any unpositioned nodes with original position)
  return nodes.map(node => positioned.get(node.id) || node);
}

/**
 * Find the slot index at a given y position for nodes at a specific level
 * (In horizontal layout, siblings are stacked vertically, so we use Y position)
 */
export function getSlotAtPosition(
  y: number,
  level: number,
  nodes: TaskNode[]
): number {
  const nodesAtLevel = nodes.filter(n => n.data.level === level);
  nodesAtLevel.sort((a, b) => a.data.slot - b.data.slot);

  if (nodesAtLevel.length === 0) return 0;

  // Find closest slot based on current Y positions (vertical stacking)
  let closestSlot = 0;
  let minDistance = Infinity;

  for (let i = 0; i < nodesAtLevel.length; i++) {
    const node = nodesAtLevel[i];
    const distance = Math.abs(y - node.position.y);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestSlot = node.data.slot;
    }
  }

  return closestSlot;
}

/**
 * Get all descendant node IDs recursively
 */
export function getDescendantIds(nodeId: string, edges: Edge[]): string[] {
  const children = edges.filter(e => e.source === nodeId).map(e => e.target);
  return [...children, ...children.flatMap(childId => getDescendantIds(childId, edges))];
}
