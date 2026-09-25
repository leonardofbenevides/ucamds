# Isenção: a sugestão automatizada mostra por que sugeriu — plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada sugestão automatizada da análise de isenção ganha a comparação de ementas que a sustenta, numa gaveta onde se decide; aplicar sugestões deixa rastro; a fila filtra por estado da sugestão; o DS ganha o padrão `sugestao-automatizada` e a ADR-049.

**Architecture:** As telas continuam sendo dados gerados por `scratchpad/isencao/gera.mjs` (lê e grava `spec/templates.json` no mesmo instante). A comparação nasce de um dado só — tópicos da ementa da matriz e do histórico — e o motivo e a sugestão de cada disciplina passam a ser DERIVADOS dela, com o gerador reprovando se divergirem. A gaveta é o `ucam-drawer` que já existe, aberta por `data-abre-gaveta` como a de preferências da caixa de entrada: uma gaveta por disciplina, sem tratador novo para abrir. Os tratadores compartilhados de `tools/lib/shell.mjs` mudam em quatro pontos pequenos.

**Tech Stack:** JSON da spec, HTML com classes `ucam-*`, JavaScript sem dependência em `tools/lib/shell.mjs`, Node 24, pnpm, CDP contra Chrome headless.

**Spec:** `docs/superpowers/specs/2026-09-25-isencao-sugestao-assistida-design.md`

## Global Constraints

- Tudo das Global Constraints de `docs/superpowers/plans/2026-09-24-isencao.md` continua valendo: padrão e contrato em toda tela, `href` só `#/templates/<projeto>/<tela>`, `data-fluxo` em todo botão, efeito chega por voz, nada de toast, ADR-003, ADR-046, ADR-047, cor só por token, nenhum `style` novo.
- Rótulo da sugestão: "Sugestão automatizada". A palavra "IA" aparece uma vez por tela, no apoio do cartão "Sugestão automatizada". Nenhum ícone de brilho (`sparkles`, `wand`), nenhuma cor própria para IA.
- Confiança sempre como contagem: "N de M tópicos coincidem · carga Xh de Yh". Nunca "alta/média/baixa", nunca barra de progresso.
- "Aplicar sugestões" continua secundário, preenche só pendentes e nunca sobrescreve (spec de 24/09).
- ADR nova é a **ADR-049**. A 048 é do anel de foco, de outra sessão.
- Sessão paralela: `spec/templates.json`, `spec/patterns/patterns.json`, `spec/decisions/adr.json`, `spec/components/*.json` e `tools/lib/shell.mjs` podem ter alterações não commitadas de outra sessão. Toda edição por script lê e grava no mesmo instante e confere com `grep` depois. Commit só com os trechos desta frente: `git diff <arquivo>` → filtrar os hunks desta frente → `git apply --cached`. Nunca `git add` do arquivo inteiro se `git diff` mostrar hunk alheio.
- Provas por CDP usam `scratchpad/isencao/cdp.mjs` (Chrome em :9333) e o servidor de docs em :5214 (`node scratchpad/servidor-docs.mjs`, com `run_in_background`). Conferir antes: `curl -s http://127.0.0.1:9333/json/version` e `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5214/t/isencao-fila.html`.
- Toda mudança de preview exige `node scratchpad/isencao/gera.mjs && pnpm run -s telas` antes da prova, porque as provas leem `docs/t/`.

## Onde o plano ajusta a spec

Cada ajuste entra na spec no commit do Task 1, numa seção "Ajustes do plano".

1. **Uma gaveta por disciplina, sem tratador `ver-comparacao`.** O `gavetaScript` já abre qualquer `[data-abre-gaveta='<id>']`, com precedente na caixa de entrada. Pré-renderizar nove gavetas custa marcação e zero JavaScript novo.
2. **Foco ao abrir vai para o painel, não para o título.** O contrato do drawer manda o foco ao primeiro interativo do corpo, ou ao painel. O corpo da comparação não tem interativo, e o painel é rotulado pelo título.
3. **Motivos derivados da comparação.** Dois percentuais mudam para caber em listas de tópicos de tamanho real: Direito Penal I de 95% para 100% (10 de 10) e Teoria Geral do Processo de 34% para 33% (3 de 9). Os outros sete ficam como estão.
4. **Fila sem chip.** A fila não mostra chip de filtro aplicado para nenhum filtro hoje. O select mostra o valor escolhido e o eco diz a contagem, como o de curso.
5. **Consulta: "seguiu 6 das 7".** O cartão dizia "sugeriu 6, 1 e 2; seguiu 8 de 9", números que não batiam com as linhas (4, 2 e 3). Passa a ser calculado: sugeriu 4 isentar, 2 revisar e 3 não isentar; a coordenação seguiu 6 das 7 que não pediam revisão.
6. **Autor da atividade.** O registro feito na tela sai como "Você · Coordenação", que é como o `registraAtividade` já escreve.
7. **Realce muda de regra.** O contrato proíbe uso fora de busca. A regra passa a "fora de busca ou de comparação", com o motivo: nos dois casos o `mark` é o rastro do que casou.

## Review Focus

1. Decidir pela linha com a gaveta fechada e depois abrir a gaveta: o segmented da gaveta mostra a mesma decisão. Teste no Task 3.
2. Finalizar a análise desabilita também os segmentados das nove gavetas, não só os da tabela. Teste no Task 3.
3. "Tentar de novo" numa sugestão que falhou muda o dado da linha: com o filtro "Em processamento", Maria Souza aparece. Teste no Task 5.
4. "Limpar filtros" zera o select de sugestão, não só o de curso. Teste no Task 5.
5. A 390px a gaveta empilha as duas colunas e não rola na horizontal. Teste no Task 6.

---

### Task 1: A comparação como dado, e o motivo derivado dela

**Files:**
- Modify: `scratchpad/isencao/dados.mjs` (novo `historico`, novo `ementas`, nova `comparacao()`, dois motivos)
- Modify: `scratchpad/isencao/gera.mjs` (reprova se motivo ou sugestão divergirem da comparação)
- Modify: `docs/superpowers/specs/2026-09-25-isencao-sugestao-assistida-design.md` (seção "Ajustes do plano")

**Interfaces:**
- Produces: `comparacao(nome: string) → { matriz: { nome, carga, topicos: string[] }, origem: { nome, carga, topicos } | null, casados: string[], faltam: string[], pct: number | null, proximas: { nome, carga, topicos, casados: string[] }[], sugestao: 'isentar'|'revisar'|'nao', motivo: string, fato: string }`. `historico` e `ementas` exportados.

- [ ] **Step 1: Escrever a reprovação no gerador**

Em `scratchpad/isencao/gera.mjs`, trocar o import e acrescentar a checagem logo depois do bloco `if (!ok) …`:

```js
import { candidatos, concluidas, contagens, disciplinas, comparacao } from './dados.mjs';
```

