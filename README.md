# Laxmi Kirana Store

Neighborhood grocery shop for store pickup, with a customer storefront and a protected owner dashboard.

## Run locally

MySQL 8 has to be running. Create the database once:

```sql
CREATE DATABASE laxmi_kirana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, and `OWNER_PASSWORD`.

```bash
npm install
npm run setup
npm run dev
```

Open http://localhost:3000

Owner dashboard: http://localhost:3000/admin

The owner email and password come from `.env`. Change `OWNER_PASSWORD` before any real deployment.

`npm run db:reset` wipes the catalog and demo orders, then seeds them again. The owner password is always reset to `OWNER_PASSWORD`.

## Branches

`testing` is the branch for day-to-day changes. `main` is production. Merge `testing` into `main` only when a change is ready to go live.

## HTTPS

The app does not terminate TLS itself. In production, Caddy (see `Caddyfile`) sits in front of `npm run start` and gets a free certificate. That needs:

- a real domain name, with DNS pointed at the server
- ports 80 and 443 open on that server
- `NODE_ENV=production` so the owner session cookie is marked secure

Local development stays on http://localhost:3000.

## What you can do

Customers can search, filter, and add products, change quantities, remove items, and place a pickup order with a needed-by time. No payment is collected. Pay at the store.

The owner can watch incoming orders, update status, edit quantities, print packing slips, and manage products, categories, hours, lead time, and optional tax.
