# Inventário do parque da UCAM contra o UCAMDS

Fechado em 06/10/2026. Leitura apenas: nenhum repositório da organização foi alterado.
Complementa `inventario.md` (vestibular) e `proposta-lib-do-time.md`.

## Alcance

A organização `universidade-candido-mendes` tem 52 repositórios. Foram lidos os 17 de front-end;
cada sistema tem o levantamento completo em `levantamentos/<repo>.md`, com rotas, peças, regras de
negócio com arquivo e linha, API e perguntas em aberto.

| Sistema | Repositório | Stack | Telas | Regras lidas |
|---|---|---|---|---|
| Gerencial v3 | `Gerencial-v3.0-2026` | Angular 22, sem lib de UI | 16 | 49 |
| Login único v2 | `portal-login-v2` | Angular 20, sem lib de UI | 5 + 2 diálogos | 46 |
| Isenção v2 | `isencao-v2` | Angular 20, CSS do UCAMDS copiado | 9 | 51 |
| Secretaria virtual | `secretaria-virtual-frontend` | Angular 18, Material, lib do time | 6 + 4 diálogos | 58 |
| Financeiro novo | `financeiro-frontend` | Angular 18, Material, lib do time | 6 + 1 diálogo | 67 |
| Modelo de projeto | `ucam-frontend-template` | Angular 18, Material, lib do time | 1 | 6 |
| Relatórios de contabilidade | `rel-contabilidade-frontend` | Angular 9, Material, libs internas | 19 relatórios em 8 formas | 44 |
| Financeiro antigo (SigFin) | `financeiro-front-end` | Angular 9, Material, libs internas | 20 | 52 |
| Captação | `captacao-frontend` | Angular 9, Material, Highcharts | 8 | 53 |
| Gestão de polos | `gestaodepolos-frontend` | Angular 10, Material, Highcharts | 5 + 8 diálogos | 34 |
| Turmas compartilhadas | `turmas-compartilhadas-frontend` | Angular 9, Material | 3 + 6 diálogos | 31 |
| Extensão | `extensao-frontend` | Angular 5, Materialize | 41 | 72 |
| Diploma | `diploma-frontend` | Angular 6, Material | 9 grupos | 58 |
| Consulta de diploma | `consulta-diploma-frontend` | Angular 9 | 2 | 14 |
| Protocolo | `protocolo-frontend-novo` | Angular 7, Material | 12 | 69 |
| Vestibular (legado) | `processo-seletivo-frontend` | Angular 9, Material | 17 + 8 diálogos | 115 |
| Vestibular (reescrita) | `vestibular-online` (local) | Angular 21, `@ucam/ui` | 15 | 87 |

São 906 regras de negócio lidas no código. Os levantamentos do protocolo, diploma e extensão foram
feitos por leitores encadeados e tiveram só a estrutura conferida; os demais tiveram afirmações
conferidas por amostra contra o código.

Ficaram fora: os back-ends (lidos só onde definem regra de tela), os sites em PHP, o app Flutter e
os sistemas em JSF, que estão clonados e contados (SIGU 971 páginas, SIGU 2.0 323, SigFin 114,
portal de login antigo 7) e são a onda 6.

## O que o parque inteiro mostra

**1. Quase nada é "falta"; quase tudo é "parcial".** O DS já tem os padrões de base (listagem,
formulário, triagem, painel, relatório). O que falta são variações e peças que se repetem em vários
sistemas. Fechar essas peças rende mais do que desenhar tela por tela.

**2. Só um sistema usa o UCAMDS, e por cópia.** A isenção v2 embarca um `ucam-ds.css` de 401 KB com
tema escuro forçado. O Gerencial v3 segue uma skill local com bordô `#a91733` e Inter; o login único
tem moldura própria com `#8f0324` e Source Serif 4. Três sistemas novos, três identidades.

**3. A lib do time entrega só a moldura e dois campos.** Nos dois apps Angular 18, vêm dela
`ucam-page`, `ucam-input` e `ucam-select`; tabelas, paginação, abas, diálogos e botões são Material
direto. Há três versões em uso (0.0.31, 0.0.54 e 18.2.2) e o prefixo `ucam-` também nomeia
componentes locais dos apps.

**4. Nenhum sistema conhece perfil.** Em todos basta ter sessão para abrir qualquer tela; vários
têm rotas sem guarda. É a pergunta em aberto que mais se repete.

**5. Diálogo é o veículo dominante no legado**: 48 na extensão, 15 no diploma, usado até para
"carregando" e para mensagem de resultado.

## Peças e padrões que faltam, pela frequência

É a fila de trabalho do DS. Cada linha diz onde a necessidade apareceu.

