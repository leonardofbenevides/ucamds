# Perguntas e propostas do projeto Isenção de disciplinas (33)

Cada linha: **id** [situação] (tela) texto — quem decide.

- **isencao--fila--1** [proposta] (Fila de análise) Situações da solicitação: Aguardando envio, Aguardando análise, Aguardando candidato e Concluída — os mesmos estados dos dois lados. Do lado do candidato, Aguardando candidato se diz "Aguardando você" (ADR-029); os outros nomes são iguais. — decide: Secretaria acadêmica
- **isencao--fila--2** [proposta] (Fila de análise) Análise manual e com sugestão são a mesma fila. A sugestão automatizada é atributo da solicitação: disponível, em processamento, falhou ou sem análise. — decide: Secretaria acadêmica
- **isencao--fila--3** [aberta] (Fila de análise) Quem vê a fila: cada coordenação só o próprio curso, ou a unidade inteira. — decide: Secretaria acadêmica
- **isencao--fila--4** [aberta] (Fila de análise) Quando se pode pedir isenção: janela do calendário acadêmico ou a qualquer momento. — decide: Secretaria acadêmica
- **isencao--fila--7** [aberta] (Fila de análise) O prazo de 15 dias para o candidato responder não existe no sistema. Ele vai existir, e o que acontece quando vence. — decide: Secretaria acadêmica
- **isencao--analise--1** [proposta] (Análise da solicitação) A decisão é por disciplina (isentar, não isentar, pedir documento) e é sempre humana. "Aplicar sugestões" só preenche as sem decisão, nunca sobrescreve nem pede documento sozinha. — decide: Coordenação de curso
- **isencao--analise--2** [proposta] (Análise da solicitação) Disciplina sem decisão barra o fechamento. Falta de documento nunca vira "não isenta". — decide: Secretaria acadêmica
- **isencao--analise--3** [proposta] (Análise da solicitação) Não há fechamento parcial: com documento pedido, a solicitação inteira espera o candidato, e as decisões já tomadas ficam salvas. — decide: Secretaria acadêmica
- **isencao--analise--4** [proposta] (Análise da solicitação) O prazo para o candidato enviar o documento pedido é de 15 dias corridos a partir do pedido. — decide: Secretaria acadêmica
- **isencao--analise--5** [aberta] (Análise da solicitação) Prazo vencido: a análise segue com o que há (pode dar "não isenta") ou a solicitação é cancelada. — decide: Secretaria acadêmica
- **isencao--analise--6** [proposta] (Análise da solicitação) Observação ao candidato tem até 150 caracteres; enviá-la muda a situação para Aguardando candidato. — decide: Secretaria acadêmica
- **isencao--analise--7** [aberta] (Análise da solicitação) Quem pode finalizar: qualquer pessoa da coordenação ou só quem coordena o curso. — decide: Secretaria acadêmica
- **isencao--analise--8** [proposta] (Análise da solicitação) A sugestão isenta com 75% ou mais da ementa em comum e carga igual ou maior; revisa entre 50% e 74% ou com carga menor; não isenta abaixo de 50% ou sem equivalente. — decide: Coordenação de curso
- **isencao--consulta--1** [proposta] (Solicitação concluída) Reabrir desfaz um parecer entregue ao candidato: exige confirmação e devolve a solicitação a Aguardando análise. — decide: Secretaria acadêmica
- **isencao--consulta--2** [aberta] (Solicitação concluída) Quem pode reabrir, até quando (depois da matrícula? depois do lançamento no histórico?) e se o candidato é avisado. — decide: Secretaria acadêmica
- **isencao--consulta--3** [proposta] (Solicitação concluída) A observação enviada ao candidato não muda mais. — decide: Secretaria acadêmica
- **isencao--sem-documentos--1** [proposta] (Candidato sem documentos) Sem documento enviado não há decisão: a única ação é notificar o candidato. — decide: Secretaria acadêmica
- **isencao--sem-documentos--2** [aberta] (Candidato sem documentos) Por qual canal o candidato é notificado (e-mail, Portal, SMS) e se há limite de avisos. — decide: Secretaria acadêmica
- **isencao--sem-documentos--3** [aberta] (Candidato sem documentos) Solicitação que nunca recebe documento expira? Em quanto tempo. — decide: Secretaria acadêmica
- **isencao--acompanhamento--1** [proposta] (Acompanhamento da isenção) Documento é PDF, JPG ou PNG de até 10 MB, os mesmos formatos e o mesmo limite do Protocolo. — decide: TI (dono do SIGU)
- **isencao--acompanhamento--2** [proposta] (Acompanhamento da isenção) Enviar o documento pedido devolve a solicitação a Aguardando análise. — decide: Secretaria acadêmica
- **isencao--acompanhamento--3** [proposta] (Acompanhamento da isenção) Enquanto a análise corre, o candidato vê por disciplina só Em análise ou Aguardando documento; Isenta e Não isenta aparecem juntas, no parecer. — decide: Secretaria acadêmica
- **isencao--acompanhamento--4** [aberta] (Acompanhamento da isenção) O candidato pode enviar documento sem pedido da coordenação? Pode desistir da solicitação? — decide: Secretaria acadêmica
- **isencao--resultado--1** [proposta] (Isenção concluída) "Não isenta" sempre vem com o motivo. — decide: Coordenação de curso
- **isencao--resultado--2** [aberta] (Isenção concluída) O candidato pode recorrer do parecer? Por onde e em que prazo. — decide: Secretaria acadêmica
- **isencao--resultado--3** [aberta] (Isenção concluída) A isenção concedida entra sozinha no histórico acadêmico ou alguém a lança no SIGU. — decide: Secretaria acadêmica
- **isencao--resultado--4** [aberta] (Isenção concluída) O motivo de cada "Não isenta" ainda não tem campo na tela de análise: hoje a coordenação só marca a decisão, e o motivo que o candidato lê aqui não tem de onde vir. Onde e como a coordenação registra o motivo. — decide: Coordenação de curso
- **isencao--matrizes--1** [aberta] (Matrizes curriculares) A matriz é mantida no SIGU e só lida pela isenção, ou a isenção pode cadastrar e corrigir matrizes próprias. — decide: TI (dono do SIGU)
- **isencao--matrizes--2** [aberta] (Matrizes curriculares) Quais disciplinas da matriz entram na isenção: a matriz inteira ou só as marcadas como passíveis de isenção (a tela mostra os três primeiros períodos). — decide: Secretaria acadêmica
- **isencao--matrizes--3** [proposta] (Matrizes curriculares) Matriz em extinção continua valendo para quem entrou nela; candidato novo é analisado contra a vigente. — decide: Secretaria acadêmica
- **isencao--cursos--1** [aberta] (Cursos) Quem liga a análise automatizada de um curso: a coordenação do curso ou só a secretaria. — decide: Secretaria acadêmica
- **isencao--cursos--2** [proposta] (Cursos) Mudar a configuração vale para as próximas solicitações; as que já estão na fila seguem como entraram. — decide: Secretaria acadêmica
- **isencao--cursos--3** [aberta] (Cursos) Um curso pode ter mais de uma coordenação responsável pela isenção, ou só uma. — decide: Coordenação de curso
