import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validar } from '../validate-sites-spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8');

/* Um repositório mínimo com a spec real dos sites copiada; cada teste
 * altera um contrato e espera a falha nomeada. */
function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-vsites-'));
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
const msgs = (r) => r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n');

test('a spec real dos sites passa', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
  assert.equal(r.total, 4);
});

test('selector sem site é falha nomeando o esperado', () => {
  const raiz = repo();
  const c = le(raiz, 'button'); c.selector = 'ucam-button'; grava(raiz, 'button', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /selector "ucam-button" deveria ser "ucam-site-button"/.test(e.msg)), msgs(r));
});

test('classe do preview que a folha não emite é falha com o nome', () => {
  const raiz = repo();
  const d = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
  d.demos.button.principal.preview = "<a class='ucam-site-btn ucam-site-btn--outline'>x</a>";
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /ucam-site-btn--outline/.test(e.msg)), msgs(r));
});

test('token primitivo citado e token da aplicação citados são falha', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.implementacao.trilho_a.variaveis.push('--ucam-site-wine-600');
  c.props[0].valores.brand.tokens = { fundo: 'color.surface.chao' };
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /primitiv.*--ucam-site-wine-600/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /color\.surface\.chao/.test(e.msg)), msgs(r));
});

test('vs de mão única e composicao citando a aplicação são falha', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.vs = c.vs.filter((v) => v.componente !== 'button');
  c.composicao = { usa: ['ucam-button'] };
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /tag não devolve o vs que button declara/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /ucam-button/.test(e.msg)), msgs(r));
});

test('contrato sem evidencia, sem demo ou com trilho_b entra no perfil', () => {
  const raiz = repo();
  const c = le(raiz, 'icon-chip');
  delete c.evidencia;
  c.implementacao.trilho_b = 'ui/x.ts';
  grava(raiz, 'icon-chip', c);
  const d = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
  delete d.demos['icon-chip'];
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /icon-chip sem evidencia/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /icon-chip sem demo/.test(e.msg)), msgs(r));
  assert.ok(r.avisos.some((a) => /trilho_b/.test(a.msg)), JSON.stringify(r.avisos));
});