| Falta | Onde aparece | Tipo |
|---|---|---|
| Linha que expande para subtabela | captação, polos, turmas (6 ocorrências), relatórios de mensalidade (5 telas), financeiro novo, extensão | peça da tabela |
| Linha de totais e rodapé por coluna | polos, metas, relatórios (3), financeiro antigo | peça da tabela |
| Cabeçalho agrupado e tabela cruzada com colunas dos dados | relatórios (arrecadação, receita diária), captação, provisão | peça da tabela |
| Chegada por token e sessão encerrada | todos os sistemas internos | padrão |
| Exportar com escolha de nível e formato; fila de exportações | relatórios (19 telas), polos, captação | padrão |
| Processo em segundo plano com progresso | financeiro novo (4 telas), relatórios (4), extensão, Alterdata | padrão |
| Filtros em cascata | extensão (9 pontos), vestibular, secretaria, turmas | padrão |
| Abas que trocam os dados da mesma tabela | relatórios (15 de 19) | padrão |
| Indicador com variação, com parte do todo e meta × realizado | captação, polos, financeiro | variação do stat |
| Seletor de mês e intervalo de datas | financeiro novo, relatórios, captação | peça |
| Remessa e retorno de arquivo; importação de planilha com validação por linha | financeiro antigo (5 telas), financeiro novo | padrão |
| Formulário com sublista editável | extensão (6), financeiro antigo (4), secretaria | padrão |
| Grade de lançamento com célula editável | extensão (nota e falta) | peça |
| Visualizador de PDF e documento para impressão | diploma, contrato do vestibular, livro de registros | peça |
| Editor de texto rico | vestibular, extensão (e-mail), isenção v2 | peça |
| Atribuição em lote com contador de vagas | secretaria (alocação) | padrão |
| Gráficos: funil, rosca com valor central, coluna com linha, barra empilhada em lista | captação, polos | variação do chart |
| Consulta pública sem moldura | consulta de diploma, acompanhamento da isenção | padrão |
| Mapa de questões, relógio, indicador de salvamento, stepper vertical | vestibular | peças |
| Permissão em três colunas (unidade, grupo, menu) | Gerencial v3 | tela |

## O que já entrou no DS em 06/10

| Tela | Origem | Peça nova |
|---|---|---|
| `portal/recuperar-senha` | login único v2 | nenhuma |
| `portal/recuperar-senha-codigo` | login único v2 | nenhuma |
| `portal/definir-senha` | login único v2 | nenhuma |
| `gerencial/unidades` | Gerencial v3, referência das 7 listagens de cadastro | ação inativar e reativar |
| `gerencial/unidade-form` | Gerencial v3, referência dos formulários de cadastro | nenhuma |
| `sigfin/inadimplencia` | relatórios de contabilidade, referência dos 5 relatórios de mensalidade por aluno | linha que abre subtabela e linha de totais |
| `sigfin/recebimentos` | relatórios de contabilidade (receita diária), referência dos relatórios em matriz | cabeçalho em dois andares |
| `sigfin/relatorio-filtros` | a barra de filtros comum aos 19 relatórios de contabilidade | nenhuma |
| `gerencial/grupos`, `aplicacoes`, `mantenedoras`, `cartoes-seguranca` e os quatro formulários | Gerencial v3, os cadastros que estavam sem tela no menu | nenhuma |
| `sigfin/tipos-bolsa`, `convenios`, `bancos` e os três formulários | financeiro antigo; o menu do SigFin trocou nomes supostos pelos cadastros reais | nenhuma |
| `sigfin/feriados-bancarios` e o formulário | financeiro antigo | nenhuma |
| `gerencial/grupo-usuarios` | Gerencial v3, a aba Usuários de Grupo × Menu | ação adicionar integrante |
| `portal/chegada` | a rota de entrada por token de todos os sistemas internos | nenhuma |
| `portal/sessao-encerrada` | Gerencial v3 e o tratamento de sessão dos demais | nenhuma |

O DS passou de 31 para 58 telas. Cinco telas antigas foram completadas na marcação com regras reais: análise e acompanhamento da isenção, as duas telas de requerimento do Protocolo e o formulário de usuário do Gerencial. As telas que já existiam de Gerencial, Portal e Isenção receberam 52 notas e regras vindas da leitura dos sistemas reais; as regras marcadas como lidas no código passaram de 8 para 60. A tabela ganhou três partes com contrato e demo: linha de totais, cabeçalho em dois andares e linha que abre subtabela (por ora só no Trilho A).

## Divergências entre o DS e os sistemas novos

Estão detalhadas nos arquivos `*--comparacao.md`. As que pedem decisão:

