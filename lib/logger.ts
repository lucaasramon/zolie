type LogContext = Record<string, unknown>;

// Wrapper único de logging. Hoje escreve em console; para observabilidade em produção,
// troque as implementações abaixo por chamadas ao Sentry (Sentry.captureException / addBreadcrumb)
// sem alterar quem consome `logger` no resto do app.
export const logger = {
  info(message: string, context?: LogContext) {
    console.log(`[info] ${message}`, context ?? '');
  },
  warn(message: string, context?: LogContext) {
    console.warn(`[warn] ${message}`, context ?? '');
  },
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(`[error] ${message}`, error, context ?? '');
  },
};
