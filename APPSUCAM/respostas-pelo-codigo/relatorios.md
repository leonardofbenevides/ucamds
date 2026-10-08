# Relatórios Acadêmicos — respostas pelo código do servidor (10 perguntas)

Leitura feita em 06/10/2026 nos clones de `C:\Users\Leonardo\Documents\UCAM-repos\`. Nada foi executado; só leitura de código.

**Contagem:** RESPONDIDA 4 · RESPONDIDA EM PARTE 5 · NÃO ESTÁ NO CÓDIGO 1.

**Qual sistema foi lido.** Não existe, nos repositórios, um sistema chamado "Relatórios Acadêmicos" com catálogo, meta de evasão e aviso de faltas como a tela de referência desenha. O que existe e foi lido:

- **Módulo Relatório do SIGU** (`sigu/Relatorio` + `sigu/RelatorioEJB`): JSF e JasperReports, cerca de 75 relatórios acadêmicos em `rel_academico` (aluno, curso, turma, professor, grade, processo seletivo, avaliação, requerimento), mais estágio e extensão. É o correspondente real, e a fonte da maior parte das respostas.
- **Analítica de evasão** (`selecao-service`): consultas sobre as tabelas `academicoalunomatricula` e `financeiroaluno`.
- **Relatório de alunos do `rel-contabilidade-backend`**: a mesma tabela analítica, com situação de matrícula.
- `sigu_2-0/Relatorio-EJB` existe (12 modelos acadêmicos) e segue o mesmo desenho; não acrescentou regra às respostas abaixo.

**Abreviações de caminho**

| Sigla | Caminho |
|---|---|
| `R/` | `sigu/Relatorio/src/br/ucam/campos/dti/` |
| `RP/` | `sigu/Relatorio/WebContent/paginas/` |
| `RE/` | `sigu/RelatorioEJB/ejbModule/br/ucam/campos/dti/relatorio/` |
| `SD/` | `sigu/DomainEJB/ejbModule/br/ucam/campos/dti/` |
| `SS/` | `selecao-service/src/main/java/br/ucam/campos/selecaoservice/` |

Não há manual do módulo de relatórios nos repositórios (os dois PDFs do `sigu` são modelos de currículo e de acompanhamento de estágio).

---

### relatorios--catalogo--1
**Pergunta:** (proposta) "Acessados com frequência" são os quatro relatórios que a pessoa logada mais gerou.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** O sistema atual **não trata**: não há lista de frequentes nem favoritos; o menu é uma árvore fixa em ordem alfabética. Mas **o dado para fazer a proposta já é gravado**: toda geração de relatório registra data e hora, unidade, usuário, nome do relatório e IP. Dá para contar os mais gerados por pessoa sem criar nada novo no registro.
**Evidência:** `R/aspect/LoggerPrintReport.java:130-145` — `@AfterReturning("call(* ...AbstractReportGenerator.gerar(..))") ... service.saveReportPrintLog(usuario, unidade, request.getRemoteAddr(), joinput);` · `SD/services/LoggerService.java:91-98` — `logRelatorio.setOidusuario(...); logRelatorio.setRelatorio(obj.getClass().getSimpleName());`.
**O que ainda falta decidir:** a janela da contagem (sempre, último semestre, últimos 90 dias) e se conta por unidade. O log grava o nome técnico da classe, não o título do relatório; é preciso uma tabela de correspondência.

### relatorios--catalogo--2
**Pergunta:** Quem vê cada relatório: por perfil, por assunto, por unidade.
**Veredito:** RESPONDIDA
**Resposta:** Por **unidade e por grupo ou usuário**, item a item. O menu de relatórios de uma pessoa é montado com os itens liberados para os grupos dela naquela unidade, somados aos itens liberados diretamente a ela naquela unidade. Trocar de unidade recarrega o menu. O "assunto" entra só como divisão do menu (acadêmico, estágio, extensão), por um trecho do endereço do item. A liberação é cadastrada no Gerencial.
Ressalva: a verificação é do **menu**, não da página. O filtro de acesso só confere se há usuário logado, e o aspecto de autorização por tela está desligado. Quem souber o endereço de um relatório consegue abri-lo sem tê-lo no menu.
**Evidência:** `SD/services/MenuService.java:331-356` — `Unidadegrupomenu ugm, Unidadegrupousuario ugu ... us.oid = usuario AND ap.oid = aplicacao AND un.oid = unidade` · `SD/repositorio/RepositorioUsuario.java:95-109` · `R/generic/web/filter/AcessoUrlPhaseListener.java:42-46` · `R/aspect/Autorizacao.java:20` — `//@Aspect`.
**O que ainda falta decidir:** se o novo catálogo verifica a permissão também ao abrir o relatório (hoje não); a matriz de quem vê o quê é dado do Gerencial, não código.

