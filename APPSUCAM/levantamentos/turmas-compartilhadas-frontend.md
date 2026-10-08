# Inventário do front-end de Turmas Compartilhadas (Angular 9)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\turmas-compartilhadas-frontend`
Lido em 06/10/2026: todo `src/app` (templates, componentes, serviços, guard, store, rotas), `environments/environment.ts`, `package.json` e README. Caminhos abaixo são relativos a `src/app`.

README (inteiro): "Aplicação Angular para controle de turmas no Moodle." O título dado à aplicação na moldura é "Controle de Turmas do AVA" (`app.component.ts:64`).

Stack: Angular 9.1.12, Angular Material 9.2.4, ngrx 9.2, `ucam-material` 0.0.910-alpha.43, `default-style` 0.0.910-alpha.20-test-9, Highcharts 8.1.2 e `highcharts-angular` 2.7 (declaradas no `package.json`; nenhum `<highcharts-chart>` nos templates), `file-saver` 2.0.2.

## 1. Rotas e telas

### 1.1 Tabela de rotas (`app-routing.module.ts`)

| URL | Componente | Template | Guard |
|---|---|---|---|
| `login/:token/:user/:unidade` | `LoginComponent` | `shared/components/login/login.component.html` | nenhum |
| `''` | redireciona para `cadastro` | — | `AuthGuard` |
| `home` | redireciona para `cadastro` | — | `AuthGuard` |
| `cadastro` | `CadastroComponent` | `pages/cadastro/views/cadastro.component.html` | `AuthGuard` |
| `analise` | `AnaliseComponent` | `pages/analise/views/analise.component.html` | `AuthGuard` |
| `balanco` | `BalancoComponent` | `pages/balanco/views/balanco.component.html` | `AuthGuard` |

### 1.2 Cadastro — Turma Compartilhada (`/cadastro`)

**Propósito.** Buscar uma turma do AVA (Moodle) por nome dentro de um período letivo, unidade e curso, e ver, incluir ou remover as turmas do SIGU compartilhadas nela; criar a turma AVA quando a busca não acha.

**Arquétipo.** Busca centralizada que vira lista mestre e lista dependente (mestre-detalhe empilhado): a tela nasce com a busca ocupando 60% da altura e encolhe para 25% depois da primeira pesquisa.

**Peças.**
- Cabeçalho da página com ícone e título "Cadastro - Turma Compartilhada".
- Campo de busca (`app-input-search`, placeholder "Digite para procurar...").
- Três filtros em botão-menu (`app-dropdown-selector`): **Período Letivo** (rótulo `ano.semestre`), **Unidade**, **Curso**. Um quarto, "Grade", está comentado.
- Aviso em snackbar na primeira digitação.
- Contador de resultados ("N resultado(s) encontrado(s).").
- Tabela 1 dentro de cartão `app-box` "Turmas do AVA" (`table-cadastro-one`), linha selecionável.
- Botão "Criar uma disciplina AVA "<termo>"" no canto do cartão.
- Contador "N turma(s) cadastrada(s)." e botão "Compartilhar nova disciplina" (desabilitado sem turma AVA selecionada).
- Tabela 2 em `app-box` "Turmas SIGU contidas na Turma AVA '<descrição>'" (`table-cadastro-two`), com remoção por linha.
- Estado vazio: "Nenhum resultado encontrado para a sua pesquisa. Mas você ainda pode:" + "Criar uma disciplina AVA "<termo>"" + "Tentar outra pesquisa".
- Estado de carga: `mat-progress-spinner`.

**Tabela 1 — Turmas do AVA** (`table-cadastro-one.component.ts:13`): Código AVA (com selo de visto e dica "Turma migrada do AVA" quando `is_migrada_AVA`), Turma AVA (nome + "Turma AVA - EDITAR"), Professor ("Não definido" na falta), Tempo de Aula (dia da semana e intervalo; "Não definido"), Unidade/Polos (nomes separados por vírgula), Turmas / QTD. ALUNOS (`quantidade_turmas / quantidade_alunos`). Sem paginação nem ordenação.

**Tabela 2 — Turmas SIGU contidas** (`table-cadastro-two.component.ts:29`): Código Sigu, Disciplina (nome + professor), Curso / Turno, Tempo de Aula, Unidade / Polo, Qtd. Alunos, Turma Conjunto, Período Ofertado (`N˚P`), Código AVA (etiqueta azul), coluna de ação com "X" (remover).

**Classificação: parcial.** Base: padrão `listagem-inspetor` (lista com painel dependente do item selecionado) e a tela `gerencial/grupo-menu`; a tabela mestre usa `data-table`, os filtros `select`/`combobox`, o vazio `empty-state`. Falta: a variação em que o dependente é uma segunda tabela abaixo (e não painel lateral), e o estado inicial "só busca" que ocupa a tela antes da primeira pesquisa.

### 1.3 Diálogo "Cadastrar turma AVA." (`NovaDisciplinaComponent`, 800px, não fecha por clique fora)

**Propósito.** Criar uma turma AVA com o nome digitado na busca, no período letivo já escolhido.

**Arquétipo.** Diálogo de formulário curto em dois passos (formulário, depois aviso de continuação).

**Peças.** Cabeçalho em duas metades (título "Cadastrar turma AVA." / "Preencha os dados para criar" e, à direita, prévia "Nova turma AVA" com o nome digitado e o rótulo "TURMA AVA"). Campos: **Período Letivo** (somente leitura, `ano.semestre`), **Nome da turma** (`nome`). Botões "Fechar" e "Criar turma AVA". Segundo passo: "Quase lá!" / "Agora você precisa adicionar turmas do SIGU à esta Turma AVA." + "Prosseguir", que abre o diálogo de compartilhar sem botão de fechar.

**Classificação: parcial.** Base: `dialog` + `formulario-entidade` (referência `protocolo/natureza-form`). Falta: nada de peça; a prévia ao vivo do registro no cabeçalho do diálogo não tem contrato.

### 1.4 Diálogo "Compartilhar uma disciplina." (`ShareDisciplinaComponent`, 90vw × 80vh)

**Propósito.** Escolher uma turma do SIGU (por período, unidade, curso e disciplina) e incluí-la na turma AVA selecionada.

**Arquétipo.** Diálogo de seleção em cascata com confirmação por tabela de uma linha.

**Peças.** Cabeçalho com a turma AVA selecionada (código, nome, "TURMA AVA"). Quatro `ucam-material-select` em cascata: **Período Letivo** (`formControlName="modalidade"`), **Unidade** (`unidade`), **Curso** (`curso`), **Descrição da disciplina** (`disciplina`, rótulo `código - descrição (turno)`); "Grade" comentado. Tabela de conferência com a turma escolhida: Código Sigu, Disciplina (+ professor), Curso / Turno, Qtd. Alunos, Dia / Horário, Período (`N˚P`). Botões "Fechar" (oculto quando vem do fluxo de criação) e "Adicionar esta disciplina" (desabilitado sem linha selecionada). Resultado em `AlertDialogComponent`.

**Classificação: parcial.** Base: `dialog` + `select` em cascata + `data-table`. Falta: padrão de "seletor em cascata dentro de diálogo" com linha de conferência.

### 1.5 Diálogo "Modificar turma AVA." (`EditAvaDisciplineComponent`)

**Propósito.** Renomear a turma AVA. Aberto pelo "EDITAR" da tabela em `/cadastro` e em `/analise`.

**Peças.** Mesmo cabeçalho em duas metades ("Modificar turma AVA." / "Preencha os dados para alterar"; prévia "Alterar turma AVA"). Campo **Novo nome da Turma AVA** (`nome`). Botões "Cancelar" e "Salvar alterações".

**Classificação: parcial.** Base: `dialog` + `text-field`.

### 1.6 Diálogo "Tem certeza?" (`RemoveSharedDisciplinaComponent`, 640px)

