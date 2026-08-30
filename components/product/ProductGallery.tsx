'use client';

import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import Image from 'next/image';
import { ProductModelViewer } from '@/components/product/ProductModelViewer';
import { EarringARTryOn } from '@/components/product/EarringARTryOn';

// Ficheiro pesado (~1.6MB): sem pré-carregar, o model-viewer mostra o objeto
// com iluminação básica por um instante até o HDRI terminar de baixar — lê
// como "abre escuro". Iniciando o download assim que a página do produto
// carrega (não só quando o modal abre), o arquivo já está em cache do
// navegador no momento do clique.
const HDRI_STUDIO_URL = '/3d/studio-joia-uniforme.hdr';

// Tela cheia (fixed) em vez de embutido: no celular, arrastar o objeto dentro
// da galeria competia com o scroll da página (o toque não sabia se era pra
// girar o brinco ou rolar a tela). Em modal, o gesto fica isolado.
function Modelo3dModal({ src, alt, poster, onClose }: { src: string; alt: string; poster?: string; onClose: () => void }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 animate-zfade" onClick={onClose}>
      <div
        className="flex h-[min(600px,85vh)] w-[min(600px,92vw)] flex-col overflow-hidden rounded-2xl bg-bg-alt shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <span className="text-sm font-medium text-ink">{alt}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visualização 3D"
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-bg"
          >
            ✕ Fechar
          </button>
        </div>
        <div className="relative flex-1 touch-none">
          <ProductModelViewer src={src} alt={alt} poster={poster} />
        </div>
      </div>
    </div>
  );
}

export function ProductGallery({
  imagens,
  nome,
  slug,
  modelo3d,
  permiteAR = false,
}: {
  imagens: string[];
  nome: string;
  slug: string;
  modelo3d?: string | null;
  permiteAR?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modo3d, setModo3d] = useState(false);
  const [modoAR, setModoAR] = useState(false);

  useEffect(() => {
    if (modelo3d) preload(HDRI_STUDIO_URL, { as: 'fetch', crossOrigin: 'anonymous' });
  }, [modelo3d]);

  if (!imagens?.length) {
    return (
      <div className="img-placeholder grid aspect-square place-items-center rounded-2xl shadow-xs p-4">
        <span className="text-center font-mono text-xs uppercase tracking-[0.12em] text-ink-tertiary">
          foto do produto
          <br />
          {slug}
        </span>
      </div>
    );
  }

  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const active = imagens[activeIndex];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {imagens.length > 1 && (
        <div className="flex flex-none gap-2.5 overflow-x-auto sm:w-[76px] sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
          {imagens.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${nome}`}
              className={`group relative h-[68px] w-[68px] flex-none overflow-hidden rounded-lg border-2 transition-all ${
                i === activeIndex ? 'border-gold shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt="" fill sizes="68px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="group relative flex-1 overflow-hidden rounded-2xl bg-bg-alt shadow-xs">
        <div className="relative aspect-square overflow-hidden">
          {!loaded[activeIndex] && (
            <div className="img-skeleton-shine absolute inset-0" aria-hidden="true" />
          )}
          <Image
            src={active}
            alt={nome}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
              loaded[activeIndex] ? 'opacity-100' : 'opacity-0'
            }`}
            priority
            onLoad={() => setLoaded(l => ({ ...l, [activeIndex]: true }))}
          />
        </div>

        {(modelo3d || permiteAR) && (
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
            {modelo3d && (
              <button
                type="button"
                onClick={() => setModo3d(true)}
                className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                ⟳ Ver em 3D
              </button>
            )}
            {permiteAR && (
              <button
                type="button"
                onClick={() => setModoAR(true)}
                className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                📷 Provar com câmera
              </button>
            )}
          </div>
        )}

        {imagens.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
            {imagens.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {modo3d && modelo3d && (
        <Modelo3dModal src={modelo3d} alt={nome} poster={active} onClose={() => setModo3d(false)} />
      )}

      {modoAR && (
        <EarringARTryOn nome={nome} onClose={() => setModoAR(false)} />
      )}
    </div>
  );
}
