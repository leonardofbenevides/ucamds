import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';
import { UcamSiteIcon } from '../icon/icon';

export type UcamSiteContactCardLayout = 'card' | 'row';
const LAYOUTS = ['card', 'row'] as const;

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
 *
 * Desde 24/10/2026, para a página Unidades do candidomendes.edu.br:
 * layout="row" deita o cartão (nome à esquerda, dados em colunas), image põe
 * a foto pequena da unidade (decorativa: o nome já diz qual é) e kicker o
 * rótulo acima do nome. Vários telefones separados por "/" viram um link
 * cada; antes a linha inteira sumia, porque a soma não era um número.
 */
@Component({
  selector: 'section[ucamSiteContactCard]',
  imports: [UcamSiteIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `<ng-template #titulo>@switch (level()) {@case (2) {<h2 class="ucam-site-contact-card__title">{{ heading() }}</h2>} @case (4) {<h4 class="ucam-site-contact-card__title">{{ heading() }}</h4>} @default {<h3 class="ucam-site-contact-card__title">{{ heading() }}</h3>}}</ng-template>@if (foto() || rotulo()) {<div class="ucam-site-contact-card__cabeca">@if (foto(); as src) {<img class="ucam-site-contact-card__foto" [attr.src]="src" alt="">}<div>@if (rotulo(); as t) {<p class="ucam-site-contact-card__kicker">{{ t }}</p>}<ng-container [ngTemplateOutlet]="titulo" /></div></div>} @else {<ng-container [ngTemplateOutlet]="titulo" />}@if (endereco() || telefones().length || correio()) {<address class="ucam-site-contact-card__lines">@if (endereco(); as t) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="mapPin"></svg><span>{{ t }}</span></p>}@if (telefones().length === 1) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="phone"></svg><a [attr.href]="telefones()[0].href">{{ telefones()[0].texto }}</a></p>} @else if (telefones().length) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="phone"></svg><span>@for (t of telefones(); track t.href; let ultimo = $last) {<a [attr.href]="t.href">{{ t.texto }}</a>@if (!ultimo) { / }}</span></p>}@if (correio(); as t) {<p class="ucam-site-contact-card__line"><svg ucamSiteIcon="mail"></svg><a [attr.href]="'mailto:' + t">{{ t }}</a></p>}</address>}`,
})
export class UcamSiteContactCard {
  readonly heading = input.required<string>();
  readonly address = input<string | null | undefined>(null);
  readonly phone = input<string | null | undefined>(null);
  readonly email = input<string | null | undefined>(null);
  /** O nível do título: 3 por padrão; 2 ou 4 conforme a seção em que o cartão está. */
  readonly level = input<2 | 3 | 4, 2 | 3 | 4 | '2' | '3' | '4' | null | undefined>(3, { transform: (v) => ([2, 4].includes(Number(v)) ? (Number(v) as 2 | 4) : 3) });

  readonly layout = input<UcamSiteContactCardLayout, UcamSiteContactCardLayout | null | undefined>('card', { transform: umDe(LAYOUTS, 'card') });
  /** A foto da unidade, pequena e decorativa (alt vazio): o nome já diz qual é. */
  readonly image = input<string | null | undefined>(null);
  /** O rótulo acima do nome: Institucional, Polo EAD. */
  readonly kicker = input<string | null | undefined>(null);

  protected readonly classes = computed(() => classesDe('ucam-site-contact-card', this.layout() === 'row' && 'linha'));
  protected readonly foto = computed(() => texto(this.image()));
  protected readonly rotulo = computed(() => texto(this.kicker()));
  protected readonly endereco = computed(() => texto(this.address()));
  /** Um link por número; o que não é número some, e href repetido fica só uma vez. */
  protected readonly telefones = computed(() => {
    const vistos = new Set<string>();
    return (texto(this.phone()) ?? '')
      .split(/\s*\/\s*/)
      .map((t) => ({ texto: t.trim(), href: t.trim() ? hrefDeTelefone(t) : null }))
      .filter((t): t is { texto: string; href: string } => !!t.href && !vistos.has(t.href) && !!vistos.add(t.href));
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
