# Gerencial v3.0 (real) × telas `gerencial/*` do UCAMDS

Lido em 06/10/2026 no commit de 03/10. Angular 22 em `frontend/`, Spring em `backend/`.
`FE` = `frontend/src/app`; `BE` = `backend/gerencial/src/main/java/br/ucam/sigu/gerencial`.

O sistema real tem 19 rotas e 16 telas distintas. O DS tem 6 telas de referência; só `usuarios` e
`usuario-form` têm tela real de mesma forma. `inicio` e `grupo-menu` divergem na forma, e
`usuario-detalhe` e `auditoria` não têm contraparte real.

## Telas reais

Toda listagem tem busca com botão "Buscar" (não filtra ao digitar), badge de Status e, por linha,
**Editar** e **Excluir** com modal de confirmação. Não há seleção, lote, exportar nem ordenação.
Todo formulário tem Cancelar e Salvar no topo e no rodapé, e "Status atual" só leitura na edição.

| Rota | O que faz | Forma | Colunas / campos | Ações | No DS |
|---|---|---|---|---|---|
| `/handoff` | Troca o JWT do fragment por sessão | mensagem ("Validando sua identidade") | — | — | não existe |
| `/sessao-expirada` | Avisa que não há sessão | mensagem (cartão "Sessão encerrada") | — | nenhuma, nem link | não existe |
| `/` | Início do módulo | painel de atalhos, sem números | hero bordô com busca; "Acesso rápido" (Usuários, Grupos, Menus, Grupo × Menu); "Todas as categorias" | links | `inicio` (diverge) |
| `/categoria/:slug` | Itens de Cadastros ou Permissões | grade de cartões | título + descrição | link | não existe |
| `/usuarios` | Contas de acesso | lista com filtro | Nome, Login, Status (Ativo/Inativo/Bloqueado) | Editar, Excluir | `usuarios` (diverge) |
| `/usuarios/:oid` | Cria/edita conta | formulário | Pessoa (opcional), Login, Login antigo (leitura), Senha, Palavra-chave, Data de expiração, switch Bloqueado + Motivo | Salvar; "Restaurar registro existente" | `usuario-form` (diverge) |
| `/aplicacoes` | Aplicações | lista com filtro | Sigla, Nome, Status | Editar, Excluir | não existe |
| `/aplicacoes/:oid` | — | formulário | Sigla, Nome, Tipo de usuário (oid digitado) | Salvar | não existe |
| `/grupos` | Grupos | lista com filtro | Sigla, Nome, Status | Editar, Excluir | não existe |
| `/grupos/:oid` | — | formulário | Sigla, Nome, Descrição, Tipo de usuário (oid) | Salvar | não existe |
| `/unidades` | Unidades/coligadas | lista com filtro | Sigla, Cidade/UF, Status | Editar, Excluir | não existe |
| `/unidades/:oid` | — | formulário em 3 cartões | Identificação (Sigla, Código, CNPJ, Razão social, Mantenedora); Contato (Responsável, CPF, Telefone, E-mail, Site); Endereço (CEP, Logradouro, Número, Complemento, Bairro, Cidade, UF) | Salvar | não existe |
| `/mantenedoras` | Mantenedoras | lista com filtro | Sigla, Razão social, CNPJ, Status | Editar, Excluir | não existe |
| `/mantenedoras/:oid` | — | formulário | Sigla, Código, Razão social, CNPJ, Homepage, Responsável, CPF do responsável, Credenciamento | Salvar | não existe |
| `/cartoes-seguranca` | Cartões por pessoa | lista com filtro | Pessoa, Semente, Início, Fim, Status | Editar, Excluir | não existe |
| `/cartoes-seguranca/:oid` | — | formulário | Pessoa vinculada, Semente, Data início, Data fim | Salvar | não existe |
| `/menus` | Itens de menu | lista com filtro em memória, sem paginação | Nome, Legenda, Link, Menu pai, Status | Editar, Excluir | não existe |
| `/menus/:oid` | — | formulário | Nome, Legenda, Link, Aplicação (travada na edição), Menu pai | Salvar | não existe |
| `/permissoes/grupo?aba=menus\|usuarios` | Grupo × Menu e Grupo × Usuários | lista + inspetor em 3 colunas (Unidade, Grupo, abas) | Usuários: Nome, Padrão. Menus: agrupados por aplicação | Vincular grupo; Vincular usuário (+ Padrão); Remover; Conceder (Aplicação, depois Menu); Revogar | `grupo-menu` (diverge) |
| `/permissoes/usuario-menu` | Acesso direto por usuário | lista + inspetor em 3 colunas (Usuário, Unidade, Menus) | menus por aplicação | Conceder, Revogar | não existe |
| `/permissoes/menu-usuarios` | Quem acessa um menu | lista + inspetor em 3 colunas (Unidade, Menu, Usuários) | Nome, Grupo(s), Acesso direto | Conceder acesso direto; Revogar só o direto | não existe (o DS propõe eliminar) |

