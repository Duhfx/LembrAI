# ✅ Checklist de Deploy - LembrAI

Use este checklist para garantir que todos os passos foram executados corretamente.

---

## 📦 FASE 1: Preparação Local

- [ ] Projeto compilou sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Git inicializado (`git init`)
- [ ] Código commitado (`git add . && git commit -m "Initial commit"`)

---

## 🌐 FASE 2: GitHub

- [ ] Conta GitHub criada/logada
- [ ] Repositório `LembrAI` criado no GitHub
- [ ] Repositório configurado como Privado
- [ ] Git remote adicionado (`git remote add origin ...`)
- [ ] Código enviado para GitHub (`git push -u origin main`)
- [ ] Código visível no GitHub (verifique no navegador)

---

## 🚀 FASE 3: Render.com

### Setup Inicial
- [ ] Conta Render criada/logada
- [ ] GitHub conectado ao Render
- [ ] Novo Web Service criado
- [ ] Repositório `LembrAI` selecionado

### Configurações
- [ ] Nome do service definido (ex: `lembrai`)
- [ ] Region selecionada (Frankfurt ou Ohio)
- [ ] Branch `main` selecionada
- [ ] Build Command configurado:
  ```
  npm install && npx prisma generate && npm run build
  ```
- [ ] Start Command configurado:
  ```
  npm start
  ```

### Variáveis de Ambiente
- [ ] `NODE_ENV` = `production`
- [ ] `DATABASE_URL` = (sua URL Supabase)
- [ ] `TWILIO_ACCOUNT_SID` = (seu SID)
- [ ] `TWILIO_AUTH_TOKEN` = (seu token)
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886`
- [ ] `ANTHROPIC_API_KEY` = (sua chave Claude)
- [ ] `PORT` = `10000`

### Deploy
- [ ] Botão "Create Web Service" clicado
- [ ] Deploy iniciado (vendo logs)
- [ ] Deploy concluído (status "Live")
- [ ] URL do Render anotada (ex: `https://lembrai.onrender.com`)

---

## 📱 FASE 4: Twilio

- [ ] Console Twilio acessado (https://console.twilio.com)
- [ ] WhatsApp Sandbox acessado
- [ ] Webhook configurado:
  - URL: `https://SUA-URL.onrender.com/webhook/whatsapp`
  - Method: POST
- [ ] Configuração salva
- [ ] Código de join copiado (ex: `join <palavra>`)
- [ ] WhatsApp conectado ao sandbox (enviou `join <palavra>`)
- [ ] Confirmação recebida do Twilio

---

## 🧪 FASE 5: Testes

### Admin Panel
- [ ] Admin acessado: `https://SUA-URL.onrender.com/admin/`
- [ ] Dashboard carregou corretamente
- [ ] Estatísticas aparecendo (podem estar zeradas)

### Health Check
- [ ] Endpoint testado: `https://SUA-URL.onrender.com/admin/health`
- [ ] Resposta JSON recebida com status "ok"

### WhatsApp Bot
- [ ] Comando `/ajuda` enviado
- [ ] Bot respondeu com instruções
- [ ] Lembrete criado (fluxo completo testado):
  1. Mensagem inicial enviada
  2. Data informada
  3. Tempo de antecedência informado
  4. Confirmação enviada
  5. Lembrete criado com sucesso
- [ ] Comando `/lembretes` testou e mostrou o lembrete
- [ ] Comando `/plano` mostrou informações do plano

### Verificação no Admin
- [ ] Admin atualizado mostra:
  - 1+ usuários
  - 1+ lembretes
  - Estatísticas atualizadas

---

## 📊 FASE 6: Verificação de Logs

- [ ] Logs acessados no Render (aba Logs)
- [ ] Logs mostrando aplicação rodando
- [ ] Mensagens de log aparecendo quando usa WhatsApp
- [ ] Nenhum erro crítico nos logs

---

## 🎯 TUDO PRONTO!

Se todos os itens estão marcados, seu LembrAI está rodando em produção! 🎉

### Informações para Guardar:

**URLs:**
- App: `___________________________________`
- Admin: `___________________________________`
- Health: `___________________________________`

**Credenciais Twilio:**
- Sandbox Number: `+1 415 523 8886`
- Join Code: `___________________________________`

**Observações:**
- Plano Free do Render "dorme" após 15min inativo
- Primeira requisição após sleep pode levar ~30s
- Limite de 750 horas/mês no plano free

---

## 🚨 Se Algo Deu Errado

### Deploy falhou no Render?
1. Verifique os logs na aba "Logs"
2. Confirme que todas variáveis de ambiente estão corretas
3. Tente fazer redeploy: Settings → Manual Deploy

### WhatsApp não responde?
1. Verifique webhook no Twilio (URL correta?)
2. Teste health check: `https://SUA-URL/admin/health`
3. Veja logs no Render quando envia mensagem
4. Confirme que enviou `join <palavra>` no WhatsApp

### Admin não carrega?
1. Verifique se URL está correta (com /admin/ no final)
2. Aguarde alguns segundos (cold start)
3. Verifique logs do Render

### Erro de banco de dados?
1. Confirme que DATABASE_URL está correta
2. Teste conexão ao Supabase
3. Verifique se as tabelas foram criadas

---

## 📞 Próximos Passos

- [ ] Convidar amigos para testar
- [ ] Monitorar uso pelo admin panel
- [ ] Considerar upgrade se passar de 750h/mês
- [ ] Configurar domínio customizado (opcional)
- [ ] Adicionar mais usuários ao plano PAID (via admin panel)

**Divirta-se com seu LembrAI! 🎉**
