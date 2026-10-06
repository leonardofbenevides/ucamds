import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { UcamAvatar } from '../avatar/ucam-avatar';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';
import { UcamMenu, UcamMenuTrigger, type UcamMenuItem } from '../menu/ucam-menu';
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
 * 05/10/2026: entram as peças que a prova de paridade de tela (ADR-058)
 * acusava como o grosso da diferença entre os trilhos, todas já no contrato:
 *   · a busca global da faixa (searchable, searchShortcut) — o shell desenha
 *     o campo, registra a tecla e emite; o que se procura é da aplicação;
 *   · o sino com contagem (notifications) e o menu da conta, com o nome por
 *     extenso e o Sair (signOut);
 *   · na coluna, o botão de recolher (navCollapsible, navCollapsed), a ação
 *     do módulo (navAction) e o grupo Favoritos (favorites, unpin).
 *
 * O QUE AINDA NÃO COBRE, e está dito no contrato em vez de fingido: o
 * lançador de sistemas (a aplicação o projeta em [ucamShellAcoes]), o painel
 * de resultados da busca, a busca dentro da navegação (navSearchable) e os
 * subitens. Entram na ordem em que as telas pedirem.
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

/** A ação do módulo no alto da coluna. Link com href, botão sem. */
export interface UcamNavAction {
  label: string;
  icon?: UcamIconName;
  href?: string;
}

