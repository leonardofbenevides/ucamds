import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  UcamAlert,
  UcamBadge,
  UcamButton,
  UcamChip,
  UcamCitacao,
  UcamDescriptionList,
  UcamDrawer,
  UcamEmptyState,
  UcamListItem,
  UcamOption,
  UcamPageHeader,
  UcamSectionBar,
  UcamSelect,
  UcamSkeleton,
  UcamTabItem,
  UcamTabs,
  UcamTextField,
} from '@ucam/ui';
import { firstValueFrom, map } from 'rxjs';
import { formatarCpf, nomeCurso, nomeTurno } from '../../core/store/candidato.store';
import { contarCaracteres, htmlParaTexto } from '../../core/store/prova.store';
import { BancaApi, FormaIngresso, PeriodoIngresso, RecorteFila, RedacaoNaFila, RespostaRedacao } from '../banca.api';
import { MolduraBanca } from '../moldura-banca';
import { escreverNota, lerNota } from '../nota';

export type Recorte = 'espera' | 'corrigidas';
type Estado = 'loading' | 'pronto' | 'error';

const TAMANHO_PAGINA = 20;
const ESPERA_DA_BUSCA = 300;

/** Há quanto tempo a prova foi entregue, em palavra: a data exata vai no datetime e no detalhe. */
export function quandoFoi(iso: string, agora = new Date()): string {
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(new Date(iso))) / 864e5);
  if (dias <= 0) return 'hoje';
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/**
 * A fila da banca: as redações em espera e as já corrigidas, com a redação
 * aberta ao lado (padrão triagem-lista-detalhe). Dar a nota não troca de tela
 * nem perde a posição: a próxima da fila abre no mesmo painel.
 *
 * O que vem do legado (`admin/correcao/redacao`): os dois recortes, o período
 * e a forma de ingresso como escopo obrigatório da consulta, a nota de 0 a 10
 * de meio em meio ponto, e poder regravar a nota de uma redação já corrigida.
 */
