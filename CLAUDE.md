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
npm run db:test            # Test database connectivity
npm run test:whatsapp      # Test WhatsApp/Twilio integration
npm run test:parser        # Test Portuguese date/time parser
npm run test:admin         # Test admin API endpoints
```

## Architecture

### Core Flow: Stateful Conversation Pattern

The chatbot uses a **state machine pattern** managed by `ConversationContextService` (in-memory storage, consider Redis for production). Each user conversation progresses through states defined in `ConversationState`:

1. **INITIAL** → User sends reminder message (e.g., "Comprar leite")
2. **WAITING_DATETIME** → Bot asks "Quando?" / user responds with date/time
3. **WAITING_ADVANCE_TIME** → Bot asks "Quanto tempo antes?" / user specifies advance notice
4. **CONFIRMING** → Bot shows summary / user confirms or cancels

The `ChatbotService` (src/services/chatbot.service.ts) routes messages to state-specific handlers and manages state transitions.

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

The system uses a **custom Portuguese parser** (`ParseDateTimePtService`) that handles:
- Relative days: "hoje", "amanhã", "depois de amanhã"
- Weekdays: "segunda", "terça", etc. (next occurrence)
- Relative time: "em 2 horas", "daqui 30 minutos"
- Specific times: "15h", "09:30", "3 da tarde"

Parsing strategies are tried in order (src/services/parse-datetime-pt.service.ts). The parser can detect datetime in the initial message (e.g., "Comprar leite amanhã às 15h") and skip the WAITING_DATETIME state.

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
ANTHROPIC_API_KEY         # Optional: Claude API for parsing fallback
OPENAI_API_KEY            # Optional: OpenAI fallback
PORT                      # Default 3000
```

## Key Services

- **ChatbotService**: Orchestrates conversation flow and state transitions
- **ConversationContextService**: In-memory conversation state (10min timeout)
- **ParseDateTimePtService**: Portuguese natural language date/time parsing
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
- SEMPRE faça testes do que for implementado
- Faça commit e push no git SOMENTE quando eu pedir
