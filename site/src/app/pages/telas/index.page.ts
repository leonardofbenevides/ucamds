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
 * ela mostra é o que decide qual abrir: na frente o nome, a descrição e a contagem; na
 * folha que sai de dentro, as primeiras telas.
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
              @for (t of amostra(p.templates); track t.id) {
                <span class="folha__linha">{{ t.nome }}</span>
              }
            </span>
            <!-- 17/11, terceira volta ("pastinha nesse estilo", referência do
                 Leonardo): a pasta deixou a cor e virou papelaria neutra:
                 costas cinza-claras com aba, folha branca, frente branca e,
                 no canto de baixo à direita, um traço curto com a contagem
                 embaixo. A cor do sistema só aparece no traço, no hover. -->
            <span class="frente">
              <span class="frente__cabeca">
                <strong class="frente__titulo">{{ p.nome }}</strong>
                <svg class="ic frente__icone" aria-hidden="true"><use [attr.href]="'#i-' + p.icone" /></svg>
              </span>
              <span class="frente__descricao"><ucam-t [t]="p.descricao" /></span>
              <span class="frente__marca">
                <span class="frente__traco" aria-hidden="true"></span>
                <span class="frente__conta"><span class="sr-only">, </span>{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
              </span>
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
      /* A PASTA NEUTRA (terceira volta): papelaria, não cartaz. As costas
         são o cinza mais claro que ainda se separa do chão (a tinta do texto
         misturada ao papel), nos dois temas; frente e folha são o papel do
         tema. A cor do sistema fica reservada ao traço, e só no hover. */
      --fundo: color-mix(in oklab, var(--ucam-color-text-primary) 9%, var(--ucam-color-surface-default));
      --papel: var(--ucam-color-surface-default);
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      /* O espaço de cima é o da aba e das duas linhas da folha que aparecem. */
      padding-block-start: 5.1rem;
      color: inherit;
      text-decoration: none;
      border-radius: 1.25rem;
      perspective: 900px;
    }
    .pasta:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 6px;
    }

    /* AS COSTAS: a placa de trás, com a aba no canto. */
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

    /* A FOLHA: papel com as primeiras telas do sistema. Em repouso as duas
       primeiras aparecem acima da frente; no hover ela sobe e mostra o resto. */
    .folha {
      position: absolute;
      inset: 2rem 0.85rem auto;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      block-size: 8rem;
      padding: 0.6rem 0.8rem;
      border-radius: 0.75rem;
      background: var(--papel);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
      overflow: hidden;
    }
    .folha__linha {
      min-inline-size: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /* A FRENTE: papel do tema, uma sombra curta para cima que a descola da
       folha, título em Newsreader e a descrição. */
    .frente {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.5rem;
      min-block-size: 8rem;
      padding: 1rem 1.1rem 1rem;
      border-radius: 1.25rem;
      background: var(--papel);
      box-shadow:
        0 -1px 0 rgb(0 0 0 / 0.04),
        0 -3px 10px -4px rgb(0 0 0 / 0.14);
      color: var(--ucam-color-text-primary);
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
      color: var(--ucam-color-text-secondary);
    }
    .frente__descricao {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.8125rem;
      line-height: 1.45;
      color: var(--ucam-color-text-secondary);
    }
    /* O TRAÇO no canto de baixo à direita, com a contagem embaixo: a
       etiqueta da pasta. */
    .frente__marca {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
      margin-block-start: auto;
      padding-block-start: 0.5rem;
    }
    .frente__traco {
      inline-size: 2.25rem;
      block-size: 3px;
      border-radius: 2px;
      background: var(--ucam-color-text-primary);
    }
    .frente__conta {
      font-family: var(--f-mono);
      font-size: 0.6875rem;
      line-height: 1;
      color: var(--ucam-color-text-secondary);
    }

    @media (prefers-reduced-motion: no-preference) {
      .folha,
      .frente,
      .frente__traco {
        transition:
          transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
          box-shadow 260ms ease,
          background-color 260ms ease;
      }
      .pasta:is(:hover, :focus-visible) .folha {
        transform: translateY(-1.5rem);
      }
      .pasta:is(:hover, :focus-visible) .frente {
        transform: rotateX(-10deg) scaleX(0.985);
        box-shadow:
          0 -1px 0 rgb(0 0 0 / 0.04),
          0 16px 28px -14px rgb(0 0 0 / 0.28);
      }
    }
    .pasta:is(:hover, :focus-visible) .frente__traco {
      background: var(--cor);
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
