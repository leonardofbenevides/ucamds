# Levantamento do ucam-frontend-template (06/10/2026)

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\ucam-frontend-template`. Angular 18.1, standalone, NgRx 18.1, Angular Material 18.2.6, lib `@universidade-candido-mendes/ucam-design-system ^0.0.31`. README é o padrão do Angular CLI. Sem interceptor, sem `provideAnimations`, sem locale.

## 1. Rotas e telas

| URL | Componente | Template | Guard |
|---|---|---|---|
| `**` (qualquer caminho) | `DashboardComponent` | `private/dashboard/dashboard.component.html` | `AuthGuard` |

Não há rota `login/:token/:usuario` nem `LoadComponent`: o template só lê a sessão já gravada em `localStorage['AuthState']`. Os dois apps derivados acrescentaram a rota e o componente por conta própria (cópias idênticas entre si).

**Dashboard**. Propósito: página de exemplo. Arquétipo: boas-vindas. Peças: `ucam-page`; cartão "Olá, seja bem vindo ao template frontend" / "Escolha um menu e comece a utilizar a aplicação" com `mat-button` "Voltar" e `mat-flat-button` "Começar" (sem ação); cartão "Aprenda como se usa ao template frontend" com `mat-icon` `play_circle`, "Tutorial do App" e link "Assistir agora" (`href=""`). Classificação: **nao-migrar** como tela (é esqueleto); como ponto de partida, a base é `shell-aplicacao` + `empty-state`.

## 2. Moldura e navegação

- `app.component.ts:19-31`: `setProfile(userService.getProfile())` e `setMenuConfig(new MenuConfig({app: new AppConfig({title: "Template"}), links: [new MenuLink({icon: 'home', label: 'dashboard', address: '/'})]}))`.
- `ucam-page` na tela; `ChangeUnidadeListener.getInstance().addListener(this.changeUnidade)` só faz `console.warn` (`private/dashboard/dashboard.component.ts:19-25`).
- Perfil: `UcamUserProfile({username, email})` (`shared/service/user.service.ts:34-36`).
- Sem `ExitListener`.
- Estado: NgRx `auth` com `usuario{oid,nome}`, `unidades`, `unidadeSelecionada`, `token`, `email`, `oidpessoa`, `authenticated`, persistido em `localStorage['AuthState']`.
- `CoreService.getMenuAplicacao(oidUsuario, oidAplicacao)` existe para menu por permissão e não é chamado.

## 3. Peças usadas com contagem

- Lib: `ucam-page` 1; `UcamDesignSystemService` (`setProfile`, `setMenuConfig`); `MenuConfig`, `AppConfig`, `MenuLink`; `UcamUserProfile`; `ChangeUnidadeListener`; tipo `Unidade`. Nenhum componente de formulário da lib.
- Material: `mat-button` 1, `mat-flat-button` 1, `mat-icon` 1. Tema: `mat.define-theme` com `azure`/`blue`, `mat.all-component-themes` em `:root` (`src/styles.scss:13-29`).
- Estilos: nenhum arquivo de estilo da lib importado; só `--custom-color-background: #f6f8fa`. Fonte Roboto + Material Icons.
- Prefixo de componente do CLI: `ucam` (`angular.json:15`) — por isso os componentes dos apps derivados nascem como `ucam-*` e se confundem com os da lib.

## 4. Regras de negócio lidas no código

| # | Regra | Onde | Tipo | Valores |
|---|---|---|---|---|
| 1 | Com token e usuário, o app busca usuário, unidades e pessoa na API gerencial | `core/services/auth/store/auth.effects.ts:20-95` | integração | `Unidade-Ref: unid01`; `size=1000` |
| 2 | A unidade ativa inicial é a primeira do usuário | `auth.effects.ts:57,73-74` | permissão | `unidadesUsuarios[0]` |
| 3 | A senha é removida do objeto antes de guardar | `auth.effects.ts:54` | permissão | `delete pessoa['senha']` |
| 4 | Sem sessão, vai para o portal de login | `core/services/auth/auth-guard.service.ts:28-30`; `auth.effects.ts:97-105` | permissão | `LOGIN_URL` |
| 5 | Sair apaga todo o armazenamento local | `core/services/auth/store/auth.reducers.ts:61-70` | permissão | `localStorage.clear()` |
| 6 | Trocar unidade regrava a sessão | `auth.reducers.ts:72-78` | permissão | `CHANGE_UNIDADE` |

## 5. API consumida

`API_MENU` = `https://api-gerencial.ucam-campos.br`: `GET /usuario/{oid}`; `GET /unidadeUsuario/search/usuario?oidusuario&size=1000`; `GET /usuario/{oid}/pessoa`; `GET /menu-usuarios/search/all-menu-aplicacao-usuario?oidUsuario&oidAplicacao` (sem uso). `API_REST` = `http://34.73.255.214`: `GET /unidade/search/all?term` (sem uso). `BACKEND` = `http://localhost:8080` nos dois ambientes. `LOGIN_URL` com `client_id=aplicVestOnline@ucam`.

Modelos: `Unidade{oid, sigla, razaosocial, oidUnidade}`; `UsuarioLogado{oid, oidpessoa, nome, email, foto?, token}`; `Pessoa{oid, sigla, razaosocial}`.

## 6. O que o código não responde

1. O menu deve vir da API por permissão (`getMenuAplicacao`) ou ficar fixo em cada app? — arquitetura do time com gestão de acessos.
2. A entrada por token deve fazer parte do template? Cada app a copia à mão. — arquitetura do time.
3. Qual versão da lib é a de referência? Há três em uso (0.0.31, 0.0.54, 18.2.2) e o repositório da lib está em 22.2.0. — dono da lib.
4. O token da sessão na URL e em `localStorage` é aceito pela segurança? — segurança da informação.

## Limites da leitura

- `node_modules` não existe em nenhum dos três clones. O interior da lib nas versões instaladas (`^0.0.31`, `^0.0.54`, `^18.2.2`) é **não confirmado**. O clone local `UCAM-repos\lib-ucam-workspace` está na versão `22.2.0` (um commit só, 01/10/2026) e serviu apenas de referência para nomes de props.
- Lidos por inteiro: todos os `.ts` não-spec e `.html` de `src/app` dos três repositórios, exceto `principia-sincronizacao-pendentes.component.ts` (1093 linhas), lido por assinaturas de método, condições e mensagens, e os serviços/componentes compartilhados do financeiro (`calendar`, `select`, `toast.service`, `notification.service`, `sse.service`, `server-sent-events.service`, `ucam-paginator.directive`), lidos por seletor, entradas e constantes. Os `.scss` não foram lidos, só consultados por seletor.
