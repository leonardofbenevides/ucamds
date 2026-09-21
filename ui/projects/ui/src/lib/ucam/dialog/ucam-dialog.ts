import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/dialog.json
 *
 * SOBRE O <dialog> NATIVO, com showModal — e não sobre o overlay do CDK nem
 * sobre o z-dialog da base. O contrato é explícito e o motivo é bom: o nativo
 * entrega retenção de foco, `inert` no restante da página e fechamento por Esc
 * de graça, e CORRETO. Toda reimplementação disso erra alguma coisa; o parque
 * legado erra as três.
 *
 * O que sobra para o wrapper é o que o nativo não faz:
 *  - fechar ao clicar no fundo (o `::backdrop` não recebe evento próprio: o
 *    clique chega ao <dialog>, e o que distingue é o retângulo do conteúdo);
 *  - o foco inicial no lugar certo — e, no destrutivo, LONGE do botão que
 *    destrói;
 *  - devolver o foco ao gatilho ao fechar, que o nativo só faz quando o
 *    gatilho continua no DOM;
 *  - aria-labelledby ligado ao título, que é erro de build quando falta.
 */
export type UcamDialogSize = 'sm' | 'md' | 'lg';
export type UcamDialogVariant = 'default' | 'confirm' | 'destructive';

let seq = 0;

