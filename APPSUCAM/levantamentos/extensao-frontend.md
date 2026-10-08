# Inventário do front-end do Acadêmico Pós-Graduação / Extensão (Angular 5 + Materialize)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\extensao-frontend`. Todas as referências `arquivo:linha` abaixo são relativas a `...\extensao-frontend\src\app\` (ou a `src\environments\`, `src\` e à raiz quando indicado). Último commit lido: `fd6b66e` ("ajustes", 26/09/2026).

**Cobertura da leitura.** Li todos os 226 `.ts` não-spec e os 103 `.html` de `src/app` por meio de um despejo numerado (linha real preservada) do qual retirei só as linhas de `import`, as linhas em branco e as que continham apenas fechamento (`}`, `});`, `</div>`, `</td>`, `<tr>`). Isso vale para `app.module.ts`, os 32 `*.module.ts` de `paginas/`, `login/`, `sharedservices/`, `validators/`, `_model/` e todos os componentes e serviços de `paginas/`. Li também `README.md`, `package.json`, `.angular-cli.json`, `src/index.html`, o começo de `src/util.js` e os 7 `environment*.ts`. **Não li**: os 73 `.css` de componente, `src/styles.scss` (18 linhas) e `src/styles.css` (vazio), os 13 `.spec.ts`, `e2e/`, `Dockerfile`, `Jenkinsfile`, `kubernetes/`, `docker/`, `nginx-custom.conf`, `deploy.sh`. `node_modules` não foi consultado: o comportamento interno de `angular2-materialize`, `angular2-datatable` e `angular-tinymce` é **não confirmado**; só sei o que os templates usam. O README é o padrão do Angular CLI ("NovoApp") e não descreve o sistema. O nome do `package.json` é `novo-app`. Divergência com o enunciado da tarefa: contei **32** arquivos `*.module.ts` em `paginas/`, dos quais **30** declaram rotas (`pessoa.module.ts` e `topo-aluno.module.ts` não têm rota).

Título da página (`src/index.html:5`): "Módulo Acadêmico Pós-graduação / Extensão - Universidade Candido Mendes". Nome exibido na moldura: "Acadêmico - Pós-Graduação / Extensão" ou "Acadêmico - ITECAM" (`sharedservices/globals-variables.service.ts:13-18`).

---

## 1. Rotas e telas

Não há módulo lazy. `AppModule` importa os 30 módulos de tela (`app.module.ts:70-100`) e cada um registra a sua rota com `RouterModule.forChild`. O único guard é `AuthGuard` (`sharedservices/auth-guard.service.ts:12-19`), que pergunta ao serviço de login se o usuário tem o recurso `EXTENSAO-ANGULAR`; **não há checagem de perfil por rota no front** — quem decide o que o usuário vê é o menu devolvido pelo backend (seção 2).

São 46 entradas de rota: 5 em `app.module.ts` e 41 telas de negócio.

### 1.1 Tabela de rotas

| URL | Componente | Template (em `src/app/`) | Guard | Declarada em | Grupo |
|---|---|---|---|---|---|
| `''` → redireciona para `/home` | — | — | `AuthGuard` | `app.module.ts:48` | moldura |
| `home` | `HomeComponent` | `paginas/home-component/home.component.html` | `AuthGuard` | `app.module.ts:49` | moldura |
| `autocomplete` | `AutocompleteComponent` | `sharedservices/autocomplete/autocomplete.component.html` | **nenhum** | `app.module.ts:50` | nao-migrar |
| `login` | `LoginComponent` | `login/login.component.html` | nenhum | `app.module.ts:51` | moldura |
| `login/:token/:user` | `LoginComponent` | idem | nenhum | `app.module.ts:52` | moldura |
| `atividade_academica` | `AtividadeAcademicaComponent` | `paginas/cadastros-parametros/atividade-academica/atividade-academica.component.html` | `AuthGuard` | `paginas/cadastros-parametros/cadastros-parametros.module.ts:29` | G1 |
| `disciplina` | `DisciplinaComponent` | `paginas/cadastros-parametros/disciplina/disciplina.component.html` | `AuthGuard` | idem `:22` | G1 |
| `estabelecimento_ensino` | `EstabelecimentoEnsinoComponent` | `paginas/cadastros-parametros/estabelecimento-ensino/...html` | `AuthGuard` | idem `:28` | G1 |
| `modalidade` | `ModalidadeComponent` | `paginas/cadastros-parametros/modalidade/...html` | `AuthGuard` | idem `:31` | G1 |
| `recurso` | `RecursoComponent` | `paginas/cadastros-parametros/recurso/...html` | `AuthGuard` | idem `:32` | G1 |
| `situacao_disciplina` | `SituacaoDisciplinaComponent` | `paginas/cadastros-parametros/situacao-disciplina/...html` | `AuthGuard` | idem `:26` | G1 |
| `situacao_matricula` | `SituacaoMatriculaComponent` | `paginas/cadastros-parametros/situacao-matricula/...html` | `AuthGuard` | idem `:27` | G1 |
| `tipo_disciplina` | `TipoDisciplinaComponent` | `paginas/cadastros-parametros/tipo-disciplina/...html` | `AuthGuard` | idem `:23` | G1 |
| `tipo_documento` | `TipoDocumentoComponent` | `paginas/cadastros-parametros/tipo-documento/...html` | `AuthGuard` | idem `:25` | G1 |
| `tipo_prova` | `TipoProvaComponent` | `paginas/cadastros-parametros/tipo-prova/...html` | `AuthGuard` | idem `:24` | G1 |
| `horario` | `HorarioComponent` | `paginas/cadastros-parametros/horario/horario.component.html` | `AuthGuard` | idem `:30` | G2 |
| `turma` | `TurmaComponent` | `paginas/cadastros-parametros/turma/turma.component.html` | `AuthGuard` | idem `:21` | G2 |
| `periodointeressadocurso` | `PeriodoInteressadoCursoComponent` | `paginas/periodo-interessado-curso/periodo-interessado-curso.component.html` | `AuthGuard` | `paginas/periodo-interessado-curso/periodo-interessado-curso.module.ts:13` | G2 |
| `tipo_regime` | `TipoRegimeComponent` | `paginas/tipo-regime/tipo-regime.component.html` | `AuthGuard` | `paginas/tipo-regime/tipo-regime.module.ts:11` | G3 |
| `predio` | `PredioComponent` | `paginas/predio/predio.component.html` | `AuthGuard` | `paginas/predio/predio.module.ts:11` | G3 |
| `curso` | `CursoComponent` | `paginas/curso/curso.component.html` | `AuthGuard` | `paginas/curso/curso.module.ts:12` | G3 |
| `calendario_academico` | `CalendarioAcademicoComponent` | `paginas/calendario-academico/calendario-academico.component.html` | `AuthGuard` | `paginas/calendario-academico/calendario-academico.module.ts:13` | G3 |
| `disciplinacurso` | `DisciplinacursoComponent` | `paginas/disciplinacurso/disciplinacurso.component.html` | `AuthGuard` | `paginas/disciplinacurso/disciplinacurso.module.ts:14` | G3 |
| `disciplinaoferecida` | `DisciplinaoferecidaComponent` | `paginas/disciplinaoferecida/disciplinaoferecida.component.html` | `AuthGuard` | `paginas/disciplinaoferecida/disciplinaoferecida.module.ts:13` | G3 |
| `aluno` | `AlunoComponent` | `paginas/aluno/aluno.component.html` | `AuthGuard` | `paginas/aluno/aluno.module.ts:14` | G4 |
| `alunoespecial` | `AlunoEspecialComponent` | `paginas/aluno-especial/aluno-especial.component.html` | `AuthGuard` | `paginas/aluno-especial/aluno-especial.module.ts:12` | G4 |
| `professor` | `ProfessorComponent` | `paginas/professor/professor.component.html` | `AuthGuard` | `paginas/professor/professor.module.ts:12` | G4 |
| `funcionario` | `FuncionarioComponent` | `paginas/funcionario/funcionario.component.html` | `AuthGuard` | `paginas/funcionario/funcionario.module.ts:12` | G4 |
| `interessado` | `InteressadoComponent` | `paginas/interessado/interessado.component.html` | `AuthGuard` | `paginas/interessado/interessado.module.ts:15` | G4 |
| `alunodisciplinaoferecida` | `AlunodisciplinaoferecidaComponent` | `paginas/alunodisciplinaoferecida/alunodisciplinaoferecida.component.html` | `AuthGuard` | `paginas/alunodisciplinaoferecida/alunodisciplinaoferecida.module.ts:13` | G5 |
| `historicoaluno` | `HistoricoAlunoComponent` | `paginas/historico-aluno/historico-aluno.component.html` | `AuthGuard` | `paginas/historico-aluno/historico-aluno.module.ts:14` | G5 |
| `estagiosupervisionado` | `EstagiosupervisionadoComponent` | `paginas/estagiosupervisionado/estagiosupervisionado.component.html` | `AuthGuard` | `paginas/estagiosupervisionado/estagiosupervisionado.module.ts:14` | G5 |
| `isencao` | `IsencaoComponent` | `paginas/isencao/isencao.component.html` | `AuthGuard` | `paginas/isencao/isencao.module.ts:10` | G5 |
| `trocadeturma` | `TrocaTurmaComponent` | `paginas/troca-turma/troca-turma.component.html` | `AuthGuard` | `paginas/troca-turma/troca-turma.module.ts:13` | G5 |
| `nota` | `NotaComponent` | `paginas/nota/nota.component.html` | `AuthGuard` | `paginas/nota/nota.module.ts:10` | G6 |
| `falta` | `FaltaComponent` | `paginas/falta/falta.component.html` | `AuthGuard` | `paginas/falta/falta.module.ts:10` | G6 |
| `calculoacademico` | `CalculoAcademicoComponent` | `paginas/calculo-academico/calculo-academico.component.html` | `AuthGuard` | `paginas/calculo-academico/calculo-academico.module.ts:15` | G7 |
| `alunosdisciplinas` | `CadastroAlunosDisciplinasComponent` | `paginas/cadastro-alunos-disciplinas/cadastro-alunos-disciplinas.component.html` | `AuthGuard` | `paginas/cadastro-alunos-disciplinas/cadastro-alunos-disciplinas.module.ts:12` | G7 |
| `dataprova` | `DataprovaComponent` | `paginas/dataprova/dataprova.component.html` | `AuthGuard` | `paginas/dataprova/dataprova.module.ts:12` | G8 |
| `provaespecial` | `ProvaespecialComponent` | `paginas/provaespecial/provaespecial.component.html` | `AuthGuard` | `paginas/provaespecial/provaespecial.module.ts:11` | G8 |
| `disciplinaoferecidaaluno` | `DisciplinaoferecidaalunoComponent` | `paginas/disciplinaoferecidaaluno/disciplinaoferecidaaluno.component.html` | `AuthGuard` | `paginas/disciplinaoferecidaaluno/disciplinaoferecidaaluno.module.ts:10` | G8 |
| `planoensino` | `PlanoensinoComponent` | `paginas/planoensino/planoensino.component.html` | `AuthGuard` | `paginas/planoensino/planoensino.module.ts:10` | G8 |
| `envioemail` | `EnvioEmailComponent` | `paginas/envio-email/envio-email.component.html` | `AuthGuard` | `paginas/envio-email/envio-email.module.ts:16` | G9 |
| `enviosms` | `EnvioSmsComponent` | `paginas/envio-sms/envio-sms.component.html` | `AuthGuard` | `paginas/envio-sms/envio-sms.module.ts:16` | G9 |
| `relacionamento` | `RelacionamentoInteressadoComponent` | `paginas/relacionamento-interessado/relacionamento-interessado.component.html` | `AuthGuard` | `paginas/relacionamento-interessado/relacionamento-interessado.module.ts:15` | G9 |
| `geracaodematricula` | `GeracaoMatriculaComponent` | `paginas/geracao-matricula/geracao-matricula.component.html` | `AuthGuard` | `paginas/geracao-matricula/geracao-matricula.module.ts:14` | G10 |

Nenhuma rota tem parâmetro além de `login/:token/:user`: o registro aberto vive em memória; não há URL de detalhe.

### 1.2 A forma comum a quase todas as telas: `app-form-template`

33 templates começam com `<app-form-template>` (`sharedservices/form-template/form-template.component.html`). Ele é ao mesmo tempo a moldura (seção 2) e um contêiner de **dois painéis que se alternam** dentro de um cartão:

- cabeçalho do cartão: título (`<panel-title>`) e dois botões-aba "Novo" (ícone `insert_drive_file`) e "Pesquisar" (ícone `search`) (`form-template.component.html:25-39`); cada um pode ser ocultado por `[buttonNewRender]` / `[buttonSearchRender]`;
- painel `grid` = o formulário (`<panel-grid>`) com a barra de ações embaixo (`<panel-button>`: "Salvar" com `check_circle`, "Excluir" com `delete`);
- painel `search` = a busca (`<panel-search>`): campo "Busca" com barra de progresso fina + tabela ou grade de cartões.

Clicar numa linha do resultado troca para o painel `grid` com o registro carregado (`formTemplateServices.setGridState()`); salvar ou excluir volta para `search` em algumas telas. Painel inicial padrão: `search` (`form-template.component.ts:17`). Retorno ao usuário: diálogo de alerta de 400px com título + texto + "Fechar" (`form-template.component.html:65-73`), diálogo "loading" com círculo (`:77-79`), e toasts do Materialize para erro de validação (`sharedservices/directives/form-erros.directive.ts:28`).

