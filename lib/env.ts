const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : Number(v));

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: required('JWT_SECRET'),
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
    // Compra de etiqueta debita saldo real da carteira em produção, então fica
    // atrás de um flag e só liga quando o time decide.
    labelsEnabled: process.env.MELHOR_ENVIO_LABELS_ENABLED === 'true',
    // Dados do remetente exigidos pelo endpoint de carrinho (não são usados na cotação).
    remetente: {
      nome: process.env.LOJA_REMETENTE_NOME || '',
      email: process.env.LOJA_REMETENTE_EMAIL || '',
      documento: (process.env.LOJA_REMETENTE_DOCUMENTO || '').replace(/\D/g, ''),
      telefone: (process.env.LOJA_REMETENTE_TELEFONE || '').replace(/\D/g, ''),
      endereco: process.env.LOJA_REMETENTE_ENDERECO || '',
      numero: process.env.LOJA_REMETENTE_NUMERO || '',
      complemento: process.env.LOJA_REMETENTE_COMPLEMENTO || '',
      bairro: process.env.LOJA_REMETENTE_BAIRRO || '',
      cidade: process.env.LOJA_REMETENTE_CIDADE || '',
      estado: process.env.LOJA_REMETENTE_ESTADO || '',
    },
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

  // Dados institucionais exibidos no site. Exigidos pelo art. 2º do Decreto
  // 7.962/2013 (e-commerce): identificação, CNPJ e endereço físico visíveis.
  loja: {
    razaoSocial: process.env.LOJA_RAZAO_SOCIAL || '',
    cnpj: process.env.LOJA_CNPJ || '',
    endereco: process.env.LOJA_ENDERECO || '',
    whatsapp: (process.env.LOJA_WHATSAPP || '').replace(/\D/g, ''),
    // Para onde vão as mensagens do formulário de contato.
    emailContato: process.env.LOJA_EMAIL_CONTATO || '',
    instagram: process.env.LOJA_INSTAGRAM || '',
  },

  cronSecret: process.env.CRON_SECRET || '',

  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
