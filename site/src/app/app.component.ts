import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { filter, map } from 'rxjs';

import {
  componentes,
  padroes,
  adrs,
  meta,
  layouts,
  telas,
  releases,
  componentesPorCategoria,
} from './spec/spec';
import { SPRITE } from '../generated/sprite';
import { ligarListbox, ligarMenuConta, ligarEstado, ligarDescricao, ligarLinhaDoTempo, ligarAbas } from '../generated/listbox';
import { SearchComponent } from './shell/search.component';
import { noNavegador } from './docs/no-navegador';
import { ThemeToggleComponent } from './shell/theme-toggle.component';
import { SimboloComponent } from './shell/simbolo.component';

interface ItemNav {
  rotulo: string;
  link: string;
  /** Só a rota exata marca como atual — evita "Visão geral" ativa em toda filha. */
  exato?: boolean;
  /** Âncora dentro da página. Vários itens podem dividir o mesmo `link`. */
  fragmento?: string;
  /** Estado do contrato. Vira selo ao lado do item — mas só quando distingue. */
  estado?: string;
  /** Texto extra que o filtro considera além do rótulo. */
  busca?: string;
  /**
   * Rótulo da categoria a que o item pertence, para a lateral agrupar.
   *
   * Não vira item da lista: o cabeçalho é desenhado no template quando o
   * grupo MUDA entre um item e o anterior. Assim o filtro continua operando
   * só sobre itens, e um grupo cujos itens todos sumiram some junto — sem
   * nenhuma lógica a mais para isso.
   */
  grupo?: string;
  /** Como o routerLinkActive decide se este item é o atual. Preenchido em
   *  secoesVisiveis(), porque a resposta depende dos IRMÃOS — ver ali.
   *
   *  A união é a do próprio input do RouterLinkActive: o "{ exact }" é um
   *  ATALHO, não um IsActiveMatchOptions parcial — o compilador cobra as
   *  quatro chaves de quem promete a interface cheia. */
  opcoes?: IsActiveMatchOptions | { exact: boolean };
}

/** Uma aba do segundo andar. `secoes` diz quais grupos da lateral são dela. */
interface Aba {
  rotulo: string;
  link: string;
  /** Só a rota exata ativa a aba. Usado onde uma aba é prefixo de outra. */
  exato?: boolean;
  secoes: string[];
}

/** Uma área do primeiro andar. A primeira aba é o destino do clique nela. */
interface Area {
  id: string;
  rotulo: string;
  /** Símbolo do sprite (`i-*`) que acompanha o rótulo no primeiro andar. */
  icone: string;
  abas: Aba[];
}

interface Secao {
  /** Chave estável, para as abas referenciarem o grupo sem depender do rótulo
   *  — que carrega contagem ("Catálogo · 19") e muda a cada build. */
  id: string;
  titulo: string;
  /** Índice da aba que serve este grupo. O título do grupo linka para lá, que
   *  é o que substituiu o segundo andar de abas do cabeçalho. Derivado de
   *  `areas` em abaDaSecao — nunca escrito à mão nos dados. */
  link?: string;
  /** Se os itens aparecem. Só o grupo da aba aberta expande; os irmãos ficam
   *  no título. Com filtro digitado, todos expandem. */
  aberta?: boolean;
  /** O estado do grupo dito uma vez no rótulo: "todos draft", "26 draft" ou
   *  "26 draft · 23 review". Preenchido em tempo de render por comEstadoComum. */
  estadoResumo?: string;
  itens: ItemNav[];
}

/** Sem acento e em caixa baixa: "acessibilidade" tem de achar "Acessibilidade". */
const normaliza = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    // Faixa U+0300–U+036F, os diacríticos combinantes que o NFD separou. São
    // caracteres invisíveis no fonte: não edite esta linha à mão.
    .replace(/[̀-ͯ]/g, '')
    .trim();

