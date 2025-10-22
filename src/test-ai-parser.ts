import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { ParseDateTimePtService } from './services/parse-datetime-pt.service';
import { AIReminderParserService } from './services/ai-reminder-parser.service';

// Load environment variables
dotenv.config();

/**
 * Test AI Reminder Parser
 */
async function testAIParser() {
  console.log('🧪 Testando AI Reminder Parser\n');
  console.log('='.repeat(80));

  // Initialize services
  const offlineParser = new ParseDateTimePtService();
  const aiParser = new AIReminderParserService(offlineParser);

  console.log(`\n🤖 AI Parser Status: ${aiParser.isEnabled() ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('='.repeat(80));

  // Test cases
  const testCases = [
    {
      name: 'Caso original do bug',
      input: 'me lembre umas 9:00 de ligar para o cliente',
      expectedCleaned: 'Ligar para o cliente',
      shouldHaveDateTime: true,
    },
    {
      name: 'Mensagem com "amanhã"',
      input: 'comprar leite amanhã às 15h',
      expectedCleaned: 'Comprar leite',
      shouldHaveDateTime: true,
    },
    {
      name: 'Mensagem com dia da semana',
      input: 'ligar pro João segunda 10h',
      expectedCleaned: 'Ligar pro João',
      shouldHaveDateTime: true,
    },
    {
      name: 'Mensagem sem data/hora',
      input: 'reunião importante',
      expectedCleaned: 'Reunião importante',
      shouldHaveDateTime: false,
    },
    {
      name: 'Mensagem com "hoje"',
      input: 'fazer exercício hoje 18h',
      expectedCleaned: 'Fazer exercício',
      shouldHaveDateTime: true,
    },
    {
      name: 'Mensagem com tempo relativo',
      input: 'buscar encomenda em 2 horas',
      expectedCleaned: 'Buscar encomenda',
      shouldHaveDateTime: true,
    },
    {
      name: 'Mensagem complexa',
      input: 'me lembrar de pagar a conta de luz amanhã às 9h da manhã',
      expectedCleaned: 'Pagar a conta de luz',
      shouldHaveDateTime: true,
    },
    {
      name: 'Apenas horário',
      input: 'academia 19h30',
      expectedCleaned: 'Academia',
      shouldHaveDateTime: true,
    },
    // NOVOS TESTES - Casos sem horário explícito
    {
      name: '🆕 Apenas data sem horário - "amanhã é aniversário"',
      input: 'amanhã é meu aniversário',
      expectedCleaned: 'Meu aniversário',
      shouldHaveDateTime: false,
    },
    {
      name: '🆕 Apenas data sem horário - "lembrete para segunda"',
      input: 'lembrete para segunda-feira',
      expectedCleaned: 'Lembrete',
      shouldHaveDateTime: false,
    },
    {
      name: '🆕 Apenas data sem horário - "no próximo sábado"',
      input: 'comprar presente no próximo sábado',
      expectedCleaned: 'Comprar presente',
      shouldHaveDateTime: false,
    },
    {
      name: '🆕 Apenas data sem horário - "semana que vem"',
      input: 'reunião semana que vem',
      expectedCleaned: 'Reunião',
      shouldHaveDateTime: false,
    },
  ];

  // Run tests
  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Teste: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);

    try {
      const result = await aiParser.parseReminder(testCase.input);

      console.log(`\n   Resultado:`);
      console.log(`   - Método usado: ${result.method}`);
      console.log(`   - Confiança: ${result.confidence}`);
      console.log(`   - Mensagem limpa: "${result.cleanedMessage}"`);

      if (result.dateTime) {
        console.log(`   - Data/Hora: ${result.dateTime.toLocaleString('pt-BR')}`);
      } else {
        console.log(`   - Data/Hora: Não encontrada`);
      }

      // Check if cleaned message is acceptable
      const cleanedLower = result.cleanedMessage.toLowerCase();
      const expectedLower = testCase.expectedCleaned.toLowerCase();

      // Simple check: cleaned message should not contain time references
      const hasTimeReferences = /\d{1,2}(h|:)\d{0,2}|amanhã|hoje|segunda|terça|quarta|quinta|sexta|sabado|domingo/i.test(result.cleanedMessage);

      // Check dateTime expectation
      const dateTimeCorrect = testCase.shouldHaveDateTime
        ? result.dateTime !== undefined
        : result.dateTime === undefined;

      const messageCorrect = !hasTimeReferences && cleanedLower.includes(expectedLower.split(' ')[0]);

      if (messageCorrect && dateTimeCorrect) {
        console.log(`   ✅ Sucesso - Mensagem limpa corretamente`);
        if (!testCase.shouldHaveDateTime) {
          console.log(`   ✅ DateTime corretamente NULL (não inventou horário)`);
        }
        successCount++;
      } else {
        if (!messageCorrect) {
          console.log(`   ⚠️  Atenção - Esperado algo próximo de: "${testCase.expectedCleaned}"`);
        }
        if (!dateTimeCorrect) {
          console.log(`   ❌ ERRO - DateTime deveria ser ${testCase.shouldHaveDateTime ? 'preenchido' : 'NULL'}`);
        }
        failCount++;
      }

    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.message}`);
      failCount++;
    }

    console.log('-'.repeat(80));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n📊 Resumo dos Testes:`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log(`   📈 Taxa de sucesso: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  console.log(`\n${'='.repeat(80)}`);

  // Comparison test - AI vs Offline
  if (aiParser.isEnabled()) {
    console.log(`\n🔬 Comparação: AI vs Offline Parser\n`);
    console.log('='.repeat(80));

    const comparisonCase = 'me lembre umas 9:00 de ligar para o cliente';
    console.log(`\nMensagem: "${comparisonCase}"\n`);

    // Force offline parsing
    const offlineParsed = offlineParser.parseDateTime(comparisonCase);
    const offlineCleaned = extractReminderTextSimple(comparisonCase);

    console.log(`📊 Offline Parser:`);
    console.log(`   - Data encontrada: ${offlineParsed.success ? 'Sim' : 'Não'}`);
    console.log(`   - Mensagem limpa: "${offlineCleaned}"`);

    if (offlineParsed.date) {
      console.log(`   - Data/Hora: ${offlineParsed.date.toLocaleString('pt-BR')}`);
    }

    const aiResult = await aiParser.parseReminder(comparisonCase);

    console.log(`\n🤖 AI Parser:`);
    console.log(`   - Data encontrada: ${aiResult.dateTime ? 'Sim' : 'Não'}`);
    console.log(`   - Mensagem limpa: "${aiResult.cleanedMessage}"`);

    if (aiResult.dateTime) {
      console.log(`   - Data/Hora: ${aiResult.dateTime.toLocaleString('pt-BR')}`);
    }

    console.log(`\n✨ Diferença:`);
    console.log(`   Offline: "${offlineCleaned}"`);
    console.log(`   AI:      "${aiResult.cleanedMessage}"`);
    console.log(`   Melhor:  ${aiResult.cleanedMessage.length < offlineCleaned.length ? '🤖 AI' : '📊 Offline (ou empate)'}`);
    console.log(`\n${'='.repeat(80)}`);
  }
}

/**
 * Simple regex-based text extraction (current offline method)
 */
function extractReminderTextSimple(message: string): string {
  let text = message;

  const patterns = [
    /\s+(amanhã|amanha)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
    /\s+(hoje)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
    /\s+(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)(-feira)?\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
    /\s+em\s+\d+\s+(minutos?|horas?|dias?)/gi,
    /\s+(às|as|a|umas)\s*\d{1,2}(h|:?\d{2})?/gi,
    /\s+\d{1,2}(h|:?\d{2})/gi,
  ];

  patterns.forEach(pattern => {
    text = text.replace(pattern, '');
  });

  text = text.trim().replace(/\s+/g, ' ');

  if (text.length < 3) {
    return message;
  }

  return text;
}

// Run tests
testAIParser()
  .then(() => {
    console.log('\n✅ Testes concluídos!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  });
