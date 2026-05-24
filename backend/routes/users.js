const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Protect user management routes
router.use(requireAuth);
router.use(requireRole(['admin']));

// Get all users with their roles
router.get('/roles', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.created_at, u.is_super_admin, ur.role, ur.id as role_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Assign role
router.post('/roles/assign', async (req, res) => {
  try {
    const { user_id, role } = req.body;
    if (!user_id || !role) return res.status(400).json({ error: 'Missing parameters' });

    // Check if user is super admin
    const [userRows] = await pool.query('SELECT is_super_admin FROM users WHERE id = ?', [user_id]);
    if (userRows.length > 0 && userRows[0].is_super_admin) {
      return res.status(403).json({ error: 'لا يمكن تغيير دور المدير العام (Super Admin)' });
    }

    // Check if user already has a role
    const [existing] = await pool.query('SELECT id FROM user_roles WHERE user_id = ?', [user_id]);
    
    if (existing.length > 0) {
      await pool.query('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, user_id]);
    } else {
      const { v4: uuidv4 } = require('uuid');
      await pool.query('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuidv4(), user_id, role]);
    }
    
    res.json({ success: true, message: 'Role assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error assigning role' });
  }
});

// Remove role
router.post('/roles/remove', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    await pool.query('DELETE FROM user_roles WHERE user_id = ?', [user_id]);
    res.json({ success: true, message: 'Role removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing role' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is super admin
    const [userRows] = await pool.query('SELECT is_super_admin FROM users WHERE id = ?', [userId]);
    if (userRows.length > 0 && userRows[0].is_super_admin) {
      return res.status(403).json({ error: 'لا يمكن حذف حساب المدير العام (Super Admin)' });
    }

    // user_roles and profiles should have ON DELETE CASCADE or be deleted manually
    await pool.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
