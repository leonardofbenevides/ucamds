import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';

import { UcamButton } from '../button/ucam-button';
import { UcamEmptyState } from '../empty-state/ucam-empty-state';
import { UcamSkeleton } from '../skeleton/ucam-skeleton';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/timeline.json
 *
 * Sem equivalente na base. Na tabela de histórico da Análise de Requerimento
 * a resposta ao aluno e a mudança de situação são idênticas: é preciso ler o
 * texto inteiro para saber qual é qual. Aqui a diferença aparece na forma E
 * no papel escrito — nunca só na cor.
 */
export type UcamTimelineKind = 'message' | 'event';
export type UcamTimelineTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface UcamTimelineItem {
  kind: UcamTimelineKind;
  author: string;
  role?: string | null;
  /** Data ISO. O relativo exibido é derivado dela. */
  at: string;
  text?: string | null;
  icon?: UcamIconName | null;
  tone?: UcamTimelineTone;
  /**
   * O par DE e PARA da mudança de situação, só em kind=event. Vêm juntos: um
   * sem o outro é meia informação e não é desenhado. A prosa do `text` é
   * escrita por quem grava o evento e erra; o par vem do dado.
   */
  from?: string | null;
  to?: string | null;
  /**
   * Os campos alterados por UM evento de edição — setor, prazo e prioridade
   * no mesmo clique. Só em kind=event, e exclui from/to: ou o evento é uma
   * transição, ou é uma edição. Como três eventos, seriam três linhas com o
   * mesmo autor e a mesma hora, escondendo que foi uma ação só.
   */
  changes?: UcamTimelineChange[] | null;
  /**
   * A situação do registro quando o item aconteceu, com o nome da coluna
   * Situação da listagem. É o rótulo do corte em groupBy=phase; sem ele, o
   * item herda a fase do anterior na ordem de leitura.
   */
  phase?: string | null;
  /**
   * Os passos do trâmite que ESTE item abriu e que ainda não terminou — o
   * parecer pedido à coordenação. Só em kind=event. As etapas do registro
   * inteiro não entram aqui: essas são do stepper, ou de groupBy=phase.
   */
  steps?: UcamTimelineStep[] | null;
}

export interface UcamTimelineStep {
  label: string;
  state: 'done' | 'current' | 'pending';
}

export type UcamTimelineFilter = 'all' | 'message' | 'event';

export interface UcamTimelineChange {
  /** O nome do campo como aparece no formulário — "Setor responsável", não "setor_id". */
  field: string;
  to: string;
  from?: string | null;
  icon?: UcamIconName | null;
}

export type UcamTimelineGroupBy = 'none' | 'day' | 'year' | 'phase';

/** O mesmo vocabulário da DataTable. Ver timeline.json, state. */
export type UcamTimelineState = 'idle' | 'loading' | 'empty' | 'error';

/** Uma entrada da lista renderizada: ou um item, ou o rótulo de um período. */
type Entrada =
  | { tipo: 'item'; item: UcamTimelineItem; ultimo: boolean }
  | { tipo: 'periodo'; rotulo: string; fase: boolean };

/** O estado de cada etapa, dito em texto: a marca é aria-hidden. */
const ETAPA_DITA: Record<UcamTimelineStep['state'], string> = {
  done: 'concluída',
  current: 'em curso',
  pending: 'pendente',
};

/**
 * O rótulo do período: "Hoje", "Ontem" e a data por extenso no corte por
 * dia; o ano no corte por ano. Derivado do ISO, como o relativo.
 */
export function periodoDe(iso: string, por: Exclude<UcamTimelineGroupBy, 'phase'>, agora = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (por === 'year') return String(d.getFullYear());
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((dia(agora) - dia(d)) / 86400000);
  if (dif === 0) return 'Hoje';
  if (dif === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: d.getFullYear() === agora.getFullYear() ? undefined : 'numeric' });
}

const NO: Record<UcamTimelineTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-[var(--ucam-color-border-subtle)]',
  info: 'bg-[var(--ucam-color-feedback-info-background)] text-[var(--ucam-color-feedback-info-foreground)] border-[var(--ucam-color-feedback-info-border)]',
  success:
    'bg-[var(--ucam-color-feedback-success-background)] text-[var(--ucam-color-feedback-success-foreground)] border-[var(--ucam-color-feedback-success-border)]',
  warning:
    'bg-[var(--ucam-color-feedback-warning-background)] text-[var(--ucam-color-feedback-warning-foreground)] border-[var(--ucam-color-feedback-warning-border)]',
  danger:
    'bg-[var(--ucam-color-feedback-danger-background)] text-[var(--ucam-color-feedback-danger-foreground)] border-[var(--ucam-color-feedback-danger-border)]',
};

