'use client';

import { useEffect, useRef } from 'react';

/**
 * Adiciona a classe `is-visible` ao elemento quando ele entra na viewport,
 * disparando a transição CSS definida em `.zreveal` (globals.css). Usa
 * IntersectionObserver com `once: true` — a seção não volta a esconder ao
 * rolar para cima, para não distrair em revisitas.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
