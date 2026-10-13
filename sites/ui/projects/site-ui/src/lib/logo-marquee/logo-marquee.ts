import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, inject, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';
import { UcamSiteIds } from '../nucleo/id';

export interface UcamSiteLogo {
  src: string;
  /** O nome da empresa. */
  alt: string;
  href?: string | null;
}

/**
 * Desfile de logos, em laço. Contrato: sites/spec/components/logo-marquee.json.
 *
 *   <div ucamSiteMarquee [logos]="parceiros"></div>
 *
 * Recebe os logos UMA vez e desenha os dois grupos de que o laço precisa. A
 * segunda cópia existe só para o olho: leva aria-hidden, alt vazio e, onde o
 * logo é link, tabindex -1 — cada empresa é lida e focada uma vez.
 *
 * A pausa é a caixa de seleção da folha, antes da janela: funciona sem
 * script, por teclado e por toque, e é igual no HTML puro. Com `paused`, ou
 * com menos de dois logos válidos, não há o que desfilar: um grupo só, em
 * linhas, sem caixa.
 */
@Component({
  selector: 'div[ucamSiteMarquee]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (validos().length) {@if (!parado()) {<input class="ucam-site-marquee__pausa" type="checkbox" [attr.id]="id()"><label class="ucam-site-marquee__pausa-rotulo" [attr.for]="id()">{{ rotulo() }}</label>}<div class="ucam-site-marquee__viewport"><div class="ucam-site-marquee__track"><ul class="ucam-site-marquee__group">@for (logo of validos(); track logo.src) {<li class="ucam-site-marquee__item">@if (logo.href) {<a [attr.href]="logo.href"><img [attr.src]="logo.src" [attr.alt]="logo.alt"></a>} @else {<img [attr.src]="logo.src" [attr.alt]="logo.alt">}</li>}</ul>@if (!parado()) {<ul class="ucam-site-marquee__group" aria-hidden="true">@for (logo of validos(); track logo.src) {<li class="ucam-site-marquee__item">@if (logo.href) {<a [attr.href]="logo.href" tabindex="-1"><img [attr.src]="logo.src" alt=""></a>} @else {<img [attr.src]="logo.src" alt="">}</li>}</ul>}</div></div>}`,
})
export class UcamSiteMarquee {
  readonly logos = input.required<UcamSiteLogo[], UcamSiteLogo[] | null | undefined>({ transform: (v) => (Array.isArray(v) ? v : []) });
  /** A forma parada: os logos em linhas, centralizados. */
  readonly paused = input(false, { transform: booleanAttribute });
  readonly pauseLabel = input<string | null | undefined>('Pausar o desfile');
  /** O id da caixa de pausa. Sem ele a peça gera um. */
  readonly fieldId = input<string | null | undefined>(null);

  private readonly gerado = inject(UcamSiteIds).proximo('ucam-site-desfile');

  /**
   * O que dá para desenhar. Logo sem endereço sai; o que não é texto (dado de
   * CMS com o tipo errado) é tratado como ausente, e não derruba a página.
   * Logo com destino e SEM nome fica só como imagem: um link cujo único
   * conteúdo é uma imagem sem alt não tem nome acessível.
   */
  protected readonly validos = computed(() =>
    this.logos()
      .map((l) => {
        const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
        const alt = texto(l?.alt);
        return { src: texto(l?.src), alt, href: alt ? texto(l?.href) || null : null };
      })
      .filter((l) => l.src),
  );
  /** Com menos de dois logos não há laço: a peça se comporta como parada. */
  protected readonly parado = computed(() => this.paused() || this.validos().length < 2);
  protected readonly id = computed(() => this.fieldId()?.trim() || this.gerado);
  protected readonly rotulo = computed(() => this.pauseLabel()?.trim() || 'Pausar o desfile');
  protected readonly classes = computed(() => classesDe('ucam-site-marquee', this.parado() && 'parado'));
}
