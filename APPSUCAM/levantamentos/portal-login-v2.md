# portal-login-v2 — levantamento de telas, padrões e regras (06/10/2026)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\portal-login-v2`. Monorepo: `frontend/` (Angular 20.3, standalone, sem biblioteca de UI), `backend/` (Spring Boot, JDK 21), `contract-tests/` (constantes e testes de contrato com o legado), `docs/sdd/` (17 arquivos de especificação), `kubernetes/`. Substitui o WAR/JSF do login antigo mantendo os contratos OAuth (`/api/auth/*`, `client_id={oid}@{realm}`).

Como li: frontend inteiro (rotas, quatro páginas, `core/`, `shared/`, tokens SCSS). Backend: todos os controllers (mapeamentos), `PasswordResetService`, `AuthService` (mensagens), `PortalProperties`, armazenamento de código/token, catálogo de origens. SDD: `requirements.md` inteiro e títulos dos demais. Os SCSS foram lidos nos tokens, não regra a regra. O que não foi aberto está marcado "não confirmado".

Caminhos relativos a `frontend/src/app/` (front) e `backend/src/main/java/br/ucam/portal/login/` (back).

---

## 1. Rotas e telas

Fonte: `frontend/src/app/app.routes.ts`. Todas as páginas são carregadas sob demanda.

| URL | Componente | Template | Guard |
|---|---|---|---|
| `/` | redireciona para `/login` | — | — |
| `/login` (aceita `?client_id=`) | `LoginPage` | `pages/login/login.html` | nenhum |
| `/dashboard` | `DashboardPage` | `pages/dashboard/dashboard.html` | `sessionGuard` |
| `/recuperar-senha` | `PasswordRecoverPage` | `pages/password-recover/password-recover.html` | nenhum |
| `/cadastrar-senha` (recebe o bilhete de troca por parâmetro) | `PasswordSetPage` | `pages/password-set/password-set.html` | nenhum |
| `**` | redireciona para `/login` | — | — |

O `sessionGuard` chama `GET /api/portal/dashboard`; qualquer erro (401 ou outro) manda para `/login` (`core/session.guard.ts:11-18`).

### 1.1 Login — `/login`
- **Propósito**: autenticar com CPF e senha e levar ao painel de sistemas (ou devolver a pessoa ao sistema que pediu o login).
- **Arquétipo**: autenticação em duas colunas (painel de marca + formulário).
- **Peças**: painel de marca à esquerda (`app-auth-brand-panel`); à direita, sobrelinha "Autentique-se", título "Acesse sua conta", texto "Use seu CPF para acessar o Portal Universitário."; alerta de erro; campos; caixa "Lembrar de mim"; link "Esqueci minha senha"; botão "Entrar no Portal" ("Entrando…"); divisor "ainda não tem acesso"; duas ações secundárias: **Primeiro acesso** (abre `assets/docs/manual-primeiro-acesso.pdf` em nova aba) e **Cadastrar senha** (vai para `/recuperar-senha`); rodapé "Universidade Candido Mendes © 2026" + link de WhatsApp.
- **Campos**: `username` — rótulo "CPF", máscara `000.000.000-00`, `maxlength 14`, `autocomplete="username"`, apoio "Somente números, com ou sem pontuação."; `password` — rótulo "Senha", placeholder "Digite sua senha", botão mostrar/ocultar; `rememberMe` — "Lembrar de mim".
- **UCAMDS**: **coberta** por `portal/login`. Peças: `text-field`, `input-group`, `button`, `alert`, `link`, `checkbox`. Divergências em §7.

### 1.2 Painel de sistemas — `/dashboard`
- **Propósito**: mostrar todos os sistemas a que o CPF tem acesso, agrupados por unidade/origem, e abrir cada um já autenticado.
- **Arquétipo**: shell com grade de módulos (lançador).
- **Peças**:
  - **Lateral** (300 px; recolhida 84 px): marca "Universidade Candido Mendes / Portal Universitário"; botão recolher; cartão do usuário (iniciais, nome ou login, pílulas com as seções a que tem acesso); navegação "Navegar": `Todos os sistemas` (com total), `Acessos frequentes` (com contagem), `Ouvidoria` (mailto `falecomucam@candidomendes.edu.br`), `Central de ajuda` (WhatsApp); rodapé "© ano UCAM" e botão `Sair`. Em telas pequenas vira gaveta com "Abrir menu" / "Fechar menu".
  - **Faixa**: "Portal", busca "Buscar aplicação…", alternador de tema, avatar com iniciais. Selo "DEV" discreto fora de produção.
  - **Cabeçalho**: sobrelinha "Meus sistemas", saudação ("Bom dia / Boa tarde / Boa noite, Nome"), frase "Você tem acesso a N aplicações em M seções.", três contadores: `Sistemas`, `Seções`, `Favoritos`.
  - **Barra de filtros**: chips por seção com contagem; alternador grade/lista; "Recolher todas / Expandir todas".
  - **Bloco "Acessos frequentes"** ("favoritos e usos neste navegador"): até 8 cartões; vazio: "Nenhum acesso frequente ainda — marque a estrela ou abra um sistema para vê-lo aqui."
  - **Seções recolhíveis** por unidade: título (rótulo), subtítulo (origem, quando difere), "N sistema(s)", cartões com ícone (`app-system-icon`), nome e estrela de favorito. Durante a abertura o cartão mostra "Aguarde...".
  - **Estados**: "Carregando…"; "Nenhuma aplicação disponível — Se você acredita que deveria ter acesso, entre em contato com a TI da sua unidade."; "Nenhum sistema encontrado — Não encontramos nenhuma aplicação para o termo pesquisado. Tente outra palavra-chave ou limpe o filtro de seção." + "Limpar busca e filtros"; erro "Não foi possível carregar os sistemas."
