// Gera @ucam/css — a camada do Trilho A.
//
// Primitivos visuais sem framework, para os apps legados (Angular antigo,
// AngularJS, qualquer coisa) adotarem a identidade sem migrar uma linha.
//
// Três restrições que definem o arquivo:
//   1. TUDO escopado sob .ucam — nada vaza para o CSS existente do app.
//   2. ZERO reset global. Sem preflight, sem `* { box-sizing }` solto,
//      sem estilizar elementos nus. Bootstrap e Angular Material continuam
//      funcionando ao lado.
//   3. Só referencia tokens SEMÂNTICOS (ADR-007). O build verifica isso.
//
//   node tools/build-css.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectChevronCss } from './lib/select-chevron.mjs';
import { cssDaSubpaleta } from './lib/subpaleta.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'css');

/* Check do lucide, só o traçado — a `mask` ignora a cor, então o mesmo
 * desenho serve aos dois temas e a tinta sai do token. Mesmo motivo do
 * chevron em lib/select-chevron.mjs: data URI é documento separado e não
 * enxerga o currentColor de quem a usa. */
const CHECK_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")";
const TOKENS_CSS = join(ROOT, 'dist', 'tokens', 'ucam-tokens.css');

if (!existsSync(TOKENS_CSS)) {
  console.error('✗ dist/tokens/ucam-tokens.css não existe. Rode: pnpm run tokens');
  process.exit(1);
}

const tokensCss = readFileSync(TOKENS_CSS, 'utf8');
const tokensDisponiveis = new Set(
  [...tokensCss.matchAll(/^\s*(--ucam-[a-z0-9-]+):/gm)].map((m) => m[1])
);


/* ------------------------------------------------------ breakpoint --- */
/* Media query NÃO enxerga custom property. Não é escolha, é o CSS: a query é
 * avaliada antes de existir elemento onde a variável pudesse ser resolvida.
 * Então o breakpoint entra aqui pelo mesmo caminho que a ADR-007 já usa para
 * qualquer token — lido do spec, escrito literal na saída — e a folha nunca
 * carrega um número escolhido à mão.
 *
 * Papel, não medida: `acima('nav-fixa')` diz o que muda ali; 64rem não diz.
 *
 * A borda de `abaixo` é 0.001rem, um dialeto só. Antes eram três no mesmo
 * arquivo — 47.99, 63.999 e 29.999 — e um par que se sobrepunha: max-width
 * 64rem e min-width 64rem valiam JUNTOS em exatamente 1024px, deixando a caixa
 * de entrada em uma e em duas colunas na mesma largura. */

const specSemantic = JSON.parse(
  readFileSync(join(ROOT, 'spec', 'tokens', 'semantic.json'), 'utf8')
);
const specPrimitive = JSON.parse(
  readFileSync(join(ROOT, 'spec', 'tokens', 'primitive.json'), 'utf8')
);

function remDoPapel(papel) {
  const no = specSemantic.viewport?.[papel];
  if (!no) throw new Error(`papel de viewport inexistente: ${papel}`);
  const degrau = no.$value.replace(/[{}]/g, '').split('.').at(-1);
  const bruto = specPrimitive.breakpoint?.[degrau]?.$value;
  if (!bruto) throw new Error(`breakpoint.${degrau} inexistente`);
  return parseFloat(bruto);
}

// Larguras que a folha tem permissão de conter. O portão do fim confere.
const breakpointsEmitidos = new Set();

const acima = (papel) => {
  const r = remDoPapel(papel);
  breakpointsEmitidos.add(`min:${r}rem`);
  return `@media (min-width: ${r}rem)`;
};

const abaixo = (papel) => {
  const r = (remDoPapel(papel) - 0.001).toFixed(3);
  breakpointsEmitidos.add(`max:${r}rem`);
  return `@media (max-width: ${r}rem)`;
};

/* Largura do CONTÊINER, não da janela — semantic.json > container.
 *
 * A janela mente a partir de nav-fixa: a 1024px ela está acima de
 * duas-colunas, mas a coluna de navegação leva 20rem e o painel de conteúdo
 * fica com 666px. O bloco de divisão que perguntava à janela punha o painel
 * de apoio ao lado e deixava 24rem para uma tabela de cinco colunas. Quem
 * sabe quanto sobra é o painel que contém o bloco, e é a ele que se pergunta.
 * Passa pelo MESMO portão de largura de acima()/abaixo(): número na folha só
 * vindo de papel declarado. */
function remDoContentor(papel) {
  const no = specSemantic.container?.[papel];
  if (!no) throw new Error(`papel de contêiner inexistente: ${papel}`);
  return parseFloat(no.$value);
}

const contentorAcima = (papel) => {
  const r = remDoContentor(papel);
  breakpointsEmitidos.add(`min:${r}rem`);
  return `@container corpo (min-width: ${r}rem)`;
};

const contentorAbaixo = (papel, nome = 'corpo') => {
  const r = (remDoContentor(papel) - 0.001).toFixed(3);
  breakpointsEmitidos.add(`max:${r}rem`);
  return `@container ${nome} (max-width: ${r}rem)`;
};

/* ----------------------------------------------------------------- css --- */

const css = `/* @ucam/css — Trilho A
 * Gerado de spec/ por tools/build-css.mjs. NÃO EDITAR À MÃO.
 *
 * Primitivos visuais para aplicações legadas. Escopado sob .ucam, sem reset
 * global e sem preflight: convive com Bootstrap, Angular Material e CSS
 * próprio do app sem colidir.
 *
 * Uso:
 *   <link rel="stylesheet" href="ucam-tokens.css">
 *   <link rel="stylesheet" href="ucam.css">
 *   <div class="ucam"> ... marcação da tela ... </div>
 */

@import "../tokens/ucam-tokens.css";

/* --------------------------------------------------------------- raiz --- */
/* box-sizing aplicado APENAS dentro do escopo, nunca em * global. */

.ucam,
.ucam *,
.ucam *::before,
.ucam *::after { box-sizing: border-box; }

.ucam {
  color: var(--ucam-color-text-primary);
  /* A família precisa ser declarada AQUI. Sem ela, o escopo herda a fonte do
   * app hospedeiro — e num iframe, onde não há o que herdar, o navegador cai
   * em serifada. Um design system que não declara tipografia não controla a
   * própria aparência. */
  font-family: var(--ucam-font-body);
  font-size: var(--ucam-typography-body-font-size);
  line-height: var(--ucam-typography-body-line-height);
  -webkit-font-smoothing: antialiased;
}

/* \`hidden\` vence QUALQUER display do sistema, uma vez só para o escopo todo.
 *
 * O atributo do agente do navegador vale \`display: none\`, e qualquer classe
 * que declare display o atropela por especificidade: um \`.ucam-grid[hidden]\`
 * continuava desenhando a grade inteira. O repositório já tinha três remendos
 * pontuais para isso — menu, listbox e submenu da navegação —, cada um
 * escrito depois de o bug aparecer na tela, e o quarto apareceu na seção
 * recolhida da grade de módulos.
 *
 * O !important é o ponto: \`hidden\` significa "isto não está aqui", e nenhum
 * bloco do sistema tem o direito de discordar. Escopado sob .ucam, não
 * alcança a marcação da aplicação hospedeira. */
.ucam [hidden] { display: none !important; }

/* Anel de foco único para todo o escopo. WCAG 2.4.7 e 1.4.11. */
.ucam :focus-visible {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

@media (prefers-reduced-motion: reduce) {
  .ucam *,
  .ucam *::before,
  .ucam *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* --------------------------------------------- escala de ícone por papel --- */
/* Contrato: icons.json. A escala é 16 · 20 · 24, e QUEM ESCOLHE O DEGRAU É O
 * PAPEL — não a marcação.
 *
 * Havia duas escalas concorrendo. Uma na marcação: .ic-sm/.ic-md/.ic-lg/.ic-xl,
 * em 14/16/20/28, escolhida a cada <svg> escrito à mão. Outra aqui, em cinco
 * regras de contexto (\`.ucam-btn--sm .ic\`, \`.ucam-badge .ic\`,
 * \`.ucam-prazo .ic\`, \`.ucam-timeline__no .ic\`, \`.ucam-viewbar .ic\`), todas
 * cravando 0.875rem. Nada dizia qual mandava, e o resultado estava nas telas:
 * o mesmo selo com 14px numa e 16px em outra, o mesmo botão com os dois, e
 * os degraus de 20 e 24 sem aparecer em tela nenhuma — declarados e mortos.
 *
 * O degrau de 14px não existe na escala escrita: era o valor que a marcação
 * usava por omissão, e é a razão de as telas parecerem tímidas ao lado do
 * Trilho B, onde o <ucam-icon> entrega 20px por padrão (sm:16 / md:20 / lg:24,
 * em ucam-icon.ts). Os dois trilhos desenhavam o mesmo componente com ícones
 * de tamanhos diferentes.
 *
 * Agora .ic vale 20 (tools/lib/icon-css.mjs, o mesmo md do Trilho B) e o
 * desvio mora aqui, num bloco só:
 *
 *   16 — o MIÚDO: o que acompanha texto pequeno ou mora dentro de uma linha.
 *        Selo, prazo, chip, alerta, item de menu, célula de tabela, linha de
 *        lista, delta de stat, nó de timeline, adorno de campo, botão.
 *        Botão inteiro, e não só o --sm: o botão padrão do sistema tem 32px
 *        de altura, que é o "botão pequeno" da regra do icons.json — é o que
 *        o <ucam-button> do Trilho B também faz (size="sm" fixo no ícone).
 *   20 — o PADRÃO: navegação, ladrilho, e todo ícone que não caia num
 *        contexto miúdo. Não precisa de regra: é o valor da classe.
 *   24 — o ESTADO VAZIO, pareando com o size="lg" do <ucam-empty-state>.
 *
 * Ícone dentro de ladrilho é a exceção que precisa ser dita: o ladrilho pode
 * cair dentro de uma linha de lista (\`ucam-icon-tile ucam-list-item__figura\`)
 * e herdaria o 16 do contexto. Ele carrega o degrau padrão sempre.
 *
 * 12 — DENTRO DA PASTILHA (size.icon-xs, 11/09/2026). Selo, prazo e chip têm
 *      22px de altura e rótulo de 12; o 16 do miúdo deixava o símbolo mais
 *      alto que as letras. É o size-3 que a base Zard do Trilho B sempre deu
 *      ao svg do badge — o catálogo mostrava 12 e as telas, 16. */
.ucam-alert .ic,
.ucam-menu__item .ic,
.ucam-table .ic,
.ucam-list-item .ic,
.ucam-stat .ic,
.ucam-timeline__no .ic,
.ucam-stepper__marcador .ic,
.ucam-input-group .ic,
.ucam-section__gatilho .ic,
.ucam-pagination .ic,
.ucam-viewbar .ic,
.ucam-btn .ic,
/* A COLUNA LATERAL DO REGISTRO. O rótulo do par de painel e o campo de uma
 * mudança de timeline são texto de 13px, e o ícone ao lado deles herdava os
 * 20px do padrão: um quadrado de 20 contra uma altura de letra de 9. O ícone
 * lia como o assunto da linha e o rótulo como legenda dele — o inverso do que
 * a lista é. Os dois caem no miúdo pela mesma regra que já rege o selo e o
 * prazo: ícone que acompanha texto pequeno DENTRO de uma linha. */
.ucam-descricao__rotulo .ic,
.ucam-timeline__campo .ic,
.ucam-timeline__etapa-marca .ic,
.ucam-nav__chevron,
.ucam-nav__conta-chevron,
.ucam-appbar__chevron,
.ucam-topnav__chevron {
  inline-size: var(--ucam-size-icon-sm);
  block-size: var(--ucam-size-icon-sm);
}

/* A PASTILHA, DEPOIS do miúdo — e a ordem é a regra. Um selo dentro de uma
 * célula casa com as duas: ".ucam-table .ic" (16) e ".ucam-badge .ic" (12),
 * na mesma especificidade. Escrita antes, a pastilha perdia para a tabela, a
 * lista e a descrição que a hospedam, e o selo da coluna Situação saía com 16
 * — medido em 11/09/2026 no detalhe do requerimento: 4 selos a 16 na tabela
 * e 1 a 12 fora dela. O contexto mais ÍNTIMO é o que decide, então vem por
 * último. */
.ucam-badge .ic,
.ucam-prazo .ic,
.ucam-chip .ic,
/* A SETA DA LINHA DO TEMPO É PONTUAÇÃO, não assunto — e a regra mirava o
 * lugar errado. \`.ucam-timeline__seta\` é o SPAN que embrulha o svg:
 * ele recebia os 16 do miúdo e o \`.ic\` lá dentro continuava nos 20 do
 * padrão, transbordando a caixa. Era o ícone mais alto da coluna — 20px
 * de seta contra 13px de "Coordenação de Curso → Secretaria Acadêmica".
 *
 * Cai no degrau da pastilha por papel: na transição ela separa dois selos
 * de 22px, e na mudança, dois valores de 13. Não nomeia nada, liga duas
 * coisas que já estão escritas — e a 12 ela fica na altura das letras em
 * vez de acima delas. (ADR-041) */
.ucam-timeline__seta .ic,
.ucam-card__apoio > .ic {
  inline-size: var(--ucam-size-icon-xs);
  block-size: var(--ucam-size-icon-xs);
}

.ucam-icon-tile .ic,
.ucam-choice-card__figura .ic,
.ucam-choice-card__marca .ic {
  inline-size: var(--ucam-size-icon-md);
  block-size: var(--ucam-size-icon-md);
}

/* FILHO DIRETO, não descendente. Escrita como ".ucam-empty .ic", a regra
 * alcançava também o ícone do BOTÃO de saída — que o estado vazio tem por
 * contrato, sempre — e o "x" de "Limpar busca" saía com 24px ao lado de um
 * rótulo de 13. Foi o único ícone de 24px que a medição achou nas doze telas,
 * e ele estava no lugar errado. */
.ucam-empty > .ic {
  inline-size: var(--ucam-size-icon-lg);
  block-size: var(--ucam-size-icon-lg);
  /* "Discreto — o vazio não é um erro", diz o contrato. Mesma tinta que o
   * text-muted-foreground do <ucam-empty-state> no Trilho B. */
  color: var(--ucam-color-text-secondary);
}

/* ------------------------------------------------- entrada de superfície --- */
/* Painel que aparece SEM transição aparece instantaneamente — e o olho lê o
 * salto como falha de renderização, não como velocidade. A entrada não existe
 * para enfeitar: ela diz DE ONDE o painel veio, que é a informação que liga o
 * menu ao botão que o abriu.
 *
 * Três decisões:
 *   1. transform-origin no ponto de ancoragem, não no centro. Menu ancorado
 *      no fim da testeira cresce a partir do fim; se crescesse do centro,
 *      pareceria vir de lugar nenhum.
 *   2. Escala de 0.97, não de 0.9 (--ucam-motion-reveal-scale). Em painel de
 *      15rem, 10% é salto que chama atenção para a animação em vez de para o
 *      conteúdo.
 *   3. Curva de ENTRADA (ease-out-cubic), mais desacelerada no fim que a
 *      standard. É ela que faz a superfície assentar em vez de estancar.
 *
 * A regra de prefers-reduced-motion do topo do arquivo já zera tudo isto:
 * animation-duration cai para 0.01ms e o painel volta a simplesmente existir. */

@keyframes ucam-surgir {
  from {
    opacity: 0;
    transform: scale(var(--ucam-motion-reveal-scale)) translateY(calc(var(--ucam-motion-reveal-shift) * -1));
  }
  to { opacity: 1; transform: none; }
}

.ucam-menu:not([hidden]),
.ucam-listbox:not([hidden]) {
  transform-origin: var(--ucam-surgir-origem, 100% 0);
  animation: ucam-surgir var(--ucam-motion-duration-state) var(--ucam-motion-easing-entrance);
}

/* Menu alinhado pelo INÍCIO cresce do início. O alinhamento é escolha do
 * componente (menu.json, prop align) e a origem tem de segui-lo — origem
 * fixa faria o painel da esquerda parecer vir da direita. */
.ucam-menu--inicio { --ucam-surgir-origem: 0 0; }
/* Painel ancorado ACIMA do gatilho cresce de baixo para cima. */
.ucam-menu--acima  { --ucam-surgir-origem: 100% 100%; }
.ucam-menu--acima.ucam-menu--inicio { --ucam-surgir-origem: 0 100%; }

@keyframes ucam-esmaecer { from { opacity: 0; } to { opacity: 1; } }

.ucam-drawer-scrim,
.ucam-nav-scrim {
  animation: ucam-esmaecer var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard);
}

/* O diálogo é o único que cresce do CENTRO: ele não tem gatilho ancorado na
 * tela, aparece no meio, e é do meio que ele deve vir. */
@keyframes ucam-surgir-centro {
  from { opacity: 0; transform: scale(var(--ucam-motion-reveal-scale)); }
  to   { opacity: 1; transform: none; }
}

.ucam-dialog {
  animation: ucam-surgir-centro var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-entrance);
}

/* A gaveta PERCORRE — ela entra pela borda de onde está ancorada, e por isso
 * usa a curva enfática e a duração de percurso. É o único componente do
 * sistema em que a distância justifica os dois. */
@keyframes ucam-entrar-fim    { from { transform: translateX(100%); }  to { transform: none; } }
@keyframes ucam-entrar-inicio { from { transform: translateX(-100%); } to { transform: none; } }
@keyframes ucam-entrar-baixo  { from { transform: translateY(100%); }  to { transform: none; } }

.ucam-drawer {
  animation: ucam-entrar-fim var(--ucam-motion-duration-travel) var(--ucam-motion-easing-emphasized);
}
.ucam-drawer--inicio { animation-name: ucam-entrar-inicio; }
.ucam-drawer--baixo  { animation-name: ucam-entrar-baixo; }

/* -------------------------------------------------------------- botão --- */
/* Contrato: button.json. ADR-001 (primário é o bordô), ADR-002 (vermelho só
 * para destruição), ADR-003 (sem caixa alta). */

.ucam-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ucam-space-inline-xs);
  block-size: var(--ucam-size-control-md);
  /* Alvo mínimo de 24px mesmo quando o conteúdo é pequeno — WCAG 2.5.8. */
  min-inline-size: var(--ucam-size-icon-lg);
  padding: 0 var(--ucam-space-inset-md);
  border: 1px solid transparent;
  /* A borda é transparente em quase toda variante: sem recortar o fundo na
   * caixa de padding, o preenchimento vaza por baixo dela e a beirada do
   * botão fica meio tom mais clara. É o bg-clip-padding da base. */
  background-clip: padding-box;
  border-radius: var(--ucam-radius-control);
  font-family: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: 1;
  /* text-transform ausente de propósito — ADR-003. */
  white-space: nowrap;
  /* Arrastar o ponteiro sobre um botão não deve selecionar o rótulo: seleção
   * azul em cima de ação lê como defeito. */
  user-select: none;
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              translate var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

a.ucam-btn { text-decoration: none; }

/* O botão AFUNDA 1px ao ser pressionado — é o active:translate-y-px da base,
 * e era o que faltava para o clique ter resposta física e não só troca de
 * cor. Fica de fora quem abre menu (aria-haspopup): esse não "afunda", ele
 * permanece aberto, e o pulo brigaria com o painel que aparece ancorado. */
.ucam-btn:active:not(:disabled):not([aria-disabled="true"]):not([aria-haspopup]) {
  translate: 0 1px;
}

.ucam-btn--primary {
  background: var(--ucam-color-action-primary-default);
  color: var(--ucam-color-text-on-action);
}
.ucam-btn--primary:hover:not(:disabled)  { background: var(--ucam-color-action-primary-hover); }
.ucam-btn--primary:active:not(:disabled) { background: var(--ucam-color-action-primary-active); }

/* A sombra de 1px que o campo já tinha, agora também aqui.
 *
 * Com a borda em repouso em #E4E4E4 (emenda da ADR-009), o filete sozinho não
 * diz mais onde o botão de apoio começa — sobre um card branco ele quase não
 * existe. A sombra devolve a leitura de "isto é uma superfície acionável" sem
 * escurecer o traço, que é exatamente a troca que a emenda propõe: o limite
 * do controle deixa de depender de uma linha escura e passa a vir de
 * preenchimento, filete e um degrau mínimo de elevação. É o mesmo valor do
 * .ucam-input — o par botão/campo tem de ler como a mesma família. */
.ucam-btn--secondary {
}

.ucam-btn--secondary {
  background: var(--ucam-color-action-secondary-default);
  color: var(--ucam-color-text-primary);
  border-color: var(--ucam-color-action-secondary-border);
}
.ucam-btn--secondary:hover:not(:disabled)  { background: var(--ucam-color-action-secondary-hover); }
.ucam-btn--secondary:active:not(:disabled) { background: var(--ucam-color-action-secondary-active); }

.ucam-btn--ghost {
  background: transparent;
  color: var(--ucam-color-text-secondary);
}
.ucam-btn--ghost:hover:not(:disabled) { background: var(--ucam-color-action-secondary-hover); }

/* TOM, NÃO VARIANTE — ADR-015.
 *
 * O vermelho deixou de ser um quarto peso e virou um eixo próprio, que pinta
 * a variante escolhida em vez de substituí-la. É o mesmo data-tone que o
 * .ucam-list-item já usa, e a razão de ser atributo e não classe é essa: um
 * ".ucam-btn--secondary.ucam-btn--danger" obrigaria a escrever a regra de
 * cada par, enquanto o atributo cruza com qualquer peso sem multiplicar
 * nomes.
 *
 * Ordem importa aqui e não é acidente: estas regras ficam ANTES do bloco
 * :disabled. Um '.ucam-btn--primary[data-tone=danger]' e um
 * '.ucam-btn:disabled' têm a MESMA especificidade (0,2,0) — quem vier depois
 * ganha, e quem tem de ganhar é o desabilitado. Mover este bloco para baixo
 * faz o botão de excluir continuar vermelho depois de desativado, que é
 * exatamente a promessa que ele não pode fazer. */
.ucam-btn--primary[data-tone="danger"] {
  background: var(--ucam-color-action-danger-default);
  color: var(--ucam-color-text-on-action);
  border-color: transparent;
}
.ucam-btn--primary[data-tone="danger"]:hover:not(:disabled)  { background: var(--ucam-color-action-danger-hover); }
.ucam-btn--primary[data-tone="danger"]:active:not(:disabled) { background: var(--ucam-color-action-danger-active); }

/* Contorno vermelho: a exclusão que mora numa linha de tabela. A borda é o
 * portador do significado, então vai no danger-default (6,86:1 sobre branco)
 * e não no filete claro do secondary neutro, que existe para não competir. */
.ucam-btn--secondary[data-tone="danger"] {
  color: var(--ucam-color-action-danger-default);
  border-color: var(--ucam-color-action-danger-default);
}
.ucam-btn--secondary[data-tone="danger"]:hover:not(:disabled)  { background: var(--ucam-color-action-danger-subtle); }
.ucam-btn--secondary[data-tone="danger"]:active:not(:disabled) {
  background: var(--ucam-color-action-danger-subtle);
  border-color: var(--ucam-color-action-danger-active);
}

.ucam-btn--ghost[data-tone="danger"] {
  color: var(--ucam-color-action-danger-default);
}
.ucam-btn--ghost[data-tone="danger"]:hover:not(:disabled) { background: var(--ucam-color-action-danger-subtle); }

/* @deprecated — remover em 0.2.0.
 *
 * O Trilho A já está publicado no parque: quebrar a classe de um dia para o
 * outro não é migração, é pane. Ela sobrevive como apelido exato de
 * primary+danger, e o mapa de conversão está em spec/components/button.json.
 * A data existe para que isto seja dívida com prazo, e não um segundo jeito
 * permanente de dizer a mesma coisa. */
.ucam-btn--danger {
  background: var(--ucam-color-action-danger-default);
  color: var(--ucam-color-text-on-action);
}
.ucam-btn--danger:hover:not(:disabled)  { background: var(--ucam-color-action-danger-hover); }
.ucam-btn--danger:active:not(:disabled) { background: var(--ucam-color-action-danger-active); }

.ucam-btn:disabled,
.ucam-btn[aria-disabled="true"] {
  background: var(--ucam-color-action-disabled-background);
  color: var(--ucam-color-action-disabled-text);
  border-color: transparent;
  cursor: not-allowed;
}

/* Fantasma indisponível continua sem fundo. O cinza de disabled num botão que
 * em repouso não tem superfície vira um quadrado cinza por linha de tabela —
 * doze lápis de "editar natureza" em doze caixas cinzas. A tinta de disabled
 * sozinha já diz que não age. */
.ucam-btn--ghost:disabled,
.ucam-btn--ghost[aria-disabled="true"] {
  background: transparent;
  /* E POR NÃO TER CHÃO, TROCA DE TINTA (ADR-042). action.disabled.text é
   * medido contra o chão do controle: sobre o card ele dá 7,23:1 e o
   * fantasma bloqueado volta a ler como texto ativo. Quem responde pelo card
   * é text.disabled, a 4,71:1. É a mesma regra que separou os dois tokens —
   * cada tinta responde pela superfície que ela realmente tem embaixo — e
   * este é o único botão do catálogo que cai do outro lado dela. */
  color: var(--ucam-color-text-disabled);
}

/* ECO DE AÇÃO (ADR-033). O controle diz que terminou no próprio lugar: a linha
 * arquivada, o selo que mudou, o evento que entrou na linha do tempo piscam no
 * tom do realce e voltam. Toast está fora do catálogo; isto é o que o contrato
 * do alerta chama de "o próprio controle dizer que terminou". */
@keyframes ucam-eco {
  from { background-color: var(--ucam-color-realce-background); }
}

.ucam [data-eco],
.ucam tr[data-eco] > td {
  animation: ucam-eco 1.6s var(--ucam-motion-easing-standard);
}

/* block-size, não min-block-size: .ucam-btn crava a altura, e um mínimo
 * contra altura fixa resolve para a altura fixa — as duas variantes mexiam
 * só no padding e a altura ficava sempre a mesma. */
.ucam-btn--sm { block-size: var(--ucam-size-control-sm); padding: 0 var(--ucam-space-inset-sm); font-size: var(--ucam-typography-caption-font-size); }
.ucam-btn--lg { block-size: var(--ucam-size-control-lg); padding: 0 var(--ucam-space-inset-lg); font-size: var(--ucam-typography-body-font-size); }

/* Botão menor, raio menor — é o rounded-[min(var(--radius-md),12px)] que a
 * base aplica só no sm. Sem isto o mesmo radius-lg de 10px num controle de
 * 32px de altura come quase um terço da borda e o botão lê como pastilha,
 * não como botão. O ícone NÃO encolhe junto: o
 * degrau de ícone do botão é um só, 16px, e está no bloco de escala por
 * papel lá em cima — é o mesmo que o <ucam-button> do Trilho B entrega
 * (size="sm" fixo, em ucam-button.ts). Ter dois degraus de ícone para a
 * mesma peça foi o que produziu a mesma fileira com três medidas. */
.ucam-btn--sm { border-radius: var(--ucam-radius-control-sm); }

/* Ícone respira menos que texto. A base declara isso por variante
 * (has-data-[icon=inline-start]:pl-2); aqui sai do :has(), que lê a mesma
 * situação direto do markup e não exige atributo novo em cada botão.
 * O botão só-ícone fica de fora: ele já tem padding zero e largura fixa.
 *
 * O :where() EM VOLTA DAS DUAS CONDIÇÕES é o que impede esta regra de
 * atropelar quem a contextualiza. Sem ele o seletor pesa quatro classes
 * (.ucam-btn + .ucam-btn--icon dentro do :not + .ic e :first-child dentro do
 * :has) e passava por cima de .ucam-nav__cta .ucam-btn e de
 * .ucam-shell--nav-recolhida .ucam-nav__cta .ucam-btn — duas regras escritas
 * justamente para alinhar o ícone da ação primária com a coluna de ícones da
 * navegação. Medido em 09/09/2026: a conta do recuo estava escrita no
 * comentário e o padding computado era 8px, o desta linha; o ícone do "Novo
 * requerimento" caía a 17px da borda enquanto os seis itens abaixo tinham o
 * seu a 21, e na barra recolhida o quadrado de 40px ficava com 8px de recuo
 * de um lado só. As duas condições existem para ESTREITAR o alcance da
 * regra, não para lhe dar peso: dentro de :where() elas continuam
 * estreitando e param de pesar. */
.ucam-btn:where(:not(.ucam-btn--icon)):where(:has(> .ic:first-child)) { padding-inline-start: var(--ucam-space-inline-sm); }
.ucam-btn:not(.ucam-btn--icon):has(> .ic:last-child)  { padding-inline-end: var(--ucam-space-inline-sm); }

/* Botão apenas com ícone. Contrato icon-button.json: exige nome acessível.
 *
 * QUADRADO MACIO, e não o círculo de antes. Reversão consciente: o círculo
 * separava bem o botão de ícone do botão com rótulo, mas ao preço de o
 * ÍCONE deixar de pertencer à mesma família do resto da barra — numa fileira
 * de "Exportar", "Filtros" e três ações de ícone, os redondos leem como
 * outra origem. As duas referências que o projeto adotou desenham a barra de
 * ferramentas assim: mesmo raio de controle em tudo que se clica, e a
 * distinção fica no fato de não haver rótulo. O círculo continua existindo
 * onde o conteúdo é redondo por natureza — avatar. */
.ucam-btn--icon {
  padding: 0;
  inline-size: var(--ucam-size-control-md);
  min-inline-size: var(--ucam-size-control-md);
  border-radius: var(--ucam-radius-control);
}

/* INTERRUPTOR de ícone — icon-button.json, prop \`pressed\`.
 *
 * O seletor é o aria-pressed, como no segmented: o que o leitor de tela
 * anuncia e o que a tela pinta saem do MESMO atributo, e um não pode
 * dessincronizar do outro sem que os dois quebrem juntos.
 *
 * Estado é TINTA translúcida (ADR-013), não fundo sólido: a estrela que fixa
 * um módulo vive sobre o cartão branco, sobre a faixa da tabela e sobre o
 * painel escuro, e o mesmo degrau precisa valer nos três.
 *
 * O ícone ganha o bordô da ação primária — mas quem carrega o estado sem cor
 * é o PREENCHIMENTO do SVG, que a marcação troca junto com o atributo. Cor
 * sozinha não distingue (WCAG 1.4.1) e, numa grade de vinte estrelas iguais,
 * a diferença de matiz é a primeira coisa que some. */
.ucam-btn--icon[aria-pressed="true"] {
  background-image: linear-gradient(var(--ucam-color-interaction-selected), var(--ucam-color-interaction-selected));
  color: var(--ucam-color-action-primary-default);
  /* A FORMA muda junto com a cor: o ícone do sprite lê o fill desta variável,
   * e a estrela sai do traçado para o sólido. Atravessa a fronteira do <use>
   * porque é custom property — nenhum seletor alcança o conteúdo clonado. */
  --ucam-icon-fill: currentColor;
}

/* Pressionado E sob o ponteiro: as duas tintas se EMPILHAM em vez de a
 * segunda substituir a primeira — é o que duas camadas de background-image
 * dão e background-color não daria. Sem isso, apontar um botão já pressionado
 * o deixava mais claro que o vizinho solto sob o ponteiro. */
.ucam-btn--icon[aria-pressed="true"]:hover:not(:disabled) {
  background-image:
    linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover)),
    linear-gradient(var(--ucam-color-interaction-selected), var(--ucam-color-interaction-selected));
}

/* -------------------------------------------------------------- campo --- */
/* Contrato: text-field.json e select.json. ADR-004: rótulo persistente
 * acima do controle, nunca flutuante nem substituído por placeholder. */

.ucam-field {
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-sm);
  /* O RESET DE FIELDSET, que faltava.
   *
   * O contrato permite agrupar campos em <fieldset class="ucam-field"> — é o
   * que a tela de novo requerimento faz no grupo "Anexos" —, e aí o navegador
   * traz a moldura dele: borda de 2px em groove, recuo de 0,35em/0,75em/0,625em
   * e a legenda recortando o traço. Medido na tela: 4,9px de recuo em cima,
   * 10,5 dos lados, 8,75 embaixo — três valores que não existem na escala,
   * numa caixa com contorno que nenhum outro agrupamento do sistema tem. O
   * .ucam-choice-grid já zerava isto por conta própria; a parte que ele copiou
   * pertence aqui, onde vale para todo agrupamento.
   *
   * min-inline-size: 0 entra junto porque o fieldset tem largura mínima
   * automática por padrão e não encolhe dentro de uma grade — sem ele um
   * grupo de campos estoura a coluna em vez de acompanhar. */
  border: 0;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}

.ucam-field + .ucam-field { margin-block-start: var(--ucam-space-stack-md); }

/* A regra acima é de EMPILHAMENTO: dois campos um sob o outro precisam do vão
 * de bloco. Ela não sabe distinguir isso de dois campos LADO A LADO, e o
 * seletor irmão dispara igual — o segundo campo de uma fileira descia 16px em
 * relação ao primeiro. A fileira de formulário já zerava por conta própria
 * (.ucam-form-row > .ucam-field, logo acima); os outros arranjos horizontais
 * não, e o defeito estava visível no cabeçalho da tela de analytics, onde "De"
 * e "Até" nasciam desalinhados por exatamente esses 16px.
 *
 * Não há seletor de "meu pai dispõe em linha", então a lista é explícita — a
 * mesma escolha que a fileira de formulário já tinha feito. */
.ucam-cluster > .ucam-field + .ucam-field,
.ucam-toolbar > .ucam-field + .ucam-field,
.ucam-form-actions > .ucam-field + .ucam-field,
.ucam-page-header__acoes > .ucam-field + .ucam-field,
.ucam-inbox__lista-topo > .ucam-field + .ucam-field { margin-block-start: 0; }

/* ------------------------------------------------------ linha de campos --- */
/* Campos lado a lado alinham em TRÊS trilhos: rótulo, controle e apoio.
 *
 * Alinhar por flex quebra: com align-items:end, um campo que tem hint fica
 * mais alto e empurra o próprio rótulo para baixo; com align-items:start,
 * rótulos de duas linhas desalinham os controles. Subgrid resolve os dois
 * casos — é a razão de a linha existir como componente e não como utilitário
 * de layout solto.
 *
 * A ausência desse padrão é o que produziu, no legado, campos de larguras e
 * alturas arbitrárias na mesma linha. */

.ucam-form-row {
  display: grid;
  /* As colunas são declaradas pela LINHA, não pelos campos: grid-auto-columns
   * e grid-template-columns são propriedades do container, e um item não
   * consegue definir a largura da própria trilha. Tentar fazer isso pelo
   * campo é silencioso — nada cresce e sobra espaço morto na direita.
   *
   * O padrão distribui igualmente e preenche a linha; --ucam-cols permite
   * precisão quando há campo de largura fixa:
   *   style="--ucam-cols: max-content 1fr max-content" */
  --ucam-cols: repeat(auto-fit, minmax(11rem, 1fr));
  grid-template-columns: var(--ucam-cols);
  grid-template-rows: auto auto auto;
  grid-auto-flow: column;
  gap: 0 var(--ucam-space-inline-md);
  align-items: start;
}

.ucam-form-row > .ucam-field {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
  gap: var(--ucam-space-stack-sm);
  margin-block-start: 0;
  min-inline-size: 0;
}

/* TETO DO CONTROLE. A trilha da grade diz quanto ESPAÇO o campo tem; ela não
 * pode dizer quanto o DADO mede. Sem teto, 1fr numa coluna de 64rem entrega
 * 487px a um select de "Atibaia · EAD" e 829px ao Nome — foi o que a tela de
 * novo usuário mostrou, medida em 19/09/2026. Campo largo demais mente sobre
 * o tamanho do que se espera, que é a regra largura-pelo-dado de formats.json,
 * e ainda separa o rótulo do fim do valor por meio palmo de branco.
 *
 * 30rem é o limite do que se lê num campo de uma linha — o e-mail mais longo
 * do parque cabe. Quem precisa de menos declara a coluna na fileira
 * (--ucam-cols) ou a medida do dado (.ucam-field--cpf e irmãos); quem precisa
 * de mais é texto de vários parágrafos, e isso é textarea, que fica de fora.
 *
 * Teto e não largura: o campo continua encolhendo com a coluna. */
.ucam-form-row > .ucam-field :is(.ucam-input, .ucam-select, .ucam-input-group, [data-listbox]) {
  max-inline-size: 30rem;
}

/* Item que NÃO é campo — um interruptor, um botão — na fileira de campos.
 *
 * A fileira alinha em três trilhos (rótulo, controle, apoio) e cada campo
 * ocupa os três por subgrid. Quem não é campo caía no PRIMEIRO trilho, o do
 * rótulo, e assentava na altura dos rótulos vizinhos em vez da dos controles:
 * na tela de cálculo de mensalidade, "Rematrícula" nascia ao lado da palavra
 * "Referência" e não ao lado da caixa 08/2026. A tela tentava consertar com um
 * padding-block-end de .4rem, que aproximava sem acertar.
 *
 * O lugar de um controle é o trilho do controle. */
.ucam-form-row > :not(.ucam-field) { grid-row: 2; }

/* Campo que ocupa a sobra: a coluna já é 1fr, aqui só se garante que o
 * controle acompanhe a largura da trilha. */
.ucam-form-row > .ucam-field--grow { inline-size: 100%; }
.ucam-form-row > .ucam-field--grow .ucam-input,
.ucam-form-row > .ucam-field--grow .ucam-select { inline-size: 100%; }

/* Sem subgrid, cai para alinhamento pelo topo: os controles desalinham se um
 * rótulo quebrar em duas linhas, mas nada empurra rótulo para baixo. */
@supports not (grid-template-rows: subgrid) {
  .ucam-form-row { display: flex; flex-wrap: wrap; align-items: start; }
}

.ucam-form-row + .ucam-form-row { margin-block-start: var(--ucam-space-stack-md); }

/* EMPILHADA, a linha deixa de ser grade. Com grid-row: auto o campo perdia o
 * span 3 e o subgrid ficava com UM trilho só: rótulo, controle e dica pintados
 * no mesmo lugar. E as colunas de --ucam-cols continuavam valendo — a 390px o
 * cálculo de mensalidade punha três datas lado a lado, a terceira fora da tela
 * (medido em 12/09/2026). Em pilha não há vizinho com quem alinhar, então o
 * campo volta a ser a própria grade; quem não é campo não estica. */
${abaixo('controle-deitado')} {
  .ucam-form-row { display: flex; flex-direction: column; align-items: stretch; gap: var(--ucam-space-stack-md); }
  .ucam-form-row > .ucam-field { grid-template-rows: none; grid-row: auto; }
  .ucam-form-row > :not(.ucam-field) { align-self: flex-start; }
}

.ucam-field__label {
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: var(--ucam-typography-label-line-height);
  color: var(--ucam-color-text-primary);
}

/* Asterisco decorativo: a obrigatoriedade real vem de required/aria-required. */
.ucam-field__required {
  color: var(--ucam-color-action-primary-default);
  margin-inline-start: 0.15em;
}

.ucam-field__hint,
.ucam-field__error {
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
}
.ucam-field__hint  { color: var(--ucam-color-text-secondary); }
.ucam-field__error { color: var(--ucam-color-feedback-danger-foreground); }

.ucam-input,
.ucam-select,
.ucam-textarea {
  inline-size: 100%;
  block-size: var(--ucam-size-control-md);
  padding: 0 var(--ucam-space-inset-sm);
  /* PAPEL, não transparente. Sobre a página branca não fazia diferença; sobre
   * a moldura (surface-chrome) o campo transparente herdava o cinza e virava
   * o poço cinza que a revisão de 09/09/2026 tirou de busca, segmented e
   * filtro — a lista de setores mostrava exatamente isso no "Pesquisar setor".
   * O campo é o lugar onde se escreve; ele é papel em qualquer superfície. */
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
  /* Borda leve em repouso (ADR-009); a identificação em 3:1 vem do hover e
   * do anel de foco, logo abaixo. */
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-control);
  /* SEM SOMBRA. Era um shadow-xs para devolver a leitura de "caixa onde se
   * digita" sem escurecer o filete — mas isso punha o campo meio milímetro
   * fora do plano da página, e um formulário de doze campos virava doze peças
   * flutuando. Com elevation.raised em none, cartão e painel também assentaram:
   * manter só o campo levitando faria dele a única superfície descolada da
   * tela. Quem identifica o controle em repouso é o filete; em 3:1, o hover e
   * o anel de foco (ADR-009). */
  font-family: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: var(--ucam-size-control-md);
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* Anel suave de 3px, como na base. É ele que carrega a 1.4.11. */
.ucam-input:focus-visible,
.ucam-select:focus-visible,
.ucam-textarea:focus-visible {
  outline: none;
  border-color: var(--ucam-color-border-focus);
  /* 50%, não 30%: é a opacidade que a base usa (ring-ring/50). A 30% o anel
   * quase sumia sobre fundo claro — era o degrau mais fraco do sistema de
   * foco, justo no elemento em que se digita. */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ucam-color-border-focus) 50%, transparent);
}

.ucam-input::placeholder,
.ucam-textarea::placeholder { color: var(--ucam-color-text-placeholder); }

.ucam-input:hover:not(:disabled):not([readonly]),
.ucam-select:hover:not(:disabled),
.ucam-textarea:hover:not(:disabled):not([readonly]) { border-color: var(--ucam-color-border-strong); }

/* -------------------------------------------------------- input-group --- */
/* Contrato: input-group.json.
 *
 * Este bloco NÃO EXISTIA. O contrato declarava ".ucam-input-group" como raiz
 * do Trilho A e o gerador nunca emitiu uma linha — o mesmo defeito de
 * "ucam-tooltip" e de "ucam-choice-card__figura", e pela mesma razão: nada
 * conferia se a raiz declarada num contrato chega a virar CSS. Agora confere,
 * na seção 6 do validador.
 *
 * A REGRA DO COMPONENTE, e é dela que sai toda a folha: o CONTORNO É DO
 * GRUPO. Borda, raio, sombra e anel de foco moram no root; o campo de dentro
 * entra sem borda e sem fundo. Dois contornos aninhados é o defeito visual
 * mais comum deste componente e o que o contrato proíbe primeiro.
 *
 * Por isso o foco é ":focus-within" e não ":focus" — quem recebe o foco é o
 * campo, quem desenha o anel é o grupo. E por isso a AÇÃO, que tem foco
 * próprio, reivindica o anel de volta para ela: são dois focos distintos
 * porque são dois alvos distintos, e desenhar o anel do grupo quando o botão
 * está focado diria que o campo está ativo quando não está. */

.ucam-input-group {
  display: flex;
  align-items: stretch;
  inline-size: 100%;
  block-size: var(--ucam-size-control-md);
  /* A GEOMETRIA É A DO CAMPO, copiada por token e não por número: borda leve
   * de repouso (ADR-009), mesmo raio, mesma sombra rasa. O grupo tem de ser
   * indistinguível de um .ucam-input até a pessoa reparar no que está grudado
   * nele. Papel, pela mesma razão do .ucam-input. */
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-primary);
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-input-group:hover:not([data-disabled]) { border-color: var(--ucam-color-border-strong); }

/* O anel do GRUPO, quando o foco está no campo. Mesmo desenho e mesma
 * opacidade do .ucam-input: um grupo que acende diferente de um campo solto
 * ensina que são coisas diferentes, e não são. */
.ucam-input-group:focus-within {
  border-color: var(--ucam-color-border-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ucam-color-border-focus) 50%, transparent);
}

/* MAS NÃO quando quem tem o foco é a ação. O :has é o que distingue as duas
 * situações — sem ele o grupo inteiro acendia ao tabular para o botão de
 * limpar, dizendo "você está no campo" enquanto o cursor não estava lá. */
.ucam-input-group:has(.ucam-input-group__acao:focus-visible) {
  border-color: var(--ucam-color-border-default);
}

/* O GRUPO LÊ O ATRIBUTO DO CONTROLE, e não só o data-invalid do host.
 *
 * O data-invalid é o que o wrapper do Trilho B carimba. Numa tela de Trilho A
 * quem escreve o markup marca o CONTROLE com aria-invalid, que é onde a
 * semântica mora — e o grupo ficava sem pintar: no login recusado o CPF
 * ganhava o filete e a senha, que vive dentro de um grupo por causa do botão
 * de revelar, não ganhava nada. Dois campos igualmente recusados com
 * aparências diferentes.
 *
 * Exigir os dois atributos em sincronia seria a divergência que o contrato do
 * Field proíbe em outras palavras: o CSS lê o atributo, não uma classe de
 * estado paralela. */
.ucam-input-group[data-invalid],
.ucam-input-group:has(.ucam-input-group__controle[aria-invalid="true"]) {
  border-color: var(--ucam-color-feedback-danger-border);
}

.ucam-input-group[data-invalid]:focus-within,
.ucam-input-group:has(.ucam-input-group__controle[aria-invalid="true"]):focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ucam-color-feedback-danger-border) 50%, transparent);
}

.ucam-input-group[data-disabled] {
  background: var(--ucam-color-action-disabled-background);
  color: var(--ucam-color-action-disabled-text);
  cursor: not-allowed;
}

/* O CONTROLE. Sem borda, sem fundo, sem sombra e sem anel: as quatro coisas
 * que o root já faz. E com a ALTURA INTEIRA do grupo — a faixa de 1px que
 * sobrava em cima e embaixo com o campo em altura própria é área dentro do
 * contorno onde o clique não focava nada. */
.ucam-input-group__controle {
  flex: 1 1 auto;
  min-inline-size: 0;
  block-size: 100%;
  padding: 0 var(--ucam-space-inset-sm);
  border: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  color: inherit;
  font-family: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
}

.ucam-input-group__controle:focus,
.ucam-input-group__controle:focus-visible {
  outline: none;
  box-shadow: none;
}

.ucam-input-group__controle::placeholder { color: var(--ucam-color-text-placeholder); }

/* O ADORNO: unidade, prefixo, ícone. Tinta secundária porque não é o dado —
 * "R$" ao lado de um valor é rótulo, e rótulo em tinta cheia disputa leitura
 * com o número, que é o que se veio ler. Sem borda separando: o contrato pede
 * que o conjunto leia como UM controle, e um filete interno o parte em dois. */
.ucam-input-group__adorno {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  flex: none;
  padding-inline: var(--ucam-space-inset-sm);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
  white-space: nowrap;
  /* Não recebe foco e não é clicável, então também não é selecionável: texto
   * de adorno arrastado junto com o valor é o que faz uma cópia sair
   * "R$1.240,00" quando o campo vale 1240. */
  user-select: none;
}

/* Adorno no início não paga o recuo duas vezes: o controle já tem o dele. */
.ucam-input-group__adorno + .ucam-input-group__controle { padding-inline-start: 0; }
.ucam-input-group__controle + .ucam-input-group__adorno { padding-inline-start: 0; }

/* A AÇÃO. Quadrada, alinhada à altura do grupo, e com o raio interno
 * descontado da borda de 1px — sem esse desconto o canto do botão fica com um
 * fio claro por fora do raio do grupo, que é o detalhe que denuncia grupo
 * montado com peças soltas. */
.ucam-input-group__acao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: var(--ucam-size-control-md);
  block-size: 100%;
  padding: 0;
  border: 0;
  border-radius: calc(var(--ucam-radius-control) - 1px);
  background: none;
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-input-group__acao:hover:not(:disabled) {
  background: var(--ucam-color-interaction-hover);
  color: var(--ucam-color-text-primary);
}

.ucam-input-group__acao:disabled { cursor: not-allowed; color: var(--ucam-color-action-disabled-text); }

/* O anel PRÓPRIO da ação, recolhido para dentro do grupo. Offset negativo
 * porque um anel de 3px para fora de um botão que encosta na borda do grupo
 * sairia por cima dela e por cima do que estiver do lado. */
.ucam-input-group__acao:focus-visible {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: -2px;
}

/* ------------------------------------------------------ campo de número --- */
/* As SETINHAS NATIVAS saem de todo campo de número do sistema. O Chrome as
 * desenha só no hover, com 15px de largura e 8px de altura cada — dois alvos
 * de meio controle, abaixo do piso de 24px da 2.5.8, numa tinta de sistema
 * operacional que não é nenhuma do sistema. No Firefox elas ficam sempre
 * visíveis e com outro desenho. Teclado não perde nada: ↑ e ↓ continuam
 * somando no campo, que é comportamento do <input>, não das setinhas. */
.ucam-input[type="number"],
.ucam-input-group__controle[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
  font-variant-numeric: tabular-nums;
}

.ucam-input[type="number"]::-webkit-inner-spin-button,
.ucam-input[type="number"]::-webkit-outer-spin-button,
.ucam-input-group__controle[type="number"]::-webkit-inner-spin-button,
.ucam-input-group__controle[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Quem precisa de passo por ponteiro usa o GRUPO de número: − e + como ações
 * do input-group, cada uma com a altura inteira do campo (32px) — alvo
 * inteiro, e não metade empilhada. O filete entre as duas é o único filete
 * interno do grupo, e existe porque dois botões quadrados colados sem ele leem
 * como um botão largo. O comportamento é o data-passo do estadoScript, que
 * delega para stepUp/stepDown: min, max e step moram no <input>. */
.ucam-input-group--numero .ucam-input-group__acao {
  inline-size: var(--ucam-size-control-md);
  color: var(--ucam-color-text-secondary);
}

.ucam-input-group--numero .ucam-input-group__acao + .ucam-input-group__acao {
  border-inline-start: 1px solid var(--ucam-color-border-subtle);
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}

.ucam-input-group--numero .ucam-input-group__controle + .ucam-input-group__acao {
  border-inline-start: 1px solid var(--ucam-color-border-subtle);
  border-radius: 0;
}

.ucam-input-group--numero .ucam-input-group__acao .ic {
  inline-size: var(--ucam-size-icon-sm);
  block-size: var(--ucam-size-icon-sm);
}

/* ------------------------------------------------------------- anexo --- */

/* O ANEXO é o arquivo como PEÇA: figura do formato, nome, formato e tamanho,
 * e no máximo uma ação. É a mesma peça antes e depois do envio — no File
 * Field ele é o que foi escolhido, no detalhe do requerimento é o que chegou
 * — porque quem anexou e quem analisa estão falando do mesmo arquivo, e duas
 * caras para ele eram dois vocabulários para a mesma coisa.
 *
 * A GRADE preenche por largura mínima e não por contagem de colunas: um
 * requerimento tem um anexo, outro tem cinco, e a coluna estreita do painel
 * lateral cai para uma coluna sozinha. O min(100%, …) é o que impede a
 * trilha de 15rem de estourar um contêiner de 320px. */
.ucam-anexos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--ucam-space-stack-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* O TILE. Contorno, não preenchimento: a grade pode ter cinco itens, e cinco
 * blocos cinza lado a lado viram uma mancha em que nenhum nome se lê. */
.ucam-anexo {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-inline-size: 0;
  padding: var(--ucam-space-inset-sm);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-control);
  background: var(--ucam-color-surface-default);
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* A FIGURA diz o formato antes do nome ser lido: documento, imagem ou outro.
 * Mesma medida e mesmo poço do IconTile, mas não é ele — o ladrilho não
 * carrega estado, e a figura do anexo recusado troca de desenho e de tinta. */
.ucam-anexo__figura {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border-radius: var(--ucam-radius-control);
  background: var(--ucam-color-surface-sunken);
  color: var(--ucam-color-text-secondary);
}

/* O min-inline-size:0 é o que permite o nome truncar: sem ele o item flex
 * adota a largura do conteúdo e o tile estoura a trilha da grade. */
.ucam-anexo__corpo {
  flex: 1 1 auto;
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

/* O nome é o DADO PRINCIPAL e trunca numa linha, com o nome inteiro no title.
 * Na leitura ele é o link, e o link estica sobre o tile inteiro — o alvo é a
 * peça toda, e o nome acessível é só o nome do arquivo. */
.ucam-anexo__nome {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ucam-typography-body-sm-font-size);
  /* A ENTRELINHA É DECLARADA, e não herdada. Sem ela cada trilho pega a razão
   * da página em que caiu — medido no catálogo: 21,45px no componente Angular
   * contra 20px no preview, e o tile inteiro saía 1px mais alto de um lado. */
  line-height: var(--ucam-typography-body-sm-line-height);
  color: var(--ucam-color-text-primary);
  text-decoration: none;
}

/* O nome que AGE é link (a com href e download) quando o arquivo tem URL, e
 * botão quando ele vem de uma chamada autenticada — o anexo de requerimento
 * costuma estar atrás do login, e aí não há href para dar. O botão perde o
 * desenho de botão: aqui ele é só o nome. */
button.ucam-anexo__nome {
  display: block;
  inline-size: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  text-align: start;
  cursor: pointer;
}

:is(a, button).ucam-anexo__nome::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--ucam-radius-control);
}

/* UM sinal no hover: o filete sobe um degrau. Sem sombra, sem fundo — o
 * tile não sai da página, só responde ao ponteiro. */
.ucam-anexo:has(:is(a, button).ucam-anexo__nome:hover) {
  border-color: var(--ucam-color-border-default);
}

/* O anel de foco é do tile, pelo mesmo motivo do cartão acionável: contorno
 * em volta do texto, dentro de uma peça que já tem borda, lê como campo. */
.ucam-anexo:has(:is(a, button).ucam-anexo__nome:focus-visible) {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

:is(a, button).ucam-anexo__nome:focus-visible { outline: none; }

/* Formato, tamanho, estado e motivo da recusa moram na mesma linha de apoio:
 * são as respostas que o parque não dava, e juntas cabem numa caption. */
.ucam-anexo__apoio {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
  color: var(--ucam-color-text-secondary);
}

/* A AÇÃO do canto — remover no envio, tentar de novo no erro — sobe acima do
 * link esticado. Sem o z-index o pseudo-elemento cobre o botão e o clique
 * baixa o arquivo em vez de removê-lo. */
.ucam-anexo__acao {
  position: relative;
  z-index: 1;
  flex: none;
}

/* O INDÍCIO de download na leitura: decorativo, aria-hidden. Diz "isto baixa"
 * a quem só vê; quem ouve já ouviu "link" e o nome do arquivo. */
.ucam-anexo__indicio {
  flex: none;
  color: var(--ucam-color-text-secondary);
}

/* A BARRA DE PROGRESSO fica NO TILE, não no pé da grade. Com vários envios ao
 * mesmo tempo, uma barra só não diz de qual arquivo ela fala. */
.ucam-anexo__progresso {
  inline-size: 100%;
  block-size: 3px;
  margin-block-start: 0.25rem;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-border-subtle);
  overflow: hidden;
}

.ucam-anexo__progresso > span {
  display: block;
  block-size: 100%;
  background: var(--ucam-color-action-primary-default);
}

/* O TILE RECUSADO FICA. Sumir com o arquivo que não passou é exatamente o
 * defeito do parque — o descarte em silêncio. Ele permanece na grade, em tom
 * de erro, com o motivo no apoio e circleAlert na figura (a recusa não é dita
 * só pela cor), até quem anexou removê-lo. O erro de envio veste o mesmo. */
.ucam-anexo--recusado,
.ucam-anexo--erro {
  border-color: var(--ucam-color-feedback-danger-border);
}

.ucam-anexo--recusado .ucam-anexo__figura,
.ucam-anexo--erro .ucam-anexo__figura {
  background: var(--ucam-color-feedback-danger-background);
  color: var(--ucam-color-feedback-danger-foreground);
}

.ucam-anexo--recusado .ucam-anexo__apoio,
.ucam-anexo--erro .ucam-anexo__apoio {
  color: var(--ucam-color-feedback-danger-foreground);
  white-space: normal;
}

/* --------------------------------------------------------- file-field --- */
/* Contrato: file-field.json.
 *
 * Segundo bloco que o contrato declarava e o gerador nunca emitiu. O que o
 * Trilho A entrega aqui é APARÊNCIA: o gatilho, a lista, a linha do arquivo e
 * o tom da linha recusada. Ele não escolhe arquivo, não valida accept nem
 * maxSize, não gera a frase de regra e não anuncia nada em aria-live — isso é
 * do Trilho B, e está escrito no contrato para não ser descoberto na tela.
 *
 * O motivo de o componente existir está na primeira linha do contrato e vale
 * repetir aqui, porque é ele que decide o desenho: em TODO o parque o arquivo
 * fica invisível depois de escolhido. Não se sabe o nome, nem o tamanho, nem
 * se subiu, nem por que foi recusado. Toda decisão abaixo serve a tornar
 * essas quatro coisas visíveis ao mesmo tempo, numa linha só por arquivo. */

.ucam-file-field {
  /* Fieldset zerado, como no radio-group: o navegador desenha moldura e recuo
   * próprios que não são do sistema. */
  border: 0;
  margin: 0;
  padding: 0;
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-sm);
}

/* O gatilho é um <button> de verdade acionando um input file oculto. O input
 * sai por posição, nunca por display:none — escondido assim ele deixa de ser
 * alcançável e o campo perde o suporte nativo de arrastar e soltar. */
.ucam-file-field__entrada {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.ucam-file-field__gatilho {
  align-self: start;
}

/* A ÁREA DE SOLTAR. Tracejada, e só ela: é a convenção que diz "pode arrastar
 * para cá" sem precisar de frase. Contorno em vez de preenchimento porque o
 * campo pode conviver com uma lista longa embaixo, e um bloco cinza de 6rem
 * empurraria a lista para fora da vista a cada anexo. */
.ucam-file-field__alvo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ucam-space-stack-sm);
  padding: var(--ucam-space-inset-lg) var(--ucam-space-inset-sm);
  border: 1px dashed var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-control);
  text-align: center;
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* Enquanto há arrasto por cima. O atributo é do CAMPO INTEIRO e não da área:
 * quem arrasta um arquivo raramente acerta o retângulo de primeira, e a
 * confirmação de "pode soltar" tem de aparecer antes da mira. */
.ucam-file-field[data-sobre-o-alvo] .ucam-file-field__alvo {
  border-color: var(--ucam-color-border-focus);
  border-style: solid;
  background: var(--ucam-color-action-primary-subtle);
}

/* A LISTA do campo é a grade do Anexo (.ucam-anexos): ver a seção anexo. */


/* Em leitura não há gatilho nem remover: a lista é o dado, e um botão que não
 * age só ocupa a coluna onde estaria a informação. */
.ucam-file-field[data-readonly] .ucam-file-field__gatilho,
.ucam-file-field[data-readonly] .ucam-file-field__alvo,
.ucam-file-field[data-readonly] .ucam-anexo__acao { display: none; }

${selectChevronCss}

/* ------------------------------------------------------------ listbox --- */
/* A metade que faltava do Select.
 *
 * ADR-011 já tinha decidido que o <select> nativo sai e o componente passa a
 * usar overlay — mas a decisão só chegou ao @ucam/ui (Angular). No Trilho A
 * ficou só o campo fechado: clicar abria a lista do sistema operacional, com
 * o azul de seleção do Windows e nenhum token da UCAM. Metade do componente
 * seguia fora do design system, e as telas de exemplo mostravam isso.
 *
 * Esta seção é a lista aberta em CSS puro, com a geometria do overlay da base
 * (bg-popover, rounded-md, shadow-md, viewport com p-1, item rounded-md com
 * py-1/pl-2/pr-8). O COMPORTAMENTO continua sendo de quem consome: o Trilho A
 * é folha de estilo, não framework. Um app AngularJS tem ng-repeat e ng-click
 * — o que ele não tinha era com o que pintar a lista. Agora tem. */

.ucam-listbox {
  position: absolute;
  z-index: var(--ucam-z-overlay);
  inset-inline-start: 0;
  inset-block-start: calc(100% + 0.25rem);
  min-inline-size: 100%;
  /* max-h-96 da base: a lista rola, não empurra a página. */
  max-block-size: 24rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
  border: 1px solid var(--ucam-color-border-subtle);
  /* Raio de SUPERFÍCIE, não o md de antes: a lista aberta é um painel
   * flutuante, e 6px num painel com sombra larga lê como caixa de sistema
   * operacional. É o mesmo canto do card e do diálogo. */
  border-radius: var(--ucam-radius-surface);
  box-shadow: var(--ucam-elevation-overlay);
}

.ucam-listbox[hidden] { display: none; }

/* Ancorada ACIMA do gatilho quando não cabe embaixo: a classe é posta pelo
 * comportamento do listbox, que mede onde a lista cai. Mesma origem de
 * surgimento do .ucam-menu--acima, pela mesma razão. */
.ucam-listbox--acima {
  inset-block-start: auto;
  inset-block-end: calc(100% + 0.25rem);
  --ucam-surgir-origem: 0 100%;
}

.ucam-option {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  /* pr-8 reserva a coluna do check: o rótulo da opção escolhida não pode
   * reflowar quando a marca aparece. */
  /* 7px em cima e embaixo, não 4px: a linha da lista passa a ~34px, que é o
   * alvo de ponteiro de um item de menu e a densidade das referências. A
   * coluna de 2rem à direita continua reservando o lugar do check, para o
   * rótulo da opção escolhida não reflowar quando a marca aparece. */
  padding: 0.4375rem 2rem 0.4375rem var(--ucam-space-inline-sm);
  border-radius: var(--ucam-radius-control);
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: 1.6;
  color: inherit;
  cursor: default;
  user-select: none;
  position: relative;
}

.ucam-option:hover,
.ucam-option[data-destacada="true"] {
  background: var(--ucam-color-interaction-hover);
  color: var(--ucam-color-text-primary);
}

/* O check é o que distingue escolhida de apenas apontada — cor sozinha não
 * carregaria isso (WCAG 1.4.1), e aria-selected carrega para quem ouve. */
.ucam-option[aria-selected="true"]::after {
  content: '';
  position: absolute;
  inset-inline-end: var(--ucam-space-inline-sm);
  inline-size: 0.875rem;
  block-size: 0.875rem;
  background: var(--ucam-color-action-primary-default);
  -webkit-mask: ${CHECK_MASK} no-repeat center / contain;
  mask: ${CHECK_MASK} no-repeat center / contain;
}

.ucam-option[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}

/* Rótulo de grupo e separador, iguais aos da base. */
.ucam-listbox__grupo {
  padding: 0.375rem var(--ucam-space-inline-sm);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}
.ucam-listbox__sep {
  block-size: 1px;
  margin: 0.25rem -0.25rem;
  background: var(--ucam-color-border-subtle);
}

/* O gatilho reaproveita a geometria do campo; o que muda é que ele alinha o
 * valor à esquerda (um <button> centraliza por padrão) e abre espaço para o
 * chevron do .ucam-select-wrap. */
.ucam-select-trigger {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: start;
  padding-inline-end: 2rem;
  cursor: pointer;
}
.ucam-select-trigger[data-vazio="true"] { color: var(--ucam-color-text-placeholder); }

/* O textarea é o único que cresce; volta a ter altura automática. */
.ucam-textarea { block-size: auto; line-height: 1.5; padding: var(--ucam-space-inset-sm); }

.ucam-input[aria-invalid="true"],
.ucam-select[aria-invalid="true"],
.ucam-textarea[aria-invalid="true"] {
  border-color: var(--ucam-color-feedback-danger-border);
  /* O erro nunca é comunicado só pela borda — a mensagem em .ucam-field__error
   * é obrigatória. WCAG 1.4.1 e 3.3.1. */
}

/* DESABILITADO É UM ESTADO SÓ, COM UM CHÃO SÓ (ADR-042).
 *
 * O campo caía em surface.subtle, o radio em surface.sunken e o botão em
 * action.disabled.background: o mesmo estado saindo em três cinzas na mesma
 * tela. Três cinzas não ensinam um estado — ensinam que o cinza não quer
 * dizer nada. Agora todo controle bloqueado assenta no mesmo degrau, e quem
 * viu um botão desabilitado reconhece um campo desabilitado.
 *
 * E o mais importante: isto é o que separa DESABILITADO de SOMENTE LEITURA.
 * Os dois dividiam surface.subtle e a borda de fio, e a única diferença era a
 * cor do texto — a 3,31:1, uma diferença que praticamente ninguém via. Agora
 * readonly fica no recuo leve COM borda e tinta primária (o valor é o que se
 * veio ler), e disabled desce para o chão pesado SEM borda e com a tinta
 * apagada (o valor não se aplica). Dois sinais separam os dois estados, não
 * um; e nenhum dos dois depende de comparar cinzas vizinhos.
 *
 * A borda transparente é o segundo sinal, e é de FORMA, não de cor: o campo
 * ativo tem aresta, o bloqueado é uma laje lisa. Quem não distingue os dois
 * cinzas ainda distingue a aresta que sumiu. */
.ucam-input:disabled,
.ucam-select:disabled,
.ucam-textarea:disabled {
  background: var(--ucam-color-action-disabled-background);
  color: var(--ucam-color-action-disabled-text);
  border-color: transparent;
  cursor: not-allowed;
}

/* SOMENTE LEITURA. O contrato do campo de texto declarava o estado e a folha
 * nunca o desenhou: um input readonly saía idêntico ao editável, com o hover
 * prometendo que dava para escrever. Achado na revisão de estados de
 * 13/09/2026, junto com a prop que faltava no textarea.
 *
 * Distinto do desabilitado por um motivo só: o texto. Desabilitado apaga a
 * tinta porque o valor não se aplica; somente leitura mantém a tinta primária
 * porque o valor é justamente o que se veio ler e copiar. O que os dois
 * dividem é o chão sem papel e o contorno de fio — o sinal de "não se escreve
 * aqui". O foco continua: readonly é focável, e o anel precisa aparecer. */
.ucam-input[readonly],
.ucam-textarea[readonly] {
  background: var(--ucam-color-surface-subtle);
  border-color: var(--ucam-color-border-subtle);
  cursor: default;
}

.ucam-input[readonly]:focus-visible,
.ucam-textarea[readonly]:focus-visible { border-color: var(--ucam-color-border-focus); }

.ucam-textarea { min-block-size: calc(var(--ucam-size-control-md) * 3); resize: vertical; }

/* Campo de tela de foco único — login, confirmação, recuperação de senha.
 *
 * Mesma régua do .ucam-btn--lg de propósito: numa tela de tarefa única, campo
 * e ação primária empilhados com alturas diferentes leem como peças de
 * sistemas diferentes. line-height acompanha a altura porque .ucam-input
 * centraliza o valor por line-height, não por flex. */
.ucam-field--lg .ucam-input,
.ucam-field--lg .ucam-select {
  block-size: var(--ucam-size-control-lg);
  line-height: var(--ucam-size-control-lg);
  font-size: var(--ucam-typography-body-font-size);
}

.ucam-field--lg .ucam-field__label { font-size: var(--ucam-typography-body-sm-font-size); }

/* O grupo acompanha o campo grande: o login põe a senha num grupo (campo +
 * mostrar/ocultar) ao lado do CPF em campo solto, e os dois têm de fechar na
 * mesma altura. */
.ucam-field--lg .ucam-input-group { block-size: var(--ucam-size-control-lg); }
.ucam-field--lg .ucam-input-group__controle { font-size: var(--ucam-typography-body-font-size); }

/* SOB PONTEIRO GROSSO o campo escreve em 16px. O Safari do iOS dá zoom na
 * página ao focar campo com fonte menor que 16px, e não desfaz ao sair: a
 * pessoa termina o formulário com a tela ampliada e rolando de lado. 1rem não
 * é degrau da escala, é o limiar da plataforma — por isso número e não token.
 * O controle mantém a altura; só a letra cresce.
 *
 * Depois dos tamanhos de campo e com .ucam na frente: o tamanho --lg e o
 * controle do grupo declaram font-size com a mesma ou mais especificidade, e
 * a regra de toque tem de vencer os dois — medido a 13px e 14px em 13/09/2026
 * com o bloco escrito antes deles. */
@media (pointer: coarse) {
  .ucam :is(.ucam-input, .ucam-select, .ucam-textarea, .ucam-input-group__controle) {
    font-size: max(1rem, var(--ucam-typography-body-sm-font-size));
  }
}

/* Largura pelo conteúdo esperado — acaba com as larguras arbitrárias do
 * legado (CPF pequeno ao lado de Nome médio, sem critério). */
.ucam-field--content .ucam-input,
.ucam-field--content .ucam-select { inline-size: auto; }
/* ch mede o "0"; some o padding lateral e a borda, senão o valor corta —
 * era o que cortava 10/09/2026 em "10/09/202". */
.ucam-field--cpf   .ucam-input { inline-size: calc(14ch + 1.5rem); }
.ucam-field--cep   .ucam-input { inline-size: calc(9ch  + 1.5rem); }
.ucam-field--data  .ucam-input { inline-size: calc(10ch + 1.5rem); }
.ucam-field--mes   .ucam-input { inline-size: calc(7ch  + 1.5rem); }

/* ------------------------------------------------------------- tabela --- */
/* Contrato: data-table.json. ADR-003: cabeçalho em caixa natural. */

.ucam-table-wrap {
  overflow-x: auto;
  /* O rolo precisa ser o bloco contenedor do que é absoluto por dentro. Sem
   * isto o .ucam-sr-only de um cabeçalho ("Ações", na última coluna) se
   * posicionava contra a página, fora do rolo: a tabela rolava contida e o
   * documento inteiro alargava para 773px num telefone de 390. */
  position: relative;
  border: 1px solid var(--ucam-color-border-subtle);
  /* RAIO DE SUPERFÍCIE, não de moldura.
   *
   * Estava em --ucam-radius-frame (16px) enquanto o comentário abaixo dizia
   * que o degrau era "o mesmo do card" — e o card usa surface (12px). A
   * inconsistência aparecia justamente no cabeçalho: a faixa cinza é clipada
   * pelo raio do contêiner, e 16px de arredondamento numa faixa de ~32px
   * transforma os rótulos de coluna numa aba de navegador. Com 12px a faixa
   * volta a ler como o topo da tabela.
   *
   * O degrau é o mesmo do card, e o raio também. Desde a ADR-019 esse
   * degrau é PLANO: a tabela é conteúdo dentro da moldura, não um objeto
   * sobre ela. O que a faz ler como superfície é o fio em volta somado à
   * faixa do cabeçalho — que é justamente o par que a referência usa. */
  border-radius: var(--ucam-radius-surface);
  background: var(--ucam-color-surface-default);
  box-shadow: var(--ucam-elevation-flat);
}

/* MOLDURA ÚNICA quando a tabela já vive dentro de uma.
 *
 * A listagem de naturezas monta um .ucam-card com padding zero contendo a
 * barra de ferramentas e a tabela. O card traz borda, raio e elevação; o
 * .ucam-table-wrap trazia os três de novo, por dentro. O resultado é o raio
 * duplo que se vê no alto da tabela: os cantos arredondados da faixa de
 * cabeçalho desenhados a poucos pixels dos cantos arredondados do card, com
 * uma borda entre os dois.
 *
 * É o mesmo defeito que o contrato do card chama de molduras concêntricas —
 * elas não separam duas vezes melhor, competem, e a interna sempre parece
 * erro de espaçamento. Quem é a moldura aqui é o card; a tabela devolve os
 * três e fica com a única coisa que ainda precisa: rolar na horizontal.
 *
 * O :has é o que permite corrigir sem tocar no markup das telas — e é
 * suportado por todo navegador que roda o resto deste arquivo. */
.ucam-card > .ucam-table-wrap,
.ucam-card > * > .ucam-table-wrap {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

/* Sem o raio próprio, a faixa de cabeçalho perde o clip que arredondava seus
 * cantos superiores — que é justamente o que se quer. Mas quando a tabela é a
 * PRIMEIRA coisa do card, os cantos de cima do card ficam sem quem os pinte:
 * a faixa cinza é quem encosta neles. Aí ela herda o raio do card, e só ele. */
.ucam-card > .ucam-table-wrap:first-child thead th:first-child {
  border-start-start-radius: var(--ucam-radius-surface);
}

.ucam-card > .ucam-table-wrap:first-child thead th:last-child {
  border-start-end-radius: var(--ucam-radius-surface);
}

.ucam-table {
  inline-size: 100%;
  /* PISO de largura em tela estreita.
   *
   * Com inline-size 100% e mais nada, a tabela obedecia aos 306px de um
   * celular e espremia as colunas até o dado quebrar: "Ana Paula Ferreira"
   * saía em três linhas e "Centro de Informática" em duas, numa fileira de
   * 20px de texto útil. O contêiner já rola na horizontal (.ucam-table-wrap);
   * o que faltava era dizer que rolar é melhor que espremer. 44rem é a
   * largura em que as colunas de uma listagem de cadastro cabem sem quebra —
   * abaixo disso a tabela rola, acima ela volta a preencher. Escrito primeiro
   * como min(44rem, 100%), o que anulava a regra: num contêiner de 306px o
   * min() escolhe os 306px e o piso deixa de existir. O piso é um número
   * absoluto por definição.
   *
   * Isto NÃO é o modo empilhado que o contrato descreve para telas estreitas:
   * aquele troca a tabela por cartões e ainda não existe. Enquanto não
   * existir, rolar é a degradação honesta.
   *
   * O PISO DEPENDE DE QUANTAS COLUNAS HÁ. Os 44rem fixos eram a medida de uma
   * listagem de cadastro de cinco colunas — e valiam também para a tabela de
   * TRÊS colunas da composição da mensalidade, que a 1024px (painel de 666px)
   * rolava e escondia "Valor", a única coluna que interessa. Três colunas
   * cabem em 26rem; cada coluna a mais pede ~7rem. O :has conta os
   * cabeçalhos, que é o que o markup já declara. */
  --ucam-table-piso: 26rem;
  min-inline-size: var(--ucam-table-piso);
  border-collapse: collapse;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: var(--ucam-typography-body-sm-line-height);
}

/* O PISO É MENOR ao lado de um painel de apoio.
 *
 * Dentro de um .ucam-split a coluna principal mede ~600px numa janela de
 * 1280, e os 44rem (704px) do piso obrigavam a rolar. A rolagem era HONESTA
 * em teoria e invisível na prática: a barra é fina e só aparece com o
 * ponteiro em cima, e a última coluna era justo a que decide — "Valor" no
 * movimento de caixa, "Situação" nos parâmetros dos setores e nos protocolos
 * anteriores do requerimento. Medido em 10/09/2026: três telas, três colunas
 * decisivas fora da vista, nenhuma com sinal de que havia mais. Botão que não
 * se vê é pior que botão ausente; coluna também.
 *
 * 34rem (544px) é o que cabe na coluna principal a 1280 e ainda dá 100px por
 * coluna numa tabela de cinco. Abaixo do papel container.duas-colunas o split
 * empilha e a tabela volta a ter a largura inteira. O min() mantém o piso
 * menor das tabelas de três e quatro colunas. */
/* "of :not([hidden])": coluna OCULTA pelo menu sai da conta. nth-child puro
 * conta o irmão escondido, e o piso ficava o mesmo depois de ocultar — a
 * 1024px, em naturezas, esconder "Unidades atendidas" não tirava a rolagem e
 * a coluna liberada ia inteira para "Natureza" (129 → 301px), medido em
 * 13/09/2026. Ocultar coluna existe para a tabela caber; o piso tem de
 * acompanhar. Mesmo chão de suporte do :has(). */
.ucam-table:has(thead th:nth-child(4 of :not([hidden]))) { --ucam-table-piso: 30rem; }
.ucam-table:has(thead th:nth-child(5 of :not([hidden]))) { --ucam-table-piso: 40rem; }
.ucam-table:has(thead th:nth-child(6 of :not([hidden]))) { --ucam-table-piso: 48rem; }
.ucam-table:has(thead th:nth-child(7 of :not([hidden]))) { --ucam-table-piso: 56rem; }
.ucam-split .ucam-table { min-inline-size: min(var(--ucam-table-piso), 34rem); }

.ucam-table caption {
  text-align: start;
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

/* Alinhamento ao TOPO, não ao meio. O padrão do navegador é \`middle\`: basta
 * uma célula quebrar em três linhas para as vizinhas de uma linha só flutuarem
 * no centro da fileira, e a tabela inteira parecer desalinhada. Com \`top\` as
 * primeiras linhas de todas as células nascem na mesma altura, que é a linha
 * que o olho segue ao varrer. Filete só HORIZONTAL — nunca entre colunas: a
 * grade fechada vira rede e compete com o dado. */
.ucam-table th,
.ucam-table td {
  text-align: start;
  /* CENTRO, não topo.
   *
   * Com alinhamento ao topo, uma célula de texto puro assenta na primeira
   * linha-base enquanto a célula vizinha, que carrega um selo de 22px, assenta
   * a CAIXA do selo — e as duas nunca coincidem. Numa linha de 45px o
   * desencontro chega a 3px, o bastante para a fileira inteira parecer torta
   * sem que se saiba dizer por quê. Centro é o que as referências usam e o que
   * uma linha de altura fixa pede.
   *
   * A exceção honesta seria a célula com duas linhas de texto ao lado de
   * células de uma — mas nesta tabela isso não acontece: quando acontecer, a
   * regra vira modificador na linha, não default. */
  vertical-align: middle;
  /* 13px, não 11px. A altura de linha resultante (~44px com uma linha de
   * texto) é o alvo de ponteiro que a WCAG 2.5.5 pede para a ação que vive
   * na linha — e é a densidade das referências, que respiram sem virar
   * lista de celular. */
  padding: 0.8125rem var(--ucam-space-inset-md);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

/* O cabeçalho VOLTOU a ser faixa pintada — reversão consciente da decisão
 * anterior, que o tirou por dar só 1,02:1 contra o painel.
 *
 * O argumento de contraste continua verdadeiro e continua não sendo o ponto:
 * a faixa não existe para separar por luminância, existe para dizer que
 * aquela fileira NÃO é dado. Sem ela, a primeira linha da tabela e os
 * rótulos das colunas são a mesma superfície, e quem chega à tela rolada não
 * tem como saber qual é qual. O que a decisão anterior acertou foi o custo:
 * uma terceira tonalidade. Ele se paga porque o contêiner agora tem raio de
 * moldura e a faixa fica CLIPADA nele, virando o topo do objeto em vez de um
 * retângulo cinza solto. */
/* Cabeçalho de LINHA (th scope=row no corpo): o navegador o põe em 700 e
 * centrado, e a coluna de meses do analytics saía em negrito ao lado de
 * números em 400 — um peso que nenhum outro texto da tela tem. Mesmo peso do
 * cabeçalho de coluna, alinhado ao início como qualquer célula. */
.ucam-table tbody th {
  font-weight: var(--ucam-typography-label-font-weight);
  text-align: start;
}

.ucam-table thead th {
  background: var(--ucam-color-surface-sunken);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-table-header-font-size);
  font-weight: var(--ucam-typography-table-header-font-weight);
  letter-spacing: var(--ucam-typography-table-header-letter-spacing);
  line-height: var(--ucam-typography-table-header-line-height);
  border-block-end-color: var(--ucam-color-border-default);
  white-space: nowrap;
  /* FAIXA DE RÓTULO, não fileira de dado.
   *
   * O cabeçalho herdava os 13px verticais de \`.ucam-table th, td\` — o recuo
   * calculado para dar à LINHA DE DADO os 44px de alvo de ponteiro que a
   * WCAG 2.5.5 pede para a ação que vive nela. O cabeçalho não tem ação
   * nenhuma na maioria das colunas e não precisa de alvo: com 13px + 13px
   * sobre um tipo de 12px, a faixa saía com quase a mesma altura de uma
   * linha de dado, e a tabela começava com duas fileiras de mesmo peso em
   * que só a segunda carrega informação.
   *
   * 8px devolvem a faixa a ~32px: densa o bastante para ler como rótulo,
   * alta o bastante para o botão de ordenação continuar clicável. A exceção
   * é a coluna ordenável, onde o botão traz o próprio alvo — ver
   * \`.ucam-table th > button\`. */
  padding-block: 0.5rem;
}

.ucam-table tbody tr {
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              background-image var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* Zebra passou a ser OPT-IN (contrato data-table: zebra, default false).
 * Continua padronizada — o defeito do legado era alternar sem critério, e o
 * critério agora é: só onde a linha é longa demais para o hover resolver.
 *
 * VEM ANTES DO HOVER, e a ordem não é estética. O seletor da zebra e o do
 * hover têm a MESMA
 * especificidade — (0,2,2) as duas. Empate resolve por ordem de arquivo, e
 * com a zebra depois era ela quem vencia: o realce da linha par nunca
 * chegava a pintar. É a segunda vez que esta armadilha aparece no
 * repositório; a regra continua a mesma, estado vai DEPOIS da base que ele
 * modifica. */
.ucam-table--zebra tbody tr:nth-child(even) { background: var(--ucam-color-surface-subtle); }

/* Realce da linha sob o ponteiro. É ele que faz o trabalho que a zebra fazia
 * — não perder a linha ao atravessar sete colunas — e faz melhor, porque
 * acompanha o olho em vez de pintar metade da tabela.
 *
 * TINTA EM CAMADA, não fundo sólido, e aqui não é preferência — é o que faz
 * o realce existir sobre a zebra.
 *
 * O realce era "background: surface.subtle". A faixa par da zebra é
 * surface.subtle. Mesmo com a ordem corrigida, pintar a MESMA cor por cima
 * não muda nada; e trocar por uma cor sólida diferente faria a linha par
 * clarear em vez de escurecer, porque o sólido SUBSTITUI a faixa.
 *
 * linear-gradient de uma cor só é uma camada de background-image: ela deita
 * a tinta POR CIMA do background-color que a linha já tem, seja ele branco
 * ou a faixa da zebra, e o alfa se compõe com o que estiver embaixo. Um
 * realce, dois fundos, o mesmo degrau de 4,5%. É como a Linear pinta estado
 * na interface inteira. */
.ucam-table tbody tr:hover {
  background-image: linear-gradient(
    var(--ucam-color-interaction-hover),
    var(--ucam-color-interaction-hover)
  );
}

/* A LINHA ESCOLHIDA, quando a tabela alimenta um painel ao lado.
 *
 * O contrato do data-table declara selectable: none | single | multiple
 * desde a primeira versão, e o Trilho A nunca desenhou o estado — a prop
 * existia e não tinha tinta. Aparece agora porque o padrão listagem-inspetor
 * depende dela: sem marca na linha, o painel da direita mostra as
 * propriedades de um registro que a pessoa não consegue apontar na tabela.
 *
 * Mesma camada de background-image do hover, pelo mesmo motivo: a tinta
 * deita SOBRE o fundo que a linha já tem, seja branco ou a faixa da zebra.
 *
 * A REGRA DO :hover está duplicada de propósito. Os dois seletores pintam
 * background-image, e a propriedade não acumula entre regras — a última
 * vence inteira. Sem a variante :hover aqui, passar o ponteiro sobre a linha
 * escolhida trocaria o tom de escolha pelo tom de hover, e a escolha sumiria
 * justamente enquanto a pessoa aponta para ela.
 *
 * Que a linha escolhida NÃO escureça sob o ponteiro é a mesma decisão que o
 * item ativo do menu já tomou: ela está no seu tom final, e piscar uma
 * segunda cor sobre o registro que a pessoa já abriu não informa nada.
 *
 * Cor sozinha não informa (WCAG 1.4.1): quem carrega o estado é o
 * aria-selected no <tr> e o nome do registro no título do painel ao lado. */
.ucam-table tbody tr[aria-selected="true"],
.ucam-table tbody tr[aria-selected="true"]:hover {
  background-image: linear-gradient(
    var(--ucam-color-action-primary-subtle),
    var(--ucam-color-action-primary-subtle)
  );
}

/* A BARRA NA ENTRADA DA LINHA ESCOLHIDA (21/09/2026).
 *
 * Esta folha dizia, aqui mesmo, que "fundo tingido e aria-selected dizem tudo
 * o que a barra diria". A medida desmentiu: o fundo da linha escolhida dá
 * 1,08:1 no claro e 1,04:1 no escuro contra a superfície — os MESMOS números
 * do item de lista, que por isso ganhou a barra de 4px em 10/09/2026. O
 * argumento que criou a barra lá vale aqui com o mesmo número.
 *
 * Não contradiz a ADR-027, que tirou a barra de ESTADO (tr[data-estado]): lá
 * era coluna inteira pintada, repetindo em cor o que o selo já dizia em
 * palavra, em 11 linhas de 11. Aqui a barra diz ESCOLHA — só a linha escolhida
 * a tem, e é o único sinal colorido que ela ganha além do próprio realce.
 *
 * inset box-shadow, e não ::before: a tabela é border-collapse, onde <tr>
 * posicionado é terreno instável, e a sombra não ocupa espaço — um
 * border-inline-start de 4px empurraria a primeira coluna e a desalinharia do
 * cabeçalho. É medida física porque box-shadow não tem forma lógica em CSS;
 * é a exceção, não o costume da folha. */
.ucam-table tbody tr[aria-selected="true"] > :first-child {
  box-shadow: inset 4px 0 0 0 var(--ucam-color-action-primary-default);
}
.ucam-table tbody tr:last-child td,
.ucam-table tbody tr:last-child th { border-block-end: 0; }

/* Coluna de número: alinha ao FIM e trava a largura do dígito.
 *
 * O th--num arrasta o BOTÃO de ordenação junto — sem isto o rótulo ia para a
 * direita e o gatilho ficava à esquerda, dentro da mesma célula. */
/* ATENÇÃO AO PONTO. Isto era .ucam-table td--num, sem o ponto — e o seletor
 * casa um ELEMENTO chamado "td--num", que não existe em HTML nenhum. A regra
 * estava escrita, documentada e morta: nunca alinhou coluna alguma. É por isso
 * que as telas alinhavam número com style inline — o caminho certo não
 * funcionava, e ninguém tinha como saber sem medir.
 *
 * O th--num arrasta junto o BOTÃO de ordenação: sem a linha de baixo o rótulo
 * ia para a direita e o gatilho ficava à esquerda, dentro da mesma célula. */
/* Número NÃO QUEBRA. "+ R$ 1.240,00" partido em "+ R$" e "1.240,00" é o que
 * a coluna de valor do movimento de caixa fazia quando a mesa apertava: o
 * sinal numa linha e o valor na outra, e o sinal é o que diz entrada ou saída.
 * Quem cede espaço é o texto livre das outras colunas. */
.ucam-table .td--num,
.ucam-table .th--num { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ucam-table .th--num button { margin-inline-start: auto; }

/* Coluna que ENCOLHE ao conteúdo — o width: min do ColumnDef.
 *
 * O contrato do data-table declara width: auto | min | number desde a
 * primeira versão, com min descrito como "encolhe ao conteúdo (datas,
 * status, ações)". Era a terceira prop do catálogo declarada sem tinta no
 * Trilho A, ao lado de selectable e da variante de ponto do badge — todas
 * apareceram na mesma passagem, procurando por uma referência visual.
 *
 * O 1% não é chute: numa tabela de layout automático o navegador reparte a
 * largura EXCEDENTE proporcionalmente ao que cada coluna pede, e uma coluna
 * que pede quase nada abre mão da sobra em favor das de conteúdo.
 *
 * O que a regra NÃO faz, e medido: ela não encolhe coluna abaixo do conteúdo
 * mínimo. Percentual em layout automático é dica, não ordem — o piso continua
 * sendo a largura do rótulo do cabeçalho com nowrap. Numa tabela apertada
 * demais para o número de colunas, isto não salva nada, e o conserto é
 * editorial: cortar coluna. Foi o que a tela de parâmetros dos setores fez.
 *
 * O nowrap acompanha porque sem ele o 1% é levado ao pé da letra: a coluna
 * encolhe até a maior PALAVRA e o valor quebra no meio. Vale para dado
 * curto, que é o que a prop promete — não para texto livre. */
.ucam-table .td--min,
.ucam-table .th--min {
  inline-size: 1%;
  white-space: nowrap;
}

/* A COLUNA DE AÇÕES encosta na borda direita e encolhe até o conteúdo.
 *
 * Como coluna comum ela recebia uma fatia igual das outras e os três ícones
 * ficavam boiando no início de um vão de 200px — o olho tinha de atravessar a
 * tabela inteira para achar o que já sabia estar no fim. inline-size:1% é o
 * idioma de tabela para "o mínimo que couber": o algoritmo distribui o resto
 * entre as colunas de conteúdo. */
.ucam-table .td--acoes,
.ucam-table .th--acoes {
  inline-size: 1%;
  white-space: nowrap;
  text-align: end;
}

/* text-align não move item de flex — o agrupamento dos ícones precisa dizer
 * por conta própria de que lado assenta.
 *
 * E precisa dizer que NÃO QUEBRA. O .ucam-cluster nasce com flex-wrap:wrap, o
 * que é certo numa barra de ferramentas e errado dentro de uma célula de 1%:
 * a largura mínima virava a de um ícone e os três empilhavam na vertical,
 * esticando a linha de 45 para 200px. white-space:nowrap não alcança item de
 * flex — quem quebra ali é o flex, e é ele que tem de ser instruído. */
.ucam-table .td--acoes > .ucam-cluster {
  flex-wrap: nowrap;
  justify-content: flex-end;
}

/* A TINTA DESTRUTIVA espera o ponteiro.
 *
 * Doze linhas, doze lixeiras vermelhas: a coluna de ações era a coisa mais
 * saturada da tabela de naturezas, e excluir é a ação mais RARA da linha, não
 * a mais frequente. É o mesmo argumento da ADR-022 (cor na linha = marcador,
 * e só) aplicado à tabela: em repouso o botão tem a tinta dos vizinhos; o
 * vermelho chega com o ponteiro ou o foco, que é quando ele informa. O nome
 * acessível já diz "Excluir" o tempo todo. */
.ucam-table .td--acoes .ucam-btn--ghost[data-tone="danger"]:not(:hover):not(:focus-visible):not(:active) {
  color: var(--ucam-color-text-secondary);
}

/* A BARRA DE ESTADO na borda da linha SAIU (ADR-027).
 *
 * Ela existiu para a primeira passada do olho — descer a tabela procurando o
 * que exige ação sem ler a coluna Situação item por item. Medida nas três
 * telas em que aparecia, ela não fazia isso: em onze linhas do movimento de
 * caixa, onze barras (oito verdes, três vermelhas); nos parâmetros dos
 * setores, seis em seis. Coluna inteira pintada é faixa de cor em que nada
 * discrimina — o mesmo achado da caixa de entrada na ADR-022. E a linha já
 * tinha o seu portador de cor: o selo da coluna Situação, alinhado numa
 * coluna só, com a palavra ao lado. A barra era o segundo portador do mesmo
 * dado, a 3px, sem palavra — exatamente o sinal que a 1.4.1 manda não
 * carregar sozinho.
 *
 * O atributo data-estado não tem mais efeito visual e saiu da marcação das
 * telas. A primeira célula fica livre, e a linha escolhida continua NÃO
 * usando esse lugar: fundo tingido e aria-selected bastam. */

/* Botão de ordenação dentro do th — a ordenação vive no cabeçalho, não num
 * select separado como no legado. */
.ucam-table th > button {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  background: none;
  border: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  /* O ALVO ocupa a faixa inteira sem engordá-la.
   *
   * Com \`padding: 0\`, o gatilho de ordenação era do tamanho do texto: ~16px
   * de altura, abaixo dos 24px da WCAG 2.5.8. Quando o cabeçalho tinha 44px
   * isso passava despercebido porque a maior parte da faixa era recuo da
   * célula — e recuo de célula não é área clicável. Encolhida a faixa para
   * 32px, o defeito ficaria pior, não melhor.
   *
   * O recuo interno cresce e a margem negativa o desconta: o botão passa a
   * cobrir os 32px da faixa e a célula continua com 32px. */
  padding-block: 0.5rem;
  margin-block: -0.5rem;
  padding-inline: 0;
}

/* O CONVITE de ordenação.
 *
 * Até aqui só a coluna já ordenada mostrava seta, e o resultado é o defeito
 * que a evidência do Protocolo registra com todas as letras: "o usuário não
 * descobre que pode ordenar". Uma coluna ordenável e uma coluna fixa eram
 * indistinguíveis em repouso.
 *
 * Agora toda coluna ordenável carrega o par de setas (chevronsUpDown) em
 * tinta apagada, e ele acende quando a coluna governa a ordem. É o desenho
 * das duas referências de tabela densa que o projeto adotou, e é a razão de o
 * ícone existir: ele não informa a ordem, informa que HÁ ordem a pedir. */
.ucam-table th > button .ic {
  color: var(--ucam-color-text-placeholder);
  transition: color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-table th > button:hover .ic {
  color: var(--ucam-color-text-secondary);
}

/* A coluna que manda: a seta ganha a tinta cheia do texto. aria-sort é o
 * seletor, e não uma classe — o atributo que o leitor de tela anuncia é o
 * mesmo que pinta, então não há como marcar visualmente sem marcar
 * semanticamente. */
.ucam-table th[aria-sort]:not([aria-sort="none"]) > button {
  color: var(--ucam-color-text-primary);
}

.ucam-table th[aria-sort]:not([aria-sort="none"]) > button .ic {
  color: var(--ucam-color-action-primary-default);
}

/* ------------------------------------------------ menu da coluna --- */
/* Contrato: data-table.json, parte column-menu (11/09/2026).
 *
 * O cabeçalho deixou de ser só o gatilho da ordem e passou a ABRIR o menu da
 * coluna: Crescente, Decrescente, Fixar à esquerda, Fixar à direita, Ocultar
 * coluna. A ordem saiu do clique cego — "clicar de novo inverte, e na terceira
 * some" é um ciclo que ninguém lê no cabeçalho — para opções com nome, e as
 * outras três coisas que se fazem com uma coluna ganharam onde morar.
 *
 * O gatilho herda tudo de ".ucam-table th > button" (alvo, tinta, seta sempre
 * visível). Aqui só o estado aberto, que se lê como o hover que ficou. */
.ucam-table__coluna[aria-expanded="true"] { color: var(--ucam-color-text-primary); }
.ucam-table__coluna[aria-expanded="true"] .ic { color: var(--ucam-color-text-secondary); }

/* POSIÇÃO FIXA, e a razão é o recorte. A tabela mora num .ucam-table-wrap com
 * overflow-x: auto, e overflow num eixo recorta os dois: um menu absoluto
 * dentro do <th> abria cortado na altura do cabeçalho, com Fixar e Ocultar
 * fora da caixa. Fixo, ele escapa do recorte; quem escreve o topo e a
 * esquerda é o menuContaScript ao abrir, a partir do retângulo do gatilho, e
 * ele fecha ao rolar — um menu fixo parado enquanto a coluna foge dele lê
 * como defeito.
 *
 * E ele desfaz o que herdaria do <th>: corpo de 12px, peso de rótulo, cinza
 * secundário e nowrap são do CABEÇALHO, não do menu.
 *
 * DUAS CLASSES no seletor, e é de propósito: ".ucam-menu" (absoluto, preso à
 * direita) vem MAIS ABAIXO na folha com a mesma especificidade e vencia —
 * medido em 12/09/2026, o menu saía absoluto e com 568px de largura, esticado
 * entre a esquerda escrita pelo script e o inset-inline-end: 0 da base. */
.ucam-menu.ucam-menu--coluna {
  position: fixed;
  inset-block-start: auto;
  inset-inline-end: auto;
  min-inline-size: 12rem;
  color: var(--ucam-color-text-primary);
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: normal;
  letter-spacing: normal;
  line-height: normal;
  text-align: start;
  text-transform: none;
  white-space: normal;
}

/* COLUNA FIXA. O script MOVE a coluna para a ponta — fixar uma coluna do meio
 * sem movê-la faria as vizinhas da esquerda passarem por baixo dela — e cola
 * com sticky. O deslocamento de cada célula (--ucam-col-x) vem do script, que
 * soma a largura das fixas que vêm antes: a coluna de seleção e a de ações
 * entram na soma e grudam junto, senão a caixa de marcar rolaria por baixo da
 * coluna fixada ao lado dela.
 *
 * FUNDO OPACO obrigatório: célula grudada e transparente mostra o texto que
 * passa por baixo. E por isso os três estados de linha precisam ser repetidos
 * aqui — o hover, a zebra e a linha escolhida pintam o <tr>, e a célula opaca
 * os cobriria. */
.ucam-table .ucam-col--fixa-inicio,
.ucam-table .ucam-col--fixa-fim {
  /* Variável de BLOCO, declarada aqui para o portão de tokens: o valor real
   * vem do estilo inline que o script escreve em cada célula, que vence esta
   * declaração. Zero é a coluna fixa sem nada grudado antes dela. */
  --ucam-col-x: 0px;
  position: sticky;
  z-index: 1;
  background-color: var(--ucam-color-surface-default);
}

.ucam-table .ucam-col--fixa-inicio { inset-inline-start: var(--ucam-col-x); }
.ucam-table .ucam-col--fixa-fim    { inset-inline-end: var(--ucam-col-x); }

.ucam-table thead .ucam-col--fixa-inicio,
.ucam-table thead .ucam-col--fixa-fim {
  z-index: 2;
  background-color: var(--ucam-color-surface-sunken);
}

.ucam-table--zebra tbody tr:nth-child(even) > .ucam-col--fixa-inicio,
.ucam-table--zebra tbody tr:nth-child(even) > .ucam-col--fixa-fim { background-color: var(--ucam-color-surface-subtle); }

.ucam-table tbody tr:hover > .ucam-col--fixa-inicio,
.ucam-table tbody tr:hover > .ucam-col--fixa-fim {
  background-image: linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover));
}

.ucam-table tbody tr[aria-selected="true"] > .ucam-col--fixa-inicio,
.ucam-table tbody tr[aria-selected="true"] > .ucam-col--fixa-fim {
  background-color: var(--ucam-color-action-primary-subtle);
  background-image: none;
}

/* A borda do bloco fixo é um FILETE, só na última fixa de cada lado — é o que
 * diz onde a parte que rola começa. Sombra de lado exigiria cor literal, e a
 * ADR-007 não deixa. */
.ucam-table .ucam-col--borda-inicio { box-shadow: inset -1px 0 0 var(--ucam-color-border-default); }
.ucam-table .ucam-col--borda-fim    { box-shadow: inset 1px 0 0 var(--ucam-color-border-default); }

/* COLUNAS OCULTAS. Ocultar sem caminho de volta é apagar: a barra aparece
 * acima da tabela enquanto houver coluna oculta, diz quantas e oferece
 * "Mostrar". Some quando não há o que mostrar. */
.ucam-table__ocultas {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ucam-space-inline-sm);
  margin-block-end: var(--ucam-space-inline-xs);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

/* -------------------------------------------------------------- badge --- */
/* Contrato: badge.json. A cor nunca carrega o significado sozinha —
 * o rótulo textual é obrigatório na marcação. WCAG 1.4.1. */

.ucam-badge,
.ucam-prazo {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  /* ALTURA DECLARADA, não resultante.
   *
   * Era padding-block mais line-height, e dava 22,19px — um número que
   * ninguém escolheu. Ao lado dele o chip dava 22,78 e o prazo 24,19. Com a
   * altura vinda do token, as três peças fecham no mesmo topo e na mesma base
   * em qualquer linha onde apareçam juntas, que é sempre. O padding vertical
   * sai: com block-size e align-items:center ele só voltaria a disputar. */
  block-size: var(--ucam-size-marcador);
  padding-block: 0;
  padding-inline: var(--ucam-space-inline-sm);
  /* Pastilha, não etiqueta retangular: o raio total distingue o selo de
   * ESTADO do chip de filtro e do botão, que são as outras duas peças
   * pequenas da mesma tela. */
  border-radius: var(--ucam-radius-pill);
  /* LARGURA DO CONTEÚDO, declarada. inline-flex não protege de nada quando o
   * selo é filho direto de um .ucam-stack (flex em coluna): item de flex é
   * blockificado e estica até a largura do pai. Era o que fazia o selo
   * "Legado" da grade de módulos sair como uma faixa âmbar de 176px de canto
   * a canto do cartão. fit-content tira o selo do stretch sem obrigar cada
   * pai a declarar align-items. */
  inline-size: fit-content;
  max-inline-size: 100%;
  /* A CAIXA não traz tinta; quem pinta é o tom, logo abaixo.
   *
   * Até 09/09/2026 aqui estavam fundo branco e filete, e o preenchimento era
   * a variante --cheio, que nenhuma tela jamais pediu. A ADR-020 inverteu: o
   * preenchido é o padrão e o contorno virou --contorno.
   *
   * A borda continua declarada em 1px, com a cor vindo do tom, porque a
   * caixa precisa ocupar a mesma largura nas duas variantes — sem isso o selo
   * encolhe 2px ao trocar de variante e a coluna inteira desalinha. */
  background: transparent;
  border: 1px solid transparent;
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: 1.35;
  white-space: nowrap;
}

/* O ÍCONE é obrigatório na anatomia (badge.json). Ele é o terceiro
 * canal, ao lado do rótulo e da cor: quem não distingue verde de âmbar lê a
 * forma, e quem varre a coluna de olho pega o estado sem ler a palavra. Sai
 * no miúdo da escala por papel — 16px, o mesmo do botão. Eram 14 aqui e 16
 * ali, e dois pixels de diferença entre peças que se encostam na mesma linha
 * lê como desalinho, não como hierarquia. */
.ucam-badge .ic,
.ucam-prazo .ic {
  flex: none;
}

/* O ícone usa o degrau SATURADO da matiz, não o foreground do rótulo — é o
 * que o <ucam-badge> do Trilho B já fazia (ICON_CLASSES no wrapper) e
 * o que faltava aqui. Sem isto o mesmo selo tinha dois desenhos conforme o
 * trilho: no Angular o símbolo saltava do texto, no CSS puro era da mesma
 * tinta e sumia dentro dele. */
.ucam-badge--info    .ic { color: var(--ucam-color-feedback-info-border); }
.ucam-badge--success .ic { color: var(--ucam-color-feedback-success-border); }
.ucam-badge--warning .ic,
.ucam-prazo--proximo .ic { color: var(--ucam-color-feedback-warning-border); }
.ucam-badge--danger  .ic,
.ucam-prazo--vencido .ic { color: var(--ucam-color-feedback-danger-border); }

/* PREENCHIMENTO PASTEL, com o rótulo na tinta do próprio tom. ADR-020.
 *
 * É o único par de tintas do selo que o portão de build confere de verdade:
 * tools/build-tokens.mjs mede feedback.<tom>.foreground sobre
 * feedback.<tom>.background em 4.5:1, nos dois temas, e reprova o build. O
 * contorno que estava aqui até 09/09 apoiava o rótulo em text-primary sobre
 * surface-default — par legítimo, mas que não diz nada sobre o TOM: os cinco
 * estados tinham a mesma tinta de texto, e o que os separava era um filete a
 * 30% de opacidade e um ícone de 14px.
 *
 * A troca inverte a decisão de 03/09/2026, que preferiu a pílula branca para
 * não transformar uma coluna de 14 linhas numa faixa de cor. O argumento não
 * era errado e continua de pé: quem tem essa coluna pede --contorno, logo
 * abaixo, e recebe o desenho anterior inteiro.
 *
 * O par 100/700 é pastel de propósito. Quem carrega saturação é o ícone ou o
 * ponto, que seguem no degrau 500 — a mesma divisão de trabalho da
 * referência. */
.ucam-badge--info    { background: var(--ucam-color-feedback-info-background);    color: var(--ucam-color-feedback-info-foreground); }
.ucam-badge--success { background: var(--ucam-color-feedback-success-background); color: var(--ucam-color-feedback-success-foreground); }
.ucam-badge--warning,
.ucam-prazo--proximo { background: var(--ucam-color-feedback-warning-background); color: var(--ucam-color-feedback-warning-foreground); }
.ucam-badge--danger,
.ucam-prazo--vencido { background: var(--ucam-color-feedback-danger-background);  color: var(--ucam-color-feedback-danger-foreground); }

/* NEUTRO fica de fora do preenchimento, e não por esquecimento.
 *
 * O fundo pastel dos quatro tons é o degrau 100 da própria matiz. O neutro
 * não tem matiz: o 100 dele é o #FAFAFA de surface-subtle, que sobre o branco
 * do painel dá 1,02:1 — o selo desapareceria e sobraria texto com respiro.
 * Então o neutro segue se resolvendo pelo filete, como sempre se resolveu.
 *
 * O resultado é hierarquia, não inconsistência: neutral é o estado INERTE do
 * contrato (Rascunho, Arquivado), e ele lê mais quieto que os quatro que
 * significam alguma coisa. */
.ucam-badge--neutral {
  background: var(--ucam-color-surface-default);
  border-color: var(--ucam-color-border-default);
  color: var(--ucam-color-text-secondary);
}

/* ------------------------------------------------------ selo: ponto --- */
/* O PONTO substitui o ícone em densidade alta. Contrato: badge.json.
 *
 * Existia no Trilho B desde sempre (DOT_CLASSES em ucam-badge.ts) e nunca
 * existiu aqui — o mesmo componente tinha duas anatomias conforme o trilho,
 * que é o defeito que a página do catálogo promete não ter.
 *
 * currentColor, e NÃO o degrau saturado que o ícone usa. A distinção é entre
 * uma FORMA e um disco.
 *
 * O ícone tem desenho: 14px de traço reconhecível, que se lê mesmo com
 * pouco contraste, e por isso pode gastar saturação. O ponto não tem desenho
 * nenhum — ele é contraste puro, e se some contra o próprio preenchimento
 * não sobra nada dele. Medido no navegador com o degrau saturado, o par
 * ponto/fundo dava 4,17 no claro e 2,98 no ESCURO (success), porque no tema
 * escuro o fundo vira o degrau 900 e a tinta do ponto continua no 500: os
 * dois se aproximam por cima e por baixo ao mesmo tempo.
 *
 * Herdando a tinta do rótulo, o ponto passa a viajar no par que o portão de
 * build já mede — 8,24 no claro e 12,22 no escuro. Um valor, cinco tons, dois
 * temas, e nenhuma medida nova para manter.
 *
 * Ele segue DECORATIVO (aria-hidden) e não responde por 1.4.11: o estado
 * continua escrito por extenso ao lado. Isto aqui é legibilidade, não
 * conformidade. */
.ucam-badge__ponto {
  inline-size: 0.375rem;
  block-size: 0.375rem;
  border-radius: var(--ucam-radius-pill);
  flex: none;
  background: currentColor;
}

/* --------------------------------------------------- selo: contorno --- */
/* A pílula branca de 03/09/2026, PRESERVADA — não revogada.
 *
 * O argumento que a criou vale onde ela nasceu: numa coluna de 14 linhas,
 * catorze retângulos tintos viram uma faixa de cor que compete com o dado ao
 * lado. Quem tem essa coluna pede --contorno e recebe o desenho anterior
 * inteiro: fundo do painel, filete da tinta do tom a 30%, rótulo em
 * text-primary e a cor concentrada no ícone.
 *
 * O que mudou foi só qual dos dois é o PADRÃO. */
.ucam-badge--outline {
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
}

.ucam-badge--outline.ucam-badge--neutral { border-color: var(--ucam-color-border-subtle); }
.ucam-badge--outline.ucam-badge--info    { border-color: color-mix(in srgb, var(--ucam-color-feedback-info-border) 30%, transparent); }
.ucam-badge--outline.ucam-badge--success { border-color: color-mix(in srgb, var(--ucam-color-feedback-success-border) 30%, transparent); }
.ucam-badge--outline.ucam-badge--warning { border-color: color-mix(in srgb, var(--ucam-color-feedback-warning-border) 30%, transparent); }
.ucam-badge--outline.ucam-badge--danger  { border-color: color-mix(in srgb, var(--ucam-color-feedback-danger-border) 30%, transparent); }

/* -------------------------------------------------------------- prazo --- */
/* O prazo NAO redesenha a pastilha: ele entra nos seletores do badge, acima.
 *
 * Ate 09/09/2026 a caixa era declarada duas vezes — mesma altura, mesmo raio,
 * mesmo respiro — e as duas copias divergiram em producao: medido na Caixa de
 * entrada, o "vence em 1 dia" saia maior que o "Urgente" colado nele, porque
 * so a altura estava declarada dos dois lados. A borda transparente de 1px
 * que compensava o border-box some junto: com uma regra so, nao ha o que
 * compensar.
 *
 * Sobram os dois tons, e eles tambem apenas APONTAM para os do badge:
 * --proximo veste o warning, --vencido veste o danger. O relogio continua
 * sendo o que distingue prazo de selo numa varredura. */

/* ------------------------------------------------------------- avatar --- */
/* Contrato: avatar.json. 24/32/48px (sm/md/lg) — o contrato já traduz os três
 * em px, não há motivo pra reinventar em rem redondo diferente. A cor de
 * fundo varia por pessoa (o próprio contrato exige isso: "cor derivada do
 * nome NUNCA carrega significado, é só variação visual") — reaproveita os
 * pares fundo/tinta do feedback, já com contraste verificado, só que sem
 * relação nenhuma com o estado que esses tons normalmente sinalizam aqui. */

.ucam-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: var(--ucam-radius-pill);
  /* TINTA de composição, não superfície opaca. surface-subtle era #F8FAFC:
   * sobre o branco do painel dava 1,02:1 e as iniciais flutuavam sem disco
   * nenhum; sobre a moldura, que É surface-subtle, o avatar sumia inteiro.
   * A tinta alfa dá o mesmo degrau sobre qualquer fundo, nos dois temas, e
   * é o mesmo valor que o item escolhido da navegação já usa. */
  background: var(--ucam-color-interaction-selected);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  letter-spacing: 0.01em;
  overflow: hidden;
}

.ucam-avatar--sm { inline-size: 1.5rem; block-size: 1.5rem; font-size: 0.6875rem; }
.ucam-avatar--lg { inline-size: 3rem; block-size: 3rem; font-size: var(--ucam-typography-body-sm-font-size); }
.ucam-avatar img { inline-size: 100%; block-size: 100%; object-fit: cover; }

/* OS QUATRO AVATARES TINTOS SAÍRAM (ADR-022). Eram --1 a --4, reaproveitando
 * os pares fundo/tinta de info, success, marca e warning — "sem relação
 * nenhuma com o estado que esses tons sinalizam", dizia o comentário, e
 * era exatamente esse o defeito: ninguém lê um disco verde ao lado de um
 * prazo vencido como "variação visual". Lê como contradição. O contrato do
 * avatar nunca prometeu variante de cor — a identidade vem da foto ou das
 * iniciais, e o disco é neutro. */

/* Avatar decorativo (aria-hidden) + nome ao lado — célula de tabela onde a
 * pessoa É a informação (Responsável, Requerente), não só o rótulo dela.
 * Sem isto a coluna vira uma lista de nomes que só se distinguem lendo
 * letra por letra; a cor do avatar dá o atalho visual. */
.ucam-user-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
}

/* --------------------------------------------------------------- card --- */

/* color explícito é o que faltava: sem ele, um .ucam-card usado como <a>
 * (a grade de módulos do portal, por exemplo) herda o azul de link padrão do
 * navegador — e como os ícones do sprite pintam por stroke=currentColor,
 * cada ícone saía azul-vívido igual, não importa o módulo. Não era estilo
 * nenhum, era ausência de um. */
.ucam-card {
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  /* RECUO DE SUPERFÍCIE: 16px, o mesmo do stat, da linha de lista e da célula
   * de tabela. O cartão era o único em 20, e num painel que empilha cartões
   * sobre uma lista (o gerencial) o texto de dentro nascia em x=359 num bloco
   * e x=355 no outro — 4px de degrau entre blocos vizinhos. A régua de 20 é
   * da MOLDURA (faixa, coluna, corpo); dentro de uma superfície é 16. */
  padding: var(--ucam-space-inset-md);
  color: var(--ucam-color-text-primary);
  /* PLANO em repouso. A elevação é da MOLDURA, não do conteúdo.
   *
   * O cartão levitava do painel com o mesmo degrau que o painel levita do
   * chão da aplicação — três planos empilhados dizendo a mesma coisa. Numa
   * tela com oito cartões o resultado é uma grade de retângulos que flutuam
   * sem que nenhum flutue mais que o outro: sombra que todo mundo tem não
   * separa ninguém.
   *
   * Agora só duas peças elevam — a faixa e o painel de conteúdo, que são a
   * moldura da aplicação. Dentro dela o que separa superfícies é o fio de
   * 1px, e a sombra volta a significar distância: sobrou para o hover do
   * cartão acionável e para o que de fato paira. ADR-019.
   *
   * Declarado, e não omitido: o token existe para que o repouso seja uma
   * ESCOLHA legível na folha, e para que quem quiser o degrau de volta
   * troque um valor em vez de reintroduzir a linha.  */
  box-shadow: var(--ucam-elevation-flat);
  /* Pelo mesmo motivo do "color" acima: o cartão TAMBÉM é usado como <a> — e o
   * sublinhado do navegador atravessava o cartão inteiro na grade de módulos do
   * Portal. Cada tela desligava isso por conta própria, em style inline, vinte
   * vezes na mesma página. */
  text-decoration: none;
}

/* TÍTULO E APOIO DO CARTÃO.
 *
 * O contrato diz que o cartão não impõe ritmo interno — quem espaça os filhos é
 * o bloco de arranjo — e continua valendo: estas duas partes não têm margem. O
 * que elas resolvem é TIPOGRAFIA, e a alternativa estava escrita nas telas:
 * <p style=margin:0;font-weight:600> seguido de class=ucam-field__hint
 * fora de qualquer campo, nove vezes em quatro telas. Peso 600 cravado à mão
 * não acompanha a escala, e um hint de formulário emprestado para descrever um
 * setor é um rótulo mentindo sobre o que é. */
.ucam-card__titulo {
  display: block;
  margin: 0;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: var(--ucam-typography-label-line-height);
  color: var(--ucam-color-text-primary);
}

.ucam-card__apoio {
  display: block;
  margin: 0;
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
  color: var(--ucam-color-text-secondary);
}

/* O CABEÇALHO DO CARTÃO: ladrilho de ícone, título e apoio empilhados, e um
 * lugar para a ação ou o selo à direita.
 *
 * A receita já estava escrita nas telas — "ucam-cluster ucam-cluster--entre"
 * com o ladrilho de um lado e o apoio do outro, ou o título de seção com
 * style="margin-block-end:1rem" — em nove cartões de três telas, com o vão
 * decidido a cada vez. É o cartão de painel dos produtos do gênero: o ícone
 * diz de que família é o dado, o título diz qual, e o apoio diz o recorte.
 *
 * É a ÚNICA parte do cartão com margem própria, e a exceção é deliberada: o
 * contrato diz que o ritmo interno é do bloco de arranjo, mas o cabeçalho
 * não é conteúdo — é o que separa o conteúdo da moldura, e a distância até
 * ele tem de ser a mesma em todo cartão do sistema, tenha o corpo um
 * gráfico, uma tabela ou três linhas de texto. */
.ucam-card__cabecalho {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  margin-block-end: var(--ucam-space-stack-md);
}

.ucam-card__cabecalho > .ucam-icon-tile { flex: none; }

/* Dentro de um bloco de arranjo o ritmo volta a ser do bloco: o gap do stack
 * já separa o cabeçalho do que vem depois, e a margem somaria a ele. */
.ucam-stack > .ucam-card__cabecalho { margin-block-end: 0; }

/* Título e apoio são UM bloco de texto. Num cartão em pilha (ladrilho, título,
 * apoio) o gap da pilha caía igual entre os três, e "Aluno · gerado ontem"
 * ficava tão longe do título quanto o título do ícone — três coisas soltas em
 * vez de figura + texto. O apoio encosta no título; a entrelinha já dá o ar. */
/* A IDENTIDADE — nome, linha que o qualifica e os selos do registro — é um
 * bloco de TRÊS degraus, e até 20/09/2026 ela não tinha nenhum: fora de uma
 * pilha, título, apoio e selos saíam com vão ZERO entre as caixas, e o
 * cabeçalho do requerimento lia como um parágrafo só. Medido na tela de
 * detalhe: nome→apoio 0px, apoio→selos 0px.
 *
 * Os dois degraus são diferentes de propósito. Entre o nome e o apoio vai o
 * menor vão do sistema: são a mesma coisa dita em dois níveis, e separá-los
 * mais faria o apoio ler como outro dado. Entre o texto e os selos vai o
 * degrau de pilha: selo é OUTRA classe de informação — situação, prazo,
 * modalidade —, e é o vão que diz isso sem precisar de fio nem de caixa. */
.ucam-card__titulo + .ucam-card__apoio {
  margin-block-start: var(--ucam-space-inline-xs);
}

.ucam-card__titulo + .ucam-cluster,
.ucam-card__apoio + .ucam-cluster {
  margin-block-start: var(--ucam-space-stack-sm);
}

/* Dentro de uma pilha quem separa é o gap dela, e o par continua sendo UM
 * bloco: o negativo desconta o gap e devolve o mesmo degrau menor de cima. */
.ucam-stack > .ucam-card__titulo + .ucam-card__apoio {
  margin-block-start: calc(var(--ucam-space-inline-xs) - var(--ucam-stack-gap));
}

/* O texto encolhe e o resto não: título longo vira reticência em vez de
 * empurrar o selo para fora do cartão. */
.ucam-card__cabecalho-texto {
  flex: 1 1 auto;
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
}

.ucam-card__cabecalho-texto > .ucam-card__titulo,
.ucam-card__cabecalho-texto > .ucam-card__apoio {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* O que vem depois do texto assenta na ponta direita: selo de período, menu
 * do cartão, a estrela que fixa. */
.ucam-card__cabecalho > :last-child:not(.ucam-card__cabecalho-texto) {
  flex: none;
  margin-inline-start: auto;
}

/* Os dois degraus NÃO-padrão da prop elevation.
 *
 * Desde a ADR-019 o repouso do cartão é plano, e estes dois passaram a
 * precisar de tinta própria: antes, raised era o padrão e não tinha classe
 * porque não precisava, e sticky já morava em --elevado. O portão de
 * vocabulário cobrou os dois no dia em que o padrão mudou — que é
 * exatamente o trabalho dele.
 *
 * --raised: cartão sobre superfície SEM fio que o recorte — dentro de um
 * bloco tinto, aninhado em outro cartão. Não é para destacar um cartão entre
 * iguais; isso é trabalho da borda, do tom ou da ordem.
 *
 * --elevado: o que de fato paira. O nome não virou --sticky porque a classe
 * é anterior e está nos dois trilhos; quem faz a ponte entre o valor do
 * contrato e ela é o campo classe em card.json. */
.ucam-card--raised  { box-shadow: var(--ucam-elevation-raised); }
.ucam-card--elevado { box-shadow: var(--ucam-elevation-sticky); }

/* CARTÃO ACIONÁVEL — o cartão que leva a algum lugar E carrega um controle
 * próprio. É a grade de módulos com a estrela de acessos frequentes.
 *
 * O cartão NÃO é o link. \`<a class="ucam-card">\` com um \`<button>\` dentro é
 * marcação inválida — conteúdo interativo dentro de âncora —, e o navegador
 * resolve isso como quiser: no Chrome o botão funciona, no Firefox o clique
 * às vezes navega junto. Foi o caminho que o redesenho do SIGU tentou evitar
 * trocando a âncora por \`<div role="button" tabindex="0">\`, o que trocou um
 * defeito por três: perdeu o href (nada de abrir em nova aba, nada de menu de
 * contexto, nada de arrastar para a barra), reimplementou Enter e Espaço à
 * mão, e continuou com o botão aninhado dentro do alvo.
 *
 * Aqui quem é o link é o TÍTULO, e ele estica sobre o cartão inteiro por um
 * pseudo-elemento. O alvo de clique é a superfície toda, o nome acessível do
 * link é só o título — não o cartão inteiro lido em voz alta — e o botão da
 * ação secundária sobe uma camada e continua clicável. */
.ucam-card--acionavel {
  position: relative;
  transition:
    border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
    box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-card__link {
  color: inherit;
  text-decoration: none;
}

.ucam-card__link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--ucam-radius-surface);
}

/* Estado no CARTÃO, disparado pelo link — sem :has, o realce ficaria só no
 * texto do título e a superfície de 11rem que a pessoa está apontando não
 * responderia. */
.ucam-card--acionavel:has(.ucam-card__link:hover:not([aria-disabled="true"])) {
  border-color: var(--ucam-color-border-default);
  box-shadow: var(--ucam-elevation-sticky);
}

/* LINK SEM DESTINO diz que não tem. O catálogo de relatórios monta cartão
 * acionável para relatório que ainda não tem tela, com role='link' e
 * aria-disabled — e o cartão subia no hover e o título vestia a mesma tinta
 * do vizinho que abre de verdade. É a mesma regra do item de menu sem
 * destino: título visível, tinta secundária, cursor que nega. Fingir link é
 * pior que não ter. */
.ucam-card__link[aria-disabled="true"] {
  color: var(--ucam-color-text-secondary);
  cursor: not-allowed;
}

/* O anel de foco também é do cartão. O contorno em volta do texto do título,
 * dentro de uma superfície que já tem borda, lê como campo de formulário. */
.ucam-card--acionavel:has(.ucam-card__link:focus-visible) {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

.ucam-card--acionavel .ucam-card__link:focus-visible { outline: none; }

/* A ação secundária sobe acima do link esticado. Sem isto, o pseudo-elemento
 * cobre o botão e a estrela nunca recebe o clique. */
.ucam-card__acao {
  position: relative;
  z-index: 1;
}

/* CARTÃO DE DESTINO EM LINHA — ladrilho, nome e estrela numa fileira só.
 *
 * Era uma pilha: ladrilho e estrela em cima, nome embaixo, selo por último.
 * 115px de altura para UMA palavra, e a fileira crescia até 210px quando um
 * vizinho trazia nome de duas linhas e selo Legado — 58 cartões, quatro telas
 * de rolagem. Em linha o cartão tem a altura do ladrilho mais o recuo, e o
 * nome lê na mesma altura do ícone que o identifica.
 *
 * É o cabeçalho de cartão (acima) sozinho no cartão: sem corpo depois dele, a
 * margem que o separa do corpo não separa nada. */
.ucam-card__cabecalho:last-child { margin-block-end: 0; }

/* No cartão acionável o nome QUEBRA em até duas linhas em vez de virar
 * reticência: "Acadêmico pós-graduação e extensão" é o nome inteiro, e o
 * pedaço que a reticência cortava ("e extensão") é justamente o que separa
 * este sistema do "Acadêmico graduação" ao lado. O link esticado não é
 * cortado pelo overflow: o bloco que o contém é o cartão, não o título. */
.ucam-card--acionavel .ucam-card__cabecalho-texto > .ucam-card__titulo {
  white-space: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* Apoio com ícone (Legado): o relógio assenta na linha, no
 * degrau da pastilha (12), que é o da legenda ao lado. */
.ucam-card__apoio > .ic {
  margin-inline-end: var(--ucam-space-inline-xs);
  vertical-align: -0.125rem;
}

/* A ESTRELA DO CARTÃO.
 *
 * Fixada, ela é UM sinal: a forma cheia na cor da ação. O fundo de
 * "selecionado" que o interruptor de ícone ganha em qualquer outro lugar
 * aqui virava um quadrado cinza no canto do cartão branco — segundo sinal
 * para o mesmo estado, e o único fundo cinza da tela. O hover continua.
 *
 * Solta, ela só aparece quando o cartão é apontado ou tem foco dentro. Eram
 * 58 estrelas vazias na tela, uma por cartão, e a fileira de contornos
 * iguais competia com o nome de cada sistema sem dizer nada — o estado
 * "não fixado" não é notícia. Continua no documento e na ordem de Tab:
 * receber foco a revela. Em tela de toque não há ponteiro para revelar, e
 * ela fica sempre à vista. */
.ucam-card__acao[aria-pressed="true"] { background-image: none; }
.ucam-card__acao[aria-pressed="true"]:hover:not(:disabled) {
  background-image: linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover));
}

@media (hover: hover) and (pointer: fine) {
  .ucam-card--acionavel .ucam-card__acao[aria-pressed="false"] {
    opacity: 0;
    transition: opacity var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
  }
  .ucam-card--acionavel:hover .ucam-card__acao[aria-pressed="false"],
  .ucam-card--acionavel:focus-within .ucam-card__acao[aria-pressed="false"] { opacity: 1; }
}

/* O clique que fixa tem retorno no próprio controle: a estrela cresce e
 * assenta. data-fixou é posto pelo script no clique — sem ele, as estrelas
 * já fixadas pulariam todas juntas ao carregar a tela. Só com movimento
 * permitido. */
@media (prefers-reduced-motion: no-preference) {
  .ucam-card__acao[aria-pressed="true"][data-fixou] .ic { animation: ucam-estrela-fixa 240ms var(--ucam-motion-easing-standard); }
}
@keyframes ucam-estrela-fixa {
  0% { transform: scale(0.7); }
  60% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

/* Chip de ícone — fundo atrás do ícone, onde o ícone PRECISA discriminar
 * (grade de módulos, listas de escolha). Sem ele, a fileira de 25 módulos
 * vira 25 traços do mesmo tamanho e cor.
 *
 * NEUTRO por padrão, e não mais 12% do bordô com o traço em bordô cheio.
 * O motivo é que o tinto não discriminava nada: os 25 módulos do Portal
 * tinham o mesmo fundo rosa e o mesmo traço bordô: o que os distingue é o
 * DESENHO do ícone, e a cor repetida 25 vezes só somava peso de marca a uma
 * tela que já tem a marca na faixa. Cor de marca aqui volta com o modificador
 * --marca, para o caso em que UM item precisa se destacar dos irmãos — que é
 * o único caso em que cor de marca informa alguma coisa. */
/* 40px, e vindo de token: eram 2.25rem literais, com um ícone de 16 dentro —
 * um quadrado grande com um símbolo pequeno no meio, que é o desenho de
 * moldura vazia. Com o ícone no degrau padrão (20px) o ladrilho passa a ter
 * 10px de folga em volta, e a medida de 40px é a MESMA do item de navegação
 * (size.control-lg): as duas peças que carregam ícone na tela passam a ocupar
 * a mesma caixa. */
.ucam-icon-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--ucam-size-control-lg);
  block-size: var(--ucam-size-control-lg);
  border-radius: var(--ucam-radius-control);
  background: var(--ucam-color-surface-sunken);
  color: var(--ucam-color-text-secondary);
  flex: none;
}

.ucam-icon-tile--marca {
  background: color-mix(in srgb, var(--ucam-color-action-primary-default) 12%, transparent);
  color: var(--ucam-color-action-primary-default);
}

/* CATEGORIA (ADR-032). O ladrilho neutro existe porque cor de marca repetida
 * 25 vezes não discrimina. Cor de CATEGORIA discrimina: seis tintas para 58
 * módulos em que dez ícones se repetem — o capelo do Acadêmico e o do
 * Vestibular passam a ser azul e azul, mas o Financeiro ao lado é verde. A
 * receita é a mesma do --marca: fundo a 12%, traço na cor. Variável de bloco
 * para a receita ser escrita uma vez; cada categoria só troca a tinta. */
.ucam-icon-tile--academico,
.ucam-icon-tile--financeiro,
.ucam-icon-tile--atendimento,
.ucam-icon-tile--gestao,
.ucam-icon-tile--pessoas,
.ucam-icon-tile--acervo {
  --ucam-tile-cor: var(--ucam-color-text-secondary);
  background: color-mix(in srgb, var(--ucam-tile-cor) 12%, transparent);
  color: var(--ucam-tile-cor);
}
.ucam-icon-tile--academico   { --ucam-tile-cor: var(--ucam-color-categoria-academico); }
.ucam-icon-tile--financeiro  { --ucam-tile-cor: var(--ucam-color-categoria-financeiro); }
.ucam-icon-tile--atendimento { --ucam-tile-cor: var(--ucam-color-categoria-atendimento); }
.ucam-icon-tile--gestao      { --ucam-tile-cor: var(--ucam-color-categoria-gestao); }
.ucam-icon-tile--pessoas     { --ucam-tile-cor: var(--ucam-color-categoria-pessoas); }
.ucam-icon-tile--acervo      { --ucam-tile-cor: var(--ucam-color-categoria-acervo); }

/* 28px: a marquinha do módulo na faixa e a fileira densa. Ícone no degrau
 * miúdo, raio do controle pequeno — a mesma proporção do botão --sm. */
.ucam-icon-tile--sm {
  inline-size: var(--ucam-size-control-sm);
  block-size: var(--ucam-size-control-sm);
  border-radius: var(--ucam-radius-control-sm);
}
.ucam-icon-tile--sm .ic {
  inline-size: var(--ucam-size-icon-sm);
  block-size: var(--ucam-size-icon-sm);
}

/* ------------------------------------------------------- cabeçalho de página --- */

/* Sem filete embaixo. Ele desenhava uma segunda linha horizontal a 32px da
 * borda do cartão que vem logo abaixo — duas réguas paralelas quase juntas,
 * que é o desenho que faz uma tela parecer um formulário de 2010. O respiro
 * separa; a linha era redundante. */
/* 60px de altura fixa e o título alinhado ao centro dela — a medida do
 * arquivo de interfaces. Fixa e não mínima porque é a régua que faz o topo de
 * todas as telas do sistema baterem: com altura automática, uma tela com
 * subtítulo empurrava o conteúdo 22px para baixo e a troca entre duas telas
 * do mesmo módulo dava um salto. Quem precisa de duas linhas usa o lede
 * abaixo da faixa, não dentro dela. */
.ucam-page-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ucam-space-inline-md);
  /* TOPO, não centro.
   *
   * Com \`center\`, as ações centralizavam contra o BLOCO da esquerda inteiro —
   * título mais descrição. Numa tela de uma linha isso coincide com a linha do
   * título; na tela seguinte, que tem descrição, as ações descem uns 11px e
   * ficam entre as duas linhas, alinhadas a nada. É o salto que se vê ao
   * passar de "Cálculo de mensalidade" (sem descrição) para "Movimento de
   * caixa" (com descrição) no mesmo módulo.
   *
   * Com \`start\` mais o \`min-block-size\` do título no bloco de ações, as ações
   * assentam sempre na linha do título, tenha ele descrição ou não. */
  align-items: flex-start;
  justify-content: space-between;
  min-block-size: 3.75rem;
  margin-block-end: var(--ucam-space-inset-sm);
}

.ucam-page-header__title {
  font-size: var(--ucam-typography-page-title-font-size);
  font-weight: var(--ucam-typography-page-title-font-weight);
  line-height: var(--ucam-typography-page-title-line-height);
  letter-spacing: -0.015em;
  margin: 0;
}

/* A DESCRIÇÃO DA TELA.
 *
 * Não existia. As dez telas escreviam \`class="ucam-field__hint"\` com
 * \`style="margin:.25rem 0 0"\` colado — reaproveitando o texto de apoio de um
 * CAMPO DE FORMULÁRIO para descrever uma página, e recolocando a margem à mão
 * em cada uma. Duas consequências: a descrição saía em caption (12px), pequena
 * demais para a frase que explica a tela, e qualquer ajuste exigiria editar
 * dez strings.
 *
 * 14px é o corpo de apoio do sistema; 68 caracteres é a medida em que a frase
 * ainda se lê em uma ou duas linhas sem atravessar a tela toda. */
.ucam-page-header__description {
  margin: var(--ucam-space-inline-xs) 0 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: var(--ucam-typography-body-sm-line-height);
  color: var(--ucam-color-text-secondary);
  max-inline-size: 68ch;
}

/* As ações assentam na linha do título.
 *
 * A altura mínima é a do título; com \`align-items: center\` DENTRO dela, os
 * botões centralizam contra essa linha e só contra ela — a descrição abaixo
 * deixa de influenciar. */
.ucam-page-header__acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-block-size: var(--ucam-typography-page-title-line-height);
}

/* FAVORITAR o registro: a estrela ao lado do título.
 *
 * É o interruptor de ícone do contrato icon-button, com aria-pressed, e nada
 * mais — a tinta do estado pressionado e o preenchimento do SVG já vêm de
 * .ucam-btn--icon[aria-pressed]. O que esta classe resolve é POSIÇÃO: colada
 * ao título, na linha dele, e não no bloco de ações à direita, porque
 * favoritar não é ação sobre a tela e sim atributo do registro — o mesmo
 * lugar em que a grade de módulos põe a estrela do cartão.
 *
 * Só existe quando a tela é de UM registro (requerimento, setor, aluno). Numa
 * listagem, "favoritar a Caixa de entrada" é favoritar uma tela, e isso é
 * assunto da navegação (ver o grupo Favoritos do app-shell), não do título. */
.ucam-page-header__favorito,
.ucam-viewbar__favorito {
  flex: none;
  align-self: center;
}

/* ------------------------------------------------------------- trilha --- */
/* O breadcrumb estava no contrato (page-header.json, parte \`breadcrumb\`) e no
 * componente Angular, e NÃO existia aqui: uma tela legada que seguisse o
 * contrato não tinha classe nenhuma para renderizá-lo. É o mesmo tipo de
 * buraco que os ícones sem tamanho tinham — contrato de um lado, geração de
 * outro, e nada ligando os dois.
 *
 * A trilha é uma FAIXA PRÓPRIA acima do cabeçalho, não uma linha colada ao
 * título: ela responde onde estou, e o título responde o que é esta tela. */
.ucam-trilha {
  margin-block-end: var(--ucam-space-inline-sm);
}

.ucam-trilha ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 var(--ucam-space-inline-sm);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--ucam-typography-caption-font-size);
  line-height: 1.6;
}

.ucam-trilha li {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
}

/* Os degraus navegáveis são LINK e precisam parecer link.
 *
 * O defeito que isto corrige: todos os degraus saíam na mesma tinta apagada,
 * inclusive a página atual. A trilha desenhava a hierarquia e escondia a
 * própria função — nada dizia onde clicar nem onde a pessoa estava. */
.ucam-trilha a {
  color: var(--ucam-color-text-secondary);
  text-decoration: underline;
  text-decoration-color: var(--ucam-color-border-default);
  text-underline-offset: 0.25em;
  text-decoration-thickness: 1px;
  border-radius: var(--ucam-radius-miudo);
  transition: color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              text-decoration-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-trilha a:hover {
  color: var(--ucam-color-text-primary);
  text-decoration-color: currentColor;
}

/* A página atual: única em tinta cheia, e sem sublinhado porque não leva a
 * lugar nenhum. */
.ucam-trilha [aria-current="page"] {
  color: var(--ucam-color-text-primary);
  font-weight: var(--ucam-typography-label-font-weight);
}

/* Separador tipográfico, não ícone.
 *
 * Era chevronRight de 16px ao lado de um texto de 12px no componente Angular:
 * o símbolo entre as palavras maior que as palavras. A barra escala com o
 * tipo. aria-hidden no markup, senão o leitor de tela lê "barra" a cada
 * degrau — a estrutura de <ol> já entrega a hierarquia. */
.ucam-trilha__sep {
  color: var(--ucam-color-border-strong);
  user-select: none;
}

/* ---------------------------------------------------------------- link --- */
/* O @ucam/css não estiliza elemento nu — é a restrição 2 do topo do arquivo.
 * Sem reset, um <a> dentro do escopo sai no azul e roxo do navegador, e foi
 * assim que os templates acabaram repetindo style="color:var(--ucam-color-
 * text-link)" em cada link de cada tela: sem sublinhado, sem visited, sem
 * estado próprio. Um link é componente, não enfeite de parágrafo.
 *
 * Sublinhado em REPOUSO, não só no hover: cor sozinha não distingue link de
 * texto corrido (WCAG 1.4.1). O deslocamento tira a linha de cima das hastes
 * descendentes, que é o que faz sublinhado parecer sujeira tipográfica. */
.ucam-link {
  color: var(--ucam-color-text-link);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
  border-radius: var(--ucam-radius-miudo);
}

.ucam-link:hover { text-decoration-thickness: 2px; }

/* Link de APOIO: mesma cor e mesmo sublinhado, corpo menor.
 *
 * Existe porque saída secundária ao lado de um rótulo de campo — "Esqueci
 * minha senha" na linha de "Senha" — no corpo cheio compete com o rótulo que
 * ela acompanha. O contraste continua o do link normal; o que desce é o
 * tamanho, não a legibilidade. */
.ucam-link--apoio {
  font-size: var(--ucam-typography-caption-font-size);
}

/* Frase de apoio abaixo de um título de tela ou de cartão.
 *
 * Não é .ucam-field__hint. O hint é o apoio DE UM CAMPO e vive dentro de um
 * .ucam-field; usado solto, ele fica com o tamanho e a cor certos e sem nada
 * a que se prender — foi assim que o texto do CPF na tela de autenticação
 * apareceu flutuando entre o título e o formulário. */
.ucam-lede {
  margin: 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  /* O token, não a razão: 1.5 sobre 13px dá 19,5px e quebra a grade vertical
   * de tudo que vier abaixo. O papel body-sm já declara 20px. */
  line-height: var(--ucam-typography-body-sm-line-height);
  color: var(--ucam-color-text-secondary);
  text-wrap: pretty;
}

/* A FRASE QUE ABRE A TELA precisa de ar antes da primeira seção.
 *
 * Sem margem — que é o certo dentro do cartão de login, onde ela vem colada ao
 * título — ela encostava em "Parâmetros do cálculo" no alto do corpo, a 4px do
 * h3. Duas frases empilhadas em tinta parecida, e a de cima explicando a TELA
 * enquanto a de baixo nomeia uma SEÇÃO dela: quem varre lê as duas como um
 * bloco só e atribui a primeira à segunda.
 *
 * A margem entra pelo filho direto do corpo, e não na classe: é a POSIÇÃO que
 * cria a necessidade, não o papel do texto. */
.ucam-corpo > .ucam-lede {
  margin-block-end: var(--ucam-space-stack-md);
}

/* Rodapé do cartão: a saída que não faz parte da tarefa.
 *
 * Filete e respiro em cima separam-no do formulário sem transformá-lo em
 * segunda ação — é o lugar de "Ainda não tem acesso? Primeiro acesso", que
 * antes disputava o pé do cartão de igual para igual com "Esqueci minha
 * senha". */
.ucam-card__rodape {
  margin: 0;
  padding-block-start: var(--ucam-space-inset-md);
  /* Fio por sombra — contado na caixa dava 37px e meio-pixel abaixo. */
  box-shadow: inset 0 1px 0 var(--ucam-color-border-subtle);
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
  text-align: center;
}

/* --------------------------------------------------------- estado vazio --- */
/* Contrato: empty-state.json. Todo estado vazio oferece uma saída — a ação
 * faz parte da marcação, não é opcional. */

.ucam-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ucam-space-stack-sm);
  padding: var(--ucam-space-inset-lg);
  text-align: center;
}

.ucam-empty__title {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  color: var(--ucam-color-text-primary);
  margin: 0;
}

.ucam-empty__description {
  color: var(--ucam-color-text-secondary);
  max-inline-size: 48ch;
  margin: 0;
}

/* ---------------------------------------------------------- paginação --- */
/* Contrato: pagination.json. Cada controle exige nome acessível na marcação —
 * é a correção de acessibilidade mais urgente do parque. */

/* As duas pontas ROTULADAS. "Anterior" e "Próximo" escritos, e não dois
 * chevrons: chevron sozinho num rodapé de tabela divide o mesmo desenho com
 * "ordenar", "expandir" e "abrir" — quatro significados para a mesma seta. A
 * palavra resolve, e o ícone continua ao lado dando a direção. */
.ucam-pagination__salto {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
}

.ucam-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
}

.ucam-pagination__range {
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
  font-variant-numeric: tabular-nums;
  margin-inline-end: auto;
}

.ucam-pagination__page {
  min-inline-size: var(--ucam-size-control-sm);
  min-block-size: var(--ucam-size-control-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--ucam-space-inline-sm);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--ucam-radius-control-sm);
  color: var(--ucam-color-text-secondary);
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.ucam-pagination__page:hover:not([aria-disabled="true"]) {
  background: var(--ucam-color-action-secondary-hover);
  color: var(--ucam-color-text-primary);
}

.ucam-pagination__page[aria-current="page"] {
  background: var(--ucam-color-action-primary-subtle);
  border-color: color-mix(in srgb, var(--ucam-color-action-primary-default) 40%, transparent);
  color: var(--ucam-color-action-primary-default);
  font-weight: var(--ucam-typography-action-font-weight);
}

.ucam-pagination__page[aria-disabled="true"] {
  color: var(--ucam-color-text-disabled);
  cursor: not-allowed;
}

/* A ELIPSE NÃO É CONTROLE: é o buraco entre a janela de páginas e a última.
 *
 * Ela vinha sem classe e herdava a tinta primária do corpo — o glifo mais
 * ESCURO da fileira, mais forte que os números que ele resume e que as duas
 * pontas. Toma a tinta dos números, porque é deles que ela fala, e a largura
 * de um deles, para o compasso não afundar no meio da fileira.
 *
 * Sem alvo e sem extensor de propósito: não há o que tocar aqui. */
.ucam-pagination__elipse {
  min-inline-size: var(--ucam-size-control-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ucam-color-text-secondary);
}

/* ------------------------------------------------------------ feedback --- */

.ucam-alert {
  display: flex;
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inset-md);
  border-inline-start: 3px solid;
  border-radius: var(--ucam-radius-miudo);
}

.ucam-alert--info    { background: var(--ucam-color-feedback-info-background);    color: var(--ucam-color-feedback-info-foreground);    border-color: var(--ucam-color-feedback-info-border); }
.ucam-alert--success { background: var(--ucam-color-feedback-success-background); color: var(--ucam-color-feedback-success-foreground); border-color: var(--ucam-color-feedback-success-border); }
.ucam-alert--warning { background: var(--ucam-color-feedback-warning-background); color: var(--ucam-color-feedback-warning-foreground); border-color: var(--ucam-color-feedback-warning-border); }
.ucam-alert--danger  { background: var(--ucam-color-feedback-danger-background);  color: var(--ucam-color-feedback-danger-foreground);  border-color: var(--ucam-color-feedback-danger-border); }

/* O ícone do tom não encolhe e assenta na primeira linha do texto — não no
 * centro do bloco. Alerta de três linhas com o ícone flutuando no meio parece
 * um marcador de lista mal posicionado. */
.ucam-alert .ic {
  flex: none;
  margin-block-start: 0.125rem;
  color: inherit;
}

/* O corpo toma a sobra para que o botão de fechar encoste na borda direita. */
.ucam-alert__corpo {
  flex: 1;
  min-inline-size: 0;
}

.ucam-alert__corpo > :first-child { margin-block-start: 0; }
.ucam-alert__corpo > :last-child  { margin-block-end: 0; }

.ucam-alert__titulo {
  margin: 0 0 var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

/* O BOTÃO DE FECHAR.
 *
 * O contrato do alerta declara \`dismissible\` desde a primeira versão e o
 * Trilho A não tinha como desenhá-lo: uma tela legada que quisesse um aviso
 * dispensável precisava inventar o botão, e inventaria sem nome acessível —
 * que é o defeito mais repetido do parque.
 *
 * A tinta é a do próprio alerta (\`currentColor\`), não uma cinza fixa: dentro
 * de um alerta danger, um x cinza sobre fundo rosado some. O alvo tem 24px
 * pelos 2.5.8 mesmo com o desenho de 16. */
.ucam-alert__fechar {
  flex: none;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  margin: -0.125rem -0.25rem -0.125rem 0;
  padding: 0;
  border: 0;
  border-radius: var(--ucam-radius-miudo);
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--ucam-motion-duration-state) ease,
              background-color var(--ucam-motion-duration-state) ease;
}

.ucam-alert__fechar:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

/* ============================================================== SHELL === */
/* Contrato: spec/components/app-shell.json + spec/layouts.json.
 *
 * A moldura de toda aplicação da UCAM. Antes desta seção o shell existia só
 * como contrato: \`.ucam-appbar\` era uma faixa de oito linhas, e cada template
 * remontava skip-link, navegação, main e contêiner de conteúdo à mão, com
 * style inline e rgba cravado. O resultado é que os defeitos que o contrato
 * descreve — drawer sobreposto em desktop, conteúdo espremido em container
 * estreito, campus sem contraste — continuavam sendo REPRODUZIDOS pelos
 * próprios exemplos do design system.
 *
 * A grade em uma frase: a faixa atravessa o topo, a navegação e o conteúdo
 * dividem a linha do meio, o rodapé atravessa a base. A navegação sai da
 * grade e vira painel sobreposto abaixo de 64rem — e SÓ abaixo de 64rem. */

/* ---------------------------------------------------------------- rail --- */
/* A COLUNA DE MÓDULOS.
 *
 * 72px de marca cheia na borda esquerda, com um ícone por sistema. Vem do
 * arquivo de interfaces da UCAM e resolve um problema que o parque tem e a
 * moldura anterior não endereçava: o Portal reúne ~25 módulos e, uma vez
 * dentro de um deles, não havia como trocar sem voltar ao Portal. O rail é
 * essa troca, sempre visível, sem custar largura de conteúdo — 72px contra os
 * 318 da navegação do módulo.
 *
 * Por que a marca ocupa a faixa inteira aqui e não uma testeira no topo: são
 * 72×768 contra 1423×64, ou seja, MENOS área de bordô do que a faixa
 * horizontal tinha, concentrada na borda em vez de atravessar o campo de
 * leitura. A marca fica presente o tempo todo e sai do caminho do dado. */
.ucam-rail {
  grid-area: rail;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  inline-size: var(--ucam-rail-width);
  padding-block: var(--ucam-space-inset-md);
  background: var(--ucam-color-surface-brand);
  color: var(--ucam-color-text-on-brand);
  /* Sticky e altura de viewport: a troca de módulo não pode depender de onde
   * a página foi rolada. */
  position: sticky;
  inset-block-start: 0;
  block-size: 100dvh;
  /* Camada DECLARADA, e não a que sobrar.
   *
   * \`position: sticky\` cria contexto de empilhamento mesmo com z-index auto —
   * e é isso que prende, dentro do rail, qualquer popover que saia dele. Sem
   * este número, o menu da conta abria a 300 lá dentro e continuava por baixo
   * da navegação, que reivindica 200: um menu que existe no DOM, responde ao
   * teclado e não aparece na tela.
   *
   * 100 e não 300: sobreposta — abaixo de 64rem — a navegação PRECISA cobrir o
   * rail, e é ela que vale 200. O que muda em desktop é do outro lado: lá a
   * navegação não é sobreposição nenhuma, e a linha abaixo a devolve ao chão. */
  z-index: var(--ucam-z-sticky);
}

/* A marca do rail é o símbolo, não o lockup: 72px não comportam a assinatura
 * horizontal, e reduzi-la até caber deixaria o brasão ilegível. */
.ucam-rail__marca {
  inline-size: 2.3rem;
  block-size: 2.3rem;
  flex: none;
  margin-block-end: var(--ucam-space-inset-md);
  background: currentColor;
  -webkit-mask: var(--ucam-rail-marca) no-repeat center / contain;
  mask: var(--ucam-rail-marca) no-repeat center / contain;
}

.ucam-rail__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  flex: none;
  border: 0;
  border-radius: var(--ucam-radius-control);
  background: none;
  color: color-mix(in srgb, currentColor 78%, transparent);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-rail__item:hover {
  background: color-mix(in srgb, var(--ucam-color-text-on-brand) 14%, transparent);
  color: var(--ucam-color-text-on-brand);
}

/* O módulo aberto é um CARTÃO CLARO sobre a marca — o inverso do item de
 * navegação, que é escuro sobre claro, e pela mesma razão: quem está aberto
 * sobe da superfície em que vive. */
.ucam-rail__item[aria-current="page"] {
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-action-primary-default);
}

/* O gatilho da navegação, no rail.
 *
 * Só existe abaixo de 64rem, e some sem deixar rastro: a partir dali a
 * navegação é COLUNA DA GRADE, sempre visível, e um botão "abrir navegação"
 * ao lado de uma navegação já aberta é um controle que não faz nada.
 * display:none e não visibility — ele precisa sair também da ordem de
 * tabulação, pelo mesmo motivo que a faixa não é emitida na moldura com rail.
 *
 * O filete embaixo separa o gatilho DA PÁGINA da coluna de MÓDULOS. São duas
 * naturezas diferentes empilhadas no mesmo trilho, e sem a separação o botão
 * de menu leria como mais um sistema do parque. */
.ucam-rail__menu {
  margin-block-end: var(--ucam-space-inline-xs);
  padding-block-end: var(--ucam-space-inline-sm);
  border-block-end: 1px solid color-mix(in srgb, var(--ucam-color-text-on-brand) 24%, transparent);
  border-radius: var(--ucam-radius-control) var(--ucam-radius-control) 0 0;
  block-size: auto;
  padding-block-start: var(--ucam-space-inline-xs);
}

${acima('nav-fixa')} {
  .ucam-rail__menu { display: none; }
}

.ucam-rail__sep {
  inline-size: 1.5rem;
  block-size: 1px;
  flex: none;
  margin-block: var(--ucam-space-inline-xs);
  background: color-mix(in srgb, var(--ucam-color-text-on-brand) 24%, transparent);
}

/* A conta, no pé do rail — é identidade, não navegação, e no pé ela fica fora
 * da sequência de módulos que o olho percorre.
 *
 * O contêiner ancora o popover; sem \`position: relative\` aqui o menu absoluto
 * sobe até o rail e abre grudado na borda esquerda da tela. */
.ucam-rail__conta {
  position: relative;
  margin-block-start: auto;
}

/* O gatilho. Era um <span> inerte: no arranjo com rail o sistema dizia quem
 * estava logado e não oferecia saída nenhuma — o signOut do contrato não tinha
 * onde ser acionado. Agora é botão, do tamanho de um item de módulo, e abre o
 * MESMO menu da faixa. */
.ucam-rail__usuario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  padding: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--ucam-radius-pill);
  color: inherit;
  cursor: pointer;
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* O anel aparece no hover e no aberto, e não em repouso: em repouso o avatar
 * já é um disco claro sobre o bordô — um contorno em volta dele seria a
 * segunda borda do mesmo objeto. */
.ucam-rail__usuario:hover,
.ucam-rail__usuario[aria-expanded="true"] {
  border-color: color-mix(in srgb, var(--ucam-color-text-on-brand) 48%, transparent);
}

.ucam-shell {
  /* Largura da navegação e teto do conteúdo são variáveis, não valores
   * cravados: é assim que \`navWidth\` e \`maxContentWidth\` do contrato chegam
   * ao CSS, por style no elemento raiz. */
  --ucam-nav-width: 19.875rem;
  --ucam-rail-width: 4.5rem;
  --ucam-content-max: 88rem;
  /* A RÉGUA, AGORA EM ZERO.
   *
   * Ela existia para recuar a faixa, a navegação e o painel de conteúdo das
   * bordas da janela — três peças flutuando sobre um chão cinza. O custo,
   * medido numa janela de 1440: mais de 90px de vão puro na horizontal, e cada
   * vão cobrando ainda um raio e uma sombra para explicar por que existe.
   *
   * Zerada, as superfícies se ENCOSTAM e o que separa dois planos é um fio de
   * 1px. A hierarquia entre eles passa a vir só de TOM — moldura em
   * surface-chrome, conteúdo em surface-default —, que é a mesma separação em
   * dois tons que a navegação já usava.
   *
   * A variável FICA, e não é sobra: quem hospeda o shell dentro de outra
   * moldura redeclara ela uma vez e a régua volta inteira. O que mudou é o
   * default. */
  --ucam-gutter: 0px;
  /* 4.5rem, e não os 4rem de antes — e o 4rem já tinha vindo de 3.25.
   *
   * A faixa carrega marca, busca, chip de contexto, identificação e sair —
   * cinco papéis. A 64px o problema deixou de ser aperto (o chip já tinha
   * folga) e passou a ser HIERARQUIA: o conjunto marca + nome do sistema é o
   * elemento mais alto da moldura, e 64px o obrigavam a caber onde o gatilho
   * da conta, de 34px, já ocupava mais da metade. A faixa lia como uma tira
   * de controles com uma logo no canto, não como o cabeçalho da aplicação.
   *
   * 72px continua dentro da janela em que as referências de sistema denso
   * trabalham (60 a 76). É onde a logo de 20px e o nome do sistema em 16
   * ganham 26px de respiro em cima e embaixo — o suficiente para a marca ser
   * a âncora — sem que a faixa roube altura útil de uma tela de listagem.
   * Oito pixels a mais em uma faixa é o preço; a alternativa era encolher a
   * marca, que é justamente o que não se quer. */
  --ucam-appbar-height: 4.5rem;
  /* Quanto o conteúdo grudado precisa descontar da faixa. Com a régua em zero
   * o desconto é a altura da faixa e nada mais — mas a soma FICA escrita,
   * porque quem hospeda o shell com régua própria precisa que a navegação fixa
   * e a faixa continuem concordando. Era esse desacordo que produzia a
   * navegação nascendo 12px por baixo da faixa. */
  --ucam-appbar-offset: calc(var(--ucam-appbar-height) + var(--ucam-gutter));

  /* ------------------------------------------------ cores da faixa --- */
  /* Trocar a faixa inteira é declarar DUAS variáveis:
   *
   *   .ucam-shell { --ucam-appbar-bg: #0F2D25; --ucam-appbar-fg: #FFF }
   *
   * Filete, texto esmaecido e hover saem daí por color-mix. Uma cor nova
   * nunca chega sozinha: chega com os estados. É isso que impede cada sistema
   * de inventar o próprio rgba(255,255,255,.16) — que é exatamente como o
   * parque legado chegou a três faixas diferentes para a mesma universidade.
   *
   * Para os casos comuns há variante pronta: .ucam-appbar--marca,
   * .ucam-appbar--escura, .ucam-appbar--clara.
   *
   * As DERIVADAS (filete, esmaecido, hover, contorno de controle) não moram
   * aqui: moram no próprio .ucam-appbar. O motivo é o modelo de substituição
   * das custom properties — var() é resolvido em tempo de valor computado NO
   * ELEMENTO ONDE A DECLARAÇÃO ESTÁ. Declaradas no shell, elas congelavam o
   * fg do shell, e uma variante que troca --ucam-appbar-fg no .ucam-appbar
   * (que é o que .ucam-appbar--clara faz) não as re-derivava. A prova estava
   * no código: --clara só funcionava porque redeclarava as cinco à mão.
   *
   * O default é a FAIXA CLARA. A tarja de cor institucional resolvia um
   * problema de 2016 — dizer de quem é o sistema quando não havia mais nada
   * dizendo. Hoje a marca aparece na logo, o filete separa, e a cor rende
   * mais como acento do que como plano de fundo de 52px em toda tela. Quem
   * quiser a tarja pede: .ucam-appbar--marca. Para trazer o branco de volta
   * numa tela, a variante existe: .ucam-appbar--clara. */
  /* CINZA, e o mesmo em todo sistema (21/09/2026). A faixa é cromo, não
   * conteúdo: um plano próprio a separa do que se lê, e o filete continua
   * marcando a fronteira. A tinta por sistema saiu daqui — ela dizia de quem
   * era o sistema com 10% de cor, e quem diz isso é a marquinha cheia ao lado
   * do nome. ADR-040 continua de pé: o chão do CONTEÚDO segue branco. */
  --ucam-appbar-bg: var(--ucam-color-surface-subtle);
  --ucam-appbar-fg: var(--ucam-color-text-primary);
  /* A logo institucional, apontada pela página hospedeira:
   *   .ucam-shell { --ucam-appbar-logo: url('/assets/ucam-logo.svg') }
   *
   * O default é um gradiente TRANSPARENTE, não "none". Com "none" não há
   * máscara, e o "background: currentColor" do elemento apareceria como um
   * retângulo branco sólido na faixa de todo app que não declarou a logo. Uma
   * máscara inteiramente transparente recorta tudo: o elemento existe, ocupa o
   * espaço reservado e não pinta nada. */
  --ucam-appbar-logo: linear-gradient(transparent, transparent);
  /* DUAS medidas, e a proporção é a do arquivo: o lockup horizontal tem
   * viewBox 211.2666 x 38.6056, ou seja 5.4724:1. Com "contain", a máscara
   * encolhe até caber na MENOR das duas — então uma caixa fora de proporção
   * desenha a logo menor do que a caixa reservou e deixa vão do lado. Era o
   * caso: 6.5 x 1.15 pedia 5.65:1 e a logo saía com 18,4px de altura dentro
   * de uma caixa de 104px de largura, com 3,3px mortos à direita.
   *
   * 6.85rem x 1.25rem dá 5.48:1 — a proporção do arquivo com 0,15px de sobra,
   * que é o mais perto de exato que rem redondo chega. A logo desenha 20px de
   * altura e a caixa mede o que a logo mede.
   *
   * As duas molduras leem daqui. A testeira do Protocolo tinha as suas
   * próprias (6.6 x 1.25) e por isso a MESMA marca saía com dois tamanhos
   * conforme o arranjo — 18,4px na faixa, 19,3px na testeira. */
  --ucam-appbar-logo-width: 6.85rem;
  --ucam-appbar-logo-height: 1.25rem;
  /* O NOME DO SISTEMA. Também uma medida só para as duas molduras, e pelo
   * mesmo motivo: era 0.9375rem na faixa e 0.8125rem na testeira. Na testeira
   * isso o deixava do TAMANHO EXATO de um item da fileira de seções logo
   * abaixo — "SigFin" pesando o mesmo que "Setores" —, e um cabeçalho em que
   * a assinatura do sistema não vence a navegação dele não tem hierarquia,
   * tem uma lista. 1rem contra os 0.8125rem do item é um degrau que se lê. */
  --ucam-appbar-system-size: 1rem;
  /* Símbolo do rail. Mesma mecânica e mesmo motivo da logo da faixa: máscara
   * transparente por padrão, para que um app que não declarou o símbolo não
   * ganhe um quadrado branco sólido sobre o bordô. */
  --ucam-rail-marca: linear-gradient(transparent, transparent);

  display: grid;
  /* Colunas: só o conteúdo. A navegação entra como coluna a partir de 64rem,
   * na media query mais abaixo. Declarar aqui a coluna da navegação e
   * escondê-la depois deixaria uma faixa vazia em tela estreita. */
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "appbar"
    "main"
    "footer";
  /* A ALTURA ÚTIL, num lugar só.
   *
   * O shell é 100dvh sempre que ele é a página inteira. Quando NÃO é — a
   * página autônoma de um template, que assenta uma faixa de contexto embaixo
   * dele; um app que embute o shell sob uma testeira própria — 100dvh é grande
   * demais pela altura do que está fora, e a página ganha uma rolagem de
   * dezenas de pixels que ninguém pediu.
   *
   * Quem hospeda redeclara --ucam-vh uma vez, no .ucam-shell, e tudo que
   * depende da altura da janela acompanha: o próprio shell e o bloco de lista
   * e detalhe, que promete não rolar a página e só cumpre a promessa se a
   * conta dele partir da mesma altura. Antes o inbox lia 100dvh direto, e
   * cada tela tentava compensar a diferença aumentando o desconto no chute. */
  --ucam-vh: 100dvh;
  /* O shell OCUPA a viewport, não a estica: min-block-size deixa o conteúdo
   * crescer além dela; block-size fixo cortaria. */
  min-block-size: var(--ucam-vh);
  /* O chão da aplicação é a MOLDURA, e por isso lê surface-chrome e não
   * surface-subtle — os dois valiam o mesmo cinza, mas só um deles é o token
   * que descreve este papel. A troca de nome é o que fez a moldura inteira
   * (coluna, chão e lista do inbox) clarear de uma vez quando o token clareou;
   * com surface-subtle aqui, a zebra da tabela teria vindo junto.
   *
   * No claro isto é branco: quem separa moldura de conteúdo é o filete de 1px,
   * não o degrau de tom. No escuro o degrau continua, porque lá a elevação é
   * por luz e filete não a substitui. */
  background: var(--ucam-color-surface-chrome);
}

/* Em tela estreita a régua encolhe junto: 24px de recuo dos dois lados come
 * 12% da linha num aparelho de 390px. */
${abaixo('respiro-completo')} {
  .ucam-shell { --ucam-gutter: var(--ucam-space-inset-md); }
}

/* --------------------------------------------------------- skip-link --- */
/* WCAG 2.4.1. Primeiro elemento focável do documento e, no SIGFIN, a
 * diferença entre alcançar o conteúdo com uma tecla ou com mais de cem.
 *
 * Sai da tela por deslocamento, NUNCA por display:none nem visibility:hidden
 * — os dois tiram o elemento da ordem de foco, e aí o atalho deixa de
 * existir para exatamente quem precisa dele. */

.ucam-skip {
  position: fixed;
  inset-block-start: var(--ucam-space-inset-sm);
  inset-inline-start: var(--ucam-space-inset-sm);
  z-index: var(--ucam-z-skip);
  transform: translateY(calc(-100% - var(--ucam-space-inset-lg)));
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  background: var(--ucam-color-surface-raised);
  color: var(--ucam-color-text-link);
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-control-sm);
  /* SEM SOMBRA em repouso. O link fica 54px acima da janela, mas a sombra de
   * overlay (4 camadas, a maior com 48px de desfoque e 16px de deslocamento)
   * não acompanha o deslocamento para fora: ela vazava para dentro e pintava
   * um borrão cinza no canto superior esquerdo de TODA tela — medido em
   * 10/09/2026 a 4x, sobre a marca. A sombra só existe quando o link existe,
   * que é com o foco nele. */
  box-shadow: none;
  font-size: var(--ucam-typography-action-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  text-decoration: none;
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-skip:focus {
  transform: translateY(0);
  box-shadow: var(--ucam-elevation-overlay);
}

/* ------------------------------------------------------------ appbar --- */
/* Elemento banner. Gruda no topo: em listagem longa a marca, o campus e o
 * sair somem ao rolar — e o campus é justamente o que diz QUAIS dados estão
 * na tela. */

.ucam-appbar {
  grid-area: appbar;
  position: sticky;
  inset-block-start: 0;
  /* z.faixa, e não z.sticky — pela armadilha que sticky + z-index arma: a
   * faixa vira contexto de empilhamento, e os três menus que ela hospeda
   * (campus, sistemas, conta) ficam PRESOS dentro dele. O z.overlay deles só
   * vale entre irmãos da faixa; contra a barra de visão, que também é sticky
   * em 100 e vem depois no DOM, quem decide é a ordem — e a barra ganhava,
   * cobrindo 24 de 36 pontos do menu de campus. Um degrau acima resolve sem
   * tirar a faixa de baixo da navegação sobreposta (200) e do scrim (190). */
  z-index: var(--ucam-z-faixa);
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  /* Altura FIXA, não mínima — e o motivo é um defeito medido, não gosto.
   *
   * Era min-block-size 3.5rem mais padding-block, e dentro dela um chip de
   * campus de 2.75rem: a faixa media 68px enquanto --ucam-appbar-height dizia
   * 56. A navegação fixa gruda em --ucam-appbar-height e mede
   * calc(100dvh - altura), então ela nascia 12px POR BAIXO da faixa e
   * terminava 12px além do fim da janela. Com altura fixa, o número que a
   * navegação lê é o número que a faixa tem. */
  /* Derivadas AQUI, não no shell: assim elas enxergam o --ucam-appbar-fg que
   * estiver valendo NESTE elemento, variante inclusive. É o que torna
   * verdadeira a promessa de "declare bg e fg, o resto vem junto".
   *
   * Duas forças de filete, e a diferença não é estética: --line é limite
   * decorativo (a borda da faixa, o divisor); --control-line contorna
   * CONTROLE, e limite de controle tem piso de 3:1 na WCAG 1.4.11. Com uma
   * régua só, ou o divisor grita ou o contorno do chip reprova. */
  /* 10%, não 24%. Medido: sobre a faixa clara o 24% dava
   * color(srgb .09 .09 .09 / .24) — algo como #C2C2C2 —, um traço mais
   * escuro que a borda de contorno de campo (#D0D0D0). O divisor da faixa
   * era a linha mais forte da tela inteira, e o que ele separa é a moldura do
   * conteúdo, que já se separam por cor de superfície. Continua derivado do
   * fg para acompanhar a variante escura da faixa, onde 10% de branco é o
   * fio certo pelo mesmo raciocínio. */
  --ucam-appbar-line: color-mix(in srgb, var(--ucam-appbar-fg) 10%, transparent);
  /* 20%, e o 48% de antes virou o degrau de HOVER, logo abaixo.
   *
   * Medido: 48% do quase-preto sobre a faixa clara dá algo como #8C8C8C. O
   * contorno do chip de campus e o anel do avatar eram, com isso, os traços
   * mais escuros da tela inteira — mais escuros que a borda do campo onde se
   * digita (#D0D0D0) e que o filete que separa as linhas da tabela. Dois
   * controles de moldura pesando mais que o conteúdo que a moldura serve.
   *
   * A régua nova é a ADR-009, que já vale para botão e campo: em REPOUSO a
   * borda é leve, e a identificação de 3:1 exigida pela WCAG 1.4.11 é
   * carregada por hover e por foco. Não é uma exceção inventada aqui — é a
   * decisão do sistema, aplicada finalmente também à faixa, que era o único
   * lugar que ainda desenhava controle com contorno de 3:1 em repouso.
   *
   * Continua derivado do fg: na faixa escura e na de marca, 20% de branco dá o
   * mesmo peso relativo sem segunda declaração. */
  --ucam-appbar-control-line: color-mix(in srgb, var(--ucam-appbar-fg) 20%, transparent);
  --ucam-appbar-control-line-strong: color-mix(in srgb, var(--ucam-appbar-fg) 48%, transparent);
  --ucam-appbar-muted: color-mix(in srgb, var(--ucam-appbar-fg) 72%, transparent);
  --ucam-appbar-hover: color-mix(in srgb, var(--ucam-appbar-fg) 10%, transparent);

  /* O FUNDO DOS CONTROLES DA FAIXA — busca e campus (ADR-038).
   *
   * Transparentes, os dois herdavam o cinza claro da faixa e só o filete de
   * 20% dizia onde começavam: medido, o campo e a barra tinham o MESMO fundo.
   * Papel é o que o resto do sistema já faz — ver a nota de .ucam-textarea,
   * "o campo é o lugar onde se escreve; ele é papel em qualquer superfície".
   *
   * Papel é token, não branco: no tema escuro ele acompanha a superfície e o
   * controle continua um degrau à frente da faixa em vez de virar um buraco
   * claro. Nas faixas ESCURA e de MARCA volta a transparente: ali o papel
   * seria um retângulo claro cravado na tarja, e a faixa colorida já dá o
   * contraste que faltava na clara. */
  --ucam-appbar-control-bg: var(--ucam-color-surface-default);

  block-size: var(--ucam-appbar-height);
  /* Respiro interno maior que o recuo da régua: a marca precisa de mais ar
   * dentro da barra do que a barra tem contra a borda da tela, senão o lockup
   * encosta no canto arredondado. */
  padding-inline: var(--ucam-space-inset-lg);
  background: var(--ucam-appbar-bg);
  color: var(--ucam-appbar-fg);

  /* A FAIXA NÃO FLUTUA. É uma testeira, e testeira encosta.
   *
   * Ela chegou a ser uma barra recuada das três bordas, com raio de moldura e
   * um degrau de elevação — a mesma gramática do painel de conteúdo, para que
   * as duas peças não parecessem de sistemas diferentes. O que essa simetria
   * custava: um vão de 20px em volta da faixa em toda tela, os cantos de cima
   * arredondados sobre o nada, uma sombra para explicar a flutuação, e o
   * conteúdo começando 20px para dentro de uma janela que ele deveria ocupar.
   *
   * Colada, ela cobra ALTURA e nada mais. O único limite que ela desenha é o
   * fio de baixo, que é o que separa a moldura do conteúdo — e é o mesmo fio
   * de 1px que separa a coluna de navegação do painel, do outro lado.
   *
   * O sticky gruda em ZERO. Não há recuo em que grudar, e é isso que faz a
   * testeira se comportar como testeira ao rolar: ela encosta no alto da
   * janela em vez de deslizar por baixo de uma faixa de chão. */
  margin: 0;
  border: 0;
  border-radius: 0;
  /* O FILETE DO PÉ É SOMBRA INTERNA, NÃO BORDA — e o motivo é meio pixel.
   *
   * Com border-block-end de 1px e caixa de borda, a faixa mede 72 por fora e
   * 71 por dentro. É a caixa de DENTRO que o align-items:center usa, e 71 é
   * ímpar: todo filho de altura par cai em x,5. Medido nesta faixa, de uma
   * vez: a marca em y=25,5, a busca em 19,5, o sino em 21,5 e a conta em
   * 18,5 — quatro dos seis blocos da testeira, cada um com o texto meio pixel
   * fora da grade e o próprio filete de 1px pintado em dois meios-tons.
   *
   * Como sombra interna o fio continua desenhando exatamente onde desenhava,
   * e não consome altura: a caixa de dentro volta a 72, par, e as quatro
   * alturas pares centram em número inteiro (26, 20, 22, 19).
   *
   * A faixa continua sem sombra de elevação — o que existe aqui é um fio. */
  box-shadow: inset 0 -1px 0 0 var(--ucam-color-border-subtle);
  inset-block-start: 0;
}

/* Variantes prontas. Declaradas NO PRÓPRIO .ucam-appbar: custom property
 * resolve primeiro no elemento, então a variante vence o default do shell sem
 * disputa de especificidade. */

/* Faixa clara. É o default; a classe existe para quem quer dizê-lo em voz
 * alta no markup. Repare que agora TODA variante declara duas variáveis e só:
 * filete, esmaecido, hover e contorno de controle se recalculam sozinhos
 * porque as derivadas moram no .ucam-appbar. Antes desta correção esta
 * variante precisava redeclarar as cinco. */
.ucam-appbar--clara {
  --ucam-appbar-bg: var(--ucam-color-surface-default);
  --ucam-appbar-fg: var(--ucam-color-text-primary);
}

/* Faixa escura — sistema que fica aberto o dia inteiro ao lado de outro. */
.ucam-appbar--escura {
  --ucam-appbar-bg: var(--ucam-color-surface-inverse);
  --ucam-appbar-fg: var(--ucam-color-text-on-brand);
  /* Ver a nota do --ucam-appbar-control-bg: papel sobre tarja é buraco. */
  --ucam-appbar-control-bg: transparent;
}

/* Faixa da marca — a tarja bordô do parque legado, para quem ainda a quer.
 * Deixou de ser o default: ver a nota em .ucam-shell. */
.ucam-appbar--marca {
  --ucam-appbar-bg: var(--ucam-color-surface-brand);
  --ucam-appbar-fg: var(--ucam-color-text-on-brand);
  --ucam-appbar-control-bg: transparent;
}

/* O anel de foco da faixa sai do fg, não do token global.
 *
 * Defeito medido: o anel global usa --ucam-color-border-focus, que no tema
 * claro é #BC4657. Sobre a tarja bordô #8D293A isso dá 1,65:1, contra o piso
 * de 3:1 da WCAG 1.4.11 — o foco existia e não aparecia, na faixa inteira e
 * em toda tela. Derivado do fg, o anel acompanha qualquer faixa: 8,4:1 sobre
 * o bordô, e o mesmo raciocínio vale para a clara e a escura. */
.ucam-appbar :focus-visible { outline-color: var(--ucam-appbar-fg); }

/* Marca e nome do sistema. O contrato proíbe repetir a universidade aqui —
 * no SIGFIN "UNIVERSIDADE CANDIDO MENDES" aparece duas vezes na mesma faixa,
 * porque o logo já diz. */
.ucam-appbar__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  color: inherit;
  text-decoration: none;
  border-radius: var(--ucam-radius-control-sm);
}

/* A logo institucional.
 *
 * Entra por mask-image com a URL vinda de fora (--ucam-appbar-logo), e não por
 * <img> nem por url() cravada aqui. Três motivos:
 *   1. o @ucam/css é um arquivo só, sem assets — cravar um caminho amarraria
 *      todo app legado à mesma estrutura de pastas;
 *   2. a marca da UCAM é MONOCROMÁTICA, e o mask devolve o currentColor que um
 *      <img> perderia: a mesma logo serve à faixa bordô e ao tema escuro sem
 *      segunda variante no bundle;
 *   3. são 91 KB de brasão gravado — pesa como imagem, não como marcação.
 *
 * Sem a variável o elemento reserva o espaço e não pinta nada — ver o default
 * declarado em .ucam-shell.
 *
 * É esta regra que dá substância à frase do contrato — "faz três sistemas com
 * aparências diferentes parecerem a mesma universidade". Sem a marca, a faixa
 * unificada é só uma cor. */
.ucam-appbar__logo {
  inline-size: var(--ucam-appbar-logo-width);
  block-size: var(--ucam-appbar-logo-height);
  flex: none;
  background: currentColor;
  -webkit-mask: var(--ucam-appbar-logo) no-repeat left center / contain;
  mask: var(--ucam-appbar-logo) no-repeat left center / contain;
}

/* Filete entre a marca da universidade e o nome do sistema. O nome do sistema
 * é qualificador da marca, não uma segunda marca — o SIGFIN erra isso
 * escrevendo "UNIVERSIDADE CANDIDO MENDES" duas vezes na mesma faixa. */
/* O filete do lockup acompanha a ALTURA DA LOGO, não um valor próprio: ele
 * separa duas peças da mesma assinatura, e um fio mais curto que a marca faz o
 * par parecer desalinhado. */
.ucam-appbar__brand .ucam-appbar__divider {
  block-size: var(--ucam-appbar-logo-height);
  margin-block: 0;
}

.ucam-appbar__system {
  font-size: var(--ucam-appbar-system-size);
  font-weight: var(--ucam-typography-action-font-weight);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* SUBPALETA DO SISTEMA — ADR-037, com a receita refeita em 20/09/2026.
 *
 * Pedido de 19/09: "testar o header + cores no geral da subpaleta de cada
 * sistema". Pedido de 20/09, que refez a conta: "para cada app tenha uma
 * subpaleta especial da main-color, mas as cores semânticas são as mesmas
 * para todos os apps"; "pode usar cores menos saturadas"; "tenha atenção no
 * contraste, em especial nos disabled e estados dos componentes".
 *
 * O QUE MUDOU. A primeira versão misturava a categoria com text-primary aqui
 * mesmo, com color-mix, e resolvia no navegador. Era elegante — virava sozinha
 * no tema escuro, num bloco só — e era imensurável: valor que só existe em
 * tempo de execução nenhum portão confere. E o que havia para conferir não era
 * pouco: color-categoria-financeiro e color-feedback-success-border são o
 * MESMO hex, e color-categoria-academico e color-feedback-info-border também.
 * O primário do SigFin não encostava no verde de sucesso, partia dele.
 *
 * Agora os degraus saem de tools/lib/subpaleta.mjs, em OKLCH, com o croma a
 * 62% do da categoria e a lightness escolhida para ficar a dez pontos de todo
 * tom semântico da mesma família de matiz — o mecanismo da ADR-026, onde girar
 * a matiz foi medido e não rendeu nada. tools/check-subpaleta.mjs mede a mesma
 * função que esta folha emite, e entra no build.
 *
 * O QUE A SUBPALETA NÃO TOCA: feedback, link, disabled, série de gráfico. As
 * cores semânticas são as mesmas em todos os apps, e o portão falha se alguma
 * regra de [data-sistema] declarar uma delas.
 *
 * ?paleta=comum desliga tudo, ?paleta=moldura deixa a cor só na moldura. */
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="academico"]   { --ucam-sistema-cor: var(--ucam-color-categoria-academico); }
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="financeiro"]  { --ucam-sistema-cor: var(--ucam-color-categoria-financeiro); }
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="atendimento"] { --ucam-sistema-cor: var(--ucam-color-categoria-atendimento); }
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="gestao"]      { --ucam-sistema-cor: var(--ucam-color-categoria-gestao); }
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="pessoas"]     { --ucam-sistema-cor: var(--ucam-color-categoria-pessoas); }
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="acervo"]      { --ucam-sistema-cor: var(--ucam-color-categoria-acervo); }

/* ATENDIMENTO não deriva: é a matiz da marca, e o token diz por quê — "o
 * atendimento é a cara da instituição, e leva a marca". A tinta dele é o
 * próprio bordô, como a do Portal. Ver HERDA_MARCA em lib/subpaleta.mjs. */
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema="atendimento"] {
  --ucam-sistema-tinta: var(--ucam-color-action-primary-default);
}

${cssDaSubpaleta(tokensCss)}

/* A FAIXA NÃO É MAIS O "HEADER PRÓPRIO" (21/09/2026).
 *
 * Ela tinha fundo a 10% da cor da categoria e filete a 30%: quatro sistemas com
 * quatro faixas pálidas diferentes, e o Portal — que não declara data-sistema —
 * branco no meio delas. Cinco telas, cinco cromos, para uma informação que a
 * marquinha cheia ao lado do nome já dá sem ambiguidade.
 *
 * Agora a faixa é a mesma em todo sistema (ver --ucam-appbar-bg no bloco do
 * shell) e o que muda ao trocar de sistema é a marquinha, o nome e a família da
 * ação — que é o resto da ADR-037 e continua em teste. */

/* O ITEM ATIVO do menu no modo moldura: no modo cheio ele já vem tinto pela
 * família da ação, aqui precisa de regra própria. Um portador de cor por
 * item — fundo na cor a 9% e o ícone na tinta, como no modo cheio. */
:root[data-paleta="moldura"] .ucam-shell[data-sistema] .ucam-nav__item[aria-current="page"],
:root[data-paleta="moldura"] .ucam-shell[data-sistema] .ucam-nav__item[aria-current="page"]:hover {
  background: color-mix(in oklab, var(--ucam-sistema-cor) 9%, var(--ucam-color-surface-default));
}
:root[data-paleta="moldura"] .ucam-shell[data-sistema] .ucam-nav__item[aria-current="page"] .ic {
  color: var(--ucam-sistema-tinta);
}

/* A marquinha vira o ícone de aplicativo: cheia, na cor do sistema, com o
 * traço na tinta sobre ação. Sai da tinta do SISTEMA e não do primário
 * porque no modo moldura o primário continua bordô — e a marquinha é
 * justamente o que precisa dizer em que sistema se está. */
:root:not([data-paleta="comum"]) .ucam-shell[data-sistema] .ucam-appbar__marca {
  background: var(--ucam-sistema-tinta);
  color: var(--ucam-color-text-on-action);
}

/* A marquinha no degrau do ladrilho do Portal: o nome do sistema é o maior
 * texto da faixa, e o ladrilho de 28px ao lado dele lia como ícone de menu. */
.ucam-appbar__marca { flex: none; }

.ucam-appbar__spacer { margin-inline-start: auto; }

/* ---------------------------------------------- busca global da faixa --- */
/* Contrato: app-shell.json, parte search. Não confundir com nav-search:
 * aquela peneira o menu, esta procura no conteúdo do sistema.
 *
 * A cor sai das derivadas do --ucam-appbar-fg, como o chip de campus — é o
 * que faz o campo funcionar igual na faixa clara e na faixa de marca sem
 * declarar cor duas vezes. Nada aqui reaproveita .ucam-input: a altura, o
 * recuo e o anel de foco são os da faixa, não os do formulário.
 *
 * O FUNDO é papel desde a ADR-038 (--ucam-appbar-control-bg), e a nota antiga
 * que dizia "nem fundo branco" saiu com ela. Transparente, o campo tinha
 * exatamente o mesmo fundo da barra: só o filete de 20% dizia onde ele
 * começava, e numa faixa clara isso é pouco. Papel não é o poço cinza que a
 * revisão de 09/09/2026 tirou de busca, segmented e filtro — o poço era mais
 * ESCURO que a superfície; o papel é mais claro que a faixa, como em todo
 * campo do sistema. */
.ucam-appbar__search {
  /* ÂNCORA do painel de busca global, que é absoluto e da largura do campo.
   * Sem isto ele se ancoraria na faixa e abriria da borda da janela. */
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  /* Teto de largura: campo que se estica até a borda lê como barra de
   * endereço. O flex:1 com dois spacers em volta é o que o centraliza. */
  flex: 1 1 auto;
  max-inline-size: 34rem;
  block-size: var(--ucam-size-control-md);
  padding-inline: var(--ucam-space-inline-sm);
  /* 6%, não o --ucam-appbar-hover (10%): o hover é um estado momentâneo e
   * pode pesar; este preenchimento fica na tela o tempo todo. A 10% o campo
   * lia como caixa cinza-média cravada na faixa em vez de um poço leve. */
  /* Papel e filete. O preenchimento CINZA a 6% saiu e não volta — era o maior
   * bloco cinza da tela, 34rem no meio da faixa. O que entrou no lugar não é
   * um poço: é a superfície de papel, que na faixa clara deixa o campo um
   * degrau à frente da barra. */
  background: var(--ucam-appbar-control-bg, transparent);
  border: 1px solid var(--ucam-appbar-control-line, var(--ucam-color-border-default));
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-appbar-muted);
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-appbar__search:hover { border-color: var(--ucam-appbar-control-line-strong); }

/* O anel de foco mora no CONTÊINER, não no input: o input não tem borda
 * própria, então um anel nele desenharia um retângulo por dentro do campo. */
/* O CAMPO FOCADO se diz por ANEL, não por poço.
 *
 * Ele enchia de cinza a 16% ao receber o foco. Enquanto o campo era só um
 * campo, o poço aparecia por um instante; agora que o foco ABRE o painel de
 * resultados, ele fica na tela durante a busca inteira — o maior bloco cinza
 * da faixa, exatamente no elemento em que se está olhando. É o mesmo poço
 * cinza de campo de busca que já saiu do resto do sistema.
 *
 * O anel é o indicador de foco de sempre, e ele PRECISA existir aqui: o
 * input interno tem outline:none e quem carrega o foco visível é o invólucro.
 * Trocar o poço por nada deixaria o campo sem indicação nenhuma (WCAG 2.4.7).
 * A borda continua reforçando, como no hover. */
.ucam-appbar__search:focus-within {
  border-color: var(--ucam-appbar-control-line-strong);
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

.ucam-appbar__search input {
  flex: 1;
  min-inline-size: 0;
  /* O invólucro mede 32px e o input media 20: sobravam 6px em cima e 6 embaixo
   * onde o clique não focava o campo. Medido no navegador, não deduzido. A
   * altura cheia não muda um pixel do desenho — muda onde o clique pega. */
  align-self: stretch;
  block-size: 100%;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-appbar-fg);
}
.ucam-appbar__search input:focus-visible { outline: none; }
.ucam-appbar__search input::placeholder { color: var(--ucam-appbar-muted); }

/* Abaixo de 64rem a faixa já disputa a linha com o botão de menu e o campus.
 * A busca sai — nessa largura ela é a primeira coisa da tela de conteúdo,
 * não da moldura. */
${abaixo('nav-fixa')} {
  .ucam-appbar__search { display: none; }
}

/* ------------------------------------------------------ tecla (kbd) --- */
/* Atalho desenhado como tecla. aria-hidden na marcação: para quem ouve, o
 * atalho é anunciado por aria-keyshortcuts no campo, e uma sigla solta no
 * meio da leitura só atrapalharia. */
.ucam-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.375rem;
  block-size: 1.375rem;
  padding-inline: 0.25rem;
  /* Era \`1px solid currentColor\` com \`opacity: .75\` no bloco inteiro: uma
   * moldura quase preta em volta de duas letras, dentro de um campo que é um
   * poço claro. A tecla desenhada é o elemento MENOS importante da faixa — um
   * atalho opcional para quem já sabe que ele existe — e era o mais contrastado
   * dela.
   *
   * Agora a tecla é uma pastilha: preenchimento leve, filete no mesmo degrau de
   * repouso do resto da faixa e a tinta esmaecida que o campo já usa. A
   * opacidade sai junto — ela apagava o texto e a borda na mesma medida, sem
   * deixar escolher qual dos dois precisava ceder. */
  /* As cores saem das derivadas da FAIXA porque o uso dominante é dentro dela,
   * e o contrato diz que fora da faixa "a pastilha herda o que o contexto der".
   * Sem o segundo argumento do var() isso não acontecia: variável indefinida
   * invalida a declaração inteira, e a tecla fora da faixa saía sem fundo e sem
   * filete — some, em vez de herdar. O fallback é o que cumpre o que já estava
   * escrito. */
  background: transparent;
  border: 1px solid var(--ucam-appbar-control-line, var(--ucam-color-border-subtle));
  border-radius: var(--ucam-radius-miudo);
  color: var(--ucam-appbar-muted, var(--ucam-color-text-secondary));
  font-family: var(--ucam-font-mono);
  font-size: 0.6875rem;
  line-height: 1;
}

/* Em 360px a faixa transbordava: logo, menu e divisor com flex:none, nome do
 * sistema e chip com nowrap, nada com permissão de encolher. Quem cede é a
 * MARCA — o nome do sistema trunca —, porque o chip de contexto e o usuário
 * carregam informação que muda o significado da tela. */
.ucam-appbar__brand { min-inline-size: 0; }

.ucam-appbar__system {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* A logo encolhe: as DUAS medidas encolhem juntas, senão "contain" volta a
 * desenhar a marca menor que a caixa. 4.5rem / 5.4724 = 0.8223rem. */
${abaixo('faixa-minima')} {
  .ucam-shell {
    --ucam-appbar-logo-width: 4.5rem;
    --ucam-appbar-logo-height: 0.8125rem;
  }
}

/* Filete entre a marca e os demais grupos da faixa. 3,24:1 sobre a faixa,
 * o piso da WCAG 1.4.11 para limite não textual. */
.ucam-appbar__divider {
  inline-size: 1px;
  flex: none;
  align-self: center;
  block-size: 1.25rem;
  background: var(--ucam-appbar-line);
}

/* CAMPUS (ADR-033). É um select de verdade: o mesmo gatilho, o mesmo chevron
 * e a mesma lista dos selects de formulário. Era um chip em pastilha com
 * rótulo esmaecido e um menu de itens radio — um select que não se parecia
 * com nenhum outro select do sistema. Sem opções para trocar, é só texto: um
 * gatilho que abre uma lista de um item promete escolha e não tem. */
.ucam-campus {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  min-inline-size: 0;
}

.ucam-campus__rotulo {
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

.ucam-campus__valor {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

.ucam-campus--faixa {
  flex: 0 1 auto;
  color: var(--ucam-appbar-fg);
}

.ucam-campus--faixa .ucam-select-wrap {
  inline-size: auto;
  min-inline-size: 0;
}

/* Na faixa o select tem a altura do controle da faixa (28px) e a largura do
 * valor. A tinta vem das derivadas da faixa, como o campo de busca vizinho:
 * a mesma peça precisa ler certo na faixa clara, na escura e na de marca. */
.ucam-select--faixa {
  inline-size: auto;
  max-inline-size: 14rem;
  block-size: var(--ucam-size-control-sm);
  line-height: var(--ucam-size-control-sm);
  padding-inline-start: var(--ucam-space-inline-sm);
  /* Sem overflow: hidden — ele recortaria o extensor de alvo de toque que
   * o gatilho recebe no fim da folha. Largura máxima e nowrap bastam. */
  white-space: nowrap;
  background-color: var(--ucam-appbar-control-bg, transparent);
  border-color: var(--ucam-appbar-control-line);
  color: var(--ucam-appbar-fg);
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

.ucam-select--faixa:hover:not(:disabled) {
  background-color: var(--ucam-appbar-hover);
  border-color: var(--ucam-appbar-control-line-strong);
}

.ucam-campus--faixa .ucam-select-wrap::after { background: var(--ucam-appbar-muted); }

/* A lista abre pelo FIM: o select encosta nos ícones da ponta direita, e
 * abrir para a direita jogaria as unidades de nome longo para fora da tela. */
.ucam-campus--faixa .ucam-listbox {
  inset-inline-start: auto;
  inset-inline-end: 0;
  min-inline-size: 12rem;
}

/* A FAIXA EM TELA ESTREITA.
 *
 * Com a marquinha do módulo (ADR-033) a marca mede o ladrilho de 28px e o
 * nome, e é o nome que cede, em reticência. As regras que existiam para o
 * lockup institucional caber — piso da marca na largura da logo, nome do
 * sistema escondido quando havia campus — valem só para a faixa que ainda o
 * leva (.ucam-appbar--lockup, o Portal). */
${abaixo('respiro-completo')} {
  .ucam-appbar--lockup .ucam-appbar__brand { min-inline-size: calc(var(--ucam-appbar-logo-width) + 2 * var(--ucam-space-inline-sm) + 1px); }
  /* O filete entre o campus e os ícones: 9px que decidem se a faixa cabe a 480. */
  .ucam-campus--faixa + .ucam-appbar__divider { display: none; }
}

${abaixo('controle-deitado')} {
  .ucam-appbar--lockup:has(.ucam-campus--faixa) .ucam-appbar__system,
  .ucam-appbar--lockup:has(.ucam-campus--faixa) .ucam-appbar__brand .ucam-appbar__divider { display: none; }
  .ucam-appbar--lockup:has(.ucam-campus--faixa) .ucam-appbar__brand { min-inline-size: var(--ucam-appbar-logo-width); }
}

/* Abaixo de faixa-minima o campus sai da faixa e aparece no cabeçalho da
 * gaveta (.ucam-nav__gaveta-campus): o contexto não some, muda de lugar. */
${abaixo('faixa-minima')} {
  .ucam-campus--faixa,
  .ucam-appbar__divider { display: none; }
}

/* A CONTA — gatilho e menu.
 *
 * O contêiner é o ANCORADOURO do popover: sem \`position: relative\` aqui, o
 * menu absoluto sobe até a faixa e abre alinhado à borda da tela.
 *
 * Isolamento de empilhamento é de propósito. A faixa inteira é sticky com
 * z-index; o menu precisa vencer o conteúdo abaixo dela sem entrar em disputa
 * com o resto da moldura. */
.ucam-appbar__account {
  position: relative;
  flex: none;
}

/* Âncora de menu em qualquer lugar da tela — o botão de reticências do
 * cabeçalho de um registro, a ação de uma linha de tabela. Mesmo papel do
 * __account e do __contexto: sem pai posicionado o painel se ancora no bloco
 * de rolagem e nasce longe do botão que o abriu. */
.ucam-acoes {
  position: relative;
  display: inline-flex;
  flex: none;
}

/* O gatilho. Era um <span> inerte com avatar e nome por extenso ao lado, mais
 * um botão "Sair" solto — três peças fixas na ponta direita de toda tela. Agora
 * é um controle só, do tamanho do avatar. */
.ucam-appbar__user {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  padding: 0.125rem;
  padding-inline-end: 0.25rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ucam-radius-pill);
  color: inherit;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-appbar__user:hover { background: var(--ucam-appbar-hover); }

/* O chevron é a promessa do popover — e aqui, ao contrário do chip de campus,
 * o popover existe. Gira ao abrir: o estado do menu aparece no gatilho, que é
 * onde o olho está quando ele fecha. */
.ucam-appbar__chevron {
  color: var(--ucam-appbar-muted);
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-appbar__user[aria-expanded="true"] {
  background: var(--ucam-appbar-hover);
  border-color: var(--ucam-appbar-control-line);
}

.ucam-appbar__user[aria-expanded="true"] .ucam-appbar__chevron { transform: rotate(180deg); }

/* Abaixo de 30rem o chevron sai e fica o avatar puro: nessa largura a faixa já
 * cedeu o chip de campus, e dois pixels de seta não valem o que custam. */
${abaixo('faixa-minima')} {
  .ucam-appbar__chevron { display: none; }
}

.ucam-appbar__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: var(--ucam-size-control-sm);
  block-size: var(--ucam-size-control-sm);
  background: var(--ucam-appbar-hover);
  border: 1px solid var(--ucam-appbar-control-line);
  border-radius: var(--ucam-radius-pill);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  letter-spacing: 0.01em;
}

/* Botão de menu. Sai da faixa a partir de 64rem, onde a navegação é fixa e
 * não há o que abrir. \`aria-expanded\` é obrigatório pelo contrato. */
.ucam-appbar__menu {
  flex: none;
  block-size: var(--ucam-size-control-sm);
  inline-size: var(--ucam-size-control-sm);
  min-inline-size: var(--ucam-size-control-sm);
  color: inherit;
}

.ucam-appbar__menu:hover:not(:disabled) { background: var(--ucam-appbar-hover); }

/* O botão de recolher a coluna NÃO mora na faixa. Morou por algumas horas em
 * 10/09/2026, antes da marca, e saiu a pedido do usuário: a faixa é da
 * instituição e do sistema, e um controle da coluna na frente da logo lia
 * como parte dela. Ele vive no TOPO da coluna — .ucam-nav__recolher-barra —,
 * desde 11/09/2026, e como hambúrguer. Antes disso morou no pé. */
.ucam-nav__recolher-barra {
  display: none;
  flex: none;
  padding-block: var(--ucam-space-inset-sm) var(--ucam-space-inline-xs);
  padding-inline: calc(var(--ucam-nav-regua) - var(--ucam-space-inset-sm) - 1px);
}

${acima('nav-fixa')} {
  .ucam-nav__recolher-barra { display: flex; }
}

/* Na barra do pé a TINTA do botão fica na régua da coluna, não a caixa: o
 * ícone de 20 centrado num botão de 32 nasce 6px dentro dele, então a caixa
 * recua 7px (12 de recuo do item + 1 de borda − 6) para o glifo cair em x=20,
 * na mesma vertical dos ícones de menu acima. */
.ucam-nav__recolher-barra .ucam-nav__recolher { margin-inline-start: calc(var(--ucam-space-inset-sm) + 1px - 0.375rem); }
.ucam-shell--nav-recolhida .ucam-nav__recolher-barra .ucam-nav__recolher { margin-inline: auto; }

/* ------------------------------------------------- busca global --- */
/* O painel de resultados da busca da faixa.
 *
 * NÃO é a paleta de comando (command.json). Aquela é caixa MODAL, centrada
 * no alto, aberta por Ctrl+K, e leva a telas e ações; esta é um painel
 * ANCORADO no campo que a abriu e procura REGISTRO — e registro se procura
 * sem perder de vista a tela em que se está. As duas superfícies são
 * diferentes porque as duas perguntas são diferentes.
 *
 * Ancorado quer dizer: mesma largura do campo, colado nele, crescendo para
 * baixo. Largura própria faria a caixa saltar da coluna do campo no
 * momento em que abre, e o olho perderia de onde ela veio.
 *
 * A camada é a do popover, e ela vale porque o painel nasce DENTRO da faixa
 * — o mesmo contexto de empilhamento em que os menus de campus, sistemas e
 * conta já convivem. Ver o cabeçalho de z.faixa. */
.ucam-busca {
  position: absolute;
  inset-block-start: calc(100% + var(--ucam-space-inline-xs));
  inset-inline: 0;
  z-index: var(--ucam-z-overlay);
  display: flex;
  flex-direction: column;
  max-block-size: min(28rem, 70vh);
  background: var(--ucam-color-surface-raised);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  box-shadow: var(--ucam-elevation-overlay);
  overflow: hidden;
}

/* Cresce do ALTO, que é onde o campo está — a mesma origem que o menu
 * ancorado no início já usa. */
.ucam-busca:not([hidden]) {
  animation: ucam-surgir var(--ucam-motion-duration-state) var(--ucam-motion-easing-entrance);
  transform-origin: 0 0;
}

/* A FILEIRA DE ESCOPOS. Filtro por tipo, com a contagem do termo corrente.
 *
 * Sem fundo próprio e sem trilho: a mesma regra que tirou o poço cinza do
 * segmented e a pastilha cinza do contador. O que separa a fileira da lista
 * é o filete embaixo dela. */
.ucam-busca__escopos {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ucam-space-inline-xs);
  padding: var(--ucam-space-inset-sm);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-busca__escopo {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  min-block-size: var(--ucam-size-control-sm);
  padding-inline: var(--ucam-space-inline-sm);
  border: 0;
  border-radius: var(--ucam-radius-pill);
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--ucam-motion-duration-state) ease,
              color var(--ucam-motion-duration-state) ease;
}

.ucam-busca__escopo:hover:not(:disabled) {
  background: var(--ucam-color-interaction-hover);
  color: var(--ucam-color-text-primary);
}

/* UM sinal de superfície e UM de tipografia — nada de contorno. */
.ucam-busca__escopo[aria-pressed="true"] {
  background: var(--ucam-color-action-primary-subtle);
  color: var(--ucam-color-action-primary-default);
}

/* Escopo sem resultado fica no lugar, apagado. Sumir a cada tecla faria a
 * fileira dançar debaixo do ponteiro. */
.ucam-busca__escopo:disabled {
  color: var(--ucam-color-text-disabled);
  cursor: default;
}

.ucam-busca__n {
  font-variant-numeric: tabular-nums;
  color: var(--ucam-color-text-placeholder);
}

.ucam-busca__escopo[aria-pressed="true"] .ucam-busca__n { color: inherit; }

.ucam-busca__rolagem {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-block: var(--ucam-space-inline-xs);
  min-block-size: 0;
}

.ucam-busca__grupo[hidden] { display: none; }

.ucam-busca__titulo {
  margin: 0;
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-md) var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  color: var(--ucam-color-text-secondary);
}

.ucam-busca__item {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  inline-size: 100%;
  min-block-size: var(--ucam-size-control-lg);
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-md);
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-primary);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}

.ucam-busca__item[hidden] { display: none; }

.ucam-busca__item .ic {
  flex: none;
  color: var(--ucam-color-text-placeholder);
}

/* O CORRENTE é o mesmo destaque do hover, e de propósito: o teclado e o
 * ponteiro apontam a mesma linha, então apontá-la de dois jeitos diferentes
 * ensinaria que são dois estados. O foco de verdade fica no campo — quem
 * percorre a lista continua digitando. */
.ucam-busca__item:hover,
.ucam-busca__item--corrente {
  background: var(--ucam-color-interaction-hover);
}

.ucam-busca__item--corrente .ic { color: var(--ucam-color-text-secondary); }

.ucam-busca__rotulo {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* O TRECHO QUE CASOU não ganha regra aqui: quem desenha o mark dentro do
 * escopo é o bloco de REALCE (realce.json), e ele já resolveu esta pergunta
 * — preenchimento bordô do degrau 200, spread em vez de padding para o texto
 * não remediar a cada tecla, e peso herdado para o rótulo não dançar. Uma
 * segunda tinta de realce aqui seria o mesmo grifo com duas aparências
 * conforme a lista em que aparece. */

.ucam-busca__meta {
  flex: none;
  max-inline-size: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-busca__vazio {
  margin: 0;
  padding: var(--ucam-space-inset-md);
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
}

/* O RODAPÉ DE TECLAS. Ele existe porque a lista se percorre pelo teclado e
 * nada na tela dizia isso — a mesma falha que o campo cometia ao desenhar
 * uma tecla de atalho que não fazia nada. */
.ucam-busca__rodape {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-md);
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-md);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-busca__rodape > span {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
}

.ucam-busca__folga { flex: 1; }

/* Em tela estreita o painel deixa de ser da largura do campo e passa a ser
 * da largura da janela, com a régua de sempre: um campo de 12rem abriria uma
 * lista de 12rem, e nela nenhum resultado se lê. */
${abaixo('respiro-completo')} {
  .ucam-busca {
    position: fixed;
    inset-inline: var(--ucam-space-inset-md);
    inset-block-start: calc(var(--ucam-appbar-height) + var(--ucam-space-inline-xs));
    max-block-size: 60vh;
  }
  .ucam-busca__rodape { display: none; }
  .ucam-busca__meta { display: none; }
}

/* ------------------------------------------------------------- menu --- */
/* O popover de comandos — o DropdownMenu da base, em CSS puro.
 *
 * Não confundir com \`.ucam-appbar__menu\`, que é o BOTÃO de abrir a navegação.
 * Este é a lista que desce do gatilho da conta.
 *
 * A geometria é a mesma do \`.ucam-listbox\`, e de propósito: um sistema em que
 * a lista do Select e o menu da conta abrem com raios, sombras e recuos
 * diferentes tem dois popovers, não um. O que muda é a SEMÂNTICA — listbox
 * escolhe um valor e marca o escolhido; menu dispara um comando e não marca
 * nada — e é por isso que aqui não há a coluna do check nem \`aria-selected\`.
 *
 * Fecha por \`hidden\`, não por classe: o atributo tira o menu da árvore de
 * acessibilidade e da ordem de tabulação de uma vez, que é justamente o que
 * uma classe \`--aberto\` esquece de fazer. */
.ucam-menu {
  position: absolute;
  z-index: var(--ucam-z-overlay);
  inset-inline-end: 0;
  inset-block-start: calc(100% + 0.5rem);
  min-inline-size: 15rem;
  padding: 0.25rem;
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  box-shadow: var(--ucam-elevation-overlay);
}

.ucam-menu[hidden] { display: none; }

/* No rail o menu SOBE do avatar e abre para dentro da tela: o gatilho está no
 * pé de uma coluna de 72px encostada na borda esquerda, e um popover que
 * descesse dele sairia pela base da janela. O deslocamento de 0.5rem é o mesmo
 * do arranjo da faixa — a distância entre gatilho e popover é uma medida do
 * sistema, não do lado de onde ele sai. */
.ucam-menu--rail {
  inset-inline-start: calc(100% + 0.5rem);
  inset-inline-end: auto;
  inset-block-start: auto;
  inset-block-end: 0;
}

/* A identidade, dentro do menu.
 *
 * Ela existe aqui porque o nome saiu da faixa: alguém que precise conferir com
 * qual conta está logado tem de encontrar isso em algum lugar, e o lugar é o
 * menu que o avatar abre. É \`aria-hidden\` porque o gatilho já anuncia "Conta
 * de Fulano" — sem isso, quem ouve receberia o nome duas vezes seguidas. */
.ucam-menu__conta {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inline-sm);
}

.ucam-menu__identidade {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.ucam-menu__nome {
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-action-font-weight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-menu__meta {
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

.ucam-menu__sep {
  block-size: 1px;
  margin: 0.25rem -0.25rem;
  background: var(--ucam-color-border-subtle);
}

/* O item.
 *
 * "Sair" fica em tinta NEUTRA, não em vermelho. Vermelho é reservado à
 * destruição irreversível (ADR-002) e sair não destrói nada: entra-se de novo.
 * O legado pinta de vermelho tudo que assusta, e é assim que o vermelho para
 * de significar alguma coisa quando aparece num "Excluir" de verdade. */
.ucam-menu__item {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  inline-size: 100%;
  min-block-size: var(--ucam-size-control-sm);
  padding: 0.25rem var(--ucam-space-inline-sm);
  background: none;
  border: 0;
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-primary);
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}

.ucam-menu__item .ic { color: var(--ucam-color-text-secondary); }

.ucam-menu__item:hover,
.ucam-menu__item:focus-visible {
  background: var(--ucam-color-interaction-hover);
  color: var(--ucam-color-text-primary);
}

/* Ação destrutiva dentro do menu. ADR-002: vermelho SÓ para destruição — e é
 * o texto que carrega a cor, não um fundo cheio. Item de menu com fundo
 * vermelho permanente grita antes de ser escolhido e transforma a lista
 * inteira num alerta. */
.ucam-menu__item--perigo,
.ucam-menu__item--perigo .ic { color: var(--ucam-color-feedback-danger-foreground); }

.ucam-menu__item--perigo:hover,
.ucam-menu__item--perigo:focus-visible {
  background: var(--ucam-color-feedback-danger-background);
  color: var(--ucam-color-feedback-danger-foreground);
}

/* Item que ESCOLHE, não que executa — trocar de campus, ordenar por.
 * Contrato menu.json: role=menuitemradio com aria-checked, e a seleção
 * aparece por MARCA, nunca só por cor (WCAG 1.4.1). O espaço à direita é
 * reservado em todos os itens do grupo, não só no marcado: sem isso o rótulo
 * do item escolhido reflowaria ao ganhar a marca. */
.ucam-menu__item[role="menuitemradio"] {
  position: relative;
  padding-inline-end: 2rem;
}

.ucam-menu__item[aria-checked="true"]::after {
  content: '';
  position: absolute;
  inset-inline-end: var(--ucam-space-inline-sm);
  inline-size: 0.875rem;
  block-size: 0.875rem;
  background: var(--ucam-color-action-primary-default);
  -webkit-mask: ${CHECK_MASK} no-repeat center / contain;
  mask: ${CHECK_MASK} no-repeat center / contain;
}

/* --------------------------------------------------------------- nav --- */
/* Navegação primária.
 *
 * ABAIXO de 64rem é painel sobreposto: a aplicação alterna \`data-nav\` no
 * shell, retém o foco e fecha com Esc.
 * A PARTIR de 64rem é coluna da grade, persistente, sem escurecimento e sem
 * retenção de foco. A sobreposição só é modal quando é sobreposição — é a
 * regra do contrato, e o que o drawer do Protocolo viola em 2518px. */

.ucam-nav {
  grid-area: nav;
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  /* A moldura RECUA em relação ao conteúdo — ver surface.chrome na spec.
   * Branco sobre branco fazia a navegação e o painel lerem como a mesma
   * superfície, separados só por um filete de 1px; é o que deixava a tela
   * parecer um documento e não uma aplicação. */
  background: var(--ucam-color-surface-chrome);
  border-inline-end: 1px solid var(--ucam-color-border-subtle);

  /* Modo sobreposto — o padrão, abaixo de 64rem. */
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: var(--ucam-z-nav);
  inline-size: min(var(--ucam-nav-width), 88vw);
  transform: translateX(-102%);
  /* \`visibility\` acompanha o deslocamento de propósito: um painel apenas
   * deslocado continua focável, e o teclado cai dentro de uma navegação que o
   * olho não vê. O atraso segura a visibilidade até o fim da saída. */
  visibility: hidden;
  transition:
    transform var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard),
    visibility 0s linear var(--ucam-motion-duration-reveal);
}

.ucam-shell[data-nav="open"] .ucam-nav {
  transform: translateX(0);
  visibility: visible;
  transition-delay: 0s;
}

/* Escurecimento. Existe SÓ no modo sobreposto — em desktop, escurecer a tela
 * para mostrar a navegação é aplicar padrão de modal à navegação primária. */
.ucam-nav-scrim {
  position: fixed;
  inset: 0;
  z-index: var(--ucam-z-scrim);
  background: color-mix(in srgb, var(--ucam-color-surface-inverse) 55%, transparent);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard),
    visibility 0s linear var(--ucam-motion-duration-reveal);
}

.ucam-shell[data-nav="open"] .ucam-nav-scrim {
  opacity: 1;
  visibility: visible;
  transition-delay: 0s;
}

/* O SELETOR DE SISTEMA, no alto da navegação.
 *
 * 60px de altura — a medida do arquivo de interfaces — e um filete embaixo.
 * Ele existe só na moldura com rail: sem faixa superior, é aqui que o nome do
 * sistema mora, junto do menu que ele governa em vez de numa testeira que
 * atravessa a tela inteira. */
.ucam-nav__sistema {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  block-size: 3.75rem;
  padding-inline: var(--ucam-space-inset-md);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-nav__sistema-nome {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  color: var(--ucam-color-text-primary);
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Busca dentro da navegação. Obrigatória acima de 20 itens — o SIGFIN tem mais
 * de cem e inventou uma "Busca de menus" própria, que é o sistema admitindo o
 * problema. Fica FORA da área de rolagem: buscar num menu longo exige o campo
 * sempre à mão. */
.ucam-nav__search {
  flex: none;
  padding: var(--ucam-space-inset-sm);
  /* O fio por sombra, não por borda: contado no layout ele fazia o bloco medir
   * 57px e empurrava tudo abaixo para meio-pixel (a causa nº 1 da auditoria
   * de pixel — filete de 1px contado na caixa). */
  box-shadow: inset 0 -1px 0 var(--ucam-color-border-subtle);
}

/* A ação primária do MÓDULO, no topo da navegação.
 *
 * Existe porque "Novo requerimento" estava na lista de links, com o mesmo
 * peso de "Pesquisar requerimento" e "Análise" — três itens iguais, e o único
 * deles que CRIA algo indistinguível dos que só navegam. É o mesmo defeito
 * que a evidência do Protocolo registra no botão ("cinza sobre cinza, não se
 * lê como ação"), só que na moldura em vez da tela.
 *
 * Ocupa a largura toda e fica fora da rolagem: a ação de criar não pode
 * depender de onde o menu foi rolado. Uma por módulo — se aparecerem duas, a
 * segunda é navegação disfarçada de ação e volta para a lista. */
/* O MESMO recuo lateral do .ucam-nav__scroll e do .ucam-nav__footer. Era o
 * inset simples, e por isso a ação primária começava 4px à direita de todos
 * os itens da lista logo abaixo — medido: botão em x=12, itens em x=8. Numa
 * coluna estreita, 4px de degrau numa borda vertical se enxergam. */
.ucam-nav__cta {
  flex: none;
  display: flex;
  padding-block-start: var(--ucam-space-inset-sm);
  padding-inline: calc(var(--ucam-nav-regua) - var(--ucam-space-inset-sm) - 1px);
}

/* A AÇÃO PRIMÁRIA ALINHA COM A NAVEGAÇÃO, não com ela mesma.
 *
 * O rótulo vinha centrado — herança do .ucam-btn, onde centrar é certo porque
 * o botão tem a largura do próprio conteúdo. Esticado na largura da coluna, o
 * centro põe o ícone numa vertical que não é a de nenhum outro ícone da
 * barra: os seis itens de menu logo abaixo têm o seu a 20px da borda, e o
 * "+" caía a 92. Uma coluna com sete ícones e seis verticais.
 *
 * O recuo repete a conta do .ucam-nav__item — recuo do item menos a borda de
 * 1px que o botão tem e o item não — para que as duas colunas de ícone sejam
 * a mesma coluna. */
.ucam-nav__cta .ucam-btn {
  inline-size: 100%;
  /* MESMA ALTURA DO ITEM. Ela era a de controle médio, 32px, acima de seis
   * itens de 40 — a peça mais importante da coluna era a mais baixa dela, e
   * o passo vertical mudava logo no primeiro salto. */
  block-size: var(--ucam-size-control-lg);
  justify-content: flex-start;
  /* O recuo é o MESMO do item, sem desconto.
   *
   * O "- 1px" descontava a borda do botão esquecendo que o item também tem
   * uma (transparente, justamente para não deslocar nada). Os dois têm caixa
   * igual, então recuo igual põe os dois ícones na mesma vertical: 8 da
   * coluna + 1 de borda + 12 de recuo = 21px, que é onde os seis ícones de
   * baixo estão. */
  padding-inline-start: var(--ucam-space-inset-sm);
  /* O VÃO TAMBÉM É O DO ITEM.
   *
   * O botão traz o vão de botão (4px) e o item de menu usa o de navegação
   * (8px). Com ícones de tamanhos diferentes por cima disso, o rótulo do
   * "Novo requerimento" começava a 41px da borda enquanto os seis rótulos
   * abaixo começavam a 49 — duas colunas de texto numa barra que tem uma. */
  gap: var(--ucam-space-inline-sm);
}

/* O ÍCONE DO CTA É DA NAVEGAÇÃO, não do botão.
 *
 * A escala por papel manda 16px em todo ícone de botão, e está certa em
 * qualquer barra de ferramentas. Aqui não: este botão é o primeiro item de
 * uma coluna de sete, e os outros seis carregam o degrau de 20. Um "+" de 16
 * no topo de seis ícones de 20, todos na mesma vertical, lê como ícone que
 * não terminou de carregar — e na barra recolhida, onde o rótulo some e só o
 * ícone fica, o quadrado de 40px ficava com um desenho de 16 no meio.
 *
 * É a mesma exceção que o ladrilho já tem no bloco de escala, e pelo mesmo
 * motivo: quem escolhe o degrau é o PAPEL, e o papel deste ícone é ser um
 * item da coluna de navegação. */
.ucam-nav__cta .ucam-btn .ic {
  inline-size: var(--ucam-size-icon-md);
  block-size: var(--ucam-size-icon-md);
}

/* A CALHA DA BARRA DE ROLAGEM É RESERVADA NOS DOIS, e é isso que iguala as
 * larguras. A lista é contêiner de rolagem e o rodapé não; com os itens
 * sangrando de ponta a ponta, essa diferença aparecia como preenchimento de
 * item terminando 10px antes no meio da coluna e indo até a borda no pé
 * (medido: 308 contra 318 numa barra de 318).
 *
 * Reservar pelos DOIS lados, com a mesma propriedade, é o que dá o mesmo
 * número sem ninguém cravar quanto mede uma barra de rolagem — que muda por
 * sistema operacional e por preferência de quem usa. O rodapé nunca rola: o
 * overflow existe ali só para que a reserva se aplique a ele também. */
/* A RÉGUA DA COLUNA é a da faixa e a do corpo: 20px.
 *
 * O recuo era calc(gutter − 12px), e o gutter é ZERO na janela larga — a
 * conta dava negativo, o navegador descartava, e a tinta da coluna caía em
 * x=12/13 (título de grupo, ícone, texto do botão primário) enquanto a logo
 * logo acima está em x=20 e o corpo à direita começa em x=338 = 318 + 20.
 * Medido em 10/09/2026: duas réguas na mesma tela, a 8px uma da outra, e é
 * isso que lê como "desalinhado" sem que se saiba dizer o quê. A coluna passa
 * a ter régua própria e explícita, igual à da faixa; o −1px desconta a borda
 * transparente do item para a TINTA cair em 20, não a caixa. */
.ucam-nav { --ucam-nav-regua: var(--ucam-space-inset-lg); }

.ucam-nav__scroll {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* A BARRA DE ROLAGEM NÃO É DESENHADA, e é isso que dá uma largura só à
   * coluna. Com os itens sangrando de ponta a ponta, os 10px que a barra
   * tirava da lista apareciam como preenchimento terminando antes da borda no
   * meio da coluna e indo até ela no pé — 308 contra 318 na mesma barra.
   *
   * Reservar a calha nos dois lados foi tentado e não fecha: a reserva de um
   * contêiner que não rola não mede o mesmo que a barra que aparece no que
   * rola (308 contra 303). Ocultar fecha, e é o que a navegação lateral de
   * referência faz.
   *
   * A rolagem continua inteira — roda, trackpad, teclado e arrasto. O que sai
   * é o DESENHO dela. Para o menu longo do SIGFIN, quem dá a pista de que há
   * mais coisa abaixo é o item cortado na borda, e quem resolve de verdade é
   * a busca do menu, que existe justamente acima de 20 itens. */
  scrollbar-width: none;
  /* O recuo desconta o padding do PRÓPRIO item para o ícone do menu cair na
   * mesma vertical da marca na faixa. Medir a caixa do item aqui mentiria: o
   * que se alinha é o conteúdo dela. */
  padding-block: var(--ucam-space-inset-sm);
  padding-inline: calc(var(--ucam-nav-regua) - var(--ucam-space-inset-sm) - 1px);
  /* Sem calha reservada. Reservá-la alinharia a lista com ela mesma quando a
   * barra aparecesse, mas desalinharia a lista do RODAPÉ o tempo todo: os
   * dois compartilham recuo, e só um é contêiner de rolagem (medido: item de
   * 292 na lista contra 302 no rodapé, sempre). Sem reserva, as duas larguras
   * só divergem quando a lista de fato transborda — e aí é a própria barra
   * que explica a diferença. */
}

.ucam-nav__scroll::-webkit-scrollbar {
  display: none;
}

.ucam-nav__group + .ucam-nav__group { margin-block-start: var(--ucam-space-stack-md); }

/* Rótulo de grupo. Em caixa alta com tracking, e SÓ aqui: no SIGFIN os mais de
 * cem ITENS estão em caixa alta, o que apaga a distinção entre título de grupo
 * e destino navegável, além de derrubar a velocidade de leitura. */
.ucam-nav__group-title {
  margin: 0 0 var(--ucam-space-inline-xs);
  /* +1px: o item tem borda transparente de 1px e o título não; sem o ajuste o
   * título fica 1px à esquerda do ícone que ele encabeça. */
  padding-inline: calc(var(--ucam-space-inset-sm) + 1px);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ucam-nav__item {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-block-size: var(--ucam-size-control-lg);
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-sm);
  border: 1px solid transparent;
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
  text-decoration: none;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__item + .ucam-nav__item { margin-block-start: 2px; }

/* O hover sobe para a MESMA superfície do item ativo, só que sem filete nem
 * sombra: a linha sob o ponteiro já anuncia o cartão que ela vira ao ser
 * escolhida. O cinza de hover padrão (#F5F5F5) sobre a moldura (#FAFAFA)
 * ficaria a cinco degraus de distância — perceptível no código, não na tela. */
.ucam-nav__item:hover {
  background: var(--ucam-color-interaction-hover);
  color: var(--ucam-color-text-primary);
}

/* Campo dentro da moldura é branco: transparente, ele adotaria o cinza da
 * navegação e deixaria de parecer uma caixa onde se digita. */
.ucam-nav .ucam-input { background: var(--ucam-color-surface-default); }

/* O ITEM ATIVO: preenchimento sólido e tingido, sem contorno.
 *
 * Três desenhos se acumularam aqui — bordô cheio, depois bordô diluído com
 * anel, depois cartão branco com borda, sombra e tarja de 3px. O último
 * empilhava QUATRO sinais visuais no mesmo item (fundo, borda, sombra, tarja)
 * mais o peso da fonte, e o resultado lia como maquete: contorno é o que faz
 * um item de menu parecer desenhado em cima da tela em vez de fazer parte
 * dela.
 *
 * Fica um sinal de superfície, um de tipografia e um de cor: fundo em
 * action.primary.subtle, peso de ação e ícone na marca. O texto continua em
 * text-primary porque sobre o tom diluído do tema escuro (#350D13) o bordô
 * claro não alcança 4,5:1 em 14px.
 *
 * O seletor é "aria-current" de propósito: quem não marcar o atributo não
 * ganha destaque nenhum, e a falha aparece no olho, não só no leitor de tela. */
.ucam-nav__item[aria-current="page"] {
  background: var(--ucam-color-action-primary-subtle);
  border-color: transparent;
  box-shadow: none;
  color: var(--ucam-color-text-primary);
  font-weight: var(--ucam-typography-action-font-weight);
}

.ucam-nav__item[aria-current="page"] .ic { color: var(--ucam-color-action-primary-default); }

/* O item ATIVO não escurece no hover: ele já está no seu tom final, e piscar
 * uma segunda cor sobre a página em que a pessoa já está não informa nada. */
.ucam-nav__item[aria-current="page"]:hover {
  background: var(--ucam-color-action-primary-subtle);
}

/* Contador à direita do item — requerimentos pendentes, por exemplo. */
.ucam-nav__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.25rem;
  margin-inline-start: auto;
  padding-inline: 0.25rem;
  /* Sem pastilha. O número já está no fim da linha, alinhado com os outros,
   * em tinta secundária e algarismo tabular — a cápsula cinza em volta não
   * acrescentava informação e punha uma terceira superfície dentro de um item
   * que já tem a sua quando está ativo. */
  background: transparent;
  border-radius: var(--ucam-radius-pill);
  font-variant-numeric: tabular-nums;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* A BARRA do item aberto.
 *
 * A pastilha sozinha dizia "este item está destacado"; a barra diz "você está
 * AQUI". A diferença aparece quando o menu tem 20 itens e a pastilha cinza
 * some entre os hovers — é o desenho do arquivo de interfaces da UCAM e o de
 * praticamente todo sistema de navegação lateral longa. Inset, não borda: uma
 * borda de 3px empurraria o rótulo 3px para a direita só no item ativo. */
.ucam-nav__item[aria-current="page"] .ic {
  color: var(--ucam-color-action-primary-default);
}

.ucam-nav__item[aria-current="page"] .ucam-nav__count {
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
}

/* ------------------------------------------------- ramo e subitens --- */
/* O sidebar-menu-sub da ZardUI: lista recuada, pendurada num filete vertical.
 *
 * O filete faz o trabalho que o recuo sozinho não faz. Com dez subitens e o
 * pai rolado para fora do campo de visão, uma lista apenas indentada é uma
 * lista de nomes soltos; a linha é o que continua dizendo "estes cinco são
 * daquele ali em cima". É a mesma peça que a base declara como
 * \`border-l border-sidebar-border\`, com os tokens da UCAM. */
.ucam-nav__branch + .ucam-nav__item,
.ucam-nav__item + .ucam-nav__branch,
.ucam-nav__branch + .ucam-nav__branch { margin-block-start: 2px; }

/* O ramo é botão, e botão nasce com fundo, borda e fonte próprios do
 * navegador. Herdar é o que faz ele desenhar igual ao <a> vizinho — um menu em
 * que dois itens da mesma lista têm alturas ou pesos diferentes conforme o
 * elemento HTML é um menu que denuncia a própria implementação. */
.ucam-nav__item--ramo {
  inline-size: 100%;
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  text-align: start;
  cursor: pointer;
}

/* O chevron gira; é o único sinal de aberto/fechado que o ramo carrega, já que
 * ele não é destino e portanto nunca recebe aria-current. \`margin-inline-start:
 * auto\` só entra quando não há contador — com contador, é ele que empurra. */
.ucam-nav__chevron {
  margin-inline-start: auto;
  color: var(--ucam-color-text-secondary);
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__item--ramo .ucam-nav__count + .ucam-nav__chevron { margin-inline-start: 0; }

.ucam-nav__item--ramo[aria-expanded="true"] .ucam-nav__chevron { transform: rotate(180deg); }

.ucam-nav__sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* O recuo alinha o filete com o CENTRO do ícone do pai:
   * padding do item + metade do ícone. Alinhado com a borda do item, a linha
   * cairia no vão entre a coluna de ícones e a de rótulos, sem apontar para
   * nada. */
  margin-block-start: 2px;
  margin-inline-start: calc(var(--ucam-space-inset-sm) + 0.4375rem);
  padding-inline-start: var(--ucam-space-inset-sm);
  border-inline-start: 1px solid var(--ucam-color-border-subtle);
}

.ucam-nav__sub[hidden] { display: none; }

/* ---------------------------------------------- grupo Favoritos --- */
/* O grupo que quem usa monta: telas, filtros salvos e registros fixados.
 *
 * O Attio, o Notion e o Linear têm o mesmo grupo no alto da navegação, e
 * pelo mesmo motivo: num sistema de vinte destinos, os três que uma pessoa
 * abre todo dia são diferentes dos três que outra pessoa abre, e a ordem
 * fixa do menu não serve às duas. O Portal já tinha "Acessos frequentes"
 * como página; aqui é a versão que mora na coluna, sem trocar de tela.
 *
 * O título do grupo é <button aria-expanded>, não <p>: o grupo RECOLHE, e
 * recolher é a única forma de ele não roubar espaço de quem não fixou nada
 * — vazio, ele nem é emitido. O estado vive no aria-expanded e no hidden da
 * lista, pelo mesmo script que abre os ramos (data-ramo). */
.ucam-nav__group-title--recolhivel {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  inline-size: 100%;
  background: none;
  border: 0;
  font: inherit;
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: var(--ucam-radius-control-sm);
  /* ALVO de 24px (WCAG 2.5.8). O botão media 22px, a altura da caixa de linha
   * da caption — reprovava na sonda de alvo em toda tela do Protocolo. A
   * altura mínima cresce sem mexer no texto nem no ritmo do grupo: o 1px extra
   * de cada lado cabe na margem que o título já tinha. */
  min-block-size: 1.5rem;
}

.ucam-nav__group-title--recolhivel .ucam-nav__chevron {
  margin-inline-start: 0;
  inline-size: var(--ucam-size-icon-sm);
  block-size: var(--ucam-size-icon-sm);
}

.ucam-nav__group-title--recolhivel[aria-expanded="true"] .ucam-nav__chevron { transform: rotate(180deg); }

.ucam-nav__fixados { display: flex; flex-direction: column; gap: 2px; }
.ucam-nav__fixados[hidden] { display: none; }

/* O item fixado é um <a> normal com um <button> do lado — nunca um dentro do
 * outro, que é alvo aninhado e HTML inválido. O botão de desfixar senta
 * SOBRE a ponta direita do item, por posição, e só aparece sob o ponteiro ou
 * com foco: em repouso a coluna mostra uma lista de destinos, não uma fileira
 * de estrelas. Cada item leva um portador de cor, e é o ícone do destino. */
.ucam-nav__fixado {
  position: relative;
}

.ucam-nav__fixado > .ucam-nav__item {
  padding-inline-end: var(--ucam-size-control-sm);
}

/* Dois seletores de propósito: o extensor de alvo do fim da folha põe
 * position: relative em todo .ucam-btn, e por ordem venceria uma classe só. */
.ucam-nav__fixado > .ucam-nav__desfixar {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--ucam-space-inline-xs);
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__fixado:hover .ucam-nav__desfixar,
.ucam-nav__fixado:focus-within .ucam-nav__desfixar,
.ucam-nav__desfixar[aria-pressed="true"]:focus-visible {
  opacity: 1;
}

/* Sem ponteiro fino (toque), não há hover que revele o botão: ele fica
 * sempre visível, senão desfixar deixa de existir no celular. */
@media (hover: none) {
  .ucam-nav__desfixar { opacity: 1; }
}


/* O subitem é o item sem ícone: mesma altura de controle não, porque um
 * subitem com 40px de altura empilha cinco vezes e faz a lista do pai custar
 * meia tela. 32px é o degrau que a base usa aqui (h-7/h-8) e o que cabe. */
.ucam-nav__subitem {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-block-size: var(--ucam-size-control-sm);
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-sm);
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
  text-decoration: none;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__subitem:hover {
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
}

/* O subitem ativo NÃO repete o cartão do item de primeiro nível: cartão dentro
 * de cartão desenha duas molduras concorrentes num recuo de 12px. Aqui o
 * estado é tinta cheia, peso e o filete do trecho pintado na cor da marca —
 * que é o que devolve a linha ao seu papel de indicar onde se está. */
.ucam-nav__subitem[aria-current="page"] {
  color: var(--ucam-color-text-primary);
  font-weight: var(--ucam-typography-action-font-weight);
  background: var(--ucam-color-surface-default);
}

/* O RODAPÉ DA NAVEGAÇÃO — o SidebarFooter da base.
 *
 * Fica fora da rolagem porque o que mora aqui não é destino de trabalho:
 * configuração e ajuda são procuradas duas vezes por ano, e no meio da lista
 * competiriam com o que é procurado dez vezes por dia. O menu do SigFin tem
 * mais de cem itens — a ajuda no fim dele é a ajuda inexistente.
 *
 * O recuo lateral é o MESMO do .ucam-nav__scroll, e não o inset simples de
 * antes: sem isso os itens do rodapé nasciam desalinhados dos itens do menu
 * logo acima, na mesma coluna. */
.ucam-nav__footer {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-block: var(--ucam-space-inset-sm);
  padding-inline: calc(var(--ucam-nav-regua) - var(--ucam-space-inset-sm) - 1px);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

/* Modo fixo, a partir de 64rem. A navegação volta a ser coluna da grade e o
 * escurecimento deixa de existir. */
${acima('nav-fixa')} {
  .ucam-shell {
    grid-template-columns: var(--ucam-nav-width) minmax(0, 1fr);
    grid-template-areas:
      "appbar appbar"
      "nav    main"
      "footer footer";
  }

  .ucam-nav {
    position: sticky;
    /* Gruda logo abaixo da faixa e rola por DENTRO: navegação de 19 grupos não
     * pode obrigar a rolar a página inteira para chegar ao fim do menu. */
    inset-block-start: var(--ucam-appbar-offset);
    block-size: calc(100dvh - var(--ucam-appbar-offset));
    inline-size: auto;
    transform: none;
    visibility: visible;
    transition: none;
    /* Fixa, a navegação fica SOBRE o chão da aplicação e não pinta superfície
     * própria: o chão já é a moldura. O FILETE, esse, ela precisa ter.
     *
     * Ele era zero enquanto a moldura recuava de tom — a borda do painel de
     * conteúdo bastava. Com a moldura branca no tema claro, painel e coluna
     * passam a ser a mesma tinta e a borda do painel encosta em branco: sem
     * este filete a coluna e o conteúdo viram uma superfície só, que é
     * exatamente o defeito que o degrau de tom existia para evitar.
     *
     * Sobreposta — abaixo de 64rem — ela continua opaca, porque aí passa por
     * cima do conteúdo e precisa cobri-lo. */
    background: transparent;
    border-inline-end: 1px solid var(--ucam-color-border-subtle);
  }

  /* A navegação FIXA volta ao chão. O 200 é da navegação SOBREPOSTA, que
   * precisa cobrir a faixa e o rail; a partir daqui ela é coluna da grade, e
   * coluna de grade que reivindica a camada de um painel modal passa por cima
   * de tudo que nasce ao lado dela — foi assim que o menu da conta, ancorado
   * no rail, abria por baixo do menu lateral. */
  .ucam-nav { z-index: var(--ucam-z-base); }

  .ucam-nav-scrim,
  .ucam-appbar__menu { display: none; }
}

/* ------------------------------------------------- moldura de TOPO --- */
/* Testeira deitada, conteúdo em largura cheia.
 *
 * A conta que motiva o arranjo, medida na Caixa de entrada do Protocolo a
 * 1440px: rail 72 + navegação lateral 305 = 377px de cromo permanente, 26% da
 * janela, contra um mestre-detalhe que precisa dividir o que sobra entre lista
 * e registro. Deitada, a mesma navegação custa 40px de altura.
 *
 * Duas fileiras com donos diferentes — identidade em cima, seções embaixo.
 * Ver o bloco de comentário de blocoTopo em lib/shell.mjs para o porquê de
 * não ser uma só. */

.ucam-shell--topo {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "appbar"
    "main"
    "footer";
}

.ucam-topbar {
  grid-area: appbar;
  display: flex;
  flex-direction: column;
  background: var(--ucam-color-surface-default);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
  /* A testeira acompanha a rolagem: ela carrega a troca de sistema e a
   * navegação de seção, e as duas precisam existir no fim de uma tabela de
   * 400 linhas tanto quanto no começo. É o que a coluna lateral dava de graça
   * por ser coluna. */
  position: sticky;
  inset-block-start: 0;
  z-index: var(--ucam-z-sticky);
}

/* FILEIRA 1 — identidade e contexto.
 *
 * COLORIDA, e a de baixo não. A decisão de 29/08 tirou a tarja bordô do
 * default com um argumento que continua de pé: 52px de cor institucional em
 * toda tela rendem menos que a mesma cor usada como acento. O que mudou é o
 * que veio antes dela nesta moldura — o rail bordô saiu, e com ele a única
 * superfície onde a marca existia. Uma testeira inteiramente branca deixa o
 * sistema sem assinatura nenhuma.
 *
 * Colorir SÓ a primeira fileira resolve as duas coisas de uma vez. A marca
 * volta a ter superfície, em 48px e não em 88. E a fileira de seções continua
 * sobre o branco, que é onde ela precisa estar por dois motivos concretos:
 *
 *   1. o item ativo é uma pastilha em bordô esmaecido — sobre bordô sólido
 *      ela não teria de onde subir, e o estado ativo dependeria de um segundo
 *      vocabulário só para esta moldura;
 *   2. a ação primária do módulo vive nessa fileira. Botão bordô sobre faixa
 *      bordô é exatamente o defeito que a evidência do Protocolo registra —
 *      "cinza sobre cinza, não se lê como ação" — repetido em outra cor.
 *
 * Ela herda .ucam-appbar pelas VARIÁVEIS; o que se desfaz aqui é a moldura
 * flutuante, que numa testeira de ponta a ponta desenharia uma segunda borda
 * dentro da primeira. */
.ucam-topbar__identidade {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  /* 3.5rem, e não os 3rem de antes.
   *
   * A 48px esta fileira era a mais baixa das três molduras enquanto carrega
   * exatamente o que a faixa carrega — lançador, marca, nome do sistema,
   * busca, campus e conta —, e o gatilho da conta mede 34px sozinho: sete de
   * folga em cima e embaixo. Com a logo em 20px, a marca ficava com 14px de
   * respiro dentro da fileira que é a assinatura do sistema.
   *
   * 56px devolve 11px em volta do gatilho e 18 em volta da marca, e a testeira
   * fecha em 56 + 48 + 1 = 105px, contra os 89 de antes. É mais alta que a
   * faixa de 72 porque são duas fileiras com donos diferentes, e o custo se
   * paga: deitada, esta navegação continua custando uma fração dos 377px que
   * o rail mais a lateral gastavam. */
  block-size: 3.5rem;
  padding-inline: var(--ucam-space-inset-md);
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  inset-block-start: auto;
}

.ucam-appbar__sistemas { position: relative; }

/* O lançador de sistemas. Herdeiro do rail: mesma lista, sem os 72px.
 *
 * Classe de FAIXA, não de testeira: ele mora na .ucam-appbar, e a fileira de
 * identidade da moldura de topo É uma .ucam-appbar. Um nome por moldura seria
 * o mesmo botão declarado duas vezes, e a segunda declaração é a que envelhece
 * — as cinco derivadas de cor abaixo saem todas das variáveis da faixa. */
.ucam-appbar__lancador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--ucam-size-control-sm);
  block-size: var(--ucam-size-control-sm);
  /* Sem margem negativa. Ela existia enquanto o botão era o PRIMEIRO da
   * fileira: puxava a tinta do ícone para a mesma prumada do ícone da fileira
   * de baixo. Na ponta direita não há prumada a acertar — há o avatar ao lado,
   * e um recuo negativo ali só encurtaria o vão entre os dois. */
  flex: none;
  border: 0;
  border-radius: var(--ucam-radius-control);
  background: none;
  color: var(--ucam-appbar-muted);
  cursor: pointer;
}

.ucam-appbar__lancador:hover,
.ucam-appbar__lancador[aria-expanded="true"] {
  background: var(--ucam-appbar-hover);
  color: var(--ucam-appbar-fg);
}

/* ------------------------------------------------------- notificações --- */
/* O sino da faixa reusa o botão do lançador — mesmo alvo, mesma tinta, mesmo
 * hover. O que ele acrescenta é o SELO, e só ele precisa de regra própria.
 *
 * O contêiner existe para ancorar o selo: sem position:relative aqui o
 * absolute do selo subiria até a faixa e o número pousaria em cima da busca.
 */
.ucam-appbar__notificacoes {
  position: relative;
  display: inline-flex;
  flex: none;
}

/* NÚMERO, não ponto.
 *
 * Ponto responde "há algo" e obriga a abrir para saber quanto; o número
 * responde as duas de uma vez, e é a diferença entre abrir a lista porque
 * chegou algo e abrir porque chegaram trinta. Acima de 99 o selo mostra 99+
 * — a cápsula tem 18px e não é onde se lê 1.204 — e o nome acessível, que sai
 * do .ucam-sr-only ao lado, mantém o número exato.
 *
 * A tinta é o bordô da marca, não o vermelho: a ADR-002 reserva vermelho para
 * destruição, e uma contagem não destrói nada. O anel da cor da própria faixa
 * é o que separa a cápsula do ícone sob ela sem precisar de vão — sem ele o
 * selo encosta no traço do sino e os dois viram uma mancha só. */
.ucam-appbar__selo {
  position: absolute;
  inset-block-start: -0.125rem;
  inset-inline-start: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.125rem;
  block-size: 1.125rem;
  padding-inline: 0.25rem;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-action-primary-default);
  color: var(--ucam-color-text-on-brand);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--ucam-appbar-bg);
  pointer-events: none;
}

/* O menu abre SOBRE o conteúdo, não dentro da faixa: por isso ele volta às
 * cores da superfície em vez de herdar a tinta da testeira colorida. */
/* Alinhado pela DIREITA, que é o que a base do .ucam-menu já faz — por isso
 * aqui não há inset-inline. O "inset-inline-start: 0" que morava nesta regra
 * era a exceção do tempo em que o botão ficava na entrada da faixa; mantido
 * na ponta direita, o popover de 15rem abriria para fora da janela. */
.ucam-menu--lancador {
  inset-block-start: calc(100% + 0.25rem);
  color: var(--ucam-color-text-primary);
}

.ucam-menu__titulo {
  margin: 0;
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-sm);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* A LISTA DO SINO.
 *
 * Mais larga que o menu de ações porque o que ela mostra é FRASE e não rótulo:
 * a 15rem do menu padrão cortaria "Rafael Augusto Cordeiro respondeu o
 * requerimento 2026-0311" no meio do nome. E rola, porque o selo pode dizer
 * trinta — e trinta avisos empurrariam o rodapé do popover para fora da
 * janela.
 */
.ucam-menu--notificacoes {
  inline-size: 24rem;
  max-inline-size: calc(100vw - 2rem);
  max-block-size: min(26rem, 70vh);
  overflow-y: auto;
}

/* O aviso ocupa duas linhas e o ícone pertence à PRIMEIRA: centralizado, ele
 * desceria para o meio do parágrafo e deixaria de apontar para o título. */
.ucam-menu--notificacoes .ucam-menu__item { align-items: flex-start; }
.ucam-menu--notificacoes .ucam-menu__item .ic { margin-block-start: 0.125rem; }
.ucam-menu--notificacoes .ucam-menu__nome { white-space: normal; overflow: visible; }

/* Aviso cujo destino não existe neste conjunto continua na lista e não vira
 * link (a mesma regra do menu e da busca). Sem mão e sem realce de hover ele
 * lê como o que é — texto —, mas continua alcançável pela seta, porque some
 * do teclado seria some da lista para quem não usa o ponteiro. */
.ucam-menu--notificacoes span.ucam-menu__item { cursor: default; }
.ucam-menu--notificacoes span.ucam-menu__item:hover { background: none; }

/* A lista vazia DIZ que está vazia. Popover que abre com nada dentro é
 * indistinguível de popover quebrado. */
.ucam-menu__vazio {
  margin: 0;
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-sm) var(--ucam-space-inline-sm);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
}

.ucam-topbar__marca {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-inline-size: 0;
  text-decoration: none;
  color: inherit;
  border-radius: var(--ucam-radius-control);
  /* O conjunto media 20px de altura porque era a altura da logo, e como ele é
   * LINK isso o punha abaixo dos 24×24 da WCAG 2.5.8. Não é texto corrido, e
   * portanto não cai na exceção de alvo embutido em frase. Os 4px entram como
   * altura mínima, não como respiro: a linha de base da marca não se move. */
  min-block-size: 1.5rem;
}

/* A logo institucional entra por máscara e herda a tinta — o mesmo caminho da
 * faixa, pela mesma razão: um <img> perderia o currentColor e obrigaria a
 * cravar o hex uma vez por tema. */
.ucam-topbar__logo {
  inline-size: var(--ucam-appbar-logo-width);
  block-size: var(--ucam-appbar-logo-height);
  flex: none;
  background: currentColor;
  -webkit-mask: var(--ucam-appbar-logo) no-repeat left center / contain;
  mask: var(--ucam-appbar-logo) no-repeat left center / contain;
}

.ucam-topbar__divisor {
  inline-size: 1px;
  block-size: var(--ucam-appbar-logo-height);
  flex: none;
  /* Derivado do fg da faixa, nunca do token global de borda: sobre bordô, um
   * #E4E4E4 cravado some. É a mesma regra que o anel de foco da faixa segue. */
  background: var(--ucam-appbar-control-line);
}

/* As mesmas declarações do .ucam-appbar__system, pela variável: é o mesmo
 * papel em outra moldura, e era aqui que ele estava empatado com o item de
 * navegação da fileira de baixo. Ver --ucam-appbar-system-size. */
.ucam-topbar__sistema {
  font-size: var(--ucam-appbar-system-size);
  font-weight: var(--ucam-typography-action-font-weight);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.ucam-topbar__folga { margin-inline-start: auto; }

/* FILEIRA 2 — as seções deste sistema.
 *
 * A RÉGUA VERTICAL, medida e não estimada. A fileira já teve 32px de altura
 * para pastilhas de 28 — zero em cima, quatro embaixo —, depois 40, e agora
 * 48. A testeira fecha em 56 + 48 + 1 = 105px.
 *
 * O número não é arbitrário: 48 menos a pastilha de 28 dá DEZ de cada lado, e
 * dez é exatamente o respiro que a pastilha já tem por dentro, entre a borda e
 * o rótulo (padding-inline: 0.625rem). A fileira passa a folgar por fora na
 * mesma unidade em que o item folga por dentro, e é isso que faz uma tira
 * parecer desenhada em vez de montada. Aos 40px eram seis por fora contra dez
 * por dentro, e a diferença aparecia como aperto sem que se soubesse nomear. */
.ucam-topnav {
  display: flex;
  align-items: center;
  block-size: 3rem;
  gap: var(--ucam-space-inline-md);
  padding-inline: var(--ucam-space-inset-md);
}

/* Rolagem horizontal existe como ÚLTIMO recurso, para o sistema de vinte
 * seções — não como o arranjo normal. Abaixo de 64rem a fileira inteira sai e
 * a gaveta assume: item escondido por rolagem lateral, no celular, é item que
 * não existe. */
/* O RECUO NEGATIVO É O ALINHAMENTO.
 *
 * As duas fileiras têm o mesmo recuo de 16px, mas o que o olho segue não é a
 * caixa: é a TINTA. A pastilha tem 10px de respiro interno, então o rótulo
 * "Caixa de entrada" começava em 26 enquanto o ícone do lançador, logo acima,
 * começava em 22 — quatro pixels de desencontro numa coluna que o olho lê de
 * cima para baixo em toda tela.
 *
 * Puxar a tira para trás pelo próprio respiro põe o primeiro RÓTULO em 16, e o
 * lançador ganha o mesmo tratamento pelo seu (28px de caixa com ícone de 16
 * dentro: 6 de cada lado). Tinta e tinta na mesma prumada. A pastilha de hover
 * continua sangrando 10px à esquerda do rótulo, que é o comportamento certo —
 * o realce é da área acionável, não do texto. */
.ucam-topnav__scroll {
  display: flex;
  align-items: center;
  gap: 2px;
  min-inline-size: 0;
  margin-inline-start: -0.625rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.ucam-topnav__scroll::-webkit-scrollbar { display: none; }

.ucam-topnav__grupo {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* O filete guarda a única coisa que a lista vertical dava de graça: que
 * "Caixa de entrada" e "Setores" não são irmãos. O TÍTULO do grupo não vem
 * junto — deitado, ele custa mais largura do que informa. */
.ucam-topnav__sep {
  inline-size: 1px;
  block-size: 1.25rem;
  flex: none;
  margin-inline: 0.625rem;
  background: var(--ucam-color-border-subtle);
}

.ucam-topnav__branch { position: relative; }

.ucam-topnav__item {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  block-size: var(--ucam-size-control-sm);
  padding-inline: 0.625rem;
  border: 0;
  border-radius: var(--ucam-radius-control);
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: 1;
  color: var(--ucam-color-text-secondary);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
}

.ucam-topnav__item:hover {
  background: var(--ucam-color-action-secondary-hover);
  color: var(--ucam-color-text-primary);
}

/* O item aberto é uma PASTILHA, não um sublinhado de aba.
 *
 * Sublinhado diria "aba", e aba troca o conteúdo de um mesmo objeto — o que
 * esta fileira faz é trocar de SEÇÃO, que é navegação. A pastilha é o mesmo
 * desenho que o item ativo da navegação lateral usa; deitar a navegação não é
 * motivo para inventar um segundo vocabulário de estado ativo. */
.ucam-topnav__item[aria-current] {
  background: var(--ucam-color-action-primary-subtle);
  color: var(--ucam-color-action-primary-default);
  font-weight: var(--ucam-typography-action-font-weight);
}

/* A contagem da fileira deitada e a da navegação em pé são a MESMA peça e
 * mediam 12px e 18px. Agora as duas leem size.contagem. */
.ucam-topnav__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--ucam-size-contagem);
  block-size: var(--ucam-size-contagem);
  padding-inline: 0.25rem;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-surface-sunken);
  font-size: var(--ucam-typography-caption-font-size);
  font-variant-numeric: tabular-nums;
}

.ucam-topnav__item[aria-current] .ucam-topnav__count {
  background: var(--ucam-color-surface-default);
}

.ucam-topnav__chevron {
  opacity: 0.6;
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-topnav__item[aria-expanded="true"] .ucam-topnav__chevron { transform: rotate(180deg); }

.ucam-topnav__branch .ucam-menu {
  inset-block-start: calc(100% + 0.25rem);
  inset-inline-start: 0;
}

/* A ação primária fica no fim da fileira, presa à direita: ela não é uma
 * seção e não pode rolar junto com elas. */
.ucam-topnav__cta { margin-inline-start: auto; flex: none; }

/* O conteúdo é a SUPERFÍCIE, não um painel flutuante.
 *
 * O painel com raio e sombra tem sentido quando há uma coluna lateral ao lado
 * dele: a moldura precisa de um limite visível. Sob uma testeira que já
 * atravessa a tela, o mesmo painel desenha uma segunda moldura dentro da
 * primeira e devolve de margem a largura que o arranjo foi buscar. */
.ucam-shell--topo > .ucam-main {
  margin: 0;
  padding: var(--ucam-space-inset-lg) var(--ucam-space-inset-xl) var(--ucam-space-inset-xl);
  background: var(--ucam-color-surface-default);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

${abaixo('respiro-completo')} {
  .ucam-shell--topo > .ucam-main {
    padding-inline: var(--ucam-space-inset-md);
  }
}

/* A NAVEGAÇÃO LATERAL NUNCA VIRA COLUNA nesta moldura.
 *
 * A regra de 64rem que promove .ucam-nav a coluna da grade vale para as outras
 * duas molduras, onde a lateral É a navegação. Aqui ela é só a gaveta do
 * celular — e sem esta linha o painel reaparecia em desktop, autoposicionado
 * numa coluna implícita à DIREITA do conteúdo, repetindo deitada e em pé a
 * mesma lista. Foi assim que o primeiro protótipo do arranjo saiu com dois
 * menus na mesma tela.
 *
 * Continua sobreposta em vez de sumir: é ela que o botão de menu abre quando a
 * janela encolhe, e um display:none aqui a tiraria de lá também. */
${acima('nav-fixa')} {
  .ucam-shell--topo .ucam-nav {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: min(var(--ucam-nav-width), 88vw);
    block-size: auto;
    transform: translateX(-102%);
    visibility: hidden;
    background: var(--ucam-color-surface-chrome);
    border-inline-end: 1px solid var(--ucam-color-border-subtle);
    z-index: var(--ucam-z-nav);
  }

  .ucam-shell--topo[data-nav="open"] .ucam-nav {
    transform: translateX(0);
    visibility: visible;
  }

  /* O escurecimento volta a existir: aberta, aqui ela É sobreposição. */
  .ucam-shell--topo .ucam-nav-scrim { display: block; }
}

/* A fileira de seções SAI abaixo de 64rem; a gaveta assume, pelo botão de
 * menu que a primeira fileira já carrega. */
${abaixo('nav-fixa')} {
  .ucam-topnav { display: none; }
  .ucam-topbar__logo { display: none; }
  .ucam-topbar__divisor { display: none; }
}

/* ------------------------------------------- a cabeça da gaveta --- */
/* Existe SÓ no modo sobreposto. Na coluna da grade a faixa já diz o nome do
 * sistema e o painel não precisa fechar — então a cabeça some, e some por
 * completo (display: none), para não gastar a primeira dobra da coluna com
 * um botão que não faz nada ali. Ver cabecaGaveta em lib/shell.mjs. */
.ucam-nav__gaveta {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ucam-space-inline-sm);
  /* Mesma altura da faixa que ela cobre: a marca e o fechar caem na mesma
   * linha em que a marca e o menu estavam, e a troca não salta. */
  block-size: var(--ucam-appbar-height, 4.5rem);
  padding-inline: var(--ucam-space-inset-md) var(--ucam-space-inset-sm);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}
.ucam-nav__gaveta-sistema {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  color: var(--ucam-color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${acima('nav-fixa')} {
  .ucam-nav__gaveta { display: none; }
}

/* A gaveta leva a ASSINATURA da universidade (ADR-033): a faixa dos sistemas
 * passou a abrir com a marquinha do módulo, e a gaveta é um dos lugares em
 * que o lockup continua — com o nome do sistema ao lado, como era na faixa. */
.ucam-nav__gaveta-id {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-inline-size: 0;
}

.ucam-nav__gaveta-marca {
  flex: none;
  inline-size: 4.5rem;
  block-size: 0.8125rem;
  background: currentColor;
  color: var(--ucam-color-text-primary);
  -webkit-mask: var(--ucam-appbar-logo) no-repeat left center / contain;
  mask: var(--ucam-appbar-logo) no-repeat left center / contain;
}

.ucam-nav__gaveta-campus {
  display: none;
  flex: none;
  margin: 0;
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inset-md);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

${abaixo('faixa-minima')} {
  .ucam-nav__gaveta-campus { display: block; }
}

/* ------------------------------------------------- moldura com rail --- */
/* A moldura do arquivo de interfaces da UCAM: rail de módulos, navegação do
 * módulo e conteúdo. SEM faixa superior.
 *
 * O que a faixa carregava foi redistribuído, e cada destino tem razão:
 *   marca      -> o rail inteiro é a marca; o símbolo fica no topo dele.
 *   sistema    -> o seletor no alto da navegação, junto do que ele governa.
 *   usuário    -> o pé do rail: identidade não é navegação e não deve estar
 *                 na sequência que o olho percorre.
 *   busca      -> a barra de filtro da própria listagem, que é onde se busca.
 *
 * O ganho é altura: 64px de faixa somados aos 24 de recuo custavam 88px em
 * TODA tela, e numa listagem isso é uma linha e meia de tabela. O custo é que
 * o contexto de campus perde lugar fixo — está declarado nos limites do
 * contrato do app-shell, não resolvido aqui. */
.ucam-shell--rail {
  grid-template-columns: var(--ucam-rail-width) minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "rail main"
    "rail footer";
}

${acima('nav-fixa')} {
  .ucam-shell--rail {
    grid-template-columns: var(--ucam-rail-width) var(--ucam-nav-width) minmax(0, 1fr);
    grid-template-areas:
      "rail nav main"
      "rail nav footer";
  }

  /* Sem faixa por cima, a navegação gruda no topo da janela e o filete
   * vertical volta a ser dela: não há mais borda de painel para separá-la do
   * conteúdo, porque o conteúdo deixou de ser painel. */
  .ucam-shell--rail .ucam-nav {
    inset-block-start: 0;
    block-size: 100dvh;
    background: var(--ucam-color-surface-default);
    border-inline-end: 1px solid var(--ucam-color-border-subtle);
  }
}

/* O conteúdo deixa de ser painel FLUTUANTE e passa a ser a superfície da
 * aplicação: nesta moldura quem separa é o filete da navegação, e manter o
 * cartão arredondado somaria uma segunda moldura dentro da primeira. É o que
 * devolve os 969px úteis de largura que o Figma mede. */
.ucam-shell--rail > .ucam-main {
  margin: 0;
  padding: 0 var(--ucam-space-inset-xl) var(--ucam-space-inset-lg);
  background: var(--ucam-color-surface-default);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

/* ================================================== destino inexistente === */
/* O item de navegação que AINDA NÃO TEM TELA de referência desenhada.
 *
 * O conjunto de telas é um protótipo navegável: clicar em "Analytics" abre
 * Analytics. Mas o menu do Protocolo tem "Funcionários", e o rail tem
 * "Acadêmico" e "Relatórios" — destinos que existem no sistema real e não
 * neste conjunto. Três saídas eram possíveis e duas são piores:
 *
 *   tirar o item      — o menu passaria a mentir sobre o tamanho do sistema,
 *                       e o arranjo que a tela existe para provar depende de
 *                       o menu ter a densidade que tem;
 *   href="#"          — clicar recarrega a mesma página. É o que havia antes
 *                       e o que faz o protótipo parecer quebrado em vez de
 *                       incompleto;
 *   dizer a verdade   — o item continua na lista, na mesma ordem e com o
 *                       mesmo peso de leitura, esmaecido e sem cursor de
 *                       link. Não é um estado desabilitado (o destino não
 *                       está bloqueado, ele não foi desenhado): por isso
 *                       aria-disabled e não [disabled], e por isso continua
 *                       lido pelo leitor de tela, com o title explicando.
 *
 * O esmaecido é discreto de propósito. Marcar em vermelho o que falta faria o
 * menu inteiro parecer um relatório de erros. */
[data-sem-tela] {
  color: var(--ucam-color-text-disabled);
  cursor: default;
}

/* O hover herdado dos irmãos prometia clique. Sai — e é a única coisa que
 * sai: fundo, alinhamento e altura do item continuam idênticos, porque o item
 * continua sendo um item da lista. */
.ucam-nav__item[data-sem-tela]:hover,
.ucam-nav__subitem[data-sem-tela]:hover,
.ucam-topnav__item[data-sem-tela]:hover,
.ucam-menu__item[data-sem-tela]:hover,
.ucam-rail__item[data-sem-tela]:hover {
  background: none;
  color: var(--ucam-color-text-disabled);
}

[data-sem-tela] .ic { opacity: 0.55; }

/* ====================================================== nav recolhida === */
/* A navegação do módulo encolhida a uma coluna de ÍCONES.
 *
 * Por que ela existe: a moldura com rail já tem duas colunas fixas — 72px de
 * troca de módulo mais 318px de navegação dentro do módulo — e são 390px
 * antes de qualquer dado. Num notebook de 1366 isso é 29% da largura gasta em
 * cromo permanente. Nas telas em que o trabalho é largo (a tabela de
 * naturezas tem seis colunas, a caixa de entrada é lista mais detalhe) quem
 * usa o sistema o dia inteiro já sabe onde estão os destinos e não precisa
 * lê-los; precisa da largura.
 *
 * Recolhida, a navegação fica em 56px e devolve 262px ao conteúdo, sem
 * desaparecer: os destinos continuam todos na tela, na mesma ordem e na mesma
 * vertical de sempre. É a diferença entre recolher e esconder atrás de um
 * botão de menu — o segundo custa um clique para descobrir onde se está.
 *
 * 56px e não 72: o rail ao lado tem 72, e duas colunas de ícones da mesma
 * largura leem como uma coluna só de 144px partida por um filete. O degrau
 * entre elas é o que diz que são camadas diferentes de navegação. */
/* TUDO ABAIXO SÓ VALE A PARTIR DE 64rem — onde a coluna É coluna.
 *
 * A preferência de recolher persiste em localStorage, e a classe volta em toda
 * página. Abaixo de 64rem a mesma classe encontrava uma navegação que já não é
 * coluna e sim GAVETA sobreposta: --ucam-nav-width caía para 3.5rem, o painel
 * abria com 56px e os rótulos continuavam recortados. Ou seja, quem recolheu a
 * navegação no monitor e depois estreitou a janela — ou abriu a mesma URL no
 * celular — recebia uma gaveta de ícones sem nome, aberta por um botão de menu
 * que prometia justamente a lista com rótulos.
 *
 * O botão de recolher já some abaixo de 64rem por conta própria; faltava o
 * ESTADO sumir junto. Recolher só significa alguma coisa onde há largura para
 * devolver. */
${acima('nav-fixa')} {
.ucam-shell--nav-recolhida { --ucam-nav-width: 3.5rem; }

/* O RÓTULO SAI DA VISTA, NÃO DA ÁRVORE.
 *
 * display:none tiraria o texto do nome acessível e o item viraria um link sem
 * nome — o defeito de acessibilidade mais comum de menu recolhido, e o mesmo
 * que os botões de ícone do Protocolo já têm hoje. O recorte de 1px mantém o
 * texto no DOM: o leitor de tela continua anunciando "Caixa de entrada", e a
 * contagem, que também está dentro do link, continua entrando no anúncio.
 *
 * É a mesma técnica do .ucam-sr-only, aplicada por contexto em vez de por
 * classe — a marcação não muda entre os dois estados, então não há como uma
 * tela recolher a navegação e esquecer de trocar as classes. */
.ucam-shell--nav-recolhida .ucam-nav__item > span:not(.ucam-nav__count),
.ucam-shell--nav-recolhida .ucam-nav__cta .ucam-btn > span,
.ucam-shell--nav-recolhida .ucam-nav__sistema-nome,
.ucam-shell--nav-recolhida .ucam-nav__group-title {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Os itens viram quadrados centrados. O alvo continua com 40px — recolher a
 * navegação não pode encolher o alvo de ponteiro (WCAG 2.5.8).
 *
 * A LARGURA É DECLARADA, não herdada. Com só a altura fixada, o item ficava
 * com a largura que sobrasse do recipiente, e sobrava coisa diferente em cada
 * um: 38px na lista rolável, 40px no rodapé e 40px na ação primária — três
 * larguras, e com elas DUAS colunas de ícone na mesma barra de 56px (centro
 * em 23 e em 28). Medido, não estimado. Um quadrado que depende do pai não é
 * um quadrado; é o que sobrou.
 *
 * Com inline-size + margin-inline:auto os três viram o mesmo quadrado de 40,
 * centrados na mesma vertical, e continuam assim se a barra de rolagem
 * aparecer. */
.ucam-shell--nav-recolhida .ucam-nav__item,
.ucam-shell--nav-recolhida .ucam-nav__cta .ucam-btn {
  position: relative;
  justify-content: center;
  padding-inline: 0;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  margin-inline: auto;
}

/* Recuo ZERO na lista recolhida: o item já tem largura própria de 40px e se
 * centra sozinho na barra de 56. Com os 4px de recuo aqui, a conta do centro
 * passava a ser feita dentro de 48px e não de 56, e a coluna de ícones da
 * lista caía em 24 enquanto a da ação primária e a do rodapé — que não têm
 * este recuo — caíam em 28. Duas colunas de ícone numa barra que só tem uma
 * coluna de largura. */
.ucam-shell--nav-recolhida .ucam-nav__scroll {
  padding-inline: 0;
  /* A BARRA DE ROLAGEM SOME, e é ela que estava desalinhando a coluna: 10px
   * de barra dentro de 56px de rail deixam 46 para centrar um quadrado de 40,
   * e o ícone da lista caía em 23 enquanto o da ação primária e o do rodapé
   * caíam em 28. Aqui a rolagem continua existindo por roda e por teclado; o
   * que sai é o desenho dela, que numa coluna de ícones custa 18% da largura
   * para indicar o que seis ícones empilhados já mostram. */
  scrollbar-width: none;
}

.ucam-shell--nav-recolhida .ucam-nav__scroll::-webkit-scrollbar {
  display: none;
}

.ucam-shell--nav-recolhida .ucam-nav__sistema {
  justify-content: center;
  padding-inline: 0;
}

/* A CONTAGEM VIRA PONTO.
 *
 * "4" não cabe ao lado de um ícone em 56px, e encolher o número até caber o
 * tornaria ilegível. O ponto diz que HÁ pendência — que é a informação que
 * faz alguém abrir aquele destino — e o número continua no nome acessível do
 * link, além de voltar inteiro assim que a navegação se expande. */
.ucam-shell--nav-recolhida .ucam-nav__count {
  position: absolute;
  inset-block-start: 0.375rem;
  inset-inline-end: 0.5rem;
  min-inline-size: 0.5rem;
  block-size: 0.5rem;
  padding: 0;
  margin: 0;
  overflow: hidden;
  text-indent: 100%;
  background: var(--ucam-color-action-primary-default);
  border: 2px solid var(--ucam-color-surface-chrome);
  border-radius: var(--ucam-radius-pill);
}

/* O grupo perde o título e ganha um filete: sem um nem outro, os quatro
 * grupos do Protocolo viram uma coluna única de dezoito ícones. */
.ucam-shell--nav-recolhida .ucam-nav__group + .ucam-nav__group {
  margin-block-start: var(--ucam-space-inline-sm);
  padding-block-start: var(--ucam-space-inline-sm);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

/* Busca e subitens NÃO sobrevivem a 56px, e fingir que sim seria pior: um
 * campo de busca de 40px não cabe uma palavra, e uma lista recuada sem o pai
 * visível é uma lista de nomes soltos. Ambos voltam ao expandir — e é por
 * isso que o botão de recolher tem de estar sempre à mão. Está declarado nos
 * limites do contrato do app-shell. */
.ucam-shell--nav-recolhida .ucam-nav__search,
.ucam-shell--nav-recolhida .ucam-nav__sub,
.ucam-shell--nav-recolhida .ucam-nav__chevron { display: none; }

/* No trilho, o favorito é SÓ o destino. O botão de desfixar senta sobre a
 * ponta direita do item e, com 40px de item, a ponta direita É o ícone: sob
 * o ponteiro a estrela aparecia por cima do desenho do destino e o apagava —
 * medido em 10/09/2026, botão de 32×28 sobre o ícone de 40×40. Desfixar é
 * gesto da coluna aberta; o trilho não tem largura para dois alvos. */
.ucam-shell--nav-recolhida .ucam-nav__desfixar { display: none; }
.ucam-shell--nav-recolhida .ucam-nav__fixado > .ucam-nav__item { padding-inline-end: 0; }

/* --------------------------- a identidade da coluna, recolhida --------- */
/* O arranjo lateral pôs marca, campus, busca global e conta DENTRO da coluna
 * — e a coluna recolhe a 3,5rem. Sem estas regras, cada uma quebrava de um
 * jeito: o lockup saía cortado ao meio (ele mede 6,85rem e a barra passa a
 * medir 3,5), o campus virava "Ca…", a busca virava as duas teclas do atalho
 * espremidas, e o menu da conta nascia com 56px de largura porque estava
 * preso às bordas da coluna.
 *
 * A regra que faltava é a mesma que o resto da coluna já seguia: recolhido,
 * sobra o ÍCONE e o nome acessível continua no aria-label. O que não tem
 * ícone — o lockup, o campo de busca — sai de cena, como .ucam-nav__search já
 * saía. Não é caso de canto: o botão que recolhe mora na própria fileira da
 * marca, a um clique de distância em toda tela. */
.ucam-shell--nav-recolhida .ucam-nav__brand,
.ucam-shell--nav-recolhida .ucam-nav__busca,
.ucam-shell--nav-recolhida .ucam-campus--nav,
.ucam-shell--nav-recolhida .ucam-nav__conta-identidade,
.ucam-shell--nav-recolhida .ucam-nav__conta-chevron { display: none; }

/* Lançador e recolher EMPILHAM: dois botões de 28px não cabem lado a lado em
 * 56px menos o respiro, e espremê-los era o que fazia a fileira transbordar. */
.ucam-shell--nav-recolhida .ucam-nav__marca {
  flex-direction: column;
  block-size: auto;
  gap: var(--ucam-space-inline-xs);
  padding: var(--ucam-space-inline-xs) 0;
}

.ucam-shell--nav-recolhida .ucam-nav__contexto,
.ucam-shell--nav-recolhida .ucam-nav__conta { padding-inline: 0; }

.ucam-shell--nav-recolhida .ucam-nav__conta-gatilho {
  inline-size: 2.5rem;
  justify-content: center;
  padding-inline: 0;
  margin-inline: auto;
}

/* Os dois popovers da coluna deixam de ser presos às bordas dela e voltam a
 * ter largura própria, abrindo PARA DENTRO da tela. Ancorados na coluna, um
 * menu de unidades nasceria com 56px de largura — o gatilho encolheu, a lista
 * de nomes não. */
.ucam-shell--nav-recolhida .ucam-menu--conta-nav,
.ucam-shell--nav-recolhida .ucam-nav__contexto .ucam-menu {
  inset-inline-start: calc(100% - var(--ucam-space-inset-sm));
  inset-inline-end: auto;
  min-inline-size: 15rem;
}
}

/* O BOTÃO DE RECOLHER.
 *
 * Dois endereços, um por moldura, e a razão é quem já ocupa o alto da coluna.
 * Com o rail, o alto é a fileira do nome do sistema e ele fica lá — recolhida,
 * é a única fileira que sobra com largura para ele. Com a faixa, o nome do
 * sistema está na marca e essa fileira não existe: o botão desce para a barra
 * do pé, junto de configuração e ajuda, em vez de flutuar sozinho sobre o vazio
 * acima da ação primária.
 *
 * Some abaixo de 64rem nos dois casos: lá a navegação já é painel sobreposto e
 * recolher não significa nada. */
.ucam-nav__recolher {
  flex: none;
  display: none;
  align-items: center;
  justify-content: center;
  inline-size: 2rem;
  block-size: 2rem;
  margin-inline-start: auto;
  padding: 0;
  border: 0;
  border-radius: var(--ucam-radius-control-sm);
  background: none;
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) ease,
              color var(--ucam-motion-duration-state) ease;
}

.ucam-nav__recolher:hover {
  background: var(--ucam-color-surface-subtle);
  color: var(--ucam-color-text-primary);
}

${acima('nav-fixa')} {
  .ucam-nav__recolher { display: inline-flex; }
}

.ucam-shell--nav-recolhida .ucam-nav__recolher {
  margin-inline: auto;
}

/* SEM GIRO desde 11/09/2026. O desenho era um par de setas que apontava para
 * onde a ação levava, e por isso girava 180° com a coluna recolhida. Virou
 * hambúrguer, que não aponta para lugar nenhum: o mesmo desenho abre e fecha,
 * como em todo sistema que o usa, e o estado é o aria-expanded. */

/* A transição é da LARGURA da coluna, e roda no shell porque é ele que tem a
 * grade. Respeitando quem pediu menos movimento. */
@media (prefers-reduced-motion: no-preference) {
  .ucam-shell--rail { transition: grid-template-columns var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard); }
}

/* Sistema sem navegação lateral — login, tela de erro, impressão. O shell
 * continua valendo: skip-link, faixa, main e rodapé. */
.ucam-shell--sem-nav > .ucam-nav,
.ucam-shell--sem-nav > .ucam-nav-scrim { display: none; }

${acima('nav-fixa')} {
  .ucam-shell--sem-nav {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "appbar"
      "main"
      "footer";
  }
}

/* -------------------------------------------------------------- main --- */
/* Alvo do skip-link. \`tabindex="-1"\` no elemento é obrigatório: sem ele o foco
 * não pousa no destino e o atalho move só a rolagem, deixando o teclado onde
 * estava — que é a falha mais comum de skip-link implementado pela metade. */

/* O conteúdo é um PAINEL sobre o chão da aplicação, não uma área solta.
 *
 * É o arranjo que as interfaces de referência usam: casca discreta em volta,
 * superfície branca com raio e filete carregando o trabalho. Ele resolve de
 * uma vez duas coisas que a versão anterior tinha: o conteúdo não tinha
 * limite visível à esquerda além do filete da navegação, e a página terminava
 * numa borda dura contra o rodapé. */
/* O PAINEL DE CONTEÚDO ENCOSTA, e não paga recuo interno.
 *
 * Duas mudanças, e a segunda é a que importa. A margem, a borda, o raio e a
 * sombra saem juntas — modificador que apaga uma superfície tem de apagar
 * todas as propriedades que a desenham, que é a regra que .ucam-main--centrado
 * já seguia. E o PADDING sai também: a barra de visão precisa atravessar o
 * painel de ponta a ponta para que o fio embaixo dela seja uma linha inteira,
 * e não um traço com 20px de branco de cada lado.
 *
 * Quem paga o recuo agora é o .ucam-corpo, logo abaixo da barra. É por isso
 * que o painel virou coluna flex: o corpo recebe a altura que sobra sem
 * ninguém calcular quanto é. */
.ucam-main {
  grid-area: main;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
  /* O CHÃO do conteúdo, BRANCO desde 19/09/2026 (ADR-040). Ele foi cinza claro
   * frio por cinco dias (ADR-034) e voltou ao branco a pedido: um chão cinza
   * com cartão, tabela e indicador brancos por cima é o poço cinza que card,
   * selo e filtro já tinham expulsado — o mesmo argumento que deixou a moldura
   * branca em 10/09. Quem separa superfície de chão volta a ser o FILETE de
   * border.subtle, que cartão, stat, painel de apoio e barra de visão já
   * carregam. No escuro surface.chao segue no 800 que o painel sempre teve:
   * lá a separação é de LUZ, e filete não a substitui. */
  background: var(--ucam-color-surface-chao);
  border: 0;
  border-radius: 0;
  /* Sem sombra: o painel não levita de chão nenhum — ele É o chão, e quem
   * sobe dele são as superfícies de dentro, por tom e filete. */
  box-shadow: none;
}

/* O contêiner de conteúdo herda a coluna, senão um bloco de altura cheia —
 * lista e detalhe, tabela que rola por dentro — volta a depender de altura
 * declarada. */
.ucam-main > .ucam-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-block-size: 0;
}

.ucam-main:focus { outline: none; }

/* O contêiner de conteúdo.
 *
 * O legado põe tudo num container estreito centralizado que deixa metade de um
 * monitor largo vazio. O teto aqui é generoso e, mais importante, é uma
 * VARIÁVEL: a tabela larga levanta o teto sem sair do padrão. */
.ucam-content {
  inline-size: 100%;
  max-inline-size: var(--ucam-content-max);
  margin-inline: auto;
}

/* Tabela larga, painel de comparação, dashboard: usa o monitor inteiro. */
.ucam-content--larga { --ucam-content-max: none; }

/* Formulário e texto corrido: linha longa demais custa a leitura tanto quanto
 * a coluna estreita demais. */
.ucam-content--estreita { --ucam-content-max: 48rem; }

/* O PAINEL ACOMPANHA A COLUNA quando ela é estreita.
 *
 * Medido na tela de cálculo de mensalidade a 1440px: a coluna pede 48rem e o
 * painel continuava com os 1080 do vão inteiro, então sobravam 155px de branco
 * de cada lado — branco do painel sobre branco do conteúdo, sem nada entre os
 * dois. O painel existe para ser o CHÃO do conteúdo; chão que passa três dedos
 * além do que sustenta é moldura vazia, e é o mesmo defeito que
 * .ucam-main--centrado já corrige apagando o painel de vez.
 *
 * Aqui ele não some, encolhe: a diferença é que uma tela estreita de texto
 * corrido continua tendo superfície embaixo, e uma de tarefa única não precisa.
 * O recuo interno entra na conta porque é ele que separa o texto da borda.
 *
 * ENCOSTADO À ESQUERDA, e não centrado no que sobra. Com a coluna de navegação
 * fixa ao lado, centrar o painel move a borda esquerda do conteúdo a cada
 * troca de tela: sair de "Movimento de caixa" para "Cálculo individual"
 * deslocaria o título 265px para a direita sem que nada na navegação mudasse.
 * A prumada da esquerda é a única referência estável que a coluna oferece. */
.ucam-main:not(.ucam-main--centrado):has(> .ucam-content--estreita) {
  max-inline-size: calc(48rem + 2 * var(--ucam-space-inset-lg));
  margin-inline-end: auto;
}

/* Tela de tarefa única: login, confirmação, recuperação de senha. Não é a
   largura de leitura reduzida — é outra medida, a do formulário curto, onde
   a linha do campo deve caber no foco central da visão. */
.ucam-content--foco { --ucam-content-max: 25rem; }

/* PLENO: o conteúdo É o arranjo da moldura, e alcança a borda dela.
 *
 * Não é uma largura de leitura como as outras quatro — é a ausência de teto
 * SOMADA à ausência de recuo, e existe para um caso só: a tela cujo conteúdo
 * são duas colunas que precisam encostar no raio do painel. Hoje, a entrada.
 *
 * O recuo e o clipe moram no MAIN, alcançados por :has(), pela mesma razão
 * que .ucam-content--estreita já faz isso: quem tem a régua e o raio é o
 * painel, não o contêiner dentro dele. Anular o recuo por margem negativa no
 * filho deixaria o raio de 16px cortando um retângulo de canto vivo.
 *
 * O overflow: hidden é o que faz a coluna bordô da entrada terminar no canto
 * arredondado em vez de vazar por baixo dele. Ele fica preso ao :has() e não
 * alcança tela nenhuma que não peça pleno — o que importa porque main com
 * overflow recortaria qualquer coisa grudada por sticky. */
.ucam-content--pleno { --ucam-content-max: none; block-size: 100%; }

.ucam-main:has(> .ucam-content--pleno) {
  padding: 0;
  overflow: hidden;
}

/* Tela de foco único — login, erro, confirmação. Centraliza no eixo do bloco
 * em vez de colar no topo. */
/* Tela de foco único — login, erro, confirmação. Aqui o painel SAI: o cartão
 * central já é a superfície, e painel dentro de painel viraria moldura dupla
 * em volta de um formulário de dois campos. */
/* Tela de tarefa única — login, confirmação, erro. O painel some e o cartão
 * fica sozinho sobre o chão da aplicação.
 *
 * box-shadow: none entrou junto com a sombra que o .ucam-main passou a ter:
 * este modificador já zerava fundo e borda, e sem zerar a sombra o painel
 * vazio voltou a existir como um retângulo elevado de 800px de altura em
 * volta de um cartão de 480. Regra: modificador que APAGA uma superfície tem
 * de apagar as três propriedades que a desenham — fundo, borda e elevação. */
.ucam-main--centrado {
  display: grid;
  place-items: center;
  align-content: center;
  background: none;
  border: 0;
  box-shadow: none;
  padding: var(--ucam-space-inset-lg);
}

/* ------------------------------------------------------------ rodapé --- */
/* Opcional. E, quando existe, NÃO carrega faixa amarela recomendando
 * navegador — em 2026 isso é ruído, não informação. */

/* Sem filete no topo: o rodapé fica no chão da aplicação, fora do painel, e
 * a borda do painel já é o limite do conteúdo. Uma linha aqui atravessaria a
 * tela a 24px de outra linha. */
.ucam-shell__footer {
  grid-area: footer;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-md);
  padding: 0 var(--ucam-gutter) var(--ucam-gutter);
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
}

/* A assinatura no chão da aplicação (ADR-033), quando a faixa leva a
 * marquinha do módulo e não o lockup: a universidade aparece uma vez por tela.
 * role=img com nome, porque aqui ela substitui o texto que o rodapé dizia. */
.ucam-shell__footer-marca {
  flex: none;
  inline-size: 5.5rem;
  block-size: 1rem;
  background: currentColor;
  -webkit-mask: var(--ucam-appbar-logo) no-repeat left center / contain;
  mask: var(--ucam-appbar-logo) no-repeat left center / contain;
}

/* ==================================================== BLOCOS DE LAYOUT === */
/* Contrato: spec/layouts.json.
 *
 * Cinco arranjos que aparecem em toda tela do parque. Existem como bloco
 * nomeado porque a alternativa está escrita nos templates antigos: style
 * inline com flex, gap e max-inline-size decididos por tela, um valor
 * diferente a cada vez. Um bloco é o mesmo arranjo com o mesmo respiro em toda
 * parte — e é o que dá ao MCP algo para responder quando o agente pergunta
 * "como empilho isto". */

/* ------------------------------------------------------------ empilha --- */
/* Ritmo vertical. O gap é variável para a seção que precisa respirar mais —
 * nunca para inventar um valor fora da escala. */
.ucam-stack {
  display: flex;
  flex-direction: column;
  --ucam-stack-gap: var(--ucam-space-stack-md);
  gap: var(--ucam-stack-gap);
  min-inline-size: 0;
}

.ucam-stack--sm { --ucam-stack-gap: var(--ucam-space-stack-sm); }
.ucam-stack--lg { --ucam-stack-gap: var(--ucam-space-stack-lg); }

/* ------------------------------------------------------------ fileira --- */
/* Itens lado a lado que QUEBRAM em vez de espremer. É a diferença entre um
 * grupo de botões que desce uma linha e um que corta o rótulo. */
.ucam-cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  --ucam-cluster-gap: var(--ucam-space-inline-sm);
  gap: var(--ucam-cluster-gap);
  min-inline-size: 0;
}

.ucam-cluster--entre { justify-content: space-between; }
.ucam-cluster--fim { justify-content: flex-end; }
.ucam-cluster--base { align-items: baseline; }
.ucam-cluster--md { --ucam-cluster-gap: var(--ucam-space-inline-md); }
/* Empurra o que vem depois para o fim da linha — mesmo papel do spacer da
 * toolbar, agora disponível em qualquer fileira. */
.ucam-cluster__spacer { margin-inline-start: auto; }

/* -------------------------------------------------------------- grade --- */
/* Cartões que se acomodam sozinhos. auto-fill, não auto-fit: com auto-fit uma
 * grade de dois itens estica os dois até a largura da tela, e a grade de
 * módulos do portal ficaria com dois cartões gigantes. */
.ucam-grid {
  display: grid;
  --ucam-grid-min: 16rem;
  grid-template-columns: repeat(auto-fill, minmax(var(--ucam-grid-min), 1fr));
  gap: var(--ucam-space-inset-md);
}

/* VISTA DE LISTA da mesma grade — o outro lado do segmented "Grade | Lista".
 *
 * Até 10/09/2026 o segmento alternava só o aria-pressed: a vista de lista não
 * existia, e o botão prometia uma troca que não acontecia. O cartão é o MESMO
 * — mesma marcação, mesma estrela, mesmo link —, só o arranjo muda: uma
 * coluna, e cada cartão vira linha com o ícone à esquerda, título e apoio no
 * meio e a estrela na ponta. O cluster que agrupa ícone e estrela na grade é
 * dissolvido (display: contents) para que os dois caiam nas áreas da linha. */
.ucam-grid--lista {
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ucam-space-inline-xs);
}
.ucam-grid--lista > .ucam-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "icone titulo estrela"
    "icone apoio  estrela";
  column-gap: var(--ucam-space-inline-md);
  row-gap: 0;
  align-items: center;
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
}
.ucam-grid--lista > .ucam-card > .ucam-cluster { display: contents; }
.ucam-grid--lista > .ucam-card .ucam-icon-tile { grid-area: icone; }
.ucam-grid--lista > .ucam-card .ucam-card__acao { grid-area: estrela; }
.ucam-grid--lista > .ucam-card .ucam-card__titulo { grid-area: titulo; align-self: end; }
.ucam-grid--lista > .ucam-card .ucam-card__apoio { grid-area: apoio; align-self: start; }
/* Cartão sem apoio: o título ocupa as duas linhas e centra. */
.ucam-grid--lista > .ucam-card:not(:has(.ucam-card__apoio)) .ucam-card__titulo {
  grid-row: 1 / -1;
  align-self: center;
}
/* Cartão cuja fileira JÁ é o cabeçalho (ladrilho, texto, estrela): não há
 * cluster a dissolver, só o recuo a apertar. Sem isto a regra de grade
 * acima punha o cabeçalho inteiro na coluna estreita do ícone. */
.ucam-grid--lista > .ucam-card:has(> .ucam-card__cabecalho) { display: block; }
/* O align-self das áreas de grade acima, num texto em flex de COLUNA, vira
 * alinhamento horizontal: o nome saía centralizado no meio da linha. */
.ucam-grid--lista > .ucam-card:has(> .ucam-card__cabecalho) :is(.ucam-card__titulo, .ucam-card__apoio) { align-self: stretch; }
.ucam-grid--lista > .ucam-card:has(> .ucam-card__cabecalho) .ucam-icon-tile {
  inline-size: var(--ucam-size-control-sm);
  block-size: var(--ucam-size-control-sm);
  border-radius: var(--ucam-radius-control-sm);
}

.ucam-grid--sm { --ucam-grid-min: 11rem; }
.ucam-grid--lg { --ucam-grid-min: 22rem; }

/* ------------------------------------------------------------- divide --- */
/* Conteúdo principal com painel de apoio ao lado. Substitui o
 * \`.ucam-form-layout\`, que resolvia só o caso do formulário — o arranjo é o
 * mesmo em detalhe de requerimento, tela de análise e cálculo de mensalidade.
 *
 * Uma coluna enquanto o CONTÊINER tem menos de 52rem: painel de apoio
 * espremido em 12rem não apoia nada, e tabela em 24rem esconde coluna.
 *
 * Pergunta ao contêiner, não à janela. Era \`@media (min-width: 60rem)\` e a
 * 1024px isso dava duas colunas num painel de 666px — a coluna de navegação,
 * fixa a partir de 64rem, tinha levado 20rem que a janela não descontava.
 * Medido em 11/09/2026: "Valor" fora da vista no movimento de caixa,
 * "Situação" nos parâmetros, três cabeçalhos cortados nos setores. O painel
 * que contém o bloco é quem sabe quanto sobra (container 'corpo', declarado
 * em .ucam-corpo). Sem contêiner nomeado por cima — o bloco solto numa página
 * sem shell — a consulta cai no viewport, que é o comportamento antigo. */
.ucam-split {
  --ucam-split-aside: 18rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ucam-space-stack-lg);
  align-items: start;
}

${contentorAcima('duas-colunas')} {
  .ucam-split {
    grid-template-columns: minmax(0, 1fr) var(--ucam-split-aside);
    gap: var(--ucam-space-inset-lg);
  }

  /* Apoio à esquerda — navegação de etapas, filtros persistentes. A ORDEM DO
   * DOM não muda: o apoio continua depois do conteúdo na leitura e na
   * tabulação, e só a pintura inverte. Inverter no DOM colocaria o painel
   * secundário antes do principal para quem usa teclado e leitor de tela. */
  .ucam-split--apoio-inicio { grid-template-columns: var(--ucam-split-aside) minmax(0, 1fr); }
  .ucam-split--apoio-inicio > :first-child { grid-column: 2; }
  .ucam-split--apoio-inicio > :last-child { grid-column: 1; grid-row: 1; }
}

/* Duas colunas de MESMO peso — resumo ao lado de resumo, não conteúdo ao lado
 * de apoio. O .ucam-split padrão é 1fr + 18rem porque a maioria dos casos é
 * principal e barra lateral; quando os dois blocos são irmãos, a assimetria
 * inventa uma hierarquia que não existe. Nasceu de três telas que escreviam,
 * cada uma por conta própria, o mesmo repeat(auto-fit, minmax(17rem, 1fr))
 * num style inline — com três valores de vão diferentes. */
.ucam-split--igual {
  /* min(100%, …): numa coluna mais estreita que 18rem o piso vira a própria
   * coluna, em vez de uma trilha de 288px dentro de 280. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--ucam-space-inset-lg);
}

${acima('duas-colunas')} {
  .ucam-split--igual { grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
}

/* Coluna de VALORES no descricao deitado.
 *
 * Dinheiro em coluna só se confere se os dígitos alinharem: alinhamento ao fim
 * mais tabular-nums. É a mesma regra que a tabela aplica na coluna numérica, e
 * ter as duas escritas em lugares diferentes foi o que deixou o resumo do
 * Movimento de caixa com números centralizados enquanto a tabela ao lado os
 * alinhava — na mesma tela. */
.ucam-descricao--valores .ucam-descricao__valor {
  text-align: end;
  font-variant-numeric: tabular-nums;
  font-weight: var(--ucam-typography-label-font-weight);
}

/* O TAMANHO PEQUENO, que o contrato pedia e o CSS nunca entregou.
 *
 * empty-state.json declara \`size: 'sm' | 'md'\` com a regra escrita: "sm
 * dentro de tabela ou card; md em página inteira". Não havia modificador
 * nenhum aqui, então toda listagem vazia caía no md — e o md, dentro da
 * moldura da tabela, ainda ganhava \`inset-xl\` por cima do \`inset-lg\` que o
 * bloco já tinha. Os dois recuos somavam 44px de ar acima e abaixo de três
 * linhas de texto, e o vazio de um dia sem lançamento ocupava mais altura
 * que a tabela cheia ocuparia.
 *
 * O sm não é o md com menos ar: o título desce de section-title para corpo,
 * porque dentro de uma seção que JÁ tem um título de seção logo acima, dois
 * títulos do mesmo tamanho competem — é o que se vê em "Lançamentos do dia"
 * seguido de "Nenhum lançamento hoje". */
.ucam-empty--sm {
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inset-md);
}

.ucam-empty--sm .ucam-empty__title {
  font-size: var(--ucam-typography-body-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

.ucam-empty--sm .ucam-empty__description {
  font-size: var(--ucam-typography-body-sm-font-size);
  /* 48ch numa moldura larga produz uma linha só, longuíssima, e o bloco
   * centrado perde o eixo. 56 caracteres é a medida em que a descrição quebra
   * em duas linhas equilibradas sob o título. */
  max-inline-size: 56ch;
}

/* Estado vazio DENTRO da moldura da tabela.
 *
 * A moldura fica: é ela que diz "aqui existe uma tabela, hoje sem linhas". Sem
 * ela, o texto solto faz a fila parecer ausente do sistema em vez de vazia no
 * dia.
 *
 * O que o contexto decide é o TAMANHO, e ele decide sozinho: uma listagem
 * vazia é rotina, e o contrato já diz que dentro de tabela o tamanho é sm.
 * Deixar isso para a marcação lembrar significaria uma tela acertar e a
 * seguinte esquecer — que é como as sete telas chegaram aqui todas no md. */
.ucam-table-wrap > .ucam-empty {
  gap: var(--ucam-space-inline-sm);
  padding-block: var(--ucam-space-inset-lg);
}

.ucam-table-wrap > .ucam-empty .ucam-empty__title {
  font-size: var(--ucam-typography-body-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

.ucam-table-wrap > .ucam-empty .ucam-empty__description {
  font-size: var(--ucam-typography-body-sm-font-size);
  max-inline-size: 56ch;
}

/* -------------------------------------------------------------- seção --- */
/* Bloco titulado dentro da página. Dá ao conteúdo a hierarquia que o legado
 * tenta dar com cartão cinza dentro de cartão branco. */
.ucam-section {
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-md);
}

/* ENTRE seções, mais ar do que DENTRO delas. Na grade de módulos as seções
 * encostavam (0px) enquanto o cabeçalho ficava a 16px do próprio conteúdo: o
 * título de "Presencial" lia mais perto dos cartões de EAD do que dos seus.
 * Proximidade é o que agrupa (Gestalt); o vão entre blocos tem de ser maior
 * que o vão dentro do bloco. Duas telas resolviam com style inline de 1.5rem —
 * o ritmo é do arranjo, não da tela, então mora aqui e vale para todas. */
.ucam-corpo > .ucam-section + .ucam-section,
.ucam-corpo > * + .ucam-section { margin-block-start: var(--ucam-space-stack-lg); }

/* A UNIDADE É UMA PASTA, e o que a divide é um FIO INTEIRO, não o vão.
 *
 * O fio ao lado do título já tinha entrado para separar EAD de Presencial,
 * e não bastou: medido em 20/09/2026 na grade do Portal, uma unidade tem
 * 620 a 710px de altura e 32px de vão até a próxima. Trinta e dois pixels
 * não dividem setecentos — a proporção contra o vão interno (16px) está
 * certa, a ESCALA não está, e quem rola no meio de "Presencial" não tem
 * mais nada em tela dizendo em que unidade está.
 *
 * O fio atravessa a coluna inteira e ganha ar dos dois lados: 32 acima e 32
 * abaixo, com a linha no meio. A dobra passa a valer 64px com um sinal
 * desenhado dentro, contra 32px de branco — e a última fileira de uma
 * unidade deixa de flutuar no mesmo chão do título da seguinte.
 *
 * A cabeça grudenta foi tentada antes disto e NÃO é possível aqui: .ucam-corpo
 * (overflow auto) e .ucam-main (overflow hidden) são dois contêineres de
 * rolagem que nunca rolam — quem rola é o documento —, e o sticky se prende
 * ao mais próximo deles. Medido: com position:sticky e top:72px a cabeça sai
 * de vista em -154px. Desfazer os dois é mexer na moldura de todas as telas
 * com rolagem interna; a dobra resolve a divisão sem tocar nela. */
.ucam-corpo > * + .ucam-section {
  border-block-start: 1px solid var(--ucam-color-border-subtle);
  padding-block-start: var(--ucam-space-stack-lg);
}

/* E com a dobra desenhada, o fio AO LADO do título sai: dois fios na mesma
 * cabeça — um atravessando acima, outro no meio da linha do título — é
 * ruído, e o de cima é o que diz "começa aqui". Fora do corpo (painel,
 * cartão) não há dobra, e lá o fio ao lado continua sendo a aba da pasta. */
.ucam-corpo > .ucam-section > .ucam-section__cabeca .ucam-section__title:has(> .ucam-section__gatilho)::after,
.ucam-corpo > .ucam-section > .ucam-section__title:has(> .ucam-section__gatilho)::after {
  content: none;
}

/* A mesma regra dentro de uma COLUNA comum (16/09/2026). No detalhe do
 * requerimento, "Protocolos anteriores" vive na coluna principal do split,
 * logo abaixo do cartão de resposta — não é filho de .ucam-corpo, e encostava
 * nele a 0px. Pais que já espaçam por gap (pilha, cluster, a própria seção)
 * ficam de fora, senão o vão dobra. */
:not(.ucam-corpo, .ucam-stack, .ucam-cluster, .ucam-section, .ucam-split) > * + .ucam-section {
  margin-block-start: var(--ucam-space-stack-lg);
}

/* Título e dica são UM cabeçalho: 4px entre eles, e o vão da seção (16px) só
 * entre o cabeçalho e o conteúdo. Com o mesmo vão nos dois lugares a dica
 * flutuava no meio, sem pertencer nem ao título nem à tabela. */
/* TÍTULO E DICA SÃO UM BLOCO SÓ, com o menor degrau entre eles — e isso não
 * pode depender de eles serem filhos DIRETOS da seção. Doze telas envolvem os
 * dois num <div> (que é o que permite pôr a ação da seção ao lado), e ali a
 * regra de compensação abaixo não alcançava: vão ZERO entre "Lotação" e a
 * linha que a explica, em toda tela de formulário e nos quatro blocos do
 * movimento de caixa. Medido em 20/09/2026. */
.ucam-section__title + .ucam-section__hint {
  margin-block-start: var(--ucam-space-inline-xs);
}

/* Filho direto da seção, quem separa é o gap dela: o negativo desconta o gap
 * e devolve o mesmo degrau menor de cima. */
.ucam-section > .ucam-section__title + .ucam-section__hint {
  margin-block-start: calc(var(--ucam-space-inline-xs) - var(--ucam-space-stack-md));
}

.ucam-section__title {
  margin: 0;
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  line-height: var(--ucam-typography-section-title-line-height);
  color: var(--ucam-color-text-primary);
}

.ucam-section__hint {
  margin: 0;
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
}

/* SEÇÃO RECOLHÍVEL — section-bar.json, props \`collapsible\` e \`open\`.
 *
 * O gatilho é um button DENTRO do cabeçalho. A marcação é
 * \`<h2 class="ucam-section__title"><button class="ucam-section__gatilho">\`,
 * e nunca o inverso: o nome acessível de um botão achata o que está dentro
 * dele, então cabeçalho dentro de botão apaga o título da lista de marcos que
 * o leitor de tela usa para navegar. É o defeito que o redesenho do SIGU
 * repete nos quatro grupos.
 *
 * O botão herda tudo do h2 — família, corpo, peso, tinta — porque quem
 * carrega a hierarquia continua sendo o cabeçalho. Sem \`font: inherit\`, o
 * agente do navegador devolve 13px de sistema no meio da árvore de títulos. */
.ucam-section__gatilho {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  background: none;
  border: 0;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;
  /* O alvo cresce pelo recuo e volta ao lugar pelo negativo, para o cabeçalho
   * recolhível assentar na mesma linha de base do não recolhível. */
  padding-inline: var(--ucam-space-inline-sm);
  margin-inline: calc(var(--ucam-space-inline-sm) * -1);
  padding-block: var(--ucam-space-inline-xs);
  border-radius: var(--ucam-radius-control);
}

/* LARGURA DO CONTEÚDO, e não 100%: a seta precisa ficar ao lado da contagem.
 * Esticado até a borda do conteúdo, o cabeçalho de 8rem ficava com a seta a
 * 1200px do título — um sinal órfão no meio do branco, que não se lê como
 * pertencente ao grupo. Aqui a linha inteira "EAD · 17 sistemas · v" é uma
 * coisa só, e é essa coisa que responde ao ponteiro. */
.ucam-section__gatilho:hover {
  background-image: linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover));
}

/* Título e descrição do grupo formam uma unidade e por isso saem do ritmo da
 * seção: o gap de .ucam-section separa BLOCOS, e entre um cabeçalho e a linha
 * que o explica ele abria um vão que fazia a descrição parecer conteúdo. */
.ucam-section__cabeca {
  display: flex;
  flex-direction: column;
  /* 4px, o mesmo de título + dica soltos na seção: com 8px a dica do catálogo
   * de relatórios já lia como primeira linha da grade logo abaixo (16/09/2026). */
  gap: var(--ucam-space-inline-xs);
}

/* A CONTAGEM continua visível com a seção fechada: é ela que responde se vale
 * abrir. Recolher para esconder o número transforma o grupo fechado num
 * rótulo sem conteúdo. */
.ucam-section__contagem {
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-body-font-weight);
}

/* A seta é DECORATIVA — quem anuncia o estado é o aria-expanded. Ela mora no
 * fim da linha e gira um quarto de volta, na curva e na duração de estado do
 * sistema. */
.ucam-section__gatilho .ic:last-child {
  margin-inline-start: auto;
  color: var(--ucam-color-text-secondary);
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-section__gatilho[aria-expanded="false"] .ic:last-child {
  transform: rotate(-90deg);
}

/* O FIO da seção recolhível — parte \`rule\` do section-bar, default true, e
 * que até aqui não tinha tinta nenhuma. No Portal, EAD, Presencial, ITECAM e
 * Rio eram separados só por vão: a última fileira de uma unidade e o título
 * da seguinte flutuavam no mesmo chão, e a grade de 58 cartões lia como uma
 * lista só. O fio nasce depois da seta e corre até a borda: é a borda de cima
 * da pasta, e deixa o gatilho com a largura do próprio conteúdo. */
.ucam-section__title:has(> .ucam-section__gatilho) {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-md);
}
.ucam-section__title:has(> .ucam-section__gatilho)::after {
  content: "";
  flex: 1 1 auto;
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

/* -------------------------------------------------------------- realce --- */
/* Contrato: realce.json. O trecho que casou com o termo buscado.
 *
 * Duas regras, e a segunda é a que importa: o \`mark\` NU também é redefinido
 * dentro do escopo. O padrão do agente do navegador é amarelo #FFFF00 com
 * tinta preta — a única superfície da tela que não segue o tema, e a que fica
 * gritando no escuro. Escopado sob .ucam, isso não vaza para o CSS da
 * aplicação hospedeira.
 *
 * Bordô e não âmbar: âmbar neste sistema significa aviso, e meio nome de
 * módulo pintado de aviso afirma algo falso. O anel de foco também é bordô e
 * não colide — o foco é um ANEL do degrau 500, este é um PREENCHIMENTO do
 * 200.
 *
 * O preenchimento carrega degrau de luminância além da matiz (1,46 contra o
 * cartão branco, 1,34 contra o painel escuro), então sobrevive a quem não
 * distingue o vermelho. Ainda assim é REFORÇO: quem responde "este item
 * casou" é a lista filtrada. */
.ucam .ucam-realce,
.ucam mark {
  background: var(--ucam-color-realce-background);
  color: var(--ucam-color-realce-foreground);
  /* ZERO padding e ZERO margem. A marca cai no MEIO de uma palavra — "diplo"
   * dentro de "diplomas" — e qualquer recuo horizontal empurra as letras
   * seguintes: a palavra parte em duas e o realce lê como pastilha solta em
   * vez de trecho grifado. Foi o que apareceu na primeira medição da grade de
   * módulos, com 2px de padding.
   *
   * O respiro que a tinta precisa vem do SPREAD da sombra, que pinta 2px em
   * volta sem ocupar espaço de layout: as letras ficam exatamente onde
   * estariam sem a marca, e o texto não remede quando a busca muda. */
  padding: 0;
  margin: 0;
  box-shadow: 0 0 0 0.125rem var(--ucam-color-realce-background);
  /* Raio pequeno, de grifo — não o raio de controle. Cantos de 8px numa
   * mancha de cinco letras devolvem a pastilha que o padding zero acabou de
   * eliminar. */
  border-radius: 0.125rem;
  /* A marca herda o peso do texto em volta. Engrossar o trecho realçado
   * remede a linha a cada tecla digitada, e o nome do módulo passa a dançar
   * enquanto a pessoa busca. */
  font-weight: inherit;
}

/* -------------------------------------------------- barra de rolagem --- */
/* Escopada sob .ucam e com as propriedades PADRÃO — \`scrollbar-width\` e
 * \`scrollbar-color\` valem no Firefox, que ignora ::-webkit-scrollbar.
 *
 * Só em contêiner que rola por dentro. A barra do DOCUMENTO fica com o
 * navegador, e quem diz a ela qual é o tema é \`color-scheme\` no :root, junto
 * dos tokens. Estilizar a barra do documento daqui repintaria o cromo da
 * aplicação hospedeira — exatamente o que o Trilho A promete não fazer. */

.ucam-dialog__body,
.ucam-table-wrap {
  --ucam-scrollbar-size: 0.625rem;
  scrollbar-width: thin;
  /* Em repouso a barra é estrutura, não conteúdo: fica na borda discreta,
   * sem disputar atenção com o dado que ela ajuda a percorrer. */
  scrollbar-color: var(--ucam-color-border-default) transparent;
}

/* Com o ponteiro dentro da área — ou com o teclado, via :focus-within — a
 * posição no rolo vira informação útil e o polegar ganha contraste. Sem o
 * :focus-within a barra existiria só para quem usa mouse. */
.ucam-dialog__body:hover,
.ucam-dialog__body:focus-within,
.ucam-table-wrap:hover,
.ucam-table-wrap:focus-within {
  scrollbar-color: var(--ucam-color-border-strong) transparent;
}

/* Calha reservada antes de existir o que rolar. Sem isto a lista do menu
 * salta na horizontal quando o filtro reduz os itens e a barra some, e o
 * diálogo salta a cada troca de passo. Só nos que rolam na VERTICAL: em
 * .ucam-table-wrap (overflow-x) a calha seria uma faixa morta à direita. */
.ucam-dialog__body { scrollbar-gutter: stable; }

/* WebKit sem as propriedades padrão — Safari < 18.2 e as WebViews do parque
 * legado, que são metade do motivo do Trilho A existir. O Chromium IGNORA
 * este bloco quando scrollbar-color/-width estão declaradas, então os dois
 * convivem sem pintar a barra duas vezes. */
.ucam-dialog__body::-webkit-scrollbar,
.ucam-table-wrap::-webkit-scrollbar {
  width: var(--ucam-scrollbar-size);
  height: var(--ucam-scrollbar-size);
}

.ucam-dialog__body::-webkit-scrollbar-track,
.ucam-table-wrap::-webkit-scrollbar-track { background: transparent; }

/* A borda transparente com background-clip afina o polegar e abre a folga
 * até a trilha sem precisar de uma trilha desenhada. */
.ucam-dialog__body::-webkit-scrollbar-thumb,
.ucam-table-wrap::-webkit-scrollbar-thumb {
  background-color: var(--ucam-color-border-default);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: var(--ucam-radius-pill);
}

.ucam-dialog__body:hover::-webkit-scrollbar-thumb,
.ucam-table-wrap:hover::-webkit-scrollbar-thumb {
  background-color: var(--ucam-color-border-strong);
}

/* No alto contraste do sistema o par de cores do tema atrapalha em vez de
 * ajudar: devolve a barra ao navegador, que já usa a paleta forçada. */
@media (forced-colors: active) {
  .ucam-nav__scroll,
  .ucam-dialog__body,
  .ucam-table-wrap { scrollbar-color: auto; }
}

/* ----------------------------------------------------------- checkbox --- */
/* Contrato: checkbox.json. O input nativo continua no DOM — a caixa desenhada
 * é decoração sobre ele, nunca substituição. */

.ucam-check {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ucam-space-inline-sm);
  cursor: pointer;
  /* Alvo mínimo de 24px — WCAG 2.5.8. NOS DOIS EIXOS: com rótulo de texto a
   * largura vem de graça, mas a seleção de linha de tabela nomeia o controle
   * por aria-label e não tem texto nenhum ao lado. Só com min-block-size o
   * alvo ficava 20 de largura por 24 de altura, e 24 é piso dos dois lados. */
  min-block-size: var(--ucam-size-icon-lg);
  min-inline-size: var(--ucam-size-icon-lg);
  justify-content: center;
  /* FORA DA LINHA DE BASE. Assentando nela, a etiqueta deixava a célula
   * reservar o espaço do descendente de um texto que ela não tem, e a linha
   * da tabela ficava três pixels mais alta do que a peça pede. Ver a nota do
   * ::after: juntas, as duas regras tiram a altura da linha da dependência do
   * que está desenhado dentro da caixa. */
  vertical-align: middle;
}

/* O ALVO CENTRA NA CAIXA QUANDO NÃO HÁ RÓTULO.
 *
 * O alinhamento pelo início existe para o caso com texto: rótulo de duas
 * linhas ao lado de uma caixa de 20px tem de encostar na PRIMEIRA linha, e
 * centrar deixaria a caixa boiando no meio do parágrafo. Só que a coluna de
 * seleção de tabela não tem texto nenhum — e ali o mesmo alinhamento
 * empurrava a caixa para o topo de um alvo de 24: sobravam 10px de área
 * clicável acima do centro da caixa e 14 abaixo. O alvo existia, com a medida
 * certa, e mesmo assim não era onde o olho aponta.
 *
 * Medido na tela de naturezas: sonda a 11,5px acima do centro da caixa caía
 * no <td>, e a mesma sonda abaixo caía na etiqueta. Doze linhas com meio alvo
 * de cada lado. */
.ucam-check:not(:has(.ucam-check__label)) { align-items: center; }

/* O TIQUE SAI DO FLUXO, e o motivo é uma linha que pulava.
 *
 * Medido em 19/09/2026 na matriz de Grupo × Menu: ao marcar o cabeçalho, o
 * <thead> encolhia de 41,5px para 40,5 e a tabela inteira subia um pixel. A
 * etiqueta é inline-flex, então ela assenta na LINHA DE BASE da célula — e a
 * linha de base de uma caixa flex/grid vem do primeiro item dela, que aqui é
 * o ::after: o traço do meio-termo tem 2px de altura e o tique tem 8,8. Trocar
 * de estado trocava a linha de base, e com ela a altura da linha da tabela.
 *
 * Absoluto, o desenho não é mais item de layout: a caixa sintetiza a linha de
 * base a partir da própria borda e a altura para de depender do que está
 * marcado. O centro vem de translate (propriedade), para o transform seguir
 * livre para o giro do tique. */
.ucam-check input[type="checkbox"] {
  appearance: none;
  margin: 0;
  flex: none;
  inline-size: var(--ucam-size-icon-md);
  block-size: var(--ucam-size-icon-md);
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-miudo);
  cursor: pointer;
  position: relative;
  display: block;
}

.ucam-check input[type="checkbox"]::after {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
}

/* O MEIO-TERMO TAMBÉM POR ATRIBUTO. "indeterminate" é PROPRIEDADE do
 * elemento, não atributo: não há como escrevê-lo em HTML, só em JavaScript.
 * Numa tela autônoma — que é HTML e mais nada — o cabeçalho de "selecionar
 * tudo" com parte das linhas marcadas saía como caixa VAZIA, que é a leitura
 * errada: quem clica nela espera marcar tudo e acaba de desmarcar o que
 * havia. O data-indeterminate dá ao Trilho A o estado que o Trilho B põe pela
 * propriedade. */
.ucam-check input:checked,
.ucam-check input:indeterminate,
.ucam-check input[data-indeterminate="true"] {
  background: var(--ucam-color-action-primary-default);
  border-color: var(--ucam-color-action-primary-default);
}

.ucam-check input:checked::after {
  content: "";
  inline-size: 0.3rem;
  block-size: 0.55rem;
  border: solid var(--ucam-color-text-on-action);
  border-width: 0 2px 2px 0;
  transform: translateY(-1px) rotate(45deg);
}

.ucam-check input:indeterminate::after,
.ucam-check input[data-indeterminate="true"]:not(:checked)::after {
  content: "";
  inline-size: 0.55rem;
  block-size: 2px;
  background: var(--ucam-color-text-on-action);
}

/* Hover na ETIQUETA, não só na caixa: o alvo é o rótulo inteiro (2.5.8), e
 * um hover que só nascesse sobre os 20px do quadrado desmentiria o alvo.
 * Mesmo degrau do campo de texto, border.strong, e só na caixa vazia —
 * marcada, ela já está em tinta cheia. O contrato não declarava o estado e
 * nenhum trilho o desenhava (revisão de estados, 13/09/2026). */
.ucam-check:hover input:not(:disabled):not(:checked):not(:indeterminate):not([data-indeterminate="true"]) {
  border-color: var(--ucam-color-border-strong);
}

/* INVÁLIDO. O checkbox tinha invalid nos dois trilhos e nenhuma aparência na
 * folha: o aria-invalid ficava escrito no markup sem mudar um pixel. Só o
 * filete, e só na caixa vazia — marcada, ela já está em tinta cheia, e pintar
 * a borda de vermelho por baixo do preenchimento não se vê. A mensagem
 * continua sendo quem comunica o erro: a borda sozinha nunca comunica
 * (revisão de feedback, 20/09/2026). */
.ucam-check input[aria-invalid="true"]:not(:checked):not(:indeterminate) {
  border-color: var(--ucam-color-feedback-danger-border);
}

.ucam-check input:disabled {
  background: var(--ucam-color-action-disabled-background);
  border-color: var(--ucam-color-border-subtle);
  cursor: not-allowed;
}

/* O RÓTULO ACOMPANHA A CAIXA. O radio já fazia isto e a caixa de marcação
 * não: um checkbox bloqueado saía com a caixa cinza e o texto em tinta
 * primária ao lado, lendo como item ativo que por acaso está vazio. É o
 * mesmo defeito em dois componentes irmãos, e só um tinha sido corrigido. */
.ucam-check:has(input:disabled) {
  color: var(--ucam-color-text-disabled);
  cursor: not-allowed;
}

.ucam-check__label { font-size: var(--ucam-typography-body-sm-font-size); line-height: var(--ucam-size-icon-lg); }

/* ------------------------------------------------------------- switch --- */
/* Contrato: checkbox.json (limites). Efeito imediato, sem submissão —
 * substitui o par de botões SIM/NÃO do legado, que era ambíguo. */

/* A ETIQUETA É O ALVO, e por isso ela tem o piso de 24px — não o trilho.
 *
 * O trilho desenhado mede 30,4 × 17,6: abaixo da 2.5.8 na vertical. Com
 * rótulo de texto ao lado a etiqueta passava dos 24 por acidente, pela altura
 * da linha; sem rótulo — interruptor em célula de tabela, nomeado por
 * aria-label — o alvo inteiro tinha 17,6px de altura. O piso aqui vale nos
 * dois casos, e o desenho do trilho não muda: quem cresce é a área. */
.ucam-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-block-size: var(--ucam-size-icon-lg);
  cursor: pointer;
}

.ucam-switch input[type="checkbox"] {
  appearance: none;
  margin: 0;
  inline-size: 1.9rem;
  block-size: 1.1rem;
  background: var(--ucam-color-border-strong);
  border-radius: var(--ucam-radius-pill);
  position: relative;
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-switch input::after {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-inline-start: 2px;
  inline-size: 0.85rem;
  block-size: 0.85rem;
  background: var(--ucam-color-surface-default);
  border-radius: var(--ucam-radius-pill);
  transition: transform var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-switch input:checked { background: var(--ucam-color-action-primary-default); }
.ucam-switch input:checked::after { transform: translateX(0.8rem); }

/* --------------------------------------------------- escolha exclusiva --- */
/* Contrato: radio-group.json.
 *
 * É um dos poucos contratos em que os DOIS TRILHOS entregam a mesma coisa,
 * porque o rádio nativo já traz o que costuma faltar numa reimplementação: o
 * grupo por \`name\`, a navegação por seta e a parada única de tabulação. Aqui
 * o CSS só desenha; nada precisa de JavaScript. */

.ucam-radio-group {
  /* fieldset zerado: o navegador desenha uma moldura e um recuo que não são do
   * sistema, e cola a legenda nela. */
  border: 0;
  margin: 0;
  padding: 0;
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-sm);
}

.ucam-radio-group__legenda {
  padding: 0;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: var(--ucam-typography-label-line-height);
  color: var(--ucam-color-text-primary);
}

.ucam-radio-group__opcoes {
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-sm);
}

/* Deitado só onde as alternativas são de uma palavra. O vão é maior porque,
 * em linha, rótulos próximos passam a ser lidos como um texto só. */
.ucam-radio-group--horizontal .ucam-radio-group__opcoes {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--ucam-space-inline-md);
}

/* O ALVO É O RÓTULO INTEIRO. O círculo tem 16px e o piso da WCAG 2.5.8 é 24;
 * pendurar o clique no <label> resolve os dois de uma vez, porque o label
 * nativo já aciona o controle associado. */
.ucam-radio {
  display: flex;
  align-items: start;
  gap: var(--ucam-space-inline-sm);
  cursor: pointer;
}

.ucam-radio input[type="radio"] {
  /* Desenho próprio: o rádio do sistema operacional não acompanha o tema
   * escuro e no Windows é azul — cor de outro sistema no meio do formulário. */
  appearance: none;
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  /* Alinha com a PRIMEIRA linha do rótulo, não com o bloco: com apoio de duas
   * linhas, um círculo centralizado escorrega para o meio do parágrafo. */
  margin-block-start: 0.125rem;
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-surface-default);
  cursor: pointer;
}

/* O ponto é sombra INTERNA, não ::before: pseudo-elemento em <input> não é
 * desenhado por parte dos navegadores. */
.ucam-radio input[type="radio"]:checked {
  border-color: var(--ucam-color-action-primary-default);
  box-shadow: inset 0 0 0 3px var(--ucam-color-surface-default);
  background: var(--ucam-color-action-primary-default);
}

.ucam-radio input[type="radio"]:hover:not(:disabled) {
  border-color: var(--ucam-color-border-strong);
}

/* O radio usava surface.sunken, a faixa de RÓTULO de tabela — um degrau que
 * existe para dizer "esta fileira não é dado" e que aqui precisava dizer
 * outra coisa. Agora acompanha a caixa de marcação e o botão (ADR-042). */
.ucam-radio input[type="radio"]:disabled {
  background: var(--ucam-color-action-disabled-background);
  border-color: var(--ucam-color-border-subtle);
  cursor: not-allowed;
}

.ucam-radio:has(input:disabled) {
  color: var(--ucam-color-text-disabled);
  cursor: not-allowed;
}

.ucam-radio__texto {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
}

.ucam-radio__rotulo {
  font-size: var(--ucam-typography-body-font-size);
  line-height: var(--ucam-typography-body-line-height);
}

/* A CONSEQUÊNCIA da alternativa, não o rótulo com outras palavras. */
.ucam-radio__apoio {
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
  color: var(--ucam-color-text-secondary);
}

/* O erro é do GRUPO — não existe rádio individualmente inválido. */
.ucam-radio-group__erro {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-feedback-danger-foreground);
}

/* Só os NÃO escolhidos ganham o filete de erro: pintar o escolhido de vermelho
 * diria que a escolha está errada, quando o que falta é escolher. */
.ucam-radio-group--invalido .ucam-radio input[type="radio"]:not(:checked) {
  border-color: var(--ucam-color-feedback-danger-border);
}

/* ----------------------------------------------------------- skeleton --- */
/* Contrato: skeleton.json. ADR-005 — substitui o overlay CARREGANDO.
 * aria-hidden na marcação: é ausência de conteúdo, não conteúdo. */

.ucam-skeleton {
  display: block;
  background: var(--ucam-color-surface-subtle);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-miudo);
  block-size: 0.85rem;
  position: relative;
  overflow: hidden;
}

.ucam-skeleton + .ucam-skeleton { margin-block-start: var(--ucam-space-stack-sm); }
.ucam-skeleton--heading { block-size: 1.4rem; }
.ucam-skeleton--block   { block-size: 5rem; }
.ucam-skeleton--circle  { inline-size: 2.5rem; block-size: 2.5rem; border-radius: var(--ucam-radius-pill); }
/* Última linha mais curta, imitando fim de parágrafo. */
.ucam-skeleton--last    { inline-size: 60%; }

.ucam-skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--ucam-color-surface-default), transparent);
  opacity: 0.6;
  transform: translateX(-100%);
  animation: ucam-shimmer 1.4s infinite;
}

@keyframes ucam-shimmer { to { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  .ucam-skeleton::after { animation: none; }
}

/* Indicador de carregamento em linha. NÃO EXISTIA no Trilho A: botão, select
 * e campo declaravam loading, o Trilho B girava o loaderCircle, e esta folha
 * não tinha animação de giro nenhuma — o legado migrado pelo CSS puro ficava
 * sem como dizer "espere" a não ser pelo texto. Revisão de estados, 13/09/2026.
 *
 * Vai num svg.ic com o ícone loaderCircle do sprite, no lugar que states.json
 * dá a cada componente. O período de 1s linear é o do animate-spin do Trilho B:
 * giro não é transição de estado, e uma curva nele faria o traço acelerar e
 * frear a cada volta. Com movimento reduzido ele para — o círculo parado ainda
 * lê como espera, e quem informa é o aria-busy. */
.ucam-spinner { animation: ucam-girar 1s linear infinite; }

@keyframes ucam-girar { to { rotate: 1turn; } }

@media (prefers-reduced-motion: reduce) {
  .ucam-spinner { animation: none; }
}

/* ------------------------------------------------------------- diálogo --- */
/* Contrato: dialog.json. Header e footer fixos; SÓ o corpo rola — o legado
 * tem duas barras de rolagem adjacentes no mesmo modal. */

.ucam-dialog {
  background: var(--ucam-color-surface-raised);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  inline-size: min(34rem, 100%);
  max-block-size: min(40rem, 90vh);
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* align-items: CENTER, não baseline.
 *
 * Com baseline, o header media 104px: 56px de vão acima do título e 25
 * abaixo, com padding declarado de 16/16. A causa é que o segundo filho é um
 * .ucam-btn--icon, e um botão que só contém um <svg> não tem linha de base de
 * texto — o navegador usa a borda inferior da caixa como baseline. Alinhar o
 * título a ELA obriga o flex a empurrar o título 24px para baixo e a esticar
 * o header pela diferença. O espaçamento não estava faltando; estava sendo
 * gasto acima do título, onde ninguém o vê como espaçamento.
 *
 * Baseline só serve quando os dois lados são TEXTO — é o caso do
 * .ucam-page-header quando ele mostra título e contagem, e lá continua. Aqui
 * um dos lados é um controle quadrado, e o alinhamento certo é o centro. */
.ucam-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ucam-space-inline-md);
  padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-dialog__title {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  margin: 0;
}

/* Única área rolável. Nada dentro dela pode ter overflow próprio. */
.ucam-dialog__body { padding: var(--ucam-space-inset-lg); overflow-y: auto; }

/* A ÁREA ROLÁVEL RECORTA O DROPDOWN — e a lista aberta de um Select dentro do
 * diálogo aparecia por baixo do rodapé: overflow-y: auto no corpo corta tudo
 * que sai dele, e a lista é position: absolute crescendo para baixo. Medido
 * em 10/09/2026 no catálogo: 15 de 25 pontos da lista sob .ucam-dialog__footer.
 *
 * Enquanto uma lista ou um menu do corpo está ABERTO, o corpo para de
 * recortar. É transitório por natureza — a lista fecha ao escolher — e um
 * corpo que não rola por dois segundos custa menos que um dropdown que não
 * se lê. Vale para a gaveta pela mesma razão. */
.ucam-dialog__body:has(.ucam-listbox:not([hidden])),
.ucam-dialog__body:has(.ucam-menu:not([hidden])),
.ucam-drawer__body:has(.ucam-listbox:not([hidden])),
.ucam-drawer__body:has(.ucam-menu:not([hidden])) {
  overflow: visible;
}

.ucam-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

/* O DIÁLOGO NATIVO. O contrato manda usar <dialog> com showModal e proíbe
 * reimplementar a armadilha de foco: quem faz isso é o navegador. O que falta
 * declarar é o que o UA desenha por conta própria e não combina com o
 * sistema: o recuo e a moldura padrão (já zerados acima, em .ucam-dialog) e o
 * fundo escurecido, que no nativo é ::backdrop e não um elemento — mesma
 * tinta do scrim da gaveta, para as duas sobreposições pesarem igual. */
dialog.ucam-dialog { margin: auto; }

/* O SEGUNDO CONTÊINER DE ROLAGEM, o que ninguém declarou.
 *
 * A regra acima tira o recorte do CORPO enquanto uma lista está aberta, e
 * ainda assim a lista do Select dentro do diálogo continuava morrendo na
 * borda — medido em 20/09/2026 no detalhe do usuário: lista até 650px,
 * diálogo até 572, 78px para fora, e o que estava no ponto 20px abaixo da
 * borda era o próprio dialog, não a opção.
 *
 * A causa não está na folha: o navegador dá overflow:auto ao <dialog> por
 * padrão. Com max-block-size cravado aqui, isso faz do próprio diálogo uma
 * área rolável — a SEGUNDA, contra o que .ucam-dialog__body declara ser
 * ("única área rolável"). Duas áreas roláveis empilhadas, e a de fora
 * recortando a de dentro.
 *
 * Quem rola é o corpo, sempre; o diálogo só emoldura. Devolver visible ao
 * diálogo não solta nada: o corpo continua cortando o conteúdo longo, e
 * abre passagem para a lista, que é o único filho que PRECISA sair da
 * moldura. Mesma família das três causas de recorte já corrigidas na faixa,
 * no corpo rolável e no palco — quem rola, recorta. */
dialog.ucam-dialog { overflow: visible; }
dialog.ucam-dialog:not([open]) { display: none; }

.ucam-dialog::backdrop {
  background: color-mix(in srgb, var(--ucam-color-surface-inverse) 45%, transparent);
  animation: ucam-esmaecer var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard);
}

/* O <form method="dialog"> existe para o botão fechar sozinho e entregar o
 * returnValue — ele é mecanismo, não caixa. Com display: contents, cabeçalho,
 * corpo e rodapé continuam sendo os filhos flex do diálogo; sem isso o form
 * vira o único filho e a coluna de três partes desaba numa só. */
.ucam-dialog__form { display: contents; }

.ucam-dialog__texto {
  margin: 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: var(--ucam-typography-body-sm-line-height);
  color: var(--ucam-color-text-primary);
}

/* --------------------------------------------------------------- abas --- */

.ucam-tabs {
  display: flex;
  gap: var(--ucam-space-inline-md);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
  /* A tira ROLA, nunca quebra.
   *
   * Sem isto, quatro abas a 390px viravam duas fileiras com os rótulos
   * partidos no meio ("Aguardam / você (4)") e o filete de baixo passando
   * entre elas — a tira deixava de ler como uma tira. Rolagem lateral tem o
   * custo conhecido de esconder o que está fora, e aqui ele é aceitável
   * porque a primeira aba, que é a selecionada, começa visível e as demais
   * são recortes da MESMA lista, não destinos diferentes. */
  overflow-x: auto;
  scrollbar-width: none;
}

.ucam-tabs::-webkit-scrollbar { display: none; }

/* O SINAL DE QUE HÁ MAIS.
 *
 * A tira rola com a barra escondida, e a 390px a caixa de entrada mostrava
 * três abas inteiras e nada dizia que havia uma quarta: o corte caía no vão
 * entre duas abas e lia como fim da lista. O sinal é o esmaecimento da borda
 * de onde ainda há conteúdo — e SÓ dela. Uma máscara fixa mentiria duas
 * vezes: esmaeceria a ponta que já chegou ao fim e esmaeceria a tira que nem
 * rola.
 *
 * Por isso as duas larguras de esmaecimento andam com a rolagem, numa
 * animação cuja linha do tempo é o próprio rolo. Tira que não rola tem linha
 * do tempo inativa, a animação não aplica nada e as duas larguras ficam no
 * valor inicial: zero, nenhuma máscara. Sem suporte a linha do tempo de
 * rolagem (Firefox, hoje) a tira volta a ser o que era — rola sem sinal, não
 * quebra. Vale para quem mais rola escondido: o segmented abaixo de
 * nav-fixa e a tira da navegação de topo. */
@property --ucam-rolo-ini { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --ucam-rolo-fim { syntax: "<length>"; inherits: false; initial-value: 0px; }

@keyframes ucam-rolo {
  0%   { --ucam-rolo-ini: 0px;                      --ucam-rolo-fim: var(--ucam-space-inset-lg); }
  10%  { --ucam-rolo-ini: var(--ucam-space-inset-lg); }
  90%  { --ucam-rolo-fim: var(--ucam-space-inset-lg); }
  100% { --ucam-rolo-ini: var(--ucam-space-inset-lg); --ucam-rolo-fim: 0px; }
}

@supports (animation-timeline: scroll()) {
  .ucam-tabs,
  .ucam-segmented,
  .ucam-topnav__scroll {
    mask-image: linear-gradient(to right,
      transparent, #000 var(--ucam-rolo-ini),
      #000 calc(100% - var(--ucam-rolo-fim)), transparent);
    animation: ucam-rolo linear both;
    animation-timeline: scroll(self inline);
    /* A máscara cria contexto de empilhamento, e contexto de empilhamento
     * pinta — e recebe o toque — POR CIMA dos extensores de alvo da fileira
     * vizinha. Medido a 390px: os 6px de baixo do extensor de "Novo usuário"
     * passaram a cair no trilho do segmented, que não é alvo de nada. O
     * contêiner fica transparente ao ponteiro e só os filhos respondem; a
     * rolagem por arrasto continua, porque o gesto começa num filho e sobe
     * pela cadeia de rolagem dele. */
    pointer-events: none;
  }
  :is(.ucam-tabs, .ucam-segmented, .ucam-topnav__scroll) > * { pointer-events: auto; }
}

.ucam-tabs__tab { white-space: nowrap; }

.ucam-tabs__tab {
  background: none;
  border: 0;
  border-block-end: 2px solid transparent;
  padding: var(--ucam-space-inset-sm) 0;
  margin-block-end: -1px;
  font: inherit;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
}

.ucam-tabs__tab[aria-selected="true"] {
  color: var(--ucam-color-action-primary-default);
  border-block-end-color: var(--ucam-color-action-primary-default);
}


/* A CONTAGEM DA ABA é número esmaecido ao lado do rótulo — nem parêntese,
 * nem pastilha.
 *
 * Os dois trilhos divergiam: o CSS puro escrevia "(9)" dentro do rótulo e o
 * Angular desenhava uma cápsula cinza com o número dentro. O parêntese é
 * pontuação fazendo o trabalho de tipografia, e a cápsula é a terceira
 * superfície cinza numa tira que já tem o filete e o realce — o mesmo
 * defeito que tirou a pastilha do contador da navegação. O número em tinta
 * secundária e algarismo tabular já se separa do rótulo pelo peso e pela cor,
 * e é o desenho que Attio, Linear e o Gmail convergiram.
 *
 * O número fica FORA do nome acessível: o rótulo diz "Aguardam você, 9 itens"
 * por texto oculto, e o span visível é aria-hidden. Parêntese lido por leitor
 * de tela vai de "abre parêntese nove" a silêncio, conforme o leitor. */
.ucam-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
}

.ucam-tabs__contagem {
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-body-font-weight);
  color: var(--ucam-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* Na aba escolhida o número NÃO veste o bordô. A tira tem um portador de cor
 * por vez — o rótulo com o filete — e o algarismo colado a ele em bordô
 * dobraria o sinal sem acrescentar informação. */
.ucam-tabs__tab[aria-selected="true"] .ucam-tabs__contagem {
  color: var(--ucam-color-text-secondary);
}

/* ---------------------------------------------------------- elevação --- */
/* Card ganha elevação em vez de depender só da borda. */

/* O cartão em repouso NÃO tem sombra.
 *
 * Ele já vive dentro do painel branco, e sombra sobre branco só produz uma
 * mancha cinza sob a borda — dois recursos dizendo a mesma coisa, e o mais
 * fraco dos dois sujando o outro. Sombra fica para o que de fato flutua:
 * diálogo, menu suspenso, e o cartão que está sobre o chão da aplicação
 * (.ucam-card--elevado). */
.ucam-dialog { box-shadow: var(--ucam-elevation-overlay); }

/* ------------------------------------------------------------- stat --- */
/* Número em destaque com rótulo e variação. Substitui as listas de rótulo e
 * valor do Movimento de Caixa, onde o dado mais importante — o saldo — tinha
 * o mesmo peso visual de todos os outros. */

/* A grade contínua é desenhada pelos LADRILHOS, não pelo contêiner.
 *
 * A versão anterior pintava o contêiner da cor da borda e deixava 1px de vão
 * entre ladrilhos brancos: a linha era o fundo aparecendo. Funciona enquanto a
 * última fileira está cheia. Quatro stats numa faixa que só comporta três
 * colunas deixam DUAS células vazias — e, sem ladrilho por cima, elas mostram
 * o fundo do contêiner: um bloco cinza sólido do tamanho de dois cartões,
 * exatamente onde não há dado nenhum. Não é caso raro; é o que acontece com
 * 4 ladrilhos em qualquer largura de notebook.
 *
 * Com o anel de 1px em cada ladrilho, célula vazia não pinta nada. Entre dois
 * vizinhos os dois anéis ocupam o MESMO pixel de vão, então a linha continua
 * com 1px; na borda externa os anéis formam o contorno, que o overflow do
 * contêiner recorta no raio. Um recurso a menos e um caso a menos. */
/* FLEX com quebra, não grade de auto-fit.
 *
 * Auto-fit escolhe quantas colunas cabem e não olha quantos ladrilhos existem:
 * quatro métricas numa faixa que comporta três viram 3 + 1, e a fileira de
 * baixo fica com um ladrilho e dois vãos. É o arranjo mais comum em notebook,
 * não um caso de canto. Em flex, os itens da ÚLTIMA LINHA crescem e a ocupam
 * inteira — 4, 3 + 1 cheio, 2 + 2, 1 por linha, sempre um retângulo. A base de
 * 11rem continua sendo quem decide quantos cabem; o que muda é o que acontece
 * com a sobra.
 *
 * min-inline-size: 0 porque valor monetário não encolhe sozinho: sem isto o
 * conteúdo vira o mínimo do item e "R$ 128.940,00" impede a quebra. */
.ucam-stats {
  --ucam-stats-gap: 1px;
  /* Contêiner que os ladrilhos consultam para decidir 4 ou 2 + 2 (abaixo). */
  container: indicadores / inline-size;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ucam-stats-gap);
  border-radius: var(--ucam-radius-surface);
  overflow: hidden;
  /* A moldura da grade contínua é uma borda de verdade pelo mesmo motivo do
   * cartão acima: com o anel dos ladrilhos recortado pelo overflow, a tinta
   * de dentro ficava 1px à esquerda da tinta da tabela logo abaixo. */
  border: 1px solid var(--ucam-color-border-subtle);
}

/* A grade contínua é desenhada pelos LADRILHOS, não pelo contêiner.
 *
 * A versão anterior pintava o contêiner da cor da borda e deixava 1px de vão
 * entre ladrilhos brancos: a linha era o fundo aparecendo. Isso só funciona
 * com a última fileira cheia — onde faltasse ladrilho, aparecia um bloco cinza
 * sólido do tamanho de um cartão, exatamente onde não há dado nenhum. Com o
 * anel de 1px em cada ladrilho, vão sem ladrilho não pinta nada; entre dois
 * vizinhos os dois anéis ocupam o MESMO pixel e a linha continua com 1px; na
 * borda externa os anéis formam o contorno, que o overflow recorta no raio. */
.ucam-stat {
  display: flex;
  flex: 1 1 11rem;
  min-inline-size: 0;
  flex-direction: column;
  gap: 0.125rem;
  padding: var(--ucam-space-inset-md);
  background: var(--ucam-color-surface-default);
  box-shadow: 0 0 0 1px var(--ucam-color-border-subtle);
}

.ucam-stat__label {
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-stat__value {
  /* Estava em --ucam-fontSize-2xl e --ucam-fontWeight-semibold: primitivas que
   * NÃO EXISTEM na saída de tokens. O portão da ADR-007 não pegou porque a
   * busca é /--ucam-[a-z0-9-]+/ e o S maiúsculo de fontSize fica de fora — o
   * número do saldo vinha herdando o tamanho do corpo em silêncio. */
  font-size: var(--ucam-typography-page-title-font-size);
  font-weight: var(--ucam-typography-page-title-font-weight);
  /* 1.5rem = 24px, e não a razão 1.1, que sobre 22px dá 24,2px. O número
   * grande precisa ficar apertado contra o rótulo e o delta — por isso não
   * herda os 28px de page-title —, mas 24 inteiro dá o mesmo aperto sem pôr
   * o cartão inteiro meio pixel fora da grade. */
  line-height: 1.5rem;
  letter-spacing: -0.02em;
  /* Valor monetário em coluna só se confere se os dígitos alinharem. */
  font-variant-numeric: tabular-nums;
}

/* A VARIAÇÃO como chip, ao lado do número.
 *
 * "+118" solto ao lado de "432" lê como parte do número. No chip, lê como o
 * que é: o quanto entrou desde a última leitura. Neutro de propósito — para
 * cima nem sempre é bom (118 pendências a mais não é boa notícia), e pintar
 * de verde por ser positivo seria a cor mentindo. Quando o sinal importar, o
 * .ucam-stat--success/--danger continua governando o VALOR, que é onde o
 * julgamento pertence. */
.ucam-stat__delta {
  display: inline-block;
  /* PASTILHA, não faixa. O ladrilho é uma coluna flex, e como item de flex o
   * inline-block é promovido a bloco e esticado até a largura da coluna: a
   * pastilha virava uma barra cinza atravessando o cartão. Ninguém tinha visto
   * porque nenhuma tela usava esta parte — as telas de painel desenhavam a
   * variação com selo de situação, que é o que o contrato do selo proíbe. */
  align-self: start;
  /* ALTURA DECLARADA, como toda peça de micro-rótulo do sistema.
   *
   * O token size.marcador existe porque selo, chip e prazo chegavam à mesma
   * linha com alturas fracionárias diferentes — 22,19px contra 22,78 contra
   * 24,19 — quando cada um deixava a altura resultar do line-height mais o
   * próprio recuo. O delta era o último a fazer isso: 0,05rem de recuo de
   * bloco em cima de um caption dava 20,4px, e no cartão de stat ele ficava
   * meio pixel mais baixo que o selo do cartão vizinho. Aqui a altura passa a
   * ser a mesma por construção, e o recuo só governa a horizontal.
   *
   * MÍNIMO, não medida (12/09/2026). Numa linha a pastilha fecha no marcador
   * exato — 16 de entrelinha mais 3 e 3 —; quando o ladrilho é estreito e o
   * texto quebra ("4% abaixo do anterior" a 390px), ela cresce em vez de
   * deixar a segunda linha vazar por baixo do fundo. */
  display: inline-flex;
  align-items: center;
  min-block-size: var(--ucam-size-marcador);
  padding-block: 0.1875rem;
  line-height: var(--ucam-typography-caption-line-height);
  /* SEM PASTILHA desde 14/09/2026 (ADR-034). O cinza de sunken atrás do
   * "+9%" era o último fundo dentro do ladrilho, e a regra que tirou a
   * pastilha cinza do contador e o poço do campo vale aqui. A altura de
   * marcador fica: é ela que alinha o delta com o selo do cartão vizinho. */
  padding-inline: 0;
  color: var(--ucam-color-text-secondary);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  font-variant-numeric: tabular-nums;
}

/* Stat de CONTAGEM: rótulo, variação e número na mesma linha.
 *
 * O empilhado continua sendo o padrão porque valor monetário não cabe deitado
 * ("R$ 12.890,45" ao lado de "Total recebido" estoura qualquer cartão de
 * dashboard). Contagem cabe, e deitada rende quatro cartões numa faixa de
 * 56px em vez de 96 — que é o que devolve altura para a tabela logo abaixo. */
.ucam-stat--linha {
  flex-direction: row;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
}

.ucam-stat--linha .ucam-stat__label { margin-inline-end: auto; }

.ucam-stat--linha .ucam-stat__value {
  font-size: var(--ucam-typography-section-title-font-size);
}

/* Cartões SEPARADOS, com vão — não a grade contínua de 1px.
 *
 * A grade contínua é certa quando os números são partes de um todo que se
 * somam (o caixa do dia). Quatro contagens de estados diferentes não se somam:
 * são quatro leituras independentes, e o vão diz isso. */
.ucam-stats--cartoes {
  --ucam-stats-gap: var(--ucam-space-inline-md);
  border-radius: 0;
  border: 0;
  overflow: visible;
}

/* Cartão de verdade: borda, não anel. O anel fica FORA da caixa, então a
 * tinta de dentro nascia em x=354 enquanto o cartão vizinho, com borda de
 * 1px dentro da caixa, punha a dele em 355 — um pixel de degrau entre o
 * painel de indicadores e o resto da tela. Com borda, os dois casam. */
.ucam-stats--cartoes .ucam-stat {
  border-radius: var(--ucam-radius-surface);
  box-shadow: none;
  border: 1px solid var(--ucam-color-border-subtle);
}

/* PAINEL ESTREITO: dois por fileira, nunca 3 + 1.
 *
 * A 1024px com a coluna de navegação o painel mede 658px e quatro ladrilhos
 * de 11rem viravam 3 + 1: "Saldo anterior" sozinho na largura inteira, lendo
 * como o mais importante dos quatro — e no modo cartões o quarto cartão
 * ficava órfão numa fileira de três vãos. Estreitar a base para 9rem fazia
 * caber quatro, e aí o rótulo quebrava e o chip "+9% sobre agosto" saía do
 * cartão. Quem decide é o PRÓPRIO grupo (contêiner 'indicadores', declarado
 * em .ucam-stats): abaixo de container.indicadores-em-fileira, um grupo de
 * QUATRO OU MAIS pede metade da fileira por ladrilho e vira 2 + 2. Grupo de
 * três fica como está — os três da mensalidade cabem no corpo de leitura
 * (50rem) e a primeira versão desta regra, presa ao corpo, os quebrava em
 * 2 + 1 numa largura em que cabiam. O :has conta os filhos. */
${contentorAbaixo('indicadores-em-fileira', 'indicadores')} {
  .ucam-stats:has(> :nth-child(4)) > .ucam-stat { flex-basis: calc(50% - var(--ucam-stats-gap)); }
}

/* INDICADOR DENTRO DE MOLDURA: filetes, não outra moldura.
 *
 * O painel de apoio do requerimento (.ucam-aside) já tem filete e raio, e o
 * "Prazo restante" dentro dele vinha com a própria borda e o próprio raio —
 * moldura concêntrica, o defeito que o contrato do cartão nomeia. Dentro de
 * cartão ou de painel de apoio, o grupo de indicadores vira uma faixa entre
 * dois fios e o ladrilho perde o anel; quem emoldura é o de fora. */
.ucam-card .ucam-stats,
.ucam-aside .ucam-stats {
  border: 0;
  border-radius: 0;
  box-shadow: inset 0 1px 0 var(--ucam-color-border-subtle), inset 0 -1px 0 var(--ucam-color-border-subtle);
}

.ucam-card .ucam-stat,
.ucam-aside .ucam-stat {
  box-shadow: none;
  padding-inline: 0;
}

/* O ladrilho que não carregou: traço no valor e, no lugar do contexto, a frase
 * com ícone em tinta de perigo — a palavra carrega o erro, a cor só aponta.
 * Sem botão: quem tenta de novo é a seção (stat.json, state). */
.ucam-stat__erro {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-feedback-danger-foreground);
}

.ucam-stat__erro .ic {
  inline-size: var(--ucam-size-icon-xs);
  block-size: var(--ucam-size-icon-xs);
}

.ucam-stat__meta {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* O tom acompanha SEMPRE um texto — cor sozinha não diz se o número é bom.
 *
 * O TOM PINTA O NÚMERO, E SÓ (ADR-034, 14/09/2026). O ladrilho é sempre
 * branco: "clean, mas com cores semânticas". O fundo tinto durou um dia e
 * transformou o painel gerencial num mosaico de quatro retângulos, em que o
 * número ruim se achava pela cor da caixa e não pelo número. Histórico abaixo.
 *
 * ERA: O TOM PINTA O LADRILHO (ADR-032). Até 13/09/2026 pintava só o número, e o
 * contrato dizia que fundo colorido em quatro ladrilhos vira faixa de cor.
 * Vira, quando os quatro têm cor: a regra que fica é que o tom vem do DADO —
 * um painel de quatro contagens neutras continua branco, e o que carrega
 * julgamento (atrasado, vencido, concluído) ou é o número-título (marca)
 * ganha fundo no degrau 100 e número no 700. Dois sinais, nenhum contorno:
 * o filete de 1px que separa os ladrilhos fica, porque é a grade, não a
 * peça. */
/* O tom MARCA não tem fundo, só o número em bordô. Com fundo, o wine.50 ao
 * lado do red.100 de um ladrilho de perigo lia como o mesmo rosa — é o par de
 * fundos que a ADR-026 declara insatisfazível, medido de novo nas capturas
 * do gerencial em 14/09/2026. O branco com número de marca separa pela
 * superfície. */
/* O TOM PINTA O CONTEXTO, NÃO O NÚMERO (ADR-035, 16/09/2026). O número fica
 * na tinta de texto principal — quatro números coloridos lado a lado disputam
 * entre si, e o olho lê a cor antes do valor. Quem carrega o julgamento é a
 * linha que diz o julgamento em palavra ("em 6 setores", "+9% sobre agosto"),
 * então a cor mora nela: tinta e palavra no mesmo lugar. Os papéis numeral
 * seguem valendo 4,5:1 sobre a superfície, que é o piso do caption. */
.ucam-stat--success :is(.ucam-stat__delta, .ucam-stat__meta) { color: var(--ucam-color-feedback-success-numeral); }
.ucam-stat--warning :is(.ucam-stat__delta, .ucam-stat__meta) { color: var(--ucam-color-feedback-warning-numeral); }
.ucam-stat--danger  :is(.ucam-stat__delta, .ucam-stat__meta) { color: var(--ucam-color-feedback-danger-numeral); }
.ucam-stat--marca   :is(.ucam-stat__delta, .ucam-stat__meta) { color: var(--ucam-color-action-primary-default); }

/* ------------------------------------------------------ filtro rápido --- */
/* Grupo de segmentos para o recorte mais usado da listagem: Todos / Em aberto
 * / Pago.
 *
 * Não é aba e não é select. Aba troca de CONTEÚDO — outra tabela, outras
 * colunas; isto filtra a mesma tabela. Select esconde as opções atrás de um
 * clique, e o valor de um recorte de duas ou três opções está em ver todas de
 * uma vez, com a atual evidente. Acima de quatro segmentos o arranjo deixa de
 * caber e o certo volta a ser o select — está no limite do contrato.
 *
 * O SEGMENTO ESCOLHIDO É TINTA CHEIA NA COR DO TEXTO, e essa é a terceira
 * tentativa. A primeira pintava o trilho de surface.sunken e o escolhido de
 * branco: quatro superfícies numa barra que já tem chip, campo e botão. A
 * segunda tirou o poço e pintou o escolhido de action.primary.subtle — e aí
 * o controle parou de comunicar: #FFF4F4 sobre #FFFFFF é 1,03:1 de diferença
 * de plano, e o que distinguia escolhido de não escolhido virava um rosa que
 * some em qualquer tela um pouco mais clara. Medido na tela de Analytics: o
 * único sinal do estado eram 40 unidades de vermelho num fundo branco.
 *
 * surface.inverse com text.on-action dá 17,7:1 e vira o par nos dois temas
 * ao mesmo tempo — no escuro os dois trocam de lado sozinhos, então não há
 * regra de tema para manter. Não é a marca: bordô cheio aqui roubaria o peso
 * da ação primária da tela (ADR-001), e um filtro não é a ação da tela. O que
 * fica é o mais limpo dos três: um fio em volta, texto em repouso, uma
 * pastilha só pintada. */
.ucam-segmented {
  display: inline-flex;
  align-items: stretch;
  /* A ALTURA É A DO CONTROLE, não a soma dos recuos.
   *
   * O segmented media 37,6px ao lado de um input de 32 e de um botão de 32,
   * na mesma fileira de barra — e ainda nascia 2,8px acima dos dois, porque
   * a altura vinha do padding do botão interno mais o do trilho. Numa barra
   * de ferramentas o olho lê o topo e a base dos controles como uma linha só;
   * 5,6px de sobra quebram as duas. Amarrar em --ucam-size-control-md faz o
   * trilho medir o mesmo que o vizinho por construção, e não por acerto de
   * padding que a próxima mudança de tipo desfaz. */
  block-size: var(--ucam-size-control-md);
  gap: 0.125rem;
  padding: 0.1875rem;
  /* CONTORNO, não poço. O que o trilho precisa dizer é "estes botões são um
   * grupo, e um deles está escolhido" — um fio faz isso sem trazer mais uma
   * superfície para a tela. Com a pastilha cheia por dentro, o fio pode ser o
   * subtle: quem carrega o estado agora é o segmento, não a moldura. */
  background: transparent;
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-control);
}

.ucam-segmented button {
  display: inline-flex;
  align-items: center;
  /* Recuo só na horizontal: a altura é a do trilho menos os 3px de padding, e
   * um padding vertical aqui voltaria a inflar o controle por dentro. */
  padding: 0 0.75rem;
  /* A ALTURA DO SEGMENTO É A CAIXA DE CONTEÚDO DO TRILHO, declarada.
   *
   * Sem estas duas linhas os dois trilhos divergiam em 2px com TODO o resto
   * igual — trilho de 32, borda de 1, recuo de 3 e caixa border-box nos dois,
   * e mesmo assim 24px no Trilho A contra 26 no B. A causa é a base do Trilho
   * B: ela põe min-block-size no <button>, e mínimo vence tamanho usado, então
   * o segmento estourava a caixa do próprio trilho. Zerar o mínimo e declarar
   * a altura faz o segmento caber por construção nos dois. */
  block-size: 100%;
  min-block-size: 0;
  border: 0;
  border-radius: calc(var(--ucam-radius-control) - 0.1875rem);
  background: none;
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: 1;
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* O hover só existe em quem NÃO está escolhido: passar o ponteiro sobre o
 * segmento já escolhido clareando a tinta cheia leria como um estado a menos,
 * não a mais. */
.ucam-segmented button:hover:not([aria-pressed="true"]) {
  background: var(--ucam-color-surface-subtle);
  color: var(--ucam-color-text-primary);
}

/* aria-pressed é o seletor: o que o leitor de tela anuncia é o mesmo que
 * pinta, então não há como marcar um sem marcar o outro. */
/* O ESCOLHIDO FALA A LÍNGUA DO RESTO DO SISTEMA — e não a sua própria.
 *
 * Era tinta cheia em surface-inverse: quase preto, 17:1 sobre o branco. Numa
 * barra de ferramentas isso fazia do FILTRO DE ORDENAÇÃO o elemento mais
 * pesado da tela — mais escuro que o "Concluir" bordô ao lado dele, que é a
 * ação primária, e mais escuro que o título da página. Na tela de analytics a
 * pastilha "Todas" era o primeiro ponto de fixação de toda a página, para
 * dizer que nenhum filtro está aplicado.
 *
 * Trocar por peso não resolveria: o problema não é a intensidade, é a
 * LÍNGUA. Todo estado de escolhido do sistema já se diz com o bordô claro —
 * item de navegação ativo (primary-subtle + tinta primária no ícone), aba
 * ativa (bordô no rótulo), chip de filtro (primary-subtle + bordô). O
 * segmented era o único a dizer "escolhido" com preto, e uma língua a mais
 * para o mesmo conceito é o que faz o olho reaprender a interface a cada
 * barra.
 *
 * Três sinais carregam o estado, e nenhum é só cor: tinta de fundo, cor do
 * rótulo (bordô contra o cinza dos soltos) e peso. O aria-pressed continua
 * sendo o seletor, então o que se pinta é o mesmo que se anuncia. */
.ucam-segmented button[aria-pressed="true"] {
  background: var(--ucam-color-action-primary-subtle);
  color: var(--ucam-color-action-primary-default);
  font-weight: var(--ucam-typography-action-font-weight);
}

/* OS DOIS TAMANHOS, que o contrato declara desde a primeira versão e o Trilho
 * A nunca desenhou. Enquanto só o Angular os tinha, o mesmo componente tinha
 * duas anatomias conforme o trilho — e foi por ali que a divergência de 2px
 * entrou: lá o tamanho mexia no min-block-size do botão, aqui não existia.
 *
 * O tamanho muda a altura do TRILHO. O segmento acompanha por block-size:100%,
 * então não há mínimo para estourar a caixa. */
.ucam-segmented--md { block-size: var(--ucam-size-control-md); }
.ucam-segmented--sm { block-size: var(--ucam-size-control-sm); }
.ucam-segmented--sm button { padding: 0 0.6rem; }

/* ------------------------------------------------------ ação em lote --- */
/* Contrato: data-table.json, prop selectable="multiple".
 *
 * A prop existe no contrato desde a primeira versão e descreve o caso —
 * "encaminhar dez requerimentos ao mesmo setor". O Trilho B desenha a coluna
 * de caixas e o cabeçalho de selecionar tudo desde então; o Trilho A tinha
 * só o tingido da linha ESCOLHIDA (single), que é outra coisa. Faltavam as
 * duas peças que fazem o lote existir: a coluna de seleção e o lugar onde as
 * ações do lote aparecem.
 *
 * POR QUE UMA BARRA QUE PAIRA, e não mais uma fileira na barra de ferramentas:
 * a ação em lote só existe enquanto há seleção, e a seleção se faz rolando a
 * lista. Uma fileira no alto sai de vista no terceiro registro marcado — a
 * pessoa marca dez linhas e sobe de volta para achar o botão. A barra
 * acompanha, e ela é a única peça da listagem que de fato paira: leva
 * elevation.sticky, que é o degrau reservado para isso pela ADR-019.
 *
 * TINTA INVERTIDA porque ela cobre conteúdo. Uma barra branca sobre linhas
 * brancas precisaria de contorno para se separar, e contorno sobre conteúdo é
 * o desenho de recorte colado. O par é o mesmo do segmento escolhido e do
 * balão de dica — surface.inverse com text.on-action —, e é o único par que
 * inverte JUNTO no tema escuro. Tinta de papel semântico (o vermelho de
 * perigo, por exemplo) NÃO serve aqui: ela vira clara no escuro ao mesmo
 * tempo que o fundo vira claro, e o rótulo some. Por isso não há ação
 * pintada de vermelho na barra — quem carrega o peso da ação destrutiva é a
 * confirmação que ela abre, não a cor dentro da barra. */
.ucam-lote {
  position: sticky;
  inset-block-end: var(--ucam-space-inset-md);
  z-index: var(--ucam-z-sticky);
  display: flex;
  /* Quebra antes de sair do cartão: a 390px a barra pedia 450px num cartão
   * de 348 que recorta, e "Limpar" sumia sem sinal. */
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-md);
  inline-size: fit-content;
  max-inline-size: 100%;
  margin-inline: auto;
  /* Em REPOUSO ela ocupa o próprio lugar, entre a tabela e a paginação; é
   * rolando que ela sobe sobre as linhas, pelo sticky. Ela chegou a nascer
   * com uma margem negativa para pairar sempre — e o que isso produziu foi a
   * última linha da tabela permanentemente tapada: numa lista de doze, o
   * décimo segundo registro ficava ilegível justamente enquanto a pessoa
   * escolhia registros. */
  margin-block-start: var(--ucam-space-stack-md);
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  background: var(--ucam-color-surface-inverse);
  color: var(--ucam-color-text-on-action);
  border-radius: var(--ucam-radius-pill);
  box-shadow: var(--ucam-elevation-sticky);
  font-size: var(--ucam-typography-body-sm-font-size);
}

/* A contagem é o assunto da barra, então é ela que fala — e fala em voz alta
 * para quem ouve: o número muda a cada caixa marcada e ninguém volta ao alto
 * da tela para conferir. */
.ucam-lote__contagem {
  margin: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ucam-lote__acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
}

/* O botão da barra não é o .ucam-btn: as variantes do botão são todas
 * calibradas para superfície clara, e reaproveitá-las aqui daria contorno
 * cinza e texto escuro sobre tinta escura. Aqui a tinta é herdada — uma
 * decisão, não uma cópia. */
.ucam-lote__acao {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  min-block-size: var(--ucam-size-control-sm);
  padding-inline: var(--ucam-space-inline-sm);
  border: 0;
  border-radius: var(--ucam-radius-control);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: var(--ucam-typography-label-font-weight);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* O realce do ponteiro sai da PRÓPRIA tinta do texto, diluída: assim ele
 * funciona nos dois temas sem uma segunda declaração, porque quando o fundo
 * inverte a tinta inverte junto. */
.ucam-lote__acao:hover {
  background: color-mix(in srgb, currentColor 16%, transparent);
}

/* O último é a saída, e saída não compete com ação: sem peso, e separado por
 * um fio da mesma tinta diluída. */
/* 24px de altura mínima — WCAG 2.5.8. Ele media 22: dois pixels, e é o
 * único controle das doze telas que ainda reprovava depois da varredura. O
 * mínimo em vez de padding porque o texto sublinhado tem de continuar
 * assentado na mesma linha de base dos irmãos da barra de lote. */
.ucam-lote__limpar {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--ucam-size-icon-lg);
  padding-inline-start: var(--ucam-space-inline-md);
  border-inline-start: 1px solid color-mix(in srgb, currentColor 28%, transparent);
  border-block: 0;
  border-inline-end: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

/* A COLUNA DE SELEÇÃO. Encolhe ao conteúdo e centra a caixa: alinhada ao topo
 * como o resto da célula, ela ficaria dois pixels acima do rótulo da linha
 * quando a linha tem duas linhas de texto. */
.ucam-table .th--selecao,
.ucam-table .td--selecao {
  inline-size: 1px;
  white-space: nowrap;
  vertical-align: middle;
}

/* Na tabela o rótulo é aria-label, não texto — então o gap sobra e sai.
 *
 * O MÍNIMO NÃO SAI JUNTO. Ele saía, e essa linha anulava a 2.5.8 que o
 * componente declara sessenta linhas acima: medido na tabela de naturezas, o
 * alvo ficava 20x20, treze vezes, justamente onde errar o clique seleciona a
 * linha vizinha. Zerar o respiro entre indicador e rótulo é o que esta regra
 * queria; zerar a área de toque foi carona. */
.ucam-table .ucam-check {
  gap: 0;
}

/* ---------------------------------------------------------- toolbar --- */
/* Faixa de busca, filtros e ações em massa acima de uma listagem. */

.ucam-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--ucam-space-inline-sm);
  padding-block-end: var(--ucam-space-stack-md);
}

.ucam-toolbar__spacer { margin-inline-start: auto; }

/* Barra COMPACTA: o rótulo vai para o LADO do controle, não para cima.
 *
 * A barra padrão empilha rótulo sobre controle e alinha tudo pelo rodapé
 * (align-items: end). Isso é certo em formulário — é a ADR-004, rótulo
 * persistente — e é caro em cima de uma listagem: gasta 22px de altura por
 * cima da tabela, e são justamente os 22px que separam a barra do dado que
 * ela filtra.
 *
 * A saída NÃO é esconder o rótulo. A referência põe o rótulo dentro do
 * controle ("Group: Label", "Sort: Newest to Oldest"), o que num <select>
 * nativo só se consegue escrevendo a palavra em cada <option> — e aí o
 * rótulo passa a existir só quando a lista está aberta. Aqui ele deita ao
 * lado: mesma economia de altura, o rótulo continua visível em repouso e o
 * controle continua um <select> de verdade, sem prometer popover que a tela
 * não tem.
 *
 * Vale só nesta barra. Em .ucam-form-row o rótulo continua em cima, porque
 * ali há muitos campos e o rótulo deitado quebraria o alinhamento em três
 * trilhos que a linha de campos existe para manter. */
.ucam-toolbar--compacta {
  align-items: center;
  padding-block: var(--ucam-space-stack-sm);
}

/* Abrindo o corpo, a barra não recua em cima — o corpo já recua — e embaixo
 * dá o vão de bloco inteiro. Com 8px e 8px os filtros de período do Analytics
 * ficavam soltos do topo e grudados nos cartões de indicador (16/09/2026). */
.ucam-corpo > .ucam-toolbar--compacta:first-child {
  padding-block: 0 var(--ucam-space-stack-md);
}

.ucam-toolbar--compacta .ucam-field {
  flex-direction: row;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
}

/* Abaixo de 40rem o rótulo deitado não cabe: "Pesquisar setor" mais o campo
 * somam mais que a largura de um celular, e o campo encolhia até caber três
 * caracteres. O rótulo volta para cima, que é o arranjo padrão da ADR-004 —
 * a barra compacta é uma otimização de tela larga, não uma regra. */
${abaixo('controle-deitado')} {
  .ucam-toolbar--compacta .ucam-field {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ucam-space-stack-sm);
  }
  .ucam-toolbar--compacta .ucam-field .ucam-input,
  .ucam-toolbar--compacta .ucam-field .ucam-select {
    inline-size: 100%;
  }
}

/* O rótulo deitado não quebra: "Situação" em duas linhas ao lado de um
 * controle de 36px desalinha a barra inteira. */
.ucam-toolbar--compacta .ucam-field__label {
  white-space: nowrap;
  color: var(--ucam-color-text-secondary);
}

/* Filete vertical entre GRUPOS de controle da mesma fileira: os filtros de um
 * lado, a exportação do outro; as ações de apoio de um lado, a ação primária
 * do outro. Sem ele, seis controles em fileira leem como seis irmãos de mesmo
 * peso — exatamente o defeito que a evidência do parque registra ("três ações
 * de peso visual idêntico, sem hierarquia").
 *
 * Não é um .ucam-toolbar__sep: o cabeçalho de página tem o mesmo problema com
 * "Exportar" ao lado de "Novo setor", e um elemento BEM preso ao toolbar não
 * poderia ir para lá. Só desenha o filete — o espaço vem do gap de quem o
 * contém. */
/* Some quando a barra quebra.
 *
 * O filete separa dois GRUPOS numa fileira. Quando a fileira vira três
 * fileiras — e abaixo de 40rem ela sempre vira —, ele deixa de estar entre
 * coisa nenhuma e passa a ser um traço vertical solto no meio do vão, que foi
 * exatamente o que apareceu na captura de 390px. Não há como um flex avisar
 * ao CSS que quebrou; há como saber onde ele quebra. */
${abaixo('controle-deitado')} {
  .ucam-sep { display: none; }
}

.ucam-sep {
  inline-size: 1px;
  /* Altura FIXA, não align-self: stretch. Esticado, o filete media a barra
   * inteira — numa barra que tem duas fileiras (filtros em cima, chips
   * aplicados embaixo) ele virava um traço de 60px separando coisas de 36px,
   * e lia como divisão de colunas da tela, não como pausa entre dois grupos
   * de botões. A régua certa é o controle que ele separa. */
  block-size: var(--ucam-size-control-sm);
  align-self: center;
  margin-inline: var(--ucam-space-inline-xs);
  background: var(--ucam-color-border-subtle);
  flex: none;
}

/* Filtro aplicado, removível. Sem isso o usuário não sabe por que a lista
 * está curta — foi o que faltou em toda listagem do parque. */
.ucam-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  /* Mesma altura do selo. O chip tem recuo assimétrico porque carrega o botão
   * de remover à direita — o que muda é a horizontal, nunca a vertical. */
  block-size: var(--ucam-size-marcador);
  padding-block: 0;
  padding-inline: 0.5rem 0.25rem;
  /* CONTORNO de controle, sem tinta da marca. O chip vestia
   * action-primary-subtle com rótulo em bordô: a cada filtro aplicado, mais
   * um uso da marca numa tela que já a gasta na ação primária e no item ativo
   * da navegação — e a nota da caixa de entrada registra que quatro usos do
   * bordô era o que tirava do olho a pista de qual era a ação. O chip é um
   * controle removível, e controle se delimita por border.default, como o
   * campo e o botão secundário ao lado dele. */
  background: var(--ucam-color-surface-default);
  color: var(--ucam-color-text-primary);
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-pill);
  font-size: var(--ucam-typography-caption-font-size);
  white-space: nowrap;
}

.ucam-chip button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.1rem;
  block-size: 1.1rem;
  border: 0;
  border-radius: var(--ucam-radius-pill);
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

/* O ALVO cresce, o desenho não.
 *
 * O botão media 1,1rem — 17,6px, abaixo dos 24×24 que a 2.5.8 exige. Engordar
 * a tinta engordaria o chip inteiro, que é uma peça de densidade: numa fileira
 * de quatro filtros isso custa altura na barra toda. O alvo vem por
 * pseudo-elemento centrado, que ocupa 24px sem ocupar layout — o × continua
 * com 17,6 de mancha e 24 de área clicável. */
.ucam-chip button { position: relative; }

.ucam-chip button::after {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  inline-size: 1.5rem;
  block-size: 1.5rem;
}

.ucam-chip button:hover { background: color-mix(in srgb, currentColor 15%, transparent); }

/* Sem botão, o recuo à direita volta a ser o da esquerda: a folga menor
 * existia para acomodar o x. */
.ucam-chip--fixo { padding-inline: 0.5rem; }

/* neutral é DADO, não escolha: o marcador de pertencimento que veio do
 * registro (os campi de um coordenador), sempre sem botão. Filete mais leve
 * e texto secundário — sem poço cinza, a mesma regra do filtro. */
.ucam-chip--neutral {
  color: var(--ucam-color-text-secondary);
  border-color: var(--ucam-color-border-subtle);
}

.ucam-chip__dimensao { color: var(--ucam-color-text-secondary); }

/* ------------------------------------------------------- painel de apoio --- */
/* O painel que acompanha o conteúdo principal dentro de um .ucam-split.
 * O ARRANJO é o bloco de layout; isto aqui é a superfície do painel. */

/* SEM poço cinza: o painel se delimita por fio, não por tinta.
 *
 * Ele tinha fundo em surface-subtle MAIS filete MAIS raio — preenchimento e
 * contorno empilhados para dizer a mesma coisa. É o desenho que saiu do poço
 * do campo de busca, do trilho do segmented e da faixa atrás dos chips de
 * filtro em 09/09/2026; o painel de apoio ficou de fora daquela varredura só
 * porque nenhuma tela em revisão o mostrava.
 *
 * BRANCO desde 14/09/2026 (ADR-034), e continua branco com o chão de volta ao
 * branco (ADR-040, 19/09). Era transparente para funcionar sobre qualquer
 * superfície; virou branco quando o chão ficou cinza, porque transparente
 * sobre o chão o painel era exatamente o poço cinza com filete que este
 * comentário condena. O chão clareou, o branco fica: o que delimita o painel é
 * o filete, e um fundo DECLARADO é o que garante isso em qualquer hospedeiro —
 * inclusive dentro de um bloco que recue. Superfície é branca, como o cartão. */
.ucam-aside {
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-md);
  padding: var(--ucam-space-inset-md);
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  font-size: var(--ucam-typography-body-sm-font-size);
}

/* TÍTULO DE PAINEL — o quarto degrau da escala de títulos, e um só.
 *
 * A escala é: página 22/560 · seção 16/560 · painel 14/560 · item e rótulo
 * 13/500. Antes o painel tinha três medidas conforme a tela: 13/500 aqui
 * (igual ao rótulo de campo, que é OUTRO papel), 14/560 por style inline nos
 * cartões do caixa e 15/560 por style inline no painel da caixa de entrada.
 * Inventário de 10/09/2026, doze telas. Título de painel é o que encabeça um
 * cartão ou um aside: "Dados do requerimento", "Em caixa", "Atividade". */
.ucam-aside__title,
.ucam-section__title--painel {
  margin: 0;
  font-size: var(--ucam-typography-body-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  line-height: var(--ucam-typography-body-line-height);
  color: var(--ucam-color-text-primary);
}

/* O TÍTULO DO PAINEL E O QUE VEM LOGO DEPOIS. Quando o próximo irmão é um
 * controle — o segmented que filtra a Atividade —, o vão saía ZERO: o título
 * assentava em cima do trilho do filtro e os dois liam como uma peça só
 * (medido na tela de requerimento, 20/09/2026). Onde o próximo é o conteúdo
 * do painel, quem separa é o gap do painel, e este degrau não se aplica. */
.ucam-aside__title + .ucam-segmented,
.ucam-aside__title + .ucam-cluster,
.ucam-aside__title + .ucam-toolbar,
.ucam-section__title--painel + .ucam-segmented {
  margin-block-start: var(--ucam-space-stack-sm);
}

/* A LINHA QUE EXPLICA O PAINEL vem logo abaixo do título, no menor degrau —
 * é a mesma dupla de título e dica da seção, com outro nome de classe porque
 * mora no painel: "Setores com requerimento vencido" e a ressalva de que a
 * situação é de agora, no analytics; "Secretaria Acadêmica" e a contagem de
 * abertos, nos parâmetros. Sem isto, as duas linhas encostam. */
.ucam-aside__title + .ucam-field__hint,
.ucam-aside__title + .ucam-card__apoio,
.ucam-aside__title + .ucam-section__hint,
.ucam-section__title--painel + .ucam-field__hint,
.ucam-section__title--painel + .ucam-card__apoio {
  margin-block-start: var(--ucam-space-inline-xs);
}

/* SELO COM LEGENDA EMBAIXO — "Bloqueado" e o motivo, na célula de situação da
 * listagem de usuários. O selo é inline-flex e a legenda é bloco: sem degrau,
 * o texto encosta na pastilha e lê como parte dela. */
.ucam-badge + .ucam-card__apoio {
  display: block;
  margin-block-start: var(--ucam-space-inline-xs);
}

/* MOLDURA ÚNICA quando o painel é feito de cartões. O movimento de caixa
 * empilha três .ucam-card no aside, e o aside trazia filete, raio e recuo em
 * volta dos três: moldura dentro de moldura, o mesmo defeito que o contrato
 * do card chama de concêntrica e que a tabela dentro do card já corrigiu.
 * Quem é a moldura aqui é cada cartão; o painel devolve a dele. */
.ucam-aside:has(> .ucam-card) {
  /* E devolve o FUNDO também (ADR-034): o painel ficou branco sobre o chão,
   * e um painel de cartões branco pintava uma área sem borda entre e abaixo
   * dos cartões. Quem é superfície aqui é cada cartão. */
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
}

/* Rodapé de ações que acompanha a rolagem em formulário longo. */
.ucam-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ucam-space-inline-sm);
  padding-block-start: var(--ucam-space-inset-md);
  margin-block-start: var(--ucam-space-stack-md);
  /* Fio por sombra: com a borda contada, 16 + 1 + 32 dava 49px de rodapé e a
   * linha de baixo do cartão nascia em meio-pixel. */
  box-shadow: inset 0 1px 0 var(--ucam-color-border-subtle);
}

/* Quem volta fica no início; quem avança, no fim. Um fluxo em etapas precisa
 * do caminho de volta (Nielsen: controle e liberdade), e ele não pode dividir
 * o canto direito com a ação primária — ali o olho procura o "seguir". */
.ucam-form-actions > .ucam-form-actions__inicio { margin-inline-end: auto; }

.ucam-form-actions--sticky {
  position: sticky;
  inset-block-end: 0;
  background: var(--ucam-color-surface-default);
  /* Mantém o fio de cima ao somar a elevação. */
  box-shadow: inset 0 1px 0 var(--ucam-color-border-subtle), var(--ucam-elevation-sticky);
  margin-inline: calc(var(--ucam-space-inset-lg) * -1);
  padding-inline: var(--ucam-space-inset-lg);
  padding-block-end: var(--ucam-space-inset-md);
}

/* ------------------------------------------------------- lista de itens --- */
/* Contrato: list-item.json. A fila de triagem NÃO é tabela: o trabalho ali é
 * decidir o que tratar primeiro, não comparar colunas entre linhas. */

.ucam-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Grade de duas colunas: identidade e conteúdo. O tempo mora na primeira
 * linha do conteúdo, encostado à direita, porque é ele que responde a
 * pergunta "isto ainda espera resposta?" antes mesmo do assunto. */
/* Flex com um EMBRULHO de conteúdo, e não grade de duas colunas.
 *
 * A grade parecia mais direta e não é: a figura precisa atravessar todas as
 * linhas do item, e o item nem sempre tem o mesmo número delas — o setor
 * mostra título e apoio, o requerimento mostra título, apoio e marcadores.
 * Com "span 3" o navegador cria uma linha vazia onde faltava conteúdo, e com
 * "1 / -1" a âncora conta a grade EXPLÍCITA, que aqui não tem linha nenhuma:
 * vira "linha 1 até linha 1" e o resto do conteúdo escorrega para a coluna
 * da figura. Duas caixas, uma delas com os filhos empilhados, não têm essa
 * dependência da contagem. */
.ucam-list-item {
  display: flex;
  gap: var(--ucam-space-inline-sm);
  align-items: flex-start;
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  /* O fio entre itens é sombra interna, não borda: a borda contava no layout
   * e o item de uma linha media 45px (8 + 20 + 8 + 1... com a caixa ímpar
   * centrando o vizinho em x,5) — a causa nº 1 da auditoria de pixel. */
  box-shadow: inset 0 -1px 0 var(--ucam-color-border-subtle);
  color: var(--ucam-color-text-primary);
  text-decoration: none;
  position: relative;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-list-item:last-child { box-shadow: none; }

/* LISTA DENTRO DE CARTÃO COM RECUO. A linha traz o próprio recuo de 16px e
 * o cartão também: o texto nascia a 32px da borda, 16 à direita do ladrilho e
 * do título que o cabeçalho põe a 16 — duas prumadas no mesmo cartão. A lista
 * sangra até a borda (os fios vão de ponta a ponta, como no cartão de padding
 * 0), o texto volta à prumada do cabeçalho, e o pé desconta o recuo da última
 * linha para o ar de baixo igualar o de cima (catálogo de relatórios,
 * 16/09/2026). */
.ucam-card > .ucam-card__cabecalho ~ .ucam-list {
  margin-inline: calc(-1 * var(--ucam-space-inset-md));
}
.ucam-card > .ucam-card__cabecalho ~ .ucam-list:last-child {
  margin-block-end: calc(-1 * var(--ucam-space-inset-md));
}

/* O item é frequentemente um link que embrulha a linha inteira. Sem isto ele
 * herdaria o azul de link do navegador e levaria junto o traçado dos ícones,
 * que pintam por currentColor — o mesmo defeito já corrigido no cartão. */
a.ucam-list-item { color: var(--ucam-color-text-primary); }

.ucam-list-item:hover { background: var(--ucam-color-interaction-hover); }

/* Pressionado só onde há o que pressionar: a linha que é link, ou a que
 * embrulha um. O <li> inerte não reage, e um degrau no clique ali prometeria
 * uma ação que não existe. O contrato declarava active desde o início e
 * nenhum dos dois trilhos o desenhava (revisão de estados, 13/09/2026). */
a.ucam-list-item:active,
.ucam-list-item:has(> a:active) {
  background: var(--ucam-color-interaction-active);
}

.ucam-list-item:focus-visible {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: calc(var(--ucam-focus-ring-offset) * -1);
}

/* O escolhido se diz pela SUPERFÍCIE, e só por ela.
 *
 * Era "um cartão que sobe para surface-default" — e no tema claro isso nunca
 * foi visível: a lista já está em branco ou em surface-subtle (#F8FAFC), e
 * subir para #FFFFFF é um degrau de 1,02:1. Quem marcava a linha aberta era a
 * barra de 3px, que saiu na ADR-022; sem ela a seleção sumiu, e a captura
 * de 09/09/2026 mostrou. A tinta alfa de seleção é o mesmo valor do item
 * escolhido da navegação e do avatar: compõe sobre qualquer fundo e dá o
 * mesmo degrau nos dois temas. Bordô aqui — mesmo o 50 — poria a marca a
 * significar localização em vez de ação, e no escuro o wine.900 leria como
 * uma linha em alerta. */
/* O ESCOLHIDO DA LISTA: realce tinto e uma barra de 4px na borda de entrada.
 *
 * Era fundo cinza — interaction-selected —, o mesmo cinza translúcido do
 * hover, um degrau acima. Numa coluna de oito grupos isso não dizia qual
 * estava aberto: dizia qual estava sob o ponteiro há um instante. E cinza em
 * superfície é o que o sistema já tirou de cartão, selo e filtro.
 *
 * A barra NÃO contradiz a ADR-022, que tirou a barra de 3px da caixa de
 * entrada: lá ela repetia o TOM que o selo da linha já dizia, e sobravam
 * quatro portadores de cor por linha. Aqui ela diz SELEÇÃO — existe uma por
 * lista, nunca uma por linha, e é a única coisa colorida do item escolhido
 * além do próprio realce. É também o sinal que sobrevive ao tema escuro, em
 * que 9% de tinta sobre superfície quase não se vê.
 *
 * 4px e não 3: a barra encosta na borda arredondada da lista, e abaixo disso
 * o raio come metade dela. */
.ucam-list-item[aria-current="true"] {
  position: relative;
  background: var(--ucam-color-action-primary-subtle);
}

.ucam-list-item[aria-current="true"]::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 4px;
  background: var(--ucam-color-action-primary-default);
  pointer-events: none;
}

/* A BARRA DE 3px NA BORDA SAIU (ADR-022).
 *
 * Ela existia "para a primeira passada do olho", e o contrato do tom mandava
 * o selo de situação continuar ao lado. O resultado era o mesmo estado dito
 * duas vezes na mesma linha — barra vermelha E pastilha vermelha — e, com o
 * avatar tinto e o prazo tinto, uma linha da fila chegava a QUATRO portadores
 * de cor. Numa lista de nove, isso é uma coluna de sinais em que nenhum
 * discrimina mais nada. Medido na caixa de entrada em 09/09/2026.
 *
 * Quem carrega o tom agora é o marcador — selo ou prazo — que já tem a
 * palavra ao lado (WCAG 1.4.1) e que continua sendo o único lugar da linha
 * com cor. O escolhido se diz pela SUPERFÍCIE, que é o único sinal que lhe
 * cabe, e o data-tone deixa de pintar qualquer coisa: seguir aceitando-o na
 * marcação sem efeito seria mentir por atributo. */

.ucam-list-item__figura { flex: none; }

/* O ITEM QUE ESCOLHE — lista que governa o painel ao lado (Grupo × Menu).
 *
 * O alvo é um BOTÃO dentro do <li>, e não o <li> com role e tabindex à mão:
 * escolher um grupo não navega, então não é link; e um <li> com onclick não
 * responde a Enter, não entra na ordem de tabulação e não se anuncia como
 * controle. O botão toma o recuo do item para que a área de clique seja a
 * linha inteira — o item cede o dele.
 *
 * aria-pressed acompanha o aria-current do <li>: o primeiro é o estado do
 * CONTROLE, o segundo é o do item dentro da lista, e a folha pinta pelo
 * segundo. */
.ucam-list-item:has(> .ucam-list-item__alvo) { padding: 0; }

.ucam-list-item__alvo {
  display: flex;
  inline-size: 100%;
  gap: var(--ucam-space-inline-sm);
  align-items: flex-start;
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  background: none;
  border: 0;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;
  border-radius: inherit;
}

.ucam-list-item__alvo:hover {
  background-image: linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover));
}

/* O anel é do ITEM, não do botão: o botão ocupa a linha toda e um contorno
 * por dentro do fio da lista lê como campo. */
.ucam-list-item:has(> .ucam-list-item__alvo:focus-visible) {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: calc(-1 * var(--ucam-focus-ring-width));
}
.ucam-list-item__alvo:focus-visible { outline: none; }

.ucam-list-item__corpo {
  flex: 1;
  /* Sem isto o item de flex adota a largura do conteúdo e o texto longo
   * empurra a hora para fora em vez de truncar. */
  min-inline-size: 0;
}

.ucam-list-item__linha {
  display: flex;
  align-items: baseline;
  gap: var(--ucam-space-inline-sm);
}

.ucam-list-item__titulo {
  /* Bloco, não inline. Sozinho dentro do corpo (catálogo de relatórios) o
   * span de 13px com entrelinha de 20 alinhava pela base com o strut de 14px
   * do pai e a caixa de linha saía com 21px: item de 45, o fio do vizinho em
   * meio-pixel. Dentro de .ucam-list-item__linha ele já era item de flex, e
   * lá nada muda. */
  display: block;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  margin: 0;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* TÍTULO QUE É LINK, sem .ucam-link: a linha inteira é o alvo. Numa lista
 * de destinos (os relatórios de um assunto) o link sublinhado e azul só na
 * linha que tem tela fazia uma parecer diferente das irmãs pelo motivo
 * errado — a diferença é poder abrir, não ser outro tipo de coisa. O
 * pseudo-elemento estica o alvo sobre o <li> (que já é position: relative),
 * o hover da linha diz que ela abre, e o foco desenha o anel na linha, não
 * em volta de duas palavras (catálogo de relatórios, 16/09/2026). */
a.ucam-list-item__titulo:not(.ucam-link) {
  color: inherit;
  text-decoration: none;
}
a.ucam-list-item__titulo:not(.ucam-link)::after {
  content: "";
  position: absolute;
  inset: 0;
}
a.ucam-list-item__titulo:not(.ucam-link):focus-visible { outline: none; }
.ucam-list-item:has(> .ucam-list-item__corpo > a.ucam-list-item__titulo:not(.ucam-link):focus-visible) {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: calc(var(--ucam-focus-ring-offset) * -1);
}
.ucam-list-item:has(> .ucam-list-item__corpo > a.ucam-list-item__titulo:not(.ucam-link):active) {
  background: var(--ucam-color-interaction-active);
}

/* Empurrado por margin auto, não por um spacer vazio: o tempo é o último
 * elemento da linha e precisa continuar sendo lido depois do nome. */
.ucam-list-item__tempo {
  margin-inline-start: auto;
  flex: none;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.ucam-list-item__apoio {
  /* Bloco, e não inline: overflow e text-overflow não têm efeito nenhum em
   * caixa inline, e o assunto longo escapava do painel em vez de truncar. */
  display: block;
  margin: 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-list-item__marcadores {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  flex-wrap: wrap;
  margin-block-start: 0.375rem;
}

/* Ponto de não lido. A forma acompanha SEMPRE um texto em ucam-sr-only —
 * um círculo de 8px não informa nada sozinho.
 *
 * Mora no RECUO INICIAL da linha, fora do fluxo, e não reserva espaço.
 * Até 13/09/2026 ficava à direita, e a linha não lida ganhava 1rem de
 * padding-inline-end para abrigá-lo: o tempo dela recuava 16px e deixava de
 * alinhar com o das vizinhas. Numa fila em que parte é não lida, a coluna da
 * hora serrilhava, e a hora é justamente o que se lê em coluna. No recuo
 * inicial o ponto não disputa lugar com nada: figura, título e tempo ficam
 * no mesmo x em toda linha, lida ou não. Centro horizontal no recuo
 * ((inset-md - 8px) / 2) e vertical na linha do título (inset-sm + (20 - 8) / 2).
 * Era 0.875rem cravado, conta feita com recuo de 8px: com o inset-sm de 12 o
 * ponto ficava 4px acima do centro do título. */
.ucam-list-item__indicador {
  position: absolute;
  inset-block-start: calc(var(--ucam-space-inset-sm) + 0.375rem);
  inset-inline-start: calc((var(--ucam-space-inset-md) - 0.5rem) / 2);
  pointer-events: none;
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-action-primary-default);
}

/* ------------------------------------------------------------ descrição --- */
/* Contrato: description-list.json. Substitui o campo de formulário
 * DESABILITADO que o legado usa para mostrar dado — caixa cinza com borda de
 * input, cursor bloqueado, para informação que ninguém pretende editar. */

.ucam-descricao {
  /* Default DECLARADO, nunca escondido no fallback de um var(): o fallback
   * some da leitura e a declaração é a documentação do botão de ajuste. */
  --ucam-descricao-cols: auto-fit;
  --ucam-descricao-min: 12rem;
  /* O vão ENTRE colunas, numa variável só: ele entra no gap e na conta do
   * mínimo de --2 e --3, e foram justamente duas referências diferentes ao
   * mesmo espaço que fizeram --3 nunca fechar três colunas. */
  --ucam-descricao-vao: var(--ucam-space-inset-lg);
  display: grid;
  grid-template-columns: repeat(var(--ucam-descricao-cols), minmax(var(--ucam-descricao-min), 1fr));
  /* PROXIMIDADE (20/09/2026). O vão ENTRE pares era 8px e o vão DENTRO do par
   * — rótulo para valor — é 2px mais a entrelinha: perto demais um do outro
   * para o olho fechar o grupo. Numa grade de seis pares em três colunas, o
   * resultado é um bloco de texto onde deviam estar seis itens, e a leitura
   * vira "ler tudo" em vez de "achar o Prazo".
   *
   * 16px entre linhas (stack-md) e 20px entre colunas (inset-lg): o vão entre
   * pares passa a ser o dobro do que era, muito acima dos 2px de dentro do
   * par, e a coluna vizinha deixa de encostar no valor mais longo. O par
   * continua sendo a unidade. */
  gap: var(--ucam-space-stack-md) var(--ucam-descricao-vao);
  margin: 0;
}

/* --2 e --3 são TETO de colunas, não contagem fixa.
 *
 * "repeat(3, minmax(12rem, 1fr))" são 36rem mais vãos, cravados: no detalhe
 * do setor a 1024px o painel media 34rem e a terceira coluna ("SLA médio")
 * saía pela borda direita, cortada ao meio, sem rolagem. O mínimo de cada
 * coluna passa a ser o maior entre 12rem e a fatia de 1/N do painel: em
 * painel largo dá exatamente N colunas; em painel estreito dá quantas
 * cabem, e os pares que sobram descem de linha.
 *
 * A FATIA TEM DE DESCONTAR O VÃO QUE A GRADE APLICA. A primeira versão desta
 * conta subtraía inline-md (16px) enquanto o gap era inset-lg (20px), e o
 * erro de 4px por vão bastava: três colunas de (100% - 2*16)/3 mais dois vãos
 * de 20px somam 100% + 8px, não cabem, e o auto-fit devolvia DUAS. Medido a
 * 1440px com a lista em 747px e folga para três. O 1px a mais é a margem
 * contra o arredondamento sub-pixel do próprio navegador, que a fatia exata
 * não perdoa. */
.ucam-descricao--1 { --ucam-descricao-cols: 1; }
.ucam-descricao--2 { --ucam-descricao-min: max(12rem, calc((100% - 1 * var(--ucam-descricao-vao) - 1px) / 2)); }
.ucam-descricao--3 { --ucam-descricao-min: max(12rem, calc((100% - 2 * var(--ucam-descricao-vao) - 1px) / 3)); }

/* O PAR é o item da grade, não o rótulo e o valor soltos.
 *
 * Sem o embrulho, uma grade de três colunas distribui dt, dd, dt, dd na
 * ordem do documento: o rótulo cai numa coluna e o valor na seguinte, e o
 * olho pareia errado — foi exatamente o que apareceu na primeira captura da
 * tela de requerimento. O div entre dl e dt/dd é HTML válido desde a 5.2 e
 * não muda a associação semântica. */
.ucam-descricao__par { min-inline-size: 0; }

.ucam-descricao__rotulo {
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
  color: var(--ucam-color-text-secondary);
  margin: 0 0 0.125rem;
}

/* 13/500: o valor pesa mais que o rótulo (12/400 secundário) por UM degrau
 * de tamanho, um de peso e um de cor — a mesma régua do item de lista e do
 * rótulo de campo. Era 14/400 no arranjo padrão, 14/500 no de valores e
 * 13/400 no painel: três medidas para o mesmo papel, e a de 14 era o único
 * texto corrido da tela maior que a célula de tabela ao lado. */
.ucam-descricao__valor {
  margin: 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: var(--ucam-typography-body-sm-line-height);
  color: var(--ucam-color-text-primary);
}

.ucam-descricao__valor--warning { color: var(--ucam-color-feedback-warning-foreground); }
.ucam-descricao__valor--danger  { color: var(--ucam-color-feedback-danger-foreground); }

/* O par que ocupa a linha inteira — endereço, justificativa curta. */
.ucam-descricao__par--largo { grid-column: 1 / -1; }

/* Deitado: rótulo e valor na mesma linha, valores alinhados em coluna.
 * Só serve com rótulos de comprimento parecido — está no limite do contrato. */
.ucam-descricao--inline {
  --ucam-descricao-cols: 1;
  gap: var(--ucam-space-inline-sm);
}

.ucam-descricao--inline .ucam-descricao__par {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--ucam-space-inline-md);
  align-items: baseline;
}

.ucam-descricao--inline .ucam-descricao__rotulo { margin: 0; }

/* PAINEL: uma linha por par, ícone e rótulo numa coluna de largura fixa,
 * valor na outra.
 *
 * É a coluna lateral do registro nos produtos do gênero — "Record details" do
 * Attio, as propriedades do Notion. Difere do inline em dois pontos que o
 * inline não consegue: a coluna do rótulo tem largura DECLARADA, e por isso
 * "Polo" e "Setor responsável" alinham os valores na mesma prumada sem que o
 * rótulo mais longo dite a coluna; e o rótulo leva um ícone, que é o que faz
 * a varredura vertical achar "Prazo" entre doze pares sem ler os doze.
 *
 * O ícone é decorativo e aria-hidden: o rótulo é o dt, e é ele que o leitor
 * de tela lê. Ícone sem rótulo aqui é adivinhação. */
.ucam-descricao--painel {
  --ucam-descricao-cols: 1;
  /* 8.5rem é o que "Setor responsável" com ícone ocupa a 13px; numa coluna de
   * 22rem sobra ~10rem para o valor, o bastante para "Secretaria Acadêmica"
   * numa linha. Rótulo mais longo que isso vira reticência — e é sinal de
   * que o nome do campo está longo demais. */
  --ucam-descricao-rotulo: 8.5rem;
  gap: 0;
}

/* A LINHA do painel tem altura de linha de lista, não de rótulo.
 *
 * Eram 28px cravados e vão zero entre pares: seis propriedades empilhadas sem
 * nenhum ar, e o olho lia um parágrafo de duas colunas. Medido em 20/09/2026
 * na coluna do requerimento — 28, 28, 28, encostadas.
 *
 * Agora o respiro vem do PAR, e não de um gap da lista: recuo em cima e
 * embaixo mais piso de 36px. Assim a linha que ganha um valor de duas linhas
 * (Setor responsável) cresce sem descolar as vizinhas, que é o que um gap
 * fixo não sabe fazer. */
.ucam-descricao--painel .ucam-descricao__par {
  display: grid;
  grid-template-columns: var(--ucam-descricao-rotulo) minmax(0, 1fr);
  gap: var(--ucam-space-inline-sm);
  align-items: center;
  padding-block: var(--ucam-space-inline-xs);
  min-block-size: 2.25rem;
}

/* O fio entre propriedades, e não em volta delas: ele diz onde um item acaba
 * e o outro começa sem desenhar caixa nenhuma. Fica no par de CIMA para
 * baixo, então a lista não abre nem fecha com fio solto — é a mesma regra do
 * fio da linha de lista. */
.ucam-descricao--painel .ucam-descricao__par + .ucam-descricao__par {
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

.ucam-descricao--painel .ucam-descricao__rotulo {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  margin: 0;
  font-size: var(--ucam-typography-caption-font-size);
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-descricao--painel .ucam-descricao__valor { min-inline-size: 0; }

.ucam-descricao__icone {
  flex: none;
  color: var(--ucam-color-text-placeholder);
}

/* O par escondido atrás do "mostrar todos". O atributo hidden perde para o
 * display:grid do par acima, então a regra existe para ele voltar a valer. */
.ucam-descricao__par[hidden] { display: none; }

/* "Mostrar todos os N valores": botão fantasma na largura do rótulo, no fim
 * da lista. O número faz parte do rótulo do botão porque é a única pista de
 * QUANTO está escondido — "Mostrar mais" sem número obriga a abrir para
 * descobrir se vale a pena. Quando aberto vira "Mostrar menos", e a lista
 * volta ao corte; o estado mora no aria-expanded. */
.ucam-descricao__mais {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  margin-block-start: var(--ucam-space-inline-xs);
  background: none;
  border: 0;
  padding: 0;
  min-block-size: var(--ucam-size-control-sm);
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
  cursor: pointer;
  border-radius: var(--ucam-radius-control-sm);
}

.ucam-descricao__mais:hover { color: var(--ucam-color-text-primary); }

.ucam-descricao__mais .ucam-nav__chevron { margin: 0; }
.ucam-descricao__mais[aria-expanded="true"] .ucam-nav__chevron { transform: rotate(180deg); }

/* ----------------------------------------------------------- linha do tempo --- */
/* Contrato: timeline.json. Duas naturezas de item, distinguidas por FORMA e
 * pelo papel escrito: fala de gente e mudança de estado. Na tabela de
 * histórico do legado as duas são idênticas e é preciso ler o texto inteiro
 * para saber qual é qual. */

.ucam-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ucam-timeline__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--ucam-space-inline-sm);
}

/* O trilho é uma coluna que se estica: o nó no topo e a linha ocupando o
 * resto da altura do item. Como o item seguinte encosta, a linha parece
 * contínua sem precisar de altura calculada em lugar nenhum. */
.ucam-timeline__trilho {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 0.25rem separava o disco da linha e criava um degrau visível entre os
   * dois. Encostados, disco e linha leem como uma peça só — que é o que a
   * linha do tempo desenha: um fio contínuo com paradas. */
  gap: 0;
}

/* O DISCO DO EVENTO — sem anel.
 *
 * Medido a 3x na tela de requerimento: três discos empilhados em 200px, cada
 * um com anel de 1px em cor cheia — âmbar, azul, verde. O anel é a peça mais
 * escura do painel inteiro, mais forte que o filete que separa as seções, e
 * some três vezes em cores diferentes numa coluna só. Pior: o âmbar, que é o
 * mais gritante dos três, marca a troca de situação — o evento MENOS
 * importante da lista, porque o mesmo dado já está escrito ao lado em duas
 * pílulas.
 *
 * Sem anel, o que resta é um disco de tinta clara com o ícone na cor do tom.
 * O tom continua lá, o peso óptico dos três se iguala, e o que passa a
 * ordenar a coluna é a hierarquia de texto — que é onde a informação está.
 *
 * 1.75rem e não 1.5: o ícone dentro media 16px numa caixa de 24, encostando
 * nas bordas. Com 28px de caixa e ícone de 14 sobra o respiro que fazia falta,
 * e o disco passa a casar com a altura da linha do cabeçalho (ver abaixo). */
.ucam-timeline__no {
  inline-size: 1.75rem;
  block-size: 1.75rem;
  border-radius: var(--ucam-radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  background: var(--ucam-color-surface-sunken);
  color: var(--ucam-color-text-secondary);
  border: 0;
}


/* O tom entra por FUNDO e TINTA DO ÍCONE, nunca por contorno. Duas
 * propriedades, não três — e sem a terceira os quatro tons passam a pesar o
 * mesmo, que é a condição para a cor informar sem gritar. */
.ucam-timeline__no--info    { background: var(--ucam-color-feedback-info-background);    color: var(--ucam-color-feedback-info-foreground); }
.ucam-timeline__no--success { background: var(--ucam-color-feedback-success-background); color: var(--ucam-color-feedback-success-foreground); }
.ucam-timeline__no--warning { background: var(--ucam-color-feedback-warning-background); color: var(--ucam-color-feedback-warning-foreground); }
.ucam-timeline__no--danger  { background: var(--ucam-color-feedback-danger-background);  color: var(--ucam-color-feedback-danger-foreground); }

.ucam-timeline__linha {
  inline-size: 1px;
  flex: 1;
  min-block-size: 0.75rem;
  background: var(--ucam-color-border-subtle);
}

.ucam-timeline__conteudo {
  padding-block-end: var(--ucam-space-stack-md);
  min-inline-size: 0;
}

.ucam-timeline__item:last-child .ucam-timeline__conteudo { padding-block-end: 0; }

/* O CABEÇALHO CENTRA CONTRA O DISCO, e não contra a linha de base.
 *
 * Com align-items: baseline o nome do autor assentava ~6px abaixo do centro
 * do disco: a coluna da esquerda e a da direita começavam em alturas
 * diferentes, e o efeito somava a cada evento. A altura mínima é a do disco,
 * então as duas colunas partem do mesmo eixo sem ninguém compensar à mão.
 *
 * O baseline continua valendo DENTRO da fileira — é o que alinha o nome com a
 * pílula de papel e com a hora. O que mudou é o eixo do conjunto. */
.ucam-timeline__cabecalho {
  /* MARGEM ZERADA, e é ela que estava desalinhando a coluna.
   *
   * O cabeçalho é um <p>, e o @ucam/css não tem reset global por contrato —
   * cada classe zera a margem do elemento que ela veste. Esta não zerava, e o
   * 1em do navegador entrava como 13px acima do nome: o disco assentava no topo
   * do evento e o autor 13px abaixo dele, a cada evento da lista. Medido:
   * centro do disco em 358, centro do cabeçalho em 371.
   *
   * Foi o que fez o alinhamento por min-block-size parecer não funcionar — ele
   * funcionava, só estava alinhando uma caixa que já nascia empurrada. */
  margin: 0;
  display: flex;
  align-items: center;
  min-block-size: 1.75rem;
  gap: var(--ucam-space-inline-xs);
  flex-wrap: wrap;
  font-size: var(--ucam-typography-body-sm-font-size);
}

.ucam-timeline__autor {
  font-weight: var(--ucam-typography-label-font-weight);
  color: var(--ucam-color-text-primary);
}

/* O papel é o que separa fala de gente de mudança de estado NA LEITURA, e por
 * isso é texto e não só a forma do nó. */
/* PAPEL não é SITUAÇÃO, e não pode pesar como ela.
 *
 * "Atendente" e "Aluno" saíam em pílula contornada — a mesma forma, o mesmo
 * raio e quase o mesmo peso de "Aguardando análise" e "Em análise", que estão
 * a 20px de distância na mesma coluna. Duas informações de natureza diferente
 * com uma só aparência: quem varre não sabe qual das duas está lendo.
 *
 * O papel é adjetivo do autor — vive colado ao nome, em tinta calma e sem
 * contorno. A situação é o FATO do evento, e fica com a pílula contornada só
 * para ela.
 *
 * SEM FUNDO, desde a ADR-036. A pastilha cinza era o único preenchimento do
 * cabeçalho e repetia-se a cada item: numa coluna de cinco eventos, cinco
 * manchas cinza competindo com os nós tintos. Agora o papel é só texto,
 * separado do nome por um ponto médio — "Marina Duarte · Atendente", como
 * se escreve. O ponto é decorativo e tem texto alternativo vazio. */
.ucam-timeline__papel {
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
  /* Mesma altura de marcador do selo e do chip — ver .ucam-stat__delta. O
   * papel do autor vive na MESMA linha que o nome e que o selo de situação;
   * sem altura declarada ele fechava 20,4px ao lado de peças de 22 e a linha
   * inteira perdia a base comum. */
  display: inline-flex;
  align-items: center;
  block-size: var(--ucam-size-marcador);
}

.ucam-timeline__papel::before {
  content: '·';
  content: '·' / '';
  margin-inline-end: var(--ucam-space-inline-xs);
}

.ucam-timeline__tempo {
  margin-inline-start: auto;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* O par DE e PARA da mudança de situação.
 *
 * Os selos usam os MESMOS nomes que a coluna Situação da listagem: inventar
 * sinônimo aqui faz o histórico divergir da lista que ele explica. A seta é
 * decorativa — quem ouve a página recebe a frase, não o desenho. */
.ucam-timeline__transicao {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  flex-wrap: wrap;
  margin-block-start: 0.375rem;
}

.ucam-timeline__seta {
  color: var(--ucam-color-text-placeholder);
  flex: none;
}

.ucam-timeline__corpo {
  margin: 0.375rem 0 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
}

/* MENSAGEM É FALA CITADA, NÃO BALÃO (ADR-036).
 *
 * O balão era um retângulo cinza com contorno — a peça mais pesada da coluna,
 * e fundo cinza em peça de conteúdo, que o sistema evita em cartão, selo e
 * filtro. O que ele dizia era "alguém falando, não o sistema registrando", e
 * isso uma forma mais leve diz igual: o filete à esquerda de citação, em tinta
 * primária, contra o evento em tinta secundária e sem filete. A diferença
 * continua sendo de FORMA e de papel escrito, nunca só de cor.
 *
 * Vale nas duas densidades. Na compacta o balão já tinha saído, e com ele a
 * forma: mensagem e evento viravam a mesma linha cinza. O filete cabe em 20rem. */
.ucam-timeline__corpo--mensagem {
  border-inline-start: 2px solid var(--ucam-color-border-default);
  padding-inline-start: var(--ucam-space-inset-sm);
  color: var(--ucam-color-text-primary);
}

.ucam-timeline--compacta .ucam-timeline__conteudo { padding-block-end: var(--ucam-space-stack-sm); }

/* ------------------------------------------------------------ citação --- */
/* A fala de uma pessoa solta no corpo do registro — o pedido do requerente.
 * Veste a MESMA superfície da mensagem da linha do tempo porque é o mesmo
 * fato, alguém falando; mas tem classe própria. Antes o blockquote emprestava
 * .ucam-timeline__corpo--mensagem e acertava a margem com estilo inline, e
 * qualquer mudança no balão da linha do tempo mudaria o pedido junto.
 *
 * Desde a ADR-036 as duas perderam o fundo cinza e o contorno pelo mesmo
 * filete de citação à esquerda — decidido junto, nas duas classes. */
.ucam-citacao {
  margin: 0;
  border-inline-start: 2px solid var(--ucam-color-border-default);
  padding-block: 0.125rem;
  padding-inline: var(--ucam-space-inset-sm) 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-primary);
}

figure:has(> .ucam-citacao) { margin: 0; }

.ucam-citacao__autoria {
  margin-block-start: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* O PERÍODO: o rótulo de ano ou de dia que corta a lista.
 *
 * Um histórico de dois anos é uma coluna de "há 1 ano" repetido. O período
 * devolve o eixo do tempo à leitura: quem procura o que aconteceu em 2025
 * pula para o corte, em vez de ler cada hora relativa. É um item da lista
 * de verdade — <li>, com o texto "2025" — e não um separador aria-hidden: o
 * leitor de tela também precisa do corte, e anunciá-lo como item de lista é
 * honesto sobre o que ele é. O trilho continua atravessando o período, para
 * a linha não quebrar em cada ano. */
.ucam-timeline__grupo {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--ucam-space-inline-sm);
}

.ucam-timeline__grupo .ucam-timeline__trilho {
  /* A largura do nó, para a linha seguir na mesma prumada. */
  inline-size: 1.75rem;
  align-items: center;
}

/* O trilho do período é só a linha, sem nó: um disco a mais diria que o ano
 * é um acontecimento, e ele é o rótulo dos acontecimentos. A largura é a do
 * nó, para a linha continuar na mesma prumada. */
.ucam-timeline__grupo .ucam-timeline__linha {
  flex: 1;
  min-block-size: var(--ucam-space-stack-md);
}

.ucam-timeline__periodo {
  margin: 0;
  padding-block: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  color: var(--ucam-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ucam-timeline__grupo:first-child .ucam-timeline__periodo { padding-block-start: 0; }

/* A FASE: o corte por situação do registro, não por data (ADR-036).
 *
 * O requerimento vive de fases — aberto, em análise, concluído — e o que
 * quem atende pergunta ao histórico é "o que aconteceu desde que entrou em
 * análise?", não "o que aconteceu na terça". Mesma peça do período, com um
 * marco no trilho: a fase é um trecho do caminho, e o marco diz onde ele
 * começa. O marco é menor que o nó e sem ícone, para não ler como um
 * acontecimento a mais.
 *
 * O trilho da fase tem linha ANTES e DEPOIS do marco, para o fio atravessar.
 * A primeira fase da lista esconde o trecho de cima — nada vem antes dela. */
.ucam-timeline__grupo--fase .ucam-timeline__trilho { gap: 0; }

.ucam-timeline__grupo--fase .ucam-timeline__linha:first-child {
  flex: none;
  min-block-size: 0;
  block-size: 0.625rem;
}

.ucam-timeline__grupo--fase:first-child .ucam-timeline__linha:first-child { visibility: hidden; }

.ucam-timeline__marco {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  flex: none;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-border-strong);
}

.ucam-timeline__grupo--fase .ucam-timeline__periodo {
  padding-block: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
}

.ucam-timeline__grupo--fase:first-child .ucam-timeline__periodo {
  padding-block-start: var(--ucam-space-inline-xs);
}

/* AS ETAPAS de um acontecimento que ainda está em curso (ADR-036).
 *
 * Encaminhar à coordenação abre um trâmite com passos conhecidos — recebido,
 * parecer, devolução. Sem as etapas, o histórico diz "encaminhado há 2 dias"
 * e quem atende não sabe se o parecer já saiu. Três estados, cada um com
 * forma própria: ✓ feita, ponto cheio na atual, ponto vazado na pendente. A
 * tinta acompanha, mas a forma basta — e o estado é dito em texto para quem
 * ouve.
 *
 * Feita NÃO é riscada: riscado lê como cancelado (ver .ucam-timeline__anterior).
 * Pendente usa tinta secundária e não placeholder: é texto a ler, e o
 * placeholder não passa 4,5:1. */
.ucam-timeline__etapas {
  list-style: none;
  margin: 0.375rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.125rem;
  font-size: var(--ucam-typography-body-sm-font-size);
}

.ucam-timeline__etapa {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  min-block-size: var(--ucam-size-contagem);
  color: var(--ucam-color-text-secondary);
}

.ucam-timeline__etapa-marca {
  inline-size: 1rem;
  block-size: 1rem;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ucam-timeline__etapa--feita .ucam-timeline__etapa-marca { color: var(--ucam-color-feedback-success-foreground); }

.ucam-timeline__etapa--atual { color: var(--ucam-color-text-primary); font-weight: var(--ucam-typography-label-font-weight); }

.ucam-timeline__etapa--atual .ucam-timeline__etapa-marca::before,
.ucam-timeline__etapa--pendente .ucam-timeline__etapa-marca::before {
  content: '';
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: var(--ucam-radius-pill);
}

/* O ponto da ATUAL é informação, não marca. Ele usava a tinta da ação
 * primária, e o bordô no meio de uma lista que só se lê promete o que um
 * ponto não cumpre: a cor da marca é do que se CLICA — o botão principal
 * da tela —, e aqui ela competia com ele a três dedos de distância.
 *
 * A trinca fica semântica e cinza, que é o que esses três estados são:
 * sucesso no visto da feita, informação no ponto cheio da que está em
 * curso, contorno de borda na pendente. Mesma leitura do selo de situação
 * na coluna ao lado, e a forma continua bastando sem cor nenhuma. (ADR-041) */
.ucam-timeline__etapa--atual .ucam-timeline__etapa-marca::before { background: var(--ucam-color-feedback-info-foreground); }
.ucam-timeline__etapa--pendente .ucam-timeline__etapa-marca::before { border: 1.5px solid var(--ucam-color-border-strong); }

/* O FILTRO por natureza: Todos, Mensagens, Tramitação (ADR-036).
 *
 * O controle é um .ucam-segmented comum, fora da lista; o que a lista faz é
 * obedecer ao hidden. O display:grid do item ganha do [hidden] da folha do
 * navegador, por isso a regra explícita. data-fim marca o último item VISÍVEL,
 * que o script recalcula — sem ele o fio desce do último item filtrado até o
 * nada, e :last-child não enxerga o que está escondido. */
.ucam-timeline__filtro { margin-block-end: var(--ucam-space-stack-sm); }

.ucam-timeline__item[hidden],
.ucam-timeline__grupo[hidden] { display: none; }

.ucam-timeline__item[data-fim] .ucam-timeline__linha { visibility: hidden; }
.ucam-timeline__item[data-fim] .ucam-timeline__conteudo { padding-block-end: 0; }

/* AS MUDANÇAS: um evento que altera vários campos de uma vez.
 *
 * Editar o requerimento troca setor, prazo e prioridade no mesmo clique. Como
 * três eventos, seriam três linhas com o mesmo autor e a mesma hora — a
 * repetição esconde que foi UMA ação. Como um evento com uma lista dentro,
 * cada campo ganha a sua linha: rótulo em legenda, seta decorativa, valor
 * novo em tinta primária, e o valor antigo antes da seta quando ele importa.
 *
 * É um <dl> porque é o que é — pares de campo e valor — e a seta não é
 * palavra: quem ouve recebe "Setor responsável, Secretaria Acadêmica", que
 * é a frase. */
.ucam-timeline__mudancas {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
  margin: 0.375rem 0 0;
  font-size: var(--ucam-typography-body-sm-font-size);
}

.ucam-timeline__mudanca {
  display: contents;
}

.ucam-timeline__campo {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  margin: 0;
  color: var(--ucam-color-text-secondary);
  min-block-size: var(--ucam-size-contagem);
}

.ucam-timeline__campo .ic { color: var(--ucam-color-text-placeholder); }

.ucam-timeline__novo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ucam-space-inline-xs);
  margin: 0;
  min-inline-size: 0;
  color: var(--ucam-color-text-primary);
}

/* O valor antigo, quando vem: riscado não, apagado sim. Riscar um valor que
 * ainda é legível confunde com "cancelado"; a tinta apagada antes da seta já
 * diz de onde veio. */
.ucam-timeline__anterior { color: var(--ucam-color-text-secondary); }

/* A SETA VIAJA COM O DESTINO. Quando o par não cabe na linha, o valor antigo
 * fica em cima e a seta abre a linha de baixo, colada ao valor novo — nunca
 * uma seta órfã no fim da primeira linha apontando para o nada, que é o que
 * a coluna de 20rem do requerimento mostrava em "Coordenação de Curso →". */
.ucam-timeline__destino {
  display: inline-flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  min-inline-size: 0;
}

/* Na linha do tempo compacta (coluna lateral de ~20rem) as duas colunas não
 * cabem: "Coordenação de Curso → Secretaria Acadêmica" quebrava em quatro
 * linhas ao lado do rótulo. O campo sobe para a linha de cima e o valor fica
 * embaixo, com a largura toda. */
.ucam-timeline--compacta .ucam-timeline__mudancas {
  grid-template-columns: 1fr;
  gap: 0.125rem;
}

/* ...e desde a ADR-036 campo e valor correm na MESMA frase: "Prazo:
 * 10/09/2026 → 04/09/2026". Empilhados, três campos viravam seis linhas —
 * a edição ocupava mais altura que todo o resto da coluna. Em fluxo de
 * texto, o par quebra onde a largura manda, e a seta continua presa ao
 * destino (.ucam-timeline__destino é inline-flex, uma peça só). O ícone do
 * campo sai: na coluna estreita ele era a terceira coisa na linha, e o nome
 * do campo já diz o que ele desenhava. */
.ucam-timeline--compacta .ucam-timeline__mudanca { display: block; }

.ucam-timeline--compacta .ucam-timeline__campo,
.ucam-timeline--compacta .ucam-timeline__novo { display: inline; }

.ucam-timeline--compacta .ucam-timeline__campo .ic { display: none; }
.ucam-timeline--compacta .ucam-timeline__campo::after { content: ':'; margin-inline-end: var(--ucam-space-inline-xs); }
.ucam-timeline--compacta .ucam-timeline__anterior { margin-inline-end: var(--ucam-space-inline-xs); }
.ucam-timeline--compacta .ucam-timeline__destino { vertical-align: bottom; }

/* ------------------------------------------------------------ compositor --- */
/* Contrato: compositor.json. A caixa de escrever a resposta.
 *
 * Era um campo, uma dica abaixo dele e dois botões soltos mais abaixo: três
 * peças a 1,25rem de distância, e nada dizia que os botões eram daquele
 * campo — na tela de requerimento o de baixo deles é uma tabela, e o
 * "Enviar resposta" ficava mais perto dela que do texto que envia.
 *
 * Aqui é UMA peça: o campo e a barra de ações dentro da mesma caixa, e a
 * caixa inteira acende no foco. O filete e o anel saem do campo e passam para
 * o invólucro, porque o alvo de identificação (ADR-009) agora é ele; o
 * textarea de dentro fica sem filete e sem anel próprio, senão seriam dois
 * contornos concêntricos toda vez que o cursor entrasse.
 *
 * A dica não desapareceu: ela vive na barra, à esquerda das ações, onde está
 * quem vai apertar o botão. Dica embaixo de tudo é lida DEPOIS de enviar. */
.ucam-compositor {
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-default);
  border-radius: var(--ucam-radius-surface);
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-compositor:hover:not(:focus-within) { border-color: var(--ucam-color-border-strong); }

/* O anel do invólucro, e por isso :focus-within e não :focus-visible — o que
 * recebe o foco é o textarea lá dentro. A modalidade de teclado continua
 * sendo respeitada pelos BOTÕES da barra, que mantêm o anel deles. */
.ucam-compositor:focus-within {
  border-color: var(--ucam-color-border-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ucam-color-border-focus) 50%, transparent);
}

.ucam-compositor__campo {
  display: block;
  inline-size: 100%;
  border: 0;
  background: none;
  border-radius: var(--ucam-radius-surface) var(--ucam-radius-surface) 0 0;
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md) 0;
  min-block-size: calc(var(--ucam-size-control-md) * 2);
  resize: vertical;
  font-family: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
  line-height: 1.5;
  color: var(--ucam-color-text-primary);
}

.ucam-compositor__campo:focus-visible { outline: none; box-shadow: none; }
.ucam-compositor__campo::placeholder { color: var(--ucam-color-text-placeholder); }

/* A barra NÃO tem filete separando: dois retângulos dentro de um contorno
 * leem como duas peças de novo, que é o que esta decisão desfez. O que separa
 * é o vão. */
.ucam-compositor__barra {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  flex-wrap: wrap;
  padding: var(--ucam-space-inline-sm) var(--ucam-space-inset-md) var(--ucam-space-inset-sm);
}

.ucam-compositor__dica {
  font-size: var(--ucam-typography-caption-font-size);
  line-height: var(--ucam-typography-caption-line-height);
  color: var(--ucam-color-text-secondary);
  min-inline-size: 0;
}

.ucam-compositor__acoes {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  margin-inline-start: auto;
}

/* -------------------------------------------------------------- progresso --- */
/* Contrato: progress.json. Proporção CONHECIDA. Espera de duração
 * desconhecida continua sendo ucam-skeleton — barra sem valor promete uma
 * previsão de término que o sistema não tem. */

.ucam-progress {
  --ucam-progress-alt: 0.5rem;
  display: block;
  inline-size: 100%;
  block-size: var(--ucam-progress-alt);
  background: var(--ucam-color-surface-sunken);
  border-radius: var(--ucam-radius-pill);
  overflow: hidden;
}

.ucam-progress--sm { --ucam-progress-alt: 0.25rem; }

/* A largura vem de uma custom property e não de style calculado por tela —
 * é a correção do div com width em porcentagem repetido em seis cartões. */
.ucam-progress__fill {
  /* Zero é o default correto: barra sem valor declarado nasce vazia, não
   * cheia. Quem renderiza sobrescreve por style no próprio elemento. */
  --ucam-progress-valor: 0%;
  display: block;
  block-size: 100%;
  inline-size: var(--ucam-progress-valor);
  border-radius: inherit;
  background: var(--ucam-color-text-secondary);
  transition: inline-size var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-standard);
}

/* GRAPHIC, não foreground.
 *
 * O foreground é calibrado para texto — 4,5:1 sobre branco — e isso empurra o
 * âmbar para #6B4504, que numa faixa de 8px lê como marrom, não como aviso. A
 * barra é objeto gráfico: o piso é 3:1 contra o que está ao lado, e sobra
 * croma. Ver a nota de color.feedback na spec. */
.ucam-progress__fill--info    { background: var(--ucam-color-feedback-info-graphic); }
.ucam-progress__fill--success { background: var(--ucam-color-feedback-success-graphic); }
.ucam-progress__fill--warning { background: var(--ucam-color-feedback-warning-graphic); }
.ucam-progress__fill--danger  { background: var(--ucam-color-feedback-danger-graphic); }

.ucam-progress__legenda {
  display: flex;
  justify-content: space-between;
  gap: var(--ucam-space-inline-sm);
  margin-block-start: 0.375rem;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .ucam-progress__fill { transition: none; }
}

/* ---------------------------------------------------------------- gaveta --- */
/* Contrato: drawer.json. Complementa sem tirar do lugar — o contexto continua
 * visível atrás. Interromper para decidir é ucam-dialog. */

.ucam-drawer-scrim {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--ucam-color-surface-inverse) 45%, transparent);
  z-index: var(--ucam-z-scrim);
}

.ucam-drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  --ucam-drawer-largura: 30rem;
  inline-size: min(var(--ucam-drawer-largura), 100vw);
  display: flex;
  flex-direction: column;
  background: var(--ucam-color-surface-default);
  border-inline-start: 1px solid var(--ucam-color-border-subtle);
  box-shadow: var(--ucam-elevation-overlay);
  z-index: var(--ucam-z-overlay);
}

.ucam-drawer--sm { --ucam-drawer-largura: 22rem; }
.ucam-drawer--lg { --ucam-drawer-largura: 42rem; }

.ucam-drawer--inicio {
  inset-inline: 0 auto;
  border-inline: 0 1px solid var(--ucam-color-border-subtle);
}

/* Borda de baixo: para viewport estreita, onde painel lateral deixaria 4rem
 * de conteúdo visível. Em desktop lê como notificação, e o contrato proíbe. */
.ucam-drawer--baixo {
  inset: auto 0 0 0;
  inline-size: 100%;
  max-block-size: 85dvh;
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-frame) var(--ucam-radius-frame) 0 0;
}

/* Cabeçalho e rodapé fixos, corpo rolando. Mesma regra do diálogo: o legado
 * tem duas barras de rolagem adjacentes no mesmo painel. */
.ucam-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ucam-space-inline-md);
  padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-drawer__title {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  margin: 0;
}

.ucam-drawer__description {
  margin: 0.25rem 0 0;
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-drawer__body {
  padding: var(--ucam-space-inset-lg);
  overflow-y: auto;
  flex: 1;
}

.ucam-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ucam-space-inline-sm);
  padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

/* --------------------------------------------------------------- etapas --- */
/* Contrato: stepper.json. Informa posição numa sequência. Onde não há
 * sequência obrigatória o certo é aba. */

.ucam-stepper {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  /* Quebra em vez de passar da tela: três etapas com rótulo somam 345px e o
   * telefone de 390 dá 338 ao conteúdo. O conector é flex: 1 com piso de
   * 1rem, então no fim de uma linha ele só encurta. */
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
}

.ucam-stepper__passo {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-stepper__marcador {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  flex: none;
  border-radius: var(--ucam-radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ucam-color-border-default);
  background: var(--ucam-color-surface-default);
  font-size: var(--ucam-typography-caption-font-size);
  font-variant-numeric: tabular-nums;
}

.ucam-stepper__passo--done .ucam-stepper__marcador {
  background: var(--ucam-color-feedback-success-background);
  border-color: var(--ucam-color-feedback-success-border);
  color: var(--ucam-color-feedback-success-foreground);
}

.ucam-stepper__passo--current .ucam-stepper__marcador {
  background: var(--ucam-color-action-primary-default);
  border-color: var(--ucam-color-action-primary-default);
  color: var(--ucam-color-text-on-action);
}

.ucam-stepper__passo--error .ucam-stepper__marcador {
  background: var(--ucam-color-feedback-danger-background);
  border-color: var(--ucam-color-feedback-danger-border);
  color: var(--ucam-color-feedback-danger-foreground);
}

.ucam-stepper__passo--current { color: var(--ucam-color-text-primary); font-weight: var(--ucam-typography-label-font-weight); }
.ucam-stepper__passo--error   { color: var(--ucam-color-feedback-danger-foreground); }

.ucam-stepper__conector {
  flex: 1;
  min-inline-size: 1rem;
  block-size: 1px;
  background: var(--ucam-color-border-default);
}

.ucam-stepper__dica {
  font-size: var(--ucam-typography-caption-font-size);
  color: inherit;
}

/* Faixa sem rótulo visível, para topo de formulário estreito. Só é aceitável
 * porque o nome da etapa continua no nome acessível e no título logo abaixo —
 * sem isso a barra informa que HÁ progresso e esconde qual. */
.ucam-stepper--barra { gap: 0.25rem; }

.ucam-stepper--barra .ucam-stepper__passo {
  flex: 1;
  block-size: 0.25rem;
  border-radius: var(--ucam-radius-pill);
  background: var(--ucam-color-surface-sunken);
}

.ucam-stepper--barra .ucam-stepper__passo--done,
.ucam-stepper--barra .ucam-stepper__passo--current { background: var(--ucam-color-action-primary-default); }

.ucam-stepper--barra .ucam-stepper__marcador,
.ucam-stepper--barra .ucam-stepper__conector { display: none; }

/* --------------------------------------------------- cartão de escolha --- */
/* Contrato: choice-card.json. O cartão é a ETIQUETA de um input real. Div com
 * clique não entra na tabulação, não é anunciada como escolha e não vai no
 * envio do formulário. */

.ucam-choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: var(--ucam-space-inline-sm);
  border: 0;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}

/* O RÓTULO DO GRUPO precisa de ar antes da grade.
 *
 * Ele encostava nos cartões: <legend> dentro de fieldset com display:grid não
 * é item de grade no Chrome — é renderizado fora do fluxo —, então o \`gap\` da
 * grade não o alcança, e sem margem própria ele ficava a 4px do primeiro
 * cartão. "Natureza do requerimento" lia como legenda DO cartão da esquerda,
 * e não como pergunta feita aos quatro. */
.ucam-choice-grid > legend {
  margin-block-end: var(--ucam-space-stack-md);
}

.ucam-choice-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--ucam-space-inline-sm);
  /* 0.75rem, e não 1rem. O cartão carrega três linhas curtas e um chip de
   * ícone; com 16px em volta ele media 92px de altura para 44px de conteúdo, e
   * quatro deles empurravam o resto do formulário para fora da dobra. */
  padding: var(--ucam-space-inset-sm);
  /* A marca de escolhido é absoluta no canto superior direito. Sem reservar a
   * faixa dela, um título longo — "Pós-graduação EAD" na grade de quatro
   * colunas — corre por baixo do check. */
  padding-inline-end: calc(var(--ucam-space-inset-sm) + 1.25rem);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
  background: var(--ucam-color-surface-default);
  cursor: pointer;
  transition: border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-choice-card:hover { background: var(--ucam-color-interaction-hover); }

/* O input fica escondido mas FOCÁVEL: as setas do grupo de radio continuam
 * sendo as do navegador, e o anel de foco é desenhado no cartão inteiro. */
.ucam-choice-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  margin: 0;
}

.ucam-choice-card:has(input:focus-visible) {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

/* A BORDA DO ESCOLHIDO ALIVIA.
 *
 * Em tinta cheia ela era o traço mais escuro da tela inteira — mais escura
 * que a borda do campo onde se digita — para marcar uma escolha que o fundo,
 * o chip do ícone e o check já marcam. Três sinais bastam; o quarto virava
 * peso. A 55% o contorno continua se lendo como bordô e para de gritar.
 *
 * Não é a 1.4.11 em risco: o que a norma pede é que o ESTADO seja
 * perceptível, e ele é carregado pelo chip em tinta cheia e pelo check, que
 * não dependem de contraste de traço fino. */
.ucam-choice-card:has(input:checked) {
  border-color: color-mix(in srgb, var(--ucam-color-action-primary-default) 55%, transparent);
  background: var(--ucam-color-action-primary-subtle);
}

.ucam-choice-card:has(input:disabled) {
  background: var(--ucam-color-action-disabled-background);
  color: var(--ucam-color-action-disabled-text);
  cursor: not-allowed;
}

/* A FIGURA.
 *
 * O contrato declara esta parte desde a primeira versão, com este nome de
 * classe, e o Trilho A nunca a emitiu. A tela de novo requerimento escrevia
 * class="ucam-icon-tile ucam-choice-card__figura": funcionava por causa da
 * primeira classe, e a segunda era decoração morta. Quem seguisse o contrato —
 * que é o que o contrato existe para permitir — ganhava um ícone solto sem
 * chip nenhum. Aqui a parte passa a valer sozinha. */
.ucam-choice-card__figura {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: var(--ucam-radius-control);
  background: var(--ucam-color-surface-sunken);
  color: var(--ucam-color-text-secondary);
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

/* O CHIP VIRA A MARCA DA ESCOLHA.
 *
 * Escolhido, o cartão trocava só a borda e um fundo rosa pálido, e o chip do
 * ícone continuava cinza — a peça de maior contraste do cartão dizendo
 * "nenhuma escolha aqui" bem no meio da que foi escolhida. Em tinta cheia ele
 * passa a ser o que o olho acha primeiro, e é isso que permite a borda
 * aliviar (ver abaixo): a escolha deixa de depender de um traço de 1px.
 *
 * O check no canto continua: cor sozinha não informa (WCAG 1.4.1), e agora
 * são três sinais concordando — chip, fundo e check. */
.ucam-choice-card:has(input:checked) .ucam-choice-card__figura {
  background: var(--ucam-color-action-primary-default);
  color: var(--ucam-color-text-on-action);
}

/* A HIERARQUIA DENTRO DO CARTÃO.
 *
 * Título e apoio saíam quase no mesmo peso, e o apoio — que quebra em duas ou
 * três linhas — ocupava mais área que o título de uma linha. Quem varre a
 * grade lê primeiro o bloco maior, ou seja: a explicação antes do nome da
 * coisa. O título ganha entrelinha curta e apertada para virar uma unidade,
 * e o apoio ganha entrelinha mais aberta e tinta mais calma, que é o que
 * separa dois papéis sem precisar de mais um tamanho na escala. */
.ucam-choice-card__titulo {
  display: block;
  font-size: var(--ucam-typography-label-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  line-height: 1.25;
  letter-spacing: -0.006em;
  color: var(--ucam-color-text-primary);
}

.ucam-choice-card__apoio {
  display: block;
  margin-block-start: 0.125rem;
  font-size: var(--ucam-typography-caption-font-size);
  line-height: 1.35;
  color: var(--ucam-color-text-secondary);
}

/* A marca de escolhido existe ALÉM da borda: em monitor de secretaria com
 * brilho baixo a diferença de borda desaparece e a escolha some junto. */
.ucam-choice-card__marca {
  position: absolute;
  inset-block-start: var(--ucam-space-inset-sm);
  inset-inline-end: var(--ucam-space-inset-sm);
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--ucam-color-action-primary-default);
  opacity: 0;
}

.ucam-choice-card:has(input:checked) .ucam-choice-card__marca { opacity: 1; }

/* --------------------------------------------------------------- gráfico --- */
/* Contrato: chart.json — trilho A NÃO ENTREGA gráfico.
 *
 * Até 04/09/2026 havia aqui um gráfico de barras em div, com a altura numa
 * custom property. Ele saiu quando o gráfico passou a partir do z-chart da
 * ZardUI (ECharts): manter as duas implementações significaria manter duas
 * escalas, duas paletas e dois jeitos de errar — e a versão em CSS puro nunca
 * teve eixo rotulado nem dica, que é metade do que faz um gráfico ser lido.
 *
 * Para o legado, o equivalente continua sendo a TABELA, que o contrato já
 * exige ao lado do desenho de qualquer forma. */


/* ------------------------------------------------------ lista e detalhe --- */
/* Bloco de arranjo (spec/layouts.json). Cada painel rola por DENTRO e a
 * página não rola: é o que permite responder um requerimento e passar ao
 * seguinte sem reencontrar a lista. */

.ucam-inbox {
  --ucam-inbox-lista: 20rem;
  /* O desconto cobre a faixa da aplicacao, o cabecalho da pagina e o rodape.
   * A tela que muda essa moldura ajusta AQUI, em vez de reinventar a conta
   * dentro de cada painel.
   *
   * A base é --ucam-vh, não 100dvh: quem embute o shell abaixo de outra
   * coisa desconta uma vez lá em cima e este bloco acompanha. Ver o cabeçalho
   * da variável em .ucam-shell. */
  --ucam-inbox-alt: calc(var(--ucam-vh, 100dvh) - 14rem);
  display: grid;
  grid-template-columns: var(--ucam-inbox-lista) 1fr;
  gap: var(--ucam-space-inline-md);
  block-size: var(--ucam-inbox-alt);
  min-block-size: 24rem;
}

.ucam-inbox--lista-larga { --ucam-inbox-lista: 24rem; }

/* A lista fica na MOLDURA e o detalhe no conteúdo. É a mesma separação em
 * dois tons que governa a navegação: o que emoldura recua, o que se lê sobe. */
.ucam-inbox__lista {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
  background: var(--ucam-color-surface-chrome);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
}

.ucam-inbox__lista-topo {
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  box-shadow: inset 0 -1px 0 var(--ucam-color-border-subtle);
}

.ucam-inbox__rolagem {
  overflow-y: auto;
  flex: 1;
  min-block-size: 0;
}

.ucam-inbox__lista-rodape {
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
  /* Fio por sombra: contado na caixa dava 45px (12 + 20 + 12 + 1). */
  box-shadow: inset 0 1px 0 var(--ucam-color-border-subtle);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
  display: flex;
  gap: var(--ucam-space-inline-md);
  flex-wrap: wrap;
}

.ucam-inbox__detalhe {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
  background: var(--ucam-color-surface-default);
  border: 1px solid var(--ucam-color-border-subtle);
  border-radius: var(--ucam-radius-surface);
}

/* O título do REGISTRO aberto no painel é título de seção (16/560), não de
 * página: a página é a caixa de entrada; o painel é uma parte dela. Estava em
 * 17px por style inline — um degrau que não existe na escala. */
.ucam-inbox__detalhe .ucam-page-header__title {
  font-size: var(--ucam-typography-section-title-font-size);
  line-height: var(--ucam-typography-section-title-line-height);
  letter-spacing: -0.01em;
}

.ucam-inbox__detalhe-topo {
  padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-inbox__detalhe-corpo {
  padding: var(--ucam-space-inset-lg);
  overflow-y: auto;
  flex: 1;
  min-block-size: 0;
}

/* Detalhe de 12rem ao lado de lista de 12rem não é lista e detalhe: é duas
 * colunas ilegíveis. Abaixo de 64rem a lista toma a largura inteira. */
${abaixo('nav-fixa')} {
  .ucam-inbox {
    grid-template-columns: 1fr;
    block-size: auto;
  }
  .ucam-inbox__lista { max-block-size: 24rem; }
}

/* ---------------------------------------------------------------- dica --- */
/* Contrato: tooltip.json. O balão é o MESMO nos dois trilhos: no Trilho B ele
 * é criado pela diretiva ucamTooltip dentro do contêiner de overlay do CDK, no
 * fim do <body>, e por isso leva a classe \`ucam\` junto — fora de um ancestral
 * escopado nada do design system se aplica.
 *
 * Este bloco não existia. O contrato declarava \`.ucam-tooltip\` como raiz do
 * Trilho A desde 06/09/2026 e o gerador nunca o emitiu — o mesmo defeito que
 * \`ucam-choice-card__figura\` teve, e que passou porque tooltip não tem demo e
 * a seção 4d do validador só varre o que aparece em preview. */

.ucam-tooltip {
  /* Largura máxima em ch, não rem: a medida que importa é quantos CARACTERES
   * cabem na linha, e é ela que decide se a frase quebra em duas. */
  max-inline-size: 32ch;
  padding: 0.375rem 0.5rem;
  border-radius: var(--ucam-radius-miudo);
  /* Tinta invertida, como toda superfície sobreposta efêmera: o balão precisa
   * se separar do que estiver embaixo dele, que pode ser qualquer coisa. */
  background: var(--ucam-color-surface-inverse);
  color: var(--ucam-color-text-on-brand);
  font-size: var(--ucam-typography-caption-font-size);
  line-height: 1.4;
  /* SEM SETA, por contrato: a proximidade já diz de quem o balão é, e a seta é
   * mais uma peça para alinhar errado perto da borda da janela. */
  box-shadow: var(--ucam-elevation-tooltip);
  /* O texto pode ser selecionado — é o que a 1.4.13 chama de apontável, e não
   * adianta manter o balão aberto sob o ponteiro se o conteúdo não se pega. */
  user-select: text;
}

/* -- variante em CSS puro, sem JavaScript --------------------------------- */
/* O que ela entrega: o balão em :hover e em :focus-visible. O que ela NÃO
 * entrega, e está escrito no contrato: virar de lado perto da borda da janela,
 * dispensa por Esc, e permanência quando o ponteiro entra no balão. Os três
 * precisam de JavaScript e moram no Trilho B. Ainda assim é melhor que o
 * \`title\` nativo, porque ao menos abre no foco do teclado. */

.ucam-tooltip-wrap {
  position: relative;
  display: inline-flex;
}

/* Irmão ADJACENTE do gatilho. O balão não pode ser filho de um <button>: o que
 * está dentro do botão entra no nome acessível dele, e a dica passaria a
 * NOMEAR o controle em vez de descrevê-lo. */
.ucam-tooltip-gatilho + .ucam-tooltip {
  position: absolute;
  inset-block-end: calc(100% + 0.375rem);
  inset-inline-start: 50%;
  translate: -50% 0;
  z-index: var(--ucam-z-overlay);
  width: max-content;
  /* \`visibility\`, não \`display\`: o balão precisa continuar no fluxo de
   * acessibilidade sem ser anunciado, e display:none tira o elemento do
   * cálculo de aria-describedby em parte dos leitores. */
  visibility: hidden;
  opacity: 0;
  transition:
    opacity var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
    visibility var(--ucam-motion-duration-state);
}

.ucam-tooltip-gatilho:hover + .ucam-tooltip,
.ucam-tooltip-gatilho:focus-visible + .ucam-tooltip {
  visibility: visible;
  opacity: 1;
  transition-timing-function: var(--ucam-motion-easing-entrance);
}

@media (prefers-reduced-motion: reduce) {
  .ucam-tooltip-gatilho + .ucam-tooltip { transition: none; }
}

/* ------------------------------------------------------------ utilitário --- */

/* Número que se copia ou se confere dígito a dígito — linha digitável, chave,
 * hash, número de protocolo. A Geist Mono existe no projeto para isto; nunca
 * para "parecer rótulo". Os dígitos tabulares fecham colunas de números. */
.ucam-codigo {
  font-family: var(--ucam-font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.ucam-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* ==================================================== ARRANJO LATERAL === */
/* Contrato: spec/components/app-shell.json, arranjo \`lateral\`.
 *
 * A coluna carrega a identidade e a faixa deixa de existir. Não é a faixa
 * escondida: shell.mjs não a emite, porque uma testeira presente no documento
 * e invisível continuaria na ordem de tabulação anunciando marca, busca e
 * sair que ninguém vê.
 *
 * A REGRA DE SUPERFÍCIE DESTE ARRANJO, e é ela que o diferencia dos outros
 * três: superfícies se ENCOSTAM. Nada de vão, canto arredondado e sombra
 * entre painéis vizinhos — o que separa dois planos é um fio de 1px, e o que
 * sobra de largura vai para o dado.
 *
 * Os outros arranjos desenham a moldura como um conjunto de cartões flutuando
 * sobre um chão cinza: a faixa recuada 24px das três bordas, o painel de
 * conteúdo recuado outros 24, a lista e o detalhe separados por mais 12. Numa
 * janela de 1440 isso é mais de 90px de vão puro na horizontal, e cada vão
 * cobra ainda um raio e uma sombra para explicar por que existe. O arranjo
 * lateral troca os três por dois fios.
 *
 * Consequência aceita: sem vão não há como um painel "levitar", então a
 * hierarquia entre eles passa a vir só de TOM — a moldura recua para
 * surface-chrome, o conteúdo sobe para surface-default. É a mesma separação em
 * dois tons que a navegação já usava; o que muda é que agora ela é a única. */

.ucam-shell--lateral {
  /* A RÉGUA ZERADA. Um valor só governava o recuo da faixa, da navegação e a
   * margem do painel; aqui ele governa a ausência dos três de uma vez. O
   * rodapé, que lia --ucam-gutter para o próprio recuo, ganha o dele abaixo. */
  --ucam-gutter: 0px;
  /* Sem faixa não há desconto de faixa. A coluna vai do topo ao pé da janela,
   * e quem lia --ucam-appbar-offset para grudar abaixo dela passa a grudar em
   * zero. Deixar o valor antigo aqui empurraria a navegação 96px para baixo
   * atrás de uma testeira que não existe. */
  --ucam-appbar-offset: 0px;
  /* A ALTURA É EXATA, não mínima.
   *
   * Nos arranjos com faixa o shell pode crescer além da janela e a página
   * rola. Aqui não: a coluna é do tamanho da janela e o conteúdo rola por
   * dentro do próprio painel. É o que permite ao bloco de lista e detalhe
   * ocupar o que sobra sem NENHUM número mágico de desconto — antes ele
   * descontava 14rem no chute, e o chute errava toda vez que a moldura mudava
   * de altura. */
  block-size: var(--ucam-vh);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "mobilebar"
    "main"
    "footer";
  /* O chão deixa de aparecer: não há mais vão por onde ele apareça. Fica como
   * fundo de segurança se um painel não cobrir a área toda. */
  background: var(--ucam-color-surface-default);
}

${acima('nav-fixa')} {
  .ucam-shell--lateral {
    grid-template-columns: var(--ucam-nav-width) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas:
      "nav main"
      "nav footer";
  }
}

/* O PAINEL ENCOSTA. Sem margem, sem borda, sem raio e sem sombra: as quatro
 * propriedades que desenhavam um cartão flutuante saem juntas — modificador
 * que apaga uma superfície tem de apagar todas as que a desenham, que é a
 * mesma regra que .ucam-main--centrado já segue.
 *
 * O padding também sai daqui: a barra de visão precisa atravessar o painel de
 * ponta a ponta para que o fio embaixo dela seja uma linha inteira, e não um
 * traço com 24px de branco de cada lado. Quem paga o recuo agora é o corpo do
 * conteúdo, logo abaixo da barra. */
.ucam-shell--lateral > .ucam-main {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  /* Coluna flex, e não bloco: é isto que faz o conteúdo abaixo da barra de
   * visão receber a altura que sobra sem ninguém calcular quanto é. */
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
}

/* O contêiner do conteúdo herda a coluna: sem isso o bloco de lista e detalhe
 * volta a depender de altura declarada. */
.ucam-shell--lateral > .ucam-main > .ucam-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-block-size: 0;
}

/* O rodapé recupera o recuo que a régua zerada tirou — ele é texto solto sobre
 * a superfície, e texto encostado na borda da janela não se lê. */
.ucam-shell--lateral > .ucam-shell__footer {
  padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-lg);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

${acima('nav-fixa')} {
  /* A coluna vai do topo ao pé, e rola por dentro. */
  .ucam-shell--lateral > .ucam-nav {
    inset-block-start: 0;
    block-size: var(--ucam-vh);
  }
}

/* ------------------------------------------------------- fileira móvel --- */
/* Só abaixo de 64rem, e só porque lá a coluna é painel sobreposto e não há
 * faixa para hospedar o botão que a abre. Ver barraMovel em lib/shell.mjs. */

.ucam-mobilebar {
  grid-area: mobilebar;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  block-size: 3.5rem;
  padding-inline: var(--ucam-space-inset-sm);
  background: var(--ucam-color-surface-default);
  border-block-end: 1px solid var(--ucam-color-border-subtle);
  position: sticky;
  inset-block-start: 0;
  z-index: var(--ucam-z-sticky);
}

.ucam-mobilebar__sistema {
  font-size: var(--ucam-typography-section-title-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  color: var(--ucam-color-text-primary);
}

${acima('nav-fixa')} {
  .ucam-mobilebar { display: none; }
}

/* --------------------------------------------- identidade na coluna --- */
/* O bloco que substitui a faixa: marca, nome do sistema e campus, no alto da
 * navegação e fora da rolagem. */

.ucam-nav__topo {
  flex: none;
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

.ucam-nav__marca {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  /* 3.5rem, e não os 4.5 que a faixa tinha. A faixa precisava daquela altura
   * porque carregava cinco papéis numa linha só; aqui a marca divide o bloco
   * com a fileira de campus logo abaixo, e as duas somadas dão 6.25rem — que
   * é o que a coluna pode gastar antes de a ação primária sair da primeira
   * dobra num notebook de 768px de altura. */
  /* 3.75rem: o bloco empilhado mede 42px (20 + 2 + 20) e a fileira precisa de
   * respiro igual em cima e embaixo. A 3.5rem sobravam 7px de cada lado, e o
   * lockup encostava no filete de baixo. */
  block-size: 3.75rem;
  padding-inline: var(--ucam-space-inset-md);
}

/* A marca é link para a raiz do módulo, como na faixa — mas EMPILHADA.
 *
 * Medido na coluna do Portal: 286px úteis na fileira, e as peças pedem 336.
 * Lado a lado, o lockup (110px) mais "Portal Universitário" (134px natural)
 * mais o lançador (28) mais o recolher (32) mais quatro vãos de 8 estouram em
 * 50px — e quem pagava era o nome do sistema, que saía "Portal Univ…".
 *
 * Empilhados, os dois pedem a largura do MAIOR e não a soma: 134px. Sobram 76
 * de folga, e a altura não muda — 20px de lockup mais 2 de vão mais 20 de
 * nome cabem nos 56px que a fileira já tinha.
 *
 * Por que nenhum dos dois pode sair: o lockup é a UNIVERSIDADE e o nome é o
 * SISTEMA. Unificar a faixa dos três apps é a razão de existir deste
 * componente; uma coluna que mostrasse só "Protocolo" devolveria ao parque o
 * problema que ele tem hoje, que é cada sistema parecer de outra instituição.
 * E o lockup não encolhe para caber: a 110px ele já desenha o wordmark em duas
 * linhas de 7px.
 *
 * Não é a marca dita duas vezes — o defeito que a evidência do SIGFIN
 * registra é o nome da UNIVERSIDADE escrito duas vezes na mesma tela. Aqui
 * são dois nomes diferentes: de quem é, e o quê. */
.ucam-nav__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.125rem;
  min-inline-size: 0;
  color: var(--ucam-color-text-primary);
  text-decoration: none;
  border-radius: var(--ucam-radius-miudo);
}

/* A LOGO POR MÁSCARA, e a tinta por currentColor.
 *
 * Mesma mecânica da faixa: a página hospedeira aponta --ucam-appbar-logo e o
 * elemento recorta a si mesmo. O default é um gradiente transparente, nunca
 * \`none\` — sem máscara o background sólido apareceria como um retângulo
 * chapado na coluna de todo app que não declarou a logo.
 *
 * Aqui ela pinta em text-primary, e não em on-brand: a coluna é clara. */
.ucam-nav__logo {
  flex: none;
  inline-size: var(--ucam-appbar-logo-width);
  block-size: var(--ucam-appbar-logo-height);
  background: currentColor;
  -webkit-mask: var(--ucam-appbar-logo) no-repeat center / contain;
  mask: var(--ucam-appbar-logo) no-repeat center / contain;
}

.ucam-nav__brand-nome {
  font-size: var(--ucam-appbar-system-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
  letter-spacing: -0.01em;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* O lançador de sistemas, na coluna. Mesmo botão da faixa, outra caixa. */
.ucam-nav__sistemas {
  position: relative;
  flex: none;
}

.ucam-nav__lancador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  padding: 0;
  background: none;
  color: var(--ucam-color-text-secondary);
  border: 0;
  border-radius: var(--ucam-radius-miudo);
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__lancador:hover,
.ucam-nav__lancador[aria-expanded="true"] {
  background: var(--ucam-color-surface-subtle);
  color: var(--ucam-color-text-primary);
}

/* O popover do lançador abre para DENTRO, alinhado à borda de início da
 * coluna: o gatilho está encostado na esquerda da janela e um menu alinhado à
 * direita dele sairia pela borda. */
.ucam-nav__sistemas .ucam-menu {
  inset-inline-start: 0;
  inset-inline-end: auto;
}

/* O recolher vai para a ponta da fileira da marca. */
.ucam-nav__marca .ucam-nav__recolher { margin-inline-start: auto; }

/* ------------------------------------------------------------- campus --- */
/* Fileira inteira, e não chip espremido. A evidência do app-shell registra o
 * campus como informação crítica — a mesma tela mostra dados diferentes por
 * campus — e na faixa ele viajava entre a busca e o avatar, no menor tamanho
 * de tipo da moldura. */

.ucam-nav__contexto {
  position: relative;
  padding: 0 var(--ucam-space-inset-sm) var(--ucam-space-inset-sm);
}

/* O campo de campus da coluna (ADR-033): rótulo visível em cima e select de
 * largura cheia embaixo — é um campo, e é assim que campo se desenha. */
.ucam-campus--nav {
  flex-direction: column;
  align-items: stretch;
  gap: var(--ucam-space-inline-xs);
}

.ucam-select--nav {
  block-size: var(--ucam-size-control-sm);
  line-height: var(--ucam-size-control-sm);
  font-size: var(--ucam-typography-body-sm-font-size);
}

/* -------------------------------------------------- busca na coluna --- */
/* A busca GLOBAL — a que procura requerimento, aluno, setor —, não a que
 * peneira o menu. As duas coexistem por contrato, e é por isso que esta tem
 * classe própria em vez de herdar a da outra. */

.ucam-nav__busca {
  flex: none;
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-xs);
  margin: var(--ucam-space-inset-sm) var(--ucam-space-inset-sm) 0;
  padding-inline: var(--ucam-space-inline-sm);
  block-size: var(--ucam-size-control-sm);
  background: var(--ucam-color-surface-subtle);
  border: 1px solid transparent;
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-secondary);
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
              border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__busca:hover,
.ucam-nav__busca:focus-within {
  background: var(--ucam-color-surface-default);
  border-color: var(--ucam-color-border-default);
}

.ucam-nav__busca .ic { flex: none; }

/* O input é NU dentro da caixa: a caixa inteira é o campo, e uma borda de
 * input dentro de uma borda de caixa seriam duas molduras do mesmo controle. */
.ucam-nav__busca input {
  flex: 1;
  min-inline-size: 0;
  background: none;
  border: 0;
  padding: 0;
  color: var(--ucam-color-text-primary);
  font: inherit;
  font-size: var(--ucam-typography-body-sm-font-size);
}

/* RETICÊNCIAS, não corte seco. O texto que diz onde a busca olha — "Buscar
 * requerimento, setor ou pessoa" — não cabe em 318px menos o ícone e as duas
 * teclas, e sem isto ele terminava no meio de "ou", que se lê como defeito de
 * renderização e não como frase abreviada. */
.ucam-nav__busca input::placeholder {
  color: var(--ucam-color-text-placeholder);
  text-overflow: ellipsis;
}
.ucam-nav__busca input:focus { outline: none; }

/* O anel de foco sobe para a caixa: o input não tem borda própria, então o
 * anel dele nasceria colado no texto. */
.ucam-nav__busca:focus-within {
  outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
  outline-offset: var(--ucam-focus-ring-offset);
}

/* As teclas somem quando o campo tem foco: o atalho serve para CHEGAR ao
 * campo, e desenhado dentro dele com o cursor piscando ao lado vira promessa
 * de que digitar Ctrl+K ali faz alguma coisa. */
.ucam-nav__busca:focus-within .ucam-kbd { display: none; }

/* --------------------------------------------------- conta na coluna --- */
/* Com NOME VISÍVEL. Na faixa sobrava só o avatar, e estava certo: ali o nome
 * custava largura ao lado da marca. No pé de uma coluna de 318px a linha está
 * vazia de qualquer forma. */

.ucam-nav__conta {
  flex: none;
  position: relative;
  padding: var(--ucam-space-inset-sm);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
}

.ucam-nav__conta-gatilho {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  inline-size: 100%;
  padding: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
  background: none;
  border: 0;
  border-radius: var(--ucam-radius-control);
  color: var(--ucam-color-text-primary);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
}

.ucam-nav__conta-gatilho:hover,
.ucam-nav__conta-gatilho[aria-expanded="true"] {
  background: var(--ucam-color-surface-subtle);
}

.ucam-nav__conta-identidade {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  line-height: 1.3;
}

.ucam-nav__conta-nome {
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-nav__conta-meta {
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-nav__conta-chevron {
  margin-inline-start: auto;
  flex: none;
  color: var(--ucam-color-text-secondary);
}

/* O menu SOBE do gatilho: ele está no pé da janela e um popover que descesse
 * sairia pela base. Mesma razão do .ucam-menu--rail, outra direção. */
.ucam-menu--conta-nav {
  inset-block-start: auto;
  inset-block-end: calc(100% + 0.25rem);
  inset-inline: var(--ucam-space-inset-sm) var(--ucam-space-inset-sm);
  min-inline-size: 0;
}

/* ================================================== BARRA DE VISÃO === */
/* Contrato: spec/components/page-header.json, variante \`barra\`.
 *
 * O cabeçalho da tela em três fileiras rasas, coladas no alto do painel, cada
 * uma com um trabalho só:
 *
 *   trilha        onde eu estou       (localizar)
 *   título        o que é esta tela   (identificar)
 *   ferramentas   o que eu vejo dela  (operar)
 *
 * O que ela substitui: um .ucam-page-header de 60px com título de 30px e
 * frase de apoio, mais um .ucam-tabs solto abaixo, mais uma fileira de chips
 * de filtro solta abaixo dele — três blocos empilhados com margem própria,
 * nenhum deles um lugar fixo. Medido na Caixa de entrada, o conjunto gastava
 * mais que o dobro da altura da barra para dizer o mesmo, e ainda deixava a
 * contagem como frase ("4 requerimentos aguardam ação sua") em vez de número
 * ao lado do título.
 *
 * Ela GRUDA no alto do painel: o conteúdo rola por baixo e a trilha, o título
 * e os filtros aplicados continuam à vista. Numa fila de triagem isso é o que
 * impede alguém de concluir que a fila está curta quando ela está filtrada. */

.ucam-viewbar {
  flex: none;
  position: sticky;
  inset-block-start: 0;
  z-index: var(--ucam-z-sticky);
  background: var(--ucam-color-surface-default);
  /* O fio embaixo é o ÚNICO limite da barra: sem sombra e sem raio, porque
   * ela não é um objeto sobre o painel — ela é o alto do painel. */
  border-block-end: 1px solid var(--ucam-color-border-subtle);
}

/* A fileira, e a medida que faz as três lerem como uma peça só. */
.ucam-viewbar__fileira {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  min-block-size: 2.75rem;
  padding-inline: var(--ucam-space-inset-lg);
}

/* Só a trilha é mais rasa: ela carrega tipo de 12px e uma fileira de 44px
 * para uma linha de 12 deixaria a barra começar com um vão. */
.ucam-viewbar__fileira--trilha {
  min-block-size: 2.25rem;
  padding-block-start: var(--ucam-space-inline-xs);
}

/* Entre as fileiras NÃO há fio.
 *
 * Um filete entre trilha e título e outro entre título e ferramentas dariam
 * três linhas horizontais em 120px de altura, e a barra passaria a ler como
 * três barras. O que separa as fileiras é o alinhamento e o tipo; o único fio
 * é o que fecha a barra contra o conteúdo. */

/* A fileira de filtros aplicados só existe quando há filtro aplicado — é
 * condicional no markup, não escondida no CSS. Ela é a única com fundo
 * recuado: os chips precisam de um plano atrás para não flutuarem sobre o
 * branco do conteúdo logo abaixo. */
.ucam-viewbar__fileira--filtros {
  min-block-size: 2.5rem;
  /* MESMA superfície do conteúdo. O argumento antigo era que os chips
   * precisavam de um plano atrás para não flutuar sobre o branco — mas o chip
   * já tem preenchimento e filete próprios, e a faixa cinza só fazia a barra
   * de visão parecer três barras empilhadas em vez de uma. Quem separa a
   * fileira das outras continua sendo o fio de cima. */
  background: var(--ucam-color-surface-default);
  border-block-start: 1px solid var(--ucam-color-border-subtle);
  flex-wrap: wrap;
}

/* O título da tela. 1.125rem, e não os 1.875rem do .ucam-page-header.
 *
 * O título grande é de tela de leitura, onde ele abre um documento. Numa tela
 * de trabalho que fica aberta o dia inteiro, ele é etiqueta: diz em que fila
 * a pessoa está, uma vez, e depois sai do caminho. Os 30px custavam 20px de
 * altura em toda tela para repetir o que o item ativo da coluna já diz. */
/* O TÍTULO DA TELA usa o papel de PÁGINA, não o de seção.
 *
 * Medido na tela de requerimento: ele saía em section-title (16px/560) — o
 * MESMO tamanho e peso de "Protocolos anteriores deste requerente", que é uma
 * seção DENTRO dele. Título de tela empatado com título de seção não é
 * questão de gosto: é a escada perdendo um degrau, e com ela a resposta a
 * "onde termina a tela e onde começa a parte dela".
 *
 * page-title são 22px — não os 30 que a barra recusou quando este bloco
 * nasceu; o token encolheu desde então. A 22 ele cabe numa fileira de 44px e
 * a escada volta a ter cinco passos que se leem:
 *
 *   22/560  título da tela
 *   16/560  título de seção
 *   14/400  corpo
 *   13/500  rótulo
 *   12/400  legenda
 *
 * O letter-spacing negativo é o do papel, e vem do token — a 22px o texto
 * pede o aperto que a 16 não pedia. */
.ucam-viewbar__titulo {
  margin: 0;
  font-size: var(--ucam-typography-page-title-font-size);
  font-weight: var(--ucam-typography-page-title-font-weight);
  line-height: var(--ucam-typography-page-title-line-height);
  letter-spacing: var(--ucam-typography-page-title-letter-spacing);
  color: var(--ucam-color-text-primary);
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A CONTAGEM É NÚMERO, ao lado do título, e não frase abaixo dele.
 *
 * "4 requerimentos aguardam ação sua" custava uma linha inteira de 14px para
 * entregar um número que cabe em três caracteres. O número fica no nome
 * acessível do título — ver o markup, que o traz dentro do próprio h1 — então
 * quem ouve recebe "Caixa de entrada, 4 de 128" numa leitura só. */
.ucam-viewbar__contagem {
  flex: none;
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
  color: var(--ucam-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* O empurrão. Tudo que vier depois dele assenta na ponta contrária — é como as
 * três fileiras dividem estado à esquerda e ação à direita sem cada uma
 * inventar o próprio justify-content. */
.ucam-viewbar__folga { flex: 1 1 auto; min-inline-size: var(--ucam-space-inline-sm); }

.ucam-viewbar__acoes {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  flex: none;
}

/* O CAMINHO DE VOLTA — botão de ícone, encostado no título.
 *
 * A tela de detalhe abria com um link de texto sublinhado acima do título:
 * "Voltar para a caixa de entrada", nove palavras e uma linha de 24px para
 * dizer o que a trilha diz de graça, e o primeiro elemento que o olho
 * encontrava ao abrir o requerimento. Aqui o voltar é o que ele é — um
 * controle — e vive onde o olho o procura: à esquerda do nome da tela.
 *
 * O recuo negativo alinha o ÍCONE com a prumada do título e da trilha, e não
 * a caixa do botão: o que a coluna alinha é tinta, não área clicável. Sem ele
 * a trilha nasceria 8px à esquerda do título logo abaixo. */
.ucam-viewbar__voltar {
  flex: none;
  margin-inline-start: calc(var(--ucam-space-inline-sm) * -1);
}

/* A META do título: um fato curto que qualifica a tela — a natureza do
 * requerimento, o tipo do plano. Vive NA fileira do título, e não numa frase
 * de apoio abaixo dele: "Revisão de nota" são três palavras que não compram
 * uma terceira linha de barra.
 *
 * Separada por um ponto médio em vez de filete — o separador vertical é para
 * grupos de CONTROLE, e isto é texto. */
.ucam-viewbar__meta {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  font-size: var(--ucam-typography-body-sm-font-size);
  color: var(--ucam-color-text-secondary);
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ucam-viewbar__meta::before {
  content: "·";
  color: var(--ucam-color-border-strong);
}

/* O separador vertical entre grupos de controle da mesma fileira. */
.ucam-viewbar__sep {
  flex: none;
  inline-size: 1px;
  block-size: 1.25rem;
  background: var(--ucam-color-border-subtle);
}

/* O REFLUXO DA BARRA em tela estreita.
 *
 * Medido a 430px: a fileira de ferramentas não quebrava, e o empurrão entre
 * as abas e os controles continuava exigindo a largura toda. O resultado era
 * a primeira aba cortada em "Agua" — a fila ATIVA, o único rótulo da fileira
 * que a pessoa precisa ler para saber o que está vendo, esmagada para caber
 * uma ordenação que ali não é urgente.
 *
 * Duas linhas resolvem: as fileiras quebram, e o empurrão sai de cena. Sem o
 * empurrão os grupos se juntam à esquerda em vez de disputar as pontas, e o
 * que não couber desce para a linha seguinte inteiro, em vez de encolher. */
${abaixo('nav-fixa')} {
  .ucam-viewbar__fileira { flex-wrap: wrap; }
  .ucam-viewbar__folga { display: none; }
  /* O grupo de ações também quebra por dentro. Com flex: none ele media a
   * soma de ordenação, filtros e ⋮, e a 390px o ⋮ passava 4px da borda. */
  .ucam-viewbar__acoes { flex-shrink: 1; flex-wrap: wrap; min-inline-size: 0; }
  /* O segmented ROLA, como as abas logo abaixo: a 390px o do Analytics media
   * 461px numa fileira de 350 e o .ucam-main recortava "Graduação EAD" sem
   * sinal. Só aqui, porque rolar recorta o anel de foco; por isso ele entra
   * para dentro do segmento enquanto o trilho rola. */
  .ucam-segmented { max-inline-size: 100%; overflow-x: auto; scrollbar-width: none; }
  .ucam-segmented button:focus-visible { outline-offset: calc(-1 * var(--ucam-focus-ring-width)); }
}

/* As abas ROLAM na horizontal antes de encolher. Sete filas num telefone não
 * cabem em largura nenhuma, e a saída não é apertá-las até o rótulo sumir:
 * é deixá-las passar por baixo do dedo. */
.ucam-viewbar .ucam-tabs {
  max-inline-size: 100%;
  overflow-x: auto;
}

/* CAMPO NA BARRA mede o que o conteúdo pede, não a largura do painel.
 *
 * O .ucam-input-group nasce com inline-size: 100%, e está certo — ele é peça
 * de FORMULÁRIO, onde o campo ocupa a coluna. Na barra de visão isso o fazia
 * atravessar o painel inteiro: medido na tela de movimento de caixa, a data
 * "28/08/2026" ocupava 1455px de um painel de 1107, e um campo de dez
 * caracteres lia como o assunto da fileira em vez de um controle dela.
 *
 * Aqui ele encolhe ao conteúdo e ganha a altura de controle pequeno, que é a
 * dos botões que dividem a fileira com ele. Quem PRECISA crescer — a busca da
 * grade de módulos, que peneira 58 sistemas — pede flex-grow no próprio
 * elemento, e o pedido vence esta regra por ser mais específico.
 *
 * O controle interno também para de crescer: é o que faz o atributo \`size\` do
 * input voltar a significar algo. Com flex: 1 ele esticava até a borda do
 * grupo e os dez caracteres declarados nunca mediam nada. */
.ucam-viewbar .ucam-input-group {
  flex: 0 1 auto;
  inline-size: auto;
  block-size: var(--ucam-size-control-sm);
}

.ucam-viewbar .ucam-input-group__controle { flex: 0 1 auto; }


/* A trilha dentro da barra perde a margem que ela tem solta na página: quem
 * espaça aqui é a fileira. */
.ucam-viewbar .ucam-trilha { margin-block-end: 0; }

/* As abas dentro da barra perdem o filete próprio: o fio da barra já fecha o
 * conjunto, e dois fios a 44px um do outro seriam um degrau que não separa
 * nada. O item ativo continua marcado pelo sublinhado de baixo, que é o que
 * diz qual fila está aberta. */
.ucam-viewbar .ucam-tabs {
  margin-block-end: 0;
  border-block-end: 0;
  /* As abas não cedem largura às ferramentas. Como a tira rola, o flex a
   * tratava como encolhível e a 1024px a fileira da caixa de entrada mostrava
   * "Aguardam você · Minha pauta · Encami" com o resto atrás da ordenação —
   * um recorte da MESMA lista escondido sem sinal. A tira fica inteira e a
   * fileira quebra: as ferramentas descem para uma segunda linha, à direita. */
  flex: 0 0 auto;
  max-inline-size: 100%;
}

.ucam-viewbar__fileira:has(> .ucam-tabs) { flex-wrap: wrap; }
.ucam-viewbar__fileira:has(> .ucam-tabs) > .ucam-viewbar__acoes { margin-inline-start: auto; }

/* ----------------------------------- o conteúdo abaixo da barra de visão --- */
/* O recuo que saiu do .ucam-main entra aqui. Fica no CORPO, e não na barra,
 * porque a barra precisa atravessar o painel de ponta a ponta para que o fio
 * embaixo dela seja uma linha inteira. */

.ucam-corpo {
  flex: 1;
  min-block-size: 0;
  padding: var(--ucam-space-inset-lg);
  overflow-y: auto;
  /* O corpo é o CONTÊINER que o bloco de divisão consulta (ver .ucam-split):
   * é a largura dele, e não a da janela, que diz se o painel de apoio cabe ao
   * lado. Só o eixo inline — conter o bloco travaria a altura do rolo. */
  container: corpo / inline-size;
}

/* CORPO DE LEITURA: a medida do texto, não a da barra.
 *
 * Havia um jeito de estreitar a coluna e ele estava no lugar errado agora:
 * .ucam-content--estreita põe o teto de 48rem no contêiner que envolve TUDO
 * o que a tela emite — barra de visão inclusive. O resultado, na tela de
 * cálculo de mensalidade: a barra parava em 768px e o fio embaixo dela virava
 * um traço no meio do painel, com o resto da largura em branco à direita.
 *
 * A barra é CROMO e atravessa o painel; o texto é CONTEÚDO e tem medida de
 * leitura. São duas larguras diferentes na mesma tela, e é o corpo que
 * carrega a segunda. O teto some o recuo na conta porque é ele que separa o
 * texto da borda: o que precisa medir 48rem é a linha, não a caixa.
 *
 * ENCOSTADO À ESQUERDA, e não centrado no que sobra — mesma razão que
 * .ucam-main já documenta: com a coluna de navegação fixa ao lado, centrar
 * move a borda esquerda do conteúdo a cada troca de tela, e a prumada da
 * esquerda é a única referência estável que a coluna oferece. */
.ucam-corpo--leitura {
  max-inline-size: calc(48rem + 2 * var(--ucam-space-inset-lg));
}

/* Corpo de FORMULÁRIO. As duas telas que usavam a medida de leitura eram
 * formulários — novo usuário e cálculo de mensalidade — e 48rem é medida de
 * PARÁGRAFO: a 1440px o formulário parava em 2/3 do painel e o terço da
 * direita ficava vazio, lido como defeito e não como respiro (16/09/2026).
 * Formulário se lê por fileira de campos, não por linha de texto; 64rem
 * ocupa o painel numa tela comum e ainda segura o campo de nome de virar uma
 * régua de 1.500px num monitor largo. Mesma prumada à esquerda. */
.ucam-corpo--formulario {
  max-inline-size: calc(64rem + 2 * var(--ucam-space-inset-lg));
}

/* Corpo que hospeda um bloco de altura cheia — lista e detalhe, tabela que
 * rola por dentro — não rola por si e não paga recuo: quem rola é o bloco. */
.ucam-corpo--pleno {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --------------------------- lista e detalhe encostados --------------------- */
/* A regra de superfície do arranjo, aplicada ao bloco: os dois painéis se
 * encostam e o que os separa é o fio. O gap de 12px, os dois raios e as duas
 * bordas saem; sobra uma linha vertical.
 *
 * A ALTURA deixa de ser conta. O bloco lia
 * calc(var(--ucam-vh) - 14rem) — um desconto no chute que errava toda vez que
 * a moldura mudava de altura, e que a barra de visão mudaria de novo. Dentro
 * de um .ucam-corpo--pleno em coluna flex, \`flex: 1\` resolve sozinho. */
.ucam-corpo--pleno > .ucam-inbox {
  flex: 1;
  block-size: auto;
  min-block-size: 0;
  gap: 0;
}

.ucam-corpo--pleno > .ucam-inbox > .ucam-inbox__lista {
  border: 0;
  border-inline-end: 1px solid var(--ucam-color-border-subtle);
  border-radius: 0;
}

.ucam-corpo--pleno > .ucam-inbox > .ucam-inbox__detalhe {
  border: 0;
  border-radius: 0;
}


/* ============================================================== LOGIN === */
/* Bloco de arranjo: a tela de entrada em duas colunas.
 *
 * O QUE ELA SUBSTITUI: um cartão de 25rem centrado no meio de uma janela de
 * 1440, com a faixa da aplicação flutuando vazia acima dele — uma testeira
 * recuada das três bordas, com logo e nome do sistema, e mais nada dentro,
 * porque antes de entrar não há busca, campus nem conta para hospedar. Sobrava
 * uma barra de 72px de altura por 1392 de largura carregando dois elementos, e
 * abaixo dela um oceano cinza com um formulário de dois campos no meio.
 *
 * O arranjo novo não tem faixa nenhuma: a marca desce para o alto da coluna do
 * formulário, que é onde ela já estaria se alguém desenhasse esta tela do
 * zero, e a metade que sobrava vira a coluna institucional — a única superfície
 * grande de bordô que resta no sistema, agora que a faixa saiu de toda tela.
 *
 * É a mesma economia do arranjo lateral, aplicada à única tela que não tem
 * navegação: nada flutua, nada se recua das bordas, e o espaço vai para o que
 * a tela faz. */

.ucam-login {
  display: grid;
  /* Uma coluna por padrão. A institucional entra a partir de 64rem — abaixo
   * disso ela empurraria o formulário para fora da primeira dobra, e quem abre
   * o login num celular vem para digitar, não para ler sobre a universidade. */
  grid-template-columns: minmax(0, 1fr);
  /* A ALTURA É A DA MOLDURA, não a da janela.
   *
   * Era var(--ucam-vh), de quando a tela sangrava de ponta a ponta. Dentro
   * do painel isso passaria da moldura pela altura das duas réguas e a
   * coluna bordô vazaria pelo pé. O 100% resolve sem conta nenhuma porque o
   * .ucam-content--pleno já tem altura definida: ele é a fileira 1fr da
   * grade do shell. Nada aqui precisa saber quanto vale a régua. */
  min-block-size: 100%;
  background: var(--ucam-color-surface-default);
}

${acima('nav-fixa')} {
  .ucam-login { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
}

/* ------------------------------------------------------ coluna do form --- */

.ucam-login__acesso {
  display: grid;
  /* DUAS fileiras: o formulário no meio, o apoio no pé.
   *
   * Eram três, e a de cima hospedava a marca presa no canto superior
   * esquerdo. Medido na janela de 1440, isso punha o lockup a 335px do
   * título — longe demais para ancorar coisa alguma, e o bloco do
   * formulário lia como se estivesse boiando. A marca desceu para dentro do
   * miolo, encostada no título que ela apresenta.
   *
   * Ela desce ALINHADA À ESQUERDA e não centrada como na referência: o
   * lockup da UCAM é horizontal e largo (211x39), e centrá-lo sobre um
   * formulário alinhado à esquerda criaria dois eixos na mesma coluna. Quem
   * pode ser centrado é símbolo quadrado, que não é a marca desta
   * universidade. */
  grid-template-rows: 1fr auto;
  gap: var(--ucam-space-inset-lg);
  padding: var(--ucam-space-inset-lg);
  min-inline-size: 0;
}

${acima('respiro-completo')} {
  .ucam-login__acesso { padding: var(--ucam-space-inset-xl); }
}

.ucam-login__marca {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-md);
}

/* A logo institucional, por máscara — mesma mecânica da coluna e da faixa: a
 * página hospedeira aponta --ucam-appbar-logo e o elemento recorta a si
 * mesmo. Um pouco maior que na moldura: aqui ela é a única marca da tela. */
.ucam-login__logo {
  flex: none;
  /* 1.25 × 20px = 25px, altura ímpar que centrava em meio-pixel; 1.2 dá 24
   * e mantém a proporção do lockup, porque a máscara é contain. */
  inline-size: calc(var(--ucam-appbar-logo-width) * 1.2);
  block-size: calc(var(--ucam-appbar-logo-height) * 1.2);
  background: currentColor;
  color: var(--ucam-color-text-primary);
  -webkit-mask: var(--ucam-appbar-logo) no-repeat center / contain;
  mask: var(--ucam-appbar-logo) no-repeat center / contain;
}

/* O miolo: a medida do formulário curto, centrada na coluna.
 *
 * 25rem é a mesma largura de foco que o arranjo antigo usava, e continua
 * certa — o que estava errado era ela ser a largura da TELA, e não a do
 * formulário dentro dela. */
.ucam-login__miolo {
  align-self: center;
  justify-self: center;
  inline-size: 100%;
  max-inline-size: 25rem;
}

/* O apoio no pé da coluna: quem responde pela tela à esquerda, onde pedir
 * ajuda à direita. Nenhum dos dois é ação da tela, e é por isso que ficam
 * aqui embaixo e no tamanho de legenda — o único botão continua sendo um. */
/* UMA LINHA, corrida (13/09/2026). Eram duas peças nas pontas da coluna —
 * quem responde à esquerda, ajuda à direita — e a tela tinha cinco textos
 * soltos. Numa linha só de legenda, separada por ponto, o pé da coluna lê
 * como assinatura e não como dois avisos. */
.ucam-login__apoio {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  margin: 0;
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

/* ---------------------------------------------- coluna institucional --- */
/* A ÚNICA superfície grande de bordô que resta no sistema.
 *
 * Ela existe porque a faixa saiu: a marca deixou de atravessar o campo de
 * leitura em toda tela de todo dia, e passou a ocupar meia tela na única em
 * que não há trabalho a fazer — antes de entrar não há dado na tela para o
 * bordô disputar. É a troca que o arranjo lateral propõe, no lugar onde ela
 * rende mais.
 *
 * O que ela mostra é VERDADE sobre o sistema — os módulos que existem do outro
 * lado da senha, tirados da mesma lista que o lançador da moldura monta. Não é
 * depoimento de usuário: um design system que fabrica elogio de gente que não
 * existe ensina a fabricar. */
.ucam-login__institucional {
  display: none;
  background: var(--ucam-color-surface-brand);
  color: var(--ucam-color-text-on-brand);
  /* 40px de recuo — mais que os 24 da moldura: a coluna é uma superfície
   * grande de cor, e texto a 24px da borda de um bloco de 640px lê apertado.
   * A janela desconta o mesmo valor para sangrar (--ucam-login-recuo). */
  --ucam-login-recuo: 2.5rem;
  padding: var(--ucam-login-recuo);
  min-inline-size: 0;
}

${acima('nav-fixa')} {
  .ucam-login__institucional {
    display: grid;
    /* Três fileiras: discurso, janela, campi. O que produzia dois vãos de
     * mais de 300px cada não era a contagem de fileiras — era a LISTA DE
     * MÓDULOS ocupar a do pé, a 300px da frase que ela ilustra, enquanto a
     * frase boiava sozinha no meio. Frase e módulos são o mesmo argumento —
     * um acesso, e o que ele abre — e por isso viraram um bloco só, o
     * .ucam-login__discurso, que é quem habita a fileira do meio. No pé fica
     * uma legenda de uma linha, que não abre vão porque não pede altura. */
    /* Frase e janela são UM bloco, centrado na coluna como o formulário está
     * centrado na dele: as duas fileiras de 1fr em volta dividem a sobra por
     * igual. A legenda de campi que ocupava uma quinta fileira saiu em
     * 13/09/2026 — era texto solto numa tela de dois campos. */
    grid-template-rows: 1fr auto auto 1fr;
    gap: 0;
  }
  .ucam-login__discurso { grid-row: 2; }
  .ucam-login__janela { grid-row: 3; margin-block-start: var(--ucam-space-stack-lg); }
}

/* O bloco do meio: a frase e o que ela promete, no eixo óptico da coluna. */
.ucam-login__discurso {
  /* No ALTO, não no centro: a frase abre o painel e a janela vem logo abaixo
   * dela, no mesmo bloco de leitura; centrar os dois deixava um vão igual em
   * cima e embaixo que não pertencia a ninguém. */
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-stack-sm);
}

/* O símbolo, no alto. Mesma mecânica de máscara do rail — e o mesmo arquivo. */
.ucam-login__frase {
  margin: 0;
  max-inline-size: 26ch;
  font-size: var(--ucam-typography-page-title-font-size);
  font-weight: var(--ucam-typography-page-title-font-weight);
  line-height: var(--ucam-typography-page-title-line-height);
  letter-spacing: -0.02em;
}

/* A frase de apoio e a linha de campi saíram em 13/09/2026: a janela abaixo
 * ilustra o que a frase de apoio repetia, e os campi não eram informação de
 * quem vem entrar. A frase fica sozinha, e é o único texto da coluna. */

/* ------------------------------------------- a janela do Portal --- */
/* O que existe do outro lado da senha, mostrado como a pessoa vai vê-lo: a
 * grade de módulos de "Meus sistemas", com os MESMOS cartões, ladrilhos e
 * estrelas daquela tela. Era uma caixa de entrada do Protocolo — um sistema
 * só — ao lado de uma frase que promete todos.
 *
 * É FIGURA: aria-hidden inteira, e por isso feita só de <span>. O que a
 * coluna afirma está na frase, no apoio e na linha de campi.
 *
 * SANGRA pela direita: 80px além do recuo do painel, o que corta a terceira
 * coluna da grade no meio. Uma tela cortada pelo quadro diz que continua além
 * dele — que é exatamente o que a coluna promete. Quem corta é o raio do
 * painel (overflow do .ucam-login), não a janela. */
.ucam-login__janela {
  --ucam-janela-sangria: 5rem;
  align-self: start;
  background: var(--ucam-color-surface-chrome);
  color: var(--ucam-color-text-primary);
  border-radius: var(--ucam-radius-surface);
  box-shadow: var(--ucam-elevation-overlay);
  overflow: hidden;
  margin-inline-end: calc((var(--ucam-login-recuo) + var(--ucam-janela-sangria)) * -1);
}

/* A testeira da janela: ponto de marca, sistema e trilha. Mesma anatomia da
 * faixa real, na escala da figura; 40px, o mesmo da fileira de seções. */
.ucam-login__janela-topo {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-sm);
  block-size: 2.5rem;
  padding-inline: var(--ucam-space-inset-md) calc(var(--ucam-space-inset-md) + var(--ucam-janela-sangria));
  background: var(--ucam-color-surface-default);
  box-shadow: inset 0 -1px 0 var(--ucam-color-border-subtle);
  font-size: var(--ucam-typography-caption-font-size);
  font-weight: var(--ucam-typography-label-font-weight);
}

.ucam-login__janela-ponto {
  inline-size: 1rem;
  block-size: 1rem;
  flex: none;
  border-radius: var(--ucam-radius-miudo);
  background: var(--ucam-color-surface-brand);
}

.ucam-login__janela-sep,
.ucam-login__janela-onde,
.ucam-login__janela-conta {
  color: var(--ucam-color-text-secondary);
  font-weight: var(--ucam-typography-body-font-weight);
}

.ucam-login__janela-corpo {
  padding: var(--ucam-space-inset-md) calc(var(--ucam-space-inset-md) + var(--ucam-janela-sangria)) var(--ucam-space-inset-md) var(--ucam-space-inset-md);
}

/* Título de seção da grade, na escala da figura: rótulo e contagem, como o
 * cabeçalho de seção real. */
.ucam-login__janela-titulo {
  display: flex;
  align-items: baseline;
  gap: var(--ucam-space-inline-sm);
  margin-block-end: var(--ucam-space-inline-sm);
  font-size: var(--ucam-typography-body-sm-font-size);
  font-weight: var(--ucam-typography-section-title-font-weight);
}

/* Quatro colunas de largura FIXA, e não auto-fit: a quarta tem de existir
 * para ser cortada. 10rem por cartão dá 4 × 160 + 3 × 12 = 676px de grade
 * numa janela que mostra 600: a última coluna entra 68px no quadro — o
 * ladrilho inteiro e o começo do nome —, o bastante para ler como cartão
 * cortado e não como sobra. */
.ucam-login__grade {
  display: grid;
  grid-template-columns: repeat(4, 10rem);
  gap: var(--ucam-space-inline-md);
}

/* O cartão de módulo da grade real, sem ser acionável: mesma moldura, mesmo
 * ladrilho, mesmo par título/apoio. Empilhado por dentro porque aqui é span. */
.ucam-login__modulo {
  display: flex;
  flex-direction: column;
  gap: var(--ucam-space-inline-sm);
}

.ucam-login__modulo .ucam-card__titulo,
.ucam-login__modulo .ucam-card__apoio { display: block; }

/* A estrela é o mesmo desenho do interruptor da grade — solta em traço,
 * fixa em bordô cheio — sem ser interruptor. Caixa de 28 como o botão sm,
 * para o ladrilho e a estrela fecharem na mesma linha que na tela real. */
.ucam-login__estrela {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  color: var(--ucam-color-text-secondary);
}

.ucam-login__estrela--fixa {
  color: var(--ucam-color-action-primary-default);
  --ucam-icon-fill: currentColor;
}

/* ------------------------------------------ entrada alternativa --- */
/* O DIVISOR do "ou entre com". Fio dos dois lados de uma palavra, e não uma
 * linha com texto por cima: assim a frase não precisa de fundo para abrir
 * espaço no fio, e a tela continua sem tinta cinza atrás de texto. */
.ucam-login__ou {
  display: flex;
  align-items: center;
  gap: var(--ucam-space-inline-md);
  font-size: var(--ucam-typography-caption-font-size);
  color: var(--ucam-color-text-secondary);
}

.ucam-login__ou::before,
.ucam-login__ou::after {
  content: "";
  flex: 1;
  block-size: 1px;
  background: var(--ucam-color-border-subtle);
}

/* Os dois provedores dividem a linha em partes IGUAIS. Largura por conteúdo
 * daria a "Microsoft" mais área que a "Google" e insinuaria preferência onde
 * não há: as duas contas valem o mesmo acesso. */
.ucam-login__provedores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ucam-space-inline-sm);
}

/* O shell sem navegação NÃO reserva a coluna dela.
 *
 * O arranjo lateral declara duas colunas a partir de 64rem — a da navegação e
 * a do conteúdo. Numa tela sem navegação a primeira ficaria reservada e vazia,
 * e o conteúdo nasceria 318px para dentro da janela com uma faixa branca
 * inexplicável à esquerda. É o mesmo cuidado que .ucam-shell--sem-nav já toma
 * ao esconder o painel e o escurecimento. */
${acima('nav-fixa')} {
  .ucam-shell--lateral.ucam-shell--sem-nav {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "main"
      "footer";
  }
}

/* ================================================ ALVO DE PONTEIRO === */
/* A ÁREA CLICÁVEL NÃO É O DESENHO — e é essa diferença que este bloco usa.
 *
 * A 2.5.8 (AA) pede 24 x 24 px de alvo; a 2.5.5 (AAA) pede 44. O sistema
 * desenha controle de 32px por decisão de densidade, escrita no size.control-md:
 * 36px em volta de um rótulo de 13 é ar, e é o que engorda a interface. Essa
 * decisão fica de pé. O que não ficava de pé era o resto: o token
 * size.touch-min existia desde o primeiro dia, declarava 2.75rem, dizia no
 * proprio $description "mínimo 44x44 para alvo primário" — e a folha inteira
 * nunca o referenciou uma vez. Uma promessa declarada e nunca cumprida.
 *
 * O que a medição das doze telas achou, com sonda de elementFromPoint em
 * volta do centro de cada alvo:
 *
 *   .ucam-appbar__brand      199 x 20   marca da faixa, o alvo mais alto da tela
 *   .ucam-trilha a            82 x 19   cada degrau navegável da trilha
 *   .ucam-lote__limpar        64 x 22   "limpar seleção" da barra de lote
 *   .ucam-alert__fechar       24 x 24   passa na conta e falha nos CANTOS,
 *                                       que o raio recorta do teste de acerto
 *
 * A saída é o pseudo-elemento centrado, que já estava provado no × do chip:
 * ele ocupa a área sem ocupar layout, então o alvo cresce e a tela não muda
 * um pixel. O que muda aqui é que ele deixa de ser um remendo de um
 * componente e vira mecanismo com nome, com uma variável só governando os
 * dois patamares.
 *
 * E o patamar de 44 finalmente entra, por ponteiro grosso — que é onde ele
 * sempre foi a medida certa: no dedo. Em ponteiro fino o extensor para em 24
 * de propósito. Uma barra de ferramentas com vão de 8px entre ações teria,
 * com 44, seis pixels de invasão de cada lado — e dois alvos disputando a
 * faixa morta entre eles trocam um erro por outro. Com dedo o cálculo se
 * inverte: a invasão fica dentro do vão, não sobre a tinta do vizinho, e
 * errar o alvo por inteiro é o erro pior.
 *
 * Fora da lista, de propósito: item de navegação e aba, que já nascem com 40
 * e 46; e link em linha de texto corrido, que a própria 2.5.8 isenta e onde
 * um retângulo de 44 cobriria a linha de cima e a de baixo. Esses dois casos
 * são tratados logo abaixo, por recuo, que em elemento em linha cresce a
 * caixa de acerto sem mexer na linha. */

.ucam { --ucam-alvo-min: var(--ucam-size-icon-lg); }

@media (pointer: coarse) {
  .ucam { --ucam-alvo-min: var(--ucam-size-touch-min); }
}

.ucam-btn,
.ucam-alert__fechar,
.ucam-appbar__brand,
.ucam-appbar__lancador,
.ucam-select--faixa,
.ucam-appbar__user,
.ucam-nav__recolher,
.ucam-lote__acao,
.ucam-lote__limpar {
  position: relative;
}

.ucam-btn::after,
.ucam-alert__fechar::after,
.ucam-appbar__brand::after,
.ucam-appbar__lancador::after,
.ucam-select--faixa::after,
.ucam-appbar__user::after,
.ucam-nav__recolher::after,
.ucam-lote__acao::after,
.ucam-lote__limpar::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  /* 100% mais um piso: o extensor NUNCA encolhe o alvo de quem já é grande.
   * Sem as duas primeiras linhas, um botão de 200px de largura ganharia uma
   * área de 44 e perderia o resto. */
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: var(--ucam-alvo-min);
  min-block-size: var(--ucam-alvo-min);
}

/* O × do chip já tinha o seu, escrito à mão antes de existir mecanismo.
 * Agora ele lê a mesma variável, e passa a acompanhar o ponteiro grosso
 * junto com o resto — era o único alvo do sistema que crescia para 24 e
 * parava ali mesmo no celular. */
.ucam-chip button::after {
  inline-size: var(--ucam-alvo-min);
  block-size: var(--ucam-alvo-min);
}

/* SOB O DEDO, TODO CONTROLE — NÃO SÓ BOTÃO.
 *
 * O density.json promete 44px de acerto a "todo controle, sob ponteiro
 * grosso". A lista acima cumpria para botão e para as peças da faixa; a sonda
 * de toque a 390px, em 20 telas (19/09/2026), achou o resto de fora: select
 * de 32, segmented de 24, página da paginação, cabeçalho de coluna de 36,
 * caixa de seleção de 20, degrau da trilha de 27, o olho da senha, link solto
 * de apoio. Todos são peça fora de texto corrido, então todos cabem no mesmo
 * extensor. Só sob ponteiro grosso: no mouse eles já passam nos 24, e é aí
 * que a invasão sobre o vizinho custaria mais do que rende. */
@media (pointer: coarse) {
  .ucam-select-trigger,
  .ucam-segmented button,
  .ucam-pagination__page,
  .ucam-table__coluna,
  .ucam-input-group__acao,
  .ucam-check,
  .ucam-trilha a,
  .ucam-switch,
  /* O gatilho da seção recolhível: 31px de altura, e é a ÚNICA maneira de
     abrir o grupo — na grade de módulos do Portal ele aparece quatro vezes. */
  .ucam-section__gatilho,
  .ucam-link--apoio {
    position: relative;
  }
  .ucam-select-trigger::after,
  .ucam-segmented button::after,
  .ucam-pagination__page::after,
  .ucam-table__coluna::after,
  .ucam-input-group__acao::after,
  .ucam-check::after,
  .ucam-trilha a::after,
  .ucam-switch::after,
  .ucam-section__gatilho::after,
  .ucam-link--apoio::after {
    content: "";
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    translate: -50% -50%;
    inline-size: 100%;
    block-size: 100%;
    min-inline-size: var(--ucam-alvo-min);
    min-block-size: var(--ucam-alvo-min);
  }

  /* Caixa e interruptor: o <label> inteiro já é alvo, mas a CAIXA mora na
   * borda inicial dele. Centrado no rótulo, o extensor passava longe dela —
   * a metade de fora da caixa, que é onde o polegar mira, ficava sem área.
   * Aqui ele cresce a partir do rótulo: meia sobra do alvo para fora de cada
   * borda (a caixa sem texto É o rótulo inteiro), e altura de alvo centrada na linha (ou a do rótulo, se ele
   * quebrar em duas). */
  .ucam-check::after,
  .ucam-switch::after {
    translate: none;
    inset-inline-start: calc((var(--ucam-alvo-min) - var(--ucam-size-icon-lg)) / -2);
    inset-block-start: min(0px, calc(50% - var(--ucam-alvo-min) / 2));
    inline-size: calc(100% + var(--ucam-alvo-min) - var(--ucam-size-icon-lg));
    min-inline-size: 0;
    block-size: max(100%, var(--ucam-alvo-min));
    min-block-size: 0;
  }

  /* O CAMPO DE TEXTO NÃO TEM PSEUDO-ELEMENTO — <input> é elemento
   * substituído, e ::after nele não existe. Quem estende é o RÓTULO: clique
   * num pseudo-elemento do <label> é clique no <label>, e o <label for>
   * entrega o foco ao controle. O pseudo cobre o campo inteiro e sangra
   * (44 − 32) / 2 = 6px abaixo dele; os controles vêm depois no DOM e com
   * position, então pintam POR CIMA e continuam recebendo o próprio toque
   * (o cursor cai onde o dedo cai, não no fim do texto). Em cima o rótulo já
   * encosta; embaixo, a dica fica dentro da área — tocar na dica de um campo
   * é querer o campo. Rótulo sr-only não entra: o recorte dele recorta o
   * pseudo junto, e é o caso da busca, que tem lupa e placeholder à vista. */
  .ucam-field:has(> label[for]:not(.ucam-sr-only), > .ucam-cluster > label[for]) { position: relative; }
  .ucam-field > label[for]:not(.ucam-sr-only)::after,
  .ucam-field > .ucam-cluster > label[for]::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: 0;
    inset-block-end: calc((var(--ucam-alvo-min) - var(--ucam-size-control-md)) / -2);
  }
  .ucam-field > :is(input, select, textarea, .ucam-input-group, .ucam-select-wrap),
  .ucam-field :is(a[href], button):not(.ucam-select-trigger) {
    position: relative;
  }

  /* VÃO DE QUEM MORA ENFILEIRADO. O extensor centrado só não invade o
   * vizinho se o vão for pelo menos (alvo − desenho). Na faixa, peças de 28
   * com vão de 8 davam 8px de sobreposição de cada lado, e a peça que vem
   * depois no DOM ganhava a disputa: o menu perdia os cantos para a marca.
   * Na fileira de filtros, dois chips empilhados com 8px entre eles faziam o
   * × de baixo roubar o de cima. O desenho não cresce; cresce o vão. */
  .ucam-appbar { column-gap: calc(var(--ucam-alvo-min) - var(--ucam-size-control-sm)); }
  .ucam-viewbar__fileira { row-gap: calc(var(--ucam-alvo-min) - var(--ucam-size-control-sm)); }
  /* Com o vão maior, a fileira quebrada deixava o primeiro chip encostado no
   * fio de cima: a altura mínima centrava UMA linha e, com duas, não sobrava
   * recuo. Metade do vão em cima e embaixo põe o fio longe do chip. */
  .ucam-viewbar__fileira--filtros {
    row-gap: calc(var(--ucam-alvo-min) - var(--ucam-size-marcador));
    padding-block: calc((var(--ucam-alvo-min) - var(--ucam-size-marcador)) / 2);
  }
  /* A trilha assenta colada na faixa, e a faixa é sticky e fica por cima:
   * 4px de recuo davam ao degrau 6,5px de folga até ela, e o dedo que tocava
   * a metade de cima do alvo acertava a faixa. A fileira ganha a altura do
   * alvo e centra o degrau nela. */
  .ucam-viewbar__fileira--trilha { min-block-size: var(--ucam-alvo-min); padding-block-start: 0; }
}

/* LINK: RECUO, NÃO EXTENSOR.
 *
 * Recuo de bloco em elemento em linha cresce a caixa de acerto e NÃO mexe na
 * altura da linha — é a única propriedade que faz as duas coisas. Um extensor
 * absoluto aqui cobriria as linhas vizinhas do parágrafo e roubaria o clique
 * delas; o recuo cresce só o próprio degrau.
 *
 * Na trilha o link é item de um flex e o recuo conta na altura: 19,2px de
 * degrau viram 27,2. É crescimento desejado — a trilha é a fileira mais
 * apertada de toda a tela e o único alvo dela que se pode errar. */
.ucam-link,
.ucam-trilha a {
  padding-block: var(--ucam-space-inline-xs);
}

/* ====================================================== IMPRESSÃO === */
/* Padrão consulta-relatorio (patterns.json, ADR-025): a tela de resultado
 * imprime SÓ o conteúdo — título, chips de filtro, totais, tabela e a nota de
 * atualidade. Some tudo o que é moldura ou ação: faixa, navegação, rail,
 * barra móvel, rodapé, ações da barra de visão, paginação, barra de lote,
 * ações de formulário, dica de teclado. Vem do Relatórios Acadêmicos, que
 * já fazia isto em 74 templates e foi o primeiro sistema do parque a ter
 * regra de impressão; o UCAMDS não tinha nenhuma.
 *
 * A moldura lateral é uma grade de altura EXATA (block-size: var(--ucam-vh))
 * com os painéis rolando por dentro (overflow: auto/hidden). No papel isso
 * imprime uma janela só: a primeira tela da tabela e nada depois. Por isso o
 * bloco desfaz a grade e a altura fixa, e devolve overflow: visible a todo
 * contêiner rolável — a página cresce para o tamanho do conteúdo, que é o
 * que o papel precisa.
 *
 * Fundo e cor de texto vão para os tokens de superfície e texto do tema
 * CLARO, por color-scheme: quem imprime do tema escuro não deve gastar tinta
 * preta numa página inteira. A cor dos selos e dos totais fica: é
 * print-color-adjust: exact, porque o selo sem fundo perde o sentido. */
@media print {
  .ucam {
    color-scheme: light;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .ucam-appbar,
  .ucam-topbar,
  .ucam-nav,
  .ucam-nav-scrim,
  .ucam-rail,
  .ucam-mobilebar,
  .ucam-shell__footer,
  .ucam-skip,
  .ucam-viewbar__acoes,
  .ucam-viewbar__voltar,
  .ucam-pagination,
  .ucam-lote,
  .ucam-form-actions,
  .ucam-kbd,
  .ucam-menu,
  .ucam-drawer,
  .ucam-drawer-scrim,
  .ucam-tooltip,
  .ucam-chip button {
    display: none !important;
  }
  .ucam-shell,
  .ucam-shell--lateral,
  .ucam-shell--rail,
  .ucam-shell--topo {
    display: block;
    block-size: auto;
    min-block-size: 0;
    grid-template-columns: none;
    grid-template-rows: none;
  }
  .ucam-main,
  .ucam-content,
  .ucam-corpo,
  .ucam-inbox,
  .ucam-inbox__lista,
  .ucam-inbox__rolagem,
  .ucam-inbox__detalhe,
  .ucam-table-wrap,
  .ucam-drawer__body {
    display: block;
    overflow: visible !important;
    block-size: auto !important;
    max-block-size: none !important;
    max-inline-size: none;
  }
  .ucam-viewbar {
    position: static;
    border-block-end: 1px solid var(--ucam-color-border-default);
  }
  .ucam-corpo { padding: 0; }
  /* Selo, stat e chip continuam legíveis sem cor: o papel é a última tela
   * em que "cor sozinha" pode ser tudo o que restou. */
  .ucam-badge,
  .ucam-chip,
  .ucam-stat,
  .ucam-card,
  .ucam-table-wrap {
    border: 1px solid var(--ucam-color-border-default);
    box-shadow: none;
    break-inside: avoid;
  }
  .ucam-table thead { display: table-header-group; }
  .ucam-table tr { break-inside: avoid; }
  .ucam-table th,
  .ucam-table td { border-block-end: 1px solid var(--ucam-color-border-default); }
  /* Link vira texto: no papel, azul sublinhado é promessa sem destino. */
  .ucam a { color: inherit; text-decoration: none; }
}
`;

/* ------------------------------------------------------- portão ADR-007 --- */
// Toda custom property referenciada precisa existir e ser semântica.

// A vírgula do fallback entra na busca de propósito. Antes o padrão era
// `var\((--ucam-[a-z0-9-]+)\)` e QUALQUER var com fallback escapava do portão:
// var(--ucam-color-inventada, red) passava calado e pintava de vermelho em
// produção. Um portão que só examina o caso fácil não é portão.
const referenciadas = [...css.matchAll(/var\(\s*(--ucam-[a-z0-9-]+)\s*[,)]/g)].map((m) => m[1]);
const unicas = [...new Set(referenciadas)];

// Variáveis que a PRÓPRIA folha declara são botões de ajuste do bloco
// (--ucam-nav-width, --ucam-grid-min, --ucam-content-max), não tokens do
// design system: é assim que um prop do contrato — navWidth, maxContentWidth —
// alcança o CSS por style no elemento. Levam o prefixo --ucam- para não colidir
// com o CSS da aplicação hospedeira, e por isso precisam ser dispensadas aqui.
// Continuam sujeitas à ADR-007 pelo VALOR: o default de cada uma referencia
// token semântico, e essa referência é verificada como qualquer outra.
// A declaração nem sempre começa a linha: `.ucam-stack--sm { --x: y }` cabe
// numa linha só, e ancorar em ^ deixava esse caso de fora.
const declaradas = new Set(
  [...css.matchAll(/(?:^|[{;])\s*(--ucam-[a-z0-9-]+)\s*:/gm)].map((m) => m[1])
);

const inexistentes = unicas.filter((t) => !tokensDisponiveis.has(t) && !declaradas.has(t));

// Referência a PRIMITIVO viola a ADR-007.
//
// Por NOME EXATO, não por prefixo de grupo. A lista anterior era de oito
// grupos escritos à mão, de vinte que existem, e pelos doze que faltavam
// passaram 55 referências caladas — duration ×54 e shadow ×1. Trocá-la por
// "todos os grupos do spec" não resolve: `space` e `radius` existem nas duas
// camadas, e --ucam-space-inset-md (semântico) casa com o prefixo do
// primitivo. A pergunta certa é se o nome É um primitivo e NÃO é um
// semântico — e as duas listas já saem resolvidas do build-tokens.
const nomes = JSON.parse(readFileSync(join(ROOT, 'dist', 'tokens', 'ucam-tokens.json'), 'utf8'));
const ehPrimitivo = new Set(Object.keys(nomes.primitive).map((n) => `--ucam-${n}`));
const ehSemantico = new Set(Object.keys(nomes.semantic).map((n) => `--ucam-${n}`));

const primitivosUsados = unicas.filter(
  (t) => !declaradas.has(t) && ehPrimitivo.has(t) && !ehSemantico.has(t)
);


/* --------------------------------------------------- portão de breakpoint --- */
// Nenhuma media query de largura escrita à mão. Toda medida na folha precisa
// ter saído de acima()/abaixo(), ou seja: de um papel declarado em
// semantic.json > viewport. Sem isto, o próximo ajuste volta a ser um número
// digitado — que foi como nasceram os sete valores e os três dialetos de borda
// que este portão existe para não deixar voltar.
const larguras = [...css.matchAll(/\((min|max)-width:\s*([^)]+)\)/g)].map(
  (m) => `${m[1]}:${m[2].trim()}`
);
const foraDoToken = [...new Set(larguras)].filter((l) => !breakpointsEmitidos.has(l));

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'ucam.css'), css, 'utf8');

console.log('@ucam/css → dist/css/');
console.log(
  `  ucam.css  ${(css.length / 1024).toFixed(1)} KB  ${unicas.filter((t) => !declaradas.has(t)).length} tokens · ${declaradas.size} variáveis de bloco`
);

const erros = [];
if (inexistentes.length) erros.push(['tokens inexistentes', inexistentes]);
if (primitivosUsados.length) erros.push(['tokens primitivos referenciados direto (ADR-007)', primitivosUsados]);
if (foraDoToken.length) erros.push(['media query de largura fora do token viewport', foraDoToken]);

if (erros.length) {
  console.error('');
  for (const [titulo, lista] of erros) {
    console.error(`✗ ${titulo}:`);
    for (const t of lista) console.error(`    ${t}`);
  }
  process.exit(1);
}
console.log('  ✓ todos os tokens existem e são semânticos (ADR-007)');
console.log(`  ✓ ${breakpointsEmitidos.size} larguras, todas de papel declarado em viewport ou container`);
