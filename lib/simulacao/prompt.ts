/**
 * Prompts da simulação de peça personalizada com IA (ver simulacao.service.ts).
 *
 * Funções puras: recebem tudo o que precisam e devolvem texto, para poderem ser
 * testadas sem chamar a OpenAI. Os prompts são em inglês porque os modelos de
 * imagem seguem instruções em inglês com mais precisão; o conteúdo da cliente
 * (texto do verso) vai sempre literal, entre delimitadores, nunca traduzido.
 *
 * Princípio central: a imagem gerada é uma EDIÇÃO da foto do anúncio, não uma
 * peça nova. Tudo que não foi pedido pela cliente é invariante.
 */

/** Descrição tipográfica de cada fonte oferecida — o modelo não tem os arquivos de fonte. */
export const FONTES_DESCRICAO: Record<string, string> = {
  '01 verdana':
    'Verdana: a wide humanist SANS-SERIF typeface, no serifs, uniform stroke width, large open letterforms, generous letter spacing',
  '02 baskerville':
    'Baskerville: a classic transitional SERIF typeface, elegant, high contrast between thick and thin strokes, sharp bracketed serifs',
  '03 georgia':
    'Georgia: a sturdy SERIF typeface, slightly heavy strokes, moderate contrast, wide and very legible, old-style feel',
  '04 pingfangTC-ligth':
    'PingFang TC Light: a THIN, LIGHT-weight modern SANS-SERIF typeface, clean geometric shapes, delicate hairline strokes, no serifs',
  '05 timesnewromannPSmt':
    'Times New Roman: a traditional compact SERIF typeface, narrow letters, high stroke contrast, classic newspaper look',
  '06 savoyeLetPlain':
    'Savoye LET: a very elegant flowing CALLIGRAPHIC SCRIPT typeface, connected cursive handwriting with long graceful swashes and loops, thin delicate strokes',
};

const FONTE_PADRAO =
  'a simple, elegant, classic SERIF engraving typeface (the shop default when no font is chosen)';

const MATERIAL_DESCRICAO: Record<string, string> = {
  PRATA_925: 'polished 925 sterling silver (cool bright silver tone)',
  PRATA_750: 'polished silver (cool silver tone)',
  BANHADO_OURO: '18k gold-plated metal (warm yellow-gold tone)',
  ACO: 'polished stainless steel (neutral grey-silver tone)',
};

/** Cores possíveis do pingente de coração ("cor aleatória" na loja). */
export const CORES_PINGENTE = [
  { nome: 'rosa', en: 'soft pink' },
  { nome: 'lilás', en: 'lilac purple' },
  { nome: 'azul-claro', en: 'light aqua blue' },
  { nome: 'vermelho', en: 'ruby red' },
  { nome: 'branco (cristal)', en: 'clear colorless crystal' },
  { nome: 'verde', en: 'emerald green' },
] as const;

export type CorPingente = (typeof CORES_PINGENTE)[number];

// Termos usados nos nomes de modelo cadastrados no admin (em português). Sem
// tradução explícita, a IA chegou a ler "Medalha Coração" como medalha redonda.
const TERMOS_MODELO: [RegExp, string][] = [
  [/cora[cç][aã]o/i, 'HEART-shaped'],
  [/redond[ao]/i, 'ROUND (perfect circle)'],
  [/retangular/i, 'RECTANGULAR'],
  [/quadrad[ao]/i, 'SQUARE'],
  [/oval/i, 'OVAL'],
  [/estrela/i, 'STAR-shaped'],
  [/gota/i, 'TEARDROP-shaped'],
  [/cruz/i, 'CROSS-shaped'],
  [/\blua\b/i, 'CRESCENT MOON-shaped'],
  [/infinito/i, 'INFINITY-symbol-shaped'],
  [/escapul[aá]rio/i, 'SCAPULAR (devotional necklace with plate(s) as in the official photos)'],
  [/placa|chapinha|plaquinha/i, 'flat PLATE/TAG'],
  [/medalh/i, 'MEDAL pendant'],
  [/pingente/i, 'pendant'],
];