**Propósito.** Confirmar a remoção de uma turma SIGU da turma AVA.

**Peças.** Texto "Você tem certeza de que deseja remover a Turma SIGU "<disciplina(código)>"?" (no código está grafado "Vocë"), botões "Remover" (hover vermelho) e "Cancelar"; estado "Aguarde..." com spinner durante a chamada.

**Classificação: coberta pelo padrão** `confirmacao-destrutiva` (não há tela de referência do mesmo sistema; como classificação formal, **parcial**). O diálogo nomeia o item; não diz o que se perde.

### 1.7 Diálogo "Atenção!" (`AlertDialogComponent`)

Mensagem única (`data.message`) e botão "Ok". Usado para sucesso e erro do compartilhamento e erro da edição. **Parcial**: base `dialog`/`alert`.

### 1.8 Análise — Turma Compartilhada (`/analise`)

**Propósito.** Ver, por período letivo, todas as turmas AVA com suas turmas SIGU, com três contadores no topo e exportação.

**Arquétipo.** Painel leve: faixa de indicadores + tabela paginada com linha expansível.

**Anatomia do painel.**
- **Recorte:** só período letivo (`app-dropdown-selector`; unidade, curso e grade estão comentados). Busca por nome da turma.
- **Indicadores (3)**, todos contagem simples, sem meta e sem comparação com período anterior (`app-kpi`, só título e valor): "Turmas SIGU compartilhadas", "Turmas SIGU sem compartilhamento", "Turmas AVA". O template do cartão traz o comentário "vai ter porcentagens?" e um "Ver mais" opcional que nenhuma tela usa.
- **Gráficos:** nenhum.
- **Tabela** `app-box` "Turmas do AVA" (`table-analise-one.component.ts:37`): Código AVA (selo "Turma migrada do AVA"), Turma AVA (+ "EDITAR"), Unidade, Professor, Tempo de Aula, Turmas / QTD. Alunos, botão "Ver mais"/"Ver menos".
- **Drill-down:** linha expande para uma subtabela (`:38`): Código Sigu, Disciplina (+ professor), Curso / Turno, Tempo de Aula, Unidade / Polo, Qtd.Alunos, Turma Conjunto, Período Ofertado, Código AVA.
- **Paginação** no servidor, tamanhos 20, 50, 100, com primeiro/último.
- **Exportar** (`Dados.xls`), rótulo vira "Aguarde..." enquanto baixa; só aparece com total > 0.
- **Vazio:** "Não há turmas cadastradas ainda. Navegue para a seção de cadastro e crie turmas compartildas." (grafia do código).
- Sem totais.

**Classificação: parcial.** Base: `painel-indicadores` (referência `gerencial/inicio`) para a faixa de `stat`, e `consulta-relatorio` (`relatorios/resultado`) para tabela com exportar. Falta: linha expansível com subtabela no `data-table` (não confirmado se o contrato atual cobre).

### 1.9 Análise — Turmas Gerais (`/balanco`, menu "Balanço")

**Propósito.** Listar todas as disciplinas EAD do período com quantidade de alunos, cursos, professores e se já foram migradas para o AVA.

**Arquétipo.** Listagem de consulta com destaque por limite e detalhe em diálogo. Sem indicadores (o componente declara `KPIsValues` mas o template não mostra cartões).

**Peças.** Recorte por **Período Letivo**; busca livre (`searchTerm`); botão "Exportar" (`Balanço.xls`); tabela `app-box` "Turmas <ano>.<semestre>"; paginação 50, 100, 200.

**Colunas** (`table-balanco-one.component.ts:38`): faixa de destaque (pintada quando alunos > 80), Código Disciplina, Disciplina (descrição + "N UNIDADES"), Qtde. Aluno (com marcador de destaque quando > 80), Cursos ("N curso(s)"), Professor (foto + nome quando é um; "+N" e "Professores" quando são vários; "Não definido"), Migrado (célula verde com visto para "Sim", vermelha com X para "Não"). Linha inteira clicável.

