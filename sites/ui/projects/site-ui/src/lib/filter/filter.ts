import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';

export interface UcamSiteFilterItem {
  label: string;
  value: string;
}

/**
 * Filtro em pílulas: recorta uma lista da página. Contrato:
 * sites/spec/components/filter.json.
 *
 *   <div ucamSiteFilter ariaLabel="Área de conhecimento" [(value)]="area"
 *        [items]="[{ label: 'Todas', value: '' }, { label: 'Saúde', value: 'saude' }]"></div>
 *
 * Uma escolha por vez, dita por aria-pressed. A peça não recorta nada: emite
 * o value escolhido, e quem monta a página recorta a lista e anuncia quantos
 * ficaram.
 */
@Component({
  selector: 'div[ucamSiteFilter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-filter', role: 'group', '[attr.aria-label]': 'rotulo()' },
  template: `@for (o of opcoes(); track o.value) {<button type="button" class="ucam-site-filter__opcao" [attr.aria-pressed]="o.value === escolhido() ? 'true' : 'false'" (click)="escolhe(o.value)">{{ o.label }}</button>}`,
})
export class UcamSiteFilter {
  readonly items = input<UcamSiteFilterItem[], UcamSiteFilterItem[] | null | undefined>([], { transform: (v) => (Array.isArray(v) ? v : []) });
  readonly value = input<string | null | undefined>('');
  readonly ariaLabel = input<string | null | undefined>('Filtro');
  readonly valueChange = output<string>();

  /** Opção sem rótulo não entra; value repetido fica só na primeira. */
  protected readonly opcoes = computed(() => {
    const vistos = new Set<string>();
    return this.items()
      .map((o) => ({ label: typeof o?.label === 'string' ? o.label.trim() : '', value: typeof o?.value === 'string' ? o.value : '' }))
      .filter((o) => o.label && !vistos.has(o.value) && vistos.add(o.value));
  });
  /** Sem opção que case com value, vale a primeira: nunca fica nenhuma escolhida. */
  protected readonly escolhido = computed(() => {
    const v = this.value() ?? '';
    const lista = this.opcoes();
    return lista.some((o) => o.value === v) ? v : (lista[0]?.value ?? '');
  });
  protected readonly rotulo = computed(() => this.ariaLabel()?.trim() || 'Filtro');

  protected escolhe(v: string): void {
    if (v !== this.escolhido()) this.valueChange.emit(v);
  }
}
