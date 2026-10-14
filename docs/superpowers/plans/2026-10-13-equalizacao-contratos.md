# Equalização das telas, plano 1: ajustes de contrato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar as cinco decisões da spec que são regra de CSS ou de contrato: formulário mais compacto, rodapé de ações fixo em formulário longo, coluna de ações sem fio, célula com selo e motivo numa linha, e a regra de cor da barra de progresso.

**Architecture:** O CSS do Trilho A é gerado por `tools/build-css.mjs` (um template literal de ~14 mil linhas) para `dist/css/ucam.css`. As telas vivem como HTML dentro de `spec/templates.json` (campo `preview` de cada template) e são emitidas para `docs/t/*.html` por `tools/build-templates.mjs`. Toda mudança é: troca exata no gerador ou no preview, `pnpm run css && pnpm run telas`, e medição por CDP nas telas construídas.

**Tech Stack:** Node 24, pnpm 11, Chrome headless por CDP (WebSocket nativo do Node), sem dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-13-equalizacao-telas-ux-design.md`, itens 1, 2, 3, 5 e 8. Os itens 4 e 6 (estados e teclado) e 9 a 11 (fluxos novos) têm plano próprio; o item 7 espera decisão.

## Global Constraints

- Outras sessões editam `tools/build-css.mjs`, `spec/templates.json` e `spec/decisions/adr.json` ao mesmo tempo. Nunca usar o Edit sobre uma leitura antiga: toda edição é por script que lê, troca e grava no mesmo instante, exige ocorrência única e não grava se alguma troca falhar.
- `spec/templates.json` não sobrevive a `JSON.stringify` do arquivo inteiro. Editar o `preview` assim: `JSON.parse` para achar o template, calcular o HTML novo e substituir no texto cru `JSON.stringify(antigo).slice(1,-1)` por `JSON.stringify(novo).slice(1,-1)`.
- `.td--linha` é um `<span>` dentro da célula. Nunca pôr a classe na `<td>`.
- Um botão primário por vista; "cancelar" é fantasma; campo de busca preenche a fileira; ações de linha aparecem no hover. Nada disso muda aqui.
- Tela e contrato do componente mudam no mesmo passo.
- Sem commit por tarefa: a árvore de trabalho tem edições não commitadas de outras sessões nos mesmos arquivos. Commit só quando o usuário pedir.
- O número da ADR nova é o seguinte ao maior que existir em `spec/decisions/adr.json` no momento de gravar (era ADR-071 em 13/10). Conferir antes de gravar.

## Review Focus

1. Formulário com erro de validação visível: a linha de erro precisa caber sob o campo sem encostar no rótulo seguinte depois de o vão diminuir. Coberto na Tarefa 2 (passo 5).
2. Rodapé fixo sobre o último campo: com a página rolada até o fim, o rodapé não pode cobrir o último controle. Coberto na Tarefa 3 (passo 4).
3. Rodapé fixo a 390px: os botões quebram em duas linhas e a barra dobra de altura. Coberto na Tarefa 3 (passo 5).
4. Tabela com coluna fixa no fim (`ucam-col--borda-fim`): a regra nova do fio não pode devolver a linha dupla que a regra de bloco fixo apaga. Coberto na Tarefa 4 (passo 4).
5. Filtro por situação depois de trocar o texto do selo: os recortes "Bloqueados" e "Com pendência" continuam devolvendo as mesmas linhas, porque filtram por `data-situacao` e não pelo texto. Coberto na Tarefa 5 (passo 4).

---

### Task 1: Bancada de medição

**Files:**
- Existem: `scratchpad/equalizacao/servidor.mjs`, `censo.mjs`, `censo2.mjs`, `foto.mjs`, `censo-2026-10-13.json`, `censo2-2026-10-13.json`
- Create: `scratchpad/equalizacao/verifica.mjs`

**Interfaces:**
- Produces: `node scratchpad/equalizacao/verifica.mjs <nome>` sai com 0 se a checagem `<nome>` passa e 1 se falha. Nomes: `vao-formulario`, `rodape-fixo`, `fio-acoes`, `selo-motivo`. Lê `scratchpad/equalizacao/censo.json` e `censo2.json`.

- [ ] **Step 1: Subir servidor e Chrome próprios**

```bash
cd /c/Users/Leonardo/Documents/DSUCAM
node scratchpad/equalizacao/servidor.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" 5533 &
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --remote-debugging-port=9533 --user-data-dir="C:/Users/Leonardo/AppData/Local/Temp/cr9533" --no-first-run --hide-scrollbars about:blank &
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5533/t/gerencial-usuarios.html
```

Expected: `200`. Se `netstat -ano | grep 9533` vier vazio, o `--user-data-dir` está errado.

- [ ] **Step 2: Escrever `verifica.mjs`**

```js
// Checagens da equalização sobre o censo. Uso: node verifica.mjs <nome>
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url));
const le = f => JSON.parse(readFileSync(join(AQUI, f), 'utf8'));
const c1 = le('censo.json'), c2 = le('censo2.json');
const falhas = [];
const checagens = {
  // Tarefa 2: nenhum vão controle→rótulo seguinte acima de 44px.
  'vao-formulario'() {
    for (const [tela, v] of Object.entries(c2))
      for (const [vao, n] of Object.entries(v.vaos.lista))
        if (Number(vao) > 44) falhas.push(`${tela}: ${n} vão(s) de ${vao}px`);
  },
  // Tarefa 3: formulário de página mais alto que a janela tem rodapé fixo.
  'rodape-fixo'() {
    for (const [tela, v] of Object.entries(c1)) {
      const fa = v.formActions;
      if (!fa || !/-form$|matricula-form/.test(tela)) continue;
      if (v.alturaPagina > 900 && fa.pos !== 'sticky') falhas.push(`${tela}: ${v.alturaPagina}px de página e rodapé ${fa.pos}`);
      if (v.alturaPagina <= 900 && fa.pos === 'sticky') falhas.push(`${tela}: cabe na janela e o rodapé está fixo`);
    }
  },
  // Tarefa 4: a célula de ações não tem fio à esquerda.
  'fio-acoes'() {
    for (const [tela, v] of Object.entries(c2))
      for (const t of v.tabelas)
        if (t.acoes && t.acoes.fio && t.acoes.fio !== 'transparent' && !/, 0\)$/.test(t.acoes.fio)) falhas.push(`${tela}: fio ${t.acoes.fio}`);
  },
  // Tarefa 5: as três tabelas ficam com no máximo duas alturas de linha.
  'selo-motivo'() {
    for (const tela of ['gerencial-usuarios', 'secretaria-sala-de-matricula', 'secretaria-matricula-extensao']) {
      const alturas = new Set(Object.keys(c2[tela].tabelas[0].alturas).map(a => Math.round(Number(a))));
      if (alturas.size > 2) falhas.push(`${tela}: alturas ${[...alturas].join(', ')}`);
      if (c2[tela].tabelas[0].duas > 0 && tela !== 'gerencial-usuarios') falhas.push(`${tela}: ${c2[tela].tabelas[0].duas} célula(s) de duas linhas`);
    }
  },
};
const nome = process.argv[2];
if (!checagens[nome]) { console.log('checagens:', Object.keys(checagens).join(', ')); process.exit(2); }
checagens[nome]();
console.log(falhas.length ? `✗ ${nome}\n  ` + falhas.join('\n  ') : `✓ ${nome}`);
process.exit(falhas.length ? 1 : 0);
```

- [ ] **Step 3: Fazer o `censo2.mjs` ler o fio da célula de ações**

Em `scratchpad/equalizacao/censo2.mjs`, na linha que monta `acoes:` dentro de `tabelas`, acrescentar o campo `fio`. Trocar:

```js
w: r1(ac.getBoundingClientRect().width) } : null,
```

por:

```js
w: r1(ac.getBoundingClientRect().width), fio: getComputedStyle(ac).borderInlineStartColor } : null,
```

- [ ] **Step 4: Rodar a linha de base e ver as quatro checagens falharem**

```bash
pnpm run css && pnpm run telas
node scratchpad/equalizacao/censo.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/censo2.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
for n in vao-formulario rodape-fixo fio-acoes selo-motivo; do node scratchpad/equalizacao/verifica.mjs $n; done
```

Expected: quatro `✗`. `vao-formulario` lista 12 telas com vãos de 52 a 76px; `rodape-fixo` lista os formulários longos; `fio-acoes` lista as 13 listagens; `selo-motivo` lista Sala de matrícula e Extensão. O `Assertion failed ... UV_HANDLE_CLOSING` no fim de cada censo é conhecido e não é erro.

---

### Task 2: Formulário mais compacto (spec, item 1)

**Files:**
- Modify: `tools/build-css.mjs` (bloco `.ucam-form-grid`)
- Modify: `spec/decisions/adr.json` (ADR nova)
- Create: `scratchpad/equalizacao/t2.mjs`

**Interfaces:**
- Consumes: `verifica.mjs vao-formulario` da Tarefa 1.

- [ ] **Step 1: Confirmar que a checagem falha**

Run: `node scratchpad/equalizacao/verifica.mjs vao-formulario`
Expected: `✗ vao-formulario` com vãos de 52px ou mais.

- [ ] **Step 2: Escrever `t2.mjs`**

```js
// Item 1 da spec: o vão entre fileiras da grade de formulário cai de 32 para 16px.
import { readFileSync, writeFileSync } from 'node:fs';
const RAIZ = process.argv[2];
const arq = `${RAIZ}/tools/build-css.mjs`;
let css = readFileSync(arq, 'utf8');
const de = `  grid-auto-flow: row;
  gap: var(--ucam-space-stack-lg) var(--ucam-space-inline-md);
  align-items: start;`;
