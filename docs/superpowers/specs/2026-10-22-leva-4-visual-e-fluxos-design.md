# Leva 4: acabamento visual e fluxos das telas

Data: 22/10/2026. Estado: proposta, aguardando revisão.

## De onde vem

Captura da primeira dobra (1440×900, tema claro) das 114 páginas de `docs/t/` e um censo por página: primários, botões, selos, tabelas, campos, cartões de indicador, parágrafos e cores de fundo distintas. Leitura de 16 capturas, uma por tipo de tela, e conferência de fluxo contra o código dos sistemas em `Documents/UCAM-repos`.

Script e fotos: `scratchpad/leva4/captura.mjs` (sessão de 22/10). Atenção: o servidor do script serve só `docs/t/`, então os retratos de `docs/marca/` aparecem quebrados nas fotos. Isso não é defeito da tela.

As levas 1 a 3 (spec de 13/10) estão fechadas. Esta leva não reabre nada do que foi decidido nelas: o fio vertical da tabela (ADR-051), os sete tons do selo (ADR-066), os ladrilhos de ícone (ADR-060/061), as ações de linha no hover (25/09) e a busca em preenchimento continuam como estão.

## Diagnóstico em uma frase

As peças estão boas. O que pesa é a **repetição**: a mesma informação aparece duas ou três vezes por tela (indicador, aba, título e rodapé dizem o mesmo número), e os **controles de contexto** (período, ano) ocupam uma faixa própria em vez de morar no cabeçalho. Quase tudo o que segue tira peças; pouca coisa acrescenta.

Heurísticas usadas: Nielsen 8 (estética e design minimalista), 1 (visibilidade do estado), 6 (reconhecer em vez de lembrar); lei de proximidade (Gestalt); "uma pergunta por tela" (GOV.UK). Referências de padrão: Linear e Attio (contagem dentro da aba), Stripe Dashboard (período no cabeçalho da página), Polaris (cabeçalho de página com no máximo um primário e um grupo de secundárias), Carbon (ação em lote sempre visível, desabilitada até haver seleção).

## Achados e propostas

### 1. O número repetido

| Tela | Onde o mesmo número aparece | Proposta |
|---|---|---|
| Sala de matrícula | indicador "Prontos 4 / Com pendência 3 / Matriculados 1" **e** abas Prontos / Com pendência / Matriculados | A contagem vai para a aba ("Prontos 4"), como a Caixa de entrada do Protocolo já faz. A fileira de indicadores sai. Ganho: cerca de 125px; a tabela sobe para a metade da dobra. |
| Gerencial · Início | indicador "Bloqueados 9" **e** primeira linha de "Precisa de atenção": "9 usuários bloqueados" | O indicador fica só com o que não é pendência (ativos, grupos). Bloqueados e sem grupo ficam só em "Precisa de atenção", que já diz o que fazer. |
| Relatórios · Resultado | "24 alunos" no título, "Alunos 24 no filtro" no cabeçalho da tabela, "1–8 de 24 alunos" no pé | Sai o "24 no filtro" do cabeçalho da seção. Os chips de filtro já dizem o recorte. |
| Vestibular · Questão | "3 de 5 respondidas" no título, na etapa da lateral e no painel de questões | Fica no painel de questões, que é onde a pessoa age. O título leva o tempo restante, que hoje está numa linha solta abaixo da barra. |
| Usuários e listagens do Gerencial | "30 na unidade" ao lado do título e "1–10 de 30 usuários" no pé | Mantém (o contrato separa contagem de paginação). Fica registrado como aceito. |

Regra proposta para o contrato do `stat` e do `page-header`: **um indicador só entra se o número não estiver em outro lugar da tela**. Se a tela tem abas por situação, a contagem vai na aba.

### 2. Controle de contexto numa faixa própria

Captação · Painel (seletor de semestre sozinho numa faixa de 70px, seguida de fio), Pós e extensão · Cálculo acadêmico (ano + semestre, mesma coisa) e as telas de lote do SigFin pedem o período fora do cabeçalho. A Cobrança do mês e o Gerencial do Protocolo já fazem certo: o seletor fica à direita do título.

Proposta: o seletor de período ou de competência vai para a área de ações do `page-header`, no lugar do primário quando a tela não tem primário. A meta do título continua dizendo o valor escolhido ("2026.2 · graduação"). Ganho: 70 a 100px por tela, em cerca de 12 telas (censo a fazer na execução).

