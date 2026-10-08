# Levantamento do secretaria-virtual-frontend (06/10/2026)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\secretaria-virtual-frontend`. Referências `arquivo:linha` relativas a `src/app/`. Angular 18.2, standalone, NgRx, Angular Material 18.2, `ngx-toastr` 19, lib `@universidade-candido-mendes/ucam-design-system ^0.0.54`. Produção: `secretaria-virtual.candidomendes.edu.br`; API `https://api-secretaria-virtual.candidomendes.edu.br`. O `README.md` e o nome do projeto no `angular.json` ainda são os do template.

## 1. Rotas e telas

| URL | Componente | Template | Guard |
|---|---|---|---|
| `login/:token/:usuario` | `LoadComponent` | `shared/components/load/load.component.html` | nenhum |
| `dashboard` | `DashboardComponent` | `private/dashboard/dashboard.component.html` | `AuthGuard` |
| `sala-de-matricula` | `SalaDeMatriculaComponent` | `private/sala-de-matricula/sala-de-matricula.component.html` | `AuthGuard` |
| `alocacao-de-alunos` | `AlocacaoDeAlunoComponent` | `private/alocacao-de-aluno/alocacao-de-aluno.component.html` | `AuthGuard` |
| `consulta-de-aluno` | `ConsultaDeAlunoComponent` | `private/consulta-de-aluno/consulta-de-aluno.component.html` | `AuthGuard` |
| `matricula-extensao` | `MatriculaExtensaoComponent` | `private/extensao/matricula-extensao/matricula-extensao.component.html` | `AuthGuard` |
| `**` | redireciona para `/dashboard` | — | `AuthGuard` |

O guard só verifica `state.authenticated` (`core/services/auth/auth-guard.service.ts:27-32`). Não há checagem de perfil nem de permissão por rota.

**Entrada por token** (`login/:token/:usuario`). Propósito: receber token e usuário do portal de login e abrir a sessão. Arquétipo: tela de carregamento. Peças: só um `<span class="loader">`. Classificação: **parcial** — base `portal/login` (autenticação); falta a tela de passagem "entrando…" com estado de erro (hoje, se o token falha, a tela fica girando).

**Dashboard**. Propósito: boas-vindas. Arquétipo: página vazia com cartão. Peças: `ucam-page`, um cartão com "Olá, seja bem vindo(a) a sala de matrícula" e "Escolha um menu e comece a utilizar a aplicação"; botões e tutorial comentados. Não tem item no menu; só se chega pelo redirecionamento. Classificação: **parcial** — `shell-aplicacao` + `empty-state`; nada falta.

**Sala de matrícula**. Propósito: listar candidatos de um período de ingresso, ver quem cumpriu contrato, documentos e pagamento, e gerar a matrícula de um deles. Arquétipo: listagem com indicadores, abas e ação sobre a linha selecionada.
- Peças: filtros na faixa (`ucam-select` Modalidade e Semestre, projetados em `[header]` do `ucam-page`); 4 indicadores em texto (Pendente, Confirmado, Aprovado, Matriculado); legenda de selos (Contrato assinado, Documentos enviados, Pagamento confirmado); `mat-tab-group` com "Candidatos (n)" e "Matrículados (n)"; controle segmentado por rádio (Pronto / Pendente / Todos); busca "Pesquisar candidato"; `mat-table`; `mat-paginator`; estado vazio ("Nenhuma pesquisa foi realizada." / "Nenhum resultado foi encontrado."); carregando ("Carregando dados"); botão "Gerar matrícula".
- Colunas (as duas abas): Nome (rádio + avatar + nome + "CPF: …"), Unidade/Polo, Curso, Forma de ingresso, Valor, Vencimento, e a última — "Processo de matrícula" (três selos ligados por traço: contrato, documentos, pagamento) na aba Candidatos; "Boleto" (PAGO / EM ABERTO) na aba Matriculados. A coluna `cpf` está declarada no template mas fora de `displayedColumns`.
- Classificação: **parcial** — padrão `listagem-crud`, base `isencao/fila`. Peças que servem: `data-table`, `tabs`, `segmented`, `stat`, `pagination`, `empty-state`, `select`. Falta: indicador de etapas compacto dentro da célula (três requisitos com estado feito/pendente) e seleção única por linha que habilita a ação do cabeçalho.

