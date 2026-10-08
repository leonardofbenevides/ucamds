# UCAMDS Sites — Subprojeto 1: fundação compartilhada

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Os tokens dos sites nascem de `sites/spec/`, lendo o primitivo compartilhado do UCAMDS, passam pelos mesmos portões, e saem em `dist/sites/tokens/` — sem mudar um byte do que o UCAMDS já gera.

**Architecture:** A matemática de token que vive solta em `tools/build-tokens.mjs` (resolver, achatar, expandir composto) vai para `tools/lib/tokens.mjs`, e o `build-tokens.mjs` passa a importá-la sem mudar de saída. Um script novo, `tools/build-sites-tokens.mjs`, usa a mesma lib para ler primitivo compartilhado + extensão (com portão de colisão), a semântica dos sites e as camadas de submarca (`marca.*.json`), conferir contraste e marca × destrutivo, e escrever CSS, SCSS e JSON. O portão de marca × destrutivo vira função exportada para os dois chamarem. As fontes dos sites (Work Sans e Inter) saem pelo mesmo `fonts-css.mjs` parametrizado.

**Tech Stack:** Node 24 (ESM, `node:test`), pnpm 11, DTCG JSON, `@fontsource-variable/work-sans` e `@fontsource-variable/inter`.

**Spec:** `docs/superpowers/specs/2026-10-08-ds-dos-sites-design.md`

**Desvios da spec, decididos ao planejar (cada um medido):**

1. A spec dizia "`build-tokens` passa a aceitar `--spec`". O `build-tokens.mjs` tem 510 linhas e uma lista de pares de contraste que só faz sentido para aplicação. Em vez de uma flag que atravessa tudo isso, a matemática vai para uma lib e os sites ganham script próprio que a importa. É o mesmo objetivo (uma implementação) com menos risco para o byte a byte.
2. A spec dizia que degrau do CENPRE sem equivalente a menos de 2 pontos de L entraria na extensão. Medido: quatro degraus ficam entre 2,6 e 6,2 de L do vizinho. O mapa do adaptador é **por papel** (charcoal-500 → `color.text.primary`), e quem decide é o portão de contraste, não a distância de L. Nenhum neutro entra na extensão.
3. A spec dizia que o CENPRE usaria o magenta.700 (`#b4365b`) como ação. Medido com o portão de marca × destrutivo: magenta.700 contra red.600 dá d=0,010 sob tritanopia — a mesma cor. A única combinação **monotônica** (default < hover < active nos dois) que passa os três estados é ação em magenta.800/900/1000 contra red.600/700/800 (d=0,101/0,119/0,115; o par do próprio UCAMDS dá 0,104). O magenta.700 continua sendo a **superfície** de marca (hero, faixa) e o link, que não entram no par decisivo. Fica na ADR-068.
4. `validate-spec.mjs` e `build-index.mjs` não são tocados: sem contratos de componente em `sites/`, não há o que validar nem indexar. Vão para o subprojeto 2.
5. O adaptador do CENPRE não cabe no `adapter.schema.json` (que descreve regras CSS por seletor). Ganha forma própria, um mapa de nome SCSS → token semântico, validada pelo script.

## Global Constraints

- Nada do `pnpm run build` atual muda de resultado: `dist/tokens/`, `dist/css/` e `dist/fonts/` byte a byte iguais antes e depois (exceto a linha `$generated` do JSON, que é data).
- Camada 1 compartilhada: `spec/tokens/primitive.json` não muda. A extensão `sites/spec/tokens/primitive.json` **não pode redefinir** chave que exista lá; colisão é falha de build com o caminho nomeado.
- Camada 2 dos sites só referencia primitivos por `{grupo.degrau}`; cor com hex cru na semântica é falha.
- Camada 3 (`sites/spec/tokens/marca.<id>.json`) só sobrescreve semânticos; token que não existe na semântica é falha.
- Pisos: 4,5:1 texto, 3:1 objeto gráfico (WCAG 1.4.3 e 1.4.11); marca × destrutivo d ≥ 0,10 nos pares decisivos (ADR-026), medido na base e em cada submarca.
- Prefixos: CSS `--ucam-site-*`, SCSS `$ucam-site-*`. Nunca `--ucam-*` sem `site`.
- Sem tema escuro nos sites. Sem subpaleta por app (ADR-037).
- Fontes auto-hospedadas; nenhuma URL de CDN.
- Portão de crases (`tools/check-crases.mjs`) continua passando: nada de crase nua em template literal de componente Angular (não há Angular neste subprojeto, mas o portão roda no `validate`).
- Trabalho na worktree `../DSUCAM-sites`, branch `sites-fundacao`, a partir de `main`.
- Commits em português, sem emoji, terminados com `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Extensão que redeclara um degrau compartilhado (`wine.600`) deve derrubar o build nomeando `wine.600` — nunca sobrescrever em silêncio. (Teste em Task 2.)
2. Submarca que cria um token novo em vez de sobrescrever deve falhar — senão o CENPRE acumula semântica própria sem ninguém ver. (Teste em Task 5.)
3. Submarca cuja ação primária encoste no vermelho (magenta.700 como `action.primary.default`) deve ser reprovada pelo portão de marca × destrutivo. (Teste em Task 4.)
4. Cor com hex cru dentro de `sites/spec/tokens/semantic.json` deve falhar, mesmo que o contraste passe. (Teste em Task 5.)
5. Entrada do adaptador apontando para semântico inexistente deve falhar; nome `$` do `_tokens.scss` do CENPRE ausente do mapa deve falhar quando o repositório está no disco e avisar quando não está. (Teste em Task 7.)

---

### Task 0: Worktree e linha de base

**Files:**
- Nenhum arquivo de código. Cria a worktree e guarda a saída atual para o byte a byte.

- [ ] **Step 1: Criar a worktree a partir da main**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM
git worktree add ../DSUCAM-sites -b sites-fundacao main
cd ../DSUCAM-sites
pnpm install --frozen-lockfile
```

Expected: `pnpm install` termina sem erro; `git status` limpo em `sites-fundacao`.

- [ ] **Step 2: Gerar a linha de base**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM-sites
pnpm run tokens && pnpm run marca && pnpm run fonts && pnpm run css
mkdir -p "$SCRATCH/baseline" && cp -r dist/tokens dist/css dist/fonts "$SCRATCH/baseline/"
```

`$SCRATCH` é o diretório de rascunho da sessão (`C:\Users\Leonardo\AppData\Local\Temp\claude\...\scratchpad`). Expected: quatro comandos com `✓`; `baseline/tokens`, `baseline/css` e `baseline/fonts` existem.

- [ ] **Step 3: Guardar o comparador**

Crie `$SCRATCH/compara.sh`:

```bash
#!/bin/sh
# Compara dist/ com a linha de base, ignorando a data do JSON de tokens.
set -e
cd /c/Users/Leonardo/Documents/DSUCAM-sites
for d in tokens css fonts; do
  diff -r -I '"\$generated"' "$SCRATCH/baseline/$d" "dist/$d" && echo "✓ dist/$d igual"
done
```

Run: `sh $SCRATCH/compara.sh`
Expected: três linhas `✓ ... igual` (ainda sem mudança alguma).

---

### Task 1: Extrair a matemática de token para `tools/lib/tokens.mjs`

**Files:**
- Create: `tools/lib/tokens.mjs`
- Create: `tools/test/tokens.test.mjs`
- Modify: `tools/build-tokens.mjs:36-83` (lookup, resolve, flatten, expandComposite) e `:243-256` (cssVar, scssLine)
- Modify: `package.json` (script `test:tools`)

**Interfaces:**
- Produces:
  - `lookup(root, path: string[]) → any`
  - `criarResolvedor(primitive) → (value) => value` — lança `Error('referência quebrada: {x.y}')`
  - `flatten(node, resolve, trail?, out?) → Token[]` com `Token = { path, name, ref, value, composite, description, group }`
  - `expandComposite(token, resolve) → { name, value }[]`
  - `aplicarCamada(baseFlat, camadaFlat) → Token[]` — a camada substitui por `name`
  - `cssVar(P, token, resolve) → string` e `scssLine(P, token, resolve) → string`

- [ ] **Step 1: Adicionar o runner de testes ao package.json**

Em `package.json`, dentro de `"scripts"`, depois de `"publicar"`:

```json
    "test:tools": "node --test tools/test/*.test.mjs"
```

- [ ] **Step 2: Escrever o teste que falha**

`tools/test/tokens.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookup, criarResolvedor, flatten, expandComposite, aplicarCamada, cssVar, scssLine } from '../lib/tokens.mjs';

const primitive = {
  wine: { $type: 'color', 600: { $value: '#8D293A' }, 700: { $value: '#6C1E2B' } },
  fontSize: { $type: 'dimension', md: { $value: '0.9375rem' } },
  fontWeight: { regular: { $value: 400 } },
};

test('lookup anda pelo caminho e devolve undefined fora dele', () => {
  assert.equal(lookup(primitive, ['wine', '600']).$value, '#8D293A');
  assert.equal(lookup(primitive, ['wine', '999']), undefined);
});

test('resolve troca {grupo.degrau} pelo valor e lança em referência quebrada', () => {
  const resolve = criarResolvedor(primitive);
  assert.equal(resolve('{wine.600}'), '#8D293A');
  assert.equal(resolve('#FFFFFF'), '#FFFFFF');
  assert.throws(() => resolve('{wine.999}'), /referência quebrada: \{wine\.999\}/);
});

test('flatten achata a árvore, guarda o ref e resolve o valor', () => {
  const resolve = criarResolvedor(primitive);
  const semantic = { color: { $type: 'color', action: { primary: { default: { $value: '{wine.600}', $description: 'ação' } } } } };
  const [t] = flatten(semantic, resolve);
  assert.deepEqual(t, {
    path: ['color', 'action', 'primary', 'default'],
    name: 'color-action-primary-default',
    ref: '{wine.600}',
    value: '#8D293A',
    composite: false,
    description: 'ação',
    group: 'color',
  });
});

test('composto vira várias propriedades com nome em kebab', () => {
  const resolve = criarResolvedor(primitive);
  const [t] = flatten({ typography: { body: { $type: 'typography', $value: { fontSize: '{fontSize.md}', fontWeight: '{fontWeight.regular}', lineHeight: '1.5' } } } }, resolve);
  assert.equal(t.composite, true);
  assert.deepEqual(expandComposite(t, resolve), [
    { name: 'typography-body-font-size', value: '0.9375rem' },
    { name: 'typography-body-font-weight', value: 400 },
    { name: 'typography-body-line-height', value: '1.5' },
  ]);
});

test('aplicarCamada substitui por nome e mantém o resto', () => {
  const base = [{ name: 'a', value: 1 }, { name: 'b', value: 2 }];
  const camada = [{ name: 'b', value: 20 }];
  assert.deepEqual(aplicarCamada(base, camada), [{ name: 'a', value: 1 }, { name: 'b', value: 20 }]);
});

