import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/stepper.json
 *
 * Sem equivalente na base. Informa POSIÇÃO numa sequência — onde não há
 * sequência obrigatória, o certo é aba. O Novo Requerimento atual é um bloco
 * de sete campos sem nenhuma indicação de tamanho: quem começa não sabe se
 * falta um campo ou dez.
 */
export type UcamStepState = 'done' | 'current' | 'todo' | 'error';

export interface UcamStepItem {
  label: string;
  state: UcamStepState;
  hint?: string | null;
}

const MARCADOR: Record<UcamStepState, string> = {
  todo: 'bg-card border-[var(--ucam-color-border-default)] text-muted-foreground',
  done: 'bg-[var(--ucam-color-feedback-success-background)] border-[var(--ucam-color-feedback-success-border)] text-[var(--ucam-color-feedback-success-foreground)]',
  current: 'bg-primary border-primary text-primary-foreground',
  error:
    'bg-[var(--ucam-color-feedback-danger-background)] border-[var(--ucam-color-feedback-danger-border)] text-[var(--ucam-color-feedback-danger-foreground)]',
};

const PASSO: Record<UcamStepState, string> = {
  todo: 'text-muted-foreground',
  done: 'text-muted-foreground',
  current: 'text-foreground font-medium',
  error: 'text-[var(--ucam-color-feedback-danger-foreground)]',
};

/** O que o leitor de tela ouve depois do rótulo. */
const SITUACAO: Record<UcamStepState, string> = {
  done: 'concluída',
  current: 'atual',
  todo: 'pendente',
  error: 'com pendência',
};

const MARCADOR_BASE =
  'w-6 h-6 shrink-0 rounded-full inline-flex items-center justify-center border text-xs tabular-nums';

@Component({
  selector: 'ucam-stepper',
  exportAs: 'ucamStepper',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /** Ver o porquê do contents em ucam-description-list. */
  host: { class: 'contents' },
  template: `
    <ol
      class="list-none m-0 p-0 flex items-center"
      [class]="variant() === 'bar' ? 'gap-1' : 'flex-wrap gap-x-2 gap-y-1'"
      [attr.aria-label]="label()"
    >
      @for (p of steps(); track p.label; let i = $index; let ultimo = $last) {
        <li [class]="passoClasses(p)" [attr.aria-current]="p.state === 'current' ? 'step' : null">
          @if (variant() === 'bar') {
            <!-- Faixa sem rótulo visível. O nome continua na árvore de
                 acessibilidade: três tarjas mudas informam que HÁ progresso e
                 escondem qual, que é o defeito do desenho de origem. -->
            <span class="sr-only">{{ p.label }}{{ situacao(p, i) }}</span>
          } @else if (navigable() && p.state === 'done') {
            <!-- Etapa concluída é <button> real. Corrigir o que já se
                 preencheu é o uso mais comum; sem volta, a saída vira
                 recomeçar. Etapa futura NUNCA é clicável: o caminho para a
                 frente passa pela validação. -->
            <button
              type="button"
              class="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-[inherit] text-[inherit] rounded-[var(--ucam-radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
              (click)="stepSelect.emit(i)"
            >
              <span [class]="MARCADOR_BASE + ' ' + marcador(p)"><ucam-icon name="check" size="sm" /></span>
              <span>{{ p.label }}</span>
              <span class="sr-only">{{ situacao(p, i) }}</span>
            </button>
          } @else {
            <span [class]="MARCADOR_BASE + ' ' + marcador(p)">
              @if (p.state === 'done') {
                <ucam-icon name="check" size="sm" />
              } @else if (p.state === 'error') {
                <ucam-icon name="circleAlert" size="sm" />
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span>{{ p.label }}</span>
            @if (p.hint) {
              <!-- O erro fica ancorado na etapa em que mora, com contagem —
                   não numa lista solta no topo depois do envio. -->
              <span class="text-xs">{{ p.hint }}</span>
            }
            <span class="sr-only">{{ situacao(p, i) }}</span>
          }
        </li>
        @if (!ultimo && variant() === 'steps') {
          <li class="flex-1 min-w-4 h-px bg-[var(--ucam-color-border-default)]" aria-hidden="true"></li>
        }
      }
    </ol>
  `,
})
export class UcamStepper {
  readonly steps = input.required<UcamStepItem[]>();
  readonly current = input.required<number>();
  readonly label = input.required<string>();
  readonly variant = input<'steps' | 'bar'>('steps');
  readonly navigable = input(false, { transform: booleanAttribute });

  readonly stepSelect = output<number>();

  protected readonly MARCADOR_BASE = MARCADOR_BASE;
  protected readonly total = computed(() => this.steps().length);

  protected marcador(p: UcamStepItem) {
    return MARCADOR[p.state];
  }

  protected passoClasses(p: UcamStepItem) {
    if (this.variant() === 'bar') {
      const cheio = p.state === 'done' || p.state === 'current' ? 'bg-primary' : 'bg-muted';
      return `flex-1 h-1 rounded-full ${cheio}`;
    }
    return `flex items-center gap-1 text-sm ${PASSO[p.state]}`;
  }

  /**
   * ", etapa 2 de 3, com pendência: 2 campos obrigatórios" — a situação em
   * palavra, para não depender do ícone nem da cor (WCAG 1.4.1). Começa por
   * vírgula porque emenda no rótulo visível, que já está na leitura.
   */
  protected situacao(p: UcamStepItem, i: number) {
    const base = `, etapa ${i + 1} de ${this.total()}, ${SITUACAO[p.state]}`;
    return p.hint ? `${base}: ${p.hint}` : base;
  }
}
