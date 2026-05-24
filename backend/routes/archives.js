const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.query;
    let query = 'SELECT * FROM employee_archives';
    const params = [];
    if (employee_id) {
       query += ' WHERE employee_id = ?';
       params.push(employee_id);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { employee_id, file_name, file_url, file_type } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO employee_archives (id, employee_id, file_name, file_url, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, employee_id, file_name || null, file_url, file_type || null, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM employee_archives WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM employee_archives WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
