import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { ZardInputGroupImports } from '@/shared/components/input-group/input-group.imports';
import { UcamIcon } from '../icon/ucam-icon';
import type { UcamIconName } from '../icon/ucam-icons.generated';

/**
 * Contrato: spec/components/input-group.json
 *
 * Envelope sobre o z-input-group, que já resolve a geometria do conjunto —
 * cantos internos, divisórias e as variantes de addon.
 *
 * O que o wrapper acrescenta, e cada um vem de um defeito medido no parque:
 *
 *  - o CONTROLE esticado à altura do grupo. Medido na busca da testeira, o
 *    <input> tinha 20px dentro de um invólucro de 32: seis pixels em cima e
 *    seis embaixo onde o clique não focava nada. É exatamente o defeito que um
 *    componente de grupo existe para tornar impossível;
 *  - o ADORNO sempre aria-hidden. Prefixo e unidade são para o olho; quem lê
 *    por voz recebe a unidade pela descrição do campo, não como um pedaço
 *    solto de texto entre o rótulo e o valor;
 *  - a BORDA no grupo e não no controle. Dois contornos aninhados é o defeito
 *    visual mais comum desta peça.
 */
export type UcamInputGroupSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ucam-input-group',
  exportAs: 'ucamInputGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardInputGroupImports, UcamIcon],
  host: {
    class: 'ucam-input-group block',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-invalid]': 'invalid() ? "" : null',
  },
  template: `
    <div
      z-input-group
      [class]="classes()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
    >
      @if (icon(); as ic) {
        <!-- Decorativo: se o ícone é a única coisa que explica o campo, o que
             falta é rótulo, não ícone. -->
        <span z-input-group-addon zAlign="inline-start" aria-hidden="true">
          <ucam-icon [name]="ic" size="sm" />
        </span>
      }
      @if (prefix(); as p) {
        <span z-input-group-addon zAlign="inline-start" aria-hidden="true">
          <span class="ucam-input-group__adorno text-sm text-[var(--ucam-color-text-secondary)]">{{ p }}</span>
        </span>
      }

      <!-- O controle e a ação entram por projeção: o grupo não sabe qual é o
           campo, e não deve saber — ele resolve a moldura. -->
      <ng-content />

      @if (suffix(); as s) {
        <span z-input-group-addon zAlign="inline-end" aria-hidden="true">
          <span class="ucam-input-group__adorno text-sm text-[var(--ucam-color-text-secondary)]">{{ s }}</span>
        </span>
      }
      <ng-content select="[acao]" />
    </div>
  `,
  styles: `
    /* A BORDA É DO GRUPO. O controle projetado entra sem contorno e sem fundo
     * próprios, senão aparecem duas caixas aninhadas — e ocupa a altura
     * INTEIRA, que é o que fecha a faixa morta onde o clique não focava. */
    .ucam-input-group :is(input, select, textarea) {
      border: 0;
      background: none;
      box-shadow: none;
      align-self: stretch;
      block-size: 100%;
      min-inline-size: 0;
      flex: 1;
    }
    .ucam-input-group :is(input, select, textarea):focus-visible {
      outline: none;
    }
  `,
})
export class UcamInputGroup {
  readonly prefix = input<string | null>(null);
  readonly suffix = input<string | null>(null);
  readonly icon = input<UcamIconName | null>(null);
  readonly size = input<UcamInputGroupSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  /**
   * O anel de foco é :focus-within, e não :focus, porque quem RECEBE o foco é
   * o campo de dentro enquanto quem DESENHA o anel é o grupo. É a mesma razão
   * pela qual o inválido pinta o grupo inteiro: metade do controle sem sinal
   * seria metade do controle sem estado.
   */
  protected readonly classes = computed(() => {
    const altura = { sm: 'h-7', md: 'h-8', lg: 'h-10' }[this.size()];
    const base =
      'flex items-center gap-2 px-2 rounded-[var(--ucam-radius-control)] ' +
      'border bg-[var(--ucam-color-surface-default)] ' +
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ' +
      'focus-within:outline-[var(--ucam-color-border-focus)]';
    const borda = this.invalid()
      ? 'border-[var(--ucam-color-action-danger-default)]'
      : 'border-[var(--ucam-color-border-default)]';
    const apagado = this.disabled() ? 'opacity-60 pointer-events-none' : '';
    return [base, altura, borda, apagado].filter(Boolean).join(' ');
  });
}
