# SigFin — respostas pelo código do servidor (36 perguntas)

Leitura feita em 06/10/2026 nos clones de `C:\Users\Leonardo\Documents\UCAM-repos\`. Nada foi executado; só leitura de código.

**Contagem:** RESPONDIDA 25 · RESPONDIDA EM PARTE 11 · NÃO ESTÁ NO CÓDIGO 0.

**Abreviações de caminho usadas nas evidências**

| Sigla | Caminho |
|---|---|
| `D/` | `sigfin/Domain/ejbModule/br/ucam/campos/domain/` |
| `W/` | `sigfin/SigFin/src/br/ucam/campos/sigfin/web/controller/` |
| `P/` | `sigfin/SigFin/WebContent/paginas/` |
| `RC/` | `rel-contabilidade-backend/src/main/java/br/ucamcampos/relcontabilidadebackend/contabilidade/` |
| `FB/` | `financeiro-backend/src/main/java/br/edu/candidomendes/financeiro/` |
| `GW/` | `api-financeiro-gateway/src/main/java/br/com/ucam/apifinanceirogateway/` |

**Três avisos que valem para o arquivo todo**

1. **Não há manual nem script de banco** nos repositórios do financeiro (`sigfin` não tem `.md`, `.pdf`, `.docx` nem `.sql`; `financeiro-backend` tem um `README.md` e um `DOC.md` técnicos e uma migração só de índices). Toda resposta vem de código Java, página JSF ou consulta SQL embutida.
2. **Duas regras vivem só no banco**, em funções que nenhum repositório contém: `valida_exclusao(tabela, oid)` (o que impede excluir) e `verifica_unique(tabela, schema)` (o que não pode repetir). O inventário do Gerencial confirma que as duas existem em produção (`Gerencial-v3.0-2026/docs/inventario/ModuloGerencial/inventario-banco-de-dados.md:117-126`), mas o corpo delas não foi lido. Tudo o que depende delas está marcado EM PARTE.
3. **Os relatórios contábeis leem uma tabela analítica**, `public.financeiroaluno`, cuja carga (ETL) também não está em nenhum repositório. As consultas sobre ela foram lidas; o que alimenta cada coluna, não.

---

### sigfin--movimento-caixa--2
**Pergunta:** (proposta) Fechar o caixa trava novos lançamentos do dia.
**Veredito:** RESPONDIDA
**Resposta:** O sistema atual **não faz** o que a proposta diz. "Bloquear caixa" só marca o saldo do dia como bloqueado. O efeito é de tela: sobra, falta e depósitos ficam somente leitura, o botão "Calcular Caixa" fica desabilitado, e os três boletins (sintético, analítico, controle de saídas) só são emitidos com o caixa bloqueado. A baixa de cobranças (`baixarCobrancas`) não consulta o bloqueio em nenhum ponto: dá para receber no caixa depois de fechado. A única condição para bloquear é o saldo não estar negativo ("Caixa negativo!").
**Evidência:** `W/FechamentoCaixaHelper.java:315-325` — `if (this.obj.getSaldo().signum() < 0) {... "Caixa negativo!"} this.obj.setBloqueado(!this.obj.isBloqueado());` · `D/services/CaixaService.java:117-160` (baixa sem checar bloqueio; a palavra `bloqueado` não aparece no serviço) · `P/relatorios/consultacaixa.xhtml:108` — "NÃO É POSSÍVEL EMITIR OS RELATÓRIOS POIS O CAIXA DESTA DATA NÃO ESTÁ BLOQUEADO".
**O que ainda falta decidir:** se o novo sistema passa a travar de fato. Hoje, um recebimento lançado depois do fechamento muda os totais sem que o saldo salvo seja recalculado.

### sigfin--movimento-caixa--3
**Pergunta:** Quem pode reabrir um caixa fechado, até quando, e se a reabertura fica registrada.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Reabrir é o mesmo botão de fechar, invertido ("Desbloquear Caixa"), numa tela à parte (`bloqueiocaixa.xhtml`) em que se escolhe o operador e a data. Na tela do próprio operador (`fechamentocaixa.xhtml`) o botão fica desabilitado depois de bloqueado, ou seja, o operador fecha e não reabre. Não há prazo: qualquer data pode ser reaberta. Não há motivo nem registro próprio da reabertura; fica só o log genérico de auditoria (tabela, operação EDITAR, usuário, IP, tela e o estado do registro em JSON) e a data de alteração do saldo.
**Evidência:** `P/fechamentocaixa/bloqueiocaixa.xhtml:96` — `value="#{fechamentoCaixaHelper.obj.bloqueado?'Desbloquear Caixa':'Bloquear Caixa'}"` · `P/fechamentocaixa/fechamentocaixa.xhtml:80-81` — `disabled="#{(empty ...obj.oid) or ...obj.bloqueado}"` · `D/interceptor/AuditInterceptor.java:63-78` — `log.setOperacao(...); log.setEstado(UtilService.retornaEstadoObjeto(entity).toString());`.
**O que ainda falta decidir:** quem recebe a tela de bloqueio (é permissão de menu, cadastrada no Gerencial, não está no código); se haverá prazo; se a reabertura exige motivo.

### sigfin--movimento-caixa--4
**Pergunta:** O caixa é por pessoa, por guichê ou por unidade?
**Veredito:** RESPONDIDA
**Resposta:** Por **pessoa e por dia**. O saldo é buscado por usuário + data; a fita do caixa é a lista de recebimentos daquele usuário naquela data; cada recebimento grava o usuário logado. Não existe guichê. Ninguém lança "no caixa de outro": o lançamento entra sempre no caixa de quem está logado. A unidade do recebimento é a do aluno (ou a do recebimento diverso), não a do operador. O saldo inicial do dia é o saldo final do caixa anterior do mesmo usuário.
**Evidência:** `D/persistence/repositories/RepositorioSaldocaixa.java:20-27` — `a.usuario = '#{usuario}' and a.data = '#{data}'` · `D/services/CaixaService.java:143` — `origempagamento.setUsuario(this.usuario);` · `:123-128` (unidade vem do aluno).
**O que ainda falta decidir:** nada sobre o modelo. Vale mostrar na tela que o caixa é do operador.

### sigfin--movimento-caixa--5
**Pergunta:** Lançamento errado se corrige como: estorno ou edição?
**Veredito:** RESPONDIDA
**Resposta:** Por **estorno**, nunca edição nem exclusão. O estorno cria um registro (data e hora, usuário, observação) preso ao recebimento e **reabre** as mensalidades e parcelas de acordo pagas por ele (voltam para "Em aberto"). O recebimento estornado continua na fita, mas sai dos totais. Não há lançamento contrário: o original é marcado. A tela de estorno manda a observação vazia.
**Evidência:** `D/services/CaixaService.java:665-694` — `estorno.setUsuario(this.usuario); ... this.abreMensalidade(((Pagamentomensalidade) pagamento).getMensalidade());` · `:827` — `if(!(item.getOrigempagamento().getEstorno() instanceof EstornoOrigempagamento))` · `W/EstornoCaixaHelper.java:138` — `estornoOrigempagamento(origempagamento, "")`.
**O que ainda falta decidir:** quem pode estornar e até quando (não há trava no código, nem de data nem de caixa bloqueado); se o motivo passa a ser obrigatório.

### sigfin--movimento-caixa--6
**Pergunta:** O que é "vale" e "banco tesouraria" nos totais, e como entram no saldo do dia.
**Veredito:** RESPONDIDA
**Resposta:** **Vale** é dinheiro que sai do caixa para uma pessoa ou fornecedor, com centro de custo e conta contábil, e que depois tem acerto de contas (devolução ou complemento). **Banco tesouraria** é uma saída lançada pelo operador (valor, descrição, conta contábil, centro de custo). As contas:
- total de vales = vales do dia + complementos do dia;
- **total recebido** = dinheiro + cartão + cheque + devolução de vale;
- **total de saídas** = cartão + cheque + vales + depósitos bancários + banco tesouraria;
- **saldo** = saldo inicial + total recebido + sobra − total de saídas;
- saldo inicial = (recebido + sobra + saldo inicial − saídas) do caixa anterior do mesmo operador.

Na prática cartão e cheque entram e saem (não ficam na gaveta), e o saldo acaba sendo o dinheiro em espécie. A **falta** é digitada e gravada, mas não entra na fórmula do saldo.
**Evidência:** `D/services/CaixaService.java:853` — `setTotalrecebido(totalDinheiro.add(totalCartao).add(totalCheque).add(totalvaledevolvido))` · `:859` — `setTotalsaida(totalCartao.add(totalCheque).add(saldocaixa.getTotalvale()).add(totaldeposito).add(totalbancotesouraria))` · `D/entities/financeiro/Saldocaixa.java:247-248` · `D/entities/financeiro/Vale.java:36-86`.
**O que ainda falta decidir:** confirmar com a tesouraria o nome de negócio de "banco tesouraria" (o código só mostra que é saída classificada) e se a falta deveria reduzir o saldo.

### sigfin--calculo-mensalidade--2
**Pergunta:** A ordem dos descontos: cada um incide sobre o valor de tabela ou sobre o já descontado?
**Veredito:** RESPONDIDA
**Resposta:** A ordem **depende da unidade**; há um roteiro por campus. Arredondamento de cada item em 2 casas, meio para cima.

*Roteiro padrão (Campos e demais sem roteiro próprio)* — `CalculoMensalidadePlanopagamento`:
1. **Valor bruto**: valor mensal do plano de pagamento.
2. **Descontos de turno** (diurno ou noturno) e **de escola pública**: percentual sobre o bruto, ou valor fixo. **Eles rebaixam o próprio bruto**: daqui em diante "bruto" já é o valor com esses descontos. Não se aplicam a plano diferenciado.
3. **Disciplinas excedentes**: (bruto ÷ máximo de disciplinas do período) × excedentes, somado ao bruto.
4. **Dependência**: etapa desligada (código comentado); não cobra nada.
5. **Convênio**: percentual **sobre o bruto** (do passo 2), ou valor fixo; subtraído do líquido. Gera uma segunda mensalidade, do tipo CONVÊNIO, com esse valor, a ser paga pelo conveniado.
6. **Lançamentos extras** (descontos e acréscimos avulsos do aluno): percentual **sobre o bruto**, ou fixo.
7. **Bolsa**, por último: se o tipo de bolsa é "valor integral", percentual **sobre o bruto**; senão, **sobre o líquido que chegou à etapa** (já com convênio e extras). Com duas bolsas, as duas usam essa mesma base (não é cascata entre elas).

*Rio Centro*: bruto por crédito → descontos por crédito → **bolsa → convênio** → dependência por crédito → extras (bolsa antes do convênio). *Zona Oeste*: bruto por crédito → descontos → bolsa PVERJ → desconto de menos de 16 créditos → bolsa progressiva → créditos excedentes → convênio → extras.

Desconto de pontualidade, multa e juros **não entram no cálculo**: são aplicados no recebimento (ver calculo-mensalidade--3).

O serviço novo (`financeiro-backend`, lote) usa outra fórmula: líquido = (bruto − descontos fixos + acréscimos fixos) × (1 − p/100) − bolsa em valor, com p = bolsa % + descontos % − acréscimos %, **somados** e limitados a 0–100. Não trata convênio. Nos meses 1, 2, 6 e 7 a base é o valor do plano.
**Evidência:** `D/services/calculomensalidade/calculos/campos/CalculoMensalidadePlanopagamento.java:35-43` (ordem) · `.../etapas/EtapaDescontos.java:105,149-150` — `mensalidade.setValorbruto(novoValorBruto)` · `.../etapas/EtapaConvenio.java:97-105` — `valordoConvenio = novoValorBruto.multiply(percentual)` · `.../etapas/EtapaBolsa.java:60-66` — `if (...isValorintegral()) valorReferencia = mensalidade.getValorbruto(); else valorReferencia = valorLiquidoInicial;` · `.../calculos/centro/CalculoMensalidadeRioCentro.java:31-37` · `FB/service/calculomensalidade/template/CalculoMensalidadeTemplate.java:99-112`.
**O que ainda falta decidir:** qual roteiro a tela de referência mostra (hoje ela desenha "sobre a tabela" para tudo, o que só é verdade para convênio, extras e bolsa integral); e se o roteiro único do serviço novo substitui os roteiros por campus.

### sigfin--calculo-mensalidade--3
**Pergunta:** As três faixas de data e o valor de cada uma: de onde vêm, e se o aluno pode ter faixa diferente.
**Veredito:** RESPONDIDA
**Resposta:** As três faixas existem e o valor de cada uma é:
- **Até a data de desconto antecipado**: líquido − **5%** do líquido (regra única para todas as unidades desde 03/01/2024). Sem desconto se alguma bolsa do aluno é de tipo que não aplica desconto de antecipação, se é parcela de acordo, ou se o plano diferenciado não dá desconto.
- **Depois dela, até o vencimento**: o líquido.
- **Depois do vencimento**: líquido **+ o valor das bolsas** (o aluno perde a bolsa do mês) + multa de **2%** sobre (líquido + bolsas) + juros de **0,0333% ao dia** sobre a mesma base. O juro diário é arredondado para centavos e depois multiplicado pelos dias. Havendo pagamento parcial, a base é o que falta pagar.

De onde vêm as datas: do cadastro de vencimentos do plano de pagamento do curso, por ano e mês (vencimento e data de antecipação). O aluno **pode** ter as suas: dia de vencimento próprio e desconto antecipado próprio (dia, valor ou percentual, que substitui os 5%). No cálculo individual as duas datas vêm preenchidas e podem ser digitadas; a de desconto não pode passar da de vencimento. Sem data de antecipação cadastrada, vale o último dia bancário do mês anterior ao vencimento (Araruama: 5 dias antes, recuando até dia útil).

Há mais de três faixas para parte dos alunos: regressão de bolsa por vencimento (ver tipo-bolsa-form--3), desconto esporádico por curso e mês, regressão do plano de pagamento e a bolsa 174 de Méier e Tijuca.
**Evidência:** `D/services/MensalidadeService.java:617-622` — "todas as unidades terem 5% de desconto" · `:224-246` — `multa = valorBase.add(bolsaAtrasada).multiply(doisPorcento); ... new BigDecimal(0.000333).multiply(valorBase.add(bolsaAtrasada)).setScale(2, HALF_UP)` · `:256` — `valorliquido − parcial − desconto + juros + multa + bolsaAtrasada` · `:322-336` (dia do aluno) · `:1029-1076` (data de desconto) · `P/calculomensalidade/calculomensalidade.xhtml:67-80`.
**O que ainda falta decidir:** a tela de referência mostra 8% de pontualidade e não mostra a perda da bolsa após o vencimento; as duas coisas precisam ser acertadas com a controladoria. O gateway de pagamento on-line **não** devolve a bolsa no atraso (ver Descobertas, item 2): qual das duas regras é a correta.

### sigfin--calculo-mensalidade--4
**Pergunta:** Recalcular uma mensalidade que já tem boleto registrado cancela o boleto anterior?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Não cancela; para quase todo mundo, **impede**. Usuário que não é administrador financeiro nem direção não consegue recalcular mensalidade que já tem boleto, quando a mensalidade não tem bolsa nem convênio: "Não é possivel calcular a mensalidade pois existe boleto emitido". A checagem vale para qualquer boleto ativo da competência (o filtro "só registrado" está comentado). Administrador recalcula: as linhas de composição antigas são apagadas, os valores substituídos e, se já havia pagamento, a situação é reavaliada. O boleto antigo não é cancelado: ao gerar boleto de novo para a mesma mensalidade e agência, o sistema **reaproveita** o boleto existente. Só nasce boleto novo quando a mensalidade está vencida (aí o vencimento passa a ser hoje).
**Evidência:** `D/services/calculomensalidade/CalculoMensalidadeService.java:134-148` — `throw new CalculoMensalidadeException("Não é possivel calcular a mensalidade pois existe boleto emitido")` · `:233-250` (`saveRecalculada`) · `D/persistence/repositories/RepositorioBoletobancario.java:585` — `// ejbQl.append("AND a.registrado = 't' ");` · `D/services/boleto/BoletoService.java:180-194`.
**O que ainda falta decidir:** não achei baixa ou cancelamento do boleto antigo no banco quando o valor muda; confirmar com a tesouraria o que acontece com o título registrado (fica com o valor velho?).

