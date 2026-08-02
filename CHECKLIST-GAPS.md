# Checklist de Gaps — Zoliê E-commerce

> Levantamento feito em 01/08/2026 sobre o estado atual do repositório.
> O [CHECKLIST.md](CHECKLIST.md) original cobre segurança, resiliência e conversão — quase tudo concluído.
> Este documento lista **o que ainda não existe** e é necessário para operar a loja de verdade.
>
> Fora de escopo aqui: Melhor Envio e Asaas estarem em sandbox (decisão consciente do time).

---

## 🔴 Bloqueia a operação — não é possível vender sem isso

### 1. Não existe forma de cadastrar o código de rastreio — ✅ concluído
- [x] Adicionar `codigoRastreio` e `transportadora` ao `statusSchema` em [lib/validation/schemas.ts:106](lib/validation/schemas.ts#L106)
- [x] Aceitar e persistir esses campos em `orderService.updateStatus` ([lib/services/order.service.ts:181](lib/services/order.service.ts#L181))
- [x] Estender `orderRepo.updateStatus` para gravar os campos ([lib/repositories/order.repo.ts:42](lib/repositories/order.repo.ts#L42))
- [x] Criar o input no admin — hoje [app/admin/pedidos/[id]/page.tsx:71](app/admin/pedidos/[id]/page.tsx#L71) apenas *exibe* o código, não permite digitá-lo
- [x] Incluir o código de rastreio no e-mail de mudança de status quando `status === 'ENVIADO'` ([lib/services/email.service.ts:165](lib/services/email.service.ts#L165))
- [x] Exibir o rastreio na página do pedido do cliente ([app/(store)/conta/pedidos/[id]/page.tsx:18](app/(store)/conta/pedidos/[id]/page.tsx#L18) já tem o campo no tipo, mas ele nunca é preenchido)

**Por quê:** [order.service.ts:98](lib/services/order.service.ts#L98) grava `codigoRastreio: null` na criação e nada nunca atualiza esse campo. Hoje o cliente recebe "seu pedido foi enviado" sem nenhum código — gera ticket de suporte em praticamente todo pedido despachado.

**Como ficou:**
- `updateStatus(id, status, opts)` passou a receber um objeto de opções (`descricao`, `motivo`, `codigoRastreio`, `transportadora`) no lugar dos parâmetros posicionais — os 3 call sites existentes foram atualizados.
- Marcar um pedido como `ENVIADO` sem código de rastreio agora falha com `TRACKING_CODE_REQUIRED` (a menos que o pedido já tenha um gravado). Foi uma decisão minha para garantir que nenhum pedido saia sem rastreio; se preferir que seja apenas um aviso, é só remover essa validação em [lib/services/order.service.ts:198](lib/services/order.service.ts#L198).
- `undefined` preserva o valor atual e `null` limpa o campo, então salvar só o status não apaga um rastreio já cadastrado.
- O `OrderStatusSelect` virou um formulário com botão "Salvar alterações" — antes ele disparava o PATCH direto no `onChange` do select.

---

### 2. Não existe cancelamento nem estorno — ✅ concluído
- [x] Criar `orderService.cancelar(orderId, motivo)` que, numa única transação: repõe o estoque, decrementa o uso do cupom e marca o pedido como `CANCELADO`
- [x] Implementar o estorno em [lib/services/payment.service.ts](lib/services/payment.service.ts) — virou `encerrarCobranca()`, que estorna se o dinheiro entrou e remove a cobrança se ainda não foi paga
- [x] Rota de cancelamento pelo cliente — restrita a `AGUARDANDO_PAGAMENTO` (ver decisão abaixo)
- [x] Botão de cancelar no admin que chame o fluxo completo — não o `OrderStatusSelect` genérico
- [x] Fazer o webhook reusar esse mesmo fluxo: hoje a ação `cancel_order` ([lib/services/asaasWebhook.logic.ts:37](lib/services/asaasWebhook.logic.ts#L37)) muda o status mas **não repõe estoque**
- [x] E-mail de confirmação de cancelamento/estorno
- [x] **Bônus:** fechada a brecha do item 3 — o job de expiração agora remove a cobrança no Asaas, então um boleto de pedido cancelado deixa de ser pagável

**Como ficou:**
- `orderService.cancelar()` é o **único** caminho de cancelamento: cliente, admin, webhook e cron de expiração passam todos por ele. Era essa duplicação que fazia o estoque ficar errado.
- **Cliente só cancela antes de pagar.** Depois disso o pedido passa pelo admin — evita estorno automático sem revisão humana.
- **Admin decide sobre o dinheiro caso a caso:** checkbox "estornar" no cancelamento de pedido pago, para distinguir devolução real de cancelamento logístico (reenvio/troca). O default do schema é `false` — devolver dinheiro é escolha explícita, nunca efeito de campo esquecido no payload.
- **A cobrança é encerrada antes do banco.** Se o gateway falhar, o pedido continua ativo e a operação pode ser repetida; o inverso deixaria pedido cancelado com cobrança viva.
- **O status é lido do Asaas, não do banco** — o `asaasStatus` local pode estar defasado se um webhook se perdeu, e a decisão entre estornar e remover depende disso.
- Status desconhecido é tratado como não pago: remover uma cobrança pendente é reversível, estornar por engano move dinheiro.
- 12 testes novos em [lib/services/cancelOrder.logic.test.ts](lib/services/cancelOrder.logic.test.ts) (49 no total).

⚠️ **Não testado contra a API real do Asaas** — `refund` e `delete` foram validados só com mock. Vale um teste em sandbox antes de confiar em produção.

**Por quê:** a reposição de estoque só existe no `catch` da criação do pedido ([order.service.ts:139](lib/services/order.service.ts#L139)). Qualquer cancelamento posterior — pelo admin, pelo cliente ou por estorno vindo do Asaas — deixa o estoque permanentemente errado. Além disso, [app/(store)/trocas/page.tsx:6](app/(store)/trocas/page.tsx#L6) promete 30 dias de devolução pelo CDC sem nenhum mecanismo por trás.

---

### 3. Pedido não pago nunca expira — ✅ concluído
- [x] Criar `/api/v1/cron/expire-orders` nos moldes de [app/api/v1/cron/abandoned-carts/route.ts](app/api/v1/cron/abandoned-carts/route.ts) (mesmo padrão de `CRON_SECRET`)
- [x] Cancelar pedidos em `AGUARDANDO_PAGAMENTO` além do prazo (PIX ~24h, boleto ~72h — alinhado ao `dueDate` de [payment.service.ts:38](lib/services/payment.service.ts#L38)) e repor o estoque
- [x] Registrar o cron em [vercel.json](vercel.json) — hoje só existe o de carrinho abandonado

**Por quê:** o estoque é baixado na criação do pedido ([order.service.ts:113](lib/services/order.service.ts#L113)). Um PIX gerado e não pago trava esse estoque para sempre. Com algumas dezenas de pedidos abandonados a loja fica "sem estoque" tendo o produto na gaveta.

**Como ficou:**
- Novo [lib/services/orderExpiration.service.ts](lib/services/orderExpiration.service.ts): busca os vencidos, e para cada um repõe estoque, devolve o uso do cupom e cancela — tudo numa transação só.
- **Prazos com folga sobre o vencimento do Asaas:** PIX/cartão 36h, boleto 96h (o `dueDate` é 1 e 3 dias). A margem evita cancelar um pedido pago em cima do vencimento cujo webhook ainda não chegou.
- **Idempotente:** o cancelamento usa `updateMany` com `status: 'AGUARDANDO_PAGAMENTO'` no `where`. Se o pagamento foi confirmado entre a busca e a transação, afeta 0 linhas e o estoque não é tocado — seguro para rodar repetido ou concorrente.
- Falha em um pedido não interrompe o lote (mesmo padrão do cron de carrinho abandonado).
- Cron de hora em hora, não diário: o estoque volta rápido para a vitrine.
- E-mail `enviarPedidoExpirado` avisando o cliente e convidando a refazer a compra.
- 6 testes novos em [lib/services/orderExpiration.logic.test.ts](lib/services/orderExpiration.logic.test.ts) (37 no total, todos passando).

~~**Ainda pendente neste item:** a cobrança correspondente não é cancelada no Asaas.~~ ✅ **Resolvido no item 2:** o job agora chama `encerrarCobranca()` antes de cancelar, então o boleto deixa de ser pagável. Se o gateway falhar, o cancelamento é abortado e o pedido é reprocessado na execução seguinte — melhor que cancelar deixando a cobrança viva.

⚠️ **Requer configuração:** `CRON_SECRET` precisa estar definida no ambiente, senão a rota responde 401 e nada expira (mesma dependência do cron de carrinho abandonado, já listada nas pendências do [CHECKLIST.md](CHECKLIST.md)).

---

### 1b. Geração automática de etiqueta e rastreio (Melhor Envio) — ✅ código e infra prontos, ⚠️ falta ligar o flag e testar
- [x] Client do Melhor Envio para cart/checkout/generate/print/tracking ([lib/services/melhorEnvio/client.ts](lib/services/melhorEnvio/client.ts))
- [x] Fluxo de compra de etiqueta ([lib/services/melhorEnvio/label.service.ts](lib/services/melhorEnvio/label.service.ts))
- [x] Botão "Comprar etiqueta" no admin, disparo manual ([components/admin/LabelPanel.tsx](components/admin/LabelPanel.tsx))
- [x] Job que busca o rastreio depois e preenche o pedido (cron a cada 30min)
- [x] Persistir `envioServicoId` na criação do pedido — a cotação escolhida era descartada
- [x] **Preencher as variáveis `LOJA_REMETENTE_*`** — Brenna Medeiros, CNPJ 67.187.717/0001-65 (dígitos verificados), Rua do Imperio 81, Pedras, Itaitinga/CE. Os 9 campos carregam corretamente.
- [x] **Adicionar saldo na carteira sandbox** — R$ 10 mil (fictício)
- [x] Aplicar a migration `20260801200000_add_melhor_envio_label` — aplicada no Supabase em 02/08/2026, `migrate status` confirma banco em dia
- [ ] **Ligar `MELHOR_ENVIO_LABELS_ENABLED=true`** — ainda em `false`; enquanto isso a compra retorna `LABELS_DISABLED`
- [ ] **Reiniciar o `next dev`** — não relê o `.env` sozinho e está travando o engine do Prisma
- [ ] **Testar o fluxo real** — nenhuma chamada à API do Melhor Envio foi feita até agora

**Como funciona:** admin clica em "Comprar etiqueta" → `cart` → `checkout` (debita saldo) → `generate` → `print` (link do PDF). O rastreio **não sai nesse momento**; o cron `/api/v1/cron/sync-tracking` busca a cada 30min e preenche o campo do item 1. Há também um botão "Buscar rastreio agora" para forçar.

**Decisões:**
- **Disparo manual, não automático** — em produção cada clique gasta saldo real, então ninguém compra etiqueta sem uma ação humana.
- **Desligado por flag** (`MELHOR_ENVIO_LABELS_ENABLED`) — o código pode ir para produção sem risco de gastar sem querer.
- **O id do envio é gravado antes do checkout.** Se `checkout`/`generate` falharem depois, o id não se perde e a etiqueta é recuperável pelo painel, em vez de virar saldo gasto sem rastro.
- **Impressão é best-effort:** falhar em `print` não desfaz a compra, só adia o link do PDF.
- Erro 401/403 do Melhor Envio retorna mensagem específica de escopo de token — é a causa mais provável e a mais difícil de diagnosticar pelo payload.

**Limitação conhecida:** o peso do pacote ainda é estimado em 150g por item. O `pesoGramas` do produto continua ignorado (ver item 6).

---

## 🟠 Perde venda e dinheiro de forma silenciosa

### 4. SEO praticamente inexistente — ✅ concluído
- [x] `generateMetadata` na página de produto — title, description, e `openGraph` com a imagem do produto
- [x] `generateMetadata` na listagem e nas categorias
- [x] Criar `app/sitemap.ts` com produtos e categorias ativos
- [x] Criar `app/robots.ts`
- [x] JSON-LD `Product` com `offers`, `price`, `availability` e `aggregateRating` (o schema já tem `notaMedia` e `totalAvaliacoes`)
- [x] Definir `metadataBase` em [app/layout.tsx:19](app/layout.tsx#L19)
- [x] Revisar `export const dynamic = 'force-dynamic'` em [app/(store)/produtos/[slug]/page.tsx:14](app/(store)/produtos/[slug]/page.tsx#L14) — impede cache/ISR e piora indexação
- [x] **Bônus:** JSON-LD de `BreadcrumbList`, `Organization` (home) e `FAQPage` (/faq); metadata nas institucionais

**Como ficou:**
- **Título com template** (`%s | Zoliê Semijoias`) no layout raiz — páginas internas definem só o próprio nome. Verificado no build: 49 URLs no sitemap.
- **A página de produto virou SSG com ISR de 5min** (era `ƒ` dinâmica, agora `●`). Duas correções foram necessárias:
  - [app/(store)/layout.tsx:3](app/(store)/layout.tsx#L3) tinha `force-dynamic` e **anulava o cache de toda a loja** — layout sobrepõe página. O `StoreShell` só lê categorias, não usa cookies/headers, então era desnecessário.
  - Faltava `generateStaticParams`; sem ela o Next não pré-renderiza nenhum slug.
- **Produto esgotado sai do índice** (`robots: noindex`) e volta sozinho ao repor estoque.
- **URLs de filtro/busca são `noindex`** — só a listagem limpa e as de categoria são indexáveis, para não diluir relevância com conteúdo quase idêntico.
- **`robots.ts` bloqueia tudo fora do domínio de produção**, para preview da Vercel não competir com a loja real. Verificado: `localhost` e `*.vercel.app` bloqueiam, `zolie.com.br` libera.
- `aggregateRating` é **omitido** quando não há avaliação — declará-lo com 0 viola as diretrizes do Google e custa o rich result da página.
- 11 testes novos em [lib/utils/jsonLd.test.ts](lib/utils/jsonLd.test.ts) (60 no total).

⚠️ **Requer configuração:** `NEXT_PUBLIC_APP_URL` precisa ser o domínio real em produção. Hoje é `localhost:3000`, e com isso o `robots.txt` bloqueia os buscadores e o sitemap sai com URLs de localhost.

---

### 5. Nenhum analytics ou pixel de conversão — ✅ concluído (client-side)
- [x] Instalar GA4 (ou Plausible) via `next/script`
- [x] Instalar Meta Pixel — indispensável para anúncio de semijoias
- [x] Disparar os eventos de funil: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
- [x] **Bônus:** `PageViewTracker` — a navegação do Next é client-side, então sem ele só o primeiro carregamento seria contado
- [ ] Enviar o `purchase` também server-side, no webhook de pagamento confirmado (evita perda por bloqueador de anúncio) — **não feito, ver abaixo**

**Como ficou:**
- [lib/analytics.ts](lib/analytics.ts) é a única camada que conhece GA4/Pixel. Os componentes chamam `trackAddToCart()` e afins — trocar de provedor mexe só nesse arquivo.
- **Sem ID configurado, nada é carregado.** Em dev nenhum script sobe e os relatórios de produção não recebem dado de teste.
- `PageViewTracker` fica dentro de `<Suspense>`: `useSearchParams` sem boundary tornaria a rota dinâmica e **anularia o cache conquistado no item 4**. Verificado no build — `/produtos/[slug]` continua `●` (SSG/ISR).
- `begin_checkout` usa guarda por `useRef`: o carrinho recarrega a cada mudança de frete/endereço e sem isso a contagem de inícios de checkout inflaria.
- `add_to_cart` só dispara **depois** da resposta da API — registrar antes contaria carrinho que nunca existiu.
- `purchase` usa o número do pedido como `transaction_id`, o que deduplica a conversão se o cliente der F5 na confirmação.
- 9 testes novos em [lib/analytics.test.ts](lib/analytics.test.ts) (69 no total).

⚠️ **Limitação conhecida — `purchase` dispara na criação do pedido, não na confirmação do pagamento.** Para Pix e boleto a confirmação vem depois, via webhook, então a receita reportada inclui pedidos que podem nunca ser pagos. O `purchase` server-side (item pendente acima) resolveria isso e também a perda por bloqueador de anúncio; exige a API de Conversões da Meta e o Measurement Protocol do GA4.

⚠️ **Requer configuração:** `NEXT_PUBLIC_GA_ID` e `NEXT_PUBLIC_META_PIXEL_ID`. Sem elas a instrumentação fica inerte.

⚠️ **Pendência de LGPD:** com o Pixel ativo, o banner de consentimento de cookies (item 8) deixa de ser opcional.

---

## 🟡 Importante — resolver antes de escalar

### 6. Cotação de frete sem cache e sem tolerância a falha — ✅ concluído
- [x] Cachear a cotação por CEP + faixa de peso (alguns minutos) — 10min, em memória do processo
- [x] Definir um comportamento de fallback quando o Melhor Envio falhar — hoje [lib/services/shipping.service.ts:42](lib/services/shipping.service.ts#L42) lança 502 e derruba o checkout inteiro
- [x] Adicionar timeout explícito no `fetch` — 8s via `AbortController`
- [x] Usar o peso real do produto: [shipping.service.ts:5](lib/services/shipping.service.ts#L5) usa um `PACOTE_PADRAO` fixo de 150g, ignorando o `pesoGramas` que já existe no schema

**Como ficou:**
- **Peso real:** soma `pesoGramas × quantidade` de cada item + 80g de embalagem. Antes um pedido de 10 peças era cotado como 150g — a transportadora cobraria a diferença depois.
- **Tabela de contingência por região** ([shipping.logic.ts](lib/services/shipping.logic.ts)): se o Melhor Envio cair, o checkout continua vendendo com valor estimado por faixa de CEP, sinalizado ao cliente na UI. Antes era 502 e a compra morria.
- **Contingência não é cacheada** — assim que o provedor volta, a cotação real é usada de novo.
- **Frete grátis é aplicado sobre o valor cacheado**, não faz parte da chave: o mesmo CEP+peso serve carrinho acima e abaixo do limite com uma chamada só.
- A lógica pura ficou em `shipping.logic.ts`, separada do I/O, como em `asaasWebhook.logic`.
- 27 testes novos ([shipping.logic.test.ts](lib/services/shipping.logic.test.ts) e [shipping.service.test.ts](lib/services/shipping.service.test.ts)) — 96 no total.

**Dois bugs encontrados de passagem:**
- `envioId` iniciava como `'pac'`, que **nunca** corresponde a um id real (os do Melhor Envio são numéricos). Nenhuma opção de frete aparecia selecionada no checkout até o cliente clicar; no backend caía no `opcoes[0]` e funcionava por acidente. Agora a primeira opção é selecionada automaticamente.
- O id `'contingencia'` seria gravado em `envioServicoId` e quebraria a compra de etiqueta (item 1b). Agora é normalizado para `null`.

⚠️ **Os valores da tabela de contingência são estimativas minhas**, calibradas para serem conservadoras. Vale ajustar em [shipping.logic.ts](lib/services/shipping.logic.ts) com base no que você observar de frete real por região.

### 7. Nota fiscal — ✅ concluído
- [x] Adicionar `notaFiscalUrl` / `notaFiscalChave` ao model `Order` (mais `notaFiscalNumero`)
- [x] Campo no admin para anexar a NF-e ([InvoicePanel.tsx](components/admin/InvoicePanel.tsx))
- [x] Disponibilizar o link para o cliente na página do pedido

A emissão continua fora do sistema — você cola número, chave e link do DANFE. A chave é validada em 44 dígitos e a máscara é removida antes de gravar.

### 8. LGPD — ✅ concluído
- [x] Exclusão de conta (com anonimização, preservando o histórico fiscal dos pedidos)
- [x] Exportação dos dados pessoais do usuário
- [x] Banner de consentimento de cookies (necessário assim que o item 5 entrar)

**Como ficou:**
- **Exclusão é anonimização, não `DELETE`.** Pedido é documento fiscal com guarda obrigatória (5 anos), então nome/e-mail/CPF/telefone são limpos e os valores preservados. Avaliações, favoritos, carrinho e tokens são apagados de verdade — conteúdo livre pode conter dado pessoal e não tem valor fiscal.
- **Bloqueia exclusão com pedido em andamento**, listando os números, para o cliente não perder rastreio de compra a caminho.
- Exportação em JSON com pedidos, endereços, avaliações e favoritos. **`senhaHash` e tokens nunca são exportados** — criaria vetor de vazamento sem utilidade para o titular.
- **O consentimento realmente bloqueia o rastreamento**, não só esconde o banner: `Consent Mode` do Google com padrão negado, `fbq('consent','revoke')` antes do `init`, e checagem em cada evento. Sem decisão do usuário, nada é enviado.
- O `<noscript>` do Meta Pixel foi **removido**: dispara PageView incondicionalmente, sem como respeitar consentimento.
- 4 testes novos cobrindo o bloqueio (recusa, indecisão, `localStorage` indisponível).

### 9. Integridade de dados — ✅ concluído
- [x] `Address` precisa de soft delete (`deletedAt`) — `Order` referencia `enderecoId` ([prisma/schema.prisma:241](prisma/schema.prisma#L241)); apagar um endereço quebra o histórico de pedidos
- [x] `orderRepo.nextNumber` ([lib/repositories/order.repo.ts:54](lib/repositories/order.repo.ts#L54)) usa `count()` — dois pedidos simultâneos geram o mesmo número e o `@unique` derruba a compra. Trocar por sequence do Postgres
- [x] `orderService.create` incrementa o uso do cupom ([order.service.ts:73](lib/services/order.service.ts#L73)) **fora** da transação — se a transação falhar depois, o cupom fica consumido sem pedido

**Verificado no banco:** a sequence gerou 2495, 2496, 2497 — distintos, crescentes, sem colidir com pedidos existentes.

### 10. Estoque e catálogo — ✅ parcial
- [x] Estoque por variação (tamanho/acabamento) — `CartItem` e `OrderItem` guardam `tamanho`, mas `Product.estoque` é um número único
- [x] Alerta de estoque baixo para o admin — endpoint `/api/v1/admin/stock-alerts`
- [ ] Avisar o cliente quando um item voltar ao estoque — **não feito** (exige modelo de inscrição + job de notificação)

**Como ficou:**
- Nova tabela `ProductVariant`: uma linha por tamanho × acabamento, com estoque próprio. `Product.estoque` continua como total agregado para catálogo e relatórios.
- **Backfill dividiu o estoque entre as variações** (não copiou — copiar multiplicaria o estoque real por N). Verificado: 36 produtos, 140 variantes, **zero divergências** entre o total do produto e a soma das variantes.
- Carrinho, checkout, cancelamento e expiração passaram a movimentar a variação **e** o total.
- Produto sem variação cadastrada continua funcionando só pelo `Product.estoque` — a migração é retrocompatível.

⚠️ **O admin ainda não tem tela para editar estoque por variação.** O endpoint e o repositório existem, mas a edição continua sendo pelo campo único do produto. É o próximo passo natural deste item.

---

## Sugestão de ordem de execução

| Fase | Itens | Objetivo |
|------|-------|----------|
| 1 | 1, 3, 9 (número do pedido) | Conseguir despachar sem quebrar estoque |
| 2 | 2 | Cumprir o CDC e fechar exposição jurídica |
| 3 | 4, 5 | Trazer tráfego e conseguir medir |
| 4 | 6, 7, 8 | Robustez e conformidade |
| 5 | 10 | Escala do catálogo |

---

# Segunda análise — 02/08/2026

Revisão do código depois de concluídos os itens 1–10, procurando o que ficou de fora
do levantamento original. Os itens abaixo **não estavam** no checklist inicial.

## 🔴 Regressão introduzida pelo item 10

### 11. O admin edita `Product.estoque` sem tocar nas variações — ✅ concluído
- [x] Fazer [StockRow.tsx:14](components/admin/StockRow.tsx#L14) e o `ProductForm` operarem sobre `ProductVariant`
- [x] Recalcular `Product.estoque` a partir da soma das variantes ao salvar (`variantRepo.totalEstoque` já existe)
- [x] Tela de edição de estoque por variação (era a ressalva já registrada no item 10)

**Como ficou:**
- [app/admin/estoque](app/admin/estoque/page.tsx) lista cada variação (tamanho · acabamento) com seu próprio controle. O total do produto aparece como leitura.
- `PATCH /api/v1/admin/variants/[id]` ajusta a variação e **recalcula `Product.estoque` como soma das variações na mesma transação** — os dois não podem mais divergir.
- `productService.update` passou a **descartar** `estoque` do payload: a única porta de escrita é a rota de variação.
- `ProductForm` mostra o estoque como leitura na edição (com link para a tela de Estoque) e só aceita "estoque inicial" na criação.
- Produto novo ganha variações automaticamente a partir dos tamanhos × acabamentos, com o estoque inicial **dividido** entre elas.
- O badge do menu passou a contar **variações** em falta, não produtos — um produto com 20 peças pode estar zerado no tamanho mais vendido.

**Verificado no banco:** ajustei uma variação de 10 → 35 e `Product.estoque` foi de 34 → 59, batendo com a soma. Estado restaurado depois do teste.

**O problema:** o item 10 fez o checkout validar **variante e produto**, mas
[app/admin/estoque/page.tsx](app/admin/estoque/page.tsx) e o `ProductForm` continuam
escrevendo só em `Product.estoque` — nenhum dos dois conhece `ProductVariant`.

Verificado no banco: "Colar Ponto de Luz Zircônia" tem `Product.estoque = 34` e
variantes `40cm/Fosco=10, 40cm/Polido=8, 45cm/Fosco=8, 45cm/Polido=8`. Se você repor
para 99 pelo admin, **as variantes continuam em 8-10** e a venda para no menor valor.
Na prática o admin não consegue mais repor estoque de verdade.

Isso é consequência direta de eu ter entregue o item 10 sem a tela — a ressalva estava
registrada, mas o impacto é maior do que "falta uma tela": **o controle de estoque
existente quebrou**.

## 🟠 Nunca esteve no checklist

### 12. O formulário de contato não envia nada — ✅ concluído
- [x] Criar rota que envie o formulário por e-mail (o `email.service` com Resend já existe)
- [x] Validar e aplicar rate limit, como nas demais rotas públicas

**Como ficou:**
- `POST /api/v1/contact` grava em `ContactMessage` **e depois** envia o e-mail. Gravar
  primeiro garante que a mensagem não se perde se o Resend falhar.
- O e-mail à loja usa `replyTo` do cliente — responder na caixa de entrada já vai direto a ele.
- O cliente recebe confirmação automática (best-effort: falha não derruba o envio).
- Nova tela [admin/mensagens](app/admin/mensagens/page.tsx) com marcação de respondida e badge no menu.
- Rate limit de 5 envios / 10 min por IP.
- **Escape de HTML** adicionado ao `email.service`: agora entra conteúdo de usuário nos e-mails,
  e sem escape um formulário poderia injetar markup no corpo da mensagem.

### 13. Dados institucionais falsos em produção — ✅ concluído
- [x] Substituir CNPJ, WhatsApp, e-mail e endereço reais em [app/admin/config/page.tsx:19](app/admin/config/page.tsx#L19)
- [x] Corrigir o rodapé: [Footer.tsx:71](components/layout/Footer.tsx#L71) exibe
      "CNPJ 00.000.000/0001-00 · Protótipo de demonstração · dados fictícios"

**Como ficou:**
- Novo [lib/loja.ts](lib/loja.ts) centraliza os dados, com formatação de CNPJ e telefone.
- Tudo vem de variáveis de ambiente (`LOJA_*` no servidor, `NEXT_PUBLIC_LOJA_*` no cliente) —
  nenhum dado institucional hardcoded.
- **Campo vazio é omitido do rodapé**, não substituído por placeholder: CNPJ falso é pior
  que CNPJ ausente. No admin/config, campo vazio aparece como "não configurado" em vermelho.
- Rodapé ganhou WhatsApp clicável, e-mail e links para `/termos` e `/privacidade`.

### 14. Não existe página de Termos de Uso — ✅ concluído
- [x] Criar `/termos` com regras de compra, prazos e política de trocas consolidada

10 seções cobrindo identificação, preços, pagamento, entrega, trocas, garantia, cupons,
dados pessoais e foro. Incluída no sitemap e linkada no rodapé.

### 15. Trocas e devoluções continuam sem fluxo — ✅ concluído (sem logística reversa)
- [x] Modelar solicitação de troca/devolução (o item 2 cobriu **cancelamento**, que é outra coisa)
- [ ] Logística reversa — o Melhor Envio tem `reverse`, hoje fixado em `false` em
      [label.service.ts](lib/services/melhorEnvio/label.service.ts) — **não feito por decisão de escopo**

**Como ficou:**
- Modelos `ReturnRequest` / `ReturnItem` com status `SOLICITADA → APROVADA → RECEBIDA → CONCLUIDA`
  (ou `RECUSADA`).
- O cliente abre a solicitação na página do pedido, **só quando o status é `ENTREGUE`** —
  pedido a caminho continua no fluxo de cancelamento do item 2.
- **Prazo de 30 dias validado no servidor**, contado a partir do evento de entrega no
  histórico do pedido, não da data da compra.
- Uma solicitação em aberto por pedido, para não duplicar atendimento do mesmo caso.
- Nova tela [admin/trocas](app/admin/trocas/page.tsx) para aprovar/recusar com mensagem ao
  cliente, e e-mails automáticos nas duas pontas.
- `/trocas` reescrita com o passo a passo real — antes mandava "seguir as instruções" que
  não existiam.

---

## Resumo desta análise — ✅ itens 11 a 15 concluídos

| # | Gravidade | Item | Status |
|---|-----------|------|--------|
| 11 | 🔴 | Admin não repõe mais estoque (regressão do item 10) | ✅ |
| 12 | 🟠 | Formulário de contato não envia nada | ✅ |
| 13 | 🟠 | CNPJ/dados falsos no site (exigência legal) | ✅ |
| 15 | 🟠 | Trocas prometidas sem fluxo real | ✅ (sem logística reversa) |
| 14 | 🟡 | Falta Termos de Uso | ✅ |

117 testes, typecheck e build limpos. Migration `20260802180000_contact_and_returns`
aplicada no Supabase e verificada.

**Boa notícia:** os 36 produtos têm `pesoGramas` preenchido, então o cálculo de frete
do item 6 usa peso real em 100% do catálogo.

---

# O que continua pendente

Nada aqui bloqueia a operação, mas vale saber:

## Requer configuração sua (código pronto)
- **`MELHOR_ENVIO_LABELS_ENABLED=true`** — compra de etiqueta segue desligada (item 1b)
- **`NEXT_PUBLIC_APP_URL`** com o domínio real — hoje `localhost`, e por isso o
  `robots.txt` bloqueia buscadores e o sitemap sai com URLs erradas (item 4)
- **`NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID`** — analytics inerte sem eles (item 5)
- **`LOJA_*` e `NEXT_PUBLIC_LOJA_*`** no `.env` — os valores estão no `.env.example`,
  falta copiar para o `.env` (item 13)
- **`CRON_SECRET`** — sem ela os crons de expiração e rastreio respondem 401 (item 3)

## Não implementado, por decisão de escopo
- **Logística reversa automática** — a etiqueta de retorno é gerada no painel do
  Melhor Envio (item 15)
- **`purchase` server-side** — hoje o evento dispara na criação do pedido, então a
  receita no GA4 inclui Pix/boleto que podem nunca ser pagos (item 5)
- **Aviso de reposição de estoque** ao cliente — exige modelo de inscrição + job (item 10)

## Nunca testado contra API real
- **Asaas `refund` / `delete`** — validados só com mock (item 2)
- **Melhor Envio cart/checkout/generate** — nenhuma chamada real feita (item 1b)

Ambos valem um teste em sandbox antes de confiar em produção.
