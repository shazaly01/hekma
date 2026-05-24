const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Lookup user in a users table or profiles
    // In Supabase, auth is handled separately inside auth.users.
    // Here we'll need to create a `users` table manually for email/password.
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Include role if available
    const [roleRows] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
    const role = roleRows.length > 0 ? roleRows[0].role : 'viewer';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: role, is_super_admin: !!user.is_super_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: role,
        is_super_admin: !!user.is_super_admin
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me — refresh current user's data & role from DB
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, is_super_admin FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    const [roleRows] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
    const role = roleRows.length > 0 ? roleRows[0].role : null;
    // Issue a fresh token
    const token = jwt.sign(
      { id: user.id, email: user.email, role, is_super_admin: !!user.is_super_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({
      access_token: token,
      user: { id: user.id, email: user.email, role, is_super_admin: !!user.is_super_admin }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register — admin only creates new users
router.post('/register', requireAuth, requireRole(['admin']), async (req, res) => {
  const { email, password, role, display_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email/password required' });

  // منع إنشاء مستخدم باسم super@admin.com عبر هذا المسار
  if (email.trim().toLowerCase() === 'super@admin.com') {
    return res.status(403).json({ error: 'لا يمكن إنشاء مستخدم بهذا الاسم' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [userId, email, hashedPassword]);
    
    // Default role viewer if not specified; validate against allowed roles
    const allowedRoles = ['admin', 'editor', 'data_entry', 'viewer'];
    const userRole = allowedRoles.includes(role) ? role : 'viewer';
    await pool.query('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuidv4(), userId, userRole]);

    // Insert profile — use provided display_name or fallback to email prefix
    const name = display_name || email.split('@')[0];
    await pool.query('INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, ?)', [uuidv4(), userId, name]);

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
