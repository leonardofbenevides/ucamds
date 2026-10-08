# Inventário do front-end de Gestão de Polos (Angular 10)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\gestaodepolos-frontend`
Lido em 06/10/2026: todo `src/app` (templates, componentes, serviços, guard, store, rotas), `environments/`, `package.json` e README (padrão do Angular CLI, sem conteúdo de negócio). Caminhos abaixo são relativos a `src/app`.

Título da aplicação na moldura: "Sistema de gestão dos polos da Universidade" (`app.component.ts:27`).

Stack: Angular 10.0.14, Angular Material 10.2, ngrx 10, `ucam-material` 0.0.910-alpha.52, `default-style` 0.0.910-alpha.20, Highcharts 8.2 (API direta, sem `highcharts-angular`; módulos `funnel3d`, `cylinder`, `variable-pie`, `exporting`, `boost`, `no-data-to-display`), `exceljs` 4.1.1, `pdfmake` 0.1.68, `file-saver` 2.0.2.

## 1. Rotas e telas

### 1.1 Tabela de rotas (`app-routing.module.ts`)

| URL | Componente | Template | Guard |
|---|---|---|---|
| `''` | `HomeComponent` | `pages/home/home.component.html` | `AuthGuard` |
| `captacao` (filha de `''`) | `CaptacaoComponent` | `pages/captacao/captacao.component.html` | herdado |
| `financeiro` (filha) | `FinanceiroComponent` | `pages/financeiro/financeiro.component.html` | herdado |
| `academico` (filha) | `AcademicoComponent` | `pages/academico/academico.component.html` | herdado |
| `ficha-financeira` (filha) | `FichaComponent` | `pages/ficha/ficha.component.html` | herdado |
| `login/:token/:user` | `LoginComponent` | `pages/login/login.component.html` | nenhum |

As quatro "bolhas" são filhas da Home: a Home fica sempre no topo e o painel escolhido aparece abaixo, com rolagem automática até ele (`home.component.ts:76-83`). Todas as filhas voltam para `/` se não houver período selecionado na memória.

### 1.2 Home — escolha de período e de consulta (`/`)

**Propósito.** Escolher o período letivo e qual dos quatro painéis abrir.

**Arquétipo.** Lançador: seletor de período + quatro cartões de escolha + botão "Buscar".

**Peças.** Marca do sistema; rótulo "Escolha o período letivo"; `ucam-select-rounded` com ícone `date_range` (opções `ano/semestre`); grupo de rádio em cartões com ícone — **Captação**, **Financeiro**, **Acadêmico**, **Ficha financeira** (`tipoPesquisa`); botão "Buscar"; `router-outlet` logo abaixo; diálogo de erro global (`app-error`).

**Classificação: parcial.** Base: `shell-aplicacao` (grade de módulos, referência `portal/grade-modulos`) e o componente `choice-card`. Falta: a forma "lançador + painel na mesma página" (o painel abre abaixo, sem trocar de tela) e um seletor de período letivo como peça de página.

### 1.3 Captação (`/captacao`)

**Propósito.** Mostrar o funil da captação do período (inscritos, aprovados, matriculados), a divisão por forma de ingresso, os matriculados por curso e a evolução semanal de matrículas.

**Arquétipo.** Painel de indicadores em quatro seções empilhadas, cada uma com cabeçalho (sobretítulo "Consulta por captação", título, contagem), exportar próprio e gráfico + tabela.

**Anatomia do painel.**
- **Recortes:** unidades (várias, pelo filtro lateral da moldura), modalidade (fixa em EAD), período letivo (escolhido na Home) e **período de captação** ("Captação 1" / "Captação 2", `ucam-select-rounded` no topo da página). A seção 4 tem ainda **filtro por mês**.
- **Indicadores em cartão:** nenhum cartão de KPI isolado. O único indicador destacado é o selo **"N% taxa de conversão"** (matriculados ÷ inscritos). Não há meta nem comparação com período anterior.
- **Seção 1 — "Quantitativo de candidatos por situação".**
  - Gráfico **funil 3D** (Highcharts `funnel3d`, `app-piramide`), subtítulo "Funil de conversão": três fatias — Inscritos (`#079F69`), Aprovados (`#854EFF`), Matriculados (`#1951D1`); rótulo `nome (valor)`; sem legenda.
  - Tabela "Representação das situações", colunas SITUAÇÃO (marcador de cor + `situação: total`) e REPRESENTAÇÃO DO TOTAL (rosca pequena `app-donut` com o percentual sobre inscritos); só as linhas Aprovados e Matriculados.
  - Menu de três pontos no gráfico: "Exportar gráfico em PDF", "Salvar como imagem".
