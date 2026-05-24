const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 500 } = req.query;
    const [rows] = await pool.query('SELECT * FROM qr_scans ORDER BY scanned_at DESC LIMIT ?', [parseInt(limit)]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
