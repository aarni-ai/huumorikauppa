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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>Vahvista sähköpostin vaihto – Huumorikauppa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vahvista sähköpostin vaihto ✉️</Heading>
        <Text style={text}>
          Pyysit vaihtavasi Huumorikaupan tilisi sähköpostiosoitteen{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          →{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>Klikkaa alla olevaa nappia vahvistaaksesi vaihdon:</Text>
        <Button style={button} href={confirmationUrl}>
          Vahvista vaihto
        </Button>
        <Text style={footer}>
          Jos et pyytänyt vaihtoa, suosittelemme suojaamaan tilisi heti.
        </Text>
        <Text style={footer}>Terveisin, Huumorikauppa-tiimi 😊</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
