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
]);

/** Fim da campanha: 30/11/2026 às 23:59 de Brasília. Depois disso o selo some sozinho. */
export const BLACK_FRIDAY_FIM = new Date('2026-12-01T02:59:59.999Z');

export function emBlackFriday(slug: string, agora: Date = new Date()): boolean {
  return agora <= BLACK_FRIDAY_FIM && BLACK_FRIDAY_SLUGS.has(slug);
}