**Classificação: parcial.** Base: `consulta-relatorio` (`relatorios/resultado`) e `listagem-crud` sem ações de escrita. Falta: célula de pessoa com contagem "+N" (grupo de avatares) e célula de situação binária preenchida — no UCAMDS a situação se diz por `badge`.

### 1.10 Diálogo de detalhe da disciplina (`SeeMoreTableProfessorDialog`, 500 × 600px)

**Propósito.** Abrir a linha do balanço em três listas: unidades, cursos e professores da disciplina.

**Peças.** Cabeçalho "Disciplina" + nome e código + quantidade de alunos (com destaque quando > 80); três abas próprias — **Unidades**, **Cursos**, **Professores** (foto, nome, CPF); botão "Fechar".

**Classificação: parcial.** Base: `dialog` ou `drawer` + `tabs` + `list-item` + `avatar`.

### 1.11 Login por token (`/login/:token/:user/:unidade`)

Tela de espera ("Aguarde..." com a marca). O título embutido no template é "Painel de Rematrícula - Universidade Candido Mendes" (herdado de outro projeto). **Parcial**: base `portal/login`; falta a variação "entrando por token" (tela de espera, sem formulário).

### 1.12 Sem rota

- `FinderComponent` (`pages/cadastro/components/finder`): template "finder works!". **nao-migrar**.
- `progress-bar` e `radial-progress-bar` (`shared/components`): existem, nenhum template os usa. **nao-migrar** neste sistema.
- Enums `colormetas`, `colorsituacaocaptacao`, `colorsituacaorematricula` e modelos `turno`, `unidade`: copiados do projeto de captação; sem uso encontrado aqui.

## 2. Moldura e navegação

- **Moldura:** `<default-style>` (`app.component.html:1-12`) com as entradas `hashMenu`, `startOpen=false`, `environment`, `unidade`, `unidades`, `usuario`, `icon2register`, `welcomeModal` e as saídas `logout` e `changeUnidade`.
- **Menu** (fixo no código, `app.component.ts:30-46`): "Cadastro de Turma" (`cadastro`), "Análise" (`analise`), "Balanço" (`balanco`), cada um com ícone SVG próprio registrado em `icones`. O menu por perfil do Gerencial (`CoreService.getMenuAplicacao`) existe no serviço mas não é chamado.
- **Modal de boas-vindas** (`:63-78`): título "Controle de Turmas do AVA", logotipo e um vídeo do YouTube ("Video tutorial do módulo de Análise de Turmas", papel "Cadastro e Análise das Turmas Compartilhadas", "Duração: 4min 30seg").
- **Conta:** nome do usuário vindo do estado `auth`; sair despacha `Logout`, que limpa o `localStorage` e manda o navegador para `LOGIN_URL` (`https://login.ucam-campos.br/login.jsf`).
- **Troca de unidade:** a saída `changeUnidade` só navega para a raiz; o despacho está comentado (`app.component.ts:100-104`). `unidades` e `unidade` não são preenchidos (linhas 90-91 comentadas). Na prática não há troca de unidade.
- **Login por token na URL:** `LoginComponent` lê `token`, `user` e `unidade` da rota e despacha `TryTokenLogin`; o efeito busca o usuário e a pessoa no Gerencial, grava o estado em `localStorage['AuthState']` e a tela vai para `/cadastro`.
- **Cabeçalho `Unidade-Ref`:** o interceptador acrescenta a unidade do estado salvo a toda requisição (`interceptor.service.ts:13-20`). Não confirmado se o interceptador está registrado: `app.module.ts` não declara `HTTP_INTERCEPTORS`.
- **Cabeçalho `username`:** todos os serviços de negócio mandam o nome do usuário logado.

## 3. Peças usadas, com contagem

Contagem por ocorrência nos templates.