```js
// A sugestão e o motivo de cada disciplina são o que a comparação diz.
// Divergir é o percentual da tela mentir sobre a gaveta.
for (const d of Object.values(disciplinas).flat()) {
  const k = comparacao(d.nome);
  if (k.sugestao !== d.sugestao || k.motivo !== d.motivo) {
    console.error('motivo não fecha com a comparação', d.nome, { tela: [d.sugestao, d.motivo], comparacao: [k.sugestao, k.motivo] });
    process.exit(1);
  }
}
if (comparacao('Direito Civil I').fato !== '11 de 18 tópicos coincidem · carga 80h de 80h') { console.error('fato de Direito Civil I'); process.exit(1); }
if (comparacao('História do Direito').fato !== 'Nenhuma disciplina do histórico cobre mais de 1 dos 8 tópicos.') { console.error('fato de História do Direito'); process.exit(1); }
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node scratchpad/isencao/gera.mjs`
Expected: erro de import, "The requested module './dados.mjs' does not provide an export named 'comparacao'".

- [ ] **Step 3: Escrever os dados e a função em `dados.mjs`**

Acrescentar ao fim do arquivo:

```js
// O histórico de João Cutrim (Universidade Estácio de Sá), como a análise
// automatizada o lê: disciplina, carga e os tópicos da ementa.
export const historico = [
  { nome: 'Introdução ao Direito', carga: '80h', topicos: ['Conceito de direito', 'Direito e moral', 'Fontes do direito', 'Norma jurídica', 'Ordenamento jurídico', 'Relação jurídica', 'Sujeito de direito', 'Fato e ato jurídico', 'Direito objetivo e subjetivo', 'Ramos do direito', 'Hermenêutica jurídica', 'Direito romano'] },
  { nome: 'Direito Civil — Parte Geral', carga: '80h', topicos: ['Introdução ao direito civil', 'Lei de Introdução às Normas do Direito Brasileiro', 'Pessoa natural', 'Personalidade', 'Capacidade', 'Direitos da personalidade', 'Ausência', 'Pessoa jurídica', 'Domicílio', 'Bens', 'Fato jurídico', 'Negócio jurídico'] },
  { nome: 'Sociologia Geral e Jurídica', carga: '60h', topicos: ['Clássicos da sociologia', 'Sociologia e direito', 'Controle social', 'Instituições sociais', 'Pluralismo jurídico', 'Eficácia social da norma', 'Acesso à justiça', 'Profissões jurídicas'] },
  { nome: 'Direito Penal — Parte Geral', carga: '80h', topicos: ['Princípios do direito penal', 'Aplicação da lei penal', 'Teoria do crime', 'Tipicidade', 'Ilicitude', 'Culpabilidade', 'Erro de tipo e erro de proibição', 'Tentativa e consumação', 'Concurso de pessoas', 'Imputabilidade'] },
  { nome: 'Teoria da Constituição', carga: '60h', topicos: ['Constitucionalismo', 'Poder constituinte', 'Classificação das constituições', 'Aplicabilidade das normas constitucionais', 'Hermenêutica constitucional', 'Princípios fundamentais', 'Direitos e garantias fundamentais', 'Remédios constitucionais', 'Nacionalidade', 'História constitucional do Brasil'] },
  { nome: 'Introdução ao Processo Civil', carga: '40h', topicos: ['Jurisdição', 'Ação', 'Processo', 'Procedimento comum', 'Petição inicial', 'Contestação'] },
  { nome: 'Direito Administrativo I', carga: '80h', topicos: ['Regime jurídico-administrativo', 'Princípios da administração pública', 'Organização administrativa', 'Poderes administrativos', 'Atos administrativos', 'Licitações', 'Contratos administrativos', 'Serviços públicos', 'Agentes públicos', 'Controle da administração'] },
  { nome: 'Ciência Política', carga: '60h', topicos: ['Estado e poder', 'Formas de governo', 'Teoria da democracia', 'Constitucionalismo brasileiro', 'Partidos políticos'] },
  { nome: 'Economia Política', carga: '40h', topicos: ['Microeconomia', 'Macroeconomia', 'Teoria da empresa', 'Mercado e concorrência'] },
  { nome: 'Contabilidade Geral', carga: '40h', topicos: ['Patrimônio', 'Escrituração', 'Balanço patrimonial', 'Demonstração de resultado'] },
];

// A ementa de cada disciplina da matriz DIR20222 e a disciplina do histórico
// que a análise pareou com ela (null: nenhuma passou do limite).
export const ementas = {
  'Introdução ao Estudo do Direito': { origem: 'Introdução ao Direito', topicos: ['Conceito de direito', 'Direito e moral', 'Fontes do direito', 'Norma jurídica', 'Ordenamento jurídico', 'Relação jurídica', 'Sujeito de direito', 'Fato e ato jurídico', 'Direito objetivo e subjetivo', 'Ramos do direito', 'Hermenêutica jurídica', 'Integração do direito'] },
  'Direito Civil I': { origem: 'Direito Civil — Parte Geral', topicos: ['Lei de Introdução às Normas do Direito Brasileiro', 'Pessoa natural', 'Personalidade', 'Capacidade', 'Direitos da personalidade', 'Ausência', 'Pessoa jurídica', 'Domicílio', 'Bens', 'Fato jurídico', 'Negócio jurídico', 'Defeitos do negócio jurídico', 'Invalidade do negócio jurídico', 'Atos ilícitos', 'Prescrição', 'Decadência', 'Contratos em espécie', 'Responsabilidade civil'] },
  'História do Direito': { origem: null, topicos: ['Direito na Antiguidade', 'Direito romano', 'Direito medieval', 'Direito canônico', 'Formação do direito português', 'Direito no Brasil colonial', 'Codificação do século XIX', 'Constitucionalismo brasileiro'] },
  'Sociologia Jurídica': { origem: 'Sociologia Geral e Jurídica', topicos: ['Sociologia e direito', 'Controle social', 'Instituições sociais', 'Pluralismo jurídico', 'Eficácia social da norma', 'Acesso à justiça', 'Profissões jurídicas', 'Movimentos sociais e direito'] },
  'Direito Penal I': { origem: 'Direito Penal — Parte Geral', topicos: ['Princípios do direito penal', 'Aplicação da lei penal', 'Teoria do crime', 'Tipicidade', 'Ilicitude', 'Culpabilidade', 'Erro de tipo e erro de proibição', 'Tentativa e consumação', 'Concurso de pessoas', 'Imputabilidade'] },
  'Direito Constitucional I': { origem: 'Teoria da Constituição', topicos: ['Constitucionalismo', 'Poder constituinte', 'Classificação das constituições', 'Aplicabilidade das normas constitucionais', 'Hermenêutica constitucional', 'Princípios fundamentais', 'Direitos e garantias fundamentais', 'Remédios constitucionais', 'Nacionalidade', 'Direitos políticos'] },
  'Teoria Geral do Processo': { origem: 'Introdução ao Processo Civil', topicos: ['Jurisdição', 'Ação', 'Processo', 'Competência', 'Princípios do processo', 'Sujeitos do processo', 'Atos processuais', 'Nulidades', 'Formas de solução de conflitos'] },
  'Direito Administrativo': { origem: 'Direito Administrativo I', topicos: ['Regime jurídico-administrativo', 'Princípios da administração pública', 'Organização administrativa', 'Poderes administrativos', 'Atos administrativos', 'Licitações', 'Contratos administrativos', 'Serviços públicos', 'Agentes públicos', 'Responsabilidade civil do Estado'] },
  'Direito Empresarial I': { origem: null, topicos: ['Teoria da empresa', 'Empresário', 'Estabelecimento empresarial', 'Nome empresarial', 'Registro de empresa', 'Escrituração', 'Propriedade industrial', 'Sociedades empresárias'] },
};

// A regra da análise automatizada, na ordem em que ela decide:
// sem par → não isentar; menos da metade dos tópicos → não isentar;
// carga menor → revisar; menos de 75% → revisar; o resto → isentar.
export function comparacao(nome) {
  const d = Object.values(disciplinas).flat().find((x) => x.nome === nome);
  const e = ementas[nome];
  const horas = (c) => parseInt(c, 10);
  const matriz = { nome, carga: d.carga, topicos: e.topicos };
  const origem = e.origem ? historico.find((h) => h.nome === e.origem) : null;
  const total = e.topicos.length;
  if (!origem) {
    const proximas = historico
      .map((h) => ({ ...h, casados: e.topicos.filter((t) => h.topicos.includes(t)) }))
      .filter((h) => h.casados.length)
      .sort((a, b) => b.casados.length - a.casados.length)
      .slice(0, 2);
    const maior = proximas.length ? proximas[0].casados.length : 0;
    return {
      matriz, origem: null, proximas, pct: null,
      casados: [...new Set(proximas.flatMap((p) => p.casados))], faltam: [],
      sugestao: 'nao', motivo: 'Sem disciplina equivalente',
      fato: `Nenhuma disciplina do histórico cobre mais de ${maior} dos ${total} tópicos.`,
    };
  }
  const casados = e.topicos.filter((t) => origem.topicos.includes(t));
  const faltam = e.topicos.filter((t) => !origem.topicos.includes(t));
  const pct = Math.round((casados.length / total) * 100);
  const [sugestao, motivo] =
    pct < 50 ? ['nao', `Ementa incompatível: ${pct}%`]
      : horas(origem.carga) < horas(d.carga) ? ['revisar', `Carga horária menor: ${origem.carga} de ${d.carga}`]
        : pct < 75 ? ['revisar', `Ementa parcial: ${pct}%`]
          : ['isentar', `Ementa compatível: ${pct}%`];
  return {
    matriz, origem, proximas: [], pct, casados, faltam, sugestao, motivo,
    fato: `${casados.length} de ${total} tópicos coincidem · carga ${origem.carga} de ${d.carga}`,
  };
}
```

