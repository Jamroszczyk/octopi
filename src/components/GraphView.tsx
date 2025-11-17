import { useCallback, useEffect, useState, type FC } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  applyNodeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeDragHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import EditableNode from './EditableNode';
import { useGraphStore } from '../store/graphStore';
import { colors } from '../theme/colors';
import { PINBOARD_HEIGHT } from './Pinboard';

// Move nodeTypes outside component to prevent recreation
const nodeTypes = { editableNode: EditableNode };

const GraphView: FC = () => {
  const { fitView } = useReactFlow();
  const { nodes: storeNodes, edges, setNodes: setStoreNodes, setEdges, deleteNode } = useGraphStore();
  
  // Use local state for nodes during drag for better performance
  const [localNodes, setLocalNodes] = useState(storeNodes);
  
  // Sync local nodes with store nodes when store updates (but not during drag)
  useEffect(() => {
    setLocalNodes(storeNodes);
  }, [storeNodes]);

  // Only fit view on initial mount, not on every change
  useEffect(() => {
    if (storeNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400, includeHiddenNodes: false });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected node on Backspace or Delete
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Check if we're editing a node (textarea is focused)
        const isEditingNode = document.activeElement?.tagName === 'TEXTAREA';
        
        // Only handle deletion if we're NOT editing
        if (!isEditingNode) {
          const selectedNode = localNodes.find(n => n.selected);
          if (selectedNode) {
            // Prevent default browser behavior (going back in history)
            event.preventDefault();
            deleteNode(selectedNode.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localNodes, deleteNode]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Apply changes to local nodes using React Flow's optimized function
      const updatedNodes = applyNodeChanges(changes, localNodes);
      
      // Handle dragging children with parent
      const positionChanges = changes.filter(
        change => change.type === 'position' && change.dragging
      );
      
      if (positionChanges.length > 0) {
        // Calculate deltas for dragged nodes and move their descendants
        const nodesToUpdate = new Map<string, { x: number; y: number }>();
        
        positionChanges.forEach(change => {
          if (change.type === 'position' && change.position && 'id' in change) {
            const nodeId = change.id;
            const oldNode = localNodes.find(n => n.id === nodeId);
            const newNode = updatedNodes.find(n => n.id === nodeId);
            
            if (oldNode && newNode) {
              const deltaX = newNode.position.x - oldNode.position.x;
              const deltaY = newNode.position.y - oldNode.position.y;
              
              if (deltaX !== 0 || deltaY !== 0) {
                // Find all descendants
                const getDescendants = (id: string): string[] => {
                  const children = edges.filter(e => e.source === id).map(e => e.target);
                  return [...children, ...children.flatMap(childId => getDescendants(childId))];
                };
                
                const descendants = getDescendants(nodeId);
                descendants.forEach(descId => {
                  const descNode = updatedNodes.find(n => n.id === descId);
                  if (descNode) {
                    nodesToUpdate.set(descId, {
                      x: descNode.position.x + deltaX,
                      y: descNode.position.y + deltaY,
                    });
                  }
                });
              }
            }
          }
        });
        
        // Apply descendant position updates to local state only (don't sync to store yet)
        if (nodesToUpdate.size > 0) {
          const finalNodes = updatedNodes.map(node => {
            const newPos = nodesToUpdate.get(node.id);
            if (newPos) {
              return { ...node, position: newPos };
            }
            return node;
          });
          setLocalNodes(finalNodes);
          return; // Early return - don't sync to store during drag
        }
        
        // If we're here, we're dragging but no children to update - still only update local
        setLocalNodes(updatedNodes);
        return; // Early return - don't sync to store during drag
      }
      
      // Update local nodes for all other changes
      setLocalNodes(updatedNodes);
      
      // For non-position changes (selection, etc.), also update store immediately
      const hasNonPositionChanges = changes.some(c => c.type !== 'position');
      if (hasNonPositionChanges) {
        setStoreNodes(updatedNodes);
      }
      
      // For position changes that are NOT dragging (e.g., programmatic position changes),
      // also sync to store
      const hasNonDraggingPositionChanges = changes.some(
        c => c.type === 'position' && !('dragging' in c && c.dragging)
      );
      if (hasNonDraggingPositionChanges) {
        setStoreNodes(updatedNodes);
      }
    },
    [localNodes, edges, setStoreNodes]
  );
  
  // Sync to store when drag stops
  const onNodeDragStop: NodeDragHandler = useCallback(
    () => {
      // Update store with final positions
      setStoreNodes(localNodes);
    },
    [localNodes, setStoreNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (_changes) => {
      setEdges(edges);
    },
    [edges, setEdges]
  );

  return (
    <div style={{ width: '100%', height: `calc(100vh - 64px - ${PINBOARD_HEIGHT}px)`, backgroundColor: colors.neutral.gray50 }}>
      <style>
        {`
          /* Custom cursor using SVG files from public folder */
          .react-flow__node {
            cursor: url('/open_cursor_drag.svg') 12 12, grab !important;
          }
          .react-flow__node:active,
          .react-flow__node.dragging {
            cursor: url('/closed_cursor_drag.svg') 12 12, grabbing !important;
          }
        `}
      </style>
      <ReactFlow
        nodes={localNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeDragThreshold={5}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { 
            stroke: colors.edge, 
            strokeWidth: 2.5,
            strokeLinecap: 'round',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color={colors.edge} 
          gap={16} 
          size={1}
        />
        <Controls />
        <MiniMap
          nodeColor={() => colors.secondary.blue}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border-2 !border-gray-200"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphView;

