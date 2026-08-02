import { prisma } from '@/lib/prisma';

export const addressRepo = {
  listByUser: (userId: string) =>
    prisma.address.findMany({ where: { userId, deletedAt: null }, orderBy: { principal: 'desc' } }),
  /** Inclui endereços removidos: pedidos antigos precisam exibir o endereço de entrega. */
  findById: (id: string) => prisma.address.findUnique({ where: { id } }),
  /** Só endereços ativos — usado onde o cliente vai selecionar um destino. */
  findAtivoById: (id: string) => prisma.address.findFirst({ where: { id, deletedAt: null } }),
  create: async (userId: string, data: any) => {
    if (data.principal) await prisma.address.updateMany({ where: { userId }, data: { principal: false } });
    return prisma.address.create({ data: { ...data, userId } });
  },
  update: (id: string, data: any) => prisma.address.update({ where: { id }, data }),
  /**
   * Soft delete: `Order.enderecoId` aponta para cá, então apagar de verdade
   * quebraria o histórico do pedido (ou falharia na FK).
   */
  remove: (id: string) =>
    prisma.address.update({ where: { id }, data: { deletedAt: new Date(), principal: false } }).then(() => true),
};
