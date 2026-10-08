# Portal Universitário — respostas pelo código (24 perguntas)

Pesquisa feita em 06/10/2026 nos clones locais de `C:\Users\Leonardo\Documents\UCAM-repos\`.
Abreviações de caminho usadas nas evidências:

- **PV2** = `portal-login-v2` (Angular + Spring, o portal novo). `PV2/backend/...login/` = `PV2/backend/src/main/java/br/ucam/portal/login/`.
- **PL** = `portal_login` (o portal antigo, WildFly/JSF).
- **G3** = `Gerencial-v3.0-2026`.
- **SIGU** = `sigu` e **SIGU2** = `sigu_2-0` (legado JSF).

Contagem: 16 RESPONDIDA · 5 RESPONDIDA EM PARTE · 3 NÃO ESTÁ NO CÓDIGO.

Segredos encontrados no caminho não foram copiados; onde existem, está dito só o lugar.

---

### portal--grade-modulos--2
**Pergunta:** [proposta] Favoritos são por pessoa e valem em qualquer dispositivo.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário. Favoritos (e "acessos frequentes") ficam só no navegador, em `localStorage`, numa chave por usuário (`portal:favorites:{oidUsuario}`). O servidor não tem tabela nem endpoint de favoritos. Em outro computador ou navegador a pessoa começa sem nenhum. A própria tela avisa: "favoritos e usos neste navegador". O favorito guarda origem + base + aplicação, e só aparece se a aplicação continuar liberada no catálogo.
**Evidência:** PV2/frontend/src/app/core/dashboard-prefs.ts:6 — `const FAV_PREFIX = 'portal:favorites:';` e :117 `localStorage.setItem(favStorageKey(usuarioOid), JSON.stringify(favorites));` · PV2/frontend/src/app/pages/dashboard/dashboard.html:373 — `<span class="section-hint">favoritos e usos neste navegador</span>`
**O que ainda falta decidir:** Se favorito passa a ser guardado no servidor (exige tabela nova em cada base ou numa base própria do Portal, que hoje não existe: o Portal só lê as bases e só escreve a senha).

### portal--grade-modulos--3
**Pergunta:** Até quando um sistema legado convive com o novo, e quem decide tirá-lo da grade.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não há prazo nem regra de convivência no código. O que existe é o mecanismo: a grade é montada por dados do banco, e um sistema sai dela quando deixa de cumprir qualquer uma de quatro condições (aplicação ativa, marcada para aparecer no painel, liberada ao usuário, com endereço ativo). O Gerencial novo foi criado como **outra** aplicação (sigla `GERENCIAL-3.0`), ao lado da antiga; nada desativa a antiga automaticamente. Tirar um legado da grade hoje é uma alteração direta no banco de cada base.
**Evidência:** PV2/backend/...login/repository/JdbcDashboardCatalogRepository.java:24-32 — `WHERE a.oidusuario = :usuarioOid AND b.exibicaodashboard = TRUE AND a.status = 'A' AND b.status = 'A'` · G3/scripts/sql/seed-aplicacao-gerencial-3.0.sql:32-34 — `INSERT INTO aplicacao (...) SELECT '…', 'GERENCIAL-3.0', 'Gerencial 3.0', 'A', NULL`
**O que ainda falta decidir:** O prazo e o responsável. E quem executa a retirada, já que nenhuma tela (nem do Gerencial novo) altera `exibicaodashboard`, `aplicacaoendereco` ou `aplicacaousuario`.

### portal--grade-modulos--4
**Pergunta:** O que decide se um sistema aparece para a pessoa.
**Veredito:** RESPONDIDA
**Resposta:** Um cadastro próprio, por usuário e por base de dados: a tabela `aplicacaousuario` (usuário × aplicação). Não é o perfil do SIGU nem o grupo do Gerencial. O cartão só aparece quando as quatro condições valem juntas: (1) existe vínculo ativo em `aplicacaousuario`; (2) a aplicação está ativa; (3) a aplicação está marcada `exibicaodashboard`; (4) existe endereço ativo em `aplicacaoendereco` (sem endereço o cartão nem é devolvido — ADR-028). O servidor confere de novo no clique (não confia na lista que mandou). Quatro aplicações especiais (Suporte, Suporte EAD, BI, Frequência Online) seguem a mesma liberação por usuário, com abertura por formulário em vez de token. A consulta é repetida em cada base onde o CPF tem conta (até 8 contextos).
**Evidência:** PV2/backend/...login/repository/JdbcDashboardCatalogRepository.java:24-32 (consulta acima) · PV2/backend/...login/dashboard/DashboardService.java:364-368 — `if (!oauthListed && !specialOk) { throw new ForbiddenAppException("Aplicação não liberada para o usuário"); }` · PV2/docs/sdd/decisions.md:271-276 (ADR-028 — "Dashboard só devolve aplicação acionável")
**O que ainda falta decidir:** Quem mantém `aplicacaousuario`. O Gerencial antigo tinha a aba "Aplicações" no cadastro do usuário; o Gerencial novo não implementou esse vínculo (G3/docs/adr/0016-agregado-aplicacao.md:52 — "`Aplicacaomantenedora`/`Aplicacaousuario` (vínculos do legado) não implementados").

### portal--grade-modulos--9
**Pergunta:** Quais são as seções oficiais da grade.
**Veredito:** RESPONDIDA
**Resposta:** As seções não são uma lista editorial: cada seção é um par (origem, base). O servidor conhece oito contextos — presencial: **Campos**, **Rio**, **ITECAM**, **ICAM**; EAD: **EAD**, **Rio**, **ITECAM**, **ICAM** — e devolve só os que têm ao menos uma aplicação para a pessoa (seção vazia não aparece). Os rótulos possíveis são cinco: Campos, Rio, ITECAM, ICAM e EAD. "Presencial" não é seção: é o rótulo de origem (`origemLabel` = "Presencial" ou "EAD") que acompanha cada seção, para distinguir, por exemplo, o Rio presencial do Rio da origem EAD. No portal antigo a base `ucam` chamava-se "campos" nos dois servidores; no novo, `ucam` da origem EAD chama-se "EAD".
**Evidência:** PV2/backend/...login/catalog/ProductCatalog.java:15-22 — `CAMPOS("campos","Campos",PRESENCIAL,"ucam"), RIO(...,"rio"), ITECAM(...), ICAM(...), EAD("ead","EAD",Origem.EAD,"ucam"), EAD_RIO(...), EAD_ITECAM(...), EAD_ICAM(...)` · PV2/backend/...login/dashboard/DashboardService.java:125-126 — `.filter(g -> !g.apps.isEmpty())` e :440-445 — `return "Presencial";` · PV2/docs/sdd/dashboard-contexts.md:43-56
**O que ainda falta decidir:** A tela de referência precisa trocar "Presencial" (seção) por Campos, e prever ICAM. Falta decidir como mostrar duas seções com o mesmo nome (Rio presencial × Rio EAD).

### portal--login--2
**Pergunta:** [proposta] Entrada também por conta institucional Microsoft ou Google.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O sistema não trata. O único jeito de entrar é CPF + senha (`grant_type=password`); qualquer outro tipo é recusado com "Grant Type nao implementado". Não há dependência, configuração nem ADR de login federado. O requisito escrito é o oposto: "Login SPA: apenas CPF + senha (+ esqueci senha)". A única menção à Microsoft é o servidor de e-mail (Office 365) usado para mandar o código de recuperação.
**Evidência:** PV2/backend/...login/service/AuthService.java:84-86 — `if (grantType == null || !GRANT_TYPE_PASSWORD.equals(grantType)) { throw new OAuthAuthException(ERROR_INVALID_GRANT, "Grant Type nao implementado"); }` · PV2/docs/sdd/requirements.md:94 — `REQ-UI-009 | Login SPA: apenas CPF + senha (+ esqueci senha).`
**O que ainda falta decidir:** Tudo: se entra, com qual provedor, e como conviver com o contrato OAuth congelado (ADR-004) que dezenas de aplicações consomem.

### portal--login--3
**Pergunta:** Como se liga a conta Microsoft ou Google ao CPF.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe vínculo. Indício útil para a decisão: o cadastro tem **um** campo de e-mail por pessoa (`academico.pessoa.email`), sem marca de "institucional" ou "pessoal", e a mesma pessoa pode ter e-mails diferentes em bases diferentes (o fluxo de recuperação já trata isso oferecendo a escolha). Ligar pelo e-mail cadastrado herdaria essa ambiguidade.
**Evidência:** PV2/backend/...login/repository/JdbcUsuarioRepository.java:46-53 — `SELECT u.oid, u.login, u.oidpessoa, p.nome, p.email FROM usuario u LEFT JOIN academico.pessoa p ON p.oid = u.oidpessoa` · PV2/backend/...login/service/PasswordResetService.java:345-354 (agrupa as contas por e-mail distinto)
**O que ainda falta decidir:** A regra de vínculo inteira.

### portal--login--4
**Pergunta:** Quantas tentativas erradas bloqueiam o acesso e por quanto tempo.
**Veredito:** RESPONDIDA
**Resposta:** Nenhuma. Não existe contagem de senha errada, nem bloqueio temporário, nem no portal novo nem no antigo: cada tentativa é só uma consulta "login + senha + ativo + não bloqueado", e errar não grava nada. O "5" que o Gerencial supõe é a configuração de tentativas do **código de recuperação** (e nem essa é aplicada — ver portal--recuperar-senha-codigo--4). O bloqueio que existe é o campo `usuario.bloqueado`, ligado à mão pelo Gerencial, ou automaticamente pelo SIGU depois de 3 erros no cartão de segurança. Conta bloqueada recebe a mesma mensagem de senha errada. A ausência de limite está registrada como risco (SEC-013 trata só do reenvio; não há rate limit).
**Evidência:** PV2/backend/...login/repository/JdbcUsuarioRepository.java:23-31 — `WHERE status = 'A' AND login = :login AND senha = :senha AND bloqueado = FALSE` · PL/portalucam-ejb/ejbModule/br/ucam/campos/portalucam/service/LoginService.java:26-35 — `usuario.setSenha(this.utilService.encriptaSenha(usuario.getSenha())); return this.usuarioRepository.withRealm(realm).findUniqueByExample(usuario);` · busca por "tentativ|attempt|lockout" nos dois portais: só o código de recuperação aparece
**O que ainda falta decidir:** Se haverá limite, de quantas tentativas, por quanto tempo, e onde contar (o Portal hoje não escreve nas bases além da senha, e a mesma pessoa tem contas em várias bases).

### portal--login--5
**Pergunta:** O que "Primeiro acesso" pede para provar quem é a pessoa.
**Veredito:** RESPONDIDA
**Resposta:** O botão "Primeiro acesso" só abre o manual em PDF. Quem cria a senha é o botão ao lado, "Cadastrar senha", que leva à mesma rota de "Esqueci minha senha". A prova é: informar o CPF e digitar o código de 6 dígitos enviado ao e-mail que já está no cadastro da pessoa. Nada mais (sem data de nascimento, matrícula ou pergunta). A conta já precisa existir e estar ativa; no Gerencial antigo ela nascia com senha vazia, por isso ninguém entra antes de passar por esse fluxo. Sem e-mail válido no cadastro a pessoa é mandada à Central de ajuda.
**Evidência:** PV2/frontend/src/app/pages/login/login.html:204 — `href="assets/docs/manual-primeiro-acesso.pdf"` e :227-237 — `<a routerLink="/recuperar-senha" class="btn-ghost"> … Cadastrar senha` · PV2/docs/manual-primeiro-acesso.html — "É o momento de criar sua senha no Portal Universitário. Depois, use CPF e senha para entrar." · SIGU/ModuloGerencial/src/br/ucam/campos/dti/controller/helper/UsuarioHelper.java:308 — `this.obj.setSenha("");`
**O que ainda falta decidir:** O manual publicado (PV2/frontend/public/assets/docs/manual-primeiro-acesso.pdf, gerado de PV2/docs/manual-primeiro-acesso.html) diz que o código chega por **SMS** no celular; o servidor manda por **e-mail** (o envio de SMS é uma classe vazia). Um dos dois precisa ser corrigido. O manual também cita os endereços `portal-v2.ucam-campos.br` e `portal-v2.candidomendes.edu.br`.

### portal--login--6
**Pergunta:** [proposta] O erro de autenticação não diz se o CPF existe ou se a senha está errada.
**Veredito:** RESPONDIDA
**Resposta:** O sistema já faz o que a proposta diz, na entrada: CPF inexistente, senha errada, conta inativa e conta bloqueada devolvem o mesmo erro `invalid_grant` / "usuario ou senha invalidos", sem dizer em qual base falhou. Há uma exceção deliberada: se alguma base estiver fora do ar e nenhuma outra autenticar, a resposta é 503 "Nao foi possivel concluir a autenticacao no momento", para não culpar a senha.
**Evidência:** PV2/backend/...login/service/AuthService.java:136 — `throw new OAuthAuthException(ERROR_INVALID_GRANT, "usuario ou senha invalidos");` e :127-134 (503) · PV2/docs/sdd/security-risks.md:23 — `SEC-017 … Mensagem uniforme invalid_grant; sem revelar qual base`
**O que ainda falta decidir:** A proteção é anulada pela recuperação de senha, que diz se o CPF existe (ver portal--recuperar-senha--4).

### portal--login--10
**Pergunta:** "Lembrar de mim" guarda o CPF no navegador — vale em computador compartilhado?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O que o sistema faz: com a caixa marcada, guarda só os dígitos do CPF no `localStorage` do navegador (chave `portal.login.rememberCpf`), sem prazo de validade; na próxima visita preenche o CPF e já deixa a caixa marcada. Não guarda senha nem token. Entrar com a caixa desmarcada apaga o CPF guardado. Não há nenhuma distinção para computador compartilhado, nem aviso, nem configuração para desligar a função por rede ou por máquina.
**Evidência:** PV2/frontend/src/app/core/remember-cpf.ts:1,23 — `const STORAGE_KEY = 'portal.login.rememberCpf';` … `localStorage.setItem(STORAGE_KEY, clean);` · PV2/frontend/src/app/pages/login/login.ts:98-103 — `if (this.form.controls.rememberMe.value) { saveRememberedCpf(usernameDigits); } else { clearRememberedCpf(); }`
**O que ainda falta decidir:** A política (LGPD) para laboratório e secretaria: manter, avisar, ou desligar. Nada no código responde.

### portal--recuperar-senha--4
**Pergunta:** [proposta] A tela não diz se o CPF tem cadastro.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário, e vai além do que a pergunta supõe. CPF sem conta devolve erro 400 "Usuário inválido!". CPF com conta devolve, **sem nenhuma autenticação**, o nome completo da pessoa, o celular e — quando só há um e-mail no cadastro — o **e-mail completo, sem máscara** (a máscara só é aplicada quando há mais de um e-mail para escolher). Ou seja: hoje a consulta serve para descobrir se um CPF é da universidade e de quem ele é.
**Evidência:** PV2/backend/...login/service/PasswordResetService.java:126-128 — `if (matches.isEmpty()) { throw new PasswordResetException(MSG_USUARIO_INVALIDO); }` e :153-154 — `String previewEmail = requiresChoice ? "" : options.get(0).emailOriginal().trim();` · PV2/backend/...login/dto/PasswordLookupResponse.java:8 — "1 e-mail único: `email` completo para o dialog de confirmação"
**O que ainda falta decidir:** Adotar a proposta exige mudar o servidor (resposta única, e-mail sempre mascarado, nome e celular fora da resposta). Hoje a rota `/api/portal/**` é pública e sem limite de consultas.

### portal--recuperar-senha--5
**Pergunta:** Primeiro acesso e recuperação são o mesmo fluxo?
**Veredito:** RESPONDIDA
**Resposta:** São o mesmo fluxo, com os mesmos quatro endpoints e a mesma prova (CPF + código por e-mail). O servidor não distingue quem nunca teve senha de quem esqueceu. Ao final, a senha nova é gravada em **todas** as contas do CPF, em todas as bases (ADR-024), mesmo que o código tenha ido para o e-mail de uma só.
**Evidência:** PV2/frontend/src/app/pages/login/login.html:156 (`routerLink="/recuperar-senha"` — Esqueci minha senha) e :227 (mesma rota — Cadastrar senha) · PV2/backend/...login/service/PasswordResetService.java:267-268 — "após autorização, atualiza **todas** as identidades descobertas pelo login (CPF), não somente a âncora do e-mail escolhido" · PV2/docs/sdd/decisions.md:235-240 (ADR-024)
**O que ainda falta decidir:** Se o primeiro acesso deve pedir prova extra. Hoje quem controla o e-mail cadastrado em **uma** base troca a senha em todas.

### portal--recuperar-senha-codigo--4
**Pergunta:** Quantos códigos errados encerram a tentativa.
**Veredito:** RESPONDIDA
**Resposta:** Na prática, nenhum. A configuração diz 5 (`max-attempts`), mas no fluxo do portal novo o contador nunca sobe: a confirmação do código não registra erro. O único ponto que registra tentativa falha está no endpoint antigo de troca de senha, e só quando o código existe mas o usuário não é achado naquela base. Motivo técnico: os códigos ficam guardados **indexados pelo próprio código**; digitar um código errado simplesmente não encontra nada ("Código inválido!") e não há a quem atribuir o erro. Consequência que a tela não considera: a confirmação recebe só o código, sem o CPF — um código válido de **qualquer** pessoa que esteja recuperando a senha naquele momento é aceito. Os demais números: código de 6 dígitos; validade de 20 minutos (1200 s) contados da emissão; pedir novo código invalida o anterior da mesma conta; intervalo mínimo de 60 s entre envios para o mesmo CPF; depois de confirmado, o código vira um tíquete de uso único que vale até o fim dos mesmos 20 minutos.
**Evidência:** PV2/backend/...login/service/PasswordResetService.java:223-229 — `verifyCodigoAcrossProducts(String codigo)` → `requireValidSession(normalized)` (sem login, sem `registerFailedAttempt`) e :243 (única chamada de `registerFailedAttempt`, no fluxo legado) · PV2/backend/...login/reset/InMemoryResetTokenStore.java:21 — `private final Map<String, ResetTokenSession> byCodigo` · PV2/backend/src/main/resources/application.yml:61-62 — `max-attempts: ${…:5}`, `resend-cooldown-seconds: ${…:60}` · PV2/contract-tests/src/main/java/br/ucam/portal/login/contracts/LegacyAuthConstants.java:24 — `TOKEN_EXPIRE_SECONDS = 20 * 60`
**O que ainda falta decidir:** O limite real, e amarrar o código ao CPF de quem pediu. Os códigos ficam em memória (um reinício do servidor apaga todos — SEC-005).

### portal--recuperar-senha-codigo--5
**Pergunta:** Quais e-mails do cadastro podem receber o código.
**Veredito:** RESPONDIDA
**Resposta:** Só o e-mail do cadastro da pessoa (`academico.pessoa.email`) de cada base onde o CPF tem conta ativa. O cadastro não separa institucional de pessoal: é um campo só. Se as bases tiverem e-mails diferentes, a tela oferece a escolha (mascarados, com o rótulo da base: Campos, Rio, EAD…); o navegador nunca pode informar um e-mail livre, só o identificador de uma das opções devolvidas. E-mail com formato inválido é ignorado; sem nenhum válido, a mensagem é "Não foi possível localizar um e-mail cadastrado para recuperação. Entre em contato com a Central de ajuda." O celular não recebe nada (o envio de SMS não está implementado).
**Evidência:** PV2/backend/...login/service/PasswordResetService.java:183-198 — "O frontend não pode informar um e-mail arbitrário — só o `emailOptionId` retornado no lookup" e :60-63 (mensagens) · PV2/backend/...login/repository/JdbcUsuarioRepository.java:47-49
**O que ainda falta decidir:** Se o código pode ir a e-mail pessoal (hoje vai, se for o que está no cadastro) e quem atualiza o e-mail de quem não tem acesso a ele.

### portal--definir-senha--3
**Pergunta:** Qual é a política de senha.
**Veredito:** RESPONDIDA
**Resposta:** Não há política. O servidor aceita qualquer senha que não seja vazia ou só espaços: sem tamanho mínimo, sem composição, sem lista de proibidas, sem comparar com a anterior (a anterior pode ser repetida). A tela só exige os dois campos preenchidos e iguais. A senha é guardada como MD5 codificado em Base64, sem sal — o formato do legado, mantido porque as demais aplicações leem a mesma coluna; está registrado como risco alto (SEC-002), com migração para bcrypt "futura".
**Evidência:** PV2/backend/...login/controller/PortalPasswordResetController.java:78 — `String senha = requireString(body, "senha");` (só exige não vazio, :102-111) · PV2/frontend/src/app/pages/password-set/password-set.ts:38-39,75 — `senha: ['', Validators.required]` … `if (senha !== confirma)` · PV2/backend/...login/security/PasswordService.java:26-31 — `MessageDigest.getInstance("MD5") … Base64.getEncoder().encodeToString(digest.digest())` · PV2/docs/sdd/security-risks.md:8
**O que ainda falta decidir:** A política inteira. Atenção ao desenhar: o Gerencial novo grava senha em **bcrypt** na mesma coluna (ver "Descobertas fora da lista", item 2).

### portal--definir-senha--4
**Pergunta:** Trocar a senha encerra as sessões abertas em outros aparelhos?
**Veredito:** RESPONDIDA
**Resposta:** Não. A troca só atualiza a coluna de senha; nenhum token nem sessão é removido. Quem estava dentro continua até a sessão morrer por inatividade (20 minutos sem uso).
**Evidência:** PV2/backend/...login/service/PasswordResetService.java:299-323 (só `usuarioRepository.updateSenhaHash(...)` e `resolved.consume()`; nenhuma chamada ao `TokenStore`) · PV2/backend/...login/repository/JdbcUsuarioRepository.java:65-70 — `UPDATE usuario SET senha = :senha WHERE oid = :oid AND status = 'A'`
**O que ainda falta decidir:** Se deve encerrar. Hoje o depósito de tokens é em memória e indexado por token; encerrar "todas as sessões do CPF" exigiria varrer por usuário em cada base.

### portal--definir-senha--5
**Pergunta:** [proposta] Depois de salvar, a pessoa volta para a entrada; a troca não abre sessão sozinha.
**Veredito:** RESPONDIDA
**Resposta:** O sistema já faz o que a proposta diz. A resposta da troca traz só a situação (OK, PARTIAL ou FAILED) e uma mensagem; não traz token. A tela mostra "Senha salva" e o caminho de volta ao login. Há um terceiro desfecho que a tela de referência não tem: **PARTIAL** — a senha mudou em algumas bases e falhou em outras; a pessoa vê "Não foi possível concluir a alteração em todos os ambientes" e fica com senhas diferentes entre as bases.
**Evidência:** PV2/backend/...login/dto/PortalPasswordChangeResponse.java:5-7 — `status: OK | PARTIAL | FAILED` · PV2/frontend/src/app/pages/password-set/password-set.ts:84-96 — `if (body.status === 'PARTIAL') { … } … this.success.set('Senha salva');`
**O que ainda falta decidir:** O texto e a saída do caso parcial (REQ-RESET-004 pede só "reportar sem detalhes técnicos").

### portal--chegada--4
**Pergunta:** [proposta] O endereço com o token é substituído; o token não fica no histórico.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O Portal entrega o token **dentro do caminho do endereço**: `{endereço da aplicação}/{token}/{oid do usuário}[/{unidade}]`. Isso é contrato congelado (as aplicações antigas leem o caminho) e está registrado como risco aceito (SEC-010); a decisão escrita é não esconder o token enquanto as aplicações não mudarem (ADR-025). Substituir o endereço depois é tarefa de cada sistema de destino, não do Portal. Dos sistemas lidos, o Gerencial novo faz a substituição (`history.replaceState` logo ao ler) — mas ele espera um token de outro tipo, num outro lugar do endereço (um JWT no fragmento `#token=`), que o Portal não emite hoje.
**Evidência:** PV2/CONTRATOS_LEGADO.md:130-133 — `{getLink(app,realm)}/{token}/{oidUsuario}/{oidUnidadePadrao}` · PV2/docs/sdd/security-risks.md:17 — `SEC-010 | Token OAuth na URL handoff | Parsers legados apps | Médio logs/Referer` · G3/frontend/src/app/features/sessao/handoff.component.ts:81 — `history.replaceState(null, '', window.location.pathname);`
**O que ainda falta decidir:** A regra por sistema de destino. E como o Portal entrega identidade ao Gerencial novo (ver "Descobertas", item 3).

### portal--chegada--5
**Pergunta:** O servidor de cada sistema confere o token a cada chamada?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O Portal oferece a conferência (`GET /api/auth/authorize_resource`, com o token, o oid do usuário e o nome do recurso) e cada chamada bem-sucedida renova os 20 minutos. Quem chama, varia: o SIGU antigo confere a cada navegação e desloga se a resposta não for 200; o Gerencial novo confere a cada chamada, mas um token **próprio** (JWT de 30 minutos), sem voltar ao Portal; e o modelo usado pelos back-ends novos da casa (`ucam-multitenancy-backend-template`, copiado em `integracao-api`) só verifica que **existe** um cabeçalho `Authorization` — qualquer texto passa. Duas ressalvas do próprio Portal: a conferência não olha se o usuário tem direito àquela aplicação, e um token já vencido ainda é aceito (e volta a valer), enquanto ninguém o remover.
**Evidência:** PV2/backend/...login/service/AuthService.java:439-473 — `tokenStore.getIgnoringExpiry(accessToken)` … `session.putAccessResource(...)` · SIGU/DomainEJB/ejbModule/br/ucam/campos/dti/services/rest/financeiro/RestService.java:251-257 — `.path("/api/auth/authorize_resource") … return response.getStatus() == SC_OK;` · ucam-multitenancy-backend-template/src/main/java/br/edu/candidomendes/template/interceptor/AuthorizationInterceptor.java:27-35 — `if (token == null) throw …; return true;` · PV2/docs/sdd/security-risks.md:10 (SEC-004)
**O que ainda falta decidir:** A regra para os sistemas novos. Os demais back-ends (protocolo, financeiro, secretaria etc.) não foram lidos nesta pesquisa.

### portal--chegada--6
**Pergunta:** Usuário sem nenhuma unidade vinculada: abre sem unidade ou é barrado?
**Veredito:** RESPONDIDA
**Resposta:** Depende do caminho, e os dois comportamentos existem. (a) Clique no cartão da grade: abre **sem** o trecho da unidade no endereço — o Portal não barra; o que acontece depois é com o sistema de destino. (b) Login pedido direto por uma aplicação (endereço com `client_id` da aplicação): o Portal **barra** com erro 400 "Unidade padrao obrigatoria para aplicacao …". A unidade enviada é a marcada como padrão (`padrao = 'S'`); se a pessoa não tem padrão, vai **qualquer** unidade ativa dela. Só sete aplicações recebem unidade (entre elas o Gerencial novo, Registro de Diplomas, Captação, Turmas Compartilhadas). No Gerencial novo, a sessão abre mesmo sem unidade (lista vazia); ao pedir os menus de uma unidade em que não tem vínculo, recebe 403 "Usuário não tem vínculo ativo com esta unidade.".
**Evidência:** PV2/backend/...login/dashboard/HandoffLinkService.java:64-70 — `unidade = catalogRepository.findOidUnidadePadrao(...).orElse(null); … recebeUnidade && unidade != null` e :87-91 — `.orElseThrow(() -> new HandoffException("Unidade padrao obrigatoria para aplicacao " + aplicacaoOid))` · PV2/backend/...login/repository/JdbcDashboardCatalogRepository.java:72-87 (padrão, depois qualquer) · G3/backend/gerencial/src/main/java/br/ucam/sigu/gerencial/application/menu/CarregarMenusDaUnidadeUseCase.java:74-76
**O que ainda falta decidir:** A mensagem própria da tela de chegada e se o caso (a) deve barrar também.

### portal--sessao-encerrada--3
**Pergunta:** [proposta] Depois de entrar de novo, a pessoa volta para a tela em que estava.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não faz. No Portal, sessão inválida leva a `/login` sem guardar de onde a pessoa veio, e o login bem-sucedido vai sempre para a grade. No Gerencial novo, o erro 401 leva a `/sessao-expirada` e a entrada seguinte cai sempre no Início (`/`). O endereço de chegada do Portal às aplicações não tem campo para "tela de destino".
**Evidência:** PV2/frontend/src/app/core/session.guard.ts:14-17 — `return of(router.createUrlTree(['/login']));` · G3/frontend/src/app/features/sessao/handoff.component.ts:89-91 — `next: () => this.router.navigateByUrl('/')`
**O que ainda falta decidir:** Se entra; exigiria mudar o contrato de chegada ou guardar o destino no navegador.

### portal--sessao-encerrada--4
**Pergunta:** A pessoa é avisada antes de a sessão terminar e pode prorrogá-la?
**Veredito:** RESPONDIDA
**Resposta:** Não é avisada, em nenhum sistema lido. Os tempos reais: o token do Portal vale 20 minutos **de inatividade** (cada conferência de um sistema renova os 20 minutos — é deslizante, a "prorrogação" é o próprio uso). A sessão da tela do Portal (cookie) não tem tempo configurado no portal novo, então segue o padrão do servidor de aplicação; no portal antigo era 20 minutos. O Gerencial novo usa token próprio de 30 minutos **fixos**, que não se renova: existe código para um token de renovação de 24 horas, mas nenhum endpoint o usa. O servidor informa `expiraEmMinutos: 30` na entrada, e a tela não usa esse número para avisar.
**Evidência:** PV2/CONTRATOS_LEGADO.md:169 — `TTL token | expires_in="1200"; sliding por authorize_resource; idle: expira se expire < secondsSinceLastAccess` · PL/portalucam-war/WebContent/WEB-INF/jboss-web.xml:5 — `<session-timeout>20</session-timeout>` · G3/backend/gerencial/src/main/resources/application.yml:80-81 — `expiration-minutes: ${JWT_EXPIRATION_MINUTES:30}` / `refresh-expiration-minutes: ${…:1440}`
**O que ainda falta decidir:** Se haverá aviso e prorrogação. No Gerencial novo, prorrogar exige criar o endpoint de renovação.

### portal--sessao-encerrada--5
**Pergunta:** O que estava sendo digitado é guardado como rascunho quando a sessão cai?
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há rascunho em nenhum dos sistemas lidos: o Portal não tem formulário longo (só login e senha) e o Gerencial novo, ao receber 401, limpa a sessão e troca de tela. O único texto sobre o assunto confirma a perda: ao trocar de base no Gerencial, a confirmação avisa que "alterações não salvas são perdidas".
**Evidência:** G3/frontend/src/app/core/interceptors/error.interceptor.ts:21-22 — `auth.logout(); router.navigateByUrl('/sessao-expirada');` · G3/docs/adr/0033-troca-de-tenant-dentro-do-modulo.md:40-41
**O que ainda falta decidir:** Se haverá rascunho e em quais telas.

### portal--sessao-encerrada--6
**Pergunta:** Sair num sistema encerra a sessão em todos os outros abertos?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Em parte, e por efeito colateral, não por regra. O Portal entrega às aplicações **o mesmo token** da sua sessão (quando a aplicação é da mesma base em que a pessoa autenticou). Sair pelo Portal apaga esse token e encerra a sessão da tela; toda aplicação que confere o token no Portal cai na conferência seguinte. Sair por uma aplicação antiga (o SIGU chama `POST /api/auth/logout` com o token) apaga o mesmo token, derrubando as outras aplicações que o usam — mas a tela do Portal continua aberta, já com um token morto. Ficam de fora: (1) aplicações de **outra** base, que recebem um token emitido à parte no clique e que o "Sair" do Portal não remove; (2) o Gerencial novo, cujo "Sair" só limpa a memória do navegador — o token dele segue válido até completar 30 minutos e não é avisado a ninguém; (3) sistemas que não conferem o token.
**Evidência:** PV2/backend/...login/service/PostLoginService.java:84-97 — `authService.logout(String.valueOf(tokenAttr)); … session.invalidate();` · PV2/backend/...login/dashboard/DashboardService.java:524-546 — `if (sessionOid.equals(identity.usuarioOid())) { return snap.token(); } … authService.issueTmpToken(...)` · SIGU/DomainEJB/…/rest/financeiro/RestService.java:265-268 — `.path("/api/auth/logout").request().post(Entity.entity(token, …))` · G3/frontend/src/app/core/services/auth.service.ts:143-150
**O que ainda falta decidir:** A regra desejada (sair de um = sair de todos?) e o que mostrar na tela do Portal quando o token dela foi apagado por outra aplicação.

---

## Descobertas fora da lista

1. **Existe uma senha mestra provisória no código do portal novo.** Marcada como "TEMP incidente — senha mestra para teste com visão do usuário. REMOVER assim que o teste terminar", ela deixa entrar como qualquer usuário ativo, em qualquer base, sem a senha dele, inclusive pelo aplicativo móvel. O valor está em texto no código-fonte (não copiado aqui). — PV2/backend/...login/security/PasswordService.java:17-21 e usos em AuthService.java:102,143-146,350.

2. **A consulta de recuperação expõe dados pessoais sem autenticação.** `POST /api/portal/password-reset/lookup` devolve nome completo, celular e (com um só e-mail) o e-mail inteiro de qualquer CPF com conta. — PV2/backend/...login/service/PasswordResetService.java:153-163; PasswordLookupResponse.java:15-22.

3. **O Portal não emite o token que o Gerencial novo exige.** O Portal entrega token opaco no caminho (`/{token}/{oid}/{unidade}`); o Gerencial novo só aceita um JWT assinado com chave do "dashboard", com `sub` + `tenant`, no fragmento do endereço. Não há JWT em nenhum ponto do back-end do Portal, e os ADRs do Gerencial registram a chave como "a coordenar com o time do dashboard". — G3/docs/adr/0013-entrada-de-sessao-usuario-tenant-unidade.md:49-54; G3/docs/adr/0021-fechamento-formal-do-modulo.md:86-88; PV2/docs/sdd/decisions.md:7-12 (ADR-001: token opaco, não JWT).

4. **Uma pessoa, várias contas, senhas possivelmente diferentes.** O login passa se a senha casar em **pelo menos uma** das 8 bases; depois disso a grade mostra as aplicações de **todas** as bases onde o CPF existe, sem conferir a senha de novo. — PV2/docs/sdd/decisions.md:217-231 (ADR-022 e ADR-023).

5. **Recuperar a senha troca a senha em todas as bases, e pode falhar pela metade** (estado PARTIAL), deixando senhas divergentes sem desfazer nada. — PV2/docs/sdd/requirements.md:59-60 (REQ-RESET-003/004); security-risks.md:22 (SEC-016).

6. **Conta bloqueada consegue trocar a senha, mas continua sem entrar.** A recuperação procura só conta ativa, sem olhar o bloqueio; o login exige `bloqueado = FALSE`. A pessoa recebe "Senha salva" e depois "usuario ou senha invalidos". — PV2/backend/...login/repository/JdbcUsuarioRepository.java:23-31 × :46-53; UsuarioRepository.java:29 ("**não** filtra bloqueado").

7. **A data de expiração do usuário não é conferida no login.** A coluna `dataexpiracao` existe e o Gerencial a edita, mas a consulta de autenticação só olha situação e bloqueio. — PV2/backend/...login/repository/JdbcUsuarioRepository.java:23-31.

8. **Existe emissão de token sem senha** (`POST /api/auth/token/tmp`), contrato exigido pelo SIGU para abrir a "visão do aluno"; classificado como risco crítico, a mitigar por rede interna depois da virada. — PV2/docs/sdd/security-risks.md:7 (SEC-001); decisions.md:280-285 (ADR-029).

9. **Um reinício do servidor desloga todo mundo.** Tokens e códigos de recuperação ficam em memória; o canário roda com uma réplica só, e escalar é proibido até trocar para Redis. — PV2/docs/sdd/decisions.md:25-30 (ADR-017); PV2/kubernetes/portal-login/deployment-backend.yaml:18.

10. **Base fora do ar tem tela própria que a referência não desenhou:** erro 503 "Nao foi possivel concluir a autenticacao no momento. Tente novamente mais tarde.", diferente de senha errada. — PV2/backend/...login/service/AuthService.java:127-134.

11. **A grade abre o sistema em nova aba só depois de o servidor responder**, com "Aguarde..." no cartão; o navegador pode bloquear a janela, e a decisão registrada é avisar o usuário, sem contorno. — PV2/docs/sdd/decisions.md:171-176 (ADR-019).

12. **O cartão do Suporte envia o CPF como "senha" a um sistema externo** (formulário com nome, e-mail e `lpasswd` = login), e os cartões de BI/Frequência usam um token fixo de formulário, igual para todos, que está no código. — PV2/backend/...login/dashboard/DashboardService.java:344-349; PV2/CONTRATOS_LEGADO.md:151-156.

13. **Cartão sem endereço cadastrado não aparece** (em vez de aparecer desabilitado): a referência não precisa de estado "indisponível". — PV2/docs/sdd/decisions.md:271-276 (ADR-028).

14. **A unidade enviada ao sistema é a "padrão" do usuário, e na falta dela, qualquer uma.** A grade não pergunta a unidade. — PV2/backend/...login/repository/JdbcDashboardCatalogRepository.java:72-87, 167-180.

15. **O manual de primeiro acesso contradiz o sistema** (diz SMS; o envio é por e-mail) e o envio de SMS não existe. — PV2/docs/manual-primeiro-acesso.html ("Digite o código de 6 dígitos recebido no celular"); PV2/backend/...login/service/PasswordResetService.java:46 ("código de 6 dígitos enviado por e-mail").
