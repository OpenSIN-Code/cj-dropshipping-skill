# CJ Rate Limits

## Limits

- **1 QPS** (1 request per second) for most endpoints
- Burst is tolerated but consecutive fast requests get throttled
- 429 or `code: 2000001` "Too Many Requests, QPS limit is 1 time/1second"

## Strategy

Always wait **1.1 seconds** between requests:

```javascript
await new Promise((r) => setTimeout(r, 1100))
```

## Endpoints with different limits

| Endpoint | Limit | Notes |
|----------|-------|-------|
| `/authentication/getAccessToken` | Low | Use cached token instead |
| `/product/list` | 1 QPS | |
| `/product/query` | 1 QPS | |
| `/product/stock/queryByVid` | 1 QPS | |
| `/logistic/freightCalculate` | 1 QPS | |
| `/product/reviews` | 1 QPS | |
| `/order/create*` | Lower | Order endpoints more strict |
| `/wallet/*` | 1 QPS | |

## Retry strategy

```javascript
async function cjWithRetry(path, query, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await cj(path, query)
      return res
    } catch (e) {
      if (e.message.includes('Too Many Requests') && i < maxRetries - 1) {
        const wait = 2 ** i * 2000  // exponential backoff
        console.warn(`Rate-limited, waiting ${wait}ms...`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      throw e
    }
  }
}
```

## Parallel requests

DO NOT parallelize CJ requests. They share the same QPS bucket. Sequential is mandatory.

## Cron timing

- CJ-Sync: every 4-6 hours
- Reviews: daily (since reviews are slow to accumulate)
- Stock: every 4-6 hours (real-time accuracy matters)

## See also

- [auth.md](auth.md) — token caching to avoid auth calls
- [products.md](products.md) — batch import strategy
