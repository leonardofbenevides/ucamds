# Gerencial-v3.0-2026 — levantamento de telas, padrões e regras (06/10/2026)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\Gerencial-v3.0-2026`. Monorepo: `frontend/` (Angular 22.1, standalone, sem biblioteca de UI), `backend/` (Maven multi-módulo, Spring Boot: `platform-core` + `gerencial`), `docs/` (33 ADRs, inventários do legado, runbook). O README declara o módulo "migrado e formalmente fechado" (ADR-0021).

Como li: frontend inteiro (rotas, templates, componentes, serviços, guard, interceptors, tokens de `styles.css`); os CSS por componente foram lidos só nos tokens. Backend: todos os controllers, requests, casos de uso de criar/excluir, entidades de domínio (validações) e tratador global de erros. ADRs e inventários: títulos e trechos (0020, 0021, 0033, itens fora de escopo), não o texto integral. O que não foi aberto está marcado "não confirmado".

Caminhos abaixo são relativos a `frontend/src/app/` (front) e a `backend/gerencial/src/main/java/br/ucam/sigu/gerencial/` (back), salvo indicação.

---

## 1. Rotas e telas

Fonte: `frontend/src/app/app.routes.ts`. Nenhuma rota é lazy; todas as de negócio usam `authGuard`.

| URL | Componente | Template | Guard |
|---|---|---|---|
| `/handoff` | `HandoffComponent` | inline em `features/sessao/handoff.component.ts` | nenhum |
| `/sessao-expirada` | `SessaoExpiradaComponent` | inline em `features/sessao/sessao-expirada.component.ts` | nenhum |
| `/` | `InicioComponent` | `features/gerencial/inicio/inicio.component.html` | `authGuard` |
| `/categoria/:slug` | `CategoriaComponent` | `features/gerencial/categoria/categoria.component.html` | `authGuard` |
| `/usuarios` | `UsuarioListagemComponent` | `features/gerencial/usuarios/usuario-listagem.component.html` | `authGuard` |
| `/usuarios/:oid` (`novo` = criação) | `UsuarioFormComponent` | `.../usuarios/usuario-form.component.html` | `authGuard` |
| `/aplicacoes` | `AplicacaoListagemComponent` | `.../aplicacoes/aplicacao-listagem.component.html` | `authGuard` |
| `/aplicacoes/:oid` | `AplicacaoFormComponent` | `.../aplicacoes/aplicacao-form.component.html` | `authGuard` |
| `/grupos` | `GrupoListagemComponent` | `.../grupos/grupo-listagem.component.html` | `authGuard` |
| `/grupos/:oid` | `GrupoFormComponent` | `.../grupos/grupo-form.component.html` | `authGuard` |
| `/unidades` | `UnidadeListagemComponent` | `.../unidades/unidade-listagem.component.html` | `authGuard` |
| `/unidades/:oid` | `UnidadeFormComponent` | `.../unidades/unidade-form.component.html` | `authGuard` |
| `/mantenedoras` | `MantenedoraListagemComponent` | `.../mantenedoras/mantenedora-listagem.component.html` | `authGuard` |
| `/mantenedoras/:oid` | `MantenedoraFormComponent` | `.../mantenedoras/mantenedora-form.component.html` | `authGuard` |
| `/cartoes-seguranca` | `CartaoSegurancaListagemComponent` | `.../cartoes-seguranca/cartao-seguranca-listagem.component.html` | `authGuard` |
| `/cartoes-seguranca/:oid` | `CartaoSegurancaFormComponent` | `.../cartoes-seguranca/cartao-seguranca-form.component.html` | `authGuard` |
| `/menus` | `MenuAdminListagemComponent` | `.../menus/menu-admin-listagem.component.html` | `authGuard` |
| `/menus/:oid` | `MenuAdminFormComponent` | `.../menus/menu-admin-form.component.html` | `authGuard` |
| `/permissoes/grupo` (`?aba=menus` ou `?aba=usuarios`) | `GrupoPermissoesComponent` | `.../permissoes/grupo-permissoes.component.html` | `authGuard` |
| `/permissoes/usuario-menu` | `UsuarioMenuComponent` | `.../permissoes/usuario-menu.component.html` | `authGuard` |
| `/permissoes/menu-usuarios` | `MenuUsuariosComponent` | `.../permissoes/menu-usuarios.component.html` | `authGuard` |

Não há rota curinga (`**`). O `authGuard` só testa se há token em memória (`core/guards/auth.guard.ts:15`); não há guard por permissão de menu no front.

### 1.1 Handoff — `/handoff`
- **Propósito**: receber o JWT de identidade no fragmento da URL e trocá-lo por sessão do módulo.
- **Arquétipo**: tela de espera (sem interação).
- **Peças**: spinner + texto "Validando sua identidade, aguarde."
- **UCAMDS**: **falta** tela de referência; peças existem (`skeleton`/`progress`, `empty-state`). Não há padrão "transição de sessão / handoff" no catálogo. O DS `portal/login` trata a entrada, não a chegada no módulo.

### 1.2 Sessão encerrada — `/sessao-expirada`
- **Propósito**: avisar que não há sessão e mandar a pessoa de volta ao sistema de origem.
- **Arquétipo**: página de estado (erro de sessão), fora da moldura.
- **Peças**: faixa de marca reduzida (só logotipo, "Universidade Candido Mendes" / "Módulo Gerencial"), cartão central com ícone de relógio, título "Sessão encerrada", texto "Sua sessão expirou ou ainda não foi iniciada.", rodapé "Volte à página inicial do sistema e entre novamente no **Módulo Gerencial**." Não há botão nem link.
- **UCAMDS**: **parcial** — `empty-state` + `card` servem; **falta** tela de referência de sessão expirada e a decisão de ter (ou não) ação "voltar ao portal".

### 1.3 Início — `/`
- **Propósito**: porta de entrada com busca de atalhos e os dois grupos de funcionalidades.
- **Arquétipo**: grade de atalhos (lançador), não painel de indicadores.
- **Peças**: herói com sobrelinha "Painel do módulo", título "Bem-vindo(a) ao Módulo Gerencial", campo de busca (placeholder "Ex.: Usuários, Grupos, Cartão de Segurança..."); seção "Acesso rápido" com 4 cartões fixos (`Usuários`, `Grupos`, `Menus`, `Grupo × Menu` — `inicio.component.ts:55`); seção "Todas as categorias" com contador "N itens" e 2 cartões (`Cadastros`, `Permissões`) mostrando prévia dos 3 primeiros itens e "Ver itens".
- **UCAMDS**: **parcial**. A tela `gerencial/inicio` existe mas é outra coisa (ver divergências). A base mais próxima é `portal/grade-modulos` (shell-aplicacao: grade de cartões) com `icon-tile`, `card`, `text-field`.

