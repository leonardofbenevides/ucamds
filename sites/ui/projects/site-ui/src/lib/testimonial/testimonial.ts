import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

/**
 * Depoimento: a fala e quem falou. Contrato: sites/spec/components/testimonial.json.
 *
 * As aspas são da folha; a fala vai sem elas. O avatar é decorativo — o nome
 * está escrito ao lado — e leva as iniciais: a primeira letra do primeiro e
 * do último nome de `author`, ou o que vier em `initials`.
 *
 * As entradas se chamam `author` e `authorRole`, e não `name` e `role`,
 * porque `role` é atributo nativo e ficaria no <figure> com outro sentido.
 */
@Component({
  selector: 'figure[ucamSiteTestimonial]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `<blockquote class="ucam-site-testimonial__quote">{{ quote() }}</blockquote>@if (autor(); as nome) {<figcaption class="ucam-site-testimonial__autor"><span class="ucam-site-avatar" aria-hidden="true">{{ marca() }}</span><span><span class="ucam-site-testimonial__nome">{{ nome }}</span>@if (papel(); as texto) {<span class="ucam-site-testimonial__papel">{{ texto }}</span>}</span></figcaption>}`,
})
export class UcamSiteTestimonial {
  readonly quote = input.required<string>();
  readonly author = input<string | null | undefined>(null);
  /** Curso e ano, ou cargo e empresa: o que diz quem é a pessoa. */
  readonly authorRole = input<string | null | undefined>(null);
  readonly initials = input<string | null | undefined>(null);
  readonly inverse = input(false, { transform: booleanAttribute });

  protected readonly autor = computed(() => this.author()?.trim().replace(/\s+/g, ' ') || null);
  protected readonly papel = computed(() => this.authorRole()?.trim() || null);
  protected readonly marca = computed(() => {
    const dada = this.initials()?.trim();
    if (dada) return dada;
    // A primeira LETRA de cada palavra: parêntese, aspas, número e emoji não são inicial de ninguém.
    const iniciais = (this.autor() ?? '')
      .split(' ')
      .map((palavra) => /\p{L}/u.exec(palavra)?.[0])
      .filter((letra): letra is string => !!letra);
    const letras = iniciais.length > 1 ? [iniciais[0], iniciais.at(-1)!] : iniciais;
    return letras.map((l) => l.toUpperCase()).join('');
  });
  protected readonly classes = computed(() => classesDe('ucam-site-testimonial', this.inverse() && 'inverse'));
}
