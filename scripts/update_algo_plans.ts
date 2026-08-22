import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();
global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Fetching Product Types...');
  const productTypes = await prisma.productType.findMany();
  console.log('Product Types:', productTypes);
  
  const algoProd = productTypes.find(p => p.name.toLowerCase() === 'algo' || p.id === 'prod-algo');
  if (!algoProd) {
    console.error('Algo product type not found!');
    return;
  }
  
  console.log(`Using product type: ${algoProd.name} (ID: ${algoProd.id})`);
  
  // Fetch existing plans for this product type
  const existingPlans = await prisma.subscriptionPlan.findMany({
    where: { productTypeId: algoProd.id }
  });
  console.log('Existing plans under Algo:', existingPlans);
  
  // Define our target plans
  const targetPlans = [
    {
      name: 'Basic Algo Tool',
      price: 500000,
      durationDays: 365,
      features: JSON.stringify([
        'AI-Powered Trade Scanning',
        'Pre-defined Trading Strategies',
        'Real-time Market Alerts',
        'Web & Desktop Access',
        'Email / Chat Support'
      ]),
      status: 'active'
    },
    {
      name: 'Pro Algo Tool',
      price: 1000000,
      durationDays: 365,
      features: JSON.stringify([
        'Advanced AI Trading Algorithms',
        'Custom Strategy Builder',
        'Real-time Signals & Backtesting',
        'Multi-Market Coverage (NSE / F&O)',
        'Priority Support'
      ]),
      status: 'active'
    },
    {
      name: 'Enterprise Algo Tool',
      price: 2000000,
      durationDays: 365,
      features: JSON.stringify([
        'Fully Customizable Algo Platform',
        'High-Speed Trading Infrastructure',
        'API Integration / Broker Connect',
        'Advanced Analytics & Risk Management',
        'Dedicated Account Manager'
      ]),
      status: 'active'
    }
  ];
  
  // Delete extra plans if there are more than 3, or update existing and insert new
  for (let i = 0; i < 3; i++) {
    const target = targetPlans[i];
    const existing = existingPlans[i];
    
    if (existing) {
      console.log(`Updating existing plan ID ${existing.id} -> ${target.name}`);
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
          name: target.name,
          price: target.price,
          durationDays: target.durationDays,
          features: target.features,
          status: target.status
        }
      });
    } else {
      console.log(`Creating new plan -> ${target.name}`);
      await prisma.subscriptionPlan.create({
        data: {
          name: target.name,
          price: target.price,
          durationDays: target.durationDays,
          features: target.features,
          status: target.status,
          productTypeId: algoProd.id
        }
      });
    }
  }
  
  // If there are more than 3 existing plans, delete them
  if (existingPlans.length > 3) {
    for (let i = 3; i < existingPlans.length; i++) {
      console.log(`Deleting extra plan ID ${existingPlans[i].id} (${existingPlans[i].name})`);
      await prisma.subscriptionPlan.delete({
        where: { id: existingPlans[i].id }
      });
    }
  }
  
  console.log('Algo plans successfully updated in Neon Database.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
