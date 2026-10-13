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

test('as 25 peças do catálogo têm forma Angular e estão em revisão', () => {
  const arquivos = readdirSync(join(ROOT, 'sites/spec/components')).filter((f) => f.endsWith('.json'));
  assert.equal(arquivos.length, 25);
  for (const f of arquivos) {
    const c = le(ROOT, f.replace(/\.json$/, ''));
    assert.ok(c.implementacao?.trilho_b, `${c.id} sem trilho_b`);
    assert.equal(c.status, 'review', `${c.id} não está em review`);
  }
  // E toda pasta de peça da lib é de um contrato: nem peça sem contrato, nem contrato sem peça.
  const pastas = readdirSync(join(ROOT, LIB), { withFileTypes: true }).filter((d) => d.isDirectory() && !['nucleo', 'icon'].includes(d.name)).map((d) => d.name).sort();
  assert.deepEqual(pastas, arquivos.map((f) => f.replace(/\.json$/, '')).sort());
});

/* ---- as saídas das peças no contrato (campo `eventos`) ---- */
test('os contratos documentam as saídas que a lib tem', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
  const nomes = (id) => (le(ROOT, id).eventos ?? []).map((e) => e.nome);
  assert.deepEqual(nomes('accordion'), ['openChange']);
  assert.deepEqual(nomes('pagination'), ['pageChange']);
  assert.deepEqual(nomes('newsletter-form'), ['submitted']);
  assert.equal(le(ROOT, 'button').eventos, undefined);
});

test('evento citado que o arquivo não emite reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'pagination');
  c.eventos = [...c.eventos, { nome: 'sizeChange', payload: 'number', descricao: 'x' }];
  grava(raiz, 'pagination', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(tem(r, /pagination: o contrato cita o evento "sizeChange", que .*pagination\.ts não emite/), msgs(r));
});

test('saída que o arquivo emite e o contrato não documenta reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'accordion');
  delete c.eventos;
  grava(raiz, 'accordion', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(tem(r, /accordion: .*accordion\.ts emite "openChange", que o contrato não documenta em eventos/), msgs(r));
});

test('evento em contrato sem peça na lib continua reprovado', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  delete c.implementacao.trilho_b;
  c.status = 'draft';
  c.eventos = [{ nome: 'clicked', payload: 'void', descricao: 'x' }];
  grava(raiz, 'tag', c);
  const d = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
  for (const p of [d.demos.tag.principal, ...(d.demos.tag.exemplos ?? [])]) delete p.angular;
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
  const r = validar({ raiz, css: CSS });
  assert.ok(tem(r, /tag declara eventos sem ter peça na lib/), msgs(r));
});
