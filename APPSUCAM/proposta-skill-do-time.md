# A skill `design-system-ucam` e o UCAMDS: o que cada um tem e uma proposta

Lido em 12/10/2026 na cópia da skill que está em `isencao-v2/design-system-ucam/` (commit `723f7f3`)
e nos repositórios `Gerencial-v3.0-2026`, `Protocolo-v3.0-2026`, `SecretariaVirtual-v3.0-2026` e
`relatorios-academicos-v3.0-2026`. Foi leitura de código; nada foi alterado em nenhum deles.

## Resumo

Hoje há dois design systems para os sistemas da universidade, feitos sem um saber do outro. A skill
`design-system-ucam` nasceu no Relatórios Acadêmicos e já veste cinco sistemas. O UCAMDS
(`ucam-ds.vercel.app`) tem 52 componentes com contrato e 81 telas de referência, e só chegou ao
módulo do candidato do vestibular. Os dois concordam nos princípios e divergem na aparência.

A proposta é não escolher um contra o outro: a skill fica como a porta de entrada que o time já usa,
e passa a buscar cor, fonte e peças no UCAMDS em vez de carregar uma folha copiada por projeto. O
primeiro passo custa uma linha de CSS e está provado abaixo.

## Onde os dois já concordam

- Tokens nomeados pelo papel, e não pelo tom.
- Tema escuro redefinindo as mesmas variáveis.
- Estado nunca só pela cor; alvo de toque de 44 px; foco visível de 2 px.
- Nenhuma cor literal em tela.
- Nenhuma biblioteca visual pronta (Material, Bootstrap).
- A tela preserva o que o legado faz; o desenho muda a apresentação.

## Onde divergem

| | Skill | UCAMDS |
|---|---|---|
| Cor de ação | `#a91733` | `#8E1331` |
| Fonte | Inter, pelo Google Fonts | Geist, servida pelo próprio DS |
| Raio de controle | 10 px | 6 px |
| Faixa do topo | gradiente bordô | branca, com a cor do sistema |
| Fundo da página | cinza `#f4f5f7` | branco |
| Sombra em repouso | sim | não |
| Anel de foco | cor primária | cinza próprio |
| Rótulo de campo | caixa alta, bordô | caixa baixa |
| Nomes de classe | globais (`.botao`, `.card`) | `.ucam-*`, sob o escopo `.ucam` |
| Como chega ao projeto | folha copiada e adaptada | spec que gera tokens, CSS e pacotes |

A cor é o ponto que mais pede conversa. A skill registra que a dela foi inferida do CSS do site
institucional. As decisões do Protocolo (ADR-0024) e do Gerencial (ADR-0027) registram que o Manual
da Marca dá `#7D212B` e que escolheram `#a91733` para ficar igual a Relatórios. O UCAMDS usa
`#8E1331`. São três bordôs, e nenhum dos dois sistemas usa o valor que o time atribui ao Manual.

## O que cada um tem que o outro não tem

**A skill tem e o UCAMDS deveria absorver**

- As referências 08 a 10: acessibilidade de portal, prints de tela obrigatórios e padrões de UX
  vindos do Portal do Aluno. O UCAMDS só conhece a versão de setembro (referências 01 a 07).
- As formas de relatório. O sistema tem 71 relatórios, e cerca de metade não é tabela plana: tabela
  agrupada por curso, tabela com gráfico, grade dia × horário, pivô com cabeçalho em dois andares,
  documento em seções (histórico) e prévia de documento oficial (diploma). O UCAMDS tem três telas
  de referência para tudo isso.
- Os filtros: autocomplete de pessoa como filtro principal, cascata de até quatro níveis, campo
  condicional, acumulador e seleção em lote.
- O padrão "lista ou ficha com abas" que o Gerencial fixou em 07/10.

**O UCAMDS tem e a skill não**

- Peças que a isenção precisou criar por conta própria em `isencao-ext.css` (797 linhas): abas,
  controle segmentado, diálogo, linha do tempo, item de documento, alerta e avatar. No UCAMDS elas
  existem com contrato, teclado e foco resolvidos.
- Padrões de trabalho que um sistema de consulta não precisa e os outros precisam: fila, análise com
  decisão por linha, ação em lote, acompanhamento de processo.
- Um lugar só para mudar. Hoje a mesma folha está copiada e adaptada à mão em cada projeto: 1.406
  linhas no Gerencial, 4.801 no Protocolo, 132 na Secretaria, 3.425 na isenção. Uma correção de
  contraste precisa ser refeita quatro vezes.
- As regras de negócio por tela, marcadas como lidas do código, propostas ou abertas, com quem
  decide cada uma.

## O que está errado do lado do UCAMDS

A decisão ADR-0014 da Secretaria Virtual registra que "não há Design System publicado". Do ponto de
vista de quem instala, é verdade:

- Nenhum pacote está em registro. Os `.tgz` 0.1.3 existem só na máquina de quem constrói.
- O site está no ar, mas nunca foi apresentado ao time.
- As telas de referência foram desenhadas em 06/10 e já estão atrás do código: na revisão de 12/10,
  conferem 85 de 98 regras do Gerencial e só 17 de 54 do Protocolo, que foi reescrito nesse meio
  tempo.

## Proposta

**1. Uma linha de CSS, sem mexer em tela nenhuma.** O UCAMDS já tem um adaptador para a folha da
skill: `ucam-ds.vercel.app/css/ucam-relatorios-academicos.css`. Carregado depois do `main.css`, ele
redefine 29 das 38 variáveis da skill com tokens do UCAMDS (as nove que ficam de fora são medidas de
layout e apelidos, não cor). Testado em 12/10 com a marcação de exemplo da própria skill, sobre a
folha atual de 3.425 linhas: a paleta, os raios, as sombras e o rótulo mudam, e a marcação fica
igual. As capturas estão em `revisao-2026-10-12/adaptador-antes.png` e `adaptador-depois.png`.

Limites desse passo, medidos: a folha da skill tem 50 cores literais fora das variáveis, que o
adaptador não alcança; a faixa em gradiente continua em gradiente; e as folhas que cada projeto
reescreveu com nomes próprios de variável (Gerencial, Secretaria) precisam do mapa refeito.

**2. A skill aponta para as peças que já existem.** Onde um projeto precisar de abas, diálogo, linha
do tempo ou anexo, a referência 07 da skill passa a mandar buscar no UCAMDS antes de desenhar. As
classes `.ucam-*` vivem sob um escopo e não brigam com as globais da skill.

**3. O UCAMDS absorve o que a skill tem a mais.** As referências 08 a 10 e as formas de relatório
entram como contratos e telas de referência, e os pacotes vão para o registro da organização.

## O que precisa ser decidido junto

1. Qual é o bordô. Alguém tem o Manual da Marca em mãos?
2. Faixa do topo: a referência 10 registra que a faixa clara "foi testada e rejeitada pelo
   responsável". O UCAMDS a adotou. Vale mostrar as duas lado a lado para quem decidiu.
3. Fonte: Inter ou Geist. A Inter hoje vem do Google Fonts a cada carga, e no Relatórios e no site do
   CENPRE não é carregada de lugar nenhum.
4. Quem mantém a skill, e se a versão que está na isenção é a mesma dos outros projetos.

## O que não foi verificado

- O motivo de a isenção ter trocado o UCAMDS pela skill. Não há decisão nem nota no repositório.
- A skill em si só foi lida na cópia da isenção. Gerencial, Protocolo e Secretaria a citam, mas não a
  trazem no repositório.
- O adaptador foi testado numa página de exemplo com botão, campo, tabela e selo, e não dentro de um
  dos sistemas rodando.
