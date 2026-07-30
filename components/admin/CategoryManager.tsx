'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  _count?: { products: number };
}

export function CategoryManager({ categorias }: { categorias: Categoria[] }) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  async function reordenar(id: string, direcao: -1 | 1) {
    const idx = categorias.findIndex(c => c.id === id);
    const alvo = categorias[idx + direcao];
    if (!alvo) return;
    await Promise.all([
      api.put(`/categories/${id}`, { ordem: alvo.ordem }),
      api.put(`/categories/${alvo.id}`, { ordem: categorias[idx].ordem }),
    ]);
    router.refresh();
  }

  async function remover(id: string, count: number) {
    if (count > 0) {
      alert('Não é possível excluir uma categoria com anúncios vinculados.');
      return;
    }
    await api.delete(`/categories/${id}`);
    router.refresh();
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/categories', { nome });
      setNome('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a categoria');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="overflow-x-auto rounded-xl bg-white shadow-xs lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Anúncios</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.id} className="border-t border-border-subtle">
                <td className="px-4 py-3 font-medium text-ink">{c.nome}</td>
                <td className="px-4 py-3 text-ink-muted">{c.slug}</td>
                <td className="px-4 py-3 text-ink-muted">{c._count?.products ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button type="button" onClick={() => reordenar(c.id, -1)} className="text-ink-muted hover:text-gold-text">↑</button>
                    <button type="button" onClick={() => reordenar(c.id, 1)} className="text-ink-muted hover:text-gold-text">↓</button>
                    <button type="button" onClick={() => remover(c.id, c._count?.products ?? 0)} className="text-danger hover:underline">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={criar} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Nova categoria</h2>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Nome</span>
          <input value={nome} onChange={e => setNome(e.target.value)} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
        </label>
        <button type="submit" className="rounded-full bg-gold py-2.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">
          Criar categoria
        </button>
      </form>
    </div>
  );
}
