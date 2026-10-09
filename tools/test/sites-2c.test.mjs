// Fatia 2c: hero, seções, cartões e prosa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirCss } from '../build-sites-css.mjs';
import { validar } from '../validate-sites-spec.mjs';
import { construirIndice } from '../build-sites-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { css: bruta, falhas } = construirCss({ raiz: ROOT });
const css = bruta.replace(/\/\*[\s\S]*?\*\//g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A classe aparece como seletor: seguida de espaço, vírgula, chave, dois-pontos ou colchete. */
const emite = (classe) => new RegExp(esc(classe) + '(?![a-z0-9_-])').test(css);
/** Todas as regras cujo seletor inclui exatamente `sel` (em lista separada por vírgula). */
const regrasDe = (sel) => [...css.matchAll(/(^|\n)\s*([^{}@\n][^{}]*?)\s*\{([^{}]*)\}/g)]
  .filter((m) => m[2].split(',').map((s) => s.trim()).includes(sel))
  .map((m) => m[3]);
const dentroDe = (rem) => [...css.matchAll(new RegExp(`@media \\(min-width: ${rem}rem\\) \\{([\\s\\S]*?)\\n\\}`, 'g'))].map((m) => m[1]).join('\n');
const comMovimentoReduzido = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join('\n');

const PECAS = {
  hero: ['.ucam-site-hero', '.ucam-site-hero__media', '.ucam-site-hero__scrim', '.ucam-site-hero__inner', '.ucam-site-hero__content', '.ucam-site-hero__eyebrow', '.ucam-site-hero__title', '.ucam-site-hero__lede', '.ucam-site-hero__pills', '.ucam-site-hero__actions', '.ucam-site-hero--com-foto'],
  'editorial-page-hero': ['.ucam-site-page-hero', '.ucam-site-page-hero__inner', '.ucam-site-page-hero__eyebrow', '.ucam-site-page-hero__title', '.ucam-site-page-hero__lede', '.ucam-site-page-hero__pills', '.ucam-site-page-hero__actions', '.ucam-site-page-hero--prosa'],
  'hero-pill': ['.ucam-site-hero-pill'],
  'editorial-cta': ['.ucam-site-cta', '.ucam-site-cta__media', '.ucam-site-cta__scrim', '.ucam-site-cta__content', '.ucam-site-cta__eyebrow', '.ucam-site-cta__title', '.ucam-site-cta__text', '.ucam-site-cta__actions', '.ucam-site-cta--com-foto'],
  'stats-band': ['.ucam-site-stats', '.ucam-site-stats__item', '.ucam-site-stats__value', '.ucam-site-stats__label', '.ucam-site-stats--inverse'],
  'logo-marquee': ['.ucam-site-marquee', '.ucam-site-marquee__viewport', '.ucam-site-marquee__track', '.ucam-site-marquee__group', '.ucam-site-marquee__item', '.ucam-site-marquee--parado'],
  card: ['.ucam-site-card', '.ucam-site-card__media', '.ucam-site-card__body', '.ucam-site-card__title', '.ucam-site-card__text', '.ucam-site-card__meta', '.ucam-site-card__link', '.ucam-site-card--interativo'],
  'doc-card': ['.ucam-site-doc-card', '.ucam-site-doc-card__header', '.ucam-site-doc-card__label', '.ucam-site-doc-card__list', '.ucam-site-doc-card__item'],
  'step-card': ['.ucam-site-step-card', '.ucam-site-step-card__number', '.ucam-site-step-card__body', '.ucam-site-step-card__title', '.ucam-site-step-card__text', '.ucam-site-step-card__link'],
  'course-card': ['.ucam-site-course-card', '.ucam-site-course-card__media', '.ucam-site-course-card__body', '.ucam-site-course-card__tags', '.ucam-site-course-card__title', '.ucam-site-course-card__meta', '.ucam-site-course-card__link'],
  testimonial: ['.ucam-site-testimonial', '.ucam-site-testimonial__quote', '.ucam-site-testimonial__autor', '.ucam-site-testimonial__nome', '.ucam-site-testimonial__papel', '.ucam-site-testimonial--inverse'],
  prose: ['.ucam-site-prose'],
};

test('a folha passa nos portões com as vinte e cinco peças', () => {
  assert.deepEqual(falhas, []);
});

for (const [peca, classes] of Object.entries(PECAS)) {
  test(`a folha emite ${peca}: raiz e partes`, () => {
    for (const c of classes) assert.ok(emite(c), `falta ${c}`);
  });
}

test('texto nunca assenta sobre foto: foto e véu nascem escondidos e só entram na grade completa, na metade sem texto', () => {
  const largo = dentroDe(64);
  for (const p of ['hero', 'cta']) {
    for (const parte of ['media', 'scrim']) {
      assert.ok(regrasDe(`.ucam-site-${p}__${parte}`)[0].includes('display: none'), `${p}__${parte} não nasce escondido`);
      assert.ok(largo.includes(`.ucam-site-${p}__${parte} { display: block; }`), `${p}__${parte} não entra a 64rem`);
    }
    assert.match(regrasDe(`.ucam-site-${p}__media`)[0], /inset-inline: 50% 0/, `a foto de ${p} não fica na metade final`);
    assert.match(largo, new RegExp(`\\.ucam-site-${p}--com-foto \\.ucam-site-${p}__content \\{[^}]*max-inline-size: 50%`), `o texto de ${p} não fica na metade inicial`);
  }
  // O véu é da superfície inversa para transparente: token, não cor crua.
  for (const p of ['hero', 'cta']) assert.match(regrasDe(`.ucam-site-${p}__scrim`)[0], /linear-gradient\(to right, var\(--ucam-site-color-surface-inverse\)[^)]*transparent/);
});

test('o desfile de logos para sob o ponteiro e sob foco, e não anima com movimento reduzido', () => {
  const pausa = [...css.matchAll(/([^{}]*)\{[^{}]*animation-play-state: paused;[^{}]*\}/g)].map((m) => m[1]).join(' ');
  assert.match(pausa, /\.ucam-site-marquee__track:hover/);
  assert.match(pausa, /\.ucam-site-marquee__track:focus-within/);
  assert.match(comMovimentoReduzido, /\.ucam-site-marquee__track \{[^}]*animation: none/);
  // Sem movimento não há por que repetir os logos: a segunda cópia some.
  assert.match(comMovimentoReduzido, /\.ucam-site-marquee__group \+ \.ucam-site-marquee__group \{ display: none; \}/);
  assert.match(regrasDe('.ucam-site-marquee__track')[0], /animation: ucam-site-desfile var\(--ucam-site-motion-duration-desfile\) linear infinite/);
});

test('o cartão é clicável por um link só, esticado, e o foco aparece no cartão', () => {
  for (const c of ['card', 'course-card']) {
    const depois = regrasDe(`.ucam-site-${c}__link::after`).join('\n');
    assert.match(depois, /position: absolute;/);
    assert.match(depois, /inset: 0;/);
    assert.match(regrasDe(`.ucam-site-${c}`)[0], /position: relative;/, `${c} não ancora o link esticado`);
    assert.ok(emite(`.ucam-site-${c}:has(.ucam-site-${c}__link:focus-visible)`), `${c} não mostra o foco do link no cartão`);
  }
});

test('nenhum elemento nu é estilizado: todo seletor começa por uma classe dos sites', () => {
  const semKeyframes = css.replace(/@keyframes [^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const seletores = [...semKeyframes.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)].flatMap((m) => m[2].split(',').map((s) => s.trim())).filter(Boolean);
  const nus = seletores.filter((s) => !s.startsWith('.ucam-site'));
  assert.deepEqual(nus, []);
});

test('a prosa estiliza títulos, parágrafos, listas, links, citação e imagem, só dentro da raiz', () => {
  for (const el of ['h2', 'h3', 'a', 'blockquote', 'img', 'hr']) assert.ok(emite(`.ucam-site-prose ${el}`), `a prosa não estiliza ${el}`);
  assert.match(regrasDe('.ucam-site-prose')[0], /max-inline-size: var\(--ucam-site-container-prosa\)/);
});

test('a spec real tem vinte e cinco contratos válidos', () => {
  const r = validar({ raiz: ROOT, css: readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8') });
  assert.deepEqual(r.erros, [], r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n'));
  assert.equal(r.total, 25);
  assert.deepEqual(r.avisos, [], JSON.stringify(r.avisos));
});

test('o índice traz as vinte e cinco peças', () => {
  const { data } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 25);
  for (const id of Object.keys(PECAS)) assert.ok(data.componentes.some((c) => c.id === id && c.demo?.principal?.preview), `falta ${id} com demo`);
});

test('os números da faixa alinham pelo topo, mesmo com rótulos de alturas diferentes', () => {
  // A coluna é invertida (o rótulo vem antes no documento e aparece embaixo),
  // e coluna invertida empacota no PÉ: com um rótulo de duas linhas, o número
  // dele subia em relação aos vizinhos (captura de 09/10/2026).
  const item = regrasDe('.ucam-site-stats__item')[0];
  assert.match(item, /flex-direction: column-reverse;/);
  assert.match(item, /justify-content: flex-end;/);
});
