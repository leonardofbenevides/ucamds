import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import { DEMOS } from '@ucam/site-ui/demos';

/**
 * A peça dos sites duas vezes: o HTML do catálogo e a peça de @ucam/site-ui,
 * lado a lado, com o mesmo conteúdo.
 *
 * É a terceira camada do portão de paridade (spec de 10/10/2026). As duas
 * primeiras rodam sem navegador — árvore de DOM no teste, texto do contrato
 * no validador. Esta é a que mostra a quem lê, e é o par que a sonda por CDP
 * mede: `data-paridade="html"` contra `data-paridade="angular"`.
 *
 * Os componentes vêm de um arquivo GERADO das demos da spec, o mesmo que o
 * teste da lib usa. Não há demo Angular escrita à mão neste site.
 */
@Component({
  selector: 'ucam-sites-paridade',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (d of pares(); track d.titulo) {
      <figure class="par">
        <figcaption class="par-titulo">{{ d.titulo === 'principal' ? 'Exemplo' : d.titulo }}</figcaption>
        <div class="lados">
          <div class="lado">
            <p class="rotulo">HTML</p>
            <div class="ucam-site" data-paridade="html" [innerHTML]="d.html"></div>
          </div>
          <div class="lado">
            <p class="rotulo">Angular</p>
            <div class="ucam-site" data-paridade="angular"><ng-container *ngComponentOutlet="d.componente" /></div>
          </div>
        </div>
      </figure>
    }
  `,
  styles: `
    .par {
      margin: 0 0 1.25rem;
    }
    .par-titulo {
      margin-block-end: 0.5rem;
      font-weight: 600;
    }
    .lados {
      display: grid;
      gap: 0.75rem;
    }
    @media (min-width: 48rem) {
      .lados {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .lado {
      min-inline-size: 0;
      padding: 0.75rem 1rem 1rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-md);
      background-color: var(--ucam-color-surface-canvas);
    }
    .rotulo {
      margin: 0 0 0.75rem;
      color: var(--ucam-color-text-secondary);
      font-size: 0.8125rem;
    }
  `,
})
export class SitesParidadeComponent {
  /** O id da peça no catálogo dos sites. */
  readonly peca = input.required<string>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly pares = computed(() =>
    (DEMOS[this.peca()] ?? []).map((d) => ({ ...d, html: this.sanitizer.bypassSecurityTrustHtml(d.html) })),
  );
}

/** A peça tem forma Angular? É o que decide se a seção aparece e entra no índice. */
export const temFormaAngular = (id: string): boolean => (DEMOS[id]?.length ?? 0) > 0;
