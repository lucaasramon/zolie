import { listar } from '@/lib/services/contact.service';
import { ContactMessageCard } from '@/components/admin/ContactMessageCard';

export const dynamic = 'force-dynamic';

export default async function AdminMensagensPage() {
  const mensagens = await listar();
  const pendentes = mensagens.filter(m => !m.respondida).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-sans text-2xl font-semibold text-ink">Mensagens</h2>
        {pendentes > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">
            {pendentes} pendente{pendentes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {mensagens.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-ink-tertiary shadow-xs">
          Nenhuma mensagem recebida ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mensagens.map(m => (
            <ContactMessageCard
              key={m.id}
              id={m.id}
              nome={m.nome}
              email={m.email}
              assunto={m.assunto}
              mensagem={m.mensagem}
              pedido={m.pedido}
              respondida={m.respondida}
              resposta={m.resposta}
              respondidaEm={m.respondidaEm ? m.respondidaEm.toISOString() : null}
              createdAt={m.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
