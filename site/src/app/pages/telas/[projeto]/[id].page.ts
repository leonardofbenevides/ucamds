import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  inject,
  signal,
  effect,
  viewChild,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { telaPorId, componentePorId, padraoPorId } from '../../../spec/spec';
import { PageHeaderComponent } from '../../../docs/page-header.component';
import { noNavegador } from '../../../docs/no-navegador';
import { consultaDeTema, sincronizaTemaDosPreviews } from '../../../docs/tema-preview';

/** Larguras da moldura. Os nomes são os pontos de virada do próprio shell. */
const LARGURAS = [
  { id: 'desktop', rotulo: 'Desktop', px: 1180, nota: 'Navegação fixa — a partir de 64rem.' },
  { id: 'tablet', rotulo: 'Tablet', px: 900, nota: 'Navegação sobreposta; conteúdo ainda em duas colunas.' },
  { id: 'celular', rotulo: 'Celular', px: 390, nota: 'Navegação sobreposta e conteúdo em coluna única.' },
] as const;

/**
 * Uma tela de referência.
 *
 * O preview vai num <iframe> de propósito, apontando para a página autônoma
 * gerada por tools/build-templates.mjs. Media query responde à largura da
 * VIEWPORT, não à do contêiner: um preview embutido nesta coluna mostraria a
 * navegação fixa mesmo dentro de uma moldura de celular, documentando um
 * arranjo que não existe. O iframe dá ao preview uma viewport própria, e é o
 * que faz os três botões de largura significarem alguma coisa.
 *
 * O parâmetro de rota entra por input() e não por snapshot: um computed sobre
 * snapshot nunca recalcula, e navegar entre duas telas congelaria a página na
 * primeira aberta.
 */