**Modal "Gerar matrícula" — pendências** (`sala-de-matricula-no-data.modal.html`, `SalaDeMatriculaNoDataModal`). Propósito: explicar por que o candidato ainda não pode ser matriculado. Arquétipo: diálogo informativo com lista de requisitos. Peças: três linhas (ícone, frase, selo Pronto/Pendente com `check_circle`/`cancel`), botão "Fechar". Classificação: **parcial** — `dialog` + `list-item` + `badge`; falta um padrão de "lista de requisitos" nomeado.

**Diálogo "Matricular candidato"** (`matricula-dialog/matricula-dialog.component.html`, 80vw × 80vh). Propósito: completar o cadastro da pessoa e gerar a matrícula. Arquétipo: formulário longo em abas dentro de diálogo.
- Cabeçalho: avatar, nome, CPF, unidade, curso, "{n}º período".
- Aba **Dados gerais** — Dados pessoais: `datanascimento` (Nascido em), `naturalidade`, `sexo`, `nacionalidade`, `raca`, `estadocivil`, `pai`, `mae`. Dados escolares: `nivel` (Nível de ensino), `estabelecimento` (autocomplete com busca remota), `escola` (Escola pública, interruptor), `anoconclusao` (máscara `9999`), `formacaptacao`.
- Aba **Documentos** — CPF: `numero`, `dataemissao`. Identidade: `numero`, `dataemissao`, `orgaoemissor`. Título de eleitor: `numeroinscricao`, `zona`, `secao`, `dataemissao`, `municipio`, `uf`. Certificado de reservista: `numero`, `categoria`, `orgaoexpeditor`, `dataemissao`.
- Aba **Endereço** — tabela: Logradouro, Número, Complemento, CEP, Bairro, Cidade, Estado, Correspondência (interruptor desabilitado), ações (editar, apagar); botão "Adicionar endereço".
- Aba **Contatos** — tabela: Tipo de contato, Número "(ddd) numero", ações; botão "Adicionar telefone".
- Aba **Isenções** (desabilitada sem disciplinas) — tabela: Disciplina, Status, Alteração.
- Rodapé: "Gerar matrícula", "cancelar".
- Classificação: **parcial** — padrão `formulario-entidade`, base `gerencial/usuario-form`. Peças: `tabs`, `field`, `select`, `combobox`, `switch`, `data-table`, `icon-button`. Falta: formulário com subtabelas editáveis (endereços, contatos) e a decisão de onde ele mora (diálogo grande, gaveta ou página).

**Diálogo "Adicionar endereço"** (`add-address-dialog.component.html`, 70vw × 60vh). Campos: `tipoendereco`, `correspondencia` (interruptor), `endereco.logradouro`, `numero`, `bairro`, `cidade`, `uf`, `cep`, `complemento`. Botões "Adicionar"/"Atualizar", "Cancelar". O título fica "Adicionar endereço" também na edição. Classificação: **parcial** — `dialog` + `formulario-entidade`; falta máscara de CEP na referência (o app não aplica nenhuma).

**Diálogo "Adicionar telefone"** (`add-phone-dialog.component.html`, 40vw × 40vh). Campos: `tipotelefone`, `ddd`, `numero`. Classificação: **parcial** — `dialog` + `field`.

**Alocar alunos**. Propósito: matricular em lote, nas disciplinas de uma turma, os alunos de um curso que ainda estão sem disciplina. Arquétipo: atribuição em lote (duas listas de marcação). Peças: `ucam-select` Semestre na faixa; `ucam-select` Curso e Turma; lista "Alunos" (caixa + nome); lista "Disciplinas" (caixa, descrição, "Código: …", "Vagas: restantes / total"); botão "Alocar alunos"; estados vazio e carregando. Sem tabela, sem paginação. Classificação: **falta** — não há padrão de atribuição em lote (escolher N de uma lista e M de outra, com contador de capacidade que muda conforme a seleção). Peças que existem: `checkbox`, `list-item`, `select`.

**Consulta de aluno**. Propósito: achar um aluno por nome ou CPF. Arquétipo: busca com resultado. Peças: cartão com `ucam-input` Nome e CPF (máscara `000.000.000-00`), botão "Pesquisar", `mat-table`, `mat-paginator` no cliente. Colunas: Nome (`nomealuno`), Matricula, CPF, Unidade (`nomeunidade`), Curso (`nomecurso`), Ano. Sem ação por linha. Classificação: **parcial** — padrão `consulta-relatorio`, base `relatorios/filtros` + `relatorios/resultado`; nada falta em peças.

