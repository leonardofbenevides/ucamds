# portal-login-v2 (real) × telas `portal/*` do UCAMDS

Lido em 06/10/2026 no commit de 03/10. Angular 20 em `frontend/`, Spring em `backend/`.
`F` = `frontend/src/app`, `B` = `backend/src/main/java/br/ucam/portal/login`.

## Telas reais

Rotas em `F/app.routes.ts:5-27`; `''` e `**` redirecionam para `login`.

| Rota | O que faz | Campos e mensagens | Ações | No DS |
|---|---|---|---|---|
| `login` | Autenticação, em duas colunas: painel de marca + cartão | CPF (máscara, obrigatório; dica "Somente números, com ou sem pontuação."), Senha (mostrar/ocultar), "Lembrar de mim" (guarda só o CPF). Erros: "Informe CPF e senha."; "CPF ou senha incorretos. Verifique os dados e tente novamente."; "Não foi possível concluir o acesso no momento. Tente novamente em instantes." | "Entrar no Portal"; "Esqueci minha senha"; "Primeiro acesso" (abre PDF do manual); "Cadastrar senha" (vai para a recuperação); "Central de ajuda" (WhatsApp) | `portal/login` |
| `recuperar-senha` passo 1 | Localiza o cadastro; indicador de 3 etapas | CPF. "Informe o CPF."; "Usuário inválido!"; "Não foi possível localizar um e-mail cadastrado para recuperação. Entre em contato com a Central de ajuda." | "Continuar"; "Voltar ao login" | não existe |
| diálogo "Escolha o e-mail" | Radios de e-mails mascarados com rótulo de origem | "Selecione o e-mail para receber o código." | Cancelar / Continuar | não existe |
| diálogo "Confirme o envio" | "O código de verificação será enviado para o e-mail: … Deseja enviar?" | — | Cancelar / "Enviar código" | não existe |
| `recuperar-senha` passo 2 | "Confirmar identidade": 6 caixas de código | "Informe o código de verificação completo."; "Código inválido!"; "Código expirado. Solicite um novo código."; "Aguarde alguns instantes antes de solicitar um novo código." | "Confirmar código"; "Reenviar código (60s)" | não existe |
| `cadastrar-senha` | "Definir nova senha" e sucesso "Senha atualizada" | Nova senha, Confirmar nova senha. "Informe a nova senha."; "As senhas precisam ser iguais"; "Sessão de recuperação inválida. Solicite um novo código." | "Salvar nova senha"; "Voltar ao login" | não existe |
| `dashboard` (guard de sessão) | Grade de sistemas: barra lateral, barra superior, conteúdo | Busca "Buscar aplicação…" (atalho `/`) | Abrir sistema, favoritar, chips de seção, grade/lista, recolher/expandir todas, tema claro/escuro, recolher menu, Ouvidoria, Central de ajuda, Sair | `portal/grade-modulos` |

Estados do dashboard: "Carregando…"; "Não foi possível carregar os sistemas."; vazio "Nenhuma
aplicação disponível"; busca vazia "Nenhum sistema encontrado" + "Limpar busca e filtros"; cartão
"Aguarde..."; pop-up bloqueado; 403 "Aplicação não liberada para o usuário.".
No login não existem os estados bloqueado, senha expirada nem primeiro acesso.

## Fluxo

- **Login:** `POST /api/auth/token` com `client_id` fixo do portal (`F/pages/login/login.ts:55-58,118`). O backend varre todas as bases e aceita se CPF e senha casarem em pelo menos uma (`B/service/AuthService.java:105-136`).
- **Sem escolha de unidade, tenant ou perfil.** O seletor foi rejeitado pela gestão (`docs/sdd/decisions.md:219`).
- **Pós-login:** `POST /api/portal/post-login` devolve `DASHBOARD` ou `REDIRECT` quando o `client_id` é de outro sistema (`B/service/PostLoginService.java:68-77`).
- **Dashboard:** saudação "Bom dia, {nome}" e "Você tem acesso a N aplicações em M seções."; contadores Sistemas, Seções, Favoritos; bloco "Acessos frequentes" (favoritos + usos recentes, máximo 8); seções recolhíveis por base (Campos, Rio, ITECAM, ICAM, EAD) com subtítulo Presencial/EAD; busca por nome, sigla ou seção. Não agrupa por categoria.
- **Abertura de um sistema:** abre uma aba "Abrindo a aplicação…" e chama `POST /api/portal/dashboard/apps/{oid}/launch`. Sistemas comuns recebem `{dns}/{token}/{oidUsuario}[/{oidUnidadePadrao}]`, o padrão `login/:token/:usuario`; a unidade vai só para 7 sistemas listados. Suporte recebe formulário POST; BI e Frequência Online, página-ponte.
- **Recuperação:** CPF → escolha de e-mail se houver mais de um → confirmação → código de 6 dígitos → nova senha. Só por e-mail. Lookup vale 15 min; código vale 20 min; reenvio após 60 s. A troca vale para todas as identidades do CPF.
- **Regra de senha:** nenhuma além de não vazia e igual à confirmação, no front e no back.

