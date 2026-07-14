const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  // List all staff
  const staffList = await prisma.staff.findMany({
    select: { id: true, userId: true, name: true, status: true },
  });
  console.log('Staff users:', JSON.stringify(staffList, null, 2));

  // List existing permissions for first staff
  if (staffList.length > 0) {
    const perms = await prisma.staffPermission.findMany({
      where: { staffId: staffList[0].id },
    });
    console.log('\nExisting permissions for', staffList[0].name, ':', JSON.stringify(perms, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
