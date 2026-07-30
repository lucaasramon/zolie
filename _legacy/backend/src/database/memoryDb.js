/**
 * Banco em memória. Mesmo shape das tabelas do schema.prisma, para que a troca
 * para PostgreSQL não exija mudança em services nem controllers.
 * Reinicia a cada restart do servidor — é intencional.
 */
const { randomUUID } = require('crypto');
const { slugify } = require('../utils/slug');

const CATEGORIES = [
  ['Colares', 'colares'], ['Brincos', 'brincos'], ['Anéis', 'aneis'],
  ['Pulseiras', 'pulseiras'], ['Conjuntos', 'conjuntos'], ['Piercings', 'piercings']
].map(([nome, slug], i) => ({ id: randomUUID(), nome, slug, imagem: null, ordem: i, ativa: true, createdAt: new Date() }));

const catId = slug => CATEGORIES.find(c => c.slug === slug).id;

// nome, categoria, material, preco, precoPromocional, nota, avaliacoes, estoque, destaque, lancamento, pedra, tamanhos
const RAW_PRODUCTS = [
  ['Colar Ponto de Luz Zircônia', 'colares', 'PRATA_925', 149.9, 119.9, 4.9, 214, 4, true, false, 'zirconia', ['40cm','45cm','50cm']],
  ['Colar Coração Cravejado', 'colares', 'BANHADO_OURO', 189.9, null, 4.8, 156, 18, true, false, 'zirconia', ['40cm','45cm']],
  ['Colar Choker Veneziana', 'colares', 'PRATA_925', 129.9, 99.9, 4.7, 98, 12, false, false, null, ['38cm','40cm']],
  ['Colar Gravatinha Baguete', 'colares', 'BANHADO_OURO', 219.9, null, 4.9, 63, 9, false, true, 'cristal', ['42cm','45cm']],
  ['Colar Escapulário Delicado', 'colares', 'PRATA_925', 139.9, null, 4.6, 44, 21, false, false, null, ['45cm','50cm']],
  ['Brinco Argola Texturizada', 'brincos', 'BANHADO_OURO', 99.9, 79.9, 4.8, 302, 27, true, false, null, ['Único']],
  ['Brinco Ear Cuff Cravejado', 'brincos', 'PRATA_925', 89.9, null, 4.7, 121, 15, false, true, 'zirconia', ['Único']],
  ['Brinco Gota Cristal', 'brincos', 'BANHADO_OURO', 119.9, null, 4.9, 87, 11, true, false, 'cristal', ['Único']],
  ['Brinco Ponto de Luz 4mm', 'brincos', 'PRATA_925', 69.9, 49.9, 4.9, 411, 3, true, false, 'zirconia', ['Único']],
  ['Brinco Argola Média 20mm', 'brincos', 'BANHADO_OURO', 109.9, 89.9, 4.6, 74, 19, false, false, null, ['Único']],
  ['Anel Solitário Zircônia', 'aneis', 'BANHADO_OURO', 159.9, null, 4.8, 188, 14, true, false, 'zirconia', ['14','16','18','20']],
  ['Anel Aparador Cravejado', 'aneis', 'PRATA_925', 89.9, null, 4.7, 96, 22, false, false, 'zirconia', ['14','16','18']],
  ['Anel Trilha Eternity', 'aneis', 'BANHADO_OURO', 179.9, 149.9, 4.9, 143, 5, true, true, 'zirconia', ['16','18','20']],
  ['Anel Liso Chanfrado', 'aneis', 'PRATA_925', 79.9, null, 4.5, 52, 30, false, false, null, ['16','18','20','22']],
  ['Pulseira Riviera Cravejada', 'pulseiras', 'BANHADO_OURO', 199.9, null, 4.9, 131, 8, true, false, 'zirconia', ['17cm','18cm']],
  ['Pulseira Elos Portuguesa', 'pulseiras', 'PRATA_925', 149.9, 119.9, 4.7, 88, 16, false, false, null, ['17cm','19cm']],
  ['Pulseira Berloque Coração', 'pulseiras', 'PRATA_925', 109.9, null, 4.6, 67, 24, false, true, null, ['17cm','18cm']],
  ['Bracelete Oval Liso', 'pulseiras', 'BANHADO_OURO', 169.9, null, 4.8, 41, 13, false, true, null, ['Único']],
  ['Conjunto Ponto de Luz', 'conjuntos', 'PRATA_925', 219.9, 179.9, 4.9, 176, 6, true, false, 'zirconia', ['Único']],
  ['Conjunto Gota Cristal', 'conjuntos', 'BANHADO_OURO', 279.9, null, 4.8, 59, 10, true, false, 'cristal', ['Único']],
  ['Conjunto Elos + Colar', 'conjuntos', 'BANHADO_OURO', 329.9, 259.9, 4.9, 38, 4, true, true, null, ['Único']],
  ['Piercing Fake Argolinha', 'piercings', 'BANHADO_OURO', 49.9, null, 4.5, 233, 40, false, false, null, ['Único']],
  ['Piercing Tragus Zircônia', 'piercings', 'PRATA_925', 59.9, null, 4.7, 118, 26, false, true, 'zirconia', ['Único']],
  ['Piercing Helix Cravejado', 'piercings', 'BANHADO_OURO', 64.9, 44.9, 4.8, 91, 7, true, false, 'zirconia', ['Único']]
];