### 1.4 Categoria — `/categoria/:slug` (`cadastros`, `permissoes`)
- **Propósito**: listar as funcionalidades de uma categoria como cartões.
- **Arquétipo**: grade de atalhos (segundo nível do lançador).
- **Peças**: trilha "Início / Categoria", cabeçalho com ícone, contagem "N itens", grade de cartões (título + descrição). Slug inválido: "Categoria não encontrada. Voltar para o Início."
- **UCAMDS**: **parcial** — mesma base de `portal/grade-modulos`; não há tela de referência de "índice de categoria".

### 1.5 Listagens CRUD (7 telas, mesmo molde)
Molde comum: subtítulo, botão primário "+ Novo…", cartão com busca (campo + botão "Buscar", Enter dispara), faixa de erro, tabela, linha "Carregando..." / "Nenhum … encontrado." com "Limpar busca", rodapé "Exibindo a–b de N registros" e paginação "Anterior / Página x de y / Próxima" (só quando há mais de uma página). Ações de linha em texto: `Editar`, `Excluir` (perigo). Excluir abre o diálogo de confirmação compartilhado. Página de 20 registros.

| Tela | Subtítulo | Busca por | Colunas |
|---|---|---|---|
| Usuários | "Gerencie os usuários com acesso ao ecossistema SIGU." | login ou nome | Nome (`nomeExibicao`), Login, Status (`Ativo` / `Inativo` / `Bloqueado`), Ações |
| Aplicações | "Cadastro de aplicações e sua estrutura de menu." | sigla ou nome | Sigla, Nome, Status, Ações |
| Grupos | "Cadastro de grupos e permissão via grupo." | sigla ou nome | Sigla, Nome, Status, Ações |
| Unidades | "Coligadas/unidades da universidade." | sigla | Sigla, Cidade/UF, Status, Ações |
| Mantenedoras | "Mantenedoras responsáveis pelas unidades." | sigla ou razão social | Sigla, Razão social, CNPJ, Status, Ações |
| Cartão de Segurança | "Cartões de segurança vinculados a pessoas." | número do cartão ou nome | Pessoa (`nomePessoa`), Semente, Início, Fim (dd/MM/yyyy), Status, Ações |
| Menus | "Cadastro dos itens de menu de cada aplicação (estrutura da sidebar)." | nome ou legenda (filtro local) | Nome, Legenda, Link, Menu pai, Status, Ações |

Menus é a exceção: `GET /api/menus` não pagina; a tela filtra em memória e não tem paginação (`menus/menu-admin-listagem.component.ts:13`, `:72`).

- **Arquétipo**: listagem-crud.
- **UCAMDS**:
  - Usuários: **coberta** por `gerencial/usuarios` (com divergências fortes, ver §7).
  - Aplicações, Grupos, Unidades, Mantenedoras, Cartão de Segurança, Menus: **parcial** — padrão `listagem-crud`, base `gerencial/usuarios` ou `protocolo/naturezas`; peças `data-table`, `text-field`, `badge`, `pagination`, `empty-state`, `dialog`. Faltam as seis telas de referência. Para Menus falta decidir a representação de hierarquia (coluna "Menu pai" hoje; árvore não existe no DS como peça).

### 1.6 Formulários (7 telas, mesmo molde)
Molde comum: título "Entidade / Nome" ou "Entidade / Novo(a)", trilha e link "← Voltar para …" vindos da moldura, par `Cancelar` / `Salvar` no topo **e** no rodapé ("Salvando…" durante o envio), faixa de erro única no topo (mensagem do backend + lista de campos), cartões com grade de 2 colunas. Em edição: linha "Status atual: **ATIVO|INATIVO**" somente leitura. Sem validação por campo no cliente além de `required` no HTML; quem valida é o backend.

| Tela | Campos (rótulo → nome) |
|---|---|
| Usuário | **Pessoa vinculada**: Pessoa (opcional) → `oidPessoa` (combobox com busca remota por nome). **Acesso**: Login → `login` (bloqueado em edição); Login antigo (legado) → `loginAntigo` (só leitura, só em edição); Senha → `senha` (em edição: "Deixe em branco para não alterar"); Palavra-chave → `palavraChave` ("Usada na recuperação de acesso"); Data de expiração → `dataExpiracao` (date); interruptor Bloqueado → `bloqueado`; Motivo do bloqueio → `motivoBloqueio` (aparece e é obrigatório quando bloqueado). Aviso extra: oferta de restauração de usuário inativo. |
| Aplicação | Sigla → `sigla`; Nome → `nome`; Tipo de usuário (oid) → `oidTipoUsuario` (texto livre, com a dica "Combobox real ainda não disponível (agregado Tipousuario não migrado) — informe o oid.") |
| Grupo | Sigla, Nome, Descrição → `descricao`, Tipo de usuário (oid) → `oidTipoUsuario` (mesma dica) |
| Unidade | Sigla, Código → `codigo`, CNPJ, Razão social → `razaosocial`, Mantenedora → `oidMantenedora` (combobox, só ativas); Responsável, CPF do responsável → `cpfResponsavel`, Telefone, E-mail, Site; CEP, Logradouro, Número (number), Complemento (opcional), Bairro, Cidade, UF (maxlength 2) |
| Mantenedora | Sigla, Código, Razão social, CNPJ, Homepage, Responsável, CPF do responsável, Credenciamento (opcional) |
| Cartão de Segurança | Pessoa vinculada → `oidPessoa` (combobox remoto), Semente → `semente` (number), Data início, Data fim ("Deve ser igual ou posterior à data início.") |
| Menu | Nome, Legenda, Link, Aplicação → `oidAplicacao` (combobox; opcional; travada em edição: "Não pode ser alterada após a criação."), Menu pai → `oidMenuPai` (combobox; opcional: "deixe em branco para um item de primeiro nível") |

- **Arquétipo**: formulario-entidade.
- **UCAMDS**:
  - Usuário: **coberta** por `gerencial/usuario-form` (campos quase todos diferentes, ver §7).
  - Demais seis: **parcial** — padrão `formulario-entidade`, base `gerencial/usuario-form` / `protocolo/natureza-form`; peças `text-field`, `combobox`, `date-field`, `switch`, `alert`, `page-header`, `button`. Faltam as seis telas de referência. Não há no DS peça de campo com máscara de CNPJ/CPF/CEP (o app também não mascara).

