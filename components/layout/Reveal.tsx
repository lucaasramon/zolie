'use client';

import { useScrollReveal } from '@/lib/hooks/useScrollReveal';

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`zreveal ${className}`}>
      {children}
    </div>
  );
}
