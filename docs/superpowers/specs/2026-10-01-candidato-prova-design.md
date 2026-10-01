# Vestibular Online — fluxo do candidato (entrada, prova, resultado)

Data: 2026-10-01 · Estado: aprovado em conversa, aguardando revisão escrita

## 1. Objetivo

Reescrever o fluxo do candidato do vestibular online da UCAM como um app Angular 21 no Trilho B do UCAMDS (`@ucam/ui` + `@ucam/tokens`), falando com o mesmo backend e os mesmos endpoints do app legado (`processo-seletivo-frontend`, Angular 9). O resultado é um app que o candidato abre pelo link que recebe, confere seus dados, lê as instruções, faz a prova (objetiva e, quando houver, redação) e vê o resultado — com URL real em cada passo, retomada após recarregar ou trocar de aparelho, tempo visível o tempo todo e nenhum beco sem saída.

Fora do escopo desta spec (sub-projetos seguintes, cada um com spec própria): matrícula (dados pessoais, documentos, contrato, boleto), acompanhamento de isenção, administração (cadastro de cadernos, correção).

## 2. O que o legado faz e o que muda

| Legado | Novo | Por quê |
|---|---|---|
| Navegação com `skipLocationChange`; recarregar a página perde tudo | Rota por tela e por questão; guard recupera o estado do backend pelo `oid` | Retomada, histórico do navegador, abrir no celular |
| Estado em `DataService` mutável e `environment.oidcandidatoprova` global | Stores com signals, por candidato | Previsibilidade e teste |
| GIF de carregamento em tela cheia | Skeleton na região que carrega | ADR-005; a pessoa continua vendo onde está |
| Placeholder como rótulo, textos em caixa alta, "Voltar" sem ação | Rótulo persistente, caixa natural, toda ação leva a algum lugar | ADR-003, ADR-004, ADR-044 |
| Tempo esgotado só navega para a conclusão | Tempo esgotado entrega a prova (`finalizarprova`) e vai ao resultado | Hoje a prova pode ficar `PROVA_INICIADA` para sempre |
| Bloqueio de copiar/colar/F12/impressão em todas as telas, inclusive entrada e conclusão | Bloqueio de copiar, recortar, colar e menu de contexto só na questão e na redação | Não sequestra teclado nem leitor de tela fora da prova |
| Redação em editor rico (Quill: negrito, listas, fórmulas) | Texto simples em `ucam-textarea`, com contador | O backend guarda string; a correção lê texto; o editor rico era o que mais quebrava no celular |
| Carrossel de instruções com "Próxima" | Lista lida de uma vez | Três frases não precisam de três cliques |
| Sem resumo antes de entregar | Diálogo de confirmação nomeia quantas questões ficaram em branco | Prevenção de erro |

## 3. Benchmark e heurísticas aplicadas

Práticas consolidadas em plataformas de avaliação online (ENEM digital, provas da Pearson VUE/Prometric, Moodle Quiz, Canvas Quizzes, Khan Academy) que o fluxo adota:

- **Mapa de questões sempre visível**, com estado por questão (respondida, atual, em branco), que também é navegação. Em tela estreita vira uma gaveta aberta pelo cabeçalho.
- **Relógio persistente** no cabeçalho, em palavra ("Faltam 42 min"), com dois alertas antes do fim (último terço e últimos 10 min) e anúncio para leitor de tela nesses dois momentos — não a cada segundo.
- **Autosave com indicação discreta**: "Salvo" / "Salvando…" / "Sem conexão — 3 respostas pendentes" ao lado do relógio. A pessoa nunca precisa clicar em "salvar".
- **Revisão antes de entregar**: o diálogo de entrega diz "3 questões em branco" e oferece "Revisar" como saída, além de "Entregar prova".
- **Uma ação primária por tela**, na cor da marca; "Entregar" só vira primária na última questão.
- **Sem pré-marcação** de alternativa (contrato do radio-group).

Heurísticas de Nielsen, uma a uma:

