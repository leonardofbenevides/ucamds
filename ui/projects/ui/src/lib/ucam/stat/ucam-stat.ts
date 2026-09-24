import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/stat.json
 *
 * O ladrilho de indicador — 48 usos nas telas do parque e, até agora, sem
 * implementação Angular nenhuma. Sem ele, um painel de indicadores era
 * impossível de montar pelo pacote: as quatro telas gerenciais existiam só em
 * CSS puro.
 *
 * O componente NÃO FORMATA o valor. Moeda, data e percentual chegam prontos do
 * pipe da aplicação, porque o formato é decisão de domínio — BRL, casas
 * decimais, sinal — e não de apresentação. Um ladrilho que formatasse teria de
 * conhecer a moeda, e no dia em que o SigFin mostrasse dólar o componente
 * estaria errado por desenho.
 */
export type UcamStatTone = 'neutral' | 'success' | 'warning' | 'danger' | 'marca';
export type UcamStatLayout = 'stack' | 'row';
/** O mesmo vocabulário da DataTable. Ver stat.json, state. */
export type UcamStatState = 'idle' | 'loading' | 'empty' | 'error';

/**
 * O tom pinta o CONTEXTO — variação e meta —, e o número fica na tinta de
 * texto principal (ADR-035, 16/09/2026). Antes pintava o valor (ADR-034); o
 * ladrilho continua sempre branco. Entre 13 e
 * 14/09/2026 ele pintava também o fundo (ADR-032) e o painel virou mosaico.
 * O tom vem do dado — quatro contagens neutras ficam neutras — e a meta em
 * palavra continua obrigatória com qualquer tom.
 */
const TOM: Record<UcamStatTone, string> = {
  neutral: 'var(--ucam-color-text-primary)',
  success: 'var(--ucam-color-feedback-success-numeral)',
  warning: 'var(--ucam-color-feedback-warning-numeral)',
  danger: 'var(--ucam-color-feedback-danger-numeral)',
  marca: 'var(--ucam-color-action-primary-default)',
};

