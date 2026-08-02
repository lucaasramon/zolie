import { comprarEtiqueta, sincronizarRastreio } from '@/lib/services/melhorEnvio/label.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

/** Compra a etiqueta do pedido — debita saldo da carteira Melhor Envio. */
export const POST = withAdmin(async (_req, ctx) => {
  const { id } = await ctx.params;
  return ok(await comprarEtiqueta(id));
});

/** Força a busca do rastreio de uma etiqueta já comprada, sem esperar o cron. */
export const PATCH = withAdmin(async (_req, ctx) => {
  const { id } = await ctx.params;
  const codigoRastreio = await sincronizarRastreio(id);
  return ok({ codigoRastreio, pendente: codigoRastreio === null });
});
