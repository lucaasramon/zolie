'use client';

import { useEffect } from 'react';

export function ProductModelViewer({ src, alt, poster }: { src: string; alt: string; poster?: string }) {
  useEffect(() => {
    import('@google/model-viewer');
  }, []);

  return (
    <model-viewer
      src={src}
      alt={alt}
      poster={poster}
      camera-controls
      auto-rotate
      // HDRI de estúdio (Poly Haven, CC0) em vez do preset "neutral" genérico —
      // reflexos de metal ficam realistas só com um ambiente rico, não com uma
      // luz chapada. Exposure/sombra mais baixos porque o HDRI já é bem mais
      // luminoso que o preset anterior.
      environment-image="/3d/studio-joia.hdr"
      shadow-intensity="0.6"
      shadow-softness="0.9"
      exposure="1.5"
      loading="eager"
      reveal="auto"
      className="h-full w-full"
    />
  );
}
