# UCAMDS Sites — Fatia 2a: pipeline de contratos, folha e catálogo, provado com quatro peças

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contratos em `sites/spec/components/` viram `dist/sites/css/ucam-site.css`, uma área "Sites" no site de docs com lista e página por componente, e o pacote `@ucam/site-css` — provado de ponta a ponta com `button`, `tag`, `icon-chip` e `section-heading`.

**Architecture:** Três scripts novos e pequenos (`validate-sites-spec`, `build-sites-css`, `build-sites-index`) sobre as libs que já existem, com os mesmos portões do UCAMDS e o prefixo `ucam-site-`. Nenhum dos monólitos (`validate-spec`, `build-index`, `build-css`) muda. No site de docs, os três componentes que desenham preview (`demo-painel`, `estados-grade`, `anatomia-diagrama`) ganham um input `raiz` com padrão `ucam`, e as páginas dos sites passam `ucam-site`. A página de componente dos sites é cópia enxuta da do catálogo.

**Tech Stack:** Node 24 ESM com `node:test`, Ajv 2020, Angular 22 + Analog (prerender), DTCG JSON.

**Spec:** `docs/superpowers/specs/2026-10-08-sites-catalogo-design.md` (e, acima dela, `2026-10-08-ds-dos-sites-design.md`).

## Global Constraints

- Byte a byte do UCAMDS: `dist/tokens`, `dist/css`, `dist/fonts`, `site/src/generated/spec.data.json` e `site/src/generated/estados.css` iguais antes e depois (ignorando a linha `$generated`/`gerado` de data).
- `validate-spec.mjs`, `build-index.mjs`, `build-css.mjs` não mudam.
- Prefixos: classes `.ucam-site-*`, variáveis `--ucam-site-*`, seletores de contrato `ucam-site-<id>`. Nunca `.ucam-` sem `site` em `sites/`.
- Só `min-width` em `@media`, e só com os quatro viewports da semântica dos sites.
- Só token semântico dos sites em componente; primitivo é falha. Nenhum `color-mix`/`oklch()` em tempo de execução.
- Contratos no schema `spec/schema/component.schema.json` sem mudança, no perfil de contrato dos sites da spec (seção "O perfil de contrato dos sites").
- Nenhum `trilho_b`, nenhum `eventos` nos contratos dos sites.
- Portão de crases (`check-crases.mjs`) continua verde: nas páginas Angular novas, nada de crase nua dentro do template literal — termo técnico em comentário vai entre aspas.
- Worktree `../DSUCAM-sites` já existe; branch nova `sites-catalogo` a partir da `main`.
- Commits em português, terminados com `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Um contrato dos sites com `selector: "ucam-button"` (sem `site`) deve ser reprovado nomeando o selector esperado. (Task 5.)
2. Um preview em `sites/spec/demos.json` que cite `.ucam-site-btn--outline`, classe que a folha não emite, deve reprovar com o nome da classe. (Task 5.)
3. Um `var(--ucam-site-wine-600)` (primitivo) ou um `var(--ucam-site-color-inventada)` dentro da folha dos sites deve derrubar o `build-sites-css`. (Task 4.)
4. `vs` de mão única entre dois contratos dos sites deve reprovar; e `composicao.usa` citando `ucam-button` (da aplicação) também. (Task 5.)
5. A página `/sites/button` prerenderizada precisa conter `class="ucam-site` no palco e `ucam-site-btn--primary` no preview; `/sites` precisa conter o alternador com `data-marca`. (Task 8.)

---

### Task 0: Branch e linha de base

**Files:** nenhum de código.

- [ ] **Step 1: Branch na worktree existente**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM-sites
git checkout -b sites-catalogo main
git log --oneline -1
pnpm install --frozen-lockfile
```

Expected: `HEAD` na `main` atual (que contém `695566e` e `90ce24d`), install sem erro.

- [ ] **Step 2: Linha de base**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM-sites
S="C:/Users/Leonardo/AppData/Local/Temp/claude/c--Users-Leonardo-Documents-DSUCAM/93a7653e-0a9f-47b1-8132-13d018fd557e/scratchpad"
pnpm run tokens && pnpm run marca && pnpm run fonts && pnpm run icons && pnpm run css && pnpm run ui && pnpm run indice
rm -rf "$S/base2a" && mkdir -p "$S/base2a/generated"
cp -r dist/tokens dist/css dist/fonts "$S/base2a/"
cp site/src/generated/spec.data.json site/src/generated/estados.css "$S/base2a/generated/"
```

Expected: tudo com `✓`; `base2a/` com `tokens`, `css`, `fonts`, `generated`.

- [ ] **Step 3: Comparador**

`$S/compara2a.sh`:

```bash
#!/bin/sh
set -e
S="C:/Users/Leonardo/AppData/Local/Temp/claude/c--Users-Leonardo-Documents-DSUCAM/93a7653e-0a9f-47b1-8132-13d018fd557e/scratchpad"
cd /c/Users/Leonardo/Documents/DSUCAM-sites
for d in tokens css fonts; do
  diff -r -I '"\$generated"' "$S/base2a/$d" "dist/$d" && echo "✓ dist/$d igual"
done
diff -I '"gerado' -I '"\$generated"' "$S/base2a/generated/spec.data.json" site/src/generated/spec.data.json && echo "✓ spec.data.json igual"
diff "$S/base2a/generated/estados.css" site/src/generated/estados.css && echo "✓ estados.css igual"
```

Run: `sh $S/compara2a.sh` → cinco `✓`.

---

### Task 1: `build-estados.mjs` aceita entrada e saída por argumento

**Files:**
- Modify: `tools/build-estados.mjs:55-56` (constantes `ENTRADA`/`SAIDA`) e `:283` (console.log)
- Create: `tools/test/build-estados.test.mjs`

**Interfaces:**
- Produces: `node tools/build-estados.mjs [--entrada <css>] [--saida <css>]`. Sem argumentos, o comportamento de hoje.

- [ ] **Step 1: Teste que falha**

