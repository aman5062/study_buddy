import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import {
  getStudents, deleteStudent, registerStudent,
  getDocuments, uploadDocument, deleteDocument
} from '../services/api';

const NAV_ITEMS = [
  { id: 'overview',  icon: '📊', label: 'Overview' },
  { id: 'students',  icon: '👥', label: 'Students' },
  { id: 'documents', icon: '📚', label: 'Documents' },
];

export default function TeacherDashboard() {
  const [section, setSection]           = useState('overview');
  const [students, setStudents]         = useState([]);
  const [documents, setDocuments]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [studentForm, setStudentForm]   = useState({ name: '', email: '', password: '' });
  const [uploadForm, setUploadForm]     = useState({ title: '', file: null });
  const [uploading, setUploading]       = useState(false);
  const [msg, setMsg]                   = useState({ text: '', type: 'info' });
  const fileRef  = useRef();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([getStudents(), getDocuments()]);
      setStudents(s.data);
      setDocuments(d.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setLoading(false);
  };

  const notify = (text, type = 'info') => { setMsg({ text, type }); };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await registerStudent(studentForm);
      notify('Student added successfully!', 'success');
      setStudentForm({ name: '', email: '', password: '' });
      loadData();
    } catch (err) {
      notify(err.response?.data?.error || 'Error adding student', 'error');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    await deleteStudent(id);
    loadData();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadForm.file);
    fd.append('title', uploadForm.title);
    try {
      await uploadDocument(fd);
      notify('Document uploaded! AI is now processing it…', 'success');
      setUploadForm({ title: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      loadData();
    } catch (err) {
      notify(err.response?.data?.error || 'Upload failed', 'error');
    }
    setUploading(false);
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await deleteDocument(id);
    loadData();
  };

  const readyDocs      = documents.filter(d => d.status === 'ready').length;
  const processingDocs = documents.filter(d => d.status === 'processing').length;

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="w-60 min-h-[calc(100vh-57px)] flex-shrink-0 sticky top-[57px] self-start"
          style={{ background: '#0f172a' }}>
          <div className="px-5 pt-6 pb-4">
            <p className="text-xs font-bold text-ink-500 uppercase tracking-widest">Teacher Portal</p>
          </div>

          <nav className="px-2 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setMsg({ text: '', type: 'info' }); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  section === item.id
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sidebar stats */}
          <div className="mx-3 mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Quick Stats</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Students</span>
                <span className="font-bold text-white">{students.length}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Documents</span>
                <span className="font-bold text-white">{documents.length}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Processing</span>
                <span className="font-bold text-amber-400">{processingDocs}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 p-8 animate-fade-in">
          {/* Notification */}
          {msg.text && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm flex items-center justify-between ${
              msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
              msg.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-800' :
                                       'bg-brand-50 border border-brand-200 text-brand-800'
            }`}>
              <span>{msg.text}</span>
              <button onClick={() => setMsg({ text: '', type: 'info' })}
                className="ml-3 opacity-60 hover:opacity-100 transition-opacity text-base leading-none">✕</button>
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {section === 'overview' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-ink-900">Dashboard Overview</h1>
                <p className="text-ink-500 text-sm mt-0.5">Welcome back — here's what's happening</p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Students', value: students.length,  icon: '👥', from: '#7c3aed', to: '#5b21b6' },
                  { label: 'Total Documents', value: documents.length, icon: '📄', from: '#0891b2', to: '#0369a1' },
                  { label: 'Ready Docs',       value: readyDocs,        icon: '✅', from: '#059669', to: '#047857' },
                  { label: 'Processing',        value: processingDocs,   icon: '⚙️', from: '#d97706', to: '#b45309' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 card-shadow overflow-hidden relative">
                    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10"
                      style={{ background: `radial-gradient(circle, ${s.from}, transparent)` }} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                      style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
                      {s.icon}
                    </div>
                    <p className="text-3xl font-black text-ink-900">{s.value}</p>
                    <p className="text-xs text-ink-500 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent documents */}
              <div className="bg-white rounded-2xl card-shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
                  <h2 className="font-bold text-ink-800">Recent Documents</h2>
                  <button onClick={() => setSection('documents')}
                    className="text-xs text-brand-600 font-semibold hover:text-brand-800 transition-colors">
                    View all →
                  </button>
                </div>
                {documents.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-ink-400 text-sm">No documents yet. Upload your first one.</p>
                    <button onClick={() => setSection('documents')}
                      className="mt-3 text-brand-600 font-semibold text-sm hover:text-brand-800 transition-colors">
                      Upload now →
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink-50">
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider">Title</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {documents.slice(0, 8).map(doc => (
                        <tr key={doc.id} className="hover:bg-ink-50 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-ink-800">{doc.title}</td>
                          <td className="px-6 py-3.5 text-ink-400 hidden sm:table-cell">
                            {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-3.5"><StatusBadge status={doc.status} /></td>
                          <td className="px-6 py-3.5 text-right">
                            {doc.status === 'ready' && (
                              <button onClick={() => navigate(`/documents/${doc.id}`)}
                                className="text-xs text-brand-600 font-semibold hover:text-brand-800 transition-colors">
                                View →
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ STUDENTS ══ */}
          {section === 'students' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-ink-900">Manage Students</h1>
                <p className="text-ink-500 text-sm mt-0.5">Add students so they can access study materials</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add student form */}
                <div className="bg-white rounded-2xl card-shadow p-6">
                  <h2 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center text-sm">➕</span>
                    Add New Student
                  </h2>
                  <form onSubmit={handleAddStudent} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1">Full Name</label>
                      <input
                        value={studentForm.name}
                        onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                        placeholder="Jane Smith"
                        required
                        className="w-full px-3.5 py-2.5 border-2 border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                        placeholder="jane@school.com"
                        required
                        className="w-full px-3.5 py-2.5 border-2 border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1">Password</label>
                      <input
                        type="password"
                        value={studentForm.password}
                        onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                        placeholder="Set a password"
                        required
                        className="w-full px-3.5 py-2.5 border-2 border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                      Add Student
                    </button>
                  </form>
                </div>

                {/* Student list */}
                <div className="bg-white rounded-2xl card-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-ink-100">
                    <h2 className="font-bold text-ink-800 flex items-center gap-2">
                      <span className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center text-sm">👥</span>
                      Students
                      <span className="ml-auto text-xs font-bold bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                        {students.length}
                      </span>
                    </h2>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-ink-100">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-6 py-3 hover:bg-ink-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #0891b2, #0369a1)' }}>
                            {s.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">{s.name}</p>
                            <p className="text-xs text-ink-400">{s.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="text-xs text-ink-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="text-3xl mb-2">👤</div>
                        <p className="text-ink-400 text-sm">No students added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ DOCUMENTS ══ */}
          {section === 'documents' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-ink-900">Documents</h1>
                <p className="text-ink-500 text-sm mt-0.5">Upload PDFs and let AI process them for students</p>
              </div>

              {/* Upload form */}
              <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
                <h2 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center text-sm">📤</span>
                  Upload New Document
                </h2>
                <form onSubmit={handleUpload} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Document Title</label>
                    <input
                      value={uploadForm.title}
                      onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g. Chapter 3 — Newton's Laws"
                      required
                      className="w-full px-3.5 py-2.5 border-2 border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      uploadForm.file
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-ink-300 hover:border-brand-400 hover:bg-brand-50'
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    />
                    <div className="text-3xl mb-2">{uploadForm.file ? '✅' : '📄'}</div>
                    <p className="text-sm font-medium text-ink-600">
                      {uploadForm.file ? uploadForm.file.name : 'Click to select PDF'}
                    </p>
                    {!uploadForm.file && <p className="text-xs text-ink-400 mt-1">Max size: 50 MB</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file || !uploadForm.title}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Uploading…
                      </span>
                    ) : '⚡ Upload & Process with AI'}
                  </button>
                </form>
              </div>

              {/* Doc grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    onDelete={handleDeleteDoc}
                    onView={() => navigate(`/documents/${doc.id}`)}
                  />
                ))}
                {documents.length === 0 && (
                  <div className="col-span-3 text-center py-16">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="text-ink-400 text-sm">No documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <Chatbot />
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    ready:      { cls: 'bg-emerald-100 text-emerald-700', label: '✅ Ready' },
    processing: { cls: 'bg-amber-100 text-amber-700',     label: '⏳ Processing' },
    failed:     { cls: 'bg-red-100 text-red-700',         label: '❌ Failed' },
  };
  const c = cfg[status] || cfg.processing;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.cls}`}>
      {c.label}
    </span>
  );
}

function DocCard({ doc, onDelete, onView }) {
  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden hover:card-shadow-hover transition-all">
      <div className="h-1.5 w-full" style={{
        background: doc.status === 'ready'
          ? 'linear-gradient(90deg, #059669, #10b981)'
          : doc.status === 'processing'
          ? 'linear-gradient(90deg, #d97706, #f59e0b)'
          : 'linear-gradient(90deg, #dc2626, #ef4444)'
      }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-ink-50 rounded-xl flex items-center justify-center text-xl">📄</div>
          <StatusBadge status={doc.status} />
        </div>
        <h3 className="font-bold text-ink-800 text-sm line-clamp-2 mb-1">{doc.title}</h3>
        <p className="text-xs text-ink-400 mb-4">
          {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onView}
            disabled={doc.status !== 'ready'}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            View
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="py-2 px-3 bg-red-50 text-red-500 rounded-xl text-sm hover:bg-red-100 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
