import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Auth = ({ mode }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', flat_number: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/my-complaints');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 16 }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937' }}>SocietyTracker</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create a resident account'}
            </p>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label>Flat Number</label>
                  <input name="flat_number" value={form.flat_number} onChange={handle} placeholder="e.g. A-203" />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required minLength={6} />
            </div>
            {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link to={mode === 'login' ? '/register' : '/login'} style={{ color: '#2563eb', fontWeight: 500 }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
