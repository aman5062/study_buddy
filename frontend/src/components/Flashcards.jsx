import { useState } from 'react';

const CATEGORY_STYLES = {
  Theory: { gradient: 'from-slate-800 via-slate-700 to-slate-900', badge: 'bg-slate-100 text-slate-700' },
  Formula: { gradient: 'from-emerald-600 via-teal-600 to-cyan-600', badge: 'bg-emerald-100 text-emerald-700' },
  Practical: { gradient: 'from-orange-600 via-amber-600 to-red-600', badge: 'bg-orange-100 text-orange-700' },
  Example: { gradient: 'from-indigo-600 via-violet-600 to-purple-600', badge: 'bg-indigo-100 text-indigo-700' },
  default: { gradient: 'from-slate-700 via-slate-600 to-slate-800', badge: 'bg-slate-100 text-slate-700' },
};

function toCards(flashcards) {
  return Array.isArray(flashcards) ? flashcards : [];
}

export default function Flashcards({ flashcards }) {
  const cards = toCards(flashcards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [view, setView] = useState('card');

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        No flashcards available.
      </div>
    );
  }

  const card = cards[index];
  const style = CATEGORY_STYLES[card.category] || CATEGORY_STYLES.default;

  const goTo = (nextIndex) => {
    setIndex(nextIndex);
    setFlipped(false);
  };

  const next = () => goTo((index + 1) % cards.length);
  const previous = () => goTo((index - 1 + cards.length) % cards.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-500">
          Card <span className="font-semibold text-slate-900">{index + 1}</span> of{' '}
          <span className="font-semibold text-slate-900">{cards.length}</span>
        </div>

        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          {['card', 'list'].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                view === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode === 'card' ? 'Card View' : 'List View'}
            </button>
          ))}
        </div>
      </div>

      {view === 'card' ? (
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-3xl">
            <div className="mb-3 h-1 rounded-full bg-slate-100">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300"
                style={{ width: `${((index + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flashcard w-full max-w-3xl cursor-pointer" onClick={() => setFlipped((value) => !value)}>
            <div className={`flashcard-inner h-[20rem] w-full ${flipped ? 'flipped' : ''}`}>
              <div
                className={`flashcard-front absolute inset-0 rounded-3xl bg-gradient-to-br ${style.gradient} p-8 shadow-2xl`}
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                    Term
                  </div>
                  <h3 className="text-2xl font-bold leading-relaxed text-white">{card.term}</h3>
                  {card.category && (
                    <span className={`mt-6 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                      {card.category}
                    </span>
                  )}
                  <div className="mt-6 text-xs text-white/50">Click to reveal the definition</div>
                </div>
              </div>

              <div className="flashcard-back absolute inset-0 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Definition
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{card.term}</h3>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{card.definition}</p>
                  {card.category && (
                    <span className={`mt-6 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                      {card.category}
                    </span>
                  )}
                  <div className="mt-6 text-xs text-slate-400">Click again to go back to the term</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={previous}
              className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Previous
            </button>
            <button
              onClick={() => setFlipped((value) => !value)}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Flip
            </button>
            <button
              onClick={next}
              className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Next
            </button>
          </div>

          <div className="flex max-w-2xl flex-wrap justify-center gap-2">
            {cards.map((_, cardIndex) => (
              <button
                key={cardIndex}
                onClick={() => goTo(cardIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  cardIndex === index ? 'w-6 bg-indigo-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to flashcard ${cardIndex + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((flashcard, cardIndex) => {
            const itemStyle = CATEGORY_STYLES[flashcard.category] || CATEGORY_STYLES.default;
            return (
              <article key={cardIndex} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Flashcard {cardIndex + 1}
                  </div>
                  {flashcard.category && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${itemStyle.badge}`}>
                      {flashcard.category}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{flashcard.term}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{flashcard.definition}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