### relatorios--filtros--1
**Pergunta:** (proposta) Período e curso são obrigatórios; turno depende do curso; "ingresso entre" exige De antes de Até.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:**
- **Período letivo e curso obrigatórios**: o sistema **já faz** ("Por favor informe o Período Letivo", "Por favor informe o Curso"). E há uma dependência que a proposta não cita: a lista de cursos só é carregada depois de escolhido o período, e traz apenas os cursos **com alunos naquele período e naquela unidade**.
- **Turno**: nos relatórios que o usam, é obrigatório ("Por favor informe o Turno"). Não vi a lista de turnos ser filtrada pelo curso; é um componente à parte.
- **"Ingresso entre" (De/Até)**: **não existe** no módulo. Ingresso aparece só como forma de ingresso e como processo seletivo, nos relatórios de vestibular. Não há filtro por intervalo de data de ingresso, nem a validação De antes de Até.
**Evidência:** `RP/resource/periodoLetivo.xhtml:17` · `RP/resource/curso.xhtml:17` — `required="true" requiredMessage="Por favor informe o Curso"` · `R/helper/AbstractCursoHelper.java:40` — `getListaCursosComAlunos(periodo.getAno(), periodo.getSemestre(), unidade.getOid())` · `RP/resource/turno.xhtml:68`.
**O que ainda falta decidir:** se "ingresso entre" é filtro novo (precisa de consulta nova) e em que unidade ele mede (data, ou período letivo de ingresso, que é o que o banco guarda); se turno deve mesmo depender do curso.

### relatorios--filtros--2
**Pergunta:** O dado de matrícula é atualizado uma vez por dia?
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Depende de onde o relatório lê.
- Os relatórios do **SIGU** consultam o banco acadêmico **na hora**: a matrícula feita agora aparece no relatório gerado em seguida. Para eles a frase da tela ("matrícula de hoje só entra amanhã") está **errada**.
- Os painéis e relatórios que leem as **tabelas analíticas** (`academicoalunomatricula`, `financeiroaluno`), como evasão e o relatório de alunos da contabilidade, dependem de uma carga. A carga não está em nenhum repositório lido, então a frequência (diária ou outra) **não está no código**.
**Evidência:** `SD/repositorio/RepositorioAluno.java:3118-3125` — `FROM academico.matricula M INNER JOIN academico.periodoletivo pl ... INNER JOIN academico.situacaomatricula sm` (consulta direta) · `SS/repositories/RepositoryEvasaoAnalytics.java:41-48` — `FROM academicoalunomatricula am`.
**O que ainda falta decidir:** de qual das duas fontes o novo catálogo vai ler. Se for da analítica, perguntar à TI a agenda da carga e gravar na tela a data da última, em vez de uma frase fixa.

### relatorios--filtros--3
**Pergunta:** A pessoa só consulta cursos e campi a que tem acesso, ou qualquer um?
**Veredito:** RESPONDIDA
**Resposta:** **Campus: só os dela.** A unidade do relatório é a unidade selecionada na sessão, escolhida entre as unidades vinculadas ao usuário; os relatórios recebem essa unidade e filtram por ela. **Curso: qualquer um da unidade.** A lista traz todos os cursos com alunos no período naquela unidade, sem restrição por coordenação ou por pessoa. Um coordenador com o relatório no menu vê todos os cursos do campus.
**Evidência:** `R/helper/AbstractHelper.java:28-29` — `@ManagedProperty(value="#{principalHelper.unidade}") protected Unidade unidade;` · `R/generic/web/PrincipalHelper.java:90-98` (unidades do usuário) · `R/helper/AbstractCursoHelper.java:40` · `R/helper/academico/aluno/AlunosPorSituacaoHelper.java:91` — `withUnidade(this.unidade)`.
**O que ainda falta decidir:** se o coordenador deve ficar restrito aos seus cursos (hoje não fica), e se existe visão de várias unidades de uma vez (hoje é uma por vez).

### relatorios--resultado--1
**Pergunta:** A meta de evasão. A tela usa 1,5%.
**Veredito:** NÃO ESTÁ NO CÓDIGO
**Resposta:** Não há meta de evasão em nenhum repositório lido: nem constante, nem parâmetro, nem coluna. O que existe é a **composição** da evasão na analítica: por curso e por unidade, contam-se ativos, trancamentos, abandonos e cancelamentos do semestre, e compara-se com o **mesmo semestre do ano anterior**. "Abandono" é o aluno que está como "não matriculado"; entram só presencial e EAD. Não há taxa calculada no servidor, só as contagens.
**Evidência:** `SS/repositories/RepositoryEvasaoAnalytics.java:38-40` — `WHEN am.situacao = 'NÃO MATRICULADO' THEN 'ABANDONO'` · `:49` — `am.situacao IN ('MATRICULADO','NÃO MATRICULADO','CANCELADO','TRANCADO')` · `:118-119` — `int anoComp = ano - 1;`.
**O que ainda falta decidir:** o valor da meta, o denominador da taxa (ativos? total?) e se transferido e jubilado contam como evasão (hoje ficam fora). O 1,5% da tela não tem fonte.

