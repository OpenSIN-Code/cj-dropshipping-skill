# CJ EU Warehouse Priority

## Why

Shipping from **CN warehouse** to DE: **30+ days** (slow, customer complaints).
Shipping from **EU warehouse** to DE: **7-15 days** (fast, happy customers).

## EU warehouse codes (priority for DE shipping)

```
DE, EU, GB, FR, ES, IT, PL, CZ
```

## Stock query

```
GET /product/stock/queryByVid?vid=1234:1234
```

Response:
```json
[
  {
    "countryCode": "DE",
    "areaEn": "Germany",
    "storageNum": 100
  },
  {
    "countryCode": "GB",
    "areaEn": "United Kingdom",
    "storageNum": 50
  }
]
```

Some warehouses use `areaEn` instead of `countryCode`. Handle both:

```javascript
const country = String(w.countryCode || w.areaEn || '').toUpperCase()
```

## Filter pattern

```javascript
const EU_WAREHOUSES = new Set(['DE', 'EU', 'GB', 'FR', 'ES', 'IT', 'PL', 'CZ'])

function hasEuStock(warehouses) {
  return warehouses.some(
    (w) =>
      EU_WAREHOUSES.has(String(w.countryCode || w.areaEn || '').toUpperCase()) &&
      Number(w.storageNum ?? w.num ?? 0) > 0,
  )
}
```

## Import filter

```bash
# Only import products with EU stock
node scripts/cj/import-products.mjs --keyword "sneaker" --limit 20 --eu-only
```

## Display on PDP

If `hasEuStock(vid)` is true, show badge:
- "🇪🇺 EU-Lager — 7-15 Tage Lieferung" (green)
- Else: "🌏 CN-Lager — 30+ Tage Lieferung" (amber)

## CJ freight calculation

```
POST /logistic/freightCalculate
{
  "fromCountryCode": "CN" or "DE",  // ← use EU warehouse if available
  "toCountryCode": "DE",
  "products": [{"vid": "1234:1234", "quantity": 1}]
}
```

If EU warehouse, `fromCountryCode: "DE"`, freight is ~€5-8.
If CN warehouse, `fromCountryCode: "CN"`, freight is ~€10-15.

## CJ coverage

Not all products are in EU warehouses. Many are CN-only. Filter with `--eu-only` to prioritize.

## Important

- EU warehouse stock **changes frequently** (real-time)
- Run stock sync cron every 4-6 hours
- Update Supabase `stock` field regularly
