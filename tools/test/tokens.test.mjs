import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookup, criarResolvedor, flatten, expandComposite, aplicarCamada, cssVar, scssLine } from '../lib/tokens.mjs';

const primitive = {
  wine: { $type: 'color', 600: { $value: '#8D293A' }, 700: { $value: '#6C1E2B' } },
  fontSize: { $type: 'dimension', md: { $value: '0.9375rem' } },
  fontWeight: { regular: { $value: 400 } },
};

test('lookup anda pelo caminho e devolve undefined fora dele', () => {
  assert.equal(lookup(primitive, ['wine', '600']).$value, '#8D293A');
  assert.equal(lookup(primitive, ['wine', '999']), undefined);
});

test('resolve troca {grupo.degrau} pelo valor e lança em referência quebrada', () => {
  const resolve = criarResolvedor(primitive);
  assert.equal(resolve('{wine.600}'), '#8D293A');
  assert.equal(resolve('#FFFFFF'), '#FFFFFF');
  assert.throws(() => resolve('{wine.999}'), /referência quebrada: \{wine\.999\}/);
});

test('flatten achata a árvore, guarda o ref e resolve o valor', () => {
  const resolve = criarResolvedor(primitive);
  const semantic = { color: { $type: 'color', action: { primary: { default: { $value: '{wine.600}', $description: 'ação' } } } } };
  const [t] = flatten(semantic, resolve);
  assert.deepEqual(t, {
    path: ['color', 'action', 'primary', 'default'],
    name: 'color-action-primary-default',
    ref: '{wine.600}',
    value: '#8D293A',
    composite: false,
    description: 'ação',
    group: 'color',
  });
});

test('composto vira várias propriedades com nome em kebab', () => {
  const resolve = criarResolvedor(primitive);
  const [t] = flatten({ typography: { body: { $type: 'typography', $value: { fontSize: '{fontSize.md}', fontWeight: '{fontWeight.regular}', lineHeight: '1.5' } } } }, resolve);
  assert.equal(t.composite, true);
  assert.deepEqual(expandComposite(t, resolve), [
    { name: 'typography-body-font-size', value: '0.9375rem' },
    { name: 'typography-body-font-weight', value: 400 },
    { name: 'typography-body-line-height', value: '1.5' },
  ]);
});

test('aplicarCamada substitui por nome e mantém o resto', () => {
  const base = [{ name: 'a', value: 1 }, { name: 'b', value: 2 }];
  const camada = [{ name: 'b', value: 20 }];
  assert.deepEqual(aplicarCamada(base, camada), [{ name: 'a', value: 1 }, { name: 'b', value: 20 }]);
});

test('cssVar e scssLine escrevem com o prefixo pedido', () => {
  const resolve = criarResolvedor(primitive);
  const [t] = flatten({ color: { x: { $value: '{wine.700}' } } }, resolve);
  assert.equal(cssVar('ucam-site', t, resolve), '  --ucam-site-color-x: #6C1E2B;');
  assert.equal(scssLine('ucam-site', t, resolve), '$ucam-site-color-x: #6C1E2B;');
});

import { mesclarPrimitivos } from '../lib/tokens.mjs';

test('mesclar: grupo novo entra inteiro, com o seu $type', () => {
  const r = mesclarPrimitivos(primitive, { magenta: { $type: 'color', 700: { $value: '#b4365b' } } });
  assert.equal(r.magenta.$type, 'color');
  assert.equal(r.magenta[700].$value, '#b4365b');
  assert.equal(r.wine[600].$value, '#8D293A');
});

test('mesclar: chave nova dentro de grupo existente entra e herda o $type do grupo', () => {
  const r = mesclarPrimitivos(primitive, { fontSize: { title: { $value: '1.25rem' } } });
  assert.equal(r.fontSize.title.$value, '1.25rem');
  assert.equal(r.fontSize.md.$value, '0.9375rem');
  assert.equal(r.fontSize.$type, 'dimension');
});

test('mesclar: redefinir degrau compartilhado derruba, nomeando o caminho', () => {
  assert.throws(
    () => mesclarPrimitivos(primitive, { wine: { 600: { $value: '#000000' } }, fontSize: { md: { $value: '1rem' } } }),
    /a extensão redefine primitivo compartilhado: wine\.600, fontSize\.md/,
  );
});

test('mesclar: trocar grupo por folha (ou folha por grupo) também é colisão', () => {
  assert.throws(() => mesclarPrimitivos(primitive, { wine: { $value: '#000' } }), /wine/);
  assert.throws(() => mesclarPrimitivos(primitive, { fontSize: { md: { x: { $value: '1rem' } } } }), /fontSize\.md/);
});

test('mesclar: metadado da base vence, e a base não é mutada', () => {
  const base = { wine: { $type: 'color', $description: 'da base', 600: { $value: '#8D293A' } } };
  const r = mesclarPrimitivos(base, { wine: { $description: 'da extensão', 650: { $value: '#000' } } });
  assert.equal(r.wine.$description, 'da base');
  assert.equal(base.wine[650], undefined);
});
