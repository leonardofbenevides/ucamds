import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  ZardSelectGroupComponent,
  ZardSelectLabelComponent,
} from '../../shared/components/select/select-group.component';
import { ZardSelectItemComponent } from '../../shared/components/select/select-item.component';
import { ZardSelectComponent } from '../../shared/components/select/select.component';

import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamIcon } from '../icon/ucam-icon';
import { UcamSegmented, type UcamSegmentItem } from '../segmented/ucam-segmented';

/**
 * Contrato: spec/components/select.json
 *
 * Usa o OVERLAY do z-select, não o <select> nativo — ver ADR-011.
 *
 * A decisão anterior era o nativo, e o raciocínio dela continua correto no
 * que dizia: teclado, typeahead e seletor de roda do celular vêm de graça.
 * O que ela não pesava é que a LISTA ABERTA de um select nativo não é
 * estilizável em navegador nenhum. Na prática, metade do componente ficava
 * fora do design system: o campo fechado seguia a marca e, ao abrir, a lista
 * aparecia com o azul do Windows. Um design system que não alcança o momento
 * da escolha não está documentando esse componente.
 *
 * O que se perde está registrado na ADR-011 e não é pequeno: no celular, o
 * seletor nativo é melhor que qualquer overlay.
 */
export interface UcamOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  /** O valor do recorte a que a opção pertence: EAD, Presencial (ver filter). */
  filter?: string;
}

/**
 * A fileira de alternância dentro do painel (ADR-078): "Todos" + as opções
 * do recorte. Aberta como prop: o rótulo, o texto do "Todos" e as opções são
 * de quem usa — modalidade, campus, turno, nível.
 */
export interface UcamSelectFilter {
  label: string;
  /** Texto da opção que mostra tudo. Padrão: Todos. */
  allLabel?: string;
  options: { value: string; label: string }[];
  /** Recorte que abre escolhido. Padrão: todos. */
  initial?: string;
}

