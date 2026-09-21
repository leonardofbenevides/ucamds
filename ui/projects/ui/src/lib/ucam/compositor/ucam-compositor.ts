import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output, ViewEncapsulation } from '@angular/core';

import { UcamButton } from '../button/ucam-button';

let seq = 0;

/**
 * Contrato: spec/components/compositor.json
 *
 * A caixa de escrever a resposta. Sem equivalente na base: é composição
 * nossa, e veste as classes de @ucam/css — como ucam-citacao — porque o
 * desenho é o mesmo do Trilho A e duplicá-lo em utilitárias faria os dois
 * divergirem no primeiro ajuste de filete.
 *
 * O filete, o hover e o anel de foco são do INVÓLUCRO (:focus-within), não do
 * textarea: dois contornos concêntricos a cada clique diriam que há duas
 * peças, e a decisão foi que há uma.
 */
@Component({
  selector: 'ucam-compositor',
  exportAs: 'ucamCompositor',
  imports: [UcamButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <div class="ucam-field">
      <label class="ucam-field__label" [attr.for]="id">{{ label() }}</label>
      <div class="ucam-compositor">
        <textarea
          class="ucam-compositor__campo"
          [id]="id"
          rows="2"
          [value]="value()"
          [attr.placeholder]="placeholder()"
          [attr.aria-describedby]="hint() ? id + '-h' : null"
          [disabled]="disabled()"
          (input)="escreveu($event)"
          (keydown)="tecla($event)"
        ></textarea>
        <div class="ucam-compositor__barra">
          @if (hint()) {
            <!-- A advertência vive ANTES do botão: abaixo dele, ela é lida
                 depois de enviar. -->
            <span class="ucam-compositor__dica" [id]="id + '-h'">{{ hint() }}</span>
          }
          <div class="ucam-compositor__acoes">
            @if (attach()) {
              <ucam-button variant="secondary" size="sm" iconStart="paperclip" [disabled]="disabled()" (click)="attachClick.emit()">
                Anexar
              </ucam-button>
            }
            <ucam-button
              variant="primary"
              size="sm"
              iconStart="send"
              [loading]="busy()"
              [disabled]="disabled()"
              (click)="pedirEnvio()"
            >
              {{ submitLabel() }}
            </ucam-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UcamCompositor {
  readonly label = input.required<string>();
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly submitLabel = input('Enviar');
  readonly attach = input(false, { transform: booleanAttribute });
  /** Envio em curso: o botão entra em loading e o segundo clique não passa. */
  readonly busy = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<string>('');

  /**
   * NÃO se chama submit: output com nome de evento nativo faz o handler do
   * consumidor rodar duas vezes quando o evento borbulha (ADR-018).
   */
  readonly enviar = output<string>();
  readonly attachClick = output<void>();

  protected readonly id = `ucam-comp-${++seq}`;

  protected escreveu(e: Event): void {
    this.value.set((e.target as HTMLTextAreaElement).value);
  }

  /** Ctrl + Enter envia, e isso está escrito na dica — atalho calado não existe. */
  protected tecla(e: KeyboardEvent): void {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.pedirEnvio();
    }
  }

  /**
   * O compositor NÃO limpa o campo: quem consome decide se o envio deu certo.
   * Limpar antes da confirmação já perdeu texto de gente.
   */
  protected pedirEnvio(): void {
    if (this.busy() || this.disabled()) return;
    const texto = this.value().trim();
    if (!texto) return;
    this.enviar.emit(texto);
  }
}
