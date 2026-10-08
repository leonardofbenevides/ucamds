
# Leitura dos dois projetos (somente leitura, nada foi alterado)

Raízes:
- **A** = `C:\Users\Leonardo\Documents\Novo Vestibular\vestibular-online` (caminhos abaixo relativos a `A\src\app`, salvo indicação)
- **B** = `C:\Users\Leonardo\Documents\CENPRE\cenpre-ui-angular-scss`

Limites da leitura: em A li todo `src/app` (sem os `.spec.ts`), `README.md`, a spec de `docs/`, `tools/` (o `mock-backend.mjs` até a linha 330 por inteiro, o resto só pelas rotas). O plano `docs/superpowers/plans/2026-10-01-candidato-prova.md` (3.366 linhas) só pelos títulos. Em B não li os `.scss` de página (cerca de 4.000 linhas) nem `home.html` por inteiro, só a estrutura.

Dois achados que contrariam o enunciado:
- **B não tem formulário de cadastro de convênio, de currículo, de vagas nem de parceiro.** São páginas de conteúdo que mandam para a plataforma externa Symplicity. O único `<form>` do projeto é "Indicação", em Empresas Conveniadas, e ele não envia nada.
- **Em A o token da sessão da banca é guardado mas nunca enviado**: não há interceptor nem cabeçalho `Authorization` em nenhuma chamada.

---

# PROJETO A — vestibular-online (Angular 21, `@ucam/ui` 0.1.2)

## A.1 Rotas e telas

Arquivo: `A\src\app\app.routes.ts`. Router com `withComponentInputBinding` e `paramsInheritanceStrategy: 'always'` (`app.config.ts:14-16`). Todas as telas são lazy (`loadComponent`).

| URL | Componente | Arquivo | Guard |
|---|---|---|---|
| `/` | `SemLinkPage` | `candidato/sem-link/sem-link.ts` | nenhum |
| `/candidato/:oid` | `EntradaPage` | `candidato/entrada/entrada.ts` + `.html` | `candidatoGuard` (tela `entrada`) |
| `/candidato/:oid/instrucoes` | `InstrucoesPage` | `candidato/instrucoes/instrucoes.ts` + `.html` | `candidatoGuard` (`instrucoes`) |
| `/candidato/:oid/prova` | `ProvaPage` (pai) | `candidato/prova/prova.ts` + `.html` | `candidatoGuard` (`prova`) |
| `/candidato/:oid/prova` (filho vazio) | `ProvaInicio` | `candidato/prova/prova-inicio.ts` | herda |
| `/candidato/:oid/prova/redacao` | `RedacaoPage` | `candidato/prova/redacao/redacao.ts` + `.html` | herda |
| `/candidato/:oid/prova/:caderno/:n` | `QuestaoPage` | `candidato/prova/questao/questao.ts` + `.html` | herda |
| `/candidato/:oid/resultado` | `ResultadoPage` | `candidato/resultado/resultado.ts` + `.html` | `candidatoGuard` (`resultado`) |
| `/candidato/:oid/erro` | `ErroPage` | `candidato/erro/erro.ts` | nenhum |
| `/admin/login/:token/:usuario` | `EntrarBancaPage` | `banca/entrar.ts` | nenhum |
| `/admin` → `/banca`; `/admin/correcao/redacao` → `/banca/redacoes`; `/admin/cadastro` → `/banca/provas` | redirects | `app.routes.ts:57-59` | — |
| `/banca` → `/banca/redacoes` | redirect | `:64` | `bancaGuard` no pai |
| `/banca/redacoes` | `CorrecaoPage` | `banca/correcao/correcao.ts` + `.html` | `bancaGuard` |
| `/banca/isencao` | `FilaIsencaoPage` | `banca/isencao/fila.ts` + `.html` | `bancaGuard` |
| `/banca/isencao/:oid` | `AnaliseIsencaoPage` | `banca/isencao/analise.ts` + `.html` | `bancaGuard` |
| `/banca/provas` | `ProvasPage` | `banca/provas/provas.ts` + `.html` | `bancaGuard` |
| `/banca/provas/:caderno/questao/nova` e `/:questao` | `QuestaoFormPage` | `banca/provas/questao-form.ts` + `.html` | `bancaGuard` |
| `/isencao/:oid` | `AcompanhamentoIsencaoPage` | `isencao/acompanhamento.ts` + `.html` | nenhum ("sem guarda como lá", `:79`) |
| `/vestibularonline/:oid` → `/candidato/:oid` | redirect do link legado | `:82` | — |
| `**` → `/` | redirect | `:84` | — |

Telas, uma a uma:

| Tela | Propósito | Arquétipo | Peças |
|---|---|---|---|
| Sem link (`/`) | Quem chegou sem o link informa o código da inscrição ou cola o link; no protótipo traz atalhos de teste | entrada | marcação manual `.ucam-shell--sem-nav` + `.ucam-login*`; `ucam-field` com `.ucam-input-group` e `<input>` nativo; `ucam-button` lg; `ucam-list-item` (atalhos); `ucam-icon`; `ucam-icon-tile`; `app-tema-toggle`; `app-cena-prova` |
| Entrada | Candidato confere nome, CPF, curso e turno antes de seguir | entrada | mesma marcação `.ucam-login*`; `ucam-description-list` stacked; `ucam-alert` warning; `ucam-button` lg; `ucam-icon-tile`; `app-cena-prova` |
| Instruções | Mostra tempo, número de questões e redação, as três orientações e pede a confirmação para iniciar | passo a passo | `app-moldura` (app-shell); `ucam-page-header variante="barra"` com trilha; `ucam-stepper variant="bar"` (só abaixo de `lg`); `ucam-stat` ×3; `ucam-card` (grade `.ucam-grid`); `ucam-checkbox`; `ucam-alert`; `ucam-button` |
| Prova (casca) | Carrega cadernos e respostas, liga relógio e fila, hospeda questão/redação, mapa e entrega | prova/execução | `app-moldura`; `app-cabecalho-prova` (`.ucam-viewbar` + `ucam-progress`); `.ucam-split`; `app-mapa-questoes` na lateral ou em `ucam-drawer`; `ucam-skeleton`; `ucam-empty-state`; `ucam-alert`; `app-entrega-dialog` (`ucam-dialog`) |
| Questão | Uma questão objetiva: texto de apoio, enunciado, alternativas, marcar para revisar, anterior/próxima | prova/execução | `ucam-icon-tile`; `ucam-badge` dot; `<button class="ucam-btn ucam-btn--ghost" aria-pressed>`; `ucam-section-bar`; `ucam-citacao`; `<label class="ucam-choice-card">` com radio nativo; `ucam-button` lg; `[ucamTooltip]` |
| Redação | Proposta, texto de apoio e folha de texto simples com contador | prova/execução | `ucam-section-bar`; `ucam-citacao`; `ucam-textarea` (`rows` 22, `maxRows` 60, `autoGrow`, `maxLength`); `ucam-button` |
| Resultado | Diz que a prova foi entregue e, quando há correção, o desfecho e o próximo passo | resultado | `app-moldura`; `ucam-page-header`; `ucam-stepper` bar; `ucam-stat` ×3–4; `ucam-card`; `ucam-badge`; `ucam-alert`; `ucam-skeleton`; `ucam-button` |
| Erro | Inscrição não localizada, com "Tentar de novo" | erro | `ucam-empty-state reason="error"`; `ucam-button` |
| Entrar (banca) | Volta do login único: busca dados e abre a sessão | erro (estado de carga/erro) | `ucam-skeleton`; `ucam-empty-state`; `ucam-button` |
| Redações | Fila em espera/corrigidas com a redação aberta ao lado e a nota | correção (lista-detalhe) | `app-moldura-banca`; `ucam-page-header` com `ucam-tabs`, `ucam-chip`, botão Filtros; `ucam-drawer` com `ucam-select` ×2; classes `.ucam-inbox*`; `ucam-text-field` search; `ucam-list-item` selecionável com `ucam-badge`; `ucam-description-list`; `ucam-citacao`; `ucam-section-bar`; `ucam-alert`; `ucam-empty-state`; `ucam-skeleton` |
| Fila de isenção | Solicitações por candidato, curso, datas e situação | listagem | `app-moldura-banca`; `ucam-page-header` + `ucam-tabs`; `.ucam-toolbar` com `ucam-segmented`, `ucam-text-field`, `ucam-select`; `ucam-data-table` compact; `ucam-pagination` |
| Análise de isenção | Decide disciplina a disciplina, com solicitação, documentos e observação no painel | correção (detalhe com formulário) | `ucam-page-header` com `ucam-badge` e ações; `.ucam-split`; `ucam-card` por disciplina; `ucam-segmented allowEmpty`; `.ucam-form-row` com `ucam-text-field` ×3; `ucam-textarea`; `ucam-select`; `ucam-anexo`; `ucam-description-list`; `ucam-dialog confirm`; `ucam-alert`; `ucam-empty-state` |
| Provas | Cadernos de um processo/forma/captação e as questões de cada um | listagem | `ucam-page-header` + `ucam-chip` ×3 + Filtros; `ucam-drawer` com `ucam-select` ×3; `ucam-card` por caderno com `ucam-list-item`; `ucam-dialog destructive`; `ucam-empty-state`; `ucam-alert` |
| Questão (cadastro) | Cria ou edita uma questão em texto simples | formulário | `ucam-page-header` (página, `backLink`); `ucam-textarea` ×2; `.ucam-form-row` com `ucam-text-field` ×2; `ucam-dialog destructive`; `ucam-empty-state`; `ucam-skeleton` |
| Acompanhamento da isenção | Candidato vê a situação, o que foi pedido, os documentos e cada disciplina, e envia documento | detalhe | `app-moldura-isencao`; `<dl class="ucam-descricao">` na coluna; `ucam-page-header` + `ucam-badge`; `ucam-alert` com `ucamAlertAcoes`; `ucam-section-bar`; `ucam-anexo`; `ucam-data-table` com `ucamCelula`; `ucam-select`; `ucam-dialog` com `ucam-text-field` e `ucam-file-field` |

