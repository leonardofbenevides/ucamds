import {
  contentChild,
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
  afterRenderEffect,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamBadge, type UcamBadgeTone } from '../badge/ucam-badge';
import { UcamAvatar } from '../avatar/ucam-avatar';
import { UcamMenu, UcamMenuTrigger, type UcamMenuItem } from '../menu/ucam-menu';
import { UcamTableFaixa } from './ucam-table-faixa';

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
export type UcamColumnType = 'text' | 'id' | 'number' | 'date' | 'currency' | 'status' | 'person' | 'actions';
export type UcamTableState = 'idle' | 'loading' | 'error' | 'empty';
export type UcamTableResponsive = 'scroll' | 'stack' | 'priority';

export interface UcamColumnDef {
  /** Chave no objeto da linha. */
  key: string;
  /** Rótulo em CAIXA NATURAL. O legado usa caixa alta — ver ADR-003. */
  header: string;
  /**
   * Ícone do TIPO de dado antes do rótulo (ADR-051): user, calendar, hash,
   * circleDot, text. Decorativo; numa tabela é tudo ou nada.
   */
  icon?: UcamIconName;
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
 * Valor de uma célula type=person (ADR-046): avatar neutro de iniciais, nome
 * e um apoio — CPF mascarado, e-mail, lotação — na mesma linha. Com href o
 * nome vira link para o registro.
 */
export interface UcamCellPerson {
  name: string;
  /** Identificador do registro — matrícula. Sai em .ucam-id antes do apoio (ADR-047). */
  id?: string;
  support?: string;
  href?: string;
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
  // Identificador alinha ao início: não é quantidade (ADR-047).
  id: 'start',
  number: 'end',
  currency: 'end',
  // Data alinha ao INÍCIO: em pt-BR o dia vem primeiro e é por ele que se
  // varre a coluna. Alinhar ao fim colocaria o ano na prumada.
  date: 'start',
  status: 'start',
  person: 'start',
  actions: 'end',
};

@Component({
  selector: 'ucam-data-table',
  exportAs: 'ucamDataTable',
  imports: [NgTemplateOutlet, UcamIcon, UcamBadge, UcamMenu, UcamMenuTrigger, UcamAvatar],
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
    <!-- A MOLDURA existe para a faixa (parte "faixa" do contrato): ela fica
         dentro da borda da tabela e FORA do contêiner de rolagem — senão
         rolaria para o lado junto com as colunas. Sem faixa, a moldura não
         pinta nada e a borda continua no contêiner de rolagem. -->
    <div class="ucam-table-moldura" [class.ucam-table-moldura--faixa]="!!faixa()">
    <ng-content select="[ucamTableFaixa]" />
    <div
      #caixa
      [class]="classesCaixa()"
      [attr.role]="responsive() === 'scroll' ? 'region' : null"
      [attr.tabindex]="responsive() === 'scroll' ? 0 : null"
      [attr.aria-label]="responsive() === 'scroll' ? caption() : null"
      [attr.aria-busy]="state() === 'loading' ? 'true' : null"
    >
      <table [class]="classesTabela()" [attr.data-apertada]="apertada() ? '' : null">
        <caption class="ucam-sr-only">
          {{ caption() }}
        </caption>
        <thead>
          <tr>
            @if (selectable() === 'multiple') {
              <th scope="col" class="ucam-table__sel th--selecao" [class.ucam-col--fixa-inicio]="temFixa('start')">
                <label class="ucam-table__check">
                  <input
                    type="checkbox"
                    [checked]="todasMarcadas()"
                    [indeterminate]="parcialmenteMarcadas()"
                    aria-label="Selecionar todas as linhas desta página"
                    (change)="alternarTodas($event)"
                  />
                </label>
              </th>
            } @else if (selectable() === 'single') {
              <th scope="col" class="ucam-table__sel th--selecao" [class.ucam-col--fixa-inicio]="temFixa('start')"><span class="ucam-sr-only">Seleção</span></th>
            }

            @for (col of colunasVisiveis(); track col.key) {
              <th
                scope="col"
                [style.text-align]="alinhamento(col)"
                [attr.aria-sort]="ariaSort(col)"
                [class.ucam-table__col-min]="col.width === 'min'"
                [class.ucam-table__acoes]="col.type === 'actions'"
                [class.ucam-col--fixa-inicio]="ladoFixo(col) === 'start'"
                [class.ucam-col--fixa-fim]="ladoFixo(col) === 'end'"
                [style.--ucam-col-x]="deslocamento(col)"
              >
                @if (col.type === 'actions') {
                  <!-- A coluna de ações não ordena, não fixa e não se oculta: o
                       rótulo existe para quem ouve, como na folha do Trilho A
                       (th--acoes). Um menu aqui prometia três coisas vazias. -->
                  <span class="ucam-sr-only">{{ col.header }}</span>
                } @else if (columnMenu()) {
                  <!-- O cabeçalho ABRE o menu da coluna (contrato data-table,
                       column-menu). O indicador fica sempre visível: é ele que
                       diz qual coluna governa a ordem sem abrir nada. -->
                  <button type="button" class="ucam-table__coluna" [ucamMenuTrigger]="menuCol">
                    @if (col.icon) {
                      <ucam-icon class="ucam-table__icone" [name]="col.icon" size="sm" aria-hidden="true" />
                    }
                    {{ col.header }}
                    <ucam-icon [name]="iconeColuna(col)" size="sm" aria-hidden="true" />
                  </button>
                  <ucam-menu #menuCol [items]="itensColuna(col)" align="start" (escolher)="agirColuna(col, $event)" />
                } @else if (col.sortable) {
                  <button type="button" class="ucam-table__ordenar" [attr.aria-label]="rotuloOrdenar(col)" (click)="ordenarPor(col)">
                    @if (col.icon) {
                      <ucam-icon class="ucam-table__icone" [name]="col.icon" size="sm" aria-hidden="true" />
                    }
                    {{ col.header }}
                    <ucam-icon [name]="iconeOrdem(col)" size="sm" aria-hidden="true" [style.visibility]="sort()?.column === col.key ? 'visible' : 'hidden'" />
                  </button>
                } @else {
                  @if (col.icon) {
                    <ucam-icon class="ucam-table__icone" [name]="col.icon" size="sm" aria-hidden="true" />
                  }
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
                [class.ucam-table__linha--acionavel]="rowClickable()"
                [attr.aria-selected]="selectable() === 'none' ? null : marcadas().has(linha)"
                (click)="aoClicarLinha(linha, $event)"
              >
                @if (selectable() !== 'none') {
                  <td class="ucam-table__sel td--selecao" [class.ucam-col--fixa-inicio]="temFixa('start')">
                    <label class="ucam-table__check">
                      <input
                        [type]="selectable() === 'single' ? 'radio' : 'checkbox'"
                        [attr.name]="selectable() === 'single' ? nomeGrupo : null"
                        [checked]="marcadas().has(linha)"
                        [disabled]="!selecionavel(linha)"
                        [attr.aria-label]="'Selecionar ' + identificador(linha)"
                        (change)="alternarLinha(linha)"
                      />
                    </label>
                  </td>
                }

                @for (col of colunasVisiveis(); track col.key) {
                  <td
                    [style.text-align]="alinhamento(col)"
                    [attr.data-label]="col.header"
                    [class.ucam-table__acoes]="col.type === 'actions'"
                    [class.ucam-table__num]="col.type === 'number' || col.type === 'currency'"
                    [class.td--pessoa]="col.type === 'person'"
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
                        <!-- Pastilha tinta com ponto (ADR-051, revista em
                             25/09): o tom no fundo e no texto. -->
                        <ucam-badge variant="dot" [label]="s.label" [tone]="s.tone" />
                      }
                    } @else if (col.type === 'id') {
                      <!-- Identificador (ADR-047): um degrau de peso, sem
                           tabular-nums — matrícula não é quantidade. -->
                      <span class="ucam-id">{{ linha[col.key] }}</span>
                    } @else if (col.type === 'person') {
                      @if (comoPessoa(linha[col.key]); as p) {
                        <!-- Célula de pessoa (ADR-046): a mesma marcação do
                             Trilho A (.td--pessoa). Avatar decorativo e neutro. -->
                        <ucam-avatar [name]="p.name" size="sm" decorative />
                        <span class="td--pessoa__texto">
                          @if (p.href) {
                            <a class="ucam-link td--pessoa__nome" [href]="p.href">{{ p.name }}</a>
                          } @else {
                            <span class="td--pessoa__nome">{{ p.name }}</span>
                          }
                          @if (p.id || p.support) {
                            <span class="td--apoio">@if (p.id) {<span class="ucam-id">{{ p.id }}</span>}{{ p.id && p.support ? ' · ' : '' }}{{ p.support ?? '' }}</span>
                          }
                        </span>
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
    /* Com faixa, a BORDA passa para a moldura: faixa e tabela no mesmo
       cartão, como .ucam-card > .ucam-table-faixa + .ucam-table-wrap no
       Trilho A. */
    .ucam-table-moldura--faixa {
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      background: var(--ucam-color-surface-default);
      overflow: clip;
    }
    .ucam-table-moldura--faixa > .ucam-table-wrap { border: 0; border-radius: 0; }
    /* Dentro de um cartão a moldura é do cartão, como na folha do Trilho A:
       com a própria borda, a tabela entrava 1px para dentro e a prova de
       paridade via toda a grade deslocada (04/10/2026). */
    .ucam-card > ucam-data-table > .ucam-table-moldura > .ucam-table-wrap { border: 0; border-radius: 0; }
    /* Linha acionável: o ponteiro diz que a linha inteira responde. O
       caminho do teclado continua sendo o link da célula identificadora. */
    .ucam-table__linha--acionavel { cursor: pointer; }
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
      /* Branco, sem faixa (ADR-051): o fio default embaixo, a tinta
         secundária e o ícone de coluna dizem que a fileira é rótulo. */
      background: var(--ucam-color-surface-default);
      border-block-end: 1px solid var(--ucam-color-border-default);
      /* OS MESMOS RECUOS DA FOLHA DO TRILHO A (03/10/2026). A prova de
         paridade de tela (tools/prova-paridade-tela.mjs) mediu a tabela de
         naturezas 957px larga aqui contra 804px lá, com a mesma fonte e as
         mesmas colunas: 16px de recuo lateral contra 12 — a folha baixou para
         12 em 25/09 (seis colunas gastavam 192px só de recuo) e esta base
         não acompanhou. 8px na vertical do cabeçalho e 13px na célula são os
         números da folha, medidos, e dão a linha de 87px que ela dá. */
      padding: var(--ucam-space-inline-sm) var(--ucam-space-inset-sm);
      /* O papel table-header inteiro, como a folha: sem a entrelinha do
         papel o cabeçalho media 36px aqui e 40 lá. */
      font-size: var(--ucam-typography-table-header-font-size);
      letter-spacing: var(--ucam-typography-table-header-letter-spacing);
      line-height: var(--ucam-typography-table-header-line-height);
      white-space: nowrap;
    }
    /* Fio vertical entre colunas (ADR-051), menos logo depois da seleção.
       :where() segura em (0,1,1), empatado com o "border: 0" do empilhado,
       que vem depois e por isso vence. */
    /* Só na CÉLULA: o cabeçalho já desenha o mesmo fio por sombra interna
       (regra do sticky, abaixo), e com borda por cima ele media 1px a mais
       que a célula em cada coluna — quatro pixels tirados da identificadora
       (prova de paridade, 04/10/2026). A folha do Trilho A faz igual: borda
       no corpo, sombra no cabeçalho. */
    .ucam-table tr > :where(td):where(:not(.ucam-table__sel)) + :where(td) {
      border-inline-start: 1px solid var(--ucam-color-border-subtle);
    }
    .ucam-table thead tr > :where(th):where(:not(.ucam-table__sel)) + :where(th) {
      box-shadow: inset 1px 0 0 var(--ucam-color-border-subtle);
    }
    .ucam-table th .ucam-table__icone { color: var(--ucam-color-text-placeholder); }
    .ucam-table th > .ucam-table__icone {
      display: inline-flex;
      vertical-align: -0.1875rem;
      margin-inline-end: var(--ucam-space-inline-sm);
    }
    /* Situação em pastilha tinta com ponto (ADR-051, revista em 25/09:
       "coloque mais cor de estado"), espelho da folha do Trilho A. */
    .ucam-table ucam-badge:not([data-variant='plain']) > z-badge {
      font-weight: var(--ucam-typography-body-font-weight);
      gap: var(--ucam-space-inline-xs);
    }
    .ucam-table ucam-badge[data-tone='info'] > z-badge > span[aria-hidden] { background: var(--ucam-color-feedback-info-border); }
    .ucam-table ucam-badge[data-tone='success'] > z-badge > span[aria-hidden] { background: var(--ucam-color-feedback-success-border); }
    .ucam-table ucam-badge[data-tone='warning'] > z-badge > span[aria-hidden] { background: var(--ucam-color-feedback-warning-border); }
    .ucam-table ucam-badge[data-tone='danger'] > z-badge > span[aria-hidden] { background: var(--ucam-color-feedback-danger-border); }
    .ucam-table ucam-badge[data-tone='neutral'] > z-badge > span[aria-hidden] { background: var(--ucam-color-text-placeholder); }
    .ucam-table--sticky thead th {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
    }
    .ucam-table td {
      /* 13px na vertical: ver o comentário do th. */
      padding: 0.8125rem var(--ucam-space-inset-sm);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
      /* CENTRO, como a folha do Trilho A (04/10/2026). Esta base alinhava ao
         topo "para a célula de duas linhas não desalinhar a fileira"; a
         folha argumenta o contrário e mede: com o topo, a célula de texto
         puro assenta na primeira linha-base e a vizinha com selo assenta a
         caixa do selo, e as duas nunca coincidem. A prova de paridade pegou
         toda célula de uma linha pintada 20px acima da referência. */
      vertical-align: middle;
      color: var(--ucam-color-text-primary);
    }
    .ucam-table tbody tr:last-child td { border-block-end: 0; }
    .ucam-table__num { font-variant-numeric: tabular-nums; }
    /* Célula de pessoa — os mesmos números da folha do Trilho A (.td--pessoa). */
    .ucam-table .td--pessoa { line-height: 1.5rem; }
    .ucam-table .td--pessoa > ucam-avatar { display: inline-flex; vertical-align: top; margin-inline-end: var(--ucam-space-inline-sm); }
    .ucam-table .td--pessoa__texto { display: inline-flex; flex-wrap: wrap; align-items: baseline; column-gap: var(--ucam-space-inline-sm); vertical-align: top; line-height: 1.5rem; max-inline-size: calc(100% - 1.5rem - var(--ucam-space-inline-sm)); }
    .ucam-table .td--pessoa__texto > .ucam-link { padding-block: 0; }
    .ucam-table .td--pessoa__nome { font-weight: var(--ucam-typography-label-font-weight); color: var(--ucam-color-text-primary); text-decoration: none; }
    /* Sublinhado só no hover e no foco: em repouso o nome se distingue pelo peso. */
    .ucam-table .td--pessoa__nome:hover,
    .ucam-table .td--pessoa__nome:focus-visible { text-decoration: underline; }
    .ucam-table .td--apoio { font-size: var(--ucam-typography-caption-font-size); color: var(--ucam-color-text-secondary); white-space: nowrap; }
    .ucam-table__col-min { inline-size: 1%; white-space: nowrap; }
    /* A CÉLULA IDENTIFICADORA DE DUAS LINHAS (título + apoio) tem piso de
       8rem, como na folha do Trilho A: sem ele o algoritmo da tabela a
       espremia a 134px e o apoio descia para três linhas enquanto a coluna
       vizinha sobrava (prova de paridade, 04/10/2026). */
    .ucam-table tbody tr > td:not(.ucam-table__sel):nth-child(1 of :not(.ucam-table__sel)):has(> .ucam-card__titulo) { min-inline-size: 8rem; }
    /* A coluna de AÇÕES mede o que os botões medem e nunca os empilha — como
       o .td--acoes da folha do Trilho A. Sem isto a prova de paridade pegou
       dois botões de 36px um sobre o outro numa célula de 70px, e a linha
       inteira crescendo de 87 para 107px por causa deles (03/10/2026). */
    .ucam-table__acoes { inline-size: 1%; white-space: nowrap; }
    .ucam-table__acoes > * { flex-wrap: nowrap; }
    /* O ARRANJO APERTADO, como na folha do Trilho A (tabelaScript, 03/10/2026):
       quando a tabela não cabe no invólucro, antes de rolar ela abre mão do
       ícone de tipo no cabeçalho e deixa o apoio quebrar. Medido pela prova
       de paridade: os quatro ícones custavam 80px e eram a diferença entre
       uma tabela que cabe em 804px e uma que rola a 847. */
    .ucam-table[data-apertada] thead .ucam-table__icone { display: none; }
    .ucam-table[data-apertada] .td--apoio { white-space: normal; }

    /* O realce da linha sob o ponteiro faz o trabalho da zebra e faz melhor:
       acompanha o olho em vez de pintar metade da tabela. */
    .ucam-table tbody tr:hover td { background: var(--ucam-color-interaction-hover); }
    .ucam-table--zebra tbody tr:nth-child(even) td {
      background: var(--ucam-color-surface-subtle);
    }
    .ucam-table--zebra tbody tr:hover td { background: var(--ucam-color-interaction-hover); }
    /* A linha marcada: realce tinto (o mesmo do Trilho A, action-primary-subtle,
       e não o cinza alfa de interaction-selected) e a célula que nomeia o
       registro em peso de ação — um sinal de superfície, um de tipografia
       (ADR-046, 23/09/2026). A barra de 4px na entrada, posta em 21/09 porque o
       fundo sozinho dá 1,08:1, saiu junto com a do Trilho A: a medida pedia um
       segundo sinal, não uma tarja. */
    /* 25/09/2026: o fundo tinto saiu também daqui. Fundo branco e um shape
       sólido de 4px, de ponta a ponta. 05/10/2026: o shape passa à borda
       ESQUERDA, na primeira célula — a folha do Trilho A mudou de lado em
       28/09 e este bloco ficou na direita; com as duas folhas carregadas a
       linha marcada saía com DUAS barras (prova de paridade). */
    .ucam-table__linha--marcada > td:first-child:not(.ucam-col--fixa-inicio):not(.ucam-col--fixa-fim) { position: relative; }
    .ucam-table__linha--marcada > td:first-child::after {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      inline-size: 0.25rem;
      background: var(--ucam-color-action-primary-default);
      pointer-events: none;
    }
    .ucam-table__linha--marcada td:not(.ucam-table__sel):nth-child(1 of :not(.ucam-table__sel)) {
      font-weight: var(--ucam-typography-action-font-weight);
    }

    /* Densidade compacta: 8 × 12, os mesmos números da folha do Trilho A
       (.ucam-table--compact). Antes escrevia var(--ucam-space-1), que não
       existe nos tokens — a regra estava escrita e não pintava. */
    .ucam-table--compact td,
    .ucam-table--compact th { padding: 0.5rem var(--ucam-space-inset-sm); }
    .ucam-table--compact thead th { padding-block: 0.375rem; }
    .ucam-table--compact .ucam-table__acoes .ucam-btn, .ucam-table--compact .td--acoes .ucam-btn { block-size: var(--ucam-size-control-sm); min-inline-size: var(--ucam-size-control-sm); }

    /* Largura FIXA, e não 1%: com uma coluna fixa no início, a de seleção gruda
       junto e o deslocamento da fixa é exatamente esta medida. */
    .ucam-data-table-host { --ucam-table-sel-w: 3rem; }
    .ucam-table__sel { inline-size: var(--ucam-table-sel-w); min-inline-size: var(--ucam-table-sel-w); }
    /* A CAIXA DE SELEÇÃO DA TABELA, com o desenho do .ucam-check da folha do
       Trilho A (03/10/2026). Era o <input> nativo de 13px: a linha de
       cabeçalho media 36px aqui e 40 lá, porque lá é o rótulo de 24px que
       dá a altura. O alvo é o rótulo (24px); a caixa desenhada tem 20. */
    .ucam-table__check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: var(--ucam-size-icon-lg);
      min-block-size: var(--ucam-size-icon-lg);
      vertical-align: middle;
      cursor: pointer;
    }
    .ucam-table__check input {
      appearance: none;
      margin: 0;
      flex: none;
      inline-size: var(--ucam-size-icon-md);
      block-size: var(--ucam-size-icon-md);
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-miudo);
      cursor: pointer;
      position: relative;
      display: block;
    }
    .ucam-table__check input[type='radio'] { border-radius: 50%; }
    /* Linha que não aceita seleção (rowSelectable): o chão do desabilitado
       da ADR-042, como .ucam-check input:disabled. */
    .ucam-table__check input:disabled {
      background: var(--ucam-color-action-disabled-background);
      border-color: var(--ucam-color-border-subtle);
      cursor: not-allowed;
    }
    .ucam-table__check:has(input:disabled) { cursor: not-allowed; }
    .ucam-table__check input::after {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      translate: -50% -50%;
    }
    .ucam-table__check input:checked,
    .ucam-table__check input:indeterminate {
      background: var(--ucam-color-action-primary-default);
      border-color: var(--ucam-color-action-primary-default);
    }
    .ucam-table__check input[type='checkbox']:checked::after {
      content: '';
      inline-size: 0.3rem;
      block-size: 0.55rem;
      border: solid var(--ucam-color-text-on-action);
      border-width: 0 2px 2px 0;
      transform: translateY(-1px) rotate(45deg);
    }
    .ucam-table__check input[type='radio']:checked::after {
      content: '';
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-radius: 50%;
      background: var(--ucam-color-text-on-action);
    }
    .ucam-table__check input:indeterminate::after {
      content: '';
      inline-size: 0.55rem;
      block-size: 2px;
      background: var(--ucam-color-text-on-action);
    }
    .ucam-table__check:hover input:not(:checked):not(:indeterminate):not(:disabled) { border-color: var(--ucam-color-border-strong); }
    .ucam-table__check input:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }

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
    /* O menu da coluna é um <ucam-menu> ao lado do botão, e o painel dele
       abre no overlay do CDK — o host no th é só o molde. Em fluxo, o molde
       dava largura MÍNIMA ao cabeçalho: os itens escondidos ("Fixar à
       esquerda", "Ocultar coluna") mediam 163px e a coluna Unidades saía
       188 em vez de 182, roubando seis pixels da coluna identificadora
       (prova de paridade, 03/10/2026). Fora do fluxo, ele não mede nada;
       o th é sticky, logo posicionado, e segura o absoluto. */
    .ucam-table th > ucam-menu { position: absolute; inline-size: 0; block-size: 0; overflow: hidden; }
    /* Só o ícone da COLUNA é apagado; a seta do gatilho herda a tinta do
       rótulo, como na folha do Trilho A (prova de paridade, 05/10/2026). */
    .ucam-table__coluna ucam-icon.ucam-table__icone { color: var(--ucam-color-text-placeholder); }
    .ucam-table__coluna:hover,
    .ucam-table__coluna[aria-expanded='true'] { color: var(--ucam-color-text-primary); }
    th[aria-sort='ascending'] .ucam-table__coluna ucam-icon:not(.ucam-table__icone),
    th[aria-sort='descending'] .ucam-table__coluna ucam-icon:not(.ucam-table__icone) { color: var(--ucam-color-action-primary-default); }
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
      background-color: var(--ucam-color-surface-default);
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

    /* Identificador (ADR-047): os mesmos números da folha do Trilho A (.ucam-id). */
    .ucam-table .ucam-id { font-weight: var(--ucam-typography-label-font-weight); }

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
  /**
   * Linha acionada, com rowClickable: o clique em qualquer ponto da linha que
   * não seja um controle (link, botão, campo, rótulo). O link ou botão da
   * célula identificadora faz o mesmo e é o caminho do teclado — por isso o
   * contrato o exige junto. Ver data-table.json, eventos.rowClick.
   */
  readonly rowClick = output<T>();
  readonly retry = output<void>();

  /** A faixa no topo, se o consumidor projetou uma. */
  protected readonly faixa = contentChild(UcamTableFaixa);

  private readonly moldes = contentChildren(UcamCelula);
  /** O HOST, que é quem carrega o container-type — não o div de rolagem. */
  private readonly hospedeiro = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nomeGrupo = `ucam-dt-sel-${++seq}`;
  private readonly selecao = signal<ReadonlySet<T>>(new Set());
  protected readonly marcadas = this.selecao.asReadonly();

  /**
   * A SELEÇÃO VINDA DE FORA (03/10/2026). Até aqui a tabela só EMITIA o que
   * estava marcado (selectionChange); a aplicação não tinha como marcar —
   * restaurar a escolha ao voltar de um detalhe, limpar pela barra de lote
   * que ela mesma desenha, ou montar a tela de referência no estado da foto.
   * Com `selected`, o par [selected]/(selectionChange) fecha o ciclo. A
   * tabela só reage quando a lista de fora MUDA: o que a pessoa marca
   * continua passando por selecao, sem voltar por aqui.
   */
  readonly selected = input<readonly T[]>([]);
  /**
   * Quais linhas aceitam seleção. A que não aceita mantém a caixa, desabilitada
   * — registro arquivado numa lista com ação em lote, por exemplo —, e fica
   * fora do "selecionar todas": a coluna não muda de forma por causa dela.
   */
  readonly rowSelectable = input<((linha: T) => boolean) | null>(null);
  private readonly selecaoDeFora = effect(() => {
    this.selecao.set(new Set(this.selected()));
  });

  /**
   * Quantas colunas cabem em `priority`. Medido no CONTÊINER, com
   * ResizeObserver: a estratégia depende de quanto espaço a tabela tem, e não
   * de qual é a janela.
   */
  private readonly largura = signal(Number.POSITIVE_INFINITY);

  /**
   * A tabela não cabe no invólucro? Então o arranjo apertado (ver o CSS de
   * [data-apertada]) — a mesma regra do tabelaScript da folha do Trilho A.
   * Mede-se com o atributo tirado, senão a tabela que já apertou passa a
   * caber e o laço nunca fecha.
   */
  protected readonly apertada = signal(false);
  private readonly caixa = viewChild<ElementRef<HTMLElement>>('caixa');
  private mede(): void {
    const caixa = this.caixa()?.nativeElement;
    const tabela = caixa?.querySelector('table');
    if (!caixa || !tabela || this.responsive() !== 'scroll') return;
    tabela.removeAttribute('data-apertada');
    const cabe = caixa.scrollWidth <= caixa.clientWidth + 1;
    if (!cabe) tabela.setAttribute('data-apertada', '');
    this.apertada.set(!cabe);
  }

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((e) => {
        this.largura.set(e[0].contentRect.width);
        this.mede();
      });
      ro.observe(this.hospedeiro.nativeElement);
      inject(DestroyRef).onDestroy(() => ro.disconnect());
    }
    // Depois de cada pintura em que as linhas ou as colunas mudaram.
    afterRenderEffect(() => {
      this.rows();
      this.columns();
      this.hidden();
      this.mede();
    });

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

