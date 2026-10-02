import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  UcamButton,
  UcamColumnDef,
  UcamDataTable,
  UcamEmptyState,
  UcamOption,
  UcamPageHeader,
  UcamPagination,
  UcamSegmentItem,
  UcamSegmented,
  UcamSelect,
  UcamSkeleton,
  UcamTabItem,
  UcamTabs,
  UcamTextField,
} from '@ucam/ui';
import { SITUACOES, Situacao, dataCurta } from '../../isencao/isencao.model';
import { MolduraBanca } from '../moldura-banca';
import { IsencaoStore, SolicitacaoNaFila } from './isencao.store';

type Recorte = 'analise' | 'concluidas';
const TODOS_OS_CURSOS = 'todos';
const TODAS = 'todas';
const POR_PAGINA = 10;

/**
 * A fila de isenção de disciplinas da secretaria: quem pediu, de que curso,
 * e em que pé está (padrão listagem-crud; tela `isencao/fila` do DS). É a
 * `admin/isencao` do legado, sem a sanfona por unidade e curso: curso é
 * coluna e filtro, e a situação é recorte.
 */
@Component({
  selector: 'app-fila-isencao',
  imports: [MolduraBanca, UcamButton, UcamDataTable, UcamEmptyState, UcamPageHeader, UcamPagination, UcamSegmented, UcamSelect, UcamSkeleton, UcamTabs, UcamTextField],
  templateUrl: './fila.html',
})
export class FilaIsencaoPage {
  readonly store = inject(IsencaoStore);

  readonly trilha = [{ label: 'Isenção' }, { label: 'Fila de análise' }];
  readonly recorte = signal<Recorte>('analise');
  readonly situacao = signal<string>(TODAS);
  readonly busca = signal('');
  readonly curso = signal(TODOS_OS_CURSOS);
  readonly pagina = signal(1);
  readonly porPagina = POR_PAGINA;

  readonly abas = computed<UcamTabItem[]>(() => [
    { id: 'analise', label: 'Em análise', count: this.store.emAnalise().length },
    { id: 'concluidas', label: 'Concluídas', count: this.store.concluidas().length },
  ]);
  readonly situacoes: UcamSegmentItem[] = [
    { id: TODAS, label: 'Todas' },
    { id: 'envio', label: SITUACOES.envio.label },
    { id: 'analise', label: SITUACOES.analise.label },
    { id: 'candidato', label: SITUACOES.candidato.label },
  ];
  private readonly doRecorte = computed(() => (this.recorte() === 'analise' ? this.store.emAnalise() : this.store.concluidas()));
  readonly opcoesCurso = computed<UcamOption[]>(() => [
    { value: TODOS_OS_CURSOS, label: 'Todos os cursos' },
    ...[...new Set(this.doRecorte().map((s) => s.curso))].sort().map((c) => ({ value: c, label: c })),
  ]);

  readonly colunas = computed<UcamColumnDef[]>(() => [
    { key: 'candidato', header: 'Candidato', type: 'person', priority: 10 },
    { key: 'curso', header: 'Curso', priority: 6 },
    { key: 'periodo', header: 'Período letivo', width: 'min', priority: 3 },
    { key: 'solicitada', header: 'Solicitada em', width: 'min', priority: 4 },
    ...(this.recorte() === 'analise' ? [{ key: 'movimentada', header: 'Movimentada em', width: 'min', priority: 2 } as UcamColumnDef] : []),
    { key: 'situacao', header: 'Situação', type: 'status', width: 'min', priority: 8 },
  ]);

  readonly filtradas = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const situacao = this.recorte() === 'analise' ? this.situacao() : TODAS;
    const curso = this.curso();
    return this.doRecorte()
      .filter((s) => situacao === TODAS || s.situacao === (situacao as Situacao))
      .filter((s) => curso === TODOS_OS_CURSOS || s.curso === curso)
      .filter((s) => !termo || s.nome.toLocaleLowerCase('pt-BR').includes(termo))
      .sort((a, b) => (b.candidato.datasolicitacao ?? '').localeCompare(a.candidato.datasolicitacao ?? ''));
  });
  readonly temFiltro = computed(() => !!this.busca().trim() || this.curso() !== TODOS_OS_CURSOS || (this.recorte() === 'analise' && this.situacao() !== TODAS));
  readonly linhas = computed(() => this.filtradas().slice((this.pagina() - 1) * POR_PAGINA, this.pagina() * POR_PAGINA).map((s) => this.linha(s)));
  readonly legenda = computed(() => (this.recorte() === 'analise' ? 'Solicitações de isenção em análise' : 'Solicitações de isenção concluídas'));

  constructor() {
    void this.store.carregar();
    // Mudou o que a lista mostra: volta à primeira página.
    effect(() => {
      this.filtradas();
      this.pagina.set(1);
    });
  }

  private linha(s: SolicitacaoNaFila) {
    return {
      candidato: { name: s.nome, href: `/banca/isencao/${s.oid}` },
      curso: s.curso,
      periodo: s.candidato.periodoLetivo ?? null,
      solicitada: dataCurta(s.candidato.datasolicitacao),
      movimentada: dataCurta(s.candidato.dataalteracao),
      situacao: { label: SITUACOES[s.situacao].label, tone: SITUACOES[s.situacao].tone },
    };
  }

  trocarRecorte(id: string): void {
    this.recorte.set(id === 'concluidas' ? 'concluidas' : 'analise');
    // O curso escolhido pode não existir no outro recorte.
    if (!this.opcoesCurso().some((o) => o.value === this.curso())) this.curso.set(TODOS_OS_CURSOS);
  }

  limparFiltros(): void {
    this.busca.set('');
    this.curso.set(TODOS_OS_CURSOS);
    this.situacao.set(TODAS);
  }
}
