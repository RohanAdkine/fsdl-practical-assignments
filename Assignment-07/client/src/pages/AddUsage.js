// ============================================================
// pages/AddUsage.js
// Form to add a new water-usage record
// ============================================================

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AddUsage = () => {
  const { token } = useAuth();
  const navigate  = useNavigate();

  // Pre-fill the date field with today's date
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    amount:   '',
    category: 'Drinking',
    date:     today,
  });

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic client-side validation
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/usage', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('✅ Record added successfully!');

      // Reset form (keep today's date + category)
      setFormData({ amount: '', category: 'Drinking', date: today });

      // Navigate to records after a short delay
      setTimeout(() => navigate('/records'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Add Water Usage</h1>
        <p>Log your water consumption for the day.</p>
      </div>

      <div className="form-card">
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="usage-form">
          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount (Litres)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 2.5"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="Drinking">🥤 Drinking</option>
              <option value="Cooking">🍳 Cooking</option>
              <option value="Bathing">🚿 Bathing</option>
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              max={today}          /* can't log future dates */
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Record'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/records')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUsage;
