import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { meta, recursos } from '../spec/spec';

@Component({
  selector: 'ucam-inicio',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="masthead">
      <p class="eyebrow eyebrow-marca">Universidade Candido Mendes</p>
      <h1 class="display">Design System UCAM</h1>
      <p class="lede">
        Fundamentos, componentes e padrões para as interfaces da UCAM. Cada componente traz
        API, comportamento, requisitos de acessibilidade e limites de uso.
      </p>
      <!-- Os sete números viraram uma GRADE de células, e não mais uma linha
           corrida de texto. Eram o fato mais forte da home — sete medidas do
           que já existe — e saíam a 13px, em cinza, todos com o mesmo peso do
           que os separava. Em célula, o número lê primeiro e o rótulo depois,
           que é a ordem em que a informação importa. -->
      <ul class="numeros">
        @for (n of numeros; track n.rotulo) {
          <li>
            <strong class="num">{{ n.valor }}</strong>
            <span>{{ n.rotulo }}</span>
          </li>
        }
      </ul>
    </header>

    <div class="callout">
      <p class="eyebrow">Como ler esta documentação</p>
      <p>
        Cada componente tem um contrato: API, estados, tokens, requisitos de acessibilidade e
        limites de uso. O contrato é normativo — o que não está nele não é garantido. O que já é
        instalável está em <a routerLink="/comecar/skills">Skills e pacotes</a>; a versão e o
        estado de cada contrato, em <a routerLink="/releases">Releases</a>.
      </p>
    </div>

    <section class="prose">
      <h2>Dois trilhos</h2>
      <p>
        O design system entrega por dois caminhos ao mesmo tempo. Escolha o trilho pelo que a
        aplicação consegue receber hoje: tokens em CSS no parque legado, biblioteca Angular nos
        apps novos e migrados.
      </p>
    </section>

    <div class="trilhos">
      @for (t of trilhos; track t.id) {
        <article class="card">
          <h3>{{ t.nome }}</h3>
          <p class="small muted">{{ t.alvo }}</p>
          <p>{{ t.como }}</p>
          <p class="small"><strong class="k">Limite.</strong> {{ t.limite }}</p>
        </article>
      }
    </div>

    <section class="prose">
      <h2>Por onde começar</h2>
    </section>

    <div class="grade-cartoes">
      <a class="card" routerLink="/comecar/instalacao">
        <h3>Instalação</h3>
        <p class="small muted">Como consumir os tokens hoje, nos dois trilhos.</p>
      </a>
      <a class="card" routerLink="/fundamentos/cor">
        <h3>Fundamentos</h3>
        <p class="small muted">Cor, tipografia e espaçamento, com contraste calculado no build.</p>
      </a>
      <a class="card" routerLink="/catalogo">
        <h3>Catálogo</h3>
        <p class="small muted">{{ m.componentes }} contratos de componente.</p>
      </a>
      <a class="card" routerLink="/decisoes">
        <h3>Decisões</h3>
        <p class="small muted">O porquê de cada regra, registrado em ADR.</p>
      </a>
      <a class="card" routerLink="/comecar/mcp">
        <h3>Servidor MCP</h3>
        <p class="small muted">Os contratos servidos a agentes de IA, com a API exata.</p>
      </a>
      <a class="card" routerLink="/padroes">
        <h3>Padrões</h3>
        <p class="small muted">Composições que resolvem uma tarefa inteira.</p>
      </a>
    </div>
  `,
  styles: `
    /* O filete de 2px na tinta do texto SAIU. Um traço preto de ponta a ponta
       abaixo do título é o gesto de capa de relatório: separa por peso bruto,
       e ainda por cima competia com o próprio h1 pela atenção. Quem separa
       agora é o vão — e o degrau de superfície da grade de números, que
       fecha o bloco por baixo sem precisar de régua nenhuma. */
    .masthead {
      margin-block-end: var(--ritmo-secao);
    }
    .masthead h1 {
      font-size: clamp(2.125rem, 5vw, 3rem);
      margin: 0.6rem 0 1.1rem;
    }
    /* Grade de células com filete de 1px.
       A divisória NÃO é gap sobre fundo tingido: são sete números e o auto-fit
       quase nunca fecha a linha (a 420px dá 2 colunas, então a última linha
       tem uma célula vazia). Com o truque do gap, essa célula vazia mostra o
       fundo do contêiner — e o que aparecia era um bloco cinza-azulado do
       tamanho de uma célula, medido por CDP a 420px.

       Cada célula desenha o próprio filete à direita e embaixo por box-shadow;
       os que sobram na borda externa são comidos pelo overflow:hidden do
       contêiner arredondado. Célula que não existe não desenha nada, que é
       exatamente o comportamento que faltava. */
    .numeros {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
      margin: 2rem 0 0;
      padding: 0;
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
    }
    .numeros li {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      padding: 0.8rem 0.95rem;
      box-shadow:
        1px 0 0 0 var(--ucam-color-border-subtle),
        0 1px 0 0 var(--ucam-color-border-subtle);
    }
    .numeros strong {
      font-size: 1.375rem;
      font-weight: 620;
      letter-spacing: -0.02em;
      line-height: 1.2;
      color: var(--ucam-color-text-primary);
    }
    .numeros span {
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--ucam-color-text-secondary);
    }
    .trilhos {
      display: grid;
      gap: 0.85rem;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
      margin-block-end: 2rem;
    }
    /* Os dois trilhos são cards de LEITURA, não links: recebem mais respiro
       por dentro que os do grid de navegação, porque carregam três parágrafos
       cada um e não uma frase. */
    .trilhos .card {
      padding: 1.3rem 1.4rem;
    }
    .card h3 {
      margin: 0 0 0.4rem;
      font-size: 1rem;
    }
    .card p {
      margin: 0 0 0.5rem;
    }
    .card > :last-child {
      margin-bottom: 0;
    }
  `,
})
export default class IndexPage {
  protected readonly m = meta;
  protected readonly trilhos = recursos.instalacao.trilhos;

  /** Os sete números da grade, na ordem em que respondem "o que já existe?". */
  protected readonly numeros = [
    { valor: meta.componentes, rotulo: 'componentes' },
    { valor: meta.padroes, rotulo: 'padrões' },
    { valor: meta.adrs, rotulo: 'decisões' },
    { valor: meta.evidencias, rotulo: 'problemas catalogados' },
    { valor: meta.requisitosA11y, rotulo: 'requisitos de a11y' },
    { valor: meta.criteriosWcag, rotulo: 'critérios WCAG' },
    { valor: meta.conversoesMigracao, rotulo: 'conversões de migração' },
  ];
}
