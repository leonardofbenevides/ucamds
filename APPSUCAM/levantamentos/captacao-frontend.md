# Inventário do front-end de Captação / CRM (Angular 9)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\captacao-frontend`
Lido em 06/10/2026: `src/app` (rotas, moldura, guard, store, serviços, modelos, enums e as oito páginas), `environments/environment.ts`, `package.json` e README (padrão do Angular CLI). Caminhos abaixo são relativos a `src/app`.

Profundidade da leitura: rotas, serviços, modelos, enums, moldura e os componentes de captação, rematrícula, metas, dashboard e financeiro foram lidos linha a linha. A página de pós-graduação (`pages/processo-seletivo`) é cópia da de captação e foi lida por diferença. Nos componentes de gráfico (`shared/components/chart/*`, `analise-meta/components/*`, `chart-bolsa`) foram lidos tipos, séries, eixos, cores e limites; as opções de estilo do Highcharts não.

Título na moldura: "Gestão de Relacionamento com o Cliente" (`app.component.ts:89`). `APPLICATION_ID`: `aplicPainelRematricula`.

Stack: Angular 9.1.12, Angular Material 9.2.4, ngrx 9.2, `ucam-material` 0.0.910-alpha.43, `default-style` 0.0.910-alpha.20-test-9, Highcharts 8.1.2 + `highcharts-angular` 2.7, `ngx-skeleton-loader` 4, `exceljs` 4.1.1, `pdfmake` 0.1.68, `file-saver` 2.0.2.

## 1. Rotas e telas

### 1.1 Tabela de rotas (`app-routing.module.ts`)

| URL | Componente | Template | Guard |
|---|---|---|---|
| `login/:routeredirect/:token/:user/:unidade` | `LoginComponent` | `shared/components/login/login.component.html` | nenhum |
| `''`, `home` | redirecionam para `captacao` | — | comentado |
| `captacao`, `captacao/:periodoletivo/:modalidade` | `CaptacaoComponent` | `pages/captacao/views/captacao.component.html` | comentado |
| `captacao-pos-graduacao`, `captacao-pos-graduacao/:periodoletivo/:modalidade` | `ProcessoSeletivoComponent` | `pages/processo-seletivo/views/processo-seletivo.component.html` | comentado |
| `rematricula`, `rematricula/:periodoletivo/:modalidade` | `RematriculaComponent` | `pages/rematricula/views/rematricula.component.html` | comentado |
| `metas` | `MetaComponent` | `pages/meta/views/meta.component.html` | comentado |
| `analise-metas` | `AnaliseMetaComponent` | `pages/analise-meta/views/analise-meta.component.html` | comentado |
| `dashboard` | `DashboardNovoComponent` | `pages/dashboard-novo/views/dashboard-novo.component.html` | comentado |
| `financeiro` | `FinanceiroComponent` | `pages/financeiro/views/financeiro.component.html` | comentado |
| `bolsa-social` | `BolsaSocialComponent` | `pages/bolsa-social/views/bolsa-social.component.html` | comentado |

`AuthGuard` existe (`core/services/auth/auth-guard.service.ts`) mas todas as 13 linhas `canActivate` estão comentadas: nenhuma rota é protegida.

### 1.2 Dashboard (`/dashboard`)

**Propósito.** Visão do semestre: alunos por modalidade comparados ao mesmo semestre do ano anterior, evasão, valor recebido e a receber, e a abertura por unidade e curso.

**Arquétipo.** Painel: faixa de cartões de indicador + filtro de período + tabela mestre com linha expansível.

**Anatomia.**
- **Recorte:** **semestre** (`mat-select`, "Semestre AAAA-S", de 2018 até o corrente; abre no corrente). Na tabela: busca "Pesquise" e seletor segmentado de modalidade — Todos, Presencial, EAD, Híbrido, Pós-graduação.
- **Indicadores: 4 cartões** (`soma-alunos-card`) — **Presencial, EAD, Híbrido, Total**. Cada cartão traz:
  - quantidade de alunos;
  - **variação percentual contra o mesmo semestre do ano anterior** (seta verde para cima / vermelha para baixo, "Comparado a AAAA-S") — comparação **período × período anterior**;
  - "N Evadidos" (em alerta quando > 0);
  - "Valor recebido" e "A receber" em reais.
  Nenhuma meta. Carga com esqueleto (`ngx-skeleton-loader`).
- **Gráficos:** nenhum.
- **Tabela** (ordenável em todas as colunas; paginação no navegador 10, 25, 100): Unidade/Polo, EAD/Presencial (ícone + modalidade), Cursos (`n cursos`), Alunos, Evasão, Bolsas (só no semestre corrente), Valor recebido, Valor a receber, Tipo de curso.
- **Drill-down:** clicar na linha expande a subtabela de **cursos da unidade** (curso, modalidade, tipo, alunos, evasão, bolsas, valor recebido, valor a receber). Vazio: "Sem dados para a pesquisa".
- **Exportar / totais:** não há.

**Classificação: parcial.** Base: `painel-indicadores`, referência `gerencial/inicio` (e `protocolo/gerencial`); peças `stat` (ADR-046 "stat com figura"), `segmented`, `data-table`. Falta: `stat` com **variação contra período anterior** e linhas secundárias (evadidos, recebido, a receber) no mesmo cartão — não confirmado se o contrato cobre —, e linha expansível com subtabela.

### 1.3 Financeiro (`/financeiro`)

**Propósito.** Mostrar, por mês e regime, alunos, faturado, recebido e a receber no total e por modalidade, e a abertura por unidade e curso com ticket médio.

**Arquétipo.** Painel: filtros no cabeçalho + cartões gerais + abas de modalidade com cartões próprios + tabela com linha expansível + menu de relatórios.

**Anatomia.**
- **Recortes:** **Ano** (2018 até o corrente), **Mês**, **Regime** (Caixa / Competência), busca "Buscar por Unidade/Polo"; **abas de modalidade** — Presencial, EAD, Semipresencial, Pós-Graduação.
- **Indicadores gerais ("Todos"): 4 cartões** (`card-financeiro`):
  1. Total de alunos — variação % **em relação ao mês anterior**;
  2. Valor faturado — variação % **em relação ao mês anterior**;
  3. Valor recebido — "% do faturado" (**parte × todo**);
  4. A receber — "% restantes".
