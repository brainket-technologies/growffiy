'use client';

import React from 'react';
import LegalLayout, { LegalSection } from '../../views/components/LegalLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 10, 2026">
      <LegalSection number="1" title="Data Collection">
        <p>
          We collect information provided directly by clients during account registration, including name, email address,
          contact numbers, and Zerodha Kite API keys. We do not store or inspect individual broker passwords or
          transactional banking details.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Key Encryption & Security">
        <p>
          All client credentials (API Key, API Secret, Access Tokens) are encrypted using industry-standard AES-256
          protocols before storage inside the database. Authorization keys are stored in memory and flushed immediately
          upon session timeouts.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Third-Party API Integrations">
        <p>
          Growffiy maps trades using the Zerodha Kite Connect API. Trade requests are authenticated on client behalf
          strictly within user-configured parameters. Payments are securely processed via Razorpay API checkout
          wrappers; no credit card details are stored locally.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Compliance & Consent">
        <p>
          Clients maintain absolute control. Trading can be immediately suspended or revoked by client demand. By
          connecting your broker terminal, you consent to automatic MIS order placement within predefined risk rules.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Data Retention">
        <p>
          Client data is retained for the duration of the subscription and up to 90 days post-cancellation for
          compliance and audit purposes. You may request full data deletion by contacting support@growffiy.in.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Contact Us">
        <p>
          For any privacy-related concerns, please reach out to us at{' '}
          <a href="mailto:support@growffiy.in" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
            support@growffiy.in
          </a>
          . We aim to respond within 2 business days.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
