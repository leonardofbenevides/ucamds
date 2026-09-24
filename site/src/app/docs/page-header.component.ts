import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/** Cabeçalho padrão de página da documentação. */
@Component({
  selector: 'ucam-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cabecalho">
      @if (secao()) {
        <p class="eyebrow eyebrow-marca">{{ secao() }}</p>
      }
      <div class="linha">
        <h1 class="display">{{ titulo() }}</h1>
        <ng-content select="[slot=selo]" />
      </div>
      @if (lede()) {
        <p class="lede">{{ lede() }}</p>
      }
      <!-- O PORQUÊ VEM FECHADO. O lede era o $description da spec, que é
           racional, não chamada: oitenta palavras e nove linhas antes de a
           página começar. A chamada curta ficou no lede e o racional inteiro
           mudou para cá, sem perder uma palavra — quem está de passagem lê
           duas linhas, quem veio entender clica. -->
      @if (porque()) {
        <details class="porque">
          <summary>Por quê</summary>
          <p>{{ porque() }}</p>
        </details>
      }
      <ng-content />
    </header>
  `,
  styles: `
    /* O filete abaixo do cabeçalho é o mesmo das seções: uma régua só para a
       página inteira, e por isso o tom sutil, não o default. */
    .cabecalho {
      padding-block-end: 1.75rem;
      margin-block-end: 3rem;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .linha {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block: 0.6rem 1rem;
    }
    h1 {
      font-size: clamp(1.875rem, 3.4vw, 2.375rem);
      margin: 0;
    }
    /* O lede da página interna é CORPO (16px), não o lede de capa (19px).
       Em toda página de componente ele é o $description da spec — duas ou
       três frases — e a 19px, correndo a coluna inteira, era o maior bloco
       de texto da tela, acima do próprio conteúdo ("esse texto tá grande",
       23/09/2026). A capa fica com os 19px; aqui a hierarquia é título,
       lede em corpo, metadado em 12. */
    .cabecalho .lede {
      font-size: 1rem;
      line-height: 1.55;
      margin-block: 0;
    }
    /* Fechado, o bloco é UMA LINHA de texto secundário — não um botão, não uma
       caixa. Caixa fechada no topo de toda página seria outra moldura para o
       olho resolver antes do conteúdo, e o que está aqui dentro é opcional
       por definição. */
    .porque {
      margin-block-start: 0.85rem;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .porque summary {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
      inline-size: fit-content;
      border-radius: var(--ucam-radius-sm);
      list-style: none;
    }
    .porque summary::-webkit-details-marker {
      display: none;
    }
    /* O triângulo é desenhado aqui e gira, em vez do marcador nativo: o nativo
       não aceita cor nem tamanho, e no tema escuro ele saía preto sobre preto. */
    .porque summary::before {
      content: '';
      inline-size: 0;
      block-size: 0;
      border-block-start: 4px solid transparent;
      border-block-end: 4px solid transparent;
      border-inline-start: 5px solid currentColor;
      transition: transform var(--transicao);
    }
    .porque[open] summary::before {
      transform: rotate(90deg);
    }
    .porque summary:focus-visible {
      outline: var(--ucam-focus-ring-width, 2px) solid var(--ucam-color-border-focus);
      outline-offset: 2px;
    }
    .porque p {
      margin: 0.6rem 0 0;
      max-inline-size: var(--measure);
      text-wrap: pretty;
    }
  `,
})
export class PageHeaderComponent {
  // Nada de input.required() neste projeto: o transform do Analog exige
  // experimentalDecorators no tsconfig, e nessa combinação o valor de um
  // input obrigatório nunca chega — toda página falha com NG0950 no
  // prerender, enquanto o build ainda termina "com sucesso". Um input com
  // padrão é o que funciona; a obrigatoriedade fica com o TypeScript de quem
  // chama.
  readonly secao = input<string>('');
  readonly titulo = input<string>('');
  readonly lede = input<string>('');
  /** O racional longo da fundação — o `$description` da spec. Fica fechado. */
  readonly porque = input<string>('');
}
