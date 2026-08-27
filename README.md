# Alcove Atelier

E-commerce store for a Kenyan home-décor maker — custom mirrors and bespoke
furnishings. Storefront, checkout, customer accounts, order tracking and a full
admin dashboard.

**Live:** [alcove-altier.vercel.app](https://alcove-altier.vercel.app)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma ·
Postgres (Supabase) · Vercel

## Features

- **Shop** — catalogue with search and filtering by category, colour, size, price
  and availability; product pages with galleries and customer reviews.
- **Checkout** — pay on delivery (Nairobi), M-Pesa Paybill, or WhatsApp for
  bespoke commissions. Delivery is zone-aware: a courier fee outside Nairobi is
  quoted once the destination is known.
- **Accounts** — order history and live progress tracking. Guests can track an
  order by reference and email, so buying never requires an account.
- **Admin** — products, categories, stock, orders, staff access, and
  weekly/monthly/yearly sales reports with CSV export. Alerts for new orders,
  payments and low stock.
- **Email** — order confirmations, status updates and review invitations.
- **SEO** — per-page metadata, JSON-LD, dynamic Open Graph images, sitemap.

## Notable implementation details

- Uploaded photos are normalised server-side with `sharp` to fixed dimensions,
  so the catalogue stays uniform whatever the client photographs with. Images
  close to the target ratio are cropped; ones far off are fitted on a brand
  background rather than butchered.
- Storefront pages are statically rendered (ISR) and revalidated on demand when
  the admin saves, so pages stay cache-fast without going stale.
- Sessions are HMAC-signed expiring cookies; passwords hashed with scrypt. Admin
  rights come from the account's role, and unauthorised access returns 404
  rather than 403.
- Payment endpoints read amounts from the database, never from the request body.
- Prisma runs through a connection pooler sized for serverless, with a separate
  direct connection for migrations.

## Structure

```
src/
  app/            routes — storefront, admin, API handlers
  components/     UI by area (shop, admin, checkout, layout)
  lib/            domain logic — orders, users, images, email, reports, seo
prisma/           schema and migrations
docs/             operations manual
```

## Running locally

```bash
npm install
cp .env.example .env    # database URL + session secret
npm run db:setup        # migrate + seed the catalogue
npm run dev
```

Setup, environment variables, deployment and admin guides are in the
[operations manual](docs/OPERATIONS.md).