- **UCAMDS**: **coberta** por `portal/grade-modulos` (padrão `shell-aplicacao`). Peças: `app-shell`, `card`, `icon-tile`, `section-bar`, `segmented`, `text-field`, `realce`, `chip`, `stat`, `empty-state`. Divergências em §7.

### 1.3 Recuperar senha — `/recuperar-senha` (dois passos na mesma rota)
- **Propósito**: localizar a pessoa pelo CPF, enviar um código por e-mail e conferi-lo.
- **Arquétipo**: assistente de autenticação (passo a passo), mesmo layout de duas colunas.
- **Peças comuns**: link "← Voltar ao login", indicador de 3 etapas (lista ordenada sem rótulos), alerta de erro, aviso de informação (`role="status"`).
- **Passo 1** — sobrelinha "Recuperação", título "Recuperar senha", texto "Informe seu CPF para localizar seu cadastro e iniciar a recuperação de acesso."; campo `login` (CPF, mesma máscara); botão "Continuar" ("Aguarde…").
- **Passo 2** — sobrelinha "Confirmação", título "Confirmar identidade", texto "Digite o código de verificação enviado para o seu e-mail cadastrado.", "Enviado para <e-mail mascarado>"; **6 caixas de um dígito** (`autocomplete="one-time-code"`); botão "Confirmar código" ("Validando…"); botão "Reenviar código (Ns)" com contagem regressiva; nota "Por segurança, o código expira após um período curto. Se não receber o e-mail, fale com a Central de ajuda."
- **UCAMDS**: **coberta** por `portal/recuperar-senha` (passo 1) e `portal/recuperar-senha-codigo` (passo 2) — as duas telas de referência foram escritas a partir deste repositório ("lido em 06/10/2026") e não constam ainda do `_catalogo-ucamds.md`. Peças: `stepper`, `text-field`, `button`, `alert`, `link`. Falta peça de **código em caixas separadas** (o DS usa um `text-field` único).

### 1.4 Diálogo "Escolha o e-mail" (dentro de `/recuperar-senha`)
- **Propósito**: quando o CPF tem mais de um e-mail, escolher o destino do código.
- **Peças**: título "Escolha o e-mail", texto "Encontramos mais de um e-mail vinculado ao seu CPF. Selecione onde deseja receber o código:", grupo de rádio (e-mail mascarado + rótulo da origem), `Cancelar` / `Continuar` (desabilitado sem escolha).
- **UCAMDS**: **parcial** — `dialog` + `radio-group`. A tela de referência `recuperar-senha-codigo` cita o diálogo na origem e registra "Usar outro e-mail" como ação "sem tela neste conjunto".

### 1.5 Diálogo "Confirme o envio" (dentro de `/recuperar-senha`)
- **Propósito**: confirmar o endereço antes de enviar ou reenviar o código.
- **Peças**: título "Confirme o envio", texto "O código de verificação será enviado para o e-mail:" (ou "Reenviar código para o e-mail:"), o e-mail mascarado, "Deseja enviar?", `Cancelar` / "Enviar código" ("Enviando…").
- **UCAMDS**: **parcial** — `dialog`; não é destrutivo, então não cai em `confirmacao-destrutiva`. Sem tela de referência.

### 1.6 Definir nova senha — `/cadastrar-senha`
- **Propósito**: cadastrar a senha nova e confirmar o sucesso.
- **Arquétipo**: formulário curto de autenticação + estado de sucesso na mesma tela.
- **Peças**: indicador com a 3ª etapa atual; sobrelinha "Nova senha", título "Definir nova senha", texto "Cadastre uma nova senha para concluir a recuperação do seu acesso."; campos `senha` ("Nova senha", placeholder "Digite a nova senha") e `confirma` ("Confirmar nova senha", "Repita a nova senha"), cada um com mostrar/ocultar; botão "Salvar nova senha" ("Salvando…"). Sucesso: sobrelinha "Concluído", título "Senha atualizada", "Sua nova senha foi cadastrada. Você já pode acessar o Portal Universitário.", link "Voltar ao login".
- **UCAMDS**: **coberta** por `portal/definir-senha`. Peças: `stepper`, `input-group`, `text-field`, `button`, `alert`, `link`.