/**
 * Nome do modelo + significado em inglês, para nenhum modelo de IA ter de
 * adivinhar português. Ex.: "Medalha Coração 12mm" →
 * `"Medalha Coração 12mm" (Portuguese name; meaning: HEART-shaped MEDAL pendant, 12 mm in size)`.
 */
export function descreverModelo(rotulo: string): string {
  const termos = TERMOS_MODELO.filter(([re]) => re.test(rotulo)).map(([, en]) => en);
  const mm = rotulo.match(/(\d+(?:[.,]\d+)?)\s*mm/i)?.[1]?.replace(',', '.');
  const partes = [termos.join(' '), mm ? `${mm} mm in size` : ''].filter(Boolean);
  return partes.length ? `"${rotulo}" (Portuguese name; meaning: ${partes.join(', ')})` : `"${rotulo}"`;
}

/** Análise da peça feita por visão a partir da foto do anúncio (ver ANALISE_SCHEMA). */
export interface AnalisePeca {
  tipo: string;
  formato: string;
  contorno: string;
  argola: string;
  corrente: string;
  corMetal: string;
  acabamento: string;
  detalhesFixos: string[];
  areaGravavelFrente: string;
  temPersonalizacaoDeExemplo: boolean;
  personalizacaoDeExemplo: string;
  estiloGravacao: string;
  fundoEFoto: string;
}

export interface ContextoSimulacao {
  nomeProduto: string;
  material: string;
  /** Rótulo do modelo escolhido (ex: "Medalha redonda 12mm"), quando o anúncio tem modelos. */
  modelo: string | null;
  corrente: string | null;
  /** Quantas fotos do anúncio vão como referência (são sempre as primeiras imagens enviadas). */
  fotosProduto: number;
  /** Quantas fotos da cliente vão logo depois das do anúncio. */
  fotosCliente: number;
  textoVerso: string | null;
  fonte: string | null;
  pingente: boolean;
  corPingente: CorPingente;
  analise: AnalisePeca | null;
}

export type Lado = 'frente' | 'verso';

function listaImagens(ctx: ContextoSimulacao): string {
  const linhas: string[] = [];
  for (let i = 1; i <= ctx.fotosProduto; i++) {
    linhas.push(
      i === 1
        ? `- Image 1: THE OFFICIAL PRODUCT PHOTO of the exact piece being sold. This is the master reference and the image you are editing.`
        : `- Image ${i}: another official photo of the SAME product (other angle/detail). Use it only to understand the real piece better.`,
    );
  }
  for (let j = 1; j <= ctx.fotosCliente; j++) {
    linhas.push(`- Image ${ctx.fotosProduto + j}: a photo uploaded by the customer to be engraved on the FRONT of the piece.`);
  }
  return linhas.join('\n');
}

function blocoAnalise(a: AnalisePeca | null): string {
  if (!a) return '';
  return `
VERIFIED DESCRIPTION OF THE PIECE IN IMAGE 1 (all of this is fixed and must be reproduced exactly):
- Type: ${a.tipo}
- Shape: ${a.formato}
- Outline/silhouette: ${a.contorno}
- Bail / jump ring / connection: ${a.argola}
- Chain: ${a.corrente}
- Metal color: ${a.corMetal}
- Finish: ${a.acabamento}
- Fixed design details that must stay identical: ${a.detalhesFixos.length ? a.detalhesFixos.join('; ') : 'none besides the above'}
- Engravable area of the front: ${a.areaGravavelFrente}
- Engraving method: ALWAYS laser engraving (this shop engraves every personalized piece with a laser).
- Photo setup (background, lighting, angle): ${a.fundoEFoto}${
    a.temPersonalizacaoDeExemplo
      ? `\n- Image 1 contains a SAMPLE personalization (${a.personalizacaoDeExemplo}). It is only a placeholder from the shop: REMOVE it completely and replace it with the customer's content described below (or leave that area blank if the customer gave none for that side).`
      : ''
  }
