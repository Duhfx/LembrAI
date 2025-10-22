# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LembrAI is a Portuguese-language WhatsApp reminder chatbot built with NestJS and TypeScript. It allows users to create reminders via natural language conversations on WhatsApp, with features like plan-based limits (FREE/PAID), automated notifications, and an admin dashboard.

## Development Commands

### Build & Run
```bash
npm run build              # Compile TypeScript to dist/
npm run dev                # Development mode with hot reload (nodemon + ts-node)
npm start                  # Production mode (runs compiled code from dist/)
```

### Database
```bash
npx prisma generate        # Generate Prisma client (required after schema changes)
npm run db:seed            # Populate database with test data
npm run db:studio          # Open Prisma Studio for database inspection
```

### Testing
```bash
npm run db:test               # Test database connectivity
npm run test:whatsapp         # Test WhatsApp/Twilio integration
npm run test:parser           # Test Portuguese date/time parser
npm run test:ai-parser        # Test Gemini AI parser for reminders
npm run test:ai-conversation  # Test AI natural conversation flow ⭐
npm run test:audio            # Test audio transcription service
npm run test:admin            # Test admin API endpoints
```

## Architecture

### Core Flow: AI-Powered Natural Conversation

The chatbot uses **Gemini AI** for natural, context-aware conversations. The `GeminiConversationService` manages the entire dialogue flow:

**How it works:**
1. User sends any message in natural language
2. AI analyzes message + conversation history + user context
3. AI responds naturally and extracts structured data (reminder, date, time, advance notice)
4. AI asks for missing information when needed
5. When all data is collected, creates the reminder

**Examples:**
- **One-shot**: "Me lembre de comprar leite amanhã às 15h" → AI extracts everything, asks only for advance time
- **Multi-turn**: "Preciso lembrar de uma coisa" → AI asks what, when, advance time progressively
- **Natural flow**: Supports greetings, clarifications, corrections, and casual conversation

The system maintains conversation history (last 10 messages) for context, stored in `ConversationContextService` (in-memory, use Redis for production).

### Message Flow

```
WhatsApp → Twilio Webhook → WebhookController → ChatbotService → [State Handler]
                                                         ↓
                                               ConversationContextService (state management)
                                                         ↓
                                     PlanLimitsService → ReminderService → Database
                                                         ↓
                                               WhatsAppService (response)
```

### Date/Time Parsing

The system uses **AI-powered parsing with Gemini** (`AIReminderParserService`) that:
- Extracts cleaned reminder messages (removing time references)
- Detects date and time from natural language in Portuguese
- Falls back to custom offline parser (`ParseDateTimePtService`) if AI is unavailable
- Handles complex expressions like "me lembre umas 9:00 de ligar para o cliente"

The offline parser supports:
- Relative days: "hoje", "amanhã", "depois de amanhã"
- Weekdays: "segunda", "terça", etc. (next occurrence)
- Relative time: "em 2 horas", "daqui 30 minutos"
- Specific times: "15h", "09:30", "3 da tarde"

The parser can detect datetime in the initial message (e.g., "Comprar leite amanhã às 15h") and skip the WAITING_DATETIME state.

### Reminder Scheduling

`ReminderSchedulerService` runs a **cron job every minute** (node-cron) to:
1. Query `findPendingReminders()` (reminders due within current minute)
2. Send WhatsApp notifications via Twilio
3. Update reminder status to SENT/FAILED
4. Create `Notification` records for tracking

### Plan Limits System

`PlanLimitsService` enforces tier-based restrictions (src/services/plan-limits.service.ts):
- **FREE**: 10 reminders/month, max 5 active, max 60min advance notice
- **PAID**: Unlimited (value -1 in limits)

Checks occur in `handleInitialState()` before creating reminders.

### Database Schema

Prisma ORM with PostgreSQL (Supabase). Key models:
- **User**: phone (unique), planType, planExpiresAt
- **Reminder**: message, originalDatetime, reminderDatetime, advanceTime, status
- **Notification**: tracks delivery attempts per reminder

Prisma client is generated to `generated/prisma/` (configured in schema.prisma).

### Path Aliases (tsconfig.json)

The project uses TypeScript path aliases:
```typescript
@/*                → src/*
@controllers/*     → src/controllers/*
@services/*        → src/services/*
@models/*          → src/models/*
@utils/*           → src/utils/*
@config/*          → src/config/*
```

Use these imports consistently (e.g., `import { ChatbotService } from '@services/chatbot.service'`).

## Environment Variables

Required for development (see .env.example):
```env
DATABASE_URL              # PostgreSQL connection string (Supabase)
TWILIO_ACCOUNT_SID        # Twilio account ID
TWILIO_AUTH_TOKEN         # Twilio auth token
TWILIO_WHATSAPP_NUMBER    # Format: whatsapp:+14155238886
GEMINI_API_KEY            # Required: Gemini API for parsing and audio transcription
PORT                      # Default 3000
```