### sigfin--calculo-mensalidade--5
**Pergunta:** (proposta) A agência só se escolhe com "Registrar boleto" ligado.
**Veredito:** RESPONDIDA
**Resposta:** O sistema atual **já faz** o que a proposta diz. O seletor de agência fica desabilitado enquanto "Registrar Boleto" está em "Não"; ligado, a agência é obrigatória ("Selecione a agência") e o botão muda para "Salvar e imprimir boleto".
**Evidência:** `P/calculomensalidade/calculomensalidade.xhtml:93-94` — `required="true" requiredMessage="Selecione a agência" ... disabled="#{not calculomensalidadeHelper.gerarboleto}"` · `:107`.
**O que ainda falta decidir:** nada.

### sigfin--calculo-mensalidade--6
**Pergunta:** Quem pode recalcular a mensalidade de um aluno, e se o recálculo fica registrado com autor.
**Veredito:** RESPONDIDA
**Resposta:** Quem tem a tela no menu pode recalcular. A única alçada no código é a do boleto: com boleto emitido (e sem bolsa nem convênio), só os grupos **ADFIN** (administrador financeiro) e **DIR** (direção). Fica registrado: a mensalidade grava o usuário do cálculo e a data de alteração, e toda gravação passa pelo log de auditoria (usuário, IP, tela, estado do registro). Não se guarda o valor anterior de forma legível: as linhas da composição antiga são apagadas (exclusão lógica).
No serviço novo (`financeiro-backend`) a mensalidade salva pelo lote recebe **um usuário fixo escrito no código**, não quem pediu.
**Evidência:** `D/services/LoginService.java:88-89` — `verificaGrupo(usuario, ADMINISTRADOR_FINANCEIRO, unidade) || verificaGrupo(usuario, DIRECAO, unidade)` · `D/services/calculomensalidade/CalculoMensalidadeService.java:133,155` — `obj.setUsuario(usuario); ... obj.setDataalteracao(...)` · `FB/service/calculomensalidade/CalculoMensalidadeService.java:233` — `mensalidade.setOidusuario("…")` (identificador fixo).
**O que ainda falta decidir:** se o recálculo deve guardar motivo e valor anterior; corrigir o autor fixo no serviço novo.

