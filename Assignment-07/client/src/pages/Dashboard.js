// ============================================================
// pages/Dashboard.js
// Shows summary stats: total usage + today's usage
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { token, user } = useAuth();

  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // Fetch all usage records when the component mounts
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/usage', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecords(res.data);
      } catch (err) {
        setError('Failed to load records.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [token]);

  // ── Computed stats ─────────────────────────────────────────

  // Total litres across all records
  const totalUsage = records.reduce((sum, r) => sum + r.amount, 0);

  // Today's date string (YYYY-MM-DD) for comparison
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter records that belong to today
  const todayRecords = records.filter((r) => {
    const recordDate = new Date(r.date).toISOString().split('T')[0];
    return recordDate === todayStr;
  });

  const todayUsage = todayRecords.reduce((sum, r) => sum + r.amount, 0);

  // Count per category
  const categoryCount = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, <strong>{user.name}</strong>! Here's your water usage summary.</p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">💧</div>
          <div className="stat-info">
            <span className="stat-value">{totalUsage.toFixed(1)} L</span>
            <span className="stat-label">Total Usage (All Time)</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{todayUsage.toFixed(1)} L</span>
            <span className="stat-label">Today's Usage</span>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{records.length}</span>
            <span className="stat-label">Total Records</span>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="card">
        <h2>Usage by Category</h2>
        {Object.keys(categoryCount).length === 0 ? (
          <p className="empty-msg">No records yet. <Link to="/add">Add your first entry →</Link></p>
        ) : (
          <div className="category-list">
            {['Drinking', 'Cooking', 'Bathing'].map((cat) => (
              <div key={cat} className="category-row">
                <span className="category-name">
                  {cat === 'Drinking' ? '🥤' : cat === 'Cooking' ? '🍳' : '🚿'} {cat}
                </span>
                <span className="category-amount">
                  {(categoryCount[cat] || 0).toFixed(1)} L
                </span>
                {/* Simple visual bar */}
                <div className="bar-track">
                  <div
                    className={`bar-fill bar-${cat.toLowerCase()}`}
                    style={{ width: totalUsage ? `${((categoryCount[cat] || 0) / totalUsage) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions">
        <Link to="/add"     className="btn-primary">+ Add Usage</Link>
        <Link to="/records" className="btn-secondary">View All Records</Link>
      </div>
    </div>
  );
};

export default Dashboard;
