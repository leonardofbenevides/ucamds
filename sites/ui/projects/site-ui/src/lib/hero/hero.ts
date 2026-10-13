import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

/**
 * Hero: o topo da home. Contrato: sites/spec/components/hero.json.
 *
 *   <section ucamSiteHero eyebrow="CENPRE Carreiras" heading="Seu estágio começa aqui" lede="…" image="/campus.jpg">
 *     <ul ucamSiteHeroPills><li ucamSiteHeroPill>Desde 2001</li></ul>
 *     <div ucamSiteHeroActions><a ucamSiteButton inverse size="lg" href="/vagas">Ver vagas</a></div>
 *   </section>
 *
 * TEXTO NUNCA ASSENTA SOBRE FOTO. A imagem, o véu e o modificador que guarda
 * a metade do texto nascem da MESMA condição, a entrada `image`: não há como
 * ter um sem os outros. A foto é decorativa (alt vazio): o que importa está
 * no texto.
 *
 * Pílulas e ações são conteúdo de quem usa, e saem na ordem do contrato
 * qualquer que seja a ordem em que foram escritas.
 *
 * Cada uma no seu `@if`, quando for condicional: o Angular não projeta por
 * `select` o conteúdo de um `@if` com mais de um nó na raiz (aviso NG8011).
 * Esse conteúdo não some — cai no encaixe geral, no fim do bloco —, mas sai
 * na ordem escrita, não na do contrato.
 */
@Component({
  selector: 'section[ucamSiteHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (foto(); as src) {<img class="ucam-site-hero__media" [attr.src]="src" alt=""><div class="ucam-site-hero__scrim" aria-hidden="true"></div>}<div class="ucam-site-hero__inner"><div class="ucam-site-hero__content">@if (palavra(); as t) {<p class="ucam-site-hero__eyebrow">{{ t }}</p>}<h1 class="ucam-site-hero__title">{{ heading() }}</h1>@if (frase(); as t) {<p class="ucam-site-hero__lede">{{ t }}</p>}<ng-content select="[ucamSiteHeroPills]" /><ng-content select="[ucamSiteHeroActions]" /><ng-content /></div></div>`,
})
export class UcamSiteHero {
  /** O título, o h1 da página. */
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly lede = input<string | null | undefined>(null);
  /** O endereço da foto. Com ela, o texto fica na metade inicial e a foto na final, a partir de 1024px. */
  readonly image = input<string | null | undefined>(null);

  protected readonly foto = computed(() => this.image()?.trim() || null);
  protected readonly palavra = computed(() => this.eyebrow()?.trim() || null);
  protected readonly frase = computed(() => this.lede()?.trim() || null);
  protected readonly classes = computed(() => classesDe('ucam-site-hero', !!this.foto() && 'com-foto'));
}

/** A fileira de pílulas do hero: `<ul ucamSiteHeroPills>`. */
@Directive({ selector: '[ucamSiteHeroPills]', host: { class: 'ucam-site-hero__pills' } })
export class UcamSiteHeroPills {}

/** A fileira de ações do hero: `<div ucamSiteHeroActions>`. */
@Directive({ selector: '[ucamSiteHeroActions]', host: { class: 'ucam-site-hero__actions' } })
export class UcamSiteHeroActions {}
