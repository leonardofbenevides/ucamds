# Inventário do financeiro-front-end (Angular 9) — SigFin legado

Raiz: `C:\Users\Leonardo\Documents\UCAM-repos\financeiro-front-end`. As referências `arquivo:linha` são relativas a `src/app/` (ou `src/environments/` quando indicado).

**Cobertura da leitura.** Li por inteiro: README, todos os módulos de rota, `app.component`, `interceptor.module`, `url.provider`, `shared/services`, validadores, pipes, modelos, `base-resource-form`, os componentes de `shared/components` (classe e template), os módulos `bolsa`, `ceeac`, `cobrafix`, `siscorp` e `aluno/acordo-financeiro` (classes, serviços, templates). Em `convenio`, `cadastros-basicos` e `controle-cheques` li os templates inteiros e, das classes, o que define formulário, validação, consulta, colunas, diálogos e navegação (não reli linha a linha os trechos repetidos de `confirmDelete`, `cleanQueryParams` e paginação). Do cliente HAL em `shared/hal` li só a configuração e as assinaturas de busca. Não li `.scss`/`.sass` nem `.spec.ts`.

---

## 1. Rotas e telas

Rotas raiz em `app-routing.module.ts:8-79`; todo o resto é lazy. O guard é `AuthGuard`, que só verifica `state.authenticated` (`core/services/auth/auth-guard.service.ts`). A aplicação do guard é irregular: ver a coluna.

### 1.1 Tabela de rotas

| URL | Componente | Template | Guard |
|---|---|---|---|
| `''` | `HomeComponent` | `shared/components/home/home.component.html` | AuthGuard |
| `login` e `login/:token/:user` | `LoginComponent` | `shared/components/login/login.component.html` | nenhum |
| `ceeac/exportacao` | `ExportacaoCeeacComponent` | `paginas/ceeac/exportacao-ceeac/exportacao-ceeac.component.html` | AuthGuard (no pai) |
| `ceeac/processar-pagamentos` | `ImportacaoCeeacComponent` | `paginas/ceeac/importacao-ceeac/importacao-ceeac.component.html` | AuthGuard (no pai) |
| `cobrafix/exportacao` | `ExportacaoCobrafixComponent` | `paginas/cobrafix/exportacao-cobrafix/exportacao-cobrafix.component.html` | AuthGuard (no pai) |
| `cobrafix/processar-pagamentos` | `ImportacaoCobrafixComponent` | `paginas/cobrafix/importacao-cobrafix/importacao-cobrafix.component.html` | AuthGuard (no pai) |
| `siscorp/arrecadacao` | `ExportacaoArrecadacaoComponent` | `paginas/siscorp/exportacao-arrecadacao/exportacao-arrecadacao.component.html` | AuthGuard (no pai) |
| `siscorp/cartao` | `ExportacaoCartaoComponent` | `paginas/siscorp/exportacao-cartao/exportacao-cartao.component.html` | AuthGuard (no pai) |
| `siscorp/recebimento-diario` | `RecebimentoDiarioComponent` | `paginas/siscorp/recebimento-diario/recebimento-diario.component.html` | AuthGuard (no pai) |
| `cadastros-basicos/feriado-bancario` | `FeriadoBancarioComponent` | `paginas/cadastros-basicos/feriado-bancario/feriado-bancario.component.html` | **nenhum** |
| `cadastros-basicos/feriado-bancario/new`, `.../edit/:oid` | `FeriadoBancarioFormComponent` | `.../feriado-bancario-form/feriado-bancario-form.component.html` | **nenhum** (na prática o formulário abre como diálogo) |
| `cadastros-basicos/recebimento-diverso` (+ filhas `new`, `edit/:oid`) | `RecebimentoDiversoComponent` + `RecebimentoDiversoFormComponent` | `.../recebimento-diverso/*.html`, `.../recebimento-diverso-form/*.html` | AuthGuard |
| `cadastros-basicos/liberacao` | `LiberacaoComponent` | `.../liberacao/liberacao/liberacao.component.html` | AuthGuard |
| `cadastros-basicos/liberacao/new`, `.../edit/:oid` | `LiberacaoFormComponent` | `.../liberacao-form/liberacao-form.component.html` | AuthGuard (na prática abre como diálogo) |
| `cadastros-basicos/tipo-banco` (+ filhas `new`, `edit/:oid`) | `TipoBancoComponent` + `TipoBancoFormComponent` | `.../tipo-banco/tipo-banco/*.html`, `.../tipo-banco-form/*.html` | AuthGuard |
| `bolsa/tipobolsa` (+ filhas `new`, `edit/:oid`) | `TipoBolsaComponent` + `TipoBolsaFormComponent` | `paginas/bolsa/tipo-bolsa/tipo-bolsa/*.html`, `.../tipo-bolsa-form/*.html` | **nenhum** |
| `bolsa/solicitacaobolsa` | — (`routes = []`) | `solicitacao-bolsa.component.html` (1 linha) | — |
| `convenio/tipoconvenio` (+ filhas `new`, `edit/:oid`) | `TipoConvenioComponent` + `TipoConvenioFormComponent` | `paginas/convenio/tipo-convenio/*/*.html` | AuthGuard |
| `convenio/alunoconvenio` | `AlunoConvenioComponent` | `paginas/convenio/aluno-convenio/aluno-convenio/aluno-convenio.component.html` | AuthGuard |
| `controle-cheques/busca-aluno` | `ChequeBuscaAlunoComponent` | `paginas/controle-cheques/cheque-busca-aluno/*.html` | **nenhum** |
| `controle-cheques/busca-numero-data` | `ChequeBuscaNumeroDataComponent` | `paginas/controle-cheques/cheque-busca-numero-data/*.html` | **nenhum** |
| `aluno-acordo-financeiro/:oidunidade/:oidaluno` | `AcordoFinanceiroComponent` | `aluno/acordo-financeiro/acordo-financeiro.component.html` | **nenhum** (tela pública do aluno) |

Sem rota ou esqueleto (**nao-migrar**): `solicitacao-bolsa` (rotas vazias, template de 1 linha); `aluno-convenio-form`, `feriado-bancario-list`, `recebimento-diverso-list` ("... works!"); `server-errors-messages`, `error-message`, `success-message` (esqueletos); `regressao-bolsa-vencimento` e `agencia-bancaria` não têm rota própria alcançável — vivem embutidos nos formulários de tipo de bolsa e tipo de banco (o módulo de rotas de agência existe, mas não é montado em nenhum caminho: `cadastros-basicos.module.ts:21`).

### 1.2 Formas que se repetem