`;
}

function blocoVariante(ctx: ContextoSimulacao): string {
  if (!ctx.modelo) {
    return 'The output shows exactly ONE piece: the piece of Image 1 (if the photos show several pieces, use the main/front-most one).';
  }
  return `The customer chose the model ${ctx.modelo}. The output shows exactly ONE piece of this model. If the official photos show several variants (e.g. different shapes or sizes side by side), use ONLY the variant matching ${ctx.modelo} and leave the others out. If no photo shows this exact variant, render this variant's shape (as named in ${ctx.modelo}) while keeping EVERYTHING else identical to the official piece: same metal, finish, thickness, edge profile, bail, chain and photo style. Never show more than one main piece.`;
}

function blocoInvariantes(ctx: ContextoSimulacao): string {
  return `
ABSOLUTE RULES — THE PIECE MUST BE THE SAME MODEL AS THE PRODUCT PHOTO:
0. ${blocoVariante(ctx)}
1. Do NOT design, invent, substitute or "improve" the jewelry. Reproduce the exact piece from Image 1: identical silhouette and outline, identical proportions (width/height ratio), identical thickness and edge profile (bevels, rims, borders), identical bail/jump ring, identical chain style, link shape and thickness.
2. Keep the exact shape: a round piece stays perfectly round, a heart stays the same heart, a rectangle keeps the same corner radius and ratio, a scapular keeps its exact form. Never swap it for a generic medal.
3. Keep the exact metal color and finish of Image 1 (${MATERIAL_DESCRICAO[ctx.material] ?? 'same metal as Image 1'}; if this hint ever conflicts with Image 1, Image 1 wins).
4. Keep every fixed design element of Image 1 (borders, reliefs, stones, cut-outs, existing religious images or ornaments) exactly as they are, in the same place and size — unless it is the shop's sample personalization, which must be replaced.
5. Add NOTHING that was not requested: no extra stones, no extra charms, no extra text, no initials, no dates, no logos, no hallmarks, no brand marks, no watermarks, no captions, no labels such as "front"/"back".
6. The piece must be fully visible, centered, not cropped, in focus, photographed like Image 1: same style of clean studio product photography and soft lighting.
6b. BACKGROUND: keep EXACTLY the background of Image 1 (same color, same gradient, same plain studio surface). Never replace it with a scene, room, table, blur of objects or any new environment. The front and back previews must look like two photos from the same photo session.
6c. No hands, no people wearing it, no props, no packaging.
7. Photorealistic jewelry macro photography. The result must look like a real photo of the real piece after personalization, not an illustration or 3D render.`;
}

function blocoPingente(ctx: ContextoSimulacao, lado: Lado): string {
  if (!ctx.pingente) {
    return `\nHEART CHARM: the customer chose NO extra charm. Do not add any heart or other charm (keep only what exists in Image 1).`;
  }
  return `
HEART CHARM (requested, it is a free gift): add exactly ONE small heart-shaped zirconia charm in ${ctx.corPingente.en} color, set in a thin bezel of the SAME metal and color as the piece, hanging from the SAME chain/jump ring right beside the main piece. It must be clearly smaller than the main piece (about one quarter of its height), never overlapping or covering the engraving. ${
    lado === 'verso'
      ? 'This is the back view, so show the back of the charm: its metal bezel back, with the colored stone just visible at the edges. Same color as on the front.'
      : 'Show the faceted colored stone facing the camera.'
  } Exactly one charm — not two, not zero.`;
}

