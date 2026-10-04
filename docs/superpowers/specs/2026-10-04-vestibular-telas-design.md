# Vestibular Online — o app vira projeto do UCAMDS

Design de 04/10/2026. Pedido: "subir esse projeto lá no UCAMDS", respondido
como **catalogar o Vestibular Online no design system**: projeto, moldura e
uma tela de referência por rota do app, como a Isenção entrou em 24/09/2026.
Desenho aprovado em conversa no mesmo dia, com os dois lotes (candidato e
banca) e a coluna do candidato entrando na moldura por uma chave nova do
`shell.mjs`.

## De onde vem

O app `vestibular-online` (Angular 21, Trilho B, `@ucam/ui` 0.1.2), que
substitui o `processo-seletivo-frontend` (Angular 9) falando com o mesmo
backend. Ao contrário da Isenção, que chegou como protótipo, aqui a
evidência é um app que roda: cada tela de referência descreve uma rota que
existe, com testes, e os `problemas` de cada tela são os do legado que o app
já estudou e corrigiu.

O que o DS ganha: o primeiro fluxo de **uma pessoa, uma tarefa com começo e
fim, contra o relógio** — nenhum dos oito padrões descreve isso — e a
primeira moldura cuja coluna esquerda não é menu.

## Em que base o trabalho entra

Medido em 04/10/2026, e muda o plano:

- O repositório tem **duas linhas que não se encontraram**. A árvore
  `Documents/DSUCAM` (branch `publicacao-dos-pacotes`, 17 commits à frente
  do remoto e 31 arquivos pendentes, de outra sessão) é a linha do
  catálogo: 54 ADRs, 8 telas de isenção, o campo `regras_negocio`, as telas
  vivas (ADR-058). O clone `Novo Vestibular/ucamds` (branch `main`, 6
  commits à frente do remoto) é a linha da biblioteca: `@ucam/ui`
  instalável e a 0.1.2. A linha do catálogo ainda tem os 74 arquivos com
  import por alias que quebravam o pacote; a linha da biblioteca não tem
  `regras_negocio` nem as ADRs 051 a 058.
- O catálogo do Vestibular depende da linha do catálogo (formato de tela
  com `regras_negocio`, moldura atual) **e** descreve um app que depende da
  linha da biblioteca.

Decisão proposta: o trabalho desta spec é feito num branch
`vestibular-telas` deste clone, criado a partir do `HEAD` commitado de
`Documents/DSUCAM` (trazido por `git fetch` local, sem tocar naquela
árvore). A junção das duas linhas — `main` com `publicacao-dos-pacotes` — é
um trabalho à parte, com spec própria, e não é pré-requisito: as telas de
referência são marcação do Trilho A e não dependem da biblioteca. Fica
registrado como pendência do repositório, não desta entrega.

## Projeto

Em `spec/templates.json`, depois de `isencao`:

| Campo | Valor |
|---|---|
| `id` | `vestibular` |
| `nome` | Vestibular Online |
| `icone` | `graduationCap` |
| `categoria` | `pessoas` (o teal que o app usa em `data-sistema`) |
| `stack_atual` | Angular 21 com `@ucam/ui` (Trilho B); substitui o `processo-seletivo-frontend`, Angular 9 |
| `descricao` | A prova do candidato, a correção da banca e o cadastro de provas; a isenção de disciplinas do mesmo processo é o projeto `isencao` |

Sem `cor` própria: a faixa sai da categoria, como nos outros sistemas.

## Duas molduras

**Banca** é o `shell` do projeto, igual ao dos outros sistemas (faixa, rail
como menu, campus, conta):

- Correção: Redações (com contagem da fila)
- Isenção: Fila de análise, com destino na tela `isencao/fila` que já existe
- Cadastro: Provas

**Candidato** é por tela: sem rail, sem busca, sem lançador. A coluna
esquerda leva as etapas (Conferir dados, Antes de começar, Prova, Redação,
Resultado), o cartão do candidato (iniciais, nome, CPF, curso, turno) e, no
pé, "Falar com a secretaria". Na faixa, o relógio da prova e o campus.

