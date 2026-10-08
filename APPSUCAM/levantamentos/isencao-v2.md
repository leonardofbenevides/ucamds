# isencao-v2 — levantamento de telas, padrões e regras (06/10/2026)

Repositório: `C:\Users\Leonardo\Documents\UCAM-repos\isencao-v2`. Monorepo: `frontend-v2/` (Angular 20.3, standalone), `backend-v2/` (Java 21, Spring Boot 3, Gradle), `docs/sdd/` (18 capítulos + 2 ADRs), `docs/ux/isencao-v2-prototipo.html`, `sql/` (4 scripts para o DBA), `ISENCAO-IA.md`. Substitui o fluxo antigo de isenção de disciplinas do processo seletivo e traz junto um cadastro de provas do vestibular.

Como li: frontend inteiro por estrutura e texto (rotas, moldura, fila, análise, matrizes, cursos, candidato, vestibular, `core/`, modelos, serviços, tokens). Backend: controllers (mapeamentos), `IsencaoService` (pedido, envio, notificação, avaliação), mensagens de `IsencaoAnaliseIaService` e dos validadores de documento, `application.properties`. SDD: capítulos 04 e 16 em trecho, ADR-002, `ISENCAO-IA.md` (primeira metade). O `ucam-ds.css` (400 KB) foi inspecionado por amostragem de classes e variáveis. O que não foi aberto está marcado "não confirmado".

Caminhos relativos a `frontend-v2/src/app/` (front) e `backend-v2/src/main/java/br/ucam/campos/backendv2/` (back).

---

## 1. Rotas e telas

Fonte: `frontend-v2/src/app/app.routes.ts`. Todas as páginas são carregadas sob demanda.

| URL | Componente | Template | Guard |
|---|---|---|---|
| `/` | `EntryPage` | inline em `features/isencao/pages/entry/entry.page.ts` | nenhum |
| `/isencao/:oidFormaIngressoPessoa` | `CandidatoIsencaoPage` | `features/isencao/pages/candidato/candidato-isencao.page.html` | nenhum (o link é a chave) |
| `/admin/login/:token/:usuario` (`?oidpessoa=&unidade=`) | `AdminLoginPage` | inline em `pages/admin-login/admin-login.page.ts` | nenhum |
| `/admin/dev-session` | `DevSessionPage` | inline em `pages/dev-session/dev-session.page.ts` | `devOnlyGuard` (só fora de produção) |
| `/admin/isencao` (filhos `matrizes`, `cursos`) | `AdminIsencaoPage` → `AdminIsencaoShell [enableIa]=false` | `pages/admin/admin-isencao.shell.html` | `authGuard` |
| `/admin/isencao-ia` (filhos `matrizes`, `cursos`) | `AdminIsencaoIaPage` → `AdminIsencaoShell [enableIa]=true` | o mesmo | `authGuard` |
| `/admin/vestibular` | `VestibularCadastroPage` | inline em `features/vestibular/pages/cadastro/vestibular-cadastro.page.ts` | `authGuard` |
| `**` | redireciona para `/` | — | — |

`authGuard` relê o `localStorage` e, sem sessão, volta para `/` (`core/auth/auth.guard.ts:5-13`). As rotas `admin/isencao` e `admin/isencao-ia` são **o mesmo componente**; a segunda liga a coluna e os blocos de sugestão automatizada. Dentro do shell, três vistas trocam por URL: fila (raiz), `matrizes`, `cursos`; a análise de uma solicitação abre sobre a fila, sem rota própria. `features/isencao/pages/home/home.page.ts` existe e não tem rota.

### 1.1 Entrada — `/`
- **Propósito**: explicar por onde se entra; quem já tem sessão vai direto a `/admin/isencao`.
- **Arquétipo**: página de estado.
- **Peças**: logotipo, título "Isenção de disciplinas", texto "O acompanhamento do candidato abre pelo link enviado no Portal Universitário. A área administrativa entra pela autenticação institucional."
- **UCAMDS**: **parcial** — `empty-state`; sem tela de referência de "porta sem sessão".

### 1.2 Chegada da sessão — `/admin/login/:token/:usuario`
- **Propósito**: gravar a sessão recebida do portal e seguir para a fila.
- **Arquétipo**: tela de espera.
- **Peças**: sobrelinha "UCAM", título "Entrando no ambiente administrativo", "A sessão está sendo preparada a partir do acesso recebido.", link "Ir para análise".
- **UCAMDS**: **falta** tela de referência de handoff (mesma lacuna do Gerencial).

### 1.3 Sessão de trabalho — `/admin/dev-session`
- **Propósito**: em ambiente local, informar unidade e pessoa para carregar as filas.
- **Peças**: cabeçalho "Ambiente local / Definir sessão de trabalho"; campos `unidade` ("Unidade (oid)", padrão `unid19`), `oidpessoa` ("Identificador da pessoa"), `usuario` ("Usuário"); `Cancelar` / "Salvar e abrir análise".
- **UCAMDS**: **nao-migrar** (ferramenta de desenvolvimento, bloqueada em produção). Atenção: o campus, o avatar e "Configurações" da moldura apontam para esta rota (ver §2).

### 1.4 Fila de análise — `/admin/isencao` e `/admin/isencao-ia`
- **Propósito**: listar quem pediu isenção, em que situação está e, com IA ligada, o estado da sugestão automatizada.
- **Arquétipo**: listagem com recortes (fila de trabalho).
- **Peças**: trilha "Meus sistemas / Fila de análise"; título; ações `Atualizar` e `Exportar` (CSV da lista filtrada); abas com contagem `Em análise` / `Concluídas`; segmentado de situação (só em "Em análise"); barra de filtros com "Pesquisar candidato" (placeholder "Nome do candidato"), select `Curso` ("Todos os cursos"), select `Unidade` ("Todas as unidades", só quando aplicável), "Limpar filtros"; tabela ordenável; rodapé "Mostrando N de M solicitações" (sem paginação).
- **Colunas**: Candidato (avatar com iniciais + nome como link + "Período letivo X"), Curso (+ unidade como apoio), Solicitada em (dd/MM/yyyy), Situação (selo com ponto), Sugestão (só com IA: `Disponível`, `Em processamento`, `Falhou`, `Sem análise`).
- **Estados**: "Carregando solicitações…"; vazio com e sem filtro ("Nada corresponde ao que você pesquisou, ao curso ou à situação escolhida. Tente outro termo, ou limpe os filtros.").
- **UCAMDS**: **coberta** por `isencao/fila`. Peças: `data-table`, `tabs`, `segmented`, `text-field`, `select`, `badge`, `avatar`, `empty-state`, `button`.