@Component({
  selector: 'ucam-select',
  exportAs: 'ucamSelect',
  imports: [
    UcamField,
    UcamIcon,
    UcamSegmented,
    ZardSelectComponent,
    ZardSelectGroupComponent,
    ZardSelectItemComponent,
    ZardSelectLabelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamSelect), multi: true }],
  template: `
    <ucam-field
      [label]="label()"
      [labelHidden]="labelHidden()"
      [hint]="hintEfetivo()"
      [errorMessage]="errorMessage()"
      [invalid]="invalid()"
      [required]="required()"
      [controlId]="ids.controlId"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <!-- aria-busy mora aqui: o z-select não o expõe, e o contrato pede que o
           carregamento seja anunciado, não só pintado de cinza. -->
      @if (comPainel()) {
        <!-- O PAINEL (ADR-078): múltiplo e/ou com a fileira de recorte. A mesma
             marcação do Trilho A — gatilho, lista com aria-multiselectable,
             fileira de alternância e rodapé —, sobre o popover nativo. O foco
             fica no gatilho (setas, Espaço, Esc); Tab entra no recorte e no
             Limpar, porque o painel vem logo depois na ordem do documento. -->
        <span class="ucam-select-wrap" [class.block]="width() === 'full'" (focusout)="aoSairDoCampo($event)">
          <button
            #gatilho
            type="button"
            class="ucam-select-trigger"
            [id]="ids.controlId"
            aria-haspopup="listbox"
            [attr.aria-expanded]="aberto()"
            [attr.aria-controls]="ids.controlId + '-lb'"
            [attr.aria-activedescendant]="aberto() && destacada() ? ids.controlId + '-o-' + destacada() : null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-invalid]="invalid() ? 'true' : null"
            [attr.data-vazio]="rotuloVazio() ? 'true' : null"
            [disabled]="bloqueado()"
            (click)="alternar()"
            (keydown)="teclar($event)"
          >
            <span class="ucam-select-trigger__texto">{{ rotuloGatilho() }}</span>
            <ucam-icon name="chevronDown" size="sm" />
          </button>
          <div #painel class="ucam-listbox ucam-listbox--painel" popover="manual" [id]="ids.controlId + '-lb'">
            @if (filter(); as f) {
              <ucam-segmented
                class="ucam-listbox__recorte"
                [ariaLabel]="f.label"
                [items]="itensRecorte()"
                [value]="recorte()"
                (valueChange)="recortar($event)"
              />
            }
            <ul
              class="ucam-listbox__lista"
              role="listbox"
              [attr.aria-labelledby]="ids.controlId"
              [attr.aria-multiselectable]="multiple() ? 'true' : null"
            >
              @for (o of visiveis(); track o.value) {
                <li
                  class="ucam-option"
                  role="option"
                  [id]="ids.controlId + '-o-' + o.value"
                  [attr.aria-selected]="marcado(o.value) ? 'true' : 'false'"
                  [attr.aria-disabled]="o.disabled ? 'true' : null"
                  [attr.data-destacada]="destacada() === o.value ? 'true' : null"
                  (mousedown)="$event.preventDefault()"
                  (click)="escolher(o)"
                >
                  @if (multiple()) {
                    <span class="ucam-option__caixa" aria-hidden="true">
                      @if (marcado(o.value)) {
                        <ucam-icon name="check" size="xs" />
                      }
                    </span>
                  }
                  {{ o.label }}
                </li>
              } @empty {
                <li class="ucam-listbox__vazio" role="presentation">Nenhuma opção neste recorte.</li>
              }
            </ul>
            @if (multiple()) {
              <div class="ucam-listbox__pe">
                <span>{{ contagem() }}</span>
                <button type="button" class="ucam-listbox__limpar" (click)="limpar()">Limpar</button>
              </div>
            }
          </div>
        </span>
      } @else {
      <span
        class="relative"
        [class.block]="width() === 'full'"
        [class.w-full]="width() === 'full'"
        [class.inline-block]="width() === 'content'"
        [attr.aria-busy]="loading() ? 'true' : null"
      >
        <z-select
          [zTriggerId]="ids.controlId"
          [zValue]="value()"
          [zPlaceholder]="placeholder()"
          [zDisabled]="bloqueado()"
          [zInvalid]="invalid()"
          zPosition="popper"
          [class]="width() === 'full' ? 'block w-full' : 'inline-block'"
          (zSelectionChange)="onSelect($event)"
        >
          @for (g of grupos(); track g.nome ?? $index) {
            @if (g.nome) {
              <z-select-group>
                <span z-select-label>{{ g.nome }}</span>
                @for (o of g.opcoes; track o.value) {
                  <z-select-item [zValue]="o.value" [zDisabled]="o.disabled ?? false">
                    {{ o.label }}
                  </z-select-item>
                }
              </z-select-group>
            } @else {
              @for (o of g.opcoes; track o.value) {
                <z-select-item [zValue]="o.value" [zDisabled]="o.disabled ?? false">
                  {{ o.label }}
                </z-select-item>
              }
            }
          }
        </z-select>

        <!-- O chevron é do gatilho da base. O spinner do contrato o COBRE
             enquanto carrega: é a única parte da anatomia que a base não
             tem, e sobrepor evita bifurcar o trigger inteiro. -->
        @if (loading()) {
          <span
            class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center bg-background pl-1 text-muted-foreground"
            aria-hidden="true"
          >
            <ucam-icon name="loaderCircle" size="sm" class="motion-safe:animate-spin" />
          </span>
        }
      </span>
      }
    </ucam-field>
  `,
  /*
   * O PAINEL ABERTO. Ele mora num overlay do CDK, fora do hospedeiro, e por
   * isso o seletor é o data-slot da base e não uma classe nossa. Três defeitos
   * medidos em 13/09/2026 na página do catálogo:
   *
   * 1. Abria POR CIMA do campo. A base vem em item-aligned, que alinha a opção
   *    escolhida ao gatilho como o menu nativo do macOS: a lista começava 2px
   *    acima do campo e cobria os 32px dele. Agora é popper, abaixo, com o vão
   *    de 4px (translate-y-1) que o .ucam-listbox do Trilho A também tem.
   * 2. Fio na cor do TEXTO. A classe border da base não traz cor, e quem dá
   *    cor a border sem cor é o @layer base da folha da biblioteca, que o site
   *    não importa de propósito. Sem ela, o Tailwind v4 cai em currentColor.
   * 3. Sem sombra e com raio de 6px, onde o Trilho A tem elevation.overlay e
   *    raio de superfície.
   *
   * Tudo por token, sem depender da camada base de quem consome.
   */
  styles: `
    /* O PAINEL (ADR-078), com a pele do .ucam-listbox--painel do Trilho A. */
    ucam-select .ucam-select-wrap { position: relative; display: inline-block; }
    ucam-select .ucam-select-wrap.block { display: block; }
    ucam-select .ucam-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ucam-space-inline-sm);
      inline-size: 100%;
      block-size: var(--ucam-size-control-md);
      padding: 0 0.625rem 0 0.75rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      text-align: start;
      cursor: pointer;
    }
    ucam-select .ucam-select-trigger[data-vazio] .ucam-select-trigger__texto { color: var(--ucam-color-text-placeholder); }
    ucam-select .ucam-select-trigger[aria-invalid='true'] { border-color: var(--ucam-color-action-danger-default); }
    ucam-select .ucam-select-trigger:focus-visible { outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus); outline-offset: 2px; }
    ucam-select .ucam-select-trigger:disabled { background: var(--ucam-color-action-disabled-background); color: var(--ucam-color-action-disabled-text); cursor: not-allowed; }
    ucam-select .ucam-select-trigger__texto { min-inline-size: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    ucam-select .ucam-listbox--painel {
      position: fixed;
      inset: auto;
      margin: 0;
      display: none;
      flex-direction: column;
      gap: var(--ucam-space-inline-xs);
      max-block-size: 26rem;
      padding: var(--ucam-space-inline-xs);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
    }
    ucam-select .ucam-listbox--painel:popover-open { display: flex; }
    ucam-select .ucam-listbox__recorte .ucam-segmented { display: flex; inline-size: 100%; }
    ucam-select .ucam-listbox__recorte .ucam-segmented button { flex: 1 1 0; justify-content: center; }
    ucam-select .ucam-listbox__lista { flex: 1 1 auto; min-block-size: 0; overflow-y: auto; margin: 0; padding: 0; list-style: none; }
    ucam-select .ucam-option {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      padding: 0.4375rem 2rem 0.4375rem var(--ucam-space-inline-sm);
      border-radius: var(--ucam-radius-control);
      font-size: var(--ucam-typography-body-sm-font-size);
      line-height: 1.6;
      cursor: default;
      user-select: none;
    }
    ucam-select .ucam-option:hover,
    ucam-select .ucam-option[data-destacada='true'] { background: var(--ucam-color-interaction-hover); }
    ucam-select .ucam-option[aria-disabled='true'] { color: var(--ucam-color-text-disabled); pointer-events: none; }
    ucam-select [aria-multiselectable='true'] > .ucam-option { padding-inline-end: var(--ucam-space-inline-sm); }
    ucam-select .ucam-option[aria-selected]::after { content: none; }
    ucam-select .ucam-option__caixa {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      border: 1px solid var(--ucam-color-border-strong);
      border-radius: var(--ucam-radius-control-sm);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-on-action);
    }
    ucam-select .ucam-option[aria-selected='true'] .ucam-option__caixa {
      border-color: var(--ucam-color-action-primary-default);
      background: var(--ucam-color-action-primary-default);
    }
    ucam-select ul:not([aria-multiselectable]) > .ucam-option[aria-selected='true'] { font-weight: var(--ucam-typography-label-font-weight); }
    ucam-select .ucam-listbox__vazio { padding: var(--ucam-space-inline-sm); font-size: var(--ucam-typography-body-sm-font-size); color: var(--ucam-color-text-secondary); }
    ucam-select .ucam-listbox__pe {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ucam-space-inline-xs) 0 0 var(--ucam-space-inline-sm);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    ucam-select .ucam-listbox__limpar {
      min-block-size: var(--ucam-size-control-sm);
      padding: 0 0.5rem;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      font: inherit;
      color: var(--ucam-color-text-primary);
      cursor: pointer;
    }
    ucam-select .ucam-listbox__limpar:hover { background: var(--ucam-color-interaction-hover); }
    ucam-select .ucam-listbox__limpar:focus-visible { outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus); }

    [data-slot='select-content'] {
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border-color: var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
    }
  `,
})
export class UcamSelect implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input.required<UcamOption[]>();
  readonly placeholder = input('Selecione');
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);
  readonly width = input<'content' | 'full'>('full');

  /**
   * Nome do campo do qual este depende. Enquanto o pai estiver vazio o
   * controle fica bloqueado e DIZ o motivo — no legado ele aparecia
   * habilitado e vazio, sem explicar nada.
   */
  readonly dependsOn = input<string | null>(null);
  readonly dependencyFilled = input(true, { transform: booleanAttribute });

  readonly value = model<string>('');
  /** Marcar várias (ADR-078). O valor passa a ser values, e o painel ganha a caixa de marcar e o Limpar. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Os marcados, no modo múltiplo, na ordem das opções. */
  readonly values = model<string[]>([]);
  /** A fileira de alternância dentro do painel: Todos / EAD / Presencial (ADR-078). */
  readonly filter = input<UcamSelectFilter | null>(null);
  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  protected readonly ids = nextFieldIds('ucam-sel');

  protected readonly aguardandoDependencia = computed(
    () => !!this.dependsOn() && !this.dependencyFilled(),
  );

  protected readonly bloqueado = computed(
    () => this.disabled() || this.loading() || this.aguardandoDependencia(),
  );

  /** O estado de espera é anunciado por texto, não só pelo cinza do controle. */
  protected readonly hintEfetivo = computed(() => {
    if (this.aguardandoDependencia()) return `Selecione ${this.dependsOn()} primeiro.`;
    if (this.loading()) return 'Carregando opções…';
    return this.hint();
  });

  protected readonly describedBy = computed(() =>
    describedBy(this.ids, !!this.hintEfetivo(), this.invalid() && !!this.errorMessage()),
  );

  protected readonly grupos = computed(() => {
    const out: { nome: string | null; opcoes: UcamOption[] }[] = [];
    for (const o of this.options()) {
      const nome = o.group ?? null;
      const ultimo = out.at(-1);
      if (ultimo && ultimo.nome === nome) ultimo.opcoes.push(o);
      else out.push({ nome, opcoes: [o] });
    }
    return out;
  });

  // ------------------------------------------------ o painel (ADR-078) ---
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly gatilho = viewChild<ElementRef<HTMLButtonElement>>('gatilho');
  private readonly painel = viewChild<ElementRef<HTMLElement>>('painel');
  protected readonly comPainel = computed(() => this.multiple() || !!this.filter());
  protected readonly aberto = signal(false);
  protected readonly destacada = signal<string | null>(null);
  private readonly recorteEscolhido = signal<string | null>(null);
  protected readonly recorte = computed(() => this.recorteEscolhido() ?? this.filter()?.initial ?? '');
  protected readonly itensRecorte = computed<UcamSegmentItem[]>(() => {
    const f = this.filter();
    if (!f) return [];
    return [{ id: '', label: f.allLabel ?? 'Todos' }, ...f.options.map((o) => ({ id: o.value, label: o.label }))];
  });
  protected readonly visiveis = computed(() => {
    const r = this.recorte();
    return this.options().filter((o) => !r || o.filter === r);
  });
  private readonly marcadosSet = computed(() => new Set(this.multiple() ? this.values() : this.value() ? [this.value()] : []));
  protected marcado(v: string): boolean {
    return this.marcadosSet().has(v);
  }
  protected readonly rotuloVazio = computed(() => this.marcadosSet().size === 0);
  /** Nenhum = o texto de vazio; um = o nome; mais = o primeiro e "+N". */
  protected readonly rotuloGatilho = computed(() => {
    const marcadas = this.options().filter((o) => this.marcadosSet().has(o.value));
    if (!marcadas.length) return this.placeholder();
    return marcadas[0].label + (marcadas.length > 1 ? ` +${marcadas.length - 1}` : '');
  });
  protected readonly contagem = computed(() => {
    const n = this.values().length;
    return n === 0 ? 'Nenhum marcado' : n === 1 ? '1 marcado' : `${n} marcados`;
  });

  constructor() {
    // aberto → popover nativo, posicionado sob o gatilho (vira para cima sem lugar)
    afterRenderEffect(() => {
      const p = this.painel()?.nativeElement as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | undefined;
      const g = this.gatilho()?.nativeElement;
      if (!p || !g || typeof p.showPopover !== 'function') return;
      const aberto = p.matches(':popover-open');
      if (this.aberto() && !aberto) {
        p.showPopover();
        this.posicionar();
      }
      if (!this.aberto() && aberto) p.hidePopover?.();
    });
    // O painel mora na camada de cima (fixed): não acompanha a rolagem
    // sozinho. Rolar reposiciona — sem isto ele ficava em cima do gatilho.
    if (typeof window !== 'undefined') {
      const rolou = () => { if (this.aberto()) this.posicionar(); };
      window.addEventListener('scroll', rolou, { capture: true, passive: true });
      inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', rolou, { capture: true }));
    }
  }

  /** Sob o gatilho; para cima quando não cabe embaixo e cabe em cima. */
  private posicionar(): void {
    const p = this.painel()?.nativeElement;
    const g = this.gatilho()?.nativeElement;
    if (!p || !g) return;
    const r = g.getBoundingClientRect();
    p.style.minWidth = `${Math.max(r.width, 256)}px`;
    const h = p.offsetHeight;
    const y = r.bottom + 4 + h > innerHeight - 8 && r.top - h - 4 > 8 ? r.top - h - 4 : r.bottom + 4;
    p.style.left = `${Math.max(8, Math.min(r.left, innerWidth - p.offsetWidth - 8))}px`;
    p.style.top = `${y}px`;
  }

  protected alternar(): void {
    if (this.aberto()) return this.fechar(true);
    this.aberto.set(true);
    const primeiro = this.visiveis().find((o) => this.marcado(o.value) && !o.disabled) ?? this.visiveis().find((o) => !o.disabled);
    this.destacada.set(primeiro?.value ?? null);
  }

  private fechar(devolve: boolean): void {
    this.aberto.set(false);
    this.destacada.set(null);
    if (devolve) this.gatilho()?.nativeElement.focus();
  }

  protected aoSairDoCampo(e: FocusEvent): void {
    const para = e.relatedTarget as Node | null;
    if (this.aberto() && para && !this.host.nativeElement.contains(para)) this.fechar(false);
  }

  protected recortar(v: string): void {
    this.recorteEscolhido.set(v);
    this.destacada.set(this.visiveis().find((o) => !o.disabled)?.value ?? null);
  }

  protected escolher(o: UcamOption): void {
    if (o.disabled) return;
    this.destacada.set(o.value);
    if (this.multiple()) {
      const set = new Set(this.values());
      if (set.has(o.value)) set.delete(o.value);
      else set.add(o.value);
      const novo = this.options().map((x) => x.value).filter((v) => set.has(v));
      this.values.set(novo);
      this.onChangeFn(novo);
      this.onTouched();
      return;
    }
    this.value.set(o.value);
    this.onChangeFn(o.value);
    this.onTouched();
    this.fechar(true);
  }

  protected limpar(): void {
    this.values.set([]);
    this.onChangeFn([]);
    afterNextRender({ read: () => this.gatilho()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected teclar(e: KeyboardEvent): void {
    const lista = this.visiveis().filter((o) => !o.disabled);
    const i = lista.findIndex((o) => o.value === this.destacada());
    if (e.key === 'Escape') { if (this.aberto()) { e.preventDefault(); this.fechar(true); } return; }
    if (!this.aberto()) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); this.alternar(); }
      return;
    }
    const ir = (j: number) => { e.preventDefault(); this.destacada.set(lista[Math.max(0, Math.min(lista.length - 1, j))]?.value ?? null); };
    if (e.key === 'ArrowDown') ir(i + 1);
    else if (e.key === 'ArrowUp') ir(i - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(lista.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const o = lista[i];
      if (o) this.escolher(o);
    }
  }

  /** A base emite string em modo simples e string[] em múltiplo, que não usamos. */
  protected onSelect(v: string | string[]): void {
    const valor = Array.isArray(v) ? (v[0] ?? '') : v;
    this.value.set(valor);
    this.onChangeFn(valor);
    this.onTouched();
  }

  private onChangeFn: (v: string | string[]) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: string | string[] | null): void {
    if (this.multiple()) this.values.set(Array.isArray(v) ? v : v ? [v] : []);
    else this.value.set((Array.isArray(v) ? v[0] : v) ?? '');
  }
  registerOnChange(fn: (v: string | string[]) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
