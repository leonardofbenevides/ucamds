// Fatia 3a-3: a lib fecha com as 25 peças.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validar } from '../validate-sites-spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8');
const LIB = 'sites/ui/projects/site-ui/src/lib';

function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-3a3-'));
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
const tem = (r, re) => r.erros.some((e) => re.test(e.msg));

test('peça que é só uma classe diz "Entradas: nenhuma." e passa', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.match(le(ROOT, 'hero-pill').implementacao.trilho_b, /\. Entradas: nenhuma\. Conteúdo: label, icon\.$/);
  assert.ok(!tem(r, /^hero-pill:/), msgs(r));
  assert.ok(!tem(r, /^prose:/), msgs(r));
});

test('"nenhuma" não esconde entrada: se o arquivo declara uma, o validador a cobra', () => {
  const raiz = repo();
  const fonte = join(raiz, LIB, 'hero-pill/hero-pill.ts');
  writeFileSync(fonte, readFileSync(fonte, 'utf8').replace('export class UcamSiteHeroPill {}', "export class UcamSiteHeroPill {\n  readonly tom = input('x');\n}"));
  const r = validar({ raiz, css: CSS });
  assert.ok(tem(r, /hero-pill: .*declara a entrada "tom", que o trilho_b não cita/), msgs(r));
});

test('prop do contrato continua precisando de destino mesmo sem entradas', () => {
  const raiz = repo();
  const c = le(raiz, 'hero-pill');
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace(' Conteúdo: label, icon.', ' Conteúdo: label.');
  grava(raiz, 'hero-pill', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(tem(r, /hero-pill: a prop "icon" do contrato não é Entrada, Nativo nem Conteúdo/), msgs(r));
});

export { ROOT, CSS, LIB, repo, le, grava, msgs, tem, readdirSync };
