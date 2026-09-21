# spec/ — fonte da verdade do Design System UCAM

Tudo neste diretório é **contrato legível por máquina**. Nada aqui é documentação
para humano ler e traduzir na mão: cada arquivo é entrada de um gerador.

## O ciclo

```
                      ┌─────────────────────┐
                      │   spec/  (JSON)     │
                      │  tokens + contratos │
                      └──────────┬──────────┘
                                 │
        ┌──────────────┬─────────┼──────────┬────────────────┐
        ▼              ▼         ▼          ▼                ▼
  @ucam/tokens    @ucam/css  @ucam/ui   site de docs    servidor MCP
  CSS vars        legado     Angular    catálogo        agentes de IA
  SCSS / JSON     AngularJS  22         navegável       (Claude, Copilot)
```

O `dist/tokens/ucam-tokens.json` é o token resolvido, em formato DTCG — é por ele
que um dia entram as variáveis do Figma. Essa ponte ainda não foi construída.

**Regra única:** se uma informação existe em dois lugares, um deles está errado.
Cor de botão, nome de prop, requisito de acessibilidade, texto de rótulo — tudo
nasce aqui e é *gerado* nos consumidores. Editar o CSS gerado à mão é bug.

## Por que SDD, concretamente

Sem spec estruturada, o servidor MCP devolve prosa e o agente inventa props que
não existem. Com spec estruturada, o MCP responde `ucam_get_component("button")`
com o contrato exato — variantes válidas, tokens aplicados, regras de a11y,
mapa de migração do legado. É a diferença entre um agente que chuta e um que sabe.

O mesmo vale para o time humano: o desenvolvedor não precisa adivinhar se
"redefinir senha" é `danger`. A spec já respondeu, com o motivo.

## Estrutura

```
spec/
├── tokens/
│   ├── primitive.json   camada 1 — valores brutos, ninguém referencia direto
│   ├── semantic.json    camada 2 — intenção de uso, ÚNICA camada pública
│   └── theme.dark.json  camada 3 — sobrescritas de tema
├── components/          49 contratos, um por componente
├── adapters/            primefaces.json, relatorios-academicos.json —
│                        mapa do legado para o contrato
├── patterns/            padrões de composição entre componentes
├── decisions/adr.json   42 ADRs (ADR-001 a ADR-044) — o porquê de cada regra
├── schema/              component.schema.json e adapter.schema.json,
│                        cobrados pelo `pnpm validate`
└── *.json               transversais: ícones, formatos, densidade,
                         estados, escrita, layouts, dataviz, migração
```

## Formato

Tokens seguem o **DTCG / W3C Design Tokens Format** (`$value`, `$type`,
`$description`) — padrão aberto, consumido nativamente por Style Dictionary v4+,
Tokens Studio e pelo Figma via plugin. Não inventamos formato próprio.

## Camadas de token — a regra que sustenta multi-marca

| Camada | Exemplo | Quem pode referenciar |
|---|---|---|
| Primitiva | `wine.600` = `#7A1C2C` | apenas `semantic.json` |
| Semântica | `color.action.primary.default` → `{wine.600}` | componentes e aplicações |
| Marca/tema | `brand.pos.json` sobrescreve semânticos | ninguém — é aplicada por contexto |

Um componente que lê `wine.600` direto quebra a troca de marca e o tema escuro.
O linter do CI trata isso como erro, não aviso.

## Anatomia de um contrato de componente

Os cinco primeiros contratos foram escritos antes do gerador, de propósito: para
descobrir se o formato aguenta componentes complexos. Aguentou, mas cresceu.
`data-table` obrigou a três seções que `button` não previa.

### Núcleo — obrigatório em todo contrato