### 1.5 Análise da solicitação (dentro do shell, sem rota)
- **Propósito**: decidir disciplina a disciplina, pedir documento, salvar rascunho e finalizar.
- **Arquétipo**: detalhe de triagem em duas colunas (principal + painel de apoio).
- **Peças do cabeçalho**: trilha com volta à fila; nome do candidato; período letivo; ações `Salvar rascunho`, `Enviar pedido ao candidato` ("Enviando…"; dica: "Marca a solicitação como Aguardando candidato e grava a observação. Não envia e-mail/SMS."), `Finalizar análise`.
- **Avisos**: "Candidato sem documentos — Este candidato ainda não enviou documentos. Sem documento não há decisão…" + "Marcar aguardando candidato"; "Análise automatizada em processamento. A sugestão aparece aqui assim que ficar pronta."; "Não foi possível concluir a análise automatizada. Prossiga com a avaliação manual."; "A sugestão disponível refere-se a outra matriz curricular." + "Abrir matriz da análise".
- **Coluna principal — "Disciplinas da matriz"**: seletor de período; select `Matriz curricular` ("Selecione"); barra "Sugestão automatizada" com data e botão de aplicar sugestões (dica: "Preenche só as disciplinas sem decisão; não sobrescreve nem pede documento"); tabela `Disciplina | Sugestão | Decisão`.
  - Sugestão por disciplina: selo ("Sugere isentar", "Sugere não isentar", "Revisar"), "Ementa N%", equivalência de carga, justificativa curta (90 caracteres) e "Ver detalhes"; ou "Sem sugestão para esta disciplina".
  - Decisão: segmentado `Isentar` / `Não isentar` / `Pedir documento` (marca a opção sugerida; "Pela sugestão" quando veio da IA).
  - Ao isentar: campos `Disciplina de origem` (`descricao`), `IES` (`ies`), `Carga horária` (`cargaHoraria`).
  - Ao pedir documento: campo do documento pedido (`motivo`, `maxlength 300`).
  - Lista de erros de validação ao finalizar.
- **Painel de apoio**: "Solicitação" (Candidato, Curso, Unidade — só EAD —, Período letivo, Solicitada em, Telefone, E-mail, Matriz curricular quando concluída); "Documentos" (lista para baixar; "Nenhum documento enviado até agora."); "Sugestão automatizada" (resumo); "Observação ao candidato" (`textarea`, `maxlength 150`, "Até 150 caracteres. O candidato verá esta observação no acompanhamento."); "Atividade" (linha do tempo com papel e dados).
- **UCAMDS**: **coberta** por `isencao/analise` (em análise), `isencao/consulta` (concluída, somente leitura) e `isencao/sem-documentos`. Peças: `page-header`, `data-table`, `segmented`, `badge`, `text-field`, `textarea`, `select`, `description-list`, `anexo`, `timeline`, `alert`, `citacao`.

### 1.6 Diálogo "Sugestão da análise automatizada"
- **Propósito**: mostrar a recomendação completa de uma disciplina.
- **Peças**: aviso "Isto é uma recomendação. A decisão oficial permanece com o avaliador."; lista `Recomendação`, `Compatibilidade`, `Disciplina de origem`, `Justificativa`; botão `Fechar`.
- **UCAMDS**: **parcial** — `dialog` + `description-list`. A tela de referência usa "Por que revisar?" como ação; o diálogo em si não é tela de referência.

### 1.7 Matrizes curriculares — `/admin/isencao/matrizes`
- **Propósito**: ver as matrizes dos cursos que têm solicitação e as disciplinas de cada uma.
- **Arquétipo**: listagem de consulta com linha expansível (não é CRUD: não cria nem edita).
- **Peças**: trilha "Meus sistemas / Cadastros / Matrizes curriculares"; botão `Exportar`; segmentado `Todas` / `Vigentes` / `Em extinção` e `Encerradas` **desabilitados** ("Situação Em extinção ainda não vem da API de isenção"); "Pesquisar matriz" ("Código ou curso"); select `Curso`.
- **Colunas**: Matriz, Disciplinas, Carga na isenção, Vigente desde, Em análise, Situação, Ações. Vários campos são marcadores de dado ausente: "Abra a matriz para carregar as disciplinas", "Carga total da matriz não exposta pela API", "Data de vigência não vem da API de isenção", "Situação ainda não disponível". Linhas especiais: "Matriz não identificada — Citada em N solicitação(ões)", "Matriz ainda não definida — Solicitações sem matriz selecionada".
- **UCAMDS**: **coberta** por `isencao/matrizes`.

### 1.8 Cursos — `/admin/isencao/cursos`
- **Propósito**: ver, por curso, a matriz vigente e quantas solicitações estão em análise.
- **Arquétipo**: listagem de consulta.
- **Peças**: trilha; botão `Exportar`; "Pesquisar curso" ("Nome do curso").
- **Colunas**: Curso, Coordenação ("Coordenação responsável não informada"), Matriz vigente ("Consultando matrizes" / "Nenhuma matriz identificada"), Em análise ("Nenhuma solicitação em análise").
- **UCAMDS**: **coberta** por `isencao/cursos` (com menos do que o DS desenha, ver §7).

### 1.9 Acompanhamento do candidato — `/isencao/:oidFormaIngressoPessoa`
- **Propósito**: o candidato vê a situação, o pedido da coordenação, seus documentos e a situação por disciplina; envia documentos.
- **Arquétipo**: página de acompanhamento (uma solicitação), duas colunas, moldura mínima.
- **Peças**: faixa só com "Isenção" e a conta; trilha "Meus sistemas / Isenção de disciplinas"; cabeçalho com curso e período; **aviso por situação**:
  - Aguardando você: "A coordenação pediu um documento", a observação, "Envie o documento solicitado para continuar a análise.", botão "Enviar documento", regra "PDF, PNG ou JPG de até 10 MB."
  - Aguardando envio: "Envie a documentação para iniciar a análise. É necessário ao menos o histórico e a ementa."
  - Concluída: parecer em texto (N disciplinas isentas / não isentas), data e observação.
