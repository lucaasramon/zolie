import { prisma } from '@/lib/prisma';

const CACHE_TTL_MS = 30 * 1000;

interface Config {
  freteGratisAtivo: boolean;
  descontoPixAtivo: boolean;
}

const PADRAO: Config = { freteGratisAtivo: true, descontoPixAtivo: true };

/**
 * Cache em memória do processo. `resumo()`/`decorate()` são chamadas de forma
 * síncrona em muitos pontos (listagem de produtos, carrinho, pedido) — em vez de
 * tornar toda essa cadeia assíncrona, mantemos aqui o último valor lido do banco
 * e atualizamos em segundo plano quando expira, sem bloquear a leitura corrente.
 */
let cache: Config = PADRAO;
let expiraEm = 0;
let carregando: Promise<void> | null = null;

async function carregar() {
  const row = await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
  cache = { freteGratisAtivo: row.freteGratisAtivo, descontoPixAtivo: row.descontoPixAtivo };
  expiraEm = Date.now() + CACHE_TTL_MS;
}

/** Garante que o cache tenha sido populado ao menos uma vez (uso em request paths). */
export async function preparar() {
  if (Date.now() <= expiraEm) return;
  if (!carregando) {
    carregando = carregar().finally(() => {
      carregando = null;
    });
  }
  await carregando;
}

/** Leitura síncrona do último valor conhecido; dispara refresh em segundo plano se expirado. */
export function get(): Config {
  if (Date.now() > expiraEm && !carregando) {
    carregando = carregar().finally(() => {
      carregando = null;
    });
  }
  return cache;
}

export async function atualizar(data: Partial<Config>) {
  const row = await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
  cache = { freteGratisAtivo: row.freteGratisAtivo, descontoPixAtivo: row.descontoPixAtivo };
  expiraEm = Date.now() + CACHE_TTL_MS;
  return cache;
}
