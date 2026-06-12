#!/usr/bin/env node
/**
 * Create order in CJ Dropshipping
 * Usage: node scripts/cj/create-order.mjs --vid 1234:1234 --qty 1 --customer "Max" --country DE --city "Berlin"
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const args = process.argv.slice(2)
function arg(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const vid = arg('vid')
const qty = Number(arg('qty') || '1')
const customer = arg('customer')
const country = arg('country') || 'DE'
const city = arg('city') || 'Berlin'
const address = arg('address') || 'Teststrasse 1'
const zip = arg('zip') || '10115'

if (!vid || !customer) {
  console.error('Usage: create-order.mjs --vid 1234:1234 --qty 1 --customer "Max Mustermann"')
  process.exit(1)
}

async function getToken() {
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) throw new Error('No ~/.cj-tokens.json')
  return JSON.parse(readFileSync(path, 'utf-8')).accessToken
}

const token = await getToken()

// Step 1: Create order
const res = await fetch(`${CJ_BASE}/order/createOrderV2`, {
  method: 'POST',
  headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderNumber: `SIN-${Date.now()}`,
    shippingCountryCode: country,
    shippingCountry: country,
    shippingProvince: city,
    shippingCity: city,
    shippingAddress: address,
    shippingZip: zip,
    shippingCustomerName: customer,
    shippingPhone: '+4912345678',
    logisticName: 'CJPacket Ordinary',
    fromCountryCode: 'CN',
    payType: 2,  // 2 = Prepaid (already paid via Stripe)
    products: [{ vid, quantity: qty }],
  }),
})

const json = await res.json()

if (!json.result) {
  console.error('✗ CJ order failed:', json.message)
  process.exit(1)
}

console.log('✓ CJ order created:')
console.log(JSON.stringify(json.data, null, 2))
