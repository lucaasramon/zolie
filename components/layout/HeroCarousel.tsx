'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface HeroBanner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tag: string | null;
  cta: string | null;
  link: string | null;
  imagem: string | null;
}

const AUTOPLAY_MS = 6000;
// Distância mínima de arrasto (px) para contar como swipe em vez de clique.
const SWIPE_THRESHOLD = 50;

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Proporção real (largura/altura) de cada imagem, descoberta ao carregar — os
  // banners podem ter dimensões diferentes entre si, então não dá pra assumir
  // um valor fixo sem cortar ou distorcer.
  const [ratios, setRatios] = useState<Record<number, number>>({});

  // Estado do arrasto/swipe (mouse no desktop, toque no celular).
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const suppressNextClick = useRef(false);

  const goTo = useCallback((i: number) => {
    setIndex(((i % banners.length) + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2 || paused || dragging) return;
    timerRef.current = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, paused, dragging, banners.length, goTo]);

  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    dragDeltaX.current = 0;
    setDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = clientX - dragStartX.current;
  };

  const handleDragEnd = () => {
    if (dragStartX.current === null) return;
    if (dragDeltaX.current > SWIPE_THRESHOLD) {
      goTo(index - 1);
    } else if (dragDeltaX.current < -SWIPE_THRESHOLD) {
      goTo(index + 1);
    }
    // Se houve arrasto de verdade, suprime o próximo clique nos links dos
    // slides para não navegar sem querer ao soltar após um swipe.
    if (Math.abs(dragDeltaX.current) > 5) suppressNextClick.current = true;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setDragging(false);
  };

  if (banners.length === 0) return null;

  // Enquanto a proporção do banner ativo ainda não foi descoberta, usa a média
  // razoável de um banner promocional (2:1) para não colapsar a altura a zero.
  const ratioAtivo = ratios[index] ?? 2;

  return (
    <section
      className="relative overflow-hidden animate-zfade select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        if (dragging) handleDragEnd();
      }}
      onMouseDown={e => handleDragStart(e.clientX)}
      onMouseMove={e => dragging && handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onTouchStart={e => handleDragStart(e.touches[0].clientX)}
      onTouchMove={e => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <div className="relative w-full transition-[aspect-ratio] duration-300" style={{ aspectRatio: ratioAtivo }}>
        {banners.map((b, i) => {
          const conteudo = (
            <>
              {b.imagem && (
                <Image
                  src={b.imagem}
                  alt={b.titulo}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-contain pointer-events-none"
                  draggable={false}
                  onLoad={e => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      setRatios(r => ({ ...r, [i]: img.naturalWidth / img.naturalHeight }));
                    }
                  }}
                />
              )}
            </>
          );
          return (
            <div
              key={b.id}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
              aria-hidden={i !== index}
            >
              {b.link ? (
                <Link
                  href={b.link}
                  aria-label={b.titulo}
                  className="block h-full w-full"
                  draggable={false}
                  onClick={e => {
                    if (suppressNextClick.current) {
                      e.preventDefault();
                      suppressNextClick.current = false;
                    }
                  }}
                >
                  {conteudo}
                </Link>
              ) : (
                conteudo
              )}
            </div>
          );
        })}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Banner anterior"
              onClick={() => goTo(index - 1)}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/70 text-zinc-800 shadow-sm transition-colors hover:bg-white"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Próximo banner"
              onClick={() => goTo(index + 1)}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/70 text-zinc-800 shadow-sm transition-colors hover:bg-white"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Ir para o banner ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-[3px] w-[26px] rounded-full shadow-sm transition-colors ${i === index ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
