import { Component, ElementRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import {
  UcamAlert,
  UcamAnexo,
  UcamBadge,
  UcamButton,
  UcamCard,
  UcamDescriptionList,
  UcamDialog,
  UcamEmptyState,
  UcamFile,
  UcamOption,
  UcamPageHeader,
  UcamSectionBar,
  UcamSegmentItem,
  UcamSegmented,
  UcamSelect,
  UcamSkeleton,
  UcamTextField,
  UcamTextarea,
} from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { formatarCpf } from '../../core/store/candidato.store';
import { IsencaoApi } from '../../isencao/isencao.api';
import {
  DECISOES,
  Decisao,
  DisciplinaIsencao,
  IsencaoAnalise,
  MatrizOpcao,
  SITUACOES,
  Semestres,
  dataCurta,
  decisaoDe,
  disciplinasEmOrdem,
  situacaoDe,
} from '../../isencao/isencao.model';
import { MolduraBanca } from '../moldura-banca';
import { IsencaoStore } from './isencao.store';

type Estado = 'loading' | 'pronto' | 'error';
const TODOS = 'todos';
const SEM_DECISAO = 'sem';
const MAX_MOTIVO = 300;
const MAX_OBSERVACAO = 150;

type Campo = 'descricao' | 'ies' | 'cargaHoraria' | 'motivo';

/** Uma disciplina em edição: o que vai ao backend e os erros de cada campo. */
export interface DisciplinaEmAnalise {
  chave: string;
  periodo: string;
  d: DisciplinaIsencao;
  erros: Partial<Record<Campo, string>>;
}

interface Dialogo {
  tipo: 'faltam' | 'finalizar' | 'pedido';
  titulo: string;
  texto: string;
}

/**
 * A análise de uma solicitação de isenção, em tela inteira: as disciplinas da
 * matriz com a decisão de cada uma na coluna principal; a solicitação, os
 * documentos e a observação ao candidato no painel de apoio (tela
 * `isencao/analise` do DS, com `consulta` e `sem-documentos` como estados).
 *
 * Do legado (`admin/isencao`): a matriz se escolhe antes de decidir; isentar
 * pede a disciplina de origem, a instituição e a carga horária; pedir
 * documento pede o que falta, que o candidato lê; salvar guarda sem fechar.
 *
 * Do desenho do DS, e mais rígido que o legado: disciplina sem decisão barra
 * o fechamento (o legado deixava finalizar com disciplina em branco).
 */
@Component({
  selector: 'app-analise-isencao',
  imports: [
    MolduraBanca,
    UcamAlert,
    UcamAnexo,
    UcamBadge,
    UcamButton,
    UcamCard,
    UcamDescriptionList,
    UcamDialog,
    UcamEmptyState,
    UcamPageHeader,
    UcamSectionBar,
    UcamSegmented,
    UcamSelect,
    UcamSkeleton,
    UcamTextField,
    UcamTextarea,
  ],
  templateUrl: './analise.html',
})
export class AnaliseIsencaoPage {
  /** O oid da inscrição (forma de ingresso da pessoa), da rota. */
  readonly oid = input.required<string>();

  readonly store = inject(IsencaoStore);
  private readonly api = inject(IsencaoApi);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly maxMotivo = MAX_MOTIVO;
  readonly maxObservacao = MAX_OBSERVACAO;
  readonly opcoesDecisao: UcamSegmentItem[] = [
    { id: SEM_DECISAO, label: 'Sem decisão' },
    { id: 'isentar', label: 'Isentar' },
    { id: 'nao', label: 'Não isentar' },
    { id: 'documento', label: 'Pedir documento' },
  ];

  readonly solicitacao = computed(() => this.store.achar(this.oid()));
  readonly naoEncontrada = computed(() => this.store.estado() === 'pronto' && !this.solicitacao());
  readonly nome = computed(() => this.solicitacao()?.nome ?? 'Solicitação de isenção');
  readonly trilha = computed(() => [{ label: 'Fila de análise', link: '/banca/isencao' }, { label: this.nome() }]);

  readonly matrizes = signal<MatrizOpcao[]>([]);
  readonly matrizOid = signal('');
  readonly opcoesMatriz = computed<UcamOption[]>(() => this.matrizes().map((m) => ({ value: m.oidmatriz, label: m.matriz })));
  readonly codigoMatriz = computed(() => this.matrizes().find((m) => m.oidmatriz === this.matrizOid())?.matriz ?? null);
  readonly estadoAnalise = signal<Estado | 'sem-matriz'>('loading');
  readonly isencao = signal<IsencaoAnalise | null>(null);

  /** A situação vem do que a análise carregou; antes disso, da linha da fila. */
  readonly situacao = computed(() => {
    const i = this.isencao();
    return i ? situacaoDe(i.status, (i.documentos ?? []).length) : (this.solicitacao()?.situacao ?? null);
  });
  readonly selo = computed(() => {
    const s = this.situacao();
    return s ? SITUACOES[s] : null;
  });
  readonly semDocumentos = computed(() => this.situacao() === 'envio');
  readonly travada = computed(() => this.situacao() === 'concluida');
  readonly editavel = computed(() => this.estadoAnalise() === 'pronto' && !this.travada() && !this.semDocumentos());

  readonly apoio = computed(() => {
    const s = this.solicitacao();
    if (!s) return '';
    const partes = [s.curso, s.candidato.periodoLetivo, s.candidato.datasolicitacao ? `solicitada em ${dataCurta(s.candidato.datasolicitacao)}` : null];
    return partes.filter(Boolean).join(' · ');
  });

  readonly dados = computed(() => {
    const s = this.solicitacao();
    const i = this.isencao();
    return [
      { label: 'Candidato', value: this.nome() },
      ...(i?.cpf ? [{ label: 'CPF', value: formatarCpf(i.cpf) }] : []),
      { label: 'Curso', value: s?.curso ?? null },
      { label: 'Período letivo', value: s?.candidato.periodoLetivo ?? null },
      { label: 'Telefone', value: i?.telefone?.[0] ?? s?.candidato.telefone ?? null },
      { label: 'E-mail', value: i?.email ?? s?.candidato.email ?? null },
      ...(this.travada() ? [{ label: 'Matriz curricular', value: this.codigoMatriz() }] : []),
    ];
  });
  readonly anexos = computed<UcamFile[]>(() =>
    (this.isencao()?.documentos ?? []).map((d) => ({
      id: d.oid,
      nome: `${d.descricao} — ${d.filename}`,
      estado: 'enviado',
      mensagem: `Enviado em ${dataCurta(d.datacriacao)}`,
      url: this.api.enderecoDoDocumento(this.oid(), d.oid),
    })),
  );

  // As decisões.
  readonly disciplinas = signal<DisciplinaEmAnalise[]>([]);
  readonly observacao = signal('');
  readonly periodo = signal(TODOS);
  readonly opcoesPeriodo = computed<UcamOption[]>(() => [
    { value: TODOS, label: 'Todos os períodos' },
    ...[...new Set(this.disciplinas().map((l) => l.periodo))].map((p) => ({ value: p, label: `${p}º período` })),
  ]);
  readonly visiveis = computed(() => this.disciplinas().filter((l) => this.periodo() === TODOS || l.periodo === this.periodo()));
  readonly pedidos = computed(() => this.disciplinas().filter((l) => decisaoDe(l.d) === 'documento'));
  readonly semDecisao = computed(() => this.disciplinas().filter((l) => decisaoDe(l.d) === ''));
  readonly totais = computed(() => {
    const todas = this.disciplinas().map((l) => decisaoDe(l.d));
    const n = (alvo: Decisao) => todas.filter((d) => d === alvo).length;
    const partes = [`${todas.length} disciplinas`];
    if (n('isentar')) partes.push(`${n('isentar')} ${n('isentar') === 1 ? 'isenta' : 'isentas'}`);
    if (n('nao')) partes.push(`${n('nao')} não ${n('nao') === 1 ? 'isenta' : 'isentas'}`);
    if (n('documento')) partes.push(`${n('documento')} aguardando documento`);
    if (n('')) partes.push(`${n('')} sem decisão`);
    return partes.join(' · ');
  });
  readonly rotuloFechar = computed(() => (this.pedidos().length ? 'Enviar pedido ao candidato' : 'Finalizar análise'));

  readonly salvando = signal(false);
  readonly rascunhoSalvoAs = signal<string | null>(null);
  readonly erroAoSalvar = signal(false);
  readonly incompletas = signal(0);
  readonly dialogo = signal<Dialogo | null>(null);
  readonly confirmando = signal(false);
  readonly erroAoConfirmar = signal(false);
  readonly anuncio = signal('');
  /** A análise já foi pedida ao servidor: recarregar a fila não a pede de novo. */
  private aberta = false;

  constructor() {
    void this.store.carregar();

    // A solicitação apareceu na fila: busca as matrizes e, se já há uma escolhida, a análise.
    effect(() => {
      const s = this.solicitacao();
      const oid = this.oid();
      untracked(() => {
        if (!s || this.aberta) return;
        this.aberta = true;
        void this.abrir(oid, s.candidato.codigomatriz ?? null, s.situacao === 'envio');
      });
    });
  }

  private async abrir(oid: string, matrizDaFila: string | null, semDocumentos: boolean): Promise<void> {
    // Sem documento não há o que decidir: a tela mostra o contato, e a matriz fica para depois.
    if (semDocumentos) {
      this.estadoAnalise.set('pronto');
      return;
    }
    try {
      const matrizes = await firstValueFrom(this.api.matrizes(oid));
      this.matrizes.set(matrizes);
      // Como no legado: a matriz já gravada na solicitação, ou a única que existe.
      const escolhida = matrizes.find((m) => m.oidmatriz === matrizDaFila)?.oidmatriz ?? (matrizes.length === 1 ? matrizes[0].oidmatriz : '');
      if (escolhida) await this.trocarMatriz(escolhida);
      else this.estadoAnalise.set('sem-matriz');
    } catch {
      this.estadoAnalise.set('error');
    }
  }

  async trocarMatriz(oidMatriz: string): Promise<void> {
    if (!oidMatriz) return;
    this.matrizOid.set(oidMatriz);
    this.estadoAnalise.set('loading');
    try {
      const isencao = await firstValueFrom(this.api.analise(this.oid(), oidMatriz));
      this.isencao.set(isencao);
      this.observacao.set(isencao.observacao ?? '');
      this.disciplinas.set(
        disciplinasEmOrdem(isencao.semestres).map(({ periodo, disciplina }, n) => ({
          chave: disciplina.oid ?? `${periodo}-${n}`,
          periodo,
          d: { ...disciplina },
          erros: {},
        })),
      );
      this.periodo.set(TODOS);
      this.rascunhoSalvoAs.set(null);
      this.incompletas.set(0);
      this.estadoAnalise.set('pronto');
    } catch {
      this.estadoAnalise.set('error');
    }
  }

  tentarDeNovo(): void {
    const s = this.solicitacao();
    if (this.matrizOid()) void this.trocarMatriz(this.matrizOid());
    else if (s) {
      this.estadoAnalise.set('loading');
      void this.abrir(this.oid(), s.candidato.codigomatriz ?? null, s.situacao === 'envio');
    }
  }

  // ----------------------------------------------------------- por disciplina --

  idDecisao(l: DisciplinaEmAnalise): string {
    return decisaoDe(l.d) || SEM_DECISAO;
  }
  seloDecisao(l: DisciplinaEmAnalise) {
    return DECISOES[decisaoDe(l.d)];
  }
  origem(l: DisciplinaEmAnalise): string {
    return [l.d.descricao, l.d.ies, l.d.cargaHoraria ? `${l.d.cargaHoraria} h` : null].filter(Boolean).join(' · ');
  }

  decidir(l: DisciplinaEmAnalise, id: string): void {
    const d =
      id === 'isentar'
        ? { aceita: 'ACEITO' as const, motivo: null }
        : id === 'nao'
          ? { aceita: 'RECUSADO' as const, motivo: null }
          : id === 'documento'
            ? { aceita: 'PENDENTE' as const, motivo: l.d.motivo ?? '' }
            : // Sem decisão é como o backend devolve a disciplina não avaliada.
              { aceita: 'PENDENTE' as const, motivo: null };
    this.mudar(l, d, true);
    this.anuncio.set(`${l.d.nome}: ${this.opcoesDecisao.find((o) => o.id === id)?.label ?? ''}. ${this.totais()}.`);
  }

  escrever(l: DisciplinaEmAnalise, campo: Campo, valor: string): void {
    this.mudar(l, { [campo]: valor }, false, campo);
  }

  private mudar(l: DisciplinaEmAnalise, parte: Partial<DisciplinaIsencao>, limparErros: boolean, campo?: Campo): void {
    this.disciplinas.update((lista) =>
      lista.map((x) => {
        if (x.chave !== l.chave) return x;
        const erros = limparErros ? {} : { ...x.erros };
        if (campo) delete erros[campo];
        return { ...x, d: { ...x.d, ...parte }, erros };
      }),
    );
  }

  // ----------------------------------------------------------------- gravar --

  private corpo(): IsencaoAnalise {
    const semestres: Semestres = {};
    for (const l of this.disciplinas()) (semestres[l.periodo] ??= []).push(l.d);
    return { ...this.isencao()!, semestres, observacao: this.observacao().trim() || null };
  }

  async salvarRascunho(): Promise<void> {
    if (this.salvando() || !this.editavel()) return;
    this.salvando.set(true);
    this.erroAoSalvar.set(false);
    try {
      await firstValueFrom(this.api.avaliar(this.oid(), this.corpo(), this.matrizOid(), true));
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.rascunhoSalvoAs.set(hora);
      this.anuncio.set(`Rascunho salvo às ${hora}.`);
      void this.store.carregar();
    } catch {
      this.erroAoSalvar.set(true);
    } finally {
      this.salvando.set(false);
    }
  }

  /** O que falta em cada disciplina decidida: a origem de quem é isenta, o pedido de quem espera documento. */
  private conferirCampos(): DisciplinaEmAnalise[] {
    const comErro: DisciplinaEmAnalise[] = [];
    this.disciplinas.update((lista) =>
      lista.map((l) => {
        const erros: Partial<Record<Campo, string>> = {};
        const decisao = decisaoDe(l.d);
        if (decisao === 'isentar') {
          if (!l.d.descricao?.trim()) erros.descricao = 'Falta a disciplina de origem. Escreva o nome como está no histórico.';
          if (!l.d.ies?.trim()) erros.ies = 'Falta a instituição de origem.';
          if (!l.d.cargaHoraria?.trim()) erros.cargaHoraria = 'Falta a carga horária cursada.';
        }
        if (decisao === 'documento' && !l.d.motivo?.trim()) erros.motivo = 'Falta dizer o que o candidato deve enviar.';
        const conferida = { ...l, erros };
        if (Object.keys(erros).length) comErro.push(conferida);
        return conferida;
      }),
    );
    return comErro;
  }

  pedirFechamento(): void {
    if (!this.editavel()) return;
    this.erroAoConfirmar.set(false);
    const faltam = this.semDecisao();
    if (faltam.length) {
      this.dialogo.set({
        tipo: 'faltam',
        titulo: faltam.length === 1 ? 'Falta 1 decisão' : `Faltam ${faltam.length} decisões`,
        texto: `Sem decisão: ${faltam.map((l) => l.d.nome).join(', ')}. Se o que falta é documento do candidato, a decisão é "Pedir documento".`,
      });
      return;
    }
    const comErro = this.conferirCampos();
    this.incompletas.set(comErro.length);
    if (comErro.length) {
      this.anuncio.set(`${comErro.length === 1 ? 'Uma disciplina tem' : comErro.length + ' disciplinas têm'} campo por preencher.`);
      this.irPara(comErro[0], 'input, textarea');
      return;
    }
    const isentas = this.disciplinas().filter((l) => decisaoDe(l.d) === 'isentar').length;
    const total = this.disciplinas().length;
    const pedidos = this.pedidos();
    this.dialogo.set(
      pedidos.length
        ? {
            tipo: 'pedido',
            titulo: 'Enviar pedido ao candidato',
            texto: `${this.nome()} vai ver o que falta para ${pedidos.map((l) => l.d.nome).join(', ')}. A solicitação fica aguardando o candidato, e as decisões já tomadas ficam gravadas.`,
          }
        : {
            tipo: 'finalizar',
            titulo: 'Finalizar análise',
            texto: `Finalizar a análise de ${this.nome()} com ${isentas} de ${total} disciplinas isentas e ${total - isentas} não isentas? Concluída, a análise não pode mais ser alterada por esta tela.`,
          },
    );
  }

  dialogoMudou(aberto: boolean): void {
    if (!aberto && !this.confirmando()) this.dialogo.set(null);
  }

  irParaPrimeira(): void {
    const primeira = this.semDecisao()[0];
    this.dialogo.set(null);
    if (primeira) this.irPara(primeira, 'button');
  }

  /** Mostra a disciplina (o filtro de período pode estar escondendo) e leva o foco a ela. */
  private irPara(l: DisciplinaEmAnalise, alvo: string): void {
    this.periodo.set(TODOS);
    setTimeout(() => {
      const bloco = this.el.nativeElement.querySelector(`[data-disciplina="${l.chave}"]`);
      (bloco?.querySelector<HTMLElement>(`[aria-invalid="true"]`) ?? bloco?.querySelector<HTMLElement>(alvo))?.focus();
      bloco?.scrollIntoView?.({ block: 'center' });
    });
  }

  async confirmar(): Promise<void> {
    const d = this.dialogo();
    if (!d || d.tipo === 'faltam' || this.confirmando()) return;
    this.confirmando.set(true);
    this.erroAoConfirmar.set(false);
    try {
      await firstValueFrom(this.api.avaliar(this.oid(), this.corpo(), this.matrizOid(), false));
      this.dialogo.set(null);
      this.anuncio.set(d.tipo === 'pedido' ? 'Pedido enviado. A solicitação aguarda o candidato.' : 'Análise concluída.');
      await Promise.all([this.store.carregar(), this.trocarMatriz(this.matrizOid())]);
    } catch {
      this.erroAoConfirmar.set(true);
    } finally {
      this.confirmando.set(false);
    }
  }
}