## A.2 Uso do design system

Instalação: `@ucam/ui`, `@ucam/css`, `@ucam/tokens` e `@ucam/ds-mcp` por tarball local `file:../ucamds/dist/pacotes/*-0.1.2.tgz` (`A\package.json:23-25,37`). `A\src\styles.css` importa `ucam-fonts.css`, `ucam.css`, Tailwind 4, `ucam-theme.css` e `@ucam/ui/styles.css`; `<body class="ucam">` (`A\src\index.html:11`).

### Componentes `<ucam-*>` (contagem nos templates `.html` e inline, sem specs)

| Componente | Usos | | Componente | Usos |
|---|---|---|---|---|
| `ucam-button` | 63 | | `ucam-list-item` | 5 |
| `ucam-alert` | 24 | | `ucam-drawer` | 5 |
| `ucam-empty-state` | 20 | | `ucam-dialog` | 5 |
| `ucam-icon` | 17 | | `ucam-description-list` | 5 |
| `ucam-skeleton` | 14 | | `ucam-citacao` | 4 |
| `ucam-card` | 12 | | `ucam-app-shell` | 3 |
| `ucam-badge` | 12 | | `ucam-tabs`, `ucam-stepper`, `ucam-segmented`, `ucam-progress`, `ucam-icon-button`, `ucam-data-table`, `ucam-anexo` | 2 cada |
| `ucam-text-field` | 9 | | `ucam-pagination`, `ucam-file-field`, `ucam-field`, `ucam-checkbox`, `ucam-avatar` | 1 cada |
| `ucam-select` | 9 | | | |
| `ucam-section-bar` | 9 | | | |
| `ucam-page-header` | 8 | | | |
| `ucam-stat` | 7 | | | |
| `ucam-icon-tile` | 7 | | | |
| `ucam-chip` | 6 | | | |
| `ucam-textarea` | 5 | | | |

A contagem bruta dava 64 `ucam-button` e 10 `ucam-text-field`; descontei uma menção em comentário de cada (`mapa-questoes.ts:44`, `sem-link.ts:71`).

Diretivas e slots: `ucamDialogAcoes` 7, `ucamShellAcoes` 4, `ucamShellNav` 3, `ucamShellNavRodape` 3, `ucamFerramentas` 3, `ucamFiltros` 2, `ucamAlertAcoes` 2, `ucamTabelaSemResultado` 1, `ucamCelula` 1, `[ucamTooltip]` 1. Funções: `nextFieldIds`, `describedBy` (`sem-link.ts:4`).

### Classes `.ucam-*` escritas à mão nos templates

- Layout: `ucam-stack` 72 (`--sm` 13, `--lg` 13), `ucam-cluster` 41 (`--entre` 13, `--fim` 11), `ucam-corpo` 9 (`--pleno` 1), `ucam-content` 7 (`--pleno` 2, `--estreita` 2), `ucam-split` 2, `ucam-aside` 2, `ucam-toolbar` 3, `ucam-form-row` 2, `ucam-grid` 1, `ucam-stats` 2.
- Acessibilidade e texto: `ucam-sr-only` 28, `ucam-section__hint` 7, `ucam-field__hint` 6, `ucam-link` 5, `ucam-section__title` 4, `ucam-page-header__title` 4, `ucam-lede` 2, `ucam-field__error` 1, `ucam-pagination__range` 3.
- Entrada: 15 classes `ucam-login*` (2 a 6 usos cada), `ucam-shell` 2, `ucam-shell--sem-nav` 2, `ucam-main` 2, `ucam-skip` 2; `ucam-login__cena` como classe de host (`layout/cena-prova.ts:155`).
- Botão nativo: `ucam-btn` 5, `ucam-btn--secondary` 4, `ucam-btn--sm` 2, `ucam-btn--ghost` 1.
- Lista de descrição: `ucam-descricao` 1, `__par` 3, `__rotulo` 4, `__valor` 4.
- Inbox: 8 classes `ucam-inbox*` (`__lista-topo` 2, as demais 1).
- Barra de visão: `ucam-viewbar`, `__fileira` 2, `__contagem`, `__folga`.
- Stepper: `ucam-stepper`, `__passo` (`--done`, `--current` por `[class.]`), `__marcador`, `__conector`, `__dica`.
- Outras: `ucam-choice-card`, `__figura`, `__titulo`; `ucam-input-group`, `__adorno`, `__controle`; `ucam-field--lg`; `ucam-campus` 2, `ucam-campus--faixa` 2; `ucam-appbar__divider` 1; `ucam-list` 3; `ucam-anexos` 2.
- Tailwind junto: `hidden` 5, `lg:hidden` 3, `sm:contents` 2, `md:contents`, `md:block`, `lg:block`, `flex-1` 2, `w-full`, `truncate`, `min-w-0`, `shrink-0`, `flex items-start gap-3`, `border-t border-[var(--ucam-color-border-subtle)]`.

### O que foi escrito à mão por faltar no design system

Cada item: o que é, o que faz, por que parece ter sido necessário (o motivo entre aspas vem de comentário do código; "inferido" é leitura minha).

1. **`EtapasLateral`** (`layout/etapas-lateral.ts` + `.html`, cerca de 75 linhas de CSS). Stepper vertical na coluna do shell: número, check nas concluídas, fio de ligação, dica sob o rótulo ("3 de 5 respondidas", "Rascunho"), contador "2 de 5". Etapa concluída abre gaveta, etapa atual é link, etapa futura é texto. Motivo: "O arranjo vertical ainda não existe no DS: as peças são as do `.ucam-stepper`, e só a direção é daqui" (`:35-36`). Faltam também, por inferência: passo clicável que abre gaveta, dica por passo e `aria-current="page"` separado de `"step"`.
2. **`MapaQuestoes`** (`candidato/prova/mapa-questoes.ts`, cerca de 150 linhas de CSS). Cartão-resposta em miniatura: grade de colunas fixas de bolhas numeradas, estados em branco, respondida, atual (anel interno) e marcada para revisar (ponto no canto); item largo para a redação; legenda; atalho "Próxima em branco" / "Próxima marcada". Não há peça equivalente no DS. Usa `<button class="ucam-btn">` nativo porque "o host do `<ucam-button>` é inline e não estica na coluna; o estilo deste componente não alcança o botão lá dentro" (`:44-46`). A marca é um `<span>` porque "o DS já ocupa o `::after` do botão" (`:239`).
3. **`CabecalhoProva`** (`candidato/prova/cabecalho-prova.ts`). Barra fixa com título e contagem, indicador de salvamento (Salvando… / Sem conexão / erro / Salvo), `ucam-progress` do tempo e região `aria-live`. Montada com as classes `.ucam-viewbar*` direto: não há componente de barra de visão nem de estado de salvamento (inferido). `<div class="w-full">` em volta do `ucam-progress`.
4. **`RelogioFaixa`** (`layout/relogio-faixa.ts`). Relógio hh:mm:ss na faixa, como `ucam-icon` + `ucam-badge` soft cujo tom segue o relógio. Não há componente de contagem regressiva (inferido).
5. **`Moldura`** (`layout/moldura.ts`). Envolve o `ucam-app-shell` para o candidato: relógio, campus, etapas, cartão do candidato, rodapé e duas gavetas. Contornos dentro dela:
   - `<div class="hidden sm:contents">` e `md:contents`: "Os div sem classe do DS existem para o Tailwind decidir o display" (`:38-39`).
   - Campus na faixa com `.ucam-campus.ucam-campus--faixa` e `.ucam-appbar__divider` crus.
   - `:host ::ng-deep [data-dados-candidato] .ucam-descricao--painel { --ucam-descricao-rotulo: 5rem }` porque "o DS a declara no próprio dl (8.5rem) … nem a herança nem uma utilitária em camada chegam lá" (`:112-119`).
   - Divisor manual `border-t border-[var(--ucam-color-border-subtle)]` dentro do cartão.
   - Ícone `clock` no turno por falta de ícone de turno (`:136-137`); o README registra como "desvio a decidir".
