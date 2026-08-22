import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Ensure WebSocket is set up for Serverless Neon connection
global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Searching for Exclusive plans in Neon...');
  
  // Find plans containing "Exclusive"
  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      name: {
        contains: 'Exclusive',
        mode: 'insensitive'
      }
    }
  });
  
  console.log('Found plans:', plans);
  
  if (plans.length > 0) {
    for (const plan of plans) {
      console.log(`Deleting plan: ${plan.name} (ID: ${plan.id})`);
      await prisma.subscriptionPlan.delete({
        where: { id: plan.id }
      });
      console.log(`Plan ${plan.name} deleted successfully.`);
    }
  } else {
    console.log('No plan with name containing "Exclusive" was found.');
  }
}

main()
  .catch((e) => {
    console.error('Error executing delete script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
