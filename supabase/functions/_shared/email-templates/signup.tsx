/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Vahvista sähköpostiosoitteesi – Huumorikauppa 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tervetuloa Huumorikauppaan! 🎉</Heading>
        <Text style={text}>
          Kiitos rekisteröitymisestä{' '}
          <Link href={siteUrl} style={link}>
            <strong>Huumorikauppaan</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Vahvista sähköpostiosoitteesi (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) klikkaamalla alla olevaa nappia:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Vahvista sähköposti
        </Button>
        <Text style={footer}>
          Jos et luonut tiliä, voit jättää tämän viestin huomiotta.
        </Text>
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#7ec832', textDecoration: 'underline' }
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
