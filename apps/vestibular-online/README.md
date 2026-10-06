# Vestibular Online · UCAM

O vestibular online da Candido Mendes — a prova do candidato, a correção da banca, o cadastro de provas e a isenção de disciplinas — construído com o UCAMDS (Trilho B): Angular 21, `@ucam/ui`, `@ucam/tokens` e `@ucam/css`. Substitui o `processo-seletivo-frontend` (Angular 9) falando com o mesmo backend.

## Perfis e telas

| Perfil | Entra por | Telas |
|---|---|---|
| Candidato | o link do e-mail: `/candidato/:oid` (o `/vestibularonline/:oid` do legado continua valendo) | conferir os dados → antes de começar → prova objetiva e redação → resultado |
| Candidato com isenção | `/isencao/:oid`, o mesmo endereço do legado | acompanhamento da isenção de disciplinas |
| Área interna (banca e secretaria) | login único da universidade, que devolve em `/admin/login/:token/:usuario` | `/banca/redacoes` (fila e nota), `/banca/isencao` (fila e análise), `/banca/provas` (cadernos e questões) |

A porta sem link (`/`) aceita o código da inscrição ou o link inteiro colado. Não há papéis na área interna: quem tem sessão vê os três destinos, como no legado. Os endereços antigos `/admin`, `/admin/correcao/redacao` e `/admin/cadastro` redirecionam para os novos.

### Login da área interna

`src/app/banca/sessao.ts` guarda quem entrou (token, usuário, pessoa, unidades) no navegador; `banca.guard.ts` barra `/banca/**` sem sessão e manda para `environment.loginUrl`; `entrar.ts` é a volta do login: busca nome e unidades no gerencial (`environment.apiGerencial`, as mesmas três consultas do legado) e troca a entrada do histórico, para o token não ficar na barra de endereço. "Sair" encerra a sessão e devolve ao login.

No protótipo `loginUrl` é nulo: sem sessão o guarda devolve à porta de entrada, e o atalho da Marta Reis entra pelo mesmo endereço de volta com `environment.loginDeTeste`.

**Muda em relação ao legado:** lá a correção de redação (`admin/correcao/redacao`) está com o guarda comentado e abre para quem tiver o endereço. Aqui ela pede sessão como o resto da área interna, porque a fila mostra nome, CPF e texto de candidato. Se a banca corrige sem conta no login único, isso precisa ser decidido antes de ir para produção.

## Rodar

- `npm install`
- `npm start` → http://localhost:4200/ (com `npm run mock` ao lado; ver "Backend de mentira")
- `npm test` · `npm run ds:checar` · `npm run build`

`npm run ds:checar` audita contra os contratos do DS os `.html` e também os templates embutidos nos `.ts`. A conta da ADR-023 ("uma vista, um primário") é refeita aqui pelo que a pessoa vê de uma vez (`tools/lib/primarios.mjs`): ramos de `@if`/`@else`, `@case` e `@for`/`@empty` são alternativas, e um `<ucam-dialog>` é uma vista própria — o núcleo do `@ucam/ds-mcp` soma todos os primários do texto e acusava cinco no resultado, onde nunca aparece mais de um. Teste: `node --test tools/primarios.test.mjs`.

Backend: `src/environments/environment.ts` (`backend`, `backendApi`). Em produção os marcadores `DEPLOY_PROCESSO_BACKEND` e `UNIDADE_REFERENCIA` são trocados no deploy, como no app legado.

## Design system

`@ucam/ui`, `@ucam/tokens` e `@ucam/css` entram por tarball (ver `package.json`; por `file:` a partir de `../../dist/pacotes`, gerados por `pnpm dist` na raiz do repositório — de propósito: o app de referência anda junto com a biblioteca do mesmo commit). Um app fora deste repositório instala os mesmos tarballs pela URL publicada, `https://ucam-ds.vercel.app/pacotes/ucam-ui-<versão>.tgz` e os irmãos. Para subir de versão, troque o número nos quatro caminhos e rode `npm install`. Regras e contratos: o `AGENTS.ucam.md` que o kit `@ucam/ds-mcp` instala e o servidor MCP `ucamds`.

No Trilho B o app importa também `@ucam/css/ucam.css` e põe `class="ucam"` no `<body>`: os componentes `<ucam-*>` usam classes `.ucam-*` e os blocos de layout (`ucam-stack`, `ucam-split`, `ucam-login`…) vivem nessa folha.

## Estrutura