### 1.7 Grupo × Menu / Grupo × Usuários — `/permissoes/grupo`
- **Propósito**: escolher unidade, depois grupo, e gerir quem pertence ao grupo e quais menus o grupo concede naquela unidade.
- **Arquétipo**: mestre–detalhe em três colunas (listagem-inspetor encadeado).
- **Peças**: coluna "1. Unidade" (busca por sigla com debounce de 300 ms, contagem, lista selecionável); coluna "2. Grupo" (legenda "grupos que atuam em **SIGLA**", busca local, lista "SIGLA — Nome", bloco "Vincular grupo" com combobox + botão); coluna "3. Usuários e menus" com duas abas (`Usuários`, `Menus`) refletidas em `?aba=`.
  - Aba Usuários: tabela `Nome | Padrão (Sim/Não) | Ações (Remover)`; rodapé "Vincular usuário" (combobox remoto + caixa "Padrão" + botão `Vincular`).
  - Aba Menus: blocos por aplicação ("SIGLA — Nome" + contagem; "Sem aplicação" para menus órfãos), cada um com tabela `menu | Revogar`; rodapé em dois passos "1. Aplicação" → "2. Menu a conceder" + botão `Conceder`.
- Cada clique grava na hora (não há "salvar lote").
- **UCAMDS**: **coberta** por `gerencial/grupo-menu` quanto à aba Menus (com divergências de modelo, ver §7); a aba **Usuários do grupo** não tem tela de referência → **parcial** (padrão `listagem-inspetor`, peças `list-item`, `tabs`, `data-table`, `combobox`).

### 1.8 Usuário × Menu — `/permissoes/usuario-menu`
- **Propósito**: conceder e revogar menus diretamente a um usuário, por unidade.
- **Arquétipo**: mestre–detalhe em três colunas.
- **Peças**: "1. Usuário" (busca remota por nome ou login); "2. Unidade" (legenda "todas as unidades ativas, para **Nome**"); "3. Menus" — blocos por aplicação com `menu | Revogar` e rodapé "1. Aplicação" → "2. Menu a conceder" → `Conceder`.
- **UCAMDS**: **parcial** — padrão `listagem-inspetor`; base `gerencial/grupo-menu`. O DS trata acesso direto dentro de `gerencial/usuario-detalhe` (seção "Acesso direto a menus"), não como tela própria.

### 1.9 Menu × Usuários — `/permissoes/menu-usuarios`
- **Propósito**: ver quem enxerga um menu numa unidade (por grupo ou diretamente) e conceder/revogar acesso direto.
- **Arquétipo**: mestre–detalhe em três colunas, com consulta.
- **Peças**: "1. Unidade"; "2. Menu" (menus agrupados por aplicação, busca por nome); "3. Usuários com acesso" — tabela `Nome | Grupo(s) | Acesso direto (Sim/Não) | Ações (Revogar, só para acesso direto)`; rodapé "Conceder acesso direto" (combobox remoto + `Conceder`).
- **UCAMDS**: **parcial** — padrão `listagem-inspetor`. A regra proposta no DS diz o contrário do sistema: "Menu × Usuários deixa de ser tela e vira filtro de Usuário × Menu" (`gerencial/grupo-menu`, regra 1).

### 1.10 Diálogos
| Diálogo | Onde | Texto literal | UCAMDS |
|---|---|---|---|
| Excluir registro (7 entidades) | listagens | título "Excluir usuário/aplicação/grupo/unidade/mantenedora/cartão de segurança/menu"; corpo `Excluir o usuário "<login>"? Esta ação marca o registro como inativo.` (análogo nas demais); botões `Cancelar` / `Excluir` (vermelho) | **coberta** pelo padrão `confirmacao-destrutiva` + `dialog` (o texto real diz que é inativação, não perda) |
| Remover usuário do grupo | `permissoes/grupo-permissoes.component.ts:457` | `Remover "<nome>" deste grupo, nesta unidade?` — `Remover` | **coberta** (padrão) |
| Revogar menu (grupo e usuário) | `grupo-permissoes.component.ts:497`, `usuario-menu.component.ts:348` | `Revogar o menu "<menu>" deste grupo, nesta unidade?` — `Revogar` | **coberta** (padrão) |
| Revogar acesso direto | `menu-usuarios.component.ts:270-275` | com grupo: `Revogar o acesso DIRETO de "<nome>" a este menu? Ele continuará tendo acesso via grupo (SIGLAS).`; sem grupo: `Revogar o acesso de "<nome>" a este menu, nesta unidade?` | **coberta** (padrão) |
| Trocar de base (tenant) | `shared/layout/app-shell.component.ts:873` | título `Trocar para a base <nome>?`; corpo "Você vai sair da base X e passar a trabalhar na base Y. Campus, menus e dados exibidos passam a ser os dessa base, e você volta para o Início (alterações não salvas na tela atual serão perdidas)."; botão `Trocar para <nome>` (não destrutivo) | **parcial** — `dialog` serve; não há padrão de "troca de contexto" |

Não há gaveta (drawer), toast nem modal de formulário no app.

---

## 2. Moldura e navegação

Peça única: `shared/layout/app-shell.component.ts` (`<app-shell [titulo] [itemAtivo]>`), usada por todas as telas autenticadas.

- **Faixa superior** (64 px, gradiente bordô fixo nos dois temas): botão de menu (só ≤980 px), pictograma da "igrejinha", "Universidade Candido Mendes" / "Módulo Gerencial", espaçador, busca "Buscar item de menu..." com atalho `/`, pílula "Base **X** · **SIGLA** ativa" (título: "Base de dados e Campus Universitário ativos"), botão de ajuda (abre `/assets/manual/index.html` em nova aba — manual do usuário embarcado), alternador de tema claro/escuro, chip do usuário (iniciais + nome) com menu de um item: `Sair`.
- **Lateral** (296 px; recolhida 72 px; estado em `localStorage`): seletor "Base de dados" (botões, só quando há mais de um tenant; dica "Trocar a base recarrega campus, menus e dados."), botão recolher, seletor "Campus Universitário" (combobox "Buscar campus..."), busca "Buscar item pelo nome...", item `Início`, rótulo "Categorias", árvore de menus vinda do backend (`GET /api/menus/minha-arvore?unidade=`), estados "Carregando menus...", erro com "Tentar novamente" e "Nenhum item encontrado para …"; rodapé "Módulo em migração gradual do SIGU legado."
- **Conteúdo**: aviso de troca de base (some sozinho em 8 s quando é sucesso), trilha "Início / Categoria / Funcionalidade / sub", link "← Voltar para …" nas telas de formulário, cabeçalho de página (ícone + h1 + categoria), conteúdo, rodapé "Módulo Gerencial — módulo em migração gradual do SIGU legado."
- **Conta**: só nome e `Sair`. Não há perfil, troca de senha nem preferências. `Sair` limpa a sessão em memória e leva a `/sessao-expirada` (`app-shell.component.ts:955`); não chama o backend nem volta ao portal.
- **Troca de unidade (campus)**: local, sem chamada própria; muda a unidade ativa e a árvore de menus é recarregada (`core/services/menu.service.ts:47-58`). A unidade inicial é a marcada `padrao` ou a primeira (`core/services/auth.service.ts:120`).
- **Troca de tenant (base)**: `POST /api/sessao/tenant` com confirmação; emite novo token, volta ao Início (ADR-0033).
- **Como a sessão chega**: o portal (dashboard externo) abre `/handoff#token=<JWT de identidade>`; o componente lê o fragmento, limpa a URL com `history.replaceState`, chama `POST /api/sessao` com o token no `Authorization` e recebe `accessToken`, `tenant`, `expiraEmMinutos`, `nomeUsuario`, `unidades[]`, `tenants[]` (`features/sessao/handoff.component.ts:76-93`, `core/services/auth.service.ts:88-122`). O token fica **só em memória** (signal): recarregar a página perde a sessão.
- **Sessão expirada**: qualquer 401 limpa a sessão e leva a `/sessao-expirada` (`core/interceptors/error.interceptor.ts:18-23`); rota protegida sem token faz o mesmo (`auth.guard.ts:18`). Não há renovação de token no front (o backend tem `refresh-expiration-minutes`, uso não confirmado).
- **Carregamento global**: overlay "Carregando..." para toda requisição HTTP (`app.component.html`, `core/interceptors/loading.interceptor.ts`).
- **Responsivo**: ≤980 px a lateral vira painel deslizante e busca/pílula somem da faixa.

