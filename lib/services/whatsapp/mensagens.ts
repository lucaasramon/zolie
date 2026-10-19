import { brl } from '@/lib/utils/money';
import { lerPersonalizacao, Personalizacao, resumoPersonalizacao } from '@/lib/personalizacao';

/**
 * Textos dos avisos internos enviados aos grupos de WhatsApp da loja. Funções
 * puras (sem I/O) para poderem ser testadas; o envio fica em `./index.ts`.
 * Formatação no padrão do WhatsApp: *negrito*, _itálico_.
 */

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  CARTAO_CREDITO: 'Cartão de crédito',
  PIX: 'Pix',
  BOLETO: 'Boleto',
};

const num = (v: unknown) => Number(v ?? 0);

export interface PedidoParaAviso {
  id: string;
  numero: string;
  formaPagamento: string;
  parcelas: number;
  subtotal: unknown;
  frete: unknown;
  desconto: unknown;
  total: unknown;
  cupomCodigo: string | null;
  transportadora: string | null;
  prazoDiasEnvio: number | null;
  user: { nome: string; email: string; telefone: string | null; cpf: string | null } | null;
  endereco: { rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; estado: string; cep: string } | null;
  guestNome: string | null;
  guestEmail: string | null;
  guestTelefone: string | null;
  guestCpf: string | null;
  guestRua: string | null;
  guestNumero: string | null;
  guestComplemento: string | null;
  guestBairro: string | null;
  guestCidade: string | null;
  guestEstado: string | null;
  guestCep: string | null;
  items: {
    nomeProduto: string;
    quantidade: number;
    tamanho: string | null;
    precoUnitario: unknown;
    subtotal: unknown;
    personalizacao: unknown;
  }[];
}

export function cliente(o: PedidoParaAviso) {
  return {
    nome: o.user?.nome ?? o.guestNome ?? '—',
    email: o.user?.email ?? o.guestEmail ?? '—',
    telefone: o.user?.telefone ?? o.guestTelefone ?? null,
    cpf: o.user?.cpf ?? o.guestCpf ?? null,
    convidado: !o.user,
  };
}

function endereco(o: PedidoParaAviso): { linha: string; cidade: string } | null {
  const e = o.endereco
    ? o.endereco
    : o.guestRua
      ? {
          rua: o.guestRua,
          numero: o.guestNumero ?? '',
          complemento: o.guestComplemento,
          bairro: o.guestBairro ?? '',
          cidade: o.guestCidade ?? '',
          estado: o.guestEstado ?? '',
          cep: o.guestCep ?? '',
        }
      : null;
  if (!e) return null;
  return {
    linha: `${e.rua}, ${e.numero}${e.complemento ? ` — ${e.complemento}` : ''} · ${e.bairro} · ${e.cidade}/${e.estado} · CEP ${e.cep}`,
    cidade: `${e.cidade}/${e.estado}`,
  };
}

/** Link clicável no WhatsApp para falar com a cliente. */
export function linkWhatsapp(telefone: string | null): string | null {
  const d = (telefone || '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith('55') ? d : `55${d}`}`;
}

export function pagamentoLabel(formaPagamento: string, parcelas: number): string {
  const label = FORMA_PAGAMENTO_LABEL[formaPagamento] ?? formaPagamento;
  return formaPagamento === 'CARTAO_CREDITO' && parcelas > 1 ? `${label} em ${parcelas}x` : label;
}

function linhasPersonalizacao(p: Personalizacao): string[] {
  const linhas = resumoPersonalizacao(p).map(l => `     • ${l.rotulo}: ${l.valor}`);
  return ['   ✨ _Personalizado_', ...linhas];
}

/** Imagens da personalização de todas as peças, com a legenda de cada uma. */
export function imagensPersonalizacao(o: PedidoParaAviso): { url: string; legenda: string }[] {
  const out: { url: string; legenda: string }[] = [];
  for (const item of o.items) {
    const p = lerPersonalizacao(item.personalizacao);
    if (!p) continue;
    p.imagens.forEach((url, i) => {
      out.push({
        url,
        legenda: `📎 Pedido *${o.numero}* — ${item.nomeProduto}${p.modelo ? ` (${p.modelo})` : ''} — imagem ${i + 1}/${p.imagens.length}`,
      });
    });
  }
  return out;
}

export function mensagemVendaConfirmada(o: PedidoParaAviso, appUrl: string): string {
  const c = cliente(o);
  const end = endereco(o);
  const temPersonalizado = o.items.some(i => lerPersonalizacao(i.personalizacao));
  const zap = linkWhatsapp(c.telefone);

  const itens = o.items.flatMap(i => {
    const linhas = [`▪️ ${i.quantidade}x *${i.nomeProduto}*${i.tamanho ? ` (${i.tamanho})` : ''} — ${brl(num(i.subtotal))}`];
    const p = lerPersonalizacao(i.personalizacao);
    if (p) linhas.push(...linhasPersonalizacao(p));
    return linhas;
  });

  const desconto = num(o.desconto);
  const frete = num(o.frete);

  return [
    `🛍️ *NOVA VENDA CONFIRMADA* — Pedido *${o.numero}*${temPersonalizado ? '\n✨ _Contém peça personalizada_' : ''}`,
    '',
    `👤 *Cliente:* ${c.nome}${c.convidado ? ' _(sem conta)_' : ''}`,
    c.telefone ? `📱 ${c.telefone}${zap ? ` · ${zap}` : ''}` : null,
    `✉️ ${c.email}`,
    c.cpf ? `🪪 CPF ${c.cpf}` : null,
    end ? `📍 *${end.cidade}*\n${end.linha}` : null,
    '',
    '*Itens*',
    ...itens,
    '',
    `Subtotal: ${brl(num(o.subtotal))}`,
    `Frete: ${frete === 0 ? 'Grátis' : brl(frete)}${o.transportadora ? ` · ${o.transportadora}` : ''}${o.prazoDiasEnvio ? ` (até ${o.prazoDiasEnvio} dias úteis)` : ''}`,
    desconto > 0 ? `Desconto: - ${brl(desconto)}${o.cupomCodigo ? ` (cupom ${o.cupomCodigo})` : ''}` : null,
    `💰 *Total: ${brl(num(o.total))}* — ${pagamentoLabel(o.formaPagamento, o.parcelas)}`,
    '',
    `🔗 ${appUrl}/admin/pedidos/${o.id}`,
  ]
    .filter(l => l !== null)
    .join('\n');
}

export type NivelAlerta = 'erro' | 'aviso';

/** Alerta genérico: título + pares chave/valor (valores vazios são omitidos). */
export function mensagemAlerta(nivel: NivelAlerta, titulo: string, detalhes: Record<string, unknown> = {}): string {
  const linhas = Object.entries(detalhes)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `• *${k}:* ${typeof v === 'string' ? v : JSON.stringify(v)}`.slice(0, 600));
  const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return [`${nivel === 'erro' ? '🚨' : '⚠️'} *${titulo}*`, ...linhas, `_${hora}_`].join('\n');
}
