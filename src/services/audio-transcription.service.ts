import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { envConfig } from '../config/env.config';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Audio transcription service using Gemini API
 * Converts WhatsApp audio messages to text in Portuguese
 */
@Injectable()
export class AudioTranscriptionService {
  private readonly logger = new Logger(AudioTranscriptionService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly enabled: boolean;

  constructor() {
    // Initialize Gemini client if API key is available
    if (envConfig.ai.geminiKey) {
      this.genAI = new GoogleGenerativeAI(envConfig.ai.geminiKey);
      this.enabled = true;
      this.logger.log('✅ Audio Transcription Service enabled (Gemini API)');
    } else {
      this.enabled = false;
      this.logger.warn('⚠️  Audio Transcription Service disabled (no GEMINI_API_KEY)');
    }
  }

  /**
   * Transcribe audio buffer to text
   * @param audioBuffer - Buffer containing audio data
   * @param mimeType - MIME type of the audio (e.g., 'audio/ogg', 'audio/mpeg')
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    if (!this.enabled || !this.genAI) {
      return {
        success: false,
        error: 'Audio transcription service is not enabled (no GEMINI_API_KEY)',
      };
    }

    try {
      this.logger.log(`🎤 Transcribing audio (${mimeType}, ${audioBuffer.length} bytes)`);

      // Gemini supports audio files through File API
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Convert buffer to base64
      const base64Audio = audioBuffer.toString('base64');

      // Create the parts array with audio and prompt
      const prompt = {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      };

      const result = await model.generateContent([
        prompt,
        {
          text: 'Transcreva este áudio em português brasileiro. Retorne APENAS o texto transcrito, sem formatação adicional ou comentários.',
        },
      ]);

      const response = await result.response;
      const text = response.text().trim();

      if (!text || text.length === 0) {
        throw new Error('Empty transcription result');
      }

      this.logger.log(`✅ Audio transcribed successfully: "${text.substring(0, 50)}..."`);

      return {
        success: true,
        text,
      };
    } catch (error: any) {
      this.logger.error(`❌ Audio transcription error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Download audio from URL (Twilio sends audio via URL)
   * @param audioUrl - URL to download audio from
   * @param authSid - Twilio Account SID for authentication
   * @param authToken - Twilio Auth Token for authentication
   */
  async downloadAudioFromUrl(
    audioUrl: string,
    authSid: string,
    authToken: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      this.logger.log(`📥 Downloading audio from: ${audioUrl}`);

      // Create basic auth header
      const auth = Buffer.from(`${authSid}:${authToken}`).toString('base64');

      const response = await fetch(audioUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'audio/ogg';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      this.logger.log(`✅ Audio downloaded successfully (${buffer.length} bytes, ${contentType})`);

      return {
        buffer,
        mimeType: contentType,
      };
    } catch (error: any) {
      this.logger.error(`❌ Audio download error: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
