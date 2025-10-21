import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ParseDateTimePtService } from './services';

async function testDateParser() {
  console.log('🧪 Testing Date Parser (Portuguese)...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const parser = app.get(ParseDateTimePtService);

  const testCases = [
    // Casos simples
    'amanhã às 15h',
    'amanhã 15h',
    'amanha 3pm',

    // Dias da semana
    'segunda-feira às 9h',
    'sexta 17h',
    'sabado 10h',

    // Horários específicos
    'hoje às 18h',
    'hoje 20:30',
    '15h',
    '09:00',

    // Datas específicas
    '25 de dezembro às 10h',
    '01/01 às 00:00',

    // Relativos
    'em 2 horas',
    'daqui 30 minutos',
    'em 3 dias',

    // Complexos
    'sexta-feira que vem às 14h30',
    'próxima segunda 9h',
    'depois de amanhã 16h',

    // Edge cases
    'meia-noite',
    'meio-dia',
    '18h de hoje',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: "${testCase}"`);
      const result = parser.parseDateTime(testCase);

      if (result.success && result.date) {
        successCount++;
        console.log(`✅ Success (${result.confidence}): ${result.formattedDate}`);

        // Validate
        const isValid = parser.validateDateTime(result.date);
        if (!isValid) {
          console.log(`⚠️  Warning: Date is not valid (too far or in the past)`);
        }
      } else {
        failCount++;
        console.log(`❌ Failed to parse`);
      }

      console.log('');
    } catch (error: any) {
      failCount++;
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Success: ${successCount}/${testCases.length}`);
  console.log(`❌ Failed: ${failCount}/${testCases.length}`);
  console.log(`📈 Success rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);

  await app.close();
}

testDateParser();
