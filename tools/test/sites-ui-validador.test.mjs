// Fatia 3a-1: o validador dos sites confere o trilho B (a lib Angular).
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
// As peças que a lib entrega são as pastas dela, menos o núcleo e o ícone (fundação, sem contrato).
const COM_LIB = readdirSync(join(ROOT, LIB), { withFileTypes: true }).filter((d) => d.isDirectory() && !['nucleo', 'icon'].includes(d.name)).map((d) => d.name);

/* A spec real e o fonte da lib copiados; cada teste estraga uma coisa. */
function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-vsitesui-'));
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

test('na spec real, as peças da lib têm trilho B e estão em revisão; as outras seguem rascunho', () => {
  const r = validar({ raiz: ROOT, css: CSS });
  assert.deepEqual(r.erros, [], msgs(r));
  assert.deepEqual(r.avisos, [], JSON.stringify(r.avisos));
  for (const arq of readdirSync(join(ROOT, 'sites/spec/components'))) {
    const c = le(ROOT, arq.replace(/\.json$/, ''));
    if (COM_LIB.includes(c.id)) {
      assert.equal(c.status, 'review', `${c.id} deveria estar em review`);
      assert.match(c.implementacao.trilho_b, new RegExp(`^${LIB}/${c.id}/${c.id}\\.ts — .+\\. Entradas: .+\\.$`), c.id);
    } else {
      assert.equal(c.status, 'draft', `${c.id} não tem peça na lib e deveria ser draft`);
      assert.equal(c.implementacao.trilho_b, undefined, `${c.id} declara trilho_b sem peça`);
    }
  }
});

test('trilho B fora do formato reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'tag'); c.implementacao.trilho_b = 'a diretiva da tag'; grava(raiz, 'tag', c);
  assert.ok(roda(raiz).erros.some((e) => /tag: trilho_b fora do formato/.test(e.msg)), msgs(roda(raiz)));
});

test('trilho B que aponta para arquivo que não existe reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'tag'); c.implementacao.trilho_b = `${LIB}/tag/etiqueta.ts — [ucamSiteTag]. Entradas: tone.`; grava(raiz, 'tag', c);
  assert.ok(roda(raiz).erros.some((e) => /tag: trilho_b aponta para .*etiqueta\.ts, que não existe/.test(e.msg)), msgs(roda(raiz)));
});

test('entrada citada que o arquivo não declara reprova, com o nome', () => {
  const raiz = repo();
  const c = le(raiz, 'tag'); c.implementacao.trilho_b = `${LIB}/tag/tag.ts — [ucamSiteTag]. Entradas: tone, cor.`; grava(raiz, 'tag', c);
  const r = roda(raiz);
  assert.ok(r.erros.some((e) => /tag: trilho_b cita a entrada "cor"/.test(e.msg)), msgs(r));
  assert.ok(!r.erros.some((e) => /entrada "tone"/.test(e.msg)), 'tone existe e não devia reprovar');
});

test('seletor citado que o arquivo não declara reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'tag'); c.implementacao.trilho_b = `${LIB}/tag/tag.ts — [ucamSiteEtiqueta]. Entradas: tone.`; grava(raiz, 'tag', c);
  assert.ok(roda(raiz).erros.some((e) => /tag: trilho_b cita o seletor \[ucamSiteEtiqueta\]/.test(e.msg)), msgs(roda(raiz)));
});

test('peça com trilho B e sem demo Angular reprova', () => {
  const raiz = repo();
  const d = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
  delete d.demos.tag.principal.angular;
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
  assert.ok(roda(raiz).erros.some((e) => /tag: tem trilho_b e a demo principal não tem a forma Angular/.test(e.msg)), msgs(roda(raiz)));
});

test('peça em revisão sem trilho B reprova', () => {
  const raiz = repo();
  const c = le(raiz, 'accordion'); c.status = 'review'; grava(raiz, 'accordion', c);
  assert.ok(roda(raiz).erros.some((e) => /accordion: status "review" sem implementacao\.trilho_b/.test(e.msg)), msgs(roda(raiz)));
});

test('demo Angular sem trilho B reprova: a forma documentada não teria peça', () => {
  const raiz = repo();
  const d = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8'));
  d.demos.accordion.principal.angular = '<details ucamSiteAccordionItem></details>';
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify(d));
  assert.ok(roda(raiz).erros.some((e) => /accordion: a demo tem a forma Angular e o contrato não tem trilho_b/.test(e.msg)), msgs(roda(raiz)));
});