**Matrícula Extensão**. Propósito: listar inscritos em cursos de extensão/pós por período de inscrição e aprovar ou matricular. Arquétipo: listagem com filtros dependentes e ação sobre a linha selecionada. Peças: `ucam-select` Modalidade na faixa; filtros Unidade, Tipo de Curso, Curso, Período de Inscrição, Situação; `mat-table` de largura fixa; `mat-paginator`; botões "Matricular" e "Aprovar". Colunas: seleção (rádio), Nome (CPF + nome), Curso (tipo + curso), Situação, Boleto Pago (mostra "--" fixo), Aceite Contrato (`dd/MM/yyyy HH:mm`). Classificação: **parcial** — padrão `listagem-crud`, base `isencao/fila`; falta o comportamento de filtros em cascata (cada filtro habilita o seguinte e limpa os de baixo).

**Diálogo "Aprovar Candidato"** (`aprovar-candidato-dialog.component.html`, 500px). Propósito: confirmar a aprovação de um inscrito de stricto sensu. Peças: avatar e nome; pares rótulo/valor (CPF, Tipo de Curso, Curso, Situação em selo, Aceite Contrato); botões "Aprovar"/"Aprovando..." e "Cancelar". Classificação: **parcial** — `dialog` + `description-list` + `badge`; o padrão `confirmacao-destrutiva` não serve como está, falta a variante de confirmação não destrutiva com resumo do item.

**Sem rota**: `UcamPaginatorDirective` (`shared/directives/ucam-paginator.directive.ts`) existe mas nenhum template a usa — **nao-migrar**.

## 2. Moldura e navegação

- Toda tela autenticada é embrulhada em `<ucam-page>` (`PageComponent` da lib), que traz cabeçalho, menu lateral e menu da conta. Conteúdo marcado com `header` é projetado na faixa: é assim que Modalidade e Semestre aparecem no cabeçalho.
- Menu: fixo no código, `MenuConfig` com `AppConfig({title: "Secretaria", subtitle: ""})` e quatro `MenuLink` — Sala de matrícula (`note_add`), Matrícula Extensão (`note_add`), Alocar alunos (`group_add`), Consulta de aluno (`search`) (`app.component.ts:35-62`). Entregue por `UcamDesignSystemService.setMenuConfig` (`:65`).
- Conta: `setProfile(UcamUserProfile{username, email, unidade, unidades})` (`app.component.ts:64`, `shared/service/user.service.ts:56-69`).
- Troca de unidade: feita no menu da conta da lib; as telas escutam `ChangeUnidadeListener.getInstance().addListener(...)` e despacham `ChangeUnidade` para o store, que grava em `localStorage['AuthState']` (`sala-de-matricula.component.ts:109,178-184`; `auth.reducers.ts`, caso `CHANGE_UNIDADE`, que nesta cópia também dispara `StorageEvent`).
- Sair: `ExitListener.getInstance().addListener(() => dispatch(Logout))` (`app.component.ts:67-69`); o efeito limpa o `localStorage` e manda para `LOGIN_URL`.
- Login: `login/:token/:usuario` → `TryTokenLogin` → três GETs em `API_MENU` → `Login` → navega para `''` (`shared/components/load/load.component.ts:35-56`).
- Carregando global: `app-loading` (próprio) com "Aguarde enquanto estamos processando..." comandado por `LoadingService` com contador de chamadas.
- Aviso: `ngx-toastr` com componente próprio `TemplateToastrUcamComponent` (barra vertical, título, mensagem, fechar, barra de progresso que pausa no hover).

## 3. Peças usadas com contagem

**Da lib do time (`^0.0.54`)**

