const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { unauthorized, forbidden } = require('../utils/errors');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Token ausente'));
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch (e) {
    next(unauthorized('Token inválido ou expirado'));
  }
}

function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), env.jwt.secret); } catch (e) { /* segue como convidado */ }
  }
  next();
}

function adminRequired(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'ADMIN') return next(forbidden('Rota exclusiva de administrador'));
  next();
}

module.exports = { authRequired, authOptional, adminRequired };
