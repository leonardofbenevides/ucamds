import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * A fundação de texto.
 *
 * Chegou por último e era a maior lacuna do sistema: os 46 contratos já
 * declaravam um bloco "conteudo" cada um — 178 regras, 120 exemplos bons e 128
 * ruins — e nenhuma página os somava. Cada contrato reinventava o princípio
 * junto com o exemplo, porque não havia nada acima deles de onde herdar a voz.
 *
 * Por isso esta página tem duas metades de origens diferentes, e a distinção
 * importa: os princípios, o vocabulário e as formas vêm de spec/writing.json,
 * que é conteúdo PRÓPRIO da fundação; a última seção é o agregado dos 46
 * contratos, que continuam donos do texto de cada componente. Copiar essas
 * regras para cá teria criado a segunda cópia — e a divergência junto.
 */
@Component({
  selector: 'ucam-escrita',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Escrita'"
      [lede]="e.lede"
      [porque]="e.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="voz">
        <h2>A voz</h2>
        <p>{{ e.voz.resumo }}</p>

        <div class="eixos">
          @for (x of e.voz.eixos; track x.eixo) {
            <div class="eixo">
              <h3>{{ x.eixo }}</h3>
              <p class="small">{{ x.regra }}</p>
              <p class="amostra amostra-bom"><span class="marca">assim</span>{{ x.bom }}</p>
              <p class="amostra amostra-ruim"><span class="marca">não assim</span>{{ x.ruim }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Os princípios com as OCORRÊNCIAS abertas, e não só a regra: a regra
           sozinha lê como preferência de quem escreveu. Com o lugar do parque
           onde ela é desobedecida, lê como correção de um defeito medido. -->
      @for (p of e.principios; track p.id) {
        <section [id]="p.id" class="principio">
          <h2>{{ p.titulo }}</h2>
          @if (p.adr) {
            <p class="small muted decidido">
              Decidido em
              <a [routerLink]="['/decisoes', adrSlug(p.adr)]">{{ p.adr }}</a>
            </p>
          }
          <p class="regra">{{ p.regra }}</p>
          <p>{{ p.porque }}</p>

          <div class="par">
            <div class="lado lado-bom">
              <h3>Escreva</h3>
              <ul>
                @for (b of p.bom; track b) {
                  <li>{{ b }}</li>
                }
              </ul>
            </div>
            <div class="lado lado-ruim">
              <h3>Não escreva</h3>
              <ul>
                @for (r of p.ruim; track r) {
                  <li>{{ r }}</li>
                }
              </ul>
            </div>
          </div>

          @if (p.ocorrencias?.length) {
            <details class="evidencia">
              <summary>
                Onde o parque faz o contrário
                <span class="conta">{{ p.ocorrencias!.length }}</span>
              </summary>
              <ul class="list">
                @for (o of p.ocorrencias!; track o) {
                  <li class="small">{{ o }}</li>
                }
              </ul>
            </details>
          }
        </section>
      }

      <section id="vocabulario">
        <h2>Vocabulário</h2>
        <p>{{ e.vocabulario.regra }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Use</th>
                <th scope="col">Em vez de</th>
                <th scope="col">Por quê</th>
              </tr>
            </thead>
            <tbody>
              @for (t of e.vocabulario.termos; track t.use) {
                <tr>
                  <td><strong>{{ t.use }}</strong></td>
                  <td class="small muted riscado">{{ t.evite }}</td>
                  <td class="small">{{ t.nota }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="formas">
        <h2>A forma de cada peça</h2>
        <p class="small muted">
          Doze peças de texto, cada uma com o componente que a desenha. Clique para o contrato,
          onde mora a regra específica dela.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Peça</th>
                <th scope="col">Forma</th>
                <th scope="col">Assim</th>
                <th scope="col">Não assim</th>
              </tr>
            </thead>
            <tbody>
              @for (f of e.formas; track f.id) {
                <tr>
                  <td>
                    <strong>{{ f.peca }}</strong>
                    <a class="small muted" [routerLink]="['/catalogo', f.componente]">
                      {{ f.componenteNome }}
                    </a>
                  </td>
                  <td class="small">{{ f.forma }}</td>
                  <td class="small exemplo-bom">{{ f.bom }}</td>
                  <td class="small exemplo-ruim">{{ f.ruim }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="proibido">
        <h2>Proibido</h2>
        <ul class="list proibido">
          @for (x of e.proibido; track x) {
            <li>{{ x }}</li>
          }
        </ul>
      </section>

      <!-- A metade agregada. O número no cabeçalho é lido, não digitado: se um
           contrato perder o bloco de texto, o validador falha antes de esta
           página somar 45 e parecer completa. -->
      <section id="por-componente">
        <h2>O texto de cada componente</h2>
        <p>
          {{ t.regras }} regras, {{ t.bons }} exemplos do que escrever e {{ t.ruins }} do que não
          escrever, declarados nos {{ t.contratos }} contratos. Não são conteúdo desta página: são
          o bloco de texto de cada contrato, somado aqui.
        </p>
        @if (t.semConteudo.length) {
          <div class="callout callout-warn">
            <p>
              <strong>Sem bloco de texto:</strong> {{ t.semConteudo.join(', ') }}.
            </p>
          </div>
        }

        <div class="filtro">
          <label class="small" for="busca-texto">Filtrar por componente ou por palavra</label>
          <input
            id="busca-texto"
            type="search"
            class="campo"
            placeholder="caixa alta, rótulo, prazo…"
            (input)="filtrar($any($event.target).value)"
          />
          <p class="small muted" aria-live="polite">
            {{ visiveis().length }} de {{ e.porComponente.length }} componentes
          </p>
        </div>

        @for (c of visiveis(); track c.id) {
          <details class="contrato">
            <summary>
              <a [routerLink]="['/catalogo', c.id]">{{ c.nome }}</a>
              <span class="small muted">{{ c.categoria }}</span>
            </summary>
            @for (b of c.blocos; track b.chave) {
              <div class="bloco-texto">
                @if (b.chave !== 'regras' && b.chave !== 'exemplos') {
                  <h4>{{ b.chave }}</h4>
                }
                @if (b.regras.length) {
                  <ul class="list">
                    @for (r of b.regras; track r) {
                      <li class="small">{{ r }}</li>
                    }
                  </ul>
                }
                @if (b.bom.length || b.ruim.length) {
                  <div class="par par-compacto">
                    @if (b.bom.length) {
                      <div class="lado lado-bom">
                        <ul>
                          @for (x of b.bom; track x) {
                            <li class="small">{{ x }}</li>
                          }
                        </ul>
                      </div>
                    }
                    @if (b.ruim.length) {
                      <div class="lado lado-ruim">
                        <ul>
                          @for (x of b.ruim; track x) {
                            <li class="small">{{ x }}</li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </details>
        }
      </section>

      <section id="origem">
        <h2>De onde veio</h2>
        <p class="small muted">{{ e.meta['origem'] }}</p>
        <p class="small muted">{{ e.meta['regra'] }}</p>
        <p class="small muted">{{ e.meta['evidencia'] }}</p>
      </section>
    </div>
  `,
  styles: `

    .eixos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
      gap: 0.75rem;
      margin: 1.25rem 0 1.5rem;
    }
    .eixo {
      padding: 0.85rem 0.95rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .eixo h3 {
      margin: 0 0 0.35rem;
      font-size: 0.9375rem;
    }
    .eixo p {
      margin: 0 0 0.5rem;
    }

    /* O rótulo do exemplo é PALAVRA, não cor: é a mesma regra que a fundação
       está ensinando duas seções acima, e uma página que dissesse "nada viaja
       só na cor" pintando os exemplos de verde e vermelho sem legenda estaria
       desmentindo a si mesma na própria tela. */
    .amostra {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
      margin: 0 0 0.3rem;
      font-size: 0.8125rem;
    }
    .marca {
      flex: none;
      inline-size: 4.75rem;
      font-size: 0.6875rem;
      text-transform: none;
      color: var(--ucam-color-text-secondary);
    }
    .amostra-bom {
      color: var(--ucam-color-text-primary);
    }
    .amostra-ruim {
      color: var(--ucam-color-text-secondary);
    }

    .principio .regra {
      font-weight: 500;
    }
    .decidido {
      margin: -0.4rem 0 0.6rem;
    }

    .par {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      gap: 0.75rem;
      margin: 1rem 0;
    }
    .lado {
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .lado h3 {
      margin: 0 0 0.4rem;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .lado ul {
      margin: 0;
      padding-inline-start: 1.1rem;
    }
    .lado li {
      margin-block: 0.15rem;
    }
    /* Um portador de cor por lado, e é o FILETE — nunca o fundo. Card com
       fundo cinza é o que a ADR do realce tirou do sistema. */
    .lado-bom {
      border-inline-start: 2px solid var(--ucam-color-feedback-success-border);
    }
    .lado-ruim {
      border-inline-start: 2px solid var(--ucam-color-border-strong);
    }
    .par-compacto {
      margin: 0.5rem 0 0;
    }

    .evidencia {
      margin: 0.75rem 0 0;
    }
    .evidencia summary {
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .conta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 1.125rem;
      block-size: 1.125rem;
      margin-inline-start: 0.4rem;
      padding-inline: 0.3rem;
      font-size: 0.6875rem;
      color: var(--ucam-color-text-secondary);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-pill);
    }

    .riscado {
      text-decoration: line-through;
    }
    .exemplo-bom {
      color: var(--ucam-color-text-primary);
    }
    .exemplo-ruim {
      color: var(--ucam-color-text-secondary);
      text-decoration: line-through;
    }

    .proibido li {
      margin-block: 0.2rem;
    }

    .filtro {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin: 1.25rem 0 1rem;
      max-inline-size: 28rem;
    }
    .filtro p {
      margin: 0;
    }
    .campo {
      block-size: var(--ucam-size-control-md);
      padding-inline: 0.6rem;
      font: inherit;
      font-size: 0.875rem;
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
    }
    .campo:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }

    .contrato {
      padding: 0.5rem 0;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .contrato summary {
      display: flex;
      gap: 0.6rem;
      align-items: baseline;
      cursor: pointer;
    }
    .bloco-texto {
      padding-block: 0.4rem 0.2rem;
      padding-inline-start: 1rem;
    }
    .bloco-texto h4 {
      margin: 0.4rem 0 0.2rem;
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
    }
    .bloco-texto ul {
      margin: 0.2rem 0;
    }
  `,
})
export default class EscritaPage {
  protected readonly e = fundamentos.escrita;
  protected readonly t = fundamentos.escrita.totais;

  private readonly termo = signal('');

  /**
   * O filtro varre o texto inteiro do bloco, não só o nome do componente.
   * São 426 linhas de regra e exemplo espalhadas por 46 fichas fechadas:
   * procurar "caixa alta" e receber os quatro contratos que falam nela é o
   * único jeito de a agregação valer mais do que 46 links.
   */
  protected readonly visiveis = computed(() => {
    const q = this.termo().trim().toLowerCase();
    if (!q) return this.e.porComponente;
    return this.e.porComponente.filter((c) => {
      const alvo = [
        c.nome,
        c.categoria,
        ...c.blocos.flatMap((b) => [b.chave, ...b.regras, ...b.bom, ...b.ruim]),
      ]
        .join(' ')
        .toLowerCase();
      return alvo.includes(q);
    });
  });

  protected filtrar(valor: string): void {
    this.termo.set(valor);
  }

  /** ADR-003 vira "adr-003", a mesma regra de slug do gerador. */
  protected adrSlug(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Âncoras da página, na ordem em que as seções aparecem. Os onze princípios
   * entram um a um: eles SÃO a página, e um item só chamado "Princípios"
   * esconderia justamente o que se procura aqui.
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'voz', rotulo: 'A voz' },
    ...fundamentos.escrita.principios.map((p) => ({ id: p.id, rotulo: p.titulo })),
    { id: 'vocabulario', rotulo: 'Vocabulário' },
    { id: 'formas', rotulo: 'A forma de cada peça' },
    { id: 'proibido', rotulo: 'Proibido' },
    { id: 'por-componente', rotulo: 'O texto de cada componente' },
    { id: 'origem', rotulo: 'De onde veio' },
  ];
}