| Peça | Usos | Props que os templates passam |
|---|---|---|
| `ucam-page` | 5 | nenhuma; projeção por `[header]` em 3 telas |
| `ucam-input` | 30 | `label` (30), `formControlName` (30), `style` de largura (8), `[class.required-field]` (4), `mask` (2: `9999`, `000.000.000-00`), `type="numeric"` (1) |
| `ucam-select` | 22 | `label`, `[options]`, `formControlName` (22 cada), `style` (11), `class="inline"` ou `col-N` (10), `[placeholder]` (6), `[class.required-field]` (6), `[disabled]` (2) |
| `UcamOption` | 4 arquivos | `{id, label, value, valid}` |
| `UcamDesignSystemService` | 3 arquivos | `setProfile`, `setMenuConfig` |
| `MenuConfig`, `AppConfig`, `MenuLink` | 1 | `title`, `subtitle`, `icon`, `label`, `address` |
| `UcamUserProfile` | 1 | `username`, `email`, `unidade`, `unidades` |
| `ChangeUnidadeListener` | 3 telas | `getInstance().addListener` |
| `ExitListener` | 1 | `getInstance().addListener` |
| `MaskDirective` | importada em 1 | usada via `mask` do `ucam-input` |

Estilos da lib: nenhum importado. `styles.scss` (686 linhas) só usa `@angular/material` e define no próprio app o visual de `input[ucam]` (texto, caixa, rádio e as variantes `[switch]`), dos botões, do overlay e do toast. Ou seja, `input ucam` e `input ucam switch` **não vêm da lib**.

**Angular Material direto**: `mat-table` 7 tabelas / 45 `matColumnDef`; `mat-paginator` 4; `mat-tab-group` 2 / `mat-tab` 7; `MatDialog` 5 diálogos; `mat-flat-button` 13, `mat-button` 5, `mat-mini-fab` 4; `mat-icon` 10; `mat-autocomplete` 1 / `mat-option` 2. Módulos importados sem uso no template: `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`.

**Próprio do app**: `input ucam` 10 (rádio, caixa, texto) e `ucam switch` em 5 lugares; `CpfPipe`; `app-loading`; toast próprio; pipes `currency` e `date`; `getPortuguesePaginatorIntl`.

**O que fazem com Material por a lib não oferecer** (na versão instalada): tabela, paginação, abas, diálogo, botão, ícone, autocomplete. E com CSS próprio: caixa, rádio, interruptor, segmentado, selo, indicador, estado vazio, carregando, toast.

**Bibliotecas**: `@angular/*` 18.2, `@angular/material`/`cdk` 18.2.6, `@ngrx/store`/`effects` 18.1, `ngx-toastr` 19.1, `rxjs` 7.8. Fontes: Inter, Nunito, Material Icons.

## 4. Regras de negócio lidas no código