- **Seção 2 — "Forma de ingresso".**
  - Gráfico de **rosca de raio variável** (`variablepie`, furo de 80%, `app-pie`), subtítulo "Divisão de formas de ingresso" / "Quantitativo total", com o total de alunos no centro e legenda; uma fatia por forma de ingresso.
  - Tabela "Conversão por forma de ingresso": DESCRIÇÃO, TAXA % CONVERSÃO (rosca pequena, 1 casa), QUANTIDADE DE MATRICULADOS (`n/total alunos`). Ordenada por quantidade, decrescente.
- **Seção 3 — "Quantitativo de matriculados por curso"** ("N cursos").
  - Busca "Pesquise o curso" (filtra no navegador).
  - Tabela com ordenação em ALUNOS: CURSO, ALUNOS (`n alunos`), PERÍODO LETIVO, REPRESENTAÇÂO DO TOTAL (rosca pequena, 2 casas), botão "Ver os alunos", coluna de três pontos (sem ação). **Rodapé de totais**: "N cursos", total de alunos, período, rosca de 100%.
  - Paginação no navegador: 100, 200, 300.
  - **Drill-down:** "Ver os alunos" abre o diálogo de candidatos matriculados do curso (1.4).
- **Seção 4 — "Evolução de matrícula por semana".**
  - Gráfico de **linha** (`app-line`), subtítulo "Gráfico de evolução semanal": eixo X = data de início de cada semana; eixo Y = quantidade (sem título, sem grade); uma série "Matriculas" (`#1951D1`), rótulo de valor em cada ponto; dica `início - fim / Matriculados: n`.
  - Filtro por mês: "Todo o período" + um item por mês presente nos dados.
- **Exportar** em cada seção abre o diálogo de exportação (1.9) já com o conjunto da seção.

**Classificação: parcial.** Base: `painel-indicadores`, referências `protocolo/analytics` e `gerencial/inicio`; peças `chart`, `data-table`, `section-bar`, `stat`. Falta: gráfico de **funil** (não confirmado se o contrato de `chart` cobre), **rosca em célula de tabela** (percentual por linha), **linha de totais** no rodapé da tabela e o **menu de exportar gráfico** (PDF/imagem).

### 1.4 Diálogo "Candidatos matriculados do curso" (`CandidatosMatriculadosComponent`)

**Propósito.** Listar os matriculados de um curso na captação.

**Peças.** Cabeçalho ("Consulta por Captação", nome do curso, "N alunos"), "Exportar", fechar. Tabela paginada no servidor (4, 10, 25): ALUNO (foto, nome, CPF), TELEFONE / EMAIL, SITUAÇÃO (texto em minúsculas), DATA DA MATRÍCULA, 1º ACESSO À PLATAFORMA, UNIDADE.

**Classificação: parcial.** Base: `dialog`/`drawer` + `data-table` + `avatar`; a tela de resultado `relatorios/resultado` serve de base para a tabela.

### 1.5 Financeiro (`/financeiro`)

**Propósito.** Mostrar, por mês, a receita e o repasse ao polo por aluno e por curso, e a inadimplência por curso com abertura até o aluno.

**Arquétipo.** Relatório em três tabelas empilhadas com totais, cada uma com filtro de mês, busca e exportar. Sem gráficos.

**Anatomia.**
- **Recortes:** unidades (filtro lateral), modalidade EAD, período letivo, **mês** (um seletor por seção; as duas de repasse abrem no mês corrente; a de inadimplência tem a opção "Todos").
- **Indicadores:** não há cartões; os totais ficam na **linha de rodapé** de cada tabela e na contagem do cabeçalho ("N alunos", "N cursos").
- **Seção 1 — "Receita de repasse por aluno".** Busca "Pesquisa por nome". Colunas: ALUNO (foto, nome, matrícula), CURSO (+ `Nº período`), UNIDADE, VALOR PAGO, VALOR REPASSE, TIPO DE COBRANÇA, três pontos. Rodapé "Total de repasse por aluno:" com soma de pago e de repasse. Paginação no servidor 50, 100, 200.
- **Seção 2 — "Receita de repasse por curso".** Busca "Pesquisa por curso". Colunas: CURSO (+ `unidade - modalidade`), COBRANÇAS (`n cobranças`), VALOR PAGO, VALOR REPASSE, TIPO DE COBRANÇA, três pontos. Rodapé "Total de repasse por curso:". Paginação 50, 100, 150.
- **Seção 3 — "Total de inadimplência por curso".** Colunas: CURSO (+ modalidade), COBRANÇAS, VALOR LÍQUIDO EM ABERTO, TIPO DE COBRANÇA, botão "Ver os alunos ▾", três pontos. Rodapé "Total de inadimplência por curso:". Paginação 100, 150, 200.
  - **Drill-down 1 (linha expansível):** subtabela "ALUNOS EM INADIMPLÊNCIA" — aluno (foto, nome, matrícula), PERÍODO, UNIDADE, VALOR LÍQUIDO INADIMPLENTE (em vermelho), TIPO DE COBRANÇA, botão "Ver mais"; paginação própria de 4.
  - **Drill-down 2 (diálogo):** "Ver mais" abre os meses inadimplentes do aluno (1.6).
