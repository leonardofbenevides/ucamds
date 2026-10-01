import { Component } from '@angular/core';
import { UcamButton } from '@ucam/ui';

@Component({
  selector: 'app-root',
  imports: [UcamButton],
  template: `
    <main class="p-6">
      <h1 class="text-text-primary">Vestibular Online</h1>
      <ucam-button variant="primary">Iniciar prova</ucam-button>
      <ucam-button variant="secondary">Voltar</ucam-button>
    </main>
  `,
})
export class App {}
