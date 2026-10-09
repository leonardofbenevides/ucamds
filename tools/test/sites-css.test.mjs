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
