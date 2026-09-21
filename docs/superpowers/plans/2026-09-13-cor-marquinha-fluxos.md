# Cor onde há dado, marquinha do módulo, login enxuto e fluxos — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KPIs tingidos por significado, ladrilhos de módulo com cor por categoria, faixa com marquinha do módulo e select de campus, login sem texto solto, e toda ação das 15 telas levando a algum lugar ou fazendo algo.

**Architecture:** Tudo nasce no `spec/` (tokens, contratos, templates) e é gerado por `tools/` — CSS do Trilho A em `tools/build-css.mjs`, HTML da moldura em `tools/lib/shell.mjs`, telas em `tools/build-templates.mjs`. Não há framework de teste: os testes são os portões de build (`validate`, `tokens`, `marca`, `css`, `telas`) e sondas CDP no Chrome headless (scratchpad). Não há git neste repositório: cada "commit" abaixo é "reconstruir e rodar o portão".

**Tech Stack:** Node 24 (ESM), CSS gerado por template literal, tokens DTCG em JSON, Angular 21 (`ui/`) só para os tipos de `tone`, Analog (`site/`) para a página de fluxos.

**Spec:** `docs/superpowers/specs/2026-09-13-cor-marquinha-fluxos-design.md`

## Global Constraints

- Nenhum hex fora de `spec/tokens/primitive.json`; nenhum token primitivo referenciado direto na folha (ADR-007 — o portão do `build-css` reprova).
- Media query só por papel (`acima()/abaixo()`), nunca por número.
- Um sinal de superfície + um de tipografia + no máximo um de cor por estado; nada de contorno decorativo.
- A ação primária é o único bordô cheio da tela (ADR-001/023).
- Toast não existe no catálogo: feedback é o próprio controle ou um `.ucam-alert`.
- ADR-030 e ADR-031 estão reservadas pela spec paralela; este plano usa ADR-032 e ADR-033.
- Outra sessão pode estar editando `tools/build-css.mjs` e `tools/lib/shell.mjs`: só Edit pontual, nunca reescrever o arquivo; antes de acusar regressão, `ls -la --time-style=full-iso`.
- Servidores de prova: Chrome `--remote-debugging-port=9391`, telas em `:5214` (`scratchpad/servidor-docs.mjs`), site em `:5213` (`scratchpad/servidor3.mjs`). Se a porta estiver ocupada, é outra sessão — usar outra porta e ajustar `CDP`/`SITE` nos scripts do scratchpad desta sessão (`C:\Users\Leonardo\AppData\Local\Temp\claude\c--Users-Leonardo-Documents-UCAMDS\1d0e1997-0344-469c-b951-f2c73638ed92\scratchpad\`).

---

### Task 1: Papéis de cor — categoria e warning/marca no stat

**Files:**
- Modify: `spec/tokens/semantic.json` (bloco `color`, depois de `chart`)
- Modify: `spec/tokens/theme.dark.json` (bloco `color`)
- Modify: `tools/check-daltonismo.mjs:95-125` (laço das séries)
- Modify: `tools/check-marca-vs-destrutivo.mjs:40-65` (lista de pares)

**Interfaces:**
- Produces: tokens CSS `--ucam-color-categoria-{academico,financeiro,atendimento,gestao,pessoas,acervo}` nos dois temas.

- [ ] **Step 1: Declarar os seis papéis em `semantic.json`**, dentro de `color`, logo após o objeto `chart`:

```json
"categoria": {
  "$type": "color",
  "$description": "Cor de CATEGORIA de módulo: o que discrimina irmãos numa grade de 58 sistemas em que dez ícones se repetem. Pinta o ladrilho de ícone (fundo a 12%, traço na cor) e a marquinha do módulo na faixa. Categoria classifica; não julga — é a distinção que o contrato do stat faz entre tom e categoria. Seis papéis, cada um apontando para um primitivo que já existe: nenhuma rampa nova (ADR-032).",
  "academico": { "$value": "{blue.500}", "$description": "Acadêmico, biblioteca, vestibular, diplomas." },
  "financeiro": { "$value": "{green.500}", "$description": "Financeiro, caixa, mensalidades, bolsas." },
  "atendimento": { "$value": "{wine.500}", "$description": "Protocolo, ouvidoria, requerimentos — o atendimento é a cara da instituição, e leva a marca." },
  "gestao": { "$value": "{violet.500}", "$description": "Gerencial, relatórios, portal, parâmetros." },
  "pessoas": { "$value": "{teal.500}", "$description": "RH, funcionários, área do aluno, memorial." },
  "acervo": { "$value": "{ochre.500}", "$description": "Arquivo permanente, documentos, impressão." }
}
```

- [ ] **Step 2: Escuro em `theme.dark.json`**, no mesmo lugar do bloco `color`:

```json
"categoria": {
  "academico": { "$value": "{blue.400}" },
  "financeiro": { "$value": "{green.500}" },
  "atendimento": { "$value": "{wine.400}" },
  "gestao": { "$value": "{violet.400}" },
  "pessoas": { "$value": "{teal.400}" },
  "acervo": { "$value": "{ochre.400}" }
}
```

- [ ] **Step 3: Portão de daltonismo confere as categorias.** Em `tools/check-daltonismo.mjs`, depois do laço das séries (dentro do `for` de temas), acrescentar:

```js
  const CATEGORIAS = ['academico', 'financeiro', 'atendimento', 'gestao', 'pessoas', 'acervo'];
  const cats = CATEGORIAS.map((c) => resolve(`var(--ucam-color-categoria-${c})`, mapa).toUpperCase());
  if (cats.every((h) => /^#[0-9A-F]{6}$/.test(h))) {
    for (const tipo of TIPOS) {
      const sim = cats.map((h) => ver(h, tipo));
      for (let i = 0; i < sim.length; i++) for (let j = i + 1; j < sim.length; j++) {
        const d = distancia(sim[i], sim[j]);
        if (d < LIMITE_TODOS) desvios.push(`[${tema}] ${tipo}: categorias ${CATEGORIAS[i]} e ${CATEGORIAS[j]} a d=${d.toFixed(3)} (mínimo ${LIMITE_TODOS}) — o ícone e o nome escrito carregam a distinção; a cor é reforço`);
      }
    }
    relatos.push(`  [${tema}] 6 categorias conferidas entre si`);
  }
```

- [ ] **Step 4: Portão marca × destrutivo ganha o par** em `tools/check-marca-vs-destrutivo.mjs`, na lista de pares:

```js
  ['categoria de atendimento × tinta de erro', 'categoria-atendimento', 'feedback-danger-foreground'],
```

- [ ] **Step 5: Gerar e conferir**

Run: `pnpm run tokens && pnpm run marca`
Expected: `✓` nos dois; `grep -c "categoria-" dist/tokens/ucam-tokens.css` devolve 12 (6 claro + 6 escuro). Se `marca` reprovar o par de atendimento: trocar `atendimento` para `{teal.500}` (escuro `{teal.400}`) e `pessoas` para `{blue.400}`/`{blue.400}`, e registrar na `$description`.

---

### Task 2: CSS e contratos — stat tingido, ladrilho por categoria

**Files:**
- Modify: `tools/build-css.mjs:2353` (`.ucam-icon-tile--marca`) e `:6780-6781` (`.ucam-stat--success/--danger`)
- Modify: `spec/components/stat.json:100-127` (prop `tone`)
- Modify: `spec/components/icon-tile.json:54-75` (prop `tone`), `:76-81` (`size`)
- Modify: `ui/projects/ui/src/lib/ucam/stat/ucam-stat.ts` e `ui/projects/ui/src/lib/ucam/icon-tile/ucam-icon-tile.ts` (tipos de `tone`)

**Interfaces:**
- Produces: classes `.ucam-stat--warning`, `.ucam-stat--marca`; `.ucam-icon-tile--sm`; `.ucam-icon-tile--academico|financeiro|atendimento|gestao|pessoas|acervo`.

- [ ] **Step 1: Ladrilho.** Substituir o bloco `.ucam-icon-tile--marca { … }` por:

```css
.ucam-icon-tile--marca {
  background: color-mix(in srgb, var(--ucam-color-action-primary-default) 12%, transparent);
  color: var(--ucam-color-action-primary-default);
}

/* CATEGORIA (ADR-032). O ladrilho neutro existe porque cor de marca repetida
 * 25 vezes não discrimina. Cor de CATEGORIA discrimina: seis tintas para 58
 * módulos em que dez ícones se repetem — o capelo do Acadêmico e o do
 * Vestibular passam a ser azul e azul, mas o Financeiro ao lado é verde. A
 * receita é a mesma do --marca: fundo a 12%, traço na cor. */
.ucam-icon-tile--academico   { --ucam-tile-cor: var(--ucam-color-categoria-academico); }
.ucam-icon-tile--financeiro  { --ucam-tile-cor: var(--ucam-color-categoria-financeiro); }
.ucam-icon-tile--atendimento { --ucam-tile-cor: var(--ucam-color-categoria-atendimento); }
.ucam-icon-tile--gestao      { --ucam-tile-cor: var(--ucam-color-categoria-gestao); }
.ucam-icon-tile--pessoas     { --ucam-tile-cor: var(--ucam-color-categoria-pessoas); }
.ucam-icon-tile--acervo      { --ucam-tile-cor: var(--ucam-color-categoria-acervo); }

.ucam-icon-tile[class*="ucam-icon-tile--"]:not(.ucam-icon-tile--marca):not(.ucam-icon-tile--sm) {
  background: color-mix(in srgb, var(--ucam-tile-cor) 12%, transparent);
  color: var(--ucam-tile-cor);
}

/* 28px: a marquinha da faixa e a fileira densa. Ícone no degrau miúdo. */
.ucam-icon-tile--sm {
  inline-size: var(--ucam-size-control-sm);
  block-size: var(--ucam-size-control-sm);
  border-radius: var(--ucam-radius-control-sm);
}
.ucam-icon-tile--sm .ic { inline-size: var(--ucam-size-icon-sm); block-size: var(--ucam-size-icon-sm); }
```

  (Confirmar que `--ucam-tile-cor` entra no portão como variável de bloco: o gerador aceita `--ucam-*` declaradas na própria folha — ver `--ucam-col-x`.)

- [ ] **Step 2: Stat.** Substituir as duas linhas `.ucam-stat--success .ucam-stat__value { … }` / `.ucam-stat--danger …` por:

```css
/* O TOM PINTA O LADRILHO (ADR-032). Até 13/09/2026 pintava só o número, e o
 * contrato dizia que fundo colorido em quatro ladrilhos vira faixa de cor.
 * Vira, quando os quatro têm cor: a regra que fica é que o tom vem do DADO —
 * um painel de quatro contagens neutras continua branco, e o que carrega
 * julgamento (atrasado, vencido, concluído) ou é o número-título (marca)
 * ganha fundo no degrau 100 e número no 700. Dois sinais, nenhum contorno. */
.ucam-stat--success { background: var(--ucam-color-feedback-success-background); }
.ucam-stat--warning { background: var(--ucam-color-feedback-warning-background); }
.ucam-stat--danger  { background: var(--ucam-color-feedback-danger-background); }
.ucam-stat--marca   { background: var(--ucam-color-action-primary-subtle); }
.ucam-stat--success .ucam-stat__value { color: var(--ucam-color-feedback-success-foreground); }
.ucam-stat--warning .ucam-stat__value { color: var(--ucam-color-feedback-warning-foreground); }
.ucam-stat--danger  .ucam-stat__value { color: var(--ucam-color-feedback-danger-foreground); }
.ucam-stat--marca   .ucam-stat__value { color: var(--ucam-color-action-primary-default); }
/* A pastilha de variação não pode ser cinza sobre fundo tinto: vira o próprio
 * fundo do cartão, mais escuro por mistura com a tinta. */
.ucam-stat[class*="ucam-stat--"] .ucam-stat__delta {
  background: color-mix(in srgb, currentColor 10%, transparent);
  color: inherit;
}
```

- [ ] **Step 3: Contratos.** Em `stat.json`, `tone.tipo` → `"'neutral' | 'success' | 'warning' | 'danger' | 'marca'"`; `descricao` → `"Julgamento sobre o número. Pinta o LADRILHO (fundo no degrau 100) e o valor (700) quando o número carrega julgamento; neutral continua branco. Quatro ladrilhos neutros lado a lado ficam brancos — o tom vem do dado, nunca da posição (ADR-032)."`; acrescentar em `valores`:

```json
"warning": {
  "uso": "O número pede atenção sem ser desfecho: atrasados, a vencer, prazo curto.",
  "tokens": { "fundo": "color.feedback.warning.background", "valor": "color.feedback.warning.foreground" }
},
"marca": {
  "uso": "O número-título do painel — o total, os abertos, o saldo do dia. Um por painel.",
  "limite": "Nunca mais de um ladrilho de marca no mesmo grupo.",
  "tokens": { "fundo": "color.action.primary.subtle", "valor": "color.action.primary.default" }
}
```

  e acrescentar `"fundo"` nos tokens de `success` e `danger`. Em `icon-tile.json`, `tone.tipo` → `"'neutral' | 'brand' | 'academico' | 'financeiro' | 'atendimento' | 'gestao' | 'pessoas' | 'acervo'"` com o valor:

```json
"categoria": {
  "uso": "academico, financeiro, atendimento, gestao, pessoas, acervo: a categoria do módulo, em toda grade e na marquinha da faixa. Discrimina irmãos — é o oposto de brand, que destaca um.",
  "tokens": { "fundo": "color.categoria.{nome} a 12%", "icone": "color.categoria.{nome}" }
}
```

  e em `size`, `"sm é 28px, a marquinha do módulo na faixa e a fileira densa"`.

- [ ] **Step 4: Angular.** Em `ucam-stat.ts`, o tipo `UcamStatTone` ganha `'warning' | 'marca'` e as classes correspondentes; em `ucam-icon-tile.ts`, `UcamIconTileTone` ganha os seis nomes e o `computed` de classes emite `ucam-icon-tile--${tone}` para eles (brand continua → `--marca`).

- [ ] **Step 5: Reconstruir**

Run: `pnpm run validate && pnpm run css && pnpm --dir ui run build`
Expected: os três passam; `grep -c "ucam-stat--warning" dist/css/ucam.css` ≥ 2.

---

### Task 3: Templates — tom dos KPIs, categoria dos módulos, login enxuto

**Files:**
- Modify: `spec/templates.json` (campo `preview` de gerencial, analytics, movimento-caixa, calculo-mensalidade, resultado, grade-modulos, login; `notas` do login)
- Create (scratchpad, descartável): `aplica-templates.mjs`

**Interfaces:**
- Consumes: classes da Task 2.

- [ ] **Step 1: Escrever o script de edição** (lê e grava `templates.json` no mesmo instante; nunca reescrever à mão um preview de 5 KB):

```js
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'C:/Users/Leonardo/Documents/UCAMDS/spec/templates.json';
const t = JSON.parse(readFileSync(P, 'utf8'));
const tela = (pid, tid) => t.projetos.find((p) => p.id === pid).templates.find((x) => x.id === tid);
const tom = (pid, tid, rotulo, classe) => {
  const x = tela(pid, tid);
  const antes = x.preview;
  x.preview = antes.replace(new RegExp(`<div class='ucam-stat(?: ucam-stat--[a-z]+)?'([^>]*)><span class='ucam-stat__label'>${rotulo}<`), `<div class='ucam-stat ucam-stat--${classe}'$1><span class='ucam-stat__label'>${rotulo}<`);
  if (x.preview === antes) throw new Error(`não achei "${rotulo}" em ${pid}/${tid}`);
};
tom('protocolo', 'gerencial', 'Requerimentos abertos', 'marca');
tom('protocolo', 'gerencial', 'Atrasados', 'warning');
tom('protocolo', 'gerencial', 'Urgentes sem resposta', 'danger');
tom('protocolo', 'gerencial', 'Concluídos no mês', 'success');
tom('protocolo', 'analytics', 'Abertos no período', 'marca');
tom('protocolo', 'analytics', 'Concluídos', 'success');
tom('protocolo', 'analytics', 'Vencidos agora', 'danger');
tom('sigfin', 'movimento-caixa', 'Saldo do dia', 'marca');
tom('sigfin', 'movimento-caixa', 'Total recebido', 'success');
tom('sigfin', 'movimento-caixa', 'Total de saída', 'danger');
tom('sigfin', 'calculo-mensalidade', 'Pagando até 05/09/2026', 'success');
tom('sigfin', 'calculo-mensalidade', 'Depois de 10/09/2026', 'warning');
tom('relatorios', 'resultado', 'Matriculados', 'marca');
tom('relatorios', 'resultado', 'Trancados', 'warning');
// Evadidos já é --danger; Formados fica neutro (é contagem, não julgamento).
writeFileSync(P, JSON.stringify(t, null, 2) + '\n');
```

  Cada `meta` desses ladrilhos tem de dizer a leitura em palavra (WCAG 1.4.1): conferir com `grep -o "ucam-stat--warning'[^§]\{0,400\}ucam-stat__meta'>[^<]*"` que existe meta; onde não houver (`Trancados`, `Depois de 10/09`), acrescentar `<span class='ucam-stat__meta'>…</span>` com a frase do dado ("a vencer", "acima do esperado").

- [ ] **Step 2: Categoria nos 58 cartões do Portal.** No mesmo script, mapa por título → categoria e substituição de `<span class='ucam-icon-tile'>` pelo `<span class='ucam-icon-tile ucam-icon-tile--{cat}'>` no cartão cujo `ucam-card__titulo` vem logo depois:

```js
const CAT = { 'Protocolo': 'atendimento', 'Ouvidoria': 'atendimento', 'Financeiro': 'financeiro', 'Bolsas': 'financeiro', 'Caixa': 'financeiro',
  'Acadêmico graduação': 'academico', 'Acadêmico pós-graduação e extensão': 'academico', 'Biblioteca': 'academico', 'Vestibular': 'academico', 'Diplomas': 'academico', 'Estágio': 'academico',
  'Relatórios': 'gestao', 'Gerencial': 'gestao', 'Portal': 'gestao', 'Parâmetros': 'gestao',
  'Área do aluno': 'pessoas', 'Funcionários': 'pessoas', 'RH': 'pessoas', 'Memorial': 'pessoas',
  'Arquivo permanente': 'acervo', 'Documentos': 'acervo', 'Impressão': 'acervo' };
const g = tela('portal', 'grade-modulos');
g.preview = g.preview.replace(/<span class='ucam-icon-tile'>(<svg[\s\S]*?<\/svg><\/span>[\s\S]*?ucam-card__titulo'>(?:<a[^>]*>)?)([^<]*)/g, (m, meio, titulo) => {
  const chave = Object.keys(CAT).find((k) => titulo.startsWith(k)) ;
  return `<span class='ucam-icon-tile${chave ? ' ucam-icon-tile--' + CAT[chave] : ''}'>` + meio + titulo;
});
```

  Depois de rodar: `grep -o "ucam-icon-tile ucam-icon-tile--[a-z]*" docs/t/portal-grade-modulos.html | sort | uniq -c` — todos os 62 cartões com categoria; título sem chave no mapa → acrescentar ao mapa, não deixar neutro.

- [ ] **Step 3: Login.** No mesmo script:

```js
const l = tela('portal', 'login');
l.preview = l.preview
  .replace(/<p class='ucam-login__campi'>[^<]*<\/p>/, '')
  .replace(/<p class='ucam-login__apoio-frase'>[^<]*<\/p>/, '')
  .replace("<div class='ucam-login__apoio'><span>Universidade Candido Mendes · 2026</span><span>Problemas para entrar? ", "<p class='ucam-login__apoio'><span>Universidade Candido Mendes · 2026</span><span aria-hidden='true'>·</span><span>Problemas para entrar? ")
  .replace("Fale com o suporte</a></span></div></div><aside", "Fale com o suporte</a></span></p></div><aside")
  .replace("Use o CPF cadastrado na universidade, com ou sem pontos.", "Com ou sem pontos.");
l.notas.push('Em 13/09/2026 saíram a linha de campi e a frase de apoio da coluna institucional: cinco textos soltos numa tela de dois campos. A frase institucional fica sozinha; a janela ilustra o que a frase de apoio repetia. O rodapé da coluna de acesso virou uma linha só.');
```

  Na folha (`build-css.mjs:9420-9429`, `9469-9474`): `.ucam-login__apoio` deixa de empurrar o último filho (`> :last-child { margin-inline-start: auto }` sai; a linha lê corrida, com `gap: var(--ucam-space-inline-sm)`); remover `.ucam-login__campi { grid-row: 5; }`, `.ucam-login__campi { … }` e `.ucam-login__apoio-frase { … }`; `grid-template-rows` da coluna institucional perde a última linha (`1fr auto auto 1fr`).

- [ ] **Step 4: Reconstruir e olhar**

Run: `node scratchpad/aplica-templates.mjs && pnpm run validate && pnpm run telas`
Expected: validador passa (classe órfã reprova — se `ucam-login__campi` continuar citada em `demos.json` ou num contrato, tirar de lá também). Capturar `protocolo-gerencial`, `protocolo-analytics`, `portal-grade-modulos`, `portal-login` a 1440 nos dois temas (`node sonda-resp.mjs <tela> 1440 light 1440` e `… dark 1440`) e conferir: KPI tinto com número no 700, ladrilhos coloridos, login sem a linha de campi.

---

### Task 4: Faixa — marquinha do módulo e select de campus

**Files:**
- Modify: `spec/templates.json` (cada `projetos[i]` ganha `icone` e `categoria`; `shell.campusOpcoes` continua)
- Modify: `tools/lib/shell.mjs:155-200` (opções `logo`, novas `moduloIcone`, `moduloCategoria`), `:450-487` (chip/menu de campus → select), `:991-998` (cabeça da gaveta), `:1040-1056` (marca da faixa), `:1294+` (`shellDaTela` repassa `projeto.icone`/`categoria`)
- Modify: `tools/build-css.mjs:3473-3530` (`.ucam-appbar__context*` sai; entra `.ucam-select--faixa`), `:3508-3516` e `:3540-3560` (regras de largura estreita: só `.ucam-appbar--lockup`), `:5118-5140` (gaveta com lockup + campus), `:3570-3572` (`.ucam-menu--campus` sai)
- Modify: `tools/lib/select-listbox.mjs:107+` (`listboxScript`: ao escolher, escreve `data-campus` se o gatilho tiver `data-campus-select`)
- Modify: `spec/components/app-shell.json` (anatomia: marca do módulo; `contextOptions` vira select)

**Interfaces:**
- Consumes: `.ucam-icon-tile--sm`, `.ucam-icon-tile--{cat}` (Task 2).
- Produces: markup `<a class="ucam-appbar__brand"><span class="ucam-icon-tile ucam-icon-tile--sm ucam-icon-tile--{cat}" aria-hidden="true"><svg class="ic"><use href="#i-{icone}"/></svg></span><span class="ucam-appbar__system">{sistema}</span></a>`; `<span class="ucam-select-wrap ucam-select-wrap--faixa"><label class="ucam-sr-only" for="{navId}-campus">Campus</label><select class="ucam-select ucam-select--faixa" id="{navId}-campus" data-campus-select>…</select></span>` (o `listboxSelects()` de `build-templates` converte em gatilho + listbox como todo select).

- [ ] **Step 1: Projetos declaram a marquinha** em `templates.json`: `protocolo: {icone:'clipboardList', categoria:'atendimento'}`, `portal: {icone:'layoutGrid', categoria:'gestao', lockup:true}`, `sigfin: {icone:'wallet', categoria:'financeiro'}`, `relatorios: {icone:'chartColumn', categoria:'academico'}`. Em `shellDaTela`, `return { ...base, moduloIcone: projeto.icone ?? null, moduloCategoria: projeto.categoria ?? null, logo: !!projeto.lockup, … }`.

- [ ] **Step 2: Marca da faixa** em `renderShell` (bloco `linkOuMarca(inicio, 'ucam-appbar__brand', …)`): com `logo` verdadeiro, emitir lockup + filete + nome como hoje e a classe `ucam-appbar--lockup` no `<header>`; senão, emitir o ladrilho:

```js
(moduloIcone
  ? `<span class="ucam-icon-tile ucam-icon-tile--sm${moduloCategoria ? ' ucam-icon-tile--' + esc(moduloCategoria) : ''}" aria-hidden="true">${ic(moduloIcone)}</span>`
  : '') + `<span class="ucam-appbar__system">${esc(sistema)}</span>`
```

  Na folha, as regras `.ucam-appbar__brand { min-inline-size: calc(var(--ucam-appbar-logo-width) …) }`, `.ucam-appbar__brand .ucam-appbar__divider`, e o bloco `abaixo('controle-deitado')` que esconde `__system` passam a ser prefixadas por `.ucam-appbar--lockup`; sem lockup a marca é `flex: 0 1 auto; min-inline-size: 0` e o nome trunca.

- [ ] **Step 3: Campus vira select.** Substituir `chipCampus`/`menuCampus` por:

```js
const chipCampus = campus
  ? `<span class="ucam-select-wrap ucam-select-wrap--faixa"><label class="ucam-sr-only" for="${esc(idCampus)}">Campus</label>` +
    `<select class="ucam-select ucam-select--faixa" id="${esc(idCampus)}" data-campus-select>` +
    (opcoesCampus.length ? opcoesCampus : [campus]).map((c) => `<option${c === campus ? ' selected' : ''}>${esc(c)}</option>`).join('') +
    `</select></span>`
  : '';
```

  `listboxSelects()` já transforma isso em gatilho + listbox. Em `listboxScript`, na função que escolhe a opção, acrescentar: `if (gatilho.hasAttribute('data-campus-select')) { var sh = gatilho.closest('.ucam-shell'); if (sh) sh.dataset.campus = texto; }`. CSS:

```css
/* CAMPUS É UM SELECT (ADR-033): a mesma peça que a pessoa já usa em todo
 * formulário, e não um chip com chevron que abria um menu. Largura pelo
 * conteúdo, altura do controle da faixa, tinta da faixa. */
.ucam-select-wrap--faixa { flex: 0 1 auto; min-inline-size: 0; }
.ucam-select--faixa {
  inline-size: auto;
  max-inline-size: 100%;
  block-size: var(--ucam-size-control-sm);
  padding-inline-end: calc(var(--ucam-space-inset-sm) + var(--ucam-size-icon-sm) + var(--ucam-space-inline-xs));
  background-color: transparent;
  border-color: var(--ucam-appbar-control-line, var(--ucam-color-border-subtle));
  color: var(--ucam-appbar-fg, var(--ucam-color-text-primary));
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: var(--ucam-size-control-sm);
}
.ucam-select--faixa:hover:not(:disabled) { background-color: var(--ucam-appbar-hover); border-color: var(--ucam-appbar-control-line-strong); }
```

  Manter `abaixo('faixa-minima') { .ucam-select-wrap--faixa { display: none } }`. Remover `.ucam-appbar__context`, `__context-label`, `__context-value`, `__contexto`, `__chevron` da folha e `.ucam-menu--campus`; `pnpm run validate` acusa se alguma demo ainda cita.

- [ ] **Step 4: Gaveta.** `cabecaGaveta` passa a emitir `<span class="ucam-nav__gaveta-marca" aria-hidden="true"></span>` (máscara `--ucam-appbar-logo`, 4.5rem × 0.8125rem — as mesmas medidas de `faixa-minima`) antes do nome, e, se `campus`, uma linha `<p class="ucam-nav__gaveta-campus">Campus · {campus}</p>` abaixo do cabeçalho, visível só `abaixo('faixa-minima')` (quando o select saiu da faixa). Rodapé do shell (`.ucam-shell__footer`): prefixar o texto com a marca em máscara, `.ucam-shell__footer-marca`, 5.5rem de largura, tinta `text.secondary`.

- [ ] **Step 5: Reconstruir e provar**

Run: `pnpm run validate && pnpm run css && pnpm run telas`; depois no scratchpad `node prova-campus.mjs protocolo-gerencial 1440` (novo, molde de `prova-gaveta.mjs`): clica o gatilho `#nav-gerencial-campus`, lê `aria-expanded=true` e o listbox visível; `Input.dispatchKeyEvent` ArrowDown + Enter; lê o texto do gatilho = "Rio de Janeiro" e `shell.dataset.campus`; Esc fecha e `document.activeElement === gatilho`.
Expected: as cinco leituras verdadeiras; `node sonda-resp.mjs all 320,480 x` sem `pag+` positivo.

---

### Task 5: Fluxos — links, ações desabilitadas com motivo, ações in-page

**Files:**
- Modify: `spec/templates.json` (previews das telas listadas; bloco `fluxos` novo em cada template)
- Modify: `tools/lib/shell.mjs:1834+` (`estadoScript`: tratadores novos)
- Modify: `tools/build-css.mjs` (regra `.ucam-btn[aria-disabled="true"]`)
- Modify: `spec/schema/*.json` se o template tiver schema fechado (`pnpm run validate` diz)

**Interfaces:**
- Produces: atributos `data-fluxo="{a|b|c}"` em cada botão auditado; `data-acao="{encaminhar|concluir|anexar|responder|arquivar|reativar|limpar-filtros|limpar-busca|etapa-voltar|etapa-continuar|calcular|salvar|limpar-campos|copiar}"` para as ações (c).

- [ ] **Step 1: Convenção de desabilitado com motivo** na folha, ao lado de `.ucam-card__link[aria-disabled]`:

```css
/* AÇÃO SEM DESTINO NESTE CONJUNTO (ADR-033). Botão que não faz nada é a
 * promessa falsa que o parque tem aos montes; disabled some do teclado e do
 * leitor. aria-disabled fica alcançável, diz o motivo por title e não pinta
 * de cinza morto: tinta secundária, cursor not-allowed. */
.ucam-btn[aria-disabled="true"] { color: var(--ucam-color-text-secondary); cursor: not-allowed; }
.ucam-btn[aria-disabled="true"]:hover { background: inherit; }
```

- [ ] **Step 2: Editar os previews** no `aplica-templates.mjs` (continuação), por regra de texto do botão. Classe (b) — `aria-disabled='true' title='Tela não desenhada neste conjunto' data-fluxo='b'` — em: `Exportar`, `Exportar período`, `Imprimir`, `Imprimir requerimento`, `Imprimir o relatório`, `Imprimir boleto`, `Enviar por e-mail`, `Conta Microsoft`, `Conta Google`, `Fechar caixa`, `Novo integrante`, `Editar <pessoa>` (listagem-setores), `Anexar arquivo`, `Anexar`. Classe (a) — vira `<a class='ucam-btn …' href='#/templates/…' data-fluxo='a'>`: `Novo setor` e `Editar setor` → `protocolo/parametros-setores`; `Nova natureza` e `Editar a natureza X` → `protocolo/parametros-setores` com `title='Cadastro de natureza usa o mesmo formulário de parâmetros neste conjunto'`; `Registrar lançamento` → (b) com `title='Lançamento abre em diálogo na aplicação; não desenhado aqui'`; `Trocar requerente` → âncora `#nr-al-r` (mesma tela) com `data-fluxo='c' data-acao='etapa-voltar'`. Classe (c) — `data-fluxo='c' data-acao='…'`: `Encaminhar`→`encaminhar`, `Concluir`→`concluir`, `Enviar resposta`→`responder`, `Arquivar a natureza X`→`arquivar`, `Reativar a natureza X`→`reativar`, `Limpar filtros`→`limpar-filtros`, `Remover filtro X` (já é botão do chip)→`remover-filtro`, `Limpar busca`→`limpar-busca`, `Voltar`/`Continuar para revisão`→`etapa-voltar`/`etapa-continuar`, `Calcular mensalidade`→`calcular`, `Salvar setor`→`salvar`, `Limpar campos`/`Limpar`→`limpar-campos`, `Copiar linha digitável`→`copiar`. Cada regex é `replace` com verificação de que casou (lançar erro se não).

- [ ] **Step 3: Tratadores em `estadoScript`** (delegação no `document`, antes do tratador da estrela):

```js
    var acao = t.closest('[data-acao]');
    if (acao && acao.getAttribute('aria-disabled') !== 'true') {
      var qual = acao.getAttribute('data-acao');
      var selo = function (txt, tom) {
        var s = document.querySelector('.ucam-viewbar .ucam-badge, .ucam-card .ucam-badge');
        if (!s) return;
        s.className = 'ucam-badge ucam-badge--' + tom;
        s.innerHTML = "<span class='ucam-badge__ponto' aria-hidden='true'></span>" + txt;
      };
      var evento = function (txt) {
        var tl = document.querySelector('.ucam-timeline');
        if (!tl) return;
        var li = document.createElement('li');
        li.className = 'ucam-timeline__item';
        li.innerHTML = "<span class='ucam-timeline__marcador' aria-hidden='true'></span><div class='ucam-timeline__corpo'><p class='ucam-timeline__titulo'>" + txt + "</p><p class='ucam-timeline__meta'>agora · você</p></div>";
        tl.insertBefore(li, tl.firstElementChild);
        li.setAttribute('role', 'status');
      };
      if (qual === 'encaminhar') { selo('Encaminhado', 'info'); evento('Encaminhado para o setor responsável'); }
      if (qual === 'concluir') { selo('Concluído', 'success'); evento('Requerimento concluído'); acao.setAttribute('aria-disabled', 'true'); }
      if (qual === 'responder') { var ta = document.getElementById('rd-resp'); if (ta && ta.value.trim()) { evento('Resposta enviada ao requerente'); ta.value = ''; } else if (ta) { ta.focus(); } }
      if (qual === 'arquivar' || qual === 'reativar') {
        var tr = acao.closest('tr'); var b = tr && tr.querySelector('.ucam-badge');
        var arquivar = qual === 'arquivar';
        if (b) { b.className = 'ucam-badge ucam-badge--' + (arquivar ? 'neutral' : 'success'); b.innerHTML = "<span class='ucam-badge__ponto' aria-hidden='true'></span>" + (arquivar ? 'Arquivada' : 'Ativa'); }
        acao.setAttribute('data-acao', arquivar ? 'reativar' : 'arquivar');
        acao.setAttribute('aria-label', acao.getAttribute('aria-label').replace(arquivar ? 'Arquivar' : 'Reativar', arquivar ? 'Reativar' : 'Arquivar'));
        var u = acao.querySelector('use'); if (u) u.setAttribute('href', arquivar ? '#i-refreshCw' : '#i-archive');
        tr && tr.classList.add('ucam-realce'); setTimeout(function () { tr && tr.classList.remove('ucam-realce'); }, 1200);
      }
      if (qual === 'limpar-filtros' || qual === 'remover-filtro') {
        var chips = qual === 'remover-filtro' ? [acao.closest('.ucam-chip')] : Array.prototype.slice.call(document.querySelectorAll('.ucam-viewbar__fileira--filtros .ucam-chip'));
        chips.forEach(function (c) { c && c.remove(); });
        var n = document.querySelectorAll('.ucam-viewbar__fileira--filtros .ucam-chip').length;
        var cont = document.querySelector('[data-filtros-contagem]'); if (cont) cont.textContent = n ? 'Filtros ' + n : 'Filtros';
        if (!n) { var fila = document.querySelector('.ucam-viewbar__fileira--filtros'); fila && (fila.hidden = true); }
      }
      if (qual === 'limpar-busca') { var inp = document.querySelector('.ucam-input-group__controle[type=search], input[type=search]'); if (inp) { inp.value = ''; inp.focus(); } }
      if (qual === 'etapa-voltar' || qual === 'etapa-continuar') {
        var passos = Array.prototype.slice.call(document.querySelectorAll('.ucam-stepper__passo'));
        var i = passos.findIndex(function (p) { return p.classList.contains('ucam-stepper__passo--current'); });
        var j = qual === 'etapa-voltar' ? Math.max(0, i - 1) : Math.min(passos.length - 1, i + 1);
        passos.forEach(function (p, k) { p.classList.toggle('ucam-stepper__passo--done', k < j); p.classList.toggle('ucam-stepper__passo--current', k === j); if (k === j) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current'); var sr = p.querySelector('.ucam-sr-only'); if (sr) sr.textContent = ', etapa ' + (k + 1) + ' de ' + passos.length + ', ' + (k < j ? 'concluída' : k === j ? 'atual' : 'pendente'); });
        var alvo = document.querySelector('.ucam-viewbar__titulo') || document.querySelector('h1'); alvo && alvo.focus && alvo.focus();
      }
      if (qual === 'calcular') { var res = document.querySelector('.ucam-section:has(.ucam-section__title)'); var secs = document.querySelectorAll('.ucam-section'); var ult = secs[secs.length - 1]; if (ult) { ult.hidden = false; ult.classList.add('ucam-realce'); ult.scrollIntoView({ block: 'start' }); setTimeout(function () { ult.classList.remove('ucam-realce'); }, 1200); } }
      if (qual === 'salvar') { var linha = document.querySelector('tr[aria-selected="true"]'); if (linha) { linha.classList.add('ucam-realce'); setTimeout(function () { linha.classList.remove('ucam-realce'); }, 1200); } acao.textContent = 'Salvo'; setTimeout(function () { acao.innerHTML = "<svg class='ic' aria-hidden='true'><use href='#i-check'/></svg> Salvar setor"; }, 2000); }
      if (qual === 'limpar-campos') { var f = acao.closest('form') || document.querySelector('form'); if (f) f.reset(); }
      if (qual === 'copiar') { var dd = document.querySelector('dd[data-linha-digitavel]') || acao.closest('.ucam-card, section').querySelector('dd'); var txt = dd ? dd.textContent.trim() : ''; var feito = function () { var antes = acao.innerHTML; acao.textContent = 'Copiado'; setTimeout(function () { acao.innerHTML = antes; }, 2000); }; if (navigator.clipboard && txt) navigator.clipboard.writeText(txt).then(feito, feito); else feito(); }
      return;
    }
```

  (`.ucam-realce` é a classe do componente realce — conferir em `spec/components/realce.json` o nome exato da raiz; se for `ucam-realce--pisca`, usar esse.) No `analise-requerimento`, o botão "Filtros 2" ganha `data-filtros-contagem`; no `calculo-mensalidade`, a seção Resultado nasce `hidden` só se a tela canônica deve mostrar repouso — a nota da tela diz que mostra o resultado calculado, então NÃO esconder: `calcular` só pisca e rola.

- [ ] **Step 4: Bloco `fluxos` por template** (fonte da tabela do site), acrescentado pelo script a cada template, na forma:

```json
"fluxos": {
  "chega_de": ["portal/grade-modulos", "protocolo/analise-requerimento"],
  "acoes": [
    { "rotulo": "Encaminhar", "classe": "c", "efeito": "Selo vira Encaminhado; evento entra na linha do tempo." },
    { "rotulo": "Imprimir requerimento", "classe": "b", "efeito": "Sem tela de impressão neste conjunto." }
  ]
}
```

  `chega_de` é derivado: todo template cujo preview ou shell aponta esta tela. O script monta isso lendo `#/templates/{p}/{t}` de todos os previews mais `porNav`.

- [ ] **Step 5: Página `/telas/` do site.** Em `site/src/app/pages/telas/index.page.ts`, abaixo da grade de cada projeto, uma `<details class="fluxos">` com tabela `Tela | Chega de | Ação | Classe | Efeito` lida de `meta.projetos[i].templates[j].fluxos` (conferir em `site/src/generated/spec.data.json` que `build-index.mjs` repassa o campo; se filtrar campos, acrescentar `fluxos` à lista).

- [ ] **Step 6: Reconstruir e provar**

Run: `node scratchpad/aplica-templates.mjs && pnpm run validate && pnpm run css && pnpm run telas && pnpm run indice`; no scratchpad, `node prova-fluxos.mjs` (novo): para cada tela, para cada `[data-fluxo]`, (a) o href resolve para arquivo em `docs/t/` (`fetch` HEAD 200); (b) `aria-disabled=true` e `title` não vazio; (c) clica e afirma o eco: `encaminhar` → selo "Encaminhado"; `arquivar` → selo "Arquivada" e `data-acao=reativar`; `limpar-filtros` → 0 chips; `etapa-continuar` → terceiro passo `aria-current=step`; `copiar` → texto "Copiado".
Expected: zero falhas na saída do script; `pnpm run site` passa e `/telas/` mostra as tabelas.

---

### Task 6: ADRs, documentação e prova final

**Files:**
- Modify: `spec/decisions/adr.json` (ADR-032, ADR-033)
- Modify: `spec/components/app-shell.json` (anatomia da marca e do campus), `spec/patterns/patterns.json` se o shell-aplicacao descreve a faixa
- Modify: `C:\Users\Leonardo\.claude\projects\c--Users-Leonardo-Documents-UCAMDS\memory\` (memória de projeto nova)

- [ ] **Step 1: ADR-032** (cor onde há dado): contexto = pedido de 13/09 e as regras 022/023/027 que limitavam a cor; decisão = tom pinta o ladrilho quando há julgamento, `marca` um por painel, categoria discrimina irmãos por seis papéis apontando para primitivos existentes; consequências = contratos do stat e icon-tile, portão de daltonismo com categorias, 21 KPIs e 62 cartões reclassificados; afeta `stat`, `icon-tile`, `chart`.
- [ ] **Step 2: ADR-033** (a faixa identifica o módulo): contexto = lockup em toda tela pesava e estourava a 320/480; chip de campus era menu disfarçado; login com cinco textos soltos; 168 botões sem gancho nas 15 telas; decisão = marquinha (ícone + categoria + nome), lockup no Portal/login/gaveta/rodapé, campus é `.ucam-select`, ação sem destino é `aria-disabled` com motivo, ação in-page tem eco no próprio controle; afeta `app-shell`, `select`, `button`, `stepper`, `badge`, `timeline`, `chip`.
- [ ] **Step 3: Portão completo**

Run: `pnpm run build`
Expected: passa de ponta a ponta (inclui `site`).

- [ ] **Step 4: Prova final e capturas**

Run: `MOBILE=0 node sonda-resp.mjs all 320,480,768,1024,1440 final 1440` e `node sonda-resp.mjs all 390 toque-final`; `node prova-campus.mjs`; `node prova-fluxos.mjs`; `pnpm run tokens` (daltonismo com categorias) — anotar os desvios que o portão relatar.
Expected: `pag+` ≤ 0 em todas; campo < 16px = 0 sob toque; provas verdes.

- [ ] **Step 5: Memória.** Atualizar `ucamds-responsividade.md` com o que a marquinha mudou na faixa, e criar `ucamds-cor-e-fluxos.md` (tipo project) com: onde a cor entra e onde não, a convenção `data-fluxo`/`data-acao`, e as armadilhas encontradas. Ponteiro no `MEMORY.md`.
