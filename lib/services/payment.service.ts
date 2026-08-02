import { asaasClient, resolveCustomerId } from '@/lib/services/asaas';
import { AppError } from '@/lib/utils/errors';
import { round } from '@/lib/utils/money';

interface CartaoInput {
  numero: string;
  nomeImpresso: string;
  validadeMes: string;
  validadeAno: string;
  cvv: string;
}

interface CriarCobrancaOpts {
  order: { id: string; total: unknown; numero: string };
  formaPagamento: 'CARTAO_CREDITO' | 'PIX' | 'BOLETO';
  parcelas?: number;
  user: { id: string; nome: string; email: string; cpf: string; telefone?: string | null };
  endereco: { cep: string; rua: string; numero: string; bairro: string; complemento?: string | null };
  /** Token gerado no client via Asaas.js — preferencial, evita que o PAN/CVV trafeguem pelo backend. */
  creditCardToken?: string;
  /** Fallback legado: dados crus do cartão, usados apenas se nenhum token for enviado. */
  cartao?: CartaoInput;
  remoteIp: string;
}

export async function criarCobranca({ order, formaPagamento, parcelas = 1, user, endereco, creditCardToken, cartao, remoteIp }: CriarCobrancaOpts) {
  const customerId = await resolveCustomerId({
    userId: user.id,
    nome: user.nome,
    email: user.email,
    cpf: user.cpf,
    telefone: user.telefone,
    endereco,
  });

  const total = Number(order.total);
  const billingType = formaPagamento === 'CARTAO_CREDITO' ? 'CREDIT_CARD' : formaPagamento;
  const dueDate = new Date(Date.now() + (formaPagamento === 'BOLETO' ? 3 : 1) * 86400000).toISOString().slice(0, 10);

  const payload: Record<string, unknown> = {
    customer: customerId,
    billingType,
    dueDate,
    description: `Pedido ${order.numero} — Zoliê`,
    externalReference: order.numero,
  };

  if (formaPagamento === 'CARTAO_CREDITO' && parcelas > 1) {
    payload.installmentCount = parcelas;
    payload.totalValue = total;
  } else {
    payload.value = total;
  }

  if (formaPagamento === 'CARTAO_CREDITO') {
    if (!creditCardToken && !cartao) throw new AppError('Dados do cartão são obrigatórios', 422, 'CARD_DATA_REQUIRED');

    if (creditCardToken) {
      payload.creditCardToken = creditCardToken;
    } else if (cartao) {
      payload.creditCard = {
        holderName: cartao.nomeImpresso,
        number: cartao.numero.replace(/\s/g, ''),
        expiryMonth: cartao.validadeMes,
        expiryYear: cartao.validadeAno,
        ccv: cartao.cvv,
      };
      payload.creditCardHolderInfo = {
        name: user.nome,
        email: user.email,
        cpfCnpj: user.cpf.replace(/\D/g, ''),
        postalCode: endereco.cep.replace(/\D/g, ''),
        addressNumber: endereco.numero,
        addressComplement: endereco.complemento || undefined,
        phone: user.telefone?.replace(/\D/g, ''),
        mobilePhone: user.telefone?.replace(/\D/g, ''),
      };
    }
    payload.remoteIp = remoteIp;
  }

  const payment = await asaasClient.createPayment(payload);
  return normalizarPagamento(payment, formaPagamento, total, parcelas);
}

async function normalizarPagamento(
  payment: Record<string, any>,
  formaPagamento: 'CARTAO_CREDITO' | 'PIX' | 'BOLETO',
  total: number,
  parcelas = 1,
) {
  const normalized: Record<string, unknown> = {
    id: payment.id,
    provider: 'asaas',
    metodo: formaPagamento,
    status: payment.status,
    valor: total,
    asaasPaymentId: payment.id,
    asaasStatus: payment.status,
  };

  if (formaPagamento === 'PIX') {
    const qr = await asaasClient.getPixQrCode(payment.id);
    normalized.qrCode = qr.encodedImage;
    normalized.copiaECola = qr.payload;
    normalized.expiraEm = qr.expirationDate;
  }

  if (formaPagamento === 'BOLETO') {
    normalized.url = payment.bankSlipUrl ?? null;
    normalized.linhaDigitavel = payment.nossoNumero ?? null;
    normalized.vencimento = payment.dueDate ?? null;
  }

  if (formaPagamento === 'CARTAO_CREDITO') {
    normalized.parcelas = parcelas;
    normalized.valorParcela = parcelas > 1 ? round(total / parcelas) : total;
  }

  return normalized;
}

interface ConsultarCobrancaOpts {
  asaasPaymentId: string;
  formaPagamento: 'CARTAO_CREDITO' | 'PIX' | 'BOLETO';
  parcelas?: number;
}

export async function consultarCobranca({ asaasPaymentId, formaPagamento, parcelas = 1 }: ConsultarCobrancaOpts) {
  const payment = await asaasClient.getPayment(asaasPaymentId);
  return normalizarPagamento(payment, formaPagamento, Number(payment.value ?? payment.totalValue ?? 0), parcelas);
}

/** Status do Asaas em que o dinheiro já entrou e portanto precisa ser estornado. */
const STATUS_PAGOS = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);

/** Status em que a cobrança já não é mais pagável — nada a fazer no gateway. */
const STATUS_ENCERRADOS = new Set(['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'DELETED']);

export type ResultadoEstorno = 'ESTORNADO' | 'COBRANCA_REMOVIDA' | 'NADA_A_FAZER';

/**
 * Encerra a cobrança de um pedido no Asaas da forma correta para o estado dela:
 * paga → estorno (devolve o dinheiro); não paga → remoção (impede pagamento futuro).
 *
 * Consulta o status real no gateway em vez de confiar no `asaasStatus` gravado
 * localmente, que pode estar defasado se um webhook se perdeu.
 */
export async function encerrarCobranca(asaasPaymentId: string, motivo?: string): Promise<ResultadoEstorno> {
  const payment = await asaasClient.getPayment(asaasPaymentId);
  const status = String(payment.status || '');

  if (STATUS_ENCERRADOS.has(status)) return 'NADA_A_FAZER';

  if (STATUS_PAGOS.has(status)) {
    await asaasClient.refundPayment(asaasPaymentId, motivo);
    return 'ESTORNADO';
  }

  await asaasClient.deletePayment(asaasPaymentId);
  return 'COBRANCA_REMOVIDA';
}
