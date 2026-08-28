import { readFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { storage } from '../../lib/storage';

const prisma = new PrismaClient();

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'produtos');

interface NovoAnel {
  arquivo: string;
  nome: string;
  descricao: string;
  cuidados: string;
  precoCusto: number;
  estoque: number;
  tamanhos: string[];
}

// Preço de venda = custo + 150% de markup (custo x 2,5).
const MARKUP = 2.5;

const ANEIS: NovoAnel[] = [
  {
    arquivo: '26_reais.jpeg',
    nome: 'Anel Prata Solitário Zircônia Aro Fino',
    descricao:
      'Anel folheado a prata com aro fino e zircônia central cravejada, ladeada por zircônias menores em meia aliança. Peça delicada e atemporal, perfeita para uso diário ou para compor looks mais elaborados.',
    cuidados: 'Evite contato com água, perfume e produtos de limpeza. Guarde em local seco, longe da luz e do calor.',
    precoCusto: 26,
    estoque: 1,
    tamanhos: ['16'],
  },
  {
    arquivo: '34_reais.png',
    nome: 'Anel Prata Solitário Zircônia Cristal',
    descricao:
      'Anel folheado a prata com zircônia central em lapidação redonda, presa em garras clássicas. Design minimalista que valoriza o brilho da pedra, ideal para o dia a dia ou ocasiões especiais.',
    cuidados: 'Evite contato com água, perfume e produtos de limpeza. Guarde em local seco, longe da luz e do calor.',
    precoCusto: 34,
    estoque: 2,
    tamanhos: ['16', '18'],
  },
  {
    arquivo: '33_reais.png',
    nome: 'Anel Prata Aro Trevo Cravejado',
    descricao:
      'Anel folheado a prata com aro fino ajustável e detalhe de trevo vazado cravejado em zircônias. Toque delicado e romântico para usar sozinho ou combinado com outros anéis.',
    cuidados: 'Evite contato com água, perfume e produtos de limpeza. Guarde em local seco, longe da luz e do calor.',
    precoCusto: 33,
    estoque: 1,
    tamanhos: ['18'],
  },
];

function slugify(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(nome: string): Promise<string> {
  const base = slugify(nome);
  let slug = base;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function main() {
  const categoria = await prisma.category.findUnique({ where: { slug: 'aneis' } });
  if (!categoria) throw new Error('Categoria "aneis" não encontrada. Rode o seed principal antes.');

  for (const anel of ANEIS) {
    const caminho = path.join(IMAGES_DIR, anel.arquivo);
    const bytes = await readFile(caminho);
    const ext = path.extname(anel.arquivo);
    const nomeArquivoBlob = `produtos/${slugify(anel.nome)}${ext}`;

    const { url } = await storage.save(nomeArquivoBlob, bytes);

    const preco = Math.round(anel.precoCusto * MARKUP * 100) / 100;
    const slug = await uniqueSlug(anel.nome);

    const produto = await prisma.product.create({
      data: {
        nome: anel.nome,
        slug,
        descricao: anel.descricao,
        cuidados: anel.cuidados,
        preco,
        precoCusto: anel.precoCusto,
        material: 'PRATA_925',
        categoriaId: categoria.id,
        estoque: anel.estoque,
        pedra: 'zirconia',
        tamanhos: anel.tamanhos,
        imagens: [url],
        ativo: true,
      },
    });

    console.log(`Criado: ${produto.nome} (slug: ${produto.slug}) — custo R$${anel.precoCusto} -> venda R$${preco} — imagem: ${url}`);
  }

  console.log('Concluído.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
