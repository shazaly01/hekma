const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

// Helper: get an app_setting value
async function getAppSetting(key) {
  const [[row]] = await pool.query('SELECT value FROM app_settings WHERE `key` = ?', [key]);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

router.get('/employee/:id/pin-status', async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Check global pin first
    const globalEnabled = await getAppSetting('global_pin_enabled');
    if (globalEnabled === true) {
      return res.json({ pin_required: true, global: true });
    }

    // 2) Check per-card-type pin
    const [rows] = await pool.query(`
      SELECT p.is_enabled
      FROM employee_cards c
      JOIN card_type_pins p ON c.card_type_id = p.card_type_id
      WHERE c.employee_id = ? AND c.is_destroyed = false
      ORDER BY c.issue_date DESC LIMIT 1
    `, [id]);

    if (rows.length === 0 || !rows[0].is_enabled) {
      return res.json({ pin_required: false });
    }
    res.json({ pin_required: true, global: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/employee/:id/verify-pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    // 1) Check global pin first
    const globalEnabled = await getAppSetting('global_pin_enabled');
    if (globalEnabled === true) {
      const globalPin = await getAppSetting('global_pin_code');
      const match = globalPin && String(globalPin) === String(pin);
      return res.json({ success: match });
    }

    // 2) Check per-card-type pin
    const [rows] = await pool.query(`
      SELECT p.pin_code
      FROM employee_cards c
      JOIN card_type_pins p ON c.card_type_id = p.card_type_id
      WHERE c.employee_id = ? AND c.is_destroyed = false
      ORDER BY c.issue_date DESC LIMIT 1
    `, [id]);

    if (rows.length > 0 && String(rows[0].pin_code) === String(pin)) {
      return res.json({ success: true });
    }
    res.json({ success: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [empRows] = await pool.query('SELECT name, english_name, employee_number, department, section, job_title, nationality, status, photo_url FROM employees WHERE id = ?', [id]);
    if (empRows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const employee = empRows[0];
    
    const [cardRows] = await pool.query(`
      SELECT c.issue_date, c.expiry_date, ct.name as card_type_name, ct.logo_url as card_type_logo
      FROM employee_cards c
      JOIN card_types ct ON c.card_type_id = ct.id
      WHERE c.employee_id = ? AND c.is_destroyed = false
      ORDER BY c.issue_date DESC LIMIT 1
    `, [id]);
    
    if (cardRows.length > 0) {
      Object.assign(employee, cardRows[0]);
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/log-qr-scan', async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    const id = uuidv4();

    await pool.query(
      'INSERT INTO qr_scans (id, employee_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [id, employee_id, ip, ua]
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

module.exports = router;