- **Exportar** oferece quatro conjuntos: os três das seções e "Total de inadimplência por aluno".

**Classificação: parcial.** Base: `consulta-relatorio` (`relatorios/filtros` e `relatorios/resultado`: tabela larga, totais, exportar) e `sigfin/movimento-caixa`. Falta: **várias tabelas de relatório na mesma página**, cada uma com seu filtro; **linha expansível com subtabela paginada**; célula de pessoa com foto (a ADR-046 cita célula de pessoa — não confirmado se cobre foto + matrícula).

### 1.6 Diálogo "Aluno em inadimplência" (`AlunoInadimplenciaComponent`)

**Propósito.** Mostrar as cobranças em aberto de um aluno, mês a mês.

**Peças.** Cabeçalho com foto, nome, `#matrícula`, `Nº período`, fechar. Tabela: VALOR LíQUIDO (vermelho), PERÍODO INADIMPLENTE (`ano.semestre Mês`), TIPO DE COBRANÇA.

**Classificação: parcial.** Base: `dialog` + `data-table` + `avatar`.

### 1.7 Acadêmico (`/academico`)

**Propósito.** Mostrar os alunos ativos por curso, com trancamentos e cancelamentos, e abrir a lista de alunos e suas notas.

**Arquétipo.** Tabela-resumo com totais e drill-down em dois níveis. Sem gráficos além da rosca na célula.

**Anatomia.**
- **Recortes:** unidades, modalidade EAD, período letivo. A busca rápida está comentada.
- **Indicador do cabeçalho:** "N alunos" (soma de matriculados).
- **Tabela "Quantitativo de alunos ativos por curso":** CURSO (nome + `n alunos`), REPRESENTAÇÃO DO TOTAL (rosca pequena, 2 casas), TRACAMENTO (grafia do código; `n alunos`), CANCELADOS E ABANDONOS (`n alunos`), AÇÂO ("Ver os alunos"), três pontos. **Rodapé "Total:"** com rosca de 100% e somas. Paginação no servidor 6, 10, 25, 50, 100.
- **Drill-down:** "Ver os alunos" abre o diálogo do curso (1.8).
- **Exportar:** "Quantitativo de alunos ativos por curso" (todas as linhas).

**Classificação: parcial.** Base: `consulta-relatorio` (`relatorios/resultado`) e `painel-indicadores`. Falta: rosca em célula e linha de totais.

### 1.8 Diálogo "Alunos do curso" (`CursoAcademicoComponent`)

**Propósito.** Listar os alunos de um curso por situação e abrir as disciplinas e notas de cada um.

**Peças.** Cabeçalho ("Consulta Acadêmico", curso, "N alunos"); **Filtro por situação** (`ucam-select-rounded`: Todos, Matriculado, Trancado, Transferido); "Exportar"; fechar. Tabela paginada (4, 10, 25): ALUNO (foto, nome, CPF), CURSO (+ `Nº período`), UNIDADE, SITUAÇÃO, "Ver detalhes ▾", três pontos.
**Linha expandida:** grade DISCIPLINA, P1, P2, P3, MÉDIA FINAL (+ situação na disciplina); travessão quando não há nota; rodapé "Contato: Tel: … email: …"; vazio "Nenhuma disciplina para exibir".

**Classificação: parcial.** Base: `triagem-lista-detalhe` (lista + item aberto) ou `dialog` + `data-table`; `select` para a situação. Falta: linha expansível com grade de notas (boletim resumido).

### 1.9 Diálogo "Exportar arquivo" (`ExportComponent`)

**Propósito.** Escolher qual conjunto exportar e em que formato.

**Peças.** Título "Exportar arquivo", linha de contexto com ícone de calendário (período, mês, curso), seletor do conjunto, dois cartões de rádio **PDF** e **EXCEL**, botões "Cancelar" e "Baixar"; spinner enquanto carrega os dados ou gera o arquivo.

**Classificação: parcial.** Base: `dialog` + `choice-card` + `select`; o exportar de `relatorios/resultado` é a referência. Falta: o diálogo de exportação como peça (conjunto + formato).

### 1.10 Ficha financeira (`/ficha-financeira`)

**Propósito.** Consultar, aluno a aluno, mensalidades geradas, pagas e vencidas e os acordos, e abrir a ficha completa de um aluno.

**Arquétipo.** Lista com linha de totais no topo que vira detalhe do item: ao escolher um aluno, a lista se reduz a ele e a ficha aparece abaixo, com "voltar".