- "Documentos enviados" (lista; "Você ainda pode enviar documentos complementares."); "Disciplinas" (seletor de período; tabela `Disciplina | Período | Carga horária | Situação`; mostra o documento pedido e, concluída, o motivo da não isenção quando houver); painel "Sua solicitação" (Inscrição — identificador curto —, Curso, Período letivo, Instituição de origem, Solicitada em, Concluída em, Carga horária isenta); "Atividade" (eventos filtrados).
- **Estados**: "Carregando solicitação…"; "Não foi possível carregar a solicitação" + "Tentar novamente".
- **UCAMDS**: **coberta** por `isencao/acompanhamento` e `isencao/resultado`.

### 1.10 Diálogo "Enviar documento" (candidato)
- **Campos**: `descricao` ("Descrição", apoio "Diga o que é o arquivo: ementas, histórico, declaração.", erro "Informe a descrição."); `arquivo` ("Arquivo", "PDF, PNG ou JPG de até 10 MB.", "Selecionado: …", erro "Selecione um arquivo.").
- **UCAMDS**: **coberta** — é o diálogo desenhado em `isencao/acompanhamento`; peças `dialog`, `text-field`, `file-field`, `anexo`.

### 1.11 Cadastro de provas — `/admin/vestibular`
- **Propósito**: cadastrar a prova (caderno) de uma oferta do vestibular e gerenciar suas questões.
- **Arquétipo**: filtro em cascata + formulário + lista na mesma página; subpainel de questões.
- **Peças**: cabeçalho "Cadastro de provas" / "Prova específica fica na unidade escolhida. Prova sem unidade vale para todas."
  - **Filtro**: selects em cascata `Unidade do processo` (`oidUnidade`) → período do processo (`oidPeriodo`) → forma de ingresso (`oidForma`) → captação (`oidCaptacao`); "Os filtros mostram somente ofertas cadastradas, incluindo períodos históricos."; botão "Listar provas".
  - **Nova prova / Editar prova**: rádio "Abrangência" (`Todas as unidades` / `Unidade específica`) com explicação; select `Tipo` (`tipoProva`, única opção: "Redação"); `Salvar` / "Cancelar edição".
  - **Provas desta oferta**: tabela `Tipo | Unidade | (ações)`; ações `Editar`, gerenciar questões (rótulo exato não confirmado).
- Sem as classes do UCAMDS: HTML simples com estilos locais.
- **UCAMDS**: **parcial** — padrões `listagem-crud` + `formulario-entidade`; peças `select`, `radio-group`, `data-table`, `button`. **Falta** tela de referência e falta um padrão de "filtro em cascata que habilita o formulário".

### 1.12 Gerenciar questões (subpainel de `/admin/vestibular`)
- **Peças**: título "Questões — TIPO"; "Lista (N)" com "Ordem X · Y pt"; formulário "Nova questão / Editar questão": `pontuacao` ("Pontuação (0 a 10, passo 0,5)"), `ordem` ("Ordem"), `textoreferencia` ("Texto de referência (HTML)"), `descricao` ("Enunciado (HTML)"); "Alternativas existentes (somente leitura)". Inativar pede confirmação pelo `confirm()` do navegador.
- **UCAMDS**: **parcial** — `listagem-inspetor` serve de base; **falta** peça de editor de texto rico/HTML e a tela.

### 1.13 Visualização do caderno (subpainel)
- **Peças**: "Somente leitura · oferta"; lista `Unidade`, `Questões`, `Pontuação total cadastrada`, `Situação`, `Início do caderno`, `Fim do caderno`; "O gabarito não é exibido nesta visualização."; por questão: Texto de referência, Enunciado, Alternativas (ou "Resposta textual (redação)."); "Fechar visualização".
- **UCAMDS**: **parcial** — `description-list` + `card`; sem tela de referência.

---

## 2. Moldura e navegação

- **Moldura do coordenador** (`features/isencao/admin-ux/coord-shell.component.html`) — montada com as classes do UCAMDS (`ucam-shell`, `ucam-appbar`, `ucam-nav`, `ucam-campus`, `ucam-main`):
  - link "Pular para o conteúdo"; botão "Abrir navegação" (gaveta em telas pequenas);
  - faixa: marca + "Isenção"; busca "Buscar candidato" (por nome); bloco **Campus** com o valor da unidade ou "não definido"; avatar com iniciais;
  - navegação: grupo **Favoritos** → "Aguardando análise" (com contagem); grupo **Trabalho** → "Fila de análise"; grupo **Cadastros** → "Matrizes curriculares", "Cursos"; rodapé → "Configurações" e "Central de ajuda" (desabilitada: "Central de ajuda ainda não disponível").
- **Conta**: não há menu de conta nem `Sair` na moldura. O avatar, o bloco Campus ("Trocar unidade ou sessão") e "Configurações" ("Sessão e unidade") são links para `/admin/dev-session`, rota que em produção redireciona para `/`. **Em produção esses três controles não levam a lugar nenhum útil.**
- **Troca de unidade**: só pela tela de desenvolvimento. A unidade vem do handoff e é enviada em toda requisição administrativa no cabeçalho `X-Oid-Unidade` (`core/http/unidade-interceptor.ts:6`, `:31-45`). Não há tenant.
- **Como a sessão chega**: o portal abre `/admin/login/<token>/<usuario>?oidpessoa=&unidade=`; a página grava `AuthState` no `localStorage` (`token`, `usuario`, `oidpessoa`, `unidadeSelecionada`) e navega para `/admin/isencao` (`pages/admin-login/admin-login.page.ts:43-54`; `core/auth/auth-session.service.ts:32-58`). O token **não é validado** no front e **nenhum interceptor o envia** ao backend (não há cabeçalho `Authorization`; só `X-Oid-Unidade`). Se o backend exige o token por outro meio: não confirmado.
- **Candidato**: sem login. O endereço com o `oidFormaIngressoPessoa` é a chave; as três chamadas do candidato não levam cabeçalho de unidade (`unidade-interceptor.ts:13-25`).
- **Sessão expirada**: não existe o conceito. A sessão fica no `localStorage` até ser apagada; não há tratamento de 401.
- **Erros globais** (`core/http/error-interceptor.ts:11-29`): sem rede → "Não foi possível conectar ao backend."; 5xx → "Erro interno no servidor. Tente novamente." (em download: "Não foi possível baixar o documento (arquivo ausente no armazenamento)."); 4xx (menos 404) → mensagem do servidor. Tudo em toast de 4,5 s.
- **Vestibular**: página solta, sem a moldura do coordenador e sem item de menu que leve a ela.

---

## 3. Peças e estilo próprios

