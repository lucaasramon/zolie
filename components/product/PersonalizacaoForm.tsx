'use client';

import { useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';
import { FONTES_PERSONALIZACAO, LIMITE_IMAGENS_PERSONALIZACAO, PERGUNTAS_PERSONALIZACAO } from '@/lib/personalizacao';

export interface PersonalizacaoState {
  imagens: string[];
  /** null = ainda não respondido (a pergunta é obrigatória). */
  verso: boolean | null;
  textoVerso: string;
  pingente: boolean;
  fonte: string | null;
}

export const PERSONALIZACAO_INICIAL: PersonalizacaoState = {
  imagens: [],
  verso: null,
  textoVerso: '',
  pingente: true,
  fonte: null,
};

/** Mensagem do primeiro problema encontrado, ou null se dá para enviar. */
export function validarPersonalizacao(p: PersonalizacaoState): string | null {
  if (p.verso === null) return 'Informe se deseja personalização no verso';
  if (p.verso && !p.textoVerso.trim()) return 'Escreva a personalização do verso';
  return null;
}

const labelClass = 'text-sm font-semibold text-ink';
const inputClass =
  'w-full rounded-lg border border-border-subtle bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold-soft';

interface Props {
  value: PersonalizacaoState;
  onChange: (next: PersonalizacaoState) => void;
  correntes: string[];
  corrente: string;
  onCorrenteChange: (corrente: string) => void;
  erro?: string | null;
}

export function PersonalizacaoForm({ value, onChange, correntes, corrente, onCorrenteChange, erro }: Props) {
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const set = (patch: Partial<PersonalizacaoState>) => onChange({ ...value, ...patch });
  const limiteAtingido = value.imagens.length >= LIMITE_IMAGENS_PERSONALIZACAO;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const vagas = LIMITE_IMAGENS_PERSONALIZACAO - value.imagens.length;
    if (files.length === 0 || vagas <= 0) return;
    if (files.length > vagas) showToast(`Limite de ${LIMITE_IMAGENS_PERSONALIZACAO} arquivos — enviamos só os primeiros.`);

    setEnviando(true);
    const urls: string[] = [];
    try {
      for (const file of files.slice(0, vagas)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new ApiError('Formato inválido. Use JPG, PNG ou WEBP.', 400, 'INVALID_FILE_TYPE');
        if (file.size > 5 * 1024 * 1024) throw new ApiError('Arquivo muito grande. Máximo de 5MB.', 400, 'FILE_TOO_LARGE');
        const { data } = await api.upload<{ url: string }>('/personalizacao/uploads', file);
        urls.push(data.url);
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar a imagem');
    } finally {
      // Mantém as que subiram antes de um eventual erro no meio do lote.
      if (urls.length > 0) set({ imagens: [...value.imagens, ...urls] });
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onFiles} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={enviando || limiteAtingido}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-soft bg-bg-alt/40 px-4 py-7 text-center transition-colors hover:border-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-gold-text" aria-hidden="true">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
          <span className="text-base font-semibold text-ink">{PERGUNTAS_PERSONALIZACAO.imagens}</span>
          <span className="text-sm text-ink-muted">
            {enviando ? 'Enviando...' : limiteAtingido ? 'Limite de arquivos atingido' : PERGUNTAS_PERSONALIZACAO.imagensAjuda}
          </span>
        </button>
        {value.imagens.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {value.imagens.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia do arquivo recém-enviado pela cliente */}
                <img src={url} alt={`Imagem ${i + 1} da personalização`} className="h-20 w-20 rounded-lg object-cover ring-1 ring-border-subtle" />
                <button
                  type="button"
                  onClick={() => set({ imagens: value.imagens.filter(u => u !== url) })}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-white shadow-sm"
                  aria-label={`Remover imagem ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>{PERGUNTAS_PERSONALIZACAO.verso}</legend>
        {[
          { label: 'sim', v: true },
          { label: 'não', v: false },
        ].map(o => (
          <label key={o.label} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={value.verso === o.v}
              onChange={() => set({ verso: value.verso === o.v ? null : o.v })}
              className="h-6 w-6 rounded-md accent-gold"
            />
            {o.label}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{PERGUNTAS_PERSONALIZACAO.textoVerso}</span>
        <input
          value={value.textoVerso}
          onChange={e => set({ textoVerso: e.target.value })}
          maxLength={200}
          disabled={value.verso === false}
          className={`${inputClass} disabled:bg-bg-alt disabled:opacity-60`}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{PERGUNTAS_PERSONALIZACAO.pingente}</span>
        <select value={value.pingente ? 'com' : 'sem'} onChange={e => set({ pingente: e.target.value === 'com' })} className={inputClass}>
          <option value="com">Com pingente</option>
          <option value="sem">Sem pingente</option>
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>{PERGUNTAS_PERSONALIZACAO.fonte}</legend>
        {FONTES_PERSONALIZACAO.map(f => (
          <label key={f} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input
              type="radio"
              name="fonte-personalizacao"
              checked={value.fonte === f}
              onChange={() => set({ fonte: f })}
              className="h-6 w-6 accent-gold"
            />
            {f}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{PERGUNTAS_PERSONALIZACAO.corrente}</span>
        <select value={corrente} onChange={e => onCorrenteChange(e.target.value)} className={inputClass}>
          {correntes.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      {erro && <p className="text-sm text-danger">{erro}</p>}
    </div>
  );
}
