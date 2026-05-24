const pool = require('./config/db');

async function addColumns() {
  try {
    console.log('Adding columns to employees table...');
    await pool.query('ALTER TABLE employees ADD COLUMN english_name VARCHAR(255) DEFAULT NULL;');
    console.log('Added english_name column successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('english_name column already exists. Skipping...');
    } else {
      console.error('Error adding english_name column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE employees ADD COLUMN section VARCHAR(255) DEFAULT NULL;');
    console.log('Added section column successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('section column already exists. Skipping...');
    } else {
      console.error('Error adding section column:', error.message);
    }
  }

  console.log('Schema update complete.');
  process.exit(0);
}

addColumns();