test('cssVar e scssLine escrevem com o prefixo pedido', () => {
  const resolve = criarResolvedor(primitive);
  const [t] = flatten({ color: { x: { $value: '{wine.700}' } } }, resolve);
  assert.equal(cssVar('ucam-site', t, resolve), '  --ucam-site-color-x: #6C1E2B;');
  assert.equal(scssLine('ucam-site', t, resolve), '$ucam-site-color-x: #6C1E2B;');
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: FAIL — `Cannot find module '.../tools/lib/tokens.mjs'`.

- [ ] **Step 4: Escrever a lib**

`tools/lib/tokens.mjs`:

```js
// A matemática de token DTCG, em um lugar só.
//
// Vivia dentro de build-tokens.mjs. Saiu de lá em 08/10/2026 porque os sites
// (sites/spec/) precisam da mesma resolução, do mesmo achatamento e da mesma
// expansão de composto — e duas implementações do mesmo cálculo é a classe de
// bug que tools/lib/wcag.mjs já existe para evitar.

/** Anda por `path` dentro de `root`; undefined se o caminho não existe. */
export function lookup(root, path) {
  let cur = root;
  for (const seg of path) cur = cur?.[seg];
  return cur;
}

/** Fecha sobre um primitivo: devolve a função que troca `{grupo.degrau}` pelo valor. */
export function criarResolvedor(primitive) {
  return function resolve(value) {
    if (typeof value !== 'string' || !value.startsWith('{')) return value;
    const node = lookup(primitive, value.replace(/[{}]/g, '').split('.'));
    if (!node || !('$value' in node)) throw new Error(`referência quebrada: ${value}`);
    return node.$value;
  };
}

/** Achata uma árvore DTCG em [{ path, name, ref, value, composite, description, group }]. */
export function flatten(node, resolve, trail = [], out = []) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$') || key.startsWith('_')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      const raw = val.$value;
      out.push({
        path: [...trail, key],
        name: [...trail, key].join('-'),
        ref: typeof raw === 'string' && raw.startsWith('{') ? raw : null,
        value: typeof raw === 'object' ? raw : resolve(raw),
        composite: typeof raw === 'object',
        description: val.$description ?? '',
        group: trail[0] ?? key,
      });
    } else if (val && typeof val === 'object') {
      flatten(val, resolve, [...trail, key], out);
    }
  }
  return out;
}

/** Token composto (tipografia) vira várias custom properties. */
export function expandComposite(t, resolve) {
  return Object.entries(t.value).map(([prop, v]) => ({
    name: `${t.name}-${prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`,
    value: typeof v === 'string' && v.startsWith('{') ? resolve(v) : v,
  }));
}

/** A camada de cima substitui, por nome, o que a de baixo declarou. */
export function aplicarCamada(baseFlat, camadaFlat) {
  const nomes = new Set(camadaFlat.map((t) => t.name));
  return [...baseFlat.filter((t) => !nomes.has(t.name)), ...camadaFlat];
}

export function cssVar(P, t, resolve) {
  if (t.composite) return expandComposite(t, resolve).map((e) => `  --${P}-${e.name}: ${e.value};`).join('\n');
  return `  --${P}-${t.name}: ${t.value};`;
}

export function scssLine(P, t, resolve) {
  if (t.composite) return expandComposite(t, resolve).map((e) => `$${P}-${e.name}: ${e.value};`).join('\n');
  return `$${P}-${t.name}: ${t.value};`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm run test:tools`
Expected: 6 testes, `# pass 6`.

- [ ] **Step 6: Fazer o build-tokens importar a lib**

Em `tools/build-tokens.mjs`:

Substitua o bloco de `/* ----- resolução --- */` até o fim de `expandComposite` (as funções `lookup`, `resolve`, `flatten`, as três constantes `primFlat`/`semFlat`/`darkFlat` e `expandComposite`) por:

```js
/* ----------------------------------------------------------- resolução --- */
// A matemática vive em tools/lib/tokens.mjs desde 08/10/2026 — os sites usam a
// mesma função, pelo mesmo motivo que o contraste vive em wcag.mjs.

import { criarResolvedor, flatten, expandComposite as expandir, cssVar as cssVarDe, scssLine as scssLineDe } from './lib/tokens.mjs';

const resolve = criarResolvedor(primitive);

const primFlat = flatten(primitive, resolve);
const semFlat = flatten(semantic, resolve);
const darkFlat = flatten(dark, resolve);

const expandComposite = (t) => expandir(t, resolve);
```

E substitua as definições de `cssVar` e `scssLine` (no bloco `/* ----- saídas --- */`) por:

```js
const cssVar = (t) => cssVarDe(P, t, resolve);
```

```js
const scssLine = (t) => scssLineDe(P, t, resolve);
```

Confira que nenhuma outra linha do arquivo chama `expandComposite` com dois argumentos (há uma chamada em `cssVar` e uma em `scssLine`, ambas agora dentro da lib).

- [ ] **Step 7: Provar o byte a byte**

Run: `pnpm run tokens && pnpm run marca && pnpm run css && sh $SCRATCH/compara.sh`
Expected: `✓ contraste verificado nos dois temas`, `✓ marca e destrutivo separáveis...`, e três `✓ dist/... igual`.

- [ ] **Step 8: Commit**

```bash
git add tools/lib/tokens.mjs tools/test/tokens.test.mjs tools/build-tokens.mjs package.json
git commit -m "A matemática de token sai do build-tokens para tools/lib/tokens.mjs, com testes

Resolver, achatar e expandir composto passam a existir uma vez só, para os
sites lerem o mesmo primitivo pelo mesmo caminho. A saída do build-tokens
não muda um byte: conferido contra dist/tokens, dist/css e dist/fonts.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Mesclar primitivos com portão de colisão

**Files:**
- Modify: `tools/lib/tokens.mjs` (nova função)
- Modify: `tools/test/tokens.test.mjs`

**Interfaces:**
- Produces: `mesclarPrimitivos(base, extensao) → objeto mesclado`; lança `Error('a extensão redefine primitivo compartilhado: wine.600, ...')`. Metadados (`$…`, `_meta`) da base vencem; grupo novo entra inteiro; chave nova dentro de grupo existente entra.

- [ ] **Step 1: Escrever os testes que falham**

Acrescente a `tools/test/tokens.test.mjs`:

```js
import { mesclarPrimitivos } from '../lib/tokens.mjs';

test('mesclar: grupo novo entra inteiro, com o seu $type', () => {
  const r = mesclarPrimitivos(primitive, { magenta: { $type: 'color', 700: { $value: '#b4365b' } } });
  assert.equal(r.magenta.$type, 'color');
  assert.equal(r.magenta[700].$value, '#b4365b');
  assert.equal(r.wine[600].$value, '#8D293A');
});

test('mesclar: chave nova dentro de grupo existente entra e herda o $type do grupo', () => {
  const r = mesclarPrimitivos(primitive, { fontSize: { title: { $value: '1.25rem' } } });
  assert.equal(r.fontSize.title.$value, '1.25rem');
  assert.equal(r.fontSize.md.$value, '0.9375rem');
  assert.equal(r.fontSize.$type, 'dimension');
});

test('mesclar: redefinir degrau compartilhado derruba, nomeando o caminho', () => {
  assert.throws(
    () => mesclarPrimitivos(primitive, { wine: { 600: { $value: '#000000' } }, fontSize: { md: { $value: '1rem' } } }),
    /a extensão redefine primitivo compartilhado: wine\.600, fontSize\.md/,
  );
});

test('mesclar: trocar grupo por folha (ou folha por grupo) também é colisão', () => {
  assert.throws(() => mesclarPrimitivos(primitive, { wine: { $value: '#000' } }), /wine/);
  assert.throws(() => mesclarPrimitivos(primitive, { fontSize: { md: { x: { $value: '1rem' } } } }), /fontSize\.md/);
});

test('mesclar: metadado da base vence, e a base não é mutada', () => {
  const base = { wine: { $type: 'color', $description: 'da base', 600: { $value: '#8D293A' } } };
  const r = mesclarPrimitivos(base, { wine: { $description: 'da extensão', 650: { $value: '#000' } } });
  assert.equal(r.wine.$description, 'da base');
  assert.equal(base.wine[650], undefined);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: os cinco testes novos falham com `mesclarPrimitivos is not a function` (ou export ausente).

- [ ] **Step 3: Implementar**

Acrescente a `tools/lib/tokens.mjs`:

```js
/**
 * Camada 1 compartilhada + extensão. A extensão só ACRESCENTA: grupo novo, ou
 * degrau novo dentro de grupo que existe. Redefinir o que a base declara é
 * falha nomeada — se wine.600 mudar, muda para os dois sistemas, e isso é
 * decisão de marca, não edição de extensão.
 */
export function mesclarPrimitivos(base, extensao) {
  const colisoes = [];
  const ehFolha = (v) => v && typeof v === 'object' && '$value' in v;

  function mescla(a, b, trail) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (k.startsWith('$') || k.startsWith('_')) {
        if (!(k in out)) out[k] = v;
        continue;
      }
      const caminho = [...trail, k].join('.');
      if (!(k in a)) {
        out[k] = v;
        continue;
      }
      if (ehFolha(a[k]) || ehFolha(v)) {
        colisoes.push(caminho);
        continue;
      }
      out[k] = mescla(a[k], v, [...trail, k]);
    }
    return out;
  }

  const resultado = mescla(base, extensao, []);
  if (colisoes.length) {
    throw new Error(`a extensão redefine primitivo compartilhado: ${colisoes.join(', ')}`);
  }
  return resultado;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm run test:tools`
Expected: `# pass 11`.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/tokens.mjs tools/test/tokens.test.mjs
git commit -m "Primitivo compartilhado mais extensão: a extensão só acrescenta, e colisão é falha nomeada

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: As três camadas de token dos sites

**Files:**
- Create: `sites/spec/tokens/primitive.json` (extensão)
- Create: `sites/spec/tokens/semantic.json`
- Create: `sites/spec/tokens/marca.cenpre.json`
- Create: `sites/README.md`

**Interfaces:**
- Produces: os três arquivos lidos pela Task 5. Nomes de token semântico (achatados) que as Tasks 4, 5 e 7 citam: `color-surface-{canvas,default,subtle,sunken,inverse,brand,brand-soft}`, `color-text-{primary,body,secondary,muted,on-inverse,on-inverse-muted,on-brand,on-action,link,link-hover}`, `color-action-primary-{default,hover,active,subtle}`, `color-action-secondary-{default,hover,active,border}`, `color-action-danger-{default,hover,active,subtle}`, `color-action-disabled-{background,text}`, `color-border-{subtle,default,strong,focus,on-inverse,focus-on-inverse}`, `color-feedback-{success,warning,danger,info}-{background,foreground,border}`.

Sem teste próprio: quem testa estes arquivos é o script da Task 5, que os lê de verdade.

- [ ] **Step 1: A extensão primitiva**

`sites/spec/tokens/primitive.json`:

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "Camada 1 dos sites — EXTENSÃO do primitivo compartilhado (spec/tokens/primitive.json). Só acrescenta: grupo novo ou degrau novo. Redefinir degrau que exista lá é falha de build (tools/lib/tokens.mjs, mesclarPrimitivos). Tudo que a aplicação e o site têm em comum — marca, neutros, feedback, raio, sombra, movimento — mora no compartilhado e não se repete aqui.",
  "_meta": {
    "origem": "Valores extraídos de projects/cenpre-ui-kit/styles/_tokens.scss do repositório cenpre-ui-angular-scss (Figma \"UCAM SITE\", página CENPRE - 2.0), medidos em 08/10/2026.",
    "regra": "Hex só na rampa magenta, que é submarca (ADR-068). Tamanho de display em clamp() porque a escala de um site responde à largura da janela sem media query por degrau."
  },
  "magenta": {
    "$type": "color",
    "$description": "Submarca do CENPRE (ADR-068). Mesma família do bordô — matiz 7° a 9° em OKLCH contra 15° do wine — dezesseis pontos de L mais clara no 700 e mais saturada. O 900 (L 36) é, na prática, o wine.700 (L 36). Hex mantidos do Figma; o portão mede.",
    "100": { "$value": "#FFF0F5" },
    "200": { "$value": "#FFDDE8" },
    "300": { "$value": "#FCB9CE" },
    "400": { "$value": "#F494B2" },
    "500": { "$value": "#EA7095" },
    "600": { "$value": "#D64E76", "$description": "Branco em cima dá 4,03:1 — não serve de ação. Fica para preenchimento decorativo." },
    "700": { "$value": "#B4365B", "$description": "A cor de marca do CENPRE. Superfície de marca e link (5,80:1 sobre branco). NÃO é a ação primária: contra red.600 dá d=0,010 sob tritanopia — a mesma cor que o destrutivo. Ver ADR-068." },
    "800": { "$value": "#922243", "$description": "Ação primária do CENPRE. Branco em cima 8,29:1; contra red.600, d=0,101 no pior caso — o mesmo que o par wine.600 × red.600 do UCAMDS." },
    "900": { "$value": "#70132F", "$description": "Hover do primário. L 36, a altura do wine.700." },
    "1000": { "$value": "#530E23", "$description": "Active do primário." }
  },
  "fontFamily": {
    "display": {
      "$value": "\"Work Sans Variable\", \"Inter Variable\", ui-sans-serif, system-ui, sans-serif",
      "$description": "Títulos e hero. Work Sans auto-hospedada (tools/build-sites-fonts.mjs), sem CDN. ADR-069."
    },
    "body": {
      "$value": "\"Inter Variable\", ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
      "$description": "Corpo e interface do site. Inter auto-hospedada. ADR-069."
    }
  },
  "fontSize": {
    "title": { "$value": "1.25rem", "$description": "20px. Título de cartão e de grupo (FAQ). O compartilhado para no xl (18px) e pula para 2xl (22px)." },
    "display-section-sm": { "$value": "clamp(1.9rem, 3.6vw, 3rem)", "$description": "Título de seção compacta: 30 a 48px." },
    "display-section": { "$value": "clamp(2rem, 4vw, 3.25rem)", "$description": "Título de seção principal: 32 a 52px." },
    "display-page": { "$value": "clamp(2.25rem, 4.5vw, 3.75rem)", "$description": "Hero das subpáginas: 36 a 60px." },
    "display-hero": { "$value": "clamp(2.35rem, 5vw, 4.25rem)", "$description": "Hero da home: 38 a 68px." }
  },
  "space": {
    "14": { "$value": "3.5rem", "$description": "56px." },
    "18": { "$value": "4.5rem", "$description": "72px. A margem lateral do conteúdo no desktop, a mesma em todas as páginas do Figma." },
    "20": { "$value": "5rem", "$description": "80px." },
    "24": { "$value": "6rem", "$description": "96px. Respiro entre seções de página." }
  },
  "breakpoint": {
    "2xl": { "$value": "80rem", "$description": "1280px. O desktop largo do Figma (1440) começa a valer aqui. Os sites usam sm, md e xl do compartilhado (640, 768, 1024)." }
  }
}
```

- [ ] **Step 2: A semântica dos sites**

`sites/spec/tokens/semantic.json`:

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "Camada 2 dos sites — a ÚNICA camada pública (ADR-007). Cada token nomeia um papel; nenhum nomeia uma cor. Lê o primitivo compartilhado mais a extensão. Não há tema escuro nos sites; há superfície INVERSA (seções escuras: hero, rodapé, CTA), que é outra coisa — é uma superfície, não um tema.",
  "_meta": {
    "regra": "Proibido nome de token que descreva a cor. Proibido hex cru em cor: tools/build-sites-tokens.mjs falha.",
    "verificacao": "tools/build-sites-tokens.mjs confere contraste de cada par na base e em cada submarca, e marca × destrutivo nos três estados."
  },
  "color": {
    "$type": "color",
    "surface": {
      "canvas": { "$value": "{neutral.0}", "$description": "Fundo da página." },
      "default": { "$value": "{neutral.0}", "$description": "Cartão, painel." },
      "subtle": { "$value": "{neutral.50}", "$description": "Seção que recua um degrau (faixa de depoimentos, biblioteca)." },
      "sunken": { "$value": "{neutral.100}", "$description": "Campo, chip neutro, fundo de código." },
      "inverse": { "$value": "{neutral.700}", "$description": "Seção escura: hero com foto, rodapé, CTA final. O charcoal-500 do CENPRE (L 35,6) cai aqui (L 37,1). Branco em cima dá 10,37:1." },
      "brand": { "$value": "{wine.600}", "$description": "Faixa de marca. A submarca troca." },
      "brand-soft": { "$value": "{wine.50}", "$description": "Lavagem da marca: fundo de tag, de ícone-chip." }
    },
    "text": {
      "primary": { "$value": "{neutral.800}", "$description": "Título. 15,16:1 sobre branco." },
      "body": { "$value": "{neutral.700}", "$description": "Corpo. O charcoal-400 do CENPRE." },
      "secondary": { "$value": "{neutral.600}", "$description": "Apoio, meta de cartão. 7,23:1." },
      "muted": { "$value": "{neutral.550}", "$description": "Legenda, placeholder. 5,70:1 sobre branco — o menor degrau de texto que o site usa." },
      "on-inverse": { "$value": "{neutral.0}" },
      "on-inverse-muted": { "$value": "{neutral.300}", "$description": "Apoio sobre seção escura. 9,89:1 sobre neutral.800; mais sobre o 700." },
      "on-brand": { "$value": "{neutral.0}" },
      "on-action": { "$value": "{neutral.0}" },
      "link": { "$value": "{wine.600}", "$description": "Link no corpo. A submarca troca." },
      "link-hover": { "$value": "{wine.700}" }
    },
    "action": {
      "primary": {
        "default": { "$value": "{wine.600}" },
        "hover": { "$value": "{wine.700}" },
        "active": { "$value": "{wine.800}" },
        "subtle": { "$value": "{wine.50}", "$description": "Fundo do botão terciário em hover e do chip de marca." }
      },
      "secondary": {
        "default": { "$value": "{neutral.0}" },
        "hover": { "$value": "{neutral.50}" },
        "active": { "$value": "{neutral.100}" },
        "border": { "$value": "{neutral.400}", "$description": "3,47:1 sobre branco — acima do piso de 3:1 da 1.4.11. Nos sites a borda do secundário NÃO é desvio como na ADR-009: botão de site não tem campo ao lado para herdar repouso." }
      },
      "danger": {
        "default": { "$value": "{red.600}" },
        "hover": { "$value": "{red.700}" },
        "active": { "$value": "{red.800}" },
        "subtle": { "$value": "{red.100}" }
      },
      "disabled": {
        "background": { "$value": "{neutral.200}" },
        "text": { "$value": "{neutral.600}" }
      }
    },
    "border": {
      "subtle": { "$value": "{neutral.150}" },
      "default": { "$value": "{neutral.200}", "$description": "O ash-300 do CENPRE, a borda padrão de cartão." },
      "strong": { "$value": "{neutral.400}" },
      "focus": { "$value": "{neutral.500}", "$description": "Anel de foco cinza, ADR-048: foco é estado de interação, não marca. 4,71:1 sobre branco." },
      "on-inverse": { "$value": "{neutral.550}" },
      "focus-on-inverse": { "$value": "{neutral.300}", "$description": "O anel sobre seção escura é outro degrau, medido: 9,89:1 sobre neutral.800." }
    },
    "feedback": {
      "$description": "Os mesmos pares da aplicação. Sempre com ícone e texto (WCAG 1.4.1).",
      "success": { "background": { "$value": "{green.100}" }, "foreground": { "$value": "{green.700}" }, "border": { "$value": "{green.500}" } },
      "warning": { "background": { "$value": "{amber.100}" }, "foreground": { "$value": "{amber.700}" }, "border": { "$value": "{amber.500}" } },
      "danger": { "background": { "$value": "{red.100}" }, "foreground": { "$value": "{red.700}" }, "border": { "$value": "{red.500}" } },
      "info": { "background": { "$value": "{blue.100}" }, "foreground": { "$value": "{blue.700}" }, "border": { "$value": "{blue.500}" } }
    },
    "interaction": {
      "hover": { "$value": "{alpha.ink-weak}" },
      "active": { "$value": "{alpha.ink-strong}" }
    }
  },
  "font": {
    "$type": "fontFamily",
    "display": { "$value": "{fontFamily.display}" },
    "body": { "$value": "{fontFamily.body}" }
  },
  "typography": {
    "$type": "typography",
    "$description": "Dois eixos: display (Work Sans, apertado) e body (Inter, 1,5). Os pesos são os do compartilhado — 560 e 650 no eixo variável — porque Inter e Work Sans são variáveis e 600/700 redondos pesam demais em título grande, pelo mesmo motivo da Geist.",
    "display-hero": { "$value": { "fontFamily": "{fontFamily.display}", "fontSize": "{fontSize.display-hero}", "fontWeight": "{fontWeight.bold}", "lineHeight": "1.03", "letterSpacing": "-0.02em" } },
    "display-page": { "$value": { "fontFamily": "{fontFamily.display}", "fontSize": "{fontSize.display-page}", "fontWeight": "{fontWeight.bold}", "lineHeight": "1.03", "letterSpacing": "-0.02em" } },
    "display-section": { "$value": { "fontFamily": "{fontFamily.display}", "fontSize": "{fontSize.display-section}", "fontWeight": "{fontWeight.semibold}", "lineHeight": "1.12", "letterSpacing": "-0.015em" } },
    "display-section-sm": { "$value": { "fontFamily": "{fontFamily.display}", "fontSize": "{fontSize.display-section-sm}", "fontWeight": "{fontWeight.semibold}", "lineHeight": "1.12", "letterSpacing": "-0.01em" } },
    "title": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.title}", "fontWeight": "{fontWeight.semibold}", "lineHeight": "1.3" }, "$description": "Título de cartão e de pergunta do FAQ. 20px." },
    "lede": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.xl}", "fontWeight": "{fontWeight.regular}", "lineHeight": "1.5" }, "$description": "Parágrafo de abertura, 18px." },
    "body-lg": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.lg}", "fontWeight": "{fontWeight.regular}", "lineHeight": "1.5" }, "$description": "16px. Prosa de artigo." },
    "body": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.md}", "fontWeight": "{fontWeight.regular}", "lineHeight": "1.5" }, "$description": "15px. Parágrafo e item de lista — o $fs-base do CENPRE." },
    "caption": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.base}", "fontWeight": "{fontWeight.regular}", "lineHeight": "1.4" }, "$description": "14px. Meta de cartão, legenda." },
    "eyebrow": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.xs}", "fontWeight": "{fontWeight.semibold}", "lineHeight": "1rem", "letterSpacing": "0.08em" }, "$description": "12px, caixa alta pelo componente. A palavra acima do título de seção." },
    "action": { "$value": { "fontFamily": "{fontFamily.body}", "fontSize": "{fontSize.md}", "fontWeight": "{fontWeight.semibold}", "lineHeight": "1.25rem" }, "$description": "Rótulo de botão e de link de navegação." }
  },
  "space": {
    "$type": "dimension",
    "$description": "Seção respira mais que aplicação. Os degraus vêm do compartilhado mais a extensão (14, 18, 20, 24).",
    "section": { "$value": "{space.24}", "$description": "96px entre seções no desktop." },
    "section-sm": { "$value": "{space.16}", "$description": "64px entre seções no telefone, e entre blocos dentro de uma seção." },
    "block": { "$value": "{space.12}", "$description": "48px: título de seção até o conteúdo." },
    "gutter": { "$value": "{space.18}", "$description": "72px de margem lateral no desktop." },
    "gutter-sm": { "$value": "{space.4}", "$description": "16px de margem lateral no telefone." },
    "stack-lg": { "$value": "{space.8}" },
    "stack-md": { "$value": "{space.6}" },
    "stack-sm": { "$value": "{space.4}" },
    "stack-xs": { "$value": "{space.2}" },
    "inline-md": { "$value": "{space.4}" },
    "inline-sm": { "$value": "{space.2}" },
    "inline-xs": { "$value": "{space.1}" },
    "inset-card": { "$value": "{space.6}", "$description": "24px dentro do cartão." },
    "inset-control": { "$value": "{space.5}", "$description": "20px nas laterais do botão." }
  },
  "container": {
    "$type": "dimension",
    "faixa": { "$value": "90rem", "$description": "1440px. Largura máxima de hero e seção full-bleed." },
    "miolo": { "$value": "81rem", "$description": "1296px. Largura máxima do conteúdo." },
    "prosa": { "$value": "51.25rem", "$description": "820px. Texto corrido de artigo." }
  },
  "radius": {
    "$type": "dimension",
    "control": { "$value": "{radius.lg}", "$description": "8px: botão, campo, ícone-chip. O $radius-chip do CENPRE." },
    "card": { "$value": "{radius.2xl}", "$description": "16px: cartão e imagem grande." },
    "pill": { "$value": "{radius.full}", "$description": "Tag, pílula, avatar." }
  },
  "elevation": {
    "$type": "shadow",
    "$description": "Os degraus do compartilhado. As sombras do Figma do CENPRE são tingidas de charcoal (rgba(48,62,73,…)); as daqui são pretas a opacidade parecida. A diferença não é visível a olho em superfície branca, e um degrau a mais não paga uma rampa paralela.",
    "button": { "$value": "{shadow.xs}" },
    "card": { "$value": "{shadow.sm}" },
    "card-hover": { "$value": "{shadow.md}" },
    "popover": { "$value": "{shadow.lg}" },
    "modal": { "$value": "{shadow.stack}" }
  },
  "motion": {
    "easing": {
      "$type": "cubicBezier",
      "standard": { "$value": "{easing.standard}" },
      "entrance": { "$value": "{easing.entrance}" },
      "emphasized": { "$value": "{easing.emphasized}" }
    },
    "duration": {
      "$type": "duration",
      "state": { "$value": "{duration.fast}" },
      "reveal": { "$value": "{duration.normal}" },
      "travel": { "$value": "{duration.slow}" }
    }
  },
  "focus": {
    "$type": "dimension",
    "ring-width": { "$value": "2px" },
    "ring-offset": { "$value": "2px" }
  },
  "size": {
    "$type": "dimension",
    "control-md": { "$value": "2.75rem", "$description": "44px: botão e campo de site. É também o alvo mínimo de toque." },
    "control-lg": { "$value": "3.25rem", "$description": "52px: o botão do hero e da CTA." },
    "touch-min": { "$value": "2.75rem" },
    "icon-sm": { "$value": "1rem" },
    "icon-md": { "$value": "1.25rem" },
    "icon-lg": { "$value": "1.5rem" },
    "avatar": { "$value": "2.5rem", "$description": "40px no depoimento." }
  },
  "viewport": {
    "$type": "dimension",
    "$description": "Mobile-first: sempre min-width. Nomes pelo que muda, não pelo aparelho.",
    "duas-colunas": { "$value": "{breakpoint.sm}", "$description": "640px: cartões passam a dois por fileira." },
    "nav-aberta": { "$value": "{breakpoint.md}", "$description": "768px: o menu sai da gaveta." },
    "grade-completa": { "$value": "{breakpoint.xl}", "$description": "1024px: três e quatro colunas; gutter de 72." },
    "desktop-largo": { "$value": "{breakpoint.2xl}", "$description": "1280px: o miolo chega ao teto de 1296." }
  },
  "z": {
    "$type": "number",
    "base": { "$value": 0 },
    "header": { "$value": 100 },
    "scrim": { "$value": 190 },
    "menu": { "$value": 200 },
    "overlay": { "$value": 300 },
    "skip": { "$value": 400 }
  }
}
```

- [ ] **Step 3: A submarca do CENPRE**

`sites/spec/tokens/marca.cenpre.json`:

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "Camada 3 — submarca CENPRE (ADR-068). Sobrescreve APENAS tokens semânticos, remapeando-os para a rampa magenta da extensão. Nenhum token novo nasce aqui; tools/build-sites-tokens.mjs falha se nascer. Aplicada por data-marca=\"cenpre\" no elemento raiz.",
  "_meta": {
    "medida": "magenta.700 como ação dá d=0,010 contra red.600 sob tritanopia. A ação desce para o 800 (d=0,101, o mesmo par do UCAMDS); a superfície de marca e o link ficam no 700, que não entram no par decisivo."
  },
  "color": {
    "surface": {
      "brand": { "$value": "{magenta.700}" },
      "brand-soft": { "$value": "{magenta.100}" }
    },
    "text": {
      "link": { "$value": "{magenta.700}" },
      "link-hover": { "$value": "{magenta.800}" }
    },
    "action": {
      "primary": {
        "default": { "$value": "{magenta.800}" },
        "hover": { "$value": "{magenta.900}" },
        "active": { "$value": "{magenta.1000}" },
        "subtle": { "$value": "{magenta.100}" }
      }
    }
  }
}
```

- [ ] **Step 4: O README do diretório**

`sites/README.md`:

```markdown
# sites/ — UCAMDS Sites

O segundo sistema do UCAMDS: o dos sites públicos (institucional, CENPRE,
Campos). Desenho em `docs/superpowers/specs/2026-10-08-ds-dos-sites-design.md`,
decisão na ADR-067.

Lê o primitivo compartilhado (`spec/tokens/primitive.json`) e só acrescenta a
ele (`sites/spec/tokens/primitive.json`). A semântica é própria
(`sites/spec/tokens/semantic.json`): papéis de site, sem tema escuro, com
superfície inversa. Cada submarca é uma camada 3 (`marca.<id>.json`) que só
sobrescreve semânticos — a primeira é o CENPRE (ADR-068).

    pnpm run sites        tokens + fontes → dist/sites/
    pnpm run test:tools   os testes da ferramenta

Prefixos: CSS `--ucam-site-*`, SCSS `$ucam-site-*`. O que ainda não existe
aqui (contratos de componente, catálogo, lib Angular) é dos subprojetos 2 e 3
da spec.
```

- [ ] **Step 5: Validar que os JSON são bem formados**

Run: `node -e "for (const f of ['primitive','semantic','marca.cenpre']) JSON.parse(require('fs').readFileSync('sites/spec/tokens/'+f+'.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 6: Commit**

```bash
git add sites/
git commit -m "Sites: as três camadas de token — extensão, semântica e a submarca CENPRE

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Marca × destrutivo como função reutilizável

**Files:**
- Modify: `tools/check-marca-vs-destrutivo.mjs:69-135` (o laço vira função exportada; `principal()` a chama)
- Create: `tools/test/marca-vs-destrutivo.test.mjs`

**Interfaces:**
- Produces: `conferirMarcaVsDestrutivo({ tema, cor, decisivos = DECISIVOS, coexistem = COEXISTEM }) → { falhas: string[], desvios: string[], relatos: string[] }`, onde `cor(nome)` devolve hex maiúsculo (`'#8D293A'`) ou `null` para um nome como `'action-primary-default'`. Também exporta `DECISIVOS` e `COEXISTEM`.

- [ ] **Step 1: Escrever o teste que falha**

`tools/test/marca-vs-destrutivo.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conferirMarcaVsDestrutivo, DECISIVOS } from '../check-marca-vs-destrutivo.mjs';

const mapa = (primario, perigo) => (nome) => ({
  'action-primary-default': primario[0],
  'action-primary-hover': primario[1],
  'action-primary-active': primario[2],
  'action-danger-default': perigo[0],
  'action-danger-hover': perigo[1],
  'action-danger-active': perigo[2],
}[nome] ?? null);

const RED = ['#B44334', '#9F2F23', '#7F2A1F'];

test('o par do UCAMDS (wine.600/700/800 × red.600/700/800) passa', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'base', cor: mapa(['#8D293A', '#6C1E2B', '#52151F'], RED), coexistem: [] });
  assert.deepEqual(r.falhas, []);
  assert.equal(r.relatos.length, DECISIVOS.length);
});

