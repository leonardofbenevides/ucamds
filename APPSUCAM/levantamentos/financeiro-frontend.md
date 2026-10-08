# Levantamento do financeiro-frontend (06/10/2026)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\financeiro-frontend`. Referências relativas a `src/app/`. Angular 18.1, standalone, NgRx, Angular Material 18.2, lib `@universidade-candido-mendes/ucam-design-system ^18.2.2` (o README cita 18.2.2). Produção: `financeiro.ucam.edu.br`; API `https://api-financeiro2.candidomendes.edu.br`. O README descreve o sistema, mas cita "Dashboard — métricas e relatórios em tempo real" que o código não tem, e um `environment.prod.ts` que não existe.

## 1. Rotas e telas

| URL | Componente | Template | Guard |
|---|---|---|---|
| `login/:token/:usuario` | `LoadComponent` | `shared/component/load/load.component.html` | nenhum |
| `principia/baixa` | `LiquidaMensalidadeComponent` | `private/principia/liquida-mensalidade/liquida-mensalidade.component.html` | `AuthGuard` |
| `principia/envio` | `EnviaMensalidadeComponent` | `private/principia/envia-mensalidade/envia-mensalidade.component.html` | `AuthGuard` |
| `principia/atualizacao-vencimentos` | `AtualizaVencimentosLoteComponent` | `private/principia/atualiza-vencimentos-lote/atualiza-vencimentos-lote.component.html` | `AuthGuard` |
| `principia/envio-sicoob-lote` | `EnvioSicoobLoteComponent` | `private/principia/envio-sicoob-lote/envio-sicoob-lote.component.html` | `AuthGuard` |
| `principia/sincronizar-pendentes` | `PrincipiaSincronizacaoPendentesComponent` | `private/principia/principia-sincronizacao-pendentes/principia-sincronizacao-pendentes.component.html` | `AuthGuard` |
| `mensalidade/calcular/lote` | `CalculoMensalidadeLoteComponent` | `private/mensalidade/lote/calculo/calculo-mensalidade-lote.component.html` | `AuthGuard` |
| `**` | redireciona para `principia/baixa` | — | `AuthGuard` |

Rota `dashboard` está comentada (`app.routes.ts:19-23`). `private/dashboard/` é a cópia intacta do template — **nao-migrar**.

**Baixar mensalidade** (`principia/baixa`). Propósito: listar títulos a receber vindos da Principia num intervalo de datas e mandar os selecionados para baixa. Arquétipo: listagem com filtros e ação em lote.
- Filtros: `cpf` (máscara), `dataInicial`, `dataFinal` (`ucam-calendar`), `pago` (Estado: Todos / Pago / Não Pago), `modalidade` (Todos / EAD / Presencial); botão "Pesquisar".
- Colunas: seleção (caixa de três estados no cabeçalho + caixa + avatar), Nome (`responsavel_financeiro_nome` + "CPF: …"), Estado (ícone + Pago/Pendente), Unidade/Polo (`parcela_original_polo_campus`), Valor (`valor_principal`), Vencimento, Valor pago (`valor_recebido`), Pagamento. Cabeçalhos clicáveis ordenam no cliente (ícones `swap_vert`/`arrow_upward`/`arrow_downward`).
- Peças: `mat-table`, `mat-paginator` com diretiva `ucamPaginator` (página em botões numerados), toast próprio, botão "Baixar mensalidades".
- Classificação: **parcial** — padrão `listagem-crud`, base `sigfin/movimento-caixa`. Peças: `data-table` com seleção e ação em lote, `date-field`, `select`, `badge`, `pagination`. Falta: intervalo de datas como um campo só e a caixa de três estados no cabeçalho (não confirmado se o `data-table` já cobre).

**Enviar mensalidade** (`principia/envio`). Propósito: listar as mensalidades de um mês agrupadas por unidade e curso e enviá-las à Principia. Arquétipo: listagem agrupada em dois níveis com ação em lote e acompanhamento de fila.
- Filtros: `cpf`, `month` (calendário de mês), `state` (Novo / Alterado / Estornado), `modalidade`, `unidade` (seleção múltipla); "Pesquisar".
- Estrutura: `<details>` por unidade "{unidade} (n)" › `<details>` por curso "{curso} (n)" com caixa de três estados e botão `add_circle`/`remove_circle` › `mat-table`.
- Colunas: seleção + avatar, Nome (`nomeAluno` + CPF), Curso, Estado (`state`), Status (ícone + texto; `ENVIADA` em destaque), Unidade/Polo (`nomePolo`), Valor (`valorBoleto`), Vencimento.
- `ucam-notification-wrapper stream="ENVIAR-PRINCIPIA"`: painel flutuante com filas em andamento.
- Classificação: **parcial** — `listagem-crud`, base `sigfin/movimento-caixa`. Falta: tabela agrupada em níveis recolhíveis com seleção por grupo, seletor de mês (competência) e painel de processos em segundo plano.

