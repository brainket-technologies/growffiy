import { prisma } from '../../database/db';

export async function logSystemEvent({
  action,
  oldValue = null,
  newValue = null,
  adminId = null,
}: {
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  adminId?: string | null;
}) {
  try {
    let resolvedAdminId = adminId;
    if (!resolvedAdminId) {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) {
        resolvedAdminId = admin.id;
      } else {
        // Fallback create admin
        const newAdmin = await prisma.user.create({
          data: {
            name: 'Firoz Mohammad',
            email: 'admin@growffiy.com',
            userId: 'admin',
            password: 'admin_secure_password_123',
            role: 'admin',
            status: 'active'
          }
        });
        resolvedAdminId = newAdmin.id;
      }
    }

    if (resolvedAdminId) {
      await prisma.auditLog.create({
        data: {
          adminId: resolvedAdminId,
          action,
          oldValue,
          newValue,
        },
      });
    }
  } catch (error) {
    console.error('Failed to log system audit event:', error);
  }
}