### 1.7 Rotas de compatibilidade sem tela própria (backend)
`GET /login.jsf?client_id=` (redireciona clientes antigos), `GET /api/login/{token}/{user}/{realm}` (307 para `/index.jsf`), `GET /api/portal/dashboard/apps/{oid}/form-bridge` (página HTML mínima que envia um formulário automático para o sistema de destino), `GET /api/auth/authorize_resource` (HTML). Classificação: **nao-migrar** (não são telas de usuário).

---

## 2. Moldura e navegação

- **Duas molduras**. (a) *Autenticação*: duas colunas, painel de marca fixo + cartão de formulário; sem cabeçalho, menu ou conta. (b) *Painel*: lateral + faixa + conteúdo, descrito em 1.2.
- **Painel de marca** (`shared/auth-brand-panel.html`): "Universidade Candido Mendes / Portal Universitário", selo "Portal de acesso", três blocos ("Acesso centralizado", "Ambientes integrados", "Navegação organizada"), "Atalhos institucionais" (Outlook `https://outlook.office.com/mail/`, e-mail `falecomucam@candidomendes.edu.br`, "Área do inscrito" `https://candidomendes.edu.br/processo-seletivo/area-do-inscrito`, WhatsApp `552125312000`), rodapé "© 2026 Universidade Candido Mendes — Precisa de ajuda? (21) 2531-2000".
- **Conta**: no painel só há nome/iniciais e `Sair`. Não há perfil nem "trocar senha" para quem está logado.
- **Troca de unidade/tenant**: **não existe**. O login é só CPF + senha, sem escolher Campos/Rio/EAD (REQ-AUTH-011, REQ-UI-009). O painel agrega tudo e a unidade vira **seção** e **chip de filtro**. Cada sistema é aberto com a identidade daquela unidade.
- **Como a sessão nasce**: `POST /api/auth/token` (form-urlencoded, `grant_type=password`, `client_id`, `username`, `password`) → token opaco; depois `POST /api/portal/post-login` com o token → cria sessão HTTP (cookie, `credentials: 'include'`) e devolve `DASHBOARD` ou `REDIRECT` com URL (`core/auth-api.ts:32-97`, `pages/login/login.ts:121-126`). O token também fica em memória na SPA.
- **Handoff para os sistemas**: clique no cartão → `POST /api/portal/dashboard/apps/{oid}/launch?realm=&origem=` → instrução `OPEN_URL` (abre nova aba), `FORM_POST` (formulário oculto com `target` na nova aba) ou `FORM_BRIDGE` (abre a página-ponte do backend) (`core/launch.ts:86-109`). A aba é aberta em branco antes da resposta para escapar do bloqueador de pop-up; se falhar: "Não foi possível abrir a aplicação. Verifique o bloqueio de pop-ups." É este mecanismo que entrega o token ao Gerencial (`/handoff#token=`) e à Isenção (`/admin/login/:token/:usuario`). Detalhes em `docs/sdd/handoff-gerencial-trace.md` (não lido por inteiro).
- **Sessão expirada**: não há tela. 401 ao carregar o painel ou ao abrir um sistema leva a `/login` sem mensagem (`pages/dashboard/dashboard.ts:343-344`, `:451-452`).
- **Sair**: `POST /api/portal/logout`, limpa o token em memória e volta a `/login` (`core/auth-api.ts:100-106`).
- **Preferências guardadas no navegador** (`core/dashboard-prefs.ts`): tema (`portal-dashboard-theme`), lateral recolhida (`portal-dashboard-sidebar-collapsed`), grade/lista (`portal-dashboard-view`), favoritos (`portal:favorites:<usuarioOid>`), uso (`portal:app-usage:<usuarioOid>`), CPF lembrado (`portal.login.rememberCpf`).

---

## 3. Peças e estilo próprios

### Componentes compartilhados do app
| Peça | Arquivo | Props |
|---|---|---|
| `app-auth-brand-panel` | `shared/auth-brand-panel.ts` / `.html` | nenhuma |
| `app-system-icon` | `shared/system-icon.ts` + `system-icon-catalog.ts` | `name` (obrigatório), `size = 20`, `categoryOverride` — escolhe um pictograma SVG pela categoria inferida do nome do sistema |

Não há componente de botão, campo, cartão ou diálogo: tudo é HTML com classes globais de `styles/_auth-shell.scss` e `styles/_dashboard.scss`. Os dois diálogos são marcação própria com `aria-labelledby`.

### Tokens
Dois conjuntos convivem.

