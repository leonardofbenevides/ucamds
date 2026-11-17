// PORTÃO DA PARIDADE — toda tela viva fica a menos de 1% da referência.
//
// A tela viva (site/src/app/pages/vivo/<projeto>/<tela>.page.ts) é o código
// que o dev copia para montar a tela em Angular, e a prova de paridade
// (tools/prova-paridade-tela.mjs) é a régua de "igual ao exemplo". Até
// 17/11/2026 a prova só rodava à mão, e a tela viva de naturezas foi de 0,30%
// (05/10) a 8,43% sem ninguém ver: a referência mudou em 12/10 ("simples, uma
// linha") e o Trilho B ficou para trás em densidade, item ativo, rótulo e
// meta da barra. Tela viva sem portão apodrece em silêncio.
//
// Precisa do site construído (pnpm --dir site build) e de Chrome. Entra no
// `pnpm dist`, depois do build, não no build diário.
//
//   node tools/check-paridade.mjs [--teto 1]

import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { achaChrome } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* NO BUILD DA VERCEL NÃO HÁ NAVEGADOR (17/11/2026: o primeiro deploy da 0.4.0
 * caiu aqui). O portão vale no `pnpm dist` da máquina, que é o que antecede o
 * deploy; lá, sem Chrome, ele pula dizendo por quê. Fora da Vercel, sem Chrome
 * é falha — portão que some calado não é portão. */
if (!achaChrome() && process.env.VERCEL) {
  console.log('· paridade: pulado no build da Vercel (sem navegador); roda no pnpm dist local antes do deploy');
  process.exit(0);
}

const VIVO = join(ROOT, 'site', 'src', 'app', 'pages', 'vivo');
const i = process.argv.indexOf('--teto');
const TETO = i >= 0 ? Number(process.argv[i + 1]) : 1;
const LARGURA = '1180';

const telas = [];
for (const projeto of existsSync(VIVO) ? readdirSync(VIVO) : []) {
  const d = join(VIVO, projeto);
  if (!statSync(d).isDirectory()) continue;
  for (const f of readdirSync(d).filter((x) => x.endsWith('.page.ts'))) telas.push([projeto, f.slice(0, -'.page.ts'.length)]);
}
if (!telas.length) { console.log('· paridade: nenhuma tela viva'); process.exit(0); }

let falhas = 0;
for (const [projeto, tela] of telas) {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'prova-paridade-tela.mjs'), projeto, tela, LARGURA], { cwd: ROOT, encoding: 'utf8' });
  const m = /pixels diferentes: ([\d.]+)%/.exec(r.stdout || '');
  if (r.status !== 0 || !m) {
    falhas++;
    console.error(`  ✗ ${projeto}/${tela}: a prova não rodou\n${(r.stderr || r.stdout || '').trim().split('\n').slice(-4).join('\n')}`);
    continue;
  }
  const pct = Number(m[1]);
  const ok = pct <= TETO;
  if (!ok) falhas++;
  console.log(`  ${ok ? '✓' : '✗'} ${projeto}/${tela}  ${pct}%${ok ? '' : `  (teto ${TETO}%; diff em scratchpad/paridade/${projeto}-${tela}.diff.png)`}`);
}
console.log(`${falhas ? '✗' : '✓'} paridade  ${telas.length} tela(s) viva(s) a ${LARGURA}px, teto ${TETO}%`);
process.exitCode = falhas ? 1 : 0;