### sigfin--relatorio-filtros--5
**Pergunta:** Consultar um ano só é regra do negócio ou limite do serviço?
**Veredito:** RESPONDIDA
**Resposta:** É **limite do serviço**, e só do relatório de mensalidades em aberto. O endereço recebe um `ano` e dois meses (`mesinicio`, `mesfim`); a consulta filtra `ano = :ano`. Mas o limite carrega uma definição: o relatório também traz mensalidades do ano **já pagas depois de 31/12 daquele ano** (estavam em aberto na virada). Dividir em várias consultas, uma por ano, é seguro. Inadimplência e receita diária aceitam período livre.
**Evidência:** `RC/controller/mensalidade/ControllerMensalidadeEmAberto.java:38-41` — `@RequestParam Integer ano, @RequestParam Integer mesinicio, @RequestParam Integer mesfim` · `RC/repository/Queries/Queries.java:289-295` — `where ano = :ano and mes >= :mesinicio and mes <= :mesfim and pago is false ... UNION ... pago is true ... and datapagamento > TO_DATE(concat(:ano, '-12-31'), 'YYYY-MM-DD')`.
**O que ainda falta decidir:** se a tela divide por ano e soma, ou mantém um ano por consulta deixando claro o porquê.

### sigfin--relatorio-filtros--6
**Pergunta:** (proposta) O relatório é gerado quando a pessoa pede, não a cada campo alterado.
**Veredito:** RESPONDIDA
**Resposta:** O servidor não trata disso: cada consulta é um GET sem estado. Quem dispara é o front, e o front atual faz **o contrário** da proposta (consulta sozinho quando o filtro fica válido). Do lado do servidor a proposta é segura e desejável: as consultas não têm paginação (inadimplência devolve a lista inteira) e a exportação já é um processo à parte, em fila, apagado depois de 30 minutos.
**Evidência:** `RC/controller/ControllerInadimplente.java:22-29` (GET simples, devolve `List`) · `RC/service/CronService.java:17-30` — `@Scheduled(cron = "* */30 * * * ?") ... plusMinutes(30)` · front: `APPSUCAM/levantamentos/rel-contabilidade-frontend.md`, regra 6.
**O que ainda falta decidir:** nada no servidor.

