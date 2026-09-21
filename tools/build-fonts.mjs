// Empacota a Geist como fonte auto-hospedada do design system.
//
// A spec proibia webfont, e a razão era boa: "os sistemas da UCAM rodam em
// rede interna e máquinas de secretaria". A restrição real é DEPENDÊNCIA DE
// REDE EXTERNA, não arquivo de fonte. Auto-hospedar atende as duas coisas —
// carrega do mesmo servidor da aplicação, funciona offline, sem CDN.
//
// Copia os woff2 para os três lugares que servem o site e escreve, em cada
// um, o @font-face com o caminho que aquele lugar alcança. O bloco em si vem
// de tools/lib/fonts-css.mjs, para não existir em três cópias.
//
//   node tools/build-fonts.mjs

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { familias, arquivosWoff2, fontFaceCss } from './lib/fonts-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const licenca =
  readFileSync(join(ROOT, 'node_modules/@fontsource-variable/geist/LICENSE'), 'utf8')
    .split('\n')
    .find((l) => /SIL|OFL|Open Font/i.test(l))
    ?.trim() ?? 'Licença: SIL Open Font License 1.1';

const cabecalho = `/* @ucam/fonts — gerado por tools/build-fonts.mjs
 * NÃO EDITAR À MÃO.
 *
 * Geist, auto-hospedada. Sem CDN: o arquivo sai do mesmo servidor da
 * aplicação, que é o que a rede interna da UCAM exige.
 * ${licenca}
 */
`;

/** Cada destino: onde ficam os woff2, e o caminho que o CSS de lá alcança. */
const destinos = [
  { fontes: 'dist/fonts', css: 'dist/css/ucam-fonts.css', prefixo: '../fonts' },
  { fontes: 'site/src/assets/fonts', css: 'site/src/generated/fonts.css', prefixo: '/fonts' },
  { fontes: 'docs/fonts', css: null, prefixo: null },
];

let bytes = 0;
for (const arquivo of arquivosWoff2) {
  const pkg = familias.find((f) => arquivo.startsWith(f.arquivo + '-'));
  // geist-mono também começa com "geist-", então o mais longo vence.
  const dono = familias
    .filter((f) => arquivo.startsWith(f.arquivo + '-'))
    .sort((a, b) => b.arquivo.length - a.arquivo.length)[0] ?? pkg;

  const origem = join(ROOT, 'node_modules', dono.pkg, 'files', arquivo);
  if (!existsSync(origem)) {
    console.error(`✗ ${arquivo} não existe. Rode: pnpm install`);
    process.exit(1);
  }
  bytes += statSync(origem).size;

  for (const d of destinos) {
    const dir = join(ROOT, d.fontes);
    mkdirSync(dir, { recursive: true });
    copyFileSync(origem, join(dir, arquivo));
  }
}

for (const d of destinos) {
  if (!d.css) continue;
  const alvo = join(ROOT, d.css);
  mkdirSync(dirname(alvo), { recursive: true });
  writeFileSync(alvo, `${cabecalho}\n${fontFaceCss(d.prefixo)}\n`, 'utf8');
}

console.log('@ucam/fonts → dist/, site/ e docs/');
console.log(
  `  ${arquivosWoff2.length} arquivos · ${(bytes / 1024).toFixed(1)} KB · Geist e Geist Mono, eixo 100–900`,
);
