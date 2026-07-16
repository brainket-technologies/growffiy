import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export const dynamic = 'force-dynamic';

const defaultAboutContent = `<h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">Empowering Traders with Intelligent Technology</h2>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 20px;">At Growffi, we believe that successful trading is built on three pillars: knowledge, discipline, and technology. Our mission is to bridge the gap between complex market analysis and practical decision-making by providing innovative tools that help traders identify opportunities, manage risk, and automate their strategies with confidence.</p>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 20px;">Powered by Growffi Fintech Private Limited, we are committed to developing advanced fintech solutions that simplify trading without compromising on accuracy or performance. Whether you are a beginner exploring the markets or an experienced trader looking to optimize your workflow, Growffi provides the technology you need to trade smarter.</p>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 20px;">Our flagship products—including the Intraday Live Nifty 500 Scanner and Algo Trading Tools—are designed to save time, reduce emotional decision-making, and improve trading efficiency. By leveraging real-time market data, intelligent filters, and automation, we help traders focus on high-quality opportunities instead of spending hours analyzing charts.</p>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 20px;">At Growffi, we don't believe technology should replace traders—it should empower them. Our goal is to provide reliable, user-friendly solutions that enable traders to make informed decisions and build long-term consistency in the financial markets.</p>
<h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 30px; margin-bottom: 12px;">Our Mission</h3>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 16px; font-weight: 500; font-style: italic; border-left: 4px solid #1E88FF; padding-left: 16px;">"To empower traders through innovative technology, real-time market intelligence, and intelligent automation, enabling them to trade with confidence, discipline, and consistency."</p>
<h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 30px; margin-bottom: 12px;">Our Vision</h3>
<p style="font-size: 14px; line-height: 1.75; color: #475569; margin-bottom: 16px;">To Become India's Most Trusted FinTech Platform for Smart Trading Solutions. We envision a future where every trader has access to:</p>
<ul style="list-style-type: none; padding-left: 0; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px;">
  <li style="font-size: 14px; color: #475569; display: flex; gap: 8px; align-items: center;"><span style="color: #1E88FF; font-weight: bold;">✓</span> Intelligent market scanners powered by real-time data</li>
  <li style="font-size: 14px; color: #475569; display: flex; gap: 8px; align-items: center;"><span style="color: #1E88FF; font-weight: bold;">✓</span> Advanced algorithmic trading tools that automate execution</li>
  <li style="font-size: 14px; color: #475569; display: flex; gap: 8px; align-items: center;"><span style="color: #1E88FF; font-weight: bold;">✓</span> AI-driven insights that simplify complex market analysis</li>
  <li style="font-size: 14px; color: #475569; display: flex; gap: 8px; align-items: center;"><span style="color: #1E88FF; font-weight: bold;">✓</span> Robust risk management solutions that promote responsible trading</li>
</ul>`;

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