- **Indicadores da modalidade: 7 cartões:** Total de alunos (Δ mês anterior), Valor faturado (Δ mês anterior), Valor recebido (% do faturado), A receber (% restantes), Alunos com bolsa 100% (% do total), Mensalidades geradas (Δ mês anterior), Mensalidades pagas (Δ mês anterior). Seta para cima/baixo e cor positiva/negativa; alguns cartões com fundo tinto (`destacarComFundo`).
- **Gráficos:** nenhum.
- **Tabela** (ordenável; paginação 10, 25, 100): Unidade/Polo, Modalidade, Cursos, Alunos pagantes, Valor recebido, Ticket médio.
- **Drill-down:** linha expande os **cursos** (curso, modalidade, "N alunos totais", "N alunos pagantes", valor recebido, ticket médio). Vazio: "Nenhum curso encontrado para a modalidade selecionada."
- **Exportar** (menu, arquivos gerados no servidor): Contas Recebidas, Faturamento, Cobranças em Aberto, Listagem de Alunos (`.zip`), Inadimplentes, Ticket médio por curso, Ticket médio por unidade e curso, Modalidade x Regime. Diálogo de espera com spinner.

**Classificação: parcial.** Base: `painel-indicadores` (`gerencial/inicio`, `protocolo/analytics`) + `consulta-relatorio` para o menu de relatórios (`relatorios/catalogo`); peças `stat`, `tabs`, `select`, `data-table`, `menu`. Falta: `stat` com variação contra período anterior e com razão "parte do todo"; linha expansível; menu "Exportar" com vários relatórios.

### 1.4 Captação - Graduação (`/captacao/:periodoletivo/:modalidade`)

**Propósito.** Acompanhar o processo seletivo por situação do candidato (pendente, confirmado, aprovado, matriculado), por modalidade e por unidade.

**Arquétipo.** Painel comparativo: cartões-gráfico por modalidade + lista de unidades com barra empilhada + diálogo de detalhe.

**Anatomia.**
- **Recortes:** **período letivo de captação** (`ucam-material-select`, rótulo `ano/semestre - captação`; vai para a URL), **modalidade** (botões abaixo dos cartões; vai para a URL), **unidades** (lista de caixas de marcação com "Selecionar todos"; rótulo "Unidade: Todas" / "Unidades: N selecionadas"), busca "Pesquisar unidade…". Botão que mostra/oculta os cartões.
- **Legenda fixa:** Matriculado, Aprovado, Confirmado, Pendente.
- **Indicadores: um cartão-gráfico por modalidade** (`card-chart-captacao`): título, **total geral**, gráfico de **colunas** com as quatro situações (ordem matriculado, aprovado, confirmado, pendente) e legenda `n (x%)` por situação. Sem meta, sem período anterior — a comparação é **entre situações** e **entre modalidades**.
- **Lista "Unidade / Polo":** uma linha por unidade com `nome — total` e **barra horizontal empilhada** (mesmas quatro situações).
- **Drill-down:** clicar num cartão de modalidade ou numa linha de unidade abre o diálogo (1.5).
- **Exportar** (menu por modalidade: EAD, PRESENCIAL, SEMIPRESENCIAL; HÍBRIDO comentado): planilha "LISTA DE CANDIDATOS - <modalidade>" com 24 colunas (ver regra 13).

**Classificação: parcial.** Base: `painel-indicadores` (`protocolo/analytics`); peças `chart`, `card`, `list-item`, `combobox`, `segmented`. Falta: **cartão-gráfico** (título + total + gráfico + legenda com percentuais, clicável) e **linha de lista com barra empilhada** por situação.

### 1.5 Diálogo de captação (`ModalCaptacaoComponent`, 90% × 80%)

**Propósito.** Abrir uma modalidade ou unidade em tabela cruzada situação × turno, por curso e por unidade.

**Peças.** Botões "Exportar" e "Fechar"; mensagem de progresso da exportação ("Iniciando exportação...", "Carregando dados...", "Gerando relatório... (N segundos)", "Relatório gerado com sucesso!"). Abas **Cursos** e **Unidades** (a segunda só quando o diálogo vem do cartão de modalidade). Cabeçalho `título / N Alunos` + lista de situações com totais; barra empilhada; tabela.
**Tabela** (`table-captacao`): cabeçalho em dois níveis — primeira coluna CURSO ou UNIDADE; grupos MATRICULADO, APROVADO, CONFIRMADO, PENDENTE, cada um aberto em **M / T / N** (presencial) ou **I** (demais); zeros esmaecidos; ordenada por nome; paginação 5, 10, 20, 50, 100.

**Classificação: parcial.** Base: `dialog` + `tabs` + `data-table`; `relatorios/resultado` para a tabela larga. Falta: **cabeçalho de tabela agrupado em dois níveis** (tabela cruzada).

### 1.6 Captação - Pós-Graduação (`/captacao-pos-graduacao/…`)

Mesma tela e mesmo diálogo da graduação (componentes copiados em `pages/processo-seletivo`), com três diferenças lidas: (a) as modalidades são **Stricto sensu, Lato sensu e Extensão** (menu de exportar: STRICTO SENSU, LATO SENSU, EXTENSÃO); (b) há um **intervalo de datas** ("Data início" / "Data fim", `mat-datepicker`) que abre nos últimos 60 dias; (c) as consultas levam `tipo=POS|EXT`, `posTipo`, `dataInicio`, `dataFim`.

**Classificação: parcial**, mesma base de 1.4; acrescenta `date-field` em par (intervalo).

### 1.7 Rematrícula (`/rematricula/:periodoletivo/:modalidade`)

**Propósito.** Acompanhar a rematrícula por situação do aluno, no geral e por unidade.

**Arquétipo.** Painel: cartão-rosca geral + faixa de KPIs por situação + grade de cartões por unidade, com alternância pizza/barra.

