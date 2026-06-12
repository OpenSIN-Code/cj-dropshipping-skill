#!/usr/bin/env node
/**
 * Search CJ Dropshipping catalog
 * Usage: node scripts/cj/search.mjs "keyword" [limit] [--eu-only]
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const EU_WAREHOUSES = new Set(['DE', 'EU', 'GB', 'FR', 'ES', 'IT', 'PL', 'CZ'])

const [, , keyword, limitArg, ...flags] = process.argv
const limit = Number(limitArg) || 10
const EU_ONLY = flags.includes('--eu-only')

async function getToken() {
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) throw new Error('No ~/.cj-tokens.json — run scripts/cj/get-token.mjs first')
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  return data.accessToken
}

async function search(keyword, token) {
  const url = new URL(`${CJ_BASE}/product/list`)
  url.searchParams.set('productNameEn', keyword)
  url.searchParams.set('pageSize', String(limit))
  url.searchParams.set('countryCode', 'CN')
  const res = await fetch(url, { headers: { 'CJ-Access-Token': token } })
  const json = await res.json()
  if (!json.result) throw new Error(`CJ error: ${json.message}`)
  return json.data
}

async function hasEuStock(vid, token) {
  const url = new URL(`${CJ_BASE}/product/stock/queryByVid`)
  url.searchParams.set('vid', vid)
  const res = await fetch(url, { headers: { 'CJ-Access-Token': token } })
  const json = await res.json()
  const list = Array.isArray(json.data) ? json.data : []
  return list.some(
    (w) =>
      EU_WAREHOUSES.has(String(w.countryCode || w.areaEn || '').toUpperCase()) &&
      Number(w.storageNum ?? w.num ?? 0) > 0,
  )
}

const token = await getToken()
const data = await search(keyword, token)
console.log(`🔍 "${keyword}" — ${data.total} Treffer\n`)

for (const p of data.list) {
  const euMark = EU_ONLY ? '' : ''
  if (EU_ONLY) {
    const ok = await hasEuStock(p.pid, token)
    if (!ok) {
      console.log(`  ⏭️  ${p.productNameEn.slice(0, 50)} | ${p.sellPrice} USD | ${p.pid} (KEIN EU-LAGER)`)
      continue
    }
  }
  console.log(
    `  ✓ ${p.productNameEn.slice(0, 50).padEnd(50)} | ${p.sellPrice.padStart(6)} USD | ${p.pid}`,
  )
  await new Promise((r) => setTimeout(r, 1100)) // 1 QPS
}
