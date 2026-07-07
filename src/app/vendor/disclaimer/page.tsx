'use client';

import React, { useEffect, useState } from 'react';
import LegalLayout from '../../../shared/components/views/LegalLayout';

const fallbackContent = `<div style="background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(239,68,68,0.02));border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px 20px;margin-bottom:32px;display:flex;gap:12px;align-items:flex-start;">
  <span style="font-size:20px;flex-shrink:0;">⚠️</span>
  <p style="font-size:14px;color:#dc2626;font-weight:600;margin:0;line-height:1.6;">Trading in financial instruments involves substantial risk of loss and is not suitable for all investors. Please read this disclaimer carefully before using Growffiy.</p>
</div>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Not a Financial Advisor</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffiy is <strong>NOT a SEBI registered investment advisor, broker, sub-broker, portfolio manager, or research analyst</strong>. The platform is a software utility designed to execute pre-configured algorithmic strategies via the Zerodha Kite Connect API.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> No Guaranteed Returns</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">All strategy performance data, win rates, and profit/loss statistics displayed on this platform are based on historical simulations or past trading data. Past performance is <strong>NOT indicative of future results</strong>. There is no guarantee of profit.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Market Risk</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Equity, derivatives, and currency markets are subject to extreme volatility. Algorithmic strategies may underperform or generate significant losses during periods of high volatility, black swan events, circuit breakers, or unexpected market conditions.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> User Responsibility</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Users are solely responsible for their trading decisions, risk parameters, capital allocation, and trade outcomes. By using Growffiy, you acknowledge that you fully understand the risks associated with algorithmic trading in Indian financial markets.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> Technical Risk</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">System failures, network outages, API downtime, or software bugs may result in missed trades, duplicate orders, or unintended positions. Growffiy shall not be held liable for any losses arising from such technical failures.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">6</span> Seek Professional Advice</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Before deploying any trading strategy with real capital, we strongly recommend consulting a SEBI-registered financial advisor or investment consultant who can evaluate your specific financial situation and risk tolerance.</p>`;

export default function Disclaimer() {
  const [content, setContent] = useState(fallbackContent);
  const [lastUpdated, setLastUpdated] = useState('June 10, 2026');

  useEffect(() => {
    fetch('/api/settings/legal')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_disclaimer_content) {
          setContent(data.settings.legal_disclaimer_content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LegalLayout title="Risk Disclaimer" lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalLayout>
  );
}
