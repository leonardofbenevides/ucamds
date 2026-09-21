// Ponto único de acesso à spec.
//
// O JSON é gerado por tools/build-index.mjs. Nenhum outro arquivo do site
// importa spec.data.json direto: se a forma mudar, muda aqui e o TypeScript
// aponta todos os consumidores de uma vez.

import bruto from '../../generated/spec.data.json';
import type {
  Adr,
  Componente,
  Fundamentos,
  ItemBusca,
  Meta,
  Layouts,
  Padrao,
  ProjetoTelas,
  Migracao,
  Recursos,
  Release,
  SpecData,
} from './spec.types';

// O JSON não carrega os tipos — a validação de forma é do JSON Schema, em
// tools/validate-spec.mjs, que roda no CI antes deste arquivo existir.
const SPEC = bruto as unknown as SpecData;

export const meta: Meta = SPEC.meta;
export const fundamentos: Fundamentos = SPEC.fundamentos;
export const componentes: Componente[] = SPEC.componentes;
export const padroes: Padrao[] = SPEC.padroes;
export const layouts: Layouts = SPEC.layouts;
export const telas: ProjetoTelas[] = SPEC.telas;
export const adrs: Adr[] = SPEC.adrs;
/**
 * Os marcadores da spec, resolvidos UMA VEZ, aqui.
 *
 * `{versao}` e `{host}` existem em spec/resources.json porque a versão e o
 * host têm uma fonte só — o package.json da raiz e o próprio campo
 * `publicacao.host` — e escrevê-los por extenso nos exemplos criaria a
 * segunda, que envelhece calada no primeiro bump ou na primeira troca de
 * domínio. tools/build-publicacao.mjs resolve os mesmos dois e confere se a
 * URL resultante existe na saída publicada.
 *
 * POR QUE AQUI, E NÃO NA PÁGINA QUE MOSTRA O EXEMPLO: a página de instalação
 * resolvia só o campo `codigo`. No dia em que a prosa do Trilho A passou a
 * ensinar o sprite, o leitor viu "{host}/icons/sprite.svg" — e o portão
 * aprovou, porque ele resolve o marcador antes de conferir. Pior: a home
 * também mostra os trilhos, e imprimia o mesmo marcador cru. Resolver no
 * consumidor é lembrar em cada consumidor; resolver na fronteira é não ter de
 * lembrar.
 */
const MARCADORES: Record<string, string> = {
  '{versao}': SPEC.meta.versao,
  '{host}': SPEC.recursos.publicacao.host,
};

function resolverMarcadores<T>(valor: T): T {
  if (typeof valor === 'string') {
    let s: string = valor;
    for (const [marca, v] of Object.entries(MARCADORES)) s = s.replaceAll(marca, v);
    return s as T;
  }
  if (Array.isArray(valor)) return valor.map(resolverMarcadores) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, resolverMarcadores(v)]),
    ) as T;
  }
  return valor;
}

export const recursos: Recursos = resolverMarcadores(SPEC.recursos);
export const migracao: Migracao = SPEC.migracao;
export const releases: Release[] = SPEC.releases;
export const busca: ItemBusca[] = SPEC.busca;

export const componentePorId = (id: string): Componente | undefined =>
  componentes.find((c) => c.id === id);

export const padraoPorId = (id: string): Padrao | undefined =>
  padroes.find((p) => p.id === id);

export const projetoPorId = (id: string): ProjetoTelas | undefined =>
  telas.find((p) => p.id === id);

export const telaPorId = (projeto: string, id: string) => {
  const p = projetoPorId(projeto);
  const t = p?.templates.find((x) => x.id === id);
  return t && p ? { projeto: p, tela: t } : undefined;
};

export const blocoPorId = (id: string) => layouts.blocos.find((b) => b.id === id);

export const adrPorSlug = (slug: string): Adr | undefined =>
  adrs.find((a) => a.slug === slug);

/**
 * Ordem e rótulo de exibição das categorias do catálogo.
 *
 * A ordem é de leitura, não alfabética: primeiro o que estrutura a tela, depois
 * o que o usuário opera, depois o que o sistema responde. Categoria que aparecer
 * na spec sem entrada aqui vai para o fim com o próprio nome — o catálogo não
 * esconde componente por falta de tradução.
 */
const CATEGORIAS: { chave: string; rotulo: string; nota: string }[] = [
  { chave: 'layout', rotulo: 'Estrutura', nota: 'A moldura da aplicação e a hierarquia da tela.' },
  { chave: 'acao', rotulo: 'Ações', nota: 'Dispara algo. O peso visual segue a hierarquia, não o gosto.' },
  {
    chave: 'formulario',
    rotulo: 'Formulário',
    nota: 'Entrada de dados. Rótulo persistente, formato declarado, erro que ensina a correção.',
  },
  { chave: 'dados', rotulo: 'Dados', nota: 'Apresentação tabular e navegação entre resultados.' },
  { chave: 'navegacao', rotulo: 'Navegação', nota: 'Movimento entre páginas de um conjunto.' },
  {
    chave: 'feedback',
    rotulo: 'Feedback e estado',
    nota: 'O que o sistema responde: situação, carregamento e ausência de conteúdo.',
  },
  { chave: 'sobreposicao', rotulo: 'Sobreposição', nota: 'Camadas sobre a página. Metade dos usos observados no legado é uso indevido.' },
  { chave: 'conteudo', rotulo: 'Conteúdo', nota: 'Representação de pessoas e entidades.' },
];

export interface GrupoCategoria {
  chave: string;
  rotulo: string;
  nota: string;
  itens: Componente[];
}

/** Componentes agrupados por categoria, na ordem de leitura de CATEGORIAS. */
export function componentesPorCategoria(): GrupoCategoria[] {
  const grupos = new Map<string, Componente[]>();
  for (const c of componentes) {
    const lista = grupos.get(c.category) ?? [];
    lista.push(c);
    grupos.set(c.category, lista);
  }

  const conhecidas = CATEGORIAS.filter((c) => grupos.has(c.chave)).map((c) => ({
    ...c,
    itens: grupos.get(c.chave)!,
  }));

  const restantes = [...grupos.keys()]
    .filter((k) => !CATEGORIAS.some((c) => c.chave === k))
    .map((k) => ({ chave: k, rotulo: k, nota: '', itens: grupos.get(k)! }));

  return [...conhecidas, ...restantes];
}

/**
 * Quem depende de um componente. A spec declara `composicao.usa`; a relação
 * inversa é derivada, para que a página de um componente possa dizer o que
 * quebra se ele mudar.
 */
export function dependentesDe(id: string): Componente[] {
  const seletor = `ucam-${id}`;
  return componentes.filter((c) => c.composicao?.usa?.includes(seletor));
}

/** ADRs que citam este componente em `afeta`. */
export function decisoesQueAfetam(id: string): Adr[] {
  return adrs.filter((a) => a.afeta.some((x) => x === id || x === `ucam-${id}`));
}
