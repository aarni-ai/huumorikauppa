import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AdminAlertProps {
  subject?: string
  body?: string
  details?: string
}

const AdminAlertEmail = ({ subject, body, details }: AdminAlertProps) => (
  <Html lang="fi" dir="ltr">
    <Head />
    <Preview>{subject || 'Huumorikauppa – jarjestelmahavinto'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject || 'Jarjestelmahavinto'}</Heading>
        <Section style={box}>
          <Text style={text}>{body || ''}</Text>
          {details && <Text style={code}>{details}</Text>}
        </Section>
        <Text style={footer}>Huumorikauppa-jarjestelma – {new Date().toISOString()}</Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }
const container = { margin: '0 auto', padding: '20px', maxWidth: '600px', backgroundColor: '#fff' }
const h1 = { fontSize: '20px', color: '#d00', margin: '0 0 16px' }
const box = { background: '#fff3f3', border: '1px solid #fbb', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }
const text = { fontSize: '14px', color: '#333', margin: '0 0 8px' }
const code = { fontSize: '12px', color: '#555', fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const, background: '#f9f9f9', padding: '8px', borderRadius: '4px' }
const footer = { fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '24px' }

export const template: TemplateEntry = {
  component: AdminAlertEmail,
  subject: (data) => data.subject || 'Huumorikauppa – jarjestelmahavinto',
  displayName: 'Admin Alert',
  previewData: { subject: 'Testihavinto', body: 'Jotain meni vikaan.', details: 'order_id=abc123' },
}
