import { useState } from 'react';

export default function Flashcards({ flashcards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <div className="text-gray-500 text-center py-8">No flashcards available.</div>;
  }

  const card = flashcards[index];

  const prev = () => { setIndex((i) => (i - 1 + flashcards.length) % flashcards.length); setFlipped(false); };
  const next = () => { setIndex((i) => (i + 1) % flashcards.length); setFlipped(false); };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-gray-500">{index + 1} / {flashcards.length} — Click card to flip</p>
      <div className="flashcard w-full max-w-lg h-56 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center p-8 shadow-lg">
            <p className="text-white text-xl font-semibold text-center">{card.term}</p>
          </div>
          <div className="flashcard-back w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center p-8 shadow-lg">
            <p className="text-white text-base text-center">{card.definition}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={prev} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">← Prev</button>
        <button onClick={next} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Next →</button>
      </div>
      <div className="flex gap-1">
        {flashcards.map((_, i) => (
          <button key={i} onClick={() => { setIndex(i); setFlipped(false); }}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-purple-600' : 'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  );
}
