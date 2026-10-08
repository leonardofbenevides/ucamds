# Perguntas e propostas do projeto SigFin (36)

Cada linha: **id** [situação] (tela) texto — quem decide.

- **sigfin--movimento-caixa--2** [proposta] (Movimento de caixa) Fechar o caixa trava novos lançamentos do dia. — decide: Financeiro (tesouraria)
- **sigfin--movimento-caixa--3** [aberta] (Movimento de caixa) Quem pode reabrir um caixa fechado, até quando, e se a reabertura fica registrada. — decide: Financeiro (tesouraria)
- **sigfin--movimento-caixa--4** [aberta] (Movimento de caixa) O caixa é por pessoa, por guichê ou por unidade? A tela mostra quem abriu, mas não diz se outra pessoa lança no mesmo caixa. — decide: Financeiro (tesouraria)
- **sigfin--movimento-caixa--5** [aberta] (Movimento de caixa) Lançamento errado se corrige como: estorno com lançamento contrário, ou edição com registro. Excluir não aparece na tela. — decide: Financeiro (tesouraria)
- **sigfin--movimento-caixa--6** [aberta] (Movimento de caixa) O que é "vale" e "banco tesouraria" nos totais, e como entram no saldo do dia. — decide: Financeiro (tesouraria)
- **sigfin--calculo-mensalidade--2** [aberta] (Cálculo de mensalidade individual) A ordem dos descontos (bolsa, convênio, dependência, pontualidade): cada um incide sobre o valor de tabela ou sobre o valor já descontado. — decide: Financeiro (tesouraria)
- **sigfin--calculo-mensalidade--3** [aberta] (Cálculo de mensalidade individual) As três faixas de data e o valor de cada uma: de onde vêm, e se o aluno pode ter faixa diferente. — decide: Financeiro (tesouraria)
- **sigfin--calculo-mensalidade--4** [aberta] (Cálculo de mensalidade individual) Recalcular uma mensalidade que já tem boleto registrado cancela o boleto anterior? — decide: Financeiro (tesouraria)
- **sigfin--calculo-mensalidade--5** [proposta] (Cálculo de mensalidade individual) A agência só se escolhe com "Registrar boleto" ligado. — decide: Financeiro (tesouraria)
- **sigfin--calculo-mensalidade--6** [aberta] (Cálculo de mensalidade individual) Quem pode recalcular a mensalidade de um aluno, e se o recálculo fica registrado com autor. — decide: Financeiro (tesouraria)
- **sigfin--relatorio-filtros--5** [aberta] (Filtros do relatório) Consultar um ano só é regra do negócio ou limite do serviço? Se for limite, a tela deveria dividir a consulta em vez de recusar. — decide: Controladoria
- **sigfin--relatorio-filtros--6** [proposta] (Filtros do relatório) O relatório é gerado quando a pessoa pede, não a cada campo alterado. — decide: Financeiro (tesouraria)
- **sigfin--relatorio-filtros--7** [aberta] (Filtros do relatório) Quem pode gerar cada relatório. Hoje qualquer usuário autenticado gera todos. — decide: Gestão de acessos
- **sigfin--inadimplencia--4** [aberta] (Inadimplência) A partir de quantos dias de atraso a parcela entra no relatório, e se parcela em acordo conta como inadimplente. — decide: Financeiro (tesouraria)
- **sigfin--inadimplencia--5** [aberta] (Inadimplência) O valor mostrado inclui juros e multa? A tela supõe que não: é o valor líquido da parcela. — decide: Controladoria
- **sigfin--inadimplencia--6** [aberta] (Inadimplência) Quem pode ver a lista de inadimplentes com nome e matrícula. Hoje o relatório abre para qualquer usuário autenticado. — decide: Encarregado de dados (LGPD)
- **sigfin--inadimplencia--7** [proposta] (Inadimplência) O relatório só consulta quando a pessoa aplica os filtros, não a cada campo alterado. — decide: Financeiro (tesouraria)
- **sigfin--recebimentos--4** [aberta] (Recebimentos por dia) O total do dia soma bancos e tesouraria. Cheque pré-datado entra nesse total no dia em que é recebido ou só quando compensa? — decide: Controladoria
- **sigfin--recebimentos--5** [aberta] (Recebimentos por dia) Multa e juros estão dentro do valor recebido de cada banco ou são somados à parte. — decide: Controladoria
- **sigfin--recebimentos--6** [aberta] (Recebimentos por dia) Pix, cartão e boleto entram na coluna do banco que os liquida ou pedem coluna própria. — decide: Financeiro (tesouraria)
- **sigfin--recebimentos--7** [proposta] (Recebimentos por dia) Dia sem expediente não aparece como linha; a tela diz quais dias do período foram pulados. — decide: Financeiro (tesouraria)
- **sigfin--tipos-bolsa--5** [proposta] (Tipos de bolsa) Tipo de bolsa em uso é inativado, não excluído: sai da lista de escolha e continua no histórico de quem já tem a bolsa. — decide: Financeiro (tesouraria)
- **sigfin--tipos-bolsa--6** [aberta] (Tipos de bolsa) O que acontece com as bolsas já concedidas quando o tipo muda de marcação: recalcula as mensalidades em aberto ou vale só para as novas. — decide: Controladoria
- **sigfin--tipo-bolsa-form--2** [aberta] (Novo tipo de bolsa) As três marcações são independentes, ou alguma combinação é proibida (por exemplo, valor integral com desconto de antecipação). — decide: Controladoria
- **sigfin--tipo-bolsa-form--3** [aberta] (Novo tipo de bolsa) Como a regressão por dia de vencimento entra na conta: substitui o percentual da bolsa ou soma a ele. — decide: Controladoria
- **sigfin--convenios--4** [proposta] (Convênios) Convênio com alunos vinculados é inativado, não excluído. — decide: Financeiro (tesouraria)
- **sigfin--convenios--5** [aberta] (Convênios) Quando o convênio não é de valor integral, onde se define o percentual que ele cobre. — decide: Controladoria
- **sigfin--convenio-form--2** [aberta] (Novo convênio) O código do convênio pode repetir entre unidades. — decide: Financeiro (tesouraria)
- **sigfin--bancos--5** [aberta] (Bancos e agências) Banco com boletos em aberto pode ser inativado, e o que acontece com esses boletos. — decide: Controladoria
- **sigfin--banco-form--1** [aberta] (Novo banco) Quais campos do banco são obrigatórios; a tela marca os três. — decide: Financeiro (tesouraria)
- **sigfin--banco-form--2** [aberta] (Novo banco) O código do banco é o de compensação, com 3 dígitos, e não pode repetir. — decide: Financeiro (tesouraria)
- **sigfin--feriados-bancarios--2** [aberta] (Feriados bancários) Vencimento que cai em feriado bancário vai para o dia útil seguinte ou para o anterior, e se o desconto de antecipação acompanha. — decide: Controladoria
- **sigfin--feriados-bancarios--3** [aberta] (Feriados bancários) Os feriados valem para todas as unidades ou cada unidade cadastra os seus (os municipais mudam de cidade para cidade). — decide: Financeiro (tesouraria)
- **sigfin--feriados-bancarios--4** [proposta] (Feriados bancários) Feriado pode ser inativado sem ser apagado: fica no cadastro e deixa de adiar vencimento. — decide: Financeiro (tesouraria)
- **sigfin--feriados-bancarios--5** [aberta] (Feriados bancários) Feriado em fim de semana precisa ser cadastrado? Ele não muda vencimento nenhum. — decide: Financeiro (tesouraria)
- **sigfin--feriado-form--2** [aberta] (Novo feriado) Pode haver dois feriados na mesma data. — decide: Financeiro (tesouraria)
