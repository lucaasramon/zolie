'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { avisoDataComemorativa, conteudoFaixa, hojeNoBrasil, type ConteudoFaixa } from '@/lib/utils/datasComemorativas';

const nadaParaAssinar = () => () => {};

interface Props {
  slugPersonalizados: string;
  /** Calculado no servidor: a faixa já vem no HTML e não empurra a página ao aparecer. */
  inicial: ConteudoFaixa | null;
}

/**
 * "Peça até X para chegar antes do Natal": urgência de verdade, com o limite
 * calculado pelos prazos reais de preparo e frete.
 *
 * Antes a faixa só era montada no navegador, depois da hidratação, e surgia no
 * topo empurrando a página inteira para baixo (o maior "pulo" de layout medido
 * pelo Clarity). Agora o servidor a renderiza; o navegador recalcula só para
 * corrigir uma página servida de cache antiga — no caso comum o texto é o mesmo
 * e nada se mexe.
 */
export function FaixaDataComemorativa({ slugPersonalizados, inicial }: Props) {
  // Na renderização do servidor e na hidratação vale `inicial`; depois, o valor do navegador.
  const noNavegador = useSyncExternalStore(nadaParaAssinar, () => true, () => false);
  const conteudo = noNavegador
    ? conteudoFaixa(avisoDataComemorativa(hojeNoBrasil()), slugPersonalizados)
    : inicial;
  if (!conteudo) return null;

  return (
    <Link
      href={conteudo.href}
      className="block bg-gold px-5 py-2 text-center text-[11px] font-medium leading-snug text-ink transition-colors hover:bg-gold-hover sm:text-xs"
    >
      {conteudo.restante && (
        <span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          {conteudo.restante}
        </span>
      )}
      {conteudo.texto}
      <span className="ml-1.5 whitespace-nowrap font-semibold underline underline-offset-2">Ver peças →</span>
    </Link>
  );
}