`frontend/src/styles/_auth-shell.scss:4-27` e `_dashboard.scss:3-32` (os que as telas usam):
| Token | Claro | Escuro (painel) |
|---|---|---|
| `--brand-900 … --brand-50` | `#4a0217`, `#6b0a26`, `#8f0324`, `#b4365b`, `#c25470`, `#f7e9ed`, `#fcf6f7` | `--brand-100: #3b1d28`, `--brand-50: #2c1720` |
| `--ink-900 … --ink-300` | `#241f26`, `#463f49`, `#6b6470`, `#8b8590`, `#c7c1c9` | `#f3eef0`, `#d6cfd3`, `#aea6ac`, `#8c848b`, `#5c545b` |
| `--border` / `--surface` / `--surface-muted` | `#e7dee1` / `#ffffff` / `#fbf7f8` | `#3a3239` / `#241f26` / `#19151a` |
| `--success` / `--success-bg` | `#1f7a4d` / `#eaf5ef` | — |
| `--danger` / `--danger-bg` | `#b23a45` / `#fbedee` | — |
| `--focus-ring` | `0 0 0 3px rgba(180,54,91,.22)` | |
| raios | `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 22px` | |
| painel | `--sidebar-w: 300px`, `--sidebar-w-collapsed: 84px`; gradiente `--panel-grad-1/2` = `brand-700` → `brand-900` (escuro: `#450a1c` → `#150407`) | |

`frontend/src/styles/_ucam-tokens.scss` (prefixo `--ucam-*`, **não** é o UCAMDS): `--ucam-vinho: #7d212b`, `--ucam-vinho-dark: #64191f`, `--ucam-vinho-deep: #4a1218`, `--ucam-accent-hover: #5c1820`, `--ucam-ink: #16191f`, `--ucam-muted: #59616c`, `--ucam-bg: #f1f2f5`, `--ucam-border: #e3e6eb`, `--ucam-border-strong: #ccd2da`, `--ucam-error-bg: #fef2f2`. Uso efetivo nas telas: não confirmado.

- **Cor de marca**: `#8f0324` (brand-700) como principal; `#7d212b` no arquivo de tokens antigo. Três vinhos diferentes no mesmo app.
- **Fontes**: Inter (texto) e **Source Serif 4** (marca, títulos e números do painel). Origem do carregamento (Google Fonts ou local): não confirmado.
- **Ícones**: SVG inline; catálogo próprio de pictogramas por categoria de sistema. O ícone cadastrado em `aplicacao.icone` é resolvido contra `https://repositorio.ucam-campos.br/atual` (`core/assets.ts:7-17`, `environments/environment.ts`).
- **Imagens**: `public/assets/logo-ucam-branco.svg`, `logo-ucam-chafariz-branco.svg`, `logo-ucam-login.png`, `background-login.svg`.
- **Tema escuro**: só no painel (chave `portal-dashboard-theme`); as telas de autenticação são só claras (`color-scheme: light`).

### Relação com o UCAMDS
- **Não usa** `@ucam/*`, `.ucam-*` (classes), MCP, AGENTS nem `@universidade-candido-mendes/ucam-design-system`. As variáveis `--ucam-*` são do próprio app.
- O SDD veta biblioteca visual sem decisão registrada: "Sem Material/Bootstrap/Tailwind sem ADR" (REQ-UI-005) e "Não copiar layout legado" (REQ-UI-006) — `docs/sdd/requirements.md:90-91`.
- O UCAMDS, por sua vez, **já leu este repositório**: três telas de referência do projeto `portal` citam "portal-login-v2 … (lido em 06/10/2026)".

---

## 4. Regras de negócio lidas no código

(B) = regra aplicada no backend.

