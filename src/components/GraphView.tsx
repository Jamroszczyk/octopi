import { useCallback, useEffect, type FC } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeDragHandler,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import EditableNode from './EditableNode';
import { useGraphStore } from '../store/graphStore';
import { colors } from '../theme/colors';

// Move nodeTypes outside component to prevent recreation
const nodeTypes = { editableNode: EditableNode };

const GraphView: FC = () => {
  const { fitView } = useReactFlow();
  const { nodes, edges, setNodes, setEdges, deleteNode } = useGraphStore();

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400, includeHiddenNodes: false });
      }, 100);
    }
  }, [nodes.length, fitView]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected node on Backspace or Delete
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Check if we're editing a node (textarea is focused)
        const isEditingNode = document.activeElement?.tagName === 'TEXTAREA';
        
        // Only handle deletion if we're NOT editing
        if (!isEditingNode) {
          const selectedNode = nodes.find(n => n.selected);
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
  }, [nodes, deleteNode]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Handle position changes
      const positionChanges = changes.filter(change => change.type === 'position');
      const selectChanges = changes.filter(change => change.type === 'select');
      
      if (positionChanges.length > 0) {
        const updatedNodes = nodes.map(node => {
          const change = positionChanges.find(c => 'id' in c && c.id === node.id);
          if (change && change.type === 'position' && change.position) {
            return { ...node, position: change.position };
          }
          return node;
        });
        setNodes(updatedNodes);
      }
      
      if (selectChanges.length > 0) {
        const updatedNodes = nodes.map(node => {
          const change = selectChanges.find(c => 'id' in c && c.id === node.id);
          if (change && change.type === 'select') {
            return { ...node, selected: change.selected };
          }
          return node;
        });
        setNodes(updatedNodes);
      }
    },
    [nodes, setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (_changes) => {
      setEdges(edges);
    },
    [edges, setEdges]
  );

  const onNodeDrag: NodeDragHandler = useCallback(
    (_event, node, _nodes) => {
      // Get all descendant IDs
      const getDescendants = (nodeId: string): string[] => {
        const childIds = edges.filter(e => e.source === nodeId).map(e => e.target);
        return [...childIds, ...childIds.flatMap(id => getDescendants(id))];
      };

      const descendantIds = getDescendants(node.id);
      
      // Find the original node to calculate delta
      const originalNode = nodes.find(n => n.id === node.id);
      if (!originalNode) return;

      const deltaX = node.position.x - originalNode.position.x;
      const deltaY = node.position.y - originalNode.position.y;

      // Update positions of all descendants
      if (descendantIds.length > 0 && (deltaX !== 0 || deltaY !== 0)) {
        const updatedNodes = nodes.map(n => {
          if (n.id === node.id) {
            return { ...n, position: node.position };
          }
          if (descendantIds.includes(n.id)) {
            return {
              ...n,
              position: {
                x: n.position.x + deltaX,
                y: n.position.y + deltaY,
              },
            };
          }
          return n;
        });
        setNodes(updatedNodes);
      }
    },
    [nodes, edges, setNodes]
  );

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px - 120px)', backgroundColor: colors.neutral.gray50 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeClick={onNodeClick}
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

