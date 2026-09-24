import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { migracao, recursos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-instalacao',
  imports: [PageHeaderComponent, NestaPaginaComponent, RouterLink],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Instalação'"
      [lede]="r.instalacao.$lede"
      [porque]="r.instalacao.$description"
    />

    <ucam-nesta-pagina [secoes]="secoes()" />

    <div class="prose">
      <!-- A ESCOLHA vem antes dos trilhos. A página abria com três seções de
           prosa e deixava o leitor se classificar lendo as três; quem chega
           aqui tem uma pergunta só — "tem passo de build?" —, e a resposta
           dela é que manda em qual seção ler. A tabela não repete o alvo: o
           alvo nomeia tecnologias, a resposta descreve a aplicação. -->
      <section id="escolha">
        <h2>Qual trilho é o seu</h2>
        <p class="pergunta">{{ escolha.pergunta }}</p>
        <!-- .scroller: a tabela tem duas colunas de texto e a 390px pedia
             446px, empurrando a página inteira. É o mesmo embrulho que as
             outras tabelas do site usam. -->
        <div class="scroller">
        <table class="escolha">
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Então</th>
            </tr>
          </thead>
          <tbody>
            @for (t of r.instalacao.trilhos; track t.id) {
              <tr>
                <td>{{ quando(t.id) }}</td>
                <td><a [href]="'#trilho-' + t.id">{{ t.nome }}</a></td>
              </tr>
            }
          </tbody>
        </table>
        </div>
        <p>{{ escolha.nota }}</p>
        <p class="small muted">
          O que cada trilho entrega, o que não entrega e a armadilha de cada um estão em
          <a routerLink="/comecar/migrar">Migrar uma tela</a>, que é de onde esta tabela sai.
        </p>
      </section>

      @for (t of r.instalacao.trilhos; track t.id) {
        <section [id]="'trilho-' + t.id">
          <h2>{{ t.nome }}</h2>
          <p class="small muted"><strong class="k">Para quem.</strong> {{ quando(t.id) }}</p>
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
    /* A pergunta lê como pergunta: uma linha em display, no corpo do texto.
       Em tamanho de parágrafo ela sumia entre a lede e a tabela, que é o
       lugar exato onde o leitor decide. */
    .pergunta {
      font-family: var(--f-display);
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.012em;
    }
    /* Duas colunas, e a segunda é o destino: ela encolhe ao conteúdo para a
       resposta ficar com a largura de ler. */
    table.escolha td:last-child,
    table.escolha th:last-child {
      inline-size: 1%;
      white-space: nowrap;
    }
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

  /* O SELETOR de trilho é um só, e não é daqui: mora em
     migracao.escolhaDoTrilho, que é o que a página "Migrar uma tela" abre e o
     que o kit de agentes gera. Esta página INSTALA; aquela DECIDE. Antes havia
     um campo "alvo" aqui dizendo, com outras palavras, o mesmo "quando" de lá
     — e as duas versões já divergiam: só uma citava JSF/PrimeFaces. */
  protected readonly escolha = migracao.escolhaDoTrilho;

  protected quando(id: string): string {
    return this.escolha.trilhos.find((t) => t.id === id)?.quando ?? '';
  }

  /* Os marcadores {versao} e {host} já chegam resolvidos: quem os resolve é
     a fronteira da spec, em spec.ts. Resolver de novo aqui seria a segunda
     fonte — e resolver SÓ aqui foi como a home passou a imprimir "{host}"
     cru na cara do leitor. */

  /**
   * Os trilhos vêm da spec, então a lista é computada — escrever os dois à mão
   * aqui faria a navegação mentir no dia em que a spec ganhasse um terceiro.
   */
  protected readonly secoes = computed<readonly Ancora[]>(() => [
    { id: 'escolha', rotulo: 'Qual trilho é o seu' },
    ...this.r.instalacao.trilhos.map((t) => ({ id: 'trilho-' + t.id, rotulo: t.nome })),
    { id: 'formatos', rotulo: 'Formatos de token' },
    { id: 'figma', rotulo: 'Figma' },
  ]);
}
