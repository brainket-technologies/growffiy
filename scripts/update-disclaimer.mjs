import dotenv from 'dotenv';
dotenv.config({ path: '/Users/firozmohammad/Work/growffiy/.env' });

import ws from 'ws';
if (!global.WebSocket) {
  global.WebSocket = ws;
}

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connString = process.env.DATABASE_URL;
if (!connString) {
  throw new Error('DATABASE_URL is not defined in the environment');
}

const adapter = new PrismaNeon({ connectionString: connString });
const prisma = new PrismaClient({ adapter });

const newDisclaimerContent = `<p style="font-size:13px;color:#94a3b8;font-weight:500;margin-bottom:4px;">Effective Date: <strong style="color:#1e293b;">July 16, 2025</strong> &nbsp;&nbsp; Last Updated: <strong style="color:#1e293b;">July 16, 2025</strong></p>

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

async function main() {
  try {
    const updated = await prisma.appSettings.upsert({
      where: { settingKey: 'legal_disclaimer_content' },
      update: { settingValue: newDisclaimerContent },
      create: {
        settingKey: 'legal_disclaimer_content',
        settingValue: newDisclaimerContent,
        type: 'string',
      },
    });
    console.log('✅ Database updated successfully for legal_disclaimer_content:', updated.settingKey);
  } catch (err) {
    console.error('Error updating database row:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