| Peça | Ocorrências | Observação |
|---|---|---|
| `button[ucam-material]` | 27 (inclui atributo em `mat-paginator`) | variações `rounded`, `outline`, `[hover]="{'text':…, 'color':…}"`, `[disabled]` |
| `app-dropdown-selector` | 13 (5 ativos, o resto comentado) | entradas `data`, `isLoading`; saída `selected`; seleciona o primeiro item sozinho |
| `formControlName` | 9 | |
| `table[mat-table]` | 6 | 2 com `multiTemplateDataRows` |
| `ucam-material-select` | 6 (4 ativos) | entradas `formControlName`, `placeholder`, `options`, `reset=false`; saída `change` |
| `mat-spinner` | 5 | |
| `mat-progress-spinner` | 5 | `mode="indeterminate"`, diâmetros 26, 36, 46 |
| `app-box` | 4 | cartão com título, faixa de cor (`detail-color`, padrão `#F68D2C`) e encaixes `filter-breadcumb`, `top-center`, `top-right`, `body` |
| `app-kpi` | 3 | `title`, `first-value`, `ver-mais-link` |
| `app-input-search` | 3 | saídas `onDataChange`, `onEnter` |
| `mat-paginator[ucam-material]` | 2 | `length`, `pageSizeOptions`, `showFirstLastButtons` |
| `app-photo-profile` | 2 | `cpf` |
| `matTooltip` | 2 | |
| `mat-menu` / `matMenuTriggerFor` | 1 / 1 | dentro do `app-dropdown-selector` |
| `default-style` | 1 | moldura |
| `MatSnackBar`, `MatDialog` | por código | 3 snackbars; 6 diálogos |

Componentes próprios: `app-table-cadastro-one`, `app-table-cadastro-two`, `app-table-analise-one`, `app-table-balanco-one`, `app-box`, `app-kpi`, `app-dropdown-selector`, `app-input-search`, `app-photo-profile`, `app-alert-dialog` (seletor repetido em `SeeMoreTableProfessorDialog`), `app-edit-ava-discipline`, `app-remove-shared-disciplina`, `app-share-disciplina`, `app-nova-disciplina.ts`.

## 4. Regras de negócio lidas no código

