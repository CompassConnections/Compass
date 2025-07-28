import * as React from 'react';

interface VerificationEmailProps {
  url: string;
}

export function VerificationEmail({ url }: VerificationEmailProps) {
  return (
    <div style={container}>
      <div style={content}>
        <h1 style={heading}>Verify your email</h1>
        <p style={text}>
          Thanks for signing up! Please verify your email address by clicking the button below:
        </p>
        <a href={url} style={button}>
          Verify Email
        </a>
        <p style={text}>
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style={text}>
          <small style={smallText}>
            Or copy and paste this link into your browser:<br />
            <a href={url} style={link}>
              {url}
            </a>
          </small>
        </p>
      </div>
    </div>
  );
}

// Email styles
const container = {
  backgroundColor: '#f6f9fc',
  padding: '20px 0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const content = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const heading = {
  color: '#2d3748',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  padding: 0,
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const smallText = {
  fontSize: '14px',
  color: '#718096',
  lineHeight: '1.5',
};

const button = {
  display: 'inline-block',
  backgroundColor: '#3182ce',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '4px',
  fontWeight: '600',
  marginBottom: '20px',
};

const link = {
  color: '#3182ce',
  wordBreak: 'break-all' as const,
};
