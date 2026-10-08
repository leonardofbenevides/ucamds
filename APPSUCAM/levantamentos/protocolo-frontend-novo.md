# Inventário do front-end do Sistema de Protocolo (Angular 7)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\protocolo-frontend-novo`. Todas as referências `arquivo:linha` abaixo são relativas a `...\protocolo-frontend-novo\src\app\` (ou `src\environments\` quando indicado). Para encurtar, três prefixos:

- `REQ/` = `paginas/requerimentos/requerimento/`
- `SH/` = `paginas/requerimentos/shared/`
- `NAT/` = `paginas/natureza-requerimento/natureza-requerimento/`

**Cobertura da leitura.** Li por inteiro os 90 `.html` de `src/app`. Dos 206 `.ts` sem spec, li por inteiro `app.component.ts`, `app.module.ts`, `app.routing.ts`, `interceptor.module.ts`, tudo de `core/` (componentes, modelos, guard, store, serviços) e as rotas dos seis módulos. Os demais `.ts` (`shared/` e `paginas/`: serviços, modelos, store, pipes, helpers e componentes) li por um extrato com a numeração real de linha que descartou só linhas em branco, `import` de uma linha, linhas só de fechamento (`}`, `});`), linhas iniciadas por `//`, `console.*`, parâmetros simples de construtor e o cabeçalho do `@Component`; ou seja, li a lógica toda, mas **não li o código comentado** desses arquivos (conferi à parte três trechos comentados: os `canActivate` das rotas filhas, `redirecionaNaoExisteDespacho` e os parâmetros de `getRequerimentoEmAnalise`). Dos `*.module.ts` de `paginas/` li só declarações, imports e `entryComponents` por grep. Li também `package.json`, `README.md` (é o padrão do Angular CLI, sem conteúdo de negócio), os dois `environment*.ts`, os blocos `styles`/`scripts` de `angular.json` e as tags `<link>` de `index.html`. **Não li**: os 86 `.scss`, os 2 `.spec.ts`, `styles.scss`, `paletes.scss`, `db.json`, `Dockerfile`, `Jenkinsfile`, `kubernetes/`, `e2e/` e o conteúdo de `projects/ucam-frame-model` (só listei os arquivos). `node_modules` não existe na pasta, então o conteúdo real de `default-style` (a moldura) e de `ucam-material` é **não confirmado**; só sei o que os templates passam para eles. As contagens da seção 3 são de grep.

Da referência do UCAMDS li o projeto `protocolo` de `spec/templates.json` por um extrato (descrição, `usa`, `regras_negocio`, `fluxos` e o texto visível do `preview` das dez telas, cortado em cerca de 2.600 caracteres por tela, mais a `shell`). Não abri as páginas vivas em `site/src/app/pages/vivo/protocolo/`.

---

## 1. Rotas e telas

Há um módulo raiz e seis módulos lazy. O único guard é `AuthGuard` (`core/service/auth/auth-guard.service.ts:19-34`), que só olha `state.authenticated`; **não há checagem de perfil, nível ou setor em rota nenhuma**. Os `canActivate` das rotas filhas de requerimentos estão comentados (`paginas/requerimentos/requerimentos-routing.module.ts:23-55`); a proteção vem só do `canActivate` do módulo pai em `app.routing.ts`.

### 1.1 Tabela de rotas

| URL | Componente | Template | Guard | Arquétipo |
|---|---|---|---|---|
| `login/:token/:user` | `LoginComponent` | `core/components/login/login.component.html` | nenhum (`app.routing.ts:8-11`) | entrada por token (tela de espera) |
| `login` | `LoginComponent` | idem | `AuthGuard` (`app.routing.ts:12-16`) | idem |
| `''` | redireciona para `requerimentos` | — | `AuthGuard` (`app.routing.ts:47-52`) | — |
| `requerimentos` | `RequerimentoComponent` (casca: lateral de filtros + abas) | `REQ/requerimento.component.html` | `AuthGuard` (`app.routing.ts:27-31`) | casca de listagem |
| `requerimentos/` | redireciona para `caixa-de-entrada` | — | herdado | — |
| `requerimentos/caixa-de-entrada` | `CaixaDeEntradaComponent` | `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.html` + `caixa-de-entrada-table/…html` | herdado | listagem (fila) |
| `requerimentos/minha-pauta` | `MinhaPautaComponent` | `REQ/navegacao/minha-pauta/minha-pauta.component.html` | herdado | listagem (fila) |
| `requerimentos/encaminhados` | `EncaminhadosComponent` | `REQ/navegacao/encaminhados/encaminhados.component.html` | herdado | listagem (fila) |
| `requerimentos/concluidos` | `RequerimentoConcluidoComponent` → `RequerimentoConcluidoTableComponent` | `REQ/navegacao/requerimento-concluidos/requerimento-concluido-table/…html` | herdado | listagem (arquivo) |
| `requerimentos/info` | `RequerimentoInfoComponent` | `SH/components/requerimento-info/requerimento-info.component.html` | herdado | resultado / confirmação |
| `requerimentos/requerimento-em-analise` | `TratarRequerimentoComponent` (fora da casca de filtros) | `REQ/navegacao/tratar-requerimento/tratar-requerimento.component.html` | herdado | detalhe / tratamento |
| `setor` | `SetorComponent` | `paginas/setor/setor/setor.component.html` | `AuthGuard` (`app.routing.ts:17-21`) | lista + detalhe (split) |
| `setor/` | redireciona para `aviso` (`paginas/setor/setor.routing.ts:13`) | — | herdado | — |
| `setor/aviso` | `SetorAvisoComponent` | `paginas/setor/setor/setor-aviso/setor-aviso.component.html` | herdado | estado vazio |
| `setor/:id` | `SetorPessoaComponent` | `paginas/setor/setor/setor-pessoa/setor-pessoa.component.html` | herdado | detalhe (integrantes) |
| `natureza` | `NaturezaRequerimentoComponent` | `NAT/natureza-requerimento.component.html` + `natureza-tabela/…html` | `AuthGuard` (`app.routing.ts:22-26`) | cadastro em linha + listagem |
| `gerencial` | `GerencialComponent` + `PageComponent` (`gerencial-page`) | `paginas/gerencial/gerencial/gerencial.component.html` + `page/page.component.html` | `AuthGuard` (`app.routing.ts:32-36`) | painel / lista mestre-detalhe |
| `analytics` | `AnalyticsComponent` | `paginas/analytics/analytics/analytics.component.html` | `AuthGuard` (`app.routing.ts:37-41`) | painel de indicadores |
| `pesquisar` | `BuscaComponent` | `paginas/busca/busca/busca.component.html` | `AuthGuard` (`app.routing.ts:42-46`) | consulta (busca + resultado) |
| `**` | carrega `RequerimentosModule` | — | `AuthGuard` (`app.routing.ts:53-57`) | — |

Observações sobre as rotas:

- `requerimento-em-analise` **não tem identificador na URL**. O requerimento aberto viaja em memória por `TratarRequerimentoService.setDadosDoRequerimento` (`SH/services/tratar-requerimento.service.ts:23-37`), com apoio de `sessionStorage` (`oidRequerimento`, `oidUnidadePessoa`, `foto`, `requerimentoModoVisualização`) e `localStorage` (`requerimento`). O redirecionamento que protegeria o acesso direto está comentado (`REQ/navegacao/tratar-requerimento/tratar-requerimento.component.ts:205-209`).
- `requerimentos/info` existe como rota, mas não achei navegação para ela; o componente é usado de fato embutido na tela de tratamento depois de concluir (`REQ/navegacao/tratar-requerimento/tratar-requerimento.component.html:112-116`). Como rota, não recebe o `@Input` de que depende.
- O menu lateral não está no código: vem do serviço de menu (ver seção 2). Por isso a ordem e os rótulos reais dos itens (caixa de entrada, setor, natureza, gerencial, analytics, pesquisar) são **não confirmados** pelo front.

### 1.2 Casca de requerimentos (`requerimentos`)

- Propósito: emoldurar as quatro filas com uma lateral de filtros e uma fileira de abas com contagem.
- Arquétipo: listagem com filtros laterais.
- Lateral (`REQ/sidebar/sidebar-filtros.component.html`): marca `MarcaProtocolo.svg`; botão "Novo Requerimento" (abre diálogo); botão "Pesquisar" (vai para `/pesquisar`); bloco "Filtros / Gerenciando o status do protocolo" com, nesta ordem:
  1. "Nível abaixo do meu" — select Sim/Não (`REQ/sidebar/filtro-nivel/filtro-nivel.component.html:2-11`);
  2. "Setores que estou envolvido" — um botão alternável por setor do funcionário (`sidebar-filtros.component.html:30-38`);
  3. "Unidades" — interruptor "Todas as unidades" + select de unidade (`REQ/sidebar/filtro-unidades/filtro-unidades.component.html:3-23`);
  4. "Data" — datepicker com máscara `00/00/0000` (`REQ/sidebar/filtro-data/filtro-data.component.html:3-9`);
  5. "Natureza do requerimento" — dois selects encadeados, natureza e tipo (`REQ/sidebar/filtro-natureza-tipo/filtro-natureza-tipo.component.html:3-28`);
  6. "Filtro por Estado" — três botões unidos: "Livre", "Em Análise", "Todos" (`REQ/sidebar/filtro-estado/filtro-estado.component.html:3-10`).
- Abas (`REQ/requerimento.component.html:12-51`): "Caixa de Entrada (n)", "Minha Pauta (n)", "Encaminhados (n)", "Concluídos (n)", com ícones `inbox`, `markunread`, `redo`, `timeline`. Zero aparece como "(0)" com o título "Clique no link para carregar a quantidade de requerimentos" (`SH/components/quantidade-requerimentos/quantidade-requerimentos.component.ts:5-12`).
- À direita das abas: selo "N" ou "0 Novos" (`requerimento.component.html:57-59`) e um link de ajuda para `https://services.ucam-campos.br/arquivos/manuais/manual-protocolo.pdf` (`:64`).
- Área de impressão embutida (`requerimento-impressao`, `:85-86`).
- **Classificação: coberta** — `protocolo/analise-requerimento` (padrão triagem-lista-detalhe). Divergências em 1.3.

### 1.3 Filas

As quatro filas compartilham a célula "aluno" (foto `ucam-material-profile-photo` 45px com ponto de atividade, nome em `titlecase` com tooltip, e abaixo `#numero - tipo de natureza`), o selo de estado `app-badge-estado`, a coluna "modalidade" (modalidade + nome da unidade) e a "Data" (`requerimento.dataAbertura`). Clicar em qualquer célula, menos a bandeira, abre o diálogo de prévia (75% de largura). Carregando: `app-skeleton-requerimento` (7 linhas-esqueleto). Vazio: imagem de pasta + "Nenhum protocolo encontrado". A busca do cabeçalho da moldura filtra **só as linhas já carregadas** (`SH/models/search-header.model.ts:8-13`).

**Caixa de entrada** (`requerimentos/caixa-de-entrada`)
- Propósito: mostrar os requerimentos que aguardam análise nos setores e unidades do funcionário.
- Colunas reais (`REQ/navegacao/caixa-de-entrada/caixa-de-entrada-table/caixa-de-entrada-table.component.ts:41`): `icon` (bandeira de urgência), `aluno`, `estado`, `setor` (destino + "Nível N"), `modalidade`, `data`, `prazo` ("Referência: N" + barra `ucam-material-period-bar` com `total=prazo`, `atual=tempoDecorrido`).
- Paginação no servidor, `mat-paginator` com opções 5, 10, 25, 50 (`caixa-de-entrada.component.html:5-7`); tamanho padrão 10 (`SH/services/requerimento.service.ts:29`).
- Peças: `mat-table`, `matSort`, `mat-paginator`, `app-button-urgencia`, `app-badge-estado`, `ucam-material-profile-photo`, `ucam-material-period-bar`, tooltip, esqueleto.
- **Classificação: coberta** — `protocolo/analise-requerimento`.
- Onde diverge da referência:
  - A referência é lista + detalhe lado a lado; o real é tabela de largura inteira e o detalhe abre em **diálogo modal** de três abas.
  - A referência ordena por "Mais recentes / Mais urgentes"; o real ordena por número decrescente (`caixa-de-entrada.component.ts:147`) e por cabeçalho de coluna; "urgente" é bandeira manual por requerimento, não ordenação.
  - A referência filtra por chips (Setor, Modalidade); o real filtra pela lateral (nível abaixo do meu, setores, unidades, data inicial, natureza/tipo, estado).
  - O real tem a coluna "setor" com **"Nível N"** e a coluna de prazo com barra; a referência mostra o prazo em texto ("vence em 1 dia", "venceu há 18 dias") e não mostra nível.
  - A referência tem "não lido", "Aguardando aluno" e "Encaminhado ao CENPRE"; o real não tem leitura nem "aguardando aluno": tem "Novo" (estado `SOLICITADO`) e os selos da regra 12.
  - A referência tem Exportar CSV, Imprimir a fila, Preferências e atalhos de teclado; o real não tem nenhum dos quatro.

**Minha pauta** (`requerimentos/minha-pauta`)
- Propósito: mostrar o que o funcionário já assumiu (está tratando).
- Colunas (`REQ/navegacao/minha-pauta/minha-pauta.component.ts:53`): `icon`, `aluno`, `estado`, `setor` (só o destino, sem nível), `modalidade`, `data`, `prazo`.
- Sem paginador no template; a fila vem inteira de `analise-requerimento/search/analisando`.
- O filtro "Filtro por Estado" fica desabilitado nesta fila (`REQ/sidebar/filtro-estado/filtro-estado.component.ts:113-115`).
- **Classificação: parcial** — a referência tem "Minha pauta" como aba de `analise-requerimento`, mas só desenhou o estado vazio ("Nada na sua pauta"). Falta a fila preenchida e a ação "Continuar".

**Encaminhados** (`requerimentos/encaminhados`)
- Propósito: acompanhar o que o funcionário mandou a outro setor.
- Colunas (`REQ/navegacao/encaminhados/encaminhados.component.ts:54`): `icon`, `aluno`, `estado`, `modalidade`, `data`, `prazo` (sem coluna setor).
- Paginação no servidor, 10 por página (`:67-68`), opções 5, 10, 25, 50.
- Abrir uma linha marca `saiuDoMeuSetor = true` (`:271-273`): a prévia oferece "Visualizar" e, no encaminhar, o botão vira "Reencaminhar".
- **Classificação: parcial** — aba de `analise-requerimento` só com estado vazio ("Nenhum encaminhamento em aberto"). Falta a fila e o reencaminhamento.