| # | Regra | Onde | Tipo | Valores |
|---|---|---|---|---|
| 1 | A sessão abre com token e usuário recebidos na URL; o app busca usuário, unidades e pessoa na API gerencial | `shared/components/load/load.component.ts:45-55`; `core/services/auth/store/auth.effects.ts:≈20-90` | integração | header `Unidade-Ref: unid01`; unidades com `size=1000` |
| 2 | A unidade ativa ao entrar é a primeira da lista do usuário | `auth.effects.ts:≈70` | permissão | `unidadesUsuarios[0]` |
| 3 | Sem sessão, qualquer rota privada manda para o portal de login | `core/services/auth/auth-guard.service.ts:28-30`; `auth.effects.ts:≈95-100` | permissão | `LOGIN_URL` com `client_id` |
| 4 | Sair limpa todo o armazenamento local e volta ao portal | `app.component.ts:67-69`; `auth.reducers.ts` caso LOGOUT | permissão | `localStorage.clear()` |
| 5 | O menu é o mesmo para todo usuário; não há menu por permissão | `app.component.ts:35-62` | permissão | 4 itens fixos; `CoreService.getMenuAplicacao` existe e não é chamado |
| 6 | Toda chamada leva a unidade ativa e o token | `shared/service/sala-de-matricula.service.ts:205-210` | integração | headers `oidunidade`, `Authorization: Bearer` |
| 7 | Modalidades da sala de matrícula | `private/sala-de-matricula/sala-de-matricula.component.ts:76-80,113` | formato | `EAD`, `PRESENCIAL`, `SEMIPRESENCIAL`; padrão Presencial |
| 8 | No EAD o período mostra a captação; nas demais só ano/semestre, sem repetição | `sala-de-matricula.component.ts:326-344` | formato | `ano/semestre (captacao)` × `ano/semestre` |
| 9 | O período mais recente da lista já vem escolhido | `sala-de-matricula.component.ts:347` | formato | `data[0]` |
| 10 | Captação só entra na consulta quando a modalidade não é presencial | `sala-de-matricula.service.ts:66-68,81-83,195-197` | integração | `&captacao=` |
| 11 | A lista abre mostrando só candidatos prontos | `sala-de-matricula.component.html:75-77`; `.ts:72` | formato | `status`: `TRUE` (Pronto, padrão), `FALSE` (Pendente), `null` (Todos) |
| 12 | A busca dispara 2 segundos depois de parar de digitar | `sala-de-matricula.component.ts:311-314` | prazo | 2000 ms |
| 13 | Paginação de 10 por página, sem escolha de tamanho | `sala-de-matricula.component.ts:52-57` | limite | 10; opções 5/10/25 ocultas |
| 14 | O boleto é "PAGO" quando há pagamento, senão "EM ABERTO" | `sala-de-matricula.component.ts:271,300` | cálculo | `!!pago` |
| 15 | Só se matricula um candidato por vez, e o botão exige um selecionado | `sala-de-matricula.component.html:15,90,146` | validação | seleção única |
| 16 | Candidato "válido" abre o formulário de matrícula; inválido abre a lista de pendências | `sala-de-matricula.component.ts:149-156` | transição de situação | campo `valid` vindo da API |
| 17 | Os três requisitos de matrícula são contrato assinado, documentos enviados e primeira mensalidade paga | `sala-de-matricula-no-data.modal.html:109-130` | validação | "Possui/Não possui o contrato assinado.", "Realizou/Não realizou o envio dos documentos.", "Realizou/Não realizou o pagamento."; selo "Pronto"/"Pendente" |
| 18 | Quatro contadores por período | `sala-de-matricula.component.ts:88-93`; `.html:21-38` | cálculo | Pendente, Confirmado, Aprovado, Matriculado; "-" antes de carregar |
| 19 | A aba de matriculados filtra pela situação MATRICULADO | `sala-de-matricula.service.ts:79` | transição de situação | `situacao=MATRICULADO` |
| 20 | Campos obrigatórios da matrícula | `matricula-dialog/matricula-dialog.component.ts:70-84` | validação | `estabelecimento`, `nivel`, `anoconclusao`, `formacaptacao`, `datanascimento`, `naturalidade`, `sexo`, `nacionalidade`, `raca`, `estadocivil`, `mae`; opcionais `pai`, `escola` |
| 21 | Faltando obrigatório, não envia e avisa | `matricula-dialog.component.ts:379-395` | validação | toast "Campos obrigatórios não preenchidos" / "Atenção", 5000 ms |
| 22 | A escola de origem tem de ser escolhida da lista; texto solto é apagado ao sair do campo | `matricula-dialog.component.ts:321-322,345-353`; `.html:88-90` | validação | busca a partir de 2 caracteres; `Não há resultados para "…"` |
| 23 | Ano de conclusão tem 4 dígitos | `matricula-dialog.component.html:100` | formato | máscara `9999` |
| 24 | Dado vindo do cadastro só preenche campo vazio | `matricula-dialog.component.ts:481-487` | formato | — |
| 25 | Documentos são reconhecidos pela descrição | `matricula-dialog.component.ts:424-451,548-562` | integração | lê `cpf`, `identidade`, `titulo`, `certificado`; envia `identidade`, `cpf`, `titulo`, `reservista` |
| 26 | Matrícula feita mostra o número, fecha o diálogo e recarrega lista e contadores | `matricula-dialog.component.ts:234-244`; `sala-de-matricula.component.ts:132-138,166-176` | transição de situação | toast `Aluno matriculado: {matricula}` / "Sucesso", 10000 ms |
| 27 | Erro na matrícula mostra a mensagem do servidor | `matricula-dialog.component.ts:246-254` | integração | título "Erro ao matricular" |
| 28 | A matriz curricular vem da análise de isenção; sem isenção, usa a primeira matriz do curso no período | `matricula-dialog.component.ts:466-477` | integração | `matrizunidadecurso` ou `[0].oidmatrizunidadecurso` |
| 29 | A isenção é consultada na API do vestibular da praça da unidade | `shared/service/isencao.service.ts:19-26` | integração | `polo*`, `semi*`, `hibri*`, `unid32` → EAD; `unid01` → Campos; demais → Rio |
| 30 | A aba Isenções só abre quando há disciplina | `matricula-dialog.component.html:273,289` | permissão | padrão da coluna: "Nenhuma alteração necessária" |
| 31 | Apagar endereço ou telefone é imediato, sem confirmação | `matricula-dialog.component.ts:363-377` | transição de situação | — |
| 32 | Endereço e telefone não têm campo obrigatório nem máscara | `matricula-dialog.component.ts:617-631,705-710` | validação | nenhum validador |
| 33 | Na alocação, a modalidade é deduzida da unidade | `private/alocacao-de-aluno/alocacao-de-aluno.component.ts:171` | cálculo | `oidUnidade` contém `polo` → EAD; senão PRESENCIAL |
| 34 | Semestre → curso → turma → disciplinas; trocar um nível limpa os de baixo | `alocacao-de-aluno.component.ts:178-235,253-296` | validação | — |
| 35 | Rótulo do curso e turnos | `alocacao-de-aluno.component.ts:60,190-194` | formato | `[matriz] nome (turno)`; `M` Manhã, `N` Noite, `I` Integral |
| 36 | Só aparecem alunos sem disciplina | `shared/service/alocacao-de-alunos.service.ts:36` | permissão | `/alunos-sem-disciplina` |
| 37 | Vagas restantes = vagas − matriculados, nunca abaixo de zero | `alocacao-de-aluno.component.ts:228-231` | cálculo | campo `maticulados` (grafia da API) |
| 38 | Uma disciplina só pode ser marcada se couberem todos os alunos selecionados | `alocacao-de-aluno.component.ts:106-116` | limite | `vagasRestantes >= alunosSelecionados.length` |
| 39 | Marcar aluno com disciplina sem vaga gera erro | `alocacao-de-aluno.component.ts:101` | limite | `A disciplina {descricao} não tem mais vagas.` (só `throw`, sem aviso na tela) |
| 40 | Alocar exige turma, semestre, curso, ao menos uma disciplina e um aluno | `alocacao-de-aluno.component.ts:122-130` | validação | — |
| 41 | A alocação registra quem fez; a tela não mostra sucesso nem erro | `alocacao-de-alunos.service.ts:60-67`; `alocacao-de-aluno.component.ts:141` | integração | header `Oidusuario` |
| 42 | Nome na consulta tem no mínimo 3 letras | `private/consulta-de-aluno/consulta-de-aluno.component.ts:60`; `.html:14` | validação | "Digite um nome com pelo menos 3 letras." |
| 43 | CPF na consulta tem 11 dígitos | `consulta-de-aluno.component.ts:61`; `.html:19,26` | validação | máscara `000.000.000-00`; "CPF inválido." (sem dígito verificador) |
| 44 | A consulta exige nome ou CPF | `consulta-de-aluno.component.ts:88-91`; `.html:32` | validação | — |
| 45 | Resultado da consulta paginado no navegador | `consulta-de-aluno.component.html:73` | limite | 15, 30, 100 |
| 46 | Situações do inscrito de extensão | `shared/models/matricula-extensao.model.ts:1-6`; `matricula-extensao.component.ts:93-98` | transição de situação | `PENDENTE`, `CONFIRMADO`, `APROVADO`, `MATRICULADO`; filtro `TODAS` = `%` |
| 47 | Modalidade → unidade → tipo de curso → curso → período → situação; cada escolha limpa as seguintes | `matricula-extensao.component.ts:111-218`; `.html:48,56` | validação | modalidade padrão `PRESENCIAL` |
| 48 | Ao escolher o período, a situação vira "TODAS" e a lista carrega | `matricula-extensao.component.ts:178-190` | formato | — |
| 49 | Só aparecem os 5 períodos de inscrição mais recentes | `shared/service/matricula-extensao.service.ts:65-75`; `matricula-extensao.component.ts:288-295` | limite | `limit=5`; rótulo `dd/mm/aaaa à dd/mm/aaaa (descricao)` |
| 50 | Inscrito já matriculado não pode ser selecionado | `matricula-extensao.component.html:84` | permissão | — |
| 51 | Para matricular: não estar matriculado, ter aceite de contrato e estar CONFIRMADO — ou APROVADO, se o curso for de mestrado/doutorado | `matricula-extensao.component.ts:358-381` | transição de situação | `oidtipocurso === '04'` exige `APROVADO` |
| 52 | Só se aprova inscrito CONFIRMADO de mestrado/doutorado | `matricula-extensao.component.ts:383-393` | transição de situação | `oidtipocurso === '04'` |
| 53 | Aprovar pede confirmação e avisa o resultado | `matricula-extensao.service.ts:96-107`; `matricula-extensao.component.ts:405-417`; `aprovar-candidato-dialog.component.ts:47-57` | transição de situação | "Candidato aprovado com sucesso"; erro: mensagem do servidor ou "Erro ao aprovar candidato" |
| 54 | Matricular na extensão não está implementado | `matricula-extensao.component.ts:353-356` | integração | `// TODO`, só `console.log` |
| 55 | A coluna "Boleto Pago" não mostra o dado | `matricula-extensao.component.html:122-123` | formato | "--" fixo |
| 56 | Avisos somem em 7 segundos, no canto superior direito | `app.config.ts:34-43` | prazo | 7000 ms |
| 57 | Trocar de unidade grava a nova unidade na sessão | `sala-de-matricula.component.ts:178-184` | permissão | `ChangeUnidade` |
| 58 | Moeda e datas em português do Brasil | `app.config.ts:30-32` | formato | `LOCALE_ID` `pt`, `BRL`, `dd/MM/yyyy` |

