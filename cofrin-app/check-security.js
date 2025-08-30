#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Padrões de dados sensíveis para verificar
const sensitivePatterns = [
    /AIza[0-9A-Za-z-_]{35}/, // Firebase API Key
    /[0-9]{12}:[a-zA-Z0-9_-]{35}/, // Firebase App ID
    /G-[A-Z0-9]{10}/, // Google Analytics Measurement ID
    /[a-zA-Z0-9-]+\.firebaseapp\.com/, // Firebase Auth Domain
    /[a-zA-Z0-9-]+\.firebasestorage\.app/, // Firebase Storage Bucket
];

// Arquivos que devem ser verificados
const filesToCheck = [
    'src/config/firebase.js',
    'app.json',
    'app.config.js',
    '.env',
];

// Função para verificar um arquivo
function checkFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return { file: filePath, status: 'not_found' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    sensitivePatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            issues.push({
                pattern: pattern.toString(),
                matches: matches.length,
                sample: matches[0].substring(0, 10) + '...'
            });
        }
    });

    return {
        file: filePath,
        status: issues.length > 0 ? 'issues_found' : 'clean',
        issues
    };
}

// Função principal
function main() {
    console.log('🔍 Verificando dados sensíveis no repositório...\n');

    let hasIssues = false;

    filesToCheck.forEach(filePath => {
        const result = checkFile(filePath);

        if (result.status === 'not_found') {
            console.log(`✅ ${filePath}: Arquivo não encontrado`);
        } else if (result.status === 'clean') {
            console.log(`✅ ${filePath}: Limpo`);
        } else {
            console.log(`❌ ${filePath}: Dados sensíveis encontrados!`);
            result.issues.forEach(issue => {
                console.log(`   - Padrão: ${issue.pattern}`);
                console.log(`   - Encontrados: ${issue.matches} matches`);
                console.log(`   - Exemplo: ${issue.sample}`);
            });
            hasIssues = true;
        }
        console.log('');
    });

    if (hasIssues) {
        console.log('🚨 ATENÇÃO: Dados sensíveis encontrados!');
        console.log('Por favor, remova esses dados antes de fazer commit.');
        console.log('Use variáveis de ambiente ou arquivos de configuração seguros.');
        process.exit(1);
    } else {
        console.log('✅ Repositório seguro para commit!');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { checkFile, sensitivePatterns };
