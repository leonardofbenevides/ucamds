import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { ZardChartImports } from '@/shared/components/chart/chart.imports';
import type { ZardChartConfig, ZardChartSeries as ZardSeriesDef } from '@/shared/components/chart/chart.types';
import { UcamButton } from '../button/ucam-button';
import { UcamEmptyState } from '../empty-state/ucam-empty-state';
import { UcamSkeleton } from '../skeleton/ucam-skeleton';

/**
 * Contrato: spec/components/chart.json
 *
 * Envelope sobre o z-chart (ECharts). O que este wrapper acrescenta e a base
 * não dá:
 *
 *  - a tabela equivalente, SEMPRE no DOM. O ECharts desenha vetor, e vetor não
 *    é lido por voz nem sobrevive à impressão em preto e branco;
 *  - a paleta por slot, em ordem fixa. A base CICLA as cores a partir do quinto
 *    item (`var(--chart-${i % 5 + 1})`), e ciclar é justamente o que quebra a
 *    verificação de daltonismo — aqui a sétima série não recebe cor nenhuma;
 *  - formatação pt-BR por Intl no eixo, na dica e na tabela — os três juntos;
 *  - animação desligada sob prefers-reduced-motion;
 *  - releitura das cores quando o tema muda pelo data-theme do DSUCAM, que é
 *    outro caminho que não o serviço de tema da própria base.
 */
export type UcamChartType = 'line' | 'area' | 'bar' | 'pie';

/** O mesmo vocabulário da DataTable. Ver chart.json, state. */
export type UcamChartState = 'idle' | 'loading' | 'empty' | 'error';

/** Um slot é uma posição na paleta categórica, não uma cor escolhida a olho. */
export type UcamChartSlot = 1 | 2 | 3 | 4 | 5 | 6;

export interface UcamChartSeries {
  /** Chave da linha que carrega o valor desta série. */
  key: string;
  /** Nome na legenda, na dica e no cabeçalho da coluna da tabela. */
  name: string;
  /**
   * Fixa o slot de cor. Use quando um filtro puder mudar quantas séries
   * aparecem: sem isso, tirar uma série repinta as que ficaram, e cor que
   * troca lê como identidade que trocou.
   */
  slot?: UcamChartSlot;
  /** Nome do grupo de empilhamento, para empilhar só um subconjunto. */
  stack?: string;
}

export type UcamChartRow = Record<string, string | number | null | undefined>;

/** Quantos slots a paleta verificada tem. Não é constante de conveniência. */
const SLOTS = 6;

/**
 * Teto das formas em que TODA cor se compara com TODA outra — pizza, dispersão,
 * pequenos múltiplos. Em barra e linha vale o teto de seis, porque ali o que se
 * compara são vizinhos, e vizinho tem portão (tools/check-daltonismo.mjs).
 *
 * O valor 3 é MEDIDO, não estimado — mas com um desvio nomeado. Tetos por
 * condição, com a ordem de slots da ADR-016:
 *
 *              claro   escuro
 *   normal        6       6
 *   deuteranopia  3       3
 *   protanopia    5       3
 *   tritanopia    4       2
 *
 * Três passa em tudo, menos em tritanopia no tema escuro, onde wine.400 e
 * ochre.400 caem a d=0,038. Continua 3 porque a leitura do gráfico sem cor não
 * depende da paleta: a tabela equivalente está sempre no DOM (ADR-014), e a
 * tritanopia atinge cerca de 1 em 10 mil. Baixar para 2 tiraria a pizza de
 * três fatias do design system inteiro para cobrir um caso que a tabela já
 * cobre. É troca consciente, e está escrita para poder ser revista.
 *
 * A justificativa anterior desta constante dizia "o par turquesa/azul cai
 * abaixo do piso de visão normal". Estava errada nas duas metades: o par que
 * cai é wine/ochre, e cai sob tritanopia, não à vista normal.
 */
const SLOTS_TODOS_OS_PARES = 3;

const cor = (slot: number) => `var(--ucam-color-chart-series-${slot})`;