---

## 3. Peças e estilo próprios

### Componentes compartilhados do app
| Peça | Arquivo | Props |
|---|---|---|
| `app-shell` | `shared/layout/app-shell.component.ts` | `@Input() titulo` (aceita "Feature / sub"), `@Input() itemAtivo`; `<ng-content>` |
| `app-menu-arvore-item` | `shared/layout/menu-arvore-item.component.ts` | `item: ItemMenu` (obrigatório), `nivel = 0`, `termoBusca = ''` — recursivo |
| `app-icone-categoria` | `shared/layout/icone-categoria.component.ts` | `nome` (obrigatório) — mapeia nome de categoria/funcionalidade para um SVG inline |
| `app-combobox-busca` | `shared/forms/combobox-busca.component.ts` | `opcoes: {oid, rotulo}[]`, `valor`, `placeholder = 'Digite para buscar...'`, `desabilitado`, `inputId`, `buscaRemota`, `required`; saídas `valorChange`, `buscar` (debounce 300 ms; mostra no máximo 30 sugestões) |
| `app-confirmacao-modal` + `ConfirmacaoService` | `shared/dialogo/*` | `confirmar(mensagem, {titulo='Confirmar ação', textoConfirmar='Confirmar', textoCancelar='Cancelar', perigo=false}) → Promise<boolean>`; `role="alertdialog"`, fecha com Esc e clique fora |
| utilitários | `shared/layout/menu-features.util.ts`, `menu-busca.util.ts`, `shared/models/problem-detail.util.ts` | catálogo fixo das 11 funcionalidades; filtro da árvore; `mensagemErro(problema, fallback)` |

Classes globais em `frontend/src/styles.css` (1.200+ linhas): `.btn-primary`, `.btn-secondary`, `.input`, `.mono`, `.campo-label`, `.dica`, `.card`, `.grid2`, `.lista` (tabela), `.badge` + `.badge-ativo` / `.badge-inativo` / `.badge-bloqueado`, `.acao` / `.acao.perigo`, `.erro` / `.erro.aviso`, `.vazio`, `.rodape`, `.paginacao`, `.breadcrumb`, `.page-head`, `.switch`, `.md-shell` / `.md-coluna` / `.md-linha` / `.md-aba` (mestre–detalhe), `.loading-overlay`, `.app-footer`.

### Tokens (`frontend/src/styles.css:19-71`, escuro em `:97-154`)
| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `#f5f6f8` | `#14161a` |
| `--surface` / `--surface-alt` | `#ffffff` / `#f0f1f3` | `#1b1e23` / `#24272d` |
| `--border` / `--border-strong` | `#dde1e6` / `#c7ccd3` | `#2c2f36` / `#3a3f48` |
| `--text` / `--text-muted` / `--text-faint` | `#212529` / `#5c6675` / `#8a93a1` | `#e8eaed` / `#a8b0bb` / `#7a8290` |
| `--accent` / `--accent-hover` | `#a91733` / `#8f0324` | `#d43a5c` / `#e8577a` |
| `--accent-soft` / `--accent-soft-border` | `#fbf1f4` / `#f7e4ea` | `#2a1219` / `#3a1620` |
| `--accent-fixo` / `--accent-fixo-hover` (faixa de marca) | `#a91733` / `#5c0217` | iguais |
| `--success` / soft / border | `#1c7d52` / `#e2f4ea` / `#a9dcc0` | `#4ade80` / `#16281e` / `#1f4a34` |
| `--error` / soft / border | `#b7362b` / `#fbeae8` / `#f0b7b0` | `#ff6b6b` / `#2e1618` / `#4a2325` |
| `--warning` / soft / border | `#95610a` / `#fbf0da` / `#e9c680` | `#e9b555` / `#332608` / `#513c0f` |
| raios | `--radius: 6px`, `--radius-lg: 10px`, `--radius-pill: 999px` | |
| espaços | `--space-sm: .5rem`, `--space-md: 1rem`, `--space-lg: 2rem` | |
| moldura | `--sidebar-largura: 296px`, `--sidebar-largura-colapsada: 72px`, `--topbar-altura: 64px` | |

- **Fontes**: Inter (400–700) e IBM Plex Mono (400, 500) por `@import` do Google Fonts (`styles.css:17`).
- **Ícones**: SVG inline no template, traço 2, sem biblioteca.
- **Tema**: `prefers-color-scheme` + `data-theme` em `<html>`, chave `gerencial-tema` no `localStorage`.
- **Marca**: `frontend/src/assets/identidade-visual/` (logotipos e manual de identidade em PDF/PNG).

### Relação com o UCAMDS
- **Não usa** `@ucam/*`, classes `.ucam-*`, MCP nem AGENTS do UCAMDS, nem `@universidade-candido-mendes/ucam-design-system` (nenhuma ocorrência no repositório).
- **Cita outra fonte**: a skill local `design-system-ucam` (caminho `C:\Users\ereni\.claude\skills\design-system-ucam`, ADR-0025 e ADR-0027) e o projeto `relatorios-academicos` (ADR-0022, ADR-0026). Cores e métricas foram "copiadas byte a byte de design-system-ucam, assets/main.css" (`app-shell.component.ts:333`). É o "DS portátil" de Relatórios Acadêmicos, não o UCAMDS deste repositório.
- Skills próprias do repositório em `.claude/skills/` (skill-frontend, skill-domain etc.) e comando `/migrar-modulo`.

---

## 4. Regras de negócio lidas no código

(B) = regra aplicada no backend. Tipos: validação, permissão, transição, cálculo, prazo, limite, formato, integração.

