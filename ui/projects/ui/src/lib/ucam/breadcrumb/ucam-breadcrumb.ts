import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/breadcrumb.json (ADR-074)
 *
 * A trilha: onde a tela fica dentro do sistema. Até 19/10/2026 morava dentro
 * do UcamPageHeader, e era só lá que existia; virou componente porque a tela
 * de detalhe, a viewbar e a gaveta a usam sem cabeçalho de página. O desenho
 * é o mesmo que o PageHeader tinha, e que ele agora usa daqui:
 *
 *  1. link em tinta de apoio COM sublinhado apagado que acende no hover — cor
 *     sozinha não distingue link de texto (WCAG 1.4.1);
 *  2. a página atual é a única em tinta cheia, sem link, com aria-current;
 *  3. separador tipográfico "/", aria-hidden, que escala com o texto.
 */
export interface UcamCrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'ucam-breadcrumb',
  exportAs: 'ucamBreadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' },
  template: `
    <nav [attr.aria-label]="label()">
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-0 text-xs leading-[1.6] m-0 p-0 list-none">
        @for (c of items(); track $index; let last = $last) {
          <li class="flex items-center gap-x-2">
            @if (c.link && !last) {
              <a
                [href]="c.link"
                class="text-[var(--ucam-color-text-secondary)] underline decoration-[var(--ucam-color-border-default)] decoration-1 underline-offset-[0.25em] rounded-sm transition-colors hover:text-foreground hover:decoration-current"
                >{{ c.label }}</a
              >
            } @else {
              <span class="font-medium text-foreground" [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span>
            }
            @if (!last) {
              <span class="text-[var(--ucam-color-border-strong)] select-none" aria-hidden="true">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class UcamBreadcrumb {
  /** Os níveis, do mais alto à página atual; o último não tem link. */
  readonly items = input.required<UcamCrumb[]>();
  readonly label = input('Trilha');
}
