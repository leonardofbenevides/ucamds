import { Injectable } from '@angular/core';

/** Saídas do app para outro site. Injetável para os testes não trocarem a página. */
@Injectable({ providedIn: 'root' })
export class Navegador {
  irParaExterno(url: string): void {
    window.location.href = url;
  }
}