| Seção | O que carrega |
|---|---|
| `description` | O que o componente faz e, principalmente, o que ele **não** faz |
| `evidencia` | Tela de origem, problema observado, conclusão. É a justificativa auditável de cada decisão |
| `anatomia` | Partes nomeadas, obrigatórias ou não |
| `props` | Contrato de API |
| `estados` | Estados visuais e de sistema |
| `acessibilidade` | Requisitos + critérios WCAG numerados |
| `conteudo` | Diretrizes de texto, com exemplos bom/ruim |
| `migracao` | Mapa `legado → novo`, com nota onde a conversão não é 1:1 |
| `exemplos` | Uso real, copiável |

### Extensões — quando o componente exigir

| Seção | Surgiu em | Para quê |
|---|---|---|
| `limites` | `dialog`, `select` | **Quando NÃO usar.** Acabou sendo a seção mais valiosa: dois dos usos de diálogo no Protocolo são uso indevido, e a spec agora diz isso explicitamente |
| `schemas` | `data-table` | Tipos aninhados (`ColumnDef`) que uma lista plana de props não descreve |
| `composicao` | `data-table`, `dialog` | Grafo `usa` / `usada_por`. É o que permite análise de impacto: mexer em `pagination` avisa quem depende |
| `responsividade` | `data-table` | Estratégia de adaptação, que não é prop nem acessibilidade |
| `foco`, `rolagem` | `dialog` | Comportamentos que não cabem em `estados` |
| `dependencia` | `select` | Campos encadeados |
| `obrigatoriedade` | `text-field` | Política de marcação de campo obrigatório |

**Consequência para o gerador:** o JSON Schema precisa validar o núcleo como
obrigatório e as extensões como opcionais tipadas. Um gerador que assumisse
formato plano teria que ser reescrito — que é exatamente o motivo de os contratos
virem antes.


## Estado atual

49 contratos escritos, nenhum ainda `stable`.

| Status | Quantos | O que significa |
|---|---|---|
| `review` | 23 | Contrato completo, consumido pelos dois trilhos, aguardando o segundo consumidor real |
| `draft` | 26 | Escrito, ainda sujeito a mudança de forma |

Regra de escopo: um contrato só é promovido para `stable` quando existem **dois
consumidores reais** do componente. Nenhum chegou lá — o que é honesto, já que a
migração dos sistemas ainda não começou.

Pendências conhecidas:

| Onde | Pendência |
|---|---|
| `tokens/primitive.json` | Parte das cores nasceu de captura de tela. Convém remedir no CSS de produção e conferir com a marca institucional |
| `tokens/` | Não há camada por marca (`brand.*.json`). A subpaleta por sistema da ADR-037 resolve o caso de hoje, mas não é multi-marca de verdade |
| `components/` | `chart` e `compositor` são os contratos mais novos e os menos exercitados |

## Decisões

As decisões vivem em `decisions/adr.json` — 42 entradas, de ADR-001 a ADR-044,
41 aceitas e uma proposta. Cada uma traz contexto, decisão e consequência, e é
referenciada por id nos contratos que ela governa.

As cinco primeiras continuam sendo as que mais explicam a aparência do sistema:

- **ADR-001** — ação primária passa a ser o bordô da marca. Antes, a mesma
  intenção usava quatro cores: preto (`SALVAR`), azul (`ENTRAR`), verde
  (`PRIMEIRO ACESSO`), cinza (`NOVO REQUERIMENTO`).
- **ADR-002** — vermelho é reservado a destruição irreversível. O
  `REDEFINIR SENHA` vermelho do login ensinava o usuário a ignorar vermelho.
  Ver também a ADR-026, que refez a rampa `red.*` por degrau de luminosidade
  quando matiz sozinho não separou as duas leituras.
- **ADR-003** — nenhum papel tipográfico usa caixa alta forçada. CAPS elimina o
  contorno da palavra e é lido letra a letra por alguns leitores de tela.
- **ADR-004** — rótulo persistente acima do campo, não flutuante. É a mudança
  visual mais perceptível do projeto e precisa ser comunicada antes da migração.
- **ADR-005** — `LoadingOverlay` sai do catálogo. Carregamento passa a ser
  estado do componente que o originou.
