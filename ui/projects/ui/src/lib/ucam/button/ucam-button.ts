import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  Renderer2,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { UcamIcon, type UcamIconName } from '../icon';

import { ZardButtonComponent } from '../../shared/components/button/button.component';
import type { ZardButtonSizeVariants, ZardButtonTypeVariants } from '../../shared/components/button/button.variants';

/**
 * Contrato: spec/components/button.json
 *
 * Envolve o ZardButtonComponent. Aplicações NUNCA importam z-button
 * diretamente (ADR-006) — é o que permite trocar ou abandonar a base sem
 * tocar em nenhuma tela.
 *
 * O wrapper não é repasse: ele corrige quatro coisas que a base não faz.
 */
export type UcamButtonVariant = 'primary' | 'secondary' | 'ghost';
export type UcamButtonTone = 'neutral' | 'danger';
export type UcamButtonSize = 'sm' | 'md' | 'lg';

/** primary → default: a base já resolve bg-primary, que a ponte aponta para o bordô. */
const VARIANT_MAP: Record<UcamButtonVariant, ZardButtonTypeVariants> = {
  primary: 'default',
  // O "secondary" da ZardUI é preenchimento acinzentado; o nosso contrato pede
  // fundo de superfície com borda visível (3:1, WCAG 1.4.11) — que é o "outline".
  secondary: 'outline',
  ghost: 'ghost',
};

/**
 * O TOM PINTA A VARIANTE — ADR-015.
 *
 * `danger` deixou de ser um quarto valor de variant e virou eixo próprio, e é
 * por isso que ele não entra no VARIANT_MAP: o zType continua saindo só do
 * peso, e o tom vem por cima como classe.
 *
 * O `destructive` da base não serve para nenhum dos três casos. Ele é um só
 * desenho — fundo a 10% com texto colorido — enquanto o contrato pede três
 * pesos diferentes do mesmo vermelho. Por coincidência o desenho dele é
 * parecido com o nosso ghost+danger, mas depender disso amarraria o contrato
 * à escolha estética da matéria-prima, que a ADR-006 diz para não fazer.
 *
 * As cores vêm de var(--ucam-*) direto, e não das utilitárias `destructive`
 * da ponte, por um motivo verificável: o hover do secondary e do ghost usa
 * action.danger.subtle, um token com valor PRÓPRIO por tema (red.100 no
 * claro, red.900 no escuro). Escrever `bg-destructive/10` produziria um
 * vermelho translúcido parecido no claro e diferente no escuro — e o par
 * texto/fundo deixaria de ser o mesmo que o portão de contraste mediu.
 */
const TONE_CLASSES: Record<UcamButtonVariant, string> = {
  primary: [
    'border-transparent',
    'bg-[var(--ucam-color-action-danger-default)]',
    'text-[var(--ucam-color-text-on-action)]',
    'hover:bg-[var(--ucam-color-action-danger-hover)]',
    'active:bg-[var(--ucam-color-action-danger-active)]',
  ].join(' '),
  // hover:text- é obrigatório: o `outline` da base traz hover:text-foreground,
  // e sem redeclarar o texto voltaria ao cinza no hover — vermelho que some ao
  // passar o ponteiro é pior do que vermelho nenhum.
  secondary: [
    'border-[var(--ucam-color-action-danger-default)]',
    'text-[var(--ucam-color-action-danger-default)]',
    'hover:bg-[var(--ucam-color-action-danger-subtle)]',
    'hover:text-[var(--ucam-color-action-danger-default)]',
    'active:border-[var(--ucam-color-action-danger-active)]',
  ].join(' '),
  ghost: [
    'text-[var(--ucam-color-action-danger-default)]',
    'hover:bg-[var(--ucam-color-action-danger-subtle)]',
    'hover:text-[var(--ucam-color-action-danger-default)]',
  ].join(' '),
};

const SIZE_MAP: Record<UcamButtonSize, ZardButtonSizeVariants> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

const ICON_SIZE_MAP: Record<UcamButtonSize, ZardButtonSizeVariants> = {
  sm: 'icon-sm',
  md: 'icon',
  lg: 'icon-lg',
};

