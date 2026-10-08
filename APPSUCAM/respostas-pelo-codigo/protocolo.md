# Sistema de Protocolo: respostas pelo código do servidor (54 perguntas)

Leitura feita em 06/10/2026, nos clones de `C:\Users\Leonardo\Documents\UCAM-repos\`.

**Abreviações de caminho**

- `BE/` = `protocolo-backend-novo/src/main/java/br/ucam/campos/dti/protocolo/`
- `FE/` = `protocolo-frontend-novo/src/app/`
- `S2/` = `sigu_2-0/` (Portal do Aluno em `Aluno-WEB`, protocolo legado em `PROTOCOLO-WEB` e `Domain-EJB`)
- `S1/` = `sigu/` (acadêmico legado)

**Cobertura.** Li por inteiro o código Java do `protocolo-backend-novo` (186 arquivos, cerca de 9.500 linhas: controllers, services, entidades, repositórios com consulta, enums, configurações, `build.gradle`, os cinco `application*.properties`, `kubernetes/`). Do Portal do Aluno (`S2/Aluno-WEB`) li `RequerimentoNovoHelper.java`, `requerimentonovo.xhtml` e o cliente REST `ProtocoloClient.java`/`ProtocoloPost.java`. Do legado li por busca (não por inteiro) `S1/DomainEJB/.../RepositorioProtocolo.java`, `SendNotificationRequerimento.java`, `S2/Domain-EJB/.../RequerimentoService.java`, `NotificacaoBuilder.java` e `S1/Sigu/WebContent/sisacad/analiserequerimento/analiserequerimento.xhtml`. Do front conferi os pontos citados.

**O que não existe nos repositórios.** Nenhum script SQL, migração (Flyway/Liquibase) nem `ddl-auto` no backend: o esquema do banco não está versionado, só as entidades JPA. O `README.md` do backend tem uma linha ("# Modulo Protocolo"). Não há manual em `.md`, `.pdf` ou `.docx` em nenhum dos repositórios pedidos; o único manual é um link externo (`FE/paginas/requerimentos/requerimento/requerimento.component.html:64` → `https://services.ucam-campos.br/arquivos/manuais/manual-protocolo.pdf`), que não li. `integracao-api`, `backend-util` e `email-smtp-ucam-backend` não têm nenhuma referência a requerimento, e o backend do Protocolo não chama nenhum deles (não há dependência de e-mail no `build.gradle`).

**Contagem:** 33 RESPONDIDA · 11 RESPONDIDA EM PARTE · 10 NÃO ESTÁ NO CÓDIGO.

---