| # | Forma | Telas |
|---|---|---|
| 1 | Cadastro com busca no cabeçalho: pesquisa rápida abre uma tabela flutuante; escolher a linha carrega o formulário abaixo (Salvar / Excluir / Cancelar ou Limpar) | tipo de bolsa, tipo de convênio, recebimento diverso, tipo de banco |
| 2 | Lista com Novo/Editar/Excluir e formulário em diálogo | feriado bancário; sublistas: regressão por vencimento, agência bancária, liberação |
| 3 | Exportação para cobradora: buscar por referência ou por pessoa, três indicadores, tabela, diálogo para escolher cobranças, gerar arquivo | CEEAC exportação, Cobrafix exportação |
| 4 | Retorno de cobradora: enviar arquivo, indicadores, conferir em tabela, salvar | CEEAC processar pagamentos, Cobrafix processar pagamentos |
| 5 | Consulta em cartões por pessoa (não é tabela): cartão com foto, nome, total e itens expansíveis | controle de cheques (2 telas), recebimento diário |
| 6 | Exportação de arquivo por período, sem prévia | Siscorp cartão; botões de novação e recebimento diverso em Siscorp arrecadação |
| 7 | Autoatendimento do aluno: selecionar parcelas em atraso e gerar cobrança | acordo financeiro |

### 1.3 Telas, uma a uma

#### Bolsa

**`bolsa/tipobolsa` — "Tipo Bolsa"** (forma 1). Cadastro dos tipos de bolsa da unidade.
- Arquétipo: cadastro mestre-detalhe.
- Cabeçalho: `app-pesquisa-rapida` com colunas Código, Descrição; consulta `byTermAndUnidadePaged` por `oidunidade`.
- Formulário (`tipo-bolsa-form.component.html`): `codigo` (Código), `descricao` (Descrição), `valorintegral` (interruptor "Valor integral"), `desconto` ("Aplicar desc. antecipação"), `retirarigpm` ("Retirar cobrança IPGM"). Botões Salvar, Excluir, Cancelar.
- Seção "Regressão bolsa vencimento": botão "Nova vencimento" (só com o tipo salvo) e tabela paginada (10): Dia de vencimento, Valor, Incremental, ações Editar/Excluir.
- **Diálogo "Vencimento"** (45% de largura): `diavencimento` (Dia de vencimento), `percentual` (interruptor), `valor`, `descontoincremental` (interruptor "Desconto incremental"); Salvar.
- **Diálogo de exclusão** (`ConfirmDeleteDialogComponent`, 35%): texto "deseja excluir?", botões Cancelar e Excluir (cor `excluir`). Usado em todos os cadastros.
- Classificação: **parcial**. Base: `listagem-inspetor` (tela `protocolo/parametros-setores`) ou `formulario-entidade` (tela `protocolo/natureza-form`) + `confirmacao-destrutiva`. Falta: formulário com sublista editável em diálogo (mestre-detalhe) como tela de referência; a busca que abre tabela flutuante pode virar `combobox`.

#### Convênio

**`convenio/tipoconvenio` — "Convênio"** (forma 1). Cadastro dos convênios.
- Pesquisa rápida: Código, Descrição, Paga dependência; consulta `byTermPaged`.
- Formulário: `codigo`, `descricao`, `valorintegral` (interruptor "Valor integral"), `pagadependencia` (interruptor "Paga dependencia"). Salvar, Excluir, Cancelar.
- Classificação: **parcial**. Base: `formulario-entidade` / `protocolo/natureza-form` e `listagem-crud` / `protocolo/naturezas`. Falta: nada além da decisão de trocar a busca flutuante por uma listagem.

**`convenio/alunoconvenio` — "Aluno convênio"**. Lista os alunos de um convênio num intervalo de meses.
- Arquétipo: consulta com filtros.
- Filtros (`filtrosForm`): `convenio` (seleção "Convênio", rótulo `codigo-descricao`), `datainicio` e `datafim` (mês/ano).
- Tabela (paginador de 10, sem evento de página): Aluno (`matricula - nome`), Situação, Data Início, Data Fim, Valor, ações Editar e Excluir **sem ação ligada** (`aluno-convenio-list.component.html:57-61`).
- Classificação: **parcial**. Base: `listagem-crud` / `sigfin/movimento-caixa`. Falta: definir o que Editar e Excluir fazem (o formulário é esqueleto).

#### Cadastros básicos

**`cadastros-basicos/feriado-bancario` — "Feriado Bancário"** (forma 2). Cadastro dos feriados que afetam vencimento.
- Botão "Novo" no cabeçalho; barra de progresso; tabela: DESCRIÇÃO, DATA, DIA DA SEMANA (calculado), AÇÃO (Editar, lixeira); paginador.
- **Diálogo** (título "Criar Novo" / "Modo de Edição", X para fechar): `data` (dd/MM/yyyy, obrigatória), `descricao`; Cancelar, Salvar.
- Classificação: **parcial**. Base: `listagem-crud` / `protocolo/naturezas` + `dialog`/`drawer` + `confirmacao-destrutiva`. Falta: nada de peça.

**`cadastros-basicos/recebimento-diverso` — "Recebimento Diverso"** (forma 1). Cadastro de itens de cobrança avulsa (extra ou desconto).
- Pesquisa rápida: Código, Descrição, Tipo Cobrança; consulta `byTermAndUnidadePaged`.
- Formulário: `codigo`, `descricao`, "Tipo Cobrança" (`tipocobranca`: Desconto / Extra) e "Aplicado" (`aplicado`: Aluno / Convênio), ambos escolhidos em cartões de opção (`app-bean`, com ícone de rádio). Excluir, Limpar, Salvar.
- Classificação: **parcial**. Base: `formulario-entidade` / `protocolo/natureza-form`; os cartões de opção são o `choice-card`. Falta: nada de peça.

**`cadastros-basicos/liberacao` — "Liberação"**. Registra liberações (matrícula ou livro) para um aluno num período letivo.
- Arquétipo: consulta por pessoa + sublista.
- Cartão "Aluno": `app-busca-aluno` (autocompletar "Matrícula ou Nome"); depois de escolhido mostra Matrícula e Curso.
- Botão "Nova Liberação" (só com aluno); tabela paginada (10): TIPO, DATA, PERÍODO LETIVO (`ano/semestre`), AÇÃO (Editar, lixeira); vazio: ícone + "Não há registros".
- **Diálogo** (35%): `tipo` (seleção "Tipo de Liberação": Matrícula, Livro), `oidperiodoletivo` (seleção "Período Letivo"); "salvar".
- Classificação: **parcial**. Base: `listagem-crud` + `combobox` para a busca de aluno + `dialog` + `empty-state`. Falta: tela de referência "buscar pessoa → ver/gerir registros dela".

