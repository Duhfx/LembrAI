import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { ParseDateTimePtService } from './services/parse-datetime-pt.service';
import { GeminiConversationService } from './services/gemini-conversation.service';

dotenv.config();

/**
 * Test specific case: "Enviar e-mail amanhã as 9hrs"
 */
async function testDateRecognition() {
  console.log('🧪 Teste de Reconhecimento de Datas Relativas\n');
  console.log('='.repeat(80));

  const dateParser = new ParseDateTimePtService();
  const aiConversation = new GeminiConversationService(dateParser);

  if (!aiConversation.isEnabled()) {
    console.log('\n⚠️  GEMINI_API_KEY não configurada\n');
    return;
  }

  console.log('\n📅 Data atual:', new Date().toLocaleString('pt-BR'));
  console.log('='.repeat(80));

  const testCases = [
    {
      name: 'Caso reportado: Enviar e-mail amanhã',
      message: 'Enviar e-mail amanhã as 9hrs',
      shouldHaveDateTime: true,
      expectedPattern: /2025-10-23 09:00/,
    },
    {
      name: 'Variação: Email hoje',
      message: 'Enviar email hoje às 14h',
      shouldHaveDateTime: true,
      expectedPattern: /2025-10-22 14:00/,
    },
    {
      name: 'Variação: Reunião segunda',
      message: 'Reunião segunda às 10h',
      shouldHaveDateTime: true,
      expectedPattern: /2025-10-27 10:00/,
    },
    {
      name: 'Caso sem horário (deve perguntar)',
      message: 'Ligar pro cliente amanhã',
      shouldHaveDateTime: false,
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n\n📋 ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log(`👤 Usuário: "${testCase.message}"`);

    try {
      const result = await aiConversation.processConversation(
        testCase.message,
        [],
        { planType: 'FREE', activeReminders: 0, monthlyReminders: 0 },
      );

      console.log(`\n🤖 Resposta: "${result.responseMessage}"`);

      if (result.reminderData?.dateTime) {
        const dateStr = result.reminderData.dateTime.toISOString();
        console.log(`\n✅ Data extraída: ${result.reminderData.dateTime.toLocaleString('pt-BR')}`);
        console.log(`   Mensagem limpa: "${result.reminderData.message}"`);

        if (testCase.shouldHaveDateTime) {
          if (testCase.expectedPattern && testCase.expectedPattern.test(dateStr)) {
            console.log(`\n✅ SUCESSO - Data correta!`);
            successCount++;
          } else {
            console.log(`\n❌ FALHA - Data não corresponde ao esperado`);
            console.log(`   Esperado: padrão ${testCase.expectedPattern}`);
            console.log(`   Recebido: ${dateStr}`);
            failCount++;
          }
        } else {
          console.log(`\n⚠️  Aviso: Data extraída mas não era esperado`);
          failCount++;
        }
      } else {
        console.log(`\n❌ Nenhuma data extraída`);

        if (testCase.shouldHaveDateTime) {
          console.log(`\n❌ FALHA - Deveria ter extraído data e hora`);
          failCount++;
        } else {
          console.log(`\n✅ SUCESSO - Corretamente não extraiu (perguntará ao usuário)`);
          successCount++;
        }
      }

      // Check if AI is incorrectly asking for full date
      const badResponses = [
        'data completa',
        'dia/mês/ano',
        'qual seria a data',
        'confirme a data',
      ];

      const hasBADResponse = badResponses.some(bad =>
        result.responseMessage.toLowerCase().includes(bad)
      );

      if (hasBADResponse) {
        console.log(`\n❌ PROBLEMA CRÍTICO: IA pediu data completa ao invés de calcular!`);
        console.log(`   Isso não deveria acontecer com "amanhã", "hoje", etc.`);
        failCount++;
        successCount = Math.max(0, successCount - 1);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error: any) {
      console.log(`\n❌ Erro: ${error.message}`);
      failCount++;
    }

    console.log('-'.repeat(80));
  }

  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`\n📊 RESULTADO:`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log(`   📈 Taxa: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  console.log(`\n${'='.repeat(80)}\n`);
}

testDateRecognition()
  .then(() => {
    console.log('✅ Teste concluído!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
