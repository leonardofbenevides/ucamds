import { Component, ChangeDetectionStrategy, Injectable, computed, input, signal } from '@angular/core';

import { resumir } from './resumo';

/**
 * Um texto da spec, mostrado pela CHAMADA.
 *
 * Entra no lugar de `{{ texto }}`: imprime a primeira frase e guarda o resto
 * num `<span class="resto">`, que só aparece no modo "Completo". A regra do
 * corte e o motivo dela estão em resumo.ts.
 *
 * Sem estilo próprio de propósito: quem esconde `.resto` é styles.css, por um
 * atributo no <html>, e por isso o prerender já entrega a página resumida —
 * não há salto de layout na hidratação nem dependência de JavaScript.
 */
@Component({
  selector: 'ucam-t',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ r().cabeca }}@if (r().resto) {<span class="resto">{{ ' ' + r().resto }}</span>}`,
})
export class TextoComponent {
  readonly t = input<unknown>('');
  protected readonly r = computed(() => resumir(this.t() == null ? "" : String(this.t())));
}

/**
 * O modo de leitura do site: `resumo` (padrão) ou `completo`.
 *
 * Mora no <html> como `data-leitura`, igual ao tema, e na mesma chave de
 * localStorage que o script de index.html lê antes da primeira pintura.
 */
@Injectable({ providedIn: 'root' })
export class Leitura {
  readonly completo = signal(false);

  constructor() {
    if (typeof localStorage === 'undefined') return;
    try {
      this.completo.set(localStorage.getItem('ucam-leitura') === 'completo');
    } catch {
      // Armazenamento bloqueado: a página segue no resumo.
    }
  }

  alternar(): void {
    const novo = !this.completo();
    this.completo.set(novo);
    if (typeof document === 'undefined') return;
    const raiz = document.documentElement;
    if (novo) raiz.setAttribute('data-leitura', 'completo');
    else raiz.removeAttribute('data-leitura');
    try {
      if (novo) localStorage.setItem('ucam-leitura', 'completo');
      else localStorage.removeItem('ucam-leitura');
    } catch {
      // Idem: vale para esta visita.
    }
  }
}
