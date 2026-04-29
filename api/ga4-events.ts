import type { VcercelRequest, VcercelResponse } from '@vercel/node';

interface GA4Event {
    name: string;
    params: Record<string, any>;
}

interface EcommerceItem {
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
    item_category?: string;
}

export default async function handler(
    req: VcercelRequest,
    res: VcercelResponse
  ) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const { event, items, value, currency = 'EUR' } = req.body;

  if (!event) {
        return res.status(400).json({ error: 'Event name required' });
  }

  // Log event to backend (Firebase, custom analytics, etc)
  const ga4Event: GA4Event = {
        name: event,
        params: {
                currency,
                items: items || [],
                value: value || 0,
                timestamp: new Date().toISOString()
        }
  };

  console.log('[GA4 Event]', JSON.stringify(ga4Event));

  // Forward to GA4 Measurement Protocol
  if (process.env.GA4_API_SECRET && process.env.GA4_MEASUREMENT_ID) {
        try {
                const ga4Response = await fetch(
                          'https://www.google-analytics.com/mp/collect',
                  {
                              method: 'POST',
                              body: JSON.stringify({
                                            client_id: req.body.client_id || 'anonymous',
                                            non_personalized_ads: true,
                                            events: [
                                              {
                                                                name: event,
                                                                params: {
                                                                                    session_id: req.body.session_id,
                                                                                    currency,
                                                                                    value,
                                                                                    items: items?.map((item: EcommerceItem) => ({
                                                                                                          item_id: item.item_id,
                                                                                                          item_name: item.item_name,
                                                                                                          price: item.price,
                                                                                                          quantity: item.quantity || 1,
                                                                                                          item_category: item.item_category
                                                                                      }))
                                                                }
                                              }
                                                          ]
                              }),
                              headers: {
                                            'Content-Type': 'application/json'
                              }
                  }
                        );

          if (!ga4Response.ok) {
                    console.warn('[GA4] Measurement Protocol response:', ga4Response.status);
          }
        } catch (error) {
                console.error('[GA4] Send failed:', error);
        }
  }

  // Return success
  return res.status(200).json({
        success: true,
        event: event,
        itemsCount: items?.length || 0
  });
}

// Client-side helper for easy integration
declare global {
    interface Window {
          trackGA4Event?: (
                  eventName: string,
                  items?: EcommerceItem[],
                  value?: number
                ) => Promise<void>;
    }
}

// Export SDK initialization
export function initializeGA4() {
    if (typeof window === 'undefined') return;

  window.trackGA4Event = async (
        eventName: string,
        items?: EcommerceItem[],
        value?: number
      ) => {
        try {
                const response = await fetch('/api/ga4-events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                                      event: eventName,
                                      items,
                                      value,
                                      client_id: window.gtag?.('get', 'client_id') || 'anonymous',
                                      session_id: Date.now().toString()
                          })
                });

          if (!response.ok) {
                    console.error('[GA4 Client] Event send failed');
          }
        } catch (error) {
                console.error('[GA4 Client] Error:', error);
        }
  };

  // Auto-track add_to_cart button clicks
  document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.textContent?.includes('koriin') || target.getAttribute('data-track') === 'add-to-cart') {
                const productId = target.getAttribute('data-product-id');
                const productName = target.getAttribute('data-product-name');
                const price = target.getAttribute('data-price');

          if (productId && productName && price) {
                    window.trackGA4Event?.('add_to_cart', [
                      {
                                    item_id: productId,
                                    item_name: productName,
                                    price: parseFloat(price),
                                    quantity: 1
                      }
                              ]);
          }
        }
  });
}