### Componentes do app
| Peça | Arquivo | Props |
|---|---|---|
| `app-coord-shell` | `features/isencao/admin-ux/coord-shell.component.ts` | moldura; recebe caminho-base, unidade, usuário, contagem "aguardando análise" (lista exata de entradas não confirmada) |
| `app-fila-analise` | `admin-ux/fila-analise.component.ts` | linhas, filtros, estágio, contagens, `enableIa`, `showUnidade`; saídas `abrir`, `atualizar`, `exportar`, `limpar`, `stageChange` |
| `app-matrizes-view`, `app-cursos-view` | `admin-ux/*.component.ts` | linhas agregadas a partir da fila |
| `app-admin-isencao-shell` | `pages/admin/admin-isencao.shell.ts` | `enableIa` |
| `app-page-header` | `core/ui/page-header.component.ts` | `title` (obrigatório), `subtitle`, `eyebrow` |
| `app-alert` | `core/ui/alert.component.ts` | `tone: 'info' \| 'warning' \| 'danger' \| 'success'` |
| `app-empty-state` | `core/ui/empty-state.component.ts` | `message = 'Nenhum registro encontrado.'` |
| `app-loading-state` | `core/ui/loading-state.component.ts` | `message = 'Carregando…'` |
| `app-status-badge` | `core/ui/status-badge.component.ts` | `tone: 'neutral' \| 'info' \| 'warning' \| 'success' \| 'danger' \| 'brand'` |
| `app-status-chip` | `core/ui/status-chip.component.ts` | `tone`, `dot = true` |
| `app-segmented-control` | `core/ui/segmented-control.component.ts` | `items`, `value`, `allowEmpty`, `suggested`, `disabled`, `disabledReason`, `ariaLabel`, `block`; saída `valueChange` |
| `ToastService` | `core/ui/toast.service.ts` | `success`, `error`, `info`; some em 4500 ms |
| `app-questao-gerenciamento`, `app-caderno-visualizacao` | `features/vestibular/pages/cadastro/*` | caderno, oferta; saída `fechar` |

Os componentes de `core/ui/` são a primeira geração (ADR-002); as telas da isenção hoje usam direto as classes `.ucam-*`.

### Uso do UCAMDS — **este é o único dos três que usa**
- O app embarca **`ucam-ds.css`** (401.704 bytes; cópias idênticas em `frontend-v2/public/` e `frontend-v2/src/styles/`), um build com Tailwind v4.3.3 que contém **585 classes `.ucam-*`** e as variáveis `--ucam-color-*` do design system (`ucam-table`, `ucam-nav`, `ucam-estado`, `ucam-card`, `ucam-shell`, `ucam-appbar`, `ucam-input`, `ucam-field`, `ucam-timeline`, `ucam-viewbar`, `ucam-btn`, `ucam-badge`, `ucam-select`, `ucam-segmented`, `ucam-empty`, `ucam-dialog`, `ucam-anexo`, `ucam-tabs`, `ucam-trilha`, `ucam-campus`, `ucam-pagination`, entre outras).
- O CSS é carregado **em tempo de execução**, por `<link id="ucam-ds-css" href="ucam-ds.css">` injetado pelo componente, e removido ao sair (`features/isencao/ucam-ds-loader.ts:11-47`; `admin-ux/coord-shell.component.ts:19-21`). Só as telas da isenção (coordenador e candidato) o carregam.
- O carregador **força `data-theme="dark"`** em `<html>` enquanto a tela está aberta (`ucam-ds-loader.ts:17`): a isenção roda no tema escuro do DS, sem alternador.
- É uma **cópia estática do CSS**, sem pacote: não há `@ucam/*` nem `@universidade-candido-mendes/ucam-design-system` no `package.json`; não há menção a MCP nem a AGENTS do UCAMDS. Versão do DS de que o arquivo foi tirado: não confirmado.
- Fontes Geist e Geist Mono embarcadas em `frontend-v2/public/fonts/` (woff2), usadas pelo CSS do DS.
- O protótipo `docs/ux/isencao-v2-prototipo.html` é a origem das telas de referência do DS (24/09/2026).

### Estilo anterior (ainda presente em `frontend-v2/src/styles.scss`)
Tokens da ADR-002, usados por entrada, handoff, sessão de desenvolvimento e vestibular:
| Token | Valor |
|---|---|
| `--color-brand-900 … -50` | `#5c0218`, `#72021e`, `#8f0324`, `#a51436`, `#f8e8ec`, `#fbf3f5` |
| texto | `#1a1f24`, `#5a6570`, `#7a8692` |
| bordas / superfícies | `#d9dee5`, `#b8c0cb`; `#ffffff`, `#f4f5f7`, fundo `#f0f1f3` |
| sucesso / atenção / perigo / informação | `#1f6b3a` / `#8a5b00` / `#9b1c1c` / `#1d4f91` (fundos `#e8f5ee`, `#fff6e5`, `#fdecec`, `#eaf2fb`) |
| foco | `#8f0324`, anel `0 0 0 3px rgba(143,3,36,.28)` |
| tipografia | **Source Sans 3** (Google Fonts); corpo 16 px, rótulo 14, pequeno 13, título 28, seção 20 |
| espaços | 4, 8, 12, 16, 20, 24, 32, 40, 48 px |
| raios | 6 px, 8 px |

Cor de marca declarada: **`#8F0324`** (ADR-002). Ícones: SVG inline; os nomes citados em código (`i-inbox`, `i-paperclip`, `i-listChecks`, `i-triangleAlert`, `i-send`, `i-check`, `i-pencil`) seguem o conjunto do UCAMDS.

---

## 4. Regras de negócio lidas no código

(B) = regra aplicada no backend.

