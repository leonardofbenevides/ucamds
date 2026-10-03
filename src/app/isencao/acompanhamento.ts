import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import {
  UcamAlert,
  UcamAnexo,
  UcamBadge,
  UcamButton,
  UcamCelula,
  UcamColumnDef,
  UcamDataTable,
  UcamDialog,
  UcamEmptyState,
  UcamFile,
  UcamFileField,
  UcamOption,
  UcamPageHeader,
  UcamSectionBar,
  UcamSelect,
  UcamSkeleton,
  UcamTextField,
} from '@ucam/ui';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { nomeCurso } from '../core/store/candidato.store';
import { IsencaoApi } from './isencao.api';
import { MolduraIsencao } from './moldura-isencao';
import { IsencaoCandidato, SITUACOES, dataCurta, decisaoDe, disciplinasEmOrdem, situacaoDaDisciplina, situacaoDe } from './isencao.model';

type Estado = 'loading' | 'pronto' | 'error';
const TODOS = 'todos';

/**
 * O candidato acompanha a isenção de disciplinas: em que pé está, o que a
 * coordenação pediu, os documentos que já mandou e a situação de cada
 * disciplina. É a rota `isencao/:oid` do legado, com o desenho de
 * `isencao/acompanhamento` e `isencao/resultado` do DS.
 */
@Component({
  selector: 'app-acompanhamento-isencao',
  imports: [
    MolduraIsencao,
    UcamAlert,
    UcamAnexo,
    UcamBadge,
    UcamButton,
    UcamCelula,
    UcamDataTable,
    UcamDialog,
    UcamEmptyState,
    UcamFileField,
    UcamPageHeader,
    UcamSectionBar,
    UcamSelect,
    UcamSkeleton,
    UcamTextField,
  ],
  templateUrl: './acompanhamento.html',
})
export class AcompanhamentoIsencaoPage {
  /** O oid da inscrição, da rota: o mesmo do link que o candidato recebe. */
  readonly oid = input.required<string>();

  private readonly api = inject(IsencaoApi);
  readonly contato = environment.contatoSecretaria;
  readonly inicio = computed(() => `/isencao/${this.oid()}`);
  readonly trilha = [{ label: 'Isenção de disciplinas' }];

  readonly estado = signal<Estado>('loading');
  readonly isencao = signal<IsencaoCandidato | null>(null);
  readonly anuncio = signal('');

  readonly documentos = computed(() => this.isencao()?.documentos ?? []);
  readonly anexos = computed<UcamFile[]>(() =>
    this.documentos().map((d) => ({
      id: d.oid,
      nome: `${d.descricao} — ${d.filename}`,
      estado: 'enviado',
      mensagem: `Enviado em ${dataCurta(d.datacriacao)}`,
      url: this.api.enderecoDoDocumento(this.oid(), d.oid),
    })),
  );
  readonly situacao = computed(() => {
    const i = this.isencao();
    return i ? situacaoDe(i.status, this.documentos().length) : null;
  });
  readonly selo = computed(() => {
    const s = this.situacao();
    return s ? SITUACOES[s] : null;
  });
  readonly curso = computed(() => nomeCurso(this.isencao()?.curso ?? ''));
  readonly observacao = computed(() => this.isencao()?.observacao?.trim() || null);
  /** Como no legado: dá para mandar documento até a análise ser concluída. */
  readonly podeEnviar = computed(() => !!this.situacao() && this.situacao() !== 'concluida');

