import { Resend } from 'resend';
import { env } from '@/lib/env';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL } from '@/lib/utils/format';
import { logger } from '@/lib/logger';

const resend = env.resend.apiKey ? new Resend(env.resend.apiKey) : null;

const COLORS = {
  bg: '#FBFAF5',
  card: '#FFFFFF',
  ink: '#2E2A24',
  inkMuted: '#6B6259',
  inkTertiary: '#8F857C',
  gold: '#D4AF37',
  goldText: '#8A6B12',
  border: '#EAE4D8',
  borderSubtle: '#F2EEE7',
  hoverbg: '#F7F4EC',
  success: '#4F5E35',
  successBg: '#F5F7EE',
};

/**
 * Escapa conteúdo enviado por usuário antes de interpolar no HTML do e-mail.
 * Sem isso, o texto de um formulário poderia injetar markup no corpo da mensagem.
 */
function escapar(texto: string): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function send(to: string, subject: string, html: string, replyTo?: string) {
  if (!resend) {
    logger.warn('RESEND_API_KEY não configurada — e-mail não enviado', { subject, to });
    return;
  }
  try {
    await resend.emails.send({ from: env.resend.from, to, subject, html, ...(replyTo && { replyTo }) });
  } catch (err) {
    logger.error(`Falha ao enviar e-mail "${subject}"`, err, { to });
  }
}

function button(label: string, href: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 999px; background-color: ${COLORS.gold};">
          <a href="${href}" style="display: inline-block; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: ${COLORS.ink}; text-decoration: none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function badge(text: string, tone: 'gold' | 'success' = 'gold') {
  const colors = tone === 'success' ? { bg: COLORS.successBg, text: COLORS.success, border: '#D8DEC4' } : { bg: COLORS.hoverbg, text: COLORS.goldText, border: COLORS.border };
  return `<span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: ${colors.bg}; border: 1px solid ${colors.border}; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; color: ${colors.text};">${text}</span>`;
}

function layout(preheader: string, bodyHtml: string) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zoliê Semijoias</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.bg}; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <img src="${env.appUrl}/images/zolie-logo.png" alt="Zoliê Semijoias" height="36" style="height: 36px; width: auto;" />
              </td>
            </tr>
            <tr>
              <td style="background-color: ${COLORS.card}; border: 1px solid ${COLORS.borderSubtle}; border-radius: 20px; padding: 40px 36px; box-shadow: 0 1px 2px rgba(46,42,36,0.05);">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 28px;">
                <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.inkTertiary};">Zoliê Semijoias · Prata 925 e Banhado a Ouro 18k</p>
                <p style="margin: 4px 0 0; font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.inkTertiary};">Este é um e-mail automático, não é necessário responder.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function heading(text: string) {
  return `<h1 style="margin: 0 0 4px; font-family: Arial, sans-serif; font-size: 22px; font-weight: 600; color: ${COLORS.ink};">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${COLORS.inkMuted};">${text}</p>`;
}

function divider() {
  return `<hr style="border: none; border-top: 1px solid ${COLORS.borderSubtle}; margin: 24px 0;" />`;
}

export async function enviarRecuperacaoSenha(to: string, nome: string, token: string) {
  const link = `${env.appUrl}/redefinir-senha?token=${token}`;
  const html = layout(
    'Redefina sua senha na Zoliê',
    `
      ${heading('Redefinir sua senha')}
      ${paragraph(`Olá, ${nome}!`)}
      ${paragraph('Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.')}
      ${button('Redefinir minha senha', link)}
      ${paragraph('Se você não pediu isso, pode ignorar este e-mail com segurança — sua senha atual continua válida.')}
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.inkTertiary};">Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${link}" style="color: ${COLORS.goldText};">${link}</a></p>
    `,
  );
  await send(to, 'Redefinição de senha — Zoliê', html);
}

interface OrderItemInfo {
  nomeProduto: string;
  quantidade: number;
  subtotal: unknown;
}

