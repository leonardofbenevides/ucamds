import { Component, input } from '@angular/core';
import { UcamAppShell, UcamIcon } from '@ucam/ui';
import { environment } from '../../environments/environment';
import { TemaToggle } from '../layout/tema-toggle';

/**
 * A moldura do candidato fora da prova: a mesma faixa do sistema e, na
 * coluna, o que identifica o pedido que ele está acompanhando — como a
 * moldura da prova mostra quem está fazendo a prova. No pé, ajuda e tema.
 */
@Component({
  selector: 'app-moldura-isencao',
  imports: [UcamAppShell, UcamIcon, TemaToggle],
  template: `
    <ucam-app-shell systemName="Vestibular Online" systemIcon="graduationCap" systemCategory="pessoas" [homeHref]="inicio()">
      <ng-content select="[molduraColuna]" ngProjectAs="[ucamShellNav]" />
      <div ucamShellNavRodape class="ucam-cluster ucam-cluster--entre">
        <a class="ucam-link ucam-cluster" [href]="'mailto:' + contato">
          <ucam-icon name="mail" size="sm" aria-hidden="true" />
          <span>Falar com a secretaria</span>
        </a>
        <app-tema-toggle />
      </div>

      <ng-content />
    </ucam-app-shell>
  `,
})
export class MolduraIsencao {
  /** Para onde a marca do sistema leva: a própria tela de acompanhamento. */
  readonly inicio = input.required<string>();
  readonly contato = environment.contatoSecretaria;
}
