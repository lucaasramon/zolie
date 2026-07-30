import { brl } from '@/lib/utils/money';

export { brl };

export function stars(nota: number): string {
  const cheias = Math.round(nota);
  return '★★★★★☆☆☆☆☆'.slice(5 - cheias, 10 - cheias);
}

export const MATERIAL_LABEL: Record<string, string> = {
  PRATA_925: 'Prata 925',
  BANHADO_OURO: 'Banhado a Ouro 18k',
};

export const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PROCESSANDO: 'Processando',
  SEPARANDO: 'Separando',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const STATUS_STYLE: Record<string, { text: string; border: string; bg: string }> = {
  AGUARDANDO_PAGAMENTO: { text: 'text-gold-text', border: 'border-[#EADFC6]', bg: 'bg-[#FBF7EA]' },
  PROCESSANDO: { text: 'text-ink-muted', border: 'border-border-soft', bg: 'bg-hoverbg' },
  SEPARANDO: { text: 'text-ink-muted', border: 'border-border-soft', bg: 'bg-hoverbg' },
  ENVIADO: { text: 'text-gold-text', border: 'border-[#EADFC6]', bg: 'bg-[#FBF7EA]' },
  ENTREGUE: { text: 'text-success', border: 'border-success-soft', bg: 'bg-success-bg' },
  CANCELADO: { text: 'text-danger', border: 'border-danger-soft', bg: 'bg-danger-bg' },
};
