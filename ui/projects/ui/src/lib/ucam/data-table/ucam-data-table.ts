import {
  contentChildren,
  ChangeDetectionStrategy,
  DestroyRef,
  Component,
  computed,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamBadge, type UcamBadgeTone } from '../badge/ucam-badge';
import { UcamMenu, UcamMenuTrigger, type UcamMenuItem } from '../menu/ucam-menu';

/**
 * Contrato: spec/components/data-table.json
 *
 * O componente de maior superfície do sistema — e o que mais aparece nos
 * módulos do portal. Aparece em 5 das 11 telas do design system e, até agora,
 * não existia em Angular: as listagens só existiam em CSS puro.
 *
 * TABELA SEMÂNTICA, sempre: table, thead, tbody, th com scope. Nunca div com
 * role=table quando o dado é tabular. O legado usa div em três das cinco
 * listagens, e é por isso que nenhuma delas é navegável por comando de tabela
 * no leitor de tela.
 */
export type UcamColumnType = 'text' | 'number' | 'date' | 'currency' | 'status' | 'actions';
export type UcamTableState = 'idle' | 'loading' | 'error' | 'empty';
export type UcamTableResponsive = 'scroll' | 'stack' | 'priority';

export interface UcamColumnDef {
  /** Chave no objeto da linha. */
  key: string;
  /** Rótulo em CAIXA NATURAL. O legado usa caixa alta — ver ADR-003. */
  header: string;
  type?: UcamColumnType;
  width?: 'auto' | 'min' | number;
  sortable?: boolean;
  /**
   * Usado por responsive=priority: colunas de menor prioridade somem primeiro.
   * A coluna identificadora precisa ter a MAIOR prioridade — some por último,
   * porque sem ela a linha deixa de ser identificável.
   */
  priority?: number;
  align?: 'start' | 'end' | 'center';
  /**
   * O texto que a célula mostra quando não há valor. Nenhuma célula fica muda:
   * o travessão sozinho é anunciado como "traço", como "menos" ou como nada,
   * conforme o leitor de tela — e quem ouve a tabela não recebe a informação
   * que quem vê recebe (WCAG 1.3.1).
   */
  vazio?: string;
  /**
   * Se o menu da coluna oferece "Ocultar coluna". A identificadora nunca
   * oculta, qualquer que seja o valor: o item aparece desabilitado.
   */
  hideable?: boolean;
}

/** Lado em que uma coluna está fixa. Uma coluna por lado. */
export type UcamPinSide = 'start' | 'end';

export interface UcamSort {
  column: string;
  direction: 'asc' | 'desc';
}

/** Valor de uma célula type=status: o selo precisa do tom E da palavra. */
export interface UcamCellStatus {
  label: string;
  tone: UcamBadgeTone;
}

/**
 * Molde de célula por coluna. É a saída para o que os dados não descrevem —
 * a coluna de ações, o link da célula identificadora, um valor composto:
 *
 *   <ng-template ucamCelula="acoes" let-linha>…</ng-template>
 */
@Directive({ selector: 'ng-template[ucamCelula]' })
export class UcamCelula {
  readonly coluna = input.required<string>({ alias: 'ucamCelula' });
  readonly molde = inject<TemplateRef<unknown>>(TemplateRef);
}

const ALINHAMENTO: Record<UcamColumnType, 'start' | 'end' | 'center'> = {
  text: 'start',
  number: 'end',
  currency: 'end',
  // Data alinha ao INÍCIO: em pt-BR o dia vem primeiro e é por ele que se
  // varre a coluna. Alinhar ao fim colocaria o ano na prumada.
  date: 'start',
  status: 'start',
  actions: 'end',
};