1. **O login é o CPF: só dígitos, no máximo 11.** O campo mascara como `000.000.000-00` e envia só os dígitos. — `core/cpf.ts:1-27`; `pages/login/login.ts:115` — formato. Não há validação de dígito verificador nem exigência de 11 dígitos no cliente.
2. **CPF e senha são obrigatórios.** "Informe CPF e senha." — `pages/login/login.ts:37-38`, `:110` — validação.
3. **O login não escolhe unidade.** A credencial é aceita se casar em pelo menos um dos catálogos (Campos, Rio, EAD e, havendo identidade, ITECAM/ICAM). — `docs/sdd/requirements.md:19-21` (REQ-AUTH-009/010/011); `service/IdentityDiscoveryService.java:114-149` — permissão/integração — (B).
4. **Catálogos reconhecidos**: `campos` (presencial, realm `ucam`), `rio`, `itecam`, `icam`, `ead` (EAD, realm `ucam`), `ead-rio`, `ead-itecam`, `ead-icam`. Rótulos de tela: "Campos", "Rio", "ITECAM", "ICAM", "EAD". — `catalog/ProductCatalog.java:15-22` — integração — (B).
5. **A tela nunca diz se o CPF existe ou se a senha está errada.** Qualquer erro de credencial vira "CPF ou senha incorretos. Verifique os dados e tente novamente."; qualquer outro vira "Não foi possível concluir o acesso no momento. Tente novamente em instantes." — `core/login-error.ts:4-54` — validação. O backend responde `invalid_grant` / "usuario ou senha invalidos" (`service/AuthService.java:91`).
6. **Só autentica usuário ativo e não bloqueado.** Consulta com `status = 'A'` e `bloqueado = FALSE`. — `repository/JdbcUsuarioRepository.java:24-29` — permissão — (B). O bloqueado recebe a mesma mensagem genérica de credencial.
7. **Não há bloqueio por tentativas de senha.** Nenhum contador de falhas de login no código lido. — ausência em `service/AuthService.java` — limite (ausência) — (B).
8. **A senha é conferida pelo hash legado MD5 → Base64.** — `security/PasswordService.java:24-28`; REQ-AUTH-003 — integração — (B).
9. **O token vale 20 minutos.** `TOKEN_EXPIRE_SECONDS = 20 * 60`; a resposta traz `expires_in: "1200"` (texto). — `contract-tests/src/main/java/br/ucam/portal/login/contracts/LegacyAuthConstants.java:24-25` — prazo — (B). O comentário de `AuthService.java:427-430` fala em expiração deslizante a cada `authorize_resource`; comportamento exato não confirmado.
10. **`client_id` tem o formato `{oidAplicacao}@{realm}`; realms válidos: `ucam`, `itecam`, `rio`, `icam`.** Erro: "client_id inválido (esperado {oidAplicacao}@{realm}): …". — `core/client-id.ts:12-24`; `core/constants.ts:7` — formato.
11. **Depois do login, o destino depende de quem pediu.** Se o `client_id` é o do portal (`428f463e-14c0-46ee-869c-b114309a820d`), vai ao painel; se é de outro sistema, a pessoa é devolvida a ele. — `core/constants.ts:4`; `pages/login/login.ts:121-126`; REQ-SESS-002 — integração — (B).
12. **"Lembrar de mim" guarda só o CPF, no navegador.** Desmarcar apaga. — `pages/login/login.ts:100-102`; `core/remember-cpf.ts:1-27` — formato.
13. **"Primeiro acesso" é um manual em PDF; "Cadastrar senha" é o mesmo fluxo de recuperar senha.** — `pages/login/login.html:204`, `:227` — integração.
14. **O painel mostra todos os sistemas do CPF em todas as origens onde há identidade.** — REQ-DASH-001; `dashboard/DashboardService.java:112-128` — permissão — (B).
15. **Seções em ordem alfabética do rótulo (pt-BR), com critério anterior não detalhado.** — `pages/dashboard/dashboard.ts:121-127` — cálculo. Critério primário da ordenação: não confirmado.
16. **A tela pode dizer a origem de negócio (Campos/Rio/EAD), nunca realm, datasource ou nome de banco.** — REQ-DASH-006 (`docs/sdd/requirements.md:49`) — formato.
17. **Cartões só se fundem quando o acesso é idêntico** (mesmo sistema + origem + realm); mesmo nome em unidades diferentes aparece mais de uma vez. — REQ-DASH-007 — cálculo — (B).
18. **Três tipos de integração ao abrir um sistema**: `OAUTH` (abre URL), `OSTICKET` (formulário), `BI_TOKEN_FORM` (ponte). — `dashboard/DashboardService.java:279-288`, `:427-433`; `core/models.ts:13`, `:48` — integração — (B).
19. **Ao clicar, o cartão mostra "Aguarde..." e só então abre a nova aba.** — REQ-DASH-005; `pages/dashboard/dashboard.html:427` — transição.
20. **Sistema sem link não abre.** "Aplicação sem link configurado." — `pages/dashboard/dashboard.ts:414` — validação.
21. **Sistema não liberado.** 403 → "Aplicação não liberada para o usuário."; outro erro → "Falha ao iniciar acesso à aplicação." — `pages/dashboard/dashboard.ts:455-457` — permissão — (B).
22. **Favoritos e "acessos frequentes" ficam no navegador, por usuário.** Não vão ao servidor. — `core/dashboard-prefs.ts:6-7`, `:128-151` — integração.
23. **"Acessos frequentes" mostra no máximo 8**: primeiro os favoritos (na ordem em que foram marcados), depois os mais recentes, depois os mais usados, depois por nome. — `core/dashboard-prefs.ts:10`, `:260-315` — limite/cálculo.
24. **O contador "Favoritos" do cabeçalho conta os acessos frequentes**, não só os marcados com estrela. — `pages/dashboard/dashboard.html:262-265` — cálculo.
25. **Saudação por horário**: 5h–11h59 "Bom dia"; 12h–17h59 "Boa tarde"; demais "Boa noite"; com o primeiro nome. — `pages/dashboard/dashboard.ts:203-213` — cálculo.
26. **Iniciais do sistema**: duas primeiras letras da sigla; sem sigla, iniciais das duas primeiras palavras; padrão "AP". — `core/assets.ts:19-28` — formato.
27. **A recuperação de senha identifica a pessoa só pelo CPF.** — REQ-RESET-002; `pages/password-recover/password-recover.ts:47`, `:94` — validação.
28. **CPF sem cadastro é revelado.** "Usuário inválido!" — `service/PasswordResetService.java:55`, `:127` — validação — (B).
29. **Sem e-mail cadastrado não há recuperação.** "Não foi possível localizar um e-mail cadastrado para recuperação. Entre em contato com a Central de ajuda." — `PasswordResetService.java:60-61`, `:132`; `password-recover.ts:110-112` — validação — (B).
30. **Mais de um e-mail: a pessoa escolhe; os endereços aparecem mascarados com o rótulo da origem.** "Selecione o e-mail para receber o código."; "Opção de e-mail inválida. Selecione um dos destinos disponíveis." — `password-recover.ts:117`, `:144-149`; `PasswordResetService.java:68-69` — validação — (B).
31. **O código vai só por e-mail e a pessoa confirma o endereço antes do envio.** — `pages/password-recover/password-recover.html:250-278` — transição. Existem endpoints legados de SMS (`/api/trocasenha/celular/…`, `POST /api/portal/password-reset/sms`) que a SPA atual não oferece como escolha; uso real do SMS: não confirmado.
32. **O código tem 6 dígitos numéricos, sorteados.** — `reset/InMemoryResetTokenStore.java:60`; `password-recover.ts:35` — formato — (B). "Informe o código de verificação completo." (`password-recover.ts:225`).
33. **O código vale 20 minutos.** Mesma constante do token. "Código expirado. Solicite um novo código." — `reset/InMemoryResetTokenStore.java:51`; `PasswordResetService.java:57`, `:446-448` — prazo — (B). A tela diz apenas "o código expira após um período curto".
34. **No máximo 5 tentativas erradas por código.** `PORTAL_PASSWORD_RESET_MAX_ATTEMPTS:5`. Depois disso: "Código inválido!". — `backend/src/main/resources/application.yml:61`; `PasswordResetService.java:243`, `:450-453`; `reset/InMemoryResetTokenStore.java:87`, `:111` — limite — (B).
35. **Novo código só depois de 60 segundos.** `PORTAL_PASSWORD_RESET_RESEND_COOLDOWN_SECONDS:60`; "Aguarde alguns instantes antes de solicitar um novo código."; a tela conta "Reenviar código (Ns)" e avisa "Código reenviado para o e-mail cadastrado." — `application.yml:62`; `PasswordResetService.java:505-514`; `password-recover.ts:194-197` — prazo — (B).
36. **A busca do CPF vale 15 minutos.** Depois: "Sessão de recuperação expirada. Informe o CPF novamente." — `reset/PasswordResetLookupStore.java:19`; `PasswordResetService.java:66-67` — prazo — (B).
37. **Sem bilhete de troca válido não se cadastra senha.** "Sessão de recuperação inválida. Solicite um novo código."; "Código de recuperação inválido ou expirado!" — `pages/password-set/password-set.ts:51`, `:68`, `:99` — permissão.
38. **A senha nova só precisa existir e ser igual à confirmação.** "Informe a nova senha."; "As senhas precisam ser iguais". Não há tamanho mínimo nem composição. — `pages/password-set/password-set.ts:38-39`, `:72-76` — validação.
39. **A troca vale para todas as contas do CPF, em todas as bases.** Resultado `OK`, `PARTIAL` ou `FAILED`; parcial: "Não foi possível concluir a alteração em todos os ambientes. Tente novamente ou contate o suporte."; falha: mensagem do servidor ou "Não foi possível alterar a senha." — REQ-RESET-003/004; `core/models.ts:97-100`; `password-set.ts:84-92` — integração — (B).
40. **Trocar a senha não abre sessão.** A pessoa vê "Senha atualizada" e volta ao login. — `pages/password-set/password-set.html:38-42` — transição.
41. **Remetente dos e-mails**: `noreply@candidomendes.edu.br`; envio desligado por padrão (`enabled = false`) e, em produção sem SMTP, falha fechada. — `config/PortalProperties.java:221-223`; `mail/FailClosedEmailSender.java` (existência; conteúdo não lido) — integração — (B).
42. **O código nunca volta na resposta da API em produção.** `expose-code: false`. — `application.yml:60` — permissão — (B).
43. **Sair encerra a sessão no servidor e descarta o token.** — `core/auth-api.ts:100-106`; REQ-SESS-003 — transição — (B).
44. **Sem sessão, o painel não abre e não há aviso.** — `core/session.guard.ts:11-18` — permissão.
45. **Contratos do legado continuam valendo**: `/api/auth/token`, `/api/auth/token/mobile` (ordem rio → itecam → ucam), `/api/auth/token/tmp` (token sem senha para o SIGU), `/api/auth/authorize_resource`, `/api/auth/logout`, `/api/trocasenha/**`, `/login.jsf`. — `controller/AuthController.java:62-237`; REQ-AUTH-001…008, REQ-RESET-001 — integração — (B).
46. **Uma instância, memória local**: o armazenamento de token padrão é `memory` e o primeiro canário roda com uma réplica. — `application.yml:43`; REQ-NFR-002 — limite — (B).

