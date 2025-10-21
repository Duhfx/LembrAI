# LembrAI - Plano de Projeto Completo

**Data de Criação:** 21 de outubro de 2025

## 📋 Resumo Executivo

Projeto para desenvolver um chatbot inteligente de lembretes via WhatsApp que permite aos usuários criar, gerenciar e receber notificações de lembretes através de conversas naturais em português. O sistema integra processamento de linguagem natural, agendamento de tarefas e múltiplos canais de notificação.

---

## 📊 Estatísticas do Projeto

- **Total de tarefas principais:** 10
- **Total de subtarefas:** 46
- **Prioridade Alta:** 4 tarefas
- **Prioridade Média:** 5 tarefas
- **Prioridade Baixa:** 1 tarefa

---

## 🎯 Tarefas Principais

### Tarefa 1: Configurar estrutura base do projeto LembrAI

**Prioridade:** ⭐ Alta  
**Status:** ⏳ Pendente  
**Dependências:** Nenhuma

Configurar projeto Node.js com TypeScript, framework backend (NestJS ou Fastify) e estrutura de pastas básica.

#### Detalhes Técnicos

Instalar dependências básicas: NestJS/CLI ou Fastify, TypeScript, tipos do Node. Configurar tsconfig.json otimizado, estrutura src/ com pastas: controllers/, services/, models/, utils/, config/. Configurar scripts npm para dev, build, start. Implementar configuração de ambiente (.env) para variáveis como DATABASE_URL, WHATSAPP_TOKEN, etc.

#### Estratégia de Teste

Verificar se o projeto compila sem erros com 'npm run build' e inicia corretamente com 'npm run dev'

#### Subtarefas

1. **Inicializar projeto Node.js e instalar dependências básicas** (Feito)
   - Criar novo projeto Node.js e instalar todas as dependências fundamentais
   - Executar 'npm init -y', decidir entre NestJS e Fastify
   - Instalar dependências principais e de desenvolvimento

2. **Configurar TypeScript e arquivo tsconfig.json** (Feito)
   - Estabelecer configuração completa do TypeScript
   - Target ES2020, module commonjs, strict mode habilitado
   - Configurar paths absolutos com '@/*' mapping

3. **Criar estrutura de pastas e organização do código** (Feito)
   - Estrutura src/ com subpastas: controllers/, services/, models/, utils/, config/
   - Adicionar index.ts files em cada pasta
   - Configurar barrel exports

4. **Configurar scripts npm e variáveis de ambiente** (Feito)
   - Scripts npm: dev, build, start, test
   - Arquivo .env.example com variáveis necessárias
   - Instalar e configurar dotenv

---

### Tarefa 2: Configurar banco de dados Supabase/PostgreSQL

**Prioridade:** ⭐ Alta  
**Status:** ⏳ Pendente  
**Dependências:** Tarefa 1

Configurar conexão com Supabase e criar schema para usuários, lembretes e notificações.

#### Detalhes Técnicos

Criar conta Supabase, configurar projeto e obter connection string. Criar tabelas: users (id, phone, created_at, plan_type), reminders (id, user_id, message, original_datetime, reminder_datetime, status, created_at), notifications (id, reminder_id, type, sent_at, status). Configurar Prisma ORM ou similar para gerenciar schema e migrations. Implementar seed básico para testes.

#### Estratégia de Teste

Testar conexão com banco, executar migrations e verificar criação de tabelas. Testar CRUD básico em cada tabela

#### Subtarefas

1. **Configurar conta Supabase e obter connection string** (Pendente)
   - Criar conta gratuita no Supabase
   - Configurar novo projeto 'LembrAI-AI'
   - Copiar connection string e configurar .env

2. **Criar schema de banco de dados com tabelas necessárias** (Pendente)
   - Tabela users com campos: id, phone, created_at, plan_type
   - Tabela reminders com relacionamentos
   - Tabela notifications com relacionamentos

3. **Configurar Prisma ORM e sistema de migrations** (Pendente)
   - Instalar @prisma/client e prisma CLI
   - Configurar schema.prisma
   - Implementar migrations

