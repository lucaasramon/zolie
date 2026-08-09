import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES, PRODUCTS } from '../lib/seed-data';

const prisma = new PrismaClient();

const ACABAMENTOS = ['Polido', 'Fosco'];

/**
 * Distribui o estoque do produto entre suas variações (tamanho x acabamento),
 * criando-as se não existirem. Sem isso o produto fica visível e "em estoque"
 * na vitrine, mas o checkout — que valida a variação, não só o total — rejeita
 * toda compra com OUT_OF_STOCK_VARIANT. Espelha `criarVariacoes` em
 * lib/services/product.service.ts (mesma regra: base + resto na primeira).
 */
async function sincronizarVariacoes(productId: string, tamanhos: string[], estoqueTotal: number) {
  const listaTamanhos = tamanhos.length ? tamanhos : [null];
  const combinacoes = listaTamanhos.flatMap(tamanho => ACABAMENTOS.map(acabamento => ({ tamanho, acabamento })));
  const base = Math.floor(estoqueTotal / combinacoes.length);
  const resto = estoqueTotal % combinacoes.length;

  for (let i = 0; i < combinacoes.length; i++) {
    const { tamanho, acabamento } = combinacoes[i];
    const estoque = base + (i === 0 ? resto : 0);
    await prisma.productVariant.upsert({
      where: { productId_tamanho_acabamento: { productId, tamanho: tamanho as unknown as string, acabamento } },
      update: {},
      create: { productId, tamanho, acabamento, estoque },
    });
  }
}

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

    const produto = await prisma.product.upsert({
      where: { slug: p.slug },
      update: dados,
      create: { slug: p.slug, ...dados },
    });

    await sincronizarVariacoes(produto.id, p.tamanhos ?? [], p.estoque);
  }

  console.log(`${CATEGORIES.length} categorias e ${PRODUCTS.length} produtos processados`);

  // Insumos informados pela loja para a calculadora de precificação (/admin/precificacao).
  // "Papel de seda" e "Tags" foram passados só com valor total, sem quantidade de lote —
  // usamos 1 como placeholder até a quantidade real ser ajustada na tela de insumos.
  const SUPPLIES: { nome: string; valorPago: number; quantidadeLote: number; categoria: 'EMBALAGEM' | 'BRINDE'; ativo?: boolean }[] = [
    { nome: 'Sacola de papel', valorPago: 71, quantidadeLote: 50, categoria: 'EMBALAGEM' },
    { nome: 'Caixinha de papel', valorPago: 47, quantidadeLote: 50, categoria: 'EMBALAGEM' },
    { nome: 'Saquinho de tule', valorPago: 23, quantidadeLote: 100, categoria: 'EMBALAGEM' },
    { nome: 'Flanela mágica p/ prata', valorPago: 59.9, quantidadeLote: 50, categoria: 'EMBALAGEM' },
    { nome: 'Alicate p/ furar tags', valorPago: 33, quantidadeLote: 1, categoria: 'EMBALAGEM', ativo: false },
    { nome: 'Papel de seda', valorPago: 26, quantidadeLote: 1, categoria: 'EMBALAGEM' },
    { nome: 'Tags', valorPago: 200, quantidadeLote: 1, categoria: 'EMBALAGEM' },
    { nome: 'Mini porta joia (lote 10)', valorPago: 64, quantidadeLote: 10, categoria: 'BRINDE' },
    { nome: 'Mini porta joia (lote 8)', valorPago: 48, quantidadeLote: 8, categoria: 'BRINDE' },
  ];

  for (const s of SUPPLIES) {
    const existente = await prisma.supply.findFirst({ where: { nome: s.nome } });
    if (existente) continue;
    await prisma.supply.create({ data: { ...s, ativo: s.ativo ?? true } });
  }

  console.log(`${SUPPLIES.length} insumos processados`);

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
