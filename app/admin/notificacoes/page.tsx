import { listarAdmin } from '@/lib/services/notification.service';
import { NotificationForm } from '@/components/admin/NotificationForm';

export const dynamic = 'force-dynamic';

export default async function AdminNotificacoesPage() {
  const notificacoes = await listarAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-sans text-2xl font-semibold text-ink">Notificações</h2>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <NotificationForm />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink">Últimas enviadas</h3>
          {notificacoes.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-sm text-ink-tertiary shadow-xs">Nenhuma notificação manual enviada ainda.</p>
          ) : (
            notificacoes.map(n => (
              <div key={n.id} className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{n.titulo}</span>
                  <span className="ml-auto text-xs text-ink-tertiary">{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-ink-muted">{n.mensagem}</p>
                <span className="text-xs text-ink-tertiary">Para: {n.user.nome} ({n.user.email})</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
