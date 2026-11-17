import { Component, ChangeDetectionStrategy, computed, input, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { projetoPorId, telaPorId } from '../../../spec/spec';
import type { AcaoFluxo, Tela } from '../../../spec/spec.types';
import { PageHeaderComponent } from '../../../docs/page-header.component';
import { noNavegador } from '../../../docs/no-navegador';
import { consultaDeTema, sincronizaTemaDosPreviews } from '../../../docs/tema-preview';
import { TextoComponent } from '../../../docs/texto.component';

/**
 * A pasta de um sistema: as telas dele em miniatura e o mapa de fluxo.
 *
 * Saiu de /telas, que despejava os sistemas todos numa rolagem só, uma
 * galeria de dezenas de iframes. Agora /telas mostra as pastas e cada pasta
 * abre aqui, com as mesmas miniaturas e o mesmo mapa de fluxo de antes.
 *
 * O palco é `inert` e reduzido por escala — escala medida em CSS, a partir da
 * largura do próprio palco. O card inteiro é um link, e controle focável
 * dentro de âncora é armadilha de teclado.
 */
@Component({
  selector: 'ucam-telas-projeto',
  imports: [TextoComponent, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dados(); as p) {
      <ucam-page-header secao="Telas" secaoLink="/telas" [titulo]="p.nome" [lede]="p.descricao" />
      <p class="stack small">
        <span><span class="rotulo">Hoje</span>{{ p.stack_atual }}</span>
        <span class="conta">{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
      </p>
      <section class="projeto">
        <div class="grade">
          @for (t of p.templates; track t.id) {
            <a class="card" [routerLink]="'/telas/' + p.id + '/' + t.id">
              <div class="palco" inert>
                <iframe
                  class="palco-conteudo"
                  data-preview
                  [src]="url(t.arquivo)"
                  width="1180"
                  height="738"
                  loading="lazy"
                  [title]="'Tela ' + t.nome + ' — ' + p.nome"
                ></iframe>
              </div>
              <div class="corpo">
                @if (t.perfil) {
                  <p class="perfil small"><span class="rotulo">Quem vê</span>{{ t.perfil }}</p>
                }
                <h3>{{ t.nome }}</h3>
                <p class="small muted"><ucam-t [t]="t.descricao" /></p>
                <p class="rodape small">
                  <span>{{ t.padrao }}</span>
                  <span>{{ t.usa.length }} componentes</span>
                </p>
              </div>
            </a>
          }
        </div>

        <!-- COMO USAR (spec/guias/<id>.json, 27/10/2026): a única parte desta
             página escrita para quem USA o sistema, e não para quem o desenha.
             Por tarefa, não por região da tela; uma tela por bloco, fechado,
             para a galeria continuar sendo o que se vê primeiro. -->
        @if (p.guia; as g) {
          <section class="guia" aria-labelledby="guia-titulo">
            <h2 id="guia-titulo">Como usar</h2>
            <p class="guia-app">{{ g.app.para_que }}</p>
            @if (g.app.quem) {
              <p class="small muted"><span class="rotulo">Quem usa</span>{{ g.app.quem }}</p>
            }
            @for (t of p.templates; track t.id) {
              @if (g.telas[t.id]; as gt) {
                <details class="guia-tela">
                  <summary>{{ t.nome }}</summary>
                  <p>{{ gt.objetivo }}</p>
                  <p class="small muted"><span class="rotulo">Quem</span>{{ gt.quem }}</p>
                  @for (tf of gt.tarefas; track tf.titulo) {
                    <h3>{{ tf.titulo }}</h3>
                    <ol>
                      @for (passo of tf.passos; track $index) {
                        <li>{{ passo }}</li>
                      }
                    </ol>
                  }
                  @if (gt.termos?.length) {
                    <h3>Termos</h3>
                    <dl>
                      @for (x of gt.termos; track x.termo) {
                        <dt>{{ x.termo }}</dt>
                        <dd>{{ x.significa }}</dd>
                      }
                    </dl>
                  }
                  @if (gt.duvidas?.length) {
                    <h3>Dúvidas</h3>
                    <dl>
                      @for (x of gt.duvidas; track x.pergunta) {
                        <dt>{{ x.pergunta }}</dt>
                        <dd>{{ x.resposta }}</dd>
                      }
                    </dl>
                  }
                  <p class="small"><a [routerLink]="'/telas/' + p.id + '/' + t.id">Abrir a tela {{ t.nome }}</a></p>
                </details>
              }
            }
          </section>
        }

        <!-- O MAPA DE FLUXO do sistema (ADR-033): de onde se chega a cada tela
             e o que cada ação faz. Sai do bloco "fluxos" de templates.json,
             que é o mesmo que marca data-fluxo nos botões das telas. -->
        <details class="fluxos">
          <summary>Fluxos de {{ p.nome }}</summary>
          <div class="scroller">
            <table>
              <thead>
                <tr>
                  <th scope="col">Tela</th>
                  @if (temPerfil(p)) {
                    <th scope="col">Quem vê</th>
                  }
                  <th scope="col">Chega de</th>
                  <th scope="col">Leva a</th>
                  <th scope="col">Age na tela</th>
                  <th scope="col">Sem tela neste conjunto</th>
                </tr>
              </thead>
              <tbody>
                @for (t of p.templates; track t.id) {
                  <tr>
                    <th scope="row">
                      <a [routerLink]="'/telas/' + p.id + '/' + t.id">{{ t.nome }}</a>
                    </th>
                    @if (temPerfil(p)) {
                      <td>{{ t.perfil ?? '—' }}</td>
                    }
                    <td>{{ nomes(t.fluxos?.chega_de) }}</td>
                    <td>{{ acoes(t, 'a') }}</td>
                    <td>{{ acoes(t, 'c') }}</td>
                    <td>{{ acoes(t, 'b') }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
      </section>
    } @else {
      <p>Sistema não encontrado. <a routerLink="/telas">Ver todos</a>.</p>
    }
  `,
  styles: `
    .stack {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 0.9rem;
      margin: 0 0 1.5rem;
      color: var(--ucam-color-text-secondary);
    }
    .conta {
      font-family: var(--f-mono);
      font-size: 0.75rem;
    }
    .rotulo {
      font-family: var(--f-mono);
      /* 0,75rem: a régua de metadado do site, a mesma do .meta da página de
         componente. Estava em 10,4px, abaixo do piso que este próprio site
         cobra das telas que documenta. */
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.05rem 0.35rem;
      margin-inline-end: 0.4rem;
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-subtle);
    }

    .grade {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
    }
    /* Mesma linguagem de card do resto do site: raio de SUPERFÍCIE, sombra
       curta em repouso e a borda na tinta da marca no hover.
       O que havia aqui era "box-shadow: 0 2px 0 0 <borda>" — um filete duplo
       embaixo, não uma sombra: a caixa parecia ter uma segunda borda solta em
       vez de estar acima do papel. E o fundo era surface-subtle enquanto o
       palco por dentro pintava branco, o que dava dois cinzas dentro da mesma
       moldura. */
    .card {
      display: flex;
      flex-direction: column;
      /* O padding de 1,05rem/1,15rem vem do .card GLOBAL de styles.css e nunca
         foi pedido aqui: o palco é sangria, e o que o clipava era o
         overflow:hidden mais o raio deste card. Com o padding herdado a
         miniatura virava um retângulo flutuando dentro de uma moldura, e o
         filete do .palco parava a 19px de cada borda — a marca de caixa
         inacabada. A regra global "a.card:has(.palco)::after { display:none }"
         já dizia que o canto do card É a miniatura; só não era. */
      padding: 0;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
      background: var(--ucam-color-surface-default);
      color: inherit;
      text-decoration: none;
    }
    .card:hover {
      border-color: var(--borda-marca);
      box-shadow: var(--sombra-hover);
    }
    .card:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }

    /* A tela é montada na largura de um desktop e reduzida por escala. Escala,
       e não largura reduzida: em 1180px as media queries do shell entregam a
       navegação FIXA, que é o arranjo que a tela documenta.

       E é por isso que a miniatura é um IFRAME, não innerHTML. Media query
       responde à largura da VIEWPORT, não à do contêiner: com o preview no
       mesmo documento, uma janela de 900px punha as 12 miniaturas no arranjo
       de tablet, e uma de 480px no de celular — esticado numa caixa de 1180px,
       porque a caixa é do site e a media query é da janela. O comentário que
       estava aqui afirmava o contrário e nunca foi verdade abaixo de 64rem.
       O iframe dá ao preview uma viewport própria, que é o que faz a
       miniatura mostrar a tela que a página de destino documenta. Mesma
       decisão, e mesma página /t/, da tela de detalhe.

       Continua dentro de um .palco inert: com o foco entrando no iframe, Tab
       fica preso lá dentro — medido, quatro Tabs seguidos sem sair. O inert
       do PAI cobre o documento aninhado, também medido. */
    .palco {
      /* Proporção, não altura fixa. A escala segue a largura do card, então
         altura em rem descolava da miniatura: em card de 486px sobrava tela e
         em card de 352px faltava. */
      aspect-ratio: 16 / 10;
      position: relative;
      overflow: hidden;
      /* O container é o que dá a largura ao cqw da escala abaixo. */
      container-type: inline-size;
      background: var(--ucam-color-surface-canvas);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    /* A escala era 0.28 fixa, e 1180 × 0,28 = 330px. A grade é auto-fill com
       1fr: numa janela de 1600px a coluna dá 486px, então TODA miniatura
       terminava 117px antes da borda direita e deixava uma faixa morta de
       canvas — um quarto do palco vazio, medido por CDP em 10/09/2026.

       A escala certa é largura-do-palco ÷ 1180, e o comentário da página de
       detalhe diz que "o CSS não divide comprimento por comprimento". Divide:
       atan2() aceita dois comprimentos e devolve ÂNGULO, e a tangente desse
       ângulo é a razão entre eles, sem unidade. É o que scale() quer.

       Aqui vale a pena não ser o ResizeObserver que a página de detalhe usa:
       esta grade é pré-renderizada e tem 12 miniaturas: a escala vinda do JS
       só chegaria depois da hidratação, e as 12 dariam um salto de tamanho
       juntas ~2,5s depois da primeira pintura. Em CSS a primeira pintura já
       está certa. */
    /* 738px é conta, não gosto: com o palco em 16/10 e a escala valendo
       largura-do-palco ÷ 1180, a altura visível em coordenadas do IFRAME é
       sempre 1180 × 10/16 = 737,5, seja qual for a largura do card. */
    .palco-conteudo {
      display: block;
      border: 0;
      block-size: 738px;
      inline-size: 1180px;
      /* Piso para quem não tem tan()/atan2(): declaração inválida é DESCARTADA,
         e sem ela sobraria transform:none — a tela em 1180px reais dentro de
         um palco de 484. */
      transform: scale(0.41);
      transform: scale(tan(atan2(100cqw, 1180px)));
      transform-origin: top left;
    }
    /* A tela é mais alta do que a proporção mostra, e o corte seco no meio de
       uma linha de tabela lia como render quebrado. Esmaecido lê como amostra
       que continua — é a mesma regra do palco do catálogo. */
    .palco::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 3rem;
      background: linear-gradient(to top, var(--ucam-color-surface-canvas), transparent);
      pointer-events: none;
    }

    .corpo {
      padding: 0.9rem 1.1rem 1.1rem;
      flex: 1;
    }
    /* Quem vê a tela vem ANTES do nome: num sistema com dois lados, as telas
       do candidato e as da coordenação têm o mesmo título na trilha, e o
       nome da tela sozinho não diz de que lado do balcão ela está. */
    .perfil {
      color: var(--ucam-color-text-secondary);
    }
    .corpo h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .corpo p {
      margin: 0 0 0.6rem;
    }
    .rodape {
      display: flex;
      gap: 0.9rem;
      margin-bottom: 0 !important;
      font-family: var(--f-mono);
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
    }

    .guia {
      margin-block-start: 2.5rem;
      max-inline-size: 48rem;
    }
    /* A régua de título de seção do site (.secao-titulo de /comecar). */
    .guia h2 {
      margin: 0 0 0.9rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }
    .guia-app {
      margin: 0 0 0.5rem;
    }
    .guia > p.small {
      margin-block-end: 1rem;
    }
    .guia-tela > p:last-child {
      margin-block-start: 1rem;
    }
    .guia-tela {
      border-block-start: 1px solid var(--ucam-color-border-default);
      padding-block: 0.75rem;
    }
    .guia-tela:last-of-type {
      border-block-end: 1px solid var(--ucam-color-border-default);
    }
    .guia-tela summary {
      cursor: pointer;
      font-weight: 560;
    }
    .guia-tela h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ucam-color-text-primary);
      margin: 1.25rem 0 0.35rem;
    }
    /* O reset do site tira o marcador das listas; aqui a ordem é o conteúdo. */
    .guia-tela ol {
      list-style: decimal;
      margin: 0;
      padding-inline-start: 1.5rem;
    }
    .guia-tela li::marker {
      color: var(--ucam-color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .guia-tela li + li {
      margin-block-start: 0.25rem;
    }
    .guia-tela dt {
      font-weight: 560;
      margin-block-start: 0.5rem;
    }
    .guia-tela dd {
      margin: 0;
      color: var(--ucam-color-text-secondary);
    }

    .fluxos {
      margin-block-start: 1.5rem;
    }
    .fluxos summary {
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 560;
    }
    .fluxos table {
      margin-block-start: 0.75rem;
      font-size: 0.8125rem;
    }
    .fluxos th,
    .fluxos td {
      vertical-align: top;
      text-align: start;
    }
    .fluxos td {
      color: var(--ucam-color-text-secondary);
    }

    @media (prefers-reduced-motion: no-preference) {
      .card {
        transition:
          border-color var(--transicao),
          box-shadow var(--transicao),
          transform var(--transicao);
      }
      .card:hover {
        transform: translateY(-2px);
      }
      .card:active {
        transform: translateY(0);
        box-shadow: none;
      }
    }
  `,
})
export default class TelasProjetoPage {
  private readonly sanitizer = inject(DomSanitizer);
  // Campo, não inject() lá dentro: noNavegador roda por afterNextRender, ou
  // seja fora do contexto de injeção.
  private readonly destroy = inject(DestroyRef);

  constructor() {
    // As doze miniaturas são documentos próprios: sem isto ficam brancas
    // dentro de uma documentação no escuro. Ver docs/tema-preview.ts.
    noNavegador(() => this.destroy.onDestroy(sincronizaTemaDosPreviews()));
  }

  /** Parâmetro de rota por input(): navegar de uma pasta a outra recalcula. */
  readonly projeto = input('');
  protected readonly dados = computed(() => projetoPorId(this.projeto()));

  /** "projeto/tela" vira o nome da tela; o que não é tela ("menu do sistema") passa como está. */
  protected nomes(ids?: readonly string[]): string {
    if (!ids?.length) return '—';
    return ids
      .map((id) => {
        const [projeto, tela] = id.split('/');
        return (tela && telaPorId(projeto, tela)?.tela.nome) || id;
      })
      .join(', ');
  }

  /** A coluna Quem vê só existe no sistema que declara perfil em alguma tela. */
  protected temPerfil(p: { templates: readonly Tela[] }): boolean {
    return p.templates.some((t) => t.perfil);
  }

  protected acoes(t: Tela, classe: AcaoFluxo['classe']): string {
    const lista = (t.fluxos?.acoes ?? []).filter((a) => a.classe === classe);
    if (!lista.length) return '—';
    return lista
      .map((a) => (a.destino ? `${a.rotulo} → ${this.nomes([a.destino])}` : a.rotulo))
      .join(' · ');
  }

  private readonly urls = new Map<string, SafeResourceUrl>();

  /**
   * A mesma página autônoma que a tela de detalhe embute, e o mesmo ?embed=1.
   * O bypass é sobre uma URL do próprio site, montada a partir do nome de
   * arquivo que a spec declara — não há entrada de terceiro no caminho.
   */
  protected url(arquivo: string): SafeResourceUrl {
    if (!this.urls.has(arquivo)) {
      this.urls.set(
        arquivo,
        this.sanitizer.bypassSecurityTrustResourceUrl(`/t/${arquivo}?embed=1${consultaDeTema()}`),
      );
    }
    return this.urls.get(arquivo)!;
  }
}
