import { prisma } from '../src/database/db';

async function main() {
  console.log('Updating testimonial avatars in DB...');

  const testimonials = await prisma.testimonial.findMany();
  console.log(`Found ${testimonials.length} testimonials in database.`);

  const avatarMap: Record<string, string> = {
    'Rajesh Verma': '/testimonials/avatar-3.jpg',
    'Ananya Deshmukh': '/testimonials/avatar-1.jpg',
    'Vikram Patel': '/testimonials/avatar-5.jpg',
    'Saurabh Mehta': '/testimonials/avatar-4.jpg',
    'Pooja Agarwal': '/testimonials/avatar-2.jpg',
  };

  const defaultAvatars = [
    '/testimonials/avatar-1.jpg',
    '/testimonials/avatar-2.jpg',
    '/testimonials/avatar-3.jpg',
    '/testimonials/avatar-4.jpg',
    '/testimonials/avatar-5.jpg',
    '/testimonials/avatar-6.jpg',
    '/testimonials/avatar-7.jpg',
    '/testimonials/avatar-8.jpg',
  ];

  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    const newAvatar = avatarMap[t.name] || defaultAvatars[i % defaultAvatars.length];
    
    await prisma.testimonial.update({
      where: { id: t.id },
      data: { avatar: newAvatar },
    });
    console.log(`Updated ${t.name} -> ${newAvatar}`);
  }

  console.log('All testimonial avatars updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
