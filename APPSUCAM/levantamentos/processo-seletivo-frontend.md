# Inventário do front-end do processo seletivo (Angular 9)

Raiz: `C:\Users\Leonardo\Documents\Novo Vestibular\processo-seletivo-frontend`. Todas as referências `arquivo:linha` abaixo são relativas a `...\processo-seletivo-frontend\src\app\` (ou `src\environments\` quando indicado).

**Cobertura da leitura.** Li por inteiro todos os `.ts` não-spec (63) e todos os `.html` (41) de `src/app`, mais os dois `environment*.ts`, `styles.sass`, `index.html` e `assets/css/palete.css`. Não li os 38 `.sass` de componente (só busquei pontos específicos), nem os 40 `.spec.ts`. Dos 11 `.md` de `admin/isencao/` li só o `SPECIFICATION.md`. `node_modules` não existe na pasta, então o conteúdo real de `ucam-material` e `default-style` é **não confirmado**; só sei o que os templates usam. A contagem real é 103 `.ts` (63 + 40 specs), 41 `.html`, 38 `.sass`.

---

## 1. Rotas e telas

Não há módulo lazy: tudo está declarado em `AppModule` (`app.module.ts:84-178`) e as rotas em `app-routing.module.ts:21-93`. O único guard é `AuthGuard`, que só verifica `state.authenticated`; não há checagem de perfil.

Quase toda navegação do candidato usa `skipLocationChange: true`, então a URL do navegador não muda entre folha de rosto, prova e conclusão.

### 1.1 Tabela de rotas

| URL | Componente | Template | Guard | Arquétipo |
|---|---|---|---|---|
| `''` | `LoginComponent` | `vestibular/components/login/login.component.html` | nenhum | entrada/login |
| `vestibularonline/:oidFormaIngressoPessoa` (aceita `?tentativa=N`) | `LoginComponent` | idem | nenhum | entrada/login |
| `folha_rosto` | `FolhaRostoComponent` | `vestibular/components/folha-rosto/folha-rosto.component.html` | nenhum | passo a passo (instruções) |
| `prova` | `PageComponent` | `vestibular/components/page/page.component.html` | nenhum | prova/execução |
| `conclusao` | `ConclusaoComponent` | `vestibular/components/conclusao/conclusao.component.html` | nenhum | resultado |
| `formulario` | `FormComponent` | `vestibular/components/form/form.component.html` | nenhum | formulário (passo 1 de 3) |
| `upload` | `UploadComponent` | `vestibular/components/upload/upload.component.html` | nenhum | formulário + upload (passo 2 de 3) |
| `contract` | `ContractComponent` | `vestibular/components/contract/contract.component.html` | nenhum | detalhe/aceite (passo 3 de 3) |
| `bank-slip` | `BankSlipComponent` | `vestibular/components/bank-slip/bank-slip.component.html` | nenhum | formulário |
| `finish` | `FinishComponent` | `vestibular/components/finish/finish.component.html` | nenhum | mensagem/resultado |
| `isencao/:oidFormaIngressoPessoa` | `IsencaoComponent` | `isencao/components/isencao/isencao.component.html` | nenhum | detalhe (acompanhamento) |
| `admin/login/:token/:usuario` | `LoginAdminComponent` | `admin/login/components/login/login.component.html` | nenhum | entrada (tela de carregamento) |
| `admin` | `HomeComponent` | `admin/login/components/home/home.component.html` | `AuthGuard` | painel (boas-vindas) |
| `admin/correcao/redacao` | `AdminComponent` | `admin/correcao/redacao/admin/admin.component.html` | **nenhum** — `canActivate` comentado (`app-routing.module.ts:65`) | listagem + correção |
| `admin/correcao/questao` | `CorrecaoQuestaoComponent` | `admin/correcao/questao/main/questao.component.html` | `AuthGuard` | listagem (esqueleto) |
| `admin/cadastro` | `MainComponent` | `admin/cadastro/components/main/main.component.html` | `AuthGuard` | listagem + cadastro |
| `admin/isencao` | `AdminIsencaoComponent` | `admin/isencao/components/isencao/admin-isencao.component.html` | `AuthGuard` | listagem + análise |

### 1.2 Telas do candidato

**Login / conferência de dados** (`''` e `vestibularonline/:oid`)
- Propósito: o candidato confere nome, CPF, curso e turno e entra na prova.
- Peças: cartão central com logo, 4 linhas rótulo + ícone `check_circle` + valor, botões "Voltar" (sem ação ligada, `login.component.html:45`) e "Entrar", aviso "Esta prova tem tempo para ser finalizada", mensagem "Quantidade de tentativas máxima alcançada!".
- Animação de entrada: painel do logo e painel do formulário abrem em 50% cada (`login.component.ts:114-121`).

**Folha de rosto / instruções** (`folha_rosto`)
- Propósito: mostrar três slides de instrução antes de iniciar a prova.
- Peças: cabeçalho só com logo (`app-header-correcao`, reaproveitado da área admin), cartão, carrossel próprio (`app-caroussel` + 3 `app-slide`, com pontos de seleção), botões "Iniciar prova" e "Proxima" (some no último slide), aviso "AO CLICAR EM INICIAR, A PROVA TERÁ UM TEMPO DETERMINADO PARA SER CONCLUÍDA."
- Textos dos slides: "A plataforma é 100% responsiva", "A prova terá um tempo determinado", "Plataforma 100% digital" (`folha-rosto.component.html:9-32`).

**Prova** (`prova`)
- Propósito: responder a prova objetiva e/ou a redação dentro do tempo.
- Composição (`page.component.html`):
  - `app-header`: logo, alternador "Prova objetiva" / "Redação" (só se houver os dois), nome + CPF do candidato, botão amarelo "Finalizar a prova"; em telas até 800px vira menu hambúrguer com "Escolha um menu".
  - `app-sidebar`: "Todas as questões (respondidas/total)", `mat-accordion` com um painel por caderno e contador; lista de questões com ícone `dns` (múltipla escolha) ou `edit`; questão respondida fica azul. Oculta na redação e em telas até 800px.
  - `app-page-header`: título "Processo Seletivo {ano}. {semestre}", turno / curso, cronômetro `HH:MM:SS` e `mat-progress-bar` determinada que muda de cor.
  - `app-question-selector`: seletor de caderno/questão (alternativa à sidebar no celular), com backdrop.
  - `app-question`: selo "Feita", "{Caderno} - Questão N", tipo "Multipla escolha", texto de referência e enunciado em HTML, alternativas com `ucam-material-radiobutton` e letra (A, B, C…), botões "Anterior" e "Próximo"/"Finalizar".
  - `app-essay`: selo "Feita", "Redação", tipo "Discursiva", editor rico Quill (negrito, itálico, sublinhado, alinhamento, fórmula, listas), contador "N CARÁCTERES", avisos em vermelho, botão "Salvar rascunho".
- Carregamento: imagem `assets/videos/LOAD.webp`.

**Diálogo "Entregar a prova"** (`vestibular/components/page/modal/modal.component.html`)
- Ícone `check_circle`, "Parabéns, você finalizou a prova no prazo", "Tem certeza que deseja entregar a prova?", botões "Voltar" e "Confirmar". Largura 35% (100% se janela ≤ 800px), borda superior amarela (`panelClass: 'borderTop'`).

**Diálogo de mensagem genérico** (`shared/components/message-modal/message-modal.component.html`)
- Ícone + título + descrição + botão "Fechar". Classes usadas: `warning`/`error`, `notification`, `success`. Usado na prova e na redação.

**Conclusão** (`conclusao`)
- Propósito: confirmar a entrega e, sem redação, mostrar o resultado imediato.
- Peças: faixa de cabeçalho com logo, cartão com ícone `assignment_turned_in`, título "Prova entregue!", texto condicional, um botão condicional ("Ir para o site", "Terminar o cadastro" ou "Tentar novamente"), rodapé "VOCÊ FINALIZOU A PROVA EM h:m:s".

**Dados pessoais** (`formulario`)
- Propósito: completar dados pessoais e endereço do aprovado e baixar o boleto da 1ª mensalidade.
- Peças: faixa com logo + título "Dados pessoais" + `app-stepper` (3 passos: Dados pessoais, Upload de documentos, Contrato); `mat-form-field` com `matInput` e máscaras (CPF, celular, data, CEP); `mat-select` (Sexo; "Estudou em escola pública"); `mat-error`; botões "Voltar", "Baixar boleto"/"Carregando", "Próximo passo".

**Upload de documentos** (`upload`)
- Propósito: informar a escola de conclusão do ensino médio e enviar os documentos.
- Peças: stepper; 4 campos (Instituição, Cidade, Estado em `mat-select` com 27 UFs, Ano com máscara `0000`); uma linha por documento com campo desabilitado mostrando o nome do arquivo ou "Nenhum arquivo enviado.", marca "Obrigatório", link "baixar" e botão redondo `mat-mini-fab` com `attach_file`; botões "Voltar" e "Próximo passo".

**Diálogo "Termo de compromisso"** (`vestibular/components/upload/upload-term.dialog.html`)
- `mat-dialog-title` / `content` / `actions`; texto do termo, lista "Documentos faltantes", cidade/UF e data por extenso; botões "Cancelar" e "Aceitar".

**Contrato** (`contract`)
- Propósito: ler, imprimir e aceitar o contrato de prestação de serviços.
- Peças: stepper; bloco só de impressão com logo e tabela de dados do contratante (nome, CPF, endereço, nascimento, "Possui menos de 18 anos?", curso, campus); HTML do contrato vindo do backend; bloco só de impressão com assinaturas e testemunhas; toast de aviso (`ngx-toastr`, título "Atenção!"); botões "Voltar"/"Rejeitar", "Imprimir", "Aceitar"/"Próximo".

**Boleto de primeira mensalidade** (`bank-slip`)
- Propósito: escolher quantidade de matérias e baixar o boleto.
- Peças: `mat-select` "Quantidade de materias" (5 ou 6) e "Estudou em escola pública" (só `unid01`); botões "Voltar" e "Baixar boleto".
- Nenhuma navegação do código leva a esta rota.

**Inscrição finalizada** (`finish`)
- Cartão "Parabéns!" / "Inscrição finalizada com sucesso.", botões "Baixar boleto" (condicional) e "Visualizar contrato", rodapé "SEU CADASTRO ESTÁ ENCERRADO. VOCÊ ESTÁ {situacao}(A)".

**Diálogo "Contrato"** (`vestibular/components/finish/contract-modal.component.html`)
- Mesmo conteúdo da tela de contrato em diálogo de largura 100%, com botões "Imprimir" e "Fechar".

**Acompanhamento de isenção** (`isencao/:oid`)
- Propósito: o candidato acompanha a análise de aproveitamento de disciplinas e envia documentos.
- Peças: faixa com logo, título "Acompanhamento de isenção" e situação; cartão branco de 80vw com nome do curso, botões "Documentos" e "Adicionar documento"; caixa "Obs.: …"; abas por período ("1º Período", …) com rolagem horizontal; lista de disciplinas com selo de situação.
- Dois modais feitos à mão (`div.modal` + `div.backdrop-modal`, não `MatDialog`): "Documentos" (lista clicável com descrição, data de upload, nome do arquivo, ícone de download) e "Adicionar documento" (Descrição + Arquivo, "Cancelar"/"Salvar").

### 1.3 Telas administrativas

Todas, menos o login, ficam dentro de `<default-style>`.

**Login admin** (`admin/login/:token/:usuario`)
- Só um fundo com o logo cinza; não há formulário visível. O componente cria um `FormGroup` login/senha que o template não usa (`admin/login/components/login/login.component.ts:38-41`).

**Home admin** (`admin`)
- Imagem `bem_vindo.png` e o texto "Bem vindo a administração do vestibular online."

**Correção de redação** (`admin/correcao/redacao`)
- Propósito: listar provas aguardando correção e já corrigidas e lançar a nota da redação.
- Sidebar de filtro (`app-sidebar-correcao`): "Todas as redações"; "Forma de ingresso" e "Periodo de ingresso" como grupos de `app-bean` (cartão com rádio); "Data" com `ucam-material-datepicker` de intervalo (`[multiplo]="true"`), desabilitado até escolher o período. Há um campo de pesquisa comentado.
- Duas tabelas `mat-table` com `matSort`, `mat-progress-bar` indeterminada e `mat-paginator` (10 por página; opções 5, 10, 25, 100):
  - "Em espera" (`app-em-espera`): colunas check, foto, Aluno (nome + CPF), Curso, Turno, Feito em, Ação "Corrigir".
  - "Corrigidas" (`app-verificadas`): as mesmas mais Nota; ação "Visualizar".
  - Ordenáveis: Aluno, Curso, Feito em.

**Diálogo "Correção da redação"** (`admin/correcao/redacao/admin/modal/modal.component.html`)
- Largura 100%, altura 80vh. Tabela de uma linha com os dados do aluno e um `mat-slider` de nota; painel expansível "Texto de referencia"; "Questão"; "Texto do candidato" com contador de caracteres; botões "Cancelar" e "Salvar".

**Correção de questão** (`admin/correcao/questao`)
- Esqueleto: sidebar de filtro igual à da redação (título "Todas as objetivas") e o corpo é o texto literal "questao works!" (`admin/correcao/questao/main/questao.component.html:19`).

**Cadastro de cadernos** (`admin/cadastro`)
- Propósito: cadastrar cadernos de prova e questões por processo seletivo, forma de ingresso e captação.
- Sidebar (`app-sidebar-cadastro`): "Todos os cadernos"; "Forma de ingresso" (beans); "Processo seletivo" (`ucam-material-select`, rótulo "ano/semestre"); "Captação" (beans).
- Corpo: botão "Adicionar redação" quando não há caderno; `mat-accordion` com um painel por caderno (título = tipo de prova, descrição "N questões"); dentro, botões "Editar" e "Adicionar questão" e tabela `mat-table` (QUESTÃO, PONTUAÇÃO, "Visualizar").
- Modo edição do caderno: `ucam-material-select` "Tipo de caderno", "Salvar", "Cancelar" e botão vermelho com ícone `delete`.

**Diálogo "Adicionar questão"** (`admin/cadastro/components/main/modal-cadastro/modal-cadastro.component.html`)
- Largura 100%, altura 80vh. `mat-slider` de pontuação; dois painéis expansíveis com editor Quill ("Texto referência" e "Questão"; toolbar com negrito, itálico, sublinhado, alinhamento, fórmula, listas, imagem).
- Modo criar/editar: "Cancelar" e "Salvar". Modo `view`: "Fechar", "Salvar" e "Excluir" (vermelho).

**Análise de isenção** (`admin/isencao`)
- Propósito: analisar, disciplina a disciplina, os pedidos de isenção dos candidatos.
- Abas "Em análise" / "Concluídos" (botões `course-tab-button`).
- Filtros de "Em análise": busca por nome (`input` nativo), `select` nativo de unidade (só EAD) e de curso, e uma segunda fileira de abas de situação: "Todos", "Aguardando envio", "Aguardando a análise", "Aguardando o candidato".
- Filtros de "Concluídos": busca por nome e abas de status montadas a partir dos dados.
- Lista agrupada em `<details>` aninhados: UNIDADE (total) → CURSO (total) → `table` nativa.
  - Em análise: Nome (com telefone e e-mail se não há documentos), Situação, Período letivo, Data de solicitação, Data de movimentação, botão "Avaliar" (com spinner).
  - Concluídos: Nome, Situação, Período letivo, botão "Ver".
- Painel de avaliação (overlay feito à mão, 85% de largura): cabeçalho com curso, unidade, período, nome, CPF, telefone, e-mail; `select` nativo de matriz; botão "Documentos"; abas "Observações" e "Nº Per."; por disciplina, três botões-ícone (`thumb_up`, `report`, `thumb_down`) e campos condicionais; botões "Fechar", "Salvar", "Finalizar"; lista de erros em vermelho.
- Modal "Documentos" igual ao do candidato.

**Diálogo "Nenhum documento enviado para análise!"** (`admin/isencao/components/isencao/dialog-no-documents.html`)
- `MatDialog` de 40%; texto "Favor verificar a situação antes de tentar avaliar os candidatos ou utilizar os dados de contato na tabela para requisitar os documentos necessários."; botões "Fechar" e "Entendido".

---

## 2. Moldura e navegação

**Área do candidato**
- Não há shell comum: `app.component.html` é só `<router-outlet>`.
- Login: tela dividida em dois painéis.
- Prova: cabeçalho próprio (`vestibular/components/header`) com logo branco, alternador de prova, identificação do candidato e "Finalizar a prova"; sidebar própria de questões; sem rodapé.
- Demais telas (conclusão, formulário, upload, contrato, boleto, finish, isenção): cada uma repete uma faixa `div.head > .logo-holder` com logo branco e, às vezes, título e stepper; o conteúdo vai em `div.body`. Sem menu e sem rodapé.
- Stepper (`shared/components/stepper`): lista de 3 passos em que só o passo atual recebe `active`; não é clicável. Usa ícones `fa-solid` (Font Awesome), mas não encontrei o Font Awesome carregado em `angular.json`, `index.html` ou `styles.sass` — **não confirmado** se os ícones aparecem.
- Não há troca de perfil nem logout para o candidato.
- Responsivo: um único ponto de quebra em 800px (`styles.sass:122-163`).

**Área admin**
- Moldura `<default-style>` da lib `default-style`, com as entradas `hashMenu`, `startOpen=false`, `environment`, `unidade`, `unidades`, `usuario` e as saídas `logout` e `changeUnidade`.
- O que ela desenha (cabeçalho, menu lateral, widget de perfil, seletor de unidade) é **não confirmado**. O `styles.sass:99-116,165` sobrescreve classes `default-style-main-header-row` (15vh), `logo-img`, `profile-widget-*`, `default-style-main-menu-content` e `default-style-content-holder`, o que sugere cabeçalho com logo e perfil e um menu.
- `hashMenu` vem de `dataService.menu`, que nunca recebe valor (`data.service.ts:25`), então o menu chega `null`. `CoreService.getMenuAplicacao` existe mas não é usado.
- Troca de unidade: dispara `ChangeUnidade` e volta para `/admin` (na home só troca).
- Logout: limpa o `localStorage` e redireciona para `LOGIN_URL` (`core/services/auth/store/auth.reducers.ts:56-66`, `auth.effects.ts:87-93`).
- Padrão interno das telas admin: sidebar de filtro à esquerda (logo cinza + título + grupos de beans) e coluna de conteúdo `div.column.bg`. Sem rodapé.
- Os componentes `app-header-cadastro` e `app-header-correcao` (faixa com logo) existem; o primeiro não é usado em nenhum template e o segundo só aparece na folha de rosto do candidato.

---

## 3. Peças usadas, com contagem

Contagem por ocorrência nos 41 templates.

**Angular Material — tags**

| Peça | Qtde |
|---|---|
| `mat-icon` | 36 |
| `mat-form-field` | 26 |
| `mat-error` | 17 |
| `mat-option` | 7 |
| `mat-select` | 5 |
| `mat-label` | 5 |
| `mat-expansion-panel` (+ header, panel-title) | 5 cada |
| `mat-accordion` | 4 |
| `mat-progress-bar` | 3 |
| `mat-slider` | 2 |
| `mat-paginator` | 2 |
| `mat-panel-description` | 1 |

**Angular Material — diretivas**

| Diretiva | Qtde |
|---|---|
| `mat-header-cell` / `mat-cell` | 24 / 24 |
| `matInput` | 21 |
| `mat-flat-button` | 8 |
| `mat-stroked-button` | 7 |
| `mat-sort-header` | 6 |
| `mat-table` | 4 |
| `matSort` | 2 |
| `mat-mini-fab` | 1 |
| `mat-dialog-title` / `-content` / `-actions` / `-close` | 1 cada |

`MatDialog` é aberto por código em 8 pontos, para 6 componentes de diálogo.

**`ucam-material`** (importado: `UcamMaterialModule`, `app.module.ts:29`)

| Peça | Qtde | Observação |
|---|---|---|
| botão `button[ucam-material]` | 60 | modificadores: `rounded` 48, `secondary` 10, `outline` 7, `drop-shadow` 2; entradas `color`, `text`, `[hover]="{color, text}"` |
| `ucam-material-select` | 3 (1 comentado) | entradas `[options]` ({id, label, value}), `label`, `[default]`, `formControlName`, `(change)` |
| `ucam-material-datepicker` | 2 | `[disabled]`, `[multiplo]`, `(dateChange)` devolvendo `{inicio, fim}` em `dd/MM/yyyy` |
| `ucam-material-radiobutton` | 1 | `id`, `name`, `value`, `formControlName`, `[checked]` |

**`default-style`** (importado: `DefaultStyleModule`, `app.module.ts:25`): `<default-style>` 5 vezes.

**Componentes próprios**
- `app-bean` 6 (em `*ngFor`), `app-stepper` 3, `app-slide` 3, `app-caroussel` 1.
- 1 vez cada: `app-header`, `app-sidebar`, `app-page-header`, `app-question-selector`, `app-question`, `app-essay`, `app-em-espera`, `app-verificadas`, `app-sidebar-correcao`, `app-sidebar-correcao-questao`, `app-sidebar-cadastro`, `app-header-correcao`.
- `MessageModalComponent` só via `MatDialog`.

**Outras libs**
- `quill-editor` 4 (1 na redação, 1 em ramo morto da questão, 2 no cadastro de questão).
- `ngx-mask`: atributo `mask=` 6 e pipe `mask` 4.
- `ngx-toastr`: 2 pontos (contrato e modal de contrato).
- `cep-promise` no formulário.

**HTML nativo**
- `button` 99 no total (inclui 60 `ucam-material`, 16 Material e os da toolbar do Quill), `img` 42, `input` 31, `form` 18, `table` 8 (4 `mat-table`, 4 nativas), `select` 7 (3 de filtro/matriz, 4 da toolbar do Quill), `details` 4.

**Bootstrap 4** (só grade e utilitários)
- `col-sm-12` 24, `col-md-6` 6, `col-md-2` 6, `col-md-3` 5, `col-md-4` 4, `col-md-8` 2, `col-md-5` 1, `row` 8, `position-absolute` 2, `position-relative` 1.
- As classes `card` (4) e `modal` (4) são estilizadas pelo próprio app, não usam o JS do Bootstrap.

**Pipes**
- `date` 10, `keyvalue` 8, `tipoProva` 7, `mask` 4, `cursoMask` 3, `cpfMask` 3, `turnoMask` 1, `titlecase` 1, `index2letter` 1.
- `captacaoMask` e `unidadeFilter` não aparecem em template (o segundo é chamado no `.ts` da conclusão).

**Ícones Material usados**
- `check_circle` (10), `arrow_right`, `download`, `description`, `assignment_turned_in`, `visibility`, `upload`, `thumb_up`, `thumb_down`, `report`, `menu`, `keyboard_arrow_right`, `edit`, `dns`, `delete`, `check_circle_outline`, `attach_file`, `error_outline`, `warning`.
- Fonte de ícones própria `icomoon`: `icon-Portugues`, `icon-Matematica`, `icon-Conhecimentos-gerais`, `icon-Discursiva`, `icon-Tempo`.

**Tokens globais** (`src/assets/css/palete.css`)
- `--primary #2762ea`, `--default #2656c4`, `--secondary #dbe6fd`, `--background #e9eaef`, `--error/--danger #dc3545`, `--danger-hover #ee7b87`, `--finalizar #ffce29`, `--finalizar-texto #2c3139`, `--finalizar-hover #f7e837`, `--ucam-bordo #7e1f35`, `--coral #ff7f50`.
- Fontes: Roboto (300/400/500) e Gilroy (classe `.gilroy`).

