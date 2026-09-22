import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';

import { fundamentos, meta } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-cor',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Cor'"
      [lede]="f.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="callout callout-warn">
      <p>
        <strong>Origem da paleta.</strong> {{ aviso.origem }} {{ aviso.pendencia }}
      </p>
    </div>

    <div class="prose largo">
      <section id="primitiva">
        <h2>Camada primitiva</h2>
        <p>
          Valores brutos, sem significado de uso. Nenhum componente pode referenciar esta camada —
          é o que sustenta a troca de marca e o tema escuro.
        </p>

        @for (r of f.rampas; track r.nome) {
          <div class="rampa">
            <div class="rampa-topo">
              <h3>{{ r.nome }}</h3>
              @if (r.descricao) {
                <p class="small muted">{{ r.descricao }}</p>
              }
            </div>
            <div class="rampa-faixa">
              @for (d of r.degraus; track d.degrau) {
                <button
                  type="button"
                  class="rampa-degrau"
                  [title]="d.descricao"
                  [attr.aria-label]="'Copiar ' + d.valor + ', degrau ' + d.degrau + ' de ' + r.nome"
                  (click)="copiar(d.valor)"
                >
                  <span class="chapa-degrau" [style.background]="d.valor" [style.color]="d.tinta">
                    {{ d.degrau }}
                  </span>
                  <span class="hex">{{ copiado() === d.valor ? 'copiado' : d.valor }}</span>
                </button>
              }
            </div>
          </div>
        }
      </section>

      <section id="semantica">
        <h2>Camada semântica</h2>
        <p>
          A única camada que componentes e aplicações podem referenciar. Os contrastes abaixo são
          calculados no build pela fórmula da WCAG 2.1: se um token de texto reprovar, o build
          falha antes de a página existir.
        </p>

        <div class="controles">
          <div class="alternador" role="group" aria-label="Tema">
            <button type="button" [class.ativo]="tema() === 'claro'" (click)="tema.set('claro')">
              Tema claro
            </button>
            <button type="button" [class.ativo]="tema() === 'escuro'" (click)="tema.set('escuro')">
              Tema escuro
            </button>
          </div>

          <!-- AS NOTAS COMEÇAM FECHADAS. Elas são o porquê de cada token — o
               $description do DTCG, que vai de 900 caracteres em text.primary
               —, e somadas faziam esta página ter 331 linhas renderizadas.
               Quem chega para conferir um contraste lê a tabela; quem veio
               entender por que o token mudou abre aqui, uma vez, para as duas
               tabelas. Nada sai da página. -->
          <button
            type="button"
            class="chave-notas"
            [attr.aria-pressed]="notas()"
            (click)="notas.set(!notas())"
          >
            {{ notas() ? 'Ocultar notas' : 'Mostrar notas' }}
          </button>
        </div>

        <h3>Texto</h3>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Resolve para</th>
                <th scope="col">Contraste</th>
                <th scope="col">WCAG</th>
              </tr>
            </thead>
            <tbody>
              @for (t of texto(); track t.token) {
                <tr>
                  <td><code>{{ t.token }}</code></td>
                  <td>
                    <span class="dot" [style.background]="t.hex"></span><code>{{ t.ref }}</code>
                  </td>
                  <td class="num">{{ t.razao }}:1</td>
                  <td><span class="chip" [class]="'chip-' + t.wcag.tone">{{ t.wcag.label }}</span></td>
                </tr>
                @if (notas() && t.descricao) {
                  <tr class="linha-nota">
                    <td colspan="4"><p>{{ t.descricao }}</p></td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <h3>Ação</h3>
        <p class="small muted">
          Contraste do rótulo branco sobre cada cor de ação sólida — é o par que decide se o botão
          é legível.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Valor</th>
                <th scope="col">Contraste c/ branco</th>
                <th scope="col">WCAG</th>
              </tr>
            </thead>
            <tbody>
              @for (a of acao(); track a.token) {
                <tr>
                  <td><code>{{ a.token }}</code></td>
                  <td>
                    <span class="dot" [style.background]="a.hex"></span><code>{{ a.hex }}</code>
                  </td>
                  <td class="num">{{ a.razao }}:1</td>
                  <td><span class="chip" [class]="'chip-' + a.wcag.tone">{{ a.wcag.label }}</span></td>
                </tr>
                @if (notas() && a.descricao) {
                  <tr class="linha-nota">
                    <td colspan="4"><p>{{ a.descricao }}</p></td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="superficies">
        <h2>Superfícies, filetes e interação</h2>
        <p>
          As famílias que pintam o FUNDO e o LIMITE, e as que respondem ao ponteiro. Elas não
          entram na tabela de contraste acima porque não são texto: o que se confere aqui é a
          separação entre uma superfície e a vizinha, não a legibilidade de uma letra.
        </p>

        @for (fam of familias(); track fam.id) {
          <h3>{{ rotuloFamilia(fam.id) }}</h3>
          @if (fam.descricao) {
            <p class="small muted">{{ fam.descricao }}</p>
          }
          <ul class="amostras">
            @for (a of fam.amostras; track a.token) {
              <li>
                <span
                  class="chapa"
                  [style.background]="a.hex"
                  [style.color]="a.tinta"
                >{{ a.hex }}</span>
                <code class="nome">{{ a.nome }}</code>
                @if (a.descricao) {
                  <span class="small muted nota">{{ a.descricao }}</span>
                }
              </li>
            }
          </ul>
        }
      </section>

      <section id="feedback">
        <h2>Feedback e estado</h2>
        <p>
          A única família com tinta e fundo declarados AOS PARES — e por isso a única cujo
          contraste é verificável token contra token, sem depender de onde o componente for
          colocado. Cada tom traz fundo, tinta, filete e o traço de gráfico.
        </p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Tom</th>
                <th scope="col">Amostra</th>
                <th scope="col">Fundo</th>
                <th scope="col">Tinta</th>
                <th scope="col">Contraste</th>
                <th scope="col">WCAG</th>
              </tr>
            </thead>
            <tbody>
              @for (t of feedback(); track t.tom) {
                <tr>
                  <td><code>{{ t.tom }}</code></td>
                  <td>
                    <span
                      class="pastilha"
                      [style.background]="t.background"
                      [style.color]="t.foreground"
                      [style.border-color]="t.border"
                    >Aa</span>
                  </td>
                  <td><code class="num">{{ t.background }}</code></td>
                  <td><code class="num">{{ t.foreground }}</code></td>
                  <td class="num">{{ t.razao }}:1</td>
                  <td>
                    @if (t.wcag; as w) {
                      <span class="chip" [class]="'chip-' + w.tone">{{ w.label }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="callout">
          <p>
            <strong>Cor nunca é o único portador do estado.</strong> WCAG 1.4.1: um requerimento
            atrasado é vermelho <em>e</em> diz “Atrasado”. O token de traço
            (<code>graphic</code>) existe para o mesmo motivo do lado do gráfico — a série
            precisa de forma ou rótulo além da tinta.
          </p>
        </div>
      </section>

      <section id="escuro">
        <h2>Tema escuro</h2>
        <p>{{ f.temaEscuro.descricao }}</p>
        <p class="muted">{{ f.temaEscuro.regra }}</p>
        <p class="small muted">
          O botão de tema no cabeçalho troca esta página junto. Se a camada escura estiver errada,
          quebra aqui primeiro.
        </p>
      </section>
    </div>
  `,
  styles: `
    .rampa {
      margin-block-end: 1.5rem;
    }
    .rampa-topo h3 {
      margin-block-end: 0.15rem;
    }
    .rampa-topo p {
      margin-block-end: 0.5rem;
      max-inline-size: var(--measure);
    }
    /* A rampa é uma FAIXA CONTÍNUA, não uma grade de cartões.
       Havia duas regras .amostras nesta folha — esta, de flex, e a de grid
       mais abaixo, escrita para as amostras semânticas. A segunda vencia por
       ordem, então a rampa primitiva herdava minmax(15rem, 1fr): dez degraus
       quebravam em quatro linhas, com o 900 sozinho na última. O passo de
       luminosidade, que é o argumento inteiro da paleta OKLCH, só se lê se os
       degraus estiverem encostados e na mesma linha — é como Radix e Tailwind
       mostram as suas. Os nomes agora são distintos, e nenhuma regra é morta. */
    .rampa-faixa {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
    }
    .rampa-degrau {
      appearance: none;
      border: 0;
      background: none;
      padding: 0;
      display: grid;
      gap: 0.3rem;
      font-family: var(--f-mono);
      /* 11px, não 0,65rem = 10,4px: o piso de texto das referências é 12, e
         aqui o mono em caixa baixa segura 11. O valor antigo não era escolha,
         caía de um arredondamento. */
      font-size: 0.6875rem;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
    }
    /* O hex vive DEBAIXO da chapa, não dentro dela.
       Dentro, ele obrigava cada degrau a ter 4,5rem — e a rampa neutral, com
       treze degraus, estourava a largura da página e passava a rolar. Fora,
       a chapa encolhe até onde a cor ainda se lê e a faixa inteira cabe em
       qualquer rampa. É como o Tailwind apresenta as dele. Ganha de quebra o
       contraste: o hex deixa de depender da tinta calculada sobre a cor. */
    .chapa-degrau {
      display: flex;
      align-items: flex-end;
      block-size: 3.25rem;
      padding: 0 0.4rem 0.35rem;
      font-weight: 600;
      font-size: 0.75rem;
      transition: transform var(--ucam-motion-duration-fast, 120ms) ease;
    }
    /* As pontas arredondam; o miolo fica reto, que é o que faz a faixa ler
       como uma rampa só e não como dez pastilhas. */
    .rampa-degrau:first-child .chapa-degrau {
      border-start-start-radius: var(--ucam-radius-sm);
      border-end-start-radius: var(--ucam-radius-sm);
    }
    .rampa-degrau:last-child .chapa-degrau {
      border-start-end-radius: var(--ucam-radius-sm);
      border-end-end-radius: var(--ucam-radius-sm);
    }
    .rampa-degrau:hover .chapa-degrau {
      transform: scaleY(1.08);
    }
    .rampa-degrau:focus-visible {
      outline: 0;
    }
    .rampa-degrau:focus-visible .chapa-degrau {
      outline: 2px solid var(--ucam-color-action-primary-default);
      outline-offset: 2px;
    }
    .grau {
      font-weight: 600;
      font-size: 0.75rem;
    }
    .hex {
      opacity: 0.85;
    }
    .rampa-degrau .hex {
      padding-inline: 0.4rem;
      opacity: 1;
    }
    .amostras {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
      gap: 0.6rem;
      margin: 0.75rem 0 1.75rem;
      padding: 0;
      list-style: none;
    }
    .amostras li {
      display: grid;
      gap: 0.3rem;
    }
    /* A chapa carrega o próprio hex ESCRITO nela, com a tinta escolhida por
       contraste no build. Amostra que só mostra a cor obriga a passar o
       conta-gotas para descobrir qual é o valor. */
    .chapa {
      display: flex;
      align-items: end;
      justify-content: end;
      block-size: 3.25rem;
      padding: 0.35rem 0.5rem;
      font-family: var(--ucam-font-mono);
      font-size: 0.6875rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-md);
    }
    .nome {
      font-size: 0.75rem;
    }
    .nota {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .pastilha {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.75rem;
      block-size: 1.75rem;
      font-size: 0.75rem;
      border: 1px solid;
      border-radius: var(--ucam-radius-control);
    }
    .controles {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-block-end: 1rem;
    }
    /* Fantasma, e não segunda peça sólida: a página já tem um controle com
       peso — o alternador de tema — e dois botões do mesmo tom ao lado
       disputariam a mesma atenção sem hierarquia nenhuma. */
    .chave-notas {
      padding: 0.3rem 0.7rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-md);
      background: transparent;
      color: var(--ucam-color-text-secondary);
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: background var(--transicao), color var(--transicao);
    }
    .chave-notas:hover {
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-subtle);
    }
    .chave-notas[aria-pressed='true'] {
      color: var(--ucam-color-text-primary);
      border-color: var(--ucam-color-border-default);
    }
    .alternador {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      border-radius: var(--ucam-radius-md);
      background: var(--ucam-color-surface-subtle);
      border: 1px solid var(--ucam-color-border-subtle);
    }
    .alternador button {
      padding: 0.3rem 0.7rem;
      border: 0;
      border-radius: var(--ucam-radius-sm);
      background: transparent;
      color: var(--ucam-color-text-secondary);
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .alternador button.ativo {
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
    }
  `,
})
export default class CorPage {
  protected readonly f = fundamentos;
  protected readonly aviso = meta.avisoCores;
  /** As notas de token, fechadas por padrão — ver o comentário no botão. */
  protected readonly notas = signal(false);

  protected readonly tema = signal<'claro' | 'escuro'>('claro');

  protected readonly texto = computed(() =>
    this.tema() === 'claro' ? this.f.texto : this.f.textoEscuro,
  );

  protected readonly acao = computed(() =>
    this.tema() === 'claro' ? this.f.acao : this.f.acaoEscuro,
  );

  // As famílias novas acompanham o MESMO alternador de tema das tabelas de
  // texto e ação. Uma família que ficasse presa no claro seria a metade do
  // sistema que ninguém confere — e o escuro é onde as superfícies mudam.
  protected readonly familias = computed(() =>
    this.tema() === 'claro' ? this.f.familias : this.f.familiasEscuro,
  );

  protected readonly feedback = computed(() =>
    this.tema() === 'claro' ? this.f.feedback : this.f.feedbackEscuro,
  );

  private readonly ROTULOS: Record<string, string> = {
    surface: 'Superfície',
    border: 'Filete e contorno',
    interaction: 'Interação',
    realce: 'Realce de busca',
    chart: 'Séries de gráfico',
  };

  protected rotuloFamilia(id: string): string {
    return this.ROTULOS[id] ?? id;
  }

  /** Último hex copiado — o degrau troca o próprio valor por "copiado". */
  protected readonly copiado = signal<string | null>(null);

  /**
   * Copia o HEX, não o nome do token.
   *
   * A camada primitiva é a única que esta página manda NÃO referenciar em
   * componente nenhum — oferecer --ucam-wine-600 para copiar seria um convite
   * a furar a própria regra. Quem olha uma rampa bruta quer o valor.
   */
  protected copiar(valor: string): void {
    void navigator.clipboard?.writeText(valor).then(
      () => {
        this.copiado.set(valor);
        setTimeout(() => this.copiado.update((v) => (v === valor ? null : v)), 1200);
      },
      () => {},
    );
  }
  /**
   * Âncoras da página, na ordem em que as seções aparecem.
   *
   * Declarada e não varrida do DOM: no prerender não há DOM, e uma navegação
   * que só aparecesse depois da hidratação seria salto de layout. O portão
   * tools/check-ancoras.mjs confere que cada id daqui existe no template.
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'primitiva', rotulo: 'Camada primitiva' },
    { id: 'semantica', rotulo: 'Camada semântica' },
    { id: 'superficies', rotulo: 'Superfícies e filetes' },
    { id: 'feedback', rotulo: 'Feedback e estado' },
    { id: 'escuro', rotulo: 'Tema escuro' },
  ];

}
