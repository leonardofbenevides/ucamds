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
};

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
