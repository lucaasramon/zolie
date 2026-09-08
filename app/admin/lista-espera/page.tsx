import Link from 'next/link';
import Image from 'next/image';
import { listPendentesAgrupado } from '@/lib/services/stockNotification.service';

export const dynamic = 'force-dynamic';

export default async function ListaEsperaPage() {
  const grupos = await listPendentesAgrupado();
  const totalPedidos = grupos.reduce((acc, g) => acc + g.pedidos.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Lista de espera de estoque</h1>
        <p className="text-sm text-ink-tertiary">Clientes esperando o aviso de "chegou" de peças esgotadas.</p>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-soft bg-white/60 py-14 text-center text-sm text-ink-tertiary">
          Ninguém está esperando aviso de nenhuma peça no momento.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map(({ product, pedidos }) => (
            <div key={product.id} className="overflow-hidden rounded-xl bg-white shadow-xs">
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
                <div className="flex items-center gap-3">
                  {product.imagens?.[0] && (
                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded-lg bg-bg-alt">
                      <Image src={product.imagens[0]} alt={product.nome} fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <div>
                    <Link href={`/admin/produtos/${product.id}`} className="font-medium text-ink hover:text-gold-text">
                      {product.nome}
                    </Link>
                    <div className="text-xs text-ink-tertiary">Estoque atual: {product.estoque}</div>
                  </div>
                </div>
                <span className="rounded-full bg-hoverbg px-3 py-1 text-xs font-medium text-ink-muted">
                  {pedidos.length} pessoa{pedidos.length === 1 ? '' : 's'} esperando
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
                  <tr>
                    <th className="px-4 py-2">E-mail</th>
                    <th className="px-4 py-2">Pediu aviso em</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id} className="border-t border-border-subtle">
                      <td className="px-4 py-2 text-ink-muted">{p.email}</td>
                      <td className="px-4 py-2 text-ink-tertiary">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <span className="text-xs text-ink-tertiary">
        {totalPedidos} pedido{totalPedidos === 1 ? '' : 's'} de aviso em {grupos.length} peça{grupos.length === 1 ? '' : 's'}
      </span>
    </div>
  );
}