const ICONE_PADRAO: Record<UcamTimelineKind, UcamIconName> = {
  message: 'messageSquare',
  event: 'check',
};

/**
 * Relativo até sete dias, absoluto depois disso: "há 18 dias" já não ajuda
 * ninguém a agir, e a data é o que permite conferir com o processo em papel.
 */
export function relativoDe(iso: string, agora = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const min = Math.round((agora.getTime() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.round(h / 24);
  if (dias <= 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  return d.toLocaleDateString('pt-BR');
}

@Component({
  selector: 'ucam-timeline',
  exportAs: 'ucamTimeline',
  imports: [UcamIcon, UcamButton, UcamEmptyState, UcamSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /** Ver o porquê do contents em ucam-description-list. */
  host: { class: 'contents' },
  template: `
    @if (state() === 'loading') {
      <div aria-busy="true">
        <ucam-skeleton variant="text" [lines]="3" />
        <span class="sr-only">Carregando o histórico</span>
      </div>
    } @else if (state() === 'empty') {
      <ucam-empty-state reason="no-data" size="sm" title="Nenhum registro no histórico ainda" />
    } @else if (state() === 'error') {
      <ucam-empty-state reason="error" size="sm" title="Não foi possível carregar o histórico">
          <ucam-button variant="secondary" (click)="retry.emit()">Tentar novamente</ucam-button>
        </ucam-empty-state>
    } @else {
    <ol class="list-none m-0 p-0">
      @for (e of entradas(); track e.tipo === 'item' ? e.item.at + e.item.author : 'p:' + e.rotulo) {
        @if (e.tipo === 'periodo') {
          <!-- O corte de período é um item da lista de verdade, não um
               separador aria-hidden: quem ouve a página também precisa dele.
               O trilho atravessa sem nó — o ano não é um acontecimento. -->
          @if (e.fase) {
            <!-- A fase é um trecho do caminho: o marco diz onde ele começa, e
                 o fio passa antes e depois. A primeira fase não tem fio acima. -->
            <li class="grid grid-cols-[auto_1fr] gap-2">
              <span class="flex flex-col items-center w-7" aria-hidden="true">
                <span class="w-px h-2.5 shrink-0 bg-[var(--ucam-color-border-subtle)]" [class.invisible]="$first"></span>
                <span class="size-2 shrink-0 rounded-full bg-[var(--ucam-color-border-strong)]"></span>
                <span class="w-px flex-1 min-h-4 bg-[var(--ucam-color-border-subtle)]"></span>
              </span>
              <p class="m-0 pt-1 pb-2 text-xs font-medium text-muted-foreground">
                <span class="sr-only">Fase: </span>{{ e.rotulo }}
              </p>
            </li>
          } @else {
          <li class="grid grid-cols-[auto_1fr] gap-2">
            <span class="flex flex-col items-center w-7" aria-hidden="true">
              <span class="w-px flex-1 min-h-4 bg-[var(--ucam-color-border-subtle)]"></span>
            </span>
            <p class="m-0 py-1 text-xs font-medium text-muted-foreground">{{ e.rotulo }}</p>
          </li>
          }
        } @else {
        @let i = e.item;
        @let ultimo = e.ultimo;
        <li class="grid grid-cols-[auto_1fr] gap-2">
          <!-- Trilho decorativo: a sequência já está no <ol>. -->
          <span class="flex flex-col items-center" aria-hidden="true">
            <!-- 28px e sem anel, como o .ucam-timeline__no do Trilho A: o
                 anel era a peça mais escura da coluna (ver build-css). -->
            <span
              class="size-7 shrink-0 rounded-full inline-flex items-center justify-center"
              [class]="noClasses(i)"
            >
              <ucam-icon [name]="icone(i)" size="sm" />
            </span>
            @if (!ultimo) {
              <span class="w-px flex-1 min-h-3 bg-[var(--ucam-color-border-subtle)]"></span>
            }
          </span>
          <div class="min-w-0" [class]="ultimo ? '' : espaco()">
            <p class="flex items-baseline gap-1 flex-wrap text-sm m-0">
              <span class="font-medium text-foreground">{{ i.author }}</span>
              @if (i.role) {
                <!-- O papel é o que separa fala de gente de mudança de estado
                     NA LEITURA, e por isso é texto e não só a forma do nó. -->
                <!-- Sem pastilha desde a ADR-036: texto depois do ponto médio,
                     que é decorativo. -->
                <span class="text-xs text-muted-foreground"><span aria-hidden="true" class="me-1">·</span>{{ i.role }}</span>
              }
              <time class="ml-auto text-xs text-muted-foreground" [attr.datetime]="i.at">{{ relativo(i) }}</time>
            </p>
            @if (temTransicao(i)) {
              <!-- Os selos carregam os nomes de situação do sistema, tal como
                   aparecem na coluna Situação da listagem: sinônimo inventado
                   aqui faz o histórico divergir da lista que ele explica. -->
              <p class="flex items-center gap-1 flex-wrap m-0 mt-1.5">
                <span class="sr-only">de {{ i.from }} para {{ i.to }}</span>
                <span aria-hidden="true" class="inline-flex items-center gap-1 flex-wrap">
                  <span class="text-xs text-muted-foreground border border-[var(--ucam-color-border-subtle)] rounded-full px-1.5 py-0.5">
                    {{ i.from }}
                  </span>
                  <!-- Seta decorativa: quem ouve a página recebe a frase acima,
                       não o desenho. Seta sozinha não é palavra. -->
                  <ucam-icon name="arrowRight" size="xs" class="text-[var(--ucam-color-text-placeholder)]" />
                  <span class="text-xs text-foreground border border-[var(--ucam-color-border-default)] rounded-full px-1.5 py-0.5 font-medium">
                    {{ i.to }}
                  </span>
                </span>
              </p>
            }
            @if (i.text) {
              <p class="text-sm m-0 mt-1.5" [class]="corpoClasses(i)">{{ i.text }}</p>
            }
            @if (temEtapas(i)) {
              <!-- Os passos do trâmite aberto por este item. A forma distingue
                   (✓, ponto cheio, ponto vazado) e o texto diz o estado. Feita
                   não é riscada: riscado lê como cancelado. -->
              <ul class="list-none m-0 mt-1.5 p-0 grid gap-0.5 text-sm">
                @for (s of i.steps; track s.label) {
                  <li
                    class="flex items-center gap-1 min-h-5"
                    [class]="s.state === 'current' ? 'text-foreground font-medium' : 'text-muted-foreground'"
                  >
                    <span class="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
                      @switch (s.state) {
                        @case ('done') {
                          <ucam-icon name="check" size="sm" class="text-[var(--ucam-color-feedback-success-foreground)]" />
                        }
                        @case ('current') {
                          <!-- Informação, não marca: o bordô é da ação que se
                               CLICA, e num ponto que só se lê ele competia com
                               o primário da tela a três dedos de distância. A
                               trinca fica semântica e cinza. -->
                          <span class="size-2 rounded-full bg-[var(--ucam-color-feedback-info-foreground)]"></span>
                        }
                        @default {
                          <span class="size-2 rounded-full border-[1.5px] border-[var(--ucam-color-border-strong)]"></span>
                        }
                      }
                    </span>
                    {{ s.label }}<span class="sr-only">, {{ etapaDita(s) }}</span>
                  </li>
                }
              </ul>
            }
            @if (temMudancas(i)) {
              <!-- Um dl porque é o que é: pares de campo e valor. A seta não
                   é palavra — quem ouve recebe "Setor responsável, Coordenação
                   de Curso para Secretaria Acadêmica". O valor antigo vem
                   apagado, nunca riscado: riscado lê como cancelado. -->
              <dl class="m-0 mt-1.5 grid gap-x-2 gap-y-1 text-sm" [class]="mudancasClasses()">
                @for (m of i.changes; track m.field) {
                  <!-- Na compacta o par corre em frase — "Prazo: 10/09 → 04/09"
                       — e o ícone do campo sai (ADR-036). Na padrão, duas colunas. -->
                  <div [class]="compacta() ? 'block' : 'contents'">
                  @if (compacta()) {
                    <dt class="m-0 inline text-muted-foreground">{{ m.field }}:</dt>
                    {{ ' ' }}
                  } @else {
                  <dt class="m-0 flex items-center gap-1 text-muted-foreground">
                    @if (m.icon) { <ucam-icon [name]="m.icon" size="sm" class="text-[var(--ucam-color-text-placeholder)]" /> }
                    {{ m.field }}
                  </dt>
                  }
                  <dd class="m-0 min-w-0 text-foreground" [class]="compacta() ? 'inline' : 'flex flex-wrap items-center gap-1'">
                    @if (m.from) {
                      <span class="text-muted-foreground" [class.me-1]="compacta()">{{ m.from }}</span>
                      <!-- Seta e destino são uma unidade: quando o par quebra
                           de linha, a seta abre a segunda linha colada ao
                           valor novo, em vez de ficar órfã no fim da primeira. -->
                      <span class="inline-flex min-w-0 items-center gap-1">
                        <ucam-icon name="arrowRight" size="xs" class="text-[var(--ucam-color-text-placeholder)]" aria-hidden="true" />
                        <span class="sr-only">para</span>
                        <span>{{ m.to }}</span>
                      </span>
                    } @else {
                      <span>{{ m.to }}</span>
                    }
                  </dd>
                  </div>
                }
              </dl>
            }
          </div>
        </li>
        }
      }
    </ol>
    }
  `,
})
export class UcamTimeline {
  readonly items = input.required<UcamTimelineItem[]>();
  readonly order = input<'desc' | 'asc'>('desc');
  readonly density = input<'default' | 'compact'>('default');
  /** Corta a lista por período, com o rótulo entre os itens. Ver periodoDe. */
  readonly groupBy = input<UcamTimelineGroupBy>('none');
  /**
   * Só uma natureza de item. O controle que escolhe é de quem consome; aqui a
   * lista obedece, e como o filtro vem ANTES do corte, fase vazia não aparece
   * e o último item visível fecha o fio. Ver timeline.json, filter.
   */
  readonly filter = input<UcamTimelineFilter>('all');
  /** idle, loading, empty e error — o vocabulário da DataTable. Ver timeline.json, state. */
  readonly state = input<UcamTimelineState>('idle');
  /** Pedido de nova carga, do "Tentar novamente" do erro. O componente não busca dados. */
  readonly retry = output<void>();

  /**
   * A lista renderizada: os itens ordenados, com o rótulo do período
   * inserido a cada troca. O último item de verdade fecha o trilho.
   */
  protected readonly entradas = computed<Entrada[]>(() => {
    const filtro = this.filter();
    const itens = this.ordenados().filter((i) => filtro === 'all' || i.kind === filtro);
    const por = this.groupBy();
    const out: Entrada[] = [];
    let atual: string | null = null;
    itens.forEach((item, idx) => {
      if (por !== 'none') {
        // Na fase, item sem phase herda a do anterior na ordem de leitura.
        const rotulo = por === 'phase' ? (item.phase ?? atual) : periodoDe(item.at, por);
        if (rotulo !== null && rotulo !== atual) {
          out.push({ tipo: 'periodo', rotulo, fase: por === 'phase' });
          atual = rotulo;
        }
      }
      out.push({ tipo: 'item', item, ultimo: idx === itens.length - 1 });
    });
    return out;
  });

  /** Só em evento, e só quando não há transição: as duas não convivem. */
  protected temMudancas(i: UcamTimelineItem): boolean {
    return i.kind === 'event' && !!i.changes?.length && !this.temTransicao(i);
  }

  /** Na densidade compacta as duas colunas não cabem: cada par vira uma frase. */
  protected mudancasClasses(): string {
    return this.compacta() ? 'grid-cols-1' : 'grid-cols-[max-content_1fr]';
  }

  protected readonly compacta = computed(() => this.density() === 'compact');

  /** Etapas só em evento: fala de gente não abre trâmite. */
  protected temEtapas(i: UcamTimelineItem): boolean {
    return i.kind === 'event' && !!i.steps?.length;
  }

  protected etapaDita(s: UcamTimelineStep): string {
    return ETAPA_DITA[s.state];
  }

  protected readonly ordenados = computed(() => {
    const lista = [...this.items()];
    lista.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    return this.order() === 'desc' ? lista.reverse() : lista;
  });

  protected readonly espaco = computed(() => (this.density() === 'compact' ? 'pb-2' : 'pb-4'));

  protected relativo(i: UcamTimelineItem) {
    return relativoDe(i.at);
  }

  /**
   * O par é tudo ou nada, e só em evento: "de Em análise para —" não informa,
   * e transição numa fala de gente sugere um efeito que a mensagem não teve.
   */
  protected temTransicao(i: UcamTimelineItem): boolean {
    return i.kind === 'event' && !!i.from && !!i.to;
  }

  protected icone(i: UcamTimelineItem): UcamIconName {
    return i.icon ?? ICONE_PADRAO[i.kind];
  }

  protected noClasses(i: UcamTimelineItem): string {
    return NO[i.tone ?? 'neutral'];
  }

  /**
   * Mensagem ganha o filete de citação e tinta primária; evento não. É a
   * diferença visível entre alguém falando e o sistema registrando — nas duas
   * densidades desde a ADR-036, que trocou o balão cinza pelo filete.
   */
  protected corpoClasses(i: UcamTimelineItem): string {
    if (i.kind !== 'message') return 'text-muted-foreground';
    return 'text-foreground border-s-2 border-[var(--ucam-color-border-default)] ps-2';
  }
}
