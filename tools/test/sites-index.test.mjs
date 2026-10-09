import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirIndice } from '../build-sites-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('o índice dos sites junta contrato, demo e a folha, sem @import e sem classe da aplicação', () => {
  const { data, css } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 13);
  assert.deepEqual(data.meta.submarcas, ['cenpre']);
  for (const id of ['button', 'icon-chip', 'section-heading', 'tag']) assert.ok(data.componentes.some((c) => c.id === id), 'falta ' + id);
  const b = data.componentes.find((c) => c.id === 'button');
  assert.equal(b.selector, 'ucam-site-button');
  assert.match(b.demo.principal.preview, /ucam-site-btn--primary/);
  assert.equal(b.trilhos, undefined);
  assert.match(css, /--ucam-site-color-action-primary-default: #8D293A/);
  assert.match(css, /\[data-marca="cenpre"\]/);
  assert.match(css, /\.ucam-site \.ic \{/);
  assert.match(css, /\.ucam-site-btn \{/);
  assert.doesNotMatch(css, /@import/);
  // As fontes dos sites carregam no site de docs pelo espelho em /sites/fonts.
  assert.ok(css.includes("font-family: 'Work Sans Variable'"), 'falta o @font-face da Work Sans');
  assert.ok(css.includes("url('/sites/fonts/inter-latin-wght-normal.woff2')"), 'falta a Inter em /sites/fonts');
  assert.ok(!css.includes('http://') && !css.includes('https://'), 'URL externa na folha dos sites');
  assert.doesNotMatch(css, /var\(--ucam-(?!site-)/, 'variável da aplicação na folha dos sites');
});
