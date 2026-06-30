import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const statusBadge = (status) => {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved' };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

const priorityBadge = (priority) => {
  const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return <span className={`badge ${map[priority] || ''}`}>{priority}</span>;
};

const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/complaints/my')
      .then(r => setComplaints(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading your complaints...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Complaints</h1>
        <Link to="/raise-complaint" className="btn btn-primary">+ New Complaint</Link>
      </div>

      {complaints.length === 0 ? (
        <div className="card empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{ fontWeight: 500 }}>No complaints yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Raise a complaint when you have an issue.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {complaints.map(c => (
            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>#{c.id}</span>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{c.category}</span>
                    {statusBadge(c.status)}
                    {priorityBadge(c.priority)}
                    {c.is_overdue && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  <p style={{ fontSize: 14, color: '#4b5563', margin: 0 }}>{c.description}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Raised on {formatDate(c.created_at)}</p>
                </div>
                <span style={{ color: '#9ca3af', fontSize: 18 }}>{expanded === c.id ? '▲' : '▼'}</span>
              </div>

              {expanded === c.id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: '#f9fafb' }}>
                  {c.photo_url && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>PHOTO</p>
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}${c.photo_url}`}
                        alt="complaint"
                        style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>STATUS HISTORY</p>
                  <div className="history-timeline">
                    {c.history.map(h => (
                      <div key={h.id} className="history-item">
                        <div>
                          <strong>{h.new_status}</strong>
                          {h.old_status && <span style={{ color: '#9ca3af' }}> (was {h.old_status})</span>}
                          {h.note && <span style={{ marginLeft: 6, fontStyle: 'italic' }}>— "{h.note}"</span>}
                        </div>
                        <div className="time">{formatDate(h.changed_at)} · by {h.actor_name} ({h.actor_role})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