1. **A busca de turma AVA só dispara com período letivo, unidade e curso escolhidos e termo com mais de 2 caracteres.** `pages/cadastro/views/cadastro.component.ts:290`. Tipo: validação. Valor: `searchTerm.length > 2`.
2. **Na primeira digitação a tela avisa que a busca respeita os filtros.** `cadastro.component.ts:94-97`. Tipo: formato. Mensagem: "Lembre-se que sua busca é de acordo com os filtros selecionados logo abaixo da barra de pesquisa. Altere sempre que quiser para obter o resultado esperado." (ação "Entendi", sem tempo de sumir).
3. **A lista de cursos depende de período letivo e unidade.** `cadastro.component.ts:265-270`; `share-disciplina.component.ts:133-137`. Tipo: validação.
4. **Só se compartilha disciplina com uma turma AVA selecionada.** `cadastro.component.html:35`; `cadastro.component.ts:120`. Tipo: validação.
5. **Criar turma AVA exige período letivo e nome com mais de 2 caracteres.** `pages/cadastro/modals/nova-disciplina.ts/nova-disciplina.ts.component.ts:85`. Tipo: validação. Valor: `nome.length > 2`. O período vem da tela e não é editável no diálogo.
6. **Depois de criar a turma AVA o usuário é levado a incluir uma turma SIGU, sem poder fechar.** `nova-disciplina.ts.component.ts:101-113`. Tipo: transição de situação. Valores: `removeCloseButton: true`, `disableClose: true`.
7. **Erro ao criar a turma AVA fecha o diálogo com alerta.** `nova-disciplina.ts.component.ts:94`. Tipo: integração. Mensagem: "Houve um erro grave ao tentar criar a Turma Moodle. Por gentileza, tente novamente mais tarde! Se o erro persistir, contate os administradores do sistema."
8. **A lista de disciplinas do compartilhamento vem das turmas SIGU do período, unidade e curso, em ordem alfabética, rotulada `código - descrição (turno)`.** `pages/cadastro/modals/share-disciplina/share-disciplina.component.ts:155-166`. Tipo: formato.
9. **Compartilhar envia ano, semestre, unidade, código da turma AVA e código da turma SIGU.** `share-disciplina.component.ts:208`; `shared/services/cadastro.service.ts:46`. Tipo: integração.
10. **Sucesso do compartilhamento avisa que a turma aparece no Moodle "em alguns instantes".** `share-disciplina.component.ts:212`. Tipo: integração. Mensagem: "Disciplina compartilhada com sucesso! Ela estará disponível na Turma Moodle '<nome> ( <código> )' em alguns instantes."
11. **Recusa do compartilhamento mostra a mensagem do servidor.** `share-disciplina.component.ts:220-223`. Tipo: integração. Valor: `error.error.message_user`. As regras que causam recusa não estão no front.
12. **Renomear turma AVA exige nome com mais de 4 caracteres.** `shared/modals/edit-ava-discipline/edit-ava-discipline.component.ts:49`. Tipo: validação. Valor: `nome.length > 4` (diferente do mínimo de criação, regra 5).
13. **Remover turma SIGU pede confirmação e responde com mensagem de sucesso ou erro.** `cadastro.component.ts:375-416`; `shared/modals/remove-shared-disciplina/remove-shared-disciplina.component.ts:29-43`. Tipo: transição de situação. Mensagens: "Disciplina <nome> removida com sucesso." (5 s) e "Houve algum erro ao remover a disciplina <nome>. Tente novamente mais tarde! Caso o erro persista, entre em contato com o administrador do sistema." (fica até fechar).
14. **Disciplina com mais de 80 alunos é destacada no balanço.** `pages/balanco/components/table-balanco-one/table-balanco-one.component.html:25, 64`; `shared/components/see-more-table-professor-dialog/…html:5`. Tipo: limite. Valor: `quantidade_alunos > 80`.
15. **A situação de migração para o AVA é "Sim" ou "Não".** `table-balanco-one.component.html:113-116`. Tipo: formato. Valores: `'Sim'` (verde, visto), `'Não'` (vermelho, X). Nas telas de cadastro e análise o mesmo dado é booleano (`migradaava === true`, selo "Turma migrada do AVA").
16. **Unidades, cursos e professores de uma disciplina chegam numa string separada por " | ".** `table-balanco-one.component.ts:132-134, 142-144`. Tipo: formato. Nomes e CPFs de professores são pareados pela posição.
17. **Com mais de um professor a linha mostra "+N" e "Professores" em vez de foto e nome.** `table-balanco-one.component.html:88-98`. Tipo: formato.
18. **O horário da turma chega como texto com dias separados por "|" e é partido em dia da semana e intervalo.** `shared/services/utils.service.ts:34-72`. Tipo: formato. Regra: para cada trecho, 1ª palavra = dia; 3ª e 5ª palavras = início e fim, exibidos `início - fim`.
19. **"Unidade/Polos" de uma turma AVA é a lista sem repetição das unidades das turmas SIGU contidas; "Turmas" é a quantidade dessas turmas.** `cadastro.component.ts:302-331`; `pages/analise/views/analise.component.ts:210-239`. Tipo: cálculo.
20. **Período letivo é exibido como `ano.semestre`; a análise e o balanço abrem no primeiro período da lista.** `analise.component.ts:182, 187`; `pages/balanco/views/balanco.component.ts:179, 184`. Tipo: formato.
21. **O título da tabela do balanço muda para "Turmas <ano>.<semestre>".** `balanco.component.ts:65`. Tipo: formato.
22. **Exportar baixa todas as turmas do período, não só a página visível.** `analise.component.ts:79-96`; `balanco.component.ts:81-97`. Tipo: integração. Valores: `size = totalElements`, `export=true`; arquivos "Dados.xls" e "Balanço.xls". A busca digitada não é enviada na exportação.
23. **Paginação: 20, 50, 100 na análise; 50, 100, 200 no balanço.** `table-analise-one.component.html:262`; `table-balanco-one.component.html:142`. Tipo: limite.
24. **A busca espera 1 s sem digitação antes de consultar e ignora repetição por 1,5 s depois do Enter.** `shared/components/input-search/input-search.component.ts:37-39, 47`. Tipo: limite.
25. **Tempo máximo das consultas: 10 s; lista do balanço, 30 s; foto, 57 s.** `shared/services/*.service.ts`; `user.service.ts:22`. Tipo: limite.
26. **Falha na lista do balanço repete a consulta sem limite de tentativas.** `balanco.component.ts:229-230`. Tipo: integração.
27. **Foto do professor é buscada por CPF e só é usada se a URL responder com conteúdo.** `shared/components/photo-profile/photo-profile.component.ts:47-80`. Tipo: integração. Valor: `size > 0`; senão, imagem genérica.
28. **Rota protegida sem sessão manda para o login externo.** `core/services/auth/auth-guard.service.ts:24-27`; `auth.effects.ts:98-103`. Tipo: permissão.
29. **Não há perfil nem permissão por tela no front: quem entra vê os três itens do menu.** `app.component.ts:30-46`. Tipo: permissão.
30. **Mensagens de erro de lista:** "Houve um erro ao tentar obter a lista de períodos letivos, tente novamente mais tarde!", "…de unidades/polos…", "…de cursos…", "…de disciplinas…" (via `alert`). `cadastro.component.ts:240, 260, 282`; `share-disciplina.component.ts:172`. Tipo: integração.
31. **Mensagens de validação genéricas** (`utils.service.ts:11-20`): "Campo requerido", "Valor mínimo: N", "Valor máximo: N", "Valor inválido". Tipo: validação. Não confirmado se algum template as exibe.

