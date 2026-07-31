'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({ imagens, nome, slug }: { imagens: string[]; nome: string; slug: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!imagens?.length) {
    return (
      <div className="img-placeholder grid aspect-square place-items-center rounded-xl shadow-xs p-4">
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
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden rounded-xl shadow-xs">
        <Image
          src={active}
          alt={nome}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          priority
        />
      </div>
      {imagens.length > 1 && (
        <div className="flex gap-2.5">
          {imagens.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${nome}`}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-md border transition-colors ${
                i === activeIndex ? 'border-gold' : 'border-border-subtle hover:border-border-soft'
              }`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
