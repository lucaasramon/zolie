import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// O sitemap é regerado a cada hora: produto novo entra sem precisar de deploy.
export const revalidate = 3600;

/** Páginas institucionais fixas — sem `/conta`, `/checkout` e afins, que não são indexáveis. */
const ROTAS_ESTATICAS: { caminho: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { caminho: '', prioridade: 1, frequencia: 'daily' },
  { caminho: '/produtos', prioridade: 0.9, frequencia: 'daily' },
  { caminho: '/sobre', prioridade: 0.5, frequencia: 'monthly' },
  { caminho: '/contato', prioridade: 0.5, frequencia: 'monthly' },
  { caminho: '/faq', prioridade: 0.4, frequencia: 'monthly' },
  { caminho: '/trocas', prioridade: 0.4, frequencia: 'monthly' },
  { caminho: '/privacidade', prioridade: 0.3, frequencia: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/$/, '');

  const estaticas: MetadataRoute.Sitemap = ROTAS_ESTATICAS.map(r => ({
    url: `${base}${r.caminho}`,
    lastModified: new Date(),
    changeFrequency: r.frequencia,
    priority: r.prioridade,
  }));

  try {
    const [produtos, categorias] = await Promise.all([
      prisma.product.findMany({
        where: { ativo: true },
        select: { slug: true, updatedAt: true, estoque: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { ativa: true },
        select: { slug: true },
        orderBy: { ordem: 'asc' },
      }),
    ]);

    return [
      ...estaticas,
      ...categorias.map(c => ({
        url: `${base}/produtos?categoria=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...produtos.map(p => ({
        url: `${base}/produtos/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        // Peça esgotada continua no sitemap, mas com prioridade menor: a página
        // segue válida e o estoque tende a voltar.
        priority: p.estoque > 0 ? 0.7 : 0.4,
      })),
    ];
  } catch (err) {
    // Banco fora do ar não pode derrubar o sitemap inteiro — devolve ao menos as
    // rotas fixas em vez de um 500 para o crawler.
    logger.error('Falha ao montar o sitemap dinâmico; servindo apenas rotas estáticas', err);
    return estaticas;
  }
}