**Concluídos** (`requerimentos/concluidos`)
- Propósito: consultar o que foi deferido ou indeferido e reabrir.
- Colunas (`REQ/navegacao/requerimento-concluidos/requerimento-concluido-table/requerimento-concluido-table.component.ts:46`): `aluno`, `estado`, `modalidade`, `data`, `action` (botão "Reabrir"). Sem bandeira e sem prazo.
- Paginação no servidor, 10 por página (`:68-69`).
- **Classificação: parcial** — aba "Concluídos" de `analise-requerimento`. Falta a ação "Reabrir" (com `confirmacao-destrutiva`/dialog) e a distinção Deferido/Indeferido na fila. A regra proposta da referência ("concluir não se desfaz pela caixa") é o **contrário** do real.

### 1.4 Diálogos do requerimento

**Prévia do requerimento** — `PreviewRequerimentoDialogComponent` (`REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.html`), largura 75%
- Propósito: ver o pedido, o aluno e o histórico antes de decidir tratar, continuar, visualizar ou encaminhar.
- Arquétipo: detalhe em diálogo com abas.
- Aba "Prévia do Protocolo": à esquerda `app-preview-academico` (foto 40px, nome, curso, botão imprimir, natureza + ponto de status, tipo de natureza, número, descrição em HTML, "Criado em …", "Referência: N" + barra de prazo; se o aluno não existe no Acadêmico: "Aluno não encontrado / Verifique se o mesmo está cadastrado no SIGU"). À direita: "Histórico / Visualize o Histórico", etiqueta "Novo" se `SOLICITADO`, botão "Todos os anexos" com contador e lista suspensa de download, linha do tempo (`app-requerimento-timeline`) e o rodapé de ações: bandeira "Urgente", "Visualizar", "Continuar", "Tratar" e o botão-ícone de encaminhar (`redo`).
- Aba "Informações do Aluno": foto 55px, nome, CPF; "Cursos" (Matrícula, Curso); "Dados" (CPF, E-mail, Telefones, Polo, Naturalidade, Turno); coluna "Lista de CRs / CRA do Aluno" (data do período + CR com duas casas).
- Aba "Histórico de Protocolos": contagem "N protocolos" e lista com `#numero`, "Criado em …", estado em texto (Novo, Analisando, Deferido, Indeferido) e botão "Visualizar".
- O rodapé de ações some quando o diálogo é aberto pelo Gerencial ou pela Pesquisa (`…html:91`).
- **Classificação: parcial** — base: painel de detalhe de `protocolo/analise-requerimento` (drawer, description-list, timeline, anexo, avatar). Faltam no desenho: a aba de dados acadêmicos (CR/CRA, turno, e-mail, telefones, naturalidade), a aba de histórico de protocolos do requerente dentro do detalhe (a referência a tem só em `requerimento-detalhe`) e o trio "Tratar / Continuar / Visualizar".

**Novo requerimento** — `NovoRequerimentoDialogComponent` (`REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.html`), largura 75%
- Propósito: o funcionário abre um requerimento em nome de alguém ("Criar Novo Requerimento / Requerimento Interno").
- Arquétipo: formulário em diálogo, etapa única.
- Campos (nomes reais do `FormGroup`, `…component.ts:88-96`): `unidade` (select de todas as unidades), `cpf` (texto, 11 dígitos), `nome` (texto), `sexo` (select Homem/Mulher), `natureza` (select), `tipoRequerimento` (select "Tipo de Natureza", carrega pela natureza), um `input file` por tipo de anexo exigido pelo tipo (com o aviso "Anexo obrigatório *"), `descricao` (editor rico Quill: negrito, itálico, sublinhado, alinhamento, lista ordenada e com marcadores). Botões "Cancelar" e "Enviar".
- **Classificação: coberta** — `protocolo/novo-requerimento` (formulario-entidade).
- Onde diverge: a referência tem 3 etapas (Requerente, Solicitação, Revisão), busca o aluno no cadastro e mostra prévia com setor responsável e prazo previsto; o real é um diálogo de uma etapa em que **CPF e nome são digitados à mão**, a unidade é escolhida num select, não há revisão nem prévia, e a descrição é texto rico. O real tem o campo `sexo`, que a referência não tem (e que nem é enviado — regra 23). A referência escolhe a natureza em cartões com explicação; o real usa dois selects. A referência limita anexo a "PDF, JPG ou PNG de até 10 MB"; o real não limita tipo nem tamanho no front.

**Encaminhar requerimento** — `EncaminharRequerimentoDialogComponent` (`REQ/dialog/encaminhar-requerimento-dialog/…html`), largura 75%
- Propósito: mandar o requerimento a outro setor com um despacho.
- Título "Encaminhar Requerimento Nº - #numero" e, abaixo, o `caminho` (trilha de setores já percorridos, texto vindo do backend).
- Campos (`…component.ts:303-308`): `setor` (autocomplete "Escolha um Setor"), `nivel` (select 1, 2, 3), arquivo opcional ("Escolher arquivo", com "Carregando anexo. Aguarde..." e "Anexo inserido com sucesso"), `descricao` (Quill). Bloco "Meus favoritos" (respostas salvas por pessoa e setor, clicáveis, com X para apagar). Botões "Cancelar", "Salvar Resposta" (estrela; salva o texto como favorito) e "Encaminhar" ou "Reencaminhar".
- **Classificação: parcial** — base: `ucam-dialog` + `ucam-compositor` + `ucam-combobox`. Na referência "Encaminhar" só troca o selo; **falta o formulário de encaminhamento** (setor destino, nível destino, anexo, texto) e o conceito de **resposta favorita**.

**Concluir requerimento** — `ConcluirRequerimentoDialogComponent` (`REQ/dialog/concluir-requerimento-dialog/…html`), largura 75%
- Propósito: fechar o requerimento com um parecer.
- Campos (`…component.ts:76-80`): `parecer` (select "Escolha o status": deferido / indeferido), `descricao` (Quill). "Meus favoritos", "Cancelar", "Salvar Resposta", "Concluir" (vira "Salvando...").
- **Classificação: parcial** — base: `ucam-dialog` + `ucam-radio-group` + `ucam-compositor`. Na referência "Concluir" é um clique que leva a "Concluído"; **falta a escolha obrigatória Deferido × Indeferido e o texto de conclusão**.

**Responder** — `ResponderComponent` (`REQ/navegacao/tratar-requerimento/tratar-requerimento-header/dialog/responder/responder.component.html`), mínimo 450×300px
- Propósito: registrar uma resposta ao aluno sem encerrar. Título "Resposta", rótulo "Responder para o aluno", `textarea` de 7 linhas (`descricao`), botão "Responder".
- **Classificação: coberta** — é o compositor "Resposta ao requerente" de `analise-requerimento` e `requerimento-detalhe`. Diverge por ser diálogo, sem anexo.

**Informações do Aluno** — `InformacaoAlunoComponent` (`…/dialog/informacao-aluno/informacao-aluno.component.html`), 500–600px
- Foto, nome, CPF; "Saiba Mais" em duas colunas: Matrícula, Curso, Período letivo, Turno / CPF, E-mail, Unidade, Modalidade.
- **Classificação: parcial** — `ucam-dialog` + `ucam-description-list`; a referência mostra só curso e matrícula no cabeçalho.

**Todos os Anexos** — `AnexoDialogComponent` (`…/dialog/anexo-dialog/anexo-dialog.component.html`), 500–600px
- Lista "Anexos" com a descrição do tipo de anexo e um link de download por item.
- **Classificação: coberta** — `ucam-anexo` na referência (lá os anexos ficam em linha, sem diálogo).

**Confirmação e aviso genéricos** — `ModalConfirmComponent` e `ModalAlertComponent` (`shared/components/modal/…`), feitos com `ngx-bootstrap`
- Título padrão "Sistema Protocolo", texto, botões "Fechar" e "Confirmar" (`shared/components/modal/modal-confirm/modal-confirm.component.ts:13-17`). O aviso se fecha sozinho em 10 s (`shared/components/modal/modal-alert/modal-alert.component.ts:27-29`).
- **Classificação: coberta** — padrão `confirmacao-destrutiva` + `ucam-dialog`/`ucam-alert`. Diverge: o texto real nunca nomeia o que se perde ("Deseja deletar este setor?").

### 1.5 Tratamento do requerimento (`requerimentos/requerimento-em-analise`)

- Propósito: ler o pedido, anotar, responder, encaminhar ou concluir.
- Arquétipo: página de detalhe em duas colunas (conteúdo + atividade).
- Coluna de conteúdo:
  - Cabeçalho (`REQ/navegacao/tratar-requerimento/tratar-requerimento-header/tratar-requerimento-header.component.html`): trilha "Minha Pauta / #numero"; botão "Responder"; bandeira "Urgente"; três botões-ícone com tooltip — "Informações acadêmicas" (`school`), "Imprimir requerimento" (`print`), "Ver anexo do requerimento" (`attach_file`); botão "Voltar" (para Minha Pauta). Avisos: "Requerimento concluído com sucesso. …!", "Requerimento no modo de visualização!", "Requerimento encaminhado!".
  - Natureza + `#numero` + tipo de natureza; ao concluir, "Criado em: …" e "Fechado em: …".
  - Aluno (foto 40px, nome, curso, `#numeroRequerimento`).
  - Texto do pedido em HTML e, abaixo, a descrição do motivo.
  - Rodapé (`…/tratar-requerimento-footer/tratar-requerimento-footer.component.html`): "Referência: N dias" e "Faltam: N dias" (verde se dentro do prazo, vermelho se em atraso), barra de prazo, e os botões "Encaminhar", "Concluir Protocolo" e "Tratar" (este só aparece no modo de visualização).
- Coluna de atividade: título "Atividade do Protocolo", ponto de status (Livre, Análise, Deferido, Indeferido), linha do tempo e, no pé, um campo "Escrever para adicionar" com botão enviar (grava uma **nota de despacho**, interna).
- Depois de concluir, a tela inteira é trocada pelo quadro de resultado (1.6).
- **Classificação: coberta** — `protocolo/requerimento-detalhe`.
- Onde diverge:
  - A referência afirma "todo requerimento tem endereço próprio"; o real **não tem URL por requerimento** (ver 1.1) e recarregar a página perde o contexto.
  - A referência tem andamento em etapas ("Etapa 2 de 4") com `ucam-stepper`; o real não tem etapa nenhuma, só estado e tipo do último despacho.
  - A referência tem "Prazo restante" e "Prazo consumido: 2 de 3 dias úteis · SLA da natureza"; o real mostra "Referência: N dias" e "Faltam: N dias", sendo que o segundo número é o **tempo decorrido** (`SH/components/requerimento-prazo/requerimento-prazo.component.html:2-4`). Se o prazo é em dias úteis: não confirmado.
  - A referência tem o evento "Editou o requerimento" com DE → PARA de setor, prazo e prioridade; o real **não edita requerimento** — não há tela nem endpoint de edição.
  - A referência tem o filtro de atividade "Todos / Mensagens / Tramitação"; o real não filtra a linha do tempo.
  - A referência tem a tabela "Protocolos anteriores deste requerente" na página; o real tem a lista equivalente só na aba do diálogo de prévia.
  - O real tem **dois modos** (visualização × tratamento) e o botão "Tratar" que assume o requerimento; a referência não tem a noção de assumir.
  - O real tem **nota de despacho** (anotação interna na linha do tempo, com rótulo "Nota") separada de **resposta ao aluno**; a referência tem só o compositor de resposta.
  - O real tem a folha de impressão própria "CONSULTA DE REQUERIMENTO" (1.7).

### 1.6 Resultado da conclusão (`requerimentos/info` e embutido no tratamento)

- Propósito: confirmar a conclusão e resumir o que foi fechado.
- Peças (`SH/components/requerimento-info/requerimento-info.component.html:15-64`): título "Requerimento concluído com sucesso.", botão "Voltar", tabela de duas colunas "Campo / Informação" com: Número do Requerimento, Solicitante do Requerimento, Data de Abertura, Data de Fechamento, Modalidade, Descrição da Solicitação, Descrição da Conclusão.
- **Classificação: parcial** — não há tela de referência de confirmação no projeto `protocolo`; base: `requerimento-detalhe` com `ucam-alert` + `ucam-description-list`. Falta o estado "concluído" do detalhe com data de fechamento e texto da conclusão.

### 1.7 Folha de impressão

- `ImpressaoComponent` + `PaginaComponent` (`REQ/impressao/impressao.component.html`, `REQ/impressao/pagina/pagina.component.html`), embutidos na casca, no tratamento e na pesquisa; a impressão é `window.print()`.
- Conteúdo: logo, "UNIVERSIDADE CANDIDO MENDES - {nomeUnidade}", "CONSULTA DE REQUERIMENTO"; Código, CPF, Curso / Requerente, Telefone, Turno / Situação; depois um bloco por evento do histórico: "De: … Para: …", o texto em HTML, "Responsável: …" e "Enviado em …".
- **Classificação: parcial** — a referência cita "a folha de impressão tira moldura e ações", mas não há tela de referência de impresso. Falta o layout do impresso do requerimento.

### 1.8 Setores (`setor`, `setor/aviso`, `setor/:id`)

- Propósito: cadastrar setores e dizer quem trabalha em cada um, em que unidades e com que nível.
- Arquétipo: lista à esquerda (7/12) + detalhe à direita (5/12) por rota filha.
- Esquerda (`paginas/setor/setor/setor.component.html`): título "Setor / Clique nos setores e veja os integrantes"; busca "Busque o seu setor"; botão "Novo Setor"; lista com rolagem virtual (`cdk-virtual-scroll-viewport`, item de 60px, 60vh) — ícone, nome, lápis, lixeira e seta (`paginas/setor/setor/setor-item/setor-item.component.html`).
- Direita sem seleção: ícone + "Nenhum setor selecionado" (`paginas/setor/setor/setor-aviso/setor-aviso.component.ts:10-11`).
- Direita com setor (`paginas/setor/setor/setor-pessoa/setor-pessoa.component.html`): nome do setor em maiúsculas; botão "Novo Funcionário"; para cada **unidade** (ordenadas por nome) uma seção com o nome da unidade e, por funcionário, inicial do nome, nome, estrelas de nível (`app-rating`), lápis e lixeira; ao pé da seção "N participantes". Vazio: "Não existe funcionários cadastrados neste setor" + "Cadastrar Funcionário".
- **Classificação: coberta** — `protocolo/listagem-setores`.
- Onde diverge:
  - A referência mostra "cada pessoa uma vez, com as unidades como marcadores" (regra proposta); o real **agrupa por unidade**, então a mesma pessoa aparece uma vez por unidade, e o **nível é por unidade**, não por pessoa.
  - A referência mostra nível em texto ("Nível 2") e o selo "Coordenação"; o real mostra **estrelas (1 a 3)** e não tem coordenação.
  - A referência mostra por setor a fila ("18 na fila"), nº de integrantes, descrição curta, "Naturezas atendidas 7 de 12", capacidade e SLA médio; o real tem só o **nome** do setor (a contagem de participantes por setor está comentada no template).
  - O real **cria, renomeia e exclui** setor nesta tela; a referência manda "Novo setor" e "Editar setor" para `parametros-setores`, onde a regra proposta é "setor não se cria nem se apaga".
  - A referência tem "Exportar"; o real não.

