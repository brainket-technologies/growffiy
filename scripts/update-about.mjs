import dotenv from 'dotenv';
dotenv.config({ path: '/Users/firozmohammad/Work/growffiy/.env' });

import ws from 'ws';
if (!global.WebSocket) {
  global.WebSocket = ws;
}

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connString = process.env.DATABASE_URL;
if (!connString) throw new Error('DATABASE_URL is not defined');

const adapter = new PrismaNeon({ connectionString: connString });
const prisma = new PrismaClient({ adapter });

const newAboutContent = `<h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:16px;letter-spacing:-0.5px;">Empowering Traders with Intelligent Technology</h2>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:16px;">At Growffi, we believe that successful trading is built on three pillars: <strong>knowledge, discipline, and technology</strong>. Our mission is to bridge the gap between complex market analysis and practical decision-making by providing innovative tools that help traders identify opportunities, manage risk, and automate their strategies with confidence.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:16px;">Powered by <strong>Growffi Fintech Private Limited</strong>, we are committed to developing advanced fintech solutions that simplify trading without compromising on accuracy or performance. Whether you are a beginner exploring the markets or an experienced trader looking to optimize your workflow, Growffi provides the technology you need to trade smarter.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:16px;">Our flagship products—including the <strong>Intraday Live Nifty 500 Scanner</strong> and <strong>Algo Trading Tools</strong>—are designed to save time, reduce emotional decision-making, and improve trading efficiency. By leveraging real-time market data, intelligent filters, and automation, we help traders focus on high-quality opportunities instead of spending hours analyzing charts.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:32px;">At Growffi, we don't believe technology should replace traders—it should empower them. Our goal is to provide reliable, user-friendly solutions that enable traders to make informed decisions and build long-term consistency in the financial markets. Growffi is committed to delivering tools that help you <strong>trade smarter and grow with confidence</strong>.</p>

<div style="background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(18,82,171,0.04));border:1px solid rgba(14,165,233,0.15);border-radius:14px;padding:20px 24px;margin-bottom:36px;">
  <p style="font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Our Mission Statement</p>
  <p style="font-size:15px;font-weight:600;color:#1e293b;line-height:1.7;font-style:italic;margin:0;">"To empower traders through innovative technology, real-time market intelligence, and intelligent automation, enabling them to trade with confidence, discipline, and consistency."</p>
</div>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:6px;letter-spacing:-0.3px;">Our Mission</h3>
<p style="font-size:13px;font-weight:700;color:#1E88FF;margin-bottom:12px;">To Empower Every Trader with Smart, Reliable, and Innovative Trading Technology.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:14px;">Our mission is to make professional-grade trading tools accessible to traders of all experience levels. We aim to simplify market analysis, reduce manual effort, and help traders make data-driven decisions through cutting-edge technology.</p>
<p style="font-size:14px;color:#475569;margin-bottom:10px;">We are dedicated to building intelligent software that:</p>
<ul style="list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:8px;">
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Provides real-time market scanning across Nifty 500 stocks.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Automates trading strategies with speed and precision.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Reduces emotional and impulsive trading decisions.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Improves consistency through disciplined execution.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Makes advanced trading technology simple and easy to use.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Supports traders with reliable, secure, and scalable solutions.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Continuously evolves with changing market conditions and user needs.</li>
</ul>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:36px;">Every feature we develop is focused on one objective: helping traders make better decisions with greater confidence.</p>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:6px;letter-spacing:-0.3px;">Our Vision</h3>
<p style="font-size:13px;font-weight:700;color:#1E88FF;margin-bottom:12px;">To Become India's Most Trusted FinTech Platform for Smart Trading Solutions.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:14px;">Our vision is to transform the way traders interact with financial markets by building a comprehensive ecosystem of intelligent trading technology. We aspire to become a trusted partner for traders by delivering innovative products that combine simplicity, speed, and accuracy.</p>
<p style="font-size:14px;color:#475569;margin-bottom:10px;">We envision a future where every trader has access to:</p>
<ul style="list-style:none;padding:0;margin:0 0 14px;display:flex;flex-direction:column;gap:8px;">
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Intelligent market scanners powered by real-time data.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Advanced algorithmic trading tools that automate execution with discipline.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> AI-driven insights that simplify complex market analysis.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Robust risk management solutions that promote responsible trading.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Educational resources that help traders continuously improve their skills.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> A collaborative community where traders learn, share, and grow together.</li>
</ul>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:36px;">By continually investing in innovation, research, and customer success, Growffi aims to set new standards for fintech excellence and become a leading platform for technology-driven trading.</p>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:12px;letter-spacing:-0.3px;">What We Do</h3>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:20px;">Growffi develops intelligent trading products that help traders identify opportunities and automate their trading process efficiently.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:36px;">
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
    <p style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 8px;">Intraday Live Nifty 500 Scanner</p>
    <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0;">Our real-time scanner continuously monitors Nifty 500 stocks and identifies high-probability intraday trading opportunities using advanced technical filters, price action logic, volume analysis, and momentum detection.</p>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
    <p style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 8px;">Algo Trading Tools</p>
    <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0;">Our automation platform enables traders to execute predefined strategies automatically with built-in risk management, trade monitoring, and seamless execution, helping eliminate emotional decision-making and improve consistency.</p>
  </div>
</div>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:16px;letter-spacing:-0.3px;">Our Core Values</h3>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:36px;">
  <div style="border-left:3px solid #1E88FF;padding:14px 16px;background:#f8fafc;border-radius:0 10px 10px 0;">
    <p style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 6px;">Innovation</p>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">We continuously develop smarter trading technologies that solve real-world challenges faced by traders.</p>
  </div>
  <div style="border-left:3px solid #1E88FF;padding:14px 16px;background:#f8fafc;border-radius:0 10px 10px 0;">
    <p style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 6px;">Transparency</p>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">We believe in honest communication, clear pricing, and building long-term relationships based on trust.</p>
  </div>
  <div style="border-left:3px solid #1E88FF;padding:14px 16px;background:#f8fafc;border-radius:0 10px 10px 0;">
    <p style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 6px;">Reliability</p>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">Our products are designed for stability, speed, and dependable performance during live market hours.</p>
  </div>
  <div style="border-left:3px solid #1E88FF;padding:14px 16px;background:#f8fafc;border-radius:0 10px 10px 0;">
    <p style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 6px;">Customer First</p>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">Every decision we make begins with understanding our users' needs and creating solutions that genuinely improve their trading experience.</p>
  </div>
  <div style="border-left:3px solid #1E88FF;padding:14px 16px;background:#f8fafc;border-radius:0 10px 10px 0;">
    <p style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 6px;">Continuous Improvement</p>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">Financial markets evolve every day, and so do we. We constantly enhance our products with new features, improved algorithms, and better user experiences.</p>
  </div>
</div>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:12px;letter-spacing:-0.3px;">Why Choose Growffi?</h3>
<ul style="list-style:none;padding:0;margin:0 0 36px;display:flex;flex-direction:column;gap:8px;">
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Real-time scanning of Nifty 500 stocks.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Intelligent filters for identifying high-probability setups.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Advanced algorithmic trading and automation tools.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> User-friendly interface suitable for both beginners and experienced traders.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Secure, scalable, and performance-focused technology.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Ongoing product enhancements and dedicated customer support.</li>
  <li style="font-size:14px;color:#475569;display:flex;gap:10px;align-items:flex-start;"><span style="color:#1E88FF;font-weight:700;flex-shrink:0;">✓</span> Built by a passionate team focused on helping traders succeed.</li>
</ul>

<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:12px;letter-spacing:-0.3px;">Our Commitment</h3>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:14px;">At Growffi, our commitment extends beyond building software. We are committed to creating a trusted technology platform that empowers traders to make informed decisions, manage risk responsibly, and grow with confidence.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:14px;">We recognize that success in trading requires discipline, continuous learning, and dependable technology. By combining these elements, we strive to deliver solutions that support traders throughout every stage of their journey.</p>
<p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:36px;">As we continue to innovate, our focus remains unchanged: to provide intelligent trading technology that helps traders trade smarter, faster, and with greater confidence.</p>

<div style="background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(18,82,171,0.04));border:1px solid rgba(14,165,233,0.15);border-radius:14px;padding:24px;margin-bottom:0;">
  <p style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 8px;">Growffi Fintech Private Limited</p>
  <p style="font-size:14px;line-height:1.8;color:#475569;margin:0 0 16px;">Growffi is proudly powered by <strong>Growffi Fintech Private Limited</strong>, a technology-driven company focused on developing innovative fintech products for the trading community. Our commitment to innovation, reliability, and customer success drives everything we build, as we work toward creating a smarter and more accessible future for traders.</p>
  <p style="font-size:15px;font-weight:800;color:#1E88FF;margin:0;letter-spacing:0.3px;">Scan. Trade. Grow.</p>
</div>`;

async function main() {
  try {
    const updated = await prisma.appSettings.upsert({
      where: { settingKey: 'legal_about_content' },
      update: { settingValue: newAboutContent },
      create: {
        settingKey: 'legal_about_content',
        settingValue: newAboutContent,
        type: 'string',
      },
    });
    console.log('✅ About content updated successfully:', updated.settingKey);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
