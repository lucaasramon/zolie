import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define estoque = 1 em todos os produtos, exceto os que têm "porta joia"
// no nome (esses mantêm o estoque atual).
async function main() {
  const result = await prisma.product.updateMany({
    where: {
      NOT: {
        nome: { contains: 'porta joia', mode: 'insensitive' },
      },
    },
    data: { estoque: 1 },
  });

  console.log(`Estoque atualizado para 1 em ${result.count} produto(s).`);

  const mantidos = await prisma.product.findMany({
    where: { nome: { contains: 'porta joia', mode: 'insensitive' } },
    select: { nome: true, estoque: true },
  });

  if (mantidos.length > 0) {
    console.log('\nProdutos preservados (estoque não alterado):');
    for (const p of mantidos) {
      console.log(`- ${p.nome}: estoque atual = ${p.estoque}`);
    }
  } else {
    console.log('\nNenhum produto com "porta joia" no nome foi encontrado.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
