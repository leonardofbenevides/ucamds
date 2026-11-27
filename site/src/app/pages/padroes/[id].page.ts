import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { padraoPorId, componentes, telas } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';
import { TextoComponent } from '../../docs/texto.component';

@Component({
  selector: 'ucam-padrao',
  imports: [TextoComponent, RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = padrao();

    @if (!p) {
      <p class="lede">Padrão não encontrado.</p>
      <p><a routerLink="/padroes">Voltar aos padrões</a></p>
    } @else {
      <ucam-page-header secao="Padrão" [titulo]="p.nome">
        <span slot="selo" class="pill" [class]="'pill-' + p.status">{{ p.status }}</span>
        <p class="small muted"><strong class="k">Frequência.</strong> {{ p.frequencia }}</p>
      </ucam-page-header>

      <ucam-nesta-pagina [secoes]="secoes()" />

      <div class="prose">
        <div class="callout callout-limit">
          <p class="eyebrow">O problema hoje</p>
          <p><ucam-t [t]="p.problema" /></p>
        </div>

        @if (p.estrutura?.length) {
          <section id="estrutura">
            <h2>Estrutura</h2>
            <ol class="steps">
              @for (e of p.estrutura; track e) {
                <li><ucam-t [t]="e" /></li>
              }
            </ol>
          </section>
        }

        @if (p.variantes?.length) {
          <section id="variantes">
            <h2>Variantes</h2>
            <p>Cada variante tem o seu esqueleto. A tela diz qual é a sua, e é a variante que decide o que vai acima da tabela e onde fica a ação.</p>
            @for (v of variantes(); track v.id) {
              <h3 [id]="'variante-' + v.id">{{ v.nome }} <span class="small muted">{{ v.telas.length }} {{ v.telas.length === 1 ? 'tela' : 'telas' }}</span></h3>
              <p><ucam-t [t]="v.quando" /></p>
              <ol class="steps">
                @for (e of v.estrutura; track e) {
                  <li><ucam-t [t]="e" /></li>
                }
              </ol>
              @if (v.regras?.length) {
                <ul class="list">
                  @for (r of v.regras; track r) {
                    <li><ucam-t [t]="r" /></li>
                  }
                </ul>
              }
              <div class="chips">
                @for (t of v.telas; track t.rota) {
                  <a class="chip" [routerLink]="t.rota">{{ t.nome }} · {{ t.sistema }}</a>
                }
              </div>
            }
          </section>
        }

        <section id="regras">
          <h2>Regras</h2>
          <ul class="list">
            @for (r of p.regras; track r) {
              <li><ucam-t [t]="r" /></li>
            }
          </ul>
        </section>

        <section id="usa">
          <h2>Componentes que usa</h2>
          <div class="chips">
            @for (u of usa(); track u.seletor) {
              @if (u.id) {
                <a class="chip" [routerLink]="'/catalogo/' + u.id">{{ u.seletor }}</a>
              } @else {
                <span class="chip" title="Ainda sem contrato">{{ u.seletor }} ·  sem contrato</span>
              }
            }
          </div>
        </section>

        <section id="evidencia">
          <h2>Evidência</h2>
          <p class="small muted"><ucam-t [t]="p.evidencia" /></p>
        </section>
      </div>
    }
  `,
})
export default class PadraoPage {
  /** Parâmetro de rota `[id]`, ligado por `withComponentInputBinding()`. */
  readonly id = input('');

  protected readonly padrao = computed(() => padraoPorId(this.id()));

  /** Cada variante com as telas que a declaram (ADR-096): a regra e o exemplo juntos. */
  protected readonly variantes = computed(() => {
    const p = this.padrao();
    return (p?.variantes ?? []).map((v) => ({
      ...v,
      telas: telas.flatMap((proj) =>
        proj.templates
          .filter((t) => t.padrao === p!.id && t.variante === v.id)
          .map((t) => ({ nome: t.nome, sistema: proj.nome, rota: `/telas/${proj.id}/${t.id}` })),
      ),
    }));
  });

  /**
   * O padrão declara seletores (`ucam-pagination`). Alguns já têm contrato,
   * outros não — e a diferença precisa aparecer: um chip que não linka é a
   * lista de trabalho pendente.
   */
  protected readonly usa = computed(() =>
    (this.padrao()?.usa ?? []).map((seletor) => ({
      seletor,
      id: componentes.find((c) => c.selector === seletor)?.id ?? '',
    })),
  );

  /**
   * Computada porque "Estrutura" é condicional no template — a mesma condição,
   * escrita uma vez de cada lado. Âncora para seção que não existe é pior que
   * âncora nenhuma: leva a lugar nenhum e não avisa.
   */
  protected readonly secoes = computed<readonly Ancora[]>(() => {
    const p = this.padrao();
    return [
      ...(p?.estrutura?.length ? [{ id: 'estrutura', rotulo: 'Estrutura' }] : []),
      ...(p?.variantes?.length ? [{ id: 'variantes', rotulo: 'Variantes' }] : []),
      { id: 'regras', rotulo: 'Regras' },
      { id: 'usa', rotulo: 'Componentes que usa' },
      { id: 'evidencia', rotulo: 'Evidência' },
    ];
  });
}
