# UCAMDS — Design System da Universidade Candido Mendes

Um contrato em JSON, muitos consumidores gerados a partir dele: CSS puro para os
sistemas legados, componentes Angular para os novos, o site de documentação, e um
servidor MCP para agentes de IA.

**A regra que governa tudo:** se uma informação existe em dois lugares, um deles
está errado. Cor de botão, nome de prop, requisito de acessibilidade, texto de
rótulo — nasce em `spec/` e é *gerado* nos consumidores. Editar arquivo gerado à
mão é bug, e o próximo `pnpm build` apaga a edição.

## Rodando

Precisa de **Node 24** e **pnpm 11** (o Angular 22 recusa versões abaixo).

```bash
pnpm install
pnpm build      # gera tudo: tokens, CSS, componentes, telas, site
pnpm dev        # sobe o site de documentação em modo desenvolvimento
```

O `pnpm build` é a única forma de ver o resultado de uma mudança. Um clone recém-feito
não tem CSS, não tem telas e não tem site — tudo isso é saída.

Outros atalhos úteis:

| Comando | O quê |
|---|---|
| `pnpm validate` | Só os portões da spec. Rápido, roda antes de qualquer commit |
| `pnpm telas` | Regera as 23 telas autônomas |
| `pnpm css` | Regera `dist/css/ucam.css` |
| `pnpm dev:legado` | Serve o catálogo antigo (`docs/index.html`), estilo Storybook |
| `pnpm dist` | Build completo + biblioteca Angular + pacotes publicáveis |

## O mapa

**Fonte — edite aqui:**

```
spec/               49 contratos de componente, tokens em 3 camadas,
                    42 ADRs, padrões, adaptadores
  tokens/           primitive → semantic → brand. Componente que lê
                    primitivo direto quebra tema escuro e multi-marca
  components/       um JSON por componente: props, estados, a11y,
                    conteúdo, migração do legado e a evidência que justifica
  decisions/        adr.json — o porquê de cada regra
  schema/           JSON Schema que valida os contratos no build
tools/              24 geradores e portões
site/src/app/       o site de documentação (Analog + Angular 22)
ui/projects/        a biblioteca Angular sobre base ZardUI
elements/           web components
APPSUCAM/           prints do Protocolo e do SigFin — a evidência bruta
                    citada por 47 specs. Material interno, não publicado
```

**Saída — não edite, não está no git:**

```
dist/               tokens, CSS, ícones, fontes, kit de agentes
docs/               catálogo legado (exceto docs/superpowers/, escrito à mão)
site/src/assets/t/  as 23 telas autônomas
site/src/assets/tokens/  o CSS de tokens que o site serve em /tokens
site/src/generated/ dados que o site consome
site/dist/          o site construído, que é o que a Vercel publica
```

## Os trilhos

O mesmo componente existe em mais de uma forma, e elas têm de ser indistinguíveis.
Quem consome não escolhe por gosto: escolhe pela resposta a **uma pergunta — a
aplicação tem passo de build?** O seletor é um só e mora em
`spec/migracao.json` (`escolhaDoTrilho`: a `pergunta`, a `nota` de ponte e destino,
e o `quando` de cada trilho). Dele saem a home, a página de instalação, o guia de
migração e o AGENTS.md — ver ADR-045.

- **Trilho A** — folha de estilo pura (`dist/css/ucam.css`). É o que os sistemas
  legados em JSF/PrimeFaces e AngularJS conseguem consumir hoje, sem reescrita.
  É **ponte**: existe enquanto o parque não atravessa.
- **Trilho A+** — o bundle de custom elements (ADR-010), para as telas do legado
  que precisam de um componente que CSS não desenha. Não é o A melhorado, e não
  convive com a biblioteca Angular na mesma página.
- **Trilho B** — componentes Angular em `ui/`. É o **destino**: para onde os
  sistemas novos e os migrados vão.