1. Visibilidade do estado: relógio, progresso "12 de 40 respondidas", indicador de salvamento, situação da prova no resultado.
2. Correspondência com o mundo real: vocabulário do edital (prova objetiva, redação, caderno, entregar a prova, aprovado/reprovado); nada de "submit", "PROVA_FINALIZADA" ou código de erro na tela.
3. Controle e liberdade: Anterior/Próxima, mapa clicável, voltar às instruções sem perder nada, entrega confirmada por diálogo.
4. Consistência e padrões: só componentes e tokens do UCAMDS; a entrada segue a tela de referência `portal/login`.
5. Prevenção de erros: resumo de questões em branco; redação bloqueada abaixo do mínimo com o motivo escrito; nenhuma ação destrutiva sem diálogo.
6. Reconhecimento em vez de memória: a questão mostra caderno e número; o mapa mostra o que falta; o resultado mostra em quanto tempo a prova foi feita.
7. Flexibilidade: teclado completo (setas entre alternativas, Tab entre ações); atalhos desenhados só se existirem (ADR-044) — nesta versão, nenhum.
8. Estética minimalista: uma coluna de leitura para a questão, sem cartão dentro de cartão, sem cor sem significado.
9. Recuperação de erros: toda falha de rede diz o que houve e o que fazer, e mantém a resposta local até conseguir enviar.
10. Ajuda: "Instruções" acessível do cabeçalho da prova durante toda a prova.

## 4. Rotas e telas

Prefixo: `/candidato/:oid` (o `oid` é o `oidFormaIngressoPessoa` do link que o candidato recebe; `?tentativa=N` continua aceito).

### 4.1 Guard `candidatoGuard`

Roda em todas as rotas do prefixo.

1. Carrega `candidatoprova/search/findbyformaingressopessoa`. Se não existir, cria (`POST candidatoprova`), como o legado faz na entrada. Com `?tentativa=N`, chama `POST candidatoprova?tentativa=N` e, em erro, cai na consulta normal.
2. Guarda candidato, unidade e tentativas no `CandidatoStore`.
3. Redireciona pela situação quando a rota pedida não cabe:
   - `CADASTRADO` → permite entrada e instruções; prova e resultado voltam para a entrada.
   - `PROVA_INICIADA` → permite prova; entrada e instruções vão para a prova.
   - `PROVA_FINALIZADA` → resultado.
   - `PROVA_CORRIGIDA` → se `formaingressopessoa.situacao` ∈ {APROVADO, MATRICULADO}, redireciona para a área do inscrito externa (`FORM_URL/<cpf>`), como hoje; senão, resultado (que mostra reprovado e, se houver tentativa, "Tentar novamente").
4. Falha de rede ou `oid` inválido: tela de erro dentro da moldura ("Não conseguimos localizar sua inscrição. Confira o link do e-mail ou fale com a secretaria."), com "Tentar de novo".

### 4.2 Entrada — `/candidato/:oid`

Segue a tela de referência `portal/login`: painel em duas colunas, acesso à esquerda e coluna institucional em bordô à direita; abaixo de 64rem só o acesso. Sem faixa e sem navegação (`semFaixa`, `entrada`).

- `h1` "Confira seus dados", logo da UCAM encostada ao título.
- `ucam-description-list` (stacked, 1 coluna): Nome, CPF (mascarado `000.000.000-00`), Curso, Turno.
- `ucam-button` primária "Entrar na prova" (ou "Ver resultado" quando a prova já foi entregue — o rótulo nomeia o destino).
- Quando `tentativaAtual >= totalTentativasPossiveis` e a situação pede nova tentativa: `ucam-alert` warning "Você já usou as N tentativas desta inscrição." e o botão fica desabilitado com esse motivo ao lado (ADR-042).
- Apoio no pé da coluna: "Esta prova tem tempo para ser feita: Xh a partir do início." e contato da secretaria.
- Coluna institucional: a frase institucional e a lista do que a pessoa vai encontrar (3 itens: tempo, cadernos, resultado).

### 4.3 Instruções — `/candidato/:oid/instrucoes`

Moldura `ucam-app-shell` (faixa `brand`, `systemName` "Vestibular Online", contexto = unidade, usuário = nome do candidato, sem navegação lateral).

