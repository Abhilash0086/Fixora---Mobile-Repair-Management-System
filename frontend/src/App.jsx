import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { api } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { ToastArea, Loading } from './components/Common';
import { Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewJobCard from './pages/NewJobCard';
import AllJobCards from './pages/AllJobCards';
import ReadyJobCards from './pages/ReadyJobCards';
import DeliveredJobCards from './pages/DeliveredJobCards';
import Search from './pages/Search';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import TrackJobCard from './pages/TrackJobCard';
import Landing from './pages/Landing';
import './index.css';

function ProtectedRoute({ children, adminOnly = false, guestOk = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin' && !(guestOk && user.role === 'guest'))
    return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell() {
  const { user, updateUser } = useAuth();
  const [theme, setTheme]         = useState(() => user?.theme || localStorage.getItem('theme') || 'dark');
  const [sidebarOpen, setSidebar] = useState(false);

  // Sync theme when user loads (e.g. after token refresh)
  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
  }, [user?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    updateUser({ theme: next });
    try {
      await api.updateProfile({ theme: next });
    } catch {
      // non-critical — theme already applied locally
    }
  }
  const toggleSidebar = () => setSidebar(o => !o);
  const closeSidebar  = () => setSidebar(false);

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
      />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <main className="main-content">
        {user?.role === 'guest' && (
          <div className="guest-banner">
            <span className="guest-banner-text">
              👋 You're exploring as a guest — some features are view-only
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link to="/" className="btn btn-ghost btn-sm">← Home</Link>
              <GuestSignInButton />
            </div>
          </div>
        )}
        <div className="mobile-header">
          <button className="hamburger" onClick={toggleSidebar}>
            <span /><span /><span />
          </button>
          <span className="mobile-brand">Fixora</span>
        </div>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new"       element={<ProtectedRoute adminOnly><NewJobCard /></ProtectedRoute>} />
          <Route path="/jobs"      element={<ProtectedRoute adminOnly guestOk><AllJobCards /></ProtectedRoute>} />
          <Route path="/ready"     element={<ReadyJobCards />} />
          <Route path="/delivered" element={<DeliveredJobCards />} />
          <Route path="/search"    element={<Search />} />
          <Route path="/analytics" element={<ProtectedRoute adminOnly guestOk><Analytics /></ProtectedRoute>} />
          <Route path="/users"     element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <ToastArea />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/track/:id"  element={<TrackJobCard />} />
          <Route path="/*"          element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function GuestSignInButton() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  function handleSignIn() { logout(); navigate('/login'); }
  return (
    <button className="btn btn-primary btn-sm" onClick={handleSignIn}>
      Sign In
    </button>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><Loading /></div>;
  if (user && user.role !== 'guest') return <Navigate to="/dashboard" replace />;
  return children;
}
