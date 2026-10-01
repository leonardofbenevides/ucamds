import { Component } from '@angular/core';
import { UcamEmptyState } from '@ucam/ui';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sem-link',
  imports: [UcamEmptyState],
  template: `
    <main class="ucam-content ucam-content--estreita">
      <h1 class="ucam-sr-only">Vestibular Online</h1>
      <ucam-empty-state
        reason="no-access"
        title="Use o link da sua inscrição"
        [description]="'Para fazer a prova, abra o link que a universidade enviou por e-mail. Dúvidas: ' + contato"
      />
    </main>
  `,
})
export class SemLinkPage {
  readonly contato = environment.contatoSecretaria;
}
