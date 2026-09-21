import { Component, signal, effect, ChangeDetectionStrategy } from '@angular/core';

type Tema = 'claro' | 'escuro' | 'sistema';

/**
 * Alterna entre claro, escuro e a preferência do sistema.
 *
 * O tema escuro não é enfeite aqui: os tokens têm uma camada escura inteira em
 * spec/tokens/theme.dark.json, e este botão é o único jeito de conferir se ela
 * está correta sem trocar a configuração do sistema operacional.
 */
@Component({
  selector: 'ucam-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Ícones DESENHADOS, não os glifos ☀ ☾ ◐ que estavam aqui. O Geist não
         tem nenhum dos três: cada um caía numa fonte de fallback diferente,
         com peso, tamanho e alinhamento próprios — e o ◐ (o estado "sistema",
         o padrão) saía como um disco preto chapado, do tamanho de uma bolinha
         de lista, sem nenhuma relação com a régua de 1,75px dos outros ícones
         do cabeçalho. Os três abaixo compartilham viewBox, traço e caixa. -->
    <button
      type="button"
      class="toggle"
      (click)="proximo()"
      [attr.aria-label]="'Tema: ' + rotulo() + '. Trocar.'"
      [title]="'Tema: ' + rotulo()"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        @switch (tema()) {
          @case ('claro') {
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4" />
          }
          @case ('escuro') {
            <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
          }
          @default {
            <!-- "Sistema": o mesmo disco, metade preenchida. Diz "ora um, ora
                 outro" sem precisar de uma terceira metáfora. -->
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" />
          }
        }
      </svg>
    </button>
  `,
  styles: `
    .toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      border-radius: var(--r-controle);
      border: 1px solid var(--ucam-color-border-subtle);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      line-height: 1;
      transition:
        color var(--transicao),
        background var(--transicao),
        border-color var(--transicao);
    }
    .toggle svg {
      inline-size: 1.0625rem;
      block-size: 1.0625rem;
    }
    .toggle:hover {
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-subtle);
      border-color: var(--ucam-color-border-default);
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly tema = signal<Tema>('sistema');

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const salvo = localStorage.getItem('ucam-theme');
      this.tema.set(salvo === 'dark' ? 'escuro' : salvo === 'light' ? 'claro' : 'sistema');
    }

    effect(() => {
      const t = this.tema();
      if (typeof document === 'undefined') return;
      const raiz = document.documentElement;
      if (t === 'sistema') {
        raiz.removeAttribute('data-theme');
        localStorage.removeItem('ucam-theme');
      } else {
        const valor = t === 'escuro' ? 'dark' : 'light';
        raiz.setAttribute('data-theme', valor);
        localStorage.setItem('ucam-theme', valor);
      }
    });
  }

  protected proximo(): void {
    const ordem: Tema[] = ['sistema', 'claro', 'escuro'];
    const i = ordem.indexOf(this.tema());
    this.tema.set(ordem[(i + 1) % ordem.length]);
  }

  protected rotulo(): string {
    return this.tema();
  }

  // O ícone virou markup no template (@switch sobre o signal): um método que
  // devolve caractere não tem como devolver <path>, e era o caractere que
  // estava errado.
}
