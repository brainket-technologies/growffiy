'use client';

import React, { useEffect, useState } from 'react';
import LegalLayout from '../../shared/components/views/LegalLayout';

const fallbackContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Non-Refundable Services</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Due to the nature of software services and API integrations, all subscription fees are non-refundable once the service has been activated and API credentials have been configured. By subscribing, you acknowledge and agree to this policy.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> 24-Hour Window</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">If you have not yet activated your account or configured any API credentials, you may be eligible for a full refund within <strong>24 hours</strong> of purchase. Please contact <a href="mailto:support@growffiy.in" style="color:#1E88FF;text-decoration:none;">support@growffiy.in</a> within this window to request a refund.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Technical Failures</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">In the event of extended platform downtime (greater than 72 consecutive hours) directly caused by Growffiy infrastructure failures, pro-rated credit may be applied to the next billing cycle at our discretion. This does not cover third-party API (Zerodha/Razorpay) outages.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> Subscription Cancellation</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">You may cancel your subscription at any time from the client dashboard. Upon cancellation, your account will remain active until the end of the current billing period. No partial refunds will be issued for unused days in the current period.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> How to Request a Refund</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">To initiate a refund request, email <a href="mailto:support@growffiy.in" style="color:#1E88FF;text-decoration:none;">support@growffiy.in</a> with your Client ID, registered email, and reason for refund. Our team will respond within 2 business days.</p>`;

export default function RefundPolicy() {
  const [content, setContent] = useState(fallbackContent);
  const [lastUpdated, setLastUpdated] = useState('June 10, 2026');

  useEffect(() => {
    fetch('/api/settings/legal')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_refund_content) {
          setContent(data.settings.legal_refund_content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LegalLayout title="Refund Policy" lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalLayout>
  );
}
