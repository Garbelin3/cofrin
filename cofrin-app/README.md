# Cofrin App

Aplicativo de gerenciamento financeiro desenvolvido com React Native e Expo.

## 🚀 Configuração Inicial

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd cofrin-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas credenciais do Firebase
```

4. Configure o arquivo de configuração do Expo:
```bash
# Copie o arquivo de exemplo
cp app.config.example.js app.config.js

# Edite o arquivo app.config.js se necessário
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Configure Authentication e Firestore
3. Copie as credenciais do seu projeto para o arquivo `.env`:

```env
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
FIREBASE_APP_ID=seu_app_id
FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

## 🔒 Segurança

### ⚠️ IMPORTANTE: Dados Sensíveis

- **NUNCA** commite o arquivo `.env` no repositório
- O arquivo `.gitignore` já está configurado para ignorar arquivos sensíveis
- Use sempre variáveis de ambiente para configurações do Firebase
- Mantenha suas credenciais seguras e não as compartilhe publicamente

### Arquivos Protegidos pelo .gitignore:
- `.env` e variações (`.env.local`, `.env.production`, etc.)
- `app.config.js` (contém configurações sensíveis)
- `node_modules/`
- Arquivos de build e cache
- Logs e arquivos temporários
- Configurações de IDE

### ⚠️ Ações Necessárias Antes do Commit:

1. **Remova dados sensíveis do histórico do Git** (se já foram commitados):
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/config/firebase.js" \
  --prune-empty --tag-name-filter cat -- --all
```

2. **Verifique se não há dados sensíveis nos commits**:
```bash
git log --all --full-history -- src/config/firebase.js
```

3. **Use sempre os arquivos de exemplo**:
- `env.example` → `.env`
- `app.config.example.js` → `app.config.js`

4. **Execute a verificação de segurança antes do commit**:
```bash
npm run security-check
```

## 🏃‍♂️ Executando o Projeto

```bash
# Desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios

# Executar na web
npm run web
```

## 📱 Funcionalidades

- Autenticação de usuários
- Gerenciamento de transações financeiras
- Controle de cartões de crédito
- Definição e acompanhamento de metas
- Gerenciamento de materiais

## 🛠️ Tecnologias Utilizadas

- React Native
- Expo
- Firebase (Authentication, Firestore)
- React Navigation

## 📄 Licença

Este projeto está sob a licença MIT.
