// Fatia 3a-1: o que a revisão de 10/10/2026 achou.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validar } from '../validate-sites-spec.mjs';
import { construirCss } from '../build-sites-css.mjs';
import { construirIndice } from '../build-sites-index.mjs';
import { gerarDemos } from '../build-sites-ui-demos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'dist/sites/css/ucam-site.css'), 'utf8');
const LIB = 'sites/ui/projects/site-ui/src/lib';
/** Pastas da lib que não são peça do catálogo: o núcleo e o ícone, que é fundação compartilhada. */
const SEM_CONTRATO = ['nucleo', 'icon'];

const contratos = () => readdirSync(join(ROOT, 'sites/spec/components')).map((f) => JSON.parse(readFileSync(join(ROOT, 'sites/spec/components', f), 'utf8')));
const demos = () => JSON.parse(readFileSync(join(ROOT, 'sites/spec/demos.json'), 'utf8')).demos;

test('toda pasta de peça da lib tem contrato que aponta para ela e um teste com os blocos comuns', () => {
  const pastas = readdirSync(join(ROOT, LIB), { withFileTypes: true }).filter((d) => d.isDirectory() && !SEM_CONTRATO.includes(d.name)).map((d) => d.name);
  assert.ok(pastas.length >= 5);
  const todos = contratos();
  for (const pasta of pastas) {
    const c = todos.find((x) => String(x.implementacao?.trilho_b ?? '').startsWith(`${LIB}/${pasta}/`));
    assert.ok(c, `${pasta}: há peça na lib e nenhum contrato com trilho_b apontando para ela`);
    const spec = join(ROOT, LIB, pasta, `${pasta}.spec.ts`);
    assert.ok(existsSync(spec), `${pasta}: sem ${pasta}.spec.ts`);
    assert.ok(readFileSync(spec, 'utf8').includes(`blocosComuns('${c.id}'`), `${pasta}: o teste não chama blocosComuns('${c.id}')`);
  }
});

test('a fileira é da folha: irmãos em linha se separam por gap, não pelo espaço do template', () => {
  const { css } = construirCss({ raiz: ROOT });
  const regra = /\.ucam-site-fileira \{([^}]*)\}/.exec(css)?.[1] ?? '';
  assert.match(regra, /display: flex;/);
  assert.match(regra, /flex-wrap: wrap;/);
  assert.match(regra, /gap: var\(--ucam-site-space-inline-md\);/);
});

test('as demos Angular compilam como o template do consumidor, sem preservar espaços', () => {
  // O Angular tira o espaço entre dois elementos ao compilar. Preservá-lo só
  // nas demos fazia o portão passar num modo que nenhum consumidor usa.
  assert.ok(!gerarDemos({ raiz: ROOT }).ts.includes('preserveWhitespaces'));
});

test('demo com peças irmãs em linha traz o contêiner de fileira nas duas formas', () => {
  const d = demos();
  const paineis = [
    ['button', d.button.principal], ...d.button.exemplos.map((e) => ['button', e]),
    ['tag', d.tag.principal], ['icon-chip', d['icon-chip'].principal],
    ['avatar', d.avatar.principal], ...d.avatar.exemplos.map((e) => ['avatar', e]),
  ];
  for (const [id, p] of paineis) {
    assert.ok(p.codigo.includes('ucam-site-fileira'), `${id} · ${p.titulo ?? 'principal'}: o HTML não tem a fileira`);
    assert.ok(p.angular.includes('ucam-site-fileira'), `${id} · ${p.titulo ?? 'principal'}: o Angular não tem a fileira`);
  }
});

test('toda demo de peça com trilho B tem a forma Angular em cada painel, não só no principal', () => {
  const d = demos();
  for (const c of contratos().filter((x) => x.implementacao?.trilho_b)) {
    for (const p of [d[c.id].principal, ...(d[c.id].exemplos ?? [])]) assert.ok(p.angular, `${c.id} · ${p.titulo ?? 'principal'} sem a forma Angular`);
  }
});

test('o índice entrega o seletor Angular de verdade, tirado do trilho B', () => {
  const { data } = construirIndice({ raiz: ROOT });
  const de = (id) => data.componentes.find((c) => c.id === id);
  assert.equal(de('button').seletor_angular, 'a[ucamSiteButton], button[ucamSiteButton]');
  assert.equal(de('tag').seletor_angular, '[ucamSiteTag]');
  assert.equal(de('accordion').seletor_angular, undefined);
});

/* ---- validador: o trilho B conferido nos dois sentidos ---- */
function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-vsitesui-rev-'));
  mkdirSync(join(raiz, 'spec/schema'), { recursive: true });
  mkdirSync(join(raiz, 'spec/decisions'), { recursive: true });
  cpSync(join(ROOT, 'spec/schema/component.schema.json'), join(raiz, 'spec/schema/component.schema.json'));
  cpSync(join(ROOT, 'spec/decisions/adr.json'), join(raiz, 'spec/decisions/adr.json'));
  cpSync(join(ROOT, 'spec/tokens'), join(raiz, 'spec/tokens'), { recursive: true });
  cpSync(join(ROOT, 'sites/spec'), join(raiz, 'sites/spec'), { recursive: true });
  cpSync(join(ROOT, LIB), join(raiz, LIB), { recursive: true });
  return raiz;
}
const msgs = (r) => r.erros.map((e) => `${e.arquivo}: ${e.msg}`).join('\n');

test('entrada que o arquivo declara e o trilho B não cita reprova', () => {
  const raiz = repo();
  const p = join(raiz, 'sites/spec/components/button.json');
  const c = JSON.parse(readFileSync(p, 'utf8'));
  c.implementacao.trilho_b = c.implementacao.trilho_b.replace('Entradas: variant, size, inverse.', 'Entradas: variant, size.');
  writeFileSync(p, JSON.stringify(c));
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /button: .*declara a entrada "inverse", que o trilho_b não cita/.test(e.msg)), msgs(r));
});

test('seletor que só aparece num comentário do arquivo não vale', () => {
  const raiz = repo();
  const fonte = join(raiz, LIB, 'tag/tag.ts');
  writeFileSync(fonte, readFileSync(fonte, 'utf8').replace("selector: '[ucamSiteTag]'", "selector: '[ucamSiteEtiqueta]' /* era [ucamSiteTag] */"));
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /tag: trilho_b cita o seletor \[ucamSiteTag\]/.test(e.msg)), msgs(r));
});

test('exemplo sem a forma Angular numa peça com trilho B reprova', () => {
  const raiz = repo();
  const p = join(raiz, 'sites/spec/demos.json');
  const d = JSON.parse(readFileSync(p, 'utf8'));
  delete d.demos.tag.exemplos[0].angular;
  writeFileSync(p, JSON.stringify(d));
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /tag: o exemplo ".+" não tem a forma Angular/.test(e.msg)), msgs(r));
});