test('magenta.700 como ação encosta no red.600 e reprova', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'cenpre', cor: mapa(['#B4365B', '#922243', '#70132F'], RED), coexistem: [] });
  assert.equal(r.falhas.length, 1);
  assert.match(r.falhas[0], /preenchimento em repouso/);
  assert.match(r.falhas[0], /#B4365B × #B44334/);
});

test('magenta.800/900/1000 como ação passa nos três estados', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'cenpre', cor: mapa(['#922243', '#70132F', '#530E23'], RED), coexistem: [] });
  assert.deepEqual(r.falhas, []);
});

test('token ausente é falha nomeada, não exceção', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'x', cor: () => null, coexistem: [] });
  assert.equal(r.falhas.length, DECISIVOS.length);
  assert.match(r.falhas[0], /token ausente/);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: os quatro testes falham (`conferirMarcaVsDestrutivo` não exportada).

- [ ] **Step 3: Refatorar o portão**

Em `tools/check-marca-vs-destrutivo.mjs`, exporte as duas listas (`export const DECISIVOS = [...]`, `export const COEXISTEM = [...]`) e substitua o corpo do `for (const [tema, mapa] of ...)` dentro de `principal()` pela chamada da função nova. O arquivo fica assim a partir de `const COEXISTEM`:

```js
export const COEXISTEM = [
  /* ...a lista existente, sem mudar... */
];

/**
 * Mede um conjunto de tokens. `cor(nome)` devolve o hex de `color-<nome>` ou
 * null. Quem chama escolhe as listas: a aplicação mede as duas de cima; os
 * sites (tools/build-sites-tokens.mjs) medem os decisivos e uma lista de
 * coexistência própria, na base e em cada submarca.
 */
export function conferirMarcaVsDestrutivo({ tema, cor, decisivos = DECISIVOS, coexistem = COEXISTEM }) {
  const falhas = [];
  const desvios = [];
  const relatos = [];

  for (const [grupo, lista, limite, balde] of [
    ['decisivo', decisivos, LIMITE_DECISIVO, falhas],
    ['coexiste', coexistem, LIMITE_COEXISTE, desvios],
  ]) {
    for (const [rotulo, aNome, bNome] of lista) {
      const a = cor(aNome);
      const b = cor(bNome);
      if (!a || !b) {
        falhas.push(`[${tema}] token ausente ou não resolvido no par "${rotulo}": ${!a ? aNome : bNome}`);
        continue;
      }

      let pior = { d: Infinity, tipo: 'normal' };
      for (const tipo of TIPOS) {
        const d = distancia(ver(a, tipo), ver(b, tipo));
        if (d < pior.d) pior = { d, tipo };
      }

      /* ΔL é o diagnóstico, não enfeite. Sob protanopia e deuteranopia o arco
       * vinho→vermelho→laranja colapsa num eixo só: matiz deixa de separar e
       * tudo o que sobra mora na luminosidade. Sem esta linha o relatório diz
       * QUE o par encostou e não diz que a saída é degrau de L — e a saída
       * intuitiva, girar mais a matiz, foi medida e não rende nada. */
      const dL = Math.abs(hexParaOklch(a).L - hexParaOklch(b).L);
      const linha = `[${tema}] ${rotulo}: ${a} × ${b} · pior d=${pior.d.toFixed(3)} (${pior.tipo}, mínimo ${limite.toFixed(2)}) · ΔL ${dL.toFixed(1)}`;

      if (pior.d < limite) balde.push(linha + (dL < 9 ? ' — sem degrau de luminosidade para sustentar a distinção' : ''));
      else relatos.push('  ✓ ' + linha);
    }
  }

  return { falhas, desvios, relatos };
}

function principal() {
  const NL = String.fromCharCode(10);
  const tokens = readFileSync('dist/tokens/ucam-tokens.css', 'utf8');
  /* Recorte por BLOCO, pelo mesmo motivo que o portão de daltonismo documenta:
   * entre o :root claro e o :root[data-theme="dark"] existe um @media
   * prefers-color-scheme que também carrega o escuro. */
  const blocoDe = (marca) => {
    const i = tokens.indexOf(marca);
    if (i < 0) return '';
    const ini = tokens.indexOf('{', i);
    return tokens.slice(ini, tokens.indexOf(NL + '}', ini));
  };
  const leVars = (txt) =>
    Object.fromEntries([...txt.matchAll(/--(ucam-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const resolve = (v, mapa, n = 0) => {
    if (n > 10 || !v) return v;
    const m = String(v).match(/^var\(--([a-z0-9-]+)\)$/);
    return m ? resolve(mapa[m[1]], mapa, n + 1) : String(v).trim();
  };

  const claro = leVars(blocoDe(NL + ':root {'));
  const escuro = { ...claro, ...leVars(blocoDe(':root[data-theme="dark"] {')) };

  const falhas = [];
  const desvios = [];
  const relatos = [];

  for (const [tema, mapa] of [['claro', claro], ['escuro', escuro]]) {
    const cor = (nome) => {
      const hex = resolve(`var(--ucam-color-${nome})`, mapa);
      return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : null;
    };
    const r = conferirMarcaVsDestrutivo({ tema, cor });
    falhas.push(...r.falhas);
    desvios.push(...r.desvios);
    relatos.push(...r.relatos);
  }

  console.log('marca × destrutivo — o bordô e o vermelho ainda são duas cores? (ADR-002)');
  /* ...o restante de principal() não muda: imprime relatos, desvios, falhas e sai. */
```

