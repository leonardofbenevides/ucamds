import { Component, ChangeDetectionStrategy } from '@angular/core';

import { recursos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

@Component({
  selector: 'ucam-skills',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Skills e pacotes'"
      [lede]="r.skills.$description"
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
                  <td><code>{{ p.nome }}</code></td>
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
}
