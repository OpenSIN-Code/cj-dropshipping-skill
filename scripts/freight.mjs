#!/usr/bin/env node
/**
 * Calculate freight cost from CJ warehouses to destination
 * Usage: node scripts/cj/freight.mjs --vid VID1,VID2 --country DE [--quantity 1]
 *
 * Example:
 *   node scripts/cj/freight.mjs --vid 1234:1234,5678:5678 --country DE
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const args = process.argv.slice(2)
function arg(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const vids = (arg('vid') || '').split(',')
const country = arg('country') || 'DE'
const quantity = Number(arg('quantity') || '1')

async function getToken() {
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) throw new Error('No ~/.cj-tokens.json')
  return JSON.parse(readFileSync(path, 'utf-8')).accessToken
}

const token = await getToken()
const products = vids.map((vid) => ({ vid: vid.trim(), quantity }))

const res = await fetch(`${CJ_BASE}/logistic/freightCalculate`, {
  method: 'POST',
  headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromCountryCode: 'CN',
    toCountryCode: country,
    products,
  }),
})
const json = await res.json()

if (!json.result) {
  console.error('✗ CJ freight error:', json.message)
  process.exit(1)
}

console.log(`\n📦 Freight: CN → ${country}`)
for (const item of json.data) {
  console.log(`  ${item.logisticName.padEnd(40)} | ${item.freightPrice.padStart(6)} ${item.currency} | ETA ${item.deliveryTimeMin}-${item.deliveryTimeMax} days`)
}
