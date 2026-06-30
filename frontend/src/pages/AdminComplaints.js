import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const statusBadge = (status) => {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved' };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};
const priorityBadge = (p) => {
  const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return <span className={`badge ${map[p] || ''}`}>{p}</span>;
};
const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Parking', 'Cleanliness', 'Noise', 'Internet', 'Water Supply', 'Other'];

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', status: '', from_date: '', to_date: '' });
  const [expanded, setExpanded] = useState(null);
  const [updateForm, setUpdateForm] = useState({});
  const [msg, setMsg] = useState({});

  const fetch = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await api.get('/complaints', { params });
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleUpdate = async (id) => {
    const { status, priority, note } = updateForm[id] || {};
    setMsg({ ...msg, [id]: '' });
    try {
      await api.patch(`/complaints/${id}`, { status, priority, note });
      setMsg({ ...msg, [id]: 'Updated!' });
      fetch();
    } catch (err) {
      setMsg({ ...msg, [id]: err.response?.data?.error || 'Failed' });
    }
  };

  const handleMarkOverdue = async (id) => {
    await api.patch(`/complaints/${id}/overdue`);
    fetch();
  };

  const setField = (id, field, value) => {
    setUpdateForm(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
      <h1 className="page-title">All Complaints</h1>

      <div className="filter-bar">
        <select name="category" value={filters.category} onChange={handleFilter}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={handleFilter}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" name="from_date" value={filters.from_date} onChange={handleFilter} title="From Date" />
        <input type="date" name="to_date" value={filters.to_date} onChange={handleFilter} title="To Date" />
        <button className="btn btn-primary btn-sm" onClick={fetch}>Apply Filters</button>
        <button className="btn btn-outline btn-sm" onClick={() => { setFilters({ category: '', status: '', from_date: '', to_date: '' }); fetch(); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="card empty-state"><p>No complaints found.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map(c => (
            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden', border: c.is_overdue && c.status !== 'Resolved' ? '2px solid #dc2626' : '1px solid #e5e7eb' }}>
              <div style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>#{c.id}</span>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{c.category}</span>
                    {statusBadge(c.status)}
                    {priorityBadge(c.priority)}
                    {c.is_overdue && c.status !== 'Resolved' && <span className="badge badge-overdue">⚠ Overdue</span>}
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{c.description}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    By <strong>{c.resident_name}</strong> ({c.flat_number || 'N/A'}) · {formatDate(c.created_at)}
                  </p>
                </div>
                <span style={{ color: '#9ca3af', fontSize: 18 }}>{expanded === c.id ? '▲' : '▼'}</span>
              </div>

              {expanded === c.id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 18px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {c.photo_url && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>PHOTO</p>
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}${c.photo_url}`}
                        alt="complaint"
                        style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    </div>
                  )}

                  {/* Update form */}
                  {c.status !== 'Resolved' && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>UPDATE COMPLAINT</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#6b7280' }}>Status</label>
                          <select value={updateForm[c.id]?.status || c.status} onChange={e => setField(c.id, 'status', e.target.value)}
                            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#6b7280' }}>Priority</label>
                          <select value={updateForm[c.id]?.priority || c.priority} onChange={e => setField(c.id, 'priority', e.target.value)}
                            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#6b7280' }}>Note (optional)</label>
                          <input value={updateForm[c.id]?.note || ''} onChange={e => setField(c.id, 'note', e.target.value)}
                            placeholder="Add a note..."
                            style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(c.id)}>Save</button>
                        {c.status !== 'Resolved' && !c.is_overdue && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleMarkOverdue(c.id)} style={{ color: '#dc2626', borderColor: '#dc2626' }}>Mark Overdue</button>
                        )}
                      </div>
                      {msg[c.id] && <p style={{ fontSize: 12, marginTop: 6, color: msg[c.id] === 'Updated!' ? '#16a34a' : '#dc2626' }}>{msg[c.id]}</p>}
                    </div>
                  )}

                  {/* History */}
                  <div>
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
