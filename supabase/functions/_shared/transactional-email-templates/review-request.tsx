/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  items?: { name: string; quantity: number }[]
  reviewUrl?: string
}

const Email = ({ customerName = '', items = [], reviewUrl = 'https://huumorikauppa.fi' }: Props) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Miten tilauksesi sujui? Jätä lyhyt arvio – kestää alle minuutin.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hei{customerName ? ` ${customerName}` : ''}! 👋</Heading>
        <Text style={p}>
          Olet ehtinyt jo testailla tilaustasi – mitä mieltä olit? Arviosi auttaa
          muita ostajia ja meitä parantamaan tuotteita.
        </Text>

        {items.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>Tilauksesi:</Text>
            {items.map((it, i) => (
              <Text key={i} style={itemRow}>
                • {it.name}{it.quantity > 1 ? ` × ${it.quantity}` : ''}
              </Text>
            ))}
          </Section>
        )}

        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={reviewUrl} style={button}>
            ⭐ Jätä arvio (kestää alle minuutin)
          </Button>
        </Section>

        <Text style={pSmall}>
          Linkki avaa lyhyen lomakkeen – valitse tähdet ja kirjoita pari sanaa.
          Kiitos jo etukäteen! 🙏
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Et halua arviopyyntöjä jatkossa? <Link style={link} href={`${reviewUrl}&unsubscribe=1`}>Peruuta arviopyynnöt</Link>.
        </Text>
        <Text style={footer}>
          Huumorikauppa.fi · Hauskat lahjat ja huumorituotteet
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Miten tilauksesi sujui? Jätä lyhyt arvio ⭐',
  displayName: 'Review request (10 days after order)',
  previewData: {
    customerName: 'Anna',
    items: [{ name: 'Kalamies-paita', quantity: 1 }, { name: 'Sähkömies-muki', quantity: 2 }],
    reviewUrl: 'https://huumorikauppa.fi/arvostele?token=demo',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0a0a0a' }
const container = { padding: '24px 20px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: '#0a0a0a' }
const p = { fontSize: '15px', lineHeight: '1.55', color: '#0a0a0a', margin: '0 0 16px' }
const pSmall = { fontSize: '13px', lineHeight: '1.5', color: '#444', margin: '12px 0 0' }
const card = { background: '#f6f6f6', borderRadius: '10px', padding: '14px 16px', margin: '16px 0' }
const cardTitle = { fontSize: '13px', fontWeight: 700, color: '#0a0a0a', margin: '0 0 6px' }
const itemRow = { fontSize: '14px', color: '#0a0a0a', margin: '2px 0' }
const button = {
  backgroundColor: '#c6f54f',
  color: '#0a0a0a',
  fontWeight: 700,
  padding: '14px 22px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontSize: '15px',
  display: 'inline-block',
}
const hr = { borderColor: '#eee', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#777', margin: '4px 0' }
const link = { color: '#555', textDecoration: 'underline' }
