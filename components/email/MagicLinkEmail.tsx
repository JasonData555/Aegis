import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

// Magic link email — sent via Resend from /api/auth/request.

export default function MagicLinkEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your Aegis sign-in link — expires in 15 minutes</Preview>
      <Body style={{ backgroundColor: '#FAFAF8', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2DDD6',
            borderRadius: 16,
            margin: '0 auto',
            maxWidth: 480,
            padding: '32px 40px',
          }}
        >
          <Text style={{ color: '#1C2B2A', fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
            Aegis
          </Text>
          <Text style={{ color: '#3D4F4E', fontSize: 15, lineHeight: '1.7', margin: '0 0 24px' }}>
            Click the button below to sign in to your Aegis scorecard. This link
            expires in 15 minutes and can only be used once.
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
            <Button
              href={url}
              style={{
                backgroundColor: '#2D7A6B',
                borderRadius: 10,
                color: '#FFFFFF',
                display: 'inline-block',
                fontSize: 15,
                fontWeight: 500,
                padding: '14px 24px',
                textDecoration: 'none',
              }}
            >
              Sign in to Aegis
            </Button>
          </Section>
          <Text style={{ color: '#7A908E', fontSize: 12, lineHeight: '1.5', margin: 0 }}>
            If you didn&apos;t request this link, you can safely ignore this email.
            Your data stays private — your email address is never stored with
            your contribution.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
