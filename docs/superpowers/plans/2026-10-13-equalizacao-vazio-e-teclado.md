# Equalização das telas, plano 2: vazio de filtro e teclado das filas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar uma redação só ao estado "filtro sem resultado" das listagens e pôr as teclas J e K para andar nas três filas de trabalho (Caixa de entrada, Setores, Redações).

**Architecture:** As telas são HTML dentro de `spec/templates.json` (campo `preview`), emitidas por `tools/build-templates.mjs` para `docs/t/`. O comportamento das telas vive em `tools/lib/shell.mjs` como scripts exportados em template literal; a fila usa `inboxScript`. Toda mudança é troca exata por script, `pnpm run telas`, e prova por CDP nas telas construídas.

**Tech Stack:** Node 24, pnpm 11, Chrome headless por CDP. Bancada em `scratchpad/equalizacao/` (`servidor.mjs`, `avalia.mjs`, `pratica.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-13-equalizacao-telas-ux-design.md`, itens 4 e 6, em parte. Ver "Fora deste plano".

## Correção à spec

O item 4 da spec diz que "uma tela mostra estado vazio". A contagem era do que está visível em repouso. Lido o código: 25 das 31 listagens com filtro já têm o vazio de filtro (`data-filtra-vazio`), ligado ao `filtroScript`. O que falta é menor do que a spec supôs: a redação tem 14 variantes, e as filas não têm teclado.

## Global Constraints

- Outras sessões editam `spec/templates.json` e `tools/lib/shell.mjs` ao mesmo tempo. Toda edição é por script que lê, troca e grava no mesmo instante, exige ocorrência única e não grava se alguma troca falhar.
- `spec/templates.json` não sobrevive a `JSON.stringify` do arquivo inteiro: editar o `preview` substituindo no texto cru `JSON.stringify(antigo).slice(1,-1)` por `JSON.stringify(novo).slice(1,-1)`.
- Sem bloco de texto explicativo na tela: o atalho de teclado não ganha legenda visível.
- Um botão primário por vista; ações de linha no hover; busca preenche a fileira.
- Sem commit por tarefa; commit só quando o usuário pedir.

## Review Focus

1. Tecla J ou K digitada dentro de um campo (a caixa de resposta do requerimento, a busca da faixa, o campo de nota da redação) escreve a letra e não muda o item da fila. Coberto na Tarefa 2, passo 1.
2. J no último item e K no primeiro não saem da lista nem dão erro. Coberto na Tarefa 2, passo 1.
3. Fila filtrada: J pula os itens escondidos pelo filtro ou pela aba. Coberto na Tarefa 2, passo 1.
4. Atalho com Ctrl, Alt ou Meta (Ctrl+K é a paleta de comando do navegador e de outros scripts) não é capturado. Coberto na Tarefa 2, passo 1.
5. Tela sem fila: o ouvinte não faz nada e não lança erro. Coberto na Tarefa 2, passo 5.

---

### Task 1: Uma redação para o vazio de filtro

Duas frases, escolhidas pelo que a tela tem:

- só busca por texto: `Nada corresponde ao que você pesquisou.`
- busca e outros filtros (segmentado, select, data): `Nada corresponde ao que você pesquisou ou aos filtros escolhidos.`

O título ("Nenhum banco encontrado") e o botão não mudam.

**Files:**
- Create: `scratchpad/equalizacao/vazio.mjs` (checagem e aplicação)
- Modify: `spec/templates.json` (previews com `data-filtra-vazio`)
- Modify: `spec/components/empty-state.json` (`boas_praticas`)

- [ ] **Step 1: Escrever `vazio.mjs`**

```js
// Uma redação para o vazio de filtro. Sem argumento extra: só confere. Com --aplica: grava.
import { readFileSync, writeFileSync } from 'node:fs';
const RAIZ = process.argv[2], APLICA = process.argv.includes('--aplica');
const SO_BUSCA = 'Nada corresponde ao que você pesquisou.';
const COM_FILTRO = 'Nada corresponde ao que você pesquisou ou aos filtros escolhidos.';
const arq = `${RAIZ}/spec/templates.json`;
let cru = readFileSync(arq, 'utf8');
const spec = JSON.parse(cru);
const enc = s => JSON.stringify(s).slice(1, -1);
const RE = /(data-filtra-vazio hidden>(?:(?!<\/div>)[\s\S])*?<p class='ucam-empty__description'>)([^<]*)(<\/p>)/g;
const fora = [], feitos = [];
for (const p of spec.projetos) for (const t of p.templates) {
  if (!t.preview.includes('data-filtra-vazio')) continue;
  // "outros filtros" = algum controle data-filtra que não seja o de texto.
  const outros = [...t.preview.matchAll(/data-filtra='([^']*)'/g)].some(m => m[1] !== 'texto');
  const certa = outros ? COM_FILTRO : SO_BUSCA;
  let n = 0;
  const novo = t.preview.replace(RE, (_, a, frase, c) => { if (frase !== certa) n++; return a + certa + c; });
  if (!n) continue;
  fora.push(`${p.id}/${t.id}`);
  if (!APLICA) continue;
  const a = enc(t.preview);
  if (cru.split(a).length - 1 !== 1) { console.log('FALHA: preview não é único', p.id, t.id); process.exit(1); }
  cru = cru.replace(a, () => enc(novo)); feitos.push(`${p.id}/${t.id}`);
}
if (APLICA) { JSON.parse(cru); writeFileSync(arq, cru); console.log('gravado em', feitos.length, 'telas'); process.exit(0); }
console.log(fora.length ? `✗ vazio: ${fora.length} telas fora da redação\n  ${fora.join('\n  ')}` : '✓ vazio');
process.exit(fora.length ? 1 : 0);
```

- [ ] **Step 2: Ver a checagem falhar**

Run: `node scratchpad/equalizacao/vazio.mjs "C:/Users/Leonardo/Documents/DSUCAM"`
Expected: `✗ vazio:` com cerca de vinte telas (as 14 variantes de hoje, menos as que já usam uma das duas frases).

- [ ] **Step 3: Aplicar e reconstruir**

```bash
node scratchpad/equalizacao/vazio.mjs "C:/Users/Leonardo/Documents/DSUCAM" --aplica
pnpm run validate && pnpm run telas
node scratchpad/equalizacao/vazio.mjs "C:/Users/Leonardo/Documents/DSUCAM"
```

Expected: `gravado em N telas`, `✓ todos os contratos válidos`, `✓ vazio`.

- [ ] **Step 4: O vazio aparece ao filtrar**

Subir a bancada (`servidor.mjs` na 5533 e Chrome na 9533, como no plano 1) e, em três telas, digitar um termo que não existe:

```bash
E="(async()=>{const i=document.querySelector('input[data-filtra=texto]');i.value='zzzzqq';i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,400));const v=document.querySelector('[data-filtra-vazio]');return {visivel:!v.hidden&&v.offsetHeight>0,frase:v.querySelector('.ucam-empty__description').textContent,linhas:[...document.querySelectorAll('tbody tr')].filter(r=>!r.hidden&&r.offsetHeight>0).length}})()"
for t in sigfin-bancos gerencial-usuarios secretaria-sala-de-matricula; do node scratchpad/equalizacao/avalia.mjs 9533 "http://127.0.0.1:5533/t/$t.html?tema=light" "$E"; done
```

Expected: nas três, `visivel: true`, `linhas: 0`; a frase de Bancos é a de só busca e as de Usuários e Sala de matrícula são a de busca e filtros.

- [ ] **Step 5: Contrato**

```bash
node scratchpad/equalizacao/pratica.mjs "C:/Users/Leonardo/Documents/DSUCAM" empty-state "No vazio de filtro, usar uma de duas frases: 'Nada corresponde ao que você pesquisou.' quando a tela só tem busca, e 'Nada corresponde ao que você pesquisou ou aos filtros escolhidos.' quando tem outros filtros." "Escrever uma frase por tela nomeando o filtro ('ao grupo escolhido', 'à mantenedora escolhida')." "Em 13/10/2026 havia 14 redações para o mesmo estado em 25 listagens; a frase não muda o que a pessoa faz em seguida."
pnpm run validate
```

Expected: `gravado em empty-state` e `✓ todos os contratos válidos`. Se `pratica.mjs` responder que `boas_praticas` não existe em `empty-state.json`, acrescentar a chave à mão no fim do objeto, com este item, e validar.

---

### Task 2: J e K andam na fila

**Files:**
- Modify: `tools/lib/shell.mjs` (dentro de `inboxScript`, antes do bloco "Alargou a janela com o detalhe aberto")
- Modify: `spec/components/list-item.json` (`boas_praticas`)
- Create: `scratchpad/equalizacao/teclado.txt` (sonda), `scratchpad/equalizacao/t9.mjs`

**Interfaces:**
- Consumes: `inboxScript` já trata o clique em `.ucam-inbox .ucam-list-item__alvo` (marca `aria-pressed`, e no telefone abre o detalhe). O atalho novo só chama `.click()` no alvo certo; não repete essa lógica.

- [ ] **Step 1: Escrever a sonda `teclado.txt`**

Uma expressão que devolve o índice do item escolhido depois de cada tecla:

```js
(async()=>{
  const alvos=()=>[...document.querySelectorAll('.ucam-inbox .ucam-list-item__alvo')].filter(b=>b.offsetHeight>0);
  const atual=()=>alvos().findIndex(b=>b.getAttribute('aria-pressed')==='true');
  const tecla=(k,alvo=document.body,extra={})=>{alvo.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...extra}));return new Promise(r=>setTimeout(r,120))};
  const r={itens:alvos().length,inicio:atual()};
  if(!r.itens) return 'sem fila';
  alvos()[0].click(); await new Promise(x=>setTimeout(x,120));
  await tecla('j'); r.depoisJ=atual();
  await tecla('j'); r.depoisJJ=atual();
  await tecla('k'); r.depoisK=atual();
  await tecla('k'); await tecla('k'); r.kNoPrimeiro=atual();
  await tecla('j',document.body,{ctrlKey:true}); r.ctrlJ=atual();
  const campo=document.querySelector('.ucam-main textarea, .ucam-main input[type=text], .ucam-main input[type=search], .ucam-appbar input');
  if(campo){campo.focus(); await tecla('j',campo); r.jNoCampo=atual();}
  for(let i=0;i<r.itens+2;i++) await tecla('j'); r.jNoUltimo=atual(); r.ultimo=alvos().length-1;
  r.foco=document.activeElement===alvos()[atual()];
  return r;
})()
```

- [ ] **Step 2: Ver a sonda falhar**

```bash
for t in protocolo-analise-requerimento protocolo-listagem-setores vestibular-redacoes; do
  node scratchpad/equalizacao/avalia.mjs 9533 "http://127.0.0.1:5533/t/$t.html?tema=light" "$(cat scratchpad/equalizacao/teclado.txt)"
done
```

Expected (antes da implementação): `depoisJ: 0`, `depoisJJ: 0`, `jNoUltimo: 0` — as teclas não fazem nada.

- [ ] **Step 3: Escrever `t9.mjs`**

```js
// Item 6 da spec (parte): J e K andam na fila de trabalho.
import { readFileSync, writeFileSync } from 'node:fs';
const arq = `${process.argv[2]}/tools/lib/shell.mjs`;
const s = readFileSync(arq, 'utf8');
const de = `  // Alargou a janela com o detalhe aberto: os dois painéis voltam a conviver.
  var aoMudar = function (m) {`;
const para = `  // J E K ANDAM NA FILA (13/10/2026). Quem tria quarenta requerimentos por
  // dia não volta ao ponteiro a cada um: J vai ao próximo item visível, K ao
  // anterior, e o item escolhido recebe o foco. Não vale dentro de campo de
  // texto (a letra é digitada), nem com Ctrl, Alt ou Meta (atalho de outro
  // dono), nem com diálogo aberto. No fim e no começo da lista, para.
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key && e.key.toLowerCase();
    if (k !== 'j' && k !== 'k') return;
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable], dialog[open], [role="dialog"]')) return;
    var inbox = document.querySelector('.ucam-inbox');
    if (!inbox) return;
    var alvos = Array.prototype.filter.call(inbox.querySelectorAll('.ucam-list-item__alvo'), function (b) {
      return b.offsetParent !== null;
    });
    if (!alvos.length) return;
    var i = -1;
    alvos.forEach(function (b, n) { if (b.getAttribute('aria-pressed') === 'true') i = n; });
    var prox = i < 0 ? 0 : i + (k === 'j' ? 1 : -1);
    if (prox < 0 || prox >= alvos.length) return;
    e.preventDefault();
    alvos[prox].click();
    alvos[prox].focus({ preventScroll: true });
    if (alvos[prox].scrollIntoView) alvos[prox].scrollIntoView({ block: 'nearest' });
  });

