import { ChangeDetectionStrategy, Component, computed, effect, input, signal, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/salvamento.json
 *
 * Uma frase curta que diz se o que a pessoa fez já está guardado. Nasceu da
 * tela de prova do vestibular, que teve de escrever o aviso à mão (06/10/2026).
 *
 * Quatro estados, e a ORDEM entre eles é do contrato: salvando, pendente, erro,
 * salvo. Quem tem mais de um ao mesmo tempo resolve antes e passa um só.
 *
 * O ANÚNCIO NÃO É O TEXTO. A raiz é role="status", como o contrato pede, mas o
 * que o leitor de tela recebe sai de um nó só dele: "Salvando…" e "Salvo" a
 * cada resposta marcada seriam lidos por cima da questão, dezenas de vezes por
 * prova. Anuncia-se o problema (pendente, erro) e a volta ao normal depois de
 * um problema — nada mais. O texto visível fica aria-hidden para não ser lido
 * duas vezes.
 */
export type UcamSalvamentoEstado = 'salvando' | 'pendente' | 'erro' | 'salvo';

const ICONE: Record<UcamSalvamentoEstado, UcamIconName> = {
  salvando: 'loaderCircle',
  pendente: 'triangleAlert',
  erro: 'circleAlert',
  salvo: 'circleCheck',
};

@Component({
  selector: 'ucam-salvamento',
  exportAs: 'ucamSalvamento',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <p class="ucam-salvamento" role="status" [attr.data-estado]="estado()">
      <ucam-icon [name]="icone()" size="sm" />
      <span aria-hidden="true">{{ frase() }}</span>
      <span class="sr-only">{{ anuncio() }}</span>
    </p>
  `,
  styles: `
    /* A mesma folha do Trilho A (tools/build-css.mjs, SALVAMENTO): texto com
       ícone, sem caixa. O normal é o elemento mais quieto da barra; só o
       problema ganha cor. */
    ucam-salvamento .ucam-salvamento {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      margin: 0;
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    /* 14px, como o .ic da folha. O degrau de ícone mais próximo é 16: o
       <ng-icon> escreve o tamanho no próprio host, então a medida vai no
       elemento e no svg, com especificidade acima da do :host da base. */
    ucam-salvamento .ucam-salvamento ucam-icon,
    ucam-salvamento .ucam-salvamento ng-icon,
    ucam-salvamento .ucam-salvamento ng-icon svg {
      inline-size: 0.875rem;
      block-size: 0.875rem;
    }
    ucam-salvamento .ucam-salvamento[data-estado='pendente'] {
      color: var(--ucam-color-feedback-warning-foreground);
    }
    ucam-salvamento .ucam-salvamento[data-estado='erro'] {
      color: var(--ucam-color-feedback-danger-foreground);
    }
    ucam-salvamento .ucam-salvamento[data-estado='salvando'] ucam-icon {
      animation: ucam-girar 1s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      ucam-salvamento .ucam-salvamento[data-estado='salvando'] ucam-icon {
        animation: none;
      }
    }
    @keyframes ucam-girar {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class UcamSalvamento {
  readonly estado = input.required<UcamSalvamentoEstado>();
  /** Quantos itens esperam a conexão voltar. Entra na frase do pendente. */
  readonly pendentes = input<number | null>(null);
  /** A frase do erro, em palavras da pessoa e com o que fazer. */
  readonly mensagem = input<string | null>(null);

  protected readonly icone = computed(() => ICONE[this.estado()]);

  protected readonly frase = computed(() => {
    switch (this.estado()) {
      case 'salvando':
        return 'Salvando…';
      case 'pendente': {
        const n = this.pendentes();
        if (n === null || n === undefined) return 'Sem conexão. As respostas serão enviadas quando ela voltar.';
        return n === 1
          ? 'Sem conexão. 1 resposta será enviada quando ela voltar.'
          : `Sem conexão. ${n} respostas serão enviadas quando ela voltar.`;
      }
      case 'erro':
        return this.mensagem() || 'O servidor não aceitou a resposta. Tente de novo.';
      default:
        return 'Salvo';
    }
  });

  /** O que o leitor de tela recebe: o problema e a volta depois dele. */
  protected readonly anuncio = signal('');
  private houveProblema = false;

  constructor() {
    effect(() => {
      const e = this.estado();
      const f = this.frase();
      if (e === 'pendente' || e === 'erro') {
        this.houveProblema = true;
        this.anuncio.set(f);
      } else if (e === 'salvo' && this.houveProblema) {
        this.houveProblema = false;
        this.anuncio.set(f);
      }
    });
  }
}