---

## 4. Regras de negócio lidas no código

### A. Entrada do candidato e tentativas

1. **Identificação por link.** O candidato é identificado só pelo `oidFormaIngressoPessoa` da URL; não há senha. — `vestibular/components/login/login.component.ts:104-112` — integração.
2. **Tentativa padrão.** A tentativa vem de `?tentativa=`; sem o parâmetro vale `'1'`. Como o valor nunca é vazio, o ramo `checkCandidato` nunca é escolhido e a entrada sempre faz `POST candidatoprova?oidformaingressopessoa=…&tentativa=…`. — `login.component.ts:69-72, 109-111` — transição.
3. **Falha ao criar a tentativa.** Se o POST falha, o front busca o candidato existente e redireciona sozinho, sem esperar o clique em "Entrar". — `login.component.ts:180-196` — transição.
4. **Limite de tentativas.** "Entrar" fica desabilitado quando `tentativaAtual >= totalTentativasPossiveis` (de `GET formaingressopessoa/{oid}/tentativas`). Mensagem: "Quantidade de tentativas máxima alcançada!". — `login.component.ts:123-127`, `login.component.html:53-61` — limite.
5. **Nova tentativa ao entrar.** Se a situação da prova é `PROVA_CORRIGIDA` e a situação da inscrição não é `APROVADO`, "Entrar" cria a tentativa seguinte (atual + 1). — `login.component.ts:200-220` — transição.
6. **Roteamento por situação da prova** (`candidato.situacao`) — `login.component.ts:222-259` — transição:
   - `CADASTRADO` → limpa dados locais e vai para a folha de rosto.
   - `PROVA_INICIADA` → prova.
   - `PROVA_FINALIZADA` → limpa dados locais e vai para a conclusão.
   - `PROVA_CORRIGIDA` → se a inscrição está `APROVADO` ou `MATRICULADO`, sai para `FORM_URL + '/' + CPF` (`https://www.candidomendes.edu.br/processo-seletivo/area-do-inscrito/{cpf}`); caso contrário não faz nada.
