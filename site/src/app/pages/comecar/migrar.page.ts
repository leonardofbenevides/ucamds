import { Component, ChangeDetectionStrategy, computed } from '@angular/core';

import { componentes, migracao } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * O guia de migração.
 *
 * A prosa vem de spec/migracao.json. O MAPA legado→novo NÃO vem: ele é composto
 * aqui, a partir da seção `migracao` de cada contrato. É a regra do spec/README
 * aplicada — se uma informação existe em dois lugares, um deles está errado —, e
 * o efeito prático é que um contrato novo aparece nesta tabela sem ninguém
 * lembrar de vir aqui.
 */
@Component({
  selector: 'ucam-migrar',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Começar"
      [titulo]="'Migrar uma tela'"
      [lede]="m.$lede"
      [porque]="m.$description"
    />

    <ucam-nesta-pagina [secoes]="secoes()" />

    <div class="prose largo">
      <section id="trilho">
        <h2>1. Escolher o trilho</h2>
        <p>{{ m.escolhaDoTrilho.$descricao }}</p>

        <div class="trilhos">
          @for (t of m.escolhaDoTrilho.trilhos; track t.id) {
            <article class="card trilho-cartao">
              <header>
                <span class="ucam-icon-tile" aria-hidden="true">
                  <svg class="ic"><use [attr.href]="'#i-' + iconeDoTrilho(t.id)" /></svg>
                </span>
                <h3>{{ t.nome }}</h3>
              </header>
              <dl>
                <dt>Quando</dt><dd>{{ t.quando }}</dd>
                <dt>Entrega</dt><dd>{{ t.entrega }}</dd>
                <dt>Não entrega</dt><dd>{{ t.naoEntrega }}</dd>
                <dt>Custo</dt><dd>{{ t.custo }}</dd>
              </dl>
              <p class="armadilha">
                <svg class="ic" aria-hidden="true"><use href="#i-triangleAlert" /></svg>
                <span>{{ t.armadilha }}</span>
              </p>
            </article>
          }
        </div>

        <p class="small muted">{{ m.escolhaDoTrilho.misturar }}</p>
      </section>

      <section id="ordem">
        <h2>2. A ordem das operações</h2>
        <p>{{ m.ordem.$descricao }}</p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Passo</th>
                <th scope="col">O que fazer</th>
                <th scope="col">Por quê</th>
                <th scope="col">Como conferir</th>
              </tr>
            </thead>
            <tbody>
              @for (p of m.ordem.passos; track p.n) {
                <tr>
                  <th scope="row">{{ p.n }}. {{ p.titulo }}</th>
                  <td class="small">{{ p.o_que }}</td>
                  <td class="small muted">{{ p.por_que }}</td>
                  <td class="small">{{ p.verificar }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="mudancas">
        <h2>3. O que quem usa vai notar</h2>
        <p>{{ m.mudancasVisiveis.$descricao }}</p>

        <div class="pontos">
          @for (i of m.mudancasVisiveis.itens; track i.adr) {
            <div class="ponto" data-tom="atencao">
              <span class="ucam-icon-tile" aria-hidden="true">
                <svg class="ic"><use href="#i-eye" /></svg>
              </span>
              <h3>{{ i.mudanca }}</h3>
              <p>{{ i.resposta }}</p>
              <p class="porque">
                <a [href]="'/decisoes/' + adrSlug(i.adr)">{{ i.adr }}</a>
              </p>
            </div>
          }
        </div>
      </section>

      <section id="anatomia">
        <h2>4. As quatro camadas de uma tela</h2>
        <p>{{ m.anatomiaDeTela.$descricao }}</p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Camada</th>
                <th scope="col">Quem resolve</th>
                <th scope="col">Responde</th>
                <th scope="col">Erro comum</th>
              </tr>
            </thead>
            <tbody>
              @for (c of m.anatomiaDeTela.camadas; track c.camada) {
                <tr>
                  <th scope="row">{{ c.camada }}</th>
                  <td class="small"><code>{{ c.quem }}</code></td>
                  <td class="small">{{ c.responde }}</td>
                  <td class="small muted">{{ c.erro_comum }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="mapa">
        <h2>5. Mapa de conversão</h2>
        <!-- O ÍNDICE, E NÃO OS TRINTA MAPAS. Esta seção repetia aqui a tabela
             de conversão de cada componente — 161 linhas ao todo — enquanto
             cada uma dessas tabelas já vive no contrato do próprio componente,
             que é a fonte. O resultado era uma página de 41 mil pixels de
             altura, em que a única forma de achar o mapa do Select era rolar
             até ele. Aqui fica quem tem mapa e do que ele substitui; o mapa
             inteiro está a um clique, no lugar onde ele é mantido. -->
        <p>
          O que cada peça do legado vira. O mapa completo de cada componente vive no
          contrato dele — abaixo está quem tem mapa, e o que ele substitui.
        </p>

        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Componente</th>
                <th scope="col">Substitui</th>
                <th scope="col">Conversões</th>
              </tr>
            </thead>
            <tbody>
              @for (c of comMigracao(); track c.id) {
                <tr>
                  <td>
                    <a [href]="'/catalogo/' + c.id">{{ c.name }}</a>
                    <code class="small muted">&lt;{{ c.selector }}&gt;</code>
                  </td>
                  <td class="small muted">{{ c.migracao!.de }}</td>
                  <td class="num">{{ c.migracao!.mapa.length }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="erros">
        <h2>6. Os erros que sobrevivem à migração</h2>
        <p>{{ m.errosQueSobrevivem.$descricao }}</p>

        @for (e of m.errosQueSobrevivem.itens; track e.erro) {
          <div class="callout callout-limit">
            <p><strong class="k">{{ e.erro }}</strong></p>
            <p class="small muted">
              <strong class="k">Passa despercebido porque.</strong> {{ e.porque_sobrevive }}
            </p>
            <p class="small"><strong class="k">Certo.</strong> {{ e.certo }}</p>
          </div>
        }
      </section>

      <section id="checklist">
        <h2>7. Conferência de tela</h2>
        <p>{{ m.checklistDeTela.$descricao }}</p>

        @for (g of m.checklistDeTela.grupos; track g.grupo) {
          <section [id]="'check-' + slug(g.grupo)">
            <h3>{{ g.grupo }}</h3>
            <ul>
              @for (i of g.itens; track i) {
                <li>{{ i }}</li>
              }
            </ul>
          </section>
        }
      </section>

      <section id="onde">
        <h2>8. Onde está o quê</h2>
        <p>{{ m.ondeEstaOQue.$descricao }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Pergunta</th>
                <th scope="col">Onde responder</th>
              </tr>
            </thead>
            <tbody>
              @for (i of m.ondeEstaOQue.itens; track i.pergunta) {
                <tr>
                  <th scope="row" class="small">{{ i.pergunta }}</th>
                  <td class="small"><code>{{ i.onde }}</code></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="lacunas">
        <h2>9. O que ainda não existe</h2>
        <p>{{ m.aindaNaoExiste.$descricao }}</p>

        <div class="callout callout-warn">
          <p class="small">{{ m.aindaNaoExiste.regra }}</p>
        </div>

        <h3>Contratos sem implementação Angular</h3>
        <p class="small muted">
          {{ m.aindaNaoExiste.semAngular.length }} de {{ total }} contratos. Desenhados no
          Trilho A, sem componente no Trilho B — o comportamento é da tela até que o
          componente exista.
        </p>
        <p>
          @for (c of m.aindaNaoExiste.semAngular; track c.id) {
            <a class="pill" [href]="'/catalogo/' + c.id"><code>{{ c.selector }}</code></a>
          }
        </p>

        <h3>Avisos</h3>
        <ul>
          @for (a of m.aindaNaoExiste.avisos; track a) {
            <li class="small">{{ a }}</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    /* OS DOIS TRILHOS LADO A LADO. minmax de 20rem porque o cartão carrega uma
       lista de definição de quatro linhas: abaixo disso o valor quebra em três
       linhas e a comparação entre os dois vira rolagem vertical. */
    .trilhos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
      gap: 1rem;
      align-items: start;
      margin-block: 1.25rem 1.75rem;
    }
    .trilho-cartao header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-block-end: 0.85rem;
    }
    .trilho-cartao h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.008em;
    }
    /* Rótulo em cima, valor embaixo — e não o par lado a lado. Com "Não
       entrega" de rótulo, a coluna da esquerda ficaria larga o bastante para
       espremer o valor, que é a parte que se lê. */
    .trilho-cartao dl {
      display: grid;
      gap: 0.15rem;
      margin: 0;
    }
    .trilho-cartao dt {
      font-size: 0.6875rem;
      font-weight: 560;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ucam-color-text-secondary);
    }
    .trilho-cartao dt:not(:first-of-type) {
      margin-block-start: 0.6rem;
    }
    .trilho-cartao dd {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.5;
    }
    /* A armadilha é o pé do cartão e o único portador de tom nele: o ícone
       leva a tinta de atenção, o resto continua neutro. */
    .trilho-cartao .armadilha {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 0.5rem;
      align-items: start;
      margin: 1rem 0 0;
      padding-block-start: 0.75rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--ucam-color-text-secondary);
    }
    .trilho-cartao .armadilha .ic {
      inline-size: 0.875rem;
      block-size: 0.875rem;
      margin-block-start: 0.15rem;
      color: var(--ucam-color-feedback-warning-foreground);
    }
  `,
})
export default class MigrarPage {
  protected readonly m = migracao;
  protected readonly total = componentes.length;

  /** Só os contratos que declaram mapa de migração, em ordem alfabética. */
  protected readonly comMigracao = computed(() =>
    componentes.filter((c) => c.migracao?.mapa?.length),
  );

  protected slug(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** ADR-004 → adr-004, que é o slug que build-index gera. */
  protected adrSlug(id: string): string {
    return this.slug(id);
  }

  /** Um símbolo por trilho: folha de estilo, peça embalada, biblioteca. O
   *  ternário anterior dava o mesmo ícone para A+ e B, e dois trilhos com o
   *  mesmo desenho numa comparação lado a lado desfazem a comparação. */
  protected iconeDoTrilho(id: string): string {
    return { a: 'fileText', 'a-mais': 'archive', b: 'layoutGrid' }[id] ?? 'fileText';
  }

  protected readonly secoes = computed<Ancora[]>(() => [
    { id: 'trilho', rotulo: '1. Escolher o trilho' },
    { id: 'ordem', rotulo: '2. A ordem das operações' },
    { id: 'mudancas', rotulo: '3. O que quem usa vai notar' },
    { id: 'anatomia', rotulo: '4. As quatro camadas' },
    // Os trinta sub-itens saíram junto com as trinta tabelas: âncora para
    // seção que não existe mais é link morto, e índice de uma tabela só é
    // ruído — o índice tinha mais itens do que a seção tinha linhas.
    { id: 'mapa', rotulo: '5. Mapa de conversão' },
    { id: 'erros', rotulo: '6. Erros que sobrevivem' },
    { id: 'checklist', rotulo: '7. Conferência de tela' },
    ...this.m.checklistDeTela.grupos.map((g) => ({
      id: 'check-' + this.slug(g.grupo),
      rotulo: g.grupo,
      sub: true,
    })),
    { id: 'onde', rotulo: '8. Onde está o quê' },
    { id: 'lacunas', rotulo: '9. O que ainda não existe' },
  ]);
}
