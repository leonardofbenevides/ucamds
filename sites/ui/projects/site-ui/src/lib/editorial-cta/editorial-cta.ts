import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

/**
 * CTA: a chamada que fecha a página. Contrato: sites/spec/components/editorial-cta.json.
 *
 *   <section ucamSiteCta eyebrow="Próximo passo" heading="Pronto para o primeiro estágio?" text="…" image="/alunos.jpg">
 *     <div ucamSiteCtaActions><a ucamSiteButton inverse href="/vagas">Ver vagas</a></div>
 *   </section>
 *
 * Com foto vale a regra do hero: imagem, véu e o modificador que guarda a
 * metade do texto nascem da mesma entrada, `image`.
 */
@Component({
  selector: 'section[ucamSiteCta]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (foto(); as src) {<img class="ucam-site-cta__media" [attr.src]="src" alt=""><div class="ucam-site-cta__scrim" aria-hidden="true"></div>}<div class="ucam-site-cta__content">@if (palavra(); as t) {<p class="ucam-site-cta__eyebrow">{{ t }}</p>}<h2 class="ucam-site-cta__title">{{ heading() }}</h2>@if (apoio(); as t) {<p class="ucam-site-cta__text">{{ t }}</p>}<ng-content select="[ucamSiteCtaActions]" /><ng-content /></div>`,
})
export class UcamSiteCta {
  /** A chamada, um h2. */
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly text = input<string | null | undefined>(null);
  /** O endereço da foto, sempre decorativa. */
  readonly image = input<string | null | undefined>(null);

  protected readonly foto = computed(() => this.image()?.trim() || null);
  protected readonly palavra = computed(() => this.eyebrow()?.trim() || null);
  protected readonly apoio = computed(() => this.text()?.trim() || null);
  protected readonly classes = computed(() => classesDe('ucam-site-cta', !!this.foto() && 'com-foto'));
}

/** A fileira de ações da CTA: `<div ucamSiteCtaActions>`. */
@Directive({ selector: '[ucamSiteCtaActions]', host: { class: 'ucam-site-cta__actions' } })
export class UcamSiteCtaActions {}