const para = `  grid-auto-flow: row;
  /* 16px ENTRE FILEIRAS, e não 32 (13/10/2026). Cada campo é subgrade de três
   * fileiras (rótulo, controle, apoio) com 8px entre elas: com 32 de grade, do
   * controle ao rótulo seguinte iam 52 a 58px mesmo sem apoio nenhum, e o
   * formulário de unidade passava de 1.600px. Com 16 são cerca de 36. */
  gap: var(--ucam-space-stack-md) var(--ucam-space-inline-md);
  align-items: start;`;
if (css.split(de).length - 1 !== 1) { console.log('FALHA: bloco da grade não é único'); process.exit(1); }
writeFileSync(arq, css.replace(de, () => para));

const adrArq = `${RAIZ}/spec/decisions/adr.json`;
const cru = readFileSync(adrArq, 'utf8');
const lista = JSON.parse(cru).decisions;
const n = Math.max(...lista.map(d => Number(d.id.replace('ADR-', '')))) + 1;
const adr = {
  id: `ADR-${String(n).padStart(3, '0')}`,
  titulo: 'A grade de formulário separa fileiras por 16px',
  status: 'aceita',
  data: '2026-10-13',
  contexto: 'Censo das 86 telas em 13/10/2026: do controle ao rótulo do campo seguinte iam 52 a 58px em doze formulários, porque o vão de 32px da grade se somava à fileira de apoio da subgrade, que existe mesmo vazia. Unidade e Matrícula passavam de 1.600px de página.',
  decisao: 'O row-gap de .ucam-form-grid passa de space.stack.lg (32px) para space.stack.md (16px). A subgrade de três fileiras fica, porque é ela que alinha controles lado a lado.',
  consequencias: 'O vão entre campos sem apoio cai para cerca de 36px. O vão entre SEÇÕES do formulário não muda (é do .ucam-corpo). Erro de validação continua na fileira de apoio do próprio campo.',
};
const fim = cru.lastIndexOf(']');
const antes = cru.slice(0, fim).replace(/\s+$/, '');
writeFileSync(adrArq, `${antes},\n    ${JSON.stringify(adr, null, 2).replace(/\n/g, '\n    ')}\n  ${cru.slice(fim)}`);
JSON.parse(readFileSync(adrArq, 'utf8'));
console.log('gravado', adr.id);
```

- [ ] **Step 3: Aplicar e reconstruir**

```bash
node scratchpad/equalizacao/t2.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run validate && pnpm run css && pnpm run telas
```

Expected: `gravado ADR-0NN`, `✓ todos os contratos válidos`, `81 telas` (ou o número atual de templates).

- [ ] **Step 4: Medir**

```bash
node scratchpad/equalizacao/censo2.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/verifica.mjs vao-formulario
```

Expected: `✓ vao-formulario`. Se algum vão ficar acima de 44px, é campo com apoio de duas linhas ao lado; conferir a tela na foto antes de mexer.

- [ ] **Step 5: Conferir o campo com erro**

```bash
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/portal-login.html?tema=light" scratchpad/equalizacao/t2-login.jpg 0 900
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/gerencial-unidade-form.html?tema=light" scratchpad/equalizacao/t2-unidade.jpg 0 900
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/gerencial-unidade-form.html?tema=dark" scratchpad/equalizacao/t2-unidade-escuro.jpg 0 900
```

Abrir as três capturas com o Read. Esperado: rótulos e controles alinhados na fileira, apoio ("Até 10 letras.") sob o próprio campo sem tocar o rótulo de baixo, nos dois temas. Para ver o erro, clicar em "Salvar unidade" com campo obrigatório vazio exige `Runtime.evaluate` com `document.querySelector('.ucam-form-actions .ucam-btn--primary').click()` antes da captura; a mensagem de erro deve ficar a pelo menos 8px do rótulo seguinte.

---

### Task 3: Rodapé de ações fixo em formulário longo (spec, item 2)

**Files:**
- Modify: `spec/templates.json` (previews dos formulários longos)
- Modify: `spec/components/form-field.json` ou o contrato que declara `.ucam-form-actions` (achar com `grep -l "form-actions" spec/components/*.json`)
- Create: `scratchpad/equalizacao/t3.mjs`

**Interfaces:**
- Consumes: `scratchpad/equalizacao/censo.json` já medido DEPOIS da Tarefa 2 (a altura das páginas mudou).

- [ ] **Step 1: Medir de novo e confirmar a falha**

```bash
node scratchpad/equalizacao/censo.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/verifica.mjs rodape-fixo
```

Expected: `✗ rodape-fixo` listando os formulários com mais de 900px de página. A lista sai da medição, não de uma lista escrita à mão.

- [ ] **Step 2: Escrever `t3.mjs`**

```js
// Item 2 da spec: formulário de página mais alto que a janela ganha o rodapé fixo.
import { readFileSync, writeFileSync } from 'node:fs';
const RAIZ = process.argv[2];
const censo = JSON.parse(readFileSync(`${RAIZ}/scratchpad/equalizacao/censo.json`, 'utf8'));
const arq = `${RAIZ}/spec/templates.json`;
let cru = readFileSync(arq, 'utf8');
const spec = JSON.parse(cru);
const enc = s => JSON.stringify(s).slice(1, -1);
const falhas = [], feitos = [];
for (const p of spec.projetos) for (const t of p.templates) {
  const tela = `${p.id}-${t.id}`, v = censo[tela];
  if (!v || !v.formActions || !/-form$/.test(t.id)) continue;
  const longo = v.alturaPagina > 900;
  const DE = "<div class='ucam-form-actions'", PARA = "<div class='ucam-form-actions ucam-form-actions--sticky'";
  if (!longo || !t.preview.includes(DE)) continue;
  if (t.preview.split(DE).length - 1 !== 1) { falhas.push(`${tela}: mais de um rodapé`); continue; }
  const novo = t.preview.replace(DE, () => PARA);
  const a = enc(t.preview);
  if (cru.split(a).length - 1 !== 1) { falhas.push(`${tela}: preview não é único`); continue; }
  cru = cru.replace(a, () => enc(novo)); feitos.push(tela);
}
if (falhas.length) { console.log('FALHAS, nada gravado:\n' + falhas.join('\n')); process.exit(1); }
JSON.parse(cru); writeFileSync(arq, cru); console.log('rodapé fixo em:', feitos.join(', '));
```

- [ ] **Step 3: Aplicar, reconstruir, medir**

```bash
node scratchpad/equalizacao/t3.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run validate && pnpm run telas
node scratchpad/equalizacao/censo.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/verifica.mjs rodape-fixo
```

Expected: a lista de telas alteradas (Unidade, Matrícula, Natureza, Usuário e as que a medição apontar) e `✓ rodape-fixo`.

- [ ] **Step 4: O rodapé não cobre o último campo**

Para cada tela alterada, rolar até o fim e fotografar o pé:

```bash
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/gerencial-unidade-form.html?tema=light" scratchpad/equalizacao/t3-unidade-pe.jpg 700 900
```

(`foto.mjs` recebe Y e altura do recorte; 700 + 900 cobre o fim de uma página de 1.600px.) Esperado: o último campo inteiro acima da barra, e a barra com fundo opaco e um fio em cima, sem sombra.

- [ ] **Step 5: A 390px**

Trocar em `foto.mjs` a largura só para esta captura não é necessário: rodar com `Emulation.setDeviceMetricsOverride({ width: 390, height: 800, mobile: true })` por um script de uma linha copiado de `foto.mjs` com `width: 390` e `clip.x: 0, clip.width: 390`. Esperado: os dois botões cabem numa fileira ou quebram sem cobrir mais de um terço da janela. Se cobrirem mais, restringir a variante fixa a telas largas no CSS:

```css
@media (max-width: 40rem) { .ucam-form-actions--sticky { position: static; } }
```

e registrar isso na nota do contrato do passo 6. Só acrescentar a regra se a captura mostrar o problema.

- [ ] **Step 6: Contrato**

No contrato que declara `.ucam-form-actions`, acrescentar em `boas_praticas`:

```json
{
  "faca": "Usar a variante fixa (.ucam-form-actions--sticky) quando o formulário de página passa de uma janela.",
  "evite": "Fixar o rodapé de formulário curto, que cabe inteiro na tela.",
  "porque": "Em Unidade e Matrícula o botão de salvar ficava a mais de 600px abaixo da primeira dobra; em formulário curto a barra fixa só rouba altura."
}
```

Run: `pnpm run validate` — Expected: `✓ todos os contratos válidos`.

---

### Task 4: Coluna de ações sem fio (spec, item 3)

**Files:**
- Modify: `tools/build-css.mjs` (logo depois da regra `.ucam-table thead tr > th:not(.th--selecao) + th`)
- Modify: `spec/components/data-table.json` (`boas_praticas`)
- Create: `scratchpad/equalizacao/t4.mjs`

- [ ] **Step 1: Confirmar a falha**

Run: `node scratchpad/equalizacao/verifica.mjs fio-acoes`
Expected: `✗ fio-acoes` com 13 listagens e a cor do fio (`rgb(...)`).

- [ ] **Step 2: Escrever `t4.mjs`**

```js
// Item 3 da spec: a coluna de ações não tem fio à esquerda nem no cabeçalho.
import { readFileSync, writeFileSync } from 'node:fs';
const arq = `${process.argv[2]}/tools/build-css.mjs`;
let css = readFileSync(arq, 'utf8');
const de = `.ucam-table thead tr > th:not(.th--selecao) + th {
  --ucam-table-fio-coluna: var(--ucam-color-border-subtle);
}`;
const para = `${de}
/* A COLUNA DE AÇÕES NÃO TEM FIO (13/10/2026). As ações aparecem quando a
 * linha é apontada; em repouso o fio vertical recortava um retângulo vazio de
 * 96px no fim de treze listagens, que lia como coluna de dado sem dado. A
 * largura continua reservada (nada salta no hover); some só a divisa. Mesma
 * especificidade das regras acima, e vem depois delas. */
