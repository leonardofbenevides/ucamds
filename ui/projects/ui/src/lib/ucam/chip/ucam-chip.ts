import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/chip.json
 *
 * A pastilha que torna visível um recorte já aplicado, com o botão que o
 * desfaz. Responde às duas perguntas que nenhuma tela do parque responde hoje:
 * o que está filtrando esta lista, e como tiro este filtro.
 *
 * SOBRE O FOCO DEPOIS DE REMOVER: o contrato manda o foco ir para o chip
 * seguinte, ou para o contêiner da fileira quando era o último. Isso NÃO cabe
 * aqui — o chip não conhece os irmãos. Quem sabe é a fileira, e por isso o
 * componente emite `remove` e para: a alternativa seria o chip procurar
 * `nextElementSibling` no DOM, que funciona até alguém pôr um separador entre
 * dois chips. A regra está registrada em `acessibilidade` do contrato e o
 * lugar de cumpri-la é a tela.
 */
export type UcamChipTone = 'brand' | 'neutral';

@Component({
  selector: 'ucam-chip',
  exportAs: 'ucamChip',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()">
      <!-- A dimensão vem ANTES do valor e com dois-pontos: "Setor: Secretaria".
           Sem ela, cinco chips numa fileira são cinco palavras soltas e não se
           sabe qual coluna cada uma peneira. -->
      @if (dimension(); as d) {
        <span class="ucam-chip__dimensao">{{ d }}:</span>
      }
      <span class="ucam-chip__rotulo">{{ label() }}</span>

      @if (removable()) {
        <button type="button" [attr.aria-label]="rotuloRemover()" (click)="remove.emit()">
          <!-- O x é decorativo; quem nomeia o botão é o aria-label. -->
          <ucam-icon name="x" size="xs" aria-hidden="true" />
        </button>
      }
    </span>
  `,
  styles: `
    ucam-chip .ucam-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      block-size: var(--ucam-size-marcador);
      padding-block: 0;
      padding-inline: 0.5rem 0.25rem;
      /* Contorno de controle, sem tinta da marca (ADR-022) — o mesmo
         desenho do Trilho A. */
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-pill);
      font-size: var(--ucam-typography-caption-font-size);
      white-space: nowrap;
    }
    /* Sem botão, o recuo à direita volta a ser o mesmo da esquerda: a folga
       menor existia para acomodar o x. */
    ucam-chip .ucam-chip--fixo { padding-inline: 0.5rem; }

    /* neutral é DADO, não escolha: o marcador de pertencimento que veio do
       registro (os campi de um coordenador), e por isso sem botão. Filete
       mais leve e texto secundário — sem poço cinza. */
    ucam-chip .ucam-chip--neutral {
      color: var(--ucam-color-text-secondary);
      border-color: var(--ucam-color-border-subtle);
    }

    ucam-chip .ucam-chip__dimensao { color: var(--ucam-color-text-secondary); }

    ucam-chip .ucam-chip button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.1rem;
      block-size: 1.1rem;
      border: 0;
      border-radius: var(--ucam-radius-pill);
      background: none;
      color: inherit;
      cursor: pointer;
      font: inherit;
    }
    /* O desenho tem 17,6px e o alvo precisa de 24px (WCAG 2.5.8). O ::after
       amplia a área sem engordar a pastilha — e é por isso que auditoria de
       alvo tem de usar elementFromPoint: getBoundingClientRect não enxerga
       área ampliada por pseudo-elemento. */
    ucam-chip .ucam-chip button::after {
      content: '';
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      translate: -50% -50%;
      inline-size: 1.5rem;
      block-size: 1.5rem;
    }
    /* Anel de foco no x. O Trilho A o recebe da regra geral .ucam :focus-visible;
       a biblioteca não carrega regra geral nenhuma, e o botão de remover só
       tinha anel dentro do site, que tem a sua (revisão de estados, 13/09/2026). */
    ucam-chip .ucam-chip button:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    ucam-chip .ucam-chip button:hover {
      background: color-mix(in srgb, currentColor 15%, transparent);
    }
  `,
})
export class UcamChip {
  /** O valor do recorte ou do marcador. */
  readonly label = input.required<string>();
  /** O nome da dimensão filtrada. Nulo no chip de pertencimento. */
  readonly dimension = input<string | null>(null);
  /**
   * Verdadeiro por padrão: o caso dominante é filtro aplicado. Falso no chip
   * que só marca pertencimento, onde um x prometeria desvincular a pessoa do
   * campus.
   */
  readonly removable = input(true);
  readonly tone = input<UcamChipTone>('brand');

  readonly remove = output<void>();

  protected readonly classes = computed(() => {
    const partes = ['ucam-chip'];
    if (this.tone() === 'neutral') partes.push('ucam-chip--neutral');
    if (!this.removable()) partes.push('ucam-chip--fixo');
    return partes.join(' ');
  });

  /**
   * Cinco botões chamados "Remover" são cinco alvos indistinguíveis para quem
   * navega por lista de controles. O nome carrega a dimensão e o valor.
   */
  protected readonly rotuloRemover = computed(() =>
    this.dimension()
      ? `Remover filtro ${this.dimension()}: ${this.label()}`
      : `Remover filtro ${this.label()}`,
  );

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // O x num marcador de pertencimento promete uma ação de escrita que a
        // lista não tem — desvincular a pessoa do campus.
        if (this.tone() === 'neutral' && this.removable()) {
          throw new Error(
            '[ucam-chip] tone="neutral" é marcador de pertencimento e não se remove: declare removable="false". Ver spec/components/chip.json.',
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