1. **Excluir é inativar.** Todo registro tem situação `ATIVO` ou `INATIVO`; no banco, `A` e `D`. — `domain/shared/StatusRegistro.java:19-36` — transição — (B). O diálogo diz "Esta ação marca o registro como inativo."
2. **Login de usuário é único entre ativos.** Mensagem: "Já existe um usuário ativo com o login '<login>'." (409, tipo `registro-duplicado`) — `application/usuario/CriarUsuarioUseCase.java:38-40` — validação — (B).
3. **Login de usuário inativo pode ser restaurado em vez de recriado.** Mensagem: "Existe um usuário inativo com este login. Deseja restaurá-lo?" (409, tipo `https://sigu.ucam.br/problems/registro-restauravel`, com `oidRegistroExistente`); a tela mostra "Existe um usuário inativo com este login. Deseja restaurá-lo em vez de criar um novo?" e o botão "Restaurar registro existente" (`POST /api/usuarios/{oid}/restaurar`). — `CriarUsuarioUseCase.java:42-44`; `features/gerencial/usuarios/usuario-form.component.ts:151-153`, `usuario-form.component.html:13-18` — transição — (B). Só Usuário tem restauração; nas demais entidades o inativo homônimo não bloqueia a criação.
4. **Login é obrigatório e tem no máximo 100 caracteres; senha é obrigatória na criação.** "Login é obrigatório", "Senha é obrigatória". — `presentation/rest/usuario/CriarUsuarioRequest.java:7-8` — validação/limite — (B). Não há regra de força de senha no código lido.
5. **Login não muda depois de criado.** O campo fica desabilitado em edição e o `PUT` não o aceita. — `usuario-form.component.html:40`; `presentation/rest/usuario/AtualizarUsuarioRequest.java:6-11` — validação.
6. **Em edição, senha em branco mantém a atual.** — `application/usuario/AtualizarUsuarioUseCase.java:38`; `usuario-form.component.html:52` — validação — (B).
7. **Bloquear exige motivo.** "Motivo do bloqueio é obrigatório." — `domain/usuario/Usuario.java:107-109` — validação — (B). Desbloquear não exige nada (`Usuario.java:115`).
8. **Bloqueado é situação exibida à parte e prevalece sobre Ativo/Inativo na listagem.** — `usuario-listagem.component.html:29-30` — cálculo. Texto de apoio: "Usuário bloqueado não consegue autenticar, mesmo com credenciais válidas." (`usuario-form.component.html:70`; o efeito na autenticação é do portal, não confirmado neste repositório).
9. **Usuário novo nasce ativo, sem bloqueio, com data de ativação de hoje.** — `domain/usuario/Usuario.java:62-73` — transição — (B).
10. **Vínculo com pessoa é opcional no usuário; a busca de pessoa só dispara com termo.** — `usuario-form.component.html:23`; `shared/pessoas/pessoa.service.ts:13-15` — validação.
11. **Na listagem, o nome mostrado é o nome de exibição da pessoa (ADR-0030).** — `usuarios/usuario.model.ts:5-11` — formato. Regra de composição do nome quando não há pessoa: não confirmado.
12. **Sigla de aplicação é única entre ativas.** "Já existe uma aplicação ativa com a sigla '<sigla>'." — `application/aplicacao/CriarAplicacaoUseCase.java:36-37`, `AtualizarAplicacaoUseCase.java:36` — validação — (B).
13. **Aplicação exige sigla, nome e tipo de usuário.** "Sigla é obrigatória." / "Nome é obrigatório." / "Tipo de usuário é obrigatório." — `domain/aplicacao/Aplicacao.java:36-42` — validação — (B). Na tela o tipo de usuário é um oid digitado à mão.
14. **Aplicação com menus ativos não pode ser excluída.** "Não foi possível excluir este registro pois o mesmo possui dependências: …" (409, tipo `registro-com-dependencia`, título "Registro possui dependências", com a lista de nomes). — `application/aplicacao/ExcluirAplicacaoUseCase.java:35-41`; `backend/platform-core/.../error/RegistroComDependenciaException.java:15` — validação — (B).
15. **Sigla de grupo é única entre ativos; grupo exige sigla, nome, descrição e tipo de usuário.** "Já existe um grupo ativo com a sigla '<sigla>'." — `application/grupo/CriarGrupoUseCase.java:33-34`; `domain/grupo/Grupo.java:42-51` — validação — (B). Dependências checadas ao excluir grupo: citadas no comentário de `ExcluirGrupoUseCase.java:18`, lista exata não confirmada.
16. **Sigla de unidade é única entre ativas; todos os campos são obrigatórios menos complemento.** "Já existe uma unidade ativa com a sigla '<sigla>'."; "<campo> é obrigatório."; "Número é obrigatório." — `application/unidade/CriarUnidadeUseCase.java:30-31`; `domain/unidade/Unidade.java:128-137`; `presentation/rest/unidade/UnidadeRequest.java:10-26` — validação — (B). Não há validação de dígito de CNPJ/CPF, de CEP nem de e-mail no código lido.
17. **Unidade só pode apontar para mantenedora ativa (na tela).** — `unidades/unidade-form.component.ts:75-77` — validação (front). Carrega no máximo 100 mantenedoras.
18. **CNPJ de mantenedora é único entre ativas; todos os campos obrigatórios menos credenciamento.** "Já existe uma mantenedora ativa com o CNPJ '<cnpj>'." — `application/mantenedora/CriarMantenedoraUseCase.java:29-30`; `domain/mantenedora/Mantenedora.java:84` — validação — (B).
19. **Mantenedora com unidades ativas não pode ser excluída.** — `application/mantenedora/ExcluirMantenedoraUseCase.java:35-41` — validação — (B).
20. **Número (semente) de cartão de segurança é único entre ativos.** "Já existe um cartão de segurança ativo com o número '<semente>'." — `application/cartaoseguranca/CriarCartaoSegurancaUseCase.java:29-30` — validação — (B).
21. **Cartão exige pessoa, número, início e fim; fim não pode ser anterior ao início.** "Pessoa é obrigatória." / "Número do cartão é obrigatório." / "Data de início é obrigatória." / "Data de fim é obrigatória." / "Data de fim não pode ser anterior à data de início." — `domain/cartaoseguranca/CartaoSeguranca.java:64-76` — validação/prazo — (B).
22. **O cartão é da pessoa, não do usuário.** — `cartoes-seguranca/cartao-seguranca.model.ts:1-8` — integração. Uma pessoa pode ter mais de um cartão ativo? não confirmado.
23. **Nome de menu é único entre ativos dentro da mesma aplicação (ou entre os sem aplicação).** "Já existe um menu ativo chamado '<nome>' na aplicação '<sigla>'." / "… sem aplicação." — `application/menu/CriarMenuUseCase.java:49-58`, `AtualizarMenuUseCase.java:39-47` — validação — (B) (ADR-0023).
24. **Menu exige nome, legenda e link; aplicação e menu pai são opcionais.** — `domain/menu/Menu.java:51-57`; `presentation/rest/menu/CriarMenuRequest.java:6-10` — validação — (B).
25. **A aplicação de um menu não muda depois de criado.** — `presentation/rest/menu/AtualizarMenuRequest.java:6-9`; `menus/menu-admin-form.component.html:37-41` — validação — (B).
26. **Menu não pode ser pai de si mesmo nem criar ciclo.** "Um menu não pode ser pai de si mesmo."; "Este menu pai criaria um ciclo na árvore de menus (ele descende do próprio menu sendo editado)." — `domain/menu/Menu.java:80`; `application/menu/AtualizarMenuUseCase.java:61-70` — validação — (B). Na tela, o próprio menu e os inativos saem da lista de pais (`menu-admin-form.component.ts:105`).
27. **Menu com filhos ativos não pode ser excluído.** — `application/menu/ExcluirMenuUseCase.java:33-40` — validação — (B).
28. **A árvore de menus de quem está logado depende da unidade ativa e só traz menus da aplicação local.** A aplicação local vem da variável `APLICACAO_SIGLA` (padrão `GERENCIAL`). — `application/menu/CarregarMenusDaUnidadeUseCase.java:100-110`; `backend/gerencial/src/main/resources/application.yml:87` — permissão/integração — (B) (ADR-0029).
29. **Sem vínculo ativo com a unidade, não há menu.** "Usuário não tem vínculo ativo com esta unidade." (403) — `CarregarMenusDaUnidadeUseCase.java:75-76` — permissão — (B).
30. **Permissão efetiva de menu = menus dos grupos do usuário na unidade + menus concedidos diretamente.** — `docs/inventario/ModuloGerencial/inventario-regras-de-negocio.md:62` (RN-04); visível em `permissoes/permissao-menu-usuarios.model.ts:6-12` (`grupos[]` + `acessoDireto`) — permissão — (B).
31. **Conceder ou revogar menu propaga na hierarquia pai/filho.** — `domain/menu/PropagacaoHierarquicaDeMenuService.java:61-96`; RN-03 do inventário — transição — (B). Regra exata (conceder filho concede o pai; revogar o último filho revoga o pai) lida só por trechos: não confirmado nos detalhes.
32. **Grupo atua por unidade: a permissão é do par unidade–grupo.** Vincular grupo já vinculado mostra "Este grupo já atua nesta unidade." — `permissoes/grupo-permissoes.component.ts:320`; `presentation/rest/grupo/GrupoController.java:93` — permissão.
33. **Usuário entra no grupo por unidade, com marca "padrão".** Repetição: "Este usuário já pertence a este grupo, nesta unidade." — `grupo-permissoes.component.ts:437`; `presentation/rest/grupo/VincularUsuarioRequest.java:6` — permissão. Significado de "Padrão" (unidade padrão do usuário, RN-05) e se pode haver mais de um: não confirmado.
34. **Menu concedido a grupo e a usuário não se repete.** "Este menu já está concedido a este grupo, nesta unidade."; "Este menu já está concedido diretamente a este usuário, nesta unidade."; "Este usuário já tem acesso direto a este menu, nesta unidade." — `grupo-permissoes.component.ts:480`; `usuario-menu.component.ts:329`; `menu-usuarios.component.ts:250` — validação (front).
35. **Acesso direto só para quem tem vínculo com a unidade.** `Usuário "<x>" não tem vínculo com a unidade "<y>".` — `application/menu/GerenciarPermissaoDiretaDeMenuUseCase.java:108-111` — permissão — (B).
36. **Revogar acesso direto não tira o acesso por grupo.** A confirmação avisa e lista as siglas dos grupos. — `permissoes/menu-usuarios.component.ts:270-275` — permissão.
37. **Acesso direto não tem validade.** O modelo é `{oid, oidMenu, nomeMenu}`, sem data. — `permissoes/permissao-direta-menu.model.ts:1-5` — prazo (ausência).
38. **Toda concessão ou revogação grava na hora.** Não há rascunho nem "salvar permissões". — `permissoes/permissao-grupo.service.ts:41-60` — transição.
39. **Paginação: página a partir de 0; tamanho entre 1 e 100; padrão 20.** "Página não pode ser negativa." / "Tamanho de página deve ser entre 1 e 100." — `domain/shared/PaginaSolicitada.java:13-16`; controllers `defaultValue = "20"` — limite — (B). As telas de permissão pedem 100 de uma vez, então listas maiores ficam cortadas (`grupo-permissoes.component.ts:178`, `:288`, `:353`).
40. **A sessão do módulo nasce de um token de identidade com `sub` e `tenant`.** "Token de identidade sem o claim obrigatório 'sub'." / "… 'tenant'." — `backend/platform-core/.../security/IdentityTokenService.java:50-55` — integração — (B).
41. **Só entra quem tem usuário ativo naquele tenant.** "Usuário sem acesso ativo neste tenant." (403) — `application/sessao/EntrarUseCase.java:44-47` — permissão — (B).
42. **A sessão dura 30 minutos por padrão.** `JWT_EXPIRATION_MINUTES:30`; refresh 1440 min configurado. — `backend/gerencial/src/main/resources/application.yml:80-81` — prazo — (B). Uso do refresh pelo front: não existe.
43. **Trocar de base exige tenant conhecido e acesso ativo nele.** "Base de dados desconhecida: '<x>'." (400); sem acesso → 403 e a tela diz "Você não tem acesso ativo na base <nome>. Você continua na base <atual>." — `presentation/rest/sessao/SessaoController.java:83-84`; `app-shell.component.ts:891-895` — permissão — (B).
44. **Trocar de base descarta o que não foi salvo e volta ao Início.** — `app-shell.component.ts:873-887` — transição.
45. **A unidade ativa inicial é a padrão do usuário; sem padrão, a primeira.** — `core/services/auth.service.ts:120` — cálculo.
46. **Qualquer 401 encerra a sessão.** — `core/interceptors/error.interceptor.ts:18-23` — permissão.
47. **Erros chegam como Problem Detail e a tela junta a lista de campos.** "Um ou mais campos são inválidos." + `campos[]` → "<detalhe> (campo1; campo2)". — `backend/platform-core/.../error/GlobalExceptionHandler.java:79`; `shared/models/problem-detail.util.ts:3-8` — formato — (B).
48. **Não há trilha de auditoria.** A auditoria JPA (RN-08) foi removida em 21/09/2026: "Não existe auditoria genérica no platform-core nem nas entidades do módulo." — `docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:122-130` — integração (ausência).
49. **Não há controle de quem pode usar cada tela dentro do módulo.** Os controllers não têm anotação de autorização por perfil; basta sessão válida. — todos os `*Controller.java` (nenhum `@PreAuthorize`) — permissão (ausência). Se o filtro de segurança restringe por menu: não confirmado.

