import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

const defaultPrivacyContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Data Collection</h3>
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

const defaultTermsContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Trading Risk Disclosure</h3>
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

const defaultRefundContent = `<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> Non-Refundable Services</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Due to the nature of software services and API integrations, all subscription fees are non-refundable once the service has been activated and API credentials have been configured. By subscribing, you acknowledge and agree to this policy.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> 24-Hour Window</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">If you have not yet activated your account or configured any API credentials, you may be eligible for a full refund within <strong>24 hours</strong> of purchase. Please contact <a href="mailto:support@growffiy.in" style="color:#1E88FF;text-decoration:none;">support@growffiy.in</a> within this window to request a refund.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Technical Failures</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">In the event of extended platform downtime (greater than 72 consecutive hours) directly caused by Growffiy infrastructure failures, pro-rated credit may be applied to the next billing cycle at our discretion. This does not cover third-party API (Zerodha/Razorpay) outages.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> Subscription Cancellation</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">You may cancel your subscription at any time from the client dashboard. Upon cancellation, your account will remain active until the end of the current billing period. No partial refunds will be issued for unused days in the current period.</p>
<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> How to Request a Refund</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">To initiate a refund request, email <a href="mailto:support@growffiy.in" style="color:#1E88FF;text-decoration:none;">support@growffiy.in</a> with your Client ID, registered email, and reason for refund. Our team will respond within 2 business days.</p>`;

