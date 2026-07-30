'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';

interface Categoria {
  id: string;
  nome: string;
}

interface InitialData {
  id?: string;
  nome: string;
  descricao: string;
  cuidados?: string | null;
  preco: number | string;
  precoPromocional?: number | string | null;
  material: 'PRATA_925' | 'BANHADO_OURO';
  categoriaId: string;
  estoque: number;
  pesoGramas?: number | string | null;
  pedra?: string | null;
  tamanhos?: string[];
  imagens?: string[];
  destaque?: boolean;
  lancamento?: boolean;
  ativo?: boolean;
}

const EMPTY: InitialData = {
  nome: '',
  descricao: '',
  cuidados: '',
  preco: '',
  precoPromocional: '',
  material: 'PRATA_925',
  categoriaId: '',
  estoque: 0,
  pesoGramas: '',
  pedra: '',
  tamanhos: [],
  imagens: [],
  destaque: false,
  lancamento: false,
  ativo: true,
};

export function ProductForm({ categorias, initialData }: { categorias: Categoria[]; initialData?: InitialData }) {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState<InitialData>(initialData || EMPTY);
  const [tamanhosInput, setTamanhosInput] = useState((initialData?.tamanhos || []).join(', '));
  const [imagens, setImagens] = useState<string[]>(initialData?.imagens || []);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  function pickFile(index: number) {
    setPendingSlot(index);
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || pendingSlot === null) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErro('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo de 5MB.');
      return;
    }

    const index = pendingSlot;
    setUploadingIndex(index);
    setErro('');
    try {
      const { data } = await api.upload<{ url: string }>('/admin/uploads', file);
      setImagens(prev => {
        const next = [...prev];
        next[index] = data.url;
        return next;
      });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a imagem');
    } finally {
      setUploadingIndex(null);
      setPendingSlot(null);
    }
  }

  function removeImagem(index: number) {
    setImagens(prev => prev.filter((_, i) => i !== index));
  }

  const preco = Number(form.preco) || 0;
  const precoPromocional = form.precoPromocional ? Number(form.precoPromocional) : null;
  const precoEfetivo = precoPromocional || preco;
  const precoPix = precoEfetivo * 0.9;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.nome || !form.categoriaId || !preco) {
      setErro('Nome, categoria e preço são obrigatórios.');
      return;
    }
    if (!form.descricao || form.descricao.length < 10) {
      setErro('Descrição precisa ter ao menos 10 caracteres.');
      return;
    }
    if (precoPromocional && precoPromocional >= preco) {
      setErro('O preço promocional deve ser menor que o preço cheio.');
      return;
    }

    setLoading(true);
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      cuidados: form.cuidados || undefined,
      preco,
      precoPromocional: precoPromocional || null,
      material: form.material,
      categoriaId: form.categoriaId,
      estoque: Number(form.estoque) || 0,
      pesoGramas: form.pesoGramas ? Number(form.pesoGramas) : undefined,
      pedra: form.pedra || null,
      tamanhos: tamanhosInput.split(',').map(t => t.trim()).filter(Boolean),
      imagens,
      destaque: form.destaque,
      lancamento: form.lancamento,
      ativo: form.ativo,
    };

    try {
      if (isEdit) {
        await api.put(`/products/${initialData!.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      router.push('/admin/produtos');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar o anúncio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {erro && <p className="text-sm text-danger">{erro}</p>}

        <Section title="Informações do anúncio">
          <Field label="Nome*" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-muted">Categoria*</span>
              <select value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
                <option value="">Selecione</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-muted">Material*</span>
              <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value as any }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
                <option value="PRATA_925">Prata 925</option>
                <option value="BANHADO_OURO">Banhado a Ouro 18k</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Pedra</span>
            <select value={form.pedra || ''} onChange={e => setForm(f => ({ ...f, pedra: e.target.value }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
              <option value="">Sem pedra</option>
              <option value="zirconia">Zircônia</option>
              <option value="cristal">Cristal</option>
              <option value="perola">Pérola</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Descrição*</span>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={4} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Cuidados com a peça</span>
            <textarea value={form.cuidados || ''} onChange={e => setForm(f => ({ ...f, cuidados: e.target.value }))} rows={2} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
          </label>
        </Section>

        <Section title="Fotos">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => {
              const url = imagens[i];
              const isUploading = uploadingIndex === i;
              return (
                <div key={i} className="relative">
                  {url ? (
                    <div className="group relative aspect-square overflow-hidden rounded-lg">
                      <Image src={url} alt={i === 0 ? 'Capa' : `Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImagem(i)}
                        className="absolute right-1 top-1 rounded-full bg-ink/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pickFile(i)}
                      disabled={isUploading}
                      className="img-placeholder flex aspect-square w-full items-center justify-center rounded-lg text-xs text-ink-tertiary transition-colors hover:border-gold disabled:opacity-50"
                    >
                      {isUploading ? 'Enviando...' : i === 0 ? 'Capa' : `Foto ${i + 1}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-tertiary">A primeira é a foto de capa · 1000×1000px</p>
        </Section>

        <Section title="Preço e estoque">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço cheio*" type="number" value={String(form.preco)} onChange={v => setForm(f => ({ ...f, preco: v }))} />
            <Field label="Preço promocional" type="number" value={String(form.precoPromocional || '')} onChange={v => setForm(f => ({ ...f, precoPromocional: v }))} />
            <Field label="Estoque*" type="number" value={String(form.estoque)} onChange={v => setForm(f => ({ ...f, estoque: Number(v) }))} />
            <Field label="Peso (g)" type="number" value={String(form.pesoGramas || '')} onChange={v => setForm(f => ({ ...f, pesoGramas: v }))} />
          </div>
          <Field label="Tamanhos disponíveis (separados por vírgula)" value={tamanhosInput} onChange={setTamanhosInput} />
          {tamanhosInput && (
            <div className="flex flex-wrap gap-2">
              {tamanhosInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="rounded-full bg-bg-alt px-2.5 py-1 text-xs text-ink-muted">{t}</span>
              ))}
            </div>
          )}
          {preco > 0 && (
            <div className="rounded-lg bg-hoverbg p-3 text-sm">
              <div className="text-ink">{brl(precoEfetivo)}</div>
              <div className="text-xs text-gold-text">{brl(precoPix)} no Pix</div>
            </div>
          )}
        </Section>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Publicação">
          <Checkbox label="Publicar na vitrine" checked={form.ativo ?? true} onChange={v => setForm(f => ({ ...f, ativo: v }))} />
          <Checkbox label='Mostrar em "As mais amadas"' checked={form.destaque ?? false} onChange={v => setForm(f => ({ ...f, destaque: v }))} />
          <Checkbox label="Marcar como lançamento" checked={form.lancamento ?? false} onChange={v => setForm(f => ({ ...f, lancamento: v }))} />
          <button type="submit" disabled={loading} className="mt-2 rounded-full bg-gold py-3 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
            {isEdit ? 'Salvar alterações' : 'Publicar anúncio'}
          </button>
        </Section>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
      <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
      {children}
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

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-ink-muted">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
