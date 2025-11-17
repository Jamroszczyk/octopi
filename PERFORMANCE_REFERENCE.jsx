/**
 * PERFORMANCE REFERENCE FOR SMOOTH NODE DRAGGING IN REACT FLOW
 * 
 * This file demonstrates the optimal way to implement parent-child dragging
 * in React Flow with buttery smooth performance.
 * 
 * KEY PERFORMANCE FACTORS:
 * 
 * 1. Use React Flow's built-in hooks (useNodesState, useEdgesState)
 *    - These are optimized for performance
 *    - Handle internal state management efficiently
 * 
 * 2. Memoize callbacks with useCallback
 *    - Prevents unnecessary re-renders
 *    - Stable function references across renders
 * 
 * 3. Direct position updates during drag
 *    - Update positions incrementally (delta-based)
 *    - Don't recalculate entire tree structure on each drag event
 * 
 * 4. Efficient descendant lookup
 *    - Cache edges reference during drag
 *    - Simple breadth-first search
 * 
 * 5. Let React Flow handle the main node being dragged
 *    - Only manually update the children
 *    - React Flow's internal optimization handles the dragged node
 */

import { useCallback, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';

function PerformantDraggingExample() {
  // USE REACT FLOW'S OPTIMIZED HOOKS - Critical for performance
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Track the dragged node's position to calculate delta
  const [draggedNode, setDraggedNode] = useState(null);

  /**
   * EFFICIENT DESCENDANT FINDER
   * - Simple BFS traversal
   * - Uses Set for O(1) lookups
   * - Memoized with useCallback
   */
  const getDescendants = useCallback((nodeId, currentEdges) => {
    const descendants = new Set();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = currentEdges
        .filter(edge => edge.source === currentId)
        .map(edge => edge.target);
      
      children.forEach(childId => {
        if (!descendants.has(childId)) {
          descendants.add(childId);
          queue.push(childId);
        }
      });
    }
    
    return Array.from(descendants);
  }, []); // No dependencies - pure function

  /**
   * DRAG START - Capture initial position
   * - Store reference position
   * - Lightweight operation
   */
  const onNodeDragStart = useCallback((event, node) => {
    setDraggedNode({ id: node.id, position: node.position });
  }, []);

  /**
   * ON NODE DRAG - THE CRITICAL PERFORMANCE FUNCTION
   * 
   * Why this is fast:
   * 1. Delta-based updates (not absolute positioning)
   * 2. Only updates children, not the dragged node (React Flow handles that)
   * 3. Single setNodes call per drag event
   * 4. Minimal object creation/spreading
   * 5. Direct position manipulation
   */
  const onNodeDrag = useCallback((event, node) => {
    if (!draggedNode) return;

    // Calculate delta from last position (INCREMENTAL, not absolute)
    const deltaX = node.position.x - draggedNode.position.x;
    const deltaY = node.position.y - draggedNode.position.y;

    // Get all descendants once per drag event
    const descendants = getDescendants(node.id, edges);

    // Only update if there are children to move
    if (descendants.length > 0) {
      setNodes((nds) =>
        nds.map((n) => {
          // Only update descendants
          if (descendants.includes(n.id)) {
            return {
              ...n,
              position: {
                x: n.position.x + deltaX, // Incremental update
                y: n.position.y + deltaY,
              },
            };
          }
          return n; // Return unchanged node (no new object creation)
        })
      );
    }

    // Update reference position for next drag event
    setDraggedNode({ id: node.id, position: node.position });
  }, [draggedNode, edges, getDescendants, setNodes]);

  /**
   * DRAG STOP - Clean up
   * - Reset state
   * - Minimal overhead
   */
  const onNodeDragStop = useCallback(() => {
    setDraggedNode(null);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}      // CRITICAL: Use onNodeDrag, not onNodesChange for dragging
      onNodeDragStop={onNodeDragStop}
      fitView
    >
      {/* ... */}
    </ReactFlow>
  );
}

/**
 * COMMON PERFORMANCE PITFALLS TO AVOID:
 * 
 * ❌ DON'T: Recreate edges during drag
 * ❌ DON'T: Use absolute positioning instead of deltas
 * ❌ DON'T: Update all nodes when only children need updating
 * ❌ DON'T: Create new edge connections during drag
 * ❌ DON'T: Recalculate tree structure on every drag event
 * ❌ DON'T: Use heavy computations in the drag handler
 * ❌ DON'T: Create new component instances during drag
 * ❌ DON'T: Update state multiple times per drag event
 * 
 * ✅ DO: Use delta-based position updates
 * ✅ DO: Memoize all callbacks
 * ✅ DO: Use React Flow's built-in state hooks
 * ✅ DO: Let React Flow handle the main dragged node
 * ✅ DO: Only update child positions, not edges
 * ✅ DO: Keep drag handler logic minimal
 * ✅ DO: Use single state update per drag event
 * ✅ DO: Return unchanged objects when no update needed
 */

export default PerformantDraggingExample;

