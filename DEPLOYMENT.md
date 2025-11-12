# Deployment da Landing Page no GitHub Pages

Este guia explica como fazer o deploy da landing page do LembrAI no GitHub Pages para validação da conta Meta.

## 📋 Pré-requisitos

- Conta no GitHub
- Repositório Git configurado localmente
- Landing page criada em `public/index.html`

## 🚀 Passo a Passo para GitHub Pages

### 1. Preparar o Repositório

Primeiro, certifique-se de que todos os arquivos estão commitados:

```bash
git add public/index.html
git commit -m "feat: Adicionar landing page para validação Meta"
git push origin main
```

### 2. Configurar GitHub Pages

#### Opção A: Via Interface Web do GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** (Configurações)
3. No menu lateral, clique em **Pages**
4. Em **Source** (Fonte), selecione:
   - Branch: `main`
   - Folder: `/public` (se disponível) ou `/ (root)`
5. Clique em **Save**

#### Opção B: Via GitHub Actions (Recomendado para `/public`)

Se você escolheu a pasta `/public`, crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy Landing Page

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './public'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Para usar GitHub Actions:**

```bash
mkdir -p .github/workflows
# Crie o arquivo acima em .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "ci: Adicionar workflow para deploy automático"
git push origin main
```

### 3. Aguardar Deploy

- O deploy geralmente leva 1-2 minutos
- Você receberá uma notificação quando estiver pronto
- A URL será: `https://[seu-usuario].github.io/[nome-do-repo]/`

### 4. Verificar a Página

Acesse a URL do GitHub Pages e confirme que:
- ✅ A página carrega corretamente
- ✅ Todas as seções estão visíveis
- ✅ Links e botões funcionam
- ✅ Design está responsivo (teste no mobile)

## 🌐 Usar Domínio Customizado (Opcional)

Se você tiver um domínio próprio (ex: `lembrai.com.br`):

### 1. Configurar DNS

No seu provedor de domínio (Registro.br, Hostinger, etc), adicione os registros:

**Para domínio apex (lembrai.com.br):**
```
A Record: 185.199.108.153
A Record: 185.199.109.153
A Record: 185.199.110.153
A Record: 185.199.111.153
```

**Para subdomínio (www.lembrai.com.br):**
```
CNAME Record: [seu-usuario].github.io
```

### 2. Configurar no GitHub

1. Vá em **Settings > Pages**
2. Em **Custom domain**, digite seu domínio
3. Marque **Enforce HTTPS**
4. Aguarde validação DNS (pode levar até 24h)

### 3. Adicionar arquivo CNAME ao repositório

Crie o arquivo `public/CNAME` com seu domínio:

```bash
echo "lembrai.com.br" > public/CNAME
git add public/CNAME
git commit -m "feat: Adicionar domínio customizado"
git push origin main
```

## ✅ Checklist para Validação Meta

Antes de submeter à Meta, garanta que a página tem:

- [ ] **URL acessível publicamente** (GitHub Pages ativo)
- [ ] **HTTPS habilitado** (automático no GitHub Pages)
- [ ] **Informações da empresa/produto**
  - [ ] Nome do produto (LembrAI)
  - [ ] Descrição clara do serviço
  - [ ] Como funciona
- [ ] **Política de Privacidade** (link no footer)
- [ ] **Termos de Uso** (link no footer)
- [ ] **Informações de contato** (email, WhatsApp)
- [ ] **Design profissional** e responsivo
- [ ] **Meta tags** para SEO e compartilhamento social

## 📝 URLs Importantes

Depois do deploy, anote:

- **URL do GitHub Pages**: `https://[usuario].github.io/[repo]/`
- **URL da Política de Privacidade**: `/privacy` (a criar)
- **URL dos Termos de Uso**: `/terms` (a criar)

## 🔧 Troubleshooting

### Página não carrega (404)
- Verifique se GitHub Pages está habilitado em Settings
- Confirme que o branch e pasta corretos estão selecionados
- Aguarde 5 minutos e limpe o cache do navegador

### CSS/Fontes não carregam
- Verifique se o index.html está usando URLs absolutas
- Confirme que Font Awesome CDN está acessível
- Teste em modo anônimo do navegador

### Deploy via Actions falha
- Vá em Settings > Actions > General
- Em "Workflow permissions", selecione "Read and write permissions"
- Reexecute o workflow

### Domínio customizado não funciona
- Aguarde até 24h para propagação DNS
- Use ferramentas como `dig` ou `nslookup` para verificar DNS
- Confirme que HTTPS está habilitado no GitHub

## 📚 Próximos Passos

Após o deploy inicial:

1. **Criar páginas legais** (obrigatórias para Meta):
   - `public/privacy.html` - Política de Privacidade
   - `public/terms.html` - Termos de Uso
   - `public/cookies.html` - Política de Cookies

2. **Adicionar Google Analytics** (opcional):
   ```html
   <!-- No <head> do index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

3. **Configurar Meta Pixel** (opcional, para remarketing):
   ```html
   <!-- No <head> do index.html -->
   <script>
     !function(f,b,e,v,n,t,s)
     {/* Meta Pixel code */}
   </script>
   ```

4. **Submeter à Meta para validação**:
   - Acesse Meta Business Manager
   - Vá em Configurações > Negócios
   - Adicione URL do site
   - Aguarde verificação (1-3 dias úteis)

## 💡 Dicas

- **Sempre teste localmente** antes de fazer push
- **Use commits descritivos** para rastrear mudanças
- **Monitore Analytics** após lançamento
- **Atualize conteúdo regularmente** para melhorar SEO
- **Faça backup** dos arquivos importantes

## 🆘 Suporte

Se precisar de ajuda:
- 📖 [Documentação GitHub Pages](https://docs.github.com/pages)
- 📖 [Meta Business Help Center](https://www.facebook.com/business/help)
- 💬 [GitHub Community](https://github.community/)

---

**Criado em**: 2025-01-12
**Última atualização**: 2025-01-12
