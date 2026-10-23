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

test('a folha passa nos portões com as trinta e uma peças', () => {
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
      // A foto só entra COM o modificador que limita o texto: sem ele, uma
      // <img> esquecida no hero punha o título em cima da foto (revisão de 09/10/2026).
      assert.ok(largo.includes(`.ucam-site-${p}--com-foto .ucam-site-${p}__${parte} { display: block; }`), `${p}__${parte} não entra a 64rem sob o modificador`);
      assert.ok(!largo.includes(`\n  .ucam-site-${p}__${parte} { display: block; }`), `${p}__${parte} entra sem o modificador`);
    }
    // Palavra longa não alarga a coluna do texto para dentro da foto.
    assert.match(regrasDe(`.ucam-site-${p}__content`)[0], /grid-template-columns: minmax\(0, 1fr\);/, `a coluna de ${p} cresce com a palavra`);
    assert.match(regrasDe(`.ucam-site-${p}__title`)[0], /overflow-wrap: break-word;/, `o título de ${p} não quebra palavra longa`);
    // O título é item de grade alinhado ao início: sem teto ele toma a largura
    // da palavra mais longa e sai da trilha, mesmo com a quebra ligada.
    assert.match(regrasDe(`.ucam-site-${p}__title`)[0], /max-inline-size: 100%;/, `o título de ${p} sai da trilha`);
    // No hero o bloco é item de flex: sem piso zero ele não encolhe abaixo da
    // palavra, e a 1024px "Internacionalização" entrava 30px na foto (medido).
    assert.match(regrasDe(`.ucam-site-${p}__content`)[0], /min-inline-size: 0;/, `o bloco de ${p} não encolhe abaixo da palavra`);
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

test('a spec real tem trinta e um contratos válidos', () => {
  const r = validar({ raiz: ROOT, css: readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8') });
  assert.deepEqual(r.erros, [], r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n'));
  assert.equal(r.total, 31);
  assert.deepEqual(r.avisos, [], JSON.stringify(r.avisos));
});

test('o índice traz as trinta e uma peças', () => {
  const { data } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 31);
  for (const id of Object.keys(PECAS)) assert.ok(data.componentes.some((c) => c.id === id && c.demo?.principal?.preview), `falta ${id} com demo`);
});

test('os números da faixa alinham pelo topo, mesmo com rótulos de alturas diferentes', () => {
  // Era coluna invertida, que empacota no PÉ: com um rótulo de duas linhas, o
  // número dele subia em relação aos vizinhos (captura de 09/10/2026), e foi
  // preciso empurrar tudo para o fim. Desde a frase nos números (14/10/2026) a
  // coluna é a direta, que empacota no topo, e o valor sobe pela ordem.
  const item = regrasDe('.ucam-site-stats__item')[0];
  assert.match(item, /flex-direction: column;/);
  assert.doesNotMatch(item, /justify-content/);
  assert.match(regrasDe('.ucam-site-stats__value')[0], /order: -1;/);
});

// ---- O que a revisão de 09/10/2026 achou -----------------------------------

test('hero, hero de página e CTA são superfície inversa: o anel de foco é o claro', () => {
  // Sem isto o anel cinza caía a 2,20:1 sobre a superfície escura.
  for (const p of ['hero', 'page-hero', 'cta']) {
    const r = regrasDe(`.ucam-site-${p} :focus-visible`).join('\n');
    assert.match(r, /outline-color: var\(--ucam-site-color-border-focus-on-inverse\)/, `${p} não troca o anel`);
  }
});

test('o desfile tem um controle de pausa que funciona por teclado e por toque', () => {
  assert.ok(emite('.ucam-site-marquee__pausa'), 'falta o controle de pausa');
  assert.match(css, /\.ucam-site-marquee__pausa:checked ~ \.ucam-site-marquee__viewport \.ucam-site-marquee__track \{[^}]*animation-play-state: paused;/);
  // Parado não há o que pausar: o controle some.
  assert.match(comMovimentoReduzido, /\.ucam-site-marquee__pausa[^{]*\{ display: none; \}/);
});

test('o grupo do desfile enche a janela: com poucos logos o laço não abre buraco', () => {
  assert.match(regrasDe('.ucam-site-marquee__viewport')[0], /container-type: inline-size;/);
  assert.match(regrasDe('.ucam-site-marquee__group')[0], /min-inline-size: 100cqi;/);
  assert.match(comMovimentoReduzido, /\.ucam-site-marquee__group \{[^}]*min-inline-size: 0;/);
});

test('a demo do desfile não lê a empresa duas vezes e traz a pausa', () => {
  const { data } = construirIndice({ raiz: ROOT });
  const demo = data.componentes.find((c) => c.id === 'logo-marquee').demo.principal;
  for (const html of [demo.preview, demo.codigo]) {
    const segunda = html.split(/aria-hidden=['"]true['"]/)[1];
    assert.ok(segunda, 'a segunda cópia não leva aria-hidden');
    assert.ok(!/alt=['"][^'"]+['"]/.test(segunda), 'a segunda cópia tem alt com texto');
    assert.match(html, /ucam-site-marquee__pausa/);
  }
});

test('sem :has() o cartão ainda mostra o foco: o anel de reserva é do link esticado', () => {
  for (const c of ['card', 'course-card']) {
    const reserva = regrasDe(`.ucam-site-${c}__link:focus-visible::after`).join('\n');
    assert.match(reserva, /outline: var\(--ucam-site-focus-ring-width\) solid/, `${c} fica sem anel onde não há :has()`);
  }
  const suporte = css.match(/@supports selector\(:has\(\*\)\) \{([\s\S]*?)\n\}/);
  assert.ok(suporte, 'o anel no cartão não está atrás de @supports');
  assert.match(suporte[1], /\.ucam-site-card:has\(\.ucam-site-card__link:focus-visible\)/);
  // Fora do @supports, nenhum anel de foco depende de :has().
  assert.ok(!/:has\([^)]*:focus-visible/.test(css.replace(suporte[0], '')), 'há foco por :has() sem rede');
});

test('três números ocupam a faixa inteira: as colunas nascem dos itens', () => {
  const largo = dentroDe(64);
  assert.match(largo, /\.ucam-site-stats \{[^}]*grid-auto-flow: column;[^}]*grid-auto-columns: minmax\(0, 1fr\);/);
});

test('os passos têm uma classe de lista, e o código da demo é o do preview', () => {
  assert.match(regrasDe('.ucam-site-steps')[0], /list-style: none;/);
  const { data } = construirIndice({ raiz: ROOT });
  const demo = data.componentes.find((c) => c.id === 'step-card').demo.principal;
  for (const html of [demo.preview, demo.codigo]) assert.match(html, /<ol class=['"]ucam-site-steps['"] role=['"]list['"]/);
  assert.ok(!/<ol style=/.test(demo.preview), 'o preview ainda arruma a lista com estilo em linha');
});

test('as aspas do depoimento são da folha', () => {
  assert.match(regrasDe('.ucam-site-testimonial__quote::before')[0], /content: open-quote;/);
  assert.match(regrasDe('.ucam-site-testimonial__quote::after')[0], /content: close-quote;/);
});

test('os contratos não prometem o que a folha não mede', () => {
  const ler = (id) => readFileSync(join(ROOT, `sites/spec/components/${id}.json`), 'utf8');
  assert.ok(!ler('prose').includes('75 caracteres'), 'a prosa promete 75 caracteres a 820px');
  assert.ok(!JSON.parse(ler('prose')).acessibilidade.criterios_wcag.includes('1.4.8'));
  assert.ok(!ler('hero-pill').includes('não muda o contraste'), 'a pílula diz que a lavagem não muda o contraste');
});