**Calcular mensalidade (lote)** (`mensalidade/calcular/lote`). Propósito: calcular as mensalidades do mês por curso, conferir aluno a aluno e salvar. Arquétipo: listagem mestre-detalhe expansível com ação em lote e fila de processos.
- Filtros: `search` ("Pesquise por nome, CPF ou matrícula", com lista de sugestões), `month`, `modalidade`, `unidade` (múltipla), interruptores `formandos` (Incluir formandos), `bolsas` (Incluir alunos sem bolsa), `novos` (Incluir apenas não calculados); botão "Calcular".
- Tabela de cursos (HTML puro): seleção, Curso, Unidade, Modalidade, Quantidade ("n mensalidades"), Valor total, expandir. Linha expandida: seleção, avatar com inicial, Aluno (+ CPF), Matrícula, Valor, Data de vencimento. Rodapé "VALOR TOTAL SELECIONADO:".
- Cartão "Processos — Lista de processos em execução": ícone de estado, nome, barra de progresso "n de total", mensagem; interruptor "Exibir finalizados".
- Botão "Salvar mensalidades".
- Classificação: **parcial** — base `sigfin/calculo-mensalidade` (que é o cálculo individual, padrão formulário) e `listagem-crud`. Falta: tabela com linha expansível e subtabela, total do selecionado no rodapé e lista de processos com `progress`.

**Diálogo "Detalhes da Mensalidade"** (`app-mensalidade-dialog`, modal próprio, 600px). Propósito: mostrar como o valor líquido foi formado e, no cálculo individual, ajustar valor e vencimento. Peças: cabeçalho em degradê com ícone e fechar; blocos "Informações do Aluno" (Nome, Matrícula, Curso, Unidade), "Informações do Período" (Mês/Ano, Periodo n/total, Qtd. Disciplinas, Valor por Disciplina), "Informações Adicionais" (Data de Vencimento, Valor — só no individual); tabela "Detalhamento Financeiro" (Descrição, Valor): VALOR BRUTO, acréscimos (+), descontos (−), BOLSA (n%), Valor Líquido. Classificação: **parcial** — `dialog`/`drawer` + `description-list`; falta a peça de demonstrativo de valores (linhas somadas e subtraídas com total).

**Data de Vencimento** (`principia/atualizacao-vencimentos`). Propósito: alterar em lote as datas de vencimento dos planos de pagamento de uma competência. Arquétipo: listagem com edição em lote e processo assíncrono.
- Filtros: `competencia` (Mês/Ano), `tipoCurso` (Graduação / Extensão), `modalidade` (Presencial / EAD / Ambos), `unidades` (múltipla); "Pesquisar".
- Edição em lote (aparece com resultado): `dataprevencimento` (Data Pré-pagamento), `dataantecipacao` (Data pagamento antecipado); botão "Alterar Todos" / "Processando...".
- Barra: busca "Pesquisar..." e "Ordenar:" (Mais recente / Mais antigo / Curso (A-Z)).
- Tabela "Planos de pagamento": seleção, Curso (inicial + "curso - unidade"), Data do Pré-Pagamento, Data do Pós-Pagamento, Data Pagamento antecipado; cabeçalhos ordenáveis; `mat-paginator` 20/50/100.
- Progresso: "Processando x de y registros (z%). Aguarde."; painel "Processando dados (n itens)"; modal de retorno (Concluido / Erro) com "OK".
- Classificação: **parcial** — `listagem-crud`, base `isencao/matrizes` ou `sigfin/movimento-caixa`. Falta: padrão de edição em lote (um valor aplicado a todas as linhas marcadas) e acompanhamento de processo assíncrono.

**Envio Sicoob** (`principia/envio-sicoob-lote`). Propósito: subir uma planilha de pagamentos, conferir CPF/CNPJ linha a linha e disparar os pagamentos pelo Sicoob. Arquétipo: importação de planilha com conferência e envio assíncrono.
- Peças: `input type=file` `.xlsx` com "Escolher arquivo" e "Carregar Planilha"; metadados (Lote, CNPJ Pagador, mTLS configurado); mensagens de erro e informação em linha; busca; barra de progresso; `mat-table` com colunas **vindas da planilha** + "Status Processamento" (selo); célula de CPF/CNPJ editável com ✓/X; `mat-paginator` + `ucamPaginator` (20 por página); modal de retorno; modal "Detalhe do Erro — Linha n"; botão "Enviar Pagamentos".
- Classificação: **falta** — não há padrão de importação de arquivo com pré-visualização, validação por linha, correção na célula e envio. Peças que existem: `file-field`, `anexo`, `data-table`, `badge`, `progress`, `alert`, `dialog`.

