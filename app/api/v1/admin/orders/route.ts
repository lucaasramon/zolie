import { orderRepo } from '@/lib/repositories/order.repo';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';
import { vendaPresencialSchema } from '@/lib/validation/schemas';
import { registrarVendaPresencial } from '@/lib/services/order.service';

export const GET = withAdmin(async req => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await orderRepo.listAll({ ...pagination, status: sp.get('status') ?? undefined });
  return ok(items, meta(total, pagination));
});

/** Registro de venda presencial — o único caminho de criação de pedido fora do checkout. */
export const POST = withAdmin(async req => {
  const body = vendaPresencialSchema.parse(await req.json());
  return created(await registrarVendaPresencial(body));
});