export async function enviarConfirmacaoPedido(to: string, nome: string, numero: string, items: OrderItemInfo[], total: unknown) {
  const itensHtml = items
    .map(
      i => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.borderSubtle}; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.ink};">
            ${i.quantidade}x ${i.nomeProduto}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.borderSubtle}; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.ink}; text-align: right;">
            ${brl(i.subtotal as number)}
          </td>
        </tr>`,
    )
    .join('');

  const html = layout(
    `Recebemos seu pedido ${numero}`,
    `
      ${badge('Pedido confirmado')}
      ${heading(`Obrigada pela compra, ${nome.split(' ')[0]}!`)}
      ${paragraph(`Recebemos seu pedido <strong style="color:${COLORS.ink};">${numero}</strong> e já estamos preparando tudo com carinho.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        ${itensHtml}
        <tr>
          <td style="padding-top: 14px; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: ${COLORS.ink};">Total</td>
          <td style="padding-top: 14px; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: ${COLORS.ink}; text-align: right;">${brl(total as number)}</td>
        </tr>
      </table>
      ${divider()}
      ${paragraph('Você pode acompanhar cada etapa do seu pedido — do pagamento à entrega — a qualquer momento em "Meus pedidos".')}
      ${button('Acompanhar meu pedido', `${env.appUrl}/conta/pedidos`)}
    `,
  );
  await send(to, `Pedido ${numero} confirmado — Zoliê`, html);
}

interface RastreioInfo {
  codigoRastreio?: string | null;
  transportadora?: string | null;
}

function blocoRastreio({ codigoRastreio, transportadora }: RastreioInfo) {
  if (!codigoRastreio) return '';
  return `
    <div style="margin: 20px 0; padding: 18px; border: 1px solid ${COLORS.border}; border-radius: 12px; background-color: ${COLORS.hoverbg};">
      <p style="margin: 0 0 6px; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; color: ${COLORS.goldText};">Código de rastreio</p>
      <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: bold; letter-spacing: 0.04em; color: ${COLORS.ink};">${codigoRastreio}</p>
      ${transportadora ? `<p style="margin: 6px 0 0; font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.inkMuted};">Transportadora: ${transportadora}</p>` : ''}
    </div>
  `;
}

export async function enviarMudancaStatus(
  to: string,
  nome: string,
  numero: string,
  status: string,
  descricao?: string | null,
  rastreio?: RastreioInfo,
) {
  const enviado = status === 'ENVIADO';
  const html = layout(
    `Pedido ${numero}: ${STATUS_LABEL[status] || status}`,
    `
      ${badge('Atualização do pedido')}
      ${heading(enviado ? `Seu pedido ${numero} saiu para entrega!` : `Seu pedido ${numero} teve uma atualização`)}
      ${paragraph(`Olá, ${nome.split(' ')[0]}! O status do seu pedido mudou para:`)}
      <p style="margin: 0 0 16px;">${badge(STATUS_LABEL[status] || status, status === 'ENTREGUE' ? 'success' : 'gold')}</p>
      ${descricao ? paragraph(descricao) : ''}
      ${enviado ? blocoRastreio(rastreio || {}) : ''}
      ${button('Ver detalhes do pedido', `${env.appUrl}/conta/pedidos`)}
    `,
  );
  await send(to, `Pedido ${numero}: ${STATUS_LABEL[status] || status} — Zoliê`, html);
}

export async function enviarVerificacaoEmail(to: string, nome: string, token: string) {
  const link = `${env.appUrl}/verificar-email?token=${token}`;
  const html = layout(
    'Confirme seu e-mail na Zoliê',
    `
      ${heading('Confirme seu e-mail')}
      ${paragraph(`Olá, ${nome}!`)}
      ${paragraph('Para ativar sua conta na Zoliê, confirme seu endereço de e-mail clicando no botão abaixo.')}
      ${button('Confirmar meu e-mail', link)}
      ${paragraph('Se você não criou uma conta na Zoliê, pode ignorar este e-mail com segurança.')}
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.inkTertiary};">Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${link}" style="color: ${COLORS.goldText};">${link}</a></p>
    `,
  );
  await send(to, 'Confirme seu e-mail — Zoliê', html);
}

/** Confirmação de e-mail de quem está comprando como convidado, sem conta na Zoliê. */
export async function enviarConfirmacaoEmailConvidado(to: string, token: string) {
  const link = `${env.appUrl}/verificar-email-convidado?token=${token}`;
  const html = layout(
    'Confirme seu e-mail para continuar a compra',
    `
      ${heading('Confirme seu e-mail')}
      ${paragraph('Para continuar sua compra como convidado na Zoliê, confirme que este e-mail é seu clicando no botão abaixo. Depois, é só voltar para a aba onde estava comprando.')}
      ${button('Confirmar meu e-mail', link)}
      ${paragraph('Se você não pediu isso, pode ignorar este e-mail com segurança.')}
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.inkTertiary};">Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${link}" style="color: ${COLORS.goldText};">${link}</a></p>
    `,
  );
  await send(to, 'Confirme seu e-mail para continuar sua compra — Zoliê', html);
}

