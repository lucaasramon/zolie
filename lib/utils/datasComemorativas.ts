import { DIAS_PREPARO, subtrairDiasUteis } from '@/lib/utils/prazoEntrega';

/**
 * Frete usado para calcular a data limite: o maior prazo da tabela de
 * contingência (Norte/Nordeste). Conservador de propósito — a promessa
 * "chega a tempo" precisa valer para o Brasil inteiro.
 */
export const FRETE_REFERENCIA_DIAS_UTEIS = 10;

/**
 * A faixa aparece a partir de quantos dias (corridos) antes da data. Largo o
 * bastante para quem planeja presente com antecedência, e ainda dentro do
 * prazo das personalizadas (que fecha ~3 semanas antes da data).
 */
const JANELA_DIAS = 75;

interface DataComemorativa {
  nome: string;
  data: Date;
}

/** 2º domingo de maio. */
function diaDasMaes(ano: number): Date {
  const primeiro = new Date(ano, 4, 1);
  const primeiroDomingo = 1 + ((7 - primeiro.getDay()) % 7);
  return new Date(ano, 4, primeiroDomingo + 7);
}

function datasDoAno(ano: number): DataComemorativa[] {
  return [
    { nome: 'Dia das Mães', data: diaDasMaes(ano) },
    { nome: 'Dia dos Namorados', data: new Date(ano, 5, 12) },
    { nome: 'Natal', data: new Date(ano, 11, 25) },
  ];
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface AvisoDataComemorativa {
  nome: string;
  /** `todas`: ainda dá tempo para personalizadas; `pronta`: só pronta entrega. */
  fase: 'todas' | 'pronta';
  limitePersonalizado: Date;
  limiteProntaEntrega: Date;
  /** Dias corridos até o limite que vale na fase atual (0 = hoje é o último dia). */
  diasRestantes: number;
}

/**
 * A próxima data comemorativa em que ainda dá para pedir e receber a tempo.
 * A peça precisa chegar no último dia útil antes da data (entregas não
 * acontecem no fim de semana nem no próprio feriado), então o limite volta
 * daí o preparo + o frete de referência.
 */
export function avisoDataComemorativa(agora = new Date()): AvisoDataComemorativa | null {
  const hoje = inicioDoDia(agora);
  const candidatas = [...datasDoAno(hoje.getFullYear()), ...datasDoAno(hoje.getFullYear() + 1)];

  for (const { nome, data } of candidatas) {
    const diasAteData = Math.round((data.getTime() - hoje.getTime()) / 86_400_000);
    if (diasAteData <= 0 || diasAteData > JANELA_DIAS) continue;

    const chegada = subtrairDiasUteis(data, 1);
    const limitePersonalizado = subtrairDiasUteis(chegada, DIAS_PREPARO.personalizado + FRETE_REFERENCIA_DIAS_UTEIS);
    const limiteProntaEntrega = subtrairDiasUteis(chegada, DIAS_PREPARO.prontaEntrega + FRETE_REFERENCIA_DIAS_UTEIS);
    const diasAte = (limite: Date) => Math.round((limite.getTime() - hoje.getTime()) / 86_400_000);

    if (hoje <= limitePersonalizado) {
      return { nome, fase: 'todas', limitePersonalizado, limiteProntaEntrega, diasRestantes: diasAte(limitePersonalizado) };
    }
    if (hoje <= limiteProntaEntrega) {
      return { nome, fase: 'pronta', limitePersonalizado, limiteProntaEntrega, diasRestantes: diasAte(limiteProntaEntrega) };
    }
  }
  return null;
}

/**
 * Hoje no calendário de Brasília, como data local. O servidor da Vercel roda
 * em UTC: entre 21h e meia-noite ele já estaria no dia seguinte.
 */
export function hojeNoBrasil(agora = new Date()): Date {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(agora)
      .map(p => [p.type, p.value]),
  );
  return new Date(Number(partes.year), Number(partes.month) - 1, Number(partes.day));
}

export interface ConteudoFaixa {
  texto: string;
  /** Selo de urgência ("Faltam 3 dias"); vazio quando ainda há folga. */
  restante: string;
  href: string;
}

const ddmm = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

function prazoRestante(dias: number): string {
  if (dias === 0) return 'Último dia!';
  if (dias === 1) return 'Termina amanhã';
  if (dias <= 5) return `Faltam ${dias} dias`;
  return '';
}

/** Texto pronto da faixa — só strings, para atravessar do servidor ao navegador sem fuso envolvido. */
export function conteudoFaixa(aviso: AvisoDataComemorativa | null, slugPersonalizados: string): ConteudoFaixa | null {
  if (!aviso) return null;
  const texto =
    aviso.fase === 'todas'
      ? `${aviso.nome}: peça personalizados até ${ddmm(aviso.limitePersonalizado)} e pronta entrega até ${ddmm(aviso.limiteProntaEntrega)} para receber a tempo`
      : `${aviso.nome}: peças de pronta entrega ainda chegam a tempo se pedir até ${ddmm(aviso.limiteProntaEntrega)}`;
  const href = aviso.fase === 'todas' ? `/produtos?categoria=${slugPersonalizados}` : '/produtos';
  return { texto, restante: prazoRestante(aviso.diasRestantes), href };
}
