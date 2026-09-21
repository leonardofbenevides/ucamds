import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input,  ViewEncapsulation } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import type { ZardButtonSizeVariants, ZardButtonTypeVariants } from '@/shared/components/button/button.variants';
import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/icon-button.json
 *
 * Separado do Button porque aqui o nome acessível deixa de ser opcional.
 * Todo botão de ícone do parque atual é anônimo para leitor de tela — o ×
 * dos diálogos e os quatro controles de paginação de cada tabela. É uma
 * classe de falha que se repete por multiplicação, então vira erro de
 * desenvolvimento, não aviso de lint.
 */
export type UcamIconButtonVariant = 'ghost' | 'secondary';
export type UcamIconButtonTone = 'neutral' | 'danger';

const VARIANT_MAP: Record<UcamIconButtonVariant, ZardButtonTypeVariants> = {
  ghost: 'ghost',
  secondary: 'outline',
};

/**
 * ADR-015: tom e peso são eixos separados. Aqui o peso não chega a primary —
 * a ação principal de uma tela leva rótulo em texto, e isso é o Button.
 *
 * O contrato PROÍBE preenchimento vermelho sólido neste componente, e a
 * proibição tem endereço: o botão de ícone vive repetido em linha de tabela,
 * e vinte quadrados vermelhos numa listagem viram textura em vez de aviso.
 * Por isso as duas entradas pintam apenas texto e borda.
 */
const TONE_CLASSES: Record<UcamIconButtonVariant, string> = {
  ghost: [
    'text-[var(--ucam-color-action-danger-default)]',
    'hover:bg-[var(--ucam-color-action-danger-subtle)]',
    'hover:text-[var(--ucam-color-action-danger-default)]',
  ].join(' '),
  secondary: [
    'border-[var(--ucam-color-action-danger-default)]',
    'text-[var(--ucam-color-action-danger-default)]',
    'hover:bg-[var(--ucam-color-action-danger-subtle)]',
    'hover:text-[var(--ucam-color-action-danger-default)]',
  ].join(' '),
};

const SIZE_MAP: Record<'sm' | 'md', ZardButtonSizeVariants> = {
  sm: 'icon-sm',
  md: 'icon',
};

