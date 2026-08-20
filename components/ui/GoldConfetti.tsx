'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Confetti dourado disparado via CustomEvent('zolie:confetti', { detail: { x, y } }).
 * Fica montado uma vez no layout; qualquer componente pode disparar sem precisar
 * de contexto/provider próprio.
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  shape: 'diamond' | 'circle' | 'spark';
  delay: number;
}

const COLORS = ['#D4AF37', '#C09827', '#EFE3C2', '#8A6B12', '#F5E7B8'];

let uid = 0;

export function GoldConfetti() {
  const [bursts, setBursts] = useState<{ id: number; particles: Particle[] }[]>([]);
  const timeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    function handleBurst(e: Event) {
      const detail = (e as CustomEvent<{ x?: number; y?: number }>).detail || {};
      const originX = detail.x ?? window.innerWidth / 2;
      const originY = detail.y ?? window.innerHeight / 2;

      const burstId = uid++;
      const particles: Particle[] = Array.from({ length: 18 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
        const distance = 60 + Math.random() * 70;
        return {
          id: i,
          x: originX,
          y: originY,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 40,
          rotate: Math.random() * 360,
          size: 5 + Math.random() * 5,
          shape: (['diamond', 'circle', 'spark'] as const)[i % 3],
          delay: Math.random() * 0.08,
        };
      });

      setBursts(b => [...b, { id: burstId, particles }]);
      const t = setTimeout(() => {
        setBursts(b => b.filter(item => item.id !== burstId));
        timeouts.current.delete(t);
      }, 1100);
      timeouts.current.add(t);
    }

    window.addEventListener('zolie:confetti', handleBurst);
    return () => {
      window.removeEventListener('zolie:confetti', handleBurst);
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {bursts.map(burst =>
        burst.particles.map((p, i) => (
          <span
            key={`${burst.id}-${p.id}`}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.shape === 'circle' ? COLORS[i % COLORS.length] : undefined,
              borderRadius: p.shape === 'circle' ? '9999px' : undefined,
              transform: p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
              background:
                p.shape === 'diamond'
                  ? COLORS[i % COLORS.length]
                  : p.shape === 'spark'
                  ? `linear-gradient(45deg, ${COLORS[i % COLORS.length]}, transparent)`
                  : undefined,
              // Variáveis lidas pela animação para o deslocamento final da partícula.
              ['--zc-dx' as any]: `${p.dx}px`,
              ['--zc-dy' as any]: `${p.dy}px`,
              ['--zc-rot' as any]: `${p.rotate}deg`,
              animation: `zconfetti 0.9s ease-out ${p.delay}s forwards`,
            }}
          />
        ))
      )}
    </div>
  );
}

/** Dispara o confetti a partir de um elemento (ex.: botão clicado). */
export function fireGoldConfetti(origin?: HTMLElement | null) {
  let x: number | undefined;
  let y: number | undefined;
  if (origin) {
    const rect = origin.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }
  window.dispatchEvent(new CustomEvent('zolie:confetti', { detail: { x, y } }));
}