- `src/app/core` — `api/` (endpoints do legado, tipados), `model/`, `store/` (signals), `offline/` (fila de respostas), `tempo/` (relógio da prova), `guards/` (situação do candidato), `directives/`.
- `src/app/candidato` — uma pasta por tela: `entrada`, `instrucoes`, `prova` (cabeçalho, mapa, questão, redação, entrega), `resultado`, `erro`, `sem-link`.
- `src/app/banca` — a área interna: `sessao.ts`, `banca.guard.ts` e `entrar.ts` (login), `moldura-banca.ts`, `correcao` (redações), `provas` (cadastro) e `isencao` (fila e análise).
- `src/app/isencao` — o acompanhamento da isenção pelo candidato.
- `src/app/layout` — `moldura.ts` (o `ucam-app-shell` do candidato, com as etapas na coluna), `links-internos.ts` (os `<a href>` que o DS desenha passam pelo roteador em vez de recarregar o app), relógio da faixa e tema.

## Documentos

- Spec: `docs/superpowers/specs/2026-10-01-candidato-prova-design.md`
- Plano: `docs/superpowers/plans/2026-10-01-candidato-prova.md`

## Pendências

Do produto:

- Passagem com o backend de verdade. Em 01/10/2026 as telas de candidato e de banca (redações e provas) foram percorridas no navegador contra o backend de mentira — desktop, 390px e tema escuro —, mas nenhuma contra o backend real nem contra o login único e o gerencial de produção (as três consultas da volta do login foram copiadas do legado, não exercitadas).
- Decidir se a correção de redação exige login (ver "Login da área interna").
- O cadastro de questões edita em texto simples; o legado usa editor rico. Negrito, lista e imagem de uma questão antiga se perdem se ela for regravada por aqui.
- Endpoint agregado de respostas (uma chamada em vez de uma por questão) é pedido ao backend.
- `admin/correcao/questao` do legado não foi trazido: lá é só um esboço.

Do design system:

- **Corrigidos na fonte em 01/10/2026** (`ucamds`, commit `00c44ba`, com spec na biblioteca; tarballs em `../ucamds/dist/pacotes` já regerados): a tinta da faixa de marca no tema escuro, a barra de visão que grudava por baixo da faixa, o NG0952 do `<ucam-tabs>`, o rodapé e o foco inicial do `<ucam-dialog>`, o `rows` do `<ucam-textarea>` como piso, e as três entradas do `<ucam-app-shell>` que faltavam no contrato. Também a moldura dupla do `<ucam-input-group>` (commit `7e94a57`).
- **Adotados aqui em 02/10/2026.** O app reinstalou o `@ucam/ui` e o `@ucam/ds-mcp` dos tarballs novos, e os contornos saíram do código: os três blocos de `styles.css` (faixa no tema escuro, barra sob a faixa, folha da redação), o `@if` em volta do `<ucam-tabs>`, o ` button` de `initialFocus` nos diálogos e a lista `DESVIOS` de `tools/ds-checar.mjs`, que ficou vazia. A versão dos pacotes não mudou (0.1.1): quem já tem o `node_modules` antigo precisa de `npm cache clean --force` e `npm install --force ../ucamds/dist/pacotes/ucam-ui-0.1.1.tgz ../ucamds/dist/pacotes/ucam-ds-mcp-0.1.1.tgz` com o `ng serve` parado, senão o npm serve o tarball velho.
- **Corrigidos na fonte em 03/10/2026 e adotados aqui (`ucamds` 0.1.2, com spec na biblioteca):** o `<ucam-file-field>` passou a entregar o `File` em cada linha do modelo (`UcamFile.file`), e a diretiva `isencao/arquivos-escolhidos.ts` saiu; o `<ucam-segmented>` ganhou `allowEmpty` (grupo sem escolha, clicar de novo desfaz), e "Sem decisão" deixou de ser uma quarta opção na análise de isenção; o botão e o botão de ícone desabilitados têm o chão e a aresta da ADR-042 em cor explícita, no lugar do `opacity-50` da base (gancho `data-ucam-variant` no `<button>` interno; medido no navegador nos dois temas); os contratos ganharam `icon` do `ucam-badge` e `labelHidden` de `ucam-text-field` e `ucam-select`; e o `<ucam-app-shell>` carimba `data-sistema` no contêiner de overlay do CDK, porque a gaveta, o menu, o select e o tooltip da base são montados fora do shell e abriam em bordô num sistema teal (a folha e a ponte declaram a subpaleta também ali). O segmentado também trocou o `queueMicrotask` da checagem de desenvolvimento por `afterNextRender`, a mesma correção das abas.
- **Publicado em 06/10/2026.** A 0.1.3 está em `https://ucam-ds.vercel.app/pacotes/`, com tudo o que está acima. Este app continua em `file:` por estar no mesmo repositório da biblioteca.

Desvio declarado do contrato: na questão da prova a alternativa escolhida não leva o check do `choice-card` — ao lado de uma resposta de prova, check lê como "certa". O segundo sinal além da borda é a letra preenchida, como no cartão-resposta (`questao.ts`).

Decisões da prova (02/10/2026):