**Anatomia.**
- **Recortes:** período letivo; três filtros em linha — **Modalidade**, **Unidade**, **Curso** (`mat-select`, rótulos "Modalidade: Todas", "Unidade: Todas", "Curso: Todos"); busca "Matrícula ou nome".
- **Legenda de ícones:** bandeira = "Mensalidade vencida"; moeda = "Acordos"; visto = "Pagamentos".
- **Linha de totais no cabeçalho da tabela ("TOTAL:")** — o que faz papel de indicadores (4): mensalidades `pagas/geradas` + "N vencidas"; valor das vencidas; "N acordos"; parcelas de acordo `pagas/geradas` + "N vencidas". Nenhuma comparação com meta ou período anterior.
- **Tabela:** NOME DO ALUNO (foto, nome, `#matrícula - modalidade`), CURSO (+ unidade), MENSALIDADES (`pagas/geradas`, "N vencidas"), VENCIDAS (valor, ou "Nenhum vencimento"), ACORDOS ("N acordos"), PARCELAS DE ACORDO (`pagas/geradas`, "N vencidas", ou "Nenhum acordo"), AÇÂO (ícone de olho; vira "voltar <" com aluno aberto).
- **Carga incremental:** botão "ver mais" (15 por vez), sem paginador.
- **Detalhe (`app-ficha-financeira`):** título "Ficha financeira do aluno específico"; resumo "N Mensalidades não quitadas — Ver pendências" e "N parcelas de acordos — Ver acordo"; tabela MÊS/ANO (bandeira se não pago), VENCIMENTO, TIPO DE COBRANÇA, QUITAÇÃO (SIM verde / NÃO vermelho), RECEBIDO, À RECEBER, DATA PAGAMENTO, OBS.
- **Exportar:** só com aluno aberto; conjunto "Ficha financeira".

**Classificação: parcial.** Base: `triagem-lista-detalhe` (referências `isencao/consulta` e `gerencial/usuario-detalhe`) e `sigfin/movimento-caixa` para a tabela de lançamentos. Falta: **linha de totais no cabeçalho** da tabela, célula de razão `n/total` com legenda de ícone, e "carregar mais" como alternativa à paginação (não confirmado se `pagination` cobre).

### 1.11 Diálogo "Mensalidades não quitadas" (`FichaFinanceiroVencidosComponent`)

"N pendências"; tabela listrada MES/ANO (bandeira vermelha), VENCIMENTO, À RECEBER; botões "Fechar" e "Ok, entendi!". **Parcial**: `dialog` + `data-table`.

### 1.12 Diálogo "Acordos do aluno" (`FichaFinanceiroAcordoComponent`)

"N acordo(s)"; filtro **Acordo** (`mat-select` com os números de acordo); contador `pagas/total`; tabela listrada MES/ANO, VENCIMENTO, QUITACAO, RECEBIDO, À RECEBER, DATA PAGAMENTO, OBS (origem do pagamento), TIPO (ícone de moeda); botão "Fechar". **Parcial**: `dialog` + `select` + `data-table`.

### 1.13 Diálogo "Unidades selecionadas" (`ViewUnidadesComponent`)

Busca "Pesquisa rápida", todas as unidades como etiquetas clicáveis (selecionada × não selecionada), botões "Fechar" e "Atualizar". **Parcial**: `dialog` + `chip` (seleção múltipla). Falta: padrão de seleção múltipla de unidades.

### 1.14 Diálogo de erro (`ErrorComponent`)

"Ocorreu um erro na requisição", botões "Fechar" e "Recarregar página". Único tratamento de erro do sistema. **Parcial**: `dialog`/`alert`.

### 1.15 Login por token (`/login/:token/:user`)

Tela de espera; despacha o login por token e recarrega a raiz. **Parcial**: base `portal/login`; falta a variação de espera por token.

## 2. Moldura e navegação

- **Moldura:** `<default-style>` com `hashMenu`, `startOpen=false`, `environment`, `usuario`, `icon2register`, `welcomeModal` e a saída `logout` (`app.component.html:1-8`). Dentro dela, `<page filterButton="false" filterOpened="false">` com `<sidemenu-left>`.
- **Menu:** um item só, "Gestão de polos" (`/`). Clicar na imagem do menu recarrega a página (`app.component.ts:187-189`). A navegação entre os quatro painéis é feita pela Home.
- **Painel lateral de filtros** (`sidemenu-left`, "Filtros" / "Use os filtros para analisar os dados"):
  - **Unidades:** interruptor "Selecionar todas"; contador "N unidade(s) selecionada(s)"; `ucam-material-select` múltiplo; as 10 primeiras unidades como etiquetas clicáveis e "•••" que abre o diálogo com todas.
  - **Modalidades:** só etiqueta "EAD" (seleção comentada).
  - Mudar o filtro refaz a busca do painel aberto depois de 2 s.
