import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/segmented.json
 *
 * Dois a quatro segmentos com um sempre escolhido e todas as opções visíveis.
 * É o toggle Sim/Não do SIGFIN e o recorte Todas/EAD/Presencial das listagens.
 *
 * O DEFEITO QUE ELE CORRIGE tem nome: no SIGFIN o par Sim/Não é dois botões
 * soltos, sem grupo e sem a pergunta. Quem usa leitor de tela ouve "Sim,
 * botão. Não, botão" e não sabe o que está respondendo. Por isso `ariaLabel` é
 * obrigatório aqui — não é enfeite de acessibilidade, é a pergunta.
 */
export interface UcamSegmentItem {
  id: string;
  label: string;
}

@Component({
  selector: 'ucam-segmented',
  exportAs: 'ucamSegmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    @if (label(); as l) {
      <span class="ucam-segmented__rotulo" [id]="idRotulo">{{ l }}</span>
    }
    <div
      [class]="classes()"
      role="group"
      [attr.aria-label]="label() ? null : ariaLabel()"
      [attr.aria-labelledby]="label() ? idRotulo : null"
    >
      @for (item of items(); track item.id) {
        <!-- type="button" é obrigatório: dentro de um formulário, botão sem
             type ENVIA o formulário ao ser clicado — e este componente existe
             justamente para viver dentro de formulários. -->
        <button
          type="button"
          [attr.aria-pressed]="item.id === value()"
          [disabled]="disabled()"
          (click)="escolher(item.id)"
        >
          {{ item.label }}
        </button>
      }
    </div>
  `,
  styles: `
    ucam-segmented .ucam-segmented__rotulo {
      display: block;
      margin-block-end: var(--ucam-space-1);
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-primary);
    }
    /* PARIDADE COM O TRILHO A, conferida em 09/09/2026 — e ela não existia.
       O CSS puro pintava o escolhido de action.primary.subtle sobre trilho
       transparente; aqui era cartão branco sobre trilho afundado. Mesmo
       componente, mesmo nome, dois desenhos: quem migrasse uma tela do Trilho
       A para o B via o controle trocar de aparência sem trocar de contrato.
       O desenho abaixo é o do build-css.mjs, linha a linha — ver o comentário
       de lá para o porquê da tinta cheia. */
    ucam-segmented .ucam-segmented {
      display: inline-flex;
      align-items: stretch;
      /* A altura é a do controle, para o segmented medir o mesmo que o input
         e o botão ao lado dele numa barra de ferramentas. */
      block-size: var(--ucam-size-control-md);
      gap: 0.125rem;
      padding: 0.1875rem;
      background: transparent;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    ucam-segmented .ucam-segmented button {
      display: inline-flex;
      align-items: center;
      padding: 0 0.75rem;
      /* A ALTURA DO SEGMENTO É A CAIXA DE CONTEÚDO DO TRILHO, declarada.
       *
       * Sem estas duas linhas os dois trilhos divergiam em 2px com TODO o resto
       * igual — trilho de 32, borda de 1, recuo de 3 e caixa border-box nos dois,
       * e mesmo assim 24px no Trilho A contra 26 no B. A causa é a base do Trilho
       * B: ela põe min-block-size no <button>, e mínimo vence tamanho usado, então
       * o segmento estourava a caixa do próprio trilho. Zerar o mínimo e declarar
       * a altura faz o segmento caber por construção nos dois. */
      block-size: 100%;
      min-block-size: 0;
      border: 0;
      border-radius: calc(var(--ucam-radius-control) - 0.1875rem);
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      line-height: 1;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition:
        background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
        color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    ucam-segmented .ucam-segmented button:hover:not(:disabled):not([aria-pressed='true']) {
      background: var(--ucam-color-surface-subtle);
      color: var(--ucam-color-text-primary);
    }
    /* A escolha não é comunicada só pela superfície (WCAG 1.4.1):
       aria-pressed carrega o estado, e o rótulo escolhido muda de TINTA e de
       peso além de ganhar plano.

       Era surface.inverse com text.on-action — 17,7:1, e o problema nunca foi
       o contraste: era a LÍNGUA. Quase preto fazia do filtro de ordenação a
       peça mais pesada da barra, mais escura que a ação primária ao lado, e
       era o único "escolhido" do sistema que não se dizia em bordô claro —
       item de navegação ativo, aba ativa e chip de filtro já se diziam assim.
       Ver o mesmo bloco em tools/build-css.mjs: os dois trilhos pintam o
       mesmo estado, ou não são o mesmo componente. */
    ucam-segmented .ucam-segmented button[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-subtle);
      color: var(--ucam-color-action-primary-default);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    /* O anel fica DENTRO do trilho e o trilho não o recorta. */
    ucam-segmented .ucam-segmented button:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: -1px;
    }
    ucam-segmented .ucam-segmented button:disabled {
      cursor: not-allowed;
      color: var(--ucam-color-text-disabled);
    }

    /* O TAMANHO MUDA O TRILHO, não o mínimo do botão.
       Era o contrário, e foi o que quebrou a paridade: --md punha
       min-block-size de 26px no <button>, mínimo vence tamanho usado, e o
       segmento estourava a caixa de conteúdo do trilho de 32px — 26 aqui
       contra 24 no Trilho A, com todo o resto idêntico. Medido em 09/09/2026
       com scratchpad/prova-segmented.mjs.

       O tipo também volta para body-sm nos dois tamanhos. O --md subia para
       body (14px), e como md é o padrão do componente, TODO consumidor do
       Trilho B lia 14px onde o Trilho A lia 13. */
    ucam-segmented .ucam-segmented--md {
      block-size: var(--ucam-size-control-md);
    }
    ucam-segmented .ucam-segmented--sm {
      block-size: var(--ucam-size-control-sm);
    }
    ucam-segmented .ucam-segmented--sm button {
      padding: 0 0.6rem;
    }

    @media (prefers-reduced-motion: reduce) {
      ucam-segmented .ucam-segmented button { transition: none; }
    }
  `,
})
export class UcamSegmented {
  /** De duas a quatro opções, do mais amplo ao mais restrito. */
  readonly items = input.required<readonly UcamSegmentItem[]>();
  /**
   * Two-way: [(value)]. Nunca fica vazio — grupo segmentado sem escolha não
   * tem estado neutro que faça sentido, e um trilho todo cinza parece
   * desabilitado.
   */
  readonly value = model.required<string>();
  /** O que está sendo escolhido: "Modalidade", "Ordenação da fila". */
  readonly ariaLabel = input.required<string>();
  /** Rótulo visível. Obrigatório dentro de formulário (ADR-004). */
  readonly label = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('md');
  /**
   * Desabilita o grupo INTEIRO. Não existe desabilitar um segmento: opção
   * indisponível some da lista, porque um segmento morto num trilho de três
   * ocupa um terço da largura sem oferecer nada.
   */
  readonly disabled = input(false);

  protected readonly idRotulo = `ucam-seg-${++seq}`;

  protected readonly classes = computed(() => `ucam-segmented ucam-segmented--${this.size()}`);

  protected escolher(id: string): void {
    if (this.disabled()) return;
    this.value.set(id);
  }

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        const n = this.items().length;
        if (n < 2 || n > 4) {
          throw new Error(
            `[ucam-segmented] recebeu ${n} segmentos; o contrato admite de 2 a 4. Acima de quatro, todas as opções visíveis deixam de caber e o componente é o select. Ver spec/components/segmented.json.`,
          );
        }
        // Valor fora da lista deixa o trilho inteiro sem escolhido — o estado
        // cinza que o contrato proíbe, e que lê como grupo desabilitado.
        if (!this.items().some((i) => i.id === this.value())) {
          throw new Error(
            `[ucam-segmented] value="${this.value()}" não é id de nenhum segmento: o grupo ficaria sem escolha.`,
          );
        }
      });
    }
  }
}

let seq = 0;

declare const ngDevMode: boolean;
