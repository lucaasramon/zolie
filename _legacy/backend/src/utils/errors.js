class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const notFound = (what = 'Recurso') => new AppError(what + ' não encontrado', 404, 'NOT_FOUND');
const unauthorized = (m = 'Credenciais inválidas') => new AppError(m, 401, 'UNAUTHORIZED');
const forbidden = (m = 'Acesso não permitido') => new AppError(m, 403, 'FORBIDDEN');
const conflict = m => new AppError(m, 409, 'CONFLICT');

module.exports = { AppError, notFound, unauthorized, forbidden, conflict };
