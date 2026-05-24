require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS card_type_pins (
        card_type_id VARCHAR(36) PRIMARY KEY,
        is_enabled BOOLEAN DEFAULT FALSE,
        pin_code VARCHAR(20),
        created_by VARCHAR(36),
        FOREIGN KEY (card_type_id) REFERENCES card_types(id) ON DELETE CASCADE
      )
    `);
    console.log('card_type_pins table created/verified OK');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