- [ ] **Step 4: Rodar e ver os dois motivos que divergem**

Run: `node scratchpad/isencao/gera.mjs`
Expected: `motivo não fecha com a comparação Direito Penal I` com `comparacao: ['isentar', 'Ementa compatível: 100%']`.

- [ ] **Step 5: Ajustar os dois motivos em `disciplinas`**

```js
    { nome: 'Direito Penal I', carga: '80h', sugestao: 'isentar', motivo: 'Ementa compatível: 100%', decisao: 'isentar' },
```

```js
    { nome: 'Teoria Geral do Processo', carga: '80h', sugestao: 'nao', motivo: 'Ementa incompatível: 33%', decisao: 'nao' },
```

- [ ] **Step 6: Rodar e ver passar**

Run: `node scratchpad/isencao/gera.mjs && pnpm run -s telas && grep -c "Ementa compatível: 100%" docs/t/isencao-analise.html`
Expected: o gerador grava sem erro e a contagem é 1 ou mais.

- [ ] **Step 7: Registrar os ajustes na spec**

Acrescentar ao fim de `docs/superpowers/specs/2026-09-25-isencao-sugestao-assistida-design.md` a seção "## Ajustes do plano (25/09/2026)" com os sete itens de "Onde o plano ajusta a spec" deste plano, uma frase cada.

- [ ] **Step 8: Commit**

O `scratchpad/` não é versionado; o que entra é o JSON gerado e a spec. Filtrar os hunks do projeto `isencao` em `spec/templates.json` como manda Global Constraints.

```bash
git add docs/superpowers/specs/2026-09-25-isencao-sugestao-assistida-design.md
git apply --cached <hunks-da-isencao>.diff
git commit -m "Isenção: o motivo de cada sugestão sai da comparação de ementas, e o gerador reprova se divergir"
```

---

### Task 2: O padrão `sugestao-automatizada`, a ADR-049 e o realce que marca comparação

**Files:**
- Modify: `spec/patterns/patterns.json` (padrão novo)
- Modify: `spec/decisions/adr.json` (ADR-049)
- Modify: `spec/components/realce.json` (`quando_usar`, regra "Não usar fora de busca")
- Modify: `spec/components/{badge,button,drawer,realce,segmented,timeline}.json` (`composicao.usada_por` recebe `padrao-sugestao-automatizada`)

**Interfaces:**
- Produces: o rótulo `padrao-sugestao-automatizada` e a ADR `ADR-049`, citados pelas notas das telas nos Tasks 3 a 5.

- [ ] **Step 1: Acrescentar o padrão sem as arestas de volta**

Script de uma leitura e uma gravação, em `scratchpad/isencao/padrao.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'C:/Users/Leonardo/Documents/DSUCAM/spec/patterns/patterns.json';
const j = JSON.parse(readFileSync(P, 'utf8'));
if (!j.patterns.some((p) => p.id === 'sugestao-automatizada')) {
  j.patterns.push({
    id: 'sugestao-automatizada',
    nome: 'Sugestão automatizada',
    resumo: 'O que a máquina propõe vem rotulado, com a evidência a uma ação de distância, e nunca decide sozinho.',
    status: 'draft',
    frequencia: 'Uma tela hoje: a análise de isenção de disciplinas, que compara ementas. O Protocolo (encaminhamento de requerimento) e o Gerencial (perfil sugerido) são os próximos candidatos. Três telas é o limite a partir do qual vira gabarito.',
    problema: 'A isenção já tinha sugestão por disciplina com um percentual ("Ementa compatível: 92%"), e o percentual era uma afirmação sem prova: para conferir, a analista abria o PDF das ementas e comparava de cabeça, nove vezes por solicitação. Quem paga esse custo para de olhar a sugestão, ou aplica sem olhar.',
    estrutura: [
      'Coluna ou selo "Sugestão automatizada" com o tom da proposta e o motivo curto em apoio',
      'Ação "Ver comparação" na própria linha, que abre a evidência numa gaveta',
      'Na gaveta: as duas fontes lado a lado, o que casou marcado com realce, o que faltou em frase, e o controle de decisão no rodapé',
      'Cartão de apoio com a origem dita uma vez ("gerada por IA a partir de …") e a ação secundária de aplicar em lote',
      'Registro na atividade de toda aplicação em lote, com autor humano',
    ],
    regras: [
      'Rótulo de origem em palavras: "Sugestão automatizada". A frase que diz que é IA aparece uma vez, no apoio. Sem ícone de brilho, sem varinha, sem cor exclusiva.',
      'Sugestão é selo, decisão é controle. Rótulos diferentes: "Isentar" sugere, "Isenta" decide.',
      'Toda sugestão que afirma compatibilidade tem a evidência a uma ação de distância, em gaveta, porque a evidência complementa a decisão sem interrompê-la.',
      'Confiança é contagem: quantos de quantos, de qual medida. Nunca alta/média/baixa, nunca barra.',
      'Aplicar em lote é secundário, preenche só o vazio, diz quantas preencheu e deixa rastro com autor humano.',
      'Em processamento, falhou e sem análise são estados visíveis com o que fazer, nunca ausência silenciosa.',
    ],
    usa: ['ucam-badge', 'ucam-button', 'ucam-drawer', 'ucam-realce', 'ucam-segmented', 'ucam-timeline'],
    evidencia: 'Isenção de disciplinas, telas isencao/analise e isencao/fila (spec docs/superpowers/specs/2026-09-25-isencao-sugestao-assistida-design.md); ADR-049.',
  });
}
writeFileSync(P, JSON.stringify(j, null, 2) + '\n');
console.log('padrão ok');
```