`pnpm ui` traduz os tokens de tamanho da spec para as classes do Tailwind e cobra o
valor na base do Trilho B. Esse portão existe porque os dois já divergiram: botão com
32px de altura de um lado e 36px do outro, enquanto o catálogo prometia "a mesma
marca, os mesmos tokens". As cores passavam pela ponte de tokens; a geometria não
passava por lugar nenhum.

## Os portões

O `pnpm build` não é só geração — são verificações encadeadas, e qualquer uma
derruba o build inteiro (a última delas roda no `pnpm dist`, depois do site):

| Portão | Pergunta que ele faz |
|---|---|
| `validate-spec` | Os contratos batem com o schema e o grafo de composição fecha? |
| `check-crases` | Alguma crase nua dentro de um `template:` do Angular? |
| `check-daltonismo` | As séries de gráfico continuam separáveis para quem não vê cor? |
| `check-marca-vs-destrutivo` | O bordô da marca e o vermelho de excluir ainda são duas cores? |
| `check-subpaleta` | A cor de cada sistema é legível e diferente do tom semântico ao lado? |
| `check-faixa` | A faixa superior respeita a ADR-038? |
| `check-geometria` | Trilho A e Trilho B têm a mesma medida? |
| `check-obrigatoriedade` | Todo asterisco tem `required`/`aria-required` no controle? |
| `check-regra-anexo` | A frase do anexo diz o que o campo realmente aceita? |
| `check-agentes` | O kit em `dist/agentes/` ainda corresponde à spec? |
| `build-publicacao` | Toda URL que a documentação ensina existe mesmo na saída publicada? |

Cada um nasceu de um defeito real que passou despercebido. Se um portão te barrar,
ele está descrevendo um bug de verdade — o comentário no topo do arquivo conta qual.

## Publicação

A Vercel constrói a partir deste repositório: roda `pnpm dist` e publica
`site/dist/analog/public`. A configuração está em `vercel.json`. `APPSUCAM/`,
`spec/` e o resto ficam no repositório.

Vai ao ar o site e mais o design system servido por URL, porque a
documentação o promete e o parque legado não tem passo de build — o que não
está numa URL, para ele não existe:

| Rota | O quê |
|---|---|
| `/css/` | `ucam.css` e `ucam-fonts.css`. Dois `<link>` e o Trilho A funciona, sem instalar nada |
| `/tokens/` | O CSS de tokens, para quem só quer as variáveis. `ucam.css` já o importa |
| `/fonts/` | Os `.woff2` da Geist, que a folha de fontes carrega |
| `/icons/` | `sprite.svg`, para o app **baixar e servir da própria origem** — `<use>` externo é same-origin |
| `/elements/` | O bundle do Trilho A+ (ADR-010): um `<link>`, um `<script>`, e `<ucam-combobox>` existe |
| `/pacotes/` | Os tarballs, o artefato instalável enquanto não houver registro privado |

A árvore publicada espelha `dist/`, e isso não é arrumação: `ucam.css` faz
`@import "../tokens/…"` e a folha de fontes aponta para `../fonts/…`. Publicar
`css/` longe de `tokens/` e `fonts/` devolveria 200 no `<link>` e 404 em tudo
que ele carrega.

O `build-publicacao` confere três coisas: toda URL ensinada em
`spec/resources.json` — no bloco de código e na prosa — tem de existir como
arquivo na saída; todo pacote marcado `gerado` tem de ter tarball baixável; e
tudo que as folhas publicadas carregam por caminho relativo tem de estar lá
também. Por isso o comando da Vercel é
`pnpm dist` e não `pnpm build` — é o `dist` que constrói a biblioteca Angular
e empacota.

## Para agentes de IA

`pnpm agentes` gera `dist/agentes/`: um servidor MCP sem dependências, a CLI
`ucam-ds`, skills e um `AGENTS.md`. Um agente pergunta
`ucam_get_component("button")` e recebe o contrato exato — variantes válidas,
tokens aplicados, regras de a11y, mapa de migração — em vez de inventar props.
