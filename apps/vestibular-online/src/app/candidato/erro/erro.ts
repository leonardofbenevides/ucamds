import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UcamButton, UcamEmptyState } from '@ucam/ui';
import { CandidatoStore } from '../../core/store/candidato.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-erro',
  imports: [UcamButton, UcamEmptyState],
  template: `
    <main class="ucam-content ucam-content--estreita">
      <h1 class="ucam-sr-only">Vestibular Online</h1>
      <ucam-empty-state
        reason="error"
        title="Não conseguimos localizar sua inscrição"
        [description]="'Confira o link que veio no e-mail de inscrição. Se o problema continuar, fale com a secretaria: ' + contato"
      >
        <ucam-button variant="primary" (click)="tentar()">Tentar de novo</ucam-button>
      </ucam-empty-state>
    </main>
  `,
})
export class ErroPage {
  private readonly store = inject(CandidatoStore);
  private readonly router = inject(Router);
  readonly contato = environment.contatoSecretaria;
  tentar(): void {
    this.router.navigate(['/candidato', this.store.oidFip()]);
  }
}
