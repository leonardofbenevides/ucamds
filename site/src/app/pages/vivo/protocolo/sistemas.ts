import type { UcamSystemLink } from '@ucam/ui';

/**
 * O PAINEL DE APPS das telas vivas do Protocolo (ADR-093): a mesma lista
 * que spec/templates.json declara em protocolo.shell.rail, com o mesmo
 * destino que o Trilho A dá a cada sistema (a primeira tela do projeto).
 * Sem href, o sistema não tem tela de referência e o item não navega.
 */
export const SISTEMAS_PROTOCOLO: UcamSystemLink[] = [
  { label: 'Meus sistemas', icon: 'layoutGrid', href: '/t/portal/grade-modulos.html' },
  { label: 'Protocolo', icon: 'clipboardList', href: '/t/protocolo/analise-requerimento.html', current: true },
  { label: 'Acadêmico', icon: 'graduationCap' },
  { label: 'Isenção', icon: 'clipboardCheck', href: '/t/isencao/fila.html' },
  { label: 'Financeiro', icon: 'wallet', href: '/t/sigfin/movimento-caixa.html' },
  { label: 'Relatórios', icon: 'chartColumn', href: '/t/relatorios/catalogo.html' },
  { label: 'Gerencial', icon: 'lock', href: '/t/gerencial/inicio.html' },
  { label: 'Arquivo permanente', icon: 'archive' },
];
