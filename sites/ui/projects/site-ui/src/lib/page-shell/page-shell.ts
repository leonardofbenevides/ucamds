import { Directive, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteContainerWidth = 'miolo' | 'faixa' | 'prosa';
export type UcamSiteSecaoTone = 'default' | 'sutil';

const LARGURAS = ['miolo', 'faixa', 'prosa'] as const;
const TONS = ['default', 'sutil'] as const;

/*
 * A moldura da página. Contrato: sites/spec/components/page-shell.json.
 *
 * Cinco diretivas, uma por elemento do contrato, e nenhuma com template: a
 * página é do consumidor, e a moldura só diz qual elemento é o quê. O href
 * do link de salto e o id do <main> são nativos.
 */

/** A raiz da página: `<div ucamSitePage>` ou o `<body>`. */
@Directive({ selector: '[ucamSitePage]', host: { class: 'ucam-site-page' } })
export class UcamSitePage {}

/** O link de salto, o primeiro foco da página: `<a ucamSiteSkip href="#conteudo">`. */
@Directive({ selector: 'a[ucamSiteSkip]', host: { class: 'ucam-site-skip' } })
export class UcamSiteSkip {}

/** O conteúdo principal: `<main ucamSitePageMain id="conteudo">`. */
@Directive({ selector: 'main[ucamSitePageMain]', host: { class: 'ucam-site-page__main' } })
export class UcamSitePageMain {}

/** Uma seção da página, com o respiro vertical: `<section ucamSiteSecao tone="sutil">`. */
@Directive({ selector: '[ucamSiteSecao]', host: { '[class]': 'classes()' } })
export class UcamSiteSecao {
  readonly tone = input<UcamSiteSecaoTone, UcamSiteSecaoTone | null | undefined>('default', { transform: umDe(TONS, 'default') });

  protected readonly classes = computed(() => classesDe('ucam-site-secao', this.tone() === 'sutil' && 'sutil'));
}

/** O contêiner, que tem a largura máxima e a margem lateral: `<div ucamSiteContainer width="prosa">`. */
@Directive({ selector: '[ucamSiteContainer]', host: { '[class]': 'classes()' } })
export class UcamSiteContainer {
  readonly width = input<UcamSiteContainerWidth, UcamSiteContainerWidth | null | undefined>('miolo', { transform: umDe(LARGURAS, 'miolo') });

  protected readonly classes = computed(() => classesDe('ucam-site-container', this.width() !== 'miolo' && this.width()));
}
