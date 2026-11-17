import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { telas, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { TextoComponent } from '../../docs/texto.component';

/**
 * Telas inteiras, uma pasta por sistema.
 *
 * Esta página despejava os sistemas todos numa rolagem só: cada um com a
 * grade de miniaturas e o mapa de fluxo, dezenas de iframes em fila, e quem
 * procurava o Diploma rolava por Protocolo, SigFin e Isenção até achar. Os
 * arquivos já moram em pastas (docs/t/<projeto>/<tela>.html); a página
 * passou a ter a mesma forma. Cada pasta abre /telas/<projeto>, onde ficam as
 * miniaturas e o mapa de fluxo do sistema.
 *
 * A pasta não carrega miniatura: sem iframe aqui, a página abre leve. O que
 * ela mostra é o que decide qual abrir: na frente o nome e a descrição; na
 * folha que sai de dentro, as primeiras telas e quantas são.
 */
const AMOSTRA = 4;

@Component({
  selector: 'ucam-telas',
  imports: [TextoComponent, RouterLink, PageHeaderComponent],
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

    <ul class="pastas" role="list">
      @for (p of lista; track p.id) {
        <li>
          <!-- A PASTA (17/11/2026, referência do Leonardo): fundo com aba, uma
               folha de papel dentro e a frente em degradê na cor da categoria
               do sistema. No hover a folha sobe e a frente inclina — o gesto
               de abrir a pasta. O nome do link é o da frente; a folha repete
               o que a descrição já diz e fica fora da árvore de acessibilidade. -->
          <!-- 17/11, segunda volta ("melhore a cara dessas pastas"): a folha
               aparece em repouso, com as primeiras telas e a contagem, e a
               descrição entrou na frente, que antes ficava três quartos vazia
               enquanto a frase saía cortada embaixo da pasta. Título em
               Newsreader (ADR-087). -->
          <a class="pasta" [routerLink]="'/telas/' + p.id" [style.--cor]="'var(--ucam-color-categoria-' + p.categoria + ')'">
            <span class="costas" aria-hidden="true"><span class="aba"></span></span>
            <span class="folha" aria-hidden="true">
              <span class="folha__topo">
                <span class="folha__linha">{{ p.templates[0].nome }}</span>
                <span class="folha__conta">{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
              </span>
              @for (t of amostra(p.templates).slice(1); track t.id) {
                <span class="folha__linha">{{ t.nome }}</span>
              }
            </span>
            <span class="frente">
              <span class="frente__cabeca">
                <strong class="frente__titulo">{{ p.nome }}</strong>
                <svg class="ic frente__icone" aria-hidden="true"><use [attr.href]="'#i-' + p.icone" /></svg>
              </span>
              <span class="frente__descricao"><ucam-t [t]="p.descricao" /></span>
              <span class="sr-only">, {{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
            </span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .pastas {
      display: grid;
      gap: 2rem 1.75rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.5rem), 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pastas > li {
      display: flex;
    }

    .pasta {
      /* A COR DA PASTA tem luminosidade FIXA, a mesma nos dois temas: só o
         matiz e o croma vêm da categoria (color.categoria.*). Antes ela era a
         cor misturada com preto em sRGB: no escuro, onde as categorias são
         mais claras, o branco caía de contraste (Relatórios, Turmas), e o
         ocre do acervo virava oliva. Em OKLCH com L fixo, o texto branco fica
         acima de 7:1 sobre o topo em qualquer sistema e o ocre segue ocre. */
      --topo: oklch(from var(--cor) 0.47 min(c, 0.15) h);
      --base: oklch(from var(--cor) 0.4 min(c, 0.14) h);
      /* A placa de trás puxa para a tinta do texto: escurece no claro e
         clareia no escuro, onde uma placa escura sumia contra o chão. */
      --fundo: color-mix(in oklab, oklch(from var(--cor) 0.37 min(c, 0.11) h) 82%, var(--ucam-color-text-primary));
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      /* O espaço de cima é o da aba e das DUAS linhas inteiras da folha que
         aparecem; com menos, a segunda saía cortada ao meio pela frente. */
      padding-block-start: 5.25rem;
      color: inherit;
      text-decoration: none;
      border-radius: 1.25rem;
      perspective: 900px;
    }
    .pasta:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 6px;
    }

    /* O FUNDO DA PASTA: a placa de trás, com a aba no canto. */
    .costas {
      position: absolute;
      inset: 1.1rem 0 0;
      border-radius: 1.25rem;
      background: var(--fundo);
    }
    .aba {
      position: absolute;
      inset-block-end: calc(100% - 1px);
      inset-inline-start: 0;
      inline-size: 38%;
      block-size: 1.35rem;
      border-start-start-radius: 0.9rem;
      background: var(--fundo);
    }
    /* A rampa da aba: um paralelogramo que desce até a placa. */
    .aba::after {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: calc(100% - 0.75rem);
      inline-size: 2rem;
      border-start-end-radius: 0.6rem;
      background: var(--fundo);
      transform: skewX(38deg);
      transform-origin: bottom left;
    }

    /* A FOLHA dentro da pasta: papel do tema com o índice do sistema. Em
       repouso, as duas primeiras linhas aparecem acima da frente: a primeira
       tela e quantas são. No hover ela sobe e mostra o resto. */
    .folha {
      position: absolute;
      inset: 2rem 0.85rem auto;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      block-size: 8rem;
      padding: 0.55rem 0.8rem;
      border-radius: 0.75rem;
      background: var(--ucam-color-surface-default);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
      overflow: hidden;
    }
    .folha__topo {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      color: var(--ucam-color-text-primary);
    }
    .folha__conta {
      flex: none;
      font-family: var(--f-mono);
      font-size: 0.6875rem;
      color: var(--ucam-color-text-secondary);
    }
    .folha__linha {
      min-inline-size: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /* A FRENTE: degradê da cor, brilho fino na borda de cima, título em
       Newsreader e a descrição, que é o que decide qual pasta abrir. */
    .frente {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.5rem;
      min-block-size: 8.5rem;
      padding: 1rem 1.1rem 1.15rem;
      border-radius: 1.25rem;
      background: linear-gradient(to bottom, var(--topo), var(--base));
      box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 0.22),
        0 1px 2px rgb(0 0 0 / 0.1);
      color: #fff;
      transform-origin: bottom center;
    }
    .frente__cabeca {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .frente__titulo {
      min-inline-size: 0;
      font-family: var(--ucam-font-display);
      font-size: 1.375rem;
      font-weight: 500;
      line-height: 1.15;
      letter-spacing: -0.005em;
      text-wrap: balance;
    }
    .frente__icone {
      flex: none;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      margin-block-start: 0.2rem;
      opacity: 0.85;
    }
    .frente__descricao {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-block-start: auto;
      font-size: 0.8125rem;
      line-height: 1.45;
      color: rgb(255 255 255 / 0.86);
    }

    @media (prefers-reduced-motion: no-preference) {
      .folha,
      .frente {
        transition:
          transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
          box-shadow 260ms ease;
      }
      .pasta:is(:hover, :focus-visible) .folha {
        transform: translateY(-1.5rem);
      }
      .pasta:is(:hover, :focus-visible) .frente {
        transform: rotateX(-10deg) scaleX(0.985);
        box-shadow:
          inset 0 1px 0 rgb(255 255 255 / 0.22),
          0 16px 28px -12px oklch(from var(--cor) 0.35 c h / 0.6);
      }
    }
  `,
})
export default class TelasPage {
  protected readonly lista = telas;
  protected readonly total = meta.telas;
  protected readonly projetos = meta.projetos;

  /** Quatro nomes inteiros, ou três e "e mais N": nunca quatro e "e mais 1". */
  protected amostra<T>(ts: readonly T[]): readonly T[] {
    return ts.length > AMOSTRA ? ts.slice(0, AMOSTRA - 1) : ts;
  }
}
