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
      // Ângulo inicial girado para o reflexo de luz forte do HDRI já ficar
      // de frente ao abrir, sem precisar arrastar manualmente para achá-lo.
      camera-orbit="80deg 70deg auto"
      // HDRI de estúdio (Poly Haven "Studio Small 08", CC0) com luz envolvente
      // de vários softboxes, em vez de um único ponto de luz forte — assim a
      // peça fica bem iluminada em qualquer ângulo ao girar, sem precisar
      // "achar" o ponto de brilho.
      environment-image="/3d/studio-joia-uniforme.hdr"
      shadow-intensity="0.35"
      shadow-softness="0.9"
      exposure="4"
      loading="eager"
      reveal="auto"
      className="h-full w-full"
    />
  );
}
