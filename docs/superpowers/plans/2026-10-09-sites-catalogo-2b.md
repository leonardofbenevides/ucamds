# UCAMDS Sites — Fatia 2b: peças e moldura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Nove peças novas no catálogo dos sites — avatar, accordion, pagination, input, newsletter-form, breadcrumb, page-shell, site-header e site-footer —, cada uma com contrato, demo e seção na folha, pelo pipeline que a fatia 2a provou.

**Architecture:** Nada de ferramenta nova. Cada peça é um contrato em `sites/spec/components/`, uma entrada em `sites/spec/demos.json` e uma seção em `tools/build-sites-css.mjs`. Tudo CSS puro: o que pede estado usa elemento nativo (`<details>` no acordeão e no menu do cabeçalho). O índice passa a derivar as decisões de cada peça das ADRs que o próprio contrato cita.

**Tech Stack:** o da fatia 2a.

**Spec:** `docs/superpowers/specs/2026-10-08-sites-catalogo-design.md` (seção "Divisão em fatias", linha 2b).

**Forma deste plano.** Diferente dos dois anteriores, ele não traz o JSON integral dos nove contratos: traz, por peça, as decisões que o contrato registra (classes, variantes, tokens, estados, acessibilidade, evidência). O texto sai na execução, no molde de `sites/spec/components/button.json`, e quem o julga é `validate-sites-spec`. Autor e executor são a mesma sessão; duplicar 60 KB de JSON no plano era custo sem leitor.

## Global Constraints

- As da fatia 2a, todas. Em especial: byte a byte das saídas da aplicação; só `min-width` e só os quatro viewports; só token semântico dos sites; sem `color-mix`, `oklch()` nem hex; classes `.ucam-site-*`.
- `sites/spec/tokens/semantic.json` é editado como TEXTO, uma linha por token. Nunca por `JSON.stringify`.
- Alvo de toque de 44px em tudo que recebe clique (paginação, gatilho do acordeão, botão do menu).
- Sem JavaScript: nenhuma peça depende de script. O que CSS não entrega fica dito no contrato como "não entrega".
- Regex com barra invertida nunca por heredoc ou `sed`: Write, Edit ou script `.cjs`.
- Worktree `../DSUCAM-sites`, branch `sites-2b` a partir da `main`.

## Review Focus

1. O acordeão e o menu do cabeçalho funcionam sem JavaScript e por teclado (Enter e Espaço no `<summary>`), e o marcador nativo do `<summary>` não aparece.
2. Abaixo de `nav-aberta` o cabeçalho mostra o botão de menu e esconde a navegação; acima, o inverso. Nenhuma das duas navegações fica visível ao mesmo tempo.
3. O campo com erro se diz por texto e por `aria-invalid`, não só por cor; a borda do campo passa 3:1.
4. Toda peça sobre `.ucam-site-inverso` (rodapé, trilha no hero, newsletter) lê a 4,5:1.
5. A página de cada peça lista só as ADRs que o contrato dela cita.

## As nove peças

| Peça | Categoria | Raiz | Partes e variantes | Tokens novos | Evidência |
|---|---|---|---|---|---|
| avatar | conteudo | `.ucam-site-avatar` | `--sm` 32, md 40, `--lg` 56; `--logo` (quadrado, borda, fundo branco, imagem contida) | `size.avatar-sm`, `size.avatar-lg` | depoimentos do `www`; avatar do kit (logo de empresa conveniada) |
| accordion | conteudo | `.ucam-site-accordion` | `__item` (`<details>`), `__trigger` (`<summary>`), `__icon`, `__panel`; `name` igual torna exclusivo | `size.icon-button` | FAQ do CENPRE; "Como ingressar?" do `www` |
| pagination | navegacao | `.ucam-site-pagination` | `__item` (44px, `aria-current="page"`), `__item--seta`, `__reticencias`; `aria-disabled` | — | painel de vagas (página 1 de 89), 36px no kit |
| input | formulario | `.ucam-site-input` | `__label`, `__field`, `__icon`, `__hint`, `__erro`; erro por `aria-invalid="true"` | — | busca de vagas e formulário de indicação do CENPRE; borda de 1,3:1 no kit |
| newsletter-form | formulario | `.ucam-site-newsletter` | `__titulo`, `__campos`, `__nota`; `--inverse` | — | "Mais de 30 mil alunos formados" no `www` |
| breadcrumb | navegacao | `.ucam-site-breadcrumb` | `__list` (`<ol>`), `__item`, separador por `::before`; `--inverse` | — | hero das subpáginas do CENPRE (branco a 70% sobre a foto) |
| page-shell | layout | `.ucam-site-page` | `__main`; `.ucam-site-skip`; `.ucam-site-container` (`--faixa`, `--prosa`); `.ucam-site-secao` (`--sutil`) | — | mixin `container()` do kit; gutter de 72 do Figma |
| site-header | layout | `.ucam-site-header` | `__bar`, `__brand`, `__logo`, `__nav`, `__link` (`aria-current`), `__actions`, `__menu` (`<details>`), `__toggle` (`<summary>`), `__mobile` | `size.header`, `size.logo` | cabeçalho do CENPRE; mega-menu do `www` fica fora |
| site-footer | layout | `.ucam-site-footer` | `__inner`, `__grid`, `__brand`, `__logo`, `__col`, `__col-title`, `__link`, `__contact`, `__bottom`, `__legal`, `__social` | `size.logo-footer` | rodapé do CENPRE (5 colunas) e do `www` (4 colunas + e-MEC) |

