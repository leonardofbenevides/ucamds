// Fatia 3a-2: contrato e lib com os mesmos nomes, e o que a folha ganhou.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validar } from '../validate-sites-spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8');
const LIB = 'sites/ui/projects/site-ui/src/lib';

function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-3a2-'));
  mkdirSync(join(raiz, 'spec/schema'), { recursive: true });
  mkdirSync(join(raiz, 'spec/decisions'), { recursive: true });
  cpSync(join(ROOT, 'spec/schema/component.schema.json'), join(raiz, 'spec/schema/component.schema.json'));
  cpSync(join(ROOT, 'spec/decisions/adr.json'), join(raiz, 'spec/decisions/adr.json'));
  cpSync(join(ROOT, 'spec/tokens'), join(raiz, 'spec/tokens'), { recursive: true });
  cpSync(join(ROOT, 'sites/spec'), join(raiz, 'sites/spec'), { recursive: true });
  cpSync(join(ROOT, LIB), join(raiz, LIB), { recursive: true });
  return raiz;
}
const le = (raiz, id) => JSON.parse(readFileSync(join(raiz, `sites/spec/components/${id}.json`), 'utf8'));
const grava = (raiz, id, c) => writeFileSync(join(raiz, `sites/spec/components/${id}.json`), JSON.stringify(c));
const msgs = (r) => r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n');
const roda = (raiz) => validar({ raiz, css: CSS });
const tem = (r, re) => r.erros.some((e) => re.test(e.msg));

test('a spec real passa, e os contratos da lib dizem o destino de cada prop', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
  assert.match(le(ROOT, 'button').implementacao.trilho_b, /Entradas: variant, size, inverse\. Nativos: href, disabled\.$/);
  assert.match(le(ROOT, 'icon-chip').implementacao.trilho_b, /Conteúdo: icon\.$/);
  assert.match(le(ROOT, 'avatar').implementacao.trilho_b, /Conteúdo: src\.$/);
  const nomes = le(ROOT, 'section-heading').props.map((p) => p.nome);
  for (const n of ['heading', 'eyebrow', 'lede']) assert.ok(nomes.includes(n), `section-heading sem a prop ${n}`);
});

test('prop do contrato que não é entrada, nativo nem conteúdo reprova, com o nome', () => {
  const raiz = repo();
  const c = le(raiz, 'button');
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace(' Nativos: href, disabled.', ' Nativos: href.');
  grava(raiz, 'button', c);
  const r = roda(raiz);
  assert.ok(tem(r, /button: a prop "disabled" do contrato não é Entrada, Nativo nem Conteúdo no trilho_b/), msgs(r));
});

test('entrada da lib que não é prop do contrato reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.props = c.props.filter((p) => p.nome !== 'tone');
  grava(raiz, 'tag', c);
  const r = roda(raiz);
  assert.ok(tem(r, /tag: a entrada "tone" não é prop do contrato/), msgs(r));
});

test('nome citado em Nativos ou Conteúdo que não é prop do contrato reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'button');
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace('Nativos: href, disabled.', 'Nativos: href, disabled, target.');
  grava(raiz, 'button', c);
  const r = roda(raiz);
  assert.ok(tem(r, /button: o trilho_b cita "target", que não é prop do contrato/), msgs(r));
});

test('entrada com nome de atributo nativo reprova: geral em qualquer peça, e de elemento onde o seletor o admite', () => {
  // Geral: `title` é a dica nativa em qualquer elemento.
  let raiz = repo();
  let fonte = join(raiz, LIB, 'tag/tag.ts');
  writeFileSync(fonte, readFileSync(fonte, 'utf8').replace('readonly tone = input', 'readonly title = input'));
  let c = le(raiz, 'tag');
  c.props[0].nome = 'title';
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace('Entradas: tone.', 'Entradas: title.');
  grava(raiz, 'tag', c);
  let r = roda(raiz);
  assert.ok(tem(r, /tag: a entrada "title" tem nome de atributo nativo/), msgs(r));

  // De elemento: `size` num seletor que admite <a> e <button>.
  raiz = repo();
  r = roda(raiz);
  assert.ok(!tem(r, /atributo nativo/), 'a spec real não devia ter entrada com nome nativo: ' + msgs(r));
  fonte = join(raiz, LIB, 'button/button.ts');
  writeFileSync(fonte, readFileSync(fonte, 'utf8').replace('readonly variant = input', 'readonly type = input'));
  c = le(raiz, 'button');
  c.props.find((p) => p.nome === 'variant').nome = 'type';
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace('Entradas: variant,', 'Entradas: type,');
  grava(raiz, 'button', c);
  r = roda(raiz);
  assert.ok(tem(r, /button: a entrada "type" tem nome de atributo nativo de a\[ucamSiteButton\]/), msgs(r));
});

test('o mesmo nome é livre num seletor que não admite o elemento', () => {
  // `size` é atributo de <input> e <select>; no botão dos sites (<a>, <button>) é só uma entrada.
  const r = validar({ raiz: ROOT, css: CSS });
  assert.ok(!tem(r, /button: a entrada "size"/), msgs(r));
});

test('trilho_b só com Entradas continua válido quando o contrato não tem outras props', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.match(le(ROOT, 'tag').implementacao.trilho_b, /Entradas: tone\.$/);
  assert.ok(!tem(r, /^tag:/), msgs(r));
});