/** A mesma chave do Trilho A: a preferência vale nos dois trilhos. */
const CHAVE_RECOLHIDA = 'ucam-nav-recolhida';
const ID_SAIR = 'ucam-conta-sair';

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
  imports: [NgTemplateOutlet, UcamAvatar, UcamIcon, UcamIconButton, UcamMenu, UcamMenuTrigger, UcamSelect],
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
      border-color: color-mix(in srgb, currentColor 20%, transparent);
      padding-inline: var(--ucam-space-inline-sm);
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
    /* O svg trazia a tinta secundária por regra própria e não herdava: o
       chevron saía grafite sobre o bordô, quase invisível (05/10/2026). */
    ucam-app-shell .ucam-campus--faixa [data-slot='select-trigger'] ng-icon svg {
      color: inherit;
    }
    /* A barra de visão da folha do Trilho A (.ucam-viewbar) gruda em zero, e o
       degrau que a põe abaixo da faixa lá depende de .ucam-appbar ~ .ucam-main,
       que esta moldura não emite. Dentro dela, o degrau é o --ucam-sticky-top. */
    ucam-app-shell .ucam-viewbar {
      inset-block-start: var(--ucam-sticky-top);
    }
    /* O botão de ícone que a aplicação projeta na faixa ou no rail (o
       lançador de sistemas) herda a tinta DELA: a tinta secundária do
       fantasma é grafite, e sobre o bordô some. */
    ucam-app-shell :is(header, nav[aria-label='Módulos']) ucam-icon-button button[data-ucam-variant='ghost'] {
      color: color-mix(in srgb, currentColor 72%, transparent);
    }
    /* Botão de ícone da faixa — sino, lupa: 32px, tinta apagada que acende. */
    ucam-app-shell .ucam-shell-lancador {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      inline-size: var(--ucam-size-control-sm);
      block-size: var(--ucam-size-control-sm);
      padding: 0;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      color: color-mix(in srgb, currentColor 72%, transparent);
      cursor: pointer;
    }
    /* A lupa só existe abaixo de 64rem: acima, o campo está na faixa. Por
       regra e não por utilitária — o display de cima não tem camada e
       venceria o lg:hidden. */
    @media (min-width: 64rem) {
      ucam-app-shell .ucam-shell-lupa {
        display: none;
      }
    }
    ucam-app-shell .ucam-shell-lancador:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    ucam-app-shell .ucam-shell-lancador:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    ucam-app-shell .ucam-shell-busca__campo::placeholder {
      color: inherit;
      opacity: 0.72;
    }
    /* O X nativo do type=search sai: Esc limpa, e ele não segue a tinta. */
    ucam-app-shell .ucam-shell-busca__campo::-webkit-search-cancel-button {
      display: none;
    }
    @media (max-width: 63.999rem) {
      /* A CAIXA DEITADA sobre a faixa. O resto sai da vista por visibility,
         e não display: a faixa não muda de arranjo e fechar devolve tudo no
         mesmo lugar. */
      ucam-app-shell .ucam-shell-busca[data-aberta] {
        position: absolute;
        inset-inline: var(--ucam-space-inset-md);
        flex: none;
        z-index: 1;
      }
      ucam-app-shell header:has(> .ucam-shell-busca[data-aberta]) > :not(.ucam-shell-busca) {
        visibility: hidden;
      }
    }
    /* ABAIXO DE faixa-minima (30rem) a faixa não cabe inteira: o campus e o
       divisor saem (o campus reaparece no alto da gaveta), o chevron da conta
       sai e a marquinha desce um degrau. É o que a folha do Trilho A faz —
       sem isto a faixa empurrava a página para o lado a 390px. */
    @media (max-width: 29.999rem) {
      ucam-app-shell header > .ucam-campus--faixa,
      ucam-app-shell .ucam-shell-divisor,
      ucam-app-shell .ucam-shell-chevron {
        display: none;
      }
      ucam-app-shell .ucam-shell-marca {
        inline-size: var(--ucam-size-control-md);
        block-size: var(--ucam-size-control-md);
      }
      ucam-app-shell .ucam-shell-sistema {
        display: -webkit-box;
        overflow: hidden;
        font-size: 0.875rem;
        line-height: 1.15;
        white-space: normal;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      ucam-app-shell .ucam-shell-gaveta-campus {
        display: block;
      }
    }
    /* O QUE A APLICAÇÃO PROJETA no pé da coluna também recolhe. O item é
       dela (.ucam-nav__item da folha, ou um link qualquer): o rótulo sai da
       vista por recorte, nunca da árvore de acessibilidade, e o ícone centra. */
    ucam-app-shell nav[data-recolhida] :is(a, button, [role='link']) > span:not([aria-hidden]) {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    ucam-app-shell nav[data-recolhida] .ucam-nav__item {
      justify-content: center;
      padding-inline: 0;
    }
    /* Em tela de toque não há ponteiro para revelar o desfixar. */
    @media (hover: none) {
      ucam-app-shell .ucam-shell-desfixar {
        opacity: 1;
      }
    }
    ucam-app-shell .ucam-shell-desfixar svg {
      fill: currentColor;
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
      class="sticky top-0 z-[var(--ucam-z-faixa)] col-span-full flex h-[var(--ucam-appbar-height)] items-center gap-[var(--ucam-space-inline-sm)] shadow-[inset_0_-1px_0_var(--ucam-shell-filete)] px-[var(--ucam-space-inset-lg)]"
        [class]="classesFaixa()"
        [style]="estiloFaixa()"
      >
        <!-- Gatilho da navegação: só abaixo de 64rem, onde ela é sobreposta. -->
        <ucam-icon-button
          class="lg:hidden"
          icon="menu"
          variant="ghost"
          size="sm"
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
          <!--
            A LOGO DA UNIVERSIDADE (ADR-060): abre a faixa, antes da marquinha,
            quando a aplicação diz onde o arquivo está. Máscara, e não <img>,
            pelo mesmo motivo da folha do Trilho A: a marca é monocromática e
            toma a tinta da faixa. Só a partir de 64rem — abaixo disso a faixa
            abre com a marquinha e o nome, como antes.
          -->
          @if (logoUrl()) {
            <span
              class="ucam-shell-logo hidden shrink-0 bg-current min-[64rem]:block"
              [style.inline-size]="'var(--ucam-appbar-logo-width, 6.85rem)'"
              [style.block-size]="'var(--ucam-appbar-logo-height, 1.25rem)'"
              [style.mask]="mascaraLogo()"
              [style.-webkit-mask]="mascaraLogo()"
              aria-hidden="true"
            ></span>
            <span
              class="ucam-shell-logo-fio hidden w-px shrink-0 bg-current opacity-30 min-[64rem]:block"
              [style.block-size]="'var(--ucam-appbar-logo-height, 1.25rem)'"
              aria-hidden="true"
            ></span>
          }
          @if (systemIcon()) {
            <span
              class="ucam-shell-marca inline-flex size-[var(--ucam-size-control-lg)] shrink-0 items-center justify-center rounded-[var(--ucam-radius-control)]"
              [style.background]="ladrilhoMarca()"
              [style.color]="appbarAppearance() === 'light' ? 'var(--ucam-color-text-on-action)' : 'currentColor'"
              aria-hidden="true"
            >
              <ucam-icon [name]="systemIcon()!" />
            </span>
          }
          <span
            class="ucam-shell-sistema text-[length:var(--ucam-appbar-system-size)] [font-weight:var(--ucam-typography-action-font-weight)] tracking-[-0.01em] whitespace-nowrap"
            >{{ systemName() }}</span
          >
        </a>

        <span class="flex-1"></span>
        @if (searchable()) {
          <!--
            BUSCA GLOBAL. Centrada pelos dois espaçadores e com teto de 34rem:
            campo que estica até a borda lê como barra de endereço. O anel de
            foco mora no invólucro — o input não tem borda própria. Abaixo de
            64rem o campo sai e a lupa o deita por cima da faixa inteira.
          -->
          <div
            class="ucam-shell-busca relative h-[var(--ucam-size-control-md)] flex-[0_1_34rem] items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control)] border px-[var(--ucam-space-inline-sm)] transition-colors focus-within:outline focus-within:outline-[length:var(--ucam-focus-ring-width)] focus-within:outline-offset-[var(--ucam-focus-ring-offset)] focus-within:outline-[var(--ucam-color-border-focus)]"
            [class]="buscaAberta() ? 'flex' : 'hidden lg:flex'"
            [attr.data-aberta]="buscaAberta() ? '' : null"
            [style.border-color]="linhaControle()"
            [style.color]="tintaApagada()"
            (focusout)="aoSairDaBusca($event)"
          >
            <label class="sr-only" [for]="buscaId">{{ searchLabel() }}</label>
            <ucam-icon name="search" aria-hidden="true" />
            <input
              #campoBusca
              [id]="buscaId"
              type="search"
              autocomplete="off"
              class="ucam-shell-busca__campo h-full min-w-0 flex-1 self-stretch border-0 bg-transparent p-0 text-[length:var(--ucam-typography-body-sm-font-size)] outline-none"
              [style.color]="faixaTinta() ? 'var(--ucam-color-text-on-brand)' : 'var(--ucam-color-text-primary)'"
              [placeholder]="searchLabel()"
              [attr.aria-keyshortcuts]="searchShortcut()"
              [value]="searchQuery()"
              (input)="searchQuery.set(campoBusca.value)"
              (keydown.enter)="search.emit(searchQuery())"
              (keydown.escape)="fechaBusca(true)"
            />
            @if (searchShortcut(); as tecla) {
              <!-- aria-hidden: para quem ouve, o atalho já vai no
                   aria-keyshortcuts do campo. -->
              <kbd
                aria-hidden="true"
                class="inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-[var(--ucam-radius-miudo)] border px-1 font-mono text-[0.6875rem] leading-none"
                [style.border-color]="linhaControle()"
                >{{ tecla }}</kbd
              >
            }
          </div>
          <span class="flex-1 max-lg:hidden"></span>
          <button
            #lupa
            type="button"
            class="ucam-shell-lancador ucam-shell-lupa"
            aria-label="Buscar"
            [attr.aria-keyshortcuts]="searchShortcut()"
            [attr.aria-controls]="buscaId"
            [attr.aria-expanded]="buscaAberta()"
            (click)="abreBusca()"
          >
            <ucam-icon name="search" aria-hidden="true" />
          </button>
        }
        <!-- Campus antes das ações: é o contexto de TODA a tela, e mora ao
             lado da conta, no grupo que responde "onde estou". -->
        <ng-container [ngTemplateOutlet]="campus" [ngTemplateOutletContext]="{ $implicit: false }" />
        @if (context()) {
          <span class="ucam-shell-divisor h-5 w-px shrink-0 bg-[color-mix(in_srgb,currentColor_10%,transparent)]" aria-hidden="true"></span>
        }
        @if (notifications() !== null) {
          <!--
            SINO. A contagem é número, não booleano: zero mostra o sino sem
            selo (há o recurso e você está em dia), null não mostra sino. O
            número entra no nome acessível; o selo é só para quem vê.
          -->
          <button type="button" class="ucam-shell-lancador relative" (click)="openNotifications.emit()">
            <ucam-icon name="bell" aria-hidden="true" />
            <span class="sr-only">Notificações</span>
            @if (notifications()) {
              <span
                aria-hidden="true"
                class="pointer-events-none absolute start-1/2 -top-0.5 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[length:var(--ucam-typography-caption-font-size)] leading-none font-medium tabular-nums"
                [style]="estiloSelo()"
                >{{ notifications() }}</span
              >
              <span class="sr-only">, {{ notifications() }} não lidas</span>
            }
          </button>
        }
        <!-- Ações da faixa: o lançador de sistemas e o que mais a aplicação
             projetar. -->
        <ng-container [ngTemplateOutlet]="acoes" />

        @if (user(); as u) {
          <!--
            CONTA. O gatilho é o avatar e nada mais: o nome por extenso e o
            Sair moram no menu, que é onde signOut é acionado.
          -->
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center gap-[var(--ucam-space-inline-xs)] rounded-full border border-transparent bg-transparent p-0.5 pe-1 text-inherit transition-colors hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[currentColor]"
            [ucamMenuTrigger]="menuConta"
          >
            @if (u.photoUrl) {
              <ucam-avatar [name]="u.name" [photoUrl]="u.photoUrl" size="sm" decorative />
            } @else {
              <span
                aria-hidden="true"
                class="inline-flex size-[var(--ucam-size-control-sm)] shrink-0 items-center justify-center rounded-full border bg-[color-mix(in_srgb,currentColor_10%,transparent)] text-[length:var(--ucam-typography-caption-font-size)] [font-weight:var(--ucam-typography-action-font-weight)] tracking-[0.01em]"
                [style.border-color]="linhaControle()"
                >{{ iniciais() }}</span
              >
            }
            <span class="sr-only">Conta de {{ u.name }}</span>
            <ucam-icon class="ucam-shell-chevron" name="chevronDown" size="sm" aria-hidden="true" [style.color]="tintaApagada()" />
          </button>
          <!-- hidden: o painel é montado no overlay; o hospedeiro vazio
               cobraria um vão da faixa. -->
          <ucam-menu
            class="hidden"
            #menuConta
            [items]="itensConta()"
            [heading]="u.name"
            [subheading]="context() ? contextLabel() + ' ' + rotuloContexto() : null"
            (escolher)="aoEscolherNaConta($event)"
          />
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
        [attr.data-recolhida]="recolhida() ? '' : null"
        class="flex flex-col overflow-x-hidden border-e border-[var(--ucam-color-border-subtle)] bg-[var(--ucam-color-surface-chrome)] max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-[200] max-lg:w-[var(--ucam-nav-width)] max-lg:transition-transform"
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

        <!--
          UM ITEM de navegação, desenhado num lugar só: os grupos e os
          Favoritos usam o mesmo. Recolhida, o rótulo sai da vista por recorte
          e NÃO da árvore de acessibilidade — o item continua tendo nome —, e a
          contagem vira ponto, com o número ainda no nome acessível.
        -->
        <ng-template #itemNav let-item let-fixado="fixado">
          <a
            [href]="item.disabled ? null : (item.href ?? null)"
            [attr.role]="item.disabled ? 'link' : null"
            [attr.aria-current]="item.current ? 'page' : null"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            [attr.title]="recolhida() ? item.label : null"
            class="relative flex min-h-[var(--ucam-size-control-lg)] items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control)] border border-transparent py-[var(--ucam-space-inline-xs)] text-[length:var(--ucam-typography-body-sm-font-size)] leading-5 no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
            [class]="classesItem(item, fixado)"
          >
            @if (item.icon) {
              <ucam-icon [name]="item.icon" [style.color]="item.current ? 'var(--ucam-color-action-primary-default)' : null" />
            }
            <span [class]="recolhida() ? 'sr-only' : 'min-w-0 flex-1 truncate'">{{ item.label }}</span>
            @if (item.count != null) {
              @if (recolhida()) {
                <span class="sr-only">, {{ item.count }}</span>
                <span
                  aria-hidden="true"
                  class="absolute end-2 top-2 size-2 rounded-full bg-[var(--ucam-color-notificacao-background)]"
                ></span>
              } @else {
                <span
                  class="inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[length:var(--ucam-typography-caption-font-size)] tabular-nums"
                  [class]="item.current ? 'bg-[var(--ucam-color-surface-default)] text-[var(--ucam-color-text-primary)]' : 'text-[var(--ucam-color-text-secondary)]'"
                  >{{ item.count }}</span
                >
              }
            }
          </a>
        </ng-template>

        @if (context() && shellLayout() === 'appbar') {
          <!-- O campus na GAVETA: abaixo de faixa-minima ele sai da faixa, e o
               contexto de toda a tela não pode sumir com ele. -->
          <p
            class="ucam-shell-gaveta-campus m-0 hidden shrink-0 border-b border-[var(--ucam-color-border-subtle)] px-[var(--ucam-space-inset-md)] py-[var(--ucam-space-inline-xs)] text-[length:var(--ucam-typography-caption-font-size)] text-[var(--ucam-color-text-secondary)]"
          >
            {{ contextLabel() }} · {{ rotuloContexto() }}
          </p>
        }

        @if (navCollapsible() && shellLayout() === 'appbar') {
          <!--
            RECOLHER. Só a partir de 64rem: abaixo disso a coluna já é painel
            sobreposto e recolher não significa nada. aria-expanded aponta a
            própria navegação — o que se vê e o que se ouve é o mesmo atributo.
          -->
          <div
            class="hidden shrink-0 px-[var(--ucam-shell-nav-recuo)] pt-[var(--ucam-space-inset-sm)] pb-[var(--ucam-space-inline-xs)] lg:flex"
          >
            <button
              type="button"
              class="ms-[var(--ucam-shell-nav-recuo)] inline-flex size-[var(--ucam-size-control-sm)] shrink-0 cursor-pointer items-center justify-center rounded-[var(--ucam-radius-control-sm)] border-0 bg-transparent p-0 text-[var(--ucam-color-text-secondary)] transition-colors hover:bg-[var(--ucam-color-surface-subtle)] hover:text-[var(--ucam-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
              [attr.aria-controls]="navId()"
              [attr.aria-expanded]="!recolhida()"
              [attr.aria-label]="recolhida() ? 'Expandir navegação' : 'Recolher navegação'"
              (click)="alternaRecolhida()"
            >
              <ucam-icon name="menu" aria-hidden="true" />
            </button>
          </div>
        }

        @if (navAction(); as acao) {
          <!--
            A AÇÃO DO MÓDULO, fora da rolagem. Secundária (ADR-050): o lugar
            fixo já diz que é a ação do módulo, e o primário em vista é o da
            tela. Link quando há destino, botão enquanto não há.
          -->
          <ng-template #rotuloAcao>
            <ucam-icon [name]="acao.icon ?? 'plus'" aria-hidden="true" />
            <span [class]="recolhida() ? 'sr-only' : 'truncate'">{{ acao.label }}</span>
          </ng-template>
          <div class="shrink-0 px-[var(--ucam-shell-nav-recuo)] pt-[var(--ucam-space-inset-sm)]">
            @if (acao.href) {
              <a [href]="acao.href" [class]="classesAcao()" [attr.title]="recolhida() ? acao.label : null">
                <ng-container [ngTemplateOutlet]="rotuloAcao" />
              </a>
            } @else {
              <button
                type="button"
                [class]="classesAcao()"
                [attr.title]="recolhida() ? acao.label : null"
                (click)="navActionClick.emit()"
              >
                <ng-container [ngTemplateOutlet]="rotuloAcao" />
              </button>
            }
          </div>
        }

        <div
          class="flex flex-1 flex-col gap-[var(--ucam-space-stack-md)] overflow-y-auto px-[var(--ucam-shell-nav-recuo)] py-[var(--ucam-space-inset-sm)]"
        >
          @if (favorites()?.length) {
            <!--
              FAVORITOS, antes dos grupos do sistema e só quando há algo
              fixado. O título é botão e recolhe a lista. O desfixar fica AO
              LADO do link, nunca dentro: alvo aninhado é HTML inválido.
            -->
            <div>
              @if (!recolhida()) {
                <button
                  type="button"
                  class="mb-[var(--ucam-space-inline-xs)] flex min-h-6 w-full cursor-pointer items-center gap-[var(--ucam-space-inline-xs)] rounded-[var(--ucam-radius-control-sm)] border-0 bg-transparent px-[calc(var(--ucam-space-inset-sm)+1px)] py-px text-[length:var(--ucam-typography-caption-font-size)] leading-5 font-medium text-[var(--ucam-color-text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
                  [attr.aria-expanded]="favoritosAbertos()"
                  [attr.aria-controls]="navId() + '-favoritos'"
                  (click)="favoritosAbertos.set(!favoritosAbertos())"
                >
                  <span>Favoritos</span>
                  <ucam-icon
                    name="chevronDown"
                    size="sm"
                    aria-hidden="true"
                    class="transition-transform"
                    [class.-rotate-90]="!favoritosAbertos()"
                  />
                </button>
              }
              <div
                [id]="navId() + '-favoritos'"
                class="flex-col gap-0.5"
                [class]="favoritosAbertos() || recolhida() ? 'flex' : 'hidden'"
              >
                @for (item of favorites(); track item.label) {
                  <div class="group/fixado relative">
                    <ng-container [ngTemplateOutlet]="itemNav" [ngTemplateOutletContext]="{ $implicit: item, fixado: true }" />
                    @if (!recolhida()) {
                      <button
                        type="button"
                        class="ucam-shell-desfixar absolute end-1 top-1/2 inline-flex h-[var(--ucam-size-control-sm)] w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--ucam-radius-control)] border border-transparent bg-transparent p-0 text-[var(--ucam-color-action-primary-default)] opacity-0 transition-opacity group-focus-within/fixado:opacity-100 group-hover/fixado:opacity-100 hover:bg-[var(--ucam-color-interaction-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
                        aria-pressed="true"
                        [attr.aria-label]="'Remover ' + item.label + ' dos favoritos'"
                        (click)="unpin.emit(item)"
                      >
                        <ucam-icon name="star" size="sm" aria-hidden="true" />
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
          @for (grupo of navGroups(); track grupo.label ?? $index) {
            <div>
              @if (grupo.label) {
                <!-- Caixa natural, um degrau menor e tinta secundária: é o
                     que separa título de grupo de destino navegável (ADR-046). -->
                <p
                  class="m-0 mb-[var(--ucam-space-inline-xs)] px-[calc(var(--ucam-space-inset-sm)+1px)] text-[length:var(--ucam-typography-caption-font-size)] leading-5 font-medium text-[var(--ucam-color-text-secondary)]"
                  [class.sr-only]="recolhida()"
                >
                  {{ grupo.label }}
                </p>
              }
              <div class="flex flex-col gap-0.5">
                @for (item of grupo.items; track item.label) {
                  <ng-container [ngTemplateOutlet]="itemNav" [ngTemplateOutletContext]="{ $implicit: item, fixado: false }" />
                }
              </div>
            </div>
          }
          <ng-content select="[ucamShellNav]" />
        </div>

        <!-- PÉ da navegação, fora da rolagem: configuração e ajuda não são
             destino de trabalho, e não podem disputar o alto da coluna. -->
        <div
          class="flex shrink-0 flex-col gap-0.5 border-t border-[var(--ucam-color-border-subtle)] px-[var(--ucam-shell-nav-recuo)] py-[var(--ucam-space-inset-sm)]"
        >
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
  /** Endereço da logo horizontal da universidade (SVG monocromático). Com ele
   *  a faixa abre com a logo, um filete e só então a marquinha do sistema
   *  (ADR-060). Sem ele, a faixa abre com a marquinha, como sempre. */
  readonly logoUrl = input<string | null>(null);
  protected readonly mascaraLogo = computed(() =>
    this.logoUrl() ? `url("${this.logoUrl()}") no-repeat left center / contain` : null,
  );
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
  /** Oferece o botão de recolher. Só no arranjo appbar, por enquanto. */
  readonly navCollapsible = input(true, { transform: booleanAttribute });
  /**
   * Estado da coluna. Model: o botão o troca. A escolha de quem usa persiste
   * em localStorage (a mesma chave do Trilho A) e vence o valor inicial a
   * partir da segunda visita.
   */
  readonly navCollapsed = model(false);
  /** A ação do módulo no alto da coluna: "Novo requerimento" no Protocolo. */
  readonly navAction = input<UcamNavAction | null>(null);
  /** Acionada quando navAction não tem href. */
  readonly navActionClick = output<void>();
  /** Os itens fixados por quem usa. null ou vazio: o grupo não existe. */
  readonly favorites = input<UcamNavItem[] | null>(null);
  /** O item cujo desfixar foi acionado. Quem persiste é a aplicação. */
  readonly unpin = output<UcamNavItem>();

  /** Liga a busca global na faixa. O shell não presume que há o que buscar. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Nome acessível e placeholder do campo: diz O QUE se procura. */
  readonly searchLabel = input<string>('Buscar');
  /**
   * A tecla que leva o foco ao campo, desenhada dentro dele. O shell a
   * registra — atalho escrito e não implementado é promessa falsa.
   */
  readonly searchShortcut = input<string | null>(null);
  /** O texto do campo, a cada tecla: é com ele que a aplicação filtra. */
  readonly searchQuery = model('');
  /** Enter no campo. */
  readonly search = output<string>();

  /** Não lidas. Zero: sino sem selo. null: a aplicação não tem o recurso. */
  readonly notifications = input<number | null>(null);
  readonly openNotifications = output<void>();

  /** Itens da aplicação no menu da conta, acima do Sair. */
  readonly userMenuItems = input<UcamMenuItem[]>([]);
  readonly userMenuSelect = output<UcamMenuItem>();
  readonly signOut = output<void>();
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
  protected readonly buscaId = `ucam-busca-${Math.random().toString(36).slice(2, 8)}`;
  /** A caixa de busca deitada sobre a faixa, abaixo de 64rem. */
  protected readonly buscaAberta = signal(false);
  protected readonly favoritosAbertos = signal(true);
  private readonly campoBusca = viewChild<ElementRef<HTMLInputElement>>('campoBusca');
  private readonly lupa = viewChild<ElementRef<HTMLButtonElement>>('lupa');

  /** Recolhida só vale onde a navegação é coluna: na gaveta ela abre inteira. */
  protected readonly recolhida = computed(
    () =>
      (this.preferencia() ?? this.navCollapsed()) &&
      this.navCollapsible() &&
      this.largura() &&
      this.shellLayout() === 'appbar',
  );
  /** O que quem usa escolheu, lido do armazenamento: vence o input. */
  private readonly preferencia = signal<boolean | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const guardado = window.localStorage.getItem(CHAVE_RECOLHIDA);
        if (guardado !== null) this.preferencia.set(guardado === '1');
      } catch {
        /* armazenamento bloqueado: vale o valor do input */
      }
      // O ATALHO da busca. Fora de campo de texto e sem modificador: "/"
      // digitada num textarea é uma barra, não um pedido de busca.
      const tecla = (e: KeyboardEvent) => {
        const atalho = this.searchShortcut();
        if (!atalho || !this.searchable() || e.key !== atalho || e.ctrlKey || e.metaKey || e.altKey) return;
        const alvo = e.target as HTMLElement | null;
        if (alvo?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
        e.preventDefault();
        this.abreBusca();
      };
      document.addEventListener('keydown', tecla);
      this.destroyRef.onDestroy(() => document.removeEventListener('keydown', tecla));
    }

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

  protected alternaRecolhida(): void {
    const vai = !this.recolhida();
    this.preferencia.set(vai);
    this.navCollapsed.set(vai);
    try {
      window.localStorage.setItem(CHAVE_RECOLHIDA, vai ? '1' : '0');
    } catch {
      /* sem armazenamento, a escolha vale até recarregar */
    }
  }

  /** Leva o foco ao campo; abaixo de 64rem, antes o deita sobre a faixa. */
  protected abreBusca(): void {
    if (!this.largura()) this.buscaAberta.set(true);
    // O campo só existe no layout depois da troca de classe.
    setTimeout(() => this.campoBusca()?.nativeElement.focus());
  }

  protected fechaBusca(devolveFoco: boolean): void {
    if (!this.buscaAberta()) {
      // Na faixa larga, Esc só limpa: o campo não tem para onde fechar.
      if (devolveFoco) this.searchQuery.set('');
      return;
    }
    this.buscaAberta.set(false);
    if (devolveFoco) setTimeout(() => this.lupa()?.nativeElement.focus());
  }

  /** O foco saiu da caixa deitada: ela fecha, e a faixa volta. */
  protected aoSairDaBusca(e: FocusEvent): void {
    const caixa = e.currentTarget as HTMLElement;
    if (this.buscaAberta() && !caixa.contains(e.relatedTarget as Node | null)) this.fechaBusca(false);
  }

  protected readonly iniciais = computed(() => {
    const partes = (this.user()?.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (partes[0][0] + ultima).toUpperCase();
  });

  protected readonly itensConta = computed<UcamMenuItem[]>(() => [
    ...this.userMenuItems(),
    { id: ID_SAIR, label: 'Sair', icon: 'logOut', separadorAntes: this.userMenuItems().length > 0 },
  ]);

  protected aoEscolherNaConta(item: UcamMenuItem): void {
    if (item.id === ID_SAIR) this.signOut.emit();
    else this.userMenuSelect.emit(item);
  }

  /** Na faixa tinta, fio e tinta apagada saem do próprio texto; na clara, dos
   *  tokens de superfície — currentColor a 20% sobre branco some. */
  protected readonly faixaTinta = computed(
    () => this.appbarAppearance() === 'brand' || this.appbarAppearance() === 'dark',
  );

  protected readonly linhaControle = computed(() =>
    this.faixaTinta() ? 'color-mix(in srgb, currentColor 20%, transparent)' : 'var(--ucam-color-border-default)',
  );

  protected readonly tintaApagada = computed(() =>
    this.faixaTinta()
      ? 'color-mix(in srgb, var(--ucam-color-text-on-brand) 72%, transparent)'
      : 'var(--ucam-color-text-secondary)',
  );

  /** O selo do sino: invertido sobre a faixa tinta (ADR-002: marca, não
   *  vermelho), tokens de notificação na clara. O anel é a cor da faixa. */
  protected readonly estiloSelo = computed(() => {
    switch (this.appbarAppearance()) {
      case 'brand':
        return {
          background: 'var(--ucam-color-text-on-brand)',
          color: 'var(--ucam-color-surface-brand)',
          'box-shadow': '0 0 0 2px var(--ucam-color-surface-brand)',
        };
      case 'dark':
        return {
          background: 'var(--ucam-color-text-on-brand)',
          color: 'var(--ucam-color-surface-inverse)',
          'box-shadow': '0 0 0 2px var(--ucam-color-surface-inverse)',
        };
      default:
        return {
          background: 'var(--ucam-color-notificacao-background)',
          color: 'var(--ucam-color-notificacao-foreground)',
          'box-shadow': '0 0 0 2px var(--ucam-color-surface-default)',
        };
    }
  });

  protected readonly classesAcao = computed(
    () =>
      'flex h-[var(--ucam-size-control-lg)] w-full cursor-pointer items-center gap-[var(--ucam-space-inline-sm)] rounded-[var(--ucam-radius-control)] border border-[var(--ucam-color-action-secondary-border)] bg-[var(--ucam-color-surface-default)] text-[length:var(--ucam-typography-body-sm-font-size)] leading-none font-medium text-[var(--ucam-color-text-primary)] no-underline transition-colors hover:bg-[var(--ucam-color-interaction-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)] ' +
      (this.recolhida()
        ? 'justify-center px-0'
        : 'justify-start ps-[var(--ucam-space-inset-sm)] pe-[var(--ucam-space-inset-md)]'),
  );

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
    // 3.5rem recolhida, e não os 4.5 do rail: duas colunas de ícones da mesma
    // largura leem como uma só partida por um filete.
    '--ucam-nav-width': this.recolhida() ? '3.5rem' : this.navWidth(),
    // O recuo lateral da coluna: um pixel a menos que o vão, que é o do fio.
    '--ucam-shell-nav-recuo': 'calc(var(--ucam-space-inline-sm) - 1px)',
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

  /** Filete da faixa: o fio de superfície, em toda aparência — é o que a
   *  folha do Trilho A desenha (medido em 05/10/2026). Sai por SOMBRA interna
   *  e não por borda: a borda tirava 1px da caixa e centrava marca, busca e
   *  conta meio pixel acima da referência. */
  protected readonly fileteFaixa = computed(() => 'var(--ucam-color-border-subtle)');

  protected classesItem(item: UcamNavItem, fixado = false): string {
    // Recolhida, o ícone centra; fixado, a ponta direita guarda o desfixar.
    const recuo = this.recolhida()
      ? 'justify-center px-0'
      : fixado
        ? 'ps-[var(--ucam-space-inset-sm)] pe-8'
        : 'px-[var(--ucam-space-inset-sm)]';
    if (item.disabled) return recuo + ' cursor-default text-[var(--ucam-color-text-disabled)]';
    return (
      recuo +
      (item.current
        ? ' bg-[var(--ucam-color-action-primary-subtle)] [font-weight:var(--ucam-typography-action-font-weight)] text-[var(--ucam-color-text-primary)]'
        : ' text-[var(--ucam-color-text-secondary)] hover:bg-[var(--ucam-color-interaction-hover)] hover:text-[var(--ucam-color-text-primary)]')
    );
  }
}
