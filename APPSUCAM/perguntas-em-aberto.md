# Regras de negócio: o que falta decidir

Gerado em 06/10/2026 a partir das 80 telas de referência do UCAMDS. Cada tela declara as regras de
negócio que supõe; este documento reúne as que ainda não são regra.

- **186 perguntas em aberto**: a tela precisa da resposta e ninguém a deu ainda.
- **83 propostas**: o desenho escolheu um caminho que o sistema atual não segue, e alguém precisa confirmar.
- Outras 408 regras foram lidas no código dos sistemas e não estão aqui: já valem hoje.

Entre parênteses, no fim de cada item, está a tela em que a regra aparece.

## Quem decide

| Perguntas em aberto, por quem decide | Quantas |
|---|---|
| TI (dono do SIGU) | 53 |
| Secretaria acadêmica | 27 |
| Gestão do Protocolo | 25 |
| Gestão de acessos | 24 |
| Financeiro (tesouraria) | 19 |
| Comissão do vestibular | 14 |
| Encarregado de dados (LGPD) | 11 |
| Controladoria | 11 |
| Coordenação de curso | 2 |

| Propostas a confirmar, por quem decide | Quantas |
|---|---|
| TI (dono do SIGU) | 29 |
| Gestão do Protocolo | 20 |
| Secretaria acadêmica | 15 |
| Financeiro (tesouraria) | 13 |
| Coordenação de curso | 3 |
| Encarregado de dados (LGPD) | 2 |
| Gestão de acessos | 1 |

## Perguntas em aberto

### TI (dono do SIGU) (53)

**Sistema de Protocolo**

- A tela encaminha só com o setor. O nível e o despacho entram no diálogo, ou o nível deixa de ser escolhido. Falta decidir: Quem define o nível de destino. Enquanto o servidor for este, o diálogo precisa enviar setor, nível e texto. *(Caixa de entrada)*
- A tela encaminha só com o setor. O nível e o despacho entram no diálogo, ou o nível deixa de ser escolhido. Falta decidir: Quem define o nível de destino. *(Requerimento em página)*
- O código da natureza é único e muda depois de criado. Falta decidir: Se será criado um código legível. Se for, ele é novo; relatórios e integração hoje usam oid e descrição. Recriar um tipo muda o oid e quebra a regra do motivo no Portal. *(Nova natureza)*

**Portal Universitário**

- Até quando um sistema legado convive com o novo, e quem decide tirá-lo da grade. Falta decidir: O prazo e o responsável. E quem executa a retirada, já que nenhuma tela (nem do Gerencial novo) altera exibicaodashboard, aplicacaoendereco ou aplicacaousuario. *(Grade de módulos)*
- O que decide se um sistema aparece para a pessoa. Falta decidir: Quem mantém aplicacaousuario. O Gerencial antigo tinha a aba "Aplicações" no cadastro do usuário; o Gerencial novo não implementou esse vínculo (G3/docs/adr/0016-agregado-aplicacao.md:52 — "Aplicacaomantenedora/Aplicacaousuario (vínculos do legado) não implementados"). *(Grade de módulos)*
- Quais são as seções oficiais da grade. Falta decidir: A tela de referência precisa trocar "Presencial" (seção) por Campos, e prever ICAM. Falta decidir como mostrar duas seções com o mesmo nome (Rio presencial × Rio EAD). *(Grade de módulos)*
- Como se liga a conta Microsoft ou Google ao CPF: pelo e-mail institucional cadastrado, ou por um vínculo que a pessoa faz uma vez. *(Autenticação)*
- Quantas tentativas erradas bloqueiam o acesso e por quanto tempo. Falta decidir: Se haverá limite, de quantas tentativas, por quanto tempo, e onde contar (o Portal hoje não escreve nas bases além da senha, e a mesma pessoa tem contas em várias bases). *(Autenticação)*
- O que "Primeiro acesso" pede para provar quem é a pessoa. Falta decidir: O manual publicado (PV2/frontend/public/assets/docs/manual-primeiro-acesso.pdf, gerado de PV2/docs/manual-primeiro-acesso.html) diz que o código chega por SMS no celular; o servidor manda por e-mail (o envio de SMS é uma classe vazia). Um dos dois precisa ser corrigido. O manual também cita os endereços portal-v2.ucam-campos.br e portal-v2.candidomendes.edu.br. *(Autenticação)*
- Primeiro acesso e recuperação são o mesmo fluxo. Falta decidir: Se o primeiro acesso deve pedir prova extra. Hoje quem controla o e-mail cadastrado em uma base troca a senha em todas. *(Recuperar senha)*
- Quantos códigos errados encerram a tentativa. Falta decidir: O limite real, e amarrar o código ao CPF de quem pediu. Os códigos ficam em memória (um reinício do servidor apaga todos — SEC-005). *(Confirmar código)*
- Qual é a política de senha. Falta decidir: A política inteira. Atenção ao desenhar: o Gerencial novo grava senha em bcrypt na mesma coluna. *(Definir nova senha)*
- Trocar a senha encerra as sessões abertas em outros aparelhos. Falta decidir: Se deve encerrar. Hoje o depósito de tokens é em memória e indexado por token; encerrar "todas as sessões do CPF" exigiria varrer por usuário em cada base. *(Definir nova senha)*
- O servidor de cada sistema confere o token a cada chamada. Falta decidir: A regra para os sistemas novos. Os demais back-ends (protocolo, financeiro, secretaria etc.) não foram lidos nesta pesquisa. *(Abrindo o sistema)*
- Usuário sem nenhuma unidade vinculada: abre sem unidade ou é barrado. Falta decidir: A mensagem própria da tela de chegada e se o caso (a) deve barrar também. *(Abrindo o sistema)*
- O que estava sendo digitado é guardado como rascunho quando a sessão cai, ou se perde. *(Sessão encerrada)*
- Sair num sistema encerra a sessão em todos os outros abertos. Falta decidir: A regra desejada (sair de um = sair de todos?) e o que mostrar na tela do Portal quando o token dela foi apagado por outra aplicação. --- *(Sessão encerrada)*
- A pessoa é avisada antes de a sessão terminar e pode prorrogá-la. Falta decidir: Se haverá aviso e prorrogação. No Gerencial novo, prorrogar exige criar o endpoint de renovação. *(Sessão encerrada)*

