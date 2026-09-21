import { Overlay, OverlayPositionBuilder, type ConnectedPosition, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewContainerRef,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/menu.json
 *
 * Lista de ações ancorada no botão que a abriu. Recolhe o que é raro ou
 * secundário SEM esconder: o que está no menu continua alcançável por teclado
 * e anunciado por leitor de tela.
 *
 * O GATILHO É UMA DIRETIVA, não conteúdo projetado. Projetar o botão obrigaria
 * o componente a procurar o elemento no DOM para pendurar aria-expanded e o
 * ouvinte — arqueologia que quebra no dia em que alguém envolver o botão num
 * span. Com a diretiva, o ARIA mora no botão de verdade:
 *
 *   <button [ucamMenuTrigger]="acoes">Ações</button>
 *   <ucam-menu #acoes [items]="itens" (escolher)="fazer($event)" />
 */
export interface UcamMenuItem {
  id: string;
  label: string;
  icon?: UcamIconName;
  /** Separa grupos. O separador é decorativo e não recebe foco. */
  separadorAntes?: boolean;
  disabled?: boolean;
  /**
   * Escolha entre alternativas em vez de ação: vira role=menuitemradio com
   * aria-checked, e a marca aparece além da cor (WCAG 1.4.1).
   */
  checked?: boolean;
  /** Ação destrutiva — tinta de perigo, e nunca a primeira do menu. */
  destrutivo?: boolean;
}

const ABAIXO: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];
const ABAIXO_INICIO: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

let seq = 0;

@Component({
  selector: 'ucam-menu',
  exportAs: 'ucamMenu',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-template #painel>
      <div
        class="ucam ucam-menu"
        role="menu"
        [id]="id"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-labelledby]="ariaLabel() ? null : idGatilho()"
        (keydown)="aoTeclar($event)"
      >
        @for (item of items(); track item.id; let i = $index) {
          @if (item.separadorAntes) {
            <hr class="ucam-menu__sep" aria-hidden="true" />
          }
          <button
            #opcao
            type="button"
            class="ucam-menu__item"
            [class.ucam-menu__item--destrutivo]="item.destrutivo"
            [attr.role]="item.checked === undefined ? 'menuitem' : 'menuitemradio'"
            [attr.aria-checked]="item.checked === undefined ? null : item.checked"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            tabindex="-1"
            (click)="escolherItem(item)"
          >
            @if (item.checked !== undefined && !item.icon) {
              <!-- A marca, não só a cor: quem não distingue tinta precisa da
                   forma para saber qual alternativa está valendo. O ícone é
                   renderizado SEMPRE e escondido por visibility — com @if os
                   rótulos das alternativas não escolhidas encostariam na borda
                   e a coluna de texto dançaria conforme a escolha. -->
              <ucam-icon
                name="check"
                size="sm"
                aria-hidden="true"
                [style.visibility]="item.checked ? 'visible' : 'hidden'"
              />
            } @else if (item.icon) {
              <ucam-icon [name]="item.icon" size="sm" aria-hidden="true" />
            }
            <span>{{ item.label }}</span>
            @if (item.checked !== undefined && item.icon) {
              <!-- Escolha COM ícone próprio — o menu da coluna da tabela, onde
                   Crescente e Fixar à esquerda têm desenho. O ícone fica à
                   esquerda como nos itens de ação, e a marca vai para a ponta
                   direita: é o mesmo lugar em que o Trilho A a desenha
                   (.ucam-menu__item[aria-checked="true"]::after). -->
              <ucam-icon
                name="check"
                size="sm"
                aria-hidden="true"
                class="ucam-menu__marca"
                [style.visibility]="item.checked ? 'visible' : 'hidden'"
              />
            }
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: `
    .ucam-menu {
      min-inline-size: 12rem;
      padding: var(--ucam-space-1);
      background: var(--ucam-color-surface-raised);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
      box-shadow: var(--ucam-elevation-overlay);
      color: var(--ucam-color-text-primary);
    }
    .ucam-menu__item {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      inline-size: 100%;
      padding: var(--ucam-space-inset-sm);
      border: 0;
      border-radius: var(--ucam-radius-sm);
      background: none;
      color: inherit;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      text-align: start;
      cursor: pointer;
    }
    .ucam-menu__item:hover:not([aria-disabled='true']),
    .ucam-menu__item:focus-visible {
      background: var(--ucam-color-interaction-hover);
    }
    .ucam-menu__item--destrutivo { color: var(--ucam-color-feedback-danger-foreground); }
    .ucam-menu__item[aria-disabled='true'] {
      color: var(--ucam-color-text-disabled);
      cursor: not-allowed;
    }
    .ucam-menu__sep {
      margin: var(--ucam-space-1) 0;
      border: 0;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
  `,
})
export class UcamMenu {
  readonly items = input.required<readonly UcamMenuItem[]>();
  /**
   * Nome acessível, quando o gatilho é só um ícone. Com gatilho rotulado fica
   * nulo: repetir o rótulo em dois atributos faz o leitor de tela dizer a
   * mesma coisa duas vezes.
   */
  readonly ariaLabel = input<string | null>(null);
  readonly align = input<'start' | 'end'>('end');

