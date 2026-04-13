import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import {
  getStudents, deleteStudent, registerStudent,
  getDocuments, uploadDocument, deleteDocument
} from '../services/api';

export default function TeacherDashboard() {
  const [section, setSection] = useState('overview');
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '' });
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([getStudents(), getDocuments()]);
      setStudents(s.data);
      setDocuments(d.data);
    } catch {}
    setLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await registerStudent(studentForm);
      setMsg('Student added successfully!');
      setStudentForm({ name: '', email: '', password: '' });
      loadData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error adding student');
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
      setMsg('Document uploaded! Processing with AI...');
      setUploadForm({ title: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      loadData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await deleteDocument(id);
    loadData();
  };

  const readyDocs = documents.filter(d => d.status === 'ready').length;

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'students', icon: '👥', label: 'Students' },
    { id: 'documents', icon: '📚', label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col py-6">
          <div className="px-6 mb-6">
            <p className="text-xs text-gray-400 uppercase font-semibold">Teacher Portal</p>
          </div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setMsg(''); }}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                section === item.id ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-8">
          {msg && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex justify-between">
              {msg} <button onClick={() => setMsg('')} className="text-blue-400 hover:text-blue-600">✕</button>
            </div>
          )}

          {section === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Total Students', value: students.length, icon: '👥', color: 'bg-blue-500' },
                  { label: 'Total Documents', value: documents.length, icon: '📄', color: 'bg-purple-500' },
                  { label: 'Processed Docs', value: readyDocs, icon: '✅', color: 'bg-green-500' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-700 mb-4">Recent Documents</h2>
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{doc.title}</p>
                      <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
                {documents.length === 0 && <p className="text-gray-400 text-sm">No documents yet.</p>}
              </div>
            </div>
          )}

          {section === 'students' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Students</h1>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="font-semibold text-gray-700 mb-4">Add Student</h2>
                  <form onSubmit={handleAddStudent} className="space-y-3">
                    <input value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                      placeholder="Full Name" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})}
                      placeholder="Email" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})}
                      placeholder="Password" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button type="submit"
                      className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                      Add Student
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="font-semibold text-gray-700 mb-4">Students ({students.length})</h2>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                        <button onClick={() => handleDeleteStudent(s.id)}
                          className="text-red-400 hover:text-red-600 text-sm transition-colors">🗑️</button>
                      </div>
                    ))}
                    {students.length === 0 && <p className="text-gray-400 text-sm">No students yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'documents' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Documents</h1>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h2 className="font-semibold text-gray-700 mb-4">Upload PDF</h2>
                <form onSubmit={handleUpload} className="space-y-3">
                  <input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    placeholder="Document Title" required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                      onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} />
                    <p className="text-3xl mb-2">📄</p>
                    <p className="text-sm text-gray-500">{uploadForm.file ? uploadForm.file.name : 'Click to select PDF (max 50MB)'}</p>
                  </div>
                  <button type="submit" disabled={uploading || !uploadForm.file || !uploadForm.title}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                    {uploading ? 'Uploading...' : 'Upload & Process with AI'}
                  </button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <DocCard key={doc.id} doc={doc} onDelete={handleDeleteDoc} onView={() => navigate(`/documents/${doc.id}`)} />
                ))}
                {documents.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-gray-400">
                    <p className="text-4xl mb-3">📚</p>
                    <p>No documents uploaded yet.</p>
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
    ready: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cfg[status] || cfg.processing}`}>
      {status === 'processing' ? '⏳ Processing' : status === 'ready' ? '✅ Ready' : '❌ Failed'}
    </span>
  );
}

function DocCard({ doc, onDelete, onView }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">📄</span>
        <StatusBadge status={doc.status} />
      </div>
      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{doc.title}</h3>
      <p className="text-xs text-gray-400 mb-4">{new Date(doc.created_at).toLocaleDateString()}</p>
      <div className="flex gap-2">
        <button onClick={onView} disabled={doc.status !== 'ready'}
          className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-40 transition-colors">
          View
        </button>
        <button onClick={() => onDelete(doc.id)}
          className="py-2 px-3 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors">🗑️</button>
      </div>
    </div>
  );
}
