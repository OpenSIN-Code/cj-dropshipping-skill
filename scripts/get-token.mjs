#!/usr/bin/env node
/**
 * Get CJ Dropshipping access token (from cache, refresh if expired)
 * Usage: node scripts/cj/get-token.mjs [--refresh]
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Priority:
 *   1. ~/.cj-tokens.json (local cache, fast)
 *   2. shop.cj_auth (Supabase DB, shared)
 *   3. Regenerate from CJ_EMAIL + CJ_API_KEY (may fail with "APIkey is wrong")
 */

import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { createClient } from '@supabase/supabase-js'

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const args = process.argv.slice(2)
const FORCE_REFRESH = args.includes('--refresh')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, db: { schema: 'shop' } },
)

function getFromLocalCache() {
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

async function getFromDb() {
  const { data } = await supabase
    .from('cj_auth')
    .select('access_token, refresh_token, access_token_expires_at')
    .eq('id', 1)
    .maybeSingle()
  return data
}

async function refreshToken() {
  if (!process.env.CJ_EMAIL || !process.env.CJ_API_KEY) {
    throw new Error('CJ_EMAIL and CJ_API_KEY required to refresh')
  }
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY,
    }),
  })
  const json = await res.json()
  if (!json.result) {
    throw new Error(`CJ auth failed: ${json.message} (code: ${json.code})`)
  }
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
    accessTokenExpiryDate: json.data.accessTokenExpiryDate,
  }
}

async function main() {
  // 1. Try local cache
  if (!FORCE_REFRESH) {
    const local = getFromLocalCache()
    if (local?.accessToken) {
      const expiresAt = new Date(local.accessTokenExpiryDate).getTime()
      const validFor = expiresAt - Date.now()
      if (validFor > 24 * 3600 * 1000) {
        console.log('✓ Using local cache token (valid for', Math.round(validFor / 3600000), 'h)')
        console.log('  Token:', local.accessToken.slice(0, 50) + '...')
        return local.accessToken
      }
    }
  }

  // 2. Try DB
  if (!FORCE_REFRESH) {
    const db = await getFromDb()
    if (db?.access_token) {
      const expiresAt = new Date(db.access_token_expires_at).getTime()
      const validFor = expiresAt - Date.now()
      if (validFor > 24 * 3600 * 1000) {
        console.log('✓ Using DB token (valid for', Math.round(validFor / 3600000), 'h)')
        console.log('  Token:', db.access_token.slice(0, 50) + '...')
        return db.access_token
      }
    }
  }

  // 3. Refresh
  console.log('⚠️  No valid cached token — refreshing from CJ...')
  const fresh = await refreshToken()

  // Update DB
  await supabase.from('cj_auth').upsert({
    id: 1,
    access_token: fresh.accessToken,
    refresh_token: fresh.refreshToken,
    access_token_expires_at: new Date(fresh.accessTokenExpiryDate).toISOString(),
    updated_at: new Date().toISOString(),
  })
  console.log('✓ Token refreshed and saved to DB')
  console.log('  Token:', fresh.accessToken.slice(0, 50) + '...')
  console.log('  Expires:', fresh.accessTokenExpiryDate)
  return fresh.accessToken
}

main()
  .then((t) => {
    if (t) console.log('\nToken ready:', t.slice(0, 30) + '...')
  })
  .catch((e) => {
    console.error('✗ Error:', e.message)
    process.exit(1)
  })