const PRODUCTS = RAW_PRODUCTS.map((r, i) => {
  const [nome, cat, material, preco, promo, nota, avaliacoes, estoque, destaque, lancamento, pedra, tamanhos] = r;
  return {
    id: randomUUID(),
    sku: 'ZL-' + (1001 + i),
    nome,
    slug: slugify(nome),
    descricao: nome + ' em ' + (material === 'PRATA_925' ? 'prata 925 legítima' : 'latão com banho de ouro 18k') +
      ', acabamento polido. Leve, confortável para o uso diário e entregue em embalagem-presente Zoliê.',
    cuidados: 'Evite contato com perfume, cloro e produtos de limpeza. Guarde em saquinho individual e limpe com flanela seca.',
    preco, precoPromocional: promo, material,
    categoriaId: catId(cat),
    estoque,
    pesoGramas: 2 + (i % 5) + 0.4,
    pedra, tamanhos,
    imagens: [],
    destaque, lancamento, ativo: true,
    notaMedia: nota, totalAvaliacoes: avaliacoes,
    createdAt: new Date(Date.now() - i * 86400000),
    updatedAt: new Date()
  };
});

const COUPONS = [
  { id: randomUUID(), codigo: 'BRILHE10', descricao: '10% off na primeira compra', tipoDesconto: 'PERCENT', valor: 10, minimoPedido: null, primeiraCompra: true, usoMaximo: null, usos: 0, validade: new Date('2026-12-31'), ativo: true },
  { id: randomUUID(), codigo: 'ZOLIE20', descricao: '20% off acima de R$ 200', tipoDesconto: 'PERCENT', valor: 20, minimoPedido: 200, primeiraCompra: false, usoMaximo: 500, usos: 0, validade: new Date('2026-08-31'), ativo: true },
  { id: randomUUID(), codigo: 'FRETEGRATIS', descricao: 'Frete grátis sem mínimo', tipoDesconto: 'FREE_SHIPPING', valor: 0, minimoPedido: null, primeiraCompra: false, usoMaximo: null, usos: 0, validade: new Date('2026-09-30'), ativo: true }
];

const BANNERS = [
  { id: randomUUID(), tag: 'Coleção Luz de Inverno', titulo: 'Até 30% off em prata 925', subtitulo: 'Peças com brilho de todo dia, agora com o melhor preço do ano.', cta: 'Aproveitar ofertas', link: '/promocoes', imagem: null, ordem: 0, ativo: true },
  { id: randomUUID(), tag: 'Banho de ouro 18k', titulo: 'O dourado que não sai de moda', subtitulo: 'Camada reforçada com garantia de 1 ano.', cta: 'Ver banhados a ouro', link: '/banhado-a-ouro', imagem: null, ordem: 1, ativo: true },
  { id: randomUUID(), tag: 'Novidades da semana', titulo: 'Lançamentos para você brilhar', subtitulo: 'Estoque pequeno, escolha a sua.', cta: 'Ver lançamentos', link: '/lancamentos', imagem: null, ordem: 2, ativo: true }
];

const db = {
  users: [],
  passwordResetTokens: [],
  addresses: [],
  categories: CATEGORIES,
  products: PRODUCTS,
  productReviews: [],
  carts: [],
  cartItems: [],
  orders: [],
  orderItems: [],
  orderEvents: [],
  coupons: COUPONS,
  wishlistItems: [],
  banners: BANNERS,
  newId: () => randomUUID()
};

module.exports = { db };
