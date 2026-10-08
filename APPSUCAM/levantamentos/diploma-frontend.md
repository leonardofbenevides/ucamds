# Inventário do front-end de diploma (SERD, Angular 6)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\diploma-frontend`. Todas as referências `arquivo:linha` abaixo são relativas a `...\diploma-frontend\src\app\` (ou `src\environments\` e raiz do repositório quando indicado). O sistema se apresenta como "Módulo de Registro de diploma" (`src/index.html:5`) e usa a marca SERD (`environments/environment.ts:18`).

**Cobertura da leitura.** Li por inteiro os 144 `.ts` não-spec e os 48 `.html` de `src/app`, mais `README.md`, `package.json`, os quatro `environment*.ts`, `app.component.css`, o início de `src/index.html` e de `src/common/animations.ts`. Não li os 19 `.spec.ts` (só o de `app.component`), nem os 47 arquivos de estilo de componente (`.css`/`.scss`/`.sass`), nem `src/styles.scss` (232 linhas) e `src/assets/{css,scss,sass}`; por isso cores, tamanhos e o desenho exato dos selos são **não confirmados**. De `projects/ucam-select` só conferi o seletor (`ucam-select`). `node_modules` não existe na pasta: o conteúdo real de `ucam-material` (0.0.6639), `ucam-frame-model` (0.0.6675) e `ucam-select` (0.0.2) é **não confirmado**; só sei o que os templates usam. Não li `angular.json` além dos nomes de configuração (`production`, `rio`), nem `Dockerfile`, `Jenkinsfile`, `kubernetes/`, `nginx-custom.conf`, `e2e/`.

---

## 1. Rotas e telas

Rotas raiz em `app.module.ts:57-63`; as demais vêm de `RouterModule.forChild` em cada módulo de página, todos importados de forma direta ou indireta por `AppModule` (`app.module.ts:102-112`). Só `registro` é lazy (`app.module.ts:62`). O único guard é `AuthGuard`, que só verifica `state.authenticated` (`services/auth/auth-guard.service.ts:25-28`); não há checagem de perfil em lugar nenhum do front.

### 1.1 Tabela de rotas

| URL | Componente | Template | Guard | Arquétipo |
|---|---|---|---|---|
| `''` | redireciona para `/home` | — | `AuthGuard` | — |
| `home` | `HomeComponent` | `paginas/home-component/home.component.html` | `AuthGuard` | início (vazio) |
| `login` | `LoginComponent` | `login/login.component.html` | nenhum | entrada (tela de espera) |
| `login/:token/:user/:unidade` | `LoginComponent` | idem | nenhum | entrada por token |
| `cadastrodadosaluno` | `CadastroDadosAlunoComponent` | `paginas/cadastro-dados-aluno/cadastro-dados-aluno.component.html` | `AuthGuard` | formulário |
| `expedicao` e `expedicao/:id` | `ExpedicaoComponent` | `paginas/expedicao/expedicao.component.html` | `AuthGuard` | listagem em abas de situação |
| `controledeexpedicao` | `ControledeexpedicaoComponent` | `paginas/controledeexpedicao/controledeexpedicao.component.html` | `AuthGuard` | listagem + análise |
| `controledeprorrogacao` | `ControleprorrogacaoComponent` | `paginas/controleprorrogacao/controleprorrogacao.component.html` | `AuthGuard` | listagem (duas filas) + análise |
| `criacaolote` | `CriacaoLoteDiplomaComponent` | `paginas/lote-diploma/geracao-lote-diploma/criacao-lote-diploma.component.html` | `AuthGuard` | listagem com seleção em lote |
| `listarlote` | `ListarLoteDiplomaComponent` | `paginas/lote-diploma/controle-lote-diploma/listar-lote-diploma.component.html` | `AuthGuard` | listagem |
| `livroderegistros` | `LivroDeRegistrosComponent` | `paginas/livro-de-registros/livro-de-registros.component.html` | **nenhum** (`livro-de-registros.module.ts:15-19`) | consulta + impressão |
| `relatorioenvioassinatura` | `RelatorioEnvioAssinaturaComponent` | `paginas/relatorio/assinatura/relatorio-envio-assinatura/relatorio-envio-assinatura.component.html` | `AuthGuard` | relatório (ofício impresso) |
| `relatoriodevolucao` | `RelatorioDeDevolucaoComponent` | `paginas/relatorio/devolucao/relatorio-de-devolucao/relatorio-de-devolucao.component.html` | `AuthGuard` | relatório (ofício impresso) |
| `registro` → `registro/pesquisa` | `RegistroPrincipalComponent` > `RegistroComponent` | `paginas/registro/registro/registro.component.html` | `AuthGuard` no pai lazy (`app.module.ts:62`) | consulta + ação por linha |
| `registro/informativo` | `InformativoComponent` | `paginas/registro/informativo/informativo.component.html` | idem | resultado de operação |
| `exigencia` | `ExigenciaComponent` | `paginas/exigencia/exigencia.component.html` | `AuthGuard` | peça com rota (sem tela própria) |
| `processotable` | `ProcessoTableComponent` | `paginas/processo-table/processo-table.component.html` | `AuthGuard` | peça com rota |
| `prorrogacaotable` | `ProrrogacaoTableComponent` | `paginas/controleprorrogacao/prorrogacao-table/prorrogacao-table.component.html` | `AuthGuard` | peça com rota |
| `top-bar` | `TopBarComponent` | `top-bar/top-bar.component.html` | `AuthGuard` | moldura antiga com rota |

Onde cada rota é declarada: `cadastro-dados-aluno.module.ts:30-32`, `expedicao.module.ts:39-42`, `controledeexpedicao.module.ts:45-47`, `controleprorrogacao.module.ts:32-34`, `criacao-lote-diploma.module.ts:27-29`, `listar-lote-diploma.module.ts:33-35`, `relatorio-envio-assinatura.module.ts:20-26`, `relatorio-de-devolucao.module.ts:13-15`, `registro/registro.routing.ts:7-27`, `exigencia.module.ts:30-32`, `processo-table.module.ts:23-25`, `prorrogacao-table.module.ts:23-25`, `top-bar/top-bar.module.ts:17-19`.

Quase todas as telas ficam dentro de `<app-form-template>` (faixa com a marca SERD, `/título`, área de busca e conteúdo; `shared/form-template/form-template.component.html:1-23`). As duas telas de `registro/` não usam essa moldura de página.

### 1.2 Entrada e início

**Login por token** (`login`, `login/:token/:user/:unidade`)
- Propósito: receber o token do login central e abrir a sessão.
- Arquétipo: entrada sem formulário. O template é uma página de espera com logo, "Aguarde" e GIF de carregamento (`login/login.component.html:49-53`); o `FormGroup` login/senha criado no componente não é usado (`login/login.component.ts:39-42`).
- Classificação: **parcial**. Base: `portal/login` (autenticação). Falta o estado "entrando, aguarde" (skeleton/progress já existem como peça).

**Início** (`home`)
- Template com `<app-form-template>` e `panel-title`/`panel-content` vazios (`paginas/home-component/home.component.html:1-8`).
- Classificação: **nao-migrar** (esqueleto). Se o time quiser um início, a base é `gerencial/inicio` (painel-indicadores).

### 1.3 Cadastro de dados de aluno (`cadastrodadosaluno`)

- Propósito: completar no histórico do aluno os dados que faltam para o diploma (datas de conclusão e colação, forma de ingresso) e, com isso, gerar o processo.
- Arquétipo: formulário em duas colunas numeradas ("1 Informações pessoais", "2 Informações adicionais").
- Peças: `mat-autocomplete` de aluno (opção `matrícula - nome`), `ucam-material-input` (com `mask`), `textarea` com `mat-form-field`, `mat-checkbox`, texto de aviso sob o campo (`span#notice`), indicação "Processo gerado: N° x Em dd/MM/yy", botões "Limpar" e "Salvar", diálogo de carregamento e diálogo de mensagem, `MatSnackBar`.
- Campos (`cadastro-dados-aluno.component.ts:69-88`): `aluno` (busca), `cpf`, `matricula`, `datanascimento`, `nacionalidade`, `naturalidade`, `identidade`, `orgaoexpedidoridentidade`, `curso` (os oito somente leitura), `dataconclusao`, `colacaograu`, `formaingresso`, `observacao`, `segundavia`; ocultos `oid`, `status`.
- Classificação: **parcial**. Padrão `formulario-entidade`; base `protocolo/novo-requerimento` ou `gerencial/usuario-form`. Peças: combobox, text-field, date-field, textarea, checkbox, alert, button. Falta a tela de referência; a mensagem flutuante (snackbar) não tem peça própria no catálogo.

### 1.4 Expedição de processo de diploma (`expedicao`, visão da unidade)

