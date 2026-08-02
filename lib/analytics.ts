/**
 * Camada única de analytics. Os componentes chamam funções de domínio
 * (`trackAddToCart`) e não conhecem GA4 nem Meta Pixel — trocar de provedor
 * ou adicionar outro acontece só aqui.
 *
 * Tudo é no-op quando os IDs não estão configurados, então o site funciona
 * normalmente em dev e em qualquer ambiente sem as variáveis.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export const analyticsAtivo = Boolean(GA_ID || META_PIXEL_ID);

export const CONSENT_STORAGE_KEY = 'zolie_cookie_consent';

/**
 * LGPD: sem consentimento explícito, nenhum evento é enviado. O padrão é negar —
 * quem ainda não decidiu não é rastreado.
 */
function temConsentimento(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem(CONSENT_STORAGE_KEY) === 'granted';
  } catch {
    // localStorage bloqueado (modo privado / cookies desativados) — trata como recusa.
    return false;
  }
}

/**
 * Propaga a decisão do usuário para o Consent Mode do Google e para o Pixel.
 * Chamado pelo banner; também roda no load para reaplicar a escolha salva.
 */
export function aplicarConsentimento(aceito: boolean) {
  if (typeof window === 'undefined') return;

  window.gtag?.('consent', 'update', {
    analytics_storage: aceito ? 'granted' : 'denied',
    ad_storage: aceito ? 'granted' : 'denied',
    ad_user_data: aceito ? 'granted' : 'denied',
    ad_personalization: aceito ? 'granted' : 'denied',
  });

  window.fbq?.('consent', aceito ? 'grant' : 'revoke');
}

export interface AnalyticsItem {
  id: string;
  nome: string;
  preco: number;
  quantidade?: number;
  categoria?: string | null;
  variante?: string | null;
}

function gtagEvent(evento: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;
  if (!temConsentimento()) return;
  window.gtag('event', evento, params);
}

function fbqEvent(evento: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq || !META_PIXEL_ID) return;
  if (!temConsentimento()) return;
  window.fbq('track', evento, params);
}

/** Formato de item esperado pelo GA4 (Google Analytics 4 / ecommerce). */
function paraGa4(item: AnalyticsItem) {
  return {
    item_id: item.id,
    item_name: item.nome,
    price: item.preco,
    quantity: item.quantidade ?? 1,
    ...(item.categoria && { item_category: item.categoria }),
    ...(item.variante && { item_variant: item.variante }),
  };
}

function valorTotal(itens: AnalyticsItem[]) {
  return Number(itens.reduce((s, i) => s + i.preco * (i.quantidade ?? 1), 0).toFixed(2));
}

export function trackViewItem(item: AnalyticsItem) {
  gtagEvent('view_item', { currency: 'BRL', value: item.preco, items: [paraGa4(item)] });
  fbqEvent('ViewContent', {
    content_ids: [item.id],
    content_name: item.nome,
    content_type: 'product',
    value: item.preco,
    currency: 'BRL',
  });
}

export function trackAddToCart(item: AnalyticsItem) {
  const valor = item.preco * (item.quantidade ?? 1);
  gtagEvent('add_to_cart', { currency: 'BRL', value: valor, items: [paraGa4(item)] });
  fbqEvent('AddToCart', {
    content_ids: [item.id],
    content_name: item.nome,
    content_type: 'product',
    value: valor,
    currency: 'BRL',
  });
}

export function trackBeginCheckout(itens: AnalyticsItem[]) {
  const valor = valorTotal(itens);
  gtagEvent('begin_checkout', { currency: 'BRL', value: valor, items: itens.map(paraGa4) });
  fbqEvent('InitiateCheckout', {
    content_ids: itens.map(i => i.id),
    content_type: 'product',
    num_items: itens.reduce((s, i) => s + (i.quantidade ?? 1), 0),
    value: valor,
    currency: 'BRL',
  });
}

interface CompraInfo {
  numero: string;
  total: number;
  frete?: number;
  cupom?: string | null;
  itens: AnalyticsItem[];
}

export function trackPurchase({ numero, total, frete, cupom, itens }: CompraInfo) {
  gtagEvent('purchase', {
    transaction_id: numero,
    currency: 'BRL',
    value: total,
    ...(frete != null && { shipping: frete }),
    ...(cupom && { coupon: cupom }),
    items: itens.map(paraGa4),
  });
  fbqEvent('Purchase', {
    content_ids: itens.map(i => i.id),
    content_type: 'product',
    num_items: itens.reduce((s, i) => s + (i.quantidade ?? 1), 0),
    value: total,
    currency: 'BRL',
  });
}

export function trackSearch(termo: string) {
  gtagEvent('search', { search_term: termo });
  fbqEvent('Search', { search_string: termo });
}
