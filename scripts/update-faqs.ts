import { prisma } from '../src/database/db';

async function main() {
  console.log('Updating FAQs in database...');

  const newFaqs = [
    {
      q: 'What is Growffi?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Growffi is a fintech platform designed to provide technology-driven trading solutions that help users manage and execute their trading strategies more efficiently through a structured and user-friendly system.</p>'
    },
    {
      q: 'How does Growffi work?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Growffi provides a digital platform where users can access trading-related tools, monitor their strategies, manage transactions, and track performance through an organized dashboard.</p>'
    },
    {
      q: 'Is Growffi a stock broker?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">No. Growffi is a fintech technology platform and does not act as a stock broker. Trading activities are executed through the user\'s registered broker account and are subject to the broker\'s terms and applicable regulations.</p>'
    },
    {
      q: 'Do I need a trading account to use Growffi?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Yes. To execute trades, users generally need an active trading and demat account with a supported registered broker. Growffi integrates with compatible broker accounts to facilitate the trading workflow.</p>'
    },
    {
      q: 'Can I monitor my trading performance on Growffi?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Yes. Growffi provides a dashboard where users can monitor transactions, open positions, strategy-related information, and overall trading activity in one place.</p>'
    },
    {
      q: 'Is my personal and trading information secure?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Growffi uses appropriate security measures to help protect user information and maintain the confidentiality of account-related data. Users should also keep their login credentials confidential and secure.</p>'
    },
    {
      q: 'What fees are charged for using Growffi?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">The applicable charges depend on the selected Growffi plan or service. Any relevant subscription or service fees are communicated clearly before the user enrolls in a plan.</p>'
    },
    {
      q: 'What are the minimum investment requirements?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">The minimum investment amount may vary depending on the selected plan or strategy. Please contact our team or check the specific plan details for the latest requirements.</p>'
    },
    {
      q: 'Can I stop or modify my trading strategy?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">Yes. Depending on the available features and the user\'s selected service, users can manage, modify, or discontinue their strategy through the Growffi platform, subject to applicable terms and conditions.</p>'
    },
    {
      q: 'How can I contact Growffi support?',
      a: '<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;">You can contact the Growffi support team through the contact details available on the website. The team can assist with account-related queries, platform usage, and general support.</p>'
    }
  ];

  const jsonContent = JSON.stringify(newFaqs);

  await prisma.appSettings.upsert({
    where: { settingKey: 'legal_faq_content' },
    update: { settingValue: jsonContent },
    create: {
      settingKey: 'legal_faq_content',
      settingValue: jsonContent,
      type: 'json'
    }
  });

  console.log('Successfully updated legal_faq_content in appSettings DB table with 10 new FAQs!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