- **Troca de unidade:** não há troca de unidade única; o sistema trabalha com **conjunto de unidades** (polos EAD a que o usuário tem acesso).
- **Modal de boas-vindas:** quatro vídeos do YouTube, um por painel.
- **Conta:** nome do usuário pela moldura; sair limpa o `localStorage` e vai para `LOGIN_URL` (produção: `https://login.candidomendes.edu.br/login.jsf?client_id=gestaopolos@ucam`).
- **Login por token na URL:** o efeito busca usuário e pessoa no Gerencial e as unidades em `core/unidades`; grava em `localStorage['AuthState']`. O cabeçalho `Unidade-Ref` é enviado com o valor fixo `unid32` (`auth.effects.ts:29`).
- **Estado entre telas:** período, unidades e modalidades ficam em memória (`UtilService`); recarregar a página perde a seleção e volta para a Home.

## 3. Peças usadas, com contagem

| Peça | Ocorrências | Observação |
|---|---|---|
| `mat-icon` | 101 | ícones de linha, de célula e SVG próprios (`captacao`, `financeiro`, `academico`, `ficha`, `pdf`, `excel`, `dinheiro`, `filtro`, `arrow`) |
| `button[ucam-material]` | 40 | `rounded`, `outline`, `color`, `text`, `[hover]="{color, text}"`, `[disabled]` |
| `mat-spinner` | 17 | um por seção |
| `table[mat-table]` | 15 | 3 com `multiTemplateDataRows`; 6 com `mat-footer-row`; 1 com `matSort` |
| `mat-form-field` + `matInput` | 13 / 9 | buscas com `appearance="none"` e ícone `search` |
| `ucam-material-profile-photo` | 10 | `size` (40px, 60px), `src` |
| `ucam-select-rounded` | 8 | `icon`, `options`, `default`, `ngModel` |
| `mat-paginator` | 8 | |
| `app-backdrop` | 8 | fundo dos diálogos próprios (`export`, `hidden`) |
| `app-donut` | 6 | `color`, `porcentagem`, `decimais` — rosca SVG de célula |
| `app-export` | 6 | `show`, `selectOptions`, `selectDefault`, `dataset`, `extraInfo`, `loading`; saídas `closeEvent`, `changeEvent` |
| `mat-radio-button` / `mat-radio-group` | 6 / 2 | cartões de escolha |
| `mat-select` (+ `mat-select-trigger`, `mat-option`) | 4 | filtros da ficha |
| `ucam-material-select` | 2 (1 ativo) | `multiple`, `options`, `placeholder`, `label` |
| `mat-slide-toggle` | 2 (1 ativo) | "Selecionar todas" |
| `app-piramide`, `app-pie`, `app-line` | 1 cada | gráficos Highcharts |
| `default-style`, `page`, `sidemenu-left` | 1 cada | moldura |

Os diálogos **não** usam `MatDialog`: são componentes próprios com `[show]` e `app-backdrop`.

## 4. Regras de negócio lidas no código

