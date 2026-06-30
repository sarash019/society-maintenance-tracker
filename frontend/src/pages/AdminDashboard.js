import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueDays, setOverdueDays] = useState('');
  const [settingMsg, setSettingMsg] = useState('');

  useEffect(() => {
    api.get('/complaints/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateOverdue = async () => {
    try {
      await api.put('/complaints/settings/overdue', { days: overdueDays });
      setSettingMsg('Threshold updated!');
      setTimeout(() => setSettingMsg(''), 2000);
    } catch {
      setSettingMsg('Failed to update');
    }
  };

  const statusColor = { 'Open': '#dc2626', 'In Progress': '#d97706', 'Resolved': '#16a34a' };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 16px' }}>
      <h1 className="page-title">Admin Dashboard</h1>

      {/* Summary stats */}
      <div className="stat-grid">
        {stats?.by_status?.map(s => (
          <div className="stat-card" key={s.status}>
            <div className="stat-value" style={{ color: statusColor[s.status] || '#2563eb' }}>{s.count}</div>
            <div className="stat-label">{s.status}</div>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>{stats?.overdue_count}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* By Category */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Complaints by Category</h3>
          {stats?.by_category?.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No data yet</p>
            : stats?.by_category?.map(c => (
              <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                <span style={{ color: '#4b5563' }}>{c.category}</span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{c.count}</span>
              </div>
            ))
          }
        </div>

        {/* Quick actions + settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/admin/complaints" className="btn btn-primary" style={{ justifyContent: 'center' }}>View All Complaints</Link>
              <Link to="/admin/notices" className="btn btn-outline" style={{ justifyContent: 'center' }}>Manage Notices</Link>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Overdue Threshold</h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Set number of days before a complaint is considered overdue.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min="1"
                value={overdueDays}
                onChange={e => setOverdueDays(e.target.value)}
                placeholder="e.g. 7"
                style={{ width: 80, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
              />
              <button className="btn btn-primary btn-sm" onClick={updateOverdue}>Update</button>
            </div>
            {settingMsg && <p style={{ fontSize: 12, marginTop: 6, color: '#16a34a' }}>{settingMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
