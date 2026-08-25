import { env } from '@/lib/env';
import { melhorEnvioClient } from '@/lib/services/melhorEnvio/client';
import { orderRepo } from '@/lib/repositories/order.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

const PACOTE_PADRAO = { height: 4, width: 8, length: 11, weight: 0.15 };

/** Campos do remetente sem os quais o Melhor Envio recusa o carrinho. */
const REMETENTE_OBRIGATORIO = ['nome', 'email', 'documento', 'endereco', 'numero', 'bairro', 'cidade', 'estado'] as const;

function validarConfiguracao() {
  if (!env.melhorEnvio.labelsEnabled) {
    throw new AppError(
      'Compra de etiquetas desativada. Defina MELHOR_ENVIO_LABELS_ENABLED=true para habilitar.',
      503,
      'LABELS_DISABLED',
    );
  }
  const faltando = REMETENTE_OBRIGATORIO.filter(campo => !env.melhorEnvio.remetente[campo]);
  if (faltando.length) {
    throw new AppError(
      `Dados do remetente incompletos: ${faltando.join(', ')}. Configure as variáveis LOJA_REMETENTE_*.`,
      503,
      'SENDER_NOT_CONFIGURED',
    );
  }
}

function nomeParts(nome: string) {
  const limpo = nome.trim().replace(/\s+/g, ' ');
  return limpo || 'Cliente';
}

/**
 * Paga e gera a etiqueta de um envio já presente no carrinho do Melhor Envio.
 * Compartilhada entre a compra nova e a retomada de um envio que ficou
 * pendente numa tentativa anterior (ex: saldo insuficiente no checkout).
 */
async function finalizarEtiqueta(orderId: string, shipmentId: string) {
  try {
    await melhorEnvioClient.checkout([shipmentId]);
  } catch (err) {
    // Retomada de uma tentativa anterior que já pagou o envio, mas falhou depois
    // (ex: no generate). O Melhor Envio recusa pagar de novo — nesse caso o erro
    // é esperado, não uma falha: segue para o generate normalmente.
    const jaPago = err instanceof AppError && /já foram pagas/i.test(err.message);
    if (!jaPago) {
      logger.error('Falha no checkout da etiqueta; envio permanece no carrinho do Melhor Envio', err, {
        orderId,
        shipmentId,
      });
      throw err;
    }
  }

  try {
    await melhorEnvioClient.generate([shipmentId]);
  } catch (err) {
    logger.error('Falha no generate da etiqueta; envio permanece pago mas sem etiqueta gerada', err, {
      orderId,
      shipmentId,
    });
    throw err;
  }

  // A impressão é best-effort: a etiqueta já foi paga e gerada, e falhar aqui
  // só significa que o link do PDF vem depois.
  let etiquetaUrl: string | null = null;
  try {
    const { url } = await melhorEnvioClient.print([shipmentId]);
    etiquetaUrl = url || null;
    if (etiquetaUrl) await orderRepo.setEtiquetaUrl(orderId, etiquetaUrl);
  } catch (err) {
    logger.warn('Etiqueta comprada, mas não foi possível obter o PDF de impressão', {
      orderId,
      shipmentId,
      erro: String(err),
    });
  }

  return { melhorEnvioId: shipmentId, etiquetaUrl };
}

/**
 * Compra a etiqueta de um pedido: carrinho → checkout (debita saldo) → generate.
 * O código de rastreio **não** sai aqui — o Melhor Envio leva um tempo para
 * emiti-lo, então quem o busca é `sincronizarRastreio`, chamado pelo cron.
 */
