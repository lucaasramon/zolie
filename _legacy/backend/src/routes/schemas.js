const { z } = require('zod');

const senha = z.string().min(8, 'A senha precisa de ao menos 8 caracteres');

const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha,
  telefone: z.string().min(10).optional(),
  cpf: z.string().min(11).optional()
});

const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });

const addressSchema = z.object({
  apelido: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  rua: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  principal: z.boolean().optional()
});

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantidade: z.number().int().min(1).max(20).default(1),
  tamanho: z.string().optional().nullable(),
  acabamento: z.string().optional().nullable()
});

const orderSchema = z.object({
  enderecoId: z.string().min(1),
  formaPagamento: z.enum(['CARTAO_CREDITO', 'PIX', 'BOLETO']),
  parcelas: z.number().int().min(1).max(18).optional(),
  cep: z.string().optional(),
  envioId: z.enum(['pac', 'sedex']).optional(),
  cupom: z.string().optional()
});

const productSchema = z.object({
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
  lancamento: z.boolean().optional()
});

const reviewSchema = z.object({
  nota: z.number().int().min(1).max(5),
  titulo: z.string().max(80).optional(),
  comentario: z.string().max(1000).optional()
});

const couponSchema = z.object({
  codigo: z.string().min(3),
  descricao: z.string().optional(),
  tipoDesconto: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING']),
  valor: z.number().min(0),
  minimoPedido: z.number().min(0).nullable().optional(),
  usoMaximo: z.number().int().positive().nullable().optional(),
  primeiraCompra: z.boolean().optional(),
  validade: z.coerce.date().nullable().optional()
});

module.exports = {
  registerSchema, loginSchema, addressSchema, cartItemSchema, orderSchema,
  productSchema, reviewSchema, couponSchema,
  forgotSchema: z.object({ email: z.string().email() }),
  resetSchema: z.object({ token: z.string().min(1), novaSenha: senha }),
  statusSchema: z.object({
    status: z.enum(['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']),
    descricao: z.string().optional()
  }),
  cepSchema: z.object({ cep: z.string().min(8) }),
  couponCodeSchema: z.object({ codigo: z.string().min(3), subtotal: z.number().min(0).optional() }),
  quantitySchema: z.object({ quantidade: z.number().int().min(1).max(20) }),
  profileSchema: z.object({
    nome: z.string().min(3).optional(),
    telefone: z.string().min(10).optional(),
    cpf: z.string().min(11).optional()
  })
};
