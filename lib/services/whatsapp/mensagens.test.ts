import { describe, expect, it } from 'vitest';
import { imagensPersonalizacao, linkWhatsapp, mensagemAlerta, mensagemVendaConfirmada, PedidoParaAviso } from './mensagens';

const base: PedidoParaAviso = {
  id: 'ord-1',
  numero: 'ZOL-0042',
  formaPagamento: 'CARTAO_CREDITO',
  parcelas: 3,
  subtotal: 224.8,
  frete: 0,
  desconto: 10,
  total: 214.8,
  cupomCodigo: 'BEMVINDO10',
  transportadora: 'PAC',
  prazoDiasEnvio: 7,
  user: null,
  endereco: null,
  guestNome: 'Ana Souza',
  guestEmail: 'ana@exemplo.com',
  guestTelefone: '(85) 99999-1234',
  guestCpf: null,
  guestRua: 'Rua das Flores',
  guestNumero: '10',
  guestComplemento: 'apto 2',
  guestBairro: 'Centro',
  guestCidade: 'Fortaleza',
  guestEstado: 'CE',
  guestCep: '60000-000',
  items: [
    { nomeProduto: 'Brinco Gota', quantidade: 1, tamanho: null, precoUnitario: 89.9, subtotal: 89.9, personalizacao: null },
    {
      nomeProduto: 'Colar Personalizado',
      quantidade: 1,
      tamanho: 'Corrente 45 cm',
      precoUnitario: 134.9,
      subtotal: 134.9,
      personalizacao: {
        modeloId: 'r12',
        modelo: 'Medalha redonda 12mm',
        imagens: ['https://abc.public.blob.vercel-storage.com/a.jpg', 'https://abc.public.blob.vercel-storage.com/b.png'],
        verso: true,
        textoVerso: 'Te amo',
        pingente: true,
        fonte: '03 georgia',
      },
    },
  ],
};

describe('mensagemVendaConfirmada', () => {
  const msg = mensagemVendaConfirmada(base, 'https://zolie.com.br');

  it('traz cliente, endereço, valores e link do admin', () => {
    expect(msg).toContain('Pedido *ZOL-0042*');
    expect(msg).toContain('Ana Souza _(sem conta)_');
    expect(msg).toContain('https://wa.me/5585999991234');
    expect(msg).toContain('*Fortaleza/CE*');
    expect(msg).toContain('Rua das Flores, 10 — apto 2');
    expect(msg).toContain('Frete: Grátis · PAC (até 7 dias úteis)');
    expect(msg).toContain('(cupom BEMVINDO10)');
    expect(msg).toContain('Cartão de crédito em 3x');
    expect(msg).toContain('https://zolie.com.br/admin/pedidos/ord-1');
  });

  it('detalha a personalização', () => {
    expect(msg).toContain('Contém peça personalizada');
    expect(msg).toContain('Modelo: Medalha redonda 12mm');
    expect(msg).toContain('Gravação no verso: Sim — "Te amo"');
    expect(msg).toContain('Letra: 03 georgia');
  });
});

describe('imagensPersonalizacao', () => {
  it('lista as imagens com legenda por peça', () => {
    expect(imagensPersonalizacao(base)).toEqual([
      { url: 'https://abc.public.blob.vercel-storage.com/a.jpg', legenda: '📎 Pedido *ZOL-0042* — Colar Personalizado (Medalha redonda 12mm) — imagem 1/2' },
      { url: 'https://abc.public.blob.vercel-storage.com/b.png', legenda: '📎 Pedido *ZOL-0042* — Colar Personalizado (Medalha redonda 12mm) — imagem 2/2' },
    ]);
  });
});

describe('auxiliares', () => {
  it('monta link do WhatsApp só com telefone válido', () => {
    expect(linkWhatsapp('5585999991234')).toBe('https://wa.me/5585999991234');
    expect(linkWhatsapp('123')).toBeNull();
    expect(linkWhatsapp(null)).toBeNull();
  });

  it('alerta omite campos vazios', () => {
    const msg = mensagemAlerta('erro', 'Falha X', { Pedido: 'ZOL-1', Vazio: undefined, Nulo: null });
    expect(msg).toContain('🚨 *Falha X*');
    expect(msg).toContain('• *Pedido:* ZOL-1');
    expect(msg).not.toContain('Vazio');
    expect(msg).not.toContain('Nulo');
  });
});
