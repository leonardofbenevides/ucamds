# @ucam/patterns — os padrões viram código gerado

Design aprovado em 21/09/2026. Substitui a linha "planejado" que o pacote
ocupa em `spec/resources.json` desde o início.

## O problema, dito pela própria spec

Cada padrão em `spec/patterns/patterns.json` registra o mesmo tipo de
defeito. O da listagem CRUD é o mais claro:

> Cada tela de listagem do Protocolo resolve a mesma tarefa de um jeito
> diferente: duas paginações distintas, três redações de estado vazio,
> ordenação ora no cabeçalho ora num select solto, e o botão de nova
> entidade ora acima ora abaixo da tabela.

O problema é **inconsistência**, não repetição de código. Isso importa
porque as duas doenças pedem remédios opostos: repetição pede um
componente que absorve o código; inconsistência pede um ponto de partida
correto. Um componente configurável resolveria a doença errada — e a
oitava tela sempre precisa do que a API não previu.

## As quatro decisões

**1. Um padrão entrega um gerador de código, não um componente.**
O DS escreve a tela no app do dev, que passa a ser dono dela. Depois de
gerada, o DS não controla mais nada: divergir é possível, e visível na
revisão de código. Isso casa com o idioma da casa — o repositório já gera
as 23 telas autônomas a partir da spec.

**2. O gerador é um subcomando da CLI que já existe.**
`ucam-ds gerar <padrao>`, no `@ucam/ds-mcp`. Não entra dependência nova (o
kit não tem nenhuma hoje, e isso é uma propriedade que vale manter), não
exige Angular CLI no projeto, e o MCP expõe a mesma função aos agentes.

Consequência: **`@ucam/patterns` não vira pacote.** A linha sai de
`spec/resources.json` e o que era "pacote planejado" passa a ser um
subcomando do kit. Um pacote a menos para versionar, e nenhuma função
perdida.

**3. O código sai de um gabarito parametrizado, não de uma tela copiada.**
Copiar uma das 23 telas traria o domínio da UCAM grudado — requerimento,
setor, campus — e renomear por substituição de texto é frágil. O gabarito
é escrito uma vez por padrão e recebe a entidade e os campos.

**4. O gerado assume um contrato de serviço, e gera o esqueleto dele.**
Paginação, ordenação e filtro já vêm ligados, porque é exatamente aí que
as telas divergiam. Um padrão que documenta a estrutura e se cala no
comportamento devolve ao dev o trabalho onde o erro nasce.

O contrato imposto é `{ pagina, tamanho, ordem?, busca? }` devolvendo
`{ itens, total }`. App com cursor ou GraphQL adapta o esqueleto — é um
método só, e está marcado.

## O gabarito, e o portão que o mantém honesto

O gabarito descreve a mesma coisa que a `estrutura` e o `usa` do padrão já
descrevem. São três fontes para um fato, contando as 23 telas — e pela
regra que governa o repositório, duas delas estão erradas em algum
momento futuro.

A resposta não é derivar o gabarito de uma estrutura declarativa: isso
exigiria um mini-DSL para descrever template Angular, que custa mais do
que o problema resolve e envelhece pior. A resposta é deixar o gabarito
ser texto escrito por gente, e impedir que ele **divirja calado**.

### Forma

```
spec/patterns/gabaritos/<id>/
  componente.ts.gab
  servico.ts.gab
```

Extensão `.gab` de propósito: arquivo `.ts` que não compila (tem
marcadores dentro) e fica fora do `tsconfig`, mas que o editor destaca
como texto. Os marcadores são `{{Entidade}}`, `{{entidade}}`,
`{{entidades}}`, `{{campos}}` — substituição literal, sem motor de
template, sem dependência.

### O portão: `check-gabaritos.mjs`

Roda no `pnpm validate`, junto dos outros. Três perguntas:

1. **Todo componente que o gabarito usa está no `usa` do padrão?** Extrai
   os `<ucam-*>` do gabarito e compara com a lista. Componente a mais é
   erro: o padrão promete uma composição e entrega outra.
2. **Todo item de `estrutura` aparece no gabarito?** Cada item declara uma
   âncora verificável (ver abaixo). Perder o `EmptyState` numa refatoração
   é o defeito que este portão existe para pegar.
3. **Todo marcador do gabarito é conhecido?** `{{Entidade}}` escrito
   errado sairia literal no código do dev.

### O que a spec precisa ganhar antes

A pergunta 2 não pode ser feita hoje para todos os padrões:

| Padrão | `estrutura` | Situação |
|---|---|---|
| `listagem-crud` | 7 itens | pronto |
| `triagem-lista-detalhe` | sim | pronto |
| `painel-indicadores` | 5 itens | pronto |
| `listagem-inspetor` | sim | pronto |
| `consulta-relatorio` | sim | pronto |
| `formulario-entidade` | **ausente** | precisa ser escrita |

