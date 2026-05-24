const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, is_super_admin }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    next();
  };
}

/**
 * requireSuperAdmin — يسمح فقط لحساب السوبر أدمن بتنفيذ العملية.
 * يُستخدم لحماية عمليات الحذف الحساسة (حذف موظف، حذف بطاقة).
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.is_super_admin) {
    return res.status(403).json({
      error: 'هذه العملية مخصصة للمدير العام (Super Admin) فقط'
    });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireSuperAdmin };
