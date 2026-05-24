const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate, requireSuperAdmin } = require('../middleware/auth');

// Get all employees (paginated)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, department, section, page = 1, pageSize = 12 } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    let query = `
      SELECT e.*, 
        (SELECT expiry_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as expiry_date,
        (SELECT issue_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as issue_date,
        (SELECT card_type_id FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as active_card_type_id
      FROM employees e WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM employees e WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (e.name LIKE ? OR e.english_name LIKE ? OR e.employee_number LIKE ? OR e.passport_number LIKE ?)';
      countQuery += ' AND (e.name LIKE ? OR e.english_name LIKE ? OR e.employee_number LIKE ? OR e.passport_number LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    if (department && department !== 'all') {
      query += ' AND e.department = ?';
      countQuery += ' AND e.department = ?';
      params.push(department);
    }
    if (section && section !== 'all') {
      query += ' AND e.section = ?';
      countQuery += ' AND e.section = ?';
      params.push(section);
    }

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    
    const [countRows] = await pool.query(countQuery, params);
    const totalCount = countRows[0].total;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    res.json({ employees: rows, totalCount, pageSize: limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees (no pagination)
router.get('/all', authenticate, async (req, res) => {
  try {
    const { search, department, section } = req.query;
    let query = `
      SELECT e.*, 
        (SELECT expiry_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as expiry_date,
        (SELECT issue_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as issue_date,
        (SELECT card_type_id FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as active_card_type_id
      FROM employees e WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (e.name LIKE ? OR e.english_name LIKE ? OR e.employee_number LIKE ? OR e.passport_number LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    if (department && department !== 'all') {
      query += ' AND e.department = ?';
      params.push(department);
    }
    if (section && section !== 'all') {
      query += ' AND e.section = ?';
      params.push(section);
    }

    query += ' ORDER BY e.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee names by IDs
router.get('/names', authenticate, async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length === 0) return res.json([]);
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(`SELECT id, name FROM employees WHERE id IN (${placeholders})`, ids);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, 
        (SELECT expiry_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as expiry_date,
        (SELECT issue_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as issue_date,
        (SELECT card_type_id FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as active_card_type_id
      FROM employees e WHERE e.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, english_name, employee_number, department, section, job_title, nationality, passport_number, card_number, status, photo_url } = req.body;
    
    if (!employee_number || employee_number.trim() === '') {
      return res.status(400).json({ error: 'Employee number is required' });
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO employees (id, name, english_name, employee_number, department, section, job_title, nationality, passport_number, card_number, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, english_name || null, employee_number, department || null, section || null, job_title || null, nationality || null, passport_number || null, card_number || null, status || 'active', photo_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'الرقم الوظيفي مكرر بالفعل لموظف آخر' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Bulk Insert Employees
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // Validate that all have employee number
    for (const emp of data) {
      if (!emp.employee_number || emp.employee_number.trim() === '') {
        return res.status(400).json({ error: `الرقم الوظيفي مطلوب في كل الأسطر (${emp.name || 'بدون اسم'})` });
      }
    }

    const values = data.map(emp => [
      emp.id || uuidv4(),
      emp.name, 
      emp.english_name || null,
      emp.employee_number, 
      emp.department || null, 
      emp.section || null,
      emp.job_title || null, 
      emp.nationality || null, 
      emp.passport_number || null, 
      emp.card_number || null, 
      emp.status || 'active', 
      emp.photo_url || null
    ]);
    const [result] = await pool.query(
      'INSERT INTO employees (id, name, english_name, employee_number, department, section, job_title, nationality, passport_number, card_number, status, photo_url) VALUES ?',
      [values]
    );
    // Return the inserted data array to match frontend expectations
    res.status(201).json(data);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Duplicate employee number detected in batch' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update employee
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'english_name', 'employee_number', 'department', 'section', 'job_title', 'nationality', 'passport_number', 'card_number', 'status', 'photo_url'];
    
    if (updates.employee_number !== undefined && (!updates.employee_number || updates.employee_number.trim() === '')) {
      return res.status(400).json({ error: 'Employee number cannot be empty' });
    }

    let query = 'UPDATE employees SET ';
    const queryParams = [];
    
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        query += `${key} = ?, `;
        queryParams.push(updates[key]);
      }
    }
    
    if (queryParams.length === 0) return res.status(400).json({ error: 'No valid fields' });
    
    query = query.slice(0, -2) + ' WHERE id = ?';
    queryParams.push(req.params.id);
    
    await pool.query(query, queryParams);
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'الرقم الوظيفي مكرر بالفعل لموظف آخر' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
// Delete employee — Super Admin only
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
