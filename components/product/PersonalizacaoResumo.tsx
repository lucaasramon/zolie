import { lerPersonalizacao, resumoPersonalizacao } from '@/lib/personalizacao';

/**
 * Escolhas de personalização de um item (sacola, pedido, admin). Aceita o JSON
 * cru do banco; item sem personalização (ou com JSON inválido) não renderiza nada.
 * `comImagens` mostra as miniaturas com link para o arquivo original — útil no
 * admin, onde a peça é produzida a partir delas.
 */
export function PersonalizacaoResumo({ valor, comImagens = false }: { valor: unknown; comImagens?: boolean }) {
  const p = lerPersonalizacao(valor);
  if (!p) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1 rounded-lg bg-bg-alt px-3 py-2 text-xs text-ink-muted">
      <span className="font-medium uppercase tracking-wide text-gold-text">Personalização</span>
      {resumoPersonalizacao(p).map(l => (
        <span key={l.rotulo}>
          <span className="text-ink-tertiary">{l.rotulo}:</span> {l.valor}
        </span>
      ))}
      {comImagens && p.imagens.length > 0 && (
        <div className="mt-1 flex gap-2">
          {p.imagens.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" title={`Abrir imagem ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- arquivo enviado pela cliente, exibido no tamanho original */}
              <img src={url} alt={`Imagem ${i + 1} da personalização`} className="h-16 w-16 rounded-md object-cover ring-1 ring-border-subtle" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