- `ucam-page-header` variante página: "Antes de começar".
- Lista de três itens com ícone (`ucam-icon`): plataforma responsiva; prova com tempo e como a barra avisa; tudo salvo automaticamente.
- `ucam-alert` info: "Ao clicar em Iniciar prova, o tempo de {tempomaximo} começa a contar e não para."
- Resumo da prova: `ucam-description-list` inline — Cadernos (ex.: Português, Matemática, Conhecimentos gerais), Redação (sim/não), Tempo.
- Rodapé do conteúdo: `ucam-button` primária "Iniciar prova" (estado `loading` durante o `iniciarprova`). Sem "Voltar": a entrada é um clique no cabeçalho.

### 4.4 Questão — `/candidato/:oid/prova/:caderno/:n`

`:caderno` é o `tipoprova` em caixa baixa (`portugues`, `matematica`, `conhecimentos-gerais`); `:n` é o número da questão dentro do caderno (base 1). `/candidato/:oid/prova` redireciona para a primeira questão em branco (ou a primeira, se todas respondidas).

Arranjo: `ucam-app-shell` com faixa; dentro, bloco `split` — coluna principal (questão) e coluna lateral de 18rem (mapa). Abaixo de 60rem o mapa sai da lateral e vira `ucam-drawer` aberto por um botão "Questões" no cabeçalho da prova.

**Cabeçalho da prova** (sticky, abaixo da faixa, `ucam-page-header` variante barra):
- Título: "Prova objetiva" com contagem "12 de 40 respondidas" no nome acessível.
- Relógio: `ucam-progress` (max = tempo total, value = decorrido, `valueText` "Faltam 42 min") com legenda em palavra. Tom `neutral` → `warning` no último terço → `danger` nos últimos 10 min. Abaixo da barra, o texto "Faltam 00:42:10".
- Indicador de salvamento: texto com ícone — "Salvo", "Salvando…", "Sem conexão — 3 respostas pendentes".
- Ações: link "Instruções"; botão "Questões" (só abaixo de 60rem).

**Mapa de questões** (lateral): por caderno, um `ucam-section-bar` com o nome e "8 de 10"; abaixo, grade de botões numerados (alvo ≥ 24px, `aria-current="page"` na atual, `aria-label` "Questão 3, respondida"). Estado visual: respondida (preenchida), em branco (contorno), atual (borda de foco permanente). Ao fim, se houver redação, um item "Redação" com o estado (em branco / rascunho / mínimo atingido).

**Questão**:
- `h2`: "Português · Questão 3 de 10". Selo `ucam-badge` "Respondida" quando houver.
- Texto de referência e enunciado renderizados do HTML do backend (sanitizado), em coluna de leitura de 65–75 caracteres.
- `fieldset` com `legend` sr-only "Alternativas da questão 3"; cinco `ucam-choice-card` com `selection="single"`, `name` por questão, rótulo "A" a "E" como prefixo do texto da alternativa (HTML sanitizado), sem descrição e sem ícone. Escolher grava na hora.
- Rodapé: `ucam-button` secundária "Anterior" (desabilitada na primeira, com o motivo em tooltip), `ucam-button` primária "Próxima". Na última questão do último caderno: "Próxima" vira "Entregar prova" (primária) — ou "Ir para a redação" quando houver redação ainda não entregue.

**Entrega**: `ucam-dialog` variante `confirm`, título "Entregar a prova?". Corpo: "Depois de entregar você não poderá alterar as respostas." e, quando houver, "3 questões estão em branco." (lista os números, até 10). Rodapé: secundária "Revisar" (fecha e vai à primeira em branco), primária "Entregar prova" com `loading`. Com redação abaixo do mínimo, o diálogo nem abre: a ação fica desabilitada com o texto "A redação precisa de pelo menos 300 caracteres" ao lado.

### 4.5 Redação — `/candidato/:oid/prova/redacao`

Mesmo arranjo e cabeçalho da questão; o mapa marca "Redação" como atual.