**Não existe diálogo de confirmação antes de excluir** em nenhuma tela: o clique em "Excluir" ou no ícone `delete` da linha chama o serviço direto (ex.: `sharedservices/tipo-basico-form/tipo-basico-form.component.ts:130-132`, `paginas/predio/sala/sala.component.ts:109-111`).

Tabelas: todas as 38 usam `angular2-datatable` (`[mfData]` + `mfBootstrapPaginator`), paginação no cliente, sem ordenação ligada nos cabeçalhos (não há `mfDefaultSorter` em nenhum template), sem seleção por caixa (exceto G7), sem exportação (exceto o botão "Exportar" do filtro de interessados).

### 1.3 Grupos de telas

Como o UCAMDS não tem projeto de referência deste sistema (o catálogo lista protocolo, portal, sigfin, relatorios, gerencial, isencao), **nenhuma tela é "coberta"**; a classificação é "parcial" quando padrão + peças já existem, "falta" quando falta peça ou padrão, "nao-migrar" quando é tela morta.

#### G1 — Cadastro básico genérico: lista + formulário de 1 a 5 campos (10 telas)

`atividade_academica`, `disciplina`, `estabelecimento_ensino`, `modalidade`, `recurso`, `situacao_disciplina`, `situacao_matricula`, `tipo_disciplina`, `tipo_documento`, `tipo_prova`. Cada template tem 6 a 8 linhas e só instancia `<app-tipo-basico-form>` passando `schema`, `type`, `title`, `fields` e `searchDataArray`.

Representante — **Disciplina** (`paginas/cadastros-parametros/disciplina/disciplina.component.ts:16-37`)
- Propósito: manter o catálogo de disciplinas da unidade.
- Arquétipo: listagem + formulário na mesma tela (dois painéis).
- Peças (`sharedservices/tipo-basico-form/tipo-basico-form.component.html`): painel Novo com N `input type=text` gerados por `*ngFor` (largura em colunas de 12, `maxlength`), botões "Excluir" (desabilitado sem `oid`) e "Salvar"; painel Pesquisar com campo "Busca" (dispara ao digitar, 500 ms), barra de progresso indeterminada, tabela `highlight bordered` com 10 linhas por página, cabeçalho em maiúsculas, linha inteira clicável.
- Campos e colunas (são os mesmos; a tabela lista todos os campos com rótulo):

| Tela | schema / type | Campos (rótulo → nome, colunas/12, máx.) | Filtra por unidade |
|---|---|---|---|
| Atividade Academica | extensao / atividadeacademica | Descrição → `descricao` (8, 120) | sim |
| Disciplina | extensao / disciplina | Sigla → `sigla` (3, 10); Crédito → `credito` (3, 2); Carga horária → `cargahoraria` (3, 3); Ordem → `ordem` (3); Descrição → `descricao` (12, 120) | sim |
| Estabelecimento de Ensino | academico / estabelecimentoensino | Sigla → `sigla` (2, 10); Descrição → `descricao` (10, 250); Cidade → `cidade` (12, 100) | não |
| Modalidade | extensao / modalidade | Descrição → `descricao` (8, 100) | não |
| Recurso | academico / recurso | Descrição → `descricao` (8) | não |
| Situação da disciplina | academico / situacaodisciplina | Descrição → `descricao` (8, 100) | não |
| Situação da matricula | academico / situacaomatricula | Descrição → `descricao` (8, 100) | não |
| Tipo de disciplina | academico / tipodisciplina | Descrição → `descricao` (8) | não |
| Tipo de documento | extensao / tipodocumento | Descrição → `descricao` (8, 50) | não |
| Tipo de prova | extensao / tipoprova | Descrição → `descricao` (4, 100); Nome → `nome` (8, 100) | não |

- Classificação: **parcial**. Padrão `listagem-crud`; base: `protocolo/naturezas` (lista) + `protocolo/natureza-form` (formulário); `isencao/cursos` e `isencao/matrizes` também servem. Peças: data-table, text-field, button, pagination, dialog. Falta: a `confirmacao-destrutiva` não existe na origem (precisa ser acrescentada, não migrada); a decisão de dois painéis × lista com gaveta.

#### G2 — Cadastro simples com formulário próprio (3 telas)

`horario`, `turma`, `periodointeressadocurso`. Mesma forma de G1, mas com template escrito à mão por haver select, data, máscara ou regra condicional.

- **Horário** (`paginas/cadastros-parametros/horario/horario.component.html`): select "Dia da semana" (`diasemana`), "Hora de início" (`horainicial`, máscara `00:00`), "Hora de fim" (`horafim`, `00:00`). Tabela: DIA DA SEMANA, HORA DE INÍCIO, HORA DE FIM. Excluir/Salvar.
- **Turma** (`paginas/cadastros-parametros/turma/turma.component.html`): "Ano" (`ano`), "Data de Início" (`datainicio`, pickadate), "Data de Fim" (`datafim`, pickadate), "Turma" (`turma`), select "Curso" (`unidadecurso`, opção "Nome (tipo de curso)"), "Descrição" (`descricao`); mensagens de erro em `span.error` sob o campo ("Informe o ano", "Informe a data de início da turma", "Informe a data de fim", "Informe a turma"). Tabela: Ano, Curso, Turma, Descrição.
- **Periodo de inscrição de interessados** (representante; `paginas/periodo-interessado-curso/periodo-interessado-curso.component.html`)
  - Propósito: abrir a janela em que um curso aceita inscrição de interessados, dizer em que site aparece e se cobra boleto.
  - Campos: autocomplete "Curso" (`unidadecurso`, mínimo 0 caracteres, opção "Nome - tipo de curso"); "Data de Início" (`datainicio`, máscara `99/99/9999`); "Data de Fim" (`datafim`); select "Exibir em" (`exibicao`: `UCAM` "Site da UCAM", `CENTRAL_POSGRADUACAO` "Central Pós-graduação", `CEPEFER` "Site do CEPEFER", `TODOS` "TODOS os Sites"); switch "Possui boleto" (`boleto`); "Valor" (`valor`, `type=number`, `step=0.01`); autocomplete "Descrição do recebimento" (`recebimentodiverso`, opção "código - descrição").
  - Tabela: Curso, data inicio, data fim. Busca filtra no cliente pelo nome do curso.
- Classificação: **parcial**. `listagem-crud` + `formulario-entidade`; base `protocolo/naturezas` + `protocolo/natureza-form`; peças: select, date-field, switch, combobox, text-field, field. Falta: campo de hora (time) — o catálogo tem date-field mas não lista peça de hora; campo monetário com máscara (em `sigfin/calculo-mensalidade` há valor; confirmar se a peça é reutilizável).

#### G3 — Mestre-detalhe: formulário do registro + sublistas com edição em diálogo (6 telas)

`tipo_regime`, `predio`, `curso`, `calendario_academico`, `disciplinacurso`, `disciplinaoferecida`. O painel `grid` traz o formulário do pai e, abaixo, uma ou mais tabelas-filhas com botão "Adicionar X" (`add_box`, desabilitado até o pai ter `oid`), ícones `mode_edit` e `delete` por linha e um diálogo de 400–700px com "Cancelar"/"Salvar".

- **Tipo de Regime** → filhos "Regime". Pai: "Descrição" (`descricao`, máx. 120). Tabela de busca: DESCRIÇÃO. Sublista: REGIME (10 por página, editar/excluir na própria célula). Diálogo "Regime": "Descrição" (`descricao`, máx. 120).
- **Prédio** → filhos "Sala". Pai: "Sigla" (`sigla`), "Descricao" (`descricao`). Tabela de busca: Sigla, Descrição. Sublista com cabeçalhos Sala, Nome, Largura, Comprimento, Capacidade (5 cabeçalhos para 4 células: nome, largura, comprimento, capacidade — `paginas/predio/sala/sala.component.html:16-20` × `:27-36`). Diálogo "Sala": `nome`, `largura`, `comprimento`, `capacidade`.
- **Curso** (representante; `paginas/curso/curso.component.html`)
  - Propósito: manter o cadastro do curso na unidade e seus atos de reconhecimento.
  - Campos do pai: "Código" (`codigo`, máx. 3), "Cód CENSO" (`codigoies`, máx. 10), "Nome" (`nome`), "CH mínima" (`cargahorariaminima`), "Duração min" (`duracaominima`), "Duração max" (`duracaomaxima`), select "Modalidade" (`modalidade`), select "Tipo de regime" (`tiporegime`), select "Tipo de curso" (`tipocurso`), "Início de funcionamento" (`iniciofuncionamento`, pickadate), "Area de conhecimento" (`areaconhecimento`), textarea "Perfil profissional" (`perfilprofissional`), "Portaria" (`portaria`), "Credenciamento Capes" (`credenciamentocapes`). O formulário também carrega, sem campo visível, `creditos`, `regimeletivo`, `sistemacurricular`, `titulacao` (`paginas/curso/curso.component.ts:52-61`).
  - Tabela de busca: Código, Curso (nome + tipo de curso em segunda linha), Tipo de regime.
  - Sublista "Reconhecimento" (`paginas/curso/reconhecimento/reconhecimento.component.html`): cabeçalhos Número do parecer, Tipo, Número do documento, Data de publicação; as duas últimas células estão trocadas em relação ao cabeçalho (`:17-18` × `:31`, `:34`). Diálogo "Reconhecimento": "Nº do parecer" (`numeroparecer`, 30), "Data do parecer" (`dataparecer`, `00/00/0000`), select "Tipo de Documento" (`tipodocumento`), "Nº do documento" (`numerodocumento`, 30), "Data de publicação" (`datapublicacao`), textarea "Descrição" (`descricao`, 200).
- **Calendário Acadêmico**: pai com "Ano" (`ano`, máscara `0000`), "Data de início" (`datainicio`), "Data de fim" (`datafim`); tabela de busca ANO, DATA DE INÍCIO, DATA DE FIM. Três abas (`ul.tabs`): **Regimes** (select de tipo de regime acima da tabela + "Adicionar Regime"; tabela com cabeçalho "Atividade" mostrando o regime, Data de início, Data de fim; diálogo "Regime": select `regime`, `datainicio`, `datafim`), **Atividades** (tabela Atividade, Data de início, Data de fim; diálogo "Atividade acadêmica": select `atividadeacademica`, `datainicio`, `datafim`), **Feriados** (tabela Descrição, Data; diálogo "Feriado": `descricao`, `data`).
- **Disciplina x Curso**: busca de curso (tabela Código, Nome, e coluna com cabeçalho "Modalidade" que exibe `tiporegime` — `paginas/disciplinacurso/disciplinacurso.component.html:22`, `:30`); ao escolher, o painel mostra o curso, botão "Módulos" e **uma aba por módulo** (a primeira é "Sem Módulo"), cada uma com tabela Sigla, Disciplina (cortada em 40 caracteres + "..."), CH, Apenas situação (Sim/Não) e "Adicionar disciplina". Diálogo "Disciplina": autocomplete "Modulo" (`modulo`), switch Não/Sim "Apenas situação" (`situacaonota`), autocomplete "Disciplina" (`disciplina`, "sigla - descrição"). Diálogo "Modulos" (lista Descrição, Ordem, com "Adicionar Módulo" e "Fechar") que abre um **segundo diálogo empilhado** "Novo módulo" (`descricao`, `ordem`).
- **Disciplina oferecida**: busca com filtro em cascata `app-calendarioregimecurso` (Calendário → Regime → Curso) e tabela Código, Descrição, Turno. Formulário: "Ano" (`ano`), select "Calendário" (`calendarioacademico`, "início - fim"), select "Regime" (`calendarioregime`), select "Curso" (`curso`), select "Turno" (`turno`: M Manhã, T Tarde, N Noite), "Código da turma" (`codigoturma`), autocomplete "Disciplina" (`disciplinaunidadecurso`, "descrição (sigla - CH: n) - módulo"). Sublista de horários: Professor, Dia, Horário, Sala. Diálogo (título "Nova disciplina oferecida", mas é o horário — `paginas/disciplinaoferecida/horariodisciplinaoferecida/horariodisciplinaoferecida.component.html:46`): autocomplete "Professor", select "Sala", select "Dia", select "Horario".
- Classificação: **parcial**. `formulario-entidade` (pai) + data-table e dialog (filhos) + tabs + `confirmacao-destrutiva`; base: `gerencial/usuario-form` e `protocolo/natureza-form` para o pai, `isencao/matrizes` para lista de disciplinas por curso. Falta: o padrão **"formulário com sublista editável"** (tabela-filha dentro do formulário, bloqueada até o pai ser salvo, edição em diálogo) não está nomeado entre os 8 padrões; abas geradas dinamicamente por dado (uma por módulo, uma por ano) precisam de regra de transbordo; diálogo sobre diálogo (Módulos → Novo módulo) não tem contrato.

#### G4 — Ficha de pessoa em abas (5 telas)

`aluno`, `alunoespecial`, `professor`, `funcionario`, `interessado`.

