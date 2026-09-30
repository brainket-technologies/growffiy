import { prisma } from './src/database/db';

async function main() {
  console.log('Finding Vivek user...');
  const users = await prisma.user.findMany({
    where: {
      email: 'firoz.digi@gmail.com'
    }
  });

  if (users.length === 0) {
    console.log('No user found with email firoz.digi@gmail.com');
  } else {
    for (const user of users) {
      console.log(`Deleting user: ${user.name} (${user.email}) ID: ${user.id}`);
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log('User deleted successfully.');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