export async function enviarCarrinhoAbandonado(to: string, nome: string, itens: { nomeProduto: string }[]) {
  const listaHtml = itens
    .slice(0, 5)
    .map(i => `<p style="margin: 0 0 6px; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.ink};">• ${i.nomeProduto}</p>`)
    .join('');

  const html = layout(
    'Você esqueceu itens na sua sacola',
    `
      ${badge('Sua sacola te espera')}
      ${heading(`Ainda dá tempo, ${nome.split(' ')[0]}!`)}
      ${paragraph('Notamos que você deixou peças na sua sacola. Elas continuam disponíveis, mas o estoque é limitado.')}
      <div style="margin: 16px 0;">${listaHtml}</div>
      ${button('Finalizar minha compra', `${env.appUrl}/carrinho`)}
    `,
  );
  await send(to, 'Você esqueceu itens na sua sacola — Zoliê', html);
}

interface MensagemContato {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  pedido?: string | null;
}

/** Encaminha o formulário de contato para a caixa de atendimento da loja. */
export async function enviarMensagemContato({ nome, email: remetente, assunto, mensagem, pedido }: MensagemContato) {
  const destino = env.loja.emailContato;
  if (!destino) {
    logger.warn('LOJA_EMAIL_CONTATO não configurada — mensagem de contato salva mas não encaminhada', { assunto });
    return;
  }

  const html = layout(
    `Contato: ${assunto}`,
    `
      ${badge('Nova mensagem')}
      ${heading(assunto)}
      ${paragraph(`<strong>De:</strong> ${escapar(nome)} (${escapar(remetente)})`)}
      ${pedido ? paragraph(`<strong>Pedido:</strong> ${escapar(pedido)}`) : ''}
      ${divider()}
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${COLORS.ink}; white-space: pre-wrap;">${escapar(mensagem)}</p>
    `,
  );

  // `replyTo` deixa o atendimento responder direto ao cliente.
  await send(destino, `[Contato] ${assunto} — ${nome}`, html, remetente);
}

export async function enviarConfirmacaoContato(to: string, nome: string) {
  const html = layout(
    'Recebemos sua mensagem',
    `
      ${badge('Mensagem recebida')}
      ${heading('Recebemos sua mensagem!')}
      ${paragraph(`Olá, ${escapar(nome.split(' ')[0])}! Sua mensagem chegou até nós e vamos responder em até 1 dia útil.`)}
      ${paragraph('Se for urgente, você também pode falar com a gente pelo WhatsApp.')}
    `,
  );
  await send(to, 'Recebemos sua mensagem — Zoliê', html);
}

const TIPO_LABEL: Record<string, string> = { TROCA: 'troca', DEVOLUCAO: 'devolução' };

export async function enviarSolicitacaoTrocaRecebida(to: string, nome: string, numero: string, tipo: string) {
  const label = TIPO_LABEL[tipo] || 'solicitação';
  const html = layout(
    `Recebemos seu pedido de ${label}`,
    `
      ${badge('Solicitação recebida')}
      ${heading(`Recebemos seu pedido de ${label}`)}
      ${paragraph(`Olá, ${escapar(nome.split(' ')[0])}! Sua solicitação de ${label} do pedido <strong style="color:${COLORS.ink};">${escapar(numero)}</strong> foi registrada.`)}
      ${paragraph('Vamos analisar e responder em até 2 dias úteis. Você pode acompanhar o andamento em "Meus pedidos".')}
      ${button('Acompanhar solicitação', `${env.appUrl}/conta/pedidos`)}
    `,
  );
  await send(to, `Solicitação de ${label} — pedido ${numero}`, html);
}

