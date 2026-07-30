'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';

interface Coupon {
  id: string;
  codigo: string;
  descricao: string | null;
  tipoDesconto: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';
  valor: number | string;
  minimoPedido: number | string | null;
  usoMaximo: number | null;
  usos: number;
  primeiraCompra: boolean;
  validade: string | null;
  ativo: boolean;
}

function regraTexto(c: Coupon) {
  const base =
    c.tipoDesconto === 'PERCENT' ? `${Number(c.valor)}% de desconto` : c.tipoDesconto === 'FIXED' ? `${brl(c.valor)} de desconto` : 'Frete grátis';
  const partes = [base];
  if (c.minimoPedido) partes.push(`acima de ${brl(c.minimoPedido)}`);
  if (c.primeiraCompra) partes.push('só na primeira compra');
  return partes.join(' · ');
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ codigo: '', tipoDesconto: 'PERCENT' as Coupon['tipoDesconto'], valor: '', minimoPedido: '', usoMaximo: '', validade: '', primeiraCompra: false });
  const [erro, setErro] = useState('');

  async function toggleAtivo(c: Coupon) {
    await api.put(`/coupons/${c.id}`, { ativo: !c.ativo });
    router.refresh();
  }

  async function remover(id: string) {
    await api.delete(`/coupons/${id}`);
    router.refresh();
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/coupons', {
        codigo: form.codigo,
        tipoDesconto: form.tipoDesconto,
        valor: Number(form.valor) || 0,
        minimoPedido: form.minimoPedido ? Number(form.minimoPedido) : null,
        usoMaximo: form.usoMaximo ? Number(form.usoMaximo) : null,
        validade: form.validade || null,
        primeiraCompra: form.primeiraCompra,
      });
      setForm({ codigo: '', tipoDesconto: 'PERCENT', valor: '', minimoPedido: '', usoMaximo: '', validade: '', primeiraCompra: false });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o cupom');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {coupons.map(c => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-xs">
            <div>
              <span className="font-sans text-lg font-semibold text-gold-text">{c.codigo}</span>
              <div className="text-sm text-ink-muted">{regraTexto(c)}</div>
              <div className="text-xs text-ink-tertiary">
                {c.validade ? `Válido até ${new Date(c.validade).toLocaleDateString('pt-BR')}` : 'Sem validade'} · {c.usos} usos
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleAtivo(c)}
                className={`rounded-full px-3 py-1 text-xs ${c.ativo ? 'bg-success-bg text-success' : 'bg-hoverbg text-ink-tertiary'}`}
              >
                {c.ativo ? 'Ativo' : 'Pausado'}
              </button>
              <button type="button" onClick={() => remover(c.id)} className="text-xs text-danger hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={criar} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Novo cupom</h2>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <Field label="Código" value={form.codigo} onChange={v => setForm(f => ({ ...f, codigo: v.toUpperCase() }))} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Tipo</span>
          <select value={form.tipoDesconto} onChange={e => setForm(f => ({ ...f, tipoDesconto: e.target.value as Coupon['tipoDesconto'] }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
            <option value="PERCENT">Percentual</option>
            <option value="FIXED">Valor fixo</option>
            <option value="FREE_SHIPPING">Frete grátis</option>
          </select>
        </label>
        {form.tipoDesconto !== 'FREE_SHIPPING' && <Field label="Valor" type="number" value={form.valor} onChange={v => setForm(f => ({ ...f, valor: v }))} />}
        <Field label="Pedido mínimo" type="number" value={form.minimoPedido} onChange={v => setForm(f => ({ ...f, minimoPedido: v }))} />
        <Field label="Validade" type="date" value={form.validade} onChange={v => setForm(f => ({ ...f, validade: v }))} />
        <Field label="Limite de usos" type="number" value={form.usoMaximo} onChange={v => setForm(f => ({ ...f, usoMaximo: v }))} />
        <label className="flex items-center gap-2.5 text-sm text-ink-muted">
          <input type="checkbox" checked={form.primeiraCompra} onChange={e => setForm(f => ({ ...f, primeiraCompra: e.target.checked }))} />
          Só na primeira compra
        </label>
        <button type="submit" className="rounded-full bg-gold py-2.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">Criar cupom</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
    </label>
  );
}