const defaultDisclaimerContent = `<div style="background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(239,68,68,0.02));border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px 20px;margin-bottom:32px;display:flex;gap:12px;align-items:flex-start;">
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

const defaultFaqContent = JSON.stringify([
  {q: "How does the Pre-Open Momentum Breakout strategy work?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">The Pre-Open Momentum Breakout strategy scans NSE/BSE stocks during the pre-open session (9:00-9:08 AM) to identify high-momentum candidates based on volume and price thresholds. Once identified, it places automated MIS (Margin Intraday Squared-off) orders at market open. All orders are squared off by 3:15 PM automatically.</p>"},
  {q: "How is position sizing calculated?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Position sizing is calculated based on your configured risk per trade (default 5-8% of available capital) and the stock's current market price. The system automatically calculates the number of lots or shares to allocate to each trade, ensuring no single position exceeds your predefined risk tolerance.</p>"},
  {q: "Do I need a Zerodha Kite Connect subscription?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Yes, Growffiy requires an active Zerodha Kite Connect subscription (API access). Your Zerodha account must have Kite Connect enabled, and you will need to generate API Key, API Secret, and Access Token from the Zerodha Kite Console. The free tier of Kite Connect (3 tokens) is sufficient for getting started.</p>"},
  {q: "Can I pause the bot at any time?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Absolutely. You can pause or stop the automated trading bot at any time from your client dashboard. When paused, no new trades will be placed. Any open positions held at the time of pausing will continue until their configured square-off time (3:15 PM) unless manually closed from your broker terminal.</p>"},
  {q: "What happens if my internet goes down during a trade?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Growffiy runs on cloud servers, not your local machine. Once a strategy is deployed and active, trade execution continues server-side regardless of your internet connectivity. However, you may lose visibility of real-time updates on your dashboard until your connection is restored. All trades follow their pre-configured square-off schedule.</p>"}
]);

export async function GET() {
  try {
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    
    // Set defaults
    settings['razorpay_test_key_id'] = '';
    settings['razorpay_test_key_secret'] = '';
    settings['razorpay_live_key_id'] = '';
    settings['razorpay_live_key_secret'] = '';
    settings['razorpay_mode'] = 'test';
    settings['smtp_host'] = '';
    settings['smtp_port'] = '587';
    settings['smtp_user'] = '';
    settings['smtp_password'] = '';
    settings['smtp_sender_name'] = 'Growffiy';
    settings['smtp_encryption'] = 'tls'; // ssl, tls, none
    settings['smtp_status'] = 'false'; // 'true' (on) or 'false' (off)
    settings['support_email'] = 'support@growffiy.com';
    settings['support_phone'] = '+91 98765 43210';
    settings['support_timings'] = 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)';
    settings['support_address'] = 'Mumbai, India';
    settings['algo_preopen_fetch_time'] = '09:08';
    settings['algo_token_refresh_time'] = '08:00';
    settings['auto_trade_enabled'] = 'true';
    settings['trading_days'] = '["Mon","Tue","Wed","Thu","Fri"]';
    settings['special_market_days'] = '[]';
    settings['market_holidays'] = '[]';
    settings['app_name'] = 'Growffiy';
    settings['app_title'] = 'Growffiy — Algo Trading Terminal';
    settings['app_favicon'] = '';
    settings['app_logo'] = '';
    settings['meta_description'] = '';
    settings['meta_keywords'] = '';
    settings['footer_text'] = '';
    settings['footer_tagline'] = 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.';
    settings['footer_disclaimer'] = 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.';
    settings['footer_bottom_tagline'] = 'Designed for NSE/BSE Intraday Algo Traders';
    settings['google_analytics_id'] = '';
    settings['google_sheet_url'] = '';
    settings['google_credentials_json'] = '';

    settings['legal_privacy_content'] = defaultPrivacyContent;
    settings['legal_terms_content'] = defaultTermsContent;
    settings['legal_refund_content'] = defaultRefundContent;
    settings['legal_disclaimer_content'] = defaultDisclaimerContent;
    settings['legal_faq_content'] = defaultFaqContent;
    settings['hero_title'] = 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter';
    settings['hero_subtitle'] = 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.';

    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ 
      success: true, 
      settings: {
        razorpay_test_key_id: '',
        razorpay_test_key_secret: '',
        razorpay_live_key_id: '',
        razorpay_live_key_secret: '',
        razorpay_mode: 'test',
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_sender_name: 'Growffiy',
        smtp_encryption: 'tls',
        smtp_status: 'false',
        support_email: 'support@growffiy.com',
        support_phone: '+91 98765 43210',
        support_timings: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
        support_address: 'Mumbai, India',
        algo_preopen_fetch_time: '09:08',
        algo_token_refresh_time: '08:00',
        auto_trade_enabled: 'true',
        trading_days: '["Mon","Tue","Wed","Thu","Fri"]',
        special_market_days: '[]',
        market_holidays: '[]',
        app_name: 'Growffiy',
        app_title: 'Growffiy — Algo Trading Terminal',
        app_favicon: '',
        app_logo: '',
        meta_description: '',
        meta_keywords: '',
        footer_text: '',
        footer_tagline: 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.',
        footer_disclaimer: 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.',
        footer_bottom_tagline: 'Designed for NSE/BSE Intraday Algo Traders',
        google_analytics_id: '',
        legal_privacy_content: defaultPrivacyContent,
        legal_terms_content: defaultTermsContent,
        legal_refund_content: defaultRefundContent,
        legal_disclaimer_content: defaultDisclaimerContent,
        legal_faq_content: defaultFaqContent,
        hero_title: 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter',
        hero_subtitle: 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.',
      } 
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      razorpay_test_key_id, 
      razorpay_test_key_secret, 
      razorpay_live_key_id, 
      razorpay_live_key_secret, 
      razorpay_mode,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_sender_name,
      smtp_encryption,
      smtp_status,
      support_email,
      support_phone,
      support_timings,
      support_address,
      algo_preopen_fetch_time,
      algo_token_refresh_time,
      google_sheet_url,
      google_credentials_json,
      app_name,
      app_title,
      app_favicon,
      app_logo,
      meta_description,
      meta_keywords,
      footer_text,
      footer_tagline,
      footer_disclaimer,
      footer_bottom_tagline,
      google_analytics_id,
      legal_privacy_content,
      legal_terms_content,
      legal_refund_content,
      legal_disclaimer_content,
      legal_faq_content,
      hero_title,
      hero_subtitle
    } = body;

    const updates = {
      razorpay_test_key_id,
      razorpay_test_key_secret,
      razorpay_live_key_id,
      razorpay_live_key_secret,
      razorpay_mode,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_sender_name,
      smtp_encryption,
      smtp_status,
      support_email,
      support_phone,
      support_timings,
      support_address,
      algo_preopen_fetch_time,
      algo_token_refresh_time,
      google_sheet_url,
      google_credentials_json,
      auto_trade_enabled: body.auto_trade_enabled,
      trading_days: body.trading_days,
      special_market_days: body.special_market_days,
      market_holidays: body.market_holidays,
      app_name,
      app_title,
      app_favicon,
      app_logo,
      meta_description,
      meta_keywords,
      footer_text,
      footer_tagline,
      footer_disclaimer,
      footer_bottom_tagline,
      google_analytics_id,
      legal_privacy_content,
      legal_terms_content,
      legal_refund_content,
      legal_disclaimer_content,
      legal_faq_content,
      hero_title,
      hero_subtitle
    };


    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await prisma.appSettings.upsert({
          where: { settingKey: key },
          update: { settingValue: String(value) },
          create: {
            settingKey: key,
            settingValue: String(value),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
