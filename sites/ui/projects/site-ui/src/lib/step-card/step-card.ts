import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';

/**
 * A lista de passos: `<ol ucamSiteSteps>`. Contrato: sites/spec/components/step-card.json.
 *
 * Leva `role="list"` além da classe: a folha tira o marcador, e sem marcador
 * o Safari deixa de anunciar a lista — e com ela a ordem, que é o que os
 * passos têm de dizer.
 */
@Directive({ selector: 'ol[ucamSiteSteps]', host: { class: 'ucam-site-steps', role: 'list' } })
export class UcamSiteSteps {}

/**
 * Um passo: `<li ucamSiteStep [number]="1" heading="Cadastre o currículo">`.
 *
 * O número é desenhado e escondido do leitor de tela: a ordem já vem da
 * lista. O link só existe com o destino E o texto dele.
 */
@Component({
  selector: 'li[ucamSiteStep]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-step-card' },
  template: `<span class="ucam-site-step-card__number" aria-hidden="true">{{ number() }}</span><div class="ucam-site-step-card__body"><h3 class="ucam-site-step-card__title">{{ heading() }}</h3>@if (texto(); as t) {<p class="ucam-site-step-card__text">{{ t }}</p>}@if (link(); as l) {<a class="ucam-site-step-card__link" [attr.href]="l.href">{{ l.label }} <svg ucamSiteIcon="arrowRight"></svg></a>}</div>`,
})
export class UcamSiteStep {
  readonly number = input.required<number | string>();
  readonly heading = input.required<string>();
  readonly text = input<string | null | undefined>(null);
  readonly href = input<string | null | undefined>(null);
  /** O texto do link, que diz o destino: "Acessar a plataforma". */
  readonly linkLabel = input<string | null | undefined>(null);

  protected readonly texto = computed(() => this.text()?.trim() || null);
  protected readonly link = computed(() => {
    const href = this.href()?.trim();
    const label = this.linkLabel()?.trim();
    return href && label ? { href, label } : null;
  });
}
