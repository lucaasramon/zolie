/**
 * Lista os grupos de WhatsApp da instância da Evolution configurada no .env —
 * para descobrir os ids de WHATSAPP_GRUPO_VENDAS e WHATSAPP_GRUPO_ALERTAS.
 *
 * Uso: npx tsx --env-file=.env scripts/listar-grupos-whatsapp.ts
 */
const url = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
const apiKey = process.env.EVOLUTION_API_KEY || '';
const instancia = process.env.EVOLUTION_INSTANCE || '';

async function main() {
  if (!url || !apiKey || !instancia) {
    throw new Error('Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no .env');
  }
  const res = await fetch(`${url}/group/fetchAllGroups/${instancia}?getParticipants=false`, { headers: { apikey: apiKey } });
  if (!res.ok) throw new Error(`Evolution respondeu ${res.status}: ${await res.text()}`);
  const grupos = (await res.json()) as { id: string; subject: string }[];
  for (const g of grupos) console.log(`${g.id}\t${g.subject}`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
