import { Component, ChangeDetectionStrategy } from '@angular/core';

import { recursos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

@Component({
  selector: 'ucam-mcp',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Conectar MCP'"
      [lede]="mcp.$lede"
      [porque]="mcp.$description"
    />

    <div class="prose">
      <section>
        <h2>Instalação</h2>
        <p>
          Com o <code>@ucam/ds-mcp</code> instalado, <code>npx ucam-ds instalar</code> escreve esta configuração.
          À mão, ela vai no <code>.mcp.json</code> do projeto — Claude Code, Claude Desktop ou qualquer
          cliente que fale o protocolo.
        </p>
        <pre class="code"><code>{{ config }}</code></pre>
      </section>

      <section>
        <h2>Ferramentas</h2>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Ferramenta</th>
                <th scope="col">O que faz</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (f of mcp.ferramentas; track f.nome) {
                <tr>
                  <td><code>{{ f.nome }}</code></td>
                  <td class="small">{{ f.faz }}</td>
                  <td><span class="pill pill-draft">{{ f.estado }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (disponiveis === 0) {
          <div class="callout callout-warn">
            <p>
              <strong>Nenhuma ferramenta está publicada.</strong> A tabela acima é o contrato do
              servidor: nome, função e resposta de cada ferramenta valem quando ela existir.
            </p>
          </div>
        } @else {
          <div class="callout">
            <p>
              <strong>{{ disponiveis }} ferramentas disponíveis</strong> no pacote <code>@ucam/ds-mcp</code>.
              Instale o tarball de <code>dist/pacotes/</code> como dependência de desenvolvimento e rode
              <code>npx ucam-ds instalar</code>: ele registra o servidor em <code>.mcp.json</code> e em
              <code>.vscode/mcp.json</code>, copia as skills e grava o <code>AGENTS.ucam.md</code>.
            </p>
          </div>
        }
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
export default class McpPage {
  protected readonly mcp = recursos.mcp;
  protected readonly config = JSON.stringify(recursos.mcp.config, null, 2);
  protected readonly disponiveis = recursos.mcp.ferramentas.filter((f) => f.estado === 'disponível').length;
}
