import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation, booleanAttribute } from '@angular/core';

/**
 * Casca de campo — rótulo persistente, marca de obrigatoriedade, texto de
 * apoio e mensagem de erro.
 *
 * Existe porque a base NÃO tem nada disso: o input da ZardUI é uma diretiva
 * de estilo sobre <input>, sem label, sem hint, sem erro e sem ligação ARIA.
 * Era exatamente a lacuna que produziu "Digite aqui para pesquisar" como
 * rótulo no legado (ADR-004).
 *
 * Os ids vêm de fora: quem projeta o controle é que precisa colocá-los no
 * elemento nativo, então o wrapper gera e distribui.
 */
@Component({
  selector: 'ucam-field',
  exportAs: 'ucamField',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    @if (!labelHidden()) {
      <label class="text-sm font-medium leading-tight text-foreground" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) {
          <!-- decorativo: a obrigatoriedade real vai em required/aria-required -->
          <span class="text-primary" aria-hidden="true">*</span>
        }
      </label>
    } @else {
      <label class="sr-only" [attr.for]="controlId()">{{ label() }}</label>
    }

    <ng-content />

    @if (showError()) {
      <!-- role=alert anuncia sem roubar o foco -->
      <p class="text-xs leading-snug text-destructive" [id]="errorId()" role="alert">{{ errorMessage() }}</p>
    }

    <!--
      O apoio NUNCA sai do DOM: com erro ele apenas deixa de ser visto. Era um
      ramo "senão" do erro, e o describedBy() abaixo continuava citando o hintId — o
      aria-describedby apontava para um id que não existia mais, e o leitor de
      tela perdia o formato esperado exatamente no momento em que o contrato
      manda continuar dizendo qual é (field.json, acessibilidade). Visualmente
      nada muda: a mensagem de erro ocupa o lugar do apoio.
    -->
    @if (hint()) {
      <p
        class="text-xs leading-snug text-muted-foreground"
        [class.sr-only]="showError()"
        [id]="hintId()"
      >{{ hint() }}</p>
    }
  `,
})
export class UcamField {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  readonly controlId = input.required<string>();
  readonly hintId = input.required<string>();
  readonly errorId = input.required<string>();

  protected readonly showError = computed(() => this.invalid() && !!this.errorMessage());
}

/**
 * Contador de ids. Determinístico dentro de um render, o que basta enquanto
 * a biblioteca não for usada em SSR com hidratação.
 */
let seq = 0;
export function nextFieldIds(prefix: string) {
  const base = `${prefix}-${++seq}`;
  return { controlId: base, hintId: `${base}-hint`, errorId: `${base}-error` };
}

/**
 * hint e erro entram JUNTOS em aria-describedby quando ambos existem — o
 * contrato pede que a pessoa continue ouvindo o formato esperado mesmo
 * depois de errar.
 */
export function describedBy(ids: { hintId: string; errorId: string }, hasHint: boolean, hasError: boolean): string | null {
  const parts = [hasError ? ids.errorId : null, hasHint ? ids.hintId : null].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}