## Divergências

**`inicio`.** O DS desenha 4 indicadores, "Precisa de atenção", "Alterações recentes" e o botão
Novo usuário. O real é o que o DS lista como problema: hero bordô com segunda busca, Acesso rápido
e cartões de categoria. Não há endpoint de contagem, pendência ou histórico: o conteúdo do DS não
tem dado que o sustente.

**`usuarios`.**
- Colunas: o DS tem Pessoa (nome + CPF mascarado), Grupos, Situação com motivo e último acesso. O real tem Nome, Login em claro e Status; o item da lista não traz grupos, e-mail nem data.
- Ações: o DS usa Bloquear/Desbloquear na linha e em lote, Exportar, segmented por situação, filtro por grupo e menu de coluna. O real só tem Editar e Excluir; bloquear é um switch dentro do formulário.
- Situações: o DS usa ativo, bloqueado e "aguardando acesso". O real usa Ativo, Inativo (excluído logicamente) e Bloqueado.
- Busca: o DS busca por nome, CPF ou e-mail ao digitar; o real, por login ou nome, com botão.

**`usuario-detalhe`.** Não existe no real: `/usuarios/:oid` é o formulário. Redefinir senha por
e-mail, reemitir cartão, validade de acesso direto e linha do tempo não têm backend. O cartão real
se liga a Pessoa, não a Usuário.

**`usuario-form`.** O DS tem CPF como login, lotação, tabela de grupos e "Criar usuário". O real não
escolhe grupos na criação e não tem e-mail nem lotação; tem Pessoa vinculada, Senha digitada pelo
administrador, Palavra-chave, Data de expiração, Bloqueado + Motivo e Login antigo. O Login é texto
livre. A dúvida aberta do DS sobre CPF com conta existente está resolvida no real: login inativo
gera oferta de restauração.

**`grupo-menu`.**
- Hierarquia: no DS, grupos numa coluna e menus com checkbox por aplicação. No real, Unidade → Grupo → Aplicação → Menu; o vínculo é por par grupo–unidade, e a unidade não aparece no DS.
- Gravação: o DS salva em lote ("Salvar permissões", Descartar, Copiar de outro grupo). O real grava a cada clique, um menu por vez, com confirmação só para revogar.
- O real mostra só os menus concedidos, sem "22 de 44" nem checkbox de aplicação inteira.
- Propagação pai/filho automática existe no real e não está no DS.
- O DS elimina Menu × Usuários; no real é tela própria, e Grupo × Usuários é aba de Grupo × Menu.

**`auditoria`.** Não existe no real, nem rota nem endpoint (a auditoria JPA foi removida, nota de
21/09/2026 no ADR-0020).

**Moldura.** O DS tem rail entre sistemas, campus num select da faixa, Favoritos e busca de usuário,
grupo e menu. O real tem topbar em gradiente bordô, toggle "Base de dados" (tenant) acima do
combobox "Campus Universitário", árvore de menu vinda do backend por permissão, busca só de item de
menu, tema escuro e link para o manual. "Estrutura" (Unidades + Mantenedoras) é proposta do DS; no
real ficam soltas em Cadastros.

## Peças e identidade

