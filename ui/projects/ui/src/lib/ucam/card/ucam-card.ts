import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/card.json
 *
 * Componente PRÓPRIO, sem base: o z-card da ZardUI é uma composição de seis
 * partes (header, title, description, content, footer, action) que impõe ritmo
 * interno — e o contrato daqui diz o contrário, que o cartão só DELIMITA e
 * quem espaça os filhos é o bloco de arranjo. Envolver aquela composição
 * significaria carregar seis elementos para desligar o que cinco deles fazem.
 *
 * AS CLASSES SÃO AS DO TRILHO A, e o estilo mora no bloco `styles` abaixo em
 * vez de virar utilitárias do Tailwind. A razão é de paridade, não de gosto:
 * a tipografia do cartão sai de tokens compostos (`--ucam-typography-label-*`),
 * e escrevê-los como valor arbitrário de utilitária espalha o mesmo token por
 * três sintaxes diferentes. Aqui o CSS é o mesmo texto que build-css.mjs emite,
 * e a divergência entre os trilhos fica visível numa comparação linha a linha.
 */
/**
 * flat é o repouso desde a ADR-019: dentro da moldura, o que separa o cartão
 * do painel é o fio de 1px. raised existe para o cartão sobre superfície sem
 * fio; sticky, para o que paira de verdade.
 */
export type UcamCardElevation = 'flat' | 'raised' | 'sticky';
export type UcamCardPadding = 'lg' | 'md' | 'none';
export type UcamCardAs = 'div' | 'section' | 'article' | 'a';

const PADDING: Record<UcamCardPadding, string> = {
  lg: 'ucam-card--inset-lg',
  md: 'ucam-card--inset-md',
  none: 'ucam-card--inset-none',
};

let seq = 0;