**Sincronização Principia** (`principia/sincronizar-pendentes`). Propósito: descobrir quais mensalidades de uma competência não chegaram à Principia e reenviar as aptas. Arquétipo: conciliação em duas fases (consulta assíncrona, depois reenvio em lote).
- Filtros: `cpf`, `competencia`, `modalidade` (Todas / Presencial / EAD / Semipresencial), `unidades` (múltipla); "Pesquisar" / "Pesquisando...".
- Colunas: seleção, Status (selo), Aluno, CPF, Matrícula, Competência, Vencimento, Valor, Unidade, Curso, Status portal, Último envio, Mensagem (com ícone de detalhe).
- Peças: aviso de unidades vazias; faixa "Consultando Principia — Verificando x de y mensalidade(s)…"; busca local; barra de progresso; modal de retorno; modal "Detalhe do Erro — {aluno}"; botão "Sincronizar (n)". Sem paginação.
- Classificação: **parcial** — `listagem-crud` com ação em lote, base `gerencial/auditoria` (tabela larga de log) ou `relatorios/resultado`. Falta: acompanhamento de consulta longa com resultado parcial e linha não selecionável com motivo.

## 2. Moldura e navegação

- `<ucam-page>` da lib em todas as telas; nenhuma projeta conteúdo na faixa.
- Menu fixo (`app.component.ts:23-64`), `AppConfig({title: "Financeiro"})`: Baixar Mensalidades (`payments`), Enviar Mensalidades (`price_check`), Calcular mensalidades (`currency_exchange`), Atualiza Vencimentos (Lote) (`edit_calendar`), Envio Sicoob (`upload_file`), Sincronização Principia (`sync`). O item Dashboard está comentado.
- Conta: `setProfile(UcamUserProfile{username, email})` — sem `unidade`/`unidades` (`shared/service/user.service.ts:34-39`).
- Troca de unidade: as telas registram `ChangeUnidadeListener`, mas só fazem `console.warn`; a unidade ativa não filtra nada. O interceptor manda `Oidunidade` do `AuthState`; a tela de vencimentos manda `oidunidade: unid01` fixo.
- Sair: nenhum `ExitListener` registrado — o botão "Sair" da lib não tem efeito neste app (não confirmado na versão instalada).
- Login: igual ao template (`login/:token/:usuario` → `LoadComponent`); arquivos de autenticação idênticos aos do template.
- Interceptor `jwtInterceptor` (`core/interceptors/jwt.interceptor.ts`): `Authorization`, `Oidusuario`, `Oidunidade`, `Content-Type: application/json`.

## 3. Peças usadas com contagem

**Da lib do time (`^18.2.2`)**

| Peça | Usos | Props |
|---|---|---|
| `ucam-page` | 7 | nenhuma |
| `ucam-input` | 3 | `label="CPF"`, `mask="000.000.000-00"`, `placeholder`, `type="text"`, `formControlName` |
| `ucam-select` | 2 (só na baixa) | `label`, `[options]`, `formControlName` |
| `UcamOption` | 6 arquivos | `{id, label, value}` |
| `UcamDesignSystemService` | 2 | `setProfile`, `setMenuConfig` |
| `ChangeUnidadeListener` | 4 | `addListener` (só registra) |

**Próprios com prefixo `ucam-` (não são da lib)**: `ucam-multiselect` (`shared/component/select`, 11 usos; `[options]`, `formControlName`/`[formControl]`, `[placeholder]`, `type="multiselect"`, `emptyMessage`, `search`); `ucam-calendar` (`shared/component/calendar`, 9 usos; `[type]` = `month` | `date`, `formControlName`, `[(ngModel)]`); `ucam-notification-wrapper` / `ucam-notification` (1; `stream`); `ucam-toast-wrapper` / `ucam-toast` (via `ToastService.alert/error`, duração padrão 5 s); diretiva `ucamPaginator` (2); `app-mensalidade-dialog` (1); `input ucam` 13 (texto, número, caixa, interruptor); `span checkbox` de três estados (2); `CpfPipe`.

O clone `lib-ucam-workspace` (22.2.0) já exporta `ucam-calendar` e `ucam-multiselect`; se a 18.2.2 também os tinha é não confirmado — o app importa as cópias locais.