1. **O percentual de repasse ao polo depende do número de alunos pagantes no mês: 25% até 100 alunos, 30% de 101 a 200, 35% acima de 200.** `pages/financeiro/financeiro.component.ts:267-273` (repetido em `:295-301`). Tipo: cálculo. Fórmula: `valorrepasse = valorpago × percentual`; a faixa é decidida por `SOMATORIO_TOTAL_ALUNOS`.
2. **O repasse só é calculado quando há exatamente uma unidade selecionada; com várias, a coluna mostra "-" e a exportação leva zero.** `financeiro.component.ts:154, 264, 309-315`; `financeiro.component.html:115-116`. Tipo: cálculo.
3. **O total de repasse é o total pago vezes o mesmo percentual.** `financeiro.component.ts:284-285`. Tipo: cálculo.
4. **Taxa de conversão da captação = matriculados ÷ inscritos, sem casas decimais.** `pages/captacao/captacao.component.html:76`. Tipo: cálculo. Fórmula: `(MATRICULADOS / INSCRITOS × 100).toFixed(0)`.
5. **Representação de cada situação = total da situação ÷ inscritos.** `captacao.component.html:95`. Tipo: cálculo.
6. **Situações do funil: Inscritos, Aprovados, Matriculados.** `captacao.component.ts:146-160`. Tipo: enumeração. Chaves da API: `INSCRITOS`, `APROVADOS`, `MATRICULADOS`.
7. **Conversão por forma de ingresso = matriculados da forma ÷ total de matriculados, 1 casa.** `captacao.component.html:189`; `captacao.component.ts:185`. Tipo: cálculo.
8. **Representação do curso = matriculados do curso ÷ total de matriculados, 2 casas.** `captacao.component.html:287`; `pages/academico/academico.component.html:50`. Tipo: cálculo.
9. **Há dois períodos de captação por período letivo.** `captacao.component.ts:85-93`; `services/util.service.ts:49-59`. Tipo: enumeração. Valores: `CAPTACAO1` "Captação 1", `CAPTACAO2` "Captação 2"; trocar o período letivo na Home volta para `CAPTACAO1` (`pages/home/home.component.html:16`).
10. **Cursos e formas de ingresso são ordenados do maior para o menor número de matriculados.** `captacao.component.ts:182-184, 217-219`. Tipo: formato.
11. **A evolução de matrícula é semanal, com filtro por mês da data de início da semana.** `captacao.component.ts:272-322`. Tipo: formato.
12. **"Cancelados e abandonos" = matrícula pendente + transferidos.** `academico.component.html:74, 77`. Tipo: cálculo. Na exportação as mesmas duas parcelas saem como colunas "CANCELADOS" (`totalMatriculaPendente`) e "ABANDONOS" (`totalTransferido`) (`components/modal/export/export.component.ts:125-126`).
13. **Situações do aluno no filtro acadêmico: Todos, Matriculado, Trancado, Transferido.** `components/modal/curso-academico/curso-academico.component.ts:56-77`. Tipo: enumeração. Valores: `null`, `MATRICULADO`, `TRANCADO`, `TRANSFERIDO`; `MATRICULA_PENDENTE` está comentado.
14. **Notas exibidas por disciplina: P1, P2, P3 e média final, com travessão na falta.** `components/modal/curso-academico/curso-academico.component.html:125-155`. Tipo: formato. Campos: `notap1`, `notap2`, `notaps` (sob o rótulo P3), `media`, `situacaoalunodisciplina`.
15. **Só unidades do tipo EAD entram no filtro.** `app.component.ts:138`. Tipo: permissão. A modalidade é fixa em "EAD" (`:170-173`).
16. **As unidades disponíveis são as do usuário logado.** `app.component.ts:126`; `services/login.service.ts:36-39`. Tipo: permissão.
17. **Um painel só abre com tipo de consulta escolhido, ao menos uma unidade e uma modalidade.** `pages/home/home.component.ts:75`. Tipo: validação.
18. **As tabelas de repasse abrem no mês corrente; sem meses disponíveis, a opção vira "Todos".** `financeiro.component.ts:170-178`. Tipo: prazo. Sem mês escolhido, as tabelas de repasse não consultam (`:204, 325`).
19. **Mensalidade vencida = cobrança do tipo MENSALIDADE não paga; acordo = cobrança do tipo ACORDO.** `components/component/ficha-financeira/ficha-financeira.component.ts:57-58`. Tipo: enumeração. Valores de `tipocobranca`: `MENSALIDADE`, `ACORDO`.
20. **Na ficha, a observação de uma parcela de acordo é "ACORDO <número>"; nas demais, a origem do pagamento.** `ficha-financeira.component.ts:42-46`. Tipo: formato.
21. **Cobrança não paga não mostra valor recebido nem data de pagamento.** `ficha-financeira.component.ts:37-40`. Tipo: formato. Quitação: "SIM" / "NÂO" (grafia do código).
22. **A competência é exibida como `MM/AAAA`, com zero à esquerda.** `ficha-financeira.component.ts:47`. Tipo: formato.
23. **A ficha é ordenada do vencimento mais recente para o mais antigo.** `ficha-financeira.component.ts:49-51`; `components/modal/ficha-financeiro-acordo/ficha-financeiro-acordo.component.ts:30-32`. Tipo: formato.
24. **Parcelas de acordo são agrupadas por número de acordo, com contador de pagas sobre o total.** `ficha-financeiro-acordo.component.ts:34-41, 85-91`. Tipo: cálculo.
25. **A ficha financeira só pode ser exportada com um aluno aberto.** `pages/ficha/ficha.component.html:17`. Tipo: validação. Título do arquivo: "Ficha financeira: <nome> #<matrícula>".
26. **A ficha é carregada de 15 em 15 alunos; a busca casa matrícula ou nome.** `pages/ficha/ficha.component.ts:180`; `services/ficha.service.ts:24`. Tipo: limite.
27. **Inadimplência por aluno: 4 por página na linha expandida; a exportação pede até 10.000 linhas.** `financeiro.component.ts:464, 485`. Tipo: limite.
28. **No detalhe do aluno inadimplente, com mês escolhido aparecem só as cobranças daquele mês; sem mês, todas, do mês mais recente para o mais antigo.** `components/modal/aluno-inadimplencia/aluno-inadimplencia.component.ts:23-33`. Tipo: formato.
29. **Exportação em PDF ou Excel, com linha "TOTAL" somando colunas inteiras e de moeda.** `services/export.service.ts:154-190, 349-378`. Tipo: formato. PDF em paisagem, corpo 6, cabeçalho com nome do relatório + data e hora + logotipo, rodapé "nome - página de total". Excel com formatos `dd/mm/yyyy`, `#,##0.00;[Red]-#,##0.00`, `0.00%`, `#,##0;[Red]-#,##0`.
30. **Doze conjuntos de exportação com colunas fixas** (`export.component.ts:44-195`): 1 candidatos por situação (17 colunas, inclui socioeconômico 1 e 2, bolsa e bolsa social); 2 matriculados por curso; 3 evolução por semana; 4 repasse por aluno; 5 repasse por curso; 6 inadimplência por curso; 7 alunos ativos por curso; 8 alunos do curso; 9 alunos matriculados; 10 candidatos matriculados; 11 ficha financeira; 12 inadimplência por aluno. Tipo: formato.
31. **Datas vindas da API são corrigidas pelo fuso do navegador antes de exibir.** `candidatos-matriculados.component.ts:78-83`; `ficha-financeira.component.ts:30-32`. Tipo: formato.
32. **Busca e mudança de filtro esperam 2 s antes de consultar.** `home.component.ts:39-41`; `financeiro.component.ts:540-553`; `ficha.component.ts:222-226`. Tipo: limite.
33. **Qualquer falha de API abre a mesma mensagem.** `components/modal/error/error.component.html:4`. Tipo: integração. Mensagem: "Ocorreu um erro na requisição".
34. **Rota protegida sem sessão manda para o login externo; login só redireciona se o usuário da URL for o da sessão.** `services/auth/auth-guard.service.ts:26-29`; `pages/login/login.component.ts:36`. Tipo: permissão.

