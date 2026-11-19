import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { telas, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

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
 * O cartão não carrega miniatura nem texto corrido: sem iframe aqui, a página
 * abre leve, e o que ele mostra é só o que decide qual abrir: o nome do
 * sistema e quantas telas há. A descrição mora em /telas/<projeto>.
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

    <ul class="pastas" role="list">
      @for (p of lista; track p.id) {
        <li>
          <!-- 19/11/2026 ("isso n está legal, mude essas pastas, faça só um card
               msm"): a pasta desenhada saiu. Um cartão plano: ícone do sistema,
               nome, quantas telas e a seta de destino. -->
          <a class="cartao" [routerLink]="'/telas/' + p.id">
            <svg class="ic cartao__icone" aria-hidden="true"><use [attr.href]="'#i-' + p.icone" /></svg>
            <span class="cartao__texto">
              <strong class="cartao__nome">{{ p.nome }}</strong>
              <span class="cartao__conta">{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
            </span>
            <svg class="ic cartao__seta" aria-hidden="true"><use href="#i-chevronRight" /></svg>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .pastas {
      display: grid;
      gap: var(--ucam-space-stack-md);
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pastas > li {
      display: flex;
    }

    /* O CARTÃO PLANO (ADR-019): filete, sem sombra, sem fundo cinza. O nome em
       text.primary e a contagem um degrau abaixo, em text.secondary; a seta
       diz em repouso que o cartão leva a algum lugar. */
    .cartao {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--ucam-space-inline-md, 0.75rem);
      padding: 1rem 1.125rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-lg, 0.75rem);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      text-decoration: none;
    }
    .cartao:hover {
      border-color: var(--ucam-color-border-strong);
    }
    .cartao:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 2px;
    }
    .cartao__icone {
      flex: none;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      color: var(--ucam-color-text-secondary);
    }
    .cartao__texto {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.125rem;
      min-inline-size: 0;
    }
    .cartao__nome {
      font-weight: 600;
      line-height: 1.3;
    }
    .cartao__conta {
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .cartao__seta {
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      color: var(--ucam-color-text-secondary);
    }
    .cartao:hover .cartao__seta {
      color: var(--ucam-color-text-primary);
    }
    @media (prefers-reduced-motion: no-preference) {
      .cartao,
      .cartao__seta {
        transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;
      }
      .cartao:hover .cartao__seta {
        transform: translateX(2px);
      }
    }
  `,
})
export default class TelasPage {
  protected readonly lista = telas;
  protected readonly total = meta.telas;
  protected readonly projetos = meta.projetos;
}
