import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Densidade e grade — as MEDIDAS.
 *
 * A camada de layout diz onde as coisas ficam; esta diz o tamanho delas. As
 * três partes estavam em três lugares que não conversavam: as alturas de
 * controle viviam numa tabela dentro de Espaçamento, os cinco tetos de largura
 * viviam só como comentário na folha gerada, e o mecanismo de alvo de ponteiro
 * — o menos óbvio dos três — vivia exclusivamente num comentário de CSS.
 *
 * A seção de alvos é a que justifica a página existir. Ela documenta uma
 * distinção que quase todo sistema erra: a área clicável não é o desenho. O
 * controle continua com 32px de altura e o alvo cresce por baixo.
 */
@Component({
  selector: 'ucam-densidade',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Densidade e grade'"
      [lede]="d.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <div class="callout">
        <p><strong>{{ d.meta['regra'] }}</strong></p>
      </div>

      <section id="larguras">
        <h2>Tetos de largura</h2>
        <p>{{ d.larguras.regra }}</p>
        <p class="small muted">
          O arranjo — quem fica ao lado de quem — mora em
          <a routerLink="/layout">Blocos de layout</a>. Aqui está só a medida.
        </p>

        <!-- A barra desenha a PROPORÇÃO entre os tetos, que é o dado que a
             tabela sozinha não dá: 25rem ao lado de 88rem explica sem uma
             frase por que a tela de entrada não usa o teto padrão. -->
        <div class="larguras">
          @for (l of d.larguras.papeis; track l.token) {
            <div class="largura">
              <code class="chave">{{ l.token }}</code>
              <span class="trilho">
                <span
                  class="barra"
                  [class.barra-livre]="semTeto(l.valor)"
                  [style.inline-size]="proporcao(l.valor)"
                ></span>
              </span>
              <span class="num muted">{{ l.valor }}</span>
              <p class="small papel">{{ l.papel }}</p>
              <p class="small muted porque">{{ l.porque }}</p>
            </div>
          }
        </div>
      </section>

      <section id="leitura">
        <h2>Medida de leitura</h2>
        <p>{{ d.leitura.regra }}</p>
        <p class="small muted">{{ d.meta['unidade'] }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Medida</th>
                <th scope="col">Onde</th>
                <th scope="col">Por quê</th>
              </tr>
            </thead>
            <tbody>
              @for (m of d.leitura.medidas; track m.medida) {
                <tr>
                  <td><code class="num">{{ m.medida }}</code></td>
                  <td class="small">{{ m.onde }}</td>
                  <td class="small muted">{{ m.porque }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="alturas">
        <h2>Alturas por papel</h2>
        <p>{{ d.alturas.regra }}</p>

        <ul class="alturas">
          @for (p of d.alturas.papeis; track p.token) {
            <li class="altura">
              <span class="amostras">
                @for (t of p.tokens; track t.token) {
                  <span class="caixa" [style.block-size]="t.valor" [title]="t.token">
                    <span class="px num">{{ t.px }}</span>
                  </span>
                }
              </span>
              <div>
                <p class="papel">{{ p.papel }}</p>
                <p class="small muted"><strong>Quem usa:</strong> {{ p.quem_usa }}</p>
                <p class="small muted mono">{{ p.token }}</p>
              </div>
            </li>
          }
        </ul>

        <div class="callout callout-warn">
          <p><strong>Uma densidade só.</strong> {{ d.alturas.excecao_de_densidade }}</p>
        </div>
      </section>

      <section id="alvos">
        <h2>Alvo de ponteiro</h2>
        <div class="callout">
          <p><strong>{{ d.alvos.regra }}</strong></p>
        </div>

        <div class="patamares">
          @for (p of d.alvos.patamares; track p.ponteiro) {
            <div class="patamar">
              <h3>{{ p.ponteiro }}</h3>
              <p class="medida num">{{ p.alvo }}</p>
              <p class="small muted">{{ p.criterio }}</p>
              <p class="small">{{ p.porque }}</p>
            </div>
          }
        </div>

        <h3>O que a medição achou</h3>
        <p class="small muted">{{ d.alvos.medicao.metodo }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Alvo</th>
                <th scope="col">Medido</th>
                <th scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              @for (a of d.alvos.medicao.achados; track a.alvo) {
                <tr>
                  <td class="small">{{ a.alvo }}</td>
                  <td><code class="num">{{ a.media }}</code></td>
                  <td class="small muted">{{ a.nota }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p><strong>{{ d.alvos.medicao.conclusao }}</strong></p>

        <h3>Fora da lista, de propósito</h3>
        <ul class="list">
          @for (x of d.alvos.fora_da_lista; track x) {
            <li>{{ x }}</li>
          }
        </ul>
      </section>

      <section id="portao">
        <h2>O portão de geometria</h2>
        <p><code>{{ d.portao.ferramenta }}</code> — {{ d.portao.o_que_faz }}</p>
        <p>{{ d.portao.porque }}</p>
        <p class="small muted">{{ d.portao.custo_assumido }}</p>
      </section>

      <section id="proibido">
        <h2>Proibido</h2>
        <ul class="list">
          @for (p of d.proibido; track p) {
            <li>{{ p }}</li>
          }
        </ul>
        <p class="small muted">{{ d.meta['origem'] }}</p>
      </section>
    </div>
  `,
  styles: `

    .larguras {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      margin: 1.25rem 0 1.5rem;
    }
    .largura {
      display: grid;
      grid-template-columns: 9rem minmax(0, 1fr) 6.25rem;
      gap: 0.25rem 0.75rem;
      align-items: center;
      padding-block-end: 0.75rem;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .chave {
      font-size: 0.6875rem;
    }
    .trilho {
      display: block;
      block-size: 0.5rem;
      background: var(--ucam-color-surface-sunken);
      border-radius: var(--ucam-radius-sm);
      overflow: hidden;
    }
    .barra {
      display: block;
      block-size: 100%;
      background: var(--ucam-color-action-primary-default);
    }
    /* Sem teto NÃO é a maior medida — é a ausência de medida, e as duas coisas
       desenhavam a mesma barra cheia. A barra tracejada é a distinção: a de
       88rem termina, esta não tem onde terminar. */
    .barra-livre {
      background: repeating-linear-gradient(
        90deg,
        var(--ucam-color-action-primary-default) 0 0.375rem,
        transparent 0.375rem 0.625rem
      );
    }
    .largura .papel,
    .largura .porque {
      grid-column: 2 / -1;
      margin: 0;
    }
    .largura .papel {
      margin-block-start: 0.15rem;
    }

    .alturas {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 1.25rem 0 1.5rem;
      padding: 0;
      list-style: none;
    }
    .altura {
      display: grid;
      grid-template-columns: 11rem minmax(0, 1fr);
      gap: 1rem;
      align-items: center;
      padding-block-end: 0.75rem;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .amostras {
      display: flex;
      gap: 0.4rem;
      align-items: flex-end;
    }
    /* A caixa tem a altura REAL do token, e o número dentro dela. É a única
       forma de a página responder "quanto é 22px" sem pedir que se acredite
       na tabela. */
    .caixa {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 2.5rem;
      padding-inline: 0.4rem;
      background: var(--ucam-color-surface-sunken);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-sm);
    }
    .px {
      font-size: 0.625rem;
      color: var(--ucam-color-text-secondary);
    }
    .altura p {
      margin: 0 0 0.2rem;
    }
    .altura p:last-child {
      margin: 0;
    }
    .mono {
      font-family: var(--f-mono);
      font-size: 0.6875rem;
    }

    .patamares {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0 1.5rem;
    }
    .patamar {
      padding: 0.85rem 0.95rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .patamar h3 {
      margin: 0 0 0.2rem;
      font-size: 0.875rem;
    }
    .medida {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.2;
    }
    .patamar p {
      margin: 0 0 0.35rem;
    }
    .patamar p:last-child {
      margin: 0;
    }
  `,
})
export default class DensidadePage {
  protected readonly d = fundamentos.densidade;

  /**
   * A barra é proporcional ao MAIOR teto declarado, não a um número fixo.
   *
   * Os papéis sem teto ("sem teto", "sem teto e sem recuo") desenham a barra
   * cheia: é o que eles significam. Papel cuja medida não é largura — a coluna
   * de navegação em rem também é — entra na mesma régua, porque a comparação
   * que interessa é justamente entre a coluna e o conteúdo ao lado dela.
   */
  /** Papel cuja medida é a ausência de medida: a barra dele é tracejada. */
  protected semTeto(valor: string): boolean {
    return !Number.isFinite(parseFloat(valor));
  }

  protected proporcao(valor: string): string {
    const rem = parseFloat(valor);
    if (!Number.isFinite(rem)) return '100%';
    const maior = Math.max(
      ...this.d.larguras.papeis
        .map((p) => parseFloat(p.valor))
        .filter((n) => Number.isFinite(n)),
    );
    return `${Math.max(2, (rem / maior) * 100)}%`;
  }

  protected readonly secoes: readonly Ancora[] = [
    { id: 'larguras', rotulo: 'Tetos de largura' },
    { id: 'leitura', rotulo: 'Medida de leitura' },
    { id: 'alturas', rotulo: 'Alturas por papel' },
    { id: 'alvos', rotulo: 'Alvo de ponteiro' },
    { id: 'portao', rotulo: 'O portão de geometria' },
    { id: 'proibido', rotulo: 'Proibido' },
  ];
}
