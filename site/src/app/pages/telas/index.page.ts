import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { telas, meta, telaPorId } from '../../spec/spec';
import type { AcaoFluxo, Tela } from '../../spec/spec.types';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { noNavegador } from '../../docs/no-navegador';
import { consultaDeTema, sincronizaTemaDosPreviews } from '../../docs/tema-preview';

/**
 * Telas inteiras, agrupadas por sistema.
 *
 * O degrau acima do bloco de layout: onde componentes, blocos e shell aparecem
 * juntos resolvendo uma tarefa real do parque. Cada tela é montada com o
 * @ucam/css real e com o shell de tools/lib/shell.mjs — o mesmo que gera as
 * páginas autônomas de docs/t/. Não é captura nem maquete.
 *
 * O palco é `inert` e reduzido por escala — escala medida em CSS, a partir da
 * largura do próprio palco, para a miniatura sangrar de borda a borda em
 * qualquer largura de card. O card inteiro é um link, e
 * controle focável dentro de âncora é armadilha de teclado.
 */
@Component({
  selector: 'ucam-telas',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Telas"
      [titulo]="'Telas de referência'"
      [lede]="
        total +
        ' telas de ' +
        projetos +
        ' sistemas, montadas com os componentes e os blocos deste design system. São o alvo da migração, não o retrato do que está no ar hoje.'
      "
    />

    @for (p of lista; track p.id) {
      <section class="projeto">
        <div class="projeto-cabeca">
          <span class="ucam-icon-tile" aria-hidden="true">
            <svg class="ic"><use [attr.href]="'#i-' + p.icone" /></svg>
          </span>
          <div class="projeto-texto">
            <h2>{{ p.nome }} <span class="num">{{ p.templates.length }}</span></h2>
            <p class="small muted">{{ p.descricao }}</p>
            <p class="stack small">
              <span class="rotulo">Hoje</span>
              {{ p.stack_atual }}
            </p>
          </div>
        </div>

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
                <h3>{{ t.nome }}</h3>
                <p class="small muted">{{ t.descricao }}</p>
                <p class="rodape small">
                  <span>{{ t.padrao }}</span>
                  <span>{{ t.usa.length }} componentes</span>
                </p>
              </div>
            </a>
          }
        </div>

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
    }
  `,
  styles: `
    .projeto {
      margin-block-end: 4rem;
    }
    /* CADA SISTEMA COMEÇA NUM FILETE, e não só num vão maior.
       Cinco blocos de miniaturas separados apenas por 4rem de branco leem como
       uma galeria só e longa: a pessoa rola procurando "onde começa o SigFin" e
       não tem onde a vista pare. O filete dá o começo, e a pastilha dá a
       silhueta — o símbolo de cada sistema JÁ estava declarado no spec, campo
       "icone", e a galeria era o único lugar que o tinha e não o mostrava. */
    .projeto-cabeca {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 0.9rem;
      align-items: start;
      margin-block-end: 1.25rem;
      padding-block-start: 1.25rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    /* O primeiro sistema encosta no filete do cabeçalho da página: dois fios
       a 1,25rem um do outro seriam um degrau duplicado. */
    .projeto:first-of-type .projeto-cabeca {
      padding-block-start: 0;
      border-block-start: 0;
    }
    .projeto-texto {
      max-inline-size: var(--measure);
    }
    .projeto-cabeca h2 {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      font-size: 1.375rem;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    .projeto-cabeca .num {
      font-family: var(--f-mono);
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--ucam-color-text-secondary);
    }
    .projeto-cabeca p {
      margin: 0;
    }
    .stack {
      margin-block-start: 0.4rem !important;
      color: var(--ucam-color-text-secondary);
    }
    .rotulo {
      font-family: var(--f-mono);
      font-size: 0.62rem;
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
      box-shadow: var(--sombra-repouso);
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
      font-size: 0.65rem;
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
        box-shadow: var(--sombra-repouso);
      }
    }
  `,
})
export default class TelasPage {
  private readonly sanitizer = inject(DomSanitizer);
  // Campo, não inject() lá dentro: noNavegador roda por afterNextRender, ou
  // seja fora do contexto de injeção.
  private readonly destroy = inject(DestroyRef);

  constructor() {
    // As doze miniaturas são documentos próprios: sem isto ficam brancas
    // dentro de uma documentação no escuro. Ver docs/tema-preview.ts.
    noNavegador(() => this.destroy.onDestroy(sincronizaTemaDosPreviews()));
  }

  protected readonly lista = telas;
  protected readonly total = meta.telas;
  protected readonly projetos = meta.projetos;

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