**Diálogo "Novo Setor"** — `SetorFormDialogComponent` (`paginas/setor/setor/setor-form-dialog/setor-form-dialog.component.html`), 500px
- Um campo: `descricao` ("Nome do Setor", placeholder "Ex.: CPD"), com retorno "OK" ou "O campo não pode ser vazio"; botão "Salvar" / "Salvando...". O mesmo diálogo edita (o título continua "Novo Setor").
- **Classificação: parcial** — base: `ucam-dialog` + `ucam-text-field` (padrão formulario-entidade). A referência não tem o formulário simples de criar setor.

**Diálogo "Adicionar/Editar Funcionário no Setor"** — `SetorPessoaFormDialogComponent` (`paginas/setor/setor/setor-pessoa/setor-pessoa-form-dialog/…html`), 800px
- Aba "Funcionários": inicial do nome num círculo, `nomePessoa` com autocomplete ("Ex.: João da Silva") e botão "Próximo".
- Aba "Unidades": `unidadePessoa` (`ng-select` múltiplo, "Selecione as unidades") + "Adicionar"; tabela Unidade / Nível / Ação (estrelas editáveis por unidade, X para remover); "Nenhuma unidade cadastrada"; botão "Salvar".
- **Classificação: coberta** — `protocolo/integrante-form`.
- Onde diverge: a referência tem um nível único em cartões de escolha com significado (triagem, análise, decisão), "É a coordenação do setor", "Entra na distribuição automática" e o e-mail institucional; o real tem **nível por unidade em estrelas, sem significado escrito**, e nenhum dos três outros campos. A referência busca por "Nome ou CPF"; o real só por nome, e só entre quem ainda não está no setor.

### 1.9 Naturezas (`natureza`)

- Propósito: cadastrar as naturezas e, dentro de cada uma, os tipos de requerimento, os setores/unidades que atendem e quem responde por cada tipo.
- Arquétipo: formulário de cadastro fixo no topo + tabela.
- Topo (`NAT/natureza-requerimento.component.html`): "Natureza do Requerimento / Cadastro"; `descricao` (`ucam-material-input`, obrigatório, mínimo 3); `tipo` (`ucam-material-select`: interno / externo, com a nota "Campo não obrigatório"); botões "Nova Natureza" e "Limpar", ou "Atualizar Natureza" e "Cancelar" em edição. Barra de progresso indeterminada ao salvar.
- Tabela (`NAT/natureza-tabela/natureza-tabela.component.ts:30`): colunas `nome` (descrição + "N Quantidade de requerimentos", valor de `quantidadeTipoRequerimento`), `unidadesEnvolvidas`, `tiposDeNatureza`, `action`. O cabeçalho da coluna de ação é o campo de busca "Pesquise pela natureza aqui!". Ações por linha: "Visualizar" (abre o diálogo), "Editar" (leva os dados ao formulário do topo), "Deletar" (vermelho). Paginador 5, 10, 25, 50; página inicial de 5.
- **Classificação: coberta** — `protocolo/naturezas` (listagem-crud) + `protocolo/natureza-form`.
- Onde diverge:
  - A referência tirou o formulário do topo (gaveta/página); o real ainda o tem no topo.
  - Colunas: a referência tem Natureza (+ descrição curta), **Setor responsável**, Unidades atendidas, Requerimentos, Ações; o real tem Nome, Unidades Envolvidas, Tipos de Natureza, Ação. O real **não tem um setor responsável por natureza**: tem N pares setor × unidade.
  - A referência **arquiva** (reversível) e proíbe excluir; o real **exclui** ("Deseja deletar esta natureza?") e não tem arquivar.
  - A referência tem seleção em lote, recorte por modalidade (Todas/EAD/Presencial) e Exportar; o real não tem nenhum.
  - O real tem o campo `tipo` (interno/externo) na natureza; a referência não. Se "externo" equivale a "o aluno pode abrir pelo portal": não confirmado.

**Diálogo da natureza** — `NaturezaDialogComponent` (`NAT/natureza-dialog/natureza-dialog.component.html`), 80% × 95%, duas abas

- Aba "Tipo Natureza" (`NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.html`): formulário `descricao`, `observacao` (textarea), Nível (estrelas 1–3), `anexo` ("Tipo de Anexo", select + "Adicionar", com a lista dos anexos exigidos e X), `maxSolicitacoes` ("Máximo de Solicitações", número, mínimo 0); botões "Salvar" / "Atualizar" e "Limpar". Abaixo, tabela (`…/tipo-natureza-table-dialog/tipo-natureza-table-dialog.component.ts:29`): `tipoNatureza`, `observacao` (ou "Não tem observação cadastrada"), `nivel` (estrelas), `action` (Editar, Excluir, "Adicionar pessoa"); paginador 5, 10, 25, 50.
- Sub-tela "Cadastro Pessoa - Tipo Natureza" (`…/tipo-natureza-cadastro-pessoa/tipo-natureza-cadastro-pessoa.html`), dentro da mesma aba: botão "Voltar"; `unidade` (autocomplete entre as unidades do funcionário logado), `pessoa` (autocomplete "Nome do Funcionário"), "Cadastrar"; lista Nome / Unidade / Ação (lixeira); "Nenhum funcionário cadastrado".
- Aba "Setor / Unidade" (`NAT/natureza-dialog/tipo-natureza-mattab-setor/tipo-natureza-mattab-setor.component.html`): `setor` e `unidade` (dois `ucam-material-select` múltiplos) + "Adicionar"; à esquerda tabela Setor / Ação (lixeira, seta); à direita tabela Unidade / Ação (lixeira) do setor clicado.
- **Classificação: parcial** — base: `protocolo/natureza-form` e o padrão `listagem-inspetor` (como `gerencial/grupo-menu`). **Falta desenhar a entidade "tipo de natureza"** (a referência trata "Tipo" como um select do novo requerimento, sem cadastro), a relação natureza × setor × unidade e o vínculo de funcionário por tipo.
- Onde `natureza-form` diverge do real: a referência tem Nome, **Código**, Descrição curta, **Setor responsável (um)**, **Prazo de resposta** (2, 3, 5, 10 dias úteis), Unidades atendidas e três chaves (exigir anexo, exigir justificativa, aluno pode abrir pelo portal). O real tem, na natureza, só descrição e tipo; e no tipo de natureza: descrição, observação, **nível**, **lista de tipos de anexo exigidos** (não uma chave sim/não) e **máximo de solicitações**. Não há código nem campo de prazo em formulário algum, embora o modelo `ITipoNatureza` tenha `prazo` e `explicacao` (`core/model/protocolo.model.ts:104-114`). Não há "exigir justificativa".

### 1.10 Gerencial (`gerencial`)

- Propósito: ver, por setor, os requerimentos em aberto e quanto cada um já consumiu do prazo.
- Arquétipo: lateral de filtros + abas + mestre-detalhe.
- Lateral (`paginas/gerencial/gerencial/gerencial.component.html`): marca; título "Gerencial dos requerimentos"; botão "Pesquisar"; filtros `unidades` (Unidade), `natureza` e `tipo` (Natureza do requerimento), `funcionarios` (Funcionário), `estado` (três rádios unidos: Livre, Análise, Todos).
- Conteúdo: abas "EAD" e "Presencial", cada uma com `gerencial-page` (`paginas/gerencial/gerencial/page/page.component.html`):
  - à esquerda "Setores / Gerenciando os status do protocolo": tabela `nome`, `requerimentos` ("Nº DE REQUERIMENTOS" + seta);
  - à direita: nome do setor, selo "N fora do prazo", botão "Mostrar Todos" e a tabelinha Ano / Quantidade / Ação, e a tabela de requerimentos com `nome` ("NOME/NATUREZA": foto, nome, número e selo de estado) e `vencimento` (barra `total=prazo`, `atual=vencimento`). Clicar numa linha abre a prévia sem ações.
  - Mensagens: "Carregando os setores", "Carregando os requerimentos", "Nenhum requerimento encontrado".
- **Classificação: coberta** — `protocolo/gerencial` (painel-indicadores).
- Onde diverge:
  - A referência abre com quatro KPIs (Requerimentos abertos, Atrasados, Urgentes sem resposta, Concluídos no mês); o real **não tem KPI**, só o selo "N fora do prazo" do setor aberto.
  - A referência mede "carga contra a capacidade declarada" e "SLA médio" por setor; o real não tem capacidade nem SLA: lista o setor e, à direita, a fila dele ordenada pelo mais vencido.
  - A referência recorta por "Todas / EAD / Presencial"; o real tem só duas abas, **EAD e Presencial**, sem "Todas".
  - O real filtra por unidade, natureza, tipo, **funcionário** e estado (Livre/Análise/Todos) e tem a **contagem por ano** com detalhamento; a referência não tem nenhum desses.
  - A referência mostra só "a fila do setor mais pressionado"; o real mostra a fila de **qualquer** setor clicado.

### 1.11 Analytics (`analytics`)

- Propósito: ver quantos requerimentos cada natureza e tipo tem por estado e por mês.
- Arquétipo: painel de indicadores.
- Lateral (`paginas/analytics/analytics/analytics.component.html:5-35`): "FILTROS", "Data Inicial" e "Data Final" (datepicker, máscara `00/00/0000`).
- Conteúdo: título "Naturezas"; **uma aba por natureza**, a primeira "TODOS"; carrossel de seis cartões (`analytics-card`): REQUERIMENTOS LIVRES (`folder`), ANALISANDO (`lock`), EM ESPERA (`visibility`), DEFERIDOS (`thumb_up`), INDEFERIDOS (`thumb_down`), CONCLUÍDOS (`done_all`); à esquerda a tabela "TIPO" (um tipo por linha, clicável); à direita dois gráficos de colunas Highcharts, "PENDENTES E REALIZADOS" e "VOLUME REQUERIMENTOS", por mês; "Dados não encontrado".
- **Classificação: coberta** — `protocolo/analytics` (painel-indicadores).
- Onde diverge:
  - KPIs: a referência tem Abertos no período, Concluídos, Prazo médio, Vencidos agora, todos com variação contra o período anterior; o real tem **seis contagens por estado**, sem variação, sem prazo médio e sem "vencidos".
  - O real tem o estado **"em espera"**, que não aparece em nenhuma tela de referência.
  - A referência recorta por natureza num segmented de 5 opções; o real usa **abas por natureza** (tantas quantas houver) e desce a **tipo de natureza**.
  - A referência tem a tabela mês a mês (Abertos, Concluídos, Taxa de conclusão), "Setores com requerimento vencido", "Naturezas mais abertas" e "Exportar período"; o real tem dois gráficos e nenhuma dessas quatro peças.

### 1.12 Pesquisar (`pesquisar`)

- Propósito: achar um requerimento de qualquer setor por nome, CPF ou número.
- Arquétipo: consulta (campo + resultado).
- Peças (`paginas/busca/busca/busca.component.html`): campo "Nome, CPF ou número do requerimento" (`formControlName="funcionarios"`), botão "Pesquisar", ajuda "Busque os requerimentos por nome do aluno, cpf ou número do requerimento"; "Total de requerimentos: N"; tabela (`paginas/busca/busca/busca.component.ts:29`): `aluno` (nome, `#numero - tipo de natureza`), `setor`, `modalidade` (+ unidade), `data` (o cabeçalho diz "AÇÂO" e a célula tem o botão "Visualizar"). "Nenhum requerimento encontrado."
- "Visualizar" abre a prévia sem ações (somente leitura).
- **Classificação: parcial** — não há tela de referência de pesquisa no projeto `protocolo`; base: padrão `consulta-relatorio` (`relatorios/filtros` + `relatorios/resultado`) ou `listagem-crud`, e a busca global da moldura ("Buscar requerimento, setor ou pessoa"). Falta a tela de resultado da busca de requerimentos.

### 1.13 Componentes declarados e sem uso — **nao-migrar**

| Componente | Evidência |
|---|---|
| `BuscaPorNaturezasComponent` (`REQ/navegacao/busca-por-naturezas/`) | sem rota; seletor não aparece em template; tem dados de exemplo fixos (`…component.ts:11-17`) e o texto "Requerimentos Naturezas" |
| `CaixaDeEntradaBlocoComponent` (visão em cartões) | uso comentado em `caixa-de-entrada.component.html:9-12`; os botões lista/bloco estão comentados em `requerimento.component.html:61-62` |
| `TableComponent` (`SH/components/table-component/`) | seletor `app-table` sem uso |
| `NotaDespachoComponent` ("Criar nova tarefa") | seletor sem uso; a nota é gravada pelo campo do pé da linha do tempo |
| `RequerimentoTimelineAnexoComponent`, `TimelineMessageComponent`, `TimelineTagComponent`, `RequerimentoTitleComponent`, `FotoAlunoComponent` | seletores sem uso; o primeiro tem itens fixos "Carteira AMS" e "Histórico Escolar" |
| `timeline-bk.html` | cópia antiga da linha do tempo, sem componente |
| `HeaderComponent`, `MenuComponent`, `SearchComponent` (`core/components/layout/`) | seletores `app-header` e `app-menu` sem uso; o cabeçalho tem nome e função fixos no HTML (`core/components/layout/header/header.component.html:23-24`) |
| `BannerAplicacaoComponent` | seletor sem uso |
| `PreviewRequerimentoGerencialDialogComponent` e filhos (`paginas/gerencial/gerencial/dialog/`) | só é aberto por `openDialogNovoRequerimento` (`paginas/gerencial/gerencial/page/page.component.ts:285-289`), que nenhum template chama; o Gerencial usa o diálogo de prévia de requerimentos |
| `PreviewRequerimentoTabCrComponent`, `PreviewTabRequerimentosComponent` | seletores sem uso |

### 1.14 Divergências contra as 10 telas de referência

