import { useState } from 'react';

const NODE_STYLES = [
  {
    container: 'bg-slate-900 text-white',
    accent: 'border-slate-700',
    subtitle: 'text-slate-300',
  },
  {
    container: 'bg-indigo-700 text-white',
    accent: 'border-indigo-500',
    subtitle: 'text-indigo-100',
  },
  {
    container: 'bg-violet-600 text-white',
    accent: 'border-violet-400',
    subtitle: 'text-violet-100',
  },
  {
    container: 'bg-emerald-600 text-white',
    accent: 'border-emerald-400',
    subtitle: 'text-emerald-100',
  },
];

function toNode(node) {
  if (!node || typeof node !== 'object') return null;
  if (typeof node.topic !== 'string' || !node.topic.trim()) return null;
  return {
    ...node,
    topic: node.topic.trim(),
    description: typeof node.description === 'string' ? node.description.trim() : '',
    subtopics: Array.isArray(node.subtopics) ? node.subtopics.map(toNode).filter(Boolean) : [],
  };
}

export default function MindMap({ mindmap }) {
  const root = toNode(mindmap);

  if (!root) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        No mind map available.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mind map</div>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">{root.topic}</h3>
        {root.description && <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{root.description}</p>}
      </div>

      <div className="overflow-auto rounded-3xl border border-slate-200 bg-white p-5">
        <MindNode node={root} depth={0} />
      </div>
    </div>
  );
}

function MindNode({ node, depth }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.subtopics.length > 0;
  const style = NODE_STYLES[Math.min(depth, NODE_STYLES.length - 1)];

  return (
    <div className={`flex flex-col ${depth === 0 ? 'items-start' : 'pl-6'}`}>
      <button
        type="button"
        onClick={() => hasChildren && setExpanded((value) => !value)}
        className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all hover:shadow-md ${
          style.container
        } ${style.accent} ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold leading-6">{node.topic}</div>
            {node.description && (
              <div className={`mt-2 text-xs leading-6 ${style.subtitle}`}>{node.description}</div>
            )}
          </div>
          {hasChildren && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
              {expanded ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
      </button>

      {hasChildren && expanded && (
        <div className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
          {node.subtopics.map((child, index) => (
            <MindNode key={`${node.topic}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
