'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { OpcaoPersonalizacao } from '@/lib/personalizacao';
import { PersonalizacaoState, validarPersonalizacao } from '@/components/product/PersonalizacaoForm';

export interface ResultadoSimulacao {
  frente: string;
  verso: string;
  /** Escolhas usadas na geração — se mudarem depois, a simulação fica desatualizada. */
  assinatura: string;
}

/** Identifica um conjunto de escolhas; usado para saber se a simulação ainda vale. */
export function assinaturaEscolhas(p: PersonalizacaoState, tamanho: string): string {
  return JSON.stringify({
    modeloId: p.modeloId,
    imagens: p.imagens,
    verso: p.verso,
    textoVerso: p.verso ? p.textoVerso.trim() : '',
    tamanho,
  });
}

/** Duração típica da geração; só calibra a barra, que nunca chega a 100% sozinha. */
const DURACAO_ESTIMADA_MS = 120_000;

/**
 * Progresso que anda rápido no começo e desacelera perto do fim, sem nunca
 * travar nem passar de 96%: a cliente sente que está "quase lá" mesmo quando
 * a IA demora mais que o normal.
 */
function progressoEstimado(decorridoMs: number): number {
  return 96 * (1 - Math.exp(-decorridoMs / (DURACAO_ESTIMADA_MS * 0.42)));
}

/** Faíscas na ponta do laser: direção e atraso fixos para não piscar a cada render. */
const FAISCAS = [
  { dx: '-14px', dy: '-10px', left: '22%', delay: '0s' },
  { dx: '10px', dy: '-14px', left: '41%', delay: '0.3s' },
  { dx: '-8px', dy: '12px', left: '58%', delay: '0.15s' },
  { dx: '14px', dy: '8px', left: '76%', delay: '0.45s' },
];

const ETAPAS = [
  'Analisando a peça do anúncio…',
  'Posicionando sua personalização…',
  'Gravando a frente da peça…',
  'Gravando o verso da peça…',
  'Conferindo cada detalhe…',
  'Quase pronto, finalizando as fotos…',
];

interface Props {
  productId: string;
  /** Foto principal do anúncio, usada na animação enquanto a IA trabalha. */
  imagemPeca?: string | null;
  /** Nome do anúncio, usado no texto ao compartilhar a simulação. */
  nomePeca?: string;
  personalizacao: PersonalizacaoState;
  tamanho: string;
  opcoes: OpcaoPersonalizacao[];
  resultado: ResultadoSimulacao | null;
  onResultado: (r: ResultadoSimulacao | null) => void;
}

export function SimulacaoIA({ productId, imagemPeca, nomePeca, personalizacao, tamanho, opcoes, resultado, onResultado }: Props) {
  const [gerando, setGerando] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);
  // Só a simulação que acabou de chegar ganha a animação de revelação.
  const [recemGerada, setRecemGerada] = useState(false);

  useEffect(() => {
    if (!gerando) return;
    const t = setInterval(() => setEtapa(e => Math.min(e + 1, ETAPAS.length - 1)), 14_000);
    const inicio = Date.now();
    const p = setInterval(() => setProgresso(progressoEstimado(Date.now() - inicio)), 400);
    return () => {
      clearInterval(t);
      clearInterval(p);
    };
  }, [gerando]);

  // A imagem é baixada antes do clique: o compartilhamento nativo (sobretudo no
  // iPhone) só abre se for chamado direto no toque, sem esperar download.
  const arquivoParaCompartilhar = useRef<File | null>(null);
  useEffect(() => {
    arquivoParaCompartilhar.current = null;
    if (!resultado) return;
    let cancelado = false;
    fetch(resultado.frente)
      .then(r => r.blob())
      .then(blob => {
        if (!cancelado) arquivoParaCompartilhar.current = new File([blob], 'minha-peca-zolie.png', { type: blob.type || 'image/png' });
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [resultado]);

  async function compartilhar() {
    if (!resultado) return;
    const link = `${window.location.origin}${window.location.pathname}`;
    const texto = `Olha como vai ficar minha peça${nomePeca ? ` ${nomePeca}` : ''} da Zoliê ✨`;
    const arquivo = arquivoParaCompartilhar.current;
    try {
      if (arquivo && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: `${texto}
${link}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Minha peça Zoliê', text: texto, url: link });
        return;
      }
    } catch (err) {
      // A cliente fechou a janela de compartilhar: não abre outra coisa por cima.
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
    // Computador ou navegador sem compartilhamento nativo: WhatsApp com o link da imagem.
    const mensagem = `${texto}
${resultado.frente}

Veja a peça: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
  }

  const desatualizada = resultado != null && resultado.assinatura !== assinaturaEscolhas(personalizacao, tamanho);

  async function simular() {
    const problema = validarPersonalizacao(personalizacao, opcoes);
    if (problema) {
      setErro(`${problema} para simular.`);
      return;
    }
    setErro(null);
    setEtapa(0);
    setProgresso(0);
    setRecemGerada(false);
    setGerando(true);
    try {
      const { data } = await api.post<Omit<ResultadoSimulacao, 'assinatura'>>('/personalizacao/simulacao', {
        productId,
        tamanho: tamanho || null,
        personalizacao: {
          modeloId: personalizacao.modeloId,
          imagens: personalizacao.imagens,
          verso: personalizacao.verso,
          textoVerso: personalizacao.verso ? personalizacao.textoVerso.trim() : null,
        },
      });
      onResultado({ ...data, assinatura: assinaturaEscolhas(personalizacao, tamanho) });
      setRecemGerada(true);
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.status === 429
            ? 'Você já fez várias simulações agora. Tente de novo daqui a pouco.'
            : err.message
          : 'Não conseguimos gerar a simulação. Tente de novo.',
      );
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold-soft/60 bg-gradient-to-b from-gold/10 to-transparent p-4">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span aria-hidden="true">✨</span> Veja como vai ficar sua peça
        </span>
        <span className="text-xs text-ink-muted">
          Com as respostas acima, nossa IA mostra a frente e o verso desta mesma peça já personalizada.
        </span>
      </div>

      {gerando ? (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-white/70 px-4 py-5 text-center" role="status" aria-live="polite">
          <GravacaoEmAndamento imagem={imagemPeca} />
          <span className="text-sm font-medium text-ink">{ETAPAS[etapa]}</span>
          <div className="flex w-full max-w-[260px] flex-col gap-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-gold/15"
              role="progressbar"
              aria-label="Progresso da simulação"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progresso)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(3, progresso)}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-gold-text">
              {progresso >= 85 ? 'Quase pronta…' : `${Math.round(progresso)}%`}
            </span>
          </div>
          <span className="text-xs text-ink-tertiary">Isso leva de 1 a 3 minutos. Não feche esta página.</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={simular}
          className="rounded-full bg-ink py-3 text-xs font-medium uppercase tracking-wider text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          {resultado ? 'Simular de novo' : 'Simular minha peça com IA'}
        </button>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {resultado && !gerando && (
        <div className="flex flex-col gap-2">
          {desatualizada && (
            <p className="rounded-md bg-white/80 px-3 py-2 text-xs text-gold-text">
              Você mudou alguma resposta depois da simulação. Simule de novo para ver a versão atual.
            </p>
          )}
          <div className={`grid grid-cols-2 gap-3 ${desatualizada ? 'opacity-50' : ''}`}>
            {[
              { url: resultado.frente, rotulo: 'Frente' },
              { url: resultado.verso, rotulo: 'Verso' },
            ].map((f, i) => (
              <button key={f.rotulo} type="button" onClick={() => setAmpliada(f.url)} className="group flex flex-col gap-1.5 text-left">
                <span className="relative block overflow-hidden rounded-lg ring-1 ring-border-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada sob demanda, fora do otimizador */}
                  <img
                    src={f.url}
                    alt={`Simulação da ${f.rotulo.toLowerCase()} da peça`}
                    className={`aspect-square w-full object-cover transition-transform group-hover:scale-[1.02] ${recemGerada ? 'animate-zrevelar' : ''}`}
                    style={recemGerada ? { animationDelay: `${i * 0.35}s` } : undefined}
                  />
                  {recemGerada && (
                    <span
                      aria-hidden="true"
                      className="animate-zbrilho pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                      style={{ animationDelay: `${1.1 + i * 0.35}s` }}
                    />
                  )}
                </span>
                <span className="text-center text-xs font-medium uppercase tracking-wider text-ink">{f.rotulo}</span>
              </button>
            ))}
          </div>
          {!desatualizada && (
            <button
              type="button"
              onClick={compartilhar}
              className="flex items-center justify-center gap-2 rounded-full border border-gold-soft bg-white py-2.5 text-xs font-medium uppercase tracking-wider text-gold-text transition-colors hover:bg-gold hover:text-ink active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="18" cy="5" r="2.5" />
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="18" cy="19" r="2.5" />
                <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
              </svg>
              Mostrar para alguém
            </button>
          )}
          <p className="text-[11px] leading-relaxed text-ink-tertiary">
            Simulação ilustrativa gerada por IA. A peça é produzida a partir das suas respostas.
          </p>
        </div>
      )}

      {ampliada && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAmpliada(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ampliação da simulação */}
          <img src={ampliada} alt="Simulação ampliada" className="max-h-[90vh] max-w-full rounded-xl shadow-lg" />
        </div>
      )}
    </div>
  );
}

/**
 * A foto da peça com um laser dourado indo e voltando: a parte por onde ele já
 * passou fica "gravada" (mais quente e brilhante). Sem foto no anúncio, o laser
 * corre sobre um fundo neutro.
 */
function GravacaoEmAndamento({ imagem }: { imagem?: string | null }) {
  return (
    <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-xl bg-bg-alt shadow-sm ring-1 ring-gold-soft/50" aria-hidden="true">
      {imagem ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- mesma foto da galeria, já em cache */}
          <img src={imagem} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 grayscale-[35%]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- camada "gravada", recortada junto com o laser */}
          <img
            src={imagem}
            alt=""
            className="animate-zlaser-gravado absolute inset-0 h-full w-full object-cover brightness-110 saturate-150 sepia-[25%]"
          />
        </>
      ) : (
        <div className="animate-zlaser-gravado absolute inset-0 bg-gradient-to-b from-gold/25 to-gold/5" />
      )}
      <div className="animate-zlaser-linha absolute inset-x-0 h-0">
        <div className="absolute inset-x-0 -top-px h-[2px] bg-gold shadow-[0_0_12px_3px_rgba(212,175,55,0.75)]" />
        {FAISCAS.map(f => (
          <span
            key={f.left}
            className="animate-zfaisca absolute -top-[2px] h-1 w-1 rounded-full bg-white shadow-[0_0_6px_2px_rgba(212,175,55,0.9)]"
            style={{ left: f.left, animationDelay: f.delay, '--zf-dx': f.dx, '--zf-dy': f.dy } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
