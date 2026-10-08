# Inventário do rel-contabilidade-frontend (Angular 9) — relatórios do SigFin

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\rel-contabilidade-frontend`. As referências `arquivo:linha` são relativas a `src/app/` (ou `src/environments/` quando indicado).

**Cobertura da leitura.** Li por inteiro: README, TODO.md, rotas, `app.component`, `app.module`, guard, store de auth e de aluno, `core.service`, environments, `rx-stomp.config`, todos os componentes de `shared/` (home, login, loader, os dois modais de exportação, sem-filtro, total-lateral), modelos, pipes, `utils.service`, `login.service`, `websocket.service`, todos os serviços de página e a família `valor_bruto` (templates e classes). As demais telas foram lidas por comparação: `diff` contra a tela irmã (bruto × líquido; mensalidade quitada × recebida × adiantada × em aberto; títulos a receber × baixa de pagamento) e por extração estruturada dos templates (filtros, colunas, cabeçalhos, eventos) e das classes (formulário, chamadas, somas, exportação). Dos três serviços de exportação (`export.service`, `excel.service`, `pdf.service`) li assinaturas, formatos e cabeçalho/rodapé, não o corpo linha a linha. Não li `.sass` nem `.spec.ts`.

---

## 1. Rotas e telas

Não há módulo lazy: tudo é declarado em `AppModule` (`app.module.ts:93-140`) e as rotas ficam em `app-routing.module.ts:27-133`. São 21 rotas: home, login por token e 19 relatórios. O único guard é `AuthGuard`, que só verifica `state.authenticated` (`core/services/auth/auth-guard.service.ts:20-29`); não há checagem de perfil nem de permissão por relatório.

### 1.1 Tabela de rotas

| URL | Componente | Template | Guard |
|---|---|---|---|
| `''` | `HomeComponent` | `shared/components/home/home.component.html` | AuthGuard |
| `login/:token/:user` | `LoginComponent` | `shared/components/login/login.component.html` | nenhum |
| `contas_a_receber_bruto` | `ContasAReceberBrutoComponent` | `paginas/valor_bruto/contas-a-receber/contas-a-receber.component.html` | AuthGuard |
| `contas_a_receber_liquido` | `ContasAReceberLiquidoComponent` | `paginas/valor_liquido/contas-a-receber/contas-a-receber.component.html` | AuthGuard |
| `recebimento_por_modalidade_bruto` | `RecebimentoPorModalidadeBrutoComponent` | `paginas/valor_bruto/recebimento-por-modalidade/recebimento-por-modalidade.component.html` | AuthGuard |
| `recebimento_por_modalidade_liquido` | `RecebimentoPorModalidadeLiquidoComponent` | `paginas/valor_liquido/recebimento-por-modalidade/recebimento-por-modalidade.component.html` | AuthGuard |
| `provisao_receita_recebido` | `ReceitaRecebidoComponent` | `paginas/receita/receita-recebido/receita-recebido.component.html` | AuthGuard |
| `provisao_receita_diaria` | `ReceitasDiariasComponent` | `paginas/receita/receitas-diarias/receitas-diarias.component.html` | AuthGuard |
| `provisao_receita_bancaria` | `ReceitaBancariaComponent` | `paginas/receita/receita-bancaria/receita-bancaria.component.html` | AuthGuard |
| `informacoes_recebimento` | `InformacaoRecebimentoComponent` | `paginas/receita/informacao-recebimento/informacao-recebimento.html` | AuthGuard |
| `inadimplente` | `InadimplenteComponent` | `paginas/inadimplente/inadimplente/inadimplente.component.html` | AuthGuard |
| `mensalidade_quitada` | `MensalidadeQuitadaComponent` | `paginas/mensalidade/mensalidade-quitada/mensalidade-quitada.component.html` | AuthGuard |
| `mensalidade_recebida` | `MensalidadeRecebidaComponent` | `paginas/mensalidade/mensalidade-recebida/mensalidade-recebida.component.html` | AuthGuard |
| `mensalidade_adiantada` | `MensalidadeAdiantadaComponent` | `paginas/mensalidade/mensalidade-adiantada/mensalidade-adiantada.html` | AuthGuard |
| `mensalidade_em_aberto` | `MensalidadeEmAbertoComponent` | `paginas/mensalidade/mensalidade-em-aberto/mensalidade-em-aberto.html` | AuthGuard |
| `mensalidadeporaluno` | `MensalidadePorAlunoComponent` | `paginas/mensalidade/mensalidade-por-aluno/mensalidade-por-aluno.html` | AuthGuard |
| `arrecadacao_por_caixa` | `ArrecadacaoPorCaixaComponent` | `paginas/arrecadacao/arrecadacao-por-caixa/arrecadacao-por-caixa.component.html` | AuthGuard |
| `alterdata/valorrecebido` | `ValorrecebidoComponent` | `paginas/alterdata/valorrecebido/valorrecebido.component.html` | AuthGuard |
| `alterdata/titulo-a-receber` | `TitulosAReceberComponent` | `paginas/alterdata/titulos-a-receber/titulos-a-receber.component.html` | AuthGuard |
| `alterdata/baixa-de-pagamento` | `BaixaDePagamentoComponent` | `paginas/alterdata/baixa-de-pagamento/baixa-de-pagamento.component.html` | AuthGuard |
| `academico/aluno` | `AlunoComponent` | `paginas/academico/aluno/aluno.component.html` | AuthGuard |

Sem rota: `paginas/processamento/tarefas` (template de 1 linha, módulo próprio não importado) → **nao-migrar**.

### 1.2 Anatomia comum a todos os relatórios

É a parte que vira padrão. Os 19 relatórios usam a mesma casca, com poucas variações.

**Casca.** `<page filterButton="true">` com `<sidemenu-left>` (logo SigFin + formulário de filtros) e `<div content class="main-content">`. No conteúdo: sobretítulo fixo "RELATÓRIO", título em caixa alta e, à direita, o botão "EXPORTAR" (`ucam-material rounded outline`, ícone `publish` girado 180°).

**Não existe botão "Filtrar" nem "Limpar".** O relatório consulta sozinho a cada mudança do formulário, assim que ele fica válido (`valueChanges` → `onSearch`/`getData`). A única exceção é `academico/aluno`, que tem um botão que chama `pesquisar()` além do disparo automático. Enquanto o formulário está intocado ou inválido aparece o estado vazio `<no-data>` ("Nenhum filtro / Selecionado ainda" + botão "Filtrar", que só acende um backdrop). Durante a busca, `<loader message="Carregando">` ocupa a área de conteúdo.

**Filtros que se repetem (barra lateral, nesta ordem com pequenas trocas):**

| Filtro | Controle | Campo do formulário | Presente em |
|---|---|---|---|
| Pesquisa rápida | `ucam-material-input` com lupa | `pesquisa` (vai como `pesquisa` ou `nomecurso`) | 17 de 19 (fora: mensalidade por aluno não liga o campo; baixa de pagamento não tem) |
| Tipo de curso | 4 `ucam-material-checkboxbutton rounded` | família bruto/líquido: `graduacao`, `extensao`, `tecnico`, `posgraduacao`; demais: `graduação`, `extensão`, `pós-lato`, `pós-stricto` | 15 de 19 |
| Modalidade | 3 `ucam-material-radiobutton join` | `modalidade`: `EAD`, `PRESENCIAL`, `TODOS` (padrão `TODOS`) | 17 de 19 |
| Período | `ucam-material-datepicker multiplo="true"` (intervalo) | `periodo` → `{inicio, fim}`; obrigatório | 19 de 19 |
| Unidade | `ucam-material-select [multiple]="true"` | `unidade`; obrigatório | 17 de 19 |
| Data de referência do recebimento | 2 `ucam-material-radiobutton` | `filtro`: `pagamento` ou `credito`; obrigatório | mensalidade recebida, receita diária |

O rótulo do período muda conforme o relatório: "Competência" (com `periodo="mes"` e máscara `MM/yyyy` nos relatórios mensais), "Período", "Data de referência" ou "Data de pagamento". A lista de unidades é recalculada pela modalidade escolhida e ganha a opção "TODOS" (`shared/services/utils.service.ts:63-98`).

**Resultado.** Em 15 dos 19 relatórios o resultado é dividido em abas (`mat-tab-group`), uma por mês (rótulo "JANEIRO/2024" pelo pipe `mes_ano`) ou uma por curso. Trocar de aba troca o `dataSource` da mesma tabela; em receita diária e receita × recebido, trocar de aba dispara nova chamada ao servidor.

**Totais.** Há quatro jeitos, e nenhum é o rodapé clássico em todos:
1. Faixa de resumo acima da tabela (Competência, quantidade de alunos, valor total) — a forma mais comum (10 telas).
2. Cartões de indicador clicáveis (`mat-card`) — só contas a receber.
3. Linha de rodapé da tabela (`mat-footer-row`) — fluxo de caixa projetado, receita diária e a tabela de receita × recebido (3 templates).
4. Painel lateral recolhível `total-lateral` ("Índice geral") — só contas a receber (2 usos).
Nos diálogos de detalhe o total vem numa segunda linha de cabeçalho grudada (`mat-header-row` com `sticky: true` e `colspan`).

**Exportar.** Sempre por diálogo, em duas variantes:
- `ExportsComponent` (no cliente): título "EXPORTAR ARQUIVO", dois blocos — "DADOS SINTÉTICOS" e "DADOS ANALÍTICOS" — cada um com PDF e XLSX; a tela diz quais dos 4 estão habilitados (`shared/components/modal/exports/exports.component.ts:28-32`). O XLSX é montado no navegador com `exceljs` + `file-saver`; o PDF com `pdfmake` e abre em pré-visualização (`pdfService.preview`). Não há CSV.
- `ExportsBackendComponent` (no servidor): tabela de relatórios já pedidos (Pesquisa, Filtro, Unidade, Modalidade, Início, Fim, Status, ações PDF/XLSX), botão "Exportar" que enfileira um novo e atualização por websocket STOMP. Usado em mensalidades em aberto, receita × recebido, valor recebido Alterdata e consulta de aluno.

**Paginação.** Nas telas com abas não há paginação: o servidor devolve tudo e o cliente agrupa. Paginação no servidor existe só nos diálogos de detalhe de contas a receber/recebimento por modalidade (20 por página, `page`/`size`) e nas duas listas planas (Alterdata valor recebido e consulta de aluno; 5/10/20/50, padrão 10). Não há ordenação por coluna em nenhuma tabela (o TODO.md registra: "Impossível, pois quebra a consistência de dados").

**Tabelas.** Cabeçalho grudado (`sticky: true`) em 22 definições de linha. Linha expansível (`multiTemplateDataRows` + linha `expandedDetail`) em 6 telas. Cabeçalho agrupado (duas linhas de cabeçalho com `colspan`) só em receita diária. Colunas dinâmicas (geradas dos dados) em receita diária (uma por banco) e arrecadação por caixa (uma por competência). Coluna que some conforme o filtro (Modalidade só aparece com "TODOS") na família bruto/líquido. Não há colunas fixas (congeladas) na horizontal. Ícone de informação com tooltip no cabeçalho da coluna, definindo o termo de negócio, na família bruto/líquido (29 tooltips).

### 1.3 Formas distintas: são 8

| # | Forma | Telas | Qtde |
|---|---|---|---|
| A | Movimento diário por mês, com cartões de indicador e detalhe por aluno em diálogo | contas a receber bruto, contas a receber líquido | 2 |
| B | Movimento diário por mês, com resumo por meio de pagamento ou rodapé | recebimento por modalidade bruto, fluxo de caixa projetado (líquido) | 2 |
| C | Aluno agrupado com linha expansível (parcelas), abas por curso ou mês | mensalidade quitada, recebida, adiantada, em aberto, inadimplência | 5 |
| D | Lista analítica plana em abas por mês (com ou sem linha expansível) | mensalidade por aluno, receita bancária, informações de recebimento | 3 |
| E | Matriz com colunas geradas dos dados | arrecadação por caixa, receita diária | 2 |
| F | Blocos por tipo de curso, cada um com abas por mês, tabela com rodapé e detalhe em diálogo | provisão de receitas × recebido | 1 |
| G | Lista plana paginada no servidor | Alterdata valor recebido, consulta de aluno | 2 |
| H | Disparo de exportação com fila de processos | Alterdata títulos a receber, Alterdata baixa de pagamento | 2 |

### 1.4 Telas, uma a uma

Em todas vale a anatomia de 1.2; abaixo só o que é próprio de cada uma.

#### Forma A — contas a receber (bruto e líquido)

**`contas_a_receber_bruto` — "GERENCIAL DE CONTAS A RECEBER BRUTO"** e **`contas_a_receber_liquido` — "GERENCIAL DE CONTAS A RECEBER LIQUIDO"**. Mostra, dia a dia, o saldo contratual a receber e o que entrou e saiu dele.
- Arquétipo: relatório de movimento (painel de indicadores + tabela).
- Filtros: `pesquisa`, `graduacao`, `extensao`, `tecnico`, `posgraduacao`, `periodo` (rótulo "Competência"), `modalidade`, `unidade`.
- Cartões (6): Competência; Contas a Receber; Faturamento; Baixa contratual; Recebimento; Contas a receber final. Faturamento, Baixa contratual e Recebimento são clicáveis e abrem o diálogo correspondente.
- Abas por mês. Colunas (`contas-a-receber.component.ts:54-62`): Data do pagamento (`datapagamento`), Modalidade (`modalidadecurso`, só com "TODOS"), Contas a Receber inicial, Faturamento, Baixa contratual, Recebimento, Contas a receber Final. O líquido acrescenta "Bolsas concedidas" (`valorbolsaconcedida`) e lê os campos `...liquido` no lugar de `...bruto`.
- Clique na linha abre o diálogo de recebimento daquele dia.
- Painel lateral `total-lateral` com os 5 totais.
- Exportar: bruto só XLSX (`:348`); líquido nenhum formato habilitado (`valor_liquido/.../contas-a-receber.component.ts:295`).
- Diálogos (80% × 80%, "Nível de aluno", pesquisa rápida própria, paginação no servidor):
  - **Faturamento**: colunas Aluno (foto + nome + "MATRICULA: n"), Modalidade, Evento (`tipo`), Faturamento (`valor`); linha de total com período e soma.
  - **Baixa contratual**: iguais, com Baixa contratual (`valorbruto`).
  - **Recebimento**: Aluno (nome + curso), Modalidade, Valor bruto, Bolsa de estudos, Desconto, Multa e juros, Recebimento (`valorpago`), Tipo de cobrança; linha de total com 5 somas vindas do servidor.
- Classificação: **parcial**. Base: padrão `consulta-relatorio` (telas `relatorios/filtros` e `relatorios/resultado`) + `painel-indicadores` para os cartões; `dialog` + `data-table` + `pagination` para o detalhe. Falta: tela de referência de relatório com cartões de indicador clicáveis que abrem o detalhe; abas por mês sobre a mesma tabela; painel lateral de totais.

#### Forma B — recebimento por modalidade

**`recebimento_por_modalidade_bruto` — "MODALIDADE DE RECEBIMENTO - BRUTO"** (no menu: "Relatório Financeiro por Modalidade de Recebimento"). Recebimentos por dia, com resumo por meio de pagamento.
- Filtros: os mesmos da forma A; rótulo do período "Período".
- Resumo: faixa com 6 colunas (Competência, Recebimento, Bolsa de estudos, Desconto, Multa e juros, Contas a receber final) dentro de um `mat-expansion-panel`; ao abrir, uma linha por meio de pagamento (BANCO, DINHEIRO, CARTAO, CHEQUE, DEPOSITO, com ícone).
- Colunas: Data do pagamento, Recebimento, Bolsas de Estudo, Desconto, Multas e Juros, Contas a receber Final.
- Clique na linha abre o diálogo "Gerencial por modalidade": Aluno, Modalidade, Meio de pagamento, Tipo de cobrança, Recebimento; total; paginação no servidor.
- Exportar: PDF e XLSX sintéticos (`:330`).

**`recebimento_por_modalidade_liquido` — "FLUXO DE CAIXA PROJETADO"**. Previsão de recebimento por dia, líquida de bolsa.
- Sem o resumo expansível. Colunas: Data do pagamento, Recebimento, Bolsas de Estudo, Total; rodapé com as três somas.
- Diálogo igual ao bruto, com a coluna Bolsa de estudos e dois totais.
- Exportar: nenhum formato habilitado (`:231`).
- Classificação (as duas): **parcial**. Base: `consulta-relatorio` / `relatorios/resultado`. Falta: resumo expansível por meio de pagamento (o `section-bar` ou um acordeão não está entre os 49 componentes) e abas por mês.

#### Forma C — aluno agrupado com parcelas

Colunas da linha-mãe: Aluno (`nomealuno`), Matrícula (`matriculaaluno`), Modalidade, Tipo, Total. A linha expande e lista as parcelas. Faixa de resumo: período, quantidade de alunos, valor total. Exportar: 4 opções (sintético e analítico, PDF e XLSX), salvo onde indicado.

| Tela | Título | Abas | Detalhe da linha expandida | Total da linha | Particularidades |
|---|---|---|---|---|---|
| `mensalidade_quitada` | COBRANÇAS QUITADAS POR COMPETÊNCIA | por curso | Competência, Data vencimento, Data pagamento, Valor líquido, Valor recebido | soma de `valorrecebido` | competência mensal (`MM/yyyy`) |
| `mensalidade_recebida` | COBRANÇAS RECEBIDAS EM UM PERÍODO | por mês de pagamento | Competência, Tipo, Data pagamento, Data de crédito (`databaixa`), Valor | soma de `valorrecebido` | filtro extra obrigatório "Data de pagamento / Data de crédito"; rótulo "Data de referência"; sem coluna Matrícula |
| `mensalidade_adiantada` | MENSALIDADES PAGAS ANTECIPADAMENTE | por curso (curso + unidade se houver mais de uma) | acrescenta Valor bruto e "D. de antecipação" (`valordescontoantecipacao`) | soma de `valorrecebido` | analítico inclui Banco, Agência, Conta, Nosso número |
| `mensalidade_em_aberto` | MENSALIDADES EM ABERTO | por curso | Competência, Data vencimento, Valor líquido | soma de `valorliquido` | exportação pelo servidor (`ExportsBackendComponent`) |
| `inadimplente` | INADIMPLÊNCIA | por curso | Competência, Tipo, Vencimento, Período, Valor bruto, Valor líquido | soma de `valorliquido` | — |

- Classificação: **parcial**. Base: `consulta-relatorio` / `relatorios/resultado` + `data-table`. Falta: linha expansível com subtabela de parcelas na tela de referência; abas por curso/mês; diálogo de exportação com escolha sintético × analítico.

#### Forma D — lista analítica plana por mês

| Tela | Título | Filtros próprios | Colunas visíveis | Resumo | Linha expansível |
|---|---|---|---|---|---|
| `mensalidadeporaluno` | MENSALIDADES POR ALUNO | tipo de curso, modalidade, unidade, "Data de pagamento" | Aluno, Competência, Matrícula, Tipo, Unidade, Valor bruto (`mensalidade-por-aluno.component.ts:45-51`) | período, nº de mensalidades, valor total | não |
| `provisao_receita_bancaria` | RECEITA BANCÁRIA | modalidade, unidade, "Competência" | Aluno, Competência, Data recebimento, Valor bruto, Banco (`receita-bancaria.component.ts:46-59`) | período, alunos, valor líquido, juros, multa, total | sim: Vencimento, Valor líquido, Bolsa, Desconto, Juros, Multa, Agência, Conta, Nosso número |
| `informacoes_recebimento` | INFORMAÇÕES DE RECEBIMENTO BANCÁRIO | tipo de curso, modalidade, unidade, "Data de pagamento" | Aluno, Competência, Matrícula, Tipo, Valor bruto, Juros recebido, Multa recebida, Valor líquido (`informacao-recebimento.component.ts:45-62`) | período, alunos, valor líquido, juros, multa, total | sim: Vencimento, Data pagamento, Agência, Conta, Nosso número |

Os templates definem mais colunas do que as exibidas (Vencimento, Agência, Conta, Nosso número, Bolsa, Desconto ficam comentadas na lista de colunas e vão para a linha expandida ou só para a exportação). Exportar: 4 opções.
- Classificação: **parcial**. Base: `consulta-relatorio` / `relatorios/resultado`. Falta: abas por mês; faixa de resumo com 5–6 valores; linha expansível com descrição do título bancário (dá para montar com `description-list`).

#### Forma E — matriz com colunas geradas dos dados

**`arrecadacao_por_caixa` — "ARRECADAÇÃO POR CAIXA"**. Quanto se recebeu em cada mês, por curso e por competência da mensalidade.
- Filtros: `pesquisa`, `modalidade`, `periodo` ("Competência"), `unidade`. Sem tipo de curso.
- Abas por mês de pagamento. Primeira coluna "curso"; as demais são as competências (`MM/AAAA`) encontradas nos dados, ordenadas por data.
- Resumo: período, quantidade (contador de registros), valor total. Exportar: PDF e XLSX sintéticos.

**`provisao_receita_diaria` — "RECEITA DIÁRIA"**. Recebimento de cada dia separado por banco, tesouraria e cheque.
- Filtros: `pesquisa`, `filtro` (pagamento/crédito, obrigatório), `periodo`, `modalidade`, `unidade`.
- Resumo: período, Banco, Tesouraria, Total, Cheque, Multa/Juros.
- Tabela com cabeçalho agrupado em duas faixas: grupo 1 (colspan 3 + nº de bancos) cobre "Recebido em", uma coluna por banco, Tesouraria, Total; grupo 2 (colspan 3) cobre Cheque pré, Tesouraria (multa/juros), Banco (multa/juros). Rodapé "TOTAL" com a soma de cada coluna.
- Clique na linha abre o diálogo "RECEITA DIÁRIA" do dia, com abas por curso: Aluno, Unidade, Modalidade, Competência, Origem de pagamento, Valor recebido.
- Exportar: PDF e XLSX sintéticos (`receitas-diarias.component.ts:518`).
- Classificação (as duas): **falta**. Não há padrão nem peça de tabela cruzada: colunas definidas pelos dados, cabeçalho agrupado e rodapé de totais por coluna. A casca e os filtros saem de `consulta-relatorio`.

#### Forma F — provisão de receitas × recebido

**`provisao_receita_recebido` — "PROVISÃO DE RECEITAS X RECEBIDO"** (menu: "Receitas x recebido"). Compara o valor previsto com o recebido, por curso e mês.
- Filtros: `pesquisa`, tipo de curso, `periodo` ("Competência", mensal), `modalidade`, `unidade`.
- Resumo expansível: período, Valor bruto, Valor líquido, Valor recebido, Valor a receber; aberto mostra Bolsa, Acréscimo, Desconto, Desconto de antecipação, Multa/Juros.
- Um bloco por tipo de curso marcado (`app-tabela-recebido`), cada um com título, botão de exportar próprio e abas por mês. Colunas (`tabela/tabela.component.ts:30-46`): Curso, Unidade, Modalidade, Alunos, Valor bruto, Bolsa, Acréscimo, Desconto, Valor líquido, Desconto de antecipação, Multa/Juros, Valor recebido, Valor a receber. Rodapé "Total" com a soma de cada coluna numérica.
- Clique na linha abre o diálogo do curso no mês: aba "GERAL" (9 valores do curso) e aba "ALUNOS" (Aluno, Valor bruto, Bolsa, Acréscimo, Desconto, Valor líquido, Valor a receber, Desc. antecipação, Multa/Juros, Valor recebido).
- Exportar: no topo, pelo servidor (`ExportsBackendComponent`, canal `ReceitaRecebido`); em cada bloco, 4 opções no cliente.
- Classificação: **parcial**. Base: `consulta-relatorio` / `relatorios/resultado` + `dialog` + `tabs`. Falta: tabela larga (13 colunas) com rodapé de totais repetida em blocos por categoria; exportação por bloco.

#### Forma G — lista plana paginada no servidor

**`alterdata/valorrecebido` — "VALOR RECEBIDO - ALTERDATA"**. Títulos recebidos no formato do ERP Alterdata.
- Filtros: `pesquisa`, tipo de curso, `periodo`, `modalidade`, `unidade`.
- Colunas: ID a receber, Cód. empresa, Cód. pessoa, Nº, Nome, Emissão, Vencimento, Custo, Valor, Natureza, Forma de pagamento. Paginador 5/10/20/50.
- Exportar pelo servidor (canal `ValorRecebido`).

**`academico/aluno` — "CONSULTA DE ALUNO"**. Lista de alunos com situação, pendência e bolsa.
- Filtros: `pesquisa` (placeholder "Pesquisa por nome ou CPF"), tipo de curso, `modalidade`, `periodo` ("Competência"), `unidade`, botão de pesquisar.
- Colunas (`aluno.component.ts:49-58`): Aluno, Matrícula, Situação, Modalidade, Competência, Pendência (Sim/Não), Valor bolsa. Linha expansível: CPF, Situação, Curso, Bolsa percentual (Sim/Não), Bolsa, Valor bolsa, Valor percentual bolsa. Paginador 5/10/20/50.
- Exportar pelo servidor (canal `relatorio_aluno`).
- Classificação (as duas): **parcial**. Base: `listagem-crud` (tela `gerencial/auditoria`, que é lista só de leitura) ou `consulta-relatorio` / `relatorios/resultado`. Falta: diálogo de exportação assíncrona com fila e progresso.

#### Forma H — disparo de exportação com fila

**`alterdata/titulo-a-receber` — "ALTERDATA - CONTAS A RECEBER"** e **`alterdata/baixa-de-pagamento` — "ALTERDATA - BAIXA DE PAGAMENTOS"**. Enviam ao Alterdata/Bimer os títulos ou as baixas de uma competência e acompanham o processamento.
- Filtros: `periodo` (uma competência) e botão "exportar" na barra lateral. Em títulos a receber o template ainda traz pesquisa e tipo de curso, mas a chamada só usa a competência.
- Tabela de processos: Nome (`processName`), Status, Porcentagem (`percentageComplete` %). O template define também as colunas de título (Nº, Nome, Emissão, Vencimento, Custo, Valor, Natureza, Forma de pagamento), que não entram em `displayedColumns`.
- Sem exportação de arquivo, sem totais, sem paginação. A lista é recarregada por sondagem a cada 1 s.
- Classificação: **falta**. Não há padrão de "processo em lote com fila e progresso" (integração). As peças existem (`data-table`, `progress`, `badge`), falta a tela.

#### Demais

**`''` — Home.** Cartão de boas-vindas: marca SigFin, "Sistema Integrado de Gestão Financeira", "Olá, seja bem vindo. Escolha o relatório desejado no menu a esquerda." Classificação: **coberta** pela tela `relatorios/catalogo` (o catálogo de relatórios faz o papel desta home; hoje ela é só texto).

**`login/:token/:user` — entrada por token.** Mostra "Aguarde..." e a logo enquanto troca o token pela sessão. Classificação: **parcial**; base `portal/login`. Falta: estado de "entrando por token" (sem formulário).

**Diálogo "EXPORTAR ARQUIVO" (cliente)** e **diálogo de exportação pelo servidor**: descritos em 1.2. Classificação: **falta** como peça — o DS tem `dialog`, mas não um diálogo de exportação com escolha de formato/nível nem a fila de exportações.

---

## 2. Moldura e navegação

- **Moldura**: `<default-style>` da lib `default-style` (`app.component.html:1-14`), com `startOpen=false`, `environment`, `placeholder`, `unidade`, `unidades`, `usuario`, `multitenance=true` e saídas `logout`, `changeUnidade`, `search`.
- **Menu**: `app.component.ts:34-119` define um `hashMenu` com 4 grupos e 11 itens (Relatórios de Valor Bruto; Relatórios de Valor Líquido; Provisão; Mensalidade), mas o template **não** passa `[hashMenu]` à moldura. Os 8 relatórios restantes (mensalidade adiantada, em aberto, por aluno, informações de recebimento, os 3 Alterdata e consulta de aluno) não estão nesse menu. De onde vem o menu em produção: não confirmado (a moldura recebe `environment` com `APPLICATION_ID: 'aplicRelFinanceiro'` e `MENU_URL`; `core.service.ts:22-31` tem a chamada de menu por aplicação, mas não achei quem a use neste repositório).
- **Barra lateral de filtros**: cada relatório traz a sua em `<sidemenu-left>`, com a marca SigFin no topo; é a segunda barra lateral da tela, além do menu da moldura.
- **Conta**: nome vem de `GET /usuario/{oid}/pessoa`; foto de `GET /usuario/{oid}`; a moldura mostra e oferece sair. Sair limpa o `localStorage` e redireciona para `LOGIN_URL` (`core/services/auth/store/auth.effects.ts:77-83`).
- **Troca de unidade**: a moldura emite `changeUnidade`; a aplicação grava a unidade na sessão e volta para a home (`app.component.ts:147-151`). A unidade escolhida na moldura **não** é usada como filtro dos relatórios: cada relatório tem o seu filtro de unidade, alimentado pela lista de unidades do usuário.
- **Login por token na URL**: `login/:token/:user` (`app-routing.module.ts:35`). `LoginComponent` despacha `TryTokenLogin` com `token` e `oidusuario` (`shared/components/login/login.component.ts:47-56`). O efeito faz três GETs em cadeia e monta a sessão (`auth.effects.ts:24-75`); a sessão fica em `localStorage['AuthState']` (`auth.reducers.ts:15,54`). Não há interceptor HTTP neste repositório: o token não é anexado às requisições pelo front (como o backend autentica as chamadas: não confirmado).
- **Busca global da moldura**: a saída `(search)` chama `log()`, que não faz nada (`app.component.ts:153-155`).

---

## 3. Peças usadas com contagem

Contagem por ocorrência de tag nos `.html` de `src/app`.

| Peça | Qtde | Entradas usadas |
|---|---|---|
| `mat-icon` | 95 | ícones `search`, `info`, `date_range`, `add_circle`, `publish` |
| `ucam-material-checkboxbutton` | 60 | `rounded`, `name`, `id`, `class="small"`, `formControlName` |
| `ucam-material-radiobutton` | 55 | `join` ou `rounded`, `name`, `id`, `value`, `class="small"`, `formControlName` |
| `table mat-table` | 30 | `[dataSource]`, `multiTemplateDataRows` (13 ocorrências), `class="mat-elevation-z0"` |
| `loader` (próprio) | 28 | `message` |
| `button ucam-material` | 28 | `rounded`, `outline`, `flat` |
| `ucam-material-input` | 26 | `id`, `color="side-menu-background"`, `placeholder`, `formControlName`, `class="modal"` |
| `ucam-material-datepicker` | 19 | `multiplo="true"`, `periodo="mes"`, `mask="MM/yyyy"`, `formControlName` |
| `page` + `sidemenu-left` (lib) | 19 + 19 | `filterButton="true"` |
| `no-data` (próprio) | 19 | — |
| `mat-tab-group` / `mat-tab` | 17 / 18 | `(selectedIndexChange)`, `label` |
| `ucam-material-select` | 17 | `[multiple]="true"`, `[options]`, `formControlName` |
| `mat-card` | 12 | cartões de indicador (clicáveis com `(click)`) |
| `mat-paginator` | 10 | `ucam-material rounded clear="true" [width]="5"`, `[length]`, `[pageSize]`, `[pageIndex]`, `(page)`, `[pageSizeOptions]` |
| `ucam-material-profile-photo` | 8 | sem entradas |
| `mat-form-field` / `mat-datepicker` | 4 / 4 | só em blocos comentados |
| `mat-accordion` / `mat-expansion-panel` | 2 / 2 | resumo expansível |
| `total-lateral` (próprio) | 2 | `title`, `[data]`, `subtitle`, `icon` |
| `mat-spinner` | 1 | `diameter="50"` |
| `app-tabela-recebido` (próprio) | 1 | `label`, `dados`, `meses`, `form`, `(open)`, `(loading)` |
| `default-style` | 1 | ver seção 2 |

Diretivas e atributos: `matTooltip` 29 (com `matTooltipPosition="above"` e `matTooltipClass="tooltip-info"`); `sticky: true` 22; `matFooterRowDef` 3; grade por atributo `row`, `col-2`, `col-4`, `col-8`, `col-xl-2`.

Pipes próprios: `mes_ano`, `nome`, `evento`, `cursoFilter`. Pipes Angular: `currency: 'BRL'`, `date: 'dd/MM/yyyy'`, `keyvalue`.

Bibliotecas (`package.json`): Angular 9.0.5, `@angular/material` e `@angular/cdk` 9.1.2, `@ngrx/store` e `@ngrx/effects` 9, `ucam-material` 0.0.910-alpha.53, `default-style` 0.0.910-alpha.15, `exceljs` 4.1, `file-saver` 2.0.2, `pdfmake` 0.1.66, `@stomp/ng2-stompjs` 8 e `@stomp/stompjs` 6.

---

## 4. Regras de negócio lidas no código

1. **Acesso só exige estar autenticado.** `core/services/auth/auth-guard.service.ts:20-29`. Tipo: permissão. Sem perfil nem permissão por relatório; não autenticado dispara `Logout` e vai para `LOGIN_URL`.
2. **Entrada por token na URL.** `shared/components/login/login.component.ts:47-56`, `core/services/auth/store/auth.effects.ts:24-75`. Tipo: integração. Rota `login/:token/:user`; a unidade inicial é a primeira da lista (`unidades[0]`, `:55`).
3. **Sessão guardada no navegador.** `core/services/auth/store/auth.reducers.ts:15,54,65`. Tipo: integração. Chave `AuthState` no `localStorage`; sair executa `localStorage.clear()`.
4. **Trocar de unidade leva à página inicial.** `app.component.ts:147-151`. Tipo: transição.
5. **Período e unidade são obrigatórios em todo relatório.** Ex.: `paginas/valor_bruto/contas-a-receber/contas-a-receber.component.ts:93-95`. Tipo: validação. Exceção: títulos a receber e baixa de pagamento exigem só o período (`paginas/alterdata/titulos-a-receber/titulos-a-receber.component.ts:50-52`).
6. **A consulta roda sozinha quando o filtro fica válido.** `contas-a-receber.component.ts:100-108`. Tipo: transição. Não há botão de aplicar.
7. **Nos relatórios de mensalidade é preciso marcar ao menos um tipo de curso.** `paginas/mensalidade/mensalidade-quitada/mensalidade-quitada.component.ts:119-124`; mensagem `mensalidade-quitada.component.html:66-68`. Tipo: validação. Mensagem literal: "Por-favor selecione um filtro". Vale também para inadimplência, receita × recebido, informações de recebimento, mensalidade por aluno, Alterdata valor recebido e consulta de aluno.
8. **Tipos de curso enviados ao servidor.** `shared/services/utils.service.ts:22-38`. Tipo: formato. `graduação`→`GRADUAÇÃO`; `extensão`→`EXTENSÃO`; `técnico`→`GRADUAÇÃO TEC`; `pós-lato`→`PÓS LATO SENSU`; `pós-stricto`→`PÓS STRICTO SENSU`; unidos por vírgula.
9. **"PÓS" vira os dois tipos de pós.** `paginas/mensalidade/mensalidade.service.ts:14-20` (repetido em 5 serviços). Tipo: formato. `'PÓS'` → `'PÓS STRICTU SENSU, PÓS LATO SENSU'`. O formulário atual nunca envia `'PÓS'` (regra 8), então se este ramo ainda é alcançado: não confirmado.
10. **Modalidade tem três valores.** Templates, ex. `contas-a-receber.component.html:77-103`; padrão em `contas-a-receber.component.ts:94`. Tipo: enumeração. `EAD`, `PRESENCIAL`, `TODOS` (padrão).
11. **A lista de unidades depende da modalidade.** `shared/services/utils.service.ts:63-98`. Tipo: validação. Só entram unidades cujo `tipo` é a modalidade escolhida; com "TODOS" entram todas; sempre há a opção "TODOS"; rótulo `sigla` ou `sigla - tipo`; duplicadas por rótulo são removidas.
12. **A modalidade enviada pode vir da unidade.** Ex.: `paginas/inadimplente/inadimplente/inadimplente.component.ts:126-127`. Tipo: cálculo. `modalidade = unidade.tipo || modalidade do formulário`.
13. **Coluna Modalidade só existe quando o filtro é "TODOS".** `contas-a-receber.component.ts:110-128`; diálogos `dialog-faturamento/dialog.component.ts:39-43`. Tipo: formato.
14. **Resultado é agrupado por mês em abas.** `contas-a-receber.component.ts:149-154`. Tipo: formato. Rótulo `MM-AAAA`, exibido como "MÊS/AAAA" em caixa alta (`shared/pipes/mes.pipe.ts:21-25`).
15. **Totais dos cartões de contas a receber somam todos os dias.** `contas-a-receber.component.ts:156-163`. Tipo: cálculo. Inclusive o saldo inicial e o final de cada dia, que são somados dia a dia.
16. **Totais do painel lateral usam o primeiro e o último dia para os saldos.** `contas-a-receber.component.ts:165-175`. Tipo: cálculo. Inicial = valor do primeiro registro; Final = valor do último; Faturamento, Baixa e Recebimento = soma. Os dois totais (regras 15 e 16) dão números diferentes para "Contas a Receber".
17. **Definições dos termos (texto dos tooltips).** `contas-a-receber.component.html:164,182,200,220,238`. Tipo: formato. Contas a Receber: "Saldo contratual acumulado até o dia anterior."; Faturamento: "Valor global dos contratos formalizados no dia, inclusive a novação de dívidas, a inclusão de novas disciplinas e qualquer outro evento que gere um aumento do valor do contrato ou um novo contrato."; Baixa contratual: "Cancelamento, transferencias, trancamento, exclusão de disciplinas e qualquer evento que possa reduzir o valor contratual no dia."; Recebimento: "Valor da mensalidade contratual recebida no dia, considerando todas as bolsas, descontos por antecipação e a multa e juros."; Contas a receber final: "Saldo contratual atualizado no dia."
18. **Clicar num dia abre os recebimentos daquele dia e daquela modalidade.** `contas-a-receber.component.ts:269-292`. Tipo: transição. O período do diálogo vira o próprio dia; a modalidade vira a da linha.
19. **Detalhe por aluno é paginado no servidor, 20 por página, e a pesquisa volta à primeira.** `dialog-faturamento/dialog.component.ts:49-52,61`. Tipo: limite.
20. **Contas a receber bruto exporta só Excel; o líquido não exporta.** `valor_bruto/.../contas-a-receber.component.ts:348`; `valor_liquido/.../contas-a-receber.component.ts:295`. Tipo: permissão.
21. **Fluxo de caixa projetado: Total = Recebimento − Bolsas de Estudo.** `paginas/valor_liquido/recebimento-por-modalidade/recebimento-por-modalidade.component.html:222,229`; `...component.ts:130-131`. Tipo: cálculo. Tooltip literal: "Resultado da equação: Recebimento – Bolsas de Estudo".
22. **No recebimento por modalidade bruto, "Contas a receber Final" repete o valor de Recebimento.** `paginas/valor_bruto/recebimento-por-modalidade/recebimento-por-modalidade.component.html:259,319`. Tipo: cálculo. As duas colunas leem `recebimentovalorbruto`; os tooltips dessa tela são os de contas a receber (se é intencional: não confirmado).
23. **Meios de pagamento reconhecidos.** `paginas/valor_bruto/recebimento-por-modalidade/recebimento-por-modalidade.component.ts:242-249`. Tipo: enumeração. `BANCO`, `DINHEIRO`, `CARTAO`, `CHEQUE`, `DEPOSITO`.
24. **Cobranças quitadas: total do aluno é a soma do valor recebido.** `mensalidade-quitada.component.ts:199-200`. Tipo: cálculo. Parcelas ordenadas por ano e mês; alunos contados uma vez por nome.
25. **Cobranças recebidas exigem escolher a data de referência.** `paginas/mensalidade/mensalidade-recebida/mensalidade-recebida.component.ts` (campo `filtro` obrigatório); template `:22-45`. Tipo: validação. Valores `pagamento` ("Data de pagamento") ou `credito` ("Data de crédito").
26. **Mensalidades em aberto consultam um único ano.** `paginas/mensalidade/mensalidade-em-aberto/mensalidade-em-aberto.component.ts` (`fixDates`). Tipo: limite. Se o período cruza anos, o início passa a ser janeiro do ano final (`'1/' + anoFinal`).
27. **Em aberto e inadimplência: total do aluno é a soma do valor líquido.** `paginas/inadimplente/inadimplente/inadimplente.component.ts:192-193`. Tipo: cálculo.
28. **Mensalidade adiantada separa por unidade quando há mais de uma.** `paginas/mensalidade/mensalidade-adiantada/mensalidade-adiantada.ts` (rótulo `curso - unidade` se `unidade.length > 1`). Tipo: formato.
29. **Receita diária classifica cada recebimento pela origem.** `paginas/receita/receitas-diarias/receitas-diarias.component.ts:129-167`. Tipo: cálculo. `DINHEIRO` e `CARTAO` → Tesouraria (e multa/juros de tesouraria); `CHEQUE` → Cheque pré; qualquer outra origem → coluna do banco (e multa/juros de banco); Total = soma de `valorrecebido` de todas as origens.
30. **Receita diária busca um mês por vez.** `receitas-diarias.component.ts:252-272`. Tipo: integração. Do 1º ao último dia do mês da aba, recortado pelo início e fim escolhidos.
31. **Arrecadação por caixa cruza curso × competência dentro do mês de pagamento.** `paginas/arrecadacao/arrecadacao-por-caixa/arrecadacao-por-caixa.component.ts:150-180`. Tipo: cálculo. Célula = soma de `valorrecebido`.
32. **Receita bancária não envia modalidade nem tipo de curso.** `paginas/receita/provisao.service.ts:86-94`. Tipo: integração. Só `datainicial`, `datafinal`, `unidade`, embora a tela mostre o filtro de modalidade.
33. **Receita bancária e informações de recebimento: o "valor total" é a soma do valor bruto.** `paginas/receita/receita-bancaria/receita-bancaria.component.ts:202-214`; `informacao-recebimento.component.ts:202-214`. Tipo: cálculo. Também somam valor líquido, juros, multa, bolsa e desconto.
34. **Exportação tem dois níveis.** `shared/components/modal/exports/exports.component.html:8,35`. Tipo: formato. "DADOS SINTÉTICOS" (o que está na tela, agrupado) e "DADOS ANALÍTICOS" (linha a linha), cada um em PDF e XLSX; opção indisponível aparece apagada.
35. **Situação da exportação no servidor.** `shared/components/modal/exports_backend/exports.component.ts:76-83`. Tipo: transição. `FINISHED`→"CONCLUIDO"; `STARTING`→"INICIANDO"; demais → "GERANDO... N %" (2 casas).
36. **Situação dos processos do Alterdata.** `paginas/alterdata/titulos-a-receber/titulos-a-receber.component.ts:38-42`. Tipo: transição. `STARTING`→"INICIANDO"; `RUNNING`→"EXECUTANDO..."; `FINISHED`→"ENCERRADO".
37. **A fila do Alterdata é recarregada a cada segundo.** `titulos-a-receber.component.ts:70-85`. Tipo: prazo. Intervalo de 1000 ms; para ao primeiro erro.
38. **Exportação para o Alterdata é por competência.** `paginas/alterdata/alterdata.service.ts:130-143,157-170`. Tipo: integração. Parâmetros `ano` e `mes`.
39. **Paginação das listas planas.** `paginas/alterdata/valorrecebido/valorrecebido.component.ts:38,82-89`; `paginas/academico/aluno/aluno.component.ts:71,102-104`. Tipo: limite. Opções 5, 10, 20, 50; padrão 10.
40. **Classificação de curso por lista fixa.** `shared/pipes/curso-filter.pipe.ts:8-39`. Tipo: enumeração. 9 cursos de graduação, 2 de extensão, 5 de pós lato e 3 de pós stricto escritos no código; o que não estiver na lista vira "OUTROS". Onde o pipe é aplicado: não confirmado (não achei uso nos templates lidos).
41. **Período mostrado no resumo.** `contas-a-receber.component.ts:215-230`. Tipo: formato. "MM/AAAA" ou "MM/AAAA a MM/AAAA".
42. **PDF sai em paisagem com rodapé numerado.** `shared/services/pdf.service.ts:31`; `shared/services/export.service.ts:248-253`. Tipo: formato. Rodapé "<arquivo> - <página> de <total>", fonte 7; cabeçalho com a logo; cobranças quitadas usa retrato (`mensalidade-quitada.component.ts:323`).
43. **Nomes de pessoa em formato de título.** `shared/pipes/nome.pipe.ts:5-15`. Tipo: formato. Mantém em minúsculas "da", "de", "do", "dos".
44. **Rótulos do paginador em português.** `shared/brasilian-paginator-intl.ts:3-30`. Tipo: formato. "Itens por página:", "Próxima página", "Página anterior", "a - b de n".

---

## 5. API consumida

Base `API_RESOURCE_SERVICE` (produção: marcador `DEPLOY_REL_CONTABILIDADE_BACKEND`, trocado no deploy), salvo indicação. Todas as chamadas são GET, exceto onde dito.

**Autenticação** (`core/services/auth/store/auth.effects.ts`, base `API_GERENCIAL` = `https://api-gerencial.ucam-campos.br`)
- `GET {API_GERENCIAL}/usuario/{oidusuario}`
- `GET {API_RESOURCE_SERVICE}/core/unidades?oidusuario=`
- `GET {API_GERENCIAL}/usuario/{oidusuario}/pessoa`
- (sem uso confirmado) `GET {API_GERENCIAL}/unidade/{oid}`; `GET {API_MENU}/menu-usuarios/search/all-menu-aplicacao-usuario?oidUsuario=&oidAplicacao=`; `GET {API_ACADEMICO}/aluno/search/cpf-nome-matricula?term=` com cabeçalho `Unidade-Ref`.

