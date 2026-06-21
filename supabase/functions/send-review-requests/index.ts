// Sends one review-request email per paid order, ~10 days after creation.
// Triggered by pg_cron. Safe to call repeatedly — only sends once per order.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://huumorikauppa.fi'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Eligible orders: paid, >= 10 days old, no request sent, not unsubscribed, has email
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  const cutoffOldest = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_email, customer_name, items, review_token, created_at')
    .eq('payment_status', 'paid')
    .is('review_request_sent_at', null)
    .eq('review_unsubscribed', false)
    .lte('created_at', tenDaysAgo)
    .gte('created_at', cutoffOldest)
    .not('customer_email', 'is', null)
    .limit(50)

  if (error) {
    console.error('Failed to load orders', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0

  for (const order of orders ?? []) {
    const email = (order.customer_email || '').toLowerCase()
    if (!email) { skipped++; continue }

    // Skip suppressed addresses
    const { data: suppressed } = await supabase
      .from('suppressed_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (suppressed) {
      await supabase.from('orders').update({ review_request_sent_at: new Date().toISOString() }).eq('id', order.id)
      skipped++
      continue
    }

    // Strip shipping/discount/gift-wrap lines from items
    const items = Array.isArray(order.items) ? order.items : []
    const productItems = items.filter((it: any) => {
      const n = (it?.name || '').toLowerCase()
      return n && !n.includes('toimitus') && !n.includes('alennus') && !n.includes('lahjapaketointi')
    })
    if (productItems.length === 0) {
      await supabase.from('orders').update({ review_request_sent_at: new Date().toISOString() }).eq('id', order.id)
      skipped++
      continue
    }

    const reviewUrl = `${SITE_URL}/arvostele?token=${order.review_token}`

    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'review-request',
        recipientEmail: order.customer_email,
        idempotencyKey: `review-request-${order.id}`,
        templateData: {
          customerName: order.customer_name || '',
          items: productItems.map((it: any) => ({ name: it.name, quantity: it.quantity || 1 })),
          reviewUrl,
        },
      },
    })

    if (sendErr) {
      console.error('Send failed for order', order.id, sendErr)
      continue
    }

    await supabase.from('orders').update({ review_request_sent_at: new Date().toISOString() }).eq('id', order.id)
    sent++
  }

  return new Response(JSON.stringify({ sent, skipped, candidates: orders?.length ?? 0 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
