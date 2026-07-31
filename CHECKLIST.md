# Checklist — Zoliê E-commerce

## 🔴 Segurança (crítico) — ✅ concluído
- [x] Remover fallback hardcoded do `JWT_SECRET` em [lib/env.ts](lib/env.ts) — falha o boot se a env var não existir
- [x] Remover o mesmo fallback duplicado em [proxy.ts](proxy.ts)
- [x] Remover senha default hardcoded do Postgres em [docker-compose.yml](docker-compose.yml)
- [x] Trocar `httpOnly: false` → `httpOnly: true` no cookie `zolie_token` (login, register, admin/login) + rota `/auth/logout` server-side
- [x] Remover leitura de `document.cookie` em `lib/api-client.ts`
- [x] Rate limiting em `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/payments/webhook`
- [x] Validar upload de imagem pelos magic bytes reais do arquivo (`lib/utils/fileSignature.ts`)
- [x] Implementar fluxo de verificação de e-mail (token, rota, página `/verificar-email`)
- [x] `timingSafeEqual` na validação do token do webhook Asaas

## 🟠 Resiliência / Dados — ✅ concluído
- [x] `prisma.$transaction` para pedido + baixa de estoque + limpeza de carrinho, com rollback/compensação se o gateway Asaas falhar
- [x] `/api/v1/health` agora testa a conexão real com o banco (`SELECT 1`)
- [x] `error.tsx` e `global-error.tsx` em `app/`
- [x] `lib/logger.ts` — wrapper único de logging, pronto para trocar por Sentry sem mudar call sites
- [x] Upload de imagens desacoplado via `lib/storage` (local hoje, plugável para S3/R2)

## 🟡 Qualidade de código / repo — ✅ concluído
- [x] Remover `_tmp-test-email.mjs` da raiz
- [x] Remover `lib/generated/prisma` do controle de versão e do `.gitignore`
- [x] Testes automatizados com Vitest: `pricing.service`, `coupon.service`, `asaasWebhook.logic` (31 testes)
- [ ] Decidir o destino de `_legacy/` (arquivar fora do repo ou remover) — não alterado nesta rodada, decisão do time
- [ ] Fazer o commit real do código de negócio no git (branch ainda tem tudo untracked)

## 🎨 UI/UX — ✅ concluído
- [x] Skeleton screens no lugar de "Carregando..." (carrinho, checkout, pedidos, endereços, favoritos, conta)
- [x] `loading.tsx` nativo em `produtos` e `produtos/[slug]`
- [x] Link "Painel administrativo" escondido no Header/Footer para quem não é admin
- [x] Carrossel de imagens + zoom on hover na página de produto (`ProductGallery`)

## 🚀 Features de conversão — ✅ concluído
- [x] Carrinho de convidado (guest checkout) — cookie de sessão anônima httpOnly, merge automático no login/cadastro
- [x] Tokenização de cartão via Asaas.js no client — PAN/CVV não trafegam mais pelo backend (com fallback se o script não carregar)
- [x] E-mail de recuperação de carrinho abandonado — job diário via Vercel Cron (`/api/v1/cron/abandoned-carts`)
- [x] Fotos em avaliações de produto (upload + exibição)
- [x] Selo de "compra verificada" nas avaliações
- [x] Busca com autocomplete/sugestões no Header
- [x] Full-text search com índice `pg_trgm` (GIN) em nome/descrição de produto
- [x] Recomendação "quem comprou, também levou" baseada em `OrderItem` (com fallback por categoria)
- [x] Cupom automático de primeira compra exibido dinamicamente no cadastro

## Pendências que exigem decisão/credenciais do time
- [ ] Configurar `NEXT_PUBLIC_ASAAS_SANDBOX`/chaves reais do Asaas.js em produção
- [ ] Configurar `CRON_SECRET` e confirmar o schedule do cron de carrinho abandonado no Vercel
- [ ] Trocar `lib/storage/local.ts` por um provider real (S3/R2) antes de deploy serverless (filesystem local não é gravável em runtime imutável)
- [ ] Integrar Sentry (ou similar) chamando dentro de `lib/logger.ts`
- [ ] Resolver o destino de `_legacy/`
- [ ] Primeiro commit real do código de negócio (hoje quase tudo está untracked no git)