4. **Implementar seeds básicos para ambiente de desenvolvimento** (Pendente)
   - Criar arquivo seed.ts
   - Inserir usuários de teste, lembretes e notificações
   - Configurar script npm run seed

5. **Implementar testes de conexão e operações CRUD básicas** (Pendente)
   - Criar service classes para User, Reminder, Notification
   - Implementar testes unitários
   - Validar constraints e foreign keys

---

### Tarefa 3: Integrar API do WhatsApp (Twilio)

**Prioridade:** ⭐ Alta  
**Status:** ⏳ Pendente  
**Dependências:** Tarefa 1

Configurar webhook para receber mensagens e implementar envio de mensagens via WhatsApp.

#### Detalhes Técnicos

Configurar webhook endpoint (/webhook/whatsapp) para receber mensagens. Implementar service para envio de mensagens com retry automático. Configurar validação de webhook e tratamento de diferentes tipos de mensagem. Implementar rate limiting para evitar spam.

#### Estratégia de Teste

Testar recebimento de mensagens via webhook, envio de mensagens de resposta e validação de assinatura do webhook

#### Subtarefas

1. **Configurar conta e credenciais da API WhatsApp escolhida** (Pendente)
   - Criar conta na plataforma
   - Completar verificação
   - Obter tokens de API (sandbox e produção)
   - Instalar SDK oficial

2. **Implementar webhook endpoint para receber mensagens do WhatsApp** (Pendente)
   - Criar endpoints GET (verificação) e POST (recebimento)
   - Validar assinatura webhook usando crypto
   - Implementar logging estruturado
   - Configurar ngrok para desenvolvimento

3. **Desenvolver service para envio de mensagens WhatsApp** (Pendente)
   - Implementar WhatsAppService com métodos: sendTextMessage, sendTemplate, sendMedia
   - Tratamento de erros específicos da API
   - Adicionar logs para auditoria

4. **Implementar validação de segurança e autenticação do webhook** (Pendente)
   - Verificar header X-Hub-Signature-256
   - Adicionar rate limiting
   - Whitelist de IPs
   - Logs de segurança

5. **Configurar rate limiting e sistema de retry automático** (Pendente)
   - Máximo 10 mensagens/minuto por usuário
   - Retry com backoff exponencial
   - Fila de mensagens (Bull/BullMQ)
   - Dead letter queue

---

### Tarefa 4: Implementar parser de linguagem natural para datas/horários

**Prioridade:** ⭐ Média  
**Status:** ⏳ Pendente  
**Dependências:** Tarefa 1

Integrar Claude API para interpretar textos como "terça às 17h".

#### Detalhes Técnicos

Instalar e configurar chrono-node para parsing básico de datas em português. Como fallback, configurar integração com Claude API para casos complexos. Criar service ParseDateTimeService com métodos: parseDateTime(text), validateDateTime(parsed), formatConfirmation(datetime). Implementar testes com casos como 'amanhã 15h', 'sexta que vem às 9h', 'em 2 horas'.

#### Estratégia de Teste

Criar suite de testes com 20+ exemplos de expressões de data/hora em português e verificar parsing correto

#### Subtarefas

1. **Configurar e testar biblioteca chrono-node para português** (Pendente)
   - Instalar chrono-node
   - Configurar localização para português brasileiro
   - Implementar testes básicos

2. **Implementar integração com OpenAI GPT-4o-mini como fallback** (Pendente)
   - Configurar cliente OpenAI
   - Criar prompts estruturados
   - Lógica de fallback quando chrono-node falha
   - Cache para evitar chamadas duplicadas

3. **Desenvolver ParseDateTimeService com métodos principais** (Pendente)
   - Método parseDateTime que tenta chrono-node e usa OpenAI como fallback
   - Método validateDateTime
   - Método formatConfirmation
   - Logs detalhados

4. **Criar suite abrangente de testes com casos complexos** (Pendente)
   - 25+ casos de teste
   - Expressões simples e complexas
   - Casos edge
   - Testes de integração

---

### Tarefa 5: Desenvolver lógica de conversação do chatbot