**Relatórios Acadêmicos**

- O dado de matrícula é atualizado uma vez por dia. Falta decidir: de qual das duas fontes o novo catálogo vai ler. Se for da analítica, perguntar à TI a agenda da carga e gravar na tela a data da última, em vez de uma frase fixa. *(Filtros da consulta)*

**Módulo Gerencial**

- O que é "aguardando acesso": conta criada que ainda não fez o primeiro login, conta à espera de aprovação, ou outra coisa. A tela conta 6 e não diz o critério. *(Início do Gerencial)*
- O servidor vai fornecer as contagens e as pendências do início. Falta decidir: Se o time do servidor fará os endpoints; "alterações recentes" depende de decidir a auditoria. *(Início do Gerencial)*
- A lista de usuários vai trazer os grupos e o último acesso. Falta decidir: Se o servidor passa a entregar grupos; e onde nasce o "último acesso" (o Portal não grava login em banco). *(Usuários)*
- Quem pode bloquear e desbloquear. Falta decidir: Os perfis de operador e onde a conferência é feita (servidor). *(Usuários)*
- Bloqueio tem motivo obrigatório? Quais motivos existem. Falta decidir: Se os motivos viram lista fechada e se o motivo é guardado depois do desbloqueio. *(Usuários)*
- Prazo máximo de um acesso direto. *(Usuário)*
- Validade do link de redefinição de senha enviado por e-mail. Falta decidir: Se a ação "redefinir senha" do Gerencial vai disparar o fluxo do Portal (hoje não há integração) ou continua sendo o operador digitar a senha. *(Usuário)*
- Tirar a pessoa do último grupo é permitido. Falta decidir: Se a tela avisa ou impede. *(Usuário)*
- O login é sempre o CPF. Falta decidir: Tornar regra (e validar o CPF na criação) ou manter livre. Se o login for digitado com pontuação, o Portal não acha a conta. *(Novo usuário)*
- CPF que já tem conta bloqueada: reativa ou recusa. Falta decidir: Se o formulário deve oferecer "ir para a conta existente e desbloquear". *(Novo usuário)*
- Quais campos são obrigatórios, e se o e-mail precisa ser do domínio da UCAM. Falta decidir: A tela de referência pede e-mail; ou sai do formulário, ou o Gerencial passa a editar a pessoa (hoje é só leitura). E a pessoa vinculada deveria ser obrigatória? Sem ela não há nome nem e-mail para recuperar a senha. *(Novo usuário)*
- Grupo é obrigatório na criação. Falta decidir: Se unidade e grupo entram na criação; o servidor precisa, no mínimo, do vínculo usuário×unidade. *(Novo usuário)*
- "Copiar de outro grupo" substitui as permissões do grupo ou soma às que ele já tem? *(Grupo × Menu)*
- Permissão salva vale na hora para quem está logado, ou no próximo login. Falta decidir: Se a tela deve atualizar a árvore sozinha. Para os outros sistemas (SIGU etc.) vale a regra de cada um. *(Grupo × Menu)*
- Quem pode editar as permissões de um grupo, e se alguém pode editar o grupo a que pertence. Falta decidir: A regra de quem pode, e a trava de autoconcessão. *(Grupo × Menu)*
- O que o grupo padrão muda para a pessoa. Falta decidir: Confirmar com a TI se algum sistema fora dos clones lidos usa a marca; se não, tirar "padrão" da tela. *(Grupo × Usuários)*
- Quais eventos entram na trilha. Falta decidir: A lista de eventos e onde cada um é gravado (parte é do Portal, parte do Gerencial). *(Trilha de auditoria)*
- Quantas tentativas de senha erradas bloqueiam a conta. Falta decidir: Se haverá bloqueio por tentativas (decisão do Portal). *(Trilha de auditoria)*
- Unidade com usuários, grupos ou alunos vinculados pode ser inativada. Falta decidir: Se a conferência volta, e para quais dependências (alunos estão em outro módulo, que o Gerencial não lê). *(Unidades)*
- Quais campos da unidade são obrigatórios. Falta decidir: A tela marca só três; precisa marcar os 16 (ou o time decide afrouxar a API). *(Nova unidade)*
- CNPJ e CPF do responsável são validados pelo dígito, e CNPJ repetido é recusado. Falta decidir: Se a validação de dígito entra (no servidor) e se CNPJ de unidade deve ser único. *(Nova unidade)*
- Quais são os tipos de usuário e o que cada um muda. Falta decidir: Obter a lista real do banco; decidir se o tipo passa a restringir alguma coisa ou sai do formulário. *(Novo grupo)*
- A sigla do grupo pode repetir entre unidades. Falta decidir: A tela "Novo grupo" não deve pedir unidade como dono; a unidade entra no vínculo. *(Novo grupo)*
- Onde se cadastra o endereço da aplicação e a marca "aparece no painel". Falta decidir: Se o Gerencial passa a manter endereço, marca de painel, ícone e a liberação por usuário. Sem isso, a tela "Aplicações" não controla o que aparece no Portal. *(Aplicações)*
- A sigla da aplicação é o identificador no login único. Falta decidir: Proteger a sigla da própria aplicação contra edição (e a exclusão dela). *(Nova aplicação)*
- Menu sem aplicação ("órfão") deve existir? Hoje o cadastro aceita e ele aparece num bloco "Sem aplicação" nas telas de permissão. *(Menus)*
- O menu pai precisa ser da mesma aplicação? O servidor não confere. *(Novo menu)*
- Quais campos da mantenedora são obrigatórios. Falta decidir: A tela marca só dois; precisa marcar os sete. *(Nova mantenedora)*
- CNPJ e CPF do responsável são validados pelo dígito verificador. Falta decidir: Validação de dígito e normalização (só dígitos) no servidor. *(Nova mantenedora)*
- Para que o cartão é usado e em que momento ele é pedido. Falta decidir: Se os sistemas novos continuarão pedindo o cartão (nenhum dos novos lidos pede) e para quais funções. *(Cartões de segurança)*
- Cartão vencido deixa de valer sozinho. Falta decidir: A tela precisa de um estado "vencido" calculado, distinto de "inativo". *(Cartões de segurança)*
- A pessoa pode ter dois cartões valendo ao mesmo tempo. Falta decidir: Colocar no servidor a trava de vigências sobrepostas. *(Novo cartão)*

**Vestibular online**

