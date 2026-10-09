// Ponto único de acesso à spec dos SITES. O JSON é gerado por
// tools/build-sites-index.mjs. Mesma regra de spec.ts: nenhum outro arquivo
// importa sites.data.json.

import bruto from '../../generated/sites.data.json';
import type { Adr, Componente } from './spec.types';
import { adrs } from './spec';

interface SitesData {
  meta: { componentes: number; versao: string; submarcas: string[] };
  componentes: Componente[];
}

const SITES = bruto as unknown as SitesData;

export const sitesMeta = SITES.meta;
export const sitesComponentes: Componente[] = SITES.componentes;

export const sitesComponentePorId = (id: string): Componente | undefined =>
  sitesComponentes.find((c) => c.id === id);

/* Os rótulos são dos sites: "layout" aqui é moldura e seção, não a moldura
   da aplicação. Categoria sem entrada vai para o fim com o próprio nome. */
const CATEGORIAS: { chave: string; rotulo: string; nota: string }[] = [
  { chave: 'layout', rotulo: 'Moldura e seção', nota: 'O que estrutura a página: cabeçalho, rodapé, hero e os cabeçalhos de seção.' },
  { chave: 'acao', rotulo: 'Ação', nota: 'Inscrever-se, ver vagas, acessar. Um primário por bloco.' },
  { chave: 'formulario', rotulo: 'Formulário', nota: 'Newsletter, busca de curso, contato.' },
  { chave: 'navegacao', rotulo: 'Navegação', nota: 'Menu, trilha e paginação.' },
  { chave: 'conteudo', rotulo: 'Conteúdo', nota: 'Cartões, tags, pastilhas de ícone, depoimentos e prosa.' },
];

export interface GrupoSites {
  chave: string;
  rotulo: string;
  nota: string;
  itens: Componente[];
}

export function sitesPorCategoria(): GrupoSites[] {
  const grupos = new Map<string, Componente[]>();
  for (const c of sitesComponentes) {
    const lista = grupos.get(c.category) ?? [];
    lista.push(c);
    grupos.set(c.category, lista);
  }
  const conhecidas = CATEGORIAS.filter((c) => grupos.has(c.chave)).map((c) => ({ ...c, itens: grupos.get(c.chave)! }));
  const restantes = [...grupos.keys()]
    .filter((k) => !CATEGORIAS.some((c) => c.chave === k))
    .map((k) => ({ chave: k, rotulo: k, nota: '', itens: grupos.get(k)! }));
  return [...conhecidas, ...restantes];
}

/**
 * ADRs que citam ESTE componente dos sites em afeta, pelo seletor dos sites.
 *
 * Não reaproveita decisoesQueAfetam() da aplicação: ela casa pelo id, e o
 * button dos sites herdava as vinte e uma ADRs do button da aplicação —
 * controle de 36px, outputs do Angular, Trilho A+ — na mesma página em que o
 * contrato diz 44px e CSS puro (revisão de 09/10/2026).
 */
export function sitesDecisoesQueAfetam(id: string): Adr[] {
  return adrs.filter((a) => a.afeta.some((x) => x === `ucam-site-${id}`));
}

export function sitesDependentesDe(id: string): Componente[] {
  const seletor = `ucam-site-${id}`;
  return sitesComponentes.filter((c) => c.composicao?.usa?.includes(seletor));
}
