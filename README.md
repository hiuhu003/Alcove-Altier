# Alcove Atelier — E-commerce Website

An outstanding, animated, fully responsive store for **Alcove Atelier** (Kenya) —
custom mirrors & bespoke home décor. Built with Next.js 16, TypeScript, Tailwind
CSS v4, Framer Motion and Prisma.

Deployed as **Vercel (frontend) + Supabase (Postgres & image storage)**. The
storefront, cart, WhatsApp/M-Pesa/pay-on-delivery checkout, admin CMS, sales
reports and order alerts all work as soon as the database is connected; email
and analytics light up when the client adds those keys.

---

## ✨ Features (mapped to the brief)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Mobile-responsive design | ✅ Fully responsive, mobile-first |
| 2 | Clear CTAs (Home, Catalogue, Shop now…) | ✅ Throughout, sticky |
| 3 | Simple sticky nav header & menu | ✅ Animated sticky header + mobile menu |
| 4 | Clickable phone & email | ✅ `tel:` / `mailto:` in header, footer, contact |
| 5 | WhatsApp float button | ✅ Floating, with pulse + tooltip |
| 6 | Reviews / testimonials | ✅ Animated testimonial carousel |
| 7 | Social links | ✅ Instagram (+ TikTok/others ready) |
| 8 | Basic SEO | ✅ Per-page metadata, canonicals, OG images, JSON-LD, sitemap, robots |
| 9 | Product catalog & filters | ✅ Search + category, colour, size, price, availability |
| 10 | Secure payments | ✅ M-Pesa Paybill, WhatsApp, pay-on-delivery (Nairobi) |
| 11 | Inventory & order mgmt + email alerts | ✅ Stock tracking, orders, Resend emails |
| 12 | User-friendly CMS dashboard | ✅ `/admin` — add/edit products & images, manage orders |
| 13 | Google Analytics | ✅ Add `NEXT_PUBLIC_GA_ID` to enable |
| 14 | Customer accounts & order tracking | ✅ Sign in/up, order history, guest tracking |

Plus: WhatsApp-first checkout for bespoke pieces, order confirmation emails,
branded 404, reduced-motion support, and in-site toasts/dialogs instead of
browser popups.

---

## 🚀 Getting started