**Angular Material direto**: `mat-table` 5 / 38 `matColumnDef`; `mat-paginator` 3; `mat-flat-button` 18, `mat-icon-button` 2, `mat-stroked-button` 1; `mat-icon` 14. **Sem `MatDialog`**: todos os modais são `div` com `*ngIf` e backdrop próprio. Tabelas HTML puras: 4 (`data-table`, `students-list`, `financial-table`).

**O que a lib não oferece e o app resolve**: tabela, paginação, botão, ícone (Material); modal, toast, painel de processos, barra de progresso, selo de status, calendário de mês, seleção múltipla, upload, agrupamento recolhível (próprios).

**Bibliotecas**: `@angular/*` 18.1, Material/CDK 18.2.6, NgRx 18.1, `rxjs` 7.8. Sem biblioteca de gráfico, de planilha ou de máscara (a planilha é lida no servidor). `EventSource` nativo para SSE. Classes `fa fa-*` aparecem no template sem Font Awesome declarado (não confirmado de onde vem).

## 4. Regras de negócio lidas no código

| # | Regra | Onde | Tipo | Valores |
|---|---|---|---|---|
| 1 | Sessão abre por token na URL, com consulta à API gerencial | `shared/component/load/load.component.ts:45-55`; `core/services/auth/store/auth.effects.ts:20-95` | integração | `Unidade-Ref: unid01` |
| 2 | Unidade ativa inicial é a primeira do usuário | `auth.effects.ts:57,73-74` | permissão | — |
| 3 | Sem sessão, vai para o portal de login | `core/services/auth/auth-guard.service.ts:28-30` | permissão | `LOGIN_URL` |
| 4 | Toda chamada com sessão leva token, usuário e unidade | `core/interceptors/jwt.interceptor.ts:8-16` | integração | `Authorization`, `Oidusuario`, `Oidunidade` |
| 5 | Menu igual para todo usuário; tela inicial é a baixa | `app.component.ts:23-64`; `app.routes.ts:54-57` | permissão | 6 itens fixos |
| 6 | Baixa: período padrão é hoje a hoje | `private/principia/liquida-mensalidade/liquida-mensalidade.component.ts:64-68` | prazo | `new Date()` |
| 7 | Baixa: filtros de estado e modalidade | `liquida-mensalidade.component.ts:84-112` | formato | Estado: Todos (`null`), Pago (`paid`), Não Pago (`not_paid`); Modalidade: Todos, `ead`, `presencial` |
| 8 | Baixa: 100 títulos por página, paginados no servidor | `liquida-mensalidade.component.ts:41-50` | limite | 100 |
| 9 | Título é "Pago" quando `paid`; senão "Pendente"; a data de pagamento só aparece se pago | `liquida-mensalidade.component.html:80-81,128` | transição de situação | — |
| 10 | Baixar exige ao menos um título marcado | `liquida-mensalidade.component.html:6` | validação | — |
| 11 | A baixa é uma fila: os títulos são "alocados para baixa" e a lista recarrega | `liquida-mensalidade.component.ts:236-287` | transição de situação | "Buscando mensalidades."; "Alocando N mensalidade(s) para baixa."; "N mensalidade(s) alocadas para baixa." |
| 12 | Erro na baixa mostra a mensagem do servidor e desmarca tudo | `liquida-mensalidade.component.ts:264-272` | integração | toast de erro "Mensalidade" |
| 13 | CPF é enviado só com dígitos | `liquida-mensalidade.component.ts:192,241` | formato | `replace(/\D/g,'')` |
| 14 | Envio: estados da mensalidade | `private/principia/envia-mensalidade/envia-mensalidade.component.ts:74-105` | transição de situação | `novo` (padrão), `alterado`, `estornado` |
| 15 | EAD e Semipresencial contam como "ead" ao filtrar unidades | `shared/service/unidade.service.ts:39-44` | cálculo | `['EAD','SEMIPRESENCIAL']` → `ead`; demais `presencial` |
| 16 | Envio é por competência (ano e mês) | `shared/service/financeiro.service.ts:41-55` | formato | `ano`, `mes`, `cpf`, `unidades`, `state` |
| 17 | Mensalidades aparecem agrupadas por unidade e curso, com contagem | `envia-mensalidade.component.ts:333-350`; `.html:58-65` | cálculo | — |
| 18 | Mensalidade já enviada é destacada | `envia-mensalidade.component.html:73,110-113` | transição de situação | `status === 'ENVIADA'` |
| 19 | Enviar exige ao menos uma marcada; avisa antes e depois | `envia-mensalidade.component.html:6`; `.ts:282-329` | validação | "Enviando N mensalidade(s)."; "N mensalidades enviadas com sucesso." |
| 20 | Fila de envio acompanhada em tempo real | `envia-mensalidade.component.html:194` | integração | SSE `ENVIAR-PRINCIPIA` |
| 21 | Cálculo: opções padrão | `private/mensalidade/lote/calculo/calculo-mensalidade-lote.component.ts:55-63` | formato | `formandos` ligado; `bolsas` e `novos` desligados |
| 22 | Busca de aluno sugere após 0,5 s e, ao escolher, fixa modalidade e unidade | `calculo-mensalidade-lote.component.ts:157-180` | prazo | 500 ms; opção `matricula - nome` / `unidade - curso` |
| 23 | Curso só pode ser calculado se tiver data de vencimento cadastrada para o mês | `calculo-mensalidade-lote.component.ts:292-299`; `.html:128-131` | validação | `datasVencimento` contém `MM_AAAA`; "Não há data de vencimento do curso para o mês selecionado." |
| 24 | Todas as mensalidades calculadas vêm marcadas | `calculo-mensalidade-lote.component.ts:224` | formato | — |
| 25 | Total selecionado soma o valor líquido das mensalidades marcadas dos cursos marcados | `calculo-mensalidade-lote.component.ts:301-304` | cálculo | `valorLiquido` |
| 26 | Salvar exige curso marcado e nenhum salvamento em curso | `calculo-mensalidade-lote.component.html:9`; `.ts:242-265` | validação | — |
| 27 | Mensagens de estado da lista | `calculo-mensalidade-lote.component.ts:52-53,132,140,154,227` | formato | "Não foi realizada uma pesquisa ainda."; "Clique no botão calcular para atualizar os dados."; "Selecione uma unidade."; "Nenhuma mensalidade foi encontrada para o filtro selecionado."; "Aguarde um momento enquanto carregamos os dados." |
| 28 | Processos de cálculo têm quatro situações | `shared/models/aluno-curso.projection.ts:49-81`; `calculo-mensalidade-lote.component.ts:306-321` | transição de situação | `STARTED`, `RUNNING`, `COMPLETED`, `ENDED`; "O processamento está em fila"; finalizados ocultos por padrão |
| 29 | Processo some da lista após 5 horas sem novidade; encerrado some em meio segundo | `aluno-curso.projection.ts:85,90,127-129` | prazo | 5 h; 500 ms |
| 30 | Fila de cálculo e mensagem de carregamento chegam em tempo real | `calculo-mensalidade-lote.component.ts:182-208` | integração | SSE `CALCULO_MENSALIDADE` e sala do usuário (`usuario.oid`) |
| 31 | Formação do valor: bruto + acréscimos fixos − descontos fixos; depois acréscimos percentuais e descontos percentuais em cascata; por fim a bolsa, percentual ou em valor | `mensalidade-dialog/mensalidade-dialog.component.ts:258-340` | cálculo | cada percentual incide sobre o acumulado até ele |
| 32 | No cálculo individual pode-se trocar valor e vencimento; trocar o valor zera acréscimos, descontos e bolsa | `mensalidade-dialog.component.ts:342-352`; `.html:67-87`; `calculo-mensalidade-lote.component.ts:323-325` | cálculo | `confirm`: "Ao alterar o valor, todos os valores serão alterados. Deseja continuar?" |
| 33 | Vencimentos: tipos de curso e modalidades | `private/principia/atualiza-vencimentos-lote/atualiza-vencimentos-lote.component.ts:61-69,102-107` | formato | `A` Graduação (padrão), `E` Extensão; `PRESENCIAL`, `EAD`, `AMBOS` (padrão) |
| 34 | Pesquisar vencimentos exige competência e ao menos uma unidade | `atualiza-vencimentos-lote.component.ts:311-320`; `.html:16` | validação | "Obrigatório."; sem unidade a pesquisa não sai e nada é dito |
| 35 | Todos os planos encontrados vêm marcados | `atualiza-vencimentos-lote.component.ts:341-347` | formato | — |
| 36 | Alterar exige as duas datas e ao menos um plano marcado | `atualiza-vencimentos-lote.component.ts:109-112,398-402` | validação | — |
| 37 | A data de pós-vencimento enviada é igual à de pré-pagamento | `atualiza-vencimentos-lote.component.ts:425-427` | cálculo | `dataPosVencimento = dataprevencimento` |
| 38 | A alteração roda em segundo plano e é consultada a cada 3 s | `atualiza-vencimentos-lote.component.ts:33-40,465-469` | prazo | 3000 ms; `PROCESSING`, `COMPLETED`, `FAILED` |
| 39 | Mensagens de retorno da alteração | `atualiza-vencimentos-lote.component.ts:444,460,485,498,507` | formato | "Concluido" / "Vencimentos atualizados com sucesso!"; "Erro" / "Ocorreu um erro ao processar os vencimentos."; "Erro ao processar vencimentos: {erro}"; "Nao foi possivel consultar o status do processamento." |
| 40 | Fila de vencimentos visível a todos, com nome decodificado | `atualiza-vencimentos-lote.component.ts:157-209` | integração | SSE `VENCIMENTOLOTE`; `VLOT|MMAAAA|P|E|…` → "MM/AAAA (PRESENCIAL|EAD|AMBOS)" |
| 41 | Vencimentos sempre consultados com a unidade de referência | `atualiza-vencimentos-lote.component.ts:211-217` | integração | `oidunidade: unid01` |
| 42 | Sicoob aceita só `.xlsx` | `private/principia/envio-sicoob-lote/envio-sicoob-lote.component.ts:125-142`; `.html:21` | formato | "Selecione um arquivo .xlsx válido."; "Selecione um arquivo .xlsx antes de enviar." |
| 43 | CPF (11 dígitos) e CNPJ (14) são validados pelos dígitos verificadores | `envio-sicoob-lote.component.ts:223-297` | validação | repetidos reprovam |
| 44 | Linhas com documento inválido sobem para o topo e podem ser corrigidas na célula | `envio-sicoob-lote.component.ts:213-221,515-526`; `.html:77-84` | validação | `maxlength="18"`; ✓ / X |
| 45 | Não se envia pagamento com qualquer documento inválido | `envio-sicoob-lote.component.ts:117-119,168-171`; `.html:42-44` | validação | "Foram encontrados N CPF/CNPJ inválido(s). Corrija antes de enviar." |
| 46 | As colunas são as da planilha; a de documento é reconhecida pelo nome | `envio-sicoob-lote.component.ts:80-83,237-244` | formato | `cpf`, `cpf/cnpj`, `cpfcnpj` → rótulo "CPF/CNPJ" |
| 47 | Linha conta como processada quando termina em Sucesso ou Erro | `envio-sicoob-lote.component.ts:496-498` | cálculo | `Sucesso`, `Erro` |
| 48 | Um lote em envio é lembrado no navegador e retomado ao voltar, inclusive em outra aba | `envio-sicoob-lote.component.ts:25,65-78,422-464` | integração | `localStorage['sicoob_lote_ativo']` |
| 49 | O envio é acompanhado linha a linha; se a conexão cair, o estado é buscado no lote | `envio-sicoob-lote.component.ts:299-377` | integração | "Processamento iniciado. Acompanhe o status por linha."; "Conexão de acompanhamento (SSE) interrompida[. Status atualizado pela consulta do lote.]" |
| 50 | Fim do envio | `envio-sicoob-lote.component.ts:379-391` | formato | "Processamento concluído" / "Lote processado com sucesso: X de Y registro(s) processado(s)." (mesmo havendo linhas com erro) |
| 51 | Detalhe só para linha com erro e mensagem; 20 linhas por página | `envio-sicoob-lote.component.ts:47,470-474` | limite | 20 |
| 52 | A tela mostra o CNPJ pagador e se o certificado mTLS está configurado | `envio-sicoob-lote.component.html:34-38` | integração | "Sim" / "Não" |
| 53 | Sincronização: competência obrigatória; modalidade padrão "Todas" | `private/principia/principia-sincronizacao-pendentes/principia-sincronizacao-pendentes.component.ts:40-62` | validação | `TODAS` = `EAD`, `PRESENCIAL`, `SEMIPRESENCIAL` |
| 54 | Não se pesquisa enquanto há pesquisa, sincronização ou carga de unidades em curso | `principia-sincronizacao-pendentes.component.ts:146-151` | validação | — |
| 55 | Só uma consulta à Principia por vez no sistema | `principia-sincronizacao-pendentes.component.ts:255-300` | limite | HTTP 202 esperado; 409 → "Já existe uma consulta em andamento. Aguarde a conclusão e pesquise novamente." |
| 56 | A consulta devolve resultado aos poucos | `principia-sincronizacao-pendentes.component.ts:445-520` | integração | SSE `PESQUISA-PRINCIPIA`; `PROGRESSO`, `PARCIAL`, `ERRO_FINAL`, `CONCLUIDO` |
| 57 | Mensalidade sem dados suficientes não pode ser reenviada | `principia-sincronizacao-pendentes.component.ts:760-790`; `.html:145` | permissão | `aptoReenvio === false` → status "Dados insuficientes", caixa desabilitada, mensagem = `motivoBloqueio`; apta → "Mensalidade não enviada", já marcada |
| 58 | Sincronizar exige ao menos uma apta marcada | `principia-sincronizacao-pendentes.component.ts:157-176,522-534` | validação | "Sincronizar Pendentes" / "Sincronizar (N)"; "Selecione ao menos um registro para sincronizar." |
| 59 | Tradução dos estados de envio | `principia-sincronizacao-pendentes.component.ts:42,962-978` | transição de situação | `SUCESSO` → Sucesso; `ERRO` → Erro; `AVISO` → Ignorado; `INFO` → Processando; padrão "Aguardando Sincronização" |
| 60 | Quatro desfechos da sincronização | `principia-sincronizacao-pendentes.component.ts:979-1027` | formato | "Nenhum envio necessário"; "Sincronização concluída com pendências" (`X de Y… N registro(s) com erro.`); "Sincronização concluída" (`X de Y mensalidade(s) enviada(s) para a Principia.`); "Sincronização encerrada" |
| 61 | Com todas as unidades marcadas, o filtro de unidade não é enviado | `principia-sincronizacao-pendentes.component.ts:671-687` | cálculo | — |
| 62 | Resumo da consulta | `principia-sincronizacao-pendentes.component.ts:360-392` | formato | "N registro(s) importado(s) do portal"; "N já existente(s) na Principia e marcado(s) no Analytics"; "N apta(s) para reenvio e N com dados insuficientes"; "Nenhum pendente encontrado para os filtros informados." |
| 63 | Só entram unidades de graduação com mensalidade | `principia-sincronizacao-pendentes.component.ts:66-67,707-715`; `unidade.service.ts:29-37` | permissão | "Não há unidades/polos de graduação com mensalidade para a modalidade selecionada." |
| 64 | Conexão de tempo real cai e volta em 3 s | `shared/service/sse.service.ts:5` | prazo | 3000 ms |
| 65 | Aviso (toast) dura 5 s por padrão; as telas usam 2 s | `shared/component/toaster/toast.service.ts:182-186`; `liquida-mensalidade.component.ts:196` | prazo | 5 s; 2 s |
| 66 | Consultas longas pedem 90 s de espera | `financeiro.service.ts:33`; `shared/service/mensalidade.service.ts:31` | prazo | `'90000'` num `HttpContextToken` criado na hora; efeito real não confirmado (nenhum interceptor o lê) |
| 67 | Moeda e datas em pt-BR | `app.config.ts:25-27` | formato | `LOCALE_ID` `pt`, `BRL` |

