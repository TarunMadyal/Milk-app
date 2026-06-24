# Manjunath Milk Store Haveri 🥛

A mobile-first, offline-capable PWA to replace the milk distribution notebook.
Built for a one-handed, large-text, minimal-typing experience.

## Features

- **Dashboard** — today's sales, collected amount, total outstanding, today's entries.
- **New Delivery** — pick a shop, tap +/− on products (price auto-selected by
  dealer/regular), auto-calculates product total and new outstanding balance.
  Supports multiple products per delivery and **Repeat Last Delivery**.
- **Mark Paid** — record a payment without a delivery.
- **Customer History** — per-shop timeline of deliveries, payments and running
  balance; one-tap **WhatsApp** balance share.
- **Reports** — daily / weekly / monthly sales, total outstanding, top customers,
  highest pending balances.
- **Settings** — dark mode, edit regular & dealer prices, add/edit/remove shops,
  export JSON/CSV, backup & restore, reset.

### Dealer pricing

Each product stores a `regularPrice` and `dealerPrice`. Customers flagged as
dealers (**Ashpak, Shiraj, Narjund**) automatically get dealer prices; everyone
else gets regular prices. The price is snapshotted on each delivery so editing a
price later never changes past records.

## Formulas

```
Product Total      = Σ (Quantity × Unit Price)
Outstanding Balance = Previous Balance + Product Total − Amount Paid
```

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (mobile-first, 360px-first, large touch targets)
- Local Storage persistence behind a single `storage.ts` interface
  (swap to Supabase/Firebase later by editing one file)
- PWA: installable, offline-first service worker

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Regenerate app icons (optional):

```bash
npm run gen:icons
```

## Deploy (PWA on Vercel)

1. Push this repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) → deploy (no config needed).
3. On Android Chrome, open the URL → menu → **Add to Home screen**.
   It installs like a real app, opens fullscreen, and works offline.

## Data & privacy

All data is stored locally on the device (browser localStorage). Use
**Settings → Export & Backup** to download a JSON backup regularly. A future
version can sync to Supabase for automatic cloud backup.