${de}`;
if (s.split(de).length - 1 !== 1) { console.log('FALHA: âncora do inboxScript não é única'); process.exit(1); }
writeFileSync(arq, s.replace(de, () => para)); console.log('gravado');
```

Atenção ao escrever o arquivo: o trecho vai DENTRO de um template literal de `shell.mjs`. Não pode conter crase nem `${`; `pnpm run validate` roda `check-crases.mjs` e reprova se houver.

- [ ] **Step 4: Aplicar, reconstruir e ver a sonda passar**

```bash
node scratchpad/equalizacao/t9.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run validate && pnpm run telas
for t in protocolo-analise-requerimento protocolo-listagem-setores vestibular-redacoes; do
  node scratchpad/equalizacao/avalia.mjs 9533 "http://127.0.0.1:5533/t/$t.html?tema=light" "$(cat scratchpad/equalizacao/teclado.txt)"
done
```

Expected em cada tela: `depoisJ: 1`, `depoisJJ: 2`, `depoisK: 1`, `kNoPrimeiro: 0`, `ctrlJ: 0`, `jNoCampo` igual ao valor de antes da tecla (0), `jNoUltimo` igual a `ultimo`, `foco: true`. Em fila com menos de três itens visíveis, `depoisJJ` é o último índice.

- [ ] **Step 5: Tela sem fila e fila filtrada**

