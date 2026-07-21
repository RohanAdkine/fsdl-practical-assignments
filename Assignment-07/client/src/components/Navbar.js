// ============================================================
// components/Navbar.js
// Top navigation bar shown on every page after login
// ============================================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // redirect to login after logout
  };

  return (
    <nav className="navbar">
      {/* Brand / logo area */}
      <div className="navbar-brand">
        <span className="navbar-icon">💧</span>
        <span className="navbar-title">WaterTracker</span>
      </div>

      {/* Navigation links – only show if user is logged in */}
      {user && (
        <ul className="navbar-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/add">Add Usage</Link></li>
          <li><Link to="/records">View Records</Link></li>
        </ul>
      )}

      {/* User info + logout */}
      {user && (
        <div className="navbar-user">
          <span className="navbar-greeting">Hi, {user.name}!</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