7. **Situações da inscrição vistas no front** (`formaingressopessoa.situacao`): `APROVADO`, `MATRICULADO`, `REPROVADO`.
8. **Bloqueios de teclado e mouse.** Nas telas de login, folha de rosto, prova e conclusão ficam bloqueados: copiar, colar, recortar, menu de contexto, F12, Ctrl+Shift+I/C/J, Ctrl+U, Ctrl+P e PrintScreen (keyCode 44). O bloqueio é registrado em `document` e não é removido ao sair da tela. — `login.component.ts:20-102`, `vestibular/components/page/page.component.ts:22-158`, `folha-rosto.component.ts:14-87`, `conclusao.component.ts:16-103` — permissão.

### B. Prova online

9. **Início.** "Iniciar prova" faz `POST candidatoprova/{oid}/iniciarprova`; o retorno é guardado em memória e em `localStorage['candidato']`. Erro é silencioso. O botão está disponível em qualquer slide. — `vestibular/components/folha-rosto/folha-rosto.component.ts:92-105` — transição.
10. **Tempo máximo.** Vem de `GET candidato/{oid}/tempo-maximo-prova`, campo `tempomaximo` em `HH:MM:SS`. Se a chamada falha, vale 2 horas. O fim é `horarioinicio` (do servidor) + tempo máximo. — `vestibular/components/page-header/page-header.component.ts:43-87` — prazo.
11. **Constante `duracao: 2`.** Existe no environment e é lida na folha de rosto, mas não aparece em nenhum template. — `environments/environment.ts:7`, `folha-rosto.component.ts:56` — prazo.
12. **Cor da barra de tempo.** Azul; amarela quando resta menos de 2/3 do tempo; vermelha quando resta menos de 1/3. Valor da barra = `100 − (restante × 100 / total)`. — `page-header.component.ts:101-111`, `page-header.component.html:22-26` — cálculo.
13. **Tempo esgotado.** Quando o restante fica negativo, o front navega para a conclusão **sem** chamar `finalizarprova`. — `page-header.component.ts:113-123` — prazo.
14. **Separação dos cadernos.** Caderno cujo `tipoprova` contém `REDACAO` vai para "Redação"; os demais para "Prova objetiva". Um grupo vazio some do cabeçalho. Erro ao buscar: "Não existe caderno cadastrado para esta prova." — `page.component.ts:187-222` — integração.
15. **Tipos de prova reconhecidos** (rótulo e ícone): `portugues` → Português, `matematica` → Matemática, `conhecimentos_gerais` → Conhecimentos gerais, `redacao` → Redação. — `vestibular/pipe/tipo-prova.pipe.ts:8-19` — enumeração.
16. **Salvamento da objetiva.** Clicar numa alternativa envia na hora `POST candidatoprova/{oid}/responderquestao` com `{oidQuestao, oidAlternativa, respostaTextual: null}`. Não há botão de salvar. Pode trocar de alternativa (novo POST). Um segundo clique é ignorado enquanto o anterior não volta. — `vestibular/components/question/question.component.ts:115-148` — transição.
17. **Queda de conexão.** Se o POST falha, a questão é marcada `offline`, a prova inteira é gravada em `localStorage['prova']` e a chave `offline` é ligada. Ao reabrir essa questão, o front reenvia a resposta. Com `offline` ligado, a prova é carregada do `localStorage` em vez do servidor. — `question.component.ts:60-63, 138-145`, `page.component.ts:183-186, 292-311` — integração.
18. **Navegação entre questões.** Livre, pela sidebar, pelo seletor e por "Anterior"/"Próximo", atravessando cadernos. "Anterior" fica desabilitado na primeira questão do primeiro caderno. Não há obrigação de responder para avançar. — `question.component.ts:82-94, 150-237` — permissão.
19. **Última questão.** O botão vira "Finalizar". Se `dataService.cadernos.includes('REDACAO')`, troca para a redação; senão abre a confirmação de entrega. Nesta tela `dataService.cadernos` recebe objetos de caderno, não textos (`page.component.ts:190`), então **não confirmado** que o ramo da redação seja alcançado. — `question.component.ts:176-193`.
20. **Numeração.** `índice do caderno × nº de questões do caderno + posição + 1`. — `vestibular/components/sidebar/sidebar.component.html:30`, `question-selector.component.html:10` — cálculo.
21. **Contador de respondidas.** A sidebar pergunta ao servidor questão por questão (`GET respostacandidato/search/find-resposta-por-questao`) a cada atualização. Mostra "Todas as questões (x/y)" e (x/y) por caderno. — `sidebar.component.ts:70-123` — cálculo.
22. **Entrega.** "Finalizar a prova" abre a confirmação. Ao confirmar: se não há redação, ou a redação atingiu o mínimo, chama `POST candidatoprova/{oid}/finalizarprova` e vai para a conclusão. Erro do servidor é mostrado com `error.error.message`. Se a redação está abaixo do mínimo: "Impossivel finalizar, pois a redação ainda não atende ao requisito mínimo de tamanho para o encerramento da prova." — `page.component.ts:231-273` — validação.
23. **Sair e voltar.** Não há aviso ao fechar a aba. Ao reentrar pelo link, a situação `PROVA_INICIADA` leva de volta à prova, e o cronômetro continua contando a partir de `horarioinicio` do servidor. Respostas já salvas são relidas do servidor. — regras 6, 10 e 16.
24. **Sem paginação nem embaralhamento.** A ordem de cadernos, questões e alternativas é a que o backend devolve.

