import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Code2, LogOut, LogIn, UserPlus, History, Cpu, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignout = () => {
    signout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border"
      style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-cyber-purple flex items-center justify-center shadow-glow-blue">
            <Cpu size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">
            <span className="text-primary-400">Compiler</span>
            <span className="text-gray-100"> Visualizer</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/editor" active={isActive('/editor')} icon={<Code2 size={14} />}>
            Editor
          </NavLink>
          {user && (
            <NavLink to="/history" active={isActive('/history')} icon={<History size={14} />}>
              History
            </NavLink>
          )}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-gray-400 px-2">
                <span className="text-primary-400 font-medium">{user.username}</span>
              </span>
              <button onClick={handleSignout} className="btn-secondary text-xs px-3 py-1.5">
                <LogOut size={13} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-xs px-3 py-1.5">
                <LogIn size={13} /> Login
              </Link>
              <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
                <UserPlus size={13} /> Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden btn-secondary p-1.5" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-surface px-4 py-3 flex flex-col gap-2">
          <Link to="/editor" className="text-sm text-gray-300 hover:text-white py-1" onClick={() => setMenuOpen(false)}>Editor</Link>
          {user ? (
            <>
              <Link to="/history" className="text-sm text-gray-300 hover:text-white py-1" onClick={() => setMenuOpen(false)}>History</Link>
              <button onClick={handleSignout} className="text-sm text-red-400 text-left py-1">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white py-1" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="text-sm text-primary-400 hover:text-primary-300 py-1" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