Run: `node scratchpad/isencao/padrao.mjs`

- [ ] **Step 2: Rodar o validador e ver falhar**

Run: `pnpm run -s validate`
Expected: FALHA `padrão "sugestao-automatizada" usa ucam-badge, mas badge não o lista em usada_por — grafo de mão única` (e o mesmo para os outros cinco).

- [ ] **Step 3: Fechar as arestas, a ADR e o realce no mesmo script**

Acrescentar ao fim de `scratchpad/isencao/padrao.mjs` e rodar de novo:

```js
const C = 'C:/Users/Leonardo/Documents/DSUCAM/spec/components/';
for (const id of ['badge', 'button', 'drawer', 'realce', 'segmented', 'timeline']) {
  const f = C + id + '.json';
  const c = JSON.parse(readFileSync(f, 'utf8'));
  c.composicao = c.composicao || {};
  c.composicao.usada_por = c.composicao.usada_por || [];
  if (!c.composicao.usada_por.includes('padrao-sugestao-automatizada')) c.composicao.usada_por.push('padrao-sugestao-automatizada');
  if (id === 'realce') {
    const uso = 'Uma comparação entre dois textos (a ementa da matriz e a do histórico, na isenção) precisa mostrar o que casou nos dois lados.';
    if (!c.quando_usar.includes(uso)) c.quando_usar.push(uso);
    const i = c.limites.regras.findIndex((r) => r.startsWith('Não usar fora de busca.'));
    if (i >= 0) c.limites.regras[i] = 'Não usar fora de busca ou de comparação. mark é o rastro do que casou — com o termo digitado, ou entre dois textos comparados; para chamar atenção para um trecho por decisão editorial existe ênfase tipográfica, e para estado do sistema existe o selo.';
  }
  writeFileSync(f, JSON.stringify(c, null, 2) + '\n');
}

const A = 'C:/Users/Leonardo/Documents/DSUCAM/spec/decisions/adr.json';
const a = JSON.parse(readFileSync(A, 'utf8'));
if (!a.decisions.some((d) => d.id === 'ADR-049')) {
  a.decisions.push({
    id: 'ADR-049',
    titulo: 'Sugestão de máquina é rotulada, mostra a evidência e nunca decide',
    status: 'aceita',
    data: '2026-09-25',
    contexto: 'A isenção de disciplinas propõe isentar, revisar ou não isentar cada disciplina a partir das ementas, e mostrava só um percentual. Sem a evidência, a coordenação ou refazia a comparação no PDF ou aplicava sem conferir. A pergunta de origem foi como incentivar o uso de IA no sistema.',
    decisao: 'Toda sugestão gerada por máquina segue o padrão sugestao-automatizada: rótulo em palavras, origem dita uma vez, evidência a uma ação de distância numa gaveta, confiança como contagem, aplicação em lote secundária e registrada com autor humano. Incentivar é baratear a conferência, nunca empurrar: nada pré-preenche decisão, nada promove a aplicação a primária, nada pinta a sugestão de marca.',
    consequencias: [
      'A isenção ganha uma gaveta de comparação por disciplina, com os tópicos que casaram marcados por realce.',
      'O contrato do realce passa a valer para comparação além de busca.',
      'O motivo de cada sugestão sai do mesmo dado da comparação: o percentual da tela e a contagem da gaveta não podem divergir.',
      'O ciclo de retorno (motivo quando a coordenação diverge, indicador de sugestões seguidas) fica para a próxima frente.',
    ],
    afeta: ['realce', 'drawer', 'badge'],
  });
}
writeFileSync(A, JSON.stringify(a, null, 2) + '\n');
console.log('arestas, realce e ADR ok');
```

Run: `node scratchpad/isencao/padrao.mjs`

- [ ] **Step 4: Rodar o validador e ver passar**

Run: `pnpm run -s validate && grep -c "padrao-sugestao-automatizada" spec/components/*.json | grep -v ":0"`
Expected: `✓ todos os contratos válidos` e seis arquivos com contagem 1.

- [ ] **Step 5: Commit com os hunks desta frente**

`adr.json` e `patterns.json` têm alterações da outra sessão: filtrar os hunks que contêm `ADR-049` e `sugestao-automatizada` e aplicar no índice. Os seis contratos entram inteiros só se `git diff` deles mostrar apenas as linhas desta frente.

```bash
git commit -m "Padrão sugestao-automatizada e ADR-049: a sugestão de máquina é rotulada, mostra a evidência e nunca decide; o realce passa a marcar comparação"
```

---

### Task 3: A gaveta de comparação na análise, e os tratadores que ela pede

**Files:**
- Create: `scratchpad/isencao/telas/comparacao.mjs` (a gaveta de uma disciplina)
- Modify: `scratchpad/isencao/telas/analise.mjs` (gatilho na célula de sugestão, gavetas no preview, textos do cartão e da seção, notas, fluxos, `usa`)
- Modify: `tools/lib/shell.mjs` (`decidir` fora da linha e em sincronia; `aplicar-sugestoes` registra atividade)
- Test: `scratchpad/isencao/prova-analise.mjs`

**Interfaces:**
- Consumes: `comparacao(nome)` do Task 1.
- Produces: `gavetaComparacao({ id: string, nome: string, rodape: string }) → string` (scrim + `aside.ucam-drawer--lg`). Ids das gavetas: `is-cmp-0` a `is-cmp-8`, na ordem de `Object.values(disciplinas).flat()`. O segmented da gaveta leva `data-decisao data-disciplina-alvo='<nome>'`.

- [ ] **Step 1: Escrever as provas que faltam**

Acrescentar a `scratchpad/isencao/prova-analise.mjs`, antes de `fim()`, um bloco próprio com página nova:

```js
/* ------------------------------------------- analise: comparação --- */
{
  const p = await abre('http://localhost:5214/t/isencao-analise.html', { espera: 1500 });
  const G = (n) => `${D(n)} [data-abre-gaveta]`;
  prova('nove gatilhos de comparação', (await p.js(`document.querySelectorAll('#is-disc [data-abre-gaveta^="is-cmp-"]').length`)) === 9);
  prova('gatilho nomeia a disciplina', (await p.attr(G('Direito Civil I'), 'aria-label')) === 'Ver comparação de Direito Civil I');
  prova('sem equivalente pede as próximas', (await p.attr(G('História do Direito'), 'aria-label')) === 'Ver disciplinas próximas de História do Direito');

  // Review Focus 1: decidir pela linha antes de abrir.
  await p.clica(`${D('Direito Constitucional I')} [data-decisao] button[data-valor='nao']`);
  const idConst = await p.attr(G('Direito Constitucional I'), 'data-abre-gaveta');
  prova('a gaveta já sabe da decisão da linha', (await p.attr(`#${idConst} [data-decisao] button[data-valor='nao']`, 'aria-pressed')) === 'true');

  // Abrir Direito Civil I.
  const id = await p.attr(G('Direito Civil I'), 'data-abre-gaveta');
  await p.clica(G('Direito Civil I'), 250);
  prova('gaveta aberta', (await p.js(`document.getElementById('${id}').hidden`)) === false);
  prova('o fato está no apoio', /11 de 18 tópicos coincidem · carga 80h de 80h/.test(await p.texto(`#${id} .ucam-drawer__description`)), await p.texto(`#${id} .ucam-drawer__description`));
  prova('22 marcas: 11 de cada lado', (await p.js(`document.querySelectorAll('#${id} mark.ucam-realce').length`)) === 22);
  prova('diz o que faltou', /Não aparece no histórico: .*Responsabilidade civil/.test(await p.texto(`#${id} [data-faltam]`)), await p.texto(`#${id} [data-faltam]`));
  prova('foco dentro da gaveta', (await p.js(`document.getElementById('${id}').contains(document.activeElement)`)) === true);

  // Decidir na gaveta muda a linha.
  await p.clica(`#${id} [data-decisao] button[data-valor='isentar']`);
  prova('linha: isentar', (await p.attr(D('Direito Civil I'), 'data-decidida')) === 'isentar');
  prova('segmented da linha acompanha', (await p.attr(`${D('Direito Civil I')} [data-decisao] button[data-valor='isentar']`, 'aria-pressed')) === 'true');
  prova('anuncia pela gaveta', /^Direito Civil I: isenta\./.test(await p.anuncio()), await p.anuncio());

  // Esc fecha e devolve o foco ao gatilho.
  await p.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true`);
  await new Promise((r) => setTimeout(r, 150));
  prova('Esc fecha', (await p.js(`document.getElementById('${id}').hidden`)) === true);
  prova('foco volta ao gatilho', (await p.js(`document.activeElement === document.querySelector(${JSON.stringify(G('Direito Civil I'))})`)) === true);

  // Sem equivalente: as próximas.
  const idH = await p.attr(G('História do Direito'), 'data-abre-gaveta');
  prova('História: nenhuma passa de 1', /Nenhuma disciplina do histórico cobre mais de 1 dos 8 tópicos\./.test(await p.texto(`#${idH}`)));
  prova('História: as duas próximas', /Introdução ao Direito/.test(await p.texto(`#${idH}`)) && /Ciência Política/.test(await p.texto(`#${idH}`)));

  // Aplicar registra na atividade; aplicar de novo não.
  const antes = await p.js(`document.querySelectorAll('ol[data-atividade] > li').length`);
  await p.clica(`[data-acao='aplicar-sugestoes']`);
  prova('atividade: aplicou a 1', /Aplicou a sugestão a 1 disciplina/.test(await p.texto('ol[data-atividade] > li')), await p.texto('ol[data-atividade] > li'));
  prova('atividade diz qual', /Direito Empresarial I: não isentar/.test(await p.texto('ol[data-atividade] > li')));
  await new Promise((r) => setTimeout(r, 1600));
  await p.clica(`[data-acao='aplicar-sugestoes']`);
  prova('aplicar sem pendente não registra', (await p.js(`document.querySelectorAll('ol[data-atividade] > li').length`)) === antes + 1);

  // Review Focus 2: finalizar desabilita os segmentados das gavetas.
  await p.clica(`${D('Direito Constitucional I')} [data-decisao] button[data-valor='isentar']`);
  await p.clica(`[data-acao='finalizar-analise']`, 250);
  await p.js(`document.querySelector('dialog[open] [data-confirmar-ok]').click(); true`);
  await new Promise((r) => setTimeout(r, 200));
  prova('gavetas também travam', (await p.js(`[...document.querySelectorAll('.ucam-drawer [data-decisao] button')].every(b => b.getAttribute('aria-disabled') === 'true')`)) === true);
  await p.fecha();
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node scratchpad/isencao/prova-analise.mjs`
Expected: as provas antigas passam; `FALHA nove gatilhos de comparação` e as seguintes falham.

- [ ] **Step 3: Criar `scratchpad/isencao/telas/comparacao.mjs`**

```js
// A gaveta de comparação de uma disciplina (padrão sugestao-automatizada,
// ADR-049): as duas ementas lado a lado, o que casou em realce, o que faltou
// em frase e, na análise, a decisão no rodapé.
import { comparacao } from '../dados.mjs';
import { ic } from '../pecas.mjs';

const ROT = { isentar: 'Isentar', revisar: 'Revisar', nao: 'Não isentar' };

const lista = (topicos, casados, rotulo) =>
  `<ul class='ucam-stack ucam-stack--sm' aria-label='${rotulo}'>` +
  topicos.map((t) => `<li>${casados.includes(t) ? `<mark class='ucam-realce'>${t}</mark>` : t}</li>`).join('') +
  `</ul>`;

const coluna = (id, titulo, apoio, corpo) =>
  `<section aria-labelledby='${id}'><h3 class='ucam-section__title ucam-section__title--painel' id='${id}'>${titulo}</h3>` +
  `<p class='ucam-section__hint'>${apoio}</p>${corpo}</section>`;