## 5. API consumida

Bases (`environments/environment.ts`): `API_ADDRESS_TURMA_COMPARTILHADA = https://api.candidomendes.edu.br/turmascompartilhadas/`, `ACADEMICO_API = https://api.candidomendes.edu.br/academico/`, `API_GERENCIAL = https://api-gerencial.ucam-campos.br`. Todo serviço de negócio manda o cabeçalho `username`.

| Serviço | Método | Caminho | Parâmetros |
|---|---|---|---|
| `BasicsService` | GET | `/unidades` | — |
| | GET | `/periodos-letivos` | — |
| | GET | `/cursos` | `ano`, `semestre`, `unidade` |
| `SearchService` | GET | `/turmas-sigu` | `ano`, `semestre`, `unidade`, `curso` |
| | GET | `/search/find-by-turma-sigu` | `ano`, `semestre`, `unidade`, `curso`, `descricao-turma` |
| `CadastroService` | POST | `/turma-moodle` | corpo `{ano, semestre, descricao}` |
| | PUT | `/turma-moodle/{codigo}` | corpo `{descricao}` |
| | POST | `/turma-compartilhada` | corpo `{ano, semestre, unidade, codigoTurmaMoodle, codigoTurma}` |
| | DELETE | `/turma-compartilhada/{oid}` | — |
| `AnaliseService` | GET | `/turma-moodle` | `ano`, `semestre`, `page`, `size`, `nome` (opcional) |
| | GET | `/turma-moodle` (blob) | idem + `export=true` |
| | GET | `/indicadores/turmas-sigu-compartilhadas` | `ano`, `semestre` → `{valor}` |
| | GET | `/indicadores/turmas-sigu-sem-compartilhamento` | `ano`, `semestre` → `{valor}` |
| | GET | `/indicadores/turmas-moodle` | `ano`, `semestre` → `{valor}` |
| `BalancoService` | GET | `/analiseturmas` | `ano`, `semestre`, `page`, `size`, `searchTerm` (opcional) |
| | GET | `/analiseturmas` (blob) | idem + `export=true` |
| `UserService` | GET | acadêmico `/pessoa/search/foto` | `cpfs` |
| `AuthEffects` / `LoginService` | GET | gerencial `/usuario/{oid}` | cabeçalho `Unidade-Ref` |
| | GET | gerencial `/usuario/{oid}/pessoa` | |
| `LoginService` | GET | gerencial `/unidade/{oid}` | sem chamada encontrada |
| `CoreService` | GET | `${API_REST}/unidade/search/all?term` | sem chamada encontrada; `API_REST` não existe no ambiente lido |
| | GET | gerencial `/menu-usuarios/search/all-menu-aplicacao-usuario` | `oidUsuario`, `oidAplicacao`; sem chamada encontrada |

