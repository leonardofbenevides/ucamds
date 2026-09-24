import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { noNavegador } from './no-navegador';

/** Um destino de âncora. `sub` é o segundo nível — só aparece na coluna. */
export interface Ancora {
  id: string;
  rotulo: string;
  sub?: boolean;
  /** Cabeçalho de área: organiza a lista, não é destino de leitura. */
  grupo?: boolean;
}

/**
 * Navegação de âncoras DENTRO da página.
 *
 * Existia em uma única página (a do componente) e só a partir de 82rem. Nas
 * outras vinte não existia em largura nenhuma: quem abre /fundamentos/marca,
 * que tem sete seções, rola às cegas — e nenhuma daquelas seções tinha sequer
 * um `id` para onde apontar. É a lacuna que este componente fecha.
 *
 * UM markup, DUAS apresentações — nunca as duas na tela ao mesmo tempo:
 *
 *   < 82rem   faixa horizontal de abas, grudada logo abaixo do cabeçalho,
 *             rolável na horizontal quando não cabe (é o caso da página de
 *             componente, que chega a quinze seções).
 *   ≥ 82rem   coluna à direita, o arranjo que a página de componente já tinha
 *             e que a Ant Design usa (rail de 148px, medido por CDP).
 *
 * A troca é media query sobre o MESMO <ol>. Duplicar o markup para as duas
 * formas colocaria os mesmos links duas vezes na árvore de acessibilidade.
 *
 * A lista chega por input, montada do mesmo dado que decide se a seção existe.
 * Não é varredura do DOM de propósito: no prerender não há DOM, e uma
 * navegação que só aparecesse depois da hidratação seria salto de layout em
 * toda página — ainda por cima numa faixa grudada no topo, onde o salto
 * empurra o conteúdo inteiro para baixo.
 */
