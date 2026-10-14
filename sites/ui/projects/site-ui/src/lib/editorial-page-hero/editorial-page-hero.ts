import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSitePageHeroWidth = 'faixa' | 'prosa';

const LARGURAS = ['faixa', 'prosa'] as const;

/**
 * Hero de página: o topo das páginas internas. Contrato:
 * sites/spec/components/editorial-page-hero.json.
 *
 *   <header ucamSitePageHero eyebrow="Alunos e egressos" heading="Orientações de estágio" lede="…">
 *     <nav ucamSiteBreadcrumb inverse [items]="trilha"></nav>
 *     <div ucamSitePageHeroActions><a ucamSiteButton inverse href="/vagas">Ver vagas</a></div>
 *   </header>
 *
 * Sem foto, salvo com `image`: a raiz ganha o modificador sobre foto e a peça
 * desenha a foto e o véu, os três da mesma condição (a opacidade do véu é a da
 * conta do build). A trilha, as pílulas e as ações são conteúdo de quem usa, e saem
 * na ordem do contrato: trilha, palavra, título, frase, pílulas, ações. O
 * que não casar com nenhum encaixe (um `@if` com vários nós) vai para o fim.
 *
 * Os encaixes aceitam a diretiva da parte OU a classe dela: quem escreve a
 * parte em HTML puro (`<ul class="ucam-site-…">`) a vê no mesmo lugar.
 */
@Component({
  selector: 'header[ucamSitePageHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (foto(); as src) {<img class="ucam-site-page-hero__media" [src]="src" alt="" /><div class="ucam-site-page-hero__scrim" aria-hidden="true"></div>}<div class="ucam-site-page-hero__inner"><ng-content select="[ucamSiteBreadcrumb],.ucam-site-breadcrumb" />@if (palavra(); as t) {<p class="ucam-site-page-hero__eyebrow">{{ t }}</p>}<h1 class="ucam-site-page-hero__title">{{ heading() }}</h1>@if (frase(); as t) {<p class="ucam-site-page-hero__lede">{{ t }}</p>}<ng-content select="[ucamSitePageHeroPills],.ucam-site-page-hero__pills" /><ng-content select="[ucamSitePageHeroActions],.ucam-site-page-hero__actions" /><ng-content /></div>`,
})
export class UcamSitePageHero {
  /** O título, o h1 da página. */
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly lede = input<string | null | undefined>(null);
  /** `prosa` no topo de um artigo: o bloco alinha com o texto corrido abaixo. */
  readonly width = input<UcamSitePageHeroWidth, UcamSitePageHeroWidth | null | undefined>('faixa', { transform: umDe(LARGURAS, 'faixa') });

  /** A foto de fundo, decorativa. Com ela, a variante sobre foto. */
  readonly image = input<string | null | undefined>(null);

  protected readonly foto = computed(() => (typeof this.image() === 'string' && this.image()!.trim()) || null);
  protected readonly palavra = computed(() => this.eyebrow()?.trim() || null);
  protected readonly frase = computed(() => this.lede()?.trim() || null);
  protected readonly classes = computed(() => classesDe('ucam-site-page-hero', this.width() === 'prosa' && 'prosa', this.foto() !== null && 'sobre-foto'));
}

/** A fileira de pílulas do hero de página: `<ul ucamSitePageHeroPills>`. */
@Directive({ selector: '[ucamSitePageHeroPills]', host: { class: 'ucam-site-page-hero__pills' } })
export class UcamSitePageHeroPills {}

/** A fileira de ações do hero de página: `<div ucamSitePageHeroActions>`. */
@Directive({ selector: '[ucamSitePageHeroActions]', host: { class: 'ucam-site-page-hero__actions' } })
export class UcamSitePageHeroActions {}
