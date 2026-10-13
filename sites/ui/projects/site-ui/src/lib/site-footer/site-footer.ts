import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';

export interface UcamSiteFooterLink {
  label: string;
  href?: string | null;
}

export interface UcamSiteFooterColumn {
  title: string;
  links: UcamSiteFooterLink[];
}

export interface UcamSiteFooterContact {
  title: string;
  items: UcamSiteFooterLink[];
}

/**
 * Rodapé do site. Contrato: sites/spec/components/site-footer.json.
 *
 *   <footer ucamSiteFooter brand="Universidade Candido Mendes" legal="© 2026 …"
 *           [columns]="colunas" [contact]="contato" [social]="redes">
 *     <a ucamSiteFooterMarca ucamSiteButton variant="secondary" inverse href="/portal">Acessar o portal</a>
 *   </footer>
 *
 * O que se repete — colunas, links, contato, redes — entra como dado. O bloco
 * da marca tem um lugar livre, marcado com `ucamSiteFooterMarca`: é onde vai
 * o botão do portal ou um endereço. O que não tem dado não deixa marcação:
 * sem redes não há lista vazia, sem contato não há título órfão.
 */
@Component({
  selector: 'footer[ucamSiteFooter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-footer' },
  template: `<div class="ucam-site-footer__inner"><div class="ucam-site-footer__grid"><div class="ucam-site-footer__brand"><span>{{ brand() }}</span><ng-content select="[ucamSiteFooterMarca]" /></div>@for (coluna of colunas(); track $index) {<div><h2 class="ucam-site-footer__col-title">{{ coluna.title }}</h2><ul class="ucam-site-footer__col">@for (link of coluna.links; track $index) {<li><a class="ucam-site-footer__link" [attr.href]="link.href">{{ link.label }}</a></li>}</ul></div>}@if (contato(); as c) {<div><h2 class="ucam-site-footer__col-title">{{ c.title }}</h2><address class="ucam-site-footer__contact">@for (item of c.items; track $index) {@if (item.href) {<a class="ucam-site-footer__link" [attr.href]="item.href">{{ item.label }}</a>} @else {<span>{{ item.label }}</span>}}</address></div>}</div><div class="ucam-site-footer__bottom"><p class="ucam-site-footer__legal">{{ legal() }}</p>@if (redes().length) {<ul class="ucam-site-footer__social">@for (rede of redes(); track $index) {<li><a class="ucam-site-footer__link" [attr.href]="rede.href">{{ rede.label }}</a></li>}</ul>}</div></div>`,
})
export class UcamSiteFooter {
  /** O nome da instituição, no bloco da marca. */
  readonly brand = input.required<string>();
  /** A linha de direitos. */
  readonly legal = input.required<string>();
  /** As colunas de links. Três ou quatro. */
  readonly columns = input<UcamSiteFooterColumn[], UcamSiteFooterColumn[] | null | undefined>([], { transform: (v) => v ?? [] });
  /** A coluna de contato: item com href é link (e-mail, mapa), sem href é texto (telefone, endereço). */
  readonly contact = input<UcamSiteFooterContact | null | undefined>(null);
  /** As redes sociais que têm endereço. */
  readonly social = input<UcamSiteFooterLink[], UcamSiteFooterLink[] | null | undefined>([], { transform: (v) => v ?? [] });

  private readonly comRotulo = (lista: UcamSiteFooterLink[] | null | undefined) => (lista ?? []).filter((x) => x?.label?.trim());
  private readonly comDestino = (lista: UcamSiteFooterLink[] | null | undefined) => this.comRotulo(lista).filter((x) => x.href);

  /** Coluna sem título ou sem nenhum link de verdade não aparece: não há <h2> órfão nem lista vazia. */
  protected readonly colunas = computed(() =>
    this.columns()
      .map((c) => ({ title: c?.title?.trim() ?? '', links: this.comDestino(c?.links) }))
      .filter((c) => c.title && c.links.length),
  );
  protected readonly contato = computed(() => {
    const c = this.contact();
    const items = this.comRotulo(c?.items);
    return c?.title?.trim() && items.length ? { title: c.title.trim(), items } : null;
  });
  protected readonly redes = computed(() => this.comDestino(this.social()));
}

/** Marca o conteúdo que vai no bloco da marca do rodapé: `<a ucamSiteFooterMarca …>`. */
@Directive({ selector: '[ucamSiteFooterMarca]' })
export class UcamSiteFooterMarca {}
