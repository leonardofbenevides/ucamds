import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { releases, meta } from '../spec/spec';
import { PageHeaderComponent } from '../docs/page-header.component';

@Component({
  selector: 'ucam-releases',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Projeto"
      [titulo]="'Releases'"
      [lede]="'Versão e estado de cada contrato. Nenhum pacote publicado: as versões abaixo são as do contrato, não de artefato instalável.'"
    />

    <div class="callout">
      <p>
        Um contrato só passa de <code>draft</code> para <code>stable</code> quando existem
        <strong>dois consumidores reais</strong> do componente em produção. Em
        <code>draft</code>, a API pode mudar dentro da 0.x — fixe a versão ao consumir.
      </p>
    </div>

    <div class="scroller">
      <table>
        <thead>
          <tr>
            <th scope="col">Componente</th>
            <th scope="col">Versão</th>
            <th scope="col">Desde</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (r of lista; track r.id) {
            <tr>
              <td><a [routerLink]="'/catalogo/' + r.id">{{ r.nome }}</a></td>
              <td><code>{{ r.versao }}</code></td>
              <td><code>{{ r.desde }}</code></td>
              <td><span class="pill" [class]="'pill-' + r.status">{{ r.status }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <p class="small muted">
      Índice gerado em {{ geradoEm }} a partir de {{ m.componentes }} contratos.
    </p>
  `,
})
export default class ReleasesPage {
  protected readonly lista = releases;
  protected readonly m = meta;
  protected readonly geradoEm = new Date(meta.geradoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
