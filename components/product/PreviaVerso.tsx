'use client';

import { useEffect, useState } from 'react';

type Formato = 'redondo' | 'coracao' | 'placa';

/** Formato do desenho a partir do nome do modelo cadastrado no anúncio (texto livre). */
function formatoDoModelo(modelo: string | null | undefined): Formato {
  const m = (modelo || '').toLowerCase();
  if (m.includes('cora')) return 'coracao';
  if (m.includes('placa') || m.includes('retang') || m.includes('escapul')) return 'placa';
  return 'redondo';
}

/** Área útil para o texto dentro de cada formato (viewBox 200×200). */
const AREA: Record<Formato, { largura: number; centroY: number; maxLinhas: number }> = {
  redondo: { largura: 130, centroY: 100, maxLinhas: 4 },
  coracao: { largura: 110, centroY: 92, maxLinhas: 3 },
  placa: { largura: 108, centroY: 100, maxLinhas: 6 },
};

const CONTORNO: Record<Formato, string> = {
  redondo: 'M100 12a88 88 0 1 1 0 176a88 88 0 1 1 0-176z',
  coracao: 'M100 182C62 152 18 120 18 74c0-28 22-50 48-50 16 0 28 8 34 20 6-12 18-20 34-20 26 0 48 22 48 50 0 46-44 78-82 108z',
  placa: 'M56 10h88a14 14 0 0 1 14 14v152a14 14 0 0 1-14 14H56a14 14 0 0 1-14-14V24a14 14 0 0 1 14-14z',
};

/** Quebra o texto em linhas de até `porLinha` caracteres, respeitando as palavras e as quebras digitadas. */
function quebrarLinhas(texto: string, porLinha: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split('\n')) {
    let atual = '';
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      if (!atual) atual = palavra;
      else if ((atual + ' ' + palavra).length <= porLinha) atual += ' ' + palavra;
      else {
        linhas.push(atual);
        atual = palavra;
      }
    }
    if (atual) linhas.push(atual);
  }
  return linhas;
}

/**
 * Escolhe quantos caracteres cabem por linha para o texto ocupar a peça sem
 * passar do número de linhas do formato, e o tamanho de letra que resulta disso.
 */
function diagramar(texto: string, formato: Formato) {
  const { largura, maxLinhas } = AREA[formato];
  let linhas = quebrarLinhas(texto, 8);
  for (let porLinha = 8; porLinha <= 40 && linhas.length > maxLinhas; porLinha += 2) {
    linhas = quebrarLinhas(texto, porLinha);
  }
  const maisLonga = Math.max(...linhas.map(l => l.length), 1);
  // Largura média de um caractere da serifada ≈ 0,55 do tamanho da fonte.
  const fonte = Math.min(30, largura / (maisLonga * 0.55), (AREA[formato].largura * 1.1) / linhas.length);
  return { linhas, fonte };
}

interface Props {
  texto: string;
  modelo?: string | null;
  /** Material do anúncio (enum do banco): só muda a cor do metal no desenho. */
  material?: string;
}

/**
 * Prévia instantânea da gravação do verso, desenhada no navegador enquanto a
 * cliente digita (sem IA e sem custo). A letra e a posição finais seguem o
 * padrão da loja; a versão mais fiel vem na simulação com IA.
 */
export function PreviaVerso({ texto, modelo, material }: Props) {
  const formato = formatoDoModelo(modelo);
  const dourado = material === 'BANHADO_OURO';
  const limpo = texto.trim();
  const { linhas, fonte } = diagramar(limpo, formato);
  const alturaLinha = fonte * 1.2;
  const primeiraY = AREA[formato].centroY - ((linhas.length - 1) * alturaLinha) / 2;

  // Um brilho passa pela peça quando a cliente para de digitar, como a peça
  // saindo da gravação. A chave nova reinicia a animação.
  const [brilho, setBrilho] = useState(0);
  useEffect(() => {
    if (!limpo) return;
    const t = setTimeout(() => setBrilho(b => b + 1), 650);
    return () => clearTimeout(t);
  }, [limpo]);

  const metal = dourado
    ? { claro: '#F8E7A8', medio: '#D9B556', escuro: '#9C7A26', gravado: '#6E5418' }
    : { claro: '#FBFBFC', medio: '#D3D6DB', escuro: '#9097A1', gravado: '#4F5560' };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-alt/50 p-3">
      <div className="h-28 w-28 flex-none sm:h-32 sm:w-32">
        <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-md" role="img" aria-label={limpo ? `Prévia do verso com: ${limpo}` : 'Prévia do verso'}>
          <defs>
            <linearGradient id="previa-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={metal.claro} />
              <stop offset="45%" stopColor={metal.medio} />
              <stop offset="100%" stopColor={metal.escuro} />
            </linearGradient>
            <linearGradient id="previa-luz" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="previa-forma">
              <path d={CONTORNO[formato]} />
            </clipPath>
          </defs>
          <path d={CONTORNO[formato]} fill="url(#previa-metal)" stroke={metal.escuro} strokeWidth="2" />
          <path d={CONTORNO[formato]} fill="none" stroke={metal.claro} strokeOpacity="0.8" strokeWidth="1.5" transform="translate(100 100) scale(0.93) translate(-100 -100)" />
          {/* Gravação "afundada": a cópia clara deslocada para baixo imita a luz batendo na borda do sulco. */}
          {[{ dy: 1, cor: metal.claro, opacidade: 0.9 }, { dy: 0, cor: metal.gravado, opacidade: 1 }].map(camada => (
            <text
              key={camada.dy}
              x="100"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={camada.cor}
              fillOpacity={camada.opacidade}
              fontSize={fonte}
              fontFamily="var(--font-cormorant), Georgia, serif"
              fontWeight={600}
              clipPath="url(#previa-forma)"
            >
              {linhas.map((l, i) => (
                <tspan key={i} x="100" y={primeiraY + i * alturaLinha + camada.dy}>
                  {l}
                </tspan>
              ))}
            </text>
          ))}
          {brilho > 0 && (
            <g clipPath="url(#previa-forma)">
              <rect key={brilho} className="animate-zbrilho" x="0" y="0" width="66" height="200" fill="url(#previa-luz)" style={{ transformBox: 'fill-box' }} />
            </g>
          )}
        </svg>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">Prévia do verso</span>
        <span className="text-xs leading-relaxed text-ink-muted">
          {limpo ? 'Assim fica a sua frase na peça.' : 'Comece a digitar para ver sua gravação aparecer aqui.'}
        </span>
        <span className="text-[11px] leading-relaxed text-ink-tertiary">
          Desenho ilustrativo. A letra e a posição finais seguem o padrão da loja.
        </span>
      </div>
    </div>
  );
}
