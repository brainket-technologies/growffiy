'use client';

import React, { useEffect, useState } from 'react';
import LegalLayout from '../../shared/components/views/LegalLayout';

const fallbackContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Data Collection</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">We collect information provided directly by clients during account registration, including name, email address, contact numbers, and Zerodha Kite API keys. We do not store or inspect individual broker passwords or transactional banking details.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> Key Encryption &amp; Security</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">All client credentials (API Key, API Secret, Access Tokens) are encrypted using industry-standard AES-256 protocols before storage inside the database. Authorization keys are stored in memory and flushed immediately upon session timeouts.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Third-Party API Integrations</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffiy maps trades using the Zerodha Kite Connect API. Trade requests are authenticated on client behalf strictly within user-configured parameters. Payments are securely processed via Razorpay API checkout wrappers; no credit card details are stored locally.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> Compliance &amp; Consent</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Clients maintain absolute control. Trading can be immediately suspended or revoked by client demand. By connecting your broker terminal, you consent to automatic MIS order placement within predefined risk rules.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> Data Retention</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Client data is retained for the duration of the subscription and up to 90 days post-cancellation for compliance and audit purposes. You may request full data deletion by contacting support@growffiy.in.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">6</span> Contact Us</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">For any privacy-related concerns, please reach out to us at <a href="mailto:support@growffiy.in" style="color:#1E88FF;text-decoration:none;">support@growffiy.in</a>. We aim to respond within 2 business days.</p>`;

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState(fallbackContent);
  const [lastUpdated, setLastUpdated] = useState('June 10, 2026');

  useEffect(() => {
    fetch('/api/settings/legal')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_privacy_content) {
          setContent(data.settings.legal_privacy_content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LegalLayout title="Privacy Policy" lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalLayout>
  );
}