@Component({
  selector: 'ucam-chart',
  exportAs: 'ucamChart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardChartImports, UcamButton, UcamEmptyState, UcamSkeleton],
  host: { class: 'ucam-chart flex flex-col gap-3' },
  template: `
    <figure class="m-0 flex flex-col gap-2" [attr.aria-label]="label()" [attr.aria-busy]="state() === 'loading' ? 'true' : null">
      <!-- O desenho é aria-hidden por consequência do contrato: quem lê por voz
           recebe a TABELA, não uma sequência de caminhos SVG. -->
      @if (state() === 'idle') {
      <div class="ucam-chart__plot" [class]="alturaClasse()" aria-hidden="true">
        <z-chart
          class="w-full h-full"
          [zType]="tipoBase()"
          [zData]="data()"
          [zSeries]="seriesBase()"
          [zConfig]="config()"
          [zXAxisKey]="type() === 'pie' ? undefined : categoryKey()"
          [zNameKey]="type() === 'pie' ? categoryKey() : undefined"
          [zStacked]="stacked()"
          [zHorizontal]="horizontal() && type() === 'bar'"
          [zYAxis]="type() !== 'pie'"
          [zYAxisFormatter]="formata"
          [zAnimation]="anima()"
          [zAccessibility]="false"
          [zOption]="opcao()"
          zRenderer="svg"
        >
          <z-chart-tooltip
            [zTrigger]="type() === 'pie' || type() === 'bar' ? 'item' : 'axis'"
            [zIndicator]="type() === 'bar' || type() === 'pie' ? 'dot' : 'line'"
            [zValueFormatter]="formataDica"
          />
          @if (mostraLegenda()) {
            <z-chart-legend />
          }
        </z-chart>
      </div>
      } @else if (state() === 'loading') {
        <!-- Na altura do plot: a página não salta quando o desenho chega. -->
        <div class="ucam-chart__plot flex flex-col" [class]="alturaClasse()">
          <ucam-skeleton variant="block" class="flex-1 [&>*]:!h-full" />
          <span class="sr-only">Carregando {{ label() }}</span>
        </div>
      } @else if (state() === 'empty') {
        <ucam-empty-state reason="no-data" size="sm" title="Nenhum dado para mostrar" [description]="label()" />
      } @else {
        <ucam-empty-state reason="error" size="sm" title="Não foi possível carregar o gráfico">
          <ucam-button variant="secondary" (click)="retry.emit()">Tentar novamente</ucam-button>
        </ucam-empty-state>
      }

      @if (state() === 'idle' && excedentes().length) {
        <!-- Nada é escondido em silêncio: o desenho para em seis, e a tabela
             continua com tudo. Mensagem visível porque isto é para ser
             corrigido, não tolerado. -->
        <p class="text-xs text-[var(--ucam-color-feedback-warning-foreground)] m-0">
          {{ excedentes().length }} série(s) além das {{ SLOTS }} da paleta não aparecem no desenho — {{ nomesExcedentes() }}. Estão na
          tabela abaixo. Agrupe em “Outros” ou separe em mais de um gráfico.
        </p>
      }

      <figcaption class="sr-only">{{ label() }}</figcaption>
    </figure>

    @if (state() === 'idle') {
    <details class="ucam-chart__tabela" [open]="showTable()">
      <summary class="text-sm text-[var(--ucam-color-text-link)] cursor-pointer">Ver os mesmos dados em tabela</summary>
      <div class="mt-2 overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <caption class="sr-only">{{ label() }}</caption>
          <thead>
            <tr>
              <th scope="col" class="text-start p-2 border-b border-[var(--ucam-color-border-subtle)]">{{ categoriaTitulo() }}</th>
              @for (s of series(); track s.key) {
                <th scope="col" class="text-start p-2 border-b border-[var(--ucam-color-border-subtle)]">
                  {{ s.name }}{{ unit() ? ' (' + unit() + ')' : '' }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (linha of data(); track $index) {
              <tr>
                <th scope="row" class="text-start p-2 font-medium border-b border-[var(--ucam-color-border-subtle)]">
                  {{ linha[categoryKey()] }}
                </th>
                @for (s of series(); track s.key) {
                  <td class="p-2 tabular-nums border-b border-[var(--ucam-color-border-subtle)]">{{ celula(linha, s.key) }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </details>
    }
  `,
})
export class UcamChart {
  readonly type = input<UcamChartType>('line');
  readonly data = input.required<readonly UcamChartRow[]>();
  readonly series = input.required<readonly UcamChartSeries[]>();
  readonly categoryKey = input.required<string>();
  /** Vira o nome acessível da figura: medida, recorte e período. */
  readonly label = input.required<string>();
  readonly unit = input<string | null>(null);
  /**
   * Título da coluna de categoria na tabela. Derivar da chave não serve: "mes"
   * vira "Mes", sem acento, e cabeçalho de tabela é CONTEÚDO — sai errado em
   * português e é lido em voz alta assim.
   */
  readonly categoryLabel = input<string | null>(null);
  readonly stacked = input(false, { transform: booleanAttribute });
  readonly horizontal = input(false, { transform: booleanAttribute });
  readonly height = input<'sm' | 'md' | 'lg'>('md');
  /** Só recolhe a tabela num details — ela nunca deixa de existir no DOM. */
  readonly showTable = input(true, { transform: booleanAttribute });
  readonly valueFormatter = input<((value: number) => string) | null>(null);
  /** idle, loading, empty e error — o vocabulário da DataTable. Ver chart.json, state. */
  readonly state = input<UcamChartState>('idle');
  /** Pedido de nova carga, do "Tentar novamente" do erro. O componente não busca dados. */
  readonly retry = output<void>();

  protected readonly SLOTS = SLOTS;