### relatorios--resultado--2
**Pergunta:** O limite de faltas que acende o aviso. A tela usa 25%.
**Veredito:** RESPONDIDA
**Resposta:** O critério é **25% da carga horária da disciplina**, como a tela supõe. O limite de faltas de cada disciplina oferecida é carga horária × 0,25, **truncado para inteiro** (60 horas → 15 faltas; 50 horas → 12, não 12,5). O valor sai impresso no diário de classe. Dois cuidados: o limite é **por disciplina e em número de faltas**, não um percentual geral do aluno; e os relatórios atuais não têm "aviso" que acenda, só imprimem o limite e a situação "reprovado por falta".
**Evidência:** `SD/services/DisciplinaServices.java:1118-1121` — `Double limiteFaltas = ...getCargahoraria() * 0.25; return limiteFaltas.intValue();` · `RE/modelorelatorio/impl/academico/professor/ModeloRelatorioDiarioFrente.java:183-184`.
**O que ainda falta decidir:** a partir de quanto o aviso acende (em 25% o aluno já reprovou; um aviso útil vem antes, por exemplo em 20%) e se o truncamento se mantém.

### relatorios--resultado--3
**Pergunta:** (proposta) Exporta em PDF com timbre, Excel e Word.
**Veredito:** RESPONDIDA
**Resposta:** O sistema atual **já faz**, e oferece um formato a mais. Os relatórios de modelo Jasper saem em **PDF, Word (.doc), Excel (.xls) e HTML**; os montados em código (iText) saem **só em PDF**. PDF e HTML abrem na tela; Word e Excel baixam. O timbre existe: logo no cabeçalho e endereço da unidade no rodapé. Os formatos são os antigos (.doc e .xls, não .docx e .xlsx). CSV existe na lista de formatos, mas nenhum modelo o oferece.
**Evidência:** `RE/modelorelatorio/ModeloRelatorioFile.java:29-32` — `PDF, WORD, EXCEL, HTML` · `RE/modelorelatorio/ModeloRelatorioItext.java:14` — só `PDF` · `sigu/GenericJSFUtils/ejbModule/br/ucam/campos/dti/generic/web/util/enums/FormatoRelatorioEnum.java` — `WORD(...,".doc","attachment",...)` · `RE/modelorelatorio/impl/academico/aluno/ModeloRelatorioAlunosPorSituacao.java:81-82` — `put("logo", ...); put("endereco", ...)`.
**O que ainda falta decidir:** se HTML sai da lista; se documentos oficiais (histórico, diploma, declaração) ficam só em PDF, como hoje.

### relatorios--resultado--4
**Pergunta:** O que a exportação pode levar de dado pessoal (CPF, contato) e quem pode exportar.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** Hoje **não há restrição**. O relatório de alunos por situação, por exemplo, leva matrícula, nome, **CPF, e-mail e telefones**, além de coeficiente e observação, em qualquer formato, inclusive Excel. Outros levam endereço (etiquetas). Quem tem o relatório no menu exporta tudo; não existe permissão separada para exportar, nem versão sem dado pessoal, nem máscara de CPF. O único controle é o registro de quem gerou (usuário, unidade, IP, relatório), que não guarda o formato nem os filtros usados.
**Evidência:** `SD/repositorio/dto/AlunosPorSituacaoDTO.java:7-15` — `matricula, nomeAluno, cpf, situacaoMatricula, data, email, ca, observacao, telefones` · `SD/repositorio/RepositorioAluno.java:3118` — `SELECT DISTINCT ... P.email, ... t.ddd, t.numero, cp.numero` · `SD/services/LoggerService.java:91-98`.
**O que ainda falta decidir:** a política em si (encarregado de dados): quais colunas pessoais cada relatório pode levar, quem exporta, e se o registro passa a guardar formato e filtros.

