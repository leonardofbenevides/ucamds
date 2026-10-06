import { Component, computed, inject, output } from '@angular/core';
import { UcamIcon, UcamProgress } from '@ucam/ui';
import { rotuloTipoProva, slugTipoProva } from '../../core/model/prova';
import { Posicao, ProvaStore } from '../../core/store/prova.store';

interface ItemMapa {
  slug: string;
  n: number;
  respondida: boolean;
  revisar: boolean;
  atual: boolean;
}
interface GrupoMapa {
  slug: string;
  rotulo: string;
  respondidas: number;
  itens: ItemMapa[];
}

/**
 * Navegação da prova: o cartão-resposta em miniatura. Cada questão diz seu
 * estado em FORMA e em palavra — a respondida é uma bolha cheia, a em branco
 * é uma bolha vazia, e o nome acessível diz qual é qual. A atual leva
 * aria-current e um anel por dentro do botão, que não briga com o anel de
 * foco do DS (por fora). A redação é um item do mesmo cartão, só que largo:
 * fala a mesma língua das bolhas em vez de ganhar um cabeçalho só dela. A
 * legenda, no pé, explica os desenhos, e o atalho "Próxima em branco" — a
 * única ação do painel — poupa a procura em prova longa.
 */
@Component({
  selector: 'app-mapa-questoes',
  imports: [UcamIcon, UcamProgress],
  template: `
    <nav class="ucam-stack" aria-label="Questões da prova">
      <div class="ucam-stack ucam-stack--sm">
        <ucam-progress
          label="Questões respondidas"
          [value]="store.respondidas()"
          [max]="store.totalObjetivas()"
          [tone]="store.respondidas() === store.totalObjetivas() ? 'success' : 'marca'"
          [valueText]="store.respondidas() + ' de ' + store.totalObjetivas() + ' respondidas'"
          [legendStart]="store.respondidas() + ' de ' + store.totalObjetivas() + ' respondidas'"
        />
        <!-- Botão nativo com as classes do DS, como as bolhas: o host do
             <ucam-button> é inline e não estica na coluna; o estilo deste
             componente não alcança o botão lá dentro. -->
        @if (store.respondidas() < store.totalObjetivas()) {
          <div data-proxima-em-branco data-atalho>
            <button type="button" class="ucam-btn ucam-btn--secondary ucam-btn--sm" (click)="irParaEmBranco()">
              Próxima em branco <ucam-icon name="arrowRight" size="sm" aria-hidden="true" />
            </button>
          </div>
        } @else if (store.marcadas() > 0) {
          <div data-proxima-marcada data-atalho>
            <button type="button" class="ucam-btn ucam-btn--secondary ucam-btn--sm" (click)="irParaMarcada()">
              Próxima marcada <ucam-icon name="arrowRight" size="sm" aria-hidden="true" />
            </button>
          </div>
        }
      </div>
      @for (g of grupos(); track g.slug) {
        <section class="ucam-stack ucam-stack--sm" [attr.aria-labelledby]="'mapa-' + g.slug">
          <h2 data-grupo [id]="'mapa-' + g.slug">
            <span>{{ g.rotulo }}</span>
            <span data-contagem>{{ g.respondidas }} de {{ g.itens.length }}</span>
          </h2>
          <ol data-mapa>
            @for (i of g.itens; track i.n) {
              <li>
                <button
                  type="button"
                  class="ucam-btn ucam-btn--secondary"
                  [attr.data-estado]="i.respondida ? 'respondida' : 'em-branco'"
                  [attr.data-revisar]="i.revisar ? 'true' : null"
                  [attr.data-questao]="i.slug + '/' + i.n"
                  [attr.aria-current]="i.atual ? 'page' : null"
                  [attr.aria-label]="'Questão ' + i.n + ', ' + (i.respondida ? 'respondida' : 'em branco') + (i.revisar ? ', marcada para revisar' : '')"
                  (click)="navegar.emit({ slug: i.slug, n: i.n })"
                >
                  {{ i.n }}
                  @if (i.revisar) {
                    <span data-marca aria-hidden="true"></span>
                  }
                </button>
              </li>
            }
          </ol>
        </section>
      }
      @if (store.redacao()) {
        <button
          type="button"
          class="ucam-btn ucam-btn--secondary"
          data-redacao
          [attr.data-estado]="redacaoEscrita() ? 'respondida' : 'em-branco'"
          [attr.aria-current]="naRedacao() ? 'page' : null"
          [attr.aria-label]="'Redação, ' + store.estadoRedacao()"
          (click)="navegar.emit('redacao')"
        >
          <span class="ucam-cluster"><ucam-icon name="pencil" size="sm" aria-hidden="true" /> Redação</span>
          <span data-contagem>{{ store.estadoRedacao() }}</span>
        </button>
      }
      <p data-legenda aria-hidden="true">
        <span class="ucam-cluster"><span data-amostra="respondida"></span>respondida</span>
        <span class="ucam-cluster"><span data-amostra="em-branco"></span>em branco</span>
        <span class="ucam-cluster"><span data-amostra="em-branco"><span data-marca></span></span>para revisar</span>
      </p>
    </nav>
  `,
  styles: `
    /* O atalho é a única ação do painel: ocupa a largura toda para ler como
       ação do cartão, não como um link solto. */
    [data-atalho] .ucam-btn {
      inline-size: 100%;
    }
    /* O cabeçalho do grupo é leve de propósito: numa coluna de 18rem, um
       título de seção com filete pesava mais que as bolhas que ele agrupa.
       Nome em papel label, contagem em caption secundária, nada de linha. */
    [data-grupo] {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ucam-space-inline-sm);
      margin: 0;
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      line-height: var(--ucam-typography-label-line-height);
      color: var(--ucam-color-text-primary);
    }
    [data-contagem] {
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-caption-font-weight);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    /* O cartão-resposta é uma GRADE de colunas fixas, não um cluster: assim
       a bolha 1 de Matemática cai embaixo da bolha 1 de Português, e o número
       de dois dígitos não muda a largura da fileira. */
    [data-mapa] {
      display: grid;
      grid-template-columns: repeat(auto-fill, var(--ucam-size-control-md));
      gap: var(--ucam-space-inline-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    [data-mapa] .ucam-btn {
      inline-size: var(--ucam-size-control-md);
      padding: 0;
      font-variant-numeric: tabular-nums;
    }
    /* EM BRANCO é a bolha vazia: só o contorno e a tinta secundária. */
    .ucam-btn[data-estado='em-branco'] {
      background: transparent;
      border-color: var(--ucam-color-border-default);
      color: var(--ucam-color-text-secondary);
    }
    .ucam-btn[data-estado='em-branco']:hover {
      background: var(--ucam-color-action-secondary-hover);
      color: var(--ucam-color-text-primary);
    }
    /* RESPONDIDA é a bolha cheia. O que separa as duas é cheio contra vazio e
       a luminância, não o matiz: sobrevive ao daltonismo e ao monitor fraco.
       Não é o botão primário da tela — é o estado "preenchida" do
       cartão-resposta, na tinta de ação porque é a mesma tinta com que a
       alternativa escolhida se desenha ao lado. */
    .ucam-btn[data-estado='respondida'] {
      background: var(--ucam-color-action-primary-default);
      border-color: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
    }
    .ucam-btn[data-estado='respondida']:hover {
      background: var(--ucam-color-action-primary-hover);
      border-color: var(--ucam-color-action-primary-hover);
    }
    .ucam-btn[data-estado='respondida'] [data-contagem] {
      color: var(--ucam-color-text-on-action);
    }
    /* ATUAL: um anel por DENTRO da bolha, na cor contrária ao fundo, e o
       peso de ação. Por dentro porque o anel de foco do DS mora por fora
       (outline com offset): os dois podem aparecer juntos sem se cobrir. A
       caixa não muda — a borda continua de 1px e o anel é sombra interna —,
       para a atual não parecer maior que as irmãs. */
    .ucam-btn[aria-current='page'] {
      font-weight: var(--ucam-typography-action-font-weight);
    }
    .ucam-btn[data-estado='em-branco'][aria-current='page'] {
      color: var(--ucam-color-text-primary);
      border-color: var(--ucam-color-text-primary);
      box-shadow: inset 0 0 0 1px var(--ucam-color-text-primary);
    }
    .ucam-btn[data-estado='respondida'][aria-current='page'] {
      box-shadow: inset 0 0 0 2px var(--ucam-color-text-on-action);
    }
    /* A REDAÇÃO é a bolha larga: mesma caixa, mesmos estados, com o nome e
       o estado em palavra nas duas pontas. */
    [data-redacao] {
      inline-size: 100%;
      justify-content: space-between;
      padding-inline: var(--ucam-space-inset-sm);
    }
    [data-redacao] > .ucam-cluster {
      --ucam-cluster-gap: var(--ucam-space-inline-xs);
      flex-wrap: nowrap;
    }
    /* A legenda, no pé: as bolhas em miniatura com a palavra ao lado. Em
       colunas, não em fileira: na coluna de 18rem as três não cabem numa
       linha, e a quebra do cluster deixava a terceira solta. */
    [data-legenda] {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
      margin: 0;
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    [data-legenda] > span {
      --ucam-cluster-gap: var(--ucam-space-inline-xs);
      flex-wrap: nowrap;
    }
    [data-amostra] {
      inline-size: 0.75rem;
      block-size: 0.75rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control-sm);
    }
    [data-amostra='respondida'] {
      background: var(--ucam-color-action-primary-default);
      border-color: var(--ucam-color-action-primary-default);
    }
    /* MARCADA PARA REVISAR: um ponto no canto da bolha, fora dela, com um
       filete da superfície em volta para ler sobre a bolha cheia e sobre a
       vazia. É forma (presença do ponto) e não troca a cor da bolha, para
       que respondida e em branco continuem se lendo por baixo da marca. O
       tom de atenção é o mesmo da barra de tempo no último terço. É um
       <span>, não um ::after: o DS já ocupa o ::after do botão. */
    [data-mapa] .ucam-btn,
    [data-amostra] {
      position: relative;
    }
    [data-marca] {
      position: absolute;
      inset-block-start: -0.25rem;
      inset-inline-end: -0.25rem;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-feedback-warning-graphic);
      box-shadow: 0 0 0 2px var(--ucam-color-surface-default);
    }
    [data-amostra] [data-marca] {
      inline-size: 0.375rem;
      block-size: 0.375rem;
      inset-block-start: -0.125rem;
      inset-inline-end: -0.125rem;
      box-shadow: 0 0 0 1px var(--ucam-color-surface-default);
    }
  `,
})
export class MapaQuestoes {
  readonly store = inject(ProvaStore);
  readonly navegar = output<Posicao | 'redacao'>();

  readonly naRedacao = computed(() => this.store.posicao() === null && !!this.store.redacao());
  /** A redação conta como "preenchida" no cartão quando chegou ao mínimo — antes disso é rascunho, e a bolha fica vazia. */
  readonly redacaoEscrita = computed(() => this.store.estadoRedacao() === 'mínimo atingido');

  readonly grupos = computed<GrupoMapa[]>(() => {
    const r = this.store.respostas();
    const m = this.store.revisar();
    const p = this.store.posicao();
    return this.store.objetivos().map((c) => {
      const slug = slugTipoProva(c.tipoprova);
      const itens = c.questoes.map((q, i) => ({
        slug,
        n: i + 1,
        respondida: !!r[q.oid],
        revisar: !!m[q.oid],
        atual: p?.slug === slug && p?.n === i + 1,
      }));
      return { slug, rotulo: rotuloTipoProva(c.tipoprova), respondidas: itens.filter((x) => x.respondida).length, itens };
    });
  });

  irParaEmBranco(): void {
    const p = this.store.proximaEmBranco();
    if (p) this.navegar.emit(p);
  }

  irParaMarcada(): void {
    const p = this.store.proximaMarcada();
    if (p) this.navegar.emit(p);
  }
}