Representante — **Aluno** (`paginas/aluno/aluno.component.html`)
- Propósito: consultar e corrigir os dados cadastrais do aluno regular.
- Arquétipo: busca → ficha com cabeçalho (foto + matrícula + nome) e abas.
- Busca: campo "Busca" e grade de cartões `app-card-aluno` em 2 colunas, 400px de altura com rolagem (foto 39×52 ou ícone `face`, nome, matrícula, curso, tipo de curso). Sem botão "Novo" (`aluno.component.html:1`).
- Cabeçalho: `app-foto-pessoa` (foto 75×100 com "Alterar" ao passar o mouse → diálogo com webcam), "Matrícula" (`matricula`), "Nome" (`pessoa.nome`).
- Abas (`aluno.component.html:25-31`): **Dados Pessoais** — "Data Nascimento" (`pessoa.datanascimento`, `00/00/0000`), "Naturalidade" (`pessoa.naturalidade`), select "Nacionalidade" (`pessoa.oidnacionalidade`), select "Estado Civil" (`pessoa.oidestadocivil`), select "Raça" (`pessoa.oidraca`), select "Sexo" (`pessoa.sexo`: F/M), "Nome do pai" (`pessoa.pai`), "Nome da mãe" (`pessoa.mae`). **Documentos** — quatro blocos com título: Cpf (`cpf.numero` 11 dígitos, `cpf.dataemissao`), Identidade (`identidade.numero` máx. 20, `dataemissao`, `orgaoemissor`), Título eleitoral (`titulo.numeroinscricao`, `zona`, `secao`, `dataemissao`, select `uf`, select `municipio` dependente da UF), Certificado de reservista (`numero`, `categoria` 30, `orgaoexpeditor` 60, `dataemissao`). **Endereço** — `app-endereco` (tabela Logradouro, Número, Cidade, UF, Tipo, Correspondência + diálogo "Endereço": `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `cep` com máscara, select `uf`, select `tipoendereco`, switch `correspondencia`). **Contatos** — "Email" (`pessoa.email`) + `app-telefone` (tabela Telefone, Tipo + diálogo "Telefone": `ddd`, `numero`, select `tipotelefone` Residencial/Celular). **turma** — três campos só leitura: Ano, Turma, Curso. **Dados Escolares** — autocomplete "Estabelecimento de ensino" (`dadosescolares.oidestabelecimentoensino`), select "Nível" (`nivel`: 1 Ensino Fundamental, 2 Ensino Médio, 3 Ensino Superior), "Ano de conclusao" (`anoconclusao`, `0000`), "Cidade" (`cidade`, 50), "Grau obitodo em outra IES" (`graduacao`, 300). **Documentos Escaneados** — `app-documentosescaneados`: botão "Upload de documento", grade de cartões `app-card-documento` (ícone por extensão, rótulo do tipo, "Download", "Remover") e diálogo "Upload de documento" (select "Tipo de documento" + campo de arquivo + "Cancelar"/"Enviar").
- Ação: só "Salvar".

Variações:
- **Aluno especial**: tem "Novo"; matrícula desabilitada; abas Dados Pessoais, Documentos, Endereço, Telefone, Dados Escolares, **Disciplinas** (tabela Regime, Código, Disciplina, Módulo, Situação + excluir; diálogo "Adicionar disciplina oferecida": select "Curso" + autocomplete "Disciplina oferecida"). Busca em tabela Matrícula, Nome.
- **Professor**: "Novo" abre o diálogo "Digite o cpf" (`app-busca-pessoa`: campo CPF 11 dígitos, "Cancelar"/"Buscar"); abas Dados Pessoais, Documentos, Endereço, Contatos, **Dados de docência** (selects "Titulacao", "Cargo", "Regime de trabalho" — valores na regra 40). Busca em cartões `app-card-pessoa` (foto, nome, matrícula, CPF).
- **Funcionario**: "Novo" abre o mesmo diálogo de CPF; abas Dados Pessoais, Documentos, Endereço, Telefone. Busca em tabela Matrícula, Nome.
- **Interessado**: sem foto e sem matrícula; "Novo" abre o diálogo de CPF; abas Dados Pessoais (data de nascimento, naturalidade, sexo, email, botão "Conferir documentos", blocos Cpf — só leitura — e Identidade), **Contatos** (endereço + telefone), **Cursos interessados** (tabela curso, data + excluir; diálogo "Novo interesse" com select "Curso"). Diálogo "Conferência de documentos" (lista com "Download" ou "Sem documentos"). Busca: `app-filtro-interessado` (ver G10).
- Classificação: **parcial**. `formulario-entidade` em seções/abas; base `gerencial/usuario-form` (formulário) e `gerencial/usuario-detalhe` (ficha); peças: tabs, text-field, select, combobox, date-field, switch, data-table, dialog, avatar, anexo, file-field, card, list-item. Falta: **captura de foto por webcam com recorte** (não há peça); busca prévia por CPF antes de criar (diálogo de pré-cadastro) como fluxo descrito; par de selects dependentes UF → município como receita; cartão de pessoa com foto retrato 3×4 (o avatar do DS é redondo de 24 — confirmar se atende).

#### G5 — Escolher um aluno e operar uma lista dele (5 telas)

`alunodisciplinaoferecida`, `historicoaluno`, `estagiosupervisionado`, `isencao`, `trocadeturma`. Todas (menos `isencao`) têm painel Pesquisar com "Busca" + grade de `app-card-aluno`, e painel de trabalho encabeçado por `app-topo-aluno` (foto + Matrícula, Nome, Turma, Curso em campos só leitura). Em `isencao` o aluno é escolhido por autocomplete (`app-filtro-aluno`: foto, Matrícula só leitura, "Nome" com "buscar pelo nome ou matricula") no próprio painel.

- **Aluno em disciplina oferecida** (representante; `paginas/alunodisciplinaoferecida/alunodisciplinaoferecida.component.html`)
  - Propósito: ver e alterar as disciplinas em que o aluno está inscrito e a situação em cada uma.
  - Peças: cabeçalho do aluno; botão "Adicionar disciplina oferecida"; **uma aba por ano** de calendário; em cada aba, grade de cartões `app-card-aluno-disciplina` (regime, módulo, situação, "código - disciplina") com ação "Editar".
  - Diálogo "Adicionar disciplina oferecida" (600px): filtro Calendario → Regime (`app-filtro-calendario-regime`, dropdowns com segunda linha de datas e regimes agrupados por tipo), duas abas internas: **Por disciplina** (autocomplete "Disciplina oferecida" — vira campo só leitura na edição —, select "Situação") e **Por módulo** (select "Módulo" + tabela Regime, Código, Disciplina com 7 por página). "Cancelar"/"Salvar" em cada aba.
- **Histórico de situação**: lista vertical de cartões (situação em destaque, observação, "em dd/MM/yyyy às HH:mm:ss", "Editar"), botão "Adicionar Situacao"; diálogo "Nova Situação": select "Situacao" (`situacaomatricula`), textarea "Observação" (`observacao`).
- **Estágio supervisionado**: tabela Local, Carga Horária, Data de Início, Data de Término + editar/excluir; diálogo (título "Feriado" — `paginas/estagiosupervisionado/estagiosupervisionado.component.html:77`): `local`, `cargahoraria`, `datainicio`, `datatermino`.
- **Isenção**: campos só leitura Curso, Ano, Turma; tabela Ano, Sigla, Disciplina + excluir; diálogo "Adicionar Isenção": "Ano" (`ano`), autocomplete "Disciplina" (`disciplinaunidadecurso`).
- **Troca de turma**: cabeçalho do aluno, subtítulo "Turma de Destino", `app-filtro-curso-turma` (dropdown Curso com tipo em segunda linha, dropdown Turma "Turma n - ano" com descrição), botão "Efetuar troca" (desabilitado sem turma).
- Classificação: **parcial**. `triagem-lista-detalhe` (busca à esquerda/antes, item aberto depois) + `listagem-crud` na lista-filha; base `gerencial/usuario-detalhe` e `gerencial/usuarios`; histórico → `timeline`; cabeçalho do aluno → `page-header` + `avatar` + `description-list`; peças: card, tabs, combobox, select, dialog, data-table. A isenção daqui é uma lista simples de disciplinas dispensadas, **não** a fila de análise do projeto `isencao` do UCAMDS; a base correta é `isencao/consulta` só como leitura. Falta: "cabeçalho de pessoa em contexto" reutilizável (foto + 4 dados) como peça composta; `troca de turma` é uma ação de um passo que caberia em diálogo com `confirmacao-destrutiva` (não há confirmação na origem).

#### G6 — Lançamento em grade por turma (2 telas)

`nota`, `falta`. Sem "Novo" nem "Pesquisar": só o painel de trabalho.

- **Lançamento de notas** (representante; `paginas/nota/nota.component.html`)
  - Propósito: lançar as notas de um tipo de prova para todos os alunos de uma disciplina/turma.
  - Peças: filtro em cascata `app-disciplinaoferecidaturma` (Calendario → Regime → Curso → Disciplina oferecida "código - disciplina - turno" → Turma), select "Tipo de prova"; tabela Matrícula, Nome, **uma coluna por tipo de prova da fórmula** (cabeçalho = `tipoprova.nome`), Média; só a coluna do tipo escolhido vira `input` de 1 caractere de largura, as demais ficam como texto; botão "Salvar" ao pé.
- **Lançamento de Faltas**: mesmo filtro + campo "Data" (pickadate que só habilita os dias com conteúdo de aula); tabela Matrícula, Nome, **uma coluna por horário de aula do dia** ("início - fim", 11px) com checkbox, e "Faltas" ("total (percentual%)"). Não há botão Salvar: cada marcação grava na hora.
- Classificação: **falta**. Não há padrão de **lançamento em grade** (tabela com colunas geradas pelo dado e célula editável, com salvamento em lote ou imediato) entre os 8 padrões, e o contrato do data-table não é descrito como editável. Base parcial: `sigfin/movimento-caixa` (tabela densa) + `relatorios/filtros` (cascata de filtros) + checkbox/text-field. Falta também: filtro em cascata de 4–5 níveis como bloco reutilizável; date-field com dias desabilitados por lista.

#### G7 — Seleção em massa e disparo de processamento (2 telas)

`calculoacademico`, `alunosdisciplinas`.

- **Calculo Acadêmico** (representante; `paginas/calculo-academico/calculo-academico.component.html`)
  - Propósito: pedir ao servidor o recálculo de média, situação por nota, situação por frequência e CR.
  - Peças: filtro Calendario → Regime; quatro switches "Calculo de média", "Calculo de situação(Nota)", "Calculo de situação(Falta)", "Calculo de CR"; quatro abas "Calcular por curso", "Calcular por disciplina oferecida", "Calcular por turma", "Calcular por aluno". Cada aba: botões "Enviar Calculo" (`open_in_browser`, desabilitado sem seleção) e "Marcar/Desmarcar todos", contador "N cursos selecionados" / "N disciplinas oferecidas selecionadas" / "N turmas selecionadas", e uma grade de cartões de 48–60px com switch (por curso: nome; por disciplina: select Curso + disciplinas; por turma: agrupado por curso com subtítulo, "Turma n - ano" + descrição; por aluno: `app-filtro-aluno` + cartões com código da turma, situação, disciplina e "Média x"). Área de 300px com rolagem.
- **Alunos da turma x disciplina oferecida**: dropdown Calendário, select Regime, select Curso, select Turma; botão "Selecionar alunos" + "N / total aluno(s) selecionado(s)"; tabela com switch no cabeçalho (marca todos) e por linha, Código, Disciplina oferecida (6 por página); botões "Limpar" e "Processar". Diálogo "Selecione os alunos": tabela com switch, Matricula, Nome; botão "Voltar".
- Classificação: **parcial**. `listagem-crud` (ações em lote) + tabs + switch/checkbox + choice-card; base `gerencial/usuarios` (seleção em lote) e `relatorios/filtros`. Falta: padrão de **processo assíncrono com acompanhamento** — a origem só diz "Calculo enviado para o servidor" e mostra o andamento no painel de notificações por WebSocket (seção 2); o DS tem `progress` mas não uma tela/peça de fila de processos.

#### G8 — Lista filtrada por período/curso com subcadastro (4 telas)

`dataprova`, `provaespecial`, `disciplinaoferecidaaluno`, `planoensino`. Todas começam pelo filtro `app-calendarioregimecurso` (Calendario, Regime, Curso).

- **Data de prova**: busca com o filtro + campo "Disciplina" (filtra no cliente) e grade de cartões `app-card-disciplina-dataprova` em 3 colunas (nome da disciplina truncado, "código - turno" e, para **cada tipo de prova**, um mini-calendário com mês/dia/ano ou ícone `block` quando não há data). Ao clicar: "Código", "Disciplina", botão "Adicionar Data", tabela Tipo, Data, Horário + editar/excluir. Diálogo "Nova data" (400px): select "Tipo prova", "Data" (pickadate), select "Horário".
- **Prova especial**: filtro + select "Disciplina oferecida"; botão "Adicionar prova especial"; tabela Tipo, Data. Diálogo "Prova especial" (600px, com X no título): select "Tipo de prova", "Data da prova" (`dataprova`), "Data de entrega" (`dataentrega`), sublista de alunos (Aluno "matrícula - nome", Turma + excluir) e um **segundo diálogo** "Aluno" com select de alunos da disciplina.
- **Disciplina oferecida x alunos**: filtro + select "Disciplina oferecida"; "Adicionar aluno"; tabela Matrícula, Nome, Situação + editar. Diálogo "Adicionar Aluno" (500px): foto, Matrícula só leitura, autocomplete "Nome", select "Situação".
- **Plano de ensino** (representante; `paginas/planoensino/planoensino.component.html`)
  - Propósito: a coordenação abre o plano de ensino de uma disciplina oferecida e o aprova ou reprova.
  - Busca: filtro + tabela Código, Descrição, **Estado** (texto: NÃO INICIADO, EM ELABORAÇÃO, APROVADO, REPROVADO).
  - Painel: campos desabilitados Código, Disciplina, Curso; tabela de elementos do plano (Descrição + editar); barra com "Reprovar" (`delete`, secundário) e "Aprovar" (`check_circle`).
  - Diálogo de elemento: título = descrição do elemento; o corpo só tem "Cancelar"/"Salvar" — **não há campo para o conteúdo** (o editor rico está comentado em `paginas/planoensino/planoensino.component.ts:28-29`, `:116`; o controle `conteudo` é obrigatório em `:40`).
- Classificação: **parcial**. `listagem-crud` com filtros (`relatorios/filtros` como base do bloco de filtro) + dialog; `planoensino` → `triagem-lista-detalhe` (base `protocolo/analise-requerimento` + `protocolo/requerimento-detalhe`, com badge de situação e ações Aprovar/Reprovar). Falta: cartão com mini-calendário por tipo de prova (peça `prazo`/data em cartão — confirmar se `prazo` cobre data sem contagem); o diálogo de elemento do plano está incompleto na origem → **nao-migrar tal como está**, redesenhar a partir da regra.

#### G9 — Comunicação: e-mail, SMS e relacionamento (3 telas)

- **Envio de Email** (`paginas/envio-email/envio-email.component.html`)
  - Propósito: montar uma lista de destinatários por filtros e disparar um e-mail.
  - Peças: três botões "Por Curso", "Por Turma", "Entrada Manual" (`person_add`); grade de cartões de grupo de destinatários `app-item-destinatario` (rótulo truncado, "N Pessoas selecionadas", "Visualizar", "Remover"; estado "Carregando..."); botão "Enviar Email".
  - Diálogos: "Filtro por Curso" (selects Curso, Tipo de curso, Modalidade, Situação, todos com opção "Todos"; "Adicionar"); "Filtro Turma" (selects Curso, Turma, Situação); "Filtro Manual" (Nome, Email); "Destinatarios" (lista nome + e-mail, 400px com rolagem, "Fechar"); "Email" (800×600): chips com os nomes (até 8; acima disso um chip "N Pessoas selecionadas"), campo "Assunto", editor rico TinyMCE (negrito, itálico, tachado, cores, link, alinhamento, listas, recuo, limpar formatação, "Inserir texto pré-definido", inserir imagem), botão "Enviar Email". Sub-diálogos do editor: escolha de modelo (select "Modelo" + pré-visualização + "Selecionar") e upload de imagem.
- **Envio de Sms**: idêntico, com "Filtro Manual" de Nome, DDD (2), Número (9) e diálogo "SMS" (800×300) com chips e textarea "Mensagem" (`data-length="120"`).
- **Relacionamento** (representante; `paginas/relacionamento-interessado/relacionamento-interessado.component.html`)
  - Propósito: acompanhar os interessados (leads) de um período, ver o histórico de contatos e disparar e-mail/SMS em massa.
  - Filtros: "Pesquisar desde" (máscara `00/0000`), dropdown "Curso" (com "Todos"; segunda linha "tipo - modalidade"), dropdown "Situação" (Todos, Matriculado, Não Matriculado), campo só leitura "Total Selecionado".
  - Grade de cartões 3 colunas, 9 por página (`app-interessado`): nome, curso, data, três ícones com contador (`email`, `phone_iphone`, `phone`; "x" e estilo apagado quando a pessoa não tem e-mail/telefone), botão "Histórico", switch de seleção. Paginação própria (`app-paginate`: setas e números).
  - Diálogo "Histórico" (700px): Nome, Curso, Email; abas "Registro de Ligações" (com "Adicionar registro"), "Registro de Email", "Registro de Sms"; cada registro é um cartão (destinatário, mensagem ou assunto, "em dd/mm/aaaa às hh:mm:ss", e "Visualizar email" que abre o HTML em outro diálogo). Diálogo "Novo registro de Ligação": select de telefone (rótulo "Tipo"), textarea "Observação".
  - Ações: "Enviar Email", "Enviar Sms" (mesmos diálogos de composição).
- Classificação: **parcial**, com lacuna. Base: `protocolo/analise-requerimento` (caixa de entrada) + `timeline` para o histórico por canal + `compositor` para a mensagem + chip + dialog + pagination. Falta: **editor de texto rico com modelos e imagem** (o catálogo tem `compositor` e `textarea`; se o compositor não formata, a peça falta); **seletor de destinatários por grupos/filtros** (cartões de grupo com contagem e pré-visualização); contador de caracteres em textarea; cartão de contato com indicadores por canal.

#### G10 — Matrícula a partir do interessado (1 tela)

**Matricular Aluno** (`paginas/geracao-matricula/geracao-matricula.component.html`)
- Propósito: transformar um interessado em aluno, escolhendo curso e turma.
- Busca (`app-filtro-interessado`, `sharedservices/filters/filtro-interessado/filtro-interessado.component.html`): "Pesquisar desde" (`00/0000`), select "Tipo de curso", select "Curso", select "Documentos" (TODOS, COM DOCUMENTOS, SEM DOCUMENTOS), select "Situação" (TODOS, PENDENTE, CONFIRMADO, MATRICULADO), botão "Exportar" (planilha); resultado em cartões de 2 colunas: nome, data, "situação: X" (cor por classe CSS com o nome da situação), "documentos: OK / PENDENTE".
- Formulário em três blocos com subtítulo: **Interessado** (Nome, Cpf, Data de nascimento só leitura; select "Turno" M/T/N; botão "Conferir documentos"), **Dados escolares** (autocomplete "Estabelecimento de ensino", select "Nível", "Ano de conclusao", "Cidade", "Grau obtido em outra IES"), **Curso** (dropdown Curso entre os cursos de interesse da pessoa; dropdown Turma). Ação: "Matricular".
- Diálogo "Conferência de documentos" (lista com "Download").
- Classificação: **parcial**. `triagem-lista-detalhe` (fila de interessados → decisão) + `formulario-entidade` em seções; base `isencao/fila` + `isencao/analise` (fila com documentos e situação) e `protocolo/novo-requerimento`; peças: badge, anexo, section-bar, combobox, select, description-list. Falta: nada de peça; falta a regra de quem pode matricular com documentos pendentes (seção 6).

#### Telas da moldura e mortas

- **`home`**: `<app-form-template></app-form-template>` vazio — só moldura e cartão sem conteúdo (`paginas/home-component/home.component.html:1`; o componente injeta `HttpClient` e não o usa). Classificação: **parcial** (padrão `shell-aplicacao`, base `portal/grade-modulos`); falta decidir o que a home mostra.
- **`login`**: o template é uma cópia do `index.html` com logo, "Aguarde" e gif (`login/login.component.html:41-44`); não há formulário, embora o componente tenha `FormGroup` login/senha e `onLogin()` (`login/login.component.ts:29-31`, `:65-76`). Classificação: **parcial** — base `portal/login`; na prática o login é o SSO externo (seção 2).
- **`autocomplete`**: rota que renderiza o componente de autocomplete solto, sem guard e sem moldura (`app.module.ts:50`). **nao-migrar**.
- **`app-filtro-aluno-curso`**: componente declarado e exportado, sem nenhum uso em template (contagem 0). **nao-migrar**.

### 1.4 Diálogos — resumo

48 `div.modal` do Materialize nos templates. Todos são feitos à mão (`$('#id').modal('open')`), com a mesma anatomia: `modal-title`, `modal-content` (altura fixa em px), `modal-footer` com "Cancelar" (secundário, `close`) e "Salvar" (`check_circle`). Larguras fixas: 300, 400, 500, 600, 700 e 800px. Classificação de todos: **parcial** — peça `dialog` (formulário curto) ou `drawer`; nenhum é `confirmacao-destrutiva`.

| Onde | Diálogos |
|---|---|
| Moldura (`form-template`) | alerta (título/texto/"Fechar"); loading |
| Pessoa | "Digite o cpf"; "Endereço"; "Telefone"; câmera (captura/recorte: "Capturar", "Recapturar", "Salvar", "Preview") |
| Aluno / interessado / matrícula | "Upload de documento"; "Conferência de documentos" (2×); "Novo interesse" |
| Aluno especial / aluno em disciplina / disciplina×alunos | "Adicionar disciplina oferecida" (2×); "Adicionar Aluno" |
| Calendário | "Regime"; "Atividade acadêmica"; "Feriado" |
| Curso / tipo de regime / prédio | "Reconhecimento"; "Regime"; "Sala" |
| Disciplina×curso | "Disciplina"; "Modulos"; "Novo módulo" |
| Disciplina oferecida / data de prova / prova especial | horário ("Nova disciplina oferecida"); "Nova data"; "Prova especial"; "Aluno" |
| Histórico / estágio / isenção / plano de ensino | "Nova Situação"; estágio ("Feriado"); "Adicionar Isenção"; elemento do plano |
| Alunos×disciplinas | "Selecione os alunos" |
| E-mail / SMS / relacionamento | "Email" (3×, com sub-diálogos de modelo e de imagem); "SMS" (2×); "Filtro por Curso", "Filtro Manual", "Filtro Turma" (2× cada); "Destinatarios" (2×); "Histórico"; "Novo registro de Ligação"; visualização do e-mail |

---

## 2. Moldura e navegação

Tudo está em `sharedservices/form-template/form-template.component.html` e `sharedservices/top-bar-menu/`. A moldura é instanciada **por tela** (cada rota recria menu e faixa), não por um layout de rota.

- **Estrutura**: `container-global` com `container-left` (menu) e `container-right` (faixa + conteúdo) (`form-template.component.html:1-13`).
- **Faixa superior** (`top-bar-menu/top-bar-new/top-bar-new.component.html:9-28`): logo branco horizontal da UCAM à esquerda; à direita o painel do usuário, um botão de ícone `mail` que abre o painel lateral de notificações, e "Sair" (`exit_to_app`).
- **Faixa do projeto** dentro do conteúdo: ícone `layers` + `<h1>` com o nome do sistema (`form-template.component.html:14-19`).
- **Menu lateral** (`top-bar-menu/menu-new/menu-new.component.html`): botão hambúrguer (`menu` / `close`) que recolhe para só ícones; primeiro item fixo "Página Inicial" (`home`, `routerLink="/home"`); os demais vêm do backend em **dois níveis** (grupo com ícone → itens), como acordeão do Materialize; ícone do grupo vem do dado (`menu.icone`, padrão `priority_high`); o item navega para `/{subMenu.link}`. Não há indicação de item ativo no template, nem busca, nem favoritos. Os grupos e itens reais **não estão no código** (vêm de `GET /usuario/menus/{usuario}/aplic05/{unidade}`).
- **Conta** (`top-bar-menu/user-panel-new/user-panel-new.component.html`): foto do usuário (ou a inicial do nome), nome capitalizado e, abaixo, o **seletor de unidade** — dropdown com a sigla da unidade atual e a lista `usuario.unidades`. Não há menu de conta (perfil, senha, tema).
- **Troca de unidade** (`sharedservices/auth.services.ts:136-140`): grava no `localStorage`, emite a nova unidade (o menu é recarregado) e navega para `/home`. Praticamente todas as telas filtram por `unidadeSelecionada`.
- **Notificações** (`top-bar-menu/notification/`): painel lateral direito de 300px (declarado com 35% no HTML) alimentado por WebSocket `{WEBSOCKET_ENDPOINT}/{oid do usuário}`; cada processo mostra tipo, estado, título, subtítulo, barra de progresso determinada e percentual.
- **Login**: o sistema não tem tela de login própria em uso. `logout()` limpa o `localStorage` e redireciona para `LOGIN_URL` (`{login}/login.jsf?client_id=aplic05@{instituição}`) (`auth.services.ts:109-112`); a volta é pela rota `login/:token/:user`, que mostra "Aguarde", busca os dados da pessoa e as unidades e vai para `/home` (`login/login.component.ts:44-53`).
- **Carregamento**: três mecanismos convivem — diálogo `#loading` com círculo de 4 cores (`loading-circle`), bloqueio de painel com "Carregando..." (jQuery BlockUI, 13 chamadas `.block(`), e um overlay global novo com logo + "Carregando..." (`sharedservices/loading/`, usado só pelo filtro de interessados). Antes do Angular subir, `index.html` mostra logo + "Aguarde" + gif.
- **Instâncias** (`src/environments/`): `ucam`, `rio`, `itecam`, `ead`, `homologacao`, `deploy`, `dev`; cada uma aponta para login, API acadêmica, SigFin e WebSocket próprios.
- Classificação: **parcial** — padrão `shell-aplicacao`, componente `app-shell`, base `portal/grade-modulos`. Falta decidir: menu de dois níveis vindo do backend (ícones livres do Material Icons), painel de processos em andamento na faixa, seletor de unidade junto ao nome.

---

## 3. Peças usadas com contagem

Contagens por `grep` em todos os `.html` de `src/app` (ocorrências, não arquivos).

### 3.1 Tags e diretivas

| Peça | Ocorrências | Observação |
|---|---|---|
| `<input` | 233 | texto na grande maioria; 17 `type="checkbox"`, 2 `type="file"`, 1 `type="number"` |
| `material-icons` | 219 | ícones por ligadura; 1 uso de Font Awesome (`fa fa-chevron-down`) |
| `<button` | 159 | classes `btn`, `btn secondary`, `btn-flat secondary` |
| `\| capitalizeWord` | 107 | pipe próprio que põe nomes em caixa de título |
| `<select materialize="material_select"` | 94 | todo select é o do Materialize |
| `class="modal"` | 48 | diálogos |
| `mask=` / `[mask]=` | 45 | diretiva própria sobre jQuery Mask |
| `<table` com `[mfData]` | 38 | angular2-datatable; 38 `mfBootstrapPaginator` |
| `btn-flat table-icon` | 36 | ícones de editar/excluir na linha |
| `<app-form-template` | 33 | moldura + dois painéis |
| `class="progress` | 20 | barra indeterminada sob o campo de busca |
| `class="card"` | 18 | cartões de aluno, pessoa, documento, destinatário etc. |
| `class="switch"` | 16 | seleção em lote e booleanos |
| `class="error"` (span) | 16 | mensagem sob o campo (minoria; o padrão é toast) |
| `<app-autocomplete` / `<app-option` | 15 / 15 | autocomplete próprio |
| `materialize="pickadate"` | 14 | datepicker do Materialize, traduzido em `src/util.js` |
| `dropdown-button` | 11 | dropdown com segunda linha (calendário, regime, curso, turma, unidade) |
| `materialize="tabs"` | 10 | + 1 `ul.tabs` iniciado por jQuery no histórico do interessado |
| `class="sub-title"` (h2) | 6 | subtítulo de seção |
| `<textarea` | 5 | |
| `class="chip"` | 4 | destinatários |
| `\| turno` | 4 | M/T/N → MANHÃ/TARDE/NOITE |
| `\| boolean` | 1 | Sim/Não |

Retorno ao usuário no código: 129 chamadas a `showAlert` (diálogo de alerta) e 5 a `Materialize.toast` (fora a diretiva de erros de formulário).

### 3.2 Componentes próprios

| Componente | Usos em template | Papel |
|---|---|---|
| `app-form-template` | 33 | moldura + painéis Novo/Pesquisar + alerta + loading |
| `app-tipo-basico-form` | 10 | CRUD genérico dirigido por lista de campos |
| `app-autocomplete` + `app-option` | 15 | campo com sugestões (mínimo de caracteres, espera de 500 ms, barra de progresso fina) |
| `app-calendarioregimecurso` | 6 | filtro em cascata Calendário → Regime → Curso (emite as disciplinas oferecidas) |
| `app-filtro-calendario-regime` | 3 | dropdowns Calendario e Regime (regimes agrupados por tipo) |
| `app-disciplinaoferecidaturma` | 2 | cascata anterior + Disciplina oferecida + Turma (emite os alunos) |
| `app-filtro-aluno` | 2 | foto + matrícula + autocomplete de aluno |
| `app-filtro-curso-turma` | 1 | dropdowns Curso e Turma |
| `app-filtro-interessado` | 2 | filtros + cartões de interessados + "Exportar" |
| `app-filtro-aluno-curso` | 0 | sem uso |
| `app-card-aluno` | 5 | cartão de aluno com foto |
| `app-card-pessoa` | 1 | cartão de pessoa (professor) |
| `app-card-aluno-disciplina` | 1 | cartão de inscrição em disciplina |
| `app-card-documento` | 1 | cartão de arquivo com Download/Remover |
| `app-card-disciplina-dataprova` | 1 | cartão com mini-calendários por tipo de prova |
| `app-topo-aluno` | 4 | cabeçalho só leitura do aluno |
| `app-foto-pessoa` | 5 | foto com "Alterar" (abre câmera) |
| `app-camera` | 1 | webcam + recorte (`img-cropper`) |
| `app-endereco` / `app-telefone` | 5 / 5 | sublistas com diálogo |
| `app-busca-pessoa` | 3 | diálogo "Digite o cpf" |
| `app-documentosescaneados` | 1 | upload e grade de documentos |
| `app-interessado-curso` | 1 | sublista de cursos de interesse |
| `app-email` / `app-sms` | 2 / 2 | compositores |
| `app-item-destinatario` | 2 | cartão de grupo de destinatários (há duas cópias, e-mail e SMS) |
| `app-interessado` (relacionamento) + `app-registro-mensagem` | 1 + 3 | cartão de lead e registro de contato |
| `app-paginate` | 1 | paginação própria (ngx-pagination) |
| `app-menu-new`, `app-top-bar-new`, `app-user-panel-new`, `app-notification`, `app-process-notification` | 1 cada | moldura |
| `app-loading`, `app-loading-circle` | 1 cada | carregamento |

Pipes: `capitalizeWord`, `boolean`, `turno`, `fristLetter`. Diretivas: `[mask]`, `form [formGroup]` (toasts de erro no submit), `input, textarea` (injeta `placeholder=""`).

### 3.3 Bibliotecas (`package.json`, `.angular-cli.json`)

| Função | Biblioteca | Uso |
|---|---|---|
| Framework | Angular `^5.1.3`, RxJS `^5.5.10`, TypeScript `^2.4.2` | — |
| Estilo / componentes | `materialize-css ^0.98.2` via `angular2-materialize ^15.1.10`; jQuery; Hammer | select, modal, tabs, dropdown, collapsible, sideNav, pickadate, toast |
| Tabela | `angular2-datatable ^0.6.0` | 38 tabelas, paginação no cliente |
| Paginação | `ngx-pagination ^3.1.1` | 1 tela (relacionamento) |
| Editor rico | `tinymce ^4.7.7` via `angular-tinymce ^5.0.0` | 1 uso (`app-email`); `@tinymce/tinymce-angular` e `angular2-tinymce` também estão no `package.json`, sem import encontrado |
| Máscara | `jquery-mask-plugin` (carregado em `.angular-cli.json:36`; **não** está em `dependencies`) + diretiva própria; `ng2-input-mask 0.0.7` no `package.json` sem import encontrado | 45 campos |
| Câmera / recorte | `ng2-img-cropper ^0.8.8` | foto da pessoa |
| WebSocket | `angular2-websocket ^0.9.3` | notificações de processo |
| Bloqueio de painel | `block-ui ^2.70.1` | 13 chamadas |
| Datas | `moment ^2.18.1` (pt-br em `src/util.js`) | — |
| Coleções | `lodash`, `linqts` | agrupar/ordenar no cliente |
| Arquivos | `mime-types` | abrir download em nova aba |
| Ícones | Material Icons (Google Fonts em `src/index.html:9`), `font-awesome ^4.7.0` | — |
| Identificador | `uuid` (import em `paginas/envio-sms/filtros/filtro-manual/filtro-manual.component.ts:6`; não está no `package.json`) | destinatário manual de SMS |
| Gráficos | **nenhuma** | não há gráfico no sistema |

---

## 4. Regras de negócio lidas no código

Tipos: validação, permissão, transição de situação, cálculo, prazo, limite, formato, integração. O front valida pouco: a maior parte das regras é "campo obrigatório" e tamanho máximo; regras de cálculo (média, frequência, CR, geração de matrícula) estão no backend e aparecem aqui só como chamada.

### 4.1 Acesso e sessão

1. **A entrada é por token vindo do login central.** A rota `login/:token/:user` busca os dados da pessoa e as unidades do usuário e guarda a sessão no navegador; se falhar, sai. — `login/login.component.ts:44-59`; `sharedservices/auth.services.ts:23-39` — integração — chaves do `localStorage`: `usuario`, `unidadeSelecionada`.
2. **Existe login por usuário e senha no código, sem formulário na tela.** `POST {login}/api/auth/token` com `grant_type=password`, `client_id={APLICATION}`, `client_secret=aaa`; erro 400 vira "Erro ao logar: " + descrição, os demais "Erro ao logar: {status} - {texto}". — `sharedservices/auth.services.ts:54-64`, `:100-103`; `login/login.component.html:41-44` — integração.
3. **Toda tela exige que o usuário esteja autorizado ao recurso do sistema.** O guard consulta `authorize_resource` com o recurso `EXTENSAO-ANGULAR`; se negar ou falhar, encerra a sessão. Não há permissão por tela ou por ação. — `sharedservices/auth-guard.service.ts:12-19`; `sharedservices/auth.services.ts:116-131` — permissão.
4. **Toda chamada à API leva token, usuário e recurso; resposta 401 encerra a sessão** e manda para o login central. — `sharedservices/userAuthHttpInterceptor.ts:14-22`; `sharedservices/auth.services.ts:109-112` — permissão — cabeçalhos `Authorization: Bearer`, `usuario`, `resource`.
5. **O usuário trabalha em uma unidade por vez.** A unidade inicial é a primeira da lista; trocar de unidade leva à página inicial. — `sharedservices/auth.services.ts:37`, `:92`, `:136-140` — permissão.
6. **O menu depende do usuário, da aplicação e da unidade** e é recarregado a cada troca de unidade. — `sharedservices/top-bar-menu/menu-new/menu-new.services.ts:17`; `menu-new.component.ts:22-23` — permissão — aplicação fixa `aplic05`.
7. **O nome do sistema muda por instituição.** — `sharedservices/globals-variables.service.ts:13-18` — formato — `@itecam` → "Acadêmico - ITECAM"; demais → "Acadêmico - Pós-Graduação / Extensão".
8. **Processos demorados informam andamento em tempo real.** Cada mensagem do WebSocket traz um processo com `id`, `status` ("título-subtítulo"), `typeEnum`, `stateEnum` e `progressFormated` (%). — `sharedservices/top-bar-menu/notification/notification.component.ts:19-27`; `notification/process-notification/process-notification.component.ts:24-28` — integração.

### 4.2 Formato e comportamento comuns

9. **Data válida é dia/mês/ano real** (considera meses de 30/31 dias e ano bissexto; aceita `/`, `-` ou `.`). — `validators/custom-validators.ts:5-12` — validação.
10. **Campo numérico aceita só dígitos.** — `validators/custom-validators.ts:15-21` — validação.
11. **Erro de preenchimento aparece como aviso flutuante por 7 segundos ao enviar**, um por campo. — `sharedservices/directives/form-erros.directive.ts:28`, `:38-66` — validação — "O campo {rótulo} é obrigatório", "O campo {rótulo} não é uma data válida", "O campo {rótulo} não é um número válido", "O campo {rótulo} é inválido".
12. **Máscaras previstas.** — `sharedservices/input-mask/mask.service.ts:6-19` — formato — data `00/00/0000`, hora `00:00:00`, CEP `00000-000`, fixo `(00) 0000-0000`, celular `(00) 00000-0000`, CPF `000.000.000-00`, CNPJ `00.000.000/0000-00`, dinheiro `#.##0,00`, percentual `##0,00%`. Nas telas o CPF é digitado **sem pontuação** (`00000000000`).
13. **Turno é uma letra.** — `sharedservices/pipes/turno.pipe.ts:10-16` — formato — `M` MANHÃ, `T` TARDE, `N` NOITE, outro valor "SEM TURNO".
14. **Nomes são exibidos em caixa de título**, mantendo em minúscula "de", "da", "do", "dos", "em", "e", "à". — `sharedservices/pipes/capitalize-word.pipe.ts:10-17` — formato.
15. **A busca dispara sozinha meio segundo depois de parar de digitar; a sugestão só começa com o mínimo de caracteres e mostra até 10 itens.** — `sharedservices/tipo-basico-form/tipo-basico-form.component.ts:89`; `sharedservices/autocomplete/autocomplete.component.ts:111-112`; `sharedservices/filters/filtro-aluno/filtro-aluno.component.html:16-17` — limite — 500 ms; mínimo 3 (0 em período de inscrição); 10 itens (20 em módulo).
16. **Registro duplicado e registro com dependência têm mensagem própria.** — `sharedservices/tipo-basico.services.ts:94-95`, `:112-113`, `:125-126`; `paginas/curso/curso.services.ts:80-81` — validação — HTTP 409 → "Existe um registro cadastrado com essas informações"; HTTP 406 → "Impossivel deletar registro. O registro possui dependências"; demais → "Erro: {status} - {texto}".
17. **Documentos pessoais têm código de tipo fixo e todo registro novo nasce ativo.** — `paginas/aluno/aluno.component.ts:83-109` — formato — `01` cpf, `02` identidade, `03` certificado (reservista), `04` titulo; `status: "A"`.
18. **Excluir não pede confirmação** em nenhuma tela; a exclusão é chamada no clique. — `sharedservices/tipo-basico-form/tipo-basico-form.component.ts:130-132`; `paginas/calendario-academico/feriado/feriado.component.ts:109-111` — transição de situação — mensagens "Registro deletado!" / "Erro ao deletar!".

### 4.3 Cadastros de apoio

19. **Nos cadastros básicos todo campo é obrigatório e só se exclui registro já salvo.** — `sharedservices/tipo-basico-form/tipo-basico-form.component.ts:45`, `:109`, `:134`, `:154-155` — validação — "Registro cadastrado!", "Erro ao cadastrar!".
20. **Tamanhos máximos dos cadastros básicos.** — `paginas/cadastros-parametros/atividade-academica/atividade-academica.component.ts:22`; `.../disciplina/disciplina.component.ts:21-29`; `.../estabelecimento-ensino/estabelecimento-ensino.component.ts:17-24`; `.../modalidade/modalidade.component.ts:19`; `.../situacao-disciplina/situacao-disciplina.component.ts:18`; `.../situacao-matricula/situacao-matricula.component.ts:18`; `.../tipo-documento/tipo-documento.component.ts:20`; `.../tipo-prova/tipo-prova.component.ts:19-22` — limite — atividade 120; disciplina: sigla 10, crédito 2, carga horária 3, descrição 120; estabelecimento: sigla 10, descrição 250, cidade 100; modalidade 100; situações 100; tipo de documento 50; tipo de prova: nome 100, descrição 100.
21. **Atividade acadêmica e disciplina pertencem à unidade ativa**; os demais cadastros básicos são globais. — `.../atividade-academica/atividade-academica.component.ts:17`, `:29`, `:34`; `.../disciplina/disciplina.component.ts:17`, `:44`, `:49` — permissão.
22. **Horário exige dia da semana, hora de início e hora de fim**; o front calcula um código antigo de dia (código + 1; 8 vira 0). — `paginas/cadastros-parametros/horario/horario.component.ts:43-46`, `:52-57` — validação / cálculo.
23. **Turma exige ano, início, fim, curso e descrição.** — `paginas/cadastros-parametros/turma/turma.component.ts:53-58` — validação — ano numérico até 4 dígitos; número da turma numérico até 4; descrição até 100.
24. **Período de inscrição exige curso, início e fim; se "Possui boleto" estiver ligado, valor e descrição do recebimento passam a ser obrigatórios; desligado, os dois são limpos e bloqueados.** — `paginas/periodo-interessado-curso/periodo-interessado-curso.component.ts:52-58`, `:62-77`; `periodo-interessado-curso.component.html:34-37`, `:52-53` — validação / prazo — exibição: `UCAM`, `CENTRAL_POSGRADUACAO`, `CEPEFER`, `TODOS`; valor com até 2 casas.
25. **Tipo de regime e regime têm descrição obrigatória de até 120 caracteres; regime só existe dentro de um tipo salvo.** — `paginas/tipo-regime/tipo-regime.component.ts:37`; `paginas/tipo-regime/regime/regime.component.ts:35-36`, `:118-119` — validação.
26. **Prédio exige sigla e descrição; sala exige nome, largura, comprimento e capacidade e só existe em prédio salvo.** — `paginas/predio/predio.component.ts:41-43`; `paginas/predio/sala/sala.component.ts:36-41`, `:133-134` — validação.
27. **Curso exige código, nome, área de conhecimento, modalidade e tipo de curso.** — `paginas/curso/curso.component.ts:48-64` — validação — código até 3; código do Censo até 10; créditos e durações numéricos.
28. **Reconhecimento do curso exige todos os campos.** — `paginas/curso/reconhecimento/reconhecimento.component.ts:37-43`, `:133-134` — validação — nº do parecer e nº do documento até 30; descrição até 200; datas válidas.
29. **Calendário acadêmico pertence à unidade, exige ano e as duas datas, e a data de início não pode passar da de fim** (o calendário de escolha limita uma pela outra). A busca só filtra por ano e só quando o texto é número. — `paginas/calendario-academico/calendario-academico.component.ts:42-57`, `:66-69`, `:104-105` — validação / prazo.
30. **Regimes, atividades e feriados só podem ser incluídos depois de salvar o calendário; regime ainda exige escolher o tipo de regime.** Todos exigem datas; regime e atividade aplicam a mesma trava início ≤ fim. — `paginas/calendario-academico/regime/regime.component.ts:43-46`, `:68-83`, `:182-187`; `.../atividade-academica/atividade-academica.component.ts:40-43`, `:64-79`, `:161-162`; `.../feriado/feriado.component.ts:40-43`, `:133-134` — validação / prazo.
31. **Na grade do curso o módulo é opcional ("Sem Módulo") e cada disciplina pode ser marcada como "Apenas situação"** (sem nota, só aprovado/reprovado — interpretação **não confirmada**; o campo é `situacaonota`, padrão falso). Módulo tem descrição e ordem obrigatórias até 20 caracteres. — `paginas/disciplinacurso/disciplina/disciplina.component.ts:32`, `:45-48`, `:126`; `paginas/disciplinacurso/modulo/modulo.component.ts:43-45` — validação. Observação factual: ao salvar, o código compara a ordem com `'Sem_modulo'` (`:160`) enquanto o módulo virtual tem ordem `'sem-modulo'` (`:32`).
32. **Disciplina oferecida exige ano, calendário, regime, curso, turno, código da turma e disciplina da grade do curso.** — `paginas/disciplinaoferecida/disciplinaoferecida.component.ts:48-56`, `:186-188`; `disciplinaoferecida.component.html:55-57` — validação — turno `M`/`T`/`N`.
33. **Horário da disciplina oferecida exige professor, sala e horário; os horários oferecidos são os do dia escolhido na unidade; só após salvar a disciplina oferecida.** — `paginas/disciplinaoferecida/horariodisciplinaoferecida/horariodisciplinaoferecida.component.ts:54-57`, `:103-104`, `:215-216` — validação.

### 4.4 Pessoas

34. **Pessoa exige nome, sexo, naturalidade e data de nascimento.** — `sharedservices/form-template/form-template.services.ts:34-37`, `:48`, `:57`, `:66-68`, `:78-79`; `paginas/aluno/aluno.component.html:85-86` — validação — sexo `F`/`M`; CPF com exatamente 11 dígitos; identidade até 20; reservista: número só dígitos, categoria até 30, órgão até 60; título: zona e seção numéricas até 10.
35. **Documento sem número não é enviado** (identidade, título, reservista e CPF); campos nulos e blocos vazios são retirados antes de gravar. — `paginas/pessoa/pessoa.services.ts:22-45`, `:47-56` — integração.
36. **Cadastro novo de professor, funcionário e interessado começa pela busca do CPF.** Se a pessoa existe, a ficha vem preenchida; se não, abre vazia só com o CPF. — `paginas/pessoa/busca-pessoa/busca-pessoa.component.ts:30`, `:40-52`; `paginas/funcionario/funcionario.component.ts:130-137`; `paginas/professor/professor.component.ts:130-138`; `paginas/interessado/interessado.component.ts:128-136` — validação — CPF obrigatório com 11 dígitos.
37. **Aluno regular não é criado nem excluído por esta tela** (não há "Novo"; a exclusão está desligada); matrícula é obrigatória ao salvar; a busca traz só alunos do tipo regular. — `paginas/aluno/aluno.component.html:1`; `paginas/aluno/aluno.component.ts:122`, `:169`, `:217-218` — permissão — tipo `REGULAR`.
38. **Dados escolares.** — `paginas/aluno/aluno.component.ts:132-134`; `paginas/aluno/aluno.component.html:274-276`; `paginas/aluno/aluno.services.ts:39-41` — validação / limite — nível `1` Ensino Fundamental, `2` Ensino Médio, `3` Ensino Superior; ano de conclusão numérico até 4; cidade até 50; grau obtido até 300; sem estabelecimento de ensino o bloco inteiro não é gravado.
39. **Aluno especial é cadastrado direto, com estabelecimento de ensino obrigatório, e a matrícula não é digitada**; grava-se com o ano corrente. Disciplinas só podem ser incluídas depois de salvar a pessoa, e a busca de disciplina é limitada ao curso escolhido. — `paginas/aluno-especial/aluno-especial.component.ts:143`, `:180`, `:196-199`, `:230-231`, `:277-278`; `aluno-especial.component.html:10-12` — validação / integração — tipo `ESPECIAL`; `POST /aluno/especial/{ano}`.
40. **Professor: matrícula obrigatória e três classificações de docência.** — `paginas/professor/professor.component.ts:108`; `paginas/professor/professor.component.html:243-246`, `:255-267`, `:276-278` — validação / formato — titulação: `GR` Graduação, `PG` Pos Graduação(Latu Sensu), `MS` Mestrado, `DR` Doutorado; cargo: `PROFESSOR_ADJUNTO_20_HORAS`, `PROFESSOR_ADJUNTO_40_HORAS`, `PROFESSOR_ASSISTENTE`, `PROFESSOR_ASSISTENTE_20_HORAS`, `PROFESSOR_ASSISTENTE_30_HORAS`, `PROFESSOR_ASSISTENTE_40_HORAS`, `PROFESSOR_AUXILIAR`, `PROFESSOR_AUXILIAR_20_HORAS`, `PROFESSOR_TITULAR_20_HORAS`, `PROFESSOR_TITULAR_40_HORAS`, `PROFESSOR_ADVOGADO_INSTRUTOR_FUCAM`, `PROFESSOR_INSTRUTOR_20_HORAS`, `PROFESSOR_INSTRUTOR_40_HORAS`; regime de trabalho: `HORISTA`, `TEMPO_INTEGRAL_SEM_DE`, `TEMPO_PARCIAL`.
41. **Funcionário: matrícula obrigatória; quando o servidor recusa (400), cada motivo aparece em aviso de 10 segundos.** — `paginas/funcionario/funcionario.component.ts:111`, `:172-174` — validação.
42. **Endereço exige logradouro, número, bairro, cidade, UF, CEP e tipo.** — `paginas/pessoa/endereco/endereco.component.ts:41-53`, `:73`, `:142-143` — validação — número só dígitos; cidade até 50; CEP de 8 a 9 caracteres; logradouro até 100; bairro até 30; complemento até 50; "Correspondência" nasce "Não"; só para pessoa já salva.
43. **Telefone exige DDD, número e tipo.** — `paginas/pessoa/telefone/telefone.component.ts:31-33`; `paginas/pessoa/telefone/telefone.component.html:47`, `:54`, `:64-65` — validação — DDD 2 dígitos; número de 8 a 9; tipo `RESIDENCIAL` ou `CELULAR`.
44. **A foto é tirada pela webcam e recortada em proporção 3×4.** — `sharedservices/camera/camera.component.ts:47-58`; `paginas/pessoa/pessoa.services.ts:163-167` — formato — captura 320×240; recorte 75×100, saída 112,5×150; enviada em base64 com a pessoa e a unidade.
45. **Documento escaneado exige tipo e arquivo, só para aluno já salvo.** — `paginas/aluno/documentosescaneados/documentosescaneados.component.html:39`; `documentosescaneados.component.ts:71`, `:96-97` — validação — extensões `.pdf, .jpg, .png, .bmp, .jpeg, .tif`; tipos vêm de `GET /basico/tipodocumentoescaneado`.

### 4.5 Interessados, matrícula e comunicação

46. **Interessado exige naturalidade e data de nascimento; o CPF não pode ser alterado depois da busca.** — `paginas/interessado/interessado.component.ts:96-97`; `paginas/interessado/interessado.component.html:67-70` — validação.
47. **A lista de interessados começa em janeiro do ano corrente e pode ser filtrada por tipo de curso, curso, documentos e situação.** — `sharedservices/filters/filtro-interessado/filtro-interessado.component.ts:29`, `:52-53`, `:114-119`, `:129-130`; `filtro-interessado.component.html:34-36`, `:73-74` — formato — situações `PENDENTE`, `CONFIRMADO`, `MATRICULADO`; documentos `TODOS`, `COM_DOCUMENTOS`, `SEM_DOCUMENTOS`; indicador "OK" / "PENDENTE" conforme `fezUploadDocumentos`.
48. **A lista filtrada pode ser exportada em planilha.** — `sharedservices/filters/filtro-interessado/filtro-interessado.component.ts:148-160` — integração — `POST /pessoa/interessado/exportar`, resposta `application/vnd.ms-excel`.
49. **A tela de matrícula não lista todas as situações de interessado; a tela de interessado lista.** — `paginas/geracao-matricula/geracao-matricula.component.html:177`; `paginas/interessado/interessado.component.html:150`; `sharedservices/filters/filtro-interessado/filtro-interessado.component.ts:98` — permissão — parâmetro `todassituacoes` `false` × `true` (quais situações ficam de fora é decisão do backend: **não confirmado**).
50. **Para matricular é obrigatório escolher a turma e preencher todos os dados escolares; o turno nasce "Manhã".** — `paginas/geracao-matricula/geracao-matricula.component.ts:60`, `:105-109`, `:117`, `:152-153`, `:178` — validação — "O campo Turma é obrigatório".
51. **Matricular gera a matrícula no servidor e avisa o financeiro.** — `paginas/geracao-matricula/geracao-matricula.component.ts:155-166`; `paginas/geracao-matricula/geracao-matricula.services.ts:19`, `:46` — transição de situação / integração — "Aluno matriculado com sucesso! Matricula gerada: {matrícula}"; `POST {SigFin}/matricula/notificamatriculaextensao` com o `oid` do aluno.
52. **O curso da matrícula é escolhido entre os cursos em que a pessoa demonstrou interesse; as turmas são as do curso na unidade.** — `paginas/geracao-matricula/geracao-matricula.component.ts:187-194`, `:216-220` — validação.
53. **Relacionamento: período padrão desde janeiro do ano corrente; "Matriculado" significa ter data de matrícula; todos entram selecionados.** — `paginas/relacionamento-interessado/relacionamento-interessado.component.ts:26-30`, `:66`, `:76-77`, `:103-106`; `relacionamento-interessado.component.html:56` — formato — situações `TODOS`, `MATRICULADO`, `NAO-MATRICULADO`; 9 por página.
54. **Cada contato com o interessado fica registrado por canal; ligação é registrada à mão.** — `paginas/relacionamento-interessado/interessado/interessado.component.ts:65-67`, `:75-77`, `:88-93` — formato — tipos `EMAIL`, `SMS`, `LIGACAO`; sem e-mail ou sem telefone o canal aparece indisponível.
55. **Envio em massa não repete a mesma pessoa.** — `sharedservices/email/email.component.ts:145-150`; `paginas/relacionamento-interessado/relacionamento-interessado.component.ts:134-137`, `:146`, `:170` — validação — "Foram enviados {total} emails", "Foram enviados {total} sms".
56. **Destinatários de e-mail e SMS são montados por filtros somáveis.** Escolher um curso específico trava tipo de curso e modalidade em "Todos". — `paginas/envio-email/filtros/filtro-curso/filtro-curso.component.ts:15`, `:85-96`, `:104-110`; `paginas/envio-email/filtros/filtro-turma/filtro-turma.component.ts:17`, `:82-86`; `paginas/envio-email/envio-email.component.ts:56-68`, `:92` — formato — filtros `ALUNOS_DO_CURSO`, `ALUNOS_DA_TURMA` e entrada manual; "Sua mensagem foi encaminhada ao servidor, dentro de alguns minutos será enviada!".
57. **SMS tem indicação de 120 caracteres; destinatário manual tem DDD de 2 e número de 9 dígitos.** — `sharedservices/sms/sms.component.html:14`; `paginas/envio-sms/filtros/filtro-manual/filtro-manual.component.html:12`, `:18` — limite (o front só conta, não bloqueia: **não confirmado** se o servidor corta).
58. **E-mail pode partir de um modelo pronto; escolher o modelo substitui assunto e corpo. Até 8 destinatários aparecem pelo nome; acima disso, só a contagem.** — `sharedservices/email/email.component.ts:104-106`, `:127-131`; `sharedservices/email/email.component.html:2`, `:7-8` — formato — "{n} Pessoas selecionadas".

### 4.6 Vida acadêmica

59. **Inscrição do aluno em disciplina exige disciplina e situação; pode ser feita por disciplina ou por módulo inteiro (todas as disciplinas do módulo no regime escolhido).** A lista é agrupada por ano do calendário. — `paginas/alunodisciplinaoferecida/alunodisciplinaoferecida.component.ts:60-62`, `:140-148`, `:184`, `:260` — validação.
60. **Inscrição em lote (turma × disciplinas) exige ao menos um aluno e uma disciplina; se algum registro falhar, o servidor devolve uma planilha com os detalhes.** — `paginas/cadastro-alunos-disciplinas/cadastro-alunos-disciplinas.component.ts:218-219`, `:228-243` — validação / integração — "Registro cadastrado!"; "Alguns registros não foram salvos, um arquivo será gerado com os detalhes."; "Para processar, selecione ao menos um aluno e uma disciplina."
61. **Na tela "Disciplina oferecida x alunos" a situação não é obrigatória**, e o aluno é procurado no curso da disciplina. — `paginas/disciplinaoferecidaaluno/disciplinaoferecidaaluno.component.ts:60-62`, `:119-120`, `:158` — validação.
62. **Data de prova exige tipo, data e horário; os horários oferecidos são os cadastrados para o dia da semana da data** (domingo conta como 7). — `paginas/dataprova/detail/detail.component.ts:40-43`, `:50-54`, `:74-75` — validação / prazo.
63. **Prova especial exige tipo de prova, data da prova e data de entrega; os alunos só são incluídos depois de salvá-la, entre os inscritos na disciplina.** — `paginas/provaespecial/provaespecial.component.ts:47-51`, `:89`, `:149-150`; `paginas/provaespecial/provaespecialalunodisciplinaoferecida/provaespecialalunodisciplinaoferecida.component.ts:131-132`, `:148` — validação — tipo fixo `ES`.
64. **As colunas de nota e a nota máxima de cada prova vêm da fórmula de avaliação da disciplina.** Nota acima da máxima é descartada com aviso; vírgula vira ponto; apagar a nota marca o registro como excluído. — `paginas/nota/nota.component.ts:43-56`, `:60-61`, `:73-80`, `:127-131` — validação / cálculo — "A nota deve ser menor que {nota máxima}"; nota ausente é representada por `-1`; exclusão por `status = "D"`.
65. **A média exibida não é calculada na tela** (vem do registro do aluno na disciplina). — `paginas/nota/nota.component.html:47` — cálculo.
66. **Falta só pode ser lançada em dia com conteúdo de aula registrado, dentro do período do regime; cada marcação grava na hora e alterna entre falta ativa e removida.** O total vem com percentual. — `paginas/falta/falta.component.ts:50-60`, `:63-70`, `:85-107`, `:175-176`; `paginas/falta/falta.component.html:45` — validação / prazo / transição de situação — status `A` ↔ `D`.
67. **O cálculo acadêmico é pedido ao servidor e roda depois**, por curso, disciplina oferecida, turma ou aluno, com as opções escolhidas (todas ligadas no início). — `paginas/calculo-academico/calculo-academico.component.ts:15`, `:28-33`; `paginas/calculo-academico/calculo-curso/calculo-curso.component.ts:75-92`; `paginas/calculo-academico/calculo-academico.services.ts:189`, `:211`, `:227`, `:243` — cálculo / integração — opções `MEDIA`, `SITUACAO_MEDIA`, `SITUACAO_FREQUENCIA`, `CR`; "Calculo enviado para o servidor"; "Erro ao enviar o calculo para o servidor".
68. **Plano de ensino tem quatro estados.** Abrir uma disciplina sem plano cria o plano "em elaboração"; a tela permite aprovar ou reprovar a qualquer momento, sem checar o estado anterior. — `paginas/planoensino/planoensino.component.ts:79-88`, `:161-166`, `:169-178` — transição de situação — `NÃO INICIADO` (sem registro), `EM ELABORACAO` (gravado sem acento; exibido "EM ELABORAÇÃO"), `APROVADO`, `REPROVADO`; descrição padrão "Plano de ensino da disciplina {código}".
69. **Histórico de situação do aluno: a situação é obrigatória; depois de registrada, só a observação pode ser alterada.** — `paginas/historico-aluno/historico-aluno.component.ts:57`, `:129`, `:137-138` — transição de situação — as situações vêm do cadastro "Situação da matricula".
70. **Isenção exige ano e disciplina, e a disciplina é limitada à grade do curso do aluno.** — `paginas/isencao/isencao.component.ts:45-47`, `:61-63` — validação.
71. **Estágio supervisionado exige local, carga horária, início e término.** — `paginas/estagiosupervisionado/estagiosupervisionado.component.ts:48-52`, `:97` — validação.
72. **Troca de turma só é liberada depois de escolher a turma de destino; não há confirmação.** — `paginas/troca-turma/troca-turma.component.html:11`; `paginas/troca-turma/troca-turma.component.ts:69-77` — transição de situação — "Troca de turma efetuada com sucesso!".

---

## 5. API consumida

Bases (`sharedservices/globals-variables.service.ts:4-10`; valores em `src/environments/`): `ACADEMICO` = `{host}/Extensao-WEB/rest`; `LOGIN` = host do login central; `FINANCEIRO` = `{host}/SigFin/webservice`; `WEBSOCKET` = `{host}/Extensao-WEB`.

Convenções: gravação responde com cabeçalho `Location` e o front faz um `GET` nele para obter o registro; busca genérica envia uma lista de `SearchData {campo, comparador, valor, conectorLogico}` (`sharedservices/model/search-data.model.ts:1-9`; comparadores usados: `=`, `like`; conector `and`/`or`); parâmetros de consulta: `orderBy`, `to`, `searchTerm`, `cpf`. Datas trafegam como texto `dd/mm/aaaa`.

### 5.1 Endpoints por serviço

**AuthService** (`sharedservices/auth.services.ts`)
- `GET {ACADEMICO}/usuario/pessoa/{oidUsuario}` (`:25`, `:73`)
- `GET {ACADEMICO}/usuario/unidades/{oidUsuario}` (`:32`, `:86`)
- `POST {LOGIN}/api/auth/token` (form-urlencoded) (`:64`)
- `GET {LOGIN}/api/auth/authorize_resource` (`:125`)

**MenuNewServices** — `GET /usuario/menus/{oidUsuario}/aplic05/{oidUnidade}` (`sharedservices/top-bar-menu/menu-new/menu-new.services.ts:17`)

**Notificações** — WebSocket `{WEBSOCKET}/{oidUsuario}` (`sharedservices/top-bar-menu/notification/notification.component.ts:19`)

**TipoBasicoServices** (`sharedservices/tipo-basico.services.ts`)
- `GET /basico/{tipo}` (`:35`) — tipos lidos: `estadocivil`, `nacionalidade`, `unidadefederativa`, `raca`, `tiporegime`, `tipocurso`, `modalidade`, `tipodocumento`, `tipoendereco`, `situacaodisciplina`, `situacaomatricula`, `diasemana`, `tipoprova`
- `POST /basico/{tipo}` busca por `SearchData[]` (`:48`) — tipos buscados: os 10 de G1 mais `calendarioacademico`, `calendarioregime`, `calendarioatividadeacademica`, `feriado`, `regime`, `horario`, `turmacurso`, `unidadecurso`, `modulo`, `disciplinaunidadecurso`, `sala`, `predio`, `dataprova`, `reconhecimento`, `isencao`, `estagiosupervisionado`, `provaespecial`, `provaespecialalunodisciplinaoferecida`, `documentoescaneado`, `recebimentodiverso`
- `GET /basico/municipio/{uf}` (`:61`)
- `GET /basico/tipodocumentoescaneado` (`:73`)
- `POST /basico/{schema}/{tipo}` grava (`:104`) — schemas `extensao` e `academico`
- `DELETE /basico/{tipo}/{oid}` (`:121`)
- `POST /aluno/{oidAluno}/documentoescaneado/{tipo}` multipart, campo `documento` (`:86`)
- `GET /arquivos/documentoescaneado/{oid}` (blob) (`:134`); `GET /arquivos/{path}` (`:144`)
- `GET /aluno/{oid}/calendarioacademico` (via `get(url)`; `sharedservices/filters/filtro-calendario-regime/filtro-calendario-regime.component.ts:55`)

**PessoaServices** (`paginas/pessoa/pessoa.services.ts`)
- `POST /pessoa/persist` (`:58`); `GET /pessoa?cpf=` (`:149`)
- `GET /pessoa/endereco/{oidPessoa}` (`:79`); `POST /pessoa/endereco` (`:89`); `DELETE /pessoa/endereco/{oid}` (`:99`)
- `GET /pessoa/telefone/{oidPessoa}` (`:116`); `POST /pessoa/telefone` (`:125`); `DELETE /pessoa/telefone/{oid}` (`:135`)
- `GET /pessoa/foto/{oidPessoa}` (texto) (`:156`); `POST /pessoa/foto` `{imageBase64, oidpessoa, oidunidade}` (`:171`)

**AlunoServices** (`paginas/aluno/aluno.services.ts`)
- `GET /aluno/{REGULAR|ESPECIAL}/unidade/{oidUnidade}?searchTerm=` (`:27`)
- `POST /aluno` (`:45`); `POST /aluno/especial/{ano}` (`:61`)
- `GET /aluno/{oidAluno}/disciplinaoferecida` (`:79`); `GET /aluno/disciplinaoferecida/{oidDisciplinaOferecida}` (`:96`)
- `POST /aluno/disciplinaoferecida/` (`:110`); `POST /aluno/{oidAluno}/disciplinaoferecidas/` (`:126`); `DELETE /aluno/disciplinaoferecida/{oid}` (`:136`)
- `GET /aluno/notas/{oidAlunoDisciplina}` (`:150`); `POST /aluno/notas` (`:189`)
- `GET /aluno/falta/{oidAlunoDisciplina}/{oidConteudoAula}` (`:163`); `GET /aluno/totalfaltas/{oidAlunoDisciplina}` (`:175`); `POST /aluno/faltas` (`:199`)
- fora do serviço: `GET /aluno/unidade/{oidUnidade}?searchTerm=` (`sharedservices/filters/filtro-aluno/filtro-aluno.component.ts:52`); `GET /aluno/unidadecurso/{oidUnidadeCurso}?searchTerm=` (`paginas/disciplinaoferecidaaluno/disciplinaoferecidaaluno.component.ts:178`)

**HistoricoAlunoServices** — `GET /aluno/{oidAluno}/situacao` (`paginas/historico-aluno/historicoaluno.services.ts:32`); `POST /aluno/{oidAluno}/situacao` (`:48`)

**TrocaTurmaServices** (`paginas/troca-turma/trocaturma.services.ts`) — `GET /curso/unidade/{u}` (`:25`); `GET /curso/{c}/unidade/{u}/turmas` (`:47`); `POST /aluno/{oidAluno}/trocaturma` (`:61`)

**GeracaoMatriculaServices** (`paginas/geracao-matricula/geracao-matricula.services.ts`) — `POST /aluno/interessadocurso/{oidInteressadoCurso}/turmacurso/{oidTurma}` (`:19`); `GET /curso/{c}/unidade/{u}/turmas` (`:36`); `POST {FINANCEIRO}/matricula/notificamatriculaextensao` (`:46`)

**ProfessorServices** — `GET /professor/unidade/{u}?searchTerm=` (`paginas/professor/professor.services.ts:22`); `POST /professor` (`:35`)

**FuncionarioServices** — `GET /funcionario/unidade/{u}?searchTerm=` (`paginas/funcionario/funcionario.services.ts:22`); `POST /funcionario` (`:35`)

**InteressadoServices** (`paginas/interessado/interessado.services.ts`)
- `GET /pessoa/interessado/unidade/{u}[/curso/{c}]?searchTerm=` (`:34`)
- `GET /pessoa/interessado/unidade/{u}/desde/{mm}/{aaaa}/agrupado` (`:47`)
- `GET /pessoa/interessado/{oidPessoa}` (`:60`)
- `POST /pessoa/interessado/unidade/{u}/curso/{c}` (`:71`); `DELETE /pessoa/interessado/{oid}` (`:81`)
- no filtro: `GET /pessoa/interessado/unidade/{u}/desde/{mm}/{aaaa}/todassituacoes/{bool}/agrupado` (`sharedservices/filters/filtro-interessado/filtro-interessado.component.ts:98`); `POST /pessoa/interessado/exportar` (`:151`)

**RelacionamentoInteressadoServices** (`paginas/relacionamento-interessado/relacionamento-interessado.services.ts`)
- `GET /pessoa/interessado/unidade/{u}/desde/{mm}/{aaaa}/todos` (`:19`)
- `GET /mensagem/{oidInteressadoCurso}/registromensagem` (`:31`); `POST /mensagem/{oidInteressadoCurso}/registromensagem` (`:61`)
- `POST /mensagem/registromensagem/email` (`:41`); `POST /mensagem/registromensagem/sms` (`:51`)

**EmailServices** (`sharedservices/email/email.services.ts`) — `POST /mensagem/email` (`:20`); `GET /mensagem/email` (modelos) (`:33`); `POST /mensagem/email/{tipoFiltro}/{oidUnidade}` (`:47`)

**SmsServices** (`sharedservices/sms/sms.services.ts`) — `POST /mensagem/sms` (`:24`); `POST /mensagem/sms/{tipoFiltro}/{oidUnidade}` (`:38`)

**PeriodoInteressadoCursoServices** (`paginas/periodo-interessado-curso/periodo-interessado-curso.services.ts`) — `GET /periodoiteressadocurso/curso/{oidUnidade}` (`:35`); `POST /basico/recebimentodiverso` (`:56`); `POST /periodoiteressadocurso` (`:67`); `DELETE /periodoiteressadocurso/{oid}` (`:88`)

**CursoServices** (`paginas/curso/curso.services.ts`) — `GET /curso/unidade/{u}` (`:21`); `POST /curso/unidade/{u}` busca (`:38`); `GET /curso/unidadecursos/{u}` (`:51`); `POST /curso/{u}` (`:64`); `DELETE /curso/{u}/{oid}` (`:77`)

**DisciplinaUnidadeCursoServices** — `POST /disciplinaunidadecurso/{u}/{c}` busca (`paginas/disciplinacurso/disciplinaunidadecurso.services.ts:25`)

**DisciplinaOferecidaServices** (`paginas/disciplinaoferecida/disciplinaoferecida.services.ts`)
- `GET /disciplinaoferecida/unidade/{u}` (`:25`); `POST /disciplinaoferecida/unidade/{u}` busca (`:142`)
- `GET /disciplinaoferecida/unidade/{u}/curso/{c}/calendarioregime/{cr}` (`:166`; também `paginas/calculo-academico/calculo-academico.services.ts:77`)
- `POST /disciplinaoferecida/` (`:152`); `DELETE /disciplinaoferecida/{oid}` (`:175`)
- `GET /disciplinaoferecida/{oid}/turmas` (`:38`); `GET /disciplinaoferecida/{oid}/turma/{oidTurma}/alunos` (`:50`); `GET /disciplinaoferecida/{oid}/alunos` (`:62`); `GET /disciplinaoferecida/{oid}/conteudoaulas` (`:74`)
- `GET /disciplinaoferecida/{oid}/planoensino` (`:86`); `POST /disciplinaoferecida/planoensino` (`:99`); `POST /disciplinaoferecida/planoensino/planoensinoelementos` (lista) (`:114`); `POST /disciplinaoferecida/planoensinoelemento` (`:124`)

**HorarioDisciplinaOferecidaServices** (`paginas/disciplinaoferecida/horariodisciplinaoferecida/horariodisciplinaoferecida.services.ts`) — `POST /disciplinaoferecida/horariodisciplinaoferecida/{oidDisciplinaOferecida}` (lista) (`:24`); `POST /disciplinaoferecida/horariodisciplinaoferecida` (`:34`); `DELETE /disciplinaoferecida/horariodisciplinaoferecida/{oid}` (`:48`)

**FormulaServices** — `GET /formula/unidade/{u}/disciplinaoferecida/{oid}` (`sharedservices/formula.services.ts:20`)

**CalculoAcademicoServices** (`paginas/calculo-academico/calculo-academico.services.ts`)
- `GET /curso/unidade/{u}/calendarioregime/{cr}` (`:34`); `GET /curso/unidade/{u}` (`:51`)
- `GET /turmacurso/unidade/{u}/calendarioregime/{cr}` (`:125`); `GET /turmacurso/unidade/{u}/data/{data}/curso/{c}` (`:147`)
- `GET /aluno/turma/{oidTurma}` (`:105`); `GET /aluno/{a}/calendarioregime/{cr}/disciplinaoferecida` (`:167`)
- `POST /aluno/disciplinaoferecidas/` `{alunoList, disciplinaOferecidaList}` → blob (`:63`)
- `POST /calculoacademico/curso/{u}/{cr}/{c}` (`:189`); `POST /calculoacademico/turmacurso/{u}/{cr}/{t}` (`:211`); `POST /calculoacademico/alunodisciplinaoferecida/{u}/{oid}` (`:227`); `POST /calculoacademico/disciplinaoferecida/{u}` `{opcoes, disciplinaOferecidaList}` (`:243`)

### 5.2 Modelos principais (`_model/`)

Todos têm `oid` e `status`; as associações são objetos aninhados, não ids.

| Modelo | Campos |
|---|---|
| `Usuario` | `oid`, `login`, `token`, `oidpessoa`, `nome`, `email`, `foto`, `unidades[]` |
| `Unidade` | `sigla`, `razaosocial` |
| `Menu` | `nome`, `legenda`, `link`, `menus[]` (o template também lê `icone`, que não está no modelo) |
| `Pessoa` | `nome`, `email`, `pai`, `mae`, `foto`, `oidtutor`, `sexo`, `naturalidade`, `datanascimento`, `oidestadocivil`, `oidnacionalidade`, `oidraca`, `cpf{numero, dataemissao}`, `identidade{numero, dataemissao, orgaoemissor}`, `titulo{numeroinscricao, zona, secao, dataemissao, municipio, uf}`, `certificadoreservista{numero, categoria, orgaoexpeditor, dataemissao}` |
| `PessoaEndereco` / `Endereco` | `correspondencia`, `tipoendereco`, `oidpessoa`, `oidendereco{numero, cidade, uf, cep, logradouro, bairro, complemento}` |
| `Telefone` | `ddd`, `numero`, `tipotelefone`, `oidpessoa` |
| `Aluno` | `matricula`, `oidunidade`, `turmacurso`, `turno`, `tipo`, `situacaomatricula`, `pessoa`, `dadosescolares{anoconclusao, cidade, graduacao, nivel, oidestabelecimentoensino}` |
| `Professor` | `matricula`, `titulacao`, `cargo`, `regimetrabalho`, `oidunidade`, `pessoa` |
| `Funcionario` | `matricula`, `oidunidade`, `pessoa` |
| `Curso` | `codigo`, `codigoies`, `nome`, `areaconhecimento`, `cargahorariaminima`, `creditos`, `duracaominima`, `duracaomaxima`, `iniciofuncionamento`, `perfilprofissional`, `regimeletivo`, `sistemacurricular`, `titulacao`, `portaria`, `credenciamentocapes`, `modalidade`, `tipocurso`, `tiporegime` |
| `Unidadecurso` | `oidunidade`, `curso` |
| `Turmacurso` | `ano`, `turma`, `descricao`, `datainicio`, `datafim`, `unidadecurso` |
| `Reconhecimento` | `numeroparecer`, `dataparecer`, `numerodocumento`, `datapublicacao`, `descricao`, `tipodocumento`, `curso` |
| `CalendarioAcademico` | `ano`, `datainicio`, `datafim`, `oidunidade` |
| `CalendarioRegime` | `datainicio`, `datafim`, `regime`, `calendarioacademico` |
| `Regime` | `descricao`, `tiporegime` |
| `CalendarioAtividadeAcademica` | `datainicio`, `datafim`, `atividadeacademica`, `calendarioacademico` |
| `Feriado` | `descricao`, `data`, `oidunidade`, `calendarioacademico` |
| `Disciplina` | `sigla`, `descricao`, `credito`, `cargahoraria`, `ordem` |
| `Modulo` | `descricao`, `ordem`, `unidadecurso` |
| `Disciplinaunidadecurso` | `situacaonota`, `disciplina`, `modulo`, `unidadecurso` |
| `Disciplinaoferecida` | `ano`, `codigoturma`, `data`, `turno`, `calendarioregime`, `disciplinaunidadecurso` |
| `Horario` | `diasemana`, `horainicial`, `horafim`, `diasemanaAntigo`, `oidunidade` |
| `Horariodisciplinaoferecida` | `disciplinaoferecida`, `professor`, `sala`, `horario` |
| `Predio` / `Sala` | `sigla`, `descricao`, `fk_oidunidade` / `nome`, `largura`, `comprimento`, `capacidade`, `oidpredio`, `oidunidade` |
| `Alunodisciplinaoferecida` | `data`, `media`, `situacaodisciplina`, `aluno`, `disciplinaoferecida` |
| `Nota` | `valor`, `alunodisciplinaoferecida`, `tipoprova` |
| `Tipoprova` | `nome`, `descricao`, `tipo` |
| `Dataprova` | `data`, `hora`, `disciplinaoferecida`, `tipoprova` |
| `Conteudoaula` | `data`, `datapublicacao`, `auladada`, `publicada`, `descricaoaula`, `tipoaula`, `disciplinaoferecida` |
| `Alunofalta` | `alunodisciplinaoferecida`, `conteudoaula`, `horariodisciplinaoferecida` |
| `Planoensino` | `titulo`, `descricao`, `situacao`, `disciplinaoferecida` |
| `Isencao` | `ano`, `aluno`, `disciplinaunidadecurso` |
| `TipoBasico` | `descricao` (estado civil, raça, nacionalidade, modalidade, tipo de curso, situações etc.) |

Sem classe de modelo (lidos como objeto solto nos templates): interessado-curso (`oidpessoa`, `curso`, `data`, `situacao`, `datamatricula`), DTO do filtro de interessados (`interessadoCurso`, `fezUploadDocumentos`), período de inscrição (`unidadecurso`, `datainicio`, `datafim`, `exibicao`, `boleto`, `valor`, `recebimentodiverso{codigo, descricao}`), estágio (`local`, `cargahoraria`, `datainicio`, `datatermino`, `aluno`), histórico de situação (`situacaomatricula`, `observacao`, `data`, `aluno`), prova especial (`tipoprova`, `tipo`, `dataprova`, `dataentrega`, `disciplinaoferecida`), documento escaneado (`tipo{name, label}`, `path`, `aluno`), registro de mensagem (`tipo`, `destinatario`, `assunto`, `mensagem`, `data`, `interessadocurso`), elemento do plano (`conteudo`, `cursomodeloelemento.elementoensino.descricao`, `planoensino`), fórmula (`listaVariaveisformulaavaliacao[]{tipoprova, notamaxima}`), total de faltas (`valor`, `percentual`), modelo de e-mail (`titulo`, `mensagem`).

---

## 6. O que o código não responde

| # | Pergunta | Quem provavelmente decide |
|---|---|---|
| 1 | Quais grupos e itens de menu existem e para quais perfis? O menu vem inteiro do backend; o front não tem a lista nem checa perfil por tela. | Administração do sistema de acesso (TI) + secretaria acadêmica da pós/extensão |
| 2 | O login central é o do portal? A tela "Aguarde" some na migração e o módulo passa a ser aberto pela grade de módulos? | Arquitetura / TI |
| 3 | Quais das 41 telas estão em uso hoje (ex.: Recurso, Estágio supervisionado, Prova especial, Envio de Sms, Plano de ensino cujo diálogo não tem campo de conteúdo)? | Secretaria acadêmica + coordenação de pós-graduação/extensão |
| 4 | Quem lança nota e falta: a secretaria ou o professor? Há portal do professor fora deste front? | Coordenação acadêmica |
| 5 | Como se calcula média, situação por nota, situação por frequência e CR, e qual o percentual mínimo de frequência? O front só dispara o cálculo. | Regimento acadêmico / coordenação; implementação no backend |
| 6 | Como é formada a fórmula de avaliação (tipos de prova, nota máxima por prova)? Não há tela de fórmula neste front. | Coordenação de curso |
| 7 | Como a matrícula é gerada (formato do número) e o que acontece se o aviso ao financeiro falhar? O erro dessa chamada não é tratado na tela. | Secretaria acadêmica + financeiro (SigFin) |
| 8 | Pode-se matricular interessado com documentos pendentes ou na situação PENDENTE? O que faz um interessado passar a CONFIRMADO? | Secretaria / setor comercial de pós-graduação |
| 9 | Quem aprova o plano de ensino e em que estado ele pode ser aprovado ou reprovado? Quem preenche os elementos? | Coordenação de curso |
| 10 | Excluir deve pedir confirmação e deve ser possível desfazer? Quais exclusões o backend recusa (406) na prática? | Dono do produto + secretaria |
| 11 | Troca de turma muda curso? Leva as inscrições em disciplinas? Há limite de prazo? | Secretaria acadêmica |
| 12 | "Apenas situação" na disciplina do curso significa disciplina sem nota? | Coordenação acadêmica |
| 13 | Qual a diferença de uso entre "Aluno em disciplina oferecida", "Disciplina oferecida x alunos" e "Alunos da turma x disciplina oferecida" (três caminhos para a mesma inscrição)? | Secretaria acadêmica |
| 14 | Aluno especial: quem pode cadastrar, e como a matrícula dele é numerada? | Secretaria acadêmica |
| 15 | Envio de e-mail/SMS: há limite de destinatários, horário, opt-out (LGPD) e remetente por unidade? Quem mantém os modelos de mensagem? | Comunicação/marketing + encarregado de dados |
| 16 | Período de inscrição: o que os sites (UCAM, Central Pós-graduação, CEPEFER) fazem com esse registro, e como o boleto de inscrição é emitido? | Marketing/captação + financeiro |
| 17 | A home deve mostrar algo (pendências, indicadores)? Hoje é um cartão vazio. | Dono do produto |
| 18 | Os valores de cargo e regime de trabalho do professor ainda valem e deveriam vir de cadastro? | RH / coordenação |
| 19 | As instâncias (UCAM, Rio, ITECAM, EAD) têm diferenças de regra além do nome e dos endereços? | TI + direção das unidades |
| 20 | O que é exibido como "Média" antes de rodar o cálculo, e o usuário sabe quando o cálculo terminou sem abrir o painel de notificações? | Dono do produto + secretaria |
