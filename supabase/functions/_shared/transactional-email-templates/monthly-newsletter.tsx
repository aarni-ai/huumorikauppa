import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Huumorikauppa'

const MonthlyNewsletter = () => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>5 € alennus uusimpiin hauskoihin tuotteisiin – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kiitos uutiskirjeen tilauksesta! 😂</Heading>
        <Text style={text}>
          Tässä kuukauden hauskimmat tuotteet ja erikoistarjous juuri sinulle.
        </Text>

        <Section style={codeBox}>
          <Text style={codeLabel}>Käytä koodia kassalla:</Text>
          <Text style={codeValue}>HUUMORI5</Text>
          <Text style={codeDesc}>Saat -5 € alennuksen seuraavasta tilauksestasi 🎁</Text>
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
  subject: 'Kuukauden tarjous: -5€ koodilla HUUMORI5 🎁 – Huumorikauppa',
  displayName: 'Kuukausittainen uutiskirje',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px', fontFamily: "'Anton', 'Impact', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.02em' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = { backgroundColor: '#f0fdf4', border: '2px dashed #7ec832', borderRadius: '12px', padding: '20px', margin: '20px 0', textAlign: 'center' as const }
const codeLabel = { fontSize: '13px', color: '#555555', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const codeValue = { fontSize: '32px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 8px', letterSpacing: '0.1em', fontFamily: "'Anton', 'Impact', sans-serif" }
const codeDesc = { fontSize: '14px', color: '#333333', margin: '0' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const button = { backgroundColor: '#7ec832', color: '#0a0a0a', fontWeight: 'bold' as const, fontSize: '15px', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }