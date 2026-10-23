import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';

/**
 * Caixa de seleção e o grupo que a nomeia. Contrato:
 * sites/spec/components/checkbox.json.
 *
 *   <fieldset ucamSiteCheckGroup legend="Modalidade">
 *     <label ucamSiteCheck label="Presencial"><input ucamSiteCheckBox [(ngModel)]="presencial"></label>
 *   </fieldset>
 *
 * A caixa é do consumidor: checked, disabled, name e value são nativos, e é
 * nela que se liga ngModel ou formControl. O label envolve a caixa, então o
 * texto marca e é o nome acessível; a peça não gera id nem for.
 */
@Component({
  selector: 'fieldset[ucamSiteCheckGroup]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-checkbox-group' },
  template: `@if (legenda(); as texto) {<legend class="ucam-site-checkbox-group__legend">{{ texto }}</legend>}<ng-content />`,
})
export class UcamSiteCheckGroup {
  readonly legend = input<string | null | undefined>('');
  protected readonly legenda = computed(() => this.legend()?.trim() || null);
}

@Component({
  selector: 'label[ucamSiteCheck]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-checkbox' },
  template: `<ng-content /><span class="ucam-site-checkbox__label">{{ texto() }}</span>`,
})
export class UcamSiteCheck {
  readonly label = input<string | null | undefined>('');
  protected readonly texto = computed(() => this.label()?.trim() ?? '');
}

/** A caixa: `<input ucamSiteCheckBox>`. Põe o tipo e a classe; o resto é nativo. */
@Directive({
  selector: 'input[ucamSiteCheckBox]',
  host: { class: 'ucam-site-checkbox__box', type: 'checkbox' },
})
export class UcamSiteCheckBox {}
