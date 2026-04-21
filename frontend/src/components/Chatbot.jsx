import { useEffect, useMemo, useRef, useState } from 'react';
import { sendChat } from '../services/api';

const SUGGESTIONS = [
  'Summarize the key points',
  'What are the main concepts?',
  'Create a study plan for this',
  'What might appear in the exam?',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm your Study Buddy AI 🤖\nAsk me anything about this document — I'm here to help you learn!",
};

export default function Chatbot({ documentId, documents = [] }) {
  const readyDocs = useMemo(
    () => (documents || []).filter((doc) => doc.status === 'ready'),
    [documents]
  );

  const [open, setOpen]         = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(documentId ?? readyDocs[0]?.id ?? null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  const activeDocId = documentId ?? selectedDocId;
  const activeDocTitle = useMemo(() => {
    if (!activeDocId) return '';
    const source = Array.isArray(documents) ? documents : readyDocs;
    const found = source.find((doc) => doc.id === activeDocId);
    return found?.title || '';
  }, [activeDocId, documents, readyDocs]);
  const activeDocLabel = activeDocTitle || (activeDocId ? `Document #${activeDocId}` : '');
  const canChat = Boolean(activeDocId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (documentId) {
      setSelectedDocId(documentId);
      return;
    }

    if (readyDocs.length === 0) {
      setSelectedDocId(null);
      return;
    }

    setSelectedDocId((current) =>
      readyDocs.some((doc) => doc.id === current) ? current : readyDocs[0].id
    );
  }, [documentId, readyDocs]);

  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
  }, [activeDocId]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    if (!canChat) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Select a document first so I know what to reference.' },
      ]);
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await sendChat({ message: msg, documentId: activeDocId });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      const fallback = err.response?.data?.error
        ? `Sorry, I ran into an error: ${err.response.data.error}`
        : 'Sorry, I ran into an error. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallback
      }]);
    }
    setLoading(false);
  };

  const showSuggestions = messages.length === 1 && !loading && canChat;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          className="mb-4 bg-white rounded-2xl overflow-hidden flex flex-col"
          style={{
            width: '360px',
            height: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(124,58,237,0.12)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed, #4f46e5)' }}>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-lg">🤖</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-none">Study Buddy AI</p>
              <p className="text-purple-300 text-xs mt-0.5">Powered by Gemini</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
                <span className="text-green-300 text-xs font-medium">Online</span>
              </div>

              {!documentId && (
                readyDocs.length > 0 ? (
                  <select
                    value={selectedDocId ?? ''}
                    onChange={(e) => setSelectedDocId(Number.parseInt(e.target.value, 10) || null)}
                    className="text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {readyDocs.map((doc) => (
                      <option key={doc.id} value={doc.id} className="text-slate-900">
                        {doc.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-amber-100 text-xs font-medium whitespace-nowrap">
                    Upload a document to chat
                  </span>
                )
              )}

              {documentId && activeDocLabel && (
                <span className="text-white/80 text-xs font-semibold truncate max-w-[140px]" title={activeDocLabel}>
                  {activeDocLabel}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center text-white text-xs transition-colors">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white text-ink-800 shadow-sm rounded-tl-sm border border-ink-100'
                  }`}
                  style={m.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
                >
                  {m.role === 'assistant' ? <StructuredMessage content={m.content} /> : m.content}
                </div>
              </div>
            ))}

            {/* Suggestion chips */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 text-xs font-medium rounded-xl hover:bg-brand-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  🤖
                </div>
                <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-ink-100 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-ink-100 bg-white flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={canChat ? 'Ask a question…' : 'Select a document to start'}
              disabled={!canChat}
              className="flex-1 px-3.5 py-2 border-2 border-ink-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:border-brand-500 transition-colors disabled:bg-ink-50 disabled:text-ink-300"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim() || !canChat}
              className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full text-white flex items-center justify-center text-2xl shadow-xl hover:scale-105 transition-transform"
        style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}

function StructuredMessage({ content }) {
  const lines = String(content || '').split('\n');

  return (
    <div className="space-y-2 whitespace-normal">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        if (trimmed.startsWith('## ')) {
          return (
            <div key={index} className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-brand-700">
              {trimmed.slice(3)}
            </div>
          );
        }

        if (trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex gap-2 text-sm leading-6 text-ink-700">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const [number, ...rest] = trimmed.split('.');
          return (
            <div key={index} className="flex gap-2 text-sm leading-6 text-ink-700">
              <span className="font-semibold text-brand-700">{number}.</span>
              <span>{rest.join('.').trim()}</span>
            </div>
          );
        }

        return (
          <p key={index} className="text-sm leading-6 text-ink-700">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
