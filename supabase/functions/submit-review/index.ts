// Public endpoint: stores a review against the token's order.
// Supports two actions:
//   { action: 'review', token, productName, stars, text, customerName }
//   { action: 'unsubscribe', token }
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a').replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const token = body?.token
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_email, items')
    .eq('review_token', token)
    .maybeSingle()

  if (!order) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.action === 'unsubscribe') {
    await supabase.from('orders').update({ review_unsubscribed: true }).eq('id', order.id)
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // review action
  const productName = (body?.productName || '').toString().trim()
  const stars = Number(body?.stars)
  const text = (body?.text || '').toString().trim().slice(0, 1000)
  const customerName = (body?.customerName || '').toString().trim().slice(0, 80)

  if (!productName || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Verify product belongs to this order
  const items = Array.isArray(order.items) ? order.items : []
  const valid = items.some((it: any) => (it?.name || '').toString().toLowerCase() === productName.toLowerCase())
  if (!valid) {
    return new Response(JSON.stringify({ error: 'product_not_in_order' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Prevent duplicates
  const { data: existing } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('order_id', order.id)
    .ilike('product_name', productName)
    .maybeSingle()
  if (existing) {
    return new Response(JSON.stringify({ error: 'already_reviewed' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { error } = await supabase.from('product_reviews').insert({
    order_id: order.id,
    product_name: productName,
    product_slug: slugify(productName),
    customer_name: customerName || null,
    customer_email: order.customer_email,
    stars,
    text: text || null,
    status: 'pending',
  })

  if (error) {
    console.error('insert failed', error)
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
