# Isenção: a sugestão automatizada mostra por que sugeriu

Design proposto em 25/09/2026. Pergunta de origem: "podemos incentivar o
uso de IA nesse app de isenção?". Escopo escolhido em conversa no mesmo
dia ("seguir", opção A): o lado da coordenação, com a evidência na
análise, o filtro na fila e o padrão do DS que sustenta os dois.

## O que já existe

A isenção já tem IA. A análise automatizada compara cada disciplina do
histórico com a da matriz e propõe Isentar, Revisar ou Não isentar, com
um motivo curto ("Ementa compatível: 92%"). A spec de 24/09 fixou três
coisas que continuam valendo:

- a sugestão é atributo da solicitação (disponível, em processamento,
  falhou, sem análise), não um modo do menu;
- "Aplicar sugestões" preenche só as pendentes, deixa "revisar"
  pendente e nunca sobrescreve decisão tomada;
- a decisão é sempre da coordenação.

## O problema

A coordenação não tem motivo para confiar na sugestão. O percentual é
uma afirmação sem prova: para conferir "61%", a analista abre o PDF das
ementas, procura a disciplina e compara de cabeça. Quem faz isso nove
vezes por solicitação para de olhar a sugestão, ou pior, aplica sem
olhar. Nos dois casos a ferramenta não ajuda.

A fila tem o mesmo buraco em escala menor. A coluna Sugestão diz quem
tem sugestão pronta, mas não há como pegar só essas, e são as que se
resolvem mais depressa.

## O que muda, e por quê

**Incentivar é mostrar a evidência e poupar trabalho, nunca empurrar.**
Nada neste desenho pré-preenche decisão, promove "Aplicar sugestões" a
primário ou pinta a sugestão de marca. O uso cresce porque conferir a
sugestão fica mais barato do que ignorá-la.

1. **A sugestão mostra a comparação a um clique.** Cada sugestão da
   análise ganha "Ver comparação", que abre uma gaveta com as duas
   ementas lado a lado e os trechos que casaram marcados. A analista
   decide ali mesmo, sem voltar à linha.
2. **A confiança é dita como fato.** "11 de 18 tópicos da ementa
   coincidem · carga 80h de 80h", não uma barra colorida nem um
   "alta/média/baixa". Percentual sozinho não explica nada.
3. **A origem é dita uma vez, em palavras.** "Sugestão automatizada"
   continua o rótulo. O apoio da seção diz uma vez que ela é gerada por
   IA a partir das ementas e da carga horária. Nenhum ícone de brilho,
   nenhuma cor própria para IA.
4. **Aplicar deixa rastro.** Preencher decisões pela sugestão registra
   na atividade quem aplicou e quantas, para que o parecer diga o que
   foi decisão humana conferida e o que foi aplicado em lote.
5. **A fila deixa pegar as prontas primeiro.** Um filtro de sugestão na
   barra de ferramentas, com a contagem em cada opção.

## O padrão do DS: sugestão automatizada

Hoje o catálogo não tem padrão para conteúdo gerado por máquina. A
isenção é o primeiro caso, e o Protocolo e o Gerencial vão pedir o
mesmo. Entra em `spec/patterns/patterns.json` o padrão
`sugestao-automatizada`, com status `draft` (uma tela só, abaixo do
limite de três que vira gabarito), e a ADR-048.

**ADR-048 — Sugestão de máquina é rotulada, mostra a evidência e nunca
decide.**

Regras do padrão:

- **Rótulo de origem em palavras.** "Sugestão automatizada" no selo ou
  na coluna; a frase "gerada por IA a partir de …" uma vez, no apoio da
  seção. Sem ícone de brilho, sem varinha, sem cor exclusiva.
- **Sugestão e decisão nunca se confundem.** A sugestão é selo; a
  decisão é controle (ou selo fixo depois de concluída). Rótulos
  diferentes: "Isentar" sugere, "Isenta" decide.
- **Evidência a uma ação de distância.** Toda sugestão que afirma
  compatibilidade tem "Ver comparação". A evidência abre em gaveta,
  porque complementa a decisão sem interrompê-la (contrato do drawer).
- **Confiança como fato contável.** Quantos de quantos, qual medida.
  Cor nunca é o único portador, e não existe escala de confiança
  inventada.
- **A máquina nunca decide sozinha.** Aplicar em lote é ação
  secundária, preenche só o vazio, diz quantas preencheu e deixa rastro
  com autor humano.
- **Estado honesto.** Em processamento, falhou e sem análise são
  estados visíveis com o que fazer, nunca ausência silenciosa.

## As telas

### `analise` — Análise da solicitação

**Coluna de sugestão.** O motivo curto continua em apoio sob o selo.
Abaixo dele, um link-botão "Ver comparação" (fantasma, `sm`) nas linhas
que têm disciplina de origem. Nas duas linhas sem equivalente, o texto
vira "Ver disciplinas próximas", porque a evidência é outra: nenhuma
disciplina do histórico passou do limite. O nome acessível carrega a
disciplina: "Ver comparação de Direito Civil I".

