import { useState } from 'react';

export default function Flashcards({ flashcards }) {
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [view, setView]     = useState('card'); // 'card' | 'list'

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-ink-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🃏</div>
        <p className="text-ink-400 text-sm">No flashcards available.</p>
      </div>
    );
  }

  const card = flashcards[index];
  const prev = () => { setIndex(i => (i - 1 + flashcards.length) % flashcards.length); setFlipped(false); };
  const next = () => { setIndex(i => (i + 1) % flashcards.length); setFlipped(false); };
  const progress = ((index + 1) / flashcards.length) * 100;

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-500">
          Card <span className="font-bold text-ink-800">{index + 1}</span> of{' '}
          <span className="font-bold text-ink-800">{flashcards.length}</span>
        </p>
        <div className="flex items-center gap-1 bg-ink-100 rounded-xl p-1">
          {[{ id: 'card', icon: '🃏', label: 'Cards' }, { id: 'list', icon: '📋', label: 'List' }].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === v.id ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'card' ? (
        <div className="flex flex-col items-center gap-5">
          {/* Progress bar */}
          <div className="w-full max-w-lg bg-ink-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
            />
          </div>

          {/* Card */}
          <div
            className="flashcard w-full max-w-lg h-60 cursor-pointer select-none"
            onClick={() => setFlipped(!flipped)}
          >
            <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
              {/* Front */}
              <div className="flashcard-front w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4f46e5 100%)' }}>
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Term</div>
                <p className="text-white text-xl font-bold text-center leading-snug">{card.term}</p>
                <div className="mt-6 text-white/50 text-xs">Tap to reveal definition</div>
              </div>
              {/* Back */}
              <div className="flashcard-back w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #0284c7 100%)' }}>
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Definition</div>
                <p className="text-white text-base text-center leading-relaxed">{card.definition}</p>
                <div className="mt-6 text-white/50 text-xs">Tap to flip back</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="px-5 py-2 bg-white text-ink-700 rounded-xl font-semibold text-sm card-shadow hover:bg-ink-50 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setFlipped(!flipped)}
              className="px-5 py-2 text-sm font-semibold rounded-xl text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
            >
              Flip
            </button>
            <button
              onClick={next}
              className="px-5 py-2 bg-white text-ink-700 rounded-xl font-semibold text-sm card-shadow hover:bg-ink-50 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Dot navigation */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-sm">
            {flashcards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIndex(i); setFlipped(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === index ? 'bg-brand-600 w-5' : 'bg-ink-300 hover:bg-ink-400'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {flashcards.map((fc, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow overflow-hidden">
              <div className="flex">
                <div className="w-1.5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #7c3aed, #4f46e5)' }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-700 rounded-full text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Term</p>
                        <p className="font-semibold text-ink-800 text-sm">{fc.term}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Definition</p>
                        <p className="text-ink-600 text-sm leading-relaxed">{fc.definition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