- O servidor recusa resposta ou entrega depois do tempo? A tela entrega no zero, mas nada impede uma aba parada de responder depois. *(Instruções da prova)*
- O enunciado vem do servidor como HTML. Há limpeza no servidor? Imagem e fórmula são esperadas nas questões? *(Prova: questão objetiva)*

### Secretaria acadêmica (27)

**Relatórios Acadêmicos**

- A pessoa só consulta cursos e campi a que tem acesso, ou qualquer um. Falta decidir: se o coordenador deve ficar restrito aos seus cursos (hoje não fica), e se existe visão de várias unidades de uma vez (hoje é uma por vez). *(Filtros da consulta)*
- A meta de evasão. A tela usa 1,5%. *(Resultado da consulta)*
- Situações do aluno (Matriculado, Trancado, Evadido, Formado): a lista completa e o que decide cada uma. Falta decidir: os rótulos que a tela usa (os do SIGU ou agrupamentos, e quais códigos entram em cada grupo); a regra de transição de cada situação, com a secretaria. --- *(Resultado da consulta)*
- O limite de faltas que acende o aviso. A tela usa 25%. Falta decidir: a partir de quanto o aviso acende (em 25% o aluno já reprovou; um aviso útil vem antes, por exemplo em 20%) e se o truncamento se mantém. *(Resultado da consulta)*

**Módulo Gerencial**

- O que se registra em "credenciamento". Falta decidir: O conteúdo esperado (Secretaria acadêmica) e se vale olhar o que há hoje na coluna. *(Mantenedoras)*

**Isenção de disciplinas**

- Quando se pode pedir isenção: janela do calendário ou a qualquer momento. Falta decidir: Se quem já se inscreveu sem marcar a opção pode pedir depois, e até quando; se a isenção deve ter janela própria, diferente da inscrição. *(Fila de análise)*
- O prazo de 15 dias para o candidato responder não existe no sistema. Ele vai existir, e o que acontece quando vence. *(Fila de análise)*
- Quem vê a fila: cada coordenação só o próprio curso, ou a unidade inteira. Falta decidir: Se a restrição por curso deve existir. O dado para isso já está no acadêmico (academico.coordenador → unidadecurso). *(Fila de análise)*
- Prazo vencido: a análise segue com o que há (pode dar "não isenta") ou a solicitação é cancelada. *(Análise da solicitação)*
- Quem pode finalizar: qualquer pessoa da coordenação ou só quem coordena o curso. Falta decidir: A regra de quem pode. O dado de coordenador por curso existe no acadêmico; falta a decisão e a checagem. *(Análise da solicitação)*
- Quem pode reabrir, até quando (depois da matrícula? depois do lançamento no histórico?) e se o candidato é avisado. *(Solicitação concluída)*
- Solicitação que nunca recebe documento expira? Em quanto tempo. *(Candidato sem documentos)*
- Por qual canal o candidato é notificado (e-mail, Portal, SMS) e se há limite de avisos. Falta decidir: Se o e-mail volta no v2, enviado pelo servidor; o texto (hoje não informa pendência nem parecer); limite de avisos. email-smtp-ucam-backend é só um formulário de contato e integracao-api não tem nada de isenção: nenhum dos dois serve como está. *(Candidato sem documentos)*
- O candidato pode enviar documento sem pedido da coordenação? Pode desistir. Falta decidir: Se a desistência vai existir e o que ela faz com a inscrição (que fica PENDENTE por causa do pedido). *(Acompanhamento da isenção)*
- O candidato pode recorrer do parecer? Por onde e em que prazo. *(Isenção concluída)*
- A isenção concedida entra sozinha no histórico ou alguém a lança no SIGU. Falta decidir: Pedir ao DBA o corpo de academico.fn_Isencao_disciplinas — sem ele não se sabe o que entra (só ACEITO? com IES, disciplina de origem e carga?), em que matriz, e o que acontece se a análise for concluída ou alterada depois da matrícula (a função só roda no cadastro do ingressante; não vi nova chamada). Isso decide também o limite da reabertura (consulta--2). *(Isenção concluída)*
- Quais disciplinas da matriz entram: a matriz inteira ou só as marcadas como passíveis de isenção. Falta decidir: O que são as disciplinas de período 0 (optativas? eletivas?) e se a regra de estágio/TCC deve valer também para a decisão humana. *(Matrizes curriculares)*
- Quem liga a análise automatizada de um curso: a coordenação ou só a secretaria. Falta decidir: Se a chave por curso deve existir. Se sim, é funcionalidade nova (tabela, endpoint e a decisão de quem a opera). *(Cursos)*

**Secretaria virtual**

- O que torna um candidato "válido" para matrícula: os três requisitos valem sempre, ou mudam com a forma de ingresso ou com bolsa integral (que não tem primeira mensalidade)? *(Sala de matrícula)*
- O que significam Pendente, Confirmado e Aprovado nos contadores da graduação, e como se ligam a Pronto e Pendente. *(Sala de matrícula)*
- Identidade, título de eleitor e reservista são opcionais mesmo, ou a secretaria precisa deles para o registro acadêmico? *(Matricular candidato)*
- Candidato matriculado por engano: quem desfaz, e o número de matrícula é reaproveitado? *(Matricular candidato)*
- Pode-se alocar o mesmo aluno em disciplinas de turmas diferentes? E o que acontece com quem já tem parte das disciplinas (não aparece na lista)? *(Alocar alunos)*
- Alocação feita por engano: como se desfaz, e quem pode. *(Alocar alunos)*
- O que a consulta deve abrir: histórico, situação financeira, dados cadastrais? Hoje a linha não leva a nada. *(Consulta de aluno)*
- Como será a matrícula de extensão, e se depende do boleto pago. *(Matrícula de extensão)*
- A aprovação é só para mestrado e doutorado, ou outros tipos de pós também exigem. *(Matrícula de extensão)*

### Gestão do Protocolo (25)

**Sistema de Protocolo**