**Anatomia.**
- **Recortes:** **Período Letivo** (`ucam-material-select`, `ano/semestre`), **modalidade** (abas-link; ambos na URL), busca "Pesquisa de polo/unidade".
- **Cartão geral** (`card-chart-rematricula`, horizontal): gráfico de **rosca** (furo 80%) com, no centro, **"X% Já matriculados"**; "Dados do Gráfico" — lista das situações com total e percentual; "TOTAL DE ALUNOS", "Total bolsas 100%", "Boleto de matrículas pagos"; botão "Exportar".
- **Indicadores: um cartão por situação** (`card-kpi`): descrição, **`total / total geral`** (parte × todo) e **"N essa semana"** (exceto na situação pendente) — incremento da semana. Situações: pendente, matriculado, formado, trancado, transferido.
- **Seção "<MODALIDADE> — Dados Gerais"** com dois botões: **"Gráfico de pizza"** (grade de cartões-rosca, um por unidade, cada um com exportar) e **"Gráfico em barra"** (lista "Unidade / Polo" com barra horizontal empilhada; legenda do cabeçalho: "Não matriculado", "Formando").
- **Drill-down:** não há tabela de detalhe; o detalhe é o arquivo exportado por unidade.

**Classificação: parcial.** Base: `painel-indicadores`; peças `chart`, `stat`, `card`, `segmented`. Falta: cartão-gráfico de rosca com valor central e lista de situações; `stat` "parte/total + incremento da semana".

### 1.8 Metas (`/metas`)

**Propósito.** Comparar o realizado da captação com a meta e com um período anterior, por curso ou por unidade.

**Arquétipo.** Painel **meta × realizado**: tabela de metas com totais, indicador radial e gráfico semanal.

**Anatomia.**
- **Recortes** (botão "Filtro", menu em cascata): **Modalidade**, **Periodo Letivo** (com captação quando não é presencial), **Forma de Ingresso** ("TODAS AS FORMAS DE INGRESSO"), **Unidade** ("TODAS AS UNIDADES"). Alternador **Curso / Unidade** (agrupamento).
- **Indicadores:**
  1. botão-indicador **"Média geral: realizado / meta"**;
  2. **progresso radial** "Média geral — X% alcançado" (cor pela faixa);
  3. no rodapé, **"N/M Metas batidas"** e a variação **"X% maior/menor"** do realizado contra o período anterior.
- **Tabela "Metas Captação (N cursos|unidades)"**, contexto `período / unidade`; paginação 50, 100, 200:
  Nome (+ `unidade - modalidade - forma de ingresso`), **Base**, **Realizado em <período anterior ▾>** (o período de comparação é escolhido no próprio cabeçalho da coluna), **Realizado** (seta para cima/baixo contra o período anterior, "Convertidos"), **Meta** ("(100%)"), **GAP** ("faltantes" / "a mais"), **Percentual Alcançado** (percentual colorido + barra de progresso).
  **Rodapé de totais:** "Total de Cursos: N", base, realizado anterior, realizado (+ seta e "% maior/menor"), meta, gap, metas batidas.
- **Drill-down:** com "TODAS AS UNIDADES", a linha expande para o detalhe cruzado (as unidades de um curso, ou os cursos de uma unidade), mesmas colunas.
- **Gráfico "Gráfico de metas":** seletor de **referência**; gráfico de **colunas**, eixo X "Semana", eixo Y "Quantidade", uma série por situação (pendente, confirmado, aprovado, matriculado, reprovado).
- **Exportar:** o botão existe e não tem ação ligada no template (`meta.component.html:26-38`).

**Classificação: parcial.** Base: `painel-indicadores` + `consulta-relatorio` (tabela com totais); peças `progress`, `stat`, `data-table`, `chart`, `segmented`. Falta: **padrão meta × realizado** (colunas base / anterior / realizado / meta / gap / % com barra), `progress` radial, célula com seta de tendência, coluna cujo cabeçalho escolhe o período de comparação, linha de totais.

### 1.9 Análise de Metas (`/analise-metas`)

**Propósito.** Ver a concentração de inscritos e matriculados por curso ou unidade e a taxa de conversão.

**Arquétipo.** Painel de quatro gráficos empilhados, cada um num cartão com título, contexto dos filtros e contagem.

**Anatomia.**
- **Recortes** (botão "Filtro"): **Modalidade**, **Periodo Letivo**; alternador **Curso / Unidade**. Contexto no cartão: "MODALIDADE / período / Visualização por curso|unidade."
- **Gráfico 1 — "Gráfico de Inscritos"** e **Gráfico 2 — "Gráfico de Matriculados":** **colunas + linha (spline) de percentual acumulado** (Pareto), dois eixos Y; coluna = quantitativo por curso/unidade, linha = acumulado em %. Cor da coluna pela faixa do acumulado, com legenda "Até 80%" (verde), "Entre 80% e 90%" (laranja), "Maior que 90%" (vermelho).
- **Gráfico 3 — "Inscritos x Matriculados":** **colunas agrupadas**, séries "Inscritos" e "Matriculados"; "Ordenado pelo quantitativo de Matriculados."
- **Gráfico 4 — "Taxa de Conversão":** **colunas**, série "Taxa de Conversão" em %.
- **Indicadores em cartão:** nenhum; só a contagem "N cursos|unidades" de cada gráfico.
- **Drill-down:** não há. **Vazio:** "Não há dados disponíveis para os filtros selecionados no momento."
- **Exportar:** baixa os quatro gráficos como imagem PNG, em sequência.

**Classificação: parcial.** Base: `painel-indicadores` (`protocolo/analytics`); peça `chart`. Falta: gráfico **combinado coluna + linha com dois eixos** e cor por faixa (não confirmado no contrato de `chart`); exportar gráfico como imagem.

### 1.10 Bolsa social (`/bolsa-social`)

**Propósito.** Mostrar a distribuição de alunos com bolsa por modalidade e por percentual.

**Arquétipo.** Painel de gráficos de pizza.

**Anatomia.** Recorte: **semestre** (mesmo seletor do Dashboard). **7 gráficos de pizza**, série "Alunos": "Distribuição de bolsas" (modalidade + percentual), "… EAD", "… PRESENCIAL", "… HÍBRIDO" (fatias por percentual), "… 40%", "… 50%", "… 100%" (fatias por modalidade). Sem indicadores, sem tabela. **Exportar:** menu com "Candidatos a bolsa" (`.xls` do servidor), com diálogo de espera.

**Classificação: parcial.** Base: `painel-indicadores`; peça `chart`. Falta: nada além de pizza no `chart` (não confirmado); o UCAMDS tem regra de paleta de séries (28/09) a aplicar.

### 1.11 Login por token (`/login/:routeredirect/:token/:user/:unidade`)

