import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Flashcards from '../components/Flashcards';
import MindMap from '../components/MindMap';
import Chatbot from '../components/Chatbot';
import { getDocument } from '../services/api';

export default function DocumentView() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDocument(id).then(r => { setDoc(r.data); setLoading(false); }).catch(() => { setLoading(false); navigate(-1); });
  }, [id]);

  const tabs = [
    { id: 'summary', label: '📋 Summary' },
    { id: 'qa', label: '❓ Q&A' },
    { id: 'flashcards', label: '🃏 Flashcards' },
    { id: 'mindmap', label: '🧠 Mind Map' },
    { id: 'predictions', label: '🎯 Exam Prep' },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading document...</div></div>;
  if (!doc) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{doc.title}</h1>
        
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {tab === 'summary' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Document Summary</h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {doc.summary || 'Summary not available.'}
              </div>
            </div>
          )}

          {tab === 'qa' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Questions & Answers</h2>
              <div className="space-y-3">
                {(doc.qa || []).map((item, i) => (
                  <QAItem key={i} item={item} />
                ))}
                {(!doc.qa || doc.qa.length === 0) && <p className="text-gray-400">No Q&A available.</p>}
              </div>
            </div>
          )}

          {tab === 'flashcards' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Flashcards</h2>
              <Flashcards flashcards={doc.flashcards} />
            </div>
          )}

          {tab === 'mindmap' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Mind Map</h2>
              <MindMap mindmap={doc.mindmap} />
            </div>
          )}

          {tab === 'predictions' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Exam Predictions</h2>
              <div className="space-y-3">
                {(doc.predictions || []).map((pred, i) => (
                  <PredCard key={i} pred={pred} />
                ))}
                {(!doc.predictions || doc.predictions.length === 0) && <p className="text-gray-400">No predictions available.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <Chatbot documentId={parseInt(id)} />
    </div>
  );
}

function QAItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 text-sm">{item.question}</span>
        <span className="text-gray-400 ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-600 bg-white border-t border-gray-100">
          {item.answer}
        </div>
      )}
    </div>
  );
}

function PredCard({ pred }) {
  const colors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50',
  };
  const badgeColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[pred.priority] || colors.medium}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{pred.topic}</p>
          <p className="text-sm text-gray-600 mt-1">{pred.reason}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 ${badgeColors[pred.priority] || badgeColors.medium}`}>
          {pred.priority}
        </span>
      </div>
    </div>
  );
}
