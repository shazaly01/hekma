const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    // Also include details limit filter?
    const { entity_id, entity_type, limit } = req.query;
    
    let query = 'SELECT * FROM audit_logs';
    let params = [];
    if (entity_id || entity_type) {
      query += ' WHERE';
      if (entity_id) { query += ' entity_id = ?'; params.push(entity_id); }
      if (entity_id && entity_type) query += ' AND';
      if (entity_type) { query += ' entity_type = ?'; params.push(entity_type); }
    }
    
    query += ' ORDER BY created_at DESC';
    if (limit) {
       query += ' LIMIT ?';
       params.push(parseInt(limit));
    } else {
       query += ' LIMIT 500';
    }

    const [specificRows] = await pool.query(query, params);
    
    res.json(entity_id || entity_type ? specificRows : rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { action, entity_type, entity_id, user_id, user_email, details } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, user_email, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, action, entity_type, entity_id || null, user_id || req.user.id, user_email || req.user.email, details ? JSON.stringify(details) : null]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
