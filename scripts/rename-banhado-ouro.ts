/**
 * Script de uso único: renomeia produtos "Ouro" -> "Banhado a Ouro" (deixa claro
 * que a peça é banhada, não ouro maciço) e atualiza o slug correspondente,
 * preservando o slug antigo em ProductSlugHistory para redirect.
 *
 * Idempotente: rodar de novo depois do sucesso não faz nada (nomes já corrigidos
 * não batem no filtro, e slugs já corretos são pulados).
 *
 * Uso: npx tsx scripts/rename-banhado-ouro.ts
 */
import { prisma } from '../lib/prisma';
import { slugify } from '../lib/utils/slug';

async function main() {
  const produtos = await prisma.product.findMany({
    where: { material: 'BANHADO_OURO' },
    select: { id: true, nome: true, slug: true },
    orderBy: { nome: 'asc' },
  });

  const alteracoes: { id: string; nomeAntigo: string; nomeNovo: string; slugAntigo: string; slugNovo: string }[] = [];

  for (const p of produtos) {
    const jaTemBanhado = /banhado a ouro/i.test(p.nome);
    const nomeNovo = jaTemBanhado ? p.nome : p.nome.replace(/\bOuro\b/, 'Banhado a Ouro');
    const slugNovo = slugify(nomeNovo);

    if (slugNovo === p.slug) continue; // nada a fazer para este produto

    const colisao = await prisma.product.findUnique({ where: { slug: slugNovo }, select: { id: true } });
    if (colisao && colisao.id !== p.id) {
      console.warn(`PULADO (colisão de slug): "${p.nome}" -> slug "${slugNovo}" já pertence a outro produto`);
      continue;
    }

    alteracoes.push({ id: p.id, nomeAntigo: p.nome, nomeNovo, slugAntigo: p.slug, slugNovo });
  }

  if (alteracoes.length === 0) {
    console.log('Nada a alterar — todos os produtos já estão com nome/slug corretos.');
    return;
  }

  // Timeout maior que o default (5s): 18 produtos x 2 operações via o pooler do
  // Supabase pode passar do limite padrão dependendo da latência de rede.
  await prisma.$transaction(
    async tx => {
      for (const a of alteracoes) {
        await tx.productSlugHistory.create({ data: { productId: a.id, oldSlug: a.slugAntigo } });
        await tx.product.update({ where: { id: a.id }, data: { nome: a.nomeNovo, slug: a.slugNovo } });
      }
    },
    { timeout: 30000 },
  );

  console.log(`${alteracoes.length} produto(s) atualizado(s):\n`);
  for (const a of alteracoes) {
    console.log(`- "${a.nomeAntigo}" -> "${a.nomeNovo}"`);
    console.log(`  /produtos/${a.slugAntigo} -> /produtos/${a.slugNovo}\n`);
  }
}

main()
  .catch(err => {
    console.error('Falha ao renomear produtos:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