### A chave nova: `navHtml`

`tools/lib/shell.mjs` hoje aceita de uma tela `semNav` (coluna vazia) e
`navAtivo`. Entra uma terceira, aditiva: `shell.navHtml`, marcação que
ocupa `.ucam-nav__scroll` no lugar dos grupos de menu. Com ela a coluna
existe, com o mesmo `<nav>`, o mesmo comportamento de gaveta abaixo de
64rem e o mesmo rodapé; sem ela, nada muda para as 31 telas atuais.

- `aria-label` do `<nav>` passa a vir de `shell.navRotulo` quando houver
  ("Etapas da prova"); o padrão continua "Navegação principal".
- A marcação passa pelo mesmo portão de `preview`: classes do Trilho A que
  existem, links na convenção `#/templates/<projeto>/<tela>`.
- Alternativa recusada: desenhar as etapas no corpo da tela. A referência
  mentiria sobre onde elas ficam, e é justamente o arranjo que o DS ainda
  não tem.

Combinado com a sessão que edita o mesmo arquivo: ela não mexe em
`renderShell` nem em `shellDaTela`.

## Padrão novo: `fluxo-guiado`

Em `spec/patterns/patterns.json`, status `draft`.

- **Resumo** (até 160 caracteres): "Uma pessoa, uma tarefa com começo e
  fim: etapas visíveis, uma ação que avança por etapa, tempo e progresso
  sempre à vista."
- **Problema**: no legado a prova é uma página só, sem dizer em que ponto a
  pessoa está, com o relógio no corpo (some ao rolar) e a entrega num botão
  igual aos outros.
- **Estrutura**: moldura com as etapas na coluna; barra da tela com
  título, progresso e relógio; corpo com uma coisa a fazer; apoio lateral
  (mapa de questões) que vira gaveta abaixo de 64rem; diálogo de entrega.
- **Regras**:
  1. Uma ação primária por etapa, e ela avança.
  2. As etapas ficam visíveis e não se pula para frente; voltar é permitido
     onde não desfaz nada.
  3. Tempo e progresso moram na barra, não no corpo; o último terço muda de
     tom com palavra junto, nunca só de cor.
  4. O que a pessoa faz é salvo sem pedir, e a tela diz que salvou.
  5. Sair da tarefa é uma só ação, com confirmação que lista o que ficou em
     branco; não há botão desabilitado sem saída ("Ir para a redação" em
     vez de "Entregar" cinza).
  6. Trocar de passo move o foco para o título do passo novo.
  7. Estado por item em forma e palavra (bolha cheia e vazia), não em matiz.
- **Usa**: `ucam-app-shell`, `ucam-button`, `ucam-progress`,
  `ucam-stepper`, `ucam-dialog`, `ucam-drawer`, `ucam-alert`, `ucam-card`.
- **Evidência**: as rotas `/candidato/:oid/**` do app.

As ADRs que o padrão puxa (o desvio do check no `choice-card`, a bolha
cheia fora da conta da ADR-023, o `clock` no turno) ficam para a spec
seguinte, com o detalhamento do padrão.

## Lote 1 — candidato, 6 telas

| `id` | Padrão | Rota do app | O que a tela mostra |
|---|---|---|---|
| `entrada` | formulario-entidade | `/` | O bloco `ucam-login` com a cena, o campo para o código ou o link colado e os atalhos de teste fora do preview |
| `conferir-dados` | formulario-entidade | `/candidato/:oid` | Os dados da inscrição em lista de descrição, o aviso de prazo e "Continuar" |
| `instrucoes` | fluxo-guiado | `…/instrucoes` | Indicadores (questões, tempo, redação), cartões de orientação, a confirmação de leitura e "Iniciar prova" |
| `questao` | fluxo-guiado | `…/prova/:caderno/:n` | Enunciado, alternativas com a letra preenchida, "Marcar para revisar", anterior e próxima, mapa de questões ao lado e o diálogo de entrega |
| `redacao` | fluxo-guiado | `…/prova/redacao` | Proposta em citação, a folha, o contador contra o mínimo e o estado de salvamento |
| `resultado` | fluxo-guiado | `…/resultado` | Cartão com a situação, indicadores e o próximo passo; as variações (aguardando a banca, aprovado, nova tentativa) como estados |

