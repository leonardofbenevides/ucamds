import { ChangeDetectionStrategy, Component, computed, input, output, signal, ViewEncapsulation } from '@angular/core';

import { UcamButton } from '../button/ucam-button';
import { UcamEmptyState } from '../empty-state/ucam-empty-state';
import { UcamSkeleton } from '../skeleton/ucam-skeleton';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/description-list.json
 *
 * Sem equivalente na base, e de propósito: o problema é nosso. A Análise de
 * Requerimento mostra dado de leitura em campo DESABILITADO — caixa cinza,
 * borda de input e cursor bloqueado para informação que ninguém pretende
 * editar. Aqui o par vira dt/dd de verdade.
 */
export type UcamDescriptionTone = 'default' | 'warning' | 'danger';

/** O mesmo vocabulário da DataTable. Ver description-list.json, state. */
export type UcamDescriptionState = 'idle' | 'loading' | 'empty' | 'error';

export interface UcamDescriptionItem {
  label: string;
  value: string | null;
  /** Só para prazo, e sempre com a palavra dizendo o mesmo (WCAG 1.4.1). */
  tone?: UcamDescriptionTone;
  /** O par ocupa a largura inteira da grade: endereço, justificativa curta. */
  span?: boolean;
  /** Ícone do rótulo, só no layout painel. Decorativo: o significado está no rótulo. */
  icon?: UcamIconName | null;
}

let seq = 0;

/**
 * TETO de colunas, não contagem fixa — e os mesmos nomes do Trilho A.
 *
 * grid-cols-3 é repeat(3, minmax(0, 1fr)): mínimo ZERO, três colunas sempre, e
 * a coluna encolhe até o valor quebrar. Com o piso de 12rem por coluna, painel
 * largo dá exatamente N e painel estreito dá quantas couberem, com os pares
 * que sobram descendo de linha. A regra está em .ucam-descricao--N, espelhada
 * no styles deste componente.
 */
const COLUNAS: Record<string, string> = {
  auto: '',
  '1': 'ucam-descricao--1',
  '2': 'ucam-descricao--2',
  '3': 'ucam-descricao--3',
};

const TINTA: Record<UcamDescriptionTone, string> = {
  default: 'text-foreground',
  warning: 'text-[var(--ucam-color-feedback-warning-foreground)]',
  danger: 'text-[var(--ucam-color-feedback-danger-foreground)]',
};

