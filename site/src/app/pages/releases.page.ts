import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { releases, meta, recursos } from '../spec/spec';
import { PageHeaderComponent } from '../docs/page-header.component';

@Component({
  selector: 'ucam-releases',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Projeto"
      [titulo]="'Releases'"
      [lede]="lede"
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

  /** A lede dizia "nenhum pacote publicado" mesmo depois de quatro deles
   *  passarem a sair do build como tarball. Agora ela conta o que a spec diz,
   *  e a frase envelhece junto com o dado em vez de contra ele. */
  protected readonly lede = (() => {
    const gerados = recursos.pacotes.itens.filter((p) => p.estado === 'gerado').length;
    return `Versão e estado de cada contrato. As versões abaixo são as do contrato; ${gerados} pacotes já existem como tarball baixável, na versão ${meta.versao} do design system.`;
  })();
  protected readonly m = meta;
  protected readonly geradoEm = new Date(meta.geradoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
