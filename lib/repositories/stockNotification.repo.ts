import { prisma } from '@/lib/prisma';

export const stockNotificationRepo = {
  /** Cria o pedido de aviso, ou não faz nada se este e-mail já está na lista deste produto. */
  create: (productId: string, email: string) =>
    prisma.stockNotification.upsert({
      where: { productId_email: { productId, email } },
      update: {},
      create: { productId, email },
    }),
  /** Pedidos ainda não notificados de um produto — usados quando o estoque é reposto. */
  listPendentesByProduct: (productId: string) =>
    prisma.stockNotification.findMany({ where: { productId, notificadoEm: null } }),
  marcarNotificados: (ids: string[]) =>
    prisma.stockNotification.updateMany({ where: { id: { in: ids } }, data: { notificadoEm: new Date() } }),
  /** Lista para a tela /admin — agrupada por produto, só os aguardando reposição. */
  listPendentesAgrupado: async () => {
    const rows = await prisma.stockNotification.findMany({
      where: { notificadoEm: null },
      include: { product: { select: { id: true, nome: true, slug: true, estoque: true, imagens: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const porProduto = new Map<string, { product: (typeof rows)[number]['product']; pedidos: typeof rows }>();
    for (const row of rows) {
      const atual = porProduto.get(row.productId);
      if (atual) atual.pedidos.push(row);
      else porProduto.set(row.productId, { product: row.product, pedidos: [row] });
    }
    return Array.from(porProduto.values()).sort((a, b) => b.pedidos.length - a.pedidos.length);
  },
};
