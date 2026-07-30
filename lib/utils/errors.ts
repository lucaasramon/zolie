export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (what = 'Recurso') => new AppError(`${what} não encontrado`, 404, 'NOT_FOUND');
export const unauthorized = (m = 'Credenciais inválidas') => new AppError(m, 401, 'UNAUTHORIZED');
export const forbidden = (m = 'Acesso não permitido') => new AppError(m, 403, 'FORBIDDEN');
export const conflict = (m: string) => new AppError(m, 409, 'CONFLICT');