```bash
node scratchpad/equalizacao/avalia.mjs 9533 "http://127.0.0.1:5533/t/sigfin-bancos.html?tema=light" "(async()=>{let erro=null;window.addEventListener('error',e=>erro=e.message);document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'j',bubbles:true}));await new Promise(r=>setTimeout(r,200));return erro||'sem erro'})()"
node scratchpad/equalizacao/avalia.mjs 9533 "http://127.0.0.1:5533/t/protocolo-analise-requerimento.html?tema=light" "(async()=>{const abas=[...document.querySelectorAll('.ucam-tabs [role=tab], .ucam-tabs button')];if(abas[1]){abas[1].click();await new Promise(r=>setTimeout(r,300))}const vis=[...document.querySelectorAll('.ucam-inbox .ucam-list-item__alvo')].filter(b=>b.offsetParent!==null);document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'j',bubbles:true}));await new Promise(r=>setTimeout(r,200));const esc=document.querySelector('.ucam-inbox .ucam-list-item__alvo[aria-pressed=true]');return {visiveis:vis.length,escolhidoVisivel:!esc||esc.offsetParent!==null}})()"
```

Expected: `"sem erro"`; e `escolhidoVisivel: true` (com a aba trocada, o J só escolhe item visível; com zero visíveis não faz nada).

