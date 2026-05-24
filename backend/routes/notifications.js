const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

// Get all notifications for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    // Convert is_read 1/0 to boolean
    const notifications = rows.map(r => ({ ...r, is_read: !!r.is_read }));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [userId]
    );
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all
router.delete('/all', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user;
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete one
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