- O que põe um requerimento em "Aguardam você": distribuição automática, setor, unidades, ou os três. Falta decidir: Se a nova tela mantém o modelo "fila do setor + assumir" ou cria distribuição automática (que hoje não existe em lugar nenhum). *(Caixa de entrada)*
- Como se calcula o prazo ("vence em 1 dia", "venceu há 18 dias"). Falta decidir: Se o prazo passa a contar em dias úteis (hoje é corrido); onde ele será cadastrado; e qual valor vale quando o tipo não tem prazo (hoje 0 nas filas e 20 dias no Analytics — ver gerencial--2). *(Caixa de entrada)*
- O que é "urgente" na ordenação por urgência. Falta decidir: Se "Mais urgentes" na tela nova significa "marcados como urgente primeiro" (dá para fazer com o dado atual) ou "prazo mais apertado primeiro" (também dá, com prazo − tempoDecorrido); e quem pode marcar. *(Caixa de entrada)*
- Quem pode concluir e quem pode encaminhar, por nível do integrante. Falta decidir: Se a Gestão quer passar a restringir por nível (seria regra nova). *(Caixa de entrada)*
- Responder ao aluno muda a situação para Aguardando aluno. Falta decidir: Se haverá o estado "Aguardando aluno" e, antes disso, se o aluno poderá responder (hoje o caminho de volta é abrir outro requerimento). *(Caixa de entrada)*
- Por quanto tempo Concluídos continua consultável na caixa. Falta decidir: Política de retenção (não há nenhuma hoje). *(Caixa de entrada)*
- Quem pode reabrir um requerimento concluído, até quando, e se o requerente é avisado. Falta decidir: Se a reabertura volta a ser só do nível 3; se há prazo; e por qual canal o aluno é avisado (hoje nenhum). *(Caixa de entrada)*
- Quem pode editar os dados de um requerimento já enviado, e quais campos. Falta decidir: Tudo: quem, quais campos (natureza? setor? prazo? prioridade?) e até que estado. *(Requerimento em página)*
- Quem pode reabrir um requerimento concluído, até quando, e se o requerente é avisado. Falta decidir: Nível mínimo, prazo e canal de aviso. *(Requerimento em página)*
- Como se calcula o SLA médio: sobre quais requerimentos (só concluídos?) e em qual janela de tempo. *(Painel gerencial)*
- Quem vê o painel. Falta decidir: A lista de perfis (coordenação, gestão, reitoria) e se a coordenação vê só o próprio setor — hoje o servidor não consegue restringir. *(Painel gerencial)*
- O que conta como "atrasado": passou do prazo da natureza ou do SLA alvo do setor. Falta decidir: Unificar as três réguas (0, 20 dias, 7 dias) e decidir se o SLA de setor passa a existir. *(Painel gerencial)*
- Qual é o período de comparação padrão. Falta decidir: Se a comparação padrão é "semestre anterior" ou "mesmo semestre do ano passado"; e se a trava no semestre corrente é regra ou limitação. *(Analytics)*
- Um requerimento conta no mês em que foi aberto ou no mês em que foi concluído. Falta decidir: Se a tela nova mantém a visão por coorte de abertura ou passa a contar concluídos no mês da conclusão (o servidor teria de mudar). *(Analytics)*
- Todo setor precisa de coordenação? Pode ter mais de uma pessoa. Falta decidir: Se "coordenação" passa a ser um papel próprio ou é o nível 3; obrigatoriedade e quantidade. *(Setores e integrantes)*
- O que acontece com requerimentos em andamento quando a natureza é arquivada ou troca de setor. Falta decidir: A regra desejada (os pendentes migram? ficam com o setor antigo?) — e corrigir o servidor para segui-la. *(Naturezas do requerimento)*
- Quem pode abrir em nome do aluno. Falta decidir: A regra (qualquer integrante × só atendimento) e, junto, gravar o autor da abertura — sem isso a regra não é auditável. *(Novo requerimento)*
- O aluno é avisado quando alguém abre um requerimento em nome dele? Por qual canal. Falta decidir: Se haverá aviso, em quais eventos e por qual canal. É funcionalidade nova; email-smtp-ucam-backend existe na organização, mas o Protocolo não o usa. *(Novo requerimento)*
- Os valores de capacidade e SLA alvo de cada setor. Os números da tela (40, 30, 20; 2 a 5 dias) são exemplo. *(Parâmetros dos setores)*
- O que "aceita fila acima da capacidade" faz quando está desligado: a distribuição para, o excedente vai para outro setor, ou só avisa. *(Parâmetros dos setores)*
- Onde fica o limite entre "No alvo", "No limite" e "Acima do alvo". *(Parâmetros dos setores)*
- O prazo da natureza pode ser maior que o SLA alvo do setor? Hoje a tela só avisa. *(Nova natureza)*
- Qual calendário define dia útil: feriados nacionais, municipais de cada campus, recesso acadêmico. *(Nova natureza)*
- O que cada nível pode fazer (a tela propõe triagem / análise / decisão). Falta decidir: Se a Gestão quer transformar nível em permissão (regra nova) ou manter como alçada de visibilidade. Os rótulos "triagem / análise / decisão" não têm base no código. *(Novo integrante)*
- O nível decide o que a pessoa pode fazer ou quanto ela recebe na distribuição. Falta decidir: O texto que explica o nível na tela ("vê requerimentos de nível até N"). *(Novo integrante)*

### Gestão de acessos (24)

**SigFin**

- Quem pode gerar cada relatório. Falta decidir: a matriz de quem vê o quê (decisão da gestão de acessos) e onde ela passa a ser verificada. Hoje a restrição seria só esconder o menu. *(Filtros do relatório)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Cálculo de mensalidade em lote)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Datas de vencimento)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Enviar mensalidades)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Baixar mensalidades)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Sincronização com a Principia)*
- Quem pode executar esta operação. Hoje todo usuário autenticado vê e faz tudo, e a unidade ativa não restringe o que aparece. *(Pagamentos Sicoob)*

**Módulo Gerencial**

