import { after } from 'next/server';
import { env } from '@/lib/env';
import { orderRepo } from '@/lib/repositories/order.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { enviarImagem, enviarTexto, whatsappConfigurado } from './evolution';
import { imagensPersonalizacao, mensagemAlerta, mensagemVendaConfirmada, NivelAlerta, PedidoParaAviso } from './mensagens';

/**
 * Avisos internos nos grupos de WhatsApp da loja:
 *  - grupo de Vendas: cada pagamento confirmado, com todos os dados do pedido e
 *    as imagens das peças personalizadas;
 *  - grupo de Alertas: erros no fluxo de compra e falhas importantes do sistema.
 *
 * Tudo é best-effort e roda depois da resposta (`after`): a Evolution fora do ar
 * nunca pode atrasar nem quebrar uma compra ou o webhook do Asaas.
 */

/** Executa depois da resposta da requisição; fora de uma requisição, roda em segundo plano. */
function agendar(tarefa: () => Promise<void>) {
  const seguro = () => tarefa().catch(err => console.error('[whatsapp] falha ao enviar aviso', err));
  try {
    after(seguro);
  } catch {
    void seguro();
  }
}

const urlAbsoluta = (url: string) => (/^https?:\/\//i.test(url) ? url : `${env.appUrl}${url.startsWith('/') ? '' : '/'}${url}`);

export function notificarVendaConfirmada(orderId: string) {
  if (!whatsappConfigurado() || !env.whatsapp.grupoVendas) return;
  agendar(async () => {
    const order = await orderRepo.findById(orderId);
    if (!order) return;
    const grupo = env.whatsapp.grupoVendas;
    const pedido = order as unknown as PedidoParaAviso;
    await enviarTexto(grupo, mensagemVendaConfirmada(pedido, env.appUrl));
    // Em sequência (não em paralelo) para chegarem na ordem, logo abaixo do resumo.
    for (const img of imagensPersonalizacao(pedido)) {
      await enviarImagem(grupo, urlAbsoluta(img.url), img.legenda).catch(async err => {
        console.error('[whatsapp] falha ao enviar imagem da personalização', err);
        await enviarTexto(grupo, `${img.legenda}\n(não foi possível anexar — abra: ${urlAbsoluta(img.url)})`);
      });
    }

    // Peça que zerou o estoque com esta venda: hora de repor (ou pausar o anúncio).
    const produtoIds = [...new Set(order.items.map(i => i.productId))];
    const produtos = await Promise.all(produtoIds.map(id => productRepo.findById(id)));
    for (const p of produtos) {
      if (p && p.estoque <= 0) {
        alertar('Produto esgotou', { Produto: p.nome, 'Última venda': `Pedido ${order.numero}`, Admin: `${env.appUrl}/admin/produtos/${p.id}` }, {
          nivel: 'aviso',
          chave: `esgotou:${p.id}`,
        });
      }
    }
  });
}

// O mesmo problema costuma se repetir em rajada (ex: Asaas fora do ar derruba
// todo checkout). Avisa uma vez por chave a cada 10 min. Em serverless o mapa é
// por instância — reduz o volume, não garante unicidade, e isso basta aqui.
const JANELA_DEDUPE_MS = 10 * 60_000;
const ultimosAlertas = new Map<string, number>();

function deveAlertar(chave: string): boolean {
  const agora = Date.now();
  const ultimo = ultimosAlertas.get(chave);
  if (ultimo && agora - ultimo < JANELA_DEDUPE_MS) return false;
  ultimosAlertas.set(chave, agora);
  if (ultimosAlertas.size > 500) ultimosAlertas.delete(ultimosAlertas.keys().next().value as string);
  return true;
}

interface AlertaOpts {
  nivel?: NivelAlerta;
  /** Alertas com a mesma chave são agrupados (padrão: o título). Use `null` para nunca agrupar. */
  chave?: string | null;
}

export function alertar(titulo: string, detalhes: Record<string, unknown> = {}, { nivel = 'erro', chave }: AlertaOpts = {}) {
  if (!whatsappConfigurado() || !env.whatsapp.grupoAlertas) return;
  if (chave !== null && !deveAlertar(chave ?? titulo)) return;
  const texto = mensagemAlerta(nivel, titulo, detalhes);
  agendar(() => enviarTexto(env.whatsapp.grupoAlertas, texto));
}

function descreverErro(err: unknown): string | undefined {
  if (err == null) return undefined;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Chamado por `logger.error`: todo erro registrado no servidor vira alerta. */
export function alertarErroDeLog(mensagem: string, err?: unknown, contexto?: Record<string, unknown>) {
  alertar(mensagem, { Erro: descreverErro(err), ...contexto });
}