@Component({
  selector: 'ucam-tela',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dados(); as d) {
      <ucam-page-header
        [secao]="d.projeto.nome"
        [titulo]="d.tela.nome"
        [lede]="d.tela.descricao"
      />

      <div class="controles">
        <div class="larguras" role="group" aria-label="Largura da moldura">
          @for (l of larguras; track l.id) {
            <button
              type="button"
              [class.ativo]="largura().id === l.id"
              [attr.aria-pressed]="largura().id === l.id"
              (click)="largura.set(l)"
            >
              {{ l.rotulo }}
              <span class="px">{{ l.px }}px</span>
            </button>
          }
        </div>
        <a class="abrir" [href]="'/t/' + d.tela.arquivo" target="_blank" rel="noopener">
          Abrir em nova aba
        </a>
      </div>
      <p class="nota small muted">{{ largura().nota }}</p>

      <!-- A moldura reduz por ESCALA, nunca por largura: reduzir a largura
           mudaria a viewport do iframe e, com ela, o arranjo documentado.
           Isto estava escrito aqui desde sempre e nunca foi implementado — o
           iframe tinha max-inline-size:100%, que é exatamente reduzir por
           largura. Numa janela onde a coluna dá 830px, o quadro de "Desktop
           1180px" virava uma viewport de 830px: a tela lá dentro passava a
           renderizar o arranjo de tablet e o que não cabia saía CORTADO na
           direita. A escala é medida no navegador porque o CSS não divide
           comprimento por comprimento. -->
      <!-- O PALCO é quem se mede; a moldura é quem se ajusta.
           Medir a própria moldura e ao mesmo tempo dimensioná-la pela medida
           seria realimentação — é o que o comentário do ResizeObserver
           abaixo já evitava para a altura. O palco não tem borda nem
           tamanho próprio, então sua largura é a da coluna, sempre. -->
      <div class="palco" #palco>
        <div class="moldura" [style.--px.px]="largura().px" [style.--escala]="escala()">
          <iframe
            [src]="url(d.tela.arquivo)"
            data-preview
            [attr.width]="largura().px"
            [title]="'Tela ' + d.tela.nome + ' — ' + d.projeto.nome"
            loading="lazy"
          ></iframe>
        </div>
      </div>
      @if (escala() < 1) {
        <p class="escala-nota small muted">
          Reduzido a {{ (escala() * 100).toFixed(0) }}% para caber na coluna. A tela continua
          desenhando em {{ largura().px }}px — é a viewport que o arranjo documenta.
        </p>
      }

      <div class="colunas">
        <section>
          <h2>Decisões desta tela</h2>
          <ul class="notas">
            @for (n of d.tela.notas ?? []; track n) {
              <li>{{ n }}</li>
            }
          </ul>

          @if (d.tela.problemas?.length) {
            <h2>O que o legado faz aqui</h2>
            <ul class="problemas">
              @for (p of d.tela.problemas ?? []; track p) {
                <li>{{ p }}</li>
              }
            </ul>
          }
        </section>

        <aside>
          <h2>Ficha</h2>
          <dl class="ficha">
            <dt>Padrão</dt>
            <dd>
              @if (padrao(); as p) {
                <a [routerLink]="'/padroes/' + p.id">{{ p.nome }}</a>
              } @else {
                {{ d.tela.padrao }}
              }
            </dd>
            <dt>Sistema</dt>
            <dd>{{ d.projeto.nome }}</dd>
            <dt>Stack hoje</dt>
            <dd>{{ d.projeto.stack_atual }}</dd>
            <dt>Evidência</dt>
            <dd>{{ d.tela.origem }}</dd>
          </dl>

          <h2>Componentes usados</h2>
          <ul class="usa">
            @for (u of usa(); track u.selector) {
              <li>
                @if (u.id) {
                  <a [routerLink]="'/catalogo/' + u.id"><code>&lt;{{ u.selector }}&gt;</code></a>
                } @else {
                  <code>&lt;{{ u.selector }}&gt;</code>
                }
              </li>
            }
          </ul>
        </aside>
      </div>
    } @else {
      <p>Tela não encontrada. <a routerLink="/telas">Ver todas</a>.</p>
    }
  `,
  styles: `
    .controles {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-block-end: 0.5rem;
    }
    .larguras {
      display: flex;
      max-inline-size: 100%;
      overflow-x: auto;
      gap: 0.25rem;
      padding: 0.2rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-subtle);
    }
    .larguras button {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      padding: 0.3rem 0.7rem;
      border: 0;
      border-radius: var(--ucam-radius-md);
      background: none;
      font: inherit;
      font-size: 0.8125rem;
      transition: background-color 120ms ease, box-shadow 120ms ease;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
    }
    .larguras button:hover {
      background: var(--ucam-color-action-secondary-hover);
    }
    /* O segmento ativo é um CARTÃO BRANCO que sobe do cinza do trilho — não
       um retângulo bordô.

       O que não mudou: o estado continua não dependendo só de cor (aria-pressed
       para quem ouve, superfície e sombra para quem vê). O que mudou é o peso.
       O bordô cheio fazia do seletor de largura do preview o elemento mais
       forte da página — mais forte que o título da tela e que o próprio
       preview, que é o assunto. É a mesma lógica que a spec já registra em
       surface.chrome para o item ativo da navegação: sobre uma moldura
       recuada, quem está selecionado SOBE em vez de ser pintado de marca. */
    .larguras button.ativo {
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font-weight: 600;
      box-shadow: var(--ucam-elevation-raised);
    }
    .larguras .px {
      font-family: var(--f-mono);
      font-size: 0.65rem;
      opacity: 0.75;
    }
    .abrir {
      margin-inline-start: auto;
      font-size: 0.8125rem;
    }
    .nota {
      margin: 0 0 1rem;
    }

    /* A moldura mostra o iframe na largura escolhida e o REDUZ por escala
       quando a coluna do site é menor que ela. A altura da moldura acompanha
       a escala — transform não muda a caixa de layout, então sem isto
       sobraria um vão branco embaixo do tamanho da redução. */
    /* O palco só existe para ser medido: largura da coluna, altura do que
       tem dentro. É ele que o ResizeObserver observa. */
    .palco {
      margin-block-end: 3rem;
    }
    .moldura {
      --alt: 44rem;
      /* A largura da moldura é a do DESENHO que ela mostra, não a da coluna.
         Antes era 100% da coluna: numa janela larga, "Desktop 1180px" ficava
         numa caixa de 1278px e sobravam 99px de vão cinza à direita do
         quadro — medido, não impressão. O min() protege o caso inverso, em
         que a escala já reduziu e a coluna é o teto. */
      inline-size: min(100%, calc(var(--px) * var(--escala, 1)));
      /* Fio, não contorno: a borda era border-default (#D0D0D0), a linha mais
         escura da página inteira em volta de um preview que é quase todo
         branco — desenhava um quadro em vez de delimitar um palco. */
      border: 1px solid var(--ucam-color-border-subtle);
      /* Raio de MOLDURA: é o que a tela lá dentro usa no próprio painel, e
         era estranho um recorte de 10px em volta de um desenho de 20px. */
      border-radius: var(--ucam-radius-frame);
      box-shadow: var(--ucam-elevation-raised);
      /* Recorta a caixa de layout do iframe, que continua com os 1180px
         mesmo depois do transform. Nada PINTADO é cortado: o desenho já foi
         reduzido para caber. */
      overflow: hidden;
      background: var(--ucam-color-surface-canvas);
      block-size: calc(var(--alt) * var(--escala, 1));
    }
    .moldura iframe {
      display: block;
      border: 0;
      /* A viewport do iframe é esta, e é a que a tela lá dentro enxerga nas
         media queries. Ela não muda com a largura da janela — se mudasse, os
         três botões de largura não significariam nada. */
      inline-size: var(--px);
      block-size: var(--alt);
      transform: scale(var(--escala, 1));
      transform-origin: 0 0;
    }
    .escala-nota {
      margin-block: -2.25rem 3rem;
    }

    .colunas {
      display: grid;
      gap: 2rem;
      align-items: start;
    }
    @media (min-width: 60rem) {
      .colunas {
        grid-template-columns: minmax(0, 1fr) 18rem;
      }
    }
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.0625rem;
      font-weight: 560;
    }
    section h2 + * {
      margin-block-end: 2rem;
    }
    aside h2 {
      margin-block-start: 2rem;
      font-size: 0.9375rem;
    }
    aside h2:first-child {
      margin-block-start: 0;
    }

    ul.notas,
    ul.problemas,
    ul.usa {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.6rem;
    }
    ul.notas li,
    ul.problemas li {
      max-inline-size: var(--measure);
      padding-inline-start: 0.9rem;
      border-inline-start: 2px solid var(--ucam-color-border-subtle);
      font-size: 0.9375rem;
    }
    ul.problemas li {
      border-inline-start-color: var(--ucam-color-feedback-danger-border);
      color: var(--ucam-color-text-secondary);
    }
    ul.usa {
      gap: 0.35rem;
    }
    ul.usa code {
      font-family: var(--f-mono);
      font-size: 0.75rem;
    }

    .ficha {
      margin: 0;
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: 0.35rem 0.9rem;
      font-size: 0.8125rem;
    }
    .ficha dt {
      color: var(--ucam-color-text-secondary);
    }
    .ficha dd {
      margin: 0;
    }
  `,
})
export default class TelaPage {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy = inject(DestroyRef);

  readonly projeto = input('');
  readonly id = input('');

  protected readonly larguras = LARGURAS;
  protected readonly largura = signal<(typeof LARGURAS)[number]>(LARGURAS[0]);

  private readonly palco = viewChild<ElementRef<HTMLElement>>('palco');

  /**
   * Quanto a moldura precisa encolher para caber na coluna. 1 = tamanho real.
   *
   * Sai de uma medição no navegador porque o CSS não divide comprimento por
   * comprimento: `calc(100cqi / 1180px)` não é expressão válida, e sem essa
   * razão não há como virar largura disponível em fator de escala.
   * No prerender fica 1 — o valor certo para uma página que não tem viewport.
   */
  protected readonly escala = signal(1);

  /**
   * Recalcula quando o quadro aparece (o viewChild é signal) e quando o botão
   * de largura muda o divisor. O ResizeObserver do construtor cobre o terceiro
   * gatilho, que é a janela mudar de tamanho.
   */
  private readonly ajusta = effect(() => {
    const el = this.palco()?.nativeElement;
    const px = this.largura().px;
    // clientWidth ausente = prerender. Zero também não serve de divisor.
    if (!el?.clientWidth) return;
    this.escala.set(Math.min(1, el.clientWidth / px));
  });

  constructor() {
    // A moldura é um documento próprio e nunca soube do tema do site: ficava
    // branca dentro da documentação no escuro. Ver docs/tema-preview.ts.
    noNavegador(() => this.destroy.onDestroy(sincronizaTemaDosPreviews()));

    noNavegador(() => {
      const el = this.palco()?.nativeElement;
      if (!el) return;
      const obs = new ResizeObserver(() => {
        // Observa o PALCO, não a moldura. A moldura agora tem largura
        // derivada da escala; medi-la para calcular a escala fecharia o laço
        // que este comentário já alertava para a altura — a caixa encolheria
        // a cada passada até desaparecer. O palco não depende da escala.
        if (el.clientWidth) this.escala.set(Math.min(1, el.clientWidth / this.largura().px));
      });
      obs.observe(el);
      this.destroy.onDestroy(() => obs.disconnect());
    });
  }

  protected readonly dados = computed(() => telaPorId(this.projeto(), this.id()));

  protected readonly padrao = computed(() => {
    const d = this.dados();
    return d ? padraoPorId(d.tela.padrao) : undefined;
  });

  /**
   * O contrato lista `ucam-*`; nem todo item da lista tem página — o
   * `ucam-app-shell` tem, mas `ucam-toolbar` não é componente. O link só sai
   * quando o destino existe, em vez de levar a um 404.
   */
  protected readonly usa = computed(() => {
    const d = this.dados();
    return (d?.tela.usa ?? []).map((selector) => ({
      selector,
      id: componentePorId(selector.replace(/^ucam-/, ''))?.id,
    }));
  });

  /**
   * O caminho vem da spec e é montado em build; nada de entrada de usuário
   * chega aqui. Sem o bypass o Angular recusa qualquer src de iframe.
   *
   * `?embed=1` esconde a barra de contexto da página autônoma — a página em
   * volta já diz que é template do design system, e dentro da moldura a barra
   * rouba altura da viewport que os três botões de largura anunciam. A tela
   * repassa a consulta aos links irmãos, então ela sobrevive à navegação
   * DENTRO do quadro: agora que os itens do menu levam a algum lugar, clicar
   * em "Analytics" aqui abre Analytics aqui, sem a barra reaparecer.
   */
  private readonly urls = new Map<string, SafeResourceUrl>();
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