### C. Redação

25. **Tamanho mínimo.** 300 caracteres, contados sem espaços (`/\S/g`) e sem tags HTML. A redação só é considerada suficiente com **mais de** 300 (`300 − n < 0`). — `environments/environment.ts:8`, `vestibular/components/essay/essay.component.ts:19, 113-116, 155-163` — limite.
26. **Aviso de mínimo.** "FALTAM {n} CARÁCTERES PARA ATINGIR O MÍNIMO EXIGIDO" enquanto faltar pelo menos 1. — `essay.component.html:56-58`.
27. **Tamanho máximo.** 3000, medido por `editor.getLength()` do Quill (conta espaços). O excedente é apagado e aparece "LIMITE MÁXIMO ATINGIDO". — `environment.ts:9`, `essay.component.ts:120-125` — limite.
28. **Salvamento.** O texto (HTML) é enviado ao servidor quando o editor perde o foco e ao clicar em "Salvar rascunho" (`POST …/responderquestao` com `respostaTextual`). A cada tecla, só é gravado em `localStorage['rascunho']`. — `essay.component.ts:95-96, 111-141, 181-204` — transição.
29. **Mensagem de rascunho.** "Salvar rascunho" mostra "Parabéns!" / "O rascunho foi salvo." sem esperar a resposta do servidor. — `essay.component.ts:132-140`.
30. **Rascunho local prevalece.** Ao abrir a redação, se há `rascunho` no `localStorage`, ele substitui o texto vindo do servidor. — `essay.component.ts:72-90`.
31. **Indicador de mínimo desatualizado durante a digitação.** O indicador usado para liberar a entrega só é recalculado ao carregar, ao perder o foco e ao salvar. — `essay.component.ts:142-163, 181-186`.
32. **Editor.** Sem corretor ortográfico (`spellcheck=false`); formatações: negrito, itálico, sublinhado, alinhamento, fórmula, lista numerada e com marcadores. Colar é bloqueado pela regra 8. — `essay.component.html:27-55`.

### D. Resultado

33. **Tempo de prova mostrado.** `horariofim − horarioinicio`; sem `horariofim`, mostra o tempo máximo. — `vestibular/components/conclusao/conclusao.component.ts:105-140` — cálculo.
34. **Correção automática.** Se a lista de tipos de prova (`GET candidatoprova/{oid}/tipoprova`) não contém `REDACAO`, o front chama `POST candidatoprova/{oid}/corrigir-prova-objetiva` e mostra "Você foi {situacao} no exame vestibular." com o texto devolvido. — `conclusao.component.ts:157-170`, `conclusao.component.html:21-23` — transição.
35. **Com redação.** Mostra "Aguardando a correção da prova" e "Pronto, agora é só acompanhar a data do resultado em:" com link e botão "Ir para o site". — `conclusao.component.html:12-28`.
36. **Endereço do site.** Se `UNID_REF == 'unid32'`: `https://ead.candidomendes.edu.br/`; senão `https://eupossoestudarnacandido.com.br/{sigla da unidade em minúsculas, sem acento, com hífens}`. — `conclusao.component.ts:192-196`, `shared/pipe/unidade-filter.pipe.ts` — integração.
37. **Aprovado sem redação.** Botão "Terminar o cadastro" leva ao site externo `FORM_URL/{cpf}`, não à rota `/formulario`. — `conclusao.component.ts:198-219` — transição.
38. **Reprovado sem redação.** Com tentativas restantes, botão "Tentar novamente" recarrega `/vestibularonline/{oid}?tentativa={atual+1}`. — `conclusao.component.ts:202-205`, `conclusao.component.html:34-38` — transição.

