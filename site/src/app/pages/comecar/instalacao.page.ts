import { Component, ChangeDetectionStrategy, computed } from '@angular/core';

import { recursos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-instalacao',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Instalação'"
      [lede]="r.instalacao.$description"
    />

    <ucam-nesta-pagina [secoes]="secoes()" />

    <div class="prose">
      @for (t of r.instalacao.trilhos; track t.id) {
        <section [id]="'trilho-' + t.id">
          <h2>{{ t.nome }}</h2>
          <p class="small muted"><strong class="k">Para quem.</strong> {{ t.alvo }}</p>
          <p>{{ t.como }}</p>
          <pre class="code"><code>{{ t.codigo }}</code></pre>
          <div class="callout callout-limit">
            <p><strong class="k">Limite.</strong> {{ t.limite }}</p>
          </div>
        </section>
      }

      <section id="formatos">
        <h2>Formatos de token</h2>
        <p>
          {{ r.formatosToken.$description }}
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Formato</th>
                <th scope="col">Arquivo</th>
                <th scope="col">Para quê</th>
              </tr>
            </thead>
            <tbody>
              @for (f of r.formatosToken.itens; track f.arquivo) {
                <tr>
                  <td><code>{{ f.formato }}</code></td>
                  <td><code>{{ f.arquivo }}</code></td>
                  <td class="small">{{ f.para }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="small muted">
          Referência do formato:
          <a [href]="r.formatosToken.referencia">{{ r.formatosToken.referencia }}</a>
        </p>
      </section>

      <section id="figma">
        <h2>Figma</h2>
        <p>{{ r.figma.$description }}</p>
        <p><span class="pill pill-draft">{{ r.figma.estado }}</span></p>
      </section>
    </div>
  `,
  styles: `
    /* O ritmo entre seções mora em styles.css (--ritmo-secao). Aqui havia
       margin-block-end: 3rem, uma terceira régua concorrendo com as outras
       duas do site. */
    .prose section:has(.scroller) {
      max-inline-size: none;
    }
  `,
})
export default class InstalacaoPage {
  protected readonly r = recursos;

  /* Os marcadores {versao} e {host} já chegam resolvidos: quem os resolve é
     a fronteira da spec, em spec.ts. Resolver de novo aqui seria a segunda
     fonte — e resolver SÓ aqui foi como a home passou a imprimir "{host}"
     cru na cara do leitor. */

  /**
   * Os trilhos vêm da spec, então a lista é computada — escrever os dois à mão
   * aqui faria a navegação mentir no dia em que a spec ganhasse um terceiro.
   */
  protected readonly secoes = computed<readonly Ancora[]>(() => [
    ...this.r.instalacao.trilhos.map((t) => ({ id: 'trilho-' + t.id, rotulo: t.nome })),
    { id: 'formatos', rotulo: 'Formatos de token' },
    { id: 'figma', rotulo: 'Figma' },
  ]);
}