- `h2` "Redação". Texto de referência e proposta do backend.
- `ucam-textarea` rótulo "Seu texto", `rows` 14, `autoGrow`, `maxlength` 3000, contador "1.240 de 3.000 caracteres". Abaixo, hint: "Mínimo de 300 caracteres (sem contar espaços)". Enquanto faltar: "Faltam 120 caracteres para o mínimo" (tom neutro, não é erro até tentar entregar).
- Salvamento: no `blur` e a cada 30 s se houve mudança, para `responderquestao` com `respostaTextual`; rascunho também no `localStorage` (`rascunho:<oidcandidatoprova>`), restaurado ao abrir se for mais novo que o do servidor. O indicador do cabeçalho mostra o estado.
- Rodapé: secundária "Voltar para a prova objetiva" (quando houver), primária "Entregar prova" (mesmo diálogo de 4.4). Sem botão "Salvar rascunho": salva sozinho, e o indicador diz.
- Contagem de caracteres: mesma regra do legado — caracteres não brancos; teto por `maxlength`.

### 4.6 Resultado — `/candidato/:oid/resultado`

`ucam-app-shell` com faixa. `ucam-page-header` página: "Prova entregue".

- `ucam-description-list` inline: Entregue em (data/hora), Tempo usado (hh:mm:ss, do `horariofim − horarioinicio`), Cadernos.
- Com redação: `ucam-alert` info "Sua redação será corrigida pela banca. Acompanhe a data do resultado no site." + `ucam-button` secundária "Ir para o site" (URL por unidade, como hoje).
- Sem redação (`corrigir-prova-objetiva` já rodou): `ucam-badge` success "Aprovado" ou neutral "Reprovado" com a frase correspondente. Aprovado: primária "Concluir matrícula" (área do inscrito externa). Reprovado com tentativa disponível: primária "Tentar novamente" (vai à entrada com `?tentativa=N+1`); sem tentativa: texto "Você usou as N tentativas desta inscrição." e secundária "Ir para o site".
- Nunca vermelho para reprovado (ADR-002): reprovado é neutro com a palavra.

## 5. Estrutura do app

```
src/app/
  core/
    api/        candidato.api.ts, prova.api.ts        (HttpClient, endpoints do legado)
    model/      candidato.ts, prova.ts, resposta.ts   (tipos; enums de situação)
    store/      candidato.store.ts, prova.store.ts    (signals)
    offline/    fila-respostas.ts                     (fila em localStorage + reenvio)
    tempo/      relogio-prova.ts                      (restante, tom, limiares, anúncios)
    guards/     candidato.guard.ts
    directives/ prova-protegida.directive.ts          (copiar/recortar/colar/contextmenu)
  layout/       moldura.component.ts                  (app-shell configurado)
  candidato/
    entrada/    instrucoes/    prova/ (cabecalho, mapa, questao, redacao, entrega-dialog)    resultado/
environments/   environment.ts, environment.prod.ts
```

- `environment`: `backend`, `backendApi` (`.../vestibularonline/`), `formUrl`, `siteUrlPresencial`, `siteUrlEad`, `unidRef`.
- Angular standalone, zoneless (padrão do CLI 21), roteamento com `withComponentInputBinding`.
- Estilo: só `@ucam/ui`, `@ucam/tokens` e as classes de layout (`ucam-stack`, `ucam-cluster`, `ucam-split`, `ucam-content`). Nenhum hex, nenhum `style` inline (ADR-007). Fonte Geist auto-hospedada via `@fontsource-variable`.

## 6. Dados e serviços

| Serviço | Endpoint do legado | Uso |
|---|---|---|
| `CandidatoApi.buscar(oid)` | `GET candidatoprova/search/findbyformaingressopessoa` | guard |
| `CandidatoApi.criar(oid, tentativa?)` | `POST candidatoprova` | guard |
| `CandidatoApi.tentativas(oid)` | `GET formaingressopessoa/{oid}/tentativas` | entrada, resultado |
| `CandidatoApi.dados(oidCandidato)` | `GET data-context/candidato/{oid}?projection=candidato-inline` | cabeçalho (curso/turno), resultado |
| `ProvaApi.iniciar(oidCandidatoProva)` | `POST candidatoprova/{oid}/iniciarprova` | instruções |
| `ProvaApi.cadernos(oid)` | `GET candidatoprova/{oid}/cadernoprova` | prova |
| `ProvaApi.tempoMaximo(oidCandidato)` | `GET candidato/{oid}/tempo-maximo-prova` | relógio |
| `ProvaApi.resposta(oidQuestao, oidCandidatoProva)` | `GET respostacandidato/search/find-resposta-por-questao` | estado inicial do mapa |
| `ProvaApi.responder(oid, {oidQuestao, oidAlternativa?, respostaTextual?})` | `POST candidatoprova/{oid}/responderquestao` | questão e redação |
| `ProvaApi.entregar(oid)` | `POST candidatoprova/{oid}/finalizarprova` | entrega e tempo esgotado |
| `ProvaApi.tiposProva(oid)` | `GET candidatoprova/{oid}/tipoprova` | resultado |
| `ProvaApi.corrigirObjetiva(oid)` | `POST candidatoprova/{oid}/corrigir-prova-objetiva` | resultado sem redação |