6. **`MolduraBanca`** (`banca/moldura-banca.ts`) e **`MolduraIsencao`** (`isencao/moldura-isencao.ts`). Wrappers do `ucam-app-shell` com `navGroups`, unidade na faixa e "Sair" + tema no rodapé. A de isenção reprojeta conteúdo com `ngProjectAs="[ucamShellNav]"`.
7. **`LinksInternos`** (diretiva, `layout/links-internos.ts`, usada como `hostDirectives`). Intercepta cliques em `<a href="/...">` e chama o router. Motivo: os links que o shell desenha "são `<a href>` comuns: clicados, recarregavam o app inteiro a cada troca de tela" (`:5-6`).
8. **`TemaToggle`** (`layout/tema-toggle.ts`) e serviço **`Tema`** (`core/tema.ts`). Alternância claro/escuro por `data-theme` no `<html>` e `localStorage['tema']`. O app escreveu serviço e botão próprios; não usa nada do DS para isso.
9. **`CenaProva`** (`layout/cena-prova.ts`). Ilustração isométrica SVG calculada (e-mail, prova, relógio, cadernos, redação, pessoa). "Só a geometria é daqui. Projeção, nomes de classe e pintura são do DS (`.ucam-login__cena`)" (`:10-12`). É cópia adaptada de `ucamds/site/src/app/pages/index.page.ts`, ou seja, a cena não é componente reutilizável.
10. **Telas de entrada** (`entrada.html`, template de `sem-link.ts`). O bloco de login (`.ucam-shell--sem-nav` > `.ucam-main` > `.ucam-content--pleno` > `.ucam-login` com cerca de 15 subclasses) é escrito à mão duas vezes. Não há componente `<ucam-login>` no Trilho B (inferido).
11. **Campo lg com adorno** (`sem-link.ts:66-98`). `<ucam-field class="ucam-field--lg">` + `.ucam-input-group` + `<input>` nativo, com ids por `nextFieldIds` e `aria-describedby` por `describedBy`. Motivo: "O degrau lg do campo é a variante `ucam-field--lg`, que dimensiona o grupo do Trilho A; o `<ucam-text-field>` não tem esse degrau".
12. **Alternativa da questão** (`questao.html:37-44`, `questao.ts:28-52`). `<label class="ucam-choice-card">` com radio nativo em vez de componente, mais CSS: `align-items: center`, `padding-inline-end` reposto, letra preenchida quando marcada e animação `app-marcar`. Desvio declarado: "A escolhida não leva check … check ao lado da alternativa lê como 'certa'"; o segundo sinal é a letra preenchida ("desvio declarado da ADR-046", também no README). O título recebe `[innerHTML]`.
13. **Botão de alternância "Marcar para revisar"** (`questao.html:20`, CSS em `questao.ts:58-78`). `<button class="ucam-btn ucam-btn--ghost" aria-pressed>` com `::before` de ponto e fundo quando pressionado. Não há toggle button no DS (inferido). "Sem ícone: o conjunto curado não tem bandeira, e star e pin têm outro uso no contrato" (`questao.html:17-19`).
14. **Tooltip em botão desabilitado** (`questao.html:49-54`). `<span [ucamTooltip]>` em volta do `ucam-button` desabilitado, mais um `ucam-sr-only` repetindo o motivo.
15. **`InstrucoesLista`** (`candidato/instrucoes/instrucoes-lista.ts`). As três orientações como cartões ou como lista. Dois contornos comentados: o texto vai como conteúdo porque "o apoio do cartão é de uma linha e cortava a frase com reticências" (`:34-35`); e `flex items-start gap-3` do Tailwind porque "o `.ucam-cluster` embrulha quando a frase é longa e o ícone subia" (`:47-48`).
16. **Redação** (`redacao.html`, `redacao.ts`). `<div (focusout)>` em volta do `ucam-textarea` para saber quando a pessoa saiu do campo (falta de evento de blur no componente: não confirmado). `<p class="ucam-field__hint" aria-live>` separado para "Faltam N caracteres". O contador vai dentro do `hint`, porque conta caracteres não brancos.
17. **Envio de arquivo** (`isencao/acompanhamento.html:127-130`). Erro do arquivo em `<p class="ucam-field__error" role="alert">` manual abaixo do `ucam-file-field` (ausência de `errorMessage` no componente: não confirmado). Lista de anexos com `<div class="ucam-anexos" role="list">` e `<div role="listitem">` em volta de cada `ucam-anexo`.
18. **Lista-detalhe da correção** (`correcao.html:35-183`). O arranjo é feito com as classes `.ucam-inbox*` e `data-painel`; não há componente de inbox. "Mostrar mais" com contagem é rodapé manual.
19. **Coluna do acompanhamento** (`acompanhamento.html:4-19`). `<dl class="ucam-descricao">` manual em vez de `ucam-description-list`. Motivo não comentado.
20. **Linha de contagem.** `<p class="ucam-pagination__range" role="status">` usado três vezes como total sem paginação (`fila.html:43`, `analise.html:147`, `acompanhamento.html:108`).
21. **Stepper em barra + "Etapa 2 de 4".** O texto é um `ucam-field__hint` manual sob o `ucam-stepper variant="bar"` (`instrucoes.html:11-12`, `resultado.html:10-11`).
22. **`ProvaProtegida`** (diretiva, `core/directives/prova-protegida.ts`). `preventDefault` em `copy`, `cut`, `paste` e `contextmenu`. É regra de produto, não lacuna visual.
23. **`A\src\styles.css`**, quatro blocos próprios:
   - `html { font-size: 112.5% }`: o DS mede telas de trabalho (14px, controle de 32px) e o candidato precisa de mais (`:16-26`).
   - `--ucam-appbar-logo: url("/assets/logo-ucam.svg")` em `.ucam-shell` e `.ucam-login` (`:28-33`).
   - Keyframes `app-entrar-frente` / `app-entrar-tras` e `[data-entrada]` para a troca de questão, usando tokens de motion (`:35-58`).
   - `zoom` de 1.125, 1.25 e 1.5 no `.ucam-login` a partir de 100rem, 120rem e 150rem (com altura mínima), porque o bloco "foi medido em 1440" (`:60-76`).
24. **`tools/ds-checar.mjs` + `tools/lib/primarios.mjs`.** Auditor próprio em volta do `@ucam/ds-mcp`: expande glob (no Windows o npm não expande), extrai templates inline dos `.ts` e reconta a ADR-023. Motivo: "o núcleo do `@ucam/ds-mcp` soma todos os primários do texto e acusava cinco no resultado, onde nunca aparece mais de um". `DESVIOS = []` (vazia).
25. **Foco programático.** `:host h2:focus:not(:focus-visible) { outline: none }` (`questao.ts:55`) e o mesmo para `article` (`redacao.ts:25`).

Outras anotações:
- Regra recorrente: wrapper `<div>` sem classe em volta de bloco `.ucam-*` para aplicar `lg:hidden` / `hidden lg:block`, porque "o CSS do DS não tem camada e venceria `lg:hidden` num `.ucam-cluster`" (`prova.html:31-32`).
- `ucamDialogAcoes`: "o bloco tem de ter uma raiz só para ser projetado" (`analise.html:213-214`).
- Nomes de entrada misturam idiomas: `variante="barra"` no page-header, `titulo/apoio/icone` no card, `title/label/variant` nos demais.
- O README (linhas 64-67) lista contornos já removidos por correção na fonte (0.1.1 e 0.1.2): tinta da faixa no escuro, barra de visão sob a faixa, NG0952 das abas, rodapé e foco do diálogo, `rows` do textarea, `File` no `ucam-file-field`, `allowEmpty` do segmentado, desabilitado sem `opacity-50`, `data-sistema` no overlay do CDK.
- Em `package.json` há `echarts`, `ngx-echarts`, `@angular/cdk`, `@ng-icons/*` e `tailwindcss-animate`; nenhum é importado em `src/app` (provavelmente dependências do `@ucam/ui`: não confirmado).

## A.3 Regras de negócio lidas no código

### Entrada do candidato e guard

1. **Link é a identidade.** A URL é `/candidato/:oid`, onde `oid` é o oid da forma de ingresso da pessoa; não há senha. O link legado `/vestibularonline/:oid` redireciona preservando `?tentativa`. `app.routes.ts:7,82`. Tipo: permissão.
2. **Código ou link colado.** O campo aceita URL inteira, trecho final ou formato novo: pega o segmento depois de `vestibularonline` ou `candidato`, senão o último segmento, e lê `tentativa` da query. `candidato/sem-link/sem-link.ts:17-38`. Formato.
3. **Campo vazio não desabilita o botão.** Mensagem: "Falta o código da inscrição. Cole o código ou o link que veio no e-mail." `sem-link.ts:196-199`. Validação.
4. **Registro da tentativa na entrada.** `tentativa` padrão `'1'`. O guard faz `POST candidatoprova?oidformaingressopessoa&tentativa`; se falhar, `GET findbyformaingressopessoa`; se vier nulo, `POST` sem tentativa. Se lançar, grava "Não conseguimos localizar sua inscrição." e vai para `/candidato/:oid/erro`. `core/guards/candidato.guard.ts:24-34`. Transição.
5. **Tela permitida por situação.** `CADASTRADO` → entrada, instruções; `PROVA_INICIADA` → só prova; `PROVA_FINALIZADA` e `PROVA_CORRIGIDA` → entrada, resultado. Tela não permitida redireciona para o padrão (entrada / prova / resultado / resultado). `core/guards/destino-por-situacao.ts:5-16,28-29`. Permissão.
6. **Aprovado sai do app.** `PROVA_CORRIGIDA` com inscrição `APROVADO` ou `MATRICULADO` vai para `formUrl + '/' + cpf` (`https://www.candidomendes.edu.br/processo-seletivo/area-do-inscrito/<cpf>`). `destino-por-situacao.ts:25-27`, `candidato.guard.ts:43-46`, `core/store/candidato.store.ts:85`. Transição.
7. **Tentativas.** Pode tentar de novo se `tentativaAtual < totalTentativasPossiveis`. `candidato.store.ts:67-70`. Limite; o total vem do backend (3 no mock, `A\tools\mock-backend.mjs:25`).
8. **Sem tentativas é aviso, não bloqueio.** Com `PROVA_CORRIGIDA` e sem tentativa: "Você já usou as {N} tentativas desta inscrição." O botão continua. `candidato/entrada/entrada.ts:29-33`, `entrada.html:20`.
9. **Rótulo da entrada.** "Ver resultado" se finalizada ou corrigida, senão "Entrar na prova" (segue para instruções). `entrada.ts:26-27,35-38`.
10. **Formatos de exibição.** CPF `000.000.000-00` com zeros à esquerda até 11 dígitos; turno `MANHA/M`→Manhã, `TARDE/T`→Tarde, `NOITE`→Noite, `N/NOTURNO`→Noturno, `DIURNO`→Diurno; curso em caixa de frase. `candidato.store.ts:7-32`. Formato.
11. **Tipo de unidade.** oid começando com `polo` ou `hibri`, ou igual a `unid32`, é EAD; `semi` é SEMIPRESENCIAL; o resto é PRESENCIAL. `candidato.store.ts:72-77`. Cálculo; não vi consumo em tela.
12. **Site de destino.** Se `unidRef === 'unid32'`, `https://ead.candidomendes.edu.br/`; senão `https://eupossoestudarnacandido.com.br/` + slug da sigla (minúsculas, sem acento, espaços viram hífen). `candidato.store.ts:34-40,79-83`.

