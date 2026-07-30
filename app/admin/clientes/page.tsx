import { userRepo } from '@/lib/repositories/user.repo';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
  const { items } = await userRepo.listAll({ take: 100 });
  const clientes = items.filter(u => u.role === 'CUSTOMER');

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Desde</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => {
            const iniciais = c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            return (
              <tr key={c.id} className="border-t border-border-subtle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#EADFC6] text-xs font-medium text-gold-text-hover">
                      {iniciais}
                    </div>
                    <span className="font-medium text-ink">{c.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  <div>{c.email}</div>
                  {c.telefone && <div className="text-xs text-ink-tertiary">{c.telefone}</div>}
                </td>
                <td className="px-4 py-3 text-ink-muted">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {clientes.length === 0 && (
        <div className="border-t border-dashed border-border-soft py-10 text-center text-sm text-ink-tertiary">Nenhum cliente cadastrado ainda.</div>
      )}
    </div>
  );
}