### sigfin--relatorio-filtros--7
**Pergunta:** Quem pode gerar cada relatório.
**Veredito:** RESPONDIDA
**Resposta:** Hoje **não há controle nenhum no servidor**. Nenhum endereço de relatório verifica perfil, grupo ou unidade do usuário. O filtro de autenticação só copia os cabeçalhos e segue adiante; ele não valida o token. O cabeçalho `oidunidade` serve apenas para escolher o banco (Campos, Rio ou EAD). O próprio repositório registra a pendência.
**Evidência:** `RC/webfilter/AuthenticateFilter.java:26-31` — `headers.set("Authorization", ...); ... chain.doFilter(request, response);` · `RC/webfilter/tenance/DataSourceIntercetor.java:14-26` · `rel-contabilidade-backend/TODO.md:7` — "Implementar o login."
**O que ainda falta decidir:** a matriz de quem vê o quê (decisão da gestão de acessos) e onde ela passa a ser verificada. Hoje a restrição seria só esconder o menu.

### sigfin--inadimplencia--4
**Pergunta:** A partir de quantos dias de atraso a parcela entra, e se parcela em acordo conta.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Entra **no dia seguinte ao vencimento**: a condição é "não pago e vencimento anterior a hoje". Não há carência, e o vencimento usado é o nominal (feriado e fim de semana não são considerados aqui: vencimento no sábado já aparece no domingo). O relatório **não filtra o tipo** do título, então parcela de acordo vencida e não paga entra junto com mensalidade (o relatório de mensalidades em aberto, ao contrário, filtra `tipo = 'MENSALIDADE'`). A mensalidade que foi negociada deixa de aparecer se a carga a marca como paga com origem "ACORDO"; isso depende da carga, que não está nos repositórios.
Atenção: o período é comparado como texto (`ano || mes`), sem zero à esquerda no mês, o que pode embaralhar meses de um e de dois dígitos.
**Evidência:** `RC/repository/Queries/Queries.java:242-247` — `where pago = false ... and cast(ano as varchar) || cast(mes as varchar) >= :inicio and ... <= :fim and datavencimento < CURRENT_DATE`.
**O que ainda falta decidir:** se há carência; se acordo aparece separado; conferir com quem mantém a carga como a mensalidade negociada é marcada.

### sigfin--inadimplencia--5
**Pergunta:** O valor mostrado inclui juros e multa?
**Veredito:** RESPONDIDA
**Resposta:** **Não inclui.** A consulta devolve o valor líquido e o valor bruto da parcela; multa e juros não são selecionados (eles só existem na tabela depois do pagamento). A suposição da tela está certa. O valor também não inclui a bolsa que o aluno perde ao atrasar, então o que ele deve de fato no caixa é maior que o mostrado.
**Evidência:** `RC/repository/Queries/Queries.java:243-244` — `... matriculaaluno, nomealuno, periodo, valorliquido, datavencimento, periodo, valorbruto From public.financeiroaluno`.
**O que ainda falta decidir:** se o relatório deve mostrar também o valor atualizado (com bolsa perdida, multa e juros), e dizer qual dos dois é o total.

### sigfin--inadimplencia--6
**Pergunta:** Quem pode ver a lista de inadimplentes com nome e matrícula.
**Veredito:** RESPONDIDA
**Resposta:** Hoje, **qualquer um que alcance o serviço**. O endereço `/inadimplente` devolve matrícula, nome, curso, unidade e valores sem checar perfil nem unidade do usuário (ver relatorio-filtros--7). A unidade é um parâmetro livre, que aceita "TODOS".
**Evidência:** `RC/controller/ControllerInadimplente.java:22-29` · `RC/repository/Queries/Queries.java:10` — `('TODOS' in (:unidade) OR nomeunidade in (:unidade))`.
**O que ainda falta decidir:** a regra de acesso (encarregado de dados) e o registro de quem consultou. O serviço não guarda log de consulta.

### sigfin--inadimplencia--7
**Pergunta:** (proposta) O relatório só consulta quando a pessoa aplica os filtros.
**Veredito:** RESPONDIDA
**Resposta:** Mesmo caso de relatorio-filtros--6: o servidor não trata; o front atual faz o contrário. A consulta de inadimplência não tem paginação nem limite de linhas, o que reforça a proposta.
**Evidência:** `RC/repository/inadimplente/RepositoryInadimplente.java:35-39` (sem paginação) · `APPSUCAM/levantamentos/rel-contabilidade-frontend.md`, regra 6.
**O que ainda falta decidir:** nada no servidor.