### Instruções

13. **Duração da prova.** `GET candidato/{oid}/tempo-maximo-prova` devolve `HH:MM:SS`. Formato inválido ou falha: 2 horas (`duracaoPadraoMs`). `candidato/instrucoes/instrucoes.ts:27,55-60`, `core/tempo/relogio-prova.ts:6-10`, `A\src\environments\environment.ts:12`. Prazo.
14. **Confirmação obrigatória.** Sem marcar "Li as orientações e estou pronto para começar": "Marque a confirmação para começar a prova." `instrucoes.ts:71-74`, `instrucoes.html:33-36`. Validação.
15. **Iniciar.** `POST candidatoprova/{oid}/iniciarprova` e navega para a prova. Aviso: "Ao clicar, o tempo de {X} começa a contar e não para." Erro: "Não conseguimos iniciar a prova. Tente de novo." `instrucoes.ts:79-83`, `instrucoes.html:44`. Transição.
16. **Resumo.** Questões objetivas = soma dos cadernos que não são redação; redação Sim/Não com "Mínimo de 300 caracteres". `instrucoes.ts:43-46`, `instrucoes.html:19-21`.

### Prova: tempo e relógio

17. **Restante.** `max(0, início + total − agora)`, recalculado a cada 1 s a partir do `horarioinicio` do servidor (ou do momento atual, se ausente). Nunca decrementa contador. `relogio-prova.ts:12-14,83`, `candidato/prova/prova.ts:68-75`. Cálculo.
18. **Tom.** `danger` com ≤ 10 min; `warning` com ≤ 1/3 do total; senão `neutral`. `relogio-prova.ts:4,16-20`.
19. **Texto.** "Faltam 42 min", "Falta 1 h 5 min", "Faltam 50 s", "Tempo esgotado"; `hh:mm:ss` ao lado. `relogio-prova.ts:23-50`. Formato.
20. **Anúncios para leitor de tela.** Só na troca de tom ("Atenção: …", "Atenção: faltam menos de 10 minutos. …") e uma vez com ≤ 60 s: "Falta 1 minuto. A prova será entregue automaticamente no fim do tempo." `candidato/prova/cabecalho-prova.ts:72-84`.
21. **Tempo esgotado entrega sozinho.** Diálogo "Tempo esgotado" ("O tempo acabou. Estamos entregando sua prova com as respostas que você já deu."), não dispensável. Entrega mesmo sem o mínimo da redação e mesmo com respostas pendentes. Em erro mostra "Tentar de novo". `prova.ts:63-65`, `candidato/prova/entrega-dialog.ts:30,35-36,73-76,105-108,127,134`. Prazo e transição.

### Prova: navegação

22. **Sequência.** Cadernos objetivos na ordem do backend, questões na ordem do caderno. Depois da última: redação, se houver; senão entrega. `core/store/prova.store.ts:163-183`.
23. **Rótulo do avançar.** "Próxima" / "Ir para a redação" / "Entregar prova". "Anterior" desabilitado na primeira, com tooltip "Esta é a primeira questão". `candidato/prova/questao/questao.ts:99-104,154-165`, `questao.html:49-55`.
24. **`/prova` sem questão.** Primeira em branco; todas respondidas, primeira da prova; sem objetivas, redação. `candidato/prova/prova-inicio.ts:13-18`, `prova.store.ts:207-210`.
25. **Segmento de URL e rótulo do caderno.** `tipoprova` contendo `portugues`, `matematica`, `conhecimentos_gerais` ou `redacao` vira slug com hífen e rótulo "Português", "Matemática", "Conhecimentos gerais", "Redação". Desconhecido usa o próprio tipo. Redação é o que casa `/redacao/i`. `core/model/prova.ts:25-65`. Formato.
26. **Letras das alternativas.** A a G pela posição. `questao.ts:22,98`. Limite: 7.
27. **Marcar para revisar.** Anotação local em `localStorage['revisar:<oidCandidatoProva>']`; o backend não tem campo; some na entrega; trocar de aparelho perde. `prova.store.ts:77-82,228-263`.
28. **Atalhos do mapa.** "Próxima em branco" enquanto há em branco; com tudo respondido e alguma marcada, "Próxima marcada". Busca circular a partir da atual. `candidato/prova/mapa-questoes.ts:47-59`, `prova.store.ts:213-226`.
29. **Estado da redação no mapa.** `em branco` (0 caracteres), `rascunho`, `mínimo atingido`; a bolha só fica cheia ao atingir o mínimo. `prova.store.ts:98-100`, `mapa-questoes.ts:269`.
30. **Proteção.** Copiar, recortar, colar e menu de contexto bloqueados só no artigo da questão e da redação. Nada global, nada de teclas. `core/directives/prova-protegida.ts:4-16`.

### Prova: salvamento e offline

31. **Resposta grava na hora.** `POST candidatoprova/{oid}/responderquestao` com `{oidQuestao, oidAlternativa, respostaTextual: null}`. Depois de entregue nada grava. `prova.store.ts:265-269`.
32. **Rede × servidor.** Erro sem status HTTP (0) entra na fila `localStorage['fila:<oidCp>']`, uma entrada por questão (a última escolha substitui). Status > 0 não entra na fila e gera "O servidor não aceitou a resposta da questão {oidQuestao}. Escolha a alternativa de novo." (a mensagem mostra o oid cru). `core/offline/fila-respostas.ts:63-84,113-116`. Validação.
33. **Reenvio.** No evento `online`, a cada 30 s se houver pendente e nada salvando, e antes de entregar. Envios da mesma questão são serializados. `fila-respostas.ts:12,56-61,95-100`, `prova.ts:53-56`. Prazo.
34. **Indicador de salvamento.** Prioridade `salvando` > `pendente` > `erro` > `salvo`. Textos: "Salvando…", "Sem conexão. {n} resposta será enviada / respostas serão enviadas quando ela voltar.", a mensagem do erro, "Salvo". `fila-respostas.ts:30-32`, `cabecalho-prova.ts:22-37`.
35. **Carga inicial.** Uma consulta `find-resposta-por-questao` por questão, em paralelo; pendentes da fila local prevalecem sobre o servidor. `prova.store.ts:129-146`.
36. **Estados da prova.** Sem cadernos: "Esta prova ainda não tem caderno cadastrado" + contato. Erro: "Não conseguimos carregar a prova. Confira sua conexão e tente de novo." `prova.html:13-27`.

### Redação

37. **Limites.** Mínimo 300 caracteres não brancos (`/\S/g`); máximo 3000. `environment.ts:13-14`, `prova.store.ts:21-23,96`, `redacao.html:30-32`. O `maxLength` do campo conta todos os caracteres; o contador e o mínimo contam só os não brancos.
38. **Textos.** Dica "Mínimo de 300 caracteres, sem contar espaços. {n} de 3.000 caracteres"; "Faltam {n} caracteres para o mínimo." / "Mínimo atingido. Você pode continuar escrevendo até 3.000 caracteres." `redacao.html:32-40`.
39. **Salvamento.** A cada 30 s se mudou, ao sair do campo e ao sair da tela; espelho em `localStorage['rascunho:<oidCp>']` como `{texto, em}`. O rascunho local só é restaurado se o servidor não tiver texto. `candidato/prova/redacao/redacao.ts:11,65-92`, `prova.store.ts:279-283`.
40. **Formato gravado.** Texto simples vira `<p>` escapado, com `<br>` nas quebras simples; HTML antigo vira texto ao ler. `prova.store.ts:25-58`.
41. **Entregar pela redação.** Botão desabilitado abaixo do mínimo, com "A redação precisa de pelo menos 300 caracteres para ser entregue." `redacao.html:50-53`.

### Entrega e saída da tela

