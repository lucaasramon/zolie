'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({ imagens, nome, slug }: { imagens: string[]; nome: string; slug: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

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
          <Image
            src={active}
            alt={nome}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority
          />
        </div>

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
    </div>
  );
}