@Component({
  selector: 'ucam-description-list',
  exportAs: 'ucamDescriptionList',
  imports: [UcamIcon, UcamButton, UcamEmptyState, UcamSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /**
   * display: contents no host.
   *
   * O elemento customizado fica ENTRE quem chama e o dl, e uma caixa a mais
   * ali quebraria a grade de quem nos coloca dentro de um flex ou de outra
   * grade. Com contents o host some da formatação e o dl é quem se arranja —
   * a árvore de acessibilidade continua vendo dl, dt e dd em sequência.
   */
  host: { class: 'contents' },
  template: `
    @if (state() === 'loading' && !items().length) {
      <!-- Sem itens ainda não há rótulo a manter: três linhas de esqueleto. -->
      <div aria-busy="true">
        <ucam-skeleton variant="text" [lines]="3" />
        <span class="sr-only">Carregando</span>
      </div>
    } @else if (state() === 'empty') {
      <ucam-empty-state reason="no-data" size="sm" title="Nenhuma informação cadastrada" />
    } @else if (state() === 'error') {
      <ucam-empty-state reason="error" size="sm" title="Não foi possível carregar as informações">
          <ucam-button variant="secondary" (click)="retry.emit()">Tentar novamente</ucam-button>
        </ucam-empty-state>
    } @else {
    <!-- Em loading com itens, os RÓTULOS ficam e só os valores viram esqueleto:
         o rótulo já diz o que vai chegar, e a grade não salta. -->
    <dl [class]="classes()" [id]="idLista" [attr.aria-busy]="state() === 'loading' ? 'true' : null">
      @for (item of items(); track item.label; let i = $index) {
        <!-- O PAR é o item da grade, não o rótulo e o valor soltos.
             Sem o embrulho, uma grade de três colunas distribui dt, dd, dt, dd
             na ordem do documento: o rótulo de um par cai ao lado do valor do
             outro. O div entre dl e dt/dd é HTML válido desde a 5.2 e não muda
             a associação semântica.

             Além do corte (visibleCount) o par leva o atributo hidden — estado
             legível na marcação, e o que o Trilho A também faz. -->
        <div class="min-w-0" [class.col-span-full]="item.span" [hidden]="escondido(i)">
          @if (painel()) {
            <dt class="ucam-descricao__rotulo">
              @if (item.icon) { <ucam-icon [name]="item.icon" size="sm" class="ucam-descricao__icone" /> }
              {{ item.label }}
            </dt>
            <dd class="ucam-descricao__valor" [class]="tinta(item)">
              @if (state() === 'loading') {
                <ucam-skeleton variant="text" width="8ch" />
              } @else {
                {{ valor(item) }}
              }
            </dd>
          } @else {
            <dt class="text-xs text-muted-foreground mb-0.5">{{ item.label }}</dt>
            <dd class="m-0 text-sm" [class]="tinta(item)">
              @if (state() === 'loading') {
                <ucam-skeleton variant="text" width="8ch" />
              } @else {
                {{ valor(item) }}
              }
            </dd>
          }
        </div>
      }
    </dl>
    @if (state() === 'loading') {
      <span class="sr-only">Carregando</span>
    }
    }
    <!-- "Mostrar todos os N valores": o número é a única pista de QUANTO está
         escondido. Aberto vira "Mostrar menos"; o estado mora no aria-expanded. -->
    @if (state() === 'idle' && temCorte()) {
      <button
        class="ucam-descricao__mais"
        type="button"
        [attr.aria-expanded]="aberto()"
        [attr.aria-controls]="idLista"
        (click)="aberto.set(!aberto())"
      >
        {{ aberto() ? 'Mostrar menos' : 'Mostrar todos os ' + items().length + ' valores' }}
        <ucam-icon name="chevronDown" size="sm" [class]="aberto() ? 'rotate-180' : ''" />
      </button>
    }
  `,
  /**
   * Espelho do bloco .ucam-descricao--painel de tools/build-css.mjs. Só o
   * painel vive aqui: os outros dois layouts continuam em utilitárias.
   */
  styles: `
    /* Espelho de .ucam-descricao e de --1/--2/--3 do tools/build-css.mjs. A
       fatia de cada coluna DESCONTA o vão que a grade aplica: subtrair um
       espaço diferente do que se aplica foi o que fez o Trilho A nunca fechar
       três colunas, e o 1px a mais é a margem contra o arredondamento
       sub-pixel. */
    ucam-description-list .ucam-descricao {
      --ucam-descricao-cols: auto-fit;
      --ucam-descricao-min: 12rem;
      --ucam-descricao-vao: var(--ucam-space-inset-lg);
      display: grid;
      grid-template-columns: repeat(var(--ucam-descricao-cols), minmax(var(--ucam-descricao-min), 1fr));
      gap: var(--ucam-space-stack-md) var(--ucam-descricao-vao);
      margin: 0;
    }
    ucam-description-list .ucam-descricao--1 { --ucam-descricao-cols: 1; }
    ucam-description-list .ucam-descricao--2 { --ucam-descricao-min: max(12rem, calc((100% - 1 * var(--ucam-descricao-vao) - 1px) / 2)); }
    ucam-description-list .ucam-descricao--3 { --ucam-descricao-min: max(12rem, calc((100% - 2 * var(--ucam-descricao-vao) - 1px) / 3)); }
    ucam-description-list .ucam-descricao > div[hidden] { display: none; }

    ucam-description-list .ucam-descricao--painel {
      --ucam-descricao-rotulo: 8.5rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
      margin: 0;
    }
    ucam-description-list .ucam-descricao--painel > div {
      display: grid;
      grid-template-columns: var(--ucam-descricao-rotulo) minmax(0, 1fr);
      gap: var(--ucam-space-inline-sm);
      align-items: center;
      min-block-size: var(--ucam-size-control-sm);
    }
    ucam-description-list .ucam-descricao--painel > div[hidden] { display: none; }
    ucam-description-list .ucam-descricao--painel .ucam-descricao__rotulo {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      margin: 0;
      font-size: var(--ucam-typography-body-sm-font-size);
      color: var(--ucam-color-text-secondary);
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ucam-description-list .ucam-descricao--painel .ucam-descricao__valor {
      margin: 0;
      font-size: var(--ucam-typography-body-sm-font-size);
      min-inline-size: 0;
    }
    ucam-description-list .ucam-descricao__icone { flex: none; color: var(--ucam-color-text-placeholder); }
    ucam-description-list .ucam-descricao__mais {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      margin-block-start: var(--ucam-space-inline-xs);
      background: none;
      border: 0;
      padding: 0;
      min-block-size: var(--ucam-size-control-sm);
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      border-radius: var(--ucam-radius-control-sm);
    }
    ucam-description-list .ucam-descricao__mais:hover { color: var(--ucam-color-text-primary); }
  `,
})
export class UcamDescriptionList {
  readonly items = input.required<UcamDescriptionItem[]>();
  readonly columns = input<'auto' | 1 | 2 | 3>('auto');
  readonly layout = input<'stacked' | 'inline' | 'painel'>('stacked');
  /**
   * Quantos pares ficam à vista antes do "Mostrar todos os N valores". null
   * mostra todos. Só age no layout painel — nos outros a lista é curta e a
   * grade larga, e cortar esconderia dado sem ganhar espaço.
   */
  readonly visibleCount = input<number | null>(null);
  /** idle, loading, empty e error — o vocabulário da DataTable. Ver description-list.json, state. */
  readonly state = input<UcamDescriptionState>('idle');
  /** Pedido de nova carga, do "Tentar novamente" do erro. O componente não busca dados. */
  readonly retry = output<void>();

  protected readonly idLista = `ucam-descricao-${++seq}`;
  protected readonly aberto = signal(false);
  protected readonly painel = computed(() => this.layout() === 'painel');
  protected readonly temCorte = computed(() => {
    const n = this.visibleCount();
    return this.painel() && n !== null && n < this.items().length;
  });

  protected escondido(i: number): boolean {
    const n = this.visibleCount();
    return this.temCorte() && !this.aberto() && n !== null && i >= n;
  }
  /**
   * Travessão, não string vazia: dd em branco não distingue "não informado"
   * de falha de carregamento para quem ouve a página.
   */
  readonly emptyValue = input('—');

  protected valor(item: UcamDescriptionItem): string {
    const v = item.value;
    return v === null || v === undefined || v === '' ? this.emptyValue() : v;
  }

  protected tinta(item: UcamDescriptionItem): string {
    return TINTA[item.tone ?? 'default'];
  }

  protected readonly classes = computed(() => {
    if (this.painel()) return 'ucam-descricao ucam-descricao--painel';
    // 16px entre linhas e 20px entre colunas, como no Trilho A (20/09/2026):
    // com 8px o vão ENTRE pares era quase o de dentro do par, e a grade lia
    // como um bloco de texto em vez de seis itens.
    const base = 'ucam-descricao';
    if (this.layout() === 'inline') {
      // O deitado continua em utilitárias: ele não é grade de colunas, e a
      // base acima só descreve a grade.
      // Deitado: cada par vira uma linha de rótulo e valor. Só serve com
      // rótulos de comprimento parecido — está no limite do contrato.
      return `grid gap-y-4 gap-x-5 m-0 grid-cols-1 [&>div]:grid [&>div]:grid-cols-[max-content_1fr] [&>div]:gap-x-4 [&>div]:items-baseline [&_dt]:mb-0`;
    }
    return `${base} ${COLUNAS[String(this.columns())]}`.trim();
  });
}