@Component({
  selector: 'ucam-button',
  exportAs: 'ucamButton',
  imports: [ZardButtonComponent, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      #botao
      z-button
      [zType]="zType()"
      [zSize]="zSize()"
      [class]="extraClasses()"
      [attr.data-ucam-variant]="variant()"
      [attr.data-tone]="tone() === 'neutral' ? null : tone()"
      [attr.type]="type()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <ucam-icon name="loaderCircle" size="sm" class="motion-safe:animate-spin" />
      } @else if (iconStart()) {
        <ucam-icon [name]="iconStart()!" size="sm" data-icon="inline-start" />
      }
      <ng-content />
      @if (iconEnd() && !loading()) {
        <ucam-icon [name]="iconEnd()!" size="sm" data-icon="inline-end" />
      }
    </button>
  `,
  styles: `
    /* DESABILITADO — ADR-042, o mesmo bloco de .ucam-btn:disabled em
       tools/build-css.mjs. A base diz desabilitado com opacity-50, que a
       decisão proíbe: o contraste cai sem ninguém escrever um número. Aqui
       são os dois sinais do modelo de estados — o chão único de
       action.disabled.background e a perda da aresta — em cor explícita.
       Vale também para aria-disabled (carregando), como no Trilho A.
       O seletor tem elemento, atributo e :is(pseudo, atributo): (0,2,2),
       que vence a utilitária disabled:opacity-50 (0,2,0) e os hover das
       variantes sem !important. */
    ucam-button button[data-ucam-variant]:is(:disabled, [aria-disabled='true']) {
      opacity: 1;
      background: var(--ucam-color-action-disabled-background);
      color: var(--ucam-color-action-disabled-text);
      border-color: transparent;
      cursor: not-allowed;
    }
    /* Fantasma indisponível continua sem fundo: o cinza de disabled num
       botão que em repouso não tem superfície vira um quadrado cinza por
       linha. Sem chão próprio, a tinta cai sobre o card — text.disabled. */
    ucam-button button[data-ucam-variant='ghost']:is(:disabled, [aria-disabled='true']) {
      background: transparent;
      color: var(--ucam-color-text-disabled);
    }
  `,
})
export class UcamButton {
  readonly variant = input<UcamButtonVariant>('secondary');
  /** Natureza da ação, eixo separado do peso. ADR-015. */
  readonly tone = input<UcamButtonTone>('neutral');
  readonly size = input<UcamButtonSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /**
   * CORREÇÃO 4 — antes eram `string`, e o componente registrava só quatro
   * ícones à mão. Um nome fora desses quatro passava pelo compilador e
   * renderizava VAZIO em produção: exatamente a falha do parque atual, onde
   * ícones aparecem quebrados na tela. Agora o tipo é o conjunto curado de
   * spec/icons.json e quem desenha é o <ucam-icon>, que tem os 49.
   */
  readonly iconStart = input<UcamIconName | null>(null);
  readonly iconEnd = input<UcamIconName | null>(null);
  readonly ariaLabel = input<string | null>(null);

  /**
   * CORREÇÃO 1 — o default do HTML para <button> é "submit", o que provoca
   * envio acidental de formulário. A base não define type; aqui é explícito.
   */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /*
   * NÃO existe output `click`, e a ausência é a correção — a mesma do
   * icon-button, pelo mesmo motivo. O clique do <button> interno emitia o
   * output E continuava borbulhando até o host <ucam-button>, onde o (click)
   * do consumidor também escuta: um clique, duas execuções.
   *
   * Aqui o risco tinha nome. O botão primário do sistema é o que submete
   * formulário, e handler não idempotente ligado a ele salvava duas vezes.
   * Não apareceu porque as demos chamam `salvar()`, que já se protege com o
   * próprio `loading`.
   */

  protected readonly zType = computed(() => VARIANT_MAP[this.variant()]);

  protected readonly zSize = computed(() =>
    this.iconOnly() ? ICON_SIZE_MAP[this.size()] : SIZE_MAP[this.size()],
  );

  /**
   * CORREÇÃO 2 — o "destructive" da ZardUI é um desenho só, e o contrato pede
   * três. Ver TONE_CLASSES. Sem tom, nada é acrescentado: o botão neutro
   * continua sendo exatamente o que a base desenha.
   */
  protected readonly extraClasses = computed(() =>
    this.tone() === 'danger' ? TONE_CLASSES[this.variant()] : '',
  );

  // `read: ElementRef` é obrigatório: o <button z-button> é um componente da
  // base, e sem o read a consulta devolve a instância dele, não o elemento.
  private readonly botao = viewChild.required('botao', { read: ElementRef<HTMLButtonElement> });
  private readonly renderer = inject(Renderer2);

  constructor() {
    /**
     * CORREÇÃO 5 — a base declara `[attr.disabled]` e `[attr.aria-disabled]`
     * em host binding a partir do próprio zDisabled, que o wrapper não usa
     * (ele traz opacity-50, que a ADR-042 proíbe). No primeiro render o host
     * binding corre DEPOIS do template e zera o que ele escreveu: um
     * <ucam-button [disabled]="true"> nascia sem `disabled`, e um em loading
     * nascia sem `aria-disabled`. Os dois atributos passam a ser aplicados
     * depois do render, onde ninguém mais os toca.
     */
    afterRenderEffect(() => {
      const el = this.botao().nativeElement;
      aplicarEstado(this.renderer, el, 'disabled', this.disabled() ? '' : null);
      aplicarEstado(this.renderer, el, 'aria-disabled', this.loading() ? 'true' : null);
    });

    /**
     * CORREÇÃO 3 — botão só de ícone sem nome acessível é a falha mais
     * repetida do parque atual: o × dos diálogos e os quatro controles de
     * paginação de cada tabela. Aqui é erro em desenvolvimento, não aviso.
     */
    if (ngDevMode) {
      // afterNextRender, não queueMicrotask: nos testes o microtask corria antes de
      // o primeiro ciclo ligar os inputs e lia um `label` ainda sem valor (NG0950).
      afterNextRender(() => {
        if (this.iconOnly() && !this.ariaLabel()) {
          throw new Error(
            '[ucam-button] iconOnly exige ariaLabel. Um botão só com ícone é anônimo para leitor de tela. Ver spec/components/button.json.',
          );
        }
      });
    }
  }

  /**
   * CORREÇÃO 4 — em loading a base apenas reduz a opacidade. O contrato manda
   * usar aria-busy + aria-disabled e NÃO o atributo disabled, que tiraria o
   * botão da ordem de foco e faria o leitor de tela perder o contexto. Como
   * o elemento continua focável, o clique precisa ser barrado aqui.
   */
  protected onClick(event: MouseEvent): void {
    if (this.loading() || this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
}

/** Escreve ou remove um atributo de estado fora do ciclo de bindings. Também usado pelo icon-button. */
export function aplicarEstado(renderer: Renderer2, el: HTMLElement, atributo: string, valor: string | null): void {
  if (valor === null) renderer.removeAttribute(el, atributo);
  else renderer.setAttribute(el, atributo, valor);
}

declare const ngDevMode: boolean;
