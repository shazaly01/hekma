const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth: authenticate } = require('../middleware/auth');

router.get('/all-cards', authenticate, async (req, res) => {
  try {
    const { offset = 0, limit = 1000 } = req.query;
    
    const [rows] = await pool.query(`
      SELECT 
        c.*, 
        ct.name as card_type_name, 
        dr.name as destruction_reason_name,
        e.name as employee_name,
        e.employee_number,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.nationality as employee_nationality
      FROM employee_cards c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN card_types ct ON c.card_type_id = ct.id
      LEFT JOIN destruction_reasons dr ON c.destruction_reason_id = dr.id
      ORDER BY c.issue_date DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    // Map to the shape expected by frontend (c.card_types.name, c.employees.name)
    const result = rows.map(r => {
      const { 
        card_type_name, destruction_reason_name, 
        employee_name, employee_number, employee_department, employee_job_title, employee_nationality,
        ...rest 
      } = r;
      return {
        ...rest,
        card_types: { name: card_type_name },
        destruction_reasons: { name: destruction_reason_name },
        employees: {
          name: employee_name,
          employee_number: employee_number,
          department: employee_department,
          job_title: employee_job_title,
          nationality: employee_nationality
        }
      };
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
