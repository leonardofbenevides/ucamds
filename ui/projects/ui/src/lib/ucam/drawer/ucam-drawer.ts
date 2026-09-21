import { ChangeDetectionStrategy, Component, computed, input, model, output, ViewEncapsulation } from '@angular/core';

import { ZardDrawerImports } from '@/shared/components/drawer/drawer.imports';
import type { ZardDrawerCloseReason } from '@/shared/components/drawer/drawer-host';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

/**
 * Contrato: spec/components/drawer.json
 *
 * Parte do z-drawer, que já entrega o que é caro e fácil de errar: overlay do
 * CDK, véu, Escape, trava de rolagem, armadilha de foco e devolução do foco
 * ao controle que abriu. O que este wrapper acrescenta é o que o contrato
 * exige e a base não tem: cabeçalho montado de title e description, MOTIVO do
 * fechamento e a superfície de API estreitada — a base traz swipe, alça e
 * pontos de encaixe, e nada disso tem evidência no parque.
 */
export type UcamDrawerSide = 'end' | 'start' | 'bottom';
export type UcamDrawerCloseReason = 'esc' | 'scrim' | 'button' | 'action';

/**
 * Lógico para físico. O parque é pt-BR e só; se um dia houver interface em
 * árabe, é AQUI que a tradução muda, não em cada tela.
 */
const LADO = { end: 'right', start: 'left', bottom: 'bottom' } as const;

const LARGURA: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'sm:w-[22rem]',
  md: 'sm:w-[30rem]',
  lg: 'sm:w-[42rem]',
};

@Component({
  selector: 'ucam-drawer',
  exportAs: 'ucamDrawer',
  imports: [ZardDrawerImports, UcamIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <z-drawer
      [(zVisible)]="open"
      [zPlacement]="lado()"
      [zDismissible]="dismissible()"
      [class]="largura()"
      (zCloseRequested)="fechou($event)"
    >
      <z-drawer-header class="flex-row items-start justify-between gap-4 text-left">
        <div>
          <z-drawer-title>{{ title() }}</z-drawer-title>
          @if (description()) {
            <z-drawer-description>{{ description() }}</z-drawer-description>
          }
        </div>
        @if (dismissible()) {
          <!-- Nome acessível textual, não só o X: o botão de fechar é a saída
               e precisa ser encontrável por quem navega por rótulos. -->
          <ucam-icon-button icon="x" variant="ghost" label="Fechar" z-drawer-close />
        }
      </z-drawer-header>

      <!-- Única área rolável do painel. O legado tem duas barras de rolagem
           adjacentes no mesmo modal. -->
      <div class="flex-1 min-h-0 overflow-y-auto p-4"><ng-content /></div>

      <z-drawer-footer class="flex-row justify-end gap-2 empty:hidden">
        <ng-content select="[ucamDrawerFooter]" />
      </z-drawer-footer>
    </z-drawer>
  `,
})
export class UcamDrawer {
  readonly open = model(false);
  /** Nomeia a TAREFA, não o objeto: "Novo setor", não "Setor". */
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly side = input<UcamDrawerSide>('end');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /**
   * Passa a false enquanto há envio em curso — nunca para "obrigar" a
   * concluir: gaveta que não fecha é armadilha, não guarda-corpo.
   */
  readonly dismissible = input(true);

  /**
   * Por qual caminho fechou. O motivo importa: pelo véu com formulário sujo
   * pede confirmação, pela ação não.
   */
  readonly close = output<UcamDrawerCloseReason>();

  protected readonly lado = computed(() => LADO[this.side()]);
  protected readonly largura = computed(() =>
    this.side() === 'bottom' ? '' : `w-[calc(100vw-1rem)] ${LARGURA[this.size()]}`,
  );

  protected fechou(motivo: ZardDrawerCloseReason) {
    // O swipe da base não existe no contrato; quando acontece, é o mesmo que
    // arrastar o véu para longe — some no mesmo balde.
    this.close.emit(motivo === 'swipe' ? 'scrim' : motivo === 'programmatic' ? 'action' : motivo);
  }
}
