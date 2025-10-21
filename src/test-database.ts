import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService, ReminderService, NotificationService } from './services';

async function testDatabase() {
  console.log('🧪 Starting database connection and CRUD tests...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const reminderService = app.get(ReminderService);
  const notificationService = app.get(NotificationService);

  try {
    // Test 1: Read users
    console.log('📖 Test 1: Reading all users...');
    const users = await userService.findAll();
    console.log(`✅ Found ${users.length} users`);
    console.log(users);
    console.log('');

    // Test 2: Create a new user
    console.log('➕ Test 2: Creating a new user...');
    const newUser = await userService.create('+5511777777777', 'teste3@lembrai.com');
    console.log('✅ User created:', newUser);
    console.log('');

    // Test 3: Find user by phone
    console.log('🔍 Test 3: Finding user by phone...');
    const foundUser = await userService.findByPhone('+5511777777777');
    console.log('✅ User found:', foundUser);
    console.log('');

    // Test 4: Create a reminder
    console.log('➕ Test 4: Creating a reminder...');
    const newReminder = await reminderService.create({
      userId: newUser.id,
      message: 'Teste de lembrete via script',
      originalDatetime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      reminderDatetime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      advanceTime: 30,
    });
    console.log('✅ Reminder created:', newReminder);
    console.log('');

    // Test 5: Read reminders by user
    console.log('📖 Test 5: Reading reminders for user...');
    const userReminders = await reminderService.findByUserId(newUser.id);
    console.log(`✅ Found ${userReminders.length} reminders for user`);
    console.log(userReminders);
    console.log('');

    // Test 6: Create a notification
    console.log('➕ Test 6: Creating a notification...');
    const newNotification = await notificationService.create({
      reminderId: newReminder.id,
      type: 'WHATSAPP',
    });
    console.log('✅ Notification created:', newNotification);
    console.log('');

    // Test 7: Update notification status
    console.log('🔄 Test 7: Updating notification status...');
    const updatedNotification = await notificationService.updateStatus(
      newNotification.id,
      'SENT',
    );
    console.log('✅ Notification updated:', updatedNotification);
    console.log('');

    // Test 8: Count active reminders
    console.log('🔢 Test 8: Counting active reminders...');
    const count = await userService.countActiveReminders(newUser.id);
    console.log(`✅ User has ${count} active reminders`);
    console.log('');

    // Test 9: Find pending reminders
    console.log('📋 Test 9: Finding all pending reminders...');
    const pendingReminders = await reminderService.findAll({ status: 'PENDING' });
    console.log(`✅ Found ${pendingReminders.length} pending reminders`);
    console.log('');

    // Test 10: Update user plan
    console.log('🔄 Test 10: Updating user plan...');
    const updatedUser = await userService.update(newUser.id, {
      planType: 'PAID',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    console.log('✅ User plan updated:', updatedUser);
    console.log('');

    console.log('🎉 All database tests passed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

testDatabase();
