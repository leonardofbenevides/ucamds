import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/pagination.json
 *
 * Padrão único para todo o sistema, substituindo as DUAS paginações
 * incompatíveis que hoje convivem no Protocolo.
 *
 * O contrato marca como BLOQUEANTE do legado o que aqui é obrigatório: cada
 * controle tem nome acessível explícito, e o glifo é aria-hidden. No parque
 * atual as setas são caracteres soltos — "«" e "»" — que o leitor de tela
 * anuncia como aspas francesas ou como nada.
 *
 * O componente NÃO PAGINA a lista: ele emite a página nova e a tela busca. Um
 * paginador que fatiasse o array só serviria a lista já inteira em memória,
 * que é o oposto do caso (14 mil requerimentos).
 */

/** Marca de elisão. Não é número e não é focável. */
const ELIPSE = '…';

@Component({
  selector: 'ucam-pagination',
  exportAs: 'ucamPagination',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <nav class="ucam-pagination" [attr.aria-label]="'Paginação de ' + itemLabel()">
      <!-- O intervalo é região viva: mudar de página muda a lista acima, e sem
           anúncio a troca acontece em silêncio para quem não vê a tela. É aqui
           que o foco deve ir depois da troca — não para o topo da página. -->
      <p class="ucam-pagination__range" aria-live="polite" tabindex="-1" #resumo>
        {{ intervalo() }}
      </p>

      <div class="ucam-pagination__salto">
        @for (c of controles(); track c.acao) {
          <button
            type="button"
            class="ucam-pagination__page"
            [attr.aria-label]="c.rotulo"
            [attr.aria-disabled]="c.inerte || null"
            (click)="irPara(c.destino)"
          >
            <ucam-icon [name]="c.icone" size="sm" aria-hidden="true" />
          </button>
        }
      </div>

      @for (p of paginas(); track $index) {
        @if (p === null) {
          <span class="ucam-pagination__elipse" aria-hidden="true">{{ elipse }}</span>
        } @else {
          <button
            type="button"
            class="ucam-pagination__page"
            [attr.aria-label]="'Página ' + p + ' de ' + totalPaginas()"
            [attr.aria-current]="p === page() ? 'page' : null"
            (click)="irPara(p)"
          >
            {{ p }}
          </button>
        }
      }
    </nav>
  `,
  styles: `
    ucam-pagination .ucam-pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
    }
    ucam-pagination .ucam-pagination__range {
      color: var(--ucam-color-text-secondary);
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
      margin: 0;
      margin-inline-end: auto;
    }
    ucam-pagination .ucam-pagination__range:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
      border-radius: var(--ucam-radius-sm);
    }
    ucam-pagination .ucam-pagination__salto {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
    }
    ucam-pagination .ucam-pagination__page {
      min-inline-size: var(--ucam-size-control-sm);
      min-block-size: var(--ucam-size-control-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--ucam-space-inline-sm);
      background: none;
      border: 1px solid transparent;
      border-radius: var(--ucam-radius-md);
      color: var(--ucam-color-text-secondary);
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }
    /* Mesma razão do x do chip: no Trilho A o anel vem de .ucam :focus-visible,
       e a biblioteca não carrega regra geral. Sem isto o número da página só
       tinha anel dentro do site (revisão de estados, 13/09/2026). */
    ucam-pagination .ucam-pagination__page:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    ucam-pagination .ucam-pagination__page:hover:not([aria-disabled='true']) {
      background: var(--ucam-color-action-secondary-hover);
      color: var(--ucam-color-text-primary);
    }
    ucam-pagination .ucam-pagination__page[aria-current='page'] {
      background: var(--ucam-color-action-primary-subtle);
      border-color: color-mix(in srgb, var(--ucam-color-action-primary-default) 40%, transparent);
      color: var(--ucam-color-action-primary-default);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    /* aria-disabled, e não o atributo disabled: o controle continua FOCÁVEL.
       Botão desabilitado some da ordem de tabulação, e quem chega à primeira
       página perde de vista onde os controles estavam. */
    ucam-pagination .ucam-pagination__page[aria-disabled='true'] {
      color: var(--ucam-color-text-disabled);
      cursor: not-allowed;
    }
    ucam-pagination .ucam-pagination__elipse {
      color: var(--ucam-color-text-disabled);
      padding-inline: 0.25rem;
    }
  `,
})
export class UcamPagination {
  /** Página atual, base 1. Two-way: [(page)]. */
  readonly page = model.required<number>();
  readonly pageSize = input(25);
  /** Total de ITENS, não de páginas. */
  readonly total = input.required<number>();
  /** Substantivo no plural: requerimentos, setores. */
  readonly itemLabel = input('itens');
  /** Quantos números aparecem antes de elidir. */
  readonly windowSize = input(5);
  /** Durante carregamento, para impedir disparo duplo. */
  readonly disabled = input(false);

  protected readonly elipse = ELIPSE;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly intervalo = computed(() => {
    const t = this.total();
    if (t === 0) return `Nenhum resultado`;
    const de = (this.page() - 1) * this.pageSize() + 1;
    const ate = Math.min(this.page() * this.pageSize(), t);
    return `${de}–${ate} de ${t} ${this.itemLabel()}`;
  });

  protected readonly controles = computed(() => {
    const p = this.page();
    const ultima = this.totalPaginas();
    const inercia = this.disabled();
    return [
      { acao: 'primeira', icone: 'chevronsLeft' as const, rotulo: 'Primeira página', destino: 1, inerte: inercia || p === 1 },
      { acao: 'anterior', icone: 'chevronLeft' as const, rotulo: 'Página anterior', destino: p - 1, inerte: inercia || p === 1 },
      { acao: 'proxima', icone: 'chevronRight' as const, rotulo: 'Próxima página', destino: p + 1, inerte: inercia || p === ultima },
      { acao: 'ultima', icone: 'chevronsRight' as const, rotulo: 'Última página', destino: ultima, inerte: inercia || p === ultima },
    ];
  });

  /**
   * A janela de números. `null` é a elipse. A primeira e a última página estão
   * SEMPRE presentes: são os dois destinos que alguém procura de cor, e
   * escondê-los atrás de uma elipse obriga a clicar em "próxima" quatorze
   * vezes.
   */
  protected readonly paginas = computed<readonly (number | null)[]>(() => {
    const ultima = this.totalPaginas();
    const janela = Math.max(3, this.windowSize());
    if (ultima <= janela + 2) return Array.from({ length: ultima }, (_, i) => i + 1);

    const p = this.page();
    const lado = Math.floor((janela - 1) / 2);
    let de = Math.max(2, p - lado);
    let ate = Math.min(ultima - 1, de + janela - 1);
    de = Math.max(2, ate - janela + 1);

    const saida: (number | null)[] = [1];
    if (de > 2) saida.push(null);
    for (let i = de; i <= ate; i++) saida.push(i);
    if (ate < ultima - 1) saida.push(null);
    saida.push(ultima);
    return saida;
  });

  protected irPara(destino: number): void {
    if (this.disabled()) return;
    const alvo = Math.min(Math.max(destino, 1), this.totalPaginas());
    if (alvo === this.page()) return;
    this.page.set(alvo);
  }
}
