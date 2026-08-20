import { dataPrevisaoEntrega } from '@/lib/utils/prazoEntrega';

interface Props {
  createdAt: string | Date;
  prazoDiasEnvio: number | null;
  status: string;
  /** Compacto omite o rótulo "Previsão:" — usado em tabelas com coluna própria. */
  compact?: boolean;
}

/** Data prevista de entrega — calculada a partir da criação do pedido + prazo em dias úteis. */
export function PrevisaoEntrega({ createdAt, prazoDiasEnvio, status, compact = false }: Props) {
  if (status === 'CANCELADO') return <span className="text-ink-tertiary">—</span>;
  if (status === 'ENTREGUE') return <span className="text-success">Entregue</span>;

  const data = dataPrevisaoEntrega(new Date(createdAt), prazoDiasEnvio);
  if (!data) return <span className="text-ink-tertiary">—</span>;

  const formatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <span>
      {!compact && <span className="text-ink-tertiary">Previsão: </span>}
      {formatada}
    </span>
  );
}