@Component({
  selector: 'ucam-card',
  exportAs: 'ucamCard',
  imports: [NgTemplateOutlet, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /**
   * `contents` no host pelo mesmo motivo de ucam-description-list: o elemento
   * <ucam-card> não pode virar uma caixa a mais entre a grade e a superfície,
   * senão `grid-template-columns` do contêiner passa a governar um invólucro
   * vazio e o cartão deixa de ser o item da grade.
   */
  host: { class: 'contents' },
  template: `
    <!-- O Angular não troca a TAG de um elemento em tempo de execução: a
         escolha entre div, section, article e a é estrutural e tem de existir
         no template. Só um ramo vive por vez, então o <ng-content> do
         #corpo é instanciado uma única vez. -->
    @switch (elemento()) {
      @case ('a') {
        <a [class]="classes()" [attr.href]="href()" [attr.aria-labelledby]="rotuladoPor()">
          <ng-container [ngTemplateOutlet]="corpo" />
        </a>
      }
      @case ('section') {
        <section [class]="classes()" [attr.aria-labelledby]="rotuladoPor()">
          <ng-container [ngTemplateOutlet]="corpo" />
        </section>
      }
      @case ('article') {
        <article [class]="classes()" [attr.aria-labelledby]="rotuladoPor()">
          <ng-container [ngTemplateOutlet]="corpo" />
        </article>
      }
      @default {
        <div [class]="classes()" [attr.aria-labelledby]="rotuladoPor()">
          <ng-container [ngTemplateOutlet]="corpo" />
        </div>
      }
    }

    <ng-template #corpo>
      <!-- O CABEÇALHO: ladrilho de ícone, título e apoio empilhados, e o que
           vier em [ucamCardCabecalho] à direita. Existe quando há ícone E
           título — ladrilho sem nome não diz nada. É a única parte do cartão
           com margem própria: separa o conteúdo da moldura, e essa distância
           tem de ser a mesma em todo cartão. -->
      @if (icone() && titulo()) {
        <div class="ucam-card__cabecalho">
          <span class="ucam-icon-tile" aria-hidden="true"><ucam-icon [name]="icone()!" size="md" /></span>
          <div class="ucam-card__cabecalho-texto">
            <p class="ucam-card__titulo" [id]="idTitulo">
              @if (acionavel() && href()) {
                <a class="ucam-card__link" [attr.href]="href()">{{ titulo() }}</a>
              } @else {
                {{ titulo() }}
              }
            </p>
            @if (apoio(); as a) {
              <p class="ucam-card__apoio">{{ a }}</p>
            }
          </div>
          <ng-content select="[ucamCardCabecalho]" />
        </div>
      } @else {
      @if (titulo(); as t) {
        <p class="ucam-card__titulo" [id]="idTitulo">
          <!-- O link mora no TÍTULO e estica sobre a superfície inteira por
               ::after. É o que permite ter destino E controle no mesmo cartão
               sem produzir alvo aninhado: o alvo de clique é o cartão todo, e
               o nome acessível do link é só o título — não a superfície
               inteira lida em voz alta. -->
          @if (acionavel() && href()) {
            <a class="ucam-card__link" [attr.href]="href()">{{ t }}</a>
          } @else {
            {{ t }}
          }
        </p>
      }
      @if (apoio(); as a) {
        <p class="ucam-card__apoio">{{ a }}</p>
      }
      }
      <ng-content />
      <ng-content select="[ucamCardAcao]" />
      <ng-content select="[ucamCardRodape]" />
    </ng-template>
  `,
  /**
   * Espelho do bloco `.ucam-card` de tools/build-css.mjs. Encapsulation None
   * porque as classes precisam alcançar o conteúdo projetado — o rodapé e a
   * ação vêm de fora do componente.
   */
  styles: `
    ucam-card .ucam-card {
      display: block;
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      color: var(--ucam-color-text-primary);
      box-shadow: var(--ucam-elevation-flat);
      /* O cartão TAMBÉM é usado como <a>, e sem isto o sublinhado do navegador
         atravessa o cartão inteiro na grade de módulos do Portal. */
      text-decoration: none;
    }
    ucam-card .ucam-card--inset-lg { padding: var(--ucam-space-inset-lg); }
    ucam-card .ucam-card--inset-md { padding: var(--ucam-space-inset-md); }
    ucam-card .ucam-card--inset-none { padding: 0; }
    ucam-card .ucam-card--raised  { box-shadow: var(--ucam-elevation-raised); }
    ucam-card .ucam-card--elevado { box-shadow: var(--ucam-elevation-sticky); }

    ucam-card .ucam-card__titulo {
      display: block;
      margin: 0;
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      line-height: var(--ucam-typography-label-line-height);
      color: var(--ucam-color-text-primary);
    }
    ucam-card .ucam-card__cabecalho {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      margin-block-end: var(--ucam-space-stack-md);
    }
    ucam-card .ucam-card__cabecalho > .ucam-icon-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      inline-size: var(--ucam-size-control-lg);
      block-size: var(--ucam-size-control-lg);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-sunken);
      color: var(--ucam-color-text-secondary);
    }
    ucam-card .ucam-card__cabecalho-texto {
      flex: 1 1 auto;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
    }
    ucam-card .ucam-card__cabecalho-texto > .ucam-card__titulo,
    ucam-card .ucam-card__cabecalho-texto > .ucam-card__apoio {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ucam-card .ucam-card__cabecalho > :last-child:not(.ucam-card__cabecalho-texto) {
      flex: none;
      margin-inline-start: auto;
    }
    ucam-card .ucam-card__apoio {
      display: block;
      margin: 0;
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }

    ucam-card .ucam-card--acionavel {
      position: relative;
      transition:
        border-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
        box-shadow var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    ucam-card .ucam-card__link {
      color: inherit;
      text-decoration: none;
    }
    ucam-card .ucam-card__link::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--ucam-radius-surface);
    }
    ucam-card .ucam-card--acionavel:has(.ucam-card__link:hover) {
      border-color: var(--ucam-color-border-default);
      box-shadow: var(--ucam-elevation-sticky);
    }
    /* O anel fica em volta da SUPERFÍCIE, não em volta do texto do título —
       é o cartão que se navega, não a palavra. */
    ucam-card .ucam-card--acionavel:has(.ucam-card__link:focus-visible) {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    ucam-card .ucam-card--acionavel .ucam-card__link:focus-visible { outline: none; }

    /* A ação sobe uma camada: sem isto o ::after do link esticado cobre o botão
       e o clique nunca chega nele. */
    ucam-card [ucamCardAcao] {
      position: relative;
      z-index: 1;
    }

    ucam-card .ucam-card__rodape,
    ucam-card [ucamCardRodape] {
      margin: 0;
      padding-block-start: var(--ucam-space-inset-md);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      font-size: var(--ucam-typography-body-sm-font-size);
      color: var(--ucam-color-text-secondary);
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      ucam-card .ucam-card--acionavel { transition: none; }
    }
  `,
})
export class UcamCard {
  /** Nome do que o cartão representa, na escala de rótulo. Sem margem própria. */
  readonly titulo = input<string | null>(null);
  /** Uma linha dizendo o que cai neste cartão. Não é rótulo de formulário. */
  readonly apoio = input<string | null>(null);
  /** Ícone do ladrilho no cabeçalho. Com titulo, monta a parte cabecalho. */
  readonly icone = input<UcamIconName | null>(null);
  readonly elevation = input<UcamCardElevation>('flat');
  readonly padding = input<UcamCardPadding>('lg');
  /**
   * O nome público é "as", como manda o contrato — mas a propriedade interna
   * tem outro nome. "as" é palavra reservada da linguagem de template do
   * Angular: em @switch (as()) o parser lê o operador de aliasing, não a
   * chamada, e a compilação falha com "Unexpected token as".
   */
  readonly elemento = input<UcamCardAs>('div', { alias: 'as' });
  /**
   * O cartão leva a um destino sem ser ele próprio a âncora. É o que permite
   * destino E controle na mesma superfície: quem vira link é o título.
   */
  readonly acionavel = input(false);
  readonly href = input<string | null>(null);

  protected readonly idTitulo = `ucam-card-t-${++seq}`;

  /**
   * `section` sem nome acessível é marco anônimo — atrapalha mais que ajuda,
   * porque enche a lista de regiões do leitor de tela com entradas sem rótulo.
   * O próprio título, ligado por aria-labelledby, resolve quando há título.
   */
  protected readonly rotuladoPor = computed(() =>
    (this.elemento() === 'section' || this.elemento() === 'article') && this.titulo() ? this.idTitulo : null,
  );

  protected readonly classes = computed(() => {
    const partes = ['ucam-card', PADDING[this.padding()]];
    if (this.elevation() === 'raised') partes.push('ucam-card--raised');
    if (this.elevation() === 'sticky') partes.push('ucam-card--elevado');
    if (this.acionavel()) partes.push('ucam-card--acionavel');
    return partes.join(' ');
  });

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Cartão-âncora com controle dentro é alvo aninhado: o teclado para em
        // dois lugares para uma coisa só e o leitor de tela lê a superfície
        // inteira como nome do link. Quem tem controle usa `acionavel`.
        if (this.elemento() === 'a' && this.acionavel()) {
          throw new Error(
            '[ucam-card] as="a" e acionavel não convivem: ou o cartão INTEIRO é a âncora, ou o título é o link que estica. Ver spec/components/card.json.',
          );
        }
        if (this.acionavel() && !this.href()) {
          throw new Error(
            '[ucam-card] acionavel sem href não leva a lugar nenhum — só ganha realce e anel de foco. Declare href ou tire acionavel.',
          );
        }
        if (this.elemento() === 'a' && !this.href()) {
          throw new Error('[ucam-card] as="a" exige href.');
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
