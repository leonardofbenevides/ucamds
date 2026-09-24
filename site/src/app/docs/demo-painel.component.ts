import { ChangeDetectionStrategy, Component, computed, inject, input, signal, ElementRef, viewChild, afterNextRender, DestroyRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import type { DemoPainel } from '../spec/spec.types';

let seq = 0;

/**
 * Painel de demonstração: preview à esquerda das abas, código atrás.
 *
 * O preview é o HTML de spec/demos.json renderizado por @ucam/css — o MESMO
 * arquivo que os apps legados carregam, copiado para src/generated pelo
 * build-index. Mudou o token na spec, muda o que se vê aqui; nada disso é
 * maquete escrita à mão.
 *
 * `bypassSecurityTrustHtml` é deliberado e seguro: a origem do HTML é a spec
 * do próprio repositório, resolvida em tempo de build. Sanitizar apagaria os
 * atributos `style` dos previews (o sanitizador do Angular não os permite) e
 * todo layout de demo cairia em coluna.
 */
@Component({
  selector: 'ucam-demo-painel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let d = painel();

    <figure class="demo">
      @if (d.titulo) {
        <figcaption class="demo-cabeca">
          <h3>{{ d.titulo }}</h3>
          @if (d.descricao) {
            <p>{{ d.descricao }}</p>
          }
        </figcaption>
      }

      <div class="painel">
        <div class="painel-abas" role="tablist" [attr.aria-label]="d.titulo ?? 'Demonstração'">
          @if (temPreview()) {
            <button
              type="button"
              role="tab"
              class="aba"
              [attr.aria-selected]="aba() === 'preview'"
              [attr.aria-controls]="id + '-p'"
              (click)="aba.set('preview')"
            >
              Preview
            </button>
          }
          <button
            type="button"
            role="tab"
            class="aba"
            [attr.aria-selected]="aba() === 'codigo'"
            [attr.aria-controls]="id + '-c'"
            (click)="aba.set('codigo')"
          >
            Código
          </button>

          <button type="button" class="copiar" (click)="copiar(d.codigo)">
            {{ copiado() ? 'Copiado' : 'Copiar' }}
          </button>
        </div>

        @if (temPreview()) {
          <div
            #palco
            class="painel-corpo palco"
            [class.rolavel]="rolavel()"
            [id]="id + '-p'"
            role="tabpanel"
            [hidden]="aba() !== 'preview'"
          >
            <div class="ucam" [innerHTML]="html()"></div>
          </div>
        }

        <div
          class="painel-corpo codigo"
          [id]="id + '-c'"
          role="tabpanel"
          [hidden]="aba() !== 'codigo'"
        >
          <pre><code>{{ d.codigo }}</code></pre>
        </div>
      </div>
    </figure>
  `,
  styles: `
    .demo {
      margin: 0 0 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .demo-cabeca {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    /* O título do demo é DEGRAU, não rótulo de caixa: ele encabeça um painel
       com descrição própria. Em 0,9375rem = 15px ficava menor que o corpo da
       página e a um pixel da descrição de 14px que vem logo abaixo — título e
       legenda liam como o mesmo nível. 17px é o degrau de subseção da régua:
       24 (seção) · 20 (degrau) · 17 (subseção) · 16 (corpo) · 15 (rótulo de
       caixa). */
    .demo-cabeca h3 {
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.012em;
      margin: 0;
    }
    .demo-cabeca p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--ucam-color-text-secondary);
      max-inline-size: var(--measure);
    }

    /* Aba, preview e código dividem o mesmo recuo lateral: o rótulo da aba cai
       na mesma vertical do conteúdo abaixo dele. */
    /* SEM overflow: hidden. O painel recortava tudo que saísse dele — e o que
       sai dele é justamente a lista aberta de um Select ou de um Menu, que é
       position: absolute e cresce para baixo do palco. Medido em 10/09/2026:
       a lista do Select vazava 45px do palco e ficava sob a prosa seguinte,
       com barra de rolagem no palco. O raio que o overflow garantia passa a
       vir dos cantos das peças de dentro. */
    .painel {
      --recuo: 1.25rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
    }
    /* A barra de abas fica no papel claro e o palco abaixo dela no cinza: a
       inversão é o que faz o painel ler como um objeto com cabeçalho em vez de
       duas caixas empilhadas. Tingir as duas apagaria a diferença. */
    .painel-abas {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding-inline: var(--recuo);
      border-start-start-radius: inherit;
      border-start-end-radius: inherit;
      background: var(--ucam-color-surface-default);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .aba {
      background: none;
      border: 0;
      border-block-end: 2px solid transparent;
      margin-block-end: -1px;
      padding: 0.6rem 0;
      font: inherit;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      transition: color var(--transicao);
    }
    .aba:hover {
      color: var(--ucam-color-text-primary);
    }
    .aba[aria-selected='true'] {
      color: var(--ucam-color-text-primary);
      font-weight: 560;
      border-block-end-color: var(--ucam-color-action-primary-default);
    }
    /* "Copiar" era texto solto no canto, do mesmo tamanho e cor do resto da
       barra — lia como legenda, não como botão. Vira um botão fantasma com
       caixa própria: continua discreto e passa a parecer clicável. */
    .copiar {
      margin-inline-start: auto;
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-controle);
      padding: 0.2rem 0.55rem;
      font: inherit;
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      transition:
        color var(--transicao),
        border-color var(--transicao);
    }
    .copiar:hover {
      color: var(--ucam-color-text-primary);
      border-color: var(--ucam-color-border-default);
    }
    .painel-corpo {
      padding: 1.75rem var(--recuo);
      border-end-start-radius: inherit;
      border-end-end-radius: inherit;
    }
    /* BRANCO desde 20/09/2026 (ADR-040), como o chão da aplicação. Era o cinza
       de palco, que dizia "isto é uma amostra, não conteúdo da página" — e o
       argumento era que sem ele o preview de um componente claro não teria
       borda perceptível sobre papel branco. Quem dá essa borda é a MOLDURA DO
       PAINEL, que existe aqui porque o painel tem abas: o palco é o corpo de
       uma delas, não uma caixa solta. O cinza estava dizendo pela segunda vez
       o que o filete já dizia, e pondo um poço cinza atrás de toda amostra do
       catálogo. A elevacao.page e a telas/index já faziam palco em canvas com
       filete — agora é a regra, e não a exceção. */
    .painel-corpo.palco {
      display: flex;
      align-items: center;
      min-block-size: 5.5rem;
      background-color: var(--ucam-color-surface-canvas);
    }
    /* Rolagem horizontal SÓ quando o preview é mais largo que o palco — uma
       tabela de doze colunas, um app-shell. overflow-x: auto força overflow-y
       para auto junto (é do CSS, não escolha), e isso recorta a lista aberta
       de qualquer dropdown do preview. Então a classe é medida, não fixa:
       o componente observa a largura e só liga a rolagem quando ela é
       necessária. No preview largo com dropdown, a rolagem ganha — é a
       exceção declarada, e a tabela sem rolagem estouraria a página. */
    .painel-corpo.palco.rolavel {
      overflow-x: auto;
    }
    /* O palco entrega a largura toda ao preview: sem isto uma tabela ou um
       app-shell encolhem ao conteúdo e ficam desalinhados da moldura. */
    .painel-corpo.palco > .ucam {
      inline-size: 100%;
    }
    .painel-corpo.codigo {
      padding: 0;
      background: var(--ucam-color-surface-subtle);
    }
    .painel-corpo.codigo pre {
      margin: 0;
      padding: 1.05rem var(--recuo);
      overflow-x: auto;
      font-family: var(--f-mono);
      font-size: 0.8125rem;
      line-height: 1.7;
      color: var(--ucam-color-text-secondary);
    }
    .painel-corpo.codigo code {
      background: none;
      border: 0;
      padding: 0;
      font-size: 1em;
    }
  `,
})
export class DemoPainelComponent {
  readonly painel = input.required<DemoPainel>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly id = `demo-${++seq}`;
  protected readonly aba = signal<'preview' | 'codigo'>('preview');
  protected readonly copiado = signal(false);

  protected readonly temPreview = computed(() => !!this.painel().preview?.trim());

  /** O preview é mais largo que o palco? Medido, nunca declarado. */
  protected readonly rolavel = signal(false);
  private readonly palco = viewChild<ElementRef<HTMLElement>>('palco');

  private observarLargura(): void {
    const el = this.palco()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const miolo = el.firstElementChild as HTMLElement | null;
    if (!miolo) return;
    const medir = () => this.rolavel.set(miolo.scrollWidth > el.clientWidth + 1);
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    ro.observe(miolo);
    medir();
    this.destroy.onDestroy(() => ro.disconnect());
  }

  private readonly destroy = inject(DestroyRef);

  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.painel().preview ?? ''),
  );

  constructor() {
    // Sem preview, a única aba possível é a do código.
    queueMicrotask(() => {
      if (!this.temPreview()) this.aba.set('codigo');
    });
    // Só no navegador: no prerender não há ResizeObserver nem largura. O
    // HTML estático sai sem rolagem, e o primeiro layout hidratado corrige.
    afterNextRender(() => this.observarLargura());
  }

  protected async copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 1600);
    } catch {
      // Navegador sem permissão de área de transferência: o código está à
      // vista na aba, então não há o que recuperar.
    }
  }
}
