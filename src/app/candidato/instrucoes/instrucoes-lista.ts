import { Component } from '@angular/core';
import { UcamIcon } from '@ucam/ui';

/** As três coisas que a pessoa precisa saber. Usada nas instruções e dentro da prova. */
@Component({
  selector: 'app-instrucoes-lista',
  imports: [UcamIcon],
  template: `
    <ul class="ucam-stack" aria-label="Como a prova funciona">
      <li class="ucam-cluster">
        <ucam-icon name="monitor" aria-hidden="true" />
        <span>Funciona no computador e no celular. Se a conexão cair, suas respostas ficam guardadas e são enviadas quando ela voltar.</span>
      </li>
      <li class="ucam-cluster">
        <ucam-icon name="clock" aria-hidden="true" />
        <span>O tempo fica à vista no topo. A barra avisa quando faltar um terço e quando faltarem 10 minutos.</span>
      </li>
      <li class="ucam-cluster">
        <ucam-icon name="circleCheck" aria-hidden="true" />
        <span>Cada resposta é salva na hora. Você pode mudar de ideia até entregar a prova.</span>
      </li>
    </ul>
  `,
})
export class InstrucoesLista {}
