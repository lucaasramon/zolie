import { listarTodas } from '@/lib/services/return.service';
import { ReturnRequestCard } from '@/components/admin/ReturnRequestCard';

export const dynamic = 'force-dynamic';

export default async function AdminTrocasPage() {
  const solicitacoes = await listarTodas();
  const pendentes = solicitacoes.filter(s => s.status === 'SOLICITADA').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-sans text-2xl font-semibold text-ink">Trocas e devoluções</h2>
        {pendentes > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">
            {pendentes} aguardando análise
          </span>
        )}
      </div>

      {solicitacoes.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-ink-tertiary shadow-xs">
          Nenhuma solicitação de troca ou devolução até agora.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {solicitacoes.map(s => (
            <ReturnRequestCard
              key={s.id}
              id={s.id}
              numero={s.order.numero}
              cliente={s.user.nome}
              clienteEmail={s.user.email}
              tipo={s.tipo}
              status={s.status}
              motivo={s.motivo}
              descricao={s.descricao}
              respostaAdmin={s.respostaAdmin}
              itens={s.items.map(i => ({
                nomeProduto: i.orderItem.nomeProduto,
                tamanho: i.orderItem.tamanho,
                acabamento: i.orderItem.acabamento,
                quantidade: i.quantidade,
              }))}
              createdAt={s.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
