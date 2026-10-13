import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

/**
 * Cartão de conteúdo. Contrato: sites/spec/components/card.json.
 *
 *   <article ucamSiteCard interactive heading="Como montar o primeiro currículo" href="/curriculo"
 *            image="/fotos/curriculo.jpg" text="O que entra e o que sai.">
 *     <ul ucamSiteCardMeta><li ucamSiteTag>Currículo</li></ul>
 *   </article>
 *
 * Com `href`, o cartão inteiro é clicável por UM link — o do título, que a
 * folha estica sobre o cartão —, nunca por um link em volta de tudo. Sem
 * `href` não há link: o título é texto, e o cartão não se diz interativo,
 * mesmo que `interactive` venha ligado (realce de clique em algo que não
 * leva a lugar nenhum engana).
 *
 * O que for escrito dentro do cartão sem ser a meta vai para o fim do corpo.
 * Nada de link nem de botão ali: o link do título cobre o cartão inteiro.
 */
@Component({
  selector: 'article[ucamSiteCard]',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (foto(); as src) {<img class="ucam-site-card__media" [attr.src]="src" alt="">}<div class="ucam-site-card__body"><ng-content select="[ucamSiteCardMeta],.ucam-site-card__meta" />@switch (level()) {@case (2) {<h2 class="ucam-site-card__title"><ng-container *ngTemplateOutlet="titulo" /></h2>} @case (4) {<h4 class="ucam-site-card__title"><ng-container *ngTemplateOutlet="titulo" /></h4>} @default {<h3 class="ucam-site-card__title"><ng-container *ngTemplateOutlet="titulo" /></h3>}}@if (texto(); as t) {<p class="ucam-site-card__text">{{ t }}</p>}<ng-content /></div><ng-template #titulo>@if (destino(); as d) {<a class="ucam-site-card__link" [attr.href]="d">{{ heading() }}</a>} @else {<ng-container>{{ heading() }}</ng-container>}</ng-template>`,
})
export class UcamSiteCard {
  readonly heading = input.required<string>();
  /** Para onde o cartão leva. Sem ele, o cartão não é clicável. */
  readonly href = input<string | null | undefined>(null);
  /** O endereço da foto, sempre decorativa: o que importa está no título. */
  readonly image = input<string | null | undefined>(null);
  readonly text = input<string | null | undefined>(null);
  readonly interactive = input(false, { transform: booleanAttribute });
  /** O nível do título: 3 por padrão; 2 ou 4 conforme a seção em que o cartão está. */
  readonly level = input<2 | 3 | 4, 2 | 3 | 4 | '2' | '3' | '4' | null | undefined>(3, { transform: (v) => ([2, 4].includes(Number(v)) ? (Number(v) as 2 | 4) : 3) });

  /** Só há link com destino E título: link sem texto, esticado sobre o cartão, não tem nome. */
  protected readonly destino = computed(() => (this.heading()?.trim() ? this.href()?.trim() || null : null));
  protected readonly foto = computed(() => this.image()?.trim() || null);
  protected readonly texto = computed(() => this.text()?.trim() || null);
  protected readonly classes = computed(() => classesDe('ucam-site-card', this.interactive() && !!this.destino() && 'interativo'));
}

/** A fileira de tags do cartão, projetada antes do título: `<ul ucamSiteCardMeta>`. */
@Directive({ selector: '[ucamSiteCardMeta]', host: { class: 'ucam-site-card__meta' } })
export class UcamSiteCardMeta {}
