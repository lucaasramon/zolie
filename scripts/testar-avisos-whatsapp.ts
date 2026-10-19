/**
 * Manda uma mensagem de teste nos grupos de Vendas e Alertas configurados no
 * .env — para confirmar instância, chave e ids dos grupos antes de ir ao ar.
 *
 * Uso: npx tsx --env-file=.env scripts/testar-avisos-whatsapp.ts
 */
import { mensagemAlerta } from '../lib/services/whatsapp/mensagens';

const url = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
const apiKey = process.env.EVOLUTION_API_KEY || '';
const instancia = process.env.EVOLUTION_INSTANCE || '';

async function enviar(grupo: string, text: string) {
  const res = await fetch(`${url}/message/sendText/${instancia}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number: grupo, text }),
  });
  if (!res.ok) throw new Error(`Evolution respondeu ${res.status}: ${await res.text()}`);
}

async function main() {
  const vendas = process.env.WHATSAPP_GRUPO_VENDAS || '';
  const alertas = process.env.WHATSAPP_GRUPO_ALERTAS || '';
  if (!url || !apiKey || !instancia || !vendas || !alertas) {
    throw new Error('Defina EVOLUTION_* e WHATSAPP_GRUPO_VENDAS/WHATSAPP_GRUPO_ALERTAS no .env');
  }
  await enviar(vendas, '🛍️ *Teste* — aqui vão chegar as vendas confirmadas da Zoliê.');
  await enviar(alertas, mensagemAlerta('aviso', 'Teste', { Info: 'aqui vão chegar os alertas de erros e falhas no checkout da Zoliê' }));
  console.log('Mensagens de teste enviadas.');
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