### protocolo--analise-requerimento--1
**Pergunta:** A caixa tem quatro recortes da mesma fila: Aguardam você, Minha pauta, Encaminhados e Concluídos (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema atual já tem exatamente quatro filas, cada uma com uma consulta e uma contagem próprias no servidor. (1) Caixa de entrada: o que aguarda alguém do meu setor × unidade × nível (ver pergunta 2). (2) Minha pauta: requerimentos em que o despacho aberto é um "LOCK" ou uma "resposta" feitos por mim. (3) Encaminhados: requerimentos ainda não concluídos cujo despacho aberto (que não seja LOCK nem resposta) foi feito por alguém do meu setor × unidade. (4) Concluídos: DEFERIDO ou INDEFERIDO das naturezas atendidas pelo meu setor × unidade. Não são partições de uma mesma lista: um requerimento com "resposta" aberta aparece em Minha pauta de quem respondeu e também na Caixa de entrada do setor.
**Evidência:** `BE/resource/AnaliseRequerimentoController.java:106-145` (os quatro `GET`) e `:224-245` (as quatro contagens) — `@GetMapping(path = "/v2/search/aguardando/analise"...)`, `"/search/concluidos"`, `"/search/encaminhados"`, `"/search/analisando"`. Minha pauta: `BE/repository/QueryRequerimento.java:130-131` — `and d.tipo in ('LOCK', 'resposta') and d.analisado = false`. Encaminhados: `:228-230` — `d.tipo not in ('LOCK', 'resposta') ... req.estado not in ('DEFERIDO', 'INDEFERIDO')`.
**O que ainda falta decidir:** Só os nomes ("Aguardam você" × "Caixa de entrada").

### protocolo--analise-requerimento--2
**Pergunta:** O que põe um requerimento em "Aguardam você": distribuição automática, setor, unidades, ou os três.
**Veredito:** RESPONDIDA
**Resposta:** Não existe distribuição automática: ninguém recebe requerimento; todo integrante vê a fila do setor e "trata" (assume) o que quiser. A caixa de entrada é a união de três consultas:
(a) requerimentos em estado SOLICITADO cuja natureza tem um par setor × unidade cadastrado, em que a unidade é a do requerente e o funcionário tem vínculo nesse mesmo setor e nessa mesma unidade, **e** o nível do tipo de natureza é menor ou igual ao nível do funcionário (com "Nível abaixo do meu" = Sim) ou exatamente igual (= Não). Ficam de fora os requerimentos cujo tipo tem outra pessoa designada na unidade (tabela `pessoatiponaturezarequerimento`);
(b) requerimentos em ANALISANDO com despacho aberto (não analisado, que não seja parecer nem LOCK) endereçado a um setor do funcionário, na unidade do requerente, com nível do funcionário maior ou igual (ou igual) ao nível gravado no despacho;
(c) requerimentos SOLICITADO de um tipo de natureza em que o próprio funcionário está designado como responsável, na unidade do requerente.
Ou seja: setor **e** unidade **e** nível, juntos, mais a designação pessoal por tipo.
**Evidência:** `BE/repository/QueryRequerimento.java:306-409` (consulta `QUERY_AGUARDANDO_ANALISE_PAGINADOV2`); trechos: `:343` `snr.oidsetor || up_solicitante.oidunidade = nvf.setor_unidade`; `:345-347` `( :nivel = 'abaixo' and tnr.nivel <= nvf.nivel ) or ( :nivel = 'iqual' and tnr.nivel = nvf.nivel )`; `:358` `req.oid not in (select * from requerimentos_tipo_pessoa)`; `:382-386` `dp.nivel_pessoa >= dp.nivel_despacho ... up_solicitante.oidunidade = dp.unidade_despachante`; `:400-409` (designados). Estado fixado em `BE/service/search/RequerimentoSearch.java:60` — `filter.setEstado("SOLICITADO")`. O front chama este endpoint: `FE/paginas/requerimentos/shared/services/requerimento.service.ts:43`.
**O que ainda falta decidir:** Se a nova tela mantém o modelo "fila do setor + assumir" ou cria distribuição automática (que hoje não existe em lugar nenhum).

### protocolo--analise-requerimento--3
**Pergunta:** Como se calcula o prazo ("vence em 1 dia", "venceu há 18 dias").
**Veredito:** RESPONDIDA
**Resposta:** O prazo é um número inteiro de dias gravado no **tipo de natureza** (coluna `tiponaturezarequerimento.prazo`), não na natureza nem no setor. Sem valor cadastrado, o servidor devolve 0. O tempo decorrido é contado em **dias corridos** (períodos de 24 h), da data de abertura até agora; se o requerimento está concluído, até a data do despacho de parecer. Não há dias úteis, feriado nem calendário. O servidor entrega os dois números (`prazo` e `tempoDecorrido`) e a tela compara. **Não existe tela para cadastrar o prazo**: nem o formulário do tipo de natureza no front novo, nem as telas legadas do SIGU têm o campo; o valor só entra direto no banco.
**Evidência:** `BE/entity/TipoNaturezaRequerimento.java:30` — `private Integer prazo;`. `BE/business/RequerimentoWrapper.java:221-228` — `prazo = requerimento.getTipoNaturezaRequerimento().getPrazo();` (0 se nulo). `BE/entity/Requerimento.java:197-211` — `long prazo = ChronoUnit.DAYS.between(this.getDataAbertura(), LocalDateTime.now());`. Busca por "prazo" nas telas e entidades de protocolo de `S1/` e `S2/`: nenhuma ocorrência.
**O que ainda falta decidir:** Se o prazo passa a contar em dias úteis (hoje é corrido); onde ele será cadastrado; e qual valor vale quando o tipo não tem prazo (hoje 0 nas filas e 20 dias no Analytics — ver gerencial--2).

### protocolo--analise-requerimento--4
**Pergunta:** O que é "urgente" na ordenação por urgência.
**Veredito:** RESPONDIDA
**Resposta:** Urgente é uma marca sim/não no requerimento, ligada e desligada à mão por qualquer funcionário; não é calculada pelo prazo nem vem da natureza. Ligar e desligar ficam no histórico ("Com Urgencia" / "Removida Urgência", com pessoa e hora). O servidor **não ordena por urgência**: todas as filas vêm por data de abertura. O servidor também não impede marcar urgência em requerimento já concluído (quem bloqueia é o front).
**Evidência:** `BE/entity/Requerimento.java:78-79` — `private Boolean urgente = false;`. `BE/resource/RequerimentoController.java:102-122` — `@PatchMapping("/{oid}/urgencia")`. `BE/service/RequerimentoService.java:477-500` — `adicionarHistoricoRequerimento(requerimento, EventoRequerimentoEnum.URGENTE, oidpessoa)`. Ordenação: `BE/repository/QueryRequerimento.java:65`, `:120`, `:154`, `:204` (`order by req.dataabertura`).
**O que ainda falta decidir:** Se "Mais urgentes" na tela nova significa "marcados como urgente primeiro" (dá para fazer com o dado atual) ou "prazo mais apertado primeiro" (também dá, com `prazo − tempoDecorrido`); e quem pode marcar.

### protocolo--analise-requerimento--5
**Pergunta:** Quem pode concluir e quem pode encaminhar, por nível do integrante.
**Veredito:** RESPONDIDA
**Resposta:** O nível **não libera nem bloqueia** concluir ou encaminhar. A única condição do servidor é de vínculo: para concluir, o funcionário (na unidade informada) precisa ser integrante do setor enviado no corpo da requisição — senão recebe "Funcionário não está associado ao setor destino."; para encaminhar, precisa ser integrante do setor em que o requerimento está (sem o vínculo a operação falha com erro genérico). Qualquer nível 1, 2 ou 3 que enxergue o requerimento pode fazer as duas coisas. Não há autenticação nem papel no servidor (ver requerimento-detalhe--2).
**Evidência:** `BE/service/RequerimentoService.java:172-179` — `if (setorpessoa == null) throw new ServiceException("Funcionário não está associado ao setor destino.");`. Encaminhar: `:144-146` — `SetorPessoa setorPessoa = findSetorPessoa(oidSetor, oidUnidadePessoa); String oidpessoa = setorPessoa.getUnidadePessoa().getOidPessoa();`. Nenhuma comparação de `getNivel()` nesses métodos; a única que existia está comentada (`:270-272`).
**O que ainda falta decidir:** Se a Gestão quer passar a restringir por nível (seria regra nova).

### protocolo--analise-requerimento--6
**Pergunta:** Encaminhar muda a situação para Encaminhado; concluir fecha como Deferido ou Indeferido (proposta).
**Veredito:** RESPONDIDA
**Resposta:** A segunda metade é o que o sistema faz: concluir grava o estado DEFERIDO ou INDEFERIDO, registra o evento no histórico e cria um despacho do tipo "parecer". A primeira metade **não**: não existe estado "Encaminhado". O requerimento tem só quatro estados (SOLICITADO, ANALISANDO, DEFERIDO, INDEFERIDO). Encaminhar cria um despacho do tipo "informacao" (ou "reencaminhar") com setor e nível de destino, marca o despacho anterior como analisado e, se o requerimento estava SOLICITADO, passa para ANALISANDO. "Encaminhado" é um rótulo derivado do tipo do último despacho.
**Evidência:** `BE/entity/EstadoRequerimentoEnum.java:5-8`. `BE/resource/AnaliseRequerimentoController.java:193-197` — `encaminharRequerimento(..., Constantes.REQUERIMENTO.TIPO_REQUERIMENTO_INFORMACAO)`. `BE/service/RequerimentoService.java:73-81` (SOLICITADO → ANALISANDO) e `:181-205` — `requerimento.setEstado(EstadoRequerimentoEnum.DEFERIDO.equals(estado) ? DEFERIDO : INDEFERIDO); ... despacho.setTipo(TIPO_REQUERIMENTO_PARECER)`. Rótulo: `BE/business/RequerimentoWrapper.java:243-248`.
**O que ainda falta decidir:** Se "Encaminhado" vira estado de verdade ou continua sendo rótulo sobre ANALISANDO. Atenção: "Concluído" também não é estado; é sempre Deferido ou Indeferido.

### protocolo--analise-requerimento--7
**Pergunta:** Responder ao aluno muda a situação para Aguardando aluno?
**Veredito:** RESPONDIDA
**Resposta:** Não. "Aguardando aluno" não existe. Responder cria um despacho do tipo "resposta", aberto (não analisado), e só mexe no estado se o requerimento ainda estava SOLICITADO (aí vira ANALISANDO). O requerimento continua na Minha pauta de quem respondeu. E o aluno **não tem como responder de volta**: o Portal do Aluno só lista, vê o histórico e abre requerimento novo; não há endpoint de réplica.
**Evidência:** `BE/service/RequerimentoService.java:328-339` — `despacho.setTipo(Constantes.REQUERIMENTO.TIPO_REQUERIMENTO_RESPOSTA); despacho.setAnalisado(false);`. Minha pauta inclui "resposta": `BE/repository/QueryRequerimento.java:131`. Portal: `S2/Domain-EJB/ejbModule/br/ucam/campos/domain/rest/ProtocoloClient.java:42-56` (só `search`, `POST requerimento`, upload e `DELETE` de anexo).
**O que ainda falta decidir:** Se haverá o estado "Aguardando aluno" e, antes disso, se o aluno poderá responder (hoje o caminho de volta é abrir outro requerimento).

### protocolo--analise-requerimento--8
**Pergunta:** Por quanto tempo Concluídos continua consultável na caixa.
**Veredito:** RESPONDIDA
**Resposta:** Sem limite. A consulta de Concluídos não tem corte de data: traz todo requerimento DEFERIDO ou INDEFERIDO das naturezas do setor × unidade do funcionário, respeitado o nível, paginado, do mais novo para o mais antigo. Data só entra se o usuário filtrar.
**Evidência:** `BE/repository/QueryRequerimento.java:173-204` — `and req.estado in :estados and ( :dataInicial = 'null' or req.dataabertura >= ...)` ... `order by req.dataAbertura desc`. Estados: `BE/resource/dto/RequerimentoFilter.java:73-77`.
**O que ainda falta decidir:** Política de retenção (não há nenhuma hoje).

### protocolo--analise-requerimento--13
**Pergunta:** A tela encaminha só com o setor. O nível e o despacho entram no diálogo, ou o nível deixa de ser escolhido.
**Veredito:** RESPONDIDA
**Resposta:** No sistema atual o encaminhamento leva quatro coisas: setor de destino, **nível de destino (1 a 3)**, texto do despacho e anexo opcional. O nível não é enfeite: ele decide quem, no setor de destino, enxerga o requerimento — só quem tem nível maior ou igual ao do despacho (com "Nível abaixo" = Sim) ou exatamente igual (= Não). Se a tela nova mandar só o setor, o nível vai gravado como 0 (o campo é `int` sem valor padrão): todo o setor de destino enxerga com "Nível abaixo" = Sim, e **ninguém** enxerga com "Nível abaixo" = Não. O servidor não valida nenhum dos campos (texto vazio e nível 0 passam).
**Evidência:** `BE/entity/Despacho.java:24-30` — `private String descricao; ... private int nivel;`. `BE/repository/QueryRequerimento.java:382-384` — `( :nivel = 'abaixo' and dp.nivel_pessoa >= dp.nivel_despacho ) or ( :nivel = 'iqual' and dp.nivel_pessoa = dp.nivel_despacho )`. Envio do front: `FE/paginas/requerimentos/requerimento/dialog/encaminhar-requerimento-dialog/encaminhar-requerimento-dialog.component.ts:297` e `:307`.
**O que ainda falta decidir:** Quem define o nível de destino. Enquanto o servidor for este, o diálogo precisa enviar setor, nível e texto.

### protocolo--analise-requerimento--14
**Pergunta:** Quem pode reabrir um requerimento concluído, até quando, e se o requerente é avisado.
**Veredito:** RESPONDIDA
**Resposta:** Quem: qualquer integrante do setor que deu o parecer (na unidade do vínculo), de qualquer nível. A restrição "só nível 3" existia e está **comentada** no servidor; no SIGU legado o botão Reabrir só aparecia para o "master" (nível ≥ 3 no setor da natureza). Até quando: sem prazo. Efeito: o estado volta para ANALISANDO, o histórico ganha um evento "Analisando" e é criado um despacho LOCK em nome de quem reabriu (o requerimento cai na Minha pauta dele). O parecer anterior continua na linha do tempo. Aviso: **nenhum** — o servidor novo não envia e-mail nem notificação em evento algum; o aluno só percebe se abrir o Portal e vir o estado "Analisando". (O protocolo legado do SIGU 2.0 gravava uma notificação "O seu requerimento N foi Atualizado." no portal a cada evento; isso não foi levado para o backend novo.)
**Evidência:** `BE/service/RequerimentoService.java:270-272` — `// if (setorpessoa.getNivel() < 3) { throw new ServiceException("Seu nível no setor ... é insuficiente para esse operação."); }`; `:274-295` — `requerimento.setEstado(EstadoRequerimentoEnum.ANALISANDO); ... dp.setTipo(TIPO_REQUERIMENTO_LOCK)`. Legado: `S1/Sigu/WebContent/sisacad/analiserequerimento/analiserequerimento.xhtml:320-321` — `rendered="#{(... 'DEFERIDO' || ... 'INDEFERIDO') and requerimento.master}"`; `S1/DomainEJB/ejbModule/br/ucam/campos/dti/repositorio/RepositorioProtocolo.java:312-313` — `if(setorpessoa.getNivel() >= 3){ reqDTO.setMaster(true);`. Notificação legada: `S2/Domain-EJB/ejbModule/br/ucam/campos/domain/services/requerimento/RequerimentoService.java:310`.
**O que ainda falta decidir:** Se a reabertura volta a ser só do nível 3; se há prazo; e por qual canal o aluno é avisado (hoje nenhum).

### protocolo--requerimento-detalhe--1
**Pergunta:** Todo requerimento tem endereço próprio, que se pode mandar a um colega (proposta).
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O servidor já entrega um requerimento pelo identificador (detalhe e linha do tempo), então a proposta é viável sem mudar o backend. A tela atual é que não tem URL por requerimento (o front guarda o requerimento aberto em memória). O identificador é o `oid` (UUID), não o número do protocolo.
**Evidência:** `BE/resource/RequerimentoController.java:36-39` — `@GetMapping(path = "/{oid}/detalhado")` e `:124-127` — `@GetMapping(value = "{oid}/timeline")`.
**O que ainda falta decidir:** Se o endereço usa o `oid` ou o número; e a regra de quem pode abri-lo (pergunta seguinte).

### protocolo--requerimento-detalhe--2
**Pergunta:** Quem pode abrir o endereço de um requerimento.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje o servidor não restringe nada: não há autenticação nem autorização no backend do Protocolo (sem Spring Security, CORS liberado para qualquer origem). Quem tiver o `oid` lê o requerimento, a linha do tempo e baixa anexos; a Pesquisa e o Gerencial devolvem nome, CPF e descrição de requerimentos de todas as unidades. Existe uma classe "validador de acesso" que nunca foi implementada nem é chamada. O que é indício: em produção a API fica atrás de `api.candidomendes.edu.br/protocolo`; se esse gateway exige token, não está nestes repositórios (o front não envia `Authorization`).
**Evidência:** `protocolo-backend-novo/build.gradle:38-62` (nenhuma dependência de segurança); `protocolo-backend-novo/src/main/java/br/ucam/campos/dti/ProtocoloApplication.java:45-47` — `config.addAllowedMethod("*"); config.addAllowedOrigin("*");`; `BE/service/AcessoValidade.java:11-14` — `public boolean isAcessoPessoaRequerimento(...) { return false; }` (sem uso). CPF na resposta do Gerencial: `BE/repository/QueryRequerimento.java:248-251`.
**O que ainda falta decidir:** A regra em si (setor responsável, qualquer integrante, quem tem o link) — e, antes, quem vai aplicá-la, porque hoje nenhuma camada do código aplica. É ponto para o Encarregado de dados.

### protocolo--requerimento-detalhe--3
**Pergunta:** Mudança de situação registrada como par DE → PARA, com autor e hora, e linha do tempo que não se edita (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz em parte. Cada mudança grava no histórico o **novo** estado, a pessoa e a hora — não grava o estado anterior (o "DE" teria de ser deduzido do evento anterior). A coluna `setor` do histórico existe e nunca é preenchida. O par DE → PARA existe só para tramitação entre setores (despachos "informacao" e "reencaminhar": de pessoa/setor/unidade para setor). Imutabilidade: não é garantida — a aplicação não oferece edição, mas os repositórios de histórico e de despacho estão expostos como recurso REST genérico (aceitam alteração e exclusão), sem controle de acesso.
**Evidência:** `BE/entity/HistoricoRequerimento.java:16-36` (`data`, `estado`, `oidPessoa`, `setor`); `BE/repository/HistoricoRequerimentoRepository.java:41-43` — `VALUES(:oid, :data, :oidRequerimento, 'A', :estado, null, :oidPessoa)`; `BE/business/EventoTimeline.java:25` e `:35-41` — `TIPOS_DESPACHO_DE_PARA = Arrays.asList("informacao", "reencaminhar")`; exposição: `BE/repository/HistoricoRequerimentoRepository.java:18` — `@RepositoryRestResource(path = "historico", ...)`.
**O que ainda falta decidir:** Se o servidor passa a gravar o estado anterior e a fechar a edição do histórico.

### protocolo--requerimento-detalhe--4
**Pergunta:** Editar os dados do requerimento é um evento na linha do tempo com cada mudança dentro dele (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema atual não trata: não existe edição de requerimento na aplicação, nem tipo de evento "editou". O único dado que muda depois do envio e fica registrado é a urgência. Os sete eventos do histórico são: Solicitado, Analisando, Deferido, Indeferido, Com Urgencia, Designado, Removida Urgência.
**Evidência:** `BE/entity/EventoRequerimentoEnum.java:5-11`; `BE/resource/RequerimentoController.java:84-122` (só criar e urgência); `BE/repository/handler/RequerimentoEventHandler.java:20-28` (o único gatilho de gravação registra só a urgência).
**O que ainda falta decidir:** Se haverá edição; se houver, é funcionalidade nova no servidor (evento, DE → PARA por campo).

### protocolo--requerimento-detalhe--5
**Pergunta:** Quem pode editar os dados de um requerimento já enviado, e quais campos.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Pela aplicação, ninguém edita nada além da urgência (qualquer funcionário) e do que se acrescenta por despacho. Não há regra de permissão escrita. O que é indício de risco: o recurso REST genérico `requerimento` aceita alteração direta por quem chamar a API, sem checagem.
**Evidência:** `BE/repository/RequerimentoRepository.java:16-21` — `@RepositoryRestResource(path = "requerimento", ...)`; ausência de `PUT`/`PATCH` de dados em `BE/resource/RequerimentoController.java`.
**O que ainda falta decidir:** Tudo: quem, quais campos (natureza? setor? prazo? prioridade?) e até que estado.

### protocolo--requerimento-detalhe--6
**Pergunta:** O andamento tem etapas ("Etapa 2 de 4"); quais são as etapas de cada natureza (proposta).
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há conceito de etapa. O andamento é o estado (4 valores) mais a sequência livre de despachos; o servidor monta um "caminho" que é só a lista dos setores por onde o requerimento passou, sem roteiro previsto nem total de etapas. Procurei em todas as entidades e enums do backend e nas entidades de protocolo de `S1/` e `S2/`.
**Evidência:** `BE/business/RequerimentoWrapper.java:184-195` — `.collect(Collectors.joining(" > "))` (caminho percorrido, não planejado); `BE/entity/TipoNaturezaRequerimento.java:19-45` (campos do tipo: descrição, nível, máximo de solicitações, observação, prazo, explicação).
**O que ainda falta decidir:** Se existem etapas por natureza e quais; hoje a tramitação é livre.

### protocolo--requerimento-detalhe--11
**Pergunta:** A tela encaminha só com o setor. O nível e o despacho entram no diálogo, ou o nível deixa de ser escolhido.
**Veredito:** RESPONDIDA
**Resposta:** Mesma resposta de `protocolo--analise-requerimento--13`: o servidor espera setor, nível de destino (1–3), texto e anexo opcional; o nível define quem enxerga no destino; sem nível grava 0 e o requerimento some para quem filtra "nível igual ao meu".
**Evidência:** `BE/entity/Despacho.java:30` — `private int nivel;`; `BE/repository/QueryRequerimento.java:382-384`.
**O que ainda falta decidir:** Quem define o nível de destino.

### protocolo--requerimento-detalhe--12
**Pergunta:** Quem pode reabrir um requerimento concluído, até quando, e se o requerente é avisado.
**Veredito:** RESPONDIDA
**Resposta:** Mesma resposta de `protocolo--analise-requerimento--14`: qualquer integrante do setor do parecer, sem limite de tempo, sem aviso ao requerente; a trava de nível 3 está comentada.
**Evidência:** `BE/service/RequerimentoService.java:212-299` (método `reabrirRequerimento`), trava comentada em `:270-272`.
**O que ainda falta decidir:** Nível mínimo, prazo e canal de aviso.

### protocolo--gerencial--1
**Pergunta:** A carga do setor é medida contra a capacidade declarada em Parâmetros dos setores (proposta).
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O sistema não trata. O setor tem um único campo, o nome. Não há capacidade, nem tabela de parâmetros de setor (a tabela `configuracao` é genérica recurso/valor e guarda caminhos de arquivo). O Gerencial atual só lista requerimentos por setor com prazo e dias decorridos. Procurei em `BE/entity/`, `BE/repository/` e nas entidades `Setor` de `S1/` e `S2/`.
**Evidência:** `BE/entity/Setor.java:18-26` — `private String descricao;` e a lista de integrantes; `BE/util/Constantes.java:25-28` (chaves de configuração: `ARQUIVOS`, `MEMORIAL`, `IMAGENS_EMAIL`).
**O que ainda falta decidir:** Se a capacidade existe como conceito e quem a declara.

### protocolo--gerencial--2
**Pergunta:** O que conta como "atrasado": passou do prazo da natureza ou do SLA alvo do setor.
**Veredito:** RESPONDIDA
**Resposta:** Atrasado é ter mais dias corridos desde a abertura do que o prazo do **tipo de natureza**. Não existe SLA de setor. No Gerencial o servidor devolve `prazo` e `vencimento` (dias inteiros desde a abertura) e a tela conta "fora do prazo" quando `vencimento > prazo`, com prazo nulo valendo 0 (logo, tipo sem prazo fica atrasado no segundo dia). Há outras duas medidas no servidor: "em espera" no Analytics = SOLICITADO há mais dias do que o prazo, com **20 dias** quando o tipo não tem prazo; e `emEspera` na fila = último despacho há mais de **7 dias**.
**Evidência:** `BE/repository/QueryRequerimento.java:250` e `:254` — `tpn.prazo AS prazo ... DATE_PART('day', now() - rq.dataabertura) as vencimento`; `FE/paginas/gerencial/gerencial/page/page.component.ts:242-243` — `const prazo = requerimento.prazo == null ? 0 : parseInt(requerimento.prazo); return requerimento.vencimento > prazo;`; `BE/repository/AnalyticsRepository.java:27-28` — `> coalesce(t.prazo, 20)`; `BE/business/RequerimentoWrapper.java:209-215` — `despacho.getData().isBefore(local.minusDays(7))`.
**O que ainda falta decidir:** Unificar as três réguas (0, 20 dias, 7 dias) e decidir se o SLA de setor passa a existir.

### protocolo--gerencial--3
**Pergunta:** Como se calcula o SLA médio.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há cálculo de tempo médio em lugar nenhum. O dado para calculá-lo existe (abertura e data do despacho de parecer; o servidor já devolve `tempoDecorrido` congelado na conclusão), mas nenhuma consulta faz média. Procurei em `BE/repository/AnalyticsRepository.java`, `IndiceRepository.java`, `QueryRequerimento.java` e `Querys.java`.
**Evidência:** `BE/entity/Requerimento.java:198-205` — para concluídos, `ChronoUnit.DAYS.between(this.getDataAbertura(), opDespacho.get().getData())` (o insumo existe; a média não).
**O que ainda falta decidir:** A definição inteira: sobre quais requerimentos e em qual janela.

### protocolo--gerencial--4
**Pergunta:** Quem vê o painel.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O código não tem papel nem perfil para o Gerencial: o endpoint `/gerencial` responde a qualquer chamada, de qualquer setor e unidade, e a rota do front só exige estar autenticado. Quem vê é decidido fora do Protocolo, no cadastro de menus da aplicação `aplicProtocoloNovo` no sistema Gerencial (quem recebe o item de menu, vê). Quais perfis recebem esse item hoje é dado do banco do Gerencial, não está nos repositórios.
**Evidência:** `BE/resource/GerencialController.java:32-59` (sem checagem de pessoa; unidades e setores vazios viram `"TODOS"`).
**O que ainda falta decidir:** A lista de perfis (coordenação, gestão, reitoria) e se a coordenação vê só o próprio setor — hoje o servidor não consegue restringir.

### protocolo--analytics--1
**Pergunta:** Toda variação diz contra qual período está sendo comparada (proposta).
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** O sistema não trata: o Analytics devolve só contagens absolutas por estado; não há variação nem período de comparação. Li as três consultas do Analytics inteiras.
**Evidência:** `BE/repository/AnalyticsRepository.java:22-48` (colunas: `livres`, `em_espera`, `analisandos`, `concluidos`, `deferidos`, `indeferidos`, `pendentes`, `realizados`).
**O que ainda falta decidir:** Tudo; é funcionalidade nova.

### protocolo--analytics--2
**Pergunta:** Qual é o período de comparação padrão.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não há comparação, logo não há padrão de comparação. Mas há um padrão de **janela** que a tela de referência não considera: as consultas do Analytics sempre restringem ao **semestre corrente do ano corrente** (janeiro–junho ou julho–dezembro), mesmo quando o usuário escolhe datas — as datas só estreitam dentro do semestre. Isso é indício de que o período natural do negócio é o semestre letivo.
**Evidência:** `BE/repository/AnalyticsRepository.java:46-47` e `:76-77` — `AND div(extract(MONTH FROM a.dataabertura)::int, 7) = div(extract(MONTH FROM NOW())::int, 7) AND extract(YEAR FROM a.dataabertura) = extract(YEAR FROM NOW())`.
**O que ainda falta decidir:** Se a comparação padrão é "semestre anterior" ou "mesmo semestre do ano passado"; e se a trava no semestre corrente é regra ou limitação.

### protocolo--analytics--3
**Pergunta:** Um requerimento conta no mês em que foi aberto ou no mês em que foi concluído.
**Veredito:** RESPONDIDA
**Resposta:** No mês em que foi **aberto**, sempre. Tanto "pendentes" quanto "realizados" são agrupados pelo mês da data de abertura; um requerimento aberto em março e concluído em maio conta como realizado de março. Os filtros de data também agem sobre a abertura.
**Evidência:** `BE/repository/AnalyticsRepository.java:52` — `date_part('month', a.dataabertura) AS mes`; `:64-65` — `... not in ('DEFERIDO','INDEFERIDO') ... AS pendentes, ... in ('DEFERIDO','INDEFERIDO') ... AS realizados`.
**O que ainda falta decidir:** Se a tela nova mantém a visão por coorte de abertura ou passa a contar concluídos no mês da conclusão (o servidor teria de mudar).

### protocolo--analytics--4
**Pergunta:** Quem pode exportar os dados, e se a exportação leva dado pessoal.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe exportação em nenhum endpoint. O Analytics só devolve agregados (sem dado pessoal). O que existe de dado pessoal em massa é o Gerencial/Pesquisa, que devolve nome, CPF, número e descrição, sem controle de acesso no servidor. Procurei por CSV, planilha e relatório no backend: nada.
**Evidência:** `BE/resource/AnalyticsController.java:23-39` (três `GET` de agregados); `BE/repository/QueryRequerimento.java:248-253` — `ps.nome AS nomepessoa, ... ps.cpf AS cpf, ... rq.descricao AS descricao`.
**O que ainda falta decidir:** Tudo; e vale o alerta de que a listagem com CPF já está aberta hoje.

### protocolo--listagem-setores--2
**Pergunta:** A pessoa aparece uma vez no setor, com as unidades dela; não é um vínculo por unidade (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário no dado: o vínculo **é** por unidade. Cada linha de `setorunidadepessoa` liga um setor a uma pessoa-na-unidade e tem o seu próprio nível; a mesma pessoa pode ser nível 3 numa unidade e nível 1 em outra, no mesmo setor. A listagem do servidor vem agrupada por unidade. A apresentação "uma vez, com as unidades como marcadores" é possível (o servidor já tem uma consulta que devolve a pessoa com as unidades agregadas), desde que o nível seja mostrado por unidade.
**Evidência:** `BE/entity/SetorPessoa.java:14-18` — `@Table(name = "setorunidadepessoa") ... @Range(min = 1, max = 3...) private Integer nivel;`; `BE/resource/SetorController.java:59-60` — `Collectors.groupingBy(FuncionarioUnidade::getNomeUnidade)`; agregada: `BE/repository/SetorPessoaRepository.java:61-83`.
**O que ainda falta decidir:** Se o nível continua por unidade (dado atual) ou passa a ser um por pessoa no setor (mudaria o modelo).

### protocolo--listagem-setores--3
**Pergunta:** Uma pessoa pode ser integrante de mais de um setor?
**Veredito:** RESPONDIDA
**Resposta:** Sim. Nada impede, e o sistema conta com isso: as filas trabalham com a **lista** de setores da pessoa, a lateral do front tem "Setores que estou envolvido", e a busca de quem pode entrar num setor só exclui quem já está naquele setor.
**Evidência:** `BE/repository/SetorPessoaRepository.java:35-40` — `select distinct se.oidSetor from SetorPessoa se where se.unidadePessoa.oidPessoa = :oidPessoa`; `BE/resource/dto/RequerimentoFilter.java:53-59`; `BE/repository/PessoaRepository.java:48` — `and (s.oid is null or s.oidsetor <> :oidSetor)`.
**O que ainda falta decidir:** Nada sobre o fato; só se a Gestão quer limitar.

### protocolo--listagem-setores--4
**Pergunta:** Todo setor precisa de coordenação? Pode ter mais de uma pessoa?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** "Coordenação" não existe no modelo: o vínculo tem só o nível (1 a 3). O que há de parecido é indício: no SIGU legado, nível ≥ 3 no setor da natureza marcava o usuário como "master" (podia reabrir). Não há exigência de que o setor tenha alguém de nível 3, nem limite de quantos; setor sem ninguém também é aceito.
**Evidência:** `BE/entity/SetorPessoa.java:17-18`; `S1/DomainEJB/ejbModule/br/ucam/campos/dti/repositorio/RepositorioProtocolo.java:312-313` — `if(setorpessoa.getNivel() >= 3){ reqDTO.setMaster(true);`.
**O que ainda falta decidir:** Se "coordenação" passa a ser um papel próprio ou é o nível 3; obrigatoriedade e quantidade.

### protocolo--naturezas--1
**Pergunta:** Natureza não se exclui; arquivar é reversível: some da escolha do aluno e continua no cadastro (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O servidor já se comporta assim, só que com o nome de "excluir". Toda exclusão é lógica: muda o `status` de 'A' para 'D'. A natureza some da lista do aluno e do cadastro (as consultas pedem status 'A'), os requerimentos continuam apontando para ela e seguem tramitando. Há reversão: salvar de novo um registro com a mesma chave única reativa o antigo. O que falta para a proposta é a tela: não há como listar as arquivadas nem um botão de reativar.
**Evidência:** `BE/repository/generic/SaveAndRestoreRepository.java:39-44` — `@Query("update #{#entityName} e set e.status='D' where e.oid = ?1") void deleteById(ID s);`; reativação: `BE/repository/generic/SaveAndRestoreRepositoryImpl.java:53-56` — `if(e.getStatus().equals("D")) { ... entity.setStatus("A"); return this.entityManager.merge(entity);`; lista do aluno: `BE/repository/NaturezaRequerimentoRepository.java:26-31` (`findAtivos`, status 'A').
**O que ainda falta decidir:** Só a interface (lista de arquivadas, reativar). Vale para setor, tipo de natureza e integrante também: tudo é exclusão lógica.

### protocolo--naturezas--2
**Pergunta:** Cada natureza tem um setor responsável, que recebe todo requerimento dela (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz diferente: a natureza tem **N pares setor × unidade**. Quem recebe o requerimento é o setor cadastrado para a unidade do requerente; a mesma natureza pode ir para setores diferentes conforme o campus/polo. Se houver dois setores para a mesma unidade, os dois enxergam o requerimento na caixa, e o "destino" mostrado é o primeiro da lista. Além disso, cada tipo de natureza pode ter pessoas designadas por unidade, que passam a ser as únicas a ver os requerimentos novos daquele tipo.
**Evidência:** `BE/entity/SetorNaturezaRequerimento.java:15-37` (setor, natureza, unidade); `BE/entity/Requerimento.java:127-134` — `.filter(x -> x.getOidunidade().equals(this.unidadePessoa.getOidUnidade())).findFirst()`; `BE/business/RequerimentoWrapper.java:161-166` — `return setores.get(0);`; designados: `BE/repository/QueryRequerimento.java:316-328`.
**O que ainda falta decidir:** Se a tela nova assume um setor único (perde o roteamento por unidade que existe hoje) ou desenha a matriz setor × unidade.

### protocolo--naturezas--3
**Pergunta:** O que acontece com requerimentos em andamento quando a natureza é arquivada ou troca de setor.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não há regra escrita; o comportamento é efeito colateral das consultas. Natureza excluída (status 'D'): os requerimentos continuam aparecendo nas filas, porque as consultas das filas não olham o status da natureza nem do par setor × unidade; a linha do tempo perde o "para" da abertura. Troca de setor (remove um par, cria outro): requerimentos que já têm despacho seguem o setor do último despacho e não são afetados; requerimentos ainda sem despacho passam a aparecer na caixa do setor novo **e continuam na do antigo**, porque o par removido fica com status 'D' e a consulta da caixa não filtra esse status. O que é indício: se a unidade do requerente ficar sem nenhum par, montar o requerimento falha (`setores.get(0)` em lista vazia).
**Evidência:** `BE/repository/QueryRequerimento.java:336-343` (junção com `setornaturezarequerimento snr` sem `snr.status = 'A'`); remoção lógica do par: `BE/repository/SetorNaturezaRequerimentoRepository.java:33-35` — `UPDATE SetorNaturezaRequerimento snr SET snr.status = 'D'`; linha do tempo: `BE/service/TimelineService.java:56-60` (usa `buscarPorNatureza`, que exige natureza ativa); falha: `BE/business/RequerimentoWrapper.java:161-166`.
**O que ainda falta decidir:** A regra desejada (os pendentes migram? ficam com o setor antigo?) — e corrigir o servidor para segui-la.

### protocolo--naturezas--4
**Pergunta:** Cada natureza declara as modalidades que atende; nenhuma unidade marcada vale como todas (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário. A natureza não declara modalidade; modalidade (EAD ou PRESENCIAL) é atributo da unidade, e a natureza é ligada a unidades por pares setor × unidade. **Nenhuma unidade marcada vale como nenhuma**: sem par para a unidade do requerente, o requerimento não aparece na caixa de ninguém. E o Portal do Aluno não filtra por unidade: mostra todas as naturezas ativas, então o aluno consegue abrir requerimento de uma natureza que a unidade dele não atende.
**Evidência:** `BE/entity/Unidade.java:14-18` — `private String modalidade; ... return "EAD".equals(modalidade);`; caixa exige o par: `BE/repository/QueryRequerimento.java:336-338` — `inner join setornaturezarequerimento snr on ... and snr.oidunidade = up_solicitante.oidunidade`; portal: `S2/Domain-EJB/ejbModule/br/ucam/campos/domain/rest/ProtocoloClient.java:42` — `"natureza-requerimento/search/ativos"`.
**O que ainda falta decidir:** Se "nenhuma = todas" vira regra nova (exige mudar o servidor) e se o Portal passa a esconder naturezas não atendidas na unidade do aluno.

### protocolo--novo-requerimento--1
**Pergunta:** O atendimento abre requerimento em nome de um aluno buscado no cadastro, sem digitar os dados (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema não faz assim: a abertura interna recebe nome e CPF digitados, sem busca e sem conferência no Acadêmico. O servidor exige nome e CPF, procura a pessoa pelo identificador (`oidPessoa`) na tabela própria do Protocolo e, se não achar, **cria** a pessoa com o nome e o CPF recebidos, com perfil "aluno" na unidade escolhida. Não procura por CPF, então não liga o requerimento a uma pessoa já existente. O que é indício: o front atual não envia `oidPessoa` na abertura interna (a linha está comentada), e o servidor usa esse campo como chave — convém conferir em produção como esses requerimentos ficam gravados.
**Evidência:** `BE/service/RequerimentoService.java:401-417` — `if (nome == null || cpf == null) throw new CrudException("Favor adicionar o nome e o cpf do requerente para continuar."); ... this.pessoaService.create(new Pessoa(oidpessoa, nome, cpf)); ... new UnidadePessoa(oidpessoa, requerimento.getOidUnidade(), new String[]{"aluno"})`; front: `FE/paginas/requerimentos/requerimento/dialog/novo-requerimento-dialog/novo-requerimento-dialog.component.ts:260-262` — `novo.nome = ...; novo.cpf = ...; // novo.OidPessoa = this.oidPessoaSingleton;`.
**O que ainda falta decidir:** A busca no cadastro é desejável e resolve o problema acima, mas pede que a tela envie o `oidPessoa` do aluno (o mesmo que o Portal usa), além de nome, CPF e unidade.

### protocolo--novo-requerimento--2
**Pergunta:** O setor responsável vem da natureza escolhida e não se troca na abertura (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema já faz: o requerimento não guarda setor; o setor é deduzido da natureza do tipo escolhido **mais a unidade do requerente**. Não há campo para trocá-lo na abertura. Diferença para a proposta: depende também da unidade (ver naturezas--2).
**Evidência:** `BE/entity/Requerimento.java:116-135` (método `setorDestino()`; a entidade não tem coluna de setor).
**O que ainda falta decidir:** Nada, se a prévia da tela mostrar o setor resolvido por natureza + unidade.

### protocolo--novo-requerimento--3
**Pergunta:** Requerimento enviado não se edita (proposta).
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Na prática já é assim: nem a aplicação dos funcionários nem o Portal do Aluno têm edição. Mas o servidor não garante: não há trava, e o recurso REST genérico de requerimento aceita alteração. O aluno pode apenas remover anexo (`DELETE /requerimento/anexo/{id}`), e esse endpoint tem um defeito de mapeamento (o caminho declara `{id}` e o método lê `oid`).
**Evidência:** `BE/resource/RequerimentoController.java:97-100` — `@DeleteMapping("/anexo/{id}") public void removerAnexo(@PathVariable("oid") String oid)`; `BE/repository/RequerimentoRepository.java:16-21`.
**O que ainda falta decidir:** Se a regra vira trava no servidor.

### protocolo--novo-requerimento--4
**Pergunta:** Quem pode abrir em nome do aluno.
**Veredito:** RESPONDIDA
**Resposta:** Hoje, qualquer um que alcance a tela (ou a API): o servidor não confere quem está abrindo. Mais grave para a pergunta: **não fica registrado quem abriu**. O evento "Solicitado" do histórico é gravado em nome do próprio requerente, e o requerimento não tem campo de "aberto por". Um requerimento aberto pelo atendimento é indistinguível de um aberto pelo aluno.
**Evidência:** `BE/resource/RequerimentoController.java:84-88` — `public ResponseEntity<Requerimento> criarRequerimento(@RequestBody Requerimento requerimento)`; `BE/service/RequerimentoService.java:397` e `:435` — `String oidpessoa = requerimento.getOidPessoa(); ... adicionarHistoricoRequerimento(requerimento, EventoRequerimentoEnum.SOLICITADO, oidpessoa);`.
**O que ainda falta decidir:** A regra (qualquer integrante × só atendimento) e, junto, gravar o autor da abertura — sem isso a regra não é auditável.

### protocolo--novo-requerimento--5
**Pergunta:** O aluno é avisado quando alguém abre um requerimento em nome dele? Por qual canal?
**Veredito:** RESPONDIDA
**Resposta:** Não é avisado. O backend do Protocolo não envia e-mail, push nem notificação em nenhum evento (abertura, encaminhamento, resposta, conclusão, reabertura): não há biblioteca de e-mail no projeto e nenhuma chamada a serviço de mensagem. O único "canal" é o aluno entrar no Portal: a lista "meus requerimentos" busca pelo identificador da pessoa, com número, data, estado e, no detalhe, os despachos. Um requerimento aberto pelo atendimento só aparece lá se tiver sido gravado com o mesmo `oidPessoa` do aluno (ver novo-requerimento--1).
**Evidência:** `protocolo-backend-novo/build.gradle:38-62` (sem `spring-boot-starter-mail`; a única menção a e-mail no código é a constante `PATH_IMAGENS_EMAIL`, `BE/util/Constantes.java:28`, sem uso); lista do aluno: `BE/repository/RequerimentoRepository.java:318-328` — `where a.unidadePessoa.pessoa.oid = :oidPessoa`; `S2/Aluno-WEB/src/br/ucam/campos/aluno/web/controller/RequerimentoNovoHelper.java:228-230`.
**O que ainda falta decidir:** Se haverá aviso, em quais eventos e por qual canal. É funcionalidade nova; `email-smtp-ucam-backend` existe na organização, mas o Protocolo não o usa.

### protocolo--novo-requerimento--6
**Pergunta:** Anexo em PDF de até 10 MB (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz diferente. No servidor o limite é **50 MB** por arquivo e por requisição, e **não há validação de tipo**. No Portal do Aluno o limite também é 50 MB, com os tipos pdf, bmp, png, tiff/tif, jpg e jpeg, um arquivo por documento exigido. Na aplicação dos funcionários não há limite algum na tela.
**Evidência:** `protocolo-backend-novo/src/main/resources/application-prod.properties:27` — `spring.servlet.multipart.max-file-size=50MB`; `BE/resource/FileUploadController.java:30-48` (só verifica arquivo vazio); `S2/Aluno-WEB/WebContent/paginas/requerimento/requerimentonovo.xhtml:198-204` — `sizeLimit="50000000" ... allowTypes="/(\.|\/)(pdf|bmp|png|tiff|tif|jpg|jpeg)$/" ... invalidSizeMessage="Tamanho máximo 50mb"`.
**O que ainda falta decidir:** Se o limite cai para 10 MB e só PDF (restringe o que o aluno faz hoje: foto de documento em JPG/PNG é aceita) e se o servidor passa a validar tipo.

### protocolo--parametros-setores--1
**Pergunta:** Cada setor tem capacidade, SLA alvo, responsável e três chaves; o sistema de hoje não tem nenhum desses campos (proposta).
**Veredito:** RESPONDIDA
**Resposta:** Confirmado no servidor: o setor tem só o nome (2 a 120 caracteres, gravado em maiúsculas) e o status. Não há capacidade, SLA, responsável, "atende EAD", distribuição automática nem "aceita fila acima da capacidade", em nenhuma tabela. "Atende EAD" hoje é consequência dos pares setor × unidade das naturezas (a unidade é que tem modalidade).
**Evidência:** `BE/entity/Setor.java:20-22` — `@Size(min = 2, max = 120, ...) private String descricao;`.
**O que ainda falta decidir:** Se os seis campos entram no modelo; todos são novos.

### protocolo--parametros-setores--2
**Pergunta:** Os valores de capacidade e SLA alvo de cada setor.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há valor nenhum, nem padrão. O único número de prazo no servidor é o do tipo de natureza, e os substitutos 20 dias (Analytics) e 7 dias ("em espera" na fila). Procurei em entidades, constantes e arquivos de configuração do backend.
**Evidência:** `BE/repository/AnalyticsRepository.java:27` — `coalesce(t.prazo, 20)`; `BE/business/RequerimentoWrapper.java:212` — `minusDays(7)`.
**O que ainda falta decidir:** Todos os valores. Os prazos reais por tipo de natureza estão no banco de produção (coluna `tiponaturezarequerimento.prazo`) e podem servir de base — não estão nos repositórios.

### protocolo--parametros-setores--3
**Pergunta:** O que "aceita fila acima da capacidade" faz quando está desligado.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não existe distribuição nem capacidade; a fila do setor não tem teto e ninguém é impedido de receber. Não há comportamento atual para comparar.
**Evidência:** `BE/repository/QueryRequerimento.java:306-409` (a caixa é uma consulta sem limite por setor ou pessoa).
**O que ainda falta decidir:** Tudo.

### protocolo--parametros-setores--4
**Pergunta:** Onde fica o limite entre "No alvo", "No limite" e "Acima do alvo".
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há faixas no servidor. A única classificação existente é binária, por requerimento: dentro do prazo ou em atraso (`decorrido > prazo`), feita na tela.
**Evidência:** `FE/paginas/requerimentos/shared/components/requerimento-prazo/requerimento-prazo.component.html:3` — `noPrazo: percorrido <= prazo, emAtraso: percorrido > prazo`.
**O que ainda falta decidir:** As faixas.

### protocolo--parametros-setores--5
**Pergunta:** Setor não se cria nem se apaga nesta tela: os seis existem (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz o contrário: setor é cadastro livre. O servidor expõe criar, renomear e excluir (exclusão lógica, sem verificar se há integrantes, naturezas ou requerimentos apontando para ele). A quantidade de setores é dado de produção, não é fixa em seis no código.
**Evidência:** `BE/repository/SetorRepository.java:15-16` — `@RepositoryRestResource(path = "setor", collectionResourceRel = "setores") public interface SetorRepository extends SaveAndRestoreRepository<Setor, String>`; exclusão lógica: `BE/repository/generic/SaveAndRestoreRepository.java:39-44`.
**O que ainda falta decidir:** Se criar/excluir setor some da interface (e quem passa a fazê-lo), e conferir no banco quantos setores ativos existem de fato.

### protocolo--natureza-form--1
**Pergunta:** O prazo de resposta da natureza conta em dias úteis a partir do envio (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema faz diferente em dois pontos: o prazo é do **tipo de natureza** (cada natureza tem vários tipos, cada um com o seu prazo), e conta em **dias corridos** a partir da data de abertura. "A partir do envio" confere.
**Evidência:** `BE/entity/TipoNaturezaRequerimento.java:30`; `BE/entity/Requerimento.java:209` — `ChronoUnit.DAYS.between(this.getDataAbertura(), LocalDateTime.now())`.
**O que ainda falta decidir:** Dias úteis × corridos; e se o prazo sobe para a natureza ou fica no tipo (o formulário de referência não tem a entidade "tipo").

### protocolo--natureza-form--2
**Pergunta:** O prazo da natureza pode ser maior que o SLA alvo do setor?
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há SLA de setor, logo não há comparação nem validação. O prazo do tipo nem sequer tem validação própria (aceita nulo e qualquer inteiro).
**Evidência:** `BE/entity/TipoNaturezaRequerimento.java:30` — `private Integer prazo;` (sem anotação de validação); `BE/entity/Setor.java:18-26`.
**O que ainda falta decidir:** Tudo.

### protocolo--natureza-form--3
**Pergunta:** Qual calendário define dia útil.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há calendário, feriado nem recesso no Protocolo; a conta é em dias corridos. Li todo o backend e não há nenhuma tabela ou serviço de calendário; busquei "feriado" e "prazo" no repositório de protocolo do SIGU legado, sem resultado.
**Evidência:** `BE/entity/Requerimento.java:197-211` (toda a conta de tempo do sistema está neste método).
**O que ainda falta decidir:** Tudo; se a regra for dias úteis, o calendário precisa de dono e de fonte (o Acadêmico tem calendário letivo, mas o Protocolo não o consulta).

### protocolo--natureza-form--4
**Pergunta:** Três exigências por natureza: anexo obrigatório, justificativa escrita, e se o aluno pode abrir pelo Portal (proposta).
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** (1) Anexo: o sistema é mais rico que a chave sim/não — cada **tipo de natureza** tem uma lista de tipos de documento exigidos, e o servidor recusa o requerimento se vierem menos anexos do que o exigido ("Número de anexos inválido ou inexistente (n)"); o Portal do Aluno pede um arquivo por documento e avisa "Anexe todos os documentos necessários!". (2) Justificativa: é obrigatória **sempre**, para toda natureza — a descrição tem mínimo de 10 caracteres ("Descreva seu pedido."); não é configurável. (3) Abrir pelo Portal: existe o campo `tipo` da natureza (INTERNO/EXTERNO), mas é indício, não regra — nenhuma consulta o usa; o Portal recebe todas as naturezas ativas, internas ou externas. Há ainda duas exigências que a referência não tem: **máximo de solicitações** por tipo (campo gravado, não aplicado pelo servidor novo — ver Descobertas) e um questionário de **motivo** que o Portal exige para dois tipos específicos, identificados por UUID fixo no código.
**Evidência:** `BE/service/RequerimentoService.java:583-608` — `if (anexos == null || anexos.size() < numeroAnexosObrigatorios) throw new CrudException("Número de anexos inválido ou inexistente (" + ...`; `BE/entity/Requerimento.java:26-28` — `@Size(min = 10, message = "A descrição deve possuir no mínimo {min} caracteres.")`; `BE/entity/NaturezaRequerimento.java:21` — `private String tipo;` e `BE/repository/NaturezaRequerimentoRepository.java:26-31` (sem filtro por tipo); motivo: `S2/Aluno-WEB/src/br/ucam/campos/aluno/web/controller/RequerimentoNovoHelper.java:186-189` e `requerimentonovo.xhtml:157-162` (Problema financeiro, Problema de saúde, Mudança de cidade, Falta de identificação com o curso, Reprovações sucessivas em disciplinas, Outro).
**O que ainda falta decidir:** Se "interno/externo" é de fato o "aluno pode abrir pelo Portal" (precisa de confirmação e de filtro no servidor); se o anexo vira chave simples ou mantém a lista de documentos; se a justificativa pode ser dispensada.

### protocolo--natureza-form--5
**Pergunta:** O código da natureza é único e muda depois de criado?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não existe "código" de natureza. A natureza tem descrição (em maiúsculas), tipo e um identificador interno `oid` (UUID gerado pelo servidor, que **não muda** depois de criado). É esse `oid` que vai para as integrações: o Portal do Aluno busca tipos e anexos por `oid` e tem dois UUIDs de tipo fixos no código. A unicidade da descrição é checada por uma função do banco (`verifica_unique`), cujo conteúdo não está nos repositórios.
**Evidência:** `BE/entity/EntityModel.java:31-38` — `@GeneratedValue(generator = "UUID") ... @Column(name = "oid", updatable = false, nullable = false)`; `BE/entity/NaturezaRequerimento.java:17-21`; `BE/repository/generic/SaveAndRestoreRepositoryImpl.java:105` — `select verifica_unique('...')`; UUIDs fixos: `S2/Aluno-WEB/.../RequerimentoNovoHelper.java:186-187`.
**O que ainda falta decidir:** Se será criado um código legível. Se for, ele é novo; relatórios e integração hoje usam `oid` e descrição. Recriar um tipo muda o `oid` e quebra a regra do motivo no Portal.

### protocolo--integrante-form--2
**Pergunta:** O que cada nível pode fazer (a tela propõe triagem / análise / decisão).
**Veredito:** RESPONDIDA
**Resposta:** A proposta não corresponde ao sistema. O nível **não libera ação nenhuma**: qualquer nível trata, responde, encaminha, conclui e reabre. O nível é uma régua de **visibilidade por complexidade**: cada tipo de natureza tem um nível (1 a 3), cada encaminhamento leva um nível de destino, e o integrante enxerga o que tem nível menor ou igual ao seu (ou só o igual, se desligar "Nível abaixo do meu"). Nível 3 vê tudo do setor; nível 1 vê só os tipos e despachos de nível 1. A única ação que já dependeu de nível foi reabrir (nível ≥ 3, "master", no legado), e essa trava está comentada no servidor novo.
**Evidência:** `BE/repository/QueryRequerimento.java:345-347` — `tnr.nivel <= nvf.nivel` / `tnr.nivel = nvf.nivel`; `:382-384` — `dp.nivel_pessoa >= dp.nivel_despacho`; `BE/entity/TipoNaturezaRequerimento.java:22-23` — `@Max(3) private Integer nivel;`; `BE/service/RequerimentoService.java:270-272` (trava comentada).
**O que ainda falta decidir:** Se a Gestão quer transformar nível em permissão (regra nova) ou manter como alçada de visibilidade. Os rótulos "triagem / análise / decisão" não têm base no código.

### protocolo--integrante-form--3
**Pergunta:** O nível decide o que a pessoa pode fazer ou quanto ela recebe na distribuição.
**Veredito:** RESPONDIDA
**Resposta:** Nenhum dos dois, literalmente. Não decide o que a pessoa pode fazer (nenhuma ação é barrada por nível) e não decide quantidade (não há distribuição nem cota). Decide **quais** requerimentos ela enxerga na fila do setor: os de tipo de natureza e de despacho com nível até o dela. Está mais perto da segunda hipótese ("o que ela recebe"), mas por alçada, não por volume. E é por unidade: a mesma pessoa pode ter níveis diferentes em unidades diferentes do mesmo setor.
**Evidência:** as mesmas de integrante-form--2; por unidade: `BE/service/SetorService.java:44-46` — `setorPessoaRepository.save(new SetorPessoa(setor, up, unidade.getNivel()));`.
**O que ainda falta decidir:** O texto que explica o nível na tela ("vê requerimentos de nível até N").

### protocolo--integrante-form--4
**Pergunta:** A conta vem do Gerencial: aqui se escolhe a pessoa, não se cria acesso (proposta).
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Confere que aqui não se cria acesso: o Protocolo não tem usuário nem senha; guarda uma tabela própria de `pessoa` (identificador, nome, CPF, telefones, último acesso) e os vínculos. Ao entrar num setor a pessoa ganha o perfil "funcionario" na unidade. Mas a pessoa precisa existir **na tabela do Protocolo**: a busca do formulário procura ali, por nome, entre quem ainda não está no setor. Há um endpoint que insere a pessoa com o identificador vindo de fora (`POST /pessoa/unidade-pessoa`). O que é indício: que esse identificador seja o mesmo do Gerencial e quem dispara essa inserção (login, carga) — não achei o chamador nos repositórios lidos.
**Evidência:** `BE/repository/PessoaRepository.java:42-53` (busca de não associados); `BE/resource/PessoaController.java:65-80` — `repository.insert(dto.getOidPessoa(), dto.getNome(), dto.getCpf()); ... unidadePessoa.setPerfis(new String[]{"funcionario"});`; `BE/service/SetorService.java:66-80`.
**O que ainda falta decidir:** De onde a tela busca a pessoa (Gerencial × tabela do Protocolo) e como a pessoa chega à tabela do Protocolo; a TI precisa confirmar o fluxo de sincronização.

### protocolo--integrante-form--5
**Pergunta:** A pessoa só vê requerimentos das unidades em que atua (proposta).
**Veredito:** RESPONDIDA
**Resposta:** Nas quatro filas, o sistema já faz: caixa de entrada, minha pauta, encaminhados e concluídos casam a unidade do requerente com a unidade do vínculo do funcionário no setor. Fora das filas, não: a Pesquisa e o Gerencial trazem requerimentos de todas as unidades (somente leitura). E a restrição das filas não é imposta pelo servidor contra quem chama a API: unidades e setores vêm como parâmetro da requisição (se vierem vazios, o servidor usa os da pessoa).
**Evidência:** `BE/repository/QueryRequerimento.java:343` e `:386` (caixa), `:141` (minha pauta), `:183-184` (concluídos), `:226-227` (encaminhados); padrão: `BE/resource/dto/RequerimentoFilter.java:45-51`; todas as unidades: `BE/resource/GerencialController.java:38-41` — `unidades = Arrays.asList("TODOS");`.
**O que ainda falta decidir:** Se a Pesquisa global continua aberta a todas as unidades (hoje é).

### protocolo--integrante-form--6
**Pergunta:** Fora da distribuição automática, a pessoa só recebe o que lhe for encaminhado à mão; a coordenação recebe o que ninguém assumiu (proposta).
**Veredito:** RESPONDIDA
**Resposta:** O sistema não trata, porque não há distribuição automática, nem chave para sair dela, nem coordenação. Hoje todo requerimento "que ninguém assumiu" fica na caixa de entrada de **todos** os integrantes do setor × unidade com nível suficiente, até alguém clicar em Tratar. Há dois mecanismos de atribuição a pessoa que a referência não considera: (1) responsáveis designados por tipo de natureza e unidade, que passam a ser os únicos a ver os requerimentos novos daquele tipo; (2) "designar", no servidor, que passa um requerimento em tratamento a um colega do mesmo setor ("Só é possível designar um requerimento para pessoas do mesmo setor.") e grava o evento "Designado" — o front atual não usa esse endpoint.
**Evidência:** designados: `BE/repository/QueryRequerimento.java:316-328` e `:400-409`; designar: `BE/resource/AnaliseRequerimentoController.java:213-222` e `BE/service/RequerimentoService.java:665-765`.
**O que ainda falta decidir:** Se a distribuição automática existirá. Se a ideia é só "atribuir a alguém", os dois mecanismos acima já existem no servidor.

---

## Descobertas fora da lista

1. **O servidor não tem autenticação nem autorização.** Qualquer chamada lê, cria, encaminha, conclui e reabre; os repositórios estão expostos como REST genérico (inclusive alteração e exclusão de requerimento, despacho, histórico, setor, natureza). Toda regra de "quem pode" das telas de referência precisa de uma camada que hoje não existe. — `protocolo-backend-novo/build.gradle:38-62`; `.../dti/ProtocoloApplication.java:45-47`; `BE/service/AcessoValidade.java:11-14`.

2. **Nenhum aviso ao aluno, em evento nenhum.** O backend novo não manda e-mail nem notificação. O protocolo legado do SIGU 2.0 gravava notificação no portal ("O seu requerimento N foi Deferido / Atualizado.") ao encaminhar, assumir, responder, reabrir e concluir; isso se perdeu na migração. — `S2/Domain-EJB/ejbModule/br/ucam/campos/domain/services/requerimento/RequerimentoService.java:231`, `:250`, `:281`, `:310`, `:340`; `S2/.../notificacoes/NotificacaoBuilder.java:161-178`.

3. **`maxSolicitacoes` é gravado e não é aplicado.** O servidor novo nunca lê o campo ao criar requerimento. No SIGU legado a regra era: por pessoa, por tipo, **por semestre** (prefixo de 5 caracteres do número) — "Você excedeu o limite de solicitações deste tipo de requerimento! Solicite um novo na secretaria da instituição." — e havia ainda um teto de **2 requerimentos por dia** por pessoa ("Você excedeu o limite de requerimentos diários!"). — `BE/entity/TipoNaturezaRequerimento.java:25-26` (único uso no backend); `S1/DomainEJB/ejbModule/br/ucam/campos/dti/repositorio/RepositorioProtocolo.java:676-691` e `:712-722`.

4. **"Tipo de natureza" é a entidade central e a referência não a tem.** Nível, prazo, máximo de solicitações, observação (texto mostrado ao aluno), documentos exigidos e responsáveis designados pertencem ao tipo, não à natureza. O requerimento aponta para o tipo. — `BE/entity/TipoNaturezaRequerimento.java:19-45`; `BE/entity/Requerimento.java:56-62`.

5. **Responsável designado por tipo e unidade tira o requerimento da fila do setor.** Se um tipo tem pessoas designadas na unidade do requerente, só elas veem os requerimentos novos daquele tipo; o resto do setor deixa de ver. — `BE/repository/QueryRequerimento.java:316-328`, `:358`, `:400-409`.

6. **"Tratar" é uma trava (LOCK), e existe "designar".** Assumir cria um despacho LOCK em nome de quem assumiu; é isso que tira o requerimento da caixa e o põe na Minha pauta. Não há "devolver à fila". O servidor permite passar o requerimento a um colega do mesmo setor (evento "Designado"), sem tela hoje. — `BE/service/RequerimentoService.java:625-663` e `:665-727`.

7. **O Gerencial inclui requerimentos concluídos e ignora o filtro de estado.** A consulta principal não filtra estado (só a consulta "por ano" exclui DEFERIDO/INDEFERIDO), e o parâmetro `estado` (Livre/Análise/Todos) enviado pela tela não é lido. Como `vencimento` é sempre "dias desde a abertura até hoje", um requerimento concluído há meses conta como "fora do prazo". — `BE/repository/QueryRequerimento.java:281-300` (sem condição de estado) × `BE/repository/Querys.java:91`; `BE/resource/GerencialController.java:43-50`; `BE/resource/dto/RequerimentoFilter.java:91-99` (filtro de estado comentado).

8. **No Gerencial o requerimento aparece em todo setor que atende a natureza, em qualquer unidade.** A junção com os pares setor × unidade é feita só pela natureza, sem casar a unidade do requerente (a versão anterior da consulta, comentada, casava). Os totais por setor do painel ficam inflados. — `BE/repository/QueryRequerimento.java:263-276` × versão comentada `:539-541`.

9. **O Analytics só enxerga o semestre corrente.** Qualquer período escolhido é cortado para o semestre e o ano atuais; não dá para ver o semestre passado. — `BE/repository/AnalyticsRepository.java:46-47`, `:76-77`.

10. **Três réguas de atraso diferentes.** Prazo nulo vale 0 nas filas e no Gerencial, 20 dias no "em espera" do Analytics, e a fila tem um `emEspera` de 7 dias sem movimento. — `BE/business/RequerimentoWrapper.java:209-215`, `:221-228`; `BE/repository/AnalyticsRepository.java:27-28`.

11. **Nota de despacho: 10 a 250 caracteres, sem data.** A nota interna não guarda data; na linha do tempo o servidor a carimba com a hora da consulta, então as notas aparecem sempre como "agora", no fim. Tem um campo `feito` (tarefa concluída) sem uso na tela. — `BE/entity/NotaDespacho.java:18-19`, `:40`; `BE/business/EventoTimeline.java:57-60`.

12. **Respostas favoritas por pessoa e setor (até 250 caracteres) e "setores mais escolhidos".** O servidor guarda textos prontos por funcionário × setor e sabe devolver os 4 setores para os quais aquele funcionário mais encaminha. — `BE/entity/EncaminhamentoFavorito.java:14-15`; `BE/repository/SetorRepository.java:32-42`.

13. **"Novos desde o último acesso".** O servidor grava o último acesso da pessoa e conta os requerimentos que chegaram depois dele; a tela atual não mostra, mas é a base pronta para um "não lido" por pessoa. — `BE/resource/PessoaController.java:39-63`; `BE/repository/PessoaRepository.java:55-60`.

14. **Número do protocolo: indício de colisão.** O número nasce de `ano + mes + "0000"`, mas ano e mês são inteiros e são **somados** antes de virar texto (outubro de 2026 → 2036 → "20360000"); novembro de 2025 dá a mesma base. Cada par ano/mês tem a sua sequência, então dois meses podem gerar os mesmos números. Não confirmei no banco se há restrição de unicidade em `requerimento.numero`. — `BE/entity/SeqProtocolo.java:23-26` — `this.sequencia = ano + mes + seed;`; `BE/repository/SeqProtocoloRepository.java:16-28`.

15. **Indícios a conferir em produção antes de desenhar em cima.** (a) A contagem de anexos obrigatórios agrupa por registro (`group by anr`) e devolve um valor único; com dois ou mais documentos exigidos a consulta tende a devolver mais de uma linha — `BE/repository/AnexoNaturezaRequerimentoRepository.java:34-40`. (b) Taxa de requerimento (valor, início, fim por tipo) existe como tabela e não é usada em fluxo nenhum — `BE/entity/TaxaRequerimento.java:12-28`. (c) O requerimento tem `oidMotivo` e a tela interna grava sempre "2" — `BE/entity/Requerimento.java:71-76`; `FE/.../novo-requerimento-dialog.component.ts:255`. (d) O app móvel (`flutter-mobile-ucam-v2/lib/repository/protocol_repository/protocol.repository.dart:59`, `:135`) fala com outra API (`/protocolo/...` de um backend móvel que não está entre os repositórios lidos); não verifiquei que regras ele aplica.
