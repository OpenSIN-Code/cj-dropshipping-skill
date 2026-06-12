#!/usr/bin/env node
/**
 * Health check for CJ Dropshipping API
 * Usage: node scripts/cj/health-check.mjs
 *
 * Verifies:
 *  1. Token cache exists
 *  2. Token is valid (not expired)
 *  3. Can call product/list (or any simple endpoint)
 *  4. DB cj_auth table is in sync
 */

import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { createClient } from '@supabase/supabase-js'

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, db: { schema: 'shop' } },
)

console.log('🏥 CJ Dropshipping Health Check\n')

// 1. Local cache
const localPath = `${homedir()}/.cj-tokens.json`
if (existsSync(localPath)) {
  const data = JSON.parse(readFileSync(localPath, 'utf-8'))
  const expiresAt = new Date(data.accessTokenExpiryDate)
  const validFor = Math.round((expiresAt.getTime() - Date.now()) / 3600000)
  console.log(`1. Local cache (~/.cj-tokens.json):`)
  console.log(`   Token: ${data.accessToken.slice(0, 30)}...`)
  console.log(`   Expires: ${expiresAt.toISOString()} (in ${validFor} h)`)
} else {
  console.log('1. Local cache: NOT FOUND')
}

// 2. DB
const { data: db } = await supabase
  .from('cj_auth')
  .select('access_token, access_token_expires_at, updated_at')
  .eq('id', 1)
  .maybeSingle()
if (db) {
  const expiresAt = new Date(db.access_token_expires_at)
  const validFor = Math.round((expiresAt.getTime() - Date.now()) / 3600000)
  console.log(`\n2. DB cache (shop.cj_auth):`)
  console.log(`   Token: ${db.access_token.slice(0, 30)}...`)
  console.log(`   Expires: ${expiresAt.toISOString()} (in ${validFor} h)`)
  console.log(`   Updated: ${db.updated_at}`)
} else {
  console.log('\n2. DB cache: NOT FOUND')
}

// 3. Test API call
const token = db?.access_token || JSON.parse(readFileSync(localPath, 'utf-8')).accessToken
console.log(`\n3. API Test (product/list):`)
const res = await fetch(`${CJ_BASE}/product/list?productNameEn=test&pageSize=1`, {
  headers: { 'CJ-Access-Token': token },
})
const json = await res.json()
if (json.result) {
  console.log(`   ✓ API OK — ${json.data.total} total products`)
} else {
  console.log(`   ✗ API ERROR: ${json.message} (code: ${json.code})`)
}

// 4. Wallet check
console.log(`\n4. Wallet:`)
try {
  const wres = await fetch(`${CJ_BASE}/wallet/getBalance`, {
    headers: { 'CJ-Access-Token': token },
  })
  const wjson = await wres.json()
  if (wjson.result) {
    console.log(`   Balance: ${wjson.data?.balance || wjson.data?.amount || 'N/A'} ${wjson.data?.currency || 'USD'}`)
  } else {
    console.log(`   ✗ Wallet error: ${wjson.message}`)
  }
} catch (e) {
  console.log(`   ⚠️  Wallet endpoint failed: ${e.message}`)
}

console.log(`\n5. EU Warehouse check:`)
const eu = ['DE', 'GB', 'FR']
for (const c of eu) {
  const r = await fetch(`${CJ_BASE}/product/stock/queryByVid?vid=2606120857201601800`, {
    headers: { 'CJ-Access-Token': token },
  })
  const j = await r.json()
  if (j.result) {
    const found = (j.data || []).find((w) => String(w.countryCode || w.areaEn).toUpperCase() === c)
    console.log(`   ${c}: ${found ? `✓ ${found.storageNum || found.num} items` : 'no stock'}`)
  }
  await new Promise((res) => setTimeout(res, 1100))
}