**`cadastros-basicos/tipo-banco` — "Tipo Banco"** (forma 1). Cadastro de bancos e das agências/carteiras de cobrança.
- Pesquisa rápida: Código, Sigla, Descrição; consulta `byTermPaged`.
- Formulário: `codigo`, `sigla`, `descricao`. Excluir (esquerda), Limpar e Salvar (direita).
- Seção "Agência bancária": botão "Nova agência" (só com o banco salvo); tabela paginada (10): SIGLA, NOME, AGÊNCIA (`agencia - digito`), NOME CEDENTE, CEDENTE (`cedente - digito`), AÇÃO (Ativar/Desativar, Editar, lixeira); vazio "Não há registros".
- **Diálogo de agência em 2 passos** (barra de progresso + "PASSO n"; Cancelar, Voltar, Próximo, Salvar): passo 1 — `nomeagencia` (Nome Agência), `identificadoragencia` (Identificador da Agência), `agencia`, `digitoagencia` (Dígito), `cedente`, `digitocedente` (Dígito), `carteira`, `variacao` (Variação), `convenio` (Convênio); passo 2 — `sigla`, `nomecedente` (Nome), `cnpj`, `cep`, `praca` (Praça), `endereco` (Endereço).
- Classificação: **parcial**. Base: `listagem-inspetor` / `protocolo/parametros-setores` + `stepper` + `switch`. Falta: tela de referência de mestre-detalhe com formulário em passos dentro de diálogo.

#### Controle de cheques

**`controle-cheques/busca-aluno` — "Controle de cheques - Por aluno"** e **`controle-cheques/busca-numero-data` — "Controle de cheques"** (forma 5). Consulta cheques recebidos, por aluno, por número ou por data.
- Arquétipo: consulta só de leitura.
- Por aluno: `app-busca-aluno` + interruptores "Vencidos?" (`dataVencimento`) e "Apenas abertos?" (`apenasAberto`).
- Por número ou data: duas abas — "Por número" (`numero`, busca ao sair do campo) e "Por data" (`referencia`, intervalo dd/MM/yyyy).
- Resultado (`controle-cheques-list`, área de 500 px com rolagem, sem paginação visível): um cartão por recebimento, com foto, título, data do pagamento, curso e unidade, "Recebido por: <usuário>", total; dentro, cada cheque (`numerocheque`, `bancoSigla`, `datavencimento`, "Quitado"/"Aberto", "Devolvido em <data>" por reapresentação, valor) e os pagamentos (`descricao`, valor, valor pago).
- Classificação: **parcial**. Base: `consulta-relatorio` (tela `relatorios/filtros`) para os filtros; resultado com `card`/`list-item`, `badge` e `timeline` (reapresentações). Falta: tela de referência de consulta cujo resultado são cartões agrupados por pessoa, e não tabela.

#### Integração CEEAC e Cobrafix (cobradoras)

**`ceeac/exportacao` — "Exportação Ceeac"** e **`cobrafix/exportacao` — "Exportação Cobrafix"** (forma 3; os dois templates diferem só no título). Monta o arquivo de cobranças em atraso para a cobradora.
- Arquétipo: seleção em lote + geração de arquivo.
- Busca em duas abas: "Referência" (`referencia`, mês/ano) ou "Pessoa" (`app-busca-aluno`).
- Indicadores: Total de pessoas, Total de cobrancas, Valor total.
- Botão "Gerar arquivo". Tabela: foto, Aluno (`nome - matricula` / `curso - unidade`), Mensalidades (`qtdMensalidade`), Valor (`valorTotal`), ação "Visualizar".
- **Diálogo "Cobranças atrasadas"** (60% × 70%): matrícula, nome, curso e unidade; Sumário com "Selecionadas n/total" e "Valor total"; tabela com caixa de seleção: Selecionado, Referência (`mes/ano`), Valor (`valorReceber`), Dias em atraso. Fecha ao clicar fora e devolve a seleção.
- Arquivo: CEEAC `exportacao_ceeac.xlsx`; Cobrafix `exportacao_cobrafix.csv`.
- Classificação: **falta**. Não há padrão de exportação/remessa para sistema externo (buscar → conferir → escolher → gerar arquivo). Peças existem: `tabs`, `stat`, `data-table`, `dialog`, `checkbox`.

**`ceeac/processar-pagamentos` — "Processar retorno Ceeac"** (forma 4). Lê o arquivo de retorno da cobradora e dá baixa.
- Botão "Upload" (campo de arquivo escondido). Indicadores: Registros Lidos, Total Recebido. Botão "Salvar".
- Tabela: Aluno (foto, `nome - matricula`, `curso - unidade`), Referência (`dtype mes ano`), Data de vencimento, Data de pagamento, Valor, Multa, Juros, Valor Pago.
- Classificação: **falta**. Não há padrão de importação de arquivo com conferência antes de gravar. Peças: `file-field`, `stat`, `data-table`.

**`cobrafix/processar-pagamentos` — "Processar retorno cobrafix"** (forma 4, com barra lateral de filtros `panel2`).
- Barra lateral: pesquisa rápida (sem controle ligado), botão "Upload arquivo", `diaSelecionado` (Dia, dd/MM/yyyy), `arquivoCobrafixSelecionado` (seleção "Arquivos" do dia).
- Indicadores: Registros Lidos, Total Recebido; botão "Processar" (só com arquivo enviado).
- Abas, cada uma só aparece se tiver linhas: "Pagamentos" (o conteúdo da aba está vazio no template; as colunas declaradas na classe são Aluno, Referência, Vencimento, Pagamento, Valor, Multa, Juros, Valor pago); "Acordos" — Aluno, Número acordo, Observação, Qtd. de Parcelas, Valor, Já processado?, "Visualizar"; "Não Identificados" — Linha.
- **Diálogo "Parcelas geradas e mensalidades geradas"** (60% × 70%): Valor Total, Número de parcelas, Usuário, Data; abas "Parcelas" e "Mensalidades", cada uma com Referência, Data de vencimento, Valor.
- Classificação: **falta** (mesmo padrão de importação), mais o resultado em abas por tipo de registro e a lista de linhas não identificadas.

#### Integração Siscorp

**`siscorp/arrecadacao` — "Integração SISCORP - Arrecadação"**. Processa a arrecadação do mês e gera os arquivos para o Siscorp.
- Barra lateral (`panel2`): pesquisa rápida (sem controle ligado), `referencia` (mês/ano), botões "Processar", "Gerar arquivo", "Salvar", "Download novação", "Download Recebimento diverso".
- Tabela: Controle, Data, Valor Recebido, Multa, Desconto.
- Classificação: **falta** (padrão de remessa para sistema externo).

**`siscorp/cartao` — "Exportar cartão"** (forma 6). `dataInicial`, `dataFinal`, botão "Processar"; baixa o arquivo, sem prévia. Classificação: **parcial**; base `consulta-relatorio` / `relatorios/filtros` (só a tela de filtros com ação de baixar). Falta: retorno visível do que foi exportado.