- Propósito: a secretaria da unidade acompanha os processos de diploma por situação, cria processo novo e expede para a URD.
- Arquétipo: listagem com cinco abas de situação, cada uma com contagem, e uma faixa de cinco ícones (`mat-horizontal-stepper`) que acompanha a aba ativa.
- Peças: `panel-search` com `ucam-material-select` "Diploma" (só na aba Deferido), busca "Nome, CPF ou nº de registro", botão "Criar Novo"; `mat-tab-group` com rótulos "Sem Expedição (n)", "Expedido (n)", "Em Análise (n)", "Em Exigência (n)", "Deferido (n)" (`expedicao.component.html:57-125`); `app-processo-table` em cada aba.
- Tabela `app-processo-table` (`paginas/processo-table/processo-table.component.ts:42-51`): `vencimento` (dias + selos "Reemissão" e "2ª via"; trocada por `diploma` quando a situação é Deferido), `nome` (nome em negrito, CPF mascarado e "Processo - nº"), `datacolacaograu` "Colação", `dataexpedicao` "Expedição", `curso`, `unidade` (sigla), `status` "Estado" (ícone + rótulo), `acao` (botão "Visualizar"). Ordenáveis: Nome, Colação, Expedição, Curso, Unidade, Estado. Barra de progresso indeterminada; paginação 10/20/50 com primeira/última.
- Classificação: **parcial**. Padrão `listagem-crud`; base `isencao/fila` (fila com situação) ou `protocolo/analise-requerimento`. Peças: tabs com contagem, data-table, badge, prazo, select, text-field, pagination, stepper. Falta só a tela de referência.

**Diálogo "Processo"** (`paginas/expedicao/dialog-processo/dialog-processo.component.html`, 80% × 90%, não fecha por clique fora)
- Propósito: ver e criar o processo de um aluno, conferir documentos, responder exigências, pedir prorrogação e expedir.
- Arquétipo: detalhe em abas dentro de modal. Cabeçalho "Processo N° x em data" + ícone e rótulo da situação + "2ª via".
- Abas: "Dados Principais" (`aluno` com autocomplete, `cpf`, `matricula`, `datanascimento`, `nacionalidade`, `naturalidade`, `identidade`, `orgaoexpedidoridentidade`), "Sobre o curso" (`dataconclusaocurso`, `datacolacaograu`, `curso`, `codigomec`, `credenciamento`, `formaingresso`, `observacoes`), "Documentos" (alternador "Todos os documentos" e um cartão por documento: tipo, nome `.pdf` desabilitado, botão de lupa que abre o arquivo), "Exigências" (`app-exigencia`), "Pedidos de Prorrogação" (`app-prorrogacao`), "Equivalência de disciplinas" (tabela: Disciplina isenta, Disciplina da IES (Origem), IES, baixar comprovante), "Diplomas" (só se houver: dados do diploma, lista "Selecione o diploma", `pdf-viewer` com três botões de rotação, "DOWNLOAD XML", imagem "Nenhum documento encontrado").
- Rodapé: caixa "Segunda via" (processo novo) ou botão "Marcar como 2ª via", "Termo de expedição" (o clique só fecha o diálogo, `dialog-processo.component.html:599-608`), "Cancelar", "Criar" ou "Expedir".
- Classificação: **parcial**. Padrão `triagem-lista-detalhe` (página de detalhe); base `protocolo/requerimento-detalhe` e `isencao/analise`. Peças: dialog/drawer, tabs, description-list, anexo, data-table, badge, switch, empty-state. **Falta** peça de visualização de PDF embutida com rotação.

**Aba Exigências** (`paginas/exigencia/exigencia.component.html`) e **diálogo "Exigência"** (`paginas/exigencia/dialog-exigencia/dialog-exigencia.component.html`, 40% × 50%)
- Propósito: a URD registra documentos pendentes; a unidade marca como cumprida.
- Peças: botão "Novo" (se `exibeCrud`), sub-abas "Não cumprida" / "Cumpridas anteriormente", tabela (botão "Cumprida" quando `toggleCumprida`; Data; Documento; Observação cortada em 80 caracteres; ações excluir/editar ou lupa), paginação 10/20/50. Diálogo: `mat-select` "Documento" (30 tipos), `textarea` "Observação", "Salvar"/"Cancelar".
- Campos do diálogo (`dialog-exigencia.component.ts:46-56`): `documento`, `observacao`; ocultos `oid`, `status`, `data`, `responsavel`, `situacao`, `oidprocesso`.
- Classificação: **parcial**. Base `isencao/sem-documentos` (pedir documento) e padrão `listagem-crud` aninhado; peças tabs, data-table, dialog, select, textarea, icon-button.

**Aba Pedidos de Prorrogação** (`paginas/expedicao/prorrogacao/prorrogacao.component.html`) e **diálogo "Pedido de prorrogação"** (`.../dialog-prorrogacao/dialog-prorrogacao.component.html`, 700px)
- Propósito: a unidade pede mais dias de prazo para expedir.
- Peças: sub-abas "Solicitadas" / "Deferidas", botão "Solicitar", tabela (Data, Protocolo, Número de dias, Estado, editar). Diálogo com cabeçalho "Pedido de prorrogação N° protocolo em data", cartão "Estado", campos `numerodia` e `motivo`, "Salvar"/"Cancelar".
- Classificação: **parcial**. Padrão `formulario-entidade` curto em diálogo; peças tabs, data-table, dialog, text-field, textarea, prazo.

### 1.5 Controle de expedição (`controledeexpedicao`, visão da URD)

- Propósito: a Unidade de Registro de Diplomas recebe os processos expedidos de todas as unidades, analisa, faz exigências, defere ou anula e registra o diploma.
- Arquétipo: listagem com filtros + análise em diálogo.
- Filtros (`controledeexpedicao.component.ts:57-62`): `nome` "Nome, CPF ou nº de registro", `dias` "Dias de vencer", `estado` (select com contagem no rótulo: "(n) Todos", "(n) Expedido", "(n) Em análise", "(n) Em exigência", "(n) Deferido"), `estadoDiploma` (só com Deferido: Todos, Sem diploma, Registrado, Publicado).
- Tabela: a mesma `app-processo-table`, com `tipoProcesso='expedido'` e `oidUnidade='%'` (todas as unidades).
- Classificação: **parcial**. Padrão `listagem-crud` + `triagem-lista-detalhe`; base `isencao/fila` e `isencao/analise`. Falta a tela de referência.

**Diálogo "Processo" da URD** (`paginas/controledeexpedicao/dialog-controle/dialog-controle.component.html`, 80% × 90%)
- Abas: "Dados Principais" e "Sobre o curso" (tudo somente leitura), "Documentos" (alternador "Filtrar documentos"), "Exigências" (com selo de contagem das não cumpridas; CRUD se não deferido), "Diploma" (`app-diploma`), "Equivalência de disciplinas".
- Cabeçalho: botão "Historico", ícone e rótulo da situação. Rodapé: "Anular", "Cancelar", "Em análise", "Deferir".
- Observação: o template chama `downloadEquivalencia(equivalencia)` (`dialog-controle.component.html:395`), mas o método não existe nesse componente (só em `expedicao/dialog-processo/dialog-processo.component.ts:327`).
- Classificação: **parcial**. Base `isencao/analise` e `protocolo/requerimento-detalhe` (decisão no rodapé). Peças: dialog, tabs com badge, description-list, anexo, data-table, button. **Falta** a mesma peça de visualização de PDF (na aba Diploma) e confirmação antes de "Anular" (padrão `confirmacao-destrutiva` existe; o código não confirma).

**Diálogo "Histórico"** (`.../dialog-historico-processo/dialog-historico-processo.component.html`, 35em × 22em)
- Tabela Data, Estado, Usuário; botão "Fechar".
- Classificação: **parcial**. Peça `timeline` cobre; base `protocolo/requerimento-detalhe`.

**Aba Diploma** (`.../diploma/diploma.component.html`) e **diálogo "Diploma"** (`.../diploma/dialog-diploma/dialog-diploma.component.html`, 55em × 46em)
- Propósito: registrar o diploma do processo deferido (livro, folha, registro, número) e anexar o PDF e o XML do diploma digital.
- Tabela: Data, Livro, Folha, N° do registro, N° do diploma, 2° via, Estado, N° do lote, Estado do lote, Data de publicação, editar, cancelar. Botão "Novo".
- Diálogo: caixa "2° via", "UPLOAD XML" / "DOWNLOAD XML", "Upload" / "Download" do PDF, campos `livro`, `folha`, `numeroregistro` (somente leitura), `dataregistro` (calendário), `numerodiploma`, lista "Números cancelados", `pdf-viewer` com rotação, "Salvar", "Cancelar", "Remover imagem". Ocultos: `oid`, `status`, `oidprocesso`, `patharquivo`, `numerolote`, `estadolote`, `datapublicacaolote`, `oidlotediploma` (`dialog-diploma.component.ts:62-77`).
- Classificação: **parcial**. Padrão `formulario-entidade`; base `protocolo/natureza-form`. Peças: data-table, dialog, text-field, date-field, checkbox, file-field, anexo. **Falta** visualização de PDF embutida.

**Diálogo "Cancelamento de número"** (`.../diploma/dialog-cancel-diploma/dialog-cancel-diploma.component.html`, 45em × 30em)
- Campos `numero` "Número a ser cancelado", `novonumero` "Novo número", `justificativa`; "Cancelar"/"Salvar".
- Classificação: **parcial**. Base padrão `confirmacao-destrutiva` com justificativa (dialog + text-field + textarea).

### 1.6 Controle de prorrogação (`controledeprorrogacao`, visão da URD)

- Propósito: decidir os pedidos de prorrogação de prazo.
- Arquétipo: duas tabelas empilhadas, "Solicitado" e "Concluído", com contagem "n processo(s)".
- Filtros: `nome`, `dias` "Dias de vencer".
- Tabela `app-prorrogacao-table` (`prorrogacao-table.component.ts:27`; a coluna `status` é retirada em `:71-73`): `prorrogacao` ("n dia(s)"), `estado`, `datacolacaograu` "Vencimento" (selo colorido de dias + "+ n dia(s)" de prorrogação), `nome` (nome e CPF), `dataabertura` "Registro", `curso`, `unidade`, `acao` "Visualizar". Ordenáveis: Nome, Registro, Curso, Unidade. Paginação 10/20/50.
- Classificação: **parcial**. Padrão `listagem-crud`; base `isencao/fila`. Peças: data-table, prazo, badge, section-bar, pagination.

