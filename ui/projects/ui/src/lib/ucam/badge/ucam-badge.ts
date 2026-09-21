import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/badge.json
 *
 * A base tem quatro tipos visuais (default, secondary, destructive, outline)
 * e nenhum tom semântico. Aqui os cinco tons do fluxo de requerimento são
 * mapeados para os tokens de feedback, verificados em 4.5:1 no portão de build.
 *
 * O rótulo textual é OBRIGATÓRIO: cor nunca é o único portador de significado
 * (WCAG 1.4.1). É a regra que protege quem tem daltonismo e a que o SIGFIN
 * viola ao colorir valores em azul, vermelho e verde sem legenda (ADR-008).
 */
export type UcamBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/**
 * soft e dot vestem o PREENCHIMENTO pastel (ADR-020); a diferença entre os
 * dois é só o indicador — ícone no soft, ponto no dot. outline é a pílula
 * branca com filete, preservada para coluna longa.
 */
export type UcamBadgeVariant = 'soft' | 'dot' | 'outline';

/**
 * PREENCHIMENTO pastel com o rótulo na tinta do próprio tom — espelha o
 * `.ucam-badge` do Trilho A, que inverteu o padrão em 09/09/2026 (ADR-020).
 *
 * O par 100/700 é o único do selo que o portão de build mede: 4.5:1 em
 * tools/build-tokens.mjs, nos dois temas. O contorno anterior apoiava o
 * rótulo em text-primary nos cinco tons — legítimo, mas idêntico entre eles.
 *
 * neutral fica de fora: o degrau 100 do neutro é o #FAFAFA, que sobre o
 * branco do painel dá 1,02:1. Ele se resolve pelo filete, como sempre.
 *
 * Se este bloco divergir do .ucam-badge, o catálogo mostra dois desenhos do
 * mesmo componente lado a lado — que é exatamente o que a página promete que
 * não acontece.
 */
const TONE_CLASSES: Record<UcamBadgeTone, string> = {
  neutral: 'bg-card text-muted-foreground border-[var(--ucam-color-border-default)]',
  info: 'border-transparent bg-[var(--ucam-color-feedback-info-background)] text-[var(--ucam-color-feedback-info-foreground)]',
  success: 'border-transparent bg-[var(--ucam-color-feedback-success-background)] text-[var(--ucam-color-feedback-success-foreground)]',
  warning: 'border-transparent bg-[var(--ucam-color-feedback-warning-background)] text-[var(--ucam-color-feedback-warning-foreground)]',
  danger: 'border-transparent bg-[var(--ucam-color-feedback-danger-background)] text-[var(--ucam-color-feedback-danger-foreground)]',
};

/**
 * A pílula branca com filete, PRESERVADA sob a variante outline. É o desenho
 * de 03/09/2026 inteiro, e o argumento que o criou segue valendo onde ele
 * nasceu: numa coluna de 14 linhas, catorze retângulos tintos viram uma faixa
 * de cor que compete com o dado ao lado. Ali a cor fica concentrada no ÍCONE.
 */
const OUTLINE_CLASSES: Record<UcamBadgeTone, string> = {
  neutral: 'bg-card text-foreground border-[var(--ucam-color-border-subtle)]',
  info: 'bg-card text-foreground border-[color-mix(in_srgb,var(--ucam-color-feedback-info-border)_30%,transparent)]',
  success: 'bg-card text-foreground border-[color-mix(in_srgb,var(--ucam-color-feedback-success-border)_30%,transparent)]',
  warning: 'bg-card text-foreground border-[color-mix(in_srgb,var(--ucam-color-feedback-warning-border)_30%,transparent)]',
  danger: 'bg-card text-foreground border-[color-mix(in_srgb,var(--ucam-color-feedback-danger-border)_30%,transparent)]',
};

/**
 * Ícone padrão de cada tom. Existe para o significado não depender só da cor:
 * quem não distingue verde de vermelho lê o símbolo (WCAG 1.4.1), e o olho
 * treinado identifica o estado antes de ler o rótulo. `icon` sobrescreve.
 *
 * neutral fica sem ícone de propósito: "aguardando" não é evento, e um símbolo
 * ali competiria com os estados que realmente pedem atenção.
 */
const TONE_ICON: Record<UcamBadgeTone, UcamIconName | null> = {
  neutral: null,
  info: 'info',
  success: 'circleCheck',
  warning: 'triangleAlert',
  danger: 'circleAlert',
};

