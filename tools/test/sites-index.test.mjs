import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirIndice } from '../build-sites-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('o índice dos sites junta contrato, demo e a folha, sem @import e sem classe da aplicação', () => {
  const { data, css } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 4);
  assert.deepEqual(data.meta.submarcas, ['cenpre']);
  assert.deepEqual(data.componentes.map((c) => c.id), ['button', 'icon-chip', 'section-heading', 'tag']);
  const b = data.componentes[0];
  assert.equal(b.selector, 'ucam-site-button');
  assert.match(b.demo.principal.preview, /ucam-site-btn--primary/);
  assert.equal(b.trilhos, undefined);
  assert.match(css, /--ucam-site-color-action-primary-default: #8D293A/);
  assert.match(css, /\[data-marca="cenpre"\]/);
  assert.match(css, /\.ucam-site \.ic\{/);
  assert.match(css, /\.ucam-site-btn \{/);
  assert.doesNotMatch(css, /@import/);
  assert.doesNotMatch(css, /@font-face/);
  assert.doesNotMatch(css, /var\(--ucam-(?!site-)/, 'variável da aplicação na folha dos sites');
});