  protected aoClicarLinha(linha: T, evento: MouseEvent): void {
    if (!this.rowClickable()) return;
    // O controle dentro da linha responde por si: o link da célula
    // identificadora navega, o botão age, a caixa de seleção marca. Emitir
    // rowClick junto seria um clique, duas ações.
    const alvo = evento.target as Element | null;
    if (alvo?.closest('a, button, input, select, textarea, label, [role="button"], [contenteditable]')) return;
    // Seleção de texto não é clique: quem arrastou para copiar não pediu para abrir.
    if (typeof getSelection === 'function' && String(getSelection() ?? '').length) return;
    this.rowClick.emit(linha);
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

  protected selecionavel(linha: T): boolean {
    return this.rowSelectable()?.(linha) ?? true;
  }

  private readonly selecionaveis = computed(() => this.rows().filter((l) => this.selecionavel(l)));

  protected readonly todasMarcadas = computed(
    () => this.selecionaveis().length > 0 && this.selecionaveis().every((l) => this.selecao().has(l)),
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

  protected comoPessoa(v: unknown): UcamCellPerson | null {
    return v && typeof v === 'object' && 'name' in v ? (v as UcamCellPerson) : null;
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
    const atual = marcar ? new Set(this.selecionaveis()) : new Set<T>();
    this.selecao.set(atual);
    this.selectionChange.emit([...atual]);
  }
}

let seq = 0;

declare const ngDevMode: boolean;
