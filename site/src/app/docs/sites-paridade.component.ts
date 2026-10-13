import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import { DEMOS } from '@ucam/site-ui/demos';

import { prefixarIds } from './prefixar-ids';

/**
 * A peça dos sites duas vezes: o HTML do catálogo e a peça de @ucam/site-ui,
 * lado a lado, com o mesmo conteúdo.
 *
 * É a terceira camada do portão de paridade (spec de 10/10/2026). As duas
 * primeiras rodam sem navegador — árvore de DOM no teste, texto do contrato
 * no validador. Esta é a que mostra a quem lê, e é o par que a sonda por CDP
 * mede: `data-paridade="html"` contra `data-paridade="angular"`.
 *
 * Os componentes vêm de um arquivo GERADO das demos da spec, o mesmo que o
 * teste da lib usa. Não há demo Angular escrita à mão neste site.
 */
@Component({
  selector: 'ucam-sites-paridade',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (d of pares(); track d.titulo) {
      <figure class="par">
        <figcaption class="par-titulo">{{ d.titulo === 'principal' ? 'Exemplo' : d.titulo }}</figcaption>
        <!-- Os links das demos são de exemplo (/vagas, /inscricao): o clique
             não pode tirar o leitor da documentação. O mesmo vale para o
             envio do formulário de exemplo no lado HTML, que não tem script. -->
        <div class="lados" [class.empilhados]="empilhado()" (click)="naoNavega($event)" (submit)="$event.preventDefault()">
          <div class="lado">
            <p class="rotulo">HTML</p>
            <div class="ucam-site" data-paridade="html" [innerHTML]="d.html"></div>
          </div>
          <div class="lado">
            <p class="rotulo">Angular</p>
            <div class="ucam-site" data-paridade="angular"><ng-container *ngComponentOutlet="d.componente" /></div>
          </div>
        </div>
      </figure>
    }
  `,
  styles: `
    .par {
      margin: 0 0 1.25rem;
    }
    .par-titulo {
      margin-block-end: 0.5rem;
      font-weight: 600;
    }
    .lados {
      display: grid;
      gap: 0.75rem;
    }
    @media (min-width: 48rem) {
      .lados:not(.empilhados) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    /* Peça de moldura (hero, cabeçalho, rodapé) responde à largura da JANELA,
       não à do palco: em meia coluna, o hero achava que estava no desktop e
       punha a foto ao lado de um texto sem espaço. Um lado sobre o outro dá a
       cada um a largura inteira do conteúdo. */
    .lados.empilhados .lado {
      padding-inline: 0;
      /* clip só na horizontal: hidden criaria um contêiner de rolagem e
         cortaria o que a peça abre para baixo, como o menu do cabeçalho. */
      overflow-x: clip;
    }
    .lados.empilhados .rotulo {
      padding-inline: 1rem;
    }
    .lado {
      min-inline-size: 0;
      padding: 0.75rem 1rem 1rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-md);
      background-color: var(--ucam-color-surface-canvas);
    }
    .rotulo {
      margin: 0 0 0.75rem;
      color: var(--ucam-color-text-secondary);
      font-size: 0.8125rem;
    }
  `,
})
export class SitesParidadeComponent {
  /** O id da peça no catálogo dos sites. */
  readonly peca = input.required<string>();
  /** Um lado sobre o outro, para peça que precisa da largura inteira. */
  readonly empilhado = input(false);

  private readonly sanitizer = inject(DomSanitizer);

  protected naoNavega(evento: Event): void {
    if ((evento.target as Element | null)?.closest?.('a[href]')) evento.preventDefault();
  }

  protected readonly pares = computed(() =>
    // O lado HTML ganha ids próprios (h-): a demo aparece três vezes na página, e
    // ids iguais cruzariam o rótulo de uma cópia com o campo de outra.
    (DEMOS[this.peca()] ?? []).map((d) => ({ ...d, html: this.sanitizer.bypassSecurityTrustHtml(prefixarIds(d.html, 'h-')) })),
  );
}

/** A peça tem forma Angular? É o que decide se a seção aparece e entra no índice. */
export const temFormaAngular = (id: string): boolean => (DEMOS[id]?.length ?? 0) > 0;
