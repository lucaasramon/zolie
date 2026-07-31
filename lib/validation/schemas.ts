import { z } from 'zod';

const senha = z.string().min(8, 'A senha precisa de ao menos 8 caracteres');

export const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha,
  telefone: z.string().min(10).optional(),
  cpf: z.string().min(11).optional(),
});

export const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });

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
  acabamento: z.string().optional().nullable(),
});

const cardSchema = z.object({
  numero: z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido'),
  nomeImpresso: z.string().min(3),
  validadeMes: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  validadeAno: z.string().regex(/^\d{4}$/, 'Ano inválido'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
});

export const orderSchema = z
  .object({
    enderecoId: z.string().min(1),
    formaPagamento: z.enum(['CARTAO_CREDITO', 'PIX', 'BOLETO']),
    parcelas: z.number().int().min(1).max(18).optional(),
    cep: z.string().optional(),
    envioId: z.string().optional(),
    cupom: z.string().optional(),
    creditCardToken: z.string().optional(),
    cartao: cardSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.formaPagamento === 'CARTAO_CREDITO' && !data.creditCardToken && !data.cartao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cartao'], message: 'Dados do cartão são obrigatórios para pagamento com cartão de crédito' });
    }
  });

export const productSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().min(10),
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
  primeiraCompra: z.boolean().optional(),
  validade: z.coerce.date().nullable().optional(),
});

export const forgotSchema = z.object({ email: z.string().email() });
export const resetSchema = z.object({ token: z.string().min(1), novaSenha: senha });
export const statusSchema = z.object({
  status: z.enum(['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']),
  descricao: z.string().optional(),
});
export const cepSchema = z.object({ cep: z.string().min(8) });
export const couponCodeSchema = z.object({ codigo: z.string().min(3), subtotal: z.number().min(0).optional() });
export const quantitySchema = z.object({ quantidade: z.number().int().min(1).max(20) });
export const profileSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z.string().min(10).optional(),
  cpf: z.string().min(11).optional(),
});

// Novos schemas — não existiam no backend original (gap de validação corrigido)
export const categorySchema = z.object({
  nome: z.string().min(2),
  slug: z.string().optional(),
  imagem: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
  ativa: z.boolean().optional(),
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
