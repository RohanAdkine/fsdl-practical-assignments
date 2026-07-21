// ============================================================
// pages/ViewRecords.js
// Displays all water-usage records in a table with delete option
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ViewRecords = () => {
  const { token } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [deletingId, setDeletingId] = useState(null); // track which row is being deleted

  // Fetch records on mount
  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      setError('Failed to load records. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a single record by id
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/usage/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove deleted record from local state (no need to re-fetch)
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Failed to delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Format a date string into a readable format: e.g. "15 Jan 2025"
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });
  };

  // Category emoji helper
  const categoryEmoji = (cat) => {
    const map = { Drinking: '🥤', Cooking: '🍳', Bathing: '🚿' };
    return map[cat] || '💧';
  };

  if (loading) return <div className="loading">Loading records...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Water Usage Records</h1>
        <p>All your logged water consumption entries.</p>
      </div>

      {/* Action button */}
      <div className="table-toolbar">
        <span className="record-count">{records.length} record{records.length !== 1 ? 's' : ''} found</span>
        <Link to="/add" className="btn-primary">+ Add New</Link>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💧</div>
          <h3>No records yet</h3>
          <p>Start by adding your first water usage entry.</p>
          <Link to="/add" className="btn-primary">Add Usage</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Category</th>
                <th>Amount (L)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record._id}>
                  <td className="td-num">{index + 1}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>
                    <span className={`badge badge-${record.category.toLowerCase()}`}>
                      {categoryEmoji(record.category)} {record.category}
                    </span>
                  </td>
                  <td className="td-amount">{record.amount.toFixed(1)} L</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(record._id)}
                      disabled={deletingId === record._id}
                    >
                      {deletingId === record._id ? '...' : '🗑️ Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer row showing total */}
            <tfoot>
              <tr>
                <td colSpan="3" className="tfoot-label">Total</td>
                <td className="tfoot-total">
                  {records.reduce((s, r) => s + r.amount, 0).toFixed(1)} L
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewRecords;
