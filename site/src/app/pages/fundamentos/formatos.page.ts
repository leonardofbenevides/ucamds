import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Formatos.
 *
 * A fundação nasceu de uma constatação simples: seis contratos e quatro
 * arquivos da biblioteca decidiam, cada um por conta própria, como uma data
 * vira texto. O resultado está medido no SIGFIN — o mesmo tipo de dado com
 * duas aparências dentro do mesmo sistema, uma com calendário e dica, outra
 * como caixa de texto seca.
 *
 * A página existe para tornar a decisão de formato inescapável e única, e para
 * marcar a fronteira que quase todo sistema administrativo perde: o que
 * trafega é ISO, o que se lê é pt-BR, e a conversão acontece na borda.
 */
@Component({
  selector: 'ucam-formatos',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Formatos'"
      [lede]="f.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <div class="callout">
        <p><strong>{{ f.meta['regra'] }}</strong></p>
      </div>

      <section id="fronteira">
        <h2>Duas formas do mesmo dado</h2>
        <div class="fronteira">
          <div class="lado">
            <h3>No modelo</h3>
            <p class="small">{{ f.fronteira.modelo }}</p>
          </div>
          <div class="lado">
            <h3>Na tela</h3>
            <p class="small">{{ f.fronteira.tela }}</p>
          </div>
        </div>
        <p>{{ f.fronteira.regra }}</p>
        <p class="small muted">{{ f.meta['escopo'] }}</p>
      </section>

      <section id="tabela">
        <h2>Os {{ f.formatos.length }} formatos</h2>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Dado</th>
                <th scope="col">Na tela</th>
                <th scope="col">No modelo</th>
                <th scope="col">Onde aparece</th>
              </tr>
            </thead>
            <tbody>
              @for (x of f.formatos; track x.id) {
                <tr [id]="x.id">
                  <td>
                    <strong>{{ x.nome }}</strong>
                    <span class="small muted forma">{{ x.forma }}</span>
                  </td>
                  <td><code class="num">{{ x.exemplo }}</code></td>
                  <td><code class="num muted">{{ x.modelo }}</code></td>
                  <td class="small">{{ x.onde }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="regras-de-cada">
        <h2>A regra de cada um</h2>
        <dl class="detalhes">
          @for (x of f.formatos; track x.id) {
            <div class="detalhe">
              <dt>
                {{ x.nome }}
                <code class="num">{{ x.exemplo }}</code>
              </dt>
              <dd class="small">{{ x.regra }}</dd>
            </div>
          }
        </dl>
      </section>

      <section id="regras">
        <h2>Regras que valem para todos</h2>
        <div class="gerais">
          @for (r of f.regras; track r.id) {
            <div class="geral">
              <h3>{{ r.regra }}</h3>
              <p class="small muted">{{ r.porque }}</p>
            </div>
          }
        </div>
      </section>

      <section id="quem-formata">
        <h2>Quem formata</h2>
        <div class="callout">
          <p><strong>{{ f.ondeFormata.regra }}</strong></p>
        </div>
        <p class="small muted">
          Três componentes têm licença para transformar o dado, e cada um por um motivo que só
          existe dentro dele.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Componente</th>
                <th scope="col">O que faz</th>
                <th scope="col">Até onde</th>
              </tr>
            </thead>
            <tbody>
              @for (e of f.ondeFormata.excecoes; track e.componente) {
                <tr>
                  <td>
                    <a [routerLink]="['/catalogo', e.componente]">{{ e.componenteNome }}</a>
                  </td>
                  <td class="small">{{ e.o_que_faz }}</td>
                  <td class="small muted">{{ e.limite }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- A divergência fica na página, e não num comentário de código. É a
           mesma escolha que a fundação de Estados fez com a receita de
           opacidade: o sistema documenta onde a implementação está atrás do
           contrato, em vez de deixar a página prometer o que o wrapper não
           entrega. -->
      <section id="divergencia">
        <h2>Onde a implementação está atrás</h2>
        <div class="callout callout-warn">
          <p>{{ f.meta['divergencia'] }}</p>
        </div>
      </section>

      <section id="evidencia">
        <h2>De onde veio</h2>
        <p>{{ f.meta['origem'] }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Tela</th>
                <th scope="col">Campo</th>
                <th scope="col">Problema</th>
              </tr>
            </thead>
            <tbody>
              @for (o of f.evidencia.ocorrencias; track o.problema) {
                <tr>
                  <td class="small">{{ o.tela }}</td>
                  <td class="small">{{ o.campo }}</td>
                  <td class="small muted">{{ o.problema }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p><strong>{{ f.evidencia.conclusao }}</strong></p>
      </section>
    </div>
  `,
  styles: `

    .fronteira {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0 1.25rem;
    }
    .lado {
      padding: 0.8rem 0.9rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .lado h3 {
      margin: 0 0 0.3rem;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .lado p {
      margin: 0;
    }

    .forma {
      display: block;
      font-family: var(--f-mono);
      font-size: 0.6875rem;
    }

    .detalhes {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      margin: 1rem 0 1.5rem;
    }
    .detalhe {
      padding: 0.6rem 0;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .detalhe dt {
      display: flex;
      gap: 0.6rem;
      align-items: baseline;
      margin: 0 0 0.25rem;
      font-weight: 500;
    }
    .detalhe dd {
      margin: 0;
    }

    .gerais {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0 1.5rem;
    }
    .geral {
      padding: 0.8rem 0.9rem;
      border-inline-start: 2px solid var(--ucam-color-border-strong);
    }
    .geral h3 {
      margin: 0 0 0.3rem;
      font-size: 0.875rem;
    }
    .geral p {
      margin: 0;
    }
  `,
})
export default class FormatosPage {
  protected readonly f = fundamentos.formatos;

  protected readonly secoes: readonly Ancora[] = [
    { id: 'fronteira', rotulo: 'Duas formas do mesmo dado' },
    { id: 'tabela', rotulo: 'Os formatos' },
    { id: 'regras-de-cada', rotulo: 'A regra de cada um' },
    { id: 'regras', rotulo: 'Regras que valem para todos' },
    { id: 'quem-formata', rotulo: 'Quem formata' },
    { id: 'divergencia', rotulo: 'Onde a implementação está atrás' },
    { id: 'evidencia', rotulo: 'De onde veio' },
  ];
}
