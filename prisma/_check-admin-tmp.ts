import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@zolie.com.br';
  const password = process.env.SEED_ADMIN_PASSWORD || 'trocar-esta-senha';

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    console.log('RESULT=NOT_FOUND');
    return;
  }

  console.log('RESULT=FOUND');
  console.log('ROLE=' + user.role);
  console.log('EMAIL_VERIFIED=' + user.emailVerified);
  const matches = await bcrypt.compare(password, user.senhaHash);
  console.log('PASSWORD_MATCHES_ENV=' + matches);
}

main()
  .catch(e => {
    console.error('ERROR=' + e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