export function promptFrente(ctx: ContextoSimulacao): string {
  const conteudo =
    ctx.fotosCliente > 0
      ? `
WHAT TO ENGRAVE ON THE FRONT:
- Engrave the customer's photo${ctx.fotosCliente > 1 ? 's' : ''} (${
          ctx.fotosCliente > 1
            ? `Images ${ctx.fotosProduto + 1} and ${ctx.fotosProduto + 2}, combined side by side into one balanced composition`
            : `Image ${ctx.fotosProduto + 1}`
        }) onto the front face of the piece, inside the engravable area, centered, with a clean safety margin from the edges, cropped to follow the outline of the piece (circular for round, heart-shaped for heart, rectangular for rectangle).
- LASER ENGRAVING ONLY (this shop engraves every piece with a laser): convert the photo into a detailed MONOCHROME laser photo-engraving etched into the metal — fine dark grey to black tones and halftone/stipple shading, the lighter areas showing the bare polished metal. Absolutely NO colors from the original photo, NO printed/sticker/enamel/colored-photo look, NO paper or glossy photo insert. Even if any official photo shows a colored example, the result must be a grayscale laser engraving.
- Preserve the content of the customer's photo faithfully: same people, same faces and facial features, same expressions, same poses, same pets/objects, same composition. Do not beautify, do not change identities, do not add or remove people or elements. Ignore the photo's original background clutter only if needed to fit the piece, keeping the main subjects.
- The engraving follows the metal surface naturally (light reflections, slight depth), like a real laser engraving.`
      : `
WHAT TO ENGRAVE ON THE FRONT: NOTHING. The customer did not send a photo. Keep the front exactly as the official piece (if Image 1 shows a sample personalization, remove it and show the clean, polished blank surface).`;

  return `You are a meticulous jewelry product photographer and retoucher for the Brazilian jewelry shop "Zoliê". Edit Image 1 to show how THIS EXACT piece will look after the customer's personalization — FRONT VIEW.

PRODUCT: "${ctx.nomeProduto}"${ctx.modelo ? ` — chosen model: ${ctx.modelo}` : ''}${ctx.corrente ? ` — chain: ${ctx.corrente}` : ''}.

INPUT IMAGES:
${listaImagens(ctx)}
${blocoAnalise(ctx.analise)}${blocoInvariantes(ctx)}

VIEW: FRONT of the piece, same camera angle, framing and composition as Image 1.
${conteudo}
${blocoPingente(ctx, 'frente')}

FINAL CHECK BEFORE ANSWERING: same exact model as Image 1? same shape, bail, chain and metal? only the requested personalization added? no extra text or marks? If any answer is no, fix it.`;
}

export function promptVerso(ctx: ContextoSimulacao): string {
  const fonte = (ctx.fonte && FONTES_DESCRICAO[ctx.fonte]) || FONTE_PADRAO;
  const conteudo = ctx.textoVerso
    ? `
WHAT TO ENGRAVE ON THE BACK — TEXT (exact characters between the markers <<< and >>>; the markers themselves are NOT engraved):
<<<${ctx.textoVerso}>>>
Text rules (critical, zero tolerance):
- Engrave EXACTLY these characters, in this exact order: same letters, same uppercase/lowercase, same accents and cedillas (á, ã, â, é, ê, í, ó, õ, ô, ú, ç), same digits, same punctuation, same symbols (♥ & / - . , etc.). Character count must match exactly.
- Do NOT translate, correct spelling, change capitalization, abbreviate, add, remove or repeat any word or character. Do NOT add quotation marks, dates, names, hearts or decorations that are not in the text.
- Typeface: ${fonte}. Every letter must clearly show the characteristics of this typeface.
- Readable left-to-right as seen by the viewer (NOT mirrored), horizontally centered, vertically centered inside the back face, with a safety margin from the edges. If it does not fit on one line, break it into 2-4 lines ONLY at existing spaces, keeping the reading order; keep a consistent size for all lines.
- Engraving look: fine, crisp, dark grey laser-engraved lettering slightly recessed into the polished metal (laser engraving only — never printed, painted, enameled or colored).`
    : `
WHAT TO ENGRAVE ON THE BACK: NOTHING. The customer chose no back personalization: show a clean, smooth, polished blank back with no text, no marks, no hallmarks and no logos.`;

  return `You are a meticulous jewelry product photographer and retoucher for the Brazilian jewelry shop "Zoliê". Using Image 1 as the master reference, produce a photo of THIS EXACT piece seen from the BACK, after the customer's personalization — BACK VIEW.

PRODUCT: "${ctx.nomeProduto}"${ctx.modelo ? ` — chosen model: ${ctx.modelo}` : ''}${ctx.corrente ? ` — chain: ${ctx.corrente}` : ''}.

INPUT IMAGES:
${listaImagens(ctx)}
${blocoAnalise(ctx.analise)}${blocoInvariantes(ctx)}

VIEW: the REVERSE side of the very same piece, as if it were flipped over around its vertical axis and photographed with the same camera angle, framing, background and lighting as Image 1.
- The silhouette is the horizontal mirror of the front silhouette (for symmetric shapes it looks identical); same size, same thickness and edge profile, same bail/jump ring, same chain.
- The back surface is the plain back of the same piece in the same metal and finish (if one of the official product photos shows the real back, reproduce that back exactly). Front-side reliefs, stones or engraved images do NOT appear on the back. The customer's photo (if any) is on the FRONT only and must NOT appear here.
${conteudo}
${blocoPingente(ctx, 'verso')}

FINAL CHECK BEFORE ANSWERING: same exact model as Image 1 seen from behind? same shape, bail, chain and metal? ${
    ctx.textoVerso ? 'text identical character by character, not mirrored, in the requested typeface?' : 'back completely blank?'
  } nothing extra added? If any answer is no, fix it.`;
}

