'use client';

import React from 'react';
import LegalLayout, { LegalSection } from '../../../shared/components/views/LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="June 10, 2026">
      <LegalSection number="1" title="Trading Risk Disclosure">
        <p>
          Algorithmic trading involves high financial risks. Growffiy represents a software deployment tool and is
          not a registered financial advisor (SEBI or otherwise). Past performance metrics are simulated and do not
          guarantee future profitability. Clients assume full liability for trade outcomes.
        </p>
      </LegalSection>

      <LegalSection number="2" title="API Integration Agreement">
        <p>
          By connecting your Zerodha Kite token credentials, you authorize Growffiy to place automated trades on
          your behalf. Standard broker charges (brokerage, STT, exchange transaction charges) apply directly to
          your broker ledger.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Subscription & Payments">
        <p>
          Subscription fees are billed in advance based on the selected Monthly, Quarterly, or Yearly plans. All
          payments processed via Razorpay are final and non-refundable unless specified otherwise in the Refund Policy.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Service Availability">
        <p>
          While we strive for 100% execution uptime, Growffiy is not liable for system delays, broker API downtime,
          internet latency, or order cancellation failures that impact trade execution times.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Account Termination">
        <p>
          Growffiy reserves the right to suspend or terminate accounts that violate these terms, engage in
          unauthorized use of the platform, or attempt to reverse-engineer or replicate any part of the system.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Governing Law">
        <p>
          These terms are governed by the laws of India. Any disputes arising from use of the platform shall be
          subject to the exclusive jurisdiction of courts located in Mumbai, Maharashtra.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
