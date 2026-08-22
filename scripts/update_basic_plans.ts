import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();
global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding or creating "Basic" product type...');
  
  // Find or create the Basic product type in the database
  const basicProd = await prisma.productType.upsert({
    where: { id: 'prod-basic' },
    update: { name: 'Basic' },
    create: { id: 'prod-basic', name: 'Basic' }
  });
  
  console.log('Basic product type:', basicProd);
  
  // Fetch existing plans for Basic product type
  const existingPlans = await prisma.subscriptionPlan.findMany({
    where: { productTypeId: basicProd.id }
  });
  console.log('Existing plans under Basic:', existingPlans);
  
  // Also check if there is an old plan named "Basic Algo Software" with null product type
  const orphanedPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      name: { contains: 'Basic Algo Software', mode: 'insensitive' }
    }
  });
  
  if (orphanedPlan) {
    console.log(`Found orphaned Basic Algo Software plan (ID: ${orphanedPlan.id}). Re-linking it to prod-basic.`);
    await prisma.subscriptionPlan.update({
      where: { id: orphanedPlan.id },
      data: { productTypeId: basicProd.id }
    });
    // Add to existing plans list for processing
    existingPlans.push({
      ...orphanedPlan,
      productTypeId: basicProd.id
    });
  }

  // Define target plans
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
  
  // Update/insert target plans
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
          status: target.status,
          productTypeId: basicProd.id
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
          productTypeId: basicProd.id
        }
      });
    }
  }
  
  // Clean up any extra plans beyond the 3 targets
  if (existingPlans.length > 3) {
    for (let i = 3; i < existingPlans.length; i++) {
      console.log(`Deleting extra plan ID ${existingPlans[i].id} (${existingPlans[i].name})`);
      await prisma.subscriptionPlan.delete({
        where: { id: existingPlans[i].id }
      });
    }
  }
  
  console.log('Basic product type and plans successfully updated.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
