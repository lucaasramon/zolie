import Image from 'next/image';
import Link from 'next/link';
import { DIAS_PREPARO } from '@/lib/utils/prazoEntrega';

export interface FotoPersonalizado {
  id: string;
  url: string;
  legenda: string;
  slug: string;
  /** Foto enviada por cliente numa avaliação (e não foto do anúncio). */
  daCliente: boolean;
}

const PASSOS = [
  { titulo: 'Escolha a peça', texto: 'Escolha o modelo e envie a foto, o nome ou a data que você quer gravar.' },
  { titulo: 'Veja antes de pagar', texto: 'Nossa simulação com IA mostra a frente e o verso da sua peça já gravada.' },
  { titulo: 'Receba em casa', texto: `Gravamos sua peça e postamos em até ${DIAS_PREPARO.personalizado} dias úteis, com rastreio.` },
];

/**
 * Abertura da página de Personalizados: primeiro o resultado (peças já
 * gravadas, de preferência fotos de clientes), depois o caminho até ele.
 * Ver o fim antes do começo dá vontade de entender como se chega lá.
 */
export function PersonalizadosIntro({ fotos }: { fotos: FotoPersonalizado[] }) {
  const deClientes = fotos.length > 0 && fotos.every(f => f.daCliente);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-gold-soft/50 bg-gradient-to-b from-gold/10 via-white to-white shadow-xs">
      {fotos.length > 0 && (
        <div className="flex flex-col gap-3 px-5 pt-6 sm:px-7">
          <div className="flex flex-col gap-1">
            <span className="z-eyebrow !text-[10px]">{deClientes ? 'Fotos de clientes' : 'Peças já gravadas'}</span>
            <h2 className="z-title text-2xl sm:text-[28px]">Imagine a sua assim</h2>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-7 sm:px-7">
            {fotos.map((f, i) => (
              <Link
                key={f.id}
                href={`/produtos/${f.slug}`}
                className="group relative aspect-square w-36 flex-none snap-start overflow-hidden rounded-xl bg-bg-alt ring-1 ring-border-subtle sm:w-44"
              >
                <Image
                  src={f.url}
                  alt={f.legenda}
                  fill
                  sizes="(min-width: 640px) 176px, 144px"
                  priority={i < 2}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/75 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-white">
                  {f.legenda}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pb-6 pt-5 sm:px-7">
        <span className="z-eyebrow !text-[10px]">Como funciona</span>
        <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 rounded-xl border border-border-subtle bg-white/80 p-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gold font-serif text-base font-semibold text-ink">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">{p.titulo}</span>
                <span className="text-xs leading-relaxed text-ink-muted">{p.texto}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