- O sistema vai ter página de detalhe do usuário, com histórico e ações de conta, ou a edição continua sendo só o formulário. *(Usuário)*
- Os grupos são escolhidos na criação da conta ou só depois, em Grupo × Usuários. Falta decidir: A decisão de produto (Gestão de acessos). *(Novo usuário)*
- O que acontece quando a validade do acesso vence. Falta decidir: Tudo: se o vencimento barra a entrada (mudança no Portal), aviso prévio e quem prorroga. *(Novo usuário)*
- "Menu × Usuários" continua como tela própria ou vira filtro. Falta decidir: A decisão de Gestão de acessos. *(Grupo × Menu)*
- A unidade da permissão é a de trabalho da faixa, ou a tela precisa de seletor próprio. Falta decidir: Se a tela de referência adota a hierarquia decidida (unidade primeiro, menus agrupados por aplicação). *(Grupo × Menu)*
- Quem pode mudar os integrantes de um grupo, e se alguém pode se pôr no grupo que administra. Falta decidir: A regra de quem pode. *(Grupo × Usuários)*
- Acesso direto deve ter validade? É exceção, e exceção sem prazo tende a ficar para sempre. *(Usuário × Menu)*
- Quem pode conceder acesso direto, e se alguém pode conceder a si mesmo. Hoje qualquer pessoa com acesso ao Gerencial pode. *(Usuário × Menu)*
- Quem pode criar, editar e inativar cadastros. Falta decidir: Os perfis. *(Unidades)*
- Grupo com integrantes pode ser inativado. Falta decidir: O que inativar um grupo deve fazer: bloquear se houver integrantes, ou encerrar os acessos junto. *(Grupos)*
- Quem pode criar grupo e mudar o que ele concede. Falta decidir: Os perfis. *(Grupos)*
- Quem pode criar e mudar menus: qualquer pessoa com acesso ao Gerencial (como hoje) ou só a TI. *(Menus)*
- Quem pode emitir cartão e como ele é entregue. Falta decidir: Quem emite formalmente, como o cartão é produzido e entregue, e se o sistema passa a gerar a semente. --- *(Novo cartão)*

**Secretaria virtual**

- Quem pode matricular, alocar e aprovar. Hoje qualquer usuário autenticado vê os quatro menus; o sistema não tem menu por permissão. *(Sala de matrícula)*
- Quem pode matricular, alocar e aprovar. Hoje qualquer usuário autenticado vê os quatro menus; o sistema não tem menu por permissão. *(Alocar alunos)*
- Quem pode matricular, alocar e aprovar. Hoje qualquer usuário autenticado vê os quatro menus; o sistema não tem menu por permissão. *(Consulta de aluno)*
- Quem pode matricular, alocar e aprovar. Hoje qualquer usuário autenticado vê os quatro menus; o sistema não tem menu por permissão. *(Matrícula de extensão)*

### Financeiro (tesouraria) (19)

**SigFin**

- Quem pode reabrir um caixa fechado, até quando, e se a reabertura fica registrada. Falta decidir: quem recebe a tela de bloqueio (é permissão de menu, cadastrada no Gerencial, não está no código); se haverá prazo; se a reabertura exige motivo. *(Movimento de caixa)*
- Lançamento errado se corrige como: estorno ou edição. Falta decidir: quem pode estornar e até quando (não há trava no código, nem de data nem de caixa bloqueado); se o motivo passa a ser obrigatório. *(Movimento de caixa)*
- O que é "vale" e "banco tesouraria" nos totais, e como entram no saldo do dia. Falta decidir: confirmar com a tesouraria o nome de negócio de "banco tesouraria" (o código só mostra que é saída classificada) e se a falta deveria reduzir o saldo. *(Movimento de caixa)*
- Recalcular uma mensalidade que já tem boleto registrado cancela o boleto anterior. Falta decidir: não achei baixa ou cancelamento do boleto antigo no banco quando o valor muda; confirmar com a tesouraria o que acontece com o título registrado (fica com o valor velho?). *(Cálculo de mensalidade individual)*
- A ordem dos descontos: cada um incide sobre o valor de tabela ou sobre o já descontado. Falta decidir: qual roteiro a tela de referência mostra (hoje ela desenha "sobre a tabela" para tudo, o que só é verdade para convênio, extras e bolsa integral); e se o roteiro único do serviço novo substitui os roteiros por campus. *(Cálculo de mensalidade individual)*
- As três faixas de data e o valor de cada uma: de onde vêm, e se o aluno pode ter faixa diferente. Falta decidir: a tela de referência mostra 8% de pontualidade e não mostra a perda da bolsa após o vencimento; as duas coisas precisam ser acertadas com a controladoria. O gateway de pagamento on-line não devolve a bolsa no atraso: qual das duas regras é a correta. *(Cálculo de mensalidade individual)*
- Quem pode recalcular a mensalidade de um aluno, e se o recálculo fica registrado com autor. Falta decidir: se o recálculo deve guardar motivo e valor anterior; corrigir o autor fixo no serviço novo. *(Cálculo de mensalidade individual)*
- A partir de quantos dias de atraso a parcela entra, e se parcela em acordo conta. Falta decidir: se há carência; se acordo aparece separado; conferir com quem mantém a carga como a mensalidade negociada é marcada. *(Inadimplência)*
- Pix, cartão e boleto entram na coluna do banco que os liquida ou pedem coluna própria. Falta decidir: se Pix e cartão on-line ganham coluna; para isso a forma de pagamento teria de chegar à tabela analítica, e não vi essa coluna nela (FB/model/analytics/FinanceiroAluno.java). *(Recebimentos por dia)*
- O código do convênio pode repetir entre unidades. Falta decidir: se convênio é da instituição ou da unidade; ler a restrição de unicidade no banco. *(Novo convênio)*
- O código do banco é o de compensação, com 3 dígitos, e não pode repetir. Falta decidir: se a tela impõe 3 dígitos (quebraria "707" se ele não for de compensação de fato; conferir com a tesouraria por que existe); a unicidade no banco. *(Novo banco)*
- Os feriados valem para todas as unidades ou cada unidade cadastra os seus. Falta decidir: se feriado municipal passa a ter unidade ou cidade; hoje a única saída é não cadastrar os municipais. *(Feriados bancários)*
- Feriado em fim de semana precisa ser cadastrado. Falta decidir: se a tela avisa ("cai num sábado; não muda vencimento") ou impede. *(Feriados bancários)*
- Pode haver dois feriados na mesma data. Falta decidir: ler a restrição no banco. Como o feriado é global e o efeito é o mesmo com uma ou duas linhas, a proposta natural é uma data, um feriado. --- *(Novo feriado)*
- O que é cada uma das três datas (pré-pagamento, pós-pagamento, pagamento antecipado) e por que a segunda repete a primeira. *(Datas de vencimento)*
- O que diferencia Novo, Alterado e Estornado, e o que acontece ao reenviar uma mensalidade alterada (o boleto antigo é cancelado?). *(Enviar mensalidades)*
- "Alocar para baixa" é reversível? Quem confirma a baixa de fato, e em quanto tempo ela acontece. *(Baixar mensalidades)*
- O que torna uma mensalidade "com dados insuficientes", e quem corrige o cadastro: a secretaria, o financeiro ou a integração. *(Sincronização com a Principia)*
- Como se reprocessam só as linhas que falharam, sem pagar de novo as que deram certo. *(Pagamentos Sicoob)*

