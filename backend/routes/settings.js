const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

const tables = {
  '/departments': 'departments',
  '/job-titles': 'job_titles',
  '/nationalities': 'nationalities',
  '/card-types': 'card_types',
  '/destruction-reasons': 'destruction_reasons'
};

// Sections specific endpoints
router.get('/sections', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sections ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sections', authenticate, async (req, res) => {
  try {
    const { name, department_id } = req.body;
    if (!name || !department_id) return res.status(400).json({ error: 'Name and department_id are required' });
    const id = uuidv4();
    await pool.query('INSERT INTO sections (id, name, department_id) VALUES (?, ?, ?)', [id, name, department_id]);
    const [rows] = await pool.query('SELECT * FROM sections WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sections/:id', authenticate, async (req, res) => {
  try {
    const { name, department_id } = req.body;
    let query = 'UPDATE sections SET ';
    const params = [];
    if (name !== undefined) { query += 'name = ?, '; params.push(name); }
    if (department_id !== undefined) { query += 'department_id = ?, '; params.push(department_id); }
    if (params.length === 0) return res.json({});
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(req.params.id);
    await pool.query(query, params);
    const [rows] = await pool.query('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sections/all', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sections');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sections/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sections WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


for (const [path, table] of Object.entries(tables)) {
  // Get all
  router.get(path, authenticate, async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Create
  router.post(path, authenticate, async (req, res) => {
    try {
      if (table === 'card_types') {
        const { name, logo_url, website_text, back_instructions, card_title, company_name } = req.body;
        const id = uuidv4();
        await pool.query(
          `INSERT INTO ${table} (id, name, logo_url, website_text, back_instructions, card_title, company_name) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
          [id, name, logo_url || null, website_text || null, back_instructions || null, card_title || null, company_name || null]
        );
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        res.status(201).json(rows[0]);
      } else if (table === 'departments') {
        const { name, color } = req.body;
        const id = uuidv4();
        await pool.query(`INSERT INTO ${table} (id, name, color) VALUES (?, ?, ?)`, [id, name, color || '#1a5b9c']);
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        res.status(201).json(rows[0]);
      } else {
        const { name } = req.body;
        const id = uuidv4();
        await pool.query(`INSERT INTO ${table} (id, name) VALUES (?, ?)`, [id, name]);
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        res.status(201).json(rows[0]);
      }
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Update
  router.put(`${path}/:id`, authenticate, async (req, res) => {
    try {
      if (table === 'card_types') {
        const { name, logo_url, website_text, back_instructions, card_title, company_name } = req.body;
        let query = `UPDATE ${table} SET `;
        const params = [];
        if (name !== undefined) { query += 'name = ?, '; params.push(name); }
        if (logo_url !== undefined) { query += 'logo_url = ?, '; params.push(logo_url); }
        if (website_text !== undefined) { query += 'website_text = ?, '; params.push(website_text); }
        if (back_instructions !== undefined) { query += 'back_instructions = ?, '; params.push(back_instructions); }
        if (card_title !== undefined) { query += 'card_title = ?, '; params.push(card_title); }
        if (company_name !== undefined) { query += 'company_name = ?, '; params.push(company_name); }
        if (params.length === 0) return res.json({});
        query = query.slice(0, -2) + ' WHERE id = ?';
        params.push(req.params.id);
        await pool.query(query, params);
      } else if (table === 'departments') {
        const { name, color } = req.body;
        let query = `UPDATE ${table} SET `;
        const params = [];
        if (name !== undefined) { query += 'name = ?, '; params.push(name); }
        if (color !== undefined) { query += 'color = ?, '; params.push(color); }
        if (params.length === 0) return res.json({});
        query = query.slice(0, -2) + ' WHERE id = ?';
        params.push(req.params.id);
        await pool.query(query, params);
      } else {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        await pool.query(`UPDATE ${table} SET name = ? WHERE id = ?`, [name, req.params.id]);
      }
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Delete all — must be registered BEFORE /:id to avoid being captured by it
  router.delete(`${path}/all`, authenticate, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table}`);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Delete one
  router.delete(`${path}/:id`, authenticate, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Bulk Post
  router.post(`${path}/bulk`, authenticate, async (req, res) => {
    try {
      const { data, mode } = req.body; // mode can be 'upsert' or 'insert_ignore'
      if (!data || data.length === 0) return res.json({ success: true });
      for (const item of data) {
         if (table === 'card_types') {
            await pool.query(
              `INSERT IGNORE INTO ${table} (id, name, logo_url, website_text, back_instructions, card_title, company_name) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), logo_url=VALUES(logo_url), website_text=VALUES(website_text), back_instructions=VALUES(back_instructions), card_title=VALUES(card_title), company_name=VALUES(company_name)`, 
              [item.id, item.name, item.logo_url, item.website_text, item.back_instructions, item.card_title, item.company_name]
            );
         } else {
            await pool.query(`INSERT IGNORE INTO ${table} (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`, [item.id, item.name]);
         }
      }
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

// Card types admin — includes PIN settings via LEFT JOIN
router.get('/card-types/admin', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ct.*, 
             COALESCE(ctp.is_enabled, false) AS pin_enabled,
             ctp.pin_code
      FROM card_types ct
      LEFT JOIN card_type_pins ctp ON ct.id = ctp.card_type_id
      ORDER BY ct.created_at DESC
    `);
    // Convert is_enabled 1/0 to boolean
    const result = rows.map(r => ({ ...r, pin_enabled: !!r.pin_enabled }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Set / update PIN for a card type (called by frontend useUpdateCardTypePin)
router.put('/card-types/:id/pin', authenticate, async (req, res) => {
  try {
    const { pin_enabled, pin_code } = req.body;
    const cardTypeId = req.params.id;
    await pool.query(
      `INSERT INTO card_type_pins (card_type_id, is_enabled, pin_code, created_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), pin_code = VALUES(pin_code)`,
      [cardTypeId, pin_enabled ? 1 : 0, pin_code || null, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// App Settings specific endpoints
router.get('/app-settings/:key', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT value FROM app_settings WHERE `key` = ?', [req.params.key]);
    if (rows.length === 0) return res.json({ value: null });
    res.json({ value: rows[0].value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/app-settings/:key', authenticate, async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query(
      'INSERT INTO app_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [req.params.key, JSON.stringify(value)]
    );
    res.json({ success: true, value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Card Type PINs
router.put('/card-type-pins/:id', authenticate, async (req, res) => {
  try {
    const { is_enabled, pin_code } = req.body;
    await pool.query(
      'INSERT INTO card_type_pins (card_type_id, is_enabled, pin_code, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), pin_code = VALUES(pin_code)',
      [req.params.id, is_enabled, pin_code, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
