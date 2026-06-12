# CJ Dropshipping Authentication

## Account

- **Email**: `CJ5240573@api` (this is the "openId" email, NOT a real email)
- **openId**: `37995`
- **API Key (legacy)**: `CJ5240573@api@d5d074918b1f434995c26af2fc932bb8`
- **Status**: ⚠️ **Email+Password auth DEPRECATED** — returns `code: 1600005, message: "APIkey is wrong"`

## Working auth: OAuth Token

CJ has switched to OAuth2-style tokens. The token is a JWT:

```
API@CJ5240573@CJ:<base64 JWT payload>.<signature>
```

Token claims:
```json
{
  "jti": "37995",
  "type": "ACCESS_TOKEN",
  "sub": "bqLobqQ0lmNnyQpxPWLZykYCSEOI83qmh/4s6Ci53Nf4eQMfHE0imi6Us5r5YjpqeVtTaeHsCGKK6Fiwqely8TcF6EMkIWLY1GVBxGYltOkyjf88oKQmPEn9W9O95U8nKDWT7JPNcTGGraCi6BZ0Ml+rIS176oWigsfWi3vOnfPkW9QOMV6K5gt/vCm66lGQAWqQ7MJgbFqOqzy6Br4oHJxwxbmuCyq1dKYL0o8BfPzddC/YU3CPZX/tEyDuMFeMGYZfh4XMtYw+KEcgnexp17WjCJKiIlRxqHE5RCfDDFd03VXroNcCb7mng9RpKaFm3QpfgxrX+t1iAEvLpPnOsw=="
}
```

## Token Cache (3 layers)

### Layer 1: `~/.cj-tokens.json` (local, fast)

Updated: 2026-05-28 22:49
Valid until: 2026-11-24 21:53:58 +08:00 (~5 months)

```json
{
  "accessToken": "API@CJ5240573@CJ:eyJ...",
  "refreshToken": "API@CJ5240573@CJ:eyJ...",
  "openId": "37995",
  "accessTokenExpiryDate": "2026-11-24T21:53:58+08:00",
  "refreshTokenExpiryDate": "2026-11-24T21:53:58+08:00"
}
```

### Layer 2: `shop.cj_auth` (Supabase DB, shared)

Schema:
```sql
CREATE TABLE shop.cj_auth (
  id int PRIMARY KEY DEFAULT 1,
  access_token text NOT NULL,
  refresh_token text,
  access_token_expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

Query:
```sql
SELECT access_token, access_token_expires_at FROM shop.cj_auth WHERE id = 1;
```

### Layer 3: Fresh auth (fallback)

```bash
POST https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken
Content-Type: application/json

{
  "email": "CJ5240573@api",
  "password": "CJ5240573@api@d5d074918b1f434995c26af2fc932bb8"
}
```

⚠️  Returns `code: 1600005, message: "APIkey is wrong"` since 2025+. Don't rely on this.

## Best practice

```javascript
// 1. Try local cache
const local = readFileSync('~/.cj-tokens.json', 'utf-8')
if (local.accessToken && new Date(local.accessTokenExpiryDate) - Date.now() > 24*3600*1000) {
  return local.accessToken
}

// 2. Try DB
const { data } = await supabase.from('cj_auth').select('*').eq('id', 1).maybeSingle()
if (data?.access_token && new Date(data.access_token_expires_at) - Date.now() > 24*3600*1000) {
  return data.access_token
}

// 3. Refresh (only as last resort — may fail with "APIkey is wrong")
const fresh = await refreshToken()
await supabase.from('cj_auth').upsert({ id: 1, ...fresh })
return fresh.accessToken
```

## Usage in API calls

```bash
curl -H "CJ-Access-Token: $TOKEN" \
  "https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=test&pageSize=1"
```

**Note:** Use header `CJ-Access-Token`, NOT `Authorization: Bearer`.
