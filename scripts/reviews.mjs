#!/usr/bin/env node
/**
 * Fetch product reviews from CJ Dropshipping
 * Usage: node scripts/cj/reviews.mjs --pid 2606120857201601800 [--limit 50]
 *
 * Imports reviews into public.reviews (Supabase)
 */

import { createClient } from '@supabase/supabase-js'

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
const args = process.argv.slice(2)
function arg(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

async function getToken() {
  const { readFileSync, existsSync } = await import('node:fs')
  const { homedir } = await import('node:os')
  const path = `${homedir()}/.cj-tokens.json`
  if (!existsSync(path)) throw new Error('No ~/.cj-tokens.json')
  return JSON.parse(readFileSync(path, 'utf-8')).accessToken
}

const token = await getToken()
const pid = arg('pid')
const limit = Number(arg('limit') || '50')

if (pid) {
  // Single product
  await importReviews(pid, limit)
} else {
  // All products with cj_product_id
  const { data: products } = await supabase
    .from('reviews')
    .select('id')
    .limit(0) // No-op to trigger table check
    .then(() => null)

  const { data: p } = await supabase
    .from('products')
    .select('id, cj_product_id')
    .not('cj_product_id', 'is', null)
    .limit(20)

  if (!p || p.length === 0) {
    console.log('No products with cj_product_id')
    process.exit(0)
  }
  for (const product of p) {
    await importReviews(product.cj_product_id, limit)
    await new Promise((r) => setTimeout(r, 1100))
  }
}

async function importReviews(pid, limit) {
  const res = await fetch(`${CJ_BASE}/product/reviews?pid=${pid}&pageNum=1&pageSize=${limit}`, {
    headers: { 'CJ-Access-Token': token },
  })
  const json = await res.json()
  if (!json.result) {
    console.error(`✗ ${pid}: ${json.message}`)
    return
  }
  const list = json.data?.list || []
  console.log(`  ${pid}: ${list.length} reviews`)
  let imported = 0
  for (const r of list) {
    const { error } = await supabase
      .from('reviews')
      .upsert(
        {
          cj_comment_id: String(r.commentId || r.id),
          product_id: null, // Would need to look up by cj_product_id, not pid
          rating: Number(r.star) || 5,
          title: (r.content || '').slice(0, 100),
          content: r.content || '',
          author_name: r.userName || 'Anonym',
          country_code: r.countryCode,
          is_verified: true,
          source: 'cj',
          created_at: r.reviewTime ? new Date(r.reviewTime).toISOString() : new Date().toISOString(),
        },
        { onConflict: 'cj_comment_id' },
      )
    if (!error) imported++
  }
  console.log(`    ${imported}/${list.length} imported`)
}