**Contas a receber e recebimento por modalidade** (`contas-a-receber.service.ts`, `recebimento-por-modalidade.service.ts`). Parâmetros comuns: `pesquisa`, `initial_year`, `initial_month`, `initial_day`, `final_year`, `final_month`, `final_day`, `modalidade`, `oidunidade`, `page`, `size`.
- `/contabeisareceber/search/byDateAndModalidade` → `_embedded.contabeisareceber[]`
- `/contabeisareceber/search/totalByDateAndModalidade`
- `/faturamento/search/byDateAndModalidade`, `.../byDateAndModalidadePaged` → `_embedded.faturamentos[]`, `page`; `.../totalByDateAndModalidade` → `totalfaturamento` / `totalfaturamentoliquido`
- `/baixacontratual/search/byDateAndModalidade`, `.../byDateAndModalidadePaged` → `_embedded.baixascontratuais[]`; `.../totalByDateAndModalidade` → `totalbaixacontratual`
- `/contabeisrecebimento/search/byDateAndModalidade`, `.../byDateAndModalidadePaged` → `_embedded.contabeisrecebimento[]`; `.../byDateAndModalidadeGroupByDay`; `.../totalByDateAndModalidade` → `totalrecebimentovalorbruto`, `totalvalorbolsa`, `totalvalordesconto`, `totalvalormultajuros`, `totalvalorpago`

