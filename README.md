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

`npm run ds:checar` audita contra os contratos do DS os `.html` e também os templates embutidos nos `.ts`. As três entradas do `<ucam-app-shell>` que a biblioteca tem e o contrato ainda não lista (`systemIcon`, `homeHref`, `navGroups`) saem como desvio declarado, não como erro.

Backend: `src/environments/environment.ts` (`backend`, `backendApi`). Em produção os marcadores `DEPLOY_PROCESSO_BACKEND` e `UNIDADE_REFERENCIA` são trocados no deploy, como no app legado.

## Design system

`@ucam/ui`, `@ucam/tokens` e `@ucam/css` entram por tarball (ver `package.json`; hoje por `file:` a partir de `../ucamds/dist/pacotes`, até a 0.1.1 ser publicada em `ucam-ds.vercel.app`). Para subir de versão, troque o número nas três URLs e rode `npm install`. Regras e contratos: `../AGENTS.ucam.md` e o servidor MCP `ucamds`.

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

- **Corrigidos na fonte em 01/10/2026** (`ucamds`, commit `00c44ba`, com spec na biblioteca; tarballs em `../ucamds/dist/pacotes` já regerados): a tinta da faixa de marca no tema escuro, a barra de visão que grudava por baixo da faixa, o NG0952 do `<ucam-tabs>`, o rodapé e o foco inicial do `<ucam-dialog>`, o `rows` do `<ucam-textarea>` como piso, e as três entradas do `<ucam-app-shell>` que faltavam no contrato. Conferido numa cópia do app com os pacotes novos e sem os contornos: 157 testes, `ds:checar` sem desvio e as sete medições no navegador.
- **Falta adotar aqui.** O `node_modules` deste app ainda tem os pacotes antigos, e por isso os contornos continuam no código — eles funcionam com a biblioteca antiga e com a nova. Para adotar, com o `ng serve` parado: `npm cache clean --force` e `npm install --force ../ucamds/dist/pacotes/ucam-ui-0.1.1.tgz ../ucamds/dist/pacotes/ucam-ds-mcp-0.1.1.tgz` (a versão não mudou, e sem limpar o cache o npm serve o tarball velho). Depois saem: em `styles.css`, os blocos "A FAIXA NO TEMA ESCURO", "A BARRA DA TELA GRUDA SOB A FAIXA" e "A FOLHA DA REDAÇÃO"; o `@if` em volta do `<ucam-tabs>` em `banca/correcao/correcao.html` e `banca/isencao/fila.html`; o ` button` de `initialFocus="[data-foco] button"` nos diálogos; e a lista `DESVIOS` de `tools/ds-checar.mjs`.
- O botão desabilitado ainda não tem o "chão" e a "aresta" da ADR-042 — a base ZardUI só tira a opacidade.
- O contrato do `ucam-badge` não lista `icon`, que a biblioteca tem (o app deixou de usar); `labelHidden` de `ucam-text-field` e `ucam-select` também não está no contrato.
- Publicar o `@ucam/ui` 0.1.1 (imports relativizados, `styles.css` autocontido, `disabled`/`aria-disabled` no primeiro render) e trocar os `file:` por URL.

Desvio declarado do contrato: na questão da prova a alternativa escolhida não leva o check do `choice-card` — ao lado de uma resposta de prova, check lê como "certa". O segundo sinal além da borda é a letra preenchida, como no cartão-resposta (`questao.ts`).

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