Total: **49 regras**.

---

## 5. API

Base `/api`. Autenticação: `Authorization: Bearer <accessToken>`; o tenant vem do claim do token. Listas paginadas: `?termo=&pagina=0&tamanho=20` → `PaginaResponse<T> { conteudo[], totalElementos, totalPaginas, pagina, tamanho }`. Erros: Problem Detail `{ type, title, status, detail, instance?, campos?, dependencias?, oidRegistroExistente? }`.

| Método | Caminho | Observação |
|---|---|---|
| POST | `/api/sessao` | troca token de identidade por sessão |
| POST | `/api/sessao/tenant` | corpo `{ tenant }` |
| GET | `/api/menus/minha-arvore?unidade=` | árvore `ItemMenu[]` |
| GET / POST | `/api/usuarios` | lista paginada / cria |
| GET | `/api/usuarios/resumo` | lista enxuta para combobox |
| GET / PUT / DELETE | `/api/usuarios/{oid}` | |
| POST | `/api/usuarios/{oid}/restaurar` | |
| GET / POST / DELETE | `/api/usuarios/{oidUsuario}/unidades/{oidUnidade}/menus[/{oidMenu}]` | acesso direto |
| GET / POST | `/api/aplicacoes`; GET / PUT / DELETE `/api/aplicacoes/{oid}` | |
| GET / POST | `/api/grupos`; GET / PUT / DELETE `/api/grupos/{oid}` | |
| GET / POST | `/api/grupos/{oid}/unidades` | unidades do grupo / vincular |
| GET / POST | `/api/grupos/unidades/{oidUnidadeGrupo}/usuarios` | corpo `{ oidUsuario, padrao }` |
| DELETE | `/api/grupos/unidades/{oidUnidadeGrupo}/usuarios/{oidUsuario}` | |
| GET / POST | `/api/grupos/unidades/{oidUnidadeGrupo}/menus` | corpo `{ oidMenu }` |
| DELETE | `/api/grupos/unidades/{oidUnidadeGrupo}/menus/{oidMenu}` | |
| GET / POST | `/api/unidades`; GET / PUT / DELETE `/api/unidades/{oid}` | |
| GET | `/api/unidades/{oid}/grupos` | grupos que atuam na unidade |
| GET / POST | `/api/mantenedoras`; GET / PUT / DELETE `/api/mantenedoras/{oid}` | |
| GET / POST | `/api/cartoes-seguranca`; GET / PUT / DELETE `/api/cartoes-seguranca/{oid}` | |
| GET / POST | `/api/menus`; PUT / DELETE `/api/menus/{oid}` | GET sem paginação; não há GET por oid |
| GET | `/api/menus/{oidMenu}/unidades/{oidUnidade}/usuarios` | quem tem acesso |
| GET | `/api/pessoas?termo=`; GET `/api/pessoas/{oid}` | |