**Prioridade:** ⭐ Média  
**Status:** ⏳ Pendente  
**Dependências:** Tarefas 3 e 4

Implementar fluxo conversacional para criação de lembretes via WhatsApp.

#### Detalhes Técnicos

Criar ChatbotService com machine state para gerenciar contexto da conversa. Estados: INITIAL, WAITING_DATETIME, WAITING_ADVANCE_TIME, CONFIRMING. Implementar handlers para cada estado e transições. Lógica: receber mensagem -> extrair datetime -> perguntar antecedência -> confirmar -> salvar. Implementar fallbacks para mensagens não compreendidas e comandos de ajuda.

#### Estratégia de Teste

Testar fluxo completo de criação de lembrete via simulação de mensagens WhatsApp, incluindo casos de erro e abandono

#### Subtarefas

1. **Design da máquina de estados conversacional** (Pendente)
   - Definir estados: INITIAL, WAITING_DATETIME, WAITING_ADVANCE_TIME, CONFIRMING
   - Mapear transições possíveis
   - Criar diagrama de estados

2. **Implementação do ChatbotService base e gerenciamento de contexto** (Pendente)
   - Métodos para gerenciar contexto: createContext(), getContext(), updateContext()
   - Armazenamento em memória ou cache (Redis)
   - Timeout para limpeza automática

3. **Desenvolvimento dos handlers para cada estado específico** (Pendente)
   - handleInitialState()
   - handleWaitingDateTime()
   - handleWaitingAdvanceTime()
   - handleConfirming()

4. **Implementação das transições entre estados** (Pendente)
   - Método processMessage(userId, message)
   - Recuperar contexto, executar handler, determinar próximo estado
   - Validações de transições

5. **Desenvolvimento de fallbacks e tratamento de erros** (Pendente)
   - Mensagens não compreendidas
   - Comando /ajuda
   - Comando /cancelar
   - Timeout de conversa

6. **Testes do fluxo conversacional completo** (Pendente)
   - Simulação de conversas completas
   - Cenários de fluxo feliz e erro
   - Mocks para APIs

---

### Tarefa 6: Implementar sistema de agendamento de notificações

**Prioridade:** ⭐ Alta  
**Status:** ⏳ Pendente  
**Dependências:** Tarefas 2 e 3

Configurar BullMQ ou Agenda.js para agendar e executar envio de lembretes.

#### Detalhes Técnicos

Instalar e configurar BullMQ com Redis ou Agenda.js com MongoDB/PostgreSQL. Criar ReminderSchedulerService com métodos: scheduleReminder(reminder), cancelReminder(reminderId), rescheduleReminder(reminderId, newDate). Implementar worker para processar jobs agendados e enviar notificações. Configurar retry policy para falhas no envio. Implementar cleanup de jobs antigos.

#### Estratégia de Teste

Testar agendamento de lembretes para diferentes horários, cancelamento e reenvio em caso de falha

#### Subtarefas

1. **Escolher e configurar biblioteca de agendamento (BullMQ vs Agenda.js)** (Pendente)
   - Comparar performance e recursos
   - Instalar dependências necessárias
   - Configurar conexão com banco de dados

2. **Implementar ReminderSchedulerService com métodos principais** (Pendente)
   - scheduleReminder(reminder)
   - cancelReminder(reminderId)
   - rescheduleReminder(reminderId, newDate)
   - Validação e logging

3. **Desenvolver worker para processar jobs agendados** (Pendente)
   - Monitorar fila de jobs
   - Recuperar dados de lembrete
   - Executar envio via WhatsApp
   - Graceful shutdown

4. **Configurar retry policy e tratamento de falhas** (Pendente)
   - Retry com backoff exponencial
   - Máximo de tentativas (3-5)
   - Dead letter queue
   - Diferentes estratégias por tipo de erro

5. **Implementar cleanup e manutenção de jobs antigos** (Pendente)
   - Job de cleanup periódico
   - Remoção de jobs completados
   - Limpeza de logs antigos
   - Alertas de crescimento anormal

---

### Tarefa 7: Implementar sistema de notificações por email de backup

