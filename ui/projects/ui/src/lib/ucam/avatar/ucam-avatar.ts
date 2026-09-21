import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, signal, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/avatar.json
 *
 * NÃO envolve o z-avatar: a base não deriva iniciais, e é justamente isso
 * que resolve o problema do parque — o modal Funcionário usa o mesmo clipart
 * para toda pessoa. Avatar igual para todos não é avatar, é ícone.
 */
const TAM = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-12 h-12 text-base' };

/** Preposições não entram nas iniciais: Ana de Souza vira AS. */
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

export function iniciaisDe(nome: string): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter((p) => p && !PARTICULAS.has(p.toLowerCase()));
  if (!partes.length) return '';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

@Component({
  selector: 'ucam-avatar',
  exportAs: 'ucamAvatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : name()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
  template: `
    @if (photoUrl() && !falhou()) {
      <img [src]="photoUrl()" alt="" class="w-full h-full object-cover rounded-full" (error)="falhou.set(true)" />
    } @else {
      <span aria-hidden="true">{{ iniciais() }}</span>
    }
  `,
})
export class UcamAvatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Quando o nome já aparece ao lado, evita o leitor de tela repeti-lo. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly falhou = signal(false);
  protected readonly iniciais = computed(() => iniciaisDe(this.name()));
  protected readonly classes = computed(() =>
    `inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold bg-accent text-accent-foreground ${TAM[this.size()]}`,
  );
}