@Component({
  selector: 'ucam-stat',
  exportAs: 'ucamStat',
  imports: [UcamIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <div [class]="classes()">
      @if (icon(); as ic) {
        <!-- Ladrilho NEUTRO, sempre (ADR-046): a ADR-034 tirou o fundo tinto
             do stat e vale para o ladrilho de dentro — quatro figuras coloridas
             seriam o mosaico de volta. Decorativo: quem nomeia é o rótulo. -->
        <span class="ucam-stat__figura" aria-hidden="true"><ucam-icon [name]="ic" size="sm" /></span>
      }
      <!-- O corpo só existe com figura, para o DOM dos stats sem figura não
           mudar. É o mesmo arranjo do Trilho A (.ucam-stat__corpo). -->
      <ng-container *ngTemplateOutlet="icon() ? comCorpo : semCorpo" />
      <ng-template #comCorpo><span class="ucam-stat__corpo"><ng-container *ngTemplateOutlet="miolo" /></span></ng-template>
      <ng-template #semCorpo><ng-container *ngTemplateOutlet="miolo" /></ng-template>

      <ng-template #miolo>
        <!-- O rótulo vem ANTES do valor na ordem do DOM para que o leitor de
             tela anuncie a pergunta antes da resposta. Em row o valor aparece
             à direita, mas por ordem visual da linha — nunca invertendo o DOM. -->
        <span class="ucam-stat__label">{{ label() }}</span>

        @if (carregando()) {
          <!-- Sem dado ainda: uma barra do tamanho do número, não um "0". Zero é
               um valor, e mostrá-lo enquanto se carrega faz a pessoa decidir
               sobre um número que não existe. -->
          <span class="ucam-stat__value ucam-stat__value--esqueleto" aria-hidden="true">&nbsp;</span>
          <span class="ucam-sr-only">Carregando {{ label() }}</span>
        } @else {
          <!-- Valor e delta são irmãos diretos do ladrilho, como no Trilho A:
               o wrapper __valor-linha que existia aqui não constava da
               anatomia e era o primeiro ponto de drift entre os dois trilhos. -->
          <span class="ucam-stat__value" [style.color]="semValor() ? 'var(--ucam-color-text-secondary)' : null">{{ valorExibido() }}</span>
          @if (delta(); as d) {
            <!-- Texto, sem pastilha (ADR-034). Neutro sem tom: para cima nem
                 sempre é bom. Com tom, acompanha a tinta do valor. -->
            <span class="ucam-stat__delta" [style.color]="tone() === 'neutral' ? null : cor()">{{ d }}</span>
          }
        }

        @if (state() === 'error') {
          <!-- A palavra carrega o erro; ícone e tinta só apontam. Sem botão: quem
               tenta de novo é a seção, senão quatro ladrilhos que falharam juntos
               viram quatro botões iguais. -->
          <span class="ucam-stat__erro" role="status">
            <ucam-icon name="circleAlert" size="sm" aria-hidden="true" />
            Não foi possível carregar
          </span>
        } @else if (meta(); as m) {
          <span class="ucam-stat__meta" [style.color]="tone() === 'neutral' ? null : cor()">{{ m }}</span>
        }
      </ng-template>
    </div>
  `,
  styles: `
    ucam-stat .ucam-stat {
      display: flex;
      flex: 1 1 11rem;
      min-inline-size: 0;
      flex-direction: column;
      /* 0.125rem, 1.5rem de entrelinha e delta sem recuo: os números da folha
         do Trilho A. Eram 0.15rem, 1.1 e 1px/5px — medido em 23/09/2026, o
         mesmo ladrilho saía 1px mais alto aqui (ADR-046). */
      gap: 0.125rem;
      padding: var(--ucam-space-inset-md);
      background: var(--ucam-color-surface-default);
      /* Anel próprio de 1px em vez de deixar o vão do contêiner aparecer: é o
         que impede a última fileira incompleta de mostrar um bloco cinza onde
         não há dado. */
      box-shadow: 0 0 0 1px var(--ucam-color-border-subtle);
    }
    ucam-stat .ucam-stat__label {
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    ucam-stat .ucam-stat__value {
      font-size: var(--ucam-typography-page-title-font-size);
      font-weight: var(--ucam-typography-page-title-font-weight);
      line-height: 1.5rem;
      letter-spacing: -0.02em;
      /* Valor monetário em coluna só se confere se os dígitos alinharem. */
      font-variant-numeric: tabular-nums;
    }
    ucam-stat .ucam-stat__delta {
      display: inline-flex;
      align-items: center;
      align-self: start;
      min-block-size: var(--ucam-size-marcador);
      padding: 0.1875rem 0;
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      font-variant-numeric: tabular-nums;
    }

    /* Figura e corpo — ver .ucam-stat--figura na folha do Trilho A. */
    ucam-stat .ucam-stat--figura {
      flex-direction: row;
      align-items: flex-start;
      gap: var(--ucam-space-inline-sm);
    }
    ucam-stat .ucam-stat__figura {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      inline-size: var(--ucam-size-control-md);
      block-size: var(--ucam-size-control-md);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-sunken);
      color: var(--ucam-color-text-secondary);
    }
    ucam-stat .ucam-stat__corpo {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-inline-size: 0;
      flex: 1 1 auto;
    }
    ucam-stat .ucam-stat__meta {
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }

    /* O arranjo em linha rende quatro ladrilhos numa faixa de 56px em vez de 96, e essa
       altura volta para a tabela logo abaixo. Só serve a contagem curta. */
    ucam-stat .ucam-stat--linha {
      flex-direction: row;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
    }
    ucam-stat .ucam-stat--linha .ucam-stat__label { margin-inline-end: auto; }
    ucam-stat .ucam-stat--linha .ucam-stat__value {
      font-size: var(--ucam-typography-section-title-font-size);
    }

    ucam-stat .ucam-stat__value--esqueleto {
      display: inline-block;
      inline-size: 4.5ch;
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-sunken);
      animation: ucam-stat-pulso 1.6s ease-in-out infinite;
    }
    @keyframes ucam-stat-pulso {
      50% { opacity: 0.55; }
    }
    @media (prefers-reduced-motion: reduce) {
      ucam-stat .ucam-stat__value--esqueleto { animation: none; }
    }

    ucam-stat .ucam-stat__erro {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-feedback-danger-foreground);
    }

    ucam-stat .ucam-sr-only {
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
export class UcamStat {
  /** A pergunta que o número responde. Frase nominal curta, sem dois-pontos. */
  readonly label = input.required<string>();
  /** O valor JÁ FORMATADO. O componente não formata — ver o cabeçalho. */
  readonly value = input.required<string | number>();
  /** Contexto de uma linha: recorte, comparação ou base. */
  readonly meta = input<string | null>(null);
  /** Variação desde a leitura anterior, com sinal explícito: +118, -4%. */
  readonly delta = input<string | null>(null);
  readonly tone = input<UcamStatTone>('neutral');
  readonly layout = input<UcamStatLayout>('stack');
  /** Ladrilho de ícone neutro à esquerda do bloco de texto. Decorativo (ADR-046). */
  readonly icon = input<UcamIconName | null>(null);
  /** @deprecated Desde 13/09/2026: use state="loading". Segue aceito como sinônimo. */
  readonly loading = input(false);
  /** loading, empty e error, no vocabulário da DataTable. Ver stat.json. */
  readonly state = input<UcamStatState>('idle');
  /**
   * O que mostrar quando não há dado. Um traço, não um zero: zero é um valor
   * e mentiria sobre a apuração.
   */
  readonly semDado = input('—');

  protected readonly cor = computed(() => TOM[this.tone()]);

  protected readonly carregando = computed(() => this.loading() || this.state() === 'loading');
  /** empty e error mostram o traço: não há número, e zero seria mentir. */
  protected readonly semValor = computed(() => this.state() === 'empty' || this.state() === 'error');

  protected readonly valorExibido = computed(() => {
    if (this.semValor()) return this.semDado();
    const v = this.value();
    return v === null || v === undefined || v === '' ? this.semDado() : v;
  });

  protected readonly classes = computed(
    () =>
      `ucam-stat${this.layout() === 'row' ? ' ucam-stat--linha' : ''}${this.icon() ? ' ucam-stat--figura' : ''}${this.tone() === 'neutral' ? '' : ' ucam-stat--' + this.tone()}`,
  );

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Tom sem palavra é cor como único portador de significado (WCAG
        // 1.4.1) — o defeito que a ADR-008 registra nos valores monetários do
        // SIGFIN. Quando o tom julga, `meta` é quem diz o julgamento em texto.
        if (this.tone() !== 'neutral' && !this.meta()?.trim()) {
          throw new Error(
            `[ucam-stat] tone="${this.tone()}" exige meta: é ela que diz em palavra o que a cor diz em tinta (WCAG 1.4.1). Ver spec/components/stat.json.`,
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