**`siscorp/recebimento-diario` — "Recebimento Diário"** (forma 5). Movimento do caixa num dia, por forma de pagamento.
- Filtro: `diaSelecionado`. Cartão "Movimentação do dia" com um seletor por tipo de pagamento (lista vinda do servidor).
- Lista de cartões (rolagem, 500 px): foto, nome, unidade, hora, tipo, total do item; expande para os pagamentos (`descricao (valor)` → `valorPagamento`).
- Cartão "Índice geral": total por tipo e "Total".
- Classificação: **coberta** em função pela tela `sigfin/movimento-caixa` (mesmo sistema, mesma função: movimento do caixa). Diferenças a levar: seletor por forma de pagamento (`segmented`), linha expansível com os pagamentos e o quadro de totais por tipo.

#### Aluno

**`aluno-acordo-financeiro/:oidunidade/:oidaluno` — acordo financeiro** (forma 7). O aluno escolhe as mensalidades em atraso e gera a cobrança por boleto ou cartão.
- Arquétipo: autoatendimento / pagamento. Renderiza **fora** da moldura do sistema.
- Cabeçalho próprio (`header-aluno`): logo, "Bem vindo(a) <nome>", curso e unidade.
- "Mensalidades em aberto", "Total de registros: n", instrução "Selecione a(s) mensalidade(s) em atraso que deseja realizar o pagamento."
- Tabela com seleção (marcar todas): Mensalidade, Vencimento, Valor Bruto, Valor Líquido, Dias de Atraso, Juros, Multa, Total Boleto, Total Cartão *.
- Legenda: "* O valor na opção CARTÃO DE CRÉDITO está disponível para valores acima de R$ 1000,00 e possui um acréscimo de 10%".
- Rodapé "Total a Pagar:" com dois botões, cada um com seu total: "Boleto Bancário" e "Cartão de Crédito".
- Estados: carregando em tela cheia (logo + texto + botão "Abrir"/"Fechar"); sem débitos ("Legal :) Não existem débitos pendentes!"); erro ("Algo deu errado :(" …).
- **Diálogo "Pagamento com Cartão de Crédito"**: "Valor total a ser parcelado", seleção "Escolha a forma de parcelamento" (`Nx de R$ …`), aviso de redirecionamento; Cancelar, "Gerar cobrança". Não fecha clicando fora.
- Classificação: **parcial**. Base: as telas de candidato da isenção (`isencao/acompanhamento`, `isencao/resultado`) como moldura de autoatendimento; `data-table` com seleção e barra de lote; `dialog`; `empty-state`; `alert`. Falta: padrão de pagamento (resumo do que será pago, escolha do meio, parcelamento, confirmação e saída para o provedor de pagamento) e tela de referência do aluno no SigFin.

#### Demais

**`''` — Home.** Painel "Home" com dois seletores de mês sem controle ligado e conteúdo vazio. Classificação: **coberta** por `portal/grade-modulos` / `painel-indicadores` (hoje é um esqueleto).

**`login/:token/:user`.** Mesma tela de "Aguarde..." do repositório de relatórios. Classificação: **parcial**; base `portal/login`.

---

## 2. Moldura e navegação

- **Moldura**: `<default-style>` (`app.component.html:1-14`) com `hashMenu`, `startOpen=false`, `environment`, `placeholder`, `unidade`, `unidades`, `usuario` e saídas `logout`, `changeUnidade`, `search` (esta chama `buscaMenus()`, vazia). Aqui o menu **é** passado à moldura.
- **Menu** (`app.component.ts:27-152`), 7 grupos, todos com o mesmo ícone `ballot`: Integração Ceeac (Exportação Ceeac; Processar pagamentos Ceeac); Integração Cobrafix (Exportação Cobrafix; Processar pagamentos cobrafix); Integração Siscorp (Arrecadação; Exportação cartão; Recebimento diário); Cadastros Básicos (Feriado bancário; Recebimento Diverso; Liberação; Tipo Banco); Bolsa (Tipo Bolsa); Convênio (Tipo Convênio; Aluno Convênio); Controle de cheques (Busca por número ou data; Busca por aluno). Os cadastros de forma 1 entram direto em `/new`.
- **Cabeçalho de página**: dois componentes próprios — `panel` (logo, "menu / título" como trilha, área à direita para busca e ações, conteúdo) e `panel2` (`<page>` com barra lateral esquerda, usado em Cobrafix retorno e Siscorp arrecadação).
- **Conta e sair**: iguais ao repositório de relatórios (sair limpa a sessão e vai para `LOGIN_URL`).
- **Troca de unidade**: grava a unidade na sessão e volta para a home (`app.component.ts:182-185`). Aqui a unidade da moldura **é** o contexto das telas: cadastros gravam `oidunidade` da unidade selecionada e as buscas filtram por ela.
- **Cabeçalho `Unidade-Ref`**: um interceptor acrescenta `Unidade-Ref` a toda requisição (`interceptor.module.ts:23-31`), com o valor publicado no login.
- **Login por token na URL**: `login/:token/:user`. `LoginComponent` lê também um parâmetro `unidade` (`shared/components/login/login.component.ts:50-52`) que a rota não declara (`app-routing.module.ts:20`); portanto `Unidade-Ref` sai indefinido após o login — se há outra rota em produção: não confirmado. O efeito busca `GET {API_RESOURCE_SERVICE}/usuario/{oid}`, `GET {FINANCEIRO_BACKEND_API}/usuario/{oid}/unidades` e `GET {API_RESOURCE_SERVICE}/usuario/{oid}/pessoa`.
- **Tela fora da moldura**: quando a rota é `aluno-acordo-financeiro`, a aplicação renderiza só o `router-outlet` (`app.component.ts:193-195`, `app.component.html:1,16-18`).

---

## 3. Peças usadas com contagem

| Peça | Qtde | Entradas usadas |
|---|---|---|
| `button ucam-material` | 59 | `rounded`, `outline`, `secondary`, `color="excluir"`, `[hover]`, `[disabled]`, `[routerLink]` |
| `ucam-material-input` | 40 | `formControlName`, `label`, `placeholder`, `type="toggle"` (9), `color="side-menu-background"`, `id` |
| `mat-card` (+ `-header` 13, `-title` 14, `-content` 12, `-subtitle` 2, `-footer` 1) | 29 | cartões de indicador e de resultado |
| `panel` / `panel-title` / `panel-content` / `panel-header-right` / `panel-menu` (próprios) | 15 / 17 / 17 / 15 / 4 | projeção de conteúdo |
| `table mat-table` | 16 | `[dataSource]`, `ucam-material`; `sticky: true` em 15 |
| `ucam-material-datepicker` | 13 | `mask="MM/yyyy"` + `periodo="mes"` (7), `mask="dd/MM/yyyy"`, `[multiplo]="true"` (1), `(dateChange)`, `placeholder`, `required` |
| `mat-tab-group` / `mat-tab` | 6 / 12 | `(selectedIndexChange)`, `[@.disabled]="true"`, `label` |
| `mat-icon` | 12 | `delete`, `clear`, `cancel`, `search` |
| `mat-paginator` | 6 | `[length]`, `[pageSize]`, `(page)` |
| `ucam-material-profile-photo` | 5 | `size="50px"`, `src`, `name`, `mat-card-avatar` |
| `ucam-material-select` | 4 | `label`, `[options]`, `formControlName`, `(change)` |
| `app-pesquisa-rapida` (próprio) | 4 | `query`, `queryParams`, `service`, `displayedColumns`, `(objeto)` |
| `app-busca-aluno` (próprio) | 4 | `oidunidade`, `(blur)` |
| `mat-progress-bar` | 4 | `mode="indeterminate"` / `determinate` |
| `mat-checkbox` | 3 | seleção de linha e "todas" |
| `mat-expansion-panel` | 2 | itens do cartão |
| `app-bean` (próprio) | 2 | `param`, `[(selectedBean)]` |
| `panel2` + `panel-sideleft` (próprios) | 2 + 2 | — |
| `app-stepper` + `app-slide` (próprios) | 1 + 2 | `(first)`, `(last)` |
| `mat-select` / `mat-option` / `mat-autocomplete` | 1 / 2 / 1 | parcelamento; busca de aluno |
| `header-aluno`, `app-loading`, `app-tabela-acordo` (próprios) | 1 cada | — |
| `default-style` | 1 | ver seção 2 |