A tela de erro do app não vira tela: é o estado `error` de `questao`. A
entrega é o diálogo de `questao`, pelo `dialogoScript` que o gerador já
tem.

## Lote 2 — banca, 3 telas

| `id` | Padrão | Rota do app | O que a tela mostra |
|---|---|---|---|
| `redacoes` | triagem-lista-detalhe | `/banca/redacoes` | Abas Em espera e Corrigidas, a fila à esquerda, e à direita o texto do candidato, os dados e a nota |
| `provas` | listagem-inspetor | `/banca/provas` | O recorte (processo, forma, captação), os cadernos e as questões de cada um; excluir caderno em diálogo destrutivo |
| `questao-form` | formulario-entidade | `/banca/provas/:caderno/questao/:questao` | Enunciado, alternativas e gabarito em página própria; excluir em diálogo |

## O que cada tela carrega

Os campos que as telas atuais já têm, na linha do catálogo:

- `origem`: a rota e o arquivo do app (`src/app/candidato/prova/questao/`).
- `perfil`: Candidato ou Banca.
- `usa`: só seletor com contrato, e todo `<ucam-*>` do `codigo` declarado.
- `problemas`: os do legado, um por linha, concretos (o relógio que some,
  a alternativa sem estado, a redação num editor rico que cola formatação).
- `notas`: as decisões que o app tomou, com data e ADR quando houver.
- `regras_negocio`: o que a tela supõe do negócio, com `situacao` e
  `decide`. Do que já se sabe:
  - `legado`: o resultado da prova com redação só sai depois da nota da
    banca; o aprovado segue para a área do inscrito, fora do app.
  - `proposta`: o tempo de prova dos exemplos; a aprovação com metade da
    objetiva e 5 na redação (suposição do mock); a correção de redação
    exigir login (no legado abre sem); "marcar para revisar" só no
    navegador.
  - `aberta`: o texto definitivo das instruções e do contato da secretaria;
    o editor de questão em texto simples contra o editor rico do legado.
- `preview`: marcação do Trilho A escrita a partir do DOM real do app, com
  os dados dos candidatos de teste do mock. Só desenha o que o app desenha.
- `codigo`: o template do app, cortado ao essencial.
- `fluxos`: as ações do preview e o efeito de cada uma (classe `c` para o
  que o protótipo faz, `b` para o que não está desenhado).

Nenhum número das telas é regra: tempo, nota de corte e contagens são
exemplo, como no resto do catálogo.

## Fora desta entrega

- A junção das duas linhas do repositório.
- As telas vivas (ADR-058) do Vestibular: dependem da biblioteca corrigida
  na linha do catálogo, isto é, da junção.
- ADRs novas e o detalhamento do padrão `fluxo-guiado`.
- A isenção: o DS já a tem, e o app a copiou de lá.
- Publicar. O push e a Vercel ficam com o Leonardo.

## Como se confere

Por lote:

1. `pnpm validate` sem erro novo, e `pnpm build` inteiro (os portões de
   contraste, subpaleta, daltonismo, obrigatoriedade, crases e o prerender
   do site).
2. Site local: a página de cada tela e a tela autônoma em `/t/`, em print
   headless claro, escuro e 390px, ao lado do print da rota do app com o
   mesmo candidato de teste. Diferença que não seja de trilho é defeito de
   um dos dois, e vira correção ou nota.
3. `ucam_check_usage` no `codigo` de cada tela.
4. Um commit por lote, mais um para a chave `navHtml` e um para o padrão,
   no branch `vestibular-telas`. Sem push.