Tela de espera "Aguarde...". Grava `routeredirect` em `localStorage['permissao']` e despacha o login por token. **Parcial**: base `portal/login`; falta a variação de espera por token.

### 1.12 Sem uso / sem rota

- `breadcrumb-captacao.component.ts.old` e `breadcrumb-processo-seletivo.component.ts.old`: **nao-migrar**.
- `chart-line-bar-column` e `chart-donut` são usados; `card-chart-captacao-pos` abre o diálogo da pós.
- O rótulo "VER MAIS" dos cartões está comentado ou oculto (`display: none`).

## 2. Moldura e navegação

- **Moldura:** `<default-style>` com `hashMenu`, `startOpen=false`, `environment`, `unidade`, `unidades`, `usuario`, `icon2register`, `welcomeModal` e as saídas `logout` e `changeUnidade` (`app.component.html:1-12`).
- **Menu** (fixo no código, `app.component.ts:26-67`), nesta ordem: Dashboard, Financeiro, Captação - Graduação, Captação - Pós-Graduação, Rematrícula, Metas, Análise de Metas, Bolsa social. O menu por perfil (`CoreService.getMenuAplicacao`) existe e não é chamado.
- **Modal de boas-vindas:** abre o menu ao iniciar; quatro vídeos (Captação, Metas, Análise de Metas, Rematrículas).
- **Conta:** nome do usuário; sair limpa o estado e vai para `LOGIN_URL`.
- **Troca de unidade:** a moldura recebe as unidades do usuário (Gerencial, `unidadeUsuario/search/usuario`) e a saída `changeUnidade` despacha `ChangeUnidade` e volta à raiz (`app.component.ts:156-160`). As consultas dos painéis não usam a unidade selecionada como parâmetro; a unidade entra pelo cabeçalho `Unidade-Ref` do interceptador, que lê `AuthState.unidade` (a unidade da URL de login, não a trocada). Não foi encontrado registro de `HTTP_INTERCEPTORS` no código — efeito real da troca: não confirmado.
- **Login por token na URL:** token, usuário e unidade vêm na rota; o estado vai para `localStorage['AuthState']`.
- **Estado na URL:** captação, pós e rematrícula guardam período letivo e modalidade na rota, o que permite link direto para um recorte.

## 3. Peças usadas, com contagem

| Peça | Ocorrências | Observação |
|---|---|---|
| `generic-loading` | 31 | reticências animadas, um por bloco |
| `button[ucam-material]` | 25 | `rounded`, `color`, `text`, `[hover]`, `[disabled]` |
| `mat-icon` | 20 | |
| `mat-sort-header` / `matSort` | 16 / 2 | dashboard e financeiro |
| `ngx-skeleton-loader` | 14 | esqueleto de cartões e tabelas |
| `formControlName` | 14 | |
| `ucam-material-select` | 12 | `formControlName`, `placeholder`, `options`, `reset=false`; saída `change` |
| `card-financeiro` | 11 | `titulo`, `valor`, `isValueCurrency`, `labelPercentageValue`, `labelText`, `corBorda`, `destacarComFundo` |
| `mat-form-field` | 9 | |
| `table[mat-table]` | 8 | 3 com `multiTemplateDataRows` |
| `mat-menu` / `matMenuTriggerFor` | 7 / 7 | exportar e filtros |
| `chart-pie` | 7 | `dados`, `size`, `classCss`, `chartType` (`pie` / `column` / `bar`) |
| `mat-paginator` | 5 | |
| `mat-button-toggle` | 5 | modalidade no dashboard |
| `app-box` | 5 | `title`, `indicator`, `no-padding`, `fit-parent`; encaixes `box-filter`, `.action`, `body` |
| `soma-alunos-card` | 4 | `modalidade`, `quantidade`, `quantidadeUmAnoAtras`, `quantidadeAlunosEvadidos`, `faturamento`, `inadimplencia`, `icone`, `semestre` |
| `mat-tab` / `mat-tab-group` | 4 / 2 | diálogos |
| `mat-select` | 4 | |
| `highcharts-chart` | 3 | mais gráficos criados por API direta |
| `card-chart-rematricula` | 2 | `dados`, `orientacao`, `tipo`, `modalidade`, `periodo`, `unidade` |
| `mat-datepicker` | 2 | intervalo da pós |
| `progress-bar` | 2 | `backgroundColorProgressBar`, `percentWidthProgressBar` |
| `app-spline-columned-goals` | 2 | `categories`, `columnValues`, `splineValues`, `columnTitle` |
| `app-column-comparison-chart` | 2 | `categories`, `columnValues`, `columnTitle` |
| `radial-progress-bar` | 1 | `valor`, `cor` |
| `card-kpi`, `card-chart-captacao`, `card-chart-captacao-pos`, `chart-donut`, `chart-line-bar-column`, `chart-meta`, `chart-bolsa`, `switch-comparativo`, `app-tab-toogle-selector`, `filter-meta`, `app-filter-btn`, `header-filter`, `header-filter-financeiro` | 1–2 cada | |
| `default-style` | 1 | moldura |

## 4. Regras de negócio lidas no código

**Captação (graduação e pós)**

