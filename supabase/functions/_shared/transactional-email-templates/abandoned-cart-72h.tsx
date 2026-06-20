import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  items?: Array<{ name: string; quantity: number; price: number; image?: string | null }>
  cartTotal?: string
  restoreUrl?: string
  discountCode?: string
}

const Email = ({ items = [], cartTotal, restoreUrl, discountCode = 'PALAA10' }: Props) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Viimeinen muistutus: -10 % koodilla {discountCode} 🎁</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Viimeinen tilaisuus – -10 % 🎁</Heading>
        <Text style={text}>
          Halusimme vielä muistuttaa korissasi olevista tuotteista. Kiitokseksi
          kärsivällisyydestäsi tarjoamme <strong>-10 % alennuksen</strong> koko tilauksesta.
        </Text>

        <Section style={codeBox}>
          <Text style={codeLabel}>Käytä koodia kassalla:</Text>
          <Text style={codeValue}>{discountCode}</Text>
        </Section>

        {items.length > 0 && (
          <Section style={itemsSection}>
            {items.map((it, i) => (
              <Section key={i} style={itemRow}>
                {it.image && <Img src={it.image} alt={it.name} width="64" height="64" style={itemImg} />}
                <Text style={itemText}>{it.quantity}× {it.name} – {it.price.toFixed(2)} €</Text>
              </Section>
            ))}
            {cartTotal && <Text style={totalText}>Yhteensä: {cartTotal} €</Text>}
          </Section>
        )}

        <Section style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button style={button} href={restoreUrl}>Lunasta -10 % nyt 🎉</Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Viimeinen muistutus – saat -10 % alennuksen 🎁',
  displayName: 'Hylätty kori – 72h + alennus',
  previewData: {
    items: [{ name: 'Hauska muki', quantity: 1, price: 19.95 }],
    cartTotal: '19.95',
    restoreUrl: 'https://huumorikauppa.fi/palauta-kori?token=demo',
    discountCode: 'PALAA10',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = { border: '2px dashed #e11d48', borderRadius: '10px', padding: '16px', textAlign: 'center' as const, margin: '20px 0' }
const codeLabel = { fontSize: '13px', color: '#666', margin: '0 0 6px' }
const codeValue = { fontSize: '28px', fontWeight: 'bold' as const, color: '#e11d48', letterSpacing: '2px', margin: 0, fontFamily: "'Anton', 'Impact', sans-serif" }
const itemsSection = { backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const itemRow = { margin: '0 0 8px' }
const itemImg = { borderRadius: '6px', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }
const itemText = { fontSize: '14px', color: '#333', display: 'inline-block', verticalAlign: 'middle', margin: 0 }
const totalText = { fontSize: '16px', fontWeight: 'bold' as const, color: '#111', margin: '12px 0 0' }
const button = { backgroundColor: '#e11d48', color: '#ffffff', fontWeight: 'bold' as const, fontSize: '16px', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }