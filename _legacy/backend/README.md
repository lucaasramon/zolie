# Zoliê API

Back-end em Node + Express organizado em camadas, com a camada de dados isolada por trás de
repositórios. Hoje tudo roda **em memória** (`DATA_SOURCE=mock`); trocar para PostgreSQL é
questão de preencher `DATABASE_URL` e mudar uma variável de ambiente.

## Como rodar

```bash
cd backend
cp .env.example .env
npm install
npm run dev      # http://localhost:3333/api/v1
```

## Estrutura

```
backend/
  prisma/
    schema.prisma          modelo completo pensado para PostgreSQL
    seed.js                popula o banco com o mesmo catálogo dos mocks
  src/
    server.js              bootstrap do Express
    app.js                 middlewares + montagem das rotas
    config/env.js          leitura/validação das variáveis de ambiente
    database/
      prismaClient.js      <-- ÚNICO ponto que conhece o Postgres (hoje comentado)
      memoryDb.js          dados em memória (catálogo, usuários, pedidos...)
    repositories/
      index.js             fábrica: escolhe mock ou prisma por DATA_SOURCE
      memory/*.repo.js     implementação em memória (ativa)
      prisma/*.repo.js     implementação Prisma (escrita, aguardando o banco)
    services/              regras de negócio (preço, frete, cupom, estoque, auth)
    controllers/           entrada/saída HTTP, sem regra de negócio
    routes/                definição dos endpoints REST
    middlewares/           auth JWT, admin, validação Zod, erros, async wrapper
    utils/                 slug, moeda, paginação, erros de domínio
```

## Ligando o PostgreSQL depois

1. Suba um Postgres e preencha `DATABASE_URL` no `.env`.
2. `npm run prisma:migrate` (cria as tabelas a partir de `prisma/schema.prisma`).
3. `npm run seed` (opcional — carrega o catálogo de exemplo).
4. Troque `DATA_SOURCE=mock` por `DATA_SOURCE=prisma` e reinicie.

Nenhum service ou controller precisa ser alterado: eles só conhecem a interface do repositório.
Os pontos exatos de troca estão marcados no código com `// >>> POSTGRES <<<`.

## Endpoints

| Recurso | Rotas |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Produtos | `GET /products` (filtros, busca, ordenação, paginação), `GET /products/:slug`, `POST|PUT|DELETE /products/:id` (admin) |
| Categorias | `GET /categories`, `POST|PUT|DELETE /categories/:id` (admin) |
| Endereços | `GET|POST /addresses`, `PUT|DELETE /addresses/:id` |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `POST /cart/shipping`, `POST /cart/coupon` |
| Pedidos | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` (admin) |
| Cupons | `POST /coupons/validate`, `GET|POST|PUT|DELETE /coupons` (admin) |
| Avaliações | `GET /products/:id/reviews`, `POST /products/:id/reviews` |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId` |
| Admin | `GET /admin/dashboard`, `GET /admin/orders`, `POST /auth/admin/login` |

Formato de resposta: `{ "data": ..., "meta": { ... } }`. Erros: `{ "error": { "message", "code" } }`.