### sigfin--recebimentos--4
**Pergunta:** Cheque pré-datado entra no total no dia em que é recebido ou quando compensa?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O total do dia soma **cinco origens**: banco, depósito, cartão, cheque e dinheiro (acordo e "outros" ficam de fora). Com o filtro "data de pagamento" (o padrão), o cheque entra **no dia em que foi recebido no caixa**, não na compensação. Com o filtro "data de crédito", a consulta usa a coluna de crédito; no SigFin essa data só é gravada pelo retorno bancário de boleto, então cheque tende a ficar de fora nesse modo. Não confirmei isso na carga da tabela analítica.
**Evidência:** `RC/repository/Queries/Queries.java:137-138` — `where origempagamento in('BANCO','DEPOSITO','CARTAO','CHEQUE','DINHEIRO') ... and datapagamento BETWEEN :inicio and :fim` · `:164-165` (`datacredito BETWEEN`) · `D/services/retornoremessa/RetornoRemessaService.java:162` — `origem.setDatacredito(...)` (único ponto que grava a data de crédito).
**O que ainda falta decidir:** se cheque pré deve contar como receita do dia (hoje conta) ou só no bom-para; cheque devolvido não sai do total.

### sigfin--recebimentos--5
**Pergunta:** Multa e juros estão dentro do valor recebido de cada banco ou somados à parte?
**Veredito:** RESPONDIDA
**Resposta:** Estão **dentro**. O valor recebido já contém multa e juros; a coluna "multa e juros" é informativa e **não deve ser somada** ao total. A prova está na consulta irmã, que calcula o líquido como recebido − juros − multa. O total do dia é a soma do valor recebido, só.
**Evidência:** `RC/repository/Queries/Queries.java:150` — `sum(coalesce(multa,0) + coalesce(juros,0)) as multajuros, ..., sum(valorrecebido) as valorrecebido` · `:204-205` — `( valorrecebido - juros - multa ) as valorliquidorecebido, ... valorrecebido as valorbrutorecebido`.
**O que ainda falta decidir:** nada; a tela deve dizer "incluídos no total".

### sigfin--recebimentos--6
**Pergunta:** Pix, cartão e boleto entram na coluna do banco que os liquida ou pedem coluna própria?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O sistema só conhece sete origens: banco, depósito, dinheiro, cheque, cartão, acordo e outros. **Pix não existe como origem.** Boleto é "banco" e cai na coluna do banco. Cartão recebido no caixa é "cartão" e cai em tesouraria (classificação feita no front). Pagamento on-line pelo gateway (boleto, cartão ou Pix) é gravado como origem **banco**, então hoje Pix e cartão on-line aparecem na coluna de um banco, misturados com boleto.
**Evidência:** `GW/enums/OrigemPagamentoEnum.java` — `DEPOSITO, DINHEIRO, CHEQUE, ACORDO, CARTAO, OUTROS, BANCO` · `GW/enums/BillingTypeEnum.java` — `BOLETO, CREDIT_CARD, PIX` · `GW/repository/PaymentRepository.java:340-342,448` — `INSERT_ORIGEMPAGAMENTOBANCO`.
**O que ainda falta decidir:** se Pix e cartão on-line ganham coluna; para isso a forma de pagamento teria de chegar à tabela analítica, e não vi essa coluna nela (`FB/model/analytics/FinanceiroAluno.java`).

### sigfin--recebimentos--7
**Pergunta:** (proposta) Dia sem expediente não aparece como linha; a tela diz quais dias foram pulados.
**Veredito:** RESPONDIDA
**Resposta:** A primeira metade o sistema **já faz**, por construção: a consulta agrupa por data de pagamento, então só existe linha para dia com recebimento. A segunda metade o sistema **não trata**: não devolve os dias sem movimento nem distingue "sem expediente" de "dia útil sem recebimento". O serviço de relatórios não consulta o cadastro de feriados.
**Evidência:** `RC/repository/Queries/Queries.java:140` — `GROUP BY datapagamento, banco, modalidade, unidadepagamento, ano, agencia, conta, origempagamento`.
**O que ainda falta decidir:** de onde a tela tira a lista de dias pulados (o calendário de feriados bancários está no SigFin, outro sistema).

### sigfin--tipos-bolsa--5
**Pergunta:** (proposta) Tipo de bolsa em uso é inativado, não excluído.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O sistema **não tem "inativo"** para tipo de bolsa. Excluir é sempre exclusão lógica (o registro continua no banco com situação "D" e some das listas). Antes, uma função do banco verifica dependências; havendo, a exclusão é recusada com "Não foi possível excluir este registro pois o mesmo possue dependencias!". Ou seja: tipo em uso **não sai**, nem excluído nem inativado. Se alguém cadastra de novo algo igual a um excluído, o sistema oferece restaurar ("Já existe um registro deletado com essas informações!").
**Evidência:** `D/persistence/repositories/RepositorioAbstract.java:106-110` — `validaExclusao(obj); obj.setStatus("D");` · `:221` — `select valida_exclusao('"+nomeTabela+"','"+obj.getOid()+"')` · `W/generic/GenericHelperJSF.java:167-168`.
**O que ainda falta decidir:** o que a função considera dependência (corpo no banco, não lido); se o novo sistema cria o estado "inativo", que hoje não existe.

### sigfin--tipos-bolsa--6
**Pergunta:** O que acontece com as bolsas já concedidas quando o tipo muda de marcação.
**Veredito:** RESPONDIDA
**Resposta:** Nada é recalculado na hora; cada marcação age num momento diferente.
- **Valor integral**: lida só no cálculo. Mensalidades já calculadas ficam como estão; a mudança vale do próximo cálculo ou recálculo em diante.
- **Aplicar desconto de antecipação**: lida **no recebimento e na emissão do boleto**. Vale na hora para todas as mensalidades em aberto de quem tem a bolsa, sem recálculo.
- **Retirar IGP-M**: lida só no cálculo, e só no roteiro de extensão/pós.
**Evidência:** `D/services/calculomensalidade/etapas/EtapaBolsa.java:60` · `D/services/MensalidadeService.java:768-776` — `if(!...getTipobolsa().isDesconto()) return BigDecimal.ZERO;` · `D/services/calculomensalidade/etapas/EtapaIGPM.java:59-61`.
**O que ainda falta decidir:** se mudar a marcação deve avisar quantas mensalidades em aberto são afetadas, e se dispara recálculo.