### Comissão do vestibular (14)

**Vestibular online**

- Quantas tentativas o candidato tem de fato. No código só há o número do ambiente de teste (3). *(Entrada do candidato)*
- O link sem senha basta para uma prova que vale vaga? Quem tem o link faz a prova no lugar do candidato. *(Entrada do candidato)*
- Trocar de aba ou de janela durante a prova deve ser registrado? Hoje não é. *(Instruções da prova)*
- No tempo esgotado a entrega sai mesmo com respostas na fila, que depois é apagada. É aceito perder essas respostas? *(Prova: questão objetiva)*
- O máximo de 3.000 conta espaços e o mínimo de 300 não. Qual é o teto que vale para o candidato? *(Prova: redação)*
- A redação é texto simples. O candidato pode usar parágrafo, negrito ou título? Hoje só a quebra de linha é guardada. *(Prova: redação)*
- Qual é a regra de aprovação: nota mínima, peso de cada caderno, peso da redação. No código só há a suposição do ambiente de teste. *(Resultado da prova)*
- O candidato é avisado quando a banca termina, ou tem de voltar para ver? *(Resultado da prova)*
- Quem corrige redação terá conta no login único, ou a banca é de fora da universidade? *(Correção de redação)*
- O corretor vê o nome e o CPF do candidato. A correção deveria ser anônima? *(Correção de redação)*
- Regravar a nota deve ficar registrado (quem, quando, nota anterior)? Hoje não fica. *(Corrigir redação)*
- Uma redação tem um corretor só, ou precisa de segunda correção quando a nota decide a vaga? *(Corrigir redação)*
- Onde se cadastram as questões objetivas, com alternativas e gabarito. Esta tela não cadastra. *(Cadernos de prova)*
- O editor de questão precisa de fórmula, imagem e lista? Hoje grava texto simples e perde a formatação das questões antigas. *(Cadernos de prova)*

### Encarregado de dados (LGPD) (11)

**Sistema de Protocolo**

- Quem pode abrir o endereço de um requerimento. Falta decidir: A regra em si (setor responsável, qualquer integrante, quem tem o link) — e, antes, quem vai aplicá-la, porque hoje nenhuma camada do código aplica. É ponto para o Encarregado de dados. *(Requerimento em página)*
- Quem pode exportar os dados, e se a exportação leva dado pessoal do aluno. *(Analytics)*

**Portal Universitário**

- "Lembrar de mim" guarda o CPF no navegador — vale em computador compartilhado. Falta decidir: A política (LGPD) para laboratório e secretaria: manter, avisar, ou desligar. Nada no código responde. *(Autenticação)*
- Quais e-mails do cadastro podem receber o código. Falta decidir: Se o código pode ir a e-mail pessoal (hoje vai, se for o que está no cadastro) e quem atualiza o e-mail de quem não tem acesso a ele. *(Confirmar código)*

**SigFin**

- Quem pode ver a lista de inadimplentes com nome e matrícula. Falta decidir: a regra de acesso (encarregado de dados) e o registro de quem consultou. O serviço não guarda log de consulta. *(Inadimplência)*

**Relatórios Acadêmicos**

- Quem vê cada relatório: por perfil, por assunto, por unidade. Falta decidir: se o novo catálogo verifica a permissão também ao abrir o relatório (hoje não); a matriz de quem vê o quê é dado do Gerencial, não código. *(Catálogo de relatórios)*
- O que a exportação pode levar de dado pessoal (CPF, contato) e quem pode exportar. Falta decidir: a política em si (encarregado de dados): quais colunas pessoais cada relatório pode levar, quem exporta, e se o registro passa a guardar formato e filtros. *(Resultado da consulta)*

**Módulo Gerencial**

- Quais dígitos do CPF ficam visíveis na máscara. Falta decidir: A máscara e quem pode ver o CPF inteiro. *(Usuários)*
- Retenção da trilha. A tela mostra 30 dias; quanto tempo o registro é guardado. *(Trilha de auditoria)*
- O Gerencial vai registrar quem mudou o quê. Falta decidir: A decisão de construir (com o Encarregado de dados) e o desenho da tabela de log. *(Trilha de auditoria)*

**Secretaria virtual**

- Quem consulta deve ver alunos de todas as unidades, ou só os das unidades em que trabalha? Hoje vê todos. *(Consulta de aluno)*

### Controladoria (11)

**SigFin**

- Consultar um ano só é regra do negócio ou limite do serviço. Falta decidir: se a tela divide por ano e soma, ou mantém um ano por consulta deixando claro o porquê. *(Filtros do relatório)*
- O valor mostrado inclui juros e multa. Falta decidir: se o relatório deve mostrar também o valor atualizado (com bolsa perdida, multa e juros), e dizer qual dos dois é o total. *(Inadimplência)*
- Cheque pré-datado entra no total no dia em que é recebido ou quando compensa. Falta decidir: se cheque pré deve contar como receita do dia (hoje conta) ou só no bom-para; cheque devolvido não sai do total. *(Recebimentos por dia)*
- O que acontece com as bolsas já concedidas quando o tipo muda de marcação. Falta decidir: se mudar a marcação deve avisar quantas mensalidades em aberto são afetadas, e se dispara recálculo. *(Tipos de bolsa)*
- Como a regressão por dia de vencimento entra na conta: substitui o percentual da bolsa ou soma. Falta decidir: a tela de referência precisa mostrar "incremental" e o significado do dia 0; confirmar se a escada fixa ainda está em uso. *(Novo tipo de bolsa)*
- Quando o convênio não é de valor integral, onde se define o percentual que ele cobre. Falta decidir: se as duas marcações devem voltar a ter efeito ou sair da tela; hoje são decorativas. *(Convênios)*
- Banco com boletos em aberto pode ser inativado, e o que acontece com esses boletos. Falta decidir: se desativar deve avisar quantos boletos em aberto existem; o que valida_exclusao impede no banco. *(Bancos e agências)*
- Vencimento em feriado vai para o dia útil seguinte ou anterior, e o desconto de antecipação acompanha. Falta decidir: alinhar o gateway on-line e os relatórios com a regra do feriado; hoje o mesmo aluno pode estar "em dia" no caixa e "em atraso" no pagamento on-line. *(Feriados bancários)*
- O cálculo em lote novo e o cálculo do SigFin antigo usam fórmulas diferentes. Qual vale, e a partir de quando. *(Cálculo de mensalidade em lote)*
- Quem pode alterar à mão o valor de uma mensalidade calculada, e se isso fica registrado. *(Cálculo de mensalidade em lote)*
- O envio dispara pagamento real sem segunda aprovação. Há alçada, limite de valor ou dupla conferência? *(Pagamentos Sicoob)*

