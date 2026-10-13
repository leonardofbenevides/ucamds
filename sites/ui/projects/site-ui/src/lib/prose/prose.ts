import { Directive } from '@angular/core';

/**
 * Prosa: o texto corrido de um artigo. Contrato: sites/spec/components/prose.json.
 *
 * Só a classe. É a única peça cujo conteúdo não leva classe: o texto vem de
 * um editor. Quem tem o HTML pronto liga `[innerHTML]` no próprio elemento —
 * o saneamento é o do Angular, e a lib não o contorna.
 */
@Directive({ selector: '[ucamSiteProse]', host: { class: 'ucam-site-prose' } })
export class UcamSiteProse {}
