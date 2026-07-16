'use client';

import React, { useEffect, useState } from 'react';
import LegalLayout from '../../shared/components/views/LegalLayout';

const fallbackContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Trading Risk Disclosure</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Algorithmic trading involves high financial risks. Growffiy represents a software deployment tool and is not a registered financial advisor (SEBI or otherwise). Past performance metrics are simulated and do not guarantee future profitability. Clients assume full liability for trade outcomes.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> API Integration Agreement</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">By connecting your Zerodha Kite token credentials, you authorize Growffiy to place automated trades on your behalf. Standard broker charges (brokerage, STT, exchange transaction charges) apply directly to your broker ledger.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Subscription &amp; Payments</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Subscription fees are billed in advance based on the selected Monthly, Quarterly, or Yearly plans. All payments processed via Razorpay are final and non-refundable unless specified otherwise in the Refund Policy.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> Service Availability</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">While we strive for 100% execution uptime, Growffiy is not liable for system delays, broker API downtime, internet latency, or order cancellation failures that impact trade execution times.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> Account Termination</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffiy reserves the right to suspend or terminate accounts that violate these terms, engage in unauthorized use of the platform, or attempt to reverse-engineer or replicate any part of the system.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">6</span> Governing Law</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">These terms are governed by the laws of India. Any disputes arising from use of the platform shall be subject to the exclusive jurisdiction of courts located in Mumbai, Maharashtra.</p>`;

export default function TermsPage() {
  const [content, setContent] = useState(fallbackContent);
  const [lastUpdated, setLastUpdated] = useState('June 10, 2026');

  useEffect(() => {
    fetch('/api/settings/legal')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_terms_content) {
          setContent(data.settings.legal_terms_content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LegalLayout title="Terms & Conditions" lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalLayout>
  );
}
