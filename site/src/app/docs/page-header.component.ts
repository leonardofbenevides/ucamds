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
}
