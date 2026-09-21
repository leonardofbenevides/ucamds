// Portão do kit de agentes: o que está em dist/agentes/ ainda corresponde à spec?
//
// O kit (AGENTS.md, llms.txt, as três skills, o servidor MCP e a spec copiada)
// é GERADO. Ele envelhece a cada mudança em spec/ ou em tools/agentes/, e o
// envelhecimento é silencioso: os arquivos continuam lá, bem formados, dizendo
// a versão passada do sistema. Um agente que lê um AGENTS.md de duas semanas
// atrás não erra por falta de informação — erra com confiança, citando uma
// regra que já foi revogada.
//
// Até aqui a conferência era manual (`find spec tools -newer dist/agentes/AGENTS.md`).
// O que torna isso perigoso é `pnpm run pacotes`: ele NÃO reconstrói nada, só
// empacota o dist/ que existir. Sem este portão, publicar um kit vencido é uma
// linha de comando e nenhum aviso.
//
//   node tools/check-agentes.mjs           avisa e falha se estiver vencido
//   node tools/check-agentes.mjs --aviso   só avisa (sai 0)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'dist', 'agentes');
const SO_AVISO = process.argv.includes('--aviso');

const problemas = [];
const avisos = [];

/* ------------------------------------------------------------ existência --- */

const ESPERADOS = [
  'AGENTS.md',
  'llms.txt',
  'package.json',
  'mcp/nucleo.mjs',
  'mcp/server.mjs',
  'bin/ucam-ds.mjs',
  'skills/ucam-ds/SKILL.md',
  'skills/ucam-migrate/SKILL.md',
  'skills/ucam-audit/SKILL.md',
  'spec/states.json',
  'spec/decisions/adr.json',
  'spec/tokens/semantic.json',
];

for (const rel of ESPERADOS) {
  if (!existsSync(join(KIT, rel))) problemas.push(`falta dist/agentes/${rel} — rode \`pnpm run agentes\``);
}

if (problemas.length) {
  console.error('✗ kit de agentes incompleto:');
  for (const p of problemas) console.error('  · ' + p);
  process.exit(SO_AVISO ? 0 : 1);
}

/* -------------------------------------------------------------- validade --- */

// A referência é o AGENTS.md: ele é o último arquivo que o gerador escreve com
// conteúdo derivado de TUDO — spec, contratos, ADRs, telas e migração.
const marco = statSync(join(KIT, 'AGENTS.md')).mtimeMs;

const arquivosDe = (dir) => {
  const saida = [];
  const anda = (d) => {
    for (const nome of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, nome.name);
      if (nome.isDirectory()) anda(p);
      else saida.push(p);
    }
  };
  if (existsSync(dir)) anda(dir);
  return saida;
};

const fontes = [
  ...arquivosDe(join(ROOT, 'spec')),
  ...arquivosDe(join(ROOT, 'tools', 'agentes')),
  join(ROOT, 'tools', 'build-agentes.mjs'),
];

const vencidos = fontes
  .filter((p) => existsSync(p) && statSync(p).mtimeMs > marco)
  .map((p) => relative(ROOT, p).replace(/\\/g, '/'))
  .sort();

if (vencidos.length) {
  problemas.push(
    `${vencidos.length} fonte(s) mais nova(s) que dist/agentes/AGENTS.md — o kit está vencido:\n    ` +
      vencidos.slice(0, 12).join('\n    ') +
      (vencidos.length > 12 ? `\n    … e mais ${vencidos.length - 12}` : '') +
      '\n    Rode `pnpm run agentes`.',
  );
}

/* -------------------------------------------------------------- cobertura --- */

// Validade por data pega a spec que mudou. Não pega o caso inverso: o gerador
// rodou, os arquivos estão novos, e mesmo assim uma parte da spec não chegou a
// texto nenhum — que foi exatamente o que aconteceu com states.json, copiado
// para o pacote por semanas sem uma linha que o citasse.

