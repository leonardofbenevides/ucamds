import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, booleanAttribute, computed, inject, input, linkedSignal, output } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';

/**
 * A raiz do acordeão: `<div ucamSiteAccordion name="faq">`.
 * Contrato: sites/spec/components/accordion.json.
 *
 * O `name` é o do grupo: vira o atributo name de cada <details> de dentro, e
 * é o navegador que fecha os outros quando um abre. Sem name, cada item abre
 * e fecha sozinho.
 */
@Directive({
  selector: '[ucamSiteAccordion]',
  host: { class: 'ucam-site-accordion' },
})
export class UcamSiteAccordion {
  readonly name = input<string | null | undefined>(null);

  /** O nome aparado, ou null: grupo de nome vazio não é grupo. */
  readonly grupo = computed(() => this.name()?.trim() || null);
}

/**
 * Um item: `<details ucamSiteAccordionItem heading="Pergunta">resposta</details>`.
 *
 * O estado mora no <details>, que abre e fecha sem script. A peça só o
 * espelha: `open` diz como nasce (e o muda depois), e `openChange` avisa
 * quando o usuário — ou o grupo, ao fechar os vizinhos — o alterna. Por isso
 * `[(open)]` funciona.
 */
@Component({
  selector: 'details[ucamSiteAccordionItem]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ucam-site-accordion__item',
    '[attr.name]': 'acordeao?.grupo() ?? null',
    '[open]': 'aberto()',
    '(toggle)': 'aoAlternar($event)',
  },
  template: `<summary class="ucam-site-accordion__trigger">{{ heading() }} <span class="ucam-site-accordion__icon" aria-hidden="true"><svg ucamSiteIcon="chevronDown"></svg></span></summary><div class="ucam-site-accordion__panel"><ng-content /></div>`,
})
export class UcamSiteAccordionItem {
  readonly heading = input.required<string>();
  readonly open = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();

  protected readonly acordeao = inject(UcamSiteAccordion, { optional: true });
  /** O estado atual: nasce de `open` e acompanha o <details>. */
  protected readonly aberto = linkedSignal(() => this.open());

  protected aoAlternar(evento: Event): void {
    const real = (evento.target as HTMLDetailsElement).open;
    if (real === this.aberto()) return;
    this.aberto.set(real);
    this.openChange.emit(real);
  }
}
