const fs = require('fs');
const path = './routes';
const files = fs.readdirSync(path).filter(f => f.endsWith('.js'));
files.forEach(f => {
  const p = `${path}/${f}`;
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace("const { authenticate } = require('../middleware/auth');", "const { requireAuth: authenticate } = require('../middleware/auth');");
  fs.writeFileSync(p, content);
});
console.log('Fixed auth imports');