Decisões que valem para várias:

- **Borda de campo** é `color.border.strong` (3,47:1), não a `default` do kit (1,3:1): é o limite que identifica o controle (WCAG 1.4.11).
- **Paginação a 44px**, não os 36 do kit: é alvo de toque.
- **Rede social no rodapé é link de texto.** O sprite compartilhado não tem marcas (o Lucide as retirou), e ícone de marca sem nome é o que a acessibilidade pede para não fazer.
- **O cabeçalho não entrega** mega-menu nem fechamento do menu ao navegar: é CSS puro. Fica dito no contrato; a lib Angular do subprojeto 3 entrega.
- **`vs`**: avatar × icon-chip (pessoa ou empresa × conceito). **Composição**: newsletter-form usa input e button; site-header usa button; page-shell usa site-header e site-footer.

## Decisões na página (pendência da 2a)

`build-sites-index` acrescenta a cada componente `decisoes`: os ids de ADR que o texto do contrato cita, na ordem do `adr.json`. A página troca `sitesDecisoesQueAfetam(id)` por essa lista. Não toca em `spec/decisions/adr.json`: pôr seletores dos sites em `afeta` faria o validador da aplicação avisar "ainda não tem contrato", e o contrato já diz quais decisões o governam.

## Tasks

- [ ] **Task 0 — branch e linha de base.** `git checkout -b sites-2b main` na worktree; `pnpm install`; gerar e guardar `dist/tokens`, `dist/css`, `dist/fonts`, `spec.data.json`, `estados.css`; comparador.
- [ ] **Task 1 — tokens.** Seis tokens em `size` (`avatar-sm` 2rem, `avatar-lg` 3.5rem, `icon-button` 2rem, `header` 4rem, `logo` 2rem, `logo-footer` 2.5rem), inseridos como texto. `node tools/build-sites-tokens.mjs` verde.
- [ ] **Task 2 — testes que falham.** Em `tools/test/sites-2b.test.mjs`: (a) a folha emite a classe-raiz e as partes de cada uma das nove peças; (b) a folha não tem regra para `summary` sem escopo e esconde o marcador nativo dos dois `<summary>`; (c) `nav` e `menu` do cabeçalho trocam de visibilidade no viewport `nav-aberta`; (d) `validar` na spec real dá 13 contratos e zero erro; (e) `construirIndice` dá 13 e `decisoes` do button contém ADR-068 e ADR-048 e não contém ADR-056. Atualizar para 13 as três asserções que cravam 4. Rodar e ver falhar.
- [ ] **Task 3 — a folha.** Nove seções em `tools/build-sites-css.mjs`, na ordem da tabela. Os portões dizem o que faltar.
- [ ] **Task 4 — contratos e demos.** Nove contratos e nove demos, gerados por um script `.cjs` de objetos (arquivos novos; formato livre). `usada_por` em button e input, `vs` em icon-chip. `validate-sites-spec` verde.
- [ ] **Task 5 — decisões.** `decisoes` no índice e na página; remover `sitesDecisoesQueAfetam`.
- [ ] **Task 6 — build e captura.** `pnpm run build`; comparador; foto de `/sites` e de cada peça por CDP, em 1440 e 390 de largura para cabeçalho e rodapé; abrir o acordeão e o menu por teclado. Corrigir o que a captura mostrar.
- [ ] **Task 7 — revisão e entrega.** Revisor fresco sobre a branch; um passo de correção com teste antes; README dos sites; mescla na `main`.
