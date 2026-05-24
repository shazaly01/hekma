const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate, requireSuperAdmin } = require('../middleware/auth');

// Get all cards for an employee
router.get('/', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.query;
    let query = `
      SELECT c.*, 
        ct.name as card_type_name, ct.logo_url as card_type_logo,
        ct.website_text, ct.back_instructions, ct.card_title, ct.company_name,
        dr.name as destruction_reason_name
      FROM employee_cards c
      LEFT JOIN card_types ct ON c.card_type_id = ct.id
      LEFT JOIN destruction_reasons dr ON c.destruction_reason_id = dr.id
    `;
    const params = [];
    if (employee_id) {
      query += ' WHERE c.employee_id = ?';
      params.push(employee_id);
    }
    query += ' ORDER BY c.issue_date DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all cards
router.get('/all', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT c.*, 
        ct.name as card_type_name, ct.logo_url as card_type_logo,
        ct.website_text, ct.back_instructions, ct.card_title, ct.company_name,
        dr.name as destruction_reason_name
      FROM employee_cards c
      LEFT JOIN card_types ct ON c.card_type_id = ct.id
      LEFT JOIN destruction_reasons dr ON c.destruction_reason_id = dr.id
      ORDER BY c.issue_date DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new card
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      employee_id, card_type_id, issue_type, issue_date, expiry_date,
      reason, old_card_returned, non_return_reason, notes
    } = req.body;
    const id = uuidv4();
    await pool.query(
      `INSERT INTO employee_cards 
        (id, employee_id, card_type_id, issue_type, issue_date, expiry_date, reason, old_card_returned, non_return_reason, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, employee_id, card_type_id, issue_type, issue_date,
        expiry_date || null, reason || null,
        old_card_returned ? 1 : 0,
        non_return_reason || null,
        notes || null
      ]
    );
    const [rows] = await pool.query('SELECT * FROM employee_cards WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a card
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    let query = 'UPDATE employee_cards SET ';
    const params = [];
    const allowed = ['is_destroyed', 'destruction_date', 'destruction_reason_id', 'old_card_returned', 'non_return_reason', 'notes', 'expiry_date'];
    
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        query += `${key} = ?, `;
        params.push(updates[key]);
      }
    }
    if (params.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
    
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(req.params.id);
    
    await pool.query(query, params);
    const [rows] = await pool.query('SELECT * FROM employee_cards WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete card — Super Admin only
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM employee_cards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upsert
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || data.length === 0) return res.json({ success: true });
    
    for (const item of data) {
      await pool.query(
        `INSERT INTO employee_cards (id, employee_id, card_type_id, issue_type, issue_date, expiry_date, is_destroyed, destruction_date, destruction_reason_id, old_card_returned, non_return_reason, reason, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         is_destroyed=VALUES(is_destroyed), destruction_date=VALUES(destruction_date), destruction_reason_id=VALUES(destruction_reason_id), old_card_returned=VALUES(old_card_returned), non_return_reason=VALUES(non_return_reason), notes=VALUES(notes), expiry_date=VALUES(expiry_date)`,
         [item.id, item.employee_id, item.card_type_id, item.issue_type, item.issue_date, item.expiry_date || null, item.is_destroyed || false, item.destruction_date || null, item.destruction_reason_id || null, item.old_card_returned || null, item.non_return_reason || null, item.reason || null, item.notes || null, item.created_at]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
