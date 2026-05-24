const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      [[{ total_employees }]],
      [[{ active_employees }]],
      [[{ suspended_employees }]],
      [[{ valid_cards }]],
      [[{ expired_cards }]],
      [[{ destroyed_cards }]],
      [[{ expiring_this_month }]],
      [[{ new_employees_this_month }]],
      [[{ total_cards }]],
      [[{ renewals }]],
      [dept_distribution],
      [nat_distribution],
      [monthly_cards],
      [status_distribution]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total_employees FROM employees'),
      pool.query('SELECT COUNT(*) as active_employees FROM employees WHERE status = "active"'),
      pool.query('SELECT COUNT(*) as suspended_employees FROM employees WHERE status = "suspended"'),
      pool.query('SELECT COUNT(*) as valid_cards FROM employee_cards WHERE is_destroyed = false AND (expiry_date IS NULL OR expiry_date >= CURDATE())'),
      pool.query('SELECT COUNT(*) as expired_cards FROM employee_cards WHERE is_destroyed = false AND expiry_date < CURDATE()'),
      pool.query('SELECT COUNT(*) as destroyed_cards FROM employee_cards WHERE is_destroyed = true'),
      pool.query('SELECT COUNT(*) as expiring_this_month FROM employee_cards WHERE is_destroyed = false AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)'),
      pool.query('SELECT COUNT(*) as new_employees_this_month FROM employees WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'),
      pool.query('SELECT COUNT(*) as total_cards FROM employee_cards'),
      pool.query('SELECT COUNT(*) as renewals FROM employee_cards WHERE issue_type = "renewal"'),
      pool.query('SELECT department as name, COUNT(*) as value FROM employees WHERE department IS NOT NULL AND department != "" GROUP BY department ORDER BY value DESC LIMIT 10'),
      pool.query('SELECT nationality as name, COUNT(*) as value FROM employees WHERE nationality IS NOT NULL AND nationality != "" GROUP BY nationality ORDER BY value DESC LIMIT 10'),
      pool.query(`
        SELECT DATE_FORMAT(issue_date, '%Y-%m') as month, COUNT(*) as value 
        FROM employee_cards 
        WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month 
        ORDER BY month ASC
      `),
      pool.query('SELECT status as name, COUNT(*) as value FROM employees GROUP BY status')
    ]);

    const card_renewal_rate = total_cards > 0 ? Math.round((renewals / total_cards) * 100) : 0;

    res.json({
      total_employees,
      active_employees,
      suspended_employees,
      valid_cards,
      expired_cards,
      destroyed_cards,
      expiring_this_month,
      new_employees_this_month,
      total_cards,
      card_renewal_rate,
      dept_distribution,
      nat_distribution,
      monthly_cards,
      status_distribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/expiry-alerts', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.id as employee_id, e.name as employee_name, e.department,
             c.id as card_id, ct.name as card_type_name, c.expiry_date
      FROM employee_cards c
      JOIN employees e ON c.employee_id = e.id
      JOIN card_types ct ON c.card_type_id = ct.id
      WHERE c.is_destroyed = false 
        AND c.expiry_date IS NOT NULL 
        AND c.expiry_date >= CURDATE()
        AND c.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY c.expiry_date ASC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
