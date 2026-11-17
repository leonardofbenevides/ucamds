// Portão dos guias "Como usar": toda tela de spec/templates.json tem guia
// completo em spec/guias/. Ver o cabeçalho de lib/guias.mjs.
//
//   node tools/check-guias.mjs

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerGuias, confereGuias } from './lib/guias.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const projetos = JSON.parse(readFileSync(join(ROOT, 'spec/templates.json'), 'utf8')).projetos;
const erros = confereGuias(lerGuias(ROOT), projetos);
const telas = projetos.reduce((n, p) => n + p.templates.length, 0);
if (erros.length) {
  console.error(`✗ guias: ${erros.length} problema(s)`);
  for (const e of erros) console.error('  ' + e);
  process.exit(1);
}
console.log(`✓ guias: ${telas} telas, todas com guia`);
