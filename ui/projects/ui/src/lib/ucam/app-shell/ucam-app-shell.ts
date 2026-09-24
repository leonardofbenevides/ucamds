import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamAvatar } from '../avatar/ucam-avatar';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

/**
 * Contrato: spec/components/app-shell.json
 *
 * O ÚLTIMO buraco entre os dois trilhos: 48 dos 49 contratos tinham
 * componente Angular, e a MOLDURA — a peça que faz três sistemas parecerem a
 * mesma universidade — só existia em CSS puro. Quem monta uma tela nova em
 * Angular tinha de copiar a marcação do shell à mão, e foi assim que o parque
 * chegou onde está: cada sistema com a sua faixa.
 *
 * O QUE ESTA PRIMEIRA VERSÃO COBRE: o arranjo `appbar` — faixa em cima,
 * navegação à esquerda, conteúdo no resto —, que é o de doze das quinze telas
 * de referência. As partes obrigatórias do contrato estão todas aqui:
 * skip-link, região viva, faixa, marca, navegação, conta e main com id fixo.
 *
 * O QUE NÃO COBRE, e está dito no contrato em vez de fingido: os arranjos
 * `rail` e `lateral`, a busca global da faixa, o seletor de campus e o
 * lançador de sistemas. Entram na ordem em que as telas pedirem.
 *
 * A navegação é FIXA a partir de 64rem e SOBREPOSTA abaixo disso — a mesma
 * fronteira do Trilho A, e a mesma razão: em 1024px a coluna de 19,875rem
 * come um quinto da janela.
 */
export interface UcamNavItem {
  label: string;
  // O tipo do ícone é FECHADO: nome fora do conjunto curado (spec/icons.json)
  // não compila, em vez de virar quadrado vazio em produção.
  icon?: UcamIconName;
  href?: string;
  current?: boolean;
  count?: number | null;
  disabled?: boolean;
}

export interface UcamNavGroup {
  label?: string;
  items: UcamNavItem[];
}

export type UcamAppbarAppearance = 'brand' | 'light' | 'dark' | 'custom';
export type UcamSystemCategory =
  | 'academico'
  | 'financeiro'
  | 'atendimento'
  | 'gestao'
  | 'pessoas'
  | 'acervo';