| Tela de referência | Tela real | O que a referência tem e o real não | O que o real tem e a referência não |
|---|---|---|---|
| `analise-requerimento` | casca + 4 filas + prévia | lista e detalhe lado a lado; ordenação por urgência; chips de filtro; "não lido"; "Aguardando aluno"; exportar CSV; imprimir a fila; preferências; atalhos de teclado; "Excluir requerimento"; "Exportar em PDF"; concluir em um clique | detalhe em diálogo de 3 abas; coluna "Nível N"; barra de prazo; filtro "nível abaixo do meu", por setores do funcionário, por data inicial e por tipo; selo "N Novos"; bandeira de urgência por linha; "Tratar / Continuar / Visualizar"; **Reabrir** em Concluídos; **Reencaminhar**; CR/CRA e dados acadêmicos; link para o manual |
| `requerimento-detalhe` | `requerimento-em-analise` | URL própria por requerimento; etapas ("Etapa 2 de 4"); prazo consumido em dias úteis; evento de edição DE → PARA; filtro da atividade; tabela de protocolos anteriores na página | modo visualização × tratamento; nota de despacho interna; diálogos de encaminhar (setor, nível, anexo) e concluir (deferido/indeferido); respostas favoritas; quadro de resultado após concluir; impresso "CONSULTA DE REQUERIMENTO" |
| `gerencial` | `gerencial` | 4 KPIs; carga × capacidade; SLA médio; recorte "Todas" | filtros por unidade, natureza, tipo, funcionário e estado; contagem por ano; fila de qualquer setor; selo "fora do prazo" |
| `analytics` | `analytics` | variação contra período anterior; prazo médio; vencidos agora; tabela mês a mês; taxa de conclusão; setores com vencido; naturezas mais abertas; exportar | contagens por estado, inclusive "livres" e "em espera"; abas por natureza; detalhe por tipo de natureza; gráficos pendentes × realizados e volume |
| `listagem-setores` | `setor` + `setor/:id` | pessoa uma vez com unidades como marcadores; selo Coordenação; fila, integrantes, descrição, naturezas atendidas, capacidade e SLA por setor; exportar | agrupamento por unidade; nível por unidade em estrelas; criar, renomear e excluir setor |
| `naturezas` | `natureza` | setor responsável único; arquivar/reativar; lote; recorte por modalidade; exportar; contagem de requerimentos no período | excluir natureza; campo tipo interno/externo; formulário no topo; diálogo com tipos, setor × unidade e pessoas |
| `novo-requerimento` | diálogo "Criar Novo Requerimento" | 3 etapas; busca de aluno; cartões de natureza; revisão; prévia com setor e prazo; limite de anexo | unidade em select; CPF e nome digitados; sexo; anexos nomeados por tipo exigido; texto rico |
| `parametros-setores` | **não existe** | capacidade, SLA alvo, responsável, atende EAD, distribuição automática, aceita fila acima da capacidade, situação (No alvo / No limite / Acima do alvo) | — (o setor real tem só `descricao`) |
| `natureza-form` | formulário do topo + aba "Tipo Natureza" | código; descrição curta; setor responsável único; prazo de resposta; exigir justificativa; "aluno pode abrir pelo portal" | tipo interno/externo; nível do tipo; lista de tipos de anexo exigidos; máximo de solicitações; funcionários responsáveis por tipo e unidade |
| `integrante-form` | diálogo de funcionário do setor | busca por CPF; e-mail; nível com significado; coordenação; distribuição automática | nível por unidade; busca só entre quem não está no setor; até 5 unidades por seleção |

**Telas reais que o UCAMDS não tem como tela de referência:** minha pauta (fila preenchida), encaminhados (fila preenchida), concluídos com Reabrir, pesquisar, resultado da conclusão (`info`), aviso de setor não selecionado (é um estado vazio), impresso do requerimento, diálogo de encaminhar, diálogo de concluir com parecer, diálogo da natureza (tipos, setor × unidade, pessoas por tipo), informações acadêmicas do aluno com CR/CRA, e a entrada por token.

**Fluxo de situações — comparação direta.** A referência usa os rótulos "Aguardando análise", "Em análise", "Aguardando aluno", "Encaminhado", "Concluído", e "Deferido/Indeferido" só no histórico. O real tem **quatro estados** do requerimento (`SOLICITADO`, `ANALISANDO`, `DEFERIDO`, `INDEFERIDO`) combinados com **seis tipos de despacho** (`analise`, `LOCK`, `informacao`, `reencaminhar`, `resposta`, `parecer`), que juntos dão os selos Novo, Solicitado, Analisando, Encaminhado, Reencaminhado, Resposta, Reaberto, Deferido e Indeferido (regras 11 a 13). **Não existe "Concluído" como estado**: concluir é sempre deferir ou indeferir. **Não existe "Aguardando aluno"**. As transições exatas estão nas regras 14 a 22.

**Papéis e níveis — comparação direta.** A referência propõe (e declara inventado) Nível 1 = triagem, 2 = análise, 3 = decisão, e uma chave de coordenação. No real o nível é um número de **1 a 3 em estrelas**, existe em três lugares (no vínculo funcionário × setor × unidade, no tipo de natureza e no despacho de encaminhamento) e o front só o usa para: mostrar "Nível N" na fila, escolher o nível de destino ao encaminhar e ligar o filtro "Nível abaixo do meu". **Nenhuma ação é liberada ou bloqueada por nível no front** (regras 30 a 34). Não há papéis nomeados; a única menção a perfil é o parâmetro `perfil=funcionario`.

**Prazos — comparação direta.** A referência fala em dias úteis contados do envio, prazo por natureza e SLA alvo por setor. O real recebe do backend dois números prontos, `prazo` e `tempoDecorrido` (ou `vencimento` no Gerencial), mostra "Referência: N dias" e uma barra, e considera atraso quando o decorrido passa do prazo (regras 35 a 38). Onde o prazo é cadastrado, e se é em dias úteis: não confirmado no front.

---

## 2. Moldura e navegação

**Moldura.** A aplicação inteira fica dentro de `<default-style>` (`app.component.html:1-15`), componente do pacote `default-style` 0.0.37. O front só passa dados e ouve eventos:

| Entrada / evento | O que o front passa | Onde |
|---|---|---|
| `[hashMenu]` | lista de `{ nome, link, icone }` | `app.component.ts:168-175` |
| `[startOpen]` | `false` (menu começa fechado) | `app.component.html:1` |
| `[environment]` | o `environment` inteiro (logo, ícone e id da aplicação, URLs) | `app.component.ts:42` |
| `[unidade]` | objeto vazio `{}` | `app.component.ts:43-46` |
| `[usuario]` | `{ oid, nome }`, começando em "Carregando..." | `app.component.ts:50-53` |
| `[placeholder]` | texto do campo de busca, definido pela tela ("Pesquise") | `app.component.ts:188-198` |
| `(search)` | texto digitado, repassado a `SearchService` | `app.component.ts:184-186` |
| `(logout)` | dispara `Logout` | `app.component.ts:206-208` |
| `(changeUnidade)` | **função vazia** | `app.component.ts:210-211` |

O desenho real da moldura (faixa, lateral, conta) é não confirmado: está no pacote, que não está na pasta. O projeto local `projects/ucam-frame-model` tem `ucam-frame-menu`, `ucam-frame-profile-widget` e `ucam-frame-sidemenu`, mas não o li e o `AppModule` importa `DefaultStyleModule`, não ele.

**Cabeçalho e busca.** O campo de busca da moldura não consulta o servidor: emite o texto e cada fila aplica `dataSource.filter` nas linhas carregadas (`SH/models/search-header.model.ts:8-13`). A busca de verdade é a tela `pesquisar`.

**Menu.** Vem de `GET {API_RESOURCE_SERVICE}/menu/search/usuario?oidUsuario&oidAplicacao=aplicProtocoloNovo`, com o cabeçalho `Unidade-Ref: unid32` fixo (`app.component.ts:163-165`, `core/service/core.service.ts:37-51`). Item sem ícone recebe `description`. Em erro, o menu fica vazio sem aviso (`core.service.ts:47-49`). O menu local `MenuComponent` (Setor, Natureza, Análise Requerimento) existe mas não é usado.

**Conta.** O nome do usuário sai do `AuthState` em `sessionStorage`, lido 3 s depois da carga (`app.component.ts:98-108`). Sair leva a `LOGIN_URL` (`https://login.candidomendes.edu.br/login.jsf?client_id=aplicProtocoloNovo@ucam` em produção, `src/environments/environment.prod.ts:8`). Não há tela de perfil nem de preferências.

**Troca de unidade.** Não existe na prática: `[unidade]` é vazio e `changeUnidade` não faz nada. O recorte por unidade é feito pelos filtros de cada tela (lateral de requerimentos, lateral do Gerencial). A ação `CHANGE_UNIDADE` existe no reducer (`core/service/auth/store/auth.reducers.ts:70-78`), mas ninguém a dispara.

**Login.** Não há formulário. A rota `login/:token/:user` mostra só "Aguarde..." (`core/components/login/login.component.html:56`) enquanto troca o token por dados do usuário; autenticado, vai para `/requerimentos` (`core/components/login/login.component.ts:37-42`). O `FormGroup` login/senha criado no componente (`:45-48`) não aparece no template.

**Carga inicial.** Tudo que depende do usuário é disparado por temporizadores: 5 s para carregar nome, unidades/setores, busca e menu (`app.component.ts:87-95`), e de novo após mais 5 s se a pessoa ainda não estiver em sessão (`:76-80`); as filas esperam 2,5 s para ligar os filtros (`REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:101-108`). Versão escrita no código: `2.1.0` (`app.component.ts:29`).

**Navegação interna de requerimentos.** Casca → fila → prévia (diálogo) → `requerimento-em-analise` → diálogo de encaminhar (volta para `/requerimentos/encaminhados`) ou de concluir (quadro de resultado → "Voltar" para `/requerimentos`). O "Voltar" e a trilha do tratamento levam sempre a `/requerimentos/minha-pauta`, venha de onde vier.

---

## 3. Peças usadas, com contagem

Contagem por grep nos 90 `.html` (ocorrências, não arquivos). Inclui os componentes sem uso da seção 1.13.

**Angular Material / CDK**

| Peça | Ocorrências |
|---|---|
| `<table>` (todas) | 22 |
| `mat-table` | 19 |
| `matSort` / `mat-sort-header` | 9 / 38 |
| `<mat-paginator>` | 5 |
| `<mat-tab-group>` / `<mat-tab>` | 7 / 14 |
| `<mat-icon>` | 19 |
| `class="material-icons…"` (ícone por fonte) | 91 |
| `<mat-autocomplete>` / `<mat-option>` | 4 / 6 |
| `matTooltip` | 20 |
| `[matDatepicker]` / `<mat-datepicker>` | 4 / 4 |
| `<mat-progress-bar>` | 1 |
| `cdk-virtual-scroll-viewport` (abre e fecha) | 4 (2 listas) |
| `dialog.open(` nos `.ts` (`MatDialog`) | 20 |
| `openSnackBar(` nos `.ts` (`MatSnackBar`) | 98 |

**Biblioteca da casa `ucam-material` 0.0.6634 e `default-style` 0.0.37** (conteúdo não confirmado)

| Peça | Ocorrências |
|---|---|
| `button ucam-material` (atributos `rounded`, `small`, `outline`, `join`, `drop-shadow`, `color`, `[hover]`) | 34 |
| `input ucam-material` (um deles com `search`) | 4 |
| `<ucam-material-select>` (2 deles com `[multiple]=true`, na aba Setor / Unidade da natureza) | 12 |
| `<ucam-material-input>` | 1 |
| `<ucam-material-profile-photo>` (35, 40, 45 e 55px) | 12 |
| `<ucam-material-period-bar>` (barra de prazo) | 9 |
| `<ucam-material-badge>` | 4 |
| `<ucam-material-radiobutton>` | 3 |
| `<default-style>` | 1 |
| `<page>` + `<sidemenu-left>` (casca do Gerencial) | 1 + 1 |
| `mask="00/00/0000"` (diretiva de máscara; origem não confirmada — não há `ngx-mask` no `package.json`) | 4 |

**Componentes próprios**

| Componente | Ocorrências | O que é |
|---|---|---|
| `app-loading` | 16 | "Carregando…" + "Aguarde..." |
| `app-requerimento-timeline-icon` | 10 | ícone por tipo de evento |
| `app-badge-estado` | 9 | selo de situação (tipo × estado) |
| `app-button-urgencia` | 6 | bandeira de urgência |
| `app-rating` | 5 | estrelas de nível (1–3) |
| `app-requerimento-status` | 5 | ponto + Livre / Análise / Deferido / Indeferido |
| `app-requerimento-message` | 5 | estado vazio com imagem de pasta |
| `app-filtro-*` (nível, unidades, data, natureza-tipo, estado) | 5 | filtros da lateral |
| `app-skeleton-requerimento` | 4 | esqueleto de 7 linhas |
| `app-quantidade-requerimento` | 4 | "(n)" das abas |
| `analytics-card` | 6 | cartão de KPI |
| `app-requerimento-timeline` | 3 | linha do tempo |
| `requerimento-impressao` | 3 | folha de impressão |
| `app-requerimento-favoritos` | 2 | "Meus favoritos" |
| `app-requerimento-prazo` | 2 | "Referência / Faltam" |
| `app-range-prazo` | 2 | barra de prazo antiga (só no diálogo sem uso do Gerencial) |
| `gerencial-page` | 2 | página por modalidade |
| `app-preview-academico` / `app-preview-gerencial` | 1 / 1 | cartão do aluno na prévia |
| `carousel` + `carousel-item` | 1 | carrossel dos KPIs |
| `app-input`, `app-message-alert` | 1 / 1 | campo com rótulo/erro e faixa de aviso (diálogo de setor) |
| `buttonRound` (diretiva) | 2 | botão arredondado de 77px |
| pipes `titlecase` nativo, `nomeUnidade`, `turno`, `tratarData`, `order`, `search` | — | formatação |

**HTML nativo e formulários**

| Peça | Ocorrências |
|---|---|
| `<button>` | 142 |
| `<form>` / `[formGroup]` | 23 / 23 |
| `formControlName` | 64 |
| `<input>` (todos) | 28 |
| `<select>` nativo (inclui os da barra do Quill) | 17 |
| `<textarea>` | 5 |
| `type="file"` | 2 |
| `routerLink` | 18 |
| `[innerHTML]` (texto rico vindo do backend) | 12 |
| ícones Font Awesome (`fas`, `far`, `fab`) | 12 |

**Bibliotecas**

