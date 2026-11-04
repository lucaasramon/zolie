'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PingenteDesenho } from '@/components/product/PreviaVerso';
import type { FormatoPingente } from '@/lib/personalizacao';
import { garantirCupomGuardado } from '@/lib/cupomGuardado';
import { salvarRascunho } from '@/lib/rascunhoPersonalizacao';
import { linkWhatsApp } from '@/lib/loja';
import { brl } from '@/lib/utils/money';
import { trackStory } from '@/lib/analytics';

export interface PecaStory {
  chave: string;
  productId: string;
  slug: string;
  modeloId: string | null;
  rotulo: string;
  formato: FormatoPingente;
  material: string;
  materialLabel: string;
  preco: number;
  valorVerso: number;
  corrente: string;
}

export interface CupomStory {
  codigo: string;
  percentual: number;
}

interface Props {
  pecas: PecaStory[];
  cupom: CupomStory | null;
}

type Tela = 'cupom' | 'peca' | 'texto' | 'resultado';

/** A tela do cupom avança sozinha depois disso, como um story. */
const DURACAO_CUPOM_MS = 9000;
const LIMITE_TEXTO = 40;
const SUGESTOES = ['Helena', 'Mãe ♥', 'Te amo', '12.03.2024', 'Gratidão', 'Meu amor'];

const comDesconto = (valor: number, cupom: CupomStory | null) =>
  cupom ? Math.round(valor * (1 - cupom.percentual / 100) * 100) / 100 : valor;

const dataValidade = (ms: number) =>
  new Date(ms).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/**
 * Story do anúncio: cupom → escolha da peça → digitar a gravação → resultado.
 *
 * Imita os stories do Instagram de propósito (barrinhas no topo, tela cheia,
 * tocar na borda esquerda volta, segurar pausa): quem chega pelo anúncio
 * estava vendo stories, e a mesma mecânica mantém a pessoa no ritmo em vez de
 * "cair numa loja" e voltar para o app.
 */
