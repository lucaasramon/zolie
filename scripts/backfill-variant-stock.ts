/**
 * Script de uso único: corrige a divergência entre `Product.estoque` (agregado)
 * e `ProductVariant.estoque` (por tamanho x acabamento) causada pelo seed inicial
 * (`prisma/seed.ts`), que grava o total direto no produto sem nunca popular as
 * variações — deixando-as em 0 e bloqueando qualquer compra (`OUT_OF_STOCK_VARIANT`).
 *
 * Para cada produto ativo cujas variantes estão todas zeradas mas o total é > 0,
 * distribui o total entre as variantes (mesma lógica de `criarVariacoes` em
 * product.service.ts: base + resto na primeira). `Product.estoque` não muda —
 * já é a fonte da verdade aqui; só ressincroniza como checagem de consistência.
 *
 * Idempotente: produtos cujas variantes já têm estoque > 0 são pulados.
 *
 * Uso: npx tsx --env-file=.env scripts/backfill-variant-stock.ts
 */
import { prisma } from '../lib/prisma';

async function main() {
  const produtos = await prisma.product.findMany({
    where: { ativo: true, estoque: { gt: 0 } },
    include: { variants: { orderBy: [{ tamanho: 'asc' }, { acabamento: 'asc' }] } },
  });

  const candidatos = produtos.filter(p => p.variants.length > 0 && p.variants.every(v => v.estoque === 0));

  if (candidatos.length === 0) {
    console.log('Nada a corrigir — nenhum produto com variantes zeradas e estoque total > 0.');
    return;
  }

  console.log(`${candidatos.length} produto(s) com variantes zeradas serão corrigidos:\n`);

  // Timeout maior que o default (5s): 28 produtos x múltiplas operações via o
  // pooler do Supabase pode passar do limite padrão dependendo da latência.
  await prisma.$transaction(
    async tx => {
      for (const p of candidatos) {
        const n = p.variants.length;
        const base = Math.floor(p.estoque / n);
        const resto = p.estoque % n;

        for (let i = 0; i < n; i++) {
          const estoqueVariante = base + (i === 0 ? resto : 0);
          await tx.productVariant.update({
            where: { id: p.variants[i].id },
            data: { estoque: estoqueVariante },
          });
        }

        // Ressincroniza o total a partir da soma real das variantes (deve bater com
        // p.estoque, já que a distribuição preserva a soma — só uma checagem extra).
        const agg = await tx.productVariant.aggregate({
          where: { productId: p.id, ativo: true },
          _sum: { estoque: true },
        });
        const totalSincronizado = agg._sum.estoque ?? 0;
        if (totalSincronizado !== p.estoque) {
          await tx.product.update({ where: { id: p.id }, data: { estoque: totalSincronizado } });
        }

        const detalhe = p.variants.map((v, i) => `${v.acabamento || v.tamanho || 'única'}=${base + (i === 0 ? resto : 0)}`).join(', ');
        console.log(`- "${p.nome}": total ${p.estoque} -> ${detalhe}`);
      }
    },
    { timeout: 30000 },
  );

  console.log(`\n${candidatos.length} produto(s) corrigido(s).`);
}

main()
  .catch(err => {
    console.error('Falha ao corrigir estoque de variantes:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
