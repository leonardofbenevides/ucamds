import { Injectable, computed, signal } from '@angular/core';

export type EscolhaTema = 'light' | 'dark' | 'sistema';

/**
 * Tema claro/escuro. O CLARO é o padrão (ADR-065 do DS, 06/10/2026): sem
 * escolha guardada o app abre claro. As três escolhas gravam `data-theme` no
 * <html> — light, dark ou system, que é "como o dispositivo" — e ficam no
 * navegador.
 */
@Injectable({ providedIn: 'root' })
export class Tema {
  readonly atual = signal<EscolhaTema>('light');

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
    this.definir(guardado === 'dark' || guardado === 'sistema' ? guardado : 'light', false);
  }

  definir(escolha: EscolhaTema, lembrar = true): void {
    this.atual.set(escolha);
    const raiz = document.documentElement;
    raiz.setAttribute('data-theme', escolha === 'sistema' ? 'system' : escolha);
    if (!lembrar) return;
    try {
      localStorage.setItem('tema', escolha);
    } catch {
      /* sem storage */
    }
  }

  alternar(): void {
    this.definir(this.efetivo() === 'dark' ? 'light' : 'dark');
  }
}
