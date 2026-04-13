import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import '@/App.css';

// Pages
import LandingPage from '@/pages/LandingPage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ProfileSetupPage from '@/pages/ProfileSetupPage';
import TPODashboard from '@/pages/TPODashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import JobApplicantsPage from '@/pages/JobApplicantsPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = ({ children }) => children;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [needsProfile, setNeedsProfile] = useState(localStorage.getItem('needsProfile') === 'true');

  const login = (tokenData) => {
    setToken(tokenData.token);
    setRole(tokenData.role);
    setNeedsProfile(tokenData.needsProfile || false);
    localStorage.setItem('token', tokenData.token);
    localStorage.setItem('role', tokenData.role);
    localStorage.setItem('needsProfile', tokenData.needsProfile || false);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setNeedsProfile(false);
    localStorage.clear();
  };

  const completeProfile = () => {
    setNeedsProfile(false);
    localStorage.setItem('needsProfile', 'false');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRole && role !== allowedRole) {
      return <Navigate to="/" replace />;
    }
    if (role === 'Student' && needsProfile && window.location.pathname !== '/profile-setup') {
      return <Navigate to="/profile-setup" replace />;
    }
    return children;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={token ? (role === 'TPO' ? <Navigate to="/tpo/dashboard" /> : <Navigate to="/student/dashboard" />) : <LandingPage />} />
          <Route path="/register" element={!token ? <RegisterPage onRegister={login} /> : <Navigate to="/" />} />
          <Route path="/login" element={!token ? <LoginPage onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/profile-setup" element={<ProtectedRoute allowedRole="Student"><ProfileSetupPage onComplete={completeProfile} /></ProtectedRoute>} />
          <Route path="/tpo/dashboard" element={<ProtectedRoute allowedRole="TPO"><TPODashboard onLogout={logout} /></ProtectedRoute>} />
          <Route path="/tpo/jobs/:jobId/applicants" element={<ProtectedRoute allowedRole="TPO"><JobApplicantsPage onLogout={logout} /></ProtectedRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard onLogout={logout} /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
export { API };