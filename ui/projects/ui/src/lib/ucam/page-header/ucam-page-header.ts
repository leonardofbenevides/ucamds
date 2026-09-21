import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

/**
 * Contrato: spec/components/page-header.json
 *
 * Implementação nossa. O Protocolo tem TRÊS posições para ação — texto cinza
 * no topo, botão acima da tabela, e rodapé do card. Este componente fixa uma:
 * ação da tela no cabeçalho, à direita do título.
 */
export interface UcamCrumb { label: string; link?: string; }

export type UcamPageHeaderVariante = 'pagina' | 'barra';

@Component({
  selector: 'ucam-page-header',
  exportAs: 'ucamPageHeader',
  imports: [NgTemplateOutlet, UcamIcon, UcamIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'hospedeiro()' },
  template: `
    <!--
      TRILHA. Três defeitos corrigidos de uma vez, e nenhum era decoração:

      1. Todos os degraus tinham a MESMA tinta apagada, links e página atual.
         Nada dizia quais eram clicáveis nem onde a pessoa estava — a trilha
         desenhava a hierarquia e escondia justamente a sua função.
      2. O separador era chevronRight em size="sm", ou seja 16px ao lado de um
         texto de 12px: o símbolo entre as palavras era maior que as palavras.
         Passa a ser uma barra tipográfica, que escala com o tipo em vez de
         brigar com ele.
      3. mb-1 colava a trilha no título. Ela é uma faixa própria, acima do
         cabeçalho, e precisa do respiro que a separa dele.
    -->
    <ng-template #trilha>
      <nav aria-label="Trilha">
        <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs m-0 p-0 list-none">
          @for (c of breadcrumb(); track c.label; let last = $last) {
            <li class="flex items-center gap-x-2">
              @if (c.link && !last) {
                <!--
                  Sublinhado em repouso, apagado, que acende no hover: cor
                  sozinha não distingue link de texto corrido (WCAG 1.4.1), e
                  a trilha é o lugar do sistema em que link e não-link ficam
                  colados na mesma linha.
                -->
                <a
                  [href]="c.link"
                  class="text-muted-foreground underline decoration-border decoration-1 underline-offset-[0.25em] rounded-sm transition-colors hover:text-foreground hover:decoration-current"
                  >{{ c.label }}</a
                >
              } @else {
                <!-- A página atual não é link e é a única em tinta cheia. -->
                <span class="font-medium text-foreground" [attr.aria-current]="last ? 'page' : null">{{
                  c.label
                }}</span>
              }
              <!--
                aria-hidden no separador: sem isso o leitor de tela lê "barra"
                entre cada degrau. A estrutura de lista já entrega a hierarquia.
              -->
              @if (!last) { <span class="text-border select-none" aria-hidden="true">/</span> }
            </li>
          }
        </ol>
      </nav>
    </ng-template>

    <!-- Um <ng-content> só: projeção não se repete entre ramos de @if, e as
         ações vivem na linha do título nas duas variantes. -->
    <ng-template #acoes><ng-content /></ng-template>

    @if (variante() === 'barra') {
      <!--
        BARRA DE VISÃO — as fileiras do .ucam-viewbar do Trilho A, com as
        mesmas medidas: trilha de 36px, título de 44px no papel de página
        (22px), e ferramentas e filtros aplicados que só existem quando a tela
        projeta algo neles. Entre as fileiras não há fio; o único é o que
        fecha a barra contra o conteúdo, e ele mora no hospedeiro.
      -->
      @if (breadcrumb()?.length) {
        <div class="flex items-center min-h-9 pt-1 px-6 text-xs">
          <ng-container [ngTemplateOutlet]="trilha" />
        </div>
      }
      <div class="flex items-center gap-2 min-h-11 px-6">
        @if (backLink()) {
          <a
            [href]="backLink()"
            aria-label="Voltar ao nível anterior"
            class="inline-flex items-center justify-center size-8 -ms-2 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ucam-icon name="arrowLeft" size="md" />
          </a>
        }
        <!-- A contagem vai DENTRO do h1: quem ouve recebe "Setores, 58" numa
             leitura só, em vez de uma frase de apoio que gastava uma linha. -->
        <h1
          class="flex items-baseline gap-2 min-w-0 m-0 text-[length:var(--ucam-typography-page-title-font-size)] leading-[var(--ucam-typography-page-title-line-height)] tracking-[var(--ucam-typography-page-title-letter-spacing)] font-semibold"
        >
          <span class="truncate">{{ title() }}</span>
          @if (count() !== null) {
            <span class="sr-only">, </span>
            <span class="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{{ count() }}</span>
          }
        </h1>
        @if (favorite() !== null) {
          <ucam-icon-button
            class="ucam-viewbar__favorito"
            icon="star"
            size="sm"
            [pressed]="favorite()"
            [label]="favorite() ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
            (click)="favorite.set(!favorite())"
          />
        }
        <div class="flex items-center gap-2 ms-auto shrink-0"><ng-container [ngTemplateOutlet]="acoes" /></div>
      </div>
      <!-- Ferramentas: abas de fila à esquerda, ordenação e filtros à direita. -->
      <div class="flex flex-wrap items-center gap-2 min-h-11 px-6 empty:hidden"><ng-content select="[ucamFerramentas]" /></div>
      <!-- Filtros aplicados: condicional no markup de quem chama, nunca
           escondida por CSS — sem chip, a fileira não existe. -->
      <div class="flex flex-wrap items-center gap-2 min-h-10 px-6 border-t border-border empty:hidden"><ng-content select="[ucamFiltros]" /></div>
    } @else {
    @if (breadcrumb()?.length) {
      <div class="mb-2"><ng-container [ngTemplateOutlet]="trilha" /></div>
    }

    <div class="flex flex-wrap items-baseline justify-between gap-4 pb-4 mb-6 border-b border-border">
      <div class="flex flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <!--
            backLink era input declarado no contrato e no componente, e não
            era renderizado por nenhum dos dois: API morta que a demo do site
            não exercitava. Fica ANTES do título, na mesma linha, porque a
            volta é sobre esta tela — no topo da faixa ela viraria um segundo
            degrau de trilha e diria duas vezes a mesma coisa.
          -->
          @if (backLink()) {
            <a
              [href]="backLink()"
              aria-label="Voltar ao nível anterior"
              class="inline-flex items-center justify-center size-8 -ms-2 shrink-0 self-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ucam-icon name="arrowLeft" size="md" />
            </a>
          }
          <h1 class="text-2xl font-semibold tracking-tight m-0">{{ title() }}</h1>
          @if (count() !== null) {
            <span class="text-sm text-muted-foreground tabular-nums">{{ count() }}</span>
          }
          <!--
            A ESTRELA do registro: interruptor de ícone colado ao título, e
            não no bloco de ações — favoritar não é ação sobre a tela, é
            atributo do registro. Só existe quando favorite não é null; numa
            listagem, favoritar seria favoritar a tela, e isso é assunto do
            grupo Favoritos do app-shell. O nome acessível diz o EFEITO do
            clique, e o estado vai em aria-pressed pelo icon-button.
          -->
          @if (favorite() !== null) {
            <ucam-icon-button
              class="ucam-page-header__favorito self-center"
              icon="star"
              size="sm"
              [pressed]="favorite()"
              [label]="favorite() ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
              (click)="favorite.set(!favorite())"
            />
          }
        </div>
        @if (description()) {
          <p class="text-sm text-muted-foreground m-0 max-w-[68ch]">{{ description() }}</p>
        }
      </div>
      <div class="flex items-center gap-2"><ng-container [ngTemplateOutlet]="acoes" /></div>
    </div>
    }
  `,
})
export class UcamPageHeader {
  /**
   * pagina é o cabeçalho alto, para tela que se lê como documento. barra é a
   * barra de visão da tela de trabalho — sempre grudada no alto do painel.
   */
  readonly variante = input<UcamPageHeaderVariante>('pagina');
  readonly title = input.required<string>();
  readonly count = input<number | null>(null);
  readonly description = input<string | null>(null);
  readonly breadcrumb = input<UcamCrumb[] | null>(null);
  readonly backLink = input<string | null>(null);
  readonly sticky = input(false, { transform: booleanAttribute });
  /**
   * null esconde a estrela: o registro não é favoritável. Two-way —
   * [(favorite)]; quem persiste é quem chama.
   */
  readonly favorite = model<boolean | null>(null);

  protected readonly hospedeiro = computed(() => {
    if (this.variante() === 'barra') return 'block sticky top-0 z-10 bg-background border-b border-border';
    return this.sticky() ? 'block sticky top-0 z-10 bg-background' : 'block';
  });
}
