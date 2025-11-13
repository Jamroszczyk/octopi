import { type FC } from 'react';
import { useGraphStore } from '../store/graphStore';
import { colors } from '../theme/colors';

const Topbar: FC = () => {
  const { addNode, saveToJSON, loadFromJSON } = useGraphStore();

  const handleAddRootNode = () => {
    addNode(undefined, 0);
  };

  const handleSave = () => {
    const json = saveToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beetroot-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          loadFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: colors.neutral.white,
      borderBottom: `2px solid ${colors.neutral.gray200}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 1000,
    }}>
      {/* Left: Logo + App Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/octopus_logo.svg" 
          alt="Krakel Logo" 
          style={{ 
            width: '36px', 
            height: '36px',
          }} 
        />
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: colors.neutral.gray900,
          margin: 0,
        }}>
          Krakel
        </h1>
      </div>

      {/* Center: Add Root Task Button */}
      <button
        onClick={handleAddRootNode}
        style={{
          padding: '10px 20px',
          backgroundColor: colors.primary.light,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary.main}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary.light}
      >
        <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Root Task
      </button>

      {/* Right: File Operations */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.neutral.gray100,
            color: colors.neutral.gray700,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral.gray200}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.neutral.gray100}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </button>

        <button
          onClick={handleLoad}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.neutral.gray100,
            color: colors.neutral.gray700,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral.gray200}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.neutral.gray100}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load
        </button>
      </div>
    </div>
  );
};

export default Topbar;

