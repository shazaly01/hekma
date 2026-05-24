const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const allowedTables = [
  'departments', 'job_titles', 'nationalities', 'card_types', 
  'destruction_reasons', 'employees', 'employee_cards', 'audit_logs', 'qr_scans'
];

// Protect all DB backup routes - only admin can access
router.use(requireAuth);
router.use(requireRole(['admin']));

// GET all rows (with pagination support for exportBackup)
router.get('/:table', async (req, res) => {
  try {
    const table = req.params.table;
    if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
    
    const limit = parseInt(req.query.limit) || 1000;
    const offset = parseInt(req.query.offset) || 0;

    const [rows] = await pool.query(`SELECT * FROM ?? LIMIT ? OFFSET ?`, [table, limit, offset]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all rows
router.delete('/:table/all', async (req, res) => {
  let conn;
  try {
    const table = req.params.table;
    if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
    
    conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(`DELETE FROM ??`, [table]);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();
    
    res.json({ success: true });
  } catch (error) {
    if (conn) {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      conn.release();
    }
    res.status(500).json({ error: error.message });
  }
});

// POST bulk insert/upsert
router.post('/:table/bulk', async (req, res) => {
  try {
    const table = req.params.table;
    const { data, mode } = req.body;
    if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
    if (!Array.isArray(data) || data.length === 0) return res.json({ success: true });

    const columns = Object.keys(data[0]);
    const values = data.map(row => columns.map(col => {
      let val = row[col];
      // Convert true/false to 1/0 for MySQL boolean (tinyint) fields
      if (typeof val === 'boolean') val = val ? 1 : 0;
      // Convert objects (like json details) to string
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) val = JSON.stringify(val);
      return val === undefined ? null : val;
    }));
    
    if (mode === 'insert_ignore') {
      await pool.query(`INSERT IGNORE INTO ?? (??) VALUES ?`, [table, columns, values]);
    } else {
      const updateFields = columns.map(col => `${col} = VALUES(${col})`).join(', ');
      await pool.query(`INSERT INTO ?? (??) VALUES ? ON DUPLICATE KEY UPDATE ${updateFields}`, [table, columns, values]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
