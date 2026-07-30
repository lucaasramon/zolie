/**
 * >>> POSTGRES <<<
 * Único arquivo que conhece o PostgreSQL. Enquanto DATA_SOURCE=mock nada aqui é chamado.
 *
 * Para ligar o banco de verdade:
 *   1. npm i @prisma/client && npx prisma generate
 *   2. preencha DATABASE_URL no .env
 *   3. descomente o bloco abaixo
 *   4. DATA_SOURCE=prisma
 */

// const { PrismaClient } = require('@prisma/client');
// const { env } = require('../config/env');
//
// const prisma = new PrismaClient({
//   log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
//   datasources: { db: { url: env.db.url } }
// });
//
// process.on('beforeExit', () => prisma.$disconnect());
// module.exports = { prisma };

module.exports = {
  get prisma() {
    throw new Error(
      'Prisma Client ainda não está habilitado. Descomente src/database/prismaClient.js, ' +
      'rode "npx prisma migrate dev" e defina DATA_SOURCE=prisma.'
    );
  }
};
