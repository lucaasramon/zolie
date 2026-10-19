type LogContext = Record<string, unknown>;

interface ErrorOpts {
  /**
   * `false` quando quem chama já manda um alerta mais completo para o WhatsApp
   * (ex: falha de pagamento no checkout, com os dados da cliente) — evita aviso duplicado.
   */
  alertar?: boolean;
}

// Wrapper único de logging. Hoje escreve em console; para observabilidade em produção,
// troque as implementações abaixo por chamadas ao Sentry (Sentry.captureException / addBreadcrumb)
// sem alterar quem consome `logger` no resto do app.
//
// Uso exclusivo do servidor: `error` também avisa o grupo de Alertas no WhatsApp.
export const logger = {
  info(message: string, context?: LogContext) {
    console.log(`[info] ${message}`, context ?? '');
  },
  warn(message: string, context?: LogContext) {
    console.warn(`[warn] ${message}`, context ?? '');
  },
  error(message: string, error?: unknown, context?: LogContext, { alertar = true }: ErrorOpts = {}) {
    console.error(`[error] ${message}`, error, context ?? '');
    if (alertar) {
      // Import tardio: mantém o logger leve e sem ciclo de módulos com env/repositórios.
      import('@/lib/services/whatsapp')
        .then(m => m.alertarErroDeLog(message, error, context))
        .catch(err => console.error('[whatsapp] falha ao preparar alerta', err));
    }
  },
};
