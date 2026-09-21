import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, model, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/section-bar.json
 *
 * O legado tem quatro tratamentos para a mesma função — barra cinza no
 * Portal, barra cinza no Protocolo, barra verde com gradiente no SIGFIN e
 * texto com fio, também no SIGFIN.
 *
 * A barra preenchida some: ela dá à seção mais peso visual do que ao
 * conteúdo que agrupa. A hierarquia passa a vir de tipografia e de um fio.
 *
 * RECOLHÍVEL (ADR-017). O gatilho é um <button> DENTRO do cabeçalho, e nunca
 * o inverso. O nome acessível de um botão ACHATA o que está dentro dele: um
 * <h3> dentro de <div role="button"> deixa de ser título, e a página perde os
 * marcos que quem usa leitor de tela navega para se situar. O redesenho
 * interno do SIGU faz o inverso nos quatro grupos da grade de módulos, e as
 * quatro unidades somem da árvore de cabeçalhos.
 *
 * Com `collapsible`, a REGIÃO passa a viver dentro do componente — é o que
 * permite ao gatilho apontá-la por aria-controls e escondê-la com hidden.
 * Projete-a com o atributo `ucamSecao`; o resto do conteúdo continua indo
 * para as ações de escopo, como antes.
 */
let seq = 0;

@Component({
  selector: 'ucam-section-bar',
  exportAs: 'ucamSectionBar',
  imports: [NgTemplateOutlet, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-wrap items-baseline justify-between gap-3 pb-1.5 mb-3"
      [class.border-b]="rule() && !collapsible()"
      [class.border-border]="rule() && !collapsible()"
    >
      <!-- grow + min-w-0: o fio do cabeçalho é um ::after que CRESCE dentro do
           título, e título sem largura para crescer deixa o fio com zero. -->
      <div class="flex items-baseline gap-2 grow min-w-0">
        @switch (level()) {
          @case (2) { <h2 class="ucam-section__title m-0"><ng-container [ngTemplateOutlet]="cabeca" /></h2> }
          @case (3) { <h3 class="ucam-section__title m-0"><ng-container [ngTemplateOutlet]="cabeca" /></h3> }
          @default  { <h4 class="ucam-section__title m-0"><ng-container [ngTemplateOutlet]="cabeca" /></h4> }
        }
      </div>
      <div class="flex items-center gap-2"><ng-content /></div>
    </div>
    @if (description()) {
      <p class="text-sm text-muted-foreground m-0 mb-3 max-w-[68ch]">{{ description() }}</p>
    }
    <div [id]="idRegiao()" [hidden]="collapsible() && !open()">
      <ng-content select="[ucamSecao]" />
    </div>

    <!--
      Um molde só para os três níveis. Sem ele, o gatilho seria escrito três
      vezes e o próximo ajuste acertaria dois dos três — que é exatamente como
      o parque chegou a quatro tratamentos para a mesma faixa.
    -->
    <ng-template #cabeca>
      @if (collapsible()) {
        <button
          type="button"
          class="ucam-section__gatilho"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="idRegiao()"
          (click)="open.set(!open())"
        >
          <span>{{ title() }}</span>
          @if (count() !== null) {
            <span class="text-xs font-normal text-muted-foreground tabular-nums">{{ count() }}</span>
          }
          <!--
            A seta é DECORATIVA: quem anuncia o estado é o aria-expanded. Seta
            sem aria-expanded é estado que só existe para quem enxerga.
          -->
          <ucam-icon
            name="chevronDown"
            size="sm"
            class="text-muted-foreground transition-transform"
            [class.-rotate-90]="!open()"
          />
        </button>
      } @else {
        <span>{{ title() }}</span>
        @if (count() !== null) {
          <span class="text-xs font-normal text-muted-foreground tabular-nums">{{ count() }}</span>
        }
      }
    </ng-template>
  `,
  styles: `
    /* Espelho da seção "seção recolhível" de tools/build-css.mjs. O wrapper não
       pode contar com @ucam/css carregado — um app Angular consome só a
       biblioteca —, e a tipografia do título e o desenho do gatilho são
       contrato, não cromagem da página. Sem isto o título saía com a medida
       que a folha da página hospedeira desse: medido no catálogo em
       20/09/2026, 24px pela prosa contra os 16px do token. */
    ucam-section-bar .ucam-section__title {
      flex: 1 1 auto;
      min-inline-size: 0;
      font-size: var(--ucam-typography-section-title-font-size);
      font-weight: var(--ucam-typography-section-title-font-weight);
      line-height: var(--ucam-typography-section-title-line-height);
      color: var(--ucam-color-text-primary);
    }

    ucam-section-bar .ucam-section__gatilho {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      background: none;
      border: 0;
      font: inherit;
      color: inherit;
      text-align: start;
      cursor: pointer;
      padding-inline: var(--ucam-space-inline-sm);
      margin-inline: calc(var(--ucam-space-inline-sm) * -1);
      padding-block: var(--ucam-space-inline-xs);
      border-radius: var(--ucam-radius-control);
    }

    ucam-section-bar .ucam-section__gatilho:hover {
      background-image: linear-gradient(
        var(--ucam-color-interaction-hover),
        var(--ucam-color-interaction-hover)
      );
    }

    /* O FIO corre do título até a margem, e é por isso que ele mora no
       cabeçalho e não numa borda embaixo do bloco: fechado, o grupo continua
       sendo uma pasta, com a linha de cima à mostra. */
    ucam-section-bar .ucam-section__title:has(> .ucam-section__gatilho) {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-md);
    }

    ucam-section-bar .ucam-section__title:has(> .ucam-section__gatilho)::after {
      content: "";
      flex: 1 1 auto;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
  `,
})
export class UcamSectionBar {
  readonly title = input.required<string>();
  /** Precisa respeitar a hierarquia da página — nunca pular níveis. */
  readonly level = input<2 | 3 | 4>(2);
  /**
   * Quantos itens a seção agrupa. Permanece visível com a seção RECOLHIDA: é
   * ela que responde se vale a pena abrir. Esconder o número ao recolher
   * transforma o grupo fechado num rótulo sem conteúdo.
   */
  readonly count = input<number | string | null>(null);
  readonly description = input<string | null>(null);
  readonly rule = input(true, { transform: booleanAttribute });
  /**
   * Transforma o cabeçalho em gatilho. Padrão desligado: recolher é para tela
   * cuja seção é longa o bastante para a próxima ficar fora da vista — a
   * grade de 58 sistemas em quatro unidades é o caso; três campos num
   * formulário não é.
   */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /**
   * Estado da região. Nasce ABERTA, sempre: seção que abre fechada esconde
   * conteúdo de quem chegou pela primeira vez, e o preço é pago por todo
   * mundo para beneficiar quem já sabe onde está. Fechar é decisão de quem
   * usa — por isso é model, e a preferência persiste com o consumidor.
   */
  readonly open = model(true);

  /**
   * aria-controls precisa de um id, e ele não pode vir do consumidor: duas
   * seções na mesma tela com o mesmo id fazem o leitor de tela apontar o
   * primeiro grupo em todos os gatilhos.
   */
  private readonly serie = seq++;
  protected readonly idRegiao = computed(() => `ucam-secao-${this.serie}`);
}