**Gaveta "Comparação de ementas".** Título com o nome da disciplina da
matriz, apoio com a sugestão e o fato ("Revisar · 11 de 18 tópicos
coincidem · carga 80h de 80h"). Corpo em duas colunas que empilham
abaixo de 40rem:

- **Do histórico:** nome da disciplina de origem, instituição, carga
  horária, ementa.
- **Da matriz DIR20222:** nome, código em `.ucam-id`, carga, ementa.

Os trechos que casaram vêm marcados com o realce nas duas colunas. Uma
lista curta abaixo diz o que não casou ("Não aparece no histórico:
responsabilidade civil, contratos em espécie"), que é o que decide um
"Revisar". Rodapé da gaveta: o mesmo segmented da linha (Isentar · Não
isentar · Pendente). Decidir na gaveta muda a linha, o resumo e anuncia,
pelo mesmo tratador `decidir`. Fechar devolve o foco ao link que abriu.

Nas linhas sem equivalente, a gaveta mostra a ementa da matriz e as duas
disciplinas do histórico mais próximas, cada uma com o fato ("2 de 9
tópicos"), e a frase "Nenhuma passou de 5 tópicos em comum".

**Cartão "Sugestão automatizada" no painel.** O apoio passa a dizer o
método em uma frase: "Gerada por IA a partir das ementas e da carga
horária. Compara tópico a tópico." O resto fica como está.

**Aplicar sugestões.** Além do que já faz, registra na atividade:
"Leonardo F. Benevides aplicou a sugestão a 1 disciplina" (autor
humano, ícone `listChecks`, hora em HH:mm). Aplicar de novo sem nada a
preencher diz "Nenhuma decisão pendente com sugestão" e não registra.

**Seção de disciplinas.** O apoio muda para "Decida cada disciplina. A
sugestão mostra a comparação que a sustenta; a decisão é sempre da
coordenação."

### `consulta` — Solicitação concluída

A linha "a coordenação seguiu 8 de 9" já existe. Entra na atividade o
registro "aplicou a sugestão a 6 disciplinas", para que a história
conte o que foi aplicado. As comparações ficam disponíveis também na
consulta, só leitura, sem o segmented no rodapé da gaveta.

### `fila` — Fila de análise

Um select "Sugestão" na barra de ferramentas, ao lado do de curso, com
a contagem em cada opção: Todas (8) · Disponível (2) · Em processamento
(1) · Falhou (1) · Sem análise (4). Filtro aplicado vira chip
removível, como os outros; "Limpar filtros" zera também este. A
ordenação da fila não muda: é da mais antiga para a mais recente, e
prazo não se troca por conveniência da ferramenta.

## Números que fecham

- Fila, sugestão: 2 disponível (João Cutrim, Tiago Barbosa Reis) + 1
  em processamento (Carlos Henrique Dias) + 1 falhou (Maria Souza) + 4
  sem análise (Ana, Bruna, Rafael, Lúcia) = 8.
- João Cutrim: 9 comparações, uma por disciplina. Os fatos batem com os
  motivos que já existem: a razão de tópicos arredonda para o
  percentual do motivo (61% em Direito Civil I = 11 de 18); onde diz "carga 60h de 80h", a gaveta mostra essa carga.
  O gerador reprova se um motivo e sua comparação divergirem.
- Aplicar na tela de referência: das 3 pendentes, só Direito
  Empresarial I tem sugestão aplicável (não isentar) e vira decidida;
  Direito Civil I e Direito Constitucional I são "revisar" e continuam
  pendentes. Resumo depois de aplicar: 4 isentas, 3 não isentas, 2
  pendentes.
- Pedro Alves (consulta): 6 aplicadas, 8 de 9 seguidas.

## Contratos e componentes

Regra de tela e componente no mesmo passo.

- **drawer:** usado como está. Conferir no contrato a largura, o foco
  inicial no título, Esc, e a volta do foco ao gatilho.
- **realce:** o contrato hoje fala só de busca. Estende-se o escopo
  para "o trecho que casou numa comparação", com a mesma marcação e o
  mesmo tom, e um exemplo novo na anatomia. Se o contrato exigir o
  termo buscado como fonte, a extensão entra como variante documentada.
- **segmented, badge, link, timeline, select, chip:** usados como estão.
- **patterns.json:** padrão novo `sugestao-automatizada`.
- **adr.json:** ADR-048.
- **Tratadores em `tools/lib/shell.mjs`:** novo `ver-comparacao`
  (preenche a gaveta a partir de um `<template>` por disciplina e
  abre); `decidir` passa a achar a linha por `data-disciplina` quando o
  controle está na gaveta; `aplicar-sugestoes` ganha o registro na
  atividade. O `filtroScript` da fila ganha a coluna de sugestão pelo
  caminho que já usa para curso.

## Provas

`pnpm run validate` e `pnpm run build` verdes. `prova-analise.mjs`
estendida: abrir a gaveta pelo teclado, decidir nela e ver a linha e o
resumo mudarem, Esc devolver o foco ao gatilho, aplicar registrar na
atividade. `prova-fila.mjs`: o filtro de sugestão dá 2, o chip aparece
e limpar zera. Sondas do repositório nas três telas tocadas: controles
vivos, feedback por voz, alvos de 24/44, pixel. Captura a 1440 e a 390
nos dois temas, com a gaveta aberta.

## Riscos

- **Sessão paralela.** `templates.json`, `patterns.json` e
  `tools/lib/shell.mjs` têm alterações não commitadas de outra sessão
  neste momento. Toda edição lê e grava no mesmo instante, e o commit
  leva só o que esta frente tocou.
- **Texto das ementas.** É inventado para a tela de referência. Precisa
  soar como ementa de verdade, curta, e os tópicos que casam precisam
  ser os mesmos nas duas colunas, palavra por palavra, ou o realce
  mente.

## Fora de escopo

- O ciclo de retorno: motivo opcional quando a coordenação diverge e o
  indicador "sugestões seguidas" no Gerencial (opção B).
- "Sugerir texto" para a observação ao candidato.
- O lado do candidato, inclusive a leitura automática do histórico
  (opção C).
- O modelo em si, o backend e a tela do Trilho B em Angular além do
  esboço no campo `codigo`.