**Diálogo da prorrogação** (`paginas/controleprorrogacao/dialog-controle/dialog-controle.component.html`, 80% × 90%)
- Abas: "Prorrogação" (`data`, `protocolo`, `numerodia`, `motivo`, somente leitura) e "Processo" (dados do aluno, "Sobre o curso", "Documentos", exigências só para consulta). Rodapé: "Deferir", "Indeferir", "Em análise", "Cancelar".
- Classificação: **parcial**. Base `isencao/analise` (decidir item a item).

### 1.7 Lotes de diploma

**Criação de lote** (`criacaolote`)
- Propósito: reunir diplomas registrados em um lote para publicação.
- Arquétipo: listagem com seleção em lote e contador "n diploma(s) selecionados".
- Filtros (`criacao-lote-diploma.component.ts:73-78`): `nome` "Nome ou nº de registro", `dias` "Dias de vencer", `estadolote` (Todos, Sem Lote, Com Lote), `dataregistro` (calendário). Botões "Criar Lote" e "Limpar Seleção".
- Colunas (`:100-106`): `select`, `vencimento` "Vence em", `dataregistro`, `numeroregistro`, `nomealuno`, `numerodiploma`, `numeroprocesso`, e `lote` "Número do Lote" quando o filtro não é "Sem Lote". Paginação 10/20/50.
- Classificação: **parcial**. Padrão `listagem-crud` (ações em lote); base `sigfin/movimento-caixa` ou `isencao/fila`. Peças: data-table com seleção, checkbox, date-field, select, prazo, dialog.

**Diálogos "Confirmação"** (`.../criar-lote-diploma-dialog/` e `.../confirma-criacao-lote-diploma-dialog/`, 450px)
- Antes: "O lote {data} com n diploma(s) será criado, deseja continuar?" com "Cancelar"/"Criar". Depois: "O lote número x, do dia d com n diploma(s) foi criado com sucesso." com "Fechar".
- Classificação: **parcial**. Peça `dialog`; o padrão `confirmacao-destrutiva` serve de base, embora a ação não seja destrutiva.

**Listar lotes** (`listarlote`; título no template: "Listar de lote de diplomas")
- Filtros: `numero`, `estadolote` (Todos, Cadastrado, Expedido, Publicado, Cancelado).
- Colunas (`listar-lote-diploma.component.ts:35-41`): `numero`, `criacao` "Data de Criação", `estado`, `publicacao` "Data de publicação", `acao` ("Visualizar", "Cancelar"). Paginação 10/20/50.
- Classificação: **parcial**. Padrão `listagem-crud`; base `protocolo/naturezas`. O "Cancelar" age sem confirmação (`listar-lote-diploma.component.ts:166-175`); o padrão `confirmacao-destrutiva` cobre.

**Diálogo "Lote de diplomas n"** (`.../view-lote-diploma-dialog/view-lote-diploma-dialog.component.html`, 80% × 80%)
- Cabeçalho "Registrado em data"; aba "Diplomas" (colunas `nomealuno`, `numeroprocesso`, `numeroregistro`, `dataregistro`, `numerodiploma`, `segundavia`, `livro`, `folha`, `acao` "cancelar"; paginação 5/10/25/50) e aba "Publicação" (botões "Aviso de registro" e "Diário oficial"); rodapé "Cancelar", "Expedir" ou "Publicar"; texto "Estado x".
- Classificação: **parcial**. Padrão `triagem-lista-detalhe` (detalhe); peças dialog, tabs, data-table, badge.

**Diálogo "Registro de expedição"** (`.../expedir-lote-diploma-dialog/`, 60% × 55%)
- Mostra o texto do aviso de registro vindo do backend como HTML; "Cancelar" e "Copiar".
- Classificação: **parcial**. Peças dialog + citacao + button.

**Diálogo "Publicar lote"** (`.../publicar-lote-diploma-dialog/`, 60% × 80%)
- Campos `datapublicacao` (máscara) e arquivo PDF do Diário Oficial; `pdf-viewer`; "Salvar", "Cancelar", "Remover imagem". O mesmo diálogo, em modo exibição, mostra o Diário Oficial com "Download".
- Classificação: **parcial**. Peças dialog, date-field, file-field, anexo. **Falta** visualização de PDF embutida.

### 1.8 Livro de registro de diplomas (`livroderegistros`)

- Propósito: consultar e imprimir o livro de registro de um ano.
- Arquétipo: consulta com resultado em "folhas" lado a lado.
- Peças: `ucam-material-select` "Ano", campo "Pesquisa rápida" sem ligação a nenhum controle (`livro-de-registros.component.html:12`), botão redondo de imprimir, barra de progresso, duas folhas `pagina-diploma` por vez, setas anterior/próxima e `mat-slider` com o número da folha.
- Campos de cada folha (`page/page.component.html`): `nomeAluno`, `numeroProcesso`, `numeroRegistro`, `curso`, `dataConclusaoCurso`, `dataColacao`, `tituloGrau`, `cpfMatriculaResponsavelRegistro`, `dataExpedicao`, `nacionalidade`, `naturalidade`, `nomeResponsavelRegistro`, `dataNascimento`, `documentoIdentificacao`, `orgaoEmissor`, `nomeInstituicao`, `nomeMantenedora`, `cnpjMantenedora`, `dataExpedicaoDiploma`, `numeroSerieDiploma`, `dataRegistroDiploma`, `portariaAutorizacao`, `portariaReconhecimento`, "Campo de observação", `folha`. A versão de impressão (`print-page/page.component.html`) acrescenta `livro`, `uf` e a linha de assinatura do dirigente.
- Classificação: **parcial**. Padrão `consulta-relatorio`; base `relatorios/filtros` e `relatorios/resultado`; peças select, description-list, pagination. **Falta** padrão de folha para impressão (documento paginado) e peça de controle deslizante.

### 1.9 Relatórios (ofícios)

**Relatório de envio de assinaturas** (`relatorioenvioassinatura`)
- Propósito: escolher processos sem diploma e imprimir o ofício que envia os diplomas para assinatura.
- Campos (`relatorio-envio-assinatura.component.ts:31-36`): `oficio` "Nº do ofício", `destinatario`, `cargo`, `nome` (filtra ao sair do campo). Botão "Gerar relatório".
- Tabela: `select`, `numeroprocesso`, `nomealuno`; contador "n processo(s) selecionados"; paginação 10/20/50; células com classe `skeleton` durante a carga.
- Saída só na impressão: cabeçalho "Unidade de Registro de Diplomas", data por extenso, "Ofício nº x/ano", remetente e destinatário, texto com a quantidade em algarismos e por extenso, tabela Nº / Nº do processo / Nome do aluno, assinatura.

**Relatório de devolução de diplomas** (`relatoriodevolucao`)
- Propósito: escolher processos publicados de uma unidade e imprimir o ofício de devolução dos diplomas registrados.
- Campos (`relatorio-de-devolucao.component.ts:31-42`): `unidade` (select de 25 unidades fixas), `data` "Data de publicação", `edicao`, `sessao`, `pagina`, `oficio`, `destinatario`, `copia`. Botões "Buscar" e "Gerar relatório".
- Tabela: `select`, `numeroprocesso`, `nomealuno`, `unidade`; paginação 10/20/50.
- Saída só na impressão: como o anterior, com o texto do DOU e a imagem `recebido.png`.

- Classificação dos dois: **parcial**. Padrão `consulta-relatorio` (filtros + resultado) com seleção em lote de `listagem-crud`; base `relatorios/filtros` e `relatorios/resultado`. **Falta** padrão de documento para impressão (ofício com cabeçalho, corpo e assinatura).

### 1.10 Registro do diploma digital (`registro/pesquisa`, `registro/informativo`)

**Pesquisa** (`paginas/registro/registro/registro.component.html`)
- Propósito: buscar por data de registro os diplomas a enviar ao serviço de diploma digital e acompanhar os já enviados.
- Peças: campo de data com máscara e botão "Buscar"; abas "a registrar" e "registrado"; "Data pesquisada: dd/mm/aaaa"; tabela `app-data-table`; botão "carregar mais"; mensagens "Ops... Ainda não foi feita nenhuma pesquisa!" e "Ops... Nenhum registro foi encontrado."
- Colunas (`registro/data-table/data-table.component.html:5-12`): cpf, nome, curso, data conclusão, data registro, unidade, segunda via, registrado (botão "registrar", ou "Aguarde. Em breve o link estará disponível", ou link "download").
- Classificação: **parcial**. Padrão `listagem-crud`; base `isencao/fila`. Peças: date-field, tabs, data-table, empty-state, link, skeleton. A paginação por "carregar mais" não tem equivalente confirmado na peça `pagination`.

**Diálogo "Deseja enviar este registro de diploma?"** (`registro/shared/modal/confirmation-modal/`)
- Lista Aluno(a), Curso, Unidade, Data do registro; em segunda via, `textarea` "Chancela"; "Cancelar"/"Enviar".
- Classificação: **parcial**. Peça `dialog` + description-list + textarea.

