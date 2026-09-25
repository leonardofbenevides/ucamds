import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { UcamAvatar } from '../avatar/ucam-avatar';
import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/list-item.json
 *
 * Sem equivalente na base. A fila de triagem do Protocolo é hoje uma tabela
 * de sete colunas em que só três participam da decisão de prioridade — e a
 * decisão ali não é comparar valores entre linhas, é reconhecer quem pede o
 * quê e o que já venceu.
 */
export type UcamListItemTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

let seq = 0;

@Component({
  selector: 'ucam-list-item',
  exportAs: 'ucamListItem',
  imports: [UcamAvatar, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    /**
     * role=listitem no elemento customizado.
     *
     * O host fica ENTRE o ul e o conteúdo, e um ul com filho que não é li
     * perde a contagem em parte dos leitores de tela. O papel explícito
     * devolve o que a marcação sozinha daria — é o que o Trilho A não precisa
     * fazer, porque lá o li é escrito à mão.
     */
    role: 'listitem',
    '[class]': 'classes()',
    '[attr.aria-current]': 'selected() ? "true" : null',
  },
  template: `
    @if (href()) {
      <!-- Link ESTICADO sobre a linha inteira, em vez de a linha ser um <a>.
           A linha precisa continuar sendo listitem, e um <a> por fora disso
           obrigaria a escolher entre a semântica da lista e a do link. Assim
           o alvo é a linha toda, o clique do meio e o menu de contexto do
           navegador funcionam, e o nome acessível é montado do título mais o
           assunto — não da linha lida em fragmentos. -->
      <a
        [href]="href()"
        class="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
        [attr.aria-labelledby]="nomeAcessivel()"
        (click)="open.emit()"
      ></a>
    } @else if (selectable()) {
      <!-- O ALVO que ESCOLHE (ucam-list-item__alvo do Trilho A): a linha
           governa o painel ao lado e não navega. Botão, e não link com
           href="#" — que era o que a demo fazia, porque sem href o open não
           tinha de onde sair: um "#" leva o clique do meio a uma aba vazia e
           se anuncia como link para quem não sai do lugar. aria-pressed é o
           estado do controle; aria-current, no host, o do item. Sem seta. -->
      <button
        type="button"
        class="absolute inset-0 z-[1] cursor-pointer rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ucam-color-border-focus)]"
        [attr.aria-labelledby]="nomeAcessivel()"
        [attr.aria-pressed]="selected()"
        (click)="open.emit()"
      ></button>
    }
    @if (name()) {
      <ucam-avatar class="shrink-0" [name]="name()!" size="md" decorative />
    }
    <span class="flex-1 min-w-0">
      <span class="flex items-baseline gap-2">
        <!-- Tamanhos pelos PAPÉIS de tipografia, não por text-sm e text-xs: a
             régua do Tailwind dava 14px ao título e ao assunto, onde o Trilho A
             usa 13, e a mesma linha media alturas diferentes nos dois trilhos. -->
        <!-- O escolhido sobe o título ao peso de ação: é o segundo sinal, ao
             lado do realce, que o Trilho A pinta por .ucam-list-item__titulo
             (ADR-046). -->
        <span class="leading-5 truncate" [style.font-size]="'var(--ucam-typography-label-font-size)'" [style.font-weight]="selected() ? 'var(--ucam-typography-action-font-weight)' : 'var(--ucam-typography-label-font-weight)'" [id]="idTitulo">{{ title() }}</span>
        @if (time()) {
          <time class="ml-auto shrink-0 text-muted-foreground tabular-nums" style="font-size: var(--ucam-typography-caption-font-size)" [attr.datetime]="timeValue()">
            {{ time() }}
          </time>
        }
      </span>
      @if (support()) {
        <span class="block leading-5 text-muted-foreground truncate" style="font-size: var(--ucam-typography-body-sm-font-size)" [id]="idApoio">{{ support() }}</span>
      }
      <!-- Marcadores: situação, prazo, natureza. Nunca mais de três — acima
           disso a faixa vira parede de selos e nenhum discrimina. -->
      <span class="flex items-center gap-1 flex-wrap mt-1.5 relative z-[2] empty:hidden"><ng-content /></span>
    </span>
    @if (href()) {
      <!-- A SETA DO DESTINO: a linha que leva a outra tela diz isso em
           repouso, sem esperar o hover. Mesmo desenho e mesma vaga do
           Trilho A (::before em build-css.mjs), aqui como ícone porque o
           componente já tem o sprite à mão. O ícone já nasce aria-hidden, e
           o link já diz que é link. -->
      <ucam-icon
        name="chevronRight"
        size="sm"
        class="ucam-list-item__seta shrink-0 self-center text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    }
    @if (unread()) {
      <!-- Forma acompanhada de texto: um círculo de 8px não informa nada
           sozinho (WCAG 1.4.1). Mora no recuo inicial, fora do fluxo
           (centrado no recuo inicial e na linha do título, com as contas do Trilho A).
           Como item de flex à direita ele empurrava a hora da linha não lida
           para dentro, e a coluna do tempo desalinhava das vizinhas.
           Com href o texto entra no nome do link por aria-labelledby, e o
           span sai da árvore para não ser lido duas vezes. -->
      <span
        class="pointer-events-none absolute size-2 rounded-full bg-primary"
        style="inset-block-start: calc(var(--ucam-space-inset-sm) + 0.375rem); inset-inline-start: calc((var(--ucam-space-inset-md) - 0.5rem) / 2)"
        aria-hidden="true"
      ></span>
      <span class="sr-only" [id]="idNaoLido" [attr.aria-hidden]="alvo() ? 'true' : null">não lido</span>
    }
  `,
})
export class UcamListItem {
  readonly title = input.required<string>();
  readonly support = input<string | null>(null);
  /** Texto relativo exibido. O valor absoluto vai em timeValue. */
  readonly time = input<string | null>(null);
  readonly timeValue = input<string | null>(null);
  /** Nome de quem pede, para o avatar de iniciais. Decorativo — ver avatar.json. */
  readonly name = input<string | null>(null);
  readonly selected = input(false, { transform: booleanAttribute });
  readonly unread = input(false, { transform: booleanAttribute });
  /**
   * @deprecated Sem efeito desde a ADR-022 (09/09/2026): a barra de 3px que
   * este tom pintava era o mesmo estado que o selo ao lado já dizia. Quem
   * carrega o tom é o marcador. Aceito até 0.2.0 para não quebrar quem passa.
   */
  readonly tone = input<UcamListItemTone>('neutral');
  readonly href = input<string | null>(null);
  /**
   * A linha ESCOLHE o que o painel ao lado mostra, sem navegar. Sem href,
   * desenha um botão esticado que emite open. Com href, o link vence.
   */
  readonly selectable = input(false, { transform: booleanAttribute });

