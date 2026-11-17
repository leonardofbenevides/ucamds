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
 * ela mostra é o que decide qual abrir: nome, quantas telas, o stack de hoje
 * e o nome das primeiras telas.
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
          <a class="pasta" [routerLink]="'/telas/' + p.id" [style.--cor]="'var(--ucam-color-categoria-' + p.categoria + ')'">
            <span class="desenho">
              <span class="costas" aria-hidden="true"><span class="aba"></span></span>
              <span class="folha" aria-hidden="true">
                <span class="folha__topo">
                  <span class="folha__linha">{{ p.templates[0].nome }}</span>
                  <span class="folha__selo">{{ p.templates.length }}</span>
                </span>
                @for (t of amostra(p.templates).slice(1); track t.id) {
                  <span class="folha__linha">{{ t.nome }}</span>
                }
              </span>
              <span class="frente">
                <span class="frente__titulo">
                  <strong>{{ p.nome }}</strong>
                  <span class="conta">{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
                </span>
                <svg class="ic frente__icone" aria-hidden="true"><use [attr.href]="'#i-' + p.icone" /></svg>
              </span>
            </span>
            <span class="descricao small muted"><ucam-t [t]="p.descricao" /></span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .pastas {
      display: grid;
      gap: 2.5rem 1.75rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.5rem), 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pastas > li {
      display: flex;
    }

    .pasta {
      /* --cor vem da categoria do sistema (color.categoria.*). O topo da frente
         é a cor escurecida 20%, onde mora o texto branco: com a cor pura o
         ocre do acervo dava 3,6:1; assim todas passam de 4,5:1. */
      --topo: color-mix(in srgb, var(--cor) 80%, black);
      --base: color-mix(in srgb, var(--cor) 62%, black);
      --fundo: color-mix(in srgb, var(--cor) 55%, black);
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.85rem;
      color: inherit;
      text-decoration: none;
      border-radius: 1.25rem;
    }
    .pasta:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 6px;
    }

    .desenho {
      position: relative;
      display: block;
      aspect-ratio: 5 / 4;
      perspective: 900px;
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

    /* A FOLHA dentro da pasta: papel do tema, com as primeiras telas. Em
       repouso só a beirada aparece; no hover ela sobe. */
    .folha {
      position: absolute;
      inset: 2.1rem 0.85rem auto;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      block-size: 60%;
      padding: 0.6rem 0.8rem;
      border-radius: 0.8rem;
      background: var(--ucam-color-surface-default);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
      font-family: var(--f-mono);
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
      overflow: hidden;
    }
    .folha__topo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      color: var(--ucam-color-text-primary);
    }
    .folha__selo {
      padding: 0.05rem 0.35rem;
      border-radius: var(--ucam-radius-sm);
      background: color-mix(in srgb, var(--cor) 14%, transparent);
      color: var(--ucam-color-text-primary);
    }
    .folha__linha {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /* A FRENTE: degradê da cor, brilho fino na borda de cima, nome e ícone. */
    .frente {
      position: absolute;
      inset: 2.6rem 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem 1.1rem;
      border-radius: 1.25rem;
      background: linear-gradient(to bottom, var(--topo), var(--base));
      box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 0.28),
        0 1px 2px rgb(0 0 0 / 0.08);
      color: #fff;
      transform-origin: bottom center;
    }
    .frente__titulo {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-inline-size: 0;
    }
    .frente__titulo strong {
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .conta {
      font-family: var(--f-mono);
      font-size: 0.75rem;
      opacity: 0.9;
    }
    .frente__icone {
      flex: none;
      inline-size: 1.25rem;
      block-size: 1.25rem;
    }

    .descricao {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      padding-inline: 0.25rem;
    }

    @media (prefers-reduced-motion: no-preference) {
      .folha,
      .frente {
        transition:
          transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
          box-shadow 260ms ease;
      }
      .pasta:is(:hover, :focus-visible) .folha {
        transform: translateY(-1.6rem);
      }
      .pasta:is(:hover, :focus-visible) .frente {
        transform: rotateX(-14deg) scaleX(0.985);
        box-shadow:
          inset 0 1px 0 rgb(255 255 255 / 0.28),
          0 14px 28px -10px color-mix(in srgb, var(--cor) 55%, transparent);
      }
    }
    /* Sem movimento, a folha já aparece um pouco: o conteúdo continua dito. */
    @media (prefers-reduced-motion: reduce) {
      .folha {
        transform: translateY(-1rem);
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
