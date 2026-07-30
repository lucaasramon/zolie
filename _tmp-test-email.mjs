import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());

const { Resend } = await import('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function button(label, href) {
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

function badge(text, tone = 'gold') {
  const colors = tone === 'success' ? { bg: COLORS.successBg, text: COLORS.success, border: '#D8DEC4' } : { bg: COLORS.hoverbg, text: COLORS.goldText, border: COLORS.border };
  return `<span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: ${colors.bg}; border: 1px solid ${colors.border}; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; color: ${colors.text};">${text}</span>`;
}

function layout(preheader, bodyHtml) {
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
                <img src="${appUrl}/images/zolie-logo.png" alt="Zoliê Semijoias" height="36" style="height: 36px; width: auto;" />
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

function heading(text) {
  return `<h1 style="margin: 0 0 4px; font-family: Arial, sans-serif; font-size: 22px; font-weight: 600; color: ${COLORS.ink};">${text}</h1>`;
}

function paragraph(text) {
  return `<p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${COLORS.inkMuted};">${text}</p>`;
}

function divider() {
  return `<hr style="border: none; border-top: 1px solid ${COLORS.borderSubtle}; margin: 24px 0;" />`;
}

function brl(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const items = [
  { nomeProduto: 'Colar banhado a ouro 18k', quantidade: 1, subtotal: 150 },
  { nomeProduto: 'Brinco Prata 925 com Zircônia', quantidade: 2, subtotal: 89.9 },
];
const total = 239.9;
const numero = 'ZL-2501';
const nome = 'Lucas Ramon';

const itensHtml = items
  .map(
    i => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.borderSubtle}; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.ink};">
          ${i.quantidade}x ${i.nomeProduto}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.borderSubtle}; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.ink}; text-align: right;">
          ${brl(i.subtotal)}
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
        <td style="padding-top: 14px; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: ${COLORS.ink}; text-align: right;">${brl(total)}</td>
      </tr>
    </table>
    ${divider()}
    ${paragraph('Você pode acompanhar cada etapa do seu pedido — do pagamento à entrega — a qualquer momento em "Meus pedidos".')}
    ${button('Acompanhar meu pedido', `${appUrl}/conta/pedidos`)}
  `,
);

const result = await resend.emails.send({
  from: process.env.EMAIL_FROM || 'Zoliê Semijoias <onboarding@resend.dev>',
  to: 'lucasstraike414@gmail.com',
  subject: `Pedido ${numero} confirmado — Zoliê`,
  html,
});

console.log('RESULT:', JSON.stringify(result, null, 2));
