import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { UcamAvatar } from '../avatar/ucam-avatar';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';
import { UcamSelect, type UcamOption } from '../select/ucam-select';

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
 * 29/09/2026: entram os outros dois arranjos e o campus, porque as telas do
 * Gerencial já pediam `shellLayout="lateral"` e `[contextOptions]` no código
 * que o desenvolvedor copia — e o código não compilava.
 *   · `lateral` APAGA a faixa: marca, campus, ações e conta descem para a
 *     coluna, que vai do topo ao pé da janela; abaixo de 64rem uma fileira
 *     rasa (a mobilebar) carrega o gatilho da navegação, senão o celular
 *     ficaria sem menu.
 *   · `rail` troca a faixa por uma coluna de módulos de 72px, em marca cheia.
 *     Os módulos são da aplicação e entram pelo slot [ucamShellRail]; o nome
 *     do sistema sobe para o alto da navegação. O campus NÃO aparece aqui —
 *     é a dívida que o contrato declara para este arranjo.
 *   · O campus é um select de verdade (ADR-033) quando há mais de uma
 *     opção, e texto quando não há o que escolher: rótulo só para leitor de
 *     tela na faixa, visível na coluna lateral.
 *
 * O QUE AINDA NÃO COBRE, e está dito no contrato em vez de fingido: a busca
 * global da faixa, o lançador de sistemas, o menu da conta (signOut) e o
 * grupo Favoritos. Entram na ordem em que as telas pedirem.
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
/** O arranjo da moldura. Ver o comentário do topo e app-shell.json. */
export type UcamShellLayout = 'appbar' | 'rail' | 'lateral';
export type UcamSystemCategory =
  | 'academico'
  | 'financeiro'
  | 'atendimento'
  | 'gestao'
  | 'pessoas'
  | 'acervo'
  | 'pesquisa'
  | 'comunicacao';

