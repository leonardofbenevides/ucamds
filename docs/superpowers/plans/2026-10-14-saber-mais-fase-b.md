# Fase B do saber-mais: as páginas de curso com as peças dos Sites

Data: 14/10/2026. Segue a spec `docs/superpowers/specs/2026-10-14-saber-mais-sites-design.md` e a fase A
(`2026-10-14-saber-mais-fase-a.md`, feita na branch `sites-saber-a`).

**Objetivo.** `/mestrado` e `/doutorado` montadas com `@ucam/site-ui` e `@ucam/site-css`, com o mesmo texto e a
mesma ordem de leitura de hoje, e sem os componentes próprios que redesenham o que os Sites já têm.

**Onde.** Duas partes:
- **B1, no DSUCAM** (worktree `DSUCAM-sites`, a mesma branch da fase A): as duas lacunas que a leitura do
  saber-mais achou e o plano da A não previu.
- **B2, no saber-mais** (`Documents/Nova pasta/saber-mais`, branch nova `ucamds-sites` a partir da `main`).
  Commits só locais: o projeto não tem remoto. `pnpm publicar` NÃO é rodado.

## O que a leitura do saber-mais achou (14/10/2026)

| Componente local | Vira | Observação |
|---|---|---|
| `casca/cabecalho` | `site-header` | a marca é a logo da UCAM em imagem; o `site-header` só tem marca em texto (pendência registrada desde a 3a-2). **Lacuna 1.** |
| `casca/faixa-curso` | `editorial-page-hero` sobre foto | trilha, nível, título, resumo, três pílulas, duas ações e a linha "o programa também tem…" no encaixe geral |
| `casca/turma` | `card` de destaque com duas `fact-sheet` | "Próxima turma" vira tag de marca na meta do cartão |
| `casca/argumentos` | `section-heading` + `stats-band` com frase | |
| `pagina/pagina` (ucam-tabs) | `section-tabs` | as abas passam de `role="tab"` a links com hash; o painel vira região com nome |
| `comum/titulo-secao` | `section-heading` | o ladrilho com ícone sai: a peça dos Sites não tem, e o título já diz a seção |
| `comum/topicos` | lista dentro de `ucamSiteProse` | o traço bordô vira o marcador da prosa |
| `comum/acordeao` (normal) | `accordion` | a contagem à direita ("3 projetos") não existe no item dos Sites. **Lacuna 2.** |
| `comum/acordeao` (discreto, "Ler o texto completo") | fica local nesta fase | é um "mostrar mais", não acordeão; candidato a peça na fase C |
| `comum/linha-do-tempo` | `timeline` | passa de quatro colunas a vertical em toda largura |
| `abas/contato` | `section-heading` + `contact-card` | |
| `casca/chamada` | `editorial-cta` | o brilho decorativo sai |
| `casca/rodape` | `site-footer` | |
| `comum/vitrine-publicacoes` | fica local | não há peça de grade com filtro (spec) |

## B1 — as duas lacunas, no DSUCAM

1. **`site-header` com logo.** Entrada `logo: { src; alt; width?; height? } | null`. Com ela, a marca é a imagem
   (o `alt` é o nome do link) e `brand` vira o texto ao lado da logo, opcional. Sem ela, como hoje. A folha mede a
   logo por `size.logo`. Contrato, demo (a logo da UCAM em `sites/spec/fotos/`), lib, testes, paridade.
2. **`accordion` com meta.** Entrada `meta` no item: texto curto à direita do título, na tinta de apoio, com
   números tabulares. Contrato, folha, demo, lib, testes, paridade.

Cada uma com commit próprio, sonda nas duas peças e pacotes refeitos.

## B2 — no saber-mais

**Tarefa 0: base.** Branch `ucamds-sites`. Antes de tocar em nada, a sonda de captura (a partir de
`scratchpad/saber/le.mjs`) roda contra `ng serve` local e guarda, para `/mestrado` e `/doutorado`: as capturas a
390, 768, 1280 e 1440, e a sequência de texto da página (títulos, parágrafos, itens, links, em ordem de documento,
com o texto normalizado). Depois de cada tarefa a sonda compara: o texto tem de ser igual, sem rolagem horizontal.

**Tarefa 1: os pacotes e a folha.**
- `vendor/ucam-site-css-0.1.5.tgz` e `vendor/ucam-site-ui-0.1.5.tgz`; as dependências no `package.json`.
- `src/styles.css` importa `@ucam/site-css/ucam-site.css`; `index.html` ganha `data-marca="cenpre"` na raiz.
- O sprite dos ícones dos Sites copiado de `node_modules/@ucam/site-css/icons/` para o público pelo `angular.json`;
  `provideUcamSite({ sprite: '/icons/sprite.svg' })` em `app.config.ts`.
- A captura confere que nada mudou só por carregar a folha (as duas folhas no mesmo documento).

**Tarefas 2 a 13**, uma por componente, nesta ordem (de fora para dentro, para cada troca ser visível sozinha):
2 rodapé · 3 chamada · 4 cabeçalho · 5 topo do curso · 6 turma · 7 argumentos · 8 título de seção · 9 tópicos ·
10 acordeão · 11 linha do tempo · 12 contato · 13 abas.

Em cada uma: troca dentro do componente que usa; componente local que vira só embrulho é apagado; os testes do
componente passam a olhar as classes e a estrutura da peça dos Sites (não o desenho antigo); `pnpm conferir`
verde; sonda de texto igual; captura antes e depois a 390 e 1280. Commit `feat: <peça> com o UCAMDS Sites`.

**Tarefa 14: fechamento.**
- A pasta `casca/` sem cor crua: a exceção dela sai de `ferramentas/guardas.mjs`, e o que sobrar de cor em
  `tema-site.css` é só o que as páginas de notícias e processos (fase C) ainda usam.
- `AGENTS.ucam.md`: a interface pública segue o UCAMDS Sites; o MCP dos sites é a fonte quando existir (3b).
- Prova completa: texto igual nas duas páginas, capturas lado a lado nas quatro larguras, nenhuma rolagem
  horizontal, foco por teclado visível do cabeçalho ao rodapé (sonda de Tab).
- Revisão independente e passada de correção.

## Riscos desta fase

- **Duas folhas no mesmo documento.** A da aplicação estiliza `body` e elementos nus. A captura de cada tarefa pega
  o que vazar; o que vazar é corrigido no saber-mais, não na folha dos Sites.
- **As abas mudam de padrão** (tablist para links com hash). O comportamento de hoje (hash, histórico, voltar,
  rolar até o painel quando a fileira está grudada) é o que os testes atuais descrevem, e eles são reescritos para
  o padrão novo sem perder nenhum desses comportamentos.
- **O texto muda onde a peça dos Sites não tem lugar para ele.** Se acontecer, a tarefa para e o caso vira lacuna
  do catálogo, como as duas da B1, em vez de o texto sumir.
