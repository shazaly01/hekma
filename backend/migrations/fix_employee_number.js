const pool = require('./config/db');

async function checkAndFix() {
  try {
    // 1. Check for NULL or Empty values
    const [nullRows] = await pool.query('SELECT id, name FROM employees WHERE employee_number IS NULL OR employee_number = ""');
    if (nullRows.length > 0) {
      console.log('⚠️  found following employees without employee number:');
      console.table(nullRows);
      console.log('--- Fixing them with temporary placeholders ---');
      for (const row of nullRows) {
        const tempNum = `EMP_TEMP_${Math.floor(Math.random() * 100000)}`;
        await pool.query('UPDATE employees SET employee_number = ? WHERE id = ?', [tempNum, row.id]);
        console.log(`Updated employee ${row.name} to temporary number ${tempNum}`);
      }
    } else {
      console.log('✅ No NULL or empty employee numbers found.');
    }

    // 2. Check for Duplicate values
    const [dupRows] = await pool.query(`
      SELECT employee_number, COUNT(*) as count 
      FROM employees 
      WHERE employee_number IS NOT NULL AND employee_number != ""
      GROUP BY employee_number 
      HAVING count > 1
    `);
    
    if (dupRows.length > 0) {
      console.log('⚠️  found duplicate employee numbers:');
      console.table(dupRows);
      console.log('Please fix these duplicates manually before continuing');
      return;
    } else {
      console.log('✅ No duplicate employee numbers found.');
    }

    // 3. Apply constraints
    console.log('Applying NOT NULL and UNIQUE constraints...');
    
    // First remove old constraint if exists (just in case index already exists by some chance, not normal with current schema)
    try {
      await pool.query('ALTER TABLE employees DROP INDEX idx_employees_employee_number_unique');
    } catch (e) {
      // ignore if it doesn't exist
    }

    await pool.query('ALTER TABLE employees MODIFY employee_number VARCHAR(100) NOT NULL');
    await pool.query('ALTER TABLE employees ADD CONSTRAINT idx_employees_employee_number_unique UNIQUE (employee_number)');

    console.log('🎉 Successfully added NOT NULL and UNIQUE constraints to employees.employee_number');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error applying DB changes:', err);
    process.exit(1);
  }
}

checkAndFix();