export async function enviarRespostaTroca(
  to: string,
  nome: string,
  numero: string,
  tipo: string,
  aprovada: boolean,
  resposta?: string | null,
) {
  const label = TIPO_LABEL[tipo] || 'solicitação';
  const html = layout(
    `Sua ${label} foi ${aprovada ? 'aprovada' : 'analisada'}`,
    `
      ${badge(aprovada ? 'Aprovada' : 'Não aprovada', aprovada ? 'success' : 'gold')}
      ${heading(`Sua ${label} foi ${aprovada ? 'aprovada' : 'analisada'}`)}
      ${paragraph(`Olá, ${escapar(nome.split(' ')[0])}! Analisamos seu pedido de ${label} referente ao pedido <strong style="color:${COLORS.ink};">${escapar(numero)}</strong>.`)}
      ${resposta ? paragraph(escapar(resposta)) : ''}
      ${
        aprovada
          ? paragraph('Em breve enviaremos as instruções para o envio da peça de volta. Guarde a embalagem original, se possível.')
          : paragraph('Se tiver dúvidas sobre esta decisão, é só responder este e-mail que a gente conversa.')
      }
      ${button('Ver meus pedidos', `${env.appUrl}/conta/pedidos`)}
    `,
  );
  await send(to, `${aprovada ? 'Aprovada' : 'Resposta'}: ${label} do pedido ${numero} — Zoliê`, html);
}

export async function enviarPedidoExpirado(to: string, nome: string, numero: string) {
  const html = layout(
    `Pedido ${numero} cancelado por falta de pagamento`,
    `
      ${badge('Pedido cancelado')}
      ${heading('Seu pedido foi cancelado')}
      ${paragraph(`Olá, ${nome.split(' ')[0]}! Não identificamos o pagamento do pedido <strong style="color:${COLORS.ink};">${numero}</strong> dentro do prazo, então ele foi cancelado automaticamente e as peças voltaram para o estoque.`)}
      ${paragraph('Se ainda quiser as peças, é só fazer um novo pedido — mas corra, o estoque é limitado.')}
      ${button('Voltar às compras', `${env.appUrl}/produtos`)}
      ${paragraph('Se você chegou a pagar, responda este e-mail que verificamos para você.')}
    `,
  );
  await send(to, `Pedido ${numero} cancelado — Zoliê`, html);
}

export async function enviarPedidoCancelado(
  to: string,
  nome: string,
  numero: string,
  motivo?: string | null,
  estornado = false,
) {
  const html = layout(
    `Pedido ${numero} cancelado`,
    `
      ${badge('Pedido cancelado')}
      ${heading('Seu pedido foi cancelado')}
      ${paragraph(`Olá, ${nome.split(' ')[0]}! O pedido <strong style="color:${COLORS.ink};">${numero}</strong> foi cancelado.`)}
      ${motivo ? paragraph(`Motivo: ${motivo}`) : ''}
      ${
        estornado
          ? paragraph(
              'O estorno já foi solicitado. O prazo para o valor aparecer depende do meio de pagamento: no Pix costuma ser rápido, e no cartão de crédito pode levar até duas faturas.',
            )
          : paragraph('Nenhum valor foi cobrado por este pedido.')
      }
      ${button('Voltar às compras', `${env.appUrl}/produtos`)}
      ${paragraph('Ficou com alguma dúvida? É só responder este e-mail.')}
    `,
  );
  await send(to, `Pedido ${numero} cancelado — Zoliê`, html);
}

export async function enviarConfirmacaoPagamento(to: string, nome: string, numero: string) {
  const html = layout(
    `Pagamento do pedido ${numero} confirmado`,
    `
      ${badge('Pagamento confirmado', 'success')}
      ${heading('Recebemos seu pagamento!')}
      ${paragraph(`Olá, ${nome.split(' ')[0]}! O pagamento do pedido <strong style="color:${COLORS.ink};">${numero}</strong> foi confirmado com sucesso. Ele já está sendo preparado para envio.`)}
      ${button('Acompanhar meu pedido', `${env.appUrl}/conta/pedidos`)}
    `,
  );
  await send(to, `Pagamento confirmado: pedido ${numero} — Zoliê`, html);
}

export async function enviarCupomVoltei10(to: string, nome: string, codigo: string) {
  const html = layout(
    `Você ganhou ${codigo} para a próxima compra`,
    `
      ${badge('Cupom desbloqueado', 'success')}
      ${heading('Um mimo para sua próxima peça')}
      ${paragraph(`Olá, ${nome.split(' ')[0]}! Obrigada pela sua primeira compra na Zoliê. Para sua próxima peça, use o cupom <strong style="color:${COLORS.ink};">${escapar(codigo)}</strong> e ganhe 10% de desconto.`)}
      ${button('Ver semijoias', `${env.appUrl}/produtos`)}
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.inkTertiary};">Válido para a sua segunda compra, uma vez por cliente.</p>
    `,
  );
  await send(to, `Você ganhou um cupom de 10% — Zoliê`, html);
}
