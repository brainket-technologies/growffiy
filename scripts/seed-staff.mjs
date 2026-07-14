import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding staff users...');

  const existing = await prisma.staff.findUnique({ where: { userId: 'staff1' } });
  if (existing) {
    console.log('Test staff user already exists, skipping...');
    return;
  }

  const staff = await prisma.staff.create({
    data: {
      name: 'Test Staff',
      email: 'staff@test.com',
      userId: 'staff1',
      password: '123',
      mobile: '9999999999',
      adminId: 'admin',
      status: 'active',
      permissions: {
        create: [
          { module: 'clients', canView: true, canCreate: true, canEdit: true },
          { module: 'preopen', canView: true, canCreate: false, canEdit: false },
          { module: 'plans', canView: true, canCreate: false, canEdit: false },
          { module: 'strategies', canView: true, canCreate: false, canEdit: false },
          { module: 'trades', canView: true, canCreate: false, canEdit: false },
          { module: 'reports', canView: true, canCreate: false, canEdit: false },
          { module: 'scanner', canView: true, canCreate: false, canEdit: false },
          { module: 'support', canView: true, canCreate: true, canEdit: false },
          { module: 'marketWatch', canView: true, canCreate: false, canEdit: false },
        ],
      },
    },
    include: { permissions: true },
  });

  console.log('✅ Test staff created:');
  console.log('   User ID: staff1');
  console.log('   Password: 123');
  console.log('   Login at: /staff/login');
  console.log(`   ID: ${staff.id}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