## 5. API consumida

Base `API` (produção: marcador `API_BACKEND`, substituído na publicação; comentário aponta `https://api-gestaopolos.candidomendes.edu.br`). Todos GET. Parâmetros comuns: `ano`, `semestre`, `nomeunidade` (lista separada por vírgula), `modalidade`.

| Serviço | Caminho | Parâmetros adicionais |
|---|---|---|
| `PeriodoService` | `/periodosletivos` | só `modalidade` |
| | `/receitarepasseporcurso/filtropormes` | `ano`, `semestre`, `nomeunidade` |
| `CaptacaoService` | `/candidatosporsituacao` | `periodocaptacao` |
| | `/candidatosporsituacao/relatorio` | `periodocaptacao`, `situacao` (opcional) |
| | `/matriculadosporcurso` | `periodocaptacao`, `page=0`, `size=1000` |
| | `/matriculadosporcurso/relatorio` | `nomecurso`, `periodocaptacao`, `page`, `size` |
| | `/evolucaomatricula` | `periodocaptacao` |
| | `/quantitativoalunoporformaingresso` | `periodocaptacao` |
| `AcademicoService` | `/alunosativosporcurso` | `page`, `size`, `mes` |
| | `/alunosativosporcurso/somatoriodosvalores` | `mes` (opcional) |
| | `/situacaoalunoporcurso` | `nomecurso`, `page`, `size`, `situacao` (opcional) |
| | `/listagemdisciplinaporaluno` | `unidade`, `nomecurso`, `matriculaaluno`, `nomealuno`, `page=0`, `size=100` |
| `FinanceiroService` | `/receitarepasseporaluno` | `page`, `size`, `mes`, `nomealuno` (opcional); sem `semestre` |
| | `/receitarepasseporaluno/somatoriodosvalores` | `mes` |
| | `/receitarepasseporcurso` | `page`, `size`, `mes`, `nomecurso` (opcional) |
| | `/receitarepasseporcurso/somatoriodosvalores` | `mes` |
| | `/inadimplenciaporcurso` | `page`, `size`, `mes` |
| | `/inadimplenciaporcurso/somatoriodosvalores` | `mes` |
| | `/inadimplenciaporaluno` | `nomecurso`, `tipocobranca`, `page`, `size`, `mes` (na exportação, sem curso e sem tipo) |
| | `/inadimplenciaporaluno/mesesinadimplentesporaluno` | `nomecurso`, `matriculaaluno`, `cpf`, `tipocobranca`, `page=0`, `size=100` |
| `FichaService` | `/fichafinanceiradosalunos` | `page`, `size`, `nomecurso`, `matriculaaluno` + `nomealuno` (opcionais) |
| | `/fichafinanceiradosalunos/filtros` | só `nomeunidade`, `modalidade` |
| | `/fichafinanceiradosalunos/alunoespecifico` | `cpf`, `matriculaaluno`, `page=0`, `size=1000` |
| | `/fichafinanceiradosalunos/alunoespecifico/acordos` | idem |
| | `/fichafinanceiradosalunos/somatoriodosvalores` | — |
| `PessoaService` | `API_FOTO` (`…/academico/pessoa/search/foto`) | `cpfs` |
| `LoginService` / `AuthEffects` | gerencial `/usuario/{oid}`, `/usuario/{oid}/pessoa`, `/unidade/{oid}` | |
| | `API_RESOURCE_SERVICE` `core/unidades?oidusuario=` | |

**Modelos declarados:** `Periodo` (`ano`, `semestre`, `periodocaptacao?`, `modalidade?`); `Unidade` (`oid`, `sigla`, `razaosocial`, `tipo`, `datasource`); `UsuarioLogado` (`oid`, `oidpessoa`, `nome`, `email`, `foto`, `token`); `RelatorioExporter` (`TITULO`, `COLUMNS[{NAME, FORMAT, PROPERTY}]`, `DATA`, `STYLE{fontSize}`).