| Biblioteca | Uso real |
|---|---|
| `ngx-quill` 5 / `quill` 1.3.7 | editor rico em 4 lugares: novo requerimento, encaminhar, concluir (e um comentado em responder). Barra: negrito, itálico, sublinhado, alinhamento, lista ordenada, lista com marcadores |
| `highcharts` 8 + `highcharts-angular` | 4 `<highcharts-chart>` no Analytics, 2 ativos (colunas) e 2 comentados |
| `@ng-select/ng-select` | 1 uso: unidades do funcionário no setor (múltiplo, máximo 5) |
| `ngx-bootstrap` | `ModalModule` para os dois modais genéricos (8 chamadas de confirmação e 14 de aviso nos `.ts`); `TabsModule` importado |
| `bootstrap` 4 | grade (`row`, `col-*`), `custom-file`, `alert`, `table`, utilitários |
| `@ngrx/store` + `effects` 6 | estado de `auth`, `caixaDeEntrada`, `minhaPauta`, `requerimento` (encaminhados), `concluidos`, `unidadePessoa` (`core/store/index.ts:11-27`) |
| `toastr` | 1 chamada (`NAT/natureza-requerimento.component.ts:98`) |
| `jquery` | animação da faixa de aviso do diálogo de setor |
| `angular-datatables` / `datatables.net` | no `package.json`, **sem uso** em `src/app` (as tabelas são `mat-table`) |
| `@ng-bootstrap/ng-bootstrap`, `angular-intl`, `hammerjs`, `sort-by` | no `package.json`; só `sort-by` aparece em uso (pipe `order`) |
| máscara | não há biblioteca de máscara declarada; `mask=` aparece em 4 campos de data |
| fontes | Roboto 300/400/500, Material Icons e Font Awesome 5.9 por CDN (`src/index.html:11-13`) |

---

## 4. Regras de negócio lidas no código

Cada regra: enunciado, onde está, tipo e valores exatos. "Front" quer dizer que a regra está implementada só na tela; o que o backend valida por conta própria é não confirmado.

### Acesso e sessão

1. **A entrada é por token entregue pelo login central, não por senha nesta aplicação.** `core/components/login/login.component.ts:51-60`, `core/service/auth/store/auth.effects.ts:22-49`. Tipo: integração. A rota `login/:token/:user` dispara `TRY_TOKEN_LOGIN`; o front busca `GET {API_RESOURCE_SERVICE}/usuario/{user}` e `…/usuario/{user}/pessoa` com `Unidade-Ref: unid32` e guarda `usuario { oid, nome }`, `email`, `foto`, `oidpessoa`, `token`. O parâmetro `unidade` é lido da rota, mas a rota não o declara.
2. **Quem não está autenticado é mandado ao login central.** `core/service/auth/auth-guard.service.ts:26-28`, `core/service/auth/store/auth.effects.ts:85-90`. Tipo: permissão. Destino: `environment.LOGIN_URL`.
3. **A sessão vale enquanto a aba estiver aberta; sair apaga tudo.** `core/service/auth/store/auth.reducers.ts:14-27`, `:34-57`, `:58-69`. Tipo: formato. Chave `AuthState` em `sessionStorage`; no logout, `localStorage.clear()` e `sessionStorage.clear()`.
4. **Nenhuma tela é restrita por perfil, nível ou setor: basta estar autenticado.** `app.routing.ts:6-58`, `paginas/requerimentos/requerimentos-routing.module.ts:23-55`. Tipo: permissão. O que restringe o acesso a Setor, Natureza, Gerencial e Analytics é só o menu vir ou não com o item.
5. **O menu de cada pessoa é decidido fora, pelo cadastro de menus da aplicação.** `app.component.ts:152-182`, `core/service/core.service.ts:37-51`. Tipo: integração. `oidAplicacao = 'aplicProtocoloNovo'` (`src/environments/environment.prod.ts:18`); unidade de referência fixa `'unid32'` (`app.component.ts:163`).
6. **As filas começam recortadas pelos setores e unidades em que o funcionário está cadastrado.** `app.component.ts:134-149`, `SH/models/unidade-setor.storage.model.ts:9-19`, `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:85-86`. Tipo: permissão. Origem: `GET /setor/search/pessoa/{oidPessoa}`; guardado em `localStorage` na chave `unidades_stores` como `{ oidUnidade: [], oidSetor: [] }` e enviado como listas separadas por vírgula.
7. **O último acesso da pessoa é registrado 20 segundos depois de abrir o sistema.** `app.component.ts:213-220`, `core/service/core.service.ts:58-60`. Tipo: integração. `PATCH /pessoa/{oidPessoa}/ultimo-acesso`.
8. **As chamadas à API não levam o token.** `interceptor.module.ts:20-47`, `app.module.ts:63-95`. Tipo: integração. O interceptor existente só acrescentaria o cabeçalho `oidunidade` e não está importado no `AppModule`; não há `Authorization` em nenhum `.ts`. Se o pacote `default-style` registra um interceptor próprio: não confirmado.

### Filas

9. **A caixa de entrada pede ao servidor os requerimentos que aguardam análise, 10 por vez, do mais novo para o mais antigo.** `SH/services/requerimento.service.ts:29-48`. Tipo: integração. Parâmetros: `oidPessoa`, `nivelAbaixo`, `unidades`, `setores`, `dataInicial`, `sort=DESC`, `page`, `size` (padrão 10) e, se houver filtro, `naturezaRequerimento` **ou** `tipoNaturezaRequerimento` (o tipo prevalece: `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:135-140`). Tamanhos oferecidos: 5, 10, 25, 50.
10. **Dentro da página, as linhas são ordenadas pelo número do requerimento, do maior para o menor.** `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:147`, `REQ/navegacao/minha-pauta/minha-pauta.component.ts:143`, `REQ/navegacao/encaminhados/encaminhados.component.ts:143`, `REQ/navegacao/requerimento-concluidos/requerimento-concluido-table/requerimento-concluido-table.component.ts:153`. Tipo: cálculo.

### Situações do requerimento

11. **O requerimento tem quatro estados.** `SH/components/requerimento-status/requerimento-status.component.html:4-7`, `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.ts:617-631`. Tipo: formato. Valores e rótulos:

    | `requerimento.estado` | Rótulo no ponto de status | Rótulo no histórico de protocolos |
    |---|---|---|
    | `SOLICITADO` | Livre | Novo |
    | `ANALISANDO` | Análise | Analisando |
    | `DEFERIDO` | Deferido | Deferido |
    | `INDEFERIDO` | Indeferido | Indeferido |

12. **O selo da fila combina o tipo do último despacho com o estado.** `SH/components/badge-estado/badge-estado.component.ts:25-77`, `SH/components/badge-estado/badge-estado.component.html:1-11`. Tipo: formato.

    | `tipo` | `estado` | Selo |
    |---|---|---|
    | `analise` | `SOLICITADO` | Novo |
    | `LOCK` | `ANALISANDO` | Analisando |
    | `LOCK` | `SOLICITADO` | Solicitado |
    | `informacao` | `ANALISANDO` ou `SOLICITADO` | Encaminhado |
    | `reencaminhar` | `ANALISANDO` | Reencaminhado |
    | `resposta` | qualquer | Resposta |
    | `parecer` | `ANALISANDO` | Reaberto |
    | `parecer` | `SOLICITADO` | Solicitado |
    | `parecer` | `DEFERIDO` | Deferido |
    | `parecer` | `INDEFERIDO` | Indeferido |

    Combinações fora da tabela (por exemplo `analise` + `ANALISANDO`) deixam o selo sem texto.
13. **A linha do tempo registra doze tipos de evento.** `SH/components/requerimento-timeline/requerimento-timeline.component.ts:22-23`, `SH/components/requerimento-timeline/requerimento-timeline.component.html:6-275`. Tipo: formato. `tipoEvento` e o rótulo mostrado: `abertura` → "Abertura do protocolo"; `informacao` → "Reencaminhado" (o template usa esse rótulo também para o primeiro encaminhamento, `…html:68`); `reencaminhar` → "Reencaminhado"; `resposta` → "Resposta"; `Deferido` → "Deferido"; `Indeferido` → "Indeferido"; `LOCK` → "Movido para análise"; `Com Urgencia` → "Definido a Urgência"; `Removida Urgência` → "Removido a Urgência"; `parecer` → "Parecer"; `Nota de Despacho` → "Nota"; `Analisando` está na lista do componente, mas não tem bloco no template. Campos de cada evento: `descricao`, `tipoEvento`, `usuario`, `de`, `para`, `data` (`core/model/protocolo.model.ts:291-298`).
14. **Requerimento aberto pelo funcionário nasce "Solicitado".** `REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.ts:248-274`. Tipo: transição de situação. `estado = 'SOLICITADO'`, `oidMotivo = "2"` fixo; `POST /requerimento`.
15. **"Tratar" assume o requerimento e o leva para análise.** `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.ts:360-390`, `:635-646`, `SH/services/requerimento.service.ts:75-78`. Tipo: transição de situação. `POST /analise-requerimento/analisar/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}`, onde `oidUnidadePessoa` é o vínculo do funcionário **na unidade do requerimento**; a resposta é o novo despacho. O evento resultante na linha do tempo é `LOCK` ("Movido para análise"). O estado resultante é decidido no backend (o front não o grava).
16. **Qual botão a prévia oferece depende de onde o requerimento está.** `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.ts:231-269`. Tipo: permissão.
    - "Tratar": não aparece se já saiu do meu setor, se está na minha pauta ou se o tipo é `LOCK`; aparece se o tipo é `analise`, `informacao` ou `resposta`, ou se `encaminhado == false`.
    - "Continuar": só se está na minha pauta.
    - "Visualizar": aparece se já saiu do meu setor; não aparece na minha pauta nem com tipo `analise`; aparece com tipo `parecer`, `informacao`, `resposta` ou `encaminhado == false`.
    - Encaminhar (ícone) e a bandeira de urgência aparecem sempre, salvo quando a prévia vem do Gerencial ou da Pesquisa (regra 57).
17. **Encaminhar exige setor de destino e texto; o nível de destino vai de 1 a 3 e o anexo é opcional.** `REQ/dialog/encaminhar-requerimento-dialog/encaminhar-requerimento-dialog.component.ts:303-308`, `:60`, `:183-208`, `:286-300`. Tipo: transição de situação. `POST /analise-requerimento/encaminhar/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}` com `{ oidSetor, descricao, nivel, anexos? }`. Mensagens: "Requerimento encaminhado com sucesso." / "Falha para encaminhar o requerimento.". Depois, a tela vai para `/requerimentos/encaminhados` (`REQ/navegacao/tratar-requerimento/tratar-requerimento-footer/tratar-requerimento-footer.component.ts:168-174`).
18. **O que já saiu do meu setor só pode ser reencaminhado.** `REQ/dialog/encaminhar-requerimento-dialog/encaminhar-requerimento-dialog.component.html:96-112`, `…component.ts:210-237`. Tipo: transição de situação. Com `saiuDoMeuSetor`, o botão "Encaminhar" some e aparece "Reencaminhar": `POST /analise-requerimento/reencaminhar/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}`. Mensagem de falha: "Falha para reencaminhar o requerimento.".
19. **Responder ao aluno exige texto e não encerra o requerimento.** `REQ/navegacao/tratar-requerimento/tratar-requerimento-header/dialog/responder/responder.component.ts:35-58`, `:64-67`. Tipo: transição de situação. `POST /analise-requerimento/responder/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}` com `{ oidSetor: setorDestino.oid, descricao, nivel }`. Mensagens: "Resposta salva com sucesso" / "Erro para salvar a resposta". O selo passa a "Resposta" (regra 12); o estado resultante é do backend.
20. **Concluir é sempre deferir ou indeferir, com texto obrigatório.** `REQ/dialog/concluir-requerimento-dialog/concluir-requerimento-dialog.component.ts:30-33`, `:76-80`, `:138-155`, `:172-180`. Tipo: transição de situação. Opções: `deferido`, `indeferido`. `POST /analise-requerimento/fechar/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}/estado/{DEFERIDO|INDEFERIDO}` com `{ descricao, oidSetor, nivel }` (nível 1 se não houver). Só envia se o vínculo do funcionário na unidade for conhecido.
21. **Requerimento concluído pode ser reaberto por quem o vê em Concluídos, com confirmação.** `REQ/navegacao/requerimento-concluidos/requerimento-concluido-table/requerimento-concluido-table.component.ts:304-336`. Tipo: transição de situação. Confirmação: "Deseja reabrir o requerimento nº {numero}?", título "Reabrir Requerimento". `POST /analise-requerimento/reabrir/{oidRequerimento}/unidadepessoa/{oidUnidadePessoa}`. Mensagens: "Requerimento reaberto com sucesso" / "Falha para reabrir o requerimento". O selo depois é "Reaberto" (tipo `parecer` + `ANALISANDO`).
22. **Em modo de visualização, encaminhado ou já com parecer, não se age sobre o requerimento.** `REQ/navegacao/tratar-requerimento/tratar-requerimento-footer/tratar-requerimento-footer.component.html:16-29`, `REQ/navegacao/tratar-requerimento/tratar-requerimento.component.html:99-104`, `REQ/navegacao/tratar-requerimento/tratar-requerimento.component.ts:243-251`. Tipo: permissão. "Encaminhar" e "Concluir Protocolo" ficam desabilitados se `tipo == 'parecer'` ou `visualizado`; o campo de nota fica somente leitura se `saiuDoMeuSetor`, `visualizado` ou `tipo == 'parecer'`; "Tratar" só aparece se `visualizado`, não saiu do setor e não é parecer. Mensagens: "Requerimento fechado não pode ter notas", "Requerimento no modo de visualização ação não permitida". Clicar "Tratar" ali assume o requerimento: "Tratamento do requerimento iniciado" / "Falha para iniciar o tratamento do requerimento" (`…tratar-requerimento-footer.component.ts:131-152`).

### Abertura, anexos, urgência, notas

