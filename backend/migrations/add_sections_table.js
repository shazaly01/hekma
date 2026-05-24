const pool = require('./config/db');

async function addSectionsTable() {
  try {
    console.log('Creating sections table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      )
    `);
    console.log('sections table created successfully.');
  } catch (error) {
    console.error('Error creating sections table:', error.message);
  }

  console.log('Schema update complete.');
  process.exit(0);
}

addSectionsTable();