Diálogos (`MatDialog.open`): `ConfirmDeleteDialogComponent` (35%), `RegressaoBolsaVencimentoFormComponent` (45%), `FeriadoBancarioFormComponent`, `LiberacaoFormComponent` (35%), `AgenciaBancariaFormComponent`, `DialogDividaComponent` (60% × 70%), `DialogAcordoDetailsComponent` (60% × 70%), `CalculadoraCartaoDialogComponent`, `LoadingComponent` (vídeo `LOAD.mp4` em laço, usado como bloqueio de tela).

Pipes próprios: `tipoAplicado`, `tipoCobrancaRecebimentoDiverso`, `tipoLiberacao`. Validadores próprios: `CustomValidators.date`, `.number`, `.money` (uso nos formulários lidos: não confirmado).

Bibliotecas: Angular 9.0.5, `@angular/material` 9.1.2, `@ngrx/store`, `@ngrx/effects`, `@ngrx/router-store` 9, `ucam-material` 0.0.910-alpha.46, `default-style` 0.0.910-rc.4, `file-saver` 2.0.2, `moment` 2.26, cliente HAL próprio em `shared/hal`.

---

## 4. Regras de negócio lidas no código

1. **Nem toda tela exige login.** `app-routing.module.ts:46-78`; `paginas/cadastros-basicos/cadastros-basicos-routing.module.ts:7-33`. Tipo: permissão. Sem guard: feriado bancário, tipo de bolsa, controle de cheques e acordo do aluno. Onde há guard, ele só checa autenticação; não há perfil.
2. **O acordo financeiro abre só com o endereço.** `aluno/acordo-financeiro/acordo-financeiro-routing.module.ts:7`; `acordo-financeiro.component.ts:30-31`. Tipo: permissão. A URL leva `oidunidade` e `oidaluno`; não há token nem login no front.
3. **Toda requisição leva a unidade em cabeçalho.** `interceptor.module.ts:23-31`. Tipo: integração. Cabeçalho `Unidade-Ref`.
4. **Trocar de unidade volta à página inicial.** `app.component.ts:182-185`. Tipo: transição.
5. **Cadastros pertencem à unidade selecionada.** Ex.: `paginas/bolsa/tipo-bolsa/tipo-bolsa-form/tipo-bolsa-form.component.ts:50`. Tipo: permissão. `oidunidade` é preenchido com a unidade da sessão em tipo de bolsa, convênio, recebimento diverso e agência.
6. **Tipo de bolsa: código e descrição obrigatórios; código com até 10 caracteres.** `tipo-bolsa-form.component.ts:47-48`. Tipo: validação / limite.
7. **Tipo de bolsa tem três marcações.** `tipo-bolsa-form.component.html:26,34,42`. Tipo: enumeração. "Valor integral", "Aplicar desc. antecipação", "Retirar cobrança IPGM".
8. **Regressão por vencimento só depois de salvar o tipo de bolsa.** `paginas/bolsa/tipo-bolsa/regressao-bolsa-vencimento/regressao-bolsa-vencimento/regressao-bolsa-vencimento.component.html:6`. Tipo: transição.
9. **Regressão por vencimento: dia, valor, se é percentual e se é incremental.** `.../regressao-bolsa-vencimento-form/regressao-bolsa-vencimento-form.component.ts:34-37`. Tipo: formato. Nenhum campo é obrigatório no front.
10. **Convênio: código e descrição obrigatórios.** `paginas/convenio/tipo-convenio/tipo-convenio-form/tipo-convenio-form.component.ts:38-39`. Tipo: validação. Marcações "Valor integral" e "Paga dependencia".
11. **Recebimento diverso: código (até 10), descrição, aplicado e tipo de cobrança obrigatórios.** `paginas/cadastros-basicos/recebimento-diverso/recebimento-diverso-form/recebimento-diverso-form.component.ts:56-59`. Tipo: validação / limite.
12. **Tipo de cobrança do recebimento diverso.** `shared/pipes/tipo-cobranca-recebimento-diverso.pipe.ts:7-10`. Tipo: enumeração. `D` = Desconto; `E` = Extra.
13. **A quem o recebimento diverso se aplica.** `shared/pipes/tipo-aplicado.pipe.ts:7-10`. Tipo: enumeração. `ALUNO` = Aluno; `CONVENIO` = Convênio.
14. **Tipo de banco: código, descrição e sigla obrigatórios.** `paginas/cadastros-basicos/tipo-banco/tipo-banco-form/tipo-banco-form.component.ts:34-36`. Tipo: validação.
15. **Agência só depois de salvar o banco, e pode ser ativada ou desativada.** `.../agencia-bancaria/agencia-bancaria/agencia-bancaria.component.html:9`; `.../agencia-bancaria-list/agencia-bancaria-list.component.ts:137-138`. Tipo: transição. Alterna `ativo` por PATCH; nenhum campo da agência é obrigatório no front.
16. **Feriado bancário: data e descrição obrigatórias; dia da semana é calculado.** `paginas/cadastros-basicos/feriado-bancario/feriado-bancario-form/feriado-bancario-form.component.ts:32-33`; `feriado-bancario.component.ts:114-116`. Tipo: validação / cálculo. Data em `DD/MM/YYYY`.
17. **Liberação exige tipo e período letivo, e registra quem liberou.** `paginas/cadastros-basicos/liberacao/liberacao-form/liberacao-form.component.ts:49-52`. Tipo: validação. Grava `oidusuario` do usuário logado e `oidpapelpessoa` do aluno.
18. **Tipos de liberação.** `shared/pipes/tipo-liberacao.pipe.ts:7-10`. Tipo: enumeração. `MATRICULA` = Matrícula; `LIVRO` = Livro.
19. **Nova liberação só com um aluno escolhido.** `paginas/cadastros-basicos/liberacao/liberacao/liberacao.component.html:46`. Tipo: validação.
20. **Excluir só existe para registro salvo e pede confirmação.** `tipo-bolsa-form.component.html:62`; `shared/components/confirm-delete-dialog/confirm-delete-dialog.component.html:5,14,23`. Tipo: validação. Texto "deseja excluir?"; o diálogo não nomeia o que será perdido.
21. **Depois de salvar, a tela vai para a edição do registro.** `shared/components/base-resource-form/base-resource-form.component.ts:131-143`. Tipo: transição. Navega para `<base>/edit/<oid>`.
22. **Erros do servidor.** `base-resource-form.component.ts:150-154`. Tipo: formato. HTTP 422 mostra as mensagens do servidor; outros: "Falha na comunicação com o servidor....".
23. **Títulos do formulário.** `base-resource-form.component.ts:90-96`. Tipo: formato. "Criar Novo" e "Modo de Edição".
24. **Pesquisa rápida só busca com 2 ou mais caracteres, 10 por página.** `shared/components/pesquisa-rapida/pesquisa-rapida.component.ts:36,50`. Tipo: limite.
25. **Aluno convênio: o mês escolhido vira o dia 1º.** `paginas/convenio/aluno-convenio/aluno-convenio/aluno-convenio.component.ts:73-75`. Tipo: formato. `'01/' + MM/yyyy` para início e fim; busca `byConvenioDataUnidade`.
26. **Situação do cheque.** `paginas/controle-cheques/controle-cheques-list/controle-cheques-list.component.html:46-49`. Tipo: enumeração. `situacao === 'S'` → "Quitado"; senão "Aberto"; cada reapresentação mostra "Devolvido em <data>".
27. **Filtros de cheque por aluno.** `paginas/controle-cheques/cheque-busca-aluno/cheque-busca-aluno.component.ts:71-74,80-88`. Tipo: validação. "Vencidos?" e "Apenas abertos?"; só busca com aluno escolhido.
28. **Exportação para cobradora por mês de referência ou por pessoa.** `paginas/ceeac/exportacao-ceeac/exportacao-ceeac.component.ts:97-105,122-128`. Tipo: integração. A referência `MM/yyyy` é dividida em mês e ano.
29. **Indicadores da exportação.** `exportacao-ceeac.component.ts:109-114`. Tipo: cálculo. Pessoas = quantidade de registros; cobranças = soma de `qtdMensalidade`; valor = soma de `valorTotal`.
30. **O valor de cada pessoa considera só as cobranças marcadas.** `exportacao-ceeac.component.ts:214-222`; `shared/components/dialog-divida/dialog-divida.component.ts:85-90`. Tipo: cálculo. Soma de `cobranca.valorReceber` das selecionadas.
31. **O arquivo leva todas as cobranças da lista, com a marca de selecionada.** `exportacao-ceeac.component.ts:187-195`. Tipo: integração. O front não filtra as desmarcadas antes de enviar; se o servidor filtra por `selecionado`: não confirmado.
32. **Nome e formato do arquivo de exportação.** `exportacao-ceeac.component.ts:201`; `paginas/cobrafix/exportacao-cobrafix/exportacao-cobrafix.component.ts` (linha do `saveAs`). Tipo: formato. `exportacao_ceeac.xlsx`; `exportacao_cobrafix.csv`.
33. **Retorno CEEAC: registros lidos e total recebido.** `paginas/ceeac/importacao-ceeac/importacao-ceeac.component.ts:81-88`. Tipo: cálculo. Lidos = quantidade de itens; total = soma de `cobranca.valorReceber`. O envio leva o arquivo e o `oidusuario`.
34. **Retorno Cobrafix: só acordos em situação "A" são listados no envio de arquivo.** `paginas/cobrafix/importacao-cobrafix/importacao-cobrafix.component.ts:108-110`. Tipo: validação. `status === "A"`; o significado de "A": não confirmado.
35. **Retorno Cobrafix separa pagamentos, acordos e não identificados.** `importacao-cobrafix.component.ts:113-116`. Tipo: formato. Totais vêm do servidor (`registrosLidos`, `totalPagamentos`).
36. **Arquivo Cobrafix já recebido pode ser reaberto por dia.** `importacao-cobrafix.component.ts:170-181,193-217`. Tipo: integração. Lista os arquivos do dia e reprocessa o escolhido; neste caminho a lista de "não identificados" recebe os pagamentos (`:217`), o que parece engano.
37. **"Processar" só aparece com arquivo enviado.** `importacao-cobrafix.component.html:81`. Tipo: validação.
38. **Integração Siscorp usa unidade fixa.** `paginas/siscorp/exportacao-arrecadacao/exportacao-arrecadacao.component.ts:20,42`; `exportacao-cartao.component.ts:68`; `recebimento-diario.component.ts:88`. Tipo: integração. `"unid01"` escrito no código; a leitura da unidade da sessão está comentada.
39. **Arrecadação: gerar arquivo e salvar só com dados processados.** `paginas/siscorp/exportacao-arrecadacao/exportacao-arrecadacao.component.html:36,46`. Tipo: validação.
40. **Exportação de cartão exige data inicial e final.** `paginas/siscorp/exportacao-cartao/exportacao-cartao.component.ts:48-49,64`. Tipo: validação.
41. **Nome do arquivo Siscorp vem do servidor.** `paginas/siscorp/siscorp.service.ts:13-29`. Tipo: formato. Lido do cabeçalho `content-disposition`.
42. **Recebimento diário é por dia e por tipo de origem.** `paginas/siscorp/recebimento-diario/recebimento-diario.component.ts:93-99`. Tipo: formato. Tipos, totais por tipo e total geral vêm do servidor.
43. **Cartão de crédito só para total acima de R$ 1.000,00.** `aluno/acordo-financeiro/tabela-acordo/tabela-acordo.component.html:125`. Tipo: limite. Botão desabilitado se `totalAPagarBoleto() <= 1000`.
44. **Cartão tem acréscimo de 10%.** `tabela-acordo.component.html:99`. Tipo: cálculo. Texto literal: "* O valor na opção CARTÃO DE CRÉDITO está disponível para valores acima de R$ 1000,00 e possui um acréscimo de 10%". O valor com acréscimo vem pronto do servidor (`valorTotalCartao`).
45. **Parcelamento no cartão.** `aluno/acordo-financeiro/calculadora-cartao-dialog/calculadora-cartao-dialog.component.ts:30-35`. Tipo: limite. De R$ 1.000,01 a R$ 5.000,00 → até 3 vezes; acima de R$ 5.000,01 → até 6 vezes. Um valor entre 5.000,00 e 5.000,01 fica sem opção.
46. **Valor da parcela.** `calculadora-cartao-dialog.component.ts:41-47`. Tipo: cálculo. Total ÷ nº de parcelas, 2 casas; rótulo "Nx de R$ …".
47. **Totais a pagar.** `tabela-acordo.component.ts:68-74`. Tipo: cálculo. Boleto = soma de `valorTotalBoleto` das marcadas; cartão = soma de `valorTotalCartao`.
48. **Meios de pagamento.** `aluno/acordo-financeiro/acordo-financeiro.enum.ts:1-4`. Tipo: enumeração. `BOLETO`; `CREDIT_CARD`.
49. **A cobrança é paga fora do sistema.** `tabela-acordo.component.ts:114-129`. Tipo: integração. O servidor devolve `url` e `paymentId`; após 1,5 s abre a URL em nova aba e oferece o botão "Abrir".
50. **Mensagens do acordo.** `tabela-acordo.component.ts:113,116,122,132`; `acordo-financeiro.component.html:16-18,24-25`. Tipo: formato. "Aguarde, gerando cobrança..."; "Cobrança gerada com Sucesso, redirecionando..."; "Caso não tenha sido redirecionado, clique no botão abaixo:"; "Ocorreu um erro ao tentar gerar a cobrança, tente novamente mais tarde!"; "Algo deu errado :(" / "Ocorreu um erro ao tentar buscar as informações!" / "Por favor, tente mais tarde!"; "Legal :)" / "Não existem débitos pendentes!".
51. **Sem mensalidade em atraso não há tabela.** `acordo-financeiro.component.ts:44-49`. Tipo: transição.
52. **Mensagem de campo obrigatório.** `shared/components/form-field-error/form-field-error.component.ts:28-34`; `shared/services/utils.service.ts:16-25`. Tipo: formato. "Campo obrigatório." (campo inválido e tocado); "Campo requerido", "Valor mínimo: n", "Valor máximo: n", "Valor inválido".

