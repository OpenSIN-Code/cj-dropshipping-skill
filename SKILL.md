---
name: cj-dropshipping
description: CJ Dropshipping API skill for opencode agents — product search, import, sync, orders, freight, reviews, token management. Triggers on "CJ", "cj dropshipping", "CJ product", "CJ order", "CJ freight", "CJ review", "CJ sync", "CJ import", "CJ wallet", "CJ token".
version: 1.0.0
author: Jeremy Schulze
license: MIT
---

# CJ Dropshipping Skill

This skill provides instant access to the OpenSIN **CJ Dropshipping** integration — the supplier backend for ShopSIN and all SIN-webshop products.

## When to use

- "Import CJ product" / "sync with CJ" / "CJ catalog"
- "Search CJ for {keyword}" / "find products on CJ"
- "Create order in CJ" / "place CJ order" / "fulfill order"
- "Calculate shipping from CJ" / "CJ freight to Germany"
- "Import reviews from CJ" / "CJ product reviews"
- "Refresh product stock" / "CJ stock check"
- "CJ token expired" / "refresh CJ token" / "CJ auth"
- "EU warehouse" / "CJ EU stock"
- "Translate CJ title to German"
- "CJ wallet" / "CJ balance" / "CJ top up"

## When NOT to use

- Other dropshipping suppliers (Spocket, Zendrop, AutoDS) — use their dedicated skills
- Other shop backends (Shopify, WooCommerce) — different APIs
- Local file imports (CSV upload) — use `csv-import` skill if available

## Quick reference

### Authentication (use cached token!)

```bash
# Read cached token from ~/.cj-tokens.json
# Or from shop.cj_auth table (Supabase)
# NEVER regenerate from email+password (often fails with "APIkey is wrong")

# Direct token usage
CJ_TOKEN="API@CJ5240573@CJ:eyJhbGc..."
curl -H "CJ-Access-Token: $CJ_TOKEN" "https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=test&pageSize=1"

# Or via auth script
node scripts/cj/get-token.mjs
```

### OpenSIN CJ Account

- **Email**: `CJ5240573@api` (legacy, no longer works for auth)
- **openId**: `37995`
- **API Key (legacy)**: `CJ5240573@api@d5d074918b1f434995c26af2fc932bb8` (DEPRECATED, fails)
- **Base URL**: `https://developers.cjdropshipping.com/api2.0/v1`
- **Token Cache (local)**: `~/.cj-tokens.json` (last updated 2026-05-28, valid until 2026-11-24)
- **Token Cache (DB)**: `shop.cj_auth` table, `id=1` row
- **Rate Limit**: 1 QPS (auto-enforced in scripts)

### Common operations

```bash
# Search products
curl -H "CJ-Access-Token: $CJ_TOKEN" \
  "https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=sneaker&pageSize=20"

# Get product detail (with variants)
curl -H "CJ-Access-Token: $CJ_TOKEN" \
  "https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=2606120857201601800"

# Get stock by variant ID
curl -H "CJ-Access-Token: $CJ_TOKEN" \
  "https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=1234:1234"

# Calculate freight
curl -X POST "https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate" \
  -H "CJ-Access-Token: $CJ_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromCountryCode":"CN","toCountryCode":"DE","products":[{"vid":"1234:1234","quantity":1}]}'

# Get product reviews
curl -H "CJ-Access-Token: $CJ_TOKEN" \
  "https://developers.cjdropshipping.com/api2.0/v1/product/reviews?pid=2606120857201601800&pageNum=1&pageSize=20"
```

### EU Warehouse Codes (priority for DE shipping)

```
DE, EU, GB, FR, ES, IT, PL, CZ
```

Filter products with `hasEuStock(vid)` to prefer EU fulfillment (7-15 day shipping to DE vs 30+ from CN).

### Product schema (for Supabase import)

```javascript
const row = {
  // id: deterministic UUID v5 of `cj:{pid}` (shop.products.id is UUID!)
  name: detail.productNameEn,
  slug: `cj-${detail.pid}`,
  description: <stripped html>,
  price: calcPrice(costUsd),  // e.g. ceil(cost * 2.5) - 0.01
  images: [...],          // jsonb
  image_gallery: [...],   // text[] (preferred by view)
  variants: [{
    cj_variant_id, sku, name, price, stock, image_url
  }],                     // jsonb
  stock: sum of variant stocks,
  is_active: true,
  cj_product_id: detail.pid,
  cj_variant_id: firstVariant.vid,
  cj_sku: firstVariant.variantSku,
  cj_cost_price: firstVariant.variantSellPrice,
  cj_last_synced_at: now(),
}
```

### German category labels

See `references/categories.md` for the full map. Example:
- "Bedding Sets" → "Bettwäsche-Sets"
- "Pet Collar, Leash & Harness Sets" → "Halsband-, Leinen- & Geschirr-Sets"
- "Vulcanize Shoe" → "Sneaker"

## Common commands

```bash
# Health check
node scripts/cj/health-check.mjs

# Search
node scripts/cj/search.mjs "wireless earbuds" 10

# Import batch
node scripts/cj/import-products.mjs --keyword "dress" --limit 20

# Backfill existing products
node scripts/cj/backfill-product-data.mjs

# Translate titles
node scripts/cj/translate-products-cf.mjs

# Trigger review import (live)
SITE_URL=https://shopsin.delqhi.com \
  CRON_SECRET=... \
  node scripts/cj/trigger-reviews.mjs
```

## Known issues

- **Email+Password auth fails** with "APIkey is wrong" (since 2025+)
- **Qwen 1.5 / Llama 3.1 deprecated** for Workers AI (use Llama 4 Scout)
- **Rate limit 1 QPS** — scripts auto-sleep 1.1s between calls
- **Token expires after 15d** (refresh) / 180d (long-lived refresh)

## References

- [auth.md](references/auth.md) — OAuth flow + token cache details
- [products.md](references/products.md) — product schema, fields
- [variants.md](references/variants.md) — variant structure
- [orders.md](references/orders.md) — order flow + status codes
- [freight.md](references/freight.md) — shipping methods, EU warehouses
- [reviews.md](references/reviews.md) — review schema, aggregation
- [stock.md](references/stock.md) — warehouse codes, EU priority
- [categories.md](references/categories.md) — DE labels, category IDs
- [rate-limits.md](references/rate-limits.md) — QPS limits, retry strategy
- [sin-supabase-schema.md](references/sin-supabase-schema.md) — Supabase table layout
