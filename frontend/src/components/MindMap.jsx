export default function MindMap({ mindmap }) {
  if (!mindmap) return <div className="text-gray-500 text-center py-8">No mind map available.</div>;

  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const renderNode = (node, depth = 0, index = 0) => {
    const color = colors[index % colors.length];
    return (
      <div key={node.topic} className={`flex flex-col items-center ${depth > 0 ? 'mt-2' : ''}`}>
        <div
          className="px-4 py-2 rounded-full text-white font-semibold text-sm shadow-md whitespace-nowrap"
          style={{ backgroundColor: color, fontSize: depth === 0 ? '1rem' : '0.8rem' }}
        >
          {node.topic}
        </div>
        {node.subtopics && node.subtopics.length > 0 && (
          <div className="flex gap-4 mt-3 flex-wrap justify-center relative">
            <div className="absolute top-0 left-1/2 w-px h-3 bg-gray-300" style={{ transform: 'translateX(-50%)' }} />
            {node.subtopics.map((sub, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-3 bg-gray-300" />
                {renderNode(sub, depth + 1, (index + i + 1) % colors.length)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-auto p-4">
      <div className="min-w-max mx-auto">
        {renderNode(mindmap, 0, 0)}
      </div>
    </div>
  );
}