@Component({
  selector: 'ucam-dialog',
  exportAs: 'ucamDialog',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <dialog
      #caixa
      [class]="classes()"
      [attr.aria-labelledby]="idTitulo"
      [attr.aria-busy]="loading() ? 'true' : null"
      (close)="aoFechar()"
      (cancel)="aoCancelar($event)"
      (click)="aoClicarNoFundo($event)"
    >
      <div class="ucam-dialog__header">
        <h2 class="ucam-dialog__title" [id]="idTitulo">{{ title() }}</h2>
        @if (dismissible()) {
          <!-- Nome acessível "Fechar", não o glifo ×, que é lido como
               multiplicação por parte dos leitores de tela. -->
          <button
            type="button"
            class="ucam-dialog__fechar"
            aria-label="Fechar"
            [attr.aria-disabled]="loading() ? 'true' : null"
            (click)="fechar()"
          >
            <ucam-icon name="x" size="sm" aria-hidden="true" />
          </button>
        }
      </div>

      <div class="ucam-dialog__body">
        <ng-content />
      </div>

      <!-- Ação secundária ANTES da primária, no DOM e na tela: a ordem de
           leitura e a ordem de tabulação são a mesma coisa aqui. -->
      <div class="ucam-dialog__footer">
        <ng-content select="[ucamDialogAcoes]" />
      </div>
    </dialog>
  `,
  styles: `
    ucam-dialog .ucam-dialog {
      background: var(--ucam-color-surface-raised);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
      max-block-size: min(40rem, 90vh);
      display: flex;
      flex-direction: column;
      padding: 0;
      color: var(--ucam-color-text-primary);
    }
    /* Sempre com teto de 100vw menos margem: o diálogo continua utilizável em
       320px e com zoom de 200% (WCAG 1.4.10). */
    ucam-dialog .ucam-dialog--sm { inline-size: min(25rem, calc(100vw - 2rem)); }
    ucam-dialog .ucam-dialog--md { inline-size: min(35rem, calc(100vw - 2rem)); }
    ucam-dialog .ucam-dialog--lg { inline-size: min(47.5rem, calc(100vw - 2rem)); }

    ucam-dialog .ucam-dialog[open] {
      animation: ucam-dialog-surgir var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-entrance);
    }
    @keyframes ucam-dialog-surgir {
      from {
        opacity: 0;
        scale: 0.97;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      ucam-dialog .ucam-dialog[open] { animation: none; }
    }

    ucam-dialog .ucam-dialog::backdrop {
      background: color-mix(in srgb, var(--ucam-color-surface-inverse) 45%, transparent);
    }

    ucam-dialog .ucam-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ucam-space-inline-md);
      padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    ucam-dialog .ucam-dialog__title {
      font-size: var(--ucam-typography-section-title-font-size);
      font-weight: var(--ucam-typography-section-title-font-weight);
      margin: 0;
    }
    ucam-dialog .ucam-dialog__fechar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.75rem;
      block-size: 1.75rem;
      border: 0;
      border-radius: var(--ucam-radius-sm);
      background: none;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
    }
    ucam-dialog .ucam-dialog__fechar:hover {
      background: var(--ucam-color-action-secondary-hover);
      color: var(--ucam-color-text-primary);
    }

    ucam-dialog .ucam-dialog__body {
      padding: var(--ucam-space-inset-lg);
      overflow-y: auto;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      scrollbar-color: var(--ucam-color-border-default) transparent;
    }
    ucam-dialog .ucam-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--ucam-space-inline-sm);
      padding: var(--ucam-space-inset-md) var(--ucam-space-inset-lg);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    ucam-dialog .ucam-dialog__footer:empty { display: none; }
    ucam-dialog .ucam-dialog__fechar[aria-disabled='true'] {
      color: var(--ucam-color-text-disabled);
      cursor: not-allowed;
    }
  `,
})
export class UcamDialog {
  readonly title = input.required<string>();
  readonly size = input<UcamDialogSize>('md');
  readonly variant = input<UcamDialogVariant>('default');
  /**
   * Só desligar quando houver perda de dado — e nesse caso oferecer
   * confirmação, nunca prender a pessoa sem saída.
   */
  readonly dismissible = input(true);
  /**
   * A ação do rodapé em curso. Enquanto dura, o diálogo não fecha por Esc,
   * fundo nem ×: fechar no meio esconde o resultado da operação. O indicador
   * é do botão primário, não daqui. Ver dialog.json.
   */
  readonly loading = input(false);
  /** Seletor do elemento que recebe foco ao abrir. */
  readonly initialFocus = input<string | null>(null);
  /** Two-way: [(open)]. Chama showModal/close no elemento nativo. */
  readonly open = model.required<boolean>();

  readonly closed = output<void>();

  private readonly caixa = viewChild.required<ElementRef<HTMLDialogElement>>('caixa');
  /** O que tinha o foco antes de abrir, para devolvê-lo ao fechar. */
  private gatilho: HTMLElement | null = null;

  protected readonly idTitulo = `ucam-dlg-${++seq}`;
  protected readonly classes = computed(() => `ucam-dialog ucam-dialog--${this.size()}`);

  constructor() {
    afterRenderEffect(() => {
      const el = this.caixa().nativeElement;
      const aberto = this.open();

      if (aberto && !el.open) {
        this.gatilho = document.activeElement as HTMLElement | null;
        el.showModal();
        this.focarInicial(el);
      } else if (!aberto && el.open) {
        el.close();
      }
    });
  }

  /**
   * O foco inicial. No DESTRUTIVO ele nunca cai na ação que destrói: o
   * contrato exige isso, e a razão é que Enter é a primeira tecla de quem está
   * apressado. Sem seletor explícito, o foco vai para o primeiro focável que
   * NÃO seja a ação primária do rodapé.
   */
  private focarInicial(el: HTMLDialogElement): void {
    const seletor = this.initialFocus();
    if (seletor) {
      const alvo = el.querySelector<HTMLElement>(seletor);
      if (alvo) {
        alvo.focus();
        return;
      }
      if (ngDevMode) {
        console.warn(`[ucam-dialog] initialFocus="${seletor}" não casou com nada dentro do diálogo.`);
      }
    }

    if (this.variant() === 'destructive') {
      // O botão de fechar é o alvo seguro: existe sempre que dismissible, e
      // não executa nada. Sem ele, o corpo do diálogo recebe o foco.
      const seguro =
        el.querySelector<HTMLElement>('.ucam-dialog__fechar') ??
        el.querySelector<HTMLElement>('.ucam-dialog__body');
      seguro?.focus();
      return;
    }

    // Sem regra própria, o nativo já foca o primeiro elemento focável.
  }

  protected fechar(): void {
    if (this.loading()) return;
    this.caixa().nativeElement.close();
  }

  /**
   * O `cancel` é o Esc. Quando não se pode dispensar, ele é impedido — mas o
   * diálogo não vira armadilha: quem chegou aqui com dado não salvo tem o
   * botão de confirmação na tela, e é a aplicação que decide.
   */
  protected aoCancelar(evento: Event): void {
    if (!this.dismissible() || this.loading()) evento.preventDefault();
  }

  /**
   * O ::backdrop não recebe evento próprio: o clique nele chega ao <dialog>.
   * O que distingue fundo de conteúdo é o retângulo — se o ponto do clique
   * está fora da caixa, foi no fundo.
   */
  protected aoClicarNoFundo(evento: MouseEvent): void {
    if (!this.dismissible() || this.loading()) return;
    const el = this.caixa().nativeElement;
    if (evento.target !== el) return;
    const r = el.getBoundingClientRect();
    const dentro =
      evento.clientX >= r.left &&
      evento.clientX <= r.right &&
      evento.clientY >= r.top &&
      evento.clientY <= r.bottom;
    if (!dentro) el.close();
  }

  protected aoFechar(): void {
    this.open.set(false);
    this.closed.emit();
    // O nativo devolve o foco ao gatilho só enquanto ele continua no DOM. Numa
    // linha de tabela que sumiu depois de excluída, o foco cairia no <body> e
    // a pessoa voltaria ao topo da página.
    if (this.gatilho?.isConnected) this.gatilho.focus();
    this.gatilho = null;
  }
}

declare const ngDevMode: boolean;
