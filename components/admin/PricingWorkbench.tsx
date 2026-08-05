'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { calcularPreco } from '@/lib/pricing-calc';

type SupplyCategoria = 'EMBALAGEM' | 'BRINDE';

interface Supply {
  id: string;
  nome: string;
  valorPago: number;
  quantidadeLote: number;
  custoUnitario: number;
  categoria: SupplyCategoria;
  ativo: boolean;
}

interface Produto {
  id: string;
  nome: string;
  imagem: string | null;
  material: 'PRATA_925' | 'BANHADO_OURO';
  preco: number;
  custoSemijoia: number | null;
  custoEmbalagem: number | null;
  margemDesejada: number | null;
  supplyIds: string[];
}

export function PricingWorkbench({ produtos, insumosIniciais }: { produtos: Produto[]; insumosIniciais: Supply[] }) {
  const [insumos, setInsumos] = useState<Supply[]>(insumosIniciais);
  const [produtoId, setProdutoId] = useState<string>(produtos[0]?.id ?? '');
  const produto = produtos.find(p => p.id === produtoId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <SupplyPanel insumos={insumos} setInsumos={setInsumos} />

      {produto ? (
        <ProductCalculator
          key={produto.id}
          produto={produto}
          produtos={produtos}
          insumos={insumos}
          onSelectProduto={setProdutoId}
        />
      ) : (
        <div className="rounded-xl bg-white p-5 text-sm text-ink-tertiary shadow-xs">
          Nenhum produto ativo para precificar ainda.
        </div>
      )}
    </div>
  );
}

// ---------- Painel de insumos ----------

const EMPTY_SUPPLY = { nome: '', valorPago: '', quantidadeLote: '', categoria: 'EMBALAGEM' as SupplyCategoria };