Mantenha o `if (import.meta.url === pathToFileURL(...)) principal();` no fim. A lista `DECISIVOS` e as constantes `LIMITE_*`, `TIPOS`, `ver` ficam onde estão, só ganhando `export` nas duas listas.

- [ ] **Step 4: Rodar os testes e o portão real**

Run: `pnpm run test:tools && pnpm run tokens && pnpm run marca`
Expected: `# pass 15`; o portão imprime as mesmas linhas de antes e `✓ marca e destrutivo separáveis nos dois temas, nas três dicromacias`.

- [ ] **Step 5: Commit**

```bash
git add tools/check-marca-vs-destrutivo.mjs tools/test/marca-vs-destrutivo.test.mjs
git commit -m "Marca × destrutivo vira função: os sites medem a base e cada submarca pelo mesmo portão

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: `tools/build-sites-tokens.mjs` — leitura, portões e saídas

**Files:**
- Create: `tools/build-sites-tokens.mjs`
- Create: `tools/test/sites-tokens.test.mjs`
- Create: `tools/test/fixtures/sites-minimo/` (gerado pelo teste em diretório temporário; nada commitado)

**Interfaces:**
- Consumes: `tools/lib/tokens.mjs` (Task 1 e 2), `conferirMarcaVsDestrutivo` (Task 4), `contrast` de `tools/lib/wcag.mjs`.
- Produces: `construir({ raiz }) → { arquivos: [nome, conteudo][], falhas: string[], desvios: string[], relatos: string[] }`. Nomes dos arquivos: `ucam-site-tokens.css`, `_ucam-site-tokens.scss`, `ucam-site-tokens.json`, e um `ucam-site-marca-<id>.css` por submarca. `principal()` escreve em `dist/sites/tokens/` e sai 1 se houver falha. Lê, se existir, `sites/spec/adapters/*.json` (Task 7 acrescenta a checagem; aqui só o esqueleto).

- [ ] **Step 1: Escrever os testes que falham**

`tools/test/sites-tokens.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { construir } from '../build-sites-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Um repositório mínimo: o primitivo compartilhado real, e uma semântica de
 * sites pequena o bastante para o teste ler. */
