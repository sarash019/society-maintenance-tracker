import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const residentLinks = [
    { to: '/my-complaints', label: 'My Complaints' },
    { to: '/raise-complaint', label: 'Raise Complaint' },
    { to: '/notices', label: 'Notice Board' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/complaints', label: 'Complaints' },
    { to: '/admin/notices', label: 'Notice Board' },
  ];

  const links = user?.role === 'admin' ? adminLinks : residentLinks;

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: 17, color: '#2563eb', letterSpacing: '-0.02em' }}>
          🏢 SocietyTracker
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: isActive(link.to) ? '#2563eb' : '#4b5563',
                background: isActive(link.to) ? '#eff6ff' : 'transparent',
                transition: 'all 0.15s'
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {user?.name} <span style={{ background: user?.role === 'admin' ? '#2563eb' : '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{user?.role}</span>
        </span>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