function SupplyPanel({ insumos, setInsumos }: { insumos: Supply[]; setInsumos: (v: Supply[]) => void }) {
  const [form, setForm] = useState(EMPTY_SUPPLY);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const router = useRouter();

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const valorPago = Number(form.valorPago);
    const quantidadeLote = Number(form.quantidadeLote);
    if (!form.nome || !valorPago || !quantidadeLote) {
      setErro('Preencha nome, valor pago e quantidade do lote.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<Supply>('/admin/supplies', {
        nome: form.nome,
        valorPago,
        quantidadeLote,
        categoria: form.categoria,
      });
      setInsumos([data, ...insumos]);
      setForm(EMPTY_SUPPLY);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o insumo');
    } finally {
      setLoading(false);
    }
  }

  async function alternarAtivo(s: Supply) {
    const { data } = await api.put<Supply>(`/admin/supplies/${s.id}`, { ativo: !s.ativo });
    setInsumos(insumos.map(i => (i.id === s.id ? data : i)));
    router.refresh();
  }

  function salvarEdicao(atualizado: Supply) {
    setInsumos(insumos.map(i => (i.id === atualizado.id ? atualizado : i)));
    setEditandoId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="overflow-x-auto rounded-xl bg-white shadow-xs lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Insumo</th>
              <th className="px-4 py-3">Valor pago</th>
              <th className="px-4 py-3">Lote</th>
              <th className="px-4 py-3">Custo unit.</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map(s =>
              editandoId === s.id ? (
                <SupplyEditRow key={s.id} supply={s} onCancel={() => setEditandoId(null)} onSaved={salvarEdicao} />
              ) : (
                <tr key={s.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-medium text-ink">{s.nome}</td>
                  <td className="px-4 py-3 text-ink-muted">{brl(s.valorPago)}</td>
                  <td className="px-4 py-3 text-ink-muted">{s.quantidadeLote}</td>
                  <td className="px-4 py-3 text-gold-text">{brl(s.custoUnitario)}/un</td>
                  <td className="px-4 py-3 text-ink-muted">{s.categoria === 'BRINDE' ? 'Brinde' : 'Embalagem'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${s.ativo ? 'bg-success-bg text-success' : 'bg-hoverbg text-ink-tertiary'}`}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <button type="button" onClick={() => setEditandoId(s.id)} className="text-ink-muted hover:text-gold-text">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(s)} className="text-ink-muted hover:text-gold-text">
                        {s.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {insumos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-tertiary">Nenhum insumo cadastrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={criar} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Novo insumo</h2>
        <p className="text-xs text-ink-tertiary">Ex.: &quot;50 sacolas de papel por R$71,00&quot; → nome &quot;Sacola de papel&quot;, valor 71,00, lote 50.</p>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Nome</span>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Valor pago (R$)</span>
            <input type="number" step="0.01" value={form.valorPago} onChange={e => setForm(f => ({ ...f, valorPago: e.target.value }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Qtd. no lote</span>
            <input type="number" value={form.quantidadeLote} onChange={e => setForm(f => ({ ...f, quantidadeLote: e.target.value }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Tipo</span>
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as SupplyCategoria }))} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
            <option value="EMBALAGEM">Embalagem / material de uso</option>
            <option value="BRINDE">Brinde</option>
          </select>
        </label>
        <button type="submit" disabled={loading} className="rounded-full bg-gold py-2.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
          Adicionar insumo
        </button>
      </form>
    </div>
  );
}

function SupplyEditRow({ supply, onCancel, onSaved }: { supply: Supply; onCancel: () => void; onSaved: (s: Supply) => void }) {
  const [nome, setNome] = useState(supply.nome);
  const [valorPago, setValorPago] = useState(String(supply.valorPago));
  const [quantidadeLote, setQuantidadeLote] = useState(String(supply.quantidadeLote));
  const [categoria, setCategoria] = useState<SupplyCategoria>(supply.categoria);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function salvar() {
    setErro('');
    const valor = Number(valorPago);
    const lote = Number(quantidadeLote);
    if (!nome || !valor || !lote) {
      setErro('Preencha nome, valor pago e quantidade do lote.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.put<Supply>(`/admin/supplies/${supply.id}`, { nome, valorPago: valor, quantidadeLote: lote, categoria });
      onSaved(data);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar o insumo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-t border-border-subtle bg-hoverbg/60">
      <td className="px-4 py-3">
        <input value={nome} onChange={e => setNome(e.target.value)} className="w-32 rounded-md border border-border-subtle px-2 py-1.5 outline-none transition-colors focus:border-gold" />
      </td>
      <td className="px-4 py-3">
        <input type="number" step="0.01" value={valorPago} onChange={e => setValorPago(e.target.value)} className="w-24 rounded-md border border-border-subtle px-2 py-1.5 outline-none transition-colors focus:border-gold" />
      </td>
      <td className="px-4 py-3">
        <input type="number" value={quantidadeLote} onChange={e => setQuantidadeLote(e.target.value)} className="w-16 rounded-md border border-border-subtle px-2 py-1.5 outline-none transition-colors focus:border-gold" />
      </td>
      <td className="px-4 py-3 text-gold-text">
        {valorPago && quantidadeLote ? brl(Number(valorPago) / Number(quantidadeLote)) : '—'}/un
      </td>
      <td className="px-4 py-3">
        <select value={categoria} onChange={e => setCategoria(e.target.value as SupplyCategoria)} className="rounded-md border border-border-subtle px-2 py-1.5 outline-none transition-colors focus:border-gold">
          <option value="EMBALAGEM">Embalagem</option>
          <option value="BRINDE">Brinde</option>
        </select>
      </td>
      <td className="px-4 py-3 text-ink-tertiary">—</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {erro && <p className="text-xs text-danger">{erro}</p>}
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={salvar} disabled={loading} className="text-gold-text hover:underline disabled:opacity-50">Salvar</button>
            <button type="button" onClick={onCancel} className="text-ink-muted hover:underline">Cancelar</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------- Calculadora por produto ----------

function ProductCalculator({
  produto,
  produtos,
  insumos,
  onSelectProduto,
}: {
  produto: Produto;
  produtos: Produto[];
  insumos: Supply[];
  onSelectProduto: (id: string) => void;
}) {
  const embalagens = insumos.filter(s => s.categoria === 'EMBALAGEM' && s.ativo);
  const brindes = insumos.filter(s => s.categoria === 'BRINDE' && s.ativo);

  const [custoSemijoia, setCustoSemijoia] = useState(String(produto.custoSemijoia ?? ''));
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(produto.supplyIds));
  const [manual, setManual] = useState(produto.custoEmbalagem != null);
  const [custoEmbalagemManual, setCustoEmbalagemManual] = useState(String(produto.custoEmbalagem ?? ''));
  const [markup, setMarkup] = useState(String(produto.margemDesejada ?? 100));
  const [brindeId, setBrindeId] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const router = useRouter();

  const custoEmbalagemCalculado = useMemo(
    () => embalagens.filter(s => selecionados.has(s.id)).reduce((acc, s) => acc + s.custoUnitario, 0),
    [embalagens, selecionados],
  );

  const custoEmbalagemEfetivo = manual ? Number(custoEmbalagemManual) || 0 : custoEmbalagemCalculado;

  const resultado = calcularPreco({
    custoSemijoia: Number(custoSemijoia) || 0,
    custoEmbalagem: custoEmbalagemEfetivo,
    markupPercent: Number(markup) || 0,
  });

  const brindeEscolhido = brindes.find(b => b.id === brindeId);
  const resultadoComBrinde = brindeEscolhido
    ? calcularPreco({
        custoSemijoia: Number(custoSemijoia) || 0,
        custoEmbalagem: custoEmbalagemEfetivo + brindeEscolhido.custoUnitario,
        markupPercent: Number(markup) || 0,
      })
    : null;

  function toggleInsumo(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function salvar() {
    setErro('');
    setLoading(true);
    try {
      await api.put(`/admin/products/${produto.id}/pricing`, {
        custoSemijoia: Number(custoSemijoia) || 0,
        custoEmbalagem: manual ? Number(custoEmbalagemManual) || 0 : null,
        margemDesejada: Number(markup) || 0,
        supplyIds: Array.from(selecionados),
      });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a precificação');
    } finally {
      setLoading(false);
    }
  }

  async function aplicarComoPreco() {
    setErro('');
    setAplicando(true);
    try {
      await api.put(`/products/${produto.id}`, { preco: resultado.precoSugerido });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível atualizar o preço de venda');
    } finally {
      setAplicando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs lg:col-span-1">
        <h2 className="font-sans text-lg font-semibold text-ink">Produtos</h2>
        <div className="flex max-h-[560px] flex-col gap-1 overflow-y-auto">
          {produtos.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProduto(p.id)}
              className={`flex items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors ${p.id === produto.id ? 'bg-hoverbg' : 'hover:bg-hoverbg'}`}
            >
              <span className="img-placeholder relative h-10 w-10 flex-none overflow-hidden rounded-md">
                {p.imagem && <Image src={p.imagem} alt={p.nome} fill sizes="40px" className="object-cover" />}
              </span>
              <span className="flex flex-col">
                <span className="text-ink">{p.nome}</span>
                <span className="text-xs text-ink-tertiary">{p.material === 'PRATA_925' ? 'Prata 925' : 'Banhado a ouro'} · {brl(p.preco)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        {erro && <p className="text-sm text-danger">{erro}</p>}

        <Section title={`Custos — ${produto.nome}`}>
          <Field label="Custo da semijoia (R$)" type="number" value={custoSemijoia} onChange={setCustoSemijoia} />

          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Insumos de embalagem usados nesta peça</span>
            <div className="flex flex-col gap-1.5 rounded-md border border-border-subtle p-3">
              {embalagens.length === 0 && <p className="text-xs text-ink-tertiary">Nenhum insumo de embalagem ativo cadastrado.</p>}
              {embalagens.map(s => (
                <label key={s.id} className="flex items-center justify-between gap-2 text-sm text-ink-muted">
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={selecionados.has(s.id)} onChange={() => toggleInsumo(s.id)} disabled={manual} />
                    {s.nome}
                  </span>
                  <span className="text-xs text-ink-tertiary">{brl(s.custoUnitario)}/un</span>
                </label>
              ))}
            </div>
          </div>

          <Checkbox label="Definir custo de embalagem manualmente (em vez de somar os insumos marcados)" checked={manual} onChange={setManual} />
          {manual ? (
            <Field label="Custo de embalagem (R$)" type="number" value={custoEmbalagemManual} onChange={setCustoEmbalagemManual} />
          ) : (
            <div className="rounded-lg bg-hoverbg p-3 text-sm text-ink-muted">
              Custo de embalagem calculado: <span className="text-ink">{brl(custoEmbalagemCalculado)}</span>
            </div>
          )}

          <Field label="Markup sobre o custo (%)" type="number" value={markup} onChange={setMarkup} />
          <p className="-mt-2 text-xs text-ink-tertiary">
            Ex.: 200% multiplica o custo por 3 (custo {brl(resultado.custoTotal)} → preço {brl(resultado.precoSugerido)}).
          </p>
        </Section>

        <div className="rounded-xl bg-success-bg p-5 shadow-xs">
          <h2 className="font-sans text-lg font-semibold text-ink">Resultado</h2>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-ink-tertiary">Custo total</div>
              <div className="text-lg text-ink">{brl(resultado.custoTotal)}</div>
            </div>
            <div>
              <div className="text-ink-tertiary">Preço sugerido</div>
              <div className="text-lg font-semibold text-success">{brl(resultado.precoSugerido)}</div>
            </div>
            <div>
              <div className="text-ink-tertiary">Lucro</div>
              <div className="text-lg text-ink">{brl(resultado.lucro)}</div>
              {resultado.precoSugerido > 0 && (
                <div className="text-xs text-ink-tertiary">{Math.round((resultado.lucro / resultado.precoSugerido) * 100)}% do preço de venda</div>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={salvar} disabled={loading} className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
              Salvar precificação
            </button>
            <button type="button" onClick={aplicarComoPreco} disabled={aplicando} className="rounded-full border border-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-gold-text hover:bg-white disabled:opacity-50">
              Aplicar como preço de venda
            </button>
          </div>
        </div>

        {brindes.length > 0 && (
          <Section title="Simular com brinde">
            <p className="text-xs text-ink-tertiary">Só para visualizar o impacto — não altera o custo salvo do produto.</p>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-muted">Brinde</span>
              <select value={brindeId} onChange={e => setBrindeId(e.target.value)} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold">
                <option value="">Sem brinde</option>
                {brindes.map(b => (
                  <option key={b.id} value={b.id}>{b.nome} ({brl(b.custoUnitario)}/un)</option>
                ))}
              </select>
            </label>
            {resultadoComBrinde && (
              <div className="rounded-lg bg-hoverbg p-3 text-sm text-ink-muted">
                Com brinde: custo total <span className="text-ink">{brl(resultadoComBrinde.custoTotal)}</span> · preço sugerido{' '}
                <span className="text-ink">{brl(resultadoComBrinde.precoSugerido)}</span>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
      <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-border-subtle px-3 py-2 outline-none transition-colors focus:border-gold" />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-ink-muted">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
