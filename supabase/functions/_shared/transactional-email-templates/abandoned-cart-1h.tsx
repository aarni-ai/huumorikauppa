import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  items?: Array<{ name: string; quantity: number; price: number; image?: string | null }>
  cartTotal?: string
  restoreUrl?: string
}

const Email = ({ items = [], cartTotal, restoreUrl }: Props) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Jätit nämä tuotteet koriin – haluatko jatkaa? 🛒</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Jäikö jotain mieleen? 🛒</Heading>
        <Text style={text}>
          Hei! Huomasimme, että jätit muutaman tuotteen ostoskoriin. Ei hätää –
          tallensimme ne sinulle, joten voit jatkaa ostoksia siitä mihin jäit.
        </Text>

        {items.length > 0 && (
          <Section style={itemsSection}>
            {items.map((it, i) => (
              <Section key={i} style={itemRow}>
                {it.image && (
                  <Img src={it.image} alt={it.name} width="64" height="64" style={itemImg} />
                )}
                <Text style={itemText}>
                  {it.quantity}× {it.name} – {it.price.toFixed(2)} €
                </Text>
              </Section>
            ))}
            {cartTotal && <Text style={totalText}>Yhteensä: {cartTotal} €</Text>}
          </Section>
        )}

        <Section style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button style={button} href={restoreUrl}>Palaa ostoskoriin 🛍️</Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Jäikö jotain mieleen? Ostoskorisi odottaa 🛒',
  displayName: 'Hylätty kori – 1h',
  previewData: {
    items: [{ name: 'Hauska muki', quantity: 1, price: 19.95 }],
    cartTotal: '19.95',
    restoreUrl: 'https://huumorikauppa.fi/palauta-kori?token=demo',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const itemsSection = { backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const itemRow = { margin: '0 0 8px' }
const itemImg = { borderRadius: '6px', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }
const itemText = { fontSize: '14px', color: '#333', display: 'inline-block', verticalAlign: 'middle', margin: 0 }
const totalText = { fontSize: '16px', fontWeight: 'bold' as const, color: '#111', margin: '12px 0 0' }
const button = { backgroundColor: '#7ec832', color: '#0a0a0a', fontWeight: 'bold' as const, fontSize: '15px', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }