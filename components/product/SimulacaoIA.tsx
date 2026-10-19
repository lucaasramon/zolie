'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { OpcaoPersonalizacao } from '@/lib/personalizacao';
import { PersonalizacaoState, validarPersonalizacao } from '@/components/product/PersonalizacaoForm';

export interface ResultadoSimulacao {
  frente: string;
  verso: string;
  corPingente: string | null;
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
    pingente: p.pingente,
    fonte: p.fonte,
    tamanho,
  });
}

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
  personalizacao: PersonalizacaoState;
  tamanho: string;
  opcoes: OpcaoPersonalizacao[];
  resultado: ResultadoSimulacao | null;
  onResultado: (r: ResultadoSimulacao | null) => void;
}

export function SimulacaoIA({ productId, personalizacao, tamanho, opcoes, resultado, onResultado }: Props) {
  const [gerando, setGerando] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);

  useEffect(() => {
    if (!gerando) return;
    const t = setInterval(() => setEtapa(e => Math.min(e + 1, ETAPAS.length - 1)), 14_000);
    return () => clearInterval(t);
  }, [gerando]);

  const desatualizada = resultado != null && resultado.assinatura !== assinaturaEscolhas(personalizacao, tamanho);

  async function simular() {
    const problema = validarPersonalizacao(personalizacao, opcoes);
    if (problema) {
      setErro(`${problema} para simular.`);
      return;
    }
    setErro(null);
    setEtapa(0);
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
          pingente: personalizacao.pingente,
          fonte: personalizacao.fonte,
        },
      });
      onResultado({ ...data, assinatura: assinaturaEscolhas(personalizacao, tamanho) });
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
        <div className="flex flex-col items-center gap-3 rounded-lg bg-white/70 px-4 py-6 text-center" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">{ETAPAS[etapa]}</span>
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
            ].map(f => (
              <button key={f.rotulo} type="button" onClick={() => setAmpliada(f.url)} className="group flex flex-col gap-1.5 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada sob demanda, fora do otimizador */}
                <img
                  src={f.url}
                  alt={`Simulação da ${f.rotulo.toLowerCase()} da peça`}
                  className="aspect-square w-full rounded-lg object-cover ring-1 ring-border-subtle transition-transform group-hover:scale-[1.02]"
                />
                <span className="text-center text-xs font-medium uppercase tracking-wider text-ink">{f.rotulo}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-ink-tertiary">
            Simulação ilustrativa gerada por IA{resultado.corPingente ? ` (pingente simulado na cor ${resultado.corPingente}; a cor real é aleatória)` : ''}.
            A peça é produzida a partir das suas respostas, e você recebe a prévia real para aprovação no WhatsApp.
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