**Campos de resposta lidos (sem interface declarada):**
- Candidatos por situação: `INSCRITOS`, `APROVADOS`, `MATRICULADOS`. Relatório: `nomeunidade`, `nomecandidato`, `cpf`, `nomecurso`, `formaingresso`, `situacao`, `datamatricula`, `datainscricao`, `numeroinscricao`, `datapagamento`, `email`, `telefonecelular`, `telefoneresidencial`, `resposta1`, `resposta2`, `bolsas`, `bolsasocial`, `primeiroacessoplataforma`.
- Forma de ingresso: `formaingresso`, `quantitativo`. Matriculados por curso: `nomecurso`, `totalmatriculado`, `periodoletivo`. Evolução: `dataInicioSemana`, `dataFimSemana`, `quantidade`.
- Acadêmico: `nomecurso`, `totalMatriculado`, `totalTrancado`, `totalMatriculaPendente`, `totalTransferido`; somatórios `SOMATORIO_TOTAL_MATRICULADO`, `_TRANCADO`, `_MATRICULA_PENDENTE`, `_TRANSFERIDO`. Aluno: `nomealuno`, `cpf`, `matricula`, `periodo`, `nomeunidade`, `situacao`. Disciplina: `descricaoturma`, `notap1`, `notap2`, `notaps`, `media`, `situacaoalunodisciplina`, `celularaluno`, `emailaluno`.
- Repasse: `nomealuno`, `matriculaaluno`, `cpf`, `nomecurso`, `periodo`, `nomeunidade`, `modalidade`, `valorpago`, `valorrepasse`, `tipocobranca`, `totalaluno`; somatórios `SOMATORIO_TOTAL_ALUNOS`, `SOMATORIO_TOTAL_CURSOS`, `SOMATORIO_VALOR_PAGO`, `SOMATORIO_VALOR_REPASSE`.
- Inadimplência: `nomecurso`, `modalidade`, `totalaluno`, `valorliquido`, `tipocobranca`, `mes`; `SOMATORIO_VALOR_LIQUIDO`.
- Ficha: `nomealuno`, `matriculaaluno`, `cpf`, `modalidade`, `nomecurso`, `nomeunidade`, `totalMensalidadesPagas`, `totalMensalidadesGeradas`, `totalMensalidadesVencidas`, `vencidas`, `totalAcordosGerados`, `totalParcelasAcordosPagos`, `totalParcelasAcordosGerados`, `totalParcelasAcordosVencidos`; lançamento: `competenciapagamento`, `datavencimento`, `tipocobranca`, `pago`, `valorrecebido`, `valorliquido`, `datapagamento`, `origempagamento`, `numeroacordo`; somatórios `SOMATORIO_TOTAL_MENSALIDADES_PAGAS`, `_GERADAS`, `_VENCIDAS`, `SOMATORIO_VALOR_VENCIDAS`, `SOMATORIO_TOTAL_ACORDOS_GERADOS`, `SOMATORIO_TOTAL_PARCELAS_ACORDOS_PAGOS`, `_GERADOS`, `_VENCIDOS`.

## 6. O que o código não responde

1. As faixas de repasse (25%, 30%, 35% em 100 e 200 alunos) estão fixas no front: são contratuais, valem para todos os polos, mudam por período? — Diretoria financeira / gestão de polos.
2. Por que o repasse não se calcula com mais de uma unidade, e se a faixa deveria ser por polo quando várias estão selecionadas. — Gestão de polos.
3. A faixa usa "total de alunos" do mês: são alunos pagantes, matriculados ou cobranças? — Financeiro.
4. "Cancelados e abandonos" soma matrícula pendente com transferidos, e a exportação chama essas parcelas de "CANCELADOS" e "ABANDONOS": qual é a definição correta de cada situação? — Secretaria acadêmica.
5. "P3" exibe o campo `notaps`: é prova substitutiva? Qual a regra da média final? — Coordenação acadêmica.
6. O que separa "Captação 1" de "Captação 2" (datas, processo) e por que só duas. — Captação / comercial.
7. "Aprovados" no funil: aprovados em quê (prova, análise documental, pagamento)? — Captação.
8. "Valor líquido em aberto": líquido de quê (bolsa, desconto, juros)? A partir de quantos dias uma cobrança conta como inadimplente? — Financeiro.
9. Quem pode ver CPF, telefone, e-mail, bolsa e respostas socioeconômicas dos candidatos na exportação; o front não restringe além da lista de unidades do usuário. — Encarregado de dados (LGPD) / gestão de polos.
10. O sistema é só EAD por decisão ou por estágio de implantação (a seleção de modalidade está comentada)? — Dono do produto.
11. A coluna de três pontos em quase todas as tabelas não tem ação: que ações por linha estavam previstas? — Dono do produto.
12. A base da API em produção é o marcador `API_BACKEND`; o endereço real não está no código. — TI / infraestrutura.

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
