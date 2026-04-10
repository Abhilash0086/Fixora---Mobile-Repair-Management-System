import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ToastArea, Loading } from './components/Common';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewJobCard from './pages/NewJobCard';
import AllJobCards from './pages/AllJobCards';
import ReadyJobCards from './pages/ReadyJobCards';
import DeliveredJobCards from './pages/DeliveredJobCards';
import Search from './pages/Search';
import Users from './pages/Users';
import './index.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const { user } = useAuth();
  const [theme, setTheme]         = useState(() => localStorage.getItem('theme') || 'dark');
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme   = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
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
        <div className="mobile-header">
          <button className="hamburger" onClick={toggleSidebar}>
            <span /><span /><span />
          </button>
          <span className="mobile-brand">Fixora</span>
        </div>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/new"       element={<ProtectedRoute adminOnly><NewJobCard /></ProtectedRoute>} />
          <Route path="/jobs"      element={<ProtectedRoute adminOnly><AllJobCards /></ProtectedRoute>} />
          <Route path="/ready"     element={<ReadyJobCards />} />
          <Route path="/delivered" element={<DeliveredJobCards />} />
          <Route path="/search"    element={<Search />} />
          <Route path="/users"     element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
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
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*"     element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><Loading /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}
