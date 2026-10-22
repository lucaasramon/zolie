import { orderRepo } from '@/lib/repositories/order.repo';
import { wishlistRepo } from '@/lib/repositories/wishlist.repo';

/** Abaixo disso o número mais afasta do que convence ("1 vendida"), então não aparece. */
const MINIMO_PARA_EXIBIR = 3;
const JANELA_VENDAS_DIAS = 30;

/**
 * Prova social com números reais: unidades vendidas nos últimos 30 dias e
 * quantas pessoas guardaram a peça nos favoritos. A página do produto é
 * revalidada a cada 5 minutos, então os números acompanham as vendas.
 */
export async function ProductSocialProof({ productId }: { productId: string }) {
  const [vendidas, favoritos] = await Promise.all([
    orderRepo.unidadesVendidasUltimosDias(productId, JANELA_VENDAS_DIAS).catch(() => 0),
    wishlistRepo.countByProduct(productId).catch(() => 0),
  ]);

  const mostrarVendas = vendidas >= MINIMO_PARA_EXIBIR;
  const mostrarFavoritos = favoritos >= MINIMO_PARA_EXIBIR;
  if (!mostrarVendas && !mostrarFavoritos) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-tertiary">
      {mostrarVendas && (
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-gold-text" aria-hidden="true">
            <path d="M6 8h12l-1 12H7L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span>
            <strong className="font-medium text-ink">{vendidas}</strong> vendidas nos últimos {JANELA_VENDAS_DIAS} dias
          </span>
        </span>
      )}
      {mostrarFavoritos && (
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-gold-text" aria-hidden="true">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
          </svg>
          <span>
            <strong className="font-medium text-ink">{favoritos}</strong> pessoas guardaram nos favoritos
          </span>
        </span>
      )}
    </div>
  );
}