42. **Diálogo "Entregar a prova?".** "Depois de entregar você não poderá alterar as respostas."; "{n} questão está / questões estão em branco: …" e "… marcada(s) para revisar: …", até 10 nomes ("Português 3") e depois "…". Aviso "A redação ainda não tem o mínimo de 300 caracteres." `entrega-dialog.ts:11-13,38-53,96`.
43. **Sem o mínimo da redação não entrega pelo botão.** O primário vira "Ir para a redação". `entrega-dialog.ts:65-71,127`. Validação.
44. **Nunca entrega com pendência (modo manual).** Antes descarrega a redação e reenvia a fila; se sobrar: "{n} respostas não foram enviadas por falta de conexão. Confira a rede e tente de novo." `entrega-dialog.ts:132-137`.
45. **Entrega.** `POST candidatoprova/{oid}/finalizarprova`. Falha: "Não conseguimos registrar a entrega. Confira a conexão e tente de novo." `entrega-dialog.ts:138-141`.
46. **"Revisar".** Vai à primeira em branco; sem em branco, à primeira marcada. `entrega-dialog.ts:112-117`.
47. **Depois de entregue.** Trava gravação, para relógio e reenvio, limpa fila, marcas e rascunho, e vai ao resultado. `prova.ts:88-102`.
48. **Saída da tela.** Não há `beforeunload`, `visibilitychange`, `canDeactivate` nem detecção de troca de aba. Sair não avisa nem penaliza; ao voltar, o guard devolve à prova e o relógio segue pelo horário do servidor.

### Resultado

49. **Desfecho.** Só com `PROVA_CORRIGIDA`: aprovado se a inscrição é `APROVADO` ou `MATRICULADO`, senão reprovado. `candidato/resultado/resultado.ts:20-23`.
50. **Sem redação: correção na hora.** `POST corrigir-prova-objetiva` devolve texto; `'APROVADO'` (com trim e maiúsculas) aprova, qualquer outra coisa reprova. `resultado.ts:91-94`.
51. **Com redação: espera a banca.** Cartão "Aguardando a correção da banca", selo "Em correção"; "Ver se já saiu" refaz a consulta e informa "A banca ainda não terminou a correção. Última consulta às {hh:mm}." `resultado.ts:103-121`, `resultado.html:36-50`.
52. **Aprovado.** "Você foi aprovado" + "Concluir matrícula" (área do inscrito). `resultado.html:51-59`.
53. **Reprovado com tentativa.** "Nota mínima não atingida", selo neutro "Reprovado nesta tentativa", "Tentar novamente" navega com `?tentativa = tentativaAtual + 1`. `resultado.ts:131-134`, `resultado.html:60-69`.
54. **Reprovado sem tentativa.** "Você já usou as {N} tentativas desta inscrição." + contato + "Ir para o site". `resultado.html:70-79`.
55. **Dados da prova.** "Entregue em" e hora vêm de `horariofim`; "Tempo usado" = `horariofim − horarioinicio`; "Questões respondidas" só aparece na sessão em que a prova foi feita. `resultado.ts:61-64,80-85`. Título "Prova entregue" enquanto não há desfecho, depois "Resultado" (`:53`).

### Banca: sessão e guard

56. **Área interna exige sessão.** Sessão em `localStorage['sessao-banca']`, válida se tiver `token` e `usuario.oid`. Sem sessão vai para `loginUrl` (produção: `https://login.ucam-campos.br/login.jsf?client_id=aplicVestOnline@ucam`) ou, no protótipo, para `/`. `banca/banca.guard.ts:17-24`, `banca/sessao.ts:23-32`. Permissão.
57. **Sem papéis.** Quem tem sessão vê redações, isenção e provas. `sessao.ts:37-38`.
58. **Volta do login.** `/admin/login/:token/:usuario` faz três GET no gerencial com cabeçalho `Unidade-Ref` (`/usuario/{oid}`, `/unidadeUsuario/search/usuario?oidusuario&size=1000`, `/usuario/{oid}/pessoa`); a unidade de trabalho é a primeira; navega com `replaceUrl`. Erro: "Não foi possível abrir sua sessão". `banca/entrar.ts:58-66`, `sessao.ts:83-104`.
59. **Mudança em relação ao legado.** A correção de redação passa a pedir sessão (no legado o guard está comentado). `banca.guard.ts:13-15`; o README pede decisão antes de produção.
60. **Sair.** Apaga a sessão e manda para `loginUrl` ou `/`. `banca/moldura-banca.ts:73-77`.

### Banca: correção de redação

61. **Escopo obrigatório.** Período de ingresso + forma de ingresso; padrão é o primeiro de cada (períodos ordenados do mais recente). No EAD (`unidRef === 'unid32'`) `todasUnidades=true`. `banca/banca.api.ts:65-115`, `banca/correcao/correcao.ts:183-197`.
62. **Paginação e busca.** 20 por página, "Mostrar mais" acumula; busca por nome ou CPF com espera de 300 ms. `correcao.ts:33-34,164-168,233-249`. Limite.
63. **Escala da nota.** 0 a 10, de meio em meio ponto, com vírgula ou ponto (`^\d{1,2}(\.\d)?$` e `n*2` inteiro); campo com `maxLength` 4. `banca/nota.ts:7-12`, `correcao.html:163`. Validação.
64. **Mensagens da nota.** "Falta a nota. Informe um valor de 0 a 10, de meio em meio ponto." / "Nota fora da escala. Use um valor de 0 a 10, de meio em meio ponto: 7 ou 7,5." / "A nota não foi gravada. Confira sua conexão e tente de novo." `correcao.ts:324-328`, `correcao.html:155`.
65. **Gravar.** `POST candidatoprova/{oid}/notaredacao {nota}`; recarrega as filas e abre a seguinte da espera (`i+1`, senão `i−1`). Anuncia "Nota X gravada para Fulano. Aberta a redação de …". `correcao.ts:335-355`.
66. **Regravar é permitido.** Em corrigida o botão vira "Gravar nova nota". `correcao.html:169`.
67. **Redação vazia.** "O candidato entregou a prova sem escrever a redação." `correcao.html:147`.
68. **Tempo relativo.** "hoje", "ontem", "há N dias". `correcao.ts:37-42`.
69. **Link direto.** `?redacao=<oid>` abre a redação; se ela está só nas corrigidas, a aba muda uma vez. `correcao.ts:115-128,214-220`.

### Banca: cadastro de provas

70. **Escopo.** Processo seletivo (rótulo `ano/semestre`) + forma de ingresso + captação, os três obrigatórios; padrão é o primeiro de cada. `banca/provas/provas.store.ts:46-48`, `banca/provas/provas.api.ts:53-78`.
71. **Só se cria caderno de redação**, e só quando o escopo tem vigência e nenhum caderno. `banca/provas/provas.ts:72-73,121`. Sem vigência: "Esta combinação não tem prova online". `provas.html:72-81`. Permissão.
72. **Caderno sem questão.** "Este caderno ainda não tem questão. Sem ela, o candidato não recebe a redação." `provas.html:64`.
73. **Excluir caderno.** Confirmação destrutiva: as questões são excluídas junto, quem não fez a prova deixa de receber, "Esta ação não pode ser desfeita." `provas.html:87-107`.
74. **Questão.** Enunciado obrigatório ("Falta o enunciado. Escreva o que o candidato deve fazer."); pontuação de 0 a 10 de meio em meio ponto, padrão `10` ("Pontuação fora da escala. …"); ordem inteira de 0 a 999 (`^\d{1,3}$`), padrão `maior ordem + 1` ("Ordem inválida. Use um número inteiro: 1 para a primeira questão do caderno."); texto de apoio opcional. `banca/provas/questao-form.ts:13-16,58-59,85,96-101`. Edição grava `PUT questao/` com `status: 'A'` (`provas.api.ts:113-115`).
75. **Texto simples.** Negrito, lista e imagem de questão antiga se perdem ao regravar. `questao-form.ts:23-26`.
76. **Sem alternativas nem gabarito.** `CamposQuestao` só tem `textoreferencia`, `descricao`, `pontuacao` e `ordem` (`provas.api.ts:33-38`); "Adicionar questão" aparece em qualquer caderno.

### Isenção de disciplinas

77. **Situação da solicitação.** `CONCLUIDO` → Concluída; `ANALISADO_COM_PENDENCIA` → Aguardando candidato ("Aguardando você"); `PENDENTE_ANALISE` com documentos → Aguardando análise ("Em análise"); sem documentos → Aguardando envio ("Aguardando seus documentos"). `isencao/isencao.model.ts:86-100`. Transição.
78. **Decisão por disciplina.** `ACEITO` → Isenta; `RECUSADO` → Não isenta; `PENDENTE` com motivo → Aguardando documento; `PENDENTE` com motivo nulo → Sem decisão (o candidato lê "Em análise"). `isencao.model.ts:105-124`, `banca/isencao/analise.ts:284-294`.
79. **Só se decide com documento.** Sem documento a tela mostra "Nenhum documento enviado" e o contato. Editável só se carregada, não concluída e com documentos. `analise.ts:136-138,219-224`. Permissão.
80. **Matriz antes de decidir.** Pré-selecionada se já gravada ou se for a única; trocar descarta decisões não salvas. `analise.ts:229-231`, `analise.html:158-166`.
81. **Campos por decisão.** Isentar exige disciplina de origem, instituição e carga horária (150 caracteres cada). Pedir documento exige o texto do pedido (300). Observação ao candidato: 150. `analise.ts:43-44,339-357`, `analise.html:99,109,120,134,192`. Mensagens: "Falta a disciplina de origem. Escreva o nome como está no histórico." / "Falta a instituição de origem." / "Falta a carga horária cursada." / "Falta dizer o que o candidato deve enviar."
82. **Fechamento barrado por disciplina sem decisão.** Diálogo "Falta 1 decisão" / "Faltam N decisões". É mais rígido que o legado. `analise.ts:72-73,359-370`.
83. **Dois fechamentos.** Com pedido de documento: "Enviar pedido ao candidato". Sem: "Finalizar análise" ("Concluída, a análise não pode mais ser alterada por esta tela."). Os dois fazem `POST isencao/{oid}/evaluate`; quem decide o status é o backend. `analise.ts:191,378-393,416-431`.
84. **Rascunho.** `POST evaluate?partial=true` salva sem fechar; "Rascunho salvo às hh:mm". `analise.ts:321-336`.
85. **Fila.** Escopo `{oidUnidade da sessão ou unidRef}/{oidPessoa ou 'sem-login'}`; 10 por página; filtros de situação, curso e nome; ordem por data de solicitação decrescente; nas concluídas a situação é fixa. `isencao/isencao.api.ts:70-73`, `banca/isencao/fila.ts:25,74-83`, `banca/isencao/isencao.store.ts:24,47`.
86. **Candidato envia documento até a conclusão.** Descrição e arquivo obrigatórios ("Falta a descrição. Diga o que é o arquivo: histórico, ementas, declaração." / "Falta o arquivo. Escolha o documento que vai enviar."); `accept=".pdf,.png,.jpg"`; `POST isencao/{oid}/upload` multipart (`file`, `descricao`). `isencao/acompanhamento.ts:92,176-197`, `acompanhamento.html:127`.
87. **Acompanhamento sem autenticação.** A rota não tem guard e o download é um `GET` sem cabeçalho. `app.routes.ts:79-80`, `isencao.api.ts:32-35`.

