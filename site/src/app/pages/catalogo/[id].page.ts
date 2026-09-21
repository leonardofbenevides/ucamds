import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KeyValuePipe } from '@angular/common';

import { UcamSectionBar } from '@ucam/ui';

import { componentePorId, dependentesDe, decisoesQueAfetam } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { LooseBlockComponent } from '../../docs/loose-block.component';
import { DemoVivaComponent, TEM_DEMO_VIVA } from '../../docs/demo-viva.component';
import { DemoPainelComponent } from '../../docs/demo-painel.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-componente',
  imports: [
    RouterLink,
    UcamSectionBar,
    KeyValuePipe,
    PageHeaderComponent,
    LooseBlockComponent,
    DemoVivaComponent,
    DemoPainelComponent,
    NestaPaginaComponent,
  ],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = componente();

    @if (!c) {
      <p class="lede">Componente não encontrado.</p>
      <p><a routerLink="/catalogo">Voltar ao catálogo</a></p>
    } @else {
      <ucam-page-header secao="Componente" [titulo]="c.name" [lede]="c.description">
        <span slot="selo" class="pill" [class]="'pill-' + c.status">{{ c.status }}</span>
        <p class="meta">
          <code>&lt;{{ c.selector }}&gt;</code>
          <span>versão {{ c.version }}</span>
          <span>{{ c.category }}</span>
          @if (c.since) {
            <span>desde {{ c.since }}</span>
          }
        </p>
      </ucam-page-header>

      <!-- O índice desta página virou o componente compartilhado: era o único
           do site, e só existia a partir de 82rem. Agora todas as páginas com
           três seções ou mais têm o mesmo, e abaixo de 82rem ele aparece como
           faixa de abas em vez de sumir. A lista continua saindo das MESMAS
           condições que decidem se a seção existe — índice que aponta para
           âncora inexistente é pior que índice nenhum. -->
      <ucam-nesta-pagina [secoes]="indice()" />

      <div class="prose">
        <!-- O exemplo abre a página, sempre. Quem chega aqui quer ver o
             componente antes de ler sobre ele; a prosa vem depois.

             ORDEM CORRIGIDA: a abertura mostra UMA fonte, a melhor que existe
             para este componente — o componente Angular de @ucam/ui rodando,
             que é o que sai da base ZardUI. O preview do Trilho A desceu para
             seção própria e rotulada.

             Antes os dois vinham empilhados aqui, sem rótulo. No Select isso
             era enganoso: em cima o overlay do z-select, embaixo um <select>
             NATIVO. Quem abria o de baixo via a lista do sistema operacional —
             que não é estilizável em navegador nenhum — e concluía, com razão
             pelo que via, que o componente estava sem estilo. Não estava: eram
             dois trilhos diferentes na mesma tela sem nada dizendo qual era
             qual. -->
        <section class="abertura" id="exemplo">
          @if (temDemoViva()) {
            <ucam-demo-viva [componenteId]="c.id" />
          } @else if (c.demo?.principal) {
            <ucam-demo-painel [painel]="c.demo!.principal!" />
          } @else if (c.exemplos.length) {
            <ucam-demo-painel [painel]="{ codigo: c.exemplos[0].codigo }" />
          }

          @if (c.demo?.$nota) {
            <p class="small muted nota">{{ c.demo?.$nota }}</p>
          }
        </section>

        <!-- QUANDO USAR e QUANDO NÃO USAR, juntos e ANTES de props e anatomia.
             O contrato só tinha a segunda metade: nasceu como resposta a uso
             indevido, e por isso sabia dizer o que proibir sem nunca dizer o
             que recomendar. Quem chega nesta página ainda NÃO escolheu o
             componente, e uma lista de proibições não escolhe por ele.

             Ant Design ("When To Use"), Carbon ("When to use" / "When not to
             use"), Atlassian e VibeDS ("whenUse" / "whenAvoid") põem os dois
             lados no alto pelo mesmo motivo. Aqui eles vêm no mesmo bloco e
             lado a lado: separados, a segunda coluna vira rodapé que ninguém
             lê depois de já ter copiado o código. -->
        @if (c.quando_usar?.length || c.limites) {
          <section id="quando">
            <h2>Quando usar</h2>
            <div class="quando">
              @if (c.quando_usar?.length) {
                <div class="quando-lado quando-sim">
                  <p class="quando-titulo">
                    <svg class="ic" aria-hidden="true"><use href="#i-circleCheck" /></svg>
                    Use quando
                  </p>
                  <ul class="list">
                    @for (q of c.quando_usar; track q) {
                      <li>{{ q }}</li>
                    }
                  </ul>
                </div>
              }
              @if (c.limites) {
                <div class="quando-lado quando-nao">
                  <p class="quando-titulo">
                    <svg class="ic" aria-hidden="true"><use href="#i-circleAlert" /></svg>
                    Não use quando
                  </p>
                  <ucam-loose-block [bloco]="c.limites" [semRotulo]="['regras', 'regra']" />
                </div>
              }
            </div>
          </section>
        }

        <!-- O Trilho A não é rascunho do Trilho B: é o que o parque legado
             carrega hoje, CSS puro, sem framework. Continua na página porque é
             entregável — mas com nome, e com o limite dito na cara. -->
        @if (temDemoViva() && c.demo?.principal) {
          <section id="trilho-a">
            <h2>O mesmo componente em CSS puro</h2>
            <p>
              O Trilho A é o que uma tela AngularJS ou Angular 14 do parque consegue carregar hoje:
              uma folha de estilo e mais nada. Mesma marca, mesmos tokens, sem JavaScript.
            </p>
            <ucam-demo-painel [painel]="c.demo!.principal!" />
            @if (temListaNativa()) {
              <div class="callout callout-limit">
                <p>
                  <strong>A lista aberta aqui é a do sistema operacional.</strong> Sem JavaScript o
                  controle é um <code>&lt;select&gt;</code> nativo, e navegador nenhum permite
                  estilizar a lista que ele abre — só o campo fechado. Em tela nova use o componente
                  de cima, que resolve isso com um painel próprio (ADR-011).
                </p>
              </div>
            }
          </section>
        }

        @if (c.demo?.instalacao) {
          <section id="instalacao">
            <h2>Instalação</h2>
            <pre class="code"><code>{{ c.demo?.instalacao }}</code></pre>
            <p class="small muted">
              O CLI copia o código-fonte do componente para dentro do projeto. Você passa a ser dono
              dele — não há dependência de runtime.
            </p>
            @if (c.demo?.importacao) {
              <pre class="code"><code>{{ c.demo?.importacao }}</code></pre>
            }
          </section>
        }

        @if (c.demo?.exemplos?.length) {
          <section id="variacoes">
            <h2>Variações</h2>
            @for (e of c.demo?.exemplos; track e.titulo ?? $index) {
              <ucam-demo-painel [painel]="e" />
            }
          </section>
        }

        <!-- Aparência antes da API, não dentro dela. O contrato já diz, por
             valor de enum, PARA QUE serve cada variante e qual o limite de
             uso; isso é orientação de design e vinha espremido em cartões
             dentro da tabela de props. Aqui cada valor ganha o espaço de uma
             subseção, com âncora própria no índice. -->
        @for (p of propsComValores(); track p.nome) {
          <section [id]="'variantes-' + p.nome">
            <h2>
              Aparência <span class="por">por <code>{{ p.nome }}</code></span>
            </h2>
            @for (v of p.valores | keyvalue; track v.key) {
              <article class="variante" [id]="'v-' + p.nome + '-' + v.key">
                <h3><code>{{ v.key }}</code></h3>
                <p>{{ v.value.uso }}</p>

                @if (v.value.limite) {
                  <p class="limite"><strong class="k">Limite.</strong> {{ v.value.limite }}</p>
                }

                @if (v.value.tokens) {
                  <p class="small muted tokens">
                    @for (t of v.value.tokens | keyvalue; track t.key) {
                      <span class="par"><strong>{{ t.key }}</strong> <code>{{ t.value }}</code></span>
                    }
                  </p>
                }
              </article>
            }
          </section>
        }

        <section id="props">
          <h2>Props</h2>
          <div class="scroller">
            <table>
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Padrão</th>
                  <th scope="col">Descrição</th>
                </tr>
              </thead>
              <tbody>
                @for (p of c.props; track p.nome) {
                  <tr>
                    <td><code>{{ p.nome }}</code></td>
                    <td><code>{{ p.tipo }}</code></td>
                    <td>
                      @if (p.default !== undefined && p.default !== null) {
                        <code>{{ p.default }}</code>
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                    <td>{{ p.descricao }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        </section>

        <section id="anatomia">
          <h2>Anatomia</h2>
          <div class="scroller">
            <table>
              <thead>
                <tr>
                  <th scope="col">Parte</th>
                  <th scope="col">Obrigatória</th>
                  <th scope="col">Descrição</th>
                </tr>
              </thead>
              <tbody>
                @for (a of c.anatomia; track a.parte) {
                  <tr>
                    <td><code>{{ a.parte }}</code></td>
                    <td>{{ a.obrigatorio ? 'sim' : 'não' }}</td>
                    <td>{{ a.descricao }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <h3>Estados</h3>
          <div class="chips">
            @for (e of c.estados; track e) {
              <span class="chip">{{ e }}</span>
            }
          </div>
        </section>

        <section id="acessibilidade">
          <h2>Acessibilidade</h2>
          @if (c.acessibilidade.papel) {
            <p><strong class="k">Papel.</strong> <code>{{ c.acessibilidade.papel }}</code></p>
          }

          @if (c.acessibilidade.teclado?.length) {
            <h3>Teclado</h3>
            <div class="scroller">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Tecla</th>
                    <th scope="col">Comportamento</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of c.acessibilidade.teclado; track t.tecla) {
                    <tr>
                      <td><kbd>{{ t.tecla }}</kbd></td>
                      <td>{{ t.comportamento }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <h3>Requisitos</h3>
          <div class="pontos">
            @for (r of c.acessibilidade.requisitos; track r) {
              <div class="ponto" data-tom="bom">
                <span class="ucam-icon-tile" aria-hidden="true">
                  <svg class="ic"><use href="#i-circleCheck" /></svg>
                </span>
                <p>{{ r }}</p>
              </div>
            }
          </div>

          <div class="chips">
            @for (w of c.acessibilidade.criterios_wcag; track w) {
              <span class="chip">WCAG {{ w }}</span>
            }
          </div>
        </section>

        @if (c.boas_praticas; as praticas) {
          <section id="boas-praticas">
            <h2>Boas práticas</h2>
            <p class="small muted">
              O que fazer e o que evitar em cada situação, com o motivo. É o que se cobra em
              revisão de código.
            </p>
            <ul class="praticas">
              @for (p of praticas; track p.faca) {
                <li>
                  <p class="lado faca"><span class="rotulo">Faça</span> {{ p.faca }}</p>
                  <p class="lado evite"><span class="rotulo">Evite</span> {{ p.evite }}</p>
                  @if (p.porque) {
                    <p class="porque small muted">{{ p.porque }}</p>
                  }
                </li>
              }
            </ul>
          </section>
        }

        @if (c.vs; as vizinhos) {
          <section id="vs">
            <h2>Qual dos dois eu uso?</h2>
            <p class="small muted">
              Componentes próximos a este, e o critério para escolher entre eles.
            </p>
            <ul class="vs-lista">
              @for (v of vizinhos; track v.componente) {
                <li>
                  <a class="vs-alvo" [routerLink]="['/catalogo', v.componente]">
                    {{ v.componente }}
                  </a>
                  <p class="vs-diferenca">{{ v.diferenca }}</p>
                  @if (v.escolha) {
                    <p class="vs-escolha small muted">{{ v.escolha }}</p>
                  }
                </li>
              }
            </ul>
          </section>
        }

        @if (c.conteudo) {
          <section id="conteudo">
            <h2>Conteúdo</h2>
            <ucam-loose-block [bloco]="c.conteudo" />
          </section>
        }

        <!-- As seções de extensão eram as únicas sem id da página: ficavam
             fora do índice e sem endereço para linkar. O id sai do mesmo campo
             que vira o rótulo, então não há segunda lista para desalinhar. -->
        @for (ext of extensoes(); track ext.rotulo) {
          <section [id]="'ext-' + ext.rotulo">
            <h2>{{ ext.rotulo }}</h2>
            <ucam-loose-block [bloco]="ext.bloco" />
          </section>
        }

        <section id="uso">
          <h2>Uso em código</h2>
          @for (e of c.exemplos; track e.titulo) {
            <h4>{{ e.titulo }}</h4>
            <pre class="code"><code>{{ e.codigo }}</code></pre>
          }
        </section>

        <section id="composicao">
          <h2>Composição</h2>
          @if (c.composicao?.$descricao) {
            <p>{{ c.composicao?.$descricao }}</p>
          }
          @if (c.composicao?.usa?.length) {
            <h4>Usa</h4>
            <div class="chips">
              @for (u of c.composicao?.usa; track u) {
                <span class="chip">{{ u }}</span>
              }
            </div>
          }
          @if (dependentes().length) {
            <h4>Quem quebra se este mudar</h4>
            <div class="chips">
              @for (d of dependentes(); track d.id) {
                <a class="chip" [routerLink]="'/catalogo/' + d.id">{{ d.name }}</a>
              }
            </div>
          } @else {
            <p class="small muted">Nenhum contrato declara depender deste.</p>
          }
        </section>

        @if (decisoes().length) {
          <section id="decisoes">
            <h2>Decisões que governam este componente</h2>
            <div class="grade-cartoes">
              @for (a of decisoes(); track a.slug) {
                <a class="card cartao-adr plain" [routerLink]="'/decisoes/' + a.slug">
                  <span class="ucam-icon-tile" aria-hidden="true">
                    <svg class="ic"><use href="#i-scrollText" /></svg>
                  </span>
                  <code class="adr-id">{{ a.id }}</code>
                  <span class="adr-titulo">{{ a.titulo }}</span>
                </a>
              }
            </div>
          </section>
        }

        <!-- Evidência e migração ficam recolhidas no rodapé de propósito.
             São o histórico de como o componente nasceu e o caminho de saída
             do legado — assunto real, mas não o que se procura ao abrir a
             página de um componente. -->
        @if (c.evidencia || c.migracao) {
          <section class="arquivo" id="evidencia">
            <h2>Legado e migração</h2>

            @if (c.evidencia; as ev) {
              <ucam-section-bar
                title="Evidência no legado"
                [level]="3"
                [count]="ev.ocorrencias.length + ' ocorrências'"
                collapsible
                [open]="false"
              >
                <div ucamSecao>
                <p class="small muted">
                  Origem: <code>{{ ev.origem }}</code>
                </p>
                <div class="scroller">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Tela</th>
                        <th scope="col">Rótulo</th>
                        <th scope="col">Problema observado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (o of ev.ocorrencias; track $index) {
                        <tr>
                          <td>
                            {{ o.tela }}
                            @if (o.origem) {
                              <span class="chip">{{ o.origem }}</span>
                            }
                          </td>
                          <td>
                            @if (o.rotulo) {
                              <code>{{ o.rotulo }}</code>
                            }
                          </td>
                          <td>{{ o.problema }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                @if (ev.conclusao) {
                  <p><strong class="k">Conclusão.</strong> {{ ev.conclusao }}</p>
                }
              </div>
              </ucam-section-bar>
            }

            @if (c.migracao; as mig) {
              <ucam-section-bar title="Migração" [level]="3" collapsible [open]="false">
                <div ucamSecao>
                <p class="small muted">De: {{ mig.de }}</p>
                <div class="scroller">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Legado</th>
                        <th scope="col">Novo</th>
                        <th scope="col">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of mig.mapa; track $index) {
                        <tr>
                          <td>{{ m.legado }}</td>
                          <td><code>{{ m.novo }}</code></td>
                          <td>{{ m.nota ?? '' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              </ucam-section-bar>
            }
          </section>
        }
      </div>
    }
  `,
  styles: `
    /* A grade de duas colunas mora em styles.css, na classe .pagina — são dez
       páginas com navegação de âncora, e cada uma redeclarando a grade era o
       mesmo erro dos três ritmos de seção. Aqui fica só o que é desta página. */

    /* Uma variante por bloco, com respiro de seção — o valor do enum é o
       assunto, não uma célula de tabela. */
    .variante {
      padding-block: 1rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      max-inline-size: var(--measure);
    }
    .variante:first-of-type {
      border-block-start: 0;
      padding-block-start: 0.25rem;
    }
    .variante h3 {
      margin: 0 0 0.4rem;
      font-size: 1rem;
    }
    .variante h3 code {
      font-size: 0.9em;
      background: var(--ucam-color-surface-subtle);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-sm);
      padding: 0.1rem 0.4rem;
    }
    .variante p {
      margin: 0 0 0.5rem;
    }
    .variante p:last-child {
      margin-block-end: 0;
    }
    .variante .tokens {
      display: flex;
      flex-wrap: wrap;
      gap: 0.15rem 1rem;
    }
    /* "Aparência por variant" — o qualificador não compete com o substantivo. */
    h2 .por {
      font-weight: 400;
      color: var(--ucam-color-text-secondary);
    }

    .prose {
      max-inline-size: none;
    }
    /* Respiro entre a demo viva e o painel: eram duas molduras coladas. */
    .abertura ucam-demo-viva {
      display: block;
      margin-block-end: 2rem;
    }

    /* O ritmo entre seções mora em styles.css (--ritmo-secao), não aqui.
       Esta página tinha filete + 2,75rem enquanto /comecar usava 3rem e as
       outras onze não usavam nada — três réguas na mesma documentação. O
       filete saiu junto: nem a Vibe nem a Ant Design separam seção com linha,
       e a 72px de vão a linha só somava ruído. */
    .prose section:last-child {
      padding-block-end: 1rem;
    }

    .abertura {
      margin-block-end: 2.75rem;
    }
    .abertura .nota {
      max-inline-size: var(--measure);
      margin: 0.85rem 0 0;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.3rem 0.9rem;
      font-family: var(--f-mono);
      /* 0,7rem = 11,2px. É a régua de metadado do site e ela estava um degrau
         abaixo do piso que /fundamentos/acessibilidade cobra das próprias
         telas. Sobe para 12px, junto com os selos. */
      font-size: 0.75rem;
      letter-spacing: 0.01em;
      color: var(--ucam-color-text-secondary);
      margin: 1.1rem 0 0;
    }
    /* Ponto médio entre os itens: sem ele os quatro campos viram uma frase
       só, e o olho não sabe onde um termina. */
    .meta span + span::before {
      content: '·';
      margin-inline-end: 0.9rem;
      color: var(--ucam-color-border-default);
    }
    .meta code {
      color: var(--ucam-color-text-primary);
    }

    /* Faça/evite lado a lado. Empilha abaixo de 46rem: em coluna estreita a
       comparação some e o par vira duas frases desconexas. */
    /* Desambiguação. Uma coluna só, de propósito: o par faça/evite das boas
       práticas se lê em duas colunas porque são dois lados da MESMA regra;
       aqui cada item é um vizinho diferente, e lado a lado sugeriria uma
       comparação entre eles que não existe. */
    /* Duas colunas de peso igual: a decisão é uma comparação, e comparar exige
       os dois lados no mesmo campo de visão. Abaixo de 46rem elas empilham —
       e aí o filete lateral vira filete superior, para o "não use" nunca ser
       lido como continuação da lista de cima. */
    .quando {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
      gap: 1.25rem;
      margin-block-start: 0.75rem;
      /* Cada lado com a própria altura. Esticados, o lado curto ganha um
         vazio do tamanho da diferença — e num componente em que "não use"
         tem cinco itens contra três do "use", esse vazio é metade do bloco. */
      align-items: start;
    }
    /* A barra de 3px num fundo branco deixava o bloco com três lados abertos
       — o mesmo defeito que o .callout já tinha registrado e corrigido com
       moldura. Aqui a moldura fecha, e a barra continua dizendo o TIPO. */
    .quando-lado {
      position: relative;
      padding: 0.9rem 1rem 0.9rem 1.1rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      overflow: hidden;
    }
    .quando-lado::before {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      inline-size: 3px;
      background: var(--ucam-color-border-default);
    }
    .quando-sim::before {
      background: var(--ucam-color-feedback-success-border);
    }
    .quando-nao::before {
      background: var(--ucam-color-feedback-danger-border);
    }
    /* O ícone acompanha a tinta do título, que já é a do tom: um portador só
       por linha, e aqui o par ícone+rótulo conta como um. */
    /* Linha, não alinhamento vertical: o .ic do sistema é block, e
       vertical-align não o alcança — o símbolo saía numa linha própria por
       cima do rótulo. */
    .quando-titulo {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .quando-titulo .ic {
      inline-size: 1rem;
      block-size: 1rem;
      flex: none;
    }
    .cartao-adr {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 0.25rem 0.75rem;
      align-items: center;
      text-decoration: none;
      color: inherit;
    }
    .cartao-adr .ucam-icon-tile {
      grid-row: 1 / span 2;
    }
    .cartao-adr .adr-id {
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
    }
    .cartao-adr .adr-titulo {
      font-size: 0.8125rem;
      line-height: 1.4;
      color: var(--ucam-color-text-primary);
    }
    .cartao-adr:hover {
      border-color: var(--borda-marca);
      box-shadow: var(--sombra-hover);
    }
    .quando-titulo {
      margin: 0 0 0.4rem;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--ucam-color-text-primary);
    }
    .quando-lado .list {
      margin-block: 0;
    }
    .vs-lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .vs-lista li {
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      padding: 0.8rem 0.9rem;
      display: grid;
      gap: 0.35rem;
    }
    .vs-alvo {
      font-family: var(--ucam-typography-mono-font-family, monospace);
      font-size: 0.8125rem;
      justify-self: start;
    }
    .vs-lista p {
      margin: 0;
      font-size: 0.875rem;
      /* A medida vem da caixa, não do var(--measure) que .prose impõe a todo
         parágrafo — mesma razão do .porque das boas práticas. */
      max-inline-size: none;
    }

    .praticas {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.75rem;
    }
    .praticas li {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1px;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      overflow: hidden;
      background: var(--ucam-color-border-subtle);
    }
    @media (min-width: 46rem) {
      .praticas li {
        grid-template-columns: 1fr 1fr;
      }
      .praticas .porque {
        grid-column: 1 / -1;
      }
    }
    .praticas .lado {
      display: flex;
      gap: 0.5rem;
      margin: 0;
      padding: 0.8rem 0.9rem;
      font-size: 0.875rem;
      /* Mesmo motivo do .porque: quem define a medida aqui é a coluna da
         grade, não o var(--measure) que .prose p impõe a todo parágrafo. */
      max-inline-size: none;
    }
    /* O rótulo é palavra, não símbolo: o glifo que estava aqui ia
       aria-hidden, então quem ouve a página recebia dois trechos sem saber
       qual era qual — e a cor sozinha não pode carregar o significado
       (WCAG 1.4.1). */
    .praticas .rotulo {
      flex: none;
      min-inline-size: 2.6rem;
      font-family: var(--f-mono);
      font-size: 0.65rem;
      line-height: 1.55rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 650;
    }
    .praticas .faca {
      background: var(--ucam-color-feedback-success-background);
      color: var(--ucam-color-feedback-success-foreground);
    }
    .praticas .evite {
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    .praticas .porque {
      margin: 0;
      padding: 0.65rem 0.9rem;
      background: var(--ucam-color-surface-default);
      /* .prose p limita todo parágrafo a var(--measure). Aqui isso deixava a
         faixa do "porque" mais curta que a linha e expunha o fundo do <li>,
         que é o próprio filete de 1px — parecia célula faltando. O bloco já
         está contido pela largura do cartão. */
      max-inline-size: none;
    }

    .valores {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
      margin-block-end: 1.25rem;
    }
    .valor {
      padding: 0.9rem 1rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-lg);
      background: var(--ucam-color-surface-default);
    }
    .valor .chave {
      font-weight: 600;
      color: var(--ucam-color-action-primary-default);
    }
    .valor p {
      margin: 0.4rem 0 0;
    }
    .par {
      display: block;
    }
    .limite {
      color: var(--ucam-color-feedback-danger-foreground);
    }

    kbd {
      font-size: 0.75rem;
      padding: 0.1rem 0.35rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-subtle);
    }

    a.chip {
      text-decoration: none;
    }
    a.chip:hover {
      border-color: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-action-primary-default);
    }

    /* --------------------------------------------------------- arquivo --- */

    /* O bloco de arquivo usa a SEÇÃO RECOLHÍVEL do próprio design system
       (section-bar, collapsible). Antes eram <details> nativos: sem seta,
       sem estado anunciado pelo aria-expanded e com um filete por baixo do
       título inteiro. O catálogo contradizia a peça que documenta.
       Aqui fica só o respiro entre uma seção e a seguinte. */
    .arquivo ucam-section-bar + ucam-section-bar {
      margin-block-start: 0.5rem;
    }
    .arquivo ucam-section-bar [ucamSecao] > :last-child {
      margin-block-end: 1.25rem;
    }
  `,
})
export default class ComponentePage {
  /**
   * Parâmetro de rota `[id]`, ligado por `withComponentInputBinding()`. É
   * signal: ler `rota.snapshot` num `computed` congelava a página no primeiro
   * componente aberto, porque snapshot não é reativo e o roteador reaproveita
   * a instância entre /catalogo/x e /catalogo/y.
   */
  readonly id = input('');

  protected readonly componente = computed(() => componentePorId(this.id()));

  /** Se existe demo do componente Angular real rodando nesta página. */
  protected readonly temDemoViva = computed(() => TEM_DEMO_VIVA.has(this.id()));

  protected readonly propsComValores = computed(() =>
    (this.componente()?.props ?? []).filter((p) => p.valores),
  );

  /**
   * O índice da página.
   *
   * Espelha, na ordem, as condições do template. Fica aqui e não numa varredura
   * do DOM de propósito: no prerender não há DOM para varrer, e um índice que
   * só aparecesse depois da hidratação seria um salto de layout em toda página.
   * O preço é que uma seção nova precisa ser somada nos dois lugares — por isso
   * o índice inteiro cabe em uma tela.
   */
  protected readonly indice = computed(() => {
    const c = this.componente();
    if (!c) return [];

    const itens: Ancora[] = [{ id: 'exemplo', rotulo: 'Exemplo' }];
    const põe = (cond: unknown, id: string, rotulo: string, sub = false) => {
      if (cond) itens.push({ id, rotulo, sub });
    };

    põe(c.quando_usar?.length || c.limites, 'quando', 'Quando usar');

    // Mesma condição do template, palavra por palavra: a seção do Trilho A só
    // existe quando há demo viva E preview, porque só aí ela distingue algo.
    põe(this.temDemoViva() && c.demo?.principal, 'trilho-a', 'Em CSS puro');
    põe(c.demo?.instalacao, 'instalacao', 'Instalação');
    põe(c.demo?.exemplos?.length, 'variacoes', 'Variações');

    for (const p of this.propsComValores()) {
      itens.push({ id: `variantes-${p.nome}`, rotulo: `Aparência por ${p.nome}` });
      for (const chave of Object.keys(p.valores ?? {})) {
        itens.push({ id: `v-${p.nome}-${chave}`, rotulo: chave, sub: true });
      }
    }

    itens.push({ id: 'props', rotulo: 'Props' });
    itens.push({ id: 'anatomia', rotulo: 'Anatomia' });
    itens.push({ id: 'acessibilidade', rotulo: 'Acessibilidade' });

    põe(c.boas_praticas, 'boas-praticas', 'Boas práticas');
    põe(c.vs, 'vs', 'Qual dos dois eu uso?');
    põe(c.conteudo, 'conteudo', 'Conteúdo');
    for (const ext of this.extensoes()) itens.push({ id: `ext-${ext.rotulo}`, rotulo: ext.rotulo });
    itens.push({ id: 'uso', rotulo: 'Uso em código' });
    itens.push({ id: 'composicao', rotulo: 'Composição' });
    põe(this.decisoes().length, 'decisoes', 'Decisões');
    põe(c.evidencia, 'evidencia', 'Legado e migração');

    return itens;
  });

  /**
   * O preview do Trilho A deste componente abre uma lista NATIVA.
   *
   * Vem do markup do próprio preview, não de uma lista de ids escrita à mão:
   * componente novo que use `<select>` no Trilho A ganha o aviso sozinho, e
   * um que deixe de usar perde. É a diferença entre um portão e um lembrete.
   */
  protected readonly temListaNativa = computed(() =>
    /<select\b/.test(this.componente()?.demo?.principal?.preview ?? ''),
  );

  protected readonly dependentes = computed(() => dependentesDe(this.componente()?.id ?? ''));

  protected readonly decisoes = computed(() => decisoesQueAfetam(this.componente()?.id ?? ''));

  /**
   * Seções de extensão presentes neste contrato. A lista de nomes é fixa
   * porque o JSON Schema a fixa; o que varia é quais existem em cada
   * componente.
   */
  protected readonly extensoes = computed(() => {
    const c = this.componente();
    if (!c) return [];
    const nomes = [
      ['schemas', 'Tipos'],
      ['responsividade', 'Responsividade'],
      ['foco', 'Foco'],
      ['rolagem', 'Rolagem'],
      ['dependencia', 'Dependência entre campos'],
      ['obrigatoriedade', 'Obrigatoriedade'],
      ['formatacao', 'Formatação'],
    ] as const;
    return nomes
      .map(([chave, rotulo]) => ({ rotulo, bloco: c[chave] }))
      .filter((e) => e.bloco);
  });
}
