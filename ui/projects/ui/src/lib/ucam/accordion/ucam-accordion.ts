import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

let seq = 0;

/**
 * Contrato: spec/components/accordion.json (ADR-074)
 *
 * Seções que abrem e fecham uma embaixo da outra. É <details>/<summary>
 * nativo, como no Trilho A e no accordion dos Sites: abre sem script, o
 * navegador anuncia aberto e fechado, e o mesmo name nos itens faz o
 * navegador fechar os outros — um por vez sem uma linha de código nossa.
 *
 * O item é um details[ucamAccordionItem], e não um componente com tag
 * própria: o hospedeiro É o <details>, e por isso não há casca entre ele e o
 * leitor de tela.
 */
@Component({
  selector: 'ucam-accordion',
  exportAs: 'ucamAccordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-accordion block' },
  template: `<ng-content />`,
  styles: `
    ucam-accordion.ucam-accordion { border-block-start: 1px solid var(--ucam-color-border-subtle); }
    ucam-accordion .ucam-accordion__item { border-block-end: 1px solid var(--ucam-color-border-subtle); }
    ucam-accordion .ucam-accordion__gatilho {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      min-block-size: 2.75rem;
      padding: 0.5rem 0.25rem;
      border-radius: var(--ucam-radius-control-sm);
      list-style: none;
      color: var(--ucam-color-text-primary);
      font-weight: var(--ucam-typography-label-font-weight);
      cursor: pointer;
    }
    ucam-accordion .ucam-accordion__gatilho::-webkit-details-marker { display: none; }
    ucam-accordion .ucam-accordion__gatilho::marker { content: ''; }
    ucam-accordion .ucam-accordion__gatilho:hover { background: var(--ucam-color-interaction-hover); }
    ucam-accordion .ucam-accordion__gatilho:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: calc(-1 * var(--ucam-focus-ring-width));
    }
    ucam-accordion .ucam-accordion__gatilho > ucam-icon {
      margin-inline-start: auto;
      color: var(--ucam-color-text-secondary);
      transition: rotate var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    ucam-accordion .ucam-accordion__meta {
      margin-inline-start: auto;
      color: var(--ucam-color-text-secondary);
      font-weight: var(--ucam-typography-body-font-weight);
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
    }
    ucam-accordion .ucam-accordion__meta + ucam-icon { margin-inline-start: 0; }
    ucam-accordion .ucam-accordion__item[open] > .ucam-accordion__gatilho > ucam-icon { rotate: 180deg; }
    ucam-accordion .ucam-accordion__painel { padding: 0 0.25rem var(--ucam-space-stack-md); }
    @media (prefers-reduced-motion: reduce) {
      ucam-accordion .ucam-accordion__gatilho > ucam-icon { transition: none; }
    }
  `,
})
export class UcamAccordion {
  /** false = um aberto por vez (name comum); true = independentes. */
  readonly multiple = input(false, { transform: booleanAttribute });
  private readonly nome = `ucam-accordion-${++seq}`;
  readonly grupo = computed(() => (this.multiple() ? null : this.nome));
}

@Component({
  selector: 'details[ucamAccordionItem]',
  exportAs: 'ucamAccordionItem',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ucam-accordion__item',
    '[attr.name]': 'acordeao?.grupo() ?? null',
    '[open]': 'aberto()',
    '(toggle)': 'aoAlternar($event)',
  },
  template: `<summary class="ucam-accordion__gatilho">{{ heading() }}@if (meta()) {<span class="ucam-accordion__meta">{{ meta() }}</span>}<ucam-icon name="chevronDown" size="sm" /></summary><div class="ucam-accordion__painel"><ng-content /></div>`,
})
export class UcamAccordionItem {
  readonly heading = input.required<string>();
  /** Contagem ou situação ao lado do chevron. Faz parte do nome do gatilho. */
  readonly meta = input<string | number | null>(null);
  readonly open = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();

  protected readonly acordeao = inject(UcamAccordion, { optional: true });
  protected readonly aberto = linkedSignal(() => this.open());

  protected aoAlternar(e: Event): void {
    const real = (e.target as HTMLDetailsElement).open;
    if (real === this.aberto()) return;
    this.aberto.set(real);
    this.openChange.emit(real);
  }
}
