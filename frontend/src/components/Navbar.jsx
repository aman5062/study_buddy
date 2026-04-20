import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isTeacher = user?.role === 'teacher';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink-200" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
      {/* Brand accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #0891b2)' }} />

      <div className="px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate(isTeacher ? '/teacher' : '/student')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            🎓
          </div>
          <span className="font-black text-lg text-ink-900 tracking-tight group-hover:text-brand-700 transition-colors">
            Study Buddy
          </span>
        </button>

        {/* Right side */}
        {user && (
          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: isTeacher ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'linear-gradient(135deg, #0891b2, #0369a1)' }}>
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800 leading-none">{user.name}</p>
                <p className="text-xs text-ink-400 mt-0.5 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="w-px h-6 bg-ink-200 hidden sm:block" />

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