1. **Situações do candidato: pendente, confirmado, aprovado, matriculado.** `shared/enum/colorsituacaocaptacao.enum.ts:1-6`. Tipo: enumeração. Cores: pendente `#FF9933`, confirmado `#6634C7`, aprovado `#069F69`, matriculado `#1951D1`.
2. **Ordem de exibição das situações: matriculado, aprovado, confirmado, pendente.** `shared/components/card/card-chart-captacao/card-chart-captacao.component.ts:54`; `shared/components/chart/pie/pie.component.ts:102`. Tipo: formato.
3. **Participação de cada situação = total da situação ÷ total geral, sem casas decimais.** `card-chart-captacao.component.html:32`. Tipo: cálculo.
4. **Sem período na URL, a tela abre no período letivo e na modalidade "atuais" informados pela API.** `pages/captacao/views/breadcrumb/breadcrumb-captacao.component.ts:150-161`. Tipo: integração.
5. **Rótulo do período de captação: `ano/semestre - captação`.** `breadcrumb-captacao.component.ts:174`. Tipo: formato.
6. **Ao trocar o período letivo, a modalidade volta para a primeira da lista.** `breadcrumb-captacao.component.ts:220`. Tipo: transição.
7. **Todas as unidades vêm selecionadas; digitar na busca oculta os cartões de modalidade.** `breadcrumb-captacao.component.ts:113, 263`. Tipo: formato.
8. **Clique em cartão de modalidade abre o diálogo com as abas Cursos e Unidades; clique em unidade abre só Cursos.** `card-chart-captacao.component.ts:45`; `pages/captacao/views/captacao.component.ts:100-108`. Tipo: formato.
9. **A tabela abre os totais por turno M, T, N quando a API devolve mais de um turno; senão mostra uma coluna só (I).** `pages/captacao/views/modal-captacao/table-captacao/table-captacao.component.ts:87-90, 113-115`. Tipo: formato.
10. **Sem unidade informada, tabela e exportação consultam `unidade=TODAS`.** `pages/captacao/captacao.service.ts:114-121, 140-147`. Tipo: integração.
11. **Modalidades de exportação da graduação: EAD, PRESENCIAL, SEMIPRESENCIAL (HÍBRIDO comentado).** `pages/captacao/views/captacao.component.html:11-17`. Tipo: enumeração.
12. **Modalidades da pós: Stricto sensu, Lato sensu, Extensão; a URL `ead` é tratada como `stricto`.** `pages/processo-seletivo/views/processo-seletivo.component.html:11-15`; `pages/processo-seletivo/processo-seletivo.service.ts:79, 112`. Tipo: enumeração. Valores: `STRICTO`, `LATO`, `EXT`; caminho `pos` ou `ext`.
13. **A lista de candidatos exportada tem 24 colunas fixas, ordenada por unidade.** `captacao.component.ts:139, 160-230`. Tipo: formato. Colunas: UNIDADE, CURSO, SITUAÇÃO, TURNO, CPF, NOME, EMAIL, CELULAR, FORMA DE INGRESSO, DATA DE INSCRIÇÃO, DATA DE PAGAMENTO, DATA DE MATRÍCULA, SOCIOECONOMICO 1, SOCIOECONOMICO 2, DOCUMENTOS, BOLSA SOCIAL, PERCENTUAL, ISENÇÃO, DOCUMENTOS DE ISENÇÃO, DATA MOVIVENTAÇÃO ISENÇÃO (grafia do código), CÓDIGO DA MATRIZ, SITUAÇÃO DA ISENÇÃO, DATA DA ASSINATURA DO CONTRATO. Arquivo: "LISTA DE CANDIDATOS - <modalidade|unidade>".
14. **Na pós, o intervalo de datas abre nos últimos 60 dias.** `pages/processo-seletivo/views/breadcrumb/breadcrumb-processo-seletivo.component.ts:91, 163-166`. Tipo: prazo. (O comentário do código diz "5 dias"; o valor é 60.)

**Rematrícula**

15. **Situações da rematrícula: pendente, matriculado, formado, trancado, transferido.** `shared/enum/colorsituacaorematricula.enum.ts:1-7`. Tipo: enumeração. Cores: `#FF462E`, `#069F69`, `#FF9933`, `#173553`, `#BF74FF`.
16. **O número central do cartão é o percentual da situação "matriculado" ("Já matriculados").** `shared/components/card/card-chart-rematricula/card-chart-rematricula.component.html:19-20`; `shared/model/chart-donut.model.ts:55-63`. Tipo: cálculo. O percentual vem pronto da API (`porcentagem`).
17. **O cartão de situação mostra `total / total geral` e "N essa semana", menos na situação pendente.** `shared/components/card/card-kpi/card-kpi.component.html:3-4`. Tipo: formato.
18. **O cartão geral informa total de alunos, bolsas de 100% e boletos de matrícula pagos.** `card-chart-rematricula.component.html:33-35`. Tipo: formato. Campos: `totalGeral`, `totalBolsa`, `totalMensalidadesRematriculaQuitadas`.
19. **Sem período na URL, abre no primeiro período da lista e na primeira modalidade.** `pages/rematricula/views/breadcrumb/breadcrumb-rematricula.component.ts:67-94`. Tipo: formato.
20. **A busca de unidade espera 1 s e casa a sigla.** `pages/rematricula/views/rematricula.component.ts:123-132`. Tipo: limite.

**Metas**

21. **Cor do percentual alcançado por faixa: até 25% `#F73461`; de 25 a 50% `#FF7233`; de 50 a 75% `#F8A60A`; acima de 75% `#069F69`.** `pages/meta/views/table-meta/table-meta.component.ts:141-150`. Tipo: limite.
22. **Meta batida = percentual alcançado ≥ 100%.** `table-meta.component.ts:174`. Tipo: cálculo.
23. **Média geral = média simples dos percentuais alcançados das linhas (não é total realizado ÷ total da meta).** `table-meta.component.ts:169, 180`. Tipo: cálculo. Já o botão do topo mostra `total realizado / total da meta` (`pages/meta/views/meta.component.html:43`).
24. **Totais do rodapé: soma de base, realizado, meta e gap; contagem de linhas e de metas batidas.** `table-meta.component.ts:161-189`. Tipo: cálculo.
25. **GAP negativo é "faltantes", positivo é "a mais", zero não tem rótulo.** `table-meta.component.ts:131-138`. Tipo: formato. O valor do gap vem da API.
26. **Seta para cima quando o realizado é maior que o do período anterior; para baixo nos demais casos da linha.** `table-meta.component.ts:277-283`; `table-meta.component.html:81-82`. Tipo: cálculo.
27. **Variação do realizado contra o período anterior = diferença × 100 ÷ realizado anterior, com o texto "maior" ou "menor".** `table-meta.component.ts:285-297`. Tipo: cálculo.
28. **O período de comparação é escolhido pelo usuário entre os períodos anteriores devolvidos pela API; abre no primeiro.** `table-meta.component.ts:198-208`. Tipo: formato.
29. **O rótulo do período leva a captação quando a modalidade não é presencial.** `pages/meta/views/filter-meta/filter-meta.component.ts:89-90`; `table-meta.component.ts:201-202`. Tipo: formato.
30. **A linha só expande com "TODAS AS UNIDADES"; agrupada por curso abre as unidades, agrupada por unidade abre os cursos.** `table-meta.component.ts:86-97, 327-339`. Tipo: formato. Agrupamentos: `por_curso`, `por_unidade` (`switch-comparativo.component.ts:12-15`).
31. **Situações do gráfico de metas: pendente, confirmado, aprovado, matriculado, reprovado.** `shared/enum/colormetas.enum.ts:1-7`. Tipo: enumeração. Cores: `#212121`, `#FFAA22`, `#183A86`, `#069F69`, `#1951D1`.