## 5. API consumida

Base `BACKEND` = `https://api-secretaria-virtual.candidomendes.edu.br`. Headers `oidunidade` e `Authorization: Bearer`.

**SalaDeMatriculaService** (`/v1/sala-de-matricula`): `GET /periodo-ingresso`; `GET /ingressantes/{ano}/{semestre}` (sem uso); `GET /ingressantes/{modalidade}/{ano}/{semestre}?paged=true&page&size[&search][&status][&captacao]`; idem com `situacao=MATRICULADO`; `GET /ingressante/{oidformaingressopessoa}`; `GET /dominio/{sexo|uf|vigencia-captacao|forma-captacao|tipo-documento-escaneado|nivel-ensino|tipo-contato|tipo-endereco|raca|estado-civil|nacionalidade}`; `GET /estabelecimento-de-ensino?s=`; `POST|PUT|DELETE /telefone[/{oid}]`; `POST|PUT|DELETE /pessoa-endereco[/{oid}]`; `POST /matricular`; `GET /matriz-curricular/{oidperiodounidadecurso}`; `GET /kpi?ano&semestre&modalidade[&captacao]`.

**ConsultaDeAlunoService**: `GET /v1/sala-de-matricula/alunos?cpf&nome`.

**AlocacaoDeAlunoService** (`/v1/alocar-aluno`): `GET /periodo-ingresso`; `GET /periodo-ingresso/{oid}/cursos`; `GET /periodo-unidade-curso/{oid}/matriz/{oidmatriz}/alunos-sem-disciplina`; `GET /periodo-ingresso/{oid}/unidadecurso/{uc}/matriz/{m}/turmas`; `GET …/disciplinas?turma=`; `POST /matricular-alunos` (header `Oidusuario`).

