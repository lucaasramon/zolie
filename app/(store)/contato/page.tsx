'use client';

import { useState } from 'react';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError } from '@/lib/api-client';

const FORM_VAZIO = { nome: '', email: '', pedido: '', assunto: 'Dúvida sobre pedido', mensagem: '' };

export default function ContatoPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/contact', {
        nome: form.nome,
        email: form.email,
        assunto: form.assunto,
        mensagem: form.mensagem,
        pedido: form.pedido || null,
      });
      showToast('Mensagem enviada! Responderemos em até 1 dia útil.');
      setForm(FORM_VAZIO);
    } catch (err) {
      // Antes o toast de sucesso aparecia sem nada ter sido enviado.
      showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <InstitutionalPage titulo="Contato">
      <p>Preencha o formulário abaixo ou fale conosco pelo WhatsApp — respondemos em até 1 dia útil.</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <Field label="Nome" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} required />
        <Field label="E-mail" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
        <Field label="Número do pedido (opcional)" value={form.pedido} onChange={v => setForm(f => ({ ...f, pedido: v }))} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Assunto</span>
          <select value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5">
            <option>Dúvida sobre pedido</option>
            <option>Troca ou devolução</option>
            <option>Dúvida sobre produto</option>
            <option>Outro assunto</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Mensagem</span>
          <textarea
            value={form.mensagem}
            onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
            required
            rows={5}
            className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>
    </InstitutionalPage>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
    </label>
  );
}