@Component({
  selector: 'ucam-icon-button',
  exportAs: 'ucamIconButton',
  imports: [ZardButtonComponent, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      z-button
      [zType]="zType()"
      [zSize]="zSize()"
      [class]="extraClasses()"
      [attr.data-tone]="tone() === 'neutral' ? null : tone()"
      type="button"
      [attr.aria-pressed]="ariaPressed()"
      [attr.aria-label]="label()"
      [attr.title]="tooltip() ? label() : null"
      [attr.disabled]="disabled() ? '' : null"
      [attr.aria-disabled]="loading() ? 'true' : null"
      [attr.aria-busy]="loading() ? 'true' : null"
      (click)="onClick($event)"
    >
      <ucam-icon [name]="loading() ? 'loaderCircle' : icon()" [size]="size() === 'sm' ? 'sm' : 'md'" [class]="loading() ? 'animate-spin' : ''" />
    </button>
  `,
  styles: `
    /* INTERRUPTOR — icon-button.json, prop pressed. Espelho do bloco
       .ucam-btn--icon[aria-pressed="true"] de tools/build-css.mjs.
       Precisa existir aqui porque no Trilho B a classe .ucam-btn não existe:
       quem desenha o botão é o z-button, e o que endereça o estado é o
       atributo — o mesmo que o leitor de tela anuncia.

       Estado é TINTA translúcida (ADR-013), não fundo sólido: a estrela que
       fixa um módulo vive sobre o cartão branco, sobre a faixa da tabela e
       sobre o painel escuro, e o mesmo degrau precisa valer nos três. */
    ucam-icon-button button[aria-pressed='true'] {
      background-image: linear-gradient(
        var(--ucam-color-interaction-selected),
        var(--ucam-color-interaction-selected)
      );
      color: var(--ucam-color-action-primary-default);
      --ucam-icon-fill: currentColor;
    }

    /* Pressionado E sob o ponteiro: as duas tintas EMPILHAM em vez de a
       segunda substituir a primeira. Sem isto, apontar um botão já
       pressionado o deixava mais claro que o vizinho solto sob o ponteiro.

       O :hover do z-button é uma utilitária de uma classe; este seletor tem
       elemento + atributo + pseudo-classe e vence sem !important. */
    ucam-icon-button button[aria-pressed='true']:hover:not(:disabled) {
      background-image:
        linear-gradient(var(--ucam-color-interaction-hover), var(--ucam-color-interaction-hover)),
        linear-gradient(var(--ucam-color-interaction-selected), var(--ucam-color-interaction-selected));
      color: var(--ucam-color-action-primary-default);
    }

    /* A FORMA muda junto com a cor — traçado quando solto, sólido quando
       pressionado. Cor sozinha não distingue (WCAG 1.4.1) e, numa grade de
       vinte estrelas iguais, a diferença de matiz é a primeira coisa que some.

       Aqui o ícone é SVG inline do @ng-icons, não <use> de sprite: o conteúdo
       é alcançável por seletor e o fill="none" do lucide, que é atributo de
       apresentação, perde para qualquer declaração de CSS. A variável continua
       sendo o contrato — é por ela que os dois trilhos são endereçados igual —,
       só o encanamento difere. */
    ucam-icon-button button ucam-icon svg {
      fill: var(--ucam-icon-fill, none);
    }
  `,
})
export class UcamIconButton {
  readonly icon = input.required<UcamIconName>();
  /** Nome acessível. Sem default e sem valor vazio permitido. */
  readonly label = input.required<string>();
  readonly variant = input<UcamIconButtonVariant>('ghost');
  /** Natureza da ação, eixo separado do peso. ADR-015. */
  readonly tone = input<UcamIconButtonTone>('neutral');
  readonly size = input<'sm' | 'md'>('md');
  /**
   * Torna o botão um INTERRUPTOR de dois estados. null — o padrão — é o botão
   * comum, que dispara e não guarda nada; true/false emitem aria-pressed e o
   * leitor de tela passa a anunciar "pressionado" junto com o nome.
   *
   * SEM booleanAttribute de propósito: a transformação converteria null em
   * false e todo botão de ícone do sistema passaria a se anunciar como
   * interruptor solto. A distinção entre "não é interruptor" e "é interruptor
   * e está solto" é o valor inteiro desta prop.
   *
   * O `label` acompanha a AÇÃO e troca com o estado — "Fixar Financeiro nos
   * acessos frequentes" quando solto, "Remover…" quando pressionado. Label que
   * descreve o estado colide com o que o aria-pressed já anuncia.
   */
  readonly pressed = input<boolean | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly tooltip = input(true, { transform: booleanAttribute });

  /*
   * NÃO existe output `click` aqui, e a ausência é a correção.
   *
   * Havia um. O clique do <button> interno emitia o output E continuava
   * borbulhando até o host <ucam-icon-button>, onde o (click) do consumidor
   * também escuta — resultado: UM clique, DUAS execuções do handler. Medido no
   * catálogo com um contador: 1 clique → 2.
   *
   * Ficou invisível por sorte de teste: todo consumidor existente escrevia
   * handler idempotente (`excluiu.set(true)`, `salvar()`), e executar duas
   * vezes dá o mesmo resultado. Quem revelou foi o primeiro handler que NÃO é
   * idempotente — o interruptor da estrela, `fixado.set(!fixado())`, que
   * alternava duas vezes e voltava ao estado inicial. Num formulário de
   * verdade isso é a submissão em dobro.
   *
   * O evento nativo já sobe do <button> para o host: o (click) do consumidor
   * continua funcionando, agora uma vez só. O guarda de loading/disabled
   * abaixo é o que impede a subida quando o botão não deve agir.
   */

  /*
   * O template não alcança o String global, e o atributo precisa da STRING
   * 'false' quando o interruptor está solto: aria-pressed={{false}} some do
   * DOM e o botão volta a se anunciar como ação comum.
   */
  protected readonly ariaPressed = computed(() => {
    const p = this.pressed();
    return p === null ? null : p ? 'true' : 'false';
  });

  protected readonly zType = computed(() => VARIANT_MAP[this.variant()]);
  protected readonly zSize = computed(() => SIZE_MAP[this.size()]);

  protected readonly extraClasses = computed(() =>
    this.tone() === 'danger' ? TONE_CLASSES[this.variant()] : '',
  );

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        if (!this.label()?.trim()) {
          throw new Error(
            '[ucam-icon-button] label é obrigatório e não pode ser vazio. Sem ele o botão é anônimo para leitor de tela. Ver spec/components/icon-button.json.',
          );
        }
      });
    }
  }

  protected onClick(event: MouseEvent): void {
    if (this.loading() || this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
}

declare const ngDevMode: boolean;
