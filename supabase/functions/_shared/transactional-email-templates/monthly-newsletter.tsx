import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Huumorikauppa'

interface MonthlyNewsletterProps {
  products?: Array<{ name: string; price: number; url: string; image?: string }>
}

const MonthlyNewsletter = ({ products = [] }: MonthlyNewsletterProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Kuukauden parhaat naurut & uutuudet – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kuukauden parhaat naurut & uutuudet 😂</Heading>
        <Text style={text}>
          Hei naurun ystävä! Pakkasimme sinulle kuukauden hauskimmat tuotteet ja
          mehukkaan tarjouksen. Toivottavasti hymy nousee jo nyt – meiltä se
          herää viimeistään kassalla. 😎
        </Text>

        {products.length > 0 && (
          <Section style={{ margin: '20px 0' }}>
            <Heading as="h2" style={h2}>🔥 Kuukauden suosikit</Heading>
            {products.map((p, i) => (
              <Section key={i} style={productRow}>
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} width="80" height="80" style={productImg} />
                )}
                <Text style={productName}>
                  <a href={p.url} style={productLink}>{p.name}</a>
                </Text>
                <Text style={productPrice}>{p.price.toFixed(2)} €</Text>
              </Section>
            ))}
          </Section>
        )}

        <Section style={codeBox}>
          <Text style={codeLabel}>Käytä koodia kassalla:</Text>
          <Text style={codeValue}>HUUMORI5</Text>
          <Text style={codeDesc}>Saat -5 % alennuksen seuraavasta tilauksestasi 🎁</Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button style={button} href="https://huumorikauppa.fi/kaikki-tuotteet">
            Selaa hauskoja tuotteita 🛒
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          📦 Toimitukset 3–10 arkipäivässä<br />
          🔄 14 päivän vaihto- ja palautusoikeus<br />
          💯 100 % suomalainen yritys
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Saatko sähköpostimme? Vastaa sähköpostiin huumorikauppa@gmail.com tai käytä alla olevaa peruutuslinkkiä.
        </Text>
        <Text style={footer}>
          Terveisin, {SITE_NAME}-tiimi 😊
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MonthlyNewsletter,
  subject: 'Kuukauden parhaat naurut & uutuudet – -5 % koodilla HUUMORI5',
  displayName: 'Kuukausittainen uutiskirje',
  previewData: {
    products: [
      { name: 'Hauska Kalamies T-paita', price: 24.9, url: 'https://huumorikauppa.fi', image: '' },
      { name: 'Meemi-muki', price: 14.9, url: 'https://huumorikauppa.fi', image: '' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.02em' }
const h2 = { fontSize: '18px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = { backgroundColor: '#f0fdf4', border: '2px dashed #7ec832', borderRadius: '12px', padding: '20px', margin: '20px 0', textAlign: 'center' as const }
const codeLabel = { fontSize: '13px', color: '#555555', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const codeValue = { fontSize: '32px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 8px', letterSpacing: '0.1em', fontFamily: "'Anton', 'Impact', sans-serif" }
const codeDesc = { fontSize: '14px', color: '#333333', margin: '0' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const button = { backgroundColor: '#7ec832', color: '#0a0a0a', fontWeight: 'bold' as const, fontSize: '15px', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
const productRow = { padding: '8px 0', borderBottom: '1px solid #f0f0f0' }
const productImg = { borderRadius: '6px', verticalAlign: 'middle' as const, marginRight: '12px' }
const productName = { fontSize: '14px', fontWeight: 'bold' as const, color: '#111111', margin: '0', display: 'inline-block' }
const productLink = { color: '#111111', textDecoration: 'none' }
const productPrice = { fontSize: '14px', color: '#7ec832', fontWeight: 'bold' as const, margin: '4px 0 0' }