**Mensalidade** (`paginas/mensalidade/mensalidade.service.ts`)
- `/mensalidadequitada` (`anomesinicial`, `anomesfinal`, `unidade`, `modalidade`, `nomecurso`, `tipo`)
- `/mensalidaderecebida` (`datainicial`, `datafinal`, `unidade`, `modalidade`, `nomecurso`, `tipo`, `filtro`)
- `/mensalidadeadiantada` (como quitada)
- `/mensalidadeemaberto` (`ano`, `mesinicio`, `mesfim`, `unidade`, `modalidade`, `nomecurso`, `tipo`); `/mensalidadeemaberto/exportar`; `/mensalidadeemaberto/relatorios`; `/mensalidadeemaberto/exportar/pdf?report=`; `/mensalidadeemaberto/exportar/xlsx?report=`
- `/mensalidadeporaluno` (`datainicio`, `datafim`, `unidade`, `modalidade`, `filtro`)

**Inadimplência e arrecadação**
- `/inadimplente` (`inicio`, `fim`, `unidade`, `modalidade`, `nomecurso`, `tipo`)
- `/arrecadacaoporcaixa` (`datainicial`, `datafinal`, `unidade`, `modalidade`, `nomecurso`)

**Provisão** (`paginas/receita/provisao.service.ts`, `receitas-diarias.service.ts`)
- `/receitarecebido/grouped` e `/receitarecebido` (`anoinicial`, `anofinal`, `mesinicial`, `mesfinal`, `oidunidade`, `modalidade`, `nomecurso`, `tipocurso`, opcionais `mes`, `ano`); `/receitarecebido/exportar`; `/receitarecebido/relatorios`; `/receitarecebido/exportar/pdf|xlsx?report=`
- `/receitabancaria` (`datainicial`, `datafinal`, `unidade`)
- `/informacaorecebimento` (`inicio`, `fim`, `unidade`, `modalidade`, `tipo`)
- `/receitadiaria/grouped` e `/receitadiaria` (`datainicial`, `datafinal`, `oidunidade`, `modalidade`, `nomecurso`, `filtro`, opcionais `mes`, `ano`); `/receitadiaria/exportar`; `/receitadiaria/relatorios` (GET e DELETE `?report=`); `/receitadiaria/exportar/pdf|xlsx?report=`