  readonly escolher = output<UcamMenuItem>();

  readonly id = `ucam-menu-${++seq}`;
  /** Preenchido pela diretiva de gatilho, para o aria-labelledby do painel. */
  readonly idGatilho = signal<string | null>(null);

  readonly painel = viewChild.required<TemplateRef<unknown>>('painel');
  private readonly opcoes = viewChildren<ElementRef<HTMLButtonElement>>('opcao');

  /** Quem fecha é o gatilho: ele é o dono do overlay e do foco de retorno. */
  readonly pedidoDeFechar = output<{ devolverFoco: boolean }>();

  focarPrimeiro(): void {
    queueMicrotask(() => this.focarIndice(0));
  }

  focarUltimo(): void {
    queueMicrotask(() => this.focarIndice(this.opcoes().length - 1));
  }

  private focarIndice(i: number): void {
    const lista = this.opcoes();
    if (!lista.length) return;
    const n = lista.length;
    lista[((i % n) + n) % n]?.nativeElement.focus();
  }

  private indiceFocado(): number {
    return this.opcoes().findIndex((o) => o.nativeElement === document.activeElement);
  }

  protected escolherItem(item: UcamMenuItem): void {
    if (item.disabled) return;
    this.escolher.emit(item);
    this.pedidoDeFechar.emit({ devolverFoco: true });
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    const atual = this.indiceFocado();
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.focarIndice(atual + 1);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.focarIndice(atual - 1);
        break;
      case 'Home':
        evento.preventDefault();
        this.focarIndice(0);
        break;
      case 'End':
        evento.preventDefault();
        this.focarIndice(this.opcoes().length - 1);
        break;
      case 'Escape':
        // Esc fecha e DEVOLVE o foco ao gatilho. Sem a devolução, a pessoa
        // volta ao começo da página a cada menu que fecha.
        evento.preventDefault();
        evento.stopPropagation();
        this.pedidoDeFechar.emit({ devolverFoco: true });
        break;
      case 'Tab':
        // Tab fecha o menu e segue o fluxo normal da página — não devolve o
        // foco ao gatilho, senão o Tab andaria para trás.
        this.pedidoDeFechar.emit({ devolverFoco: false });
        break;
    }
  }
}

/**
 * O gatilho. Mora no botão de verdade, que é onde aria-expanded precisa estar
 * para o leitor de tela anunciar o estado do menu ao chegar no controle.
 */
@Directive({
  selector: '[ucamMenuTrigger]',
  exportAs: 'ucamMenuTrigger',
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'aberto()',
    '[attr.aria-controls]': 'aberto() ? menu().id : null',
    '[attr.id]': 'id',
    '(click)': 'alternar()',
    '(keydown.arrowdown)': 'abrirNoPrimeiro($event)',
    '(keydown.arrowup)': 'abrirNoUltimo($event)',
  },
})
export class UcamMenuTrigger {
  readonly menu = input.required<UcamMenu>({ alias: 'ucamMenuTrigger' });

  private readonly overlay = inject(Overlay);
  private readonly posicoes = inject(OverlayPositionBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vcr = inject(ViewContainerRef);

  readonly id = `ucam-menu-gatilho-${++seq}`;
  readonly aberto = signal(false);
  private ref?: OverlayRef;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.ref?.dispose());
    queueMicrotask(() => {
      this.menu().idGatilho.set(this.id);
      // A assinatura fica AQUI, não em abrir(): assinar a cada abertura
      // empilharia um ouvinte por vez que o menu abrisse, e no quinto Esc o
      // fechamento rodaria cinco vezes.
      this.menu().pedidoDeFechar.subscribe(({ devolverFoco }) => this.fechar(devolverFoco));
    });
  }

  protected alternar(): void {
    this.aberto() ? this.fechar(true) : this.abrir();
  }

  protected abrirNoPrimeiro(evento: Event): void {
    evento.preventDefault();
    this.abrir();
    this.menu().focarPrimeiro();
  }

  protected abrirNoUltimo(evento: Event): void {
    evento.preventDefault();
    this.abrir();
    this.menu().focarUltimo();
  }

  private abrir(): void {
    if (this.aberto()) return;
    const menu = this.menu();
    const ref = (this.ref ??= this.overlay.create({
      positionStrategy: this.posicoes
        .flexibleConnectedTo(this.host)
        .withPositions(menu.align() === 'start' ? ABAIXO_INICIO : ABAIXO),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      // UM menu aberto por vez: com o backdrop, o clique fora fecha este antes
      // de chegar a qualquer outro gatilho. Dois popovers abertos fazem o
      // clique fora deixar de ter significado único.
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      disposeOnNavigation: true,
    }));

    ref.backdropClick().subscribe(() => this.fechar(false));

    ref.attach(new TemplatePortal(menu.painel(), this.vcr));
    this.aberto.set(true);
  }

  private fechar(devolverFoco: boolean): void {
    if (!this.aberto()) return;
    this.ref?.detach();
    this.aberto.set(false);
    if (devolverFoco) this.host.nativeElement.focus();
  }
}
