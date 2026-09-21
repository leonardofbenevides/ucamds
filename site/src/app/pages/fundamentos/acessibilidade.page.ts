import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UcamSectionBar } from '@ucam/ui';

import { componentes, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

/** Nome legível dos critérios que os contratos citam. */
const NOMES: Record<string, string> = {
  '1.3.1': 'Informação e relações',
  '1.4.1': 'Uso de cor',
  '1.4.3': 'Contraste mínimo',
  '1.4.10': 'Refluxo',
  '1.4.11': 'Contraste de conteúdo não textual',
  '1.4.13': 'Conteúdo sob foco ou ponteiro',
  '2.1.1': 'Teclado',
  '2.1.2': 'Sem armadilha de teclado',
  '2.4.3': 'Ordem de foco',
  '2.4.6': 'Cabeçalhos e rótulos',
  '2.4.7': 'Foco visível',
  '2.5.5': 'Tamanho do alvo',
  '2.5.8': 'Tamanho do alvo (mínimo)',
  '3.2.1': 'Em foco',
  '3.2.2': 'Em entrada',
  '3.3.1': 'Identificação de erro',
  '3.3.2': 'Rótulos ou instruções',
  '3.3.3': 'Sugestão de erro',
  '4.1.2': 'Nome, função, valor',
  '4.1.3': 'Mensagens de estado',
};

@Component({
  selector: 'ucam-acessibilidade',
  imports: [RouterLink, PageHeaderComponent, UcamSectionBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Acessibilidade'"
      [lede]="
        m.requisitosA11y +
        ' requisitos distribuídos por ' +
        m.componentes +
        ' contratos, cobrindo ' +
        m.criteriosWcag +
        ' critérios da WCAG. Nenhum deles é recomendação: são condição para o contrato existir.'
      "
    />

    <div class="prose largo">
      <section>
        <h2>Critérios cobertos</h2>
        <p>
          Cada critério abaixo é citado por pelo menos um contrato. A coluna da direita diz onde —
          é o mapa de quem precisa ser reauditado quando um critério muda de interpretação.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Critério</th>
                <th scope="col">Nome</th>
                <th scope="col">Componentes</th>
              </tr>
            </thead>
            <tbody>
              @for (c of criterios; track c.id) {
                <tr>
                  <td><code>{{ c.id }}</code></td>
                  <td>{{ c.nome }}</td>
                  <td>
                    <span class="chips">
                      @for (n of c.componentes; track n.id) {
                        <a class="chip" [routerLink]="'/catalogo/' + n.id">{{ n.nome }}</a>
                      }
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Requisitos por componente</h2>
        @for (c of lista; track c.id) {
          <ucam-section-bar
            [title]="c.nome"
            [level]="3"
            [count]="c.requisitos.length + ' requisitos'"
            collapsible
            [open]="false"
          >
            <div ucamSecao>
              <ul class="list">
                @for (r of c.requisitos; track r) {
                  <li>{{ r }}</li>
                }
              </ul>
              <p class="small">
                <a [routerLink]="'/catalogo/' + c.id">Ver o contrato de {{ c.nome }}</a>
              </p>
            </div>
          </ucam-section-bar>
        }
      </section>
    </div>
  `,
  styles: `
    /* A lista por componente é a SEÇÃO RECOLHÍVEL do design system, e não mais
       <details> nativo: ali o nome do componente era um LINK dentro do resumo,
       e link dentro do gatilho que abre são dois destinos no mesmo alvo. O
       link foi para dentro da região, onde é uma ação só. */
    ucam-section-bar [ucamSecao] ul {
      margin-block-start: 0.75rem;
      max-inline-size: var(--measure);
    }
    a.chip {
      text-decoration: none;
    }
  `,
})
export default class AcessibilidadePage {
  protected readonly m = meta;

  protected readonly lista = componentes.map((c) => ({
    id: c.id,
    nome: c.name,
    requisitos: c.acessibilidade.requisitos,
  }));

  protected readonly criterios = [
    ...new Set(componentes.flatMap((c) => c.acessibilidade.criterios_wcag)),
  ]
    // Ordem numérica por seção, não alfabética: 1.4.10 vem depois de 1.4.3.
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
    })
    .map((id) => ({
      id,
      nome: NOMES[id] ?? '',
      componentes: componentes
        .filter((c) => c.acessibilidade.criterios_wcag.includes(id))
        .map((c) => ({ id: c.id, nome: c.name })),
    }));
}
