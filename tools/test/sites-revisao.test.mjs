// Os buracos que a revisão da fatia 2a achou nos portões dos sites
// (09/10/2026). Cada teste reproduz um deles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validar } from '../validate-sites-spec.mjs';
import { construirCss, conferirFolha } from '../build-sites-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8');
const temporarios = [];
test.after(() => { for (const d of temporarios) rmSync(d, { recursive: true, force: true }); });

function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-rev-'));
  temporarios.push(raiz);
  mkdirSync(join(raiz, 'spec/schema'), { recursive: true });
  mkdirSync(join(raiz, 'spec/decisions'), { recursive: true });
  cpSync(join(ROOT, 'spec/schema/component.schema.json'), join(raiz, 'spec/schema/component.schema.json'));
  cpSync(join(ROOT, 'spec/decisions/adr.json'), join(raiz, 'spec/decisions/adr.json'));
  cpSync(join(ROOT, 'spec/tokens'), join(raiz, 'spec/tokens'), { recursive: true });
  cpSync(join(ROOT, 'sites/spec'), join(raiz, 'sites/spec'), { recursive: true });
  return raiz;
}
const le = (raiz, id) => JSON.parse(readFileSync(join(raiz, `sites/spec/components/${id}.json`), 'utf8'));
const grava = (raiz, id, c) => writeFileSync(join(raiz, `sites/spec/components/${id}.json`), JSON.stringify(c));
const leDemos = (raiz) => JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
const gravaDemos = (raiz, d) => writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
const msgs = (r) => r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n');
const TOKENS = { disponiveis: new Set(['--ucam-site-color-text-body']), primitivos: new Set(), semanticos: new Set(['--ucam-site-color-text-body']), viewports: new Set(['min:40rem']) };

/* ----------------------------------------------- validador: tokens --- */

test('primitivo de cor com dígito (wine.600, magenta.700) citado no contrato é falha', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.props[0].valores.brand.tokens = { fundo: 'wine.600', texto: 'magenta.700' };
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /primitivo "wine\.600"/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /primitivo "magenta\.700"/.test(e.msg)), msgs(r));
});

test('primitivo em camelCase (fontSize.title) e semântico que é só um grupo (color.action) são falha', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.props[0].valores.brand.tokens = { tamanho: 'fontSize.title', cor: 'color.action' };
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /primitivo "fontSize\.title"/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /"color\.action"/.test(e.msg)), msgs(r));
});

test('nome de domínio, nome de arquivo e semântico real não são tomados por token errado', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
});

/* ---------------------------------------------- validador: código --- */

test('classe inexistente no codigo da demo e do contrato é falha, como no preview', () => {
  const raiz = repo();
  const d = leDemos(raiz);
  d.demos.button.principal.codigo = '<a class="ucam-site-btn ucam-site-btn--outline" href="/x">x</a>';
  gravaDemos(raiz, d);
  const c = le(raiz, 'tag');
  c.exemplos[0].codigo = '<span class="ucam-site-tag ucam-site-tag--verde">EAD</span>';
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /button.*codigo.*ucam-site-btn--outline/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /tag.*codigo.*ucam-site-tag--verde/.test(e.msg)), msgs(r));
});

test('classe e elemento da aplicação no codigo são falha', () => {
  const raiz = repo();
  const d = leDemos(raiz);
  d.demos.tag.principal.codigo = '<span class="ucam-badge">EAD</span><ucam-button>x</ucam-button>';
  gravaDemos(raiz, d);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /tag.*codigo.*ucam-badge/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /tag.*codigo.*<ucam-button>/.test(e.msg)), msgs(r));
});

test('classe inexistente em migracao.mapa[].novo é falha', () => {
  const raiz = repo();
  const c = le(raiz, 'icon-chip');
  c.migracao.mapa[0].novo = '.ucam-site-icon-chip--xl';
  grava(raiz, 'icon-chip', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /icon-chip.*migracao.*ucam-site-icon-chip--xl/.test(e.msg)), msgs(r));
});

test('variável dos sites em style e o domínio ucam-campos no href não são tomados por classe', () => {
  const raiz = repo();
  const d = leDemos(raiz);
  d.demos.tag.principal.preview = "<a href='https://www.ucam-campos.br' style='gap:var(--ucam-site-space-inline-sm)'><span class='ucam-site-tag'>EAD</span></a>";
  gravaDemos(raiz, d);
  const r = validar({ raiz, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
});

test('sem contrato nenhum, o validador falha em vez de aprovar zero', () => {
  const raiz = repo();
  rmSync(join(raiz, 'sites/spec/components'), { recursive: true, force: true });
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /nenhum contrato/.test(e.msg)), msgs(r));
});

/* ------------------------------------------------- folha: portões --- */

test('variável da APLICAÇÃO na folha dos sites derruba o build', () => {
  const r = conferirFolha('.ucam-site-x { color: var(--ucam-color-text-body); }', TOKENS);
  assert.ok(r.falhas.some((f) => /aplicação.*--ucam-color-text-body/.test(f)), r.falhas.join('\n'));
});

test('color-mix, oklch() e hex cru na folha derrubam o build', () => {
  const r = conferirFolha('.ucam-site-a { color: color-mix(in srgb, red 10%, blue); } .ucam-site-b { color: oklch(50% 0.1 20); } .ucam-site-c { color: #B4365B; }', TOKENS);
  assert.ok(r.falhas.some((f) => /color-mix/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /oklch/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /hex cru.*#B4365B/.test(f)), r.falhas.join('\n'));
});

test('max-width é reprovado, em qualquer caixa', () => {
  const r = conferirFolha('@media (MAX-WIDTH: 40rem) { .ucam-site-a { color: red } }', TOKENS);
  assert.ok(r.falhas.some((f) => /max-width/i.test(f)), r.falhas.join('\n'));
});

/* --------------------------------------------- folha: o que emite --- */

test('a folha entrega a regra base do ícone, para quem copia a demo do pacote', () => {
  const { css } = construirCss({ raiz: ROOT });
  assert.match(css, /\.ucam-site \.ic \{/);
  assert.ok(css.indexOf('.ucam-site .ic {') < css.indexOf('.ucam-site-btn {'), 'a base do ícone vem antes das peças, para o degrau por papel vencer');
});

test('hover e active não vencem o desabilitado, nem no inverso', () => {
  const { css } = construirCss({ raiz: ROOT });
  const hovers = [...css.matchAll(/^(\.ucam-site-btn[^\n{]*:(?:hover|active))[^\n{]*\{/gm)].map((m) => m[0]);
  assert.ok(hovers.length >= 12, 'esperava as regras de hover e active do botão');
  for (const h of hovers) assert.match(h, /:not\(:disabled\):not\(\[aria-disabled="true"\]\)/, h);
});
