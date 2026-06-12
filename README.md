# CJ Dropshipping Skill

> Comprehensive CJ Dropshipping API skill for opencode agents — product search, import, sync, orders, freight, reviews, token management.

## What this skill provides

- **Product search & import**: search CJ catalog, import to Supabase with full variants + images
- **Order creation & tracking**: create orders via CJ API, track status, manage fulfillment
- **Freight calculation**: real-time shipping cost from CJ warehouses to destination
- **Review import**: fetch CJ product reviews, aggregate to product ratings
- **Stock sync**: query live stock from CJ warehouses (EU-priority)
- **Token management**: cached OAuth tokens, automatic refresh
- **Category mapping**: German display labels for raw CJ category names
- **Webhook integration**: order status updates, tracking numbers

## Quick start

```bash
# Authenticate (use cached token, refresh if expired)
node scripts/cj/get-token.mjs

# Search products
node scripts/cj/search.mjs "wireless earbuds" 10

# Import a single product by CJ pid
node scripts/cj/import-products.mjs --pid 2606120857201601800

# Import a batch by keyword
node scripts/cj/import-products.mjs --keyword "sneaker" --limit 20

# Calculate freight
node scripts/cj/freight.mjs --vid 1234:1234 --country DE

# Create order (programmatic)
node scripts/cj/create-order.mjs --customer "Max" --vid 1234 --qty 1
```

## File structure

```
cj-dropshipping-skill/
├── README.md
├── SKILL.md
├── scripts/
│   ├── get-token.mjs           # OAuth token cache + refresh
│   ├── search.mjs              # product search
│   ├── import-products.mjs     # import to Supabase
│   ├── backfill-product-data.mjs  # refresh existing products
│   ├── freight.mjs             # shipping cost
│   ├── create-order.mjs        # place order
│   ├── order-status.mjs        # check order status
│   ├── reviews.mjs             # fetch product reviews
│   ├── stock-query.mjs         # live stock check
│   ├── translate-products-cf.mjs  # translate titles via CF Workers AI
│   ├── trigger-reviews.mjs     # trigger review import cron
│   └── health-check.mjs        # test API + token validity
├── references/
│   ├── auth.md                 # OAuth flow + token cache
│   ├── products.md             # product schema, fields
│   ├── variants.md             # variant structure
│   ├── orders.md               # order flow + status codes
│   ├── freight.md              # shipping methods, EU warehouses
│   ├── reviews.md              # review schema, aggregation
│   ├── stock.md                # warehouse codes, EU priority
│   ├── categories.md           # DE labels, category IDs
│   ├── rate-limits.md          # QPS limits, retry strategy
│   └── sin-supabase-schema.md  # Supabase table layout
├── examples/
│   ├── product-import.md       # full import pipeline
│   ├── order-fulfillment.md    # Stripe → CJ order chain
│   ├── eu-priority-stock.md    # filter by EU warehouse
│   ├── review-aggregation.md   # cron-triggered
│   └── bundle-import.md        # import category bundles
└── templates/
    ├── mapping-config.json     # DE category labels
    └── supabase-import.ts       # TypeScript template
```

## See also

- [CJ Dropshipping API docs](https://developers.cjdropshipping.com/api2.0/v1/)
- [SIN-Shop-Center/SIN-CJDropshipping-Bundle](https://github.com/SIN-Shop-Center/SIN-CJDropshipping-Bundle) — historical 73-endpoint CLI + 75-tool MCP server
