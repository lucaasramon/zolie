import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES, PRODUCTS } from '../lib/seed-data';

const prisma = new PrismaClient();

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { nome: c.nome, slug: c.slug, imagem: c.imagem, ordem: c.ordem, ativa: c.ativa },
    });
  }

  const categoriasPorSlug = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map(c => [c.slug, c.id]),
  );

  for (const p of PRODUCTS) {
    const categoriaId = categoriasPorSlug.get(p.categoria);
    if (!categoriaId) {
      throw new Error(`Categoria "${p.categoria}" não encontrada para o produto "${p.slug}"`);
    }

    const dados = {
      nome: p.nome,
      descricao: p.descricao,
      cuidados: p.cuidados,
      preco: p.preco,
      precoPromocional: p.precoPromocional ?? null,
      material: p.material,
      categoriaId,
      estoque: p.estoque,
      pesoGramas: p.pesoGramas,
      pedra: p.pedra ?? null,
      tamanhos: p.tamanhos ?? [],
      imagens: [],
      destaque: p.destaque ?? false,
      lancamento: p.lancamento ?? false,
      ativo: true,
      notaMedia: p.notaMedia,
      totalAvaliacoes: p.totalAvaliacoes,
    };

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: dados,
      create: { slug: p.slug, ...dados },
    });
  }

  console.log(`${CATEGORIES.length} categorias e ${PRODUCTS.length} produtos processados`);

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
