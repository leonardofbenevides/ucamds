# Isenção de disciplinas — o protótipo vira projeto do UCAMDS

Design proposto em 24/09/2026 a partir de `isencao-v2-prototipo.html`
(Downloads, 10:37 do mesmo dia). O protótipo é a evidência; o desenho é o
que sai daqui. Aprovado em conversa no mesmo dia ("Seguir"), com a
opção recomendada: o resultado vive como projeto `isencao` em
`spec/templates.json`, publicado no site em Telas.

## O que o protótipo é

Um fluxo de **isenção de disciplinas** para quem entra na universidade
com histórico de outra instituição. Dois lados:

- **Coordenação.** Uma fila de solicitações por unidade e curso, em três
  situações antes da análise (aguardando envio, aguardando análise,
  aguardando candidato) e uma aba de concluídas. Abrir uma solicitação
  mostra a matriz curricular, os documentos enviados, uma observação de
  até 150 caracteres que o candidato lê e as disciplinas por período,
  cada uma com a decisão isentar ou não isentar. Existe um modo "análise
  com sugestão": uma análise automatizada propõe isentar, revisar ou não
  isentar por disciplina, com um botão de aplicar as sugestões sem
  finalizar. A decisão final é sempre humana.
- **Candidato.** Acompanha a situação por disciplina e envia documentos.

O protótipo já acerta o essencial: a fila com situação e período, a
decisão por disciplina, a observação visível ao candidato, a leitura
por período dos dois lados, a distinção entre sugestão e decisão.

## O que muda, e por quê

Cada item abaixo é uma decisão do UCAMDS já tomada, aplicada aqui. Nada
é gosto novo.

1. **Manual e com sugestão são a mesma tela.** No protótipo são dois
   itens de navegação que trocam o título e escondem uma coluna. Aqui a
   sugestão automatizada é um **atributo da solicitação** (disponível,
   em processamento, falhou, sem análise) e uma **configuração do
   sistema** (ligada ou não). Com ela ligada, a fila ganha a coluna
   "Sugestão" e a análise ganha o bloco de sugestões; desligada, nada
   disso existe. As telas de referência mostram o caso ligado, que é o
   mais rico, e uma linha "Sem análise" cobre o outro. Motivo: o menu
   é lugar, não modo (ADR-033, ADR-045: uma pergunta decide, não dois
   caminhos paralelos).

2. **A análise é uma tela, não um painel lateral de 900px.** Matriz,
   documentos, observação e decisões por período são uma página de
   detalhe com `ucam-split`: disciplinas na coluna principal, dados e
   documentos no painel de apoio. É a forma da análise de requerimento
   do Protocolo e do detalhe de usuário do Gerencial. Motivo: painel
   lateral é para consulta rápida sem perder a lista; uma análise que
   decide nove disciplinas e finaliza um processo é trabalho de tela
   inteira (padrão triagem-lista-detalhe, regra do tamanho do
   formulário no formulario-entidade).

3. **Escolhido tem um sinal de superfície e um de tipografia.** Abas,
   períodos e chips de situação em tinta cheia de marca saem; entram
   `ucam-tabs` para o recorte da fila, `ucam-segmented` para o período
   e chips de filtro removíveis (ADR-046, ADR-022).

4. **Nenhum rótulo em caixa alta com tracking** (ADR-003). O "eyebrow"
   vira trilha (`ucam-trilha`) ou some.

5. **Todo controle age, e o efeito chega a quem não vê a tela**
   (ADR-039, ADR-044, sonda de feedback). O toast deixa de ser o único
   retorno. "Salvar rascunho" muda a situação no cabeçalho e anuncia por
   `aria-live`; "Finalizar análise" abre confirmação que **nomeia os
   números** (n isentas, n não isentas, n pendentes) e é barrada
   enquanto houver pendente, dizendo quantas faltam; "Aplicar
   sugestões" preenche só as decisões ainda vazias e diz quantas
   preencheu. O botão "Sem documentos", que não fazia nada, sai: a
   linha do candidato sem documentos abre a mesma análise, com o bloco
   de documentos em estado vazio, o contato do candidato e a ação
   "Notificar candidato".

6. **A situação mora no cabeçalho e não muda de nome pelo caminho**
   (ADR-029). Selo ao lado do título, os mesmos rótulos nos dois lados
   do fluxo: Aguardando envio, Aguardando análise, Aguardando candidato,
   Concluída. Por disciplina: Pendente, Isenta, Não isenta; no lado do
   candidato, antes da conclusão, "Em análise" para o que ainda não foi
   decidido e "Aguardando documento" para o que a observação pede.

7. **Identificador em `.ucam-id`** (ADR-047): número de inscrição do
   candidato, código da matriz (DIR20222) e nome do arquivo.

8. **O lado do candidato ganha moldura.** É uma tela do Portal
   Universitário, na largura estreita, com o candidato na conta. Enviar
   documento é um diálogo (formulário de dois campos, regra do
   formulario-entidade), com o `ucam-file-field` e a lista de anexos
   pelo contrato existente. Os documentos enviados ficam na própria
   página, não num modal.

9. **Unidade é o campus da faixa** (ADR-033). O agrupamento
   "Unidade: RIO > Curso: Direito" com `<details>` sai; curso vira
   coluna e filtro, e a tabela mostra cabeçalho de grupo por curso
   quando não há filtro de curso aplicado.

10. **Os estados da análise automatizada são cenários da tela, não
    detalhes do dado.** Em processamento (selo neutro com relógio),
    disponível (selo de marca), falhou (selo de aviso com a ação
    "Tentar de novo", classe c) e sem análise (travessão com motivo por
    voz).

## As telas

Projeto `isencao`: nome "Isenção de disciplinas", categoria `academico`,
ícone `clipboardCheck`, shell com sistema "Isenção", campus "Rio de
Janeiro" (select), usuário "Leonardo F. Benevides", busca "Buscar
candidato, inscrição ou curso". Navegação: **Trabalho** — Fila de
análise (contagem 8), Concluídas; **Cadastros** — Matrizes
curriculares, Cursos (as duas sem tela, `data-fluxo='b'` com motivo).
Rail com Isenção ativo e os outros sistemas como nos demais projetos; o
item "Isenção" entra no rail dos cinco projetos existentes e um cartão
"Isenção de disciplinas" entra no grupo Acadêmico da grade do Portal.

### 1. `fila` — Fila de análise (listagem-crud)

Barra de visão em três fileiras: trilha (Meus sistemas / Isenção),
título "Fila de análise" com contagem, ferramentas. Abas: Em análise
(8) · Concluídas (5). Toolbar: busca por nome ou inscrição, select de
curso, segmented de situação (Todas 8 · Aguardando envio 3 · Aguardando
análise 3 · Aguardando candidato 2), chips removíveis dos filtros
aplicados, contagem com `aria-live`.

Tabela compacta (ADR-046): Candidato (célula de pessoa: nome, inscrição
em `.ucam-id`), Curso, Período letivo, Solicitada em, Situação (selo),
Sugestão (selo por estado; coluna existe porque a análise automatizada
está ligada), ação "Abrir" como link da linha. Cabeçalho de grupo por
curso: Direito (5), Administração (3). Linha de quem está aguardando
envio traz telefone e e-mail no apoio da célula de pessoa, porque é o
que a coordenação faz com ela: ligar.

Aba Concluídas: mesma tabela sem a coluna Sugestão, com "Concluída em"
e o resultado (n de m isentas) no lugar de Sugestão; ação "Consultar".

Estado vazio de filtro: "Nenhuma solicitação com esses filtros", com
"Limpar filtros". Fluxos: Abrir → `analise` (a); Consultar →
`consulta` (a); filtros, abas, chips e limpar (c); Exportar CSV e
Imprimir (c, como no Protocolo); Matrizes e Cursos (b).

### 2. `analise` — Análise da solicitação (triagem-lista-detalhe)

Barra de visão: trilha (Fila de análise / João Cutrim), título "João
Cutrim" com o selo "Aguardando análise", apoio "Direito · 2026.1 ·
inscrição 2026-01187 · solicitada em 12/09/2026". Ações: "Salvar
rascunho" (secundário), "Finalizar análise" (primário). Situação de
rascunho vira "Em rascunho — salvo às 14h32" abaixo do título.

