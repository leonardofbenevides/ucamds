# Vestibular Online · UCAM

Fluxo do candidato (entrada, prova objetiva, redação e resultado) construído com o UCAMDS (Trilho B): Angular 21, `@ucam/ui`, `@ucam/tokens` e `@ucam/css`.

## Rodar

- `npm install`
- `npm start` → http://localhost:4200/candidato/<oidFormaIngressoPessoa>
- `npm test` · `npm run ds:checar` · `npm run build`

Backend: `src/environments/environment.ts` (`backend`, `backendApi`). Em produção os marcadores `DEPLOY_PROCESSO_BACKEND` e `UNIDADE_REFERENCIA` são trocados no deploy, como no app legado.

## Design system

`@ucam/ui`, `@ucam/tokens` e `@ucam/css` entram por tarball (ver `package.json`; hoje por `file:` a partir de `../ucamds/dist/pacotes`, até a 0.1.1 ser publicada em `ucam-ds.vercel.app`). Para subir de versão, troque o número nas três URLs e rode `npm install`. Regras e contratos: `../AGENTS.ucam.md` e o servidor MCP `ucamds`.

No Trilho B o app importa também `@ucam/css/ucam.css` e põe `class="ucam"` no `<body>`: os componentes `<ucam-*>` usam classes `.ucam-*` e os blocos de layout (`ucam-stack`, `ucam-split`, `ucam-login`…) vivem nessa folha.

## Estrutura

- `src/app/core` — `api/` (endpoints do legado, tipados), `model/`, `store/` (signals), `offline/` (fila de respostas), `tempo/` (relógio da prova), `guards/` (situação do candidato), `directives/`.
- `src/app/candidato` — uma pasta por tela: `entrada`, `instrucoes`, `prova` (cabeçalho, mapa, questão, redação, entrega), `resultado`, `erro`, `sem-link`.
- `src/app/layout/moldura.ts` — o `ucam-app-shell` configurado.

## Documentos

- Spec: `docs/superpowers/specs/2026-10-01-candidato-prova-design.md`
- Plano: `docs/superpowers/plans/2026-10-01-candidato-prova.md`

## Pendências

- Passagem manual com o backend ligado (candidato real em cada situação), nas larguras de 390px e desktop e nos dois temas, ainda não foi feita: os testes automatizados cobrem a lógica e a marcação, não a renderização no navegador.
- Trilho B do DS: o botão desabilitado ainda não tem o "chão" e a "aresta" da ADR-042 — a base ZardUI só tira a opacidade. O `@ucam/ui` precisa de CSS de estado para `button[disabled]` e `[aria-disabled]`.
- Endpoint agregado de respostas (uma chamada em vez de uma por questão) é pedido ao backend.
- Publicar o `@ucam/ui` 0.1.1 (imports relativizados, `styles.css` autocontido, `disabled`/`aria-disabled` no primeiro render) e trocar os `file:` por URL.