Modelos (front, `*.model.ts`):
- `SessaoResponse { accessToken, tenant, expiraEmMinutos, nomeUsuario, unidades: {oid, sigla, padrao}[], tenants: {id, nome}[] }`
- `ItemMenu { oid, nome, legenda, link, filhos[] }`
- `UsuarioListItem { oid, login, nomeExibicao, status, bloqueado }`; `UsuarioDetail { oid, login, palavraChave, dataAtivacao, dataExpiracao, bloqueado, motivoBloqueio, status, loginAntigo, oidPessoa }`; `CriarUsuarioRequest { login, senha, palavraChave, oidPessoa }`; `AtualizarUsuarioRequest { palavraChave, dataExpiracao, oidPessoa, novaSenha, bloqueado, motivoBloqueio }`
- `Aplicacao { oid, sigla, nome, status, oidTipoUsuario }`
- `Grupo { oid, sigla, nome, descricao, status, oidTipoUsuario, dataCriacao }`
- `Unidade { oid, cnpj, sigla, razaosocial, status, oidMantenedora, codigo, responsavel, cpfResponsavel, site, email, telefone, cep, logradouro, numero, complemento, bairro, uf, cidade }`
- `Mantenedora { oid, cnpj, sigla, razaosocial, responsavel, cpfResponsavel, homepage, codigo, credenciamento, status }`
- `CartaoSeguranca { oid, oidPessoa, semente, dataInicio, dataFim, status }` (+ `nomePessoa` na lista)
- `MenuAdmin { oid, nome, legenda, link, status, oidAplicacao, oidMenuPai }`
- `UnidadeDoGrupo { oidUnidadeGrupo, oidUnidade, siglaUnidade, razaoSocialUnidade }`; `GrupoDaUnidade { oidUnidadeGrupo, oidGrupo, siglaGrupo, nomeGrupo }`; `UsuarioDoGrupo { oid, oidUsuario, loginUsuario, nomeExibicao, padrao }`; `MenuDoGrupo` / `MenuDoUsuario { oid, oidMenu, nomeMenu }`; `UsuarioComAcessoAoMenu { oidUsuario, loginUsuario, nomeExibicao, grupos: {oidGrupo, siglaGrupo, nomeGrupo}[], acessoDireto }`
- `PessoaResumo { oid, nome }`

---

## 6. O que o código não responde

| Pergunta | Quem provavelmente decide |
|---|---|
| Quem pode operar o Gerencial? Hoje basta ter sessão e ver o menu; não há perfil por tela nem por ação. | TI (dono do SIGU) / segurança da informação |
| O login é o CPF? O código aceita qualquer texto de até 100 caracteres e guarda "login antigo (legado)". | TI (dono do SIGU) |
| Há política de senha (tamanho, composição, troca obrigatória)? Não há nenhuma no código. | Segurança da informação |
| Para que serve a "palavra-chave" hoje, se a recuperação de senha passou ao portal-login-v2? | TI (dono do SIGU) |
| O que a data de expiração do usuário faz ao vencer (bloqueia o login, inativa)? O campo é gravado; o efeito não está neste repositório. | TI (dono do SIGU) |
| O que é o "tipo de usuário" de aplicação e grupo, e quais valores existem? A tela pede o oid digitado. | TI (dono do SIGU) |
| O que significa "Padrão" no vínculo usuário–grupo–unidade, e pode haver mais de um? | TI (dono do SIGU) |
| Acesso direto a menu deve ter validade? (o DS propõe; o sistema não tem) | TI / segurança da informação |
| Haverá trilha de auditoria? Foi removida do código; o DS desenhou a tela. | TI / encarregado de dados (LGPD) |
| O cartão de segurança ainda é usado para alguma operação? Quem emite, e uma pessoa pode ter dois vigentes? | TI / secretaria |
| Excluir (inativar) usuário, unidade ou grupo com vínculos: o que acontece com os vínculos? | TI (dono do SIGU) |
| "Sair" deve voltar ao portal e encerrar a sessão lá? Hoje só limpa a memória local. | TI (dono do portal) |
| Recarregar a página derruba a sessão (token só em memória): é intencional? | TI / segurança da informação |
| Quem cadastra bases (tenants) e o nome que aparece no seletor "Base de dados"? | Infraestrutura / TI |

