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
          <a class="pasta" [routerLink]="'/telas/' + p.id">
            <span class="aba" aria-hidden="true"></span>
            <span class="cabeca">
              <span class="ucam-icon-tile" aria-hidden="true">
                <svg class="ic"><use [attr.href]="'#i-' + p.icone" /></svg>
              </span>
              <span class="titulo">
                <strong>{{ p.nome }}</strong>
                <span class="conta">{{ p.templates.length }} {{ p.templates.length === 1 ? 'tela' : 'telas' }}</span>
              </span>
            </span>
            <span class="descricao small muted"><ucam-t [t]="p.descricao" /></span>
            <span class="conteudo small" role="list" aria-label="Telas">
              @for (t of amostra(p.templates); track t.id) {
                <span role="listitem">{{ t.nome }}</span>
              }
              @if (p.templates.length > amostra(p.templates).length) {
                <span role="listitem" class="mais">e mais {{ p.templates.length - amostra(p.templates).length }}</span>
              }
            </span>
            <span class="stack small"><span class="rotulo">Hoje</span>{{ p.stack_atual }}</span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .pastas {
      display: grid;
      gap: 2rem 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
      margin: 0;
      /* Espaço para a aba, que sai acima da borda da primeira fileira. */
      padding: 0.75rem 0 0;
      list-style: none;
    }
    .pastas > li {
      display: flex;
    }

    /* A PASTA: card do site com uma aba no canto de cima. A aba é a única
       coisa que diz "isto abre e tem coisa dentro" sem ícone de pasta ao lado
       do ícone do sistema. Sem fundo cinza (o card do site é branco), e a aba
       pinta o mesmo fundo do corpo, com a mesma borda, para ler como uma peça
       só. */
    .pasta {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.1rem 1.15rem 1rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: 0 var(--r-superficie) var(--r-superficie) var(--r-superficie);
      background: var(--ucam-color-surface-default);
      color: inherit;
      text-decoration: none;
    }
    .aba {
      position: absolute;
      inset-block-end: 100%;
      inset-inline-start: -1px;
      inline-size: 6.5rem;
      block-size: 0.7rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-block-end: 0;
      border-start-start-radius: var(--ucam-radius-sm);
      border-start-end-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-default);
    }
    /* Cobre o filete da borda de cima do corpo sob a aba, para a aba e o
       corpo serem um contorno só. */
    .aba::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: -1px;
      block-size: 1px;
      background: var(--ucam-color-surface-default);
    }
    .pasta:hover,
    .pasta:hover .aba {
      border-color: var(--borda-marca);
    }
    .pasta:hover {
      box-shadow: var(--sombra-hover);
    }
    .pasta:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }

    .cabeca {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .titulo {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }
    .titulo strong {
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .conta {
      font-family: var(--f-mono);
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
    }

    /* O que tem dentro: as primeiras telas, uma por linha, com o fio de
       separação do conteúdo da pasta. */
    .conteudo {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-block-start: auto;
      padding-block-start: 0.75rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    .conteudo > span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .mais {
      color: var(--ucam-color-text-secondary);
    }

    .stack {
      color: var(--ucam-color-text-secondary);
    }
    .rotulo {
      font-family: var(--f-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.05rem 0.35rem;
      margin-inline-end: 0.4rem;
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-subtle);
    }

    @media (prefers-reduced-motion: no-preference) {
      .pasta,
      .aba {
        transition:
          border-color var(--transicao),
          box-shadow var(--transicao),
          transform var(--transicao);
      }
      .pasta:hover {
        transform: translateY(-2px);
      }
      .pasta:active {
        transform: translateY(0);
        box-shadow: none;
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
