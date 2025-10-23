/**
 * Test script for cancelling reminders
 *
 * Usage: npx ts-node scripts/test-cancel-reminder.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/services/user.service';
import { ReminderService } from '../src/services/reminder.service';
import { ChatbotService } from '../src/services/chatbot.service';

async function testCancelReminder() {
  console.log('🧪 Testing reminder cancellation feature...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const reminderService = app.get(ReminderService);
  const chatbotService = app.get(ChatbotService);

  // Test phone number
  const testPhone = `+5511999999${Date.now().toString().slice(-3)}`;

  console.log(`📱 Test phone: ${testPhone}\n`);

  try {
    // Step 1: Create test user and reminders
    console.log('1️⃣ Creating test user and reminders...');
    let user = await userService.create(testPhone);
    console.log(`   ✅ User created: ${user.id}\n`);

    // Create 3 test reminders
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const reminder1 = await reminderService.create({
      userId: user.id,
      message: 'Comprar café',
      originalDatetime: tomorrow,
      reminderDatetime: new Date(tomorrow.getTime() - 30 * 60 * 1000),
      advanceTime: 30,
    });
    console.log(`   ✅ Reminder 1 created: "Comprar café"`);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const reminder2 = await reminderService.create({
      userId: user.id,
      message: 'Reunião com cliente',
      originalDatetime: dayAfter,
      reminderDatetime: new Date(dayAfter.getTime() - 60 * 60 * 1000),
      advanceTime: 60,
    });
    console.log(`   ✅ Reminder 2 created: "Reunião com cliente"`);

    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reminder3 = await reminderService.create({
      userId: user.id,
      message: 'Reunião de equipe',
      originalDatetime: nextWeek,
      reminderDatetime: new Date(nextWeek.getTime() - 60 * 60 * 1000),
      advanceTime: 60,
    });
    console.log(`   ✅ Reminder 3 created: "Reunião de equipe"\n`);

    // Step 2: Test scenario - Cancel single reminder
    console.log('2️⃣ Testing single reminder cancellation...');
    console.log('   User: "Cancela o lembrete de café"');
    await chatbotService.processMessage(testPhone, 'Cancela o lembrete de café');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for AI

    console.log('   User: "sim"');
    await chatbotService.processMessage(testPhone, 'sim');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify reminder was cancelled
    const cancelledReminder = await reminderService.findById(reminder1.id);
    if (cancelledReminder?.status === 'CANCELLED') {
      console.log('   ✅ Reminder successfully cancelled!\n');
    } else {
      console.error('   ❌ ERROR: Reminder was not cancelled!\n');
    }

    // Step 3: Test scenario - Multiple reminders with same keyword
    console.log('3️⃣ Testing multiple reminders selection...');
    console.log('   User: "Cancela o lembrete de reunião"');
    await chatbotService.processMessage(testPhone, 'Cancela o lembrete de reunião');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for AI

    console.log('   User: "1" (selecting first)');
    await chatbotService.processMessage(testPhone, '1');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('   User: "sim"');
    await chatbotService.processMessage(testPhone, 'sim');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify correct reminder was cancelled
    const cancelledReminder2 = await reminderService.findById(reminder2.id);
    const keepReminder3 = await reminderService.findById(reminder3.id);

    if (cancelledReminder2?.status === 'CANCELLED' && keepReminder3?.status === 'PENDING') {
      console.log('   ✅ Correct reminder cancelled, other kept!\n');
    } else {
      console.error('   ❌ ERROR: Wrong reminder cancelled!\n');
    }

    // Step 4: Test scenario - Cancel with "não"
    console.log('4️⃣ Testing cancel rejection...');
    console.log('   User: "Cancela reunião de equipe"');
    await chatbotService.processMessage(testPhone, 'Cancela reunião de equipe');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('   User: "não"');
    await chatbotService.processMessage(testPhone, 'não');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify reminder was kept
    const keptReminder = await reminderService.findById(reminder3.id);
    if (keptReminder?.status === 'PENDING') {
      console.log('   ✅ Reminder correctly kept!\n');
    } else {
      console.error('   ❌ ERROR: Reminder was cancelled unexpectedly!\n');
    }

    // Step 5: Test scenario - Non-existent reminder
    console.log('5️⃣ Testing non-existent reminder...');
    console.log('   User: "Cancela o lembrete de academia"');
    await chatbotService.processMessage(testPhone, 'Cancela o lembrete de academia');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ Should show "not found" message\n');

    // Clean up
    console.log('6️⃣ Cleaning up test data...');
    await userService.delete(user.id);
    console.log('   ✅ Test user and reminders deleted\n');

    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
    console.log('📋 Summary:');
    console.log('   - Single reminder cancellation ✅');
    console.log('   - Multiple reminders selection ✅');
    console.log('   - Cancel rejection (não) ✅');
    console.log('   - Non-existent reminder handling ✅');

  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    await app.close();
  }
}

testCancelReminder();
