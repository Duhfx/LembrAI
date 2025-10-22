import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { ParseDateTimePtService } from './services/parse-datetime-pt.service';
import { GeminiConversationService, ConversationMessage } from './services/gemini-conversation.service';

// Load environment variables
dotenv.config();

/**
 * Test AI Conversational Flow
 */
async function testAIConversation() {
  console.log('🧪 Testando Conversa Natural com IA (Gemini)\n');
  console.log('='.repeat(80));

  // Initialize services
  const dateParser = new ParseDateTimePtService();
  const aiConversation = new GeminiConversationService(dateParser);

  console.log(`\n🤖 AI Conversation Status: ${aiConversation.isEnabled() ? '✅ Enabled' : '❌ Disabled'}`);

  if (!aiConversation.isEnabled()) {
    console.log('\n⚠️  GEMINI_API_KEY não configurada');
    console.log('Configure no arquivo .env para testar\n');
    return;
  }

  console.log('='.repeat(80));

  // Conversation scenarios
  const scenarios = [
    {
      name: '1. Lembrete Completo (1 turno)',
      messages: [
        'Me lembre de comprar leite amanhã às 15h',
      ],
    },
    {
      name: '2. Lembrete Incompleto - Falta Horário',
      messages: [
        'Me lembre de ligar pro médico na segunda',
        '10h da manhã',
        '30 minutos antes',
      ],
    },
    {
      name: '3. Conversa Natural',
      messages: [
        'Oi!',
        'Preciso lembrar de uma coisa',
        'Reunião com cliente',
        'Amanhã às 14h',
        '1 hora antes',
      ],
    },
    {
      name: '4. Data sem Hora (deve perguntar)',
      messages: [
        'Lembrete para segunda-feira',
        'Às 9h',
        'Pode ser na hora exata',
      ],
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`\n📋 CENÁRIO: ${scenario.name}\n`);
    console.log('='.repeat(80));

    const history: ConversationMessage[] = [];

    for (let i = 0; i < scenario.messages.length; i++) {
      const userMessage = scenario.messages[i];

      console.log(`\n👤 Usuário: "${userMessage}"`);

      try {
        const result = await aiConversation.processConversation(
          userMessage,
          history,
          {
            planType: 'FREE',
            activeReminders: 2,
            monthlyReminders: 5,
          },
        );

        console.log(`\n🤖 Assistente: "${result.responseMessage}"`);

        if (result.action && result.action !== 'none') {
          console.log(`\n   ➡️  Ação: ${result.action}`);
        }

        if (result.reminderData) {
          console.log(`\n   📝 Dados do Lembrete:`);
          console.log(`      - Mensagem: "${result.reminderData.message}"`);
          if (result.reminderData.dateTime) {
            console.log(`      - Data/Hora: ${result.reminderData.dateTime.toLocaleString('pt-BR')}`);
          } else {
            console.log(`      - Data/Hora: [aguardando]`);
          }
          if (result.reminderData.advanceMinutes !== undefined && result.reminderData.advanceMinutes !== null) {
            console.log(`      - Antecedência: ${result.reminderData.advanceMinutes} minutos`);
          }
        }

        if (result.needsMoreInfo) {
          console.log(`\n   ℹ️  Precisa de mais informações`);
        }

        // Update history
        history.push({ role: 'user', content: userMessage });
        history.push({ role: 'assistant', content: result.responseMessage });

        // If reminder is ready to be created, stop scenario
        if (result.action === 'create_reminder') {
          console.log(`\n   ✅ Lembrete pronto para ser criado!`);
          break;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.log(`\n   ❌ Erro: ${error.message}`);
        break;
      }
    }

    console.log(`\n${'-'.repeat(80)}`);
  }

  console.log(`\n\n${'='.repeat(80)}`);
  console.log('\n✅ Testes de conversa concluídos!\n');
  console.log('💡 Observe como a IA:');
  console.log('   • Mantém contexto entre mensagens');
  console.log('   • Pergunta informações faltantes');
  console.log('   • Entende linguagem natural');
  console.log('   • Extrai dados estruturados');
  console.log('   • Valida datas e horários');
  console.log(`\n${'='.repeat(80)}\n`);
}

// Run tests
testAIConversation()
  .then(() => {
    console.log('✅ Testes concluídos!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  });
