import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input, output } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';
import { janelaDePaginas, paginaNaFaixa } from './janela';

/**
 * Paginação. Contrato: sites/spec/components/pagination.json.
 *
 *   <nav ucamSitePagination [page]="2" [total]="89" ariaLabel="Paginação das vagas"></nav>
 *
 * Por padrão cada número é um LINK de verdade (`hrefDe` monta o endereço):
 * é o que um site estático precisa, e funciona sem script. Com `emMemoria`
 * o clique não navega e a peça avisa por `pageChange`, para quem pagina uma
 * lista que já está na página.
 */
@Component({
  selector: 'nav[ucamSitePagination]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-pagination', '[attr.aria-label]': 'ariaLabel()' },
  template: `@if (itens().length > 1) {<a class="ucam-site-pagination__item ucam-site-pagination__item--seta" [attr.href]="anterior() ? hrefDe()(anterior()!) : null" [attr.aria-disabled]="anterior() ? null : 'true'" aria-label="Página anterior" (click)="ir($event, anterior())"><svg ucamSiteIcon="chevronLeft"></svg></a>@for (p of itens(); track $index) {@if (p === null) {<span class="ucam-site-pagination__reticencias" aria-hidden="true">…</span>} @else {<a class="ucam-site-pagination__item" [attr.href]="hrefDe()(p)" [attr.aria-current]="p === atual() ? 'page' : null" (click)="ir($event, p)">{{ p }}</a>}}<a class="ucam-site-pagination__item ucam-site-pagination__item--seta" [attr.href]="seguinte() ? hrefDe()(seguinte()!) : null" [attr.aria-disabled]="seguinte() ? null : 'true'" aria-label="Próxima página" (click)="ir($event, seguinte())"><svg ucamSiteIcon="chevronRight"></svg></a>}`,
})
export class UcamSitePagination {
  /** A página atual, a partir de 1. Fora da faixa, é trazida para dentro. */
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  /** O nome da navegação: numa página com duas listas, o leitor de tela precisa saber qual. */
  readonly ariaLabel = input.required<string>();
  /** O endereço de cada página. O padrão é a consulta `?pagina=N`. */
  readonly hrefDe = input<(pagina: number) => string>((pagina) => `?pagina=${pagina}`);
  /** A lista já está na página: o clique não navega, e `pageChange` avisa. */
  readonly emMemoria = input(false, { transform: booleanAttribute });
  readonly pageChange = output<number>();

  protected readonly atual = computed(() => paginaNaFaixa(this.page(), this.total()));
  /** Com menos de duas páginas não há o que paginar: a navegação fica vazia. */
  protected readonly itens = computed(() => janelaDePaginas(this.page(), this.total()));
  protected readonly anterior = computed(() => (this.atual() > 1 ? this.atual() - 1 : null));
  protected readonly seguinte = computed(() => (this.atual() < Math.floor(Number(this.total())) ? this.atual() + 1 : null));

  protected ir(evento: Event, pagina: number | null): void {
    if (!this.emMemoria()) return;
    evento.preventDefault();
    if (pagina === null || pagina === this.atual()) return;
    this.pageChange.emit(pagina);
  }
}