**Diálogo de informação** (`registro/shared/modal/information-modal/`): ícone, lista de mensagens e "Fechar". Nenhum código o abre (o método `modalGeneric` de `registro.component.ts:255-260` não é chamado). **nao-migrar**.

**Informativo** (`paginas/registro/informativo/informativo.component.html`)
- Propósito: executar o envio e mostrar o resultado.
- Peças: cartão "Informação do aluno(a)" (Aluno(a), Curso, Unidade, Data do registro), "Aguarde. Estamos processando sua solicitação." com spinner, bloco de mensagens "Origem: - ..." e lista numerada, botão "voltar".
- Classificação: **parcial**. Base `isencao/resultado`; peças card, description-list, alert, skeleton/progress.

### 1.11 Diálogos compartilhados

- **Mensagem de resultado** (`shared/crudmessage/crudmessage.component.html`): ícone, título ("Sucesso!", "Campos inválidos!", "Erro!"), texto e botão "OK". Aberto por 8 componentes. **parcial**: peças dialog e alert.
- **Carregando** (`shared/loadingdialog/loadingdialog.component.html`): `mat-progress-spinner` de 50px dentro de um diálogo. **parcial**: peça progress/skeleton.
- **Botão de três estados** (`shared/button-toggle/`): não é usado em nenhum template. **nao-migrar**.

### 1.12 Peças com rota e sobras

- `exigencia`, `processotable`, `prorrogacaotable`: componentes de apoio que também têm rota; abertos direto não recebem as entradas que precisam. **nao-migrar** como tela.
- `top-bar`, `MenuComponent`, `UserPanelComponent`: moldura antiga; nenhum template os usa (o `app.component.html` usa `ucam-frame-model`). **nao-migrar**.
- Stores `empresa`, `planodecontas`, `tipoprovento`, `professor`, `curso`, modelos `AtivoImobilizado` e `Planodecontas`, `ProfessorGraduacaoService`, `FormErrosDirective` (usa jQuery e Materialize): sem uso nas telas deste sistema. **nao-migrar**.

---

## 2. Moldura e navegação

- **Moldura**: `<ucam-frame-model>` envolve o `router-outlet` e recebe `usuario`, `unidade`, `unidades`, `environment`, `store`, `AuthActions`, com saídas `logout` e `changeUnidade` (`app.component.html:1-12`). O que ela desenha (cabeçalho, menu lateral, conta) é **não confirmado**: a biblioteca não está na pasta. Pelos seletores de impressão em `app.component.css:15-29` ela tem `.ucam-frame-header`, `.mat-drawer` (menu lateral), `.ucam-frame-model-content-container` e `.serd-panel-header`.
- **Cabeçalho de página**: `app-form-template` mostra a marca SERD (`environment.APPLICATION_ICON`), "/" + título e a área `panel-search` (`shared/form-template/form-template.component.html:3-13`).
- **Menu**: a moldura antiga busca o menu em `GET /usuario/menus/{usuario}/{aplicação}/{unidade}` (`top-bar/menu/menu.services.ts:17`) e o mostra em acordeão com ícone e submenus que apontam para `/{link}` (`top-bar/menu/menu.component.html:10-25`). Como esse componente não é usado, a origem do menu atual é **não confirmada** (provavelmente a moldura, que recebe `environment.APPLICATION_ID`). Os rótulos e a ordem do menu não estão no front.
- **Conta**: na moldura antiga, inicial do nome, nome, seletor de unidade e "Sair" (`top-bar/top-bar.component.html:19-43`); link de ajuda para o manual em PDF (`:14`; `environment.MANUAL_URL`).
- **Troca de unidade**: grava a unidade escolhida na sessão e volta para `/home` (`app.component.ts:47-50`; `services/auth/store/auth.reducers.ts:65-71`).
- **Login**: externo. `LOGIN_URL` aponta para `login.jsf?client_id=...` (`environments/environment.ts:8`); a volta é por `login/:token/:user/:unidade`. Sair limpa o `localStorage` e redireciona para `LOGIN_URL` (`auth.reducers.ts:62`; `services/auth/store/auth.effects.ts:63`).
- **Impressão**: `window.print()` com regras `@media print` que escondem a moldura (`app.component.css:10-35`); as telas usam as classes `hide-on-print` e `hide-on-screen`. Existe um `router-outlet name="print"` sem rota que o use (`app.component.html:13`).
- Classificação da moldura: **parcial**. Padrão `shell-aplicacao`; base `portal/grade-modulos`; peça `app-shell` (faixa, navegação, conta, unidade).

---

## 3. Peças usadas com contagem

Contagens por `grep` nos 48 `.html` de `src/app` (ocorrências da tag ou do atributo; inclui trechos comentados). As combinações tag + atributo foram contadas com busca multilinha, porque muitas tags estão quebradas em várias linhas.

### 3.1 Biblioteca `ucam-material` (conteúdo não confirmado)

| Peça | Ocorrências |
|---|---|
| `<ucam-material-input>` (inclui `type="search"` 6 e `type="toggle"` 2) | 60 |
| `<ucam-material-select>` | 8 |
| `<button ucam-material>` (modificadores `outline`, `rounded`, `circle`, `box`, `join`, `small`, `color`, `hover`), de 95 `<button>` no total | 65 |
| `<table ucam-material mat-table>` | 7 |
| `<mat-paginator ucam-material>` (com `UcamMaterialPaginatorDirective.createMiddleButtons()`) | 7 |
| `<input ucam-material>` / `<textarea ucam-material>` | 11 |
| atributos de grade `row`, `col-N`, `right` | não contados |

`<ucam-frame-model>`: 1 (`app.component.html:1`). `<ucam-select>` (biblioteca local `projects/ucam-select`): 0 nos templates; o módulo é importado e a classe é usada só como tipo.

### 3.2 Angular Material

| Peça | Ocorrências |
|---|---|
| `<mat-icon>` (mais 14 `<i class="material-icons">`) | 49 |
| `matInput` (atributo) | 83 |
| `<mat-form-field>` | 38 |
| `<mat-tab>` em 8 `<mat-tab-group>` | 28 |
| `<mat-error>` | 14 |
| `<textarea>` (11 com `matTextareaAutosize`) | 14 |
| `<mat-dialog-content>` / `<mat-dialog-actions>` | 13 / 13 |
| `mat-dialog-title` | 9 |
| `<mat-checkbox>` | 9 |
| `mat-icon-button` | 8 |
| `<mat-paginator>` | 8 |
| `mat-table` | 7 |
| `<mat-progress-bar>` | 7 |
| `mat-sort-header` (4 tabelas têm `matSort`; só processo e prorrogação têm cabeçalho ordenável) | 11 |
| `<mat-option>` em 2 `<mat-select>` e 2 `<mat-autocomplete>` | 5 |
| `<mat-step>` em 1 `<mat-horizontal-stepper>` | 5 |
| `<mat-spinner>` / `<mat-progress-spinner>` | 3 / 1 |
| `<mat-datepicker>` | 2 |
| `<mat-card>` | 2 |
| `<mat-slider>` | 1 |
| `matBadge` | 1 |
| `<mat-expansion-panel>` (só em trecho comentado) | 2 |

No código: 35 chamadas `dialog.open(` (8 abrem a mensagem de resultado, 10 abrem o diálogo de carregamento), 4 `MatSnackBar.open`, 3 `alert()`, 4 `window.print()`.

### 3.3 Tabelas

17 `<table>`: 7 `mat-table` (todas com `ucam-material`) e 10 tabelas HTML simples. A classe `data-table` aparece em 9: sete simples (exigências, prorrogações, diplomas, equivalências ×2, histórico, registro digital) e as duas `mat-table` de processo e de prorrogação. As outras três simples são a lista "Números cancelados" e as duas tabelas dos ofícios impressos. Seleção por caixa em 3 tabelas (criação de lote e os dois relatórios).

### 3.4 Componentes próprios

| Componente | Usos em template |
|---|---|
| `app-form-template` (+ `panel-title` 10, `panel-content` 10, `panel-search` 2) | 10 |
| `app-processo-table` | 6 |
| `app-exigencia` | 3 |
| `app-prorrogacao-table` | 2 |
| `app-data-table` (registro digital) | 2 |
| `app-loading` / `app-spinner` / `app-notification` | 3 / 2 / 2 |
| `pagina-diploma` / `print-page` | 2 / 1 |
| `app-diploma`, `app-prorrogacao` | 1 / 1 |
| `app-crudmessage`, `app-loadingdialog` e 15 diálogos de tela | abertos por `MatDialog` |

### 3.5 Bibliotecas (`package.json`, raiz)

- Angular 6.0.3, Angular Material/CDK 6.2.1, `@angular/material-moment-adapter` 7.0.3, NgRx 6.0.1 (store, effects, router-store, devtools), RxJS 6.
- `ucam-material` 0.0.6639, `ucam-frame-model` 0.0.6675, `ucam-select` 0.0.2.
- Máscara: `ngx-mask` 8.2.0 (atributo `mask` 7 vezes, pipe `mask` 4 vezes); `jquery.maskedinput` 1.4.1 declarada, sem uso nas telas.
- PDF: `ng2-pdf-viewer` 5.2.3 (`<pdf-viewer>` 3 vezes: diploma na expedição, diálogo de diploma, publicação de lote).
- `@ng-bootstrap/ng-bootstrap` 4.1.1 e `bootstrap` 4.1.1 (acordeão do menu antigo, 1 uso; classes `row`/`col-N`).
- `lodash`, `moment`, `mime-types`, `hammerjs`, `jquery` 3.3.1 (usado para marcar aba inválida, `paginas/expedicao/dialog-processo/dialog-processo.component.ts:469`).
- Declaradas e sem uso nos templates: `ng-select`, `ng-select2`, `select2`, `ng2-nouislider`, `nouislider`.
- Editor rico: nenhum. Datatables: nenhum (tabelas são `mat-table` ou HTML). Gráficos: nenhum.
- Pipes próprios: `capitalizeWord` (6 usos), `fristLetter` (1, na moldura antiga); `turno`, `boolean`, `nome`, `currencyformat` sem uso em template. Pipe `titlecase` do Angular: 24 usos.
- Fontes e ícones carregados no `src/index.html`: Material Icons, Arapey, Font Awesome 4.7.

