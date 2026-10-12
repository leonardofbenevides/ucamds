import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, afterRenderEffect, booleanAttribute, computed, inject, input, output, viewChild } from '@angular/core';
import { UcamSiteButton } from '../button/button';
import { UcamSiteField, UcamSiteInput } from '../input/input';
import { classesDe, umDe } from '../nucleo/classes';
import { UcamSiteIds } from '../nucleo/id';

export type UcamSiteNewsletterState = 'idle' | 'sending' | 'success' | 'error';

const ESTADOS = ['idle', 'sending', 'success', 'error'] as const;

/**
 * Formulário de newsletter. Contrato: sites/spec/components/newsletter-form.json.
 *
 *   <form ucamSiteNewsletter heading="Receba as vagas da semana" note="Um e-mail por semana."
 *         [state]="estado()" [message]="mensagem()" (submitted)="assinar($event)"></form>
 *
 * A peça NÃO envia nada. Ela confere o e-mail, avisa por `submitted` e
 * mostra o estado que o consumidor devolve:
 *   sending — o botão fica desabilitado e o formulário, ocupado;
 *   success — `message` aparece na região de status, que o leitor de tela anuncia;
 *   error   — `message` vira o erro do campo, e o foco vai para ele.
 *
 * A região de status está SEMPRE no DOM: região que nasce junto com o texto
 * não é anunciada.
 */
@Component({
  selector: 'form[ucamSiteNewsletter]',
  imports: [UcamSiteField, UcamSiteInput, UcamSiteButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'state() === "sending" ? "true" : null',
    '(submit)': 'enviar($event)',
  },
  template: `<h2 class="ucam-site-newsletter__titulo">{{ heading() }}</h2><div class="ucam-site-newsletter__campos"><div ucamSiteField [label]="fieldLabel()" [fieldId]="id()" [describedBy]="idDaNota()" [error]="state() === 'error' ? message() : null"><input ucamSiteInput #campo type="email" autocomplete="email"></div><button ucamSiteButton type="submit" [inverse]="inverse()" [disabled]="state() === 'sending'">{{ submitLabel() }}</button></div>@if (nota(); as texto) {<p class="ucam-site-newsletter__nota" [attr.id]="idDaNota()">{{ texto }}</p>}<p class="ucam-site-newsletter__status" role="status">{{ state() === 'success' ? (message() ?? '') : '' }}</p>`,
})
export class UcamSiteNewsletter {
  readonly heading = input.required<string>();
  /** A frase de consentimento, abaixo do campo. */
  readonly note = input<string | null | undefined>(null);
  readonly inverse = input(false, { transform: booleanAttribute });
  readonly fieldLabel = input('E-mail');
  readonly submitLabel = input('Assinar');
  readonly fieldId = input<string | null | undefined>(null);
  readonly state = input<UcamSiteNewsletterState, UcamSiteNewsletterState | null | undefined>('idle', { transform: umDe(ESTADOS, 'idle') });
  /** O texto do estado: a confirmação em success, o motivo em error. */
  readonly message = input<string | null | undefined>(null);
  /** O e-mail, aparado, quando o formulário é enviado com um endereço que o navegador aceita. */
  readonly submitted = output<string>();

  private readonly gerado = inject(UcamSiteIds).proximo('ucam-site-newsletter');
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  protected readonly id = computed(() => this.fieldId()?.trim() || this.gerado);
  protected readonly nota = computed(() => this.note()?.trim() || null);
  protected readonly idDaNota = computed(() => (this.nota() ? `${this.id()}-nota` : null));
  protected readonly classes = computed(() => classesDe('ucam-site-newsletter', this.inverse() && 'inverse'));

  constructor() {
    // O erro não é anunciado sozinho: o foco no campo faz o leitor de tela ler
    // o rótulo e a mensagem que o descreve. Só roda no navegador.
    afterRenderEffect(() => {
      if (this.state() === 'error') this.campo().nativeElement.focus();
    });
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    if (this.state() === 'sending') return;
    const campo = this.campo().nativeElement;
    const email = campo.value.trim();
    if (!email || !campo.checkValidity()) {
      campo.focus();
      return;
    }
    this.submitted.emit(email);
  }
}
