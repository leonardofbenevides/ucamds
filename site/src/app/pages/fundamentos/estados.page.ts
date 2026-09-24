import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * O modelo de estados.
 *
 * `spec/states.json` era o último arquivo do spec que não chegava ao site.
 * Cada contrato de componente lista os estados que ele tem; nenhum responde a
 * pergunta que aparece na hora de implementar — QUAL VENCE quando dois se
 * aplicam ao mesmo tempo. Um botão desabilitado sob o ponteiro mostra hover?
 * Um botão em loading que recebe foco mostra o anel?
 *
 * A resposta é uma só para os quarenta e seis componentes, e é por isso que
 * ela não pode morar em contrato nenhum: repetida quarenta e seis vezes,
 * divergiria no primeiro que alguém editasse.
 */
@Component({
  selector: 'ucam-estados',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Estados'"
      [lede]="e.lede"
      [porque]="e.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="precedencia">
        <h2>Precedência</h2>
        <p>{{ e.precedencia.regra }}</p>

        <!-- A ordem DESENHADA, não só listada: precedência é uma fila, e uma
             tabela ordenada por outra coisa qualquer esconde justamente o que
             a página vem responder. -->
        <ol class="fila">
          @for (s of e.lista; track s.id) {
            <li>
              <span class="posto num">{{ s.precedencia }}</span>
              <div>
                <p class="nome"><code>{{ s.id }}</code></p>
                <p class="small muted"><strong>Gatilho:</strong> {{ s.gatilho }}</p>
                <p class="small muted">{{ s.aparencia }}</p>
              </div>
            </li>
          }
        </ol>

        <div class="callout callout-warn">
          <p><strong>A única exceção.</strong> {{ e.precedencia.excecao }}</p>
        </div>
      </section>

      <section id="disabled">
        <h2>Desabilitado</h2>
        <div class="callout">
          <p><strong>{{ e.disabled.regra }}</strong></p>
        </div>

        <!-- O PALCO VEM ANTES DA PROSA. Uma página sobre um estado visual que
             só descreve o estado em parágrafos obriga o leitor a imaginar o
             que ele poderia estar vendo. Aqui estão os três controles que se
             confundiam, lado a lado, na folha de verdade. -->
        <div class="palco-estados ucam">
          <div class="cena">
            <p class="etiqueta">Ativo</p>
            <button class="ucam-btn ucam-btn--secondary" type="button">Editar</button>
            <input class="ucam-input" value="Editável" aria-label="Campo editável" />
            <p class="nota">Papel da superfície, aresta de 1px, tinta cheia.</p>
          </div>
          <div class="cena">
            <p class="etiqueta">Somente leitura</p>
            <button class="ucam-btn ucam-btn--secondary" type="button">Copiar</button>
            <input class="ucam-input" value="Somente leitura" readonly aria-label="Campo de leitura" />
            <p class="nota">Recuo leve, aresta mantida, tinta CHEIA — o valor é o que se veio ler.</p>
          </div>
          <div class="cena">
            <p class="etiqueta">Desabilitado</p>
            <button class="ucam-btn ucam-btn--secondary" type="button" disabled>Editar</button>
            <input class="ucam-input" value="Bloqueado" disabled aria-label="Campo bloqueado" />
            <p class="nota">Chão do controle, SEM aresta, tinta apagada — o valor não se aplica.</p>
          </div>
        </div>

        <div class="pontos">
          <div class="ponto" data-tom="marca">
            <span class="ucam-icon-tile" aria-hidden="true">
              <svg class="ic"><use href="#i-layoutGrid" /></svg>
            </span>
            <h3>Um chão só</h3>
            <p>{{ e.disabled.chao_unico.regra }}</p>
            <p class="porque">{{ e.disabled.chao_unico.motivo }}</p>
          </div>
          <div class="ponto" data-tom="marca">
            <span class="ucam-icon-tile" aria-hidden="true">
              <svg class="ic"><use href="#i-listChecks" /></svg>
            </span>
            <h3>Dois sinais, nunca um</h3>
            <p>{{ e.disabled.dois_sinais.regra }}</p>
            <p class="porque">{{ e.disabled.dois_sinais.motivo }}</p>
          </div>
          <div class="ponto ponto--largo" data-tom="atencao">
            <span class="ucam-icon-tile" aria-hidden="true">
              <svg class="ic"><use href="#i-eye" /></svg>
            </span>
            <h3>Não confundir com somente leitura</h3>
            <p>{{ e.disabled.dois_sinais.nao_confundir }}</p>
          </div>
        </div>

        <p class="divisor">Por que não opacidade</p>
        <p>{{ e.disabled.motivo }}</p>

        <p class="divisor">Acessibilidade</p>
        <div class="pontos">
          @for (a of e.disabled.acessibilidade; track a) {
            <div class="ponto" data-tom="bom">
              <span class="ucam-icon-tile" aria-hidden="true">
                <svg class="ic"><use href="#i-circleCheck" /></svg>
              </span>
              <p>{{ a }}</p>
            </div>
          }
        </div>

        <p class="small muted">
          A divergência que produziu esta regra: {{ e.divergencia }}
        </p>
      </section>

      <section id="loading">
        <h2>Carregando</h2>
        <div class="callout">
          <p><strong>{{ e.loading.regra }}</strong></p>
        </div>
        <p>{{ e.loading.motivo }}</p>

        <h3>Onde vai o indicador</h3>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Componente</th>
                <th scope="col">Posição</th>
              </tr>
            </thead>
            <tbody>
              @for (p of e.loading.posicao_do_indicador; track p.componente) {
                <tr>
                  <td>{{ p.componente }}</td>
                  <td class="small">{{ p.posicao }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="movimento">
        <h2>Movimento de estado</h2>
        <p>{{ e.movimento.regra }}</p>
        <p class="small muted">
          A curva e a duração de cada papel vivem em
          <a routerLink="/fundamentos/movimento">Movimento</a>.
        </p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Propriedade</th>
                <th scope="col">Duração</th>
                <th scope="col">Curva</th>
              </tr>
            </thead>
            <tbody>
              @for (m of e.movimento.mapa; track m.propriedade) {
                <tr>
                  <td><code>{{ m.propriedade }}</code></td>
                  <td><code class="num">{{ m.duracao }}</code></td>
                  <td><code class="num">{{ m.easing }}</code></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="small muted">
          Curva e duração vêm do papel, nunca de palavra-chave crua do CSS. Até 09/09/2026 este
          mapa receitava <code>ease-out</code> e a camada primitiva de duração, enquanto o
          <code>&#64;ucam/css</code> já usava os papéis — a tabela estava atrás do código e foi
          alinhada a ele, lendo a folha gerada.
        </p>

        <h3>Proibido</h3>
        <ul class="list">
          @for (p of e.movimento.proibido; track p) {
            <li>{{ p }}</li>
          }
        </ul>
      </section>

      <section id="origem">
        <h2>De onde veio</h2>
        <p class="small muted">{{ e.origem }}</p>
      </section>
    </div>
  `,
  styles: `
    /* O PALCO DOS TRÊS ESTADOS.
       Fundo de CANVAS e não de card: o campo desabilitado assenta num cinza
       próprio, e uma cena com fundo cinza por baixo dele apagaria justamente
       o degrau que a cena existe para mostrar. */
    .palco-estados {
      display: grid;
      /* 13rem e não 15: as três cenas precisam caber numa FILEIRA só. Em duas
         fileiras o desabilitado desce para baixo do ativo e a comparação que a
         cena existe para fazer — os três lado a lado — deixa de acontecer. */
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
      gap: 1.25rem;
      margin-block: 1.5rem 2rem;
      padding: 1.75rem 1.5rem;
      background: var(--ucam-color-surface-canvas);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
    }
    .cena {
      display: grid;
      gap: 0.6rem;
      justify-items: start;
      align-content: start;
    }
    .cena .ucam-input {
      inline-size: 100%;
    }
    .etiqueta {
      margin: 0;
      font-size: 0.6875rem;
      font-weight: 560;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }
    .nota {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--ucam-color-text-secondary);
    }
    .fila {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 1.25rem 0 1.5rem;
      padding: 0;
      list-style: none;
      counter-reset: none;
    }
    .fila li {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: 0.9rem;
      align-items: start;
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    /* O número é o de PRECEDÊNCIA, que é o dado — não a posição na lista.
       São iguais hoje porque a lista já vem ordenada por ele, e continuarão
       iguais só enquanto isso for verdade; por isso ele é lido, não contado. */
    .posto {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      background: var(--ucam-color-surface-sunken);
      border-radius: var(--ucam-radius-pill);
    }
    .nome {
      margin: 0 0 0.3rem;
    }
    .fila p:last-child {
      margin: 0;
    }
    .fila .small {
      margin: 0 0 0.2rem;
    }
  `,
})
export default class EstadosPage {
  protected readonly e = fundamentos.estados;

  protected readonly secoes: readonly Ancora[] = [
    { id: 'precedencia', rotulo: 'Precedência' },
    { id: 'disabled', rotulo: 'Desabilitado' },
    { id: 'loading', rotulo: 'Carregando' },
    { id: 'movimento', rotulo: 'Movimento de estado' },
    { id: 'origem', rotulo: 'De onde veio' },
  ];
}