Total: **46 regras**.

---

## 5. API

| Método | Caminho | Uso |
|---|---|---|
| POST | `/api/auth/token` | login (form-urlencoded) → `TokenSuccessResponse` |
| POST | `/api/auth/token/mobile` | login multi-realm (legado) |
| POST | `/api/auth/token/tmp` | token temporário sem senha (SIGU/legado) |
| GET | `/api/auth/authorize_resource` | validação de token por sistema (headers `Authorization`, `Usuario`, `Resource`) |
| POST | `/api/auth/logout` | corpo é o token entre aspas; 204 |
| POST | `/api/portal/post-login` | `{ access_token }` → `PostLoginInstruction` |
| POST | `/api/portal/logout` | encerra a sessão HTTP |
| GET | `/api/portal/dashboard` | `DashboardResponse` |
| POST | `/api/portal/dashboard/apps/{aplicacaoOid}/launch?realm=&origem=` | `LaunchInstruction` |
| GET | `/api/portal/dashboard/apps/{aplicacaoOid}/form-bridge` | página-ponte HTML |
| POST | `/api/portal/password-reset/lookup` | `{ login }` → `PasswordLookupResponse` |
| POST | `/api/portal/password-reset/sms` | envia o código (o nome é herdado; envia por e-mail) → `PasswordSmsResponse` |
| POST | `/api/portal/password-reset/verify` | confere o código → `{ resetToken }` |
| POST | `/api/portal/password-reset/change` | grava a senha → `{ status, message }` |
| GET | `/api/trocasenha/{realm}/{login}`, `/mobile/{login}`, `/celular/{realm}/{login}`, `/celular/mobile/{login}` | legado |
| POST | `/api/trocasenha`, `/api/trocasenha/mobile` | legado (`{ codigo, senha }`) |
| GET | `/api/login/{token}/{user}/{realm}` | legado, 307 |
| GET | `/login.jsf?client_id=` | legado |