**MatriculaExtensaoService** (`/v1/matricula-extensao`): `GET /unidades/{modalidade}`; `GET /tipos-curso`; `GET /unidades/{u}/tipos-curso/{t}/cursos`; `GET …/cursos/{c}/periodos?limit=5`; `GET /periodos/{p}/inscritos?situacao&paged=true&page&size`; `POST /inscrito/{oid}/aprovar-stricto-sensu`.

**IsencaoService**: `GET {VESTIBULAR_ONLINE.EAD|RIO|CAMPOS}/isencao/{oidformaingressopessoa}`.

**Autenticação** (`API_MENU` = `https://api-gerencial.ucam-campos.br`): `GET /usuario/{oid}`; `GET /unidadeUsuario/search/usuario?oidusuario&size=1000`; `GET /usuario/{oid}/pessoa`. Sem uso: `GET /menu-usuarios/search/all-menu-aplicacao-usuario`, `GET {API_REST}/unidade/search/all`.

**Modelos**
- `FormaIngressoPessoa`: `datapagamento`, `datavencimento`, `bolsasocial`, `pago`, `inscricao`, `linkcobranca`, `valorliquido`, `rendafamiliar`, `formaingresso`, `matricula`, `semestre`, `nomeunidade`, `oidunidade`, `nomecurso`, `periodocaptacao`, `oidperiodounidadecurso`, `oidformaingressopessoa`, `cpf`, `nomecandidato`, `sexo`, `datanascimento`, `boleto`, `documentos`, `contratoassinado`, `primeiramensalidade`, `valid`.
- `Pessoa`: `oid`, `nome`, `email`, `datanascimento`, `sexo`, `naturalidade`, `mae`, `pai`, `tutor`, `foto`, `status`, `estadocivil{oid,descricao,status}`, `nacionalidade{oid,status,descricao,sigla}`, `raca{…}`, `documentosCollection[{oid,descricao,numero,dataemissao,orgaoemissor,zona,secao,municipio,uf,categoria,…}]`, `pessoaenderecoCollection[]`, `telefoneCollection[]`.
- `AlunoMatriculadoResponse`: `oid`, `matricula`, `turno`, `status`, `observacao`, `escolapublica`, `intercambio`, `oidperiodoingresso`, `oidperiodoreabertura`, `oidformaingresso`, `formacaptacao`.
- `InscritoExtensaoProjection`: `oid`, `situacao`, `cpf`, `nome`, `datanascimento`, `detalhecurso`, `datahoraaceitecontrato`, `boletopago`, `oidtipocurso`, `tipocurso`, `curso`.
- `AlunoDTO`: `ano`, `cpf`, `ord`, `nomeunidade`, `modalidade`, `nomecurso`, `matricula`, `nomealuno`.
- Corpo de `POST /matricular`: `{pessoa{oid,nome,email,sexo,naturalidade,pai,mae,datanascimento,estadocivil,nacionalidade,raca,documentosCollection[4]}, dadosescolares{anoconclusao,nivel,oidestabelecimentoensino}, oidformaingressopessoa, oidmatrizunidadecurso}`.

