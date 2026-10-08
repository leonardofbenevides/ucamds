# Módulo Gerencial — respostas pelo código (62 perguntas)

Pesquisa feita em 06/10/2026 nos clones locais de `C:\Users\Leonardo\Documents\UCAM-repos\`.
Abreviações de caminho usadas nas evidências:

- **G3** = `Gerencial-v3.0-2026` (o Gerencial novo). `G3/.../gerencial/` = `G3/backend/gerencial/src/main/java/br/ucam/sigu/gerencial/`. `G3/.../platformcore/` = `G3/backend/platform-core/src/main/java/br/ucam/sigu/platformcore/`. `G3/migration/` = `G3/backend/gerencial/src/main/resources/db/migration/`.
- **SIGU** = `sigu` (legado, onde vive o Gerencial antigo em `ModuloGerencial`) e **SIGU2** = `sigu_2-0`.
- **PV2** = `portal-login-v2`. `PV2/backend/...login/` = `PV2/backend/src/main/java/br/ucam/portal/login/`.

"Hoje" quer dizer o Gerencial novo (G3), salvo quando dito "no legado". O G3 lê e escreve nas mesmas tabelas do legado.

Contagem: 38 RESPONDIDA · 14 RESPONDIDA EM PARTE · 10 NÃO ESTÁ NO CÓDIGO.

---

### gerencial--inicio--1
**Pergunta:** O que é "aguardando acesso".
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Esse estado não existe. Uma conta tem só: situação (ativo/inativo — `A`/`D` no banco), bloqueado (sim/não) com motivo, data de ativação (preenchida com o dia da criação) e data de expiração. Não há aprovação de conta, nem registro de primeiro ou último login. O único sinal aproveitável vem do legado: lá a conta nascia com a **senha vazia** e só passava a entrar depois de "Cadastrar senha" no Portal — "aguardando acesso" poderia ser "conta ativa sem senha". No G3, porém, a senha é obrigatória na criação, então nem esse sinal sobra para contas novas.
**Evidência:** G3/.../gerencial/domain/usuario/Usuario.java:63-80 — "Cria um novo usuário … sempre ATIVO, sem bloqueio" (`LocalDate.now()` como data de ativação) · SIGU/ModuloGerencial/src/br/ucam/campos/dti/controller/helper/UsuarioHelper.java:308 — `this.obj.setSenha("");`
**O que ainda falta decidir:** Se o conceito existe; se sim, o critério (e onde guardar o "primeiro login", que hoje ninguém grava).

### gerencial--inicio--2
**Pergunta:** [proposta] Os números do painel são da unidade escolhida na faixa.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O servidor não tem painel nem contagens. E o modelo de dados não sustenta a proposta como está: usuário, grupo, aplicação e mantenedora pertencem à **base de dados** (tenant: Campos, EAD, Rio), não à unidade; todas as listagens trazem a base inteira. A unidade só entra em três coisas: o vínculo usuário×unidade, o vínculo grupo×unidade e a árvore de menus. "Usuários da unidade" teria de ser definido como "usuários com vínculo ativo naquela unidade".
**Evidência:** G3/docs/adr/0013-entrada-de-sessao-usuario-tenant-unidade.md:26-34 — "O tenant é basicamente para saber em qual database a aplicação está gerenciando, e dentro deste database o usuário passado pode ter acesso a várias unidades" · G3/.../gerencial/presentation/rest/usuario/UsuarioController.java:53-60 (listagem só com `termo`, `pagina`, `tamanho`)
**O que ainda falta decidir:** O recorte dos números (base ou unidade) e a definição de cada um.

### gerencial--inicio--3
**Pergunta:** [proposta] São pendência: conta bloqueada, sem grupo, aguardando acesso e grupo sem menu.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O servidor não trata pendências. Do que a proposta lista: "bloqueada" é um campo e pode ser contado; "sem grupo" e "grupo sem menu" não são campos, mas podem ser calculados dos vínculos; "aguardando acesso" não existe (ver inicio--1). Nenhuma consulta dessas existe hoje.
**Evidência:** inventário de endpoints em G3/.../gerencial/presentation/rest/ (11 controladores: usuários, grupos, aplicações, unidades, mantenedoras, cartões, menus, permissão direta, menu×usuários, pessoas, sessão) — nenhum de contagem ou pendência
**O que ainda falta decidir:** A lista de pendências e quem as resolve.

### gerencial--inicio--4
**Pergunta:** O servidor vai fornecer as contagens e as pendências do início?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje não fornece nada disso, e "alterações recentes" é impossível com os dados atuais: a auditoria que gravava quem alterou e quando foi **removida** em 21/09/2026, porque as colunas não existem nas tabelas reais. O Início do G3 é, de fato, uma lista de atalhos (cartões por área), criada sem equivalente no legado, onde a página inicial era vazia.
**Evidência:** G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:122-135 — "Não existe auditoria genérica no `platform-core` nem nas entidades do módulo" · G3/docs/adr/0011-primeiro-agregado-usuario.md:53-58 — "No legado, o conteúdo padrão (`paginas/inicio.xhtml`) era vazio … aqui foi adicionado um conteúdo (cards por área)"
**O que ainda falta decidir:** Se o time do servidor fará os endpoints; "alterações recentes" depende de decidir a auditoria (ver auditoria--5).

### gerencial--usuarios--2
**Pergunta:** [proposta] Conta não se exclui pela listagem; bloquear é reversível.
**Veredito:** RESPONDIDA
**Resposta:** O sistema tem as duas coisas, e nenhuma apaga nada. "Excluir" (`DELETE /api/usuarios/{oid}`) é exclusão lógica: muda a situação para inativo; o registro e os vínculos continuam no banco, e a conta volta com `POST /api/usuarios/{oid}/restaurar`. "Bloquear" é outro campo, alterado na edição, com motivo obrigatório, e desfeito na mesma tela. Diferença para o legado: lá a exclusão era **recusada** se a conta tivesse dependências (função de banco `valida_exclusao`); no G3 a exclusão de usuário não confere nada.
**Evidência:** G3/.../gerencial/application/usuario/ExcluirUsuarioUseCase.java:33 — `usuario.desativar();` (e o comentário "Checagem de dependências ainda não implementada aqui") · G3/.../gerencial/presentation/rest/usuario/UsuarioController.java:96-104 · G3/docs/inventario/ModuloGerencial/inventario-regras-de-negocio.md:7-16 (RN-01)
**O que ainda falta decidir:** Onde fica o "excluir" na tela e se volta a checagem de dependências.

### gerencial--usuarios--3
**Pergunta:** Quais dígitos do CPF ficam visíveis na máscara.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje não há máscara: a listagem devolve o login inteiro — e nas bases reais o login é o CPF. A busca aceita trecho do login ou do nome. O único lugar que mascara é o log do Portal. A regra de quais dígitos mostrar não existe em lugar nenhum.
**Evidência:** G3/.../gerencial/presentation/rest/usuario/UsuarioListItemResponse.java — "`nomeExibicao` … (achado real: coluna só mostrava o login, que neste tenant é o CPF)" · G3/docs/adr/0030-nome-de-exibicao-nas-telas-de-selecao-de-usuario.md:1 — "Nome de exibição (não login/CPF)"
**O que ainda falta decidir:** A máscara e quem pode ver o CPF inteiro.

### gerencial--usuarios--4
**Pergunta:** Quem pode bloquear e desbloquear.
**Veredito:** RESPONDIDA
**Resposta:** Qualquer pessoa com sessão válida no Gerencial. O servidor não tem perfis: a sessão é emitida com a lista de perfis vazia, a única regra de segurança é "estar autenticado", e nenhum endpoint confere menu ou grupo. A permissão de menu controla só o que aparece na barra lateral; quem souber o endereço da API faz qualquer operação. Além disso, o SIGU2 bloqueia a conta sozinho depois de 3 erros no cartão de segurança.
**Evidência:** G3/.../platformcore/security/SecurityConfig.java:43-47 — `.requestMatchers("/api/sessao").permitAll() … .anyRequest().authenticated()` · G3/.../gerencial/infrastructure/security/JwtEmissorDeSessaoAdapter.java:23-24 — "perfis (RBAC) fica para quando o agregado Grupo/Permissões existir" / `generateAccessToken(oidUsuario, tenant, List.of())`
**O que ainda falta decidir:** Os perfis de operador e onde a conferência é feita (servidor).

### gerencial--usuarios--5
**Pergunta:** Bloqueio tem motivo obrigatório? Quais motivos existem?
**Veredito:** RESPONDIDA
**Resposta:** Sim, o motivo é obrigatório: bloquear sem motivo é recusado com "Motivo do bloqueio é obrigatório.". É texto livre (coluna `motivobloqueio`); não há lista de motivos. Desbloquear apaga o motivo — o histórico se perde. Dos três motivos que a pergunta cita: decisão manual existe; "tentativas de senha" não existe (ninguém conta tentativa); desligamento não tem tratamento próprio. Há um bloqueio automático real que a pergunta não cita: 3 erros no cartão de segurança (SIGU2), que bloqueia **sem** gravar motivo.
**Evidência:** G3/.../gerencial/domain/usuario/Usuario.java:107-109 — `if (motivo == null || motivo.isBlank()) { throw new IllegalArgumentException("Motivo do bloqueio é obrigatório."); }` · SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:135-144 — `getUsuario().setBloqueado(true); … logout();`
**O que ainda falta decidir:** Se os motivos viram lista fechada e se o motivo é guardado depois do desbloqueio.

### gerencial--usuarios--6
**Pergunta:** [proposta] Bloquear em lote pula quem já está bloqueado.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe operação em lote: o bloqueio é feito conta a conta, pela edição (`PUT /api/usuarios/{oid}`). Detalhe para o desenho: essa edição regrava tudo — bloquear de novo uma conta já bloqueada **troca o motivo** pelo novo, e enviar a edição sem a marca de bloqueio **desbloqueia**.
**Evidência:** G3/.../gerencial/application/usuario/AtualizarUsuarioUseCase.java:42-46 — `if (comando.bloqueado()) { usuario.bloquear(comando.motivoBloqueio()); } else { usuario.desbloquear(); }`
**O que ainda falta decidir:** Se haverá lote; se sim, o servidor precisa de um endpoint próprio de bloqueio.

### gerencial--usuarios--10
**Pergunta:** A lista de usuários vai trazer os grupos e o último acesso?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje traz cinco campos: identificador, login, nome de exibição (nome da pessoa, ou o login na falta), situação e bloqueado. Grupos não vêm (existiriam por consulta aos vínculos). **Último acesso não existe no banco**: a tabela de usuário não tem essa coluna, e o registro de acessos do legado (`RegistroAcessoServices`) não foi migrado.
**Evidência:** G3/.../gerencial/presentation/rest/usuario/UsuarioListItemResponse.java — `record UsuarioListItemResponse(String oid, String login, String nomeExibicao, String status, boolean bloqueado)` · G3/.../gerencial/infrastructure/persistence/jpa/UsuarioJpaEntity.java (comentário de classe) — colunas reais: `oid, login, senha, palavrachave, dataativacao, dataexpiracao, status, oidpessoa, foto, bloqueado, motivobloqueio, login_antigo`
**O que ainda falta decidir:** Se o servidor passa a entregar grupos; e onde nasce o "último acesso" (o Portal não grava login em banco).

### gerencial--usuario-detalhe--1
**Pergunta:** [proposta] O acesso da pessoa é a união dos menus dos grupos com os acessos diretos, sem repetição.
**Veredito:** RESPONDIDA
**Resposta:** O sistema já faz exatamente isso (regra RN-04, herdada do legado): para um usuário **numa unidade**, soma os menus dos grupos em que ele está naquela unidade com os menus dados diretamente a ele, sem repetir. Dois detalhes que a tela precisa respeitar: a conta é sempre por unidade (a mesma pessoa vê menus diferentes em cada uma), e cada sistema só enxerga os menus da sua própria aplicação.
**Evidência:** G3/.../gerencial/application/menu/CarregarMenusDaUnidadeUseCase.java:74-83 — `buscarUnidadeGruposDoUsuarioNaUnidade(...)` … `menuVisivelRepository.buscarTodosVisiveis(oidUnidadeUsuario, oidsUnidadeGrupo, oidAplicacaoLocal)` · G3/docs/inventario/ModuloGerencial/inventario-regras-de-negocio.md:62-74 (RN-04)
**O que ainda falta decidir:** Nada na regra. Vale mostrar a origem do acesso (o servidor já devolve, por menu, os grupos que o concedem e se há acesso direto).

### gerencial--usuario-detalhe--2
**Pergunta:** [proposta] Acesso direto a menu sempre tem validade e deixa de valer sozinho.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário: acesso direto não tem data. O vínculo guarda só usuário-na-unidade, menu e situação; vale até alguém revogar.
**Evidência:** G3/docs/adr/0014-agregado-menu-e-resolucao-de-permissao.md:36-37 — "`unidadeusuariomenu (oid, oidunidadeusuario, oidmenu, status)` … Índice único `(oidunidadeusuario, oidmenu)`"
**O que ainda falta decidir:** Adotar a proposta exige coluna nova na tabela (compartilhada com o legado) e uma rotina que encerre o acesso vencido.

### gerencial--usuario-detalhe--3
**Pergunta:** Prazo máximo de um acesso direto.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe prazo (ver usuario-detalhe--2).
**Evidência:** mesma do item anterior.
**O que ainda falta decidir:** O prazo, se a validade for adotada.

### gerencial--usuario-detalhe--4
**Pergunta:** Validade do link de redefinição de senha enviado por e-mail.
**Veredito:** RESPONDIDA
**Resposta:** Não há link. A redefinição é do Portal e usa um **código de 6 dígitos** enviado por e-mail, válido por 20 minutos (1200 s). O Gerencial não envia nada: por decisão registrada, ele "nunca implementa fluxo de senha, reset de senha". O que o operador do Gerencial pode fazer é digitar uma senha nova na edição do usuário (em branco = não alterar) — sem avisar a pessoa.
**Evidência:** PV2/contract-tests/src/main/java/br/ucam/portal/login/contracts/LegacyAuthConstants.java:24 — `TOKEN_EXPIRE_SECONDS = 20 * 60` · G3/docs/adr/0002-autenticacao-jwt-local.md:39-40 — "**Nunca** implementa fluxo de senha, reset de senha ou hash de credencial" · G3/.../gerencial/application/usuario/AtualizarUsuarioUseCase.java:38-40
**O que ainda falta decidir:** Se a ação "redefinir senha" do Gerencial vai disparar o fluxo do Portal (hoje não há integração) ou continua sendo o operador digitar a senha.

### gerencial--usuario-detalhe--5
**Pergunta:** [proposta] Reemitir o cartão de segurança invalida o anterior na hora.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não tem "reemitir" e faz o contrário da proposta. Cartão é um cadastro simples (pessoa, número-semente, início, fim). Criar um segundo cartão para a mesma pessoa **não** inativa o primeiro — e, com dois cartões vigentes, o SIGU2 recusa os dois: "foi retornado mais de um cartão de segurança. Por favor procure o centro de informática". Para trocar o cartão hoje é preciso excluir (inativar) ou encurtar a vigência do antigo antes.
**Evidência:** SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:125-132 — `if(cards.size()==1){ this.obj = … } else { … "foi retornado mais de um cartão de segurança…" }` · G3/.../gerencial/application/cartaoseguranca/CriarCartaoSegurancaUseCase.java:26-31 (só recusa **semente** repetida em cartão ativo)
**O que ainda falta decidir:** Implementar a reemissão como operação única (inativa o anterior e cria o novo).

### gerencial--usuario-detalhe--6
**Pergunta:** Tirar a pessoa do último grupo é permitido?
**Veredito:** RESPONDIDA
**Resposta:** É permitido, sem aviso nem conferência. A pessoa fica só com os acessos diretos, se tiver; sem eles, a barra lateral mostra apenas "Início".
**Evidência:** G3/.../gerencial/application/grupo/GerenciarPermissoesDeGrupoUseCase.java:197-200 — `public void revogarUsuario(...) { unidadeGrupoUsuarioRepository.revogar(oidUnidadeGrupo, oidUsuario); }`
**O que ainda falta decidir:** Se a tela avisa ou impede.

### gerencial--usuario-detalhe--8
**Pergunta:** O sistema vai ter página de detalhe do usuário, com histórico e ações de conta?
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Decisão de produto, sem registro. O servidor hoje devolve por usuário só os dados do formulário (login, palavra-chave, datas, bloqueio e motivo, situação, login antigo, pessoa). Não há histórico para mostrar (sem auditoria), nem ações de conta além de editar, excluir e restaurar.
**Evidência:** G3/.../gerencial/presentation/rest/usuario/UsuarioDetailResponse.java — `record UsuarioDetailResponse(oid, login, palavraChave, dataAtivacao, dataExpiracao, bloqueado, motivoBloqueio, status, loginAntigo, oidPessoa)`
**O que ainda falta decidir:** A página e, antes dela, a auditoria.

### gerencial--usuario-form--2
**Pergunta:** [proposta] CPF é único: não se cria segunda conta com o mesmo CPF.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O que é único é o **login**, e só **dentro de cada base de dados** (índice único no banco e conferência antes de gravar). O usuário não tem campo CPF: o CPF é da pessoa vinculada, e nas bases reais o login costuma ser o CPF. Entre bases diferentes a mesma pessoa tem contas separadas — é o caso normal (Campos, Rio, EAD…), e o Portal trata isso como regra ("pessoa = CPF", várias contas, senhas possivelmente diferentes). Nada impede duas contas com logins diferentes apontando para a mesma pessoa.
**Evidência:** G3/migration/V1__criar_tabela_usuario.sql:26 — `CREATE UNIQUE INDEX uk_usuario_login ON usuario (login);` · G3/.../gerencial/application/usuario/CriarUsuarioUseCase.java:37-41 — "Já existe um usuário ativo com o login '…'." · PV2/docs/sdd/decisions.md:217-222 (ADR-022)
**O que ainda falta decidir:** Se a unicidade é por base (como é) ou por pessoa.

### gerencial--usuario-form--3
**Pergunta:** CPF que já tem conta bloqueada: reativa ou recusa?
**Veredito:** RESPONDIDA
**Resposta:** Recusa. Bloqueada não é inativa: a conta bloqueada continua "ativa" e o formulário responde "Já existe um usuário ativo com o login '…'." (erro 409). O caminho de reativação existe só para conta **excluída** (inativa): aí a resposta é "Existe um usuário inativo com este login. Deseja restaurá-lo?", com o identificador da conta antiga, e a restauração a reativa — mantendo a senha, o bloqueio e os vínculos que ela tinha.
**Evidência:** G3/.../gerencial/application/usuario/CriarUsuarioUseCase.java:37-45 — `if (existente.estaAtivo()) { throw new RegistroDuplicadoException(…); } throw new RegistroRestauravelException("Existe um usuário inativo com este login. Deseja restaurá-lo?", existente.getOid());` · G3/docs/inventario/ModuloGerencial/inventario-regras-de-negocio.md:22-38 (RN-02)
**O que ainda falta decidir:** Se o formulário deve oferecer "ir para a conta existente e desbloquear".

### gerencial--usuario-form--4
**Pergunta:** Quais campos são obrigatórios, e se o e-mail precisa ser do domínio da UCAM.
**Veredito:** RESPONDIDA
**Resposta:** Na criação são obrigatórios **login** (até 100 caracteres) e **senha**. Opcionais: palavra-chave e pessoa vinculada. Data de expiração, bloqueio e motivo só existem na edição. **O usuário não tem e-mail**: o e-mail é da pessoa (cadastro acadêmico), que o Gerencial só consulta — por isso não há regra de domínio, nem poderia haver neste formulário. No banco, só login e situação são obrigatórios.
**Evidência:** G3/.../gerencial/presentation/rest/usuario/CriarUsuarioRequest.java:7-10 — `@NotBlank(message = "Login é obrigatório") @Size(max = 100) String login, @NotBlank(message = "Senha é obrigatória") String senha, String palavraChave, String oidPessoa` · G3/migration/V1__criar_tabela_usuario.sql:10-24
**O que ainda falta decidir:** A tela de referência pede e-mail; ou sai do formulário, ou o Gerencial passa a editar a pessoa (hoje é só leitura). E a pessoa vinculada deveria ser obrigatória? Sem ela não há nome nem e-mail para recuperar a senha.

### gerencial--usuario-form--5
**Pergunta:** Grupo é obrigatório na criação?
**Veredito:** RESPONDIDA
**Resposta:** Não. A criação não recebe grupo nem unidade: a conta nasce sem ver menu nenhum. E há um buraco maior: o G3 **não tem como vincular o usuário a uma unidade** (só lê esse vínculo); sem vínculo de unidade, a pessoa nem carrega a árvore de menus (403) e não pode receber acesso direto. No legado, criar o usuário já o vinculava à unidade em uso.
**Evidência:** G3/.../gerencial/presentation/rest/usuario/CriarUsuarioRequest.java:6-11 · G3/.../gerencial/domain/unidade/UnidadeUsuarioRepository.java:13-24 (só `buscarPorUsuario` e `buscarOidVinculo`) · SIGU/ModuloGerencial/src/br/ucam/campos/dti/controller/helper/UsuarioHelper.java:309-312 — `this.cadastrar(); … this.unidadeNova = this.unidadeAtual; this.addUnidade();`
**O que ainda falta decidir:** Se unidade e grupo entram na criação; o servidor precisa, no mínimo, do vínculo usuário×unidade.

### gerencial--usuario-form--6
**Pergunta:** [proposta] Grupo sem menu não aparece para escolha.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não faz. A lista de grupos não olha se o grupo tem menus; as telas de permissão escondem só os inativos, e isso no navegador.
**Evidência:** G3/docs/adr/0019-listagem-de-vinculos-e-permissao-direta-de-menu.md:101-103 — "Filtrado client-side por `status === 'ATIVO'` nos três componentes"
**O que ainda falta decidir:** Se a proposta entra (lembrando que "ter menu" depende da unidade: o grupo pode ter menus numa e não em outra).

### gerencial--usuario-form--7
**Pergunta:** [proposta] Acesso direto a menu não se concede na criação.
**Veredito:** RESPONDIDA
**Resposta:** O sistema já é assim, por construção: o acesso direto tem endpoint próprio, pede usuário **e** unidade, e é recusado (404 "Usuário não tem vínculo com a unidade informada") se a pessoa não tiver vínculo ativo com a unidade.
**Evidência:** G3/docs/adr/0019-listagem-de-vinculos-e-permissao-direta-de-menu.md:55-65 — `GET/POST /api/usuarios/{oidUsuario}/unidades/{oidUnidade}/menus`
**O que ainda falta decidir:** Nada.

### gerencial--usuario-form--10
**Pergunta:** O login é sempre o CPF?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O servidor não exige: login é texto livre de até 100 caracteres, sem conferência de formato nem de dígito. Na prática das bases reais o login é o CPF (o próprio time registrou isso ao trocar a coluna "login" pelo nome da pessoa), e o Portal procura a conta por igualdade exata com o que foi digitado no campo CPF. Existe ainda a coluna `login_antigo`, só de leitura, sinal de que os logins já foram trocados uma vez. Não há documento que diga "o login é o CPF" como regra.
**Evidência:** G3/.../gerencial/domain/usuario/Usuario.java:63-67 — `if (login == null || login.isBlank()) { throw new IllegalArgumentException("Login é obrigatório."); }` · PV2/backend/...login/repository/JdbcUsuarioRepository.java:27 — `AND login = :login`
**O que ainda falta decidir:** Tornar regra (e validar o CPF na criação) ou manter livre. Se o login for digitado com pontuação, o Portal não acha a conta.

### gerencial--usuario-form--11
**Pergunta:** Os grupos são escolhidos na criação da conta ou só depois, em Grupo × Usuários?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje, só depois: o vínculo é feito pela tela de permissões, escolhendo Unidade → Grupo → pessoa. No Gerencial antigo era o inverso do G3: os grupos eram uma aba **dentro** do cadastro do usuário. O ADR do primeiro incremento registra as abas "Aplicações/Unidades/Grupos vinculados" como previstas e adiadas.
**Evidência:** G3/.../gerencial/presentation/rest/grupo/GrupoController.java:101-108 — `@PostMapping("/unidades/{oidUnidadeGrupo}/usuarios")` · G3/docs/adr/0011-primeiro-agregado-usuario.md:26-28 · SIGU/ModuloGerencial/src/br/ucam/campos/dti/controller/helper/UsuarioHelper.java:407-419 (`addGrupo`)
**O que ainda falta decidir:** A decisão de produto (Gestão de acessos).

### gerencial--usuario-form--12
**Pergunta:** O que acontece quando a validade do acesso vence.
**Veredito:** RESPONDIDA
**Resposta:** Nada. A data de expiração existe e pode ser preenchida na edição, mas **ninguém a confere**: nem a entrada no Gerencial (que olha só ativo e não bloqueado), nem o login do Portal (idem). Não há rotina que bloqueie, nem aviso, nem regra de quem prorroga — qualquer operador altera a data.
**Evidência:** G3/.../gerencial/application/sessao/EntrarUseCase.java:43-47 — `.filter(Usuario::estaAtivo).filter(u -> !u.isBloqueado())` · PV2/backend/...login/repository/JdbcUsuarioRepository.java:23-31 (sem `dataexpiracao`)
**O que ainda falta decidir:** Tudo: se o vencimento barra a entrada (mudança no Portal), aviso prévio e quem prorroga.

### gerencial--grupo-menu--1
**Pergunta:** [proposta] Permissão se concede por grupo; "Menu × Usuários" vira filtro.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não é assim: mantém os **dois** caminhos de concessão (por grupo e direto ao usuário), cada um com tela e endpoints próprios, e "Menu × Usuários" é uma quarta tela, cadastrada como item de menu. As quatro são fiéis ao legado.
**Evidência:** G3/scripts/sql/seed-aplicacao-gerencial-3.0.sql:62-65 — `'Grupo × Menu'`, `'Usuário × Menu'`, `'Grupo × Usuários'`, `'Menu × Usuários'`
**O que ainda falta decidir:** Se a consolidação proposta é aceita (ver grupo-menu--10).

### gerencial--grupo-menu--2
**Pergunta:** [proposta] Mudança de permissão só vale ao salvar o lote, nunca no clique.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário: cada concessão ou revogação é uma chamada que grava na hora. E uma única ação mexe em vários menus: conceder um menu-pai concede todos os filhos; conceder um filho concede a cadeia de pais; revogar um pai revoga os filhos; revogar o último filho concedido revoga o pai também. Não existe endpoint de lote.
**Evidência:** G3/.../gerencial/application/grupo/GerenciarPermissoesDeGrupoUseCase.java:97-111 · G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:54-57
**O que ainda falta decidir:** Se haverá lote. A prévia do lote teria de simular a propagação pai/filho.

### gerencial--grupo-menu--3
**Pergunta:** Permissão salva vale na hora para quem está logado, ou no próximo login?
**Veredito:** RESPONDIDA
**Resposta:** Vale na hora no servidor: a permissão não viaja dentro da sessão; a árvore de menus é lida do banco a cada pedido, sem cache. Quem está logado só **vê** a mudança quando a tela pede a árvore de novo — ao entrar, ao trocar de unidade ou de base, ou ao recarregar a página. Como os endpoints não conferem permissão de menu, revogar um menu tira o atalho, mas não corta chamadas diretas à API.
**Evidência:** G3/docs/adr/0014-agregado-menu-e-resolucao-de-permissao.md:56-58 — "`GET /api/menus/minha-arvore?unidade={oid}` — árvore já filtrada por permissão" e :62-63 — "toda troca no combobox re-busca" · G3/docs/adr/0021-fechamento-formal-do-modulo.md:24-27 — "`ModuloGerencial` não usa cache de negócio"
**O que ainda falta decidir:** Se a tela deve atualizar a árvore sozinha. Para os outros sistemas (SIGU etc.) vale a regra de cada um.

### gerencial--grupo-menu--4
**Pergunta:** Quem pode editar as permissões de um grupo, e se alguém pode editar o grupo a que pertence.
**Veredito:** RESPONDIDA
**Resposta:** Qualquer pessoa autenticada no Gerencial, inclusive sobre o próprio grupo. Não há perfil de administrador nem trava de autoedição no servidor.
**Evidência:** G3/.../platformcore/security/SecurityConfig.java:47 — `.anyRequest().authenticated()` (não há nenhuma anotação de autorização nos controladores)
**O que ainda falta decidir:** A regra de quem pode, e a trava de autoconcessão.

### gerencial--grupo-menu--5
**Pergunta:** "Copiar de outro grupo" substitui ou soma?
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** A função não existe, nem no G3 nem nas telas do legado lidas.
**Evidência:** G3/.../gerencial/presentation/rest/grupo/GrupoController.java:93-147 (vincular unidade, vincular/revogar usuário, conceder/revogar/listar menu — só isso)
**O que ainda falta decidir:** Se a função entra e a regra dela.

### gerencial--grupo-menu--9
**Pergunta:** A unidade da permissão é a de trabalho da faixa, ou a tela precisa de seletor próprio?
**Veredito:** RESPONDIDA
**Resposta:** A tela tem seletor próprio, e a ordem foi determinada pelo responsável do projeto: Unidade → Grupo → Aplicação → Menu. A permissão pertence ao par "grupo naquela unidade", informado em cada chamada; a unidade de trabalho da faixa não participa (a sessão do servidor nem a conhece — guarda só a base de dados). Concede-se em qualquer unidade da base sem trocar a de trabalho.
**Evidência:** G3/docs/adr/0024-hierarquia-unidade-grupo-aplicacao-menu.md:14-15 — "O correto é UNIDADE TEM UMA COLEÇÃO DE GRUPOS QUE TEM UMA COLEÇÃO DE APLICAÇÕES QUE TEM UMA COLEÇÃO DE MENUS" · G3/.../gerencial/presentation/rest/grupo/GrupoController.java:111 — `@PostMapping("/unidades/{oidUnidadeGrupo}/menus")`
**O que ainda falta decidir:** Se a tela de referência adota a hierarquia decidida (unidade primeiro, menus agrupados por aplicação).

### gerencial--grupo-menu--10
**Pergunta:** "Menu × Usuários" continua como tela própria ou vira filtro?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje é tela própria e está no cadastro de menus. Mostra, para um menu numa unidade, quem tem acesso, por quais grupos e se há acesso direto; o servidor desta consulta é só de leitura, e a retirada possível é a do acesso direto ("revogar o acesso direto não tira o acesso via grupo"). Equivale à tela `unidadegrupomenuusuarios.xhtml` do legado. Se ela continua é decisão em aberto.
**Evidência:** G3/.../gerencial/application/menu/ListarUsuariosComAcessoAoMenuUseCase.java:27-42 — "Um usuário com as duas fontes aparece uma única vez, com `acessoDireto = true` e a lista de grupos preenchida … Só leitura"
**O que ainda falta decidir:** A decisão de Gestão de acessos.

### gerencial--grupo-usuarios--4
**Pergunta:** O que o grupo padrão muda para a pessoa.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Nada que se veja. O vínculo usuário×grupo tem a marca `padrao` (S/N), e o G3 a grava e a devolve na lista — mas **nenhum código lê essa marca para decidir alguma coisa**: nem a árvore de menus, nem a entrada de sessão, nem o Portal, nem os outros repositórios pesquisados (sigu, sigu_2-0, sigfin, secretaria, extensão, diploma só **gravam**). No Gerencial antigo, todo vínculo criado pela tela nascia "S". Não confundir com a **unidade** padrão, que tem efeito real: é a que abre selecionada e a que o Portal envia aos sistemas.
**Evidência:** SIGU/ModuloGerencial/src/br/ucam/campos/dti/controller/helper/UsuarioHelper.java:412 — `unidGrupo.setPadrao("S");` · G3/.../gerencial/infrastructure/persistence/jpa/UnidadeGrupoUsuarioJpaRepository.java:20-24 (consulta de grupos do usuário sem `padrao`) · busca por leitores de `unidadegrupousuario.padrao` em todos os clones: nenhum
**O que ainda falta decidir:** Confirmar com a TI se algum sistema fora dos clones lidos usa a marca; se não, tirar "padrão" da tela.

### gerencial--grupo-usuarios--5
**Pergunta:** Tirar a pessoa do grupo vale na hora ou só no próximo acesso?
**Veredito:** RESPONDIDA
**Resposta:** Na hora no banco (o vínculo é inativado, não apagado; revincular o reativa). A sessão da pessoa não cai; ela deixa de ver os menus quando a tela pedir a árvore de novo (trocar unidade, recarregar, entrar). Mesma ressalva: as chamadas à API não são barradas.
**Evidência:** G3/docs/adr/0019-listagem-de-vinculos-e-permissao-direta-de-menu.md:32-33 — "`UnidadeGrupoUsuarioRepository` também ganhou `revogar` (soft-delete)" e :84-93 (reativação do mesmo vínculo)
**O que ainda falta decidir:** Nada na regra.

### gerencial--grupo-usuarios--6
**Pergunta:** Quem pode mudar os integrantes de um grupo, e se alguém pode se pôr no grupo que administra.
**Veredito:** RESPONDIDA
**Resposta:** Qualquer pessoa autenticada, e pode se incluir em qualquer grupo. O servidor só confere que o usuário indicado existe.
**Evidência:** G3/.../gerencial/application/grupo/GerenciarPermissoesDeGrupoUseCase.java:88-92 — `usuarioRepository.buscarPorOid(oidUsuario).orElseThrow(...); return unidadeGrupoUsuarioRepository.vincular(oidUnidadeGrupo, oidUsuario, padrao);`
**O que ainda falta decidir:** A regra de quem pode.

### gerencial--auditoria--1
**Pergunta:** [proposta] Registro de auditoria não se edita, não se apaga e não se trata em lote.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe trilha de auditoria: nem tabela, nem endpoint, nem tela. A proposta descreve algo ainda por construir.
**Evidência:** G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:130-135 — "A rastreabilidade de quem alterou o quê (RN-08) volta a ser uma **lacuna em aberto** … reintroduzi-la exige uma decisão nova compatível com o schema real (por exemplo, uma tabela de log própria…)"
**O que ainda falta decidir:** A existência da trilha.

### gerencial--auditoria--2
**Pergunta:** Retenção da trilha.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Sem trilha, não há retenção. Os únicos registros são os logs de aplicação do Portal, cuja guarda depende da infraestrutura e não está descrita nos repositórios.
**Evidência:** mesma do item anterior.
**O que ainda falta decidir:** O prazo (LGPD).

### gerencial--auditoria--3
**Pergunta:** Quais eventos entram na trilha.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Em banco, nenhum. O que existe hoje são linhas de log do Portal, com o identificador do usuário mascarado: conferência de token por sistema (aceita, token desconhecido, usuário divergente), saída, emissão de token sem senha, envio de código de recuperação (com e-mail mascarado) e falha parcial na troca de senha. **Login com sucesso, senha errada, bloqueio, concessão de permissão e cartão não são registrados.** No legado havia dois mecanismos que não foram migrados: um registro automático de toda gravação com o usuário da sessão (`LoggerPersist`) e um serviço de registro de acessos.
**Evidência:** PV2/backend/...login/service/AuthService.java:442-445, 466-472, 488-491 — `authorize_resource validate=OK …`, `logout result=LOCAL_REMOVED` · PV2/backend/...login/service/PasswordResetService.java:430 — `password-reset code issued loginPresent=true email={}` · G3/docs/inventario/ModuloGerencial/inventario-regras-de-negocio.md:110-116 (RN-08)
**O que ainda falta decidir:** A lista de eventos e onde cada um é gravado (parte é do Portal, parte do Gerencial).

### gerencial--auditoria--4
**Pergunta:** Quantas tentativas de senha erradas bloqueiam a conta.
**Veredito:** RESPONDIDA
**Resposta:** Nenhuma. Não há contagem de senha errada em nenhum sistema lido. O "5" da tela não tem origem no login: é o parâmetro de tentativas do código de recuperação do Portal, que nem é aplicado. O único bloqueio automático por erro é o do cartão de segurança (3 erros, no SIGU2).
**Evidência:** PV2/backend/...login/repository/JdbcUsuarioRepository.java:23-31 · SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:39 — `private int tentativasAcessoFuncionalidadeRestrita = 3;`
**O que ainda falta decidir:** Se haverá bloqueio por tentativas (decisão do Portal).

### gerencial--auditoria--5
**Pergunta:** O Gerencial vai registrar quem mudou o quê?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje não registra. Chegou a registrar (autor e data de criação e de última alteração em 12 tabelas), mas foi desligado em 21/09/2026 porque essas colunas não existem nas tabelas reais das bases. O ADR deixa a lacuna declarada e aponta o caminho: uma tabela de log própria. Mesmo quando existia, guardava só "quem criou / quem alterou por último", não o que mudou.
**Evidência:** G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:122-135 — "**não está mais em vigor**: foi removida no commit `b465754`, quando o schema do primeiro tenant real (`PortalEad`) revelou que as colunas … **não existem**"
**O que ainda falta decidir:** A decisão de construir (com o Encarregado de dados) e o desenho da tabela de log.

### gerencial--unidades--3
**Pergunta:** Unidade com usuários, grupos ou alunos vinculados pode ser inativada?
**Veredito:** RESPONDIDA
**Resposta:** Pode, sem conferência nenhuma: a unidade é marcada inativa e os vínculos de usuários e grupos ficam "órfãos" (continuam ativos, mas a unidade some do seletor de campus). É uma perda em relação ao legado, que recusava a exclusão listando as dependências. O G3 confere dependência só em três casos: mantenedora com unidade ativa, aplicação com menu ativo e menu com filhos ativos (erro 409 com os nomes).
**Evidência:** G3/.../gerencial/application/unidade/ExcluirUnidadeUseCase.java:12-17 — "Checagem de dependências ainda não implementada aqui … deixaria esses vínculos 'órfãos'" · G3/docs/adr/0017-agregados-unidade-completo-e-mantenedora.md:37-40
**O que ainda falta decidir:** Se a conferência volta, e para quais dependências (alunos estão em outro módulo, que o Gerencial não lê).

### gerencial--unidades--4
**Pergunta:** [proposta] O registro inativo pode ser reativado pela própria listagem.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não faz, exceto para usuário. Não há endpoint de reativação para unidade, grupo, aplicação, mantenedora, cartão ou menu. Pior: como a conferência de duplicidade só olha registros **ativos**, criar de novo uma unidade com a sigla de uma inativa passa — e nasce um segundo registro, sem os vínculos do primeiro.
**Evidência:** G3/.../gerencial/application/unidade/CriarUnidadeUseCase.java:12-14 — "Só o caso ATIVO é bloqueado — sem fluxo de restauração para Unidade ainda" e :27-32 (`.filter(Unidade::estaAtiva)`)
**O que ainda falta decidir:** Implementar a reativação nos seis cadastros.

### gerencial--unidades--5
**Pergunta:** Quem pode criar, editar e inativar cadastros.
**Veredito:** RESPONDIDA
**Resposta:** Confirmado: qualquer pessoa autenticada. Não há perfil. O código deixa o ponto de extensão marcado ("perfis (RBAC) fica para quando…") e nunca o preencheu.
**Evidência:** G3/.../gerencial/infrastructure/security/JwtEmissorDeSessaoAdapter.java:23-24 · G3/.../platformcore/security/SecurityConfig.java:43-47
**O que ainda falta decidir:** Os perfis.

### gerencial--unidade-form--1
**Pergunta:** Quais campos da unidade são obrigatórios.
**Veredito:** RESPONDIDA
**Resposta:** Todos, menos o complemento. São 16 obrigatórios: CNPJ, sigla, razão social, mantenedora, código, responsável, CPF do responsável, site, e-mail, telefone, CEP, logradouro, número (inteiro), bairro, UF e cidade. É o mesmo do formulário do legado. A obrigatoriedade está na API; no banco as colunas aceitam vazio.
**Evidência:** G3/.../gerencial/presentation/rest/unidade/UnidadeRequest.java:9-26 — `@NotBlank String cnpj, @NotBlank String sigla, … @NotNull Integer numero, String complemento, @NotBlank String bairro, @NotBlank String uf, @NotBlank String cidade` · G3/docs/adr/0017-agregados-unidade-completo-e-mantenedora.md:11-12 — "todos obrigatórios exceto `complemento`"
**O que ainda falta decidir:** A tela marca só três; precisa marcar os 16 (ou o time decide afrouxar a API).

### gerencial--unidade-form--2
**Pergunta:** A sigla pode repetir entre unidades de mantenedoras diferentes?
**Veredito:** RESPONDIDA
**Resposta:** Não pode: a sigla é única entre as unidades **ativas** de toda a base, sem olhar a mantenedora ("Já existe uma unidade ativa com a sigla '…'."). Pode coincidir com a de uma unidade inativa, e bases diferentes são independentes. A regra não veio do legado (lá não havia índice único): foi pedida pelo responsável do projeto em 08/09/2026. Não há trava no banco.
**Evidência:** G3/.../gerencial/application/unidade/CriarUnidadeUseCase.java:27-32 · G3/docs/adr/0023-desambiguacao-de-menu-por-aplicacao-e-checagem-de-duplicidade.md:47-53
**O que ainda falta decidir:** Nada, se a regra do responsável vale.

### gerencial--unidade-form--4
**Pergunta:** [proposta] O CEP preenche logradouro, bairro, cidade e UF.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O sistema não trata: não há consulta de CEP no servidor nem na tela do G3; os campos de endereço são digitados e todos obrigatórios.
**Evidência:** busca por "viacep" em G3/frontend/src e G3/backend: nenhuma ocorrência · G3/.../gerencial/presentation/rest/unidade/UnidadeRequest.java:20-26
**O que ainda falta decidir:** Se entra, e qual serviço de CEP (dependência externa nova).

### gerencial--unidade-form--5
**Pergunta:** CNPJ e CPF do responsável são validados pelo dígito, e CNPJ repetido é recusado?
**Veredito:** RESPONDIDA
**Resposta:** Não e não, para a unidade. O servidor só exige que os campos estejam preenchidos; não confere dígito verificador, tamanho nem formato. E não recusa CNPJ repetido entre unidades (a única duplicidade conferida na unidade é a sigla) — o que faz sentido no dado real, em que muitas unidades têm a mesma razão social da universidade.
**Evidência:** G3/.../gerencial/presentation/rest/unidade/UnidadeRequest.java:10,16 — `@NotBlank String cnpj` / `@NotBlank String cpfResponsavel` · busca por validação de CPF/CNPJ no domínio e nos casos de uso: nenhuma
**O que ainda falta decidir:** Se a validação de dígito entra (no servidor) e se CNPJ de unidade deve ser único.

### gerencial--grupos--4
**Pergunta:** Grupo com integrantes pode ser inativado?
**Veredito:** RESPONDIDA
**Resposta:** Pode, sem conferência. Mas o efeito não é o que a pergunta supõe: **as pessoas não perdem os menus**. A árvore de menus olha a situação do vínculo grupo×unidade, do vínculo com o usuário, da concessão e do menu — não olha a situação do grupo. Um grupo inativo some das listas e continua concedendo acesso, sem que ninguém consiga mais editá-lo pelas telas.
**Evidência:** G3/.../gerencial/application/grupo/ExcluirGrupoUseCase.java:12-18, 29-35 · G3/.../gerencial/infrastructure/persistence/jpa/MenuVisivelJpaRepository.java:37-44 — `where ugm.oidMenu = me.oid and ugm.oidUnidadeGrupo in :oidsUnidadeGrupo and me.status = 'A' and ugm.status = 'A'` (sem a situação do grupo)
**O que ainda falta decidir:** O que inativar um grupo deve fazer: bloquear se houver integrantes, ou encerrar os acessos junto.

### gerencial--grupos--5
**Pergunta:** Quem pode criar grupo e mudar o que ele concede.
**Veredito:** RESPONDIDA
**Resposta:** Qualquer pessoa autenticada (ver unidades--5).
**Evidência:** G3/.../platformcore/security/SecurityConfig.java:47
**O que ainda falta decidir:** Os perfis.

### gerencial--grupo-form--2
**Pergunta:** Quais são os tipos de usuário e o que cada um muda.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Tipo de usuário é uma tabela de referência pequena (`tipousuario`: descrição, tipo, situação), apontada por grupos e por aplicações. Os valores não estão em nenhum código, script ou documento lido — só no banco. No G3 o campo é obrigatório para grupo e aplicação, mas é preenchido digitando o identificador cru ("Combobox real ainda não disponível … informe o oid") e o servidor não confere se ele existe. **Nenhuma regra usa o tipo**: ele não limita os menus que o grupo pode receber, nem quem pode entrar no grupo. A própria aplicação "Gerencial 3.0" foi criada com tipo vazio.
**Evidência:** SIGU/DomainEJB/ejbModule/br/ucam/campos/dti/manager/model/Tipousuario.java:11-25 · G3/frontend/src/app/features/gerencial/grupos/grupo-form.component.html:29-31 · G3/.../gerencial/domain/grupo/Grupo.java:13-16 — "`oidTipoUsuario` é referência solta (sem validação)"
**O que ainda falta decidir:** Obter a lista real do banco; decidir se o tipo passa a restringir alguma coisa ou sai do formulário.

### gerencial--grupo-form--3
**Pergunta:** A sigla do grupo pode repetir entre unidades?
**Veredito:** RESPONDIDA
**Resposta:** Não, e a pergunta parte de um modelo que não é o do sistema: o grupo **não pertence a uma unidade**. Ele é da base de dados inteira e "atua" em unidades por um vínculo à parte; o mesmo grupo pode atuar em várias, com integrantes e menus diferentes em cada uma. A sigla é única entre os grupos ativos da base.
**Evidência:** G3/.../gerencial/application/grupo/CriarGrupoUseCase.java:30-33 · G3/docs/adr/0015-agregado-grupo-e-permissao-via-grupo.md:18-21 — "`Unidadegrupo`: 'este grupo atua nesta unidade' — pivô do qual saem os usuários membros … e os menus liberados"
**O que ainda falta decidir:** A tela "Novo grupo" não deve pedir unidade como dono; a unidade entra no vínculo.

### gerencial--aplicacoes--5
**Pergunta:** Onde se cadastra o endereço da aplicação e a marca "aparece no painel".
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** No banco eles existem: o endereço fica na tabela `aplicacaoendereco` (coluna `dns`, com situação) e a marca é a coluna `aplicacao.exibicaodashboard`; há ainda `aplicacao.icone`. O Portal lê os três. No G3 **não há onde cadastrar**: a aplicação tem só sigla, nome, tipo de usuário e situação; os vínculos aplicação×usuário e aplicação×mantenedora ficaram fora. Hoje, publicar uma aplicação na grade do Portal é feito direto no banco.
**Evidência:** PV2/backend/...login/repository/JdbcDashboardCatalogRepository.java:62-70 — `SELECT a.dns FROM aplicacaoendereco a INNER JOIN aplicacao b … WHERE … a.status = 'A' AND b.status = 'A'` · G3/.../gerencial/presentation/rest/aplicacao/AplicacaoResponse.java:5 — `record AplicacaoResponse(String oid, String sigla, String nome, String status, String oidTipoUsuario)` · G3/docs/adr/0016-agregado-aplicacao.md:52-53
**O que ainda falta decidir:** Se o Gerencial passa a manter endereço, marca de painel, ícone e a liberação por usuário. Sem isso, a tela "Aplicações" não controla o que aparece no Portal.

### gerencial--aplicacao-form--2
**Pergunta:** A sigla da aplicação é o identificador no login único?
**Veredito:** RESPONDIDA
**Resposta:** Não. O login único identifica a aplicação pelo **identificador interno** (`oid`): o `client_id` é `{oid da aplicação}@{base}`; vários desses identificadores estão fixos no código do Portal (quais aplicações recebem unidade, quais são especiais). A sigla não entra nisso. Mas mudar a sigla quebra outra coisa: o Gerencial novo se localiza pela sigla (configuração `APLICACAO_SIGLA`, hoje `GERENCIAL-3.0`); se a sigla cadastrada deixar de bater, a barra lateral falha com erro para todos os usuários daquela base.
**Evidência:** PV2/CONTRATOS_LEGADO.md:164 — `Formato | {oidAplicacao}@{realm}` · G3/.../gerencial/application/menu/CarregarMenusDaUnidadeUseCase.java:105-110 — `"Aplicação local '" + sigla + "' (variável de ambiente APLICACAO_SIGLA) não encontrada ou inativa neste tenant"`
**O que ainda falta decidir:** Proteger a sigla da própria aplicação contra edição (e a exclusão dela).

### gerencial--mantenedoras--4
**Pergunta:** O que se registra em "credenciamento".
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Um texto livre, opcional, sem estrutura (sem ato, data ou validade separados). No legado o campo existia na tabela, mas **não tinha lugar no formulário** — ou seja, pode nunca ter sido preenchido. O significado pretendido não está documentado.
**Evidência:** G3/docs/adr/0017-agregados-unidade-completo-e-mantenedora.md:24-26 — "`credenciamento` existe na entidade mas não tem campo no formulário" · G3/.../gerencial/presentation/rest/mantenedora/MantenedoraRequest.java:14 — `String credenciamento`
**O que ainda falta decidir:** O conteúdo esperado (Secretaria acadêmica) e se vale olhar o que há hoje na coluna.

### gerencial--mantenedora-form--1
**Pergunta:** Quais campos da mantenedora são obrigatórios.
**Veredito:** RESPONDIDA
**Resposta:** Sete: CNPJ, sigla, razão social, responsável, CPF do responsável, página na internet (homepage) e código. Credenciamento é opcional.
**Evidência:** G3/.../gerencial/presentation/rest/mantenedora/MantenedoraRequest.java:6-14 — `@NotBlank String cnpj, @NotBlank String sigla, @NotBlank String razaosocial, @NotBlank String responsavel, @NotBlank String cpfResponsavel, @NotBlank String homepage, @NotBlank String codigo, String credenciamento`
**O que ainda falta decidir:** A tela marca só dois; precisa marcar os sete.

### gerencial--mantenedora-form--2
**Pergunta:** CNPJ e CPF do responsável são validados pelo dígito verificador?
**Veredito:** RESPONDIDA
**Resposta:** Não. O servidor só exige preenchimento. O que ele confere na mantenedora é a duplicidade: CNPJ igual ao de outra mantenedora ativa é recusado ("Já existe uma mantenedora ativa com o CNPJ '…'.") — por comparação exata do texto, então o mesmo CNPJ com e sem pontuação passa como diferente.
**Evidência:** G3/.../gerencial/application/mantenedora/CriarMantenedoraUseCase.java:26-31
**O que ainda falta decidir:** Validação de dígito e normalização (só dígitos) no servidor.

### gerencial--cartoes-seguranca--4
**Pergunta:** [proposta] O número do cartão aparece mascarado, só com os quatro últimos dígitos.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário: a lista devolve o número inteiro. E a proposta subestima o dado: esse número não é um identificador do cartão, é a **semente** que gera todos os valores do cartão. Quem a conhece reproduz as 50 posições e passa pela conferência como se tivesse o cartão na mão. Por isso o campo deveria ser tratado como segredo (não exibir depois de gravado), não apenas mascarado — e a tela de exclusão do legado ainda o mostra na pergunta de confirmação.
**Evidência:** G3/.../gerencial/presentation/rest/cartaoseguranca/CartaoSegurancaListItemResponse.java:10-12 — `String oid, String oidPessoa, String nomePessoa, Long semente, …` · SIGU2/Domain-EJB/ejbModule/br/ucam/campos/domain/services/UtilService.java:811-819 — `Random secureNumber = new Random(sementeCartaoseguranca); for(int pos=0;pos<posicaoCartaoSeguranca;pos++) secureNumber.nextInt(limit); if(numeroCartaoSeguranca == secureNumber.nextInt(limit)) return true;`
**O que ainda falta decidir:** Tratar a semente como segredo; quem pode vê-la; e se continua sendo digitada pelo operador.

### gerencial--cartoes-seguranca--5
**Pergunta:** Para que o cartão é usado e em que momento ele é pedido.
**Veredito:** RESPONDIDA
**Resposta:** É um segundo fator para funções sensíveis do SIGU: hoje protege as telas de **Provas** (cadastro de prova e impressão de prova). Ao abrir a tela, o sistema sorteia uma posição de 1 a 50 e pede o valor impresso naquela posição do cartão da pessoa ("Acesso monitorado — veja em seu cartão de segurança o valor correspondente na posição solicitada"); o conteúdo só aparece se o valor conferir. São 3 tentativas; a cada erro a posição muda; no terceiro erro a conta é **bloqueada** e a pessoa é deslogada ("seu usuário foi bloqueado. Entre em contato com o centro de informática"). Quem não tem cartão vigente vê: "para acessar esta funcionalidade é necessário possuir um cartão de segurança, por favor solicite um ao Centro de Informática". O cartão é da pessoa, não do usuário. Não é pedido no login.
**Evidência:** SIGU2/SIGU-WEB/WebContent/paginas/provas/prova.xhtml:22-24 — `<ui:include src="verificacaocartaoseguranca.xhtml" />` … `rendered="#{cartaoSegurancaHelper.acessoPermitido}"` (igual em impressao.xhtml:29-31) · SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:37,39,146-168 — `nextInt(49)+1` … `tentativasAcessoFuncionalidadeRestrita = 3` … `bloqueiaUsuario();`
**O que ainda falta decidir:** Se os sistemas novos continuarão pedindo o cartão (nenhum dos novos lidos pede) e para quais funções.

### gerencial--cartoes-seguranca--6
**Pergunta:** Cartão vencido deixa de valer sozinho?
**Veredito:** RESPONDIDA
**Resposta:** Sim. Na hora do uso, o SIGU só aceita cartão ativo cuja vigência cobre o dia (início ≤ hoje ≤ fim). Vencido, ele é ignorado sem ninguém inativar; a pessoa passa a ver a mensagem de quem não tem cartão. A situação do cadastro continua "ativo" — a lista do Gerencial mostrará "ativo" para um cartão que não vale mais, a menos que a tela calcule pela data.
**Evidência:** SIGU2/Domain-EJB/ejbModule/br/ucam/campos/domain/persistence/repositories/academico/RepositorioCartao.java:23-28 — `WHERE a.pessoa.oid = '#{1}' AND datainicio <= '#{2}' AND datafim >= '#{2}' AND a.status = 'A'`
**O que ainda falta decidir:** A tela precisa de um estado "vencido" calculado, distinto de "inativo".

### gerencial--cartao-form--2
**Pergunta:** A pessoa pode ter dois cartões valendo ao mesmo tempo?
**Veredito:** RESPONDIDA
**Resposta:** O cadastro deixa (a única trava é não repetir a mesma semente em cartão ativo), mas o uso não: com dois cartões vigentes o SIGU não aceita nenhum e manda a pessoa ao Centro de Informática. Na prática a regra é **um cartão vigente por pessoa**, e o cadastro deveria impedir o segundo. Outras regras do cadastro: pessoa, semente, início e fim são obrigatórios; fim não pode ser anterior ao início.
**Evidência:** SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:118-132 · G3/.../gerencial/domain/cartaoseguranca/CartaoSeguranca.java:62-78 — "Data de fim não pode ser anterior à data de início."
**O que ainda falta decidir:** Colocar no servidor a trava de vigências sobrepostas.

### gerencial--cartao-form--3
**Pergunta:** Quem pode emitir cartão e como ele é entregue.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** No sistema, qualquer pessoa autenticada no Gerencial cadastra cartão. Pelas mensagens do SIGU, quem emite na prática é o **Centro de Informática**. A entrega não está no código: nenhum repositório lido gera a semente (o operador a digita) nem imprime o cartão com as 50 posições; essa etapa acontece fora dos sistemas.
**Evidência:** SIGU2/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CartaoSegurancaHelper.java:121 — "por favor solicite um ao Centro de Informática" · SIGU/ModuloGerencial/WebContent/paginas/cartaoseguranca/cadastro.xhtml:28 — `<p:inputText value="#{cartaoSegurancaHelper.cartaoseguranca.semente}" required="true"`
**O que ainda falta decidir:** Quem emite formalmente, como o cartão é produzido e entregue, e se o sistema passa a gerar a semente.

---

## Descobertas fora da lista

1. **Senha criada ou trocada pelo Gerencial novo não serve para entrar no Portal.** O G3 grava a senha em bcrypt na coluna `usuario.senha`; o Portal confere por igualdade com MD5 em Base64 na mesma coluna. O ADR do G3 registra que o algoritmo do legado "não foi identificado" e trata isso como não bloqueante. Efeito: criar usuário ou "redefinir senha" pelo G3 deixa a pessoa sem acesso até ela refazer a senha pelo Portal. — G3/.../gerencial/infrastructure/security/BCryptPasswordHasher.java (comentário de classe: "esta classe não tenta ler/validar hashes legados"); G3/.../gerencial/application/usuario/CriarUsuarioUseCase.java:47; PV2/backend/...login/security/PasswordService.java:26-31; G3/docs/runbooks/ModuloGerencial-rollback.md ("lê e escreve nas **mesmas tabelas** do legado").

2. **O servidor não tem autorização: quem entra faz tudo.** Menu só esconde atalho. — G3/.../platformcore/security/SecurityConfig.java:43-47; JwtEmissorDeSessaoAdapter.java:23-24.

3. **Base de dados (tenant) e unidade são coisas diferentes, e a faixa tem os dois seletores.** A base (CAMPOS, EAD, RIO) é escolhida num alternador "Base de dados", com confirmação, e reinicia tudo; a unidade ("Campus Universitário") é escolhida dentro da base e só recarrega os menus. Trocar de base exige que o mesmo usuário exista ativo na base de destino. — G3/docs/adr/0033-troca-de-tenant-dentro-do-modulo.md:21-46; G3/docs/adr/0013-entrada-de-sessao-usuario-tenant-unidade.md:26-45.

4. **Conceder ou revogar um menu mexe em pais e filhos automaticamente** (regra de criticidade "máxima" do inventário). A tela mostra só o resultado, sem dizer o que veio por propagação. — G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:54-57, 117-120.

5. **O Gerencial novo não tem login nem recuperação de senha, por decisão.** Ele recebe a identidade de fora, confere na própria base se o usuário existe, está ativo e não bloqueado, e emite sessão de 30 minutos sem renovação. "Sair" leva a uma tela de sessão encerrada, sem volta para login. — G3/docs/adr/0002-autenticacao-jwt-local.md:29-40; G3/docs/adr/0013-entrada-de-sessao-usuario-tenant-unidade.md:112-115.

6. **A integração com o Portal está em aberto.** O G3 espera um JWT assinado pelo "dashboard" no fragmento do endereço; o Portal novo entrega token opaco no caminho e não emite JWT. — G3/docs/adr/0021-fechamento-formal-do-modulo.md:86-88; PV2/docs/sdd/decisions.md:7-12.

7. **Faltam no G3 três vínculos que o Gerencial antigo tinha no cadastro do usuário:** usuário×unidade (com a unidade padrão), usuário×aplicação (o que libera o cartão na grade do Portal) e aplicação×mantenedora. Sem eles, um usuário criado no G3 não tem unidade nem aparece com sistemas no Portal. — G3/docs/adr/0011-primeiro-agregado-usuario.md:26-28; G3/docs/adr/0016-agregado-aplicacao.md:52-53; G3/.../gerencial/domain/unidade/UnidadeUsuarioRepository.java:13-24.

8. **Duplicidade recusada em todo cadastro, com chave diferente em cada um:** usuário por login; grupo, aplicação e unidade por sigla; mantenedora por CNPJ; cartão por semente; menu por nome dentro da aplicação. Só vale contra registros ativos, e só usuário oferece restaurar o inativo. — G3/docs/adr/0023-desambiguacao-de-menu-por-aplicacao-e-checagem-de-duplicidade.md:43-58.

9. **Menus pertencem a uma aplicação, e cada sistema só mostra os seus.** Para conceder menu é preciso escolher a aplicação primeiro (nomes de menu se repetem entre aplicações). A aplicação e o pai de um menu só são definidos na criação. — G3/docs/adr/0029-filtro-de-menu-por-aplicacao-via-variavel-de-ambiente.md:25-41; G3/docs/adr/0016-agregado-aplicacao.md:34-37.

10. **As telas devem mostrar nome, não sigla nem CPF** — determinação do responsável: "telas sempre apresentar informações concretas como nome, descrição, nada de sigla". Na unidade a regra inverte na ordenação: a razão social é igual para quase todas ("UNIVERSIDADE CANDIDO MENDES"), então quem distingue é a sigla. — G3/.../gerencial/application/grupo/GerenciarPermissoesDeGrupoUseCase.java:125-127, 141-143.

11. **Listas têm no máximo 100 itens por página** (padrão 20); pedir mais dá erro 400. A busca de usuário vai ao servidor a cada termo. — G3/.../gerencial/domain/shared/PaginaSolicitada.java:15-16; G3/docs/adr/0030-nome-de-exibicao-nas-telas-de-selecao-de-usuario.md:115.

12. **A lista de manutenção de usuários traz ativos e inativos juntos; as listas de seleção trazem só ativos.** — G3/.../gerencial/presentation/rest/usuario/UsuarioController.java:62-65; G3/docs/adr/0030-nome-de-exibicao-nas-telas-de-selecao-de-usuario.md:84.

13. **Usuário tem três campos que a tela de referência não mostra:** foto (existe no banco, sem envio na tela), palavra-chave e login antigo. — G3/.../gerencial/domain/usuario/Usuario.java (comentário de classe: `foto`, `motivoBloqueio`, `loginAntigo`); G3/docs/adr/0011-primeiro-agregado-usuario.md:44-46.

14. **Menu não pode ser pai de si mesmo nem formar ciclo; menu com filhos ativos não pode ser excluído.** — G3/docs/adr/0020-validacao-de-paridade-e-auditoria-jpa.md:61-71; G3/docs/adr/0014-agregado-menu-e-resolucao-de-permissao.md:53-55.

15. **O esquema do banco real não é alterado por migração automática.** As migrações do G3 rodam só em banco local; no banco de produção "o esquema é criado pelo responsável, com SQL revisado". Qualquer campo novo pedido pelas telas (validade de acesso direto, último acesso, tabela de auditoria) depende desse caminho, em bases PostgreSQL 9.4 compartilhadas com o legado. — G3/backend/gerencial/src/main/resources/application.yml:1-6.