.ucam-table tbody tr > :where(th, td):where(:not(.td--selecao)) + .td--acoes { border-inline-start-color: transparent; }
.ucam-table thead tr > th:not(.th--selecao) + th.th--acoes { --ucam-table-fio-coluna: transparent; }`;
if (css.split(de).length - 1 !== 1) { console.log('FALHA: regra do fio do cabeçalho não é única'); process.exit(1); }
writeFileSync(arq, css.replace(de, () => para)); console.log('gravado');
```

- [ ] **Step 3: Aplicar, reconstruir, medir**

```bash
node scratchpad/equalizacao/t4.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run css && pnpm run telas
node scratchpad/equalizacao/censo2.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/verifica.mjs fio-acoes
```

Expected: `✓ fio-acoes`.

- [ ] **Step 4: Foto, e a tabela com coluna fixa**

```bash
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/sigfin-bancos.html?tema=light" scratchpad/equalizacao/t4-bancos.jpg 60 560
node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/sigfin-recebimentos.html?tema=light" scratchpad/equalizacao/t4-recebimentos.jpg 60 700
```

Esperado em Bancos: a última divisa vertical é a que antecede "Situação"; depois dela, nenhuma, no cabeçalho e no corpo. Em Recebimentos (matriz com coluna fixa no fim): um fio só na borda do bloco fixo, como antes. Comparar com `scratchpad/equalizacao/` de antes se houver dúvida.

