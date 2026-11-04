import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import { CORRENTES_PADRAO, formatoDoModelo, lerOpcoes } from '@/lib/personalizacao';
import { MATERIAL_LABEL } from '@/lib/utils/format';
import { StoryGravacao, type CupomStory, type PecaStory } from '@/components/anuncio/StoryGravacao';

/**
 * Página exclusiva do anúncio do Instagram: fora do menu, do sitemap e do
 * Google, só abre por quem clica no anúncio. Em formato de story (tela cheia,
 * barrinhas, toques), para a pessoa continuar no "modo Instagram" em vez de
 * sentir que caiu numa loja: ganha o cupom, escolhe a peça, digita a gravação
 * e vê o resultado desenhado.
 *
 * Fica fora do grupo `(store)` de propósito: sem cabeçalho, rodapé e botões
 * flutuantes, nada compete com o story.
 */

/** Peça do anúncio: aparece primeiro na escolha. */
const SLUG_ANUNCIO = 'colar-personalizado-com-pingente-retangular';

/**
 * Cupom da campanha. Precisa existir no admin SEM restrição de compra
 * (primeira/segunda): com restrição o cupom exige conta, e quem vem do anúncio
 * compra como convidado. Se não existir ou não valer, a tela do cupom some e
 * o story começa direto na escolha da peça.
 */
const CODIGO_CUPOM = 'PRESENTE10';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Um presente para você',
  description: 'Veja como fica a sua gravação na peça Zoliê.',
  robots: { index: false, follow: false },
};

async function carregarPecas(): Promise<PecaStory[]> {
  const produtos = await prisma.product.findMany({
    where: { personalizado: true, ativo: true, estoque: { gt: 0 } },
    select: {
      id: true,
      slug: true,
      nome: true,
      preco: true,
      material: true,
      tamanhos: true,
      opcoesPersonalizacao: true,
      valorGravacaoVerso: true,
    },
  });

  const pecas = produtos.flatMap((p): PecaStory[] => {
    const opcoes = lerOpcoes(p.opcoesPersonalizacao);
    const base = {
      productId: p.id,
      slug: p.slug,
      material: p.material,
      materialLabel: MATERIAL_LABEL[p.material] || p.material,
      valorVerso: p.valorGravacaoVerso ? Number(p.valorGravacaoVerso) : 0,
      corrente: p.tamanhos[0] || CORRENTES_PADRAO[0],
    };
    if (opcoes.length === 0) {
      return [{ ...base, chave: p.id, modeloId: null, rotulo: p.nome.trim(), formato: formatoDoModelo(p.nome), preco: Number(p.preco) }];
    }
    // Um card por modelo (os tamanhos de um mesmo modelo viram um só, pelo
    // menor preço): a escolha aqui é de formato. O tamanho se ajusta no produto.
    const porModelo = new Map<string, (typeof opcoes)[number]>();
    for (const o of opcoes) {
      const atual = porModelo.get(o.modelo);
      if (!atual || o.preco < atual.preco) porModelo.set(o.modelo, o);
    }
    return [...porModelo.values()].map(o => ({
      ...base,
      chave: `${p.id}:${o.id}`,
      modeloId: o.id,
      rotulo: o.modelo,
      formato: formatoDoModelo(o.modelo),
      preco: o.preco,
    }));
  });

  return pecas.sort((a, b) => Number(b.slug === SLUG_ANUNCIO) - Number(a.slug === SLUG_ANUNCIO) || a.preco - b.preco);
}

async function carregarCupom(): Promise<CupomStory | null> {
  const c = await couponRepo.findByCode(CODIGO_CUPOM).catch(() => null);
  if (!c || !c.ativo || c.userId || c.restricaoCompra) return null;
  if (c.validade && new Date(c.validade) < new Date()) return null;
  if (c.usoMaximo != null && c.usos >= c.usoMaximo) return null;
  if (c.tipoDesconto !== 'PERCENT') return null;
  return { codigo: c.codigo, percentual: Number(c.valor) };
}

export default async function StoryGravacaoPage() {
  // Banco fora do ar (inclusive no build) não derruba a página: sem peças, o
  // story mostra o convite para a loja.
  const [pecas, cupom] = await Promise.all([carregarPecas().catch(() => []), carregarCupom()]);
  return <StoryGravacao pecas={pecas} cupom={cupom} />;
}