function repoMinimo({ extensao, semantic, marcas = {} } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-sites-'));
  mkdirSync(join(raiz, 'spec/tokens'), { recursive: true });
  mkdirSync(join(raiz, 'sites/spec/tokens'), { recursive: true });
  cpSync(join(ROOT, 'spec/tokens/primitive.json'), join(raiz, 'spec/tokens/primitive.json'));
  writeFileSync(join(raiz, 'sites/spec/tokens/primitive.json'), JSON.stringify(extensao ?? { magenta: { $type: 'color', 800: { $value: '#922243' } } }));
  writeFileSync(join(raiz, 'sites/spec/tokens/semantic.json'), JSON.stringify(semantic ?? SEMANTICA));
  for (const [id, m] of Object.entries(marcas)) writeFileSync(join(raiz, `sites/spec/tokens/marca.${id}.json`), JSON.stringify(m));
  return raiz;
}

const SEMANTICA = {
  color: {
    $type: 'color',
    surface: { canvas: { $value: '{neutral.0}' }, inverse: { $value: '{neutral.700}' }, brand: { $value: '{wine.600}' } },
    text: { primary: { $value: '{neutral.800}' }, 'on-inverse': { $value: '{neutral.0}' }, 'on-brand': { $value: '{neutral.0}' }, 'on-action': { $value: '{neutral.0}' }, link: { $value: '{wine.600}' } },
    action: {
      primary: { default: { $value: '{wine.600}' }, hover: { $value: '{wine.700}' }, active: { $value: '{wine.800}' }, subtle: { $value: '{wine.50}' } },
      danger: { default: { $value: '{red.600}' }, hover: { $value: '{red.700}' }, active: { $value: '{red.800}' } },
    },
    border: { focus: { $value: '{neutral.500}' }, 'focus-on-inverse': { $value: '{neutral.300}' } },
    feedback: { danger: { background: { $value: '{red.100}' }, foreground: { $value: '{red.700}' }, border: { $value: '{red.500}' } } },
  },
  typography: { $type: 'typography', body: { $value: { fontSize: '{fontSize.md}', fontWeight: '{fontWeight.regular}', lineHeight: '1.5' } } },
};

