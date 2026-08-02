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
          '/verificar-email',
          // Bloqueia a busca interna: gera URLs infinitas de baixo valor.
          '/produtos?q=',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