1. **Só pede isenção quem entrou por transferência ou reingresso.** Formas aceitas: `TRANSFERENCIA`, `REINGRESSO`. "Forma de ingresso não aceita." — `service/isencao/IsencaoService.java:55`, `:71` — permissão — (B).
2. **Situações da solicitação (banco)**: `PENDENTE_ANALISE`, `ANALISADO_COM_PENDENCIA`, `CONCLUIDO`. Nasce em `PENDENTE_ANALISE`. — `domain/isencao/IsencaoStatus.java:4-6`; `domain/isencao/Isencao.java:51` — transição — (B). Rótulos antigos: "Aguardando a análise", "Pendente atualização do candidato", "Concluído" (`features/isencao/models/isencao.models.ts:151-155`).
3. **Situações que a coordenação vê (derivadas na tela)**: `Concluída` se concluída; `Aguardando candidato` se analisada com pendência; `Aguardando envio` se não há documento; senão `Aguardando análise`. — `features/isencao/admin-ux/coord-data.ts:24-29`, `:53-63` — cálculo. "Aguardando envio" não existe no banco.
4. **O candidato vê as mesmas situações, com "Aguardando você" no lugar de "Aguardando candidato".** — `features/isencao/candidato-ux/candidato-ux.ts:11-16`, `:34-38` — formato.
5. **Decisão por disciplina**: `ACEITO` ("Isentar"), `RECUSADO` ("Não isentar"), `PENDENTE` ("Pedir documento") ou sem decisão. Clicar de novo na opção marcada desfaz. — `coord-data.ts:352-356`; `pages/admin/admin-isencao.shell.ts:407` — transição.
6. **Para finalizar, disciplina isenta exige disciplina de origem, IES e carga horária.** "Erro no Nº semestre, <disciplina> sem descrição!" / "… sem IES!" / "… sem carga horária!"; toast "Corrija os campos obrigatórios antes de finalizar." — `features/isencao/utils/isencao-ui.ts:16-28`; `admin-isencao.shell.ts:471` — validação.
7. **Para finalizar, "pedir documento" exige dizer qual.** "Erro no Nº semestre, <disciplina> sem motivo!"; o campo aceita até 300 caracteres. — `isencao-ui.ts:30-33`; `pages/admin/admin-isencao.shell.html:476` — validação/limite.
8. **Disciplina sem decisão não barra a finalização.** A validação só olha as marcadas como isentar ou pedir documento. — `isencao-ui.ts:13-35` — validação (ausência).
9. **"Não isentar" não tem motivo.** A tela não oferece o campo e o backend não grava texto para `RECUSADO`. — `IsencaoService.java:207-208` — validação (ausência) — (B). A tela do candidato tem lugar para o motivo e ele só aparece se vier preenchido (`candidato-isencao.page.html:268`).
10. **Finalizar com algum documento pedido não conclui.** A avaliação marca `CONCLUIDO`, mas uma disciplina `PENDENTE` com motivo devolve a solicitação a `ANALISADO_COM_PENDENCIA`. — `IsencaoService.java:190`, `:197-200` — transição — (B).
11. **Na avaliação final, disciplina que estava pendente e volta sem decisão nem motivo vira "não isenta".** — `IsencaoService.java:209-215` — transição — (B).
12. **Salvar rascunho grava as decisões sem concluir.** `POST …/evaluate?partial=true`; "Rascunho salvo." / "Avaliação finalizada."; depois de salvar a tela volta à fila. — `data/isencao-api.service.ts:62-67`; `admin-isencao.shell.ts:768` — transição.
13. **"Enviar pedido ao candidato" só muda a situação e grava a observação; não envia e-mail nem SMS.** "Solicitação marcada como Aguardando candidato. Nenhum e-mail/SMS é enviado pelo sistema." — `admin-isencao.shell.ts:502-503`; `IsencaoService.java:165-184` — transição/integração — (B).
14. **Solicitação concluída não volta a "Aguardando candidato".** "Solicitação concluída não pode mudar para Aguardando candidato." — `IsencaoService.java:167-169` — transição — (B). Não há reabertura de solicitação concluída em nenhum ponto do código lido.
15. **Observação ao candidato: até 150 caracteres.** — `admin-isencao.shell.html:677`, `:681` — limite. Limite no backend: não confirmado.
16. **Sem documento não há decisão.** Solicitação sem documento abre somente leitura ("Sem documentos enviados não há decisão."); a única ação é "Marcar aguardando candidato". — `admin-isencao.shell.ts:152-156`, `:413` — permissão.
17. **Solicitação concluída é somente consulta.** "Solicitação concluída: somente consulta." — `admin-isencao.shell.ts:150`, `:156`, `:412` — permissão.
18. **O candidato envia documento enquanto a solicitação não está concluída.** — `isencao-ui.ts:3-5` — permissão.
19. **Arquivo do candidato: PDF, PNG ou JPG, até 10 MB.** "Arquivo acima de 10 MB."; tipos `.pdf,.png,.jpg,.jpeg`. — `candidato-ux.ts:132-133`; `pages/candidato/candidato-isencao.page.ts:232-233` — limite/formato (front). O servidor aceita até 30 MB por arquivo e 120 MB por requisição (`backend-v2/src/main/resources/application.properties:20-21`) e não restringe o tipo no envio.
20. **Cada arquivo precisa de descrição.** "Informe a descrição." (tela); "Descrição obrigatória para cada arquivo."; "Quantidade de descrições deve ser igual à de arquivos ou conter apenas uma descrição." — `IsencaoService.java:125-139` — validação — (B).
21. **No máximo 10 anexos por solicitação.** "Quantidade de anexos excede o limite permitido de 10." — `application.properties:58`; `IsencaoService.java:89-94` — limite — (B).
22. **Enviar documento devolve a solicitação a "Aguardando análise".** E, se já estava nela, a forma de ingresso da pessoa passa a `CONFIRMADO`. — `IsencaoService.java:111-116` — transição — (B).
23. **"É necessário ao menos o histórico e a ementa."** Só texto de orientação; nada confere. — `candidato-isencao.page.html:116` — validação (ausência).
24. **Enquanto a análise corre, o candidato vê por disciplina só "Em análise" ou "Aguardando documento"; "Isenta" e "Não isenta" só depois de concluída.** — `candidato-ux.ts:49-61` — permissão.
25. **O candidato não vê sugestão automatizada nem os eventos dela.** A atividade dele filtra para: `SOLICITACAO_ABERTA`, `DOCUMENTOS_ENVIADOS`, `AGUARDANDO_CANDIDATO`, `ANALISE_FINALIZADA`, `OBSERVACAO_REGISTRADA`. — `candidato-ux.ts:26-32`; `ISENCAO-IA.md:3` — permissão.
26. **Parecer do candidato é calculado na tela**: "N disciplinas da matriz foram isentas", "A disciplina não isenta continua na sua grade"; "Carga horária isenta" soma a carga das disciplinas isentas. — `candidato-ux.ts:79-125` — cálculo.
27. **A análise automatizada dispara sozinha quando o candidato envia documento**, sem bloquear o envio; se falhar, o arquivo fica salvo. — `IsencaoService.java:118-123`; `ISENCAO-IA.md:15-18` — integração — (B).
28. **Estados da análise automatizada**: `PROCESSANDO`, `CONCLUIDA`, `FALHA`; na fila viram "Em processamento", "Disponível", "Falhou", e "Sem análise" quando não há registro. — `models/isencao.models.ts:3`; `coord-data.ts:73-83` — formato.
29. **A tela consulta a análise a cada 5 segundos enquanto está processando.** — `features/isencao/utils/analise-ia-poll.ts:8`, `:22-33` — prazo.
30. **Compatibilidade de 70% ou mais vira recomendação de isentar.** `ucam.llm.isencao.min-compatibilidade-isentar=70`. — `application.properties:54`; `ISENCAO-IA.md:20` — cálculo — (B). O SDD cita "policies 70%/75%" (`docs/sdd/04-regras-negocio.md:101`); o que é o 75%: não confirmado.
31. **Recomendações possíveis**: `ISENTAR` ("Sugere isentar"), `NAO_ISENTAR` ("Sugere não isentar"), `REVISAR` ("Revisar"). — `models/isencao.models.ts:4`; `coord-data.ts:405-409` — formato.
32. **A sugestão só vale para a matriz em que foi feita.** Outra matriz aberta: "A sugestão disponível refere-se a outra matriz curricular." — `admin-isencao.shell.html:132-144`; `ISENCAO-IA.md` (seção "Tags e matriz") — validação.
33. **Sem matriz escolhida, a análise automatizada usa a matriz mais recente do curso.** — `ISENCAO-IA.md:19` — cálculo — (B).
34. **Aplicar sugestões preenche só as disciplinas sem decisão e só as recomendações firmes; as "revisar" ficam com a pessoa; não finaliza.** Mensagem: "N sugestão(ões) aplicada(s); M para revisar ficam com você. A análise não foi finalizada." — `admin-isencao.shell.ts:640-676`; `coord-data.ts:384-388` — transição.
35. **Aplicar uma sugestão de isentar preenche disciplina de origem, IES e carga horária a partir do documento.** — `ISENCAO-IA.md` (seção "Confirmar recomendações da IA") — cálculo — (B).
36. **Decisão sobre a sugestão**: `DEFERIDO` ou `INDEFERIDO`, uma vez só. "Decisão inválida. Valores permitidos: DEFERIDO, INDEFERIDO."; "Sugestão já foi decidida." — `service/isencao/IsencaoAnaliseIaService.java:203`, `:246` — transição — (B).
37. **A análise automatizada só lê PDF**: "Apenas arquivos PDF são aceitos para análise por IA."; até 20 MB por PDF ("PDF excede o tamanho máximo permitido de 20 MB."); precisa de ao menos um histórico ("Nenhum histórico escolar identificado nos documentos."). — `service/isencao/extraction/PdfDocumentValidator.java:20-36`; `extraction/DisciplinaExtraidaMapper.java:60`; `application.properties:59` — limite/formato — (B). PNG e JPG que o candidato envia não entram na análise.
38. **Modelo usado**: `claude-sonnet-4-5` por padrão; tempo limite 60 s; `LLM_PROVIDER` pode ser `mock`. — `application.properties:42-47` — integração — (B).
39. **A fila separa "Em análise" de "Concluídas"**; o filtro por situação só existe em "Em análise". — `coord-data.ts:137-149`; `IsencaoRepository.java:180`, `:299` — cálculo — (B).
40. **A fila é a dos cursos da unidade em que a pessoa atua.** Consulta por unidade + pessoa (`/isencao/{oidUnidade}/{oidPessoa}/analize/courses`). — `data/isencao-api.service.ts:70-80` — permissão — (B). A regra exata que liga pessoa a curso: não confirmado.
41. **Unidade só aparece como coluna e filtro no EAD.** EAD = unidade cujo oid começa por `polo`, `semi` ou `hibri`, ou é `unid32`. — `utils/isencao-ui.ts:52-61` — cálculo.
42. **Exportar gera CSV da lista filtrada**, com a coluna de sugestão quando a IA está ligada. — `coord-data.ts:174-193` — formato.
43. **A matriz vigente de um curso é a ativa mais recente** ("regra do acadêmico"). — `admin-ux/matrizes-view.component.html:161` — cálculo. Situação "em extinção / encerrada", data de vigência e carga total não vêm da API.
44. **Atividade**: eventos `SOLICITACAO_ABERTA`, `DOCUMENTOS_ENVIADOS`, `ANALISE_IA_INICIADA`, `ANALISE_IA_CONCLUIDA`, `ANALISE_IA_FALHA`, `AGUARDANDO_CANDIDATO`, `ANALISE_FINALIZADA`, `OBSERVACAO_REGISTRADA`; parte é inferida das datas (`inferido`); o texto de dados corta em 500 caracteres. — `coord-data.ts:447-463`; `service/isencao/IsencaoAtividadeService.java:56`, `:155-196` — formato — (B).
45. **Toda requisição administrativa leva a unidade no cabeçalho `X-Oid-Unidade`.** — `core/http/unidade-interceptor.ts:6`, `:36-44` — integração.
46. **Vestibular — prova sem unidade vale para todas as unidades da mesma oferta** (forma de ingresso + captação + período); com unidade, só para ela. Se existirem as duas, as duas são entregues. — `docs/sdd/16-prova-global-unidades.md:11-24`; `vestibular-cadastro.page.ts:23` — permissão — (B).
47. **Vestibular — para listar ou salvar é preciso escolher processo, forma de ingresso e captação.** "Selecione processo, forma de ingresso e captação."; "Informe a unidade ou escolha Todas as unidades."; "Nenhuma oferta cadastrada para prova." — `vestibular-cadastro.page.ts:252`, `:301`, `:322-326` — validação.
48. **Vestibular — único tipo de prova no cadastro: Redação.** — `vestibular-cadastro.page.ts:96-97` — limite. O backend exige "o tipo de prova não pode ser nulo" e "a formaingressovigencia não pode ser nula" (`domain/vestibular/Cadernoprova.java:40`, `:51`) — (B).
49. **Vestibular — pontuação da questão entre 0 e 10, de 0,5 em 0,5.** "Pontuação deve estar entre 0 e 10." — `questao-gerenciamento.component.ts:71`, `:348` — limite.
50. **Vestibular — questão não se apaga: inativa.** "Inativar esta questão? O vínculo com alternativas/histórico é preservado (soft delete)."; editar preserva alternativas e gabarito ("Questão atualizada. Alternativas e gabarito preservados."). — `questao-gerenciamento.component.ts:369`, `:397` — transição.
51. **Vestibular — o gabarito não aparece na visualização; alternativas são somente leitura.** — `caderno-visualizacao.component.ts:24`; `questao-gerenciamento.component.ts:102` — permissão.

