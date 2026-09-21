import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/link.json
 *
 * Texto que leva a outro lugar. Não é botão: link muda de endereço, botão
 * executa. A distinção não é de aparência, é de PROMESSA — e é o que decide se
 * o clique do meio abre em outra aba, se o atalho de copiar endereço funciona,
 * e o que o leitor de tela anuncia.
 *
 * O sublinhado é obrigatório EM REPOUSO, não só no hover: cor sozinha não
 * distingue link de texto corrido (WCAG 1.4.1). O deslocamento tira a linha de
 * cima das hastes descendentes, que é o que faz sublinhado parecer sujeira
 * tipográfica.
 */
export type UcamLinkVariant = 'default' | 'apoio';

@Component({
  selector: 'ucam-link',
  exportAs: 'ucamLink',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <a
      [class]="classes()"
      [attr.href]="href()"
      [attr.target]="target() === '_blank' ? '_blank' : null"
      [attr.rel]="rel()"
      [attr.aria-label]="rotulo()"
    >
      <ng-content />
      @if (external()) {
        <!-- O ícone é reforço visual; quem avisa o leitor de tela é o
             aria-label. Ícone sozinho não é palavra (WCAG 3.2.5). -->
        <ucam-icon name="externalLink" size="sm" aria-hidden="true" />
      }
    </a>
  `,
  styles: `
    ucam-link .ucam-link {
      color: var(--ucam-color-text-link);
      text-decoration: underline;
      text-underline-offset: 0.2em;
      text-decoration-thickness: 1px;
      border-radius: var(--ucam-radius-sm);
    }
    /* O sublinhado ENGROSSA no hover em vez de sumir: sumir devolveria o link
       ao estado em que ele não se distingue do texto. */
    ucam-link .ucam-link:hover { text-decoration-thickness: 2px; }

    /* O que desce em "apoio" é o TAMANHO, nunca o contraste. */
    ucam-link .ucam-link--apoio { font-size: var(--ucam-typography-caption-font-size); }

    ucam-link .ucam-link ucam-icon {
      display: inline-block;
      margin-inline-start: 0.2em;
      vertical-align: -0.1em;
    }
  `,
})
export class UcamLink {
  /** O destino. Obrigatório sem exceção — sem destino, o componente é botão. */
  readonly href = input.required<string>();
  readonly variant = input<UcamLinkVariant>('default');
  /**
   * Marca o destino como fora do sistema. NÃO abre em nova aba por conta
   * própria: quem decide isso é `target`, e abrir sem avisar é o que a WCAG
   * 3.2.5 desaconselha.
   */
  readonly external = input(false);
  readonly target = input<'_self' | '_blank'>('_self');
  /**
   * Nome acessível quando o texto visível não basta fora de contexto. Leitores
   * de tela oferecem a lista de links da página: quinze links chamados "Ver
   * detalhes" são quinze destinos indistinguíveis (WCAG 2.4.4).
   */
  readonly ariaLabel = input<string | null>(null);

  protected readonly classes = computed(
    () => `ucam-link${this.variant() === 'apoio' ? ' ucam-link--apoio' : ''}`,
  );

  /**
   * noopener é segurança (a página aberta ganharia window.opener e poderia
   * redirecionar esta); noreferrer entra só no destino externo, onde não há
   * motivo para entregar de onde a pessoa veio.
   */
  protected readonly rel = computed(() => {
    const partes: string[] = [];
    if (this.target() === '_blank') partes.push('noopener');
    if (this.external()) partes.push('noreferrer');
    return partes.length ? partes.join(' ') : null;
  });

  /**
   * O aviso de destino externo ou de nova aba vai no NOME ACESSÍVEL, não só no
   * ícone. Sem texto próprio, o aviso é acrescentado ao que estiver escrito —
   * e para isso o rótulo tem de existir; por isso, sem ariaLabel, o componente
   * não inventa nome e deixa o texto visível falar.
   */
  protected readonly rotulo = computed(() => {
    const base = this.ariaLabel();
    if (!base) return null;
    if (this.target() === '_blank') return `${base} (abre em nova aba)`;
    if (this.external()) return `${base} (site externo)`;
    return base;
  });

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Abrir aba sem dizer que vai abrir é mudança de contexto sem pedir, e
        // quem usa ampliação de tela costuma nem perceber que a janela trocou.
        if (this.target() === '_blank' && !this.external()) {
          throw new Error(
            '[ucam-link] target="_blank" exige external="true": abrir nova aba sem avisar é mudança de contexto sem pedir (WCAG 3.2.5). Ver spec/components/link.json.',
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
