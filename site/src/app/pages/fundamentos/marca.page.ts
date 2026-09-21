import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

import { PageHeaderComponent } from '../../docs/page-header.component';

type Fundo = { id: string; nome: string; token: string };

@Component({
  selector: 'ucam-marca',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Marca'"
      [lede]="'A logo da universidade é monocromática: brasão e tipografia são uma cor só. Por isso um arquivo por lockup, em currentColor, cobre as quatro apresentações do kit oficial.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="marcas">
        <h2>Duas marcas, dois donos</h2>
        <p>
          A <strong>logo da UCAM</strong> é da universidade e vem do arquivo de marca. O
          <strong>símbolo do UCAMDS</strong> — placa sólida com um quadrado vazado perto do canto
          inferior direito — é do design system: a placa é o componente, o vazado é o token, e o
          fundo aparece pelo buraco. No header do site as duas aparecem lado a lado, separadas por
          um filete, justamente porque não são a mesma coisa.
        </p>
        <p class="small muted">
          Regra prática: interface de sistema da UCAM leva a logo da universidade. Material sobre o
          design system leva o símbolo. Nada impede as duas juntas, nessa ordem — e quando estão
          juntas, só o símbolo vai na tinta da marca; a logo da universidade vem no cinza
          secundário, porque ali ela assina, não co-assina.
        </p>
        <p class="small muted">
          O símbolo é <strong>um path só</strong>, com <code>fill-rule="evenodd"</code> — não uma
          moldura traçada. Traço fino morre em tamanho de favicon: 2,3 num
          <code>viewBox</code> de 24 dá 1,53&nbsp;px a 16&nbsp;px. Massa com um vazado de 8 unidades
          mede 5,3&nbsp;px no mesmo lugar, e por isso o desenho fica mais legível na redução, não
          menos. Sem <code>&lt;mask&gt;</code> e sem <code>id</code>: é o que permite ao mesmo
          desenho servir inline, como máscara de alfa na trilha das telas legadas, e como data URI
          no favicon.
        </p>
      </section>

      <section id="lockups">
        <h2>Lockups</h2>
        <p>
          São os dois que o arquivo de marca traz. O horizontal é o padrão; o empilhado existe para
          espaços estreitos, onde o horizontal encolheria a ponto de a tipografia sumir.
        </p>

        <h3>Horizontal</h3>
        <p class="small muted">
          <code>ucam-logo-horizontal.svg</code> · proporção 211,27 × 38,61 (5,47:1)
        </p>
        <div class="palco">
          @for (f of fundos; track f.id) {
            <div class="cena" [class]="'cena-' + f.id">
              <span class="lockup lockup-h" role="img" aria-label="Universidade Candido Mendes"></span>
              <span class="rotulo">{{ f.nome }}</span>
            </div>
          }
        </div>

        <h3>Empilhado</h3>
        <p class="small muted">
          <code>ucam-logo-vertical.svg</code> · proporção 142,76 × 54,55 (2,62:1)
        </p>
        <div class="palco">
          @for (f of fundos; track f.id) {
            <div class="cena" [class]="'cena-' + f.id">
              <span class="lockup lockup-v" role="img" aria-label="Universidade Candido Mendes"></span>
              <span class="rotulo">{{ f.nome }}</span>
            </div>
          }
        </div>
      </section>

      <section id="cor">
        <h2>Cor</h2>
        <p>
          O bordô da logo é <code>#6C1E2B</code> e ancora a escala: é o <code>wine.700</code>. É
          essa a tinta da logo sobre fundo claro, onde a reprodução exata da marca importa. A rampa
          é construída em OKLCH com matiz constante e ancorada por lightness.
        </p>
        <div class="callout callout-limit">
          <p class="small">
            Faixa de marca e ação primária não usam o valor da logo:
            <code>color.surface.brand</code> e <code>color.action.primary.default</code> resolvem
            para <code>wine.600</code> = <code>#8D293A</code>. Em L* 36 o <code>#6C1E2B</code> tem
            altura de um degrau 800, e uma faixa inteira nessa altura lê como marrom escuro — por
            isso o <code>wine.700</code> fica reservado ao hover do primário e à tinta da logo.
          </p>
        </div>
        <p class="small muted">
          Como a marca é monocromática, ela não precisa de uma variante por fundo: sobre bordô ou
          sobre superfície escura, é a mesma silhueta em branco.
        </p>
      </section>

      <section id="consumir">
        <h2>Como consumir</h2>
        <p>
          O SVG tem cerca de 90 KB — o brasão é gravado, com centenas de traços. Isso decide o
          método.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Método</th>
                <th scope="col">Herda <code>currentColor</code></th>
                <th scope="col">Quando</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>mask-image</code> + <code>background: currentColor</code></td>
                <td><span class="chip chip-good">sim</span></td>
                <td class="small">
                  Padrão. O arquivo fica fora do bundle, o navegador cacheia, e a cor continua
                  vindo do token. É o que o header deste site usa.
                </td>
              </tr>
              <tr>
                <td>SVG inline no template</td>
                <td><span class="chip chip-good">sim</span></td>
                <td class="small">
                  Só quando a marca precisa de partes com cores diferentes — o que hoje não
                  acontece. Custa os 90 KB em toda página que carregar o componente.
                </td>
              </tr>
              <tr>
                <td><code>&lt;img src&gt;</code></td>
                <td><span class="chip chip-bad">não</span></td>
                <td class="small">
                  O <code>currentColor</code> de um SVG externo resolve contra o próprio SVG e cai
                  para preto. Serve para material impresso e exportação, não para interface.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="code">
          <code>{{ exemplo }}</code>
        </div>
      </section>

      <section id="respiro">
        <h2>Respiro e tamanho mínimo</h2>
        <div class="callout callout-warn">
          <p class="small">
            <strong>Proposta do design system, não regra oficial.</strong> O arquivo de marca traz
            os lockups em molduras de apresentação, não um manual com área de respiro e corpo
            mínimo. Os números abaixo saem da legibilidade da tipografia, e valem até quem responde
            pela identidade institucional da UCAM dizer outra coisa.
          </p>
        </div>
        <ul class="list">
          <li>
            <strong>Respiro:</strong> metade da altura do lockup, livre em volta dos quatro lados.
          </li>
          <li>
            <strong>Mínimo no horizontal:</strong> 120 px de largura. Abaixo disso a linha
            <em>UNIVERSIDADE</em> fecha e vira um borrão — troque pelo empilhado.
          </li>
          <li><strong>Mínimo no empilhado:</strong> 96 px de largura.</li>
        </ul>
      </section>

      <section id="evitar">
        <h2>O que não fazer</h2>
        <ul class="list">
          <li>Recolorir em algo que não seja uma cor sólida da escala, ou branco sobre fundo escuro.</li>
          <li>Usar o brasão sozinho, sem a tipografia — não é um símbolo separado no arquivo de marca.</li>
          <li>Distorcer a proporção. O <code>mask</code> usa <code>contain</code> por isso.</li>
          <li>Aplicar sombra, contorno ou gradiente.</li>
          <li>Pôr a logo sobre foto ou sobre um bordô diferente do <code>surface.brand</code>.</li>
        </ul>
      </section>

      <section id="origem">
        <h2>Origem</h2>
        <p class="small muted">
          Arquivo Figma <code>UCAM-SITE</code>, seção <code>Brand</code>. O lockup horizontal saiu
          do nó <code>73:30281</code> e o empilhado do <code>73:30583</code>. Do export bruto foram
          removidos o cenário do styleguide e 75 máscaras de luminância que não recortavam nada —
          cada uma conferida como retângulo cobrindo o viewBox inteiro antes de sair.
        </p>
      </section>
    </div>
  `,
  styles: `
    .palco {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
      gap: 1px;
      background: var(--ucam-color-border-subtle);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-md);
      overflow: hidden;
    }
    .cena {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 2.5rem 1.5rem 1rem;
      min-block-size: 9rem;
    }
    .cena-claro {
      background: var(--ucam-color-surface-subtle);
      color: var(--ucam-color-action-primary-default);
    }
    .cena-escuro {
      background: var(--ucam-color-surface-inverse);
      color: var(--ucam-color-text-on-brand);
    }
    .cena-brand {
      background: var(--ucam-color-surface-brand);
      color: var(--ucam-color-text-on-brand);
    }
    /* Mesma técnica do header: o arquivo fica fora do bundle e a cor
       continua saindo do token, o que um <img> não daria. */
    .lockup {
      display: block;
      background: currentColor;
      flex: none;
    }
    .lockup-h {
      inline-size: 10.55rem;
      block-size: 1.93rem;
      -webkit-mask: url('/marca/ucam-logo-horizontal.svg') no-repeat center / contain;
      mask: url('/marca/ucam-logo-horizontal.svg') no-repeat center / contain;
    }
    .lockup-v {
      inline-size: 7.14rem;
      block-size: 2.73rem;
      -webkit-mask: url('/marca/ucam-logo-vertical.svg') no-repeat center / contain;
      mask: url('/marca/ucam-logo-vertical.svg') no-repeat center / contain;
    }
    .rotulo {
      font-family: var(--f-mono);
      font-size: 0.62rem;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      opacity: 0.65;
    }
  `,
})
export default class MarcaPage {
  protected readonly fundos: Fundo[] = [
    { id: 'claro', nome: 'Superfície clara', token: 'surface.subtle' },
    { id: 'escuro', nome: 'Superfície escura', token: 'surface.inverse' },
    { id: 'brand', nome: 'Faixa bordô', token: 'surface.brand' },
  ];

  protected readonly exemplo = `.marca {
  inline-size: 8.2rem;
  block-size: 1.5rem;
  background: var(--ucam-color-action-primary-default);
  mask: url('/marca/ucam-logo-horizontal.svg') no-repeat center / contain;
}`;
  /**
   * Âncoras da página, na ordem em que as seções aparecem.
   *
   * Declarada e não varrida do DOM: no prerender não há DOM, e uma navegação
   * que só aparecesse depois da hidratação seria salto de layout. O portão
   * tools/check-ancoras.mjs confere que cada id daqui existe no template.
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'marcas', rotulo: 'Duas marcas' },
    { id: 'lockups', rotulo: 'Lockups' },
    { id: 'cor', rotulo: 'Cor' },
    { id: 'consumir', rotulo: 'Como consumir' },
    { id: 'respiro', rotulo: 'Respiro e tamanho' },
    { id: 'evitar', rotulo: 'O que não fazer' },
    { id: 'origem', rotulo: 'Origem' },
  ];

}
