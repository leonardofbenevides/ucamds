import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';

/**
 * O aviso de cookies: faixa grudada no pé. Contrato:
 * sites/spec/components/cookie-banner.json.
 *
 *   @if (!respondeu()) {
 *     <section ucamSiteCookieBanner (dismiss)="guarda()">
 *       Usamos cookies para medir as visitas e melhorar o site.
 *     </section>
 *   }
 *
 * A frase é projetada; o link da política e a ação são da peça. Ela não lê
 * nem grava cookie: emite dismiss, e quem usa guarda a resposta e deixa de
 * desenhá-la.
 *
 * Vai no fim da página, como último filho: a folha a gruda no pé da janela
 * e dá a todo foco uma margem de rolagem maior que ela, para o campo focado
 * nunca ficar debaixo da faixa (WCAG 2.4.11). Sem script: é o mesmo CSS do
 * Trilho A.
 */
@Component({
  selector: 'section[ucamSiteCookieBanner]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-cookie-banner', 'aria-label': 'Aviso de cookies' },
  template: `<p class="ucam-site-cookie-banner__texto"><ng-content /> <a [attr.href]="politica()">Política de privacidade</a></p><button type="button" class="ucam-site-btn ucam-site-btn--secondary ucam-site-cookie-banner__acao" (click)="dismiss.emit()">{{ rotulo() }}</button>`,
})
export class UcamSiteCookieBanner {
  readonly policyHref = input<string | null | undefined>('/politica-de-privacidade');
  readonly actionLabel = input<string | null | undefined>('Entendi');
  readonly dismiss = output<void>();

  protected readonly politica = computed(() => this.policyHref()?.trim() || '/politica-de-privacidade');
  protected readonly rotulo = computed(() => this.actionLabel()?.trim() || 'Entendi');
}
