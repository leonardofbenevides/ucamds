import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injectable,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/toast.json (ADR-052, ADR-074)
 *
 * A confirmação que aparece no canto e some. Fecha a pendência que a ADR-052
 * deixou escrita — "o Trilho B ainda não o tem" — com o mesmo desenho e as
 * mesmas regras do toastScript do Trilho A:
 *
 *  - some em 5 s e PARA enquanto o ponteiro ou o foco estão nele (WCAG 2.2.1);
 *  - no máximo três na pilha (um no telefone, pela variável da folha); o que
 *    sai é o mais antigo, e sai na hora;
 *  - não rouba foco e não é região viva. A frase é dita pela região de anúncio
 *    do shell ([data-anuncio]); sem shell na página, por uma região própria e
 *    invisível do toaster, para ninguém ficar sem a confirmação.
 *
 * NUNCA a única cópia do que a pessoa vai usar depois: o número do protocolo
 * gerado vai num UcamAlert ancorado, e o toast pode sair junto.
 */
export type UcamToastTone = 'success' | 'info' | 'warning' | 'danger';

export interface UcamToastOptions {
  tone?: UcamToastTone;
  /** Milissegundos. Padrão 5000. */
  duration?: number;
}

export interface UcamToastItem {
  id: number;
  message: string;
  tone: UcamToastTone;
  duration: number;
  saindo: boolean;
}

const ICONE: Record<UcamToastTone, UcamIconName> = {
  success: 'circleCheck',
  info: 'info',
  warning: 'triangleAlert',
  danger: 'circleAlert',
};

@Injectable({ providedIn: 'root' })
export class UcamToastService {
  private seq = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = signal<UcamToastItem[]>([]);
  /** O que a região própria do toaster fala quando a página não tem shell. */
  readonly fala = signal('');
  /** Quantos cabem — o toaster lê da folha (--ucam-toasts-max). */
  max = 3;

  show(message: string, opcoes: UcamToastOptions = {}): number {
    if (!message) return -1;
    const item: UcamToastItem = {
      id: ++this.seq,
      message,
      tone: opcoes.tone ?? 'success',
      duration: opcoes.duration ?? 5000,
      saindo: false,
    };
    const vivos = this.toasts().filter((t) => !t.saindo);
    const sobra = vivos.length - this.max + 1;
    const fora = new Set(vivos.slice(0, Math.max(0, sobra)).map((t) => t.id));
    fora.forEach((id) => this.limpa(id));
    this.toasts.update((l) => [...l.filter((t) => !fora.has(t.id)), item]);
    this.anuncia(message);
    this.arma(item.id);
    return item.id;
  }

  dismiss(id: number): void {
    this.limpa(id);
    this.toasts.update((l) => l.map((t) => (t.id === id ? { ...t, saindo: true } : t)));
    setTimeout(() => this.toasts.update((l) => l.filter((t) => t.id !== id)), 160);
  }

  pausa(id: number): void {
    this.limpa(id);
  }

  arma(id: number): void {
    const t = this.toasts().find((x) => x.id === id);
    if (!t) return;
    this.limpa(id);
    this.timers.set(id, setTimeout(() => this.dismiss(id), t.duration));
  }

  private limpa(id: number): void {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
  }

  /** Esvazia antes de escrever: a mesma frase repetida sem limpar não é anunciada. */
  private anuncia(texto: string): void {
    const regiao = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-anuncio]') : null;
    if (regiao) {
      regiao.textContent = '';
      setTimeout(() => (regiao.textContent = texto), 60);
      return;
    }
    this.fala.set('');
    setTimeout(() => this.fala.set(texto), 60);
  }
}

/**
 * A pilha. Uma vez na raiz da aplicação: <ucam-toaster />.
 */
