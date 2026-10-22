import { dataPrevisaoEntrega, diasPreparo } from '@/lib/utils/prazoEntrega';

interface Props {
  createdAt: string | Date;
  prazoDiasEnvio: number | null;
  status: string;
  /** Itens do pedido: com peça personalizada, o preparo é mais longo. */
  items?: { personalizacao?: unknown }[];
  /** Compacto omite o rótulo "Previsão:" — usado em tabelas com coluna própria. */
  compact?: boolean;
}

/** Data prevista de entrega — criação do pedido + preparo da peça + prazo do frete, em dias úteis. */
export function PrevisaoEntrega({ createdAt, prazoDiasEnvio, status, items, compact = false }: Props) {
  if (status === 'CANCELADO') return <span className="text-ink-tertiary">—</span>;
  if (status === 'ENTREGUE') return <span className="text-success">Entregue</span>;

  const data = dataPrevisaoEntrega(new Date(createdAt), prazoDiasEnvio, diasPreparo(items));
  if (!data) return <span className="text-ink-tertiary">—</span>;

  const formatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <span>
      {!compact && <span className="text-ink-tertiary">Previsão: </span>}
      {formatada}
    </span>
  );
}
