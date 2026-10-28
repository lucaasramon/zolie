import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { listParaLoja, SLUG_PERSONALIZADOS } from '@/lib/services/category.service';

// O sitemap é regerado a cada hora: produto novo entra sem precisar de deploy.
export const revalidate = 3600;

/** Páginas institucionais fixas — sem `/conta`, `/checkout` e afins, que não são indexáveis. */
const ROTAS_ESTATICAS: { caminho: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { caminho: '/sobre', prioridade: 0.5, frequencia: 'monthly' },
  { caminho: '/contato', prioridade: 0.5, frequencia: 'monthly' },
  { caminho: '/faq', prioridade: 0.4, frequencia: 'monthly' },
  { caminho: '/trocas', prioridade: 0.4, frequencia: 'monthly' },
  { caminho: '/termos', prioridade: 0.3, frequencia: 'yearly' },
  { caminho: '/privacidade', prioridade: 0.3, frequencia: 'yearly' },
];

/** Fotos por produto no sitemap de imagens — as primeiras são as de vitrine. */
const MAX_IMAGENS = 5;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/$/, '');
  // Nomes de arquivo com espaço (ex.: "thumbnail (24).jpg") tornariam a URL inválida no XML.
  const abs = (caminho: string) =>
    (/^https?:\/\//i.test(caminho) ? caminho : `${base}${caminho}`).replace(/ /g, '%20');

  // Sem `lastModified` nas páginas fixas: data falsa ("agora" a cada geração)
  // faz o Google passar a ignorar o campo no sitemap inteiro.
  const institucionais: MetadataRoute.Sitemap = ROTAS_ESTATICAS.map(r => ({
    url: `${base}${r.caminho}`,
    changeFrequency: r.frequencia,
    priority: r.prioridade,
  }));

  try {
    const [produtos, categorias] = await Promise.all([
      prisma.product.findMany({
        where: { ativo: true },
        select: {
          slug: true,
          updatedAt: true,
          estoque: true,
          imagens: true,
          personalizado: true,
          categoria: { select: { slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      listParaLoja(),
    ]);

    // Listagens "mudam" quando algum produto delas muda: usa a data do mais recente.
    const ultimaAtualizacao = produtos[0]?.updatedAt;
    const atualizacaoPorCategoria = new Map<string, Date>();
    for (const p of produtos) {
      const chaves = [p.categoria.slug, ...(p.personalizado ? [SLUG_PERSONALIZADOS] : [])];
      for (const chave of chaves) {
        if (!atualizacaoPorCategoria.has(chave)) atualizacaoPorCategoria.set(chave, p.updatedAt);
      }
    }

    return [
      { url: base, lastModified: ultimaAtualizacao, changeFrequency: 'daily', priority: 1 },
      { url: `${base}/produtos`, lastModified: ultimaAtualizacao, changeFrequency: 'daily', priority: 0.9 },
      // listParaLoja já deduplica "Personalizados" e o omite quando não há anúncio.
      ...categorias.map(c => ({
        url: `${base}/produtos?categoria=${c.slug}`,
        lastModified: atualizacaoPorCategoria.get(c.slug),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...produtos.map(p => ({
        url: `${base}/produtos/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        // Peça esgotada continua no sitemap (e indexada), com prioridade menor:
        // a página segue válida e o estoque tende a voltar.
        priority: p.estoque > 0 ? 0.7 : 0.4,
        images: p.imagens.slice(0, MAX_IMAGENS).map(abs),
      })),
      ...institucionais,
    ];
  } catch (err) {
    // Banco fora do ar não pode derrubar o sitemap inteiro — devolve ao menos as
    // rotas fixas em vez de um 500 para o crawler.
    logger.error('Falha ao montar o sitemap dinâmico; servindo apenas rotas estáticas', err);
    return [
      { url: base, changeFrequency: 'daily', priority: 1 },
      { url: `${base}/produtos`, changeFrequency: 'daily', priority: 0.9 },
      ...institucionais,
    ];
  }
}
