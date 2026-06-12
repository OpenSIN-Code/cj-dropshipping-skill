#!/usr/bin/env node
/**
 * Query live stock from CJ Dropshipping warehouses
 * Usage: node scripts/cj/stock-query.mjs --vid 1234:1234,5678:5678
 *
 * Returns EU-priority stock (DE, EU, GB, FR, ES, IT, PL, CZ)
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const EU_WAREHOUSES = new Set(['DE', 'EU', 'GB', 'FR', 'ES', 'IT', 'PL', 'CZ'])
const args = process.argv.slice(2)
function arg(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const vids = (arg('vid') || '').split(',')

async function getToken() {
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) throw new Error('No ~/.cj-tokens.json')
  return JSON.parse(readFileSync(path, 'utf-8')).accessToken
}

const token = await getToken()

for (const vid of vids) {
  const res = await fetch(`${CJ_BASE}/product/stock/queryByVid?vid=${vid.trim()}`, {
    headers: { 'CJ-Access-Token': token },
  })
  const json = await res.json()
  if (!json.result) {
    console.error(`✗ ${vid}: ${json.message}`)
    continue
  }
  const list = Array.isArray(json.data) ? json.data : []
  const eu = list.filter(
    (w) =>
      EU_WAREHOUSES.has(String(w.countryCode || w.areaEn || '').toUpperCase()) &&
      Number(w.storageNum ?? w.num ?? 0) > 0,
  )
  const total = list.reduce((sum, w) => sum + Number(w.storageNum ?? w.num ?? 0), 0)
  console.log(`\n📦 ${vid.trim()}: ${total} total, ${eu.length} EU warehouses with stock`)
  for (const w of eu) {
    const country = w.countryCode || w.areaEn
    const num = w.storageNum ?? w.num
    console.log(`   ${country}: ${num} items`)
  }
  await new Promise((r) => setTimeout(r, 1100))
}
