import type { TaskNode } from '../store/graphStore';
import type { Edge } from 'reactflow';

/**
 * Get all leaf descendants (nodes without children) of a given node
 */
export function getLeafDescendants(
  nodeId: string,
  nodes: TaskNode[],
  edges: Edge[]
): TaskNode[] {
  const children = edges
    .filter(e => e.source === nodeId)
    .map(e => e.target)
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean) as TaskNode[];

  if (children.length === 0) {
    // This node itself is a leaf
    const node = nodes.find(n => n.id === nodeId);
    return node ? [node] : [];
  }

  // Recursively get all leaf descendants from children
  return children.flatMap(child => getLeafDescendants(child.id, nodes, edges));
}

/**
 * Calculate completion progress for a node based on its leaf descendants
 * Returns a number between 0 and 1
 */
export function calculateNodeProgress(
  nodeId: string,
  nodes: TaskNode[],
  edges: Edge[]
): number {
  const leafDescendants = getLeafDescendants(nodeId, nodes, edges);
  
  if (leafDescendants.length === 0) {
    return 0;
  }

  const completedCount = leafDescendants.filter(leaf => leaf.data.completed).length;
  return completedCount / leafDescendants.length;
}

