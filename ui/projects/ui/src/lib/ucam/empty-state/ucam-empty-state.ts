import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/empty-state.json
 *
 * Não tem equivalente na base — é implementação nossa, porque o problema é
 * nosso: o parque tem duas redações para o mesmo estado (Sem registros e
 * Nenhum registro encontrado) e nenhuma delas oferece saída.
 *
 * A regra que o componente carrega: todo estado vazio tem uma ação.
 */
export type UcamEmptyReason = 'no-data' | 'no-results' | 'no-access' | 'error';

const ICONE: Record<UcamEmptyReason, UcamIconName> = {
  'no-data': 'inbox',
  'no-results': 'search',
  'no-access': 'lock',
  error: 'circleAlert',
};

@Component({
  selector: 'ucam-empty-state',
  exportAs: 'ucamEmptyState',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    // Vazio que resulta de uma ação do usuário é anunciado; o estado inicial
    // da página não, porque já é lido na navegação normal.
    '[attr.role]': "reason() === 'no-results' ? 'status' : null",
  },
  template: `
    <ucam-icon [name]="icone()" size="lg" class="text-muted-foreground" />
    <p class="font-semibold text-base m-0">{{ title() }}</p>
    @if (description()) {
      <p class="text-sm text-muted-foreground m-0 max-w-[48ch]">{{ description() }}</p>
    }
    <div class="mt-1"><ng-content /></div>
  `,
})
export class UcamEmptyState {
  readonly reason = input.required<UcamEmptyReason>();
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('md');
  /** Contexto do vazio quando ele é parcial: o nome da aba ou do filtro. */
  readonly scope = input<string | null>(null);

  protected readonly icone = computed(() => ICONE[this.reason()]);
  protected readonly classes = computed(() =>
    `flex flex-col items-center text-center gap-2 ${this.size() === 'sm' ? 'py-6' : 'py-10'}`,
  );
}
