import { Component, ChangeDetectionStrategy } from '@angular/core';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Sombra, elevação e camadas.
 *
 * As três existiam em spec/tokens desde o começo e em nenhuma página do site:
 * `shadow.*` primitivo, `elevation.*` semântico e a escala `z`. Quem precisasse
 * saber que sombra um card carrega tinha de abrir semantic.json — e quem não
 * abrisse escrevia `box-shadow: 0 2px 4px rgba(0,0,0,.1)` à mão, que é
 * exatamente a origem das quatro sombras diferentes do parque legado.
 *
 * A página mostra os degraus DESENHADOS, não só listados: sombra é a única
 * fundação que não se confere por número. Duas sombras com o mesmo alfa e
 * raios diferentes lêem como coisas distintas, e a tabela não denuncia isso.
 */
@Component({
  selector: 'ucam-elevacao',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Elevação'"
      [lede]="'Sombra por INTENÇÃO, não por degrau. Cada nível existe porque algo precisa se destacar do que está atrás — nunca para decorar.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="papeis">
        <h2>Os quatro papéis</h2>
        <p>{{ e.descricao }}</p>

        <div class="palco">
          @for (p of e.papeis; track p.token) {
            <div class="amostra">
              <div class="caixa" [style.box-shadow]="p.valor"></div>
              <p class="rotulo">
                <code>elevation.{{ p.token }}</code>
                <span class="muted num">{{ p.ref }}</span>
              </p>
              <p class="small muted">{{ p.descricao }}</p>
            </div>
          }
        </div>
      </section>

      <section id="escuro">
        <h2>No tema escuro o degrau muda</h2>
        <p>{{ e.escuroDescricao }}</p>
        <!-- A tabela compara os DOIS temas na mesma linha de propósito. Ver o
             claro numa página e o escuro noutra é como o mesmo papel acaba
             com sombras que ninguém comparou. -->
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Papel</th>
                <th scope="col">Tema claro</th>
                <th scope="col">Tema escuro</th>
              </tr>
            </thead>
            <tbody>
              @for (p of e.papeis; track p.token) {
                <tr>
                  <td><code>elevation.{{ p.token }}</code></td>
                  <td><code class="num">{{ p.ref }}</code></td>
                  <td>
                    <code class="num">{{ noEscuro(p.token) ?? p.ref }}</code>
                    @if (!noEscuro(p.token)) {
                      <span class="muted small"> — sem sobrescrita</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="sombras">
        <h2>Escala primitiva</h2>
        <p class="small muted">
          A matéria-prima. Componente nenhum referencia esta camada direto — quem escolhe é o papel
          acima.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Degrau</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              @for (s of e.sombras; track s.token) {
                <tr>
                  <td><code>shadow.{{ s.token }}</code></td>
                  <td><code class="num quebra">{{ s.valor }}</code></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="camadas">
        <h2>Camadas de empilhamento</h2>
        <p>{{ e.camadasDescricao }}</p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">z-index</th>
                <th scope="col">O que empilha</th>
              </tr>
            </thead>
            <tbody>
              @for (c of e.camadas; track c.token) {
                <tr>
                  <td><code>z.{{ c.token }}</code></td>
                  <td class="num">{{ c.valor }}</td>
                  <td class="small">{{ c.descricao }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .palco {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
      gap: 1.5rem;
      margin-block: 1.5rem 2rem;
      padding: 2rem 1.5rem;
      background: var(--ucam-color-surface-canvas);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
    }
    .caixa {
      block-size: 4.5rem;
      margin-block-end: 0.9rem;
      background: var(--ucam-color-surface-default);
      /* O filete não é enfeite da amostra: sem ele, elevation.flat — que é
         shadow.none — some contra o canvas e a página mostra três papéis onde
         há quatro. E é o que o card real carrega, filete MAIS sombra. */
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
    }
    .rotulo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      align-items: baseline;
      margin: 0 0 0.3rem;
      font-size: 0.75rem;
    }
    .amostra p:last-child {
      margin: 0;
    }
    /* A sombra empilhada tem quatro camadas e mais de cem caracteres. Sem a
       quebra ela estoura a coluna e leva a tabela inteira para a rolagem
       horizontal, por causa de uma linha só. */
    .quebra {
      overflow-wrap: anywhere;
    }
  `,
})
export default class ElevacaoPage {
  protected readonly e = fundamentos.elevacao;

  protected readonly secoes: Ancora[] = [
    { id: 'papeis', rotulo: 'Os quatro papéis' },
    { id: 'escuro', rotulo: 'No tema escuro' },
    { id: 'sombras', rotulo: 'Escala primitiva' },
    { id: 'camadas', rotulo: 'Camadas' },
  ];

  /** O papel só aparece no tema escuro quando ele sobrescreve o claro. */
  protected noEscuro(token: string): string | null {
    return this.e.papeisEscuro.find((p) => p.token === token)?.ref ?? null;
  }
}
