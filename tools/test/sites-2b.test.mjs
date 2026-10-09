// Fatia 2b: as nove peças de peça e moldura.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirCss } from '../build-sites-css.mjs';
import { validar } from '../validate-sites-spec.mjs';
import { construirIndice } from '../build-sites-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { css, falhas } = construirCss({ raiz: ROOT });
const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** O que a folha declara dentro dos @media de um viewport. */
const dentroDe = (rem) => [...semComentario.matchAll(new RegExp(`@media \\(min-width: ${rem}rem\\) \\{([\\s\\S]*?)\\n\\}`, 'g'))].map((m) => m[1]).join('\n');

const PECAS = {
  avatar: ['.ucam-site-avatar {', '.ucam-site-avatar--sm', '.ucam-site-avatar--lg', '.ucam-site-avatar--logo'],
  accordion: ['.ucam-site-accordion {', '.ucam-site-accordion__item', '.ucam-site-accordion__trigger', '.ucam-site-accordion__icon', '.ucam-site-accordion__panel'],
  pagination: ['.ucam-site-pagination {', '.ucam-site-pagination__item', '.ucam-site-pagination__item--seta', '.ucam-site-pagination__reticencias'],
  input: ['.ucam-site-input {', '.ucam-site-input__label', '.ucam-site-input__field', '.ucam-site-input__icon', '.ucam-site-input__hint', '.ucam-site-input__erro'],
  'newsletter-form': ['.ucam-site-newsletter {', '.ucam-site-newsletter__titulo', '.ucam-site-newsletter__campos', '.ucam-site-newsletter__nota', '.ucam-site-newsletter--inverse'],
  breadcrumb: ['.ucam-site-breadcrumb {', '.ucam-site-breadcrumb__list', '.ucam-site-breadcrumb__item', '.ucam-site-breadcrumb--inverse'],
  'page-shell': ['.ucam-site-page {', '.ucam-site-page__main', '.ucam-site-skip', '.ucam-site-container {', '.ucam-site-container--faixa', '.ucam-site-container--prosa', '.ucam-site-secao {', '.ucam-site-secao--sutil'],
  'site-header': ['.ucam-site-header {', '.ucam-site-header__bar', '.ucam-site-header__brand', '.ucam-site-header__logo', '.ucam-site-header__nav', '.ucam-site-header__link', '.ucam-site-header__actions', '.ucam-site-header__menu', '.ucam-site-header__toggle', '.ucam-site-header__mobile'],
  'site-footer': ['.ucam-site-footer {', '.ucam-site-footer__inner', '.ucam-site-footer__grid', '.ucam-site-footer__brand', '.ucam-site-footer__logo', '.ucam-site-footer__col', '.ucam-site-footer__col-title', '.ucam-site-footer__link', '.ucam-site-footer__contact', '.ucam-site-footer__bottom', '.ucam-site-footer__legal', '.ucam-site-footer__social'],
};

test('a folha passa nos portões com as treze peças', () => {
  assert.deepEqual(falhas, []);
});

for (const [peca, classes] of Object.entries(PECAS)) {
  test(`a folha emite ${peca}: raiz e partes`, () => {
    for (const c of classes) assert.ok(semComentario.includes(c), `falta ${c}`);
  });
}

test('acordeão e menu são <details>: o marcador nativo do summary some, e nenhum summary é estilizado sem escopo', () => {
  for (const gatilho of ['.ucam-site-accordion__trigger', '.ucam-site-header__toggle']) {
    assert.ok(semComentario.includes(`${gatilho}::-webkit-details-marker`), `falta esconder o marcador de ${gatilho}`);
  }
  assert.doesNotMatch(semComentario, /(^|[\s,}])summary\s*[{,:]/m, 'summary estilizado sem classe');
  assert.match(semComentario, /\.ucam-site-accordion__item\[open\]/, 'o acordeão não desenha o estado aberto');
});

test('o cabeçalho troca de navegação no viewport nav-aberta, e nunca mostra as duas', () => {
  // Mobile-first: a navegação em linha nasce escondida e o menu nasce visível.
  assert.match(semComentario, /\.ucam-site-header__nav \{[^}]*display: none;/);
  const largo = dentroDe(64);
  assert.ok(largo.includes('.ucam-site-header__nav { display: flex; }'), 'a navegação em linha não aparece a 64rem');
  assert.ok(largo.includes('.ucam-site-header__menu { display: none; }'), 'o menu recolhido não some a 64rem');
});

test('alvo de toque: paginação, gatilho do acordeão e botão do menu medem pelo menos touch-min', () => {
  for (const sel of ['.ucam-site-pagination__item', '.ucam-site-accordion__trigger', '.ucam-site-header__toggle']) {
    const regra = semComentario.match(new RegExp(`\\${sel} \\{([^}]*)\\}`));
    assert.ok(regra, `regra de ${sel} não achada`);
    assert.match(regra[1], /min-block-size: var\(--ucam-site-size-(touch-min|control-md|header)\)/, `${sel} sem altura de toque`);
  }
});

test('o campo se limita pela borda forte (3:1) e o erro tem regra por aria-invalid', () => {
  const campo = semComentario.match(/\.ucam-site-input__field \{([^}]*)\}/);
  assert.ok(campo);
  assert.match(campo[1], /border: 1px solid var\(--ucam-site-color-border-strong\)/);
  assert.match(semComentario, /\.ucam-site-input__field\[aria-invalid="true"\]/);
});

test('a spec real tem treze contratos válidos', () => {
  const r = validar({ raiz: ROOT, css: readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8') });
  assert.deepEqual(r.erros, [], r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n'));
  assert.equal(r.total, 13);
  assert.deepEqual(r.avisos.filter((a) => !/ainda sem contrato/.test(a.msg)), [], JSON.stringify(r.avisos));
});

test('o índice traz as treze peças e as decisões que cada contrato cita', () => {
  const { data } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 13);
  const button = data.componentes.find((c) => c.id === 'button');
  assert.ok(button.decisoes.includes('ADR-068'), 'o button cita a ADR-068');
  assert.ok(!button.decisoes.includes('ADR-056'), 'ADR da aplicação não entra');
  const header = data.componentes.find((c) => c.id === 'site-header');
  assert.ok(Array.isArray(header.decisoes));
  for (const c of data.componentes) for (const id of c.decisoes) assert.match(id, /^ADR-\d{3}$/);
});