**Análise de metas**

32. **Faixas de concentração pelo percentual acumulado: até 80% verde `#069F69` (com selo de visto no rótulo), entre 80% e 90% laranja `#FFAA22`, 90% ou mais vermelho `#CC4949`.** `pages/analise-meta/views/analise-meta.component.ts:255-262, 367-374`; legenda em `analise-meta.component.html:53-61`. Tipo: limite.
33. **Percentual acumulado = soma corrente de (quantitativo da categoria ÷ total), limitada a 100%.** `analise-meta.component.ts:233-240`. Tipo: cálculo.
34. **Taxa de conversão exibida = taxa da API × 100, 2 casas.** `analise-meta.component.ts:173`. Tipo: cálculo. A fórmula da taxa está no servidor.
35. **Situações consultadas: `INSCRITO` e `MATRICULADO`; agrupamentos `POR_CURSO` e `POR_UNIDADE`.** `analise-meta.component.ts:199, 311`; `components/filter-btn/filter-btn.component.ts:100-108`. Tipo: enumeração.

**Dashboard**

36. **Variação do cartão = (quantidade − quantidade do mesmo semestre do ano anterior) ÷ quantidade anterior.** `pages/dashboard-novo/views/soma-alunos-card/soma-alunos-card.component.ts:45-53`; `pages/dashboard-novo/utils.ts:28-40`. Tipo: cálculo. Ambos zero → 0; anterior zero → infinito.
37. **Total = EAD + Presencial + Híbrido; o total do ano anterior soma EAD e Presencial do ano anterior com o Híbrido do período atual.** `pages/dashboard-novo/views/soma-alunos-list/soma-alunos-list.component.ts:112-113`. Tipo: cálculo.
38. **Semestre corrente = 1 até junho, 2 a partir de julho; a lista vai de 2018 ao ano corrente.** `utils.ts:5-12`; `views/header-filter/header-filter.component.ts:19-28`. Tipo: prazo.
39. **A coluna "Bolsas" só aparece no semestre corrente.** `views/tabela-dashboard/tabela-dashboard.component.ts:85-95`. Tipo: formato.
40. **As linhas da tabela agrupam cursos por unidade + modalidade + tipo de curso, somando alunos, evadidos, bolsistas, recebido e a receber.** `tabela-dashboard.component.ts:136-153`. Tipo: cálculo.
41. **Modalidades do painel: PRESENCIAL, EAD, HIBRIDO (cartões); o filtro da tabela acrescenta Pós-graduação.** `soma-alunos-list.component.ts:73-87`; `tabela-dashboard.component.html:24-28`. Tipo: enumeração.

**Financeiro**

42. **Regimes: caixa e competência; a tela abre em caixa, no mês e ano correntes; anos desde 2018.** `pages/financeiro/header-filter-financeiro/header-filter-financeiro.component.ts:48-62`. Tipo: enumeração.
43. **Variação contra o mês anterior = (atual − anterior) ÷ anterior; janeiro compara com dezembro do ano anterior; sem valor anterior, não mostra variação.** `pages/financeiro/cards-financeiro-list/cards-financeiro-list.component.ts:71-76, 111-137`. Tipo: cálculo. Aplica-se a total de alunos, valor faturado, mensalidades geradas e mensalidades pagas.
44. **"Do faturado" = recebido ÷ faturado; "A receber" = faturado − recebido; "restantes" = 1 − recebido ÷ faturado.** `cards-financeiro-list.component.html:64-69, 85-92`; `.ts:91`. Tipo: cálculo.
45. **Bolsa 100% "do total" = alunos com bolsa de 100% ÷ total de alunos.** `cards-financeiro-list.component.html:93-94`. Tipo: cálculo.
46. **Ticket médio = valor recebido ÷ alunos pagantes; zero quando não há pagantes.** `pages/financeiro/tabela-financeiro/tabela-financeiro.component.html:46, 94`. Tipo: cálculo. A coluna "Valor recebido" da tabela soma `vlrecebido` (`tabela-financeiro.component.ts:114-118`).
47. **Os totais gerais somam as modalidades devolvidas pela API.** `cards-financeiro-list.component.ts:88-90`. Tipo: cálculo.
48. **Modalidades do financeiro: PRESENCIAL, EAD, SEMIPRESENCIAL, PÓS-GRADUAÇÃO (enviada como `POS_GRADUACAO`).** `pages/financeiro/views/financeiro.component.html:7-10`; `pages/financeiro/financeiro.service.ts:41-42`. Tipo: enumeração.
49. **Oito relatórios exportáveis por mês/ano.** `header-filter-financeiro.component.ts:87-119`. Tipo: formato. Arquivos: "Faturamento M/AAAA.xls", "Contas Recebidas…", "Inadimplentes…", "Cobranças em Aberto…", "Todos os alunos….zip", "Ticket médio por curso…", "Ticket médio por unidade e curso…" (mesmo endpoint do anterior), "Modalidade x Regime…".

**Bolsa social, acesso e formato**

50. **Percentuais de bolsa tratados: 40%, 50% e 100%; modalidades EAD, PRESENCIAL, HÍBRIDO.** `pages/bolsa-social/views/chart-bolsa/chart-bolsa.component.ts:26-122`. Tipo: enumeração.
51. **Exportação de candidatos a bolsa por semestre.** `pages/bolsa-social/views/bolsa-social.component.ts:50-52`. Tipo: formato. Arquivo: "Candidatos a bolsa AAAA_S.xls".
52. **Nenhuma rota exige sessão; todo usuário vê os oito itens do menu.** `app-routing.module.ts`; `app.component.ts:26-67`. Tipo: permissão. O parâmetro `routeredirect` é gravado em `localStorage['permissao']` e não é lido em lugar nenhum (`shared/components/login/login.component.ts:32-34`).
53. **Exportação local em Excel ou PDF com linha TOTAL para colunas inteiras e de moeda** (`shared/services/export.service.ts`, mesmo serviço do Gestão de Polos; aqui o PDF abre em nova aba). Tipo: formato.

