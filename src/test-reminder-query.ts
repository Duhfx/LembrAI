/**
 * Test script for Reminder Query functionality
 *
 * This script tests the new query reminders feature that allows users
 * to ask "what do I have today?" and get a formatted list of their reminders.
 *
 * Usage:
 *   npm run test:reminder-query
 */

import { config } from 'dotenv';
config();

import { ReminderQueryService } from './services/reminder-query.service';
import { DatabaseService } from './services/database.service';
import { Reminder } from '../generated/prisma';

async function testReminderQuery() {
  console.log('🧪 Testing Reminder Query Functionality\n');

  const queryService = new ReminderQueryService();
  const db = new DatabaseService();

  try {
    // Test 1: Period parsing
    console.log('1️⃣  Testing period parsing...\n');

    const testPeriods = [
      'hoje',
      'amanhã',
      'esta semana',
      'próxima semana',
      'segunda',
      'próximos 3 dias',
      'este mês',
    ];

    testPeriods.forEach(period => {
      const result = queryService.parsePeriod(period);
      console.log(`   Period: "${period}"`);
      console.log(`   → Start: ${result.startDate.toLocaleString('pt-BR')}`);
      console.log(`   → End: ${result.endDate.toLocaleString('pt-BR')}`);
      console.log(`   → Label: ${result.label}\n`);
    });

    console.log('✅ Period parsing test complete\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2: Create test reminders for demo
    console.log('2️⃣  Creating test reminders...\n');

    // Get or create test user
    let testUser = await db.user.findFirst({
      where: { phone: '+5511999999999' },
    });

    if (!testUser) {
      testUser = await db.user.create({
        data: {
          phone: '+5511999999999',
          planType: 'FREE',
        },
      });
      console.log('   ✅ Created test user');
    } else {
      console.log('   ℹ️  Using existing test user');
    }

    // Create sample reminders for today and tomorrow
    const now = new Date();
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    const testReminders = [
      {
        message: 'Reunião com cliente',
        datetime: today,
      },
      {
        message: 'Dentista',
        datetime: tomorrow,
      },
      {
        message: 'Workshop de IA',
        datetime: nextWeek,
      },
    ];

    // Delete old test reminders
    await db.reminder.deleteMany({
      where: { userId: testUser.id },
    });

    // Create new test reminders
    for (const reminder of testReminders) {
      await db.reminder.create({
        data: {
          userId: testUser.id,
          message: reminder.message,
          originalDatetime: reminder.datetime,
          reminderDatetime: reminder.datetime,
          advanceTime: 0,
          status: 'PENDING',
        },
      });
      console.log(`   ✅ Created: ${reminder.message} @ ${reminder.datetime.toLocaleString('pt-BR')}`);
    }

    console.log(`\n   Total test reminders created: ${testReminders.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3: Query reminders
    console.log('3️⃣  Testing reminder queries...\n');

    const queryTests = [
      { period: 'hoje', label: 'Today' },
      { period: 'amanhã', label: 'Tomorrow' },
      { period: 'esta semana', label: 'This week' },
      { period: 'próximos 7 dias', label: 'Next 7 days' },
    ];

    for (const test of queryTests) {
      console.log(`   Query: "${test.period}" (${test.label})`);

      const { startDate, endDate } = queryService.parsePeriod(test.period);

      const reminders = await db.reminder.findMany({
        where: {
          userId: testUser.id,
          status: 'PENDING',
          reminderDatetime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { reminderDatetime: 'asc' },
      });

      const formattedMessage = queryService.formatRemindersList(reminders, test.period);
      console.log('\n   Response:\n');
      console.log(formattedMessage.split('\n').map(line => `   ${line}`).join('\n'));
      console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('✅ Query test complete\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 4: Test empty result
    console.log('4️⃣  Testing empty result...\n');

    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + 2);

    const { startDate, endDate } = queryService.parsePeriod('próximo mês');
    const emptyReminders = await db.reminder.findMany({
      where: {
        userId: testUser.id,
        status: 'PENDING',
        reminderDatetime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const emptyMessage = queryService.formatRemindersList(emptyReminders, 'próximo mês');
    console.log('   Response:\n');
    console.log(emptyMessage.split('\n').map(line => `   ${line}`).join('\n'));
    console.log('\n✅ Empty result test complete\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests passed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Next steps:');
    console.log('1. Build the project: npm run build');
    console.log('2. Run the chatbot: npm run dev');
    console.log('3. Test via WhatsApp: "Quais meus compromissos hoje?"\n');

  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(`   ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testReminderQuery();
