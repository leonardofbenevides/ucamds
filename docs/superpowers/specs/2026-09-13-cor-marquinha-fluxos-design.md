# Cor onde há dado, marquinha do módulo, login enxuto e fluxos que funcionam

Data: 13/09/2026. Estado: aprovado em conversa (três seções, uma a uma).
Pedidos de origem: "melhore o estilo das telas, pode ter mais cor em alguns momentos mas fique
clean"; "coloque cor nos kpi's / big numbers"; "esse select do header 'campus Campos' pode
melhorar e ficar no estilo dos demais selects"; "no header, não valeria ter uma marquinha para
cada sistema e deixar o 'universidade candido mendes' em outros momentos só?"; "na tela de
autenticação, melhore o conteúdo, tem muito texto solto. Retire o 'Campos dos goytacazes / rio de
janeiro / nova friburgo'"; "avaliar os fluxos, se tudo está conectando"; "deixe clicável e faça
funcionar nas telas o que tem que funcionar".

Decisões anteriores que este trabalho respeita: ADR-001/023 (um primário em vista), ADR-022/027
(um portador de cor por linha), ADR-026 (marca × destrutivo), ADR-029 (sair é fantasma, arquivar
não é excluir), e a regra "realce sem contorno" (um sinal de superfície, um de tipografia, no
máximo um de cor). ADR-030 e 031 estão reservadas pela spec paralela `2026-09-12-trilho-b-real`.

## Seção 1 — Cor por significado e por categoria (ADR-032)

**KPI (`.ucam-stat`).** O tom deixa de pintar só o número e passa a pintar o ladrilho: fundo
`feedback.{tom}.background` (degrau 100), número `feedback.{tom}.foreground` (700), rótulo e
meta em `text.primary`/`text.secondary` — dois sinais (superfície + cor do número) e nenhum
contorno. Tons: `success`, `danger`, e dois novos: `warning` (atrasados, a vencer, prazo curto) e
`marca` (o número-título do painel: abertos, total em caixa — fundo `action.primary.subtle`,
número `action.primary.default`). `neutral` continua branco. Regras que ficam: o tom vem do
DADO, não da posição; nunca só cor (o `meta` diz em palavra); não categoriza. O contrato do stat
muda o texto "pinta o VALOR, nunca o ladrilho inteiro" para "pinta o ladrilho quando o número
carrega julgamento; quatro ladrilhos neutros continuam brancos". Nos templates, cada um dos 21
KPIs recebe o tom que o dado pede (tabela no plano).

**Categoria de módulo (`.ucam-icon-tile--{categoria}`).** Seis papéis novos em
`semantic.json > color.categoria`: `academico` (blue.500), `financeiro` (green.500),
`atendimento` (wine.500), `gestao` (violet.500), `pessoas` (teal.500), `acervo` (ochre.500).
Ladrilho: fundo `color-mix(cor 12%, transparent)`, ícone na cor — a mesma receita de
`--marca`. Usado na grade do Portal (cada módulo declara `categoria`), na marquinha da faixa
(Seção 2) e nos cartões ilustrativos do login. O contrato do icon-tile ganha `tone: categoria`
com a regra: categoria discrimina irmãos; `brand` continua sendo "um entre irmãos neutros".
`check-daltonismo.mjs` passa a conferir as seis categorias entre si (mesmo limiar das séries);
`check-marca-vs-destrutivo.mjs` confere `atendimento` (wine) contra `danger` no par ícone/fundo
de 12% — se reprovar, atendimento vai para teal e pessoas para blue.400.

**O que não muda:** cabeçalho de página, cartões comuns, tabelas, navegação e barra de visão
continuam brancos; o único bordô cheio da tela segue sendo a ação primária.

## Seção 2 — A faixa identifica o módulo (ADR-033)

**Marquinha.** `.ucam-appbar__brand` deixa de emitir o lockup + filete. Emite o ladrilho do módulo
(`.ucam-icon-tile ucam-icon-tile--sm ucam-icon-tile--{categoria}`, 28px, `aria-hidden`) e o nome
do sistema, como link para a primeira tela do projeto. Cada projeto de `templates.json` declara
`icone` e `categoria` (protocolo: clipboardList/atendimento; portal: layoutGrid/gestao; sigfin:
wallet/financeiro; relatorios: chartColumn/academico). O Portal é a exceção: a grade É a
universidade, então nele a faixa mantém o lockup. O lockup fica também no login, no cabeçalho da
gaveta (`.ucam-nav__gaveta`) e no rodapé do shell. Efeito: a faixa perde ~110px de largura
mínima, e as regras de `faixa-minima`/`respiro-completo` que escondiam nome e filete para o
lockup caber ficam só para o caso Portal.