- **Mapa de questões** (`mapa-questoes.ts`): a respondida é a bolha cheia (tinta de ação, a mesma da letra escolhida ao lado), a em branco é a bolha vazia (só contorno), e a atual leva um anel por dentro do botão — por dentro para não brigar com o anel de foco do DS, que fica por fora. Cheio contra vazio é forma e luminância, não matiz: sobrevive ao daltonismo. A legenda explica os dois desenhos e "Próxima em branco" (`ProvaStore.proximaEmBranco`) poupa a procura em prova longa. A bolha cheia não é um botão primário: é o estado "preenchida" do cartão-resposta, e não entra na conta da ADR-023. Redesenho de 03/10/2026: as bolhas ficam numa grade de colunas fixas (a 1 de Matemática cai sob a 1 de Português), o cabeçalho de grupo é leve (nome em `label`, contagem em `caption`, sem filete), "Próxima em branco" é botão secundário `sm` na largura toda — a única ação do painel —, a redação é um item largo do mesmo cartão (vazia, cheia ao atingir o mínimo, anel quando aberta) em vez de seção própria, e a legenda vai para o pé, em colunas. Na coluna lateral da moldura, o candidato é um `ucam-card`: avatar com as iniciais e o nome no alto, e CPF, curso e turno abaixo no arranjo `painel` da lista de descrição, com um ícone por rótulo e a coluna do rótulo encolhida para 5rem (o DS a declara no próprio `dl`, então o ajuste é um `::ng-deep` em `moldura.ts` — utilitária do Tailwind não vence a folha do DS, que não tem camada); o relógio no turno é o desenho mais próximo que o conjunto curado tem — o DS registra `clock` como prazo, então é um desvio a decidir.
- **Marcar para revisar** (`ProvaStore.revisar`): anotação da pessoa, não resposta — o backend não tem campo, então vive só no navegador (`revisar:<oidCandidatoProva>`) e some com a entrega; quem troca de aparelho perde as marcas. Na questão é um botão de alternância (`aria-pressed`, rótulo fixo, sem ícone porque o conjunto curado não tem bandeira e `star`/`pin` têm outro uso); no mapa é um ponto no canto da bolha, em `<span>` porque o DS já ocupa o `::after` do botão para o alvo de toque; o nome acessível ganha ", marcada para revisar". O diálogo de entrega lista as marcadas, e "Revisar" vai à primeira em branco ou, sem em branco, à primeira marcada. Com tudo respondido, o atalho do mapa vira "Próxima marcada".
- **Troca de questão** (`questao.ts`, `styles.css`): o artigo é recriado a cada questão (`@for` de um item), entra pelo lado de onde veio (avançando, da direita; voltando, da esquerda) com os papéis de motion do DS, e o foco vai ao título da questão — quem navega por teclado ou leitor de tela começa a ler de onde a questão começa (WCAG 2.4.3). Marcar uma alternativa anuncia "Alternativa B marcada" por `role=status`. A redação faz o mesmo: foco no artigo ao abrir. `prefers-reduced-motion` é a regra global do DS.

## Backend de mentira (desenvolvimento)

`npm run mock` sobe em `http://localhost:8030/` um servidor que imita os endpoints do legado com dados fictícios em memória (`tools/mock-backend.mjs`). Com ele e o `npm start`:

- http://localhost:4200/candidato/ana — prova objetiva + redação
- http://localhost:4200/candidato/bruno — só objetiva, corrigida na hora
- http://localhost:4200/ → "Marta Reis" — a área interna, pelo login de mentira (direto em `/banca` sem sessão, o guarda devolve à porta de entrada). Abre na fila de redações, com cinco em espera e duas corrigidas de saída
- http://localhost:4200/banca/isencao — a fila de isenção de disciplinas da secretaria e a análise de cada solicitação (cinco em análise, duas concluídas de saída)
- http://localhost:4200/isencao/joao — o candidato acompanha a isenção (troque `joao` por `marcos` para ver um pedido de documento, ou por `pedro` para ver uma concluída)
- http://localhost:4200/banca/provas — o cadastro de provas: o caderno de redação de cada processo seletivo e a questão com a proposta. Editar a proposta de 2026/2 · Vestibular online · Geral muda o que os candidatos de teste leem

Quem dá o resultado da prova com redação é a banca: a redação entregue entra na fila de `/banca`, e a nota gravada lá fecha a correção (no mock, aprova quem acertou metade da objetiva e tirou 5 ou mais na redação — suposição do protótipo; a regra real é do backend). `BANCA=30 npm run mock` liga a correção automática 30 s depois da entrega, para demonstrar só o lado do candidato.

`TEMPO=00:03:00 npm run mock` encurta a prova para testar o tempo esgotado. Reiniciar o mock zera tudo.

Para refazer a prova sem reiniciar: em http://localhost:4200/ os atalhos dos candidatos de teste chamam `POST /mock/nova-prova/<oid>` antes de entrar — prova já entregue ou corrigida volta ao zero, prova em andamento continua. A rota só existe no mock (`environment.mockNovaProva`, nulo em produção). Qualquer outro código digitado no campo cria um candidato novo.
