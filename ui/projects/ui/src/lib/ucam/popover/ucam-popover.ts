import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

export type UcamPopoverPlacement = 'bottom-start' | 'bottom-end';

let seq = 0;

/**
 * Contrato: spec/components/popover.json (ADR-074)
 *
 * Uma caixa pequena ancorada num botão, com coisas que se OPERAM: filtros,
 * colunas visíveis, uma explicação com link. Usa o atributo popover NATIVO,
 * como o Trilho A: a camada de cima, o Esc, o clique fora e "um aberto por
 * vez" vêm do navegador. O que o componente acrescenta é o que o nativo não
 * tem — a posição junto do gatilho (virando para cima quando falta lugar), o
 * aria-expanded do gatilho em dia e o foco no primeiro controle ao abrir.
 *
 * O gatilho é projetado com [popoverTrigger]; o rodapé de ações, com
 * [popoverFooter]. Abre por CLIQUE, nunca por hover: o ponteiro sai do gatilho
 * a caminho do conteúdo e o hover fecharia no meio do caminho.
 */
@Component({
  selector: 'ucam-popover',
  exportAs: 'ucamPopover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'inline-block' },
  template: `
    <ng-content select="[popoverTrigger]" />
    <div
      #caixa
      class="ucam-popover"
      popover="auto"
      role="dialog"
      [id]="id"
      [attr.aria-label]="showTitle() ? null : label()"
      [attr.aria-labelledby]="showTitle() ? id + '-titulo' : null"
      (toggle)="aoAlternar($event)"
    >
      @if (showTitle()) {
        <h2 class="ucam-popover__titulo" [id]="id + '-titulo'">{{ label() }}</h2>
      }
      <div class="ucam-popover__corpo"><ng-content /></div>
      <div class="ucam-popover__pe"><ng-content select="[popoverFooter]" /></div>
    </div>
  `,
  styles: `
    ucam-popover .ucam-popover {
      position: fixed;
      inset: auto;
      margin: 0;
      inline-size: max-content;
      max-inline-size: min(22rem, calc(100vw - 2rem));
      padding: var(--ucam-space-inset-md);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
      font-size: var(--ucam-typography-body-sm-font-size);
    }
    ucam-popover .ucam-popover__titulo {
      margin: 0 0 var(--ucam-space-inline-sm);
      font-size: var(--ucam-typography-body-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
    }
    ucam-popover .ucam-popover__corpo { display: grid; gap: var(--ucam-space-inline-sm); }
    ucam-popover .ucam-popover__pe {
      display: flex;
      justify-content: flex-end;
      gap: var(--ucam-space-inline-xs);
      margin-block-start: var(--ucam-space-inline-sm);
      padding-block-start: var(--ucam-space-inline-sm);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    ucam-popover .ucam-popover__pe:empty { display: none; }
  `,
})
export class UcamPopover {
  /** Nome do diálogo; também é o título visível quando showTitle. */
  readonly label = input.required<string>();
  readonly showTitle = input(true, { transform: booleanAttribute });
  readonly open = model(false);
  readonly placement = input<UcamPopoverPlacement>('bottom-start');

  readonly id = `ucam-popover-${++seq}`;
  private readonly caixa = viewChild.required<ElementRef<HTMLElement>>('caixa');
  /** O elemento focável do gatilho — o <button> de dentro, se o gatilho for um componente. */
  gatilho: HTMLElement | null = null;

  constructor() {
    // open → popover nativo. O caminho de volta (Esc, clique fora) é o toggle.
    // afterRenderEffect, e não effect: só roda no navegador. No prerender o
    // DOM é o do servidor, que não conhece :popover-open nem showPopover.
    afterRenderEffect(() => {
      const el = this.caixa().nativeElement as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
      if (typeof el.showPopover !== 'function') return;
      const aberto = el.matches(':popover-open');
      if (this.open() && !aberto) el.showPopover?.();
      if (!this.open() && aberto) el.hidePopover?.();
    });
    afterRenderEffect(() => {
      const aberto = this.open();
      this.gatilho?.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    // Na camada de cima (fixed) o popover não acompanha a rolagem: reposiciona.
    if (typeof window !== 'undefined') {
      const rolou = () => { if (this.open()) this.posicionar(); };
      window.addEventListener('scroll', rolou, { capture: true, passive: true });
      inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', rolou, { capture: true }));
    }
  }

  toggle(): void {
    this.open.set(!this.open());
  }

  protected aoAlternar(e: Event): void {
    const aberto = (e as Event & { newState?: string }).newState === 'open';
    if (aberto) {
      this.posicionar();
      const primeiro = this.caixa().nativeElement.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      primeiro?.focus();
    } else if (this.gatilho && (this.caixa().nativeElement.contains(document.activeElement) || document.activeElement === document.body)) {
      this.gatilho.focus();
    }
    if (aberto !== this.open()) this.open.set(aberto);
  }

  private posicionar(): void {
    const p = this.caixa().nativeElement;
    const g = this.gatilho;
    if (!g) return;
    const r = g.getBoundingClientRect();
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    let x = this.placement() === 'bottom-end' ? r.right - w : r.left;
    let y = r.bottom + 4;
    if (y + h > innerHeight - 8 && r.top - h - 4 > 8) y = r.top - h - 4;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
  }
}

/**
 * O gatilho. Vale num <button> e num componente que tenha um <button> dentro
 * (<ucam-button popoverTrigger>): os atributos ARIA vão para o elemento que
 * recebe foco, não para o hospedeiro.
 */
@Directive({
  selector: '[popoverTrigger]',
  host: { '(click)': 'pop.toggle()' },
})
export class UcamPopoverTrigger {
  protected readonly pop = inject(UcamPopover);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterRenderEffect(() => {
      const h = this.host.nativeElement;
      const alvo = h.matches('button, a') ? h : (h.querySelector<HTMLElement>('button, a') ?? h);
      this.pop.gatilho = alvo;
      alvo.setAttribute('aria-haspopup', 'dialog');
      alvo.setAttribute('aria-controls', this.pop.id);
      alvo.setAttribute('aria-expanded', this.pop.open() ? 'true' : 'false');
    });
  }
}

/** Marca o rodapé de ações do popover. */
@Directive({ selector: '[popoverFooter]' })
export class UcamPopoverFooter {}
