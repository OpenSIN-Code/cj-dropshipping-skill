#!/usr/bin/env node
/**
 * Check CJ order status
 * Usage: node scripts/cj/order-status.mjs --order-num SIN-1234567890
 *
 * Returns:
 *   - status (paid, shipped, delivered, etc.)
 *   - trackingNumber
 *   - trackingUrl
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const args = process.argv.slice(2)
function arg(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const orderNum = arg('order-num')
if (!orderNum) {
  console.error('Usage: order-status.mjs --order-num SIN-1234567890')
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

const res = await fetch(`${CJ_BASE}/order/getOrderDetail?orderNum=${orderNum}`, {
  headers: { 'CJ-Access-Token': token },
})

const json = await res.json()

if (!json.result) {
  console.error('✗ Error:', json.message)
  process.exit(1)
}

console.log('📦 Order:', orderNum)
console.log('  Status:', json.data?.orderStatus || '?')
console.log('  Tracking:', json.data?.trackingNumber || '?')
console.log('  Tracking URL:', json.data?.trackUrl || '?')
console.log('  Carrier:', json.data?.logisticName || '?')
console.log('  Total:', json.data?.orderAmount || '?', json.data?.orderCurrency || '?')

// Status code mapping
const STATUS_CODES = {
  1: 'Created (in CJ system)',
  2: 'Paid',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled',
  6: 'Refunded',
}
console.log('\n  Status meanings:', STATUS_CODES)
