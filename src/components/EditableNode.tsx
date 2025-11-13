import { memo, useState, useRef, useEffect, type FC } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useGraphStore } from '../store/graphStore';
import { calculateNodeProgress } from '../utils/progressCalculation';
import { colors } from '../theme/colors';

const EditableNode: FC<NodeProps> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeLabel = useGraphStore(state => state.updateNodeLabel);
  const toggleNodeCompleted = useGraphStore(state => state.toggleNodeCompleted);
  const addNode = useGraphStore(state => state.addNode);
  const pinNode = useGraphStore(state => state.pinNode);
  const pinnedNodeIds = useGraphStore(state => state.pinnedNodeIds);
  const edges = useGraphStore(state => state.edges);
  const nodes = useGraphStore(state => state.nodes);
  
  // Check if this node has children
  const hasChildren = edges.some(edge => edge.source === id);
  
  // Calculate progress for parent nodes
  const progress = hasChildren ? calculateNodeProgress(id, nodes, edges) : 0;
  
  // Check if this node is pinned
  const isPinned = pinnedNodeIds.includes(id);

  useEffect(() => {
    setLocalLabel(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeLabel(id, localLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalLabel(data.label);
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const childLevel = (data.level + 1) as 1 | 2;
    addNode(id, childLevel);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCompleted(id);
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    pinNode(id);
  };

  const isCompleted = hasChildren && progress === 1;

  const nodeStyle: React.CSSProperties = {
    padding: !hasChildren ? '12px 32px 12px 16px' : '12px 16px', // Extra padding right for leaf nodes (for pin button)
    borderRadius: '12px',
    boxShadow: selected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    outline: isEditing ? `2px solid ${colors.secondary.blue}` : 'none',
    minWidth: '120px',
    maxWidth: '300px',
    transition: 'all 0.3s ease-out',
    backgroundColor: isCompleted ? colors.primary.lighter : colors.neutral.white,
  };

  const canHaveChildren = data.level < 2;
  
  // For progress border animation
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevProgress, setPrevProgress] = useState(progress);
  
  useEffect(() => {
    setAnimatedProgress(progress);
    
    // Trigger celebration when reaching 100%
    if (progress === 1 && prevProgress < 1 && hasChildren) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
    setPrevProgress(progress);
  }, [progress, prevProgress, hasChildren]);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Celebration Particles */}
      {showCelebration && (
        <>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colors.primary.main,
                pointerEvents: 'none',
                animation: `particle-${i} 0.8s ease-out forwards`,
                opacity: 0,
              }}
            />
          ))}
          <style>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const distance = 60 + Math.random() * 20;
              return `
                @keyframes particle-${i} {
                  0% {
                    transform: translate(-50%, -50%) translate(0, 0) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translate(-50%, -50%) translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px) scale(0);
                    opacity: 0;
                  }
                }
              `;
            }).join('')}
          </style>
        </>
      )}

      <div
        style={{
          ...nodeStyle,
          position: 'relative',
          border: hasChildren 
            ? `3px solid ${colors.neutral.gray200}`
            : selected ? `2px solid ${colors.secondary.blue}` : `2px solid ${colors.neutral.gray200}`,
        }}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
      {/* Invisible handles for edges - required by ReactFlow */}
      {data.level > 0 && (
        <Handle 
          type="target" 
          position={Position.Top} 
          style={{ 
            opacity: 0,
            pointerEvents: 'none',
          }} 
        />
      )}

      {/* Pin button for leaf nodes */}
      {!hasChildren && !isPinned && (
        <button
          onClick={handlePinToggle}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '22px',
            height: '22px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: isHovered ? colors.neutral.gray100 : 'transparent',
            color: colors.neutral.gray500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            opacity: isHovered ? 1 : 0,
            transition: 'all 0.2s',
            zIndex: 5,
          }}
          title="Pin to pinboard"
        >
          📌
        </button>
      )}
      
      {/* Pinned indicator */}
      {isPinned && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
          title="Pinned to pinboard"
        >
          📌
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Checkbox for leaf nodes */}
        {!hasChildren && (
          <button
            onClick={handleToggleComplete}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: `2px solid ${colors.neutral.gray400}`,
              backgroundColor: data.completed ? colors.secondary.blue : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {data.completed && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 6L5 9L10 3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        {isEditing ? (
          <textarea
            ref={inputRef}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              outline: 'none',
              resize: 'none',
              fontWeight: '500',
              color: colors.neutral.gray800,
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              minHeight: '1.5rem',
            }}
            rows={Math.max(1, localLabel.split('\n').length)}
          />
        ) : (
          <div style={{ 
            fontWeight: '500', 
            color: colors.neutral.gray800, 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            textDecoration: data.completed ? 'line-through' : 'none',
            opacity: data.completed ? 0.6 : 1,
          }}>
            {localLabel}
          </div>
        )}
      </div>

        {/* Invisible handles for edges - required by ReactFlow */}
        {data.level < 2 && (
          <Handle 
            type="source" 
            position={Position.Bottom} 
            style={{ 
              opacity: 0,
              pointerEvents: 'none',
            }} 
          />
        )}
      </div>

      {/* SVG Progress Border Overlay */}
      {hasChildren && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
            opacity: animatedProgress > 0 ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
          preserveAspectRatio="none"
        >
          {/* Progress border (green) */}
          <rect
            x="1.5"
            y="1.5"
            width="calc(100% - 3px)"
            height="calc(100% - 3px)"
            rx="12"
            ry="12"
            fill="none"
            stroke={colors.secondary.green}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - animatedProgress)}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
            pathLength="1000"
          />
        </svg>
      )}

      {/* Add Child Button */}
      {canHaveChildren && (
        <button
          onClick={handleAddChild}
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: `2px solid ${colors.neutral.gray200}`,
            backgroundColor: colors.neutral.white,
            color: colors.secondary.blue,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease-out, background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.secondary.blue;
            e.currentTarget.style.color = colors.neutral.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.neutral.white;
            e.currentTarget.style.color = colors.secondary.blue;
          }}
        >
          +
        </button>
      )}
    </div>
  );
};

export default memo(EditableNode);