**Prioridade:** ⭐ Média  
**Status:** ⏳ Pendente  
**Dependências:** Tarefas 2 e 6

Configurar Resend ou SendGrid para envio de emails quando WhatsApp falhar.

#### Detalhes Técnicos

Configurar conta Resend ou SendGrid e obter API keys. Criar EmailService com template para lembretes. Implementar lógica de fallback: se envio WhatsApp falhar 3 vezes, enviar email. Criar templates HTML responsivos para emails de lembrete. Implementar opção para usuário cadastrar email opcional. Configurar unsubscribe e compliance LGPD.

#### Estratégia de Teste

Testar envio de emails, template rendering e fluxo de fallback quando WhatsApp não funciona

#### Subtarefas

1. **Configurar provedor de email (Resend ou SendGrid)** (Pendente)
   - Criar conta
   - Obter API keys
   - Configurar domínio de envio

2. **Desenvolver EmailService e templates HTML responsivos** (Pendente)
   - Implementar sendReminderEmail
   - Templates para diferentes tipos de lembrete
   - Sistema de variáveis no template

3. **Implementar lógica de fallback e sistema de tentativas** (Pendente)
   - Contador de tentativas WhatsApp
   - Limite de 3 tentativas
   - Acionamento de email após falhas

4. **Configurar compliance LGPD e sistema de unsubscribe** (Pendente)
   - Campo email_opt_in na tabela users
   - Endpoint de unsubscribe
   - Página de descadastro
   - Consentimento explícito

---

### Tarefa 8: Desenvolver painel administrativo simples

**Prioridade:** ⭐ Baixa  
**Status:** ⏳ Pendente  
**Dependências:** Tarefa 2

Criar interface web básica para visualizar lembretes ativos e estatísticas.

#### Detalhes Técnicos

Implementar endpoints REST para listar lembretes: GET /admin/reminders com filtros por status, data, usuário. Criar página HTML simples com tabela de lembretes, contadores de status e busca básica. Implementar autenticação básica com senha fixa em variável de ambiente. Adicionar métricas: total usuários, lembretes por dia, taxa de entrega. Usar CSS framework leve como Bootstrap ou TailwindCSS.

#### Estratégia de Teste

Testar carregamento da página admin, filtros de lembretes e autenticação

#### Subtarefas

1. **Desenvolver endpoints REST para administração** (Pendente)
   - GET /admin/reminders com filtros
   - GET /admin/stats com métricas
   - Paginação e ordenação

2. **Criar interface HTML com tabelas e filtros** (Pendente)
   - Tabela responsiva com Bootstrap/Tailwind
   - Formulário de filtros
   - Contadores de status
   - Busca por usuário

3. **Implementar autenticação básica e métricas do sistema** (Pendente)
   - Middleware de autenticação
   - Tela de login
   - Dashboard com métricas
   - JWT ou session cookies

---

### Tarefa 9: Implementar sistema de planos e limitações

**Prioridade:** ⭐ Média  
**Status:** ⏳ Pendente  
**Dependências:** Tarefas 2 e 5

Criar lógica para plano gratuito (3 lembretes) e plano pago ilimitado.

#### Detalhes Técnicos

Adicionar campo plan_type na tabela users (free/paid). Implementar middleware de verificação de limite antes de criar lembrete. Para plano free: contar lembretes ativos, bloquear se >= 3. Criar endpoints para upgrade de plano. Implementar lógica de expiração de planos pagos. Adicionar messages informativos sobre limites e upgrade. Configurar webhook para processamento de pagamentos (Stripe/PagSeguro).

#### Estratégia de Teste

Testar limitação de 3 lembretes para usuários free, upgrade para plano pago e resetar contadores

#### Subtarefas

1. **Modificar schema do banco de dados para suportar planos** (Pendente)
   - Campo plan_type (ENUM: free/paid)
   - plan_expires_at, plan_updated_at, reminder_count
   - Índices apropriados

2. **Implementar middleware de verificação de limites** (Pendente)
   - Verificar plano do usuário
   - Contar lembretes ativos para free users
   - Bloquear se >= 3
   - Cache em Redis