---

## 5. API consumida

Base `FINANCEIRO_BACKEND_API` (`http://<host>:9090/api`), salvo indicação.

**Autenticação e apoio**
- `GET {API_RESOURCE_SERVICE}/usuario/{oid}`; `GET {FINANCEIRO_BACKEND_API}/usuario/{oid}/unidades`; `GET {API_RESOURCE_SERVICE}/usuario/{oid}/pessoa`
- `GET {API_ACADEMICO}/aluno/search/cpf-nome-matricula?term=` (cabeçalho `Unidade-Ref`) — busca de aluno
- `GET /periodoletivo/all` → `_embedded.periodoLetivoDToes[]`

**Cadastros (cliente HAL `RestService<T>`)**: para cada recurso, `GET /{recurso}`, `GET /{recurso}/{oid}`, `POST /{recurso}`, `PUT`/`PATCH /{recurso}/{oid}`, `DELETE /{recurso}/{oid}` e `GET /{recurso}/search/{consulta}?…` (o verbo exato de atualização: não confirmado).

| Recurso | Consultas usadas |
|---|---|
| `tipobolsa` | `search/byTermAndUnidadePaged?oidunidade=&term=&size=&page=` |
| `regressaobolsavencimento` | `search/byTipoBolsaPaged?oidtipobolsa=&size=&page=` |
| `convenio` | `search/byTermPaged?term=&size=&page=`; lista completa |
| `alunosconvenio` | `search/byConvenioDataUnidade?oidunidade=&oidconvenio=&datainicio=&datafim=` |
| `feriadosbancarios` | lista completa |
| `recebimentodiverso` | `search/byTermAndUnidadePaged?oidunidade=&term=&size=&page=` |
| `liberacao` | `search/byOidPapelPessoa?oidpapelpessoa=&size=&page=` |
| `tipobanco` | `search/byTermPaged?term=&size=&page=` |
| `agenciabancaria` | `search/byTipoBancoAndUnidadePaged?oidunidade=&oidtipobanco=&size=&page=` |
| `controlecheque` | `search/cheques-por-aluno?oidpapelpessoa=&dataVencimento=&apenasAberto=&size=`; `search/cheques-por-numero?numerocheque=`; `search/cheques-por-data?dataInicio=&dataFim=` |