/** O ícone usa o degrau saturado da matiz; o texto segue no foreground. */
const ICON_CLASSES: Record<UcamBadgeTone, string> = {
  neutral: 'text-muted-foreground',
  info: 'text-[var(--ucam-color-feedback-info-border)]',
  success: 'text-[var(--ucam-color-feedback-success-border)]',
  warning: 'text-[var(--ucam-color-feedback-warning-border)]',
  danger: 'text-[var(--ucam-color-feedback-danger-border)]',
};

/**
 * O ponto herda a tinta do RÓTULO, e não o degrau saturado do ícone.
 *
 * Ícone é forma e se lê com pouco contraste; um disco de 6px é contraste
 * puro. Medido no navegador, o degrau saturado dava 2,98 contra o próprio
 * preenchimento no tema escuro. Em currentColor o ponto viaja no par que o
 * portão de build já mede: 8,24 no claro, 12,22 no escuro.
 *
 * Espelha .ucam-badge__ponto do Trilho A.
 */
const DOT_CLASS = 'bg-current';

@Component({
  selector: 'ucam-badge',
  exportAs: 'ucamBadge',
  imports: [ZardBadgeComponent, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /**
   * inline-flex no hospedeiro. Inline puro, ele montava uma caixa de linha em
   * volta da pastilha com a entrelinha de quem o contém: dentro da linha de
   * lista do site a pastilha media 26,4px, contra os 22 do .ucam-badge do
   * Trilho A (13/09/2026). Como flex, a altura é a da pastilha e só.
   */
  host: { class: 'inline-flex' },
  template: `
    <!-- ELEMENTO, não atributo. O seletor da base é 'z-badge, a[z-badge]':
         <span z-badge> não casa com nenhum dos dois, então o componente nunca
         era instanciado e a badge saía sem preenchimento, sem raio e sem
         display — texto com fundo colado. Passou despercebido enquanto só o
         preview do Trilho A aparecia no site. -->
    <z-badge zType="outline" [class]="classes()">
      @if (variant() === 'dot') {
        <span class="inline-block w-1.5 h-1.5 rounded-full shrink-0" [class]="dotClass" aria-hidden="true"></span>
      } @else if (iconeEfetivo(); as ic) {
        <!-- 12, o degrau da pastilha: a caixa tem 22px de altura e o rótulo
             12, e com 16 o símbolo saía mais alto que as letras. É o que a
             folha do Trilho A faz em ".ucam-badge .ic" desde 11/09/2026. -->
        <ucam-icon [name]="ic" size="xs" [class]="iconClass()" />
      }
      <!-- Rótulo por INPUT ou por PROJEÇÃO. O input cobre o caso comum e
           mantém o badge chamável de um @for sem markup extra; a projeção
           existe para quem precisa de elemento dentro da pastilha — o
           <ucam-prazo> passa um <time datetime>, que uma string não carrega.
           Um ou outro, nunca os dois: com label preenchido o ng-content nem
           chega a ser instanciado. -->
      @if (label().trim(); as l) {
        {{ l }}
      } @else {
        <ng-content />
      }
    </z-badge>
  `,
})
export class UcamBadge {
  readonly tone = input<UcamBadgeTone>('neutral');
  /**
   * O texto do estado. Opcional no TIPO, obrigatório no CONTRATO: quem não
   * passa label tem de projetar conteúdo, e a checagem do construtor cobra
   * isso em desenvolvimento. Cor sozinha não comunica estado (WCAG 1.4.1).
   */
  readonly label = input('');
  readonly variant = input<UcamBadgeVariant>('soft');
  readonly icon = input<UcamIconName | null>(null);

  protected readonly classes = computed(() => {
    const tinta = this.variant() === 'outline' ? OUTLINE_CLASSES : TONE_CLASSES;
    return `${tinta[this.tone()]} gap-1 font-medium`;
  });
  protected readonly dotClass = DOT_CLASS;
  protected readonly iconClass = computed(() => ICON_CLASSES[this.tone()]);

  /** O explícito manda; sem ele, o padrão do tom. */
  protected readonly iconeEfetivo = computed(() => this.icon() ?? TONE_ICON[this.tone()]);

  private readonly hospedeiro = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Vale o texto RENDERIZADO, e não só o input: com conteúdo projetado o
        // label fica vazio de propósito, e cobrar o input ali quebraria o
        // <ucam-prazo>. O que a regra protege é a pastilha sair sem palavra
        // nenhuma — e isso o textContent responde nos dois casos.
        const texto = this.hospedeiro.nativeElement.textContent?.trim() ?? '';
        if (!texto) {
          throw new Error(
            '[ucam-badge] a pastilha saiu sem texto. Passe label ou projete conteúdo: cor sozinha não comunica estado (WCAG 1.4.1). Ver spec/components/badge.json.',
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
