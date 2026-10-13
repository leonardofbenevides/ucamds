import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

export interface UcamSiteStat {
  value: string | number;
  label: string;
}

/**
 * Faixa de números. Contrato: sites/spec/components/stats-band.json.
 *
 * Uma lista de definição: no documento o rótulo vem antes do valor (é assim
 * que o leitor de tela os anuncia juntos); é a folha que põe o número em cima.
 * Item sem valor ou sem rótulo não entra.
 */
@Component({
  selector: 'dl[ucamSiteStats]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@for (n of numeros(); track $index) {<div class="ucam-site-stats__item"><dt class="ucam-site-stats__label">{{ n.label }}</dt><dd class="ucam-site-stats__value">{{ n.value }}</dd></div>}`,
})
export class UcamSiteStats {
  readonly items = input.required<UcamSiteStat[], UcamSiteStat[] | null | undefined>({ transform: (v) => (Array.isArray(v) ? v : []) });
  readonly inverse = input(false, { transform: booleanAttribute });

  /** Valor e rótulo viram texto aqui: rótulo numérico ou item solto, vindos de um CMS, não derrubam a página. */
  protected readonly numeros = computed(() =>
    this.items()
      .map((n) => ({ value: String(n?.value ?? '').trim(), label: String(n?.label ?? '').trim() }))
      .filter((n) => n.value && n.label),
  );
  protected readonly classes = computed(() => classesDe('ucam-site-stats', this.inverse() && 'inverse'));
}
