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

/** A ordem é a de SISTEMAS, em tools/lib/subpaleta.mjs: data-cor 1 a 8. */
const CATEGORIAS = [
  'academico', 'financeiro', 'atendimento', 'gestao', 'pessoas', 'acervo', 'pesquisa', 'comunicacao',
] as const;

@Component({
  selector: 'ucam-avatar',
  exportAs: 'ucamAvatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.data-cor]': 'cor()',
    '[style.background]': 'cor() ? fundoDaCor() : null',
    '[style.color]': 'cor() ? tintaDaCor() : null',
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
  /**
   * marca: o avatar de QUEM a tela é (o candidato na coluna da prova) veste a
   * superfície de marca do sistema, o mesmo par da faixa. Um por tela.
   */
  readonly tone = input<'neutral' | 'marca'>('neutral');
  /** Quando o nome já aparece ao lado, evita o leitor de tela repeti-lo. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly falhou = signal(false);
  protected readonly iniciais = computed(() => iniciaisDe(this.name()));

  /**
   * COR POR PESSOA (ADR-062). A mesma conta de tools/lib/avatar-cor.mjs: a
   * mistura dos códigos das iniciais, de 1 a 8 — a mesma pessoa sai da mesma
   * cor nos dois trilhos. A cor não carrega significado. Fica de fora o
   * avatar de marca e o de foto.
   */
  protected readonly cor = computed(() => {
    if (this.tone() === 'marca' || (this.photoUrl() && !this.falhou())) return null;
    const t = this.iniciais().trim().toUpperCase();
    let h = 0;
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 2654435761) >>> 0;
    return ((h >>> 16) % 8) + 1;
  });
  private readonly categoria = computed(() => `var(--ucam-color-categoria-${CATEGORIAS[(this.cor() ?? 1) - 1]})`);
  protected readonly fundoDaCor = computed(() => `color-mix(in srgb, ${this.categoria()} 16%, transparent)`);
  protected readonly tintaDaCor = computed(
    () => `color-mix(in oklab, ${this.categoria()} 65%, var(--ucam-color-text-primary))`,
  );
  protected readonly classes = computed(() =>
    `inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold ${this.tone() === 'marca' ? 'bg-[var(--ucam-color-surface-brand)] text-[var(--ucam-color-text-on-brand)]' : 'bg-accent text-accent-foreground'} ${TAM[this.size()]}`,
  );
}
