import { Component, ChangeDetectionStrategy } from '@angular/core';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-espacamento',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Espaçamento'"
      [lede]="'Espaçamento é nomeado por intenção — entre rótulo e campo, entre campos, entre seções — não pelo número de pixels.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="escala">
        <h2>Escala primitiva</h2>
        <p class="small muted">Base 4px. Ninguém referencia esta camada direto.</p>
        @for (e of f.espacoPrimitivo; track e.token) {
          <div class="barra-linha">
            <code class="chave">space.{{ e.token }}</code>
            <span class="barra" [style.inline-size]="e.valor"></span>
            <span class="num muted">{{ e.valor }}</span>
          </div>
        }
      </section>

      <section id="semantica">
        <h2>Camada semântica</h2>
        <p>É esta que os componentes usam.</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Resolve para</th>
                <th scope="col">Quando usar</th>
              </tr>
            </thead>
            <tbody>
              @for (e of f.espacoSemantico; track e.token) {
                <tr>
                  <td><code>space.{{ e.token }}</code></td>
                  <td><code>{{ e.valor }}</code></td>
                  <td class="small">{{ e.descricao }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="controles">
        <h2>Tamanhos de controle</h2>
        <p class="small muted">
          Alvo de toque mínimo de 24×24 px (WCAG 2.5.8 AA); 44×44 px onde houver espaço.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Valor</th>
                <th scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              @for (s of f.tamanhos; track s.token) {
                <tr>
                  <td><code>size.{{ s.token }}</code></td>
                  <td><code>{{ s.valor }}</code></td>
                  <td class="small">{{ s.descricao }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Raio e movimento saíram daqui em 09/09/2026: cada um virou fundação
           própria, com os PAPÉIS que esta página nunca mostrou. O ponteiro
           abaixo existe para quem tinha o hábito de procurá-los aqui. -->
      <section id="foco">
        <h2>Foco</h2>
        <p>
          Anel de <code>{{ f.foco.larguraAnel }}</code> com deslocamento de
          <code>{{ f.foco.offset }}</code>, contraste mínimo 3:1 contra o fundo adjacente
          (WCAG 1.4.11). Passe o Tab por esta página para vê-lo.
        </p>
      </section>

    </div>
  `,
  styles: `
    .barra-linha {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-block: 0.2rem;
    }
    .chave {
      inline-size: 7rem;
      flex: none;
      font-size: 0.7rem;
    }
    .barra {
      block-size: 0.75rem;
      background: var(--ucam-color-action-primary-default);
      border-radius: var(--ucam-radius-sm);
      flex: none;
    }
  `,
})
export default class EspacamentoPage {
  protected readonly f = fundamentos;
  /**
   * Âncoras da página, na ordem em que as seções aparecem.
   *
   * Declarada e não varrida do DOM: no prerender não há DOM, e uma navegação
   * que só aparecesse depois da hidratação seria salto de layout. O portão
   * tools/check-ancoras.mjs confere que cada id daqui existe no template.
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'escala', rotulo: 'Escala primitiva' },
    { id: 'semantica', rotulo: 'Camada semântica' },
    { id: 'controles', rotulo: 'Tamanhos de controle' },
    { id: 'foco', rotulo: 'Foco' },
  ];

}
