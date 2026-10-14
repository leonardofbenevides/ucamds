import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, afterRenderEffect, computed, inject, input } from '@angular/core';

export interface UcamSiteSectionTab {
  label: string;
  href: string;
}

/**
 * Abas de seção: a navegação entre as partes de uma página longa. Contrato:
 * sites/spec/components/section-tabs.json.
 *
 *   <nav ucamSiteSectionTabs ariaLabel="Seções do curso" current="/mestrado#pesquisa"
 *        [items]="[{ label: 'Apresentação', href: '/mestrado#apresentacao' }, …]"></nav>
 *
 * Cada aba é um link de verdade, e a atual é a de `current`, com
 * aria-current="page". O endereço é de quem usa: com <base href>, um href só
 * com o hash apagaria o caminho, e por isso a peça não o monta.
 *
 * No telefone a fileira rola de lado. Depois de desenhar, no navegador, a
 * fileira rola até a aba atual, sem mexer na rolagem da página: é a fileira
 * que rola (scrollTo nela), e não a aba que pede para aparecer
 * (scrollIntoView rolaria a página até a fileira).
 */
@Component({
  selector: 'nav[ucamSiteSectionTabs]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-section-tabs', '[attr.aria-label]': 'rotulo()' },
  template: `@if (abas().length) {<ul class="ucam-site-section-tabs__list">@for (a of abas(); track a.href) {<li class="ucam-site-section-tabs__item"><a class="ucam-site-section-tabs__tab" [attr.href]="a.href" [attr.aria-current]="a.href === atual() ? 'page' : null">{{ a.label }}</a></li>}</ul>}`,
})
export class UcamSiteSectionTabs {
  readonly items = input.required<UcamSiteSectionTab[], UcamSiteSectionTab[] | null | undefined>({ transform: (v) => (Array.isArray(v) ? v : []) });
  /** O href da aba atual. Sem ele, ou sem aba que case, nenhuma é a atual. */
  readonly current = input<string | null | undefined>(null);
  readonly ariaLabel = input<string | null | undefined>('Seções da página');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Aba sem rótulo ou sem destino não entra; href repetido fica só na primeira. */
  protected readonly abas = computed(() => {
    const vistos = new Set<string>();
    return this.items()
      .map((a) => ({ label: typeof a?.label === 'string' ? a.label.trim() : '', href: typeof a?.href === 'string' ? a.href.trim() : '' }))
      .filter((a) => a.label && a.href && !vistos.has(a.href) && vistos.add(a.href));
  });
  protected readonly atual = computed(() => this.current()?.trim() || null);
  /** Navegação sem nome não se distingue da principal: vazio volta ao padrão. */
  protected readonly rotulo = computed(() => this.ariaLabel()?.trim() || 'Seções da página');

  constructor() {
    afterRenderEffect(() => {
      this.abas();
      if (!this.atual()) return;
      const fileira = this.el.nativeElement;
      const aba = fileira.querySelector<HTMLElement>('[aria-current="page"]');
      if (!aba) return;
      // Centrada na fileira; offsetLeft é medido dela, que a folha posiciona.
      fileira.scrollTo?.({ left: aba.offsetLeft - (fileira.clientWidth - aba.offsetWidth) / 2, behavior: 'instant' });
    });
  }
}
