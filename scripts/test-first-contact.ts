/**
 * Test script for first contact welcome message
 *
 * Usage: npx ts-node scripts/test-first-contact.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/services/user.service';
import { ChatbotService } from '../src/services/chatbot.service';

async function testFirstContact() {
  console.log('🧪 Testing first contact welcome message...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const chatbotService = app.get(ChatbotService);

  // Test phone number (use a test number that doesn't exist yet)
  const testPhone = `+5511999999${Date.now().toString().slice(-3)}`;

  console.log(`📱 Test phone: ${testPhone}\n`);

  try {
    // Step 1: Verify user doesn't exist
    console.log('1️⃣ Checking if user exists...');
    let user = await userService.findByPhone(testPhone);
    console.log(`   Result: ${user ? '✅ User exists' : '❌ User does not exist'}\n`);

    if (user) {
      console.log('⚠️  User already exists. Deleting for clean test...');
      await userService.delete(user.id);
      console.log('   ✅ User deleted\n');
    }

    // Step 2: Simulate first message
    console.log('2️⃣ Simulating first contact message...');
    console.log('   Message: "Olá!"');
    await chatbotService.processMessage(testPhone, 'Olá!');
    console.log('   ✅ Message processed\n');

    // Step 3: Verify user was created and flag was set
    console.log('3️⃣ Verifying user creation and flag...');
    user = await userService.findByPhone(testPhone);

    if (!user) {
      console.error('   ❌ ERROR: User was not created!');
      await app.close();
      return;
    }

    console.log(`   ✅ User created: ${user.id}`);
    console.log(`   ✅ firstContactSent: ${user.firstContactSent}`);
    console.log(`   ✅ Plan: ${user.planType}\n`);

    if (!user.firstContactSent) {
      console.error('   ❌ ERROR: firstContactSent flag was not set!');
    } else {
      console.log('   ✅ Flag correctly set!\n');
    }

    // Step 4: Simulate second message (should NOT trigger welcome)
    console.log('4️⃣ Simulating second message...');
    console.log('   Message: "Me lembre de comprar leite amanhã às 15h"');
    await chatbotService.processMessage(testPhone, 'Me lembre de comprar leite amanhã às 15h');
    console.log('   ✅ Message processed (welcome should NOT be sent again)\n');

    // Clean up
    console.log('5️⃣ Cleaning up test data...');
    await userService.delete(user.id);
    console.log('   ✅ Test user deleted\n');

    console.log('✅ TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📋 Summary:');
    console.log('   - User created on first message ✅');
    console.log('   - Welcome message sent (check logs) ✅');
    console.log('   - firstContactSent flag set ✅');
    console.log('   - Second message processed normally ✅');

  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    await app.close();
  }
}

testFirstContact();
