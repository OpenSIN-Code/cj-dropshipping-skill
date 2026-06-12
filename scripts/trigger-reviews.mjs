#!/usr/bin/env node
/**
 * Trigger CJ review import cron (on the live site)
 * Usage: SITE_URL=https://shopsin.delqhi.com CRON_SECRET=... node scripts/cj/trigger-reviews.mjs
 */

const SITE_URL = process.env.SITE_URL || 'https://shopsin.delqhi.com'
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('CRON_SECRET fehlt.')
  console.error('Aufruf: SITE_URL=https://shopsin.delqhi.com CRON_SECRET=xxx node scripts/cj/trigger-reviews.mjs')
  process.exit(1)
}

const res = await fetch(`${SITE_URL}/api/cron/cj-reviews`, {
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
})

const body = await res.text()
console.log(`Status: ${res.status}`)
try {
  const json = JSON.parse(body)
  console.log(JSON.stringify(json, null, 2))
} catch {
  console.log(body)
}

if (!res.ok) process.exit(1)
