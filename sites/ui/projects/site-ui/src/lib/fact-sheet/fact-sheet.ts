import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

export interface UcamSiteFact {
  term: string;
  value: string | number;
}

export type UcamSiteFactSheetColumns = 1 | 2;

/**
 * Ficha: chave e valor. Contrato: sites/spec/components/fact-sheet.json.
 *
 *   <dl ucamSiteFactSheet [items]="[{ term: 'Duração', value: '24 meses' }]"></dl>
 *
 * Uma lista de definição: cada linha é um div com o dt e o dd. Linha sem
 * chave ou sem valor não entra, e a lista vazia fica sem filhos.
 */
@Component({
  selector: 'dl[ucamSiteFactSheet]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@for (l of linhas(); track $index) {<div class="ucam-site-fact-sheet__row"><dt class="ucam-site-fact-sheet__term">{{ l.term }}</dt><dd class="ucam-site-fact-sheet__value">{{ l.value }}</dd></div>}`,
})
export class UcamSiteFactSheet {
  readonly items = input.required<UcamSiteFact[], UcamSiteFact[] | null | undefined>({ transform: (v) => (Array.isArray(v) ? v : []) });
  /** Duas colunas a partir de duas-colunas; qualquer outro valor fica em uma. */
  readonly columns = input<UcamSiteFactSheetColumns, UcamSiteFactSheetColumns | '1' | '2' | null | undefined>(1, { transform: (v) => (Number(v) === 2 ? 2 : 1) });

  /** Chave e valor viram texto aqui: um número vindo de um CMS não derruba a página. */
  protected readonly linhas = computed(() =>
    this.items()
      .map((l) => ({ term: typeof l?.term === 'string' ? l.term.trim() : '', value: String(l?.value ?? '').trim() }))
      .filter((l) => l.term && l.value),
  );
  protected readonly classes = computed(() => classesDe('ucam-site-fact-sheet', this.columns() === 2 && 'duas-colunas'));
}