### Coordenação de curso (2)

**Isenção de disciplinas**

- Onde e como a coordenação registra o motivo de cada "Não isenta". Falta decidir: Texto livre ou lista de motivos; se reaproveita alteracao (misturando dois significados) ou ganha coluna própria; se a justificativa da IA pode ser o ponto de partida. *(Isenção concluída)*
- Um curso pode ter mais de uma coordenação responsável pela isenção, ou só uma. Falta decidir: Se "responsável pela isenção" é qualquer coordenador do curso, só o titular, ou um papel novo. --- *(Cursos)*

## Propostas a confirmar

### TI (dono do SIGU) (29)

**Sistema de Protocolo**

- Todo requerimento tem endereço próprio, que se pode mandar a um colega. *(Requerimento em página)*
- Anexo em PDF de até 10 MB. *(Novo requerimento)*
- A conta vem do Gerencial: aqui se escolhe a pessoa, não se cria acesso. *(Novo integrante)*

**Portal Universitário**

- Favoritos são por pessoa e valem em qualquer dispositivo: a estrela fixada aqui é a mesma do grupo Favoritos da navegação. *(Grade de módulos)*
- Entrada também por conta institucional Microsoft ou Google, como segunda via; CPF e senha continuam valendo para todos. *(Autenticação)*
- O erro de autenticação não diz se o CPF existe ou se a senha está errada. *(Autenticação)*
- A tela não diz se o CPF tem cadastro: o passo do código abre do mesmo jeito. Hoje o sistema responde "Usuário inválido!". *(Recuperar senha)*
- Depois de salvar, a pessoa volta para a entrada e digita a senha nova; a troca não abre sessão sozinha. *(Definir nova senha)*
- Depois de abrir a sessão, o endereço com o token é substituído; o token não fica no histórico do navegador. *(Abrindo o sistema)*
- Depois de entrar de novo, a pessoa volta para a tela em que estava, não para o início do sistema. *(Sessão encerrada)*

**Relatórios Acadêmicos**

- "Acessados com frequência" são os quatro relatórios que a pessoa logada mais gerou. *(Catálogo de relatórios)*

**Módulo Gerencial**

- Os números do painel são da unidade escolhida na faixa, não da instituição inteira. *(Início do Gerencial)*
- São pendência: conta bloqueada, conta sem grupo, conta aguardando acesso e grupo sem nenhum menu. *(Início do Gerencial)*
- Conta não se exclui pela listagem: bloquear é reversível e guarda o histórico. Se exclusão existir, é exceção na página do usuário, com confirmação. *(Usuários)*
- Bloquear em lote pula quem já está bloqueado. *(Usuários)*
- O acesso da pessoa é a união dos menus dos grupos com os acessos diretos vigentes, sem repetição. *(Usuário)*
- Acesso direto a menu sempre tem validade e deixa de valer sozinho quando vence. *(Usuário)*
- Reemitir o cartão de segurança invalida o anterior na hora. *(Usuário)*
- CPF é único: não se cria segunda conta com o mesmo CPF. *(Novo usuário)*
- Grupo sem menu não aparece para escolha. *(Novo usuário)*
- Acesso direto a menu não se concede na criação, só depois, na página do usuário. *(Novo usuário)*
- Permissão se concede por grupo. "Menu × Usuários" deixa de ser tela e vira filtro de Usuário × Menu. *(Grupo × Menu)*
- Mudança de permissão só vale ao salvar o lote, nunca no clique. *(Grupo × Menu)*
- A lista mostra quando o acesso foi concedido. O sistema hoje não guarda essa data. *(Usuário × Menu)*
- Registro de auditoria não se edita, não se apaga e não se trata em lote. *(Trilha de auditoria)*
- O registro inativo pode ser reativado pela própria listagem. Hoje só o login de usuário tem caminho de restauração. *(Unidades)*
- O CEP preenche logradouro, bairro, cidade e UF, e os campos continuam editáveis. *(Nova unidade)*

**Isenção de disciplinas**

- Documento é PDF, JPG ou PNG de até 10 MB, os mesmos formatos e o mesmo limite do Protocolo. *(Acompanhamento da isenção)*

**Vestibular online**

- A correção de redação exige sessão. No sistema em produção a rota está aberta. *(Correção de redação)*

### Gestão do Protocolo (20)

**Sistema de Protocolo**