The app runs on **Postgres** (Supabase in production). Create a free Supabase
project first — it takes about two minutes — then:

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL + DIRECT_URL from Supabase
npm run db:setup       # applies migrations, then seeds the real catalogue
npm run dev            # http://localhost:3000
```

- **Storefront:** http://localhost:3000
- **Admin CMS:** http://localhost:3000/admin — sign in at `/signin` with an
  admin account (`npm run make:admin`, see below). `/admin/login` remains as a
  shared-password fallback; in production `ADMIN_PASSWORD` is required and there
  is no default.

### Handy scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build & serve |
| `npm run db:setup` | Apply migrations + seed catalogue |
| `npm run db:deploy` | Apply migrations only (what CI/production runs) |
| `npm run db:push` | Sync schema without a migration (quick local iteration) |
| `npm run db:seed` | Re-seed products |
| `npm run db:studio` | Visual DB browser (Prisma Studio) |

---

## 🔑 Environment variables

Copy `.env.example` → `.env` and fill in. See that file for the full,
commented list.

**Required in production** (the app refuses to guess these):

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432), migrations only |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, OG tags — wrong value breaks SEO |
| `ADMIN_PASSWORD` | Admin login is refused without it |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie |

Everything else is optional — those features degrade gracefully.

- **Contact:** `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL`
- **Image uploads:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- **Analytics:** `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXX`)
- **Search Console:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- **Emails (Resend):** `RESEND_API_KEY`, `ORDER_NOTIFY_EMAIL`
- **Stripe:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **PayPal:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`
- **M-Pesa (Daraja):** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`,
  `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV`, `MPESA_CALLBACK_URL`,
  `MPESA_CALLBACK_TOKEN`

### Where to get the keys
- **M-Pesa** → [Safaricom Daraja](https://developer.safaricom.co.ke) — create an
  app for the "Lipa na M-Pesa Online" (STK Push) API. Needs a Paybill/Till.
- **Stripe** → [dashboard.stripe.com](https://dashboard.stripe.com) → API keys.
- **PayPal** → [developer.paypal.com](https://developer.paypal.com) → app credentials.
- **Resend** → [resend.com](https://resend.com) → API key + verify the sending domain.
- **Google Analytics** → [analytics.google.com](https://analytics.google.com) → GA4 Measurement ID.
- **Supabase** → [supabase.com](https://supabase.com) → Project Settings → Database
  (connection strings) and API (service-role key).

---

## 🖥️ Admin CMS (`/admin`)

The client can, without touching code:
- **Products:** add/edit/delete, upload or paste image URLs, set price, stock,
  colours, sizes, materials, and toggle *Featured / Made-to-order / Published*.
  Filter by **All products / Needs restock / Out of stock** — the dashboard
  cards, the stock-alert list and the alert bell all link straight into these
  views (`/admin/products?stock=low`, or `?q=<product name>` for one piece).
- **Orders:** view every order & its items/customer, change status
  (new → confirmed → fulfilled), mark payments paid, and enter the **delivery
  fee** once the destination is known.
- **Dashboard:** revenue, this month's sales, order counts, stock alerts.
- **Reports:** weekly / monthly / yearly sales reports (see below).
- **Alerts:** the bell in the header (see below).

Set a strong `ADMIN_PASSWORD` before launch.

---

## 📊 Sales reports (`/admin/reports`)

Pick **Weekly**, **Monthly** or **Yearly** and how far back to look (e.g. last
12 weeks, last 12 months, last 5 years). The page shows gross sales, money
actually collected, what's still awaiting payment, average order value, items
sold, unique customers, the best period, a sales trend chart, a per-period
table, best sellers, sales by payment channel, sales by delivery zone and any
stock needing attention.

- **Download report** → a spreadsheet-ready CSV (`/api/admin/reports/export`)
  with every section stacked under a heading. Opens straight in Excel/Sheets.
- **Print / PDF** → the browser print dialog with the admin chrome stripped out,
  so "Save as PDF" produces a clean report.

Cancelled orders are excluded from the sales figures and reported separately.
"Collected" counts only orders whose payment is confirmed — the gap between it
and gross sales is what still needs following up.

---

## 🔔 Admin alerts

The bell in the admin header polls every 30 seconds (and on tab focus) and
raises:

| Alert | When |
|---|---|
| **New order** | a customer places an order — with total, channel, delivery zone and items |
| **Payment received** | an M-Pesa/Stripe/PayPal payment is confirmed |
| **Low stock** | a product drops to 3 or fewer (`LOW_STOCK_THRESHOLD` in `src/lib/notifications.ts`) |
| **Out of stock** | a product hits 0 |

Orders that arrive while the admin has the dashboard open also pop a toast.
Stock is decremented when an order is placed and put back if the order is
cancelled or deleted, so the alerts track real availability. Stock alerts are
de-duplicated and clear themselves as soon as the product is restocked.

---

## 👤 Customer accounts & order tracking

**Checkout requires an account.** Every order belongs to someone who can track
it and be contacted about it — enforced in the API, not just the UI. Shoppers
who aren't signed in see a prompt (with a WhatsApp escape hatch) rather than the
form. One sign-in form serves everyone — `/signin` — and the account's **role**
decides where it lands:
customers go to `/account`, admins go straight to `/admin`. There is no separate
admin URL to remember.

- **`/signup`** — name, email, optional phone, password (8+ characters).
  Any guest orders already placed with that email are adopted into the account.
- **`/account`** — order history, each with a progress tracker
  (Order received → Confirmed → Delivered), what is still owed, delivery zone
  and a WhatsApp button to ask about that specific order.
- **`/track`** — guest tracking by order reference **plus** the email it was
  placed with. Both are required: a five-character reference alone would let
  anyone page through other people's orders.
- Signing in prefills checkout, and orders appear in the account automatically.
- **Baskets belong to the account.** A guest basket carries over on sign-in, and
  signing out empties it — so on a shared device one person's basket is never
  handed to the next. (Per-device: a basket doesn't follow you to another
  browser.)
- Admins can hand a colleague admin access from **Team** in the dashboard by
  entering their email and setting a password; the colleague is emailed the
  details. Someone who already shops here is promoted, not duplicated. You
  can't demote yourself, and the last admin can't be removed.

Passwords are hashed with **scrypt** from Node's own crypto module (not
bcrypt/argon2, which are native modules that complicate serverless builds).
Sessions are signed, expiring cookies that never contain the password.

Create or promote an admin:

```bash
npm run make:admin -- "someone@example.com" "a-strong-password" "Their Name"
```

Safe to re-run — it promotes an existing account and resets its password rather
than creating a duplicate.

---

## ✉️ Emails

There are two ways to send, and the app picks whichever is configured (SMTP
wins if both are). With neither, messages are logged to the server console
instead of sent and nothing else breaks — so the shop works before the client
has an email provider.

**Gmail (no domain needed).** Set `SMTP_USER` to the Gmail address and
`SMTP_PASSWORD` to a Google **App Password** (Google Account → Security →
2-Step Verification, which must be on → App passwords). Roughly 500 messages a
day. Google forces the From address to the authenticated mailbox, so mail
always appears to come from that Gmail account.

**Resend (needs your own domain).** Set `RESEND_API_KEY` and verify the domain
with them, then `EMAIL_FROM` can be `orders@yourdomain`. Better deliverability;
a `@gmail.com` sender is not possible this way.

Either way, **Team → Send me a test** in the dashboard proves the setup and
reports the exact error if it fails.

| Email | When | To |
|---|---|---|
| Order confirmation | an order is placed | customer |
| New order alert | an order is placed | the shop (`ORDER_NOTIFY_EMAIL`) |
| Status update | the admin moves an order along | customer |
| How did we do? | an order is marked **fulfilled** | customer |
| Admin invitation | someone is given admin access | the new admin |

The status email shows the same three-step tracker the customer sees on the
site. The review invitation is only ever sent once per order.

---

## ⭐ Reviews

After delivery the customer gets a "how did we do?" email linking to a star
form — one card per piece in the order, each submitted on its own.

The link carries a signed token tied to the order id: people read email on a
phone that isn't logged in, and a login wall kills the response rate, so the
token is what proves they received the invitation. A review can only be left
for a product that was actually in that order, and re-opening the link edits
the existing review rather than adding another.

Reviews appear under the product with the average rating, and feed the
`rating` / `reviews` columns that the shop and the Product structured data read.

---

## 🛒 How checkout works

Checkout offers three methods:

- **Pay on delivery:** shown for Nairobi & environs only — the customer pays the
  rider (cash or M-Pesa) when the order arrives.
- **WhatsApp** (recommended for bespoke): builds a pre-filled order message —
  works immediately, no accounts.
- **M-Pesa:** pay to the KCB Paybill in `src/lib/site.ts` and enter the
  confirmation code, which is saved on the order for reconciliation. (The Daraja
  STK-push route and its callback at `/api/checkout/mpesa/callback` are still in
  the codebase for whenever the client gets Daraja keys.)

**Card (Stripe) and PayPal are not offered at checkout.** The API routes
(`/api/checkout/stripe`, `/api/checkout/paypal`) and their return handlers are
left in place, so re-enabling them is a matter of adding the two entries back to
the `methods` array in `src/components/checkout/CheckoutClient.tsx`.

- **Pay on delivery:** offered only for Nairobi & environs — the customer pays
  the rider (cash or M-Pesa) when the order arrives.

Every order is saved to the database and (with Resend configured) emails the
business + customer.

---

## 🚚 Delivery zones

Configured in `src/lib/delivery.ts` (zone copy, the Nairobi area suggestions
used by the checkout autocomplete, and the shared policy lines):

- **Nairobi & environs** — we deliver ourselves, so **payment on delivery** is
  available. Any delivery charge is confirmed when the shop calls.
- **Outside Nairobi** — sent by courier, so the **delivery fee depends on the
  destination**. It's quoted after the order is placed (admin enters it on the
  order) and settled before dispatch.

The customer picks a zone at checkout — typing a recognised town/estate
pre-selects it — and the policy is repeated on product pages, the cart, the
order-confirmation page, the footer, the contact page and both order emails.
Reports break sales down by zone.

---

## 🌍 Deployment — Vercel + Supabase

### 1. Supabase (database + image storage)

1. Create a project at [supabase.com](https://supabase.com). Save the database
   password — it appears in the connection strings.
2. **Project Settings → Database → Connection string** gives you both URLs:
   - *Transaction pooler* (port **6543**) → `DATABASE_URL`
     — append `?pgbouncer=true&connection_limit=1`
   - *Direct connection* (port **5432**) → `DIRECT_URL`
3. **Storage → New bucket** → name it `product-images` and mark it **Public**
   (product photos are meant to be publicly readable; uploads still require an
   admin session because they go through our own API with the service-role key).
4. Apply the schema and seed the catalogue from your machine:

   ```bash
   npm run db:setup     # prisma migrate deploy && tsx prisma/seed.ts
   ```

### 2. Vercel (the site)

1. Push the repo to GitHub, then **Add New → Project** on Vercel and import it.
   The framework, build command (`prisma generate && next build`) and output are
   detected automatically.
2. Add the environment variables from `.env.example` under
   **Settings → Environment Variables**. At minimum: `DATABASE_URL`,
   `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`,
   `ADMIN_SESSION_SECRET`, plus the Supabase storage pair and the contact
   details. Mark them for **Production** (and Preview if you want previews to
   work — point those at a *separate* Supabase project so test orders never
   touch live data).
3. Deploy, then add the client's domain under **Settings → Domains** and set
   `NEXT_PUBLIC_SITE_URL` to it. **Redeploy after changing it** — it is baked
   into canonical tags, the sitemap and OG images at build time.

### 3. After the first deploy

- Visit `/admin`, log in with `ADMIN_PASSWORD`, and upload the real product
  photography.
- Submit `https://<domain>/sitemap.xml` in
  [Google Search Console](https://search.google.com/search-console), and set
  `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` for the meta-tag verification method.
- Check a product page in the
  [Rich Results Test](https://search.google.com/test/rich-results) — it should
  report **Product**, **Breadcrumb** and **Merchant listing**.
- Place one real test order end to end, then delete it from `/admin/orders`.

### Migrations later on

Schema changes are versioned in `prisma/migrations/`. After editing
`prisma/schema.prisma`:

```bash
npm run db:migrate       # creates the migration locally
npm run db:deploy        # applies it to Supabase
```

Vercel does **not** run migrations during a build (a failed migration would take
the site down mid-deploy), so run `db:deploy` yourself before shipping a schema
change.

---

## 🔒 Security

What is in place, and what the client still owns:

| Area | Measure |
|------|---------|
| Admin sessions | Signed, expiring cookie (`<expiry>.<nonce>.<HMAC>`) — httpOnly, SameSite=Lax, Secure in production. The password is never stored in the cookie. |
| Admin login | Refused outright in production if `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` are unset — no default password ever ships. Constant-time comparison; 8 attempts per IP per 15 min. |
| Admin API | Every `/api/admin/*` route goes through one guard (`guardAdminApi`) that checks the session **and** the request origin. |
| CSRF | Same-origin check on all state-changing endpoints, on top of SameSite cookies. |
| Rate limits | Login, orders, newsletter and the payment routes are throttled per IP. |
| Payments | Amounts are read from the stored order, never from the request body — a client cannot set its own price. |
| M-Pesa callback | Authenticated by `MPESA_CALLBACK_TOKEN` in the callback URL; refuses to mark orders paid in production without it. Replay-safe. |
| Uploads | Admin-only, 8 MB cap, MIME allow-list (no SVG), server-generated filenames, stored in Supabase rather than the read-only serverless disk. |
| Headers | CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy. `X-Powered-By` removed. |
| Secrets | `SUPABASE_SERVICE_ROLE_KEY` and all payment keys are server-only (never `NEXT_PUBLIC_`). `.env` and `*.db` are gitignored. |
| Error handling | Database/upstream errors are logged server-side and returned as generic messages. |

Known and accepted:

- **Rate limiting is per serverless instance**, not global — it stops the common
  single-client flood. Swap `src/lib/rate-limit.ts` for Upstash Redis if the
  store ever needs a shared counter.
- **CSP allows `'unsafe-inline'` for scripts**, which Next.js requires for its
  bootstrap unless nonces are threaded through a proxy. Everything else is
  locked down.
- `npm audit` reports advisories in the **Prisma CLI** dependency chain
  (`@prisma/config` → `deepmerge-ts`). That is a build-time tool, not shipped to
  users; clearing it needs a Prisma 8 upgrade.

---

## 🔍 SEO

| Feature | Where |
|---------|-------|
| Per-page titles, descriptions, canonicals | Every route; category views get their own (`/shop?category=…`) |
| Structured data | `HomeGoodsStore` + `WebSite` (site-wide), `Product` with real stock/price/delivery, `BreadcrumbList`, `ItemList` |
| Open Graph / Twitter cards | Generated brand card at `/opengraph-image`; product pages use their own photo |
| Sitemap | `/sitemap.xml` — includes product images and real timestamps, regenerated hourly and on every catalogue save |
| robots.txt | Allows the storefront, blocks `/admin`, `/checkout`, `/api`; preview deployments are blocked entirely |
| Rendering | Storefront pages are cached (ISR) so crawlers get fast static HTML; admin saves purge the cache immediately |
| Manifest | `/manifest.webmanifest` for add-to-home-screen |

Structured data is built in `src/lib/seo.ts` — one place to edit if the business
details change.

---

## ✅ Before launch — replace these
- **Contact details** in `src/lib/site.ts` (phone, email, WhatsApp number, city).
- **Product photos** — the catalogue ships with tasteful placeholders; upload the
  client's real photography via `/admin` (or replace the URLs in
  `src/data/catalogue.ts`).
- **Testimonials** in `src/data/testimonials.ts` with real client reviews.
- **Admin password** and session secret (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
- **`NEXT_PUBLIC_SITE_URL`** — must be the live domain, or SEO breaks.

## 🧱 Tech stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Prisma + Supabase Postgres · Supabase Storage · Zustand ·
M-Pesa · Resend · deployed on Vercel.