| Componente | Desenha | Props |
|---|---|---|
| `app-shell` | topbar, sidebar, breadcrumb, "Voltar para…", cabeçalho de página, rodapé; conteúdo com largura máxima de 960px | `titulo`, `itemAtivo` |
| `app-menu-arvore-item` | nó da árvore da sidebar (`<details>` com ícone, contador e seta) | `item`, `nivel`, `termoBusca` |
| `app-icone-categoria` | ícone SVG escolhido pelo nome | `nome` |
| `app-combobox-busca` | campo com busca e sugestões, local ou remota | `opcoes`, `valor`, `placeholder`, `desabilitado`, `inputId`, `buscaRemota`, `required`; saídas `valorChange`, `buscar` |
| `app-confirmacao-modal` + `ConfirmacaoService` | diálogo de confirmação | `confirmar(mensagem, {titulo, textoConfirmar, textoCancelar, perigo})` |

Tabela, badge, botões, paginação, cartão e colunas do inspetor são classes globais em
`frontend/src/styles.css` (`.card`, `.btn-primary`, `table.lista`, `.badge-ativo`, `.md-shell`).

- Bordô `--accent #a91733`, hover `#8f0324`, suave `#fbf1f4`, gradiente da topbar `#a91733` → `#5c0217`.
- Neutros: fundo `#f5f6f8`, superfície `#ffffff`, borda `#dde1e6`, texto `#212529`, apagado `#5c6675`.
- Estados: sucesso `#1c7d52`, erro `#b7362b`, aviso `#95610a`.
- Raio 6/10px, sidebar 296px, topbar 64px; tema escuro com accent `#d43a5c`.
- Fontes Inter e IBM Plex Mono.
- Origem declarada: a skill local `design-system-ucam` (ADR-0027), que substituiu o `#7D212B` do Manual da Marca (ADR-0007).
- Nenhuma ocorrência de `@ucam/`, `.ucam-`, `ucam-ds`, `UCAMDS` nem da lib do time.

## Regras determinantes

1. **Excluir é sempre inativar**, nunca remoção física: `BE/application/usuario/ExcluirUsuarioUseCase.java:10,33`, e o mesmo nos outros seis agregados.
2. **Exclusão bloqueada por dependência**: menu com filhos ativos (`ExcluirMenuUseCase.java:34-40`), aplicação com menus ativos (`ExcluirAplicacaoUseCase.java:35-41`), mantenedora com unidades ativas (`ExcluirMantenedoraUseCase.java:35-41`). Usuário, grupo e unidade ainda não têm checagem.
3. **Login duplicado**: ativo dá erro; inativo oferece restauração (`CriarUsuarioUseCase.java:37-45`).
4. **Bloqueio exige motivo**; desbloquear apaga o motivo (`BE/domain/usuario/Usuario.java:107-117`).
5. **Bloqueado ou inativo não entra** (`BE/application/sessao/EntrarUseCase.java:43-47`).
6. **Sem tela de login**: o handoff lê `/handoff#token=` e limpa a URL. Sem sessão ou com 401, vai para `/sessao-expirada`. O token fica só em memória, então F5 perde a sessão (`FE/core/services/auth.service.ts:29-32`).
7. **Tenant → unidade → menus**: a troca de base dentro do módulo pede confirmação e volta ao Início (ADR-0033).
8. **Permissão se navega por unidade**: Unidade → Grupo → Aplicação → Menu; conceder exige escolher a aplicação antes.
9. **Propagação pai/filho** ao conceder e revogar (`BE/domain/menu/PropagacaoHierarquicaDeMenuService.java:16-22`).
10. **Cartão de segurança**: pessoa + semente (número do cartão) + início + fim, com fim ≥ início (`BE/domain/cartaoseguranca/CartaoSeguranca.java:64-75`). O ADR-0018 não descreve reemissão nem uso.

Em Menu × Usuários só o acesso direto é revogável. Não há perfis: as rotas usam só `authGuard`; se
o backend valida permissão de menu por endpoint, não confirmado.

## Formas que se repetem

- **Lista + formulário por oid: 7 pares, 14 rotas** (usuários, aplicações, grupos, unidades, mantenedoras, cartões, menus). As listas são praticamente o mesmo HTML.
- **Lista + inspetor em 3 colunas: 3 telas.**
- **Painel de atalhos: 2** (Início e Categoria).
- **Mensagem de tela cheia: 2** (handoff e sessão expirada).

Uma referência de "listagem de cadastro" e uma de "formulário de cadastro" cobrem 12 das 14 rotas de
cadastro; Usuários fica à parte nas duas. Uma de "permissão em 3 colunas" cobre as três de permissão.