@Component({
  selector: 'ucam-app-shell',
  exportAs: 'ucamAppShell',
  imports: [NgTemplateOutlet, UcamAvatar, UcamIcon, UcamIconButton, UcamSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block',
    '[style]': 'variaveis()',
    '[attr.data-sistema]': 'systemCategory()',
    '[attr.data-layout]': 'shellLayout()',
  },
  /* O select do campus NA FAIXA (29/09/2026). O gatilho do <ucam-select> é
   * desenhado para superfície branca; sobre a faixa de marca ele seria uma
   * pastilha branca no meio do bordô. A tinta sai da própria faixa, como o
   * .ucam-select--faixa do Trilho A: fundo transparente, fio e chevron
   * derivados de currentColor, altura do controle pequeno. */
  styles: `
    ucam-app-shell .ucam-campus--faixa [data-slot='select-trigger'] {
      block-size: var(--ucam-size-control-sm);
      max-inline-size: 14rem;
      background: transparent;
      color: inherit;
      border-color: color-mix(in srgb, currentColor 30%, transparent);
      font-size: var(--ucam-typography-body-sm-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
    }
    ucam-app-shell .ucam-campus--faixa [data-slot='select-trigger']:hover:not(:disabled) {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    ucam-app-shell .ucam-campus--faixa [data-slot='select-trigger'] ng-icon {
      color: inherit;
      opacity: 0.72;
    }
    /* A barra de visão da folha do Trilho A (.ucam-viewbar) gruda em zero, e o
       degrau que a põe abaixo da faixa lá depende de .ucam-appbar ~ .ucam-main,
       que esta moldura não emite. Dentro dela, o degrau é o --ucam-sticky-top. */
    ucam-app-shell .ucam-viewbar {
      inset-block-start: var(--ucam-sticky-top);
    }
  `,
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

    <!--
      PEÇAS QUE MUDAM DE LUGAR CONFORME O ARRANJO. Um <ng-content> só pode
      aparecer uma vez: as ações da faixa e o campus são desenhados aqui e
      postos onde o arranjo mandar — na faixa (appbar), no alto da coluna
      (lateral) ou no rail. Projetar duas vezes perderia uma das cópias sem
      aviso.
    -->
    <ng-template #acoes><ng-content select="[ucamShellAcoes]" /></ng-template>
    <ng-template #campus let-visivel>
      @if (context()) {
        @if (trocaContexto()) {
          <span class="ucam-campus min-w-0" [class]="visivel ? 'ucam-campus--nav block' : 'ucam-campus--faixa inline-flex'">
            <ucam-select
              [label]="contextLabel()"
              [labelHidden]="!visivel"
              [options]="contextOptions()!"
              [value]="context() ?? ''"
              [width]="visivel ? 'full' : 'content'"
              (valueChange)="trocarContexto($event)"
            />
          </span>
        } @else {
          <!-- Uma opção só não é escolha: sem gatilho, que abriria uma lista
               de um item e prometeria o que não tem. -->
          <span
            class="ucam-campus flex min-w-0 gap-[var(--ucam-space-inline-xs)]"
            [class]="visivel ? 'ucam-campus--nav flex-col' : 'ucam-campus--faixa items-center'"
          >
            <span
              [class]="visivel ? 'text-[length:var(--ucam-typography-caption-font-size)] text-[var(--ucam-color-text-secondary)]' : 'sr-only'"
              >{{ contextLabel() }}</span
            >
            <span class="truncate text-[length:var(--ucam-typography-body-sm-font-size)] font-medium">{{
              rotuloContexto()
            }}</span>
          </span>
        }
      }
    </ng-template>

    <div [class]="classesGrade()" [class.min-h-[100dvh]]="!embedded()" [class.h-full]="embedded()">
      @if (shellLayout() === 'appbar') {
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
              [style.background]="ladrilhoMarca()"
              [style.color]="appbarAppearance() === 'light' ? 'var(--ucam-color-text-on-action)' : 'currentColor'"
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
        <!-- Campus antes das ações: é o contexto de TODA a tela, e mora ao
             lado da conta, no grupo que responde "onde estou". -->
        <ng-container [ngTemplateOutlet]="campus" [ngTemplateOutletContext]="{ $implicit: false }" />
        <!-- Ações da faixa: busca, notificações, lançador. A aplicação projeta. -->
        <ng-container [ngTemplateOutlet]="acoes" />

        @if (user(); as u) {
          <ucam-avatar [name]="u.name" [photoUrl]="u.photoUrl ?? null" size="sm" />
        }
      </header>
      }

      @if (shellLayout() === 'lateral') {
        <!--
          MOBILEBAR. Só abaixo de 64rem, e só neste arranjo: sem faixa, não há
          onde morar o botão que abre a navegação sobreposta. Sem ela o
          sistema inteiro ficaria sem menu no celular.
        -->
        <div
          class="sticky top-0 z-[var(--ucam-z-faixa)] col-span-full flex h-14 items-center gap-[var(--ucam-space-inline-sm)] border-b border-[var(--ucam-color-border-subtle)] bg-[var(--ucam-color-surface-chrome)] px-[var(--ucam-space-inset-md)] lg:hidden"
        >
          <ucam-icon-button
            icon="menu"
            variant="ghost"
            [label]="navAberta() ? 'Fechar navegação' : 'Abrir navegação'"
            [attr.aria-expanded]="navAberta()"
            [attr.aria-controls]="navId()"
            (click)="alternaNav()"
          />
          <span class="truncate font-medium">{{ systemName() }}</span>
        </div>
      }

      @if (shellLayout() === 'rail') {
        <!--
          RAIL. Coluna de MÓDULOS do parque, em marca cheia — um ícone por
          sistema, não por seção deste. Os itens são da aplicação (slot
          [ucamShellRail]) e cada um exige aria-label: 72px não comportam
          rótulo. O gatilho da navegação é o primeiro filho e só aparece
          abaixo de 64rem, onde a navegação do módulo vira painel.
        -->
        <nav
          aria-label="Módulos"
          class="sticky top-0 z-[var(--ucam-z-faixa)] flex w-[4.5rem] flex-col items-center gap-[var(--ucam-space-inline-xs)] bg-[var(--ucam-color-surface-brand)] py-[var(--ucam-space-inset-md)] text-[var(--ucam-color-text-on-action)]"
          [class.h-[100dvh]]="!embedded()"
          [class.h-full]="embedded()"
        >
          <ucam-icon-button
            class="lg:hidden"
            icon="menu"
            variant="ghost"
            [label]="navAberta() ? 'Fechar navegação' : 'Abrir navegação'"
            [attr.aria-expanded]="navAberta()"
            [attr.aria-controls]="navId()"
            (click)="alternaNav()"
          />
          <div class="flex flex-col items-center gap-[var(--ucam-space-inline-xs)]">
            <ng-content select="[ucamShellRail]" />
          </div>
          <span class="mt-auto"></span>
          <ng-container [ngTemplateOutlet]="acoes" />
          @if (user(); as u) {
            <ucam-avatar [name]="u.name" [photoUrl]="u.photoUrl ?? null" size="sm" />
          }
        </nav>
      }

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
        class="flex flex-col border-e border-[var(--ucam-color-border-subtle)] bg-[var(--ucam-color-surface-chrome)] max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-[200] max-lg:w-[var(--ucam-nav-width)] max-lg:transition-transform"
        [class]="classesNav()"
        [class.max-lg:-translate-x-full]="!navAberta()"
      >
        @if (shellLayout() === 'lateral') {
          <!--
            A MARCA NO ALTO DA COLUNA, no lugar da faixa que este arranjo não
            emite: marquinha e nome do sistema, as ações da aplicação e, em
            fileira própria, o campus com rótulo visível — o dado que decide
            quais registros a tela mostra ganha o peso de um campo.
          -->
          <div
            class="flex flex-col gap-[var(--ucam-space-stack-sm)] border-b border-[var(--ucam-color-border-subtle)] p-[var(--ucam-space-inset-md)]"
          >
            <div class="flex min-h-14 items-center gap-[var(--ucam-space-inline-sm)]">
              <a
                [href]="homeHref()"
                class="inline-flex min-w-0 items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control-sm)] text-[var(--ucam-color-text-primary)] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
              >
                @if (systemIcon()) {
                  <span
                    class="inline-flex size-[var(--ucam-size-control-lg)] shrink-0 items-center justify-center rounded-[var(--ucam-radius-control)] text-[var(--ucam-color-text-on-action)]"
                    [style.background]="tintaSistema()"
                    aria-hidden="true"
                  >
                    <ucam-icon [name]="systemIcon()!" />
                  </span>
                }
                <span class="truncate font-medium">{{ systemName() }}</span>
              </a>
              <span class="ms-auto"></span>
              <ng-container [ngTemplateOutlet]="acoes" />
            </div>
            <ng-container [ngTemplateOutlet]="campus" [ngTemplateOutletContext]="{ $implicit: true }" />
          </div>
        }

        @if (shellLayout() === 'rail') {
          <!-- SELETOR DE SISTEMA: sem faixa, o nome do sistema mora no alto do
               menu que ele governa. Com faixa ele não existe — o nome já está
               na marca, e repeti-lo é o defeito do SIGFIN. -->
          <div
            class="flex h-[3.75rem] shrink-0 items-center gap-[var(--ucam-space-inline-sm)] border-b border-[var(--ucam-color-border-subtle)] px-[var(--ucam-space-inset-md)]"
          >
            @if (systemIcon()) {
              <span
                class="inline-flex size-[var(--ucam-size-control-md)] shrink-0 items-center justify-center rounded-[var(--ucam-radius-control)] text-[var(--ucam-color-text-on-action)]"
                [style.background]="tintaSistema()"
                aria-hidden="true"
              >
                <ucam-icon [name]="systemIcon()!" size="sm" />
              </span>
            }
            <a
              [href]="homeHref()"
              class="truncate rounded-[var(--ucam-radius-control-sm)] font-medium text-[var(--ucam-color-text-primary)] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
              >{{ systemName() }}</a
            >
          </div>
        }

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

        @if (shellLayout() === 'lateral' && user(); as u) {
          <!-- A CONTA no pé da coluna, com NOME VISÍVEL: na faixa sobrava só o
               avatar porque o nome custava largura ao lado da marca; aqui a
               linha está vazia de qualquer forma. Fora da rolagem, para um
               menu longo não enterrar quem está logado. -->
          <div
            class="flex items-center gap-[var(--ucam-space-inline-sm)] border-t border-[var(--ucam-color-border-subtle)] p-[var(--ucam-space-inset-md)]"
          >
            <ucam-avatar [name]="u.name" [photoUrl]="u.photoUrl ?? null" size="sm" decorative />
            <span class="flex min-w-0 flex-col">
              <span class="truncate text-[length:var(--ucam-typography-body-sm-font-size)] font-medium">{{ u.name }}</span>
              @if (context()) {
                <span class="truncate text-[length:var(--ucam-typography-caption-font-size)] text-[var(--ucam-color-text-secondary)]"
                  >{{ contextLabel() }} {{ rotuloContexto() }}</span
                >
              }
            </span>
          </div>
        }
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
  /** 'brand' é o default do CONTRATO e, desde 25/09/2026, o que o Trilho A faz
   *  em toda faixa: fundo na superfície de marca do sistema (a subpaleta troca
   *  --ucam-color-surface-brand por data-sistema quando a folha do Trilho A está
   *  carregada; só com @ucam/ui, é o bordô da universidade). */
  readonly appbarAppearance = input<UcamAppbarAppearance>('brand');
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
  /** O arranjo da moldura (29/09/2026). 'appbar' é o default do contrato. */
  readonly shellLayout = input<UcamShellLayout>('appbar');
  /**
   * Campus ou unidade ativa — o VALOR da opção em contextOptions. Model, e
   * não input: a troca emite contextChange, e recarregar os dados é da
   * aplicação.
   */
  readonly context = model<string | null>(null);
  /** A palavra antes do valor: "Campos" sozinho não diz que é campus. */
  readonly contextLabel = input<string>('Campus');
  /** Com mais de uma opção, o contexto vira select; com uma, é só texto. */
  readonly contextOptions = input<UcamOption[] | null>(null);

  protected readonly navId = signal(`ucam-nav-${Math.random().toString(36).slice(2, 8)}`);
  protected readonly contentId = signal('conteudo');
  protected readonly navAberta = signal(false);
  /** true a partir de 64rem: a navegação vira coluna e deixa de sobrepor. */
  protected readonly largura = signal(true);

  constructor() {
    /**
     * A SUBPALETA CHEGA AO QUE A BASE MONTA FORA DO SHELL. Gaveta, menu,
     * select, combobox e tooltip da ZardUI são montados no contêiner de
     * overlay do CDK, filho do <body>: lá os tokens de ação são os do :root
     * — o bordô —, e a gaveta de questões do Vestibular (teal) abria com a
     * legenda e as bolhas em bordô. Medido em 03/10/2026, em 390px. O shell
     * carimba o próprio data-sistema no contêiner, e a folha e a ponte
     * declaram a subpaleta também nele. Uma página tem um shell; se houver
     * dois, vale o último que renderizou, e é o que o site de demonstração
     * já aceita para a faixa.
     */
    const overlay = inject(OverlayContainer);
    // Só o efeito pede o contêiner (que o CDK cria na primeira chamada). Na
    // destruição vale o que o efeito tocou: pedir o contêiner ali, no
    // prerender do site, criava-o num injetor já destruído (NG0205).
    let carimbado: HTMLElement | null = null;
    afterRenderEffect(() => {
      carimbado = overlay.getContainerElement();
      const sistema = this.systemCategory();
      if (sistema) carimbado.setAttribute('data-sistema', sistema);
      else carimbado.removeAttribute('data-sistema');
    });
    inject(DestroyRef).onDestroy(() => carimbado?.removeAttribute('data-sistema'));

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

  protected readonly trocaContexto = computed(() => (this.contextOptions()?.length ?? 0) > 1);

  /** O rótulo da opção ativa; sem opções, o próprio valor. */
  protected readonly rotuloContexto = computed(() => {
    const v = this.context();
    return this.contextOptions()?.find((o) => o.value === v)?.label ?? v ?? '';
  });

  protected trocarContexto(valor: string): void {
    if (valor === this.context()) return;
    this.context.set(valor);
  }

  /**
   * A GRADE por arranjo. Literais inteiros, e não montados por pedaço: o
   * Tailwind acha as classes lendo o fonte, e classe concatenada não existe
   * para ele.
   *   appbar  → faixa na primeira fileira, coluna + conteúdo na segunda;
   *   lateral → mobilebar em cima só abaixo de 64rem, e uma fileira só acima;
   *   rail    → rail de 72px sempre, coluna do módulo a partir de 64rem.
   */
  protected readonly classesGrade = computed(() => {
    switch (this.shellLayout()) {
      case 'lateral':
        return 'grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[var(--ucam-nav-width)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]';
      case 'rail':
        return 'grid grid-cols-[4.5rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] lg:grid-cols-[4.5rem_var(--ucam-nav-width)_minmax(0,1fr)]';
      default:
        return 'grid grid-cols-1 grid-rows-[var(--ucam-appbar-height)_minmax(0,1fr)] lg:grid-cols-[var(--ucam-nav-width)_minmax(0,1fr)]';
    }
  });

  /** Onde a coluna gruda: sob a faixa no appbar; no topo da janela sem ela. */
  protected readonly classesNav = computed(() => {
    if (this.shellLayout() === 'appbar') {
      return 'lg:sticky lg:top-[var(--ucam-appbar-height)] lg:h-[calc(100dvh-var(--ucam-appbar-height))]';
    }
    return this.embedded() ? 'lg:h-full' : 'lg:sticky lg:top-0 lg:h-[100dvh]';
  });

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
    // O degrau para o que gruda DENTRO do conteúdo (barra de visão, cabeçalho
    // de página): a faixa também gruda, com z maior, e o que grudasse em zero
    // ia por baixo dela assim que a página rolava.
    '--ucam-sticky-top': 'var(--ucam-appbar-height)',
  }));

  /** A tinta do sistema: a cor da categoria puxada para o legível, como no
   *  Trilho A (color-mix com text-primary, que escurece no claro e clareia no
   *  escuro). Sem categoria, a ação comum. */
  protected readonly tintaSistema = computed(() =>
    this.systemCategory()
      ? `color-mix(in oklab, var(--ucam-color-categoria-${this.systemCategory()}), var(--ucam-color-text-primary) 28%)`
      : 'var(--ucam-color-action-primary-default)',
  );

  /** A marquinha sobre a faixa de marca é COMPOSIÇÃO TONAL (25/09/2026): um
   *  tom mais claro da própria faixa (o texto a 18%) com o ícone em branco —
   *  o ladrilho cheio na tinta sumiria sobre a faixa da mesma cor. Na faixa
   *  clara ele continua na tinta do sistema. */
  protected readonly ladrilhoMarca = computed(() =>
    this.appbarAppearance() === 'light' ? this.tintaSistema() : 'color-mix(in srgb, currentColor 18%, transparent)',
  );

  protected readonly classesFaixa = computed(() =>
    this.appbarAppearance() === 'brand'
      ? 'bg-[var(--ucam-color-surface-brand)] text-[var(--ucam-color-text-on-brand)]'
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