---

## 4. Regras de negócio lidas no código

1. **Entrada só por token do login central.** A rota `login/:token/:user/:unidade` dispara a autenticação; não há formulário de usuário e senha. `login/login.component.ts:46-59`; `app.module.ts:60-61`. Tipo: integração.
2. **A unidade inicial da sessão é a primeira da lista do usuário.** A sessão guarda usuário, unidades, token e unidade selecionada em `localStorage` (`AuthState`); a unidade da URL vai só para o cabeçalho das requisições. `services/auth/store/auth.reducers.ts:14-16`, `:48-51`; `login/login.component.ts:51`. Tipo: integração.
3. **Só usuário autenticado acessa as telas; não há perfil no front.** Sem sessão, o guard dispara a saída. `services/auth/auth-guard.service.ts:25-28`. A rota `livroderegistros` não tem guard (`paginas/livro-de-registros/livro-de-registros.module.ts:15-19`). Tipo: permissão.
4. **Toda requisição leva a unidade em uso no cabeçalho `oidunidade`.** `interceptor.module.ts:28-32`. Ao abrir um processo, o cabeçalho passa a ser a unidade do processo (`paginas/expedicao/dialog-processo/dialog-processo.component.ts:202`; `paginas/controledeexpedicao/dialog-controle/dialog-controle.component.ts:166-168`). Tipo: integração.
5. **Trocar de unidade leva ao início.** `app.component.ts:47-50`. Tipo: transição de situação.
6. **Sair apaga a sessão local e volta ao login central.** `services/auth/store/auth.reducers.ts:54-63`; `services/auth/store/auth.effects.ts:59-64`. Tipo: integração.
7. **O menu depende de usuário, aplicação e unidade.** Aplicação `872b3dd3-44f3-4e1a-9f85-6b5af8f08fbc`. `top-bar/menu/menu.services.ts:15-21`; `environments/environment.ts:15`. O componente que faz essa chamada não está em uso; a regra atual fica na moldura (não confirmado). Tipo: permissão.
8. **No cadastro de dados do aluno são obrigatórios: aluno, data de colação, data de conclusão e forma de ingresso (mínimo 3 caracteres).** `paginas/cadastro-dados-aluno/cadastro-dados-aluno.component.ts:72-75`. Tipo: validação.
9. **Dados pessoais e curso vêm do acadêmico e não são editados nem salvos por esta tela** (CPF, matrícula, nascimento, identidade, órgão expedidor, nacionalidade, naturalidade, curso). `...cadastro-dados-aluno.component.ts:78-86`, `:158-165`. Tipo: integração.
10. **A data de colação de grau não pode ser posterior a hoje.** Mensagem: "A data de colação de grau não deve ser posterior a hoje." `...cadastro-dados-aluno.component.ts:268-269`, `:300-304`. Tipo: validação.
11. **Aviso de matrícula fora do esperado.** Se a situação não é `ATIVO` nem `FORMADO`, ou o último semestre não é do ano atual nem o 2º semestre do ano anterior, aparece "Esta matrícula está {situação} e seu último semestre foi em {ano}/{semestre}." É só aviso; não bloqueia. `...cadastro-dados-aluno.component.ts:132-148`; `paginas/expedicao/dialog-processo/dialog-processo.component.ts:297-313`. Tipo: validação.
12. **Informar a colação pela primeira vez cria o processo de diploma; marcar "Segunda via" cria um processo novo.** Mensagem de retorno: "Numero do processo: {n}". Se não havia processo e há colação, o salvamento é repetido pedindo a criação. `...cadastro-dados-aluno.component.ts:222-227`, `:234-241`. Tipo: transição de situação.
13. **Com processo já gerado, "Salvar" fica bloqueado, salvo se for segunda via.** `paginas/cadastro-dados-aluno/cadastro-dados-aluno.component.html:115`. Tipo: permissão.
14. **A busca de aluno é por nome e restrita à unidade em uso.** `...cadastro-dados-aluno.component.ts:104-108`; `shared/store/aluno/aluno.effects.ts:20`. Tipo: limite.
15. **Situações do processo.** `SEM_EXPEDICAO` "Sem expedição", `EXPEDIDO` "Expedido", `EM_ANALISE` "Em análise", `EM_EXIGENCIA` "Em exigência", `DEFERIDO` "Deferido", `REGISTRADO` "Registrado", `ANULADO` "Anulado". `shared/enums/estadoprocesso-enum.enum.ts:1-9`. Ícones: `public`, `flag`, `folder`, `whatshot`, `school`, `assignment_turned_in`, `cancel` (`paginas/processo-table/processo-table.component.ts:301-311`). A expedição mostra as cinco primeiras em abas (`paginas/expedicao/expedicao.component.ts:27`). Tipo: transição de situação.
16. **Processo novo nasce sem número ("s/n") e em "Sem expedição"; o botão "Criar" só existe enquanto o número é "s/n".** `paginas/expedicao/dialog-processo/dialog-processo.component.ts:208-209`; `...dialog-processo.component.html:625`. Tipo: transição de situação.
17. **Expedir exige processo criado, situação "Sem expedição" e prazo não vencido.** O prazo vale se `totalprorrogacao + diascolacaograu >= 0`; senão: "Prazo expirado, solicite uma prorrogação." `...dialog-processo.component.html:636`; `...dialog-processo.component.ts:341-347`. Tipo: prazo.
18. **O processo só é criado ou expedido com todos os campos válidos; o erro diz em que abas estão.** Mensagem: "Existem campos inválidos nas Abas: {abas}" (abas "Dados Principais", "Sobre o Curso", "Documentos"); a lista de documentos é obrigatória. `...dialog-processo.component.ts:153`, `:172-192`, `:441-446`. Tipo: validação.
19. **Por padrão só aparecem 12 tipos de documento digitalizado.** `TODOS_OS_DOCUMENTOS`, `CERTIDAO_DE_NASCIMENTO_OU_CASAMENTO`, `IDENTIDADE`, `CPF`, `DIPLOMA_ENSINO_MEDIO`, `HISTORICO_ESCOLAR`, `QUADRO_DE_EQUIVALENCIAS`, `DIPLOMA_GRADUACAO`, `HISTORICO_GRADUACAO`, `HISTORICO_POS_GRADUACAO`, `HISTORICO_MESTRADO`, `HISTORICO_PARA_REGISTRO`; um alternador troca entre a lista filtrada e a completa. `...dialog-processo.component.ts:59-72`, `:227-242`; `paginas/controledeexpedicao/dialog-controle/dialog-controle.component.ts:42-55`. Tipo: limite.
20. **Um processo existente pode ser marcado como 2ª via enquanto não estiver deferido.** `...dialog-processo.component.html:587`; `...dialog-processo.component.ts:586-594`. Tipo: transição de situação.
21. **A unidade não cria nem edita exigência; só marca "Cumprida", e só até o processo ser deferido.** `...dialog-processo.component.html:350-352`. Tipo: permissão.
22. **A unidade só pede prorrogação se o processo não está em análise nem deferido; o pedido exige número de dias e motivo.** `...dialog-processo.component.html:377`; `paginas/expedicao/prorrogacao/dialog-prorrogacao/dialog-prorrogacao.component.ts:34-36` (o motivo usa `Validators.min(5)`, validação numérica aplicada a texto). Tipo: validação.
23. **Situações da prorrogação: `SOLICITADO`, `EM_ANALISE`, `DEFERIDO`, `INDEFERIDO`; o pedido só é editável enquanto "Solicitado".** `shared/enums/estadoprorrogacao-enum.enum.ts:1-6`; `paginas/expedicao/prorrogacao/prorrogacao.component.html:39`. Na aba da unidade, "Solicitadas" reúne `SOLICITADO` e `EM_ANALISE` e "Deferidas" só `DEFERIDO` (`.../prorrogacao.component.ts:70-76`). Tipo: transição de situação.
24. **O filtro "Diploma" só vale para processos deferidos.** Opções e pares (registrado, publicado): Todos `%,%`; Sem diploma `N,N`; Registrado `S,N`; Publicado `S,S`. `paginas/expedicao/expedicao.component.ts:33-51`, `:96-100`; `paginas/controledeexpedicao/controledeexpedicao.component.ts:33-50`. Tipo: limite.
25. **Sem "Dias de vencer" informado, a consulta usa 120 dias nos processos e na criação de lote, e 60 nas prorrogações.** `paginas/expedicao/processo.service.ts:45-47`, `:120-122`; `paginas/lote-diploma/geracao-lote-diploma/criacao-lote-diploma.service.ts:26-28`; `paginas/expedicao/prorrogacao/prorrogacao.service.ts:23-25`. Tipo: prazo.
26. **Cor do vencimento: mais de 40 dias verde, mais de 20 amarelo, até 20 vermelho.** `paginas/processo-table/processo-table.component.ts:155-162`; `paginas/controleprorrogacao/prorrogacao-table/prorrogacao-table.component.ts:97-104`. Tipo: prazo.
27. **Em processos deferidos a coluna "Vencimento" dá lugar a "Diploma": "Sem diploma", "Registrado" ou "Publicado".** `...processo-table.component.ts:98-120`, `:313-323`. Tipo: formato.
28. **O vencimento conta dias desde a colação (visão da unidade) ou desde a expedição (visão da URD), soma os dias prorrogados e leva os selos "Reemissão" e "2ª via".** `paginas/processo-table/processo-table.component.html:44-59`. Tipo: cálculo.
29. **A URD vê processos de todas as unidades, nunca os "Sem expedição"; a lista abre em "Expedido" e o filtro mostra a contagem por situação.** `paginas/controledeexpedicao/controledeexpedicao.component.html:58-60`; `...controledeexpedicao.component.ts:60`, `:109-131`; `...processo-table.component.ts:293-299`. Tipo: permissão.
30. **Decisões da URD por situação.** "Anular" e "Em análise" só se o processo não está deferido, em análise ou anulado; "Deferir" só se está expedido ou em análise. `paginas/controledeexpedicao/dialog-controle/dialog-controle.component.html:422`, `:441`, `:454`, `:463`. Nenhuma pede confirmação (`...dialog-controle.component.ts:341-398`). Tipo: transição de situação.
31. **A URD cria, edita e exclui exigências até deferir; a aba mostra quantas estão sem cumprir; após cada mudança a situação do processo é relida do servidor.** `...dialog-controle.component.html:293-296`, `:317`; `...dialog-controle.component.ts:173-179`, `:426-432`. A passagem para "Em exigência" é decidida no backend (não confirmado). Tipo: transição de situação.
32. **Exigência: documento e observação obrigatórios; nasce com situação `NAO_CUMPRIU` e responsável "pessoa"; situações `NAO_CUMPRIU` e `CUMPRIU`.** Documento escolhido entre 30 tipos. `paginas/exigencia/dialog-exigencia/dialog-exigencia.component.ts:50-53`, `:63-64`; `paginas/exigencia/exigencia.component.ts:106-114`, `:151-156`; `shared/enums/tipodocumento-enum.enum.ts:1-32`. Tipo: validação.
33. **O diploma só pode ser lançado depois do deferimento.** Antes disso: "Disponível ao deferir o processo". `paginas/controledeexpedicao/diploma/diploma.component.ts:51-57`; `...dialog-controle.component.html:342`. Tipo: transição de situação.
34. **Diploma: data de registro e número do diploma obrigatórios; livro, folha e número de registro não são digitados.** `paginas/controledeexpedicao/diploma/dialog-diploma/dialog-diploma.component.ts:65-71`. O arquivo do diploma é PDF e o do diploma digital é XML, este só com o diploma já salvo (`...dialog-diploma.component.html:17`, `:91`; `...dialog-diploma.component.ts:298-299`). Quem gera livro, folha e registro: não confirmado. Tipo: validação.
35. **Cancelar o número de um diploma pede número, novo número e justificativa, guarda o número cancelado e troca o número do diploma.** `paginas/controledeexpedicao/diploma/dialog-cancel-diploma/dialog-cancel-diploma.component.ts:37-39`, `:53-81`. O envio não verifica se o formulário é válido. A ação some em diploma `CANCELADO` (`paginas/controledeexpedicao/diploma/diploma.component.html:64`). Tipo: transição de situação.
36. **Toda mudança de situação leva o nome do usuário, e o processo tem histórico com data, situação e usuário.** `paginas/expedicao/processo.service.ts:236`, `:246`, `:256`, `:266`, `:281`; `paginas/controledeexpedicao/dialog-historico-processo/dialog-historico-processo.component.html:14-16`. Tipo: integração.
37. **Controle de prorrogação em duas filas: "Solicitado" (`SOLICITADO`, `EM_ANALISE`) e "Concluído" (`DEFERIDO`, `INDEFERIDO`).** `paginas/controleprorrogacao/controleprorrogacao.component.html:18-19`; `paginas/controleprorrogacao/prorrogacao-table/prorrogacao-table.component.html:5`. Tipo: transição de situação.
38. **A URD defere ou indefere pedido solicitado ou em análise; "Em análise" só para pedido solicitado.** `paginas/controleprorrogacao/dialog-controle/dialog-controle.component.html:132-134`. Tipo: transição de situação.
39. **Situações do lote: `CADASTRADO`, `EXPEDIDO`, `PUBLICADO`, `CANCELADO`; a lista abre em "Cadastrado".** `paginas/lote-diploma/controle-lote-diploma/listar-lote-diploma.component.ts:53-74`, `:93`. Tipo: transição de situação.
40. **Só lote "Cadastrado" pode ser cancelado, e o cancelamento não pede confirmação.** `.../listar-lote-diploma.component.html:58`; `.../listar-lote-diploma.component.ts:166-175`. Tipo: transição de situação.
41. **Lote: "Expedir" só em `CADASTRADO`, "Publicar" só em `EXPEDIDO`; a aba "Publicação" só em `EXPEDIDO` ou `PUBLICADO`; "Diário oficial" só em `PUBLICADO`; em `PUBLICADO` não se retira diploma do lote.** Mensagem ao retirar: "O diploma foi removido do lote com sucesso". `.../view-lote-diploma-dialog/view-lote-diploma-dialog.component.html:75`, `:83`, `:94-95`; `.../view-lote-diploma-dialog.component.ts:39-41`, `:44-46`, `:121`. Tipo: transição de situação.
42. **O aviso de registro do lote só pode ser copiado pelo botão "Copiar".** Copiar ou recortar pelo teclado mostra "Não é permitido copiar essas informações desta forma.\nClique no botão copiar" (ou "recortar"). O texto vem do servidor (`avisoregistro`). `.../expedir-lote-diploma-dialog/expedir-lote-diploma-dialog.component.ts:21-37`, `:44-50`. Tipo: permissão.
43. **Publicar lote exige a data de publicação (dd/mm/aaaa) e aceita o PDF do Diário Oficial; a data segue em milissegundos na URL.** `.../publicar-lote-diploma-dialog/publicar-lote-diploma-dialog.component.ts:33`, `:56-58`; `.../publicar-lote-diploma-dialog.component.html:10`, `:27`. O envio não verifica se o formulário é válido. Tipo: formato.
44. **Só diploma sem lote entra em lote novo; a seleção se mantém entre páginas e a criação pede confirmação.** Filtro: Todos `%`, Sem Lote `N` (padrão), Com Lote `S`. Textos: "O lote {data} com {n} diploma(s) será criado, deseja continuar?" e "O lote número {n}, do dia {data} com {n} diploma(s) foi criado com sucesso." `paginas/lote-diploma/geracao-lote-diploma/criacao-lote-diploma.component.html:15`, `:67`; `.../criacao-lote-diploma.component.ts:41-54`, `:89`, `:183-189`; `.../criar-lote-diploma-dialog/criar-lote-diploma-dialog.component.html:5`; `.../confirma-criacao-lote-diploma-dialog/confirma-criacao-lote-diploma-dialog.component.html:5`. Tipo: limite.
45. **A data de publicação do lote é exibida fixando a hora em 03:00 UTC.** `paginas/lote-diploma/controle-lote-diploma/listar-lote-diploma.component.ts:148-152`. Tipo: formato.
46. **O livro de registro é consultado por ano, de 2019 até o ano corrente.** `paginas/livro-de-registros/livro-de-registros.component.ts:84-93`. Tipo: limite.
47. **O livro mostra duas folhas por vez e imprime todas as folhas do ano, uma por página.** `paginas/livro-de-registros/livro-de-registros.component.html:28-31`, `:37-40`; `app.component.css:33-34`. Tipo: formato.
48. **Ofício de envio para assinatura: lista processos sem diploma e traz a quantidade em algarismos e por extenso.** Texto: "Estamos enviando {n} ({extenso}) diplomas, para assinatura. Tão logo estejam assinados, agradecemos à devolução dos mesmos." Remetente, cargo e e-mail de contato (`urd@candidomendes.edu.br`) estão fixos no template. `paginas/relatorio/assinatura/relatorio-envio-assinatura/relatorio-envio-assinatura.component.html:127-142`, `:167-178`; `.../relatorio-envio-assinatura.service.ts:21`; `helpers/number.helper.ts:6-47`. Tipo: formato.
49. **Ofício de devolução: lista processos publicados de uma unidade, opcionalmente por data de publicação, e cita o DOU (data, edição, seção, página).** Texto fixo: "(Não esquecer de tirar cópia do DOU e anexar ao Diploma na entrega)". "C/C" só aparece se preenchido. A lista de unidades é fixa, 25 itens. `paginas/relatorio/devolucao/relatorio-de-devolucao/relatorio-de-devolucao.component.html:117-137`; `.../relatorio-de-devolucao.component.ts:158-172`; `shared/enums/unidades-enum.enum.ts:1-27`. Tipo: formato.
50. **O registro digital é pesquisado por data de registro, 10 por vez, com "carregar mais".** A data digitada dd/mm/aaaa vai como aaaa-mm-dd. `paginas/registro/registro/registro.component.ts:13-15`, `:107-110`, `:153-164`. Sem data: `alert('Selecione uma data!')` (`:149`). Tipo: formato.
51. **Duas listas na pesquisa: "a registrar" e "registrado".** `paginas/registro/registro/registro.component.ts:227-242`; `paginas/registro/services/registro-diploma.service.ts:14-22`. Tipo: transição de situação.
52. **Registro de segunda via exige chancela.** A chancela é buscada por CPF e matrícula e pode ser editada; "Enviar" fica bloqueado sem ela. Modelo no campo: "Registro da 1ª via na URD sob o número [NUMERO] Livro [LIVRO] Folha [FOLHA] em [DATA], Processo [PROCESSO]." `paginas/registro/registro/registro.component.ts:174-188`; `paginas/registro/shared/modal/confirmation-modal/confirmation-modal.component.html:26`, `:36`. Tipo: validação.
53. **Resultado do envio do registro por código de resposta.** 200: "Registro feito com sucesso! Aguarde até que o link seja disponibilizado. Consulte na aba "registrado"."; 500: "500 - Ocorreu um erro inesperado no registro do diploma. Entre em contato com o administrador do sistema."; 400: origem + lista de mensagens de validação; 540: origem + lista de textos, com estilo de alerta; outros: "Desconhecido - Ocorreu um erro inesperado no registro do diploma. Entre em contato com o administrador do sistema." `paginas/registro/informativo/informativo.component.ts:49-52`, `:58-61`, `:62-77`, `:78-93`, `:94-97`. Tipo: integração.
54. **O PDF do diploma digital só fica disponível depois de assinado.** Antes: "Aguarde. Em breve o link estará disponível". `paginas/registro/registro/data-table/data-table.component.html:29-33`; `.../data-table.component.ts:25`. Tipo: transição de situação.
55. **Mensagens padrão de resultado.** "Sucesso!" / "A operação foi realizada com sucesso. " (+ mensagem); "Campos inválidos!" (+ texto); "Erro!" com `message_user` do servidor ou "Ocorreu um erro ao realizar esta operação." `shared/crudmessage/crudmessage.component.ts:20-48`. Tipo: formato.
56. **Mensagens de campo.** "Campo requerido", "Valor mínimo: {n}", "Valor máximo: {n}", "Valor inválido". `services/util.service.ts:13-22`. Tipo: validação.
57. **Paginação em português.** "Itens por página", "Próxima", "Anterior", "{início} - {fim} de {total}", "0 de {total}"; tamanhos 10/20/50 (5/10/25/50 nos diplomas do lote). `shared/MatPaginatorCustomized.ts:3-17`; `paginas/processo-table/processo-table.component.html:194`; `.../view-lote-diploma-dialog/view-lote-diploma-dialog.component.html:68`. Tipo: formato.
58. **Formatos.** CPF `000.000.000-00` (`paginas/processo-table/processo-table.component.html:88`); CNPJ `00 00.000.000/0000-00` (`paginas/livro-de-registros/page/page.component.html:84`); datas digitadas `99/99/9999` (`paginas/cadastro-dados-aluno/cadastro-dados-aluno.component.html:88`, `:92`); abertura do processo `dd/MM/yy HH:mm` (`paginas/controledeexpedicao/dialog-controle/dialog-controle.component.html:7`); nome do XML baixado "DIPLOMA DIGITAL {aluno} - {processo}.xml" (`paginas/expedicao/dialog-processo/dialog-processo.component.ts:650`). Tipo: formato.