// ---------------------------------------------------------------------------
// Visão: análise da peça e verificação do resultado
// ---------------------------------------------------------------------------

export function promptAnalise(modelo: string | null): string {
  return `You are a senior jewelry product specialist. The images are official photos of ONE jewelry product from an online store (the first one is the main photo).
Describe the physical piece with maximum precision so that an image editor can reproduce EXACTLY the same model without any deviation. Be concrete and measurable (ratios, counts, positions). Describe only what is visible; never guess hidden details.${
    modelo
      ? `
The customer chose the variant ${modelo}. If the photos show several variants, describe ONLY the one matching ${modelo} (say which photo/position it is in). If none matches exactly, describe the common design (metal, chain, bail, edge, finish) and state the shape implied by ${modelo}.`
      : ''
  }
If the main photo shows a sample personalization (an example photo, name, date or text engraved/printed on the piece to illustrate the service), flag it.
Answer in English, filling every field of the JSON schema.`;
}

export const ANALISE_SCHEMA = {
  name: 'analise_peca',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'tipo', 'formato', 'contorno', 'argola', 'corrente', 'corMetal', 'acabamento', 'detalhesFixos',
      'areaGravavelFrente', 'temPersonalizacaoDeExemplo', 'personalizacaoDeExemplo', 'estiloGravacao', 'fundoEFoto',
    ],
    properties: {
      tipo: { type: 'string', description: 'kind of piece, e.g. "flat round medal pendant on a chain necklace", "scapular with two plates"' },
      formato: { type: 'string', description: 'exact geometric shape and proportions, e.g. "perfect circle", "symmetric heart, width ~1.1x height", "vertical rectangle 1:1.6 with ~1mm rounded corners"' },
      contorno: { type: 'string', description: 'edge profile and rim: flat edge, beveled, raised border width, thickness impression' },
      argola: { type: 'string', description: 'how the piece connects to the chain: bail/jump ring type, size, position' },
      corrente: { type: 'string', description: 'chain style (cartier, rolo, veneziana, box...), link shape, thickness, or "no chain visible"' },
      corMetal: { type: 'string', description: 'exact metal color/tone as seen' },
      acabamento: { type: 'string', description: 'polished / brushed / matte / satin, reflections' },
      detalhesFixos: { type: 'array', items: { type: 'string' }, description: 'design elements that belong to the product itself (stones, reliefs, images, borders, cut-outs) with position and size; exclude sample personalization' },
      areaGravavelFrente: { type: 'string', description: 'where personalization fits on the front, as a fraction of the piece, respecting margins and fixed details' },
      temPersonalizacaoDeExemplo: { type: 'boolean' },
      personalizacaoDeExemplo: { type: 'string', description: 'what the sample personalization is and where, or "none"' },
      estiloGravacao: { type: 'string', description: 'how engraving looks on this product if visible, else "not visible" (informative only: the shop always uses laser engraving)' },
      fundoEFoto: { type: 'string', description: 'background color, lighting, camera angle and framing of the main photo' },
    },
  },
} as const;

export interface VerificacaoEsperada {
  lado: Lado;
  modelo: string | null;
  textoVerso: string | null;
  fonte: string | null;
  fotosCliente: number;
  pingente: boolean;
  corPingente: CorPingente;
}