**Alterdata** (`paginas/alterdata/alterdata.service.ts`)
- `/exportacao/alterdata/valorrecebido` (`datainicial`, `datafinal`, `unidade`, `modalidade`, `nomecurso`, `tipo`, `page`, `size`) → `content[]`, `totalElements`; `.../exportar`; `.../relatorios` (GET e DELETE); `.../exportar/pdf|xlsx?report=`
- Base `API_INTEGRACAO_ALTERDATA` (`https://integracao-bimer.ucam-campos.br`): `GET /alterdata/bimer/titulo-a-receber?ano=&mes=`; `GET /alterdata/bimer/titulo-a-receber/listar`; `GET /alterdata/bimer/baixa-de-pagamento?ano=&mes=`; `GET /alterdata/bimer/baixa-de-pagamento/listar`; `POST /authenticate` (credenciais fixas no código, `alterdata.service.ts:184-191`; sem chamada confirmada).

**Acadêmico** (`paginas/academico/academico.service.ts`)
- `/aluno` (`pesquisa`, `inicio`, `fim`, `unidade`, `modalidade`, `filtro`, `size`, `page`) → `content[]`, `totalElements`; `/aluno/size`; `/aluno/detailed?cpf=&matricula=`; `/aluno/exportar`; `/aluno/relatorios` (GET e DELETE); `/aluno/exportar/pdf|xlsx?report=`

**Websocket STOMP** (`rx-stomp.config.ts:6-9`): `{API_RESOURCE_SERVICE}/socket/websocket` (http→ws), login `guest`/`guest`, reconexão a cada 5 s; filas `/queue/ReceitaRecebido`, `/queue/ValorRecebido`, `/queue/relatorio_aluno`.

**Modelos** (o front quase não tipa as respostas; os campos abaixo são os lidos nos templates)
- `Unidade` (`shared/models/unidade.model.ts`): `oid`, `sigla`, `razaosocial`, `tipo`, `datasource`. Na sessão as unidades trazem também `oidUnidade`.
- `UsuarioLogado`: `oid`, `oidpessoa`, `nome`, `email`, `foto`, `token`.
- `RelatorioExporter`: `TITULO`, `COLUMNS[{NAME, FORMAT (STRING|DATE|CURRENCY), PROPERTY, ORDER?}]`, `DATA[]`, `STYLE{fontSize}`.
- Conta a receber (dia): `datapagamento`, `modalidadecurso`, `valorcontareceberinicialbruto|liquido`, `valorfaturamento`, `valorbolsaconcedida`, `valorbaixacontratualbruto|liquido`, `valorrecebimentobruto|liquido`, `valorcontaareceberfinalbruto|liquido`.
- Recebimento (aluno): `nome`, `matricula`, `nomecurso`, `modalidadecurso`, `modalidadepagamento`, `tipocobranca`, `recebimentovalorbruto`, `recebimentovalorliquido`, `valorbolsa`, `valordesconto`, `valormultajuros`, `valoracrescimo`, `recebimentodiferenca`, `valorpago`.
- Mensalidade: `nomealuno`, `matriculaaluno`, `nomecurso`, `nomeunidade`, `modalidade`, `tipo`, `tipocurso`, `tipocobranca`, `mes`, `ano`, `periodo`, `datavencimento`, `datapagamento`, `databaixa`, `valorbruto`, `valorliquido`, `valorrecebido`, `valordescontoantecipacao`, `valorrepassepolos`, `banco`, `agencia`, `conta`, `nossonumero`.
- Receita × recebido (curso/mês): `nomecurso`, `nomeunidade`, `modalidade`, `tipocurso`, `mes`, `ano`, `alunos`, `valorbruto`, `bolsa`, `acrescimo`, `desconto`, `valorliquido`, `valordescontoantecipacao`, `multa_juros`/`multajuros`, `valorrecebido`, `valorareceber`.
- Receita diária: `datapagamento`, `origempagamento`, `banco`, `valorrecebido`, `multajuros`.
- Título Alterdata: `idareceber`, `codempresa`, `codpessoa`, `numerotitulo`, `nometitulo`, `dataemissao`, `datavencimento`, `centrocusto`, `valortitulo`, `naturezalancamento`, `formapagamento`.
- Processo Alterdata: `processName`, `status`, `percentageComplete`.
- Aluno: `matricula`, `nome`, `cpf`, `curso`, `modalidade`, `competencia`, `situacao`, `pendencia`, `bolsa`, `bolsapercentual`, `valorbolsa`, `valorpercentualbolsa`.
- Exportação no servidor: `name` (JSON com `datainicial`, `datafinal`, `unidade`, `modalidade`, `filtro`, `pesquisa`), `titulo`, `lastMessage{status, percentageComplete}`.

