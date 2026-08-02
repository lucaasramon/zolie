import { NextRequest } from 'next/server';
import { list } from '@/lib/services/product.service';
import { ok } from '@/lib/http/envelope';
import { withAssistantAuth } from '@/lib/http/withAssistantAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

/**
 * Busca de produtos para o bot de atendimento (n8n). Resposta enxuta e achatada
 * de propósito — diferente de /api/v1/products (usada pelo frontend), que
 * devolve envelope com paginação e campos que uma IA não precisa.
 *
 * GET /api/v1/assistant/products?q=anel&categoria=aneis
 */
export const GET = withAssistantAuth(async req => {
  assertRateLimit(req as NextRequest, 'assistant:products', { windowMs: 60_000, max: 30 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') ?? undefined;
  const categoria = sp.get('categoria') ?? undefined;

  // Limite fixo e baixo: isto alimenta uma resposta de chat, não uma listagem
  // paginada — a IA não deve receber (nem o cliente ler) 50 produtos de uma vez.
  const { items } = await list({ q, categoria }, 'relevancia', { skip: 0, take: 10 });

  const produtos = items.map(p => ({
    nome: p.nome,
    slug: p.slug,
    categoria: p.categoria?.nome ?? null,
    material: p.material,
    preco: p.precoEfetivo,
    precoPix: p.precoPix,
    parcelamento: `${p.maxParcelas}x de R$ ${p.parcela.toFixed(2)} sem juros`,
    disponivel: p.disponivel,
    tamanhos: p.tamanhos ?? [],
    linkProduto: `${process.env.NEXT_PUBLIC_APP_URL || ''}/produtos/${p.slug}`,
  }));

  return ok({ total: produtos.length, produtos });
});
