# 🔔 LembrAI

Chatbot inteligente de lembretes via WhatsApp com suporte a linguagem natural em português.

## 📋 Descrição

LembrAI é um assistente de lembretes que funciona via WhatsApp. Ele entende linguagem natural em português para criar lembretes de forma simples e intuitiva.

## ✨ Funcionalidades

- ✅ **Criação de lembretes via WhatsApp** - Conversa natural em português
- ✅ **Parser de linguagem natural** - Entende datas como "amanhã às 15h", "segunda 9h", "em 2 horas"
- ✅ **Sistema de planos** - FREE (limitado) e PAID (ilimitado)
- ✅ **Notificações automáticas** - Sistema de agendamento com cron
- ✅ **Painel administrativo** - Dashboard web para monitoramento
- ✅ **Limites por plano** - Controle de uso baseado no tipo de conta
- ✅ **Logging completo** - Rastreamento de erros e requisições

## 🚀 Tecnologias

- **Backend**: NestJS + TypeScript
- **Banco de dados**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **WhatsApp**: Twilio API
- **Agendamento**: node-cron
- **IA**: Claude API (Anthropic) / OpenAI
- **Frontend Admin**: HTML + CSS + JavaScript

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- Conta Supabase (PostgreSQL)
- Conta Twilio (WhatsApp API)
- Chave API Claude ou OpenAI (opcional, para fallback de parsing)

### Passos

1. Clone o repositório:
```bash
git clone <repo-url>
cd LembrAI
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Database
DATABASE_URL=postgresql://...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...

# AI (opcional)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Server
PORT=3000
```

4. Execute as migrações do banco de dados:
```bash
# Gere o SQL com Prisma
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql

# Execute o SQL no Supabase Dashboard
```

5. Gere o Prisma Client:
```bash
npx prisma generate
```

6. (Opcional) Popule o banco com dados de teste:
```bash
npm run db:seed
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📊 Endpoints

### Webhook WhatsApp
- `GET /webhook/whatsapp` - Verificação do webhook
- `POST /webhook/whatsapp` - Receber mensagens
- `POST /webhook/whatsapp/status` - Status de entrega

### Admin Panel
- `GET /admin/` - Dashboard web
- `GET /admin/stats` - Estatísticas gerais
- `GET /admin/users` - Lista de usuários
- `GET /admin/reminders` - Lista de lembretes
- `POST /admin/users/:id/plan` - Alterar plano do usuário

## 💬 Comandos do Chatbot

- `/ajuda` - Mostra instruções de uso
- `/cancelar` - Cancela a conversa atual
- `/lembretes` - Lista seus lembretes ativos
- `/plano` - Mostra informações do seu plano e uso

## 📱 Fluxo de Conversa

1. **Usuário envia mensagem**: "Comprar leite"
2. **Bot pede data**: "Quando você quer ser lembrado?"
3. **Usuário responde**: "amanhã às 15h"
4. **Bot pede antecedência**: "Quanto tempo antes avisar?"
5. **Usuário responde**: "30 minutos"
6. **Bot confirma**: Mostra resumo e pede confirmação
7. **Usuário confirma**: "sim"
8. **Lembrete criado**: Bot envia confirmação

## 🔐 Planos e Limites

### Plano FREE
- 10 lembretes por mês
- Máximo 5 lembretes ativos
- Até 60 minutos de antecedência
- Apenas notificações WhatsApp

### Plano PAID
- Lembretes ilimitados
- Sem limite de lembretes ativos
- Antecedência ilimitada
- WhatsApp + Email
- Suporte prioritário

## 🧪 Testes

```bash
# Testar banco de dados
npm run db:test

# Testar WhatsApp
npm run test:whatsapp

# Testar parser de datas
npm run test:parser

# Testar admin API
npm run test:admin
```

## 📝 Estrutura do Projeto

```
LembrAI/
├── src/
│   ├── controllers/      # Controladores HTTP
│   │   ├── webhook.controller.ts
│   │   └── admin.controller.ts
│   ├── services/         # Lógica de negócio
│   │   ├── chatbot.service.ts
│   │   ├── whatsapp.service.ts
│   │   ├── reminder.service.ts
│   │   ├── plan-limits.service.ts
│   │   └── ...
│   ├── models/          # Tipos e interfaces
│   ├── filters/         # Filtros de exceção
│   ├── interceptors/    # Interceptadores HTTP
│   ├── config/          # Configurações
│   └── main.ts          # Entry point
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts          # Dados de teste
├── public/
│   └── admin/          # Dashboard web
└── package.json
```

## 🚀 Deploy

### Render.com (Recomendado)

1. Crie conta no Render.com
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

### Variáveis de Ambiente (Produção)

Lembre-se de configurar todas as variáveis do `.env` no painel do Render.

### Webhook do Twilio

Após o deploy, configure no Twilio:
- Webhook URL: `https://seu-app.onrender.com/webhook/whatsapp`
- Method: POST

## 📈 Monitoramento

Acesse o painel admin em:
```
https://seu-app.onrender.com/admin/
```

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se a `DATABASE_URL` está correta
- Certifique-se que o Supabase está acessível

### Mensagens não chegam
- Verifique as credenciais do Twilio
- Confirme que o webhook está configurado
- Verifique os logs no painel admin

### Parser de datas não funciona
- O parser customizado suporta português
- Para casos complexos, configure a chave da Claude API
- Veja exemplos em `src/test-date-parser.ts`

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para abrir issues e pull requests.

## 📄 Licença

ISC

## 👨‍💻 Autor

LembrAI - Chatbot de Lembretes
