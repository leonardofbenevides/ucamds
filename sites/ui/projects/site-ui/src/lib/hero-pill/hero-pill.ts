import { Directive } from '@angular/core';

/**
 * Pílula do hero: um fato curto sobre a seção escura ("1.700 empresas
 * parceiras"). Contrato: sites/spec/components/hero-pill.json.
 *
 * Só a classe. O texto e, se houver, o `<svg ucamSiteIcon>` antes dele são
 * conteúdo de quem usa. Não é clicável: sem papel e sem foco.
 */
@Directive({ selector: '[ucamSiteHeroPill]', host: { class: 'ucam-site-hero-pill' } })
export class UcamSiteHeroPill {}