Total: **51 regras**.

---

## 5. API

Base do backend em `:8031`. Sem cabeçalho de autenticação enviado pelo front; `X-Oid-Unidade` nas rotas administrativas.

| Método | Caminho | Uso |
|---|---|---|
| GET | `/isencao/{fip}` | solicitação (`IsencaoDto`) |
| POST | `/isencao/{fip}` | requerer isenção |
| POST | `/isencao/{fip}/upload` | multipart: arquivos + descrições |
| GET | `/isencao/{fip}/download/{oidAnexo}` | baixar anexo |
| GET | `/isencao/{fip}/matrizes` | `MatrizProjection[]` |
| GET | `/isencao/{fip}/matrizes/{oidMatriz}` | disciplinas da matriz com decisões |
| POST | `/isencao/{fip}/evaluate` (`?partial=true` para rascunho) | grava a avaliação (`CursoMatrizDto`) |
| POST | `/isencao/{fip}/notificar` | `{ observacao? }` → aguardando candidato |
| GET | `/isencao/{fip}/atividade` | `AtividadeDto[]` |
| GET | `/isencao/{oidUnidade}/{oidPessoa}/analize/courses` | fila em análise (`CourseCandidateDto[]`) |
| GET | `/isencao/{oidUnidade}/{oidPessoa}/analized/courses` | concluídas |
| GET | `/isencao/{fip}/analise-ia` | análise mais recente (404 se não há) |
| POST | `/isencao/{fip}/analise-ia` | disparar análise (uso pela tela não confirmado) |
| GET | `/isencao/…/analise-ia/{oidAnalise}` | análise por identificador (caminho completo não confirmado) |
| POST | `/isencao/{fip}/analise-ia/sugestoes/{oidSugestao}/decisao` | `{ decisao: 'DEFERIDO' \| 'INDEFERIDO', observacao? }` |
| GET | `/vestibularonline/ofertas-cadastro` | `OfertaVestibular[]` |
| GET | `/vestibularonline/find-cadernoprova-by-processoseletivo` | cadernos da oferta |
| POST / PUT | `/vestibularonline/cadernoprova` | cria / altera prova |
| GET | `/vestibularonline/find-questao-by-caderno` | questões |
| POST / PUT | `/vestibularonline/questao`; DELETE `/vestibularonline/questao/{oid}` | questão (DELETE inativa) |
| GET | `/data-context/periodoprocessoseletivo/search/findByUnidade` e correlatos | compatibilidade com o cliente antigo |
| GET | `/` | saúde (`OK`) |