@Component({
  selector: 'ucam-app-shell',
  exportAs: 'ucamAppShell',
  imports: [UcamAvatar, UcamIcon, UcamIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block',
    '[style]': 'variaveis()',
    '[attr.data-sistema]': 'systemCategory()',
  },
  template: `
    <!--
      SKIP-LINK, primeiro elemento focável do documento.

      Some da tela e volta no foco — não é display:none, que o tiraria da
      ordem de tabulação e o transformaria em enfeite de conformidade. Sem
      ele, chegar ao conteúdo custa atravessar a faixa e a navegação inteira
      a cada troca de página, que no Protocolo são 23 paradas.
    -->
    <a
      [href]="'#' + contentId()"
      class="sr-only focus:not-sr-only focus:fixed focus:z-[300] focus:start-4 focus:top-4 focus:rounded-[var(--ucam-radius-control)] focus:bg-[var(--ucam-color-surface-default)] focus:px-4 focus:py-2 focus:text-[var(--ucam-color-text-primary)] focus:shadow-[var(--ucam-elevation-sticky)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ucam-color-border-focus)]"
      (click)="focaConteudo($event)"
      >Pular para o conteúdo</a
    >

    <!--
      REGIÃO VIVA. Parágrafo vazio e invisível, logo depois do skip-link: é
      onde a aplicação escreve "12 resultados" ou "Requerimento concluído".
      Nasce no documento e VAZIO de propósito — região viva criada junto com
      o texto não é anunciada, e o aviso se perde.
    -->
    <p class="sr-only" role="status" aria-live="polite">{{ announcement() }}</p>

    <div
      class="grid grid-cols-1 lg:grid-cols-[var(--ucam-nav-width)_minmax(0,1fr)]"
      [class.min-h-[100dvh]]="!embedded()"
      [class.h-full]="embedded()"
      [style.grid-template-rows]="'var(--ucam-appbar-height) minmax(0, 1fr)'"
    >
      <!--
        FAIXA. Elemento banner, grudada no alto, e atravessando as duas
        colunas: a marca fica acima da navegação, não ao lado dela.

        O fio de identidade e o fundo tinto saem de --ucam-sistema-cor, que o
        host declara a partir de systemCategory (ADR-037, em teste). Sem
        categoria, a faixa fica neutra — que é o caso do Portal.
      -->
      <header
        [style.--ucam-shell-filete]="fileteFaixa()"
      class="sticky top-0 z-[var(--ucam-z-faixa)] col-span-full flex h-[var(--ucam-appbar-height)] items-center gap-[var(--ucam-space-inline-sm)] border-b [border-color:var(--ucam-shell-filete)] px-[var(--ucam-space-inset-lg)]"
        [class]="classesFaixa()"
        [style]="estiloFaixa()"
      >
        <!-- Gatilho da navegação: só abaixo de 64rem, onde ela é sobreposta. -->
        <ucam-icon-button
          class="lg:hidden"
          icon="menu"
          variant="ghost"
          [label]="navAberta() ? 'Fechar navegação' : 'Abrir navegação'"
          [attr.aria-expanded]="navAberta()"
          [attr.aria-controls]="navId()"
          (click)="alternaNav()"
        />

        <!--
          MARCA. A marquinha do sistema no degrau do ladrilho do Portal (40px)
          — o mesmo desenho que a pessoa clicou para entrar — e o nome ao
          lado. O ladrilho é decorativo porque o nome, dentro do mesmo link,
          já dá o nome acessível: anunciar os dois sairia como "Protocolo
          Protocolo" em toda página.
        -->
        <a
          [href]="homeHref()"
          class="inline-flex items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control-sm)] text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[currentColor]"
        >
          @if (systemIcon()) {
            <span
              class="inline-flex size-[var(--ucam-size-control-lg)] shrink-0 items-center justify-center rounded-[var(--ucam-radius-control)]"
              [style.background]="tintaSistema()"
              [style.color]="'var(--ucam-color-text-on-action)'"
              aria-hidden="true"
            >
              <ucam-icon [name]="systemIcon()!" />
            </span>
          }
          <span class="text-[length:var(--ucam-appbar-system-size)] font-medium tracking-[-0.01em] whitespace-nowrap">{{
            systemName()
          }}</span>
        </a>

        <span class="ms-auto"></span>
        <!-- Ações da faixa: busca, notificações, lançador. A aplicação projeta. -->
        <ng-content select="[ucamShellAcoes]" />

        @if (user(); as u) {
          <ucam-avatar [name]="u.name" [photoUrl]="u.photoUrl ?? null" size="sm" />
        }
      </header>

      <!--
        NAVEGAÇÃO. Coluna da grade a partir de 64rem; abaixo disso ela sai do
        fluxo e passa por cima do conteúdo, com escurecimento atrás.

        hidden não serve aqui: a navegação sobreposta precisa continuar no
        documento para animar, e o que a tira da ordem de tabulação quando
        está fechada é o inert.
      -->
      @if (navAberta() && !largura()) {
        <div
          class="fixed inset-0 z-[190] bg-[color-mix(in_oklab,var(--ucam-color-text-primary)_45%,transparent)] lg:hidden"
          (click)="alternaNav()"
          aria-hidden="true"
        ></div>
      }
      <nav
        [id]="navId()"
        [attr.aria-label]="'Navegação de ' + systemName()"
        [attr.inert]="!largura() && !navAberta() ? '' : null"
        class="flex flex-col border-e border-[var(--ucam-color-border-subtle)] bg-[var(--ucam-color-surface-chrome)] max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-[200] max-lg:w-[var(--ucam-nav-width)] max-lg:transition-transform lg:sticky lg:top-[var(--ucam-appbar-height)] lg:h-[calc(100dvh-var(--ucam-appbar-height))]"
        [class.max-lg:-translate-x-full]="!navAberta()"
      >
        <div class="flex-1 overflow-y-auto p-[var(--ucam-space-inset-md)]">
          @for (grupo of navGroups(); track grupo.label ?? $index) {
            <div class="mb-[var(--ucam-space-stack-md)]">
              @if (grupo.label) {
                <!-- Caixa alta VALE para o rótulo do grupo e para mais nada:
                     ele é etiqueta de gaveta, não texto de leitura. -->
                <p
                  class="m-0 mb-[var(--ucam-space-inline-xs)] px-[var(--ucam-space-inline-sm)] text-[length:var(--ucam-typography-caption-font-size)] font-medium text-[var(--ucam-color-text-secondary)]"
                >
                  {{ grupo.label }}
                </p>
              }
              @for (item of grupo.items; track item.label) {
                <a
                  [href]="item.href ?? null"
                  [attr.aria-current]="item.current ? 'page' : null"
                  [attr.aria-disabled]="item.disabled ? 'true' : null"
                  class="flex min-h-[var(--ucam-size-control-lg)] items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control)] px-[var(--ucam-space-inline-sm)] py-[var(--ucam-space-inline-xs)] text-[length:var(--ucam-typography-action-font-size)] no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
                  [class]="classesItem(item)"
                >
                  @if (item.icon) {
                    <ucam-icon [name]="item.icon" [style.color]="corIcone(item)" />
                  }
                  <span class="flex-1 truncate">{{ item.label }}</span>
                  @if (item.count != null) {
                    <span class="text-[length:var(--ucam-typography-caption-font-size)] text-[var(--ucam-color-text-secondary)]">{{
                      item.count
                    }}</span>
                  }
                </a>
              }
            </div>
          }
          <ng-content select="[ucamShellNav]" />
        </div>

        <!-- PÉ da navegação, fora da rolagem: configuração e ajuda não são
             destino de trabalho, e não podem disputar o alto da coluna. -->
        <div class="border-t border-[var(--ucam-color-border-subtle)] p-[var(--ucam-space-inset-md)]">
          <ng-content select="[ucamShellNavRodape]" />
        </div>
      </nav>

      <!-- MAIN é o alvo do skip-link: id fixo e tabindex -1, senão o salto
           move a rolagem e deixa o foco onde estava. -->
      <main
        [id]="contentId()"
        tabindex="-1"
        class="min-w-0 bg-[var(--ucam-color-surface-default)] outline-none"
      >
        <div class="mx-auto w-full max-w-[var(--ucam-content-max)]">
          <ng-content />
        </div>
      </main>
    </div>
  `,
})
export class UcamAppShell {
  private readonly destroyRef = inject(DestroyRef);

