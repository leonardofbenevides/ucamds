import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { recursos } from '../../spec/spec';

/**
 * A porta de entrada: título e uma grade de caminhos em cartões.
 *
 * Por que esta página NÃO usa <ucam-page-header> como todas as outras: o
 * cabeçalho padrão é para página de DOCUMENTAÇÃO — filete embaixo, prosa em
 * seguida. Aqui não há prosa a introduzir, há uma bifurcação a apresentar, e o
 * filete separaria o título de exatamente aquilo que ele anuncia.
 */
@Component({
  selector: 'ucam-comecar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hero">
      <p class="eyebrow eyebrow-marca">Começar</p>
      <h1 class="display">Começar</h1>
      <p class="lede">{{ r.instalacao.$description }}</p>
    </header>

    <section class="secao">
      <h2 class="secao-titulo">Por onde começar</h2>
      <div class="grid grid-caminhos">
        <a class="card" routerLink="/comecar/instalacao">
          <span class="card-ic" aria-hidden="true"><svg><use href="#i-download" /></svg></span>
          <h3>Instalação</h3>
          <p class="small muted">
            Como consumir os tokens hoje, nos dois trilhos — legado e apps novos.
          </p>
        </a>
        <a class="card" routerLink="/comecar/migrar">
          <span class="card-ic" aria-hidden="true"><svg><use href="#i-refreshCw" /></svg></span>
          <h3>Migrar uma tela</h3>
          <p class="small muted">
            O caminho de uma tela legada até o contrato novo, passo a passo.
          </p>
        </a>
        <a class="card" routerLink="/comecar/mcp">
          <span class="card-ic" aria-hidden="true"><svg><use href="#i-messageSquare" /></svg></span>
          <h3>Conectar MCP</h3>
          <p class="small muted">
            {{ r.mcp.ferramentas.length }} ferramentas que servem os contratos a agentes de IA.
          </p>
        </a>
        <a class="card" routerLink="/comecar/skills">
          <span class="card-ic" aria-hidden="true"><svg><use href="#i-archive" /></svg></span>
          <h3>Skills e pacotes</h3>
          <p class="small muted">
            {{ r.skills.itens.length }} skills e {{ r.pacotes.itens.length }} pacotes previstos.
          </p>
        </a>
      </div>
    </section>

    <!-- "O sistema por dentro" — Decisões e Versão e estado — SAIU daqui em
         11/09/2026. As duas são abas da área Projeto, e uma página de Docs
         que as oferece em cartões do mesmo peso que Instalação desfaz a
         faixa de cima: a área diz "Começar · Fundamentos" e o corpo diz outra
         coisa. Cada página mostra só a própria área; a ponte entre áreas é o
         primeiro andar do cabeçalho, e o mapa inteiro é o rodapé. -->

    <div class="prose">
      <h2>O que já é instalável</h2>
      <p>
        Só os tokens estão gerados e prontos para consumo. Os demais pacotes estão planejados e
        não têm versão instalável — a tabela em
        <a routerLink="/comecar/skills">Skills e pacotes</a> diz o estado de cada um. Enquanto um
        pacote não estiver marcado como gerado, o contrato correspondente vale como especificação,
        não como dependência.
      </p>
    </div>
  `,
  styles: `
    .hero {
      margin-block-end: 3rem;
    }

    /* Sem filete embaixo, ao contrário do <ucam-page-header>: ver o comentário
       da classe. O h1 e a lede herdam .display e .lede do styles.css — esta
       página não redefine tipografia, só o espaçamento entre as peças. */
    .hero h1 {
      font-size: clamp(1.875rem, 3.4vw, 2.375rem);
      margin-block: 0.6rem 1rem;
    }
    .hero .lede {
      margin: 0;
    }

    /* ----------------------------------------------------------- as seções */
    .secao + .secao {
      margin-block-start: 2.75rem;
    }
    /* Rótulo de grupo, não degrau de prosa: por isso o corpo pequeno e a
       caixa alta, e não o h2 da .prose, que abre 2,5rem acima de si. */
    .secao-titulo {
      margin: 0 0 0.9rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }

    /* A grade global é auto-fill com mínimo de 16rem — numa tela larga isso
       daria cinco ou seis colunas e os quatro caminhos ficariam apertados numa
       fileira com sobra. Aqui o teto é quatro, e o mínimo sobe para 15rem para
       a quebra em duas colunas acontecer antes de o texto do card espremer. */
    .grid-caminhos {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      max-inline-size: 78rem;
    }
    /* O ícone é a única coisa do card na tinta da marca — a mesma regra do
       lockup do cabeçalho. No hover ele acompanha a borda.

       A variante de fileira secundária (.card-largo, com .grid-dupla) saiu em
       12/09/2026 junto com o último uso dela: a seção "O sistema por dentro",
       removida um dia antes. */
    .card-ic {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      margin-block-end: 0.85rem;
      border-radius: var(--r-controle);
      background: var(--ucam-color-action-primary-subtle);
      color: var(--ucam-color-action-primary-default);
    }
    .card-ic svg {
      inline-size: 1.0625rem;
      block-size: 1.0625rem;
      display: block;
    }

    .prose {
      margin-block-start: 3rem;
    }
  `,
})
export default class ComecarPage {
  protected readonly r = recursos;
}