## Divergências com o DS

**`portal/login`**
- O DS propõe entrada por Microsoft/Google; o real não tem.
- Botão "Entrar" no DS, "Entrar no Portal" no real, que também tem "Lembrar de mim".
- "Primeiro acesso" no DS é link de fluxo; no real é um PDF. "Cadastrar senha" é a própria recuperação.
- No real o painel de marca vem primeiro, com 3 destaques e "Atalhos institucionais" (Webmail, Ouvidoria, Acompanhar inscrição, Central de ajuda), e continua visível empilhado em tela estreita; no DS a coluna institucional fica à direita com a lista de sistemas e some abaixo de 64rem.
- A regra aberta do DS sobre tentativas que bloqueiam não tem base no código: não há bloqueio.
- `stack_atual` do projeto diz "AngularJS, ~2016"; o real é Angular 20.

**`portal/grade-modulos`**
- Grupos: o DS traz EAD, Presencial, ITECAM, Rio. No real são Campos, Rio, ITECAM, ICAM e EAD; "Presencial" é subtítulo e ICAM não existe no DS.
- Filtro: o DS põe as unidades na coluna lateral; o real usa chips "Todas"/seção.
- Favoritos: o DS propõe por pessoa em qualquer dispositivo; no real ficam no navegador e se misturam com uso recente em "Acessos frequentes" (`F/core/dashboard-prefs.ts`).
- "Meus dados" e o selo "Legado" não existem no real.
- Ordenação: o real ordena só as seções (a da sessão primeiro); os cartões vêm na ordem do banco.
- Cartão real: ícone por categoria derivada do nome (19 categorias, `F/shared/system-icon-catalog.ts:45`), nome do banco, estrela e seta.
- O real tem tema escuro e saudação; as telas do DS não mencionam.

## Identidade e peças

- Sem biblioteca de componentes; estilos globais em `frontend/src/styles/_auth-shell.scss` e `_dashboard.scss`. Compartilhados: `F/shared/auth-brand-panel.*`, `F/shared/system-icon.ts`.
- Cores: marca `#4A0217`, `#6B0A26`, `#8F0324`, `#B4365B`, `#C25470`, `#F7E9ED`, `#FCF6F7`; texto `#241F26`; borda `#E7DEE1`; fundo `#FBF7F8`; sucesso `#1F7A4D`; erro `#B23A45`. Acento por seção: EAD `#B4365B`, Campos `#146B5E`, ITECAM `#9A6512`, Rio `#3D3A8C`, ICAM `#0F6A8A`.
- Fontes: Inter no corpo, Source Serif 4 nos títulos.
- Quebras: 920px e 520px na autenticação; 980px (menu vira gaveta) e 620px no dashboard.
- Não usa nem cita `@ucam/*`, `.ucam-*` ou a lib do time; só variáveis `--ucam-*` locais.

## Regras determinantes

1. Credencial é CPF + senha, sem seletor; basta casar em uma base. `AuthService.java:105-136`.
2. Mensagem única de erro, sem revelar se o CPF existe. `F/core/login-error.ts:27,45`.
3. Não há contagem de tentativas nem bloqueio de login.
4. Token de 20 min deslizante (`LegacyAuthConstants.java:24`); o front não avisa a expiração e 401 leva ao login (`F/core/session.guard.ts:8-19`).
5. Sem política de senha; hash MD5→Base64 herdado (`B/security/PasswordService.java`). Não há senha expirada nem troca obrigatória.
6. A sessão guarda todas as identidades do CPF e cada uma vira uma seção (`DashboardService.java:95-102`).
7. Não há perfil no portal: o acesso é a relação usuário × aplicação.
8. Catálogo: `aplicacaousuario` + `aplicacao` com `exibicaodashboard = true` e status ativo, por base, mais 4 especiais. Responde à regra aberta do DS sobre de onde vem a grade.
9. Cartão sem endereço ativo não aparece; o próprio portal é excluído.
10. Código de recuperação: 6 dígitos por e-mail, 20 min, reenvio em 60 s; o limite de 5 tentativas só é contado no fluxo legado (contagem no fluxo novo não confirmada).

## Achado de segurança (conferido em 06/10)

`B/security/PasswordService.java` tem uma senha mestra fixa no código, comentada como "TEMP
incidente — senha mestra para teste com visão do usuário. REMOVER assim que o teste terminar", e
`AuthService.java:102` a aceita no login. Está no commit mais recente do repositório (03/10).
O valor não foi copiado para este documento.