- [ ] **Step 6: Contrato e descoberta**

O atalho não tem legenda na tela. Para quem usa leitor de tela, declarar na lista da fila: nos três previews, a `<ul class='ucam-list` (ou `<ol`) dentro de `.ucam-inbox` ganha `aria-keyshortcuts='J K'`. Fazer pelo método de troca no texto cru, exigindo uma lista por tela, e conferir com:

```bash
grep -c "aria-keyshortcuts='J K'" spec/templates.json
```

Expected: `3`.

```bash
node scratchpad/equalizacao/pratica.mjs "C:/Users/Leonardo/Documents/DSUCAM" list-item "Em fila de trabalho (.ucam-inbox), J escolhe o próximo item e K o anterior; a lista declara aria-keyshortcuts." "Capturar a tecla dentro de campo de texto, com modificador ou com diálogo aberto." "Quem tria dezenas de itens por dia anda pela fila sem voltar ao ponteiro; a letra digitada numa resposta tem de continuar sendo letra."
pnpm run validate
```

Expected: `gravado em list-item` e `✓ todos os contratos válidos`.

---

### Task 3: Fechamento

- [ ] **Step 1: Tudo de novo**

```bash
node scratchpad/equalizacao/vazio.mjs "C:/Users/Leonardo/Documents/DSUCAM"
pnpm run validate && pnpm run obrigatoriedade && pnpm run regra-anexo && pnpm run faixa
```

Expected: `✓ vazio` e os quatro portões verdes.

- [ ] **Step 2: Atualizar a spec**

Em `docs/superpowers/specs/2026-10-13-equalizacao-telas-ux-design.md`: corrigir o item 4 (25 de 31 listagens já tinham vazio de filtro; o que mudou foi a redação), marcar J/K do item 6 como feito e acrescentar as duas linhas à tabela "O que já foi feito".

- [ ] **Step 3: Encerrar a bancada**

Fechar o servidor da 5533 e o Chrome da 9533.

## Fora deste plano

- **Desfazer no lugar de confirmar** (item 6). Pede decidir, ação por ação, o que é reversível em Protocolo, Isenção e Vestibular, e mexe no `confirmaScript`. É decisão de regra antes de ser código.
- **Skeleton de tabela e tela de demonstração dos estados** (item 4). O contrato `skeleton.json` existe; falta decidir se o protótipo mostra carregamento, já que nenhuma tela carrega dado de verdade.
- **Vazio de "nenhum registro ainda"** (item 4). Nenhuma listagem do protótipo nasce vazia; desenhar o estado exige uma tela de exemplo por projeto.
- **As seis listagens sem vazio de filtro** (Auditoria e cinco telas da Isenção). As da Isenção são tabelas de disciplinas de um processo, que não esvaziam; a Auditoria merece o vazio, mas tem busca por período e pede a frase certa.