---

## 5. API consumida

Três bases, definidas em `environments/environment*.ts`: `API_SERVICE` (`{backend}/api`, repositórios com `_embedded` e `page`), `API_RESOURCE_SERVICE` (`{backend}`) e `API_INTEGRATION_REGISTER` (integração do diploma digital). Abaixo, **A** = `API_SERVICE`, **R** = `API_RESOURCE_SERVICE`, **I** = `API_INTEGRATION_REGISTER`. `environment.prod.ts` usa marcadores (`DEPLOY_SERD_BACKEND`, `URL_LOGIN`) trocados na publicação. `API_REGISTER` (`http://localhost:3000`) é declarado e não é usado por nenhuma tela.

### 5.1 Endpoints por serviço

**Sessão** (`services/auth/store/auth.effects.ts`, `top-bar/menu/menu.services.ts`, `services/pessoa.services.ts`)
- GET R `/usuario/pessoa/{oidusuario}`
- GET R `/usuario/unidades/{oidusuario}`
- GET R `/usuario/menus/{oidusuario}/{aplicação}/{oidunidade}` (componente fora de uso)
- GET R `/pessoa/foto/{oid}` (componente fora de uso)

**Aluno** (`shared/store/aluno/aluno.effects.ts`)
- GET A `/aluno/search/findByPessoaNomeAndOidunidade?nome=&oidunidade=`