  readonly open = output<void>();

  /** Há um alvo de clique na linha: link (navega) ou botão (escolhe). */
  protected readonly alvo = computed(() => !!this.href() || this.selectable());

  protected readonly idTitulo = `ucam-li-${++seq}-t`;
  protected readonly idApoio = `ucam-li-${seq}-a`;
  protected readonly idNaoLido = `ucam-li-${seq}-n`;

  /** Título, assunto e, se for o caso, "não lido" — o contrato promete os três. */
  protected readonly nomeAcessivel = computed(() =>
    [this.idTitulo, this.support() ? this.idApoio : null, this.unread() ? this.idNaoLido : null]
      .filter(Boolean)
      .join(' '),
  );

  /**
   * O escolhido se diz por realce TINTO e pelo título em peso de ação
   * (ADR-046, 23/09/2026): um sinal de superfície, um de tipografia. A barra
   * de 4px na borda de entrada, que viveu aqui de 19/09 a 23/09, saiu junto
   * com a do Trilho A — o fundo sozinho mede 1,08:1, e o que compensa é o
   * peso, não uma tarja. Ver o bloco .ucam-list-item[aria-current] em
   * build-css.mjs.
   */
  protected readonly classes = computed(() => {
    // Recuo pelos tokens e fio por sombra interna, como no Trilho A: a borda
    // contava 1px no layout e px-4/py-2 davam 8px onde o A usa inset-sm (12).
    // Medido em 13/09/2026: 89,4px aqui contra 92 lá.
    const base =
      'relative flex items-start gap-[var(--ucam-space-inline-sm)] px-[var(--ucam-space-inset-md)] py-[var(--ucam-space-inset-sm)] shadow-[inset_0_-1px_0_var(--ucam-color-border-subtle)] last:shadow-none text-foreground transition-colors';
    // Hover só onde há alvo: a linha inerte tingia sob o ponteiro igual à
    // que abre, e o hover respondia "clica" para as duas (25/09/2026).
    const estado = this.selected()
      ? 'bg-[var(--ucam-color-action-primary-subtle)]'
      : this.alvo()
        ? 'hover:bg-[var(--ucam-color-interaction-hover)]'
        : '';
    return `${base} ${estado} ${this.alvo() ? 'group cursor-pointer active:bg-[var(--ucam-color-interaction-active)]' : ''}`;
  });
}
