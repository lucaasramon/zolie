// Peças da campanha Black Friday 2026: recebem o selo "Black Friday" na vitrine
// e na página do produto. O preço promocional em si fica no banco
// (`precoPromocional`); esta lista só marca quais peças fazem parte da ação.
export const BLACK_FRIDAY_SLUGS = new Set<string>([
  'colar-banhado-a-ouro-coracao-zirconia',
  'brinco-prata-trevo-organico',
  'colar-banhado-a-ouro-duplo-perolas',
  'brinco-banhado-a-ouro-ear-climber-esferas',
  'brinco-banhado-a-ouro-pomba-cravejada',
  'colar-banhado-a-ouro-gravata-flor-tripla',
  'colar-prata-pingente-menino',
  'colar-prata-pingente-menina',
  'pulseira-banhado-a-ouro-elos-com-esferas',
  'pulseira-banhado-a-ouro-estrelas-vazadas',
  'brinco-banhado-a-ouro-coracao-e-trevo-cravejado',
  'pulseira-prata-elos-esferas',
  'anel-prata-solitario-zirconia-cristal',
  'anel-prata-solitario-zirconia-aro-fino',
  'brinco-prata-ear-climber-folhas',
  'tornozeleira-banhado-a-ouro-corrente-com-esferas',
  'colar-banhado-a-ouro-duplo-madreperola',
  'conjunto-banhado-a-ouro-gatinho-cravejado',
  'conjunto-banhado-a-ouro-trio-zirconia',
  'pulseira-banhado-a-ouro-trevo-quatro-folhas',
  'colar-prata-duplo-camadas-esferas',
  'colar-personalizado-com-pingente-retangular',
  'brinco-prata-coracao-cravejado',
  'brinco-banhado-a-ouro-argola-organica-cravejada',
  'anel-prata-aro-trevo-cravejado',
]);

/** Fim da campanha: 30/11/2026 às 23:59 de Brasília. Depois disso o selo some sozinho. */
export const BLACK_FRIDAY_FIM = new Date('2026-12-01T02:59:59.999Z');

/** Início do tema preto do site: 27/11/2026 à 00:00 de Brasília. */
export const BLACK_FRIDAY_INICIO = new Date('2026-11-27T03:00:00.000Z');

export function emBlackFriday(slug: string, agora: Date = new Date()): boolean {
  return agora <= BLACK_FRIDAY_FIM && BLACK_FRIDAY_SLUGS.has(slug);
}

/** Tema Black Friday (faixa, cabeçalho, rodapé e vitrine pretos): liga e desliga sozinho pelas datas. */
export function blackFridayAtiva(agora: Date = new Date()): boolean {
  return agora >= BLACK_FRIDAY_INICIO && agora <= BLACK_FRIDAY_FIM;
}

const DIA_MS = 86_400_000;
// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019).
const diaBrasil = (d: Date) => Math.floor((d.getTime() - 3 * 3_600_000) / DIA_MS);

/** Urgência da faixa: "Último dia!", "Termina amanhã" ou "Só até 30/11". */
export function prazoBlackFriday(agora: Date = new Date()): string {
  const faltam = diaBrasil(BLACK_FRIDAY_FIM) - diaBrasil(agora);
  if (faltam <= 0) return 'Último dia!';
  if (faltam === 1) return 'Termina amanhã';
  return 'Só até 30/11';
}
