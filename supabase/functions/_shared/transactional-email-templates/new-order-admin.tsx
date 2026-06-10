import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Huumorikauppa"

interface NewOrderAdminProps {
  customerName?: string
  customerEmail?: string
  orderTotal?: string
  orderId?: string
  stripeSessionId?: string
  shippingAddress?: { address?: string; zip?: string; city?: string }
  items?: Array<{ name: string; quantity: number; price: number; customText?: string }>
}

const NewOrderAdminEmail = ({
  customerName,
  customerEmail,
  orderTotal,
  orderId,
  stripeSessionId,
  shippingAddress,
  items,
}: NewOrderAdminProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>UUSI TILAUS {orderTotal ? `${orderTotal} €` : ''} – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚨 UUSI TILAUS HUUMORIKAUPPAAN</Heading>

        {orderTotal && (
          <Section style={highlightBox}>
            <Text style={highlightText}>Summa: {orderTotal} €</Text>
          </Section>
        )}

        <Section style={detailBox}>
          <Text style={detailHeader}>Asiakas</Text>
          {customerName && <Text style={detailRow}><strong>Nimi:</strong> {customerName}</Text>}
          {customerEmail && <Text style={detailRow}><strong>Sähköposti:</strong> {customerEmail}</Text>}
        </Section>

        {shippingAddress && (shippingAddress.address || shippingAddress.city) && (
          <Section style={detailBox}>
            <Text style={detailHeader}>Toimitusosoite</Text>
            {shippingAddress.address && <Text style={detailRow}>{shippingAddress.address}</Text>}
            {(shippingAddress.zip || shippingAddress.city) && (
              <Text style={detailRow}>{shippingAddress.zip} {shippingAddress.city}</Text>
            )}
          </Section>
        )}

        {items && items.length > 0 && (
          <Section style={detailBox}>
            <Text style={detailHeader}>Tuotteet</Text>
            {items.map((item, i) => (
              <Text key={i} style={detailRow}>
                {item.quantity}× {item.name} – {item.price.toFixed(2)} €
                {item.customText ? <strong> · ✍️ OMA TEKSTI: "{item.customText}"</strong> : null}
              </Text>
            ))}
          </Section>
        )}

        <Hr style={hr} />

        <Section style={detailBox}>
          <Text style={detailHeader}>Tekniset tiedot</Text>
          {orderId && <Text style={detailRowSmall}><strong>Order ID:</strong> {orderId}</Text>}
          {stripeSessionId && <Text style={detailRowSmall}><strong>Stripe Session:</strong> {stripeSessionId}</Text>}
        </Section>

        <Text style={footer}>
          Tämä on automaattinen ilmoitus uudesta tilauksesta. Käsittele tilaus admin-paneelissa.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewOrderAdminEmail,
  subject: (data: Record<string, any>) => `🚨 UUSI TILAUS HUUMORIKAUPPAAN – ${data?.orderTotal || '?'} €`,
  displayName: 'Admin: Uusi tilaus',
  previewData: {
    customerName: 'Matti Meikäläinen',
    customerEmail: 'matti@example.fi',
    orderTotal: '49.90',
    orderId: 'abc-123',
    stripeSessionId: 'cs_test_abc123',
    shippingAddress: { address: 'Esimerkkikatu 1', zip: '00100', city: 'Helsinki' },
    items: [
      { name: 'Hauska t-paita', quantity: 1, price: 24.95 },
      { name: 'Hauska muki', quantity: 1, price: 19.95 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 24px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.02em' }
const highlightBox = { backgroundColor: '#7ec832', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', textAlign: 'center' as const }
const highlightText = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0' }
const detailBox = { backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '14px 18px', margin: '0 0 14px' }
const detailHeader = { fontSize: '12px', fontWeight: 'bold' as const, color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px' }
const detailRow = { fontSize: '14px', color: '#222222', margin: '0 0 4px', lineHeight: '1.5' }
const detailRowSmall = { fontSize: '12px', color: '#555555', margin: '0 0 4px', fontFamily: 'monospace', wordBreak: 'break-all' as const }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0', fontStyle: 'italic' as const }