### 3. Tela sem primário quando a tarefa é uma só

Cálculo acadêmico: o propósito da tela é calcular, e a primeira dobra não mostra nenhuma ação. O "Calcular" só aparece na barra de lote depois de marcar uma linha. **O sistema atual mostra "Enviar Cálculo" sempre**, desabilitado até haver seleção (`extensao-frontend/.../calculo-curso.component.html`, `[disabled]="cursosSelecionados.length == 0"`). Regredimos em relação ao legado.

Proposta: em tela cuja tarefa principal é uma ação em lote (Cálculo acadêmico, Cálculo em lote, Enviar e Baixar mensalidades, Sincronização), o primário fica no cabeçalho em repouso, desabilitado com o motivo ("Marque ao menos um curso"), e passa a dizer a contagem quando há seleção ("Calcular 3 cursos"). A barra de lote continua para as ações secundárias. Ajuste no contrato de `data-table` (seleção) e de `button` (desabilitado com motivo, que já existe no ADR-042).

A conferir na execução: o mesmo padrão nas telas de lote do SigFin, contra `financeiro-frontend`.

### 4. Cabeçalho sobrecarregado na Análise da isenção

Título, selo, meta cortada ("8 se"), quatro ícones (informação, histórico com 4, anexos com 2, imprimir), um fio e três botões numa linha só. A meta é a primeira a ceder e some no meio de uma palavra.

Proposta: histórico, anexos e imprimir vão para um menu "Mais" (⋮) ou para o painel de apoio que a tela já tem; "Escrever ao candidato" vira item desse menu. Ficam o selo, a meta inteira, "Salvar rascunho" e "Enviar pedido ao candidato". E a meta nunca corta no meio: ou cabe, ou some inteira (regra de `text-overflow` no `page-header`).

### 5. Sublinhado em lista de navegação

Gerencial · Início, "Precisa de atenção": cada linha é um link sublinhado dentro de uma linha clicável. O sublinhado dobra o sinal de "clicável" que a seta de destino (memória de 25/09) já dá, e quatro sublinhados empilhados pesam mais que os números ao lado. Proposta: o título da linha sem sublinhado em repouso, com a seta › à direita, igual à Cobrança do mês.

### 6. Etapas da Cobrança do mês

A tela nova lê como lista de cadastros: cinco linhas do mesmo peso, e o selo de situação embaixo do texto. Proposta, sem mudar a regra aberta da ordem: número da etapa no lugar do ladrilho de ícone, a situação na mesma linha do nome, e a etapa com pendência como a única com cor (já é a regra da spec de 13/10; hoje "Concluída" e "Em andamento" também têm contorno).

## Fluxos contra o código real

Esta leva confere fluxo só onde a tela já tem par no código. Começa pelas cinco telas de lote (achado 3), porque é ali que o desvio foi medido. Para cada tela: o fluxo do legado (botões, ordem, o que fica desabilitado), o fluxo da tela no DS, e a diferença com decisão. Vai para `regras_negocio` da tela como `legado` com evidência (caminho do arquivo), como na revisão de 12/10.

Fica para uma leva seguinte: Portal (grade de módulos, 2.728px de página), Turmas compartilhadas e Gestão de polos, que são de ontem e ainda não têm captura de referência.

## Ordem de execução

1. Achados 1 e 2 (tirar peças: contagem na aba, indicador repetido, seletor no cabeçalho). Baixo risco, ganho visual alto.
2. Achado 4 e a regra da meta que não corta.
3. Achados 5 e 6.
4. Achado 3 com a conferência das telas de lote contra o código. Pede ADR, porque muda o contrato da tabela com seleção.

Cada passo muda tela e contrato juntos (regra de 13/10), em worktree a partir da main.

## Como provar

Captura antes e depois das telas tocadas nos dois temas, com o servidor servindo `docs/` inteiro. Censo de altura da primeira dobra e de primários por tela. `pnpm run validate`, `obrigatoriedade`, `faixa`.

## Pendências fora desta spec

A árvore de trabalho da main tem 26 arquivos alterados e sem commit (prazo, data-table, templates, Sites). Esta leva não começa em cima deles: ou entram em commit antes, ou a worktree parte do último commit e os dois se juntam depois.
