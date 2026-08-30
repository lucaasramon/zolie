'use client';

import { useEffect, useRef, useState } from 'react';

const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const BRINCO_PNG = '/produtos/Design sem nome (3).png';

// Landmarks laterais do rosto (MediaPipe Face Mesh, 478 pontos) mais próximos
// do lóbulo da orelha de cada lado — a malha não tem um ponto de "orelha" em
// si, então usamos a borda lateral da mandíbula/rosto como aproximação.
const LOBULO_DIREITO = 234;
const LOBULO_ESQUERDO = 454;
const OLHO_DIREITO = 33;
const OLHO_ESQUERDO = 263;

type EstadoCarregamento = 'carregando' | 'pronto' | 'sem-rosto' | 'erro';

interface PontoSuavizado {
  x: number;
  y: number;
  largura: number;
  altura: number;
  angulo: number;
}

// Suavização exponencial entre frames: sem isso, o pequeno ruído de detecção
// do MediaPipe frame a frame faz o brinco "tremer" na tela, o que quebra a
// ilusão de estar realmente preso na orelha.
const SUAVIZACAO = 0.35;

function suavizar(anterior: PontoSuavizado | null, atual: PontoSuavizado): PontoSuavizado {
  if (!anterior) return atual;
  return {
    x: anterior.x + (atual.x - anterior.x) * SUAVIZACAO,
    y: anterior.y + (atual.y - anterior.y) * SUAVIZACAO,
    largura: anterior.largura + (atual.largura - anterior.largura) * SUAVIZACAO,
    altura: anterior.altura + (atual.altura - anterior.altura) * SUAVIZACAO,
    angulo: anterior.angulo + (atual.angulo - anterior.angulo) * SUAVIZACAO,
  };
}