test('a spec real dos sites passa em todos os portões e gera os quatro arquivos', () => {
  const r = construir({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
  const nomes = r.arquivos.map(([n]) => n);
  assert.deepEqual(nomes, ['ucam-site-tokens.css', '_ucam-site-tokens.scss', 'ucam-site-tokens.json', 'ucam-site-marca-cenpre.css']);
  const css = r.arquivos[0][1];
  assert.match(css, /--ucam-site-color-action-primary-default: #8D293A;/);
  assert.match(css, /--ucam-site-typography-display-hero-font-size: clamp\(/);
  assert.doesNotMatch(css, /--ucam-color-/);
  const marca = r.arquivos[3][1];
  assert.match(marca, /:root\[data-marca="cenpre"\] \{/);
  assert.match(marca, /--ucam-site-color-action-primary-default: #922243;/);
  assert.doesNotMatch(marca, /--ucam-site-color-text-primary/);
});

test('o repositório mínimo passa', () => {
  const r = construir({ raiz: repoMinimo() });
  assert.deepEqual(r.falhas, []);
});

test('extensão que redefine wine.600 derruba nomeando o caminho', () => {
  const raiz = repoMinimo({ extensao: { wine: { 600: { $value: '#000000' } } } });
  assert.throws(() => construir({ raiz }), /redefine primitivo compartilhado: wine\.600/);
});

test('hex cru em cor da semântica é falha', () => {
  const s = structuredClone(SEMANTICA);
  s.color.text.link = { $value: '#B4365B' };
  const r = construir({ raiz: repoMinimo({ semantic: s }) });
  assert.ok(r.falhas.some((f) => /hex cru.*color-text-link/.test(f)), r.falhas.join('\n'));
});

test('submarca que cria token é falha; submarca que só sobrescreve passa', () => {
  const cria = { color: { text: { novo: { $value: '{magenta.800}' } } } };
  const r1 = construir({ raiz: repoMinimo({ marcas: { x: cria } }) });
  assert.ok(r1.falhas.some((f) => /marca x cria token color-text-novo/.test(f)), r1.falhas.join('\n'));
  const sobrescreve = { color: { action: { primary: { default: { $value: '{magenta.800}' } } } } };
  const r2 = construir({ raiz: repoMinimo({ marcas: { x: sobrescreve } }) });
  assert.deepEqual(r2.falhas, []);
});

test('par de contraste que reprova é falha com o par nomeado', () => {
  const s = structuredClone(SEMANTICA);
  s.color.text.primary = { $value: '{neutral.300}' };
  const r = construir({ raiz: repoMinimo({ semantic: s }) });
  assert.ok(r.falhas.some((f) => /texto principal sobre a página/.test(f)), r.falhas.join('\n'));
});

test('submarca cuja ação encosta no vermelho é falha de marca × destrutivo', () => {
  const ext = { magenta: { $type: 'color', 700: { $value: '#B4365B' }, 800: { $value: '#922243' }, 900: { $value: '#70132F' } } };
  const marca = { color: { action: { primary: { default: { $value: '{magenta.700}' }, hover: { $value: '{magenta.800}' }, active: { $value: '{magenta.900}' } } } } };
  const r = construir({ raiz: repoMinimo({ extensao: ext, marcas: { cenpre: marca } }) });
  assert.ok(r.falhas.some((f) => /\[cenpre\] preenchimento em repouso/.test(f)), r.falhas.join('\n'));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: FAIL — `Cannot find module '.../tools/build-sites-tokens.mjs'`.

- [ ] **Step 3: Escrever o script**

`tools/build-sites-tokens.mjs`:

```js
// Gera os tokens do UCAMDS Sites a partir de sites/spec/tokens/.
//
// Lê o primitivo COMPARTILHADO (spec/tokens/primitive.json) mais a extensão
// dos sites, a semântica dos sites e cada submarca (marca.<id>.json). Falha o
// build se a extensão redefinir degrau compartilhado, se houver hex cru na
// semântica, se uma submarca criar token em vez de sobrescrever, se algum par
// de contraste reprovar ou se marca e destrutivo encostarem — na base e em
// cada submarca. É o mesmo portão do build-tokens, para outro sistema.
//
//   node tools/build-sites-tokens.mjs
//
// Saídas em dist/sites/tokens/: CSS custom properties (--ucam-site-*), SCSS
// ($ucam-site-*, para a constitution do dev do CENPRE), JSON resolvido e um
// CSS por submarca, aplicado por data-marca="<id>" no elemento raiz.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { criarResolvedor, flatten, mesclarPrimitivos, aplicarCamada, cssVar, scssLine } from './lib/tokens.mjs';
import { contrast as ratio } from './lib/wcag.mjs';
import { conferirMarcaVsDestrutivo, DECISIVOS } from './check-marca-vs-destrutivo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = 'ucam-site';

/* Os pares que o site mostra. Diferentes dos da aplicação: aqui há superfície
 * inversa e não há chão, tabela, indicador nem desabilitado em campo. Um par
 * cujo token não exista é pulado — a semântica mínima dos testes não declara
 * todos, e a real declara. */
const PARES = [
  ['color-text-primary', 'color-surface-canvas', 'texto principal sobre a página', 4.5],
  ['color-text-primary', 'color-surface-subtle', 'texto principal sobre seção recuada', 4.5],
  ['color-text-body', 'color-surface-canvas', 'corpo sobre a página', 4.5],
  ['color-text-body', 'color-surface-subtle', 'corpo sobre seção recuada', 4.5],
  ['color-text-secondary', 'color-surface-canvas', 'apoio sobre a página', 4.5],
  ['color-text-secondary', 'color-surface-subtle', 'apoio sobre seção recuada', 4.5],
  ['color-text-muted', 'color-surface-canvas', 'legenda sobre a página', 4.5],
  ['color-text-muted', 'color-surface-subtle', 'legenda sobre seção recuada', 4.5],
  ['color-text-muted', 'color-surface-sunken', 'placeholder sobre campo', 4.5],
  ['color-text-on-inverse', 'color-surface-inverse', 'texto sobre seção escura', 4.5],
  ['color-text-on-inverse-muted', 'color-surface-inverse', 'apoio sobre seção escura', 4.5],
  ['color-text-on-brand', 'color-surface-brand', 'texto sobre faixa de marca', 4.5],
  ['color-text-on-action', 'color-action-primary-default', 'rótulo sobre ação primária', 4.5],
  ['color-text-on-action', 'color-action-primary-hover', 'rótulo sobre ação primária em hover', 4.5],
  ['color-text-on-action', 'color-action-primary-active', 'rótulo sobre ação primária pressionada', 4.5],
  ['color-text-on-action', 'color-action-danger-default', 'rótulo sobre ação destrutiva', 4.5],
  ['color-text-on-action', 'color-action-danger-hover', 'rótulo sobre ação destrutiva em hover', 4.5],
  ['color-text-on-action', 'color-action-danger-active', 'rótulo sobre ação destrutiva pressionada', 4.5],
  ['color-action-primary-default', 'color-surface-canvas', 'ação primária como texto', 4.5],
  ['color-action-primary-default', 'color-action-primary-subtle', 'ação primária sobre a própria lavagem', 4.5],
  ['color-action-danger-default', 'color-surface-canvas', 'destrutivo como texto', 4.5],
  ['color-action-danger-default', 'color-action-danger-subtle', 'destrutivo sobre a própria lavagem', 4.5],
  ['color-text-link', 'color-surface-canvas', 'link sobre a página', 4.5],
  ['color-text-link', 'color-surface-subtle', 'link sobre seção recuada', 4.5],
  ['color-text-link-hover', 'color-surface-canvas', 'link em hover', 4.5],
  ['color-action-disabled-text', 'color-action-disabled-background', 'tinta de controle desabilitado', 4.5],
  ['color-border-focus', 'color-surface-canvas', 'anel de foco sobre a página', 3],
  ['color-border-focus-on-inverse', 'color-surface-inverse', 'anel de foco sobre seção escura', 3],
  ['color-action-secondary-border', 'color-surface-canvas', 'borda do botão secundário', 3],
];

/* Pares que dividem a tela do site. Não decidem a ação; viram desvio nomeado. */
const COEXISTEM_SITES = [
  ['ação primária × filete de erro', 'action-primary-default', 'feedback-danger-border'],
  ['anel de foco × botão destrutivo', 'border-focus', 'action-danger-default'],
  ['link × tinta de erro', 'text-link', 'feedback-danger-foreground'],
];

const banner = (fmt) => `/* @ucam/site-css — gerado de sites/spec/tokens/ por tools/build-sites-tokens.mjs
 * NÃO EDITAR À MÃO. Edite a spec e rode: pnpm sites
 * Formato: ${fmt}
 */\n`;

export function construir({ raiz = ROOT } = {}) {
  const lerJson = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const falhas = [];
  const desvios = [];
  const relatos = [];

  /* ------------------------------------------------------- as camadas --- */
  const primitive = mesclarPrimitivos(lerJson('spec/tokens/primitive.json'), lerJson('sites/spec/tokens/primitive.json'));
  const semantic = lerJson('sites/spec/tokens/semantic.json');
  const resolve = criarResolvedor(primitive);
  const primFlat = flatten(primitive, resolve);
  const semFlat = flatten(semantic, resolve);

  for (const t of semFlat) {
    if (t.group === 'color' && !t.composite && !t.ref) falhas.push(`hex cru em ${t.name}: cor na semântica referencia um primitivo (ADR-007)`);
  }

  const dirTokens = join(raiz, 'sites/spec/tokens');
  const nomesSem = new Set(semFlat.map((t) => t.name));
  const marcas = readdirSync(dirTokens)
    .filter((f) => /^marca\.[a-z0-9-]+\.json$/.test(f))
    .sort()
    .map((f) => ({ id: f.slice('marca.'.length, -'.json'.length), flat: flatten(lerJson(join('sites/spec/tokens', f)), resolve) }));
  for (const m of marcas) {
    for (const t of m.flat) {
      if (!nomesSem.has(t.name)) falhas.push(`marca ${m.id} cria token ${t.name} — camada 3 só sobrescreve semânticos`);
      if (t.group === 'color' && !t.composite && !t.ref) falhas.push(`hex cru em ${t.name} (marca ${m.id})`);
    }
  }

  /* --------------------------------------------------------- portões --- */
  const variantes = [['base', semFlat], ...marcas.map((m) => [m.id, aplicarCamada(semFlat, m.flat)])];
  for (const [nome, tokens] of variantes) {
    const get = (n) => tokens.find((t) => t.name === n)?.value;
    for (const [fg, bg, desc, min] of PARES) {
      const f = get(fg);
      const b = get(bg);
      if (!f || !b) continue;
      const r = ratio(f, b);
      if (r < min) falhas.push(`[${nome}] ${desc}: ${fg} ${f} sobre ${bg} ${b} dá ${r.toFixed(2)}:1, mínimo ${min}`);
    }
    for (const tom of ['success', 'warning', 'danger', 'info']) {
      const f = get(`color-feedback-${tom}-foreground`);
      const b = get(`color-feedback-${tom}-background`);
      if (!f || !b) continue;
      const r = ratio(f, b);
      if (r < 4.5) falhas.push(`[${nome}] feedback ${tom}: ${f} sobre ${b} dá ${r.toFixed(2)}:1`);
    }
    const cor = (n) => {
      const v = get(`color-${n}`);
      return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : null;
    };
    const temDecisivos = DECISIVOS.every(([, a, b]) => cor(a) && cor(b));
    if (temDecisivos) {
      const r = conferirMarcaVsDestrutivo({ tema: nome, cor, coexistem: COEXISTEM_SITES.filter(([, a, b]) => cor(a) && cor(b)) });
      falhas.push(...r.falhas);
      desvios.push(...r.desvios);
      relatos.push(...r.relatos);
    }
  }

  /* ---------------------------------------------------------- saídas --- */
  const css = `${banner('CSS custom properties')}
:root {
  /* camada 1 — primitivos compartilhados e extensão. Não referencie (ADR-007). */
${primFlat.map((t) => cssVar(P, t, resolve)).join('\n')}

  /* camada 2 — semânticos dos sites. É o que os sites usam. */
${semFlat.map((t) => cssVar(P, t, resolve)).join('\n')}
}
`;

  const scss = `${banner('SCSS')}
${primFlat.map((t) => scssLine(P, t, resolve)).join('\n')}

${semFlat.map((t) => scssLine(P, t, resolve)).join('\n')}

$${P}-semantic: (
${semFlat.filter((t) => !t.composite).map((t) => `  "${t.name}": $${P}-${t.name}`).join(',\n')}
);
`;

  const json = JSON.stringify({
    $generated: new Date().toISOString(),
    $source: 'sites/spec/tokens/ (+ spec/tokens/primitive.json)',
    primitive: Object.fromEntries(primFlat.filter((t) => !t.composite).map((t) => [t.name, t.value])),
    semantic: Object.fromEntries(semFlat.map((t) => [t.name, { value: t.value, ref: t.ref, description: t.description }])),
    marcas: Object.fromEntries(marcas.map((m) => [m.id, Object.fromEntries(m.flat.map((t) => [t.name, { value: t.value, ref: t.ref }]))])),
  }, null, 2);

  const arquivos = [
    ['ucam-site-tokens.css', css],
    ['_ucam-site-tokens.scss', scss],
    ['ucam-site-tokens.json', json],
  ];
  for (const m of marcas) {
    arquivos.push([`ucam-site-marca-${m.id}.css`, `${banner(`submarca ${m.id} (camada 3)`)}
/* Importe DEPOIS de ucam-site-tokens.css. Aplica-se com data-marca="${m.id}"
 * no elemento raiz: só os semânticos listados mudam; o resto herda. */
:root[data-marca="${m.id}"] {
${m.flat.map((t) => cssVar(P, t, resolve)).join('\n')}
}
`]);
  }

  return { arquivos, falhas, desvios, relatos, marcas: marcas.map((m) => m.id) };
}

function principal() {
  const r = construir();
  console.log('tokens dos sites — base' + (r.marcas.length ? ` e submarca ${r.marcas.join(', ')}` : ''));
  for (const l of r.relatos) console.log(l);
  if (r.desvios.length) {
    console.log('\n⚠ desvios nomeados:');
    for (const d of r.desvios) console.log('  ' + d);
  }
  if (r.falhas.length) {
    console.error(`\n✗ ${r.falhas.length} falha(s):`);
    for (const f of r.falhas) console.error('  ' + f);
    process.exit(1);
  }
  const out = join(ROOT, 'dist', 'sites', 'tokens');
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  for (const [nome, conteudo] of r.arquivos) writeFileSync(join(out, nome), conteudo, 'utf8');
  console.log(`\n✓ @ucam/site-css tokens → dist/sites/tokens/ (${r.arquivos.map(([n]) => n).join(', ')})`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm run test:tools`
Expected: `# pass 22`. Se o primeiro teste falhar num par de contraste, o nome do par diz qual token da Task 3 precisa de outro degrau — ajuste a semântica, não o portão.

- [ ] **Step 5: Rodar o script de verdade**

Run: `node tools/build-sites-tokens.mjs && ls dist/sites/tokens && grep -c "ucam-site-" dist/sites/tokens/ucam-site-tokens.css`
Expected: três linhas `✓` de marca × destrutivo para `base` e três para `cenpre`, `✓ @ucam/site-css tokens → dist/sites/tokens/ (...)`, quatro arquivos listados, contagem maior que 200.

- [ ] **Step 6: Byte a byte do UCAMDS continua**

Run: `pnpm run tokens && pnpm run marca && pnpm run css && sh $SCRATCH/compara.sh`
Expected: três `✓ dist/... igual`.

- [ ] **Step 7: Commit**

```bash
git add tools/build-sites-tokens.mjs tools/test/sites-tokens.test.mjs
git commit -m "build-sites-tokens: as camadas dos sites passam pelos portões e saem em dist/sites/tokens/

Primitivo compartilhado mais extensão com colisão nomeada, hex cru na
semântica reprovado, submarca que cria token reprovada, contraste e marca ×
destrutivo medidos na base e no CENPRE.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Fontes dos sites (Work Sans e Inter)

**Files:**
- Modify: `tools/lib/fonts-css.mjs` (parametrizar a lista de famílias)
- Create: `tools/build-sites-fonts.mjs`
- Create: `tools/test/fonts-css.test.mjs`
- Modify: `package.json` (devDependencies e script `sites`)

**Interfaces:**
- Produces em `fonts-css.mjs`: `familiasSites` (Work Sans, Inter), `arquivosWoff2De(lista) → string[]`, `fontFaceCss(prefixo, lista = familias)`. `familias` e `arquivosWoff2` continuam exportados e iguais.

- [ ] **Step 1: Instalar as fontes**

```bash
pnpm add -D @fontsource-variable/work-sans@^5.3.0 @fontsource-variable/inter@^5.3.0
ls node_modules/@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2 node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2
```

Expected: os dois arquivos existem. (Se o nome diferir, confira `ls node_modules/@fontsource-variable/inter/files/ | grep latin-wght` e ajuste `arquivo` em `familiasSites`.)

- [ ] **Step 2: Escrever o teste que falha**

`tools/test/fonts-css.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { familias, familiasSites, arquivosWoff2, arquivosWoff2De, fontFaceCss } from '../lib/fonts-css.mjs';

test('a lista da aplicação não mudou', () => {
  assert.deepEqual(familias.map((f) => f.nome), ['Geist Variable', 'Geist Mono Variable']);
  assert.deepEqual(arquivosWoff2, arquivosWoff2De(familias));
  assert.match(fontFaceCss('../fonts'), /font-family: 'Geist Variable'/);
  assert.doesNotMatch(fontFaceCss('../fonts'), /Work Sans/);
});

test('a lista dos sites traz Work Sans e Inter, latin e latin-ext', () => {
  assert.deepEqual(familiasSites.map((f) => f.nome), ['Work Sans Variable', 'Inter Variable']);
  assert.deepEqual(arquivosWoff2De(familiasSites), [
    'work-sans-latin-wght-normal.woff2',
    'work-sans-latin-ext-wght-normal.woff2',
    'inter-latin-wght-normal.woff2',
    'inter-latin-ext-wght-normal.woff2',
  ]);
  const css = fontFaceCss('../fonts', familiasSites);
  assert.match(css, /font-family: 'Work Sans Variable'/);
  assert.match(css, /url\('\.\.\/fonts\/inter-latin-wght-normal\.woff2'\)/);
  assert.doesNotMatch(css, /Geist/);
  assert.doesNotMatch(css, /https?:\/\//);
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: o segundo teste falha (`familiasSites` indefinida).

- [ ] **Step 4: Parametrizar a lib**

Em `tools/lib/fonts-css.mjs`, depois de `export const familias = [...]`, acrescente:

```js
// Os sites (sites/spec/tokens/primitive.json, ADR-069) têm voz editorial:
// Work Sans para display e Inter para corpo. É o que o Figma "UCAM SITE"
// especifica e o que os dois sites já carregam — de CDN, que é o que a
// auto-hospedagem corrige.
export const familiasSites = [
  { pkg: '@fontsource-variable/work-sans', arquivo: 'work-sans', nome: 'Work Sans Variable' },
  { pkg: '@fontsource-variable/inter', arquivo: 'inter', nome: 'Inter Variable' },
];
```

Troque a definição de `arquivosWoff2` por:

```js
export const arquivosWoff2De = (lista) =>
  lista.flatMap((f) => subconjuntos.map((s) => `${f.arquivo}-${s.id}-wght-normal.woff2`));

export const arquivosWoff2 = arquivosWoff2De(familias);
```

E a assinatura de `fontFaceCss`:

```js
/** @param prefixo caminho até a pasta das fontes, sem barra final.
 *  @param lista famílias a declarar; a aplicação usa a padrão, os sites passam familiasSites. */
export function fontFaceCss(prefixo, lista = familias) {
  return lista
    .flatMap((familia) =>
```

(o resto da função não muda).

- [ ] **Step 5: O script dos sites**

`tools/build-sites-fonts.mjs`:

```js
// Empacota Work Sans e Inter como fontes auto-hospedadas do UCAMDS Sites.
// A mesma regra do build-fonts: sem CDN, o arquivo sai do servidor do site.
//
//   node tools/build-sites-fonts.mjs

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { familiasSites, arquivosWoff2De, fontFaceCss } from './lib/fonts-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const licencas = familiasSites.map((f) => {
  const l = readFileSync(join(ROOT, 'node_modules', f.pkg, 'LICENSE'), 'utf8')
    .split('\n')
    .find((x) => /SIL|OFL|Open Font/i.test(x))
    ?.trim();
  return `${f.nome}: ${l ?? 'SIL Open Font License 1.1'}`;
});

const cabecalho = `/* @ucam/site-css fontes — gerado por tools/build-sites-fonts.mjs
 * NÃO EDITAR À MÃO.
 *
 * Work Sans (display) e Inter (corpo), auto-hospedadas. Sem CDN.
 * ${licencas.join('\n * ')}
 */
`;

const destino = { fontes: 'dist/sites/fonts', css: 'dist/sites/css/ucam-site-fonts.css', prefixo: '../fonts' };

let bytes = 0;
for (const arquivo of arquivosWoff2De(familiasSites)) {
  const dono = familiasSites
    .filter((f) => arquivo.startsWith(f.arquivo + '-'))
    .sort((a, b) => b.arquivo.length - a.arquivo.length)[0];
  const origem = join(ROOT, 'node_modules', dono.pkg, 'files', arquivo);
  if (!existsSync(origem)) {
    console.error(`✗ ${arquivo} não existe. Rode: pnpm install`);
    process.exit(1);
  }
  bytes += statSync(origem).size;
  const dir = join(ROOT, destino.fontes);
  mkdirSync(dir, { recursive: true });
  copyFileSync(origem, join(dir, arquivo));
}

const alvo = join(ROOT, destino.css);
mkdirSync(dirname(alvo), { recursive: true });
writeFileSync(alvo, `${cabecalho}\n${fontFaceCss(destino.prefixo, familiasSites)}\n`, 'utf8');

console.log('@ucam/site-css fontes → dist/sites/fonts/ e dist/sites/css/ucam-site-fonts.css');
console.log(`  ${arquivosWoff2De(familiasSites).length} arquivos · ${(bytes / 1024).toFixed(1)} KB · Work Sans e Inter, eixo variável`);
```

- [ ] **Step 6: O script `sites` no package.json**

Em `"scripts"`, depois de `"test:tools"`:

```json
    "sites": "node tools/build-sites-tokens.mjs && node tools/build-sites-fonts.mjs"
```

- [ ] **Step 7: Rodar tudo**

Run: `pnpm run test:tools && pnpm run sites && ls dist/sites/fonts dist/sites/css && pnpm run fonts && sh $SCRATCH/compara.sh`
Expected: `# pass 24`; quatro woff2 e um css em `dist/sites/`; três `✓ dist/... igual` (o `build-fonts` da aplicação não mudou de saída).

- [ ] **Step 8: Commit**

```bash
git add tools/lib/fonts-css.mjs tools/build-sites-fonts.mjs tools/test/fonts-css.test.mjs package.json pnpm-lock.yaml
git commit -m "Fontes dos sites: Work Sans e Inter auto-hospedadas pelo mesmo @font-face parametrizado

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Adaptador do CENPRE — cada token do kit tem destino

**Files:**
- Create: `sites/spec/adapters/cenpre-ui-kit.json`
- Modify: `tools/build-sites-tokens.mjs` (checagem do adaptador dentro de `construir`)
- Modify: `tools/test/sites-tokens.test.mjs`

**Interfaces:**
- `construir({ raiz, kitScss })`: `kitScss` é o caminho do `_tokens.scss` do CENPRE; padrão `process.env.CENPRE_KIT ?? 'C:/Users/Leonardo/Documents/CENPRE/cenpre-ui-angular-scss/projects/cenpre-ui-kit/styles/_tokens.scss'`. Se o arquivo não existe, a segunda checagem vira aviso em `desvios`.
- Forma do adaptador: `{ id, name, alvo: { repositorio, arquivo }, mapa: { "$nome-scss": { destino: "color.action.primary.default" | null, nota? } } }`. `destino` é caminho semântico com pontos; `null` significa "sem papel público: use o semântico que o substitui".

- [ ] **Step 1: Escrever os testes que falham**

Acrescente a `tools/test/sites-tokens.test.mjs`:

```js
test('adaptador: destino inexistente é falha; nome do kit fora do mapa é falha quando o scss existe', () => {
  const raiz = repoMinimo();
  mkdirSync(join(raiz, 'sites/spec/adapters'), { recursive: true });
  writeFileSync(join(raiz, 'sites/spec/adapters/kit.json'), JSON.stringify({
    id: 'kit', name: 'kit', alvo: { repositorio: 'x', arquivo: '_tokens.scss' },
    mapa: { '$color-brand': { destino: 'color.action.primary.default' }, '$color-x': { destino: 'color.nao.existe' } },
  }));
  const scss = join(raiz, '_tokens.scss');
  writeFileSync(scss, '$color-brand: #b4365b;\n$color-x: #000;\n$space-4: 4px;\n');
  const r = construir({ raiz, kitScss: scss });
  assert.ok(r.falhas.some((f) => /\$color-x.*color\.nao\.existe/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /\$space-4.*sem destino no adaptador kit/.test(f)), r.falhas.join('\n'));
});

test('adaptador: sem o scss no disco, a cobertura vira aviso', () => {
  const raiz = repoMinimo();
  mkdirSync(join(raiz, 'sites/spec/adapters'), { recursive: true });
  writeFileSync(join(raiz, 'sites/spec/adapters/kit.json'), JSON.stringify({
    id: 'kit', name: 'kit', alvo: { repositorio: 'x', arquivo: '_tokens.scss' },
    mapa: { '$color-brand': { destino: 'color.action.primary.default' } },
  }));
  const r = construir({ raiz, kitScss: join(raiz, 'nao-existe.scss') });
  assert.deepEqual(r.falhas, []);
  assert.ok(r.desvios.some((d) => /kit.*não está no disco/.test(d)));
});

test('o adaptador real do CENPRE cobre o _tokens.scss do kit, se ele estiver no disco', () => {
  const r = construir({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: os dois primeiros testes novos falham (nenhuma falha produzida; nenhum aviso).

- [ ] **Step 3: A checagem no script**

Em `tools/build-sites-tokens.mjs`, mude a assinatura e acrescente o bloco antes de `/* --- saídas --- */`:

```js
const KIT_PADRAO = 'C:/Users/Leonardo/Documents/CENPRE/cenpre-ui-angular-scss/projects/cenpre-ui-kit/styles/_tokens.scss';

export function construir({ raiz = ROOT, kitScss = process.env.CENPRE_KIT ?? KIT_PADRAO } = {}) {
```

```js
  /* ------------------------------------------------------ adaptadores --- */
  // Cada $nome do _tokens.scss do kit aponta para o semântico que o substitui.
  // É o mapa que o dev segue para trocar a folha, e a prova de que nada ficou
  // sem lugar. O scss mora em outro repositório: se está no disco, cobertura
  // incompleta é falha; se não está, é aviso — o CI não tem o clone.
  const dirAdapt = join(raiz, 'sites/spec/adapters');
  const semPaths = new Set(semFlat.map((t) => t.path.join('.')));
  if (existsSync(dirAdapt)) {
    for (const f of readdirSync(dirAdapt).filter((x) => x.endsWith('.json')).sort()) {
      const a = lerJson(join('sites/spec/adapters', f));
      for (const [nome, { destino }] of Object.entries(a.mapa)) {
        if (destino !== null && !semPaths.has(destino)) falhas.push(`adaptador ${a.id}: ${nome} aponta para ${destino}, que não existe na semântica dos sites`);
      }
      if (existsSync(kitScss)) {
        const declarados = [...readFileSync(kitScss, 'utf8').matchAll(/^\s*(\$[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
        for (const n of new Set(declarados)) {
          if (!(n in a.mapa)) falhas.push(`${n} do kit sem destino no adaptador ${a.id}`);
        }
        relatos.push(`  ✓ adaptador ${a.id}: ${new Set(declarados).size} nomes do kit, todos com destino`);
      } else {
        desvios.push(`adaptador ${a.id}: o scss do kit não está no disco (${kitScss}); cobertura não conferida`);
      }
    }
  }
```

- [ ] **Step 4: O adaptador real**

`sites/spec/adapters/cenpre-ui-kit.json` — um registro por `$nome` do `_tokens.scss`. Os nomes abaixo são os 95 que o arquivo declara em 01/10/2026; confira com `grep -oE '^\s*\$[a-z0-9-]+' <caminho>/_tokens.scss | sort -u | wc -l` e acrescente o que faltar antes de rodar o portão.

```json
{
  "id": "cenpre-ui-kit",
  "name": "cenpre-ui-kit → UCAMDS Sites",
  "description": "Mapa de cada variável SCSS de projects/cenpre-ui-kit/styles/_tokens.scss para o token semântico dos sites que a substitui. destino null = a variável nomeava uma cor crua ou um valor que não tem papel público; o componente passa a usar o semântico indicado na nota.",
  "alvo": {
    "repositorio": "https://github.com/leonfbenevides-bot/cenpre-ui-angular-scss",
    "arquivo": "projects/cenpre-ui-kit/styles/_tokens.scss",
    "submarca": "cenpre"
  },
  "mapa": {
    "$color-magenta-100": { "destino": "color.action.primary.subtle", "nota": "Com data-marca=cenpre. Também color.surface.brand-soft." },
    "$color-magenta-200": { "destino": null, "nota": "Sem papel no kit além de decoração; use color.surface.brand-soft." },
    "$color-magenta-300": { "destino": null, "nota": "Decorativo." },
    "$color-magenta-400": { "destino": null, "nota": "Decorativo." },
    "$color-magenta-500": { "destino": null, "nota": "Decorativo." },
    "$color-magenta-600": { "destino": null, "nota": "4,03:1 sobre branco — não serve de texto nem de ação." },
    "$color-magenta-700": { "destino": "color.surface.brand", "nota": "Era a ação primária. Como ação encosta no vermelho (ADR-068); fica como superfície de marca e color.text.link." },
    "$color-magenta-800": { "destino": "color.action.primary.default", "nota": "Era brand-strong (hover). Passa a ser a ação; hover vai ao 900." },
    "$color-magenta-900": { "destino": "color.action.primary.hover" },
    "$color-magenta-1000": { "destino": "color.action.primary.active" },
    "$color-ash-100": { "destino": "color.surface.subtle" },
    "$color-ash-200": { "destino": "color.surface.sunken" },
    "$color-ash-300": { "destino": "color.border.default" },
    "$color-ash-400": { "destino": "color.border.strong", "nota": "Era borda forte; o degrau sobe para neutral.400 (3,47:1), o ash-400 (L 89) não passa 1.4.11." },
    "$color-ash-600": { "destino": "color.text.muted", "nota": "Era ícone apagado e placeholder (3,0:1 sobre branco — reprova texto). Sobe para neutral.550." },
    "$color-charcoal-100": { "destino": "color.text.muted" },
    "$color-charcoal-200": { "destino": "color.text.secondary" },
    "$color-charcoal-300": { "destino": "color.text.secondary" },
    "$color-charcoal-400": { "destino": "color.text.body" },
    "$color-charcoal-500": { "destino": "color.text.primary", "nota": "Como fundo de seção escura é color.surface.inverse." },
    "$color-success-100": { "destino": "color.feedback.success.background" },
    "$color-success-500": { "destino": "color.feedback.success.border" },
    "$color-success-600": { "destino": "color.feedback.success.border" },
    "$color-success-700": { "destino": "color.feedback.success.foreground" },
    "$color-destructive": { "destino": "color.action.danger.default" },
    "$color-destructive-foreground": { "destino": "color.text.on-action" },
    "$color-info-100": { "destino": "color.feedback.info.background" },
    "$color-info-700": { "destino": "color.feedback.info.foreground" },
    "$color-brand": { "destino": "color.action.primary.default", "nota": "Em botão. Em link é color.text.link; em faixa é color.surface.brand." },
    "$color-brand-strong": { "destino": "color.action.primary.hover" },
    "$color-brand-soft": { "destino": "color.surface.brand-soft" },
    "$color-text-title": { "destino": "color.text.primary" },
    "$color-text-body": { "destino": "color.text.body" },
    "$color-border": { "destino": "color.border.default" },
    "$color-background": { "destino": "color.surface.canvas" },
    "$font-family-display": { "destino": "font.display" },
    "$font-family-base": { "destino": "font.body" },
    "$fw-regular": { "destino": null, "nota": "Peso vive dentro do token de tipografia (typography.*)." },
    "$fw-medium": { "destino": null, "nota": "Idem." },
    "$fw-semibold": { "destino": null, "nota": "Idem; 560 no eixo variável." },
    "$fw-bold": { "destino": null, "nota": "Idem; 650 no eixo variável." },
    "$fs-xs": { "destino": "typography.eyebrow" },
    "$fs-sm": { "destino": "typography.caption", "nota": "13px sobe para 14." },
    "$fs-base": { "destino": "typography.body" },
    "$fs-md": { "destino": "typography.body-lg" },
    "$fs-lg": { "destino": "typography.lede" },
    "$fs-xl": { "destino": "typography.title" },
    "$fs-display-hero": { "destino": "typography.display-hero" },
    "$fs-display-page": { "destino": "typography.display-page" },
    "$fs-display-section": { "destino": "typography.display-section" },
    "$fs-display-section-sm": { "destino": "typography.display-section-sm" },
    "$lh-tight": { "destino": null, "nota": "Entrelinha vive no token de tipografia." },
    "$lh-snug": { "destino": null, "nota": "Idem." },
    "$lh-normal": { "destino": null, "nota": "Idem." },
    "$space-4": { "destino": "space.inline-xs" },
    "$space-8": { "destino": "space.inline-sm" },
    "$space-12": { "destino": "space.stack-xs", "nota": "12px cai para 8 ou sobe para 16; não há degrau de 12 nos sites." },
    "$space-16": { "destino": "space.stack-sm" },
    "$space-20": { "destino": "space.inset-control" },
    "$space-24": { "destino": "space.stack-md" },
    "$space-32": { "destino": "space.stack-lg" },
    "$space-40": { "destino": "space.block", "nota": "40 sobe para 48." },
    "$space-48": { "destino": "space.block" },
    "$space-56": { "destino": "space.section-sm", "nota": "56 sobe para 64." },
    "$space-64": { "destino": "space.section-sm" },
    "$space-80": { "destino": "space.section", "nota": "80 sobe para 96." },
    "$space-96": { "destino": "space.section" },
    "$space-gutter": { "destino": "space.gutter" },
    "$radius-chip": { "destino": "radius.control" },
    "$radius-card": { "destino": "radius.card" },
    "$radius-pill": { "destino": "radius.pill" },
    "$width-container": { "destino": "container.faixa" },
    "$width-content": { "destino": "container.miolo" },
    "$width-prose": { "destino": "container.prosa" },
    "$shadow-button": { "destino": "elevation.button" },
    "$shadow-card": { "destino": "elevation.card" },
    "$shadow-card-hover": { "destino": "elevation.card-hover" },
    "$shadow-popover": { "destino": "elevation.popover" },
    "$shadow-modal": { "destino": "elevation.modal" },
    "$bp-sm": { "destino": "viewport.duas-colunas" },
    "$bp-md": { "destino": "viewport.nav-aberta" },
    "$bp-lg": { "destino": "viewport.grade-completa" },
    "$bp-xl": { "destino": "viewport.desktop-largo" },
    "$transition-fast": { "destino": "motion.duration.state", "nota": "Com motion.easing.standard; o ease de fábrica sai." },
    "$transition-base": { "destino": "motion.duration.reveal" },
    "$focus-ring-color": { "destino": "color.border.focus", "nota": "Era magenta a 45%; vira cinza sólido (ADR-048)." },
    "$focus-ring-offset-color": { "destino": "color.surface.canvas" },
    "$focus-ring-radius": { "destino": "radius.control" }
  }
}
```

- [ ] **Step 5: Rodar os testes e o script**

Run: `pnpm run test:tools && node tools/build-sites-tokens.mjs`
Expected: `# pass 27`; no script, a linha `✓ adaptador cenpre-ui-kit: N nomes do kit, todos com destino`. Se sair `$… do kit sem destino`, acrescente a entrada ao mapa — é o portão fazendo o trabalho dele.

- [ ] **Step 6: Commit**

```bash
git add sites/spec/adapters/cenpre-ui-kit.json tools/build-sites-tokens.mjs tools/test/sites-tokens.test.mjs
git commit -m "Adaptador do CENPRE: cada variável do _tokens.scss do kit aponta para o semântico que a substitui

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: ADRs 067, 068 e 069, e o `sites` no build

**Files:**
- Modify: `spec/decisions/adr.json` (três entradas no fim de `decisions`)
- Modify: `package.json` (script `build`)

- [ ] **Step 1: As três ADRs**

Acrescente ao fim do array `decisions` em `spec/decisions/adr.json` (depois da última entrada, mantendo a vírgula):

```json
    {
      "id": "ADR-067",
      "titulo": "Um segundo sistema para os sites, sobre as mesmas fundações",
      "status": "aceita",
      "data": "2026-10-08",
      "contexto": "Os sites públicos da UCAM (candidomendes.edu.br em Angular 18, cenpre.candidomendes.edu.br em Angular 22, ucam-campos.br em WordPress) não usam o UCAMDS. O institucional carrega três paletas ao mesmo tempo — Angular Material 3 com o azul de fábrica, Bootstrap 5 e os tons do CENPRE — e o bordô da marca aparece uma vez por folha. A pergunta foi se os sites seriam uma parte do UCAMDS ou outro design system. O UCAMDS é um sistema de aplicação, e isso está gravado nele: raio calibrado para aplicação de dados, uma densidade só, corpo de 14px, portões que exigem piso de tabela e um primário por tela. Um site precisa de hero, título de 68px, marquee e seção escura. Mas marca, neutros, feedback, foco, movimento, ícones, escrita e a ferramenta inteira servem aos dois.",
      "decisao": "Nasce o UCAMDS Sites, em sites/, com semântica, tipografia e componentes próprios, que lê o primitivo compartilhado (spec/tokens/primitive.json) e só o estende (sites/spec/tokens/primitive.json): redefinir degrau compartilhado é falha de build. A constitution do dev do CENPRE proíbe framework utilitário, então os sites saem em CSS e SCSS puros e numa lib Angular sem Tailwind; o Trilho B não se aplica a sites. Sem tema escuro; a seção escura é uma superfície (color.surface.inverse), não um tema. Sem subpaleta por app (ADR-037): a variação entre sites é submarca, camada 3.",
      "consequencias": [
        "Dois sistemas, uma marca: wine.600 mudar muda para os dois, e é decisão de marca.",
        "tools/lib/tokens.mjs passa a ser a única implementação de resolução de token; build-tokens e build-sites-tokens a importam.",
        "Os portões de aplicação (faixa, obrigatoriedade, regra do anexo, subpaleta) não rodam para sites/. Os de fundação (contraste, marca × destrutivo, hex cru) rodam.",
        "O catálogo, a lib Angular e o www são os subprojetos 2, 3 e 4 da spec de 08/10/2026."
      ],
      "afeta": ["*"]
    },
    {
      "id": "ADR-068",
      "titulo": "O CENPRE é submarca, e a ação dele desce um degrau",
      "status": "aceita",
      "data": "2026-10-08",
      "contexto": "O CENPRE usa magenta #B4365B como cor primária, charcoal #303E49 e Work Sans com Inter. Medido em OKLCH: o magenta.900 do CENPRE (L 36, matiz 9°) é praticamente o wine.700 (L 36, 15°). O charcoal (242°) é a mesma família do neutral frio do UCAMDS. Não é outra marca; é a mesma família, dezesseis pontos mais clara e mais saturada no 700. A arquitetura de três camadas foi preparada para multimarca em 28/08/2026 e nunca usada. Medido com o portão de marca × destrutivo (ADR-026): magenta.700 como ação primária contra red.600 dá d=0,010 sob tritanopia — a mesma cor que o botão de excluir. A única combinação monotônica (default < hover < active nos dois) que passa os três estados é ação em magenta.800/900/1000 contra red.600/700/800, com d=0,101/0,119/0,115; o próprio par do UCAMDS dá 0,104.",
      "decisao": "O CENPRE entra como a primeira camada 3 de marca, sites/spec/tokens/marca.cenpre.json, aplicada por data-marca=\"cenpre\" no elemento raiz. Sobrescreve apenas semânticos: superfície de marca e link ficam no magenta.700 (5,80:1 sobre branco), a ação primária vai ao magenta.800 (8,29:1), hover ao 900, active ao 1000. O destrutivo continua o do UCAMDS. A rampa magenta vive na extensão primitiva dos sites, com os hex do Figma UCAM SITE. Os neutros não entram: cada ash e charcoal é mapeado por papel para o neutral compartilhado, e quem decide é o contraste.",
      "consequencias": [
        "O botão primário do CENPRE fica um degrau mais escuro que hoje. O hero, as tags e os links continuam na cor de marca.",
        "ash-600 (#939EAA) e ash-400 saem de texto e borda: dão 3,0:1 e menos; sobem para neutral.550 e neutral.400.",
        "O anel de foco deixa de ser magenta a 45% e vira o cinza da ADR-048.",
        "Submarca nova é um arquivo marca.<id>.json e passa pelos mesmos portões, na base e em cada marca."
      ],
      "afeta": ["*"]
    },
    {
      "id": "ADR-069",
      "titulo": "Tipografia dos sites: Work Sans para display, Inter para corpo",
      "status": "aceita",
      "data": "2026-10-08",
      "contexto": "O UCAMDS usa Geist, escolhida para densidade de aplicação, com escala que para em 22px. Um site tem voz editorial e título que chega a 68px. O Figma UCAM SITE especifica Work Sans para títulos e Inter para corpo, e os dois sites já carregam as duas — de CDN. A alternativa era Geist nos dois sistemas, por unidade institucional, ao custo de redesenhar a escala display numa fonte que não foi desenhada para ela.",
      "decisao": "Os sites usam Work Sans Variable para display e Inter Variable para corpo, auto-hospedadas em dist/sites/fonts/ por tools/build-sites-fonts.mjs, pelo mesmo @font-face parametrizado que serve a Geist. A escala display é em clamp() (38–68, 36–60, 32–52, 30–48px). Os pesos são os do compartilhado — 560 e 650 no eixo variável — porque 600/700 redondos pesam demais em título grande, pelo mesmo motivo da Geist. Corpo em 15px, o mesmo da ADR-056.",
      "consequencias": [
        "Nenhuma URL de fonts.googleapis.com nos sites; a regra sem CDN do UCAMDS vale também aqui.",
        "Poppins, Nunito Sans e Roboto, que sobram nos dois sites de outros templates, saem.",
        "Se um dia a decisão for Geist nos dois, muda fontFamily na extensão e os pesos; a escala em clamp() fica."
      ],
      "afeta": ["*"]
    }
```

- [ ] **Step 2: Validar o JSON e os ponteiros**

Run: `node -e "const a=JSON.parse(require('fs').readFileSync('spec/decisions/adr.json','utf8')).decisions; console.log(a.length, a.slice(-3).map(x=>x.id).join(' '))" && pnpm run validate`
Expected: `63 ADR-067 ADR-068 ADR-069` (ou 64 se a ADR-066 do branch `texto-resumo` já tiver chegado), e o `validate` termina com `✓`.

- [ ] **Step 3: O `sites` entra no build**

Em `package.json`, no script `build`, troque `&& pnpm run agentes && pnpm run site` por `&& pnpm run agentes && pnpm run sites && pnpm run site`.

- [ ] **Step 4: Build inteiro e byte a byte**

Run: `pnpm run build 2>&1 | tail -20 && sh $SCRATCH/compara.sh && ls dist/sites/tokens dist/sites/css dist/sites/fonts`
Expected: o build termina sem `✗`; três `✓ dist/... igual`; `dist/sites/` com os quatro arquivos de token, o css de fontes e os quatro woff2.

- [ ] **Step 5: Commit**

```bash
git add spec/decisions/adr.json package.json
git commit -m "ADR-067, 068 e 069: o UCAMDS Sites, a submarca CENPRE e a tipografia dos sites; pnpm run sites entra no build

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Verificação final e entrega

**Files:**
- Nenhum novo. Confere o critério de aceite da spec e deixa a branch pronta.

- [ ] **Step 1: Testes, portões e byte a byte, do zero**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM-sites
rm -rf dist
pnpm run test:tools
pnpm run build 2>&1 | grep -E "✗|✓" | tail -30
sh $SCRATCH/compara.sh
git status --short
```

Expected: `# pass 27`, nenhum `✗`, três `✓ dist/... igual`, `git status` limpo.

- [ ] **Step 2: Ler a saída dos sites com os próprios olhos**

```bash
head -40 dist/sites/tokens/ucam-site-tokens.css
cat dist/sites/tokens/ucam-site-marca-cenpre.css
grep -c "" dist/sites/tokens/_ucam-site-tokens.scss
```

Expected: o CSS começa pelo banner e pelos primitivos compartilhados (`--ucam-site-wine-600: #8D293A`), a submarca tem exatamente oito linhas de token dentro de `:root[data-marca="cenpre"]`, e o SCSS tem mais de 200 linhas.

- [ ] **Step 3: Registrar o que fica para o subprojeto 2**

Acrescente ao fim de `sites/README.md`:

```markdown
## Pendências (subprojeto 2)

- `validate-spec.mjs` e `build-index.mjs` parametrizados por raiz de spec.
- Contratos de componente em `sites/spec/components/` (25 na v1 da spec).
- `dist/sites/css/ucam-site.css` com as classes `.ucam-site-*`.
- Seção `/sites` no site de docs; os tokens servidos em `/sites/tokens/`.
```

```bash
git add sites/README.md
git commit -m "Sites: o que fica para o subprojeto 2

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 4: Entregar**

A branch `sites-fundacao` não é mergeada por este plano. Entrega: o log de commits, a saída de `pnpm run test:tools`, a saída do `compara.sh` e o número de nomes do kit que o adaptador cobriu.

---

## Self-review (feito ao escrever)

- **Cobertura da spec:** nome e lugar (Task 3 e README), três camadas com portão de colisão (Tasks 2, 3, 5), submarca CENPRE (Task 3 e 5), sem tema escuro (Task 3), tipografia Work Sans + Inter auto-hospedada (Tasks 3 e 6), adaptador do CENPRE com portão (Task 7), ADRs (Task 8), `pnpm run sites` no build (Task 8), byte a byte (Tasks 0, 1, 5, 6, 8, 9). Fora deste subprojeto, dito no cabeçalho: `validate-spec`, `build-index`, componentes, CSS de componente, catálogo, lib Angular.
- **Placeholders:** nenhum `TBD`. A lista do adaptador pede conferência contra o scss real (Task 7, Step 4) porque o arquivo mora em outro repositório; o portão diz o que faltar.
- **Consistência de nomes:** `construir({ raiz, kitScss })`, `conferirMarcaVsDestrutivo({ tema, cor, decisivos, coexistem })`, `mesclarPrimitivos(base, extensao)`, `familiasSites`, `arquivosWoff2De(lista)`, `fontFaceCss(prefixo, lista)` — os mesmos em todas as tasks.
- **Review Focus:** 1 → Task 2 e Task 5 (`redefine primitivo compartilhado`); 2 → Task 5 (`cria token`); 3 → Task 4 e Task 5 (`[cenpre] preenchimento em repouso`); 4 → Task 5 (`hex cru`); 5 → Task 7 (destino inexistente, nome sem destino, aviso sem o scss).
