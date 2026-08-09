'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tag: string | null;
  cta: string | null;
  link: string | null;
  imagem: string | null;
  ordem: number;
  ativo: boolean;
}

const EMPTY_FORM = { tag: '', titulo: '', subtitulo: '', cta: '', link: '', imagem: '' };

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [erro, setErro] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErro('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo de 5MB.');
      return;
    }

    setUploading(true);
    setErro('');
    try {
      const { data } = await api.upload<{ url: string }>('/admin/uploads', file);
      setForm(f => ({ ...f, imagem: data.url }));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a imagem');
    } finally {
      setUploading(false);
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.imagem) {
      setErro('Envie a imagem do banner.');
      return;
    }
    try {
      await api.post('/admin/banners', form);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o banner');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {banners.map(b => (
          <div key={b.id} className="flex gap-4 rounded-xl bg-white p-4 shadow-xs">
            {b.imagem ? (
              <div className="relative aspect-video w-40 flex-none overflow-hidden rounded-lg">
                <Image src={b.imagem} alt={b.titulo} fill sizes="160px" className="object-cover" />
              </div>
            ) : (
              <div className="img-placeholder aspect-video w-40 flex-none rounded-lg" />
            )}
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

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
        {form.imagem ? (
          <div className="group relative aspect-video overflow-hidden rounded-lg">
            <Image src={form.imagem} alt="Pré-visualização do banner" fill sizes="400px" className="object-cover" />
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, imagem: '' }))}
              className="absolute right-1 top-1 rounded-full bg-ink/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="img-placeholder flex aspect-video items-center justify-center rounded-lg text-xs text-ink-tertiary transition-colors hover:border-gold disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : '1920×720px'}
          </button>
        )}

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