export function gavetaComparacao({ id, nome, rodape = '' }) {
  const c = comparacao(nome);
  const daMatriz = coluna(`${id}-m`, `Da matriz <span class='ucam-id'>DIR20222</span>`, `${nome} · ${c.matriz.carga}`,
    lista(c.matriz.topicos, c.casados, `Tópicos da ementa de ${nome}`));
  const doHistorico = c.origem
    ? coluna(`${id}-h`, 'Do histórico', `${c.origem.nome} · ${c.origem.carga} · Universidade Estácio de Sá`,
      lista(c.origem.topicos, c.casados, `Tópicos da ementa de ${c.origem.nome}`))
    : coluna(`${id}-h`, 'Do histórico', c.fato,
      c.proximas.map((p) =>
        `<p class='ucam-card__titulo'>${p.nome}</p><p class='ucam-section__hint'>${p.casados.length} de ${c.matriz.topicos.length} tópicos · ${p.carga}</p>` +
        lista(p.topicos, p.casados, `Tópicos da ementa de ${p.nome}`)).join(''));
  const faltam = c.faltam.length
    ? `<p class='ucam-section__hint' data-faltam>Não aparece no histórico: ${c.faltam.join(', ')}.</p>`
    : '';
  return `<div class='ucam-drawer-scrim' hidden></div>` +
    `<aside class='ucam-drawer ucam-drawer--lg' id='${id}' role='dialog' aria-modal='true' aria-labelledby='${id}-t' tabindex='-1' hidden>` +
    `<header class='ucam-drawer__header'><div><h2 class='ucam-drawer__title' id='${id}-t'>${nome}</h2>` +
    `<p class='ucam-drawer__description'>Sugestão automatizada: ${ROT[c.sugestao]}. ${c.origem ? c.fato : 'Sem disciplina equivalente no histórico.'}</p></div>` +
    `<button class='ucam-btn ucam-btn--icon ucam-btn--ghost' type='button' data-fecha-gaveta aria-label='Fechar a comparação de ${nome}'>${ic('x')}</button></header>` +
    `<div class='ucam-drawer__body'><div class='ucam-stack'><div class='ucam-grid'>${doHistorico}${daMatriz}</div>${faltam}</div></div>` +
    (rodape ? `<footer class='ucam-drawer__footer'>${rodape}</footer>` : '') +
    `</aside>`;
}
```

- [ ] **Step 4: Ligar a gaveta em `analise.mjs`**

(a) Import no topo:

```js
import { disciplinas, contagens, decisoesPedro, comparacao } from '../dados.mjs';
import { gavetaComparacao } from './comparacao.mjs';
```

(b) `decisaoSeg` ganha o alvo, para o segmented da gaveta:

```js
const decisaoSeg = (nome, d, desabilitada, naGaveta = false) => {
  const b = (v, r) => `<button type='button' aria-pressed='${(d || '') === v ? 'true' : 'false'}' data-valor='${v}' data-fluxo='c' data-acao='decidir'${desabilitada ? " aria-disabled='true' title='Decisão só depois dos documentos'" : ''}>${r}</button>`;
  return `<div class='ucam-segmented ucam-segmented--sm' role='group' aria-label='Decisão para ${nome}' data-decisao${naGaveta ? ` data-disciplina-alvo='${nome}'` : ''}>${b('isentar', 'Isentar')}${b('nao', 'Não isentar')}${b('', 'Pendente')}</div>`;
};
```

(c) O gatilho, logo abaixo de `SUG`:

```js
const gatilho = (nome, i) => {
  const rotulo = comparacao(nome).origem ? 'Ver comparação' : 'Ver disciplinas próximas';
  return ' ' + btn({ rotulo, variante: 'ghost', sm: true, label: `${rotulo} de ${nome}`, attrs: `data-abre-gaveta='is-cmp-${i}'` });
};
```

(d) Em `linhasDisciplinas`, um índice corrido e o gatilho nas duas células de sugestão (fora de `sem-documentos`):

```js
  let k = 0;
  for (const [periodo, lista] of Object.entries(disciplinas)) {
    lista.forEach((d, i) => {
      const n = k++;
```

e trocar as duas ocorrências de `${SUG[d.sugestao](d.motivo)}` por `${SUG[d.sugestao](d.motivo)}${gatilho(d.nome, n)}` — na linha de `consulta` e na de `analise`; a de `sem-documentos` continua com `semAnalise`.

(e) As gavetas no fim do preview, em `pagina(modo)`, antes do `return`:

```js
  const gavetas = modo === 'sem-documentos' ? '' : Object.values(disciplinas).flat().map((d, i) =>
    gavetaComparacao({ id: `is-cmp-${i}`, nome: d.nome, rodape: modo === 'analise' ? decisaoSeg(d.nome, d.decisao, false, true) : '' })).join('');
  return { pessoa, preview: cabeca + corpo + gavetas };
```

(f) Textos. No apoio da seção de disciplinas, trocar `'Decida cada disciplina. A sugestão automatizada é ponto de partida, nunca decisão.'` por `'Decida cada disciplina. A sugestão mostra a comparação que a sustenta; a decisão é sempre da coordenação.'`. No cartão "Sugestão automatizada" do modo `analise`, trocar o apoio por:

```js
      `<p class='ucam-section__hint'>Gerada por IA a partir das ementas e da carga horária, tópico a tópico. Analisada em 12/09/2026 às 09:40 · ${c.sug.isentar} isentar, ${c.sug.revisar} revisar, ${c.sug.nao} não isentar. A decisão é sempre da coordenação.</p></div>` +
```

(g) No objeto da tela `analise`: `usa: [...usaBase, 'ucam-textarea', 'ucam-drawer', 'ucam-realce']`; em `notas`, acrescentar `'Cada sugestão tem "Ver comparação": uma gaveta com as duas ementas, os tópicos que coincidem em realce e a decisão no rodapé, sincronizada com a linha. É o padrão sugestao-automatizada (ADR-049): incentivar o uso é baratear a conferência, nunca empurrar.'`; em `fluxos.acoes`, acrescentar `{ rotulo: 'Ver comparação · Ver disciplinas próximas (×9)', classe: 'c', efeito: 'Abre a gaveta da disciplina com as duas ementas e o que coincide marcado; decidir nela muda a linha e anuncia; Esc devolve o foco.' }`.

- [ ] **Step 5: Os tratadores em `tools/lib/shell.mjs`**

Por script de leitura e gravação no mesmo instante, `scratchpad/isencao/tratadores-cmp.cjs`, que reprova se um trecho antigo não aparecer exatamente uma vez:

```js
const fs = require('fs');
const f = 'C:/Users/Leonardo/Documents/DSUCAM/tools/lib/shell.mjs';
let s = fs.readFileSync(f, 'utf8');
const troca = (a, b) => { if (s.split(a).length !== 2) { console.error('não achei uma vez:', a.slice(0, 60)); process.exit(1); } s = s.replace(a, b); };
// troca(antigo, novo) para cada par abaixo, e só então:
fs.writeFileSync(f, s);
```

Os pares:

Trecho antigo de `decidir`:

```js
    if (qual === 'decidir') {
      var linhaD = botao.closest('tr');
      var grupo = botao.closest('[data-decisao]');
      if (!linhaD || !grupo) return;
      Array.prototype.forEach.call(grupo.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b === botao ? 'true' : 'false'); });
      var valor = botao.getAttribute('data-valor') || '';
```

Trecho novo:

```js
    if (qual === 'decidir') {
      // A decisão mora na linha e, desde a gaveta de comparação (ADR-049), também
      // no rodapé da gaveta daquela disciplina. Quem decide em um lugar decide
      // nos dois: o segmented que ficou para trás mentiria ao reabrir.
      var grupo = botao.closest('[data-decisao]');
      if (!grupo) return;
      var alvoNome = grupo.getAttribute('data-disciplina-alvo');
      var linhaD = botao.closest('tr') || (alvoNome ? document.querySelector('tr[data-disciplina="' + CSS.escape(alvoNome) + '"]') : null);
      if (!linhaD) return;
      var valor = botao.getAttribute('data-valor') || '';
      var nomeLinha = linhaD.getAttribute('data-disciplina') || '';
      [linhaD.querySelector('[data-decisao]')].concat(Array.prototype.slice.call(document.querySelectorAll('[data-decisao][data-disciplina-alvo="' + CSS.escape(nomeLinha) + '"]'))).forEach(function (g) {
        if (!g) return;
        Array.prototype.forEach.call(g.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-valor') || '') === valor ? 'true' : 'false'); });
      });
```

Trecho antigo de `aplicar-sugestoes`:

```js
        var alvoB = tr.querySelector('[data-decisao] button[data-valor="' + sug + '"]');
        if (alvoB) { agir(alvoB, 'decidir'); feitas++; }
      });
```

Trecho novo:

```js
        var alvoB = tr.querySelector('[data-decisao] button[data-valor="' + sug + '"]');
        if (alvoB) { agir(alvoB, 'decidir'); feitas++; quais.push(tr.getAttribute('data-disciplina') + ': ' + (sug === 'isentar' ? 'isentar' : 'não isentar')); }
      });
      // Rastro com autor humano (ADR-049): o parecer precisa dizer o que foi
      // conferido uma a uma e o que entrou em lote.
      if (feitas) registraAtividade(botao, 'Aplicou a sugestão a ' + feitas + (feitas === 1 ? ' disciplina' : ' disciplinas'), quais.join('; ') + '.', 'listChecks', 'info');
