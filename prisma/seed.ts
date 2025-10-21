import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { phone: '+5511999999999' },
    update: {},
    create: {
      phone: '+5511999999999',
      email: 'teste1@lembrai.com',
      planType: 'FREE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: '+5511988888888' },
    update: {},
    create: {
      phone: '+5511988888888',
      email: 'teste2@lembrai.com',
      planType: 'PAID',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✅ Created users:', { user1, user2 });

  // Create test reminders
  const reminder1 = await prisma.reminder.create({
    data: {
      userId: user1.id,
      message: 'Reunião importante com cliente',
      originalDatetime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      reminderDatetime: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
      advanceTime: 30, // 30 minutes before
      status: 'PENDING',
    },
  });

  const reminder2 = await prisma.reminder.create({
    data: {
      userId: user1.id,
      message: 'Aniversário da Maria',
      originalDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      reminderDatetime: new Date(Date.now() + 23 * 60 * 60 * 1000), // 1 hour before
      advanceTime: 60, // 1 hour before
      status: 'PENDING',
    },
  });

  const reminder3 = await prisma.reminder.create({
    data: {
      userId: user2.id,
      message: 'Consulta médica',
      originalDatetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      reminderDatetime: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000), // 12 hours before
      advanceTime: 720, // 12 hours before
      status: 'PENDING',
    },
  });

  console.log('✅ Created reminders:', { reminder1, reminder2, reminder3 });

  // Create test notifications
  const notification1 = await prisma.notification.create({
    data: {
      reminderId: reminder1.id,
      type: 'WHATSAPP',
      status: 'PENDING',
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      reminderId: reminder2.id,
      type: 'WHATSAPP',
      status: 'PENDING',
    },
  });

  const notification3 = await prisma.notification.create({
    data: {
      reminderId: reminder3.id,
      type: 'EMAIL',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  console.log('✅ Created notifications:', { notification1, notification2, notification3 });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
