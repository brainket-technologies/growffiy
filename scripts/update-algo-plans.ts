import { prisma } from '../src/database/db';

async function main() {
  console.log('Updating Algo Subscription Plans...');

  const algoProductType = await prisma.productType.findUnique({
    where: { id: 'prod-algo' }
  });

  if (!algoProductType) {
    throw new Error('Algo Product Type (prod-algo) not found in the database. Run seed first.');
  }

  // Set existing Algo plans to inactive instead of deleting (foreign key constraints)
  console.log('Marking existing Algo plans as inactive...');
  await prisma.subscriptionPlan.updateMany({
    where: { productTypeId: 'prod-algo' },
    data: { status: 'inactive' }
  });

  const commonFeatures = [
    "Fully Automated Trading",
    "Smart Risk Management",
    "Secure API Integration",
    "Real-Time Monitoring",
    "No Manual Trading Stress",
    "Professional Support",
    "Live Dashboard",
    "Daily Trade Report"
  ];

  const newPlans = [
    {
      id: 'algo-plan-starter',
      name: 'ALGO STARTER',
      price: 1000,
      durationDays: 30,
      features: JSON.stringify(['INVESTMENT: ₹20,000 - ₹50,000', ...commonFeatures]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: 'algo-plan-plus',
      name: 'ALGO PLUS',
      price: 5000,
      durationDays: 30,
      features: JSON.stringify(['INVESTMENT: ₹1,00,000 - ₹3,00,000', ...commonFeatures]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: 'algo-plan-pro',
      name: 'ALGO PRO',
      price: 10000,
      durationDays: 30,
      features: JSON.stringify(['INVESTMENT: ₹3,00,000 - ₹5,00,000', ...commonFeatures]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: 'algo-plan-premium',
      name: 'ALGO PREMIUM',
      price: 25000,
      durationDays: 30,
      features: JSON.stringify(['INVESTMENT: ₹5,00,000 - ₹10,00,000', ...commonFeatures]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: 'algo-plan-elite',
      name: 'ALGO ELITE',
      price: 50000,
      durationDays: 30,
      features: JSON.stringify(['INVESTMENT: ₹10,00,000 - ₹25,00,000', ...commonFeatures]),
      status: 'active',
      productTypeId: 'prod-algo'
    }
  ];

  console.log('Inserting/Updating 5 new Algo plans...');
  for (const p of newPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
  }

  console.log('Successfully updated Algo plans!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
