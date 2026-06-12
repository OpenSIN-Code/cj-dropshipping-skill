# CJ Variants

## Structure

CJ products can have **multiple variants** (color, size, etc.). Each variant has its own:

- `vid` (variant ID) — e.g. "2606120857201601801"
- `variantSku` — e.g. "CJJT2922027-RED"
- `variantNameEn` — human-readable name ("Red", "M", "Red / M")
- `variantKey` — sometimes shorter ("Red" vs "Crimson Red")
- `variantSellPrice` (USD) — cost from CJ
- `variantStock` — current stock
- `variantImage` (URL) — variant-specific image (or main image fallback)
- `variantWeight` (grams)

## Import format (for Supabase `variants` JSONB)

```javascript
{
  cj_variant_id: "2606120857201601801",
  sku: "CJJT2922027-RED",
  name: "Red",
  price: 23.99,  // EUR, calculated: ceil(variantSellPrice * 2.5) - 0.01
  stock: 50,
  image_url: "https://...red.jpg"
}
```

This format is what `parseVariants()` in `app/lib/supabase/queries.ts` expects.

## Calculation

```javascript
const cost = Number(v.variantSellPrice ?? 0)
const price = cost > 0 ? Number(calcPrice(cost)) : null
// where calcPrice(costUsd) = ceil(cost * 2.5) - 0.01  (e.g. 9.29 USD → 23.99 EUR)
```

## EU-priority stock

Some variants ship from EU warehouses (DE, GB, FR, ES, IT, PL, CZ) — much faster (7-15 days) than CN (30+).

```javascript
async function hasEuStock(vid) {
  const data = await cj('/product/stock/queryByVid', { vid })
  const list = Array.isArray(data) ? data : []
  return list.some(
    (w) =>
      EU_WAREHOUSES.has(String(w.countryCode || w.areaEn || '').toUpperCase()) &&
      Number(w.storageNum ?? w.num ?? 0) > 0,
  )
}
```

If `hasEuStock` returns true, badge the product as "EU-Lager" for faster shipping.

## Variant count

Some products have **0 variants** (skip these), some have **1-60+ variants** (e.g. bedding sets).

## VariantId format

- Modern: `{productId-padded}{variant-suffix}` like "2606120857201601801"
- Legacy: alphanumeric, like "P001ABC-RED"
- Always string type

## Variant images

Some products have variant-specific images. Use `v.variantImage` if set, else fall back to main `productImage`.
