import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Parking', 'Cleanliness', 'Noise', 'Internet', 'Water Supply', 'Other'];

const RaiseComplaint = () => {
  const [form, setForm] = useState({ category: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      if (photo) fd.append('photo', photo);
      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Complaint raised successfully!');
      setTimeout(() => navigate('/my-complaints'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 16px' }}>
      <h1 className="page-title">Raise a Complaint</h1>
      <div className="card">
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={form.category} onChange={handle} required>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handle} placeholder="Describe your issue in detail..." required minLength={10} />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ border: 'none', padding: 0 }} />
            {preview && (
              <img src={preview} alt="preview" style={{ marginTop: 10, maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            )}
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/my-complaints')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseComplaint;
