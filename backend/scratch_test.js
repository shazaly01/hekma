const pool = require('./config/db');

async function test() {
  try {
    const [emp] = await pool.query('SELECT e.*, (SELECT expiry_date FROM employee_cards c WHERE c.employee_id = e.id AND c.is_destroyed = false ORDER BY c.created_at DESC LIMIT 1) as expiry_date FROM employees e LIMIT 1');
    console.log('Employees OK:', emp);
    
    const [dep] = await pool.query('SELECT * FROM departments LIMIT 1');
    console.log('Departments OK:', dep);
    
    const [job] = await pool.query('SELECT * FROM job_titles LIMIT 1');
    console.log('Job Titles OK:', job);
  } catch (err) {
    console.error('DB ERROR:', err);
  }
  process.exit();
}

test();