Modelos (`core/models.ts`):
- `TokenSuccessResponse { access_token, token_type, expires_in (texto), user }`; `OAuthErrorResponse { error, error_description }`
- `PostLoginInstruction { kind: 'DASHBOARD' | 'REDIRECT', url? }`
- `DashboardResponse { usuarioOid, login, nome, sessionRealm, realms: DashboardRealmGroup[], catalogDevBypass, localHandoffWarning }`
- `DashboardRealmGroup { realm, label, origem?, origemLabel?, apps[] }`
- `DashboardAppItem { oid, nome, icone, sigla, realm, realmLabel, origem?, origemLabel?, usuarioOid?, integrationType: 'OAUTH' | 'OSTICKET' | 'BI_TOKEN_FORM', receivesUnidade, hasLink }`
- `LaunchInstruction { kind: 'OPEN_URL' | 'FORM_POST' | 'FORM_BRIDGE', url?, action?, fields?, bridgeUrl? }`
- `PasswordLookupResponse { nome, email, celular, lookupToken?, requiresEmailChoice?, emailOptions?: { id, maskedEmail, origemLabel }[] }`
- `PasswordSmsResponse { nome, emailMascarado?, codigo? }`; `PasswordResetVerifyResponse { resetToken }`; `PortalPasswordChangeResponse { status: 'OK' | 'PARTIAL' | 'FAILED', message }`

---

## 6. O que o código não responde

| Pergunta | Quem provavelmente decide |
|---|---|
| Haverá bloqueio por tentativas de senha no login? Hoje não há nenhum; só o código de recuperação tem limite (5). | Segurança da informação / TI (dono do portal) |
| Qual é a política de senha (tamanho, composição, reuso)? A tela aceita qualquer senha não vazia. | Segurança da informação |
| A recuperação pode continuar dizendo "Usuário inválido!" para CPF sem cadastro? | Segurança da informação / encarregado de dados (LGPD) |
| Quais e-mails do cadastro podem receber o código (institucional, pessoal)? | Encarregado de dados (LGPD) |
| "Primeiro acesso" é só o manual em PDF + recuperar senha, ou quem nunca teve senha precisa provar algo a mais? | TI (dono do portal) / secretaria |
| O SMS ainda é um canal de recuperação? Os endpoints existem, a tela não usa. | TI (dono do portal) |
| Trocar a senha encerra as sessões abertas em outros aparelhos e nos sistemas já abertos? | Segurança da informação |
| Favoritos devem seguir a pessoa entre dispositivos? Hoje ficam no navegador. | TI (dono do portal) |
| O que decide que um sistema aparece para a pessoa (cadastro do portal, grupo do Gerencial, perfil no SIGU)? | TI (dono do SIGU) |
| Quando a senha deixa de ser MD5 e como as contas migram? | Segurança da informação / infraestrutura |
| O que a pessoa vê quando a sessão expira no meio do uso? Hoje volta ao login sem aviso. | TI (dono do portal) |
| Haverá entrada por conta Microsoft/Google? Não existe no código. | TI / infraestrutura de identidade |
| Qual é a cor de marca oficial do portal: `#8f0324` (em uso) ou `#7d212b` (arquivo de tokens)? | Comunicação / marca |

---

## 7. Divergências contra as telas de referência do UCAMDS (projeto `portal`)

Fonte do DS: `DSUCAM/spec/templates.json` → `projetos[portal].templates[]`. No momento da leitura o projeto tinha **cinco** telas: `grade-modulos`, `login`, `recuperar-senha`, `recuperar-senha-codigo`, `definir-senha`. O `_catalogo-ucamds.md` lista só as duas primeiras. A descrição do projeto no DS ainda diz "AngularJS, ~2016" como stack atual.

