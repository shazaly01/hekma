const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT display_name FROM profiles WHERE user_id = ?', [req.user.id]);
    res.json(rows[0] || { display_name: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { display_name } = req.body;
    const [existing] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    
    if (existing.length > 0) {
      await pool.query('UPDATE profiles SET display_name = ? WHERE user_id = ?', [display_name, req.user.id]);
    } else {
      const id = uuidv4();
      await pool.query('INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, ?)', [id, req.user.id, display_name]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT display_name FROM profiles WHERE user_id = ?', [req.params.userId]);
    res.json(rows[0] || { display_name: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
