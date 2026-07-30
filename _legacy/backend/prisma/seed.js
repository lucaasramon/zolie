/**
 * >>> POSTGRES <<< Seed do banco real. Reaproveita exatamente o catálogo dos mocks,
 * então o banco nasce com o mesmo conteúdo que o front já mostra.
 *
 * Uso: npx prisma migrate dev && node prisma/seed.js
 */
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const { db } = require('../src/database/memoryDb');
//
// const prisma = new PrismaClient();
//
// async function main() {
//   for (const c of db.categories) {
//     await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { nome: c.nome, slug: c.slug, ordem: c.ordem } });
//   }
//   for (const p of db.products) {
//     const categoria = db.categories.find(c => c.id === p.categoriaId);
//     const cat = await prisma.category.findUnique({ where: { slug: categoria.slug } });
//     await prisma.product.upsert({
//       where: { slug: p.slug },
//       update: {},
//       create: {
//         nome: p.nome, slug: p.slug, descricao: p.descricao, cuidados: p.cuidados,
//         preco: p.preco, precoPromocional: p.precoPromocional, material: p.material,
//         categoriaId: cat.id, estoque: p.estoque, pesoGramas: p.pesoGramas, pedra: p.pedra,
//         tamanhos: p.tamanhos, imagens: p.imagens, destaque: p.destaque, lancamento: p.lancamento,
//         notaMedia: p.notaMedia, totalAvaliacoes: p.totalAvaliacoes
//       }
//     });
//   }
//   for (const c of db.coupons) {
//     await prisma.coupon.upsert({ where: { codigo: c.codigo }, update: {}, create: {
//       codigo: c.codigo, descricao: c.descricao, tipoDesconto: c.tipoDesconto, valor: c.valor,
//       minimoPedido: c.minimoPedido, usoMaximo: c.usoMaximo, primeiraCompra: c.primeiraCompra, validade: c.validade
//     } });
//   }
//   for (const b of db.banners) {
//     await prisma.banner.create({ data: { titulo: b.titulo, subtitulo: b.subtitulo, tag: b.tag, cta: b.cta, link: b.link, ordem: b.ordem } });
//   }
//   await prisma.user.upsert({
//     where: { email: 'admin@zolie.com.br' }, update: {},
//     create: { nome: 'Admin Zoliê', email: 'admin@zolie.com.br', senhaHash: await bcrypt.hash('trocar-esta-senha', 10), role: 'ADMIN' }
//   });
//   console.log('Seed concluído');
// }
//
// main().finally(() => prisma.$disconnect());

console.log('Seed desativado: descomente prisma/seed.js depois de rodar as migrations.');
