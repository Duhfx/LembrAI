import { Controller, Post, Get, Body, Query, Logger, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { ChatbotService } from '../services/chatbot.service';

interface TwilioWebhookBody {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  ProfileName?: string;
  WaId?: string;
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly chatbotService: ChatbotService,
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
      this.logger.debug(`Profile: ${body.ProfileName}`);

      // Extract phone number (remove whatsapp: prefix)
      const phoneNumber = body.From.replace('whatsapp:', '');
      const message = body.Body?.trim() || '';

      // Log the incoming message
      this.logger.log(`Message from ${phoneNumber}: "${message}"`);

      // Process message through chatbot
      await this.chatbotService.processMessage(phoneNumber, message);

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