export function StoryGravacao({ pecas, cupom }: Props) {
  const router = useRouter();
  const telas: Tela[] = cupom ? ['cupom', 'peca', 'texto', 'resultado'] : ['peca', 'texto', 'resultado'];
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [peca, setPeca] = useState<PecaStory | null>(pecas[0] ?? null);
  const [texto, setTexto] = useState('');
  const [validade, setValidade] = useState<number | null>(null);
  const tela = telas[indice];

  // O prazo do cupom é contado da primeira visita e vive no navegador.
  /* eslint-disable react-hooks/set-state-in-effect -- localStorage só existe depois de montar */
  useEffect(() => {
    if (!cupom) return;
    setValidade(garantirCupomGuardado(cupom.codigo).expiraEm);
  }, [cupom]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    trackStory(tela, peca ? { story_peca: peca.rotulo } : undefined);
    // Cada tela é registrada uma vez ao aparecer; a peça vai junto como tag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tela]);

  const avancar = () => setIndice(i => Math.min(i + 1, telas.length - 1));
  const voltar = () => setIndice(i => Math.max(i - 1, 0));

  if (!peca) {
    return (
      <Moldura>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="z-title text-3xl">As peças personalizadas estão voltando em breve</p>
          <Link href="/produtos" className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-white">
            Ver a loja
          </Link>
        </div>
      </Moldura>
    );
  }

  const precoFinal = peca.preco + peca.valorVerso;

  function quero() {
    if (!peca) return;
    trackStory('quero', { story_peca: peca.rotulo });
    salvarRascunho(peca.productId, {
      personalizacao: { modeloId: peca.modeloId, imagens: [], verso: true, textoVerso: texto.trim() },
      tamanho: peca.corrente,
      simulacao: null,
      salvoEm: Date.now(),
    });
    router.push(`/produtos/${peca.slug}#comprar`);
  }

  const hrefWhatsApp = linkWhatsApp(
    [
      `Oi! Vim pelo anúncio e montei minha peça: ${peca.rotulo} com a gravação "${texto.trim()}".`,
      cupom ? `Ganhei o cupom ${cupom.codigo}.` : '',
      'Pode me ajudar a finalizar?',
    ]
      .filter(Boolean)
      .join(' '),
  );

  return (
    <Moldura
      // Segurar o dedo na tela pausa o story, como no Instagram.
      onPointerDown={() => tela === 'cupom' && setPausado(true)}
      onPointerUp={() => setPausado(false)}
      onPointerCancel={() => setPausado(false)}
    >
      {/* Barrinhas do story */}
      <div className="relative z-20 flex gap-1 px-3 pt-3">
        {telas.map((t, i) => (
          <div key={t} className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/15">
            {i < indice && <div className="h-full w-full bg-ink/80" />}
            {i === indice && t === 'cupom' && (
              <div
                className="animate-zstory-barra h-full w-full bg-ink/80"
                style={{ animationDuration: `${DURACAO_CUPOM_MS}ms`, animationPlayState: pausado ? 'paused' : 'running' }}
                onAnimationEnd={avancar}
              />
            )}
            {i === indice && t !== 'cupom' && <div className="h-full w-1/3 bg-ink/80 transition-all" />}
          </div>
        ))}
      </div>

      {/* Cabeçalho do story: avatar + nome, como no Instagram */}
      <div className="relative z-20 flex items-center gap-2.5 px-4 pt-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-serif text-sm text-gold ring-2 ring-gold/70 ring-offset-2 ring-offset-[#FBF6EA]">
          Z
        </span>
        <span className="text-[13px] font-semibold text-ink">zolieoficial</span>
        <span className="text-[12px] text-ink-tertiary">agora</span>
        <Link
          href={`/produtos/${peca.slug}`}
          onClick={() => trackStory('fechou')}
          aria-label="Fechar e ir para a loja"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-xl text-ink/70"
        >
          ×
        </Link>
      </div>

      {/* Toque na borda esquerda volta, como nos stories. */}
      {indice > 0 && (
        <button
          type="button"
          aria-label="Voltar"
          onClick={voltar}
          className="absolute bottom-0 left-0 top-20 z-0 w-[16%]"
        />
      )}

      <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col">
        {tela === 'cupom' && cupom && (
          <TelaCupom key="cupom" cupom={cupom} validade={validade} onContinuar={avancar} />
        )}

        {tela === 'peca' && (
          <div key="peca" className="animate-zfade flex flex-1 flex-col justify-center gap-5 px-5 pb-8">
            <div className="text-center">
              <p className="z-title text-[34px] leading-tight">Qual é a sua peça?</p>
              <p className="mt-1 text-sm text-ink-muted">Toque para escolher</p>
            </div>
            {/* "Enquete" no estilo dos stickers do Instagram */}
            <div className="pointer-events-auto grid grid-cols-2 gap-3 rounded-[26px] bg-white/90 p-3 shadow-[0_10px_40px_-12px_rgba(46,42,36,0.35)] backdrop-blur">
              {pecas.map(p => {
                const ativo = p.chave === peca.chave;
                return (
                  <button
                    key={p.chave}
                    type="button"
                    onClick={() => {
                      setPeca(p);
                      setTimeout(avancar, 280);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 pb-3 pt-4 transition-all active:scale-95 ${
                      ativo ? 'border-gold bg-gold/10' : 'border-transparent bg-bg-alt'
                    }`}
                  >
                    <div className="h-24 w-24">
                      <PingenteDesenho texto="Amor" formato={p.formato} material={p.material} />
                    </div>
                    <span className="text-center text-[13px] font-semibold leading-tight text-ink">{p.rotulo}</span>
                    <span className="text-[11px] text-ink-tertiary">{p.materialLabel}</span>
                    <span className="text-[13px] font-medium text-gold-text">{brl(comDesconto(p.preco + p.valorVerso, cupom))}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tela === 'texto' && (
          <div key="texto" className="animate-zfade flex flex-1 flex-col items-center gap-4 overflow-y-auto px-5 pb-6 pt-2">
            <Pingente texto={texto || 'Seu texto'} peca={peca} tamanho="h-44 w-44" />
            {/* "Caixa de perguntas" no estilo dos stickers do Instagram */}
            <div className="pointer-events-auto w-full overflow-hidden rounded-[26px] bg-white shadow-[0_10px_40px_-12px_rgba(46,42,36,0.35)]">
              <div className="bg-gradient-to-r from-[#C9A13B] via-gold to-[#E6C766] px-4 py-3 text-center text-[15px] font-semibold text-ink">
                O que você quer gravar?
              </div>
              <div className="flex flex-col gap-3 p-4">
                <input
                  value={texto}
                  onChange={e => setTexto(e.target.value.slice(0, LIMITE_TEXTO))}
                  onFocus={() => trackStory('digitou')}
                  placeholder="Um nome, uma data, uma frase..."
                  enterKeyHint="done"
                  onKeyDown={e => e.key === 'Enter' && texto.trim() && avancar()}
                  className="w-full rounded-2xl bg-bg-alt px-4 py-3.5 text-center text-lg text-ink outline-none placeholder:text-base placeholder:text-ink-tertiary focus:ring-2 focus:ring-gold/50"
                />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGESTOES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTexto(s)}
                      className="rounded-full border border-border-soft px-3 py-1.5 text-[12px] text-ink-muted active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!texto.trim()}
              onClick={avancar}
              className="pointer-events-auto w-full rounded-full bg-ink py-4 text-[15px] font-medium text-white shadow-lg transition-opacity active:scale-[0.98] disabled:opacity-35"
            >
              Ver como ficou ✨
            </button>
          </div>
        )}

        {tela === 'resultado' && (
          <div key="resultado" className="animate-zfade flex flex-1 flex-col items-center gap-4 overflow-y-auto px-5 pb-6 pt-2">
            <Pingente texto={texto} peca={peca} tamanho="h-56 w-56" />
            <div className="text-center">
              <p className="z-title text-[32px] leading-tight">Ficou linda ✨</p>
              <p className="mt-1 text-sm text-ink-muted">
                {peca.rotulo} com &ldquo;{texto.trim()}&rdquo;
              </p>
            </div>

            <div className="w-full rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm">
              {cupom ? (
                <>
                  <span className="text-sm text-ink-tertiary line-through">{brl(precoFinal)}</span>
                  <p className="text-[30px] font-medium leading-tight text-ink">{brl(comDesconto(precoFinal, cupom))}</p>
                  <span className="text-[12px] font-medium text-success">com seus {cupom.percentual}% de presente, já aplicados</span>
                </>
              ) : (
                <p className="text-[30px] font-medium leading-tight text-ink">{brl(precoFinal)}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                <span>✓ {peca.materialLabel}</span>
                <span>✓ Troca em 30 dias</span>
                <span>✓ Envio para todo o Brasil</span>
              </div>
            </div>

            <div className="pointer-events-auto flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={quero}
                className="w-full rounded-full bg-ink py-4 text-[15px] font-medium text-white shadow-lg active:scale-[0.98]"
              >
                Quero a minha
              </button>
              {hrefWhatsApp && (
                <a
                  href={hrefWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackStory('whatsapp', { story_peca: peca.rotulo })}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white py-3.5 text-[14px] font-medium text-ink active:scale-[0.98]"
                >
                  <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                  Tirar dúvidas no WhatsApp
                </a>
              )}
              <button type="button" onClick={voltar} className="py-2 text-[13px] text-ink-tertiary underline underline-offset-2">
                Mudar a gravação
              </button>
            </div>
          </div>
        )}
      </div>
    </Moldura>
  );
}

/** Tela cheia do story; no computador vira uma "tela de celular" centralizada. */
function Moldura({ children, ...eventos }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-[#1E1B17]">
      <div
        {...eventos}
        className="relative flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#FFFDF7_0%,#FBF6EA_45%,#F3E6C8_100%)] text-ink"
      >
        {children}
      </div>
    </div>
  );
}

/** Pingente pendurado numa corrente fina, balançando de leve. */
function Pingente({ texto, peca, tamanho }: { texto: string; peca: PecaStory; tamanho: string }) {
  const prata = peca.material !== 'BANHADO_OURO';
  return (
    <div className="animate-zbalanco flex flex-col items-center">
      <svg viewBox="0 0 120 60" className="-mb-2 h-14 w-28" aria-hidden="true">
        <path
          d="M2 0 Q60 70 118 0"
          fill="none"
          stroke={prata ? '#A9AEB6' : '#C9A13B'}
          strokeWidth="1.6"
          strokeDasharray="2.2 1.4"
        />
        <circle cx="60" cy="34" r="4" fill="none" stroke={prata ? '#9097A1' : '#9C7A26'} strokeWidth="1.8" />
      </svg>
      <div className={tamanho}>
        <PingenteDesenho texto={texto} formato={peca.formato} material={peca.material} className="h-full w-full drop-shadow-xl" />
      </div>
    </div>
  );
}

function TelaCupom({ cupom, validade, onContinuar }: { cupom: CupomStory; validade: number | null; onContinuar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 pb-10">
      <div className="animate-zfade text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-text">Zoliê Semijoias</p>
        <p className="z-title mt-3 text-[38px] leading-[1.05]">Que bom que você veio 🤍</p>
        <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-ink-muted">
          Você chegou pelo nosso anúncio, então separamos um presente para a sua primeira peça:
        </p>
      </div>

      {/* O cupom: vale-presente com picote, não banner de "parabéns você ganhou" */}
      <div className="animate-zcupom relative mx-auto w-full max-w-[330px] [animation-delay:250ms]">
        <div className="relative flex overflow-hidden rounded-2xl bg-ink text-white shadow-[0_18px_50px_-14px_rgba(46,42,36,0.6)]">
          <span className="animate-zbrilho-cupom pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <span className="font-serif text-[64px] font-medium leading-none text-gold">{cupom.percentual}%</span>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[#E8DEC9]">de desconto</span>
          </div>
          <div className="relative w-0 border-l-2 border-dashed border-white/25">
            <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-[#FBF6EA]" />
            <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-[#F5EAD0]" />
          </div>
          <div className="flex w-[38%] flex-col items-center justify-center gap-1.5 px-2 py-6 text-center">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#E8DEC9]">código</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(cupom.codigo).catch(() => {});
                setCopiado(true);
                timer.current = setTimeout(() => setCopiado(false), 1600);
              }}
              className="pointer-events-auto rounded-md border border-gold/50 px-2 py-1 font-mono text-[13px] font-semibold tracking-wider text-gold"
            >
              {copiado ? 'copiado ✓' : cupom.codigo}
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-muted">
          Já vai aplicado na sua sacola, sem precisar digitar.
          {validade && (
            <>
              <br />
              <span className="text-ink-tertiary">Válido até {dataValidade(validade)}</span>
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onContinuar}
        className="animate-zfade pointer-events-auto mx-auto w-full max-w-[330px] rounded-full bg-gold py-4 text-[15px] font-semibold text-ink shadow-lg [animation-delay:700ms] [animation-fill-mode:both] active:scale-[0.98]"
      >
        Ver como fica a minha gravação →
      </button>
    </div>
  );
}
