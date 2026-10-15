import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { meta } from '../spec/spec';
import { sitesMeta } from '../spec/sites';
import { CENA_CAPA } from '../../generated/cena-capa';

/* A ILUSTRAÇÃO DA CAPA é a mesma cena do login do Portal — a Candido Mendes
 * na Praça XV, em isométrica calculada — pintada sobre o branco. A geometria
 * mora em tools/cena-login.mjs, que grava site/src/generated/cena-capa.ts no
 * passo 'telas' do build; aqui ficam só as tintas. Até 13/10/2026 a capa
 * tinha geometria própria (uma placa com peças de interface), e as duas
 * ilustrações do sistema não se pareciam. */

@Component({
  selector: 'ucam-inicio',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A CAPA EM DUAS COLUNAS (23/09/2026). Era uma pilha: título, faixa
         de números, callout, ilustração, cartões — e a ilustração, o único
         desenho da página, só aparecia depois de uma rolagem. Agora o texto e
         as duas portas ficam à esquerda e a ilustração à direita, na mesma
         dobra; a faixa de números fecha o bloco por baixo, atravessando as
         duas colunas. Abaixo de 64rem volta a empilhar.

         Duas portas, um primário: "Começar" leva à instalação, que é onde a
         pergunta do trilho é respondida (ADR-045); "Ver o catálogo" é a
         segunda entrada mais pedida e vai contornada. São os botões do
         próprio sistema — a capa do design system usa o botão que documenta. -->
    <header class="masthead">
      <div class="masthead-texto">
        <p class="eyebrow eyebrow-marca">Universidade Candido Mendes</p>
        <h1 class="display">Design System UCAM</h1>
        <p class="lede">
          Fundamentos, componentes e padrões para as interfaces da UCAM. Cada componente traz
          API, comportamento, requisitos de acessibilidade e limites de uso.
        </p>
        <p class="masthead-acoes">
          <a class="ucam-btn ucam-btn--primary ucam-btn--lg" routerLink="/comecar/instalacao">Começar</a>
          <a class="ucam-btn ucam-btn--secondary ucam-btn--lg" routerLink="/catalogo">Ver o catálogo</a>
        </p>
      </div>

      <!-- Decorativa por papel, com um nome que diz o que há nela. O SVG é
           gerado (ver o topo do arquivo) e entra por innerHTML. -->
      <figure
        class="ilustracao"
        role="img"
        aria-label="Ilustração isométrica da Universidade Candido Mendes na Praça XV: o chafariz do Mestre Valentim no meio da praça, o casarão colonial de arcos, a torre de vidro atrás dele, o cais e a barca."
        [innerHTML]="cena"
        (pointermove)="acompanhar($event)"
        (pointerleave)="soltar($event)"
      ></figure>

      <!-- Os sete números viraram uma GRADE de células, e não mais uma linha
           corrida de texto. Eram o fato mais forte da home — sete medidas do
           que já existe — e saíam a 13px, em cinza, todos com o mesmo peso do
           que os separava. Em célula, o número lê primeiro e o rótulo depois,
           que é a ordem em que a informação importa. -->
      <ul class="numeros">
        @for (n of numeros; track n.rotulo) {
          <li>
            <strong class="num">{{ n.valor }}</strong>
            <span>{{ n.rotulo }}</span>
          </li>
        }
      </ul>
    </header>

    <!-- A SEÇÃO DOS TRILHOS SAIU DA HOME (23/09/2026, ADR-046). A pergunta que
         decide o trilho e os dois cartões continuam existindo num lugar só —
         migracao.escolhaDoTrilho, impresso na instalação, no guia de migração
         e no kit de agentes (ADR-045). A home deixa de ser a página em que se
         escolhe: é a capa, e a capa mostra o que o sistema É. -->

    <section class="prose">
      <h2>Por onde começar</h2>
    </section>

    <!-- As portas levam um LADRILHO DE ÍCONE do próprio sistema, como os
         blocos de pontos das outras páginas: seis caixas de título e texto
         eram indistinguíveis entre si e do resto do site. O ladrilho é a
         .ucam-icon-tile de @ucam/css, não um quadrado desenhado aqui. -->
    <div class="grade-cartoes">
      @for (p of portas; track p.link) {
        <a class="card porta" [routerLink]="p.link">
          <span class="ucam-icon-tile" aria-hidden="true">
            <svg class="ic"><use [attr.href]="'#i-' + p.icone" /></svg>
          </span>
          <h3>{{ p.titulo }}</h3>
          <p class="small muted">{{ p.texto }}</p>
        </a>
      }
    </div>

    <!-- A nota de leitura DESCEU para depois das portas (23/09/2026). Ficava
         entre a faixa de números e a ilustração, e um bloco tingido no meio da
         capa lia como aviso e a partia em duas. Ela explica como ler o que vem
         a seguir, e o lugar disso é depois de a capa ter mostrado o que há. -->
    <div class="callout nota-leitura">
      <p class="eyebrow">Como ler esta documentação</p>
      <p>
        Cada componente tem um contrato: API, estados, tokens, requisitos de acessibilidade e
        limites de uso. O contrato é normativo — o que não está nele não é garantido. O que já é
        instalável está em <a routerLink="/comecar/skills">Skills e pacotes</a>; a versão e o
        estado de cada contrato, em <a routerLink="/releases">Releases</a>.
      </p>
    </div>
  `,
  styles: `
    /* O filete de 2px na tinta do texto SAIU. Um traço preto de ponta a ponta
       abaixo do título é o gesto de capa de relatório: separa por peso bruto,
       e ainda por cima competia com o próprio h1 pela atenção. Quem separa
       agora é o vão — e o degrau de superfície da grade de números, que
       fecha o bloco por baixo sem precisar de régua nenhuma. */
    .masthead {
      display: grid;
      gap: 2rem;
      align-items: center;
      margin-block-end: var(--ritmo-secao);
    }
    /* Duas colunas a partir de 64rem: 6/7, porque a ilustração é mais larga
       do que alta e perde detalhe se ficar com menos da metade. A faixa de
       números atravessa as duas colunas. */
    @media (min-width: 64rem) {
      .masthead {
        grid-template-columns: minmax(0, 6fr) minmax(0, 7fr);
        column-gap: 2.5rem;
      }
      .masthead > .numeros {
        grid-column: 1 / -1;
      }
    }
    .masthead h1 {
      font-size: clamp(2.125rem, 5vw, 3rem);
      margin: 0.6rem 0 1.1rem;
    }
    .masthead-texto .lede {
      margin: 0;
    }
    .masthead-acoes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin: 1.5rem 0 0;
    }
    /* Grade de células com filete de 1px.
       A divisória NÃO é gap sobre fundo tingido: são sete números e o auto-fit
       quase nunca fecha a linha (a 420px dá 2 colunas, então a última linha
       tem uma célula vazia). Com o truque do gap, essa célula vazia mostra o
       fundo do contêiner — e o que aparecia era um bloco cinza-azulado do
       tamanho de uma célula, medido por CDP a 420px.

       Cada célula desenha o próprio filete à direita e embaixo por box-shadow;
       os que sobram na borda externa são comidos pelo overflow:hidden do
       contêiner arredondado. Célula que não existe não desenha nada, que é
       exatamente o comportamento que faltava. */
    .numeros {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
      margin: 0.5rem 0 0;
      padding: 0;
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
    }
    .numeros li {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      padding: 0.8rem 0.95rem;
      box-shadow:
        1px 0 0 0 var(--ucam-color-border-subtle),
        0 1px 0 0 var(--ucam-color-border-subtle);
    }
    .numeros strong {
      font-size: 1.375rem;
      font-weight: 620;
      letter-spacing: -0.02em;
      line-height: 1.2;
      color: var(--ucam-color-text-primary);
    }
    .numeros span {
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
    }

    /* A ILUSTRAÇÃO ocupa a coluna e mede pela largura; o viewBox fixa a
       proporção. Sem fundo e sem moldura: a cena se desfaz na página por uma
       vinheta (ADR-040: nenhum fundo cinza no claro). */
    .ilustracao {
      margin: 0;
      padding: 0;
      min-inline-size: 0;
      /* As duas tintas da cena: o papel da página e o bordô da ação. Todo tom
         é uma mistura das duas, então a cena vira sozinha no tema escuro. */
      --cena-p: var(--ucam-color-surface-default);
      --cena-t: var(--ucam-color-action-primary-default);
    }
    /* O SVG entra por innerHTML (é gerado), e por isso o estilo passa pelo
       ::ng-deep: o conteúdo não recebe o atributo de escopo do componente. */
    :host ::ng-deep .ilustracao svg {
      display: block;
      inline-size: 100%;
      block-size: auto;
      max-block-size: 36rem;
      margin-inline: auto;
    }
    /* A PALETA: desenho a traço sobre papel, a das referências. Faces na cor
       da página, um traço na tinta cheia, sombra e chão em tinta diluída. É a
       mesma tabela da cena do login (tools/build-css.mjs, .ucam-login__cena),
       com papel e tinta trocados; mudou lá, muda aqui. */
    :host ::ng-deep .ilustracao path { fill: none; stroke: var(--cena-t); stroke-width: 1; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
    :host ::ng-deep .ilustracao :is(.p0, .p1, .l, .t0, .k0, .k1, .f1, .r0) { fill: var(--cena-p); }
    :host ::ng-deep .ilustracao :is(.p2, .m) { fill: color-mix(in srgb, var(--cena-t) 10%, var(--cena-p)); }
    :host ::ng-deep .ilustracao :is(.s, .k2) { fill: color-mix(in srgb, var(--cena-t) 20%, var(--cena-p)); }
    :host ::ng-deep .ilustracao .t1 { fill: color-mix(in srgb, var(--cena-t) 16%, var(--cena-p)); }
    :host ::ng-deep .ilustracao .t2 { fill: color-mix(in srgb, var(--cena-t) 32%, var(--cena-p)); }
    :host ::ng-deep .ilustracao .r1 { fill: color-mix(in srgb, var(--cena-t) 12%, var(--cena-p)); }
    :host ::ng-deep .ilustracao .r2 { fill: color-mix(in srgb, var(--cena-t) 24%, var(--cena-p)); }
    :host ::ng-deep .ilustracao :is(.g, .gm, .ag, .sh, .cr, .v, .vd, .lz, .pt, .kc, .kd, .fundo) { stroke: none; }
    :host ::ng-deep .ilustracao .g { fill: color-mix(in srgb, var(--cena-t) 6%, transparent); }
    :host ::ng-deep .ilustracao .gm { fill: color-mix(in srgb, var(--cena-t) 11%, transparent); }
    :host ::ng-deep .ilustracao .ag { fill: color-mix(in srgb, var(--cena-t) 14%, transparent); }
    :host ::ng-deep .ilustracao .sh { fill: color-mix(in srgb, var(--cena-t) 20%, transparent); }
    :host ::ng-deep .ilustracao .cr { fill: color-mix(in srgb, var(--cena-t) 22%, transparent); }
    :host ::ng-deep .ilustracao :is(.v, .vd) { fill: color-mix(in srgb, var(--cena-t) 34%, var(--cena-p)); }
    :host ::ng-deep .ilustracao .lz { fill: var(--cena-p); }
    :host ::ng-deep .ilustracao .pt { fill: color-mix(in srgb, var(--cena-t) 50%, transparent); }
    :host ::ng-deep .ilustracao .kc { fill: color-mix(in srgb, var(--cena-t) 24%, var(--cena-p)); }
    :host ::ng-deep .ilustracao :is(.kd, .a) { fill: var(--cena-t); }
    :host ::ng-deep .ilustracao .a2 { fill: color-mix(in srgb, var(--cena-t) 60%, var(--cena-p)); }
    :host ::ng-deep .ilustracao :is(.pv, .on, .malha, .gr, .ng, .rg, .fc) { stroke-width: 0.75; }
    :host ::ng-deep .ilustracao .pv { stroke: color-mix(in srgb, var(--cena-t) 10%, transparent); }
    :host ::ng-deep .ilustracao .malha { stroke: color-mix(in srgb, var(--cena-t) 7%, transparent); }
    :host ::ng-deep .ilustracao :is(.on, .gr, .ng, .rg) { stroke: color-mix(in srgb, var(--cena-t) 28%, transparent); }
    :host ::ng-deep .ilustracao :is(.clarao-0, .clarao-1) { stop-color: var(--cena-p); stop-opacity: 0; }
    :host ::ng-deep .ilustracao :is(.tr, .kk) { stroke-width: 3; }
    :host ::ng-deep .ilustracao .tr2 { stroke-width: 2.5; }
    :host ::ng-deep .ilustracao .fo { stroke-width: 1.5; }

    /* O MOVIMENTO, igual ao da cena do login (tools/build-css.mjs): as peças
       boiam, a barca vai e volta, a água oscila, as janelas piscam; o ponteiro
       move os dois planos. Só para quem não pediu menos movimento. */
    .ilustracao { --px: 0; --py: 0; }
    :host ::ng-deep .ilustracao :is(.base, .barca) { translate: calc(var(--px) * 6px) calc(var(--py) * 4px); transition: translate 320ms ease-out; }
    :host ::ng-deep .ilustracao .pc { translate: calc(var(--px) * -12px) calc(var(--py) * -8px); transition: translate 320ms ease-out; }
    @media (prefers-reduced-motion: no-preference) {
      :host ::ng-deep .ilustracao .pc > g { animation: cena-boiar 5.5s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -1.3s); }
      :host ::ng-deep .ilustracao .barca > g { animation: cena-navegar 28s ease-in-out infinite alternate; }
      :host ::ng-deep .ilustracao .on { animation: cena-onda 4.5s ease-in-out infinite alternate; }
      :host ::ng-deep .ilustracao .lz { animation: cena-piscar 3.2s ease-in-out infinite alternate; }
    }
    @keyframes cena-boiar { from { transform: translateY(3px); } to { transform: translateY(-5px); } }
    @keyframes cena-navegar { from { transform: translate(52px, -30px); } to { transform: translate(-104px, 60px); } }
    @keyframes cena-onda { from { transform: translateX(-5px); } to { transform: translateX(5px); } }
    @keyframes cena-piscar { from { opacity: 1; } to { opacity: 0.25; } }

    /* A home lê na mesma coluna das páginas internas. Ela herdava os 80rem
       inteiros do container, então a faixa de números e as grades de cartão
       iam a 1232px enquanto o texto parava em 509 — um salto de 2,4×, e a
       borda direita dos blocos nada tinha a ver com a do texto. */
    /* 64rem. Tentei 50rem para aproximar a coluna da medida do texto, e a
       faixa de números quebrou em duas linhas com três células vazias — pior
       que o vazio que eu queria resolver. A largura dos BLOCOS aqui é ditada
       pela peça mais larga que a home tem, que são os sete indicadores. */
    /* 29/09/2026: "pq o body do site tá mais pra esquerda? pq não está com a
       largura máxima igual ao header". Com --app-max em 96rem o cabeçalho foi
       a 1536px e a home seguia presa nos 64rem de quando a aplicação tinha 80:
       a borda esquerda batia com a do cabeçalho e a direita parava 470px
       antes, e a página lia torta. A home volta à coluna da aplicação — a
       mesma do cabeçalho —, e os sete indicadores, as portas e a ilustração
       enchem a largura dela. */
    :host {
      display: block;
    }
    /* As seis portas em trilhas FIXAS por degrau: 1, 2, 3 e 6, os divisores
       de seis. Com auto-fit (como era com cinco portas) sobrava uma porta
       sozinha na segunda fileira: 5 + 1 a 1024 (medido em 10/10/2026, quando
       a porta dos Sites entrou). */
    .grade-cartoes { grid-template-columns: minmax(0, 1fr); }
    @media (min-width: 30rem) {
      .grade-cartoes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 48rem) {
      .grade-cartoes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 72rem) {
      .grade-cartoes { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }
    .porta > .ucam-icon-tile {
      margin-block-end: 0.85rem;
    }
    .card h3 {
      margin: 0 0 0.4rem;
      font-size: 1rem;
    }
    .nota-leitura {
      margin-block: var(--ritmo-sub) 0;
    }
    .card p {
      margin: 0 0 0.5rem;
    }
    .card > :last-child {
      margin-bottom: 0;
    }
  `,
})
export default class IndexPage {
  protected readonly m = meta;

  /** A cena é SVG gerado no build, de fonte nossa: por isso passa sem o
   *  saneador, que tiraria os elementos de SVG. */
  protected readonly cena = inject(DomSanitizer).bypassSecurityTrustHtml(CENA_CAPA);

  /** A cena acompanha o ponteiro: a posição, de -1 a 1 em cada eixo, vai para
   *  --px e --py e a folha desloca os dois planos. Nada em toque, e nada para
   *  quem pediu menos movimento. */
  protected acompanhar(e: PointerEvent): void {
    if (e.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  }
  protected soltar(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  }

  /** As seis portas da capa: destino, ícone do sprite, nome e uma linha.
   *  O Servidor MCP saiu da capa em 29/09/2026 (pedido do Leonardo); segue
   *  no menu Começar. Sites entrou em 10/10/2026 (pedido do Leonardo: "um
   *  acesso, um ícone para acessar o modo sites"): o segundo sistema só se
   *  alcançava pela aba da faixa, e a capa não dizia que ele existe. O ícone
   *  é o mesmo da aba. */
  protected readonly portas = [
    { link: '/comecar/instalacao', icone: 'download', titulo: 'Instalação', texto: 'Como consumir o design system hoje, em cada trilho.' },
    { link: '/fundamentos/cor', icone: 'bookOpen', titulo: 'Fundamentos', texto: 'Cor, tipografia e espaçamento, com contraste calculado no build.' },
    { link: '/catalogo', icone: 'layoutGrid', titulo: 'Catálogo', texto: `${meta.componentes} contratos de componente.` },
    { link: '/decisoes', icone: 'scrollText', titulo: 'Decisões', texto: 'O porquê de cada regra, registrado em ADR.' },
    { link: '/padroes', icone: 'listChecks', titulo: 'Padrões', texto: 'Composições que resolvem uma tarefa inteira.' },
    { link: '/sites', icone: 'monitor', titulo: 'Sites', texto: `${sitesMeta.componentes} peças para os sites da universidade.` },
  ];

  /** Os sete números da grade, na ordem em que respondem "o que já existe?". */
  protected readonly numeros = [
    { valor: meta.componentes, rotulo: 'componentes' },
    { valor: meta.padroes, rotulo: 'padrões' },
    { valor: meta.adrs, rotulo: 'decisões' },
    { valor: meta.evidencias, rotulo: 'problemas catalogados' },
    { valor: meta.requisitosA11y, rotulo: 'requisitos de a11y' },
    { valor: meta.criteriosWcag, rotulo: 'critérios WCAG' },
    { valor: meta.conversoesMigracao, rotulo: 'conversões de migração' },
  ];
}