const defaultDisclaimerContent = `<p style="font-size:13px;color:#94a3b8;font-weight:500;margin-bottom:4px;">Effective Date: <strong style="color:#1e293b;">July 16, 2025</strong> &nbsp;&nbsp; Last Updated: <strong style="color:#1e293b;">July 16, 2025</strong></p>

<div style="background:linear-gradient(135deg,rgba(14,165,233,0.04),rgba(18,82,171,0.02));border:1px solid rgba(14,165,233,0.12);border-radius:12px;padding:20px 24px;margin:16px 0 32px;">
  <p style="font-size:14px;line-height:1.8;color:#334155;margin:0 0 12px 0;">Welcome to <strong>Growffi</strong>, a technology platform operated by <strong>Growffi Fintech Private Limited</strong>. Please read this Disclaimer carefully before using our website, products, software, trading tools, scanners, algorithmic trading solutions, educational content, or any related services.</p>
  <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0;font-style:italic;">By accessing or using our website and services, you acknowledge that you have read, understood, and agreed to the terms outlined in this Disclaimer.</p>
</div>




<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">1</span> General Information</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi is a financial technology (FinTech) company that develops software solutions, market scanners, algorithmic trading tools, trading utilities, and educational resources for traders and investors. Our platform is intended to assist users in identifying market opportunities and automating trading workflows. The information and tools provided on our website are for informational, educational, and technological purposes only. Nothing available on the Growffi platform should be interpreted as financial, investment, legal, accounting, tax, or professional advice.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">2</span> No Investment Advice</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi does not provide: investment advice, financial planning services, portfolio management, stock recommendations, buy or sell calls, guaranteed trading strategies, personalized investment consultation, or research analyst services regulated by SEBI. Our scanners, alerts, algorithmic trading tools, and educational materials are technology-driven products designed to support users in their own trading decisions. All trading and investment decisions remain solely the responsibility of the user.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">3</span> Technology Platform Only</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi is strictly a software and technology provider. We develop and offer: intraday market scanners, algorithmic trading tools, trading automation solutions, market analytics, strategy development tools, and educational resources. Growffi does not execute trades on behalf of users unless expressly authorized through a broker integration configured and controlled by the user.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">4</span> No Guarantee of Profit</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Trading in financial markets involves significant risk. Growffi makes no representation or warranty that: any scanner will identify profitable opportunities, any trading strategy will be successful, any algorithm will generate profits, losses can be avoided, historical performance will repeat in the future, or users will achieve specific financial results. Past performance is not a guarantee of future performance. Market conditions change continuously, and all trading outcomes are uncertain.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">5</span> Risk of Trading</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Trading in equities, derivatives, commodities, currencies, and other financial instruments carries substantial financial risk. Users acknowledge that they may lose part or all of their invested capital. Before trading, users should carefully evaluate their financial situation, risk tolerance, investment objectives, trading experience, and market knowledge. If necessary, users should consult a qualified financial advisor before making investment decisions.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">6</span> Accuracy of Information</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi strives to provide reliable and accurate market data, analytics, and trading tools. However, we do not guarantee that market data is always accurate, price feeds are uninterrupted, charts are error-free, scanner results are complete, alerts will always be delivered on time, or market information is free from delays. Information may occasionally contain technical errors, omissions, or delays due to third-party data providers or market infrastructure.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">7</span> Algorithmic Trading Disclaimer</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Algorithmic trading involves inherent risks, including software failures, internet interruptions, power outages, exchange-related issues, broker API failures, incorrect strategy configuration, unexpected market volatility, and execution delays. While Growffi provides automation technology, users are solely responsible for creating their trading strategies, configuring strategy parameters, monitoring automated trades, managing trading capital, and setting risk management rules. Users should thoroughly test any trading strategy before deploying it in a live market.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">8</span> Broker Integration</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi may integrate with third-party brokers through APIs. Users acknowledge that trade execution is performed by the broker, not Growffi; order acceptance depends on broker systems; and delays or failures may occur due to broker infrastructure or exchange conditions. Growffi is not responsible for rejected, delayed, modified, or failed orders resulting from third-party systems.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">9</span> Third-Party Services</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Our website and software may include links or integrations with third-party services, including stock brokers, exchanges, data providers, payment gateways, cloud hosting providers, and communication services. Growffi is not responsible for the content, availability, security, accuracy, or practices of these third-party services. Users should review the terms and privacy policies of any third-party service they use.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">10</span> Educational Content</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Articles, videos, webinars, tutorials, blogs, strategy explanations, and other educational materials available through Growffi are intended solely for educational purposes. Examples, demonstrations, backtests, or case studies should not be interpreted as promises or guarantees of future trading performance.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">11</span> User Responsibility</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Users are solely responsible for evaluating trading opportunities, verifying market information, managing trading risks, protecting account credentials, monitoring algorithmic strategies, maintaining adequate internet connectivity, and complying with applicable laws and regulations. Growffi shall not be liable for any trading decisions made by users.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">12</span> Limitation of Liability</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">To the fullest extent permitted by applicable law, Growffi Fintech Private Limited, its directors, officers, employees, affiliates, partners, and licensors shall not be liable for any direct, indirect, incidental, consequential, punitive, or special damages arising from or related to trading losses, investment losses, loss of profits, missed trading opportunities, business interruption, data loss, system downtime, technical failures, software bugs, API failures, broker-related issues, exchange outages, or unauthorized access to user accounts. Users assume full responsibility for all risks associated with the use of Growffi's products and services.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">13</span> No Warranties</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">All Growffi products and services are provided on an "as is" and "as available" basis. Growffi makes no warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, non-infringement, accuracy, availability, reliability, continuous operation, or error-free performance.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">14</span> Regulatory Compliance</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Users are responsible for ensuring that their use of Growffi's products and services complies with all applicable laws, regulations, exchange rules, and broker requirements in their jurisdiction. Growffi does not guarantee that its services are appropriate or lawful for use in every country or region.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">15</span> Intellectual Property</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">All software, designs, algorithms, trademarks, logos, content, graphics, source code, and intellectual property displayed on the Growffi website are owned by or licensed to Growffi Fintech Private Limited. No content may be copied, reproduced, modified, distributed, reverse-engineered, or used for commercial purposes without prior written consent.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">16</span> Changes to This Disclaimer</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">Growffi reserves the right to modify or update this Disclaimer at any time without prior notice. Any changes become effective immediately upon publication on this website. Users are encouraged to review this page periodically to stay informed of any updates.</p>

<h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1e293b;display:flex;align-items:center;gap:8px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(18,82,171,0.1));font-size:12px;font-weight:800;color:#1E88FF;flex-shrink:0;">17</span> Contact Information</h3>
<p style="font-size:14px;line-height:1.75;color:#475569;padding-left:34px;margin-bottom:28px;">If you have any questions regarding this Disclaimer, please contact:<br /><strong>Growffi Fintech Private Limited</strong><br />Email: support@growffi.com<br />Website: www.growffi.com</p>

<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:40px;">
  <h4 style="font-size:14px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:8px;">Final Acknowledgement</h4>
  <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0;">By accessing or using the Growffi website, software, scanners, algorithmic trading tools, educational resources, or any related services, you acknowledge that you understand the risks associated with financial markets and trading activities. You agree that Growffi Fintech Private Limited is solely a provider of technology solutions and educational resources, and that all trading and investment decisions are made independently by you. You accept full responsibility for your use of the platform and any financial outcomes resulting from your trading or investment activities.</p>
</div>`;

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
    settings['master_zerodha_api_key'] = '';
    settings['master_zerodha_api_secret'] = '';

    settings['legal_privacy_content'] = defaultPrivacyContent;
    settings['legal_terms_content'] = defaultTermsContent;
    settings['legal_refund_content'] = defaultRefundContent;
    settings['legal_disclaimer_content'] = defaultDisclaimerContent;
    settings['legal_about_content'] = defaultAboutContent;
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
        legal_about_content: defaultAboutContent,
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
      legal_about_content,
      legal_faq_content,
      hero_title,
      hero_subtitle,
      master_zerodha_api_key,
      master_zerodha_api_secret
    } = body;

    const updates = {
      razorpay_test_key_id,
      razorpay_test_key_secret,
      razorpay_live_key_id,
      razorpay_live_key_secret,
      master_zerodha_api_key,
      master_zerodha_api_secret,
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
      legal_about_content,
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
