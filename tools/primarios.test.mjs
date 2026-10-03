// node --test tools/primarios.test.mjs
//
// A conta da ADR-023 ("uma vista, um primário") no que a pessoa VÊ de uma vez:
// ramos de @if/@else e @case são alternativas, e o diálogo é uma vista
// própria. O núcleo do @ucam/ds-mcp conta todos os primários do texto, e
// avisava em telas que nunca mostram dois ao mesmo tempo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { primariosSimultaneos } from './lib/primarios.mjs';

const P = '<ucam-button variant="primary">Ok</ucam-button>';

test('dois primários em sequência contam dois', () => {
  assert.equal(primariosSimultaneos(`<div>${P}${P}</div>`), 2);
});

test('ramos de @if/@else são alternativas: vale o maior', () => {
  const codigo = `
    @if (a()) {
      ${P}
    } @else if (b()) {
      ${P}
    } @else {
      <p>nada</p>
    }
  `;
  assert.equal(primariosSimultaneos(codigo), 1);
});

test('casos de @switch são alternativas', () => {
  const codigo = `
    @switch (estado()) {
      @case ('a') { ${P} }
      @case ('b') { ${P} }
      @default { ${P} }
    }
  `;
  assert.equal(primariosSimultaneos(codigo), 1);
});

test('@for e @empty são alternativas', () => {
  const codigo = `
    @for (x of xs(); track x) {
      <p>{{ x }}</p>
    } @empty {
      ${P}
    }
    ${P}
  `;
  assert.equal(primariosSimultaneos(codigo), 2);
});

test('ramos somam com o que está fora deles', () => {
  const codigo = `
    ${P}
    @if (a()) { ${P} } @else { <p>x</p> }
  `;
  assert.equal(primariosSimultaneos(codigo), 2);
});

test('o diálogo é uma vista própria: um primário na página e um no diálogo não somam', () => {
  const codigo = `
    ${P}
    <ucam-dialog title="Confirmar" [open]="aberto()">
      <p>Tem certeza?</p>
      <div ucamDialogAcoes>${P}</div>
    </ucam-dialog>
  `;
  assert.equal(primariosSimultaneos(codigo), 1);
});

test('dois primários dentro do mesmo diálogo contam dois', () => {
  const codigo = `
    <ucam-dialog title="x">
      ${P}
      ${P}
    </ucam-dialog>
  `;
  assert.equal(primariosSimultaneos(codigo), 2);
});

test('a classe do Trilho A conta como primário', () => {
  const codigo = `
    <button class="ucam-btn ucam-btn--primary">A</button>
    @if (b()) { <button class="ucam-btn ucam-btn--primary">B</button> }
  `;
  assert.equal(primariosSimultaneos(codigo), 2);
});

test('chaves em interpolação, atributo e comentário não quebram a leitura dos blocos', () => {
  const codigo = `
    <!-- @if (falso) { -->
    <p>{{ n === 1 ? 'uma' : 'várias' }} {{ '{' }}</p>
    <ucam-select [options]="[{ value: 1, label: 'a' }]" label="x" />
    @if (a()) { ${P} } @else { ${P} }
  `;
  assert.equal(primariosSimultaneos(codigo), 1);
});

test('template sem primário dá zero', () => {
  assert.equal(primariosSimultaneos('<p>nada</p>'), 0);
});
