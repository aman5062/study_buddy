import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import { getDocuments } from '../services/api';

const STUDY_FEATURES = ['Summary', 'Q&A', 'Flashcards', 'Mind Map', 'Exam Prep'];

const FEATURE_COLORS = [
  'bg-brand-50 text-brand-700',
  'bg-teal-50 text-teal-700',
  'bg-amber-50 text-amber-700',
  'bg-indigo-50 text-indigo-700',
  'bg-rose-50 text-rose-700',
];

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 17;

export default function StudentDashboard() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    getDocuments()
      .then(r => { setDocuments(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = documents.filter(
    d => d.title.toLowerCase().includes(search.toLowerCase()) && d.status === 'ready'
  );
  const readyDocs = documents.filter(d => d.status === 'ready');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < MORNING_END_HOUR) return 'Good morning';
    if (h < AFTERNOON_END_HOUR) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        {/* ── Welcome banner ── */}
        <div className="relative rounded-2xl overflow-hidden mb-8 p-8"
          style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 45%, #1d4ed8 100%)' }}>
          <div className="absolute inset-0 dot-pattern opacity-15" />
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-purple-300 font-medium text-sm mb-1">{greeting()},</p>
              <h1 className="text-3xl font-black text-white mb-2">{user?.name || 'Student'} 👋</h1>
              <p className="text-purple-200 text-sm max-w-md">
                {filtered.length > 0
                  ? `You have ${filtered.length} study material${filtered.length === 1 ? '' : 's'} ready. Let's get studying!`
                  : 'Your study materials will appear here once your teacher uploads documents.'}
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-60 select-none">📚</div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Materials Ready', value: filtered.length, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Flashcard Decks', value: filtered.length, icon: '🃏', color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Mind Maps', value: filtered.length, icon: '🗺️', color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Exam Preps', value: filtered.length, icon: '🎯', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 card-shadow">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-base mb-3`}>
                {s.icon}
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-ink-500 text-xs mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials…"
              className="w-full pl-9 pr-4 py-2.5 border-2 border-ink-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:border-brand-500 bg-white transition-colors"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="text-xs text-ink-400 hover:text-ink-600 transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* ── Documents grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 card-shadow animate-pulse">
                <div className="h-4 bg-ink-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-ink-100 rounded w-1/2 mb-6" />
                <div className="h-8 bg-ink-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {filtered.map(doc => (
              <DocCard key={doc.id} doc={doc} onStudy={() => navigate(`/documents/${doc.id}`)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-20">
                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📖</div>
                <h3 className="text-xl font-bold text-ink-700 mb-2">
                  {search ? 'No results found' : 'No materials yet'}
                </h3>
                <p className="text-ink-400 text-sm">
                  {search
                    ? `No documents match "${search}"`
                    : 'Your teacher will upload study materials that appear here.'}
                </p>
                {search && (
                  <button onClick={() => setSearch('')}
                    className="mt-3 text-brand-600 text-sm font-medium hover:text-brand-800 transition-colors">
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Chatbot documents={readyDocs} />
    </div>
  );
}

function DocCard({ doc, onStudy }) {
  return (
    <div className="bg-white rounded-2xl card-shadow card-shadow-hover transition-all group flex flex-col overflow-hidden">
      {/* Color header strip */}
      <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            📄
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-ink-900 leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
              {doc.title}
            </h3>
            <p className="text-xs text-ink-400 mt-1">
              {new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {STUDY_FEATURES.map((tag, i) => (
            <span key={tag} className={`px-2 py-0.5 text-xs font-medium rounded-full ${FEATURE_COLORS[i]}`}>
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onStudy}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          Study Now →
        </button>
      </div>
    </div>
  );
}