**CEEAC** (`paginas/ceeac/ceeac.service.ts`, `shared/url.provider.ts`)
- `GET /ceeac/exportacao/referencia?mes=&ano=&oidunidade=` → `_embedded.pessoaDividaDToes[]`
- `GET /ceeac/exportacao/oidpapelpessoa/{oid}`
- `POST /ceeac/exportacao/gerararquivo` (corpo: `Divida[]`; resposta: arquivo)
- `POST /ceeac/processarpagamentos` (multipart: `file`, `oidusuario`) → `_embedded.itemRetornoCeeacs[]`
- `POST /ceeac/processarpagamentos/salvar` (corpo: `ItemRetornoCeeac[]`)

**Cobrafix** (`paginas/cobrafix/cobrafix.service.ts`)
- `GET /cobrafix/exportacao/referencia?mes=&ano=&oidunidade=`; `GET /cobrafix/exportacao/oidpapelpessoa/{oid}`; `POST /cobrafix/exportacao/gerararquivo`
- `POST /cobrafix/processarpagamentos` (multipart) → `cobrafixAcordos[]`, `cobrafixPagamentos[]`, `cobrafixNaoIdentificados[]`, `registrosLidos`, `totalPagamentos`
- `POST /cobrafix/processarpagamentos/salvar` (multipart: `file`, `oidusuario`, `retornoCobrafixProcessado` em JSON)
- `GET /cobrafix/buscaarquivoscobrafix?diaselecionado=` → `_embedded.arquivocobrafix[]`
- `GET /cobrafix/processaaquivocobrafixselecionado?identificacao=`

**Siscorp** (`paginas/siscorp/siscorp.service.ts`)
- `GET /integracaosiscorp/arrecadacao/processar?mes=&ano=&oidunidade=` → `Arrecadacao[]`
- `POST /integracaosiscorp/arrecadacao/gerararquivo` (corpo `Arrecadacao[]`; arquivo)
- `POST /integracaosiscorp/arrecadacao/salvar`
- `GET /integracaosiscorp/novacao/gerararquivo?mes=&ano=&oidunidade=` (arquivo)
- `GET /integracaosiscorp/recebimentodiverso/gerararquivo?mes=&ano=&oidunidade=` (arquivo)
- `GET /integracaosiscorp/cartao/gerararquivo?datainicio=&datafim=&oidunidade=` (arquivo)
- `GET /recebimentodiario/detalhe?diaselecionado=&oidunidade=`

**Acordo financeiro** (`aluno/acordo-financeiro/acordo-financeiro.service.ts`, base `BASE_PATH_API_GATEWAY_FINANCEIRO` = `https://api-webhook-financeiro.candidomendes.edu.br`)
- `GET /acordo-financeiro/mensalidades-em-atraso/{oidUnidade}/{oidAluno}` → `CobrancaAcordo`
- `POST /acordo-financeiro/gerar-cobranca` (corpo `CobrancaAcordoSend`) → `LinkCobranca`

