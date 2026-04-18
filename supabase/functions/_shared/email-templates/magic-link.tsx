/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Kirjautumislinkkisi – Huumorikauppa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kirjautumislinkkisi 🔑</Heading>
        <Text style={text}>
          Klikkaa alla olevaa nappia kirjautuaksesi Huumorikauppaan. Linkki vanhenee pian.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Kirjaudu sisään
        </Button>
        <Text style={footer}>
          Jos et pyytänyt linkkiä, voit jättää tämän viestin huomiotta.
        </Text>
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 20px',
  fontFamily: "'Anton', 'Impact', sans-serif",
  textTransform: 'uppercase' as const,
  letterSpacing: '0.02em',
}
const text = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const button = {
  backgroundColor: '#7ec832',
  color: '#0a0a0a',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 8px' }
