import { Component, computed, inject } from '@angular/core';
import { UcamIconButton } from '@ucam/ui';
import { Tema } from '../core/tema';

/** Interruptor claro/escuro. O rótulo nomeia a ação, não o estado. */
@Component({
  selector: 'app-tema-toggle',
  imports: [UcamIconButton],
  template: `<ucam-icon-button [icon]="icone()" [label]="rotulo()" variant="ghost" size="sm" (click)="tema.alternar()" />`,
})
export class TemaToggle {
  readonly tema = inject(Tema);
  readonly icone = computed(() => (this.tema.efetivo() === 'dark' ? 'sun' : 'moon'));
  readonly rotulo = computed(() => (this.tema.efetivo() === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'));
}
