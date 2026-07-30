import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES } from '../lib/seed-data';

const prisma = new PrismaClient();

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { nome: c.nome, slug: c.slug, imagem: c.imagem, ordem: c.ordem, ativa: c.ativa },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@zolie.com.br';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'trocar-esta-senha';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: 'Admin Zoliê',
      email: adminEmail,
      senhaHash: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });

  console.log('Seed concluído');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
