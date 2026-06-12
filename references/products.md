# CJ Products — Schema, Fields, Common Operations

## Product list endpoint

```
GET /product/list?productNameEn=sneaker&pageSize=20&countryCode=CN
```

Query params:
- `productNameEn` (string) — search keyword
- `pageSize` (1-100, default 20)
- `pageNum` (int) — for pagination
- `countryCode` (string) — source country (CN, US, etc.)
- `categoryId` (string) — filter by category

Response:
```json
{
  "code": 200,
  "result": true,
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "total": 11312,
    "list": [
      {
        "pid": "2606120857201601800",
        "productName": "[\"...\", \"...\", \"...\"]",  // sometimes array
        "productNameEn": "3-in-1 MagSafe Magnetic Wireless Power Bank For Smartwatches",
        "productSku": "CJXXX...",
        "productImage": "https://oss-cf.cjdropshipping.com/product/...",
        "productWeight": "115.00",
        "productType": "ORDINARY_PRODUCT",
        "categoryName": "Home Office Storage",
        "sellPrice": "1.93",
        "categoryId": "87CF251F-8D11-4DE0-A154-9694D9858EB3",
        "supplierId": "9999",
        "shippingCountryCodes": ["CN", "CN_US"],
        "addMarkStatus": "0",
        "saleStatus": 3,
        "listedNum": 1
      }
    ]
  }
}
```

## Product detail endpoint

```
GET /product/query?pid=2606120857201601800
```

Returns the FULL product with all variants:

```json
{
  "code": 200,
  "result": true,
  "data": {
    "pid": "2606120857201601800",
    "productNameEn": "3-in-1 MagSafe Magnetic Wireless Power Bank For Smartwatches",
    "productSku": "CJJT2922027",
    "productImage": "https://oss-cf.cjdropshipping.com/product/...jpg",
    "productImageSet": ["https://...jpg", "https://...jpg", ...],
    "description": "<p><img src=\"...\"/></p>HTML content...",
    "productWeight": "115.00",
    "variants": [
      {
        "vid": "2606120857201601801",
        "variantSku": "CJJT2922027-RED",
        "variantNameEn": "Red",
        "variantKey": "Red",
        "variantImage": "https://...red.jpg",
        "variantSellPrice": "9.29",
        "variantStock": 50,
        "variantWeight": "120.00"
      },
      ...
    ],
    "categoryName": "...",
    "categoryId": "...",
    "threeCategoryName": "...",
    "sellPrice": "9.29"
  }
}
```

## Important fields for Supabase import

| CJ field | Maps to | Notes |
|----------|---------|-------|
| `pid` | `cj_product_id` | Stable ID, like "2606120857201601800" |
| `productNameEn` | `name` (or `title_de` after translation) | English title |
| `description` (HTML) | `description` (after HTML strip) | Strips `<[^>]*>` |
| `sellPrice` (USD) | `cj_cost_price` + calculated `price` (EUR × 2.5) | Markup 2.5x |
| `productImage` | `images[0]` | Main image |
| `productImageSet` | `images[1..n]` | All gallery images |
| `variants[].vid` | `cj_variant_id`, `variants[].cj_variant_id` | Variant ID |
| `variants[].variantSellPrice` | `cj_cost_price` (first) | First variant cost |
| `variants[].variantSku` | `cj_sku`, `variants[].sku` | |
| `variants[].variantNameEn` | `variants[].name` | Color/size label |
| `variants[].variantImage` | `variants[].image_url` | |
| `variants[].variantStock` | `variants[].stock`, sum → `stock` | Total stock |

## Tips

- `productName` (no `En`) sometimes is an array — use `productNameEn`
- `productImageSet` may be a JSON string or array — handle both
- Some products have 0 variants (skip those)
- Some `pid`s start with letter prefixes (legacy) — regex `^[0-9]+$` is too strict
- `productWeight` is in grams
- `productType`: `ORDINARY_PRODUCT`, `CUSTOMIZED_PRODUCT`, etc.
