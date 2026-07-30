'use client';

import { useState } from 'react';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { useToast } from '@/components/providers/ToastProvider';

export default function ContatoPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ nome: '', email: '', pedido: '', assunto: 'Dúvida sobre pedido', mensagem: '' });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    showToast('Mensagem enviada! Responderemos em breve.');
    setForm({ nome: '', email: '', pedido: '', assunto: 'Dúvida sobre pedido', mensagem: '' });
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
        <button type="submit" className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
          Enviar mensagem
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