**Modelos**
- `TipoBolsa`: `oid`, `status`, `codigo`, `descricao`, `data`, `oidunidade`, `valorintegral`, `desconto`, `retirarigpm`.
- `RegressaoBolsaVencimento`: `diavencimento`, `valor`, `percentual`, `descontoincremental`, `tipobolsa` (link).
- `Convenio`: `codigo`, `descricao`, `datageracao`, `oidunidade`, `pagadependencia`, `valorintegral`.
- `FeriadoBancario`: `data`, `descricao`.
- `RecebimentoDiverso`: `codigo`, `descricao`, `tipocobranca`, `aplicado`, `data`, `oidunidade`.
- `Liberacao`: `data`, `tipo`, `oidperiodoletivo`, `oidusuario`, `oidpapelpessoa`.
- `TipoBanco`: `codigo`, `descricao`, `sigla`.
- `AgenciaBancaria`: `agencia`, `digitoagencia`, `nomeagencia`, `identificadoragencia`, `cedente`, `digitocedente`, `nomecedente`, `carteira`, `carteira2`, `variacao`, `convenio`, `convenio2`, `sigla`, `cnpj`, `cep`, `praca`, `endereco`, `oidunidade`, `ativo`, `tipobanco` (link).
- `PeriodoLetivo`: `oid`, `ano`, `semestre`, `status`, `datainicio`, `datafim`.
- `Cobranca`: `dtype`, `situacaoCobranca`, `pagador`, `dataVencimento`, `dataDescontoAntecipado`, `dataPagamento`, `mes`, `ano`, `parcial`, `diasAtraso`, `valorReceber`, `valorCalculado`, `totalBolsa`, `totalPagamentos`, `descontoAplicado`, `juros`, `multa`, `valorMulta`, `valorJurosDiarios`, `oidUnidade`, `referencia`, `oidmensalidade`.
- `Pagador`: `type`, `nome`, `cpf`, `matricula`, `unidade`, `oidUnidade`, `email`, `oidaluno`, `oidPessoa`, `periodoIngresso`, `ingressante`, `matriculaOuCpf`, `curso`.
- `Divida`: `cobranca`, `selecionado`. `PessoaDivida`: `valorTotal`, `qtdMensalidade`, `aluno`, `listCobranca[]`. `ItemRetornoCeeac`: `cobranca`, `pagador`, `baixaPrevia`.
- Acordo Cobrafix (lido no template): `pagador`, `acordo{numeroacordo, observacao, numeroparcela, valortotaldebito}`, `acordoSalvo`, `status`, `parcelaAcordoListOrdenado[]`, `mensalidadeListOrdenado[]`.
- `Arrecadacao`: `controle`, `conta`, `numero`, `data`, `valor`, `multa`, `desconto`, `importado`.
- `RecebimentoDiario`: `mapOrigempagamento`, `mapTotais`, `listTipos[]`, `total`; `Item`: `hora`, `estado`, `nome`, `tipo`, `matricula`, `totalItem`, `curso`, `unidade`, `listPagamento[{descricao, situacao, valor, valorPagamento}]`.
- Cheque (lido no template): `dataPagamento`, `curso`, `unidade`, `usuario.nome`, `totalItem`, `sequenciacheques[{numerocheque, bancoSigla, datavencimento, situacao, valor, reapresentacaocheques[{datadevolucao}]}]`, `listPagamento[]`.
- `CobrancaAcordo`: `nome`, `oidUnidade`, `unidade`, `curso`, `customerId`, `vencimento`, `valorLiquidoTotalDevidoBoleto`, `valorLiquidoTotalDevidoCartao`, `itemCobrancaPreviewList[{oidMensalidade, ano, mes, vencimento, valorBruto, valorLiquido, diasAtraso, juros, multa, descricao, valorTotalBoleto, valorTotalCartao}]`.
- `CobrancaAcordoSend`: `oidUnidade`, `customerId`, `itemCobrancaList[{oidMensalidade, ano, mes, valorTotal}]`, `vencimento`, `valorTotalCobranca`, `meioPagamento`, `opcaoParcelamento{valor, qtdParcela, label}`. `LinkCobranca`: `paymentId`, `url`.

---

## 6. O que o código não responde

1. Quem pode cadastrar bolsa, convênio, banco e feriado, e quem pode gerar remessa e dar baixa de retorno? O front não tem perfil, e quatro áreas nem exigem login. Decide: gestão financeira / tesouraria, com quem administra perfis no Gerencial.
2. O acordo do aluno abre só com dois identificadores na URL. Como o aluno chega a esse endereço e o que impede abrir o de outro aluno? Decide: segurança da informação + responsável pelo portal do aluno.
3. De onde vêm os 10% do cartão e os limites de R$ 1.000 e R$ 5.000 e de 3 e 6 parcelas? São política da universidade ou do provedor de pagamento? Decide: diretoria financeira.
4. O acordo é só "pagar atrasados com juros e multa" ou existe negociação (desconto, entrada, novo vencimento)? A tela só soma. Decide: tesouraria / cobrança.
5. Na remessa para a cobradora, desmarcar uma cobrança tira-a do arquivo? Quais critérios definem que uma mensalidade vai para CEEAC ou para Cobrafix? Decide: setor de cobrança.
6. O retorno da cobradora pode ser processado duas vezes? O que significa `baixaPrevia` e a situação "A" do acordo? Decide: setor de cobrança + tesouraria.
7. A integração Siscorp usa a unidade fixa "unid01": é provisório? A integração ainda está em uso? Decide: contabilidade + equipe de desenvolvimento.
8. Como funciona a regressão de bolsa por vencimento (valor fixo × percentual, "incremental")? O front só grava os campos. Decide: setor de bolsas / gestão financeira.
9. O que "Valor integral", "Aplicar desc. antecipação", "Retirar cobrança IPGM" e "Paga dependência" mudam no cálculo da mensalidade? Decide: gestão financeira.
10. A liberação (matrícula, livro) libera o quê, por quanto tempo, e pode ser revogada? Decide: tesouraria + secretaria acadêmica.
11. Em Aluno convênio, o que Editar e Excluir deveriam fazer? Hoje são botões sem ação. Decide: responsável pelo produto SigFin.
12. O controle de cheques é só consulta? Onde se registra devolução, reapresentação e quitação? Decide: tesouraria.
13. Solicitação de bolsa está no menu de rotas sem tela: foi abandonada ou mudou de sistema? Decide: responsável pelo produto SigFin.
14. Este front ainda está em produção ou foi substituído pelo SigFin atual (há tela de referência `sigfin/movimento-caixa` e `sigfin/calculo-mensalidade` no DS)? Decide: coordenação de TI.
