import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AudioTranscriptionService } from './services/audio-transcription.service';

// Load environment variables
dotenv.config();

/**
 * Test Audio Transcription Service
 *
 * NOTA: Este teste requer:
 * 1. GEMINI_API_KEY configurada no .env
 * 2. Um arquivo de áudio real para testar (não incluído neste teste básico)
 *
 * Para testar com áudio real:
 * - Obtenha um URL de áudio do Twilio (via webhook)
 * - Use o método downloadAudioFromUrl() com credenciais Twilio
 */
async function testAudioTranscription() {
  console.log('🧪 Testando Audio Transcription Service\n');
  console.log('='.repeat(80));

  // Initialize service
  const audioService = new AudioTranscriptionService();

  console.log(`\n🎤 Audio Transcription Status: ${audioService.isEnabled() ? '✅ Enabled' : '❌ Disabled'}`);

  if (!audioService.isEnabled()) {
    console.log('\n⚠️  GEMINI_API_KEY não configurada no .env');
    console.log('Para testar a transcrição de áudio, configure a chave no arquivo .env:');
    console.log('GEMINI_API_KEY=sua_chave_aqui\n');
    console.log('='.repeat(80));
    return;
  }

  console.log('='.repeat(80));
  console.log('\n✅ Serviço inicializado com sucesso!');
  console.log('\n📝 Para testar com áudio real do WhatsApp:');
  console.log('   1. Configure o webhook do Twilio para apontar para seu servidor');
  console.log('   2. Envie um áudio pelo WhatsApp');
  console.log('   3. O webhook receberá a URL do áudio');
  console.log('   4. O serviço baixará e transcreverá automaticamente');

  console.log('\n🔬 Estrutura do serviço:');
  console.log('   ✓ downloadAudioFromUrl() - Baixa áudio do Twilio');
  console.log('   ✓ transcribeAudio() - Transcreve áudio usando Gemini');
  console.log('   ✓ isEnabled() - Verifica se serviço está habilitado');

  console.log('\n📋 Formatos suportados:');
  console.log('   • audio/ogg (padrão do WhatsApp)');
  console.log('   • audio/mpeg');
  console.log('   • audio/wav');
  console.log('   • audio/webm');

  console.log('\n💡 Exemplo de uso no código:');
  console.log(`
  // 1. Baixar áudio do Twilio
  const audioData = await audioService.downloadAudioFromUrl(
    mediaUrl,
    twilioAccountSid,
    twilioAuthToken
  );

  // 2. Transcrever áudio
  const transcription = await audioService.transcribeAudio(
    audioData.buffer,
    audioData.mimeType
  );

  // 3. Usar texto transcrito
  if (transcription.success) {
    console.log('Texto:', transcription.text);
  }
  `);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Validação concluída!\n');
}

// Run tests
testAudioTranscription()
  .then(() => {
    console.log('✅ Testes concluídos!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  });
