#!/usr/bin/env node
// CLI do @ucam/ds-mcp.
//
//   npx ucam-ds instalar [--forcar]   liga MCP, skills e AGENTS.md no projeto atual
//   npx ucam-ds checar <arquivo...>   audita arquivos contra os contratos (sai 1 com erro)
//   npx ucam-ds versao                diz a versão instalada e se há mais nova publicada
//   npx ucam-ds mcp                   sobe o servidor MCP em stdio
//
// Fonte em tools/agentes/; copiado para o pacote por tools/build-agentes.mjs.

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RAIZ, checar, compararVersao } from '../mcp/nucleo.mjs';

const [, , comando, ...resto] = process.argv;
const forcar = resto.includes('--forcar');
const alvo = process.cwd();

// O que o kit gravou e ninguém mexeu é do kit, e a versão nova SOBRESCREVE: é o
// que o AGENTS.md promete no cabeçalho. Até 06/11/2026 o `instalar` mantinha
// todo arquivo que já existia, e quem atualizava o pacote seguia com as regras
// da versão velha no projeto, sem aviso. A marca de gerado decide: se o dev a
// tirou, editou o arquivo de propósito, e ele fica — com o aviso.
const MARCAS = [/pelo UCAMDS \d+\.\d+\.\d+/, /^---\nname: ucam-[\w-]+\n/];
const ehDoKit = (txt) => MARCAS.some((m) => m.test(txt.replace(/\r\n/g, '\n')));

function gravarDoKit(caminho, conteudo, rotulo) {
  if (existsSync(caminho) && !forcar) {
    const atual = readFileSync(caminho, 'utf8');
    if (atual === conteudo) return console.log(`  · ${rotulo}: já atualizado`);
    if (!ehDoKit(atual)) return console.log(`  · ${rotulo}: editado no projeto, mantido (use --forcar para trocar pela versão do kit)`);
    writeFileSync(caminho, conteudo, 'utf8');
    return console.log(`  ✓ ${rotulo} (atualizado para a ${versaoDoKit()})`);
  }
  writeFileSync(caminho, conteudo, 'utf8');
  console.log(`  ✓ ${rotulo}`);
}

const manifesto = () => JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
const versaoDoKit = () => manifesto().version;

function instalar() {
  const caminhoServidor = relative(alvo, join(RAIZ, 'mcp', 'server.mjs')).replace(/\\/g, '/');
  console.log(`UCAMDS → ${alvo}`);

  // 1. MCP para Claude Code (.mcp.json), mesclando com o que houver.
  const mcpJson = join(alvo, '.mcp.json');
  const atual = existsSync(mcpJson) ? JSON.parse(readFileSync(mcpJson, 'utf8')) : {};
  atual.mcpServers ??= {};
  atual.mcpServers.ucamds = { command: 'node', args: [caminhoServidor] };
  writeFileSync(mcpJson, JSON.stringify(atual, null, 2) + '\n', 'utf8');
  console.log('  ✓ .mcp.json (servidor ucamds)');

  // 2. MCP para VS Code / Copilot (.vscode/mcp.json), mesclando.
  mkdirSync(join(alvo, '.vscode'), { recursive: true });
  const vscode = join(alvo, '.vscode', 'mcp.json');
  const v = existsSync(vscode) ? JSON.parse(readFileSync(vscode, 'utf8')) : {};
  v.servers ??= {};
  v.servers.ucamds = { type: 'stdio', command: 'node', args: ['${workspaceFolder}/' + caminhoServidor] };
  writeFileSync(vscode, JSON.stringify(v, null, 2) + '\n', 'utf8');
  console.log('  ✓ .vscode/mcp.json (servidor ucamds)');

  // 3. Skills em .claude/skills/ (Claude Code) e .agents/skills/ (demais agentes).
  for (const base of ['.claude', '.agents']) {
    for (const s of readdirSync(join(RAIZ, 'skills'))) {
      const dir = join(alvo, base, 'skills', s);
      mkdirSync(dir, { recursive: true });
      gravarDoKit(join(dir, 'SKILL.md'), readFileSync(join(RAIZ, 'skills', s, 'SKILL.md'), 'utf8'), `${base}/skills/${s}/SKILL.md`);
    }
  }

  // 4. AGENTS.md: o do DS entra como arquivo próprio; o do projeto só ganha a referência.
  const agentesDs = join(alvo, 'AGENTS.ucam.md');
  gravarDoKit(agentesDs, readFileSync(join(RAIZ, 'AGENTS.md'), 'utf8'), 'AGENTS.ucam.md');
  const referencia = '\n\n## Design System da UCAM\n\nToda interface deste projeto segue o UCAMDS. Leia `AGENTS.ucam.md` e use o servidor MCP `ucamds` antes de escrever tela ou componente.\n';
  for (const nome of ['AGENTS.md', 'CLAUDE.md']) {
    const arq = join(alvo, nome);
    const txt = existsSync(arq) ? readFileSync(arq, 'utf8') : '';
    if (txt.includes('AGENTS.ucam.md')) {
      console.log(`  · ${nome}: já referencia o UCAMDS`);
      continue;
    }
    writeFileSync(arq, (txt ? txt.trimEnd() : `# ${nome.replace('.md', '')}`) + referencia, 'utf8');
    console.log(`  ✓ ${nome} (referência ao UCAMDS)`);
  }
  console.log(`\nUCAMDS ${versaoDoKit()}. Reinicie o cliente (Claude Code, VS Code) para ele enxergar o servidor e as skills.`);
}

// Pergunta ao site se há versão mais nova. Fica fora do `checar` de propósito:
// o CI pode não ter rede, e auditoria que depende de rede reprova pelo motivo
// errado. Sem rede, diz que não conseguiu perguntar e sai 0.
async function versao() {
  const { version, publicacao } = manifesto();
  console.log(`UCAMDS instalado: ${version}`);
  if (!publicacao?.host) return console.log('  · este pacote não sabe onde o UCAMDS é publicado; veja o site do design system.');
  const base = `${publicacao.host}${publicacao.pacotes}`;
  let publicado;
  try {
    const r = await fetch(`${base}/index.json`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    publicado = await r.json();
  } catch (e) {
    return console.log(`  · não consegui perguntar a ${base} (${e.message}).`);
  }
  const ordem = compararVersao(publicado.versao, version);
  if (ordem === 0) return console.log('  ✓ é a mais nova publicada.');
  if (ordem < 0) return console.log(`  · está à frente da publicada (${publicado.versao}): é um build que ainda não saiu.`);
  console.log(`  ⚠ há a ${publicado.versao}. Para atualizar:\n`);
  for (const p of publicado.pacotes ?? []) console.log(`    pnpm add ${p.nome === '@ucam/ds-mcp' ? '-D ' : ''}${base}/${p.tgz}`);
  console.log(`\n  Troque só os pacotes que o app já usa e rode de novo: npx ucam-ds instalar`);
  console.log(`  O que mudou: ${base}/CHANGELOG.md, ou ucam_get_changes com desde = ${version}`);
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
  case 'versao':
    await versao();
    break;
  case 'mcp':
    await import('../mcp/server.mjs');
    break;
  default:
    console.log('ucam-ds instalar [--forcar] | checar <arquivo...> | versao | mcp');
    process.exit(comando ? 2 : 0);
}
