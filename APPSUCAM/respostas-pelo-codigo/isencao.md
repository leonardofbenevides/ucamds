# Isenção de disciplinas — respostas pelo código

Pesquisado em 06/10/2026. Abreviações de caminho (todos em `C:\Users\Leonardo\Documents\UCAM-repos\`):

- `BE` = `isencao-v2/backend-v2/src/main/java/br/ucam/campos/backendv2`
- `FE` = `isencao-v2/frontend-v2/src/app/features/isencao`
- `SDD` = `isencao-v2/docs/sdd`
- `INSC` = `inscricao-processo-seletivo-backend/src/main/java/br/edu/candidomendes/inscricaoprocessoseletivo`
- `PSS` = `processo-seletivo-service/src/main/java/br/ucam/campos/processoseletivoservice`
- `PSF` = `processo-seletivo-frontend/src/app`

**Alcance desta pesquisa (leia antes de usar).** O `isencao-v2` foi lido a fundo: `IsencaoService`, `IsencaoRepository`, controllers, políticas da IA, propriedades, o front e os SDD 01, 03, 04, 05, 08, 12, 13 e 17 inteiros; os SDD 02, 06, 07, 09, 10, 11, as ADR, `ISENCAO-IA.md`, READMEs e `sql/` só por busca de termos (prazo, e-mail, recurso, reabrir, histórico, matrícula, coordenador, janela, expiração, desistência). Os SDD 14, 15, 16, 18 e `vestibular-visualizacao-legado.md` são de vestibular e só tiveram o título lido. Os demais repositórios (`processo-seletivo-service`, `processo-seletivo-frontend`, `inscricao-processo-seletivo-backend`, `selecao-service`, `secretaria-virtual-backend`, `sigu`, `sigu_2-0`, `integracao-api`, `email-smtp-ucam-backend`, `protocolo-backend-novo`) foram cobertos por dois levantamentos paralelos e por busca dirigida; os trechos citados aqui desses repositórios foram reabertos e conferidos, salvo onde o texto diz "não conferido". Limites desse levantamento: no `processo-seletivo-service` foi lida a branch `master` (o README diz que o desenvolvimento corre em `versao_2`, **não lida**); dos `.md` do serviço, `CONSTITUTION.md` e `ENDPOINT.md` só por busca; dos 11 `.md` de `PSF/admin/isencao/`, só `SPECIFICATION.md`, `TASK.md` e `README.md` por inteiro (os 11 tratam da notificação por e-mail, não de regra de análise); `sigu` e `sigu_2-0` só por busca. Não há manual (`.pdf`, `.docx`) sobre isenção nesses repositórios.

Segredos: existem senha de banco e chave de API em `isencao-v2/backend-v2/src/main/resources/application.properties` (linhas 12 e 40, por variável de ambiente com default) e o SDD 08 registra credenciais fixas no `WebSecurityConfig` do legado. Nenhum valor foi copiado.

---

### isencao--fila--1
**Pergunta:** Quatro situações (Aguardando envio, Aguardando análise, Aguardando candidato, Concluída), iguais dos dois lados; "Aguardando você" no candidato.
**Veredito:** RESPONDIDA
**Resposta:** O servidor só guarda três estados: `PENDENTE_ANALISE`, `ANALISADO_COM_PENDENCIA` e `CONCLUIDO`. "Aguardando envio" não é estado: o front deriva de "zero documentos" enquanto o estado é `PENDENTE_ANALISE`. Os quatro rótulos e o "Aguardando você" do candidato já são os da proposta. A proposta bate com o que a tela mostra, mas não com o banco.
**Evidência:** `SDD/04-regras-negocio.md:10-14` — tabela dos três status; `FE/admin-ux/coord-data.ts:53-64` — `if (!c.documentos) return 'AGUARDANDO_ENVIO'`; `FE/candidato-ux/candidato-ux.ts:34-39` — `if (data.status === 'ANALISADO_COM_PENDENCIA') return 'AGUARDANDO_VOCE'`.
**O que ainda falta decidir:** Se "Aguardando envio" deve virar estado de verdade (hoje não dá para filtrar no servidor nem contar prazo a partir dele).

### isencao--fila--2
**Pergunta:** Manual e com sugestão são a mesma fila; a sugestão é atributo da solicitação (disponível, em processamento, falhou, sem análise).
**Veredito:** RESPONDIDA
**Resposta:** Já é assim. A consulta da fila é uma só e traz, por solicitação, a situação da análise automatizada mais recente (`PROCESSANDO`, `CONCLUIDA`, `FALHA` ou nulo). As rotas `admin/isencao` e `admin/isencao-ia` usam o mesmo shell; a segunda só mostra a coluna a mais.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:244` — `(SELECT a.situacao FROM processoseletivo.analiseisencaoia a WHERE a.oidisencao = i.oid ... ORDER BY a.dataanalise DESC LIMIT 1) as situacaoanaliseia`; `FE/admin-ux/coord-data.ts:66-73` — chaves `DISPONIVEL | PROCESSANDO | FALHOU | SEM_ANALISE`.
**O que ainda falta decidir:** Nada de regra; resta a duplicação de rota.

### isencao--fila--3
**Pergunta:** Quem vê a fila: cada coordenação só o próprio curso, ou a unidade inteira.
**Veredito:** RESPONDIDA
**Resposta:** A unidade inteira. A fila é filtrada só pela unidade que vem na URL; o identificador da pessoa também vem na URL, mas o servidor **não o usa**. Se a unidade for EAD (oid começando por `polo`, `semi`, `hibri` ou igual a `unid32`), a fila traz **todas as unidades**. Existe no repositório uma consulta que restringe aos cursos em que a pessoa é coordenadora (`findCoursesByPessoa`, via `academico.coordenador`), mas ela só alimenta `getCourses`, que não tem endpoint no v2.
**Evidência:** `BE/web/controller/IsencaoController.java:122-128` — `return ResponseEntity.ok(isencaoService.getCoursesToAnalize(oidunidade));` (o `oidpessoa` é ignorado); `BE/service/isencao/IsencaoService.java:449-458` — `if (!isEAD) candidates = isencaoRepository.findCandidates(oidunidade); else ... findCandidatesEAD()`; `BE/service/UtilService.java:8-16`.
**O que ainda falta decidir:** Se a restrição por curso deve existir. O dado para isso já está no acadêmico (`academico.coordenador` → `unidadecurso`).

### isencao--fila--4
**Pergunta:** Quando se pode pedir isenção: janela do calendário ou a qualquer momento.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O pedido não é feito "a qualquer momento" numa tela própria: ele **nasce na inscrição do processo seletivo**, quando o candidato escolhe forma de ingresso Transferência (oid `03`) ou a de oid `04` e marca a opção de isenção. A solicitação é criada junto com a inscrição, já em `PENDENTE_ANALISE`, e a inscrição fica `PENDENTE`. Não há checagem de data própria da isenção; a janela é a da inscrição, que só aceita forma de ingresso com vigência aberta (`formaingressovigencia`, entre `datainicio` e `datafim`). Depois de criado o pedido, o envio de documentos não tem data-limite. O endpoint `POST /isencao/{fip}` do v2 também cria a solicitação, sem checar data nem duplicidade, e nenhuma tela do v2 o chama.
**Evidência:** `INSC/dto/PessoaIngressanteDTO.java:43-48` — `Arrays.asList(SEGUNDA_GRADUACAO, TRANSFERENCIA).contains(this.oidformaingresso) && this.isensao`; `INSC/service/impl/FormaIngressoPessoaServiceImpl.java:92-95` — `this.isencaoService.novo(new Isencao(fip.getOid()));`; `PSS/service/FormaIngressoPessoaService.java:154-162` (mesma regra no legado); `INSC/constants/Querys.java:33-36` — `current_date >= fiv.datainicio AND current_date <= fiv.datafim`; `BE/service/isencao/IsencaoService.java:69-74`.
**O que ainda falta decidir:** Se quem já se inscreveu sem marcar a opção pode pedir depois, e até quando; se a isenção deve ter janela própria, diferente da inscrição.

### isencao--fila--7
**Pergunta:** O prazo de 15 dias para o candidato responder vai existir, e o que acontece quando vence.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe prazo nenhum. A solicitação não tem campo de vencimento (só `datasolicitacao` e `dataalteracao`), não há tarefa agendada no módulo e a busca por "prazo" e "dias" nos SDD não trouxe regra de prazo do candidato. O único "prazo" do sistema é outro: disciplina cursada há mais de 10 anos (ver descobertas).
**Evidência:** `BE/domain/isencao/Isencao.java:42-47` — campos `dataalteracao`, `datasolicitacao`, `codigomatriz`, `observacao`; a única reação assíncrona é `BE/service/isencao/IsencaoAnaliseIaAgendador.java:22-24` (`@Async @EventListener`, dispara a IA).
**O que ainda falta decidir:** Tudo: se há prazo, de quantos dias, a partir de quê e a consequência.

### isencao--analise--1
**Pergunta:** Decisão por disciplina (isentar, não isentar, pedir documento), sempre humana; "Aplicar sugestões" só preenche as sem decisão, nunca sobrescreve nem pede documento sozinha.
**Veredito:** RESPONDIDA
**Resposta:** O sistema já faz o que a proposta diz. Os três valores por disciplina são `ACEITO`, `RECUSADO` e `PENDENTE` (este com motivo = documento pedido). A IA nunca grava decisão: grava sugestão `PENDENTE`, e só um clique humano a transforma em decisão. "Aplicar sugestões" pega apenas as sugestões de **isentar** ainda pendentes, e apenas em disciplina sem decisão; aplicar não conclui a análise. Sugestão já decidida não muda (erro 409). Ressalva: quem garante "só as sem decisão" é o front; o endpoint de decisão da sugestão sobrescreveria uma decisão existente se fosse chamado direto.
**Evidência:** `FE/pages/admin/admin-isencao.shell.ts:627-642` — `filter((s) => s.recomendacao === 'ISENTAR' && s.status === 'PENDENTE')` e `return !!d && !d.aceita;`; `BE/service/isencao/IsencaoAnaliseIaService.java:202-204` — `throw new IsencaoIaConflictException("Sugestão já foi decidida.")`.
**O que ainda falta decidir:** Se o servidor deve recusar sugestão sobre disciplina já decidida.

### isencao--analise--2
**Pergunta:** Disciplina sem decisão barra o fechamento; falta de documento nunca vira "não isenta".
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz **o contrário**. Finalizar com disciplinas sem decisão é aceito: o servidor as ignora, marca a solicitação `CONCLUIDO`, e a partir daí toda disciplina da matriz sem registro é **exibida como recusada**. Pior para a segunda metade da proposta: uma disciplina que estava "pedir documento" e chega ao Finalizar sem motivo e sem nova decisão é **gravada como RECUSADO**. A validação do front só exige campos de quem tem decisão; não exige decisão.
**Evidência:** `BE/service/isencao/IsencaoService.java:384-387` — `i.getSituacao().equals(IsencaoStatus.CONCLUIDO) ? IsencaoDisciplinaStatus.RECUSADO : IsencaoDisciplinaStatus.PENDENTE`; `:209-215` — pendente sem motivo → `setSituacao(IsencaoDisciplinaStatus.RECUSADO)`; `SDD/04-regras-negocio.md:57` — "pendentes viram `RECUSADO` no fluxo final"; `FE/utils/isencao-ui.ts:16-36`.
**O que ainda falta decidir:** Confirmar a proposta implica mudar o servidor. Decidir também o que fazer com as solicitações já concluídas em que "não isenta" é, na verdade, "ninguém decidiu".

### isencao--analise--3
**Pergunta:** Não há fechamento parcial: com documento pedido, a solicitação inteira espera o candidato e as decisões tomadas ficam salvas.
**Veredito:** RESPONDIDA
**Resposta:** Já é assim. No Finalizar, basta uma disciplina em "pedir documento" com motivo para a solicitação inteira ir a `ANALISADO_COM_PENDENCIA` em vez de `CONCLUIDO`; as decisões de isentar e não isentar das outras ficam gravadas, e a inscrição do candidato só vira `APROVADO` quando a solicitação conclui. Existe ainda o "Salvar rascunho" (`evaluate?partial=true`), que grava decisões sem mudar a situação.
**Evidência:** `BE/service/isencao/IsencaoService.java:197-200` — `isencaoDisciplina.setSituacao(PENDENTE); isencao.setSituacao(IsencaoStatus.ANALISADO_COM_PENDENCIA);`; `:226-230` — só em `CONCLUIDO` faz `formaIngressoPessoa.setSituacao("APROVADO")`.
**O que ainda falta decidir:** Nada.

### isencao--analise--4
**Pergunta:** Prazo de 15 dias corridos para o candidato enviar o documento pedido.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O sistema não trata. Não há data do pedido por disciplina com esse fim, nem contagem, nem exibição de prazo. A data que existe é `dataalteracao` da solicitação, que muda a cada troca de situação e serviria de base se a regra for criada.
**Evidência:** `BE/domain/isencao/Isencao.java:57-62` — `setSituacao` atualiza `dataalteracao`; nenhuma ocorrência de regra de prazo do candidato em `BE` nem nos SDD pesquisados.
**O que ainda falta decidir:** O número de dias, se são corridos ou úteis, e de quando contam.

### isencao--analise--5
**Pergunta:** Prazo vencido: a análise segue com o que há ou a solicitação é cancelada.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há vencimento, nem cancelamento, nem estado "cancelada" ou "expirada" (o enum tem só três valores). Hoje a coordenação pode, a qualquer momento, finalizar uma solicitação que está "Aguardando candidato"; nesse caso as disciplinas com documento pedido que voltarem sem motivo viram "não isenta" (ver `analise--2`).
**Evidência:** `SDD/04-regras-negocio.md:10-14` (três status); `BE/service/isencao/IsencaoService.java:209-215`.
**O que ainda falta decidir:** A pergunta inteira.

### isencao--analise--6
**Pergunta:** Observação ao candidato com até 150 caracteres; enviá-la muda a situação para Aguardando candidato.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O limite de 150 existe, mas **só no campo da tela** (o legado também usava 150); o servidor não valida tamanho. Sobre a mudança de situação: "Enviar pedido ao candidato" (`POST /notificar`) sempre leva a `ANALISADO_COM_PENDENCIA` e grava a observação **se houver** — a observação é opcional. E a mesma observação também é gravada pelo Salvar rascunho e pelo Finalizar, sem mudar a situação por causa dela. Ou seja: o que muda a situação é o botão, não a observação.
**Evidência:** `FE/pages/admin/admin-isencao.shell.html:677` — `maxlength="150"`; `PSF/admin/isencao/components/isencao/admin-isencao.component.html:501`; `BE/service/isencao/IsencaoService.java:171-174` — `if (observacao != null && !observacao.isBlank()) isencao.setObservacao(...); isencao.setSituacao(ANALISADO_COM_PENDENCIA);`.
**O que ainda falta decidir:** Se a observação é obrigatória para enviar o pedido e se o limite deve valer no servidor. Não verifiquei o tamanho da coluna `observacao` no banco.

### isencao--analise--7
**Pergunta:** Quem pode finalizar: qualquer pessoa da coordenação ou só quem coordena o curso.
**Veredito:** RESPONDIDA
**Resposta:** Hoje, qualquer pessoa que tenha sessão no navegador — e, no servidor, qualquer um que conheça o endpoint. O guard só verifica se há sessão gravada; não há perfil, nem vínculo com o curso. O `POST /evaluate` não recebe nem checa usuário, e o autor gravado nas decisões é sempre o texto fixo "sistema" (ou `"NULL"`).
**Evidência:** `FE/../core/auth/auth.guard.ts:5-12` — `if (auth.authenticated()) return true;`; `BE/service/SecurityUtilService.java:8-10` — `return "sistema";`; `SDD/03-telas-e-fluxos.md:101-103` — "`AuthGuard` ... **sem RBAC** por perfil/rota" e "Backend isenção: majoritariamente aberto".
**O que ainda falta decidir:** A regra de quem pode. O dado de coordenador por curso existe no acadêmico; falta a decisão e a checagem.

### isencao--analise--8
**Pergunta:** Sugestão: isenta com 75% ou mais da ementa e carga igual ou maior; revisa entre 50% e 74% ou carga menor; não isenta abaixo de 50% ou sem equivalente.
**Veredito:** RESPONDIDA
**Resposta:** Os cortes reais são outros. **Isentar** com compatibilidade de ementa **≥ 70%** (não 75). **Revisar** de 50% a 69%, e também quando a carga de origem é menor que **75% da carga de destino** (não se exige carga igual ou maior), ou quando a ementa é inválida, ou sem ementa e com nomes não equivalentes. **Não isentar** abaixo de 50%, e também quando a carga de origem é menor que **50%** da de destino, quando a disciplina é **estágio ou TCC**, ou quando foi cursada há **mais de 10 anos**. Os valores vêm de propriedades do servidor (`ucam.llm.isencao.*`), alteráveis por variável de ambiente, com esses padrões.
**Evidência:** `BE/service/isencao/llm/RecomendacaoIsencaoIaPolicy.java:7` — `MIN_COMPATIBILIDADE_ISENTAR = 70`; `BE/service/isencao/llm/SugestaoIsencaoQualidadePolicy.java:16-21` — `MIN_PERCENTUAL_CARGA_HORARIA = 75; MIN_PERCENTUAL_CARGA_NAO_ISENTAR = 50; MAX_ANOS_APROVEITAMENTO = 10`; `SDD/06-integracao-claude.md:83-85`; `backend-v2/src/main/resources/application.properties:54-56`.
**O que ainda falta decidir:** Se a coordenação confirma 70/75/50/10 anos; o texto da regra no DS precisa ser corrigido para esses valores. Não há norma acadêmica citada no código como origem dos números.

### isencao--consulta--1
**Pergunta:** Reabrir desfaz um parecer entregue: exige confirmação e devolve a Aguardando análise.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não existe ação de reabrir, nem endpoint, nem botão; o detalhe concluído é só leitura. Mas o servidor **não impede** mexer numa concluída: o upload de documento devolve qualquer solicitação a `PENDENTE_ANALISE` sem olhar se estava concluída, e o `evaluate` aceita nova avaliação sobre uma concluída. O que segura isso hoje é só o front (`canUpload` não inclui `CONCLUIDO`). O único bloqueio de servidor é o do "notificar".
**Evidência:** `BE/service/isencao/IsencaoService.java:115-117` — `isencao.setSituacao(IsencaoStatus.PENDENTE_ANALISE);` sem checar o estado anterior; `:167-170` — `"Solicitação concluída não pode mudar para Aguardando candidato."`; `FE/utils/isencao-ui.ts:3-5`.
**O que ainda falta decidir:** Se reabrir vai existir. Se sim, falta tudo no servidor (inclusive devolver a inscrição de `APROVADO` para um estado em que a fila a enxergue — ver descobertas).

### isencao--consulta--2
**Pergunta:** Quem pode reabrir, até quando (depois da matrícula? do histórico?) e se o candidato é avisado.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há reabertura, logo não há regra de quem nem de até quando. Indício útil: a lista de concluídas considera inscrições `APROVADO` ou `MATRICULADO`, ou seja, o sistema já distingue quem se matriculou — daria para usar como limite.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:338-339` — `AND i.situacao = 'CONCLUIDO' AND fip.situacao IN ('APROVADO', 'MATRICULADO')`.
**O que ainda falta decidir:** A pergunta inteira.

### isencao--consulta--3
**Pergunta:** A observação enviada ao candidato não muda mais.
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário. A observação é um campo único da solicitação, **sobrescrito** a cada Salvar rascunho, a cada Finalizar e a cada "Enviar pedido" — inclusive apagado, se o campo voltar vazio no rascunho ou no finalizar. Não há histórico de versões no campo; o que preserva o texto antigo é a linha do tempo (Atividade), que guarda uma cópia de até 500 caracteres no momento do evento. Depois de concluída, a tela é só leitura, mas o servidor não trava.
**Evidência:** `BE/service/isencao/IsencaoService.java:189` e `:267` — `isencao.setObservacao(matrizDTO.getObservacao());`; `BE/service/isencao/IsencaoAtividadeService.java:56` — `MAX_DADOS = 500`.
**O que ainda falta decidir:** Se "não muda mais" vale só depois de concluída ou a cada envio (o que exigiria uma observação por envio).

### isencao--sem-documentos--1
**Pergunta:** Sem documento enviado não há decisão: a única ação é notificar o candidato.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Na tela, sim: sem documentos as decisões ficam desabilitadas, com o aviso "Sem documentos enviados não há decisão", e a ação oferecida é "Marcar aguardando candidato". No servidor, não: o `evaluate` não confere se há documento, então a regra é só de interface.
**Evidência:** `FE/pages/admin/admin-isencao.shell.ts:410-414` — `'Sem documentos enviados não há decisão.'`; `FE/pages/admin/admin-isencao.shell.html:99-110`; `BE/service/isencao/IsencaoService.java:187-190` (nenhuma checagem de documentos).
**O que ainda falta decidir:** Se o servidor deve impor a regra.

### isencao--sem-documentos--2
**Pergunta:** Por qual canal o candidato é notificado (e-mail, Portal, SMS) e se há limite de avisos.
**Veredito:** RESPONDIDA
**Resposta:** Depende da versão, e a nova perdeu o que a antiga tinha. **No v2 (2026): por nenhum canal.** "Notificar" só muda a situação para Aguardando candidato e grava a observação; o candidato só fica sabendo se abrir a página de acompanhamento. O código e a tela dizem isso com todas as letras. **No legado: e-mail**, mas disparado pelo navegador de quem analisa (não pelo servidor), depois de cada Salvar e de cada Finalizar, com texto fixo e genérico — assunto "Isenção Atualizada - UCAM", mensagem "Sua isenção foi atualizada com sucesso no sistema" — que não diz o resultado nem qual documento falta. O envio é pulado em silêncio se o endereço do serviço de e-mail não tiver sido configurado na implantação, e falha de e-mail não bloqueia nada. O serviço atende em `POST /api/email/enviar`, que a auditoria do v2 marcou como "não portar na fase 1". SMS: não há para isenção em nenhuma das versões (existe um `SmsService` no serviço legado, sem uso na isenção). Limite de avisos: não há; no legado sai um e-mail por clique (o `TASK.md` cita "sobrecarga de e-mails" só como risco).
**Evidência:** `BE/service/isencao/IsencaoService.java:158-159` — "`Não envia e-mail nem SMS` — não há canal de comunicação no domínio de isenção"; `PSF/admin/isencao/components/isencao/admin-isencao.service.ts:257-260` — `assunto: 'Isenção Atualizada - UCAM'` / `mensagem: 'Sua isenção foi atualizada com sucesso no sistema'`; `:372-381` — `return !emailService.includes('DEPLOY_EMAIL_SERVICE');` e `api/email/enviar`; `processo-seletivo-service/src/main/resources/templates/email/email_padrao.html:88`; `SDD/17-auditoria-backend-rewrite.md:81` — "`POST /api/email/enviar` | ? | email | NÃO fase1".
**O que ainda falta decidir:** Se o e-mail volta no v2, enviado pelo servidor; o texto (hoje não informa pendência nem parecer); limite de avisos. `email-smtp-ucam-backend` é só um formulário de contato e `integracao-api` não tem nada de isenção: nenhum dos dois serve como está.

### isencao--sem-documentos--3
**Pergunta:** Solicitação que nunca recebe documento expira? Em quanto tempo.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não expira. Fica na fila indefinidamente enquanto a inscrição estiver `PENDENTE` ou `CONFIRMADO` e a solicitação não for concluída. Não há tarefa agendada nem estado de expiração.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:256-259` — `WHERE i.status = 'A' AND i.situacao <> 'CONCLUIDO' AND fip.situacao IN ('PENDENTE', 'CONFIRMADO')`.
**O que ainda falta decidir:** A pergunta inteira. Atenção ao efeito colateral: a inscrição do candidato fica `PENDENTE` enquanto isso (ver descobertas).

### isencao--acompanhamento--1
**Pergunta:** Documento é PDF, JPG ou PNG de até 10 MB, mesmos formatos e limite do Protocolo.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** A tela do candidato aceita PDF, PNG ou JPG de até 10 MB — mas isso é **só no front**. O servidor, no envio, não valida tipo nem tamanho: valem os limites gerais de 30 MB por arquivo e 120 MB por requisição, e o máximo de **10 anexos por solicitação**. A análise automatizada, por sua vez, só lê **PDF de até 20 MB**; imagem é aceita no envio e ignorada pela IA. O legado aceitava `.png, .jpg, .pdf` só como filtro do seletor, um arquivo por envio, com limite de servidor de 30 MB. **"Igual ao Protocolo" não se sustenta:** o servidor do Protocolo aceita até **50 MB** e não valida tipo (o front do Protocolo não foi conferido).
**Evidência:** `FE/candidato-ux/candidato-ux.ts:132-133` — `MAX_UPLOAD_BYTES = 10 * 1024 * 1024` e `ACCEPT_UPLOAD = '.pdf,.png,.jpg,.jpeg,...'`; `application.properties:20-21` — `max-file-size=30MB`, `max-request-size=120MB`; `BE/service/isencao/llm/LlmIsencaoProperties.java:74-78` — `maxArquivos = 10; maxTamanhoMb = 20; aceitarApenasPdf = true`; `PSF/isencao/components/isencao/isencao.component.html:98`; `protocolo-backend-novo/src/main/resources/application.properties:30-31` — `max-file-size=50MB`.
**O que ainda falta decidir:** Se imagem continua valendo (a IA não a lê), se o limite de 10 anexos entra na tela, se o servidor passa a validar, e qual é a referência comum com o Protocolo.

### isencao--acompanhamento--2
**Pergunta:** Enviar o documento pedido devolve a solicitação a Aguardando análise.
**Veredito:** RESPONDIDA
**Resposta:** Sim. Qualquer envio de documento põe a solicitação em `PENDENTE_ANALISE` e, se a análise automática estiver ligada, dispara nova rodada da IA. Detalhe: as disciplinas que estavam "pedir documento" **continuam** nesse estado, com o motivo antigo — o sistema não sabe a qual pedido o documento responde.
**Evidência:** `BE/service/isencao/IsencaoService.java:115-122` — `isencao.setSituacao(IsencaoStatus.PENDENTE_ANALISE); ... eventPublisher.publishEvent(new DocumentosIsencaoSubmetidosEvent(...))`.
**O que ainda falta decidir:** Se o documento deve ser ligado à disciplina que o pediu.

### isencao--acompanhamento--3
**Pergunta:** Durante a análise o candidato vê por disciplina só Em análise ou Aguardando documento; Isenta e Não isenta aparecem juntas, no parecer.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** A tela faz exatamente isso. Mas é uma regra de exibição: o `GET /isencao/{fip}`, aberto e sem login, **já devolve** as decisões parciais (`ACEITO`/`RECUSADO`) de cada disciplina antes da conclusão. Quem olhar a resposta da rede vê o parecer antes da hora.
**Evidência:** `FE/candidato-ux/candidato-ux.ts:49-62` — `if (aceita === 'PENDENTE' && (motivo || '').trim()) return 'Aguardando documento'; return 'Em análise';`; `BE/service/isencao/IsencaoService.java:364-365` — `disciplinas.forEach(disciplina -> dto.addDisciplina(new IsencaoDisciplinaDTO(disciplina)))`.
**O que ainda falta decidir:** Se o servidor deve omitir decisões antes de concluir.

### isencao--acompanhamento--4
**Pergunta:** O candidato pode enviar documento sem pedido da coordenação? Pode desistir?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Enviar sem pedido: **pode**. O envio é liberado em `PENDENTE_ANALISE` e em `ANALISADO_COM_PENDENCIA`, ou seja, em qualquer momento antes da conclusão (o SDD chama de "reupload permitido se não CONCLUIDO"). Desistir: **não há** — não existe endpoint, botão nem estado de cancelamento; a busca por "desist" e "cancel" na página do candidato não trouxe nada.
**Evidência:** `FE/utils/isencao-ui.ts:3-5` — `return status === 'PENDENTE_ANALISE' || status === 'ANALISADO_COM_PENDENCIA';`; `SDD/13-matriz-equivalencia.md:21` — "Reupload | permitido se não CONCLUIDO".
**O que ainda falta decidir:** Se a desistência vai existir e o que ela faz com a inscrição (que fica `PENDENTE` por causa do pedido).

### isencao--resultado--1
**Pergunta:** "Não isenta" sempre vem com o motivo.
**Veredito:** RESPONDIDA
**Resposta:** O sistema não faz isso. "Não isentar" não tem campo de motivo, e o servidor não grava nada ao recusar. A tela do candidato até mostra um motivo em disciplina recusada "quando informado", mas o único texto que pode aparecer ali é **o motivo do pedido de documento anterior**, que o servidor não apaga quando a disciplina passa de "pedir documento" para "não isenta". Some-se a isso que disciplina sem decisão aparece como "não isenta" sem motivo algum.
**Evidência:** `BE/service/isencao/IsencaoService.java:207-208` — `else if ("RECUSADO".equals(...)) { isencaoDisciplina.setSituacao(RECUSADO); }` (não toca em `alteracao`); `FE/pages/candidato/candidato-isencao.page.html:268-269` — `@if (concluido() && d.aceita === 'RECUSADO' && d.motivo)`; `FE/candidato-ux/candidato-ux.ts:105` — "o motivo de cada uma, quando informado".
**O que ainda falta decidir:** Confirmar a proposta exige campo novo e obrigatoriedade no servidor.

### isencao--resultado--2
**Pergunta:** O candidato pode recorrer do parecer? Por onde e em que prazo.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há recurso em lugar nenhum do módulo: nenhum endpoint, estado, campo ou texto. A busca por "recurso" nos SDD, ADR, README e na página do candidato não trouxe nada.
**Evidência:** `BE/web/controller/IsencaoController.java:39-136` — os endpoints são atividade, criar, consultar, avaliar, notificar, matrizes, upload, download e as duas filas.
**O que ainda falta decidir:** A pergunta inteira. Não procurei regimento ou manual acadêmico fora dos repositórios.

### isencao--resultado--3
**Pergunta:** A isenção concedida entra sozinha no histórico ou alguém a lança no SIGU.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Há um caminho automático, **na matrícula**, mas o que ele faz por dentro não está em nenhum repositório. O módulo de isenção grava a decisão só em `processoseletivo.isencaodisciplina` e põe a inscrição em `APROVADO`; não escreve no acadêmico. Quem faz a ponte é a matrícula do ingressante (`secretaria-virtual-backend`): como último passo do cadastro do aluno — depois de matrícula, contrato, financeiro e e-mail — ela chama a função de banco `academico.fn_Isencao_disciplinas(oidformaingressopessoa)`. O corpo dessa função não está versionado (a busca pelo nome em todos os repositórios só acha a chamada), então **é inferência, não leitura**, que ela copie as disciplinas `ACEITO` para `academico.isencao`. O que foi lido: o histórico do SIGU monta "ISENTO" (situação `007`, sigla "ISE") a partir de `academico.isencao`, tabela própria, com disciplina da matriz, matrícula, IES e disciplina de origem; a disciplina isenta é bloqueada na escolha de disciplinas pelo SIGU; e existe no SIGU a tela de lançamento manual ("Nova isenção"), além de um fluxo separado para aluno já matriculado.
**Evidência:** `secretaria-virtual-backend/src/main/java/br/edu/candidomendes/saladematricula/constants/Querys.java:201-203` — `SELECT * FROM academico.fn_Isencao_disciplinas(:oidformaingressopessoa);`; `.../saladematricula/service/impl/AlunoServiceImpl.java:164-166` — `this.formaIngressoPessoaService.applicarIsencoes(...)`; `BE/service/isencao/IsencaoService.java:226-230`; `sigu_2-0/Domain-EJB/ejbModule/br/ucam/campos/domain/services/Constantes.java:137` — `ISENTO = "007"`. Não conferidos por mim, relatados pelo levantamento paralelo: `sigu/DomainEJB/.../repositorio/RepositorioAluno.java:3333-3334` (histórico lê `academico.isencao`), `sigu_2-0/SIGU-WEB/WebContent/paginas/disciplina/isencao.xhtml:24` (lançamento manual), `sigu/DomainEJB/.../regras/academicas/RegrasAcademicas.java:97` (bloqueio na matrícula).
**O que ainda falta decidir:** Pedir ao DBA o corpo de `academico.fn_Isencao_disciplinas` — sem ele não se sabe o que entra (só `ACEITO`? com IES, disciplina de origem e carga?), em que matriz, e o que acontece se a análise for concluída ou alterada **depois** da matrícula (a função só roda no cadastro do ingressante; não vi nova chamada). Isso decide também o limite da reabertura (`consulta--2`).

### isencao--resultado--4
**Pergunta:** Onde e como a coordenação registra o motivo de cada "Não isenta".
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje não registra: confirma o que o DS apontou. O que existe e pode servir: (1) a coluna `alteracao` de `isencaodisciplina`, já exposta como `motivo` e já lida pela tela do candidato em disciplina recusada, usada hoje só para o pedido de documento (até 300 caracteres no campo); (2) a sugestão automatizada guarda `justificativa` e um `observacaodecisao`, mas o candidato não vê nada da IA.
**Evidência:** `BE/web/dto/isencao/CursoDisciplinaDTO.java:30` — `this.motivo = isencaoDisciplina.getAlteracao();`; `FE/pages/admin/admin-isencao.shell.html:476` — `maxlength="300"` no campo do documento pedido; `BE/service/isencao/IsencaoAnaliseIaService.java:221` — `sugestao.setObservacaodecisao(request.getObservacao());`.
**O que ainda falta decidir:** Texto livre ou lista de motivos; se reaproveita `alteracao` (misturando dois significados) ou ganha coluna própria; se a justificativa da IA pode ser o ponto de partida.

### isencao--matrizes--1
**Pergunta:** A matriz é mantida no SIGU e só lida pela isenção, ou a isenção pode cadastrar e corrigir matrizes.
**Veredito:** RESPONDIDA
**Resposta:** Só lida. A isenção consulta as tabelas do acadêmico (`academico.matrizcurricular`, `matrizunidadecurso`, `disciplinamatriz`, `disciplina`) por SQL e não tem nenhum endpoint de escrita de matriz. A única coisa que ela grava é qual matriz foi usada na análise (`isencao.codigomatriz`). A tela "Matrizes" do v2 é uma visão das matrizes dos cursos que têm solicitação.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:76-87` — `FROM academico.matrizcurricular mc INNER JOIN academico.matrizunidadecurso muc ...`; `SDD/05-banco.md:9` — "Leituras acadêmicas: `academico` (matriz, disciplina, formaingresso, etc.)"; `BE/service/isencao/IsencaoService.java:231`.
**O que ainda falta decidir:** Nada de regra; a tela não deve oferecer edição.

### isencao--matrizes--2
**Pergunta:** Quais disciplinas da matriz entram: a matriz inteira ou só as marcadas como passíveis de isenção.
**Veredito:** RESPONDIDA
**Resposta:** A matriz inteira, com um único filtro: disciplinas ativas (`status = 'A'`) e com **período diferente de 0**. Não existe marcação de "passível de isenção". A exclusão de estágio e TCC acontece só na sugestão da IA (vira "não isentar"), não na lista — a coordenação continua podendo isentá-las à mão. Mostrar só os três primeiros períodos é escolha do desenho, não do sistema.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:50,57` — `dm.status = 'A'` e `AND dm.periodo <> 0`; `BE/service/isencao/llm/SugestaoIsencaoQualidadePolicy.java:52-55` — `"Estágio/TCC não são elegíveis à isenção."`.
**O que ainda falta decidir:** O que são as disciplinas de período 0 (optativas? eletivas?) e se a regra de estágio/TCC deve valer também para a decisão humana.

### isencao--matrizes--3
**Pergunta:** Matriz em extinção continua valendo para quem entrou nela; candidato novo é analisado contra a vigente.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** A segunda metade bate: por padrão a análise usa a matriz "vigente", que o sistema define como **a matriz ativa de maior ano** ligada ao curso naquela unidade. Mas isso é só o padrão: a coordenação pode escolher qualquer outra matriz do curso no seletor (a lista **não filtra por situação da matriz**), e a escolhida fica gravada na solicitação. Não existe o conceito de "em extinção" no módulo — só ativa/inativa e ano. A matriz acadêmica também não tem campo de "em extinção" nem de "vigente": tem `ano`, `datainicio`, `datatermino` e `status`; "vigente" é convenção de consulta, e a matrícula usa outra (ordena por `datainicio`, não por `ano`). Sobre a primeira metade: no acadêmico o vínculo com a matriz fica em cada matrícula (`oidmatrizunidadecurso`), não no aluno — relatado pelo levantamento paralelo, não conferido por mim. Ponto de atenção: a matriz gravada pela coordenação na análise e a matriz que a matrícula recebe vêm de lugares diferentes, e não há código visto que garanta que são a mesma.
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:28-33` — `mc.status = 'A' ... ORDER BY mc.ano DESC LIMIT 1`; `BE/service/isencao/IsencaoService.java:596-597` — "Matriz vigente = ... `mc.status='A'` no unidade-curso, `ORDER BY mc.ano DESC LIMIT 1`"; `IsencaoRepository.java:103-110` (lista de matrizes só exige `muc.status = 'A'`).
**O que ainda falta decidir:** Se a coordenação pode mesmo analisar contra matriz não vigente; como "em extinção" se expressa no SIGU. Ao trocar de matriz, as sugestões da IA deixam de valer (a tela avisa).

### isencao--cursos--1
**Pergunta:** Quem liga a análise automatizada de um curso: a coordenação ou só a secretaria.
**Veredito:** RESPONDIDA
**Resposta:** Ninguém, por curso: essa configuração não existe. A análise automatizada é ligada **para o sistema inteiro** por propriedade do servidor (`analise-automatica-apos-upload`, padrão ligado, e o provedor do modelo), ou seja, por quem implanta — a TI. Do lado da tela, "com IA" é apenas a rota `admin/isencao-ia`. Não há tabela nem endpoint de configuração por curso.
**Evidência:** `application.properties:57` — `ucam.llm.isencao.analise-automatica-apos-upload=${LLM_ISENCAO_ANALISE_AUTOMATICA_APOS_UPLOAD:true}`; `BE/service/isencao/IsencaoService.java:118` — `if (llmIsencaoProperties.getIsencao().isAnaliseAutomaticaAposUpload())`.
**O que ainda falta decidir:** Se a chave por curso deve existir. Se sim, é funcionalidade nova (tabela, endpoint e a decisão de quem a opera).

### isencao--cursos--2
**Pergunta:** Mudar a configuração vale para as próximas solicitações; as que já estão na fila seguem como entraram.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não há configuração por curso, então a proposta não se aplica como está. Para a chave global que existe, o comportamento é quase o proposto, por outro motivo: a IA é disparada **a cada envio de documento**. Uma solicitação já na fila não é reprocessada quando a chave muda, mas passa a seguir a configuração nova no próximo documento que o candidato enviar. Os cortes (70/75/50/10) também são lidos na hora de cada análise; sugestões já gravadas não são recalculadas.
**Evidência:** `BE/service/isencao/IsencaoAnaliseIaAgendador.java:28-31` — `if (!llmIsencaoProperties.getIsencao().isAnaliseAutomaticaAposUpload()) { ... return; }`; `BE/service/isencao/IsencaoAnaliseIaService.java:354-358`.
**O que ainda falta decidir:** A regra para a futura chave por curso, e o que fazer com solicitação antiga que recebe documento novo.

### isencao--cursos--3
**Pergunta:** Um curso pode ter mais de uma coordenação responsável pela isenção, ou só uma.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** A isenção não registra responsável por curso (a coluna "Coordenação" da tela Cursos sai com travessão porque a API não entrega). No acadêmico, coordenador é uma linha de `academico.coordenador` que liga um professor a um `unidadecurso`; o modelo admite **mais de um coordenador por curso** (e o mesmo professor em mais de um curso): a entidade tem o indicador `titular`, datas de ativação e desativação, e a tela de curso do SIGU carrega uma lista de coordenadores e permite adicionar itens. Não há perfil nem permissão específica de "análise de isenção".
**Evidência:** `BE/repository/isencao/IsencaoRepository.java:124-125` — `INNER JOIN academico.coordenador cord ON (prof.oid = cord.oidprofessor AND cord.status = 'A') INNER JOIN academico.unidadecurso uc ON (uc.oid = cord.oidunidadecurso ...)`; `sigu_2-0/Domain-EJB/ejbModule/br/ucam/campos/domain/entities/academico/Coordenador.java:26` — `private Boolean titular;`; `sigu_2-0/SIGU-WEB/src/br/ucam/campos/sigu/web/controller/CursoHelper.java:308,321` (lista e `addItemCoordenador`; relatado, não conferido por mim).
**O que ainda falta decidir:** Se "responsável pela isenção" é qualquer coordenador do curso, só o titular, ou um papel novo.

---

## Descobertas fora da lista

1. **A solicitação nasce na inscrição, e a forma de ingresso é ambígua.** O pedido é criado quando o candidato marca "isenção" numa inscrição de forma `03` (Transferência) ou `04`. No código da inscrição, `REINGRESSO` e `SEGUNDA_GRADUACAO` têm **o mesmo oid `04`**; o serviço de isenção valida pela descrição (`TRANSFERENCIA` ou `REINGRESSO`). Se a forma `04` tiver descrição de segunda graduação no banco, o legado falha na criação e a inscrição nova cria sem validar. — `INSC/constants/Constantes.java:113-115`; `INSC/dto/PessoaIngressanteDTO.java:43-48`; `BE/service/isencao/IsencaoService.java:55,71`.

2. **A isenção trava e destrava a inscrição.** Pedir isenção deixa a inscrição `PENDENTE`; o primeiro envio de documento a leva a `CONFIRMADO`; concluir a análise a leva a `APROVADO`. As telas tratam a isenção como processo à parte, mas é ela que aprova o candidato. — `INSC/dto/PessoaIngressanteDTO.java:37-38`; `BE/service/isencao/IsencaoService.java:111-114` e `:226-230`.

3. **Solicitação pode sumir das duas filas.** A fila "em análise" exige inscrição `PENDENTE`/`CONFIRMADO`; a de concluídas exige `APROVADO`/`MATRICULADO`. Se uma concluída voltar a `PENDENTE_ANALISE` (o servidor permite, por upload), ela fica com inscrição `APROVADO` e situação não concluída: não aparece em nenhuma. O mesmo vale para inscrição em outra situação (cancelada, por exemplo). — `BE/repository/isencao/IsencaoRepository.java:257-258` e `:338-339`; `IsencaoService.java:115-117`.

4. **A página do candidato não tem login: a URL é a credencial.** Quem tem o `oidFormaIngressoPessoa` vê nome, e-mail, curso, documentos e decisões, baixa anexos e envia arquivos. Os endpoints de avaliação seguem a mesma lógica: sem autenticação nem perfil. — `SDD/03-telas-e-fluxos.md:100-103`; `BE/web/controller/IsencaoController.java:52-55,93-101`.

5. **Não há autoria real.** O avaliador gravado é o texto fixo "sistema" (nas decisões por sugestão) ou `"NULL"` (no evaluate); a linha do tempo grava o papel "Coordenação" sem nome. Não dá para saber quem isentou o quê. — `BE/service/SecurityUtilService.java:8-10`; `BE/service/isencao/IsencaoService.java:195`; `:177-183` (ator `null`).

6. **Disciplina cursada há mais de 10 anos não é sugerida para isenção.** Regra de negócio com cara de norma acadêmica, existente só na IA (a decisão humana não é barrada) e configurável por ambiente. As telas não a mencionam. — `BE/service/isencao/llm/SugestaoIsencaoQualidadePolicy.java:21,58-66`; `application.properties:56`.

7. **Estágio e TCC nunca são sugeridos para isenção** ("não são elegíveis à isenção"), detectados pelo nome da disciplina de origem ou de destino. Também só na IA. — `SugestaoIsencaoQualidadePolicy.java:52-55,123-137`.

8. **Isentar exige três dados que viram o registro oficial:** disciplina de origem, instituição de origem (IES) e carga horária. Obrigatórios ao finalizar, mas só no front; o servidor grava o que vier. Ao aplicar uma sugestão, os três são preenchidos pela IA (a carga cai para a da disciplina de destino se a de origem faltar). — `FE/utils/isencao-ui.ts:16-29`; `BE/service/isencao/IsencaoAnaliseIaService.java:207-217,258-264`.

9. **"Pedir documento" sem texto é descartado em silêncio.** O servidor só grava a pendência se vier o motivo; no Finalizar, pendência antiga que chega sem motivo vira "não isenta". — `BE/service/isencao/IsencaoService.java:197` e `:209-215`.

10. **O "motivo" que o candidato lê numa recusa pode ser o pedido de documento antigo.** Ao recusar, o servidor não limpa o campo `alteracao`; ao isentar, limpa. — `IsencaoService.java:201-208`; `FE/pages/candidato/candidato-isencao.page.html:268-269`.

11. **A sugestão automatizada vale só para a matriz em que foi feita,** e a matriz escolhida pela coordenação é gravada na solicitação e passa a ser a da próxima análise da IA. Trocar de matriz no meio invalida as sugestões na tela. — `BE/service/isencao/IsencaoAnaliseIaService.java:76-79`; `ISENCAO-IA.md:58`.

12. **Dez anexos por solicitação, contados no total e não por envio;** o 11º é recusado com erro. E a IA só lê PDF até 20 MB, embora o candidato possa mandar imagem. — `BE/service/isencao/IsencaoService.java:89-95`; `BE/service/isencao/extraction/PdfDocumentValidator.java:24-33`.

13. **Unidade EAD enxerga todas as unidades.** Para oid iniciado em `polo`, `semi`, `hibri` ou igual a `unid32`, a fila ignora o filtro de unidade. — `BE/service/UtilService.java:8-16`; `IsencaoService.java:449-458`.

14. **O SIGU tem uma isenção própria, para aluno já matriculado,** com solicitação, anexos e tela de análise (`academico.solicitacaoisencao`), separada desta. São dois processos com o mesmo nome; as telas de referência só cobrem o do ingresso. — `sigu_2-0/Aluno-WEB/src/br/ucam/campos/aluno/web/controller/RequerimentoIsencaoHelper.java`; `sigu_2-0/SIGU-WEB/WebContent/paginas/disciplina/analisesolicitacaoisencao.xhtml` (arquivos localizados, não lidos por inteiro).

    Junto com isto: **a ponte para o histórico é uma função de banco sem código-fonte nos repositórios** (`academico.fn_Isencao_disciplinas`), chamada uma única vez, no cadastro do ingressante. Tudo o que as telas disserem sobre "entra no histórico" depende dela. — `secretaria-virtual-backend/.../saladematricula/constants/Querys.java:201-203`.

15. **O v2 deixou de avisar o candidato.** O legado mandava um e-mail (genérico) a cada Salvar e Finalizar; a reescrita não portou o envio e a tela nova diz "não envia e-mail/SMS". É uma regressão em relação à produção antiga, não uma lacuna antiga. — `PSF/admin/isencao/components/isencao/admin-isencao.service.ts:257-260`; `SDD/17-auditoria-backend-rewrite.md:81`.

Fora da contagem, vale o aviso: **a documentação promete validações que o código não faz.** O SDD diz que o upload "valida PDF/tamanho/qtd" e que a avaliação final "exige campos em isentas"; no servidor só a quantidade é validada no upload, e a exigência de campos é do front. Quem ler só o SDD vai superestimar o servidor. — `SDD/04-regras-negocio.md:46,57` contra `BE/service/isencao/IsencaoService.java:83-110,187-234`.