- [ ] **Step 5: Contrato**

Em `spec/components/data-table.json`, acrescentar em `boas_praticas`:

```json
{
  "faca": "Deixar a coluna de ações sem divisa: a classe td--acoes / th--acoes já tira o fio.",
  "evite": "Dar rótulo visível ou fio à coluna de ações.",
  "porque": "As ações só aparecem com a linha apontada; com fio, a coluna vazia em repouso parece dado faltando."
}
```

Run: `pnpm run validate` — Expected: `✓ todos os contratos válidos`.

---

### Task 5: Selo com o motivo numa linha (spec, item 5, opção A)

A opção A da spec: o motivo curto entra no selo; o longo sai da tabela e fica na ficha. Se o usuário escolher B ou C na revisão deste plano, esta tarefa muda ou sai.

**Files:**
- Modify: `spec/templates.json` (previews de `gerencial/usuarios`, `secretaria/sala-de-matricula`, `secretaria/matricula-extensao`)
- Create: `scratchpad/equalizacao/t5.mjs`

Textos, antes → depois (o selo guarda classe, ponto e `data-selo`; some o `<span class='td--apoio'>` que vinha depois):

| Tela | Antes | Depois |
|---|---|---|
| Usuários | Bloqueado + "5 tentativas de senha" | Bloqueado · senha |
| Usuários | Bloqueado + "bloqueado pela auditoria de acesso" | Bloqueado · auditoria |
| Usuários | Bloqueado + "inativo há 90 dias" / "inativo há 100 dias" | Bloqueado · inatividade |
| Usuários | Aguardando acesso + "criado em DD/MM/AAAA" | Aguardando acesso |
| Sala de matrícula | Com pendência + "Falta o pagamento" | Pendente · pagamento |
| Sala de matrícula | Com pendência + "Falta assinar o contrato" | Pendente · contrato |
| Sala de matrícula | Com pendência + "Faltam documentos e pagamento" | Pendente · documentos e pagamento |
| Sala de matrícula | Matriculado + "Matrícula 20261187" | Matriculado |
| Extensão | Confirmada + "aguarda aprovação" | Confirmada · aguarda aprovação |

