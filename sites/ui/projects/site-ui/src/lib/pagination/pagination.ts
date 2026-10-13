import { PlatformLocation } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, afterRenderEffect, booleanAttribute, computed, inject, input, output } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';
import { janelaDePaginas, paginaNaFaixa } from './janela';

/** O endereço de uma página: uma função, ou um modelo em texto com `{pagina}`. */
export type UcamSitePaginationHref = string | ((pagina: number) => string);

/**
 * Paginação. Contrato: sites/spec/components/pagination.json.
 *
 *   <nav ucamSitePagination [page]="2" [total]="89" ariaLabel="Paginação das vagas"></nav>
 *
 * Por padrão cada número é um LINK de verdade: é o que um site estático
 * precisa, e funciona sem script. O endereço padrão é o da página atual com
 * o parâmetro `pagina` trocado — montado a partir do endereço, e não escrito
 * como "?pagina=N": uma URL só de consulta resolve contra o <base href> do
 * documento, e todo app Angular tem <base href="/">, então o link levava
 * para a home (revisão de 13/10/2026).
 *
 * `hrefDe` troca o endereço: uma função, ou um modelo como
 * "/vagas?pagina={pagina}", que cabe num template.
 *
 * Com `emMemoria` o clique não navega e a peça avisa por `pageChange`, para
 * quem pagina uma lista que já está na página. O link continua no elemento
 * (abrir em outra aba funciona), e clique com Ctrl, Cmd, Shift ou botão do
 * meio segue para o navegador. Quem usa esse modo anuncia a troca de página
 * a quem não vê a tela: a peça não tem região viva.
 */
@Component({
  selector: 'nav[ucamSitePagination]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-pagination', '[attr.aria-label]': 'ariaLabel()' },
  // track pelo NÚMERO da página: em memória, o link escolhido continua sendo o
  // mesmo elemento (com o foco) e vira o atual. Por índice, o foco ficava num
  // nó que passava a mostrar outro número.
  template: `@if (itens().length > 1) {<a class="ucam-site-pagination__item ucam-site-pagination__item--seta" [attr.href]="anterior() ? href(anterior()!) : null" [attr.aria-disabled]="anterior() ? null : 'true'" aria-label="Página anterior" (click)="ir($event, anterior())"><svg ucamSiteIcon="chevronLeft"></svg></a>@for (p of itens(); track p ?? 'reticencia-' + $index) {@if (p === null) {<span class="ucam-site-pagination__reticencias" aria-hidden="true">…</span>} @else {<a class="ucam-site-pagination__item" [attr.href]="href(p)" [attr.aria-current]="p === atual() ? 'page' : null" (click)="ir($event, p)">{{ p }}</a>}}<a class="ucam-site-pagination__item ucam-site-pagination__item--seta" [attr.href]="seguinte() ? href(seguinte()!) : null" [attr.aria-disabled]="seguinte() ? null : 'true'" aria-label="Próxima página" (click)="ir($event, seguinte())"><svg ucamSiteIcon="chevronRight"></svg></a>}`,
})
export class UcamSitePagination {
  /** A página atual, a partir de 1. Fora da faixa, é trazida para dentro. */
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  /** O nome da navegação: numa página com duas listas, o leitor de tela precisa saber qual. */
  readonly ariaLabel = input.required<string>();
  /** O endereço de cada página. Sem ele, o endereço atual com `pagina` trocado. */
  readonly hrefDe = input<UcamSitePaginationHref | null | undefined>(null);
  /** A lista já está na página: o clique não navega, e `pageChange` avisa. */
  readonly emMemoria = input(false, { transform: booleanAttribute });
  readonly pageChange = output<number>();

  private readonly local = inject(PlatformLocation);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Houve troca de página por clique nesta peça: depois de desenhar, o foco é conferido. */
  private conferirFoco = false;

  protected readonly atual = computed(() => paginaNaFaixa(this.page(), this.total()));
  /** Com menos de duas páginas não há o que paginar: a navegação fica vazia. */
  protected readonly itens = computed(() => janelaDePaginas(this.page(), this.total()));
  protected readonly anterior = computed(() => (this.atual() > 1 ? this.atual() - 1 : null));
  protected readonly seguinte = computed(() => (this.atual() < Math.floor(Number(this.total())) ? this.atual() + 1 : null));

  constructor() {
    // Em memória, a seta que chega à ponta perde o href com o foco em cima, e o
    // número que sai da janela é destruído: nos dois casos o foco cairia no
    // <body>. Depois de desenhar, quem perdeu o lugar devolve o foco à atual.
    afterRenderEffect(() => {
      this.atual();
      if (!this.conferirFoco) return;
      this.conferirFoco = false;
      const raiz = this.el.nativeElement;
      const ativo = raiz.ownerDocument.activeElement;
      if (!ativo || !raiz.contains(ativo) || !ativo.hasAttribute('href')) raiz.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    });
  }

  protected href(pagina: number): string {
    const de = this.hrefDe();
    if (typeof de === 'function') return de(pagina);
    if (typeof de === 'string' && de.trim()) return de.replaceAll('{pagina}', String(pagina));
    const consulta = new URLSearchParams(this.local.search);
    consulta.set('pagina', String(pagina));
    return `${this.local.pathname}?${consulta}`;
  }

  protected ir(evento: Event, pagina: number | null): void {
    if (!this.emMemoria()) return;
    // Abrir em outra aba ou janela é do navegador.
    const m = evento as MouseEvent;
    if (m.ctrlKey || m.metaKey || m.shiftKey || m.altKey || (m.button ?? 0) !== 0) return;
    evento.preventDefault();
    if (pagina === null || pagina === this.atual()) return;
    this.conferirFoco = true;
    this.pageChange.emit(pagina);
  }
}