23. **Para abrir um requerimento interno é preciso unidade, CPF de 11 caracteres, nome de pelo menos 3, sexo, natureza e descrição.** `REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.ts:88-96`, `REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.html:31-32`. Tipo: validação. `cpf`: `required`, `minLength(11)`, `maxlength="11"`, sem máscara e sem dígito verificador. `tipoRequerimento` não tem validador. `sexo` (homem / mulher) é obrigatório na tela e **removido do envio** (`…component.ts:270`). Mensagens: "Requerimento criado com sucesso" / "Erro para abrir o requerimento".
24. **Cada tipo de natureza diz quais anexos pede; a tela mostra um campo por anexo, mas não impede o envio sem eles.** `REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.ts:136-155`, `…component.html:132-160`, `:192-194`. Tipo: validação. Origem: `GET /anexo-natureza/search/tipo-natureza-requerimento?oidTipoNatureza`. O aviso "Anexo obrigatório *" aparece enquanto nenhum arquivo foi escolhido; o botão "Enviar" depende só de `formNovoRequerimento.invalid`.
25. **O arquivo sobe antes, para uma área temporária, e o requerimento leva só o nome devolvido.** `SH/services/file.service.ts:14-23`, `REQ/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.ts:157-195`. Tipo: integração. `POST /fileupload/temp/fileupload` (campo `file`); resposta `nameFileTemp`; no requerimento vai `{ oidTipoAnexo, caminhoAnexo }`, no encaminhamento `{ caminhoAnexo }`. Não há limite de tipo nem de tamanho no front. Mensagens: "Upload do arquivo feito com sucesso", "Anexo inserido com sucesso".
26. **A urgência é uma marca ligada e desligada à mão; requerimento já decidido não aceita.** `shared/components/button-urgencia/button-urgencia.component.ts:76-95`, `:105-126`, `shared/components/button-urgencia/button-urgencia.component.html:1-2`. Tipo: permissão. `PATCH /requerimento/{oid}/urgencia` com `{ urgencia: true|false, oidpessoa }`. Bloqueio: estado `DEFERIDO` ou `INDEFERIDO` → "Requerimento já {estado} não pode ser definido a prioridade"; botão desabilitado se `tipo === 'parecer'`. Sucesso: "Prioridade do requerimento alterada com sucesso". Fica registrado na linha do tempo (regra 13).
27. **A nota de despacho é uma anotação interna presa ao despacho em curso.** `REQ/navegacao/tratar-requerimento/tratar-requerimento.component.ts:230-270`, `SH/services/tratar-requerimento.service.ts:83-88`. Tipo: integração. `POST /nota-despacho` com `{ descricao, oidDespacho, oidPessoa }`. Mensagens: "Nota salva com sucesso" / "Falha para salvar a nota".
28. **Cada funcionário guarda respostas prontas ("favoritos") por setor.** `SH/services/requerimento-dialog.service.ts:20-49`, `SH/components/requerimento-favoritos/requerimento-favoritos.component.ts:82-126`. Tipo: integração. `GET /analise-requerimento/encaminhamento-favorito/pessoa/{oidPessoa}/setor/{oidSetor}`; `POST …/encaminhamento-favorito` com `{ descricao, oidPessoa, oidSetor }`; `DELETE …/encaminhamento-favorito/{oid}`. "Salvar Resposta" só habilita com texto na descrição. Mensagens: "Favoritos salvo com sucesso", "Favorito deletado com sucesso", "Não existe favoritos cadastrados.".
29. **O filtro por estado age só sobre as linhas já carregadas e não vale em Minha Pauta nem em Encaminhados.** `REQ/sidebar/filtro-estado/filtro-estado.component.ts:51-67`, `:111-121`, `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:234-252`. Tipo: formato. "Livre" → `SOLICITADO`; "Em Análise" → `ANALISANDO`; "Todos" → `clear`.

### Níveis

30. **O nível vai de 1 a 3 e é mostrado em estrelas.** `shared/components/rating/rating.component.ts:9-10`. Tipo: limite. Valores: `[1, 2, 3]`, padrão 1.
31. **O nível do funcionário é dado por unidade dentro do setor, não por pessoa.** `paginas/setor/setor/setor-pessoa/setor-pessoa-form-dialog/setor-unidade-pessoa/setor-unidade-pessoa.component.html:27-37`, `paginas/setor/setor/setor-pessoa/setor-pessoa-form-dialog/setor-pessoa-form-dialog.component.ts:203-211`, `:273-281`. Tipo: formato. Envio: `{ oidPessoa, oidSetor, unidades: [{ oid, nivel }] }`.
32. **Cada tipo de natureza tem um nível.** `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.ts:31`, `:331-340`. Tipo: formato. Padrão 1.
33. **Ao encaminhar, escolhe-se o nível de destino, que começa no nível atual do requerimento.** `REQ/dialog/encaminhar-requerimento-dialog/encaminhar-requerimento-dialog.component.ts:60`, `:303-308`. Tipo: transição de situação. Opções: 1, 2, 3.
34. **"Nível abaixo do meu" pede ao servidor também o que está em níveis abaixo; a fila mostra o nível do despacho ou, sem despacho, o do tipo de natureza.** `REQ/sidebar/filtro-nivel/filtro-nivel.component.ts:31-40`, `SH/services/requerimento.service.ts:33`, `REQ/navegacao/caixa-de-entrada/caixa-de-entrada-table/caixa-de-entrada-table.component.html:57-60`. Tipo: permissão. Opções: "Sim" (`true`) e "Não" (`'false'`); vira o parâmetro `nivelAbaixo`. O que cada nível pode fazer não está no front.

### Prazos

35. **Prazo e tempo decorrido chegam calculados do servidor, em dias.** `core/model/protocolo.model.ts:176-177`, `SH/components/requerimento-prazo/requerimento-prazo.component.html:1-5`. Tipo: prazo. Campos `prazo` e `tempoDecorrido`; texto "Referência: {prazo} dias"; barra com `total = prazo` e `atual = tempoDecorrido`. Dias úteis ou corridos: não confirmado.
36. **Está em atraso quando o decorrido passa do prazo.** `SH/components/requerimento-prazo/requerimento-prazo.component.html:3-4`. Tipo: prazo. Classe `noPrazo` se `percorrido <= prazo`; `emAtraso` se `percorrido > prazo`. O rótulo é "Faltam: {percorrido} dias", mas o número mostrado é o decorrido.
37. **No Gerencial, "fora do prazo" conta os requerimentos do setor cujo vencimento passou do prazo, e a fila vem do mais vencido para o menos.** `paginas/gerencial/gerencial/page/page.component.ts:238-244`, `:210`. Tipo: cálculo. `vencimento > prazo`, com prazo nulo valendo 0; ordenação `b.vencimento - a.vencimento`.
38. **Nenhum formulário deste front define prazo.** `core/model/protocolo.model.ts:104-114`, `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.ts:68-73`. Tipo: prazo. `ITipoNatureza` tem `prazo` e `explicacao`, mas o formulário do tipo só tem `descricao`, `observacao`, `anexo`, `maxSolicitacoes`.

### Contadores

39. **Os números das quatro abas vêm de quatro contagens do servidor, com os mesmos filtros da fila.** `SH/services/quantidade-requerimento.service.ts:17-37`, `REQ/requerimento.component.ts:186-209`. Tipo: cálculo. `total-caixa-entrada`, `total-em-analise`, `total-encaminhados`, `total-concluidos`. Falha: "Falha para obter a quantidade de requerimentos".
40. **"Novos" conta as linhas em estado Solicitado da página carregada.** `REQ/navegacao/caixa-de-entrada/caixa-de-entrada.component.ts:358-364`, `REQ/requerimento.component.html:57-59`. Tipo: cálculo. Existe também `GET /pessoa/{oid}/quantidade-novos-requerimentos` (`REQ/requerimento.component.ts:234-242`), cujo resultado não é mostrado.

### Setores e integrantes

41. **Setor tem só nome, obrigatório, de 3 letras ou mais, e não pode repetir.** `paginas/setor/setor/setor-form-dialog/setor-form-dialog.component.ts:36-38`, `:51-100`. Tipo: validação. `POST /setor` ou `PUT /setor/{oid}`. Mensagens: "Setor salvo com sucesso!", "Setor atualizado com sucesso!"; HTTP 409 → "Este setor já existe cadastrado!".
42. **Setor pode ser excluído, com confirmação.** `paginas/setor/setor/setor-item/setor-item.component.ts:47-64`. Tipo: validação. "Deseja deletar este setor?"; `DELETE /setor/{oid}`; "Setor deletado com sucesso". O front não verifica se há requerimentos ou pessoas no setor.
43. **A lista de setores traz até 500, em ordem alfabética, e a busca espera meio segundo depois da digitação.** `paginas/setor/setor.service.ts:18-30`, `paginas/setor/setor/setor.component.ts:46-56`. Tipo: limite. `sort=st.descricao,asc`, `size=500`, `debounceTime(500)`.
44. **Só entra no setor quem ainda não está nele; a busca é por nome, a partir de 2 letras.** `paginas/setor/setor/setor-pessoa/setor-pessoa-form-dialog/setor-pessoa-form-dialog.component.ts:72-74`, `:156-184`, `paginas/setor/setor.service.ts:39-44`. Tipo: validação. `GET /setor/search/funcionarios/desassociado/{oidSetor}?term={nome}&size=200`; `nomePessoa` `required`, `minLength(4)`; "Nenhum funcionário localizado".
45. **O integrante precisa de ao menos uma unidade; marcam-se até 5 por vez e não se repete unidade.** `paginas/setor/setor/setor-pessoa/setor-pessoa-form-dialog/setor-pessoa-form-dialog.component.html:84-88`, `:115`, `…component.ts:238-252`. Tipo: limite. `[maxSelectedItems]="5"`; "Salvar" desabilitado com zero unidades; "Essa unidade já existe na lista". Envio: `POST /setor/funcionario-unidade-setor`; sucesso "Dados salvo com sucesso".
46. **Tirar alguém do setor pede confirmação e é por unidade.** `paginas/setor/setor/setor-pessoa/setor-pessoa.component.ts:85-108`. Tipo: validação. "Deseja deletar esta pessoa do setor?"; `DELETE /setor/funcionario/{oidSetorUnidadePessoa}`; "Pessoa removida do setor com sucesso".

### Naturezas e tipos

47. **Natureza tem descrição obrigatória de 3 letras ou mais, um tipo interno ou externo, e não pode repetir.** `NAT/natureza-requerimento.component.ts:52-62`, `:83-111`, `paginas/natureza-requerimento/shared/natureza-model.ts:9-13`. Tipo: validação. Opções `{ id: 1, nome: 'interno' }`, `{ id: 2, nome: 'externo' }`; valor inicial `'interno'`. Mensagens: "Natureza cadastrada com sucesso!", "Natureza atualizada com sucesso."; HTTP 409 → "Essa natureza já existe cadastrada!".
48. **Natureza pode ser excluída, com confirmação.** `NAT/natureza-tabela/natureza-tabela.component.ts:92-112`. Tipo: validação. "Deseja deletar esta natureza?"; `DELETE /natureza-requerimento/{oid}`; "Natureza deletada com sucesso". O front não verifica requerimentos existentes.
49. **A lista de naturezas vem de 5 em 5 e a busca só dispara com 3 letras ou mais.** `NAT/natureza-requerimento.component.ts:64`, `NAT/natureza-tabela/natureza-tabela.component.ts:48-59`. Tipo: limite. `debounceTime(500)`; menos de 3 letras volta à lista inteira; tamanhos 5, 10, 25, 50.
50. **Tipo de natureza tem descrição obrigatória, observação, nível e um máximo de solicitações, e não pode repetir.** `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.ts:67-74`, `:193-262`, `…component.html:74-75`. Tipo: validação. `maxSolicitacoes`: número, mínimo 0, padrão 0 (o que o limite restringe — por aluno, por período — não está no front). `POST /natureza-requerimento/{oidNatureza}/tipo-natureza-requerimento`, `PUT /tipo-requerimento/{oid}`. Mensagens: "Tipo natureza cadastrada com sucesso", "Tipo natureza atualizada com sucesso"; HTTP 409 → "Esse tipo natureza já existe cadastrado".
51. **Cada tipo de natureza lista os tipos de anexo que exige, sem repetir.** `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.ts:124-139`, `:311-323`, `:141-158`. Tipo: validação. Catálogo: `GET /tipo-anexo`; vínculo: `POST /tipo-natureza-requerimento/{oidTipo}/tipo-anexo/{oidAnexo}`; remoção: `DELETE /anexo-natureza/{oid}`. Mensagens: "Anexo inserido na lista", repetido → "Filtro já existe", "Anexo salvo", "Anexo deletado com sucesso.".
52. **Excluir um tipo de natureza não pede confirmação.** `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-mattab-natureza.component.ts:173-184`. Tipo: validação. `DELETE /tipo-requerimento/{oid}`; "Tipo natureza deletado com sucesso".
53. **A natureza é atendida por pares setor × unidade; marcar vários setores e várias unidades grava todas as combinações.** `NAT/natureza-dialog/tipo-natureza-mattab-setor/tipo-natureza-mattab-setor.component.ts:121-130`, `:176-187`, `NAT/natureza-dialog/tipo-natureza-mattab-setor/tipo-natureza-table-setor-dialog/tipo-natureza-table-setor-dialog.ts:81-95`, `NAT/natureza-dialog/tipo-natureza-mattab-setor/tipo-natureza-table-unidade-dialog/tipo-natureza-table-unidade-dialog.ts:61-71`. Tipo: cálculo. Um `POST /setor-natureza-requerimento` por par `{ oidSetor, oidUnidade, oidNaturezaRequerimento }`. Avisos: "Selecione um setor", "Selecione uma unidade", "Cadastro do setor e da unidade feito com sucesso". Excluir o setor ("Deseja deletar este setor?", título "Deletar Setor") apaga todos os pares dele: `DELETE /setor-natureza-requerimento/delete-all?oidsetor&oidnaturezarequerimento`. Excluir uma unidade ("Deseja deletar esta unidade?") apaga um par.
54. **Cada tipo de natureza pode ter funcionários responsáveis, escolhidos entre os da unidade; só se escolhe entre as unidades de quem está cadastrando.** `NAT/natureza-dialog/tipo-natureza-mattab-natureza/tipo-natureza-cadastro-pessoa/tipo-natureza-cadastro-pessoa.ts:81-90`, `:101-136`, `:138-167`, `:169-187`, `:237-252`. Tipo: permissão. Unidades: `GET /unidade/search/pessoa?oid={logado}`; busca de funcionário a partir de 3 letras (`debounceTime(500)`), `GET /unidade-pessoa/search/funcionario`; vínculo `POST /pessoa-tipo-requerimento` com `{ oidUnidadePessoa, oidTipoNaturezaRequerimento }`. Mensagens: "Funcionário cadastrado com sucesso", HTTP 409 → "Funcionário já cadastrado", "Nenhum funcionário encontrado". Remoção: "Deseja remover este funcionário?" (título "Remover Funcionário Tipo Natureza"), `DELETE /pessoa-tipo-requerimento/{oid}`, "Funcionário removido com sucesso". O efeito desse vínculo na distribuição dos requerimentos não está no front.

