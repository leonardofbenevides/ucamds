import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * O catálogo de ícones.
 *
 * Existia em spec/icons.json desde o começo, alimentava a biblioteca Angular e
 * os docs em Markdown, e não chegava ao site: o único conjunto de ícones da
 * universidade era invisível para quem desenha as telas. É a lacuna que produz
 * o defeito que o próprio contrato cita — no Portal, o mesmo capelo
 * identificando três módulos diferentes.
 *
 * O desenho vem do sprite real, o mesmo que as telas usam. Um catálogo pintado
 * com outra fonte de ícone documentaria um conjunto que não existe.
 */
@Component({
  selector: 'ucam-icones',
  imports: [PageHeaderComponent, NestaPaginaComponent, FormsModule],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Ícones'"
      [lede]="i.descricao"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="regras">
        <h2>Regras</h2>
        <div class="callout">
          <p><strong>{{ i.meta['regra'] }}</strong></p>
        </div>
        <ul class="list">
          @for (r of i.regras; track r) {
            <li>{{ r }}</li>
          }
        </ul>
      </section>

      <section id="tamanho">
        <h2>Tamanho e traço</h2>
        <p>{{ i.meta['tamanho'] }}</p>
        <p>{{ i.meta['traco'] }}</p>

        <div class="ucam palco-tamanhos">
          <div class="degrau">
            <div class="papel">
              <span class="ucam-badge ucam-badge--info">
                <svg class="ic" aria-hidden="true"><use href="#i-info" /></svg> Em análise
              </span>
            </div>
            <p class="rotulo">Miúdo — selo, chip, botão, célula de tabela, item de menu</p>
            <p class="small muted num">16px · size.icon-sm</p>
          </div>
          <div class="degrau">
            <div class="papel">
              <span class="ucam-icon-tile">
                <svg class="ic" aria-hidden="true"><use href="#i-graduationCap" /></svg>
              </span>
            </div>
            <p class="rotulo">Padrão — navegação, ladrilho, e o que não for miúdo</p>
            <p class="small muted num">20px · size.icon-md</p>
          </div>
          <div class="degrau">
            <div class="papel">
              <span class="ucam-empty">
                <svg class="ic" aria-hidden="true"><use href="#i-search" /></svg>
              </span>
            </div>
            <p class="rotulo">Estado vazio</p>
            <p class="small muted num">24px · size.icon-lg</p>
          </div>
        </div>

        <!-- O aviso anterior contava classes: .ic-sm 320 vezes, .ic 11, e as
             outras três declaradas e nunca aplicadas. Ele descrevia um estado
             que não existe mais. -->
        <div class="callout">
          <p>
            <strong>O degrau é do papel, e a marcação escreve só <code>.ic</code>.</strong> Havia
            cinco classes de tamanho — <code>.ic-sm</code> a <code>.ic-xl</code>, em
            14&nbsp;·&nbsp;16&nbsp;·&nbsp;20&nbsp;·&nbsp;28px — concorrendo com regras de contexto
            na folha. O resultado estava nas telas: o mesmo selo saía com 14px numa e 16 em outra,
            e os degraus de 20 e 24 não apareciam em tela nenhuma. O de 14 nem existia na escala
            escrita.
          </p>
          <p>
            A regra passou a morar em um lugar só — a seção <em>escala de ícone por papel</em> do
            gerador da folha, no Trilho A, e o <code>input size</code> do
            <code>&lt;ucam-icon&gt;</code>, no Trilho B, que já entregava 20px por omissão. Os três
            degraus saem dos tokens <code>size.icon-sm/md/lg</code>, e escrever o degrau na
            marcação reprova o build.
          </p>
        </div>
      </section>

      <section id="catalogo">
        <h2>Catálogo</h2>
        <p class="small muted">
          {{ i.total }} ícones em {{ i.grupos.length }} grupos. Base Lucide, via
          <code>&#64;ng-icons/lucide</code>.
        </p>

        <label class="busca">
          <span class="sr-only">Filtrar ícones pelo nome ou pelo uso</span>
          <input
            type="search"
            placeholder="Filtrar por nome ou uso — trash, excluir, campus…"
            [ngModel]="filtro()"
            (ngModelChange)="filtro.set($event)"
          />
        </label>

        @for (g of gruposFiltrados(); track g.id) {
          <h3 [id]="'grupo-' + g.id">{{ g.nome }} <span class="muted num">{{ g.icones.length }}</span></h3>
          <ul class="grade ucam">
            @for (ic of g.icones; track ic.lucide) {
              <li class="ladrilho">
                <svg class="ic" aria-hidden="true"><use [attr.href]="'#i-' + ic.lucide" /></svg>
                <code class="nome">{{ ic.lucide }}</code>
                <span class="small muted uso">{{ ic.uso }}</span>
              </li>
            }
          </ul>
        } @empty {
          <p class="muted">Nenhum ícone casa com “{{ filtro() }}”.</p>
        }
      </section>

      <section id="acessibilidade">
        <h2>Acessibilidade</h2>
        <p>{{ i.meta['acessibilidade'] }}</p>
        <p>{{ i.meta['producao'] }}</p>
      </section>
    </div>
  `,
  styles: `
    .palco-tamanhos {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      align-items: end;
      margin-block: 1.25rem 1.75rem;
      padding: 1.5rem;
      background: var(--ucam-color-surface-canvas);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
    }
    .degrau {
      max-inline-size: 15rem;
    }
    /* O exemplo assenta numa linha de base comum: com três peças de alturas
       diferentes (selo, ladrilho, disco de estado vazio), alinhar pelo topo
       faria os rótulos abaixo delas nascerem em três alturas. */
    .degrau .papel {
      display: flex;
      align-items: center;
      justify-content: center;
      min-block-size: 3rem;
    }
    .degrau p {
      margin: 0.5rem 0 0;
      font-size: 0.75rem;
    }
    .busca {
      display: block;
      margin-block: 1rem 1.5rem;
    }
    .busca input {
      inline-size: 100%;
      padding: 0.5rem 0.75rem;
      font: inherit;
      font-size: 0.875rem;
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
    }
    .busca input:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    .grade {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
      gap: 0.5rem;
      margin: 0 0 2rem;
      padding: 0;
      list-style: none;
    }
    .ladrilho {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: auto auto;
      column-gap: 0.6rem;
      align-items: center;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-control);
    }
    .ladrilho svg {
      grid-row: 1 / 3;
      color: var(--ucam-color-text-secondary);
    }
    /* .ladrilho .nome, e não .nome: o "code" do site é estilizado por
       ".prose code", que empata em especificidade com uma classe só e vence
       pela ordem da cascata. O nome saía em 14px dentro de uma coluna medida
       para 12, e "ellipsisVertical" quebrava no meio da palavra. */
    .ladrilho .nome {
      font-size: 0.75rem;
      overflow-wrap: anywhere;
    }
    .uso {
      grid-column: 2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    h3 .num {
      font-size: 0.8rem;
      font-weight: 400;
    }
  `,
})
export default class IconesPage {
  protected readonly i = fundamentos.icones;
  protected readonly filtro = signal('');

  protected readonly secoes: Ancora[] = [
    { id: 'regras', rotulo: 'Regras' },
    { id: 'tamanho', rotulo: 'Tamanho e traço' },
    { id: 'catalogo', rotulo: 'Catálogo' },
    { id: 'acessibilidade', rotulo: 'Acessibilidade' },
  ];


  /* O filtro casa NOME e USO. Só por nome, quem procura "excluir" não acha
     `trash2` — e é justamente quem não decorou o pacote que precisa da busca. */
  protected readonly gruposFiltrados = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    if (!q) return this.i.grupos;
    return this.i.grupos
      .map((g) => ({
        ...g,
        icones: g.icones.filter(
          (ic) => ic.lucide.toLowerCase().includes(q) || ic.uso.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.icones.length > 0);
  });
}