Modelos (`features/isencao/models/isencao.models.ts`, `features/vestibular/data/vestibular-api.service.ts`):
- `IsencaoDto { status, curso, documentos[], semestres: Record<período, CursoDisciplinaDto[]>, observacao, codigomatriz, matrizunidadecurso, nome, cpf, email, telefone[], matriz, unidade, periodoLetivo, datasolicitacao, dataalteracao }`
- `CursoDisciplinaDto { oid, nome, motivo, aceita, descricao, ies, cargaHoraria, cargaHorariaDisciplina }`
- `IsencaoDocumentoDto { oid, descricao, filename }`
- `CandidateDto { oid, nome, situacao, periodoLetivo, formaIngressoPessoa, documentos (quantidade), codigomatriz, telefone, email, status, datasolicitacao, dataalteracao, situacaoAnaliseIa }`
- `CourseCandidateDto { oid, nome, oidUnidadeCurso, unidade, candidates[] }`
- `MatrizProjection { oidmatriz, matriz, oidmatrizunidadecurso, codigomatriz, ano, semestre, descricao, vigente }`
- `AnaliseIsencaoIaResponse { oidAnalise, oidFormaIngressoPessoa, oidMatriz, codigoMatriz, modeloIa, dataAnalise, statusAnalise, sugestoes[] }`
- `SugestaoIsencaoIaResponse { oidSugestao, disciplinaOrigemId, disciplinaOrigem, oidDisciplinaMatriz, disciplinaDestinoId, disciplinaDestino, compatibilidade, cargaHorariaCompativel, iesOrigem, cargaHorariaOrigem, recomendacao, justificativa, status }`
- `AtividadeDto { tipo, descricao, ator, papel, dataEvento, dados, inferido }`
- `CadernoProva { oid, tipoprova, todasUnidades, rotuloUnidade, unidade: {oid, sigla}, formaingressovigencia, questoes[], status, datainicio, datafim }`
- `QuestaoProva { oid, descricao, textoreferencia, ordem, pontuacao, status, cadernoprova, alternativas[] }`; `AlternativaProva { oid, alternativa, descricao }`
- `OfertaVestibular { oidVigencia, oidUnidade, unidade, oidProcesso, ano, semestre, oidForma, forma, captacao, captacaoLabel }`

---

## 6. O que o código não responde

| Pergunta | Quem provavelmente decide |
|---|---|
| Quem pode ver e decidir: cada coordenação só o próprio curso, ou a unidade inteira? O front consulta por unidade + pessoa, mas não envia credencial. | Secretaria acadêmica / TI |
| O candidato é avisado por algum canal? O sistema declara que não envia e-mail nem SMS. | Secretaria acadêmica |
| Há prazo para o candidato enviar o documento pedido, e o que acontece quando vence? Não há prazo no código. | Secretaria acadêmica |
| "Não isentar" precisa de motivo? Hoje não há onde registrar. | Coordenação de curso |
| Disciplina sem decisão pode ficar assim numa solicitação concluída? Hoje pode. | Secretaria acadêmica |
| Solicitação concluída pode ser reaberta? Não há essa ação. | Secretaria acadêmica |
| Quais documentos são obrigatórios (histórico, ementa)? Hoje é só orientação. | Secretaria acadêmica |
| Imagens (PNG/JPG) devem ser aceitas, já que a análise automatizada só lê PDF? | Coordenação de curso / TI |
| O limite é 10 MB (tela), 20 MB (análise) ou 30 MB (servidor)? | TI |
| Quem liga a análise automatizada e para quais cursos? Hoje são duas rotas (`/admin/isencao` e `/admin/isencao-ia`), sem configuração por curso. | Secretaria acadêmica |
| O limiar de 70% é definitivo? O que significa o 75% citado no SDD? | Coordenação de curso |
| A isenção concedida entra sozinha no histórico acadêmico? | Secretaria acadêmica / TI (dono do SIGU) |
| Como se troca de campus e como se sai em produção, se os controles apontam para uma rota de desenvolvimento? | TI |
| O link do candidato é seguro o bastante sem login (identificador na URL dá acesso a nome, CPF, e-mail e documentos)? | Encarregado de dados (LGPD) / segurança da informação |
| Por que o cadastro de provas do vestibular vive neste sistema, e quem o opera? | Comissão do vestibular / TI |
| O vestibular terá outros tipos de prova além de Redação? | Comissão do vestibular |

