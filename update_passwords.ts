import { prisma } from './src/database/db';
import { encryptText } from './src/shared/utils/crypto';

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.password.startsWith('$2b$')) {
      const encrypted = encryptText('anand123');
      await prisma.user.update({
        where: { id: user.id },
        data: { password: encrypted }
      });
      console.log(`Updated bcrypt password for user ${user.name} to AES format`);
    }
  }
}
main();