## 5. API consumida

Bases (`environment.ts`, desenvolvimento em `localhost:8030`): `API_BACKEND_CAPTACAO` (`/captacao`), `API_BACKEND_REMATRICULA`, `API_BACKEND_METAS`, `API_BACKEND_EVOLUCAO_CAPTACAO`, `API_BACKEND_DASHBOARD`, `API_BACKEND_FINANCEIRO`, `API_BACKEND_BOLSASOCIAL`, `API_GERENCIAL`. Todos GET.

| Serviço | Caminho | Observação |
|---|---|---|
| `CaptacaoService` | `/periodoletivoatualmodalidadeatual` | → `periodoletivoatual`, `modalidadeatual` |
| | `/periodosletivos` | |
| | `/modalidades/{oidPeriodoLetivoCaptacao}` | |
| | `/unidades/{modalidade}/{oidPeriodoLetivo}` | |
| | `/grafico/{modalidade}/{periodo}` (`?unidade=`) | geral e por unidade |
| | `/tabela/cursos/{modalidade}/{oidPeriodoLetivo}?unidade=` | `TODAS` na falta |
| | `/tabela/unidades/{modalidade}/{oidPeriodoLetivo}` | |
| | `/exportacao/candidatos/{modalidade}/{oidPeriodoLetivo}?unidade=` | |
| `ProcessoSeletivoService` | mesmos caminhos de captação | + `tipo=POS|EXT`, `posTipo`, `dataInicio`, `dataFim`; `/grafico/{pos|ext}/qualquer` |
| `RematriculaService` | `/periodosletivos`, `/modalidades/{oid}`, `/unidades/{modalidade}/{oid}` | |
| | `/grafico/{modalidade}/{oid}` (`?unidade=`) | |
| | `/grafico/{modalidade}/{oid}/inline?unidade=&export=true` | blob |
| `MetaService` | `/modalidades`, `/periodosletivos/{modalidade}` | |
| | `/periodosletivosAnteriores/modalidade/{m}/periodoletivo/{p}` | |
| | `/formasdeingresso/{m}/{p}`, `/unidades/{m}/{p}/?formadeingresso=` | |
| | `/matriculados/modalidade/{m}/periodoletivo/{p}/?unidade=&formadeingresso=&ag…` | agrupamento (nome exato do parâmetro truncado na leitura — não confirmado) |
| | `/matriculadosdetalhado/modalidade/{m}/periodoletivo/{p}/?formadeingresso=&unidade=…` | |
| | `/matriculadossemestreanterior/modalidade/{m}/periodoletivo/{p}/?unidade=&nomecurso=&formadeingresso=` | |
| | `/referencias/modalidade/{m}/periodoletivo/{p}/?unidade=&formadeingresso=` | |
| | `/quantitativo/modalidade/{m}/periodoletivo/{p}/referencia/{r}/?unidade=&formadei…` | |
| `AnaliseMetaService` | `/grafico` | `modalidade`, `periodoletivo`, `agrupamento`, `situacao`; tempo máximo 10 s |
| | `/grafico-taxa-conversao` | `modalidade`, `periodoletivo`, `agrupamento` |
| `DashboardNovoService` | `/totais/{semestre}`, `/main/cursos/{semestre}` | |
| `FinanceiroService` | `/totais/{regime}/{ano}/{mes}` (`?modalidade=`) | |
| | `/cursos/{regime}/{ano}/{mes}` (`?modalidade=`) | |
| | `/reports/{contas-recebidas|faturamento|inadimplentes|cobrancas-em-aberto|listagem-alunos|ticket-medio|…}/{ano}/{mes}` | blob; o caminho de "Modalidade x Regime" não foi lido — não confirmado |
| `BolsaSocialService` | `/grafico/{semestre}`, `/reports/candidatos/{semestre}` | |
| `AuthEffects` / `LoginService` | gerencial `/usuario/{oid}`, `/usuario/{oid}/pessoa`, `/unidadeUsuario/search/usuario?oidusuario=&size=1000`, `/unidade/{oid}` | cabeçalho `Unidade-Ref` |

**Modelos principais.**
- `ChartPie` / `ChartDonut`: `titulo`, `situacoes[]`, `totalGeral` (+ `totalBolsa`, `totalMensalidadesRematriculaQuitadas` na rosca).
- `SituacaoCaptacao`: `descricao`, `tipo`, `total`. `SituacaoRematricula`: + `totalSemana`, `totalGeral`, `porcentagem`.
- `ItemPorSituacao`: `nome`, `situacoes[]{descricao, turnos[]{descricao, total}, total}`, `total`.
- `PeriodoLetivoCaptacao`: `oid`, `ano`, `semestre`, `captacao`, `periodoletivoatual?`, `modalidadeatual?`. `PeriodoLetivo`: `oid`, `ano`, `semestre`. `Modalidade`: `descricao`, `slug`, `unidade`. `Unidade`: `oid`, `sigla`, `razaosocial`.
- `MetaProcessoSeletivo`: `modalidade`, `cursoOuUnidade`, `formaDeIngresso`, `periodo`, `captacao`, `meta`, `totalRealizado`, `totalBase`, `gap`, `porcentagemAlcancada`. `AlcancadoSemestre`: `cursoOuUnidade`, `formaDeIngresso`, `totalRealizado`. `Referencia`: `oid`, `referencia`. `SituacaoSemanaQuantidade`: `situacao`, `semanaQuantidadeList[]{dataInicio, dataFim, semana, quantidade}`.
- Análise: `{label, total}` e `{label, taxaConversao, totalInscritos, totalMatriculados}`.
- `QuantidadeAlunosDTO`: `modalidade`, `quantidadealunos`, `quantidadeevadidos`, `quantidadebolsistas`, `faturamento`, `inadimplencia`. `UnidadeDashboard` / `CursoDashboard`: `nomeunidade`, `modalidadecurso`, `tipocurso`, `nomecurso`, quantidades e valores.
- `FinanceiroCardsData`: `modalidade`, `qtdaluno`, `bolsa100`, `qtdpagomes`, `qtdfaturado`, `vlfaturado`, `qtdrecebido`, `vlrecebido`. `CursoFinanceiro`: + `nomeunidade`, `nomecurso`, `qtdpagomesanterior`, `qtdinadimplencia`, `vlinadimplencia`, `comparativo_mensalidades_quitadas`, `fat_geral_previsibilidade`.
- Bolsa: `modalidade`, `porcentagemBolsa`, `quantidadeAlunos`.