**CadastroDadosAlunoService** (`paginas/cadastro-dados-aluno/cadastro-dados-aluno.service.ts`)
- GET R `/aluno/situacaomatricula/{matricula}`
- POST R `/historico/nomeusuario/{nomeUsuario}/{criaNovoProcesso}?segundavia=`
- PUT R `/historico/nomeusuario/{nomeUsuario}/{criaNovoProcesso}?segundavia=`
- GET A `/historico/search/findByProcesso` e DELETE R `/historico/{oid}` (sem chamada nas telas)

**ProcessoService** (`paginas/expedicao/processo.service.ts`)
- GET A `/processovw/search/findByNomealunoAndEstadoAndDiascolacaograu`
- GET A `/processovw/search/findProcessoDeferidoByNomealunoAndDiascolacaograuAndDiploma`
- GET R `/processovw/search/findAllByNomealunoAndEstadoAndDiasexpedido`
- GET A `/processovw/search/findAllByNomealunoAndEstadoAndDiasexpedidoAndDiploma`
  - parâmetros comuns: `nomealuno`, `estado`, `diasexpedido`, `diascolacaograu`, `oidunidade`, `page`, `size`, `sort`; nos deferidos, `registrado` e `publicado`
- GET R `/processo/countProcessos` (retorna lista `{estado, quantidade}`)
- GET A `/processo/search/findByIdAluno?idaluno=`
- GET R `/processo/{oid}/estado`
- POST R `/processo/nomeusuario/{nome}?segundavia=`
- PUT R `/processo/expedir/nomeusuario/{nome}`
- PUT R `/processo/analisar/nomeusuario/{nome}`
- PUT R `/processo/deferir/nomeusuario/{nome}`
- GET R `/processo/anular/{oid}/nomeusuario/{nome}`
- POST R `/processo/segundavia/{oid}`
- GET R `/processo/imagem/{oidunidade}/{oiddocumentoescaneado}/download`
- GET A `/historicoprocesso/search/findByOid?oidprocesso=`
- GET R `/aluno/{oidaluno}`
- GET R `/isencao/{oidaluno}?page=&size=` (equivalências; padrão 100 por página)
- GET R `/isencao/imagem/{oidisencao}/download`
- GET A `/unidade`
- GET R `/diploma/imagem/{oidunidade}/{oiddiploma}`

**ExigenciaService** (`paginas/expedicao/exigencia.service.ts`)
- GET A `/exigencia/search/findByProcesso?oidprocesso=&situacao=&page=&size=`
- POST R `/exigencia/{nome}`; PUT R `/exigencia/{nome}`
- DELETE R `/exigencia/{oid}/{nome}/{oidProcesso}`

**ProrrogacaoService** (`paginas/expedicao/prorrogacao/prorrogacao.service.ts`)
- GET A `/prorrogacaovw/search/findByNomealunoAndProrrogacaoestadoAndDiascolacaograu` (`nomealuno`, `prorrogacao_estado`, `diascolacaograu`, `sort`, `page`, `size`)
- GET A `/prorrogacao/search/findByProcesso?oidprocesso=&estado=`
- POST R `/prorrogacao`; PUT R `/prorrogacao`
- GET A `/prorrogacaovw/search/getQtdProrrogacoes` e DELETE R `/prorrogacao/{oid}` (sem chamada nas telas)

**DiplomaService** (`paginas/controledeexpedicao/diploma/diploma.service.ts`)
- GET A `/diplomavw/search/findByProcesso?oidprocesso=`
- POST R `/diploma/{nome}`; PUT R `/diploma/{nome}`
- POST R `/diploma/{nome}/{oidunidade}/{oiddiploma}/upload` (PDF)
- POST R `/diploma/{nome}/{oidunidade}/{oiddiploma}/upload/xml`
- GET R `/diploma/xml/{oidunidade}/{oiddiploma}/exists`
- GET R `/diploma/xml/{oidunidade}/{oiddiploma}`
- GET R `/diploma/imagem/{oidunidade}/{oiddiploma}` e `.../download`
- GET R `/diploma/imagem/{oiddiploma}/remove`
- POST R `/diploma/cancelarnumero`
- GET A `/numerocancelado/search/findByOiddiploma?oiddiploma=`
- DELETE R `/diploma/{oid}` e PUT R `/diploma/{nome}/cancelar` (sem chamada nas telas)