### E. Cadastro pós-aprovação (formulário → upload → contrato → finish)

39. **Fluxo sem entrada ativa.** Nenhuma navegação ativa do código leva a `/formulario`: o mapa de etapas no login está comentado (`login.component.ts:250-252`) e a conclusão sai para o site externo (regra 37). As telas existem e se encadeiam entre si.
40. **Etapas da inscrição** gravadas em `POST candidatoprova/{oid}/etapa`: `FORM`, `UPLOAD`, `CONTRACT`, `FINISH` (e `BANK_SLIP` só no mapa do login); `null` ao voltar do formulário. — `login.component.ts:262-268`, `form.component.ts:228-245`, `upload.component.ts:292-308`, `contract.component.ts:108-125`.
41. **Campos pré-preenchidos são travados.** Todo campo que chega com valor fica desabilitado; só os vazios são editáveis. Data de nascimento com ano 1900 conta como vazia. — `vestibular/components/form/form.component.ts:299-336` — validação.
42. **Obrigatórios do formulário.** Celular (obrigatório, mínimo 9 caracteres), data de nascimento, CEP, logradouro, número, bairro, cidade, UF. Complemento é opcional. Nome, sexo, e-mail e "Repita o email" não têm validador; os dois e-mails não são comparados. — `form.component.ts:17-60`.
43. **Máscaras.** CPF `000.000.000-00`; celular `(00) 00000-0000`; nascimento `00/00/0000` (mantém as barras); CEP `00000-000`; ano de conclusão `0000`; na impressão do contrato, CEP `00.000-000`. — `form.component.html:14, 43, 48, 55, 84`.
44. **Sexo.** `M` Masculino, `F` Feminino; para o responsável, o valor fixo `I`. — `form.component.ts:62-65, 39`.
45. **Menor de idade.** Com menos de 18 anos na data atual, os campos "CPF do responsável legal" e "Responsável legal" são habilitados e obrigatórios. Com 18 ou mais, o responsável é removido do envio. — `form.component.ts:193-203, 261-282`.
46. **Responsável ≠ candidato.** CPF igual ao do candidato gera "O candidato não pode ser seu próprio responsável legal." — `form.component.ts:176-191, 256-257, 285-292`.
47. **Busca do responsável.** Com 11 ou mais dígitos, busca a pessoa por CPF e preenche. Se não existir, é criada no envio com valores-padrão: e-mail `--`, naturalidade `--`, nascimento e emissão do CPF `31/12/1900`. — `form.component.ts:31-42, 193-197, 293-296`.
48. **CEP.** Com 8 ou mais caracteres, consulta `cep-promise` e preenche UF, cidade, bairro e logradouro; campos preenchidos voltam a travar. — `form.component.ts:338-361`.
49. **Outros valores fixos.** Mensagens: "Campo requerido", "Valor mínimo: N", "Valor máximo: N", "Valor inválido". Telefone é enviado como `{ddd: 2 primeiros dígitos, numero: resto}`; tipo de endereço `001`; correspondência `true`; status da pessoa `A`. — `form.component.ts:247-258, 209, 46-49, 30`.
50. **Boleto antes de avançar.** "Próximo passo" só habilita depois de clicar em "Baixar boleto" e com os dois formulários válidos. Aviso: "Antes de prosseguir no cadastro, faça o download do boleto da primeira mensalidade." Dica do botão: "Faça download do boleto antes de prosseguir." — `form.component.html:119-145`.
51. **Quando o boleto é dispensado.** O botão de boleto some (e o avanço é liberado) se a emissão está desligada para o tipo de unidade, **ou** se cotas de bolsa social estão ligadas para o tipo de unidade **e** o candidato tem `bolsasocial` **e** `resposta2` é "Nenhuma renda" ou "Até 1 salário mínimo". — `form.component.ts:68-71, 111-118` — permissão.
52. **Configuração por tipo de unidade.** — `environments/environment.prod.ts:7-18`, `environment.ts:11-22`.
    - Boleto: produção desligado para EAD, SEMIPRESENCIAL e PRESENCIAL; desenvolvimento ligado para os três.
    - Cotas de bolsa social: só PRESENCIAL, nos dois ambientes.
53. **Tipo de unidade.** EAD se o código começa com `polo` ou `hibri` ou é `unid32`; SEMIPRESENCIAL se começa com `semi`; senão PRESENCIAL. — `data.service.ts:61-69`.
    - Para contrato e boleto, o critério é outro: é tratado como EAD se o código é `unid32` ou **contém** `polo`, `hibri` ou `semi`. — `form.component.ts:142-149`, `contract.component.ts:66`.
54. **Boleto EAD.** `POST …/financeiro/boleto/primeira-mensalidade-asaas?quantidade-disciplina=6` (6 fixo); a agência bancária é a primeira de `polo19` (fixo). — `app.service.ts:259-265`, `form.component.ts:105-109`.
55. **Boleto presencial.** `POST …/boleto/primeira-mensalidade-asaas?quantidade-disciplina={n}`, com `n` padrão 5; na tela `/bank-slip` pode ser 5 ou 6. Corpo: `oidformaingressopessoa`, `datavencimento`, `escolapublica`, `descontos: []`. — `form.component.ts:77-84, 363-384`, `bank-slip.component.ts:15-29`.
    - `datavencimento` é `null` no formulário e no finish; em `/bank-slip` é hoje + 2 dias.
56. **Escola pública.** A pergunta "Estudou em escola pública" (Sim/Não, padrão Não) só aparece para a unidade `unid01`. — `form.component.html:68`, `bank-slip.component.html:20`.
57. **Documentos e obrigatoriedade.** — `vestibular/components/upload/upload.component.ts:23-96` — enumeração.
    - Obrigatórios: `CPF`, `IDENTIDADE`, `DECLARACAO_CONCLUSAO_ENSINO_MEDIO` ("Comprovante de Conclusão do Ensino Médio (Certificado, Histórico ou Declaração)").
    - Opcionais: `COMPROVANTE_DE_RESIDENCIA`, `CERTIDAO_DE_NASCIMENTO_OU_CASAMENTO`, `HISTORICO_ESCOLAR`, `COMPROVANTE_DE_CONVENIO`, `FOTO_3X4`.
    - `COMPROVANTE_DE_RENDA` entra como obrigatório quando o candidato tem `bolsasocial`. — `upload.component.ts:185-197`.
58. **Formatos aceitos.** PNG, JPEG e PDF; a foto 3x4 só PNG e JPEG. Não há limite de tamanho no front. — `upload.component.ts:29, 92`.
59. **Envio do arquivo.** Imediato ao escolher (`POST persistence-context/documentos/{oidpessoa}/upload/{tipo}`). Depois de enviado, o botão de anexar fica desabilitado: não há troca nem exclusão. Há link "baixar". — `upload.component.ts:230-246`, `upload.component.html:39-44`.
60. **Avanço do upload.** "Próximo passo" exige os 4 campos da escola, o IP e todos os documentos obrigatórios. — `upload.component.html:57-63`, `upload.component.ts:212-216`.
61. **IP do candidato.** Obtido de `https://api.ipify.org/?format=json` e obrigatório no termo. — `upload.component.ts:109, 200-204`.
62. **Termo de compromisso.** Se falta qualquer documento da lista (inclusive opcional) e ainda não há termo salvo, abre o diálogo do termo. Ao aceitar, grava o termo (`prazo: 60`) e um registro de documento pendente por documento faltante. Sem faltantes e sem termo, grava o termo direto. — `upload.component.ts:98-110, 248-286`.
63. **Texto do termo.** Cita "item 7.3 do Edital de Inscrição", "artigo 11º e 12º da Portaria Nº 1.095/2018 do MEC" e que os documentos devem ser apresentados "até o fim do 1º semestre letivo", sob pena de a matrícula não ser renovada. — `upload.component.ts:346-365`, `upload-term.dialog.html:3-31`.
64. **Origem do contrato.** EAD: `GET persistence-context/contratoingressante/{fip}/{unidade}/contrato` (campo `descricao`). Presencial: `GET {API_CONTRACT}/webservice/processoseletivo/formaingressopessoa/{fip}/clausulas-contrato-ingressante` (campos `cabecalho` e `clausulas`). Erro vira toast "Atenção!". — `vestibular/components/contract/contract.component.ts:60-89`.
65. **Aceite do contrato.** "Imprimir" e "Aceitar" ficam desabilitados até o contrato carregar. "Aceitar" faz `POST candidatoprova/{oid}/aceitacontrato?aceite=true` e vai para o finish. Com contrato já aceito, os rótulos viram "Próximo" e "Voltar". "Rejeitar" só volta ao upload; não grava recusa. — `contract.component.ts:91-106`, `contract.component.html:90-96`.
66. **Menor de 18 no contrato.** A impressão traz "Possui menos de 18 anos?: Sim/Não". — `contract.component.html:36`.
67. **Tela final.** "Baixar boleto" aparece se a emissão está ligada, o candidato não se enquadra na dispensa da regra 51 e a situação não é `MATRICULADO`. — `vestibular/components/finish/finish.component.ts:54-59`.