## 6. O que o código não responde

1. O que define cada situação do candidato (pendente, confirmado, aprovado, matriculado) e o que faz um candidato passar de uma a outra. — Captação / comercial.
2. Como a meta de cada curso e unidade é fixada, por quem e onde é lançada; o front só lê. — Diretoria / planejamento.
3. O que é a "Base" da planilha de metas e como o GAP é calculado no servidor. — Planejamento / captação.
4. "Média geral" deve ser a média dos percentuais das linhas (como a tabela calcula) ou total realizado ÷ total da meta (como o botão mostra)? Os dois números aparecem na mesma tela. — Planejamento.
5. As faixas de cor do alcançado (25 / 50 / 75%) e as de concentração (80 / 90%) são regra de gestão ou escolha de tela? — Planejamento.
6. No Dashboard, "Valor recebido" e "A receber" usam os campos `faturamento` e `inadimplencia`: qual é a definição de cada um (regime, período, descontos)? — Financeiro.
7. No Financeiro, a coluna "Valor recebido" e o ticket médio usam o recebido; o cartão "Valor faturado" usa o faturado: ticket médio é sobre recebido ou sobre faturado? — Financeiro.
8. O total do ano anterior no Dashboard soma o híbrido do período atual: é intencional? — Dono do produto / TI.
9. O que conta como "evadido" e em que momento do semestre. — Secretaria acadêmica.
10. As rotas estão sem guarda e o menu é igual para todos: quem pode ver financeiro, inadimplentes e a lista de candidatos com CPF, contato e dados socioeconômicos? — Gestão do sistema / encarregado de dados (LGPD).
11. A troca de unidade da moldura deve filtrar os painéis? Hoje os painéis consultam por modalidade e período, com todas as unidades. — Dono do produto.
12. O botão "Exportar" de Metas não tem ação: qual relatório ele deveria gerar? — Dono do produto.
13. Híbrido × Semipresencial: o Dashboard e a Bolsa falam em "Híbrido", o Financeiro e a exportação de captação em "Semipresencial". São a mesma modalidade? — Secretaria acadêmica.
14. Por que só os percentuais de bolsa 40%, 50% e 100% têm gráfico. — Assistência estudantil / bolsa social.

## 7. Formas que se repetem entre os três sistemas (captação, gestão de polos, turmas compartilhadas)

Seção comum aos três levantamentos deste grupo.

1. **Cartão de seção** — caixa com título, linha de contexto dos filtros (período / unidade / modalidade), ação no canto (exportar ou botão) e corpo. É o `app-box` de captação e de turmas e o cabeçalho de seção ("sobretítulo, título, contagem") de polos. Aparece em todos os painéis.
2. **Faixa de indicadores no topo** — cartões de número com rótulo. Três graus: só contagem (turmas: 3); parte × todo, `n / total` ou "% do faturado" (rematrícula, financeiro, ficha de polos); **variação contra período anterior** com seta (dashboard: mesmo semestre do ano anterior; financeiro: mês anterior). Meta × realizado só existe em Metas (captação).
3. **Tabela-resumo com linha expansível para subtabela** — unidade → cursos (dashboard, financeiro), curso → alunos (inadimplência de polos), aluno → disciplinas e notas (acadêmico de polos), turma AVA → turmas SIGU (turmas), curso ↔ unidade (metas). Seis ocorrências nos três sistemas.
4. **Drill-down em diálogo largo com tabela paginada** — gráfico ou linha abre um diálogo de 80–90% da tela com cabeçalho de contexto, exportar e tabela (captação por unidade, candidatos matriculados e alunos do curso em polos, detalhe da disciplina em turmas).
5. **Linha de totais na tabela** — rodapé "Total" em polos (captação, financeiro, acadêmico) e em metas; em polos/ficha os totais sobem para o cabeçalho.
6. **Recortes por botão-menu no cabeçalho** — período letivo sempre; depois modalidade, unidade, curso, forma de ingresso, mês, regime. O rótulo do botão carrega o valor ("Unidade: Todas", "Período Letivo: 2024.1"). Seleção de **várias unidades** aparece em captação e em polos.
7. **Alternador de agrupamento ou de modalidade** — "Curso / Unidade" (metas, análise de metas), abas ou botões de modalidade (captação, rematrícula, financeiro, dashboard), "pizza / barra" (rematrícula).
8. **Exportar** — três formas: arquivo pronto do servidor (turmas, financeiro, bolsa, rematrícula), planilha/PDF montados no navegador com linha TOTAL (captação e polos compartilham o mesmo `ExportService`) e diálogo "conjunto + formato" (polos). Mais a exportação do gráfico como imagem (polos, análise de metas).
9. **Gráficos** — rosca com valor central (rematrícula; formas de ingresso em polos), rosca pequena dentro da célula como percentual da linha (polos), barra horizontal empilhada por situação em linha de lista (captação, rematrícula), colunas por situação (captação, metas), coluna + linha de acumulado com dois eixos (análise de metas), linha semanal (polos), funil (polos), pizza (bolsa social).
10. **Situação por cor fixa** — cada sistema tem sua enumeração de situações com cor própria (captação, rematrícula, metas, funil de polos, migrado sim/não em turmas).
11. **Célula de pessoa** — foto + nome + identificador (matrícula ou CPF) em polos e turmas.
12. **Moldura `default-style`** com menu fixo no código, modal de boas-vindas com vídeos e **login por token na URL** com tela "Aguarde..." — idêntica nos três.
13. **Estados de carga e vazio** — spinner por seção (polos, turmas), esqueleto (dashboard e financeiro de captação), frase de vazio por tabela ou gráfico.

**O que o UCAMDS ainda não tem como peça ou padrão e apareceu aqui** (a confirmar nos contratos): linha expansível com subtabela; linha de totais; cabeçalho de tabela em dois níveis; `stat` com variação contra período anterior e com `n / total`; padrão meta × realizado (base, anterior, realizado, meta, gap, % com barra); cartão-gráfico clicável; barra empilhada em linha de lista; rosca em célula; gráficos de funil e de coluna + linha; diálogo de exportação (conjunto + formato); seleção de várias unidades; variação do login "entrando por token".
