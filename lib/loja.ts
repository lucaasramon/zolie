/**
 * Dados institucionais da loja, exigidos pelo art. 2º do Decreto 7.962/2013:
 * nome empresarial, CNPJ e endereço físico visíveis em local de destaque.
 *
 * As `NEXT_PUBLIC_*` são lidas no bundle do cliente (rodapé, páginas legais);
 * o servidor tem acesso às mesmas variáveis via `env.loja`.
 */
export const LOJA = {
  nomeFantasia: 'Zoliê Semijoias',
  razaoSocial: process.env.NEXT_PUBLIC_LOJA_RAZAO_SOCIAL || '',
  cnpj: process.env.NEXT_PUBLIC_LOJA_CNPJ || '',
  endereco: process.env.NEXT_PUBLIC_LOJA_ENDERECO || '',
  whatsapp: (process.env.NEXT_PUBLIC_LOJA_WHATSAPP || '').replace(/\D/g, ''),
  email: process.env.NEXT_PUBLIC_LOJA_EMAIL || '',
  instagram: process.env.NEXT_PUBLIC_LOJA_INSTAGRAM || '',
} as const;

/** `11987654321` → `(11) 98765-4321`. Devolve vazio se não houver número. */
export function formatarTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

/** `67187717000165` → `67.187.717/0001-65`. */
export function formatarCnpj(digitos: string): string {
  const d = digitos.replace(/\D/g, '');
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function linkWhatsApp(mensagem?: string): string | null {
  if (!LOJA.whatsapp) return null;
  const numero = LOJA.whatsapp.startsWith('55') ? LOJA.whatsapp : `55${LOJA.whatsapp}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/${numero}${texto}`;
}

/**
 * Linha de identificação para rodapé e páginas legais. Omite o que não estiver
 * configurado, em vez de exibir placeholder — CNPJ falso é pior que CNPJ ausente.
 */
export function linhaIdentificacao(): string {
  const partes = [LOJA.razaoSocial || LOJA.nomeFantasia];
  if (LOJA.cnpj) partes.push(`CNPJ ${formatarCnpj(LOJA.cnpj)}`);
  if (LOJA.endereco) partes.push(LOJA.endereco);
  return partes.join(' · ');
}