@Component({
  selector: 'ucam-data-table',
  exportAs: 'ucamDataTable',
  imports: [NgTemplateOutlet, UcamIcon, UcamBadge, UcamMenu, UcamMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-data-table-host' },
  template: `
    <!-- A contagem é região viva POLITE, nunca assertive: assertive
         interromperia a digitação na busca que filtra a própria tabela. -->
    <p class="ucam-sr-only" aria-live="polite">{{ resumo() }}</p>

    <!-- Colunas ocultas: ocultar sem caminho de volta é apagar. A barra só
         existe enquanto houver o que mostrar. -->
    @if (hidden().length) {
      <div class="ucam-table__ocultas">
        <span role="status">{{ hidden().length }} {{ hidden().length === 1 ? 'coluna oculta' : 'colunas ocultas' }}</span>
        <button type="button" class="ucam-table__reexibir" (click)="hidden.set([])">Mostrar</button>
      </div>
    }

    <!-- O contêiner de rolagem é focável e é uma região com nome: sem isso,
         quem usa só o teclado não consegue rolar a tabela na horizontal
         (WCAG 2.1.1). -->
    <div
      #caixa
      [class]="classesCaixa()"
      [attr.role]="responsive() === 'scroll' ? 'region' : null"
      [attr.tabindex]="responsive() === 'scroll' ? 0 : null"
      [attr.aria-label]="responsive() === 'scroll' ? caption() : null"
      [attr.aria-busy]="state() === 'loading' ? 'true' : null"
    >
      <table [class]="classesTabela()">
        <caption class="ucam-sr-only">
          {{ caption() }}
        </caption>
        <thead>
          <tr>
            @if (selectable() === 'multiple') {
              <th scope="col" class="ucam-table__sel" [class.ucam-col--fixa-inicio]="temFixa('start')">
                <input
                  type="checkbox"
                  [checked]="todasMarcadas()"
                  [indeterminate]="parcialmenteMarcadas()"
                  aria-label="Selecionar todas as linhas desta página"
                  (change)="alternarTodas($event)"
                />
              </th>
            } @else if (selectable() === 'single') {
              <th scope="col" class="ucam-table__sel" [class.ucam-col--fixa-inicio]="temFixa('start')"><span class="ucam-sr-only">Seleção</span></th>
            }

            @for (col of colunasVisiveis(); track col.key) {
              <th
                scope="col"
                [style.text-align]="alinhamento(col)"
                [attr.aria-sort]="ariaSort(col)"
                [class.ucam-table__col-min]="col.width === 'min'"
                [class.ucam-col--fixa-inicio]="ladoFixo(col) === 'start'"
                [class.ucam-col--fixa-fim]="ladoFixo(col) === 'end'"
                [style.--ucam-col-x]="deslocamento(col)"
              >
                @if (columnMenu()) {
                  <!-- O cabeçalho ABRE o menu da coluna (contrato data-table,
                       column-menu). O indicador fica sempre visível: é ele que
                       diz qual coluna governa a ordem sem abrir nada. -->
                  <button type="button" class="ucam-table__coluna" [ucamMenuTrigger]="menuCol">
                    {{ col.header }}
                    <ucam-icon [name]="iconeColuna(col)" size="sm" aria-hidden="true" />
                  </button>
                  <ucam-menu #menuCol [items]="itensColuna(col)" align="start" (escolher)="agirColuna(col, $event)" />
                } @else if (col.sortable) {
                  <button type="button" class="ucam-table__ordenar" [attr.aria-label]="rotuloOrdenar(col)" (click)="ordenarPor(col)">
                    {{ col.header }}
                    <ucam-icon [name]="iconeOrdem(col)" size="sm" aria-hidden="true" [style.visibility]="sort()?.column === col.key ? 'visible' : 'hidden'" />
                  </button>
                } @else {
                  {{ col.header }}
                }
              </th>
            }
          </tr>
        </thead>

        <tbody>
          @if (state() === 'idle' || state() === 'loading') {
            @for (linha of rows(); track $index) {
              <tr
                [class.ucam-table__linha--marcada]="marcadas().has(linha)"
                [attr.aria-selected]="selectable() === 'none' ? null : marcadas().has(linha)"
              >
                @if (selectable() !== 'none') {
                  <td class="ucam-table__sel" [class.ucam-col--fixa-inicio]="temFixa('start')">
                    <input
                      [type]="selectable() === 'single' ? 'radio' : 'checkbox'"
                      [attr.name]="selectable() === 'single' ? nomeGrupo : null"
                      [checked]="marcadas().has(linha)"
                      [attr.aria-label]="'Selecionar ' + identificador(linha)"
                      (change)="alternarLinha(linha)"
                    />
                  </td>
                }

                @for (col of colunasVisiveis(); track col.key) {
                  <td
                    [style.text-align]="alinhamento(col)"
                    [attr.data-label]="col.header"
                    [class.ucam-table__num]="col.type === 'number' || col.type === 'currency'"
                    [class.ucam-col--fixa-inicio]="ladoFixo(col) === 'start'"
                    [class.ucam-col--fixa-fim]="ladoFixo(col) === 'end'"
                    [style.--ucam-col-x]="deslocamento(col)"
                  >
                    @if (moldeDe(col.key); as molde) {
                      <ng-container
                        [ngTemplateOutlet]="molde"
                        [ngTemplateOutletContext]="{ $implicit: linha, coluna: col }"
                      />
                    } @else if (col.type === 'status') {
                      @if (comoStatus(linha[col.key]); as s) {
                        <ucam-badge [label]="s.label" [tone]="s.tone" />
                      }
                    } @else if (vazio(linha[col.key])) {
                      <!-- Célula sem valor NUNCA fica muda: o travessão é para
                           o olho e o motivo vai por extenso para a voz. -->
                      <span aria-hidden="true">—</span>
                      <span class="ucam-sr-only">{{ col.vazio ?? 'Não informado' }}</span>
                    } @else {
                      {{ linha[col.key] }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>

      @if (state() === 'loading') {
        <!-- O conteúdo anterior NÃO é removido: tirar as linhas durante o
             carregamento faz a página saltar e apaga o que a pessoa estava
             lendo. O aria-busy na região é quem avisa. -->
        <p class="ucam-table__estado">Carregando {{ itemLabel() }}…</p>
      } @else if (state() === 'error') {
        <div class="ucam-table__estado">
          <p>Não foi possível carregar {{ itemLabel() }}.</p>
          <button type="button" class="ucam-btn ucam-btn--secondary" (click)="retry.emit()">
            Tentar novamente
          </button>
        </div>
      } @else if (state() === 'empty') {
        <div class="ucam-table__estado">
          <!-- As duas ausências não são a mesma coisa, e o que se oferece
               depois delas é diferente: cadastrar contra limpar o filtro. -->
          @if (emptyReason() === 'no-results') {
            <p>Nenhum resultado para o filtro aplicado.</p>
            <ng-content select="[ucamTabelaSemResultado]" />
          } @else {
            <p>Nenhum registro de {{ itemLabel() }} ainda.</p>
            <ng-content select="[ucamTabelaSemDado]" />
          }
        </div>
      }
    </div>
  `,
  styles: `
    .ucam-data-table-host {
      display: block;
      /* A medida é do CONTÊINER, não da janela: as telas do Protocolo rodam
         num container de ~1020px numa janela de 2518px, e media query de
         viewport nunca dispararia lá dentro. */
      container-type: inline-size;
      container-name: ucam-tabela;
    }
    .ucam-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      background: var(--ucam-color-surface-default);
      scrollbar-width: thin;
    }
    .ucam-table-wrap:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    .ucam-table {
      inline-size: 100%;
      border-collapse: collapse;
      font-size: var(--ucam-typography-body-sm-font-size);
    }
    .ucam-table th {
      text-align: start;
      /* Caixa NATURAL no cabeçalho — ADR-003. */
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-secondary);
      background: var(--ucam-color-surface-subtle);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
      padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
      white-space: nowrap;
    }
    .ucam-table--sticky thead th {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
    }
    .ucam-table td {
      padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
      /* Alinhamento ao TOPO: o padrão do navegador é middle, e basta uma
         célula com duas linhas para desalinhar a fileira inteira. */
      vertical-align: top;
      color: var(--ucam-color-text-primary);
    }
    .ucam-table tbody tr:last-child td { border-block-end: 0; }
    .ucam-table__num { font-variant-numeric: tabular-nums; }
    .ucam-table__col-min { inline-size: 1%; white-space: nowrap; }

    /* O realce da linha sob o ponteiro faz o trabalho da zebra e faz melhor:
       acompanha o olho em vez de pintar metade da tabela. */
    .ucam-table tbody tr:hover td { background: var(--ucam-color-interaction-hover); }
    .ucam-table--zebra tbody tr:nth-child(even) td {
      background: var(--ucam-color-surface-subtle);
    }
    .ucam-table--zebra tbody tr:hover td { background: var(--ucam-color-interaction-hover); }
    .ucam-table__linha--marcada td { background: var(--ucam-color-interaction-selected); }

    /* A BARRA NA ENTRADA DA LINHA ESCOLHIDA (21/09/2026), espelho do Trilho A.
       Medido lá: o fundo tinto sozinho dá 1,08:1 no claro e 1,04:1 no escuro
       contra a superfície — os mesmos números que fizeram o item de LISTA
       ganhar a barra. Diz escolha, não estado: só a linha marcada a tem, e a
       ADR-027 tirou foi a barra de tr[data-estado], que pintava todas.
       inset box-shadow porque a tabela é border-collapse e a sombra não ocupa
       espaço — uma borda empurraria a primeira coluna para fora do cabeçalho. */
    .ucam-table__linha--marcada td:first-child {
      box-shadow: inset 4px 0 0 0 var(--ucam-color-action-primary-default);
    }

    .ucam-table--compact td,
    .ucam-table--compact th { padding: var(--ucam-space-1) var(--ucam-space-inset-sm); }

    /* Largura FIXA, e não 1%: com uma coluna fixa no início, a de seleção gruda
       junto e o deslocamento da fixa é exatamente esta medida. */
    .ucam-data-table-host { --ucam-table-sel-w: 3rem; }
    .ucam-table__sel { inline-size: var(--ucam-table-sel-w); min-inline-size: var(--ucam-table-sel-w); }

    /* -- menu da coluna ---------------------------------------------------- */
    .ucam-table__coluna {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    .ucam-table__coluna ucam-icon { color: var(--ucam-color-text-placeholder); }
    .ucam-table__coluna:hover,
    .ucam-table__coluna[aria-expanded='true'] { color: var(--ucam-color-text-primary); }
    th[aria-sort='ascending'] .ucam-table__coluna ucam-icon,
    th[aria-sort='descending'] .ucam-table__coluna ucam-icon { color: var(--ucam-color-action-primary-default); }
    .ucam-table__coluna:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 2px;
      border-radius: var(--ucam-radius-sm);
    }

    /* -- coluna fixa -------------------------------------------------------
       Sticky com fundo OPACO — célula grudada e transparente mostra o texto
       que passa por baixo. Aqui o hover, a zebra e a marca pintam a CÉLULA
       com tinta translúcida, então nas fixas eles viram camada
       (background-image) por cima do fundo do papel, e não substituto dele. */
    .ucam-table .ucam-col--fixa-inicio,
    .ucam-table .ucam-col--fixa-fim {
      position: sticky;
      z-index: 1;
      background-color: var(--ucam-color-surface-default);
    }
    .ucam-table .ucam-col--fixa-inicio { inset-inline-start: var(--ucam-col-x, 0); }
    .ucam-table .ucam-col--fixa-fim {
      inset-inline-end: var(--ucam-col-x, 0);
      box-shadow: inset 1px 0 0 var(--ucam-color-border-default);
    }
    .ucam-table td.ucam-col--fixa-inicio:not(.ucam-table__sel),
    .ucam-table th.ucam-col--fixa-inicio:not(.ucam-table__sel) {
      box-shadow: inset -1px 0 0 var(--ucam-color-border-default);
    }
    .ucam-table thead .ucam-col--fixa-inicio,
    .ucam-table thead .ucam-col--fixa-fim {
      z-index: 2;
      background-color: var(--ucam-color-surface-subtle);
    }
    .ucam-table tbody tr:hover td.ucam-col--fixa-inicio,
    .ucam-table tbody tr:hover td.ucam-col--fixa-fim {
      background-color: var(--ucam-color-surface-default);
      background-image: linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover));
    }
    .ucam-table--zebra tbody tr:nth-child(even) td.ucam-col--fixa-inicio,
    .ucam-table--zebra tbody tr:nth-child(even) td.ucam-col--fixa-fim {
      background-color: var(--ucam-color-surface-subtle);
    }
    .ucam-table__linha--marcada td.ucam-col--fixa-inicio,
    .ucam-table__linha--marcada td.ucam-col--fixa-fim {
      background-color: var(--ucam-color-surface-default);
      background-image: linear-gradient(var(--ucam-color-interaction-selected), var(--ucam-color-interaction-selected));
    }

    /* -- colunas ocultas --------------------------------------------------- */
    .ucam-table__ocultas {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ucam-space-inline-sm);
      margin-block-end: var(--ucam-space-1);
      color: var(--ucam-color-text-secondary);
      font-size: var(--ucam-typography-caption-font-size);
    }
    .ucam-table__reexibir {
      min-block-size: 1.5rem;
      padding: 0 var(--ucam-space-inline-sm);
      border: 0;
      border-radius: var(--ucam-radius-sm);
      background: none;
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-weight: var(--ucam-typography-label-font-weight);
      cursor: pointer;
    }
    .ucam-table__reexibir:hover { background: var(--ucam-color-interaction-hover); }
    .ucam-table__reexibir:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 2px;
    }

    .ucam-table__ordenar {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .ucam-table__estado {
      padding: var(--ucam-space-inset-lg);
      text-align: center;
      color: var(--ucam-color-text-secondary);
    }

    /* -- empilhado ---------------------------------------------------------
       A marcação continua sendo uma <table> para o DOM e para o leitor de
       tela; só a PINTURA muda. Remontar a lista em divs custaria a semântica
       de tabela — que é justamente o que quem ouve a tela usa para navegar. */
    @container ucam-tabela (max-width: 40rem) {
      .ucam-table--stack thead { display: none; }
      .ucam-table--stack tbody tr {
        display: block;
        padding: var(--ucam-space-inset-sm) 0;
        border-block-end: 1px solid var(--ucam-color-border-subtle);
      }
      .ucam-table--stack td {
        display: flex;
        gap: var(--ucam-space-inline-sm);
        justify-content: space-between;
        border: 0;
        padding-block: 0.15rem;
        text-align: start !important;
      }
      /* O rótulo vem de data-label e é impresso por ::before: conteúdo
         gerado não entra na árvore de acessibilidade na maioria dos
         leitores, e o <th> do cabeçalho continua sendo quem nomeia a
         célula. Sem isso o rótulo seria lido duas vezes. */
      .ucam-table--stack td::before {
        content: attr(data-label);
        color: var(--ucam-color-text-secondary);
        font-size: var(--ucam-typography-caption-font-size);
      }
    }

    .ucam-sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class UcamDataTable<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly columns = input.required<readonly UcamColumnDef[]>();
  readonly rows = input.required<readonly T[]>();
  /** Descrição da tabela para leitor de tela. Obrigatória, mesmo sr-only. */
  readonly caption = input.required<string>();
  readonly state = input<UcamTableState>('idle');
  /**
   * `no-data` é "nada cadastrado ainda"; `no-results` é "o filtro não achou".
   * São ausências diferentes e o que se oferece depois delas é diferente.
   */
  readonly emptyReason = input<'no-data' | 'no-results'>('no-data');
  readonly selectable = input<'none' | 'single' | 'multiple'>('none');
  readonly rowClickable = input(false);
  /**
   * Desligada por padrão. O defeito do legado não era a zebra: era alternar
   * sem critério. Ligar só onde o hover não dá conta — impressão, por exemplo,
   * onde não há ponteiro.
   */
  readonly zebra = input(false);
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly stickyHeader = input(true);
  /**
   * `null` é AUSÊNCIA de ordenação, não um terceiro estado decorativo. O
   * cabeçalho percorre crescente → decrescente → sem ordenação, e o terceiro
   * acionamento devolve a ordem natural dos dados.
   */
  readonly sort = model<UcamSort | null>(null);
  readonly responsive = input<UcamTableResponsive>('scroll');
  /**
   * O cabeçalho abre o menu da coluna: ordenar (quando sortable), fixar,
   * ocultar. Desligado, volta o cabeçalho de ordem em ciclo.
   */
  readonly columnMenu = input(true);
  /** Colunas fixas, pela key. Uma por lado. */
  readonly pinned = model<Readonly<Record<string, UcamPinSide>>>({});
  /** Colunas ocultas, pela key. A identificadora nunca entra aqui. */
  readonly hidden = model<readonly string[]>([]);
  /** Substantivo no plural, para os estados e a contagem: requerimentos, setores. */
  readonly itemLabel = input('registros');
  /** A coluna que identifica a linha, para o nome acessível da seleção. */
  readonly identifierKey = input<string | null>(null);

  /*
   * NÃO declarar `sortChange` como output aqui. `sort` é model(), e model já
   * cria o par `sortChange` que o binding de mão dupla consome — declarar o
   * segundo faz o Angular ligar o mesmo nome a duas saídas e o build do site
   * cai com "Output 'sortChange' is bound to both 'sort' and 'sortChange'".
   * O ngPackagr NÃO pega isto: a biblioteca compila, e quem quebra é a
   * aplicação que a consome.
   */
  readonly selectionChange = output<readonly T[]>();
  readonly retry = output<void>();

  private readonly moldes = contentChildren(UcamCelula);
  /** O HOST, que é quem carrega o container-type — não o div de rolagem. */
  private readonly hospedeiro = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nomeGrupo = `ucam-dt-sel-${++seq}`;
  private readonly selecao = signal<ReadonlySet<T>>(new Set());
  protected readonly marcadas = this.selecao.asReadonly();

  /**
   * Quantas colunas cabem em `priority`. Medido no CONTÊINER, com
   * ResizeObserver: a estratégia depende de quanto espaço a tabela tem, e não
   * de qual é a janela.
   */
  private readonly largura = signal(Number.POSITIVE_INFINITY);

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((e) => this.largura.set(e[0].contentRect.width));
      ro.observe(this.hospedeiro.nativeElement);
      inject(DestroyRef).onDestroy(() => ro.disconnect());
    }

    if (ngDevMode) {
      effect(() => {
        // Linha inteira com handler de clique não é focável, não abre em nova
        // aba e não é anunciada como interativa. O que torna a linha navegável
        // é um LINK REAL na célula identificadora — e ele vem por molde.
        if (this.rowClickable() && !this.moldes().length) {
          console.warn(
            '[ucam-data-table] rowClickable exige um link real na célula identificadora, fornecido por <ng-template ucamCelula="...">. Sem ele a linha não é alcançável por teclado. Ver spec/components/data-table.json.',
          );
        }
      });
    }
  }

  protected readonly colunasVisiveis = computed(() => {
    // Ocultas saem ANTES da conta de prioridade: coluna que a pessoa escondeu
    // não disputa espaço com as que ela quer ver.
    const ocultas = new Set(this.hidden());
    const cols = this.columns().filter((c) => !ocultas.has(c.key) || c.key === this.chaveIdentificadora());
    let visiveis = cols;
    if (this.responsive() === 'priority') {
      const w = this.largura();
      if (Number.isFinite(w)) {
        // Orçamento grosseiro de 9rem por coluna: some a de menor prioridade
        // até caber. A identificadora tem a maior prioridade e some por último.
        const cabem = Math.max(1, Math.floor(w / 144));
        if (cols.length > cabem) {
          const ordenadas = [...cols].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
          const mantidas = new Set(ordenadas.slice(0, cabem));
          visiveis = cols.filter((c) => mantidas.has(c));
        }
      }
    }
    // A fixa do início vai para a frente e a do fim para o fim: fixar uma
    // coluna do meio sem movê-la faria as vizinhas passarem por baixo dela.
    const lado = this.pinned();
    return [
      ...visiveis.filter((c) => lado[c.key] === 'start'),
      ...visiveis.filter((c) => !lado[c.key]),
      ...visiveis.filter((c) => lado[c.key] === 'end'),
    ];
  });

  private chaveIdentificadora(): string | undefined {
    return this.identifierKey() ?? this.columns()[0]?.key;
  }

  protected ladoFixo(col: UcamColumnDef): UcamPinSide | null {
    return this.pinned()[col.key] ?? null;
  }

  protected temFixa(lado: UcamPinSide): boolean {
    return Object.values(this.pinned()).includes(lado);
  }

  /** A fixa do início anda a largura da coluna de seleção, que gruda junto. */
  protected deslocamento(col: UcamColumnDef): string | null {
    const lado = this.ladoFixo(col);
    if (!lado) return null;
    return lado === 'start' && this.selectable() !== 'none' ? 'var(--ucam-table-sel-w)' : '0px';
  }

  protected iconeColuna(col: UcamColumnDef): UcamIconName {
    if (!col.sortable) return 'chevronDown';
    const s = this.sort();
    if (s?.column !== col.key) return 'chevronsUpDown';
    return s.direction === 'asc' ? 'chevronUp' : 'chevronDown';
  }

  protected itensColuna(col: UcamColumnDef): UcamMenuItem[] {
    const s = this.sort();
    const lado = this.ladoFixo(col);
    const itens: UcamMenuItem[] = [];
    if (col.sortable) {
      const minha = s?.column === col.key;
      itens.push(
        { id: 'asc', label: 'Crescente', icon: 'arrowUpNarrowWide', checked: minha && s?.direction === 'asc' },
        { id: 'desc', label: 'Decrescente', icon: 'arrowDownWideNarrow', checked: minha && s?.direction === 'desc' },
      );
      if (minha) itens.push({ id: 'limpar', label: 'Remover ordenação', icon: 'x' });
    }
    itens.push(
      { id: 'fixar-inicio', label: 'Fixar à esquerda', icon: 'pin', checked: lado === 'start', separadorAntes: col.sortable },
      { id: 'fixar-fim', label: 'Fixar à direita', icon: 'pin', checked: lado === 'end' },
      {
        id: 'ocultar',
        label: 'Ocultar coluna',
        icon: 'eyeOff',
        separadorAntes: true,
        // A identificadora nunca oculta: sem ela a linha deixa de ser
        // identificável. O item fica, desabilitado, para o menu ter a mesma
        // forma em todas as colunas.
        disabled: col.key === this.chaveIdentificadora() || col.hideable === false,
      },
    );
    return itens;
  }

  protected agirColuna(col: UcamColumnDef, item: UcamMenuItem): void {
    switch (item.id) {
      case 'asc':
      case 'desc':
        this.sort.set(item.checked ? null : { column: col.key, direction: item.id });
        break;
      case 'limpar':
        this.sort.set(null);
        break;
      case 'fixar-inicio':
      case 'fixar-fim': {
        const lado: UcamPinSide = item.id === 'fixar-inicio' ? 'start' : 'end';
        // Uma por lado: fixar outra do mesmo lado solta a anterior.
        const novo: Record<string, UcamPinSide> = {};
        for (const [k, v] of Object.entries(this.pinned())) if (v !== lado && k !== col.key) novo[k] = v;
        if (!item.checked) novo[col.key] = lado;
        this.pinned.set(novo);
        break;
      }
      case 'ocultar': {
        if (item.disabled) return;
        const { [col.key]: _solta, ...resto } = this.pinned();
        if (_solta) this.pinned.set(resto);
        this.hidden.set([...this.hidden(), col.key]);
        break;
      }
    }
  }

  protected readonly resumo = computed(() => {
    const n = this.rows().length;
    if (this.state() === 'loading') return `Carregando ${this.itemLabel()}`;
    if (this.state() === 'error') return `Falha ao carregar ${this.itemLabel()}`;
    if (n === 0) return `Nenhum resultado`;
    return `${n} ${this.itemLabel()}`;
  });

  protected readonly classesCaixa = computed(() =>
    this.responsive() === 'scroll' ? 'ucam-table-wrap' : 'ucam-table-wrap ucam-table-wrap--livre',
  );

  protected readonly classesTabela = computed(() => {
    const p = ['ucam-table'];
    if (this.zebra()) p.push('ucam-table--zebra');
    if (this.density() === 'compact') p.push('ucam-table--compact');
    if (this.stickyHeader()) p.push('ucam-table--sticky');
    if (this.responsive() === 'stack') p.push('ucam-table--stack');
    return p.join(' ');
  });

  protected readonly todasMarcadas = computed(
    () => this.rows().length > 0 && this.rows().every((l) => this.selecao().has(l)),
  );
  protected readonly parcialmenteMarcadas = computed(
    () => this.selecao().size > 0 && !this.todasMarcadas(),
  );

  protected moldeDe(key: string): TemplateRef<unknown> | null {
    return this.moldes().find((m) => m.coluna() === key)?.molde ?? null;
  }

  protected alinhamento(col: UcamColumnDef): string {
    return col.align ?? ALINHAMENTO[col.type ?? 'text'];
  }

  protected vazio(v: unknown): boolean {
    return v === null || v === undefined || v === '';
  }

  protected comoStatus(v: unknown): UcamCellStatus | null {
    return v && typeof v === 'object' && 'label' in v ? (v as UcamCellStatus) : null;
  }

  protected identificador(linha: T): string {
    const k = this.identifierKey() ?? this.columns()[0]?.key;
    return String(linha[k] ?? 'registro');
  }

  protected ariaSort(col: UcamColumnDef): string | null {
    if (!col.sortable) return null;
    const s = this.sort();
    if (s?.column !== col.key) return 'none';
    return s.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected iconeOrdem(col: UcamColumnDef) {
    const s = this.sort();
    return s?.column === col.key && s.direction === 'desc' ? ('chevronDown' as const) : ('chevronUp' as const);
  }

  protected rotuloOrdenar(col: UcamColumnDef): string {
    const s = this.sort();
    if (s?.column !== col.key) return `Ordenar por ${col.header}, crescente`;
    return s.direction === 'asc'
      ? `Ordenar por ${col.header}, decrescente`
      : `Remover ordenação de ${col.header}`;
  }

  protected ordenarPor(col: UcamColumnDef): void {
    const s = this.sort();
    let novo: UcamSort | null;
    if (s?.column !== col.key) novo = { column: col.key, direction: 'asc' };
    else if (s.direction === 'asc') novo = { column: col.key, direction: 'desc' };
    else novo = null;
    // set() no model já emite sortChange para quem escuta.
    this.sort.set(novo);
  }

  protected alternarLinha(linha: T): void {
    const atual = new Set(this.selecao());
    if (this.selectable() === 'single') {
      atual.clear();
      atual.add(linha);
    } else if (atual.has(linha)) {
      atual.delete(linha);
    } else {
      atual.add(linha);
    }
    this.selecao.set(atual);
    this.selectionChange.emit([...atual]);
  }

  protected alternarTodas(evento: Event): void {
    const marcar = (evento.target as HTMLInputElement).checked;
    const atual = marcar ? new Set(this.rows()) : new Set<T>();
    this.selecao.set(atual);
    this.selectionChange.emit([...atual]);
  }
}

let seq = 0;

declare const ngDevMode: boolean;
