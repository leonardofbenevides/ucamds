import { test } from 'node:test';
import assert from 'node:assert/strict';
import { familias, familiasSites, arquivosWoff2, arquivosWoff2De, fontFaceCss } from '../lib/fonts-css.mjs';

test('a lista da aplicação não mudou', () => {
  assert.deepEqual(familias.map((f) => f.nome), ['Geist Variable', 'Geist Mono Variable']);
  assert.deepEqual(arquivosWoff2, arquivosWoff2De(familias));
  assert.match(fontFaceCss('../fonts'), /font-family: 'Geist Variable'/);
  assert.doesNotMatch(fontFaceCss('../fonts'), /Work Sans/);
});

test('a lista dos sites traz Work Sans e Inter, latin e latin-ext', () => {
  assert.deepEqual(familiasSites.map((f) => f.nome), ['Work Sans Variable', 'Inter Variable']);
  assert.deepEqual(arquivosWoff2De(familiasSites), [
    'work-sans-latin-wght-normal.woff2',
    'work-sans-latin-ext-wght-normal.woff2',
    'inter-latin-wght-normal.woff2',
    'inter-latin-ext-wght-normal.woff2',
  ]);
  const css = fontFaceCss('../fonts', familiasSites);
  assert.match(css, /font-family: 'Work Sans Variable'/);
  assert.match(css, /url\('\.\.\/fonts\/inter-latin-wght-normal\.woff2'\)/);
  assert.doesNotMatch(css, /Geist/);
  assert.doesNotMatch(css, /https?:\/\//);
});