```

e, na linha `var feitas = 0;` do mesmo bloco, trocar por `var feitas = 0, quais = [];`.

Depois do script: `grep -n "data-disciplina-alvo\|Aplicou a sugestão" tools/lib/shell.mjs` mostra as duas mudanças.

- [ ] **Step 6: Gerar, publicar as telas e rodar a prova**

Run: `node scratchpad/isencao/gera.mjs && pnpm run -s telas && node scratchpad/isencao/prova-analise.mjs`
Expected: `todas as provas passaram`.

- [ ] **Step 7: Validador e sondas do repositório**

Run: `pnpm run -s validate && node scratchpad/sonda-mortos.mjs && node scratchpad/sonda-mudas.mjs` (Chrome em 9346 para mortos e 9341 para mudas; conferir com `curl` antes)
Expected: validação verde; nenhum controle morto nem mudo nas telas da isenção. Se a sonda de mortos contar o gatilho da gaveta como morto, conferir como ela trata `data-abre-gaveta` na caixa de entrada (`ce-prefs`) e seguir o mesmo caminho, sem mudar a sonda.

- [ ] **Step 8: Commit**

```bash
git apply --cached <hunks-de-shell.mjs-desta-frente>.diff
git apply --cached <hunks-da-isencao-em-templates.json>.diff
git commit -m "Isenção: cada sugestão abre a comparação de ementas numa gaveta onde se decide, e aplicar em lote deixa rastro na atividade"
```

---

### Task 4: A consulta com as comparações só de leitura e o cartão que fecha

**Files:**
- Modify: `scratchpad/isencao/telas/analise.mjs` (cartão da consulta calculado, atividade da consulta)
- Test: `scratchpad/isencao/prova-analise.mjs`

**Interfaces:**
- Consumes: `gavetaComparacao` e o gatilho do Task 3 (a consulta já recebe as gavetas sem rodapé pelo passo 4e do Task 3).

- [ ] **Step 1: Escrever as provas**

Acrescentar a `prova-analise.mjs`, antes de `fim()`:

```js
/* ------------------------------------------- consulta: comparação --- */
{
  const p = await abre('http://localhost:5214/t/isencao-consulta.html', { espera: 1500 });
  prova('consulta tem os nove gatilhos', (await p.js(`document.querySelectorAll('[data-abre-gaveta^="is-cmp-"]').length`)) === 9);
  prova('gaveta da consulta sem decisão', (await p.js(`document.querySelectorAll('.ucam-drawer [data-decisao]').length`)) === 0);
  prova('cartão fecha com as linhas', /Sugeriu 4 isentar, 2 revisar e 3 não isentar\. A coordenação seguiu 6 das 7 que não pediam revisão\./.test(await p.texto('[aria-labelledby="is-sug-t"] .ucam-section__hint')), await p.texto('[aria-labelledby="is-sug-t"] .ucam-section__hint'));
  prova('atividade conta a aplicação', /Aplicou a sugestão a 6 disciplinas/.test(await p.texto('ol[data-atividade]')));
  await p.fecha();
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node scratchpad/isencao/prova-analise.mjs`
Expected: `FALHA cartão fecha com as linhas` e `FALHA atividade conta a aplicação`.

- [ ] **Step 3: Calcular o cartão e registrar a aplicação**

No `pagina(modo)`, antes de `const sugestao =`:

```js
  const planas = Object.values(disciplinas).flat();
  const decPedro = Object.values(decisoesPedro).flat();
  const semRevisao = planas.filter((d) => d.sugestao !== 'revisar').length;
  const seguidas = planas.filter((d, i) => d.sugestao !== 'revisar' && d.sugestao === decPedro[i]).length;
```

e trocar o apoio do cartão no ramo `modo === 'consulta'` por:

```js
        `<p class='ucam-section__hint'>Sugeriu ${c.sug.isentar} isentar, ${c.sug.revisar} revisar e ${c.sug.nao} não isentar. A coordenação seguiu ${seguidas} das ${semRevisao} que não pediam revisão.</p></div></section>`
```

Nos `eventos` da consulta, entre o item "Observação enviada ao candidato" e o item "Análise iniciada":

```js
      timelineItem({ autor: 'Leonardo F. Benevides', papel: 'Coordenação', tempo: '10/03/2026 às 09:34', datetime: '2026-03-10T09:34', corpo: `Aplicou a sugestão a ${seguidas} disciplinas`, icone: 'listChecks', tom: 'info' }),
```

No objeto da tela `consulta`: `usa: [...usaBase, 'ucam-citacao', 'ucam-drawer', 'ucam-realce']`.

- [ ] **Step 4: Gerar e rodar**

Run: `node scratchpad/isencao/gera.mjs && pnpm run -s telas && node scratchpad/isencao/prova-analise.mjs`
Expected: `todas as provas passaram`.

- [ ] **Step 5: Commit**

```bash
git apply --cached <hunks-da-isencao-em-templates.json>.diff
git commit -m "Isenção: a consulta abre as mesmas comparações só para ler, e o cartão da sugestão fecha com as linhas"
```

---

### Task 5: O filtro de sugestão na fila

**Files:**
- Modify: `scratchpad/isencao/telas/fila.mjs` (`data-sugestao` na linha, select na barra, notas e fluxos)
- Modify: `tools/lib/shell.mjs` (`limpar-busca` zera select de dado; `tentar-analise` muda o dado da linha)
- Test: `scratchpad/isencao/prova-fila.mjs`

**Interfaces:**
- Consumes: a regra `dado:<chave>` do `filtroScript`, que lê `data-<chave>` da linha e o `value` do select.

- [ ] **Step 1: Escrever as provas**

Acrescentar a `scratchpad/isencao/prova-fila.mjs`, antes de `// Abas.`, numa página nova para não herdar estado:

```js
{
  const q = await abre('http://localhost:5214/t/isencao-fila.html', { espera: 1500 });
  const vis = (sel) => q.js(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(tr => !tr.hidden && tr.offsetParent !== null).length`);
  const L = `[data-aba='em-analise'] tbody tr`;
  const escolhe = (v) => q.js(`(() => { const s = document.querySelector("select[data-filtra='dado:sugestao']"); s.value = '${v}'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  prova('opções com contagem', (await q.js(`[...document.querySelectorAll("select[data-filtra='dado:sugestao'] option")].map(o => o.textContent).join('|')`)) === 'Todas (8)|Disponível (2)|Em processamento (1)|Falhou (1)|Sem análise (4)');
  await escolhe('disponivel'); await new Promise((r) => setTimeout(r, 150));
  prova('Disponível = 2', (await vis(L)) === 2, String(await vis(L)));
  await q.clica(`[data-filtra='dado:situacao'] button[data-valor='candidato']`);
  prova('Disponível + Aguardando candidato = Tiago', (await vis(L)) === 1 && /Tiago/.test(await q.texto(`${L}:not([data-filtrado-fora])`)));
  await q.clica(`[data-filtra='dado:situacao'] button[data-valor='']`);
  await escolhe('sem'); await new Promise((r) => setTimeout(r, 150));
  prova('Sem análise = 4', (await vis(L)) === 4, String(await vis(L)));

  // Review Focus 4: limpar zera o select de sugestão.
  await q.digita(`input[data-filtra='texto']`, 'Zzz');
  await q.clica(`#is-vazio [data-acao='limpar-busca']`);
  prova('limpar zera a sugestão', (await q.js(`document.querySelector("select[data-filtra='dado:sugestao']").value`)) === '');
  prova('limpar devolve as 8', (await vis(L)) === 8, String(await vis(L)));

  // Review Focus 3: tentar de novo muda o dado.
  await q.clica(`tr[data-candidato='maria'] [data-acao='tentar-analise']`);
  await escolhe('processando'); await new Promise((r) => setTimeout(r, 150));
  prova('Maria entra em Em processamento', (await q.js(`!document.querySelector("tr[data-candidato='maria']").hasAttribute('data-filtrado-fora')`)) === true);
  prova('Em processamento = 2', (await vis(L)) === 2, String(await vis(L)));
  await q.fecha();
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node scratchpad/isencao/prova-fila.mjs`
Expected: `FALHA opções com contagem` (o select não existe) e as seguintes.

- [ ] **Step 3: O select e o dado da linha em `fila.mjs`**

Em `linhaAnalise`, a abertura da linha:

```js
  return `<tr data-situacao='${c.situacao}' data-sugestao='${c.sugestao || 'sem'}' data-candidato='${c.id}'>` +
```

Em `fila()`, depois de `for (const c of candidatos) n[c.situacao]++;`:

```js
  const nS = { disponivel: 0, processando: 0, falha: 0, sem: 0 };
  for (const c of candidatos) nS[c.sugestao || 'sem']++;
```

No `toolbar`, logo depois do `campo` de Curso:

```js
    campo({ id: 'is-s', label: 'Sugestão', controle: select({ id: 'is-s', attrs: `data-filtra='dado:sugestao'`, opcoes: [
      { valor: '', rotulo: `Todas (${candidatos.length})` },
      { valor: 'disponivel', rotulo: `Disponível (${nS.disponivel})` },
      { valor: 'processando', rotulo: `Em processamento (${nS.processando})` },
      { valor: 'falha', rotulo: `Falhou (${nS.falha})` },
      { valor: 'sem', rotulo: `Sem análise (${nS.sem})` },
    ] }) }) +
```

Nas `notas` da tela `fila`, acrescentar `'O filtro Sugestão deixa pegar primeiro o que a análise automatizada já resolveu, com a contagem em cada opção. A ordem da fila não muda: é da mais antiga para a mais recente (padrão sugestao-automatizada, ADR-049).'`; em `fluxos.acoes`, `{ rotulo: 'Sugestão (filtro)', classe: 'c', efeito: 'Filtra as linhas pelo estado da análise automatizada; o eco diz quantas ficaram.' }`.

- [ ] **Step 4: Os dois ajustes em `tools/lib/shell.mjs`**

Script de uma leitura e uma gravação. Em `limpar-busca`, trocar:

```js
      Array.prototype.forEach.call(escopo.querySelectorAll('select[data-filtra^="coluna:"]'), function (sel) {
```

por:

```js
      Array.prototype.forEach.call(escopo.querySelectorAll('select[data-filtra^="coluna:"], select[data-filtra^="dado:"]'), function (sel) {
```

Em `tentar-analise`, logo depois de `botao.hidden = true;`:

```js
      // O dado da linha acompanha o selo: o filtro de sugestão lê data-sugestao.
      var trT = botao.closest('tr[data-sugestao]');
      if (trT) trT.setAttribute('data-sugestao', 'processando');
```

- [ ] **Step 5: Gerar e rodar as provas da fila e dos tratadores**

Run: `node scratchpad/isencao/gera.mjs && pnpm run -s telas && node scratchpad/isencao/prova-fila.mjs && node scratchpad/isencao/prova-handlers.mjs`
Expected: as duas terminam em `todas as provas passaram`.

- [ ] **Step 6: Commit**

```bash
git apply --cached <hunks-de-shell.mjs-desta-frente>.diff
git apply --cached <hunks-da-isencao-em-templates.json>.diff
git commit -m "Isenção: a fila filtra pelo estado da sugestão, e limpar e tentar de novo mantêm o filtro honesto"
```

---

### Task 6: Prova de ponta a ponta, captura e memória

**Files:**
- Create: `scratchpad/isencao/prova-gaveta-390.mjs`
- Modify: `C:\Users\Leonardo\.claude\projects\c--Users-Leonardo-Documents-DSUCAM\memory\dsucam-isencao.md`

- [ ] **Step 1: Escrever a prova do telefone (Review Focus 5)**

```js
// A gaveta de comparação a 390px: uma coluna, sem rolagem horizontal.
//   node scratchpad/isencao/prova-gaveta-390.mjs
import { abre, relator } from './cdp.mjs';
const { prova, fim } = relator();
const p = await abre('http://localhost:5214/t/isencao-analise.html', { largura: 390, altura: 844, espera: 1500 });
await p.cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await new Promise((r) => setTimeout(r, 400));
await p.js(`document.querySelector("[data-abre-gaveta='is-cmp-1']").click(); true`);
await new Promise((r) => setTimeout(r, 300));
const m = await p.js(`(() => { const g = document.getElementById('is-cmp-1'); const grade = g.querySelector('.ucam-grid'); const cols = getComputedStyle(grade).gridTemplateColumns.split(' ').length; const corpo = g.querySelector('.ucam-drawer__body'); return { cols, sobra: corpo.scrollWidth - corpo.clientWidth, larg: g.getBoundingClientRect().width }; })()`);
prova('uma coluna a 390', m.cols === 1, JSON.stringify(m));
prova('sem rolagem horizontal', m.sobra <= 0, JSON.stringify(m));
await p.fecha();
fim();
```

- [ ] **Step 2: Rodar**

Run: `node scratchpad/isencao/prova-gaveta-390.mjs`
Expected: `todas as provas passaram`. Se `cols` der 2, a grade está calculando o mínimo contra a janela e não contra a gaveta: medir `larg` e reportar antes de mexer em CSS.

- [ ] **Step 3: Build inteiro e todas as provas**

Run: `pnpm run build && node scratchpad/isencao/prova-fila.mjs && node scratchpad/isencao/prova-analise.mjs && node scratchpad/isencao/prova-candidato.mjs && node scratchpad/isencao/prova-handlers.mjs`
Expected: build verde (inclui `regra-anexo`, `obrigatoriedade` e os portões de marca e subpaleta) e quatro `todas as provas passaram`. `prova-candidato` cobre o "33%" que agora aparece no resultado do candidato.

- [ ] **Step 4: Capturas para revisão visual**

Com um script de captura no molde de `scratchpad/foto-gaveta.mjs`: `isencao-analise` a 1440 com a gaveta de Direito Civil I aberta, nos temas claro e escuro, e a 390 no claro; `isencao-fila` a 1440 com o filtro "Disponível". Olhar três coisas: o botão "Ver comparação" não empurra a célula de sugestão para três linhas; as marcas do realce aparecem nos dois lados; a lista de tópicos não mostra marcador de lista órfão.

- [ ] **Step 5: Atualizar a memória**

Em `dsucam-isencao.md`, acrescentar um parágrafo: sugestão assistida em 25/09 (spec e plano com esse nome), `comparacao()` como fonte única do motivo, gavetas `is-cmp-0..8` abertas por `data-abre-gaveta`, `decidir` sincroniza linha e gaveta por `data-disciplina-alvo`, padrão `sugestao-automatizada` e ADR-049 (a 048 é do anel de foco), e os números novos: Penal I 100%, Teoria Geral do Processo 33%, fila 2/1/1/4, consulta 6 de 7.

- [ ] **Step 6: Commit final, se sobrou algo**

```bash
git status --short
git commit -m "Isenção: provas da gaveta no telefone"
```