Suposições que só existem no mock (`A\tools\mock-backend.mjs`): 3 tentativas (`:25`); aprova quem acerta metade ou mais das objetivas (`:327-330`) e tira 5 ou mais na redação (`:23,272`); duração padrão `00:20:00` (`:16`); `finalizar` da isenção vira `ANALISADO_COM_PENDENCIA` se houver pendência com motivo.

## A.4 API e dados

Bases: `backend` (`http://localhost:8030/`), `backendApi` (`…/vestibularonline/`), `apiGerencial` (`…/gerencial`). Em produção os marcadores `DEPLOY_PROCESSO_BACKEND` e `UNIDADE_REFERENCIA` são trocados no deploy e `apiGerencial` é `https://api-gerencial.ucam-campos.br`. Mock em `A\tools\mock-backend.mjs` (porta 8030).

- Candidato (`core/api/candidato.api.ts`): `GET candidatoprova/search/findbyformaingressopessoa`; `POST candidatoprova`; `GET formaingressopessoa/{oid}/tentativas`; `GET data-context/candidato/{oid}?projection=candidato-inline`.
- Prova (`core/api/prova.api.ts`): `POST …/iniciarprova`; `GET …/cadernoprova`; `GET candidato/{oid}/tempo-maximo-prova`; `GET respostacandidato/search/find-resposta-por-questao`; `POST …/responderquestao`; `POST …/finalizarprova`; `GET …/tipoprova`; `POST …/corrigir-prova-objetiva` (texto).
- Banca (`banca/banca.api.ts`): `GET data-context/periodoingresso/search/findPeriodoingressoComCandidatosProvaOnline`; `GET data-context/formaingresso/search/findFormaingressoComCandidatosProvaOnline`; `GET candidatoprova/search/find-candidatos-para-correcao` e `find-candidatos-prova-corrigida`; `GET respostacandidato/search/find-resposta-redacao`; `POST candidatoprova/{oid}/notaredacao`.
- Provas (`banca/provas/provas.api.ts`): `GET data-context/periodoprocessoseletivo/search/findByUnidade`; `GET formaingresso/search/find-formaingresso-vestibularonline/`; `GET captacao/search/findall`; `GET data-context/formaingressovigencia/search/findByProcessoSeletivo`; `GET cadernoprova/search/find-cadernoprova-by-processoseletivo`; `POST` e `DELETE cadernoprova`; `POST`, `PUT` e `DELETE questao`.
- Isenção (`isencao/isencao.api.ts`): `GET isencao/{oid}`; `POST isencao/{oid}/upload`; `GET isencao/{oid}/download/{doc}`; `GET isencao/{unidade}/{pessoa}/analize/courses` e `analized/courses`; `GET isencao/{oid}/matrizes` e `/matrizes/{matriz}`; `POST isencao/{oid}/evaluate[?partial=true]`.
- Gerencial (`banca/sessao.ts`): os três GET da regra 58.

Modelos principais:
- `CandidatoProva {oid, situacao, horarioinicio, horariofim, formaingressopessoa{oid, situacao, pessoa{oid, nome, cpf{numero}}, periodounidadecurso{turnoLabel, unidadecurso{curso{nome}, unidade{oid, nome, sigla, cidade, uf}}}}}`; `Tentativas {tentativaAtual, totalTentativasPossiveis}`.
- `CadernoProva {oid, tipoprova, questoes[]}`; `Questao {oid, descricao, textoreferencia, alternativas[{oid, descricao}]}`; `RespostaCandidato {oidAlternativa, respostaTextual}`.
- `RedacaoNaFila` = `CandidatoProva` + `dataprova` + `notaredacao`; `Pagina<T> {content, totalElements, number, size}`; `RespostaRedacao {respostaTextual, textoReferencia, descricaoQuestao}`.
- `QuestaoCadastro {oid, descricao, textoreferencia, pontuacao, ordem}`; `EscopoProvas {processo, forma, captacao}`.
- `IsencaoCandidato {status, curso, observacao, semestres: Record<periodo, DisciplinaIsencao[]>, documentos[]}`; `DisciplinaIsencao {oid, nome, aceita, motivo, descricao, ies, cargaHoraria}`; `DocumentoIsencao {oid, descricao, datacriacao, filename}`; `CandidatoFila {nome, situacao|status, documentos, telefone, email, periodoLetivo, datasolicitacao, dataalteracao, formaIngressoPessoa, codigomatriz}`; `Sessao {token, usuario{oid, nome}, oidPessoa, unidades[], unidade}`.

Chaves de `localStorage`: `tema`, `sessao-banca`, `fila:<oid>`, `revisar:<oid>`, `rascunho:<oid>`.

## A.5 Perguntas em aberto

1. Qual é a regra real de aprovação (nota mínima, pesos) e o número real de tentativas? No código só há suposição do mock.
2. O backend recusa resposta ou entrega depois do tempo? O cliente entrega no zero, mas nada impede uma aba parada.
3. No tempo esgotado a entrega sai mesmo com respostas pendentes na fila, que depois é apagada. É aceito perder essas respostas?
4. O `maxLength` de 3000 conta espaços; o mínimo e o contador não. Qual é o teto que vale?
5. O token da sessão nunca é enviado nas chamadas. O backend autentica por outro meio?
6. A banca que corrige redação terá conta no login único? (O README pede decisão.)
7. O escopo da fila de isenção usa `'sem-login'` quando não há `oidPessoa`. O backend aceita?
8. `/isencao/:oid` e o download de documento ficam sem autenticação em produção?
9. Questões objetivas (alternativas e gabarito) são cadastradas onde? Esta tela não cadastra.
10. O HTML de enunciado e alternativa vindo do backend entra por `[innerHTML]`. Há sanitização no servidor? Imagens e fórmulas são esperadas?
11. `tipoUnidade` (EAD / semipresencial / presencial) é calculado e não usado. Falta alguma tela?
12. A mensagem de recusa do servidor mostra o oid cru da questão. É intencional?
13. O README diz que nenhuma tela foi exercitada contra o backend real nem contra o login único.

---

# PROJETO B — cenpre-ui-angular-scss (Angular 22, SSR com prerender, SCSS, Storybook)

## B.1 Rotas e telas

Arquivo: `B\src\app\app.routes.ts`. Nenhum guard, nenhum lazy load. `B\src\app\app.routes.server.ts` prerenderiza `**`. Scroll com restauração de posição e âncoras (`app.config.ts:121`). Não há rota `**` nem página 404.

| URL | Componente | Arquivo (`B\src\app\pages\…`) | Guard |
|---|---|---|---|
| `/` | `HomeComponent` | `home/home.ts` + `.html` (848 linhas) + `.scss` (2.021) | — |
| `/vagas` | `VagasComponent` | `vagas/vagas.ts` + `.html` | — |
| `/conteudos/biblioteca` | `BibliotecaComponent` | `biblioteca/biblioteca.ts` + `.html` | — |
| `/conteudos/artigo` | `ArtigoComponent` | `artigo/artigo.ts` + `.html` | — |
| `/institucional/sobre-nos` | `SobreNosComponent` | `sobre-nos/sobre-nos.ts` + `.html` | — |
| `/aluno/orientacoes-de-estagio` | `OrientacoesComponent` | `orientacoes/orientacoes.ts` + `.html` | — |
| `/aluno/curriculo` | `CurriculoComponent` | `curriculo/curriculo.ts` + `.html` | — |
| `/empresa/cadastro-de-convenio` | `CadastroConvenioComponent` | `cadastro-convenio/cadastro-convenio.ts` + `.html` | — |
| `/empresa/conveniadas` | `ConveniadasComponent` | `conveniadas/conveniadas.ts` + `.html` | — |
| `/empresa/por-que-ser-parceiro` | `ParceiroComponent` | `parceiro/parceiro.ts` + `.html` | — |

Todas são conteúdo institucional; a coluna "arquétipo" marca o que há além disso.