### Gerencial, pesquisa e analytics

55. **O Gerencial abre com tudo em "TODOS" e a modalidade EAD.** `paginas/gerencial/gerencial/gerencial.component.ts:42-50`, `paginas/gerencial/gerencial.service.ts:30-53`, `paginas/gerencial/gerencial/gerencial.component.html:48-53`. Tipo: formato. Parâmetros de `GET /gerencial`: `unidades`, `setores`, `naturezaRequerimento`, `tipoNaturezaRequerimento`, `estado` (`LIVRE`, `ANALISE`, `TODOS`), `term` (oid do funcionário; vazio para "TODOS"), `modalidade` (o rótulo da aba: `EAD` ou `Presencial`). A lista de setores traz até 150 (`core/service/core.service.ts:15-25`).
56. **O Gerencial conta os requerimentos do setor por ano e abre o detalhe do ano.** `paginas/gerencial/gerencial.service.ts:73-112`, `paginas/gerencial/gerencial/page/page.component.ts:121-186`. Tipo: cálculo. `GET /requerimento/quantidade_anual/?oidnatureza&oidsetores&modalidade` → `[{ ano, total }]`; `GET /requerimento/quantidade_anual/{ano}` com `natureza`, `setores`, `unidades`, `tipo`, `term`, `modalidade`. "Mostrar Todos" volta à fila sem recorte de ano.
57. **Quem consulta pelo Gerencial ou pela Pesquisa só lê.** `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.html:91`, `paginas/gerencial/gerencial/page/page.component.ts:260`, `paginas/busca/busca/busca.component.ts:124`. Tipo: permissão. Com `isGerencial` ou `buscaRequerimento`, somem urgência, Visualizar, Continuar, Tratar e Encaminhar.
58. **A pesquisa procura em todos os setores, unidades e estados, por nome, CPF ou número.** `paginas/gerencial/gerencial.service.ts:55-71`, `paginas/busca/busca/busca.component.ts:42-44`. Tipo: permissão. `GET /gerencial` com `unidades=TODOS`, `setores=''`, `naturezaRequerimento=TODOS`, `tipoNaturezaRequerimento=TODOS`, `estado=TODOS`, `modalidade=TODOS`, `term={texto}`; o termo é obrigatório; sem paginação.
59. **Sem datas escolhidas, o Analytics considera de 01/01/1969 a 31/12/2035.** `paginas/analytics/analytics/analytics.component.ts:53-54`, `paginas/analytics/analytics.service.ts:22-44`. Tipo: limite. Parâmetros `dataInicial` e `dataFinal`.
60. **O total de uma natureza soma livres, analisando e concluídos; o total de um tipo soma em espera, livres e concluídos.** `paginas/analytics/analytics/analytics.component.ts:112`, `:214-218`. Tipo: cálculo.
61. **O Analytics tem seis contagens por natureza e duas séries por mês.** `paginas/analytics/analytics/analytics.component.html:54-65`, `paginas/analytics/analytics/analytics.component.ts:284-318`, `:334`. Tipo: formato. KPIs: `livres`, `analisando`, `emEspera`, `deferidos`, `indeferidos`, `concluidos`. Séries: `pendentes` × `realizados` (o campo do servidor é `pedentes`) e `total = pedentes + realizados`; tipo `TODOS` quando nenhum tipo está escolhido. Sem dados: "Dados não localizado" e "Dados não encontrado".

### Integrações e formatos

62. **Os dados do aluno vêm do Acadêmico, pelo CPF e pela unidade do requerimento.** `SH/services/academico.service.ts:25-42`, `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.ts:599-613`, `REQ/dialog/preview-requerimento-dialog/preview-aluno-academico/preview-aluno-academico.component.html:47-51`. Tipo: integração. `GET {API_REST_ACADEMICO}/api/aluno/search/cpf?term={cpf}&projection=aluno-matricula-resumo`, cabeçalho `Unidade-Ref: {oidUnidade}`. HTTP 404 → "Aluno não encontrado" / "Verifique se o mesmo está cadastrado no SIGU".
63. **A foto do aluno é buscada em lote por unidade e servida pelo SIGU do grupo da unidade.** `SH/models/foto-academico.mode.ts:44-74`, `SH/services/academico.service.ts:44-66`, `SH/services/helpert.service.ts:4-30`. Tipo: integração. `GET {API_REST_ACADEMICO}/api/pessoa/search/pessoa-foto?cpfs=…`. Três bases de arquivo: unidades do Rio → `https://administrativo-rio2.ucam-campos.br/SIGU/webservice/arquivo/download?url=`; Campos (`unid01`, `unid27`, `unid14`) → `https://administrativo.ucam-campos.br/SIGU/…`; EAD (polos, `unid32`, `hibri01`, `semi01`) → `https://graduacao.candidomendes.edu.br/SIGU/…`.
64. **O anexo é baixado pelo caminho guardado, informando a unidade.** `REQ/dialog/preview-requerimento-dialog/preview-requerimento-dialog.component.ts:283-285`, `REQ/navegacao/tratar-requerimento/tratar-requerimento-header/dialog/anexo-dialog/anexo-dialog.component.ts:39-41`. Tipo: integração. `{STORAGE_PATH}unidade={oidUnidade}&file={caminhoAnexo}`, com `STORAGE_PATH = https://api.candidomendes.edu.br/protocolo/download?` (`src/environments/environment.prod.ts:14`). Anexo sem tipo aparece como "Anexo {n}".
65. **O turno do aluno vem em uma letra.** `SH/pipes/turno-requerimento.pipe.ts:11-27`. Tipo: formato. `M` Manhã, `T` Tarde, `N` Noite, `I` Integral; outro valor: "Turno não definido".
66. **O filtro de data manda dia-mês-ano com a hora fixa 01:00:00.** `REQ/sidebar/filtro-data/filtro-data.component.ts:20`, `:40-45`. Tipo: formato. Vira o parâmetro `dataInicial` das filas; não há data final nas filas.
67. **O impresso do requerimento traz identificação, situação e todo o histórico.** `REQ/impressao/impressao.component.html:4-45`, `REQ/impressao/pagina/pagina.component.html:5-17`. Tipo: formato. Título "CONSULTA DE REQUERIMENTO"; campos Código, CPF, Curso, Requerente, Telefone, Turno, Situação; por evento, "De: … Para: …", texto, "Responsável: …", "Enviado em …".
68. **Erros de rede viram quatro mensagens fixas.** `shared/services/handle-error.service.ts:11-28`. Tipo: formato. 400 → "Erro desconhecido entre em contato com o administrador"; 404 → "404 - Recurso não encontrado"; 500 → "500 - Erro interno"; tempo esgotado → "Tempo limite alcançado"; erro desconhecido → "Erro desconhecido na requisição. Tempo limite alcançado". Usadas nas duas colunas do Gerencial.
69. **Os avisos somem sozinhos.** `shared/services/snack-bar.service.ts:11-14`, `shared/components/modal/modal-alert/modal-alert.component.ts:27-29`. Tipo: limite. Aviso de rodapé: 3,5 s por padrão (3 a 4 s nos que o componente abre direto); aviso modal: fecha em 10 s.

---

## 5. API consumida

Bases em produção (`src/environments/environment.prod.ts:6-15`): `API_REST = https://api.candidomendes.edu.br/protocolo`; `API_RESOURCE_SERVICE = https://api-gerencial.ucam-campos.br`; `API_REST_ACADEMICO = https://api.candidomendes.edu.br/academico`; `ACADEMICO_ENDPOINT = https://login.ucam-campos.br/backend`; `STORAGE_PATH = https://api.candidomendes.edu.br/protocolo/download?`; `LOGIN_URL = https://login.candidomendes.edu.br/login.jsf?client_id=aplicProtocoloNovo@ucam`. Em desenvolvimento `API_REST = http://localhost:9090`. As respostas de listagem seguem o formato HAL do Spring Data REST (`_embedded`, `page`), menos a caixa de entrada v2 (`content`, `pageable`, `totalElements`).

### 5.1 Endpoints por serviço

Salvo indicação, o caminho é relativo a `API_REST`.