  readonly systemName = input.required<string>();
  readonly systemIcon = input<UcamIconName | null>(null);
  readonly systemCategory = input<UcamSystemCategory | null>(null);
  readonly appbarAppearance = input<UcamAppbarAppearance>('light');
  readonly navGroups = input<UcamNavGroup[]>([]);
  readonly user = input<{ name: string; photoUrl?: string } | null>(null);
  readonly homeHref = input<string>('/');
  readonly navWidth = input<string>('19.875rem');
  readonly maxContentWidth = input<string>('88rem');
  readonly navCollapsed = input(false, { transform: booleanAttribute });
  /** O que a região viva anuncia. Vazio em repouso, e é assim que ela serve. */
  readonly announcement = input<string>('');
  /**
   * O shell dentro de OUTRA moldura — a demo do catálogo, um quadro de
   * documentação. Troca a altura de janela por altura do pai: sem isso a
   * demo empurra 100dvh de shell para dentro de um cartão de 520px.
   */
  readonly embedded = input(false, { transform: booleanAttribute });

  protected readonly navId = signal(`ucam-nav-${Math.random().toString(36).slice(2, 8)}`);
  protected readonly contentId = signal('conteudo');
  protected readonly navAberta = signal(false);
  /** true a partir de 64rem: a navegação vira coluna e deixa de sobrepor. */
  protected readonly largura = signal(true);

