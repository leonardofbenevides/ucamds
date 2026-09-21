#!/usr/bin/env node
// CLI do @ucam/ds-mcp.
//
//   npx ucam-ds instalar [--forcar]   liga MCP, skills e AGENTS.md no projeto atual
//   npx ucam-ds checar <arquivo...>   audita arquivos contra os contratos (sai 1 com erro)
//   npx ucam-ds mcp                   sobe o servidor MCP em stdio
//
// Fonte em tools/agentes/; copiado para o pacote por tools/build-agentes.mjs.

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RAIZ, checar } from '../mcp/nucleo.mjs';

const [, , comando, ...resto] = process.argv;
const forcar = resto.includes('--forcar');
const alvo = process.cwd();

function gravarSeNovo(caminho, conteudo, rotulo) {
  if (existsSync(caminho) && !forcar) {
    console.log(`  · ${rotulo}: já existe, mantido (use --forcar para sobrescrever)`);
    return;
  }
  writeFileSync(caminho, conteudo, 'utf8');
  console.log(`  ✓ ${rotulo}`);
}

function instalar() {
  const caminhoServidor = relative(alvo, join(RAIZ, 'mcp', 'server.mjs')).replace(/\\/g, '/');
  console.log(`DSUCAM → ${alvo}`);

  // 1. MCP para Claude Code (.mcp.json), mesclando com o que houver.
  const mcpJson = join(alvo, '.mcp.json');
  const atual = existsSync(mcpJson) ? JSON.parse(readFileSync(mcpJson, 'utf8')) : {};
  atual.mcpServers ??= {};
  atual.mcpServers.dsucam = { command: 'node', args: [caminhoServidor] };
  writeFileSync(mcpJson, JSON.stringify(atual, null, 2) + '\n', 'utf8');
  console.log('  ✓ .mcp.json (servidor dsucam)');

  // 2. MCP para VS Code / Copilot (.vscode/mcp.json), mesclando.
  mkdirSync(join(alvo, '.vscode'), { recursive: true });
  const vscode = join(alvo, '.vscode', 'mcp.json');
  const v = existsSync(vscode) ? JSON.parse(readFileSync(vscode, 'utf8')) : {};
  v.servers ??= {};
  v.servers.dsucam = { type: 'stdio', command: 'node', args: ['${workspaceFolder}/' + caminhoServidor] };
  writeFileSync(vscode, JSON.stringify(v, null, 2) + '\n', 'utf8');
  console.log('  ✓ .vscode/mcp.json (servidor dsucam)');

  // 3. Skills em .claude/skills/ (Claude Code) e .agents/skills/ (demais agentes).
  for (const base of ['.claude', '.agents']) {
    for (const s of readdirSync(join(RAIZ, 'skills'))) {
      const dir = join(alvo, base, 'skills', s);
      mkdirSync(dir, { recursive: true });
      const destino = join(dir, 'SKILL.md');
      if (existsSync(destino) && !forcar) {
        console.log(`  · ${base}/skills/${s}: já existe, mantido`);
        continue;
      }
      copyFileSync(join(RAIZ, 'skills', s, 'SKILL.md'), destino);
      console.log(`  ✓ ${base}/skills/${s}/SKILL.md`);
    }
  }

  // 4. AGENTS.md: o do DS entra como arquivo próprio; o do projeto só ganha a referência.
  const agentesDs = join(alvo, 'AGENTS.ucam.md');
  gravarSeNovo(agentesDs, readFileSync(join(RAIZ, 'AGENTS.md'), 'utf8'), 'AGENTS.ucam.md');
  const referencia = '\n\n## Design System da UCAM\n\nToda interface deste projeto segue o DSUCAM. Leia `AGENTS.ucam.md` e use o servidor MCP `dsucam` antes de escrever tela ou componente.\n';
  for (const nome of ['AGENTS.md', 'CLAUDE.md']) {
    const arq = join(alvo, nome);
    const txt = existsSync(arq) ? readFileSync(arq, 'utf8') : '';
    if (txt.includes('AGENTS.ucam.md')) {
      console.log(`  · ${nome}: já referencia o DSUCAM`);
      continue;
    }
    writeFileSync(arq, (txt ? txt.trimEnd() : `# ${nome.replace('.md', '')}`) + referencia, 'utf8');
    console.log(`  ✓ ${nome} (referência ao DSUCAM)`);
  }
  console.log('\nReinicie o cliente (Claude Code, VS Code) para ele enxergar o servidor e as skills.');
}

function checarArquivos() {
  const arquivos = resto.filter((a) => !a.startsWith('--'));
  if (!arquivos.length) {
    console.error('uso: ucam-ds checar <arquivo...>');
    process.exit(2);
  }
  let erros = 0;
  for (const arq of arquivos) {
    const { resumo, achados } = checar({ codigo: readFileSync(arq, 'utf8') });
    erros += resumo.erros;
    console.log(`${resumo.aprovado ? '✓' : '✗'} ${arq} — ${resumo.erros} erro(s), ${resumo.avisos} aviso(s)`);
    for (const a of achados) console.log(`    ${a.severidade === 'erro' ? '✗' : '⚠'} [${a.regra}] ${a.mensagem}`);
  }
  process.exit(erros ? 1 : 0);
}

switch (comando) {
  case 'instalar':
    instalar();
    break;
  case 'checar':
    checarArquivos();
    break;
  case 'mcp':
    await import('../mcp/server.mjs');
    break;
  default:
    console.log('ucam-ds instalar [--forcar] | checar <arquivo...> | mcp');
    process.exit(comando ? 2 : 0);
}