@Component({
  selector: 'ucam-toaster',
  exportAs: 'ucamToaster',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ucam-toasts">
      @for (t of servico.toasts(); track t.id) {
        <div
          class="ucam-toast"
          [class.ucam-toast--warning]="t.tone === 'warning'"
          [class.ucam-toast--danger]="t.tone === 'danger'"
          [attr.data-saindo]="t.saindo ? '' : null"
          (mouseenter)="servico.pausa(t.id)"
          (focusin)="servico.pausa(t.id)"
          (mouseleave)="retoma(t.id, $event)"
          (focusout)="retoma(t.id, $event)"
        >
          <ucam-icon [name]="icone[t.tone]" size="sm" />
          <span class="ucam-toast__texto">{{ t.message }}</span>
          <button
            class="ucam-toast__fechar"
            type="button"
            [attr.aria-label]="t.tone === 'danger' || t.tone === 'warning' ? 'Fechar aviso' : 'Fechar confirmação'"
            (click)="servico.dismiss(t.id)"
          >
            <ucam-icon name="x" size="sm" />
          </button>
        </div>
      }
    </div>
    <p class="sr-only" role="status">{{ servico.fala() }}</p>
  `,
  styles: `
    ucam-toaster .ucam-toasts {
      --ucam-toasts-max: 3;
      position: fixed;
      inset-block-end: var(--ucam-space-inset-lg);
      inset-inline-end: var(--ucam-space-inset-lg);
      z-index: calc(var(--ucam-z-overlay) + 10);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--ucam-space-inline-sm);
      max-inline-size: min(26rem, calc(100vw - 2 * var(--ucam-space-inset-lg)));
      pointer-events: none;
    }
    ucam-toaster .ucam-toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      min-block-size: 2.75rem;
      padding: var(--ucam-space-inline-xs) var(--ucam-space-inline-xs) var(--ucam-space-inline-xs) var(--ucam-space-inset-sm);
      background: var(--ucam-color-surface-inverse);
      color: var(--ucam-color-text-on-brand);
      border-radius: var(--ucam-radius-control);
      box-shadow: var(--ucam-elevation-overlay);
      font-size: var(--ucam-typography-body-sm-font-size);
      line-height: 1.25rem;
      animation: ucam-toast-entra var(--ucam-motion-duration-reveal) var(--ucam-motion-easing-entrance) both;
    }
    ucam-toaster .ucam-toast[data-saindo] { animation: ucam-toast-sai var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard) both; }
    ucam-toaster .ucam-toast__texto { flex: 1 1 auto; min-inline-size: 0; }
    ucam-toaster .ucam-toast__fechar {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: var(--ucam-size-control-md);
      block-size: var(--ucam-size-control-md);
      padding: 0;
      border: 0;
      border-radius: var(--ucam-radius-control-sm);
      background: none;
      color: inherit;
      opacity: 0.72;
      cursor: pointer;
    }
    ucam-toaster .ucam-toast__fechar:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
    ucam-toaster .ucam-toast__fechar:focus-visible {
      opacity: 1;
      outline: var(--ucam-focus-ring-width) solid currentColor;
      outline-offset: calc(-1 * var(--ucam-focus-ring-width));
    }
    ucam-toaster .ucam-toast--danger,
    ucam-toaster .ucam-toast--warning { box-shadow: var(--ucam-elevation-overlay), inset 0 0 0 1px var(--ucam-toast-borda); }
    ucam-toaster .ucam-toast--danger {
      --ucam-toast-borda: var(--ucam-color-feedback-danger-border);
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    ucam-toaster .ucam-toast--danger > ucam-icon:first-child { color: var(--ucam-color-feedback-danger-graphic); }
    ucam-toaster .ucam-toast--warning {
      --ucam-toast-borda: var(--ucam-color-feedback-warning-border);
      background: var(--ucam-color-feedback-warning-background);
      color: var(--ucam-color-feedback-warning-foreground);
    }
    ucam-toaster .ucam-toast--warning > ucam-icon:first-child { color: var(--ucam-color-feedback-warning-graphic); }
    @keyframes ucam-toast-entra { from { opacity: 0; transform: translateY(0.5rem); } }
    @keyframes ucam-toast-sai { to { opacity: 0; transform: translateY(0.25rem); } }
    @media (prefers-reduced-motion: reduce) {
      ucam-toaster .ucam-toast, ucam-toaster .ucam-toast[data-saindo] { animation: none; }
    }
    @media (max-width: 40rem) {
      ucam-toaster .ucam-toasts {
        --ucam-toasts-max: 1;
        inset-inline: var(--ucam-space-inset-md);
        inset-block-end: var(--ucam-space-inset-md);
        max-inline-size: none;
        align-items: stretch;
      }
    }
  `,
})
export class UcamToaster {
  protected readonly servico = inject(UcamToastService);
  protected readonly icone = ICONE;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Quantos cabem é papel de viewport, e papel mora na folha: lê a variável.
    if (typeof window !== 'undefined') {
      const ler = () => {
        const pilha = this.host.nativeElement.querySelector('.ucam-toasts');
        const n = pilha ? parseInt(getComputedStyle(pilha).getPropertyValue('--ucam-toasts-max'), 10) : NaN;
        this.servico.max = n > 0 ? n : 3;
      };
      queueMicrotask(ler);
      window.addEventListener('resize', ler, { passive: true });
    }
  }

  protected retoma(id: number, e: Event): void {
    const el = e.currentTarget as HTMLElement;
    if (!el.matches(':hover, :focus-within')) this.servico.arma(id);
  }
}