### F. Isenção — candidato

68. **Acesso.** Por link com `oidFormaIngressoPessoa`, sem login. — `isencao/components/isencao/isencao.component.ts:38-49`.
69. **Situação do pedido** (`isencao.status`). — `isencao.component.ts:93-107`.
    - `PENDENTE_ANALISE` → "Aguardando a análise"
    - `ANALISADO_COM_PENDENCIA` → "Pendente atualização do candidato"
    - `CONCLUIDO` → "Concluído"
70. **Situação da disciplina** (`disciplina.aceita`). — `isencao.component.html:54-60`.
    - `ACEITO` → "Isento"
    - `RECUSADO` → "Sem isenção"
    - `PENDENTE` com motivo → "Com pendência" (motivo exibido em destaque)
    - demais → "Em análise"
71. **Envio de documento.** Permitido em `PENDENTE_ANALISE` e `ANALISADO_COM_PENDENCIA`; bloqueado em `CONCLUIDO`. Descrição e arquivo são obrigatórios ("Obrigatório"). Formatos `.png`, `.jpg`, `.pdf`. — `isencao.component.ts:29-32, 101-107`, `isencao.component.html:89-111`.
72. **Histórico e ementa.** Aviso "É necessário o envio ao menos do histórico e da ementa", mas o front não confere quais documentos foram enviados. — `isencao.component.html:91`.
73. **Lista em análise.** "A lista de isenção está em análise. Por favor, aguarde." aparece quando não há semestres e a situação é `PENDENTE_ANALISE`. — `isencao.component.html:65-67`.
74. **Observação do avaliador.** Aparece como "Obs.: …". — `isencao.component.html:34-38`.

### G. Isenção — análise (admin)

75. **Listas.** Em análise: `GET isencao/{unidade}/{pessoa}/analize/courses`; concluídos: `…/analized/courses`. Usam a unidade selecionada e a pessoa do usuário logado. — `admin/isencao/components/isencao/admin-isencao.service.ts:39-68`, `admin-isencao.component.ts:96-146`.
76. **Agrupamento e ordem.** Unidade → curso; candidatos por data de solicitação, mais recente primeiro; cursos em ordem alfabética. — `admin-isencao.component.ts:288-310`.
77. **Filtros de situação (em análise).** — `admin-isencao.component.ts:206-255`.
    - "Aguardando envio" = `PENDENTE_ANALISE` com 0 documentos.
    - "Aguardando a análise" = `PENDENTE_ANALISE` com documentos.
    - "Aguardando o candidato" = `ANALISADO_COM_PENDENCIA`.
78. **Rótulo de situação na lista.** Sem documentos: "Envio de documentos pendente"; senão, os rótulos da regra 69. — `admin-isencao.component.ts:397-407`.
79. **Busca por nome.** Compara com o texto digitado em maiúsculas, com espera de 300 ms. — `admin-isencao.component.ts:149-190, 229-233`.
80. **Unidade.** O filtro por unidade e o cabeçalho de unidade só aparecem para EAD (unidade começa com `polo`, `semi`, `hibri` ou é `unid32`); fora do EAD os grupos já vêm abertos. — `admin-isencao.component.ts:579-586`, `admin-isencao.component.html:73, 167, 175`.
81. **Avaliar sem documentos.** Abre o diálogo "Nenhum documento enviado para análise!" em vez da avaliação; a linha mostra telefone e e-mail do candidato. — `admin-isencao.component.html:208-217, 234-238`.
82. **Matriz curricular.** Ao abrir, lista as matrizes. Se o candidato já tem `codigomatriz`, ela é selecionada; se só existe uma, também. Sem matriz: "Matriz não selecionada." Em pedido `CONCLUIDO`, a troca é ignorada. — `admin-isencao.component.ts:426-454`, `admin-isencao.component.html:387-410, 658`.
83. **Decisão por disciplina.** Três estados: `ACEITO` (polegar para cima), `PENDENTE` (alerta), `RECUSADO` (polegar para baixo). Disciplina `PENDENTE` sem motivo é tratada como sem decisão. — `admin-isencao.component.ts:479-489, 500-502`, `admin-isencao.component.html:531-567`.
84. **Dados exigidos em ACEITO.** "Disciplina de origem", "IES de origem" e "Carga horária", cada um com até 150 caracteres. Mensagens: "Erro no Nº semestre, {disciplina} sem descrição!", "… sem IES!", "… sem carga horária!". — `admin-isencao.component.ts:594-620`, `admin-isencao.component.html:611-644`.
85. **Dados exigidos em PENDENTE.** "Alteração a ser comunicada ao candidato", obrigatória, até 300 caracteres (contador `n/300`). Mensagens: "… sem motivo!", "… o motivo ultrapassa o limite de caracteres!". Aviso: "Esse texto vai ser apresentado na tela de acompanhamento do candidato. E o processo ficará como o status de **Pendente atualização do candidato**." — `admin-isencao.component.ts:621-638`, `admin-isencao.component.html:579-599`.
86. **RECUSADO** não exige justificativa. O front também não exige que todas as disciplinas tenham decisão para finalizar. — `admin-isencao.component.ts:588-648`.
87. **Observação geral.** Até 150 caracteres; "O candidato verá esta observação na tela de acompanhamento da isenção". — `admin-isencao.component.html:493-508`.
88. **Salvar × Finalizar.** "Salvar" grava parcial (`POST isencao/{fip}/evaluate?partial=true`) sem validar e envia a observação. "Finalizar" (`POST isencao/{fip}/evaluate`) só habilita com as regras 84 e 85 satisfeitas; o código de `onSave` não copia a observação do formulário para o envio. Ambos exigem matriz. — `admin-isencao.component.ts:349-387, 504-548`.
89. **Pedido concluído é só leitura.** Os botões de decisão não respondem; "Salvar" e "Finalizar" somem; a observação vira texto. — `admin-isencao.component.html:503-507, 537-563, 685-703`.
90. **E-mail após salvar.** Depois de salvar ou finalizar com sucesso, o front tenta `POST {emailService}api/email/enviar`. Falha não afeta o salvamento. — `admin-isencao.service.ts:238-324, 370-387`.
    - Assunto "Isenção Atualizada - UCAM"; mensagem "Sua isenção foi atualizada com sucesso no sistema"; variáveis nome, matrícula (ou "N/A") e curso (ou "N/A").
    - É pulado se não há e-mail válido do destinatário nos dados ou se o endereço do serviço ainda contém `DEPLOY_EMAIL_SERVICE`.

### H. Correção de redação

91. **Filtros obrigatórios.** As listas só carregam com período, forma de ingresso, data inicial e data final preenchidos. — `admin/correcao/redacao/admin/admin.component.ts:22-28, 59-63`.
92. **Intervalo de datas.** O seletor só habilita depois de escolher o período; as datas vão ao servidor como `aaaa-mm-dd`. — `admin/correcao/redacao/sidebar/sidebar.component.html:32-36`, `admin.component.ts:74-83`.
93. **Paginação e ordenação no servidor.** `size` (padrão 10; opções 5, 10, 25, 100), `page`, `sort`. — `app.service.ts:9-13, 52-102`.
    - Chaves de ordenação: `formaingressopessoa.pessoa.nome`, `dataprova`, `formaingressopessoa.periodounidadecurso.unidadecurso.curso.nome`.