**CriacaoLoteDiplomaService** (`paginas/lote-diploma/geracao-lote-diploma/criacao-lote-diploma.service.ts`)
- GET A `/diplomavw/search/findByNomealunoAndEstadoAndDiaspublicadoOrdenadoNumeroRegistro`
- GET A `/diplomavw/search/findByNomealunoAndEstadoAndDiaspublicadoAndDataRegistroOrdenadoNumeroRegistro` (`nomealuno`, `vencimentoemdias`, `temlote`, `dataregistro`, `page`, `size`, `sort`)
- POST R `/lotediploma/nomeusuario/{nome}` (corpo: lista de diplomas selecionados)
- Demais métodos do serviço (expedir, publicar, arquivos) sem chamada nas telas.

**ListarLoteDiplomaService** (`paginas/lote-diploma/controle-lote-diploma/listar-lote-diploma.service.ts`)
- GET A `/lotediploma/search/findByNumero` e `/lotediploma/search/findByEstadoAndNumero`
- GET A `/diplomavw/search/findByLoteDiploma?oidlotediploma=`
- GET R `/lotediploma/nomeusuario/{nome}/expedir/{oidlote}`
- POST R `/lotediploma/nomeusuario/{nome}/{milissegundos}/{oidlote}/publicar` (multipart com o PDF)
- GET R `/lotediploma/nomeusuario/{nome}/{oidlote}/cancelar`
- GET R `/lotediploma/nomeusuario/{nome}/{oidlote}/remover/{oiddiploma}`
- GET R `/lotediploma/imagem/{oidlote}`, `.../download`, `.../remove`

**LivroDeRegistrosService**: GET R `/livroderegistro/{ano}`

**Relatórios**
- GET R `/api/processo/search/findProcessoSemDiploma?nomealuno=&page=&size=`
- GET R `/api/processo/search/findProcessoPublicadoPorUnidade?unidade=`
- GET R `/api/processo/search/findProcessoPublicadoPorUnidadeAndDataPublicacao?unidade=&dataPublicacao=`

**RegistroDiplomaService** (`paginas/registro/services/registro-diploma.service.ts`, `paginas/registro/providers/provider.ts`)
- GET I `/integracao/diploma-aluno?data=&porPagina=&paginaAtual=&registrado=`
- GET I `/integracao/chancela/cpf/{cpf}/matricula/{matricula}` (texto)
- POST I `/integracao/diploma-aluno/registrar` (`?segundaVia=true` em segunda via)
- link I `/integracao/diploma-aluno/pdf/{oidaluno}` (download)
- GET I `/integracao/diploma-aluno/registrar/{oidUnidade}/{oidAluno}?dataRegistro=` (sem chamada nas telas)

Sem uso nas telas deste sistema: A `/empresa`, A `/curso/search/...`, A `/planodecontas/search/findByDescricaoOrCodigo`, A `/professor/search/findByNomeOrCpf`, A `/tipoproventos`, R `/professor/{ano}/{mes}`.

### 5.2 Modelos principais

Tipados no código:
- `PagebleResult` (`model/pageble-result.ts`): `_embedded`, `_links`, `page{size,totalElements,totalPages,number}`.
- `Usuario` (`model/usuario.model.ts`): `oidpessoa`, `oid`, `nome`, `email`, `foto`. `Unidade`: `oid`, `sigla`, `razaosocial`. `Pessoa`: `oid`, `nome`, `email`, `pai`, `mae`, `foto`, `oidtutor`, `status`, `sexo`, `naturalidade`.
- `NumeroCancelado` (`model/numerocancelado.model.ts`): `oid`, `status`, `data`, `numero`, `motivo`, `oiddiploma`, `usuario`.
- `IStudent` (`paginas/registro/interface/registro-diploma.interface.ts:32-47`): `oidaluno`, `cpf`, `nomealuno`, `curso`, `unidade`, `oidunidade`, `dataregistro`, `registrado`, `dataconclusaocurso`, `diplomadigitalcodigo`, `diplomadigitalurl`, `segundavia`, `chancela`, `matricula` (o template usa ainda `diplomadigitalassinado`).
- `IStudentRegister` (`:49-55`): `oidUnidade`, `oidAluno`, `dataRegistro`, `segundavia`, `chancela`. `IDefaultAPI`: `total`, `paginaAtual`, `porPagina`, `ultimaPagina`, `resultado[]`.
- `IRegistroError` e as demais interfaces do arquivo (139 ao todo) que descrevem o XML do diploma digital (diplomado, curso, IES emissora e registradora, livro de registro, histórico, currículo) em `paginas/registro/interface/registro-error.interface.ts`; a tela usa só `source`, `response.generalMessages[].text` e `response.message`.

Sem tipo (campos lidos de formulários e templates):
- **Processo** (`paginas/expedicao/dialog-processo/dialog-processo.component.ts:122-161` e tabela): `oid`, `oidunidade`, `siglaunidade`, `status`, `numero`, `dataabertura`, `estado`, `idaluno`, `aluno`, `nomealuno`, `cpf`, `matricula`, `datanascimento`, `identidade`, `orgaoexpedidoridentidade`, `nacionalidade`, `naturalidade`, `curso`, `oidmodalidade`, `oidtipocurso`, `codigomec`, `credenciamento`, `formaingresso`, `observacoes`, `dataconclusaocurso`, `datacolacaograu`, `dataexpedicao`, `numerodiploma`, `documentosEscaneadosList[{oid,tipo}]`, `diascolacaograu`, `diasexpedido`, `totalprorrogacao`, `segundavia`, `reemissao`, `temdiplomaregistrado`, `temlotepublicado`.
- **Histórico do aluno** (cadastro): `oid`, `status`, `aluno`, `colacaograu`, `dataconclusao`, `formaingresso`, `observacao`, `segundavia`; resposta com `processo.numero`.
- **Situação de matrícula**: `situacao`, `ano`, `semestre`.
- **Exigência**: `oid`, `status`, `data`, `documento`, `observacao`, `responsavel`, `situacao`, `oidprocesso`.
- **Prorrogação**: `oid`, `status`, `data`, `protocolo`, `estado`, `oidprocesso`, `numerodia`, `motivo`; na visão `prorrogacaovw` também os campos do processo e `processoestado`.
- **Diploma**: `oid`, `status`, `dataregistro`, `numeroregistro`, `livro`, `folha`, `numerodiploma`, `segundavia`, `oidprocesso`, `patharquivo`, `estado`, `numerolote`, `estadolote`, `datapublicacaolote`, `oidlotediploma`, `motivocancelamento`, `nomealuno`, `numeroprocesso`, `vencimentoemdias`, `temlote`.
- **Lote**: `oid`, `numero`, `datacriacao`, `estado`, `datapublicacao`, `pathfile`, `avisoregistro`.
- **Equivalência**: `oid`, `descricao`, `disciplinaiesorigem`, `iesorigem`, `documentocomprobatorio` (o valor ausente chega como texto `'null'`).
- **Histórico do processo**: `data`, `estado`, `nomeusuario`.
- **Folha do livro**: ver campos em 1.8.

---

## 6. O que o código não responde

1. **Quem pode fazer o quê.** O front não distingue secretaria da unidade e URD: qualquer usuário autenticado abre qualquer rota. A separação está só no menu que o backend devolve? Quem decide: coordenação da URD com a TI (perfis de acesso).
2. **Prazo de expedição.** `diascolacaograu` e `diasexpedido` vêm calculados do servidor. Qual é o prazo regulamentar, a partir de que data conta, e por que as faixas 40/20 dias e as janelas padrão 120/60? Quem decide: coordenação da URD (norma do MEC sobre expedição e registro).
3. **Quando o processo muda para "Em exigência", "Registrado" e volta.** O front só relê a situação depois de mexer em exigência ou diploma; "Registrado" e "Anulado" não têm aba nem filtro. Quem decide: coordenação da URD; a regra está no backend.
4. **Livro, folha e número de registro.** Não são digitados. Como são numerados, quantos registros por folha, quando o livro vira? Quem decide: coordenação da URD.
5. **"Reemissão" × "2ª via".** A tabela mostra os dois selos; o front só trata a segunda via. Qual a diferença e quem marca reemissão? Quem decide: coordenação da URD.
6. **Anular processo, cancelar lote e retirar diploma do lote sem confirmação.** É intencional? O que se perde em cada caso e dá para desfazer? Quem decide: coordenação da URD.
7. **Cancelamento de número de diploma.** O diploma passa a `CANCELADO` ou só troca de número? O formulário envia mesmo incompleto. Quem decide: coordenação da URD.
8. **Limite de dias e de pedidos de prorrogação.** O front aceita qualquer número de dias e não limita a quantidade de pedidos. Quem decide: coordenação da URD.
9. **Ofícios.** Remetente, cargo e e-mail estão fixos no template, e a lista de unidades da devolução é fixa (25 itens), diferente das unidades do usuário. Quem mantém isso quando muda a coordenação ou abre unidade? Quem decide: coordenação da URD com a TI.
10. **Diploma digital.** O que significa o código de resposta 540, quem assina, em quanto tempo o link fica disponível, e quando a chancela automática não vem? Quem decide: TI (integração) com a coordenação da URD.
11. **"Termo de expedição".** O botão existe e só fecha o diálogo. O documento ainda é necessário? Quem decide: secretaria das unidades com a URD.
12. **Livro de registros sem verificação de acesso** e campo "Pesquisa rápida" sem efeito: descuido ou decisão? Quem decide: TI.
13. **Tela inicial vazia.** O que o usuário deveria ver ao entrar (pendências, prazos a vencer)? Quem decide: coordenação da URD e secretarias.
14. **Documentos exigidos.** A lista de 12 tipos mostrados por padrão e os 30 tipos de exigência são os oficiais? Quem decide: coordenação da URD.