`tools/test/build-estados.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('build-estados espelha a folha que --entrada aponta e escreve em --saida', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ucamds-estados-'));
  const entrada = join(dir, 'x.css');
  const saida = join(dir, 'out', 'x-estados.css');
  writeFileSync(entrada, '.ucam-site-btn--primary:hover { background: red; }\n.ucam-site :focus-visible { outline: 2px solid blue; }\n');
  const out = execFileSync(process.execPath, [join(ROOT, 'tools/build-estados.mjs'), '--entrada', entrada, '--saida', saida], { encoding: 'utf8' });
  const css = readFileSync(saida, 'utf8');
  assert.match(css, /\.ucam-estado\[data-ucam-estado="hover"\] \.ucam-site-btn--primary \{/);
  assert.match(css, /\.ucam-estado\[data-ucam-estado="focus"\] \.ucam-site \.ucam-estado-alvo \{/);
  assert.match(out, /x-estados\.css/);
});

test('build-estados sem argumentos continua lendo dist/css/ucam.css', () => {
  const fonte = readFileSync(join(ROOT, 'tools/build-estados.mjs'), 'utf8');
  assert.match(fonte, /'dist', 'css', 'ucam\.css'/);
  assert.match(fonte, /'site', 'src', 'generated', 'estados\.css'/);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: o primeiro teste falha (o script ignora os argumentos e reclama de `dist/css/ucam.css` ou escreve em `estados.css`).

- [ ] **Step 3: Implementar**

Em `tools/build-estados.mjs`, troque as duas constantes por:

```js
// Entrada e saída por argumento (08/10/2026): os sites espelham a própria
// folha (dist/sites/css/ucam-site.css) em site/src/generated/sites-estados.css
// pelo mesmo gerador. Sem argumento, é a aplicação, como sempre foi.
function argumento(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}
const ENTRADA = argumento('--entrada', join(ROOT, 'dist', 'css', 'ucam.css'));
const SAIDA = argumento('--saida', join(ROOT, 'site', 'src', 'generated', 'estados.css'));
```

E troque `console.log('site/src/generated/estados.css');` por:

```js
console.log(SAIDA.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
```

- [ ] **Step 4: Rodar e ver passar, e o padrão continuar igual**

Run: `pnpm run test:tools && node tools/build-estados.mjs && sh $S/compara2a.sh`
Expected: `# pass 33`; `estados.css igual`.

- [ ] **Step 5: Commit**

```bash
git add tools/build-estados.mjs tools/test/build-estados.test.mjs
git commit -m "build-estados aceita --entrada e --saida; sem argumento, a aplicação como sempre

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Os três componentes de preview ganham `raiz`

**Files:**
- Modify: `site/src/app/docs/demo-painel.component.ts:78` e `:225`
- Modify: `site/src/app/docs/estados-grade.component.ts:48`
- Modify: `site/src/app/docs/anatomia-diagrama.component.ts:61`

**Interfaces:**
- Produces: input `raiz` (string, padrão `'ucam'`) nos três. O invólucro do preview recebe `[class]="raiz()"`.

Sem teste de unidade: o site não tem harness de componente. A prova é o prerender da Task 8 (a página do catálogo da aplicação continua igual, a dos sites recebe `ucam-site`).

- [ ] **Step 1: demo-painel**

Linha 78, de `<div class="ucam" [innerHTML]="html()"></div>` para:

```html
<div [class]="raiz()" [innerHTML]="html()"></div>
```

Linha 225, de `.painel-corpo.palco > .ucam {` para `.painel-corpo.palco > :first-child {`.

Na classe, junto dos outros inputs, acrescente:

```ts
  /** Classe-raiz que escopa a folha do preview: `ucam` (aplicação) ou `ucam-site` (sites). */
  readonly raiz = input<string>('ucam');
```

- [ ] **Step 2: estados-grade**

Linha 48, de `<div class="ucam" [innerHTML]="html()" inert></div>` para:

```html
<div [class]="raiz()" [innerHTML]="html()" inert></div>
```

E o mesmo input `raiz` na classe.

- [ ] **Step 3: anatomia-diagrama**

Linha 61, de `<div class="ucam anatomia-peca" #peca [innerHTML]="html()" inert></div>` para:

```html
<div [class]="raiz() + ' anatomia-peca'" #peca [innerHTML]="html()" inert></div>
```

E o mesmo input `raiz`.

- [ ] **Step 4: Conferir que compila e que nada mudou no catálogo**

Run: `pnpm run validate` (roda `check-crases`) e `pnpm --dir site exec tsc -p tsconfig.app.json --noEmit 2>&1 | tail -5`
Expected: sem erro.

- [ ] **Step 5: Commit**

```bash
git add site/src/app/docs/demo-painel.component.ts site/src/app/docs/estados-grade.component.ts site/src/app/docs/anatomia-diagrama.component.ts
git commit -m "Painel, grade de estados e diagrama de anatomia aceitam a classe-raiz do preview

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Quatro contratos, as demos e quatro tokens a mais

**Files:**
- Modify: `sites/spec/tokens/semantic.json` (quatro tokens)
- Create: `sites/spec/components/button.json`, `tag.json`, `icon-chip.json`, `section-heading.json`
- Create: `sites/spec/demos.json`

Arquivos de spec, sem teste próprio: quem os julga é o validador da Task 5 e a folha da Task 4.

- [ ] **Step 1: Tokens a mais na semântica**

Em `sites/spec/tokens/semantic.json`, dentro de `color.interaction`, acrescente:

```json
      "hover-on-inverse": { "$value": "{alpha.paper-weak}", "$description": "Hover de botão fantasma e de tag sobre seção escura: lavagem de papel, não de tinta." },
      "active-on-inverse": { "$value": "{alpha.paper-strong}" }
```

E dentro de `size`, depois de `avatar`:

```json
    "icon-chip-md": { "$value": "2.5rem", "$description": "40px: a pastilha de ícone ao lado de um título de item." },
    "icon-chip-lg": { "$value": "3.5rem", "$description": "56px: a pastilha de um bloco de destaque (Por que escolher a UCAM, os quatro passos do CENPRE)." }
```

Run: `node tools/build-sites-tokens.mjs | tail -1` → `✓`.

- [ ] **Step 2: `sites/spec/components/button.json`**

```json
{
  "$schema": "../../../spec/schema/component.schema.json",
  "id": "button",
  "name": "Button",
  "selector": "ucam-site-button",
  "status": "draft",
  "version": "0.1.0",
  "since": "0.1.6",
  "category": "acao",
  "description": "A ação de um site: inscrever-se, ver vagas, acessar a plataforma. Três pesos, dois tamanhos, e a forma de link quando leva a outra página.",
  "quando_usar": [
    "A chamada principal de uma seção ou do hero: uma por bloco, no peso primário.",
    "A alternativa ao lado dela — ver mais, conhecer o curso — no peso secundário.",
    "Um link que precisa de área de toque e peso de ação dentro de um cartão ou de uma lista de vagas."
  ],
  "evidencia": {
    "origem": "candidomendes.edu.br e cenpre.candidomendes.edu.br, lidos em 08/10/2026",
    "ocorrencias": [
      { "tela": "www — faixa superior e menu", "rotulo": "INSCREVA-SE / Matricule-se Agora!", "problema": "três estilos de botão na mesma página — Angular Material, Bootstrap e o do CENPRE —, um deles em caixa alta com ponto de exclamação" },
      { "tela": "www — cartão de curso", "rotulo": "Saiba mais", "problema": "rótulo genérico que não diz o que acontece ao clicar" },
      { "tela": "cenpre — painel de vagas", "rotulo": "Tenho interesse", "problema": "botão de 36px de altura num cartão tocado no telefone; abaixo do alvo mínimo" },
      { "tela": "cenpre — hero", "rotulo": "Ver oportunidades / Acessar plataforma", "problema": "nenhum: é o par primário + secundário que este contrato formaliza" }
    ],
    "conclusao": "Os sites têm o botão certo em um lugar e três errados nos outros. O contrato fixa o par primário + secundário, o alvo de 44px e o rótulo que diz o verbo."
  },
  "anatomia": [
    { "parte": "root", "obrigatorio": true, "descricao": "<button> quando dispara algo na página; <a> quando leva a outra página. A classe é a mesma." },
    { "parte": "label", "obrigatorio": true, "descricao": "O rótulo. Verbo no imperativo, sem caixa alta, sem exclamação." },
    { "parte": "icon", "obrigatorio": false, "descricao": "Ícone antes ou depois do rótulo, decorativo. Seta para a direita só quando leva para fora da página.", "classe": "ucam-site-btn__icon" }
  ],
  "props": [
    {
      "nome": "variant",
      "tipo": "'primary' | 'secondary' | 'ghost'",
      "default": "'primary'",
      "descricao": "O peso. Um primário por bloco; o resto é secundário ou fantasma.",
      "valores": {
        "primary": { "uso": "A ação que a seção existe para pedir: inscrever-se, ver as vagas.", "limite": "Um por bloco visual. Dois primários lado a lado é uma decisão que o site não tomou.", "classe": ".ucam-site-btn--primary" },
        "secondary": { "uso": "A alternativa ao lado do primário, ou a ação de um cartão.", "classe": ".ucam-site-btn--secondary" },
        "ghost": { "uso": "Ação de baixo peso numa fileira de cartões ou dentro de texto: ver todas, voltar.", "limite": "Não como única ação de uma seção: sem borda nem fundo ele some entre parágrafos.", "classe": ".ucam-site-btn--ghost" }
      }
    },
    {
      "nome": "size",
      "tipo": "'md' | 'lg'",
      "default": "'md'",
      "descricao": "44px ou 52px de altura.",
      "valores": {
        "md": { "uso": "Em cartão, lista, formulário e rodapé. 44px é também o alvo mínimo de toque." },
        "lg": { "uso": "No hero e na CTA final, onde o botão é a maior peça do bloco.", "limite": "Nunca dentro de cartão: o botão fica maior que o título.", "classe": ".ucam-site-btn--lg" }
      }
    },
    {
      "nome": "inverse",
      "tipo": "boolean",
      "default": "false",
      "descricao": "Sobre seção escura (hero com foto, rodapé, CTA). O primário vira branco com texto escuro; o secundário ganha borda clara; o fantasma lê em branco.",
      "valores": {
        "true": { "uso": "Dentro de .ucam-site-inverso ou de qualquer bloco com color.surface.inverse.", "limite": "Não misturar: um botão inverso sobre fundo claro é um retângulo branco sem borda.", "classe": ".ucam-site-btn--inverse" }
      }
    },
    { "nome": "href", "tipo": "string | null", "default": "null", "descricao": "Com href, a raiz é <a>. Sem, é <button type=\"button\">." },
    { "nome": "disabled", "tipo": "boolean", "default": "false", "descricao": "Raro num site. Quando existe, o motivo está escrito ao lado." }
  ],
  "estados": ["hover", "active", "focus-visible", "disabled"],
  "limites": {
    "regras": [
      "Não usar para navegação do menu: item de menu é link de texto.",
      "Não usar caixa alta no rótulo: o peso vem do fundo, não das maiúsculas.",
      "Não usar <a> sem href nem <button> para ir a outra página — leitor de tela anuncia o papel errado."
    ],
    "motivo": "O site institucional tinha INSCREVA-SE em caixa alta e três famílias de botão na mesma página. O contrato existe para que o botão seja um só, e para que o papel no DOM diga a verdade."
  },
  "acessibilidade": {
    "papel": "button (ou link, com href)",
    "requisitos": [
      "Alvo de toque de 44px no mínimo, nos dois tamanhos (WCAG 2.5.8).",
      "Rótulo visível é o nome acessível. Ícone sozinho exige aria-label.",
      "Anel de foco cinza de 2px com 2px de folga sobre fundo claro; degrau próprio sobre seção escura (3:1 contra o fundo).",
      "Contraste do rótulo sobre o preenchimento de 4,5:1 nos três estados, na base e na submarca — medido por tools/build-sites-tokens.mjs.",
      "Desabilitado não some: fica a 4,5:1 sobre o próprio fundo e com cursor not-allowed."
    ],
    "criterios_wcag": ["1.4.3", "1.4.11", "2.4.7", "2.5.8", "4.1.2"],
    "teclado": [
      { "tecla": "Enter / Espaço", "comportamento": "Aciona. Em <a>, só Enter." },
      { "tecla": "Tab", "comportamento": "Foco na ordem do documento. Botão desabilitado sai da ordem." }
    ]
  },
  "conteudo": {
    "rotulo": {
      "bom": ["Ver vagas", "Inscreva-se", "Acessar plataforma", "Conhecer o curso"],
      "ruim": ["Clique aqui", "SAIBA MAIS!!!", "INSCREVA-SE", "Enviar formulário de contato agora"]
    },
    "regras": [
      "Verbo no imperativo mais o objeto: duas a três palavras.",
      "Sem ponto final, sem exclamação, sem caixa alta.",
      "O rótulo diz o que acontece, não o que o usuário deve fazer com o mouse."
    ]
  },
  "composicao": {
    "usada_por": ["ucam-site-section-heading"]
  },
  "migracao": {
    "de": "cenpre-ui-kit",
    "mapa": [
      { "legado": "<app-button variant=\"primary\">", "novo": ".ucam-site-btn.ucam-site-btn--primary" },
      { "legado": "<app-button variant=\"secondary\">", "novo": ".ucam-site-btn.ucam-site-btn--secondary" },
      { "legado": "<app-button variant=\"ghost\">", "novo": ".ucam-site-btn.ucam-site-btn--ghost" },
      { "legado": "$color-brand no fundo do botão", "novo": "color.action.primary.default", "nota": "Um degrau mais escuro no CENPRE (magenta.800, ADR-068)." }
    ]
  },
  "exemplos": [
    { "titulo": "Par do hero", "codigo": "<a class=\"ucam-site-btn ucam-site-btn--primary ucam-site-btn--lg\" href=\"/vagas\">Ver oportunidades</a>\n<a class=\"ucam-site-btn ucam-site-btn--secondary ucam-site-btn--lg\" href=\"https://plataforma.exemplo\">Acessar plataforma</a>" },
    { "titulo": "Ação de cartão", "codigo": "<button type=\"button\" class=\"ucam-site-btn ucam-site-btn--secondary\">Tenho interesse</button>" },
    { "titulo": "Sobre seção escura", "codigo": "<div class=\"ucam-site-inverso\">\n  <a class=\"ucam-site-btn ucam-site-btn--primary ucam-site-btn--inverse\" href=\"/inscricao\">Inscreva-se</a>\n</div>" }
  ],
  "boas_praticas": [
    { "faca": "Um primário por bloco, com o secundário ao lado quando há alternativa.", "evite": "Dois primários na mesma fileira.", "porque": "Dois botões iguais em peso dizem que o site não sabe o que quer que a pessoa faça." },
    { "faca": "<a> com href para ir a outra página; <button> para agir nesta.", "evite": "<a href=\"#\"> com onclick, ou <button> que navega.", "porque": "O papel é o que o leitor de tela anuncia e o que o botão direito do mouse oferece." },
    { "faca": "Rótulo com o verbo e o objeto: Ver vagas.", "evite": "Clique aqui, Saiba mais.", "porque": "Fora de contexto — numa lista de links do leitor de tela — Saiba mais não diz sobre o quê." }
  ],
  "vs": [
    { "componente": "tag", "diferenca": "Button age; Tag classifica. A tag tem o formato de pílula e nunca recebe clique.", "escolha": "Se o texto é um verbo, é botão. Se é uma categoria, é tag." }
  ],
  "implementacao": {
    "trilho_a": {
      "contrato": "Uma classe na raiz, variante e tamanho por modificador. Funciona em <a> e em <button> sem mudar nada.",
      "raiz": ".ucam-site-btn",
      "variaveis": ["--ucam-site-color-action-primary-default", "--ucam-site-color-action-primary-hover", "--ucam-site-color-action-primary-active", "--ucam-site-color-action-secondary-border", "--ucam-site-size-control-md", "--ucam-site-size-control-lg", "--ucam-site-radius-control"],
      "nota": "O inverso lê a lavagem de papel (color.interaction.hover-on-inverse) para o hover do fantasma e do secundário sobre fundo escuro."
    }
  }
}
```

- [ ] **Step 3: `sites/spec/components/tag.json`**

```json
{
  "$schema": "../../../spec/schema/component.schema.json",
  "id": "tag",
  "name": "Tag",
  "selector": "ucam-site-tag",
  "status": "draft",
  "version": "0.1.0",
  "since": "0.1.6",
  "category": "conteudo",
  "description": "Uma palavra que classifica: a modalidade do curso, a área da vaga, a série de um evento. Pílula pequena, nunca clicável.",
  "quando_usar": [
    "Modalidade e turno no cartão de curso: EAD, Presencial, Noturno.",
    "Área e tipo no cartão de vaga: Estágio, Direito, Remoto.",
    "A série de um conteúdo da biblioteca: Orienta Candido."
  ],
  "evidencia": {
    "origem": "candidomendes.edu.br e cenpre-ui-kit (projects/cenpre-ui-kit/src/lib/ui/tag), 08/10/2026",
    "ocorrencias": [
      { "tela": "www — cartões de curso", "rotulo": "Graduação / EAD", "problema": "a modalidade aparece como texto solto no mesmo peso do título" },
      { "tela": "cenpre — painel de vagas", "rotulo": "Estágio", "problema": "nenhum: a tag do kit é o ponto de partida" },
      { "tela": "cenpre — biblioteca", "rotulo": "Orienta Candido", "problema": "tag de série em azul inventado ($color-info-700), fora de qualquer paleta" }
    ],
    "conclusao": "A tag existe para a modalidade e a área lerem como metadado, não como título. O tom info sai do azul avulso e entra na paleta de feedback compartilhada."
  },
  "anatomia": [
    { "parte": "root", "obrigatorio": true, "descricao": "<span>. Pílula com fundo suave e texto na tinta do tom." },
    { "parte": "label", "obrigatorio": true, "descricao": "Uma ou duas palavras, substantivo." }
  ],
  "props": [
    {
      "nome": "tone",
      "tipo": "'neutral' | 'brand' | 'info' | 'inverse'",
      "default": "'neutral'",
      "descricao": "A tinta. Neutro é o padrão; marca para o que a instituição destaca; info para série ou evento; inverso sobre seção escura.",
      "valores": {
        "neutral": { "uso": "Modalidade, turno, área: metadado comum." },
        "brand": { "uso": "O que a instituição quer que salte: Novo curso, Vagas abertas.", "limite": "Uma por cartão. Três tags de marca no mesmo cartão é uma faixa, não uma classificação.", "classe": ".ucam-site-tag--brand" },
        "info": { "uso": "Série editorial ou evento: Orienta Candido, Semana Jurídica.", "classe": ".ucam-site-tag--info" },
        "inverse": { "uso": "Sobre hero ou rodapé escuros.", "classe": ".ucam-site-tag--inverse" }
      }
    }
  ],
  "estados": ["default"],
  "limites": {
    "regras": [
      "Não é botão nem filtro: se o clique filtra a lista, é um botão secundário com aria-pressed.",
      "Não carrega estado do sistema (aprovado, pendente): isso é selo da aplicação, não tag de site.",
      "No máximo três por cartão."
    ],
    "motivo": "Tag que recebe clique vira controle sem papel, foco nem tecla. Tag que carrega estado precisa de ícone e texto, e esse componente é outro."
  },
  "acessibilidade": {
    "requisitos": [
      "Texto a 4,5:1 sobre o fundo da pílula, nos quatro tons (medido).",
      "A cor nunca é o único portador: o texto da tag é a classificação inteira.",
      "Não é foco nem alvo: nenhum tabindex, nenhum role.",
      "Num cartão que é link, a tag fica dentro do link como texto comum."
    ],
    "criterios_wcag": ["1.4.1", "1.4.3"]
  },
  "conteudo": {
    "rotulo": {
      "bom": ["EAD", "Presencial", "Estágio", "Orienta Candido"],
      "ruim": ["Clique para filtrar", "NOVO!!!", "Curso de graduação presencial noturno"]
    },
    "regras": [
      "Uma ou duas palavras, substantivo ou sigla, sem ponto.",
      "Caixa normal: a pílula já destaca; maiúsculas gritariam.",
      "Sem verbo: tag classifica, não pede."
    ]
  },
  "migracao": {
    "de": "cenpre-ui-kit",
    "mapa": [
      { "legado": "<app-tag>", "novo": ".ucam-site-tag" },
      { "legado": "$color-info-700 na tag de série", "novo": "color.feedback.info.foreground", "nota": "O azul avulso do kit vira o info compartilhado." }
    ]
  },
  "exemplos": [
    { "titulo": "Modalidade no cartão de curso", "codigo": "<span class=\"ucam-site-tag\">EAD</span>\n<span class=\"ucam-site-tag\">Noturno</span>" },
    { "titulo": "Destaque e série", "codigo": "<span class=\"ucam-site-tag ucam-site-tag--brand\">Vagas abertas</span>\n<span class=\"ucam-site-tag ucam-site-tag--info\">Orienta Candido</span>" }
  ],
  "boas_praticas": [
    { "faca": "Até três tags por cartão, neutras por padrão.", "evite": "Uma fileira de seis tags coloridas.", "porque": "Depois da terceira, a classificação vira ruído e o título perde." },
    { "faca": "Botão com aria-pressed para filtrar.", "evite": "Tag com (click).", "porque": "Filtro é controle; tag é texto." }
  ],
  "vs": [
    { "componente": "button", "diferenca": "Tag classifica; Button age. A tag nunca recebe clique.", "escolha": "Substantivo é tag; verbo é botão." },
    { "componente": "icon-chip", "diferenca": "As duas são pastilhas, mas a Tag carrega uma PALAVRA e o IconChip carrega um ÍCONE decorativo ao lado de um texto que está fora dele.", "escolha": "Se a informação está dentro da pastilha, é tag; se a pastilha só acompanha um título, é icon-chip." }
  ],
  "implementacao": {
    "trilho_a": {
      "contrato": "Uma classe na raiz, tom por modificador.",
      "raiz": ".ucam-site-tag",
      "variaveis": ["--ucam-site-color-surface-sunken", "--ucam-site-color-surface-brand-soft", "--ucam-site-color-feedback-info-background", "--ucam-site-radius-pill"]
    }
  }
}
```

- [ ] **Step 4: `sites/spec/components/icon-chip.json`**

```json
{
  "$schema": "../../../spec/schema/component.schema.json",
  "id": "icon-chip",
  "name": "IconChip",
  "selector": "ucam-site-icon-chip",
  "status": "draft",
  "version": "0.1.0",
  "since": "0.1.6",
  "category": "conteudo",
  "description": "A pastilha de ícone ao lado de um título: os quatro passos do CENPRE, os quatro motivos para escolher a UCAM. Decorativa sempre; o texto ao lado é quem fala.",
  "quando_usar": [
    "Uma fileira de três ou quatro blocos de destaque com título e frase, cada um com um símbolo.",
    "Um passo numerado ou simbolizado numa lista de como começar.",
    "O item de uma lista de benefícios dentro de um cartão."
  ],
  "evidencia": {
    "origem": "candidomendes.edu.br e cenpre-ui-kit (styles/components/_icon-chip.scss), 08/10/2026",
    "ocorrencias": [
      { "tela": "www — Por que devo escolher estudar na UCAM?", "problema": "quatro blocos com ícone de bitmap, cada um de um tamanho" },
      { "tela": "cenpre — Plataforma CENPRE Carreiras em quatro passos", "problema": "nenhum: o icon-chip do kit é o ponto de partida" }
    ],
    "conclusao": "Um tamanho por papel e um tom por superfície. O ícone vem do sprite compartilhado, nunca de bitmap."
  },
  "anatomia": [
    { "parte": "root", "obrigatorio": true, "descricao": "<span aria-hidden=\"true\">. Quadrado com canto do controle, fundo suave e ícone na tinta." },
    { "parte": "icon", "obrigatorio": true, "descricao": "<svg class=\"ic\"><use href=\"#i-…\"/></svg>, do sprite do sistema. 20px no md, 24 no lg." }
  ],
  "props": [
    {
      "nome": "icon",
      "tipo": "string",
      "obrigatorio": true,
      "descricao": "Nome do ícone no sprite (briefcase, graduationCap, mapPin…)."
    },
    {
      "nome": "size",
      "tipo": "'md' | 'lg'",
      "default": "'md'",
      "descricao": "40px ou 56px.",
      "valores": {
        "md": { "uso": "Ao lado do título de um item de lista ou dentro de um cartão." },
        "lg": { "uso": "No bloco de destaque de uma seção, acima do título.", "limite": "Não em lista: 56px por item empurra o texto para baixo.", "classe": ".ucam-site-icon-chip--lg" }
      }
    },
    {
      "nome": "tone",
      "tipo": "'brand' | 'neutral' | 'inverse'",
      "default": "'brand'",
      "descricao": "Lavagem de marca por padrão; neutro quando a fileira já tem cor demais; inverso sobre seção escura.",
      "valores": {
        "brand": { "uso": "O padrão numa seção clara." },
        "neutral": { "uso": "Dentro de um cartão que já tem tag de marca, ou numa lista longa.", "classe": ".ucam-site-icon-chip--neutral" },
        "inverse": { "uso": "Sobre hero ou CTA escuros.", "classe": ".ucam-site-icon-chip--inverse" }
      }
    }
  ],
  "estados": ["default"],
  "limites": {
    "regras": [
      "Não para pessoa: pessoa é avatar.",
      "Não para estado (sucesso, erro): isso é o ícone do selo da aplicação.",
      "Não clicável. Se o bloco inteiro é link, o link é o bloco, não a pastilha."
    ],
    "motivo": "A pastilha é decoração ao lado de um texto. Quando passa a carregar informação própria — quem, qual estado — virou outro componente."
  },
  "acessibilidade": {
    "requisitos": [
      "Sempre aria-hidden: o título ao lado é o nome.",
      "O traço do ícone a 3:1 sobre o fundo da pastilha (WCAG 1.4.11), nos três tons — medido.",
      "Sem foco, sem papel."
    ],
    "criterios_wcag": ["1.1.1", "1.4.11"]
  },
  "conteudo": {
    "regras": [
      "O ícone reforça o título; não o substitui.",
      "Mesmo ícone para o mesmo conceito em todo o site: estágio é briefcase, curso é graduationCap, campus é mapPin.",
      "Um símbolo só por pastilha."
    ]
  },
  "migracao": {
    "de": "cenpre-ui-kit",
    "mapa": [
      { "legado": ".icon-chip", "novo": ".ucam-site-icon-chip" },
      { "legado": ".icon-chip--lg", "novo": ".ucam-site-icon-chip--lg" }
    ]
  },
  "exemplos": [
    { "titulo": "Bloco de destaque", "codigo": "<span class=\"ucam-site-icon-chip ucam-site-icon-chip--lg\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-briefcase\"/></svg></span>\n<h3>Orientação de estágio</h3>" },
    { "titulo": "Item de lista", "codigo": "<span class=\"ucam-site-icon-chip ucam-site-icon-chip--neutral\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-mapPin\"/></svg></span>\n<span>Campus Centro</span>" }
  ],
  "boas_praticas": [
    { "faca": "Um ícone por conceito, o mesmo em todo o site.", "evite": "Três ícones diferentes para curso em três páginas.", "porque": "O símbolo só ajuda quando se repete." },
    { "faca": "Pastilha decorativa, título ao lado.", "evite": "Pastilha com tooltip explicando o ícone.", "porque": "Se o ícone precisa de legenda, a legenda é o título." }
  ],
  "vs": [
    { "componente": "tag", "diferenca": "O IconChip carrega um ícone decorativo e acompanha um texto que está fora dele; a Tag carrega a própria palavra.", "escolha": "Informação dentro da pastilha é tag; símbolo ao lado de um título é icon-chip." }
  ],
  "implementacao": {
    "trilho_a": {
      "contrato": "Uma classe na raiz, tamanho e tom por modificador. O <svg class=\"ic\"> de dentro recebe o degrau do papel pela folha.",
      "raiz": ".ucam-site-icon-chip",
      "variaveis": ["--ucam-site-size-icon-chip-md", "--ucam-site-size-icon-chip-lg", "--ucam-site-size-icon-md", "--ucam-site-size-icon-lg", "--ucam-site-color-surface-brand-soft"]
    }
  }
}
```

- [ ] **Step 5: `sites/spec/components/section-heading.json`**

```json
{
  "$schema": "../../../spec/schema/component.schema.json",
  "id": "section-heading",
  "name": "SectionHeading",
  "selector": "ucam-site-section-heading",
  "status": "draft",
  "version": "0.1.0",
  "since": "0.1.6",
  "category": "layout",
  "description": "O cabeçalho de uma seção de página: a palavra acima, o título em display e a frase de abertura, com as ações ao lado quando a seção tem um 'ver todas'.",
  "quando_usar": [
    "No topo de toda seção da home e das páginas internas: Encontre o seu curso, O CENPRE em números, Como ingressar.",
    "Centralizado quando a seção é uma faixa de largura inteira; alinhado à esquerda quando há conteúdo em colunas abaixo.",
    "Com ações quando a seção é um recorte de uma lista maior."
  ],
  "evidencia": {
    "origem": "candidomendes.edu.br e cenpre-ui-kit (styles/components/_section-heading.scss), 08/10/2026",
    "ocorrencias": [
      { "tela": "www — home", "rotulo": "Encontre o seu curso / Vale a pena ser UCAM / Como ingressar?", "problema": "três tamanhos de título em três seções seguidas, um deles em Roboto e os outros em Work Sans" },
      { "tela": "cenpre — home", "rotulo": "O CENPRE em números", "problema": "nenhum: o section-heading do kit é o ponto de partida, com eyebrow, título e lede" }
    ],
    "conclusao": "Um cabeçalho de seção com uma escala só, em Work Sans, e a frase de abertura em Inter. O que varia é o alinhamento e o tamanho, não a fonte."
  },
  "anatomia": [
    { "parte": "root", "obrigatorio": true, "descricao": "<header> ou <div>. Pilha com vão curto; largura de prosa." },
    { "parte": "eyebrow", "obrigatorio": false, "descricao": "<p> com a palavra acima do título, em caixa alta pela folha. Não é heading.", "classe": "ucam-site-section-heading__eyebrow" },
    { "parte": "title", "obrigatorio": true, "descricao": "<h2> (ou o nível que a página pede) em display.", "classe": "ucam-site-section-heading__title" },
    { "parte": "lede", "obrigatorio": false, "descricao": "<p> de uma ou duas frases, em Inter 18px.", "classe": "ucam-site-section-heading__lede" },
    { "parte": "acoes", "obrigatorio": false, "descricao": "Fileira de botões: ver todas, inscrever-se.", "classe": "ucam-site-section-heading__acoes" }
  ],
  "props": [
    {
      "nome": "align",
      "tipo": "'start' | 'center'",
      "default": "'start'",
      "descricao": "Alinhamento do bloco.",
      "valores": {
        "start": { "uso": "Seção com conteúdo em colunas abaixo: a borda esquerda do título alinha com a primeira coluna." },
        "center": { "uso": "Faixa de largura inteira: números, depoimentos, CTA.", "limite": "Com lede de mais de duas linhas, centralizar deixa as linhas desiguais e difíceis de ler.", "classe": ".ucam-site-section-heading--center" }
      }
    },
    {
      "nome": "size",
      "tipo": "'section' | 'section-sm'",
      "default": "'section'",
      "descricao": "32–52px ou 30–48px, em clamp().",
      "valores": {
        "section": { "uso": "Seção principal da página." },
        "section-sm": { "uso": "Seção secundária, ou seção dentro de uma coluna.", "classe": ".ucam-site-section-heading--sm" }
      }
    },
    {
      "nome": "inverse",
      "tipo": "boolean",
      "default": "false",
      "descricao": "Sobre seção escura: título em branco, lede e eyebrow no apoio claro.",
      "valores": {
        "true": { "uso": "Dentro de .ucam-site-inverso.", "classe": ".ucam-site-section-heading--inverse" }
      }
    },
    { "nome": "level", "tipo": "2 | 3", "default": "2", "descricao": "O nível do heading. Dois por padrão; três quando a seção está dentro de outra." }
  ],
  "estados": ["default"],
  "limites": {
    "regras": [
      "Não é o hero: o hero tem o h1 e a foto; este é h2 em diante.",
      "Sem ícone no título.",
      "Eyebrow não é heading: nunca <h3> acima do <h2>."
    ],
    "motivo": "A ordem dos headings é a navegação de quem usa leitor de tela. Um h3 acima do h2 e dois h1 na página quebram essa ordem sem que nada avise."
  },
  "acessibilidade": {
    "requisitos": [
      "Um h1 por página, no hero. Toda seção começa em h2; subseção em h3. Sem pular nível.",
      "O eyebrow é <p>, com caixa alta pela folha (text-transform), não digitada — o leitor de tela lê a palavra, não as letras.",
      "O lede fica na largura de prosa (51,25rem) para a linha não passar de 75 caracteres.",
      "Título a 4,5:1 sobre a superfície, no claro e no inverso — medido."
    ],
    "criterios_wcag": ["1.3.1", "1.4.3", "2.4.6"]
  },
  "conteudo": {
    "eyebrow": { "bom": ["Cursos", "Carreiras", "Como ingressar"], "ruim": ["Conheça agora", "SEÇÃO 3", "Bem-vindo"] },
    "titulo": { "bom": ["Encontre o seu curso", "O CENPRE em números", "Como ingressar"], "ruim": ["Conheça agora mesmo todas as nossas incríveis vantagens!", "Por que devo escolher estudar na UCAM??"] },
    "regras": [
      "Eyebrow: uma a três palavras, substantivo.",
      "Título: até oito palavras, sem ponto final, uma exclamação ou interrogação no máximo.",
      "Lede: uma ou duas frases que dizem o que a seção mostra, não que ela é incrível."
    ]
  },
  "composicao": {
    "usa": ["ucam-site-button"]
  },
  "migracao": {
    "de": "cenpre-ui-kit",
    "mapa": [
      { "legado": ".section-heading", "novo": ".ucam-site-section-heading" },
      { "legado": ".section-heading__eyebrow", "novo": ".ucam-site-section-heading__eyebrow" },
      { "legado": "@include display-heading($fs-display-section)", "novo": "typography.display-section", "nota": "A mixin vira o token composto; a escala em clamp() é a mesma." }
    ]
  },
  "exemplos": [
    { "titulo": "Seção com ações", "codigo": "<header class=\"ucam-site-section-heading\">\n  <p class=\"ucam-site-section-heading__eyebrow\">Carreiras</p>\n  <h2 class=\"ucam-site-section-heading__title\">Vagas e oportunidades</h2>\n  <p class=\"ucam-site-section-heading__lede\">As vagas de estágio e emprego abertas às alunas e aos alunos da UCAM esta semana.</p>\n  <div class=\"ucam-site-section-heading__acoes\"><a class=\"ucam-site-btn ucam-site-btn--secondary\" href=\"/vagas\">Ver todas</a></div>\n</header>" },
    { "titulo": "Faixa centralizada", "codigo": "<header class=\"ucam-site-section-heading ucam-site-section-heading--center\">\n  <h2 class=\"ucam-site-section-heading__title\">O CENPRE em números</h2>\n</header>" }
  ],
  "boas_praticas": [
    { "faca": "Alinhar à esquerda quando há colunas abaixo.", "evite": "Centralizar tudo.", "porque": "Centralizado, o título flutua e a primeira coluna começa fora do eixo dele." },
    { "faca": "Lede que diz o que a seção mostra.", "evite": "Lede de adjetivos.", "porque": "Incrível, moderno e inovador não dizem o que está abaixo." }
  ],
  "implementacao": {
    "trilho_a": {
      "contrato": "Uma classe na raiz, uma por parte; alinhamento, tamanho e inverso por modificador.",
      "raiz": ".ucam-site-section-heading",
      "variaveis": ["--ucam-site-typography-display-section-font-size", "--ucam-site-typography-display-section-sm-font-size", "--ucam-site-typography-eyebrow-font-size", "--ucam-site-typography-lede-font-size", "--ucam-site-container-prosa"]
    }
  }
}
```

- [ ] **Step 6: `sites/spec/demos.json`**

```json
{
  "$description": "Demos dos componentes dos sites. Mesmo formato de spec/demos.json. Até o subprojeto 3, preview e codigo são o MESMO HTML do Trilho A: é o que o WordPress e o www copiam.",
  "demos": {
    "button": {
      "instalacao": "<link rel=\"stylesheet\" href=\"node_modules/@ucam/site-css/css/ucam-site.css\">",
      "importacao": "@use 'node_modules/@ucam/site-css/tokens/ucam-site-tokens' as site;",
      "principal": {
        "preview": "<div style='display:flex;flex-wrap:wrap;gap:.75rem;align-items:center'><a class='ucam-site-btn ucam-site-btn--primary' href='#'>Ver oportunidades</a><a class='ucam-site-btn ucam-site-btn--secondary' href='#'>Acessar plataforma</a><button type='button' class='ucam-site-btn ucam-site-btn--ghost'>Ver todas <svg class='ic' aria-hidden='true'><use href='#i-arrowRight'/></svg></button></div>",
        "codigo": "<a class=\"ucam-site-btn ucam-site-btn--primary\" href=\"/vagas\">Ver oportunidades</a>\n<a class=\"ucam-site-btn ucam-site-btn--secondary\" href=\"https://plataforma.exemplo\">Acessar plataforma</a>\n<button type=\"button\" class=\"ucam-site-btn ucam-site-btn--ghost\">Ver todas <svg class=\"ic\" aria-hidden=\"true\"><use href=\"#i-arrowRight\"/></svg></button>"
      },
      "exemplos": [
        {
          "titulo": "Tamanho grande, no hero",
          "descricao": "52px de altura para a maior peça do bloco. Um primário, um secundário.",
          "preview": "<div style='display:flex;flex-wrap:wrap;gap:.75rem'><a class='ucam-site-btn ucam-site-btn--primary ucam-site-btn--lg' href='#'>Inscreva-se</a><a class='ucam-site-btn ucam-site-btn--secondary ucam-site-btn--lg' href='#'>Conhecer os cursos</a></div>",
          "codigo": "<a class=\"ucam-site-btn ucam-site-btn--primary ucam-site-btn--lg\" href=\"/inscricao\">Inscreva-se</a>\n<a class=\"ucam-site-btn ucam-site-btn--secondary ucam-site-btn--lg\" href=\"/cursos\">Conhecer os cursos</a>"
        },
        {
          "titulo": "Sobre seção escura",
          "descricao": "Os três pesos lendo sobre color.surface.inverse.",
          "preview": "<div class='ucam-site-inverso' style='display:flex;flex-wrap:wrap;gap:.75rem;padding:1.5rem;border-radius:.5rem'><a class='ucam-site-btn ucam-site-btn--primary ucam-site-btn--inverse' href='#'>Inscreva-se</a><a class='ucam-site-btn ucam-site-btn--secondary ucam-site-btn--inverse' href='#'>Fale conosco</a><button type='button' class='ucam-site-btn ucam-site-btn--ghost ucam-site-btn--inverse'>Ver todas</button></div>",
          "codigo": "<div class=\"ucam-site-inverso\">\n  <a class=\"ucam-site-btn ucam-site-btn--primary ucam-site-btn--inverse\" href=\"/inscricao\">Inscreva-se</a>\n  <a class=\"ucam-site-btn ucam-site-btn--secondary ucam-site-btn--inverse\" href=\"/contato\">Fale conosco</a>\n</div>"
        },
        {
          "titulo": "Desabilitado",
          "descricao": "Raro num site. Quando existe, o motivo está escrito ao lado.",
          "preview": "<div style='display:flex;gap:.75rem;align-items:center'><button type='button' class='ucam-site-btn ucam-site-btn--primary' disabled>Enviar</button><span class='ucam-site-muted'>Inscrições abrem em 3 de novembro.</span></div>",
          "codigo": "<button type=\"button\" class=\"ucam-site-btn ucam-site-btn--primary\" disabled>Enviar</button>\n<span class=\"ucam-site-muted\">Inscrições abrem em 3 de novembro.</span>"
        }
      ]
    },
    "tag": {
      "instalacao": "<link rel=\"stylesheet\" href=\"node_modules/@ucam/site-css/css/ucam-site.css\">",
      "principal": {
        "preview": "<div style='display:flex;flex-wrap:wrap;gap:.5rem;align-items:center'><span class='ucam-site-tag'>EAD</span><span class='ucam-site-tag'>Noturno</span><span class='ucam-site-tag ucam-site-tag--brand'>Vagas abertas</span><span class='ucam-site-tag ucam-site-tag--info'>Orienta Candido</span></div>",
        "codigo": "<span class=\"ucam-site-tag\">EAD</span>\n<span class=\"ucam-site-tag\">Noturno</span>\n<span class=\"ucam-site-tag ucam-site-tag--brand\">Vagas abertas</span>\n<span class=\"ucam-site-tag ucam-site-tag--info\">Orienta Candido</span>"
      },
      "exemplos": [
        {
          "titulo": "Sobre seção escura",
          "preview": "<div class='ucam-site-inverso' style='display:flex;gap:.5rem;padding:1.25rem;border-radius:.5rem'><span class='ucam-site-tag ucam-site-tag--inverse'>Estágio</span><span class='ucam-site-tag ucam-site-tag--inverse'>Remoto</span></div>",
          "codigo": "<span class=\"ucam-site-tag ucam-site-tag--inverse\">Estágio</span>"
        }
      ]
    },
    "icon-chip": {
      "instalacao": "<link rel=\"stylesheet\" href=\"node_modules/@ucam/site-css/css/ucam-site.css\">",
      "principal": {
        "preview": "<div style='display:flex;flex-wrap:wrap;gap:1rem;align-items:center'><span class='ucam-site-icon-chip' aria-hidden='true'><svg class='ic'><use href='#i-briefcase'/></svg></span><span class='ucam-site-icon-chip ucam-site-icon-chip--lg' aria-hidden='true'><svg class='ic'><use href='#i-graduationCap'/></svg></span><span class='ucam-site-icon-chip ucam-site-icon-chip--neutral' aria-hidden='true'><svg class='ic'><use href='#i-mapPin'/></svg></span></div>",
        "codigo": "<span class=\"ucam-site-icon-chip\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-briefcase\"/></svg></span>\n<span class=\"ucam-site-icon-chip ucam-site-icon-chip--lg\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-graduationCap\"/></svg></span>\n<span class=\"ucam-site-icon-chip ucam-site-icon-chip--neutral\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-mapPin\"/></svg></span>"
      },
      "exemplos": [
        {
          "titulo": "Bloco de destaque",
          "descricao": "A pastilha grande acima do título, como nos quatro passos do CENPRE.",
          "preview": "<div style='display:grid;gap:.75rem;max-width:18rem'><span class='ucam-site-icon-chip ucam-site-icon-chip--lg' aria-hidden='true'><svg class='ic'><use href='#i-briefcase'/></svg></span><strong class='ucam-site-titulo'>Orientação de estágio</strong><span class='ucam-site-muted'>Como formalizar o estágio obrigatório e o não obrigatório.</span></div>",
          "codigo": "<span class=\"ucam-site-icon-chip ucam-site-icon-chip--lg\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-briefcase\"/></svg></span>\n<h3>Orientação de estágio</h3>\n<p>Como formalizar o estágio obrigatório e o não obrigatório.</p>"
        },
        {
          "titulo": "Sobre seção escura",
          "preview": "<div class='ucam-site-inverso' style='display:flex;gap:1rem;padding:1.25rem;border-radius:.5rem'><span class='ucam-site-icon-chip ucam-site-icon-chip--inverse' aria-hidden='true'><svg class='ic'><use href='#i-users'/></svg></span><span class='ucam-site-icon-chip ucam-site-icon-chip--inverse ucam-site-icon-chip--lg' aria-hidden='true'><svg class='ic'><use href='#i-chartColumn'/></svg></span></div>",
          "codigo": "<span class=\"ucam-site-icon-chip ucam-site-icon-chip--inverse\" aria-hidden=\"true\"><svg class=\"ic\"><use href=\"#i-users\"/></svg></span>"
        }
      ]
    },
    "section-heading": {
      "instalacao": "<link rel=\"stylesheet\" href=\"node_modules/@ucam/site-css/css/ucam-site.css\">",
      "principal": {
        "preview": "<header class='ucam-site-section-heading'><p class='ucam-site-section-heading__eyebrow'>Carreiras</p><h2 class='ucam-site-section-heading__title'>Vagas e oportunidades</h2><p class='ucam-site-section-heading__lede'>As vagas de estágio e emprego abertas às alunas e aos alunos da UCAM esta semana.</p><div class='ucam-site-section-heading__acoes'><a class='ucam-site-btn ucam-site-btn--secondary' href='#'>Ver todas</a></div></header>",
        "codigo": "<header class=\"ucam-site-section-heading\">\n  <p class=\"ucam-site-section-heading__eyebrow\">Carreiras</p>\n  <h2 class=\"ucam-site-section-heading__title\">Vagas e oportunidades</h2>\n  <p class=\"ucam-site-section-heading__lede\">As vagas de estágio e emprego abertas às alunas e aos alunos da UCAM esta semana.</p>\n  <div class=\"ucam-site-section-heading__acoes\"><a class=\"ucam-site-btn ucam-site-btn--secondary\" href=\"/vagas\">Ver todas</a></div>\n</header>"
      },
      "exemplos": [
        {
          "titulo": "Centralizado, tamanho menor",
          "preview": "<header class='ucam-site-section-heading ucam-site-section-heading--center ucam-site-section-heading--sm'><p class='ucam-site-section-heading__eyebrow'>Desde 2001</p><h2 class='ucam-site-section-heading__title'>O CENPRE em números</h2></header>",
          "codigo": "<header class=\"ucam-site-section-heading ucam-site-section-heading--center ucam-site-section-heading--sm\">\n  <p class=\"ucam-site-section-heading__eyebrow\">Desde 2001</p>\n  <h2 class=\"ucam-site-section-heading__title\">O CENPRE em números</h2>\n</header>"
        },
        {
          "titulo": "Sobre seção escura",
          "preview": "<div class='ucam-site-inverso' style='padding:1.5rem;border-radius:.5rem'><header class='ucam-site-section-heading ucam-site-section-heading--inverse'><p class='ucam-site-section-heading__eyebrow'>Ingresso</p><h2 class='ucam-site-section-heading__title'>Como ingressar</h2><p class='ucam-site-section-heading__lede'>Vestibular, ENEM, transferência, segunda graduação e ENCCEJA.</p></header></div>",
          "codigo": "<div class=\"ucam-site-inverso\">\n  <header class=\"ucam-site-section-heading ucam-site-section-heading--inverse\">\n    <p class=\"ucam-site-section-heading__eyebrow\">Ingresso</p>\n    <h2 class=\"ucam-site-section-heading__title\">Como ingressar</h2>\n  </header>\n</div>"
        }
      ]
    }
  }
}
```

- [ ] **Step 7: JSON bem formado e schema**

Run:
```bash
node -e "const Ajv=require('ajv/dist/2020.js');const fs=require('fs');const ajv=new Ajv({allErrors:true,strict:false});const v=ajv.compile(JSON.parse(fs.readFileSync('spec/schema/component.schema.json','utf8')));for(const id of ['button','tag','icon-chip','section-heading']){const ok=v(JSON.parse(fs.readFileSync('sites/spec/components/'+id+'.json','utf8')));console.log(id,ok?'ok':JSON.stringify(v.errors))};JSON.parse(fs.readFileSync('sites/spec/demos.json','utf8'));console.log('demos ok')"
```
Expected: quatro `ok` e `demos ok`. Se o schema reclamar de `anatomia[].classe`, confira o padrão em `spec/schema/component.schema.json` e ajuste o valor (com ou sem ponto) — o padrão é a autoridade.

- [ ] **Step 8: Commit**

```bash
git add sites/spec
git commit -m "Sites: button, tag, icon-chip e section-heading — contratos, demos e os quatro tokens que eles pedem

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: `tools/build-sites-css.mjs` — a folha e os três portões

**Files:**
- Create: `tools/build-sites-css.mjs`
- Create: `tools/test/sites-css.test.mjs`
- Modify: `tools/build-sites-tokens.mjs` (seletor da camada 3: `:root[data-marca="x"], [data-marca="x"]`) e `tools/test/sites-tokens.test.mjs` (a asserção acompanha)

**Interfaces:**
- Produces: `construirCss({ raiz }) → { css: string, falhas: string[], relatos: string[] }`; `principal()` escreve `dist/sites/css/ucam-site.css`. Classes emitidas (as que os contratos e demos citam): `.ucam-site`, `.ucam-site-inverso`, `.ucam-site-muted`, `.ucam-site-titulo`, `.ucam-site-btn` (+ `--primary --secondary --ghost --lg --inverse`, `__icon`), `.ucam-site-tag` (+ `--brand --info --inverse`), `.ucam-site-icon-chip` (+ `--lg --neutral --inverse`), `.ucam-site-section-heading` (+ `__eyebrow __title __lede __acoes`, `--center --sm --inverse`).

- [ ] **Step 1: Testes que falham**

`tools/test/sites-css.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirCss, conferirFolha } from '../build-sites-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('a folha real passa nos portões e emite as classes dos quatro contratos', () => {
  const r = construirCss({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
  assert.match(r.css, /^@import "\.\.\/tokens\/ucam-site-tokens\.css";/m);
  for (const c of ['.ucam-site {', '.ucam-site-btn {', '.ucam-site-btn--primary', '.ucam-site-btn--inverse', '.ucam-site-tag--info', '.ucam-site-icon-chip--lg', '.ucam-site-section-heading__eyebrow', '.ucam-site-section-heading--center', '.ucam-site-inverso']) {
    assert.ok(r.css.includes(c), 'falta ' + c);
  }
  assert.doesNotMatch(r.css, /var\(--ucam-[a-z]/, 'variável da aplicação dentro da folha dos sites');
  assert.doesNotMatch(r.css, /max-width/);
  assert.doesNotMatch(r.css, /color-mix|oklch\(/);
});

test('portão: token inexistente e primitivo na folha derrubam, nomeando', () => {
  const tokens = { disponiveis: new Set(['--ucam-site-color-text-body', '--ucam-site-wine-600']), primitivos: new Set(['--ucam-site-wine-600']), semanticos: new Set(['--ucam-site-color-text-body']), viewports: new Set(['min:40rem']) };
  const r = conferirFolha('.a { color: var(--ucam-site-color-inventada); } .b { color: var(--ucam-site-wine-600, red); }', tokens);
  assert.ok(r.falhas.some((f) => /inexistente.*--ucam-site-color-inventada/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /primitivo.*--ucam-site-wine-600/.test(f)), r.falhas.join('\n'));
});

test('portão: media query fora dos viewports da semântica derruba', () => {
  const tokens = { disponiveis: new Set(), primitivos: new Set(), semanticos: new Set(), viewports: new Set(['min:40rem']) };
  const r = conferirFolha('@media (min-width: 37rem) { .a { color: red } }', tokens);
  assert.ok(r.falhas.some((f) => /min:37rem/.test(f)), r.falhas.join('\n'));
  const ok = conferirFolha('@media (min-width: 40rem) { .a { color: red } }', tokens);
  assert.deepEqual(ok.falhas, []);
});

test('a camada 3 aplica-se também num invólucro, não só no :root', async () => {
  const { construir } = await import('../build-sites-tokens.mjs');
  const r = construir({ raiz: ROOT });
  const marca = r.arquivos.find(([n]) => n === 'ucam-site-marca-cenpre.css')[1];
  assert.match(marca, /:root\[data-marca="cenpre"\],\n\[data-marca="cenpre"\] \{/);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools`
Expected: `Cannot find module '.../tools/build-sites-css.mjs'` e, no `sites-tokens.test.mjs`, nada muda ainda.

- [ ] **Step 3: A camada 3 num invólucro**

Em `tools/build-sites-tokens.mjs`, na saída de cada marca, troque `:root[data-marca="${m.id}"] {` por:

```js
:root[data-marca="${m.id}"],
[data-marca="${m.id}"] {
```

E em `tools/test/sites-tokens.test.mjs`, a asserção `assert.match(marca, /:root\[data-marca="cenpre"\] \{/);` vira `assert.match(marca, /:root\[data-marca="cenpre"\],\n\[data-marca="cenpre"\] \{/);`.

- [ ] **Step 4: O script**

`tools/build-sites-css.mjs`:

```js
// Gera a folha de classes do UCAMDS Sites: dist/sites/css/ucam-site.css.
//
// Escrita à mão, no mesmo molde do build-css.mjs da aplicação: um template
// literal, uma seção por componente, o contrato citado no comentário. Três
// restrições: tudo sob .ucam-site; zero reset global; só token semântico dos
// sites (var(--ucam-site-…) que exista e não seja primitivo). Mobile-first:
// só min-width, e só com os viewports da semântica.
//
//   node tools/build-sites-css.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Lê os tokens gerados e a semântica, para os helpers e os portões. */
function lerTokens(raiz) {
  const dir = join(raiz, 'dist', 'sites', 'tokens');
  const css = join(dir, 'ucam-site-tokens.css');
  if (!existsSync(css)) throw new Error('dist/sites/tokens/ucam-site-tokens.css não existe. Rode: node tools/build-sites-tokens.mjs');
  const nomes = JSON.parse(readFileSync(join(dir, 'ucam-site-tokens.json'), 'utf8'));
  const semantic = JSON.parse(readFileSync(join(raiz, 'sites', 'spec', 'tokens', 'semantic.json'), 'utf8'));
  const primitive = JSON.parse(readFileSync(join(raiz, 'sites', 'spec', 'tokens', 'primitive.json'), 'utf8'));
  const base = JSON.parse(readFileSync(join(raiz, 'spec', 'tokens', 'primitive.json'), 'utf8'));
  const breakpoints = { ...(base.breakpoint ?? {}), ...(primitive.breakpoint ?? {}) };
  const viewports = new Set();
  const remDoPapel = (papel) => {
    const no = semantic.viewport?.[papel];
    if (!no) throw new Error(`papel de viewport inexistente: ${papel}`);
    const degrau = no.$value.replace(/[{}]/g, '').split('.').at(-1);
    const bruto = breakpoints[degrau]?.$value;
    if (!bruto) throw new Error(`breakpoint.${degrau} inexistente`);
    return parseFloat(bruto);
  };
  for (const papel of Object.keys(semantic.viewport ?? {})) {
    if (!papel.startsWith('$')) viewports.add(`min:${remDoPapel(papel)}rem`);
  }
  return {
    disponiveis: new Set([...readFileSync(css, 'utf8').matchAll(/^\s*(--ucam-site-[a-z0-9-]+):/gm)].map((m) => m[1])),
    primitivos: new Set(Object.keys(nomes.primitive).map((n) => `--ucam-site-${n}`)),
    semanticos: new Set(Object.keys(nomes.semantic).map((n) => `--ucam-site-${n}`)),
    viewports,
    remDoPapel,
  };
}

/** Os três portões, puros: recebem a folha e as listas, devolvem falhas. */
export function conferirFolha(css, tokens) {
  const falhas = [];
  const referenciadas = [...new Set([...css.matchAll(/var\(\s*(--ucam-site-[a-z0-9-]+)\s*[,)]/g)].map((m) => m[1]))];
  const declaradas = new Set([...css.matchAll(/(?:^|[{;])\s*(--ucam-site-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
  for (const t of referenciadas) {
    if (declaradas.has(t)) continue;
    if (!tokens.disponiveis.has(t)) falhas.push(`token inexistente na folha dos sites: ${t}`);
    else if (tokens.primitivos.has(t) && !tokens.semanticos.has(t)) falhas.push(`primitivo em componente (ADR-007): ${t}`);
  }
  for (const m of css.matchAll(/\((min|max)-width:\s*([^)]+)\)/g)) {
    const chave = `${m[1]}:${m[2].trim()}`;
    if (m[1] === 'max') falhas.push(`max-width na folha dos sites (mobile-first, só min-width): ${chave}`);
    else if (!tokens.viewports.has(chave)) falhas.push(`media query fora dos viewports da semântica: ${chave}`);
  }
  return { falhas };
}

export function construirCss({ raiz = ROOT } = {}) {
  const tokens = lerTokens(raiz);
  const acima = (papel) => `@media (min-width: ${tokens.remDoPapel(papel)}rem)`;
  const V = (n) => `var(--ucam-site-${n})`;

  const css = `/* @ucam/site-css — gerado por tools/build-sites-css.mjs. NÃO EDITAR À MÃO.
 * Trilho A dos sites: aparência sem framework, escopada sob .ucam-site.
 * Mobile-first, só min-width. Só token semântico dos sites. */
@import "../tokens/ucam-site-tokens.css";

/* ---------------------------------------------------------------- raiz --- */
/* Tudo vive sob .ucam-site. A família é declarada aqui pelo mesmo motivo
 * que em .ucam: sem ela o escopo herda a fonte do site hospedeiro. */
.ucam-site {
  color: ${V('color-text-body')};
  font-family: ${V('font-body')};
  font-size: ${V('typography-body-font-size')};
  line-height: ${V('typography-body-line-height')};
  -webkit-font-smoothing: antialiased;
}
.ucam-site *,
.ucam-site *::before,
.ucam-site *::after {
  box-sizing: border-box;
}
/* Anel de foco cinza (ADR-048), igual em toda peça. Sobre seção escura o
 * degrau é outro, medido. */
.ucam-site :focus-visible {
  outline: ${V('focus-ring-width')} solid ${V('color-border-focus')};
  outline-offset: ${V('focus-ring-offset')};
}
.ucam-site-inverso :focus-visible {
  outline-color: ${V('color-border-focus-on-inverse')};
}

/* ------------------------------------------------------- seção escura --- */
/* color.surface.inverse é uma SUPERFÍCIE, não um tema: hero com foto,
 * rodapé, CTA final. Quem está dentro lê em on-inverse. */
.ucam-site-inverso {
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* --------------------------------------------------- texto de apoio ---- */
.ucam-site-muted {
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-inverso .ucam-site-muted {
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-titulo {
  display: block;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-inverso .ucam-site-titulo {
  color: ${V('color-text-on-inverse')};
}

/* -------------------------------------------------------------- button --- */
/* Contrato: sites/spec/components/button.json. Uma classe, variante e
 * tamanho por modificador; <a> e <button> sem diferença. */
.ucam-site-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${V('space-inline-sm')};
  min-block-size: ${V('size-control-md')};
  padding-inline: ${V('space-inset-control')};
  border: 1px solid transparent;
  border-radius: ${V('radius-control')};
  background: transparent;
  color: inherit;
  font-family: ${V('typography-action-font-family')};
  font-size: ${V('typography-action-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-action-line-height')};
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    border-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-btn .ic,
.ucam-site-btn__icon {
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
  flex: none;
}
.ucam-site-btn--lg {
  min-block-size: ${V('size-control-lg')};
  padding-inline: ${V('space-stack-md')};
  font-size: ${V('typography-body-lg-font-size')};
}
.ucam-site-btn--primary {
  background: ${V('color-action-primary-default')};
  color: ${V('color-text-on-action')};
  box-shadow: ${V('elevation-button')};
}
.ucam-site-btn--primary:hover { background: ${V('color-action-primary-hover')}; }
.ucam-site-btn--primary:active { background: ${V('color-action-primary-active')}; box-shadow: none; }
.ucam-site-btn--secondary {
  background: ${V('color-action-secondary-default')};
  border-color: ${V('color-action-secondary-border')};
  color: ${V('color-text-primary')};
}
.ucam-site-btn--secondary:hover { background: ${V('color-action-secondary-hover')}; }
.ucam-site-btn--secondary:active { background: ${V('color-action-secondary-active')}; }
.ucam-site-btn--ghost {
  color: ${V('color-action-primary-default')};
}
.ucam-site-btn--ghost:hover { background: ${V('color-action-primary-subtle')}; }
.ucam-site-btn--ghost:active { background: ${V('color-interaction-active')}; }
/* Sobre seção escura: o primário vira papel com tinta escura, o secundário
 * ganha borda clara, o fantasma lê em branco e o hover é lavagem de papel. */
.ucam-site-btn--inverse.ucam-site-btn--primary {
  background: ${V('color-text-on-inverse')};
  color: ${V('color-text-primary')};
  box-shadow: none;
}
.ucam-site-btn--inverse.ucam-site-btn--primary:hover { background: ${V('color-surface-subtle')}; }
.ucam-site-btn--inverse.ucam-site-btn--primary:active { background: ${V('color-surface-sunken')}; }
.ucam-site-btn--inverse.ucam-site-btn--secondary {
  background: transparent;
  border-color: ${V('color-border-on-inverse')};
  color: ${V('color-text-on-inverse')};
}
.ucam-site-btn--inverse.ucam-site-btn--secondary:hover { background: ${V('color-interaction-hover-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--secondary:active { background: ${V('color-interaction-active-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--ghost {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-btn--inverse.ucam-site-btn--ghost:hover { background: ${V('color-interaction-hover-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--ghost:active { background: ${V('color-interaction-active-on-inverse')}; }
.ucam-site-btn:disabled,
.ucam-site-btn[aria-disabled="true"] {
  background: ${V('color-action-disabled-background')};
  border-color: transparent;
  color: ${V('color-action-disabled-text')};
  box-shadow: none;
  cursor: not-allowed;
}

/* ----------------------------------------------------------------- tag --- */
/* Contrato: sites/spec/components/tag.json. Pílula, nunca clicável. */
.ucam-site-tag {
  display: inline-flex;
  align-items: center;
  gap: ${V('space-inline-xs')};
  padding: ${V('space-inline-xs')} ${V('space-inline-sm')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
  white-space: nowrap;
}
.ucam-site-tag--brand {
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
}
.ucam-site-tag--info {
  background: ${V('color-feedback-info-background')};
  color: ${V('color-feedback-info-foreground')};
}
.ucam-site-tag--inverse {
  background: ${V('color-interaction-hover-on-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* ----------------------------------------------------------- icon-chip --- */
/* Contrato: sites/spec/components/icon-chip.json. Decorativa; o ícone
 * recebe o degrau do papel pela folha, não pela marcação. */
.ucam-site-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: ${V('size-icon-chip-md')};
  block-size: ${V('size-icon-chip-md')};
  border-radius: ${V('radius-control')};
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
}
.ucam-site-icon-chip .ic {
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
}
.ucam-site-icon-chip--lg {
  inline-size: ${V('size-icon-chip-lg')};
  block-size: ${V('size-icon-chip-lg')};
}
.ucam-site-icon-chip--lg .ic {
  inline-size: ${V('size-icon-lg')};
  block-size: ${V('size-icon-lg')};
}
.ucam-site-icon-chip--neutral {
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-secondary')};
}
.ucam-site-icon-chip--inverse {
  background: ${V('color-interaction-hover-on-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* ----------------------------------------------------- section-heading --- */
/* Contrato: sites/spec/components/section-heading.json. Eyebrow, título em
 * display e lede, na largura de prosa. */
.ucam-site-section-heading {
  display: grid;
  gap: ${V('space-stack-xs')};
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-section-heading__eyebrow {
  margin: 0;
  color: ${V('color-action-primary-default')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-section-heading__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-family: ${V('typography-display-section-font-family')};
  font-size: ${V('typography-display-section-font-size')};
  font-weight: ${V('typography-display-section-font-weight')};
  line-height: ${V('typography-display-section-line-height')};
  letter-spacing: ${V('typography-display-section-letter-spacing')};
  text-wrap: balance;
}
.ucam-site-section-heading--sm .ucam-site-section-heading__title {
  font-size: ${V('typography-display-section-sm-font-size')};
  letter-spacing: ${V('typography-display-section-sm-letter-spacing')};
}
.ucam-site-section-heading__lede {
  margin: 0;
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
  text-wrap: pretty;
}
.ucam-site-section-heading__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-sm')};
  margin-block-start: ${V('space-stack-sm')};
}
.ucam-site-section-heading--center {
  justify-items: center;
  margin-inline: auto;
  text-align: center;
}
.ucam-site-section-heading--center .ucam-site-section-heading__acoes {
  justify-content: center;
}
.ucam-site-section-heading--inverse .ucam-site-section-heading__title {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-section-heading--inverse .ucam-site-section-heading__eyebrow,
.ucam-site-section-heading--inverse .ucam-site-section-heading__lede {
  color: ${V('color-text-on-inverse-muted')};
}
${acima('nav-aberta')} {
  .ucam-site-section-heading {
    gap: ${V('space-stack-sm')};
  }
}
`;

  const { falhas } = conferirFolha(css, tokens);
  return { css, falhas, relatos: [`  ${(css.length / 1024).toFixed(1)} KB · ${(css.match(/^\.ucam-site[a-z0-9_-]*\s*\{/gm) ?? []).length} regras de raiz`] };
}

function principal() {
  const r = construirCss();
  if (r.falhas.length) {
    console.error(`✗ ${r.falhas.length} falha(s) na folha dos sites:`);
    for (const f of r.falhas) console.error('  ' + f);
    process.exit(1);
  }
  const out = join(ROOT, 'dist', 'sites', 'css');
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'ucam-site.css'), r.css, 'utf8');
  console.log('@ucam/site-css → dist/sites/css/ucam-site.css');
  for (const l of r.relatos) console.log(l);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
```

Nota: o `@media` com regras aninhadas (CSS nesting) é aceito pelos navegadores desde 2023 e pelo `build-estados` (que ignora `@media` sem pseudo-classe). Se `conferirFolha` ou o `build-estados` reclamar, desaninhe: `@media (...) { .ucam-site-section-heading { gap: … } }` sem aninhamento — é o que o `acima()` da aplicação faz.

- [ ] **Step 5: Rodar**

Run: `node tools/build-sites-tokens.mjs | tail -1 && node tools/build-sites-css.mjs && pnpm run test:tools 2>&1 | grep -E "^ℹ (pass|fail)|^✖"`
Expected: `@ucam/site-css → dist/sites/css/ucam-site.css`, `# pass 37`, nenhum `✖`. Se um token citado não existir (o portão diz qual), o erro está na folha ou faltou o token da Task 3 Step 1 — conserte a causa, nunca o portão.

- [ ] **Step 6: O espelho de estados dos sites**

Run: `node tools/build-estados.mjs --entrada dist/sites/css/ucam-site.css --saida site/src/generated/sites-estados.css && grep -c "data-ucam-estado" site/src/generated/sites-estados.css`
Expected: `site/src/generated/sites-estados.css` e uma contagem maior que 10.

- [ ] **Step 7: Commit**

```bash
git add tools/build-sites-css.mjs tools/test/sites-css.test.mjs tools/build-sites-tokens.mjs tools/test/sites-tokens.test.mjs
git commit -m "build-sites-css: a folha de classes dos sites, com raiz, seção escura e as quatro peças, sob os três portões

A camada 3 passa a aplicar-se também num invólucro, para o catálogo
mostrar bordô e CENPRE lado a lado.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: `tools/validate-sites-spec.mjs`

**Files:**
- Create: `tools/validate-sites-spec.mjs`
- Create: `tools/test/validate-sites-spec.test.mjs`

**Interfaces:**
- Produces: `validar({ raiz, css? }) → { erros: {arquivo, msg}[], avisos: {arquivo, msg}[], total: number }`. `css` é o conteúdo da folha dos sites (padrão: lê `dist/sites/css/ucam-site.css`). `principal()` imprime e sai 1 com erro.

- [ ] **Step 1: Testes que falham**

`tools/test/validate-sites-spec.test.mjs`:

```js
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
  assert.ok(r.erros.some((e) => /primitivo.*--ucam-site-wine-600/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /color\.surface\.chao/.test(e.msg)), msgs(r));
});

test('vs de mão única e composicao citando a aplicação são falha', () => {
  const raiz = repo();
  const c = le(raiz, 'tag');
  c.vs = c.vs.filter((v) => v.componente !== 'button');
  c.composicao = { usa: ['ucam-button'] };
  grava(raiz, 'tag', c);
  const r = validar({ raiz, css: CSS });
  assert.ok(r.erros.some((e) => /button.*vs.*tag/.test(e.msg) || /tag.*vs.*button/.test(e.msg)), msgs(r));
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
  assert.ok(r.erros.some((e) => /icon-chip.*sem evidencia/.test(e.msg)), msgs(r));
  assert.ok(r.erros.some((e) => /icon-chip.*sem demo/.test(e.msg)), msgs(r));
  assert.ok(r.avisos.some((a) => /trilho_b/.test(a.msg)), JSON.stringify(r.avisos));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools` → `Cannot find module '.../tools/validate-sites-spec.mjs'`.

- [ ] **Step 3: O validador**

`tools/validate-sites-spec.mjs`:

```js
// Valida os contratos de sites/spec/components/ contra o MESMO JSON Schema da
// aplicação e contra o perfil de contrato dos sites (spec de 08/10/2026):
// selector ucam-site-<id>, só token semântico dos sites, classes que existem
// na folha, vs e composição simétricos, demo com preview e código, evidência,
// limites, boas práticas, sem trilho_b.
//
// Roda DEPOIS do build-sites-css: confere classe contra a folha.
//
//   node tools/validate-sites-spec.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv/dist/2020.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function validar({ raiz = ROOT, css } = {}) {
  const ler = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const erros = [];
  const avisos = [];
  const falha = (arquivo, msg) => erros.push({ arquivo, msg });
  const avisa = (arquivo, msg) => avisos.push({ arquivo, msg });

  const folha = css ?? (existsSync(join(raiz, 'dist/sites/css/ucam-site.css')) ? readFileSync(join(raiz, 'dist/sites/css/ucam-site.css'), 'utf8') : '');
  if (!folha) falha('dist/sites/css/ucam-site.css', 'não existe — rode node tools/build-sites-css.mjs antes');
  const classesDaFolha = new Set([...folha.matchAll(/\.(ucam-site[a-z0-9_-]*)/g)].map((m) => m[1]));
  const variaveisDaFolha = new Set([...folha.matchAll(/var\(\s*(--ucam-site-[a-z0-9-]+)/g)].map((m) => m[1]));

  /* ---------------------------------------------------------- schema --- */
  const schema = ler('spec/schema/component.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: false });
  const valido = ajv.compile(schema);
  const dir = join(raiz, 'sites/spec/components');
  const arquivos = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const contratos = arquivos.map((f) => ({ file: `sites/spec/components/${f}`, spec: ler(`sites/spec/components/${f}`) }));
  const ids = new Set(contratos.map((c) => c.spec.id));
  const seletores = new Set(contratos.map((c) => c.spec.selector));

  for (const { file, spec } of contratos) {
    if (!valido(spec)) for (const e of valido.errors) falha(file, `${e.instancePath || '/'} ${e.message}`);
    const esperado = `ucam-site-${spec.id}`;
    if (spec.selector !== esperado) falha(file, `selector "${spec.selector}" deveria ser "${esperado}"`);
    if (spec.id !== file.split('/').pop().replace(/\.json$/, '')) falha(file, `id "${spec.id}" não corresponde ao nome do arquivo`);
  }

  /* ------------------------------------------------------ tokens --- */
  const semantic = ler('sites/spec/tokens/semantic.json');
  const primitive = { ...ler('spec/tokens/primitive.json'), ...ler('sites/spec/tokens/primitive.json') };
  const primitivos = new Set(Object.keys(primitive).filter((k) => !k.startsWith('$') && !k.startsWith('_')));
  const existeSemantico = (ref) => {
    let cur = semantic;
    for (const seg of ref.split('.')) { cur = cur?.[seg]; if (!cur) return false; }
    return true;
  };
  const achatados = new Set();
  (function anda(no, trilha) {
    for (const [k, v] of Object.entries(no)) {
      if (k.startsWith('$') || k.startsWith('_')) continue;
      if (v && typeof v === 'object' && '$value' in v) achatados.add(`--ucam-site-${[...trilha, k].join('-')}`);
      else if (v && typeof v === 'object') anda(v, [...trilha, k]);
    }
  })(semantic, []);
  const primitivosAchatados = new Set();
  (function anda(no, trilha) {
    for (const [k, v] of Object.entries(no)) {
      if (k.startsWith('$') || k.startsWith('_')) continue;
      if (v && typeof v === 'object' && '$value' in v) primitivosAchatados.add(`--ucam-site-${[...trilha, k].join('-')}`);
      else if (v && typeof v === 'object') anda(v, [...trilha, k]);
    }
  })(primitive, []);

  for (const { file, spec } of contratos) {
    const json = JSON.stringify(spec);
    for (const m of json.matchAll(/"([a-z]+(?:\.[a-z-]+){1,4})"/g)) {
      const ref = m[1];
      const grupo = ref.split('.')[0];
      if (primitivos.has(grupo) && grupo !== 'color' && grupo !== 'space' && grupo !== 'radius') falha(file, `cita token primitivo "${ref}" — só a camada semântica dos sites é pública (ADR-007)`);
      if (/^(color|space|size|radius|typography|elevation|container|viewport|motion|font)\./.test(ref) && !existeSemantico(ref)) falha(file, `cita token semântico inexistente nos sites "${ref}"`);
    }
    for (const v of spec.implementacao?.trilho_a?.variaveis ?? []) {
      if (!v.startsWith('--ucam-site-')) falha(file, `variável fora do prefixo dos sites: ${v}`);
      else if (primitivosAchatados.has(v) && !achatados.has(v)) falha(file, `variável primitiva em trilho_a.variaveis: ${v}`);
      else if (!achatados.has(v)) falha(file, `variável inexistente em trilho_a.variaveis: ${v}`);
      else if (!variaveisDaFolha.has(v)) avisa(file, `trilho_a.variaveis cita ${v}, que a folha não lê`);
    }
  }

  /* ------------------------------------------------------ perfil --- */
  const demos = existsSync(join(raiz, 'sites/spec/demos.json')) ? ler('sites/spec/demos.json').demos : {};
  for (const { file, spec } of contratos) {
    const id = spec.id;
    if (!spec.evidencia) falha(file, `${id} sem evidencia — o perfil dos sites exige a origem no site no ar ou no kit`);
    if (!spec.quando_usar?.length) falha(file, `${id} sem quando_usar`);
    if (!spec.limites) falha(file, `${id} sem limites`);
    if (!(spec.boas_praticas?.length >= 2)) falha(file, `${id} com menos de duas boas_praticas`);
    const temBomRuim = Object.values(spec.conteudo ?? {}).some((v) => v && typeof v === 'object' && !Array.isArray(v) && (v.bom || v.ruim));
    if (!temBomRuim && id !== 'icon-chip') avisa(file, `${id}: conteudo sem par bom/ruim`);
    if (!spec.implementacao?.trilho_a?.raiz) falha(file, `${id} sem implementacao.trilho_a.raiz`);
    if (spec.implementacao?.trilho_b) avisa(file, `${id} declara trilho_b — a lib Angular dos sites é o subprojeto 3`);
    if (spec.eventos) falha(file, `${id} declara eventos — é Angular; sai até o subprojeto 3`);
    const raizClasse = spec.implementacao?.trilho_a?.raiz?.replace(/^\./, '');
    if (raizClasse && !classesDaFolha.has(raizClasse)) falha(file, `${id}: trilho_a.raiz ${raizClasse} não existe na folha`);
    for (const parte of spec.anatomia ?? []) {
      const cl = parte.classe?.replace(/^\./, '');
      if (cl && !classesDaFolha.has(cl)) falha(file, `${id}: anatomia "${parte.parte}" cita a classe ${cl}, que a folha não emite`);
    }
    for (const p of spec.props ?? []) {
      for (const [chave, v] of Object.entries(p.valores ?? {})) {
        const cl = v.classe?.replace(/^\./, '');
        if (cl && !classesDaFolha.has(cl)) falha(file, `${id}: prop ${p.nome}=${chave} cita a classe ${cl}, que a folha não emite`);
      }
    }
    const d = demos[id];
    if (!d) falha(file, `${id} sem demo em sites/spec/demos.json`);
    else {
      if (!d.principal?.preview) falha(file, `${id}: demo sem principal.preview`);
      if (!d.principal?.codigo) falha(file, `${id}: demo sem principal.codigo`);
      for (const html of [d.principal?.preview, ...(d.exemplos ?? []).map((e) => e.preview)]) {
        for (const m of (html ?? '').matchAll(/\b(ucam-site[a-z0-9_-]*)/g)) {
          if (!classesDaFolha.has(m[1])) falha(file, `${id}: o preview usa a classe ${m[1]}, que a folha não emite`);
        }
        if (/\bucam-(?!site)[a-z]/.test(html ?? '')) falha(file, `${id}: o preview usa classe da aplicação (ucam-…) — os sites só leem ucam-site-*`);
      }
    }
    for (const sel of [...(spec.composicao?.usa ?? []), ...(spec.composicao?.usada_por ?? [])]) {
      if (!sel.startsWith('ucam-site-')) falha(file, `${id}: composicao cita ${sel}, que não é dos sites`);
      else if (!seletores.has(sel)) avisa(file, `${id}: composicao cita ${sel}, ainda sem contrato`);
    }
  }

  /* ------------------------------------------------- simetrias --- */
  const porId = new Map(contratos.map((c) => [c.spec.id, c]));
  for (const { file, spec } of contratos) {
    for (const v of spec.vs ?? []) {
      const outro = porId.get(v.componente);
      if (!outro) { avisa(file, `${spec.id}: vs cita ${v.componente}, ainda sem contrato`); continue; }
      if (!(outro.spec.vs ?? []).some((x) => x.componente === spec.id)) falha(outro.file, `${outro.spec.id} não devolve o vs que ${spec.id} declara — a desambiguação é simétrica`);
    }
    for (const sel of spec.composicao?.usa ?? []) {
      const outro = porId.get(sel.replace('ucam-site-', ''));
      if (outro && !(outro.spec.composicao?.usada_por ?? []).includes(spec.selector)) falha(outro.file, `${outro.spec.id} não declara usada_por ${spec.selector}, que o usa`);
    }
    for (const sel of spec.composicao?.usada_por ?? []) {
      const outro = porId.get(sel.replace('ucam-site-', ''));
      if (outro && !(outro.spec.composicao?.usa ?? []).includes(spec.selector)) falha(outro.file, `${outro.spec.id} não declara usa ${spec.selector}, que diz ser usado por ele`);
    }
  }

  /* -------------------------------------------------------- ADRs --- */
  const adrIds = new Set(ler('spec/decisions/adr.json').decisions.map((a) => a.id));
  for (const { file, spec } of contratos) {
    for (const m of JSON.stringify(spec).matchAll(/ADR-\d{3}/g)) if (!adrIds.has(m[0])) falha(file, `cita ${m[0]}, que não existe`);
  }

  return { erros, avisos, total: contratos.length, ids: [...ids] };
}

function principal() {
  const r = validar();
  for (const a of r.avisos) console.log(`⚠ ${a.arquivo}: ${a.msg}`);
  if (r.erros.length) {
    console.error(`✗ ${r.erros.length} erro(s) nos contratos dos sites:`);
    for (const e of r.erros) console.error(`  ${e.arquivo}: ${e.msg}`);
    process.exit(1);
  }
  console.log(`✓ ${r.total} contrato(s) dos sites válidos (${r.ids.join(', ')})`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
```

- [ ] **Step 4: Rodar**

Run: `node tools/validate-sites-spec.mjs && pnpm run test:tools 2>&1 | grep -E "^ℹ (pass|fail)|^✖"`
Expected: `✓ 4 contrato(s) dos sites válidos (button, icon-chip, section-heading, tag)` e `# pass 43`. Se a spec real reprovar em algo (classe que a folha não emite, token inexistente), conserte o contrato ou a folha, nunca o validador — a mensagem diz qual.

- [ ] **Step 5: Commit**

```bash
git add tools/validate-sites-spec.mjs tools/test/validate-sites-spec.test.mjs
git commit -m "validate-sites-spec: o schema da aplicação mais o perfil dos sites, conferido contra a folha

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: `tools/build-sites-index.mjs` — o que o site de docs lê

**Files:**
- Create: `tools/build-sites-index.mjs`
- Create: `tools/test/sites-index.test.mjs`
- Modify: `.gitignore` (duas linhas)

**Interfaces:**
- Produces: `construirIndice({ raiz }) → { data, css }` e `principal()` escreve `site/src/generated/sites.data.json`, `site/src/generated/sites.css`, e copia `dist/sites/tokens/*` para `site/src/assets/sites/tokens/` e `dist/sites/fonts/*` + `dist/sites/css/ucam-site-fonts.css` para `site/src/assets/sites/fonts/` e `site/src/assets/sites/css/`. Forma de `data`: `{ meta: { componentes, versao, submarcas: string[] }, componentes: [ { ...contrato, demo } ] }`, ordenados por `name`.

- [ ] **Step 1: Teste que falha**

`tools/test/sites-index.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirIndice } from '../build-sites-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('o índice dos sites junta contrato, demo e a folha, sem @import e sem classe da aplicação', () => {
  const { data, css } = construirIndice({ raiz: ROOT });
  assert.equal(data.meta.componentes, 4);
  assert.deepEqual(data.meta.submarcas, ['cenpre']);
  assert.deepEqual(data.componentes.map((c) => c.id), ['button', 'icon-chip', 'section-heading', 'tag']);
  const b = data.componentes[0];
  assert.equal(b.selector, 'ucam-site-button');
  assert.match(b.demo.principal.preview, /ucam-site-btn--primary/);
  assert.equal(b.trilhos, undefined);
  assert.match(css, /--ucam-site-color-action-primary-default: #8D293A/);
  assert.match(css, /\[data-marca="cenpre"\]/);
  assert.match(css, /\.ucam-site \.ic\{/);
  assert.match(css, /\.ucam-site-btn \{/);
  assert.doesNotMatch(css, /@import/);
  assert.doesNotMatch(css, /@font-face/);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm run test:tools` → `Cannot find module '.../tools/build-sites-index.mjs'`.

- [ ] **Step 3: O script**

`tools/build-sites-index.mjs`:

```js
// Gera o que o site de docs lê sobre os sites: site/src/generated/sites.data.json
// (contratos + demos) e site/src/generated/sites.css (tokens + submarcas +
// folha, sem @import), e copia tokens, fontes e o css de fontes para
// site/src/assets/sites/, que o site serve em /sites/tokens/, /sites/fonts/
// e /sites/css/ — o mesmo espelho que a aplicação tem em /tokens/.
//
//   node tools/build-sites-index.mjs

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { iconCss } from './lib/icon-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function construirIndice({ raiz = ROOT } = {}) {
  const ler = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const dist = join(raiz, 'dist', 'sites');
  for (const f of ['tokens/ucam-site-tokens.css', 'css/ucam-site.css']) {
    if (!existsSync(join(dist, f))) throw new Error(`dist/sites/${f} não existe — rode pnpm run sites`);
  }
  const demos = ler('sites/spec/demos.json').demos;
  const componentes = readdirSync(join(raiz, 'sites/spec/components'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ler(`sites/spec/components/${f}`))
    .map((c) => ({ ...c, demo: demos[c.id] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const submarcas = readdirSync(join(dist, 'tokens'))
    .filter((f) => /^ucam-site-marca-.+\.css$/.test(f))
    .map((f) => f.replace(/^ucam-site-marca-/, '').replace(/\.css$/, ''))
    .sort();
  const { version } = ler('package.json');
  const data = { meta: { componentes: componentes.length, versao: version, submarcas }, componentes };

  const tokensCss = readFileSync(join(dist, 'tokens/ucam-site-tokens.css'), 'utf8');
  const marcasCss = submarcas.map((m) => readFileSync(join(dist, `tokens/ucam-site-marca-${m}.css`), 'utf8')).join('\n');
  const folha = readFileSync(join(dist, 'css/ucam-site.css'), 'utf8').replace(/@import\s+["'][^"']*ucam-site-tokens\.css["'];\s*/, '');
  // O .ic escopado sob .ucam-site, pelo mesmo motivo que o build-index escopa
  // sob .ucam: no topo, para o degrau por papel vencer.
  const icScoped = iconCss.replace(/^\./gm, '.ucam-site .').replace(/--ucam-size-icon-md/g, '--ucam-site-size-icon-md');
  const css = `/* Gerado por tools/build-sites-index.mjs — tokens, submarcas e a folha do UCAMDS Sites. NÃO EDITAR À MÃO. */

${tokensCss}

${marcasCss}

${icScoped}

${folha}
`;
  return { data, css };
}

function principal() {
  const { data, css } = construirIndice();
  const gen = join(ROOT, 'site', 'src', 'generated');
  mkdirSync(gen, { recursive: true });
  writeFileSync(join(gen, 'sites.data.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
  writeFileSync(join(gen, 'sites.css'), css, 'utf8');
  const assets = join(ROOT, 'site', 'src', 'assets', 'sites');
  for (const sub of ['tokens', 'fonts', 'css']) {
    const origem = join(ROOT, 'dist', 'sites', sub);
    if (!existsSync(origem)) continue;
    mkdirSync(join(assets, sub), { recursive: true });
    cpSync(origem, join(assets, sub), { recursive: true });
  }
  console.log(`site/src/generated/sites.data.json · ${data.meta.componentes} componente(s), submarca ${data.meta.submarcas.join(', ') || 'nenhuma'}`);
  console.log('site/src/generated/sites.css · site/src/assets/sites/{tokens,fonts,css}');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
```

- [ ] **Step 4: `.gitignore`**

Depois de `site/src/assets/tokens/` acrescente:

```
site/src/assets/sites/
```

(`site/src/generated/` já está ignorado inteiro.)

- [ ] **Step 5: Rodar**

Run: `node tools/build-sites-index.mjs && pnpm run test:tools 2>&1 | grep -E "^ℹ (pass|fail)|^✖" && ls site/src/assets/sites/tokens site/src/assets/sites/css && git status --short | grep -c assets/sites`
Expected: as duas linhas do script, `# pass 44`, os arquivos copiados, e `0` (ignorado).

- [ ] **Step 6: Commit**

```bash
git add tools/build-sites-index.mjs tools/test/sites-index.test.mjs .gitignore
git commit -m "build-sites-index: sites.data.json, sites.css e o espelho de tokens e fontes em /sites/

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: A área Sites no site de docs

**Files:**
- Create: `site/src/app/spec/sites.ts`
- Create: `site/src/app/pages/sites/index.page.ts`
- Create: `site/src/app/pages/sites/[id].page.ts`
- Modify: `site/src/app/app.component.ts` (`areas`, `secoes`)
- Modify: `site/vite.config.ts` (`specRoutes`)
- Modify: `site/src/styles.css` (dois `@import`)
- Modify: `site/package.json` (script `generate`)

Sem harness de componente: a prova é o `tsc --noEmit`, o `check-ancoras`, o `check-crases` e o prerender (Task 8).

- [ ] **Step 1: `site/src/app/spec/sites.ts`**

```ts
// Ponto único de acesso à spec dos SITES. O JSON é gerado por
// tools/build-sites-index.mjs. Mesma regra de spec.ts: nenhum outro arquivo
// importa sites.data.json.

import bruto from '../../generated/sites.data.json';
import type { Componente } from './spec.types';

interface SitesData {
  meta: { componentes: number; versao: string; submarcas: string[] };
  componentes: Componente[];
}

const SITES = bruto as unknown as SitesData;

export const sitesMeta = SITES.meta;
export const sitesComponentes: Componente[] = SITES.componentes;

export const sitesComponentePorId = (id: string): Componente | undefined =>
  sitesComponentes.find((c) => c.id === id);

/* Os rótulos são dos sites: "layout" aqui é moldura e seção, não a moldura
   da aplicação. Categoria sem entrada vai para o fim com o próprio nome. */
const CATEGORIAS: { chave: string; rotulo: string; nota: string }[] = [
  { chave: 'layout', rotulo: 'Moldura e seção', nota: 'O que estrutura a página: cabeçalho, rodapé, hero e os cabeçalhos de seção.' },
  { chave: 'acao', rotulo: 'Ação', nota: 'Inscrever-se, ver vagas, acessar. Um primário por bloco.' },
  { chave: 'formulario', rotulo: 'Formulário', nota: 'Newsletter, busca de curso, contato.' },
  { chave: 'navegacao', rotulo: 'Navegação', nota: 'Menu, trilha e paginação.' },
  { chave: 'conteudo', rotulo: 'Conteúdo', nota: 'Cartões, tags, pastilhas de ícone, depoimentos e prosa.' },
];

export interface GrupoSites {
  chave: string;
  rotulo: string;
  nota: string;
  itens: Componente[];
}

export function sitesPorCategoria(): GrupoSites[] {
  const grupos = new Map<string, Componente[]>();
  for (const c of sitesComponentes) {
    const lista = grupos.get(c.category) ?? [];
    lista.push(c);
    grupos.set(c.category, lista);
  }
  const conhecidas = CATEGORIAS.filter((c) => grupos.has(c.chave)).map((c) => ({ ...c, itens: grupos.get(c.chave)! }));
  const restantes = [...grupos.keys()]
    .filter((k) => !CATEGORIAS.some((c) => c.chave === k))
    .map((k) => ({ chave: k, rotulo: k, nota: '', itens: grupos.get(k)! }));
  return [...conhecidas, ...restantes];
}

export function sitesDependentesDe(id: string): Componente[] {
  const seletor = `ucam-site-${id}`;
  return sitesComponentes.filter((c) => c.composicao?.usa?.includes(seletor));
}
```

- [ ] **Step 2: `site/src/app/pages/sites/index.page.ts`**

```ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { sitesPorCategoria, sitesMeta } from '../../spec/sites';
import type { Componente } from '../../spec/spec.types';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { TextoComponent } from '../../docs/texto.component';

/**
 * O catálogo dos SITES: o segundo sistema do UCAMDS (ADR-067), para o site
 * institucional, o CENPRE e o de Campos. Mesma grade do catálogo da
 * aplicação, com duas diferenças: o preview vive sob .ucam-site, e o
 * alternador Bordô / CENPRE escreve data-marca no invólucro — é a camada 3
 * (ADR-068) aplicada num elemento, não no :root.
 *
 * Sem o encaixe por escala do catálogo da aplicação: as peças de site são
 * átomos e seções curtas, e aparecem em tamanho real.
 */
@Component({
  selector: 'ucam-sites',
  imports: [TextoComponent, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Sites"
      [titulo]="'Componentes dos sites'"
      [lede]="total + ' contratos para os sites públicos da UCAM: institucional, CENPRE e Campos. CSS puro sob .ucam-site, sobre o mesmo primitivo da aplicação (ADR-067).'"
    />

    <div class="marcas" role="group" aria-label="Submarca dos previews">
      <span class="marcas-rotulo">Ver em</span>
      <button type="button" class="marca" [attr.aria-pressed]="marca() === 'base'" (click)="marca.set('base')">Bordô UCAM</button>
      @for (m of submarcas; track m) {
        <button type="button" class="marca" [attr.aria-pressed]="marca() === m" (click)="marca.set(m)">{{ rotulo(m) }}</button>
      }
    </div>

    <div [attr.data-marca]="marca() === 'base' ? null : marca()">
      @for (g of grupos; track g.chave) {
        <section class="grupo">
          <div class="grupo-cabeca">
            <h2>{{ g.rotulo }} <span class="num">{{ g.itens.length }}</span></h2>
            @if (g.nota) {
              <p class="small muted"><ucam-t [t]="g.nota" /></p>
            }
          </div>
          <div class="grade">
            @for (c of g.itens; track c.id) {
              <a class="card" [routerLink]="'/sites/' + c.id">
                <div class="palco" inert>
                  @if (preview(c); as html) {
                    <div class="ucam-site palco-conteudo" [innerHTML]="html"></div>
                  }
                </div>
                <div class="corpo">
                  <h3>
                    {{ c.name }}
                    @if (c.status !== 'stable') {
                      <span class="pill" [class]="'pill-' + c.status">{{ c.status }}</span>
                    }
                  </h3>
                  <p class="small muted"><ucam-t [t]="c.description" /></p>
                </div>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .marcas {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 2.5rem;
    }
    .marcas-rotulo {
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      margin-inline-end: 0.25rem;
    }
    .marca {
      min-block-size: 2rem;
      padding: 0 0.75rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-full);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
    }
    .marca[aria-pressed='true'] {
      border-color: var(--ucam-color-text-primary);
      font-weight: 650;
    }
    .grupo {
      margin-block-end: 4rem;
    }
    .grupo-cabeca {
      margin-block-end: 1.25rem;
      max-inline-size: var(--measure);
    }
    .grupo-cabeca h2 {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      font-size: 1.375rem;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    .grupo-cabeca .num {
      font-family: var(--f-mono);
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--ucam-color-text-secondary);
    }
    .grupo-cabeca p {
      margin: 0;
    }
    .grade {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
    }
    .card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      box-shadow: var(--sombra-repouso);
      text-decoration: none;
      color: inherit;
      overflow: hidden;
    }
    .card:hover {
      border-color: var(--borda-marca);
      box-shadow: var(--sombra-hover);
    }
    /* O palco é branco de propósito: a peça de site assenta sobre a página
       do site, que é branca. Padding generoso porque não há escala. */
    .palco {
      display: grid;
      place-items: center;
      min-block-size: 10rem;
      padding: 1.5rem;
      background: var(--ucam-color-surface-default);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .palco-conteudo {
      inline-size: 100%;
      display: grid;
      justify-items: center;
    }
    .corpo {
      padding: 0.9rem 1rem 1rem;
    }
    .corpo h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.3rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .corpo p {
      margin: 0;
    }
  `,
})
export default class SitesPage {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly total = sitesMeta.componentes;
  protected readonly submarcas = sitesMeta.submarcas;
  protected readonly grupos = sitesPorCategoria();
  protected readonly marca = signal<string>('base');

  protected rotulo(m: string): string {
    return m === 'cenpre' ? 'CENPRE' : m;
  }

  private readonly cache = new Map<string, SafeHtml | null>();

  /** Mesma justificativa do DemoPainel: a origem é a spec deste repositório. */
  protected preview(c: Componente): SafeHtml | null {
    if (!this.cache.has(c.id)) {
      const html = (c.demo?.principal?.preview ?? c.demo?.miniatura)?.trim();
      this.cache.set(c.id, html ? this.sanitizer.bypassSecurityTrustHtml(html) : null);
    }
    return this.cache.get(c.id)!;
  }
}
```

- [ ] **Step 3: `site/src/app/pages/sites/[id].page.ts` — cópia enxuta**

Copie `site/src/app/pages/catalogo/[id].page.ts` para `site/src/app/pages/sites/[id].page.ts` e aplique, nesta ordem:

1. Imports: troque `import { componentePorId, dependentesDe, decisoesQueAfetam } from '../../spec/spec';` por `import { sitesComponentePorId, sitesDependentesDe } from '../../spec/sites';` e acrescente `import { decisoesQueAfetam } from '../../spec/spec';`. Remova `import { DemoVivaComponent, TEM_DEMO_VIVA } from '../../docs/demo-viva.component';` e `DemoVivaComponent` da lista `imports` do `@Component`.
2. `selector: 'ucam-componente'` vira `selector: 'ucam-site-componente'`.
3. Em `<ucam-page-header secao="Componente" …>` troque `secao="Componente"` por `secao="Sites"`. Em `<p><a routerLink="/catalogo">Voltar ao catálogo</a></p>` troque para `/sites` e "Voltar aos sites".
4. Apague o bloco inteiro `@if (c.trilhos?.length) { … }` (do comentário "ONDE ESTE COMPONENTE EXISTE" até o `}` que fecha o `@if`, antes de `</ucam-page-header>`).
5. Logo depois de `<ucam-nesta-pagina [secoes]="indice()" />`, acrescente o alternador e abra o invólucro:

```html
      <div class="marcas" role="group" aria-label="Submarca dos previews">
        <span class="marcas-rotulo">Ver em</span>
        <button type="button" class="marca" [attr.aria-pressed]="marca() === 'base'" (click)="marca.set('base')">Bordô UCAM</button>
        @for (m of submarcas; track m) {
          <button type="button" class="marca" [attr.aria-pressed]="marca() === m" (click)="marca.set(m)">{{ m === 'cenpre' ? 'CENPRE' : m }}</button>
        }
      </div>

      <div class="prose" [attr.data-marca]="marca() === 'base' ? null : marca()">
```

   e apague o `<div class="prose">` original que vinha logo abaixo (o `</div>` final que o fecha fica).
6. Na seção `abertura`, troque o bloco `@if (temDemoViva()) { … } @else if (c.demo?.principal) { … } @else if (c.exemplos.length) { … }` por:

```html
          @if (c.demo?.principal) {
            <ucam-demo-painel [painel]="c.demo!.principal!" raiz="ucam-site" />
          } @else if (c.exemplos.length) {
            <ucam-demo-painel [painel]="{ codigo: c.exemplos[0].codigo }" raiz="ucam-site" />
          }
```

7. Apague a seção inteira `@if (temDemoViva() && c.demo?.principal) { <section id="trilho-a"> … </section> }`.
8. Em `<section id="variacoes">`, `<ucam-demo-painel [painel]="e" />` vira `<ucam-demo-painel [painel]="e" raiz="ucam-site" />`.
9. Em `vs`, `[routerLink]="['/catalogo', v.componente]"` vira `[routerLink]="['/sites', v.componente]"`.
10. Apague a seção `@if (c.demo?.instalacao) { <section id="instalacao"> … </section> }` e no lugar ponha:

```html
        @if (c.demo?.instalacao) {
          <section id="instalacao">
            <h2>Instalação</h2>
            <pre class="code"><code>{{ c.demo?.instalacao }}</code></pre>
            <p class="small muted resto">
              Uma folha de estilo, sem JavaScript. Tudo vive sob um ancestral
              com a classe de raiz dos sites; o WordPress de Campos e o site
              institucional carregam a mesma folha.
            </p>
            @if (c.demo?.importacao) {
              <pre class="code"><code>{{ c.demo?.importacao }}</code></pre>
            }
          </section>
        }
```

11. Em `composicao`, `[routerLink]="'/catalogo/' + d.id"` vira `[routerLink]="'/sites/' + d.id"`.
12. Em `anatomia`, acrescente `raiz="ucam-site"` ao `<ucam-anatomia-diagrama …/>` e ao `<ucam-estados-grade …/>`.
13. Na seção `evidencia`, o título `<h2>Legado e migração</h2>` vira `<h2>Evidência e migração do kit</h2>`, e `title="Evidência no legado"` vira `title="Evidência nos sites"`.
14. Nos `styles`, apague as regras `.disponivel`, `.disponivel-rotulo`, `.chip-trilho`, `.chip-trilho .ic`, `.chip-trilho__nome`, `.chip-trilho__meio`, `.chip-trilho.ausente…`, `.disponivel-ajuda` e `.abertura ucam-demo-viva`. Acrescente:

```css
    .marcas {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 2rem;
    }
    .marcas-rotulo {
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      margin-inline-end: 0.25rem;
    }
    .marca {
      min-block-size: 2rem;
      padding: 0 0.75rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-full);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
    }
    .marca[aria-pressed='true'] {
      border-color: var(--ucam-color-text-primary);
      font-weight: 650;
    }
```

15. Na classe: `export default class ComponentePage` vira `export default class SiteComponentePage`; `componentePorId(this.id())` vira `sitesComponentePorId(this.id())`; apague `temDemoViva` e `temListaNativa`; `dependentesDe(` vira `sitesDependentesDe(`; acrescente:

```ts
  protected readonly submarcas = sitesMeta.submarcas;
  protected readonly marca = signal<string>('base');
```

    com `signal` importado de `@angular/core` e `sitesMeta` de `'../../spec/sites'`.
16. Em `indice()`: apague a linha `põe(this.temDemoViva() && c.demo?.principal, 'trilho-a', 'Em CSS puro');`. O resto fica igual (as condições continuam espelhando o template).

- [ ] **Step 4: Navegação, rotas e folhas**

`site/src/app/app.component.ts`, em `areas`, depois da área `catalogo`:

```ts
    {
      id: 'sites',
      rotulo: 'Sites',
      icone: 'i-monitor',
      abas: [{ rotulo: 'Componentes', link: '/sites', secoes: ['sites'] }],
    },
```

Em `secoes`, depois do grupo `layout`:

```ts
    {
      id: 'sites',
      titulo: `Sites · ${sitesMeta.componentes}`,
      itens: sitesPorCategoria().flatMap((g) =>
        g.itens.map((c) => ({
          rotulo: c.name,
          link: `/sites/${c.id}`,
          estado: c.status,
          grupo: g.rotulo,
          busca: g.rotulo,
        })),
      ),
    },
```

com `import { sitesMeta, sitesPorCategoria } from './spec/sites';` junto dos imports.

`site/vite.config.ts`, em `specRoutes()`, antes do `return`:

```ts
  // Os sites: o segundo catálogo (ADR-067), de sites/spec/components.
  const SITES = join(import.meta.dirname, '..', 'sites', 'spec', 'components');
  const sites = readdirSync(SITES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => `/sites/${JSON.parse(readFileSync(join(SITES, f), 'utf8')).id}`);
```

e `return [...componentes, ...padroes, ...decisoes, ...telas, ...sites];`.

`site/src/styles.css`, depois de `@import './generated/estados.css';`:

```css
/* Os sites: tokens --ucam-site-*, submarcas e a folha .ucam-site-*, mais o
   espelho de estados. Prefixos próprios; não colidem com a aplicação. */
@import './generated/sites.css';
@import './generated/sites-estados.css';
```

`site/package.json`, no script `generate`, acrescente ao fim da cadeia:

```
 && node ../tools/build-sites-tokens.mjs && node ../tools/build-sites-fonts.mjs && node ../tools/build-sites-css.mjs && node ../tools/build-estados.mjs --entrada ../dist/sites/css/ucam-site.css --saida src/generated/sites-estados.css && node ../tools/validate-sites-spec.mjs && node ../tools/build-sites-index.mjs
```

(Confira que `build-estados` resolve `--entrada`/`--saida` relativos ao cwd `site/`: `join(ROOT, …)` é só para os padrões; argumentos relativos passam pelo `node` como estão. Se o teste da Task 1 passou com caminhos absolutos, use absolutos aqui também: `--entrada "$(pwd)/../dist/…"` não funciona em `package.json`; prefira caminhos relativos e confirme com `pnpm --dir site generate`.)

- [ ] **Step 5: Conferir**

Run:
```bash
node tools/build-sites-index.mjs && node tools/build-estados.mjs --entrada dist/sites/css/ucam-site.css --saida site/src/generated/sites-estados.css
pnpm run validate 2>&1 | tail -3
node tools/check-ancoras.mjs 2>&1 | tail -3
pnpm --dir site exec tsc -p tsconfig.app.json --noEmit 2>&1 | tail -5
```
Expected: `validate` com `✓` (inclui `check-crases`), `check-ancoras` sem erro na página nova, `tsc` sem erro. Erro de tipo em `demo.principal` ou `miniatura` indica que `Componente` precisa do campo — ele já existe em `spec.types.ts`.

- [ ] **Step 6: Commit**

```bash
git add site/src/app/spec/sites.ts site/src/app/pages/sites site/src/app/app.component.ts site/vite.config.ts site/src/styles.css site/package.json
git commit -m "Área Sites no site de docs: lista por categoria, alternador Bordô / CENPRE e a página de componente dos sites

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Pacote, script `sites` completo e o prerender

**Files:**
- Modify: `tools/build-pacotes.mjs` (função `siteCss()` e a lista do `main`)
- Modify: `package.json` (script `sites`)

- [ ] **Step 1: `siteCss()` em `build-pacotes.mjs`**

Depois da função `css()`:

```js
/* --------------------------------------------------------- @ucam/site-css --- */
// O Trilho A dos SITES (ADR-067): tokens --ucam-site-*, submarcas, a folha
// .ucam-site-* e as fontes Work Sans e Inter. Quem consome: o WordPress de
// Campos, o site institucional em Angular 18 e o CENPRE.

function siteCss() {
  if (!exigir(join(DIST, 'sites', 'css', 'ucam-site.css'), 'rode: pnpm run sites')) return null;
  const dir = join(SAIDA, 'site-css');
  mkdirSync(dir, { recursive: true });
  for (const sub of ['css', 'tokens', 'fonts']) {
    const origem = join(DIST, 'sites', sub);
    if (!existsSync(origem)) { erros.push(`dist/sites/${sub} não existe — rode: pnpm run sites`); continue; }
    cpSync(origem, join(dir, sub), { recursive: true });
  }
  const pkg = {
    name: '@ucam/site-css',
    version: VERSAO,
    description: 'Folha de estilo do UCAMDS Sites: tokens, submarcas e classes .ucam-site-* para os sites públicos da UCAM. CSS puro, sem framework.',
    license: 'UNLICENSED',
    sideEffects: ['*.css'],
    exports: {
      './ucam-site.css': './css/ucam-site.css',
      './ucam-site-fonts.css': './css/ucam-site-fonts.css',
      './tokens/*': './tokens/*',
      './fonts/*': './fonts/*',
      './package.json': './package.json',
    },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'LICENSE'), LICENCA, 'utf8');
  writeFileSync(join(dir, 'README.md'), `# @ucam/site-css

O UCAMDS Sites (ADR-067): a folha dos sites públicos da UCAM — institucional,
CENPRE, Campos. CSS puro, mobile-first, sem framework.

\`\`\`html
<link rel="stylesheet" href="node_modules/@ucam/site-css/css/ucam-site-fonts.css">
<link rel="stylesheet" href="node_modules/@ucam/site-css/css/ucam-site.css">

<body class="ucam-site">
  <a class="ucam-site-btn ucam-site-btn--primary" href="/inscricao">Inscreva-se</a>
</body>
\`\`\`

\`ucam-site.css\` já importa os tokens. Para o CENPRE, carregue também a
submarca e marque o elemento raiz:

\`\`\`html
<link rel="stylesheet" href="node_modules/@ucam/site-css/tokens/ucam-site-marca-cenpre.css">
<html data-marca="cenpre">
\`\`\`

SCSS: \`@use 'node_modules/@ucam/site-css/tokens/ucam-site-tokens' as site;\`
expõe \`$ucam-site-*\` e o mapa \`$ucam-site-semantic\`.

Tudo vive sob \`.ucam-site\`. Não há reset global. Os tokens primitivos saem na
folha mas não são para uso: só os semânticos (\`--ucam-site-color-*\`,
\`--ucam-site-typography-*\`…) são públicos (ADR-007).
`, 'utf8');
  return dir;
}
```

E no `main`: `for (const montar of [tokens, css, siteCss, ui, elements, agentes]) {`.

- [ ] **Step 2: O script `sites` completo**

Em `package.json`, o script `sites` vira:

```json
    "sites": "node tools/build-sites-tokens.mjs && node tools/build-sites-fonts.mjs && node tools/build-sites-css.mjs && node tools/build-estados.mjs --entrada dist/sites/css/ucam-site.css --saida site/src/generated/sites-estados.css && node tools/validate-sites-spec.mjs && node tools/build-sites-index.mjs"
```

- [ ] **Step 3: Build inteiro**

Run:
```bash
S="C:/Users/Leonardo/AppData/Local/Temp/claude/c--Users-Leonardo-Documents-DSUCAM/93a7653e-0a9f-47b1-8132-13d018fd557e/scratchpad"
pnpm run build > "$S/build-2a.log" 2>&1; echo "exit $?"; grep -E "✗|error TS|Error:|NG0" "$S/build-2a.log" | head
sh "$S/compara2a.sh"
ls site/dist/analog/public/sites/ site/dist/analog/public/sites/button/
grep -c 'class="ucam-site' site/dist/analog/public/sites/button/index.html
grep -c 'ucam-site-btn--primary' site/dist/analog/public/sites/button/index.html
grep -c 'data-marca' site/dist/analog/public/sites/index.html
grep -o 'aria-pressed="true">[^<]*' site/dist/analog/public/sites/index.html | head -2
```
Expected: `exit 0`, nenhum `✗`; cinco `✓` do comparador; `sites/index.html` e `sites/button/index.html`; contagens maiores que zero nas três; `Bordô UCAM` pressionado.

- [ ] **Step 4: Pacote**

Run: `node tools/build-pacotes.mjs 2>&1 | tail -8 && ls dist/pacotes/site-css`
Expected: a lista inclui `@ucam/site-css` com o `.tgz`, e a pasta tem `css`, `tokens`, `fonts`, `package.json`, `README.md`, `AGENTS.md`. (Se `pnpm run pacotes` exigir `ui/dist/ui`, rode `pnpm run lib` antes, ou confira só a função chamando o script — a exigência do `ui()` é anterior a este plano.)

- [ ] **Step 5: Commit**

```bash
git add tools/build-pacotes.mjs package.json
git commit -m "@ucam/site-css empacotado, e pnpm run sites passa a gerar folha, espelho de estados, validação e índice

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Verificação final e entrega

- [ ] **Step 1: Do zero**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM-sites
rm -rf dist site/src/generated site/src/assets/sites site/dist
pnpm run test:tools 2>&1 | grep -E "^ℹ (pass|fail)"
pnpm run build > "$S/build-2a-final.log" 2>&1; echo "exit $?"
sh "$S/compara2a.sh"
git status --short
```

Expected: `# pass 44`, `exit 0`, cinco `✓`, árvore limpa.

- [ ] **Step 2: Olhar a página**

Run: `node tools/serve.mjs` em segundo plano (ou `pnpm --dir site preview`) e abrir `/sites` e `/sites/button` no navegador; alternar Bordô / CENPRE e ver o botão primário mudar de `#8D293A` para `#922243`. Se houver o roteiro de captura por CDP de `scratchpad/`, uma captura de cada página fica no scratchpad desta sessão. Isto é conferência humana; o critério de aceite automatizado é o da Task 8.

- [ ] **Step 3: README dos sites**

Em `sites/README.md`, troque a seção "Pendências (subprojeto 2)" por:

```markdown
## O que existe (fatia 2a, 08/10/2026)

- `sites/spec/components/` — button, tag, icon-chip, section-heading.
- `sites/spec/demos.json` — preview e código (o mesmo HTML) por peça.
- `tools/validate-sites-spec.mjs`, `tools/build-sites-css.mjs`, `tools/build-sites-index.mjs`.
- `dist/sites/css/ucam-site.css`; `/sites` e `/sites/<id>` no site de docs; pacote `@ucam/site-css`.

## Pendências

- Fatia 2b: avatar, accordion, pagination, input, newsletter-form, breadcrumb, page-shell, site-header, site-footer.
- Fatia 2c: hero, editorial-page-hero, hero-pill, editorial-cta, stats-band, logo-marquee, card, doc-card, step-card, course-card, testimonial, prose.
- Subprojeto 3: `@ucam/site-ui` (Angular 22) e o MCP servindo os sites.
```

```bash
git add sites/README.md
git commit -m "Sites: o que a fatia 2a entregou e o que ficou para 2b, 2c e o subprojeto 3

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 4: Entregar**

A branch `sites-catalogo` não é mergeada por este plano. Entrega: o log de commits, `test:tools`, o comparador e os caminhos prerenderizados.

---

## Self-review (feito ao escrever)

- **Cobertura da spec:** pipeline próprio (Tasks 4, 5, 6); `build-estados` por argumento (1); perfil de contrato (3 e 5); folha com raiz, seção escura, mobile-first e os três portões (4); submarca em invólucro (4); área Sites, lista com alternador, página copiada e enxuta, rotas, folhas (7); pacote (8); byte a byte (0, 8, 9); fatias 2b/2c registradas (9).
- **Placeholders:** nenhum. Os quatro contratos e as demos estão inteiros. A cópia da página de componente é instruída edição por edição, numerada.
- **Consistência de nomes:** `construirCss`/`conferirFolha` (4), `validar` (5), `construirIndice` (6), `sitesComponentePorId`/`sitesPorCategoria`/`sitesDependentesDe`/`sitesMeta` (7), `raiz` nos três componentes (2, 7), `--entrada/--saida` (1, 7, 8).
- **Review Focus:** 1 → Task 5 (`selector "ucam-button" deveria ser`); 2 → Task 5 (`ucam-site-btn--outline`); 3 → Task 4 (`inexistente`, `primitivo`); 4 → Task 5 (`vs` e `ucam-button` em composição); 5 → Task 8 (greps no HTML prerenderizado).
- **Risco conhecido:** o CSS aninhado em `@media` (Task 4) e os argumentos relativos do `build-estados` no `generate` do site (Task 7) têm instrução de recuo caso falhem; nenhum dos dois é bloqueio.
