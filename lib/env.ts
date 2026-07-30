const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : Number(v));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-nao-use-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: num(process.env.BCRYPT_SALT_ROUNDS, 10),
  resetTokenTtlMinutes: num(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 30),

  business: {
    freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 199),
    pixDiscountPercent: num(process.env.PIX_DISCOUNT_PERCENT, 10),
    maxInstallments: num(process.env.MAX_INSTALLMENTS, 12),
  },

  melhorEnvio: {
    token: process.env.MELHOR_ENVIO_TOKEN || '',
    baseUrl: process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br',
    cepOrigem: process.env.CEP_ORIGEM_LOJA || '61887810',
  },

  asaas: {
    apiKey: process.env.ASAAS_API_KEY || process.env.ASAAS_API || '',
    baseUrl: process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3',
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'Zoliê Semijoias <onboarding@resend.dev>',
  },

  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
