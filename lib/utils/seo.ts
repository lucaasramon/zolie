import type { Metadata } from 'next';

/**
 * Campos fixos do Open Graph. O `openGraph` de uma página substitui o do layout
 * por inteiro (não mescla), então toda página que define o seu espalha esta base
 * para não perder nome do site e idioma nas prévias de link.
 */
export const OG_BASE: {
  type: 'website';
  locale: string;
  siteName: string;
  images: { url: string; width: number; height: number; alt: string }[];
} = {
  type: 'website',
  locale: 'pt_BR',
  siteName: 'Zoliê Semijoias',
  // Imagem padrão gerada por app/opengraph-image.tsx; produto sobrescreve com a foto da peça.
  images: [
    {
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Zoliê Semijoias — semijoias em prata 925 e banho de ouro 18k',
    },
  ],
};

/** Metadata completa de uma página simples: título, descrição, canonical e prévia de link. */
export function metadataPagina(titulo: string, descricao: string, caminho: string): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: { ...OG_BASE, title: `${titulo} | Zoliê Semijoias`, description: descricao, url: caminho },
  };
}

/**
 * Encurta um texto para caber no snippet do Google (~155 caracteres) sem cortar
 * palavra no meio. Só acrescenta reticências quando realmente cortou.
 */
export function resumir(texto: string, max = 155): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, max - 1).replace(/[\s,.;:–—-]+\S*$/, '') + '…';
}