**Autenticação e moldura** — `core/service/auth/store/auth.effects.ts`, `core/service/core.service.ts`, `core/store/unidade/service/unidade.effects.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `{API_RESOURCE_SERVICE}/usuario/{oidUsuario}` | dados do usuário (cabeçalho `Unidade-Ref: unid32`) |
| GET | `{API_RESOURCE_SERVICE}/usuario/{oidUsuario}/pessoa` | nome e e-mail |
| GET | `{API_RESOURCE_SERVICE}/menu/search/usuario?oidUsuario&oidAplicacao` | menu |
| GET | `/setor/search/pessoa/{oidPessoa}` | setores e unidades do funcionário (com `?perfil=funcionario` nos filtros) |
| PATCH | `/pessoa/{oidPessoa}/ultimo-acesso` | registro de acesso |
| GET | `/setor?page&size=150` | todos os setores |
| GET | `/unidade/search/all?term` | todas as unidades |
| GET | `/unidade/{oid}` | nome da unidade |
| GET | `/unidade/search/pessoa?oid` | unidades da pessoa (filtro) |

**Filas e contagens** — `SH/services/requerimento.service.ts`, `SH/services/quantidade-requerimento.service.ts`, efeitos em `SH/store/*`

| Método | Caminho | Uso |
|---|---|---|
| GET | `/analise-requerimento/v2/search/aguardando/analise` | caixa de entrada (paginada) |
| GET | `/analise-requerimento/search/aguardando` | variante por estado (`estado`, `setores`); não vi chamada ativa |
| GET | `/analise-requerimento/search/analisando` | minha pauta |
| GET | `/analise-requerimento/search/encaminhados` | encaminhados (paginada) |
| GET | `/analise-requerimento/search/concluidos` | concluídos (paginada) |
| GET | `/analise-requerimento/search/total-caixa-entrada` | contagem |
| GET | `/analise-requerimento/search/total-em-analise` | contagem |
| GET | `/analise-requerimento/search/total-encaminhados` | contagem |
| GET | `/analise-requerimento/search/total-concluidos` | contagem |
| GET | `/pessoa/{oidPessoa}/quantidade-novos-requerimentos` | novos (resultado não exibido) |

Parâmetros comuns das filas: `oidPessoa`, `unidades`, `setores`, `dataInicial`, `nivelAbaixo`, `page`, `size`, e `naturezaRequerimento` ou `tipoNaturezaRequerimento`.

**Requerimento** — `SH/services/requerimento.service.ts`, `SH/services/tratar-requerimento.service.ts`, `SH/services/preview-requerimento.service.ts`, `SH/services/requerimento-dialog.service.ts`, `SH/services/file.service.ts`

| Método | Caminho | Uso |
|---|---|---|
| POST | `/requerimento` | abrir requerimento |
| GET | `/requerimento/{oid}/detalhado` | requerimento completo (3 tentativas) |
| GET | `/requerimento/{oid}/timeline` | linha do tempo |
| GET | `/requerimento/search/pessoa?oidPessoa` | histórico de protocolos da pessoa |
| PATCH | `/requerimento/{oid}/urgencia` | ligar/desligar urgência |
| POST | `/analise-requerimento/analisar/{oid}/unidadepessoa/{oidUP}` | tratar (assumir) |
| POST | `/analise-requerimento/encaminhar/{oid}/unidadepessoa/{oidUP}` | encaminhar |
| POST | `/analise-requerimento/reencaminhar/{oid}/unidadepessoa/{oidUP}` | reencaminhar |
| POST | `/analise-requerimento/responder/{oid}/unidadepessoa/{oidUP}` | responder ao aluno |
| POST | `/analise-requerimento/fechar/{oid}/unidadepessoa/{oidUP}/estado/{estado}` | concluir (DEFERIDO / INDEFERIDO) |
| POST | `/analise-requerimento/reabrir/{oid}/unidadepessoa/{oidUP}` | reabrir |
| GET | `/historico/search/requerimento?term={oid}` | histórico (não vi chamada ativa) |
| GET | `/nota-despacho/search/all?oiddespacho` | notas do despacho |
| POST | `/nota-despacho` | nova nota |
| GET | `/analise-requerimento/encaminhamento-favorito/pessoa/{oidPessoa}/setor/{oidSetor}` | favoritos |
| POST | `/analise-requerimento/encaminhamento-favorito` | salvar favorito |
| DELETE | `/analise-requerimento/encaminhamento-favorito/{oid}` | apagar favorito |
| POST | `/fileupload/temp/fileupload` | upload temporário |
| GET | `/anexo-natureza/search/tipo-natureza-requerimento?oidTipoNatureza` | anexos exigidos pelo tipo |
| GET | `/setor/search/all?term&page&size=300` | setores para encaminhar |
| GET | `/pessoa/{oidPessoa}` | pessoa (não vi chamada ativa) |
| GET | `{STORAGE_PATH}unidade={oidUnidade}&file={caminho}` | download de anexo (link) |

**Natureza** — `paginas/natureza-requerimento/natureza-requerimento.service.ts` (sobre `shared/services/base-resource.service.ts`), `paginas/natureza-requerimento/tipo-natureza-requerimento.service.ts`, `SH/services/shared.service.ts`, `SH/services/natureza.service.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `/natureza-requerimento/search/all?term&page&size&projection=natureza-requerimento-resumo` | listar naturezas |
| GET | `/natureza-requerimento/search/oid?val={oid}` | uma natureza |
| POST | `/natureza-requerimento` | criar |
| PUT | `/natureza-requerimento/{oid}` | atualizar |
| DELETE | `/natureza-requerimento/{oid}` | excluir |
| GET | `/tipo-requerimento/search/natureza-requerimento?oid&page&size` | tipos da natureza |
| POST | `/natureza-requerimento/{oidNatureza}/tipo-natureza-requerimento` | criar tipo |
| PUT | `/tipo-requerimento/{oid}` | atualizar tipo |
| DELETE | `/tipo-requerimento/{oid}` | excluir tipo |
| GET | `/tipo-anexo` | catálogo de tipos de anexo |
| GET | `/tipo-requerimento/{oid}/anexoNaturezaRequerimentos?projection=anexo-natureza-requerimento-resumo` | anexos do tipo |
| POST | `/tipo-natureza-requerimento/{oidTipo}/tipo-anexo/{oidAnexo}` | exigir anexo |
| DELETE | `/anexo-natureza/{oid}` | deixar de exigir |
| GET | `/setor-natureza-requerimento/search/all?oidNaturezaRequerimento&projection=setor-natureza-requerimento-resumo` | pares setor × unidade |
| POST | `/setor-natureza-requerimento` | criar par |
| DELETE | `/setor-natureza-requerimento/{oid}` | excluir par |
| DELETE | `/setor-natureza-requerimento/delete-all?oidsetor&oidnaturezarequerimento` | excluir todos os pares do setor |
| GET | `/unidade-pessoa/search/funcionario?oidUnidade&term&projection=unidade-pessoa-resumo&page&size=500` | funcionários da unidade |
| GET | `/pessoa-tiponatureza/search/especifico?tipoNatureza&unidades` | funcionários do tipo |
| POST | `/pessoa-tipo-requerimento` | vincular funcionário ao tipo |
| DELETE | `/pessoa-tipo-requerimento/{oid}` | desvincular |

**Setor** — `paginas/setor/setor.service.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `/setor/search/all?term&sort=st.descricao,asc&page&size=500` | listar |
| GET | `/setor/{oid}` | um setor |
| POST | `/setor` | criar |
| PUT | `/setor/{oid}` | renomear |
| DELETE | `/setor/{oid}` | excluir |
| GET | `/setor/search/funcionarios/{oidSetor}` | integrantes, agrupados por unidade |
| GET | `/setor/search/funcionarios/desassociado/{oidSetor}?term&size=200` | quem pode entrar |
| GET | `/setor/search/funcionario/{oidSetorUnidadePessoa}` | unidades e níveis de um integrante |
| POST | `/setor/funcionario-unidade-setor` | gravar integrante (criação e edição) |
| PATCH | `/setor/funcionario-unidade-setor` | definido no serviço; não vi chamada |
| DELETE | `/setor/funcionario/{oidSetorUnidadePessoa}` | tirar do setor |
| GET | `/unidade/search/all?term` | unidades |

**Gerencial e Pesquisa** — `paginas/gerencial/gerencial.service.ts`, `shared/url-provider.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `/gerencial` | requerimentos do setor (e a pesquisa, com tudo em `TODOS`) |
| GET | `/requerimento/quantidade_anual/` | contagem por ano |
| GET | `/requerimento/quantidade_anual/{ano}` | requerimentos do ano |
| GET | `/setor/search/pessoa/{oidPessoa}?perfil=funcionario` | setores da pessoa (definido; não vi chamada no Gerencial) |

**Analytics** — `paginas/analytics/analytics.service.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `/analytics/requerimentos-por-natureza` | KPIs por natureza |
| GET | `/analytics/requerimentos-por-tipo-natureza?oidNatureza&dataInicial&dataFinal` | por tipo e mês |
| GET | `/analytics/requerimentos-pendentes-realizados?oidNatureza&oidTipoNatureza&dataInicial&dataFinal` | pendentes × realizados por mês |

**Acadêmico** — `SH/services/academico.service.ts`, `shared/services/menu.service.ts`, `shared/services/pessoa.service.ts`

| Método | Caminho | Uso |
|---|---|---|
| GET | `{API_REST_ACADEMICO}/api/aluno/search/cpf?term&projection=aluno-matricula-resumo` | aluno por CPF (`Unidade-Ref`) |
| GET | `{API_REST_ACADEMICO}/api/pessoa/search/pessoa-foto?cpfs` | fotos em lote (`Unidade-Ref`) |
| GET | `{ACADEMICO_ENDPOINT}/usuario/menus/{oidPessoa}/{APPLICATION_ID}` | menu antigo (não vi chamada) |
| GET | `{ACADEMICO_ENDPOINT}/pessoa/foto/{oid}` | foto antiga (não vi chamada) |

`WEBSOCKET_ENDPOINT` está no `environment`, sem uso em `src/app`.

### 5.2 Modelos principais

Todos em `core/model/protocolo.model.ts`, salvo indicação.

- **Linha de fila / requerimento detalhado** — `IRequerimentosInterface` (`:141-189`): `oid`, `numero`, `tipo` (tipo do despacho), `estado`, `data`, `dataSolicitacao`, `solicitacao`, `solicitacaoAbreviado`, `solicitanteRequerimento`, `cpfRequerente`, `modalidade`, `unidade`, `nomeUnidade`, `nivel`, `prazo`, `tempoDecorrido`, `destino`, `caminho`, `emEspera`, `encaminhado`, `anexos`, `foto`, `requerimento` (`IRequerimento`), `despacho` (`IDespacho`), `setorDestino`, `setorOrigem`, `setorPessoaOrigem`, `solicitante`, `aluno`, `unidadePessoaAluno`. Marcas postas pelo front: `saiuDoMeuSetor`, `minhaPauta`, `visualizado`, `continuar`, `isGerencial`, `buscaRequerimento`, `unidadeFuncionarioTratar`.
- **Requerimento** — `IRequerimento` (`:191-207`): `oid`, `numero`, `descricao`, `parecer`, `dataAbertura`, `estado`, `status`, `solicitado`, `urgente`, `oidMotivo`, `motivo { oid, status, descricao }`, `oidTipoNaturezaRequerimento`, `tipoNaturezaRequerimento`, `unidadePessoa`, `anexos`. A interface da caixa v2 (`core/interface/protocolo.interface.ts:101-117`) acrescenta `oidPessoa`, `oidUnidade`, `nome`, `cpf`, `realizado`.
- **Despacho** — `IDespacho` (`:257-273`): `oid`, `tipo`, `descricao`, `data`, `nivel`, `analisado`, `anexoDespachos`, `oidRequerimento`, `oidSetor`, `setor`, `oidSetorUnidadePessoa`, `setorUnidadePessoa`, `oidDespachoAnterior`, `despachoAnterior`, `status`.
- **Evento da linha do tempo** — `ITimeline` (`:291-298`): `descricao`, `tipoEvento`, `usuario`, `de`, `para`, `data`.
- **Natureza** — `INaturezas` (`:95-102`): `oid`, `descricao`, `status`, `tipo`, `quantidadeTipoRequerimento`, `quantidadeUnidadesEnvolvidas`.
- **Tipo de natureza** — `ITipoNatureza` (`:104-114`): `oid`, `status`, `descricao`, `nivel`, `maxSolicitacoes`, `observacao`, `oidNaturezaRequerimento`, `explicacao`, `prazo`.
- **Tipo de anexo / anexo exigido** — `ITipoAnexo` (`:116-129`): `oid`, `oidTipoAnexo`, `oidTipoNaturezaRequerimento`, `status`, `descricao`, `styleName`, `tipoAnexo { oid, descricao, … }`. **Anexo do requerimento** — `IAnexos` (`:405-417`): `oid`, `caminhoAnexo`, `oidRequerimento`, `oidTipoAnexo`, `tipoAnexo`.
- **Natureza × setor × unidade** — `ISetorNaturezaRequerimento` (`:131-139`): `oid`, `oidSetor`, `descricaoSetor`, `oidUnidade`, `nomeUnidade`, `oidNaturezaRequerimento`.
- **Setor** — `ISetores` (`:64-68`): `oid`, `status`, `descricao`. Nada mais.
- **Unidade** — `IUnidades` (`:70-76`): `oid`, `status`, `nome`, `modalidade`, `ead`.
- **Vínculo funcionário × setor × unidade** — `IUnidadePessoa` (`:225-249`): `oid`, `nivel`, `oidUnidadePessoa`, `oidPessoa`, `oidUnidade`, `perfis`, `modalidade`, `ead`, `nome`, `unidadePessoa { oid, perfis, oidPessoa, oidUnidade }`, `oidSetor`, `setor`. Na listagem de integrantes os campos usados são `nomeFuncionario`, `nivel`, `oidPessoa`, `oidSetorUnidadePessoa` (`:3-12`).
- **Funcionário** — `IFuncionarios` (`:78-93`): `oid`, `nome`, `cpf`, `telefones`, `perfis`, `oidUnidade`, `oidPessoa`, `nomeUnidade`, `nomePessoa`, `pessoa { nome, oid }`.
- **Favorito** — `IFavoritos` (`:327-333`): `oid`, `descricao`, `oidPessoa`, `oidSetor`, `status`. **Nota de despacho** — `INotasDespacho` (`:335-341`): `oid`, `descricao`, `oidDespacho`, `feito`, `status`.
- **Aluno (Acadêmico)** — `IAcademico` (`:363-373`): `matricula`, `curso`, `turno`, `periodoLetivo`, `intercambio`, `naturalidade`, `pessoa { nome, email, sexo, dataNascimento, estadoCivil, nacionalidade, raca, foto, … }`, `matriculas` (`data`, `turno`, `etapa`, `cr`, `ca`, `tac`). Os templates usam ainda `aluno.telefone[].formatado` e `aluno.telefones`, que não estão na interface.
- **Linha do Gerencial e da Pesquisa** — `IGerencial` (`core/model/gerencial.model.ts:2-22`): `oid`, `numero`, `cpf`, `oidpessoa`, `nomePessoa`, `oidunidade`, `nomeUnidade`, `modalidade`, `oidnatureza`, `descricaonatureza`, `oidtiponatureza`, `descricaotiponatureza`, `descricao`, `prazo`, `vencimento`, `foto`. Os templates usam ainda `setornome`, `unidadenome` e `requerimento.estado`, fora da interface.
- **Contagem anual** — `IGerencialCountYear` (`paginas/gerencial/gerencial/page/gerencia-interface.ts:1-3`): `ano`, `total`.
- **Sessão** — `State` de `auth` (`core/service/auth/store/auth.reducers.ts:6-12`): `usuario`, `unidades`, `unidadeSelecionada`, `token`, `authenticated`.

---

## 6. O que o código não responde

| # | Pergunta | Por que o front não responde | Quem provavelmente decide |
|---|---|---|---|
| 1 | O que cada nível (1, 2, 3) pode fazer, e o que "nível abaixo do meu" inclui? | O nível só é exibido, escolhido e enviado; nenhuma ação é bloqueada por ele na tela. A regra está no backend. | Gestão do Protocolo |
| 2 | Como o requerimento chega à caixa de alguém: pelo par setor × unidade da natureza, pelos funcionários vinculados ao tipo, pelo nível do tipo, ou pelos três? | Os três cadastros existem; a distribuição é toda do servidor. | Gestão do Protocolo |
| 3 | O prazo é em dias úteis ou corridos, de onde vem (natureza, tipo) e onde se cadastra? | O front recebe `prazo` e `tempoDecorrido` prontos e não tem campo de prazo em nenhum formulário, embora o modelo do tipo tenha `prazo`. | Gestão do Protocolo e TI (dono do backend) |
| 4 | Quem pode reabrir um requerimento concluído, e até quando? | "Reabrir" aparece para todos que veem a fila de Concluídos. | Gestão do Protocolo |
| 5 | Quem pode excluir setor, natureza e tipo de natureza, e o que acontece com os requerimentos que apontam para eles? | A tela só pede confirmação (o tipo nem isso). A referência do DS propõe arquivar em vez de excluir. | Gestão do Protocolo |
| 6 | Qual é o estado depois de "Tratar", "Encaminhar", "Responder" e "Reabrir"? Existe "aguardando aluno"? | O front só chama o endpoint; o estado novo vem do servidor. O selo "Resposta" existe, "aguardando aluno" não. | Gestão do Protocolo e TI (dono do backend) |
| 7 | O que é "em espera" (campo `emEspera`, KPI "REQUERIMENTOS EM ESPERA")? | Aparece no Analytics e no modelo, sem tela que o produza. | Gestão do Protocolo |
| 8 | O que significa natureza "interna" × "externa"? É o que decide se o aluno abre pelo portal? | É só um select no cadastro; nada no front muda por causa dele. | Gestão do Protocolo |
| 9 | O "máximo de solicitações" do tipo limita o quê: por aluno, por período, no total? Zero quer dizer sem limite? | É só um número gravado. | Gestão do Protocolo |
| 10 | O anexo marcado como exigido é mesmo obrigatório? Há limite de tipo e tamanho de arquivo? | A tela avisa "Anexo obrigatório *" mas deixa enviar; não há limite no front. | Gestão do Protocolo e TI |
| 11 | Qual é o significado de `oidMotivo = "2"`, fixo na abertura interna? Existem outros motivos? | Valor fixo no código; o modelo tem `motivo.descricao`. | TI (dono do backend) |
| 12 | Quem pode ver o Gerencial, o Analytics e a Pesquisa, que mostram requerimentos e dados de alunos de todos os setores e unidades? | Nenhuma rota checa perfil; depende só do item de menu. | Gestão do Protocolo e Encarregado de dados (LGPD) |
| 13 | Quem pode abrir requerimento em nome de outra pessoa, e o CPF digitado é conferido com o cadastro? | A tela aceita CPF e nome livres; o que o backend faz com eles não aparece. | Gestão do Protocolo |
| 14 | A resposta ao aluno chega a ele por qual canal (portal, e-mail)? E a nota de despacho, o aluno vê? | O front só grava; o rótulo "Nota" sugere uso interno. | Gestão do Protocolo |
| 15 | Deferido e Indeferido bastam como desfecho, ou existem outros (cancelado, arquivado, deferido em parte)? | Só há as duas opções fixas. | Gestão do Protocolo |
| 16 | A urgência muda alguma coisa além da bandeira (ordem da fila, prazo, aviso)? Quem pode marcá-la? | Qualquer um que veja a linha pode ligar e desligar; o front não reordena. | Gestão do Protocolo |
| 17 | A pessoa deve aparecer uma vez por setor ou uma vez por unidade? O nível por unidade é intencional? | O real é por unidade; a referência do DS propõe por pessoa. | Gestão do Protocolo |
| 18 | O que distingue as abas EAD e Presencial do Gerencial quando a unidade é híbrida ou semipresencial (`hibri01`, `semi01`)? | A aba manda só o rótulo como `modalidade`. | Gestão do Protocolo |
| 19 | Por que a unidade de referência é sempre `unid32` no login e no menu? A troca de unidade da moldura deveria funcionar? | `changeUnidade` é vazio e `unid32` é fixo. | TI (dono do SIGU / login central) |
| 20 | Capacidade, SLA alvo, responsável e distribuição automática por setor (tela `parametros-setores` da referência) existem em algum lugar do sistema atual? | Não há campo nem endpoint para eles neste front; o setor tem só nome. | Gestão do Protocolo |
| 21 | O requerimento deve ter endereço próprio (link que se manda a um colega)? | Hoje não tem: a tela de tratamento não leva identificador na URL. | TI e Encarregado de dados (LGPD) |
| 22 | O token do login é conferido pelo backend em cada chamada? | O front não o envia em cabeçalho algum que eu tenha achado; depende do pacote `default-style` ou de infraestrutura, não confirmados. | TI (segurança) |

