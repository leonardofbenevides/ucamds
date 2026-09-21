import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Contrato: spec/components/kbd.json
 *
 * A tecla desenhada, para anunciar um atalho QUE EXISTE. Uma tecla sozinha na
 * tela não ensina nada: ela só faz sentido ao lado da explicação do que faz.
 *
 * É aqui que a troca Ctrl/Cmd por plataforma deixa de ser copiada de tela em
 * tela. Anunciar Ctrl a quem usa Mac é anunciar um atalho que não funciona, e
 * o parque tem uso nos dois sistemas.
 *
 * PROMESSA: a testeira do shell mostra o selo Ctrl K e declara
 * aria-keyshortcuts="Control+K" — e a paleta de comando só ganhou implementação
 * depois. Tecla desenhada é promessa: ou o atalho existe, ou a pastilha sai da
 * tela.
 */
export type UcamKbdPlatform = 'auto' | 'mac' | 'windows';

/** O que muda de nome no Mac. Só o que muda: o resto é a mesma tecla. */
const NO_MAC: Record<string, string> = {
  Ctrl: '⌘',
  Control: '⌘',
  Alt: '⌥',
  Shift: '⇧',
  Meta: '⌘',
};

/**
 * O nome POR EXTENSO para o leitor de tela. O símbolo ⌘ é lido de formas
 * diferentes conforme o leitor — de "place of interest sign" a silêncio — e
 * quem depende de voz é justamente quem mais precisa do atalho.
 */
const POR_EXTENSO: Record<string, string> = {
  '⌘': 'Command',
  '⌥': 'Option',
  '⇧': 'Shift',
  Ctrl: 'Control',
};

@Component({
  selector: 'ucam-kbd',
  exportAs: 'ucamKbd',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <!-- Uma pastilha por tecla, e cada uma é um <kbd> DE VERDADE: o papel
         semântico é o que faz o leitor de tela anunciar aquilo como entrada de
         teclado. span estilizado não anuncia nada. -->
    @for (tecla of teclas(); track $index) {
      <kbd class="ucam-kbd" [attr.aria-label]="porExtenso(tecla)">{{ tecla }}</kbd>
    }
  `,
  styles: `
    ucam-kbd {
      display: inline-flex;
      align-items: center;
      gap: 0.1875rem;
    }
    ucam-kbd .ucam-kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 1.375rem;
      block-size: 1.375rem;
      padding-inline: 0.25rem;
      /* Mesmas derivadas da faixa do Trilho A, com o mesmo fallback: dentro da
         testeira a tecla acompanha a faixa; fora dela, herda o contexto. */
      background: color-mix(in srgb, var(--ucam-appbar-fg, currentColor) 8%, transparent);
      border: 1px solid var(--ucam-appbar-control-line, var(--ucam-color-border-subtle));
      border-radius: var(--ucam-radius-sm);
      color: var(--ucam-appbar-muted, var(--ucam-color-text-secondary));
      font-family: var(--ucam-font-mono);
      font-size: 0.6875rem;
      line-height: 1;
    }
  `,
})
export class UcamKbd {
  /**
   * Uma pastilha por tecla. Combinação vem como itens SEPARADOS — ['Ctrl','K'],
   * não 'Ctrl+K' — para que cada tecla seja lida como tecla e o sinal de mais
   * não vire uma delas.
   */
  readonly keys = input.required<readonly string[]>();
  readonly platform = input<UcamKbdPlatform>('auto');

  private readonly plataformaId = inject(PLATFORM_ID);

  /**
   * `auto` no servidor NÃO adivinha: sem navigator, a detecção erraria metade
   * das vezes e o HTML pré-renderizado ficaria com a tecla errada até a
   * hidratação. Windows é o padrão do parque da UCAM.
   */
  private readonly ehMac = computed(() => {
    const p = this.platform();
    if (p === 'mac') return true;
    if (p === 'windows') return false;
    if (!isPlatformBrowser(this.plataformaId)) return false;
    return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  });

  protected readonly teclas = computed(() =>
    this.keys().map((k) => (this.ehMac() ? (NO_MAC[k] ?? k) : k)),
  );

  protected porExtenso(tecla: string): string | null {
    return POR_EXTENSO[tecla] ?? null;
  }

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Tecla ÚNICA sem modificador tem de ser desligável ou remapeável
        // (WCAG 2.1.4): quem usa entrada por voz dispara teclas soltas sem
        // querer. O componente não tem como saber se a aplicação oferece isso,
        // então avisa em vez de impedir.
        const ks = this.keys();
        if (ks.length === 1 && /^[a-z0-9]$/i.test(ks[0])) {
          console.warn(
            `[ucam-kbd] atalho de tecla única ("${ks[0]}") exige que a aplicação ofereça desligar ou remapear (WCAG 2.1.4). Ver spec/components/kbd.json.`,
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