- [ ] **Step 1: Confirmar a falha**

Run: `node scratchpad/equalizacao/verifica.mjs selo-motivo`
Expected: `✗ selo-motivo` com Sala de matrícula e Extensão.

- [ ] **Step 2: Escrever `t5.mjs`**

```js
// Item 5 da spec, opção A: o motivo curto entra no selo; o apoio sai da célula.
import { readFileSync, writeFileSync } from 'node:fs';
const arq = `${process.argv[2]}/spec/templates.json`;
let cru = readFileSync(arq, 'utf8');
const spec = JSON.parse(cru);
const enc = s => JSON.stringify(s).slice(1, -1);
const PONTO = `(?:<span class='ucam-badge__ponto' aria-hidden='true'><\\/span>)?`;
// [projeto, template, rótulo do selo, apoio (regex), rótulo novo, ocorrências esperadas]
const TROCAS = [
  ['gerencial', 'usuarios', 'Bloqueado', '5 tentativas de senha', 'Bloqueado · senha', 2],
  ['gerencial', 'usuarios', 'Bloqueado', 'bloqueado pela auditoria de acesso', 'Bloqueado · auditoria', 1],
  ['gerencial', 'usuarios', 'Bloqueado', 'inativo há \\d+ dias', 'Bloqueado · inatividade', 2],
  ['gerencial', 'usuarios', 'Aguardando acesso', 'criado em [\\d/]+', 'Aguardando acesso', 3],
  ['secretaria', 'sala-de-matricula', 'Com pendência', 'Falta o pagamento', 'Pendente · pagamento', 1],
  ['secretaria', 'sala-de-matricula', 'Com pendência', 'Falta assinar o contrato', 'Pendente · contrato', 1],
  ['secretaria', 'sala-de-matricula', 'Com pendência', 'Faltam documentos e pagamento', 'Pendente · documentos e pagamento', 1],
  ['secretaria', 'sala-de-matricula', 'Matriculado', 'Matrícula \\d+', 'Matriculado', 1],
  ['secretaria', 'matricula-extensao', 'Confirmada', 'aguarda aprovação', 'Confirmada · aguarda aprovação', 2],
];
const falhas = [], novos = new Map();
for (const [p, id, selo, apoio, novo, esperado] of TROCAS) {
  const t = spec.projetos.find(x => x.id === p).templates.find(x => x.id === id);
  const html = novos.get(t) ?? t.preview;
  const re = new RegExp(`(<span class='ucam-badge[^']*'[^>]*>${PONTO})${selo}(<\\/span>) <span class='td--apoio'>${apoio}<\\/span>`, 'g');
  let n = 0; const saida = html.replace(re, (_, abre, fecha) => { n++; return `${abre}${novo}${fecha}`; });
  if (n !== esperado) falhas.push(`${p}/${id} "${selo}" + /${apoio}/: ${n} de ${esperado}`);
  novos.set(t, saida);
}
if (falhas.length) { console.log('FALHAS, nada gravado:\n' + falhas.join('\n')); process.exit(1); }
for (const [t, html] of novos) {
  const a = enc(t.preview);
  if (cru.split(a).length - 1 !== 1) { console.log('FALHA: preview não é único', t.id); process.exit(1); }
  cru = cru.replace(a, () => enc(html));
}
JSON.parse(cru); writeFileSync(arq, cru); console.log('gravado', novos.size, 'telas');
```

- [ ] **Step 3: Aplicar, reconstruir, medir**

```bash
node scratchpad/equalizacao/t5.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run validate && pnpm run telas
node scratchpad/equalizacao/censo2.mjs "C:/Users/Leonardo/Documents/DSUCAM/docs" scratchpad/equalizacao 9533 http://127.0.0.1:5533
node scratchpad/equalizacao/verifica.mjs selo-motivo
```

Expected: `gravado 3 telas` e `✓ selo-motivo`. Em Usuários continuam células de duas linhas na coluna Grupos ("Secretaria Acadêmica e Biblioteca"); a checagem tolera isso e cobra só o número de alturas.

- [ ] **Step 4: Os recortes continuam funcionando**

Em cada uma das três telas, clicar no recorte por CDP e contar as linhas visíveis:

```js
// colar num Runtime.evaluate, com a tela aberta
[...document.querySelectorAll('.ucam-segmented button')].map(b => { b.click(); return b.textContent.trim() + ': ' + [...document.querySelectorAll('tbody tr')].filter(r => !r.hidden).length; })
```

Esperado em Usuários: Todos 10 (página 1 de 30), Ativos, Bloqueados e Aguardando acesso com os mesmos números de antes da troca (anotar antes do passo 3). O filtro lê `data-situacao` da linha, então o texto novo do selo não o afeta; a contagem igual é a prova.

- [ ] **Step 5: Fotos nos dois temas**

```bash
for t in gerencial-usuarios secretaria-sala-de-matricula secretaria-matricula-extensao; do
  node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/$t.html?tema=light" scratchpad/equalizacao/t5-$t.jpg 60 840
  node scratchpad/equalizacao/foto.mjs 9533 "http://127.0.0.1:5533/t/$t.html?tema=dark" scratchpad/equalizacao/t5-$t-escuro.jpg 60 840
