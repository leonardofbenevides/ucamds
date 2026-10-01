import { Component } from '@angular/core';
import { UcamIcon } from '@ucam/ui';

/** As três coisas que a pessoa precisa saber. Usada nas instruções e dentro da prova. */
@Component({
  selector: 'app-instrucoes-lista',
  imports: [UcamIcon],
  template: `
    <!-- Ícone e frase lado a lado sem quebrar: o .ucam-cluster embrulha quando a
         frase é longa e o ícone subia para a linha de cima. -->
    <ul class="ucam-stack" aria-label="Como a prova funciona">
      <li class="flex items-start gap-3">
        <ucam-icon name="monitor" class="shrink-0" aria-hidden="true" />
        <span>Funciona no computador e no celular. Se a conexão cair, suas respostas ficam guardadas e são enviadas quando ela voltar.</span>
      </li>
      <li class="flex items-start gap-3">
        <ucam-icon name="clock" class="shrink-0" aria-hidden="true" />
        <span>O tempo fica à vista no topo. A barra avisa quando faltar um terço e quando faltarem 10 minutos.</span>
      </li>
      <li class="flex items-start gap-3">
        <ucam-icon name="circleCheck" class="shrink-0" aria-hidden="true" />
        <span>Cada resposta é salva na hora. Você pode mudar de ideia até entregar a prova.</span>
      </li>
    </ul>
  `,
})
export class InstrucoesLista {}
