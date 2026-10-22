'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { avisoDataComemorativa } from '@/lib/utils/datasComemorativas';

const nadaParaAssinar = () => () => {};

const ddmm = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

function prazoRestante(dias: number): string {
  if (dias === 0) return 'Último dia!';
  if (dias === 1) return 'Termina amanhã';
  if (dias <= 5) return `Faltam ${dias} dias`;
  return '';
}

/**
 * "Peça até X para chegar antes do Natal": urgência de verdade, com o limite
 * calculado pelos prazos reais de preparo e frete. Calculada no navegador
 * (depois de montar) porque o layout da loja fica em cache — no servidor a
 * data poderia estar velha.
 */
export function FaixaDataComemorativa({ slugPersonalizados }: { slugPersonalizados: string }) {
  // false no servidor e na hidratação, true depois: a data só é lida no navegador.
  const noNavegador = useSyncExternalStore(nadaParaAssinar, () => true, () => false);
  const aviso = noNavegador ? avisoDataComemorativa() : null;
  if (!aviso) return null;

  const restante = prazoRestante(aviso.diasRestantes);
  const texto =
    aviso.fase === 'todas'
      ? `${aviso.nome}: peça personalizados até ${ddmm(aviso.limitePersonalizado)} e pronta entrega até ${ddmm(aviso.limiteProntaEntrega)} para receber a tempo`
      : `${aviso.nome}: peças de pronta entrega ainda chegam a tempo se pedir até ${ddmm(aviso.limiteProntaEntrega)}`;
  const href = aviso.fase === 'todas' ? `/produtos?categoria=${slugPersonalizados}` : '/produtos';

  return (
    <Link
      href={href}
      className="animate-zfade block bg-gold px-5 py-2 text-center text-[11px] font-medium leading-snug text-ink transition-colors hover:bg-gold-hover sm:text-xs"
    >
      {restante && <span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{restante}</span>}
      {texto}
      <span className="ml-1.5 whitespace-nowrap font-semibold underline underline-offset-2">Ver peças →</span>
    </Link>
  );
}