export function promptVerificacao(v: VerificacaoEsperada, fotosProduto: number): string {
  const indiceGerada = fotosProduto + (v.lado === 'frente' ? v.fotosCliente : 0) + 1;
  return `You are a strict quality inspector for AI-generated jewelry personalization previews. Be skeptical and precise.
Images: images 1..${fotosProduto} are the OFFICIAL product photos.${
    v.lado === 'frente' && v.fotosCliente > 0
      ? ` Images ${fotosProduto + 1}..${fotosProduto + v.fotosCliente} are the customer's photos that should be engraved.`
      : ''
  } The LAST image (image ${indiceGerada}) is the GENERATED ${v.lado === 'frente' ? 'FRONT' : 'BACK'} preview to inspect.

Check the generated image:
1. mesmoModelo: is it unmistakably the SAME jewelry model as the official photos (same shape, proportions, edge, bail/jump ring, chain style, metal color, fixed design details)? ${v.lado === 'verso' ? 'It is the back view, so the silhouette may be mirrored and front-only reliefs/images must not appear.' : ''} Any substitution by a different/generic piece = false.${
    v.modelo ? ` The customer chose the variant ${v.modelo}: the image must show exactly one piece of that variant (wrong shape, or more than one main piece = false). IMPORTANT: the official photos may show a different variant of the same product; judge the SHAPE against the chosen variant, and everything else (metal, chain, bail, edge, finish) against the official photos.` : ''
  }
2. conteudoCorreto: ${
    v.lado === 'frente'
      ? v.fotosCliente > 0
        ? "is the customer's photo content (same people/subjects, faces, poses) engraved on the front, inside the piece, as a MONOCHROME LASER ENGRAVING (grayscale etched into the metal)? Different people, missing subjects, a generic picture, or a colored/printed/sticker-like photo = false."
        : 'is the front free of any engraving/personalization (blank where personalization would go)?'
      : v.textoVerso
        ? `is the engraved text EXACTLY <<<${v.textoVerso}>>> (character by character: letters, case, accents, digits, punctuation; markers not included), not mirrored, readable, in a typeface matching: ${(v.fonte && FONTES_DESCRICAO[v.fonte]) || FONTE_PADRAO}? Any missing/extra/wrong character = false.`
        : 'is the back completely blank (no text, marks or logos)?'
  }
3. pingenteCorreto: ${
    v.pingente
      ? `is there exactly ONE small heart-shaped charm (${v.corPingente.en} stone) beside the piece on the same chain?`
      : 'is there NO added heart charm (only what exists in the official photo)?'
  }
4. semExtras: is the image free of anything not requested (extra text, logos, watermarks, labels, extra stones/charms, hands, props) and is the piece fully visible and photorealistic?

Only fail a check for a problem you can clearly see in the generated image; if you are unsure, the check passes. Never invent problems.
In "problemas", list each failure as a short, concrete, actionable correction instruction in English (e.g. "The text reads 'Helna' but must read exactly 'Helena'", "The medal became oval; it must be a perfect circle like image 1"). Empty list if everything passes.`;
}

export const VERIFICACAO_SCHEMA = {
  name: 'verificacao_simulacao',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['mesmoModelo', 'conteudoCorreto', 'pingenteCorreto', 'semExtras', 'problemas'],
    properties: {
      mesmoModelo: { type: 'boolean' },
      conteudoCorreto: { type: 'boolean' },
      pingenteCorreto: { type: 'boolean' },
      semExtras: { type: 'boolean' },
      problemas: { type: 'array', items: { type: 'string' } },
    },
  },
} as const;

export interface Verificacao {
  mesmoModelo: boolean;
  conteudoCorreto: boolean;
  pingenteCorreto: boolean;
  semExtras: boolean;
  problemas: string[];
}

export const aprovada = (v: Verificacao) => v.mesmoModelo && v.conteudoCorreto && v.pingenteCorreto && v.semExtras;

/** Prompt de nova tentativa: o original + as correções apontadas pela verificação. */
export function comCorrecoes(prompt: string, problemas: string[]): string {
  if (problemas.length === 0) return prompt;
  return `${prompt}

CORRECTIONS REQUIRED — a previous attempt was rejected by quality control for these reasons. Fix every one of them while keeping all rules above. If a correction contradicts the customer's choices or the rules above (chosen model/shape, text, photo, charm), IGNORE that correction — the customer's choices always win:
${problemas.map(p => `- ${p}`).join('\n')}`;
}
