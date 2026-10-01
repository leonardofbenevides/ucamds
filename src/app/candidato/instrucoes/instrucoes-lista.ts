import { Component, input } from '@angular/core';
import { UcamCard, UcamIcon, UcamIconName } from '@ucam/ui';

interface Orientacao {
  icone: UcamIconName;
  titulo: string;
  texto: string;
}

/** As três coisas que a pessoa precisa saber. Lista na gaveta da prova; cartões na tela de instruções. */
export const ORIENTACOES: Orientacao[] = [
  {
    icone: 'monitor',
    titulo: 'Computador ou celular',
    texto: 'Funciona nos dois. Se a conexão cair, suas respostas ficam guardadas e são enviadas quando ela voltar.',
  },
  {
    icone: 'clock',
    titulo: 'Tempo à vista',
    texto: 'O relógio fica no topo. A barra avisa quando faltar um terço e quando faltarem 10 minutos.',
  },
  {
    icone: 'circleCheck',
    titulo: 'Tudo salvo na hora',
    texto: 'Cada resposta é gravada ao escolher. Você pode mudar de ideia até entregar a prova.',
  },
];

@Component({
  selector: 'app-instrucoes-lista',
  imports: [UcamCard, UcamIcon],
  template: `
    @if (cartoes()) {
      <div class="ucam-grid" aria-label="Como a prova funciona" role="list">
        @for (o of orientacoes; track o.titulo) {
          <ucam-card role="listitem" [titulo]="o.titulo" [apoio]="o.texto" [icone]="o.icone" />
        }
      </div>
    } @else {
      <!-- Ícone e frase lado a lado sem quebrar: o .ucam-cluster embrulha quando a
           frase é longa e o ícone subia para a linha de cima. -->
      <ul class="ucam-stack" aria-label="Como a prova funciona">
        @for (o of orientacoes; track o.titulo) {
          <li class="flex items-start gap-3">
            <ucam-icon [name]="o.icone" class="shrink-0" aria-hidden="true" />
            <span><strong>{{ o.titulo }}.</strong> {{ o.texto }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class InstrucoesLista {
  readonly cartoes = input(false);
  readonly orientacoes = ORIENTACOES;
}