### sigfin--tipo-bolsa-form--2
**Pergunta:** As três marcações são independentes, ou alguma combinação é proibida?
**Veredito:** RESPONDIDA
**Resposta:** **Independentes.** São três campos sim/não sem validação cruzada, na tela e na entidade. Elas agem em pontos diferentes (base da bolsa; desconto de pontualidade; IGP-M), então nenhuma combinação quebra a conta. "Valor integral" com "aplicar desconto de antecipação" é combinação válida e usada: a bolsa incide sobre o bruto e os 5% incidem sobre o líquido final.
**Evidência:** `D/entities/financeiro/Tipobolsa.java:48,56,58` — `private boolean valorintegral; ... private boolean desconto; private boolean retirarigpm;` · `P/tipobolsa/tipobolsa.xhtml:69-78` (três botões sem regra entre si).
**O que ainda falta decidir:** nada. O rótulo de "retirar IGP-M" deve dizer que só vale para extensão e pós.

### sigfin--tipo-bolsa-form--3
**Pergunta:** Como a regressão por dia de vencimento entra na conta: substitui o percentual da bolsa ou soma?
**Veredito:** RESPONDIDA
**Resposta:** **Soma**, e não mexe na bolsa. A regressão é uma escada de descontos por data, aplicada **no recebimento**, sobre o valor líquido (que já tem a bolsa descontada). Cada degrau tem: dia (0 = o próprio vencimento; outro número = aquele dia do mês anterior ao vencimento), valor ou percentual, e a marca "incremental" (o percentual incide sobre o valor já reduzido pelos degraus anteriores, em vez do líquido cheio). Os degraus se acumulam do mais tardio para o mais cedo: quem paga mais cedo leva a soma de todos. Só vale para o aluno que tem um vínculo de regressão cadastrado para aquele tipo de bolsa e período. No recebimento vale o desconto de data-limite mais próxima que ainda cobre a data do pagamento; ele concorre com os 5% padrão, não se soma a eles.
Há ainda uma escada fixa no código (0%, 7%, 12%, 20%, 27%, um degrau a cada 2 dias úteis) para quatro unidades e ingressantes antes de 2021.
**Evidência:** `D/services/MensalidadeService.java:1325-1383` — `if(obj.isDescontoincremental()) valorBase = valorAnterior; ... valorDesconto = valorDesconto.add(valorBase.multiply(obj.getValor()).divide(CEM));` · `:1462-1467` — `.filter(datapagamento <= dataLimite).sorted(...).findFirst()` · `:1477-1513` · `D/entities/financeiro/Regressaobolsavencimento.java:28-34`.
**O que ainda falta decidir:** a tela de referência precisa mostrar "incremental" e o significado do dia 0; confirmar se a escada fixa ainda está em uso.

### sigfin--convenios--4
**Pergunta:** (proposta) Convênio com alunos vinculados é inativado, não excluído.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Igual ao tipo de bolsa: **não existe "inativo"**. Excluir é exclusão lógica, recusada pela função do banco quando há dependência. Convênio com alunos vinculados, portanto, não sai de jeito nenhum. O que existe de parecido é por aluno: o vínculo aluno-convênio tem período (início e fim), situação e estorno, e há um bloqueio de convênio por período.
**Evidência:** `D/persistence/repositories/RepositorioAbstract.java:106-110,221` · `D/entities/financeiro/Alunoconvenio.java:40-51,68` · `D/persistence/repositories/RepositorioBloqueioconvenio.java:31` — `AND a.bloqueado = true`.
**O que ainda falta decidir:** o corpo de `valida_exclusao`; se "inativar convênio" passa a existir, e o que acontece com os vínculos vigentes.

### sigfin--convenios--5
**Pergunta:** Quando o convênio não é de valor integral, onde se define o percentual que ele cobre.
**Veredito:** RESPONDIDA
**Resposta:** O percentual (ou o valor fixo) é definido **no vínculo do aluno com o convênio**, não no convênio: cada vínculo tem valor, a marca "é percentual", início, fim e situação. O cadastro do convênio só tem código, descrição e as duas marcações. E hoje **as duas marcações não mudam a conta**: com "valor integral" ligado ou desligado a base é o mesmo valor bruto, e o trecho que tiraria a dependência da base quando o convênio "não paga dependência" está comentado.
**Evidência:** `D/services/calculomensalidade/etapas/EtapaConvenio.java:70-76` — os dois ramos fazem `novoValorBruto = mensalidade.getValorbruto();` · `:77-89` (bloco comentado) · `:95-101` — `if(alunoconvenio.isPercentual()) ... alunoconvenio.getValor()` · `D/entities/financeiro/Alunoconvenio.java:64,74`.
**O que ainda falta decidir:** se as duas marcações devem voltar a ter efeito ou sair da tela; hoje são decorativas.

### sigfin--convenio-form--2
**Pergunta:** O código do convênio pode repetir entre unidades?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** No SigFin o convênio **não pertence a unidade**: a entidade não tem esse campo e a tela lista todos. É um cadastro único da instituição, então "repetir entre unidades" nem se coloca. Se o código pode repetir é decidido pela função `verifica_unique` do banco, que não li. O tipo de bolsa, ao contrário, tem unidade. O front novo (`financeiro-front-end`) preenche unidade ao salvar convênio, o que indica que o modelo novo é por unidade: há divergência entre os dois.
**Evidência:** `D/entities/financeiro/Convenio.java:25-37` (oid, codigo, descricao, pagadependencia, valorintegral, status; sem unidade) · `D/entities/financeiro/Tipobolsa.java:52-54` (com unidade) · `D/persistence/repositories/RepositorioAbstract.java:253` · `APPSUCAM/levantamentos/financeiro-front-end.md`, regra 5.
**O que ainda falta decidir:** se convênio é da instituição ou da unidade; ler a restrição de unicidade no banco.

### sigfin--bancos--5
**Pergunta:** Banco com boletos em aberto pode ser inativado, e o que acontece com esses boletos.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O que se ativa e desativa é a **agência** (agência + cedente + carteira), não o banco. Desativar não verifica nada: é só trocar o campo. O efeito é a agência sair das listas de escolha (cálculo com boleto, fechamento de caixa). Os boletos já emitidos por ela **não são tocados**: continuam válidos e o retorno bancário continua dando baixa. O banco em si não tem "inativo"; só exclusão lógica, sujeita à checagem de dependências do banco de dados.
**Evidência:** `W/TipobancoHelper.java:175-179` — `this.agenciabancaria.setAtivo(false); this.repositorioAgenciabancaria.editar(this.agenciabancaria);` · `D/persistence/repositories/RepositorioAgenciabancaria.java:26` — `AND a.ativo is true`.
**O que ainda falta decidir:** se desativar deve avisar quantos boletos em aberto existem; o que `valida_exclusao` impede no banco.

