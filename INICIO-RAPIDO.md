# ⚡ Início Rápido - Deploy LembrAI

## 🎯 Objetivo
Colocar o LembrAI rodando em produção em ~30 minutos.

---

## 📋 O que você precisa ter em mãos

✅ **GitHub Account** - https://github.com
✅ **Render Account** - https://render.com (criar de graça)
✅ **Suas credenciais** (já configuradas no .env):
- Supabase DATABASE_URL
- Twilio Account SID e Auth Token
- Anthropic API Key (Claude)

---

## 🚀 Roteiro em 5 Passos

### 1️⃣ GitHub (5 minutos)

```bash
# Na pasta do projeto LembrAI
git init
git add .
git commit -m "Initial commit"

# Criar repo no GitHub: https://github.com/new
# Nome: LembrAI | Privado: Sim

# Conectar (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/LembrAI.git
git branch -M main
git push -u origin main
```

✅ **Verificar:** Código visível no GitHub

---

### 2️⃣ Render.com (10 minutos)

1. Acesse https://dashboard.render.com
2. Clique **New +** → **Web Service**
3. Conecte o repositório `LembrAI`
4. Configure:

**Build & Deploy:**
```
Name: lembrai
Region: Frankfurt (EU Central)
Branch: main
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

**Environment Variables** (clique Add para cada):
```
NODE_ENV = production
PORT = 10000
DATABASE_URL = postgresql://postgres:PMH45bL9QMs2x639@db.erozgfpglhzcrnjxvejb.supabase.co:5432/postgres?sslmode=require
TWILIO_ACCOUNT_SID = AC5f243139ee06c07127e96b5b1d77da7f
TWILIO_AUTH_TOKEN = 1277ba894d62b5fb7b4ea21b6b3773c1
TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
ANTHROPIC_API_KEY = (sua chave Claude)
```

5. Clique **Create Web Service**
6. Aguarde deploy (3-5 min)

✅ **Verificar:** Status "Live" e URL gerada (ex: `https://lembrai.onrender.com`)

---

### 3️⃣ Twilio Webhook (3 minutos)

1. Acesse https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Em **Sandbox Configuration** → **WHEN A MESSAGE COMES IN**:
   ```
   URL: https://SUA-URL-RENDER.onrender.com/webhook/whatsapp
   Method: POST
   ```
3. Clique **Save**

✅ **Verificar:** Configuração salva sem erros

---

### 4️⃣ Conectar WhatsApp (2 minutos)

1. Ainda na página do Twilio, copie o código de join
2. No WhatsApp, adicione: `+1 415 523 8886`
3. Envie: `join <codigo>` (substitua com o código real)
4. Aguarde confirmação

✅ **Verificar:** Mensagem de confirmação recebida

---

### 5️⃣ Testar Tudo (10 minutos)

**Teste 1 - Admin Panel:**
```
https://SUA-URL-RENDER.onrender.com/admin/
```
→ Dashboard deve carregar

**Teste 2 - Health Check:**
```
https://SUA-URL-RENDER.onrender.com/admin/health
```
→ Deve retornar JSON com "status": "ok"

**Teste 3 - WhatsApp:**

Envie no WhatsApp (para +1 415 523 8886):
```
/ajuda
```
→ Bot responde com instruções

**Teste 4 - Criar Lembrete:**

```
1. Você: "Comprar leite"
2. Bot: "Quando você quer ser lembrado?"
3. Você: "amanhã 15h"
4. Bot: "Quanto tempo antes avisar?"
5. Você: "30 minutos"
6. Bot: Mostra resumo
7. Você: "sim"
8. Bot: "✅ Lembrete criado!"
```

**Teste 5 - Verificar Admin:**

Atualize o admin panel → deve mostrar:
- 1 usuário
- 1 lembrete
- Estatísticas atualizadas

✅ **Se tudo acima funcionou: SUCESSO! 🎉**

---

## 📊 URLs Importantes

Anote suas URLs (substitua com as reais):

```
App:     https://__________________.onrender.com
Admin:   https://__________________.onrender.com/admin/
Health:  https://__________________.onrender.com/admin/health
Webhook: https://__________________.onrender.com/webhook/whatsapp
```

---

## 🎮 Comandos do Bot

Teste todos no WhatsApp:

| Comando | Descrição |
|---------|-----------|
| `/ajuda` | Mostra instruções |
| `/cancelar` | Cancela conversa atual |
| `/lembretes` | Lista seus lembretes |
| `/plano` | Mostra uso e limites |

---

## ⚠️ Problemas Comuns

### Deploy falhou?
→ Verifique logs no Render (aba Logs)
→ Confirme variáveis de ambiente

### Bot não responde?
→ Confirme webhook no Twilio
→ Aguarde ~30s (cold start do plano free)
→ Veja logs no Render

### Admin não carrega?
→ Aguarde cold start
→ Verifique URL (com /admin/ no final)

---

## 🎯 Próximos Passos

- [ ] Convidar amigos para testar
- [ ] Monitorar pelo painel admin
- [ ] Criar mais lembretes de teste
- [ ] Testar comando /plano
- [ ] Compartilhar o projeto!

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- `DEPLOY.md` - Guia completo passo a passo
- `CHECKLIST-DEPLOY.md` - Checklist detalhado
- `README.md` - Documentação do projeto

---

**Boa sorte com o deploy! 🚀**

Se precisar de ajuda, verifique primeiro os logs no Render (aba Logs).
