'use client';

import { useEffect } from 'react';

export function ProductModelViewer({
  src,
  iosSrc,
  alt,
  poster,
}: {
  src: string;
  iosSrc?: string | null;
  alt: string;
  poster?: string;
}) {
  useEffect(() => {
    import('@google/model-viewer');
  }, []);

  return (
    <model-viewer
      src={src}
      ios-src={iosSrc || undefined}
      alt={alt}
      poster={poster}
      camera-controls
      auto-rotate
      ar
      // quick-look (iOS/Safari) só funciona com ios-src (.usdz) presente; sem
      // ele o Safari tentaria abrir o Quick Look e falharia.
      ar-modes={iosSrc ? 'webxr scene-viewer quick-look' : 'webxr scene-viewer'}
      environment-image="neutral"
      shadow-intensity="1"
      exposure="1.2"
      loading="eager"
      reveal="auto"
      className="h-full w-full"
    >
      <button
        slot="ar-button"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
      >
        📱 Ver em Realidade Aumentada
      </button>
    </model-viewer>
  );
}