---

## 7. Divergências contra as telas de referência do UCAMDS (projeto `gerencial`)

Fonte do DS: `DSUCAM/spec/templates.json` → `projetos[gerencial].templates[]`. O próprio DS registra a origem como "Módulo Gerencial em construção (captura de 14/09/2026)" e marca várias telas como proposta.

### Tela a tela
| Tela do DS | No sistema real | Divergência |
|---|---|---|
| `inicio` (painel-indicadores: 4 números, "Precisa de atenção", "Alterações recentes") | `/` é lançador: busca, 4 atalhos fixos, 2 categorias | **Arquétipo diferente.** O sistema não tem indicador, pendência nem alteração recente; não há endpoint de contagem nem de auditoria. As 3 regras do DS ("aguardando acesso", pendências) não têm correspondente no código. |
| `usuarios` (colunas Usuário, Grupos, Último acesso, Situação; segmentos Todos/Ativos/Bloqueados/Aguardando acesso; filtro por Grupo; seleção e bloqueio em lote; Exportar; busca ao digitar) | colunas Nome, Login, Status; busca por botão/Enter; ações Editar e Excluir | **Campos**: não existem "grupos do usuário" nem "último acesso" na API de lista; não existe a situação "Aguardando acesso". **Ações**: o sistema exclui pela listagem (o DS propõe o contrário: "Conta não se exclui pela listagem"); não há bloqueio pela listagem nem em lote; não há exportar, ordenação nem filtro por situação. **Login**: o DS afirma "O login é o CPF" e mascara; o sistema mostra o login inteiro em fonte mono e não o trata como CPF. |
| `usuario-detalhe` (página do usuário: grupos, acesso direto com validade, cartão, atividade; Redefinir senha, Bloquear, Reemitir cartão) | **não existe**; Editar abre o formulário | O que o DS reúne numa página está espalhado: grupos em `/permissoes/grupo?aba=usuarios`, acesso direto em `/permissoes/usuario-menu`, cartão em `/cartoes-seguranca`. Não existem: validade de acesso direto, "concedido por", redefinição de senha por e-mail, reemissão de cartão, atividade. |
| `usuario-form` (CPF*, Nome completo*, E-mail institucional*, Cargo, Unidade, Mantenedora, tabela de Grupos, "Exigir troca de senha no primeiro acesso", "Emitir cartão de segurança"; botão "Criar usuário") | Pessoa (opcional), Login, Senha, Palavra-chave, Data de expiração, Bloqueado + Motivo; botão "Salvar" | **Quase nenhum campo coincide.** Nome, CPF e e-mail pertencem à Pessoa (outro cadastro, buscado por nome), não ao usuário. Não há lotação, grupos nem cartão no formulário. O sistema tem senha digitada pelo operador, palavra-chave, expiração e bloqueio com motivo — nada disso está no DS. A pergunta aberta do DS "CPF que já tem conta bloqueada: reativa ou recusa?" tem resposta parcial no código: login **inativo** oferece restauração (regra 3); bloqueado ativo é recusado como duplicado. A pergunta "Bloqueio tem motivo obrigatório?" tem resposta: sim (regra 7). |
| `grupo-menu` (grupos à direita, menus por aplicação com caixas de seleção, contagem "22 de 44 concedidos", segmentos Todos/Concedidos/Não concedidos, "Copiar de outro grupo", Descartar / Salvar permissões) | três colunas Unidade → Grupo → detalhe; lista só o que está concedido; conceder é escolher aplicação e menu num combobox | **Modelo**: no sistema a permissão é do par **unidade–grupo**; o DS fixa a unidade na faixa. **Gravação**: o sistema grava a cada clique; o DS propõe "só vale ao salvar o lote". **Não existem**: visão dos não concedidos, contagem "x de y", copiar de outro grupo, concessão em massa, "concedido em". **Existe a mais**: aba "Usuários" do grupo com a marca "Padrão". |
| `auditoria` (Quando, Quem, O que fez, Tipo, Origem; segmentos Acesso/Permissão/Conta; Exportar) | **não existe** | Sem tela, sem endpoint e sem dado: a auditoria foi retirada do backend (regra 48). |

### Telas do sistema que o DS não tem
Handoff; Sessão encerrada; Categoria; Aplicações (lista e formulário); Grupos (lista e formulário); Unidades (lista e formulário); Mantenedoras (lista e formulário); Cartão de Segurança (lista e formulário); Menus (lista e formulário); Grupo × Usuários (aba); Usuário × Menu; Menu × Usuários; diálogo de troca de base.

### Moldura
- **Navegação**: o DS agrupa "Visão geral / Cadastros / (Estrutura: Unidades, Mantenedoras)" numa lista fixa; o sistema monta a lateral com a **árvore de menus do banco**, filtrada pela aplicação local e pela unidade, sob o rótulo "Categorias". A ordem e os nomes vêm do cadastro de Menus.
- **Contexto**: o DS mostra campus na faixa ("Atibaia · EAD"); o sistema tem **dois** seletores na lateral — "Base de dados" (tenant) e "Campus Universitário" (unidade) — e uma pílula somente leitura na faixa. Troca de tenant não existe no DS.
- **Conta**: o sistema só tem `Sair`; tema é um botão na faixa (no DS o tema fica no menu da conta).
- **Extras do sistema**: botão de manual do usuário na faixa; rodapé "módulo em migração gradual"; overlay global de carregamento.
- **Cor de marca**: `#a91733` (faixa em gradiente até `#5c0217`), vinda da skill `design-system-ucam` de Relatórios Acadêmicos; fontes Inter + IBM Plex Mono.

### Regras: DS × código
- "O login é o CPF" (DS, legado) — **não confirmado no código**: sem formato, limite de 100 caracteres.
- "Bloqueio tem motivo obrigatório?" (DS, aberta) — **respondida**: sim.
- "Acesso direto sempre tem validade" (DS, proposta) — **o sistema não tem validade**.
- "Mudança de permissão só vale ao salvar o lote" (DS, proposta) — **o sistema grava na hora**.
- "Menu × Usuários deixa de ser tela" (DS, proposta) — **o sistema tem a tela**.
- "Os números do painel são da unidade escolhida" (DS) — **não há painel**.
- "Quantas tentativas de senha erradas bloqueiam a conta" (DS, aberta) — fora deste repositório (ver `portal-login-v2`).
