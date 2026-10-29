import { ChangeDetectionStrategy, Component, Directive, ElementRef, ViewEncapsulation, afterNextRender, computed, contentChildren, inject, input, signal, viewChild } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';
import { UcamSiteIds } from '../nucleo/id';

/** Um item da fileira: `<li ucamSiteCarouselItem>`. */
@Directive({
  selector: 'li[ucamSiteCarouselItem]',
  host: { class: 'ucam-site-carousel__item' },
})
export class UcamSiteCarouselItem {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}

/** Marca o título que vai no topo da fileira, à esquerda dos controles. */
@Directive({ selector: '[ucamSiteCarouselTitulo]' })
export class UcamSiteCarouselTitulo {}

/**
 * A fileira que rola. Contrato: sites/spec/components/carousel.json.
 *
 *   <section ucamSiteCarousel ariaLabel="Depoimentos dos alunos">
 *     <h2 ucamSiteCarouselTitulo>Depoimentos dos alunos</h2>
 *     @for (d of depoimentos; track d.nome) { <li ucamSiteCarouselItem>…</li> }
 *   </section>
 *
 * Todos os itens ficam na página e nada roda sozinho: a trilha rola com
 * encaixe por item, e as setas só adiantam um item. A contagem é por ITEM,
 * como no site ("1 de 6"): o total vem dos itens, sem medir nada, e é por
 * isso que o desenho do servidor é o mesmo da demo em HTML. No navegador a
 * rolagem atualiza a posição, e os controles somem quando tudo cabe.
 */
@Component({
  selector: 'section[ucamSiteCarousel]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-carousel', '[attr.aria-label]': 'rotulo()' },
  template: `<div class="ucam-site-carousel__topo"><ng-content select="[ucamSiteCarouselTitulo]" /><div class="ucam-site-carousel__controles" [hidden]="cabe()"><p class="ucam-site-carousel__contagem" role="status">{{ atual() }} de {{ total() }}</p><button type="button" class="ucam-site-carousel__seta" aria-label="Anterior" [attr.aria-controls]="id" [disabled]="atual() <= 1" (click)="anda(-1)"><svg ucamSiteIcon="chevronLeft"></svg></button><button type="button" class="ucam-site-carousel__seta" aria-label="Próximo" [attr.aria-controls]="id" [disabled]="noFim()" (click)="anda(1)"><svg ucamSiteIcon="chevronRight"></svg></button></div></div><ul #trilha class="ucam-site-carousel__trilha" [attr.id]="id" tabindex="0" (scroll)="mede()"><ng-content /></ul>`,
})
export class UcamSiteCarousel {
  readonly ariaLabel = input<string | null | undefined>('Destaques');

  protected readonly id = inject(UcamSiteIds).proximo('ucam-site-carrossel');
  private readonly itens = contentChildren(UcamSiteCarouselItem);
  private readonly trilha = viewChild.required<ElementRef<HTMLUListElement>>('trilha');

  protected readonly rotulo = computed(() => this.ariaLabel()?.trim() || 'Destaques');
  protected readonly total = computed(() => this.itens().length);
  /** O primeiro item à vista, de 1 a total. Antes de medir, o primeiro. */
  private readonly primeiro = signal(1);
  /** A trilha chegou ao fim da rolagem. Só o navegador sabe; antes, não. */
  private readonly fim = signal(false);
  /** Tudo cabe sem rolar: os controles não têm o que fazer. */
  protected readonly cabe = signal(false);

  protected readonly atual = computed(() => Math.min(this.primeiro(), Math.max(this.total(), 1)));
  protected readonly noFim = computed(() => this.total() <= 1 || this.fim());

  constructor() {
    afterNextRender(() => this.mede());
  }

  protected mede(): void {
    const t = this.trilha().nativeElement;
    if (!t.clientWidth) return;
    this.cabe.set(t.scrollWidth <= t.clientWidth + 1);
    this.fim.set(t.scrollLeft + t.clientWidth >= t.scrollWidth - 1);
    const borda = t.getBoundingClientRect().left;
    const i = this.itens().findIndex((item) => item.el.getBoundingClientRect().left >= borda - 1);
    this.primeiro.set(i < 0 ? this.total() : i + 1);
  }

  protected anda(passo: -1 | 1): void {
    const alvo = this.itens()[this.atual() - 1 + passo];
    if (!alvo) return;
    // Medido contra a própria trilha: offsetLeft conta do ancestral
    // posicionado, e a trilha não é posicionada.
    const t = this.trilha().nativeElement;
    t.scrollTo?.({ left: t.scrollLeft + alvo.el.getBoundingClientRect().left - t.getBoundingClientRect().left });
  }
}
