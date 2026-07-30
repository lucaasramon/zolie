'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tag: string | null;
  cta: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
}

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ tag: '', titulo: '', subtitulo: '', cta: '', link: '' });
  const [erro, setErro] = useState('');

  async function reordenar(id: string, direcao: -1 | 1) {
    const idx = banners.findIndex(b => b.id === id);
    const alvo = banners[idx + direcao];
    if (!alvo) return;
    await Promise.all([
      api.put(`/admin/banners/${id}`, { ordem: alvo.ordem }),
      api.put(`/admin/banners/${alvo.id}`, { ordem: banners[idx].ordem }),
    ]);
    router.refresh();
  }

  async function toggleAtivo(b: Banner) {
    await api.put(`/admin/banners/${b.id}`, { ativo: !b.ativo });
    router.refresh();
  }

  async function remover(id: string) {
    await api.delete(`/admin/banners/${id}`);
    router.refresh();
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/admin/banners', form);
      setForm({ tag: '', titulo: '', subtitulo: '', cta: '', link: '' });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o banner');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {banners.map((b, i) => (
          <div key={b.id} className="flex gap-4 rounded-xl bg-white p-4 shadow-xs">
            <div className="img-placeholder aspect-video w-40 flex-none rounded-lg" />
            <div className="flex-1">
              <span className="text-xs uppercase tracking-wider text-gold-text">{b.tag}</span>
              <div className="font-sans text-lg font-semibold text-ink">{b.titulo}</div>
              <p className="text-sm text-ink-tertiary">{b.subtitulo}</p>
              <p className="text-xs text-ink-tertiary">botão &ldquo;{b.cta}&rdquo; → {b.link}</p>
            </div>
            <div className="flex flex-col items-end justify-between gap-2">
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => reordenar(b.id, -1)} className="text-ink-muted hover:text-gold-text">↑</button>
                <button type="button" onClick={() => reordenar(b.id, 1)} className="text-ink-muted hover:text-gold-text">↓</button>
              </div>
              <button
                type="button"
                onClick={() => toggleAtivo(b)}
                className={`rounded-full px-3 py-1 text-xs ${b.ativo ? 'bg-success-bg text-success' : 'bg-hoverbg text-ink-tertiary'}`}
              >
                {b.ativo ? 'No ar' : 'Pausado'}
              </button>
              <button type="button" onClick={() => remover(b.id)} className="text-xs text-danger hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={criar} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Novo banner da home</h2>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <Field label="Etiqueta" value={form.tag} onChange={v => setForm(f => ({ ...f, tag: v }))} />
        <Field label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Subtítulo</span>
          <textarea value={form.subtitulo} onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))} rows={2} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
        </label>
        <Field label="Texto do botão" value={form.cta} onChange={v => setForm(f => ({ ...f, cta: v }))} />
        <Field label="Link" value={form.link} onChange={v => setForm(f => ({ ...f, link: v }))} />
        <div className="img-placeholder flex aspect-video items-center justify-center rounded-lg text-xs text-ink-tertiary">1920×720px</div>
        <button type="submit" className="rounded-full bg-gold py-2.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">Publicar banner</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
    </label>
  );
}
