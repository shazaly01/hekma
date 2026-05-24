const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lovable_app',
  });

  try {
    console.log('Adding new columns to card_types table...');

    const [cols] = await conn.query("SHOW COLUMNS FROM card_types");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('website_text')) {
      await conn.query("ALTER TABLE card_types ADD COLUMN website_text VARCHAR(255) DEFAULT 'www.futuretech.sa'");
      console.log('Added website_text column successfully.');
    } else {
      console.log('website_text column already exists.');
    }

    if (!colNames.includes('back_instructions')) {
      await conn.query("ALTER TABLE card_types ADD COLUMN back_instructions TEXT");
      console.log('Added back_instructions column successfully.');
    } else {
      console.log('back_instructions column already exists.');
    }

    if (!colNames.includes('card_title')) {
      await conn.query("ALTER TABLE card_types ADD COLUMN card_title VARCHAR(255) DEFAULT 'بطاقة موظف'");
      console.log('Added card_title column successfully.');
    } else {
      console.log('card_title column already exists.');
    }

    if (!colNames.includes('company_name')) {
      await conn.query("ALTER TABLE card_types ADD COLUMN company_name VARCHAR(255) DEFAULT 'شركة المستقبل للتقنية'");
      console.log('Added company_name column successfully.');
    } else {
      console.log('company_name column already exists.');
    }

    // Initialize existing rows with default Arabic instructions if null
    await conn.query(`UPDATE card_types SET back_instructions = 'هذه البطاقة ملك للشركة. في حال العثور عليها يرجى إعادتها لأقرب فرع.\\nالهاتف: 920000000 | البريد: info@company.com' WHERE back_instructions IS NULL`);

    console.log('Schema update complete.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await conn.end();
  }
}

run();
