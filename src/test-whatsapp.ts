import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WhatsAppService } from './services';

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp integration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const whatsappService = app.get(WhatsAppService);

  try {
    // IMPORTANT: Replace with your actual phone number that joined the sandbox
    const testPhoneNumber = '+554792138899'; // <<< CHANGE THIS

    console.log('📱 Sending test message to:', testPhoneNumber);
    console.log('⚠️  Make sure this number has joined the Twilio sandbox!\n');

    // Test 1: Send welcome message
    console.log('Test 1: Sending welcome message...');
    await whatsappService.sendWelcomeMessage(testPhoneNumber);
    console.log('✅ Welcome message sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Send confirmation
    console.log('Test 2: Sending confirmation message...');
    const testDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    await whatsappService.sendConfirmation(
      testPhoneNumber,
      'Reunião com cliente importante',
      testDate,
    );
    console.log('✅ Confirmation sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Send reminder notification
    console.log('Test 3: Sending reminder notification...');
    await whatsappService.sendReminderNotification(
      testPhoneNumber,
      'Não esqueça de levar os documentos!',
      testDate,
    );
    console.log('✅ Reminder sent!\n');

    console.log('🎉 All WhatsApp tests completed successfully!');
    console.log('\n📱 Check your WhatsApp to see the messages!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   - Phone number not joined to Twilio sandbox');
    console.error('   - Invalid Twilio credentials');
    console.error('   - Phone number format incorrect (should be +5511999999999)');
    process.exit(1);
  } finally {
    await app.close();
  }
}

testWhatsApp();
