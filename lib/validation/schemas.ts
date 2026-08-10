import { z } from 'zod';
import { cpfValido, normalizarCpf } from '@/lib/utils/cpf';

const senha = z.string().min(8, 'A senha precisa de ao menos 8 caracteres');

// Aceita CPF com ou sem máscara, valida os dígitos verificadores e guarda só os 11 dígitos.
const cpf = z
  .string()
  .transform(normalizarCpf)
  .refine(cpfValido, 'CPF inválido');

// trim/lowercase antes do .email(): validar primeiro rejeitaria espaços acidentais nas pontas.
const email = z.string().trim().toLowerCase().pipe(z.string().email());

export const registerSchema = z.object({
  nome: z.string().min(3),
  email,
  senha,
  telefone: z.string().min(10).optional(),
  cpf: cpf.optional(),
});

export const loginSchema = z.object({ email, senha: z.string().min(1) });

export const addressSchema = z.object({
  apelido: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  rua: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  principal: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantidade: z.number().int().min(1).max(20).default(1),
  tamanho: z.string().optional().nullable(),
});

const cardSchema = z.object({
  numero: z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido'),
  nomeImpresso: z.string().min(3),
  validadeMes: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  validadeAno: z.string().regex(/^\d{4}$/, 'Ano inválido'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
});

// Checkout de convidado: contato + endereço informados inline, sem conta.
export const guestCheckoutSchema = z.object({
  nome: z.string().trim().min(3),
  email,
  telefone: z.string().trim().min(10).optional(),
  cpf,
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  rua: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
});

export const orderSchema = z
  .object({
    enderecoId: z.string().min(1).optional(),
    guest: guestCheckoutSchema.optional(),
    formaPagamento: z.enum(['CARTAO_CREDITO', 'PIX', 'BOLETO']),
    parcelas: z.number().int().min(1).max(18).optional(),
    cep: z.string().optional(),
    envioId: z.string().optional(),
    cupom: z.string().optional(),
    creditCardToken: z.string().optional(),
    cartao: cardSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.enderecoId && !data.guest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enderecoId'], message: 'Selecione um endereço ou informe os dados de convidado' });
    }
    if (data.formaPagamento === 'CARTAO_CREDITO' && !data.creditCardToken && !data.cartao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cartao'], message: 'Dados do cartão são obrigatórios para pagamento com cartão de crédito' });
    }
  });

export const asaasCustomerSchema = z
  .object({
    enderecoId: z.string().min(1).optional(),
    guest: guestCheckoutSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.enderecoId && !data.guest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enderecoId'], message: 'Selecione um endereço ou informe os dados de convidado' });
    }
  });

export const productSchema = z.object({
  nome: z.string().min(3),
  sku: z.string().trim().max(50).nullable().optional().transform(v => (v ? v : null)),
  descricao: z.string().min(10),
  precoCusto: z.number().positive().nullable().optional(),
  preco: z.number().positive(),
  precoPromocional: z.number().positive().nullable().optional(),
  material: z.enum(['PRATA_925', 'BANHADO_OURO']),
  categoriaId: z.string().min(1),
  estoque: z.number().int().min(0),
  pesoGramas: z.number().positive().optional(),
  pedra: z.string().nullable().optional(),
  tamanhos: z.array(z.string()).optional(),
  imagens: z.array(z.string()).optional(),
  destaque: z.boolean().optional(),
  lancamento: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

export const reviewSchema = z.object({
  nota: z.number().int().min(1).max(5),
  titulo: z.string().max(80).optional(),
  comentario: z.string().max(1000).optional(),
  imagens: z.array(z.string()).max(4).optional(),
});

export const couponSchema = z.object({
  codigo: z.string().min(3),
  descricao: z.string().optional(),
  tipoDesconto: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING']),
  valor: z.number().min(0),
  minimoPedido: z.number().min(0).nullable().optional(),
  usoMaximo: z.number().int().positive().nullable().optional(),
  restricaoCompra: z.enum(['PRIMEIRA', 'SEGUNDA']).nullable().optional(),
  validade: z.coerce.date().nullable().optional(),
});

export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(1), novaSenha: senha });
// String vazia vinda do formulário do admin vira null: "limpar o campo" precisa
// ser distinguível de "não mexer no campo" (undefined) na hora de persistir.
const rastreioField = z
  .string()
  .trim()
  .max(60)
  .transform(v => v || null)
  .nullable()
  .optional();

