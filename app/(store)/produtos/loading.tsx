import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton';

/**
 * Reproduz a estrutura da listagem (trilha, título + contagem, grade) com as
 * mesmas alturas e espaçamentos da página. Sem o bloco do título, a grade subia
 * e depois era empurrada para baixo quando o conteúdo chegava — um "pulo" de
 * layout (CLS) bem na primeira tela de quem vem dos anúncios.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <Skeleton className="mb-2 h-4 w-40" />
      <div className="mb-7 flex flex-col gap-1">
        <Skeleton className="h-10 w-56 sm:h-11" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-[240px] flex-none lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
