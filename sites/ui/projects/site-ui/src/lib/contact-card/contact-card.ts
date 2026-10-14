import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';

/**
 * '(22) 2726-2400' vira 'tel:+552227262400': no href só dígitos e o +.
 * - O ramal não entra: o texto a partir de "ramal", "r." ou "ext" é cortado.
 * - Com + na frente, o número já é internacional (8 a 15 dígitos).
 * - 0800, 0300, 0500 e 0900 são nacionais e ficam sem +55.
 * - O zero de longa distância ("0xx22", "022") sai; 55 com 12 ou 13 dígitos
 *   já tem o DDI; 10 ou 11 dígitos (DDD e número) ganham o +55.
 * Fora disso (um 190, um texto), não há link: melhor nenhum que um errado.
 */
export function hrefDeTelefone(numero: string): string | null {
  const bruto = numero.trim().split(/\s*(?:ramal|r\.|ext\.?)\s*/i)[0];
  const digitos = bruto.replace(/\D/g, '');
  if (bruto.startsWith('+')) return digitos.length >= 8 && digitos.length <= 15 ? `tel:+${digitos}` : null;
  if (/^0[3589]00\d{7}$/.test(digitos)) return `tel:${digitos}`;
  const semZero = digitos.replace(/^0/, '');
  if (/^55\d{10,11}$/.test(semZero)) return `tel:+${semZero}`;
  if (/^\d{10,11}$/.test(semZero)) return `tel:+55${semZero}`;
  return null;
}

/**
 * Cartão de contato. Contrato: sites/spec/components/contact-card.json.
 *
 *   <section ucamSiteContactCard heading="Campos dos Goytacazes"
 *            address="Rua Anita Peçanha, 100" phone="(22) 2726-2400" email="selecaoucam@ucam-campos.br"></section>
 *
 * Um título e uma linha por dado, cada uma com o ícone dela: endereço,
 * telefone (link tel:) e e-mail (link mailto:). Dado ausente não deixa linha
 * nem ícone; sem nenhum, sobra o título. O texto do telefone sai como veio.
 */
@Component({
  selector: 'section[ucamSiteContactCard]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-contact-card' },
  template: `@switch (level()) {@case (2) {<h2 class="ucam-site-contact-card__title">{{ heading() }}</h2>} @case (4) {<h4 class="ucam-site-contact-card__title">{{ heading() }}</h4>} @default {<h3 class="ucam-site-contact-card__title">{{ heading() }}</h3>}}@if (endereco() || telefone() || correio()) {<address class="ucam-site-contact-card__lines">@if (endereco(); as t) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="mapPin"></svg><span>{{ t }}</span></p>}@if (telefone(); as t) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="phone"></svg><a [attr.href]="t.href">{{ t.texto }}</a></p>}@if (correio(); as t) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="mail"></svg><a [attr.href]="'mailto:' + t">{{ t }}</a></p>}</address>}`,
})
export class UcamSiteContactCard {
  readonly heading = input.required<string>();
  readonly address = input<string | null | undefined>(null);
  readonly phone = input<string | null | undefined>(null);
  readonly email = input<string | null | undefined>(null);
  /** O nível do título: 3 por padrão; 2 ou 4 conforme a seção em que o cartão está. */
  readonly level = input<2 | 3 | 4, 2 | 3 | 4 | '2' | '3' | '4' | null | undefined>(3, { transform: (v) => ([2, 4].includes(Number(v)) ? (Number(v) as 2 | 4) : 3) });

  protected readonly endereco = computed(() => texto(this.address()));
  protected readonly telefone = computed(() => {
    const t = texto(this.phone());
    const href = t && hrefDeTelefone(t);
    return t && href ? { texto: t, href } : null;
  });
  /**
   * E-mail sem @, ou com espaço, não vira link para lugar nenhum: some. Nem
   * com ?, #, & ou vírgula: num mailto: eles acrescentam destinatário ou
   * assunto, e o dado vem de um CMS.
   */
  protected readonly correio = computed(() => {
    const t = texto(this.email());
    return t && /^[^\s@?#&,]+@[^\s@?#&,]+$/.test(t) ? t : null;
  });
}

function texto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