const agents = readFileSync(join(KIT, 'AGENTS.md'), 'utf8');
const llms = readFileSync(join(KIT, 'llms.txt'), 'utf8');
const nucleo = readFileSync(join(KIT, 'mcp', 'nucleo.mjs'), 'utf8');
const skills = Object.fromEntries(
  ['ucam-ds', 'ucam-migrate', 'ucam-audit'].map((s) => [s, readFileSync(join(KIT, 'skills', s, 'SKILL.md'), 'utf8')]),
);

// 1. Todo arquivo da spec copiada tem quem o alcance: ou uma ferramenta MCP o
//    lê, ou o llms.txt o aponta. Spec que chega no pacote e ninguém alcança é
//    peso morto que passa por completude.
const RAIZ_SPEC = join(KIT, 'spec');
for (const p of arquivosDe(RAIZ_SPEC)) {
  const rel = relative(RAIZ_SPEC, p).replace(/\\/g, '/');
  // Os contratos são lidos por diretório, não um a um.
  if (rel.startsWith('components/')) continue;
  const alcancado = nucleo.includes(`'${rel}'`) || llms.includes(rel);
  if (!alcancado) avisos.push(`spec/${rel} vai no pacote e nada o alcança: nenhuma ferramenta o lê e o llms.txt não o aponta`);
}

// 2. Toda ferramenta do MCP é citada em algum markdown. Ferramenta que o
//    agente não descobre é ferramenta que não existe.
const ferramentas = [...nucleo.matchAll(/name: '(ucam_[a-z_]+)'/g)].map((m) => m[1]);
const textos = agents + llms + Object.values(skills).join('');
for (const nome of ferramentas) {
  if (!textos.includes(nome)) problemas.push(`${nome} existe no MCP e não é citada em nenhum markdown do kit`);
}
if (ferramentas.length < 10) problemas.push(`só ${ferramentas.length} ferramentas no núcleo — esperava ao menos 10`);

// 3. As seções que o kit promete.
for (const secao of ['## Regras de ouro', '## Como trabalhar', '## Estados', '## Checklist de tela', '## Catálogo']) {
  if (!agents.includes(secao)) problemas.push(`AGENTS.md sem a seção "${secao}"`);
}

// 4. A ADR mais recente aceita chegou ao texto? Não precisa estar entre as
//    essenciais, mas se nenhuma decisão do mês aparece, o recorte envelheceu.
const adrs = JSON.parse(readFileSync(join(KIT, 'spec', 'decisions', 'adr.json'), 'utf8')).decisions;
const ultima = adrs.filter((a) => a.status === 'aceita').sort((a, b) => a.data.localeCompare(b.data)).at(-1);
if (ultima && !agents.includes(ultima.id)) {
  avisos.push(`${ultima.id} (${ultima.data}) é a decisão aceita mais recente e não aparece no AGENTS.md — confira ADRS_ESSENCIAIS em tools/build-agentes.mjs`);
}

/* ---------------------------------------------------------------- saída --- */

const rotulo = 'kit de agentes';
if (avisos.length) {
  console.log(`⚠ ${rotulo} — ${avisos.length} aviso(s):`);
  for (const a of avisos) console.log('  · ' + a);
}

if (problemas.length) {
  console.error(`\n✗ ${rotulo}: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error('  · ' + p);
  if (!SO_AVISO) process.exit(1);
  console.error('  (--aviso: não falhando)');
} else {
  // Hora LOCAL, não ISO: o portão informa quando o kit foi gerado para quem
  // está olhando o relógio da própria máquina, e um carimbo em UTC três horas
  // à frente lê como se o build fosse do futuro.
  const d = new Date(marco).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const alcance = avisos.length ? `${avisos.length} arquivo(s) de spec sem quem os alcance` : 'spec inteira alcançável';
  console.log(`✓ ${rotulo}  gerado em ${d} · ${ferramentas.length} ferramentas, todas citadas · ${alcance}`);
}