export async function comprarEtiqueta(orderId: string) {
  validarConfiguracao();

  const order = await orderRepo.findById(orderId);
  if (!order) throw notFound('Pedido');
  if (order.melhorEnvioId && order.etiquetaUrl) {
    throw new AppError('Este pedido já tem etiqueta comprada', 422, 'LABEL_ALREADY_BOUGHT');
  }
  if (order.status === 'CANCELADO') {
    throw new AppError('Não é possível gerar etiqueta de um pedido cancelado', 422, 'ORDER_CANCELLED');
  }
  if (order.status === 'AGUARDANDO_PAGAMENTO') {
    throw new AppError('Confirme o pagamento antes de comprar a etiqueta', 422, 'ORDER_NOT_PAID');
  }

  // Uma tentativa anterior já criou o envio no carrinho do Melhor Envio, mas o
  // checkout/generate falhou (ex: saldo insuficiente) antes de emitir a etiqueta.
  // Retoma esse mesmo envio em vez de criar outro item duplicado no carrinho.
  if (order.melhorEnvioId) {
    return finalizarEtiqueta(order.id, order.melhorEnvioId);
  }

  // Pedido de conta usa o endereço salvo (`order.endereco`); pedido de convidado
  // não tem `Address` vinculado — o endereço fica gravado direto no pedido nos
  // campos `guest*`. Sem esse fallback, todo pedido de convidado era rejeitado
  // aqui como "sem endereço", mesmo tendo um.
  const endereco = order.endereco
    ? {
        rua: order.endereco.rua,
        numero: order.endereco.numero,
        complemento: order.endereco.complemento,
        bairro: order.endereco.bairro,
        cidade: order.endereco.cidade,
        estado: order.endereco.estado,
        cep: order.endereco.cep,
      }
    : order.guestRua && order.guestCep
      ? {
          rua: order.guestRua,
          numero: order.guestNumero || '',
          complemento: order.guestComplemento,
          bairro: order.guestBairro || '',
          cidade: order.guestCidade || '',
          estado: order.guestEstado || '',
          cep: order.guestCep,
        }
      : null;
  if (!endereco) throw new AppError('Pedido sem endereço de entrega', 422, 'ADDRESS_MISSING');

  const nomeDestinatario = order.user?.nome || order.guestNome || 'Cliente';
  const emailDestinatario = order.user?.email || order.guestEmail || undefined;
  const telefoneDestinatario = order.user?.telefone || order.guestTelefone || undefined;
  const documentoDestinatario = (order.user?.cpf || order.guestCpf || '').replace(/\D/g, '') || undefined;

  const { remetente } = env.melhorEnvio;

  // O peso real é a soma dos itens; cai no padrão se nenhum produto tiver peso.
  const pesoTotal = order.items.reduce((soma, item) => soma + Number(item.quantidade) * 0.15, 0);

  const shipment = await melhorEnvioClient.addToCart({
    service: Number(order.envioServicoId) || undefined,
    agency: env.melhorEnvio.agenciaId ? Number(env.melhorEnvio.agenciaId) : undefined,
    from: {
      name: nomeParts(remetente.nome),
      email: remetente.email,
      document: remetente.documento,
      phone: remetente.telefone || undefined,
      address: remetente.endereco,
      number: remetente.numero,
      complement: remetente.complemento || undefined,
      district: remetente.bairro,
      city: remetente.cidade,
      state_abbr: remetente.estado,
      postal_code: env.melhorEnvio.cepOrigem.replace(/\D/g, ''),
    },
    to: {
      name: nomeParts(nomeDestinatario),
      email: emailDestinatario,
      document: documentoDestinatario,
      phone: telefoneDestinatario?.replace(/\D/g, '') || undefined,
      address: endereco.rua,
      number: endereco.numero,
      complement: endereco.complemento || undefined,
      district: endereco.bairro,
      city: endereco.cidade,
      state_abbr: endereco.estado,
      postal_code: endereco.cep.replace(/\D/g, ''),
    },
    products: order.items.map(item => ({
      name: item.nomeProduto,
      quantity: item.quantidade,
      unitary_value: Number(item.precoUnitario),
    })),
    volumes: [{ ...PACOTE_PADRAO, weight: Math.max(pesoTotal, PACOTE_PADRAO.weight) }],
    options: {
      insurance_value: Number(order.subtotal),
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: true,
    },
  });

  if (!shipment?.id) {
    throw new AppError('Melhor Envio não retornou o identificador do envio', 502, 'SHIPPING_PROVIDER_ERROR');
  }

  // A partir daqui já existe um envio no carrinho do Melhor Envio. Gravamos o id
  // imediatamente: se checkout ou generate falharem depois, o id não se perde e a
  // etiqueta pode ser retomada pelo painel em vez de virar saldo gasto sem rastro.
  await orderRepo.setMelhorEnvioId(order.id, shipment.id);

  return finalizarEtiqueta(order.id, shipment.id);
}

/**
 * Busca o rastreio de um envio já gerado e grava no pedido.
 * Retorna null enquanto o Melhor Envio ainda não emitiu o código.
 */
export async function sincronizarRastreio(orderId: string) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw notFound('Pedido');
  if (!order.melhorEnvioId) {
    throw new AppError('Este pedido ainda não tem etiqueta comprada', 422, 'LABEL_NOT_BOUGHT');
  }
  if (order.codigoRastreio) return order.codigoRastreio;

  const resposta = await melhorEnvioClient.tracking([order.melhorEnvioId]);
  const info = resposta?.[order.melhorEnvioId];
  const codigo = info?.tracking || info?.melhorenvio_tracking || null;
  if (!codigo) return null;

  await orderRepo.setRastreio(order.id, codigo, order.transportadora);
  return codigo;
}
