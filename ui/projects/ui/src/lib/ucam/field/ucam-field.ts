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
  /* Vão de 8px (space.stack-sm) entre rótulo, controle e apoio, como o
   * .ucam-field do Trilho A; era gap-1.5 (6px) e todo formulário em Angular
   * saía 2px mais baixo por campo (paridade, 17/11/2026). */
  host: { class: 'flex flex-col gap-[var(--ucam-space-stack-sm)]' },
  template: `
    @if (!labelHidden()) {
      <!-- Rótulo e apoio nos papéis de tipografia do A (label, caption): com
           leading-tight/snug saíam 18,75 e 19,25px contra 20 e 18, e o campo
           descia 1px por fileira (paridade, 17/11/2026). -->
      <label class="text-[length:var(--ucam-typography-label-font-size)] [font-weight:var(--ucam-typography-label-font-weight)] leading-[var(--ucam-typography-label-line-height)] text-[var(--ucam-color-text-rotulo)]" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) {
          <!-- decorativo: a obrigatoriedade real vai em required/aria-required -->
          <span class="text-primary ms-[0.15em]" aria-hidden="true">*</span>
        }
      </label>
    } @else {
      <label class="sr-only" [attr.for]="controlId()">{{ label() }}</label>
    }

    <ng-content />

    @if (showError()) {
      <!-- role=alert anuncia sem roubar o foco -->
      <p class="text-[length:var(--ucam-typography-caption-font-size)] leading-[var(--ucam-typography-caption-line-height)] text-destructive" [id]="errorId()" role="alert">{{ errorMessage() }}</p>
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
        class="text-[length:var(--ucam-typography-caption-font-size)] leading-[var(--ucam-typography-caption-line-height)] text-muted-foreground"
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