## 5. API consumida

Base `BACKEND` = `https://api-financeiro2.candidomendes.edu.br`.

**FinanceiroService** (`/v1/integrations/principia`): `GET /titulos-a-receber?dataInicial&dataFinal&page&size[&cpf][&modalidade][&pago]`; `POST /baixar-mensalidades` `{mensalidades[]}`; `GET /listar-mensalidades-aglutinada?ano&mes[&cpf][&unidades][&state]`; `POST /parcelas` `{parcelas[]}`; `POST /reconciliar?anoMes…` (sem uso nas telas — não confirmado); `GET /pendentes?anoMes[&modalidades][&unidades][&mensalidade][&cpf][&matricula][&consultarPrincipia]`; `POST /pendentes/consultar-async` `{anoMes, modalidades, unidades, cpf, syncId}`; `GET /pendentes/consulta-status`; `POST /sincronizar-pendentes` `{anoMes, …, syncId, registroIds[]}`.

**MensalidadeService** (`/v1/mensalidades`): `GET ?search&unidades&formandos&novos&bolsas&data&nonce`; `GET /completed?unidades&data` (sem uso); `POST ?data` (corpo: cursos marcados); `POST /save` (sem uso); `GET /search?search=`.

**UnidadeService** (`/v1/unidades`): `GET /all`; `GET /all-projection`; `GET /com-mensalidades?modalidades`.

