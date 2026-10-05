import { Injectable, computed, signal } from '@angular/core';

export type EscolhaTema = 'light' | 'dark' | 'sistema';

/**
 * Tema claro/escuro. Os tokens do DS seguem o sistema por padrão e obedecem a
 * `data-theme` no <html> quando a pessoa escolhe; a escolha fica no navegador.
 */
@Injectable({ providedIn: 'root' })
export class Tema {
  readonly atual = signal<EscolhaTema>('sistema');

  /** O tema que está de fato na tela, resolvendo "sistema". */
  readonly efetivo = computed<'light' | 'dark'>(() => {
    const a = this.atual();
    if (a !== 'sistema') return a;
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  constructor() {
    let guardado: string | null = null;
    try {
      guardado = localStorage.getItem('tema');
    } catch {
      /* sem storage */
    }
    this.definir(guardado === 'light' || guardado === 'dark' ? guardado : 'sistema', false);
  }

  definir(escolha: EscolhaTema, lembrar = true): void {
    this.atual.set(escolha);
    const raiz = document.documentElement;
    if (escolha === 'sistema') raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', escolha);
    if (!lembrar) return;
    try {
      if (escolha === 'sistema') localStorage.removeItem('tema');
      else localStorage.setItem('tema', escolha);
    } catch {
      /* sem storage */
    }
  }

  alternar(): void {
    this.definir(this.efetivo() === 'dark' ? 'light' : 'dark');
  }
}
