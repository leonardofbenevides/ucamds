// O que a revisão da fatia 2b achou (09/10/2026). Cada teste reproduz um item.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirCss } from '../build-sites-css.mjs';
import { construir } from '../build-sites-tokens.mjs';
import { contrast } from '../lib/wcag.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = construirCss({ raiz: ROOT }).css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = construir({ raiz: ROOT });
const cor = (nome) => JSON.parse(tokens.arquivos.find(([n]) => n === 'ucam-site-tokens.json')[1]).semantic[nome]?.value;

/** Todas as regras (fora e dentro de @media) cujo seletor é exatamente `sel`. */
const regrasDe = (sel) => [...css.matchAll(/(^|\n)\s*([^{}@\n][^{}]*?)\s*\{([^{}]*)\}/g)]
  .filter((m) => m[2].split(',').map((s) => s.trim()).includes(sel))
  .map((m) => m[3]);
/** O que a folha declara dentro dos @media de um viewport. */
const dentroDe = (rem) => [...css.matchAll(new RegExp(`@media \\(min-width: ${rem}rem\\) \\{([\\s\\S]*?)\\n\\}`, 'g'))].map((m) => m[1]).join('\n');

test('o hover do campo não apaga a borda de erro', () => {
  const hovers = [...css.matchAll(/\.ucam-site-input__field:hover[^{]*\{/g)].map((m) => m[0]);
  assert.ok(hovers.length >= 1);
  for (const h of hovers) assert.ok(h.includes(':not([aria-invalid="true"])'), `o hover vence o erro: ${h}`);
});

test('rótulo, apoio e erro do campo leem sobre QUALQUER seção escura, não só na newsletter', () => {
  for (const parte of ['label', 'hint', 'erro']) {
    assert.match(css, new RegExp(`\\.ucam-site-inverso \\.ucam-site-input__${parte}[\\s,{]`), `falta .ucam-site-inverso .ucam-site-input__${parte}`);
  }
  const erro = cor('color-feedback-danger-on-inverse');
  assert.ok(erro, 'falta o token color.feedback.danger.on-inverse');
  assert.ok(contrast(erro, cor('color-surface-inverse')) >= 4.5, 'o erro sobre fundo escuro não chega a 4,5:1');
});

test('o portão mede a borda do campo, a borda de erro e o erro sobre fundo escuro', () => {
  // Se um destes pares deixar de ser medido, um token que o reprove passaria calado.
  const s = JSON.stringify(tokens.relatos) + JSON.stringify(tokens.desvios) + JSON.stringify(tokens.falhas);
  assert.ok(!/par não medido: (borda do campo|borda de erro|erro sobre seção escura)/.test(s), s);
  assert.ok(contrast(cor('color-border-strong'), cor('color-surface-canvas')) >= 3);
  assert.ok(contrast(cor('color-border-strong'), cor('color-surface-subtle')) >= 3);
  assert.ok(contrast(cor('color-feedback-danger-border'), cor('color-surface-canvas')) >= 3);
});

test('o cabeçalho: links numa linha só, navegação e ações só a partir de nav-aberta, e nunca junto do menu', () => {
  assert.ok(regrasDe('.ucam-site-header__link').some((r) => /white-space: nowrap/.test(r)), 'link do cabeçalho quebra em duas linhas');
  assert.ok(regrasDe('.ucam-site-header__nav')[0].includes('display: none'));
  assert.ok(regrasDe('.ucam-site-header__actions')[0].includes('display: none'));
  const largo = dentroDe(64);
  for (const troca of ['.ucam-site-header__nav { display: flex; }', '.ucam-site-header__actions { display: flex; }', '.ucam-site-header__menu { display: none; }']) {
    assert.ok(largo.includes(troca), `falta em 64rem: ${troca}`);
  }
  assert.ok(!dentroDe(48).includes('ucam-site-header'), 'o cabeçalho ainda troca a 48rem, onde cinco itens e uma ação estouram');
});

test('o painel do menu tem teto de altura e rola: o último link não fica inalcançável', () => {
  const painel = regrasDe('.ucam-site-header__mobile').join('\n');
  assert.match(painel, /max-block-size: calc\(100dvh - var\(--ucam-site-size-header\)\)/);
  assert.match(painel, /overflow-y: auto/);
});

test('o rodapé acomoda três ou quatro colunas de links: colunas por fluxo, não cinco trilhas fixas', () => {
  const largo = dentroDe(64);
  assert.ok(/\.ucam-site-footer__grid \{[^}]*grid-auto-flow: column/.test(largo), 'a grade do rodapé não flui em colunas');
  assert.ok(!/repeat\(3,/.test(largo), 'a grade do rodapé ainda crava três colunas');
});

test('o separador da trilha tem valor de reserva para navegador sem texto alternativo em content', () => {
  const sep = regrasDe('.ucam-site-breadcrumb__item + .ucam-site-breadcrumb__item::before').join('\n');
  assert.match(sep, /content: "\/";\s*content: "\/" \/ "";/);
});

test('alvo de toque: TODAS as regras do seletor mantêm touch-min', () => {
  for (const sel of ['.ucam-site-pagination__item', '.ucam-site-accordion__trigger', '.ucam-site-header__toggle']) {
    const alturas = regrasDe(sel).flatMap((r) => [...r.matchAll(/min-block-size: ([^;]+);/g)].map((m) => m[1]));
    assert.ok(alturas.length >= 1, `${sel} sem min-block-size`);
    for (const a of alturas) assert.equal(a, 'var(--ucam-site-size-touch-min)', `${sel} com altura ${a}`);
  }
});
