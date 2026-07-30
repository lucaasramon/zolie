const { AppError } = require('../utils/errors');
const { env } = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Rota não encontrada', code: 'ROUTE_NOT_FOUND' } });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err && err.name === 'ZodError') {
    return res.status(422).json({
      error: { message: 'Dados inválidos', code: 'VALIDATION_ERROR', issues: err.issues }
    });
  }
  const status = err instanceof AppError ? err.status : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  if (status === 500) console.error(err);
  res.status(status).json({
    error: {
      message: status === 500 && env.nodeEnv === 'production' ? 'Erro interno' : err.message,
      code
    }
  });
}

module.exports = { errorHandler, notFoundHandler };