---

## 7. Divergências contra as telas de referência do UCAMDS (projeto `isencao`)

Fonte do DS: `DSUCAM/spec/templates.json` → `projetos[isencao].templates[]` (8 telas, nascidas do protótipo HTML de 24/09/2026). É o caso mais próximo dos três: o sistema usa o CSS do DS e a estrutura das telas acompanha as de referência.

| Tela do DS | No sistema real | Divergência |
|---|---|---|
| `fila` (colunas Candidato, Curso, Solicitada em, Situação, Sugestão; em Concluídas: Concluída em, Resultado; segmentos Todas / Aguardando envio / Aguardando análise / Aguardando candidato; "Falhou · Tentar de novo") | iguais em "Em análise"; em "Concluídas" a mesma tabela, **sem** "Concluída em" e "Resultado"; coluna e filtro **Unidade** no EAD; botão `Atualizar` | "Tentar de novo" **não existe**: o botão aparece desabilitado ("Reprocessar a sugestão ainda não está disponível"). O DS propõe "análise manual e com sugestão são a mesma fila"; o sistema ainda tem **duas rotas** (`/admin/isencao` e `/admin/isencao-ia`). Sem paginação nos dois. |
| `analise` (Salvar rascunho, Enviar pedido ao candidato, Aplicar N sugestões, Isentar / Não isentar / Pedir documento, "Por que revisar?", Observação) | iguais, mais `Finalizar análise` e o seletor de matriz | **Regras**: o DS propõe "disciplina sem decisão barra o fechamento" — o sistema **não barra** (regra 8). O DS propõe "não há fechamento parcial" — o sistema devolve a "aguardando candidato" quando há documento pedido (regra 10), o que equivale na prática. O DS propõe **prazo de 15 dias** para o candidato — **não existe** no código. Limiar da sugestão: o DS diz 75% / 50–74% / abaixo de 50%; o código tem **70%** configurável e não tem faixa de "revisar" por percentual confirmada. Observação de 150 caracteres — **confere**. O DS diz que enviar a observação muda a situação; no sistema quem muda é o botão "Enviar pedido ao candidato". Campos ao isentar (Disciplina de origem, IES, Carga horária) são **obrigatórios** no sistema; campo do documento pedido tem 300 caracteres. |
| `consulta` ("Baixar parecer", "Reabrir análise", decisões como selos, observação como citação) | somente leitura, com selos ("Isenta", "Não isenta", "Pedir documento", "Sem decisão") e a observação enviada | **Não existem** "Baixar parecer" nem "Reabrir análise" (regra 14). |
| `sem-documentos` (única ação: "Notificar candidato") | única ação: **"Marcar aguardando candidato"** | Nome diferente e sentido diferente: o sistema declara que **não notifica** ninguém (regra 13). |
| `acompanhamento` (diálogo com Descrição, "Escolher arquivo", **"Verificar com IA"**, Enviar; "PDF de até 10 MB") | diálogo com Descrição e Arquivo; "PDF, PNG ou JPG de até 10 MB" | **Não existe** "Verificar com IA" para o candidato (a IA é invisível a ele, regra 25). O sistema aceita **PNG e JPG** além de PDF. Enviar o documento devolve a "aguardando análise" — **confere** (regra 22). |
| `resultado` ("Baixar parecer"; "não isenta sempre vem com o motivo") | parecer em texto, resumo e carga isenta | **Não existe** "Baixar parecer". O motivo da não isenção **não tem de onde vir** (regra 9) — o próprio DS já registra essa pergunta como aberta. |
| `matrizes` (segmentos Todas / Vigentes / Em extinção / Encerradas; colunas com Disciplinas, Carga na isenção, Vigente desde, Em análise, Situação; `Exportar`) | mesmas colunas, mas **Em extinção** e **Encerradas** desabilitados e várias células com "não vem da API" | A tela existe com a forma do DS e **sem os dados**: situação, data de vigência e carga total não são expostos pela API. Só lista matrizes de cursos com solicitação. `Exportar` existe. Somente consulta — responde à pergunta aberta do DS: a isenção **só lê** a matriz. |
| `cursos` (colunas Curso, Coordenação, Matriz vigente, Em análise, **Sugestão automatizada**; segmentos "Sugestão ligada / desligada"; gaveta "Isenção em <curso>" com Coordenação responsável e "Sugerir decisões"; Salvar) | colunas Curso, Coordenação, Matriz vigente, Em análise; só busca | **Não existe** a configuração por curso: nem a coluna "Sugestão automatizada", nem o filtro, nem a gaveta de edição. "Coordenação" aparece como "Coordenação responsável não informada". A IA é ligada pela rota, não por curso. |

### Telas do sistema que o DS não tem
- Entrada (`/`), chegada da sessão (`/admin/login/...`), sessão de desenvolvimento.
- **Cadastro de provas do vestibular** (`/admin/vestibular`), gerenciar questões, visualização do caderno.
- Diálogo "Sugestão da análise automatizada".

### Telas do DS que o sistema não tem
- Nenhuma tela inteira. Faltam ações: Baixar parecer, Reabrir análise, Tentar de novo (sugestão que falhou), Verificar com IA, configuração da isenção por curso.

### Moldura
- Navegação **igual** à do DS (Trabalho → Fila de análise; Cadastros → Matrizes curriculares, Cursos), mais o grupo **Favoritos** com "Aguardando análise" e os itens "Configurações" e "Central de ajuda" (desabilitada).
- Tema: o sistema **fixa o escuro**; o DS trata o tema como escolha da pessoa (padrão do dispositivo, grupo Tema no menu da conta).
- Conta: o DS tem menu da conta; o sistema tem avatar que aponta para a rota de desenvolvimento, sem `Sair`.
- Campus: no DS é um seletor; no sistema é um rótulo-link para a rota de desenvolvimento.
- Trilha "Meus sistemas / …" presente nos dois, mas no sistema "Meus sistemas" não é link (não volta ao portal).
- Vocabulário: o código ainda carrega os nomes antigos em três lugares (`STATUS_ISENCAO_LABEL`: "Aguardando a análise", "Pendente atualização do candidato", "Concluído"), ao lado dos novos ("Aguardando análise", "Aguardando candidato", "Concluída").
