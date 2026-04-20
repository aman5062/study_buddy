import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Flashcards from '../components/Flashcards';
import MindMap from '../components/MindMap';
import Chatbot from '../components/Chatbot';
import { getDocument } from '../services/api';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'qa', label: 'Q&A' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'mindmap', label: 'Mind Map' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'examples', label: 'Examples' },
  { id: 'mistakes', label: 'Mistakes' },
  { id: 'predictions', label: 'Exam Prep' },
];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
}

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getDocument(id)
      .then((response) => {
        if (!active) return;
        setDoc(response.data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        navigate(-1);
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  const counts = useMemo(() => ({
    qa: toArray(doc?.qa).length,
    flashcards: toArray(doc?.flashcards).length,
    formulas: toArray(doc?.formulas).length,
    examples: toArray(doc?.real_world_examples).length,
    mistakes: toArray(doc?.common_mistakes).length,
    predictions: toArray(doc?.predictions).length,
  }), [doc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          <p className="text-sm font-medium text-slate-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const dataTabs = {
    summary: <SummarySection summary={doc.summary} />,
    qa: <QASection qa={toArray(doc.qa)} />,
    flashcards: <Flashcards flashcards={toArray(doc.flashcards)} />,
    mindmap: <MindMap mindmap={doc.mindmap} />,
    formulas: <FormulaSection formulas={toArray(doc.formulas)} />,
    examples: <ExampleSection examples={toArray(doc.real_world_examples)} />,
    mistakes: <MistakesSection mistakes={toArray(doc.common_mistakes)} />,
    predictions: <PredictionSection predictions={toArray(doc.predictions)} />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            <span aria-hidden="true">←</span>
            Back to dashboard
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {doc.status || 'ready'}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{doc.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{formatDate(doc.created_at)}</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                <span>{doc.filename}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Q&A" value={counts.qa} />
              <MetricCard label="Flashcards" value={counts.flashcards} />
              <MetricCard label="Formulas" value={counts.formulas} />
              <MetricCard label="Examples" value={counts.examples} />
              <MetricCard label="Mistakes" value={counts.mistakes} />
              <MetricCard label="Predictions" value={counts.predictions} />
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  tab === item.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {doc.status === 'processing' && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This document is still processing. The content will update automatically once the AI summary is ready.
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {dataTabs[tab]}
        </div>
      </div>

      <Chatbot documentId={Number.parseInt(id, 10)} />
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function SummarySection({ summary }) {
  const paragraphs = typeof summary === 'string'
    ? summary.split(/\n+/).map((part) => part.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <SectionHeader title="Document Summary" subtitle="A detailed overview of the uploaded material." />
      {paragraphs.length > 0 ? (
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-[15px] leading-8 text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState title="Summary not available" description="The AI processing step has not produced a summary yet." />
      )}
    </div>
  );
}

function QASection({ qa }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div>
      <SectionHeader title="Questions and Answers" subtitle="Use these for quick review and self-testing." count={qa.length} unit="item" />
      {qa.length > 0 ? (
        <div className="space-y-3">
          {qa.map((item, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 bg-slate-50 px-4 py-4 text-left transition-colors hover:bg-slate-100"
              >
                <span className="text-sm font-semibold text-slate-800">{item.question}</span>
                <span className={`text-slate-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {openIndex === index && (
                <div className="border-t border-slate-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Q&A available" description="The document did not generate any question-answer pairs." />
      )}
    </div>
  );
}

function FormulaSection({ formulas }) {
  return (
    <div>
      <SectionHeader title="Key Formulas" subtitle="Core equations and how to use them." count={formulas.length} unit="formula" />
      {formulas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {formulas.map((formula, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{formula.name}</div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-base text-emerald-300">
                {formula.formula}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{formula.description}</p>
              {formula.derivation && (
                <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-slate-400">
                  <span className="font-semibold text-slate-300">Derivation:</span> {formula.derivation}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No formulas available" description="The document did not produce a formula set." />
      )}
    </div>
  );
}

function ExampleSection({ examples }) {
  return (
    <div>
      <SectionHeader title="Real-World Examples" subtitle="Where this topic shows up in practice." count={examples.length} unit="example" />
      {examples.length > 0 ? (
        <div className="space-y-3">
          {examples.map((example, index) => (
            <article key={index} className="rounded-2xl border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
              <h3 className="text-base font-semibold text-slate-900">{example.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{example.description}</p>
              {example.relevantConcepts?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {example.relevantConcepts.map((concept, conceptIndex) => (
                    <span
                      key={conceptIndex}
                      className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No examples available" description="Try uploading a more detailed source document." />
      )}
    </div>
  );
}

function MistakesSection({ mistakes }) {
  return (
    <div>
      <SectionHeader title="Common Mistakes" subtitle="Errors to watch for while studying." count={mistakes.length} unit="mistake" />
      {mistakes.length > 0 ? (
        <div className="space-y-3">
          {mistakes.map((item, index) => (
            <article key={index} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
              <div className="text-sm font-semibold text-rose-700">Mistake: {item.mistake}</div>
              <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm leading-7 text-emerald-700">
                Correct approach: {item.correct}
              </div>
              {item.explanation && (
                <p className="mt-3 text-xs leading-6 text-slate-500">{item.explanation}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No mistakes listed" description="The AI did not generate a mistakes section for this document." />
      )}
    </div>
  );
}

function PredictionSection({ predictions }) {
  const sorted = [...predictions].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  return (
    <div>
      <SectionHeader title="Exam Prep" subtitle="What is most likely to show up on tests." count={sorted.length} unit="topic" />
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((item, index) => (
            <article key={index} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="text-base font-semibold text-slate-900">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    {item.topic}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.reason}</p>
                  {item.chapter && (
                    <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Chapter: {item.chapter}
                    </div>
                  )}
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No exam predictions available" description="Upload a richer source document to generate test guidance." />
      )}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700',
  }[priority] || 'bg-slate-100 text-slate-600';

  const label = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }[priority] || 'Medium';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config}`}>{label}</span>;
}

function SectionHeader({ title, subtitle, count, unit }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {count} {unit}{count === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}
