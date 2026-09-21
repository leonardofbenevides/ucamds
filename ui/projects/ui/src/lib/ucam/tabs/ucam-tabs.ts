import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  signal,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Contrato: spec/components/tabs.json
 *
 * Tira de recortes do MESMO conteúdo. Não é navegação entre destinos — isso é
 * a navegação do app-shell — e não é passo de processo, que é o stepper.
 *
 * O z-tabs da base existe, e mesmo assim este é escrito do zero. O motivo é a
 * prop `activation`: a base ativa sempre ao mover o foco, e o contrato exige o
 * modo MANUAL para o caso em que cada recorte dispara uma consulta ao
 * servidor. Sem ele, atravessar cinco abas com a seta dispara cinco
 * requisições — e a caixa de entrada do Protocolo é exatamente esse caso.
 *
 * O painel NÃO é filho deste componente. Ele fica na tela, com [id] e
 * [attr.aria-labelledby] que o componente publica em `idPainel` e `idAba`:
 * embrulhar o painel obrigaria toda tela a renderizar todos os recortes de uma
 * vez, ou a passar templates — e o caso dominante é uma consulta por recorte.
 */
export interface UcamTabItem {
  id: string;
  label: string;
  /**
   * Contagem opcional. Entra no NOME ACESSÍVEL como "4 itens", não entre
   * parênteses: parênteses sozinhos são lidos de formas diferentes por leitor
   * de tela — de "abre parêntese" a silêncio.
   */
  count?: number;
}

let seq = 0;

@Component({
  selector: 'ucam-tabs',
  exportAs: 'ucamTabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <div class="ucam-tabs" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.id; let i = $index) {
        <button
          #aba
          type="button"
          class="ucam-tabs__tab"
          role="tab"
          [id]="idAba(item.id)"
          [attr.aria-selected]="item.id === value()"
          [attr.aria-controls]="idPainel(item.id)"
          [attr.aria-label]="rotuloAcessivel(item)"
          [tabIndex]="item.id === focada() ? 0 : -1"
          (click)="selecionar(item.id)"
          (keydown)="aoTeclar($event, i)"
          (focus)="focada.set(item.id)"
        >
          {{ item.label }}
          @if (item.count !== undefined) {
            <span class="ucam-tabs__contagem" aria-hidden="true">{{ item.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    ucam-tabs .ucam-tabs {
      display: flex;
      gap: var(--ucam-space-inline-md);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
      overflow-x: auto;
      scrollbar-width: none;
    }
    ucam-tabs .ucam-tabs::-webkit-scrollbar { display: none; }

    ucam-tabs .ucam-tabs__tab {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      white-space: nowrap;
      background: none;
      border: 0;
      border-block-end: 2px solid transparent;
      padding: var(--ucam-space-inset-sm) 0;
      margin-block-end: -1px;
      font: inherit;
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
    }
    /* A seleção não é comunicada só pela cor da tinta e do filete —
       aria-selected carrega o estado para quem não vê nenhum dos dois. */
    ucam-tabs .ucam-tabs__tab[aria-selected='true'] {
      color: var(--ucam-color-action-primary-default);
      border-block-end-color: var(--ucam-color-action-primary-default);
    }
    /* A CONTAGEM é número esmaecido ao lado do rótulo — nem parêntese, nem
       pastilha. A cápsula cinza que havia aqui era a terceira superfície numa
       tira que já tem filete e realce, e divergia do Trilho A, que escrevia
       "(9)". Agora os dois desenham o mesmo: tinta secundária, algarismo
       tabular, e sem vestir o bordô na aba escolhida — a tira tem um portador
       de cor por vez. Espelho de .ucam-tabs__contagem em build-css.mjs. */
    ucam-tabs .ucam-tabs__contagem {
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-body-font-weight);
      color: var(--ucam-color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    ucam-tabs .ucam-tabs__tab[aria-selected='true'] .ucam-tabs__contagem {
      color: var(--ucam-color-text-secondary);
    }
  `,
})
export class UcamTabs {
  readonly items = input.required<readonly UcamTabItem[]>();
  /** Two-way: [(value)]. Nunca fica indefinido — tira sem seleção mostra painel vazio. */
  readonly value = model.required<string>();
  /** Nome da tira, para quem navega por marcos. */
  readonly ariaLabel = input.required<string>();
  /**
   * `manual` move o foco e só seleciona no Enter ou Espaço. É o modo
   * OBRIGATÓRIO quando a troca dispara requisição.
   */
  readonly activation = input<'automatic' | 'manual'>('automatic');

  private readonly abas = viewChildren<ElementRef<HTMLButtonElement>>('aba');
  private readonly n = `ucam-tabs-${++seq}`;

  /**
   * Roving tabindex: UMA parada de tabulação na tira inteira. Tab entra e sai;
   * quem anda entre abas é a seta. Sem isto, uma tira de sete recortes obriga
   * sete Tabs para atravessar a página.
   */
  protected readonly focada = signal<string>('');

  constructor() {
    // A aba focável inicial é a selecionada. Quando a seleção muda por fora
    // (um filtro que reseta o recorte), a parada de tabulação acompanha —
    // senão o Tab devolveria o foco a uma aba que já não é a atual.
    queueMicrotask(() => this.focada.set(this.value()));
  }

  protected readonly indiceAtual = computed(() =>
    this.items().findIndex((i) => i.id === this.focada()),
  );

  idAba(id: string): string {
    return `${this.n}-aba-${id}`;
  }

  /** O id que o painel da tela deve carregar, ligado por aria-controls. */
  idPainel(id: string): string {
    return `${this.n}-painel-${id}`;
  }

  protected rotuloAcessivel(item: UcamTabItem): string | null {
    return item.count === undefined
      ? null
      : `${item.label}, ${item.count} ${item.count === 1 ? 'item' : 'itens'}`;
  }

  protected selecionar(id: string): void {
    this.focada.set(id);
    this.value.set(id);
  }

  protected aoTeclar(evento: KeyboardEvent, indice: number): void {
    const total = this.items().length;
    let destino = indice;

    switch (evento.key) {
      case 'ArrowRight':
        destino = (indice + 1) % total;
        break;
      case 'ArrowLeft':
        destino = (indice - 1 + total) % total;
        break;
      case 'Home':
        destino = 0;
        break;
      case 'End':
        destino = total - 1;
        break;
      case 'Enter':
      case ' ':
        // No modo automático a seta já selecionou; aqui o Enter só confirma o
        // que o foco já fez, e repetir é inofensivo.
        evento.preventDefault();
        this.value.set(this.items()[indice].id);
        return;
      default:
        return;
    }

    evento.preventDefault();
    const alvo = this.items()[destino];
    this.focada.set(alvo.id);
    // O foco vai para o elemento ANTES da eventual seleção: no modo manual a
    // seleção não acontece, e o foco tem de ir de qualquer forma.
    this.abas()[destino]?.nativeElement.focus();
    if (this.activation() === 'automatic') this.value.set(alvo.id);
  }
}
