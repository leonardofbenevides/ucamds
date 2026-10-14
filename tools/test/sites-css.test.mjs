import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirCss, conferirFolha } from '../build-sites-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('a folha real passa nos portões e emite as classes dos quatro contratos', () => {
  const r = construirCss({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
  assert.match(r.css, /^@import "\.\.\/tokens\/ucam-site-tokens\.css";/m);
  for (const c of ['.ucam-site {', '.ucam-site-btn {', '.ucam-site-btn--primary', '.ucam-site-btn--inverse', '.ucam-site-tag--info', '.ucam-site-icon-chip--lg', '.ucam-site-section-heading__eyebrow', '.ucam-site-section-heading--center', '.ucam-site-inverso']) {
    assert.ok(r.css.includes(c), 'falta ' + c);
  }
  assert.doesNotMatch(r.css, /var\(--ucam-(?!site-)/, 'variável da aplicação dentro da folha dos sites');
  assert.doesNotMatch(r.css, /max-width/);
  assert.doesNotMatch(r.css, /color-mix|oklch\(/);
});

test('portão: token inexistente e primitivo na folha derrubam, nomeando', () => {
  const tokens = { disponiveis: new Set(['--ucam-site-color-text-body', '--ucam-site-wine-600']), primitivos: new Set(['--ucam-site-wine-600']), semanticos: new Set(['--ucam-site-color-text-body']), viewports: new Set(['min:40rem']) };
  const r = conferirFolha('.a { color: var(--ucam-site-color-inventada); } .b { color: var(--ucam-site-wine-600, red); }', tokens);
  assert.ok(r.falhas.some((f) => /inexistente.*--ucam-site-color-inventada/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /primitivo.*--ucam-site-wine-600/.test(f)), r.falhas.join('\n'));
});

test('portão: media query fora dos viewports da semântica derruba', () => {
  const tokens = { disponiveis: new Set(), primitivos: new Set(), semanticos: new Set(), viewports: new Set(['min:40rem']) };
  const r = conferirFolha('@media (min-width: 37rem) { .a { color: red } }', tokens);
  assert.ok(r.falhas.some((f) => /min:37rem/.test(f)), r.falhas.join('\n'));
  const ok = conferirFolha('@media (min-width: 40rem) { .a { color: red } }', tokens);
  assert.deepEqual(ok.falhas, []);
});

test('a camada 3 aplica-se também num invólucro, não só no :root', async () => {
  const { construir } = await import('../build-sites-tokens.mjs');
  const r = construir({ raiz: ROOT });
  const marca = r.arquivos.find(([n]) => n === 'ucam-site-marca-cenpre.css')[1];
  assert.match(marca, /:root\[data-marca="cenpre"\],\n\[data-marca="cenpre"\] \{/);
});

test('hero de página sobre foto: a máscara e o teto de 50% só a partir da grade completa', () => {
  const { css } = construirCss({ raiz: ROOT });
  // Os blocos de @media de nível de topo, com o que cada um contém.
  const blocos = [...css.matchAll(/^@media ([^{]+)\{\n([\s\S]*?)^\}/gm)].map((m) => ({ cond: m[1].trim(), corpo: m[2] }));
  const com = (trecho) => blocos.filter((b) => b.corpo.includes(trecho)).map((b) => b.cond);
  const mascara = '.ucam-site-page-hero__scrim { mask-image: linear-gradient(to right, black 0 55%, transparent 100%); }';
  const teto = '.ucam-site-page-hero--sobre-foto .ucam-site-page-hero__inner > * { max-inline-size: 50%; }';
  assert.deepEqual(com(mascara), ['(min-width: 64rem)']);
  assert.deepEqual(com(teto), ['(min-width: 64rem)']);
  // Fora de media query, nada de máscara: no telefone o véu é uniforme.
  const fora = css.replace(/^@media [^{]+\{\n[\s\S]*?^\}/gm, '');
  assert.ok(!/page-hero__scrim[^}]*mask-image/.test(fora));
  assert.match(fora, /\.ucam-site-page-hero__scrim \{[^}]*background: var\(--ucam-site-color-surface-photo-scrim\);[^}]*opacity: var\(--ucam-site-opacity-photo-scrim\);/);
});

test('números: a coluna é a direta e o valor sobe pela ordem, para a frase ficar por último', () => {
  const { css } = construirCss({ raiz: ROOT });
  const regra = (sel) => css.match(new RegExp(`^${sel.replace(/[.]/g, '\.')} \{([^}]*)\}`, 'm'))?.[1] ?? '';
  assert.doesNotMatch(css, /column-reverse/);
  assert.match(regra('.ucam-site-stats__item'), /flex-direction: column;/);
  assert.match(regra('.ucam-site-stats__value'), /order: -1;/);
  assert.match(regra('.ucam-site-stats__text'), /color: var\(--ucam-site-color-text-body\);/);
});
