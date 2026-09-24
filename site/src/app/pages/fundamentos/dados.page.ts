import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Visualização de dados.
 *
 * O contrato do Chart já respondia "qual forma para qual pergunta" — dentro do
 * próprio componente. O que faltava era a camada ACIMA dele: qual componente
 * responde a pergunta, antes de existir gráfico nenhum. Sem ela, "quanto de um
 * limite foi consumido" vira uma pizza de duas fatias, que é a forma mais cara
 * de escrever uma porcentagem.
 *
 * Por isso a primeira seção não é sobre gráfico. As formas e os limites vêm
 * LIDOS do contrato do Chart, e a paleta vem lida dos tokens: quando o portão
 * de daltonismo mudar o teto da pizza, esta página muda junto.
 */
@Component({
  selector: 'ucam-dados',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Visualização de dados'"
      [lede]="d.lede"
      [porque]="d.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <div class="callout">
        <p><strong>{{ d.meta['regra'] }}</strong></p>
      </div>

      <section id="veiculos">
        <h2>A pergunta escolhe o componente</h2>
        <p>{{ d.meta['origem'] }}</p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">A pergunta</th>
                <th scope="col">O componente</th>
                <th scope="col">A forma</th>
                <th scope="col">Não use</th>
              </tr>
            </thead>
            <tbody>
              @for (v of d.veiculos; track v.pergunta) {
                <tr>
                  <td>{{ v.pergunta }}</td>
                  <td>
                    <a [routerLink]="['/catalogo', v.componente]">{{ v.componenteNome }}</a>
                  </td>
                  <td class="small">{{ v.forma }}</td>
                  <td class="small muted">
                    {{ v.evite }}
                    <span class="porque">{{ v.porque }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="formas">
        <h2>Quando é gráfico, qual forma</h2>
        <p class="small muted">
          Lido do contrato do <a routerLink="/catalogo/chart">Chart</a> — não recopiado aqui.
        </p>
        <dl class="formas">
          @for (f of d.formas; track f.id) {
            <div class="forma">
              <dt><code>{{ f.id }}</code></dt>
              <dd>
                <p>{{ f.uso }}</p>
                <p class="small muted"><strong>Limite:</strong> {{ f.limite }}</p>
              </dd>
            </div>
          }
        </dl>
      </section>

      <!-- A descrição do token NÃO é impressa aqui, embora esteja no dado.
           Ela é o parágrafo do qual as quatro regras abaixo foram destacadas,
           e imprimir os dois deixava a mesma frase duas vezes na mesma tela —
           "a ordem não é estética" aparecia no corpo e no item da lista. Quem
           quer o parágrafo inteiro abre o token. -->
      <section id="paleta">
        <h2>A paleta de série</h2>
        <p>{{ d.paleta.regra }}</p>

        <div class="temas">
          <div>
            <p class="small muted rotulo-tema">Tema claro</p>
            <ol class="slots">
              @for (s of d.paleta.slots; track s.token) {
                <li class="slot" [style.background]="s.hex" [style.color]="s.tinta">
                  <span class="slot-nome">{{ s.nome }}</span>
                  <span class="slot-hex">{{ s.hex }}</span>
                </li>
              }
            </ol>
          </div>
          <div>
            <p class="small muted rotulo-tema">Tema escuro</p>
            <ol class="slots">
              @for (s of d.paleta.slotsEscuro; track s.token) {
                <li class="slot" [style.background]="s.hex" [style.color]="s.tinta">
                  <span class="slot-nome">{{ s.nome }}</span>
                  <span class="slot-hex">{{ s.hex }}</span>
                </li>
              }
            </ol>
          </div>
        </div>

        <ul class="list">
          <li>{{ d.paleta.ordem }}</li>
          <li>{{ d.paleta.identidade }}</li>
          <li>{{ d.paleta.fronteira }}</li>
        </ul>

        <!-- O limite fica ABERTO, não em nota de rodapé. Uma fundação que
             promete separabilidade e não diz onde ela acaba ensina a confiar
             na cor exatamente no ponto em que ela para de funcionar. -->
        <div class="callout callout-warn">
          <p><strong>Onde a paleta acaba.</strong> {{ d.paleta.limite_honesto }}</p>
        </div>
      </section>

      <section id="integridade">
        <h2>Integridade do desenho</h2>
        <div class="regras">
          @for (r of d.integridade; track r.id) {
            <div class="regra">
              <h3>{{ r.regra }}</h3>
              <p class="small muted">{{ r.porque }}</p>
            </div>
          }
        </div>
      </section>

      <section id="equivalente">
        <h2>A tabela equivalente</h2>
        <div class="callout">
          <p><strong>{{ d.equivalente.regra }}</strong></p>
        </div>
        <p>{{ d.equivalente.porque }}</p>
        <p class="small muted">{{ d.equivalente.forma }}</p>
      </section>

      <section id="limites">
        <h2>Limites</h2>
        <p class="small muted">
          Do contrato do Chart. {{ d.limites.motivo }}
        </p>
        <ul class="list">
          @for (r of d.limites.regras; track r) {
            <li>{{ r }}</li>
          }
        </ul>
      </section>

      <section id="portao">
        <h2>O portão de daltonismo</h2>
        <p>{{ d.portao.o_que_faz }}</p>
        <div class="scroller">
          <table>
            <tbody>
              <tr>
                <th scope="row">Ferramenta</th>
                <td><code>{{ d.portao.ferramenta }}</code></td>
              </tr>
              <tr>
                <th scope="row">Limiar</th>
                <td>{{ d.portao.limiar }}</td>
              </tr>
              <tr>
                <th scope="row">Quando roda</th>
                <td>{{ d.portao.quando_roda }}</td>
              </tr>
              <tr>
                <th scope="row">Decisão</th>
                <td>
                  <a [routerLink]="['/decisoes', adrSlug(d.portao.adr)]">{{ d.portao.adr }}</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="small muted">{{ d.portao.historia }}</p>
      </section>

      <section id="proibido">
        <h2>Proibido</h2>
        <ul class="list">
          @for (p of d.proibido; track p) {
            <li>{{ p }}</li>
          }
        </ul>
        <p class="small muted">{{ d.meta['escopo'] }}</p>
      </section>
    </div>
  `,
  styles: `
    .porque {
      display: block;
      margin-block-start: 0.2rem;
      font-size: 0.75rem;
    }

    .formas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0 1.5rem;
    }
    .forma {
      padding: 0.8rem 0.9rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .forma dt {
      margin-block-end: 0.35rem;
    }
    .forma dd {
      margin: 0;
    }
    .forma p {
      margin: 0 0 0.35rem;
    }
    .forma p:last-child {
      margin: 0;
    }

    .temas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
      gap: 1rem;
      margin: 1rem 0 1.25rem;
    }
    .rotulo-tema {
      margin: 0 0 0.4rem;
    }
    .slots {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* Empilhados e ENCOSTADOS, não em cartõezinhos separados: a pergunta que a
       amostra tem de responder é se o slot 3 se separa do 4, e dois retângulos
       com um vão branco entre eles se separam mesmo quando as cores não. */
    .slot {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.45rem 0.6rem;
      font-family: var(--f-mono);
      font-size: 0.6875rem;
    }
    .slot:first-child {
      border-start-start-radius: var(--ucam-radius-sm);
      border-start-end-radius: var(--ucam-radius-sm);
    }
    .slot:last-child {
      border-end-start-radius: var(--ucam-radius-sm);
      border-end-end-radius: var(--ucam-radius-sm);
    }
    .slot-hex {
      opacity: 0.85;
    }

    .regras {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0 1.5rem;
    }
    .regra {
      padding: 0.8rem 0.9rem;
      border-inline-start: 2px solid var(--ucam-color-border-strong);
    }
    .regra h3 {
      margin: 0 0 0.3rem;
      font-size: 0.875rem;
    }
    .regra p {
      margin: 0;
    }

    th[scope='row'] {
      inline-size: 9rem;
      text-align: start;
      font-weight: 500;
    }
  `,
})
export default class DadosPage {
  protected readonly d = fundamentos.dados;

  protected adrSlug(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  protected readonly secoes: readonly Ancora[] = [
    { id: 'veiculos', rotulo: 'A pergunta escolhe o componente' },
    { id: 'formas', rotulo: 'Qual forma de gráfico' },
    { id: 'paleta', rotulo: 'A paleta de série' },
    { id: 'integridade', rotulo: 'Integridade do desenho' },
    { id: 'equivalente', rotulo: 'A tabela equivalente' },
    { id: 'limites', rotulo: 'Limites' },
    { id: 'portao', rotulo: 'O portão de daltonismo' },
    { id: 'proibido', rotulo: 'Proibido' },
  ];
}