---

## 6. O que o código não responde

1. Quem pode ver cada relatório? O front libera todos os 19 a qualquer usuário autenticado. Decide: controladoria / gestão financeira, com quem administra perfis no Gerencial.
2. O menu em produção lista quais relatórios? 8 dos 19 não estão no menu escrito no código e o menu nem é passado à moldura. Decide: responsável pelo produto SigFin; confirma: equipe que mantém a lib `default-style`.
3. Qual total de "Contas a Receber" é o correto: a soma de todos os dias (cartões) ou o saldo do primeiro e do último dia (painel lateral)? Decide: contabilidade.
4. A unidade escolhida na moldura deveria restringir os relatórios? Hoje são dois controles independentes. Decide: gestão financeira + responsável pelo produto.
5. "Contas a receber Final" no relatório por modalidade bruto deveria mostrar o valor líquido? Hoje repete o bruto. Decide: contabilidade.
6. Por que contas a receber líquido e fluxo de caixa projetado não exportam? Desligado de propósito ou inacabado? Decide: responsável pelo produto.
7. Qual a diferença de uso entre "sintético" e "analítico" para quem recebe o arquivo, e quais relatórios precisam dos dois? Decide: controladoria.
8. Quando a exportação deve ser no servidor (fila) e quando no navegador? Há um limite de volume? Decide: equipe de desenvolvimento, com a controladoria.
9. "Data de pagamento" × "Data de crédito": qual é o padrão contábil e por que só dois relatórios deixam escolher? Decide: contabilidade / tesouraria.
10. Mensalidades em aberto só aceitam um ano: é regra de negócio ou limitação do serviço? Decide: contabilidade.
11. A exportação para o Alterdata pode ser refeita para a mesma competência? O que acontece com títulos já enviados? Decide: contabilidade, com quem administra o Alterdata/Bimer.
12. A lista fixa de cursos por tipo (`cursoFilter`) ainda vale? Decide: secretaria acadêmica.
13. O filtro "Técnico" (família bruto/líquido) e a pós dividida em lato e stricto (demais telas) deveriam ser a mesma lista em todos os relatórios? Decide: gestão acadêmica + controladoria.
14. Ordenar por coluna foi descartado ("quebra a consistência de dados"): ainda vale no redesenho? Decide: controladoria.