- A caixa tem quatro recortes da mesma fila: Aguardam você, Minha pauta, Encaminhados e Concluídos. *(Caixa de entrada)*
- Encaminhar muda a situação para Encaminhado; concluir fecha o requerimento como Deferido ou Indeferido. *(Caixa de entrada)*
- Mudança de situação é registrada como par DE → PARA, com autor e hora, e a linha do tempo não se edita. *(Requerimento em página)*
- Editar os dados do requerimento é um evento na linha do tempo com cada mudança dentro dele. *(Requerimento em página)*
- O andamento tem etapas (a tela mostra "Etapa 2 de 4"). Quais são as etapas de cada natureza ainda não está escrito em lugar nenhum. *(Requerimento em página)*
- A carga do setor é medida contra a capacidade declarada em Parâmetros dos setores. *(Painel gerencial)*
- Toda variação diz contra qual período está sendo comparada. *(Analytics)*
- A pessoa aparece uma vez no setor, com as unidades dela; não é um vínculo por unidade. *(Setores e integrantes)*
- Natureza não se exclui, porque há requerimentos apontando para ela. Arquivar é reversível: some da escolha do aluno e continua no cadastro. *(Naturezas do requerimento)*
- Cada natureza tem um setor responsável, que recebe todo requerimento dela. *(Naturezas do requerimento)*
- Cada natureza declara as modalidades que atende; nenhuma unidade marcada vale como todas. *(Naturezas do requerimento)*
- O atendimento abre requerimento em nome de um aluno buscado no cadastro, sem digitar os dados dele. *(Novo requerimento)*
- O setor responsável vem da natureza escolhida e não se troca na abertura. *(Novo requerimento)*
- Requerimento enviado não se edita. *(Novo requerimento)*
- Cada setor tem capacidade, SLA alvo, responsável, e três chaves: atende EAD, distribuição automática e aceita fila acima da capacidade. O sistema de hoje não tem nenhum desses campos. *(Parâmetros dos setores)*
- Setor não se cria nem se apaga nesta tela: os seis existem, e aqui só se ajustam os valores. *(Parâmetros dos setores)*
- O prazo de resposta da natureza conta em dias úteis a partir do envio. *(Nova natureza)*
- Três exigências por natureza: anexo obrigatório, justificativa escrita, e se o aluno pode abrir pelo Portal (desligado, só o atendimento abre). *(Nova natureza)*
- A pessoa só vê requerimentos das unidades em que atua. *(Novo integrante)*
- Fora da distribuição automática, a pessoa só recebe o que lhe for encaminhado à mão. A coordenação recebe o que ninguém assumiu. *(Novo integrante)*

### Secretaria acadêmica (15)

**Relatórios Acadêmicos**

- Período e curso são obrigatórios; turno depende do curso; "ingresso entre" exige De antes de Até. *(Filtros da consulta)*
- Exporta em PDF com timbre, Excel e Word. *(Resultado da consulta)*

**Isenção de disciplinas**

- Situações da solicitação: Aguardando envio, Aguardando análise, Aguardando candidato e Concluída — os mesmos estados dos dois lados. Do lado do candidato, Aguardando candidato se diz "Aguardando você" (ADR-029); os outros nomes são iguais. *(Fila de análise)*
- Análise manual e com sugestão são a mesma fila. A sugestão automatizada é atributo da solicitação: disponível, em processamento, falhou ou sem análise. *(Fila de análise)*
- Disciplina sem decisão barra o fechamento. Falta de documento nunca vira "não isenta". *(Análise da solicitação)*
- Não há fechamento parcial: com documento pedido, a solicitação inteira espera o candidato, e as decisões já tomadas ficam salvas. *(Análise da solicitação)*
- O prazo para o candidato enviar o documento pedido é de 15 dias corridos a partir do pedido. *(Análise da solicitação)*
- Observação ao candidato tem até 150 caracteres; enviá-la muda a situação para Aguardando candidato. *(Análise da solicitação)*
- Reabrir desfaz um parecer entregue ao candidato: exige confirmação e devolve a solicitação a Aguardando análise. *(Solicitação concluída)*
- A observação enviada ao candidato não muda mais. *(Solicitação concluída)*
- Sem documento enviado não há decisão: a única ação é notificar o candidato. *(Candidato sem documentos)*
- Enviar o documento pedido devolve a solicitação a Aguardando análise. *(Acompanhamento da isenção)*
- Enquanto a análise corre, o candidato vê por disciplina só Em análise ou Aguardando documento; Isenta e Não isenta aparecem juntas, no parecer. *(Acompanhamento da isenção)*
- Matriz em extinção continua valendo para quem entrou nela; candidato novo é analisado contra a vigente. *(Matrizes curriculares)*
- Mudar a configuração vale para as próximas solicitações; as que já estão na fila seguem como entraram. *(Cursos)*

### Financeiro (tesouraria) (13)

**SigFin**

- Fechar o caixa trava novos lançamentos do dia. *(Movimento de caixa)*
- A agência só se escolhe com "Registrar boleto" ligado. *(Cálculo de mensalidade individual)*
- O relatório é gerado quando a pessoa pede, não a cada campo alterado. *(Filtros do relatório)*
- O relatório só consulta quando a pessoa aplica os filtros, não a cada campo alterado. *(Inadimplência)*
- Dia sem expediente não aparece como linha; a tela diz quais dias do período foram pulados. *(Recebimentos por dia)*
- Tipo de bolsa em uso é inativado, não excluído: sai da lista de escolha e continua no histórico de quem já tem a bolsa. *(Tipos de bolsa)*
- Convênio com alunos vinculados é inativado, não excluído. *(Convênios)*
- Feriado pode ser inativado sem ser apagado: fica no cadastro e deixa de adiar vencimento. *(Feriados bancários)*
- Nenhum curso vem marcado: salvar exige marcar o que foi conferido. *(Cálculo de mensalidade em lote)*
- Nenhum plano vem marcado: a alteração em lote exige escolher os planos. *(Datas de vencimento)*
- Só título pago entra na fila de baixa; título pendente marcado fica de fora e o aviso diz quantos. *(Baixar mensalidades)*
- Linha com documento inválido fica de fora e as demais são pagas; a correção é feita na planilha. *(Pagamentos Sicoob)*
- Enviar pagamentos pede confirmação que diz que o dinheiro sai da conta. *(Pagamentos Sicoob)*

### Coordenação de curso (3)

**Isenção de disciplinas**

- A decisão é por disciplina (isentar, não isentar, pedir documento) e é sempre humana. "Aplicar sugestões" só preenche as sem decisão, nunca sobrescreve nem pede documento sozinha. *(Análise da solicitação)*
- A sugestão isenta com 75% ou mais da ementa em comum e carga igual ou maior; revisa entre 50% e 74% ou com carga menor; não isenta abaixo de 50% ou sem equivalente. *(Análise da solicitação)*
- "Não isenta" sempre vem com o motivo. *(Isenção concluída)*

### Encarregado de dados (LGPD) (2)

**Módulo Gerencial**

- O número do cartão aparece mascarado na lista, só com os quatro últimos dígitos. Hoje a lista mostra o número inteiro. *(Cartões de segurança)*

**Secretaria virtual**

- A matrícula não apaga endereço nem telefone do cadastro da pessoa; só acrescenta. *(Matricular candidato)*

### Gestão de acessos (1)

**Módulo Gerencial**

- Menu se inativa em vez de se excluir: sai da lateral de todo mundo e as concessões ficam guardadas para a volta. *(Menus)*