94. **Todas as unidades.** O parâmetro `todasUnidades` vale `true` só quando `UNID_REF === 'unid32'`. A unidade selecionada não é enviada nessas duas buscas. — `app.service.ts:58, 84, 211-213`.
95. **Nota da redação.** De 0 a 10 em passos de 0,5 (controle deslizante); gravada com `POST candidatoprova/{oid}/notaredacao {nota}`. — `admin/correcao/redacao/admin/modal/modal.component.html:72-79`, `modal.component.ts:70-76`.
96. **Não há no front:** critérios ou competências de correção, botão de zerar, motivo de anulação, segunda correção, discrepância entre corretores, nem identificação de quem corrigiu. A nota é um número único.
97. **Redação em branco.** Com 0 caracteres aparece "O candidato não redigiu redação"; ainda assim é possível salvar nota. — `modal.component.html:148-151`.
98. **Regravar nota.** Em "Visualizar" (prova já corrigida) o mesmo diálogo abre com a nota carregada e o botão "Salvar" continua presente. — `modal.component.ts:63-67`, `modal.component.html:162-165`.
99. **Correção de objetivas pelo admin:** tela sem conteúdo (regra do item 1.3). A correção da objetiva é disparada pelo navegador do candidato (regra 34).

### I. Cadastro de cadernos e questões

100. **Chave do caderno.** Processo seletivo (ano/semestre) + forma de ingresso + captação resolvem uma "vigência da forma de ingresso"; só então os cadernos são buscados. Qualquer mudança no filtro limpa a lista. — `admin/cadastro/components/sidebar-cadastro/sidebar-cadastro.component.ts:38-102`.
101. **Tipo de caderno criável.** Só `REDACAO`: os demais (Português, Conhecimentos gerais, Matemática) estão comentados. — `admin/cadastro/components/main/main.component.ts:34-39`.
102. **"Adicionar redação"** só aparece quando a combinação não tem nenhum caderno. — `main.component.html:42-46`.
103. **Questão.** Campos: texto de referência (HTML), enunciado (HTML), pontuação de 0 a 10 em passos de 0,5 (padrão 0), ordem (padrão 0, sem campo na tela). Não há cadastro de alternativas. — `admin/cadastro/components/main/modal-cadastro/modal-cadastro.component.ts:15-21`, `modal-cadastro.component.html:24-32`.
104. **Editar e excluir.** A atualização envia `status: 'A'`. A exclusão de questão e de caderno é direta, sem confirmação. — `modal-cadastro.component.ts:57-78`, `main.component.ts:150-154`.
105. **Formato da captação** (pipe não usado em tela): "{início} à {fim} - Captacão {n}". — `shared/pipe/captacao-mask.pipe.ts`.

### J. Login admin e perfis

106. **Login por token na URL.** `admin/login/:token/:usuario` dispara a busca do usuário, das unidades e da pessoa em `API_MENU`. A primeira unidade vira a selecionada. — `admin/login/components/login/login.component.ts:44-54`, `core/services/auth/store/auth.effects.ts:20-85`.
107. **Token não é validado nem reenviado pelo front.** Não existe interceptor HTTP; o token só é guardado no estado. As chamadas de login levam o cabeçalho `Unidade-Ref`. — `auth.effects.ts:18`.
108. **Sessão.** Fica em `localStorage['AuthState']`. O guard só olha `authenticated`; se falso, faz logout e redireciona para `LOGIN_URL` (`https://login.ucam-campos.br/login.jsf?client_id=aplicVestOnline@ucam` em produção). — `auth.reducers.ts:13-55`, `auth-guard.service.ts:20-29`.
109. **Perfis.** O front não tem nenhuma noção de perfil ou papel: qualquer usuário autenticado abre qualquer tela admin, e a correção de redação nem exige autenticação.
110. **Exceção fixa de usuário.** O usuário `de8e8262-ac52-4314-9c01-a2f62e0a2033` com unidade `unid14` é tratado como `unid15`. — `auth.effects.ts:27-32`, `admin/login/components/home/home.component.ts:39-46`.
111. **Identificador da aplicação:** `aplicVestOnline`. — `environments/environment.ts:38`.

### K. Formatação

112. CPF exibido como `000.000.000-00`. — `shared/pipe/cpf-mask.pipe.ts`.
113. Turno: `MANHA`/`M` → Manhã, `TARDE`/`T` → Tarde, `NOITE` → Noite, `N` → Noturno, `DIURNO` → Diurno, `NOTURNO` → Noturno. — `shared/pipe/turno-mask.pipe.ts`.
114. Curso em minúsculas com inicial maiúscula e abreviações: ENGENHARIA → eng., ANALISE → anal., DESENVOLVIMENTO → dev., SUPERIOR → sup., TECNOLOGIA → tec. — `shared/pipe/curso-mask.pipe.ts`.
115. Datas em `dd/MM/yyyy`; por extenso (`dd 'de' MMMM 'de' yyyy`) no termo e no contrato. Locale `pt-BR`.

---

## 5. API consumida

Bases: `backend` (ex.: `http://localhost:8030/`), `backend_api` = `backend + vestibularonline/`, `API_MENU`, `API_CONTRACT`, `API_SIGFIN`, `API_EAD_BANK_INVOICE`, `emailService`.

**`AppService`** (`app.service.ts`)

Em `backend_api`:
- `GET candidatoprova/search/findbyformaingressopessoa?oidformaingressopessoa=`
- `POST candidatoprova?oidformaingressopessoa=[&tentativa=]`
- `POST candidatoprova/{oid}/iniciarprova`
- `POST candidatoprova/{oid}/finalizarprova`
- `GET candidatoprova/{oid}/cadernoprova`
- `POST candidatoprova/{oid}/responderquestao` — corpo `{oidQuestao, oidAlternativa, respostaTextual}`
- `GET respostacandidato/search/find-resposta-por-questao?oidQuestao=&oidCandidato=`
- `GET respostacandidato/search/find-resposta-redacao?oidCandidato=`
- `GET candidato/{oid}/tempo-maximo-prova`
- `GET candidatoprova/{oid}/tipoprova`
- `POST candidatoprova/{oid}/corrigir-prova-objetiva` (resposta em texto)
- `GET` e `POST candidatoprova/{oid}/etapa` (texto)
- `POST candidatoprova/{oid}/aceitacontrato?aceite=`
- `GET formaingressopessoa/{oid}/tentativas`
- `GET candidatoprova/search/find-candidatos-para-correcao` e `…/find-candidatos-prova-corrigida` — parâmetros `oidPeriodoIngresso, oidFormaIngresso, dataInicio, dataFim, todasUnidades, size, page, pesquisa, sort`
- `POST candidatoprova/{oid}/notaredacao` — corpo `{nota}`

Em `backend`:
- `GET data-context/periodoingresso/search/findPeriodoingressoComCandidatosProvaOnline?oidUnidade=`
- `GET data-context/formaingresso/search/findFormaingressoComCandidatosProvaOnline?oidUnidade=`
- `GET data-context/candidato/{oid}?projection=candidato-inline`
- `GET data-context/pessoa/search/findByNumeroCpf?cpf=`
- `GET data-context/pessoa/{oid}/documentoescaneadoCollection`
- `GET persistence-context/pessoa/pessoacompleta/{oid}?withCpf&withTelefones&withEnderecos`
- `POST` e `PUT persistence-context/pessoa`
- `POST persistence-context/pessoa/endereco`
- `POST persistence-context/documentos/{oidpessoa}/upload/{tipo}` (multipart `file`)
- `GET persistence-context/documentos/load?path=` (blob)
- `POST persistence-context/termocompromissodocumentopendente`
- `GET persistence-context/termocompromissodocumentopendente/search/findbyformaingressopessoa?oidformaingressopessoa=`
- `POST persistence-context/documentopendenteingressante`
- `GET persistence-context/contratoingressante/{fip}/{unidade}/contrato`

Externos:
- `GET {API_CONTRACT}/webservice/processoseletivo/formaingressopessoa/{fip}/clausulas-contrato-ingressante`
- `GET {API_EAD_BANK_INVOICE}/processo-seletivo/data-context/modelocontrato/search/findByUnidade?oidunidade=&size=1&sort=data,DESC` (definido, não usado)
- `POST {API_SIGFIN}/boleto/primeira-mensalidade-asaas?quantidade-disciplina=` (blob)
- `GET {API_EAD_BANK_INVOICE}/processo-seletivo/data-context/unidade/{oid}/agenciabancariaCollection`
- `POST {API_EAD_BANK_INVOICE}/financeiro/boleto/primeira-mensalidade-asaas?quantidade-disciplina=6` (blob)
- `GET https://api.ipify.org/?format=json`
- `GET` em URLs HATEOAS devolvidas pelo backend (`getData`)

