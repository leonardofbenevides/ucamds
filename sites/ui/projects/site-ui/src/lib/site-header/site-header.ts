import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, computed, input, viewChild } from '@angular/core';
import { UcamSiteButton } from '../button/button';
import { UcamSiteIcon } from '../icon/icon';

export interface UcamSiteHeaderLink {
  label: string;
  href: string;
}

/**
 * Cabeçalho do site. Contrato: sites/spec/components/site-header.json.
 *
 *   <header ucamSiteHeader brand="CENPRE" brandLabel="CENPRE, página inicial"
 *           [items]="itens" current="/vagas" [action]="{ label: 'Acessar plataforma', href: '…' }"></header>
 *
 * Os links e as ações são DADOS, não conteúdo projetado: aparecem na faixa e
 * de novo no menu do telefone, e conteúdo projetado só existe uma vez.
 *
 * O menu é um <details>: abre e fecha sem script, e o estado mora nele — a
 * peça não guarda cópia. O que ela acrescenta é o que o CSS não faz:
 *  - Esc, com o foco DENTRO do menu, fecha e devolve o foco ao botão. A
 *    escuta é do próprio <details>: a tecla só é do cabeçalho quando o
 *    usuário está nele, e um menu aberto e escondido (aberto no telefone,
 *    janela alargada depois) não rouba foco nem tecla de ninguém;
 *  - sair do menu pelo Tab fecha, para o painel não cobrir o que recebeu o foco;
 *  - clicar fora fecha; seguir um link fecha.
 * A escuta em `document:` não liga nada no servidor.
 *
 * `current` é comparado ao href do item por igualdade exata: passe o mesmo
 * texto que está em `items` (com ou sem barra final, com ou sem consulta).
 */
@Component({
  selector: 'header[ucamSiteHeader]',
  imports: [UcamSiteButton, UcamSiteIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ucam-site-header',
    '(document:click)': 'aoClicar($event)',
  },
  template: `<div class="ucam-site-header__bar"><a class="ucam-site-header__brand" [attr.href]="homeHref()" [attr.aria-label]="brandLabel()?.trim() || null">{{ brand() }}</a>@if (links().length) {<nav class="ucam-site-header__nav" aria-label="Principal">@for (item of links(); track $index) {<a class="ucam-site-header__link" [attr.href]="item.href" [attr.aria-current]="item.href === current() ? 'page' : null">{{ item.label }}</a>}</nav>}@if (acoes().length) {<div class="ucam-site-header__actions">@for (acao of acoes(); track $index) {<a ucamSiteButton [variant]="acao.variante" [attr.href]="acao.href">{{ acao.label }}</a>}</div>}@if (links().length || acoes().length) {<details #menu class="ucam-site-header__menu" (keydown.escape)="aoEsc($event)" (focusout)="aoSairOFoco($event)"><summary class="ucam-site-header__toggle" [attr.aria-label]="rotuloDoMenu()"><svg ucamSiteIcon="menu"></svg></summary><nav class="ucam-site-header__mobile" [attr.aria-label]="rotuloDoMenu()">@for (item of links(); track $index) {<a class="ucam-site-header__link" [attr.href]="item.href" [attr.aria-current]="item.href === current() ? 'page' : null">{{ item.label }}</a>}@for (acao of acoes(); track $index) {<a ucamSiteButton [variant]="acao.variante" [attr.href]="acao.href">{{ acao.label }}</a>}</nav></details>}</div>`,
})
export class UcamSiteHeader {
  /** A navegação principal. Até cinco: o sexto vai para o rodapé. */
  readonly items = input.required<UcamSiteHeaderLink[], UcamSiteHeaderLink[] | null | undefined>({ transform: (v) => v ?? [] });
  /** O href da página atual: marca o mesmo link na faixa e no menu. */
  readonly current = input<string | null | undefined>(null);
  readonly homeHref = input('/');
  /** O nome do site, no link da marca. */
  readonly brand = input.required<string>();
  /** O nome acessível do link da marca, que diz o destino: "CENPRE, página inicial". */
  readonly brandLabel = input<string | null | undefined>(null);
  /** A ação primária, à direita da navegação e no fim do menu. */
  readonly action = input<UcamSiteHeaderLink | null | undefined>(null);
  /** A ação secundária: na faixa, só aparece a partir da janela larga. */
  readonly secondaryAction = input<UcamSiteHeaderLink | null | undefined>(null);
  readonly menuLabel = input<string | null | undefined>('Menu');

  private readonly menu = viewChild<ElementRef<HTMLDetailsElement>>('menu');

  protected readonly links = computed(() => this.items().filter((i) => i?.label && i?.href));
  protected readonly acoes = computed(() => {
    const lista: (UcamSiteHeaderLink & { variante: 'primary' | 'secondary' })[] = [];
    const s = this.secondaryAction();
    const p = this.action();
    if (s?.label && s.href) lista.push({ ...s, variante: 'secondary' });
    if (p?.label && p.href) lista.push({ ...p, variante: 'primary' });
    return lista;
  });
  protected readonly rotuloDoMenu = computed(() => this.menuLabel()?.trim() || 'Menu');

  /**
   * Esc com o foco dentro do menu aberto. Fechado, a tecla não é deste
   * cabeçalho e segue para quem a quiser; aberto, ela para aqui.
   */
  protected aoEsc(evento: Event): void {
    const menu = this.menu()?.nativeElement;
    if (!menu?.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
    evento.stopPropagation();
    evento.preventDefault();
  }

  /** O foco saiu do menu para outro lugar da página. Foco que some (outra janela, clique no vazio) não conta. */
  protected aoSairOFoco(evento: FocusEvent): void {
    const menu = this.menu()?.nativeElement;
    const destino = evento.relatedTarget as Node | null;
    if (menu?.open && destino && !menu.contains(destino)) menu.open = false;
  }

  protected aoClicar(evento: Event): void {
    const menu = this.menu()?.nativeElement;
    if (!menu?.open) return;
    const alvo = evento.target as Element | null;
    // Dentro do menu só o link fecha: clicar no botão é do próprio <details>.
    if (alvo && menu.contains(alvo)) {
      if (alvo.closest('a[href]')) menu.open = false;
      return;
    }
    menu.open = false;
  }
}
