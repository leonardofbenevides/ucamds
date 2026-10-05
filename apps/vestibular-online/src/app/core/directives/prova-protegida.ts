import { Directive } from '@angular/core';

/** Bloqueio leve, só no elemento da questão ou da redação. Nada global, nada de teclas. */
@Directive({
  selector: '[appProvaProtegida]',
  host: {
    '(copy)': 'bloquear($event)',
    '(cut)': 'bloquear($event)',
    '(paste)': 'bloquear($event)',
    '(contextmenu)': 'bloquear($event)',
  },
})
export class ProvaProtegida {
  bloquear(e: Event): void {
    e.preventDefault();
  }
}
