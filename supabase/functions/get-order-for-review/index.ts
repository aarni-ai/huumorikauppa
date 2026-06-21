// Public endpoint: given a review_token, returns the order's product items so the
// review form can render. Does NOT leak email/address.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, items, customer_name, review_unsubscribed, created_at')
    .eq('review_token', token)
    .maybeSingle()

  if (error || !order) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch existing reviews to mark already-reviewed items
  const { data: existing } = await supabase
    .from('product_reviews')
    .select('product_name')
    .eq('order_id', order.id)

  const reviewedNames = new Set((existing || []).map((r: any) => (r.product_name || '').toLowerCase()))

  const items = Array.isArray(order.items) ? order.items : []
  const products = items
    .filter((it: any) => {
      const n = (it?.name || '').toLowerCase()
      return n && !n.includes('toimitus') && !n.includes('alennus') && !n.includes('lahjapaketointi')
    })
    .map((it: any) => ({
      name: it.name,
      quantity: it.quantity || 1,
      reviewed: reviewedNames.has((it.name || '').toLowerCase()),
    }))

  return new Response(
    JSON.stringify({
      orderId: order.id,
      customerName: order.customer_name || '',
      products,
      unsubscribed: order.review_unsubscribed,
      createdAt: order.created_at,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
