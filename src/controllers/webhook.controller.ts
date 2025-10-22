import { Controller, Post, Get, Body, Query, Logger, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { ChatbotService } from '../services/chatbot.service';
import { AudioTranscriptionService } from '../services/audio-transcription.service';
import { envConfig } from '../config';

interface TwilioWebhookBody {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaContentType0?: string;
  MediaUrl0?: string;
  ProfileName?: string;
  WaId?: string;
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly chatbotService: ChatbotService,
    private readonly audioTranscriptionService: AudioTranscriptionService,
  ) {}

  /**
   * GET endpoint for webhook verification
   */
  @Get('whatsapp')
  verifyWebhook(@Query() query: any, @Res() res: Response) {
    this.logger.log('📥 Webhook verification request received');

    // Twilio doesn't use challenge-response for WhatsApp webhooks
    // Just return 200 OK
    return res.status(200).send('Webhook is ready');
  }

  /**
   * POST endpoint to receive WhatsApp messages
   */
  @Post('whatsapp')
  async receiveMessage(
    @Body() body: TwilioWebhookBody,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('📨 Received WhatsApp message');
      this.logger.debug(`From: ${body.From}`);
      this.logger.debug(`Message: ${body.Body}`);
      this.logger.debug(`NumMedia: ${body.NumMedia}`);
      this.logger.debug(`MediaContentType: ${body.MediaContentType0}`);
      this.logger.debug(`Profile: ${body.ProfileName}`);

      // Extract phone number (remove whatsapp: prefix)
      const phoneNumber = body.From.replace('whatsapp:', '');

      // Check if message contains audio
      const hasMedia = body.NumMedia && parseInt(body.NumMedia) > 0;
      const isAudio = hasMedia && body.MediaContentType0?.startsWith('audio/');

      if (isAudio && body.MediaUrl0) {
        this.logger.log(`🎤 Audio message detected from ${phoneNumber}`);

        // Send "processing" message to user
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          '🎤 Áudio recebido! Processando...',
        );

        // Download and transcribe audio
        const audioData = await this.audioTranscriptionService.downloadAudioFromUrl(
          body.MediaUrl0,
          envConfig.twilio.accountSid,
          envConfig.twilio.authToken,
        );

        if (!audioData) {
          this.logger.error('❌ Failed to download audio');
          await this.whatsappService.sendTextMessage(
            phoneNumber,
            '❌ Não consegui baixar o áudio. Por favor, tente enviar novamente.',
          );
          return res.status(200).send('OK');
        }

        // Transcribe audio
        const transcription = await this.audioTranscriptionService.transcribeAudio(
          audioData.buffer,
          audioData.mimeType,
        );

        if (!transcription.success || !transcription.text) {
          this.logger.error(`❌ Audio transcription failed: ${transcription.error}`);
          await this.whatsappService.sendTextMessage(
            phoneNumber,
            '❌ Não consegui entender o áudio. Por favor, tente enviar um áudio mais claro ou digite sua mensagem.',
          );
          return res.status(200).send('OK');
        }

        this.logger.log(`✅ Audio transcribed: "${transcription.text}"`);

        // Process transcribed text
        await this.chatbotService.processMessage(phoneNumber, transcription.text, true);
      } else {
        // Regular text message
        const message = body.Body?.trim() || '';
        this.logger.log(`Message from ${phoneNumber}: "${message}"`);

        // Process message through chatbot
        await this.chatbotService.processMessage(phoneNumber, message);
      }

      // Respond to Twilio with 200 OK
      return res.status(200).send('OK');
    } catch (error) {
      this.logger.error('❌ Error processing webhook:', error);

      // Always return 200 to Twilio to avoid retries
      return res.status(200).send('OK');
    }
  }

  /**
   * Status endpoint for message delivery
   */
  @Post('whatsapp/status')
  async messageStatus(@Body() body: any, @Res() res: Response) {
    this.logger.log('📊 Message status update received');
    this.logger.debug(`Message SID: ${body.MessageSid}`);
    this.logger.debug(`Status: ${body.MessageStatus}`);

    // Log status changes
    if (body.MessageStatus === 'failed') {
      this.logger.error(`❌ Message ${body.MessageSid} failed: ${body.ErrorMessage}`);
    } else if (body.MessageStatus === 'delivered') {
      this.logger.log(`✅ Message ${body.MessageSid} delivered`);
    }

    return res.status(200).send('OK');
  }
}