Estado inicial do mapa: ao abrir a prova, uma chamada de `resposta` por questão, em paralelo, com skeleton no mapa até terminar (é o que o backend oferece; um endpoint agregado fica como pedido futuro, fora desta spec).

`ProvaStore` expõe: `cadernos`, `questaoAtual`, `respostas` (mapa `oidQuestao → oidAlternativa | texto`), `respondidas`, `emBranco`, `temRedacao`, `redacaoAtingeMinimo`, `salvamento` (`salvo | salvando | pendente(n) | erro`).

## 7. Tempo e offline

- `RelogioProva`: `horaFim = horarioinicio + tempomaximo` (2h se a consulta falhar). `restante` recalculado a cada segundo com `Date.now()`; nunca decrementa um contador local. Tom: `neutral` acima de 1/3 do total, `warning` abaixo, `danger` abaixo de 10 min. Anúncio `aria-live="polite"` nas duas trocas de tom e aos 1 min. Em zero: `entregar()` e navegar ao resultado; se `entregar` falhar, navega mesmo assim e o resultado mostra alerta "Não conseguimos registrar a entrega. Tente novamente." com botão.
- `FilaRespostas`: toda resposta vai ao backend na hora; em falha, entra na fila (`fila:<oidCandidatoProva>` no `localStorage`) e o estado vira `pendente(n)`. Reenvio ao evento `online`, a cada 30 s enquanto houver pendência, e obrigatoriamente antes de `entregar` (se ainda falhar, o diálogo de entrega avisa "3 respostas não foram enviadas" e não entrega).
- Rascunho da redação: `localStorage` por candidato, limpo na entrega.
- Diretiva `provaProtegida`: `preventDefault` em `copy`, `cut`, `paste`, `contextmenu` no elemento da questão/redação. Nada global, nada de teclas.

## 8. Estados, erros e acessibilidade

- Carregando: `ucam-skeleton` no lugar da lista de dados, da questão e do mapa; botão em `loading` durante ação (nunca `disabled`).
- Erro de carga: `ucam-alert` danger com o que houve e "Tentar de novo"; erro ao gravar resposta: a escolha fica marcada, o indicador vira "pendente" e a fila cuida.
- Vazio: candidato sem caderno — `ucam-empty-state` `error` "Esta prova ainda não tem caderno cadastrado. Fale com a secretaria." com o contato.
- Um `h1` por tela; headings sem pular; todo campo com rótulo; toda imagem decorativa `aria-hidden`; foco visível; diálogo prende e devolve o foco; a 390px nada rola na horizontal.
- Tema escuro: pelos tokens; conferir cada tela nos dois temas antes de fechar.

## 9. Testes

Vitest (padrão do CLI 21):
- `relogio-prova`: restante, tons e limiares, zero dispara entrega.
- `fila-respostas`: enfileira em falha, reenvia em `online`, bloqueia entrega com pendência.
- `prova.store`: próxima/anterior entre cadernos, primeira em branco, contagem.
- `candidato.guard`: redirecionamento por situação e `?tentativa`.
- Componentes: questão grava ao escolher, diálogo de entrega lista em branco, redação bloqueia abaixo do mínimo.
- `npm run ds:checar` → `npx ucam-ds checar src/app/**/*.html` (templates inline ficam em `.html` separados para isso).

## 10. Decisões em aberto que não bloqueiam

- Endpoint agregado de respostas (uma chamada em vez de N): pedido ao backend, fora da spec.
- "Marcar para revisar" por questão: fica para uma versão seguinte; o mapa e o resumo de em branco já cobrem o caso principal.
- Texto definitivo das instruções e do contato da secretaria: vem do produto; a tela recebe por configuração.