`estrutura` hoje é prosa livre ("DataTable com ordenação nos
cabeçalhos"). Para o portão conferir, cada item ganha uma âncora: o
seletor ou a classe que prova aquele item no gabarito. O texto continua
sendo o que o site publica; a âncora é o que a máquina lê.

```json
{
  "diz": "EmptyState diferenciando no-data de no-results",
  "ancora": "ucam-empty-state"
}
```

Item sem âncora é aceito e reportado como aviso, não como erro — a
migração não precisa ser atômica.

#### A migração tem dois consumidores, e um deles quebra calado

`estrutura` é hoje `string[]`, e dois lugares dependem disso:

- `site/src/app/spec/spec.types.ts` declara `estrutura?: string[]`.
- `site/src/app/pages/padroes/[id].page.ts` renderiza `{{ e }}` direto.

Trocar strings por objetos sem tocar no segundo publica `[object Object]`
na página de cada padrão — e o TypeScript não pega, porque o template
aceita interpolar qualquer coisa. É o mesmo modo de falha da prosa que
mentia sobre os pacotes: compila, sobe, e está errado na tela.

Os três passos são um só commit:

1. tipo vira `{ diz: string; ancora?: string }[]`;
2. o template passa a interpolar `e.diz`;
3. os cinco padrões que têm `estrutura` são convertidos, e a de
   `formulario-entidade` é escrita já no formato novo.

Não há forma antiga a tolerar: são cinco arrays num arquivo só, e aceitar
os dois formatos criaria um ramo que ninguém removeria depois.

## Os padrões que entram, e os que não

**Seis geram tela:** `listagem-crud`, `formulario-entidade`,
`triagem-lista-detalhe`, `painel-indicadores`, `listagem-inspetor`,
`consulta-relatorio`.

**`shell-aplicacao` fica de fora.** Já é entregue como componente
(`ucam-app-shell`), e gerar uma cópia dele criaria a segunda fonte que
todo o resto deste documento existe para evitar.

**`confirmacao-destrutiva` fica de fora como tela.** Não tem tela própria
entre as 23 — vive dentro da listagem e do formulário. Entra como parte
dos gabaritos que a usam, não como alvo de `gerar`.

### `formulario-entidade` tem duas formas, não uma

As regras do padrão são condicionais:

> Até 5 campos e sem texto livre extenso: diálogo. Acima disso: página
> dedicada com URL própria, que pode ser recarregada, compartilhada e
> retomada.

O gerador conta os campos pedidos e escolhe a forma, dizendo qual escolheu
e por quê. `--forma=pagina` força, para o caso do texto livre extenso, que
a contagem de campos não captura.

São dois gabaritos sob o mesmo `id`, e o portão confere os dois.

## A superfície

```
ucam-ds gerar <padrao> --entidade=<Nome> --campos=<a,b,c> [--saida=<dir>]
                       [--forma=<dialogo|pagina>] [--dry-run]
```

`--dry-run` imprime o que escreveria, sem tocar no disco. Não é enfeite: a
primeira coisa que um dev faz com um gerador desconhecido é olhar antes de
deixá-lo escrever.

O gerador **nunca sobrescreve** arquivo existente — recusa e diz qual. Um
gerador que apaga trabalho é usado uma vez.

No MCP, a mesma função como `ucam_generate_pattern`, devolvendo os
arquivos como dados em vez de escrevê-los. O agente decide onde pôr; a
decisão de escrever no disco é de quem tem as ferramentas de arquivo.

## Como se prova que funciona

O repositório já tem o padrão de prova para isto, e ele é mais forte que
teste unitário de gerador: **o código gerado tem de passar nos portões que
já existem.**

1. Para cada um dos 6 padrões, gerar uma tela com uma entidade de teste.
2. Rodar `ucam-ds checar` no resultado. Zero erros — cor crua, componente
   inexistente, prop fora do enum, select nativo, mais de um primário.
3. Compilar o gerado contra `@ucam/ui` de verdade, num projeto Angular
   descartável. Gerador que produz código que não compila é pior que
   nenhum.

O passo 3 é o que separa este design de um gerador de strings. Ele entra
no `pnpm dist`, depois do `lib`, porque precisa da biblioteca construída.

## O que este design não faz

- **Não gera rota, provider nem entrada de menu.** Escrever no
  `app.routes.ts` do dev exige manipular AST e é onde um gerador começa a
  quebrar projeto alheio. O comando imprime a linha de rota para colar.
- **Não gera teste.** O teste depende do que a tela faz no domínio, e um
  teste gerado que só confirma que o componente monta dá falsa segurança.
- **Não versiona o gerado.** Não há "atualizar a tela para a versão nova
  do padrão": o código é do dev desde que sai. Regenerar em outro
  diretório e comparar é o caminho, e é o honesto.

## Ordem de trabalho

1. Âncoras em `estrutura`: tipo, template do site e os cinco padrões que
   já a têm, mais a de `formulario-entidade`, num commit só.
2. `check-gabaritos.mjs` — o portão antes dos gabaritos, para que o
   primeiro gabarito já nasça conferido.
3. `listagem-crud` de ponta a ponta: gabarito, `gerar`, `--dry-run`, a
   prova de compilação. É o padrão mais frequente e o de estrutura mais
   completa — se o design não servir a ele, não serve.
4. Os outros cinco, um a um.
5. `ucam_generate_pattern` no MCP.
6. Tirar `@ucam/patterns` de `spec/resources.json` e documentar `gerar`
   no site e no `AGENTS.md`.

O passo 3 é o ponto de decisão: se o gabarito de `listagem-crud` sair
confuso ou o portão se mostrar cego, é ali que se para e se repensa, com
um padrão perdido em vez de seis.