3. **Desenvolver endpoints para upgrade e gerenciamento de planos** (Pendente)
   - POST /api/plan/upgrade
   - GET /api/plan/status
   - POST /api/plan/cancel
   - Link de pagamento (Stripe/PagSeguro)

4. **Configurar webhooks de pagamento e processamento** (Pendente)
   - Webhook POST /webhook/payment
   - Validação de assinatura
   - PaymentProcessor para eventos
   - Retry logic para falhas

---

### Tarefa 10: Implementar tratamento de erros e logging

**Prioridade:** ⭐ Média  
**Status:** ⏳ Pendente  
**Dependências:** Tarefas 3 e 6

Configurar sistema robusto de logging e tratamento de erros em produção.

#### Detalhes Técnicos

Configurar Winston para logging estruturado com níveis (error, warn, info, debug). Implementar tratamento global de erros com status codes apropriados. Configurar logs para: webhooks recebidos, mensagens enviadas, erros de parsing, falhas de agendamento. Implementar healthcheck endpoint (/health) para monitoramento. Configurar alertas para erros críticos via email/Slack. Implementar timeout handling para APIs externas.

#### Estratégia de Teste

Testar logging de diferentes cenários, tratamento de erros da API e endpoint de healthcheck

#### Subtarefas

1. **Configurar Winston para logging estruturado** (Pendente)
   - Instalar winston e winston-daily-rotate-file
   - Múltiplos transportes (console e arquivo)
   - Formato JSON estruturado
   - Rotação diária com retenção de 30 dias

2. **Implementar tratamento global de erros** (Pendente)
   - Middleware global para Express
   - Classes de erro customizadas
   - Tratamento síncrono e assíncrono
   - Mapeamento para status codes HTTP

3. **Configurar logs específicos para operações críticas** (Pendente)
   - Logs de webhooks WhatsApp
   - Logs de envio de mensagens
   - Logs de parsing de datas
   - Logs de agendamento
   - IDs de correlação para rastreamento

4. **Implementar healthcheck e sistema de alertas** (Pendente)
   - Endpoint /health
   - Verificação de conectividade
   - Alertas via email/Slack
   - Monitoramento externo
   - Dashboard de status

---

## 🔗 Dependências Entre Tarefas

```
1 (Setup Base)
├── 2 (Database) ──────┬── 6 (Scheduler)
├── 3 (WhatsApp) ───────┼── 5 (Chatbot)
├── 4 (Date Parser) ────┤
└── 8 (Admin Panel)    ├── 9 (Plans)
                        ├── 7 (Email)
                        └── 10 (Logging & Errors)
```

---

## ✅ Checklist de Implementação

### Fase 1: Fundamentos (Tarefas 1-2)
- [ ] Estrutura base do projeto configurada
- [ ] Banco de dados Supabase/PostgreSQL operacional
- [ ] Migrations iniciais criadas
- [ ] Seeds de teste populados

### Fase 2: Integrações Externas (Tarefas 3-4)
- [ ] WhatsApp webhook integrado
- [ ] Parser de datas/horários funcional
- [ ] Chatbot conversacional operacional

### Fase 3: Sistema de Agendamento (Tarefas 5-6)
- [ ] Máquina de estados do chatbot implementada
- [ ] BullMQ/Agenda.js configurado
- [ ] Workers processando jobs corretamente

### Fase 4: Recursos Adicionais (Tarefas 7-10)
- [ ] Email de backup funcional
- [ ] Painel administrativo operacional
- [ ] Sistema de planos implementado
- [ ] Logging e tratamento de erros robustos

---

## 🚀 Próximos Passos

1. Iniciar com a Tarefa 1 para preparar a base do projeto
2. Prosseguir com Tarefa 2 para configurar o banco de dados
3. Integrar WhatsApp (Tarefa 3) em paralelo com o parser de datas (Tarefa 4)
4. Implementar o fluxo conversacional (Tarefa 5)
5. Configurar agendamento (Tarefa 6) como componente crítico
6. Adicionar recursos complementares (Tarefas 7-10)

---

**Última Atualização:** 21 de outubro de 2025