| Tela | Propósito | Arquétipo | Peças |
|---|---|---|---|
| Home | Apresenta o CENPRE e muda o miolo por perfil (aluno/egresso ou empresa) | conteúdo institucional | header próprio sobre o hero, carrossel de 5 slides, faixa de atalhos, boas-vindas, números, abas de perfil (`role="tablist"`), `app-accordion`, cartões de vaga (`appIconChip`, `appTag`, `appButton`), depoimentos com `app-avatar`, `app-logo-marquee`, `app-step-card`, ticker, FAQ, CTA final, `app-site-footer` |
| Vagas | Acesso aos portais (CENPRE, CIEE, NUBE, centrais) e lista mockada de vagas | listagem | `app-page-shell`, `app-editorial-page-hero` + `app-breadcrumb` + `app-hero-pill`, `appCard`, `app-input`, botões de fonte (`aria-pressed`), cartões, `app-pagination`, `app-editorial-cta` |
| Biblioteca | Conteúdos por formato | listagem | hero, abas de formato (botões), cartões-link, estado vazio, CTA |
| Artigo | Um artigo de exemplo | detalhe | hero próprio, `appTag`, corpo com parágrafos e citações, 3 botões de compartilhar sem ação, cartão do autor, relacionados, CTA |
| Sobre nós | Texto institucional | conteúdo institucional | hero, grade de parágrafos, link de contato, CTA |
| Orientações de estágio | Lei 11.788, modalidades, FAQ por modalidade, tutoriais, estágio interno, centrais | conteúdo institucional | hero + pills, banner da lei, cartões de tipo com âncora, `app-accordion` agrupado, `app-doc-card`, `app-logo-marquee`, CTA |
| Currículo | Explica como subir ou criar o currículo na plataforma externa | conteúdo institucional (passo a passo instrutivo) | hero + pills, faixa de dica, dois cartões de passos numerados, FAQ, grade de dicas numeradas, CTA |
| Cadastro de convênio | Explica os 6 passos do convênio na plataforma externa | conteúdo institucional (passo a passo instrutivo) | hero + pills, `appCard` numerados com link, bloco de download do PDF, cartões de documentos, FAQ em duas colunas, CTA |
| Empresas conveniadas | Lista de parceiras com busca e formulário de indicação | listagem + formulário | aviso com download de PDF, `app-input`, cartões com logo ou inicial, `app-pagination`, `<form>` nativo com 8 `<input>` e 1 `<textarea>`, CTA |
| Por que ser parceiro | Benefícios e números | conteúdo institucional | hero + pills, `appCard interactive` numerados (01–06), faixa de estatísticas, CTA |

## B.2 Design system

**Não usa o UCAMDS: confirmado.** Não há `@ucam/*` em `B\package.json`, nenhuma classe `.ucam-*`, nenhum `<ucam-*>`. As ocorrências de "ucam" no código são URLs e e-mails. Também não há Tailwind, `@angular/cdk`, `FormsModule`, `ReactiveFormsModule` nem `HttpClient`.

