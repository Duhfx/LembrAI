/**
 * Test script for AI-powered reminder matching
 *
 * Usage: npx ts-node scripts/test-ai-matching.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/services/user.service';
import { ReminderService } from '../src/services/reminder.service';
import { ReminderMatcherService } from '../src/services/reminder-matcher.service';

async function testAIMatching() {
  console.log('🧪 Testing AI-powered reminder matching...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const reminderService = app.get(ReminderService);
  const reminderMatcher = app.get(ReminderMatcherService);

  const testPhone = `+5511999999${Date.now().toString().slice(-3)}`;

  try {
    // Create test user and reminders
    console.log('1️⃣ Creating test data...');
    const user = await userService.create(testPhone);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const reminders = await Promise.all([
      reminderService.create({
        userId: user.id,
        message: 'Comprar café',
        originalDatetime: tomorrow,
        reminderDatetime: tomorrow,
      }),
      reminderService.create({
        userId: user.id,
        message: 'Reunião com cliente',
        originalDatetime: tomorrow,
        reminderDatetime: tomorrow,
      }),
      reminderService.create({
        userId: user.id,
        message: 'Reunião de equipe',
        originalDatetime: tomorrow,
        reminderDatetime: tomorrow,
      }),
      reminderService.create({
        userId: user.id,
        message: 'Ligar para o médico',
        originalDatetime: tomorrow,
        reminderDatetime: tomorrow,
      }),
    ]);

    console.log(`   ✅ Created ${reminders.length} test reminders\n`);

    // Test Case 1: Simple keyword
    console.log('2️⃣ Test Case 1: "café"');
    let result = await reminderMatcher.matchReminders(reminders, 'café');
    console.log(`   Matched: ${result.matchedReminderIds.length} reminders`);
    console.log(`   Expected: 1 (Comprar café)`);
    console.log(`   ✅ ${result.matchedReminderIds.length === 1 ? 'PASS' : 'FAIL'}\n`);

    // Test Case 2: Keyword with article
    console.log('3️⃣ Test Case 2: "da reunião"');
    result = await reminderMatcher.matchReminders(reminders, 'da reunião');
    console.log(`   Matched: ${result.matchedReminderIds.length} reminders`);
    console.log(`   Expected: 2 (Reunião com cliente, Reunião de equipe)`);
    console.log(`   ✅ ${result.matchedReminderIds.length === 2 ? 'PASS' : 'FAIL'}\n`);

    // Test Case 3: Partial keyword
    console.log('4️⃣ Test Case 3: "reunião"');
    result = await reminderMatcher.matchReminders(reminders, 'reunião');
    console.log(`   Matched: ${result.matchedReminderIds.length} reminders`);
    console.log(`   Expected: 2 (Reunião com cliente, Reunião de equipe)`);
    console.log(`   ✅ ${result.matchedReminderIds.length === 2 ? 'PASS' : 'FAIL'}\n`);

    // Test Case 4: Multiple words
    console.log('5️⃣ Test Case 4: "ligar médico"');
    result = await reminderMatcher.matchReminders(reminders, 'ligar médico');
    console.log(`   Matched: ${result.matchedReminderIds.length} reminders`);
    console.log(`   Expected: 1 (Ligar para o médico)`);
    console.log(`   ✅ ${result.matchedReminderIds.length === 1 ? 'PASS' : 'FAIL'}\n`);

    // Test Case 5: No match
    console.log('6️⃣ Test Case 5: "academia"');
    result = await reminderMatcher.matchReminders(reminders, 'academia');
    console.log(`   Matched: ${result.matchedReminderIds.length} reminders`);
    console.log(`   Expected: 0 (no match)`);
    console.log(`   ✅ ${result.matchedReminderIds.length === 0 ? 'PASS' : 'FAIL'}\n`);

    // Clean up
    console.log('7️⃣ Cleaning up...');
    await userService.delete(user.id);
    console.log('   ✅ Test data deleted\n');

    console.log('✅ ALL MATCHING TESTS COMPLETED!\n');

  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    await app.close();
  }
}

testAIMatching();
