'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';

interface Produto {
  id: string;
  nome: string;
  sku: string | null;
  estoque: number;
  preco: number;
}

interface Linha {
  productId: string;
  quantidade: number;
  /** Vazio = usar o preço de catálogo. Preenchido = preço combinado na hora. */
  precoUnitario: string;
}

const PAGAMENTOS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX_PRESENCIAL', label: 'Pix (na hora)' },
  { value: 'DEBITO_MAQUININHA', label: 'Débito (maquininha)' },
  { value: 'CREDITO_MAQUININHA', label: 'Crédito (maquininha)' },
];

export function VendaPresencialForm({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [busca, setBusca] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
  const [desconto, setDesconto] = useState('');
  const [compradorNome, setCompradorNome] = useState('');
  const [observacao, setObservacao] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const porId = useMemo(() => new Map(produtos.map(p => [p.id, p])), [produtos]);

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return produtos
      .filter(p => p.nome.toLowerCase().includes(termo) || (p.sku || '').toLowerCase().includes(termo))
      .slice(0, 8);
  }, [busca, produtos]);

  function adicionar(p: Produto) {
    setBusca('');
    setLinhas(ls => {
      // Escolher a mesma peça de novo soma na linha existente, em vez de criar
      // uma linha duplicada que o vendedor teria de somar de cabeça.
      const existente = ls.find(l => l.productId === p.id);
      if (existente) {
        return ls.map(l => (l.productId === p.id ? { ...l, quantidade: l.quantidade + 1 } : l));
      }
      return [...ls, { productId: p.id, quantidade: 1, precoUnitario: '' }];
    });
  }

  function atualizar(productId: string, patch: Partial<Linha>) {
    setLinhas(ls => ls.map(l => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  function remover(productId: string) {
    setLinhas(ls => ls.filter(l => l.productId !== productId));
  }

  const subtotal = linhas.reduce((acc, l) => {
    const p = porId.get(l.productId);
    if (!p) return acc;
    const preco = l.precoUnitario === '' ? p.preco : Number(l.precoUnitario) || 0;
    return acc + preco * l.quantidade;
  }, 0);
  const descontoNum = Math.min(Number(desconto) || 0, subtotal);
  const total = subtotal - descontoNum;

  // Impede registrar uma venda que o estoque não cobre — o servidor também
  // recusa, mas avisar aqui evita perder o formulário preenchido.
  const linhaSemEstoque = linhas.find(l => {
    const p = porId.get(l.productId);
    return p && l.quantidade > p.estoque;
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const pedido = await api.post<{ id: string; numero: string }>('/admin/orders', {
        items: linhas.map(l => ({
          productId: l.productId,
          quantidade: l.quantidade,
          precoUnitario: l.precoUnitario === '' ? null : Number(l.precoUnitario),
        })),
        formaPagamento,
        desconto: descontoNum || undefined,
        compradorNome: compradorNome.trim() || undefined,
        observacao: observacao.trim() || undefined,
        // O <input type="datetime-local"> devolve hora local sem fuso; o schema
        // espera ISO completo, então convertemos antes de enviar.
        data: data ? new Date(data).toISOString() : undefined,
      });
      setSucesso(`Venda ${pedido.data.numero} registrada.`);
      setLinhas([]);
      setDesconto('');
      setCompradorNome('');
      setObservacao('');
      setData('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar a venda');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Registrar venda presencial</h1>
        <p className="text-sm text-ink-tertiary">
          Para vendas feitas pessoalmente. O estoque é baixado normalmente, e o pedido entra já como entregue e pago.
        </p>
      </div>

      {erro && <p className="rounded-md bg-danger-bg px-4 py-2.5 text-sm text-danger">{erro}</p>}
      {sucesso && <p className="rounded-md bg-success-bg px-4 py-2.5 text-sm text-success">{sucesso}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
            <h2 className="font-sans text-lg font-semibold text-ink">Peças vendidas</h2>

            <div className="relative">
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar peça por nome ou SKU..."
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
              />
              {resultados.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border-subtle bg-white shadow-lg">
                  {resultados.map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => adicionar(p)}
                        disabled={p.estoque === 0}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-hoverbg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-ink">{p.nome}</span>
                        <span className="flex-none text-xs text-ink-tertiary">
                          {p.estoque === 0 ? 'sem estoque' : `${p.estoque} em estoque`} · {brl(p.preco)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {linhas.length === 0 ? (
              <p className="rounded-md border border-dashed border-border-soft py-8 text-center text-sm text-ink-tertiary">
                Nenhuma peça adicionada ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {linhas.map(l => {
                  const p = porId.get(l.productId);
                  if (!p) return null;
                  const excede = l.quantidade > p.estoque;
                  return (
                    <div key={l.productId} className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-ink">{p.nome}</div>
                        <div className="text-xs text-ink-tertiary">
                          {p.estoque} em estoque · catálogo {brl(p.preco)}
                          {excede && <span className="ml-1.5 text-danger">estoque insuficiente</span>}
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                        Qtd
                        <input
                          type="number"
                          min={1}
                          value={l.quantidade}
                          onChange={e => atualizar(l.productId, { quantidade: Math.max(1, Number(e.target.value) || 1) })}
                          className={`w-16 rounded-md border px-2 py-1.5 text-sm outline-none transition-colors focus:border-gold ${excede ? 'border-danger' : 'border-border-subtle'}`}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                        Preço
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.precoUnitario}
                          onChange={e => atualizar(l.productId, { precoUnitario: e.target.value })}
                          placeholder={String(p.preco)}
                          className="w-24 rounded-md border border-border-subtle px-2 py-1.5 text-sm outline-none transition-colors focus:border-gold"
                        />
                      </label>
                      <button type="button" onClick={() => remover(l.productId)} className="text-xs text-danger hover:underline">
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
            <h2 className="font-sans text-lg font-semibold text-ink">Sobre a venda</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-ink-muted">Nome do comprador (opcional)</span>
                <input
                  value={compradorNome}
                  onChange={e => setCompradorNome(e.target.value)}
                  placeholder="Ex.: Maria da feira"
                  className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-ink-muted">Data da venda (vazio = agora)</span>
                <input
                  type="datetime-local"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-muted">Observação (opcional, só você vê)</span>
              <input
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Ex.: feira de artesanato do centro"
                className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold"
              />
            </label>
          </div>
        </div>

        <div className="flex h-fit flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
          <h2 className="font-sans text-lg font-semibold text-ink">Pagamento</h2>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Como foi pago</span>
            <select
              value={formaPagamento}
              onChange={e => setFormaPagamento(e.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold"
            >
              {PAGAMENTOS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Desconto dado (R$)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={desconto}
              onChange={e => setDesconto(e.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold"
            />
          </label>

          <div className="mt-1 flex flex-col gap-1.5 border-t border-border-subtle pt-3 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            {descontoNum > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Desconto</span>
                <span>-{brl(descontoNum)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{brl(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando || linhas.length === 0 || Boolean(linhaSemEstoque)}
            className="mt-1 rounded-full bg-gold py-2.5 text-xs font-medium uppercase tracking-wider text-ink transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? 'Registrando...' : 'Registrar venda'}
          </button>
          {linhaSemEstoque && (
            <p className="text-center text-xs text-danger">Ajuste as quantidades: há peça acima do estoque.</p>
          )}
        </div>
      </div>
    </form>
  );
}
