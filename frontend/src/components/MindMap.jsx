import { useState } from 'react';

const DEPTH_STYLES = [
  { bg: 'linear-gradient(135deg, #5b21b6, #7c3aed)', text: 'text-white', size: 'text-base font-black px-5 py-2.5' },
  { bg: 'linear-gradient(135deg, #0369a1, #0891b2)', text: 'text-white', size: 'text-sm font-bold px-4 py-2' },
  { bg: 'linear-gradient(135deg, #047857, #059669)', text: 'text-white', size: 'text-xs font-semibold px-3 py-1.5' },
  { bg: 'linear-gradient(135deg, #b45309, #d97706)', text: 'text-white', size: 'text-xs font-semibold px-3 py-1.5' },
];

function MindNode({ node, depth = 0, isLast = false }) {
  const [expanded, setExpanded] = useState(true);
  const style = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)];
  const hasChildren = node.subtopics && node.subtopics.length > 0;

  return (
    <div className={`flex ${depth === 0 ? 'flex-col items-center' : 'flex-row items-start gap-0'}`}>
      {depth === 0 ? (
        /* Root node — centered, large */
        <div className="flex flex-col items-center">
          <div
            className={`rounded-2xl shadow-lg ${style.size} ${style.text} cursor-default`}
            style={{ background: style.bg }}
          >
            {node.topic}
          </div>
          {hasChildren && (
            <>
              <div className="w-0.5 h-5 bg-ink-300" />
              <div className="flex gap-8 flex-wrap justify-center relative">
                {node.subtopics.map((child, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-ink-300" />
                    <MindNode node={child} depth={depth + 1} isLast={i === node.subtopics.length - 1} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Non-root: indented tree layout */
        <div className="flex flex-col items-start">
          <button
            onClick={() => hasChildren && setExpanded(e => !e)}
            className={`rounded-xl shadow-sm ${style.size} ${style.text} flex items-center gap-1.5 ${
              hasChildren ? 'cursor-pointer hover:opacity-90 transition-opacity' : 'cursor-default'
            }`}
            style={{ background: style.bg }}
          >
            {hasChildren && (
              <span className={`text-xs opacity-80 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
            )}
            {node.topic}
          </button>
          {hasChildren && expanded && (
            <div className="ml-4 mt-2 border-l-2 border-ink-200 pl-4 space-y-2">
              {node.subtopics.map((child, i) => (
                <MindNode key={i} node={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MindMap({ mindmap }) {
  const [layout, setLayout] = useState('tree');

  if (!mindmap) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-ink-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🗺️</div>
        <p className="text-ink-400 text-sm">No mind map available.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Layout toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1 bg-ink-100 rounded-xl p-1">
          {[{ id: 'radial', label: '🌐 Radial' }, { id: 'tree', label: '🌳 Tree' }].map(l => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layout === l.id ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto">
        {layout === 'radial' ? (
          <div className="min-w-max mx-auto py-4">
            <RadialMap mindmap={mindmap} />
          </div>
        ) : (
          <div className="max-w-2xl">
            <TreeMap mindmap={mindmap} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Radial layout (original centred bubble style) ── */
function RadialMap({ mindmap }) {
  const colors = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#e11d48', '#6366f1', '#0d9488'];

  const renderNode = (node, depth = 0, colorIndex = 0) => {
    const color = colors[colorIndex % colors.length];
    return (
      <div key={node.topic} className={`flex flex-col items-center ${depth > 0 ? 'mt-1' : ''}`}>
        <div
          className="px-4 py-2 rounded-full text-white font-semibold shadow-md whitespace-nowrap"
          style={{ background: color, fontSize: depth === 0 ? '1rem' : depth === 1 ? '0.8rem' : '0.72rem' }}
        >
          {node.topic}
        </div>
        {node.subtopics && node.subtopics.length > 0 && (
          <div className="flex gap-4 mt-3 flex-wrap justify-center">
            <div className="absolute top-0 left-1/2 w-px h-3 bg-ink-300" style={{ transform: 'translateX(-50%)' }} />
            {node.subtopics.map((sub, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-3 bg-ink-300" />
                {renderNode(sub, depth + 1, (colorIndex + i + 1) % colors.length)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return <div className="p-4">{renderNode(mindmap)}</div>;
}

/* ── Tree layout (indented, collapsible) ── */
function TreeMap({ mindmap }) {
  return (
    <div className="p-2">
      <MindNode node={mindmap} depth={0} />
    </div>
  );
}
