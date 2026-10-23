import { ChangeDetectionStrategy, Component, Directive, ElementRef, Renderer2, ViewEncapsulation, computed, effect, inject, input } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';
import { UcamSiteIds } from '../nucleo/id';

/**
 * O campo: rótulo, controle, apoio e erro. Contrato: sites/spec/components/input.json.
 *
 *   <div ucamSiteField label="E-mail" hint="Um por semana." [error]="erro()">
 *     <input ucamSiteInput type="email" autocomplete="email">
 *   </div>
 *
 * O <input> é do consumidor: type, placeholder, autocomplete, value e disabled
 * são nativos, e é nele que se liga ngModel ou formControl. O campo cuida da
 * LIGAÇÃO — o for do rótulo, o id, e o aria-describedby só com as mensagens
 * que existem. Dentro do campo, o id e a descrição do <input> são do campo:
 * para dar o seu id use `fieldId`, e para somar uma descrição, `describedBy`.
 *
 * O erro tem uma fonte só, a entrada `error`: com texto, o campo fica
 * inválido e descrito por ele. A lib não importa @angular/forms; quem usa
 * formulário reativo escreve
 *   [error]="c.touched && c.invalid ? 'Informe o e-mail.' : null"
 */
@Component({
  selector: 'div[ucamSiteField]',
  imports: [UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-input' },
  template: `<label class="ucam-site-input__label" [attr.for]="id()">{{ label() }}</label><div class="ucam-site-input__control">@if (icon()?.trim(); as nome) {<svg class="ucam-site-input__icon" [ucamSiteIcon]="nome"></svg>}<ng-content /></div>@if (apoio(); as texto) {<p class="ucam-site-input__hint" [attr.id]="idDoApoio()">{{ texto }}</p>}@if (erro(); as texto) {<p class="ucam-site-input__erro" [attr.id]="idDoErro()">{{ texto }}</p>}`,
})
export class UcamSiteField {
  readonly label = input.required<string>();
  readonly hint = input<string | null | undefined>(null);
  readonly error = input<string | null | undefined>(null);
  readonly icon = input<string | null | undefined>(null);
  /** O id do campo. Sem ele a peça gera um, estável entre servidor e cliente. */
  readonly fieldId = input<string | null | undefined>(null);
  /** Ids de outros elementos que descrevem o campo e estão fora dele (a nota de um formulário). */
  readonly describedBy = input<string | null | undefined>(null);

  private readonly gerado = inject(UcamSiteIds).proximo('ucam-site-campo');

  readonly id = computed(() => this.fieldId()?.trim() || this.gerado);
  protected readonly apoio = computed(() => this.hint()?.trim() || null);
  protected readonly erro = computed(() => this.error()?.trim() || null);
  protected readonly idDoApoio = computed(() => (this.apoio() ? `${this.id()}-hint` : null));
  protected readonly idDoErro = computed(() => (this.erro() ? `${this.id()}-erro` : null));

  /** Só o que EXISTE: o apoio e o erro entram e saem daqui junto com o elemento. */
  readonly descricao = computed(() => [this.describedBy()?.trim(), this.idDoApoio(), this.idDoErro()].filter(Boolean).join(' ') || null);
  readonly invalido = computed(() => !!this.erro());
}

/**
 * O controle do campo: `<input ucamSiteInput>`, `<select ucamSiteInput>` ou
 * `<textarea ucamSiteInput>` (os dois últimos desde 22/10/2026, para a busca
 * de curso e o formulário de inscrição do site). Dentro de um ucamSiteField,
 * recebe dele o id, a descrição e o estado de erro.
 *
 * SOZINHO, só ganha a classe e não toca em mais nada. As três ligações eram
 * de hospedeiro, e sem campo escreviam null por cima do que o consumidor
 * LIGAVA (`[id]="x"` nascia sem id; revisão de 13/10/2026). Agora só existem
 * quando há campo, num effect que escreve os atributos pelo Renderer2.
 */
@Directive({
  selector: 'input[ucamSiteInput], select[ucamSiteInput], textarea[ucamSiteInput]',
  host: { class: 'ucam-site-input__field' },
})
export class UcamSiteInput {
  constructor() {
    const campo = inject(UcamSiteField, { optional: true });
    if (!campo) return;
    const el = inject<ElementRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    const poe = (nome: string, valor: string | null) => (valor === null ? renderer.removeAttribute(el, nome) : renderer.setAttribute(el, nome, valor));
    effect(() => {
      poe('id', campo.id());
      poe('aria-describedby', campo.descricao());
      poe('aria-invalid', campo.invalido() ? 'true' : null);
    });
  }
}
