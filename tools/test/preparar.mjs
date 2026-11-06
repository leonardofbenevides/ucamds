// Preparo da suíte: gera dist/sites/{tokens,css} antes dos testes.
//
// Três arquivos de teste leem a folha e os tokens dos sites já gerados
// (sites-css, validate-sites-spec, sites-index). Numa árvore limpa — o clone
// que a CI constrói, ou depois de apagar dist/ — eles falhavam por falta de
// arquivo, não por defeito (visto em 09/10/2026). O preparo roda UMA vez,
// antes do node --test, e não dentro de cada arquivo: o runner executa os
// arquivos em paralelo, e três processos escrevendo a mesma folha ao mesmo
// tempo é corrida.
//
//   node tools/test/preparar.mjs

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construir } from '../build-sites-tokens.mjs';
import { construirCss } from '../build-sites-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const tokens = construir({ raiz: ROOT });
if (tokens.falhas.length) {
  console.error('preparo: os tokens dos sites reprovam, a suíte não roda:');
  for (const f of tokens.falhas) console.error('  ' + f);
  process.exit(1);
}
const dirTokens = join(ROOT, 'dist', 'sites', 'tokens');
mkdirSync(dirTokens, { recursive: true });
for (const [nome, conteudo] of tokens.arquivos) writeFileSync(join(dirTokens, nome), conteudo, 'utf8');

const folha = construirCss({ raiz: ROOT });
if (folha.falhas.length) {
  console.error('preparo: a folha dos sites reprova, a suíte não roda:');
  for (const f of folha.falhas) console.error('  ' + f);
  process.exit(1);
}
const dirCss = join(ROOT, 'dist', 'sites', 'css');
mkdirSync(dirCss, { recursive: true });
writeFileSync(join(dirCss, 'ucam-site.css'), folha.css, 'utf8');

// O kit dos agentes (tools/test/agentes.test.mjs sobe o servidor de verdade a
// partir de dist/agentes). Ele lê os tokens resolvidos e a folha do Trilho A;
// numa árvore limpa os dois não existem, e o kit é gerado do zero. Em todo caso
// o kit é REFEITO: testar o dist/agentes de ontem contra a fonte de hoje
// aprovaria o que já mudou.
for (const [saida, gerador] of [
  ['dist/tokens/ucam-tokens.json', 'tools/build-tokens.mjs'],
  ['dist/css/ucam.css', 'tools/build-css.mjs'],
]) {
  if (!existsSync(join(ROOT, saida))) execFileSync(process.execPath, [join(ROOT, gerador)], { cwd: ROOT, stdio: 'ignore' });
}
execFileSync(process.execPath, [join(ROOT, 'tools', 'build-agentes.mjs')], { cwd: ROOT, stdio: 'ignore' });