**Campus.** O chip vira `.ucam-select` na faixa: `<label class="ucam-sr-only">Campus</label>`,
gatilho com o valor, chevron, e o listbox do `listboxScript` (mesmo gatilho + `ul role=listbox`
que `listboxSelects()` emite). Modificador `.ucam-select--faixa`: mesma altura do controle da
faixa (`size.control-sm`), largura pelo conteúdo, tinta da faixa. Escolher uma unidade escreve
`data-campus` no `.ucam-shell` e troca o valor — nas telas de template não há back-end; a nota
do projeto diz que na aplicação recarrega o contexto. Abaixo de `faixa-minima` sai da faixa e
aparece como primeira linha do cabeçalho da gaveta. O `menuCampus` (role=menu) e
`.ucam-appbar__context*` saem do gerador e da folha.

## Seção 3 — Login enxuto e fluxos (parte da ADR-033)

**Login.** Sai `.ucam-login__campi`. A frase de apoio (`__apoio-frase`) sai — repete o que a
janela ilustra. O rodapé da coluna de acesso vira uma linha: "Universidade Candido Mendes · 2026
· Problemas para entrar? Fale com o suporte". Hint do CPF: "Com ou sem pontos.". "Ainda não tem
acesso? Primeiro acesso" fica.

**Fluxos.** Toda ação das 15 telas passa a fazer uma destas três coisas, e a nota do template
registra qual:
- (a) leva a uma tela que existe → `<a href>` por `#/templates/...` (o `religaPreview` já
  resolve): Novo setor/Editar setor → parametros-setores; Nova natureza/Editar natureza →
  parametros-setores (não há tela de natureza: destino declarado na nota e o botão vira link
  para a listagem com âncora de nota); Novo integrante/Editar pessoa → sem tela → (b);
  Continuar para revisão / Voltar (novo requerimento) → etapas da mesma tela (c); Calcular
  mensalidade → seção de resultado da mesma tela (c); Registrar lançamento → (b) com motivo.
- (b) ação cujo destino não existe no conjunto → `aria-disabled="true"` + `title`/`aria-describedby`
  com "Tela não desenhada neste conjunto" e cursor `not-allowed` — a mesma convenção do
  `.ucam-card__link[aria-disabled]` da ADR-028. Ex.: Exportar, Imprimir, Conta Microsoft/Google,
  Enviar por e-mail, Editar integrante, Fechar caixa.
- (c) ação in-page → comportamento real por `estadoScript`: Encaminhar/Concluir/Anexar/Enviar
  resposta no requerimento mudam o selo de situação e acrescentam evento na linha do tempo;
  Arquivar/Reativar natureza troca o selo e o botão (ícone + rótulo); Limpar filtros remove os
  chips e ajusta a contagem "Filtros N"; Limpar busca esvazia o campo; Voltar/Continuar andam o
  stepper e mostram a etapa; Calcular mensalidade revela a seção de resultado; Salvar setor
  pisca o realce e volta à listagem; Limpar campos reseta o form; Copiar linha digitável escreve
  no clipboard e diz "Copiado" no próprio botão por 2s. Feedback é o próprio controle (alert.json:
  toast está fora do catálogo); realce usa `.ucam-realce` já existente.
- Trilha e "voltar" conferidos tela a tela: cada `aria-current` é a tela; cada degrau anterior
  aponta a tela certa.

**Mapa de fluxo** na página `/telas/` do site: tabela por projeto (tela → de onde se chega → para
onde cada ação leva → classe a/b/c), gerada de um bloco `fluxos` novo em cada template.

## Testes

- `pnpm run validate && pnpm run tokens && pnpm run marca && pnpm run css && pnpm run telas`
  passam (daltonismo com categorias, marca × destrutivo com atendimento).
- Sonda de estouro (`sonda-resp.mjs`, 15 telas × {320, 480, 768, 1024}) sem estouro.
- Prova CDP do select de campus: abre, seta, Enter escolhe, valor muda, Esc fecha, foco volta.
- Prova CDP dos fluxos: clicar cada ação (c) e ler o eco no DOM; cada (a) resolve para arquivo
  existente; cada (b) tem `aria-disabled` e motivo.
- Captura a 1440 dos dois temas de gerencial, analytics, portal e login.

## Fora do escopo

Trilho B (Angular) das mudanças de faixa e campus — o app-shell Angular está na spec paralela;
`ucam-stat` e `ucam-icon-tile` Angular recebem só os valores novos de `tone`. Tela de natureza e
de integrante não são desenhadas. Multi-marca não entra.