### sigfin--banco-form--1
**Pergunta:** Quais campos do banco são obrigatórios; a tela marca os três.
**Veredito:** RESPONDIDA
**Resposta:** Os três: **código, descrição e sigla** são obrigatórios na entidade. A tela de referência está certa. A página antiga não marca nenhum como obrigatório, a validação é só a da entidade. Na agência, são obrigatórios agência, cedente e sigla.
**Evidência:** `D/entities/financeiro/Tipobanco.java:30-37` — `@NotNull(message="O campo código não pode ser nulo") ... descrição ... sigla` · `D/entities/financeiro/Agenciabancaria.java:33,43,78`.
**O que ainda falta decidir:** nada.

### sigfin--banco-form--2
**Pergunta:** O código do banco é o de compensação, com 3 dígitos, e não pode repetir.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O código **é usado como código de compensação**: é por ele que o sistema escolhe o leiaute do boleto (756 Sicoob, 001 Banco do Brasil, 033 Santander, 389 Mercantil; qualquer outro é procurado pelo número). Mas **não é validado**: campo de texto livre, sem máscara nem tamanho. E há exceção em uso: o código "707" é tratado como Itaú (341) e "719" como Banif, isto é, existem códigos internos que não são de compensação. Se pode repetir depende da função `verifica_unique` do banco, não lida.
**Evidência:** `D/services/boleto/BoletoService.java:553-571` — `getCodigo().equals("756") → Sicoob ... equals("707") → Bancos.getPorNumero("341") ... else Bancos.getPorNumero(codigo)` · `P/tipobanco/tipobanco.xhtml:59` (campo sem máscara).
**O que ainda falta decidir:** se a tela impõe 3 dígitos (quebraria "707" se ele não for de compensação de fato; conferir com a tesouraria por que existe); a unicidade no banco.

### sigfin--feriados-bancarios--2
**Pergunta:** Vencimento em feriado vai para o dia útil seguinte ou anterior, e o desconto de antecipação acompanha?
**Veredito:** RESPONDIDA
**Resposta:** Vai para o **dia útil seguinte**. A data gravada na mensalidade não muda; o que se empurra é o vencimento efetivo, em dois lugares: na contagem dos dias de atraso (multa e juros só contam depois do primeiro dia bancário igual ou posterior ao vencimento) e na data impressa no boleto. Dia bancário = não é sábado, não é domingo e não está no cadastro de feriados.
O desconto **não acompanha** para a frente. A data padrão de desconto é o último dia bancário do mês anterior ao vencimento, e essa recua (se cair em feriado ou fim de semana, vale o dia útil anterior). Data de antecipação cadastrada à mão, ou dia próprio do aluno, vale como está, sem ajuste.
O gateway de pagamento on-line e os relatórios contábeis **não consultam feriado**: contam atraso em dias corridos a partir do vencimento nominal.
**Evidência:** `D/services/UtilService.java:478-482` — `while(!isDiaBancario(vencimentoEfetivo)) vencimentoEfetivo = vencimentoEfetivo.plusDays(1);` · `:503-510` (boleto) · `:513-523` — `ultimoDiaMestAnteriorVencimento.minusDays(1)` · `:548-560` · `GW/service/CobrancaMensalidadeService.java:129` — `ChronoUnit.DAYS.between(dataVencimento, dataAtual)`.
**O que ainda falta decidir:** alinhar o gateway on-line e os relatórios com a regra do feriado; hoje o mesmo aluno pode estar "em dia" no caixa e "em atraso" no pagamento on-line.

### sigfin--feriados-bancarios--3
**Pergunta:** Os feriados valem para todas as unidades ou cada unidade cadastra os seus?
**Veredito:** RESPONDIDA
**Resposta:** Valem para **todas**. O feriado tem só data e descrição, sem unidade, e a consulta que decide se um dia é bancário procura pela data apenas. Um feriado municipal de Campos, se cadastrado, adia vencimentos também no Rio.
**Evidência:** `D/entities/financeiro/Feriadobancario.java:34-40` (oid, data, status, descricao) · `D/persistence/repositories/RepositorioFeriadobancario.java:19-22` — `WHERE a.data = '#{data}' and a.status = 'A'`.
**O que ainda falta decidir:** se feriado municipal passa a ter unidade ou cidade; hoje a única saída é não cadastrar os municipais.

### sigfin--feriados-bancarios--4
**Pergunta:** (proposta) Feriado pode ser inativado sem ser apagado.
**Veredito:** RESPONDIDA
**Resposta:** O sistema **não trata** "inativo", mas o efeito pedido já existe no excluir: excluir é exclusão lógica (o registro fica no banco com situação "D" e deixa de adiar vencimento, porque a consulta só lê os ativos). Para voltar, cadastra-se de novo a mesma data e o sistema oferece restaurar. O que falta é a visibilidade: feriado excluído some da lista.
**Evidência:** `D/persistence/repositories/RepositorioAbstract.java:109` — `obj.setStatus("D");` · `D/persistence/repositories/RepositorioFeriadobancario.java:22` · `W/generic/GenericHelperJSF.java:104-107` — "Já existe um registro deletado com essas informações!".
**O que ainda falta decidir:** se vale criar um terceiro estado ou só mostrar os excluídos com opção de restaurar. Excluir ou inativar feriado passado muda a contagem de atraso de quem ainda não pagou.

### sigfin--feriados-bancarios--5
**Pergunta:** Feriado em fim de semana precisa ser cadastrado?
**Veredito:** RESPONDIDA
**Resposta:** **Não precisa.** Sábado e domingo já são tratados como não bancários antes de o cadastro ser consultado. Cadastrar não causa erro, só não tem efeito.
**Evidência:** `D/services/UtilService.java:549-553` — `if(data.getDayOfWeek() == SATURDAY) return false; else if(... == SUNDAY) return false;`.
**O que ainda falta decidir:** se a tela avisa ("cai num sábado; não muda vencimento") ou impede.

