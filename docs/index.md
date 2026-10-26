# Zoliê

E-commerce de semijoias.

## Stack

- **Next.js** (App Router) + React
- **Prisma** como ORM (schema e migrations em `prisma/`)
- **Vercel** para hospedagem e Vercel Blob para arquivos
- **Asaas** para pagamentos (via webhook)
- **Resend** para e-mails transacionais
- **Microsoft Clarity** para analytics

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e faz o build do Next.js |
| `npm test` | Roda os testes com Vitest |
| `npm run lint` | Roda o ESLint |
| `npm run db:seed` | Popula o banco com dados iniciais |

## Deploy

O build da Vercel **não** aplica migrations. Antes de dar push com mudanças no schema, rode:

```bash
npx prisma migrate deploy
```