Coluna principal: seção "Disciplinas da matriz DIR20222", segmented de
período (1º · 2º · 3º), lista de disciplinas por período. Cada linha:
nome da disciplina, carga horária, a sugestão automatizada como selo
(Isentar / Revisar / Não isentar, com o motivo curto em apoio: "Ementa
compatível: 92%"), e a decisão como segmented de três posições
(Isentar · Não isentar · Pendente). Decisão tomada muda o selo da
linha. Rodapé da seção: "9 disciplinas · 4 isentas · 2 não isentas · 3
pendentes", com `aria-live`.

Painel de apoio: cartão "Solicitação" (lista de descrição: candidato,
inscrição, curso, período letivo, instituição de origem, matriz
curricular como select com DIR20222 e DIR20201); cartão "Documentos"
(anexos: Histórico escolar, Ementas, cada um com nome do arquivo em
`.ucam-id`, tamanho e "Baixar"); cartão "Sugestão automatizada"
("Analisada em 12/09 às 09h40 · 4 isentar, 2 revisar, 3 não isentar",
ação "Aplicar sugestões" que preenche as pendentes com isentar/não
isentar e deixa revisar como pendente, e diz quantas preencheu); cartão
"Observação ao candidato" (textarea com contador de 150, apoio "O
candidato lê esta observação na tela de acompanhamento", ação "Enviar
ao candidato" que muda a situação para Aguardando candidato).

Finalizar com pendentes: diálogo "Faltam 3 decisões" explicando que a
análise só fecha com todas as disciplinas decididas. Sem pendentes:
diálogo de confirmação "Finalizar análise de João Cutrim?" nomeando os
números; confirmar muda o selo para Concluída, desabilita as ações e
anuncia. Voltar é fantasma (ADR-029).

O cenário sem documentos não é variação desta tela: é a tela
`sem-documentos` (4), porque o estado muda o que a coordenação pode
fazer.

### 3. `consulta` — Solicitação concluída (triagem-lista-detalhe)

A mesma página de análise para Pedro Alves, concluída em 20/03/2026:
selo Concluída, nenhuma ação primária, decisões como selos fixos, a
observação enviada como texto, a linha do tempo da solicitação
(solicitada, documentos enviados, análise iniciada, observação
enviada, concluída) no painel de apoio. Ação secundária "Imprimir
parecer" (c) e "Reabrir análise" como fantasma com confirmação (c).

### 4. `sem-documentos` — Candidato sem documentos

A mesma página de análise para Ana Paula Rocha, aguardando envio há 16
dias: cartão de documentos em estado vazio ("Nenhum documento
enviado"), contato do candidato (telefone e e-mail) e a ação
"Notificar candidato" (c), que registra o aviso na linha do tempo e
anuncia. A lista de disciplinas aparece desabilitada, com o motivo
"Decisão só depois dos documentos" (ADR-042). Sem ação primária.

### 5. `acompanhamento` — Acompanhamento da isenção (candidato)

Portal Universitário, largura estreita, conta "João Cutrim". Trilha
(Meus sistemas / Isenção de disciplinas), título "Isenção de
disciplinas" com selo "Aguardando candidato", apoio "Direito · 2026.1
· solicitada em 12/09/2026". Alerta de aviso com a observação da
coordenação ("Aguardando complementação de ementas: as de Direito
Civil I e História do Direito não vieram.") e a ação "Enviar
documento", que abre o diálogo (descrição, arquivo PDF até 10 MB,
Enviar) e adiciona o anexo à lista com anúncio. Seção "Documentos
enviados" com os anexos. Seção "Disciplinas" com segmented de período
e lista: nome, situação (Isenta, Em análise, Aguardando documento com
motivo). Rodapé: "9 disciplinas · 2 isentas · 5 em análise · 2
aguardando documento".

### 6. `resultado` — Isenção concluída (candidato)

A mesma página para o caso concluído: selo Concluída, resumo "6 de 9
disciplinas isentas", lista por período com Isenta / Não isenta e o
motivo quando não isenta, "Baixar parecer" (c). Sem ação de envio.

## Números que fecham

- Fila: 8 em análise = 3 aguardando análise + 3 aguardando envio + 2
  aguardando candidato; 5 concluídas. Direito 5, Administração 3.
- João Cutrim, DIR20222: 9 disciplinas = 4 (1º) + 3 (2º) + 2 (3º).
  Sugestões: 4 isentar, 2 revisar, 3 não isentar. Na tela de análise, 4
  isentas, 2 não isentas, 3 pendentes. No acompanhamento (antes da
  conclusão): 2 isentas, 5 em análise, 2 aguardando documento.
- Pedro Alves (concluída): 6 de 9 isentas.

## Contratos e componentes

Só componentes com contrato: app-shell, page-header/viewbar, tabs,
segmented, chip, badge, data-table (célula de pessoa, densidade
compacta), button, link, select, text-field, textarea, file-field e
anexo, dialog, alert, description-list, timeline, empty-state, prazo,
avatar, icon, card. Regra de tela e componente no mesmo passo: se a
lista de disciplinas com decisão por segmented pedir classe nova, ela
entra na anatomia do componente que a carrega, no mesmo commit. O
contador do textarea e o estado desabilitado com motivo são conferidos
no contrato antes de usar.

## Provas

`pnpm run validate` e `pnpm run build` verdes; as sondas do repositório
sobre as seis telas: controles vivos (nenhum controle morto), feedback
(todo efeito chega por voz), alvos de 24/44, auditoria de pixel; captura
a 1440 e a 390 nos dois temas para revisão visual. Clone limpo antes de
subir, como em 24/09.

## Fora de escopo

O backend, a análise automatizada em si, a tela do Trilho B em Angular
(o campo `codigo` de cada tela traz o esboço, como nos outros
projetos), a reescrita do HTML de Downloads: as telas autônomas
`/t/isencao-*.html` do site são o que se compartilha.