export function EarringARTryOn({ nome, onClose }: { nome: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<EstadoCarregamento>('carregando');
  const [erroMsg, setErroMsg] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cancelado = false;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let faceLandmarker: any = null;

    let suavizadoDireito: PontoSuavizado | null = null;
    let suavizadoEsquerdo: PontoSuavizado | null = null;

    async function iniciar() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(/* webpackIgnore: true */ `${VISION_CDN}/vision_bundle.mjs`);
        const fileset = await FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);

        if (cancelado) return;
        faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (cancelado) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });

        if (cancelado || !videoRef.current) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const brinco = new Image();
        brinco.src = BRINCO_PNG;
        await new Promise(resolve => {
          brinco.onload = resolve;
          brinco.onerror = resolve;
        });

        setEstado('pronto');
        loop(video, brinco, faceLandmarker);
      } catch (err) {
        if (cancelado) return;
        console.error('Falha ao iniciar AR de prova do brinco', err);
        setErroMsg(
          err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
            ? 'Permissão da câmera negada. Habilite o acesso à câmera nas configurações do navegador para provar o brinco.'
            : 'Não foi possível iniciar a câmera neste dispositivo/navegador.'
        );
        setEstado('erro');
      }
    }

    function loop(video: HTMLVideoElement, brinco: HTMLImageElement, landmarker: any) {
      if (cancelado) return;
      const canvas = canvasRef.current;
      if (!canvas || video.readyState < 2) {
        rafId = requestAnimationFrame(() => loop(video, brinco, landmarker));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Espelha o preview para parecer um espelho (igual selfie).
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const resultado = landmarker.detectForVideo(video, performance.now());
      const rosto = resultado?.faceLandmarks?.[0];

      if (rosto) {
        setEstado('pronto');
        const distanciaOlhos = distancia(rosto[OLHO_DIREITO], rosto[OLHO_ESQUERDO], canvas.width, canvas.height);
        const larguraBrinco = distanciaOlhos * 0.42;
        const alturaBrinco = larguraBrinco * (brinco.naturalHeight / brinco.naturalWidth || 1.6);
        const anguloCabeca = Math.atan2(
          (rosto[OLHO_ESQUERDO].y - rosto[OLHO_DIREITO].y) * canvas.height,
          (rosto[OLHO_ESQUERDO].x - rosto[OLHO_DIREITO].x) * canvas.width
        );

        suavizadoDireito = suavizar(suavizadoDireito, {
          x: rosto[LOBULO_DIREITO].x * canvas.width,
          y: rosto[LOBULO_DIREITO].y * canvas.height,
          largura: larguraBrinco,
          altura: alturaBrinco,
          angulo: anguloCabeca,
        });
        suavizadoEsquerdo = suavizar(suavizadoEsquerdo, {
          x: rosto[LOBULO_ESQUERDO].x * canvas.width,
          y: rosto[LOBULO_ESQUERDO].y * canvas.height,
          largura: larguraBrinco,
          altura: alturaBrinco,
          angulo: anguloCabeca,
        });

        // Amostra o tom de pele perto da orelha para o brinco herdar a
        // exposição/temperatura de cor real do ambiente (cômodo escuro,
        // luz amarelada, luz de janela etc.) em vez de sempre aparecer com
        // o brilho fixo da foto de estúdio onde o PNG foi fotografado.
        const luz = amostrarIluminacao(ctx, suavizadoDireito.x, suavizadoDireito.y - suavizadoDireito.altura * 0.4, canvas.width, canvas.height);

        desenharBrinco(ctx, brinco, suavizadoDireito, luz);
        desenharBrinco(ctx, brinco, suavizadoEsquerdo, luz);
      } else {
        setEstado('sem-rosto');
        suavizadoDireito = null;
        suavizadoEsquerdo = null;
      }

      ctx.restore();
      rafId = requestAnimationFrame(() => loop(video, brinco, landmarker));
    }

    iniciar();

    return () => {
      cancelado = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(track => track.stop());
      faceLandmarker?.close?.();
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-zfade">
      <div className="relative flex h-[min(720px,90vh)] w-[min(480px,94vw)] flex-col overflow-hidden rounded-2xl bg-black shadow-lg">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3.5">
          <span className="text-sm font-medium text-white">Provar {nome}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar câmera"
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-white"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="relative flex-1">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="h-full w-full object-cover" />

          {estado === 'carregando' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <span className="text-sm text-white/80">Abrindo câmera…</span>
            </div>
          )}

          {estado === 'sem-rosto' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
              <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-white">
                Posicione seu rosto no centro da câmera
              </span>
            </div>
          )}

          {estado === 'erro' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6 text-center">
              <span className="text-sm text-white/90">{erroMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function distancia(a: { x: number; y: number }, b: { x: number; y: number }, largura: number, altura: number) {
  const dx = (a.x - b.x) * largura;
  const dy = (a.y - b.y) * altura;
  return Math.hypot(dx, dy);
}

interface Iluminacao {
  brilho: number; // 0 (bem escuro) .. 1 (bem claro), referência: pele média ~0.55
  r: number;
  g: number;
  b: number;
}

// Lê a região de pele logo acima de onde o brinco vai ficar e tira a média de
// cor — é a mesma ideia usada em compositing de vídeo para "casar" um elemento
// 2D com a cena: o brinco herda o brilho e a temperatura de cor do ambiente
// real da pessoa em vez de ficar com o brilho fixo da foto de estúdio.
function amostrarIluminacao(ctx: CanvasRenderingContext2D, x: number, y: number, largura: number, altura: number): Iluminacao {
  const raio = 14;
  const px = Math.max(raio, Math.min(largura - raio, x));
  const py = Math.max(raio, Math.min(altura - raio, y));

  try {
    const { data } = ctx.getImageData(px - raio, py - raio, raio * 2, raio * 2);
    let r = 0;
    let g = 0;
    let b = 0;
    const amostras = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r /= amostras;
    g /= amostras;
    b /= amostras;
    const brilho = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return { brilho, r, g, b };
  } catch {
    // getImageData pode falhar se o canvas ficar "tainted"; nesse caso mantém
    // o brinco com a exposição original em vez de quebrar o desenho.
    return { brilho: 0.55, r: 200, g: 180, b: 160 };
  }
}

function desenharBrinco(ctx: CanvasRenderingContext2D, brinco: HTMLImageElement, ponto: PontoSuavizado, luz: Iluminacao) {
  const { x, y, largura: larguraBrinco, altura: alturaBrinco, angulo } = ponto;

  // Referência de brilho ~0.55 (pele bem iluminada); abaixo disso o ambiente
  // está mais escuro que o estúdio onde o brinco foi fotografado e vice-versa.
  const brilhoRelativo = Math.max(0.5, Math.min(1.4, luz.brilho / 0.55));
  const temperatura = luz.r > 0 ? Math.max(0.85, Math.min(1.15, luz.r / (luz.b || luz.r))) : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angulo);

  ctx.filter = `brightness(${brilhoRelativo}) saturate(${temperatura}) contrast(1.04)`;
  ctx.drawImage(brinco, -larguraBrinco / 2, 0, larguraBrinco, alturaBrinco);
  ctx.restore();
}