@Component({
  selector: 'ucam-nesta-pagina',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visivel()) {
      <nav class="nesta-pagina" aria-labelledby="nesta-pagina-titulo">
        <p class="eyebrow" id="nesta-pagina-titulo">Nesta página</p>
        <ol>
          @for (s of secoes(); track s.id) {
            <li [class.sub]="s.sub" [class.grupo]="s.grupo">
              <!-- routerLink vazio + fragment, e NÃO href="#id".
                   O documento declara <base href="/">, e um href de fragmento
                   resolve contra a BASE, não contra a URL atual: em
                   /fundamentos/marca o navegador ia para /#marcas — a home,
                   com a página inteira destruída. Era assim desde que o
                   primeiro índice foi escrito; passou despercebido porque a
                   verificação de então conferia se getElementById achava o
                   alvo, e nunca CLICOU no link. O anchorScrolling do
                   app.config só age em navegação do router, que é
                   exatamente o que este link agora faz. -->
              <a
                [routerLink]="[]"
                [fragment]="s.id"
                [class.ativo]="ativo() === s.id"
                [attr.aria-current]="ativo() === s.id ? 'true' : null"
                >{{ s.rotulo }}</a
              >
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: `
    /* --------------------------------------------------------------- comum */
    .nesta-pagina ol {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nesta-pagina a {
      display: block;
      font-size: 0.8125rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
      text-decoration: none;
      white-space: nowrap;
      transition: color 120ms ease, border-color 120ms ease;
    }
    .nesta-pagina a:hover {
      color: var(--ucam-color-text-primary);
    }
    /* O item atual é cor E filete, nunca só cor — a mesma regra que já vale
       para os selos de estado do site (WCAG 1.4.1). O filete de 2px na tinta
       da marca é o que a Ant Design usa no Anchor dela; a espessura foi
       medida, não escolhida.

       A TINTA mudou: era text-link (azul) enquanto o filete ao lado dela é da
       marca (bordô) — a mesma pista dizia duas cores diferentes no mesmo
       item. Agora as duas partes do indicador falam a mesma língua. */
    .nesta-pagina a.ativo {
      color: var(--ucam-color-action-primary-default);
      font-weight: 560;
    }

    /* ----------------------------------------------- abas — abaixo de 82rem */
    .nesta-pagina {
      position: sticky;
      inset-block-start: var(--header-h);
      z-index: 30;
      /* 2rem, e não --ritmo-secao. O ritmo de 4,5rem separa SEÇÕES de
         conteúdo; esta faixa é navegação, e no celular os 72px empurravam o
         primeiro título da página um décimo de tela para baixo — em 844px de
         altura é espaço que não sobra. */
      margin-block: 0 2rem;
      /* Vidro, igual às duas faixas do cabeçalho logo acima — é a terceira
         camada da mesma pilha grudada, e uma opaca no meio de duas
         translúcidas aparece como degrau. */
      background: var(--vidro);
      backdrop-filter: blur(12px) saturate(150%);
      -webkit-backdrop-filter: blur(12px) saturate(150%);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    @supports not (backdrop-filter: blur(1px)) {
      .nesta-pagina {
        background: var(--ucam-color-surface-default);
      }
    }
    /* O rótulo "Nesta página" é redundante numa faixa horizontal: a forma já
       diz o que ela é. Some para quem vê e fica para quem ouve, que é quem
       precisa dele para saber em que navegação entrou. */
    .nesta-pagina .eyebrow {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .nesta-pagina ol {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      /* Aqui a barra SOME, e é a única exceção à regra de que contêiner que
         rola por dentro desenha a própria barra.
         A regra existe para contêiner de CONTEÚDO, onde nada mais avisa que há
         mais adiante. Numa faixa de abas de 40px de altura, a barra ocupa um
         quinto dela e corre encostada no filete de 2px que marca a aba atual —
         dois traços horizontais quase colados, e só um deles quer dizer algo.
         A afordância aqui é a aba cortada na borda, que é como Carbon e
         Atlassian resolvem a mesma faixa.
         O esmaecimento vem de mask-image no PRÓPRIO elemento, nunca de um
         pseudo-elemento por cima: sobreposto, ele roubaria o toque da primeira
         e da última aba. */
      scrollbar-width: none;
      mask-image: linear-gradient(
        to right,
        transparent 0,
        #000 0.75rem,
        #000 calc(100% - 0.75rem),
        transparent 100%
      );
    }
    .nesta-pagina ol::-webkit-scrollbar {
      display: none;
    }
    /* Segundo nível não entra na faixa: quinze abas já é o limite do que se
       varre de olho, e as subseções de variante somariam quarenta. */
    .nesta-pagina li.sub {
      display: none;
    }
    .nesta-pagina a {
      padding: 0.6rem 0.7rem;
      border-block-end: 2px solid transparent;
    }
    /* Na FAIXA o cabeçalho de área some. Ela é rolável e curta; repetir
       "Ver", "Decidir", "Construir" entre os destinos dobraria o número de
       paradas sem levar a lugar nenhum de novo. Na coluna ele fica, porque
       ali a lista é vertical e o agrupamento se lê de relance. */
    .nesta-pagina li.grupo {
      display: none;
    }
    .nesta-pagina a.ativo {
      border-block-end-color: var(--ucam-color-action-primary-default);
    }

    /* ----------------------------------------- coluna — a partir de 82rem */
    @media (min-width: 82rem) {
      .nesta-pagina {
        inset-block-start: calc(var(--header-h) + 2rem);
        max-block-size: calc(100dvh - var(--header-h) - 4rem);
        overflow-y: auto;
        margin-block: 0;
        background: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-block-end: 0;
        z-index: auto;
      }
      .nesta-pagina .eyebrow {
        position: static;
        inline-size: auto;
        block-size: auto;
        margin: 0;
        clip-path: none;
        overflow: visible;
      }
      .nesta-pagina ol {
        display: block;
        overflow: visible;
        margin-block-start: 0.5rem;
        border-inline-start: 1px solid var(--ucam-color-border-subtle);
      }
      .nesta-pagina li.sub {
        display: list-item;
      }
      /* Na coluna o cabeçalho de área VOLTA, e continua sendo link: ele é o
         destino do divisor lá na página, e clicar nele é o jeito de pular uma
         área inteira. O que muda é a forma — caixa alta miúda e um respiro
         acima —, para que a lista leia como quatro grupos e não como vinte
         irmãos. */
      .nesta-pagina li.grupo {
        display: list-item;
      }
      .nesta-pagina li.grupo + li a {
        padding-block-start: 0.35rem;
      }
      .nesta-pagina li.grupo a {
        margin-block-start: 0.9rem;
        font-size: 0.6875rem;
        font-weight: 650;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ucam-color-text-secondary);
      }
      /* O primeiro grupo encosta no topo da lista: o respiro separa grupos, e
         acima dele há o rótulo "Nesta página", não um grupo. */
      .nesta-pagina li.grupo:first-child a {
        margin-block-start: 0;
      }
      .nesta-pagina li.grupo a.ativo {
        color: var(--ucam-color-action-primary-default);
      }
      .nesta-pagina li.sub a {
        padding-inline-start: 1.5rem;
        font-size: 0.75rem;
      }
      .nesta-pagina a {
        padding: 0.3rem 0 0.3rem 0.85rem;
        margin-inline-start: -1px;
        border-block-end: 0;
        border-inline-start: 2px solid transparent;
        /* Na coluna o rótulo longo ("Aparência por variant") quebra; na faixa
           horizontal, não — por isso o nowrap não é comum às duas. */
        white-space: normal;
      }
      .nesta-pagina a.ativo {
        border-block-end-color: transparent;
        border-inline-start-color: var(--ucam-color-action-primary-default);
      }
    }
  `,
})
export class NestaPaginaComponent {
  private readonly destroy = inject(DestroyRef);

  readonly secoes = input<readonly Ancora[]>([]);

  /**
   * Piso de três seções. Uma navegação de duas âncoras não poupa rolagem
   * nenhuma e cobra uma faixa inteira de altura por isso — as páginas de
   * índice (/catalogo, /decisoes, /padroes) têm um h2 só e seguem limpas.
   */
  protected readonly visivel = computed(() => this.secoes().filter((s) => !s.sub).length >= 3);

  protected readonly ativo = signal('');

  constructor() {
    // Só no navegador: no prerender não há IntersectionObserver nem seções
    // montadas. A lista de links já sai pronta do servidor; o que o navegador
    // acrescenta é apenas QUAL deles está aceso.
    noNavegador(() => {
      const alvos = this.secoes()
        .map((s) => document.getElementById(s.id))
        .filter((e): e is HTMLElement => !!e);
      if (!alvos.length) return;

      // A seção acesa é a ÚLTIMA cujo topo já passou da linha de leitura —
      // logo abaixo do cabeçalho e da faixa de abas.
      //
      // Não é IntersectionObserver de propósito. A versão com observer usava
      // uma fita fina no topo da tela e tinha ZONA MORTA no fim da página:
      // depois que a rolagem chega ao máximo, nenhuma seção nova cruza a
      // fita, e as últimas nunca acendem. Medido: rolando até "De onde veio",
      // acendia "Conteúdo" — quatro seções atrás. Comparar posições não tem
      // esse buraco, e com quinze seções o custo é irrelevante.
      const LINHA = 112;

      let agendado = false;
      const marca = () => {
        agendado = false;
        let atual = alvos[0];
        for (const a of alvos) {
          if (a.getBoundingClientRect().top > LINHA) break;
          atual = a;
        }
        // No fim da rolagem o último item ganha: as seções curtas do rodapé
        // cabem todas na última tela e nenhuma delas alcança a linha.
        const fim = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
        this.ativo.set((fim ? alvos.at(-1)! : atual).id);
      };
      const aoRolar = () => {
        if (agendado) return;
        agendado = true;
        requestAnimationFrame(marca);
      };

      marca();
      addEventListener('scroll', aoRolar, { passive: true });
      addEventListener('resize', aoRolar, { passive: true });
      this.destroy.onDestroy(() => {
        removeEventListener('scroll', aoRolar);
        removeEventListener('resize', aoRolar);
      });
    });
  }
}