  private readonly document = inject(DOCUMENT);
  private readonly ehNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Muda de valor a cada troca de tema. Não carrega a cor: existe para dar uma
   * IDENTIDADE nova ao objeto de config, que é o que faz a base reler as
   * custom properties. O serviço de tema da ZardUI não enxerga o data-theme que
   * o DSUCAM escreve, então quem observa é o wrapper.
   */
  private readonly tema = signal(0);

  constructor() {
    if (this.ehNavegador) {
      const raiz = this.document.documentElement;
      const observador = new MutationObserver(() => this.tema.update((n) => n + 1));
      observador.observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });

      const sistema = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
      const aoMudar = () => this.tema.update((n) => n + 1);
      sistema?.addEventListener('change', aoMudar);

      effect((onCleanup) => {
        onCleanup(() => {
          observador.disconnect();
          sistema?.removeEventListener('change', aoMudar);
        });
      });
    }
  }

  /** Quantos slots esta forma pode gastar. */
  private readonly teto = computed(() => (this.type() === 'pie' ? SLOTS_TODOS_OS_PARES : SLOTS));

  protected readonly excedentes = computed(() => this.series().slice(this.teto()));
  protected readonly nomesExcedentes = computed(() => this.excedentes().map((s) => s.name).join(', '));

  /** As que cabem no desenho. */
  private readonly desenhadas = computed(() => this.series().slice(0, this.teto()));

  protected readonly tipoBase = computed(() => this.type());

  protected readonly seriesBase = computed<ZardSeriesDef[]>(() =>
    this.desenhadas().map((s) => ({
      dataKey: s.key,
      ...(s.stack ? { stack: s.stack } : {}),
      // Linha reta, não suavizada: a curva inventa valores entre os pontos.
      smooth: false,
    })),
  );

  /**
   * A cor entra aqui e em nenhum outro lugar — a aplicação não escolhe cor, só
   * o slot. Em pizza a chave é a CATEGORIA, porque ali a cor é por fatia; nas
   * demais é a chave da série.
   */
  protected readonly config = computed<ZardChartConfig>(() => {
    this.tema();

    if (this.type() === 'pie') {
      const chave = this.categoryKey();
      return Object.fromEntries(
        this.data()
          .slice(0, SLOTS_TODOS_OS_PARES)
          .map((linha, i) => [String(linha[chave]), { label: String(linha[chave]), color: cor(i + 1) }]),
      );
    }

    return Object.fromEntries(
      this.desenhadas().map((s, i) => [s.key, { label: s.name, color: cor(s.slot ?? i + 1) }]),
    );
  });

  /**
   * A base desenha para o gosto do shadcn, que NÃO mostra eixo de valor — por
   * isso ela zera a margem esquerda da grade. Com o eixo ligado (e ele é ligado
   * aqui de propósito: "gráfico sem eixo rotulado" é uma das falhas que a
   * evidência do parque registra), os rótulos saíam cortados na borda.
   * A base já pede outerBoundsContain: 'axisLabel', e ele reserva QUASE tudo:
   * medido no navegador, os rótulos ainda começavam 4px fora da borda do SVG e
   * o primeiro dígito de "300" sumia. containLabel não corrige — o modo de
   * outerBounds da base tem precedência sobre ele. O que corrige é afastar a
   * grade da borda; a largura do rótulo continua sendo reservada pelo
   * outerBounds, então "R$ 1.234.567" também cabe.
   */
  protected readonly opcao = computed(() =>
    this.type() === 'pie' ? {} : { grid: { left: 8, right: 8 } },
  );

  /** Uma série só é nomeada pelo rótulo do gráfico; a caixa de legenda seria ruído. */
  protected readonly mostraLegenda = computed(() => this.type() === 'pie' || this.desenhadas().length > 1);

  protected readonly alturaClasse = computed(
    () => ({ sm: 'h-32', md: 'h-48', lg: 'h-72' })[this.height()],
  );

  /** Sem transição de entrada quando o sistema pede movimento reduzido (2.3.3). */
  protected readonly anima = computed(
    () => !this.ehNavegador || !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  protected readonly categoriaTitulo = computed(() => {
    const dado = this.categoryLabel();
    if (dado) return dado;
    const k = this.categoryKey();
    return k.charAt(0).toUpperCase() + k.slice(1);
  });

  private readonly numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

  /** Passada por referência ao eixo e reaproveitada pela tabela: um formato só. */
  protected readonly formata = (valor: number): string => this.valueFormatter()?.(valor) ?? this.numero.format(valor);

  protected readonly formataDica = (valor: number): string => this.formata(valor);

  protected celula(linha: UcamChartRow, chave: string): string {
    const v = linha[chave];
    // Ausência é ausência: buraco na série não vira zero nem na tabela.
    if (v === null || v === undefined || v === '') return '—';
    return typeof v === 'number' ? this.formata(v) : String(v);
  }
}
