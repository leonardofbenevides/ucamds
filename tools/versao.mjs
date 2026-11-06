// Sobe a versão do UCAMDS num passo só.
//
//   pnpm run versao 0.2.0
//   pnpm run versao 0.2.0 --nota "Uma frase sobre o que a versão é"
//
// Três package.json andam juntos (tools/build-pacotes.mjs recusa empacotar se
// divergirem): o da raiz, o de @ucam/ui e o de @ucam/site-ui. E spec/versoes.json
// ganha a entrada da versão, com a data de hoje e a lista de componentes e
// telas — é a diferença entre duas listas que o CHANGELOG chama de "novos".
//
// POR QUE ISTO EXISTE: de 06/10 a 06/11/2026 o UCAMDS publicou mudanças de pixel,
// ADRs que revogaram outras e telas novas, tudo sob a mesma 0.1.5. O tarball
// mudava por baixo da mesma URL: o lockfile de quem já tinha instalado parava de
// bater com o integrity, e ninguém sabia que havia algo novo. Subir a versão à
// mão em três arquivos é o passo que se esquece; aqui é um comando.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compararVersao, inventario } from './agentes/nucleo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFESTOS = ['package.json', 'ui/projects/ui/package.json', 'sites/ui/projects/site-ui/package.json'];

const args = process.argv.slice(2);
const nova = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const iNota = args.indexOf('--nota');
const nota = iNota >= 0 ? args[iNota + 1] : undefined;

const ler = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const atual = JSON.parse(ler('package.json')).version;

if (!nova) {
  console.error(`uso: pnpm run versao <x.y.z> [--nota "..."]   (hoje: ${atual})`);
  process.exit(2);
}
if (compararVersao(nova, atual) <= 0) {
  console.error(`✗ ${nova} não é maior que a ${atual}. Versão publicada não se reusa: o tarball de mesma URL com outro conteúdo quebra o lockfile de quem já instalou.`);
  process.exit(1);
}

// Troca só a linha da versão, para não reformatar o arquivo inteiro.
for (const rel of MANIFESTOS) {
  const txt = ler(rel);
  const trocado = txt.replace(/("version"\s*:\s*")[^"]+(")/, `$1${nova}$2`);
  if (trocado === txt) {
    console.error(`✗ ${rel} não tem campo "version"`);
    process.exit(1);
  }
  writeFileSync(join(ROOT, rel), trocado, 'utf8');
}

// @ucam/site-ui pede a folha na MESMA versão (tools/build-pacotes.mjs confere).
{
  const rel = 'sites/ui/projects/site-ui/package.json';
  const txt = ler(rel);
  writeFileSync(join(ROOT, rel), txt.replace(/("@ucam\/site-css"\s*:\s*")[^"]+(")/, `$1${nova}$2`), 'utf8');
}

const comps = readdirSync(join(ROOT, 'spec', 'components'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(ler(`spec/components/${f}`)));
const projetos = JSON.parse(ler('spec/templates.json')).projetos;
const lista = inventario({ componentes: comps, projetos });

const hoje = new Date();
const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
const versoes = JSON.parse(ler('spec/versoes.json'));
versoes.versoes.push({ versao: nova, data, ...(nota ? { nota } : {}), componentes: lista.componentes, telas: lista.telas });
writeFileSync(join(ROOT, 'spec', 'versoes.json'), JSON.stringify(versoes, null, 2) + '\n', 'utf8');

console.log(`✓ ${atual} → ${nova} (${data})`);
for (const rel of MANIFESTOS) console.log(`  · ${rel}`);
console.log(`  · spec/versoes.json (${lista.componentes.length} componentes, ${lista.telas.length} telas)`);
console.log('\nDepois: pnpm run dist, e publique. Sem o build, o tarball da versão nova não existe.');