done
```

Esperado: nenhuma célula de situação com segunda linha; a coluna de situação não empurra as vizinhas para três linhas; o fio de cada linha contínuo de ponta a ponta.

- [ ] **Step 6: Regras de negócio**

O motivo detalhado saiu da listagem. Em cada um dos três templates, acrescentar em `regras_negocio` um item `proposta`: "O motivo completo do bloqueio (ou da pendência) aparece na ficha, não na listagem", com `decide` igual ao dos itens vizinhos. Usar o mesmo método de troca no texto cru, tomando como âncora o último item de `regras_negocio` do template. `pnpm run validate` reprova tela sem o campo, então rodar de novo.

---

### Task 6: Regra de cor da barra de progresso (spec, item 8)

**Files:**
- Modify: `spec/components/progress.json` (`boas_praticas`)
- Modify: `spec/decisions/adr.json`

Nenhuma tela muda: depois da correção de 13/10 na Carga por setor, os três usos em tela já obedecem (carga em `--info`, andamento da prova em `--marca`, meta cumprida em `--success`).

- [ ] **Step 1: Conferir que não há uso fora da regra**

```bash
node -e "
const t=JSON.parse(require('fs').readFileSync('spec/templates.json','utf8'));
for(const p of t.projetos)for(const x of p.templates){const tons=new Set([...x.preview.matchAll(/ucam-progress__fill--([a-z0-9-]+)/g)].map(m=>m[1]));if(tons.size>1)console.log(p.id+'/'+x.id,[...tons].join(', '))}"
```

Expected: nenhuma linha, ou só telas em que os tons diferentes pertencem a barras de grandezas diferentes (barra segmentada de séries). Tela que misture `info` e `danger` em barras da mesma grandeza é violação: corrigir pelo modelo da Carga por setor (uma cor na barra, a exceção no texto).

- [ ] **Step 2: Contrato e ADR**

Em `spec/components/progress.json`, acrescentar em `boas_praticas`:

```json
{
  "faca": "Escolher o tom pela mesma grandeza que o comprimento mede: carga é info até 80% da capacidade, warning de 80% a 100% e danger acima.",
  "evite": "Pintar a barra por outra grandeza (atraso, situação) enquanto o comprimento mede carga.",
  "porque": "Na Carga por setor a Secretaria aparecia vermelha com 45% e o CPD azul com 60%: a cor desmentia o comprimento. O atraso passou para o texto, em tinta de perigo."
}
```

E uma ADR nova em `spec/decisions/adr.json`, pelo mesmo método do `t2.mjs` (ler, calcular o próximo número, inserir antes do `]` final), com:

- `titulo`: "A cor da barra de progresso acompanha a grandeza do comprimento"
- `contexto`: o caso da Carga por setor, com os números acima, e a pergunta do usuário em 13/10 ("faz sentido essas cores?")
- `decisao`: a regra do `faca` acima; grandeza diferente ganha portador próprio (texto ou selo)
- `consequencias`: nenhuma tela muda hoje; barra de carga acima de 80% passa a ter cor quando existir

- [ ] **Step 3: Validar**

Run: `pnpm run validate && pnpm run agentes`
Expected: `✓ todos os contratos válidos` e o kit de agentes regerado sem erro (o contrato do Progress entra no MCP).

---

### Task 7: Fechamento

- [ ] **Step 1: Todas as checagens e os portões**

```bash
for n in vao-formulario rodape-fixo fio-acoes selo-motivo; do node scratchpad/equalizacao/verifica.mjs $n; done
pnpm run validate && pnpm run obrigatoriedade && pnpm run regra-anexo && pnpm run faixa
```

Expected: quatro `✓` e os quatro portões verdes.

- [ ] **Step 2: Nada vazou**

```bash
node -e "
const c=JSON.parse(require('fs').readFileSync('scratchpad/equalizacao/censo2.json','utf8'));
const v=Object.entries(c).filter(([k,x])=>x.vaza.length);console.log(v.length?v:'sem vazamento');"
```

Expected: `sem vazamento`.

- [ ] **Step 3: Atualizar a spec**

Na tabela "O que já foi feito" de `docs/superpowers/specs/2026-10-13-equalizacao-telas-ux-design.md`, acrescentar uma linha por item concluído (1, 2, 3, 5 e 8) com a medida de antes e depois, e trocar o estado desses itens em "Decisões pedidas" para "feito em DD/MM".

- [ ] **Step 4: Encerrar a bancada**

Fechar o servidor da porta 5533 e o Chrome da 9533 (`netstat -ano | grep -E ":(5533|9533) "` e `taskkill //PID <pid> //F`).