## 6. O que o código não responde

1. O que torna um candidato "válido" para matrícula (o campo `valid` vem pronto da API)? Os três requisitos são sempre obrigatórios ou variam por forma de ingresso ou bolsa? — coordenação da secretaria acadêmica.
2. O que significam Pendente, Confirmado e Aprovado nos contadores da graduação, e como se relacionam com o filtro Pronto/Pendente? — secretaria acadêmica.
3. Quem pode matricular, alocar e aprovar? Hoje qualquer usuário autenticado vê os quatro menus. — gestão de acessos (TI) com a secretaria.
4. Tipo de curso `'04'` é só mestrado/doutorado? Outros tipos de pós exigem aprovação? — coordenação de pós-graduação.
5. Como será a matrícula de extensão (botão existe, ação não)? Depende do boleto pago? — coordenação de extensão e financeiro.
6. Na alocação, pode-se alocar aluno em disciplinas de turmas diferentes? O que acontece com quem já tem parte das disciplinas? — secretaria acadêmica.
7. Apagar endereço/telefone do cadastro da pessoa durante a matrícula é permitido sem confirmação nem registro? — secretaria acadêmica e proteção de dados.
8. Os dados de documentos (identidade, título, reservista) são opcionais mesmo? — secretaria acadêmica.
9. A descrição do certificado é `certificado` ou `reservista`? O app lê uma e grava a outra. — time de backend.
10. Unidades `unid32`, `semi*`, `hibri*`: qual a regra de praça para a consulta de isenção? — TI.

## Limites da leitura

- `node_modules` não existe em nenhum dos três clones. O interior da lib nas versões instaladas (`^0.0.31`, `^0.0.54`, `^18.2.2`) é **não confirmado**. O clone local `UCAM-repos\lib-ucam-workspace` está na versão `22.2.0` (um commit só, 01/10/2026) e serviu apenas de referência para nomes de props.
- Lidos por inteiro: todos os `.ts` não-spec e `.html` de `src/app` dos três repositórios, exceto `principia-sincronizacao-pendentes.component.ts` (1093 linhas), lido por assinaturas de método, condições e mensagens, e os serviços/componentes compartilhados do financeiro (`calendar`, `select`, `toast.service`, `notification.service`, `sse.service`, `server-sent-events.service`, `ucam-paginator.directive`), lidos por seletor, entradas e constantes. Os `.scss` não foram lidos, só consultados por seletor.