- **Gerencial.** O DS tem `usuario-detalhe` e `auditoria`, que o sistema não tem (a auditoria foi removida do servidor). A permissão real é por par unidade e grupo e grava a cada clique; a tela do DS não tem a unidade e salva em lote. O início do DS mostra indicadores que nenhum endpoint fornece.
- **Login único.** Não há entrada por Microsoft ou Google, nem bloqueio por tentativas, nem política de senha. Os grupos reais da grade são Campos, Rio, ITECAM, ICAM e EAD; o DS não tem ICAM.
- **Isenção.** Disciplina sem decisão não barra o fechamento e vira "Não isenta" ao concluir, o contrário do que o DS desenhou. Não há prazo de 15 dias, nem aviso ao candidato por e-mail. O corte da sugestão é 70%, não 75%. A análise com IA existe e o DS só a desenha em parte.

## Alertas de segurança achados na leitura

Conferidos no código; os valores não foram copiados para nenhum arquivo.

- `portal-login-v2`: senha mestra fixa no código, aceita no login para qualquer CPF, comentada como temporária de um incidente.
- `financeiro-frontend`, `secretaria-virtual-frontend`, `ucam-frontend-template`: token pessoal do GitHub versionado no `.npmrc`.
- Vários sistemas: rotas administrativas sem guarda, token de sessão que não é enviado nas chamadas e telas com dados pessoais acessíveis só pelo identificador na URL.

## Próximos passos

1. Onda 1, continuação: permissão em três colunas do Gerencial, chegada por token e sessão encerrada, análise com IA da isenção, correções das telas que divergem.
2. Peças da tabela (linha expansível, totais, cabeçalho agrupado): destravam as ondas 2, 3 e 5 de uma vez.
3. Onda 2: as 8 formas de relatório.

## Regras de negócio respondidas pelo código (06/10/2026)

As perguntas que estavam abertas nas telas foram levadas aos back-ends, ao banco e aos manuais dos
sistemas antes de irem a pessoas. De 219 itens, 131 foram respondidos, 58 em parte e 30 não estão no
código. As respostas, com arquivo e linha, estão em `respostas-pelo-codigo/`, uma por sistema.
As telas de referência passaram a 506 regras: 295 lidas no código, 137 abertas e 74 propostas. O
que continua aberto é decisão, e está em `perguntas-em-aberto.md` e na página de respostas.

Telas refeitas porque o código as desmentia: cálculo de mensalidade do SigFin (percentuais, ordem
da bolsa e o que acontece depois do vencimento) e, no Protocolo, o cadastro de natureza (setor por
unidade e tipos), o encaminhar (nível e despacho), os níveis do integrante e o prazo em dias corridos.

## Telas de referência entregues até 06/10/2026

O UCAMDS tem 80 telas de referência em 8 projetos: Protocolo (10), Portal (7), SigFin (19),
Relatórios (3), Gerencial (20), Isenção (8), Secretaria virtual (5) e Vestibular online (8).

| Sistema da organização | Projeto no UCAMDS | O que entrou |
|---|---|---|
| Gerencial-v3.0-2026 | `gerencial` | todos os cadastros (usuários, grupos, aplicações, menus, unidades, mantenedoras, cartões) e as três visões de permissão |
| portal-login-v2 | `portal` | entrada, recuperar e definir senha, chegada, sessão encerrada, grade de módulos |
| isencao-v2 | `isencao` | fila, análise, acompanhamento, resultado e cadastros |
| financeiro-frontend | `sigfin` | cálculo em lote, datas de vencimento, envio, baixa, sincronização e pagamentos Sicoob |
| financeiro-front-end (legado) | `sigfin` | caixa, recebimentos, inadimplência, bolsas, convênios, bancos, feriados |
| secretaria-virtual-frontend | `secretaria` | sala de matrícula, matrícula do candidato, alocação de alunos, consulta de aluno, matrícula de extensão |
| vestibular-online e processo-seletivo-frontend | `vestibular` | entrada, instruções, questão, redação, resultado, correção de redação e cadernos |
| protocolo-frontend-novo | `protocolo` | caixa de entrada, detalhe, novo requerimento, naturezas (com tipos), setores, integrantes, gerencial, analytics |

Peças criadas por causa dessas telas, todas com contrato: totais, cabeçalho agrupado e linha com
detalhe na tabela; mapa de questões, relógio e salvamento. As seis estão desenhadas no Trilho A
(`@ucam/css`) e ainda não têm componente no Trilho B (`@ucam/ui`).

Ainda sem tela de referência: captação, diploma e consulta de diploma, gestão de polos, turmas
compartilhadas, extensão, relatórios de contabilidade (além das três formas de relatório) e o SIGU
em JSF.