@Component({
  selector: 'ucam-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SearchComponent,
    ThemeToggleComponent,
    SimboloComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Sprite de ícones, gerado de dist/icons/sprite.svg. Precisa estar no
         documento porque <use href="#i-*"> só resolve contra um <symbol>
         presente no DOM: sem isto, todo ícone dos previews da spec renderiza
         como caixa vazia. Fica no shell para valer em qualquer rota. -->
    <div class="sprite" [innerHTML]="sprite"></div>

    <!-- routerLink + fragment, não href="#conteudo": com <base href="/">, um
         href de fragmento resolve contra a BASE. O skip-link levava para a
         HOME em toda página que não fosse a home — o contrário de pular para
         o conteúdo. Verificado antes só por foco ("é o primeiro focável"),
         nunca por clique. O (click) devolve o foco ao <main tabindex="-1">,
         que é o que a navegação do router não faz sozinha. -->
    <a
      class="skip-link"
      [routerLink]="[]"
      fragment="conteudo"
      (click)="focaConteudo()"
      >Pular para o conteúdo</a
    >

    <header class="topo" [class.rolado]="rolado()" [class.sem-subtopo]="naHome()">
      <button
        type="button"
        class="menu"
        (click)="navAberta.set(!navAberta())"
        [attr.aria-expanded]="navAberta()"
        aria-controls="nav-lateral"
        aria-label="Navegação"
      >
        <!-- Traços desenhados, não o caractere ☰: o glifo cai numa fonte de
             fallback (o Geist não o tem), muda de peso e de altura por sistema
             operacional, e não fica na régua de 2px dos outros ícones. -->
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <!-- A assinatura: símbolo do UCAMDS, o nome, e a logo da universidade
           como endosso depois do filete.

           Três objetos, e uma hierarquia que agora existe no CSS e não só
           neste comentário: o símbolo é a ÚNICA coisa na tinta da marca, o
           nome é o único texto no primário, e a logo da universidade vem
           depois do filete, no cinza SECUNDÁRIO — posição de quem assina, não
           de quem é assinado. Até 07/09/2026 o comentário aqui prometia
           exatamente isso e o CSS pintava a logo com
           --ucam-color-action-primary-default: eram DUAS marcas em bordô, lado
           a lado, disputando o papel que o texto dizia estar resolvido.

           "Design System" saiu do lockup. A segunda linha qualificava a sigla
           para quem chega, mas é o site inteiro que é o design system — o
           qualificador estava no lugar onde a marca precisa ser curta, e
           empurrava a assinatura para quatro objetos.

           A logo vai a 120 px porque é o mínimo que /fundamentos/marca declara
           para o lockup horizontal. Estava em 7rem = 112 px, abaixo do próprio
           mínimo documentado, com o comentário afirmando que já tinha subido. -->
      <a routerLink="/" class="marca">
        <ucam-simbolo class="marca-simbolo" />
        <!-- aria-hidden no nome VISÍVEL, não só no filete e na logo. O link
             tem um nome acessível só, montado no .sr-only abaixo; sem o
             aria-hidden aqui o leitor de tela anunciava o nome duas vezes —
             "UCAMDS Design System UCAMDS — Design System da Universidade
             Candido Mendes" —, que é o que este comentário já afirmava estar
             resolvido enquanto o <strong> seguia exposto. -->
        <strong class="marca-nome" aria-hidden="true">UCAMDS</strong>
        <span class="marca-divisor" aria-hidden="true"></span>
        <span class="marca-ucam" aria-hidden="true"></span>
        <span class="sr-only">UCAMDS — Design System da Universidade Candido Mendes</span>
      </a>

      <!-- Primeiro andar: as três ÁREAS. Seis abas aqui era o que havia antes,
           e seis é mais do que uma faixa consegue hierarquizar — "Layout" e
           "Telas" pesavam o mesmo que "Catálogo", quando são partes dele. -->
      <nav class="abas" aria-label="Áreas">
        @for (a of areas; track a.id) {
          <a
            [routerLink]="a.abas[0].link"
            [class.ativo]="!naHome() && a.id === areaAtual().id"
            [attr.aria-current]="!naHome() && a.id === areaAtual().id ? 'true' : null"
          >
            <!-- O ícone é DECORATIVO e por isso aria-hidden: o rótulo ao lado
                 já é o nome acessível, e um <use> anunciado duplicaria a área
                 em todo leitor de tela. Ele existe para dar à faixa o peso que
                 três palavras soltas não davam — sem ele a nav centralizada
                 lia como uma frase perdida no meio do cabeçalho. -->
            <svg class="aba-icone" aria-hidden="true">
              <use [attr.href]="'#' + a.icone" />
            </svg>
            {{ a.rotulo }}
          </a>
        }
      </nav>

      <div class="acoes">
        <!-- Versão e estado dos CONTRATOS, não do site. É o fato que muda a
             leitura de todo o resto — "draft" quer dizer que nenhuma página
             daqui é promessa — e um site de design system que não o mostra
             obriga a procurar. Sai da spec, como tudo. -->
        <a class="versao" routerLink="/releases" title="Versão e estado dos contratos">
          <span class="versao-num">{{ versao }}</span>
          <span class="versao-estado" [class]="'versao-' + estado">{{ estado }}</span>
        </a>
        <ucam-search />
        <span class="acoes-divisor" aria-hidden="true"></span>
        <ucam-theme-toggle />
      </div>
    </header>

    <!-- O SEGUNDO ANDAR: as ABAS da área aberta.
         Saiu em 09/09/2026 e voltou no mesmo dia, e o motivo da volta não
         desfaz o da saída — corrige o que a saída presumiu.

         A saída apostou que os TÍTULOS DE GRUPO da lateral serviriam de
         sub-navegação. Eles servem para ENTRAR, e é uma porta real. O que eles
         não fazem é MOSTRAR: um título recolhido é uma linha de texto no meio
         de uma lista de links, e "Telas", "Layout" e "Padrões" deixaram de ter
         qualquer lugar na tela onde se leiam como as quatro partes do
         Catálogo. Quem não sabia que existiam continuou sem saber.

         É a diferença entre alcance e presença. A lateral resolveu o alcance —
         nenhuma rota ficou órfã, e por isso a mudança passou. A faixa é o que
         dá presença, e é a única superfície do site onde as abas irmãs
         aparecem LADO A LADO, do mesmo tamanho, ao mesmo tempo.

         A lateral fica como está: continua mostrando a área inteira com as
         irmãs recolhidas. Não é redundância a desfazer — a faixa diz o que
         existe, a lateral diz o que tem dentro. Voltar a recortá-la na aba
         seria reatar a dependência que tornava a faixa insubstituível, e é
         justamente essa dependência que não deve existir. -->
    <!-- O [class.rolado] voltou: a sombra de rolagem mora na ÚLTIMA faixa do
         cabeçalho, e acima de 60rem a última é esta. Sem a classe aqui, a
         regra .subtopo.rolado nunca casaria e a sombra ficaria no primeiro
         andar, pintando sobre o topo desta faixa. Ver o CSS. -->
    <!-- A HOME NÃO TEM SEGUNDO ANDAR (11/09/2026). Ela não é página de área
         nenhuma: é a porta das três. Até aqui ela caía em Docs por omissão —
         a faixa mostrava "Começar · Fundamentos" sem nenhuma das duas acesa, e
         a lateral abria os oito grupos de uma vez, com os 46 componentes, sob
         uma área que se chama Docs. A regra das áreas é que cada página mostre
         só o que é dela; a home, que é de todas, não mostra o sumário de
         nenhuma. -->
    @if (!naHome()) {
      <nav
        class="subtopo"
        [class.rolado]="rolado()"
        aria-label="Seções de {{ areaAtual().rotulo }}"
      >
        @for (t of areaAtual().abas; track t.link) {
          <a
            [routerLink]="t.link"
            [class.ativo]="t === abaAtual()"
            [attr.aria-current]="t === abaAtual() ? 'page' : null"
          >
            {{ t.rotulo }}
          </a>
        }
      </nav>
    }

    <div class="layout" [class.sem-lateral]="naHome()">
      <nav
        id="nav-lateral"
        class="nav"
        [class.aberta]="navAberta()"
        aria-label="Navegação da documentação"
        (click)="navAberta.set(false)"
      >
        <!-- AS TRÊS ÁREAS, dentro da gaveta e só abaixo de 60rem.
             É o primeiro andar do cabeçalho, que some nessa largura. Sem isto
             a gaveta oferecia apenas as seções da área ATUAL, e trocar de área
             deixava de ter caminho: medido por CDP em 08/09/2026, a 900px e a
             600px nenhum link para outra área sobrevivia no cabeçalho — nem
             com o hambúrguer aberto. O que restava era o rodapé e os links que
             o texto da página por acaso tivesse, que não são navegação.
             Duplicar aqui é o preço de esconder ali; a alternativa seria
             espremer três áreas mais quatro abas numa faixa de 900px. -->
        <div class="nav-areas" (click)="$event.stopPropagation()">
          <span class="eyebrow">Áreas</span>
          @for (a of areas; track a.id) {
            <a
              [routerLink]="a.abas[0].link"
              [class.atual]="!naHome() && a.id === areaAtual().id"
              [attr.aria-current]="!naHome() && a.id === areaAtual().id ? 'true' : null"
              (click)="navAberta.set(false)"
            >
              <svg class="aba-icone" aria-hidden="true">
                <use [attr.href]="'#' + a.icone" />
              </svg>
              {{ a.rotulo }}
            </a>
          }
        </div>

        <!-- Filtro da lateral. A navegação tem 19 componentes, 4 padrões e 10
             ADRs: rolar até achar é pior que digitar três letras. Não substitui
             a busca do header (⌘K), que varre o CONTEÚDO — este só peneira os
             títulos que já estão à vista. O clique é impedido de subir para o
             (click) do <nav>, que fecha a gaveta no mobile. -->
        <div class="filtro" (click)="$event.stopPropagation()">
          <input
            type="search"
            [value]="filtro()"
            (input)="filtro.set($any($event.target).value)"
            placeholder="Filtrar"
            aria-label="Filtrar a navegação"
            autocomplete="off"
          />
        </div>

        @for (s of secoesVisiveis(); track s.titulo) {
          <div class="grupo" [class.recolhido]="!s.aberta">
            <!-- O título do grupo é LINK para o índice da aba, não mais rótulo
                 morto: é ele que substituiu o segundo andar de abas.

                 Em "Catálogo" isso não é conveniência, é a única porta para
                 /catalogo — aquele grupo é gerado dos contratos e não tem item
                 "Visão geral" como Começar e Fundamentos têm.

                 SEM aria-expanded, de propósito. O grupo recolhido não é uma
                 gaveta que abre no lugar: o título NAVEGA, e os itens aparecem
                 porque a rota mudou. Anunciar "recolhido/expandido" prometeria
                 a um leitor de tela um controle de revelação que não existe. -->
            @if (s.link) {
              <a class="grupo-titulo eyebrow" [routerLink]="s.link">
                {{ s.titulo }}
                @if (s.estadoResumo) {
                  <span class="eyebrow-estado">{{ s.estadoResumo }}</span>
                }
              </a>
            } @else {
              <span class="eyebrow">
                {{ s.titulo }}
                @if (s.estadoResumo) {
                  <span class="eyebrow-estado">{{ s.estadoResumo }}</span>
                }
              </span>
            }
            @if (s.aberta) {
              @for (i of s.itens; track i.link + '#' + (i.fragmento ?? ''); let idx = $index) {
              <!-- O cabeçalho do grupo nasce da MUDANÇA, não de um item na
                   lista: aparece quando este item pertence a um grupo
                   diferente do anterior. Com filtro digitado, um grupo que
                   perdeu todos os itens some sozinho, porque não sobrou item
                   dele para disparar o cabeçalho. -->
              @if (i.grupo && i.grupo !== s.itens[idx - 1]?.grupo) {
                <p class="grupo-categoria">{{ i.grupo }}</p>
              }
              <a
                [routerLink]="i.link"
                [fragment]="i.fragmento"
                routerLinkActive="atual"
                [routerLinkActiveOptions]="i.opcoes!"
              >
                {{ i.rotulo }}
                @if (i.estado) {
                  <span class="selo-estado" [class]="'selo-' + i.estado">{{ i.estado }}</span>
                }
              </a>
              }
            }
          </div>
        } @empty {
          <!-- Só com filtro digitado. Na home, sem filtro, a lista é vazia de
               propósito (a gaveta mostra só as áreas), e "Nada com “”" ali
               seria um erro inventado. -->
          @if (filtro()) {
            <p class="filtro-vazio small muted">
              Nada com “{{ filtro() }}”. A busca do header (⌘K) procura dentro das páginas.
            </p>
          }
        }
      </nav>

      <main id="conteudo" class="conteudo" tabindex="-1">
        <router-outlet />
      </main>
    </div>

    <!-- Rodapé do SITE, e não da página. Até aqui o colofão morava dentro do
         <main>, na coluna de texto: era conteúdo da página para o HTML e para
         o leitor de tela, quando o que ele diz — de onde o site vem, o que a
         distribuição tem hoje — vale igual nas trinta rotas. Dentro do <main>
         ele também herdava a --measure e parava a 68ch no meio da tela, com a
         lateral seguindo vazia ao lado; e cada página terminava com um filete
         curto que não fechava layout nenhum.

         Aqui fora ele é faixa de largura total com o CONTEÚDO na régua da
         aplicação (--recuo-app), que é o mesmo arranjo do cabeçalho: as duas
         pontas do site passam a fechar na mesma coluna. -->
    <footer class="rodape">
      <!-- Quatro colunas, uma por ÁREA do sistema, e não uma fila de quatro
           atalhos. A fila anterior escolhia quatro destinos entre trinta e não
           dizia por que aqueles: era um resumo do cabeçalho, feito menor.

           Em colunas o rodapé passa a fazer o que só ele pode fazer — mostrar
           a ÁRVORE INTEIRA de uma vez. A lateral mostra a área atual, o
           cabeçalho mostra as três áreas sem o conteúdo delas; aqui, no fim da
           página, cabe o mapa completo, que é o momento em que ele é útil:
           quem chegou ao fim ou achou o que queria, ou precisa de outro galho.

           Cada <nav> tem NOME PRÓPRIO via aria-labelledby apontando para o
           título visível da coluna. Quatro <nav> anônimos seriam quatro
           "navegação" idênticas na lista de marcos de um leitor de tela. -->
      <div class="rodape-colunas">
        <nav class="rodape-col" aria-labelledby="rod-comecar">
          <h2 class="rodape-titulo" id="rod-comecar">Começar</h2>
          <a routerLink="/comecar/instalacao">Instalação</a>
          <a routerLink="/comecar/migrar">Migrar uma tela</a>
          <a routerLink="/comecar/mcp">Conectar MCP</a>
          <a routerLink="/comecar/skills">Skills e pacotes</a>
        </nav>
        <nav class="rodape-col" aria-labelledby="rod-catalogo">
          <h2 class="rodape-titulo" id="rod-catalogo">Catálogo</h2>
          <a routerLink="/catalogo">Componentes</a>
          <a routerLink="/layout">Layout</a>
          <a routerLink="/telas">Telas</a>
          <a routerLink="/padroes">Padrões</a>
        </nav>
        <nav class="rodape-col" aria-labelledby="rod-fundamentos">
          <h2 class="rodape-titulo" id="rod-fundamentos">Fundamentos</h2>
          <a routerLink="/fundamentos/cor">Cor</a>
          <a routerLink="/fundamentos/tipografia">Tipografia</a>
          <a routerLink="/fundamentos/escrita">Escrita</a>
          <a routerLink="/fundamentos/densidade">Densidade e grade</a>
          <a routerLink="/fundamentos/marca">Marca</a>
          <a routerLink="/fundamentos/acessibilidade">Acessibilidade</a>
        </nav>
        <nav class="rodape-col" aria-labelledby="rod-projeto">
          <h2 class="rodape-titulo" id="rod-projeto">Projeto</h2>
          <a routerLink="/decisoes">Decisões</a>
          <a routerLink="/releases">Notas de lançamento</a>
        </nav>
      </div>

      <div class="rodape-fila">
        <p class="rodape-assinatura">
          Universidade Candido Mendes © {{ ano }} · UCAMDS {{ versao }}
        </p>
      </div>
    </footer>
  `,
  styles: `
    .sprite {
      display: none;
    }
    .topo {
      position: sticky;
      inset-block-start: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      block-size: var(--topo-h);
      /* Alinha o conteúdo do header à coluna do corpo. A faixa segue de
         largura total — é o filete de baixo que atravessa a tela — mas a
         marca e a busca caem na mesma vertical da lateral e do conteúdo. */
      padding-inline: var(--recuo-app);
      /* VIDRO, não superfície opaca. O cabeçalho fica por cima do conteúdo
         que rola: com fundo chapado ele lê como uma barra colada na tela; com
         o fundo translúcido e o desfoque, o texto passando por baixo aparece
         como uma sombra de movimento e a faixa lê como camada. Só funciona
         com o blur — sem ele o texto continua LEGÍVEL através da faixa, que é
         pior que qualquer um dos dois extremos.

         O vidro mora num ::before e NÃO no .topo. O motivo é uma armadilha do
         CSS que custou uma quebra: um elemento com backdrop-filter vira BLOCO
         DE CONTENÇÃO para descendentes position:fixed — a mesma regra do
         filter e do transform. A paleta de busca (⌘K) é descendente do
         cabeçalho, e o véu dela é fixed inset:0; com o filtro no .topo, o
         "inset: 0" passou a valer contra a caixa do CABEÇALHO: o véu
         escurecia os 56px da faixa e o resto da página seguia claro, com a
         paleta aberta por cima. Medido por CDP.

         No pseudo-elemento o desfoque acontece igual e o .topo volta a não
         conter nada — o véu recupera o viewport. O .topo continua criando
         contexto de empilhamento pelo z-index, que é o que mantém o véu
         pintando acima do conteúdo. */
      background: transparent;
      /* O filete de fechamento mora aqui só ENQUANTO o segundo andar não
         existe — abaixo de 60rem. A partir daí a régua do cabeçalho é a do
         .subtopo, e esta é zerada na media query do fim do bloco das abas.
         Um cabeçalho de vidro precisa de UMA régua, sempre, e nunca de duas:
         sem nenhuma ele flutua sobre o texto que rola; com as duas o
         primeiro andar lê como faixa separada do segundo. */
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .topo::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: var(--vidro);
      backdrop-filter: blur(12px) saturate(150%);
      -webkit-backdrop-filter: blur(12px) saturate(150%);
    }
    /* Navegador sem backdrop-filter (Firefox com a flag desligada, WebView
       antiga) volta ao fundo opaco: um cabeçalho 24% transparente sobre texto
       nítido seria ilegível, e é a única falha possível aqui. */
    @supports not (backdrop-filter: blur(1px)) {
      .topo::before {
        background: var(--ucam-color-surface-default);
      }
    }
    /* O filete do cabeçalho vira sombra QUANDO a página rola — e só então.
       Parado no topo, o cabeçalho não está por cima de nada e uma sombra ali é
       enfeite; rolado, ela é o que diz que existe conteúdo passando por baixo.

       A SOMBRA MORA NA ÚLTIMA FAIXA, e é por isso que há uma media query aqui.
       Ela ficou no .topo por algumas horas em 09/09/2026, enquanto o segundo
       andar não existia. Com a faixa de abas de volta, medido por CDP a
       1440px: .topo tem z-index 40 e sombra, .subtopo tem z-index 39 e
       box-shadow "none" logo abaixo — a sombra do primeiro andar pintava sobre
       o TOPO da barra de abas, no meio do cabeçalho, em vez de marcar a borda
       de baixo dele. A 900px, com a faixa oculta, estava correto. */
    .topo,
    .subtopo {
      transition: box-shadow var(--ucam-duration-normal) ease;
    }
    @media (max-width: 59.999rem) {
      .topo.rolado {
        box-shadow: var(--sombra-repouso);
        border-block-end-color: var(--ucam-color-border-default);
      }
    }
    @media (min-width: 60rem) {
      .subtopo.rolado {
        box-shadow: var(--sombra-repouso);
        border-block-end-color: var(--ucam-color-border-default);
      }
      /* Na home o segundo andar não existe, então a última faixa volta a ser o
         .topo — e o filete e a sombra voltam com ele. Mesma regra de sempre:
         a régua mora no andar mais baixo que existir. */
      .topo.sem-subtopo {
        border-block-end: 1px solid var(--ucam-color-border-subtle);
      }
      .topo.sem-subtopo.rolado {
        box-shadow: var(--sombra-repouso);
        border-block-end-color: var(--ucam-color-border-default);
      }
    }
    .menu {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-controle);
      background: transparent;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      transition:
        color var(--transicao),
        background var(--transicao),
        border-color var(--transicao);
    }
    .menu:hover {
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-subtle);
      border-color: var(--ucam-color-border-default);
    }
    .menu svg {
      inline-size: 1.125rem;
      block-size: 1.125rem;
    }
    @media (min-width: 60rem) {
      .menu {
        display: none;
      }
    }
    /* A marca é um lockup horizontal de uma linha só: logo da universidade,
       filete, qualificador. Os três alinham pelo CENTRO ÓPTICO, não pela linha
       de base — o brasão da logo não tem linha de base, e alinhar por baseline
       deixaria o texto flutuando acima dele. */
    .marca {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      text-decoration: none;
      padding-inline-end: 0.5rem;
      min-inline-size: 0;
    }
    /* O símbolo na TINTA DA MARCA. O comentário do template já dizia que ele
       era "a única coisa na cor da marca" e o CSS nunca disse isso a ninguém:
       o <svg> desenha em currentColor, e currentColor no cabeçalho é o preto
       do corpo de texto. A marca gráfica do design system saía em preto em
       todas as páginas. */
    .marca ucam-simbolo {
      color: var(--ucam-color-action-primary-default);
    }
    /* A logo da UCAM entra por mask-image, não inline: o SVG tem 91 KB de
       brasão gravado e não deveria pesar no bundle de toda página. O mask
       também devolve o currentColor que um <img> perderia.
       Aparece em TODA largura desde que virou a âncora do header — antes era a
       segunda marca e cedia lugar às abas acima de 75rem. */
    .marca-ucam {
      /* 120px — o mínimo que /fundamentos/marca declara para o horizontal. A
         altura sai da proporção do arquivo, 211,2666 / 38,6056 = 5,472:
         120 / 5,472 = 21,9px. Não arredonde para 1,25rem: o mask usa "contain"
         e a logo passaria a flutuar numa caixa mais alta que ela. */
      inline-size: 7.5rem;
      block-size: 1.37rem;
      flex: none;
      /* Cinza secundário, não a tinta da marca: quem assina não compete com
         quem é assinado. Ver o comentário do lockup no template. */
      background: var(--ucam-color-text-secondary);
      -webkit-mask: url('/marca/ucam-logo-horizontal.svg') no-repeat center / contain;
      mask: url('/marca/ucam-logo-horizontal.svg') no-repeat center / contain;
    }
    .marca-divisor {
      inline-size: 1px;
      /* Mais curto que a logo de propósito: filete da altura cheia lê como
         borda de caixa; recuado, lê como separador de assinatura. */
      block-size: 0.95rem;
      flex: none;
      background: var(--ucam-color-border-default);
    }
    /* O nome, em UMA linha. Era um empilhado de sigla + "Design System"; o
       qualificador saiu do lockup (ver o template) e com ele some a razão de
       haver duas linhas. Uma linha só também devolve altura: o texto passa a
       alinhar pelo centro óptico do símbolo, em vez de o bloco de duas linhas
       definir a altura do lockup inteiro.

       O corpo subiu de 0,8125rem para 0,9375rem. Sozinha, a sigla precisa
       carregar o peso que as duas linhas dividiam — no tamanho antigo ela lia
       como legenda ao lado de uma logo de 120px. */
    .marca-nome {
      font-size: 0.9375rem;
      font-weight: 620;
      letter-spacing: -0.01em;
      line-height: 1;
      color: var(--ucam-color-text-primary);
      white-space: nowrap;
    }
    /* Abaixo de 48rem cai o ENDOSSO, não o nome. Antes o primeiro a sair era
       "Design System"; sem ele, o que sobra de dispensável é a assinatura da
       universidade — 120px de logo não cabem numa faixa que já carrega menu,
       marca, busca e tema. O símbolo e a sigla nunca saem: são a identidade. */
    @media (max-width: 47.999rem) {
      .marca-divisor,
      .marca-ucam {
        display: none;
      }
    }
    /* O símbolo é a única coisa do cabeçalho na tinta da marca. No hover do
       lockup inteiro ele cresce 4% — o retorno mínimo que diz "isto é um
       link" sem mexer no fluxo de nada ao redor. */
    .marca-simbolo {
      display: inline-flex;
      transition: scale var(--transicao);
    }
    .marca:hover .marca-simbolo {
      scale: 1.04;
    }
    .abas {
      display: none;
      /* 1,25rem, não 0,25rem: sem a pastilha, o espaço entre as abas é o
         ÚNICO separador. Com o gap de antes as três áreas encostavam uma na
         outra e liam como uma frase. É o mesmo gap do segundo andar. */
      gap: 1.25rem;
      align-items: stretch;
      /* A faixa centraliza seus filhos; a nav precisa da altura CHEIA para o
         sublinhado da área ativa pousar no rodapé da faixa, encostado no
         filete do segundo andar. Sem isto o traço fica colado no texto, a
         meia altura, e lê como sublinhado de link. */
      align-self: stretch;
    }
    @media (min-width: 60rem) {
      .abas {
        display: flex;
        /* As três áreas passam a flutuar no VÃO entre a marca e as ações, em
           vez de encostadas na marca. É o arranjo da referência, e resolve uma
           leitura errada que o encosto produzia: coladas na assinatura, as
           áreas liam como parte do lockup — "UCAMDS Docs Catálogo Projeto" —
           em vez de como a navegação primária que são.

           As duas margens automáticas só distribuem o vão se NINGUÉM MAIS na
           faixa tiver margem automática: por isso o .acoes devolve a dele logo
           abaixo. Com as duas ativas o espaço se dividia em três e as ações
           paravam no meio do caminho da borda direita. */
        margin-inline: auto;
      }
      /* Abaixo de 60rem as abas somem e é esta margem que segura as ações na
         direita; daqui para cima quem empurra é o margin-inline das abas. */
      .acoes {
        margin-inline-start: 0;
      }
    }
    /* 1rem, na régua de 2px dos outros ícones do cabeçalho. Fica um pouco
       menor que o corpo de 0,875rem do rótulo de propósito: o ícone acompanha
       a palavra, não compete com ela. */
    .aba-icone {
      inline-size: 1rem;
      block-size: 1rem;
      flex: none;
    }
    /* A área aberta marca por SUBLINHADO na tinta da marca. É mais honesto que
       a pastilha que havia aqui — a pastilha é a forma do item de navegação da
       LATERAL, e usá-la também no cabeçalho dava a dois níveis de navegação a
       mesma aparência.

       O sublinhado nasce no RODAPÉ da faixa, encostado no filete do .topo — é
       o que o align-self: stretch da .abas serve. Não é decoração: um traço a
       meia altura, colado no texto, lê como sublinhado de link. */
    .abas a {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding-inline: 0.15rem;
      text-decoration: none;
      font-size: 0.875rem;
      color: var(--ucam-color-text-secondary);
      transition: color var(--transicao);
      /* O traço da área ativa nasce de um ::after com scaleX, e não do
         box-shadow inset que havia aqui: assim ele CRESCE do centro quando a
         área muda, em vez de aparecer inteiro de um quadro para o outro. O
         box-shadow não anima nada disso. */
      position: relative;
    }
    .abas a::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 2px;
      border-radius: var(--ucam-radius-full) var(--ucam-radius-full) 0 0;
      background: var(--ucam-color-action-primary-default);
      scale: 0 1;
      transition: scale var(--ucam-duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
    }
    .abas a:hover {
      color: var(--ucam-color-text-primary);
    }
    .abas a.ativo {
      color: var(--ucam-color-action-primary-default);
      font-weight: 560;
    }
    .abas a.ativo::after {
      scale: 1 1;
    }

    /* O SEGUNDO ANDAR. Mesma faixa de vidro do .topo, meia altura, e o filete
       de fechamento do cabeçalho volta a morar aqui — é ele que diz onde a
       camada fixa termina.

       Gruda em --topo-h para descer junto com a faixa de cima e formar UM
       cabeçalho de dois andares, e não duas barras que se perseguem na
       rolagem. */
    .subtopo {
      display: none;
      position: sticky;
      inset-block-start: var(--topo-h);
      z-index: 39;
      align-items: stretch;
      gap: 1.25rem;
      block-size: var(--subtopo-h);
      padding-inline: var(--recuo-app);
      background: transparent;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    /* O vidro no ::before pelo mesmo motivo documentado no .topo: um elemento
       com backdrop-filter vira bloco de contenção para descendentes fixed. Aqui
       não há nenhum hoje, mas repetir a armadilha um andar abaixo é como ela
       voltaria. */
    .subtopo::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: var(--vidro);
      backdrop-filter: blur(12px) saturate(150%);
      -webkit-backdrop-filter: blur(12px) saturate(150%);
    }
    @supports not (backdrop-filter: blur(1px)) {
      .subtopo::before {
        background: var(--ucam-color-surface-default);
      }
    }
    /* As abas alinham à ESQUERDA, na régua da marca e da lateral — e não
       centralizadas como as áreas do primeiro andar. A diferença é proposital:
       o primeiro andar é a navegação do site e flutua no vão; o segundo é o
       sumário da área aberta e pertence à coluna do conteúdo que ele indexa. */
    .subtopo a {
      display: inline-flex;
      align-items: center;
      padding-inline: 0.15rem;
      text-decoration: none;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      transition: color var(--transicao);
      position: relative;
    }
    /* O mesmo traço do primeiro andar, 2px na tinta da marca, crescendo do
       centro. Igual de propósito: são dois níveis do MESMO mecanismo, e dar a
       cada um uma forma diferente de dizer "está aqui" obrigaria a aprender
       duas. O que os separa é o corpo do texto e a posição, não a marcação. */
    .subtopo a::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 2px;
      border-radius: var(--ucam-radius-full) var(--ucam-radius-full) 0 0;
      background: var(--ucam-color-action-primary-default);
      scale: 0 1;
      transition: scale var(--ucam-duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
    }
    .subtopo a:hover {
      color: var(--ucam-color-text-primary);
    }
    .subtopo a.ativo {
      color: var(--ucam-color-action-primary-default);
      font-weight: 560;
    }
    .subtopo a.ativo::after {
      scale: 1 1;
    }
    /* Abaixo de 60rem o primeiro andar já some para a gaveta, e o segundo vai
       junto: quatro abas mais três áreas não cabem numa faixa de 900px, e foi
       essa conta que tirou as seis abas originais do cabeçalho. Na gaveta as
       abas irmãs continuam presentes como títulos de grupo da lateral.

       Enquanto a faixa não existe, o filete de fechamento fica no .topo —
       senão o cabeçalho fica sem régua nenhuma sobre o texto que rola. */
    @media (min-width: 60rem) {
      .subtopo {
        display: flex;
      }
      .topo {
        border-block-end: 0;
      }
    }


    .acoes {
      margin-inline-start: auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    /* Filete entre o par informativo (versão) e o par de ferramentas (busca,
       tema). Estava no template desde sempre e nunca teve CSS — era um <span>
       vazio de zero pixel entre a busca e o botão de tema. */
    .acoes-divisor {
      inline-size: 1px;
      block-size: 1.1rem;
      flex: none;
      background: var(--ucam-color-border-subtle);
    }
    /* O selo de versão também não tinha CSS: "0.1.0" e "draft" saíam colados,
       lendo "0.1.0draft". São dois fatos diferentes e agora têm duas formas
       diferentes — o número em mono, o estado em cápsula na cor do feedback
       que ele nomeia. */
    .versao {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.5rem 0.2rem 0.55rem;
      border-radius: var(--ucam-radius-full);
      border: 1px solid var(--ucam-color-border-subtle);
      text-decoration: none;
      transition:
        border-color var(--transicao),
        background var(--transicao);
    }
    .versao:hover {
      border-color: var(--ucam-color-border-default);
      background: var(--ucam-color-surface-subtle);
    }
    .versao-num {
      font-family: var(--f-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--ucam-color-text-secondary);
    }
    .versao-estado {
      padding: 0.05rem 0.4rem;
      border-radius: var(--ucam-radius-full);
      font-family: var(--f-mono);
      font-size: 0.625rem;
      line-height: 1.5;
      background: var(--ucam-color-feedback-warning-background);
      color: var(--ucam-color-feedback-warning-foreground);
    }
    .versao-stable {
      background: var(--ucam-color-feedback-success-background);
      color: var(--ucam-color-feedback-success-foreground);
    }
    .versao-deprecated {
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    /* Abaixo de 60rem o cabeçalho já disputa espaço entre menu, marca, busca e
       tema — a versão é o primeiro fato dispensável, e ela vive inteira em
       /releases. */
    @media (max-width: 59.999rem) {
      .versao,
      .acoes-divisor {
        display: none;
      }
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr;
      max-inline-size: var(--app-max);
      margin-inline: auto;
    }
    @media (min-width: 60rem) {
      .layout {
        grid-template-columns: var(--nav-w) minmax(0, 1fr);
      }
      /* Home: sem lateral no desktop. A coluna não fica vazia reservando
         lugar — some, e o conteúdo toma a largura. Abaixo de 60rem a gaveta
         segue funcionando, com as três áreas. */
      .layout.sem-lateral {
        grid-template-columns: minmax(0, 1fr);
      }
      .layout.sem-lateral .nav:not(.aberta) {
        display: none;
      }
    }

    .nav {
      display: none;
      position: sticky;
      inset-block-start: var(--header-h);
      align-self: start;
      max-block-size: calc(100vh - var(--header-h));
      overflow-y: auto;
      padding: 1.5rem calc(var(--gutter) - 0.5rem) 4rem;
      border-inline-end: 1px solid var(--ucam-color-border-subtle);
    }
    .nav.aberta {
      display: block;
      position: fixed;
      inset-block: var(--header-h) 0;
      inset-inline-start: 0;
      inline-size: min(var(--nav-w), 85vw);
      z-index: 45;
      background: var(--ucam-color-surface-default);
      box-shadow: var(--ucam-elevation-overlay);
    }
    @media (min-width: 60rem) {
      .nav {
        display: block;
      }
    }
    /* O campo cai na régua da lateral pelo mesmo desconto dos links. */
    .filtro {
      margin: 0 0.5rem 1.5rem;
    }
    .filtro input {
      inline-size: 100%;
      padding: 0.4rem 0.7rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-controle);
      background: var(--ucam-color-surface-subtle);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: 0.8125rem;
      transition:
        border-color var(--transicao),
        background var(--transicao);
    }
    .filtro input::placeholder {
      color: var(--ucam-color-text-placeholder);
    }
    .filtro input:hover {
      border-color: var(--ucam-color-border-default);
    }
    .filtro input:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
      border-color: var(--ucam-color-border-default);
      background: var(--ucam-color-surface-default);
    }
    .filtro-vazio {
      margin: 0 0.5rem;
    }

    /* As áreas dentro da gaveta. Existem SÓ abaixo de 60rem — acima disso o
       primeiro andar do cabeçalho as mostra, e repetir seria dizer a mesma
       coisa duas vezes na mesma tela. O filete embaixo separa o nível de
       navegação primário dos grupos da área atual: sem ele a gaveta vira uma
       lista só, e "Docs" pesa igual a "Componentes", que é justamente a
       hierarquia que os dois andares do cabeçalho existem para dizer. */
    .nav-areas {
      display: none;
    }
    @media (max-width: 59.999rem) {
      .nav-areas {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        margin-block-end: 1.25rem;
        padding-block-end: 1.25rem;
        border-block-end: 1px solid var(--ucam-color-border-subtle);
      }
    }
    .nav-areas > .eyebrow {
      margin-block-end: 0.4rem;
      padding-inline-start: 0.5rem;
    }
    .nav-areas a {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ucam-color-text-primary);
    }
    .nav-areas a.atual {
      color: var(--ucam-color-action-primary-default);
      background: var(--ucam-color-action-primary-subtle);
    }
    /* O ícone acompanha o texto, como no primeiro andar. currentColor para
       herdar o estado ativo sem uma segunda regra de cor. */
    .nav-areas .aba-icone {
      inline-size: 1rem;
      block-size: 1rem;
      color: currentColor;
    }

    .grupo {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      margin-block-end: 1.75rem;
    }
    .grupo > .eyebrow {
      margin-block-end: 0.4rem;
      /* O .nav desconta 0.5rem no padding lateral para o TEXTO do link cair na
         régua, não a caixa. O rótulo não é link e não tem esse padding — sem
         devolvê-lo aqui, ele era a única coisa da tela 8px fora do prumo. */
      padding-inline-start: 0.5rem;
    }

    /* O título do grupo virou LINK em 09/09/2026 — é ele que substituiu o
       segundo andar de abas.

       O seletor é ".grupo > .grupo-titulo" e não ".grupo-titulo" porque ele
       precisa VENCER o ".nav a" logo abaixo, que desenha o item de lista:
       pastilha de 13px, recuo de 0,55rem, cor secundária. Duas classes (0,2,0)
       contra uma classe e um tipo (0,1,1) — a diferença é essa, e é de
       propósito. Sem ela o título de grupo viraria mais um item da lista, que
       é exatamente a hierarquia que ele existe para não ter. */
    /* Cabeçalho de CATEGORIA dentro do grupo da lateral — um degrau abaixo
       do título do grupo ("Catálogo · 49"). Mesmo problema de especificidade
       resolvido acima: precisa vencer o ".nav a" que desenha o item de lista,
       senão as oito categorias viram mais oito itens navegáveis. Duas classes
       contra uma classe e um tipo. */
    .grupo > .grupo-categoria {
      margin: 1rem 0 0.25rem;
      padding-inline-start: calc(var(--gutter) - 0.55rem);
      font-size: 0.6875rem;
      font-weight: 650;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }
    /* O primeiro não leva respiro: acima dele está o título do grupo, não um
       irmão de que ele precise se separar. */
    .grupo > .grupo-categoria:first-of-type {
      margin-block-start: 0.35rem;
    }

    .grupo > .grupo-titulo {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 0.3rem;
      margin-block-end: 0.4rem;
      padding: 0.2rem 0.5rem;
      border-radius: var(--r-controle);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }
    .grupo > .grupo-titulo:hover {
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-subtle);
    }
    /* O grupo ABERTO é onde você está, e o título vem no primário contra o
       secundário dos irmãos. É a pista de "seção atual" que o segundo andar de
       abas dava com o sublinhado. */
    .grupo:not(.recolhido) > .grupo-titulo {
      color: var(--ucam-color-text-primary);
    }
    /* Grupo recolhido não tem itens embaixo: os 1,75rem de respiro do .grupo
       fariam três títulos seguidos lerem como três blocos vazios em vez de uma
       lista. */
    .grupo.recolhido {
      margin-block-end: 0.15rem;
    }
    .grupo.recolhido > .grupo-titulo {
      margin-block-end: 0;
    }
    .nav a {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.55rem;
      border-radius: var(--r-controle);
      text-decoration: none;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      transition:
        color var(--transicao),
        background var(--transicao);
    }
    .nav a:hover {
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-subtle);
    }
    /* O item atual passou a ser TINGIDO DE MARCA, não cinza. O cinza era o
       mesmo do hover: quem passava o mouse por cima da lista via dois itens
       idênticos e não sabia qual era a página aberta. Cor, peso E a barra do
       ::before — três pistas, porque uma delas é cor sozinha e a WCAG 1.4.1
       não aceita cor sozinha. */
    .nav a.atual {
      color: var(--ucam-color-action-primary-default);
      background: var(--realce-marca);
      font-weight: 560;
    }
    .nav a.atual::before {
      content: '';
      position: absolute;
      inset-block: 0.3rem;
      inset-inline-start: 0;
      inline-size: 2px;
      border-radius: var(--ucam-radius-full);
      background: var(--ucam-color-action-primary-default);
    }
    /* Selo de estado: PALAVRA, não ponto. Um ponto precisa de legenda; a
       palavra se explica sozinha e o leitor de tela a lê. Só aparece quando o
       item destoa dos irmãos — ver comEstadoComum(). */
    .selo-estado {
      margin-inline-start: auto;
      padding: 0.05rem 0.4rem;
      border-radius: var(--ucam-radius-full);
      font-family: var(--f-mono);
      font-size: 0.625rem;
      letter-spacing: 0.02em;
      line-height: 1.6;
      background: var(--ucam-color-feedback-warning-background);
      color: var(--ucam-color-feedback-warning-foreground);
    }
    .selo-stable {
      background: var(--ucam-color-feedback-success-background);
      color: var(--ucam-color-feedback-success-foreground);
    }
    .selo-deprecated {
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    /* O fato que valia para todos, dito uma vez no rótulo do grupo — na
       LINHA DE BAIXO. Ao lado do título, "26 draft · 23 review" não cabe nos
       15rem da coluna e partia "Catálogo · 49" ao meio. */
    .eyebrow-estado {
      flex-basis: 100%;
      font-weight: 400;
      opacity: 0.75;
      text-transform: none;
      letter-spacing: 0;
    }

    /* O respiro de baixo caiu de 5/7rem para 3/4rem porque ele não é mais a
       única coisa entre o último parágrafo e o fim da tela: o .rodape agora
       fecha a página com filete e faixa própria. Somados, os 7rem antigos e o
       padding do rodapé abriam um vão de mais de 10rem que lia como página
       carregando pela metade. */
    .conteudo {
      min-inline-size: 0;
      padding: 2rem var(--gutter) 3rem;
    }
    .conteudo:focus {
      outline: none;
    }
    @media (min-width: 60rem) {
      .conteudo {
        padding: 2.5rem var(--gutter) 4rem;
      }
    }

    /* ------------------------------------------------------ rodapé do site */
    /* Faixa de largura total, filete em cima, conteúdo na régua da aplicação —
       a mesma composição do cabeçalho, invertida. O filete é o que fecha a
       página: sem ele o conteúdo simplesmente parava e sobrava branco até o
       fim da tela. */
    .rodape {
      /* O respiro de cima subiu de 1,75 para 3rem: com quatro colunas a faixa
         deixou de ser uma linha e virou bloco, e um bloco encostado no filete
         lê como continuação do conteúdo, não como rodapé. */
      padding: 3rem var(--recuo-app) 2.25rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      color: var(--ucam-color-text-secondary);
      font-size: 0.8125rem;
      line-height: 1.6;
    }

    /* auto-fit com mínimo de 10rem: em telefone as quatro colunas viram uma ou
       duas sem media query, e a coluna nunca fica estreita a ponto de "Migrar
       uma tela" quebrar em três linhas. */
    .rodape-colunas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
      gap: 1.75rem 2rem;
      max-inline-size: 64rem;
    }
    .rodape-col {
      display: flex;
      flex-direction: column;
      /* start, não stretch: sem isto cada <a> ocupa a largura da coluna e a
         área clicável se estende por muito além da palavra — um link de
         "Cor" com 200px de alvo invisível. */
      align-items: start;
      gap: 0.5rem;
    }
    /* O título da coluna é RÓTULO, não degrau: mesma caixa alta e mesmo corpo
       do .eyebrow da lateral, para as três réguas de navegação do site — topo,
       lateral e rodapé — falarem a mesma língua. */
    .rodape-titulo {
      margin: 0 0 0.2rem;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucam-color-text-primary);
    }
    .rodape-col a {
      text-decoration: none;
      color: var(--ucam-color-text-secondary);
      transition: color var(--transicao);
    }
    .rodape-col a:hover {
      color: var(--ucam-color-text-primary);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    /* A barra de baixo: assinatura à esquerda, procedência à direita,
       empilhando quando a linha não cabe. O filete acima dela separa o MAPA
       (as colunas) do que é nota de rodapé de verdade. */
    .rodape-fila {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem 2rem;
      margin-block-start: 2.25rem;
      padding-block-start: 1.5rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    .rodape-assinatura {
      margin: 0;
    }
  `,
})
export class AppComponent {
  // O sprite vem de um módulo gerado no build, não de entrada de usuário — o
  // mesmo motivo que autoriza o bypass no DemoPainel. Sanitizar removeria os
  // <symbol> e o sprite inteiro deixaria de existir.
  protected readonly sprite = inject(DomSanitizer).bypassSecurityTrustHtml(SPRITE);

  /**
   * O router rola até a âncora, mas não move o FOCO — e um skip-link que rola
   * sem levar o foco não serve para quem navega por teclado, que é a única
   * pessoa que o usa.
   */
  protected focaConteudo(): void {
    document.getElementById('conteudo')?.focus();
  }

  constructor() {
    // O `scroll-padding-top` do html NÃO vale para a rolagem do router: o
    // ViewportScroller do Angular não usa scrollIntoView, ele calcula
    // `scrollBy(rect.top - offset)` com um offset próprio, que nasce [0, 0].
    // Sem isto, toda âncora parava com o título exatamente atrás do cabeçalho
    // fixo — medido: topo do h2 em 0px, com 56px de faixa por cima.
    //
    // É função e não par de números porque o desconto muda: abaixo de 82rem a
    // navegação de âncoras é uma faixa grudada e soma altura; acima, é coluna
    // à direita e não cobre nada.
    noNavegador(() => {
      this.scroller.setOffset(() => {
        // As faixas grudadas, MEDIDAS e não presumidas. O segundo andar existe
        // só a partir de 60rem; abaixo disso ele é display:none e o
        // getBoundingClientRect devolve 0, então esta soma serve nas duas
        // larguras sem repetir aqui o ponto de corte que o CSS já declara.
        //
        // NÃO volte a pôr número fixo de fallback, e NÃO remova um dos termos.
        // Em 09/09/2026 este cálculo foi reduzido a medir só o .topo, porque o
        // segundo andar tinha acabado de ser removido; a faixa voltou no mesmo
        // dia e o desconto ficou 40px curto em toda âncora de tela larga — o
        // título parando atrás das abas, que é o defeito que este offset
        // existe para evitar. Um elemento ausente já contribui 0; fallback
        // fixo mente quando o layout muda.
        const alto = (s: string) => document.querySelector(s)?.getBoundingClientRect().height ?? 0;
        const topo = alto('.topo') + alto('.subtopo');
        const nav = document.querySelector('.nesta-pagina')?.getBoundingClientRect();
        // Largura grande = faixa horizontal sobre o conteúdo. Estreita = coluna.
        const faixa = nav && nav.width > 400 ? nav.height : 0;
        return [0, topo + faixa + 24];
      });
    });

    // O Select do Trilho A abre um listbox nosso, não a lista do sistema
    // operacional (ADR-011). O comportamento é delegação no document e vale
    // para preview injetado depois — que é como as demos entram aqui.
    noNavegador(() => {
      ligarListbox();
      ligarMenuConta();
      ligarEstado();
      ligarDescricao();
      ligarLinhaDoTempo();
      ligarAbas();
    });

    // passive: a escuta só lê a posição e nunca chama preventDefault; sem a
    // marca o navegador precisa esperar o handler antes de pintar a rolagem.
    noNavegador(() => {
      const marcar = () => this.rolado.set(window.scrollY > 4);
      marcar();
      window.addEventListener('scroll', marcar, { passive: true });
    });
  }

  private readonly scroller = inject(ViewportScroller);

  /**
   * As três áreas do primeiro andar.
   *
   * Antes eram seis abas soltas — Começar, Fundamentos, Catálogo, Layout,
   * Telas, Decisões — e a lateral despejava os oito grupos de uma vez, em
   * qualquer página. Duas coisas erradas de uma vez: "Layout" e "Telas"
   * pesavam o mesmo que "Catálogo" quando são partes dele, e quem abria uma
   * página de fundamento rolava por 19 componentes para chegar ao índice do
   * assunto que estava lendo.
   *
   * A ordem é a de composição, a mesma que já governava a lateral: primeiro
   * como usar, depois o que existe, por último por que é assim.
   */
  protected readonly areas: Area[] = [
    {
      id: 'docs',
      rotulo: 'Docs',
      icone: 'i-bookOpen',
      abas: [
        { rotulo: 'Começar', link: '/comecar', secoes: ['comecar'] },
        { rotulo: 'Fundamentos', link: '/fundamentos', secoes: ['fundamentos'] },
      ],
    },
    {
      id: 'catalogo',
      rotulo: 'Catálogo',
      icone: 'i-layoutGrid',
      abas: [
        { rotulo: 'Componentes', link: '/catalogo', secoes: ['catalogo'] },
        { rotulo: 'Layout', link: '/layout', secoes: ['layout'] },
        { rotulo: 'Telas', link: '/telas', secoes: ['telas'] },
        { rotulo: 'Padrões', link: '/padroes', secoes: ['padroes'] },
      ],
    },
    {
      id: 'projeto',
      rotulo: 'Projeto',
      icone: 'i-scrollText',
      abas: [
        { rotulo: 'Decisões', link: '/decisoes', secoes: ['decisoes'] },
        { rotulo: 'Releases', link: '/releases', secoes: ['projeto'] },
      ],
    },
  ];

  /**
   * seçãoId → a aba que a serve.
   *
   * Derivado de `areas`, nunca escrito à mão: é o que deixa o título de grupo
   * da lateral linkar para o índice da aba sem uma segunda tabela que possa
   * discordar da primeira. Hoje o mapa é TOTAL — as oito seções são cobertas
   * pelas oito abas das três áreas —, e por isso todo título de grupo é link.
   * Se uma seção nova entrar sem aba que a referencie, ela cai no ramo @else
   * do template e vira rótulo morto em vez de quebrar.
   */
  private readonly abaDaSecao = new Map<string, Aba>(
    this.areas.flatMap((a) => a.abas.flatMap((t) => t.secoes.map((s) => [s, t] as const))),
  );

  private readonly router = inject(Router);

  /**
   * A URL como signal.
   *
   * `router.url` não é reativo e `routerLinkActive` só resolve o item que ele
   * mesmo decora — nenhum dos dois serve para decidir QUAL faixa de abas
   * renderizar. O valor inicial vem de `router.url` porque o prerender emite
   * o HTML antes de o primeiro NavigationEnd acontecer: sem ele, toda página
   * estática sairia com as abas da área errada e só se corrigiria na
   * hidratação.
   */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** A aba cujo link é o prefixo mais LONGO da URL. O mais longo, e não o
   *  primeiro que casa, porque `/` é prefixo de tudo. Sem casar nada — a home
   *  — cai na primeira área, que é onde a home pertence. */
  protected readonly abaAtual = computed<Aba | null>(() => {
    const u = this.url().split(/[?#]/)[0];
    let melhor: Aba | null = null;
    for (const a of this.areas) {
      for (const t of a.abas) {
        if ((u === t.link || u.startsWith(t.link + '/')) && (!melhor || t.link.length > melhor.link.length)) {
          melhor = t;
        }
      }
    }
    return melhor;
  });

  protected readonly areaAtual = computed<Area>(() => {
    const aba = this.abaAtual();
    return this.areas.find((a) => aba && a.abas.includes(aba)) ?? this.areas[0];
  });

  /** A home — e só ela — não casa aba nenhuma. `areaAtual` continua caindo na
   *  primeira área para o template nunca ler `null`, mas nada que dependa de
   *  área aparece ali: nem área acesa, nem segundo andar, nem lateral. */
  protected readonly naHome = computed(() => !this.abaAtual());

  protected readonly navAberta = signal(false);
  protected readonly filtro = signal('');
  protected readonly exato = { exact: true } as const;
  protected readonly inexato = { exact: false } as const;

  /* Os mesmos dois, mas comparando TAMBÉM a âncora.
     Existem por causa de /layout, onde os nove itens da lateral moram na mesma
     página e só a âncora os distingue. Com fragment: 'ignored' — que é o que
     as duas formas curtas acima significam — os nove casavam a rota ao mesmo
     tempo e a lateral marcava os NOVE como atuais. Passava despercebido
     enquanto "atual" era um cinza igual ao do hover; virou evidente quando o
     item atual ganhou a tinta da marca.

     'ignored' em queryParams e matrixParams porque o que distingue estes itens
     é só a âncora: uma query string na URL não deveria apagar a marcação.

     Um efeito colateral desejado: em /layout sem âncora nenhuma, só "Visão
     geral" acende — os outros oito têm fragmento e o da URL é indefinido. */
  private readonly exatoAncora: IsActiveMatchOptions = {
    paths: 'exact',
    fragment: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
  };
  private readonly inexatoAncora: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
  };


  /**
   * PREENCHIDO PARA DESTRAVAR O BUILD (04/09/2026).
   *
   * O template já referenciava `versao`, `estado` e `rolado` — o selo de
   * versão no cabeçalho e a sombra da faixa ao rolar — e nenhum dos três
   * existia na classe, então `vite build` falhava em cinco pontos e o site
   * inteiro não compilava. O selo ainda não tem CSS (`.versao`,
   * `.versao-num`, `.versao-estado`), o que sugere trabalho em curso de outra
   * sessão: quem for terminá-lo herda estes três membros prontos.
   *
   * Os dois valores saem da spec, não de constante escrita à mão: a regra do
   * repositório é que nada no site é conteúdo. Ver o bloco `meta` em
   * tools/build-index.mjs.
   */
  /* O ano do rodapé é o do RELÓGIO, não uma constante: um "© 2026" digitado à
     mão vira mentira em 1º de janeiro e ninguém revisa rodapé. O prerender
     grava o ano do build e a hidratação recalcula o mesmo valor — só diverge
     numa página servida do cache atravessando a virada do ano, onde o pior
     caso é o ano certo aparecer depois da hidratação. */
  protected readonly ano = new Date().getFullYear();
  protected readonly versao = meta.versao;
  protected readonly estado = meta.estado;

  /**
   * A faixa ganha filete e sombra assim que a página sai do topo. Sem isto o
   * cabeçalho fixo flutua sem separação sobre o conteúdo que passa por baixo.
   */
  protected readonly rolado = signal(false);

  /**
   * A navegação virou dado para o filtro poder peneirar as seis seções com uma
   * regra só. Antes eram 55 linhas de template com os links escritos à mão nas
   * estáticas e @for nas dinâmicas — filtrar exigiria repetir a condição em
   * cada uma.
   */
  private readonly secoes: Secao[] = [
    {
      id: 'comecar',
      titulo: 'Começar',
      itens: [
        { rotulo: 'Visão geral', link: '/comecar', exato: true },
        { rotulo: 'Instalação', link: '/comecar/instalacao' },
        { rotulo: 'Migrar uma tela', link: '/comecar/migrar' },
        { rotulo: 'Conectar MCP', link: '/comecar/mcp' },
        { rotulo: 'Skills e pacotes', link: '/comecar/skills' },
      ],
    },
    {
      id: 'fundamentos',
      titulo: 'Fundamentos',
      itens: [
        { rotulo: 'Visão geral', link: '/fundamentos', exato: true },
        { rotulo: 'Marca', link: '/fundamentos/marca' },
        { rotulo: 'Cor', link: '/fundamentos/cor' },
        { rotulo: 'Tipografia', link: '/fundamentos/tipografia' },
        { rotulo: 'Escrita', link: '/fundamentos/escrita' },
        { rotulo: 'Formatos', link: '/fundamentos/formatos' },
        { rotulo: 'Espaçamento', link: '/fundamentos/espacamento' },
        { rotulo: 'Densidade e grade', link: '/fundamentos/densidade' },
        { rotulo: 'Raio', link: '/fundamentos/raio' },
        { rotulo: 'Elevação', link: '/fundamentos/elevacao' },
        { rotulo: 'Breakpoints', link: '/fundamentos/breakpoints' },
        { rotulo: 'Movimento', link: '/fundamentos/movimento' },
        { rotulo: 'Estados', link: '/fundamentos/estados' },
        { rotulo: 'Ícones', link: '/fundamentos/icones' },
        { rotulo: 'Visualização de dados', link: '/fundamentos/dados' },
        { rotulo: 'Acessibilidade', link: '/fundamentos/acessibilidade' },
      ],
    },
    {
      id: 'catalogo',
      titulo: `Catálogo · ${meta.componentes}`,
      /* MESMA ordem e MESMOS grupos da página do catálogo.
         A lateral listava os 49 em ordem alfabética enquanto o conteúdo à
         direita vinha agrupado em oito categorias: quem navegava por uma
         taxonomia lia por outra, e "Chip" ficava entre "Checkbox" e
         "ChoiceCard" na lateral e dentro de "Formulário" na página.
         Sai de componentesPorCategoria(), a mesma função que a página chama —
         categoria nova entra nos dois lugares de uma vez, e nenhum dos dois
         pode discordar do outro. */
      itens: componentesPorCategoria().flatMap((g) =>
        g.itens.map((c) => ({
          rotulo: c.name,
          link: `/catalogo/${c.id}`,
          estado: c.status,
          grupo: g.rotulo,
          // A categoria entra na busca: quem digita "formulário" acha os
          // quinze, e quem digita "chip" continua achando o Chip.
          busca: g.rotulo,
        })),
      ),
    },
    // Layout entra ENTRE catálogo e padrões, na ordem de composição: um
    // componente resolve um controle, um bloco resolve o arranjo, uma tela
    // junta os dois, um padrão descreve a tarefa inteira.
    {
      id: 'layout',
      titulo: `Layout · ${meta.blocos + 1}`,
      itens: [
        // Todos os itens moram na MESMA página; o que os distingue é a
        // âncora. Sem ela os oito links levavam ao topo de /layout — e o
        // `track i.link` do @for via oito chaves iguais, que é o NG0955 que
        // o console cuspia em toda navegação.
        { rotulo: 'Visão geral', link: '/layout', exato: true },
        { rotulo: layouts.shell.nome, link: '/layout', fragmento: 'shell', busca: layouts.shell.classe },
        ...layouts.blocos.map((b) => ({
          rotulo: b.nome,
          link: '/layout',
          fragmento: b.id,
          busca: `${b.classe} ${b.papel}`,
        })),
      ],
    },
    {
      id: 'telas',
      titulo: `Telas · ${meta.telas}`,
      itens: telas.flatMap((p) =>
        p.templates.map((t) => ({
          rotulo: t.nome,
          link: `/telas/${p.id}/${t.id}`,
          busca: p.nome,
        }))
      ),
    },
    {
      id: 'padroes',
      titulo: `Padrões · ${meta.padroes}`,
      itens: padroes.map((p) => ({ rotulo: p.nome, link: `/padroes/${p.id}` })),
    },
    {
      id: 'decisoes',
      titulo: `Decisões · ${meta.adrs}`,
      // O rótulo é só o ID, mas o filtro também casa com o título da ADR: quem
      // procura "combobox" não sabe que a decisão sobre ele é a ADR-010.
      itens: adrs.map((a) => ({ rotulo: a.id, link: `/decisoes/${a.slug}`, busca: a.titulo })),
    },
    {
      id: 'projeto',
      titulo: 'Projeto',
      itens: [{ rotulo: 'Releases', link: '/releases' }],
    },
  ];

  /** Seções com pelo menos um item que casa. Seção vazia não renderiza. */
  /**
   * Selo só onde ele distingue.
   *
   * Um rótulo repetido em todo irmão não é informação, é ruído: hoje os 19
   * componentes estão em `draft`, e 19 selos idênticos custam atenção sem
   * separar nada. A regra é a mesma que a Atlassian usa na navegação dela —
   * o estado ESPERADO fica implícito e só a exceção é marcada.
   *
   * Então: o estado majoritário sobe uma vez para o rótulo do grupo
   * ("Catálogo · 19 · todos draft"; com dois estados, "· 18 draft") e some dos
   * itens; quem destoa ganha o selo. Quando o primeiro componente virar
   * `stable`, aparece UM selo — exatamente o que mudou.
   *
   * E O SELO SÓ DISTINGUE QUANDO A EXCEÇÃO É RARA (23/09/2026): até um quarto
   * do grupo. Com 26 draft e 23 review, "review" não era exceção, era metade
   * da lista — 23 cápsulas amarelas em mono, a maior fonte de ruído do site.
   * Acima do quarto, o rótulo do grupo diz os dois números ("26 draft · 23
   * review") e nenhum item leva selo. Continua palavra, nunca ponto.
   */
  private comEstadoComum(s: Secao): Secao {
    const comEstado = s.itens.filter((i) => i.estado);
    if (comEstado.length !== s.itens.length || !s.itens.length) return s;

    const contagem = new Map<string, number>();
    for (const i of comEstado) contagem.set(i.estado!, (contagem.get(i.estado!) ?? 0) + 1);

    // `quantos` é o número que o rótulo mostra. Ele mostrava `itens.length - 1`,
    // que só acerta quando UM item destoa — com 26 draft contra 23 review o
    // catálogo anunciava "48 draft" onde há 26, e o número mais visível da
    // navegação era o único errado da página.
    const ordem = [...contagem].sort((a, b) => b[1] - a[1]);
    const [maioria, quantos] = ordem[0];
    const total = s.itens.length;
    const raro = total - quantos <= total / 4;

    const estadoResumo =
      quantos === total
        ? `todos ${maioria}`
        : raro
          ? `${quantos} ${maioria}`
          : ordem.map(([estado, n]) => `${n} ${estado}`).join(' · ');

    return {
      ...s,
      estadoResumo,
      // Exceção rara: só quem destoa leva selo. Sem exceção rara: ninguém —
      // o rótulo do grupo já disse os números.
      itens: s.itens.map((i) => (raro && i.estado !== maioria ? i : { ...i, estado: undefined })),
    };
  }

  protected readonly secoesVisiveis = computed(() => {
    const q = normaliza(this.filtro());
    const aba = this.abaAtual();

    // COM busca, varre as OITO seções. SEM busca, mostra as seções da ÁREA
    // inteira — e não só as da aba aberta, como até 09/09/2026.
    //
    // O que mudou e por quê: a lateral recortada na ABA era a razão de o
    // segundo andar de abas existir, porque a faixa era a única ponte entre
    // abas irmãs. Com a faixa fora, /catalogo não teria caminho nenhum para
    // /layout. Agora as irmãs estão aqui, recolhidas ao título — e o recorte
    // que importava continua de pé: em /fundamentos/cor a lista de 43
    // componentes segue fora da tela, agora porque o grupo está recolhido, e
    // não porque não existe.
    //
    // O filtro segue varrendo tudo. É o atalho de quem já sabe o nome do que
    // procura, e recortá-lo faria "combobox" digitado dentro de Docs devolver
    // "nada com 'combobox'" sobre um site que tem o contrato do Combobox. Uma
    // busca que responde "não existe" sobre algo que existe é pior que uma
    // lista longa.
    const escopo = q
      ? this.secoes
      : aba
        ? // Ordem de ABA, não a de `secoes`: é a ordem de composição que as
          // áreas declaram, e era a ordem que a faixa de cima mostrava.
          this.areaAtual()
            .abas.flatMap((t) => t.secoes)
            .map((id) => this.secoes.find((s) => s.id === id))
            .filter((s): s is Secao => !!s)
        : // A home não casa aba nenhuma e não é de área nenhuma: nenhum grupo.
          // Até 11/09/2026 ela abria os oito — era o único lugar do site onde a
          // lateral voltava a despejar tudo, e ele ficava sob a aba Docs. Na
          // gaveta estreita sobram as três áreas, que é a escolha certa ali.
          [];

    const base = q
      ? escopo
          .map((s) => ({
            ...s,
            itens: s.itens.filter((i) => normaliza(`${i.rotulo} ${i.busca ?? ''}`).includes(q)),
          }))
          .filter((s) => s.itens.length > 0)
      : escopo;

    return base.map((s) => {
      // A comparação por âncora vale para a SEÇÃO inteira, não item a item:
      // em /layout, "Visão geral" não tem fragmento, e é justamente ela que
      // precisa da regra para NÃO acender junto com a seção aberta.
      //
      // O recorte é por seção e não global de propósito. O índice da página
      // — a coluna da direita — escreve âncoras na URL o tempo todo: em
      // /catalogo/button#props, comparar fragmento apagaria a marcação do
      // item "Button" na lateral, que continua sendo a página aberta.
      const porAncora = s.itens.some((i) => i.fragmento);
      const itens = s.itens.map((i) => ({
        ...i,
        opcoes: porAncora
          ? i.exato
            ? this.exatoAncora
            : this.inexatoAncora
          : i.exato
            ? this.exato
            : this.inexato,
      }));
      return this.comEstadoComum({
        ...s,
        itens,
        link: this.abaDaSecao.get(s.id)?.link,
        // Com filtro digitado tudo expande — senão o resultado da busca ficaria
        // escondido atrás de um título recolhido, que é o oposto de buscar.
        // Sem aba casada (a home), tudo expande também: ali a lateral é o
        // sumário do site inteiro.
        aberta: !!q || !aba || aba.secoes.includes(s.id),
      });
    });
  });
}
