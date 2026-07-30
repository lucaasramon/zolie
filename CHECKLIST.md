# Checklist — Zoliê E-commerce

## 🔴 Segurança (crítico, fazer primeiro)
- [ ] Remover fallback hardcoded do `JWT_SECRET` em [lib/env.ts](lib/env.ts) — falhar o boot se a env var não existir
- [ ] Remover o mesmo fallback duplicado em [middleware.ts](middleware.ts)
- [ ] Remover senha default hardcoded do Postgres em [docker-compose.yml](docker-compose.yml)
- [ ] Trocar `httpOnly: false` → `httpOnly: true` no cookie `zolie_token` (login, register, admin/login)
- [ ] Remover leitura de `document.cookie` em `lib/api-client.ts` (não precisa mais com cookie httpOnly)
- [ ] Adicionar rate limiting em `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/payments/webhook`
- [ ] Validar upload de imagem pelos magic bytes reais do arquivo, não só pelo `file.type` declarado (`admin/uploads`)
- [ ] Implementar fluxo de verificação de e-mail (campo `emailVerified` já existe no schema, sem uso)
- [ ] Trocar comparação direta de string por `timingSafeEqual` na validação do token do webhook Asaas

## 🟠 Resiliência / Dados
- [ ] Envolver criação de pedido + baixa de estoque + limpeza de carrinho em `prisma.$transaction`
- [ ] Criar rotina de compensação (reverter estoque/pedido) se a chamada ao gateway Asaas falhar após o pedido já criado
- [ ] Corrigir `/api/v1/health` para checar conexão real com o banco (`SELECT 1`), não retornar `ok` fixo
- [ ] Adicionar `error.tsx` e `global-error.tsx` em `app/`
- [ ] Integrar serviço de logging/observabilidade (Sentry ou similar) — hoje só há `console.error`
- [ ] Migrar upload de imagens de `public/images/produtos` (filesystem) para storage externo (S3/R2/Vercel Blob)

## 🟡 Qualidade de código / repo
- [ ] Fazer commit real do código de negócio (hoje quase tudo está untracked, só existe o commit inicial do scaffold)
- [ ] Remover `_tmp-test-email.mjs` da raiz (script de teste manual, não referenciado pelo app)
- [ ] Remover `lib/generated/prisma` do controle de versão (client gerado, incluindo binário `.dll`) e gerar no build/postinstall
- [ ] Decidir o destino de `_legacy/` (arquivar fora do repo ou remover, já que serviu só de referência)
- [ ] Adicionar testes automatizados, ao menos para `pricing.service`, `order.service` e o parser do webhook Asaas

## 🎨 UI/UX
- [ ] Trocar textos de "Carregando..." por skeleton screens (carrinho, checkout, pedidos)
- [ ] Adicionar `loading.tsx` nativo do App Router nas rotas principais (`produtos`, `carrinho`, `conta/pedidos`)
- [ ] Esconder o link "Painel administrativo" do Header/Footer para quem não é admin
- [ ] Adicionar carrossel/zoom de imagens na página de produto (o array `imagens[]` já existe, só falta exibir)

## 🚀 Features de conversão
- [ ] Carrinho de convidado (guest checkout) — hoje exige login antes de adicionar item
- [ ] Tokenização de cartão no client (Asaas.js/iframe) em vez de enviar PAN/CVV cru pelo backend
- [ ] E-mail de recuperação de carrinho abandonado
- [ ] Fotos em avaliações de produto
- [ ] Selo de "compra verificada" nas avaliações
- [ ] Busca com autocomplete/sugestões
- [ ] Full-text search com índice (`pg_trgm`/`tsvector`) em vez de `ILIKE` sem índice
- [ ] Recomendação "quem comprou, também levou" baseada em `OrderItem`
- [ ] Cupom automático de primeira compra visível no cadastro (lógica de back-end já existe)
