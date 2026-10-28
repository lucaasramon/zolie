import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = env.appUrl.replace(/\/$/, '');

  // Ambiente que não é o domínio de produção fica fora do índice por completo:
  // preview da Vercel indexado gera conteúdo duplicado competindo com a loja real.
  const ehProducao = /^https:\/\/(www\.)?zolie\./i.test(base);
  if (!ehProducao) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      // Crawlers de treino/busca de IA: só geram custo (CDN Requests, Origin
      // Transfer) sem trazer clientes. `facebookexternalhit` (prévia de links no
      // WhatsApp/Instagram) é outro agente e continua liberado pela regra `*`.
      {
        userAgent: ['meta-externalagent', 'GPTBot', 'ClaudeBot', 'CCBot', 'Bytespider', 'PerplexityBot'],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/conta',
          '/conta/',
          '/checkout',
          '/carrinho',
          '/login',
          '/cadastro',
          '/redefinir-senha',
          // Bloqueia a busca interna: gera URLs infinitas de baixo valor.
          '/produtos?q=',
          // Combinações de filtro/ordenação já são noindex; bloquear o rastreio
          // evita que bots percorram o produto cartesiano de URLs. A listagem
          // limpa, `?categoria=` e `?page=` continuam rastreáveis.
          '/produtos?*material=',
          '/produtos?*pedra=',
          '/produtos?*tamanho=',
          '/produtos?*notaMin=',
          '/produtos?*precoMin=',
          '/produtos?*precoMax=',
          '/produtos?*promocao=',
          '/produtos?*sort=',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
