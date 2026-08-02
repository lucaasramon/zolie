'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Props {
  orderId: string;
  status: string;
  melhorEnvioId: string | null;
  etiquetaUrl: string | null;
  codigoRastreio: string | null;
}

export function LabelPanel({ orderId, status, melhorEnvioId, etiquetaUrl, codigoRastreio }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const router = useRouter();

  const comprado = Boolean(melhorEnvioId);
  const podeComprar = !comprado && status !== 'AGUARDANDO_PAGAMENTO' && status !== 'CANCELADO';

  async function executar(acao: () => Promise<string>) {
    setCarregando(true);
    setErro('');
    setAviso('');
    try {
      const mensagem = await acao();
      if (mensagem) setAviso(mensagem);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível concluir a operação');
    } finally {
      setCarregando(false);
    }
  }

  const onComprar = () =>
    executar(async () => {
      await api.post(`/admin/orders/${orderId}/label`, {});
      return 'Etiqueta comprada. O código de rastreio costuma levar alguns minutos para ser emitido.';
    });

  const onBuscarRastreio = () =>
    executar(async () => {
      const { data } = await api.patch<{ codigoRastreio: string | null; pendente: boolean }>(
        `/admin/orders/${orderId}/label`,
        {},
      );
      return data.pendente
        ? 'O Melhor Envio ainda não emitiu o código. Ele será preenchido automaticamente assim que sair.'
        : `Rastreio recebido: ${data.codigoRastreio}`;
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-xs">
      <h3 className="font-sans text-lg font-semibold text-ink">Etiqueta de envio</h3>

      {!comprado && (
        <>
          <p className="text-xs text-ink-tertiary">
            A compra debita saldo da carteira do Melhor Envio.
          </p>
          <button
            type="button"
            onClick={onComprar}
            disabled={carregando || !podeComprar}
            className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
          >
            {carregando ? 'Comprando...' : 'Comprar etiqueta'}
          </button>
          {!podeComprar && (
            <p className="text-xs text-ink-tertiary">
              {status === 'AGUARDANDO_PAGAMENTO'
                ? 'Disponível após a confirmação do pagamento.'
                : 'Pedido cancelado.'}
            </p>
          )}
        </>
      )}

      {comprado && (
        <>
          <p className="text-xs text-ink-tertiary">Envio: {melhorEnvioId}</p>

          {etiquetaUrl && (
            <a
              href={etiquetaUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gold-text underline hover:text-gold-text-hover"
            >
              Abrir etiqueta para impressão
            </a>
          )}

          {codigoRastreio ? (
            <p className="text-xs text-ink-muted">
              Rastreio emitido: <span className="font-mono">{codigoRastreio}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={onBuscarRastreio}
              disabled={carregando}
              className="self-start rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted transition-colors hover:border-gold disabled:opacity-50"
            >
              {carregando ? 'Buscando...' : 'Buscar rastreio agora'}
            </button>
          )}
        </>
      )}

      {aviso && <p className="text-xs text-ink-muted">{aviso}</p>}
      {erro && <p className="text-xs text-danger">{erro}</p>}
    </div>
  );
}
