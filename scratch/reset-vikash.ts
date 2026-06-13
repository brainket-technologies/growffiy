import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'client'
    }
  });

  console.log('Found clients:', users.map(u => u.name));

  // Reset subscriptionStatus of all clients to pending to test the purchase workflow
  const result = await prisma.client.updateMany({
    data: {
      subscriptionStatus: 'pending'
    }
  });

  console.log('Reset subscription status for clients:', result.count);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