  // As disciplinas, com o filtro de período.
  private readonly emOrdem = computed(() => disciplinasEmOrdem(this.isencao()?.semestres));
  readonly periodo = signal(TODOS);
  readonly opcoesPeriodo = computed<UcamOption[]>(() => [
    { value: TODOS, label: 'Todos os períodos' },
    ...[...new Set(this.emOrdem().map((d) => d.periodo))].map((p) => ({ value: p, label: `${p}º período` })),
  ]);
  readonly colunas: UcamColumnDef[] = [
    { key: 'nome', header: 'Disciplina', priority: 3 },
    { key: 'periodo', header: 'Período', width: 'min', priority: 1 },
    { key: 'situacao', header: 'Situação', type: 'status', width: 'min', priority: 2 },
  ];
  readonly linhas = computed(() =>
    this.emOrdem()
      .filter((d) => this.periodo() === TODOS || d.periodo === this.periodo())
      .map(({ periodo, disciplina }) => ({
        nome: disciplina.nome,
        periodo: `${periodo}º`,
        situacao: situacaoDaDisciplina(disciplina),
        // O que a coordenação pediu para esta disciplina.
        pedido: decisaoDe(disciplina) === 'documento' ? (disciplina.motivo ?? '').trim() : '',
      })),
  );
  readonly totais = computed(() => {
    const todas = this.emOrdem().map((d) => decisaoDe(d.disciplina));
    const n = (alvo: string) => todas.filter((d) => d === alvo).length;
    const partes = [`${todas.length} disciplinas`];
    if (n('isentar')) partes.push(`${n('isentar')} ${n('isentar') === 1 ? 'isenta' : 'isentas'}`);
    if (n('nao')) partes.push(`${n('nao')} não ${n('nao') === 1 ? 'isenta' : 'isentas'}`);
    if (n('documento')) partes.push(`${n('documento')} aguardando documento`);
    if (n('')) partes.push(`${n('')} em análise`);
    return partes.join(' · ');
  });
  readonly resultado = computed(() => {
    const todas = this.emOrdem();
    const isentas = todas.filter((d) => decisaoDe(d.disciplina) === 'isentar').length;
    return `${isentas} de ${todas.length} disciplinas isentas.`;
  });

  // O envio de documento.
  readonly enviando = signal(false);
  readonly descricao = signal('');
  readonly arquivos = signal<UcamFile[]>([]);
  readonly erroDescricao = signal<string | null>(null);
  readonly erroArquivo = signal<string | null>(null);
  readonly enviandoEmCurso = signal(false);
  readonly erroAoEnviar = signal(false);

  constructor() {
    effect(() => {
      const oid = this.oid();
      untracked(() => void this.carregar(oid));
    });
  }

  private async carregar(oid: string): Promise<void> {
    this.estado.set('loading');
    try {
      this.isencao.set(await firstValueFrom(this.api.doCandidato(oid)));
      this.estado.set('pronto');
    } catch {
      this.estado.set('error');
    }
  }

  recarregar(): void {
    void this.carregar(this.oid());
  }

  abrirEnvio(): void {
    this.descricao.set('');
    this.arquivos.set([]);
    this.erroDescricao.set(null);
    this.erroArquivo.set(null);
    this.erroAoEnviar.set(false);
    this.enviando.set(true);
  }

  dialogoMudou(aberto: boolean): void {
    if (!this.enviandoEmCurso()) this.enviando.set(aberto);
  }

  async enviar(): Promise<void> {
    if (this.enviandoEmCurso()) return;
    const descricao = this.descricao().trim();
    // O File vem no próprio modelo do campo (UcamFile.file, DS 0.1.2).
    const arquivo = this.arquivos().find((f) => f.estado === 'pendente')?.file ?? undefined;
    this.erroDescricao.set(descricao ? null : 'Falta a descrição. Diga o que é o arquivo: histórico, ementas, declaração.');
    this.erroArquivo.set(arquivo ? null : 'Falta o arquivo. Escolha o documento que vai enviar.');
    if (!descricao || !arquivo) return;

    this.enviandoEmCurso.set(true);
    this.erroAoEnviar.set(false);
    try {
      this.isencao.set(await firstValueFrom(this.api.enviarDocumento(this.oid(), arquivo, descricao)));
      this.enviando.set(false);
      this.arquivos.set([]);
      this.anuncio.set(`Documento ${descricao} enviado. A coordenação vai analisar.`);
    } catch {
      this.erroAoEnviar.set(true);
    } finally {
      this.enviandoEmCurso.set(false);
    }
  }
}