**SicoobPagamentoService** (`/v1/sicoob/pagamentos`): `POST /upload` (multipart `file`); `GET /lotes/{loteId}`; `POST /lotes/{loteId}/enviar`.

**Vencimentos** (direto no componente, `/v1/vencimentos-lote`): `GET /cursos-planos?unidadesIds&mes&ano&tipoCurso&modalidade`; `POST /processar`; `GET /processar/status/{jobId}`.

**SSE**: `GET /v1/sse/stream/{sala}` — salas `ENVIAR-PRINCIPIA`, `CALCULO_MENSALIDADE`, `{oidUsuario}`, `VENCIMENTOLOTE`, `SINCRONIZAR-PRINCIPIA`, `PESQUISA-PRINCIPIA`, `{sseTopic do lote}`.

**Autenticação**: as mesmas três chamadas em `API_MENU` do template.

**Modelos**
- `Mensalidade` (título Principia): `id`, `categoria_parcela`, `parcela_original_id`, `parcela_original_id_externo`, `parcela_acordo_id`, `ies_id`, `responsavel_financeiro_id/cpf/nome`, `contrato_id`, `parcela_numero`, `data_vencimento`, `data_pagamento`, `data_liquidacao`, `valor_principal`, `valor_multa`, `valor_mora`, `valor_desconto`, `valor_recebido`, `forma_liquidacao`, `parcela_original_situacao`, `tipo_pagamento`, `parcela_original_polo_campus`, `grau`, `modalidade`, `paid`.
- `AlunoCurso`: `quantidadeAlunos`, `quantidadeCalculado`, `nomeCurso`, `nomeUnidade`, `oidUnidade`, `oidCurso`, `valorTotal`, `mensalidades[]`, `datasVencimento[]`.
- `Mensalidade` (cálculo): `oid`, `nomealuno`, `matricula`, `cpf`, `nomecurso`, `nomeunidade`, `date`, `dataVencimento`, `periodoatual`, `totalperiodo`, `quantidadeDisciplinas`, `valorPorDisciplina`, `valorBruto`, `valorBolsa`, `bolsaPercentual`, `valorLiquido`, `valor`, `acrescimosSimples[]`, `acrescimosPercentuais[]`, `descontosSimples[]`, `descontosPercentuais[]`.
- `UcamNotification` (fila): `id`, `nome`, `situacao`, `quantidade`, `total`, `message`.
- `CursoPlano`: `idPlanoGraduacao`, `unidade`, `curso`, `plano`, `origem`, `dataPre`, `dataPos`, `dataAntecipacao`.
- `SicoobPagamentoLote`: `loteId`, `sseTopic`, `columns[]`, `rows[{index, values{}, statusProcessamento, mensagem}]`, `processing`, `pagadorCnpj`, `mtlsConfigured`.
- `PrincipiaPendente`: `oid`, `oidmensalidade`, `nomeAluno`, `matriculaAluno`, `cpf`, `modalidade`, `nomeUnidade`, `nomeCurso`, `valor`, `competencia`, `dataVencimento`, `statusPortal`, `statusFila`, `observacaoFila`, `aptoReenvio`, `motivoBloqueio`, `statusSincronizacao`, `mensagemUltimaTentativa`, `origemDados`.
- Linha de envio (sem interface): `idParcela`, `nomeAluno`, `alunoCpf`, `nomeCurso`, `state`, `status`, `nomePolo`, `valorBoleto`, `dataVencimento`, `unidade`.