**Modelos principais.**
- `IFindTurmaMoodle` (turma AVA): `codigo`, `descricao`, `professor`, `tempodeaula`, `oid?`, `ano?`, `semestre?`, `totalAlunos?`, `migradaava?`, `turmas?[]`. Versão paginada com `content[]`, `totalElements`, `totalPages`, `number`, `size`, `pageable`.
- `ITurmaSiguSubSearchOfTurmaMoodle` (turma SIGU dentro da AVA): `oid`, `ano`, `semestre`, `codigo`, `unidade`, `disciplina`, `codigoMoodle`, `descricaoMoodle`, `professor`, `tempodeaula`, `totalAlunos`, `curso`, `horario?{dia_semana, intervalo_de_horas}`. Os templates leem também `turno`, `turmaConjunto`, `periodo` e `nomeProfessor`, que a interface não declara.
- `ITurmaSiguSearch` (turma SIGU disponível): `ano`, `semestre`, `codigo`, `descricao`, `turno`, `horarioAula`, `temposAula`, `tipoDisciplina`, `tipoNucleo`, `nomeProfessor`, `periodoOferta`, `curso`, `totalAlunos?`.
- `IFindTurmaBalancoPaged.content[]`: `classificacao`, `cpfprofessor`, `curso`, `descricaodisciplina`, `migradoava`, `nomeprofessor`, `sigladisciplinaead`, `totalAlunos`, `unidade`.
- `IBasicsPeriodosLetivos`: `ano`, `semestre`.
- Estado `auth`: `usuario{oid, nome}`, `unidades`, `unidadeSelecionada`, `token`, `authenticated` (+ `email`, `foto`, `oidpessoa`, `unidade` vindos do efeito).

## 6. O que o código não responde

1. O que é, no negócio, uma "turma compartilhada" e quando duas turmas SIGU podem ou não ir para a mesma turma AVA (mesmo horário? mesmo professor? mesma disciplina?). As recusas vêm do servidor (`message_user`). — Coordenação acadêmica / EAD.
2. Por que 80 alunos é o limite de destaque no balanço e o que se faz com uma disciplina destacada. — Coordenação de EAD.
3. O que significa "migrado" para o AVA, quem marca e se "Não" pede alguma ação. — Equipe do AVA/Moodle.
4. O que é "Turma Conjunto" e "classificação" (campo recebido e não exibido). — Secretaria acadêmica.
5. Quem pode criar, renomear e remover; o front não distingue perfis. — Gestão do sistema / TI.
6. Remover uma turma SIGU da turma AVA apaga matrículas ou histórico no Moodle? O diálogo não diz o que se perde. — Equipe do AVA/Moodle.
7. "Em alguns instantes": qual o prazo real da sincronização com o Moodle e como o usuário sabe que terminou. — TI / integração.
8. Por que o mínimo do nome é 3 caracteres ao criar e 5 ao renomear. — não confirmado; provável descuido, decide a equipe do sistema.
9. Os indicadores devem ter porcentagem ou comparação (o cartão traz o comentário "vai ter porcentagens?")? — Coordenação de EAD.
10. A troca de unidade deve existir neste sistema? A moldura oferece a saída, o código não a trata. — Gestão do sistema.
11. Filtros de unidade, curso e grade na análise estão comentados: foram retirados ou adiados? — Dono do produto.

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
