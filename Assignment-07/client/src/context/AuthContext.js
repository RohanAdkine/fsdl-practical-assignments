// ============================================================
// context/AuthContext.js
// Global authentication state using React Context API.
// Any component can call useAuth() to get/set login info.
// ============================================================

import React, { createContext, useContext, useState } from 'react';

// 1. Create the context object
const AuthContext = createContext(null);

// 2. Provider component – wrap the whole app with this
export const AuthProvider = ({ children }) => {
  // Try to load saved user data from localStorage on first render
  const [user, setUser]   = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Called after a successful login or register
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user',  JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
  };

  // Called when the user clicks "Logout"
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
