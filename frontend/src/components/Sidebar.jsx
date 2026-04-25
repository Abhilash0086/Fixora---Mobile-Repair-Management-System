import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ClipboardList,
  PackageCheck, CheckCircle, Search,
  Sun, Moon, Users, LogOut, BarChart2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/new',       icon: FilePlus,        label: 'New Job Card' },
  { path: '/jobs',      icon: ClipboardList,   label: 'All Job Cards' },
  { path: '/ready',     icon: PackageCheck,    label: 'Ready for Delivery' },
  { path: '/delivered', icon: CheckCircle,     label: 'Delivered' },
  { path: '/search',     icon: Search,          label: 'Search' },
  { path: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { path: '/users',     icon: Users,           label: 'Users' },
];

const TECH_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ready',     icon: PackageCheck,    label: 'Ready for Delivery' },
  { path: '/delivered', icon: CheckCircle,     label: 'Delivered' },
  { path: '/search',    icon: Search,          label: 'Search' },
];

export function Sidebar({ theme, toggleTheme, sidebarOpen, closeSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = user?.role === 'admin' ? ADMIN_NAV : TECH_NAV;

  function go(path) {
    navigate(path);
    closeSidebar();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="brand">Fixora</div>
        <div className="tagline">Repair Management</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => go(path)}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.name}</div>
            <span className={`role-chip role-${user.role}`}>{user.role}</span>
          </div>
        )}
        <button className="nav-item theme-toggle" onClick={toggleTheme}>
          {theme === 'dark'
            ? <Sun size={16} strokeWidth={1.75} />
            : <Moon size={16} strokeWidth={1.75} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
