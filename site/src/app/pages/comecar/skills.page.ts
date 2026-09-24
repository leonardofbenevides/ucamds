import { Component, ChangeDetectionStrategy } from '@angular/core';

import { recursos, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

@Component({
  selector: 'ucam-skills',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Skills e pacotes'"
      [lede]="r.skills.$lede"
      [porque]="r.skills.$description"
    />

    <div class="prose">
      <section>
        <h2>Skills</h2>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">O que faz</th>
                <th scope="col">Onde roda</th>
              </tr>
            </thead>
            <tbody>
              @for (s of r.skills.itens; track s.nome) {
                <tr>
                  <td><code>{{ s.nome }}</code></td>
                  <td class="small">{{ s.faz }}</td>
                  <td class="small">{{ s.onde }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Pacotes</h2>
        <p>{{ r.pacotes.$description }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Pacote</th>
                <th scope="col">Conteúdo</th>
                <th scope="col">Consumidores</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (p of r.pacotes.itens; track p.nome) {
                <tr>
                  <td>
                    @if (p.estado === 'gerado') {
                      <a [href]="tarball(p.nome)" download>
                        <code>{{ p.nome }}</code>
                      </a>
                    } @else {
                      <code>{{ p.nome }}</code>
                    }
                  </td>
                  <td class="small">
                    {{ p.conteudo }}
                    @if (p.nota) {
                      <br /><span class="muted">{{ p.nota }}</span>
                    }
                  </td>
                  <td class="small">{{ p.consumidores }}</td>
                  <td>
                    <span
                      class="pill"
                      [class]="p.estado === 'gerado' ? 'pill-stable' : 'pill-draft'"
                      >{{ p.estado }}</span
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    /* O ritmo entre seções mora em styles.css (--ritmo-secao). Aqui havia
       margin-block-end: 3rem, uma terceira régua concorrendo com as outras
       duas do site. */
    .prose section {
      max-inline-size: none;
    }
  `,
})
export default class SkillsPage {
  protected readonly r = recursos;

  /** O nome do tarball é derivado, não digitado: @ucam/ds-mcp na versão 0.1.0
   *  é ucam-ds-mcp-0.1.0.tgz, a mesma regra que o npm pack usa e que
   *  tools/build-publicacao.mjs confere na saída. Assim a versão continua
   *  tendo uma fonte só — o package.json da raiz, que chega aqui em meta. */
  protected tarball(nome: string): string {
    const arquivo = `${nome.replace(/^@/, '').replace('/', '-')}-${meta.versao}.tgz`;
    return `${recursos.publicacao.pacotes}/${arquivo}`;
  }
}
