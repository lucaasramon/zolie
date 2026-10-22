import { STATUS_LABEL } from '@/lib/utils/format';
import { lerPersonalizacao } from '@/lib/personalizacao';

const JORNADA = ['PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'] as const;
type Etapa = (typeof JORNADA)[number];

/** Na peça personalizada a etapa "Separando" é a gravação, então ela ganha nome próprio. */
const ROTULO_PERSONALIZADO: Record<Etapa, string> = {
  PROCESSANDO: 'Pagamento aprovado',
  SEPARANDO: 'Gravando sua peça',
  ENVIADO: 'A caminho',
  ENTREGUE: 'Entregue',
};

const MENSAGEM: Record<'personalizado' | 'prontaEntrega', Record<Etapa, string>> = {
  personalizado: {
    PROCESSANDO: 'Recebemos seu pagamento e sua peça já entrou na fila de gravação.',
    SEPARANDO: 'Sua peça está sendo gravada e polida. Falta pouco para ela sair daqui.',
    ENVIADO: 'Sua peça já está com a transportadora. Acompanhe pelo código de rastreio.',
    ENTREGUE: 'Sua peça chegou! Conta pra gente o que achou.',
  },
  prontaEntrega: {
    PROCESSANDO: 'Recebemos seu pagamento e já vamos separar suas peças.',
    SEPARANDO: 'Suas peças estão sendo embaladas com carinho.',
    ENVIADO: 'Seu pedido já está com a transportadora. Acompanhe pelo código de rastreio.',
    ENTREGUE: 'Seu pedido chegou! Conta pra gente o que achou.',
  },
};

interface Props {
  status: string;
  events: { status: string; createdAt: string }[];
  items: { personalizacao?: unknown }[];
}

/**
 * Linha do tempo do pedido pago: etapas com a data em que cada uma aconteceu
 * e uma frase sobre o momento atual. Em pedido com peça personalizada, mostra
 * a simulação da peça (quando houve) e chama as etapas pelo que acontece com ela.
 */
export function JornadaPedido({ status, events, items }: Props) {
  const passoAtual = JORNADA.indexOf(status as Etapa);
  if (passoAtual < 0) return null;

  const personalizacoes = items.map(i => lerPersonalizacao(i.personalizacao)).filter(p => p != null);
  const personalizado = personalizacoes.length > 0;
  const simulacao = personalizacoes.find(p => p.simulacao)?.simulacao ?? null;
  const etapaAtual = JORNADA[passoAtual];

  // Data em que o pedido chegou a cada etapa (o evento mais recente daquele status).
  const dataDa = (etapa: Etapa) => {
    const ev = events.filter(e => e.status === etapa).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return ev ? new Date(ev.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null;
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-xl bg-hoverbg/60 p-4">
        {simulacao && (
          // eslint-disable-next-line @next/next/no-img-element -- simulação gerada por IA, fora do otimizador
          <img src={simulacao.frente} alt="Simulação da sua peça" className="h-16 w-16 flex-none rounded-lg object-cover ring-1 ring-gold-soft" />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wider text-gold-text">
            {personalizado ? ROTULO_PERSONALIZADO[etapaAtual] : STATUS_LABEL[etapaAtual]}
          </span>
          <span className="text-sm text-ink-muted">{MENSAGEM[personalizado ? 'personalizado' : 'prontaEntrega'][etapaAtual]}</span>
        </div>
      </div>

      <div className="flex items-start">
        {JORNADA.map((etapa, i) => {
          const concluido = i <= passoAtual;
          const atual = i === passoAtual;
          const ultimo = i === JORNADA.length - 1;
          const data = concluido ? dataDa(etapa) : null;
          return (
            <div key={etapa} className={`flex items-start ${ultimo ? '' : 'flex-1'}`}>
              <div className="flex w-16 flex-none flex-col items-center gap-1.5 text-center sm:w-24">
                <div
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition-colors ${
                    concluido ? 'border-gold bg-gold' : 'border-border-soft bg-white'
                  } ${atual && etapa !== 'ENTREGUE' ? 'ring-4 ring-gold/25 animate-pulse' : ''}`}
                >
                  {concluido && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className={`text-[10px] leading-tight sm:text-[11px] ${concluido ? 'font-medium text-ink' : 'text-ink-tertiary'}`}>
                  {personalizado ? ROTULO_PERSONALIZADO[etapa] : STATUS_LABEL[etapa]}
                </span>
                {data && <span className="text-[10px] text-ink-tertiary">{data}</span>}
              </div>
              {!ultimo && (
                <div className={`mx-0.5 mt-3.5 h-0.5 flex-1 rounded-full transition-colors ${i < passoAtual ? 'bg-gold' : 'bg-border-soft'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
