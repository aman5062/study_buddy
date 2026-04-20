import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const FEATURES = [
  { icon: '🧠', title: 'AI-Powered Summaries', desc: 'Instant document summaries powered by Gemini AI' },
  { icon: '🃏', title: 'Smart Flashcards', desc: 'Auto-generated flashcards for efficient memorization' },
  { icon: '🗺️', title: 'Visual Mind Maps', desc: 'See concepts connected in an interactive mind map' },
  { icon: '🎯', title: 'Exam Predictions', desc: 'Know what topics are most likely to appear in exams' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #4c1d95 0%, #5b21b6 40%, #1d4ed8 100%)' }}>
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern opacity-20" />

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">
              🎓
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Study Buddy</span>
          </div>
          <p className="text-purple-200 text-sm font-medium pl-1">Your AI-powered study companion</p>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Study smarter,<br />
            <span className="text-amber-300">not harder.</span>
          </h1>
          <p className="text-purple-200 text-lg leading-relaxed max-w-sm">
            Upload any educational document and let AI transform it into complete study materials — instantly.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 grid grid-cols-1 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-3">
              <span className="text-xl mt-0.5">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-purple-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-ink-50">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🎓</div>
            <h1 className="text-3xl font-black text-ink-900">Study Buddy</h1>
            <p className="text-ink-500 text-sm mt-1">AI-powered learning platform</p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-ink-900 mb-1">Welcome back</h2>
            <p className="text-ink-500 text-sm mb-8">Sign in to access your study materials</p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 transition-colors bg-white text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 transition-colors bg-white text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-xl">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">Demo Credentials</p>
              <div className="text-sm text-ink-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">👩‍🏫</span>
                  <div>
                    <span className="font-semibold">Teacher:</span>{' '}
                    <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-brand-200 text-brand-700">teacher@demo.com</code>
                    {' / '}
                    <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-brand-200 text-brand-700">teacher123</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">👨‍🎓</span>
                  <span className="text-ink-500 text-xs">Students are created by the teacher</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