## 6. O que o código não responde

1. Quem pode baixar, enviar, calcular, alterar vencimento e pagar pelo Sicoob? Hoje todo usuário autenticado vê tudo. — gerência financeira com gestão de acessos.
2. O envio pelo Sicoob dispara pagamento real sem segunda aprovação. Há alçada, limite de valor ou dupla conferência? — gerência financeira / tesouraria.
3. "Alocar para baixa" é reversível? Quem confirma a baixa de fato e em quanto tempo? — contas a receber.
4. O que diferencia os estados Novo, Alterado e Estornado no envio, e o que acontece ao reenviar um Alterado? — contas a receber e time de integração.
5. A ordem de aplicação (acréscimos, descontos, bolsa) é a regra oficial ou só a exibição? Quem pode alterar o valor no cálculo individual e isso fica registrado? — controladoria.
6. Por que a data de pós-vencimento é igual à de pré-pagamento? O que é cada uma das três datas? — contas a receber.
7. O que torna uma mensalidade "com dados insuficientes" para reenvio, e quem corrige? — time de integração / secretaria.
8. A unidade ativa do usuário deveria restringir o que ele vê? Hoje não restringe. — gerência financeira.
9. Um lote com linhas em erro é "processado com sucesso"? Como se reprocessa só as que falharam? — tesouraria.
10. O Dashboard prometido no README existe em outro lugar? — dono do produto.

## Limites da leitura

- `node_modules` não existe em nenhum dos três clones. O interior da lib nas versões instaladas (`^0.0.31`, `^0.0.54`, `^18.2.2`) é **não confirmado**. O clone local `UCAM-repos\lib-ucam-workspace` está na versão `22.2.0` (um commit só, 01/10/2026) e serviu apenas de referência para nomes de props.
- Lidos por inteiro: todos os `.ts` não-spec e `.html` de `src/app` dos três repositórios, exceto `principia-sincronizacao-pendentes.component.ts` (1093 linhas), lido por assinaturas de método, condições e mensagens, e os serviços/componentes compartilhados do financeiro (`calendar`, `select`, `toast.service`, `notification.service`, `sse.service`, `server-sent-events.service`, `ucam-paginator.directive`), lidos por seletor, entradas e constantes. Os `.scss` não foram lidos, só consultados por seletor.
