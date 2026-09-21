import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';

import { UCAM_ICONS, UCAM_ICON_KEY, type UcamIconName } from './ucam-icons.generated';

/**
 * Ícone do design system. Base: Lucide, via @ng-icons/lucide — a mesma que a
 * ZardUI já usa, então não há segunda dependência de ícones.
 *
 * O conjunto é curado em spec/icons.json e o tipo UcamIconName recusa
 * qualquer nome fora dele em tempo de compilação. É a correção do parque
 * atual, onde ícones aparecem quebrados em produção e o mesmo capelo
 * identifica três módulos diferentes.
 *
 * O ícone é SEMPRE decorativo: aria-hidden fixo, sem exceção. Quem nomeia é
 * o texto ao lado ou o ariaLabel do controle que o contém (WCAG 1.4.1).
 */
export type UcamIconSize = 'xs' | 'sm' | 'md' | 'lg';

/* A ESCALA SAI DOS MESMOS TOKENS DO TRILHO A, e por --ng-icon__size, não
 * por classe de largura.
 *
 * Era w-4/h-4 e irmãs, e NENHUMA delas pegava. O <ng-icon> da base traz
 * ":host{width:var(--ng-icon__size, 1em);height:...}" em folha SEM camada,
 * e estilo sem camada ganha de qualquer @layer — as utilitárias do Tailwind
 * moram em @layer utilities. O resultado é que todo ícone do Trilho B saía
 * em 1em do CONTEXTO: 16px onde a raiz é 16, 14px dentro de um texto de 14.
 * O sm parecia certo por coincidência (1em = 16px), o md nunca chegou aos
 * 20 que o contrato promete, e a medição de 20/09/2026 pegou o mesmo ícone
 * com 16 e 14 na mesma página.
 *
 * O input size do <ng-icon> escreve --ng-icon__size no host, que é o valor
 * que a folha da base lê — e aceita qualquer comprimento CSS, então entra o
 * token, não o pixel. É o que fecha a escala entre os dois trilhos: a mesma
 * variável decide o degrau nos dois lugares. */
const SIZE: Record<UcamIconSize, string> = {
  xs: 'var(--ucam-size-icon-xs)',
  sm: 'var(--ucam-size-icon-sm)',
  md: 'var(--ucam-size-icon-md)',
  lg: 'var(--ucam-size-icon-lg)',
};

@Component({
  selector: 'ucam-icon',
  exportAs: 'ucamIcon',
  imports: [NgIcon],
  viewProviders: [provideIcons(UCAM_ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    class: 'inline-flex shrink-0',
  },
  template: `<ng-icon [name]="key()" [size]="sizeValor()" />`,
})
export class UcamIcon {
  readonly name = input.required<UcamIconName>();
  readonly size = input<UcamIconSize>('md');

  protected readonly key = computed(() => UCAM_ICON_KEY[this.name()]);
  protected readonly sizeValor = computed(() => SIZE[this.size()]);
}

export { type UcamIconName } from './ucam-icons.generated';