### sigfin--feriado-form--2
**Pergunta:** Pode haver dois feriados na mesma data?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O código Java não impede e não se atrapalha: a consulta de dia bancário pega o primeiro feriado da data e basta. Se o cadastro recusa a segunda linha depende da função `verifica_unique` do banco, não lida. Data e descrição são obrigatórias na tela.
**Evidência:** `D/persistence/repositories/RepositorioAbstract.java:185-191` — `findSqlCreatePaginate(sql,0,1)` · `P/feriadobancario/feriadobancario.xhtml:56-64` — `required="true" requiredMessage="Informe a data" ... "Informe a descrição"`.
**O que ainda falta decidir:** ler a restrição no banco. Como o feriado é global e o efeito é o mesmo com uma ou duas linhas, a proposta natural é uma data, um feriado.

---

## Descobertas fora da lista

Regras do servidor que as telas de referência não consideram.

1. **Quem atrasa perde a bolsa do mês.** Depois do vencimento, o valor a receber é o líquido mais o valor de todas as bolsas, e multa e juros incidem sobre essa soma. A tela de cálculo mostra só "+ multa de 2% e juros de 1% a.m.". `D/services/MensalidadeService.java:224-246,256`.

2. **O pagamento on-line usa outra conta de atraso.** No gateway a bolsa continua descontada após o vencimento, a multa é 2% sobre o valor com bolsa, os juros são 0,033% ao dia sobre (valor + multa), em dias corridos e sem feriado. No caixa a base inclui a bolsa perdida, os juros não incidem sobre a multa e o feriado empurra o vencimento. Dois valores para a mesma dívida. `GW/service/CobrancaMensalidadeService.java:27-30,81,129-133,184-187`.

3. **Há duas fórmulas de juros dentro do próprio SigFin.** O recebimento calcula juros sobre (líquido + bolsa); a renegociação/alternância de juros na dívida calcula sobre (líquido + bolsa + multa). `D/services/MensalidadeService.java:245` × `D/adapter/CobrancaItemAbstract.java:263-265`.

4. **Desconto de pontualidade é 5%, único para todas as unidades desde 03/01/2024**, e some se o aluno tem bolsa de tipo sem desconto. As regras antigas por campus (sem desconto em janeiro e julho etc.) continuam no arquivo, sem uso. A tela de referência mostra 8%. `D/services/MensalidadeService.java:616-622,759-812`.

5. **O convênio gera uma segunda mensalidade.** Ao aplicar convênio, o sistema cria uma mensalidade do tipo CONVÊNIO com o valor coberto, a ser baixada contra o conveniado. A composição mostrada ao aluno é só metade da história. `D/services/calculomensalidade/etapas/EtapaConvenio.java:118-145`.

6. **Mensalidade calculada com valor zero ou negativo nasce quitada**, com data de baixa de hoje (bolsa de 100%, por exemplo). `D/services/calculomensalidade/CalculoMensalidadeService.java:156-159`.

7. **A etapa de dependência está desligada.** O roteiro de Campos ainda chama a etapa, mas o corpo inteiro está comentado: disciplina em dependência não é cobrada por ali. A tela de referência mostra "Disciplina em dependência + R$ 248,00". `D/services/calculomensalidade/etapas/EtapaDependencia.java:61-108`.

8. **Disciplina excedente custa bruto ÷ máximo de disciplinas do período**, por disciplina além do máximo, descontadas as isentas de cobrança. Plano diferenciado só cobra se marcado para isso. `D/services/calculomensalidade/etapas/EtapaDisciplinasExcedentes.java:75-90`.

9. **Reemitir boleto de mensalidade vencida troca o vencimento da mensalidade para hoje.** A data original se perde no registro, o que muda a contagem de atraso e a inadimplência dali em diante. `D/services/boleto/BoletoService.java:180-186` · `D/services/MensalidadeService.java:1650-1655`.

10. **Regras escritas por código de unidade, de bolsa e de curso.** Exemplos: bolsa "174" em Méier e Tijuca (unid24, unid21) com escada própria de 5 em 5 dias; Araruama (unid14) com desconto 5 dias antes; em Campos (unid01) uma lista de tipos de bolsa bloqueia os descontos de turno; regressão para quatro unidades e ingresso antes de 2021. Um cadastro novo de tipo de bolsa não reproduz isso. `D/services/MensalidadeService.java:1072,1394-1418` · `D/services/calculomensalidade/etapas/EtapaDescontos.java:85-86` · `D/services/remessabancaria/ArquivoRemessaService.java:169-177`.

11. **O arredondamento não é o mesmo nos dois servidores, e um deles usa ponto flutuante.** SigFin: `BigDecimal`, 2 casas, meio para cima (o líquido após convênio usa meio para baixo). `financeiro-backend`: contas em `Double`, arredondadas no fim para 2 casas, meio para baixo. Diferenças de um centavo entre o lote novo e o cálculo antigo são esperadas. `D/services/calculomensalidade/etapas/EtapaConvenio.java:116` · `FB/util/DoubleUtil.java:8-11`.

12. **O lote novo soma percentuais; o antigo aplica em sequência.** No `financeiro-backend`, bolsa % + descontos % − acréscimos % viram um percentual só, limitado a 0–100; não há convênio, turno, escola pública nem disciplina excedente. O levantamento do front dizia "em cascata"; no servidor é soma. `FB/service/calculomensalidade/template/CalculoMensalidadeTemplate.java:79-114`.

13. **Mensalidades em aberto inclui o que foi pago depois da virada do ano.** O relatório de um ano traz também as parcelas daquele ano quitadas após 31/12. `RC/repository/Queries/Queries.java:291-295`.

14. **Só dois grupos têm alçada no código: ADFIN e DIR** (administrador), e um grupo restritivo, EST_TESOU (estagiário da tesouraria, usado para esconder ações na ficha financeira; as condições exatas não foram lidas até o fim). Tudo o mais é permissão de menu. Não há limite de valor para desconto, estorno ou acordo. `D/services/Constantes.java:46-51` · `D/services/LoginService.java:88-94` · `P/fichafianceira/fichafinanceira.xhtml:367-380,728`.

15. **O acordo divide o débito em parcelas iguais e joga a diferença de centavos na última.** O "juro do acordo" nos relatórios é calculado por diferença (total dos débitos − total do acordo), não lido de um campo; há um comentário no código pedindo revisão. `D/services/AcordoService.java:112,163-166` · `D/persistence/repositories/RepositorioAcordo.java:160,183`.