### relatorios--resultado--5
**Pergunta:** Situações do aluno (Matriculado, Trancado, Evadido, Formado): a lista completa e o que decide cada uma.
**Veredito:** RESPONDIDA EM PARTE
**Resposta:** A lista do SIGU é um cadastro no banco (`situacaomatricula`) com onze códigos conhecidos pelo código: **01 Ativo, 02 Não matriculado, 03 Trancado, 04 Transferido, 05 Jubilado, 06 Pré-matriculado, 07 Abandono, 08 Cancelado, 09 Formando, 10 Troca de curso, 12 Em defesa**. O SigFin conhece mais um: **18 Trancado com pendência**. A situação é **por período letivo** (está na matrícula do período, não no aluno).
Os quatro nomes da tela não batem com isso: não existe "Evadido" nem "Formado". "Evadido" é uma leitura da analítica (trancado + não matriculado + cancelado), e o que existe é "Formando". A tabela analítica usa outros rótulos: MATRICULADO, NÃO MATRICULADO, CANCELADO, TRANCADO e MATRICULA_PENDENTE (esta última excluída dos relatórios).
O que **decide** cada situação (quem muda, quando, por qual ato) não foi levantado: está espalhado nos serviços de matrícula, trancamento e rematrícula do SIGU, que não li.
**Evidência:** `SD/repositorio/Constantes.java:11-21` — `SITUACAO_MATRICULA_ATIVO = "01" ... SITUACAO_MATRICULA_EMDEFESA = "12"` · `sigfin/Domain/ejbModule/br/ucam/campos/domain/services/Constantes.java:36` — `TRANCADO_COM_PENDENCIA = "18"` · `R/helper/academico/aluno/AlunosPorSituacaoHelper.java:46-47` (lista vem da tabela) · `rel-contabilidade-backend/src/main/java/br/ucamcampos/relcontabilidadebackend/contabilidade/repository/Queries/Queries.java:31` — `situacao IS DISTINCT FROM 'MATRICULA_PENDENTE'`.
**O que ainda falta decidir:** os rótulos que a tela usa (os do SIGU ou agrupamentos, e quais códigos entram em cada grupo); a regra de transição de cada situação, com a secretaria.

---

## Descobertas fora da lista

1. **O módulo real tem cerca de 75 relatórios acadêmicos e cada um tem filtros próprios**, montados com peças comuns (período letivo, curso, turno, turma, aluno, professor, matriz, forma de ingresso, processo seletivo, dia da semana). Uma tela única de "filtros da consulta" não cobre o conjunto. `RP/rel_academico/**` · `RP/resource/*.xhtml`.

2. **A lista de cursos depende do período e só mostra curso com aluno.** Curso sem aluno no período não aparece para escolha. `R/helper/AbstractCursoHelper.java:36-40`.

3. **Toda geração é registrada**, com usuário, unidade, IP e relatório. É a única trilha de auditoria de acesso a dado pessoal que existe hoje, e não guarda formato nem filtros. `R/aspect/LoggerPrintReport.java:130-145`.

4. **A permissão é do menu, não da página.** O filtro de acesso só exige usuário logado e a autorização por tela está desligada no código. `R/generic/web/filter/AcessoUrlPhaseListener.java:42-46` · `R/aspect/Autorizacao.java:20`.

5. **Uma unidade por vez.** Todo relatório recebe a unidade da sessão; não há consulta de vários campi num só relatório no SIGU. `R/helper/AbstractHelper.java:28-29`.

6. **Alunos por situação usa também o período anterior.** A consulta busca o período letivo anterior ao escolhido antes de listar (o uso que faz dele não foi lido até o fim), e a ordenação é escolha do usuário (padrão: nome). `SD/repositorio/RepositorioAluno.java:3115` · `R/helper/academico/aluno/AlunosPorSituacaoHelper.java:35`.

7. **O limite de faltas é truncado.** Carga horária × 0,25 com a parte decimal descartada: em disciplina de 50 horas o limite é 12 faltas. `SD/services/DisciplinaServices.java:1119-1120`.

8. **Evasão, na analítica, é comparada ano contra ano**, mesmo semestre, e junta a última mensalidade do aluno ao registro (dá para estimar a receita perdida). Só presencial e EAD entram. `SS/repositories/RepositoryEvasaoAnalytics.java:26-49,117-119`.

9. **O relatório de alunos da contabilidade cruza situação de matrícula com dívida**: só bolsistas (valor de bolsa maior que zero) com parcela vencida, excluindo acordo. É um relatório "acadêmico" que vive no serviço financeiro. `rel-contabilidade-backend/.../repository/Queries/Queries.java:22-35`.

10. **Há um segundo caminho para gerar relatório, por serviço**, sem passar pelas telas: um servlet com comandos para boletim de notas e coeficiente de rendimento. Vale conferir a proteção dele antes de expor relatórios em outro canal. `R/generic/web/service/ServletReport.java` · `R/generic/web/service/actions/commands/RelatorioBoletimNotas.java` (existência confirmada; conteúdo não lido).
