import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = "https://huumorikauppa.fi"

interface OrderShippedProps {
  customerName?: string
  orderId?: string
  carrier?: string
  trackingCode?: string
  trackingUrl?: string
}

const OrderShippedEmail = ({ customerName, orderId, carrier, trackingCode, trackingUrl }: OrderShippedProps) => {
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : null
  return (
    <Html lang="fi" dir="ltr">
      <Head />
      <Preview>Pakettisi on matkalla!{shortId ? ` Tilaus #${shortId}` : ''} - Huumorikauppa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Pakettisi on lahtenyt! 📦</Heading>
          {shortId && (
            <Section style={orderIdBox}>
              <Text style={orderIdText}>Tilausnumero: <strong>#{shortId}</strong></Text>
            </Section>
          )}
          <Text style={text}>
            {customerName ? `Hei ${customerName}!` : 'Hei!'} Tilauksesi on lahetetty ja on nyt matkalla sinulle.
          </Text>

          {(carrier || trackingCode) && (
            <Section style={trackingBox}>
              {carrier && (
                <Text style={trackingRow}>
                  Kuljetusyhtion: <strong>{carrier}</strong>
                </Text>
              )}
              {trackingCode && (
                <Text style={trackingRow}>
                  Seurantakoodi: <strong>{trackingCode}</strong>
                </Text>
              )}
              {trackingUrl && (
                <Text style={trackingRow}>
                  Seuraa pakettia: {trackingUrl}
                </Text>
              )}
            </Section>
          )}

          <Text style={text}>
            Arvioitu toimitusaika: 1-5 arkipaivaa lahetyspaivasta.
          </Text>
          <Text style={text}>
            Jos paketti ei saavu 10 arkipaivan sisalla, vastaa tahan viestiin.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Kysyttavaa? Vastaa tahan viestiin, niin autamme.
          </Text>
          <Text style={footer}>
            Terveisin, Huumorikauppa-tiimi
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: OrderShippedEmail,
  subject: (data) => data.orderId
    ? `Pakettisi on matkalla! Tilaus #${String(data.orderId).slice(0, 8).toUpperCase()} - Huumorikauppa`
    : 'Pakettisi on matkalla! - Huumorikauppa',
  displayName: 'Lahetysilmoitus',
  previewData: {
    customerName: 'Matti',
    orderId: 'abc12345-def6-7890',
    carrier: 'Posti',
    trackingCode: 'JJFI12345600001234567890',
    trackingUrl: 'https://www.posti.fi/fi/seuranta#/lahetys/JJFI12345600001234567890',
  },
}

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.02em' }
const orderIdBox = { backgroundColor: '#f0f7ff', borderRadius: '8px', padding: '10px 16px', margin: '0 0 16px' }
const orderIdText = { fontSize: '14px', color: '#333', margin: '0' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const trackingBox = { backgroundColor: '#f0fdf4', border: '2px solid #86efac', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const trackingRow = { fontSize: '15px', color: '#166534', margin: '0 0 8px' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
