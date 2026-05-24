const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'lovable_app'});
  try {
    await conn.query(`ALTER TABLE departments ADD COLUMN color VARCHAR(50) DEFAULT '#1a5b9c'`);
    console.log('Column added');
  } catch(e) {
    console.log(e.message);
  }
  await conn.end();
}
run().catch(console.error);
