import { promises as dns } from 'dns';
import { logger } from '@/lib/logger';

/** Domínios de e-mail temporário/descartável — bloqueados no cadastro. */
const DOMINIOS_DESCARTAVEIS = new Set([
  '0-mail.com',
  '10minutemail.com',
  '20minutemail.com',
  'anonbox.net',
  'burnermail.io',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.net',
  'harakirimail.com',
  'inboxbear.com',
  'jetable.org',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mailsac.com',
  'mintemail.com',
  'mohmal.com',
  'mytemp.email',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.de',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

/**
 * Erros de digitação em provedores populares. Esses domínios costumam existir de verdade
 * (são registrados por squatters e têm MX), então a checagem de DNS não os pega.
 */
const TYPOS_COMUNS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'uol.com': 'uol.com.br',
  'bol.com': 'bol.com.br',
};

export function dominioDoEmail(email: string): string {
  return email.split('@')[1]?.toLowerCase().trim() || '';
}

/** Devolve o domínio correto quando o informado é um typo conhecido; senão, null. */
export function sugestaoDeDominio(email: string): string | null {
  return TYPOS_COMUNS[dominioDoEmail(email)] ?? null;
}

export function ehDescartavel(email: string): boolean {
  return DOMINIOS_DESCARTAVEIS.has(dominioDoEmail(email));
}

/**
 * Confirma que o domínio aceita e-mail consultando os registros MX.
 * Cai para registros A/AAAA, que também servem como destino de entrega (RFC 5321 §5.1).
 *
 * Falha de rede/timeout devolve `true` — a checagem é uma barreira contra erro de
 * digitação, não deve derrubar o cadastro quando o DNS está indisponível.
 */
export async function dominioAceitaEmail(email: string, timeoutMs = 3000): Promise<boolean> {
  const dominio = dominioDoEmail(email);
  if (!dominio) return false;

  const semResultado = Symbol('sem-resultado');
  const timeout = new Promise<typeof semResultado>(resolve => setTimeout(() => resolve(semResultado), timeoutMs));

  try {
    const consulta = dns
      .resolveMx(dominio)
      .then(registros => registros.some(r => r.exchange))
      .catch(async () => {
        // Sem MX: o domínio ainda pode receber e-mail via registro A/AAAA.
        try {
          const enderecos = await dns.lookup(dominio, { all: true });
          return enderecos.length > 0;
        } catch {
          return false;
        }
      });

    const resultado = await Promise.race([consulta, timeout]);
    if (resultado === semResultado) {
      logger.warn('Timeout ao checar DNS do domínio de e-mail', { dominio });
      return true;
    }
    return resultado;
  } catch (err) {
    logger.warn('Falha ao checar DNS do domínio de e-mail', { dominio, err });
    return true;
  }
}
