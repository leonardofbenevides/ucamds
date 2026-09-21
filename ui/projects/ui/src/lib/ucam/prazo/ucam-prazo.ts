import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { UcamBadge, type UcamBadgeTone } from '../badge/ucam-badge';

/**
 * Contrato: spec/components/prazo.json
 *
 * Quanto tempo falta, EM PALAVRA: "vence em 1 dia", "venceu há 3 dias". Não é
 * o selo de situação, que diz em que estado o registro está; é a urgência, que
 * muda sozinha com o relógio mesmo quando ninguém toca no registro.
 *
 * É a correção direta da linha tingida da caixa de entrada, onde o único sinal
 * de atraso era o fundo — cor como único portador de significado (WCAG 1.4.1).
 *
 * O COMPONENTE CALCULA O TOM, a aplicação não escolhe. Se cada módulo
 * classificasse o próprio atraso, o mesmo requerimento apareceria "próximo" no
 * Protocolo e "vencido" no Portal.
 */
export type UcamPrazoTone = 'auto' | 'proximo' | 'vencido';

/** Meia-noite local: a comparação é de DIA, não de instante. */
function meiaNoite(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DIA = 86_400_000;

@Component({
  selector: 'ucam-prazo',
  exportAs: 'ucamPrazo',
  imports: [UcamBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <!-- Fora da janela de aviso o componente não renderiza NADA. Prazo
         confortável não é informação: é ruído em toda linha da lista. -->
    @if (visivel()) {
      <!-- COMPÕE o badge, não redesenha a pastilha.

           Até 09/09/2026 este componente declarava a própria caixa — altura,
           raio, respiro, tipo, peso — e a cópia divergiu da original em
           produção. A caixa agora vem inteira do <ucam-badge>; o que sobra
           aqui é o que só o prazo sabe: o cálculo da data, o relógio e a
           decisão de não renderizar nada quando não há urgência.

           O relógio SOBRESCREVE o ícone padrão do tom (warning traria um
           triângulo): é ele que distingue prazo de selo de situação quando os
           dois estão colados na mesma linha. -->
      <ucam-badge [tone]="tomBadge()" icon="clock">
        <!-- <time> com datetime em ISO, e não só title: o title não é
             alcançável por teclado nem existe em toque, e quando o marcador é
             a única fonte da data absoluta ela precisa estar no DOM. É por
             carregar ELEMENTO, e não string, que aqui se projeta em vez de
             passar o label do badge. -->
        <time [attr.datetime]="iso()" [attr.title]="absoluta()">{{ texto() }}</time>
      </ucam-badge>
    }
  `,
  styles: `
    /* A caixa é do badge. O que resta é o sublinhado que o <time> herda de
       alguns agentes: a data não é link nem abreviação, e o traço embaixo
       dela sugere as duas coisas. */
    ucam-prazo time {
      text-decoration: none;
    }
  `,
})
export class UcamPrazo {
  readonly date = input.required<Date | string>();
  /**
   * Quantos dias antes do vencimento o marcador passa a aparecer. Fora dessa
   * janela o componente não renderiza.
   */
  readonly warnAt = input(2);
  /**
   * `auto` é o único valor que deveria aparecer em código de aplicação. Os
   * explícitos existem para preview de documentação e para teste, onde a data
   * de hoje não pode governar a saída.
   */
  readonly tone = input<UcamPrazoTone>('auto');
  /**
   * Em LISTA fica falso: a data absoluta em cada linha devolve à pessoa o
   * cálculo que o componente existe para fazer.
   */
  readonly showAbsolute = input(false);
  /**
   * A referência de "hoje". Existe para o preview e para o teste — sem ela, a
   * documentação mudaria de tom sozinha a cada dia que passasse.
   */
  readonly hoje = input<Date | null>(null);

  private readonly limite = computed(() => {
    const d = this.date();
    return d instanceof Date ? d : new Date(d);
  });

  /** Dias inteiros de diferença. Negativo = já venceu. */
  private readonly dias = computed(() =>
    Math.round((meiaNoite(this.limite()) - meiaNoite(this.hoje() ?? new Date())) / DIA),
  );

  protected readonly tomEfetivo = computed<'proximo' | 'vencido'>(() => {
    const t = this.tone();
    if (t !== 'auto') return t;
    return this.dias() < 0 ? 'vencido' : 'proximo';
  });

  protected readonly visivel = computed(() => {
    if (this.tone() !== 'auto') return true;
    const d = this.dias();
    return Number.isFinite(d) && d <= this.warnAt();
  });

  /**
   * Os dois tons do prazo vestidos nos tons do badge — a mesma tradução que
   * o Trilho A faz com --proximo/--vencido nos seletores do .ucam-badge.
   * Continuam dois, e não cinco: prazo não tem desfecho favorável.
   */
  protected readonly tomBadge = computed<UcamBadgeTone>(() =>
    this.tomEfetivo() === 'vencido' ? 'danger' : 'warning',
  );

  /**
   * Por extenso, sem abreviação: "venceu há 3 dias", nunca "-3d". Abreviação é
   * lida letra a letra por parte dos leitores de tela.
   */
  protected readonly texto = computed(() => {
    const d = this.dias();
    const absoluta = this.showAbsolute() ? ` · ${this.absoluta()}` : '';
    if (d === 0) return `vence hoje${absoluta}`;
    if (d > 0) return `vence em ${d} ${d === 1 ? 'dia' : 'dias'}${absoluta}`;
    const atraso = Math.abs(d);
    return `venceu há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}${absoluta}`;
  });

  protected readonly iso = computed(() => {
    const d = this.limite();
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  });

  protected readonly absoluta = computed(() => {
    const d = this.limite();
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        if (Number.isNaN(this.limite().getTime())) {
          throw new Error(
            `[ucam-prazo] date inválida: ${String(this.date())}. Esperado Date ou string ISO.`,
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
