// Empacota Work Sans e Inter como fontes auto-hospedadas do UCAMDS Sites.
// A mesma regra do build-fonts: sem CDN, o arquivo sai do servidor do site.
//
//   node tools/build-sites-fonts.mjs

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { familiasSites, arquivosWoff2De, fontFaceCss } from './lib/fonts-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const licencas = familiasSites.map((f) => {
  const l = readFileSync(join(ROOT, 'node_modules', f.pkg, 'LICENSE'), 'utf8')
    .split('\n')
    .find((x) => /SIL|OFL|Open Font/i.test(x))
    ?.trim();
  return `${f.nome}: ${l ?? 'SIL Open Font License 1.1'}`;
});

const cabecalho = `/* @ucam/site-css fontes — gerado por tools/build-sites-fonts.mjs
 * NÃO EDITAR À MÃO.
 *
 * Work Sans (display) e Inter (corpo), auto-hospedadas. Sem CDN.
 * ${licencas.join('\n * ')}
 */
`;

const destino = { fontes: 'dist/sites/fonts', css: 'dist/sites/css/ucam-site-fonts.css', prefixo: '../fonts' };

let bytes = 0;
for (const arquivo of arquivosWoff2De(familiasSites)) {
  const dono = familiasSites
    .filter((f) => arquivo.startsWith(f.arquivo + '-'))
    .sort((a, b) => b.arquivo.length - a.arquivo.length)[0];
  const origem = join(ROOT, 'node_modules', dono.pkg, 'files', arquivo);
  if (!existsSync(origem)) {
    console.error(`✗ ${arquivo} não existe. Rode: pnpm install`);
    process.exit(1);
  }
  bytes += statSync(origem).size;
  const dir = join(ROOT, destino.fontes);
  mkdirSync(dir, { recursive: true });
  copyFileSync(origem, join(dir, arquivo));
}

const alvo = join(ROOT, destino.css);
mkdirSync(dirname(alvo), { recursive: true });
writeFileSync(alvo, `${cabecalho}\n${fontFaceCss(destino.prefixo, familiasSites)}\n`, 'utf8');

console.log('@ucam/site-css fontes → dist/sites/fonts/ e dist/sites/css/ucam-site-fonts.css');
console.log(`  ${arquivosWoff2De(familiasSites).length} arquivos · ${(bytes / 1024).toFixed(1)} KB · Work Sans e Inter, eixo variável`);
