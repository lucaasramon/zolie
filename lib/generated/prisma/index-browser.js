
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  nome: 'nome',
  email: 'email',
  senhaHash: 'senhaHash',
  telefone: 'telefone',
  cpf: 'cpf',
  role: 'role',
  emailVerified: 'emailVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  apelido: 'apelido',
  cep: 'cep',
  rua: 'rua',
  numero: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  cidade: 'cidade',
  estado: 'estado',
  principal: 'principal',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  nome: 'nome',
  slug: 'slug',
  imagem: 'imagem',
  ordem: 'ordem',
  ativa: 'ativa',
  createdAt: 'createdAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  nome: 'nome',
  slug: 'slug',
  descricao: 'descricao',
  cuidados: 'cuidados',
  preco: 'preco',
  precoPromocional: 'precoPromocional',
  material: 'material',
  categoriaId: 'categoriaId',
  estoque: 'estoque',
  pesoGramas: 'pesoGramas',
  pedra: 'pedra',
  tamanhos: 'tamanhos',
  imagens: 'imagens',
  destaque: 'destaque',
  lancamento: 'lancamento',
  ativo: 'ativo',
  notaMedia: 'notaMedia',
  totalAvaliacoes: 'totalAvaliacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductReviewScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  userId: 'userId',
  nota: 'nota',
  titulo: 'titulo',
  comentario: 'comentario',
  aprovado: 'aprovado',
  createdAt: 'createdAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  quantidade: 'quantidade',
  tamanho: 'tamanho',
  acabamento: 'acabamento'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  numero: 'numero',
  userId: 'userId',
  enderecoId: 'enderecoId',
  status: 'status',
  formaPagamento: 'formaPagamento',
  parcelas: 'parcelas',
  subtotal: 'subtotal',
  frete: 'frete',
  desconto: 'desconto',
  total: 'total',
  cupomCodigo: 'cupomCodigo',
  transportadora: 'transportadora',
  codigoRastreio: 'codigoRastreio',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  nomeProduto: 'nomeProduto',
  precoUnitario: 'precoUnitario',
  quantidade: 'quantidade',
  tamanho: 'tamanho',
  acabamento: 'acabamento',
  subtotal: 'subtotal'
};

exports.Prisma.OrderEventScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  status: 'status',
  descricao: 'descricao',
  createdAt: 'createdAt'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  codigo: 'codigo',
  descricao: 'descricao',
  tipoDesconto: 'tipoDesconto',
  valor: 'valor',
  minimoPedido: 'minimoPedido',
  usoMaximo: 'usoMaximo',
  usos: 'usos',
  primeiraCompra: 'primeiraCompra',
  validade: 'validade',
  ativo: 'ativo',
  createdAt: 'createdAt'
};

exports.Prisma.WishlistItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  productId: 'productId',
  createdAt: 'createdAt'
};

exports.Prisma.BannerScalarFieldEnum = {
  id: 'id',
  titulo: 'titulo',
  subtitulo: 'subtitulo',
  tag: 'tag',
  cta: 'cta',
  link: 'link',
  imagem: 'imagem',
  ordem: 'ordem',
  ativo: 'ativo',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN'
};

exports.Material = exports.$Enums.Material = {
  PRATA_925: 'PRATA_925',
  BANHADO_OURO: 'BANHADO_OURO'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  AGUARDANDO_PAGAMENTO: 'AGUARDANDO_PAGAMENTO',
  PROCESSANDO: 'PROCESSANDO',
  SEPARANDO: 'SEPARANDO',
  ENVIADO: 'ENVIADO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  PIX: 'PIX',
  BOLETO: 'BOLETO'
};

exports.DiscountType = exports.$Enums.DiscountType = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED',
  FREE_SHIPPING: 'FREE_SHIPPING'
};

exports.Prisma.ModelName = {
  User: 'User',
  PasswordResetToken: 'PasswordResetToken',
  Address: 'Address',
  Category: 'Category',
  Product: 'Product',
  ProductReview: 'ProductReview',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Order: 'Order',
  OrderItem: 'OrderItem',
  OrderEvent: 'OrderEvent',
  Coupon: 'Coupon',
  WishlistItem: 'WishlistItem',
  Banner: 'Banner'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
