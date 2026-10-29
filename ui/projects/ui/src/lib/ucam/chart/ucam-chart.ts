import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { ZardChartImports } from '../../shared/components/chart/chart.imports';
import type { ZardChartConfig, ZardChartOptionOverride, ZardChartSeries as ZardSeriesDef } from '../../shared/components/chart/chart.types';
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
 *  - releitura das cores quando o tema muda pelo data-theme do UCAMDS, que é
 *    outro caminho que não o serviço de tema da própria base.
 */
export type UcamChartType = 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'funnel' | 'sparkline' | 'heatmap' | 'scatter' | 'dumbbell';

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
  /**
   * Formato desta série, quando difere do gráfico: na dispersão as duas
   * medidas têm grandeza diferente (frequência em %, nota de 0 a 10).
   */
  format?: (value: number) => string;
  /** Unidade desta série no cabeçalho da tabela e no nome do eixo. */
  unit?: string;
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
/** O cinza de contexto: a série que não é o assunto (emphasis) e o "antes" do dumbbell. */
const CINZA = 'var(--ucam-color-border-strong)';
const SUPERFICIE = 'var(--ucam-color-surface-raised)';
const TINTA = 'var(--ucam-color-text-secondary)';
const FIO = 'var(--ucam-color-border-subtle)';

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
          [zData]="livre() ? [] : dadosBase()"
          [zSeries]="livre() ? [] : seriesBase()"
          [zConfig]="config()"
          [zXAxisKey]="fatia() || livre() ? undefined : categoryKey()"
          [zNameKey]="fatia() ? categoryKey() : undefined"
          [zStacked]="stacked() || proporcao()"
          [zHorizontal]="horizontal() && type() === 'bar'"
          [zYAxis]="!fatia() && !livre() && type() !== 'sparkline'"
          [zYAxisFormatter]="formata"
          [zAnimation]="anima()"
          [zAccessibility]="false"
          [zOption]="opcao()"
          zRenderer="svg"
        >
          <z-chart-tooltip
            [zTrigger]="fatia() || livre() || type() === 'bar' ? 'item' : 'axis'"
            [zIndicator]="type() === 'bar' || fatia() ? 'dot' : 'line'"
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
                  {{ s.name }}{{ (s.unit ?? unit()) ? ' (' + (s.unit ?? unit()) + ')' : '' }}
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
                  <td class="p-2 tabular-nums border-b border-[var(--ucam-color-border-subtle)]">{{ celula(linha, s.key, s) }}</td>
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
  /**
   * Barra 100%: a fatia de cada parte em cada categoria. Empilha e normaliza;
   * a tabela continua com os números, e a dica dá a porcentagem.
   */
  readonly proportional = input(false, { transform: booleanAttribute });
  /**
   * Chave da série que é o ASSUNTO (forma de ênfase, linha e barra): ela fica
   * com a cor do slot, e as outras vão para o cinza de contexto.
   */
  readonly emphasis = input<string | null>(null);
  readonly height = input<'xs' | 'sm' | 'md' | 'lg'>('md');
  /** Só recolhe a tabela num details — ela nunca deixa de existir no DOM. */
  readonly showTable = input(true, { transform: booleanAttribute });
  readonly valueFormatter = input<((value: number) => string) | null>(null);
  /** idle, loading, empty e error — o vocabulário da DataTable. Ver chart.json, state. */
  readonly state = input<UcamChartState>('idle');
  /** Pedido de nova carga, do "Tentar novamente" do erro. O componente não busca dados. */
  readonly retry = output<void>();

  protected readonly SLOTS = SLOTS;

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ehNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Muda de valor a cada troca de tema. Não carrega a cor: existe para dar uma
   * IDENTIDADE nova ao objeto de config, que é o que faz a base reler as
   * custom properties. O serviço de tema da ZardUI não enxerga o data-theme que
   * o UCAMDS escreve, então quem observa é o wrapper.
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
  /** Rosca e funil são pizza para o ZardUI: cor por fatia, nome por categoria. */
  protected readonly fatia = computed(() => this.type() === 'pie' || this.type() === 'donut' || this.type() === 'funnel');

  /**
   * Heatmap, dispersão e dumbbell (29/10/2026) não têm forma na base: o wrapper
   * entrega a opção inteira pelo zOption, com dados e séries da base vazios. A
   * fusão do zOption é por índice e um vetor vazio na base deixa o override
   * valer por inteiro.
   */
  protected readonly livre = computed(() => this.type() === 'heatmap' || this.type() === 'scatter' || this.type() === 'dumbbell');

  protected readonly proporcao = computed(() => this.proportional() && this.type() === 'bar');

  /** Na barra 100% cada valor vira a fatia do total da linha. */
  protected readonly dadosBase = computed<readonly UcamChartRow[]>(() => {
    if (!this.proporcao()) return this.data();
    const chaves = this.desenhadas().map((s) => s.key);
    return this.data().map((linha) => {
      const total = chaves.reduce((t, k) => t + (Number(linha[k]) || 0), 0);
      const nova: UcamChartRow = { ...linha };
      for (const k of chaves) nova[k] = total ? ((Number(linha[k]) || 0) * 100) / total : null;
      return nova;
    });
  });

  /* A dispersão compara todas as cores com todas; o dumbbell e o heatmap
   * usam uma cor só, mas duas medidas ou muitas colunas. */
  private readonly teto = computed(() =>
    this.type() === 'heatmap' ? Number.POSITIVE_INFINITY : this.fatia() || this.livre() ? SLOTS_TODOS_OS_PARES : SLOTS,
  );

  protected readonly excedentes = computed(() => this.series().slice(this.teto()));
  protected readonly nomesExcedentes = computed(() => this.excedentes().map((s) => s.name).join(', '));

  /** As que cabem no desenho. */
  private readonly desenhadas = computed(() => this.series().slice(0, this.teto()));

  /* As formas da leva 4 (23/10/2026) não existem no ZardUI: saem da base mais
   * próxima e o resto vem pelo zOption. As formas livres (29/10/2026) saem de
   * 'line', a base cartesiana: um tipo que a base não conhece cai no ramo
   * radial dela, que monta eixos polares por baixo do override, e o heatmap
   * saía sem células. */
  protected readonly tipoBase = computed(
    () => (this.fatia() ? 'pie' : this.type() === 'sparkline' || this.livre() ? 'line' : this.type()) as 'line' | 'area' | 'bar' | 'pie',
  );

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

    if (this.fatia()) {
      const chave = this.categoryKey();
      return Object.fromEntries(
        this.data()
          .slice(0, SLOTS_TODOS_OS_PARES)
          .map((linha, i) => [String(linha[chave]), { label: String(linha[chave]), color: cor(i + 1) }]),
      );
    }

    return Object.fromEntries(
      this.desenhadas().map((s, i) => {
        const enfase = this.emphasis();
        const tinta = enfase && s.key !== enfase ? CINZA : cor(s.slot ?? (enfase ? 1 : i + 1));
        return [s.key, { label: s.name, color: tinta }];
      }),
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
  /**
   * A FONTE DE VERDADE, não 'inherit' (29/10/2026). A base declara
   * fontFamily: 'inherit', que o SVG resolve na fonte da página mas a medida
   * de texto do ECharts não resolve: ela mede numa fonte padrão mais estreita,
   * reserva menos do que o rótulo ocupa, e o nome longo de categoria no eixo
   * vertical saía cortado ("Nova Friburgo", "Administração") ou por baixo das
   * células do heatmap. A fonte do DS mora no .ucam, por isso lê-se do host.
   */
  private fonte(): string | undefined {
    return this.ehNavegador ? getComputedStyle(this.host.nativeElement).fontFamily || undefined : undefined;
  }

  protected readonly opcao = computed<ZardChartOptionOverride>(() => {
    this.tema();
    const fonte = this.fonte();
    return { ...this.forma(), ...(fonte ? { textStyle: { fontFamily: fonte } } : {}) };
  });

  private readonly forma = computed<ZardChartOptionOverride>(() => {
    switch (this.type()) {
      case 'pie':
        return {};
      case 'donut':
        return { series: [{ radius: ['58%', '80%'], label: { show: false } }] };
      case 'funnel':
        return { series: [{ type: 'funnel' as const, sort: 'none' as const, gap: 2, minSize: '18%', left: '10%', right: '10%' }] };
      case 'sparkline':
        return { grid: { left: 0, right: 0, top: 4, bottom: 4 }, xAxis: { show: false }, yAxis: { show: false, scale: true } };
      case 'heatmap':
        return this.opcaoHeatmap();
      case 'scatter':
        return this.opcaoDispersao();
      case 'dumbbell':
        return this.opcaoDumbbell();
      default: {
        // Com emphasis, a série em destaque leva o nome escrito na ponta da
        // linha (o rótulo direto), e a grade abre folga à direita para ele.
        const enfase = this.emphasis();
        const ponta = enfase && this.type() !== 'bar'
          ? { series: this.desenhadas().map((s) => (s.key === enfase
              ? { endLabel: { show: true, formatter: '{a}', color: 'var(--ucam-color-text-primary)', fontWeight: 500 } } : {})) }
          : {};
        return {
          ...ponta,
          grid: { left: 8, right: enfase && this.type() !== 'bar' ? 72 : 8 },
          // Na barra 100% o eixo de valor vai a 100 e diz "%"; deitada, a
          // primeira linha fica no alto, na ordem da tabela.
          ...(this.horizontal() && this.type() === 'bar'
            ? { yAxis: { inverse: true }, ...(this.proporcao() ? { xAxis: { max: 100, axisLabel: { formatter: '{value}%' } } } : {}) }
            : this.proporcao()
              ? { yAxis: { max: 100, axisLabel: { formatter: '{value}%' } } }
              : {}),
        };
      }
    }
  });

  private categorias(): string[] {
    return this.data().map((l) => String(l[this.categoryKey()] ?? ''));
  }

  private valor(linha: UcamChartRow, chave: string): number | null {
    const v = linha[chave];
    return typeof v === 'number' ? v : v == null || v === '' ? null : Number(v);
  }

  private formatoDe(s: UcamChartSeries) {
    return (v: number) => (s.format ? s.format(v) : this.formata(v));
  }

  private eixoCategoria(dados: string[], extra: Record<string, unknown> = {}) {
    return { type: 'category' as const, data: dados, axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { show: true, color: TINTA, formatter: (v: string) => v }, splitLine: { show: false }, ...extra };
  }

  /** Grade em UM tom: a cor do slot 1 por opacidade, mais é mais forte nos dois temas. */
  private opcaoHeatmap(): ZardChartOptionOverride {
    const cats = this.categorias();
    const colunas = this.series();
    const celulas: [number, number, number][] = [];
    let teto = 0;
    this.data().forEach((linha, i) =>
      colunas.forEach((s, j) => {
        const v = this.valor(linha, s.key);
        if (v === null) return;
        teto = Math.max(teto, v);
        celulas.push([j, i, v]);
      }),
    );
    return {
      grid: { left: 8, right: 8, top: 8, bottom: 44 },
      // boundaryGap: a base é 'line', que encosta a categoria na borda; sem
      // isto a primeira coluna de células cobria os rótulos dos dias.
      xAxis: this.eixoCategoria(colunas.map((s) => s.name), { boundaryGap: true, axisLabel: { show: true, color: TINTA, hideOverlap: true, formatter: (v: string) => v } }),
      yAxis: this.eixoCategoria(cats, { inverse: true, show: true }),
      visualMap: { min: 0, max: teto || 1, calculable: false, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 10, itemHeight: 160,
        text: [this.numero.format(teto), '0'], textGap: 8, textStyle: { color: TINTA }, inRange: { color: [cor(1)], colorAlpha: [0.1, 1] } },
      // O ECharts tipa o parâmetro como a união de todos os formatos de dado;
      // no heatmap ele é sempre a célula [coluna, linha, valor].
      tooltip: {
        formatter: (p: unknown) => {
          const [x, y, v] = (p as { value: [number, number, number] }).value;
          return `${cats[y]} · ${colunas[x].name}<br><b>${this.formata(v)}</b>`;
        },
      },
      series: [{ type: 'heatmap' as const, data: celulas, label: { show: false },
        itemStyle: { borderColor: SUPERFICIE, borderWidth: 2, borderRadius: 4 } }],
    };
  }

  /** Uma linha da tabela, um ponto: série 1 no x, série 2 no y, cada uma no seu eixo. */
  private opcaoDispersao(): ZardChartOptionOverride {
    const [sx, sy] = this.series();
    if (!sx || !sy) return {};
    const eixo = (s: UcamChartSeries, extra: Record<string, unknown>) => ({
      type: 'value' as const, scale: true, show: true, name: s.name + (s.unit ? ` (${s.unit})` : ''), nameLocation: 'middle' as const,
      nameTextStyle: { color: TINTA }, splitLine: { lineStyle: { color: FIO } }, axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { show: true, color: TINTA, formatter: this.formatoDe(s) }, ...extra,
    });
    const pontos = this.data()
      .map((l) => ({ name: String(l[this.categoryKey()] ?? ''), value: [this.valor(l, sx.key), this.valor(l, sy.key)] }))
      .filter((p) => p.value[0] !== null && p.value[1] !== null);
    return {
      grid: { left: 40, right: 16, top: 16, bottom: 28 },
      xAxis: eixo(sx, { nameGap: 28 }),
      yAxis: eixo(sy, { nameGap: 36, nameRotate: 90 }),
      tooltip: {
        formatter: (p: unknown) => {
          const { name, value } = p as { name: string; value: [number, number] };
          return `<b>${name}</b><br>${sx.name}: ${this.formatoDe(sx)(value[0])}<br>${sy.name}: ${this.formatoDe(sy)(value[1])}`;
        },
      },
      series: [{ type: 'scatter' as const, symbolSize: 12, data: pontos,
        itemStyle: { color: cor(1), borderColor: SUPERFICIE, borderWidth: 2, opacity: 0.9 },
        // Até oito pontos, cada um leva o nome; acima disso o nome vira ruído.
        label: { show: pontos.length <= 8, position: 'right' as const, distance: 6, formatter: '{b}', color: TINTA },
        labelLayout: { hideOverlap: true } }],
    };
  }

  /** Antes › depois por item: cinza de contexto, cor do slot 1, um fio entre os dois. */
  private opcaoDumbbell(): ZardChartOptionOverride {
    const [antes, depois] = this.series();
    if (!antes || !depois) return {};
    const cats = this.categorias();
    const ponto = (s: UcamChartSeries, tinta: string) => ({
      type: 'scatter' as const, name: s.name, symbolSize: 12, z: 3,
      data: this.data().map((l, i) => [this.valor(l, s.key), cats[i]]),
      itemStyle: { color: tinta, borderColor: SUPERFICIE, borderWidth: 2, opacity: 1 },
    });
    type Ponta = { coord: [number, string] };
    const fios = this.data()
      .map((l, i): [Ponta, Ponta] | null => {
        const a = this.valor(l, antes.key), d = this.valor(l, depois.key);
        return a === null || d === null ? null : [{ coord: [a, cats[i]] }, { coord: [d, cats[i]] }];
      })
      .filter((x): x is [Ponta, Ponta] => x !== null);
    return {
      grid: { left: 8, right: 24, top: 8, bottom: 8 },
      xAxis: { type: 'value' as const, scale: true, show: true, splitLine: { lineStyle: { color: FIO } }, axisLabel: { show: true, color: TINTA, formatter: this.formata } },
      yAxis: this.eixoCategoria(cats, { inverse: true, show: true }),
      series: [
        { ...ponto(antes, CINZA), markLine: { silent: true, symbol: 'none', animation: false, label: { show: false },
          lineStyle: { color: CINZA, width: 2, type: 'solid' as const }, data: fios } },
        ponto(depois, cor(1)),
      ],
    };
  }

  /** Uma série só é nomeada pelo rótulo do gráfico; a caixa de legenda seria ruído. */
  protected readonly mostraLegenda = computed(
    () => this.type() !== 'sparkline' && this.type() !== 'heatmap' && this.type() !== 'scatter' && (this.fatia() || this.desenhadas().length > 1),
  );

  protected readonly alturaClasse = computed(
    () => ({ xs: 'h-12', sm: 'h-32', md: 'h-48', lg: 'h-72' })[this.height()],
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

  protected readonly formataDica = (valor: number): string =>
    this.proporcao() ? `${this.numero.format(Math.round(valor * 10) / 10)}%` : this.formata(valor);

  protected celula(linha: UcamChartRow, chave: string, s?: UcamChartSeries): string {
    const v = linha[chave];
    // Ausência é ausência: buraco na série não vira zero nem na tabela.
    if (v === null || v === undefined || v === '') return '—';
    return typeof v === 'number' ? (s ? this.formatoDe(s)(v) : this.formata(v)) : String(v);
  }
}
