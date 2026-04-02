// ─────────────────────────────────────────────────────────────────────────────
// controllers/adminController.js — HTTP handlers for admin moderation routes
//
// All handlers here are protected by authMiddleware + adminMiddleware,
// so req.user is guaranteed to be an admin.
// ─────────────────────────────────────────────────────────────────────────────

const adminRepo = require('../repositories/adminRepo');

// GET /api/admin/reviews — all reviews across all movies
async function getAllReviews(req, res) {
  try {
    const reviews = await adminRepo.getAllReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/admin/reviews/:reviewId — delete any review by ID
async function deleteReview(req, res) {
  try {
    await adminRepo.deleteReviewById(Number(req.params.reviewId));
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/users — all users with current ban status
async function getAllUsers(req, res) {
  try {
    const users = await adminRepo.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/admin/ban/:userId — issue a ban or timeout
// Body: { type: 'ban'|'timeout', reason?: string, duration_hours?: number }
// duration_hours is only used when type === 'timeout'. Omitting it or setting
// it to 0 makes the timeout permanent (treated as a ban).
async function banUser(req, res) {
  try {
    const targetId = Number(req.params.userId);
    const { type, reason, duration_hours } = req.body;

    if (!['ban', 'timeout'].includes(type)) {
      return res.status(400).json({ error: 'type must be "ban" or "timeout".' });
    }

    // Prevent admins from banning themselves
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'You cannot ban yourself.' });
    }

    // Compute expiry: null = permanent, otherwise offset from now
    let expires_at = null;
    if (type === 'timeout' && duration_hours > 0) {
      expires_at = new Date(Date.now() + duration_hours * 3600 * 1000);
    }

    await adminRepo.banUser({
      user_id:   targetId,
      admin_id:  req.user.id,
      type,
      reason:    reason || null,
      expires_at,
    });

    const label = type === 'ban' ? 'banned' : `timed out for ${duration_hours}h`;
    res.json({ message: `User ${label}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/admin/ban/:userId — lift an active ban or timeout
async function unbanUser(req, res) {
  try {
    await adminRepo.unbanUser(Number(req.params.userId));
    res.json({ message: 'Ban lifted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllReviews, deleteReview, getAllUsers, banUser, unbanUser };
