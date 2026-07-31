'use client';

import { useState } from 'react';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export function ReviewForm({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState(5);
  const [titulo, setTitulo] = useState('');
  const [comentario, setComentario] = useState('');
  const [imagens, setImagens] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  if (!user) return null;
  if (enviado) {
    return <p className="text-sm text-success">Obrigada pela sua avaliação! Ela será publicada após moderação.</p>;
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || imagens.length >= 4) return;
    setUploading(true);
    try {
      const { data } = await api.upload<{ url: string }>('/reviews/uploads', file);
      setImagens(prev => [...prev, data.url]);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar a foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post(`/products/${productId}/reviews`, { nota, titulo: titulo || undefined, comentario: comentario || undefined, imagens });
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar sua avaliação');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-border-soft px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text hover:text-gold-text"
      >
        Avaliar esta peça
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg shadow-xs p-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => setNota(n)} aria-label={`${n} estrelas`} className="text-xl leading-none">
            <span className={n <= nota ? 'text-gold-text' : 'text-border-soft'}>★</span>
          </button>
        ))}
      </div>
      <input
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        placeholder="Título (opcional)"
        maxLength={80}
        className="rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
      />
      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Conte como foi sua experiência com esta peça (opcional)"
        maxLength={1000}
        rows={3}
        className="rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
      />
      <div className="flex flex-wrap items-center gap-2">
        {imagens.map(url => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md">
            <Image src={url} alt="" fill sizes="64px" className="object-cover" />
          </div>
        ))}
        {imagens.length < 4 && (
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border-soft text-[11px] text-ink-tertiary hover:border-gold-text">
            {uploading ? '...' : '+ Foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      {erro && <span className="text-xs text-danger">{erro}</span>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-xs uppercase text-ink-tertiary hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
