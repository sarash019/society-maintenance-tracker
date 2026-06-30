import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Shared/Navbar';
import Auth from './pages/Auth';
import MyComplaints from './pages/MyComplaints';
import RaiseComplaint from './pages/RaiseComplaint';
import NoticeBoard from './pages/NoticeBoard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import './styles/global.css';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/my-complaints'} replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/my-complaints'} /> : <Auth mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/my-complaints" /> : <Auth mode="register" />} />

      {/* Resident routes */}
      <Route path="/my-complaints" element={<ProtectedRoute role="resident"><MyComplaints /></ProtectedRoute>} />
      <Route path="/raise-complaint" element={<ProtectedRoute role="resident"><RaiseComplaint /></ProtectedRoute>} />
      <Route path="/notices" element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute role="admin"><AdminComplaints /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute role="admin"><NoticeBoard /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/my-complaints') : '/login'} />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