## Key Services

- **GeminiConversationService**: AI-powered natural conversation engine (main conversation handler)
- **ChatbotService**: Orchestrates overall flow, handles commands, and manages AI actions
- **ConversationContextService**: Stores conversation history and context (in-memory, 10min timeout)
- **AIReminderParserService**: Gemini-powered reminder parser for single-shot extraction (legacy support)
- **ParseDateTimePtService**: Portuguese natural language date/time parsing (offline fallback)
- **AudioTranscriptionService**: Gemini-powered audio transcription for WhatsApp voice messages
- **PlanLimitsService**: Enforces FREE/PAID plan restrictions
- **ReminderSchedulerService**: Cron-based notification delivery
- **WhatsAppService**: Twilio API wrapper for sending messages
- **AdminService**: Provides stats and user management for admin panel

## Admin Panel

Static HTML dashboard served from `public/admin/` via NestJS ServeStaticModule:
- `/admin/` - Main dashboard
- `/admin/stats` - API: General statistics
- `/admin/users` - API: User list with plan info
- `/admin/reminders` - API: All reminders with status
- `POST /admin/users/:id/plan` - Update user plan type

## Chatbot Commands

Special commands handled in `ChatbotService.handleCommand()`:
- `/ajuda` - Show usage instructions
- `/cancelar` - Reset conversation state to INITIAL
- `/lembretes` - List user's active reminders
- `/plano` - Show plan info and current usage

## Audio Message Support

Users can send **voice messages** via WhatsApp to create reminders:
1. User sends audio message on WhatsApp
2. Twilio webhook delivers audio URL to `/webhook/whatsapp`
3. `AudioTranscriptionService` downloads audio from Twilio
4. Gemini API transcribes audio to text in Portuguese
5. Transcribed text is processed normally by `ChatbotService`
6. User receives feedback: "🎤 Áudio recebido! Processando..."

Supported audio formats: OGG (WhatsApp default), MPEG, WAV, WebM

## Database Migrations

Prisma migrations are not tracked in this repo. For schema changes:
1. Edit `prisma/schema.prisma`
2. Generate migration SQL: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql`
3. Execute SQL manually in Supabase dashboard
4. Run `npx prisma generate` to update client

## Deployment Notes

The app is designed for platforms like Render.com:
- Ensure all environment variables are configured in hosting dashboard
- Set Twilio webhook URL to: `https://your-domain.com/webhook/whatsapp`
- The scheduler starts automatically via `OnModuleInit` in `ReminderSchedulerService`
- Static files (admin panel) are served from `public/` directory
- **GEMINI_API_KEY is required** for AI parsing and audio transcription
- SEMPRE faça testes do que for implementado
- Faça commit e push no git SOMENTE quando eu pedir

## AI-Powered Features

### Natural Conversation
The chatbot uses **Gemini AI** for intelligent, context-aware conversations:
- **Understands intent**: Recognizes what user wants even with casual language
- **Maintains context**: Remembers previous messages in the conversation
- **Asks smart questions**: Only requests missing information
- **Extracts structured data**: Converts natural language to reminder data
- **Validates automatically**: Checks dates, times, and plan limits

### Conversation Examples

**Simple (1-turn):**
```
Usuário: "Me lembre de comprar leite amanhã às 15h"
Bot: "Perfeito! Vou te lembrar de comprar leite amanhã às 15h. ⏰ Quer ser avisado quanto tempo antes?"
```

**Natural (multi-turn):**
```
Usuário: "Oi!"
Bot: "Olá! 😊 Como posso te ajudar a organizar seus lembretes hoje?"
Usuário: "Preciso lembrar de uma coisa"
Bot: "Legal! 😊 Para qual dia e horário você precisa desse lembrete?"
Usuário: "Reunião com cliente amanhã às 14h"
Bot: "Beleza! Então a Reunião com cliente é amanhã, às 14h. Quer que eu te avise com antecedência?"
Usuário: "1 hora antes"
Bot: "Show! Te avisarei da Reunião com cliente às 13h de amanhã. ✅"
```

### Fallback System
If AI is unavailable or fails:
- Automatic fallback to offline Portuguese parser
- Commands always work (`/ajuda`, `/lembretes`, etc.)
- No functionality loss, just less natural responses

## API Costs and Limits

**Gemini API (Google)**:
- Model used: `gemini-2.0-flash-exp`
- Free tier: 15 requests/minute, 1500 requests/day
- Features: Natural conversation + Audio transcription + Text parsing
- Much cheaper than Claude/OpenAI for similar functionality
- Rate limit handling: Automatic fallback to offline mode
- Check current pricing: https://ai.google.dev/pricing
