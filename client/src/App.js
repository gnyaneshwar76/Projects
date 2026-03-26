import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BugListPage from './pages/BugListPage';
import BugDetailPage from './pages/BugDetailPage';
import CreateBugPage from './pages/CreateBugPage';
// import ClusterAnalysisPage from './pages/ClusterAnalysisPage'; // [DISABLED] Cluster Analysis removed — not aligned with community platform
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminLoginPage from './pages/AdminLoginPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import AIChat from './components/AIChat';
import NotificationBell from './components/NotificationBell';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [aiChatContext, setAiChatContext] = useState(null);
  const [aiChatForceOpen, setAiChatForceOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }

    // Listen for storage changes (login from other route)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('authToken');
      const newUser = localStorage.getItem('user');
      
      if (newToken && newUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(newUser));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for bug context changes from BugDetailPage
    const handleBugContext = (e) => setAiChatContext(e.detail);
    const handleAiOpen = () => setAiChatForceOpen(true);
    window.addEventListener('bugContextChange', handleBugContext);
    window.addEventListener('aiChatOpen', handleAiOpen);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bugContextChange', handleBugContext);
      window.removeEventListener('aiChatOpen', handleAiOpen);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage isDark={isDark} />} />
          <Route path="/register" element={<RegisterPage isDark={isDark} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage isDark={isDark} />} />
          <Route path="/reset-password" element={<ResetPasswordPage isDark={isDark} />} />
          <Route path="/admin/login" element={<AdminLoginPage isDark={isDark} />} />
          <Route path="/" element={<LandingPage isDark={isDark} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{backgroundColor: isDark ? '#0f172a' : '#f3f4f6', minHeight: '100vh'}}>
        {/* Sidebar */}
        <Sidebar isDark={isDark} user={user} onLogout={handleLogout} />
        
        {/* Main Content */}
        <div style={{marginLeft: '250px', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
          {/* Top Bar */}
          <TopBar isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} user={user} onLogout={handleLogout} />
          
          {/* Page Content */}
          <main style={{padding: '24px', overflow: 'auto', flex: 1}}>
              <Routes>
                <Route path="/" element={<Dashboard isDark={isDark} />} />
                <Route path="/bugs" element={<BugListPage isDark={isDark} />} />
                <Route path="/bugs/create" element={<CreateBugPage isDark={isDark} />} />
                <Route path="/bugs/:bugId" element={<BugDetailPage isDark={isDark} />} />
                <Route path="/profile/:userId" element={<ProfilePage isDark={isDark} />} />
                {/* <Route path="/analysis/clusters" element={<ClusterAnalysisPage isDark={isDark} />} /> */}
                {/* Cluster Analysis disabled — redirect any stale links to home */}
                <Route path="/analysis/clusters" element={<Navigate to="/" />} />
              </Routes>
          </main>
        </div>
        
        {/* Floating AI Chat Widget — context-aware when on bug pages */}
        <AIChat
          isDark={isDark}
          bugContext={aiChatContext}
          autoOpen={aiChatForceOpen}
          onAutoOpenHandled={() => setAiChatForceOpen(false)}
        />
      </div>
    </Router>
  );
}

function Sidebar({ isDark, user, onLogout }) {
  const location = useLocation();
  const menuItems = [
    { label: 'Dashboard', icon: '📊', path: '/' },
    { label: 'Bugs', icon: '🐛', path: '/bugs' },
    { label: 'Report Bug', icon: '📝', path: '/bugs/create' },
    // { label: 'Analysis', icon: '📈', path: '/analysis/clusters' }, // [DISABLED]
  ];

  return (
    <div style={{
      width: '250px',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      borderRight: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px',
        borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <Link to="/" style={{textDecoration: 'none'}}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🐛 TraceStack
          </div>
        </Link>
      </div>

      {/* Menu Items */}
      <nav style={{padding: '0 12px', flex: 1}}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{textDecoration: 'none', color: 'inherit'}}
          >
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: location.pathname === item.path 
                  ? isDark ? '#334155' : '#eff6ff'
                  : 'transparent',
                color: location.pathname === item.path
                  ? isDark ? '#f1f5f9' : '#3b82f6'
                  : isDark ? '#9ca3af' : '#6b7280',
                fontWeight: location.pathname === item.path ? '600' : '500',
                transition: 'all 0.2s',
                borderLeft: location.pathname === item.path
                  ? '3px solid #3b82f6'
                  : '3px solid transparent',
                paddingLeft: '13px'
              }}
              className="hover:bg-opacity-70"
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{fontSize: '20px'}}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User Info and Logout */}
      <div style={{
        padding: '16px 12px',
        borderTop: isDark ? '1px solid #334155' : '1px solid #e5e7eb'
      }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: isDark ? '#334155' : '#f3f4f6',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: '4px'
          }}>
            Logged in as
          </div>
          <Link to={`/profile/${user?._id || user?.id}`} style={{
            fontSize: '14px',
            fontWeight: '600',
            color: isDark ? '#f1f5f9' : '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: 'none',
            display: 'block'
          }}>
            {user?.name || 'User'}
          </Link>
          {user?.role === 'admin' && (
            <div style={{
              fontSize: '11px',
              color: '#f59e0b',
              marginTop: '4px',
              fontWeight: '600'
            }}>
              👑 Admin
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

function TopBar({ isDark, onThemeToggle, user, onLogout }) {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/bugs': return 'Bug Tracker';
      case '/bugs/create': return 'Report Bug';
      case '/analysis/clusters': return 'Cluster Analysis';
      default: return 'TraceStack';
    }
  };

  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: '0 0 auto'
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: isDark ? '#f1f5f9' : '#111827'
      }}>
        {getPageTitle()}
      </h1>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        <button
          onClick={onThemeToggle}
          style={{
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f3f4f6';
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <NotificationBell isDark={isDark} />

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '12px',
            borderLeft: isDark ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            <span style={{
              fontSize: '14px',
              color: isDark ? '#d1d5db' : '#4b5563'
            }}>
              {user.name}
            </span>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
