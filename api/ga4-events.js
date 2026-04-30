export default async function handler(req, res) {
    if (req.method !== 'POST') {
          res.status(405).json({ error: 'Method not allowed' });
          return;
    }

  const { event, items, value, currency = 'EUR' } = req.body;

  if (!event) {
        res.status(400).json({ error: 'Event name required' });
        return;
  }

  console.log('[GA4 Event Backend]', JSON.stringify({
        event,
        items: items || [],
        value: value || 0,
        currency,
        timestamp: new Date().toISOString()
  }));

  // Forward to GA4 Measurement Protocol (optional)
  if (process.env.GA4_API_SECRET && process.env.GA4_MEASUREMENT_ID) {
        try {
                const ga4Payload = {
                          client_id: req.body.client_id || 'anonymous',
                          non_personalized_ads: true,
                          events: [{
                                      name: event,
                                      params: {
                                                    session_id: req.body.session_id,
                                                    currency,
                                                    value: value || 0,
                                                    items: items?.map(item => ({
                                                                    item_id: item.item_id,
                                                                    item_name: item.item_name,
                                                                    price: item.price,
                                                                    quantity: item.quantity || 1,
                                                                    item_category: item.item_category
                                                    })) || []
                                      }
                          }]
                };

          await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ga4Payload)
          });

          console.log('[GA4] Event forwarded to Google Analytics');
        } catch (error) {
                console.error('[GA4] Measurement Protocol error:', error.message);
        }
  }

  res.status(200).json({
        success: true,
        event: event,
        itemsCount: items?.length || 0,
        timestamp: new Date().toISOString()
  });
}