**`CadastroService`** (`admin/cadastro/cadastro.service.ts`)
- `GET {backend}data-context/periodoprocessoseletivo/search/findByUnidade?oidUnidade=`
- `GET {backend_api}formaingresso/search/find-formaingresso-vestibularonline/`
- `GET {backend_api}captacao/search/findall`
- `GET {backend_api}cadernoprova/search/find-cadernoprova-by-processoseletivo?oidPeriodoProcessoSeletivo=&oidFormaIngresso=&oidCaptacao=`
- `POST`, `PUT {backend_api}cadernoprova/`; `DELETE {backend_api}cadernoprova/{oid}`
- `POST`, `PUT {backend_api}questao/`; `DELETE {backend_api}questao/{oid}`
- `GET {backend}data-context/formaingressovigencia/search/findByProcessoSeletivo?oidPeriodoProcessoSeletivo=&oidFormaIngresso=&captacao=`

**`IsencaoService`** e **`AdminIsencaoService`** (em `backend`)
- `GET isencao/{fip}`
- `POST isencao/{fip}/upload` (multipart `file` + `descricao`)
- `GET isencao/{fip}/download/{oidanexo}` (blob)
- `GET isencao/{unidade}/{pessoa}/analize/courses`
- `GET isencao/{unidade}/{pessoa}/analized/courses`
- `GET isencao/{fip}/matrizes`
- `GET isencao/{fip}/matrizes/{oidmatriz}`
- `POST isencao/{fip}/evaluate[?partial=true]`
- `POST {emailService}api/email/enviar`

**`AuthEffects`** e **`CoreService`** (em `API_MENU`)
- `GET usuario/{oid}`
- `GET unidadeUsuario/search/usuario?oidusuario=&size=1000`
- `GET usuario/{oid}/pessoa`
- `GET menu-usuarios/search/all-menu-aplicacao-usuario` (não usado)
- `GET {API_REST}/unidade/search/all?term` (não usado)

**Modelos.** Só há interfaces tipadas para:
- `Pessoa {oid, sigla, razaosocial}`
- `Unidade {oid, sigla, razaosocial, oidUnidade}`
- `UsuarioLogado {oid, oidpessoa, nome, email, foto, token}`
- estado de autenticação `{usuario, unidades, unidadeSelecionada, token, authenticated}` (mais `email`, `foto`, `oidpessoa` no payload)
- `EmailNotification {destinatario, assunto, variaveis{nome, mensagem, matricula, curso}}`
- `EmailResponse {sucesso, mensagem?, erroId?, messageId?}`

O resto é `any`. Os campos abaixo foram deduzidos do uso:
- **CandidatoProva:** `oid, situacao, horarioinicio, horariofim, dataprova, aceitacontrato, formaingressopessoa`
- **FormaIngressoPessoa:** `oid, situacao, bolsasocial, resposta2, notaredacao, pessoa{oid, nome, cpf{numero}, datanascimento}, periodounidadecurso{turnoLabel, unidadecurso{curso{nome}, unidade{oid, sigla, cidade, uf}}, _links}`
- **Candidato (projeção inline):** `nomeCurso, turnoLabel, horarioinicio, horariofim, formaingressopessoa`
- **Caderno:** `oid, tipoprova, questoes[]`
- **Questão:** `oid, descricao, textoreferencia, pontuacao, ordem, alternativas[{oid, descricao}]`
- **Resposta:** `oidAlternativa, respostaTextual` (e `textoReferencia`, `descricaoQuestao` na redação)
- **Tentativas:** `tentativaAtual, totalTentativasPossiveis`
- **Pessoa completa:** `telefones[{tipotelefone, ddd, numero}], enderecos[{cep, logradouro, numero, complemento, bairro, cidade, uf}], tutor`
- **Termo:** `oid, formaingressopessoa{oid}, prazo, instituicaoensino, cidadeinstituicaoensino, estadoinstituicaoensino, anoconclusao, termocompromisso, ip`
- **Documento escaneado:** `tipo, path`
- **Isenção:** `status, curso, unidade, nome, cpf, telefone[], email, observacao, matriz, documentos[{oid, descricao, filename, datacriacao}], semestres{ n: [{nome, aceita, motivo, descricao, ies, cargaHoraria}] }`
- **Curso de isenção:** `nome, unidade, candidates[{nome, situacao, status, documentos, formaIngressoPessoa, periodoLetivo, datasolicitacao, dataalteracao, telefone, email, codigomatriz}]`
- **Matriz:** `oidmatriz, matriz`
- **Página:** `content[], totalElements, number`

---

## 6. O que o código não responde

**Prova e tempo**
1. De onde vem o tempo máximo (por processo seletivo, forma de ingresso, curso?) e se o backend encerra a prova sozinho quando o tempo acaba, já que o front não chama `finalizarprova` nesse caso (regra 13).
2. Se o backend recusa respostas enviadas depois do horário-limite.
3. Como `totalTentativasPossiveis` é definido e se uma nova tentativa sorteia outro caderno.
4. Critério de aprovação na objetiva (nota de corte, pesos por caderno) e como a pontuação da questão entra na nota.
5. Como as questões objetivas e suas alternativas são cadastradas, já que este front só cria caderno de redação e questão sem alternativas.
6. Se cadernos e questões são embaralhados ou sorteados por candidato.
7. Quem gera e envia ao candidato o link `/vestibularonline/{oid}` e se ele expira.
8. O mínimo de 300 e o máximo de 3000 caracteres da redação são validados também no backend? O backend aceita finalizar com redação curta?
9. Se o ramo "última questão → redação" funciona em produção (regra 19).

**Correção**
10. Quem pode corrigir redação: a rota está sem guard e o front não distingue corretor de administrador.
11. Se existe dupla correção, discrepância, nota zero com motivo ou critérios por competência no backend; no front há só uma nota de 0 a 10.
12. Como a nota da redação se combina com a objetiva e quem muda a inscrição para `APROVADO`/`REPROVADO` após a correção.
13. Se é permitido alterar uma nota já lançada (o front deixa, regra 98).
14. Qual unidade o backend usa para filtrar as listas de correção quando `todasUnidades` é falso.
15. Se a correção de objetivas pelo admin (`admin/correcao/questao`) deve existir ou foi abandonada.

**Cadastro pós-aprovação**
16. Se o fluxo interno formulário → upload → contrato → finish ainda é usado ou foi substituído pela "área do inscrito" externa (`FORM_URL`).
17. Lista completa de situações de `candidatoprova` e de `formaingressopessoa`; o front só conhece as citadas nas regras 6 e 7.
18. Valores possíveis de `resposta2` (faixas de renda) e a regra completa da bolsa social; o front só conhece as duas faixas da regra 51.
19. Valor, vencimento e descontos do boleto; por que 6 disciplinas no EAD e 5 no presencial; por que a agência é a de `polo19`.
20. O que o prazo `60` do termo representa (dias?) e o que acontece quando vence.
21. Limite de tamanho de arquivo e validação de tipo no backend.
22. Se "Rejeitar" o contrato deveria registrar algo.
23. Quem muda a situação para `MATRICULADO`.

**Isenção**
24. Como o pedido de isenção nasce (este front só acompanha e analisa) e quais modalidades de ingresso dão direito a ele.
25. Quem pode analisar: a lista depende da pessoa logada, mas a regra de vínculo (coordenador do curso? secretaria?) está no backend.
26. Quando o pedido passa a `ANALISADO_COM_PENDENCIA` ou `CONCLUIDO`: o front só envia as decisões; a transição é do backend.
27. Se "Finalizar" com disciplinas sem decisão é aceito pelo backend, e se a observação se perde nesse caminho (regra 88).
28. Os status exibidos em "Concluídos" (`candidate.status`) vêm prontos do backend; os valores possíveis não aparecem no código.
29. Se "histórico e ementa" é exigido pelo backend.
30. Se o serviço de e-mail está no ar em produção (o endereço é um marcador de deploy) e qual template usa.

**Acesso e perfis**
31. Quais perfis existem e o que cada um pode: o menu vem `null` e não há checagem no front; depende da lib `default-style` e do backend.
32. Se o backend exige o token nas chamadas (o front não o envia).
33. O que a lib `default-style` desenha de fato (cabeçalho, menu, seletor de unidade) e a API completa de `ucam-material`: as libs não estão instaladas na pasta.
34. Modalidades de ingresso: os nomes vêm do backend (`formaIngresso.descricao`); o front não tem enumeração nem regra por modalidade.
35. Por que o usuário `de8e8262-…` troca `unid14` por `unid15`.
36. Quais valores `UNID_REF` assume em cada implantação (comentário cita Campos `unid01`, Rio `unid19`; EAD `unid32` é deduzido do código).
