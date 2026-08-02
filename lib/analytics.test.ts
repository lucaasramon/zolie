import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Os IDs são lidos na carga do módulo, então precisam existir antes do import.
vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TESTE123');
vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '99887766');

const { trackViewItem, trackAddToCart, trackBeginCheckout, trackPurchase, CONSENT_STORAGE_KEY } =
  await import('./analytics');

const gtag = vi.fn();
const fbq = vi.fn();

/** Simula o window com uma decisão de cookies já tomada. */
function janelaCom(consentimento: 'granted' | 'denied' | null) {
  return {
    gtag,
    fbq,
    localStorage: {
      getItem: (chave: string) => (chave === CONSENT_STORAGE_KEY ? consentimento : null),
      setItem: () => {},
    },
  };
}

beforeEach(() => {
  gtag.mockReset();
  fbq.mockReset();
  // O padrão dos testes é "consentiu": o bloqueio sem consentimento tem bloco próprio.
  vi.stubGlobal('window', janelaCom('granted'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Últimos params passados ao gtag para um evento específico. */
function paramsGa(evento: string) {
  const chamada = gtag.mock.calls.find(c => c[1] === evento);
  return chamada?.[2];
}

function paramsFb(evento: string) {
  const chamada = fbq.mock.calls.find(c => c[1] === evento);
  return chamada?.[2];
}

const ITEM = { id: 'p1', nome: 'Colar Aurora', preco: 149.9, categoria: 'Colares' };

describe('trackViewItem', () => {
  it('envia para GA4 e Meta com moeda BRL', () => {
    trackViewItem(ITEM);
    expect(paramsGa('view_item').currency).toBe('BRL');
    expect(paramsFb('ViewContent').currency).toBe('BRL');
  });

  it('mapeia o item para o formato de ecommerce do GA4', () => {
    trackViewItem(ITEM);
    const item = paramsGa('view_item').items[0];
    expect(item).toMatchObject({
      item_id: 'p1',
      item_name: 'Colar Aurora',
      price: 149.9,
      quantity: 1,
      item_category: 'Colares',
    });
  });
});

describe('trackAddToCart', () => {
  it('multiplica o valor pela quantidade', () => {
    trackAddToCart({ ...ITEM, preco: 100, quantidade: 3 });
    expect(paramsGa('add_to_cart').value).toBe(300);
    expect(paramsFb('AddToCart').value).toBe(300);
  });

  it('registra a variante escolhida', () => {
    trackAddToCart({ ...ITEM, variante: '16 / Polido' });
    expect(paramsGa('add_to_cart').items[0].item_variant).toBe('16 / Polido');
  });
});

describe('trackBeginCheckout', () => {
  it('soma o valor de todos os itens considerando a quantidade', () => {
    trackBeginCheckout([
      { id: 'a', nome: 'A', preco: 50, quantidade: 2 },
      { id: 'b', nome: 'B', preco: 30, quantidade: 1 },
    ]);
    expect(paramsGa('begin_checkout').value).toBe(130);
    expect(paramsFb('InitiateCheckout').num_items).toBe(3);
  });
});

describe('trackPurchase', () => {
  const COMPRA = {
    numero: 'ZL-2500',
    total: 199.9,
    frete: 20,
    itens: [{ id: 'p1', nome: 'Colar', preco: 179.9, quantidade: 1 }],
  };

  it('usa o número do pedido como transaction_id', () => {
    trackPurchase(COMPRA);
    // O transaction_id é o que deduplica a conversão no GA4; sem ele, um F5 na
    // tela de confirmação contaria a venda duas vezes.
    expect(paramsGa('purchase').transaction_id).toBe('ZL-2500');
  });

  it('envia total e frete separadamente', () => {
    trackPurchase(COMPRA);
    expect(paramsGa('purchase').value).toBe(199.9);
    expect(paramsGa('purchase').shipping).toBe(20);
  });

  it('inclui o cupom apenas quando existe', () => {
    trackPurchase(COMPRA);
    expect(paramsGa('purchase').coupon).toBeUndefined();
    gtag.mockReset();
    trackPurchase({ ...COMPRA, cupom: 'BEMVINDA10' });
    expect(paramsGa('purchase').coupon).toBe('BEMVINDA10');
  });
});

describe('quando os scripts não carregaram', () => {
  it('não quebra se gtag/fbq não existirem (adblock, script bloqueado)', () => {
    vi.stubGlobal('window', {});
    expect(() => trackViewItem(ITEM)).not.toThrow();
    expect(() => trackPurchase({ numero: 'ZL-1', total: 10, itens: [] })).not.toThrow();
  });
});

describe('consentimento de cookies (LGPD)', () => {
  it('NÃO envia evento algum quando o usuário recusou', () => {
    vi.stubGlobal('window', janelaCom('denied'));
    trackViewItem(ITEM);
    trackAddToCart(ITEM);
    trackPurchase({ numero: 'ZL-1', total: 10, itens: [] });
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('NÃO envia evento antes de o usuário decidir', () => {
    // Padrão é negar: quem ainda não escolheu não pode ser rastreado.
    vi.stubGlobal('window', janelaCom(null));
    trackViewItem(ITEM);
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('trata localStorage indisponível como recusa', () => {
    // Modo privado ou cookies bloqueados: falhar fechado, não aberto.
    vi.stubGlobal('window', {
      gtag,
      fbq,
      localStorage: {
        getItem: () => {
          throw new Error('acesso negado');
        },
      },
    });
    expect(() => trackViewItem(ITEM)).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });

  it('volta a enviar quando o usuário aceita', () => {
    vi.stubGlobal('window', janelaCom('granted'));
    trackViewItem(ITEM);
    expect(gtag).toHaveBeenCalled();
  });
});
