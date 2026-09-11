import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Remove os cupons antigos de frete grátis (substituídos pelo FRETEGRATIS) e
// garante a existência do cupom FRETEGRATIS: sem pedido mínimo, uso ilimitado.
async function main() {
  const removidos = await prisma.coupon.deleteMany({
    where: { codigo: { in: ['FRETEZERO', 'SEMFRETE'] } },
  });
  console.log(`Cupons removidos: ${removidos.count}`);

  const existente = await prisma.coupon.findUnique({ where: { codigo: 'FRETEGRATIS' } });
  if (existente) {
    console.log('Cupom FRETEGRATIS já existe, nada a fazer.');
    return;
  }

  const criado = await prisma.coupon.create({
    data: {
      codigo: 'FRETEGRATIS',
      descricao: 'Frete grátis',
      tipoDesconto: 'FREE_SHIPPING',
      valor: 0,
      minimoPedido: null,
      usoMaximo: null,
      restricaoCompra: null,
      ativo: true,
    },
  });
  console.log('Cupom criado:', criado.codigo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
