/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Vahvistuskoodisi – Huumorikauppa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vahvistuskoodisi 🔐</Heading>
        <Text style={text}>Käytä alla olevaa koodia vahvistaaksesi henkilöllisyytesi:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Koodi vanhenee pian. Jos et pyytänyt sitä, voit jättää tämän viestin huomiotta.
        </Text>
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#7ec832',
  letterSpacing: '0.1em',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 8px' }
