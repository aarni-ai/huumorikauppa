import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Huumorikauppa"

interface OrderConfirmationProps {
  customerName?: string
  orderTotal?: string
  items?: Array<{ name: string; quantity: number; price: number; customText?: string }>
}

const OrderConfirmationEmail = ({ customerName, orderTotal, items }: OrderConfirmationProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Kiitos tilauksestasi – {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tilausvahvistus 🎉</Heading>
        <Text style={text}>
          {customerName ? `Hei ${customerName}!` : 'Hei!'} Kiitos tilauksestasi {SITE_NAME}sta.
        </Text>
        <Text style={text}>
          Olemme vastaanottaneet tilauksesi ja se on nyt käsittelyssä. Pakettisi lähetetään 1–3 arkipäivän kuluessa.
        </Text>

        {items && items.length > 0 && (
          <Section style={itemsSection}>
            <Text style={itemsHeader}>Tilatut tuotteet:</Text>
            {items.map((item, i) => (
              <Text key={i} style={itemRow}>
                {item.quantity}× {item.name} – {item.price.toFixed(2)} €
                {item.customText ? ` · ✍️ Oma teksti: "${item.customText}"` : ''}
              </Text>
            ))}
          </Section>
        )}

        {orderTotal && (
          <Section style={totalSection}>
            <Text style={totalText}>Yhteensä: {orderTotal} €</Text>
          </Section>
        )}

        <Hr style={hr} />

        <Text style={text}>
          📦 Toimitus: 3–10 arkipäivää (Posti kotiinkuljetus)
        </Text>
        <Text style={text}>
          🔄 14 päivän vaihto- ja palautusoikeus
        </Text>

        <Section style={{ textAlign: 'center' as const, marginTop: '30px' }}>
          <Button style={button} href="https://huumorikauppa.lovable.app/kaikki-tuotteet">
            Jatka shoppailua 🛒
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Ongelmia tilauksesi kanssa? Ota yhteyttä: huumorikauppa@gmail.com
        </Text>
        <Text style={footer}>
          Terveisin, {SITE_NAME}-tiimi 😊
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderConfirmationEmail,
  subject: 'Tilausvahvistus – Huumorikauppa 🎉',
  displayName: 'Tilausvahvistus',
  previewData: {
    customerName: 'Matti',
    orderTotal: '49.90',
    items: [
      { name: 'Hauska t-paita – Setähuumori', quantity: 1, price: 24.95 },
      { name: 'Hauska muki – Kahviaddict', quantity: 1, price: 19.95 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.02em' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const itemsSection = { backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const itemsHeader = { fontSize: '14px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 8px' }
const itemRow = { fontSize: '14px', color: '#555555', margin: '0 0 4px' }
const totalSection = { margin: '0 0 20px' }
const totalText = { fontSize: '18px', fontWeight: 'bold' as const, color: '#111111', margin: '0' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const button = { backgroundColor: '#7ec832', color: '#0a0a0a', fontWeight: 'bold' as const, fontSize: '15px', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }