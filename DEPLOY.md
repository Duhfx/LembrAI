# 🚀 Guia de Deploy - LembrAI no Render.com

## Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Render.com (criar em https://render.com)
- [ ] Credenciais Supabase (já tem)
- [ ] Credenciais Twilio (já tem)
- [ ] Chave Claude API (já tem)

---

## 📦 PASSO 1: Criar Repositório no GitHub

### 1.1 - Inicializar Git Local

Abra o terminal na pasta do projeto e execute:

```bash
git init
git add .
git commit -m "Initial commit - LembrAI"
```

### 1.2 - Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `LembrAI`
3. Deixe como **Privado** (recomendado)
4. **NÃO** inicialize com README, .gitignore ou licença
5. Clique em **Create repository**

### 1.3 - Conectar e Fazer Push

Copie e execute os comandos que o GitHub mostra (algo como):

```bash
git remote add origin https://github.com/SEU-USUARIO/LembrAI.git
git branch -M main
git push -u origin main
```

**✅ Checkpoint:** Seu código deve estar no GitHub agora!

---

## 🌐 PASSO 2: Deploy no Render.com

### 2.1 - Criar Conta e Conectar GitHub

1. Acesse https://render.com
2. Clique em **Get Started**
3. Faça login com sua conta GitHub
4. Autorize o Render a acessar seus repositórios

### 2.2 - Criar Web Service

1. No dashboard do Render, clique em **New +**
2. Selecione **Web Service**
3. Conecte seu repositório `LembrAI`
4. Clique em **Connect** ao lado do repositório

### 2.3 - Configurar o Service

Preencha os campos:

**Basic Settings:**
- **Name:** `lembrai` (ou qualquer nome único)
- **Region:** `Frankfurt (EU Central)` ou `Ohio (US East)`
- **Branch:** `main`
- **Root Directory:** (deixe em branco)
- **Runtime:** `Node`

**Build Settings:**
- **Build Command:**
  ```bash
  npm install && npx prisma generate && npm run build
  ```

- **Start Command:**
  ```bash
  npm start
  ```

**Instance Type:**
- Selecione **Free** (plano gratuito)

### 2.4 - Adicionar Variáveis de Ambiente

Role até **Environment Variables** e adicione (clique em **Add Environment Variable**):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:PMH45bL9QMs2x639@db.erozgfpglhzcrnjxvejb.supabase.co:5432/postgres?sslmode=require` |
| `TWILIO_ACCOUNT_SID` | `AC5f243139ee06c07127e96b5b1d77da7f` |
| `TWILIO_AUTH_TOKEN` | `1277ba894d62b5fb7b4ea21b6b3773c1` |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` |
| `ANTHROPIC_API_KEY` | `sua-chave-claude` |
| `PORT` | `10000` |

**⚠️ IMPORTANTE:** Use suas credenciais reais! As que coloquei acima são as que você me passou antes.

### 2.5 - Finalizar Deploy

1. Clique em **Create Web Service** (no final da página)
2. Aguarde o deploy (pode levar 3-5 minutos)
3. Acompanhe os logs em tempo real

**✅ Checkpoint:** Quando ver "Deploy successful", está pronto! 🎉

---

## 🔗 PASSO 3: Anotar a URL do Render

Após o deploy, você verá uma URL assim:
```
https://lembrai.onrender.com
```

**Anote essa URL!** Vamos usar nos próximos passos.

---

## 📱 PASSO 4: Configurar Webhook no Twilio

### 4.1 - Acessar Console Twilio

1. Acesse https://console.twilio.com
2. Faça login com suas credenciais

### 4.2 - Configurar WhatsApp Sandbox (para testes)

1. No menu lateral, vá em **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Ou acesse direto: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

### 4.3 - Configurar Webhook

1. Na seção **Sandbox Configuration**
2. Em **WHEN A MESSAGE COMES IN**, configure:
   - **URL:** `https://SUA-URL-RENDER.onrender.com/webhook/whatsapp`
   - **HTTP Method:** `POST`

3. Clique em **Save**

**Exemplo de URL completa:**
```
https://lembrai.onrender.com/webhook/whatsapp
```

### 4.4 - Testar Conexão com WhatsApp

1. Na mesma página, você verá um código como: `join <palavra-codigo>`
2. Abra o WhatsApp no seu celular
3. Adicione o número do Twilio: `+1 415 523 8886`
4. Envie a mensagem: `join <palavra-codigo>`
5. Você receberá confirmação que está conectado

**✅ Checkpoint:** WhatsApp conectado ao Twilio Sandbox!

---

## 🧪 PASSO 5: Testar o Sistema

### 5.1 - Testar Admin Panel

Acesse no navegador:
```
https://SUA-URL-RENDER.onrender.com/admin/
```

Você deve ver o dashboard com estatísticas.

### 5.2 - Testar Criação de Lembrete

No WhatsApp, envie para o número do Twilio:

**Teste 1 - Comando de ajuda:**
```
/ajuda
```

**Teste 2 - Criar lembrete:**
```
Comprar leite
```

O bot deve responder pedindo a data. Continue:
```
amanhã às 15h
```

Depois:
```
30 minutos
```

E finalmente:
```
sim
```

**✅ Se tudo funcionou, você verá a confirmação do lembrete criado!**

### 5.3 - Verificar no Admin Panel

Volte ao painel admin e atualize. Você deve ver:
- 1 novo usuário (você)
- 1 novo lembrete
- Estatísticas atualizadas

---

## 📊 PASSO 6: Monitoramento

### Ver Logs em Tempo Real

No dashboard do Render:
1. Clique no seu service `lembrai`
2. Vá na aba **Logs**
3. Você verá todos os logs em tempo real

### Health Check

O Render monitora automaticamente:
```
https://SUA-URL-RENDER.onrender.com/admin/health
```

---

## ⚙️ Configurações Avançadas (Opcional)

### Domínio Customizado

Se quiser usar seu próprio domínio:
1. No Render, vá em **Settings** → **Custom Domain**
2. Adicione seu domínio
3. Configure os DNS conforme instruções

### Atualizar o App

Para fazer mudanças no código:
```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Render fará deploy automático! 🎉

---

## 🐛 Troubleshooting

### Deploy falhou?

**Erro comum:** "Build failed"
- Verifique os logs no Render
- Certifique-se que todas as variáveis de ambiente estão corretas

### WhatsApp não responde?

1. Verifique se o webhook está configurado corretamente
2. Veja os logs no Render (aba Logs)
3. Teste o endpoint manualmente: `https://SUA-URL/admin/health`

### Cold Start (plano gratuito)

No plano free do Render, o app "dorme" após 15 minutos de inatividade.
- Primeira requisição pode levar ~30 segundos
- Para evitar, considere fazer upgrade ou usar um serviço de ping

---

## 🎉 Pronto!

Seu LembrAI está rodando em produção!

**URLs importantes:**
- App: `https://SUA-URL.onrender.com`
- Admin: `https://SUA-URL.onrender.com/admin/`
- Health: `https://SUA-URL.onrender.com/admin/health`

**Próximos passos sugeridos:**
- [ ] Compartilhar com amigos para testar
- [ ] Monitorar uso pelo painel admin
- [ ] Fazer upgrade para plano pago se necessário
- [ ] Configurar domínio customizado

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Render
2. Teste os endpoints manualmente
3. Revise as configurações do Twilio