  constructor() {
    // matchMedia, e não resize: o navegador avisa só quando a fronteira é
    // cruzada, em vez de a cada pixel arrastado. Roda no construtor porque
    // afterNextRender fica FORA do contexto de injeção, e o DestroyRef
    // precisa ser campo da classe.
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(min-width: 64rem)');
      this.largura.set(mq.matches);
      const ouve = (e: MediaQueryListEvent) => {
        this.largura.set(e.matches);
        // Voltar ao desktop com a gaveta aberta deixava a coluna sobreposta
        // sobre a coluna fixa — duas navegações na mesma tela.
        if (e.matches) this.navAberta.set(false);
      };
      mq.addEventListener('change', ouve);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', ouve));
    }
  }

  protected alternaNav(): void {
    this.navAberta.update((v) => !v);
  }

  /**
   * O skip-link move o FOCO, não só a rolagem. Sem isto o href leva a página
   * até o conteúdo e o foco continua no link — o teclado seguinte volta para
   * a faixa, que é exatamente o que o skip-link existe para evitar.
   */
  protected focaConteudo(e: Event): void {
    const alvo = document.getElementById(this.contentId());
    if (!alvo) return;
    e.preventDefault();
    alvo.focus();
    alvo.scrollIntoView({ block: 'start' });
  }

  /**
   * As variáveis de MOLDURA são declaradas aqui, e não herdadas: elas moram
   * na folha do Trilho A (.ucam-shell) e não existem em @ucam/tokens. Quem
   * usar só a biblioteca Angular não carrega aquela folha — sem isto, a faixa
   * nasce com altura zero e o filete sai em currentColor.
   *
   * 4.5rem é a MESMA altura da faixa do Trilho A, e a igualdade importa: as
   * duas molduras aparecem lado a lado na página do catálogo.
   */
  protected readonly variaveis = computed(() => ({
    '--ucam-nav-width': this.navWidth(),
    '--ucam-content-max': this.maxContentWidth(),
    '--ucam-appbar-height': '4.5rem',
    '--ucam-appbar-system-size': '1rem',
  }));

  /** A tinta do sistema: a cor da categoria puxada para o legível, como no
   *  Trilho A (color-mix com text-primary, que escurece no claro e clareia no
   *  escuro). Sem categoria, a ação comum. */
  protected readonly tintaSistema = computed(() =>
    this.systemCategory()
      ? `color-mix(in oklab, var(--ucam-color-categoria-${this.systemCategory()}), var(--ucam-color-text-primary) 28%)`
      : 'var(--ucam-color-action-primary-default)',
  );

  protected readonly classesFaixa = computed(() =>
    this.appbarAppearance() === 'brand'
      ? 'bg-[var(--ucam-color-surface-brand)] text-[var(--ucam-color-text-on-action)]'
      : this.appbarAppearance() === 'dark'
        ? 'bg-[var(--ucam-color-surface-inverse)] text-[var(--ucam-color-text-on-brand)]'
        : 'text-[var(--ucam-color-text-primary)]',
  );

  /** Faixa clara: o fundo é o da superfície, tinto a 10% quando o sistema tem
   *  categoria — é o "header próprio" da ADR-037. */
  protected readonly estiloFaixa = computed(() => {
    if (this.appbarAppearance() !== 'light') return {};
    const cor = this.systemCategory();
    return {
      background: cor
        ? `color-mix(in oklab, var(--ucam-color-categoria-${cor}) 10%, var(--ucam-color-surface-default))`
        : 'var(--ucam-color-surface-default)',
    };
  });

  /** Filete da faixa: o fio de superfície na faixa clara; na tinta ele sai do
   *  próprio texto, senão some sobre o bordô ou o quase-preto. */
  protected readonly fileteFaixa = computed(() =>
    this.appbarAppearance() === 'light'
      ? 'var(--ucam-color-border-subtle)'
      : 'color-mix(in srgb, currentColor 10%, transparent)',
  );

  protected classesItem(item: UcamNavItem): string {
    if (item.disabled) return 'text-[var(--ucam-color-text-secondary)] cursor-not-allowed';
    return item.current
      ? 'bg-[var(--ucam-color-action-primary-subtle)] font-medium text-[var(--ucam-color-text-primary)]'
      : 'text-[var(--ucam-color-text-primary)] hover:bg-[var(--ucam-color-interaction-hover)]';
  }

  protected corIcone(item: UcamNavItem): string {
    return item.current
      ? 'var(--ucam-color-action-primary-default)'
      : 'var(--ucam-color-text-secondary)';
  }
}
