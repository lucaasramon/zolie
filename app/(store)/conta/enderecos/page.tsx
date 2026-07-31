'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/ui/Skeleton';

interface Address {
  id: string;
  apelido: string | null;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

const EMPTY_FORM = { apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', principal: false };

export default function MeusEnderecosPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { showToast } = useToast();

  async function load() {
    const { data } = await api.get<Address[]>('/addresses');
    setAddresses(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/addresses', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
      showToast('Endereço adicionado');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível salvar o endereço');
    }
  }

  async function remove(id: string) {
    await api.delete(`/addresses/${id}`);
    await load();
  }

  if (!addresses) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.map(a => (
        <div key={a.id} className="flex items-start justify-between gap-4 rounded-lg shadow-xs p-4">
          <div className="text-sm">
            <span className="font-medium text-ink">{a.apelido || 'Endereço'}{a.principal ? ' · Principal' : ''}</span>
            <div className="text-ink-muted">
              {a.rua}, {a.numero} {a.complemento ? `- ${a.complemento}` : ''} · {a.bairro} · {a.cidade}/{a.estado} · {a.cep}
            </div>
          </div>
          <button type="button" onClick={() => remove(a.id)} className="text-xs text-danger hover:underline">Remover</button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl shadow-xs p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Apelido" value={form.apelido} onChange={v => setForm(f => ({ ...f, apelido: v }))} />
            <Field label="CEP" value={form.cep} onChange={v => setForm(f => ({ ...f, cep: v }))} required />
            <Field label="Rua" value={form.rua} onChange={v => setForm(f => ({ ...f, rua: v }))} required className="col-span-2" />
            <Field label="Número" value={form.numero} onChange={v => setForm(f => ({ ...f, numero: v }))} required />
            <Field label="Complemento" value={form.complemento} onChange={v => setForm(f => ({ ...f, complemento: v }))} />
            <Field label="Bairro" value={form.bairro} onChange={v => setForm(f => ({ ...f, bairro: v }))} required />
            <Field label="Cidade" value={form.cidade} onChange={v => setForm(f => ({ ...f, cidade: v }))} required />
            <Field label="Estado (UF)" value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v.toUpperCase() }))} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border-soft px-5 py-2.5 text-xs uppercase text-ink-muted">Cancelar</button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start rounded-full border border-gold-soft px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-gold-text hover:bg-gold hover:text-ink"
        >
          + Adicionar endereço
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="text-ink-muted">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} required={required} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
    </label>
  );
}
