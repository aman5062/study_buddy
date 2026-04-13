import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import { getDocuments } from '../services/api';

export default function StudentDashboard() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDocuments().then(r => { setDocuments(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) && d.status === 'ready'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Study Materials</h1>
          <p className="text-gray-500 mt-1">AI-processed documents ready for study</p>
        </div>
        <div className="mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search documents..."
            className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{doc.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{new Date(doc.created_at).toLocaleDateString()}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Summary', 'Q&A', 'Flashcards', 'Mind Map', 'Exam Prep'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Study Now →
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">📖</p>
                <p className="text-lg font-medium">No documents available yet.</p>
                <p className="text-sm mt-1">Your teacher will upload study materials here.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
