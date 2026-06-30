import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

const NoticeBoard = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', is_important: false });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchNotices = () => {
    api.get('/notices')
      .then(r => setNotices(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setError('');
    setPosting(true);
    try {
      await api.post('/notices', form);
      setForm({ title: '', body: '', is_important: false });
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post notice');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await api.delete(`/notices/${id}`);
    fetchNotices();
  };

  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Notice Board</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Post Notice'}
          </button>
        )}
      </div>

      {/* Post Notice Form (Admin only) */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Post New Notice</h3>
          <form onSubmit={handlePost}>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notice title" required />
            </div>
            <div className="form-group">
              <label>Body *</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Notice details..." required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="important"
                checked={form.is_important}
                onChange={e => setForm({ ...form, is_important: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label htmlFor="important" style={{ marginBottom: 0 }}>Mark as Important (residents will receive email)</label>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={posting}>
              {posting ? 'Posting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="card empty-state">
          <p style={{ fontWeight: 500 }}>No notices yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>The admin will post important announcements here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map(n => (
            <div key={n.id} className="card" style={{ borderLeft: n.is_important ? '4px solid #f59e0b' : '4px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {n.is_important && <span className="badge badge-important">📌 Important</span>}
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937' }}>{n.title}</h3>
                  </div>
                  <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 10 }}>{n.body}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>
                    Posted by {n.admin_name} · {formatDate(n.created_at)}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