@Component({
  selector: 'app-correcao',
  imports: [
    MolduraBanca,
    UcamAlert,
    UcamBadge,
    UcamButton,
    UcamChip,
    UcamCitacao,
    UcamDescriptionList,
    UcamDrawer,
    UcamEmptyState,
    UcamListItem,
    UcamPageHeader,
    UcamSectionBar,
    UcamSelect,
    UcamSkeleton,
    UcamTabs,
    UcamTextField,
  ],
  templateUrl: './correcao.html',
})
export class CorrecaoPage {
  private readonly api = inject(BancaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  readonly trilha = [{ label: 'Correção' }, { label: 'Redações' }];

  // O escopo da consulta: período e forma de ingresso, que o legado exige.
  private readonly periodos = signal<PeriodoIngresso[]>([]);
  private readonly formas = signal<FormaIngresso[]>([]);
  readonly periodoOid = signal('');
  readonly formaOid = signal('');
  readonly opcoesPeriodo = computed<UcamOption[]>(() => this.periodos().map((p) => ({ value: p.oid, label: p.rotulo })));
  readonly opcoesForma = computed<UcamOption[]>(() => this.formas().map((f) => ({ value: f.oid, label: f.descricao })));
  readonly periodoAtual = computed(() => this.periodos().find((p) => p.oid === this.periodoOid())?.rotulo ?? null);
  readonly formaAtual = computed(() => this.formas().find((f) => f.oid === this.formaOid())?.descricao ?? null);
  readonly filtrosAbertos = signal(false);

  /** O que está no campo, e o termo que a consulta já usa (a busca espera a pessoa parar de digitar). */
  readonly busca = signal('');
  readonly termo = signal('');

  readonly recorte = signal<Recorte>('espera');
  readonly estado = signal<Estado>('loading');
  readonly espera = signal<RedacaoNaFila[]>([]);
  readonly corrigidas = signal<RedacaoNaFila[]>([]);
  readonly totalEspera = signal(0);
  readonly totalCorrigidas = signal(0);
  readonly buscandoMais = signal(false);

  readonly abas = computed<UcamTabItem[]>(() => [
    { id: 'espera', label: 'Em espera', count: this.totalEspera() },
    { id: 'corrigidas', label: 'Corrigidas', count: this.totalCorrigidas() },
  ]);
  readonly fila = computed(() => (this.recorte() === 'espera' ? this.espera() : this.corrigidas()));
  readonly totalDoRecorte = computed(() => (this.recorte() === 'espera' ? this.totalEspera() : this.totalCorrigidas()));
  readonly temMais = computed(() => this.fila().length < this.totalDoRecorte());
  readonly nomeDoRecorte = computed(() => (this.recorte() === 'espera' ? 'Em espera' : 'Corrigidas'));

  /** A redação pedida pela URL (?redacao=). Sem ela, abre a primeira da fila. */
  private readonly pedida = toSignal(this.route.queryParamMap.pipe(map((m) => m.get('redacao'))), {
    initialValue: this.route.snapshot.queryParamMap.get('redacao'),
  });
  readonly aberta = computed<RedacaoNaFila | null>(() => {
    const oid = this.pedida();
    if (!oid) return this.fila()[0] ?? null;
    return [...this.espera(), ...this.corrigidas()].find((r) => r.oid === oid) ?? null;
  });
  /** Em tela estreita só um painel aparece: o detalhe quando a pessoa abriu uma redação, a lista no resto. */
  readonly painel = computed(() => (this.pedida() ? 'detalhe' : 'lista'));
  readonly corrigida = computed(() => this.aberta()?.situacao === 'PROVA_CORRIGIDA');
  /** Quem chega por um link de redação já corrigida vê a aba dela, não a fila em espera com um detalhe órfão. Uma vez só. */
  private recorteAcertado = false;

  readonly estadoTexto = signal<Estado>('loading');
  readonly resposta = signal<RespostaRedacao | null>(null);
  readonly caracteres = computed(() => contarCaracteres(htmlParaTexto(this.resposta()?.respostaTextual ?? '')));
  readonly contagemTexto = computed(() => `${this.caracteres().toLocaleString('pt-BR')} caracteres`);

  readonly dados = computed(() => {
    const r = this.aberta();
    if (!r) return [];
    const p = r.formaingressopessoa;
    const feita = r.dataprova ?? r.horariofim;
    return [
      { label: 'CPF', value: formatarCpf(p.pessoa.cpf.numero) },
      { label: 'Curso', value: nomeCurso(p.periodounidadecurso.unidadecurso.curso.nome) },
      { label: 'Turno', value: nomeTurno(p.periodounidadecurso.turnoLabel) },
      {
        label: 'Prova feita em',
        value: feita
          ? new Date(feita).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : null,
      },
    ];
  });

  readonly nota = signal('');
  readonly erroNota = signal<string | null>(null);
  readonly salvando = signal(false);
  readonly erroAoSalvar = signal(false);
  /** O que acabou de acontecer, para quem ouve a tela. */
  readonly anuncio = signal('');

  constructor() {
    this.carregarEscopo();

    // A busca só vira consulta quando a pessoa para de digitar.
    effect((limpar) => {
      const t = this.busca().trim();
      const timer = setTimeout(() => this.termo.set(t), ESPERA_DA_BUSCA);
      limpar(() => clearTimeout(timer));
    });

    // Mudou o escopo ou o termo: as duas filas são consultadas de novo.
    effect(() => {
      const recorte = this.recorteDaConsulta();
      if (recorte) untracked(() => void this.carregarFilas(recorte));
    });

    // Mudou a redação aberta: busca o texto dela e repõe a nota já dada.
    effect(() => {
      const oid = this.aberta()?.oid;
      untracked(() => void this.carregarTexto(oid ?? null));
    });
  }

  private readonly recorteDaConsulta = computed<RecorteFila | null>(() => {
    const periodo = this.periodos().find((p) => p.oid === this.periodoOid());
    const forma = this.formas().find((f) => f.oid === this.formaOid());
    return periodo && forma ? { periodo, forma, pesquisa: this.termo(), pagina: 0, tamanho: TAMANHO_PAGINA } : null;
  });

  private async carregarEscopo(): Promise<void> {
    try {
      const [periodos, formas] = await Promise.all([firstValueFrom(this.api.periodos()), firstValueFrom(this.api.formas())]);
      this.periodos.set(periodos);
      this.formas.set(formas);
      this.periodoOid.set(periodos[0]?.oid ?? '');
      this.formaOid.set(formas[0]?.oid ?? '');
      // Sem período ou forma com prova online não há o que consultar: a fila é vazia, não um erro.
      if (!periodos.length || !formas.length) this.estado.set('pronto');
    } catch {
      this.estado.set('error');
    }
  }

  private async carregarFilas(recorte: RecorteFila, silencioso = false): Promise<void> {
    if (!silencioso) this.estado.set('loading');
    try {
      const [espera, corrigidas] = await Promise.all([
        firstValueFrom(this.api.emEspera(recorte)),
        firstValueFrom(this.api.corrigidas(recorte)),
      ]);
      this.espera.set(espera.content ?? []);
      this.totalEspera.set(espera.totalElements ?? 0);
      this.corrigidas.set(corrigidas.content ?? []);
      this.totalCorrigidas.set(corrigidas.totalElements ?? 0);
      if (!this.recorteAcertado) {
        this.recorteAcertado = true;
        const pedida = this.pedida();
        if (pedida && this.corrigidas().some((r) => r.oid === pedida) && !this.espera().some((r) => r.oid === pedida)) {
          this.recorte.set('corrigidas');
        }
      }
      this.estado.set('pronto');
    } catch {
      this.estado.set('error');
    }
  }

  recarregar(): void {
    const recorte = this.recorteDaConsulta();
    if (recorte) void this.carregarFilas(recorte);
    else void this.carregarEscopo();
  }

  async mostrarMais(): Promise<void> {
    const recorte = this.recorteDaConsulta();
    if (!recorte || this.buscandoMais()) return;
    const emEspera = this.recorte() === 'espera';
    const lista = emEspera ? this.espera : this.corrigidas;
    const pagina = { ...recorte, pagina: Math.floor(lista().length / TAMANHO_PAGINA) };
    this.buscandoMais.set(true);
    try {
      const mais = await firstValueFrom(emEspera ? this.api.emEspera(pagina) : this.api.corrigidas(pagina));
      const novos = (mais.content ?? []).filter((r) => !lista().some((x) => x.oid === r.oid));
      lista.update((l) => [...l, ...novos]);
    } catch {
      this.anuncio.set('Não foi possível buscar mais redações. Tente de novo.');
    } finally {
      this.buscandoMais.set(false);
    }
  }

  private async carregarTexto(oid: string | null): Promise<void> {
    this.erroNota.set(null);
    this.erroAoSalvar.set(false);
    const nota = this.aberta()?.formaingressopessoa.notaredacao;
    this.nota.set(nota === null || nota === undefined ? '' : escreverNota(nota));
    this.resposta.set(null);
    if (!oid) return;
    this.estadoTexto.set('loading');
    try {
      const r = await firstValueFrom(this.api.texto(oid));
      // A pessoa pode ter aberto outra redação enquanto esta chegava.
      if (this.aberta()?.oid !== oid) return;
      this.resposta.set(r);
      this.estadoTexto.set('pronto');
    } catch {
      if (this.aberta()?.oid === oid) this.estadoTexto.set('error');
    }
  }

  tentarTextoDeNovo(): void {
    void this.carregarTexto(this.aberta()?.oid ?? null);
  }

  trocarRecorte(id: string): void {
    this.recorte.set(id === 'corrigidas' ? 'corrigidas' : 'espera');
    // A redação aberta era do outro recorte: o painel volta a mostrar a primeira deste.
    if (this.pedida()) this.irPara(null);
  }

  limparBusca(): void {
    this.busca.set('');
  }

  abrir(r: RedacaoNaFila): void {
    this.irPara(r.oid);
    // Trocar de registro leva o foco ao título do detalhe (padrão triagem).
    setTimeout(() => this.titulo()?.nativeElement.focus());
  }

  voltarParaFila(): void {
    this.irPara(null);
  }

  private irPara(oid: string | null): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { redacao: oid }, queryParamsHandling: 'merge' });
  }

  // Apresentação de uma linha da fila.
  nome(r: RedacaoNaFila): string {
    return r.formaingressopessoa.pessoa.nome;
  }
  apoio(r: RedacaoNaFila): string {
    const p = r.formaingressopessoa.periodounidadecurso;
    return [nomeCurso(p.unidadecurso.curso.nome), nomeTurno(p.turnoLabel)].filter(Boolean).join(' · ');
  }
  feita(r: RedacaoNaFila): string | null {
    return r.dataprova ?? r.horariofim ?? null;
  }
  quando(r: RedacaoNaFila): string | null {
    const f = this.feita(r);
    return f ? quandoFoi(f) : null;
  }
  rotuloNota(r: RedacaoNaFila): string | null {
    const n = r.formaingressopessoa.notaredacao;
    return n === null || n === undefined ? null : `Nota ${escreverNota(n)}`;
  }

  async salvar(evento?: Event): Promise<void> {
    evento?.preventDefault();
    const r = this.aberta();
    if (!r || this.salvando()) return;
    const nota = lerNota(this.nota());
    if (nota === null) {
      this.erroNota.set(
        this.nota().trim()
          ? 'Nota fora da escala. Use um valor de 0 a 10, de meio em meio ponto: 7 ou 7,5.'
          : 'Falta a nota. Informe um valor de 0 a 10, de meio em meio ponto.',
      );
      return;
    }
    this.erroNota.set(null);
    this.erroAoSalvar.set(false);
    this.salvando.set(true);
    try {
      await firstValueFrom(this.api.darNota(r.oid, nota));
    } catch {
      this.erroAoSalvar.set(true);
      this.salvando.set(false);
      return;
    }
    // Quem estava em espera sai da fila, e a seguinte abre no mesmo painel.
    const eraEspera = this.espera().some((x) => x.oid === r.oid);
    const i = this.espera().findIndex((x) => x.oid === r.oid);
    const seguinte = eraEspera ? (this.espera()[i + 1] ?? this.espera()[i - 1] ?? null) : r;
    const recorte = this.recorteDaConsulta();
    if (recorte) await this.carregarFilas(recorte, true);
    this.salvando.set(false);
    this.anuncio.set(
      `Nota ${escreverNota(nota)} gravada para ${this.nome(r)}.` +
        (eraEspera ? (seguinte ? ` Aberta a redação de ${this.nome(seguinte)}.` : ' Não há mais redações em espera.') : ''),
    );
    if (eraEspera) {
      this.irPara(seguinte?.oid ?? null);
      setTimeout(() => this.titulo()?.nativeElement.focus());
    }
  }
}