export const statusSchema = z.object({
  status: z.enum(['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']),
  descricao: z.string().optional(),
  codigoRastreio: rastreioField,
  transportadora: rastreioField,
});
export const contactSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome').max(120),
  email,
  assunto: z.string().trim().min(2).max(120),
  mensagem: z.string().trim().min(10, 'Escreva um pouco mais sobre o que você precisa').max(2000),
  pedido: z.string().trim().max(30).optional().nullable(),
});

export const returnRequestSchema = z.object({
  tipo: z.enum(['TROCA', 'DEVOLUCAO']),
  motivo: z.string().trim().min(3).max(120),
  descricao: z.string().trim().max(1000).optional(),
  imagens: z.array(z.string()).max(4).optional(),
  // Itens do pedido incluídos na solicitação; vazio = pedido inteiro.
  itens: z
    .array(z.object({ orderItemId: z.string().min(1), quantidade: z.number().int().min(1).max(20) }))
    .optional(),
});

export const returnDecisionSchema = z.object({
  status: z.enum(['APROVADA', 'RECUSADA', 'RECEBIDA', 'CONCLUIDA']),
  respostaAdmin: z.string().trim().max(1000).optional(),
  codigoReversa: z.string().trim().max(60).optional(),
});

export const notaFiscalSchema = z.object({
  notaFiscalUrl: z.string().url('URL inválida').max(500).nullable().optional(),
  // Chave da NF-e: 44 dígitos. Aceita com máscara e guarda só os números.
  notaFiscalChave: z
    .string()
    .trim()
    .transform(v => v.replace(/\D/g, ''))
    .refine(v => v === '' || v.length === 44, 'A chave da NF-e precisa ter 44 dígitos')
    .transform(v => v || null)
    .nullable()
    .optional(),
  notaFiscalNumero: z.string().trim().max(20).transform(v => v || null).nullable().optional(),
});

export const cancelSchema = z.object({
  motivo: z.string().trim().max(200).optional(),
});

export const adminCancelSchema = cancelSchema.extend({
  // Default `false`: devolver dinheiro é uma escolha explícita do admin, nunca
  // consequência de um campo esquecido no payload.
  estornar: z.boolean().default(false),
});

export const cepSchema = z.object({ cep: z.string().min(8) });
export const couponCodeSchema = z.object({ codigo: z.string().min(3), subtotal: z.number().min(0).optional() });
export const quantitySchema = z.object({ quantidade: z.number().int().min(1).max(20) });
export const profileSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z.string().min(10).optional(),
  cpf: cpf.optional(),
});

// Novos schemas — não existiam no backend original (gap de validação corrigido)
export const categorySchema = z.object({
  nome: z.string().min(2),
  slug: z.string().optional(),
  imagem: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
  ativa: z.boolean().optional(),
});

export const supplySchema = z.object({
  nome: z.string().min(2),
  valorPago: z.number().positive(),
  quantidadeLote: z.number().int().positive(),
  categoria: z.enum(['EMBALAGEM', 'BRINDE']).optional(),
  ativo: z.boolean().optional(),
});

export const pricingSchema = z.object({
  custoSemijoia: z.number().min(0).nullable().optional(),
  // null = usar a soma calculada dos insumos marcados em supplyIds.
  custoEmbalagem: z.number().min(0).nullable().optional(),
  margemDesejada: z.number().min(0).max(999).nullable().optional(),
  supplyIds: z.array(z.string()).optional(),
});

export const bannerSchema = z.object({
  titulo: z.string().min(3),
  subtitulo: z.string().optional(),
  tag: z.string().optional(),
  cta: z.string().optional(),
  link: z.string().optional(),
  imagem: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional(),
});

export const siteConfigSchema = z.object({
  freteGratisAtivo: z.boolean().optional(),
  descontoPixAtivo: z.boolean().optional(),
});
