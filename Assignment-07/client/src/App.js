// ============================================================
// App.js
// Root component – sets up routing and protects private pages
// ============================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar      from './components/Navbar';
import Dashboard   from './pages/Dashboard';
import AddUsage    from './pages/AddUsage';
import ViewRecords from './pages/ViewRecords';
import Login       from './pages/Login';
import Register    from './pages/Register';

// ── PrivateRoute: redirect to /login if not authenticated ───
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// ── PublicRoute: redirect to / if already logged in ─────────
const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <main className="main-content">
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/"        element={<PrivateRoute><Dashboard   /></PrivateRoute>} />
        <Route path="/add"     element={<PrivateRoute><AddUsage    /></PrivateRoute>} />
        <Route path="/records" element={<PrivateRoute><ViewRecords /></PrivateRoute>} />

        {/* Catch-all: redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