| Tela do DS | No sistema real | Divergência |
|---|---|---|
| `login` (título "Entrar"; CPF*, Senha*; botão "Entrar"; "Esqueci minha senha", "Conta Microsoft", "Conta Google", "Primeiro acesso", "Fale com o suporte") | "Autentique-se / Acesse sua conta"; CPF, Senha; "Entrar no Portal"; "Lembrar de mim"; "Esqueci minha senha"; "Primeiro acesso" (PDF); "Cadastrar senha"; painel de marca com atalhos institucionais | **O sistema não tem** entrada por Microsoft ou Google. **O DS não tem** "Lembrar de mim", o botão "Cadastrar senha", nem o painel de marca com atalhos (Outlook, Fale com a UCAM, Área do inscrito, WhatsApp). "Primeiro acesso" no sistema abre um manual em PDF; no DS é um caminho de tela. Erro: o DS propõe erro no próprio campo; o sistema usa um alerta único no topo. Regra "o erro não diz se o CPF existe" — **atendida** no login (regra 5). Regra aberta "quantas tentativas bloqueiam" — **não há bloqueio** (regra 7). |
| `grade-modulos` ("Meus sistemas"; "Favoritos 5 fixados"; seções EAD, Presencial, ITECAM, Rio; Grade/Lista; "Recolher todas"; "Buscar sistema") | "Meus sistemas"; "Acessos frequentes"; seções Campos, Rio, EAD, ITECAM, ICAM (as que o CPF tiver); grade/lista; "Recolher/Expandir todas"; "Buscar aplicação…"; chips de filtro por seção; três contadores; saudação | **Nomes**: o DS chama a unidade presencial de "Presencial"; o sistema chama de **"Campos"** e tem **ICAM**, que o DS não lista. O DS fala em "sistema", o campo de busca do sistema diz "aplicação". **Favoritos**: no DS são por pessoa e valem em qualquer dispositivo; no sistema ficam no navegador e o bloco se chama "Acessos frequentes" (favoritos + uso recente, teto de 8). **A mais no sistema**: saudação por horário, frase de resumo, contadores Sistemas/Seções/Favoritos, chips de filtro por seção, pílulas de escopo no cartão do usuário, itens Ouvidoria e Central de ajuda, estado "Aguarde..." no cartão, selo DEV. **A mais no DS**: campus na faixa; navegação lateral com os módulos do ecossistema. A regra do DS "o mesmo sistema pode existir em até quatro unidades" — o sistema tem até cinco rótulos (Campos, Rio, EAD, ITECAM, ICAM). |
| `recuperar-senha` (título "Recuperar senha"; CPF*; botão "Enviar código") | mesmo título; botão **"Continuar"**; o envio só acontece depois do diálogo "Confirme o envio" | Rótulo do botão e momento do envio diferem. A proposta do DS "a tela não diz se o CPF tem cadastro" **não é atendida**: o sistema responde "Usuário inválido!" (regra 28) — o próprio DS registra isso. |
| `recuperar-senha-codigo` (título "Confirme que é você"; um campo "Código de verificação*"; "Confirmar código", "Reenviar código", "Usar outro e-mail") | título **"Confirmar identidade"**; **seis caixas** de um dígito; "Confirmar código"; "Reenviar código (Ns)" | Título e peça do código diferem. "Usar outro e-mail" **não existe** no passo 2 do sistema: a escolha do e-mail é um diálogo antes do envio. O DS afirma "vale 20 minutos" na tela; o sistema diz só "período curto" (o valor é 20 min, regra 33). A dúvida aberta do DS sobre as 5 tentativas tem resposta: a contagem existe no fluxo novo (regra 34). |
| `definir-senha` ("Nova senha*", "Confirmar nova senha*"; "Salvar nova senha"; "Ir para a entrada") | iguais; link de sucesso **"Voltar ao login"** | Praticamente igual. O sistema tem o resultado **parcial** ("não foi possível concluir a alteração em todos os ambientes"), que o DS não mostra. Vocabulário: o DS diz "entrada", o sistema diz "login". |

### Telas e diálogos do sistema que o DS não tem
- Diálogo "Escolha o e-mail".
- Diálogo "Confirme o envio".
- Estado de sessão expirada (o sistema também não tem tela; só redireciona).

### Telas do DS que o sistema não tem
- Nenhuma tela inteira. Faltam no sistema: entrada por conta Microsoft/Google e "Fale com o suporte" como link do formulário (o sistema usa WhatsApp no rodapé e "Central de ajuda" no painel).

### Moldura
- O DS aplica o `app-shell` do ecossistema (faixa + navegação + campus). O portal real tem moldura própria com a **lateral em gradiente vinho**, fonte serifada na marca (Source Serif 4) e raios grandes (14 e 22 px) — linguagem visual distinta do Gerencial (Inter + IBM Plex Mono, raios 6 e 10 px) e da Isenção.
- Não há seletor de campus: a unidade é seção da grade.
