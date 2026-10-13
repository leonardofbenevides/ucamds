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
 * Sem foto. A trilha, as pílulas e as ações são conteúdo de quem usa, e saem
 * na ordem do contrato: trilha, palavra, título, frase, pílulas, ações. O
 * que não casar com nenhum encaixe (um `@if` com vários nós) vai para o fim.
 */
@Component({
  selector: 'header[ucamSitePageHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `<div class="ucam-site-page-hero__inner"><ng-content select="[ucamSiteBreadcrumb]" />@if (palavra(); as t) {<p class="ucam-site-page-hero__eyebrow">{{ t }}</p>}<h1 class="ucam-site-page-hero__title">{{ heading() }}</h1>@if (frase(); as t) {<p class="ucam-site-page-hero__lede">{{ t }}</p>}<ng-content select="[ucamSitePageHeroPills]" /><ng-content select="[ucamSitePageHeroActions]" /><ng-content /></div>`,
})
export class UcamSitePageHero {
  /** O título, o h1 da página. */
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly lede = input<string | null | undefined>(null);
  /** `prosa` no topo de um artigo: o bloco alinha com o texto corrido abaixo. */
  readonly width = input<UcamSitePageHeroWidth, UcamSitePageHeroWidth | null | undefined>('faixa', { transform: umDe(LARGURAS, 'faixa') });

  protected readonly palavra = computed(() => this.eyebrow()?.trim() || null);
  protected readonly frase = computed(() => this.lede()?.trim() || null);
  protected readonly classes = computed(() => classesDe('ucam-site-page-hero', this.width() === 'prosa' && 'prosa'));
}

/** A fileira de pílulas do hero de página: `<ul ucamSitePageHeroPills>`. */
@Directive({ selector: '[ucamSitePageHeroPills]', host: { class: 'ucam-site-page-hero__pills' } })
export class UcamSitePageHeroPills {}

/** A fileira de ações do hero de página: `<div ucamSitePageHeroActions>`. */
@Directive({ selector: '[ucamSitePageHeroActions]', host: { class: 'ucam-site-page-hero__actions' } })
export class UcamSitePageHeroActions {}
