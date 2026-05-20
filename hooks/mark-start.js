#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * mark-start.js
 * Registra o timestamp de início de um prompt do Antigravity CLI
 * Salva em um arquivo temporário vinculado ao session_id
 */

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        if (!input.trim()) return;
        const data = JSON.parse(input);
        const sessionId = data.session_id;
        if (sessionId) {
            const tempFile = path.join(os.tmpdir(), `antigravity-start-${sessionId}.txt`);
            const ms = Date.now().toString();
            fs.writeFileSync(tempFile, ms);
        }
    } catch (e) {
        // Falha silenciosa para não interromper o CLI
    }
});
