import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';
import { AppError } from '@/lib/utils/errors';

const PACOTE_PADRAO = { height: 4, width: 8, length: 11, weight: 0.15 };

interface MelhorEnvioOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  error?: string;
}

function limparCep(cep: string) {
  return String(cep || '').replace(/\D/g, '');
}

export async function cotar(cep: string, subtotal = 0) {
  const limpo = limparCep(cep);
  if (limpo.length !== 8) {
    throw new AppError('CEP inválido', 422, 'INVALID_CEP');
  }
  const cepFormatado = limpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  const gratis = subtotal >= env.business.freeShippingThreshold;

  const res = await fetch(`${env.melhorEnvio.baseUrl}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.melhorEnvio.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Zoliê Semijoias (contato@zolie.com.br)',
    },
    body: JSON.stringify({
      from: { postal_code: limparCep(env.melhorEnvio.cepOrigem) },
      to: { postal_code: limpo },
      package: PACOTE_PADRAO,
    }),
  });

  if (!res.ok) {
    throw new AppError('Não foi possível calcular o frete no momento', 502, 'SHIPPING_PROVIDER_ERROR');
  }

  const data: MelhorEnvioOption[] = await res.json();
  const opcoes = data
    .filter(o => !o.error)
    .map(o => ({
      id: String(o.id),
      nome: o.name,
      prazoDias: o.delivery_time,
      valor: gratis ? 0 : round(o.price),
    }));

  if (!opcoes.length) {
    throw new AppError('Nenhuma opção de frete disponível para este CEP', 422, 'NO_SHIPPING_OPTIONS');
  }

  return {
    cep: cepFormatado,
    opcoes,
    freteGratisAplicado: gratis,
  };
}