Os componentes não moram em `src/app/storybook`. Vivem na biblioteca `cenpre-ui-kit` (`B\projects\cenpre-ui-kit\`, versão 0.0.1, nunca publicada), importada como `'cenpre-ui-kit'` a partir de `dist/cenpre-ui-kit`. `B\src\app\storybook\{ui,layout}\*.stories.ts` só têm as stories; `B\src\app\foundations\` tem as de tokens e ícones.

### Componentes (`B\projects\cenpre-ui-kit\src\lib\`)

| Peça | Seletor | Tipo | Props |
|---|---|---|---|
| Button | `button[appButton], a[appButton]` | diretiva | `variant`: primary (padrão) / secondary / outline / ghost / link; `size`: xs 32px / sm 36 / md 40 (padrão) / lg 44; `fullWidth`. Classe extra `btn-on-dark` para ghost em fundo escuro |
| Card | `[appCard]` | diretiva | `padding`: none / sm 20px / md 24 (padrão) / lg 32; `interactive` |
| Tag | `[appTag]` | diretiva | `tone`: neutral (padrão) / brand / accent / info; `size`: sm 11px / md 12px (padrão) |
| IconChip | `[appIconChip]` | diretiva | `size`: sm 36 / md 44 (padrão) / lg 48; `tone`: brand (padrão) / neutral; `aria-hidden` fixo |
| Accordion | `app-accordion` | componente | sem props; modo único (um aberto por vez) |
| AccordionItem | `app-accordion-item` | componente | `title` (obrigatório), `value` (obrigatório, vira id); conteúdo projetado |
| Avatar | `app-avatar` | componente | `src`, `alt`, `fallback` (2 primeiras letras em maiúsculas), `size` sm / md / lg |
| StepCard | `app-step-card` | componente | `number`, `title`, `description` (obrigatórios); `linkLabel`; `linkHref` (padrão: Symplicity) |
| DocCard | `app-doc-card` | componente | `label`, `icon`, `items: string[]` (obrigatórios) |
| Input | `app-input` | componente | `ariaLabel`, `placeholder`, `leftIcon`, `value`; saída `valueChange`. Só `type="text"`, altura 40px, sem rótulo visível, sem erro, sem `ControlValueAccessor` |
| Pagination | `app-pagination` | componente | `page`, `totalPages` (obrigatórios); saída `pageChange`. Lista todas as páginas, sem anterior/próxima nem reticências |
| LogoMarquee | `app-logo-marquee` | componente | `logos: {nome, src}[]` (obrigatório), `title` |
| Breadcrumb | `app-breadcrumb` | layout | `trail: string[]` (obrigatório); "Início" fixo; itens sem link |
| HeroPill | `app-hero-pill` | layout | `icon`; conteúdo projetado |
| EditorialPageHero | `app-editorial-page-hero` | layout | `title` (obrigatório), `eyebrow`, `subtitle`; slots `[breadcrumb]`, `[pills]`, `[actions]` |
| EditorialCta | `app-editorial-cta` | layout | `title` (obrigatório), `eyebrow`, `image`, `imageAlt`; ações projetadas |
| SiteHeader | `app-site-header` | layout | `navItems: {label, href}[]` (obrigatório); `secondaryCtaLabel` ('Ver oportunidades'), `secondaryCtaHref` ('/vagas'), `ctaLabel` ('Acessar plataforma'), `ctaHref` (Symplicity); menu móvel por sinal |
| SiteFooter | `app-site-footer` | layout | `contato` (obrigatório); colunas, links e "© 2026" fixos no template; redes sociais com `href="#"` |
| PageShell | `app-page-shell` | layout | `contato` (obrigatório); `navItems` (padrão: Início, Alunos e Egressos, Empresa, Vagas, Conteúdos) |

Classes globais sem diretiva: `.section-eyebrow`, `.section-title` (`--lg`, `--dark`), `.section-subtitle` (`styles\components\_section-heading.scss`). O HANDOFF fala em 18 peças (11 + 7); contei 12 de UI + 7 de layout.

### Tokens (`B\projects\cenpre-ui-kit\styles\_tokens.scss`, variáveis Sass)

`B\src\styles.scss` só faz `@use` dos tokens e mixins, importa Inter e Work Sans do Google Fonts (pesos 400–700) e traz reset, scrollbar e anel de foco global.

- **Marca (magenta):** 100 `#fff0f5`, 200 `#ffdde8`, 300 `#fcb9ce`, 400 `#f494b2`, 500 `#ea7095`, 600 `#d64e76`, **700 `#b4365b` (primária)**, 800 `#922243`, 900 `#70132f`, 1000 `#530e23`.
- **Ash:** 100 `#f9fafb`, 200 `#f1f3f5`, 300 `#e2e6e9` (borda), 400 `#d6dce0`, 600 `#939eaa`.
- **Charcoal:** 100 `#758493`, 200 `#566574`, 300 `#415260`, 400 `#3c4b57` (corpo), 500 `#303e49` (título e fundo escuro).
- **Sucesso:** 100 `#e6f9ee`, 500 `#3fcb7a`, 600 `#2aa65f`, 700 `#1a7f46`. **Destrutivo:** `#dc2626` / `#ffffff`. **Info:** 100 `#e8f1fd`, 700 `#1d4ed8`. Os dois últimos são "valor convencional", não vêm do Figma.
- **Semânticos:** `$color-brand` = magenta-700, `-strong` = 800, `-soft` = 100; `$color-text-title` = charcoal-500; `$color-text-body` = charcoal-400; `$color-border` = ash-300; `$color-background` = `#ffffff`.
- **Tipografia:** display `'Work Sans'`; base `Inter`. Pesos 400 / 500 / 600 / 700. Corpo: xs 12px, sm 13, base 15, md 16, lg 18, xl 20. Display com `clamp`: hero 2.35–4.25rem, página 2.25–3.75, seção 2–3.25, seção compacta 1.9–3. Entrelinha 1.03 / 1.12 / 1.5. Título: peso 600, tracking −0.015em.
- **Espaçamento (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96; gutter 72.
- **Raio:** chip 8, card 16, pill 100. **Larguras:** container 1440, conteúdo 1296, prosa 820.
- **Sombras:** button, card, card-hover, popover, modal, todas em `rgba(48,62,73,…)`.
- **Breakpoints (só `min-width`):** sm 640, md 768, lg 1024, xl 1280. **Transições:** 150ms e 200ms. **Foco:** anel duplo, 2px branco + 4px `rgba(180,54,91,.45)`, raio 8.
- **Mixins** (`_mixins.scss`): `mq`, `container`, `focus-ring`, `sr-only`, `line-clamp`, `motion-safe`, `display-heading`.
- Sem tema escuro e sem CSS custom properties: tudo resolve em build.

### Origem da identidade visual

- Figma "UCAM SITE", página "CENPRE - 2.0"; os valores vieram de `cenpre-ui/tailwind-preset.ts`, a lib React de referência (`_tokens.scss:3-5`).
- Cores exatas: primária `#b4365b`; escuro `#303e49`; corpo `#3c4b57`; borda `#e2e6e9`; fundo `#ffffff`.
- A arte da logo é `#7b1729`, mais fechada que o token e situada entre magenta-800 e 900; "decisão de alinhar ou não a paleta à logo está em aberto" (`B\HANDOFF.md` §3.7). Os SVGs da logo são PNG 1627×532 embutido, não vetor.
- Ícones: Lucide (45 registrados) e Tabler (3 de marca), por `@ng-icons`, em `app.config.ts:65-114`.
- Fora dos tokens, nos SCSS de página e da lib: só `#fff` (71 vezes), `#303e49` (4) e `rgba()` de branco, charcoal e magenta.

## B.3 Regras de negócio lidas no código

Os quatro "formulários" pedidos, como estão de fato:

1. **Cadastro de convênio não é formulário.** A página explica 6 passos e manda para `https://ucam-csm.symplicity.com/` (`cadastro-convenio.html:21,93`). Nenhum dado é coletado no site.
2. **Regras declaradas do convênio** (`B\src\app\content\cadastroConvenio.json`): cadastro na plataforma e conferência pelo CENPRE (`:20`); "Estágio" → "Módulo de Estágio" → "Convênio" → "Novo Convênio", com Responsável Legal e campus UCAM, "A vigência pode ser indeterminada" (`:26`); assinatura digital com CPF do Responsável Legal e token por e-mail (`:32`); **homologação em até 5 dias úteis** (`:43-44`); só depois a empresa publica vagas (`:47-48`); documentos: CNPJ, razão social, endereço, nome/CPF/e-mail do Responsável Legal, contrato social ou estatuto (`:58-72`); só assina o Responsável Legal do contrato social (`:83`); **gratuito** (`:87`); **cada filial com CNPJ próprio tem cadastro individual** (`:91`). Tipo: prazo, permissão e formato, como conteúdo.
3. **Currículo não é formulário.** Dois caminhos de 6 passos na plataforma externa (`content\curriculo.json:13-38`). Declarado: pode haver mais de um currículo (`:45`); opção "Visível às empresas" (`:22`); dicas "Evite incluir foto, CPF, RG ou endereço completo" e "PDF e até 2 páginas" (`:63-64`); pill "PDF, HTML ou Doc" (`curriculo.html:6`).
4. **Por que ser parceiro não é formulário.** Seis benefícios e a faixa de `stats` de `empresa.json` (`parceiro.ts:30`); CTA para a Symplicity e `mailto:convenio.estagio@ucam-campos.br`.
5. **Vagas não tem formulário de candidatura.** "Tenho interesse" é link para `v.href` (todas as vagas do mock apontam para a Symplicity). `vagas.html:113`.

Regras implementadas em código:

6. **Formulário "Indicação" (Empresas Conveniadas): o único `<form>`.** Campos: Nome da Empresa (text), Área de atuação (text), Nome do contato (text), Cargo (text), E-mail (`type="email"`), Telefone (`type="tel"`), Cidade (text), Site ou rede social (text, placeholder "Opcional"), Mensagem (textarea, 4 linhas). `conveniadas.html:117-219`, `conveniadas.ts:66-74`.
   - **Obrigatoriedade:** nenhum campo tem `required`.
   - **Validação:** nenhuma em código. Sem `pattern`, sem `maxlength`, sem máscara, sem mensagem de erro. Só a checagem nativa de formato do `type="email"` quando preenchido (o form não tem `novalidate`).
   - **Destino:** nenhum. `onIndicacaoSubmit` só faz `preventDefault()`: "Sem endpoint de envio ainda — integrar com o backend do CENPRE quando existir." (`conveniadas.ts:76-79`). Não limpa o formulário nem dá retorno a quem enviou.
7. **Lista de vagas.** Fontes `['Todas', 'CENPRE', 'NUBE', 'Outros parceiros']`; busca sem distinção de caixa em título + local; 6 por página; mudar busca ou fonte volta à página 1; página atual limitada ao total. `vagas.ts:12,44,51-78`. Contagem "N vaga disponível / vagas disponíveis"; vazio "Nenhuma vaga encontrada — tente outra busca ou fonte." (`vagas.html:91-123`). Limite e cálculo.
8. **Selo de fonte.** `CENPRE` usa tom brand; qualquer outra fonte, accent. `vagas.html:103`.
9. **Portais.** `href` começando com `/` é rota interna com `fragment` e botão outline; o resto abre em nova aba, botão primary e texto "(abre em nova aba)". `vagas.html:31-55`. CIEE e NUBE não são embutidos porque bloqueiam iframe (`:9-12`).
10. **Conveniadas.** Busca em nome + categoria; **12 por página** (`conveniadas.ts:12`); empresa com 0 vagas continua na lista com "Nenhuma vaga no momento"; com vagas, "N vaga aberta / vagas abertas" + "Ver vagas"; sem logo, inicial do nome. `conveniadas.html:53-76`. Vazio: "Nenhuma empresa encontrada — tente outro termo."
11. **Biblioteca.** Abas de formato `Blog, Vídeos, Podcasts, Webinars, Artigos` (em `empresa.json` aparece `Workshops` no lugar de `Webinars`); a primeira é a ativa; formato sem itens mostra "Conteúdos de {formato} em breve". `biblioteca.ts:9-47`, `biblioteca.html:57-71`.
12. **Home.** Carrossel de 5 slides (3 de aluno + 2 de empresa) avançando a cada 6.500 ms, só no browser; perfil `aluno | empresa` troca tópicos, sobre, biblioteca, notícias, FAQ e destino do CTA final, e rola até `#perfil`. `home.ts:168-205,225-264`. Prazo.
13. **Accordion.** Abrir um item fecha os outros do mesmo grupo. `projects\cenpre-ui-kit\src\lib\ui\accordion\accordion.ts:26-31`.
14. **Orientações.** Bloco de FAQ de modalidade com `grupos` vazio não é renderizado (`content.types.ts:155-159`); a faixa de logos das centrais só aparece para centrais com `logo` (`orientacoes.ts:55-57`).
15. **Avatar.** Sem imagem ou com erro de carga, mostra as iniciais. `avatar.ts:13-17,31`.
16. **Contato institucional** (`content\campos.json:556-561`): `atendimento.cenpre@ucam-campos.br`, `convenio.estagio@ucam-campos.br`, `(22) 2726-2419`, WhatsApp `(22) 99618-0786`. E-mail e telefones também estão fixos em `conveniadas.html:106-112`.
17. **Controles sem ação.** Botões "LinkedIn", "WhatsApp" e "Copiar link" do artigo (`artigo.html:48-50`) e os três links de rede social do rodapé (`href="#"`, `site-footer.html:59-61`).

## B.4 API e dados

- **Nenhuma chamada de rede.** `ContentService` (`B\src\app\content\content.service.ts`) devolve os 11 JSON de `B\src\app\content\` importados estaticamente; `public/data/*.json` é cópia não consumida (HANDOFF §4). O deploy é o HTML prerenderizado na Vercel; o servidor Express de `B\src\server.ts` não é usado.
- Métodos: `getCampos`, `getEmpresa`, `getOrientacoes`, `getCurriculo`, `getConveniadas`, `getCadastroConvenio`, `getParceiro`, `getVagas`, `getArtigo`, `getSobreNos`, `getBiblioteca`.
- Modelos (`B\src\app\content\content.types.ts`): `Vaga {area, source, modality, title, company, location, salary, href}`; `Parceiro {name, category, vagasAbertas, href, logo?}`; `Depoimento {name, course, quote, titulo, empresa?, tempo?, foto?}`; `Noticia {author, date, title, excerpt, tags[], href, image?}`; `BibliotecaItem` = `Noticia` + `formato`; `FaqItem {question, answer}`; `SubHero {title, subtitle, breadcrumb[]}`; `Contato {emailGeral, emailConvenio, telefone, whatsapp}`; `SecaoModalidade`; mais um `*Content` por página.
- Mock: 18 parceiras em `empresa.json` (6 com 0 vagas); 12 vagas em `vagas.json`, com modalidades "Estágio obrigatório", "Estágio não obrigatório" e "Emprego".
- PDFs: `/assets/documents/tutorial-convenio-estagio-cenpre.pdf` e `/assets/documents/planilha-convenios-cenpre.pdf`.

## B.5 Perguntas em aberto

1. Para onde vai o formulário de indicação (e-mail, planilha, endpoint)? Quais campos são obrigatórios e com que validação? Precisa de consentimento LGPD? Nada disso está no código.
2. O HANDOFF (§2.5) diz que "em produção esse conteúdo já vem do Strapi", mas o repositório não tem cliente HTTP. Qual é a fonte real em produção?
3. Paginação das conveniadas: o HANDOFF (§2.3) diz 6 por página, o código usa 12. E descreve o formulário com 4 campos; o código tem 9.
4. As vagas reais virão de onde? Hoje são 12 fixas.
5. A paleta deve se alinhar à logo (`#7b1729`) ou ficar em `#b4365b`? (Aberto no HANDOFF.)
6. Tokens de erro e de info são "convencionais", sem valor oficial do Figma.
7. As redes sociais e os botões de compartilhar terão destino?
8. O Cypress nunca rodou (HANDOFF §6): as 15 specs não foram validadas.
9. O CENPRE vai adotar o UCAMDS ou manter identidade própria (magenta, Inter + Work Sans, sem tema escuro)? O código não indica intenção de migrar.
