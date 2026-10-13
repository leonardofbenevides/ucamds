/**
 * O contrato de cada peça, lido da spec. Os testes tiram daqui a classe-raiz
 * e a classe de cada valor de cada entrada: quem manda nos nomes é o
 * contrato, não o teste.
 */
import button from '../../../../../spec/components/button.json';
import tag from '../../../../../spec/components/tag.json';
import iconChip from '../../../../../spec/components/icon-chip.json';
import avatar from '../../../../../spec/components/avatar.json';
import sectionHeading from '../../../../../spec/components/section-heading.json';
import breadcrumb from '../../../../../spec/components/breadcrumb.json';
import pageShell from '../../../../../spec/components/page-shell.json';
import accordion from '../../../../../spec/components/accordion.json';
import input from '../../../../../spec/components/input.json';
import pagination from '../../../../../spec/components/pagination.json';
import newsletterForm from '../../../../../spec/components/newsletter-form.json';
import siteHeader from '../../../../../spec/components/site-header.json';
import siteFooter from '../../../../../spec/components/site-footer.json';
import heroPill from '../../../../../spec/components/hero-pill.json';
import prose from '../../../../../spec/components/prose.json';
import statsBand from '../../../../../spec/components/stats-band.json';
import docCard from '../../../../../spec/components/doc-card.json';
import testimonial from '../../../../../spec/components/testimonial.json';
import stepCard from '../../../../../spec/components/step-card.json';
import card from '../../../../../spec/components/card.json';
import courseCard from '../../../../../spec/components/course-card.json';
import hero from '../../../../../spec/components/hero.json';
import editorialPageHero from '../../../../../spec/components/editorial-page-hero.json';
import editorialCta from '../../../../../spec/components/editorial-cta.json';

export interface Prop {
  nome: string;
  tipo: string;
  default?: string;
  valores?: Record<string, { uso?: string; classe?: string }>;
}

const CONTRATOS: Record<string, unknown> = {
  button,
  tag,
  'icon-chip': iconChip,
  avatar,
  'section-heading': sectionHeading,
  'breadcrumb': breadcrumb,
  'page-shell': pageShell,
  'accordion': accordion,
  'input': input,
  'pagination': pagination,
  'newsletter-form': newsletterForm,
  'site-header': siteHeader,
  'site-footer': siteFooter,
  'hero-pill': heroPill,
  'prose': prose,
  'stats-band': statsBand,
  'doc-card': docCard,
  'testimonial': testimonial,
  'step-card': stepCard,
  'card': card,
  'course-card': courseCard,
  'hero': hero,
  'editorial-page-hero': editorialPageHero,
  'editorial-cta': editorialCta,
};

/**
 * As entradas de cada peça, pelo atributo de seletor em minúsculas
 * (`ucamsitebutton` → variant, size, inverse). Sai do `trilho_b` do
 * contrato; o normalizador de paridade usa para saber quais atributos de um
 * elemento são entrada e não atributo de verdade.
 */
export const ENTRADAS_POR_SELETOR: Record<string, string[]> = { ucamsiteicon: ['ucamsiteicon'] };
for (const c of Object.values(CONTRATOS) as { implementacao: { trilho_b?: string } }[]) {
  // Depois das Entradas o texto pode seguir com Nativos e Conteúdo.
  const m = / — (.+?)\. Entradas: ([^.]+)\./.exec(c.implementacao.trilho_b ?? '');
  if (!m) continue;
  const entradas = m[2].split(',').map((x) => x.trim());
  for (const s of m[1].matchAll(/\[([A-Za-z]+)\]/g)) ENTRADAS_POR_SELETOR[s[1].toLowerCase()] = entradas;
}

export function contratoDe(id: string): { props: Prop[]; raiz: string } {
  const c = CONTRATOS[id] as { props: Prop[]; implementacao: { trilho_a: { raiz: string } } } | undefined;
  if (!c) throw new Error(`contrato desconhecido: ${id}`);
  return { props: c.props, raiz: c.implementacao.trilho_a.raiz.replace(/^\./, '') };
}

/** Os pares (entrada, valor, classe) que o contrato declara. `classe` vem sem o ponto, ou null. */
export function casosDe(id: string): { nome: string; valor: string | boolean; classe: string | null }[] {
  return contratoDe(id).props.flatMap((p) =>
    Object.entries(p.valores ?? {}).map(([valor, v]) => ({
      nome: p.nome,
      valor: p.tipo === 'boolean' ? valor === 'true' : valor,
      classe: v.classe ? v.classe.replace(/^\./, '') : null,
    })),
  );
}
