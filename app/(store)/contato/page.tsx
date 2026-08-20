'use client';

import { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError } from '@/lib/api-client';
import { ZodIssue } from 'zod';
import { LOJA, linkWhatsApp, formatarTelefone } from '@/lib/loja';

const FORM_VAZIO = { nome: '', email: '', pedido: '', assunto: 'Dúvida sobre pedido', mensagem: '' };

const ASSUNTOS = ['Dúvida sobre pedido', 'Troca ou devolução', 'Dúvida sobre produto', 'Outro assunto'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Campo = keyof typeof FORM_VAZIO;
type Erros = Partial<Record<Campo, string>>;

function validar(form: typeof FORM_VAZIO): Erros {
  const erros: Erros = {};
  if (form.nome.trim().length < 2) erros.nome = 'Informe seu nome completo';
  if (!EMAIL_RE.test(form.email.trim())) erros.email = 'Informe um e-mail válido';
  if (form.mensagem.trim().length < 10) erros.mensagem = 'Escreva um pouco mais sobre o que você precisa (mín. 10 caracteres)';
  return erros;
}

/** Traduz os issues do Zod (422 da API) para erros por campo, sobrepondo a validação local. */
function erroDoServidor(err: unknown): Erros | null {
  if (!(err instanceof ApiError)) return null;
  const issues = err.issues as ZodIssue[] | undefined;
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const erros: Erros = {};
  for (const issue of issues) {
    const campo = issue.path?.[0];
    if (typeof campo === 'string' && campo in FORM_VAZIO) erros[campo as Campo] = issue.message;
  }
  return Object.keys(erros).length > 0 ? erros : null;
}

export default function ContatoPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const whatsapp = linkWhatsApp('Olá! Vim pelo site da Zoliê.');

  function set<K extends Campo>(campo: K, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
    setErros(e => (e[campo] ? { ...e, [campo]: undefined } : e));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errosLocais = validar(form);
    if (Object.keys(errosLocais).length > 0) {
      setErros(errosLocais);
      showToast('Confira os campos destacados antes de enviar.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/contact', {
        nome: form.nome,
        email: form.email,
        assunto: form.assunto,
        mensagem: form.mensagem,
        pedido: form.pedido || null,
      });
      setEnviado(true);
      setForm(FORM_VAZIO);
      setErros({});
    } catch (err) {
      const errosServidor = erroDoServidor(err);
      if (errosServidor) {
        setErros(errosServidor);
        showToast('Alguns campos precisam de ajuste.');
      } else {
        showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar sua mensagem. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <div className="mb-10 text-center md:mb-14">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gold-text">Fale conosco</p>
        <h1 className="font-serif text-4xl font-semibold text-ink md:text-5xl">Entre em contato</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
          Preencha o formulário abaixo ou fale conosco pelo WhatsApp — respondemos em até 1 dia útil.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr] md:gap-8">
        <div className="flex flex-col gap-4">
          {whatsapp && (
            <InfoCard titulo="WhatsApp" descricao="Atendimento rápido para dúvidas gerais.">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="text-sm font-medium text-gold-text hover:text-gold-text-hover">
                {formatarTelefone(LOJA.whatsapp)} →
              </a>
            </InfoCard>
          )}
          {LOJA.email && (
            <InfoCard titulo="E-mail" descricao="Para assuntos mais detalhados.">
              <a href={`mailto:${LOJA.email}`} className="text-sm font-medium text-ink hover:text-gold-text">
                {LOJA.email}
              </a>
            </InfoCard>
          )}
          <InfoCard titulo="Horário de atendimento" descricao="Segunda a sexta, 9h às 18h.">
            <span className="text-sm text-ink-secondary">Respondemos em até 1 dia útil.</span>
          </InfoCard>
        </div>

        <div className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm md:p-8">
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success-bg text-success">✓</div>
              <h2 className="font-serif text-2xl font-semibold text-ink">Mensagem enviada!</h2>
              <p className="max-w-sm text-sm text-ink-secondary">Responderemos em até 1 dia útil. Enviamos uma confirmação para o seu e-mail.</p>
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="mt-2 text-xs font-medium uppercase tracking-wider text-gold-text hover:text-gold-text-hover"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome" value={form.nome} onChange={v => set('nome', v)} erro={erros.nome} required />
                <Field label="E-mail" type="email" value={form.email} onChange={v => set('email', v)} erro={erros.email} required />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink-muted">Assunto</span>
                  <select
                    value={form.assunto}
                    onChange={e => set('assunto', e.target.value)}
                    className="rounded-md border border-border-subtle bg-bg px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-gold"
                  >
                    {ASSUNTOS.map(a => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
                <Field label="Número do pedido (opcional)" value={form.pedido} onChange={v => set('pedido', v)} />
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink-muted">Mensagem</span>
                <textarea
                  value={form.mensagem}
                  onChange={e => set('mensagem', e.target.value)}
                  rows={5}
                  aria-invalid={!!erros.mensagem}
                  className={`resize-none rounded-md border bg-bg px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-gold ${
                    erros.mensagem ? 'border-danger' : 'border-border-subtle'
                  }`}
                />
                {erros.mensagem && <span className="text-xs text-danger">{erros.mensagem}</span>}
              </label>

              <button
                type="submit"
                disabled={enviando}
                className="self-start rounded-full bg-gold px-7 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-ink">{titulo}</h3>
      <p className="mt-1 text-xs text-ink-tertiary">{descricao}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  erro,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  erro?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        aria-invalid={!!erro}
        className={`rounded-md border bg-bg px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-gold ${
          erro ? 'border-danger' : 'border-border-subtle'
        }`}
      />
      {erro && <span className="text-xs text-danger">{erro}</span>}
    </label>
  );
}
