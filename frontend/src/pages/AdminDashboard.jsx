// ─────────────────────────────────────────────────────────────────────────────
// pages/AdminDashboard.jsx — Admin moderation panel
//
// Two tabs:
//   Reviews — table of every review across all movies with a delete button
//   Users   — table of every account with ban status and action buttons
//
// A ban modal appears when the admin clicks "Ban" or "Timeout" on a user,
// letting them pick type, duration (for timeouts), and an optional reason.
//
// Access is enforced on both the route level (AdminRoute in App.jsx) and the
// API level (adminMiddleware on the backend) — non-admins are rejected in both.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  adminGetReviews, adminDeleteReview,
  adminGetUsers,   adminBanUser,    adminUnbanUser,
} from '../services/api';
import './AdminDashboard.css';

// ─── Ban Modal ────────────────────────────────────────────────────────────────
// Shown when the admin clicks "Ban" or "Timeout" on a user row.

function BanModal({ target, onConfirm, onCancel }) {
  const [type,     setType]     = useState('timeout'); // 'ban' | 'timeout'
  const [hours,    setHours]    = useState(24);        // Duration in hours (timeout only)
  const [reason,   setReason]   = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      type,
      reason:         reason.trim() || undefined,
      duration_hours: type === 'timeout' ? Number(hours) : undefined,
    });
  }

  return (
    <div className="adm-modal-overlay" onClick={onCancel}>
      {/* stopPropagation prevents the overlay click-to-close from firing inside the card */}
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <h3 className="adm-modal__title">Moderate: <span>{target.username}</span></h3>

        <form onSubmit={handleSubmit}>

          {/* Type toggle */}
          <div className="adm-modal__row">
            <label className="adm-modal__label">Type</label>
            <div className="adm-modal__toggle">
              <button
                type="button"
                className={`adm-modal__tog-btn ${type === 'timeout' ? 'adm-modal__tog-btn--on' : ''}`}
                onClick={() => setType('timeout')}
              >Timeout</button>
              <button
                type="button"
                className={`adm-modal__tog-btn adm-modal__tog-btn--danger ${type === 'ban' ? 'adm-modal__tog-btn--on' : ''}`}
                onClick={() => setType('ban')}
              >Permanent Ban</button>
            </div>
          </div>

          {/* Duration — only relevant for timeout */}
          {type === 'timeout' && (
            <div className="adm-modal__row">
              <label className="adm-modal__label" htmlFor="hours">Duration (hours)</label>
              <input
                id="hours"
                className="adm-modal__input"
                type="number"
                min={1}
                max={8760}
                value={hours}
                onChange={e => setHours(e.target.value)}
              />
            </div>
          )}

          {/* Optional reason — shown to the user when they try to log in */}
          <div className="adm-modal__row">
            <label className="adm-modal__label" htmlFor="reason">Reason (optional)</label>
            <input
              id="reason"
              className="adm-modal__input"
              type="text"
              placeholder="e.g. Spam, inappropriate language"
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="adm-modal__actions">
            <button type="button" className="adm-modal__cancel" onClick={onCancel}>Cancel</button>
            <button
              type="submit"
              className={`adm-modal__confirm ${type === 'ban' ? 'adm-modal__confirm--danger' : ''}`}
            >
              {type === 'ban' ? 'Ban permanently' : `Timeout ${hours}h`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tab,      setTab]     = useState('reviews'); // 'reviews' | 'users'
  const [reviews,  setReviews] = useState([]);
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null); // user object for ban modal

  // Load both datasets up front — dashboard is admin-only so both are needed
  useEffect(() => {
    Promise.allSettled([adminGetReviews(), adminGetUsers()])
      .then(([r, u]) => {
        if (r.status === 'fulfilled') setReviews(r.value.data);
        if (u.status === 'fulfilled') setUsers(u.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Review actions ───────────────────────────────────────────────────────────

  async function handleDeleteReview(reviewId) {
    try {
      await adminDeleteReview(reviewId);
      // Remove from local state immediately — no need to re-fetch
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch {}
  }

  // ── Ban / unban actions ──────────────────────────────────────────────────────

  async function handleBanConfirm(banData) {
    if (!banTarget) return;
    try {
      await adminBanUser(banTarget.id, banData);
      // Refresh users list to show updated ban status
      const { data } = await adminGetUsers();
      setUsers(data);
    } catch {}
    setBanTarget(null);
  }

  async function handleUnban(userId) {
    try {
      await adminUnbanUser(userId);
      const { data } = await adminGetUsers();
      setUsers(data);
    } catch {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // Format a date string to a short readable form
  function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Truncate long text for the review table
  function truncate(text, max = 80) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  // Determine the human-readable ban status for a user row
  function banStatus(user) {
    if (!user.ban_type) return null;
    if (user.ban_type === 'ban') return { label: 'Banned', cls: 'adm__badge--red' };
    return {
      label: `Timeout until ${fmt(user.ban_expires_at)}`,
      cls:   'adm__badge--orange',
    };
  }

  if (loading) return <div className="adm"><div className="spinner" /></div>;

  return (
    <div className="adm fade-in">
      <div className="adm__wrap">

        {/* Header */}
        <div className="adm__header">
          <div>
            <h1 className="adm__title">Admin Dashboard</h1>
            <p className="adm__sub">Moderate reviews · manage accounts</p>
          </div>
          <button className="adm__back" onClick={() => navigate('/')}>← Back to site</button>
        </div>

        {/* Tab bar */}
        <div className="adm__tabs">
          <button
            className={`adm__tab ${tab === 'reviews' ? 'adm__tab--active' : ''}`}
            onClick={() => setTab('reviews')}
          >
            Reviews <span className="adm__tab-count">{reviews.length}</span>
          </button>
          <button
            className={`adm__tab ${tab === 'users' ? 'adm__tab--active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users <span className="adm__tab-count">{users.length}</span>
          </button>
        </div>

        {/* ── Reviews tab ── */}
        {tab === 'reviews' && (
          <div className="adm__panel">
            {reviews.length === 0 ? (
              <p className="adm__empty">No reviews yet.</p>
            ) : (
              <table className="adm__table">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>User</th>
                    <th>Review</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(review => (
                    <tr key={review.id}>
                      {/* Clicking the movie title navigates to that movie's page */}
                      <td>
                        <button
                          className="adm__link"
                          onClick={() => navigate(`/movie/${review.omdb_id}`)}
                        >
                          {review.movie_title}
                        </button>
                      </td>
                      <td className="adm__cell--muted">{review.username}</td>
                      <td className="adm__cell--review">{truncate(review.comment)}</td>
                      <td className="adm__cell--muted">{fmt(review.created_at)}</td>
                      <td>
                        <button
                          className="adm__delete-btn"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Delete this review"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <div className="adm__panel">
            {users.length === 0 ? (
              <p className="adm__empty">No users found.</p>
            ) : (
              <table className="adm__table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const status = banStatus(u);
                    return (
                      <tr key={u.id}>
                        <td className="adm__cell--username">{u.username}</td>
                        <td className="adm__cell--muted">{u.email}</td>
                        <td>
                          {u.role === 'admin'
                            ? <span className="adm__badge adm__badge--green">Admin</span>
                            : <span className="adm__badge adm__badge--dim">User</span>
                          }
                        </td>
                        <td>
                          {status
                            ? <span className={`adm__badge ${status.cls}`}>{status.label}</span>
                            : <span className="adm__badge adm__badge--dim">Active</span>
                          }
                        </td>
                        <td className="adm__cell--muted">{fmt(u.created_at)}</td>
                        <td className="adm__cell--actions">
                          {/* Don't show moderation buttons for other admins */}
                          {u.role !== 'admin' && (
                            status
                              ? /* User is already banned — show lift button */
                                <button
                                  className="adm__unban-btn"
                                  onClick={() => handleUnban(u.id)}
                                >
                                  Lift ban
                                </button>
                              : /* User is active — show ban button */
                                <button
                                  className="adm__ban-btn"
                                  onClick={() => setBanTarget(u)}
                                >
                                  Ban / Timeout
                                </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* Ban modal — rendered when banTarget is set */}
      {banTarget && (
        <BanModal
          target={banTarget}
          onConfirm={handleBanConfirm}
          onCancel={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
