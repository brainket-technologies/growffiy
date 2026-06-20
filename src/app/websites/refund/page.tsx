'use client';

import React from 'react';
import LegalLayout, { LegalSection } from '../../../shared/components/views/LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="June 10, 2026">
      <LegalSection number="1" title="Non-Refundable Services">
        <p>
          Due to the nature of software services and API integrations, all subscription fees are non-refundable once
          the service has been activated and API credentials have been configured. By subscribing, you acknowledge
          and agree to this policy.
        </p>
      </LegalSection>

      <LegalSection number="2" title="24-Hour Window">
        <p>
          If you have not yet activated your account or configured any API credentials, you may be eligible for a
          full refund within <strong style={{ color: '#0f172a' }}>24 hours</strong> of purchase. Please contact{' '}
          <a href="mailto:support@growffiy.in" style={{ color: '#1E88FF', textDecoration: 'none' }}>
            support@growffiy.in
          </a>{' '}
          within this window to request a refund.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Technical Failures">
        <p>
          In the event of extended platform downtime (greater than 72 consecutive hours) directly caused by Growffiy
          infrastructure failures, pro-rated credit may be applied to the next billing cycle at our discretion. This
          does not cover third-party API (Zerodha/Razorpay) outages.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Subscription Cancellation">
        <p>
          You may cancel your subscription at any time from the client dashboard. Upon cancellation, your account
          will remain active until the end of the current billing period. No partial refunds will be issued for
          unused days in the current period.
        </p>
      </LegalSection>

      <LegalSection number="5" title="How to Request a Refund">
        <p>
          To initiate a refund request, email{' '}
          <a href="mailto:support@growffiy.in" style={{ color: '#1E88FF', textDecoration: 'none' }}>
            support@growffiy.in
          </a>{' '}
          with your Client ID, registered email, and reason for refund. Our team will respond within 2 business days.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
