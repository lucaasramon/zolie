require('dotenv').config();

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const bool = (v, d) => (v === undefined ? d : v === 'true' || v === '1');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 3333),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // 'mock' | 'prisma'  -> lido em src/repositories/index.js
  dataSource: process.env.DATA_SOURCE || 'mock',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: num(process.env.DB_PORT, 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    schema: process.env.DB_SCHEMA || 'public',
    ssl: bool(process.env.DB_SSL, false),
    url: process.env.DATABASE_URL
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-nao-use-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  bcryptRounds: num(process.env.BCRYPT_SALT_ROUNDS, 10),
  resetTokenTtlMinutes: num(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 30),

  business: {
    freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 199),
    pixDiscountPercent: num(process.env.PIX_DISCOUNT_PERCENT, 10),
    maxInstallments: num(process.env.MAX_INSTALLMENTS, 12)
  }
};

if (env.dataSource === 'prisma' && !env.db.url) {
  throw new Error('DATA_SOURCE=prisma exige DATABASE_URL no .env');
}

module.exports = { env };
