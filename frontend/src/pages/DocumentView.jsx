import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Flashcards from '../components/Flashcards';
import MindMap from '../components/MindMap';
import Chatbot from '../components/Chatbot';
import { getDocument } from '../services/api';

const TABS = [
  { id: 'summary',     label: 'Summary',      icon: '📋' },
  { id: 'qa',          label: 'Q & A',        icon: '❓' },
  { id: 'flashcards',  label: 'Flashcards',   icon: '🃏' },
  { id: 'mindmap',     label: 'Mind Map',     icon: '🗺️' },
  { id: 'predictions', label: 'Exam Prep',    icon: '🎯' },
];

export default function DocumentView() {
  const { id } = useParams();
  const [doc, setDoc]       = useState(null);
  const [tab, setTab]       = useState('summary');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDocument(id)
      .then(r => { setDoc(r.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate(-1); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-400 font-medium">Loading document…</p>
        </div>
      </div>
    );
  }
  if (!doc) return null;

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      {/* ── Document header ── */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-4 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to dashboard
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              📄
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink-900 leading-tight">{doc.title}</h1>
              <p className="text-ink-400 text-sm mt-1">
                AI-processed •{' '}
                {new Date(doc.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800 hover:border-ink-300'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
        {tab === 'summary' && <SummaryTab doc={doc} />}
        {tab === 'qa'      && <QATab doc={doc} />}
        {tab === 'flashcards' && (
          <div>
            <SectionHeader icon="🃏" title="Flashcards" count={doc.flashcards?.length} unit="card" />
            <Flashcards flashcards={doc.flashcards} />
          </div>
        )}
        {tab === 'mindmap' && (
          <div>
            <SectionHeader icon="🗺️" title="Mind Map" />
            <div className="bg-white rounded-2xl card-shadow p-6 overflow-auto">
              <MindMap mindmap={doc.mindmap} />
            </div>
          </div>
        )}
        {tab === 'predictions' && <PredictionsTab doc={doc} />}
      </div>

      <Chatbot documentId={parseInt(id)} />
    </div>
  );
}

/* ── Section header helper ── */
function SectionHeader({ icon, title, count, unit }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-xl">{icon}</span>
      <h2 className="text-xl font-black text-ink-900">{title}</h2>
      {count !== undefined && (
        <span className="ml-auto text-xs font-bold bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
          {count} {unit}{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

/* ── Summary tab ── */
function SummaryTab({ doc }) {
  if (!doc.summary) {
    return <EmptyState icon="📋" message="Summary not available for this document." />;
  }
  const paragraphs = doc.summary.split(/\n+/).filter(p => p.trim());
  return (
    <div>
      <SectionHeader icon="📋" title="Document Summary" />
      <div className="bg-white rounded-2xl card-shadow p-8 space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-ink-700 leading-relaxed text-[15px]">{para}</p>
        ))}
      </div>
    </div>
  );
}

/* ── Q&A tab ── */
function QATab({ doc }) {
  if (!doc.qa || doc.qa.length === 0) {
    return <EmptyState icon="❓" message="No Q&A pairs available for this document." />;
  }
  return (
    <div>
      <SectionHeader icon="❓" title="Questions & Answers" count={doc.qa.length} unit="question" />
      <div className="space-y-3">
        {doc.qa.map((item, i) => <QAItem key={i} item={item} index={i} />)}
      </div>
    </div>
  );
}

function QAItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl card-shadow overflow-hidden transition-all ${open ? 'ring-2 ring-brand-200' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-ink-50 transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-black flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <span className="flex-1 font-semibold text-ink-800 text-sm leading-snug">{item.question}</span>
        <span className={`flex-shrink-0 text-ink-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <div className="ml-9 pl-3 border-l-2 border-brand-200 text-sm text-ink-600 leading-relaxed">
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Predictions tab ── */
function PredictionsTab({ doc }) {
  if (!doc.predictions || doc.predictions.length === 0) {
    return <EmptyState icon="🎯" message="No exam predictions available for this document." />;
  }
  const sorted = [...doc.predictions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  });
  return (
    <div>
      <SectionHeader icon="🎯" title="Exam Predictions" count={doc.predictions.length} unit="topic" />
      <div className="space-y-3">
        {sorted.map((pred, i) => <PredCard key={i} pred={pred} />)}
      </div>
    </div>
  );
}

const PRIORITY_CONFIG = {
  high:   { border: 'border-l-red-500',   bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    label: '🔴 High' },
  medium: { border: 'border-l-amber-500', bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700', label: '🟡 Medium' },
  low:    { border: 'border-l-green-500', bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700', label: '🟢 Low' },
};

function PredCard({ pred }) {
  const cfg = PRIORITY_CONFIG[pred.priority] || PRIORITY_CONFIG.medium;
  return (
    <div className={`bg-white rounded-2xl card-shadow border-l-4 ${cfg.border} overflow-hidden`}>
      <div className={`px-5 py-4 ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-bold text-ink-800 text-sm">{pred.topic}</p>
            <p className="text-ink-600 text-sm mt-1 leading-relaxed">{pred.reason}</p>
          </div>
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ icon, message }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
        {icon}
      </div>
      <p className="text-ink-500 text-sm">{message}</p>
    </div>
  );
}
